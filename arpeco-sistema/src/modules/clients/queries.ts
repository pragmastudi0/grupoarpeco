import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/supabase/client'
import type { Database } from '@/shared/supabase/database.types'

type ClientInsert = Database['public']['Tables']['clients']['Insert']

export type Client = Database['public']['Tables']['clients']['Row']
export type ClientContact = Database['public']['Tables']['client_contacts']['Row']

export function useClientsQuery(search: string) {
  return useQuery({
    queryKey: ['clients', 'list', search],
    queryFn: async (): Promise<Client[]> => {
      let q = supabase
        .from('clients')
        .select('*')
        .eq('status', 'active')
        .order('legal_name')
        .limit(50)
      if (search.trim()) q = q.ilike('legal_name', `%${search.trim()}%`)
      const { data, error } = await q
      if (error) throw error
      return data ?? []
    },
  })
}

export function useClientQuery(id: string | undefined) {
  return useQuery({
    queryKey: ['clients', 'detail', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const [{ data: client, error: e1 }, { data: contacts, error: e2 }] = await Promise.all([
        supabase.from('clients').select('*').eq('id', id!).single(),
        supabase.from('client_contacts').select('*').eq('client_id', id!),
      ])
      if (e1) throw e1
      if (e2) throw e2
      return { client, contacts: contacts ?? [] }
    },
  })
}

/** Deduplicación: coincidencias globales mínimas antes de crear. */
export function useClientDedup(query: string) {
  return useQuery({
    queryKey: ['clients', 'dedup', query],
    enabled: query.trim().length >= 3,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('search_clients_min', { p_query: query.trim() })
      if (error) throw error
      return data ?? []
    },
  })
}

/** Totales económicos del cliente (ventas + saldos de sus ventas). */
export function useClientFinancials(clientId: string | undefined) {
  return useQuery({
    queryKey: ['clients', 'financials', clientId],
    enabled: Boolean(clientId),
    queryFn: async () => {
      const { data: sales, error } = await supabase
        .from('sales')
        .select('id, amount')
        .eq('client_id', clientId!)
        .eq('status', 'active')
      if (error) throw error
      const ids = (sales ?? []).map((s) => s.id)
      let paid = 0
      if (ids.length) {
        const { data: balances, error: e2 } = await supabase
          .from('sale_balances')
          .select('sale_id, paid')
          .in('sale_id', ids)
        if (e2) throw e2
        paid = (balances ?? []).reduce((acc, b) => acc + Number(b.paid ?? 0), 0)
      }
      const sold = (sales ?? []).reduce((acc, s) => acc + Number(s.amount), 0)
      return { salesCount: ids.length, sold, paid, pending: sold - paid }
    },
  })
}

export function useReassignOwner(clientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (newOwner: string) => {
      const { error } = await supabase.rpc('reassign_owner', {
        p_entity: 'client',
        p_id: clientId,
        p_new_owner: newOwner,
        p_reason: 'Reasignación desde panel',
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  })
}

export function useMergeClient(clientId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (intoId: string) => {
      const { error } = await supabase.rpc('merge_clients', {
        p_from: clientId,
        p_into: intoId,
        p_reason: 'Fusión desde panel',
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  })
}

export function useCreateClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: ClientInsert): Promise<Client> => {
      const { data, error } = await supabase.from('clients').insert(input).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  })
}
