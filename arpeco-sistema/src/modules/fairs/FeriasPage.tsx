import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/modules/auth/useAuth'
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
import { formatDate } from '@/shared/lib/format'
import { EmptyState, ErrorRetry, LoadingState, Spinner } from '@/shared/ui/states'
import { useCreateFair, useFairsQuery } from './queries'

export function FeriasPage() {
  const { hasRole } = useAuth()
  const query = useFairsQuery()

  return (
    <div>
      <PageHeader
        title="Ferias"
        description="Eventos y su origen de prospectos."
        actions={hasRole('direction') ? <NuevaFeriaDialog /> : undefined}
      />

      {query.isPending && <LoadingState />}
      {query.isError && <ErrorRetry onRetry={() => query.refetch()} />}
      {query.isSuccess &&
        (query.data.length === 0 ? (
          <EmptyState title="Sin ferias" description="Dirección puede crear la primera feria." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {query.data.map((f) => (
              <Link key={f.id} to={`/ferias/${f.id}`}>
                <Card className="p-4 transition-colors hover:border-primary/40">
                  <p className="font-medium">{f.name}</p>
                  <p className="text-sm text-muted-foreground">{f.place ?? 'Sin lugar'}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {formatDate(f.starts_on)}
                    {f.ends_on ? ` — ${formatDate(f.ends_on)}` : ''}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        ))}
    </div>
  )
}

function NuevaFeriaDialog() {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', place: '', starts_on: '', ends_on: '' })
  const [error, setError] = useState<string | null>(null)
  const create = useCreateFair()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (form.name.trim().length < 2) return setError('Ingresá el nombre')
    if (!form.starts_on) return setError('Ingresá la fecha de inicio')
    try {
      await create.mutateAsync({
        name: form.name.trim(),
        place: form.place || null,
        starts_on: form.starts_on,
        ends_on: form.ends_on || null,
      })
      setForm({ name: '', place: '', starts_on: '', ends_on: '' })
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus /> Nueva feria
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva feria</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label="Nombre">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Lugar (opcional)">
            <Input
              value={form.place}
              onChange={(e) => setForm({ ...form, place: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Inicio">
              <Input
                type="date"
                value={form.starts_on}
                onChange={(e) => setForm({ ...form, starts_on: e.target.value })}
              />
            </Field>
            <Field label="Fin (opcional)">
              <Input
                type="date"
                value={form.ends_on}
                onChange={(e) => setForm({ ...form, ends_on: e.target.value })}
              />
            </Field>
          </div>
          {error && (
            <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending && <Spinner />}
              Crear feria
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
