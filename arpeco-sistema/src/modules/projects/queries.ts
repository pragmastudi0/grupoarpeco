import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/supabase/client'

export const PROJECT_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  in_progress: 'En proceso',
  finished: 'Finalizado',
}

export interface ProjectRow {
  id: string
  commercial_no: string | null
  status: string
  event_on: string | null
  sales: { commercial_no: string | null; clients: { legal_name: string } | null } | null
}

export function useProjectsQuery() {
  return useQuery({
    queryKey: ['projects', 'list'],
    queryFn: async (): Promise<ProjectRow[]> => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, commercial_no, status, event_on, sales(commercial_no, clients(legal_name))')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as unknown as ProjectRow[]
    },
  })
}

export function useProjectQuery(id: string | undefined, isDirection: boolean) {
  return useQuery({
    queryKey: ['projects', 'detail', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const [project, costs, margin] = await Promise.all([
        supabase
          .from('projects')
          .select(
            'id, commercial_no, status, event_on, manager_id, costs_complete_at, sale_id, sales(commercial_no, clients(legal_name))',
          )
          .eq('id', id!)
          .single(),
        supabase
          .from('project_costs')
          .select('id, amount, incurred_on, description, category, status')
          .eq('project_id', id!)
          .order('incurred_on'),
        isDirection
          ? supabase.rpc('project_margin', { p_project: id! })
          : Promise.resolve({ data: null, error: null }),
      ])
      if (project.error) throw project.error
      return {
        project: project.data,
        costs: costs.data ?? [],
        margin: Array.isArray(margin.data) ? (margin.data[0] ?? null) : null,
      }
    },
  })
}

function invalidate(qc: ReturnType<typeof useQueryClient>, id: string) {
  qc.invalidateQueries({ queryKey: ['projects'] })
  qc.invalidateQueries({ queryKey: ['projects', 'detail', id] })
}

export function useUpdateProjectStatus(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (status: string) => {
      const { error } = await supabase.from('projects').update({ status }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => invalidate(qc, id),
  })
}

export function useUpdateProjectEvent(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (event_on: string | null) => {
      const { error } = await supabase.from('projects').update({ event_on }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => invalidate(qc, id),
  })
}

export function useAssignManager(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (managerId: string) => {
      const { error } = await supabase.rpc('assign_project_manager', {
        p_project: id,
        p_manager: managerId,
      })
      if (error) throw error
    },
    onSuccess: () => invalidate(qc, id),
  })
}

export function useRegisterCost(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      amount: number
      incurred_on: string
      description: string
      category: string | null
    }) => {
      const { error } = await supabase.rpc('register_cost', {
        p_project: projectId,
        p_amount: input.amount,
        p_incurred: input.incurred_on,
        p_description: input.description,
        p_category: input.category ?? undefined,
        p_idempotency: crypto.randomUUID(),
      })
      if (error) throw error
    },
    onSuccess: () => invalidate(qc, projectId),
  })
}

export function useVoidCost(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (costId: string) => {
      const { error } = await supabase.rpc('void_cost', {
        p_id: costId,
        p_reason: 'Anulado desde panel',
      })
      if (error) throw error
    },
    onSuccess: () => invalidate(qc, projectId),
  })
}

export function useCompleteCosts(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('complete_costs', {
        p_project: projectId,
        p_reason: 'Confirmado desde panel',
      })
      if (error) throw error
    },
    onSuccess: () => invalidate(qc, projectId),
  })
}
