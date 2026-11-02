import { ChevronLeft } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '@/modules/auth/useAuth'
import { cn } from '@/shared/lib/utils'
import { NAV } from './navigation'

export function Sidebar({
  collapsed = false,
  onToggleCollapse,
  onNavigate,
}: {
  /** Modo compacto (sólo íconos) en escritorio. */
  collapsed?: boolean
  /** Si se define, muestra el botón de contraer/expandir (escritorio). */
  onToggleCollapse?: () => void
  /** Se invoca al navegar (cierra el drawer en mobile). */
  onNavigate?: () => void
}) {
  const { can } = useAuth()

  return (
    <nav
      aria-label="Navegación principal"
      className="flex h-full w-full flex-col gap-1 overflow-y-auto overflow-x-hidden bg-sidebar px-3 py-6 text-sidebar-foreground"
    >
      {/* Marca */}
      <div className={cn('pb-6', collapsed ? 'px-0 text-center' : 'px-3')}>
        {collapsed ? (
          <strong
            className="block text-lg font-bold tracking-tight text-white"
            title="Grupo Arpeco"
          >
            GA
          </strong>
        ) : (
          <>
            <strong className="block text-xl font-bold tracking-[0.08em] text-white">
              GRUPO ARPECO
            </strong>
            <span className="mt-2 block text-[11px] leading-tight text-sidebar-foreground/70">
              Gestión Comercial y Proyectos
            </span>
          </>
        )}
      </div>

      {NAV.map((section) => {
        const items = section.items.filter(
          (item) => !item.permissions || item.permissions.some((p) => can(p)),
        )
        if (items.length === 0) return null
        return (
          <div key={section.label} className="mb-1">
            {collapsed ? (
              <div className="mx-2 my-2 border-t border-sidebar-border" aria-hidden />
            ) : (
              <p className="px-3 pb-1.5 pt-3 text-[10px] uppercase tracking-[0.12em] text-sidebar-foreground/50">
                {section.label}
              </p>
            )}
            {items.map((item) => {
              const Icon = item.icon
              if (item.comingSoon) {
                return (
                  <span
                    key={item.to}
                    aria-disabled
                    title={collapsed ? `${item.label} · pronto` : 'Disponible en próximas etapas'}
                    className={cn(
                      'flex cursor-not-allowed items-center rounded-md py-2 text-sm text-sidebar-foreground/40',
                      collapsed ? 'justify-center px-0' : 'gap-2.5 px-3',
                    )}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden />
                    {!collapsed && (
                      <>
                        <span>{item.label}</span>
                        <span className="ml-auto rounded bg-sidebar-accent px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-sidebar-foreground/60">
                          pronto
                        </span>
                      </>
                    )}
                  </span>
                )
              }
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={onNavigate}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center rounded-md py-2 text-sm transition-colors',
                      collapsed ? 'justify-center px-0' : 'gap-2.5 px-3',
                      'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                      isActive
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                        : 'text-sidebar-foreground',
                    )
                  }
                >
                  <Icon className="size-4 shrink-0" aria-hidden />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              )
            })}
          </div>
        )
      })}

      {onToggleCollapse && (
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expandir menú' : 'Contraer menú'}
          title={collapsed ? 'Expandir menú' : 'Contraer menú'}
          className={cn(
            'mt-auto flex items-center rounded-md py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            collapsed ? 'justify-center px-0' : 'gap-2.5 px-3',
          )}
        >
          <ChevronLeft
            className={cn('size-4 shrink-0 transition-transform', collapsed && 'rotate-180')}
            aria-hidden
          />
          {!collapsed && <span>Contraer</span>}
        </button>
      )}
    </nav>
  )
}
