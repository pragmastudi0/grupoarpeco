import { Link } from 'react-router-dom'
import { Badge } from '@/shared/ui/badge'
import { Card } from '@/shared/ui/card'
import { PageHeader } from '@/shared/ui/page-header'
import { EmptyState, ErrorRetry, LoadingState } from '@/shared/ui/states'
import { PROJECT_STATUS_LABELS, useProjectsQuery } from './queries'

const VARIANT: Record<string, 'muted' | 'warning' | 'success'> = {
  pending: 'muted',
  in_progress: 'warning',
  finished: 'success',
}

export function ProyectosPage() {
  const query = useProjectsQuery()
  return (
    <div>
      <PageHeader title="Proyectos" description="Trabajos generados por ventas aceptadas." />
      {query.isPending && <LoadingState />}
      {query.isError && <ErrorRetry onRetry={() => query.refetch()} />}
      {query.isSuccess &&
        (query.data.length === 0 ? (
          <EmptyState title="Sin proyectos" description="Se crean al aceptar un presupuesto." />
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Proyecto</th>
                    <th className="px-4 py-3 font-medium">Cliente</th>
                    <th className="px-4 py-3 font-medium">Venta</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {query.data.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-border last:border-0 hover:bg-muted/30"
                    >
                      <td className="px-4 py-3 font-mono text-xs">
                        <Link to={`/proyectos/${p.id}`} className="text-primary hover:underline">
                          {p.commercial_no ?? '—'}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{p.sales?.clients?.legal_name ?? '—'}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {p.sales?.commercial_no ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={VARIANT[p.status]}>{PROJECT_STATUS_LABELS[p.status]}</Badge>
                      </td>
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
