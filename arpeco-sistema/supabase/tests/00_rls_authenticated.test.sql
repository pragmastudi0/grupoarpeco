-- pgTAP · RLS y permisos para usuarios autenticados (B03)
-- Usuarios del seed: 1111=Dirección, 3333=Vendedor, 5555=Inactivo.
begin;
select plan(13);

set local role authenticated;

-- ── Dirección (1111) ────────────────────────────────────────────────────────
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

select ok(public.is_active(), 'Dirección activa: is_active() = true');
select ok(public.is_direction(), 'Dirección: is_direction() = true');
select is(
  (select count(*)::int from public.profiles),
  5,
  'Dirección ve todos los perfiles (5)'
);
select ok(
  (select count(*) >= 0 from public.audit_events),
  'Dirección puede leer audit_events sin error'
);

-- ── Vendedor (3333) ──────────────────────────────────────────────────────────
set local request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';

select ok(public.is_active(), 'Vendedor activo: is_active() = true');
select ok(not public.is_direction(), 'Vendedor: is_direction() = false');
select is(
  (select count(*)::int from public.profiles),
  1,
  'Vendedor sólo ve su propio perfil (1)'
);
select is(
  (select count(*)::int from public.audit_events),
  0,
  'Vendedor no ve auditoría (RLS vacía el resultado)'
);
select throws_ok(
  $$ update public.profiles set active = false where id = '33333333-3333-3333-3333-333333333333' $$,
  null,
  null,
  'Vendedor no puede cambiar active de su perfil (guardia de columnas)'
);
select throws_ok(
  $$ insert into public.user_roles (user_id, role_code) values ('33333333-3333-3333-3333-333333333333','direction') $$,
  '42501',
  null,
  'Vendedor no puede insertar en user_roles (sin GRANT)'
);

-- ── Usuario inactivo (5555) ──────────────────────────────────────────────────
set local request.jwt.claims = '{"sub":"55555555-5555-5555-5555-555555555555","role":"authenticated"}';

select ok(not public.is_active(), 'Inactivo: is_active() = false');
select is(
  (select count(*)::int from public.roles),
  0,
  'Inactivo no ve el catálogo de roles (gated por is_active)'
);
select is(
  (select count(*)::int from public.profiles),
  1,
  'Inactivo ve sólo su propio perfil (para mostrar cuenta inactiva)'
);

select * from finish();
rollback;
