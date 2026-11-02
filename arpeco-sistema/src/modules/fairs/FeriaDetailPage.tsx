import { useState } from 'react'
import { ArrowLeft, Plus } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '@/modules/auth/useAuth'
import { useClientsQuery } from '@/modules/clients/queries'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
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
import { formatDate } from '@/shared/lib/format'
import { EmptyState, ErrorRetry, LoadingState, Spinner } from '@/shared/ui/states'
import {
  useCreateOppFromProspect,
  useCreateProspect,
  useFairQuery,
  useLinkProspectClient,
  type FairProspect,
} from './queries'

export function FeriaDetailPage() {
  const { id } = useParams()
  const query = useFairQuery(id)

  if (query.isPending) return <LoadingState />
  if (query.isError || !query.data?.fair)
    return <ErrorRetry description="No se encontró la feria." onRetry={() => query.refetch()} />

  const { fair, prospects } = query.data

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-2">
        <Link to="/ferias">
          <ArrowLeft /> Ferias
        </Link>
      </Button>
      <PageHeader
        title={fair.name}
        description={`${fair.place ?? ''} · ${formatDate(fair.starts_on)}`}
        actions={<NuevoProspectoDialog fairId={fair.id} />}
      />

      {prospects.length === 0 ? (
        <EmptyState
          title="Sin prospectos"
          description="Cargá las empresas que conociste en la feria."
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Empresa</th>
                  <th className="px-4 py-3 font-medium">Contacto</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Primer contacto</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {prospects.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium">{p.company_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.contact_name ?? '—'}</td>
                    <td className="px-4 py-3">
                      {p.client_id ? (
                        <Badge variant="success">Vinculado</Badge>
                      ) : (
                        <Badge variant="muted">Sin cliente</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(p.first_seen_on)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ProspectoAcciones fairId={fair.id} prospect={p} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}

function ProspectoAcciones({ fairId, prospect }: { fairId: string; prospect: FairProspect }) {
  const { user } = useAuth()
  const clients = useClientsQuery('')
  const link = useLinkProspectClient(fairId)
  const createOpp = useCreateOppFromProspect(fairId)
  const [openLink, setOpenLink] = useState(false)
  const [openOpp, setOpenOpp] = useState(false)
  const [clientId, setClientId] = useState('')
  const [title, setTitle] = useState(`Oportunidad — ${prospect.company_name}`)

  return (
    <div className="flex items-center justify-end gap-2">
      {!prospect.client_id && (
        <Dialog open={openLink} onOpenChange={setOpenLink}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm">
              Vincular cliente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Vincular con cliente existente</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <Field label="Cliente">
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Elegí un cliente…" />
                  </SelectTrigger>
                  <SelectContent>
                    {(clients.data ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.legal_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <DialogFooter>
                <Button
                  disabled={!clientId || link.isPending}
                  onClick={async () => {
                    await link.mutateAsync({ prospect_id: prospect.id, client_id: clientId })
                    setOpenLink(false)
                  }}
                >
                  {link.isPending && <Spinner />}
                  Vincular
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={openOpp} onOpenChange={setOpenOpp}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            Crear oportunidad
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva oportunidad desde el prospecto</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <Field label="Título" hint="El origen de feria queda registrado automáticamente.">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </Field>
            <DialogFooter>
              <Button
                disabled={title.trim().length < 2 || createOpp.isPending}
                onClick={async () => {
                  await createOpp.mutateAsync({
                    prospect_id: prospect.id,
                    origin_fair_id: fairId,
                    title: title.trim(),
                    owner_id: user!.id,
                  })
                  setOpenOpp(false)
                }}
              >
                {createOpp.isPending && <Spinner />}
                Crear
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function NuevoProspectoDialog({ fairId }: { fairId: string }) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ company_name: '', contact_name: '', phone: '', email: '' })
  const [clientId, setClientId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const create = useCreateProspect()
  const clients = useClientsQuery('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (form.company_name.trim().length < 2) return setError('Ingresá la empresa')
    try {
      await create.mutateAsync({
        fair_id: fairId,
        company_name: form.company_name.trim(),
        contact_name: form.contact_name || null,
        phone: form.phone || null,
        email: form.email || null,
        owner_id: user!.id,
        client_id: clientId || null,
      })
      setForm({ company_name: '', contact_name: '', phone: '', email: '' })
      setClientId('')
      setOpen(false)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No se pudo crear'
      setError(/duplicate|unique/i.test(msg) ? 'Esa empresa ya está cargada en la feria.' : msg)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus /> Nuevo prospecto
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo prospecto</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label="Empresa">
            <Input
              value={form.company_name}
              onChange={(e) => setForm({ ...form, company_name: e.target.value })}
            />
          </Field>
          <Field label="Contacto (opcional)">
            <Input
              value={form.contact_name}
              onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Teléfono">
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Vincular cliente existente (opcional)">
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger>
                <SelectValue placeholder="Sin vincular" />
              </SelectTrigger>
              <SelectContent>
                {(clients.data ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.legal_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {error && (
            <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending && <Spinner />}
              Agregar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
