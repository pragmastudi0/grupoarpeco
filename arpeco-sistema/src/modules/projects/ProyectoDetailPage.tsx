import { useState } from 'react'
import { ArrowLeft, CheckCircle2, Plus } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '@/modules/auth/useAuth'
import { useAssignableUsers } from '@/modules/admin/queries'
import { formatARS } from '@/shared/lib/money'
import { formatDate } from '@/shared/lib/format'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
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
import { ErrorRetry, LoadingState, Spinner } from '@/shared/ui/states'
import {
  PROJECT_STATUS_LABELS,
  useAssignManager,
  useCompleteCosts,
  useProjectQuery,
  useRegisterCost,
  useUpdateProjectEvent,
  useUpdateProjectStatus,
  useVoidCost,
} from './queries'

export function ProyectoDetailPage() {
  const { id } = useParams()
  const { can } = useAuth()
  const isDirection = can('proyectos.view_margin')
  const isAdminOrDir = can('proyectos.assign')
  const canComplete = can('proyectos.complete_costs')
  const query = useProjectQuery(id, isDirection)
  const updateStatus = useUpdateProjectStatus(id!)
  const updateEvent = useUpdateProjectEvent(id!)
  const assignManager = useAssignManager(id!)
  const voidCost = useVoidCost(id!)
  const completeCosts = useCompleteCosts(id!)
  const assignable = useAssignableUsers(isAdminOrDir)

  if (query.isPending) return <LoadingState />
  if (query.isError || !query.data?.project)
    return <ErrorRetry description="No se encontró el proyecto." onRetry={() => query.refetch()} />

  const { project, costs, margin } = query.data
  const sale = (
    project as { sales?: { commercial_no: string | null; clients: { legal_name: string } | null } }
  ).sales

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-2">
        <Link to="/proyectos">
          <ArrowLeft /> Proyectos
        </Link>
      </Button>
      <PageHeader
        title={`Proyecto ${project.commercial_no ?? ''}`}
        description={sale?.clients?.legal_name ?? undefined}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Estado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Field label="Estado del trabajo">
              <Select value={project.status} onValueChange={(v) => updateStatus.mutate(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PROJECT_STATUS_LABELS).map(([k, label]) => (
                    <SelectItem key={k} value={k}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            {isAdminOrDir ? (
              <>
                <Field label="Responsable">
                  <Select
                    value={(project as { manager_id: string | null }).manager_id ?? ''}
                    onValueChange={(v) => assignManager.mutate(v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sin asignar" />
                    </SelectTrigger>
                    <SelectContent>
                      {(assignable.data ?? []).map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Fecha del trabajo">
                  <Input
                    type="date"
                    defaultValue={project.event_on ?? ''}
                    onBlur={(e) => updateEvent.mutate(e.target.value || null)}
                  />
                </Field>
              </>
            ) : (
              project.event_on && (
                <p className="text-muted-foreground">Fecha: {formatDate(project.event_on)}</p>
              )
            )}
            <p>
              Costos:{' '}
              {project.costs_complete_at ? (
                <Badge variant="success">Completos</Badge>
              ) : (
                <Badge variant="muted">Abiertos</Badge>
              )}
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Costos</CardTitle>
            <RegistrarCostoDialog projectId={id!} />
          </CardHeader>
          <CardContent>
            {costs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin costos registrados.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {costs.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between gap-2 border-b border-border pb-2 last:border-0"
                  >
                    <span
                      className={c.status === 'void' ? 'text-muted-foreground line-through' : ''}
                    >
                      {formatDate(c.incurred_on)} · {c.description}
                      {c.category ? ` (${c.category})` : ''}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="font-medium">{formatARS(c.amount)}</span>
                      {c.status === 'void' ? (
                        <Badge variant="destructive">Anulado</Badge>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => voidCost.mutate(c.id)}>
                          Anular
                        </Button>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {isDirection && margin && (
              <div className="mt-4 rounded-lg border border-border p-3 text-sm">
                <p className="mb-2 font-medium">Margen (sólo Dirección)</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <Mini
                    label="Venta"
                    value={margin.sale_amount != null ? formatARS(margin.sale_amount) : '—'}
                  />
                  <Mini
                    label="Costo estimado"
                    value={
                      margin.estimated_cost != null
                        ? formatARS(margin.estimated_cost)
                        : 'sin calcular'
                    }
                  />
                  <Mini label="Costo registrado" value={formatARS(margin.recorded_cost ?? 0)} />
                  <Mini
                    label={margin.costs_complete ? 'Margen definitivo' : 'Margen provisional'}
                    value={
                      margin.margin_recorded_pct != null
                        ? `${margin.margin_recorded_pct}%`
                        : 'sin base'
                    }
                  />
                </div>
                {!project.costs_complete_at && canComplete && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3"
                    disabled={completeCosts.isPending}
                    onClick={() => completeCosts.mutate()}
                  >
                    {completeCosts.isPending ? <Spinner /> : <CheckCircle2 />} Confirmar costos
                    completos
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  )
}

function RegistrarCostoDialog({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ amount: '', incurred_on: '', description: '', category: '' })
  const [error, setError] = useState<string | null>(null)
  const register = useRegisterCost(projectId)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!form.amount || Number(form.amount) <= 0) return setError('Importe inválido')
    if (!form.incurred_on) return setError('Ingresá la fecha')
    if (form.description.trim().length < 2) return setError('Ingresá una descripción')
    try {
      await register.mutateAsync({
        amount: Number(form.amount),
        incurred_on: form.incurred_on,
        description: form.description.trim(),
        category: form.category || null,
      })
      setForm({ amount: '', incurred_on: '', description: '', category: '' })
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus /> Costo
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar costo real</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Importe">
              <Input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </Field>
            <Field label="Fecha">
              <Input
                type="date"
                value={form.incurred_on}
                onChange={(e) => setForm({ ...form, incurred_on: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Descripción">
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
          <Field label="Rubro (opcional)">
            <Input
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
          </Field>
          {error && (
            <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={register.isPending}>
              {register.isPending && <Spinner />}
              Registrar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
