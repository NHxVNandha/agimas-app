# Render materi promosi dari assets/promo/src/*.html ke PNG ukuran pas.
# Pakai: python tools/render-promo.py   (butuh Playwright + Chrome)
import os, threading, functools, http.server
from playwright.sync_api import sync_playwright
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
H = functools.partial(http.server.SimpleHTTPRequestHandler, directory=root); H.log_message = lambda *a: None
srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), H); threading.Thread(target=srv.serve_forever, daemon=True).start()
B = "http://127.0.0.1:%d/assets/promo/src/" % srv.server_address[1]
JOBS = [("story.html", 1080, 1920, "agimas-story-ig.png"), ("thumbnail.html", 1280, 720, "agimas-thumbnail-youtube.png")]
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=r"C:\Program Files\Google\Chrome\Application\chrome.exe")
    for src, w, h, out in JOBS:
        pg = b.new_page(viewport={"width": w, "height": h}, device_scale_factor=1)
        pg.goto(B + src); pg.evaluate("document.fonts.ready"); pg.wait_for_timeout(500)
        path = os.path.join(root, "assets", "promo", out); pg.screenshot(path=path); pg.close()
        print(out, w, "x", h, f"{os.path.getsize(path)/1024:.0f} KB")
    b.close()
srv.shutdown()
