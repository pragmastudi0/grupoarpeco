-- pgTAP · RPC administrativas: roles, doble control y activación (B05)
begin;
select plan(13);

set local role authenticated;

-- ── Vendedor NO puede gestionar roles ────────────────────────────────────────
set local request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';
select throws_ok(
  $$ select public.grant_role('44444444-4444-4444-4444-444444444444','seller','intento',null) $$,
  null, null,
  'Vendedor no autorizado a grant_role'
);

-- ── Dirección gestiona roles ─────────────────────────────────────────────────
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

select throws_ok(
  $$ select public.grant_role('11111111-1111-1111-1111-111111111111','seller','self',null) $$,
  null, null,
  'Autopromoción rechazada (no modificar roles propios)'
);

select lives_ok(
  $$ select public.grant_role('44444444-4444-4444-4444-444444444444','seller','alta normal',null) $$,
  'Dirección otorga rol normal (seller) a otro usuario'
);
select is(
  (select count(*)::int from public.user_roles
   where user_id = '44444444-4444-4444-4444-444444444444' and role_code = 'seller'),
  1,
  'El rol seller quedó asignado'
);

-- Alto privilegio exige segunda aprobación válida (D03)
select throws_ok(
  $$ select public.grant_role('33333333-3333-3333-3333-333333333333','direction','sin aprobador',null) $$,
  null, null,
  'Rol de alto privilegio sin segundo aprobador: rechazado'
);
select throws_ok(
  $$ select public.grant_role('33333333-3333-3333-3333-333333333333','direction','aprobador=yo','11111111-1111-1111-1111-111111111111') $$,
  null, null,
  'Segundo aprobador igual al solicitante: rechazado'
);
select throws_ok(
  $$ select public.grant_role('33333333-3333-3333-3333-333333333333','direction','aprobador no-dir','22222222-2222-2222-2222-222222222222') $$,
  null, null,
  'Segundo aprobador que no es Dirección: rechazado'
);

-- ── Activación / baja ────────────────────────────────────────────────────────
select throws_ok(
  $$ select public.set_user_active('11111111-1111-1111-1111-111111111111', false, 'self') $$,
  null, null,
  'No se permite cambiar el estado activo propio'
);
select lives_ok(
  $$ select public.set_user_active('55555555-5555-5555-5555-555555555555', true, 'activar') $$,
  'Dirección activa a un usuario inactivo'
);
select is(
  (select active from public.profiles where id = '55555555-5555-5555-5555-555555555555'),
  true,
  'El usuario quedó activo'
);

-- ── Revocación ───────────────────────────────────────────────────────────────
select lives_ok(
  $$ select public.revoke_role('44444444-4444-4444-4444-444444444444','seller','fin') $$,
  'Dirección revoca el rol seller'
);
select is(
  (select count(*)::int from public.user_roles
   where user_id = '44444444-4444-4444-4444-444444444444' and role_code = 'seller'),
  0,
  'El rol seller fue revocado'
);

-- ── Auditoría registrada ─────────────────────────────────────────────────────
select ok(
  (select count(*) from public.audit_events
   where actor_id = '11111111-1111-1111-1111-111111111111') >= 3,
  'Cada acción administrativa exitosa quedó auditada (grant, set_active, revoke)'
);

select * from finish();
rollback;
