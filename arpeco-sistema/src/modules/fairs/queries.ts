import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/supabase/client'
import type { Database } from '@/shared/supabase/database.types'

export type Fair = Database['public']['Tables']['fairs']['Row']
export type FairProspect = Database['public']['Tables']['fair_prospects']['Row']

export function useFairsQuery() {
  return useQuery({
    queryKey: ['fairs', 'list'],
    queryFn: async (): Promise<Fair[]> => {
      const { data, error } = await supabase
        .from('fairs')
        .select('*')
        .order('starts_on', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })
}

export function useCreateFair() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      name: string
      place: string | null
      starts_on: string
      ends_on: string | null
    }) => {
      const { data, error } = await supabase.from('fairs').insert(input).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fairs'] }),
  })
}

export function useFairQuery(id: string | undefined) {
  return useQuery({
    queryKey: ['fairs', 'detail', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const [{ data: fair, error: e1 }, { data: prospects, error: e2 }] = await Promise.all([
        supabase.from('fairs').select('*').eq('id', id!).single(),
        supabase
          .from('fair_prospects')
          .select('*')
          .eq('fair_id', id!)
          .eq('status', 'active')
          .order('company_name'),
      ])
      if (e1) throw e1
      if (e2) throw e2
      return { fair, prospects: prospects ?? [] }
    },
  })
}

export function useCreateProspect() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      fair_id: string
      company_name: string
      contact_name: string | null
      phone: string | null
      email: string | null
      owner_id: string
      client_id: string | null
    }) => {
      const { error } = await supabase.from('fair_prospects').insert(input)
      if (error) throw error
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['fairs', 'detail', v.fair_id] }),
  })
}

/** Vincula un prospecto con un cliente existente. */
export function useLinkProspectClient(fairId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { prospect_id: string; client_id: string }) => {
      const { error } = await supabase
        .from('fair_prospects')
        .update({ client_id: input.client_id })
        .eq('id', input.prospect_id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fairs', 'detail', fairId] }),
  })
}

/** Crea una oportunidad desde un prospecto, conservando el origen de feria. */
export function useCreateOppFromProspect(fairId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      prospect_id: string
      origin_fair_id: string
      title: string
      owner_id: string
    }) => {
      const { error } = await supabase.from('opportunities').insert({
        prospect_id: input.prospect_id,
        origin_fair_id: input.origin_fair_id,
        title: input.title,
        owner_id: input.owner_id,
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fairs', 'detail', fairId] })
      qc.invalidateQueries({ queryKey: ['opportunities'] })
    },
  })
}
