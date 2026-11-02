# Inventario de páginas — grupo-arpeco.com

Relevamiento: 9 de octubre de 2026. Navegador Chromium headless (Playwright), viewport 1440×900 y 390×844.
Fuente de datos: `auditoria/crawl.json`, `sitemap_index.xml` (Yoast) y API pública `wp-json/wp/v2`.

## Plataforma

- WordPress 6.8.1 + Elementor, tema **Ekommart 1.9.3** (plantilla de tienda WooCommerce).
- Plugins detectados por recursos cargados: Yoast SEO, Contact Form 7, Joinchat (botón WhatsApp), PixelYourSite + Google Analytics 4 (G-QVWX1TW70J), Prime Slider (BdThemes), Happy Elementor Addons Pro, Font Awesome por CDN.

## Páginas propias de Grupo Arpeco (5)

| URL | Título | H1 | Meta description | Contenido principal | Última modificación (API) |
|---|---|---|---|---|---|
| `/` | Inicio - Grupo Arpeco | "Inicio" | **Ausente** | Slider de 4 imágenes ("STANDS CUSTOMIZADOS") + 6 mosaicos con rótulos Locales, Locales, Interiores, Stand, Stand, Propiedad. Sin texto descriptivo. | 29/03/2023 |
| `/stands/` | Stands - Grupo Arpeco | "Stands" | **Texto en francés sobre incienso Palo Santo** | Slider + 6 párrafos en un único bloque + galería de 24 fotos sin títulos | 05/02/2025 |
| `/locales/` | Locales - Grupo Arpeco | "Locales" | **Mismo texto en francés** | Slider + 5 párrafos + galería de 15 fotos sin títulos | 06/03/2023 |
| `/nosotros/` | Nosotros - Grupo Arpeco | "Nosotros" (+ H2 "Nosotros") | **Ausente** | 2 párrafos: fundación 2009, talleres propios, +11.000 m² construidos | 09/04/2024 |
| `/formulario/` | Formulario - Grupo Arpeco | "Formulario" | **Mismo texto en francés** | Render + 4 párrafos + formulario (nombre, apellido, teléfono, mensaje). Campo email roto. | 06/03/2023 |

## Navegación

| Elemento | Destino | Estado |
|---|---|---|
| INICIO | `/` | OK |
| SERVICIOS (desplegable) | `#` | No lleva a ninguna página; solo abre submenú Stands / Locales |
| Stands / Locales (submenú) | `/stands`, `/locales` | OK |
| NOSOTROS | `/nosotros/` | OK |
| FORMULARIO | `/formulario/` | OK |
| 6 mosaicos de la home (Locales, Interiores, Stand, Propiedad) | `#` | **Sin destino**: no existen páginas de Interiores ni Propiedad/Residencial |
| Instagram / Facebook | instagram.com/grupo_arpeco, facebook.com/GrupoArpeco | OK (enlaces externos) |
| Popup de login oculto | "Créer un compte", "Lost your password?" | Restos del tema (textos en francés/inglés). Registro devuelve 302 (no habilitado). |

## Canales de contacto detectados

| Canal | Dónde | Observación |
|---|---|---|
| WhatsApp | Botón flotante (Joinchat) en todas las páginas, número +54 9 351 563‑9656 | Único canal directo. El número no figura como texto visible en ninguna parte. |
| Formulario | Solo en `/formulario/` | No recoge email del visitante (ver informe). |
| Teléfono, email, dirección | — | **No publicados** en ninguna página. |
| Newsletter "Deseo recibir novedades" | Footer de todas las páginas | Pide email sin aclarar qué se envía. |

## URLs indexables ajenas al negocio (contenido demo del tema)

Todas responden 200 y están listadas en el sitemap de Yoast:

- Entradas (3): `/bijoux-etniques-femme/`, `/alpaga-laine-fine-et-resistante/`, `/photophores-et-decoration-en-albatre/` (fechas 2020–2021, en francés).
- Categorías (4): `/alpaga/`, `/bijoux/`, `/bougeoirs/`, `/deco/`.
- Etiquetas (16): `/tag/albatre/`, `/tag/alpaga/`, `/tag/ceviche/`, `/tag/chocolat-haud/`, `/tag/rocas-rojas/`, etc.
- Landing Elementor: `/createurs/`. Plantillas: `/elementor-hf/header/`, `/elementor-hf/footer/`.

Resultado: de ~30 URLs del sitemap, **solo 5 hablan de Grupo Arpeco**.

## Material visual disponible

27 imágenes propias en `wp-content/uploads/2023/02/` (descargadas a `prototipo/img/orig/` para el prototipo):

- **Stands (fotos de feria):** Edwin Guerra (2), VKR, B‑Way (2), Blangino (3: uno con marquesina y dos de un stand en OSB con pórticos verdes), Von Franken, Transatlantic Gaming / Casino Technology, Bausch + Lomb.
- **Stands (render):** Yo Constructor, estructura Trujillo.
- **Locales / showrooms:** Bajaj (foto), Kawasaki (foto), Romero Juri Viajes (foto); Mercat carnicería‑verdulería, Ferniplast, Distrito Federal, consultorios, Patio Burgués (renders).
- **Interiores:** 2 renders de restaurante.
- **Residencial:** complejo de dúplex (foto), vivienda (render).

> Pendiente de confirmar con el cliente: qué proyectos fueron construidos y cuáles quedaron en render, y si puede nombrar públicamente las marcas.
