import { useState } from 'react'
import { Plus, UserPlus } from 'lucide-react'
import { useAuth } from '@/modules/auth/useAuth'
import { ROLES, ROLE_LABELS, type RoleCode } from '@/shared/auth/roles'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { cn } from '@/shared/lib/utils'
import { EmptyState, ErrorRetry, LoadingState, Spinner } from '@/shared/ui/states'
import { PermisosIndividualesPanel } from './PermisosIndividualesPanel'
import { RolesPanel } from './RolesPanel'
import {
  useGrantRole,
  useInviteUser,
  useRevokeRole,
  useSetUserActive,
  useUsersQuery,
  type UserRow,
} from './queries'

const HIGH_PRIVILEGE: RoleCode[] = ['direction', 'support']

type Tab = 'usuarios' | 'roles' | 'individuales'

export function UsuariosPage() {
  const { can } = useAuth()
  const [tab, setTab] = useState<Tab>('usuarios')
  const tabs: { id: Tab; label: string; show: boolean }[] = [
    { id: 'usuarios', label: 'Usuarios', show: true },
    { id: 'roles', label: 'Roles y permisos', show: can('roles.manage') },
    {
      id: 'individuales',
      label: 'Permisos individuales',
      show: can('usuarios.manage_permissions'),
    },
  ]
  const visible = tabs.filter((t) => t.show)
  const active = visible.some((t) => t.id === tab) ? tab : 'usuarios'

  return (
    <div>
      <PageHeader title="Usuarios y accesos" description="Gestión de usuarios, roles y permisos." />
      <div className="mb-4 flex flex-wrap gap-1 border-b border-border">
        {visible.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              '-mb-px border-b-2 px-3 py-2 text-sm font-medium',
              active === t.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      {active === 'usuarios' && <UsuariosTab />}
      {active === 'roles' && <RolesPanel />}
      {active === 'individuales' && <PermisosIndividualesPanel />}
    </div>
  )
}

function UsuariosTab() {
  const { user } = useAuth()
  const query = useUsersQuery()
  const setActive = useSetUserActive()

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <InvitarUsuarioDialog />
      </div>

      {query.isPending && <LoadingState label="Cargando usuarios…" />}
      {query.isError && (
        <ErrorRetry
          description="No se pudieron cargar los usuarios."
          onRetry={() => query.refetch()}
        />
      )}

      {query.isSuccess &&
        (query.data.length === 0 ? (
          <EmptyState
            title="Sin usuarios"
            description="Invitá al primer usuario desde Dirección."
          />
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Nombre</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Roles</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
                    <th className="px-4 py-3 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {query.data.map((u) => {
                    const isSelf = u.id === user?.id
                    const pending = setActive.isPending && setActive.variables?.target === u.id
                    return (
                      <tr key={u.id} className="border-b border-border last:border-0">
                        <td className="px-4 py-3 font-medium">{u.display_name || '—'}</td>
                        <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap items-center gap-1">
                            {u.roles.length ? (
                              u.roles.map((r) => (
                                <Badge key={r} variant="muted">
                                  {ROLE_LABELS[r]}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-muted-foreground">Sin rol</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={u.active ? 'success' : 'muted'}>
                            {u.active ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {!isSelf && <GestionRolesDialog user={u} users={query.data} />}
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isSelf || pending}
                              title={isSelf ? 'No podés cambiar tu propio estado' : undefined}
                              onClick={() =>
                                setActive.mutate({
                                  target: u.id,
                                  active: !u.active,
                                  reason: u.active ? 'Baja desde panel' : 'Alta desde panel',
                                })
                              }
                            >
                              {pending && <Spinner />}
                              {u.active ? 'Desactivar' : 'Activar'}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        ))}
    </div>
  )
}

function InvitarUsuarioDialog() {
  const { user } = useAuth()
  const invite = useInviteUser()
  const users = useUsersQuery()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ email: '', display_name: '', role: 'seller' as RoleCode })
  const [approver, setApprover] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  const directions = (users.data ?? []).filter(
    (u) => u.roles.includes('direction') && u.id !== user?.id,
  )
  const needsApprover = HIGH_PRIVILEGE.includes(form.role)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setOk(false)
    if (!form.email || !form.display_name) return setError('Completá email y nombre')
    if (needsApprover && !approver)
      return setError('Rol de alto privilegio: elegí un segundo aprobador')
    try {
      await invite.mutateAsync({
        email: form.email.trim(),
        display_name: form.display_name.trim(),
        role: form.role,
        second_approver: needsApprover ? approver : undefined,
      })
      setOk(true)
      setForm({ email: '', display_name: '', role: 'seller' })
      setApprover('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo invitar')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus /> Invitar usuario
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invitar usuario</DialogTitle>
          <DialogDescription>
            Se envía una invitación por email; el usuario nace inactivo y se activa al aceptarla.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label="Email">
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Field>
          <Field label="Nombre">
            <Input
              value={form.display_name}
              onChange={(e) => setForm({ ...form, display_name: e.target.value })}
            />
          </Field>
          <Field label="Rol">
            <Select
              value={form.role}
              onValueChange={(v) => setForm({ ...form, role: v as RoleCode })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(ROLES).map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {needsApprover && (
            <Field
              label="Segundo aprobador (Dirección)"
              hint="Requerido para roles de alto privilegio"
            >
              <Select value={approver} onValueChange={setApprover}>
                <SelectTrigger>
                  <SelectValue placeholder="Elegí una Dirección…" />
                </SelectTrigger>
                <SelectContent>
                  {directions.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
          {error && (
            <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          {ok && (
            <p className="rounded-md bg-success/10 p-2 text-sm text-success" role="status">
              Invitación enviada.
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={invite.isPending}>
              {invite.isPending && <Spinner />}
              Enviar invitación
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function GestionRolesDialog({ user, users }: { user: UserRow; users: UserRow[] }) {
  const { user: me } = useAuth()
  const grant = useGrantRole()
  const revoke = useRevokeRole()
  const [open, setOpen] = useState(false)
  const [newRole, setNewRole] = useState('')
  const [approver, setApprover] = useState('')
  const [error, setError] = useState<string | null>(null)

  const available = Object.values(ROLES).filter((r) => !user.roles.includes(r))
  const directions = users.filter((u) => u.roles.includes('direction') && u.id !== me?.id)
  const needsApprover = HIGH_PRIVILEGE.includes(newRole as RoleCode)

  const add = async () => {
    setError(null)
    if (!newRole) return
    if (needsApprover && !approver)
      return setError('Rol de alto privilegio: elegí un segundo aprobador')
    try {
      await grant.mutateAsync({
        target: user.id,
        role: newRole as RoleCode,
        secondApprover: needsApprover ? approver : undefined,
      })
      setNewRole('')
      setApprover('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo asignar')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          Roles
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Roles de {user.display_name}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {user.roles.length === 0 && (
              <span className="text-sm text-muted-foreground">Sin roles</span>
            )}
            {user.roles.map((r) => (
              <span
                key={r}
                className="flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs"
              >
                {ROLE_LABELS[r]}
                <button
                  type="button"
                  className="text-destructive"
                  onClick={() => revoke.mutate({ target: user.id, role: r })}
                  aria-label={`Quitar ${ROLE_LABELS[r]}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          {available.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-border pt-3">
              <Field label="Agregar rol">
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Elegí un rol…" />
                  </SelectTrigger>
                  <SelectContent>
                    {available.map((r) => (
                      <SelectItem key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              {needsApprover && (
                <Field label="Segundo aprobador (Dirección)">
                  <Select value={approver} onValueChange={setApprover}>
                    <SelectTrigger>
                      <SelectValue placeholder="Elegí una Dirección…" />
                    </SelectTrigger>
                    <SelectContent>
                      {directions.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={add}
                disabled={grant.isPending || !newRole}
              >
                {grant.isPending && <Spinner />}
                <Plus /> Agregar rol
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
