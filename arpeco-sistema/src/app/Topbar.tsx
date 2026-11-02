import { LogOut, Menu } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '@/modules/auth/useAuth'
import { ROLE_LABELS } from '@/shared/auth/roles'
import { Button } from '@/shared/ui/button'
import { NAV } from './navigation'

/** Etiqueta de la sección actual según la ruta (para el header mobile). */
function useCurrentSection(): string {
  const { pathname } = useLocation()
  const match = NAV.flatMap((s) => s.items)
    .filter((i) => (i.to === '/' ? pathname === '/' : pathname.startsWith(i.to)))
    .sort((a, b) => b.to.length - a.to.length)[0]
  return match?.label ?? ''
}

export function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { profile, roles, signOut } = useAuth()
  const section = useCurrentSection()
  const initials = (profile?.display_name || profile?.email || '?').trim().charAt(0).toUpperCase()

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border bg-card px-3 sm:gap-3 sm:px-4 md:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onOpenMenu}
        aria-label="Abrir menú"
      >
        <Menu />
      </Button>

      {/* Nombre de la sección actual (sólo mobile; en desktop lo da el PageHeader) */}
      <span className="min-w-0 truncate text-base font-semibold md:hidden">{section}</span>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium leading-tight">{profile?.display_name || '—'}</p>
          <p className="text-xs text-muted-foreground">
            {roles.length ? roles.map((r) => ROLE_LABELS[r]).join(' · ') : 'Sin rol'}
          </p>
        </div>
        <div
          aria-hidden
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground"
        >
          {initials}
        </div>
        <Button variant="outline" size="sm" onClick={() => void signOut()}>
          <LogOut />
          <span className="hidden sm:inline">Salir</span>
        </Button>
      </div>
    </header>
  )
}
