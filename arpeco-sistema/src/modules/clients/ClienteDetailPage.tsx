import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '@/modules/auth/useAuth'
import { useAssignableUsers } from '@/modules/admin/queries'
import { STAGE_LABELS } from '@/modules/crm/stages'
import { supabase } from '@/shared/supabase/client'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Field } from '@/shared/ui/field'
import { formatARS } from '@/shared/lib/money'
import { PageHeader } from '@/shared/ui/page-header'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { ErrorRetry, LoadingState, Spinner } from '@/shared/ui/states'
import {
  useClientDedup,
  useClientFinancials,
  useClientQuery,
  useMergeClient,
  useReassignOwner,
} from './queries'

export function ClienteDetailPage() {
  const { id } = useParams()
  const { can } = useAuth()
  const isAdminOrDir = can('clientes.merge')
  const query = useClientQuery(id)
  const financials = useClientFinancials(id)

  const opps = useQuery({
    queryKey: ['opportunities', 'by-client', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('opportunities')
        .select('id, title, stage, estimated_amount')
        .eq('client_id', id!)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })

  if (query.isPending) return <LoadingState />
  if (query.isError || !query.data?.client)
    return <ErrorRetry description="No se encontró el cliente." onRetry={() => query.refetch()} />

  const { client, contacts } = query.data
  const primary = contacts.find((c) => c.is_primary) ?? contacts[0]

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-2">
        <Link to="/clientes">
          <ArrowLeft /> Clientes
        </Link>
      </Button>
      <PageHeader title={client.legal_name} description={client.industry ?? undefined} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Datos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="CUIT" value={client.tax_id} />
            <Row label="Teléfono" value={client.phone} />
            <Row label="Email" value={client.email} />
            <Row label="Dirección" value={client.address} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contacto principal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {primary ? (
              <>
                <Row label="Nombre" value={primary.name} />
                <Row label="Teléfono" value={primary.phone} />
                <Row label="Email" value={primary.email} />
              </>
            ) : (
              <p className="text-muted-foreground">Sin contacto cargado.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Situación comercial</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {financials.data ? (
              <>
                <Row label="Ventas" value={String(financials.data.salesCount)} />
                <Row label="Vendido" value={formatARS(financials.data.sold)} />
                <Row label="Cobrado" value={formatARS(financials.data.paid)} />
                <div className="flex justify-between gap-4 font-medium">
                  <span className="text-muted-foreground">Saldo pendiente</span>
                  <span className="text-warning">{formatARS(financials.data.pending)}</span>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">Sin ventas.</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Oportunidades</CardTitle>
          </CardHeader>
          <CardContent>
            {opps.isPending && <p className="text-sm text-muted-foreground">Cargando…</p>}
            {opps.data && opps.data.length === 0 && (
              <p className="text-sm text-muted-foreground">Sin oportunidades.</p>
            )}
            <ul className="space-y-2">
              {opps.data?.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-2 text-sm">
                  <span>{o.title}</span>
                  <span className="flex items-center gap-2">
                    {o.estimated_amount != null && (
                      <span className="text-muted-foreground">{formatARS(o.estimated_amount)}</span>
                    )}
                    <Badge variant="muted">
                      {STAGE_LABELS[o.stage as keyof typeof STAGE_LABELS]}
                    </Badge>
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {isAdminOrDir && id && <AdminPanel clientId={id} />}
    </div>
  )
}

function AdminPanel({ clientId }: { clientId: string }) {
  const assignable = useAssignableUsers(true)
  const reassign = useReassignOwner(clientId)
  const merge = useMergeClient(clientId)
  const [owner, setOwner] = useState('')
  const [search, setSearch] = useState('')
  const [mergeInto, setMergeInto] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const dedup = useClientDedup(search)

  return (
    <Card className="mt-4 border-dashed">
      <CardHeader>
        <CardTitle>Administración (Dirección / Administración)</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Field label="Reasignar vendedor">
            <Select value={owner} onValueChange={setOwner}>
              <SelectTrigger>
                <SelectValue placeholder="Elegí un usuario…" />
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
          <Button
            size="sm"
            variant="outline"
            disabled={!owner || reassign.isPending}
            onClick={async () => {
              setMsg(null)
              await reassign.mutateAsync(owner)
              setMsg('Vendedor reasignado.')
            }}
          >
            {reassign.isPending && <Spinner />} Reasignar
          </Button>
        </div>

        <div className="space-y-2">
          <Field
            label="Fusionar en otro cliente"
            hint="Buscá el cliente destino (quedará este como fusionado)."
          >
            <input
              className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
              placeholder="Buscar destino…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Field>
          <div className="flex flex-col gap-1">
            {(dedup.data ?? [])
              .filter((c) => c.id !== clientId)
              .map((c) => (
                <label key={c.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="merge-into"
                    checked={mergeInto === c.id}
                    onChange={() => setMergeInto(c.id)}
                  />
                  {c.legal_name}
                </label>
              ))}
          </div>
          <Button
            size="sm"
            variant="outline"
            disabled={!mergeInto || merge.isPending}
            onClick={async () => {
              setMsg(null)
              await merge.mutateAsync(mergeInto)
              setMsg('Clientes fusionados.')
            }}
          >
            {merge.isPending && <Spinner />} Fusionar
          </Button>
        </div>
        {msg && (
          <p
            className="md:col-span-2 rounded-md bg-success/10 p-2 text-sm text-success"
            role="status"
          >
            {msg}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{value ?? '—'}</span>
    </div>
  )
}
