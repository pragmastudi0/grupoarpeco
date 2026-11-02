import { Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '@/modules/auth/components/ProtectedRoute'
import { PermGate } from '@/modules/auth/components/PermGate'
import { LoginPage } from '@/modules/auth/pages/LoginPage'
import { RecuperarPage } from '@/modules/auth/pages/RecuperarPage'
import { AuditoriaPage } from '@/modules/admin/AuditoriaPage'
import { ConfiguracionPage } from '@/modules/admin/ConfiguracionPage'
import { UsuariosPage } from '@/modules/admin/UsuariosPage'
import { ClienteDetailPage } from '@/modules/clients/ClienteDetailPage'
import { ClientesPage } from '@/modules/clients/ClientesPage'
import { OportunidadDetailPage } from '@/modules/crm/OportunidadDetailPage'
import { OportunidadesPage } from '@/modules/crm/OportunidadesPage'
import { HomePage } from '@/modules/dashboard/HomePage'
import { FeriaDetailPage } from '@/modules/fairs/FeriaDetailPage'
import { FeriasPage } from '@/modules/fairs/FeriasPage'
import { PlantillasPage } from '@/modules/quotes/PlantillasPage'
import { PresupuestoDetailPage } from '@/modules/quotes/PresupuestoDetailPage'
import { PresupuestosPage } from '@/modules/quotes/PresupuestosPage'
import { VentaDetailPage } from '@/modules/sales/VentaDetailPage'
import { VentasPage } from '@/modules/sales/VentasPage'
import { ProyectoDetailPage } from '@/modules/projects/ProyectoDetailPage'
import { ProyectosPage } from '@/modules/projects/ProyectosPage'
import { ReportesPage } from '@/modules/reports/ReportesPage'
import { AppLayout } from './AppLayout'
import { NotFoundPage } from './NotFoundPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/recuperar" element={<RecuperarPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="/clientes" element={<ClientesPage />} />
          <Route path="/clientes/:id" element={<ClienteDetailPage />} />
          <Route path="/oportunidades" element={<OportunidadesPage />} />
          <Route path="/oportunidades/:id" element={<OportunidadDetailPage />} />
          <Route path="/ferias" element={<FeriasPage />} />
          <Route path="/ferias/:id" element={<FeriaDetailPage />} />
          <Route path="/presupuestos" element={<PresupuestosPage />} />
          <Route path="/presupuestos/:id" element={<PresupuestoDetailPage />} />
          <Route element={<PermGate permissions={['presupuestos.create']} />}>
            <Route path="/plantillas" element={<PlantillasPage />} />
          </Route>
          <Route path="/ventas" element={<VentasPage />} />
          <Route path="/ventas/:id" element={<VentaDetailPage />} />
          <Route path="/proyectos" element={<ProyectosPage />} />
          <Route path="/proyectos/:id" element={<ProyectoDetailPage />} />
          <Route path="/reportes" element={<ReportesPage />} />
          <Route element={<PermGate permissions={['usuarios.view']} />}>
            <Route path="/usuarios" element={<UsuariosPage />} />
          </Route>
          <Route element={<PermGate permissions={['auditoria.view']} />}>
            <Route path="/auditoria" element={<AuditoriaPage />} />
          </Route>
          <Route element={<PermGate permissions={['config.view']} />}>
            <Route path="/configuracion" element={<ConfiguracionPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
