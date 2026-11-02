import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/shared/supabase/client'

export interface Period {
  from: string
  to: string
}

export function useReportBusiness(period: Period, enabled: boolean) {
  return useQuery({
    queryKey: ['reports', 'business', period],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('report_business', {
        p_from: period.from,
        p_to: period.to,
      })
      if (error) throw error
      return data?.[0] ?? null
    },
  })
}

export function useReportProfitability(period: Period, enabled: boolean) {
  return useQuery({
    queryKey: ['reports', 'profitability', period],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('report_profitability', {
        p_from: period.from,
        p_to: period.to,
      })
      if (error) throw error
      return data?.[0] ?? null
    },
  })
}

export function useReportSellers(period: Period) {
  return useQuery({
    queryKey: ['reports', 'sellers', period],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('report_sellers', {
        p_from: period.from,
        p_to: period.to,
      })
      if (error) throw error
      return data ?? []
    },
  })
}

export function useReportFairs(period: Period, enabled: boolean) {
  return useQuery({
    queryKey: ['reports', 'fairs', period],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('report_fairs', {
        p_from: period.from,
        p_to: period.to,
      })
      if (error) throw error
      return data ?? []
    },
  })
}

/** Período por defecto: año en curso (hora de Córdoba). */
export function currentYearPeriod(): Period {
  const year = new Date().getFullYear()
  return { from: `${year}-01-01`, to: `${year}-12-31` }
}
