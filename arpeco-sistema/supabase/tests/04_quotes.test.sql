-- pgTAP · Presupuestos: protección por columna, margen y ciclo de vida (Q01–Q05)
-- Seed: P-2026-0001 (sent, de 3333), P-2026-0002 (draft, de 3333).
begin;
select plan(10);

set local role authenticated;

-- ── Vendedor ─────────────────────────────────────────────────────────────────
set local request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';

select is((select count(*)::int from public.quotes), 2, 'Vendedor ve sus 2 presupuestos');

-- No puede leer la columna de costo (GRANT por columna lo niega)
select throws_ok(
  $$ select estimated_cost from public.quotes where id = 'd0000000-0000-0000-0000-000000000001' $$,
  '42501', null,
  'Vendedor no puede leer la columna estimated_cost'
);
-- Sí puede leer columnas públicas
select is(
  (select total::text from public.quotes where id = 'd0000000-0000-0000-0000-000000000001'),
  '12000000.00',
  'Vendedor lee el total público'
);
-- Margen: sin filas para no-Dirección
select is(
  (select count(*)::int from public.quote_margin('d0000000-0000-0000-0000-000000000001')),
  0,
  'quote_margin no devuelve nada a Vendedor'
);
-- No puede editar ítems de un presupuesto enviado
select throws_ok(
  $$ insert into public.quote_items (quote_id, position, description, quantity, unit_price)
     values ('d0000000-0000-0000-0000-000000000001', 9, 'extra', 1, 100) $$,
  null, null,
  'No se editan ítems de un presupuesto enviado'
);
-- Sí puede editar ítems del borrador
select lives_ok(
  $$ insert into public.quote_items (quote_id, position, description, quantity, unit_price)
     values ('d0000000-0000-0000-0000-000000000002', 3, 'Adicional', 1, 500000) $$,
  'Edita ítems del borrador'
);
-- Enviar el borrador: crea revisión inmutable
select lives_ok(
  $$ select public.send_quote('d0000000-0000-0000-0000-000000000002') $$,
  'Vendedor envía su borrador'
);
select ok(
  (select count(*) from public.quote_revisions where quote_id = 'd0000000-0000-0000-0000-000000000002') >= 1,
  'Enviar congela una revisión'
);
select throws_ok(
  $$ select public.send_quote('d0000000-0000-0000-0000-000000000002') $$,
  null, null,
  'No se puede re-enviar un presupuesto ya enviado'
);

-- ── Dirección: margen visible ────────────────────────────────────────────────
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select is(
  (select margin_pct::text from public.quote_margin('d0000000-0000-0000-0000-000000000001')),
  '35.00',
  'Dirección ve el margen (12M vs 7,8M = 35,00%)'
);

select * from finish();
rollback;
