-- ============================================================================
-- RBAC · Fase 2: políticas RLS comerciales por PERMISO + ALCANCE
-- Reemplaza las políticas atadas a rol por políticas que leen has_permission,
-- para que roles personalizados y denegaciones individuales operen de verdad.
-- Patrón lectura:  view AND (view_all OR es_propio)
-- Patrón escritura: <accion> AND (update_all OR es_propio)
-- No se edita ninguna migración histórica.
-- ============================================================================

-- ─── CLIENTES ────────────────────────────────────────────────────────────────
drop policy if exists clients_select on public.clients;
drop policy if exists clients_insert on public.clients;
drop policy if exists clients_update_owner on public.clients;
drop policy if exists clients_update_admin on public.clients;

create policy clients_select on public.clients for select to authenticated
  using (public.has_permission('clientes.view')
    and (public.has_permission('clientes.view_all') or owner_id = (select auth.uid())));
create policy clients_insert on public.clients for insert to authenticated
  with check (public.has_permission('clientes.create')
    and (public.has_permission('clientes.update_all') or owner_id = (select auth.uid())));
create policy clients_update_own on public.clients for update to authenticated
  using (public.has_permission('clientes.update') and owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));
create policy clients_update_all on public.clients for update to authenticated
  using (public.has_permission('clientes.update_all'))
  with check (public.has_permission('clientes.update_all'));

-- Contactos: siguen la visibilidad/escritura del cliente.
drop policy if exists client_contacts_all on public.client_contacts;
create policy client_contacts_select on public.client_contacts for select to authenticated
  using (exists (select 1 from public.clients c where c.id = client_id
    and public.has_permission('clientes.view')
    and (public.has_permission('clientes.view_all') or c.owner_id = (select auth.uid()))));
create policy client_contacts_write on public.client_contacts for all to authenticated
  using (exists (select 1 from public.clients c where c.id = client_id
    and public.has_permission('clientes.update')
    and (public.has_permission('clientes.update_all') or c.owner_id = (select auth.uid()))))
  with check (exists (select 1 from public.clients c where c.id = client_id
    and public.has_permission('clientes.update')
    and (public.has_permission('clientes.update_all') or c.owner_id = (select auth.uid()))));

-- ─── OPORTUNIDADES ───────────────────────────────────────────────────────────
drop policy if exists opps_select on public.opportunities;
drop policy if exists opps_insert on public.opportunities;
drop policy if exists opps_update_owner on public.opportunities;
drop policy if exists opps_update_direction on public.opportunities;

create policy opps_select on public.opportunities for select to authenticated
  using (public.has_permission('oportunidades.view')
    and (public.has_permission('oportunidades.view_all') or owner_id = (select auth.uid())));
create policy opps_insert on public.opportunities for insert to authenticated
  with check (public.has_permission('oportunidades.create')
    and (public.has_permission('oportunidades.update_all') or owner_id = (select auth.uid())));
create policy opps_update_own on public.opportunities for update to authenticated
  using (public.has_permission('oportunidades.update') and owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));
create policy opps_update_all on public.opportunities for update to authenticated
  using (public.has_permission('oportunidades.update_all'))
  with check (public.has_permission('oportunidades.update_all'));

-- Seguimientos
drop policy if exists followups_select on public.followups;
drop policy if exists followups_insert on public.followups;
drop policy if exists followups_update_owner on public.followups;
create policy followups_select on public.followups for select to authenticated
  using (public.has_permission('oportunidades.view')
    and (public.has_permission('oportunidades.view_all') or owner_id = (select auth.uid())));
create policy followups_insert on public.followups for insert to authenticated
  with check (public.has_permission('oportunidades.update') and owner_id = (select auth.uid()));
create policy followups_update_own on public.followups for update to authenticated
  using (public.has_permission('oportunidades.update') and owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

-- ─── FERIAS / PROSPECTOS ─────────────────────────────────────────────────────
drop policy if exists fairs_select on public.fairs;
drop policy if exists fairs_write_direction on public.fairs;
create policy fairs_select on public.fairs for select to authenticated
  using (public.has_permission('ferias.view'));
create policy fairs_write on public.fairs for all to authenticated
  using (public.has_permission('ferias.manage')) with check (public.has_permission('ferias.manage'));

drop policy if exists fair_staff_select on public.fair_staff;
drop policy if exists fair_staff_write on public.fair_staff;
create policy fair_staff_select on public.fair_staff for select to authenticated
  using (public.has_permission('ferias.view'));
create policy fair_staff_write on public.fair_staff for all to authenticated
  using (public.has_permission('ferias.manage')) with check (public.has_permission('ferias.manage'));

drop policy if exists prospects_select on public.fair_prospects;
drop policy if exists prospects_insert on public.fair_prospects;
drop policy if exists prospects_update_owner on public.fair_prospects;
drop policy if exists prospects_update_admin on public.fair_prospects;
create policy prospects_select on public.fair_prospects for select to authenticated
  using (public.has_permission('ferias.prospect_view')
    and (public.has_permission('ferias.prospect_view_all') or owner_id = (select auth.uid())));
create policy prospects_insert on public.fair_prospects for insert to authenticated
  with check (public.has_permission('ferias.prospect_create')
    and (public.has_permission('ferias.prospect_view_all') or owner_id = (select auth.uid())));
create policy prospects_update_own on public.fair_prospects for update to authenticated
  using (public.has_permission('ferias.prospect_create') and owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));
create policy prospects_update_all on public.fair_prospects for update to authenticated
  using (public.has_permission('ferias.prospect_view_all'))
  with check (public.has_permission('ferias.prospect_view_all'));

-- ─── PRESUPUESTOS ────────────────────────────────────────────────────────────
drop policy if exists quotes_select on public.quotes;
drop policy if exists quotes_insert on public.quotes;
drop policy if exists quotes_update_owner on public.quotes;
drop policy if exists quotes_update_admin on public.quotes;
create policy quotes_select on public.quotes for select to authenticated
  using (public.has_permission('presupuestos.view')
    and (public.has_permission('presupuestos.view_all') or owner_id = (select auth.uid())));
create policy quotes_insert on public.quotes for insert to authenticated
  with check (public.has_permission('presupuestos.create')
    and (public.has_permission('presupuestos.update_all') or owner_id = (select auth.uid())));
create policy quotes_update_own on public.quotes for update to authenticated
  using (public.has_permission('presupuestos.update') and owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));
create policy quotes_update_all on public.quotes for update to authenticated
  using (public.has_permission('presupuestos.update_all'))
  with check (public.has_permission('presupuestos.update_all'));

-- Ítems: visibles con el presupuesto; edición sólo en borrador y con permiso.
drop policy if exists quote_items_select on public.quote_items;
drop policy if exists quote_items_write on public.quote_items;
create policy quote_items_select on public.quote_items for select to authenticated
  using (exists (select 1 from public.quotes q where q.id = quote_id
    and public.has_permission('presupuestos.view')
    and (public.has_permission('presupuestos.view_all') or q.owner_id = (select auth.uid()))));
create policy quote_items_write on public.quote_items for all to authenticated
  using (exists (select 1 from public.quotes q where q.id = quote_id and q.status = 'draft'
    and public.has_permission('presupuestos.update')
    and (public.has_permission('presupuestos.update_all') or q.owner_id = (select auth.uid()))))
  with check (exists (select 1 from public.quotes q where q.id = quote_id and q.status = 'draft'
    and public.has_permission('presupuestos.update')
    and (public.has_permission('presupuestos.update_all') or q.owner_id = (select auth.uid()))));

drop policy if exists quote_revisions_select on public.quote_revisions;
create policy quote_revisions_select on public.quote_revisions for select to authenticated
  using (exists (select 1 from public.quotes q where q.id = quote_id
    and public.has_permission('presupuestos.view')
    and (public.has_permission('presupuestos.view_all') or q.owner_id = (select auth.uid()))));

-- ─── VENTAS / COBROS / FACTURAS ──────────────────────────────────────────────
drop policy if exists sales_select on public.sales;
create policy sales_select on public.sales for select to authenticated
  using (public.has_permission('ventas.view')
    and (public.has_permission('ventas.view_all') or owner_id = (select auth.uid()) or public.manages_sale(id)));

drop policy if exists payments_select on public.payments;
create policy payments_select on public.payments for select to authenticated
  using (public.has_permission('ventas.view')
    and (public.has_permission('ventas.view_all') or public.owns_sale(sale_id)));
drop policy if exists invoices_select on public.invoices;
create policy invoices_select on public.invoices for select to authenticated
  using (public.has_permission('ventas.view')
    and (public.has_permission('ventas.view_all') or public.owns_sale(sale_id)));

-- ─── PROYECTOS / COSTOS ──────────────────────────────────────────────────────
drop policy if exists projects_select on public.projects;
drop policy if exists projects_update_assigned on public.projects;
drop policy if exists projects_update_admin on public.projects;
create policy projects_select on public.projects for select to authenticated
  using (public.has_permission('proyectos.view')
    and (public.has_permission('proyectos.view_all') or manager_id = (select auth.uid()) or public.owns_sale(sale_id)));
create policy projects_update_assigned on public.projects for update to authenticated
  using (public.has_permission('proyectos.update') and manager_id = (select auth.uid()))
  with check (manager_id = (select auth.uid()));
create policy projects_update_all on public.projects for update to authenticated
  using (public.has_permission('proyectos.update') and public.has_permission('proyectos.view_all'))
  with check (public.has_permission('proyectos.view_all'));

drop policy if exists project_costs_select on public.project_costs;
create policy project_costs_select on public.project_costs for select to authenticated
  using (public.has_permission('proyectos.view_margin') or public.manages_project(project_id));
