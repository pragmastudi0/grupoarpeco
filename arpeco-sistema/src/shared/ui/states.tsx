import { AlertCircle, Loader2 } from 'lucide-react'
import type * as React from 'react'
import { cn } from '@/shared/lib/utils'
import { Button } from './button'

/**
 * Estados estándar de UI (regla común del plan maestro, docs/01_PLAN_MAESTRO.md):
 * todo listado muestra vacío con acción pertinente, progreso durante carga y
 * error recuperable con reintento.
 */

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('size-4 animate-spin', className)} aria-hidden />
}

export function LoadingState({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground"
    >
      <Spinner />
      <span>{label}</span>
    </div>
  )
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border p-10 text-center">
      <div>
        <p className="font-medium">{title}</p>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function ErrorRetry({
  title = 'No se pudo cargar',
  description,
  onRetry,
}: {
  title?: string
  description?: string
  onRetry?: () => void
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-10 text-center"
    >
      <AlertCircle className="size-6 text-destructive" aria-hidden />
      <div>
        <p className="font-medium text-destructive">{title}</p>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Reintentar
        </Button>
      )}
    </div>
  )
}
