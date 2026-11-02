-- pgTAP · El rol anónimo está completamente denegado (B03)
begin;
select plan(3);

set local role anon;
set local request.jwt.claims = '{"role":"anon"}';

select throws_ok(
  $$ select * from public.profiles $$,
  '42501',
  null,
  'anon: permission denied en profiles'
);
select throws_ok(
  $$ select * from public.audit_events $$,
  '42501',
  null,
  'anon: permission denied en audit_events'
);
select throws_ok(
  $$ select public.grant_role('33333333-3333-3333-3333-333333333333','seller','x',null) $$,
  '42501',
  null,
  'anon: no puede ejecutar grant_role'
);

select * from finish();
rollback;
