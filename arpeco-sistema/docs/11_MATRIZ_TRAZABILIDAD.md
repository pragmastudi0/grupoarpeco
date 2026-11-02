# Matriz de trazabilidad — propuesta v3

Fuente: [PDF v3](../Propuesta_Visual_Grupo_Arpeco_v3.pdf), 30 páginas. Cada fila de página funcional apunta a implementación real prevista; pruebas incluyen permisos, datos y estado de error. `D/A/V/E` son Dirección, Administración, Vendedor y Ejecución. La portada y páginas comerciales se clasifican expresamente para evitar falsas pantallas. Tablas con nombres del [modelo](03_MODELO_DATOS.md).

| Página PDF | Funcionalidad | Módulo / rol | Tablas | Etapa | Prueba necesaria y criterio de aceptación |
|---|---|---|---|---:|---|
| 1 | Portada conceptual | No pantalla | — | 0 | Identificada como presentación |
| 2 | Recorrido/índice | No pantalla | — | 0 | Alcance cotejado |
| 3 | Objetivo | No pantalla | — | 0 | Reglas trazadas |
| 4 | Flujo cliente→venta→proyecto | Proceso transversal / D,A,V,E | clients, quotes, sales, projects | 2–5 | Flujo E2E completo sin recarga duplicada |
| 5 | Inicio esencial | Dashboard / D,A; V propio | sales, payments, invoices, projects, quotes | 6 | KPI=detalle, pendientes navegables, permisos |
| 6 | Consulta y ficha cliente | Clientes / D,A,V propio | clients, client_contacts, quotes, sales | 2 | búsqueda, saldo calculado y ficha autorizada |
| 7 | Alta breve cliente | Clientes / D,A,V | clients, client_contacts | 2 | validación, duplicado concurrente y guardado único |
| 8 | Pipeline y oportunidad | CRM / D,A,V propio | opportunities, followups, clients | 2 | etapas, vendedor, monto/fecha y cotización sin CRM |
| 9 | Lista y alta feria | Ferias / D,V autorizado | fairs, fair_staff | 2 | feria persiste, fechas válidas y listado |
| 10 | Ficha feria y prospectos | Ferias / D,A,V participante | fairs, fair_prospects, opportunities | 2 | cifras desde hechos, acceso y enlace |
| 11 | Alta cliente potencial | Ferias / D,V autorizado | fair_prospects, clients | 2 | sin cliente obligatorio; búsqueda y unicidad |
| 12 | Seguimiento/origen | CRM/Ferias / D,V propio | followups, opportunities, fair_prospects | 2 | origen conservado, historial auditado |
| 13 | Consulta presupuesto y descarga | Presupuestos / D,A,V propio | quotes, quote_items, sales | 3–4 | total/revisión, permiso PDF, vínculo venta |
| 14 | Editor presupuesto | Presupuestos / D,V propio | quotes, quote_items, quote_revisions | 3 | subtotal exacto, costo opcional, transición |
| 15 | PDF comercial A4 | PDF / D,A,V propio | quotes, quote_items, quote_revisions, app_settings | 3 | 1/40 ítems, identidad, sin costo/margen/notas |
| 16 | Venta, cobros/facturas | Ventas / D,A; V resumen propio | sales, payments, invoices, projects | 4 | vendido/cobrado/facturado separados y saldo |
| 17 | Registrar cobro | Cobros / D,A | payments, sales, audit_events | 4 | idempotencia, validación, anulación |
| 18 | Registrar factura existente | Facturas / D,A | invoices, sales, audit_events | 4 | no genera cobro, pendiente correcto |
| 19 | Proyecto simple | Proyectos / D,A,E asignado,V resumen | projects, sales, project_costs | 4–5 | proyecto único, 3 estados, fechas y responsable |
| 20 | Registrar costo | Costos / D,E autorizado | project_costs, projects | 5 | acumulado único y cierre reabierto |
| 21 | Reporte negocio | Reportes / D,A administrativo | quotes, sales, invoices, payments | 6 | períodos/fechas distintas, KPI=detalle |
| 22 | Rentabilidad | Reportes / D | sales, quotes, projects, project_costs | 6 | mismo conjunto, provisional/real y sin costo |
| 23 | Equipo vendedores | Reportes / D,A actividad | opportunities, quotes, sales, followups | 6 | atribución por owner, conversión definida |
| 24 | Mis resultados | Reportes / V propio; D global | clients, opportunities, quotes, sales, followups | 6 | V no consulta otro vendedor ni costo |
| 25 | Resultado ferias | Reportes / D,A,V propio | fairs, fair_prospects, opportunities, quotes, sales | 6 | 35 encuentros/34 empresas ejemplo, venta única |
| 26 | Alcance y decisiones | No pantalla | — | 0 | decisiones en doc 09 |
| 27 | Desarrollo/infraestructura PRAGMA | Página comercial, excluida | — | — | No crear módulo/precio en app |
| 28 | Acompañamiento/capacitación | Página comercial, excluida | — | — | No crear módulo |
| 29 | Condiciones y sitio web independiente | Página comercial, excluida | — | — | Web fuera del sistema |
| 30 | Próximos pasos | Página comercial, excluida | — | — | No crear módulo |

Pantallas necesarias no dibujadas en v3: login/invitación/recuperación, gestión de usuarios/roles, errores y configuración mínima; etapas 1/7, tablas `profiles`, `user_roles`, `app_settings`, `support_access`, pruebas de RLS, sesiones e invitaciones. Son requisitos funcionales explícitos del plan, no evidencia de que el PDF las muestre.
