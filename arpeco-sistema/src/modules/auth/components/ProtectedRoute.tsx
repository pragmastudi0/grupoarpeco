import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { LoadingState } from '@/shared/ui/states'
import { useAuth } from '../useAuth'
import { InactiveAccount } from './InactiveAccount'

/**
 * Guarda de rutas privadas. La autorización REAL es RLS en la base; esta guarda
 * es sólo conveniencia de navegación (plan maestro: "el menú es sólo conveniencia").
 */
export function ProtectedRoute() {
  const { loading, isAuthenticated, isActive } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingState label="Verificando sesión…" />

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  // Sesión válida pero perfil inactivo: bloqueado aunque el JWT siga vivo.
  if (!isActive) return <InactiveAccount />

  return <Outlet />
}
