import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { pdf } from '@react-pdf/renderer'
import { supabase } from '@/shared/supabase/client'
import { ArrowLeft, CheckCircle2, Copy, Download, Plus, Save, Send, Trash2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/modules/auth/useAuth'
import { formatARS } from '@/shared/lib/money'
import { formatDate } from '@/shared/lib/format'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog'
import { Field } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { PageHeader } from '@/shared/ui/page-header'
import { Textarea } from '@/shared/ui/textarea'
import { ErrorRetry, LoadingState, Spinner } from '@/shared/ui/states'
import { usePdfIdentity } from '@/modules/admin/settings'
import { QuotePdf } from './QuotePdf'
import {
  useAcceptQuote,
  useConfirmSale,
  useDeleteItem,
  useDuplicateQuote,
  useQuoteLifecycle,
  useQuoteMargin,
  useQuoteQuery,
  useSetQuoteInternal,
  useUpsertItem,
} from './queries'
import { useSaveQuoteAsTemplate } from './templates'
import { QUOTE_STATUS_LABELS, QUOTE_STATUS_VARIANT } from './status'

export function PresupuestoDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { can } = useAuth()
  const isDirection = can('presupuestos.view_margin')
  const query = useQuoteQuery(id)
  const lifecycle = useQuoteLifecycle(id!)
  const accept = useAcceptQuote(id!)
  const duplicate = useDuplicateQuote()
  const upsertItem = useUpsertItem(id!)
  const deleteItem = useDeleteItem(id!)
  const margin = useQuoteMargin(id, isDirection)
  const setInternal = useSetQuoteInternal(id!)
  const identity = usePdfIdentity()

  const [downloading, setDownloading] = useState(false)

  if (query.isPending) return <LoadingState />
  if (query.isError || !query.data?.quote)
    return (
      <ErrorRetry description="No se encontró el presupuesto." onRetry={() => query.refetch()} />
    )

  const { quote, items } = query.data
  const isDraft = quote.status === 'draft'
  const clientName = (quote as { clients?: { legal_name: string } }).clients?.legal_name ?? '—'

  const downloadPdf = async () => {
    setDownloading(true)
    try {
      const blob = await pdf(
        <QuotePdf
          data={{
            commercial_no: quote.commercial_no,
            title: quote.title,
            issued_on: quote.issued_on,
            valid_until: quote.valid_until,
            total: quote.total,
            public_notes: quote.public_notes,
            client_name: clientName,
            business_name: identity.data?.business_name ?? 'Grupo Arpeco',
            business_tax_id: identity.data?.tax_id,
            business_contact: identity.data?.contact,
            business_address: identity.data?.address,
            items,
          }}
        />,
      ).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${pdfFileName(quote.commercial_no, clientName)}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-2">
        <Link to="/presupuestos">
          <ArrowLeft /> Presupuestos
        </Link>
      </Button>
      <PageHeader
        title={`${quote.commercial_no ?? 'Borrador'} · ${quote.title}`}
        description={`${clientName} · Revisión ${quote.revision}`}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={QUOTE_STATUS_VARIANT[quote.status]}>
              {QUOTE_STATUS_LABELS[quote.status]}
            </Badge>
            <Button variant="outline" size="sm" onClick={downloadPdf} disabled={downloading}>
              {downloading ? <Spinner /> : <Download />} PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={duplicate.isPending}
              onClick={async () => {
                const newId = await duplicate.mutateAsync(quote.id)
                navigate(`/presupuestos/${newId}`)
              }}
            >
              {duplicate.isPending ? <Spinner /> : <Copy />} Duplicar
            </Button>
            {can('presupuestos.manage_templates') && <GuardarPlantillaDialog quoteId={quote.id} />}
            {isDraft && (
              <Button
                size="sm"
                onClick={() => lifecycle.send.mutate()}
                disabled={lifecycle.send.isPending || items.length === 0}
              >
                {lifecycle.send.isPending ? <Spinner /> : <Send />} Enviar
              </Button>
            )}
            {quote.status === 'sent' && (
              <>
                <Button
                  size="sm"
                  disabled={accept.isPending}
                  onClick={() => accept.mutate(quote.revision)}
                >
                  {accept.isPending ? <Spinner /> : <CheckCircle2 />} Aceptar
                </Button>
                <Button variant="outline" size="sm" onClick={() => lifecycle.revise.mutate()}>
                  Revisar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => lifecycle.reject.mutate('Rechazado desde panel')}
                >
                  Rechazar
                </Button>
              </>
            )}
            {quote.status === 'accepted' && (
              <ConfirmSaleAction
                quoteId={quote.id}
                revision={quote.revision}
                commercialNo={quote.commercial_no}
                title={quote.title}
                clientName={clientName}
                total={quote.total}
              />
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Conceptos</CardTitle>
            {isDraft && (
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  upsertItem.mutate({
                    position: (items.at(-1)?.position ?? 0) + 1,
                    description: 'Nuevo concepto',
                    quantity: 1,
                    unit_price: 0,
                  })
                }
              >
                <Plus /> Agregar
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin conceptos. Agregá el primero.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="py-2 font-medium">Concepto</th>
                      <th className="py-2 text-right font-medium">Cant.</th>
                      <th className="py-2 text-right font-medium">P. unit.</th>
                      <th className="py-2 text-right font-medium">Subtotal</th>
                      {isDraft && <th />}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it) => (
                      <tr key={it.id} className="border-b border-border last:border-0">
                        <td className="py-2">
                          {isDraft ? (
                            <Input
                              defaultValue={it.description}
                              onBlur={(e) =>
                                upsertItem.mutate({
                                  id: it.id,
                                  position: it.position,
                                  description: e.target.value,
                                  quantity: Number(it.quantity),
                                  unit_price: Number(it.unit_price),
                                })
                              }
                            />
                          ) : (
                            it.description
                          )}
                        </td>
                        <td className="py-2 text-right">
                          {isDraft ? (
                            <Input
                              type="number"
                              className="w-20 text-right"
                              defaultValue={Number(it.quantity)}
                              onBlur={(e) =>
                                upsertItem.mutate({
                                  id: it.id,
                                  position: it.position,
                                  description: it.description,
                                  quantity: Number(e.target.value),
                                  unit_price: Number(it.unit_price),
                                })
                              }
                            />
                          ) : (
                            Number(it.quantity)
                          )}
                        </td>
                        <td className="py-2 text-right">
                          {isDraft ? (
                            <Input
                              type="number"
                              className="w-28 text-right"
                              defaultValue={Number(it.unit_price)}
                              onBlur={(e) =>
                                upsertItem.mutate({
                                  id: it.id,
                                  position: it.position,
                                  description: it.description,
                                  quantity: Number(it.quantity),
                                  unit_price: Number(e.target.value),
                                })
                              }
                            />
                          ) : (
                            formatARS(it.unit_price)
                          )}
                        </td>
                        <td className="py-2 text-right font-medium">{formatARS(it.subtotal)}</td>
                        {isDraft && (
                          <td className="py-2 pl-2 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteItem.mutate(it.id)}
                              aria-label="Eliminar concepto"
                            >
                              <Trash2 className="text-destructive" />
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="mt-4 flex justify-end">
              <div className="rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground">
                Total: {formatARS(quote.total)}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Condiciones (públicas)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {quote.issued_on && (
                <p className="text-muted-foreground">Emitido: {formatDate(quote.issued_on)}</p>
              )}
              <p className="whitespace-pre-wrap">
                {quote.public_notes ?? 'Sin condiciones cargadas.'}
              </p>
            </CardContent>
          </Card>

          {isDirection && (
            <Card>
              <CardHeader>
                <CardTitle>Interno (sólo Dirección)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <CostMarginEditor
                  cost={margin.data?.estimated_cost ?? null}
                  marginPct={margin.data?.margin_pct ?? null}
                  notes={margin.data?.internal_notes ?? null}
                  saving={setInternal.isPending}
                  onSave={(cost, notes) => setInternal.mutate({ cost, notes })}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function CostMarginEditor({
  cost,
  marginPct,
  notes,
  saving,
  onSave,
}: {
  cost: number | null
  marginPct: number | null
  notes: string | null
  saving: boolean
  onSave: (cost: number | null, notes: string | null) => void
}) {
  const [costStr, setCostStr] = useState(cost != null ? String(cost) : '')
  const [notesStr, setNotesStr] = useState(notes ?? '')

  return (
    <>
      <Field label="Costo estimado">
        <Input type="number" value={costStr} onChange={(e) => setCostStr(e.target.value)} />
      </Field>
      <p className="text-muted-foreground">
        Margen: {marginPct != null ? `${marginPct}%` : 'sin calcular'}
      </p>
      <Field label="Notas internas">
        <Textarea value={notesStr} onChange={(e) => setNotesStr(e.target.value)} />
      </Field>
      <Button
        size="sm"
        variant="outline"
        disabled={saving}
        onClick={() => onSave(costStr ? Number(costStr) : null, notesStr || null)}
      >
        {saving && <Spinner />}
        Guardar interno
      </Button>
    </>
  )
}

/**
 * Presupuesto aceptado: si ya hay venta muestra "Ver venta"; si no, el botón
 * "Confirmar venta" con un modal de confirmación (datos + precio) que crea la
 * venta + proyecto (confirm_sale) y navega a la venta.
 */
function ConfirmSaleAction({
  quoteId,
  revision,
  commercialNo,
  title,
  clientName,
  total,
}: {
  quoteId: string
  revision: number
  commercialNo: string | null
  title: string
  clientName: string
  total: number
}) {
  const navigate = useNavigate()
  const { can } = useAuth()
  const confirm = useConfirmSale(quoteId)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const sale = useQuery({
    queryKey: ['sales', 'by-quote', quoteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales')
        .select('id, commercial_no')
        .eq('quote_id', quoteId)
        .maybeSingle()
      if (error) throw error
      return data
    },
  })

  if (sale.data) {
    return (
      <Button asChild size="sm">
        <Link to={`/ventas/${sale.data.id}`}>Ver venta {sale.data.commercial_no}</Link>
      </Button>
    )
  }
  if (!can('ventas.confirm')) return null

  const doConfirm = async () => {
    setError(null)
    try {
      const res = await confirm.mutateAsync(revision)
      if (res?.sale_id) navigate(`/ventas/${res.sale_id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo confirmar')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <CheckCircle2 /> Confirmar venta
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar venta</DialogTitle>
          <DialogDescription>
            Se generará la venta y el proyecto a partir de este presupuesto aceptado.
          </DialogDescription>
        </DialogHeader>
        <dl className="space-y-1 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Presupuesto</span>
            <span>{commercialNo ?? '—'}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Cliente</span>
            <span className="text-right">{clientName}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Detalle</span>
            <span className="text-right">{title}</span>
          </div>
          <div className="flex justify-between gap-4 border-t border-border pt-2 font-medium">
            <span className="text-muted-foreground">Precio confirmado</span>
            <span>{formatARS(total)}</span>
          </div>
        </dl>
        {error && (
          <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <DialogFooter>
          <Button onClick={doConfirm} disabled={confirm.isPending}>
            {confirm.isPending && <Spinner />} Confirmar venta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Nombre de archivo PDF: "<número> - <cliente>", saneado para el sistema de archivos. */
function pdfFileName(commercialNo: string | null, clientName: string): string {
  const clean = (s: string) =>
    s
      .replace(/[/\\:*?"<>|]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  const parts = [commercialNo, clientName].map((p) => clean(p ?? '')).filter(Boolean)
  return parts.join(' - ') || 'presupuesto'
}

function GuardarPlantillaDialog({ quoteId }: { quoteId: string }) {
  const save = useSaveQuoteAsTemplate()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (name.trim().length < 2) return setError('Ingresá un nombre')
    try {
      await save.mutateAsync({ quoteId, name: name.trim(), description: description || undefined })
      setDone(true)
      setName('')
      setDescription('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Save /> Guardar como plantilla
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Guardar como plantilla</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label="Nombre de la plantilla" htmlFor="tpl-name">
            <Input id="tpl-name" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Descripción (opcional)" htmlFor="tpl-desc">
            <Input
              id="tpl-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
          {error && (
            <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          {done && (
            <p className="rounded-md bg-success/10 p-2 text-sm text-success" role="status">
              Plantilla guardada.
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending && <Spinner />} Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
