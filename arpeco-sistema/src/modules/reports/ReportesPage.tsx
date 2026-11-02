import { useState } from 'react'
import { useAuth } from '@/modules/auth/useAuth'
import { formatARS, formatARSCompact } from '@/shared/lib/money'
import { Badge } from '@/shared/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Field } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { PageHeader } from '@/shared/ui/page-header'
import { LoadingState } from '@/shared/ui/states'
import {
  currentYearPeriod,
  useReportBusiness,
  useReportFairs,
  useReportProfitability,
  useReportSellers,
} from './queries'

export function ReportesPage() {
  const { hasRole } = useAuth()
  const isDirection = hasRole('direction')
  const isAdminOrDir = isDirection || hasRole('administration')
  const [period, setPeriod] = useState(currentYearPeriod())

  const business = useReportBusiness(period, isAdminOrDir)
  const profit = useReportProfitability(period, isDirection)
  const sellers = useReportSellers(period)
  const fairs = useReportFairs(period, isAdminOrDir)

  return (
    <div>
      <PageHeader
        title="Reportes"
        description="Indicadores por período. Zona horaria America/Argentina/Cordoba."
      />

      <div className="mb-6 flex flex-wrap items-end gap-4">
        <Field label="Desde">
          <Input
            type="date"
            value={period.from}
            onChange={(e) => setPeriod({ ...period, from: e.target.value })}
          />
        </Field>
        <Field label="Hasta">
          <Input
            type="date"
            value={period.to}
            onChange={(e) => setPeriod({ ...period, to: e.target.value })}
          />
        </Field>
      </div>

      {isAdminOrDir && (
        <section className="mb-6">
          <h2 className="mb-3 text-lg font-semibold">Negocio</h2>
          {business.isPending ? (
            <LoadingState />
          ) : business.data ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
              <Kpi label="Presupuestado" {...money(business.data.quoted)} />
              <Kpi label="Aceptado" {...money(business.data.accepted)} note="presupuestos" />
              <Kpi label="Vendido" {...money(business.data.sold)} note="ventas confirmadas" />
              <Kpi label="Cobrado" {...money(business.data.collected)} />
              <Kpi label="Facturado" {...money(business.data.invoiced)} />
              <Kpi label="Pendiente cobro" {...money(business.data.pending_collection)} />
              <Kpi label="Ventas" value={String(business.data.sales_count ?? 0)} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sin base en el período.</p>
          )}
        </section>
      )}

      {isDirection && profit.data && (
        <section className="mb-6" data-testid="rentabilidad">
          <h2 className="mb-3 text-lg font-semibold">Rentabilidad</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
            <Kpi label="Vendido" {...money(profit.data.sold_total)} note="Total del período" />
            <Kpi
              label="Costo (completos)"
              {...money(profit.data.cost_complete)}
              note={`${profit.data.jobs_complete} con costos cerrados`}
            />
            <Kpi
              label="Ganancia"
              value={profit.data.gain != null ? formatARSCompact(profit.data.gain) : '—'}
              title={profit.data.gain != null ? formatARS(profit.data.gain) : undefined}
            />
            <Kpi
              label="Margen ponderado"
              value={profit.data.margin_pct != null ? `${profit.data.margin_pct}%` : '—'}
              badge={
                profit.data.jobs_complete > 0 && profit.data.jobs_pending > 0
                  ? 'parcial'
                  : undefined
              }
            />
            <Kpi
              label="Trabajos pendientes"
              value={`${profit.data.jobs_pending}/${profit.data.jobs_total}`}
              note="con costos sin cerrar"
            />
          </div>
          {profit.data.jobs_complete === 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Sin trabajos con costos completos en el período: la rentabilidad no está disponible.
            </p>
          ) : profit.data.jobs_pending > 0 ? (
            <p className="mt-2 text-xs text-warning">
              Rentabilidad parcial: calculada sobre {profit.data.jobs_complete} de{' '}
              {profit.data.jobs_total} trabajos con costos completos.
            </p>
          ) : null}
        </section>
      )}

      <section className="mb-6">
        <h2 className="mb-3 text-lg font-semibold">{isAdminOrDir ? 'Equipo' : 'Mi actividad'}</h2>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Vendedor</th>
                  <th className="px-4 py-3 text-right font-medium">Oportunidades</th>
                  <th className="px-4 py-3 text-right font-medium">Presupuestos</th>
                  <th className="px-4 py-3 text-right font-medium">Ventas</th>
                  <th className="px-4 py-3 text-right font-medium">Vendido</th>
                  <th className="px-4 py-3 text-right font-medium">Conversión</th>
                </tr>
              </thead>
              <tbody>
                {(sellers.data ?? []).map((s) => (
                  <tr key={s.owner_id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium">{s.display_name}</td>
                    <td className="px-4 py-3 text-right">{s.opps_created}</td>
                    <td className="px-4 py-3 text-right">{s.quotes_sent}</td>
                    <td className="px-4 py-3 text-right">{s.sales_count}</td>
                    <td className="px-4 py-3 text-right">{formatARS(s.sold ?? 0)}</td>
                    <td className="px-4 py-3 text-right">
                      {s.conversion_pct != null ? `${s.conversion_pct}%` : 'sin base'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {isAdminOrDir && (fairs.data?.length ?? 0) > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Ferias</h2>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Feria</th>
                    <th className="px-4 py-3 text-right font-medium">Prospectos</th>
                    <th className="px-4 py-3 text-right font-medium">Compradores</th>
                    <th className="px-4 py-3 text-right font-medium">Conversión</th>
                  </tr>
                </thead>
                <tbody>
                  {fairs.data!.map((f) => (
                    <tr key={f.fair_id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 font-medium">{f.name}</td>
                      <td className="px-4 py-3 text-right">{f.prospects}</td>
                      <td className="px-4 py-3 text-right">{f.buyers}</td>
                      <td className="px-4 py-3 text-right">
                        {f.conversion_pct != null ? `${f.conversion_pct}%` : 'sin base'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </section>
      )}
    </div>
  )
}

/** Props de monto compacto + tooltip con el valor completo (evita overflow). */
function money(value: number | null | undefined): { value: string; title?: string } {
  if (value == null) return { value: '—' }
  return { value: formatARSCompact(value), title: formatARS(value) }
}

function Kpi({
  label,
  value,
  title,
  note,
  badge,
}: {
  label: string
  value: string
  title?: string
  note?: string
  badge?: string
}) {
  return (
    <Card className="min-w-0">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between gap-2 text-sm font-medium text-muted-foreground">
          <span className="truncate">{label}</span>
          {badge && <Badge variant="warning">{badge}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="truncate text-xl font-semibold" title={title ?? value}>
          {value}
        </p>
        {note && <p className="mt-1 truncate text-xs text-muted-foreground">{note}</p>}
      </CardContent>
    </Card>
  )
}
