"""Genera entregables/propuesta-redisenio.pdf a partir de las capturas reales.

Uso (desde la raíz del proyecto): python3 scripts/informe.py
Requiere capturas en capturas/antes y capturas/despues (ver README).
"""
from pathlib import Path
from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
A, D = ROOT / "capturas/antes", ROOT / "capturas/despues"
OUT = ROOT / "entregables"
SRC = OUT / "fuente"
IMG = SRC / "img"
IMG.mkdir(parents=True, exist_ok=True)

def prep(name, src, y0=0, y1=None, width=1500, x0=0, x1=None):
    im = Image.open(src).convert("RGB")
    im = im.crop((x0, y0, x1 or im.width, min(y1 or im.height, im.height)))
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    im.save(IMG / f"{name}.jpg", quality=82, optimize=True, progressive=True)
    return f"img/{name}.jpg"

# ---- imágenes ----
I = {}
I["portada"] = prep("portada", D / "inicio-desktop-fold.png", 36, 900, 1800)
I["a_inicio_anot"] = prep("a-inicio-anot", A / "inicio-desktop.png", 0, 1700, 1200)
I["a_form_anot"] = prep("a-form-anot", A / "formulario-desktop.png", 1040, 1560, 1440, x0=700)
I["a_post"] = prep("a-post", A / "post-frances-desktop-fold.png", 0, 900, 1200)
I["a_inicio"] = prep("a-inicio", A / "inicio-desktop-fold.png")
I["d_inicio"] = prep("d-inicio", D / "inicio-desktop-fold.png")
I["a_inicio_m"] = prep("a-inicio-m", A / "inicio-mobile-fold.png", width=700)
I["d_inicio_m"] = prep("d-inicio-m", D / "inicio-mobile-fold.png", width=700)
I["d_inicio_m2"] = prep("d-inicio-m2", D / "inicio-mobile.png", 1688, 3376, 700)
I["a_serv"] = prep("a-serv", A / "seccion-servicios-desktop.png")
I["d_serv"] = prep("d-serv", D / "seccion-servicios-desktop.png", 0, 1560)
I["a_stands"] = prep("a-stands", A / "stands-desktop-fold.png")
I["d_stands"] = prep("d-stands", D / "stands-desktop-fold.png")
I["a_port"] = prep("a-port", A / "seccion-portfolio-desktop.png")
I["d_port"] = prep("d-port", D / "seccion-portfolio-desktop.png", 0, 1400)
I["a_cont"] = prep("a-cont", A / "seccion-contacto-desktop.png", 0, 560, x0=700)
I["d_cont"] = prep("d-cont", D / "seccion-contacto-desktop.png", 0, 900, x0=120, x1=1320)
full = Image.open(D / "inicio-desktop.png")
seg = full.height // 3
for i in range(3):
    I[f"d_home_{i}"] = prep(f"d-home-{i}", D / "inicio-desktop.png", i * seg, (i + 1) * seg, 1000)
for n in ["inicio", "stands", "proyectos", "contacto"]:
    I[f"m_{n}"] = prep(f"m-{n}", D / f"{n}-mobile.png", 0, 2400, 600)
for n in ["locales", "proyectos", "nosotros"]:
    I[f"d_{n}_fold"] = prep(f"d-{n}-fold", D / f"{n}-desktop-fold.png", 36, 800, 1200)
I["d_proceso"] = prep("d-proceso", D / "seccion-proceso-desktop.png")

FONT = (ROOT / "prototipo/fonts/archivo-latin-wdth-normal.woff2").as_uri()

def marker(n, x, y):
    """Marker positioned in % over an annotated screenshot."""
    return f'<span class="mk" style="left:{x}%;top:{y}%">{n}</span>'

def antes_despues(titulo, bajada, a_img, d_img, nota_a, nota_d, num, ratio="auto"):
    return f'''
<section class="pg">
  <header class="ph"><h2>{titulo}</h2><p>{bajada}</p></header>
  <div class="ad">
    <figure><figcaption><b class="tag ta">Antes</b>{nota_a}</figcaption><div class="shot"><img src="{a_img}"></div></figure>
    <figure><figcaption><b class="tag td">Después</b>{nota_d}</figcaption><div class="shot"><img src="{d_img}"></div></figure>
  </div>
  <footer class="pf"><span>Grupo Arpeco · Propuesta de rediseño</span><span>{num}</span></footer>
</section>'''

def pie(n):
    return f'<footer class="pf"><span>Grupo Arpeco · Propuesta de rediseño</span><span>{n:02d}</span></footer>'

html = f'''<!doctype html>
<html lang="es"><head><meta charset="utf-8"><title>Propuesta de rediseño web — Grupo Arpeco</title>
<style>
@font-face {{ font-family: Archivo; src: url("{FONT}") format("woff2-variations"); font-weight: 100 900; font-stretch: 62% 125%; }}
@page {{ size: 297mm 210mm; margin: 0; }}
* {{ box-sizing: border-box; }}
html, body {{ margin: 0; padding: 0; }}
body {{ font-family: Archivo, sans-serif; color: #1f2326; font-size: 11.5pt; line-height: 1.45; -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
.pg {{ width: 297mm; height: 210mm; padding: 16mm 18mm 14mm; position: relative; page-break-after: always; overflow: hidden; display: flex; flex-direction: column; }}
.pg:last-child {{ page-break-after: auto; }}
h1, h2, h3 {{ font-stretch: 72%; font-weight: 760; line-height: 1.03; margin: 0; letter-spacing: -0.005em; }}
h2 {{ font-size: 28pt; }}
h3 {{ font-size: 15pt; margin-bottom: 2mm; }}
p {{ margin: 0 0 3mm; }}
.ph {{ display: grid; grid-template-columns: 1fr 1fr; gap: 12mm; align-items: end; margin-bottom: 7mm; }}
.ph p {{ font-size: 12pt; color: #4a5258; margin: 0; }}
.pf {{ position: absolute; left: 18mm; right: 18mm; bottom: 7mm; display: flex; justify-content: space-between; font-size: 8.5pt; color: #8a9298; }}
.azul {{ color: #005994; }}
.muted {{ color: #5b6168; }}
small {{ font-size: 9pt; color: #6b7379; }}

/* cover */
.cover {{ padding: 0; display: grid; grid-template-columns: 112mm 1fr; }}
.cover .izq {{ padding: 18mm 14mm 16mm 18mm; display: flex; flex-direction: column; }}
.cover .marca {{ font-stretch: 80%; font-weight: 800; font-size: 13pt; letter-spacing: .04em; }}
.cover h1 {{ font-size: 40pt; margin-top: auto; }}
.cover .cliente {{ font-size: 15pt; margin: 6mm 0 1mm; font-weight: 600; }}
.cover .meta {{ color: #5b6168; font-size: 11pt; }}
.cover .der {{ background: #E7EAEC; padding: 14mm 0 14mm 10mm; display: flex; align-items: center; }}
.cover .der img {{ width: 100%; border-radius: 3mm 0 0 3mm; box-shadow: 0 2mm 8mm rgba(15,42,61,.18); }}
.cover .nota {{ font-size: 9pt; color: #5b6168; margin-top: 3mm; }}

/* grids */
.cols3 {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 9mm; }}
.cols2 {{ display: grid; grid-template-columns: 1fr 1fr; gap: 10mm; }}
.big {{ font-stretch: 70%; font-weight: 760; font-size: 34pt; line-height: 1; color: #005994; display: block; margin-bottom: 2mm; }}
.box {{ border-top: 1.2mm solid #1f2326; padding-top: 4mm; }}
.box.az {{ border-color: #005994; }}
ul.l {{ margin: 0; padding-left: 4.5mm; }}
ul.l li {{ margin-bottom: 1.6mm; }}

/* annotated */
.anot {{ display: grid; grid-template-columns: 1.25fr 1fr; gap: 10mm; flex: 1; min-height: 0; }}
.anot .shot {{ position: relative; border: .3mm solid #cfd5d9; border-radius: 2mm; overflow: hidden; align-self: start; }}
.anot .shot img {{ width: 100%; display: block; }}
.mk {{ position: absolute; transform: translate(-50%, -50%); width: 9mm; height: 9mm; border-radius: 50%; background: #005994; color: #fff; font-weight: 700; font-size: 12pt; display: flex; align-items: center; justify-content: center; border: .8mm solid #fff; box-shadow: 0 .5mm 2mm rgba(0,0,0,.35); }}
ol.notas {{ list-style: none; margin: 0; padding: 0; counter-reset: n; }}
ol.notas li {{ counter-increment: n; position: relative; padding-left: 12mm; margin-bottom: 5mm; }}
ol.notas li::before {{ content: counter(n); position: absolute; left: 0; top: 0; width: 8mm; height: 8mm; border-radius: 50%; background: #005994; color: #fff; font-weight: 700; display: flex; align-items: center; justify-content: center; font-size: 11pt; }}
ol.notas b {{ display: block; font-size: 12.5pt; }}

/* before/after */
.ad {{ display: grid; grid-template-columns: 1fr 1fr; gap: 8mm; flex: 1; min-height: 0; }}
.ad figure {{ margin: 0; display: flex; flex-direction: column; min-height: 0; }}
.ad figcaption {{ font-size: 10pt; color: #4a5258; margin-bottom: 3mm; min-height: 10mm; }}
.tag {{ display: inline-block; font-size: 9.5pt; padding: .8mm 3mm; border-radius: 1.5mm; margin-right: 2.5mm; color: #fff; }}
.ta {{ background: #6b7379; }}
.td {{ background: #005994; }}
.shot {{ border: .3mm solid #cfd5d9; border-radius: 2mm; overflow: hidden; flex: 1; min-height: 0; background: #f3f5f6; }}
.ad .shot, .tira .shot, .mob .shot {{ flex: 0 1 auto; }}
.ad .shot img {{ width: 100%; height: auto; display: block; }}
.mob {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 7mm; flex: 1; min-height: 0; }}
.mob figure {{ margin: 0; display: flex; flex-direction: column; min-height: 0; }}
.mob .shot {{ border-radius: 4mm; }}
.mob img {{ width: 100%; height: auto; display: block; }}
.mob figcaption {{ font-size: 10pt; font-weight: 600; margin-top: 2mm; }}
.tira {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 6mm; flex: 1; min-height: 0; }}
.tira .shot img {{ width: 100%; height: auto; display: block; }}

table {{ width: 100%; border-collapse: collapse; font-size: 10pt; }}
th {{ text-align: left; font-weight: 650; border-bottom: .5mm solid #1f2326; padding: 2mm 2.5mm; vertical-align: bottom; }}
td {{ border-bottom: .25mm solid #d3d8dc; padding: 2.2mm 2.5mm; vertical-align: top; }}
td.n {{ white-space: nowrap; }}
.pill {{ display: inline-block; font-size: 8.5pt; font-weight: 650; padding: .4mm 2mm; border-radius: 4mm; }}
.crit {{ background: #1f2326; color: #fff; }}
.alta {{ background: #005994; color: #fff; }}
.media {{ background: #dbe7f0; color: #0F2A3D; }}
.baja {{ background: #eceff1; color: #4a5258; }}
.mal {{ color: #9a3b00; font-weight: 650; }}

.sw {{ display: flex; gap: 4mm; margin: 2mm 0 6mm; }}
.sw div {{ flex: 1; }}
.sw i {{ display: block; height: 16mm; border-radius: 2mm; border: .3mm solid #cfd5d9; margin-bottom: 1.5mm; }}
.sw span {{ font-size: 9pt; display: block; }}
.tipo1 {{ font-stretch: 72%; font-weight: 760; font-size: 30pt; line-height: 1; }}
.tipo2 {{ font-size: 12pt; }}

.fases {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 7mm; }}
.fase {{ border: .3mm solid #cfd5d9; border-radius: 2.5mm; padding: 6mm; }}
.fase.prin {{ border: .6mm solid #005994; }}
.fase h3 {{ font-size: 17pt; }}
.fase .dur {{ font-size: 10pt; color: #005994; font-weight: 650; margin-bottom: 3mm; display: block; }}
.fase ul {{ margin: 0; padding-left: 4.5mm; font-size: 10.5pt; }}
.fase li {{ margin-bottom: 1.4mm; }}

.cierre {{ background: #0F2A3D; color: #dfe8ef; }}
.cierre h2 {{ color: #fff; font-size: 34pt; }}
.cierre .pasos {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 8mm; margin-top: 10mm; }}
.cierre .pasos div {{ border-top: .8mm solid #7fb3d9; padding-top: 4mm; }}
.cierre .pasos b {{ display: block; font-stretch: 72%; font-size: 26pt; color: #7fb3d9; line-height: 1; margin-bottom: 2mm; }}
.cierre .pasos h3 {{ color: #fff; }}
.cierre .contacto {{ margin-bottom: 6mm; margin-top: auto; display: flex; justify-content: space-between; align-items: end; border-top: .3mm solid #36536a; padding-top: 6mm; }}
.cierre .contacto .marca {{ font-stretch: 80%; font-weight: 800; font-size: 20pt; color: #fff; letter-spacing: .03em; }}
.cierre .pf {{ color: #7f97aa; }}
</style></head><body>

<!-- 1. Portada -->
<section class="pg cover">
  <div class="izq">
    <div class="marca">PRAGMA STUDIO</div>
    <h1>Propuesta de rediseño web</h1>
    <div class="cliente">Grupo Arpeco — arquitectura y construcción</div>
    <div class="meta">grupo-arpeco.com<br>9 de octubre de 2026</div>
  </div>
  <div class="der"><div style="width:100%"><img src="{I["portada"]}"><p class="nota">Captura real del prototipo propuesto, página de inicio en escritorio.</p></div></div>
</section>

<!-- 2. Resumen -->
<section class="pg">
  <header class="ph"><h2>Resumen ejecutivo</h2><p>Grupo Arpeco tiene un portfolio de obras sólido y reconocible. Hoy el sitio no lo hace valer ni facilita pedir un presupuesto.</p></header>
  <div class="cols3">
    <div class="box"><h3>Lo que encontramos</h3><ul class="l">
      <li>La portada no dice qué hace la empresa ni ofrece un botón para pedir presupuesto.</li>
      <li>El formulario no permite dejar un email y muestra una dirección de Gmail en texto plano.</li>
      <li>Tres páginas aparecen en Google con una descripción en francés sobre incienso.</li>
      <li>De 30 páginas que el sitio informa a Google, solo 5 son de Arpeco.</li>
      <li>En celular, la imagen principal tarda 14,8 s en aparecer (medición de laboratorio).</li></ul></div>
    <div class="box az"><h3>Lo que proponemos</h3><ul class="l">
      <li>Corregir en una semana los problemas que restan confianza.</li>
      <li>Un sitio nuevo de 6 páginas que muestre el portfolio como evidencia y lleve a la consulta.</li>
      <li>Un formulario de presupuesto con los datos que el equipo necesita para cotizar.</li>
      <li>Carga rápida en celular y bases de SEO para búsquedas de stands y locales.</li></ul></div>
    <div class="box"><h3>Ya está construido</h3>
      <p>Este documento no muestra ideas sueltas: el rediseño existe como prototipo navegable, con las fotos y los textos reales de Arpeco.</p>
      <span class="big">6</span><p>páginas rediseñadas, en escritorio y celular</p>
      <span class="big">55</span><p>pruebas de enlaces, formularios y navegación superadas</p></div>
  </div>
  {pie(2)}
</section>

<!-- 3. Fortalezas -->
<section class="pg">
  <header class="ph"><h2>Lo que ya funciona y conservamos</h2><p>El rediseño parte de lo que Arpeco ya tiene. No se cambia la marca: se la pone en primer plano.</p></header>
  <div class="cols2" style="flex:1">
    <div>
      <div class="box az" style="margin-bottom:7mm"><h3>Un portfolio real y de calidad</h3><p>Stands construidos para marcas como Edwin Guerra, Bausch + Lomb, B-Way, Blangino y showrooms de Bajaj y Kawasaki. Es el principal argumento de venta.</p></div>
      <div class="box" style="margin-bottom:7mm"><h3>Diferenciales concretos</h3><p>Desde 2009, más de 11.000 m² construidos, talleres propios de diseño, herrería, carpintería y gráfica, stock propio y mantenimiento posterior.</p></div>
      <div class="box"><h3>Una identidad sobria</h3><p>El isotipo modular en grafito y azul transmite oficio y orden. Lo usamos como base del nuevo diseño.</p></div>
    </div>
    <div class="shot" style="border-radius:2mm"><img src="{I["d_port"]}" style="width:100%;height:auto;display:block"></div>
  </div>
  {pie(3)}
</section>

<!-- 4. Diagnóstico inicio -->
<section class="pg">
  <header class="ph"><h2>Diagnóstico: la portada</h2><p>Quien entra por primera vez ve fotos de calidad, pero no un mensaje ni un camino para avanzar.</p></header>
  <div class="anot" style="grid-template-columns:118mm 1fr">
    <div class="shot"><img src="{I["a_inicio_anot"]}">
      {marker(1, 44.2, 12.2)}{marker(2, 21, 37.7)}{marker(3, 50, 80)}{marker(4, 96.4, 50.2)}
    </div>
    <ol class="notas">
      <li><b>"Servicios" no lleva a ninguna página</b>El menú abre un submenú, pero el ítem apunta a "#". No existen páginas de Interiores ni Residencial.</li>
      <li><b>Un único rótulo, sin propuesta ni botón</b>"Stands customizados" se superpone a la foto. No hay bajada, ni datos de la empresa, ni un botón para pedir presupuesto. El título principal de la página (H1) es "Inicio".</li>
      <li><b>Seis mosaicos que no responden</b>Locales, Interiores, Stand y Propiedad invitan a hacer clic, pero los seis enlazan a "#". Dos fotos se repiten.</li>
      <li><b>WhatsApp como único contacto</b>Funciona, pero el número no figura escrito en ninguna página. No hay email, teléfono ni dirección.</li>
    </ol>
  </div>
  {pie(4)}
</section>

<!-- 5. Diagnóstico formulario y Google -->
<section class="pg">
  <header class="ph"><h2>Diagnóstico: el momento de la consulta</h2><p>Dos detalles técnicos aparecen justo donde el visitante decide escribir o buscar a la empresa.</p></header>
  <div class="anot" style="grid-template-columns:1.35fr 1fr">
    <div>
      <div class="shot" style="position:relative"><img src="{I["a_form_anot"]}">{marker(1, 51.6, 24.4)}{marker(2, 21, 7.7)}</div>
      <p class="muted" style="margin-top:4mm;font-size:10pt">Página /formulario/ — captura real, 9 de octubre de 2026.</p>
    </div>
    <ol class="notas">
      <li><b>El campo de email no aparece</b>En su lugar se ve el código interno del formulario con un Gmail personal. El visitante no puede dejar su email y esa dirección queda expuesta a correo no deseado.</li>
      <li><b>No pregunta lo necesario para cotizar</b>Solo nombre, apellido, teléfono y mensaje. Falta el tipo de proyecto, la feria, la fecha, los metros y la ciudad.</li>
      <li style="list-style:none"><b>Lo que Google puede mostrar de Stands, Locales y Formulario</b>
        <div style="border:.3mm solid #cfd5d9;border-radius:2mm;padding:4mm;margin-top:2mm;font-size:10.5pt">
        <span style="color:#1a0dab;font-size:12pt">Stands - Grupo Arpeco</span><br><span style="color:#006621;font-size:9.5pt">grupo-arpeco.com › stands</span><br>
        <span class="mal">Encens Palo Santo naturel. Produit par la communauté de Minga Minga au nord du Pérou…</span></div>
        <small>Simulación con la meta description real de la página. Google puede reemplazarla por otro texto.</small></li>
    </ol>
  </div>
  {pie(5)}
</section>

<!-- 6. Contenido demo -->
<section class="pg">
  <header class="ph"><h2>Diagnóstico: páginas ajenas al negocio</h2><p>El tema de WordPress es una plantilla de tienda online. Su contenido de demostración sigue publicado.</p></header>
  <div class="anot">
    <div class="shot"><img src="{I["a_post"]}"></div>
    <div>
      <span class="big">25 de 30</span><p>URLs del mapa del sitio que Arpeco informa a Google son contenido de demostración en francés: bijouterie, alpaca, alabastro, ceviche.</p>
      <ul class="l" style="margin-top:6mm">
        <li>3 artículos, 4 categorías, 16 etiquetas y una landing.</li>
        <li>Todas responden y pueden indexarse.</li>
        <li>Diluyen el tema del dominio para los buscadores.</li>
        <li>Si alguien llega a ellas, puede pensar que el sitio está abandonado.</li>
      </ul>
      <p style="margin-top:6mm"><b>Solución:</b> eliminarlas y redirigirlas a la portada. Es parte de la primera semana de trabajo.</p>
      <small>Captura: grupo-arpeco.com/bijoux-etniques-femme/</small>
    </div>
  </div>
  {pie(6)}
</section>

<!-- 7. Rendimiento -->
<section class="pg">
  <header class="ph"><h2>Diagnóstico: velocidad</h2><p>Medición de laboratorio con Google Lighthouse. Las imágenes sin optimizar son la causa principal.</p></header>
  <table>
    <tr><th>Página</th><th>Dispositivo</th><th>Rendimiento (0–100)</th><th>Aparición de la imagen principal (LCP)</th><th>Saltos de diseño (CLS)</th><th>Peso</th></tr>
    <tr><td>Inicio</td><td>Celular</td><td class="mal">30</td><td class="mal">14,8 s</td><td class="mal">0,46</td><td>4,5 MB</td></tr>
    <tr><td>Inicio</td><td>Escritorio</td><td>51</td><td>4,6 s</td><td class="mal">0,42</td><td>4,5 MB</td></tr>
    <tr><td>Stands</td><td>Celular</td><td>55</td><td class="mal">15,5 s</td><td>0</td><td>4,6 MB</td></tr>
    <tr><td>Stands</td><td>Escritorio</td><td>73</td><td>3,1 s</td><td>0</td><td>4,6 MB</td></tr>
  </table>
  <p style="margin-top:3mm"><small>Referencia de Google: LCP bueno hasta 2,5 s y CLS bueno hasta 0,1. Medición del 9/10/2026 con red móvil simulada desde un servidor remoto; los valores de usuarios reales pueden variar y conviene confirmarlos en Google Search Console.</small></p>
  <div class="cols3" style="margin-top:8mm">
    <div class="box"><h3>Fotos de hasta 1,3 MB</h3><p>Cuatro imágenes de la portada suman 3,2 MB. En formato moderno y al tamaño en pantalla, el ahorro estimado es de 2,2 MB.</p></div>
    <div class="box"><h3>Recursos de tienda que no se usan</h3><p>Scripts y estilos del tema de e-commerce, sliders y fuentes con 18 variantes bloquean la carga unos 1,8 s.</p></div>
    <div class="box az"><h3>En el prototipo</h3><p>Las 25 fotos del portfolio se convirtieron a WebP en dos tamaños, con carga diferida. El objetivo para el sitio final es LCP menor a 2,5 s en celular.</p></div>
  </div>
  {pie(7)}
</section>

<!-- 8. Problemas e impacto -->
<section class="pg">
  <header class="ph"><h2>Principales problemas y su impacto</h2><p>Priorizados por efecto en la generación de consultas y esfuerzo. El detalle completo, con 16 puntos, está en el informe de auditoría.</p></header>
  <table>
    <tr><th>Problema</th><th>Impacto potencial</th><th>Prioridad</th><th>Esfuerzo</th></tr>
    <tr><td>Formulario sin campo de email y Gmail expuesto</td><td>Consultas sin forma de respuesta por correo; imagen poco cuidada en el momento de mayor interés</td><td><span class="pill crit">Crítica</span></td><td>Bajo</td></tr>
    <tr><td>Descripción en francés en Google (3 páginas)</td><td>Resultados de búsqueda que desconciertan y restan clics</td><td><span class="pill crit">Crítica</span></td><td>Bajo</td></tr>
    <tr><td>25 páginas de demostración publicadas</td><td>Temática del sitio diluida; sensación de abandono</td><td><span class="pill alta">Alta</span></td><td>Bajo</td></tr>
    <tr><td>Portada sin mensaje ni llamada a la acción</td><td>El visitante no entiende en segundos qué ofrece Arpeco ni cómo avanzar</td><td><span class="pill alta">Alta</span></td><td>Medio</td></tr>
    <tr><td>Mosaicos y "Servicios" que llevan a "#"</td><td>Clics sin respuesta; navegación que parece rota</td><td><span class="pill alta">Alta</span></td><td>Medio</td></tr>
    <tr><td>Sin email, teléfono ni dirección visibles</td><td>Compradores corporativos sin un canal formal; sin señal de taller real</td><td><span class="pill alta">Alta</span></td><td>Bajo</td></tr>
    <tr><td>Carga lenta en celular</td><td>Visitantes que se van antes de ver el trabajo</td><td><span class="pill alta">Alta</span></td><td>Medio</td></tr>
    <tr><td>Portfolio sin títulos ni categorías; 22 de 26 fotos sin texto alternativo</td><td>El trabajo no se puede leer como casos y es difícil de encontrar en Google Imágenes</td><td><span class="pill alta">Alta</span></td><td>Medio</td></tr>
    <tr><td>Sin medición de consultas en Analytics</td><td>No se sabe qué canal genera presupuestos</td><td><span class="pill media">Media</span></td><td>Bajo</td></tr>
  </table>
  {pie(8)}
</section>

{antes_despues("Antes y después: la portada", "La nueva portada responde en la primera pantalla qué hace Arpeco, por qué confiar y cómo pedir presupuesto.", I["a_inicio"], I["d_inicio"], "Foto y rótulo, sin mensaje ni botón.", "Propuesta clara, dos acciones, datos de respaldo y obras reales.", "09", "16/10")}

<!-- 10. Mobile -->
<section class="pg">
  <header class="ph"><h2>Antes y después: en el celular</h2><p>En el teléfono, el mensaje y el botón para pedir presupuesto ahora aparecen antes que las fotos.</p></header>
  <div class="mob" style="grid-template-columns:1fr 1fr 1fr;gap:10mm;padding:0 14mm">
    <figure><div class="shot"><img src="{I["a_inicio_m"]}"></div><figcaption><b class="tag ta">Antes</b>Primera pantalla</figcaption></figure>
    <figure><div class="shot"><img src="{I["d_inicio_m"]}"></div><figcaption><b class="tag td">Después</b>Primera pantalla</figcaption></figure>
    <figure><div class="shot"><img src="{I["d_inicio_m2"]}"></div><figcaption><b class="tag td">Después</b>Al deslizar</figcaption></figure>
  </div>
  {pie(10)}
</section>

{antes_despues("Antes y después: los servicios", "Cada servicio pasa a tener nombre, descripción y un enlace a su propia página.", I["a_serv"], I["d_serv"], "Seis mosaicos que enlazan a \"#\".", "Cuatro servicios con alcance y destino real.", "11", "1440/1240")}
{antes_despues("Antes y después: página de stands", "La página de stands explica qué incluye el servicio y cómo cotizar, con acceso directo a WhatsApp.", I["a_stands"], I["d_stands"], "Logo, menú y slider ocupan la pantalla.", "Título, propuesta y dos acciones visibles.", "12", "16/10")}
{antes_despues("Antes y después: el portfolio", "El trabajo se presenta como proyectos con nombre, tipo y estado, filtrables por categoría.", I["a_port"], I["d_port"], "Texto denso y galería sin títulos.", "Filtros, nombre y tipo de cada proyecto; los renders se indican.", "13", "1440/1220")}
{antes_despues("Antes y después: pedir presupuesto", "Un formulario que pide lo justo para cotizar y deja el WhatsApp a la vista.", I["a_cont"], I["d_cont"], "Campo de email roto y datos insuficientes.", "Tipo de proyecto, feria, fecha, metros y ciudad. Validación con mensajes claros.", "14", "1440/949")}

<!-- 15. Nueva home completa -->
<section class="pg">
  <header class="ph"><h2>La nueva portada, completa</h2><p>De arriba hacia abajo: propuesta, servicios, proyectos, proceso llave en mano, fábrica propia y llamada a la acción.</p></header>
  <div class="tira">
    <div class="shot"><img src="{I["d_home_0"]}"></div>
    <div class="shot"><img src="{I["d_home_1"]}"></div>
    <div class="shot"><img src="{I["d_home_2"]}"></div>
  </div>
  {pie(15)}
</section>

<!-- 16. Mobile pages -->
<section class="pg">
  <header class="ph"><h2>Nuevas pantallas en celular</h2><p>Menú a pantalla completa, botones de 44 px o más y WhatsApp siempre a mano.</p></header>
  <div class="mob">
    <figure><div class="shot"><img src="{I["m_inicio"]}"></div><figcaption>Inicio</figcaption></figure>
    <figure><div class="shot"><img src="{I["m_stands"]}"></div><figcaption>Stands</figcaption></figure>
    <figure><div class="shot"><img src="{I["m_proyectos"]}"></div><figcaption>Proyectos</figcaption></figure>
    <figure><div class="shot"><img src="{I["m_contacto"]}"></div><figcaption>Pedir presupuesto</figcaption></figure>
  </div>
  {pie(16)}
</section>

<!-- 17. Other desktop pages -->
<section class="pg">
  <header class="ph" style="margin-bottom:5mm"><h2>Nuevas pantallas en escritorio</h2><p>Locales e interiores, Proyectos y Nosotros completan un sitio de seis páginas coherentes entre sí.</p></header>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:4mm 8mm;padding:0 14mm">
    <figure style="margin:0"><div class="shot" style="flex:none"><img src="{I["d_locales_fold"]}" style="width:100%;display:block"></div><figcaption style="margin-top:1.5mm;font-weight:600;font-size:10pt">Locales e interiores</figcaption></figure>
    <figure style="margin:0"><div class="shot" style="flex:none"><img src="{I["d_proyectos_fold"]}" style="width:100%;display:block"></div><figcaption style="margin-top:1.5mm;font-weight:600;font-size:10pt">Proyectos</figcaption></figure>
    <figure style="margin:0"><div class="shot" style="flex:none"><img src="{I["d_nosotros_fold"]}" style="width:100%;display:block"></div><figcaption style="margin-top:1.5mm;font-weight:600;font-size:10pt">Nosotros</figcaption></figure>
    <figure style="margin:0"><div class="shot" style="flex:none"><img src="{I["d_proceso"]}" style="width:100%;display:block"></div><figcaption style="margin-top:1.5mm;font-weight:600;font-size:10pt">Inicio: proceso llave en mano</figcaption></figure>
  </div>
  {pie(17)}
</section>

<!-- 18. Decisiones de diseño -->
<section class="pg">
  <header class="ph"><h2>Decisiones de diseño</h2><p>Dirección "taller y plano": la obra como protagonista y la marca como estructura.</p></header>
  <div class="cols3">
    <div>
      <h3>Color</h3><p>Mantenemos el azul y el grafito del logotipo. Retiramos el amarillo de los botones actuales porque competía con la marca.</p>
      <div class="sw">
        <div><i style="background:#005994"></i><span>Azul Arpeco<br>#005994</span></div>
        <div><i style="background:#262626"></i><span>Grafito<br>#262626</span></div>
        <div><i style="background:#E7EAEC"></i><span>Acero<br>#E7EAEC</span></div>
        <div><i style="background:#0F2A3D"></i><span>Azul profundo<br>#0F2A3D</span></div>
      </div>
      <h3>Tipografía</h3>
      <p class="tipo1">Diseñamos, fabricamos y montamos</p>
      <p class="tipo2" style="margin-top:2mm">Una sola familia, Archivo, en dos anchos: condensada para títulos, como la rotulación de obra, y normal para leer cómodo.</p>
    </div>
    <div>
      <h3>El isotipo como vitrina</h3>
      <p>En la portada, cuatro fotos de obra se ordenan con la geometría de los módulos del logo de Arpeco. La marca se vuelve el marco del portfolio y la portada no se confunde con la de otra empresa.</p>
      <div class="shot" style="flex:none;height:62mm;margin-top:3mm"><img src="{I["d_inicio"]}" style="width:100%;height:100%;object-fit:cover;object-position:92% 40%"></div>
    </div>
    <div>
      <h3>Contenido</h3>
      <ul class="l">
        <li>Textos breves, en vos, con verbos de oficio.</li>
        <li>Todos los datos vienen del sitio actual: 2009, 11.000 m², talleres, alcance.</li>
        <li>Los renders se marcan como tales, para no confundirlos con obras.</li>
        <li>Numeración solo donde hay secuencia: los cinco pasos del proceso.</li>
      </ul>
      <h3 style="margin-top:6mm">Accesibilidad</h3>
      <ul class="l"><li>Texto alternativo en todas las imágenes.</li><li>Foco visible con teclado y errores de formulario en texto.</li><li>Movimiento reducido respetado.</li></ul>
    </div>
  </div>
  {pie(18)}
</section>

<!-- 19. Mejoras por área -->
<section class="pg">
  <header class="ph"><h2>Mejoras propuestas por área</h2><p>Lo que cambia, agrupado según su efecto.</p></header>
  <div class="cols2" style="row-gap:8mm">
    <div class="box az"><h3>Conversión</h3><ul class="l"><li>"Pedir presupuesto" fijo en el menú y al pie de cada página.</li><li>Formulario calificado y WhatsApp con mensaje prellenado según el servicio.</li><li>Medición de consultas por formulario, WhatsApp y email en Google Analytics.</li></ul></div>
    <div class="box"><h3>Experiencia de usuario</h3><ul class="l"><li>Seis páginas con destino real; sin enlaces a "#".</li><li>Portfolio filtrable por stands, locales, interiores y residencial.</li><li>Lectura cómoda: líneas cortas, jerarquía clara, celular primero.</li></ul></div>
    <div class="box"><h3>SEO</h3><ul class="l"><li>Títulos y descripciones propias por página; un H1 descriptivo en cada una.</li><li>Eliminación de las 25 URLs de demostración con redirecciones.</li><li>Datos estructurados de empresa y texto alternativo en las fotos.</li></ul></div>
    <div class="box"><h3>Rendimiento</h3><ul class="l"><li>Imágenes WebP a tamaño real y carga diferida.</li><li>Fuente local y sin scripts de tienda online.</li><li>Objetivo: LCP menor a 2,5 s y CLS menor a 0,1 en celular.</li></ul></div>
  </div>
  {pie(19)}
</section>

<!-- 20. Prioridades y fases -->
<section class="pg">
  <header class="ph"><h2>Prioridades y fases de implementación</h2><p>Primero lo que resta confianza, después el sitio nuevo. Cada fase entrega valor por sí sola.</p></header>
  <div class="fases">
    <div class="fase"><h3>Fase 1 · Correcciones</h3><span class="dur">1 semana, sobre el sitio actual</span><ul>
      <li>Reparar el formulario y ocultar el Gmail.</li><li>Descripciones propias en Google.</li><li>Eliminar las 25 páginas de demostración.</li><li>Publicar WhatsApp, email y ciudad.</li><li>Comprimir las imágenes actuales.</li><li>Medir consultas en Analytics.</li></ul></div>
    <div class="fase prin"><h3>Fase 2 · Sitio nuevo</h3><span class="dur">4 a 6 semanas</span><ul>
      <li>Implementación del diseño de este prototipo.</li><li>Inicio, Stands, Locales e interiores, Proyectos, Nosotros y Contacto.</li><li>Carga de proyectos con fotos, tipo y estado.</li><li>SEO técnico y local.</li><li>Formulario conectado al email de Arpeco.</li><li>Pruebas en celular y escritorio antes de publicar.</li></ul></div>
    <div class="fase"><h3>Fase 3 · Crecimiento</h3><span class="dur">Opcional, continuo</span><ul>
      <li>Fichas de caso por proyecto destacado.</li><li>Páginas por feria o sector.</li><li>Consultas a un CRM o planilla con respuesta automática.</li><li>Informe mensual de consultas por canal.</li></ul></div>
  </div>
  <p style="margin-top:8mm" class="muted">Tiempos estimados, sujetos a la entrega de materiales por parte de Grupo Arpeco.</p>
  {pie(20)}
</section>

<!-- 21. Alcance y beneficios -->
<section class="pg">
  <header class="ph"><h2>Alcance sugerido y beneficios esperados</h2><p>Un proyecto acotado y verificable, con resultados que se pueden medir desde el primer mes.</p></header>
  <div class="cols3">
    <div class="box az"><h3>Incluido en el proyecto</h3><ul class="l"><li>Fases 1 y 2 completas.</li><li>Diseño responsive de 6 páginas.</li><li>Optimización de hasta 40 imágenes de proyectos.</li><li>Configuración de SEO, Analytics y eventos de consulta.</li><li>Redirecciones del sitio actual.</li><li>Capacitación para cargar nuevos proyectos.</li></ul></div>
    <div class="box"><h3>Lo que necesitamos de Arpeco</h3><ul class="l"><li>Lista de proyectos: marca, tipo, año, evento y si es obra o render.</li><li>Autorización para nombrar a las marcas.</li><li>Email comercial y dirección del taller.</li><li>Fotos originales en alta resolución.</li><li>Acceso al hosting y a WordPress.</li></ul></div>
    <div class="box"><h3>Beneficios esperados</h3><ul class="l"><li>Visitantes que entienden la oferta en la primera pantalla.</li><li>Consultas con los datos para cotizar desde el primer mensaje.</li><li>Un sitio coherente con la terminación de las obras.</li><li>Mejores condiciones para aparecer en búsquedas de stands y locales.</li><li>Datos para saber qué canal genera presupuestos.</li></ul>
      <p style="margin-top:3mm"><small>No prometemos posiciones en Google ni un número de consultas: dependen de factores externos al sitio.</small></p></div>
  </div>
  {pie(21)}
</section>

<!-- 22. Próximos pasos -->
<section class="pg cierre">
  <h2>Próximos pasos</h2>
  <div class="pasos">
    <div><b>1</b><h3>Revisar el prototipo juntos</h3><p>Una reunión de 30 minutos para recorrer las pantallas y ajustar textos y proyectos.</p></div>
    <div><b>2</b><h3>Confirmar alcance</h3><p>Definimos fases, materiales y fechas, y enviamos el presupuesto formal.</p></div>
    <div><b>3</b><h3>Empezar por la Fase 1</h3><p>En la primera semana se corrigen los problemas que hoy restan confianza.</p></div>
  </div>
  <div class="contacto">
    <div><div class="marca">PRAGMA STUDIO</div><p style="margin:2mm 0 0">pragmasolucionesdigitales@gmail.com</p></div>
    <p style="margin:0;max-width:90mm;text-align:right;font-size:10pt">Las capturas de este documento son reales: del sitio actual y del prototipo navegable, tomadas el 9 de octubre de 2026.</p>
  </div>
  {pie(22)}
</section>
</body></html>'''

SRC.joinpath("propuesta.html").write_text(html, encoding="utf-8")
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page()
    pg.goto(SRC.joinpath("propuesta.html").as_uri(), wait_until="networkidle")
    pg.evaluate("document.fonts.ready")
    pg.pdf(path=str(OUT / "propuesta-redisenio.pdf"), width="297mm", height="210mm", print_background=True,
           margin={"top": "0", "right": "0", "bottom": "0", "left": "0"})
    b.close()
print("PDF listo:", OUT / "propuesta-redisenio.pdf")
