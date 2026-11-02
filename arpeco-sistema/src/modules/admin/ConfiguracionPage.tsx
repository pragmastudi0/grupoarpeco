import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Field } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { Textarea } from '@/shared/ui/textarea'
import { PageHeader } from '@/shared/ui/page-header'
import { ErrorRetry, LoadingState, Spinner } from '@/shared/ui/states'
import { usePdfIdentity, useSavePdfIdentity, type PdfIdentity } from './settings'

export function ConfiguracionPage() {
  const query = usePdfIdentity()
  const save = useSavePdfIdentity()
  const [form, setForm] = useState<PdfIdentity>({ business_name: '' })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (query.data) setForm(query.data)
  }, [query.data])

  if (query.isPending) return <LoadingState />
  if (query.isError) return <ErrorRetry onRetry={() => query.refetch()} />

  const onSave = async () => {
    setSaved(false)
    await save.mutateAsync(form)
    setSaved(true)
  }

  return (
    <div>
      <PageHeader
        title="Configuración"
        description="Identidad que aparece en los presupuestos en PDF (a validar con Arpeco — D08)."
      />
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Identidad del PDF</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field label="Razón social / nombre comercial">
            <Input
              value={form.business_name}
              onChange={(e) => setForm({ ...form, business_name: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="CUIT (opcional)">
              <Input
                value={form.tax_id ?? ''}
                onChange={(e) => setForm({ ...form, tax_id: e.target.value })}
              />
            </Field>
            <Field label="Contacto (opcional)">
              <Input
                value={form.contact ?? ''}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Dirección (opcional)">
            <Input
              value={form.address ?? ''}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </Field>
          <Field label="Nota al pie (opcional)">
            <Textarea
              value={form.note ?? ''}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </Field>
          {saved && (
            <p className="rounded-md bg-success/10 p-2 text-sm text-success" role="status">
              Configuración guardada.
            </p>
          )}
          <div>
            <Button
              onClick={onSave}
              disabled={save.isPending || form.business_name.trim().length < 2}
            >
              {save.isPending && <Spinner />}
              Guardar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
