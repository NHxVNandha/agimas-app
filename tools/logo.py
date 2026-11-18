"""Logo kolaborasi Agi Mas x Lingkar Kopi, beberapa pilihan.
Hasil: promo/logo/<pilihan>.png (latar transparan, 2x) + pilihan-logo.png (semua pilihan di latar terang & gelap).
Tanda "Lingkar Kopi" (lingkaran + titik) adalah buatan sementara; ganti dengan logo asli Lingkar Kopi bila sudah ada.
Jalankan: python tools/logo.py   (butuh Playwright + Chrome; huruf & logo dari web/)."""
import pathlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "promo" / "logo"
FONT = (ROOT / "web/fonts/PlusJakartaSans-1.woff2").as_uri()
LOGO = (ROOT / "web/logo.png").as_uri()
INK, BLUE, COFFEE, CARAMEL, CREAM = "#0b2545", "#1e7be6", "#2b1a10", "#f5b86a", "#fbf1e4"
F = "font-family:PJS;font-weight:800"


def cup(x, y, s, body, coffee, steam):
    """Cangkir vektor di (x, y) selebar s (kotak s x s)."""
    k = s / 100
    return f'''<g transform="translate({x} {y}) scale({k})">
<path d="M38 22c-4 5 4 8 0 13M50 18c-4 6 4 9 0 15M62 22c-4 5 4 8 0 13" stroke="{steam}" stroke-width="4" stroke-linecap="round" fill="none"/>
<path d="M22 44h52v13c0 15-11 26-26 26S22 72 22 57z" fill="{body}"/>
<path d="M74 49h4a9 9 0 0 1 0 18h-6" stroke="{body}" stroke-width="6" stroke-linecap="round" fill="none"/>
<ellipse cx="48" cy="44" rx="26" ry="6" fill="{coffee}"/>
<ellipse cx="50" cy="88" rx="34" ry="5" fill="{body}" opacity=".3"/></g>'''


def ring(cx, cy, r, c, w=None):
    w = w or r * 0.32
    return f'<circle cx="{cx}" cy="{cy}" r="{r - w / 2}" stroke="{c}" stroke-width="{w}" fill="none"/><circle cx="{cx}" cy="{cy}" r="{r * 0.32}" fill="{c}"/>'


def agimas(x, y, size, dark=False):
    """Tulisan Agimas seperti logo (Agi gelap + mas biru)."""
    return f'<text x="{x}" y="{y}" style="{F};font-size:{size}px;letter-spacing:-.02em"><tspan fill="{"#ffffff" if dark else INK}">Agi</tspan><tspan fill="{BLUE}">mas</tspan></text>'


# Tiap pilihan: (lebar, tinggi, svg isi). Latar transparan.
def opt1(dark):   # lockup sejajar dengan logo Agi Mas asli
    return 1200, 360, f'''<rect x="20" y="70" width="440" height="220" rx="44" fill="#fff"{' ' if dark else ' stroke="#e3ebf5" stroke-width="3"'}/>
<image href="{LOGO}" x="60" y="100" width="360" height="141"/>
<text x="540" y="222" style="{F};font-size:86px" fill="{CARAMEL if dark else "#9a5b1e"}">×</text>
{ring(700, 180, 64, CARAMEL if dark else "#9a5b1e")}
<text x="788" y="168" style="{F};font-size:66px;letter-spacing:-.02em" fill="{CREAM if dark else COFFEE}">Lingkar</text>
<text x="788" y="236" style="{F};font-size:66px;letter-spacing:-.02em" fill="{CARAMEL if dark else "#9a5b1e"}">Kopi</text>'''


def opt2(dark):   # lencana bulat
    bg, ink = ("#3a2414", CREAM) if dark else (COFFEE, CREAM)
    return 600, 600, f'''<defs><path id="tp" d="M 300 300 m -205 0 a 205 205 0 1 1 410 0"/><path id="bp" d="M 300 300 m -228 0 a 228 228 0 0 0 456 0"/></defs>
<circle cx="300" cy="300" r="290" fill="{bg}"/><circle cx="300" cy="300" r="268" fill="none" stroke="{CARAMEL}" stroke-width="4"/>
<circle cx="300" cy="300" r="160" fill="none" stroke="{CARAMEL}" stroke-width="3" stroke-dasharray="2 10" stroke-linecap="round"/>
<text style="{F};font-size:40px;letter-spacing:.14em" fill="{ink}"><textPath href="#tp" startOffset="50%" text-anchor="middle">AGI MAS × LINGKAR KOPI</textPath></text>
<text style="{F};font-size:30px;letter-spacing:.3em" fill="{CARAMEL}"><textPath href="#bp" startOffset="50%" text-anchor="middle">· MADIUN ·</textPath></text>
{cup(190, 180, 220, CARAMEL, "#6b3d1d", CREAM)}'''


def opt3(dark):   # cangkir ngebut
    ink = CREAM if dark else INK
    lines = "".join(f'<path d="M{x1} {y}h{w}" stroke="{BLUE}" stroke-width="16" stroke-linecap="round"/>' for x1, y, w in [(60, 240, 110), (30, 290, 140), (80, 340, 90)])
    return 600, 600, f'''{lines}{cup(170, 120, 330, CARAMEL if dark else "#8a5426", "#3a2414" if dark else "#f5b86a", BLUE)}
<text x="300" y="520" text-anchor="middle" style="{F};font-size:46px;letter-spacing:-.02em" fill="{ink}">Agi Mas <tspan fill="{CARAMEL if dark else "#9a5b1e"}">×</tspan> Lingkar Kopi</text>'''


def opt4(dark):   # monogram dua lingkaran berkait
    ink = CREAM if dark else INK
    return 600, 600, f'''<circle cx="225" cy="250" r="140" fill="none" stroke="{BLUE}" stroke-width="40"/>
<circle cx="375" cy="250" r="140" fill="none" stroke="{CARAMEL}" stroke-width="40"/>
<path d="M 300 132 A 140 140 0 0 1 365 250" fill="none" stroke="{BLUE}" stroke-width="40"/>
<text x="200" y="285" text-anchor="middle" style="{F};font-size:110px" fill="{BLUE}">A</text>
<text x="400" y="285" text-anchor="middle" style="{F};font-size:110px" fill="{CARAMEL if dark else "#b0672a"}">L</text>
<text x="300" y="490" text-anchor="middle" style="{F};font-size:44px;letter-spacing:-.01em" fill="{ink}">Agi Mas × Lingkar Kopi</text>
<text x="300" y="540" text-anchor="middle" style="font-family:PJS;font-weight:600;font-size:24px;letter-spacing:.3em" fill="{CARAMEL if dark else "#9a5b1e"}">KOLABORASI</text>'''


def opt5(dark):   # stempel
    c = CARAMEL if dark else "#8a5426"
    ink = CREAM if dark else COFFEE
    return 900, 420, f'''<rect x="20" y="20" width="860" height="380" rx="40" fill="none" stroke="{c}" stroke-width="10"/>
<rect x="44" y="44" width="812" height="332" rx="24" fill="none" stroke="{c}" stroke-width="3" stroke-dasharray="14 10"/>
{cup(80, 110, 200, c, "#3a2414" if dark else "#f5b86a", c)}
<text x="310" y="150" style="{F};font-size:30px;letter-spacing:.32em" fill="{c}">KOPI DARI</text>
<text x="306" y="228" style="{F};font-size:84px;letter-spacing:-.03em" fill="{ink}">Lingkar Kopi</text>
<text x="310" y="300" style="{F};font-size:30px;letter-spacing:.32em" fill="{c}">DIANTAR <tspan fill="{BLUE if not dark else "#7ab8ff"}">AGI MAS</tspan></text>'''


def opt6(dark):   # pin lokasi
    ink = CREAM if dark else INK
    return 600, 600, f'''<path d="M300 40c-104 0-180 78-180 176 0 128 180 262 180 262s180-134 180-262C480 118 404 40 300 40z" fill="{BLUE}"/>
<circle cx="300" cy="214" r="128" fill="{CREAM}"/>
{cup(206, 116, 190, "#8a5426", CARAMEL, "#8a5426")}
<text x="300" y="562" text-anchor="middle" style="{F};font-size:46px;letter-spacing:-.02em" fill="{ink}">Agi Mas <tspan fill="{CARAMEL if dark else "#9a5b1e"}">×</tspan> Lingkar Kopi</text>'''


OPTIONS = [("1-lockup-sejajar", "Lockup sejajar", opt1), ("2-lencana-bulat", "Lencana bulat", opt2), ("3-cangkir-ngebut", "Cangkir ngebut", opt3),
           ("4-monogram", "Monogram A × L", opt4), ("5-stempel", "Stempel kedai", opt5), ("6-pin-lokasi", "Pin lokasi", opt6)]


def svg(w, h, body):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">{body}</svg>'


CSS = f"""@font-face {{ font-family: 'PJS'; font-weight: 200 800; src: url('{FONT}') format('woff2'); }}
html, body {{ margin: 0; font-family: 'PJS', sans-serif; }}
.one {{ display: inline-block; line-height: 0; }}
.sheet {{ padding: 32px; background: #e9eef5; width: max-content; }}
.sheet h1 {{ margin: 0 0 4px; font-size: 22px; color: #0b2545; }} .sheet > small {{ display: block; margin-bottom: 22px; font-size: 13px; color: #526781; }}
.grid {{ display: grid; grid-template-columns: repeat(3, 420px); gap: 22px; }}
figure {{ margin: 0; background: #fff; border-radius: 20px; overflow: hidden; }}
.pair {{ display: grid; grid-template-columns: 1fr 1fr; }}
.pair div {{ height: 190px; display: grid; place-items: center; padding: 14px; box-sizing: border-box; }}
.pair div svg {{ max-width: 100%; max-height: 100%; width: auto; height: auto; }}
.pair .dk {{ background: #24150c; }} .pair .lt {{ background: #fbf7f1; }}
figcaption {{ padding: 12px 16px; font-size: 14px; font-weight: 800; color: #0b2545; }}
"""


def show(pg, body):
    f = OUT / "_tmp.html"
    f.write_text(f"<!doctype html><html lang='id'><head><meta charset='utf-8'><style>{CSS}</style></head><body>{body}</body></html>", encoding="utf8")
    pg.goto(f.as_uri()); pg.evaluate("document.fonts.ready")
    pg.wait_for_function("[...document.querySelectorAll('image')].length === 0 || document.readyState === 'complete'")
    assert pg.evaluate("document.fonts.check('800 20px PJS')"), "huruf tidak termuat"


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=r"C:\Program Files\Google\Chrome\Application\chrome.exe")
        pg = b.new_page(device_scale_factor=2)
        for key, name, make in OPTIONS:
            for dark in (False, True):
                w, h, body = make(dark)
                pg.set_viewport_size({"width": w, "height": h})
                show(pg, f'<div class="one">{svg(w, h, body)}</div>'); pg.wait_for_timeout(150)
                pg.locator(".one").screenshot(path=str(OUT / f"{key}{'-latar-gelap' if dark else ''}.png"), omit_background=True)
            print("OK", key)
        cells = "".join(f'<figure><div class="pair"><div class="lt">{svg(*make(False))}</div><div class="dk">{svg(*make(True))}</div></div><figcaption>{i + 1}. {name}</figcaption></figure>'
                        for i, (key, name, make) in enumerate(OPTIONS))
        pg.set_viewport_size({"width": 3 * 420 + 2 * 22 + 64, "height": 900})
        show(pg, f"<div class='sheet'><h1>Logo kolaborasi Agi Mas × Lingkar Kopi: pilih satu</h1><small>Kiri: di latar terang · kanan: di latar gelap. Tanda Lingkar Kopi masih sementara, menunggu logo asli.</small><div class='grid'>{cells}</div></div>")
        pg.wait_for_timeout(300)
        pg.locator(".sheet").screenshot(path=str(OUT / "pilihan-logo.png"))
        (OUT / "_tmp.html").unlink()
        print("OK pilihan-logo")


if __name__ == "__main__":
    main()
