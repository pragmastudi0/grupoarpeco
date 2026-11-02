-- pgTAP · Plantillas de presupuestos + duplicar presupuesto
begin;
select plan(9);

set local role authenticated;

-- ── Comercial (seller): usa plantillas pero NO las gestiona ──────────────────
set local request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';
select throws_ok(
  $$ select public.create_template('X', null, '[]'::jsonb) $$,
  null, null, 'Comercial no puede gestionar plantillas'
);
-- Crea presupuesto desde la plantilla del seed (3 ítems) para su cliente.
select lives_ok(
  $$ select public.create_quote_from_template(
       'e1000000-0000-0000-0000-000000000001',
       'a0000000-0000-0000-0000-000000000002', 'Desde plantilla') $$,
  'Comercial crea presupuesto desde plantilla'
);
select ok(
  (select count(*) from public.quote_items qi
   join public.quotes q on q.id = qi.quote_id
   where q.title = 'Desde plantilla' and q.owner_id = '33333333-3333-3333-3333-333333333333') = 3,
  'El presupuesto copió los 3 conceptos de la plantilla'
);
select is(
  (select q.total from public.quotes q
   where q.title = 'Desde plantilla' and q.owner_id = '33333333-3333-3333-3333-333333333333'),
  12000000.00, 'El total se recalculó (12.000.000)'
);

-- Duplicar su propio presupuesto (P-2026-0001, 3 ítems) → nuevo borrador propio.
select lives_ok(
  $$ select public.duplicate_quote('d0000000-0000-0000-0000-000000000001') $$,
  'Comercial duplica su presupuesto'
);
select ok(
  (select count(*) from public.quotes where title = 'Stand Feria de la Construcción 2026'
   and status = 'draft' and owner_id = '33333333-3333-3333-3333-333333333333') >= 1,
  'La duplicación crea un borrador nuevo'
);

-- ── Administración gestiona plantillas ───────────────────────────────────────
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select lives_ok(
  $$ select public.create_template('Cartelería base', 'desc',
       '[{"position":1,"description":"Cartel","quantity":2,"unit_price":500000}]'::jsonb) $$,
  'Administración crea una plantilla'
);
select lives_ok(
  $$ select public.save_quote_as_template('d0000000-0000-0000-0000-000000000001', 'Desde presup', null) $$,
  'Administración guarda un presupuesto como plantilla'
);
select ok(
  (select count(*) from public.quote_template_items t
   join public.quote_templates qt on qt.id = t.template_id
   where qt.name = 'Desde presup') = 3,
  'La plantilla guardada copió los 3 conceptos del presupuesto'
);

select * from finish();
rollback;
