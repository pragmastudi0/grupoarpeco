-- ============================================================================
-- Plantillas de presupuestos (compartidas) + duplicar presupuesto
-- Reutiliza los triggers de quote_items (subtotal/total) y la matriz de permisos.
-- ============================================================================

-- Permiso de gestión de plantillas (usar plantillas = presupuestos.create).
insert into public.permissions (code, module, action, label, reserved) values
  ('presupuestos.manage_templates','presupuestos','manage_templates','Gestionar plantillas', false)
on conflict (code) do nothing;
insert into public.role_permissions (role_code, permission_code) values
  ('direction','presupuestos.manage_templates'),
  ('administration','presupuestos.manage_templates')
on conflict do nothing;

-- ─── Tablas ──────────────────────────────────────────────────────────────────
create table public.quote_templates (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  created_by  uuid references auth.users (id) default auth.uid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz
);
create table public.quote_template_items (
  id          uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.quote_templates (id) on delete cascade,
  position    int not null,
  description text not null,
  quantity    numeric(12, 3) not null check (quantity > 0),
  unit_price  numeric(18, 2) not null check (unit_price >= 0),
  unique (template_id, position)
);
create trigger quote_templates_touch before update on public.quote_templates
  for each row execute function public.touch_updated_at();

-- ─── RLS: compartidas (ven quienes pueden crear presupuestos o gestionarlas) ──
alter table public.quote_templates enable row level security;
alter table public.quote_template_items enable row level security;

create policy quote_templates_select on public.quote_templates for select to authenticated
  using (public.has_permission('presupuestos.create') or public.has_permission('presupuestos.manage_templates'));
create policy quote_template_items_select on public.quote_template_items for select to authenticated
  using (public.has_permission('presupuestos.create') or public.has_permission('presupuestos.manage_templates'));

revoke all on public.quote_templates, public.quote_template_items from anon, authenticated;
grant select on public.quote_templates to authenticated;
grant select on public.quote_template_items to authenticated;
-- Escrituras sólo por RPC.

-- ─── RPCs de plantillas ──────────────────────────────────────────────────────
create or replace function public.create_template(p_name text, p_description text default null, p_items jsonb default '[]'::jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if not public.has_permission('presupuestos.manage_templates') then
    raise exception 'sin permiso para gestionar plantillas'; end if;
  if length(coalesce(trim(p_name), '')) < 2 then raise exception 'nombre inválido'; end if;
  insert into public.quote_templates (name, description) values (p_name, p_description)
    returning id into v_id;
  insert into public.quote_template_items (template_id, position, description, quantity, unit_price)
    select v_id, x.position, x.description, x.quantity, x.unit_price
    from jsonb_to_recordset(coalesce(p_items, '[]'::jsonb))
      as x(position int, description text, quantity numeric, unit_price numeric);
  perform public.log_audit('quote_templates', v_id, 'create_template', null,
    jsonb_build_object('name', p_name), null);
  return v_id;
end $$;

create or replace function public.update_template(p_id uuid, p_name text, p_description text default null, p_items jsonb default '[]'::jsonb)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.has_permission('presupuestos.manage_templates') then
    raise exception 'sin permiso para gestionar plantillas'; end if;
  update public.quote_templates set name = p_name, description = p_description, updated_at = now()
    where id = p_id;
  if not found then raise exception 'plantilla inexistente'; end if;
  delete from public.quote_template_items where template_id = p_id;
  insert into public.quote_template_items (template_id, position, description, quantity, unit_price)
    select p_id, x.position, x.description, x.quantity, x.unit_price
    from jsonb_to_recordset(coalesce(p_items, '[]'::jsonb))
      as x(position int, description text, quantity numeric, unit_price numeric);
  perform public.log_audit('quote_templates', p_id, 'update_template', null,
    jsonb_build_object('name', p_name), null);
end $$;

create or replace function public.delete_template(p_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.has_permission('presupuestos.manage_templates') then
    raise exception 'sin permiso para gestionar plantillas'; end if;
  delete from public.quote_templates where id = p_id;
  perform public.log_audit('quote_templates', p_id, 'delete_template', null, null, null);
end $$;

create or replace function public.save_quote_as_template(p_quote uuid, p_name text, p_description text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare q public.quotes; v_id uuid;
begin
  if not public.has_permission('presupuestos.manage_templates') then
    raise exception 'sin permiso para gestionar plantillas'; end if;
  select * into q from public.quotes where id = p_quote;
  if not found then raise exception 'presupuesto inexistente'; end if;
  if not (public.has_permission('presupuestos.view_all') or q.owner_id = (select auth.uid())) then
    raise exception 'no autorizado sobre este presupuesto'; end if;
  insert into public.quote_templates (name, description) values (p_name, p_description)
    returning id into v_id;
  insert into public.quote_template_items (template_id, position, description, quantity, unit_price)
    select v_id, i.position, i.description, i.quantity, i.unit_price
    from public.quote_items i where i.quote_id = p_quote;
  perform public.log_audit('quote_templates', v_id, 'save_quote_as_template',
    null, jsonb_build_object('from_quote', p_quote, 'name', p_name), null);
  return v_id;
end $$;

-- ─── Crear presupuesto desde plantilla ───────────────────────────────────────
create or replace function public.create_quote_from_template(p_template uuid, p_client uuid, p_title text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_quote uuid;
begin
  if not public.has_permission('presupuestos.create') then
    raise exception 'sin permiso para crear presupuestos'; end if;
  if not exists (select 1 from public.quote_templates where id = p_template) then
    raise exception 'plantilla inexistente'; end if;
  insert into public.quotes (client_id, owner_id, title)
    values (p_client, (select auth.uid()), p_title)
    returning id into v_quote;
  insert into public.quote_items (quote_id, position, description, quantity, unit_price)
    select v_quote, t.position, t.description, t.quantity, t.unit_price
    from public.quote_template_items t where t.template_id = p_template;
  perform public.log_audit('quotes', v_quote, 'create_from_template', null,
    jsonb_build_object('template_id', p_template), null);
  return v_quote;
end $$;

-- ─── Duplicar un presupuesto existente ───────────────────────────────────────
create or replace function public.duplicate_quote(p_source uuid, p_client uuid default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare q public.quotes; v_quote uuid; v_margin boolean := public.has_permission('presupuestos.view_margin');
begin
  if not public.has_permission('presupuestos.create') then
    raise exception 'sin permiso para crear presupuestos'; end if;
  select * into q from public.quotes where id = p_source;
  if not found then raise exception 'presupuesto origen inexistente'; end if;
  if not (public.has_permission('presupuestos.view_all') or q.owner_id = (select auth.uid())) then
    raise exception 'no autorizado sobre el presupuesto origen'; end if;

  insert into public.quotes (client_id, owner_id, title, public_notes, valid_until,
    estimated_cost, internal_notes)
  values (coalesce(p_client, q.client_id), (select auth.uid()), q.title, q.public_notes,
    q.valid_until,
    case when v_margin then q.estimated_cost else null end,
    case when v_margin then q.internal_notes else null end)
  returning id into v_quote;

  insert into public.quote_items (quote_id, position, description, quantity, unit_price)
    select v_quote, i.position, i.description, i.quantity, i.unit_price
    from public.quote_items i where i.quote_id = p_source;

  perform public.log_audit('quotes', v_quote, 'duplicate_quote', null,
    jsonb_build_object('from_quote', p_source), null);
  return v_quote;
end $$;

-- GRANT execute.
revoke execute on function public.create_template(text, text, jsonb) from public, anon;
revoke execute on function public.update_template(uuid, text, text, jsonb) from public, anon;
revoke execute on function public.delete_template(uuid) from public, anon;
revoke execute on function public.save_quote_as_template(uuid, text, text) from public, anon;
revoke execute on function public.create_quote_from_template(uuid, uuid, text) from public, anon;
revoke execute on function public.duplicate_quote(uuid, uuid) from public, anon;
grant execute on function public.create_template(text, text, jsonb) to authenticated;
grant execute on function public.update_template(uuid, text, text, jsonb) to authenticated;
grant execute on function public.delete_template(uuid) to authenticated;
grant execute on function public.save_quote_as_template(uuid, text, text) to authenticated;
grant execute on function public.create_quote_from_template(uuid, uuid, text) to authenticated;
grant execute on function public.duplicate_quote(uuid, uuid) to authenticated;
