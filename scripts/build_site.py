"""Genera las páginas estáticas del sitio. Uso: python3 scripts/build_site.py"""
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parent.parent / "site"
WA_NUM = "5493515639656"   # número publicado en el botón Joinchat del sitio actual
WA_VISIBLE = "+54 9 351 563-9656"

def wa(msg="Hola, quiero pedir un presupuesto."):
    return f"https://wa.me/{WA_NUM}?text={quote(msg)}"

ICON_WA = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.3c.2-.4.2-.9.2-1-.1-.1-.3-.2-.5-.3Z"/></svg>'
ICON_MENU = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>'

NAV = [("stands.html", "Stands"), ("locales.html", "Locales e interiores"),
       ("proyectos.html", "Proyectos"), ("nosotros.html", "Nosotros"), ("contacto.html", "Contacto")]

# Proyectos tomados del sitio actual. estado: "obra" (foto de obra terminada) o "render".
# El estado se infirió visualmente y debe confirmarlo el cliente.
P = [
    # id, nombre, tipo, categoría, estado, imagen, alt
    ("edwin-guerra", "Edwin Guerra", "Stand para feria de calzado", "stands", "obra", "edwin-guerra",
     "Stand blanco de Edwin Guerra con exhibidores de calzado y ruedas decorativas"),
    ("bway", "B-Way", "Stand con pórtico de luz LED", "stands", "obra", "bway",
     "Stand de B-Way enmarcado por un pórtico de tubos de luz de colores"),
    ("kawasaki", "Kawasaki", "Showroom de motos", "locales", "obra", "kawasaki",
     "Showroom de Kawasaki con motos verdes y gráfica de gran formato"),
    ("bausch-lomb", "Bausch + Lomb", "Stand institucional", "stands", "obra", "bausch-lomb",
     "Stand de Bausch + Lomb con pantalla, mostrador y gráfica retroiluminada"),
    ("stand-osb", "Blangino", "Stand en madera OSB con pórticos verdes", "stands", "obra", "stand-osb-2",
     "Stand de Blangino en madera OSB con pórticos verdes y vegetación en una feria"),
    ("bajaj", "Bajaj", "Showroom de motos", "locales", "obra", "bajaj",
     "Showroom de Bajaj con podios iluminados y motos en exhibición"),
    ("vkr", "VKR", "Stand de calzado", "stands", "obra", "vkr",
     "Stand negro de VKR con estanterías iluminadas de calzado"),
    ("blangino", "Blangino", "Stand con marquesina y letrero", "stands", "obra", "blangino",
     "Stand de Blangino con estructura de madera, marquesina y letrero rojo"),
    ("von-franken", "Von Franken", "Stand de salud animal", "stands", "obra", "von-franken",
     "Stand de Von Franken con cartel amarillo, pantalla y plantas"),
    ("casino", "Transatlantic Gaming", "Stand de máquinas de juego", "stands", "obra", "casino",
     "Stand azul de Transatlantic Gaming y Casino Technology con máquinas de juego"),
    ("romero-juri", "Romero Juri Viajes", "Oficina comercial", "locales", "obra", "romero-juri",
     "Oficina de Romero Juri Viajes con escritorios de madera y mapa en la pared"),
    ("yo-constructor", "Yo Constructor", "Stand escultórico", "stands", "render", "yo-constructor",
     "Render de stand con estructura escultórica blanca"),
    ("mercat", "Mercat", "Carnicería y verdulería", "locales", "render", "mercat",
     "Render de fachada de la carnicería y verdulería Mercat"),
    ("distrito-federal", "Distrito Federal", "Local gastronómico", "locales", "render", "distrito-federal",
     "Render del interior del local gastronómico Distrito Federal"),
    ("patio-burgues", "Patio Burgués", "Patio gastronómico", "locales", "render", "patio-burgues",
     "Render de patio gastronómico con pérgola de listones y palmeras"),
    ("ferniplast", "Ferniplast", "Fachada comercial", "locales", "render", "ferniplast",
     "Render de fachada comercial roja de Ferniplast"),
    ("consultorios", "Consultorios", "Recepción de centro de salud", "locales", "render", "consultorios",
     "Render de recepción de consultorios con paneles calados"),
    ("interior-1", "Restaurante", "Salón con cava y vegetación", "interiores", "render", "interior-1",
     "Render de salón de restaurante con cava de vinos y mesas de madera"),
    ("interior-2", "Restaurante", "Salón con estructura de madera", "interiores", "render", "interior-2",
     "Render de salón de restaurante con vigas de madera y luminarias colgantes"),
    ("duplex", "Complejo de dúplex", "Vivienda multifamiliar", "residencial", "obra", "duplex",
     "Complejo de dúplex de dos plantas con fachada blanca"),
    ("vivienda", "Vivienda unifamiliar", "Vivienda", "residencial", "render", "vivienda",
     "Render de vivienda unifamiliar de una planta con jardín"),
]
BY_ID = {p[0]: p for p in P}
CAT_LABEL = {"stands": "Stands", "locales": "Locales", "interiores": "Interiores", "residencial": "Residencial"}

def img(name, alt, eager=False, sizes="(max-width: 600px) 100vw, 33vw"):
    load = 'fetchpriority="high"' if eager else 'loading="lazy"'
    return (f'<img src="img/{name}-800.webp" srcset="img/{name}-800.webp 800w, img/{name}-1600.webp 1600w" '
            f'sizes="{sizes}" alt="{alt}" {load} decoding="async">')

def card(pid, destacado=False):
    _, nombre, tipo, cat, estado, im, alt = BY_ID[pid]
    render = '<span class="etiqueta-render">Render</span>' if estado == "render" else ""
    cls = "proyecto destacado" if destacado else "proyecto"
    sizes = "(max-width: 600px) 100vw, 66vw" if destacado else "(max-width: 600px) 100vw, 33vw"
    return (f'<figure class="{cls}" data-cat="{cat}"><div class="foto">{img(im, alt, sizes=sizes)}</div>'
            f'<figcaption><h3>{nombre}{render}</h3><p>{tipo}</p></figcaption></figure>')

def page(fname, title, desc, body, current=None):
    nav = "".join(f'<a href="{h}"{" aria-current=\"page\"" if h == current else ""}>{t}</a>' for h, t in NAV)
    html = f'''<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="theme-color" content="#005994">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Grupo Arpeco">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="https://grupo-arpeco.com/brand/social/og-image.png">
<link rel="icon" href="/brand/icons/favicon.ico" sizes="any">
<link rel="icon" href="/brand/icons/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/brand/icons/apple-touch-icon.png">
<link rel="manifest" href="/brand/icons/site.webmanifest">
<link rel="preload" href="/brand/fonts/archivo-variable.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/brand/brand-tokens.css">
<link rel="stylesheet" href="css/styles.css">
</head>
<body>
<header class="header">
  <div class="wrap">
    <a class="logo" href="/" aria-label="Grupo Arpeco, inicio"><img src="/brand/logos/logo-primary.svg" alt="Grupo Arpeco" width="115" height="40"></a>
    <nav class="nav" id="nav" aria-label="Principal">{nav}<a class="btn btn-primario nav-cta" href="contacto.html">Pedir presupuesto</a></nav>
    <a class="btn btn-primario" href="contacto.html">Pedir presupuesto</a>
    <button class="menu-btn" aria-expanded="false" aria-controls="nav" aria-label="Abrir menú">{ICON_MENU}</button>
  </div>
</header>
<main>
{body}
</main>
<footer class="footer">
  <div class="wrap">
    <div>
      <img src="/brand/logos/logo-white.svg" alt="Grupo Arpeco" width="139" height="48">
      <p>Diseño, fabricación y montaje de stands, locales comerciales e interiores. Desde 2009.</p>
    </div>
    <div>
      <h2>Servicios</h2>
      <ul><li><a href="stands.html">Stands para ferias</a></li><li><a href="locales.html">Locales comerciales</a></li><li><a href="locales.html#interiores">Interiores</a></li><li><a href="proyectos.html?f=residencial">Residencial</a></li></ul>
    </div>
    <div>
      <h2>Estudio</h2>
      <ul><li><a href="proyectos.html">Proyectos</a></li><li><a href="nosotros.html">Nosotros</a></li><li><a href="contacto.html">Contacto</a></li></ul>
    </div>
    <div>
      <h2>Contacto</h2>
      <ul><li><a href="{wa()}" target="_blank" rel="noopener">WhatsApp {WA_VISIBLE}</a></li>
      <li><a href="https://www.instagram.com/grupo_arpeco/" target="_blank" rel="noopener">Instagram</a></li>
      <li><a href="https://www.facebook.com/GrupoArpeco" target="_blank" rel="noopener">Facebook</a></li></ul>
    </div>
    <p class="legal">© Grupo Arpeco. Argentina y países limítrofes.</p>
  </div>
</footer>
<a class="wa-flotante" href="{wa()}" target="_blank" rel="noopener" aria-label="Escribir por WhatsApp">{ICON_WA}</a>
<script src="js/main.js"></script>
</body>
</html>
'''
    (ROOT / fname).write_text(html, encoding="utf-8")

def cta(titulo="¿Tenés una feria o un local en puerta?", texto="Contanos fecha, lugar y metros. Te respondemos con una propuesta."):
    return f'''<section class="cta-banda"><div class="wrap">
  <div><h2>{titulo}</h2><p>{texto}</p></div>
  <div class="acciones"><a class="btn btn-primario" href="contacto.html">Pedir presupuesto</a>
  <a class="btn btn-wa" href="{wa()}" target="_blank" rel="noopener">{ICON_WA}Escribir por WhatsApp</a></div>
</div></section>'''

# ---------- INICIO ----------
inicio = f'''
<section class="hero">
  <div class="wrap">
    <div>
      <h1>Diseñamos, fabricamos y montamos tu stand.</h1>
      <p class="lead">Stands para ferias, locales comerciales e interiores, llave en mano. Con talleres propios de herrería, carpintería y gráfica.</p>
      <div class="acciones">
        <a class="btn btn-primario" href="contacto.html">Pedir presupuesto</a>
        <a class="btn btn-borde" href="proyectos.html">Ver proyectos</a>
      </div>
      <div class="hero-datos">
        <div><strong data-count="2009" data-prefix="Desde ">Desde 2009</strong>en actividad</div>
        <div><strong data-count="11000" data-prefix="+" data-suffix=" m²">+11.000 m²</strong>construidos</div>
        <div><strong data-count="4" data-suffix=" talleres">4 talleres</strong>propios</div>
      </div>
    </div>
    <div class="isotipo" aria-label="Proyectos de Grupo Arpeco">
      <figure class="m1">{img("edwin-guerra-2", "Stand de calzado Edwin Guerra", True, "15vw")}</figure>
      <figure class="m2">{img("stand-osb-2", "Stand en OSB con pórticos verdes en una feria", True, "35vw")}<figcaption>Stand Blangino</figcaption></figure>
      <figure class="m3">{img("kawasaki", "Showroom de Kawasaki", True, "35vw")}<figcaption>Showroom Kawasaki</figcaption></figure>
      <figure class="m4">{img("blangino", "Stand de Blangino", False, "15vw")}</figure>
    </div>
  </div>
</section>

<section class="seccion seccion-acero" id="servicios">
  <div class="wrap">
    <div class="encabezado">
      <h2>Qué hacemos</h2>
      <p class="lead">Nos ocupamos del proyecto completo: diseño, legajo constructivo, fabricación, instalación y mantenimiento.</p>
    </div>
    <div class="servicio principal">
      <div class="servicio-foto">{img("bway", "Stand de B-Way con pórtico de luz", sizes="(max-width: 800px) 100vw, 55vw")}</div>
      <div>
        <h3>Stands para ferias y eventos</h3>
        <p>Stands a medida para exposiciones en todo el país y países limítrofes. Diseñamos, fabricamos en taller y montamos con nuestro equipo.</p>
        <ul><li>Diseño y renders para aprobar antes de fabricar</li><li>Gráfica, iluminación y mobiliario incluidos</li><li>Stock propio de elementos y mobiliario</li></ul>
        <a class="enlace" href="stands.html">Conocé el servicio de stands</a>
      </div>
    </div>
    <div class="servicio">
      <div class="servicio-foto">{img("bajaj", "Showroom de Bajaj", sizes="(max-width: 800px) 100vw, 55vw")}</div>
      <div>
        <h3>Locales comerciales y showrooms</h3>
        <p>Locales, showrooms, oficinas y gastronomía. Del proyecto a la apertura, con dirección técnica en obra.</p>
        <a class="enlace" href="locales.html">Ver locales comerciales</a>
      </div>
    </div>
    <div class="servicio">
      <div class="servicio-foto">{img("interior-2", "Render de interior de restaurante", sizes="(max-width: 800px) 100vw, 55vw")}</div>
      <div>
        <h3>Interiores</h3>
        <p>Diseño y equipamiento de interiores comerciales con mobiliario fabricado a medida en nuestra carpintería.</p>
        <a class="enlace" href="locales.html#interiores">Ver interiores</a>
      </div>
    </div>
    <div class="servicio">
      <div class="servicio-foto">{img("duplex", "Complejo de dúplex", sizes="(max-width: 800px) 100vw, 55vw")}</div>
      <div>
        <h3>Residencial</h3>
        <p>Proyecto y construcción de viviendas y complejos, con la misma gestión integral.</p>
        <a class="enlace" href="proyectos.html?f=residencial">Ver proyectos residenciales</a>
      </div>
    </div>
  </div>
</section>

<section class="seccion">
  <div class="wrap">
    <div class="encabezado">
      <h2>Proyectos recientes</h2>
      <p class="lead">Una selección de stands y locales diseñados y construidos por el equipo de Arpeco.</p>
    </div>
    <div class="proyectos">
      {card("edwin-guerra", True)}{card("bausch-lomb")}{card("vkr")}{card("casino")}{card("romero-juri")}{card("von-franken")}
    </div>
    <p style="margin-top:36px"><a class="btn btn-borde" href="proyectos.html">Ver todos los proyectos</a></p>
  </div>
</section>

<section class="seccion seccion-oscura">
  <div class="wrap">
    <div class="encabezado">
      <h2>Un solo equipo, de la idea al montaje</h2>
      <p class="lead muted">Gerenciamiento, administración y dirección técnica a cargo nuestro. Vos tratás con una sola persona.</p>
    </div>
    <ol class="pasos">
      <li><h3>Brief y diseño</h3><p>Relevamos marca, objetivos y espacio. Te presentamos diseño y renders.</p></li>
      <li><h3>Legajo constructivo</h3><p>Planos, materiales y cronograma, listos para aprobar y fabricar.</p></li>
      <li><h3>Fabricación</h3><p>Herrería, carpintería y gráfica en nuestros talleres.</p></li>
      <li><h3>Montaje</h3><p>Instalación en sitio con dirección técnica, en los tiempos del evento o la obra.</p></li>
      <li><h3>Mantenimiento</h3><p>Reparación y mantenimiento de lo que fabricamos e instalamos.</p></li>
    </ol>
  </div>
</section>

<section class="seccion">
  <div class="wrap taller">
    <div>
      <h2>Fábrica propia. Menos esperas.</h2>
      <p class="lead" style="margin-top:20px">Tener taller y stock propios nos permite controlar calidad y plazos, y responder rápido ante imprevistos.</p>
      <ul class="taller-lista">
        <li>Diseño<span>Arquitectos y renders</span></li>
        <li>Herrería<span>Estructuras y perfilería</span></li>
        <li>Carpintería<span>Mobiliario a medida</span></li>
        <li>Gráfica<span>Impresión y señalética</span></li>
      </ul>
    </div>
    <div class="taller-foto">{img("stand-osb", "Stand en madera y estructura verde en una feria", sizes="(max-width: 860px) 100vw, 50vw")}</div>
  </div>
</section>
{cta()}
'''
page("index.html", "Grupo Arpeco | Stands, locales comerciales e interiores",
     "Diseño, fabricación y montaje de stands para ferias, locales comerciales e interiores llave en mano. Talleres propios desde 2009.",
     inicio)

# ---------- STANDS ----------
stands_ids = [p[0] for p in P if p[3] == "stands"]
stands = f'''
<section class="pagina-titulo">
  <div class="wrap">
    <p class="miga"><a href="index.html">Inicio</a> / Stands</p>
    <h1>Stands para ferias y eventos</h1>
    <p class="lead">Stands a medida, diseñados y fabricados en nuestros talleres y montados por nuestro equipo en todo el país y países limítrofes.</p>
    <div class="acciones" style="margin-top:28px"><a class="btn btn-primario" href="contacto.html?tipo=stand">Cotizar mi stand</a>
    <a class="btn btn-wa" href="{wa('Hola, quiero cotizar un stand para una feria.')}" target="_blank" rel="noopener">{ICON_WA}WhatsApp</a></div>
  </div>
</section>
<div class="wrap"><div class="foto-ancha">{img("edwin-guerra", "Stand de Edwin Guerra en feria", True, "100vw")}</div></div>

<section class="seccion">
  <div class="wrap">
    <div class="encabezado"><h2>Qué incluye</h2><p class="lead">Un proveedor para todo el stand. Sin coordinar gráfica, carpintería y montaje por separado.</p></div>
    <div class="incluye">
      <div><h3>Diseño a medida</h3><p>Propuesta según tu marca, el espacio asignado y los objetivos en la feria, con renders para aprobar.</p></div>
      <div><h3>Legajo constructivo</h3><p>Documentación técnica completa para fabricar y para presentar ante el organizador si lo requiere.</p></div>
      <div><h3>Fabricación propia</h3><p>Estructuras, carpintería y mobiliario hechos en nuestros talleres.</p></div>
      <div><h3>Gráfica e iluminación</h3><p>Impresión, señalética y luz integradas al diseño.</p></div>
      <div><h3>Montaje y dirección técnica</h3><p>Instalación en el predio con supervisión de arquitectos.</p></div>
      <div><h3>Stock y mantenimiento</h3><p>Mobiliario y elementos de stock propio, y mantenimiento posterior.</p></div>
    </div>
  </div>
</section>

<section class="seccion seccion-acero">
  <div class="wrap">
    <div class="encabezado"><h2>Stands realizados</h2><p class="lead">Fotos de stands construidos. Los renders están indicados.</p></div>
    <div class="proyectos">{"".join(card(i) for i in stands_ids)}</div>
  </div>
</section>

<section class="seccion">
  <div class="wrap cotizar">
    <div><h2>Para cotizar tu stand</h2><p class="lead" style="margin-top:20px">Con estos datos podemos darte una primera propuesta sin idas y vueltas.</p></div>
    <ol>
      <li>Nombre de la feria o evento y ciudad</li>
      <li>Fechas de armado y apertura</li>
      <li>Metros cuadrados y caras libres del espacio</li>
      <li>Manual de marca o referencias que te gusten</li>
      <li>Qué necesitás en el stand: depósito, pantallas, atención, degustación</li>
    </ol>
  </div>
</section>
{cta("Contanos qué feria tenés en agenda", "Cuanto antes nos escribas, más opciones de diseño y fabricación.")}
'''
page("stands.html", "Stands para ferias y eventos | Grupo Arpeco",
     "Stands a medida para ferias y exposiciones: diseño, legajo constructivo, fabricación en taller propio, gráfica y montaje en Argentina y países limítrofes.",
     stands, "stands.html")

# ---------- LOCALES ----------
loc_ids = [p[0] for p in P if p[3] == "locales"]
int_ids = [p[0] for p in P if p[3] == "interiores"]
locales = f'''
<section class="pagina-titulo">
  <div class="wrap">
    <p class="miga"><a href="index.html">Inicio</a> / Locales e interiores</p>
    <h1>Locales comerciales e interiores</h1>
    <p class="lead">Showrooms, locales, oficinas y gastronomía. Diseñamos, fabricamos el equipamiento y dirigimos la obra hasta la apertura.</p>
    <div class="acciones" style="margin-top:28px"><a class="btn btn-primario" href="contacto.html?tipo=local">Cotizar mi local</a>
    <a class="btn btn-wa" href="{wa('Hola, quiero consultar por el diseño de un local comercial.')}" target="_blank" rel="noopener">{ICON_WA}WhatsApp</a></div>
  </div>
</section>
<div class="wrap"><div class="foto-ancha">{img("bajaj", "Showroom de Bajaj", True, "100vw")}</div></div>

<section class="seccion">
  <div class="wrap">
    <div class="encabezado"><h2>Cómo trabajamos un local</h2><p class="lead">La misma gestión integral que en los stands, aplicada a espacios permanentes.</p></div>
    <div class="incluye">
      <div><h3>Proyecto y legajo</h3><p>Diseño, renders y documentación constructiva para aprobar y presupuestar.</p></div>
      <div><h3>Equipamiento a medida</h3><p>Mostradores, exhibidores y mobiliario fabricados en nuestra carpintería y herrería.</p></div>
      <div><h3>Obra y mantenimiento</h3><p>Dirección técnica en obra y mantenimiento posterior de lo instalado.</p></div>
    </div>
  </div>
</section>

<section class="seccion seccion-acero">
  <div class="wrap">
    <div class="encabezado"><h2>Locales y showrooms</h2><p class="lead">Obras terminadas y proyectos. Los renders están indicados.</p></div>
    <div class="proyectos">{"".join(card(i) for i in loc_ids)}</div>
  </div>
</section>

<section class="seccion" id="interiores">
  <div class="wrap">
    <div class="encabezado"><h2>Interiores</h2><p class="lead">Salones y espacios de atención con mobiliario y terminaciones a medida.</p></div>
    <div class="proyectos">{"".join(card(i) for i in int_ids)}</div>
  </div>
</section>
{cta("¿Abrís o renovás un local?", "Contanos ubicación, metros y plazos y armamos una propuesta.")}
'''
page("locales.html", "Locales comerciales e interiores | Grupo Arpeco",
     "Diseño y construcción de locales comerciales, showrooms, oficinas e interiores gastronómicos con equipamiento fabricado en taller propio.",
     locales, "locales.html")

# ---------- PROYECTOS ----------
filtros = '<button class="filtro" type="button" data-f="todos" aria-pressed="true">Todos</button>' + "".join(
    f'<button class="filtro" type="button" data-f="{k}" aria-pressed="false">{v}</button>' for k, v in CAT_LABEL.items())
proyectos = f'''
<section class="pagina-titulo">
  <div class="wrap">
    <p class="miga"><a href="index.html">Inicio</a> / Proyectos</p>
    <h1>Proyectos</h1>
    <p class="lead">Stands, locales, interiores y viviendas diseñados y construidos por Grupo Arpeco. Los renders están indicados.</p>
  </div>
</section>
<section class="seccion" style="padding-top:0">
  <div class="wrap">
    <div class="filtros" role="group" aria-label="Filtrar proyectos">{filtros}</div>
    <p class="muted" id="conteo" aria-live="polite" style="font-size:15px"></p>
    <div class="proyectos" id="grilla">{"".join(card(p[0]) for p in P)}</div>
  </div>
</section>
{cta()}
'''
page("proyectos.html", "Proyectos | Grupo Arpeco",
     "Portfolio de stands para ferias, locales comerciales, interiores y viviendas realizados por Grupo Arpeco.",
     proyectos, "proyectos.html")

# ---------- NOSOTROS ----------
nosotros = f'''
<section class="pagina-titulo">
  <div class="wrap">
    <p class="miga"><a href="index.html">Inicio</a> / Nosotros</p>
    <h1>Arquitectos con taller propio</h1>
    <p class="lead">Grupo Arpeco nació en 2009 para diseñar, gerenciar y construir arquitectura publicitaria, comercial y residencial. Hoy somos un equipo de arquitectos y mano de obra especializada con talleres de diseño, herrería, carpintería y gráfica.</p>
  </div>
</section>
<section class="seccion" style="padding-top:0">
  <div class="wrap">
    <div class="cifras">
      <div><strong data-count="2009">2009</strong>Año de inicio</div>
      <div><strong data-count="11000" data-prefix="+" data-suffix=" m²">+11.000 m²</strong>de instalaciones construidas</div>
      <div><strong data-count="4">4</strong>talleres propios: diseño, herrería, carpintería y gráfica</div>
    </div>
  </div>
</section>
<section class="seccion seccion-acero">
  <div class="wrap taller">
    <div class="taller-foto">{img("casino", "Stand de Transatlantic Gaming en feria", sizes="(max-width: 860px) 100vw, 50vw")}</div>
    <div>
      <h2>Lo que nos diferencia</h2>
      <p class="lead" style="margin-top:20px">Trabajamos con foco en la comunicación de tu marca y en tus tiempos.</p>
      <ul class="taller-lista">
        <li>Llave en mano<span>Gerenciamiento, administración y dirección técnica</span></li>
        <li>Fábrica propia<span>Control de calidad y plazos</span></li>
        <li>Stock propio<span>Elementos y mobiliario disponibles</span></li>
        <li>Mantenimiento<span>Respaldo después de la entrega</span></li>
      </ul>
    </div>
  </div>
</section>
<section class="seccion">
  <div class="wrap encabezado" style="margin-bottom:0">
    <h2>Dónde trabajamos</h2>
    <p class="lead">Proyectos en toda la Argentina y países limítrofes. Contanos dónde necesitás que trabajemos y te asesoramos sobre el alcance.</p>
  </div>
</section>
{cta()}
'''
page("nosotros.html", "Nosotros | Grupo Arpeco",
     "Desde 2009 diseñamos y construimos stands, locales e interiores con talleres propios de diseño, herrería, carpintería y gráfica.",
     nosotros, "nosotros.html")

# ---------- CONTACTO ----------
contacto = f'''
<section class="pagina-titulo">
  <div class="wrap">
    <p class="miga"><a href="index.html">Inicio</a> / Contacto</p>
    <h1>Pedí tu presupuesto</h1>
    <p class="lead">Completá los datos de tu proyecto y prepararemos tu consulta para enviarla por WhatsApp.</p>
  </div>
</section>
<section class="seccion" style="padding-top:0">
  <div class="wrap contacto">
    <div>
      <form class="form" id="form-presupuesto" novalidate>
        <fieldset class="campo full">
          <legend>¿Qué necesitás?</legend>
          <div class="chips">
            <input type="radio" name="tipo" id="t-stand" value="stand" checked><label for="t-stand">Stand para feria</label>
            <input type="radio" name="tipo" id="t-local" value="local"><label for="t-local">Local comercial</label>
            <input type="radio" name="tipo" id="t-interior" value="interior"><label for="t-interior">Interiores</label>
            <input type="radio" name="tipo" id="t-res" value="residencial"><label for="t-res">Residencial</label>
          </div>
        </fieldset>
        <div class="campo"><label for="nombre">Nombre y apellido</label><input id="nombre" name="nombre" autocomplete="name" maxlength="100" required><p class="error" id="e-nombre">Escribí tu nombre.</p></div>
        <div class="campo"><label for="empresa">Empresa o marca <span class="opcional">(opcional)</span></label><input id="empresa" name="empresa" autocomplete="organization" maxlength="100"></div>
        <div class="campo"><label for="email">Email</label><input id="email" name="email" type="email" autocomplete="email" maxlength="150" required><p class="error" id="e-email">Escribí un email válido, por ejemplo nombre@empresa.com.</p></div>
        <div class="campo"><label for="tel">Teléfono o WhatsApp</label><input id="tel" name="tel" type="tel" autocomplete="tel" maxlength="30" required><p class="error" id="e-tel">Escribí un teléfono para coordinar.</p></div>
        <div class="campo" data-solo="stand"><label for="evento">Feria o evento <span class="opcional">(opcional)</span></label><input id="evento" name="evento" placeholder="Nombre y ciudad" maxlength="120"></div>
        <div class="campo"><label for="fecha">Fecha estimada <span class="opcional">(opcional)</span></label><input id="fecha" name="fecha" type="month"></div>
        <div class="campo"><label for="m2">Superficie aproximada <span class="opcional">(opcional)</span></label><select id="m2" name="m2"><option value="">Elegí un rango</option><option>Hasta 20 m²</option><option>20 a 50 m²</option><option>50 a 100 m²</option><option>Más de 100 m²</option><option>No lo sé todavía</option></select></div>
        <div class="campo"><label for="ciudad">Ciudad del proyecto <span class="opcional">(opcional)</span></label><input id="ciudad" name="ciudad" autocomplete="address-level2" maxlength="100"></div>
        <div class="campo full"><label for="mensaje">Contanos el proyecto</label><textarea id="mensaje" name="mensaje" placeholder="Qué querés lograr, referencias, plazos" maxlength="1000"></textarea></div>
        <div class="full acciones" style="align-items:center"><button class="btn btn-primario" type="submit">Continuar en WhatsApp</button>
        <p class="form-nota">Se abrirá WhatsApp con tu consulta. Revisá el mensaje y pulsá Enviar allí para contactar a Grupo Arpeco.</p></div>
      </form>
      <div class="confirmacion" id="confirmacion" role="status" tabindex="-1" hidden>
        <h3>Tu consulta está lista</h3>
        <p>Para enviarla a Grupo Arpeco, abrí WhatsApp y pulsá Enviar. Si no se abrió automáticamente, usá este botón:</p>
        <a class="btn btn-wa" id="abrir-whatsapp" href="{wa()}" target="_blank" rel="noopener">{ICON_WA}Abrir WhatsApp</a>
        <button class="btn btn-borde" type="button" id="otro">Editar datos</button>
      </div>
    </div>
    <aside class="datos">
      <h3>Hablemos directo</h3>
      <dl>
        <dt>WhatsApp</dt><dd><a href="{wa()}" target="_blank" rel="noopener">{WA_VISIBLE}</a></dd>
        <dt>Zona de trabajo</dt><dd>Argentina y países limítrofes</dd>
      </dl>
      <a class="btn btn-wa" href="{wa()}" target="_blank" rel="noopener">{ICON_WA}Escribir por WhatsApp</a>
    </aside>
  </div>
</section>
'''
page("contacto.html", "Pedir presupuesto | Grupo Arpeco",
     "Pedí presupuesto para tu stand, local comercial o interiores y envianos los detalles por WhatsApp.",
     contacto, "contacto.html")
print("ok")
