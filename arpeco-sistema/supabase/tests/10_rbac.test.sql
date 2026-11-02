-- pgTAP · RBAC: roles personalizados efectivos, deny gana, reserved, anti-escalación
begin;
select plan(15);

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

-- Rol personalizado que concede reportes globales.
select lives_ok($$ select public.create_role('comercial_junior','Comercial Junior') $$,
  'Crea un rol personalizado');
select lives_ok($$ select public.set_role_permissions('comercial_junior', array['reportes.view_global']) $$,
  'Define la matriz del rol (reportes globales)');
select lives_ok($$ select public.grant_role('33333333-3333-3333-3333-333333333333','comercial_junior','x') $$,
  'Asigna el rol al Vendedor');

-- El rol personalizado opera DE VERDAD en la base: ahora el vendedor ve negocio.
set local request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';
select is((select count(*)::int from public.report_business('2026-01-01','2026-12-31')), 1,
  'Rol personalizado concede reportes globales en la base');

-- Denegación individual: gana sobre el rol, también en backend.
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select lives_ok($$ select public.set_user_permission('33333333-3333-3333-3333-333333333333','reportes.view_global','deny') $$,
  'Deniega el permiso individualmente');
set local request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';
select is((select count(*)::int from public.report_business('2026-01-01','2026-12-31')), 0,
  'La denegación individual corta en la base (deny gana)');

-- Reserved no admite excepción individual.
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select throws_ok($$ select public.set_user_permission('33333333-3333-3333-3333-333333333333','roles.manage','grant') $$,
  null, null, 'Un permiso reservado no se concede por excepción individual');

-- Anti-escalación: un gestor con roles.manage no puede delegar un permiso que no tiene.
select lives_ok($$ select public.create_role('gestor_limitado','Gestor limitado') $$, 'Crea rol gestor');
select lives_ok($$ select public.set_role_permissions('gestor_limitado', array['roles.manage','clientes.view']) $$,
  'Superadmin puede incluir reserved en un rol');
select lives_ok($$ select public.grant_role('22222222-2222-2222-2222-222222222222','gestor_limitado','x') $$,
  'Asigna gestor a Administración');
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select throws_ok($$ select public.set_role_permissions('comercial_junior', array['presupuestos.view_margin']) $$,
  null, null, 'No se puede delegar un permiso que no se posee (anti-escalación)');

-- Guardas de roles.
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select throws_ok($$ select public.delete_role('comercial_junior') $$,
  null, null, 'No se borra un rol con usuarios asignados');
select throws_ok($$ select public.delete_role('seller') $$,
  null, null, 'No se borra un rol de sistema');

-- Superadministrador.
select is((select public.is_last_superadmin('11111111-1111-1111-1111-111111111111')), true,
  'Dirección demo es el último superadmin');
select lives_ok($$ select public.grant_role('22222222-2222-2222-2222-222222222222','superadmin','x','11111111-1111-1111-1111-111111111111') $$,
  'Sólo un superadmin puede asignar el rol superadmin');

select * from finish();
rollback;
