-- ============================================================================
-- Etapa 4 · Ventas, proyectos, cobros y facturas (S01–S06)
-- Fuente: docs/03_MODELO_DATOS.md y docs/04_ROLES_PERMISOS.md
--
--  * Venta y proyecto se crean SÓLO por accept_quote, en una transacción,
--    con quote_id/sale_id únicos. Reintento idempotente devuelve lo existente.
--  * Cobros/facturas: idempotency_key única; se bloquea sobrecobro/sobrefactura;
--    corrección por anulación con motivo (nunca DELETE ni edición silenciosa).
--  * V ve importes de su cartera pero no medios/referencias bancarias (columna).
-- ============================================================================

-- ─── Ventas ─────────────────────────────────────────────────────────────────
create table public.sales (
  id             uuid primary key default gen_random_uuid(),
  quote_id       uuid not null unique references public.quotes (id),
  quote_revision int not null,
  client_id      uuid not null references public.clients (id),
  owner_id       uuid not null references auth.users (id),
  origin_fair_id uuid references public.fairs (id),
  commercial_no  text unique,
  accepted_on    date not null,
  amount         numeric(18, 2) not null,
  currency       char(3) not null default 'ARS' check (currency = 'ARS'),
  status         text not null default 'active' check (status in ('active', 'void')),
  created_at     timestamptz not null default now()
);
create index sales_accepted_idx on public.sales (accepted_on, owner_id);

-- ─── Proyectos (se crean al aceptar) ────────────────────────────────────────
create table public.projects (
  id                 uuid primary key default gen_random_uuid(),
  sale_id            uuid not null unique references public.sales (id),
  commercial_no      text unique,
  manager_id         uuid references public.profiles (id),
  event_on           date,
  status             text not null default 'pending'
                       check (status in ('pending', 'in_progress', 'finished')),
  costs_complete_at  timestamptz,
  costs_complete_by  uuid references auth.users (id),
  costs_reopened_at  timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz
);
create index projects_manager_idx on public.projects (manager_id, status, event_on);
create trigger projects_touch before update on public.projects
  for each row execute function public.touch_updated_at();

-- ─── Cobros ─────────────────────────────────────────────────────────────────
create table public.payments (
  id               uuid primary key default gen_random_uuid(),
  sale_id          uuid not null references public.sales (id),
  amount           numeric(18, 2) not null check (amount > 0),
  received_on      date not null,
  method           text,
  reference        text,
  idempotency_key  uuid not null unique,
  status           text not null default 'posted' check (status in ('posted', 'void')),
  voids_payment_id uuid references public.payments (id),
  reason           text,
  created_by       uuid references auth.users (id) default auth.uid(),
  created_at       timestamptz not null default now()
);
create index payments_sale_idx on public.payments (sale_id, status, received_on);

-- ─── Facturas registradas ───────────────────────────────────────────────────
create table public.invoices (
  id               uuid primary key default gen_random_uuid(),
  sale_id          uuid not null references public.sales (id),
  invoice_no       text not null,
  issued_on        date not null,
  amount           numeric(18, 2) not null check (amount > 0),
  document_path    text,
  idempotency_key  uuid not null unique,
  status           text not null default 'posted' check (status in ('posted', 'void')),
  voids_invoice_id uuid references public.invoices (id),
  reason           text,
  created_by       uuid references auth.users (id) default auth.uid(),
  created_at       timestamptz not null default now()
);
create index invoices_sale_idx on public.invoices (sale_id, status, issued_on);

-- ─── Vista de saldos (security_invoker: respeta RLS del que consulta) ────────
create view public.sale_balances with (security_invoker = true) as
  select s.id as sale_id,
         s.amount,
         coalesce((select sum(p.amount) from public.payments p
                   where p.sale_id = s.id and p.status = 'posted'), 0) as paid,
         coalesce((select sum(i.amount) from public.invoices i
                   where i.sale_id = s.id and i.status = 'posted'), 0) as invoiced,
         s.amount - coalesce((select sum(p.amount) from public.payments p
                   where p.sale_id = s.id and p.status = 'posted'), 0) as pending_collection,
         s.amount - coalesce((select sum(i.amount) from public.invoices i
                   where i.sale_id = s.id and i.status = 'posted'), 0) as pending_invoicing
  from public.sales s;

-- ============================================================================
-- RLS
-- ============================================================================
alter table public.sales    enable row level security;
alter table public.projects enable row level security;
alter table public.payments enable row level security;
alter table public.invoices enable row level security;

-- Helpers cruzados SECURITY DEFINER: evitan recursión entre políticas de
-- sales y projects (cada política necesita consultar la otra tabla).
create or replace function public.manages_sale(p_sale uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.projects pr
                 where pr.sale_id = p_sale and pr.manager_id = (select auth.uid()));
$$;
create or replace function public.owns_sale(p_sale uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.sales s
                 where s.id = p_sale and s.owner_id = (select auth.uid()));
$$;
grant execute on function public.manages_sale(uuid) to authenticated;
grant execute on function public.owns_sale(uuid) to authenticated;

-- Ventas: D/A global; V su cartera; E proyección operativa de asignados.
create policy sales_select on public.sales for select to authenticated
  using (
    public.is_admin_or_direction()
    or (public.is_active() and owner_id = (select auth.uid()))
    or public.manages_sale(id)
  );
-- Sin INSERT/UPDATE directos: sólo RPC. (default-deny)

-- Proyectos: D/A global; V su venta; E asignado.
create policy projects_select on public.projects for select to authenticated
  using (
    public.is_admin_or_direction()
    or manager_id = (select auth.uid())
    or public.owns_sale(sale_id)
  );
-- E actualiza estado/fecha de asignados; D/A global (por columnas permitidas).
create policy projects_update_assigned on public.projects for update to authenticated
  using (public.is_active() and manager_id = (select auth.uid()))
  with check (manager_id = (select auth.uid()));
create policy projects_update_admin on public.projects for update to authenticated
  using (public.is_admin_or_direction()) with check (public.is_admin_or_direction());

-- Cobros/facturas: D/A global; V su cartera (sólo importes; medios/refs por columna).
create policy payments_select on public.payments for select to authenticated
  using (public.is_admin_or_direction() or public.owns_sale(sale_id));
create policy invoices_select on public.invoices for select to authenticated
  using (public.is_admin_or_direction() or public.owns_sale(sale_id));

-- ─── GRANTs ─────────────────────────────────────────────────────────────────
revoke all on public.sales, public.projects, public.payments, public.invoices from anon, authenticated;
revoke all on public.sale_balances from anon, authenticated;

grant select on public.sales to authenticated;
grant select on public.sale_balances to authenticated;
-- E/D actualizan sólo estado y fecha del proyecto (asignación por RPC).
grant select on public.projects to authenticated;
grant update (status, event_on) on public.projects to authenticated;
-- Importes visibles; método/referencia NO por tabla (sólo A/D vía RPC).
grant select (id, sale_id, amount, received_on, status, created_at) on public.payments to authenticated;
grant select (id, sale_id, invoice_no, issued_on, amount, status, created_at) on public.invoices to authenticated;

-- ============================================================================
-- RPC · Aceptación transaccional (S01)
-- ============================================================================
create or replace function public.accept_quote(
  p_id uuid, p_expected_revision int, p_evidence text default null
)
returns table (sale_id uuid, project_id uuid)
language plpgsql security definer set search_path = '' as $$
declare q public.quotes; v_sale public.sales; v_sale_id uuid; v_project_id uuid;
begin
  select * into q from public.quotes where id = p_id for update;
  if not found then raise exception 'presupuesto inexistente'; end if;
  if not (public.is_admin_or_direction() or (public.is_active() and q.owner_id = (select auth.uid()))) then
    raise exception 'no autorizado'; end if;

  -- Idempotencia: si ya hay venta para este presupuesto…
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
revoke execute on function public.accept_quote(uuid, int, text) from public, anon;
grant execute on function public.accept_quote(uuid, int, text) to authenticated;

-- ============================================================================
-- RPC · Cobros (S03/S04)
-- ============================================================================
create or replace function public.register_payment(
  p_sale uuid, p_amount numeric, p_received date, p_method text,
  p_reference text, p_idempotency uuid
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_amount numeric; v_paid numeric;
begin
  if not public.is_admin_or_direction() then
    raise exception 'sólo Dirección/Administración registran cobros'; end if;

  select id into v_id from public.payments where idempotency_key = p_idempotency;
  if found then return v_id; end if; -- idempotente

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
revoke execute on function public.register_payment(uuid, numeric, date, text, text, uuid) from public, anon;
grant execute on function public.register_payment(uuid, numeric, date, text, text, uuid) to authenticated;

create or replace function public.void_payment(p_id uuid, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin_or_direction() then raise exception 'no autorizado'; end if;
  update public.payments set status = 'void', reason = p_reason
    where id = p_id and status = 'posted';
  if not found then raise exception 'cobro inexistente o ya anulado'; end if;
  perform public.log_audit('payments', p_id, 'void_payment', null, null, p_reason);
end $$;
revoke execute on function public.void_payment(uuid, text) from public, anon;
grant execute on function public.void_payment(uuid, text) to authenticated;

-- ============================================================================
-- RPC · Facturas registradas (S05/S06)
-- ============================================================================
create or replace function public.register_invoice(
  p_sale uuid, p_invoice_no text, p_issued date, p_amount numeric,
  p_idempotency uuid, p_document_path text default null
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_amount numeric; v_inv numeric;
begin
  if not public.is_admin_or_direction() then
    raise exception 'sólo Dirección/Administración registran facturas'; end if;

  select id into v_id from public.invoices where idempotency_key = p_idempotency;
  if found then return v_id; end if;

  if p_amount <= 0 then raise exception 'importe inválido'; end if;
  select amount into v_amount from public.sales where id = p_sale and status = 'active';
  if not found then raise exception 'venta inexistente o anulada'; end if;
  select coalesce(sum(amount), 0) into v_inv from public.invoices
    where sale_id = p_sale and status = 'posted';
  if v_inv + p_amount > v_amount then
    raise exception 'sobrefacturación bloqueada'; end if;

  insert into public.invoices (sale_id, invoice_no, issued_on, amount, document_path, idempotency_key)
  values (p_sale, p_invoice_no, p_issued, p_amount, p_document_path, p_idempotency)
  returning id into v_id;
  perform public.log_audit('invoices', v_id, 'register_invoice', null,
    jsonb_build_object('sale_id', p_sale, 'amount', p_amount), null);
  return v_id;
end $$;
revoke execute on function public.register_invoice(uuid, text, date, numeric, uuid, text) from public, anon;
grant execute on function public.register_invoice(uuid, text, date, numeric, uuid, text) to authenticated;

create or replace function public.void_invoice(p_id uuid, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin_or_direction() then raise exception 'no autorizado'; end if;
  update public.invoices set status = 'void', reason = p_reason
    where id = p_id and status = 'posted';
  if not found then raise exception 'factura inexistente o ya anulada'; end if;
  perform public.log_audit('invoices', p_id, 'void_invoice', null, null, p_reason);
end $$;
revoke execute on function public.void_invoice(uuid, text) from public, anon;
grant execute on function public.void_invoice(uuid, text) to authenticated;

-- Detalle sensible de cobros (medios/referencias): SÓLO Dirección/Administración.
create or replace function public.payment_details(p_sale uuid)
returns table (id uuid, amount numeric, received_on date, method text, reference text, status text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin_or_direction() then return; end if;
  return query select p.id, p.amount, p.received_on, p.method, p.reference, p.status
    from public.payments p where p.sale_id = p_sale order by p.received_on;
end $$;
revoke execute on function public.payment_details(uuid) from public, anon;
grant execute on function public.payment_details(uuid) to authenticated;

-- Asignar responsable de proyecto (D/A).
create or replace function public.assign_project_manager(p_project uuid, p_manager uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin_or_direction() then raise exception 'no autorizado'; end if;
  update public.projects set manager_id = p_manager, updated_at = now() where id = p_project;
  perform public.log_audit('projects', p_project, 'assign_manager', null,
    jsonb_build_object('manager_id', p_manager), null);
end $$;
revoke execute on function public.assign_project_manager(uuid, uuid) from public, anon;
grant execute on function public.assign_project_manager(uuid, uuid) to authenticated;
