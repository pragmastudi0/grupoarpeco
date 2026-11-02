import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useAuth } from '@/modules/auth/useAuth'
import { formatARS, sumMoney } from '@/shared/lib/money'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Field } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { PageHeader } from '@/shared/ui/page-header'
import { EmptyState, ErrorRetry, LoadingState, Spinner } from '@/shared/ui/states'
import {
  useCreateTemplate,
  useDeleteTemplate,
  useTemplateItems,
  useTemplatesQuery,
  useUpdateTemplate,
  type TemplateItem,
} from './templates'

type Draft = { id: string | null; name: string; description: string; items: TemplateItem[] }
const emptyDraft: Draft = { id: null, name: '', description: '', items: [] }

export function PlantillasPage() {
  const { can } = useAuth()
  const canManage = can('presupuestos.manage_templates')
  const list = useTemplatesQuery()
  const [selected, setSelected] = useState<string | null>(null)
  const items = useTemplateItems(selected)
  const create = useCreateTemplate()
  const update = useUpdateTemplate()
  const del = useDeleteTemplate()
  const [draft, setDraft] = useState<Draft | null>(null)
  const [error, setError] = useState<string | null>(null)

  const selectedRow = list.data?.find((t) => t.id === selected)

  // Al elegir una plantilla cargamos su borrador editable una sola vez; un refetch
  // en segundo plano no debe pisar lo que el usuario esté editando.
  useEffect(() => {
    if (selected && selectedRow && items.data && draft?.id !== selected) {
      setDraft({
        id: selected,
        name: selectedRow.name,
        description: selectedRow.description ?? '',
        items: items.data,
      })
    }
  }, [selected, selectedRow, items.data, draft])

  const total = draft ? sumMoney(draft.items.map((i) => i.quantity * i.unit_price)) : null

  const save = async () => {
    if (!draft) return
    setError(null)
    if (draft.name.trim().length < 2) return setError('Ingresá un nombre')
    const items = draft.items.map((it, idx) => ({ ...it, position: idx + 1 }))
    try {
      if (draft.id)
        await update.mutateAsync({
          id: draft.id,
          name: draft.name.trim(),
          description: draft.description,
          items,
        })
      else
        await create.mutateAsync({ name: draft.name.trim(), description: draft.description, items })
      setDraft(null)
      setSelected(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar')
    }
  }

  return (
    <div>
      <PageHeader
        title="Plantillas de presupuestos"
        description="Conjuntos de conceptos reutilizables para no empezar de cero."
        actions={
          canManage && (
            <Button
              onClick={() => {
                setSelected(null)
                setDraft({ ...emptyDraft, items: [] })
              }}
            >
              <Plus /> Nueva plantilla
            </Button>
          )
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[20rem_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Biblioteca</CardTitle>
          </CardHeader>
          <CardContent>
            {list.isPending && <LoadingState />}
            {list.isError && <ErrorRetry onRetry={() => list.refetch()} />}
            {list.isSuccess &&
              (list.data.length === 0 ? (
                <EmptyState title="Sin plantillas" description="Creá la primera." />
              ) : (
                <ul className="space-y-1">
                  {list.data.map((t) => (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelected(t.id)
                          setError(null)
                        }}
                        className={`flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm ${
                          selected === t.id ? 'bg-secondary' : 'hover:bg-muted'
                        }`}
                      >
                        <span className="min-w-0 truncate font-medium">{t.name}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {t.itemCount}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>
              {draft?.id ? 'Editar plantilla' : draft ? 'Nueva plantilla' : 'Detalle'}
            </CardTitle>
            {draft?.id && canManage && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  del.mutate(draft.id!, {
                    onSuccess: () => {
                      setDraft(null)
                      setSelected(null)
                    },
                  })
                }
              >
                <Trash2 className="text-destructive" /> Eliminar
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {!draft ? (
              <p className="text-sm text-muted-foreground">
                {canManage ? 'Elegí una plantilla o creá una nueva.' : 'Elegí una plantilla.'}
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Nombre" htmlFor="plantilla-nombre">
                    <Input
                      id="plantilla-nombre"
                      value={draft.name}
                      disabled={!canManage}
                      onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    />
                  </Field>
                  <Field label="Descripción (opcional)" htmlFor="plantilla-desc">
                    <Input
                      id="plantilla-desc"
                      value={draft.description}
                      disabled={!canManage}
                      onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                    />
                  </Field>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] text-sm">
                    <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="py-2 font-medium">Concepto</th>
                        <th className="py-2 text-right font-medium">Cant.</th>
                        <th className="py-2 text-right font-medium">P. unit.</th>
                        {canManage && <th />}
                      </tr>
                    </thead>
                    <tbody>
                      {draft.items.map((it, idx) => (
                        <tr key={idx} className="border-b border-border last:border-0">
                          <td className="py-2 pr-2">
                            <Input
                              value={it.description}
                              disabled={!canManage}
                              onChange={(e) => {
                                const items = [...draft.items]
                                items[idx] = { ...it, description: e.target.value }
                                setDraft({ ...draft, items })
                              }}
                            />
                          </td>
                          <td className="py-2 pr-2">
                            <Input
                              type="number"
                              className="w-20 text-right"
                              value={it.quantity}
                              disabled={!canManage}
                              onChange={(e) => {
                                const items = [...draft.items]
                                items[idx] = { ...it, quantity: Number(e.target.value) }
                                setDraft({ ...draft, items })
                              }}
                            />
                          </td>
                          <td className="py-2 pr-2">
                            <Input
                              type="number"
                              className="w-28 text-right"
                              value={it.unit_price}
                              disabled={!canManage}
                              onChange={(e) => {
                                const items = [...draft.items]
                                items[idx] = { ...it, unit_price: Number(e.target.value) }
                                setDraft({ ...draft, items })
                              }}
                            />
                          </td>
                          {canManage && (
                            <td className="py-2 text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  setDraft({
                                    ...draft,
                                    items: draft.items.filter((_, i) => i !== idx),
                                  })
                                }
                                aria-label="Quitar concepto"
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

                {canManage && (
                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setDraft({
                          ...draft,
                          items: [
                            ...draft.items,
                            {
                              position: draft.items.length + 1,
                              description: '',
                              quantity: 1,
                              unit_price: 0,
                            },
                          ],
                        })
                      }
                    >
                      <Plus /> Agregar concepto
                    </Button>
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-border pt-3">
                  <span className="text-sm text-muted-foreground">
                    Total de referencia: <strong>{total ? formatARS(total) : formatARS(0)}</strong>
                  </span>
                  {canManage && (
                    <Button onClick={save} disabled={create.isPending || update.isPending}>
                      {(create.isPending || update.isPending) && <Spinner />} Guardar plantilla
                    </Button>
                  )}
                </div>
                {error && (
                  <p
                    className="rounded-md bg-destructive/10 p-2 text-sm text-destructive"
                    role="alert"
                  >
                    {error}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
