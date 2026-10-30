"""Pruebas funcionales del sitio servido en localhost:8765."""
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright

BASE = "http://localhost:8765/"
PAGES = ["index.html", "stands.html", "locales.html", "proyectos.html", "nosotros.html", "contacto.html"]
fails = []

def check(cond, msg):
    print(("PASS " if cond else "FAIL ") + msg)
    if not cond:
        fails.append(msg)

with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={"width": 1440, "height": 900})
    pg = ctx.new_page()
    errors = []
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.on("response", lambda r: r.status >= 400 and errors.append(f"{r.status} {r.url}"))

    hrefs = set()
    for name in PAGES:
        pg.goto(BASE + name, wait_until="networkidle")
        check(pg.locator("h1").count() == 1, f"{name}: un único H1")
        check(bool(pg.locator('meta[name=description]').get_attribute("content")), f"{name}: meta description")
        check(pg.locator('meta[name=robots][content*=noindex], .demo-aviso, .a-completar').count() == 0,
              f"{name}: sin avisos o bloqueos de prototipo")
        no_alt = pg.evaluate("[...document.images].filter(i => !i.getAttribute('alt')).length")
        check(no_alt == 0, f"{name}: todas las imágenes con alt ({no_alt} sin alt)")
        dead = pg.evaluate("[...document.querySelectorAll('a')].filter(a => !a.getAttribute('href') || a.getAttribute('href') === '#').length")
        check(dead == 0, f"{name}: sin enlaces vacíos o '#'")
        for h in pg.evaluate("[...document.querySelectorAll('a[href]')].map(a => a.href)"):
            hrefs.add(h)

    # Every internal link resolves (and anchors exist)
    for h in sorted(hrefs):
        u = urlparse(h)
        if u.netloc != "localhost:8765":
            continue
        r = pg.goto(h, wait_until="load")
        ok = (r is None and pg.url == h) or (r is not None and r.status == 200)
        if u.fragment:
            ok = ok and pg.locator(f"#{u.fragment}").count() == 1
        check(ok, f"enlace interno {u.path}{'?' + u.query if u.query else ''}{'#' + u.fragment if u.fragment else ''}")
    ext = sorted(h for h in hrefs if urlparse(h).netloc not in ("localhost:8765",))
    print("Externos (no se navegan):", ext)
    check(all(e.startswith(("https://wa.me/5493515639656", "https://www.instagram.com/grupo_arpeco", "https://www.facebook.com/GrupoArpeco")) for e in ext),
          "externos solo WhatsApp/Instagram/Facebook del cliente")

    # Filters
    pg.goto(BASE + "proyectos.html", wait_until="networkidle")
    total = pg.locator(".proyecto:visible").count()
    pg.click("button[data-f=stands]")
    n_st = pg.locator(".proyecto:visible").count()
    check(0 < n_st < total and pg.locator(".proyecto:visible:not([data-cat=stands])").count() == 0, f"filtro stands ({n_st}/{total})")
    check(pg.get_attribute("button[data-f=stands]", "aria-pressed") == "true", "filtro marca aria-pressed")
    pg.goto(BASE + "proyectos.html?f=residencial", wait_until="networkidle")
    check(pg.locator(".proyecto:visible").count() == 2, "parámetro ?f=residencial filtra al cargar")

    # Form
    pg.goto(BASE + "contacto.html?tipo=local", wait_until="networkidle")
    check(pg.is_checked("#t-local"), "?tipo=local preselecciona Local comercial")
    check(not pg.is_visible("#evento"), "campo Feria oculto si no es stand")
    pg.click("button[type=submit]")
    check(pg.is_visible("#e-nombre") and pg.is_visible("#e-email"), "envío vacío muestra errores")
    check(pg.evaluate("document.activeElement.id") == "nombre", "foco va al primer error")
    pg.fill("#nombre", "Prueba QA"); pg.fill("#email", "no-es-email"); pg.fill("#tel", "3510000000")
    pg.click("button[type=submit]")
    check(pg.is_visible("#e-email") and not pg.is_visible("#confirmacion"), "email inválido bloquea envío")
    pg.fill("#email", "qa@ejemplo.com")
    pg.evaluate("window.__originalOpen = window.open; window.open = () => null")  # simula bloqueador de ventanas
    pg.click("button[type=submit]")
    check(pg.is_visible("#confirmacion") and not pg.is_visible("#form-presupuesto"), "datos válidos muestran enlace a WhatsApp")
    href = pg.get_attribute("#abrir-whatsapp", "href")
    check(href.startswith("https://wa.me/5493515639656?text=") and "qa%40ejemplo.com" in href and "Prueba%20QA" in href,
          "WhatsApp recibe los datos de la consulta")
    check("enviado" not in pg.locator("#confirmacion").inner_text().lower(), "sin falsa confirmación de envío")
    pg.click("#otro")
    check(pg.is_visible("#form-presupuesto") and pg.input_value("#nombre") == "Prueba QA", "Editar datos conserva el formulario")
    pg.evaluate("window.open = window.__originalOpen")
    ctx.route("https://wa.me/**", lambda route: route.fulfill(status=200, body="ok"))
    with pg.expect_popup() as popup_info:
        pg.click("button[type=submit]")
    popup = popup_info.value
    check(popup.url.startswith("https://wa.me/5493515639656?text="), "envío abre WhatsApp en otra pestaña")
    popup.close()

    check(not errors, f"sin errores JS ni recursos 4xx/5xx {errors[:3]}")

    # Mobile
    m = b.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True).new_page()
    m.goto(BASE + "index.html", wait_until="networkidle")
    check(not m.is_visible("#nav a[href='stands.html']"), "móvil: menú cerrado al cargar")
    m.click(".menu-btn")
    check(m.is_visible("#nav a[href='stands.html']") and m.get_attribute(".menu-btn", "aria-expanded") == "true", "móvil: menú abre")
    m.click("#nav a[href='proyectos.html']"); m.wait_for_load_state()
    check(m.url.endswith("proyectos.html"), "móvil: navegación desde menú")
    for name in PAGES:
        m.goto(BASE + name, wait_until="networkidle")
        sw = m.evaluate("document.documentElement.scrollWidth")
        check(sw <= 390, f"móvil {name}: sin scroll horizontal ({sw}px)")
    b.close()

print(f"\n{len(fails)} fallas")
