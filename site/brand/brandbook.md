# Grupo Arpeco — Manual de identidad «Planta»

Propuesta de PRAGMA Studio · octubre de 2026 · versión 1.0

Grupo Arpeco diseña, fabrica y monta stands para ferias, exposiciones y eventos comerciales, además de locales e interiores, desde Córdoba (Argentina) y desde 2009. Este manual define cómo se ve la marca y cómo se usan sus recursos en la web y en piezas impresas.

---

## 1. Idea de la marca

**«Planta»**: la identidad parte del isotipo que Arpeco usa hoy, cuatro módulos dispuestos en molinete, y lo convierte en un sistema.

- **Cuatro módulos de distintas medidas**, como los stands y espacios que la empresa construye: uno alto, uno ancho, uno casi cuadrado y uno bajo.
- **Un vacío central**: el espacio que se diseña para cada marca.
- **Una grilla de 12 unidades** con ranuras de 0,5 u, que ordena el logotipo, los radios, las separaciones entre fotos y el patrón.

Lo que se conserva del logotipo anterior: la disposición de los módulos, el azul, el grafito y la palabra «grupo arpeco» en minúsculas.
Lo que cambia y por qué:

| Antes | Ahora | Motivo |
|---|---|---|
| Módulos dibujados solo con contorno fino | Módulos macizos | El contorno desaparecía en favicon, bordado o tamaños chicos |
| Medidas de los módulos a ojo | Grilla de 12 u con ranura constante | Se puede reconstruir, escalar y reutilizar en el sistema |
| «grupo» chico y «arpeco» grande, peso light | Dos líneas del mismo tamaño; la jerarquía la da el peso (420 y 660) | Más legible y más sólido en tamaños chicos |
| Bajada espaciada «arquitectura y construcción» | Sin bajada en el logotipo | A 28 px era ilegible; la descripción va en el texto de la página |
| PNG de baja resolución | SVG vectorial y PNG en alta | Calidad en cualquier soporte |

## 2. Logotipo

### Archivos (`logos/`)

| Archivo | Uso |
|---|---|
| `logo-primary.svg` / `.png` | Versión principal, horizontal. Fondos blancos o claros |
| `logo-white.svg` / `.png` | Fondos azul, azul profundo, grafito o foto con velo |
| `logo-dark.svg` / `.png` | Una tinta en azul profundo (#0F2A3D), para fondos claros cuando el azul no está disponible |
| `logo-monochrome.svg` / `.png` | Negro 100 %: sellos, grabado, impresión a una tinta |
| `logo-vertical.svg` / `.png` | Espacios angostos o cuadrados: credenciales, redes, cartelería vertical |
| `logo-vertical-white.svg` / `.png` | Vertical sobre fondos oscuros |
| `logo-symbol.svg` / `.png` | Isotipo solo: avatar, favicon grande, sellos, gráfica de stand |
| `logo-symbol-white.svg` / `.png` | Isotipo blanco sobre fondos oscuros |

Los PNG tienen transparencia real, sin margen extra; el logotipo horizontal mide 600 px de alto, el vertical 1200 px y el isotipo 1024 px. Todas las palabras están convertidas a curvas: los SVG no dependen de ninguna fuente instalada.

### Construcción

- Isotipo sobre una grilla de **12 × 12 u**.
- Módulos (x0, y0 → x1, y1): alto (0,0 → 4,8), ancho (4,5,0 → 12,5), casi cuadrado (7,5,5,5 → 12,12) y bajo (0,8,5 → 7,12).
- Ranura entre módulos: **0,5 u**. Vacío central: **3,5 × 3,5 u**. Radio de esquina: **0,55 u**.
- Logotipo horizontal: la altura de la «x» de «grupo» se alinea con el borde superior del isotipo y la línea base de «arpeco» con el inferior. La separación entre isotipo y palabra es de 3,25 u.

### Área de respeto

Alrededor del logotipo queda libre una distancia **x = 4 u**, un tercio de la altura del isotipo. Ningún texto, borde ni imagen entra en esa zona.

### Tamaños mínimos

| Versión | Pantalla | Impresión |
|---|---|---|
| Horizontal | 28 px de alto | 10 mm |
| Vertical | 64 px de alto | 22 mm |
| Isotipo | 16 px, con el favicon dedicado | 5 mm |

Por debajo de 32 px, el isotipo usa la versión de favicon: módulos alineados al píxel y ranura de 1 u, para que las separaciones no se borren.

### Usos incorrectos

No se debe: deformar el logotipo, cambiar sus colores, girar el isotipo, reordenar los módulos, agregar sombras, brillos o degradados, volver a la versión de contorno, reescribir el nombre con otra tipografía ni colocarlo sobre fotos sin velo. Los ejemplos están en `usos.png`.

## 3. Color

| Rol | Nombre | HEX | Uso | Contraste |
|---|---|---|---|---|
| Primario | Azul Arpeco | `#005994` | Isotipo, botones, enlaces | Blanco sobre azul 7,4:1 |
| Hover | Azul hover | `#00477A` | Estado activo del primario | 9,6:1 |
| Secundario | Azul profundo | `#0F2A3D` | Secciones oscuras, bandas de llamado a la acción | Blanco 14,8:1 |
| Acento | Ámbar obra | `#E3A42B` | Marcas, subrayados y datos destacados. **Nunca texto sobre blanco** (2,2:1) | Sobre azul profundo 6,8:1 |
| Acento frío | Celeste | `#7FB3D9` | Enlaces y números sobre fondos oscuros | Sobre azul profundo 6,6:1 |
| Texto | Grafito | `#25282B` | Texto principal y logotipo | 14,8:1 sobre blanco |
| Texto 2 | Grafito 2 | `#3F454A` | Texto secundario fuerte | — |
| Apoyo | Texto suave | `#5B6168` | Metadatos y notas | 6,3:1 sobre blanco, 5,2:1 sobre acero |
| Borde | Línea | `#D3D8DC` | Divisores y bordes de tarjetas | — |
| Superficie | Acero | `#E7EAEC` | Bandas y tarjetas | — |
| Fondo alt. | Niebla | `#F1F3F4` | Fondos alternativos de sección | — |
| Fondo | Blanco | `#FFFFFF` | Fondo principal | — |
| Canal | WhatsApp | `#17834A` | Solo botones de WhatsApp (verde ajustado para cumplir AA con texto blanco) | 4,8:1 |
| Estado | Error / Éxito | `#B3261E` / `#1F7A4A` | Mensajes de formulario | 6,5:1 / — |

**Proporción orientativa:** blanco y neutros 70 %, azul y azul profundo 25 %, ámbar menos del 5 %.

## 4. Tipografía

Una sola familia: **Archivo**, de Omnibus-Type, con licencia SIL Open Font License 1.1 (uso libre en web e impresión). Es variable en peso (100–900) y en ancho (62–125 %). El archivo está en `fonts/archivo-variable.woff2` y la licencia en `fonts/OFL.txt`.

| Estilo | Ancho | Peso | Desktop | Mobile | Interlineado |
|---|---|---|---|---|---|
| Display (H1) | 72 % | 760 | 92 px | 44 px | 1,02 |
| Título (H2) | 72 % | 760 | 58 px | 34 px | 1,02 |
| Subtítulo (H3) | 72 % | 760 | 30 px | 24 px | 1,1 |
| H4 | 72 % | 760 | 21 px | 21 px | 1,1 |
| Bajada | 100 % | 400 | 21 px | 18 px | 1,55 |
| Texto | 100 % | 400 | 18 px | 17 px | 1,6 |
| Botón y navegación | 100 % | 540–620 | 16 px | 16 px | — |
| Apoyo y pie | 100 % | 400 | 15 px | 15 px | 1,5 |
| Leyenda | 100 % | 600 | 13 px | 13 px | — |

Reglas:
- Titulares siempre en ancho condensado y peso alto, en minúscula con mayúscula inicial. No se destaca una palabra con otro color o con cursiva.
- El texto corrido no supera los 64 caracteres por línea.
- No se usan etiquetas en mayúsculas espaciadas sobre los títulos.
- Si la fuente no carga, la alternativa es `system-ui`.

## 5. Sistema gráfico

### Radios (derivados del módulo)
`4 px` etiquetas · `8 px` campos · `10 px` botones, tarjetas y fotos · `18 px` módulos de foto grandes · `999 px` filtros.

### Espaciado
Base de 4 px: 4, 8, 12, 16, 24, 32, 48, 64, 96 y 128. Las secciones usan entre 56 y 112 px de padding vertical; el margen lateral va de 16 a 40 px y el contenido tiene un ancho máximo de 1240 px.

### Botones
- **Primario:** azul, texto blanco, 52 px de alto (44 px en el header), radio de 10 px. Un solo primario por vista.
- **Secundario:** borde grafito de 2 px; en hover se rellena de grafito.
- **Sobre oscuro:** fondo blanco y texto azul profundo.
- **WhatsApp:** verde `#17834A` con el ícono oficial, solo para ese canal.
- El texto dice lo que pasa: «Pedir presupuesto», no «Enviar».

### Tarjetas
- **De proyecto:** foto 4:3 con radio de 10 px, nombre (H4) y tipo en texto suave. Los renders llevan la etiqueta «Render».
- **De servicio:** el servicio principal (stands) va destacado en azul profundo y ocupa dos filas; el resto va sobre acero. No se arma una grilla de tarjetas idénticas.
- Sin sombras: la separación la dan el color de fondo y el espacio.

### Formularios
Etiqueta siempre visible arriba del campo. Campo de 52 px de alto, borde de 1,5 px `#B9C1C7` y radio de 8 px. En foco, borde azul con halo `rgba(0,89,148,.2)`. Los errores van en texto rojo debajo del campo y explican cómo corregirlos.

### Navegación
Header blanco fijo con borde inferior, logotipo de 40 px y botón «Pedir presupuesto» siempre visible en desktop. En mobile, menú a pantalla completa y WhatsApp flotante.

### Íconos (`ui-icons/`)
Grilla de 24 px, trazo de 1,75 px, extremos y uniones redondeados (como las esquinas de los módulos) y color `currentColor`. Set: menú, cerrar, email, teléfono, ubicación, calendario, superficie, confirmado y flecha. Para WhatsApp, Instagram y Facebook se usan los íconos oficiales de cada marca. Los íconos acompañan al texto; no lo reemplazan.

### Patrón y fondos (`patterns/`, `backgrounds/`)
- `brand-pattern.svg`: el isotipo en línea, repetido sin cortes. Va sobre fondos claros, con un tamaño de 120 a 200 px por módulo.
- `brand-pattern-dark.svg`: la misma pieza en blanco al 14 %, para el azul profundo (bandas de llamado a la acción, credenciales).
- `brand-background.webp` (2400 × 1200): el patrón grande que se desvanece hacia la izquierda, para un hero o una sección con texto a la izquierda.
- **El patrón nunca va detrás de texto chico** (menos de 21 px) ni de grillas de fotos.

### Elementos (`elements/`)
- `symbol-mask.svg`: los cuatro módulos como máscara, para recortar fotos con la forma de la marca.
- `symbol-line.svg`: el isotipo en línea, para gráfica de gran formato (paredes de stand, vinilos, señalética).

## 6. Fotografía

- Fotos reales de obras de Arpeco, sin bancos de imágenes. Los renders se rotulan como tales.
- Color natural: sin filtros, viñetas ni duotonos.
- Recortes en 4:3 (tarjetas), 16:10 (servicios) y 21:9 (encabezados de página).
- **Composición de marca:** cuatro fotos ordenadas con la geometría exacta del isotipo, con columnas 4 / 0,5 / 2,5 / 0,5 / 4,5 y filas 5 / 0,5 / 2,5 / 0,5 / 3,5. Se usa en el hero y en la imagen para redes.
- La separación entre fotos equivale a la ranura del isotipo (12 px en pantalla).
- Texto sobre foto solo con un velo de azul profundo al 70 %.
- Las leyendas sobre foto van en una etiqueta blanca al 94 % con radio de 4 px.

## 7. Íconos web y redes (`icons/`, `social/`)

| Archivo | Medida | Notas |
|---|---|---|
| `favicon.ico` | 16, 32 y 48 px | Módulos blancos alineados al píxel sobre un azul con esquinas redondeadas |
| `favicon.svg` | Vectorial | Navegadores modernos |
| `favicon-32.png`, `favicon-48.png` | 32 y 48 px | |
| `apple-touch-icon.png` | 180 × 180 | Sin transparencia (iOS redondea las esquinas) |
| `icon-192.png`, `icon-512.png` | 192 y 512 | A sangre y con el isotipo dentro de la zona segura, válidos como *maskable* |
| `site.webmanifest` | — | Rutas `/brand/icons/...` |
| `og-image.png` | 1200 × 630 | Para compartir en WhatsApp, LinkedIn y Facebook |

## 8. Integración en la web

Copiar la carpeta `brand/` dentro de la carpeta pública del sitio, de modo que quede en `/brand/` (en Next.js, `public/brand/`; en un sitio estático, en la raíz).

```html
<!-- <head> -->
<link rel="icon" href="/brand/icons/favicon.ico" sizes="any">
<link rel="icon" href="/brand/icons/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/brand/icons/apple-touch-icon.png">
<link rel="manifest" href="/brand/icons/site.webmanifest">
<meta name="theme-color" content="#005994">
<meta property="og:image" content="https://grupo-arpeco.com/brand/social/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<link rel="preload" href="/brand/fonts/archivo-variable.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/brand/brand-tokens.css">

<!-- Header -->
<a class="logo" href="/"><img src="/brand/logos/logo-primary.svg" alt="Grupo Arpeco, inicio" width="115" height="40"></a>

<!-- Footer sobre fondo oscuro -->
<img src="/brand/logos/logo-white.svg" alt="Grupo Arpeco" width="139" height="48">
```

**Proporción del logotipo horizontal:** 2,886 : 1, así que `width = height × 2,886`. Declarar las dos medidas evita saltos de diseño.

**Variables CSS:** todas empiezan con `--arp-`, por ejemplo `--arp-azul`, `--arp-t-h2` o `--arp-r-md`. Los componentes usan los roles (`--arp-texto`, `--arp-accion`, `--arp-fondo-alt`) y no los colores directos; así, cambiar un color de marca no obliga a tocar los componentes.

**Patrón y fondo:** usar las clases `.arp-patron`, `.arp-patron-oscuro` y `.arp-fondo-decorativo`. Funcionan desde cualquier carpeta. Las variables `--arp-patron` y similares usan rutas absolutas (`/brand/...`), porque un `url()` relativo dentro de una variable se resuelve contra la hoja que la usa y no contra `brand-tokens.css`.

**Equivalencias con el sitio actual** (`css/styles.css`): `--azul` → `--arp-azul`, `--azul-profundo` → `--arp-azul-profundo`, `--grafito` → `--arp-grafito` (de #262626 pasa a #25282B), `--acero` → `--arp-acero`, `--linea` → `--arp-linea` y `--wa` → `--arp-whatsapp` (de #1F9E55 pasa a #17834A por contraste). El reemplazo es directo; no cambia ninguna funcionalidad.

## 9. Archivos fuente y regeneración

Los recursos se generan con código a partir de una sola definición geométrica, de modo que cualquier ajuste se propaga a todos los archivos. Ver el `README.md` del paquete.
