import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '@/modules/auth/useAuth'
import { formatARS } from '@/shared/lib/money'
import { formatDate, formatDateTime } from '@/shared/lib/format'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Field } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { PageHeader } from '@/shared/ui/page-header'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Spinner } from '@/shared/ui/states'
import { Textarea } from '@/shared/ui/textarea'
import { ErrorRetry, LoadingState } from '@/shared/ui/states'
import { useAddFollowup, useOpportunityQuery, useUpdateStage } from './queries'
import { STAGES, STAGE_LABELS, type Stage } from './stages'

export function OportunidadDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const query = useOpportunityQuery(id)
  const updateStage = useUpdateStage()
  const addFollowup = useAddFollowup()

  const [kind, setKind] = useState('llamada')
  const [summary, setSummary] = useState('')
  const [nextOn, setNextOn] = useState('')

  if (query.isPending) return <LoadingState />
  if (query.isError || !query.data?.opp)
    return (
      <ErrorRetry description="No se encontró la oportunidad." onRetry={() => query.refetch()} />
    )

  const { opp, followups } = query.data

  const submitFollowup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (summary.trim().length < 2) return
    await addFollowup.mutateAsync({
      opportunity_id: opp.id,
      owner_id: user!.id,
      kind,
      summary: summary.trim(),
      next_on: nextOn || null,
    })
    setSummary('')
    setNextOn('')
  }

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-2">
        <Link to="/oportunidades">
          <ArrowLeft /> Oportunidades
        </Link>
      </Button>
      <PageHeader
        title={opp.title}
        description={opp.clients?.legal_name ?? opp.fair_prospects?.company_name ?? undefined}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Estado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Field label="Etapa">
              <Select
                value={opp.stage}
                onValueChange={(v) => updateStage.mutate({ id: opp.id, stage: v as Stage })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STAGE_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            {opp.estimated_amount != null && (
              <p>
                <span className="text-muted-foreground">Estimado: </span>
                {formatARS(opp.estimated_amount)}
              </p>
            )}
            {opp.closed_at && (
              <p className="text-muted-foreground">Cerrada: {formatDateTime(opp.closed_at)}</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Seguimientos</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={submitFollowup}
              className="mb-4 flex flex-col gap-3 rounded-lg border border-border p-3"
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Tipo">
                  <Select value={kind} onValueChange={setKind}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="llamada">Llamada</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="reunion">Reunión</SelectItem>
                      <SelectItem value="visita">Visita</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Próximo contacto (opcional)">
                  <Input type="date" value={nextOn} onChange={(e) => setNextOn(e.target.value)} />
                </Field>
              </div>
              <Field label="Resumen">
                <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} />
              </Field>
              <div>
                <Button type="submit" size="sm" disabled={addFollowup.isPending}>
                  {addFollowup.isPending && <Spinner />}
                  Registrar seguimiento
                </Button>
              </div>
            </form>

            {followups.length === 0 ? (
              <p className="text-sm text-muted-foreground">Todavía no hay seguimientos.</p>
            ) : (
              <ul className="space-y-3">
                {followups.map((f) => (
                  <li key={f.id} className="border-b border-border pb-2 text-sm last:border-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium capitalize">{f.kind}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(f.occurred_at)}
                      </span>
                    </div>
                    <p className="text-muted-foreground">{f.summary}</p>
                    {f.next_on && (
                      <p className="text-xs text-warning">Próximo: {formatDate(f.next_on)}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
