-- ============================================================================
-- Cierre de pendientes: fix de merge, configuración y utilidades de asignación
-- ============================================================================

-- ─── FIX: merge_clients debe repuntar también quotes y sales ────────────────
-- (antes sólo movía opportunities y fair_prospects; quotes/sales se agregaron
--  después y quedaban colgadas del cliente origen).
create or replace function public.merge_clients(p_from uuid, p_into uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin_or_direction() then
    raise exception 'no autorizado: requiere Dirección o Administración';
  end if;
  if p_from = p_into then raise exception 'origen y destino iguales'; end if;
  if not exists (select 1 from public.clients where id = p_from and status = 'active') then
    raise exception 'cliente origen inexistente o no activo';
  end if;
  if not exists (select 1 from public.clients where id = p_into and status = 'active') then
    raise exception 'cliente destino inexistente o no activo';
  end if;

  update public.opportunities set client_id = p_into where client_id = p_from;
  update public.fair_prospects set client_id = p_into where client_id = p_from;
  update public.quotes set client_id = p_into where client_id = p_from;
  update public.sales set client_id = p_into where client_id = p_from;
  update public.clients
    set status = 'merged', merged_into_id = p_into, updated_at = now()
  where id = p_from;

  perform public.log_audit('clients', p_from, 'merge_clients',
    jsonb_build_object('from', p_from), jsonb_build_object('into', p_into), p_reason);
end $$;

-- ─── Configuración de la app (identidad del PDF, etc.) — sólo Dirección ──────
create or replace function public.set_app_setting(p_key text, p_value jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.has_role('direction') then
    raise exception 'sólo Dirección edita la configuración';
  end if;
  insert into public.app_settings (key, value, updated_by, updated_at)
  values (p_key, p_value, (select auth.uid()), now())
  on conflict (key) do update set value = excluded.value,
    updated_by = excluded.updated_by, updated_at = now();
  perform public.log_audit('app_settings', null, 'set_app_setting', null,
    jsonb_build_object('key', p_key), null);
end $$;
revoke execute on function public.set_app_setting(text, jsonb) from public, anon;
grant execute on function public.set_app_setting(text, jsonb) to authenticated;

-- ─── Usuarios asignables (para selects de owner/responsable) ─────────────────
-- La RLS de profiles sólo deja ver el propio perfil o (Dirección) todos; esta
-- RPC permite a Dirección/Administración listar usuarios activos para asignar.
create or replace function public.list_assignable_users()
returns table (id uuid, display_name text, email text, roles text[])
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin_or_direction() then return; end if;
  return query
    select p.id, p.display_name, p.email,
           coalesce(array_agg(ur.role_code) filter (where ur.role_code is not null), '{}')
    from public.profiles p
    left join public.user_roles ur on ur.user_id = p.id
    where p.active
    group by p.id, p.display_name, p.email
    order by p.display_name;
end $$;
revoke execute on function public.list_assignable_users() from public, anon;
grant execute on function public.list_assignable_users() to authenticated;
