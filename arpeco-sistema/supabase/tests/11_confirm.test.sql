-- pgTAP · Separación aceptar / confirmar venta
-- Seed: P-2026-0001 (sent, de 3333); P-2026-0002 (draft, de 3333).
begin;
select plan(6);

set local role authenticated;

-- El Vendedor dueño acepta su presupuesto.
set local request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';
select lives_ok(
  $$ select public.accept_quote('d0000000-0000-0000-0000-000000000001', 1, 'ok') $$,
  'Vendedor dueño acepta su presupuesto'
);
select is(
  (select count(*)::int from public.sales where quote_id = 'd0000000-0000-0000-0000-000000000001'),
  0, 'Aceptar NO genera venta'
);

-- Ejecución (sin permiso ventas.confirm ni alcance) no puede confirmar.
set local request.jwt.claims = '{"sub":"44444444-4444-4444-4444-444444444444","role":"authenticated"}';
select throws_ok(
  $$ select public.confirm_sale('d0000000-0000-0000-0000-000000000001', 1) $$,
  null, null, 'Sin permiso ventas.confirm: no puede confirmar'
);

-- El Vendedor dueño confirma la venta.
set local request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';
select lives_ok(
  $$ select public.confirm_sale('d0000000-0000-0000-0000-000000000001', 1) $$,
  'Vendedor dueño confirma la venta'
);
select is(
  (select count(*)::int from public.sales where quote_id = 'd0000000-0000-0000-0000-000000000001'),
  1, 'Confirmar genera exactamente una venta'
);

-- No se puede confirmar un presupuesto que no está aceptado (P-0002 es borrador).
select throws_ok(
  $$ select public.confirm_sale('d0000000-0000-0000-0000-000000000002', 1) $$,
  null, null, 'No se confirma un presupuesto no aceptado'
);

select * from finish();
rollback;
