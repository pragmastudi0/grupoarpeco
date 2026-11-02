import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

/**
 * Función de servidor (Vercel Node) — Consultas del formulario web público.
 *
 * Recibe el formulario de presupuestos del sitio (arpeco-web) y registra la
 * consulta en el CRM como una OPORTUNIDAD "Nueva" pendiente de contactar.
 *
 * Reglas:
 *  - Endpoint PÚBLICO (tráfico anónimo del sitio). El anon de Supabase está
 *    revocado de `opportunities`, así que la inserción corre con service_role,
 *    igual que api/invite.ts. El service_role vive SOLO en el servidor.
 *  - La consulta entra como prospecto (fair_prospects) colgado de una feria
 *    centinela "Consultas Web" + una oportunidad stage='new', source='web',
 *    a nombre del usuario Dirección (INBOUND_OWNER_ID). Todo el detalle del
 *    formulario queda en un seguimiento (followups).
 *  - Anti-spam: honeypot `_hp` (debe venir vacío) + validación estricta (zod).
 *
 * Variables de entorno requeridas (sólo servidor):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, INBOUND_OWNER_ID, WEB_ORIGIN
 */

const SENTINEL_FAIR = 'Consultas Web'

const bodySchema = z.object({
  nombre: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(150),
  tel: z.string().trim().min(6).max(30),
  empresa: z.string().trim().max(120).optional().default(''),
  tipo: z.enum(['stand', 'local', 'interior', 'residencial']).optional(),
  evento: z.string().trim().max(150).optional().default(''),
  fecha: z.string().trim().max(20).optional().default(''),
  m2: z.string().trim().max(60).optional().default(''),
  ciudad: z.string().trim().max(120).optional().default(''),
  mensaje: z.string().trim().max(1000).optional().default(''),
  // Honeypot: los bots suelen rellenarlo; los humanos no lo ven.
  _hp: z.string().optional().default(''),
})

const TIPO_LABEL: Record<string, string> = {
  stand: 'Stand para feria',
  local: 'Local comercial',
  interior: 'Interiores',
  residencial: 'Residencial',
}

/** Equivalente en JS de public.normalize_name (unaccent + trim + colapsar espacios + lower). */
function normalizeName(p: string): string {
  return p
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

function cors(origin: string | undefined): Record<string, string> {
  return {
    'access-control-allow-origin': origin || '*',
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'access-control-max-age': '86400',
    vary: 'Origin',
  }
}

function json(data: unknown, status: number, headers: Record<string, string>): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  })
}

export default async function handler(req: Request): Promise<Response> {
  const webOrigin = process.env.WEB_ORIGIN
  const corsHeaders = cors(webOrigin)

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405, corsHeaders)

  const url = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const ownerId = process.env.INBOUND_OWNER_ID
  if (!url || !serviceKey || !ownerId) return json({ error: 'server_misconfigured' }, 500, corsHeaders)

  // 1) Validación de entrada.
  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return json({ error: 'invalid_body' }, 400, corsHeaders)
  const f = parsed.data

  // 2) Honeypot: si viene relleno, respondemos ok sin registrar nada.
  if (f._hp.trim() !== '') return json({ ok: true }, 200, corsHeaders)

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const today = new Date().toISOString().slice(0, 10)
  const companyName = f.empresa || f.nombre
  const nameKey = normalizeName(companyName)

  // 3) Feria centinela "Consultas Web" (idempotente).
  let fairId: string | undefined
  {
    const { data: fair } = await admin
      .from('fairs')
      .select('id')
      .eq('name', SENTINEL_FAIR)
      .limit(1)
      .maybeSingle()
    if (fair) {
      fairId = fair.id
    } else {
      const { data: created, error } = await admin
        .from('fairs')
        .insert({ name: SENTINEL_FAIR, starts_on: today, description: 'Consultas entrantes del formulario web.' })
        .select('id')
        .single()
      if (error || !created) {
        // Posible carrera: otro request la creó. Reintentar la lectura.
        const { data: again } = await admin
          .from('fairs')
          .select('id')
          .eq('name', SENTINEL_FAIR)
          .limit(1)
          .maybeSingle()
        if (!again) return json({ error: 'fair_resolve_failed' }, 500, corsHeaders)
        fairId = again.id
      } else {
        fairId = created.id
      }
    }
  }

  // 4) Prospecto: reutilizar el existente (dedup por feria+nombre) o crearlo.
  let prospectId: string | undefined
  {
    const { data: existing } = await admin
      .from('fair_prospects')
      .select('id')
      .eq('fair_id', fairId)
      .eq('name_key', nameKey)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle()
    if (existing) {
      prospectId = existing.id
    } else {
      const { data: created, error } = await admin
        .from('fair_prospects')
        .insert({
          fair_id: fairId,
          company_name: companyName,
          contact_name: f.nombre,
          phone: f.tel,
          email: f.email,
          owner_id: ownerId,
          status: 'active',
          source: 'web',
        })
        .select('id')
        .single()
      if (error || !created) {
        // Carrera contra el índice único parcial (fair_id, name_key) where active.
        const { data: again } = await admin
          .from('fair_prospects')
          .select('id')
          .eq('fair_id', fairId)
          .eq('name_key', nameKey)
          .eq('status', 'active')
          .limit(1)
          .maybeSingle()
        if (!again) return json({ error: 'prospect_create_failed' }, 500, corsHeaders)
        prospectId = again.id
      } else {
        prospectId = created.id
      }
    }
  }

  // 5) Oportunidad "Nueva" marcada como origen web, pendiente de contactar hoy.
  const tipoLabel = f.tipo ? TIPO_LABEL[f.tipo] : 'Consulta general'
  const { data: opp, error: oppErr } = await admin
    .from('opportunities')
    .insert({
      title: `Consulta web – ${tipoLabel} – ${f.nombre}`,
      owner_id: ownerId,
      prospect_id: prospectId,
      origin_fair_id: fairId,
      stage: 'new',
      source: 'web',
      next_followup_on: today,
      estimated_amount: null,
    })
    .select('id')
    .single()
  if (oppErr || !opp) return json({ error: 'opportunity_create_failed' }, 500, corsHeaders)

  // 6) Seguimiento con TODO el detalle del formulario (nada se pierde).
  const detalle: string[] = [
    `Proyecto: ${tipoLabel}`,
    `Nombre: ${f.nombre}`,
    `Email: ${f.email}`,
    `Teléfono: ${f.tel}`,
  ]
  const extra: Array<[string, string]> = [
    ['Empresa o marca', f.empresa],
    ['Feria o evento', f.evento],
    ['Fecha estimada', f.fecha],
    ['Superficie', f.m2],
    ['Ciudad', f.ciudad],
    ['Detalles', f.mensaje],
  ]
  for (const [etiqueta, valor] of extra) {
    if (valor) detalle.push(`${etiqueta}: ${valor}`)
  }
  await admin.from('followups').insert({
    opportunity_id: opp.id,
    owner_id: ownerId,
    kind: 'web',
    summary: `Consulta recibida por el formulario web.\n\n${detalle.join('\n')}`,
    next_on: today,
    status: 'active',
  })

  return json({ ok: true }, 200, corsHeaders)
}
