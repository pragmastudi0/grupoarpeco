import { useState } from 'react'
import { ArrowLeft, Plus } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '@/modules/auth/useAuth'
import { formatARS } from '@/shared/lib/money'
import { formatDate } from '@/shared/lib/format'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
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
import { ErrorRetry, LoadingState, Spinner } from '@/shared/ui/states'
import {
  useRegisterInvoice,
  useRegisterPayment,
  useSaleQuery,
  useVoidInvoice,
  useVoidPayment,
} from './queries'

export function VentaDetailPage() {
  const { id } = useParams()
  const { can } = useAuth()
  const canPayments = can('ventas.register_payment')
  const canInvoices = can('ventas.register_invoice')
  const query = useSaleQuery(id)
  const voidPayment = useVoidPayment(id!)
  const voidInvoice = useVoidInvoice(id!)

  if (query.isPending) return <LoadingState />
  if (query.isError || !query.data?.sale)
    return <ErrorRetry description="No se encontró la venta." onRetry={() => query.refetch()} />

  const { sale, project, payments, invoices, balance } = query.data
  const clientName = (sale as { clients?: { legal_name: string } }).clients?.legal_name ?? '—'

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-2">
        <Link to="/ventas">
          <ArrowLeft /> Ventas
        </Link>
      </Button>
      <PageHeader
        title={`Venta ${sale.commercial_no ?? ''}`}
        description={`${clientName} · ${formatDate(sale.accepted_on)}`}
        actions={
          project && (
            <Button asChild variant="outline" size="sm">
              <Link to={`/proyectos/${project.id}`}>Ver proyecto {project.commercial_no}</Link>
            </Button>
          )
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Importe" value={formatARS(sale.amount)} />
        <Kpi label="Cobrado" value={balance ? formatARS(balance.paid ?? 0) : '—'} />
        <Kpi
          label="Pendiente cobro"
          value={balance ? formatARS(balance.pending_collection ?? 0) : '—'}
          warn
        />
        <Kpi
          label="Pendiente facturar"
          value={balance ? formatARS(balance.pending_invoicing ?? 0) : '—'}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Cobros</CardTitle>
            {canPayments && <RegistrarCobroDialog saleId={id!} />}
          </CardHeader>
          <CardContent>
            <MovimientoList
              rows={payments.map((p) => ({
                id: p.id,
                label: formatDate(p.received_on),
                amount: p.amount,
                status: p.status,
              }))}
              onVoid={canPayments ? (pid) => voidPayment.mutate(pid) : undefined}
              empty="Sin cobros registrados."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Facturas</CardTitle>
            {canInvoices && <RegistrarFacturaDialog saleId={id!} />}
          </CardHeader>
          <CardContent>
            <MovimientoList
              rows={invoices.map((i) => ({
                id: i.id,
                label: `${i.invoice_no} · ${formatDate(i.issued_on)}`,
                amount: i.amount,
                status: i.status,
              }))}
              onVoid={canInvoices ? (iid) => voidInvoice.mutate(iid) : undefined}
              empty="Sin facturas registradas."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Kpi({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-xl font-semibold ${warn ? 'text-warning' : ''}`}>{value}</p>
      </CardContent>
    </Card>
  )
}

function MovimientoList({
  rows,
  onVoid,
  empty,
}: {
  rows: { id: string; label: string; amount: number; status: string }[]
  onVoid?: (id: string) => void
  empty: string
}) {
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">{empty}</p>
  return (
    <ul className="space-y-2 text-sm">
      {rows.map((r) => (
        <li
          key={r.id}
          className="flex items-center justify-between gap-2 border-b border-border pb-2 last:border-0"
        >
          <span className={r.status === 'void' ? 'text-muted-foreground line-through' : ''}>
            {r.label}
          </span>
          <span className="flex items-center gap-2">
            <span className="font-medium">{formatARS(r.amount)}</span>
            {r.status === 'void' ? (
              <Badge variant="destructive">Anulado</Badge>
            ) : (
              onVoid && (
                <Button variant="ghost" size="sm" onClick={() => onVoid(r.id)}>
                  Anular
                </Button>
              )
            )}
          </span>
        </li>
      ))}
    </ul>
  )
}

function RegistrarCobroDialog({ saleId }: { saleId: string }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    amount: '',
    received_on: '',
    method: 'transferencia',
    reference: '',
  })
  const [error, setError] = useState<string | null>(null)
  const register = useRegisterPayment(saleId)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!form.amount || Number(form.amount) <= 0) return setError('Importe inválido')
    if (!form.received_on) return setError('Ingresá la fecha')
    try {
      await register.mutateAsync({
        amount: Number(form.amount),
        received_on: form.received_on,
        method: form.method,
        reference: form.reference,
      })
      setForm({ amount: '', received_on: '', method: 'transferencia', reference: '' })
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus /> Cobro
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar cobro</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Importe">
              <Input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </Field>
            <Field label="Fecha">
              <Input
                type="date"
                value={form.received_on}
                onChange={(e) => setForm({ ...form, received_on: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Medio">
            <Input
              value={form.method}
              onChange={(e) => setForm({ ...form, method: e.target.value })}
            />
          </Field>
          <Field label="Referencia (opcional)">
            <Input
              value={form.reference}
              onChange={(e) => setForm({ ...form, reference: e.target.value })}
            />
          </Field>
          {error && (
            <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={register.isPending}>
              {register.isPending && <Spinner />}
              Registrar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function RegistrarFacturaDialog({ saleId }: { saleId: string }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ invoice_no: '', issued_on: '', amount: '' })
  const [error, setError] = useState<string | null>(null)
  const register = useRegisterInvoice(saleId)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!form.invoice_no.trim()) return setError('Ingresá el número')
    if (!form.issued_on) return setError('Ingresá la fecha')
    if (!form.amount || Number(form.amount) <= 0) return setError('Importe inválido')
    try {
      await register.mutateAsync({
        invoice_no: form.invoice_no.trim(),
        issued_on: form.issued_on,
        amount: Number(form.amount),
      })
      setForm({ invoice_no: '', issued_on: '', amount: '' })
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus /> Factura
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar factura emitida</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label="Número de factura">
            <Input
              value={form.invoice_no}
              onChange={(e) => setForm({ ...form, invoice_no: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Fecha">
              <Input
                type="date"
                value={form.issued_on}
                onChange={(e) => setForm({ ...form, issued_on: e.target.value })}
              />
            </Field>
            <Field label="Importe">
              <Input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </Field>
          </div>
          {error && (
            <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={register.isPending}>
              {register.isPending && <Spinner />}
              Registrar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
