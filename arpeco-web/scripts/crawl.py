"""Crawl grupo-arpeco.com with a real browser and record audit evidence as JSON."""
import json, sys, time
from urllib.parse import urljoin, urlparse, urldefrag
from playwright.sync_api import sync_playwright

START = "https://grupo-arpeco.com/"
HOST = urlparse(START).netloc.replace("www.", "")
OUT = sys.argv[1] if len(sys.argv) > 1 else "crawl.json"
SKIP_EXT = (".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".pdf", ".zip", ".mp4")

EXTRACT = """() => {
  const q = s => Array.from(document.querySelectorAll(s));
  const meta = n => (document.querySelector(`meta[name="${n}"]`)||{}).content || null;
  return {
    title: document.title,
    description: meta('description'),
    robots: meta('robots'),
    canonical: (document.querySelector('link[rel=canonical]')||{}).href || null,
    lang: document.documentElement.lang,
    viewport: meta('viewport'),
    og_title: (document.querySelector('meta[property="og:title"]')||{}).content || null,
    h1: q('h1').map(e => e.innerText.trim()),
    h2: q('h2').map(e => e.innerText.trim()).slice(0, 30),
    h3: q('h3').map(e => e.innerText.trim()).slice(0, 40),
    links: q('a[href]').map(a => ({href: a.href, text: a.innerText.trim().slice(0, 80)})),
    images: q('img').map(i => ({src: i.currentSrc || i.src, alt: i.getAttribute('alt'),
        w: i.naturalWidth, h: i.naturalHeight, dw: i.clientWidth})),
    forms: q('form').map(f => ({action: f.action, fields: Array.from(f.elements)
        .map(e => (e.type||e.tagName) + ':' + (e.name||'') + (e.labels && e.labels.length ? '[label]' : ''))})),
    tel: q('a[href^="tel:"]').map(a => a.href),
    mail: q('a[href^="mailto:"]').map(a => a.href),
    whatsapp: q('a[href*="wa.me"], a[href*="whatsapp"]').map(a => a.href),
    schema: q('script[type="application/ld+json"]').map(s => s.textContent.slice(0, 400)),
    text: document.body.innerText.slice(0, 6000),
    generator: meta('generator'),
    scripts: q('script[src]').map(s => s.src),
    docHeight: document.documentElement.scrollHeight,
  };
}"""

def norm(u):
    u = urldefrag(u)[0]
    return u.rstrip("/") + "/" if not urlparse(u).path.endswith(SKIP_EXT) else u

def main():
    seen, queue, pages, external = set(), [START], {}, set()
    with sync_playwright() as p:
        b = p.chromium.launch()
        ctx = b.new_context(viewport={"width": 1440, "height": 900})
        while queue and len(pages) < 60:
            url = queue.pop(0)
            if url in seen:
                continue
            seen.add(url)
            pg = ctx.new_page()
            reqs = []
            pg.on("response", lambda r: reqs.append((r.url, r.status, r.request.resource_type,
                                                       int(r.headers.get("content-length", 0) or 0))))
            t0 = time.time()
            try:
                resp = pg.goto(url, timeout=45000, wait_until="networkidle")
                status = resp.status if resp else None
            except Exception as e:
                pages[url] = {"error": str(e)[:200]}
                pg.close(); continue
            load = round(time.time() - t0, 2)
            data = pg.evaluate(EXTRACT)
            data.update(status=status, load_s=load, final_url=pg.url,
                        requests=len(reqs),
                        bytes=sum(r[3] for r in reqs),
                        failed=[r[:2] for r in reqs if r[1] >= 400],
                        img_bytes=sum(r[3] for r in reqs if r[2] == "image"))
            pages[url] = data
            for l in data["links"]:
                h = l["href"]
                if not h.startswith("http"):
                    continue
                if urlparse(h).netloc.replace("www.", "") == HOST:
                    if not urlparse(h).path.lower().endswith(SKIP_EXT) and "wp-" not in h and "?" not in h:
                        n = norm(h)
                        if n not in seen and n not in queue:
                            queue.append(n)
                else:
                    external.add(h)
            pg.close()
            print(status, load, url, flush=True)
        b.close()
    json.dump({"pages": pages, "external": sorted(external)}, open(OUT, "w"), ensure_ascii=False, indent=1)

main()
