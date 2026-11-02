# Informe de auditoría — grupo-arpeco.com

**Preparado por:** PRAGMA Studio · **Fecha:** 9 de octubre de 2026
**Sitio:** https://grupo-arpeco.com · **Empresa:** Grupo Arpeco — arquitectura y construcción

## Cómo leer este informe

- **Hecho comprobado (H):** observado directamente en el sitio, con evidencia en `capturas/antes/` o `auditoria/`.
- **Hipótesis (Hi):** inferencia razonable que conviene validar con el cliente.
- **Recomendación (R):** propuesta de PRAGMA Studio.

No se dispone de datos de analítica, conversiones ni ventas del cliente, por lo que **no se cuantifican pérdidas económicas**. Las mediciones de rendimiento son de laboratorio (Lighthouse 12, red móvil simulada, desde un servidor en la nube) y deben confirmarse con datos de campo (Search Console / CrUX).

## 1. Contexto del negocio (lo que dice el propio sitio)

- (H) Empresa iniciada en 2009, especializada en diseño, gerenciamiento y construcción de arquitectura publicitaria, comercial y residencial.
- (H) Talleres propios de diseño, herrería, carpintería y gráfica; stock propio de elementos y mobiliario; servicio de mantenimiento posterior.
- (H) Declara más de 11.000 m² de instalaciones construidas y alcance en Argentina y países limítrofes.
- (H) Proyectos llave en mano: gerenciamiento, administración, dirección técnica e instalación.
- (Hi) Base operativa en Córdoba: el único indicio es la característica 351 del WhatsApp. El sitio no publica dirección.
- (Hi) Cliente principal: marcas y empresas que exponen en ferias (B2B), con un segundo frente de locales comerciales y uno menor residencial.
- (Hi) Objetivo comercial: generar pedidos de presupuesto calificados (evento, fecha, metros, ciudad).

## 2. Lo que funciona y conviene conservar

- **Portfolio real y de calidad.** Fotos de stands construidos para marcas reconocibles (Edwin Guerra, Bausch + Lomb, B‑Way, Bajaj, Kawasaki, entre otras). Es el principal activo del sitio.
- **Identidad de marca sólida.** Logotipo modular en grafito `#404040` y azul `#005994`, sobrio y profesional.
- **Diferenciales concretos ya escritos:** fábrica propia, stock, mantenimiento, llave en mano, 2009, 11.000 m².
- **WhatsApp presente** en todas las páginas.
- **Base técnica correcta:** HTTPS, `lang="es"`, canonical, Yoast SEO y sitemap activos, robots abierto.

## 3. Resultados de medición (laboratorio)

| Página | Dispositivo | Rendimiento | Accesibilidad | SEO | LCP | CLS | Peso total |
|---|---|---|---|---|---|---|---|
| Inicio | Móvil | **30** | 92 | 92 | **14,8 s** | **0,457** | 4,5 MB |
| Inicio | Desktop | 51 | 96 | 92 | 4,6 s | 0,418 | 4,5 MB |
| Stands | Móvil | 55 | 88 | 100 | **15,5 s** | 0 | 4,6 MB |
| Stands | Desktop | 73 | 93 | 100 | 3,1 s | 0 | 4,6 MB |

Umbrales de referencia de Google: LCP bueno ≤ 2,5 s; CLS bueno ≤ 0,1.
Reportes completos: `auditoria/lighthouse/*.json`.

Causas principales detectadas por Lighthouse en Inicio (móvil):
- Imágenes JPG sin optimizar: `C_06_CARNICERIA_VERDULERIA.jpg` 1,28 MB, `B_1_YOCONSTRUCTOR-scaled.jpg` 717 KB, `L_04_CASINO-scaled.jpg` 663 KB, `N_KAWASAKI_07.jpg` 555 KB. Ahorro estimado por formatos modernos: 2,2 MB.
- Recursos que bloquean el render (Font Awesome por CDN, Google Fonts con 18 variantes de "Belleza", scripts de PixelYourSite): ahorro estimado 1,8 s.
- CSS y JS sin usar del tema de tienda y addons (~220 KB).
- 7 desplazamientos de layout provocados por el slider y los mosaicos.

## 4. Tabla de hallazgos priorizada

Prioridad según impacto comercial y esfuerzo. Complejidad: B baja, M media, A alta.

| # | Página / sección | Problema detectado | Evidencia | Impacto potencial | Mejora recomendada | Prioridad | Compl. | Tipo |
|---|---|---|---|---|---|---|---|---|
| 1 | `/formulario/` | El campo de email no se renderiza: se ve el shortcode crudo `grupoarpeco [email* arqtomascasiva@gmail.com]`. El visitante no puede dejar su email. | `capturas/antes/formulario-desktop.png`; HTML del formulario sin input `email` | Consultas que llegan sin un medio de respuesta por correo; un email personal queda expuesto en texto plano (spam). Imagen poco cuidada en el momento de mayor intención. | Reparar el campo en Contact Form 7, quitar el email visible, renombrar campos (`Tomas`/`Casiva` son nombres internos) y probar envío real. | **Crítica** | B | Desarrollo / conversión |
| 2 | `/stands/`, `/locales/`, `/formulario/` | Meta description en francés sobre incienso de Palo Santo ("Encens Palo Santo naturel…"). | `crawl.json` → `description`; código fuente | Es el texto que Google puede mostrar en resultados: desconcierta y resta clics y credibilidad. | Escribir descripciones propias por página (≤155 caracteres) en Yoast. | **Crítica** | B | SEO / contenido |
| 3 | Todo el sitio | 25 URLs indexables de contenido demo en francés (bijoux, alpaga, albâtre, ceviche…) en el sitemap y accesibles. | `post-sitemap.xml`, `category-sitemap.xml`, `post_tag-sitemap.xml`; `capturas/antes/post-frances-*.png` | Diluye la temática del dominio ante buscadores y un visitante que llegue a ellas pensará que el sitio está abandonado o comprometido. | Eliminar entradas, categorías, etiquetas y `/createurs/`; redirigir 301 a inicio; excluir del sitemap. | **Alta** | B | SEO |
| 4 | Inicio | La home no dice qué hace la empresa: H1 "Inicio", sin texto, sin propuesta de valor ni llamada a la acción. Solo "STANDS CUSTOMIZADOS" sobre la foto, superpuesto y con bajo contraste. | `capturas/antes/inicio-desktop.png`, `inicio-mobile.png` | Un comprador de feria que entra por primera vez no sabe en segundos si Arpeco diseña, fabrica, alquila o monta, ni cómo pedir presupuesto. | Hero con propuesta clara ("Diseñamos, fabricamos y montamos stands…"), prueba (2009, 11.000 m², fábrica propia) y CTA "Pedir presupuesto". | **Alta** | M | Contenido / conversión |
| 5 | Inicio | Los 6 mosaicos (Locales, Interiores, Stand, Propiedad) y el ítem "Servicios" enlazan a `#`. "Interiores" y "Propiedad" no tienen página. | `crawl.json` → links con `href="#"` | El visitante hace clic donde espera ver más y no pasa nada: sensación de sitio roto y abandono de la navegación. | Cada servicio con su página o ancla real; eliminar mosaicos duplicados. | **Alta** | M | Desarrollo / UX |
| 6 | Todo el sitio | Sin teléfono, email ni dirección visibles. El WhatsApp solo existe como botón flotante; el número no se lee en ningún lado. | `crawl.json` → `tel`, `mail` vacíos; widget Joinchat | Empresas que necesitan una cotización formal (compras, agencias) suelen buscar email y razón social. Sin dirección no hay señal de taller real ni SEO local. | Bloque de contacto en footer y página Contacto con WhatsApp visible, email comercial, ciudad/dirección del taller y horario. | **Alta** | B | Contenido / conversión |
| 7 | Inicio y Stands (móvil) | LCP de 14,8 s y 15,5 s, peso de 4,5 MB, CLS 0,457 en Inicio. | `auditoria/lighthouse/` | En móvil y con red de datos, buena parte de los visitantes puede irse antes de ver la primera imagen. | Imágenes en WebP/AVIF a tamaño real, `srcset`, carga diferida, precarga del hero, quitar slider pesado y fuentes no usadas. | **Alta** | M | Rendimiento |
| 8 | `/stands/`, `/locales/` | Portfolio como grilla de fotos sin título, tipo de proyecto, evento ni ciudad. Stands mezclado con gastronomía y viviendas. | `capturas/antes/stands-desktop.png`; 22 de 26 imágenes sin `alt` en Stands, 13 de 17 en Locales | El activo más fuerte de la empresa no cuenta historias: no se puede saber qué se resolvió ni para quién. Imágenes invisibles para Google Imágenes y lectores de pantalla. | Portfolio filtrable por tipo, con ficha por proyecto (marca, tipo, m², alcance) y `alt` descriptivo. | **Alta** | M | Contenido / diseño / SEO |
| 9 | `/stands/`, `/locales/`, `/formulario/` | Textos institucionales repetidos casi idénticos en 3 páginas, en bloques densos de letra pequeña a todo el ancho (~180 caracteres por línea en desktop). | `capturas/antes/stands-desktop.png` | Poca lectura; contenido duplicado que no ayuda a posicionar cada servicio. | Texto propio y escaneable por servicio: qué incluye, proceso, preguntas frecuentes. | Media | M | Contenido |
| 10 | Todas | H1 genéricos ("Inicio", "Formulario"); sin H2 en la mayoría; sin datos estructurados de empresa local. | `crawl.json` → `h1`, `h2`, `schema` (solo WebPage de Yoast) | Menos contexto para buscadores sobre qué hace la empresa y dónde. | H1 descriptivos, jerarquía H2/H3, schema `LocalBusiness`/`GeneralContractor` con área de servicio. | Media | B | SEO |
| 11 | Formulario | El formulario no pregunta lo que necesita un presupuesto de stand: tipo de proyecto, evento/feria, fecha, metros, ciudad. | `capturas/antes/formulario-desktop.png` | Consultas incompletas que requieren varias idas y vueltas antes de cotizar. | Formulario breve calificado + opción de adjuntar plano o brief; derivación a WhatsApp con mensaje prellenado. | Media | M | Conversión |
| 12 | Todas | Tema de tienda online (Ekommart) con popup de login/registro oculto en francés/inglés ("Créer un compte", "Lost your password?"), buscador de productos y scripts de WooCommerce que el sitio no usa. | HTML: formulario `username`/`password` en todas las páginas | Peso innecesario y restos visibles para lectores de pantalla y bots; superficie de mantenimiento. | Migrar a un tema liviano o sitio a medida acorde a un estudio de arquitectura. | Media | A | Desarrollo / rendimiento |
| 13 | Footer | "Deseo recibir novedades" pide email sin explicar qué se envía; no hay enlaces a servicios ni datos de contacto. | `capturas/antes/inicio-desktop.png` | Bajo valor de suscripción; footer desaprovechado. | Footer con servicios, contacto, redes y CTA; newsletter solo si existe una comunicación real. | Baja | B | Contenido |
| 14 | Inicio (desktop) | La foto del hero tiene un desenfoque irregular en el borde derecho y se repite como mosaico "Stand". | `capturas/antes/inicio-desktop.png` | Detalle de terminación que resta en una empresa que vende terminación. | Selección curada de imágenes sin repetir. | Baja | B | Diseño |
| 15 | Navegación móvil | Cierre del menú móvil y enlace del logo sin nombre accesible. | Lighthouse `link-name` | Lectores de pantalla anuncian "enlace" sin descripción. | `aria-label` en enlaces de ícono. | Baja | B | Accesibilidad |
| 16 | Medición | GA4 cargado vía PixelYourSite; no se detectó evento de envío de formulario ni de clic en WhatsApp (no verificable sin acceso). | Script `gtag/js?id=G-QVWX1TW70J` | Sin medir conversiones no se puede saber qué canal genera presupuestos. | Configurar eventos `generate_lead` (formulario, WhatsApp, teléfono, email). | Media | B | Conversión / medición |

## 5. Respuestas a las preguntas clave

**¿Qué impide entender rápido qué vende la empresa?** La home no tiene texto: sin titular, sin bajada, sin lista de servicios (#4). El único rótulo, "STANDS CUSTOMIZADOS", se superpone a la foto.

**¿Qué puede generar desconfianza?** El campo roto del formulario con un Gmail visible (#1), textos en francés sobre incienso en Google (#2), páginas de bijouterie y alpaca bajo el mismo dominio (#3), mosaicos que no llevan a ningún lado (#5) y la ausencia de dirección o email (#6).

**¿Qué dificulta encontrar información?** "Servicios" no es una página (#5); Interiores y Residencial no existen; el portfolio no se puede filtrar ni leer como casos (#8).

**¿Qué obstáculos hay para contactar?** Un solo formulario, en una página llamada "Formulario", que no recoge email (#1, #11). WhatsApp funciona pero no se muestra como dato (#6). No hay CTA en Inicio, Stands ni Locales.

**¿Qué oportunidades de conversión están desaprovechadas?** Un CTA de presupuesto junto a cada proyecto del portfolio; WhatsApp con mensaje prellenado según el servicio; formulario calificado; prueba social (cifras, marcas, proceso).

**Mejoras rápidas (días):** #1, #2, #3, #6, #10, #13, #15, #16 y compresión de imágenes (#7 parcial).
**Proyecto mayor (semanas):** nueva home, páginas por servicio y portfolio por casos (#4, #5, #8, #9, #11), y cambio de tema/plataforma (#12, #7 completo).

## 6. Limitaciones del relevamiento

- Sin acceso al panel de WordPress, Search Console ni Analytics: tráfico, consultas recibidas y posiciones no se conocen.
- No se envió el formulario real para no generar consultas falsas al cliente.
- No se verificó el funcionamiento del botón de WhatsApp más allá de su configuración (número en `data-settings` del plugin Joinchat).
- Las métricas de rendimiento son de laboratorio desde un servidor remoto; los usuarios en Argentina pueden tener valores distintos.
- La ubicación de la empresa y el estado (obra / render) de cada proyecto no pudieron verificarse públicamente.
