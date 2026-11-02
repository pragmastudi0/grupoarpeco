-- ============================================================================
-- RBAC · Modelo de autorización (permisos, role_permissions, user_permissions)
-- Capa de permisos sobre los roles existentes. No edita migraciones históricas.
-- Las políticas comerciales se migran a has_permission en 20261031120100.
-- ============================================================================

-- ─── roles: metadatos (code intacto; sólo se relabela y se marca system) ─────
alter table public.roles add column if not exists description text;
alter table public.roles add column if not exists is_system boolean not null default false;
alter table public.roles add column if not exists protected boolean not null default false;

update public.roles set is_system = true where code in
  ('direction','administration','seller','execution','support');
update public.roles set label = 'Comercial' where code = 'seller';
update public.roles set label = 'Proyectos' where code = 'execution';

insert into public.roles (code, label, is_system, protected, description) values
  ('superadmin','Superadministrador', true, true, 'Rol técnico de máxima autoridad')
on conflict (code) do nothing;

-- ─── Catálogo de permisos ────────────────────────────────────────────────────
create table public.permissions (
  code        text primary key,
  module      text not null,
  action      text not null,
  label       text not null,
  description text,
  reserved    boolean not null default false  -- técnicas: nunca por excepción individual
);

insert into public.permissions (code, module, action, label, reserved) values
  -- Clientes
  ('clientes.view','clientes','view','Ver clientes (propios)',false),
  ('clientes.view_all','clientes','view_all','Ver todos los clientes',false),
  ('clientes.create','clientes','create','Crear clientes',false),
  ('clientes.update','clientes','update','Editar clientes (propios)',false),
  ('clientes.update_all','clientes','update_all','Editar todos los clientes',false),
  ('clientes.merge','clientes','merge','Fusionar / reasignar clientes',false),
  -- Oportunidades / CRM
  ('oportunidades.view','oportunidades','view','Ver oportunidades (propias)',false),
  ('oportunidades.view_all','oportunidades','view_all','Ver todas las oportunidades',false),
  ('oportunidades.create','oportunidades','create','Crear oportunidades',false),
  ('oportunidades.update','oportunidades','update','Editar oportunidades (propias)',false),
  ('oportunidades.update_all','oportunidades','update_all','Editar todas las oportunidades',false),
  -- Ferias y prospectos
  ('ferias.view','ferias','view','Ver ferias',false),
  ('ferias.manage','ferias','manage','Crear/editar ferias',false),
  ('ferias.prospect_view','ferias','prospect_view','Ver prospectos (propios)',false),
  ('ferias.prospect_view_all','ferias','prospect_view_all','Ver todos los prospectos',false),
  ('ferias.prospect_create','ferias','prospect_create','Crear/editar prospectos',false),
  -- Presupuestos
  ('presupuestos.view','presupuestos','view','Ver presupuestos (propios)',false),
  ('presupuestos.view_all','presupuestos','view_all','Ver todos los presupuestos',false),
  ('presupuestos.create','presupuestos','create','Crear presupuestos',false),
  ('presupuestos.update','presupuestos','update','Editar presupuestos (propios)',false),
  ('presupuestos.update_all','presupuestos','update_all','Editar todos los presupuestos',false),
  ('presupuestos.export_pdf','presupuestos','export_pdf','Descargar PDF',false),
  ('presupuestos.accept','presupuestos','accept','Aceptar presupuestos',false),
  ('presupuestos.view_margin','presupuestos','view_margin','Ver costo/margen interno',false),
  ('presupuestos.edit_internal','presupuestos','edit_internal','Editar costo/notas internas',false),
  -- Ventas / cobros / facturas
  ('ventas.view','ventas','view','Ver ventas (propias)',false),
  ('ventas.view_all','ventas','view_all','Ver todas las ventas',false),
  ('ventas.register_payment','ventas','register_payment','Registrar/anular cobros',false),
  ('ventas.register_invoice','ventas','register_invoice','Registrar/anular facturas',false),
  ('ventas.view_payment_details','ventas','view_payment_details','Ver medios/referencias de cobro',false),
  -- Proyectos / costos
  ('proyectos.view','proyectos','view','Ver proyectos (propios/asignados)',false),
  ('proyectos.view_all','proyectos','view_all','Ver todos los proyectos',false),
  ('proyectos.update','proyectos','update','Actualizar estado/fecha de proyectos',false),
  ('proyectos.assign','proyectos','assign','Asignar responsable de proyecto',false),
  ('proyectos.register_cost','proyectos','register_cost','Registrar/anular costos',false),
  ('proyectos.complete_costs','proyectos','complete_costs','Cerrar costos',false),
  ('proyectos.view_margin','proyectos','view_margin','Ver margen del proyecto',false),
  -- Reportes
  ('reportes.view_own','reportes','view_own','Ver mi actividad',false),
  ('reportes.view_global','reportes','view_global','Ver reportes globales (negocio/equipo/ferias)',false),
  ('reportes.view_profitability','reportes','view_profitability','Ver rentabilidad',false),
  -- Administración (técnicas → reserved)
  ('usuarios.view','usuarios','view','Ver usuarios',true),
  ('usuarios.invite','usuarios','invite','Invitar usuarios',true),
  ('usuarios.activate','usuarios','activate','Activar/desactivar usuarios',true),
  ('usuarios.manage_roles','usuarios','manage_roles','Asignar/quitar roles a usuarios',true),
  ('usuarios.manage_permissions','usuarios','manage_permissions','Gestionar permisos individuales',true),
  ('roles.manage','roles','manage','Crear/editar roles y su matriz de permisos',true),
  ('auditoria.view','auditoria','view','Ver auditoría',true),
  ('config.view','config','view','Ver configuración',false),
  ('config.manage','config','manage','Editar configuración',true);

-- ─── role_permissions y user_permissions ─────────────────────────────────────
create table public.role_permissions (
  role_code       text not null references public.roles (code) on delete cascade,
  permission_code text not null references public.permissions (code) on delete cascade,
  primary key (role_code, permission_code)
);

create table public.user_permissions (
  user_id         uuid not null references public.profiles (id) on delete cascade,
  permission_code text not null references public.permissions (code) on delete cascade,
  effect          text not null check (effect in ('grant','deny')),
  granted_by      uuid references auth.users (id),
  granted_at      timestamptz not null default now(),
  primary key (user_id, permission_code)
);

-- ─── Seed de compatibilidad (reproduce el acceso de HOY) ─────────────────────
-- Dirección: todo (incluye view_all/update_all, margen, globales y técnicas).
insert into public.role_permissions (role_code, permission_code)
  select 'direction', code from public.permissions;

-- Administración: comercial global + cobros/facturas + reportes, SIN técnicas ni margen.
insert into public.role_permissions (role_code, permission_code) values
  ('administration','clientes.view'),('administration','clientes.view_all'),
  ('administration','clientes.create'),('administration','clientes.update'),
  ('administration','clientes.update_all'),('administration','clientes.merge'),
  ('administration','oportunidades.view'),('administration','oportunidades.view_all'),
  ('administration','ferias.view'),('administration','ferias.prospect_view'),
  ('administration','ferias.prospect_view_all'),
  ('administration','presupuestos.view'),('administration','presupuestos.view_all'),
  ('administration','presupuestos.export_pdf'),
  ('administration','ventas.view'),('administration','ventas.view_all'),
  ('administration','ventas.register_payment'),('administration','ventas.register_invoice'),
  ('administration','ventas.view_payment_details'),
  ('administration','proyectos.view'),('administration','proyectos.view_all'),
  ('administration','reportes.view_global'),
  ('administration','config.view');

-- Comercial (seller): comercial PROPIO (sin *_all, sin margen, sin técnicas).
insert into public.role_permissions (role_code, permission_code) values
  ('seller','clientes.view'),('seller','clientes.create'),('seller','clientes.update'),
  ('seller','oportunidades.view'),('seller','oportunidades.create'),('seller','oportunidades.update'),
  ('seller','ferias.view'),('seller','ferias.prospect_view'),('seller','ferias.prospect_create'),
  ('seller','presupuestos.view'),('seller','presupuestos.create'),('seller','presupuestos.update'),
  ('seller','presupuestos.export_pdf'),('seller','presupuestos.accept'),
  ('seller','ventas.view'),
  ('seller','proyectos.view'),
  ('seller','reportes.view_own'),('seller','config.view');

-- Proyectos (execution): proyectos/costos asignados.
insert into public.role_permissions (role_code, permission_code) values
  ('execution','proyectos.view'),('execution','proyectos.update'),
  ('execution','proyectos.register_cost'),
  ('execution','ventas.view'),  -- ve sólo las ventas que gestiona (vía manages_sale)
  ('execution','config.view');

-- Soporte: mínimo (auditoría sólo con support_access vigente se mantiene aparte).
insert into public.role_permissions (role_code, permission_code) values
  ('support','config.view');

-- Superadmin: técnicas, SIN datos comerciales por defecto.
insert into public.role_permissions (role_code, permission_code) values
  ('superadmin','usuarios.view'),('superadmin','usuarios.invite'),
  ('superadmin','usuarios.activate'),('superadmin','usuarios.manage_roles'),
  ('superadmin','usuarios.manage_permissions'),('superadmin','roles.manage'),
  ('superadmin','auditoria.view'),('superadmin','config.view'),('superadmin','config.manage');

-- ─── has_permission: deny individual gana; grant complementa; sino rol ────────
create or replace function public.has_permission(p_code text)
returns boolean
language sql stable security definer set search_path = '' as $$
  select public.is_active() and not exists (
      select 1 from public.user_permissions up
      where up.user_id = (select auth.uid()) and up.permission_code = p_code and up.effect = 'deny'
    ) and (
      exists (
        select 1 from public.user_permissions up
        where up.user_id = (select auth.uid()) and up.permission_code = p_code and up.effect = 'grant'
      )
      or exists (
        select 1 from public.user_roles ur
        join public.role_permissions rp on rp.role_code = ur.role_code
        where ur.user_id = (select auth.uid()) and rp.permission_code = p_code
      )
    );
$$;
grant execute on function public.has_permission(text) to authenticated;

-- Mis permisos efectivos (para el cliente).
create or replace function public.my_permissions()
returns setof text
language sql stable security definer set search_path = '' as $$
  select p.code from public.permissions p
  where public.is_active() and (
    not exists (select 1 from public.user_permissions up
      where up.user_id = (select auth.uid()) and up.permission_code = p.code and up.effect='deny')
    and (
      exists (select 1 from public.user_permissions up
        where up.user_id = (select auth.uid()) and up.permission_code = p.code and up.effect='grant')
      or exists (select 1 from public.user_roles ur
        join public.role_permissions rp on rp.role_code = ur.role_code
        where ur.user_id = (select auth.uid()) and rp.permission_code = p.code)
    )
  );
$$;
grant execute on function public.my_permissions() to authenticated;

-- Permisos efectivos de un usuario (para la UI admin; sólo quien gestiona permisos).
create or replace function public.effective_permissions(p_user uuid)
returns table (permission_code text, source text)
language sql stable security definer set search_path = '' as $$
  select p.code,
    case
      when exists (select 1 from public.user_permissions up where up.user_id=p_user and up.permission_code=p.code and up.effect='deny') then 'denied'
      when exists (select 1 from public.user_permissions up where up.user_id=p_user and up.permission_code=p.code and up.effect='grant') then 'granted'
      when exists (select 1 from public.user_roles ur join public.role_permissions rp on rp.role_code=ur.role_code where ur.user_id=p_user and rp.permission_code=p.code) then 'role'
      else 'none'
    end as source
  from public.permissions p
  where public.has_permission('usuarios.manage_permissions') or public.has_role('superadmin');
$$;
grant execute on function public.effective_permissions(uuid) to authenticated;

-- ─── RLS de las tablas nuevas ────────────────────────────────────────────────
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_permissions enable row level security;

create policy permissions_select on public.permissions for select to authenticated using (public.is_active());
create policy role_permissions_select on public.role_permissions for select to authenticated using (public.is_active());
create policy user_permissions_select on public.user_permissions for select to authenticated
  using (user_id = (select auth.uid()) or public.has_permission('usuarios.manage_permissions'));

revoke all on public.permissions, public.role_permissions, public.user_permissions from anon, authenticated;
grant select on public.permissions to authenticated;
grant select on public.role_permissions to authenticated;
grant select on public.user_permissions to authenticated;
-- Escrituras sólo por RPC (definidas en 20261031120200_rbac_admin).
