"""Take full-page and above-the-fold screenshots at fixed viewports.

usage: python3 shoot.py OUTDIR name=url [name=url ...]
Writes NAME-desktop.png (1440 wide, full page), NAME-desktop-fold.png (1440x900),
NAME-mobile.png (390 wide, full page), NAME-mobile-fold.png (390x844).
"""
import sys, time
from playwright.sync_api import sync_playwright

VIEWPORTS = {"desktop": dict(width=1440, height=900, dsf=1),
             "mobile": dict(width=390, height=844, dsf=2)}

def main():
    out, targets = sys.argv[1], [a.split("=", 1) for a in sys.argv[2:]]
    with sync_playwright() as p:
        b = p.chromium.launch()
        for vname, v in VIEWPORTS.items():
            ctx = b.new_context(viewport={"width": v["width"], "height": v["height"]},
                                device_scale_factor=v["dsf"], is_mobile=vname == "mobile",
                                has_touch=vname == "mobile")
            for name, url in targets:
                pg = ctx.new_page()
                pg.goto(url, timeout=60000, wait_until="networkidle")
                # Scroll through so lazy-loaded images render, then back to top.
                h = pg.evaluate("document.documentElement.scrollHeight")
                for y in range(0, h, 600):
                    pg.evaluate(f"window.scrollTo(0,{y})"); time.sleep(0.12)
                pg.wait_for_function("[...document.images].every(i => i.complete)", timeout=30000)
                pg.evaluate("window.scrollTo(0,0)"); time.sleep(1.2)
                pg.screenshot(path=f"{out}/{name}-{vname}-fold.png")
                pg.screenshot(path=f"{out}/{name}-{vname}.png", full_page=True)
                print("ok", name, vname, flush=True)
                pg.close()
            ctx.close()
        b.close()

main()
