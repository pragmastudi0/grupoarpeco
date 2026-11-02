import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../useAuth'

/** Oculta rutas a quien no tenga alguno de los permisos (conveniencia; RLS/permiso en DB es la fuente real). */
export function PermGate({ permissions }: { permissions: string[] }) {
  const { can } = useAuth()
  if (!permissions.some((p) => can(p))) return <Navigate to="/" replace />
  return <Outlet />
}
