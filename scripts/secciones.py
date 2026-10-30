"""Recortes de secciones comparables (1440 px de ancho) para el antes/después.

Antes: recortes por coordenadas de las capturas completas del sitio real (no hay selectores estables).
Después: captura del elemento en el prototipo servido en localhost:8765.
"""
from PIL import Image
from playwright.sync_api import sync_playwright

A, D = "capturas/antes", "capturas/despues"

# Antes: (archivo fuente, y0, y1, nombre de salida)
ANTES = [
    ("inicio-desktop.png", 1050, 2290, "seccion-servicios"),      # mosaicos de la home
    ("stands-desktop.png", 1200, 2420, "seccion-portfolio"),      # texto + galería de stands
    ("formulario-desktop.png", 1050, 2080, "seccion-contacto"),   # formulario actual
]
for src, y0, y1, out in ANTES:
    im = Image.open(f"{A}/{src}")
    im.crop((0, y0, 1440, min(y1, im.height))).save(f"{A}/{out}-desktop.png")
    print("antes", out)

# Después: (página, selector, nombre)
DESPUES = [
    ("index.html", "#servicios", "seccion-servicios"),
    ("proyectos.html", "main > section:nth-of-type(2)", "seccion-portfolio"),
    ("contacto.html", "main > section:nth-of-type(2)", "seccion-contacto"),
    ("index.html", ".seccion-oscura", "seccion-proceso"),
]
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    for page, sel, out in DESPUES:
        pg.goto(f"http://localhost:8765/{page}", wait_until="networkidle")
        pg.add_style_tag(content=".header, .demo-aviso { display: none !important; }")
        el = pg.locator(sel).first
        el.scroll_into_view_if_needed()
        pg.evaluate("Promise.all([...document.images].map(i => (i.loading='eager', i.decode().catch(()=>{}))))")
        pg.wait_for_timeout(800)
        el.screenshot(path=f"{D}/{out}-desktop.png")
        print("después", out)
    b.close()
