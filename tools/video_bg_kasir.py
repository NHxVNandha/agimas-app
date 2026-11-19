"""Background video tutorial Saget Kasir (PNG) + logo lengkap Saget Kasir. Tanpa efek 3D.
Hasil di promo/video-bg/:
  logo-saget-kasir-full.png                     logo lengkap transparan (ikon toko Lucide/ISC + "Saget Kasir" + tagline)
  kasir-<n>-<nama>-<landscape|story>.png        latar saja (dipakai perekam video)
  pratinjau-kasir-<n>-<nama>-<fmt>.png          latar + tablet contoh (screenshot demo kasir asli)
  pilihan-background-kasir.png                  semua pilihan sekaligus
Tata letak (sama dengan tools/video/stage.html mode kasir):
  landscape 1920x1080: tablet x=60 y=126 1308x828; logo + narasi di panel kanan (x 1418..1870)
  story 1080x1920: logo atas, judul/narasi y 300..560, tablet x=27 y=590 1026x652, narasi bawah y 1300..1700
Jalankan: python tools/video_bg_kasir.py   (butuh Playwright + Chrome)."""
import pathlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "promo" / "video-bg"
FONT = (ROOT / "tools/fonts/Inter-latin-var.woff2").as_uri()
DEMO = (ROOT / "promo/kasir/kasir-lingkar-demo.html").as_uri()
LOGO = (OUT / "logo-saget-kasir-full.png").as_uri()
SHOT = (OUT / "_tablet.png").as_uri()
G1, G2, MINT, HI = "#173f2e", "#1f6b45", "#e4f4ea", "#8fe0b0"
# Ikon "store" dari Lucide (lisensi ISC)
STORE = ('<path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>'
         '<path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12'
         'a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7"/>')
LOGO_HTML = f'''<div id="logo" style="display:inline-flex;align-items:center;gap:56px;padding:20px">
<div style="width:300px;height:300px;border-radius:84px;background:{G1};display:grid;place-items:center;box-shadow:inset 0 -10px 0 rgba(0,0,0,.18)">
<svg viewBox="0 0 24 24" width="180" height="180" fill="none" stroke="{HI}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">{STORE}</svg></div>
<div><div style="font:800 190px/1 Inter;letter-spacing:-.045em;color:{G1}">Saget <span style="color:{G2}">Kasir</span></div>
<div style="font:600 64px/1 Inter;color:#4a6b5a;margin-top:26px;letter-spacing:-.01em">Kasir untuk kedai &amp; kafe</div></div></div>'''

FMT = {
    "landscape": dict(w=1920, h=1080, tab=(60, 126, 1308, 828), logo="left:1438px;top:64px;width:432px", panel=[(1398, 36, 492, 1008)]),
    "story": dict(w=1080, h=1920, tab=(27, 590, 1026, 652), logo="left:250px;top:130px;width:580px", panel=[(40, 90, 1000, 490), (40, 1278, 1000, 470)]),
}


def logo(f): return f'<img src="{LOGO}" style="position:absolute;z-index:4;{f["logo"]}">'


def panels(f, style):
    return "".join(f'<div style="position:absolute;left:{x}px;top:{y}px;width:{w}px;height:{h}px;{style}"></div>' for x, y, w, h in f["panel"])


def nota(f, w, h):
    """Mint dengan kertas nota putih bergerigi di area teks."""
    zig = "linear-gradient(135deg,#fff 12px,transparent 0) 0 100%/24px 24px repeat-x,linear-gradient(225deg,#fff 12px,transparent 0) 0 100%/24px 24px repeat-x"
    papers = "".join(
        f'''<div style="position:absolute;left:{x + 20}px;top:{y}px;width:{pw - 40}px;height:{ph}px;background:#fff;box-shadow:0 18px 40px -18px rgba(23,63,46,.35)">
<div style="position:absolute;left:0;right:0;bottom:-24px;height:24px;background:{zig}"></div>
<div style="position:absolute;left:28px;right:28px;bottom:34px;border-top:3px dashed #cfe3d6"></div></div>''' for x, y, pw, ph in f["panel"])
    dots = "radial-gradient(rgba(31,107,69,.18) 2px,transparent 2.5px) 0 0/28px 28px"
    return f'''<div class="bg" style="width:{w}px;height:{h}px;background:{dots},{MINT}">
<div style="position:absolute;left:-120px;bottom:-160px;width:520px;height:520px;border-radius:50%;background:{HI};opacity:.45"></div>
<div style="position:absolute;right:-90px;top:-110px;width:300px;height:300px;border-radius:50%;background:{G2};opacity:.12"></div>
{papers}{logo(f)}</div>'''


def pola(f, w, h):
    """Hijau tua dengan pola ikon cangkir & biji kopi, teks di kartu mint."""
    cup = '<path d="M10 2v2M14 2v2M6 2v2"/><path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1"/>'
    bean = '<ellipse cx="12" cy="12" rx="6" ry="9" transform="rotate(30 12 12)"/><path d="M9 5c4 4 2 10 6 14" transform="rotate(30 12 12)"/>'
    tile = (f'<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180" fill="none" stroke="{HI}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" opacity=".22">'
            f'<g transform="translate(20 20) scale(2)">{cup}</g><g transform="translate(110 100) scale(1.8)">{bean}</g><g transform="translate(115 15) scale(1.2)">{bean}</g><g transform="translate(25 115) scale(1.3)">{STORE}</g></svg>')
    import urllib.parse
    url = "data:image/svg+xml," + urllib.parse.quote(tile)
    return f'''<div class="bg" style="width:{w}px;height:{h}px;background:url('{url}') 0 0/180px 180px,linear-gradient(160deg,{G2},{G1} 60%,#0f2b1f)">
{panels(f, f"background:#f4fbf6;border-radius:36px;box-shadow:0 30px 60px -24px rgba(0,0,0,.5)")}{logo(f)}</div>'''


def geo(f, w, h):
    """Putih bersih dengan bentuk geometris datar (setengah lingkaran, pil, busur) hijau & mint."""
    tx, ty, tw, th = f["tab"]; story = h > w
    shapes = (f'''<div style="position:absolute;left:{tx - 140}px;top:{ty + th - 260}px;width:520px;height:520px;border-radius:50%;background:{HI}"></div>
<div style="position:absolute;left:{tx + tw - 600}px;top:{ty - 120}px;width:420px;height:210px;border-radius:210px 210px 0 0;background:{G2}"></div>
<div style="position:absolute;left:{tx + 40}px;top:{ty - 70}px;width:260px;height:56px;border-radius:99px;background:{MINT}"></div>
<div style="position:absolute;left:{tx + tw - 520}px;top:{ty + th + 40}px;width:200px;height:44px;border-radius:99px;background:{G2}"></div>
<div style="position:absolute;left:{tx + tw - 300}px;top:{ty + th + 40}px;width:44px;height:44px;border-radius:50%;background:#f2b33d"></div>
<div style="position:absolute;left:{w - 260}px;top:{h - 240}px;width:340px;height:340px;border-radius:50%;border:44px solid {MINT}"></div>
<div style="position:absolute;left:{w - 150}px;top:{(h - 520) if not story else 1180}px;width:36px;height:36px;border-radius:50%;background:#f2b33d"></div>
<div style="position:absolute;left:{70 if story else 1438}px;top:{(h - 90) if not story else 1220}px;width:120px;height:14px;border-radius:9px;background:{G1};opacity:.85"></div>''')
    return f'''<div class="bg" style="width:{w}px;height:{h}px;background:#ffffff">{shapes}{logo(f)}</div>'''


def kapur(f, w, h):
    """Papan menu kapur hijau dengan coretan kapur, teks di kartu kertas krem."""
    chalk = ('<svg style="position:absolute;inset:0" width="100%" height="100%" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">'
             + ("" if h > w else '<text x="120" y="1010" fill="rgba(255,255,255,.5)" stroke="none" font-family="Comic Sans MS, Segoe Print, cursive" font-size="44">menu hari ini ~</text>')
             + f'<g transform="translate({(w - 150) if h > w else 1250} {(h - 148) if h > w else 962}) scale(3.5)">' + '<path d="M10 2v2M14 2v2M6 2v2"/><path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1"/></g>'
             + '<path d="M40 40 h120 M40 40 v120" /><path d="M' + str(w - 40) + ' 40 h-120 M' + str(w - 40) + ' 40 v120"/>'
             + f'<path d="M40 {h - 40} h120 M40 {h - 40} v-120"/>'
             + f'<g transform="translate(70 {h - 330 if h > w else 60}) scale(2.2)" stroke-width="2"><path d="M12 2l2.4 6.9H22l-6 4.6 2.3 7L12 16l-6.3 4.5 2.3-7-6-4.6h7.6z"/></g></svg>')
    texture = ("radial-gradient(ellipse at 30% 20%,rgba(255,255,255,.08),transparent 55%),radial-gradient(ellipse at 80% 90%,rgba(255,255,255,.06),transparent 50%),"
               "repeating-linear-gradient(115deg,rgba(255,255,255,.015) 0 3px,transparent 3px 9px)")
    frame = f'<div style="position:absolute;inset:0;border:22px solid #8a5a33;box-shadow:inset 0 0 0 4px rgba(0,0,0,.25)"></div>'
    return f'''<div class="bg" style="width:{w}px;height:{h}px;background:{texture},#24463a">{chalk}{frame}
{panels(f, "background:#fbf7ee;border-radius:18px;box-shadow:0 22px 44px -20px rgba(0,0,0,.6);border:3px solid #eadfc8")}{logo(f)}</div>'''


CHOICES = [("kasir-1-nota", "Nota kertas di atas mint", nota), ("kasir-2-pola-kopi", "Pola kopi hijau tua", pola),
           ("kasir-3-geometris", "Geometris datar", geo), ("kasir-4-papan-kapur", "Papan menu kapur", kapur)]
CSS = f'''@font-face{{font-family:Inter;src:url({FONT}) format("woff2");font-weight:100 900}}
*{{box-sizing:border-box}}body{{margin:0;font-family:Inter,sans-serif}}.bg{{position:relative;overflow:hidden}}
.tab{{position:absolute;z-index:5;background:#0d1117;padding:14px;border-radius:34px;box-shadow:0 40px 90px -24px rgba(5,40,25,.55)}}
.tab img{{display:block;width:100%;height:100%;border-radius:20px;object-fit:cover}}
.sheet{{padding:40px;background:#e8efe9;color:{G1}}}.sheet h1{{margin:0 0 6px;font-size:30px}}.sheet small{{color:#4a6b5a;font-size:16px}}
.row{{display:flex;gap:24px;align-items:flex-start;margin-top:24px}}figure{{margin:0;display:flex;flex-direction:column;gap:10px}}
figcaption{{font-weight:700;font-size:18px}}figure img{{border-radius:12px;box-shadow:0 6px 20px rgba(0,0,0,.12);display:block}}'''


def page(pg, body, w, h):
    f = OUT / "_tmp.html"
    f.write_text(f"<!doctype html><html><head><meta charset='utf-8'><style>{CSS}</style></head><body style='width:{w}px'>{body}</body></html>", encoding="utf8")
    pg.set_viewport_size({"width": w, "height": h}); pg.goto(f.as_uri()); pg.evaluate("document.fonts.ready")
    pg.wait_for_function("[...document.images].every(i => i.complete && i.naturalWidth > 0)")
    assert pg.evaluate("document.fonts.load('800 20px Inter').then(f => f.length > 0)"), "huruf Inter tidak termuat"


def main():
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=r"C:\Program Files\Google\Chrome\Application\chrome.exe")
        pg = b.new_page()
        # 1) logo lengkap transparan (±1500 px lebar)
        lp = b.new_page(device_scale_factor=1)
        page(lp, LOGO_HTML, 1700, 400)
        lp.locator("#logo").screenshot(path=str(OUT / "logo-saget-kasir-full.png"), omit_background=True); lp.close()
        # 2) tablet contoh: demo kasir asli di layar Jual
        tp = b.new_page(viewport={"width": 1280, "height": 800})
        tp.on("dialog", lambda d: d.accept())
        tp.goto(DEMO); tp.wait_for_selector("#dForm[open]"); tp.click("#fOk"); tp.click('.tabs [data-v="jual"]'); tp.wait_for_timeout(700)
        tp.screenshot(path=str(OUT / "_tablet.png")); tp.close()
        # 3) latar + pratinjau
        for key, name, make in CHOICES:
            for fk, f in FMT.items():
                w, h = f["w"], f["h"]; bg = make(f, w, h)
                page(pg, bg, w, h); pg.locator(".bg").screenshot(path=str(OUT / f"{key}-{fk}.png"))
                x, y, tw, th = f["tab"]
                page(pg, bg[:-6] + f'<div class="tab" style="left:{x}px;top:{y}px;width:{tw}px;height:{th}px"><img src="{SHOT}"></div></div>', w, h)
                pg.locator(".bg").screenshot(path=str(OUT / f"pratinjau-{key}-{fk}.png"))
                print("OK", key, fk)
        cells = "".join(f'<figure><img src="{(OUT / f"pratinjau-{k}-landscape.png").as_uri()}" width="420"><figcaption>{i + 1}. {n}</figcaption></figure>' for i, (k, n, _) in enumerate(CHOICES))
        cells2 = "".join(f'<figure><img src="{(OUT / f"pratinjau-{k}-story.png").as_uri()}" width="236"><figcaption>{i + 1}. {n} (Story)</figcaption></figure>' for i, (k, n, _) in enumerate(CHOICES))
        page(pg, f"<div class='sheet'><h1>Background video Saget Kasir: pilih satu</h1><small>Tablet hanya contoh posisi. Teks langkah dan narasi nanti tampil di area kosong (kartu / kertas).</small><div class='row'>{cells}</div><div class='row'>{cells2}</div></div>", 1840, 1000)
        pg.locator(".sheet").screenshot(path=str(OUT / "pilihan-background-kasir.png")); print("OK pilihan-background-kasir.png")
        for t in ("_tmp.html", "_tablet.png"): (OUT / t).unlink()
        b.close()


if __name__ == "__main__":
    main()
