import { NavLink } from 'react-router-dom'
import { useAuth } from '@/modules/auth/useAuth'
import { cn } from '@/shared/lib/utils'
import { NAV } from './navigation'

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { can } = useAuth()

  return (
    <nav
      aria-label="Navegación principal"
      className="flex h-full w-56 flex-col gap-1 overflow-auto bg-sidebar px-3 py-6 text-sidebar-foreground"
    >
      <div className="px-3 pb-6">
        <strong className="block text-xl font-bold tracking-[0.08em] text-white">
          GRUPO ARPECO
        </strong>
        <span className="mt-2 block text-[11px] leading-tight text-sidebar-foreground/70">
          Gestión Comercial y Proyectos
        </span>
      </div>

      {NAV.map((section) => {
        const items = section.items.filter(
          (item) => !item.permissions || item.permissions.some((p) => can(p)),
        )
        if (items.length === 0) return null
        return (
          <div key={section.label} className="mb-1">
            <p className="px-3 pb-1.5 pt-3 text-[10px] uppercase tracking-[0.12em] text-sidebar-foreground/50">
              {section.label}
            </p>
            {items.map((item) => {
              const Icon = item.icon
              if (item.comingSoon) {
                return (
                  <span
                    key={item.to}
                    aria-disabled
                    title="Disponible en próximas etapas"
                    className="flex cursor-not-allowed items-center gap-2.5 rounded-md px-3 py-2 text-sm text-sidebar-foreground/40"
                  >
                    <Icon className="size-4 shrink-0" aria-hidden />
                    <span>{item.label}</span>
                    <span className="ml-auto rounded bg-sidebar-accent px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-sidebar-foreground/60">
                      pronto
                    </span>
                  </span>
                )
              }
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors',
                      'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                      isActive
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                        : 'text-sidebar-foreground',
                    )
                  }
                >
                  <Icon className="size-4 shrink-0" aria-hidden />
                  <span>{item.label}</span>
                </NavLink>
              )
            })}
          </div>
        )
      })}
    </nav>
  )
}
