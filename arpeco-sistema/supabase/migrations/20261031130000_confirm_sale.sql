-- ============================================================================
-- Separar "Aceptar presupuesto" de "Confirmar venta"
--  * accept_quote: SÓLO marca accepted (fecha + quién). NO crea venta/proyecto.
--  * confirm_sale: desde un presupuesto aceptado crea venta + proyecto
--    (reutiliza la lógica existente), registrando confirmed_by/confirmed_at.
-- ============================================================================

alter table public.quotes add column if not exists accepted_by uuid references auth.users (id);
alter table public.sales  add column if not exists confirmed_by uuid references auth.users (id);
alter table public.sales  add column if not exists confirmed_at timestamptz;

-- Nuevo permiso para confirmar ventas (lo tienen los roles que antes aceptaban).
insert into public.permissions (code, module, action, label, reserved) values
  ('ventas.confirm','ventas','confirm','Confirmar ventas', false)
on conflict (code) do nothing;
insert into public.role_permissions (role_code, permission_code) values
  ('direction','ventas.confirm'),('administration','ventas.confirm'),('seller','ventas.confirm')
on conflict do nothing;

-- ─── Aceptar: sólo cambia el estado del presupuesto ──────────────────────────
-- Cambia la forma devuelta (antes table(sale_id, project_id) → ahora void): drop.
drop function if exists public.accept_quote(uuid, int, text);
create or replace function public.accept_quote(
  p_id uuid, p_expected_revision int, p_evidence text default null
)
returns void
language plpgsql security definer set search_path = '' as $$
declare q public.quotes;
begin
  select * into q from public.quotes where id = p_id for update;
  if not found then raise exception 'presupuesto inexistente'; end if;
  if not (public.has_permission('presupuestos.accept')
      and (public.has_permission('presupuestos.view_all') or q.owner_id = (select auth.uid()))) then
    raise exception 'no autorizado'; end if;

  if q.status = 'accepted' then return; end if;  -- idempotente
  if q.status <> 'sent' then raise exception 'sólo se acepta un presupuesto enviado'; end if;
  if q.revision <> p_expected_revision then
    raise exception 'la revisión cambió (esperada %, actual %)', p_expected_revision, q.revision;
  end if;

  update public.quotes
    set status = 'accepted', accepted_at = now(), accepted_by = (select auth.uid()),
        acceptance_evidence = p_evidence, updated_at = now()
  where id = p_id;
  perform public.log_audit('quotes', p_id, 'accept_quote', null,
    jsonb_build_object('revision', q.revision), p_evidence);
end $$;
revoke execute on function public.accept_quote(uuid, int, text) from public, anon;
grant execute on function public.accept_quote(uuid, int, text) to authenticated;

-- ─── Confirmar venta: crea venta + proyecto desde un presupuesto aceptado ─────
create or replace function public.confirm_sale(p_id uuid, p_expected_revision int)
returns table (sale_id uuid, project_id uuid)
language plpgsql security definer set search_path = '' as $$
declare q public.quotes; v_sale public.sales; v_sale_id uuid; v_project_id uuid;
begin
  select * into q from public.quotes where id = p_id for update;
  if not found then raise exception 'presupuesto inexistente'; end if;
  if not (public.has_permission('ventas.confirm')
      and (public.has_permission('presupuestos.view_all') or q.owner_id = (select auth.uid()))) then
    raise exception 'no autorizado'; end if;

  -- Idempotencia / anti-duplicado: si ya hay venta para este presupuesto…
  select * into v_sale from public.sales where quote_id = p_id;
  if found then
    if v_sale.quote_revision = p_expected_revision then
      select pr.id into v_project_id from public.projects pr where pr.sale_id = v_sale.id;
      sale_id := v_sale.id; project_id := v_project_id; return next; return;
    else
      raise exception 'la venta ya fue confirmada en otra revisión';
    end if;
  end if;

  if q.status <> 'accepted' then raise exception 'sólo se confirma un presupuesto aceptado'; end if;
  if q.revision <> p_expected_revision then
    raise exception 'la revisión cambió (esperada %, actual %)', p_expected_revision, q.revision;
  end if;

  insert into public.sales (quote_id, quote_revision, client_id, owner_id, origin_fair_id,
    commercial_no, accepted_on, amount, currency, confirmed_by, confirmed_at)
  values (q.id, q.revision, q.client_id, q.owner_id, q.origin_fair_id,
    public.next_document_no('sale'),
    (now() at time zone 'America/Argentina/Cordoba')::date, q.total, q.currency,
    (select auth.uid()), now())
  returning id into v_sale_id;

  insert into public.projects (sale_id, commercial_no, event_on)
  values (v_sale_id, public.next_document_no('project'), q.event_on)
  returning id into v_project_id;

  perform public.log_audit('sales', v_sale_id, 'confirm_sale', null,
    jsonb_build_object('quote_id', p_id, 'project_id', v_project_id), null);

  sale_id := v_sale_id; project_id := v_project_id; return next;
end $$;
revoke execute on function public.confirm_sale(uuid, int) from public, anon;
grant execute on function public.confirm_sale(uuid, int) to authenticated;

-- ─── Reportes: diferenciar aceptados (presupuestos) de confirmados (ventas) ──
-- Cambia la forma devuelta (agrega `accepted`) → recrear.
drop function if exists public.report_business(date, date);
create or replace function public.report_business(p_from date, p_to date)
returns table (
  quoted numeric, accepted numeric, sold numeric, collected numeric, invoiced numeric,
  pending_collection numeric, sales_count int
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.has_permission('reportes.view_global') then return; end if;
  return query
  with period_sales as (
    select s.id, s.amount from public.sales s
    where s.status = 'active' and s.accepted_on between p_from and p_to
  ),
  paid as (select sale_id, sum(amount) amt from public.payments where status = 'posted' group by sale_id)
  select
    coalesce((select sum(total) from public.quotes
              where issued_on between p_from and p_to and status in ('sent','accepted','rejected')), 0),
    coalesce((select sum(total) from public.quotes
              where status = 'accepted' and (accepted_at at time zone 'America/Argentina/Cordoba')::date
                    between p_from and p_to), 0),
    coalesce((select sum(amount) from period_sales), 0),
    coalesce((select sum(amount) from public.payments where status='posted' and received_on between p_from and p_to), 0),
    coalesce((select sum(amount) from public.invoices where status='posted' and issued_on between p_from and p_to), 0),
    coalesce((select sum(greatest(0, ps.amount - coalesce(pd.amt,0)))
              from period_sales ps left join paid pd on pd.sale_id = ps.id), 0),
    (select count(*)::int from period_sales);
end $$;
