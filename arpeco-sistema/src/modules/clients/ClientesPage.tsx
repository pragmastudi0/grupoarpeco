import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { PageHeader } from '@/shared/ui/page-header'
import { EmptyState, ErrorRetry, LoadingState } from '@/shared/ui/states'
import { NuevoClienteDialog } from './NuevoClienteDialog'
import { useClientsQuery } from './queries'

export function ClientesPage() {
  const [search, setSearch] = useState('')
  const query = useClientsQuery(search)

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Tu cartera de clientes. Buscá antes de dar de alta para evitar duplicados."
        actions={<NuevoClienteDialog />}
      />

      <div className="mb-4 max-w-sm">
        <Input
          placeholder="Buscar por nombre…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Buscar clientes"
        />
      </div>

      {query.isPending && <LoadingState label="Cargando clientes…" />}
      {query.isError && <ErrorRetry onRetry={() => query.refetch()} />}
      {query.isSuccess &&
        (query.data.length === 0 ? (
          <EmptyState
            title={search ? 'Sin resultados' : 'Todavía no hay clientes'}
            description={search ? 'Probá con otro término.' : 'Creá tu primer cliente.'}
            action={!search ? <NuevoClienteDialog /> : undefined}
          />
        ) : (
          <>
            {/* Mobile (<640px): tarjetas */}
            <ul data-testid="clientes-cards" className="space-y-3 sm:hidden">
              {query.data.map((c) => (
                <li key={c.id}>
                  <Link to={`/clientes/${c.id}`} className="block">
                    <Card className="p-4 transition-colors active:bg-muted/40 hover:border-primary/40">
                      <p className="font-medium text-primary">{c.legal_name}</p>
                      <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                        <div className="min-w-0">
                          <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                            CUIT
                          </dt>
                          <dd className="truncate">{c.tax_id ?? '—'}</dd>
                        </div>
                        <div className="min-w-0">
                          <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                            Teléfono
                          </dt>
                          <dd className="truncate">{c.phone ?? '—'}</dd>
                        </div>
                      </dl>
                      {c.email && (
                        <p className="mt-1 truncate text-sm text-muted-foreground">{c.email}</p>
                      )}
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
                      <th className="px-4 py-3 font-medium">Cliente</th>
                      <th className="px-4 py-3 font-medium">CUIT</th>
                      <th className="px-4 py-3 font-medium">Teléfono</th>
                      <th className="px-4 py-3 font-medium">Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {query.data.map((c) => (
                      <tr
                        key={c.id}
                        className="border-b border-border last:border-0 hover:bg-muted/30"
                      >
                        <td className="px-4 py-3 font-medium">
                          <Link to={`/clientes/${c.id}`} className="text-primary hover:underline">
                            {c.legal_name}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{c.tax_id ?? '—'}</td>
                        <td className="px-4 py-3 text-muted-foreground">{c.phone ?? '—'}</td>
                        <td className="px-4 py-3 text-muted-foreground">{c.email ?? '—'}</td>
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
