import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/modules/auth/useAuth'
import { useClientsQuery } from '@/modules/clients/queries'
import { formatARS } from '@/shared/lib/money'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog'
import { Field } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { PageHeader } from '@/shared/ui/page-header'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { EmptyState, ErrorRetry, LoadingState, Spinner } from '@/shared/ui/states'
import { useCreateQuote, useQuotesQuery } from './queries'
import { useCreateQuoteFromTemplate, useTemplatesQuery } from './templates'
import { QUOTE_STATUS_LABELS, QUOTE_STATUS_VARIANT } from './status'

export function PresupuestosPage() {
  const query = useQuotesQuery()
  return (
    <div>
      <PageHeader
        title="Presupuestos"
        description="Cotizaciones por cliente. Un presupuesto aceptado genera la venta y el proyecto."
        actions={<NuevoPresupuestoDialog />}
      />
      {query.isPending && <LoadingState />}
      {query.isError && <ErrorRetry onRetry={() => query.refetch()} />}
      {query.isSuccess &&
        (query.data.length === 0 ? (
          <EmptyState
            title="Sin presupuestos"
            description="Creá el primero."
            action={<NuevoPresupuestoDialog />}
          />
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Número</th>
                    <th className="px-4 py-3 font-medium">Título</th>
                    <th className="px-4 py-3 font-medium">Cliente</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
                    <th className="px-4 py-3 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {query.data.map((q) => (
                    <tr
                      key={q.id}
                      className="border-b border-border last:border-0 hover:bg-muted/30"
                    >
                      <td className="px-4 py-3 font-mono text-xs">
                        <Link to={`/presupuestos/${q.id}`} className="text-primary hover:underline">
                          {q.commercial_no ?? '—'}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{q.title}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {q.clients?.legal_name ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={QUOTE_STATUS_VARIANT[q.status]}>
                          {QUOTE_STATUS_LABELS[q.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{formatARS(q.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ))}
    </div>
  )
}

function NuevoPresupuestoDialog() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [clientId, setClientId] = useState('')
  const [title, setTitle] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const clients = useClientsQuery('')
  const templates = useTemplatesQuery()
  const create = useCreateQuote()
  const fromTemplate = useCreateQuoteFromTemplate()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!clientId) return setError('Elegí un cliente')
    if (title.trim().length < 2) return setError('Ingresá un título')
    try {
      const id = templateId
        ? await fromTemplate.mutateAsync({ templateId, clientId, title: title.trim() })
        : (
            await create.mutateAsync({
              client_id: clientId,
              title: title.trim(),
              owner_id: user!.id,
            })
          ).id
      setOpen(false)
      setClientId('')
      setTitle('')
      setTemplateId('')
      navigate(`/presupuestos/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear')
    }
  }
  const pending = create.isPending || fromTemplate.isPending

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus /> Nuevo presupuesto
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo presupuesto</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label="Cliente">
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger>
                <SelectValue placeholder="Elegí un cliente…" />
              </SelectTrigger>
              <SelectContent>
                {(clients.data ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.legal_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Título">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field
            label="Usar plantilla (opcional)"
            hint="Copia los conceptos de la plantilla elegida."
          >
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger>
                <SelectValue placeholder="Sin plantilla (en blanco)" />
              </SelectTrigger>
              <SelectContent>
                {(templates.data ?? []).map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} ({t.itemCount})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {error && (
            <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending && <Spinner />}
              Crear y editar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
