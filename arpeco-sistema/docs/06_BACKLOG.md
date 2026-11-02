# Backlog técnico priorizado

Cada ID representa un PR acotado o, si incluye migración y UI, un pequeño grupo de PR con criterio integrado. Esfuerzo S 4–8 h, M 8–16 h, L 16–28 h de desarrollo asistido más revisión/prueba contemplada en roadmap; reestimar tras etapa 0. P0 bloquea ruta crítica, P1 completa alcance. Verificación incluye fallo/permiso, no sólo render.

| ID | Etapa | Prioridad | Esfuerzo | Depende de | Tarea y verificación |
|---|---:|---|---|---|---|
| A01 | 0 | P0 | M | — | Catalogar páginas v3/antecedentes; cotejar 21 pantallas y exclusiones con matriz 11 |
| A02 | 0 | P0 | M | A01 | Taller de flujo cliente→PDF→venta→proyecto y registrar decisiones D01–D12 |
| A03 | 0 | P0 | M | A01 | ADR stack/capas y amenaza de acceso; revisión humana |
| A04 | 0 | P0 | L | A02 | Revisar esquema, invariantes, fechas, estados y fórmulas con negocio |
| A05 | 0 | P0 | M | A04 | Revisar matriz CRUD y proyecciones por rol con datos de muestra |
| B01 | 1 | P0 | M | A03 | Crear repo TS/Vite, lint/format/typecheck, lockfile; build reproducible |
| B02 | 1 | P0 | M | B01 | Layout responsive/sidebar/rutas protegidas/estados; prueba teclado/móvil |
| B03 | 1 | P0 | M | A05 | Supabase local + migración perfiles/roles/GRANT/RLS; pgTAP deniega anon |
| B04 | 1 | P0 | M | B03 | Invitaciones Auth/recuperación/desactivación; usuario inactivo falla con sesión viva |
| B05 | 1 | P0 | M | B03 | RPC rol/reasignación y auditoría; autopromoción rechazada |
| B06 | 1 | P0 | S | B01 | CI, Vercel Preview/staging, guardia de variables; falla si Preview usa prod |
| C01 | 2 | P0 | M | B03 | Migrar cliente/contacto, índices duplicado, RLS; carrera de dos inserts |
| C02 | 2 | P0 | M | C01 | Listado/ficha/alta breve; validación, búsqueda, paginación y estados error |
| C03 | 2 | P0 | M | C01 | Función de búsqueda/reutilización/merge auditado; falso positivo revisable |
| C04 | 2 | P0 | M | C01 | Migrar oportunidades/seguimientos y RLS; owner ajeno rechazado |
| C05 | 2 | P0 | M | C04 | Pipeline y ficha/alta/seguimiento; presupuestar sin oportunidad posible |
| C06 | 2 | P1 | M | C01 | Migrar ferias/participantes/prospectos, unicidad por feria/RLS |
| C07 | 2 | P1 | M | C06 | Lista/ficha/alta feria y prospecto, asociación con cliente existente |
| C08 | 2 | P1 | M | C04,C07 | Vincular origen feria→oportunidad y seguimiento; corrección auditada |
| C09 | 2 | P0 | S | C02,C05,C07 | E2E demo V/D con persistencia; comprobar no filtración |
| Q01 | 3 | P0 | L | C01 | Migrar quotes/items/revisions/numeración, checks de dinero/RLS |
| Q02 | 3 | P0 | L | Q01 | Editor de una vista y conceptos; totales DB=UI, cero/falta de costo |
| Q03 | 3 | P0 | M | Q01 | Estados, envío, revisión inmutable; edición de enviado crea revisión |
| Q04 | 3 | P1 | M | Q02 | Consulta/vista previa, costo/margen sólo proyección interna D |
| Q05 | 3 | P0 | L | Q03 | PDF A4 desde lista blanca, autorización por presupuesto, 40 ítems, sin internos |
| S01 | 4 | P0 | L | Q03 | RPC aceptar con lock, uniques, snapshot, auditoría y rollback; test concurrente |
| S02 | 4 | P0 | M | S01 | Ficha venta/proyecto inicial y navegación; reintento devuelve mismos IDs |
| S03 | 4 | P0 | M | S01 | Migrar pagos, idempotencia/anulación/RLS; doble envío no duplica |
| S04 | 4 | P0 | M | S03 | Registro/lista/saldo de cobros; saldo concilia y error recuperable |
| S05 | 4 | P0 | M | S01 | Migrar facturas, número/fecha/importe/anulación/RLS; no crea pago |
| S06 | 4 | P0 | M | S05 | UI registrar factura existente y pendiente; datos inválidos rechazados |
| P01 | 5 | P0 | M | S01 | Estados/responsable/fecha del proyecto y RLS asignados |
| P02 | 5 | P0 | M | P01 | Listado/ficha y actualización por E; no ve importes reservados |
| P03 | 5 | P0 | M | P01 | Migrar costos, idempotencia/anulación/cierre; reapertura automática |
| P04 | 5 | P0 | M | P03 | UI costo real y comparación; sin costo estimado “sin calcular” |
| P05 | 5 | P0 | M | P03 | Margen provisional/definitivo en consulta segura; suma exacta |
| R01 | 6 | P0 | L | S03,S05,P03 | Consultas compartidas de ventas/cobros/facturas/costos con filtros; detalle=KPI |
| R02 | 6 | P0 | M | R01 | Dashboard esencial y pendientes, sin consultas duplicadas |
| R03 | 6 | P1 | M | R01 | Reporte negocio y rentabilidad, fechas/filtros, conciliación |
| R04 | 6 | P1 | M | C04,Q03,S01 | Reporte equipo e individual, cero denominador y rol V |
| R05 | 6 | P1 | L | C08,S01 | Reporte ferias y atribución única, encuentros≠empresas únicas |
| R06 | 6 | P0 | S | R02–R05 | `EXPLAIN`, carga representativa y objetivos P95; optimizar índice necesario |
| G01 | 7 | P0 | M | B–R | Auditoría RLS/GRANT, pentest funcional, regresión E2E por rol |
| G02 | 7 | P0 | M | B–R | Ensayar backup/restore en staging y rollback compatible |
| G03 | 7 | P0 | M | G01,G02 | UAT, manuales, capacitación y checklist de salida firmado |

Los IDs cubren el trabajo principal; cada PR debe añadir migraciones/pruebas/documentación correspondiente y registrar excepciones. Las 45 tareas del roadmap corresponden a estos IDs; cada una se puede dividir en PRs de esquema, UI y pruebas sin perder su criterio de aceptación. **Primer lote para empezar tras validar etapa 0:** A01–A05, luego B01/B03/B06. Ninguna tarea B implica crear producción antes de acordar permisos y entorno.
