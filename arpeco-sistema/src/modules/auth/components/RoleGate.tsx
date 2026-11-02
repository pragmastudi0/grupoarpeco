import { Navigate, Outlet } from 'react-router-dom'
import type { RoleCode } from '@/shared/auth/roles'
import { useAuth } from '../useAuth'

/** Oculta rutas a quien no tenga alguno de los roles indicados (conveniencia; RLS es la fuente real). */
export function RoleGate({ roles }: { roles: RoleCode[] }) {
  const { hasRole } = useAuth()
  if (!roles.some((r) => hasRole(r))) return <Navigate to="/" replace />
  return <Outlet />
}
