import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { cn } from '@/shared/lib/utils'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

const COLLAPSE_KEY = 'arpeco.sidebar.collapsed'

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem(COLLAPSE_KEY) === '1'
  })

  // Persistir preferencia de la sidebar entre navegaciones y recargas.
  useEffect(() => {
    window.localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0')
  }, [collapsed])

  // Cerrar el drawer mobile con Escape.
  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mobileOpen])

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar fija en escritorio (ancho animado según estado) */}
      <aside
        className={cn(
          'hidden shrink-0 transition-[width] duration-200 ease-in-out md:block',
          collapsed ? 'w-[72px]' : 'w-56',
        )}
      >
        <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed((v) => !v)} />
      </aside>

      {/* Drawer móvil: fondo semitransparente + panel deslizante */}
      <button
        type="button"
        aria-label="Cerrar menú"
        tabIndex={mobileOpen ? 0 : -1}
        onClick={() => setMobileOpen(false)}
        className={cn(
          'fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 md:hidden',
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />
      <div
        role="dialog"
        aria-label="Menú de navegación"
        aria-hidden={!mobileOpen}
        className={cn(
          'fixed left-0 top-0 z-50 h-full w-72 max-w-[85vw] shadow-xl transition-transform duration-200 ease-in-out md:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <Sidebar onNavigate={() => setMobileOpen(false)} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenMenu={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="mx-auto w-full max-w-[1600px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
