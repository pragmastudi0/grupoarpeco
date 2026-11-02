import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { RoleCode } from '@/shared/auth/roles'
import { supabase } from '@/shared/supabase/client'
import { AuthContext, type AuthProfile, type AuthState } from './auth-context'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [booted, setBooted] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<AuthProfile | null>(null)
  const [roles, setRoles] = useState<RoleCode[]>([])
  const [permissions, setPermissions] = useState<string[]>([])
  const [fetchedFor, setFetchedFor] = useState<string | null>(null)

  // Suscripción a la sesión. IMPORTANTE: el callback sólo actualiza la sesión de
  // forma síncrona; NO hace await de llamadas a Supabase aquí (evita el deadlock
  // conocido del lock de Auth). La carga de perfil/roles vive en un efecto aparte.
  useEffect(() => {
    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setBooted(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })
    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const userId = session?.user.id ?? null

  const loadProfile = useCallback(async (id: string) => {
    // En desarrollo local puede aparecer el error transitorio "JWT issued at
    // future" por un skew de reloj del contenedor Docker justo tras el login.
    // Reintentamos brevemente; en producción (NTP) no ocurre y es inocuo.
    let lastErr: unknown = null
    for (let attempt = 0; attempt < 3; attempt++) {
      const [profileRes, rolesRes, permsRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, display_name, email, active')
          .eq('id', id)
          .maybeSingle(),
        supabase.from('user_roles').select('role_code').eq('user_id', id),
        supabase.rpc('my_permissions'),
      ])
      if (!profileRes.error && !rolesRes.error && !permsRes.error) {
        setProfile(profileRes.data ?? null)
        setRoles((rolesRes.data ?? []).map((r) => r.role_code as RoleCode))
        setPermissions((permsRes.data ?? []) as string[])
        setFetchedFor(id)
        return
      }
      lastErr = profileRes.error ?? rolesRes.error ?? permsRes.error
      await new Promise((r) => setTimeout(r, 200 * (attempt + 1)))
    }
    throw lastErr
  }, [])

  // Carga de perfil/roles cuando cambia el usuario autenticado.
  useEffect(() => {
    let active = true
    if (!userId) {
      setProfile(null)
      setRoles([])
      setPermissions([])
      setFetchedFor(null)
      return
    }
    void loadProfile(userId).catch(() => {
      if (active) setFetchedFor(userId) // evita loading infinito ante error
    })
    return () => {
      active = false
    }
  }, [userId, loadProfile])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const refresh = useCallback(async () => {
    if (userId) await loadProfile(userId)
  }, [userId, loadProfile])

  const value = useMemo<AuthState>(() => {
    const isAuthenticated = Boolean(session)
    // Cargando mientras no botó la sesión inicial, o mientras no se resolvió el
    // perfil del usuario actual.
    const loading = !booted || (isAuthenticated && fetchedFor !== userId)
    const isActive = isAuthenticated && Boolean(profile?.active)
    return {
      loading,
      session,
      user: session?.user ?? null,
      profile,
      roles,
      permissions,
      isAuthenticated,
      isActive,
      hasRole: (role: RoleCode) => isActive && roles.includes(role),
      can: (permission: string) => isActive && permissions.includes(permission),
      signIn,
      signOut,
      refresh,
    }
  }, [booted, session, userId, fetchedFor, profile, roles, permissions, signIn, signOut, refresh])

  return <AuthContext value={value}>{children}</AuthContext>
}
