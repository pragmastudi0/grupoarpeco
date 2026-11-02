export const STAGES = ['new', 'sent', 'negotiation', 'won', 'lost'] as const
export type Stage = (typeof STAGES)[number]

export const STAGE_LABELS: Record<Stage, string> = {
  new: 'Nueva',
  sent: 'Presupuestada',
  negotiation: 'Negociación',
  won: 'Ganada',
  lost: 'Perdida',
}

export const STAGE_VARIANT: Record<
  Stage,
  'default' | 'success' | 'warning' | 'destructive' | 'muted'
> = {
  new: 'muted',
  sent: 'default',
  negotiation: 'warning',
  won: 'success',
  lost: 'destructive',
}
