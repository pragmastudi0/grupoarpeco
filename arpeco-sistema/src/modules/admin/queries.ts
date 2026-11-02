import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { RoleCode } from '@/shared/auth/roles'
import { supabase } from '@/shared/supabase/client'

export interface UserRow {
  id: string
  display_name: string
  email: string
  active: boolean
  roles: RoleCode[]
}

const usersKey = ['admin', 'users'] as const

export function useUsersQuery() {
  return useQuery({
    queryKey: usersKey,
    queryFn: async (): Promise<UserRow[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, email, active, user_roles(role_code)')
        .order('display_name')
      if (error) throw error
      return (data ?? []).map((row) => ({
        id: row.id,
        display_name: row.display_name,
        email: row.email,
        active: row.active,
        roles: (row.user_roles ?? []).map((r) => r.role_code as RoleCode),
      }))
    },
  })
}

export function useSetUserActive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { target: string; active: boolean; reason: string }) => {
      const { error } = await supabase.rpc('set_user_active', {
        p_target: input.target,
        p_active: input.active,
        p_reason: input.reason,
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: usersKey }),
  })
}

export function useGrantRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { target: string; role: RoleCode; secondApprover?: string }) => {
      const { error } = await supabase.rpc('grant_role', {
        p_target: input.target,
        p_role: input.role,
        p_reason: 'Alta de rol desde panel',
        p_second_approver: input.secondApprover,
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: usersKey }),
  })
}

export function useRevokeRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { target: string; role: RoleCode }) => {
      const { error } = await supabase.rpc('revoke_role', {
        p_target: input.target,
        p_role: input.role,
        p_reason: 'Baja de rol desde panel',
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: usersKey }),
  })
}

export interface AssignableUser {
  id: string
  display_name: string
  email: string
  roles: string[]
}

/** Usuarios activos para selects de owner/responsable (D/A, vía RPC). */
export function useAssignableUsers(enabled = true) {
  return useQuery({
    queryKey: ['admin', 'assignable-users'],
    enabled,
    queryFn: async (): Promise<AssignableUser[]> => {
      const { data, error } = await supabase.rpc('list_assignable_users')
      if (error) throw error
      return (data ?? []) as AssignableUser[]
    },
  })
}
