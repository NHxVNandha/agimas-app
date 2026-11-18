"""Flyer kolaborasi Agi Mas x Lingkar Kopi, beberapa ukuran -> promo/flyer/ (PNG untuk media sosial, PDF + PNG 300 dpi untuk cetak A5).
Jalankan: python tools/flyer.py   (butuh Playwright + Chrome; huruf & logo diambil dari web/)."""
import pathlib, subprocess, json
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "promo" / "flyer"
URL = "https://solusiagimas.netlify.app"

# QR asli ke situs Agi Mas (pakai qrcode.js yang sama dengan aplikasi)
QR = subprocess.run(["node", "-e", """
const fs=require('fs');const src=fs.readFileSync('web/vendor/qrcode.js','utf8');const m={exports:{}};
new Function('module','exports',src+';if(typeof qrcode!=="undefined")module.exports=qrcode;')(m,m.exports);
const q=m.exports(0,'M');q.addData(process.argv[1]);q.make();const n=q.getModuleCount();let d='';
for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(q.isDark(r,c))d+='M'+c+' '+r+'h1v1h-1z';console.log(JSON.stringify({n,d}));""", URL],
    cwd=ROOT, capture_output=True, text=True, check=True).stdout
QR = json.loads(QR)

# Ukuran: lebar, tinggi, dan skala elemen (px). "light" = versi cetak (latar terang, hemat tinta).
SIZES = {
    "feed-4x5":   dict(w=1080, h=1350, pad=72, gap=30, logo=52, h1=100, sub=32, feat=32, ic=72, qr=200, cta=40, small=23, rings=760, lines=3),
    "story-9x16": dict(w=1080, h=1920, pad=96, gap=44, logo=60, h1=124, sub=38, feat=38, ic=88, qr=260, cta=48, small=27, rings=980, lines=3),
    "square-1x1": dict(w=1080, h=1080, pad=64, gap=24, logo=46, h1=88,  sub=0,  feat=28, ic=60, qr=170, cta=34, small=21, rings=640, lines=2),
    "a5-cetak":   dict(w=559,  h=794,  pad=40, gap=16, logo=30, h1=52,  sub=16, feat=16, ic=38, qr=118, cta=20, small=12.5, rings=420, lines=3, light=True),
}

ICONS = {
    "menu": '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
    "clock": '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    "qr": '<path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3h-3zM20 17v4h-3M17 20h.01"/>',
}
FEATS = [("menu", "Pilih menu &amp; jumlah langsung di aplikasi"), ("clock", "Stok &amp; jam buka selalu terbaru"), ("qr", "Bayar tunai ke driver atau QRIS")]


def page(s):
    light = s.get("light")
    bg, ink, soft = ("#fbf3e8", "#24150c", "#5a3a22") if light else ("#24150c", "#fbf3e8", "#e8d6c0")
    acc, acc_ink = "#f5b86a", "#24150c"
    acc_text = "#9a5b1e" if light else acc           # teks berwarna karamel: lebih gelap di kertas terang agar terbaca
    blue = "#1e6fd0" if light else "#7ab8ff"
    title = "Lingkar Kopi<br>kini diantar<br>" if s["lines"] == 3 else "Lingkar Kopi kini<br>diantar "
    feats = "".join(
        f'<div class="feat"><span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="{acc_text}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{ICONS[k]}</svg></span><span>{t}</span></div>'
        for k, t in FEATS)
    r = s["rings"]
    return f"""<!doctype html><html lang="id"><head><meta charset="utf-8"><title>Agi Mas x Lingkar Kopi</title>
<style>
@font-face {{ font-family: 'PJS'; font-weight: 200 800; src: url('{(ROOT / "web/fonts/PlusJakartaSans-1.woff2").as_uri()}') format('woff2'); }}
html, body {{ margin: 0; background: {bg}; }}
.f {{ position: relative; width: {s['w']}px; height: {s['h']}px; overflow: hidden; box-sizing: border-box; padding: {s['pad']}px; background: {bg}; color: {ink};
  font-family: 'PJS', sans-serif; display: flex; flex-direction: column; gap: {s['gap']}px; }}
.rings {{ position: absolute; right: {-r * 0.3}px; top: {-r * 0.28}px; width: {r}px; height: {r}px; }}
.top {{ position: relative; display: flex; align-items: center; gap: {s['logo'] * 0.42}px; }}
.chip {{ display: inline-flex; padding: {s['logo'] * 0.27}px {s['logo'] * 0.46}px; border-radius: 999px; background: #fff; {"box-shadow: 0 0 0 1.5px #e6d5c1;" if light else ""} }}
.chip img {{ height: {s['logo']}px; display: block; }}
.x {{ font-size: {s['logo'] * 0.77}px; font-weight: 700; color: {acc_text}; }}
.lk {{ display: inline-flex; align-items: center; gap: {s['logo'] * 0.27}px; font-size: {s['logo'] * 0.77}px; font-weight: 800; color: {acc_text}; }}
.lk svg {{ width: {s['logo']}px; height: {s['logo']}px; }}
.kick {{ position: relative; align-self: flex-start; padding: {s['small'] * 0.42}px {s['small']}px; border-radius: 999px; background: rgba(245,184,106,{.30 if light else .16});
  color: {acc_ink if light else acc}; font-size: {s['small'] * 1.05}px; font-weight: 800; letter-spacing: .14em; }}
h1 {{ position: relative; margin: 0; font-size: {s['h1']}px; line-height: 1.02; font-weight: 800; letter-spacing: -.035em; }}
h1 b {{ color: {blue}; font-weight: 800; }}
.sub {{ position: relative; margin: 0; max-width: 82%; font-size: {s['sub']}px; line-height: 1.4; color: {soft}; }}
.feats {{ position: relative; display: flex; flex-direction: column; gap: {s['ic'] * 0.22}px; }}
.feat {{ display: flex; align-items: center; gap: {s['ic'] * 0.3}px; font-size: {s['feat']}px; font-weight: 700; }}
.feat .ic {{ flex: none; width: {s['ic']}px; height: {s['ic']}px; border-radius: {s['ic'] * 0.3}px; background: rgba(245,184,106,{.28 if light else .14}); display: grid; place-items: center; }}
.feat svg {{ width: {s['ic'] * 0.5}px; height: {s['ic'] * 0.5}px; }}
.grow {{ flex-grow: 1; }}
.cta {{ position: relative; display: flex; align-items: center; gap: {s['qr'] * 0.16}px; padding: {s['qr'] * 0.14}px; border-radius: {s['qr'] * 0.18}px; background: {acc}; color: {acc_ink}; }}
.qr {{ flex: none; width: {s['qr']}px; height: {s['qr']}px; box-sizing: border-box; padding: {s['qr'] * 0.06}px; border-radius: {s['qr'] * 0.1}px; background: #fff; }}
.qr svg {{ width: 100%; height: 100%; display: block; }}
.ct {{ display: flex; flex-direction: column; gap: {s['cta'] * 0.25}px; min-width: 0; }}
.ct b {{ font-size: {s['cta']}px; line-height: 1.1; font-weight: 800; letter-spacing: -.02em; }}
.ct .url {{ font-size: {s['cta'] * 0.7}px; font-weight: 700; }}
.ct small {{ font-size: {s['small']}px; line-height: 1.4; font-weight: 600; color: #4a2c16; }}
</style></head><body>
<div class="f">
<svg class="rings" viewBox="0 0 760 760" fill="none" aria-hidden="true">
<circle cx="380" cy="380" r="370" stroke="#f5b86a" stroke-opacity="{.22 if light else .10}" stroke-width="2"/>
<circle cx="380" cy="380" r="290" stroke="#f5b86a" stroke-opacity="{.32 if light else .16}" stroke-width="2"/>
<circle cx="380" cy="380" r="210" stroke="#f5b86a" stroke-opacity="{.45 if light else .24}" stroke-width="2"/>
<circle cx="380" cy="380" r="130" fill="#f5b86a" fill-opacity="{.22 if light else .10}"/>
</svg>
<div class="top"><span class="chip"><img src="{(ROOT / 'web/logo.png').as_uri()}" alt="Agi Mas"></span><span class="x">×</span>
<span class="lk"><svg viewBox="0 0 54 54" fill="none" aria-hidden="true"><circle cx="27" cy="27" r="22" stroke="{acc_text}" stroke-width="6"/><circle cx="27" cy="27" r="7" fill="{acc_text}"/></svg>Lingkar Kopi</span></div>
<span class="kick">KOLABORASI BARU</span>
<h1>{title}<b>Agi Mas.</b></h1>
{f'<p class="sub">Pesan kopi Lingkar Kopi langsung dari aplikasi Agi Mas. Driver kami antar sampai ke tempatmu di Madiun.</p>' if s['sub'] else ''}
<div class="feats">{feats}</div>
<div class="grow"></div>
<div class="cta"><div class="qr"><svg viewBox="0 0 {QR['n']} {QR['n']}" shape-rendering="crispEdges" role="img" aria-label="QR ke {URL}"><path fill="#24150c" d="{QR['d']}"/></svg></div>
<div class="ct"><b>Scan &amp; unduh aplikasi Agi Mas</b><span class="url">solusiagimas.netlify.app</span>
<small>Ambil di Jl. Sri Rejeki, Sukosari, Madiun · cek jam buka di aplikasi<br>Tanya admin: 0878-1808-3068</small></div></div>
</div></body></html>"""


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=r"C:\Program Files\Google\Chrome\Application\chrome.exe")
        for name, s in SIZES.items():
            html = OUT / f"{name}.html"; html.write_text(page(s), encoding="utf8")
            dsf = 300 / 96 if s.get("light") else 1          # cetak: 300 dpi; media sosial: ukuran pas
            pg = b.new_page(viewport={"width": s["w"], "height": s["h"]}, device_scale_factor=dsf)
            pg.goto(html.as_uri()); pg.evaluate("document.fonts.ready")
            over = pg.evaluate("(() => { const f = document.querySelector('.f'); return [...f.children].some(e => !e.classList.contains('rings') && e.getBoundingClientRect().bottom > f.clientHeight - 1); })()")
            assert not over, name + ": isi melewati batas bawah"
            pg.screenshot(path=str(OUT / f"{name}.png"), clip={"x": 0, "y": 0, "width": s["w"], "height": s["h"]})
            if s.get("light"):
                pg.pdf(path=str(OUT / f"{name}.pdf"), width=f"{s['w']}px", height=f"{s['h']}px", print_background=True, page_ranges="1")
            pg.close(); html.unlink()
            print("OK", name)


if __name__ == "__main__":
    main()
