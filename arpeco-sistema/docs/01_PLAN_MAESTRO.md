# Plan maestro — Sistema Grupo Arpeco

Estado: diseño para validación, 26/10/2026. No constituye software funcional ni modifica el alcance comercial contratado.

## Diagnóstico y fuentes

Fuente principal: [propuesta visual v3](../Propuesta_Visual_Grupo_Arpeco_v3.pdf) (30 páginas) y [contexto v3](../Propuesta_Grupo_Arpeco_Contenido_Para_IA.md). [Presupuesto de muestra](../Presupuesto_Comercial_Arpeco_Ejemplo_v3.pdf) orienta la salida A4. Se contrastaron [v2](../Propuesta_Visual_Grupo_Arpeco_v2.pdf) (18 páginas), [propuesta original](../Propuesta_Visual_Grupo_Arpeco.pdf) (13 páginas) y [antecedente Data Entry](../Propuesta_Grupo_Arpeco_Contenido_Para_IA_Data_Entry_34_Paginas.md). El PDF Data Entry de 34 páginas se menciona en el Markdown pero no se encuentra en la raíz actual; el Markdown es el testimonio disponible. `fuente/build_v3.py`, `screens_v3.py`, `data_v3.py`, `budget_pdf.py`, HTML, PNG y `tests/test_v3.py` generan y verifican ejemplos estáticos. No hay `package.json`, migraciones SQL ni app operativa. Los tests existentes prueban la presentación, no reglas de un sistema real.

| Cambio | Original/Data Entry | v2 | v3 vigente |
|---|---|---|---|
| Flujo | CRM y carga más extensa, ocho conceptos con costos por fila | Presupuesto directo, cuatro conceptos ilustrativos, costo global opcional | Mantiene flujo corto; agrega origen de feria |
| Contactos/tareas/stock | Vistas conceptuales, stock explícitamente opcional | Fuera del MVP simplificado | Fuera del alcance funcional solicitado; evaluar después |
| Cobros/facturas | Separados | Separados | Separados |
| Reportes | Métricas amplias conceptuales | Resumen esencial | Negocio, rentabilidad, equipo, vendedor y ferias |
| PDF comercial | Vista conceptual | Sin exportación operativa | Documento A4 y descarga solicitada |

Las páginas 27–30 de v3 son propuesta económica y próximos pasos, no pantallas. El sitio web es proyecto independiente. El precio previo del MVP no debe confundirse con presupuesto aprobado para las ampliaciones.

## Producto y alcance

Monolito modular de gestión comercial y proyectos: clientes, CRM, ferias, presupuestos y PDF, ventas, cobros, facturas ya emitidas, proyectos, costos, dashboard, reportes, usuarios y ajustes mínimos. Sin facturación electrónica, stock, planificación detallada, comisiones, mensajería automática, multiempresa ni integración con web. Las pantallas 5–25 tienen una tarea y prueba asignadas en [trazabilidad](11_MATRIZ_TRAZABILIDAD.md).

Se recomienda React 19 + Vite 8 + TypeScript, aplicación autenticada en Vercel, Supabase Auth/PostgreSQL/Storage y funciones SQL transaccionales para cambios críticos. El navegador usa credenciales de usuario sujetas a RLS; una función de servidor mínima genera PDF y gestiona invitaciones. La elección se justifica en [arquitectura](02_ARQUITECTURA_TECNICA.md).

## Principios de ejecución

1. Cerrar seguridad, modelo y reglas económicas antes de ampliar pantallas; entregar utilidad por incrementos.
2. Escribir migraciones reproducibles, restricciones y RLS junto a cada módulo; no usar mocks como evidencia de terminado.
3. Un presupuesto aceptado fija una versión comercial; al **confirmarse la venta** crea una sola venta y un solo proyecto en transacción. _(Código, commit `2c0dab2`: aceptar y confirmar venta son dos pasos separados — ver IA.md §6.5/§6.6.)_
4. Cobros, facturas y costos son hechos separados. Reportes se calculan de hechos vigentes y fechas explícitas.
5. Validar con Arpeco decisiones de negocio en los hitos indicados sin frenar preparación técnica independiente.
6. Codex implementará tareas pequeñas del [backlog](06_BACKLOG.md), con revisión humana de permisos, diffs, cálculos y migraciones.

## Hitos

Primer demo con datos persistidos y permisos reales: fin de etapa 2, con invitación, login, cliente, prospecto de feria y oportunidad consultables por un vendedor y dirección. MVP operativo: fin de etapa 5, después de PDF, venta, cobros, facturas, proyecto y costos. Alcance completo pedido: fin de etapa 7 con reportes y salida controlada. Mejoras posteriores: stock, contactos múltiples, planificación, automatizaciones e integraciones sólo por decisión nueva.

Definición de terminado: interfaz usable, persistencia Supabase, validación, RLS, estados de carga/error, pruebas relevantes, integridad, auditoría, regresión, documentación, deploy seguro y concordancia con propuesta. Véanse [roadmap](05_ROADMAP.md), [testing](07_PLAN_TESTING.md) y [go live](10_CHECKLIST_GO_LIVE.md).

## Contratos funcionales por módulo

Regla común de UI: todos los listados muestran vacío con acción pertinente, skeleton o progreso durante carga, error recuperable con reintento, permisos sin fuga y paginación donde corresponda. Todos los formularios validan cliente y servidor, impiden doble envío y preservan entrada si falla. Los criterios de aprobación concretos y pruebas de cada pantalla están en [matriz](11_MATRIZ_TRAZABILIDAD.md) y [testing](07_PLAN_TESTING.md).

| Módulo (etapa) | Pantallas/acciones y datos | Validación, excepción y aceptación |
|---|---|---|
| Clientes (2) | lista, alta corta, ficha; nombre, contacto, teléfono, email opcional, vendedor; consulta presupuestos/ventas/saldos | búsqueda global mínima antes de alta, CUIT/nombre normalizado, colisión concurrente ofrece reutilizar; V sólo cartera propia salvo búsqueda de deduplicación |
| CRM (2) | pipeline, alta/ficha oportunidad, seguimiento breve; cliente o prospecto, dueño, etapa, estimado opcional, próximo contacto | etapa válida, importe no negativo, presupuesto posible sin oportunidad; cambios de etapa auditados |
| Ferias (2) | lista/alta/ficha, participantes, prospecto, seguimiento; feria/empresa/responsable, vínculo cliente opcional | fechas coherentes, único por feria/empresa, origen persistente; no forzar conversión a cliente |
| Presupuestos (3) | lista/ficha/editor de una vista, conceptos, revisión, envío y aceptación; cliente obligatorio, oportunidad opcional, costo global interno | cantidad positiva, subtotal/total DB, costo faltante muestra “sin calcular”; enviado se revisa, aceptado inmutable; sólo D ve margen |
| PDF (3) | vista previa/descarga A4 desde revisión; identidad aprobada, conceptos y condiciones públicas | autorización por presupuesto, varias páginas, sin interno; revisar snapshot/hash y no servir versión vieja como vigente |
| Ventas (4) | ficha desde aceptación de presupuesto, acceso a cobros/facturas/proyecto | RPC único crea venta y proyecto, misma revisión/importe, reintentos idempotentes, fallo total revierte |
| Cobros (4) | lista/alta y anulación motivada en venta; importe, fecha, medio y referencia | positivo, clave idempotente, saldo suma sólo vigentes; recibo duplicado no suma dos veces |
| Facturas (4) | lista/registro de factura emitida, anulación motivada; número, fecha, importe, archivo opcional | no emite fiscalmente ni cobra, pendiente facturar calculado; documento privado si se usa |
| Proyectos (5) | lista/ficha, asignación, fechas y estados Pendiente/En proceso/Finalizado | sólo venta aceptada crea proyecto, E modifica asignados; estado final no declara costos completos |
| Costos (5) | lista/alta/anulación y cierre/reapertura de costos en proyecto | positivo, único/idempotente, estimado separado; margen definitivo sólo tras cierre explícito |
| Dashboard (6) | inicio con pocos KPI, pendientes y enlaces | mismo origen/filtros que reportes; datos faltantes como “sin base” |
| Reportes (6) | negocio, rentabilidad, equipo, individuo y ferias con períodos, corte y detalles | métricas definidas abajo, permisos por rol, sumas concilian y carga aceptable |
| Usuarios/configuración (1,7) | invitación, baja, rol, reasignación; identidad del PDF y datos mínimos | no autorregistro, escalamiento bloqueado, auditoría y sesión inactiva sin acceso |

## Definiciones de indicadores

Filtros estándar: fecha desde/hasta inclusiva, corte al fin del día local, vendedor/cliente/feria según reporte; mostrar filtros activos y zona `America/Argentina/Cordoba`. `quotes.issued_on` para presupuestado/enviados, `sales.accepted_on` para vendido/ventas, `invoices.issued_on` para facturado, `payments.received_on` para cobrado, `project_costs.incurred_on` para actividad de costos. Sólo registros no anulados. Los saldos **al corte de ventas aceptadas en el período** suman todos los pagos/facturas vigentes hasta el corte de esas ventas, incluso si el movimiento fue posterior al período de aceptación; el rótulo debe indicarlo. Vista de actividad de cobros/facturas del período usa su propia fecha y puede diferir del saldo de cohorte de ventas.

- Presupuestado = suma total de revisiones enviadas vigentes emitidas en período, una por presupuesto; no sumar revisiones históricas. Vendido = suma venta activa aceptada en período. Facturado/cobrado de actividad = suma movimientos activos con fecha en período.
- Pendiente cobrar/facturar = suma por venta del período de `max(0, venta - pagos/facturas al corte)`; excedentes se reportan como anomalía, no se ocultan en el neto.
- Rentabilidad de ventas del período: estimado sólo si costo estimado existe; provisional con costos registrados; definitivo si costos completos. Mostrar número de trabajos sin base/incompletos. Ganancia = venta - costo, margen ponderado = suma ganancia / suma venta. No promediar porcentajes de filas.
- Equipo vendedor: oportunidades creadas por fecha de creación; presupuestos enviados por fecha emisión; ventas por aceptación, cada hecho al dueño comercial congelado en ese hecho; seguimientos pendientes `next_on <= corte` sin completar. Conversión v3 = ventas aceptadas / presupuestos emitidos **del mismo período**, no cohorte; puede superar 100%; denominador 0 → “sin base”. Ticket = vendido / cantidad ventas, si hay ventas.
- Ferias: filtros por fecha de feria; prospectos únicos por feria (`fair_id`, empresa normalizada); total único transversal por cliente/prospecto canónico; oportunidades/presupuestos/ventas por `origin_fair_id` fijo, cada venta una vez. Conversión ferias = empresas compradoras atribuidas / prospectos únicos de esa feria. Resultados comerciales se observan hasta corte posterior a la feria. No calcular ROI sin costos de participar.

Implementar agregados por CTE de venta y subconsultas preagregadas de pagos/facturas/costos antes de unir, para impedir multiplicación de filas. Las consultas de detalle y KPIs comparten filtros y lógica SQL; paginar detalle en servidor. Documentar que el ejemplo v3 contiene 35 encuentros y 34 empresas únicas y que no es un dato real del negocio.
