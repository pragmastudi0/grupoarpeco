# IA.md — Contexto integral del sistema

> **Revisión:** 2026-10-31 · **Branch:** `main` · **Commit:** `2c0dab2`
> Documento reconstruido desde el código real del repositorio. Donde un punto no
> pudo verificarse en el repo se marca explícitamente **NO VERIFICADO**.
> Fuente primaria de verdad: el código y las migraciones SQL. Los documentos de
> diseño en `docs/` describen la intención; cuando difieren del código, manda el código.

---

## 1. Identidad y propósito del producto

**Grupo Arpeco — Gestión Comercial y Proyectos.** Aplicación web privada y
autenticada para gestionar el ciclo comercial de una empresa de cartelería/stands:
clientes → oportunidades (CRM) y ferias → presupuestos (con PDF) → venta aceptada →
cobros y facturas → proyecto y costos → reportes de negocio.

- **Problema que resuelve:** centralizar la operación comercial con trazabilidad,
  permisos por rol y cálculos consistentes (totales, saldos, márgenes) calculados
  en la base como fuente única de verdad.
- **Usuarios:** empleados de Arpeco con roles combinables: Dirección (D),
  Administración (A), Vendedor (V), Ejecución (E), Soporte (S). 10–30 usuarios previstos.
- **Alcance observable (HOY):** las 7 etapas del roadmap están implementadas a nivel
  de base de datos + UI y verificadas localmente (**127 pruebas pgTAP, 23 E2E, build**).
  Incluye además: RBAC dinámico (roles + permisos + alcance + excepciones),
  separación **Aceptar presupuesto** vs **Confirmar venta**, y **plantillas de
  presupuestos + duplicar presupuesto**. **No** incluye facturación
  electrónica/fiscal, stock, multiempresa, multimoneda (currency fijada a `ARS` por
  check), ni integración con un sitio web externo.
- **Origen:** nació el 2026-10-30 a partir de la propuesta/prototipo en
  `/Users/gaspar/Downloads/grupo-arpeco/` (docs de diseño copiados a `docs/`).

---

## 2. Resumen ejecutivo para agentes IA

- **SPA React + Vite + TypeScript** servida estática, que habla directo con
  **Supabase** (PostgREST + Auth) usando la **anon key** sujeta a **RLS**. Una
  función de servidor (`api/invite.ts`, pensada para Vercel) usa la `service_role`
  sólo del lado servidor para invitar usuarios.
- **La autorización vive en la base**, no en el cliente: RLS por tabla, `REVOKE/GRANT`
  explícito (incluso por **columna**), y mutaciones sensibles **sólo vía RPC**
  `SECURITY DEFINER`. El menú y las guardas de ruta del front son sólo conveniencia.
- **Módulos:** auth/admin, clientes, CRM (oportunidades + seguimientos), ferias,
  presupuestos (+PDF), ventas/cobros/facturas, proyectos/costos, reportes, auditoría.
- **Dependencias críticas:** Supabase (Postgres 17 + Auth + PostgREST), Node ≥22.12,
  pnpm. Despliegue previsto: GitHub + Supabase cloud + Vercel (**aún no desplegado**).
- **Precauciones clave:**
  - Nunca poner la `service_role` en variables `VITE_*` (son públicas). Lo valida
    `scripts/check-env.mjs` en CI.
  - No crear ventas/proyectos/cobros/facturas/costos/roles por `INSERT` directo:
    van por RPC. Las tablas correspondientes **no tienen GRANT de escritura**.
  - Dinero: `numeric(18,2)` en DB y `decimal.js` en TS; nunca `number` para sumas.
  - Las migraciones son la única vía de cambio de esquema (versionadas, idempotentes
    en orden). El `seed.sql` es **sólo local**.

---

## 3. Stack tecnológico

Verificado en `package.json`, `vite.config.ts`, `tsconfig.app.json`, `supabase/config.toml`.

| Capa          | Tecnología                                                                                                                                                          | Versión (del lockfile/manifest)                     |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| UI            | React + React DOM                                                                                                                                                   | 19.3                                                |
| Build/dev     | Vite                                                                                                                                                                | 8.3                                                 |
| Lenguaje      | TypeScript                                                                                                                                                          | ~7.0 (compilador nuevo; sin `baseUrl`, usa `paths`) |
| Estilos       | Tailwind CSS v4 (`@tailwindcss/vite`) + `tw-animate-css`                                                                                                            | 4.3                                                 |
| Componentes   | shadcn-style escritos a mano sobre Radix UI (`dialog`, `select`, `label`, `slot`, `dropdown-menu`, `avatar`) + `class-variance-authority`, `clsx`, `tailwind-merge` | —                                                   |
| Ruteo         | React Router                                                                                                                                                        | 7.18                                                |
| Estado remoto | TanStack Query                                                                                                                                                      | 5                                                   |
| Formularios   | React Hook Form 7 + Zod 4 + `@hookform/resolvers`                                                                                                                   | —                                                   |
| Backend/datos | `@supabase/supabase-js`                                                                                                                                             | 2.118                                               |
| Dinero/fechas | `decimal.js` 10, `date-fns` 4, `Intl.NumberFormat('es-AR')`                                                                                                         | —                                                   |
| PDF           | `@react-pdf/renderer` (se genera en el **cliente**)                                                                                                                 | 4.9                                                 |
| Íconos        | `lucide-react`                                                                                                                                                      | —                                                   |
| Lint/format   | oxlint + Prettier                                                                                                                                                   | —                                                   |
| Tests         | Vitest 5 + Testing Library + jsdom; Playwright (E2E); pgTAP (DB)                                                                                                    | —                                                   |
| DB local      | Supabase CLI + Docker (Postgres 17)                                                                                                                                 | —                                                   |
| Node          | `engines.node >= 22.12`, `.nvmrc = 22`                                                                                                                              | —                                                   |

Config de Supabase local (`supabase/config.toml`): puertos propios **5452x**
(API 54521, DB 54522, Studio 54523, Mailpit 54524) para no chocar con otros
proyectos Supabase locales; **`[analytics] enabled = false`** (el contenedor
Logflare/vector hacía fallar el arranque). `extra_search_path = ["public","extensions"]`.

---

## 4. Arquitectura general

```
Navegador (SPA React/Vite)
  │  @supabase/supabase-js con ANON key (JWT del usuario)
  ▼
Supabase PostgREST  ──(RLS por fila + GRANT por objeto/columna)──► PostgreSQL 17
  │                                                                 ├─ RPC SECURITY DEFINER (mutaciones)
  │                                                                 ├─ triggers (totales, numeración, activación)
  └─ Supabase Auth (JWT, invitaciones)                              └─ audit_events (append-only)

Función de servidor (api/invite.ts, Vercel) ── service_role ──► Supabase (sólo invitaciones)
```

- **Frontend:** navegación, formularios breves, estados vacío/carga/error,
  proyección según permiso. **No** decide autorización ni calcula saldos/márgenes
  definitivos: sólo muestra lo que RLS/RPC devuelven.
- **Base de datos (fuente única de verdad):** restricciones, RLS/GRANT,
  transiciones de estado, aceptación atómica, auditoría, numeración comercial y
  agregados de reportes.
- **Función de servidor:** sólo invitaciones (`service_role`), validando que el
  solicitante sea Dirección activa.

**Recorrido típico de una lectura:** componente → hook de `queries.ts` (TanStack
Query) → `supabase.from('tabla').select(...)` con el JWT → PostgREST aplica RLS →
devuelve filas → render. **Recorrido de una mutación sensible:** componente →
`supabase.rpc('fn', args)` → función `SECURITY DEFINER` valida rol/estado →
escribe + `log_audit(...)` → invalida queries en `onSuccess`.

---

## 5. Estructura del repositorio

```
arpeco-sistema/
├─ api/
│  └─ invite.ts                 Función de servidor: invitación de usuarios (service_role)
├─ docs/                         Diseño (plan maestro, arquitectura, modelo de datos, roles,
│                                roadmap, backlog, testing, deploy, decisiones, go-live,
│                                matriz) + OPERACION_GO_LIVE.md + prototipo_mvp_arpeco.html
├─ public/fonts/                 Inter (woff2) local, sin recursos externos
├─ scripts/check-env.mjs         Guardia CI: ninguna VITE_* lleva clave privilegiada
├─ src/
│  ├─ app/                       Shell, router, providers, error boundary, navegación
│  ├─ shared/
│  │  ├─ auth/roles.ts           Catálogo de roles (RoleCode) y labels
│  │  ├─ lib/                    utils(cn), money(decimal.js), format(es-AR/Córdoba)
│  │  ├─ supabase/               client.ts (anon) + database.types.ts (generado)
│  │  └─ ui/                     Primitivas (button, input, card, dialog, select, badge, …)
│  ├─ modules/                   Un módulo por dominio (ver §6)
│  ├─ e2e/                       Playwright (auth, smoke, pdf, rbac, profitability,
│  │                              mobile-cards, responsive, confirm-sale, templates)
│  ├─ test/setup.ts              Setup de Vitest
│  ├─ main.tsx / index.css
├─ supabase/
│  ├─ migrations/                15 migraciones SQL versionadas (esquema, RLS, RPC)
│  ├─ tests/                     13 archivos pgTAP (127 pruebas)
│  ├─ seed.sql                   Datos ficticios SÓLO locales
│  └─ config.toml                Puertos 5452x, analytics off
├─ components.json               Config shadcn (aliases @/shared/ui, etc.)
├─ vercel.json                   build Vite + rewrite SPA que excluye /api/
├─ .github/workflows/ci.yml      CI: app + base + secret-scan
└─ README.md                     Setup local + despliegue online
```

Alias de importación: `@/` → `src/` (definido en `vite.config.ts` y `tsconfig.app.json`).

---

## 6. Módulos funcionales

Cada módulo vive en `src/modules/<nombre>/` con `queries.ts` (hooks TanStack Query

- llamadas a Supabase/RPC) y páginas/diálogos. La autorización efectiva está en la
  DB; la UI filtra por rol con `useAuth().hasRole(...)` sólo para conveniencia.

### 6.1 Auth / Identidad — `src/modules/auth/`, `src/modules/admin/`

- **Propósito:** login por invitación (sin autorregistro), sesión, roles,
  activación/baja de usuarios, auditoría.
- **Roles:** D, A, V, E, S (combinables). `src/shared/auth/roles.ts`.
- **Componentes clave:** `AuthProvider.tsx` (sesión + perfil + roles),
  `useAuth.ts`, `ProtectedRoute.tsx` (sin sesión→login; inactivo→`InactiveAccount`),
  `RoleGate.tsx` (oculta rutas por rol), `pages/LoginPage.tsx` (RHF+Zod).
- **Admin:** `UsuariosPage.tsx` (lista perfiles+roles, activar/desactivar vía RPC
  `set_user_active`), `AuditoriaPage.tsx` (lee `audit_events`, sólo Dirección).
- **Reglas:** el propio usuario sólo edita `display_name`; `active`/roles cambian
  **sólo** por RPC (trigger `guard_profile_update` lo impone). Autopromoción
  rechazada; alto privilegio (direction/support) exige segundo aprobador (D03).
- **Estado:** implementado y verificado (pgTAP 00/01/02).

### 6.2 Clientes — `src/modules/clients/`

- **Propósito:** cartera de clientes con deduplicación.
- **Pantallas:** `ClientesPage` (lista+búsqueda), `NuevoClienteDialog` (alta con
  dedup en vivo), `ClienteDetailPage` (ficha + contacto principal + oportunidades).
- **Reglas:** `name_key` y `tax_id_key` normalizados por trigger; únicos entre
  activos. Dedup global por RPC `search_clients_min` (devuelve datos mínimos).
  V ve su cartera; D/A global. V no puede cambiar `owner_id` (WITH CHECK).
- **Estado:** implementado (pgTAP 03/08). Merge y reasignación de vendedor tienen
  UI en el panel D/A de la ficha (`ClienteDetailPage`); saldo consolidado del
  cliente en la ficha (`useClientFinancials`).

### 6.3 CRM / Oportunidades — `src/modules/crm/`

- **Pantallas:** `OportunidadesPage` (pipeline por etapa), `NuevaOportunidadDialog`,
  `OportunidadDetailPage` (cambio de etapa + seguimientos).
- **Etapas:** `new|sent|negotiation|won|lost` (`stages.ts`). Cambiar a won/lost fija `closed_at`.
- **Reglas:** exactamente una referencia comercial (cliente **o** prospecto, check
  `opp_one_ref`). Seguimientos append-only. Se puede presupuestar sin oportunidad.
- **Estado:** implementado (migración + UI).

### 6.4 Ferias — `src/modules/fairs/`

- **Pantallas:** `FeriasPage` (lista; alta sólo Dirección), `FeriaDetailPage`
  (prospectos; alta de prospecto por cualquier vendedor activo).
- **Reglas:** `fairs` escritura sólo Dirección; prospecto único por `(fair_id, name_key)`
  entre activos; `origin_fair_id` se hereda, no se recalcula del nombre.
- **Estado:** implementado.

### 6.5 Presupuestos + PDF — `src/modules/quotes/`

- **Pantallas:** `PresupuestosPage` (lista + alta, con selector opcional **"Usar
  plantilla"**), `PresupuestoDetailPage` (editor de ítems en borrador, ciclo de
  vida, PDF, panel interno de Dirección, botones **Duplicar** y **Guardar como
  plantilla**), `PlantillasPage` (biblioteca de plantillas + editor de conceptos),
  `QuotePdf.tsx` (documento A4 con `@react-pdf/renderer`, sólo campos públicos).
- **Numeración:** `P-AAAA-NNNN` vía `next_document_no('quote')` (trigger `set_quote_no`).
- **Totales:** `subtotal = round(qty*precio,2)` y `total = Σ subtotales`, por triggers DB.
- **Estados:** `draft→sent→accepted|rejected|void`. RPC `send_quote` (congela
  `quote_revisions` con hash sha256), `revise_quote` (vuelve a borrador +rev),
  `reject_quote`. **Aceptar** (`accept_quote`) sólo marca `accepted` + `accepted_by`
  (NO crea venta); la venta/proyecto se genera aparte con **Confirmar venta**
  (`confirm_sale`, ver §6.6).
- **Protección por columna:** `estimated_cost` e `internal_notes` **no** tienen
  GRANT para `authenticated`; sólo Dirección los lee/escribe vía `quote_margin`
  y `set_quote_internal`. Margen = `(total - estimated_cost)/total`.
- **Plantillas y duplicado** (migración `…20261031140000_quote_templates.sql`):
  tablas `quote_templates`/`quote_template_items` (compartidas por equipo). RPC
  `create_template`/`update_template`/`delete_template` y `save_quote_as_template`
  (gatean `presupuestos.manage_templates`); `create_quote_from_template` y
  `duplicate_quote` (gatean `presupuestos.create` + alcance). El costo/notas
  internas sólo se copian al duplicar si el usuario tiene `presupuestos.view_margin`.
  Los totales los recalcula el trigger de `quote_items`. **Usar** plantillas =
  `presupuestos.create` (Comercial ya lo tiene); **gestionarlas** =
  `presupuestos.manage_templates` (seed: Dirección y Administración).
- **Estado:** implementado (pgTAP 04 y 12). El PDF se genera client-side (los docs de
  diseño proponían función de servidor; ver §14).

### 6.6 Ventas / Cobros / Facturas — `src/modules/sales/`

- **Pantallas:** `VentasPage` (lista + saldo), `VentaDetailPage` (KPIs de saldo,
  cobros y facturas, diálogos de registro, enlace al proyecto).
- **Aceptar vs Confirmar venta** (migración `…20261031130000_confirm_sale.sql`):
  dos pasos separados.
  - `accept_quote(id, expected_revision, evidence)` **sólo** marca el presupuesto
    `accepted` (fecha + `accepted_by` + `acceptance_evidence`); idempotente; gatea
    `presupuestos.accept` + alcance. **No** crea venta ni proyecto.
  - `confirm_sale(id, expected_revision)` (crown jewel) parte de un presupuesto
    **aceptado**, bloquea `FOR UPDATE`, valida permiso `ventas.confirm` + alcance, y
    crea **una** venta (`sales.quote_id` unique, con `confirmed_by`/`confirmed_at`) y
    **un** proyecto (`projects.sale_id` unique), numeración `V-`/`PRY-`, y audita —
    transaccional. Reintento sobre la misma revisión devuelve los IDs existentes
    (idempotente); revisión distinta falla.
  - Permiso nuevo `ventas.confirm` (seed: Dirección, Administración, Comercial).
- **Cobros/facturas:** RPC `register_payment`/`register_invoice` con
  `idempotency_key` única y **bloqueo de sobrecobro/sobrefacturación**; anulación
  con motivo (`void_payment`/`void_invoice`), nunca DELETE.
- **Saldos:** vista `sale_balances` (`security_invoker`): paid, invoiced,
  pending_collection, pending_invoicing.
- **Columnas sensibles:** `payments.method`/`reference` sin GRANT a `authenticated`;
  A/D las leen vía RPC `payment_details`. V ve importes de su cartera, no medios.
- **Estado:** implementado y verificado (pgTAP 05).

### 6.7 Proyectos / Costos — `src/modules/projects/`

- **Pantallas:** `ProyectosPage` (lista), `ProyectoDetailPage` (estado, costos,
  cierre de costos, panel de margen para Dirección).
- **Reglas:** costos por RPC `register_cost` (D o responsable del proyecto),
  idempotentes; `void_cost` con motivo. `complete_costs` (sólo Dirección) marca
  `costs_complete_at`; un costo posterior **reabre** automáticamente (trigger
  `reopen_costs_on_change`). Estados proyecto `pending|in_progress|finished`.
  `assign_project_manager` (D/A). Margen estimado/provisional/definitivo via
  `project_margin` (sólo Dirección); definitivo sólo si costos completos.
- **Estado:** implementado y verificado (pgTAP 06).

### 6.8 Dashboard / Reportes — `src/modules/dashboard/`, `src/modules/reports/`

- **HomePage:** KPIs reales por rol (Dirección/Admin → `report_business`; Vendedor
  → su fila de `report_sellers`).
- **ReportesPage:** filtros por período; secciones Negocio, Rentabilidad (sólo D),
  Equipo/individual, Ferias (D/A).
- **Reglas:** fechas definidas (issued_on/accepted_on/received_on); CTEs
  preagregadas para no multiplicar filas; conversión v3 = ventas/presupuestos del
  mismo período. Sólo registros no anulados.
- **Estado:** implementado y verificado (pgTAP 07).

---

## 7. Flujos operativos y lógica de negocio

**Flujo principal (cliente → proyecto), con archivos:**

1. Alta de cliente — `clients/NuevoClienteDialog.tsx` → `clients/queries.ts:useCreateClient`
   → `insert clients` (trigger `set_client_keys` normaliza). Dedup: `search_clients_min`.
2. (Opcional) Oportunidad — `crm/NuevaOportunidadDialog.tsx` → `insert opportunities`.
3. Presupuesto — `quotes/PresupuestosPage.tsx` crea borrador → `PresupuestoDetailPage.tsx`
   agrega `quote_items` (trigger subtotal/total) → `send_quote` (congela revisión).
4. Aceptación — botón "Aceptar" en `PresupuestoDetailPage.tsx` → RPC `accept_quote`
   → marca el presupuesto `accepted` (no crea nada todavía). También desde esta
   pantalla: **Duplicar** (`duplicate_quote`) y **Guardar como plantilla**.
4b. Confirmar venta — con el presupuesto aceptado, botón "Confirmar venta" →
   RPC `confirm_sale` → crea venta + proyecto → navega a `/ventas/:id`.
5. Cobros/facturas — `sales/VentaDetailPage.tsx` → `register_payment`/`register_invoice`
   (idempotentes, anti-sobrecobro) → `sale_balances` recalcula saldo.
6. Costos del proyecto — `projects/ProyectoDetailPage.tsx` → `register_cost` →
   `complete_costs` (Dirección) → `project_margin`.
7. Reportes — `reports/*` leen funciones SQL que concilian con los hechos anteriores.

**Transiciones de estado:**

- Presupuesto: `draft`→(`send_quote`)→`sent`→(`accept_quote`)→`accepted` |
  (`reject_quote`)→`rejected` | (`revise_quote`)→vuelve a `draft` (revisión+1).
  Desde `accepted`, (`confirm_sale`) genera la venta y el proyecto (el estado del
  presupuesto no cambia; la venta nace `active`).
- Oportunidad: libre entre etapas; won/lost setea `closed_at`.
- Proyecto: `pending|in_progress|finished` (editable por E asignado y D/A).
- Completitud de costos: `complete_costs` ↔ reabre automáticamente al cambiar un costo.

**Fórmulas (todas en SQL):** subtotal `round(qty*unit_price,2)`; total `Σ subtotales`;
saldo cobro `amount - Σpagos posted`; margen presupuesto `(total-estimated_cost)/total`;
margen proyecto `(sale.amount - Σcostos posted)/sale.amount`; conversión
`ventas aceptadas / presupuestos emitidos` del mismo período (puede superar 100%).

---

## 8. Base de datos

Postgres 17 (Supabase). **27 tablas**, **1 vista**, **67 funciones**, **47 políticas RLS**.
Migraciones en `supabase/migrations/` (orden por timestamp):

| Migración                   | Contenido                                                                                                                                                                                                                                                                              |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `…120000_core_identity`     | `profiles, roles, user_roles, support_access, app_settings, audit_events`; helpers `is_active/has_role/is_direction/has_support_access/log_audit`; triggers de alta/activación (`handle_new_user`, `handle_user_confirmed`), guardia de columnas (`guard_profile_update`); RLS + GRANT |
| `…120100_admin_rpc`         | `grant_role, revoke_role, set_user_active`                                                                                                                                                                                                                                             |
| `…130000_clients_crm_fairs` | `clients, client_contacts, fairs, fair_staff, fair_prospects, opportunities, followups`; normalización (`f_unaccent, normalize_name, normalize_tax_id`), `touch_updated_at`; `search_clients_min, merge_clients, reassign_owner`; `is_admin_or_direction`                              |
| `…140000_quotes`            | `document_sequences, quotes, quote_items, quote_revisions`; `next_document_no`, triggers de total/subtotal/numeración; `quote_margin, set_quote_internal, send_quote, revise_quote, reject_quote`                                                                                      |
| `…150000_sales_payments`    | `sales, projects, payments, invoices`; vista `sale_balances`; helpers `owns_sale, manages_sale`; `accept_quote, register_payment, void_payment, register_invoice, void_invoice, payment_details, assign_project_manager`                                                               |
| `…160000_project_costs`     | `project_costs`; `reopen_costs_on_change`, `manages_project`; `register_cost, void_cost, complete_costs, project_margin`                                                                                                                                                               |
| `…170000_reports`           | `report_business, report_profitability, report_sellers, report_fairs`                                                                                                                                                                                                                  |
| `…180000_pendientes`        | `merge_clients` repunta también `quotes`/`sales` (fijado por pgTAP 08)                                                                                                                                                                                                                  |
| `…190000_report_profitability_fix` | Ajuste de `report_profitability` (margen sólo sobre trabajos con costos completos)                                                                                                                                                                                              |
| `…31120000_rbac_model`      | `permissions, role_permissions, user_permissions`; `roles.is_system/protected`; `has_permission(code)` (deny gana, default-deny); relabel Vendedor→Comercial, Ejecución→Proyectos                                                                                                       |
| `…31120100_rbac_policies`   | Políticas RLS comerciales reescritas para leer `has_permission` (alcance `mod.view`/`mod.view_all`, escritura `update`/`update_all`)                                                                                                                                                    |
| `…31120200_rbac_rpc`        | `my_permissions`; RPC admin de roles/permisos                                                                                                                                                                                                                                          |
| `…31120300_rbac_admin`      | `create/update/delete_role, set_role_permissions, set_user_permission`; anti-escalación; protección del último superadmin                                                                                                                                                               |
| `…31130000_confirm_sale`    | Separa **aceptar** de **confirmar venta**: `quotes.accepted_by`, `sales.confirmed_by/at`; permiso `ventas.confirm`; `accept_quote`→void (sólo marca), nuevo `confirm_sale` (crea venta+proyecto); `report_business` agrega columna `accepted`                                            |
| `…31140000_quote_templates` | `quote_templates, quote_template_items`; permiso `presupuestos.manage_templates`; RPC `create/update/delete_template, save_quote_as_template, create_quote_from_template, duplicate_quote`                                                                                                |

**Entidades y claves principales** (detalle completo y motivación en
`docs/03_MODELO_DATOS.md`; el esquema vigente es el de las migraciones):

- `profiles(id→auth.users)`: `active`, `display_name`, `email`, `activated_at`.
- `roles(code PK)` seed: direction, administration, seller, execution, support.
- `user_roles(user_id, role_code)` PK compuesta.
- `clients`: `owner_id`, `status(active|merged|archived)`, únicos parciales
  `tax_id_key`/`name_key` entre activos, `merged_into_id`.
- `fairs`, `fair_staff`, `fair_prospects(fair_id,name_key único activo)`.
- `opportunities`: `client_id|prospect_id` (exactamente uno), `stage`, `owner_id`.
- `followups`: append-only, `status(active|void)`.
- `quotes`: `commercial_no unique`, `revision`, `status`, `currency=ARS`, `total`,
  `accepted_by`/`accepted_at`/`acceptance_evidence`, `estimated_cost`/`internal_notes`
  (columnas protegidas), `quote_items` (único `(quote_id,position)`),
  `quote_revisions` (snapshot jsonb + sha256).
- `quote_templates`/`quote_template_items`: plantillas de conceptos reutilizables
  (compartidas por equipo; escritura sólo por RPC; único `(template_id,position)`).
- `sales`: `quote_id unique`, `amount`, `accepted_on`, `confirmed_by`/`confirmed_at`,
  `status(active|void)`.
- `projects`: `sale_id unique`, `status`, `costs_complete_at/by`, `costs_reopened_at`.
- `payments`/`invoices`: `idempotency_key unique`, `status(posted|void)`, anulación con motivo.
- `project_costs`: `idempotency_key unique`, `status(posted|void)`.
- `audit_events`: append-only (sin UPDATE/DELETE desde API).
- `document_sequences(kind,year,next_no)`: numeración con bloqueo.

**Integridad y efectos:** triggers recalculan `quotes.total`; `accept_quote`
garantiza una venta/proyecto por presupuesto; idempotencia por `idempotency_key`
y por `quote_id`/`sale_id` únicos. Se prohíben DELETE físicos de hechos económicos
(se anula con motivo). Índices iniciales creados en cada migración (ver `create index`).

**Pruebas pgTAP** en `supabase/tests/` (**127 subtests en 13 archivos**, todas
verdes): denegación anónima, usuario inactivo, aislamiento de cartera, protección de
`owner_id` y de columnas sensibles, idempotencia de aceptación/cobros,
anti-sobrecobro, cierre de costos reabrible, conciliación de reportes, RBAC (rol
custom efectivo, deny gana, anti-escalación — `10_rbac`), separar aceptar/confirmar
venta (`11_confirm`) y plantillas/duplicado (`12_templates`).

---

## 9. Autenticación, usuarios y permisos

- **Login:** Supabase Auth email+password, **sin autorregistro**. `LoginPage.tsx`
  usa `signInWithPassword`. `AuthProvider` resuelve sesión y luego carga
  `profiles` + `user_roles` en un efecto aparte (clave: **no** hacer `await` de
  consultas dentro de `onAuthStateChange` — causa deadlock del lock de Auth).
- **Activación:** al confirmar email por primera vez, el trigger `handle_user_confirmed`
  activa el perfil una sola vez. El alta la hace la función `api/invite.ts`
  (Dirección) creando invitación + perfil inactivo + rol, auditado.
- **Autorización:** RLS en todas las tablas. Patrón: `is_admin_or_direction()`
  para visibilidad global; `owner_id = auth.uid()` para cartera propia; `WITH
CHECK` protege `owner_id`. Columnas sensibles via column-GRANT + RPC. Mutaciones
  complejas sólo por RPC `SECURITY DEFINER` con `search_path=''` y referencias
  calificadas. `anon` revocado en todas. Matriz completa en `docs/04_ROLES_PERMISOS.md`.
- **Aislamiento:** un Vendedor sólo ve/edita su cartera (clientes, oportunidades,
  presupuestos, ventas propias); no ve costos/márgenes ni medios de cobro ajenos.
  Verificado en pgTAP 03/04/05/06.
- **Doble control (D03):** grant de rol `direction|support` exige `p_second_approver`
  activo y distinto del solicitante.

### 9.1 RBAC dinámico (roles + permisos + alcance + excepciones)

Capa de permisos **sobre** los roles existentes (migraciones `…20261031120000..120300`):

- **Tablas:** `permissions` (catálogo; `reserved` = técnicas), `role_permissions`,
  `user_permissions` (excepción individual `grant`/`deny`). `roles` + `is_system`/
  `protected`; `superadmin` protegido. Relabel Vendedor→Comercial, Ejecución→Proyectos
  (los `code` internos NO cambian).
- **Resolución (`has_permission(code)`):** `is_active()` AND (deny individual → false;
  sino grant individual OR permiso por rol). **Deny gana**; default-deny.
- **Las políticas RLS comerciales y las RPC sensibles/escritura leen
  `has_permission`** (no roles fijos) → un rol personalizado opera de verdad y las
  denegaciones individuales cortan también en la base. Alcance por permiso:
  `mod.view` (propios) + `mod.view_all` (todos); escritura con `update`/`update_all`.
- **RPC admin:** `create/update/delete_role`, `set_role_permissions`,
  `set_user_permission`. **Anti-escalación:** no se delega un permiso que no se
  posee (salvo superadmin); `reserved` sólo por rol y por superadmin; sólo superadmin
  asigna `superadmin`; no se borra/desactiva el **último superadmin**; nadie edita
  sus propios roles/permisos. Todo auditado.
- **Front:** `AuthProvider.can(code)` (desde `my_permissions()`); nav/rutas/botones
  gatean por permiso (`Sidebar`, `PermGate`). Pantalla "Usuarios y accesos" con 3
  pestañas: Usuarios, Roles y permisos (matriz módulos×acciones), Permisos
  individuales (heredado/concedido/denegado + grant/deny/limpiar).
- **Compatibilidad:** el seed de `role_permissions` reproduce los accesos previos
  (los 107 pgTAP, incluidos 00–09, siguen verdes). Verificado en `10_rbac` (rol
  custom efectivo, deny gana vía API directa, anti-escalación, superadmin).
- **Limitación declarada:** las tablas de identidad (`profiles`, `user_roles`,
  `support_access`, `app_settings`) conservan gate por rol/`usuarios.view`; "último
  acceso" queda fuera de alcance.

---

## 10. APIs, servicios e integraciones

- **Datos:** no hay API REST propia; el cliente usa PostgREST de Supabase vía
  `@supabase/supabase-js` (`src/shared/supabase/client.ts`) con RLS. Las operaciones
  de escritura sensibles son **RPC** (`supabase.rpc('fn', args)`).
- **Función de servidor:** `api/invite.ts` (handler Web `Request→Response`, pensado
  para runtime Node de Vercel). Valida el JWT del solicitante, comprueba
  `is_direction()`, y con `service_role` crea la invitación Auth + perfil + rol +
  auditoría. Variables: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `APP_ORIGIN`.
  **NO VERIFICADO en runtime** (no se ejecutó en Vercel; sí typecheck/estructura).
- **PDF:** generación **client-side** con `@react-pdf/renderer` en
  `quotes/QuotePdf.tsx` (descarga como blob). Sólo incluye campos públicos.
- **Integraciones externas:** ninguna (sin webhooks, colas, cron ni proveedores
  de pago/email más allá de Supabase Auth). Storage de Supabase **no** se usa aún
  (`invoices.document_path`/`quotes` lo contemplan pero no hay subida implementada).
- **Manejo de errores:** las queries propagan `error` de Supabase; la UI muestra
  `ErrorRetry`/mensajes; `ErrorBoundary` global evita pantalla en blanco.

---

## 11. Interfaz y experiencia del usuario

- **Shell:** `AppLayout` (sidebar oscuro + topbar), navegación en `app/navigation.ts`.
  Sidebar replica el prototipo (azul `#3352d6`, sidebar `#0e1726`, Inter local).
- **Rutas** (`app/AppRoutes.tsx`): `/login` público; resto bajo `ProtectedRoute`
  dentro de `AppLayout`: `/` (inicio), `/clientes` `/clientes/:id`,
  `/oportunidades` `/oportunidades/:id`, `/ferias` `/ferias/:id`,
  `/presupuestos` `/presupuestos/:id`, `/plantillas` (bajo `PermGate` de
  `presupuestos.create`), `/ventas` `/ventas/:id`, `/proyectos` `/proyectos/:id`,
  `/reportes`, y bajo `PermGate` por permiso: `/usuarios` (`usuarios.view`),
  `/auditoria` (`auditoria.view`), `/configuracion` (`config.view`). `*` →
  `NotFoundPage`.
- **Estados estándar** (regla del plan maestro): `shared/ui/states.tsx`
  (`LoadingState`, `EmptyState`, `ErrorRetry`, `Spinner`). Formularios con RHF+Zod
  o estado local controlado; diálogos Radix.
- **i18n/formato:** español (Argentina); montos con `formatARS`, fechas con
  `formatDate/formatDateTime` en zona `America/Argentina/Cordoba`.
- `app/ComingSoonPage.tsx` existe pero ya **no está ruteado** (todos los módulos
  están activos); queda como utilidad sin uso.

---

## 12. Configuración, ejecución y despliegue

**Variables de entorno (por nombre, sin valores):**

- Cliente (públicas, prefijo `VITE_`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- Servidor (`api/`, sin prefijo): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `APP_ORIGIN`.
- CI opcional (guardia): `SUPABASE_PREVIEW_REF`, `SUPABASE_PROD_REF`.

**Scripts (`package.json`) — verificados en este repo:** `dev`, `build`
(`tsc -b && vite build`), `preview`, `lint` (oxlint), `format`/`format:check`
(prettier), `typecheck` (`tsc -b --noEmit`), `test` (vitest), `test:e2e`
(playwright), `db:start|stop|reset|test|types`, `check:env`.

**Comandos VERIFICADOS en esta máquina (corrieron en verde):**
`pnpm install`, `pnpm typecheck`, `pnpm lint`, `pnpm test` (4), `pnpm build`,
`supabase start/db reset/db test` (**127 pgTAP**), `pnpm test:e2e` (**23**), `pnpm format`.

**Comandos IDENTIFICADOS pero NO EJECUTADOS** (requieren cuentas/nube):
`supabase link`, `supabase db push`, `git push`, deploy en Vercel. Pasos
detallados en `README.md` §"Despliegue online" y `docs/OPERACION_GO_LIVE.md`.

**CI** (`.github/workflows/ci.yml`): job `app` (check:env, lint, typecheck,
format:check, test, build), job `database` (supabase start + db test), job
`secret-scan` (gitleaks). Vercel: `vercel.json` fija build Vite + rewrite SPA que
excluye `/api/`. **NO VERIFICADO** que CI haya corrido (no hay remoto configurado aún).

---

## 13. Reglas de negocio críticas (preservar al modificar)

1. **Autorización en la base, no en el cliente.** No mover reglas de RLS/RPC al
   front. Toda tabla nueva debe entrar con RLS + GRANT explícito + su fila en la
   matriz de permisos. (`supabase/migrations/*`, `docs/04_ROLES_PERMISOS.md`)
2. **Mutaciones económicas sólo por RPC.** `sales/projects/payments/invoices/
project_costs/user_roles` no tienen GRANT de INSERT/UPDATE/DELETE directo. Usar
   las RPC existentes. (migraciones 140000–170000)
3. **Una venta y un proyecto por presupuesto, transaccional e idempotente.** Aceptar
   (`accept_quote`) sólo marca el presupuesto; la venta/proyecto nace **sólo** al
   confirmar (`confirm_sale`). No crear ventas/proyectos por otra vía. (`confirm_sale`)
4. **Idempotencia y anti-sobrecobro** en cobros/facturas/costos (`idempotency_key`
   única + chequeo de excedente). (`register_payment/invoice/cost`)
5. **Totales y subtotales los calcula la base** (triggers), no el cliente.
6. **Costo/margen e internos sólo Dirección** (protección por columna + RPC
   `quote_margin`/`project_margin`/`set_quote_internal`). No exponer esas columnas
   a `authenticated`.
7. **Dinero con `decimal.js`/`numeric(18,2)`**, nunca `number` para sumas. (`shared/lib/money.ts`)
8. **Auditoría append-only**: no permitir UPDATE/DELETE de `audit_events` desde API.
9. **`currency` fijada a ARS** por check; multimoneda requiere rediseño (D14).
10. **Usuario inactivo falla todo** y **autopromoción rechazada**; cambios de rol
    auditados, alto privilegio con doble aprobación.
11. **No correr `seed.sql` en producción** (usuarios ficticios). Sólo `db push` de migraciones.

---

## 14. Decisiones de arquitectura y diseño

**Verificadas (en código/docs):**

- **SPA React+Vite (no SSR):** la app es administrativa/privada; `docs/02_ARQUITECTURA_TECNICA.md`.
- **Supabase + RLS como núcleo de seguridad**; mutaciones por RPC `SECURITY DEFINER`.
- **Protección por columna** (GRANT por columna) para costo/margen y medios de cobro.
- **Helpers `owns_sale`/`manages_sale`/`manages_project`** `SECURITY DEFINER` para
  romper **recursión entre políticas** `sales`↔`projects` (una referenciaba a la otra).
- **Shadcn-style a mano** en vez de correr el CLI (control total, sin interactividad).
- **Puertos Supabase 5452x + analytics off** por conflictos/estabilidad local.

**Desviaciones respecto del diseño (señaladas):**

- El **PDF se genera en el cliente** con `@react-pdf/renderer`; `docs/02` proponía
  una función de servidor. Es funcionalmente equivalente para campos públicos y
  evita infra extra; migrarlo a servidor es endurecimiento futuro.
- `AuthProvider.loadProfile` **reintenta 3×** ante el error transitorio local
  "JWT issued at future" (skew de reloj del contenedor Docker). En producción con
  NTP no ocurre; el reintento es inocuo. (`src/modules/auth/AuthProvider.tsx`)

**Interpretaciones (no confirmadas como decisión histórica):** la elección de
pnpm, oxlint y TS 7 proviene del scaffold `create-vite` vigente; no hay ADR propio.

---

## 15. Funcionalidades existentes y estado

| Funcionalidad                                        | Estado                                                    | Evidencia                                                        |
| ---------------------------------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------- |
| Login por invitación, sesión, bloqueo de inactivos   | Completo                                                  | auth/*, pgTAP 00/01                                              |
| Gestión de usuarios y roles (activar, grant/revoke)  | Completo                                                  | admin/UsuariosPage, RPC, pgTAP 02                                |
| Auditoría (lectura Dirección)                        | Completo                                                  | admin/AuditoriaPage                                              |
| Clientes: lista/alta/dedup/ficha                     | Completo                                                  | clients/*, pgTAP 03                                              |
| Merge de clientes / reasignación de owner            | Completo (RPC + UI panel D/A)                             | ClienteDetailPage, pgTAP 08                                      |
| CRM: pipeline, alta, seguimientos                    | Completo                                                  | crm/*                                                            |
| Ferias: lista/alta/prospectos                        | Completo                                                  | fairs/*                                                          |
| Presupuestos: editor, estados, revisiones, PDF       | Completo                                                  | quotes/*, pgTAP 04                                               |
| Plantillas de presupuestos (biblioteca + editor)     | Completo (backend+front)                                  | PlantillasPage, templates.ts, pgTAP 12                           |
| Duplicar presupuesto + crear desde plantilla         | Completo                                                  | PresupuestoDetailPage, PresupuestosPage, pgTAP 12               |
| Costo/margen interno (Dirección)                     | Completo                                                  | quote_margin/set_quote_internal                                  |
| Aceptar presupuesto vs Confirmar venta (separado)    | Completo (backend+front)                                  | accept_quote/confirm_sale, pgTAP 11, confirm-sale.spec          |
| Ventas, cobros, facturas (idempotentes)              | Completo                                                  | sales/*, pgTAP 05                                                |
| Proyectos, costos, cierre, margen                    | Completo                                                  | projects/*, pgTAP 06                                             |
| Dashboard + Reportes (negocio/rentab./equipo/ferias) | Completo                                                  | dashboard/_, reports/_, pgTAP 07                                 |
| Invitar usuarios (UI + función)                      | UI lista (UsuariosPage); función NO verificada en runtime | api/invite.ts, UsuariosPage                                      |
| Recuperar contraseña / Configuración PDF             | Completo                                                  | RecuperarPage, ConfiguracionPage                                 |
| RBAC: roles dinámicos, matriz, permisos individuales | Completo (backend+front)                                  | rbac migrations, RolesPanel, PermisosIndividualesPanel, pgTAP 10 |
| Despliegue online (GitHub/Supabase/Vercel)           | **Pendiente** (no ejecutado)                              | README, OPERACION_GO_LIVE                                        |
| Storage/adjuntos (factura/documento)                 | **No implementado** (columnas existen)                    | invoices.document_path                                           |
| `ComingSoonPage`                                     | Heredado/sin uso (no ruteado)                             | app/ComingSoonPage.tsx                                           |

---

## 16. Problemas conocidos, riesgos y deuda técnica

**Hallazgos (verificables):**

- `merge_clients`/`reassign_owner` no tienen UI; sólo se invocan por RPC manual.
- `api/invite.ts` no probado en runtime de Vercel (firma Web; puede requerir
  `export const config = { runtime: 'nodejs' }` según el runtime).
- Bundle del cliente grande (>500 kB) por `@react-pdf/renderer`; sin code-splitting.
- Warnings de lint conocidos y no bloqueantes (oxlint, exit 0): `button.tsx`
  (only-export-components), `NuevoClienteDialog.tsx` (react-compiler
  incompatible-library por RHF), `AuthProvider.tsx` (set-state-in-effect).
- El reintento por "JWT issued at future" enmascara un problema de reloj **local**;
  no afecta prod pero conviene documentarlo (ya está en §14).
- **CORREGIDO:** `merge_clients` ahora repunta también `quotes` y `sales`
  (migración `…180000_pendientes.sql`, fijado por pgTAP 08).

**Riesgos:**

- Decisiones de negocio pendientes (D01–D16, `docs/09_DECISIONES_PENDIENTES.md`)
  implementadas con defaults `TODO(Dxx)`: confirmar antes de producción.
- Column-level GRANT no distingue A de V (ambos `authenticated`): el detalle
  sensible se protege con RPC gated, no con RLS por rol. Mantener ese patrón.

**Sospechas (no confirmadas):** rendimiento de reportes con volúmenes grandes no
medido con datos representativos (R06 del backlog no ejecutado con carga real).

---

## 17. Convenciones y patrones del proyecto

- **Módulos por dominio** en `src/modules/<x>/` con `queries.ts` + páginas/diálogos.
- **Hooks de datos** con TanStack Query; `queryKey` por recurso/filtro; `invalidateQueries`
  en `onSuccess`. Lecturas con `.select(columnas explícitas)` (nunca `*` en tablas
  con columnas sin GRANT: rompe con 42501).
- **Formularios:** RHF+Zod en los complejos (login, cliente); estado local en los simples.
- **UI:** primitivas shadcn-style en `src/shared/ui`; `cn()` para clases; tokens
  de color vía variables CSS en `src/index.css` mapeadas a Tailwind 4 `@theme`.
- **SQL:** funciones `SECURITY DEFINER` siempre con `set search_path = ''` y
  referencias calificadas (`public.`, `auth.`, `extensions.`); nombres de RPC en
  `snake_case`; auditoría con `log_audit`.
- **Dinero/fechas:** helpers centralizados (`money.ts`, `format.ts`); zona Córdoba.
- **Nombres de UI en español**; identificadores de código en inglés.
- **Tipos de DB generados**: `src/shared/supabase/database.types.ts` (no editar a
  mano; `pnpm db:types`).

---

## 18. Guía para futuras modificaciones por IA

1. **Ubicar el código:** por dominio en `src/modules/<x>/` (UI/hooks) y por
   migración en `supabase/migrations/` (datos/permisos). Ver §21.
2. **Antes de tocar datos:** leer la migración de la tabla y su RLS/GRANT. Un
   cambio de esquema es **siempre** una nueva migración con timestamp
   (`YYYYMMDDHHMMSS_nombre.sql`); nunca editar migraciones ya aplicadas ni el
   dashboard a mano. Luego `pnpm db:reset` (local) y `pnpm db:types`.
3. **Mutaciones sensibles:** agregar/extender una RPC `SECURITY DEFINER` (no GRANT
   directo). Validar rol + estado dentro y auditar con `log_audit`.
4. **Preservar reglas §13.** No exponer columnas sensibles; no romper idempotencia;
   no calcular totales/saldos en el cliente.
5. **Antes de dar por hecho un cambio:** `pnpm typecheck && pnpm lint && pnpm test
&& pnpm db:test && pnpm build`; y, si toca flujos, `pnpm test:e2e` (requiere
   `supabase start` + seed).
6. **Evitar regresiones de RLS:** si una política referencia otra tabla con RLS,
   usar un helper `SECURITY DEFINER` (patrón `owns_sale`) para no provocar recursión.
7. **Selects:** enumerar columnas; recordar que `estimated_cost`, `internal_notes`,
   `payments.method/reference` no son legibles por `authenticated`.

---

## 19. Guía para agregar nuevos módulos

1. **Datos primero:** nueva migración con tabla(s), FKs, checks, índices, **RLS +
   REVOKE/GRANT explícito** (y por columna si hay datos sensibles), y la fila en la
   matriz de `docs/04`. Mutaciones complejas → RPC `SECURITY DEFINER`.
2. **Tipos:** `pnpm db:types`.
3. **Permisos:** definir visibilidad por rol siguiendo los patrones existentes
   (`is_admin_or_direction`, `owner_id = auth.uid()` + `WITH CHECK`).
4. **UI:** carpeta `src/modules/<x>/` con `queries.ts` (hooks) + páginas; registrar
   rutas en `app/AppRoutes.tsx` y navegación en `app/navigation.ts` (con `roles` si aplica).
5. **Pruebas:** pgTAP para RLS/lógica (`supabase/tests/NN_*.test.sql`); unit (Vitest)
   para utilidades; E2E si es un flujo central.
6. **Docs:** actualizar este IA.md (§6, §8, §15, §21) y, si corresponde, `docs/`.

---

## 20. Estado actual y próximos pasos (observable, sin inventar roadmap)

- **Construido y verificado localmente:** etapas 1–7 completas + cierre de
  pendientes de UI + RBAC dinámico + separación aceptar/confirmar venta + plantillas
  y duplicado de presupuestos; **127 pgTAP + 23 E2E + build** verdes.
- **Pendiente explícito (registrado en repo):**
  - Desplegar online (GitHub + Supabase cloud + Vercel) — pasos en README/OPERACION_GO_LIVE.
  - Confirmar decisiones D01–D16 con el cliente (`docs/09_DECISIONES_PENDIENTES.md`).
  - Verificar `api/invite` en runtime de Vercel (la UI de invitación ya existe).
  - Mejoras no comprometidas (del roadmap): stock, contactos múltiples con UI,
    adjuntos en Storage, automatizaciones — **no implementadas**.

---

## 21. Mapa de referencias

| Concepto                     | Implementación (ruta)                                                             |
| ---------------------------- | --------------------------------------------------------------------------------- |
| Cliente Supabase             | `src/shared/supabase/client.ts`                                                   |
| Tipos de DB                  | `src/shared/supabase/database.types.ts` (generado)                                |
| Roles                        | `src/shared/auth/roles.ts`                                                        |
| Sesión/perfil/roles/permisos | `src/modules/auth/AuthProvider.tsx`, `auth-context.ts`, `useAuth.ts`              |
| Guardas de ruta              | `src/modules/auth/components/{ProtectedRoute,PermGate,InactiveAccount}.tsx`       |
| RBAC (modelo/políticas/RPC)  | `supabase/migrations/20261031120000..120300_rbac_*.sql`                           |
| RBAC UI y queries            | `src/modules/admin/{rbac.ts,RolesPanel,PermisosIndividualesPanel,UsuariosPage}`   |
| Rutas y navegación           | `src/app/AppRoutes.tsx`, `src/app/navigation.ts`                                  |
| Dinero / fechas              | `src/shared/lib/money.ts`, `src/shared/lib/format.ts`                             |
| Identidad/roles (DB)         | `supabase/migrations/20261030120000_core_identity.sql`                            |
| RPC roles/activación         | `…120100_admin_rpc.sql` (`grant_role`, `revoke_role`, `set_user_active`)          |
| Clientes/CRM/ferias (DB)     | `…130000_clients_crm_fairs.sql`                                                   |
| Presupuestos (DB)            | `…30140000_quotes.sql`                                                            |
| Plantillas + duplicado (DB)  | `…31140000_quote_templates.sql` (`create/update/delete_template`, `save_quote_as_template`, `create_quote_from_template`, `duplicate_quote`) |
| Plantillas/duplicado (UI)    | `src/modules/quotes/{PlantillasPage.tsx,templates.ts}`, `queries.ts:useDuplicateQuote` |
| Aceptar vs confirmar (DB)    | `…31130000_confirm_sale.sql` (`accept_quote` sólo marca, `confirm_sale` crea venta/proyecto) |
| Ventas/cobros/facturas (DB)  | `…30150000_sales_payments.sql` (`register_*`, `sale_balances`; `accept_quote` original movido a `confirm_sale`) |
| Costos (DB)                  | `…160000_project_costs.sql` (`register_cost`, `complete_costs`, `project_margin`) |
| Reportes (DB)                | `…170000_reports.sql` (`report_business/profitability/sellers/fairs`)             |
| Aceptar / Confirmar en UI    | `src/modules/quotes/PresupuestoDetailPage.tsx` (botones Aceptar, Confirmar venta, Duplicar, Guardar como plantilla) |
| PDF                          | `src/modules/quotes/QuotePdf.tsx`                                                 |
| Invitaciones                 | `api/invite.ts`                                                                   |
| Guardia de entorno           | `scripts/check-env.mjs`                                                           |
| Pruebas DB                   | `supabase/tests/*.test.sql`                                                       |
| Seed local                   | `supabase/seed.sql`                                                               |
| Deploy                       | `vercel.json`, `.github/workflows/ci.yml`, `docs/OPERACION_GO_LIVE.md`            |

---

## 22. Incertidumbres y aspectos no verificados

- **Despliegue en la nube:** no se creó ningún recurso en GitHub/Supabase/Vercel;
  los pasos están documentados pero **no ejecutados ni verificados**.
- **`api/invite.ts` en runtime:** no probado en Vercel (firma de handler y runtime).
- **CI real:** el workflow existe pero no corrió (sin remoto).
- **Rendimiento con volúmenes reales** (objetivos P95 de `docs/02`): no medido.
- **Email transaccional de Auth** (invitación/recuperación): depende de la config
  de Supabase cloud; no verificable localmente más allá de Mailpit.
- **Decisiones de negocio D01–D16:** implementadas con defaults; su validez
  funcional depende de la confirmación de Arpeco.
- **`api/invite` en runtime:** la UI de invitación existe, pero la función de
  servidor no se probó en Vercel (no corre en `vite dev`).

---

## 23. Protocolo para mantener IA.md actualizado

- Actualizar este archivo en el **mismo PR** que cambie: esquema/migraciones, RLS/
  permisos, RPC, rutas, módulos, variables de entorno o reglas de negocio.
- Al agregar una migración: reflejarla en §8 (tabla de migraciones) y §21.
- Al agregar un módulo/ruta: §5, §6, §11, §21 (y §15 si cambia el estado).
- Al cambiar una regla crítica: §13 con su archivo/consecuencia.
- Mantener la distinción **verificado vs. NO VERIFICADO**; no documentar lo
  planificado como implementado.
- Refrescar el encabezado (fecha/branch/commit) en cada actualización relevante:
  `git log -1 --format="%h %ci %s"`.
- Si el código y un doc de `docs/` se contradicen, señalarlo y priorizar el código.
