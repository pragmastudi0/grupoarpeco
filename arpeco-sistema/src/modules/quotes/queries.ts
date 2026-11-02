import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/supabase/client'
import type { Database } from '@/shared/supabase/database.types'

export type QuoteItem = Database['public']['Tables']['quote_items']['Row']

/** Duplica un presupuesto existente en un borrador nuevo (copia conceptos). */
export function useDuplicateQuote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (sourceId: string): Promise<string> => {
      const { data, error } = await supabase.rpc('duplicate_quote', { p_source: sourceId })
      if (error) throw error
      return data as string
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quotes'] }),
  })
}

// Columnas públicas (estimated_cost / internal_notes NO están permitidas por GRANT).
const PUBLIC_COLS =
  'id, commercial_no, title, status, total, currency, client_id, opportunity_id, owner_id, revision, issued_on, valid_until, public_notes, sent_at, accepted_at, created_at'

export interface QuoteListRow {
  id: string
  commercial_no: string | null
  title: string
  status: string
  total: number
  client_id: string
  clients: { legal_name: string } | null
}

export function useQuotesQuery() {
  return useQuery({
    queryKey: ['quotes', 'list'],
    queryFn: async (): Promise<QuoteListRow[]> => {
      const { data, error } = await supabase
        .from('quotes')
        .select(`${PUBLIC_COLS}, clients(legal_name)`)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as unknown as QuoteListRow[]
    },
  })
}

export function useQuoteQuery(id: string | undefined) {
  return useQuery({
    queryKey: ['quotes', 'detail', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const [{ data: quote, error: e1 }, { data: items, error: e2 }] = await Promise.all([
        supabase
          .from('quotes')
          .select(`${PUBLIC_COLS}, clients(legal_name)`)
          .eq('id', id!)
          .single(),
        supabase.from('quote_items').select('*').eq('quote_id', id!).order('position'),
      ])
      if (e1) throw e1
      if (e2) throw e2
      return { quote, items: (items ?? []) as QuoteItem[] }
    },
  })
}

export function useCreateQuote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { client_id: string; title: string; owner_id: string }) => {
      const { data, error } = await supabase.from('quotes').insert(input).select('id').single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quotes'] }),
  })
}

function itemsKey(quoteId: string) {
  return ['quotes', 'detail', quoteId]
}

export function useUpsertItem(quoteId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      id?: string
      position: number
      description: string
      quantity: number
      unit_price: number
    }) => {
      const row = { ...input, quote_id: quoteId }
      const { error } = await supabase.from('quote_items').upsert(row)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: itemsKey(quoteId) }),
  })
}

export function useDeleteItem(quoteId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase.from('quote_items').delete().eq('id', itemId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: itemsKey(quoteId) }),
  })
}

/** Aceptar: sólo marca el presupuesto como aceptado (no crea venta). */
export function useAcceptQuote(quoteId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (revision: number) => {
      const { error } = await supabase.rpc('accept_quote', {
        p_id: quoteId,
        p_expected_revision: revision,
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quotes'] }),
  })
}

/** Confirmar venta: desde un presupuesto aceptado crea la venta + proyecto. */
export function useConfirmSale(quoteId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (revision: number) => {
      const { data, error } = await supabase.rpc('confirm_sale', {
        p_id: quoteId,
        p_expected_revision: revision,
      })
      if (error) throw error
      return data?.[0] ?? null
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quotes'] })
      qc.invalidateQueries({ queryKey: ['sales'] })
    },
  })
}

export function useQuoteLifecycle(quoteId: string) {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['quotes'] })
  return {
    send: useMutation({
      mutationFn: async () => {
        const { error } = await supabase.rpc('send_quote', { p_id: quoteId })
        if (error) throw error
      },
      onSuccess: invalidate,
    }),
    revise: useMutation({
      mutationFn: async () => {
        const { error } = await supabase.rpc('revise_quote', { p_id: quoteId })
        if (error) throw error
      },
      onSuccess: invalidate,
    }),
    reject: useMutation({
      mutationFn: async (reason: string) => {
        const { error } = await supabase.rpc('reject_quote', { p_id: quoteId, p_reason: reason })
        if (error) throw error
      },
      onSuccess: invalidate,
    }),
  }
}

/** Costo/margen: sólo devuelve datos a Dirección (RPC security definer). */
export function useQuoteMargin(quoteId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['quotes', 'margin', quoteId],
    enabled: Boolean(quoteId) && enabled,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('quote_margin', { p_id: quoteId! })
      if (error) throw error
      return data?.[0] ?? null
    },
  })
}

export function useSetQuoteInternal(quoteId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { cost: number | null; notes: string | null }) => {
      const { error } = await supabase.rpc('set_quote_internal', {
        p_id: quoteId,
        p_cost: input.cost ?? undefined,
        p_notes: input.notes ?? undefined,
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quotes', 'margin', quoteId] }),
  })
}
