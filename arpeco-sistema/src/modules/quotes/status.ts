export const QUOTE_STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  sent: 'Enviado',
  accepted: 'Aceptado',
  rejected: 'Rechazado',
  void: 'Anulado',
}

export const QUOTE_STATUS_VARIANT: Record<
  string,
  'default' | 'success' | 'warning' | 'destructive' | 'muted'
> = {
  draft: 'muted',
  sent: 'default',
  accepted: 'success',
  rejected: 'destructive',
  void: 'destructive',
}
