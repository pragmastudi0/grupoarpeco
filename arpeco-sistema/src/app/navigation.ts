import {
  BarChart3,
  FileText,
  FolderKanban,
  LayoutDashboard,
  LayoutTemplate,
  Receipt,
  ScrollText,
  Settings,
  Tent,
  Target,
  UserCog,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  /** Si se define, se muestra sólo a quien tenga alguno de estos permisos. */
  permissions?: string[]
  comingSoon?: boolean
}

export interface NavSection {
  label: string
  items: NavItem[]
}

/** Navegación del shell. Es sólo conveniencia: la autorización real es RLS/permisos. */
export const NAV: NavSection[] = [
  {
    label: 'General',
    items: [{ to: '/', label: 'Inicio', icon: LayoutDashboard }],
  },
  {
    label: 'Comercial',
    items: [
      { to: '/clientes', label: 'Clientes', icon: Users, permissions: ['clientes.view'] },
      {
        to: '/oportunidades',
        label: 'Oportunidades',
        icon: Target,
        permissions: ['oportunidades.view'],
      },
      { to: '/ferias', label: 'Ferias', icon: Tent, permissions: ['ferias.view'] },
      {
        to: '/presupuestos',
        label: 'Presupuestos',
        icon: FileText,
        permissions: ['presupuestos.view'],
      },
      {
        to: '/plantillas',
        label: 'Plantillas',
        icon: LayoutTemplate,
        permissions: ['presupuestos.create'],
      },
    ],
  },
  {
    label: 'Operación',
    items: [
      { to: '/ventas', label: 'Ventas y cobros', icon: Receipt, permissions: ['ventas.view'] },
      { to: '/proyectos', label: 'Proyectos', icon: FolderKanban, permissions: ['proyectos.view'] },
      {
        to: '/reportes',
        label: 'Reportes',
        icon: BarChart3,
        permissions: ['reportes.view_own', 'reportes.view_global', 'reportes.view_profitability'],
      },
    ],
  },
  {
    label: 'Administración',
    items: [
      { to: '/usuarios', label: 'Usuarios', icon: UserCog, permissions: ['usuarios.view'] },
      { to: '/auditoria', label: 'Auditoría', icon: ScrollText, permissions: ['auditoria.view'] },
      {
        to: '/configuracion',
        label: 'Configuración',
        icon: Settings,
        permissions: ['config.view'],
      },
    ],
  },
]
