# Decisiones a validar con Grupo Arpeco

Son recomendaciones de diseño, no acuerdos ni compromisos comerciales. Cada decisión tiene dueño de negocio y fecha límite de etapa. Las tareas preparatorias pueden seguir; no liberar el flujo afectado sin resolución.

| ID / etapa límite | Falta definir; recomendación simple | Impacto en datos, permisos, UI y esfuerzo |
|---|---|---|
| D01 / 0 | Quién autoriza presupuesto aceptado y evidencia: registrar usuario, fecha, referencia breve/documento opcional | `acceptance_evidence`, RPC, botón y auditoría; si requiere aprobación múltiple aumenta etapa 4 |
| D02 / 1 | Derechos exactos de A sobre costos/márgenes: empezar sin acceso, habilitar rol específico si se aprueba | proyecciones/RLS, menús e informes; +8–20 h si granularidad extra |
| D03 / 1 | D puede gestionar usuarios sola o requiere segunda aprobación; recomendar doble control para superadmin/soporte | `user_roles`, función, pantalla y audit; +8–16 h |
| D04 / 2 | Regla de vendedor por defecto/reasignación: creador si V, selección si A/D; cambio sólo A/D | `owner_id`, RLS, campos prellenados; +4–12 h si reparto automático |
| D05 / 2 | Cliente duplicado: CUIT cuando exista y nombre normalizado con revisión humana de homónimos | índices, RPC merge, diálogo; +8–20 h según datos históricos |
| D06 / 2 | “Primera feria” para origen: primera fecha de encuentro registrada, corrección D auditada | `origin_fair_id`, atribución e informes; +8–16 h si atribución multi toque |
| D07 / 2 | Prospecto sin oportunidad: seguimiento directo breve sí; etapas CRM fijas iniciales | FK de followups, ficha y filtros; +8–16 h si pipeline configurable |
| D08 / 3 | Vigencia/condiciones de presupuesto, logo y datos institucionales: campos públicos aprobados y plantilla versionada | `app_settings`, PDF, revisión visual; +6–15 h, identidad real indispensable antes de PDF externo |
| D09 / 3 | Modificar enviado: crear nueva revisión y marcar anterior reemplazada; aceptado inmutable | revisionado, estados, UI, pruebas; +10–24 h si negociación de variantes |
| D10 / 4 | Facturas existentes: número, tipo/emisor, fecha, importe y adjunto opcional; no IVA por defecto | unicidad, formulario, Storage/RLS; +8–20 h si adjuntos o fiscalidad |
| D11 / 4 | Sobre cobro/sobre facturación y correcciones: bloquear excedente y anular/recrear con motivo | restricciones/RPC/UI/audit; +8–18 h si anticipos no asignados |
| D12 / 5 | Quién confirma costos completos: D o responsable autorizado, separado de estado Finalizado | `costs_complete_at/by`, botón, margen; +6–12 h |
| D13 / 6 | Conversión: v3 usa ventas aceptadas del período / presupuestos emitidos del período, no cohorte; confirmar comunicación al equipo | consultas, etiquetas, interpretación >100%/sin base; +8–20 h si quieren cohortes |
| D14 / 6 | Reportes ARS sin impuestos/FX: confirmar si los importes son netos y si existe operación USD; recomendar una moneda y etiqueta clara | `currency`, fórmulas, PDF, reportes; multi moneda/IVA requiere rediseño y reestimación |
| D15 / 7 | RPO/RTO, plan Supabase, retención de auditoría y adjuntos: proponer RPO 24 h/RTO 8 h con prueba | backup/Storage, permisos, operación y costo recurrente |
| D16 / 0 | Alcance e inversión comercial de v3: acordar separado del MVP previo; sitio web aparte | no altera DB, pero determina etapas aprobadas y presupuesto |

También confirmar volumen de datos históricos/importación, lista de usuarios, política de privacidad, dominio y responsable de mantenimiento antes de etapa 1/7 según corresponda. No se presupone facturación electrónica, impuestos, tipo de cambio, comisiones ni stock.

---

## Estado de implementación (al commit `2c0dab2`, 2026-10-31)

Varias decisiones ya tienen **mecanismo construido con un default**; lo que sigue pendiente en esos casos es la **confirmación de negocio** (no desarrollo). El código es la fuente de verdad; estos defaults se pueden cambiar por configuración (RBAC) o con una migración menor.

| ID | Estado build | Qué quedó implementado (default tomado) | Qué falta confirmar |
|---|---|---|---|
| D01 | ✅ Mecanismo + ⏳ política | Se **separó Aceptar de Confirmar venta**. `accept_quote` registra `accepted_by` + fecha + `acceptance_evidence` y gatea el permiso `presupuestos.accept`; la venta/proyecto nace sólo al `confirm_sale` (permiso `ventas.confirm`). Auditado. | Quién autoriza cada paso y si la evidencia es obligatoria u opcional |
| D02 | ✅ Configurable | Costo/márgenes gatean permisos (`presupuestos.view_margin`, `reportes.view_profitability`); habilitables por rol o por usuario desde la pantalla de accesos, sin tocar código | A quién de Administración se le habilita |
| D03 | ✅ Implementado | Doble aprobador para otorgar rol `direction`/`support`; RBAC admin con anti-escalación y protección del último superadmin | Alcance exacto del doble control |
| D09 | ✅ Implementado | Modificar un enviado crea **nueva revisión** (`revise_quote`, +1) y `send_quote` congela snapshot con hash; el aceptado no se reabre solo | UX para negociación de variantes |
| D12 | ✅ Implementado | `complete_costs` (sólo Dirección) marca costos completos; un costo posterior **reabre** automáticamente; margen definitivo sólo con costos completos | Si la confirmación es delegable a un responsable |
| D13 | ✅ Implementado | Conversión = ventas/presupuestos del **mismo período**; `report_business` ahora distingue además **aceptado** de **vendido/confirmado** | Comunicar al equipo la lectura (puede superar 100%) |

**Entregas nuevas de esta iteración (no estaban en D01–D16):**

- **Plantillas de presupuestos** — biblioteca de conceptos reutilizables, compartida por equipo. Usarlas requiere `presupuestos.create`; gestionarlas (crear/editar/eliminar), `presupuestos.manage_templates` (Dirección y Administración por defecto).
- **Duplicar presupuesto** — desde cualquier presupuesto se genera un borrador nuevo copiando los conceptos (el costo/notas internas sólo se copian si el usuario ve márgenes).

Pendientes de negocio **sin cambios** (siguen abiertos): D04, D05, D06, D07, D08, D10, D11, D14, D15, D16.
