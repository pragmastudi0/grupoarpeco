import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/shared/supabase/client'

export interface Pendiente {
  label: string
  count: number
  to: string
}

/**
 * Pendientes navegables del inicio. Cada consulta respeta RLS, así cada rol ve
 * sólo lo suyo (p. ej. un Vendedor cuenta sus presupuestos/ventas).
 */
export function usePendientes() {
  return useQuery({
    queryKey: ['dashboard', 'pendientes'],
    queryFn: async (): Promise<Pendiente[]> => {
      const today = new Date().toISOString().slice(0, 10)
      const [sentQuotes, inProgress, overdue, salesAll] = await Promise.all([
        supabase.from('quotes').select('id', { count: 'exact', head: true }).eq('status', 'sent'),
        supabase
          .from('projects')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'in_progress'),
        supabase
          .from('opportunities')
          .select('id', { count: 'exact', head: true })
          .lte('next_followup_on', today)
          .is('closed_at', null),
        supabase.from('sale_balances').select('pending_collection'),
      ])

      const salesPending = (salesAll.data ?? []).filter(
        (s) => Number(s.pending_collection ?? 0) > 0,
      ).length

      return [
        { label: 'Presupuestos enviados', count: sentQuotes.count ?? 0, to: '/presupuestos' },
        { label: 'Ventas con saldo', count: salesPending, to: '/ventas' },
        { label: 'Seguimientos vencidos', count: overdue.count ?? 0, to: '/oportunidades' },
        { label: 'Proyectos en proceso', count: inProgress.count ?? 0, to: '/proyectos' },
      ]
    },
  })
}
