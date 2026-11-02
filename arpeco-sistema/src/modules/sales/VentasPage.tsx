import { Link } from 'react-router-dom'
import { formatARS } from '@/shared/lib/money'
import { formatDate } from '@/shared/lib/format'
import { Card } from '@/shared/ui/card'
import { PageHeader } from '@/shared/ui/page-header'
import { EmptyState, ErrorRetry, LoadingState } from '@/shared/ui/states'
import { useSalesQuery } from './queries'

export function VentasPage() {
  const query = useSalesQuery()
  return (
    <div>
      <PageHeader
        title="Ventas y cobros"
        description="Ventas generadas desde presupuestos aceptados, con su saldo de cobro."
      />
      {query.isPending && <LoadingState />}
      {query.isError && <ErrorRetry onRetry={() => query.refetch()} />}
      {query.isSuccess &&
        (query.data.length === 0 ? (
          <EmptyState
            title="Todavía no hay ventas"
            description="Aceptá un presupuesto enviado para generar la primera venta."
          />
        ) : (
          <>
            {/* Mobile (<640px): tarjetas */}
            <ul data-testid="ventas-cards" className="space-y-3 sm:hidden">
              {query.data.map((s) => (
                <li key={s.id}>
                  <Link to={`/ventas/${s.id}`} className="block">
                    <Card className="p-4 transition-colors active:bg-muted/40 hover:border-primary/40">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs text-primary">
                          {s.commercial_no ?? '—'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(s.accepted_on)}
                        </span>
                      </div>
                      <p className="mt-1 font-medium">{s.clients?.legal_name ?? '—'}</p>
                      <div className="mt-2 flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Importe{' '}
                          <span className="font-medium text-foreground">{formatARS(s.amount)}</span>
                        </span>
                        <span className="text-warning">
                          Pendiente {s.balance ? formatARS(s.balance.pending_collection) : '—'}
                        </span>
                      </div>
                    </Card>
                  </Link>
                </li>
              ))}
            </ul>

            {/* Desktop (≥640px): tabla */}
            <Card className="hidden overflow-hidden sm:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Venta</th>
                      <th className="px-4 py-3 font-medium">Cliente</th>
                      <th className="px-4 py-3 font-medium">Fecha</th>
                      <th className="px-4 py-3 text-right font-medium">Importe</th>
                      <th className="px-4 py-3 text-right font-medium">Pendiente cobro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {query.data.map((s) => (
                      <tr
                        key={s.id}
                        className="border-b border-border last:border-0 hover:bg-muted/30"
                      >
                        <td className="px-4 py-3 font-mono text-xs">
                          <Link to={`/ventas/${s.id}`} className="text-primary hover:underline">
                            {s.commercial_no ?? '—'}
                          </Link>
                        </td>
                        <td className="px-4 py-3">{s.clients?.legal_name ?? '—'}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDate(s.accepted_on)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium">{formatARS(s.amount)}</td>
                        <td className="px-4 py-3 text-right text-warning">
                          {s.balance ? formatARS(s.balance.pending_collection) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        ))}
    </div>
  )
}
