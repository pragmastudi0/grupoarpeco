import { Link } from 'react-router-dom'
import { formatARS } from '@/shared/lib/money'
import { Badge } from '@/shared/ui/badge'
import { PageHeader } from '@/shared/ui/page-header'
import { ErrorRetry, LoadingState } from '@/shared/ui/states'
import { NuevaOportunidadDialog } from './NuevaOportunidadDialog'
import { useOpportunitiesQuery, type OpportunityWithClient } from './queries'
import { STAGES, STAGE_LABELS, STAGE_VARIANT, type Stage } from './stages'

export function OportunidadesPage() {
  const query = useOpportunitiesQuery()

  return (
    <div>
      <PageHeader
        title="Oportunidades"
        description="Pipeline comercial. También podés presupuestar sin pasar por acá."
        actions={<NuevaOportunidadDialog />}
      />

      {query.isPending && <LoadingState label="Cargando pipeline…" />}
      {query.isError && <ErrorRetry onRetry={() => query.refetch()} />}
      {query.isSuccess && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {STAGES.map((stage) => {
            const items = query.data.filter((o) => o.stage === stage)
            return (
              <div key={stage} className="flex flex-col gap-2">
                <div className="flex items-center justify-between px-1">
                  <Badge variant={STAGE_VARIANT[stage]}>{STAGE_LABELS[stage]}</Badge>
                  <span className="text-xs text-muted-foreground">{items.length}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {items.map((o) => (
                    <OppCard key={o.id} opp={o} />
                  ))}
                  {items.length === 0 && (
                    <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                      Vacío
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function OppCard({ opp }: { opp: OpportunityWithClient }) {
  return (
    <Link
      to={`/oportunidades/${opp.id}`}
      className="block rounded-lg border border-border bg-card p-3 text-sm shadow-sm transition-colors hover:border-primary/40"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium">{opp.title}</p>
        {opp.source === 'web' && (
          <Badge variant="default" className="shrink-0">
            Web
          </Badge>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        {opp.clients?.legal_name ?? opp.fair_prospects?.company_name ?? 'Sin cliente'}
      </p>
      {opp.estimated_amount != null && (
        <p className="mt-1 text-xs font-medium text-foreground">
          {formatARS(opp.estimated_amount)}
        </p>
      )}
      {opp.next_followup_on && (
        <p className="mt-1 text-xs text-warning">Seguir: {opp.next_followup_on}</p>
      )}
    </Link>
  )
}

export type { Stage }
