import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/supabase/client'

export interface SaleRow {
  id: string
  commercial_no: string | null
  accepted_on: string
  amount: number
  status: string
  clients: { legal_name: string } | null
  balance?: {
    paid: number
    invoiced: number
    pending_collection: number
    pending_invoicing: number
  }
}

export function useSalesQuery() {
  return useQuery({
    queryKey: ['sales', 'list'],
    queryFn: async (): Promise<SaleRow[]> => {
      const [{ data: sales, error: e1 }, { data: balances, error: e2 }] = await Promise.all([
        supabase
          .from('sales')
          .select('id, commercial_no, accepted_on, amount, status, clients(legal_name)')
          .order('accepted_on', { ascending: false }),
        supabase.from('sale_balances').select('*'),
      ])
      if (e1) throw e1
      if (e2) throw e2
      const byId = new Map((balances ?? []).map((b) => [b.sale_id, b]))
      return (sales ?? []).map((s) => ({
        ...(s as unknown as SaleRow),
        balance: byId.get(s.id) as SaleRow['balance'],
      }))
    },
  })
}

export function useSaleQuery(id: string | undefined) {
  return useQuery({
    queryKey: ['sales', 'detail', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const [sale, project, payments, invoices, balance] = await Promise.all([
        supabase
          .from('sales')
          .select(
            'id, commercial_no, accepted_on, amount, status, quote_id, client_id, clients(legal_name)',
          )
          .eq('id', id!)
          .single(),
        supabase
          .from('projects')
          .select('id, commercial_no, status')
          .eq('sale_id', id!)
          .maybeSingle(),
        supabase
          .from('payments')
          .select('id, amount, received_on, status')
          .eq('sale_id', id!)
          .order('received_on'),
        supabase
          .from('invoices')
          .select('id, invoice_no, issued_on, amount, status')
          .eq('sale_id', id!)
          .order('issued_on'),
        supabase.from('sale_balances').select('*').eq('sale_id', id!).maybeSingle(),
      ])
      if (sale.error) throw sale.error
      return {
        sale: sale.data,
        project: project.data,
        payments: payments.data ?? [],
        invoices: invoices.data ?? [],
        balance: balance.data,
      }
    },
  })
}

function invalidate(qc: ReturnType<typeof useQueryClient>, id: string) {
  qc.invalidateQueries({ queryKey: ['sales'] })
  qc.invalidateQueries({ queryKey: ['sales', 'detail', id] })
}

export function useRegisterPayment(saleId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      amount: number
      received_on: string
      method: string
      reference: string
    }) => {
      const { error } = await supabase.rpc('register_payment', {
        p_sale: saleId,
        p_amount: input.amount,
        p_received: input.received_on,
        p_method: input.method,
        p_reference: input.reference,
        p_idempotency: crypto.randomUUID(),
      })
      if (error) throw error
    },
    onSuccess: () => invalidate(qc, saleId),
  })
}

export function useRegisterInvoice(saleId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { invoice_no: string; issued_on: string; amount: number }) => {
      const { error } = await supabase.rpc('register_invoice', {
        p_sale: saleId,
        p_invoice_no: input.invoice_no,
        p_issued: input.issued_on,
        p_amount: input.amount,
        p_idempotency: crypto.randomUUID(),
      })
      if (error) throw error
    },
    onSuccess: () => invalidate(qc, saleId),
  })
}

export function useVoidPayment(saleId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (paymentId: string) => {
      const { error } = await supabase.rpc('void_payment', {
        p_id: paymentId,
        p_reason: 'Anulado desde panel',
      })
      if (error) throw error
    },
    onSuccess: () => invalidate(qc, saleId),
  })
}

export function useVoidInvoice(saleId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const { error } = await supabase.rpc('void_invoice', {
        p_id: invoiceId,
        p_reason: 'Anulado desde panel',
      })
      if (error) throw error
    },
    onSuccess: () => invalidate(qc, saleId),
  })
}
