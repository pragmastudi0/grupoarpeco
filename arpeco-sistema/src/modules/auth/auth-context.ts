import { createContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import type { RoleCode } from '@/shared/auth/roles'

export interface AuthProfile {
  id: string
  display_name: string
  email: string
  active: boolean
}

export interface AuthState {
  /** true mientras se resuelve la sesión inicial o el perfil. */
  loading: boolean
  session: Session | null
  user: User | null
  /** Perfil de la base; null si no hay sesión o aún carga. */
  profile: AuthProfile | null
  /** Roles del usuario (vacío si inactivo o sin roles). */
  roles: RoleCode[]
  /** Permisos efectivos del usuario (códigos). */
  permissions: string[]
  /** Hay sesión Auth válida. */
  isAuthenticated: boolean
  /** Sesión válida Y perfil activo: recién aquí puede operar. */
  isActive: boolean
  hasRole: (role: RoleCode) => boolean
  /** ¿Tiene el permiso efectivo? (fuente de verdad del front). */
  can: (permission: string) => boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  /** Reintenta la carga de perfil/roles (para estados de error). */
  refresh: () => Promise<void>
}

export const AuthContext = createContext<AuthState | null>(null)
