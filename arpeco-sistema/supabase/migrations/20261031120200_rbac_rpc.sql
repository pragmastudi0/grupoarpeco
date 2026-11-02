-- ============================================================================
-- RBAC · Fase 3: RPC sensibles y de escritura gated por has_permission
-- (reemplaza is_admin_or_direction/has_role por permisos; cuerpos idénticos).
-- Así un rol personalizado con el permiso correspondiente opera de verdad y una
-- denegación individual corta también en estas funciones.
-- ============================================================================

-- ─── Presupuestos: margen/interno (permiso) ──────────────────────────────────
create or replace function public.quote_margin(p_id uuid)
returns table (estimated_cost numeric, margin_pct numeric, internal_notes text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.has_permission('presupuestos.view_margin') then return; end if;
  return query
    select q.estimated_cost,
           case when q.estimated_cost is null or q.total = 0 then null
                else round((q.total - q.estimated_cost) / q.total * 100, 2) end,
           q.internal_notes
    from public.quotes q where q.id = p_id;
end $$;

create or replace function public.set_quote_internal(
  p_id uuid, p_cost numeric default null, p_notes text default null
)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.has_permission('presupuestos.edit_internal') then
    raise exception 'sin permiso para editar costo/margen';
  end if;
  update public.quotes set estimated_cost = p_cost, internal_notes = p_notes, updated_at = now()
    where id = p_id;
  perform public.log_audit('quotes', p_id, 'set_quote_internal', null,
    jsonb_build_object('estimated_cost', p_cost), 'edición interna');
end $$;

-- ─── Presupuestos: ciclo de vida (presupuestos.update propio/all; accept) ─────
create or replace function public.send_quote(p_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare q public.quotes; v_snapshot jsonb;
begin
  select * into q from public.quotes where id = p_id for update;
  if not found then raise exception 'presupuesto inexistente'; end if;
  if not (public.has_permission('presupuestos.update')
      and (public.has_permission('presupuestos.update_all') or q.owner_id = (select auth.uid()))) then
    raise exception 'no autorizado'; end if;
  if q.status <> 'draft' then raise exception 'sólo se puede enviar un borrador'; end if;
  if not exists (select 1 from public.quote_items where quote_id = p_id) then
    raise exception 'el presupuesto no tiene ítems'; end if;

  v_snapshot := jsonb_build_object(
    'quote', to_jsonb(q),
    'items', (select coalesce(jsonb_agg(to_jsonb(i) order by i.position), '[]'::jsonb)
              from public.quote_items i where i.quote_id = p_id)
  );
  insert into public.quote_revisions (quote_id, revision, snapshot, sha256)
  values (p_id, q.revision, v_snapshot, encode(extensions.digest(v_snapshot::text, 'sha256'), 'hex'));

  update public.quotes set status = 'sent', sent_at = now(),
    issued_on = coalesce(issued_on, (now() at time zone 'America/Argentina/Cordoba')::date),
    updated_at = now()
  where id = p_id;
  perform public.log_audit('quotes', p_id, 'send_quote', null,
    jsonb_build_object('revision', q.revision), null);
end $$;

create or replace function public.revise_quote(p_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare q public.quotes;
begin
  select * into q from public.quotes where id = p_id for update;
  if not found then raise exception 'presupuesto inexistente'; end if;
  if not (public.has_permission('presupuestos.update')
      and (public.has_permission('presupuestos.update_all') or q.owner_id = (select auth.uid()))) then
    raise exception 'no autorizado'; end if;
  if q.status <> 'sent' then raise exception 'sólo se revisa un presupuesto enviado'; end if;
  update public.quotes set status = 'draft', revision = revision + 1, sent_at = null, updated_at = now()
    where id = p_id;
  perform public.log_audit('quotes', p_id, 'revise_quote',
    jsonb_build_object('revision', q.revision), jsonb_build_object('revision', q.revision + 1), null);
end $$;

create or replace function public.reject_quote(p_id uuid, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
declare q public.quotes;
begin
  select * into q from public.quotes where id = p_id for update;
  if not found then raise exception 'presupuesto inexistente'; end if;
  if not (public.has_permission('presupuestos.update')
      and (public.has_permission('presupuestos.update_all') or q.owner_id = (select auth.uid()))) then
    raise exception 'no autorizado'; end if;
  if q.status <> 'sent' then raise exception 'sólo se rechaza un presupuesto enviado'; end if;
  update public.quotes set status = 'rejected', updated_at = now() where id = p_id;
  perform public.log_audit('quotes', p_id, 'reject_quote', null, null, p_reason);
end $$;

-- ─── Aceptación (presupuestos.accept propio/all) ─────────────────────────────
create or replace function public.accept_quote(
  p_id uuid, p_expected_revision int, p_evidence text default null
)
returns table (sale_id uuid, project_id uuid)
language plpgsql security definer set search_path = '' as $$
declare q public.quotes; v_sale public.sales; v_sale_id uuid; v_project_id uuid;
begin
  select * into q from public.quotes where id = p_id for update;
  if not found then raise exception 'presupuesto inexistente'; end if;
  if not (public.has_permission('presupuestos.accept')
      and (public.has_permission('presupuestos.view_all') or q.owner_id = (select auth.uid()))) then
    raise exception 'no autorizado'; end if;

  select * into v_sale from public.sales where quote_id = p_id;
  if found then
    if v_sale.quote_revision = p_expected_revision then
      select pr.id into v_project_id from public.projects pr where pr.sale_id = v_sale.id;
      sale_id := v_sale.id; project_id := v_project_id; return next; return;
    else
      raise exception 'el presupuesto ya fue aceptado en otra revisión';
    end if;
  end if;

  if q.status <> 'sent' then raise exception 'sólo se acepta un presupuesto enviado'; end if;
  if q.revision <> p_expected_revision then
    raise exception 'la revisión cambió (esperada %, actual %)', p_expected_revision, q.revision;
  end if;

  insert into public.sales (quote_id, quote_revision, client_id, owner_id, origin_fair_id,
    commercial_no, accepted_on, amount, currency)
  values (q.id, q.revision, q.client_id, q.owner_id, q.origin_fair_id,
    public.next_document_no('sale'),
    (now() at time zone 'America/Argentina/Cordoba')::date, q.total, q.currency)
  returning id into v_sale_id;
  insert into public.projects (sale_id, commercial_no, event_on)
  values (v_sale_id, public.next_document_no('project'), q.event_on)
  returning id into v_project_id;
  update public.quotes
    set status = 'accepted', accepted_at = now(), acceptance_evidence = p_evidence, updated_at = now()
  where id = p_id;
  perform public.log_audit('quotes', p_id, 'accept_quote', null,
    jsonb_build_object('sale_id', v_sale_id, 'project_id', v_project_id), p_evidence);
  sale_id := v_sale_id; project_id := v_project_id; return next;
end $$;

-- ─── Cobros / facturas / detalle (permisos de ventas) ────────────────────────
create or replace function public.register_payment(
  p_sale uuid, p_amount numeric, p_received date, p_method text,
  p_reference text, p_idempotency uuid
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_amount numeric; v_paid numeric;
begin
  if not public.has_permission('ventas.register_payment') then
    raise exception 'sin permiso para registrar cobros'; end if;
  select id into v_id from public.payments where idempotency_key = p_idempotency;
  if found then return v_id; end if;
  if p_amount <= 0 then raise exception 'importe inválido'; end if;
  select amount into v_amount from public.sales where id = p_sale and status = 'active';
  if not found then raise exception 'venta inexistente o anulada'; end if;
  select coalesce(sum(amount), 0) into v_paid from public.payments
    where sale_id = p_sale and status = 'posted';
  if v_paid + p_amount > v_amount then
    raise exception 'sobrecobro bloqueado: cobrado % + % supera la venta %', v_paid, p_amount, v_amount;
  end if;
  insert into public.payments (sale_id, amount, received_on, method, reference, idempotency_key)
  values (p_sale, p_amount, p_received, p_method, p_reference, p_idempotency)
  returning id into v_id;
  perform public.log_audit('payments', v_id, 'register_payment', null,
    jsonb_build_object('sale_id', p_sale, 'amount', p_amount), null);
  return v_id;
end $$;

create or replace function public.void_payment(p_id uuid, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.has_permission('ventas.register_payment') then raise exception 'no autorizado'; end if;
  update public.payments set status = 'void', reason = p_reason where id = p_id and status = 'posted';
  if not found then raise exception 'cobro inexistente o ya anulado'; end if;
  perform public.log_audit('payments', p_id, 'void_payment', null, null, p_reason);
end $$;

create or replace function public.register_invoice(
  p_sale uuid, p_invoice_no text, p_issued date, p_amount numeric,
  p_idempotency uuid, p_document_path text default null
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_amount numeric; v_inv numeric;
begin
  if not public.has_permission('ventas.register_invoice') then
    raise exception 'sin permiso para registrar facturas'; end if;
  select id into v_id from public.invoices where idempotency_key = p_idempotency;
  if found then return v_id; end if;
  if p_amount <= 0 then raise exception 'importe inválido'; end if;
  select amount into v_amount from public.sales where id = p_sale and status = 'active';
  if not found then raise exception 'venta inexistente o anulada'; end if;
  select coalesce(sum(amount), 0) into v_inv from public.invoices
    where sale_id = p_sale and status = 'posted';
  if v_inv + p_amount > v_amount then raise exception 'sobrefacturación bloqueada'; end if;
  insert into public.invoices (sale_id, invoice_no, issued_on, amount, document_path, idempotency_key)
  values (p_sale, p_invoice_no, p_issued, p_amount, p_document_path, p_idempotency)
  returning id into v_id;
  perform public.log_audit('invoices', v_id, 'register_invoice', null,
    jsonb_build_object('sale_id', p_sale, 'amount', p_amount), null);
  return v_id;
end $$;

create or replace function public.void_invoice(p_id uuid, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.has_permission('ventas.register_invoice') then raise exception 'no autorizado'; end if;
  update public.invoices set status = 'void', reason = p_reason where id = p_id and status = 'posted';
  if not found then raise exception 'factura inexistente o ya anulada'; end if;
  perform public.log_audit('invoices', p_id, 'void_invoice', null, null, p_reason);
end $$;

create or replace function public.payment_details(p_sale uuid)
returns table (id uuid, amount numeric, received_on date, method text, reference text, status text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.has_permission('ventas.view_payment_details') then return; end if;
  return query select p.id, p.amount, p.received_on, p.method, p.reference, p.status
    from public.payments p where p.sale_id = p_sale order by p.received_on;
end $$;

create or replace function public.assign_project_manager(p_project uuid, p_manager uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.has_permission('proyectos.assign') then raise exception 'no autorizado'; end if;
  update public.projects set manager_id = p_manager, updated_at = now() where id = p_project;
  perform public.log_audit('projects', p_project, 'assign_manager', null,
    jsonb_build_object('manager_id', p_manager), null);
end $$;

-- ─── Costos / margen de proyecto (permisos de proyectos) ─────────────────────
create or replace function public.register_cost(
  p_project uuid, p_amount numeric, p_incurred date, p_description text,
  p_idempotency uuid, p_category text default null
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if not (public.has_permission('proyectos.register_cost')
      and (public.has_permission('proyectos.view_all') or public.manages_project(p_project))) then
    raise exception 'no autorizado para registrar costos de este proyecto'; end if;
  select id into v_id from public.project_costs where idempotency_key = p_idempotency;
  if found then return v_id; end if;
  if p_amount <= 0 then raise exception 'importe inválido'; end if;
  insert into public.project_costs (project_id, amount, incurred_on, description, category, idempotency_key)
  values (p_project, p_amount, p_incurred, p_description, p_category, p_idempotency)
  returning id into v_id;
  perform public.log_audit('project_costs', v_id, 'register_cost', null,
    jsonb_build_object('project_id', p_project, 'amount', p_amount), null);
  return v_id;
end $$;

create or replace function public.void_cost(p_id uuid, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_project uuid;
begin
  select project_id into v_project from public.project_costs where id = p_id;
  if not found then raise exception 'costo inexistente'; end if;
  if not (public.has_permission('proyectos.register_cost')
      and (public.has_permission('proyectos.view_all') or public.manages_project(v_project))) then
    raise exception 'no autorizado'; end if;
  update public.project_costs set status = 'void', reason = p_reason where id = p_id and status = 'posted';
  perform public.log_audit('project_costs', p_id, 'void_cost', null, null, p_reason);
end $$;

create or replace function public.complete_costs(p_project uuid, p_reason text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.has_permission('proyectos.complete_costs') then
    raise exception 'sin permiso para cerrar costos'; end if;
  update public.projects
    set costs_complete_at = now(), costs_complete_by = (select auth.uid()),
        costs_reopened_at = null, updated_at = now()
  where id = p_project;
  perform public.log_audit('projects', p_project, 'complete_costs', null,
    jsonb_build_object('at', now()), p_reason);
end $$;

create or replace function public.project_margin(p_project uuid)
returns table (
  sale_amount numeric, estimated_cost numeric, recorded_cost numeric,
  margin_estimated_pct numeric, margin_recorded_pct numeric, costs_complete boolean
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.has_permission('proyectos.view_margin') then return; end if;
  return query
    select s.amount, q.estimated_cost,
           coalesce((select sum(c.amount) from public.project_costs c
                     where c.project_id = p_project and c.status = 'posted'), 0),
           case when q.estimated_cost is null or s.amount = 0 then null
                else round((s.amount - q.estimated_cost) / s.amount * 100, 2) end,
           case when s.amount = 0 then null
                else round((s.amount - coalesce((select sum(c.amount) from public.project_costs c
                     where c.project_id = p_project and c.status = 'posted'), 0)) / s.amount * 100, 2) end,
           (pr.costs_complete_at is not null)
    from public.projects pr
    join public.sales s on s.id = pr.sale_id
    join public.quotes q on q.id = s.quote_id
    where pr.id = p_project;
end $$;

-- ─── Reportes (permisos reportes.*) ──────────────────────────────────────────
create or replace function public.report_business(p_from date, p_to date)
returns table (
  quoted numeric, sold numeric, collected numeric, invoiced numeric,
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
    coalesce((select sum(amount) from period_sales), 0),
    coalesce((select sum(amount) from public.payments where status='posted' and received_on between p_from and p_to), 0),
    coalesce((select sum(amount) from public.invoices where status='posted' and issued_on between p_from and p_to), 0),
    coalesce((select sum(greatest(0, ps.amount - coalesce(pd.amt,0)))
              from period_sales ps left join paid pd on pd.sale_id = ps.id), 0),
    (select count(*)::int from period_sales);
end $$;

create or replace function public.report_profitability(p_from date, p_to date)
returns table (
  sold_total numeric, cost_complete numeric, gain numeric, margin_pct numeric,
  jobs_total int, jobs_complete int, jobs_pending int
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.has_permission('reportes.view_profitability') then return; end if;
  return query
  with period_sales as (
    select s.id, s.amount, (pr.costs_complete_at is not null) as complete
    from public.sales s join public.projects pr on pr.sale_id = s.id
    where s.status = 'active' and s.accepted_on between p_from and p_to
  ),
  costs as (
    select pr.sale_id, sum(c.amount) amt from public.project_costs c
    join public.projects pr on pr.id = c.project_id
    where c.status = 'posted' group by pr.sale_id
  ),
  joined as (
    select ps.amount, ps.complete, coalesce(co.amt, 0) as cost
    from period_sales ps left join costs co on co.sale_id = ps.id
  ),
  base as (
    select coalesce(sum(amount) filter (where complete), 0) as sold_c,
           coalesce(sum(cost) filter (where complete), 0) as cost_c
    from joined
  )
  select coalesce((select sum(amount) from joined), 0), b.cost_c,
    case when b.sold_c > 0 then b.sold_c - b.cost_c else null end,
    case when b.sold_c > 0 then round((b.sold_c - b.cost_c) / b.sold_c * 100, 2) else null end,
    (select count(*)::int from joined),
    (select count(*) filter (where complete)::int from joined),
    (select count(*) filter (where not complete)::int from joined)
  from base b;
end $$;

create or replace function public.report_sellers(p_from date, p_to date)
returns table (
  owner_id uuid, display_name text, opps_created int, quotes_sent int,
  sales_count int, sold numeric, conversion_pct numeric
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_active() then return; end if;
  return query
  with opps as (
    select o.owner_id as uid, count(*) c from public.opportunities o
    where o.created_at::date between p_from and p_to group by o.owner_id
  ),
  qs as (
    select q.owner_id as uid, count(*) c from public.quotes q
    where q.issued_on between p_from and p_to and q.status in ('sent','accepted','rejected')
    group by q.owner_id
  ),
  sl as (
    select s.owner_id as uid, count(*) c, sum(s.amount) amt from public.sales s
    where s.status = 'active' and s.accepted_on between p_from and p_to group by s.owner_id
  )
  select p.id, p.display_name, coalesce(o.c,0)::int, coalesce(qu.c,0)::int,
         coalesce(sl.c,0)::int, coalesce(sl.amt,0),
         case when coalesce(qu.c,0)=0 then null else round(coalesce(sl.c,0)::numeric / qu.c * 100, 2) end
  from public.profiles p
  left join opps o on o.uid = p.id
  left join qs qu on qu.uid = p.id
  left join sl on sl.uid = p.id
  where p.active and (public.has_permission('reportes.view_global') or p.id = (select auth.uid()));
end $$;

create or replace function public.report_fairs(p_from date, p_to date)
returns table (fair_id uuid, name text, prospects int, buyers int, conversion_pct numeric)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.has_permission('reportes.view_global') then return; end if;
  return query
  with fp as (select fair_id, count(*) c from public.fair_prospects where status='active' group by fair_id),
  fs as (select origin_fair_id, count(distinct client_id) b from public.sales
         where status='active' and origin_fair_id is not null group by origin_fair_id)
  select f.id, f.name, coalesce(fp.c,0)::int, coalesce(fs.b,0)::int,
         case when coalesce(fp.c,0)=0 then null else round(coalesce(fs.b,0)::numeric / fp.c * 100, 2) end
  from public.fairs f
  left join fp on fp.fair_id = f.id
  left join fs on fs.origin_fair_id = f.id
  where f.starts_on between p_from and p_to or fs.b is not null;
end $$;

-- ─── Clientes: merge / reasignación (permiso clientes.merge) ──────────────────
create or replace function public.merge_clients(p_from uuid, p_into uuid, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.has_permission('clientes.merge') then raise exception 'no autorizado'; end if;
  if p_from = p_into then raise exception 'origen y destino iguales'; end if;
  if not exists (select 1 from public.clients where id = p_from and status='active') then
    raise exception 'cliente origen inexistente o no activo'; end if;
  if not exists (select 1 from public.clients where id = p_into and status='active') then
    raise exception 'cliente destino inexistente o no activo'; end if;
  update public.opportunities set client_id = p_into where client_id = p_from;
  update public.fair_prospects set client_id = p_into where client_id = p_from;
  update public.quotes set client_id = p_into where client_id = p_from;
  update public.sales set client_id = p_into where client_id = p_from;
  update public.clients set status='merged', merged_into_id = p_into, updated_at = now() where id = p_from;
  perform public.log_audit('clients', p_from, 'merge_clients',
    jsonb_build_object('from', p_from), jsonb_build_object('into', p_into), p_reason);
end $$;

create or replace function public.reassign_owner(
  p_entity text, p_id uuid, p_new_owner uuid, p_reason text
)
returns void language plpgsql security definer set search_path = '' as $$
declare v_old uuid;
begin
  if not public.has_permission('clientes.merge') then raise exception 'no autorizado'; end if;
  if not exists (select 1 from public.profiles where id = p_new_owner and active) then
    raise exception 'nuevo propietario inválido o inactivo'; end if;
  if p_entity = 'client' then
    update public.clients set owner_id = p_new_owner, updated_at = now()
      where id = p_id returning owner_id into v_old;
  elsif p_entity = 'prospect' then
    update public.fair_prospects set owner_id = p_new_owner, updated_at = now()
      where id = p_id returning owner_id into v_old;
  elsif p_entity = 'opportunity' then
    update public.opportunities set owner_id = p_new_owner, updated_at = now()
      where id = p_id returning owner_id into v_old;
  else raise exception 'entidad no soportada: %', p_entity; end if;
  perform public.log_audit(p_entity, p_id, 'reassign_owner',
    jsonb_build_object('owner', v_old), jsonb_build_object('owner', p_new_owner), p_reason);
end $$;
