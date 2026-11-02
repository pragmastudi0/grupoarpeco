import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/supabase/client'
import type { Json } from '@/shared/supabase/database.types'

export interface TemplateItem {
  position: number
  description: string
  quantity: number
  unit_price: number
}
export interface TemplateRow {
  id: string
  name: string
  description: string | null
  itemCount: number
}

export function useTemplatesQuery() {
  return useQuery({
    queryKey: ['templates', 'list'],
    queryFn: async (): Promise<TemplateRow[]> => {
      const { data, error } = await supabase
        .from('quote_templates')
        .select('id, name, description, quote_template_items(count)')
        .order('name')
      if (error) throw error
      return (data ?? []).map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        itemCount:
          (t.quote_template_items as unknown as { count: number }[] | null)?.[0]?.count ?? 0,
      }))
    },
  })
}

export function useTemplateItems(templateId: string | null) {
  return useQuery({
    queryKey: ['templates', 'items', templateId],
    enabled: Boolean(templateId),
    queryFn: async (): Promise<TemplateItem[]> => {
      const { data, error } = await supabase
        .from('quote_template_items')
        .select('position, description, quantity, unit_price')
        .eq('template_id', templateId!)
        .order('position')
      if (error) throw error
      return (data ?? []) as TemplateItem[]
    },
  })
}

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['templates'] })
}

export function useCreateTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { name: string; description?: string; items: TemplateItem[] }) => {
      const { error } = await supabase.rpc('create_template', {
        p_name: input.name,
        p_description: input.description ?? undefined,
        p_items: input.items as unknown as Json,
      })
      if (error) throw error
    },
    onSuccess: () => invalidate(qc),
  })
}

export function useUpdateTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      id: string
      name: string
      description?: string
      items: TemplateItem[]
    }) => {
      const { error } = await supabase.rpc('update_template', {
        p_id: input.id,
        p_name: input.name,
        p_description: input.description ?? undefined,
        p_items: input.items as unknown as Json,
      })
      if (error) throw error
    },
    onSuccess: () => invalidate(qc),
  })
}

export function useDeleteTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc('delete_template', { p_id: id })
      if (error) throw error
    },
    onSuccess: () => invalidate(qc),
  })
}

export function useSaveQuoteAsTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { quoteId: string; name: string; description?: string }) => {
      const { error } = await supabase.rpc('save_quote_as_template', {
        p_quote: input.quoteId,
        p_name: input.name,
        p_description: input.description ?? undefined,
      })
      if (error) throw error
    },
    onSuccess: () => invalidate(qc),
  })
}

export function useCreateQuoteFromTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { templateId: string; clientId: string; title: string }) => {
      const { data, error } = await supabase.rpc('create_quote_from_template', {
        p_template: input.templateId,
        p_client: input.clientId,
        p_title: input.title,
      })
      if (error) throw error
      return data as string
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quotes'] }),
  })
}
