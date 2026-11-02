import { useMemo, useState } from 'react'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Field } from '@/shared/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { LoadingState } from '@/shared/ui/states'
import { useUsersQuery } from './queries'
import {
  useEffectivePermissions,
  usePermissionsCatalog,
  useSetUserPermission,
  type EffectivePermission,
} from './rbac'

const SOURCE_BADGE: Record<
  EffectivePermission['source'],
  { label: string; variant: 'success' | 'destructive' | 'default' | 'muted' }
> = {
  granted: { label: 'Concedido', variant: 'success' },
  denied: { label: 'Denegado', variant: 'destructive' },
  role: { label: 'Por rol', variant: 'default' },
  none: { label: '—', variant: 'muted' },
}

export function PermisosIndividualesPanel() {
  const users = useUsersQuery()
  const catalog = usePermissionsCatalog()
  const [userId, setUserId] = useState<string | null>(null)
  const effective = useEffectivePermissions(userId)
  const setPerm = useSetUserPermission()

  const sourceByCode = useMemo(() => {
    const m = new Map<string, EffectivePermission['source']>()
    for (const e of effective.data ?? []) m.set(e.permission_code, e.source)
    return m
  }, [effective.data])

  const editable = (catalog.data ?? []).filter((p) => !p.reserved)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Permisos individuales</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Field label="Usuario">
          <Select value={userId ?? ''} onValueChange={setUserId}>
            <SelectTrigger className="max-w-sm">
              <SelectValue placeholder="Elegí un usuario…" />
            </SelectTrigger>
            <SelectContent>
              {(users.data ?? []).map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.display_name || u.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        {userId && effective.isPending && <LoadingState />}
        {userId && effective.isSuccess && (
          <>
            <p className="text-xs text-muted-foreground">
              Las denegaciones ganan sobre lo que concede el rol. Los permisos reservados (técnicos)
              no admiten excepción individual.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-4 font-medium">Permiso</th>
                    <th className="py-2 pr-4 font-medium">Efectivo</th>
                    <th className="py-2 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {editable.map((p) => {
                    const src = sourceByCode.get(p.code) ?? 'none'
                    const b = SOURCE_BADGE[src]
                    const busy = setPerm.isPending && setPerm.variables?.perm === p.code
                    return (
                      <tr key={p.code} className="border-b border-border last:border-0">
                        <td className="py-2 pr-4">
                          <span className="font-medium">{p.label}</span>
                          <span className="ml-2 font-mono text-xs text-muted-foreground">
                            {p.code}
                          </span>
                        </td>
                        <td className="py-2 pr-4">
                          <Badge variant={b.variant}>{b.label}</Badge>
                        </td>
                        <td className="py-2">
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={busy}
                              onClick={() =>
                                setPerm.mutate({ user: userId, perm: p.code, effect: 'grant' })
                              }
                            >
                              Conceder
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={busy}
                              onClick={() =>
                                setPerm.mutate({ user: userId, perm: p.code, effect: 'deny' })
                              }
                            >
                              Denegar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={busy || (src !== 'granted' && src !== 'denied')}
                              onClick={() =>
                                setPerm.mutate({ user: userId, perm: p.code, effect: null })
                              }
                            >
                              Limpiar
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
