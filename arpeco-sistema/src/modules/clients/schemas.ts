import { z } from 'zod'

export const clientSchema = z.object({
  legal_name: z.string().trim().min(2, 'Ingresá el nombre o razón social'),
  tax_id: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  email: z.union([z.string().trim().email('Email inválido'), z.literal('')]).optional(),
  address: z.string().trim().optional(),
  industry: z.string().trim().optional(),
  notes: z.string().trim().optional(),
})

export type ClientInput = z.infer<typeof clientSchema>

/** Normaliza strings vacíos a null para columnas opcionales de la base. */
export function toClientInsert(values: ClientInput) {
  const nn = (v: string | undefined) => (v && v.length > 0 ? v : null)
  return {
    legal_name: values.legal_name,
    tax_id: nn(values.tax_id),
    phone: nn(values.phone),
    email: nn(values.email),
    address: nn(values.address),
    industry: nn(values.industry),
    notes: nn(values.notes),
  }
}
