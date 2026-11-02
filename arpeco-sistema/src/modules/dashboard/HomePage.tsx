import { Link } from 'react-router-dom'
import { useAuth } from '@/modules/auth/useAuth'
import { currentYearPeriod, useReportBusiness, useReportSellers } from '@/modules/reports/queries'
import { formatARS } from '@/shared/lib/money'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { PageHeader } from '@/shared/ui/page-header'
import { usePendientes } from './queries'

export function HomePage() {
  const { profile, user, hasRole } = useAuth()
  const firstName = (profile?.display_name || '').split(' ')[0]
  const isAdminOrDir = hasRole('direction') || hasRole('administration')
  const period = currentYearPeriod()

  const business = useReportBusiness(period, isAdminOrDir)
  const sellers = useReportSellers(period)
  const mine = (sellers.data ?? []).find((s) => s.owner_id === user?.id)
  const pendientes = usePendientes()

  const kpis = isAdminOrDir
    ? [
        { label: 'Vendido (año)', value: fmt(business.data?.sold) },
        { label: 'Cobrado (año)', value: fmt(business.data?.collected) },
        { label: 'Pendiente de cobro', value: fmt(business.data?.pending_collection) },
        { label: 'Ventas', value: business.data ? String(business.data.sales_count ?? 0) : '—' },
      ]
    : [
        { label: 'Mi vendido (año)', value: fmt(mine?.sold) },
        { label: 'Mis ventas', value: mine ? String(mine.sales_count) : '—' },
        { label: 'Mis presupuestos', value: mine ? String(mine.quotes_sent) : '—' },
        {
          label: 'Conversión',
          value: mine?.conversion_pct != null ? `${mine.conversion_pct}%` : 'sin base',
        },
      ]

  return (
    <div>
      <PageHeader
        title={firstName ? `Hola, ${firstName}` : 'Inicio'}
        description="Resumen del año en curso."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <h2 className="mb-3 mt-8 text-lg font-semibold">Pendientes</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {(pendientes.data ?? []).map((p) => (
          <Link key={p.label} to={p.to}>
            <Card className="transition-colors hover:border-primary/40">
              <CardContent className="flex items-center justify-between pt-6">
                <span className="text-sm text-muted-foreground">{p.label}</span>
                <span
                  className={`text-xl font-semibold ${p.count > 0 ? 'text-warning' : 'text-muted-foreground'}`}
                >
                  {p.count}
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}

function fmt(v: number | null | undefined): string {
  return v != null ? formatARS(v) : '—'
}
