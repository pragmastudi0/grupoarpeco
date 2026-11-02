import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/supabase/client'
import type { Json } from '@/shared/supabase/database.types'

export interface PdfIdentity {
  business_name: string
  tax_id?: string
  address?: string
  contact?: string
  note?: string
}

const KEY = 'pdf_identity'

/** Lee la identidad del PDF desde app_settings (legible por usuarios activos). */
export function usePdfIdentity() {
  return useQuery({
    queryKey: ['settings', KEY],
    queryFn: async (): Promise<PdfIdentity> => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', KEY)
        .maybeSingle()
      if (error) throw error
      const value = (data?.value ?? {}) as Partial<PdfIdentity>
      return { business_name: value.business_name || 'Grupo Arpeco', ...value }
    },
  })
}

export function useSavePdfIdentity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (identity: PdfIdentity) => {
      const { error } = await supabase.rpc('set_app_setting', {
        p_key: KEY,
        p_value: identity as unknown as Json,
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings', KEY] }),
  })
}
