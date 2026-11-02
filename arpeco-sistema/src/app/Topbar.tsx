import { LogOut, Menu } from 'lucide-react'
import { useAuth } from '@/modules/auth/useAuth'
import { ROLE_LABELS } from '@/shared/auth/roles'
import { Button } from '@/shared/ui/button'

export function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { profile, roles, signOut } = useAuth()
  const initials = (profile?.display_name || profile?.email || '?').trim().charAt(0).toUpperCase()

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-card px-4 md:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onOpenMenu}
        aria-label="Abrir menú"
      >
        <Menu />
      </Button>

      <div className="ml-auto flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium leading-tight">{profile?.display_name || '—'}</p>
          <p className="text-xs text-muted-foreground">
            {roles.length ? roles.map((r) => ROLE_LABELS[r]).join(' · ') : 'Sin rol'}
          </p>
        </div>
        <div
          aria-hidden
          className="flex size-9 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground"
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
