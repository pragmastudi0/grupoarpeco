import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/shared/supabase/client'
import { formatDateTime } from '@/shared/lib/format'
import { Badge } from '@/shared/ui/badge'
import { Card } from '@/shared/ui/card'
import { PageHeader } from '@/shared/ui/page-header'
import { EmptyState, ErrorRetry, LoadingState } from '@/shared/ui/states'

export function AuditoriaPage() {
  const query = useQuery({
    queryKey: ['audit', 'recent'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_events')
        .select('id, entity_type, entity_id, action, actor_id, occurred_at, reason')
        .order('occurred_at', { ascending: false })
        .limit(100)
      if (error) throw error
      return data ?? []
    },
  })

  return (
    <div>
      <PageHeader
        title="Auditoría"
        description="Últimos 100 eventos. Registro append-only de acciones sensibles."
      />
      {query.isPending && <LoadingState />}
      {query.isError && <ErrorRetry onRetry={() => query.refetch()} />}
      {query.isSuccess &&
        (query.data.length === 0 ? (
          <EmptyState
            title="Sin eventos"
            description="Todavía no se registraron acciones auditadas."
          />
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Fecha</th>
                    <th className="px-4 py-3 font-medium">Entidad</th>
                    <th className="px-4 py-3 font-medium">Acción</th>
                    <th className="px-4 py-3 font-medium">Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {query.data.map((e) => (
                    <tr key={e.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDateTime(e.occurred_at)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="muted">{e.entity_type}</Badge>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{e.action}</td>
                      <td className="px-4 py-3 text-muted-foreground">{e.reason ?? '—'}</td>
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
