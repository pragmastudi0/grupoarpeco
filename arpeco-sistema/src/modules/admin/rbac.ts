import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/supabase/client'

export interface Permission {
  code: string
  module: string
  action: string
  label: string
  reserved: boolean
}
export interface Role {
  code: string
  label: string
  description: string | null
  is_system: boolean
  protected: boolean
  userCount: number
}

export function usePermissionsCatalog() {
  return useQuery({
    queryKey: ['rbac', 'permissions'],
    queryFn: async (): Promise<Permission[]> => {
      const { data, error } = await supabase
        .from('permissions')
        .select('code, module, action, label, reserved')
        .order('module')
        .order('action')
      if (error) throw error
      return (data ?? []) as Permission[]
    },
  })
}

export function useRolesQuery() {
  return useQuery({
    queryKey: ['rbac', 'roles'],
    queryFn: async (): Promise<Role[]> => {
      const { data, error } = await supabase
        .from('roles')
        .select('code, label, description, is_system, protected, user_roles(count)')
        .order('label')
      if (error) throw error
      return (data ?? []).map((r) => ({
        code: r.code,
        label: r.label,
        description: r.description,
        is_system: r.is_system,
        protected: r.protected,
        userCount: (r.user_roles as unknown as { count: number }[] | null)?.[0]?.count ?? 0,
      }))
    },
  })
}

export function useRolePermissions(roleCode: string | null) {
  return useQuery({
    queryKey: ['rbac', 'role-perms', roleCode],
    enabled: Boolean(roleCode),
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('permission_code')
        .eq('role_code', roleCode!)
      if (error) throw error
      return (data ?? []).map((r) => r.permission_code)
    },
  })
}

function invalidateRoles(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['rbac'] })
  qc.invalidateQueries({ queryKey: ['admin'] })
}

export function useCreateRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      code: string
      label: string
      description?: string
      copyFrom?: string
    }) => {
      const { error } = await supabase.rpc('create_role', {
        p_code: input.code,
        p_label: input.label,
        p_description: input.description ?? undefined,
      })
      if (error) throw error
      if (input.copyFrom) {
        const { data: perms, error: e2 } = await supabase
          .from('role_permissions')
          .select('permission_code')
          .eq('role_code', input.copyFrom)
        if (e2) throw e2
        const { error: e3 } = await supabase.rpc('set_role_permissions', {
          p_code: input.code,
          p_perms: (perms ?? []).map((p) => p.permission_code),
        })
        if (e3) throw e3
      }
    },
    onSuccess: () => invalidateRoles(qc),
  })
}

export function useUpdateRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { code: string; label: string; description?: string }) => {
      const { error } = await supabase.rpc('update_role', {
        p_code: input.code,
        p_label: input.label,
        p_description: input.description ?? undefined,
      })
      if (error) throw error
    },
    onSuccess: () => invalidateRoles(qc),
  })
}

export function useDeleteRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (code: string) => {
      const { error } = await supabase.rpc('delete_role', { p_code: code })
      if (error) throw error
    },
    onSuccess: () => invalidateRoles(qc),
  })
}

export function useSetRolePermissions() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { code: string; perms: string[] }) => {
      const { error } = await supabase.rpc('set_role_permissions', {
        p_code: input.code,
        p_perms: input.perms,
      })
      if (error) throw error
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['rbac', 'role-perms', v.code] })
      invalidateRoles(qc)
    },
  })
}

export interface EffectivePermission {
  permission_code: string
  source: 'denied' | 'granted' | 'role' | 'none'
}
export function useEffectivePermissions(userId: string | null) {
  return useQuery({
    queryKey: ['rbac', 'effective', userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<EffectivePermission[]> => {
      const { data, error } = await supabase.rpc('effective_permissions', { p_user: userId! })
      if (error) throw error
      return (data ?? []) as EffectivePermission[]
    },
  })
}

export function useSetUserPermission() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { user: string; perm: string; effect: 'grant' | 'deny' | null }) => {
      const { error } = await supabase.rpc('set_user_permission', {
        p_user: input.user,
        p_perm: input.perm,
        p_effect: input.effect ?? undefined,
      })
      if (error) throw error
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['rbac', 'effective', v.user] }),
  })
}
