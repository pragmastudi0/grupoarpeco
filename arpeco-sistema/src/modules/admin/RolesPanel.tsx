import { useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useAuth } from '@/modules/auth/useAuth'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { ErrorRetry, LoadingState, Spinner } from '@/shared/ui/states'
import {
  useCreateRole,
  useDeleteRole,
  usePermissionsCatalog,
  useRolePermissions,
  useRolesQuery,
  useSetRolePermissions,
  type Permission,
} from './rbac'

const MODULE_LABELS: Record<string, string> = {
  clientes: 'Clientes',
  oportunidades: 'Oportunidades',
  ferias: 'Ferias',
  presupuestos: 'Presupuestos',
  ventas: 'Ventas',
  proyectos: 'Proyectos',
  reportes: 'Reportes',
  usuarios: 'Usuarios',
  roles: 'Roles',
  auditoria: 'Auditoría',
  config: 'Configuración',
}

export function RolesPanel() {
  const { hasRole } = useAuth()
  const isSuperadmin = hasRole('superadmin')
  const roles = useRolesQuery()
  const catalog = usePermissionsCatalog()
  const [selected, setSelected] = useState<string | null>(null)
  const rolePerms = useRolePermissions(selected)
  const setPerms = useSetRolePermissions()
  const deleteRole = useDeleteRole()
  const [draft, setDraft] = useState<Set<string> | null>(null)
  const [error, setError] = useState<string | null>(null)

  const selectedRole = roles.data?.find((r) => r.code === selected)
  const editable = selectedRole && (!selectedRole.is_system || isSuperadmin)

  // Sincroniza el draft con los permisos cargados del rol.
  const baseline = useMemo(() => new Set(rolePerms.data ?? []), [rolePerms.data])
  const current = draft ?? baseline
  const dirty =
    draft != null && (draft.size !== baseline.size || [...draft].some((p) => !baseline.has(p)))

  const byModule = useMemo(() => {
    const map = new Map<string, Permission[]>()
    for (const p of catalog.data ?? []) {
      if (!map.has(p.module)) map.set(p.module, [])
      map.get(p.module)!.push(p)
    }
    return [...map.entries()]
  }, [catalog.data])

  const toggle = (code: string) => {
    const next = new Set(current)
    if (next.has(code)) next.delete(code)
    else next.add(code)
    setDraft(next)
  }

  const save = async () => {
    if (!selected || !draft) return
    setError(null)
    try {
      await setPerms.mutateAsync({ code: selected, perms: [...draft] })
      setDraft(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar')
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[18rem_1fr]">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Roles</CardTitle>
          <NuevoRolDialog
            roles={(roles.data ?? []).map((r) => ({ code: r.code, label: r.label }))}
          />
        </CardHeader>
        <CardContent>
          {roles.isPending && <LoadingState />}
          {roles.isError && <ErrorRetry onRetry={() => roles.refetch()} />}
          <ul className="space-y-1">
            {(roles.data ?? []).map((r) => (
              <li key={r.code}>
                <button
                  type="button"
                  onClick={() => {
                    setSelected(r.code)
                    setDraft(null)
                    setError(null)
                  }}
                  className={`flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm ${
                    selected === r.code ? 'bg-secondary' : 'hover:bg-muted'
                  }`}
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate font-medium">{r.label}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {r.userCount} usuario(s)
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1">
                    {r.protected && <Badge variant="warning">protegido</Badge>}
                    {r.is_system && !r.protected && <Badge variant="muted">sistema</Badge>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-2">
          <CardTitle>{selectedRole ? `Permisos · ${selectedRole.label}` : 'Permisos'}</CardTitle>
          {selectedRole && (
            <div className="flex items-center gap-2">
              {dirty && <Badge variant="warning">cambios sin guardar</Badge>}
              {editable && selectedRole.userCount === 0 && !selectedRole.is_system && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    deleteRole.mutate(selectedRole.code, { onSuccess: () => setSelected(null) })
                  }
                >
                  <Trash2 className="text-destructive" /> Eliminar
                </Button>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent>
          {!selectedRole ? (
            <p className="text-sm text-muted-foreground">
              Elegí un rol para ver y editar su matriz.
            </p>
          ) : rolePerms.isPending ? (
            <LoadingState />
          ) : (
            <>
              {!editable && (
                <p className="mb-3 text-xs text-muted-foreground">
                  Rol de sistema (sólo lectura; un superadministrador puede editarlo).
                </p>
              )}
              <div className="space-y-4">
                {byModule.map(([module, perms]) => (
                  <div key={module}>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {MODULE_LABELS[module] ?? module}
                    </p>
                    <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                      {perms.map((p) => (
                        <label
                          key={p.code}
                          className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm ${
                            editable ? 'cursor-pointer hover:bg-muted' : 'opacity-70'
                          }`}
                          title={p.code}
                        >
                          <input
                            type="checkbox"
                            disabled={!editable}
                            checked={current.has(p.code)}
                            onChange={() => toggle(p.code)}
                          />
                          <span className="min-w-0 truncate">{p.label}</span>
                          {p.reserved && <Badge variant="destructive">reservado</Badge>}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {error && (
                <p
                  className="mt-3 rounded-md bg-destructive/10 p-2 text-sm text-destructive"
                  role="alert"
                >
                  {error}
                </p>
              )}
              {editable && (
                <div className="mt-4 flex gap-2">
                  <Button size="sm" onClick={save} disabled={!dirty || setPerms.isPending}>
                    {setPerms.isPending && <Spinner />} Guardar permisos
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!dirty}
                    onClick={() => setDraft(null)}
                  >
                    Restaurar
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function NuevoRolDialog({ roles }: { roles: { code: string; label: string }[] }) {
  const create = useCreateRole()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ code: '', label: '', description: '', copyFrom: '' })
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!/^[a-z][a-z0-9_]{2,40}$/.test(form.code))
      return setError('Código: minúsculas, _ , 3–41 chars')
    if (form.label.trim().length < 2) return setError('Ingresá un nombre')
    try {
      await create.mutateAsync({
        code: form.code,
        label: form.label.trim(),
        description: form.description || undefined,
        copyFrom: form.copyFrom || undefined,
      })
      setForm({ code: '', label: '', description: '', copyFrom: '' })
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus /> Nuevo rol
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo rol</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field
            label="Código"
            htmlFor="rol-code"
            hint="minúsculas y guión bajo, p. ej. comercial_junior"
          >
            <Input
              id="rol-code"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
            />
          </Field>
          <Field label="Nombre" htmlFor="rol-label">
            <Input
              id="rol-label"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
            />
          </Field>
          <Field label="Descripción (opcional)">
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
          <Field label="Usar como plantilla (opcional)">
            <Select value={form.copyFrom} onValueChange={(v) => setForm({ ...form, copyFrom: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Desde cero" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r.code} value={r.code}>
                    {r.label}
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
              {create.isPending && <Spinner />} Crear
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
