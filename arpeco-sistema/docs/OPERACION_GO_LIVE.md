# Operación y salida a producción

Complementa `docs/08_DEPLOY_DEVOPS.md` y `docs/10_CHECKLIST_GO_LIVE.md` con el
estado real del sistema construido (etapas 1–7).

## Postura de seguridad (verificada)

- **RLS en todas las tablas** con `REVOKE ALL` + `GRANT` explícito por objeto y,
  donde hace falta, por **columna** (costo/margen de presupuestos, medios/
  referencias de cobros). `anon` siempre denegado; usuario inactivo falla todo.
- **Mutaciones sensibles sólo por RPC** `SECURITY DEFINER` con `search_path=''`:
  roles, activación, aceptación de presupuesto, cobros/facturas/costos. La
  aceptación es transaccional e idempotente (venta+proyecto únicos).
- **Auditoría append-only** (`audit_events`) sin UPDATE/DELETE desde la API.
- **82 pruebas pgTAP** cubren denegación anónima, aislamiento por cartera,
  protección de `owner_id`, columnas sensibles, idempotencia, sobrecobro y
  conciliación de reportes. CI corre app + base + secret-scan en cada PR.
- `service_role` sólo en funciones de servidor (`api/`); nunca en el cliente.
  La guardia `pnpm check:env` bloquea claves privilegiadas en variables `VITE_*`.

## Entornos y variables

| Variable | Dónde | Notas |
|---|---|---|
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | cliente (Vercel) | públicas, sujetas a RLS. Preview → staging; Production → prod |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `APP_ORIGIN` | funciones `api/` | secretas, sin prefijo `VITE_` |

## Publicación (resumen operativo)

1. Revisar diff de app y migraciones; confirmar backup reciente de producción.
2. Aplicar migraciones a **staging** (`supabase db push`), correr pgTAP/E2E/smoke.
3. Backup de producción y verificación de restaurabilidad.
4. Aplicar migraciones **expand-compatible** a producción (un ejecutor serial).
5. Promover el mismo commit a Vercel Production; smoke por rol (D/A/V/E), PDF y
   aceptación en entorno de prueba, sin crear operación real ficticia.
6. Registrar release/tag, hora, migraciones y responsable.

## Backup y recuperación

- Confirmar plan Supabase (backups diarios en planes pagos; PITR si aplica).
- Objetos de Storage no entran en el backup de DB → respaldo propio si se usan.
- RPO/RTO propuesto: RPO ≤24 h, RTO ≤8 h, **sujeto a plan y ensayo** (D15).
- Ensayar `restore` en proyecto aislado antes del go-live y periódicamente.

## Puesta online (primera vez)

Pasos que requieren cuentas del usuario (ver README para el detalle local):

1. **GitHub**: crear repo y `git push` de `main`.
2. **Supabase cloud**: crear proyecto staging y producción; aplicar el historial
   de `supabase/migrations` con `supabase db push` (sin editar por SQL Editor).
3. **Vercel**: importar el repo, setear variables por entorno, Production→`main`
   y Preview→ramas con claves de staging.

## Decisiones de negocio pendientes

Implementadas con el default recomendado y marcadas `TODO(Dxx)` donde aplica.
Confirmar con Arpeco antes de liberar el flujo afectado: D01 (evidencia de
aceptación), D02 (acceso de A a costos), D03 (doble aprobación alto privilegio),
D04 (regla de vendedor), D08 (identidad del PDF), D10 (facturas), D13
(conversión), D14 (moneda). Detalle en `docs/09_DECISIONES_PENDIENTES.md`.
