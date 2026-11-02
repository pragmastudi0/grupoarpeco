import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

/**
 * Función de servidor (Vercel Node) — Invitación de usuarios (B04).
 *
 * Reglas (docs/04_ROLES_PERMISOS.md):
 *  - Sin autorregistro: sólo un usuario Dirección ACTIVO puede invitar.
 *  - El service_role vive SOLO aquí (sin prefijo VITE_, nunca en el bundle).
 *  - Crea la invitación en Auth, el perfil nace inactivo (trigger) y se asigna
 *    el rol aprobado. La activación real ocurre al aceptar la invitación.
 *  - Todo queda auditado en audit_events.
 *
 * Variables de entorno requeridas (sólo servidor):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, APP_ORIGIN
 */

const bodySchema = z.object({
  email: z.string().email(),
  display_name: z.string().min(1).max(120),
  role: z.enum(['direction', 'administration', 'seller', 'execution', 'support']),
  // Segunda aprobación para roles de alto privilegio (D03).
  second_approver: z.string().uuid().optional(),
})

const HIGH_PRIVILEGE = new Set(['direction', 'support'])

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  const url = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const appOrigin = process.env.APP_ORIGIN
  if (!url || !serviceKey || !appOrigin) return json({ error: 'server_misconfigured' }, 500)

  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return json({ error: 'unauthorized' }, 401)

  // 1) Cliente con el JWT del solicitante: valida identidad y rol vía RLS/RPC.
  const asCaller = createClient(url, serviceKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: caller } = await asCaller.auth.getUser(token)
  if (!caller.user) return json({ error: 'unauthorized' }, 401)

  const { data: isDirection, error: roleErr } = await asCaller.rpc('is_direction')
  if (roleErr) return json({ error: 'role_check_failed' }, 500)
  if (!isDirection) return json({ error: 'forbidden' }, 403)

  // 2) Validación de entrada.
  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return json({ error: 'invalid_body', detail: parsed.error.issues }, 400)
  const { email, display_name, role, second_approver } = parsed.data

  if (HIGH_PRIVILEGE.has(role) && (!second_approver || second_approver === caller.user.id)) {
    return json({ error: 'second_approver_required' }, 400)
  }

  // 3) Operación privilegiada con service_role.
  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: invited, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { display_name },
    redirectTo: appOrigin,
  })
  if (inviteErr || !invited.user) {
    return json({ error: 'invite_failed', detail: inviteErr?.message }, 400)
  }
  const newUserId = invited.user.id

  // Asegura el perfil (el trigger ya debería haberlo creado, inactivo).
  await admin
    .from('profiles')
    .upsert({ id: newUserId, email, display_name, active: false }, { onConflict: 'id' })

  const { error: roleInsertErr } = await admin
    .from('user_roles')
    .upsert(
      { user_id: newUserId, role_code: role, granted_by: caller.user.id },
      { onConflict: 'user_id,role_code' },
    )
  if (roleInsertErr) return json({ error: 'role_assign_failed', detail: roleInsertErr.message }, 500)

  await admin.from('audit_events').insert({
    entity_type: 'profiles',
    entity_id: newUserId,
    action: 'invite_user',
    actor_id: caller.user.id,
    after_data: { email, role, second_approver: second_approver ?? null },
    reason: 'Invitación desde panel',
  })

  return json({ ok: true, user_id: newUserId })
}
