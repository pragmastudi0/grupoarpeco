import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/supabase/client'
import type { Database } from '@/shared/supabase/database.types'
import type { Stage } from './stages'

export type Opportunity = Database['public']['Tables']['opportunities']['Row']
export type Followup = Database['public']['Tables']['followups']['Row']

export interface OpportunityWithClient extends Opportunity {
  clients: { legal_name: string } | null
  fair_prospects: { company_name: string } | null
  source: string | null
}

export function useOpportunitiesQuery() {
  return useQuery({
    queryKey: ['opportunities', 'board'],
    queryFn: async (): Promise<OpportunityWithClient[]> => {
      const { data, error } = await supabase
        .from('opportunities')
        .select('*, clients(legal_name), fair_prospects(company_name)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as OpportunityWithClient[]
    },
  })
}

export function useCreateOpportunity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      client_id: string
      title: string
      owner_id: string
      estimated_amount: number | null
    }) => {
      const { data, error } = await supabase.from('opportunities').insert(input).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['opportunities'] }),
  })
}

export function useUpdateStage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { id: string; stage: Stage }) => {
      const patch: Database['public']['Tables']['opportunities']['Update'] = {
        stage: input.stage,
        closed_at:
          input.stage === 'won' || input.stage === 'lost' ? new Date().toISOString() : null,
      }
      const { error } = await supabase.from('opportunities').update(patch).eq('id', input.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['opportunities'] }),
  })
}

export function useOpportunityQuery(id: string | undefined) {
  return useQuery({
    queryKey: ['opportunities', 'detail', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const [{ data: opp, error: e1 }, { data: followups, error: e2 }] = await Promise.all([
        supabase
          .from('opportunities')
          .select('*, clients(legal_name), fair_prospects(company_name)')
          .eq('id', id!)
          .single(),
        supabase
          .from('followups')
          .select('*')
          .eq('opportunity_id', id!)
          .eq('status', 'active')
          .order('occurred_at', { ascending: false }),
      ])
      if (e1) throw e1
      if (e2) throw e2
      return { opp: opp as OpportunityWithClient, followups: followups ?? [] }
    },
  })
}

export function useAddFollowup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      opportunity_id: string
      owner_id: string
      kind: string
      summary: string
      next_on: string | null
    }) => {
      const { error } = await supabase.from('followups').insert(input)
      if (error) throw error
    },
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: ['opportunities', 'detail', v.opportunity_id] }),
  })
}
