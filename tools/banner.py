"""Banner kolaborasi Agi Mas x Lingkar Kopi untuk ditampilkan DI BAWAH kartu .hero Beranda.
Lebar sama dengan .hero (358, sudut 24px), lebih pendek (124) tapi komposisinya sengaja berbeda (tanpa motor/logo pojok) agar tidak terlihat dobel.
Hasil: promo/banner/<pilihan>.png (3x = 1074x372) + pilihan-banner.png (tiap banner di bawah hero asli, untuk dipilih).
Jalankan: python tools/banner.py   (butuh Playwright + Chrome; huruf & gambar dari web/)."""
import pathlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "promo" / "banner"
W, H = 358, 190            # kartu .hero di atasnya
BH = 124                     # tinggi banner: lebih pendek dari hero
FONT = (ROOT / "web/fonts/PlusJakartaSans-1.woff2").as_uri()
LOGO = (ROOT / "web/logo.png").as_uri()
MOTOR = (ROOT / "web/splash-motor.png").as_uri()
ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'


def cup(body, coffee, steam, size):
    """Ilustrasi cangkir kopi (vektor): tatakan, cangkir, permukaan kopi, uap."""
    return f'''<svg width="{size}" height="{size}" viewBox="0 0 100 100" fill="none" aria-hidden="true">
<path d="M38 22c-4 5 4 8 0 13M50 18c-4 6 4 9 0 15M62 22c-4 5 4 8 0 13" stroke="{steam}" stroke-width="3" stroke-linecap="round"/>
<ellipse cx="50" cy="83" rx="36" ry="7" fill="{body}" opacity=".35"/>
<path d="M22 44h52v13c0 15-11 26-26 26S22 72 22 57z" fill="{body}"/>
<path d="M74 49h4a9 9 0 0 1 0 18h-6" stroke="{body}" stroke-width="5" stroke-linecap="round"/>
<ellipse cx="48" cy="44" rx="26" ry="6" fill="{coffee}"/>
<path d="M40 44c4-3 12-3 16 0" stroke="{steam}" stroke-width="2" stroke-linecap="round" opacity=".7"/>
</svg>'''


def ring_mark(c, s=12):
    return f'<svg width="{s}" height="{s}" viewBox="0 0 54 54" fill="none" aria-hidden="true"><circle cx="27" cy="27" r="21" stroke="{c}" stroke-width="7"/><circle cx="27" cy="27" r="7" fill="{c}"/></svg>'


def cangkir(t):
    return f'''<div class="bn cangkir" style="background:{t['bg']};{t.get('extra', '')}">
<div class="disc" style="background:{t['disc']}">{cup(t['cup'], t['coffee'], t['steam'], 84)}</div>
<div class="body">
<span class="tag" style="background:{t['tagbg']};color:{t['tag']}">{ring_mark(t['tag'], 11)}Baru di Agi Mas</span>
<h3 style="color:{t['ink']}">Lingkar Kopi sudah bisa dipesan</h3>
<span class="btn" style="background:{t['acc']};color:{t['btn']}">Lihat menu {ARROW}</span>
</div></div>'''


def lingkar(t):
    rings = lambda cls: f'''<svg class="{cls}" viewBox="0 0 200 200" fill="none" aria-hidden="true"><circle cx="100" cy="100" r="97" stroke="{t['ring']}" stroke-width="2"/><circle cx="100" cy="100" r="76" stroke="{t['ring']}" stroke-width="2"/><circle cx="100" cy="100" r="55" stroke="{t['ring']}" stroke-width="2"/><circle cx="100" cy="100" r="34" fill="{t['ring']}"/></svg>'''
    return f'''<div class="bn lingkar" style="background:{t['bg']}">
{rings("r1")}{rings("r2")}
<span class="mini" style="color:{t['tag']}">{ring_mark(t['tag'], 12)}Lingkar Kopi <i>×</i> Agi Mas</span>
<h3 style="color:{t['ink']}">Kopi kafe, harga gerobak.</h3>
<span class="btn" style="background:{t['acc']};color:{t['btn']}">Pesan kopi {ARROW}</span>
</div>'''


def kupon(t):
    return f'''<div class="bn kupon" style="background:{t['bg']}">
<div class="main">
<span class="mini" style="color:{t['tag']}">{ring_mark(t['tag'], 12)}Agi Mas × Lingkar Kopi</span>
<h3 style="color:{t['ink']}">Ngopi tanpa keluar rumah</h3>
<p style="color:{t['soft']}">Bayar tunai atau QRIS</p>
</div>
<div class="cut" style="border-color:{t['dash']}"></div>
<div class="stub">
<span class="cupbox" style="background:{t['disc']}">{cup(t['cup'], t['coffee'], t['steam'], 40)}</span>
<span class="btn" style="background:{t['acc']};color:{t['btn']}">Pesan {ARROW}</span>
</div></div>'''


def struk(t):
    ln = lambda a, b: f'<p class="ln"><span>{a}</span><i></i><b>{b}</b></p>'
    return f'''<div class="bn struk" style="background:{t['bg']};color:{t['ink']}">
<div class="col grow"><span class="mini" style="color:{t['tag']}">{ring_mark(t['tag'], 12)}STRUK PESANAN</span>
{ln("Kopi Lingkar Kopi", "✓")}{ln("Diantar Agi Mas", "✓")}{ln("Bayar", "Tunai / QRIS")}</div>
<div class="col" style="align-items:center"><h3>SIAP<br>DIANTAR</h3><span class="btn" style="background:{t['acc']};color:{t['btn']}">Pesan {ARROW}</span></div></div>'''


def label(t):
    return f'''<div class="bn label" style="background:{t['bg']}"><span class="hole" style="border-color:{t['ink']}"></span>
<div class="col grow"><span class="mini" style="color:{t['tag']}">Agi Mas × Lingkar Kopi</span>
<h3 style="color:{t['ink']}">Kopi kafe,<br>harga gerobak.</h3></div>
<span class="btn" style="background:{t['acc']};color:{t['btn']}">Lihat menu {ARROW}</span></div>'''


def prangko(t):
    return f'''<div class="bn prangko" style="background:{t['bg']}"><div class="inner" style="border-color:{t['dash']}">
<span class="seal" style="border-color:{t['dash']};background:{t['disc']}">{cup(t['cup'], t['coffee'], t['steam'], 50)}</span>
<div class="col grow"><span class="mini" style="color:{t['tag']}">{ring_mark(t['tag'], 12)}KIRIMAN KOPI</span>
<h3 style="color:{t['ink']}">Dikirim dari Lingkar Kopi</h3><p style="color:{t['soft']}">Diantar Agi Mas sampai rumah.</p></div>
<span class="btn" style="background:{t['acc']};color:{t['btn']}">Pesan {ARROW}</span></div></div>'''


def bubble(t):
    return f'''<div class="bn bubble"><div class="bb" style="background:{t['bg']}">
<div class="col grow"><h3 style="color:{t['ink']}">“Kak, pesan kopi Lingkar ya, antar ke rumah.”</h3>
<span class="meta" style="color:{t['soft']}"><svg viewBox="0 0 16 12" fill="none" stroke="#7ab8ff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 6.5 4 9.5 10 2.5M6.5 9.5 7 10l7.5-7.5"/></svg>Terkirim ke admin Agi Mas</span></div>
<span class="btn" style="background:{t['acc']};color:{t['btn']}">Pesan juga {ARROW}</span></div>
<svg class="tail" viewBox="0 0 22 16" aria-hidden="true"><path d="M0 0h22C16 6 8 12 0 16z" fill="{t['bg']}"/></svg></div>'''


def pita(t):
    return f'''<div class="bn pita" style="background:{t['bg']}">
<span class="stitch" style="top:9px;border-color:{t['ink']}"></span><span class="stitch" style="bottom:9px;border-color:{t['ink']}"></span>
<span class="mini" style="color:{t['tag']}">{ring_mark(t['tag'], 12)}Lingkar Kopi <i>×</i> Agi Mas</span>
<h3 style="color:{t['ink']}">Kopi kafe, harga gerobak.</h3>
<span class="btn" style="background:{t['acc']};color:{t['btn']};height:28px">Pesan kopi {ARROW}</span></div>'''


def kanopi(t):
    return f'''<div class="bn kanopi" style="background:{t['bg']}">
<div class="awn" style="background:repeating-linear-gradient(90deg, {t['s1']} 0 22px, {t['s2']} 22px 44px)"></div>
<div class="shop"><span class="cupbox" style="flex:none;width:46px;height:46px;border-radius:50%;display:grid;place-items:center;background:{t['disc']}">{cup(t['cup'], t['coffee'], t['steam'], 38)}</span>
<div class="col grow"><h3 style="color:{t['ink']}">Kedai Lingkar Kopi buka di Agi Mas</h3><p style="color:{t['soft']}">Cek jam buka &amp; menu di aplikasi.</p></div>
<span class="btn" style="background:{t['acc']};color:{t['btn']};height:28px">Mampir {ARROW}</span></div></div>'''


DARK = dict(bg="#24150c", ink="#fbf3e8", soft="#e2cdb4", acc="#f5b86a", btn="#24150c", tag="#f5b86a", tagbg="rgba(245,184,106,.16)",
            disc="rgba(245,184,106,.14)", cup="#f5b86a", coffee="#6b3d1d", steam="#e2cdb4", ring="rgba(245,184,106,.16)", dash="rgba(245,184,106,.45)")
CREAM = dict(bg="#fbf1e4", ink="#2b1a10", soft="#6b4a30", acc="#2b1a10", btn="#fbf1e4", tag="#8a5426", tagbg="rgba(154,91,30,.12)",
             disc="#f2dcc0", cup="#ffffff", coffee="#8a5426", steam="#b98a5c", ring="rgba(154,91,30,.14)", dash="rgba(138,84,38,.4)")
CARAMEL = dict(bg="#f5b86a", ink="#2b1a10", soft="#5a3519", acc="#2b1a10", btn="#f5b86a", tag="#2b1a10", ring="rgba(43,26,16,.12)")
NIGHT = dict(bg="#0b2545", ink="#ffffff", soft="#c4d3e6", acc="#f5b86a", btn="#2b1a10", tag="#f5b86a", ring="rgba(245,184,106,.16)")
ESPRESSO = dict(DARK, bg="#3a2414", disc="rgba(245,184,106,.16)", dash="rgba(245,184,106,.5)")

CHOICES = [
    ("1-cangkir-gelap", "Cangkir · Kopi Gelap", cangkir, DARK),
    ("2-cangkir-krem", "Cangkir · Krem", cangkir, dict(CREAM, extra="box-shadow: inset 0 0 0 1px #eedcc4;")),
    ("3-lingkar-karamel", "Lingkar · Karamel", lingkar, CARAMEL),
    ("4-lingkar-malam", "Lingkar · Malam", lingkar, NIGHT),
    ("5-kupon-krem", "Kupon · Krem", kupon, CREAM),
    ("6-kupon-espresso", "Kupon · Espresso", kupon, ESPRESSO),
]

# Bentuk unik lain (selain kupon)
UNIK = [
    ("7-struk", "Struk · Kertas", struk, dict(CREAM, bg="#fdf3e3")),
    ("8-label-gantung", "Label gantung · Karamel", label, dict(CARAMEL, tag="#5a3519")),
    ("9-prangko", "Prangko · Krem", prangko, dict(CREAM, dash="#c79a6a")),
    ("10-gelembung-chat", "Gelembung chat · Espresso", bubble, ESPRESSO),
    ("11-pita", "Pita · Kayu Manis", pita, dict(bg="#8a5426", ink="#fff6ea", soft="#f3dcc0", acc="#f5b86a", btn="#2b1a10", tag="#ffd9a6")),
    ("12-kanopi-kedai", "Kanopi kedai · Kopi Gelap", kanopi, dict(DARK, s1="#f5b86a", s2="#fbf1e4")),
]

CSS = f"""
@font-face {{ font-family: 'PJS'; font-weight: 200 800; src: url('{FONT}') format('woff2'); }}
html, body {{ margin: 0; font-family: 'PJS', sans-serif; }}
.bn {{ position: relative; width: {W}px; height: {BH}px; box-sizing: border-box; border-radius: 24px; overflow: hidden; }}
.bn h3 {{ margin: 0; font-weight: 800; letter-spacing: -.02em; }}
.bn p {{ margin: 0; font-size: 11.5px; line-height: 1.4; }}
.btn {{ display: inline-flex; align-items: center; gap: 5px; height: 32px; padding: 0 14px; border-radius: 999px; font-size: 12px; font-weight: 800; white-space: nowrap; }}
.btn svg {{ width: 14px; height: 14px; }}
.mini {{ display: inline-flex; align-items: center; gap: 6px; font-size: 10px; font-weight: 800; letter-spacing: .03em; }}
.mini i {{ font-style: normal; opacity: .7; }}
/* Cangkir: gambar kiri, teks kanan */
.cangkir {{ display: flex; align-items: center; gap: 6px; padding: 0 16px 0 0; }}
.cangkir .disc {{ flex: none; width: 128px; height: 128px; margin-left: -18px; border-radius: 50%; display: grid; place-items: center; }}
.cangkir .body {{ display: flex; flex-direction: column; align-items: flex-start; gap: 6px; min-width: 0; }}
.cangkir h3 {{ font-size: 17px; line-height: 1.13; }}
.tag {{ display: inline-flex; align-items: center; gap: 5px; padding: 4px 9px; border-radius: 999px; font-size: 9.5px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; }}
.cangkir .btn {{ height: 28px; padding: 0 12px; }}
/* Lingkar: teks di tengah, lingkaran di dua sudut */
.lingkar {{ display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; text-align: center; padding: 10px 24px; }}
.lingkar svg.r1, .lingkar svg.r2 {{ position: absolute; width: 130px; height: 130px; }}
.lingkar .r1 {{ left: -62px; top: -66px; }}
.lingkar .r2 {{ right: -56px; bottom: -70px; }}
.lingkar > :not(svg) {{ position: relative; }}
.lingkar h3 {{ font-size: 21px; line-height: 1.1; }}
.lingkar .btn {{ height: 28px; padding: 0 13px; margin-top: 2px; }}
/* Kupon: bentuk tiket dengan sobekan */
.kupon {{ display: flex; align-items: stretch;
  -webkit-mask: radial-gradient(circle 11px at 69% 0, #0000 97%, #000) top / 100% 51% no-repeat, radial-gradient(circle 11px at 69% 100%, #0000 97%, #000) bottom / 100% 51% no-repeat;
  mask: radial-gradient(circle 11px at 69% 0, #0000 97%, #000) top / 100% 51% no-repeat, radial-gradient(circle 11px at 69% 100%, #0000 97%, #000) bottom / 100% 51% no-repeat; }}
.kupon .main {{ width: 69%; box-sizing: border-box; padding: 10px 12px 10px 18px; display: flex; flex-direction: column; justify-content: center; gap: 5px; }}
.kupon h3 {{ font-size: 17px; line-height: 1.12; }}
.kupon ul {{ margin: 0; padding: 0 0 0 14px; font-size: 11.5px; line-height: 1.55; font-weight: 600; }}
.kupon .cut {{ width: 0; margin: 14px 0; border-left: 2px dashed; }}
.kupon .stub {{ flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; }}
.kupon .cupbox {{ width: 46px; height: 46px; border-radius: 50%; display: grid; place-items: center; }}
.kupon .btn {{ height: 26px; padding: 0 11px; font-size: 11.5px; }}
/* ---------- Bentuk unik ---------- */
.row {{ display: flex; align-items: center; gap: 12px; }}
.col {{ display: flex; flex-direction: column; gap: 5px; min-width: 0; }}
.grow {{ flex: 1; min-width: 0; }}
/* Struk: tepi bawah bergerigi */
.struk {{ padding: 12px 18px 20px; border-radius: 18px 18px 0 0; display: flex; align-items: center; gap: 14px;
  -webkit-mask: conic-gradient(from -45deg at bottom, #0000, #000 1deg 89deg, #0000 90deg) 50% / 14px 100%;
  mask: conic-gradient(from -45deg at bottom, #0000, #000 1deg 89deg, #0000 90deg) 50% / 14px 100%; }}
.struk .ln {{ margin: 0; display: flex; align-items: baseline; gap: 6px; font-size: 11.5px; font-weight: 600; line-height: 1.5; }}
.struk .ln i {{ flex: 1; border-bottom: 1.5px dotted currentColor; opacity: .45; transform: translateY(-3px); }}
.struk .ln b {{ font-weight: 800; }}
.struk h3 {{ font-size: 15px; letter-spacing: .02em; }}
/* Label gantung: ujung lancip + lubang tali */
.label {{ padding: 0 18px 0 46px; display: flex; align-items: center; gap: 12px;
  clip-path: path('M32 0 H340 Q358 0 358 18 V106 Q358 124 340 124 H32 L0 62 Z');
  -webkit-mask: radial-gradient(circle 7px at 24px 50%, #0000 96%, #000); mask: radial-gradient(circle 7px at 24px 50%, #0000 96%, #000); }}
.label h3 {{ font-size: 20px; line-height: 1.08; }}
.label .hole {{ position: absolute; left: 14px; top: 50%; width: 20px; height: 20px; margin-top: -10px; border-radius: 50%; box-sizing: border-box; border: 2px solid; }}
/* Prangko: tepi berlubang */
.prangko {{ padding: 6px; border-radius: 0;
  -webkit-mask: linear-gradient(#000 0 0) content-box, radial-gradient(circle 4.5px, #0000 96%, #000) -6px -6px / 12px 12px round;
  mask: linear-gradient(#000 0 0) content-box, radial-gradient(circle 4.5px, #0000 96%, #000) -6px -6px / 12px 12px round; }}
.prangko .inner {{ height: 100%; box-sizing: border-box; border: 1.5px dashed; border-radius: 4px; padding: 8px 12px; display: flex; align-items: center; gap: 12px; }}
.prangko .seal {{ flex: none; width: 70px; height: 70px; border-radius: 50%; display: grid; place-items: center; box-sizing: border-box; border: 2px dashed; }}
.prangko h3 {{ font-size: 16px; line-height: 1.12; }}
/* Gelembung chat */
.bubble {{ background: transparent !important; overflow: visible; }}
.bubble .bb {{ position: absolute; left: 0; right: 0; top: 0; height: 110px; border-radius: 22px 22px 22px 6px; padding: 12px 16px; box-sizing: border-box; display: flex; align-items: center; gap: 12px; }}
.bubble .tail {{ position: absolute; left: 0; bottom: 0; width: 22px; height: 16px; }}
.bubble h3 {{ font-size: 16px; line-height: 1.2; font-weight: 700; letter-spacing: -.01em; }}
.bubble .meta {{ display: inline-flex; align-items: center; gap: 4px; font-size: 10.5px; font-weight: 600; }}
.bubble .meta svg {{ width: 16px; height: 12px; }}
/* Pita: ujung bertakik */
.pita {{ border-radius: 0; clip-path: polygon(0 0, 100% 0, calc(100% - 22px) 50%, 100% 100%, 0 100%, 22px 50%);
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; text-align: center; padding: 0 40px; }}
.pita h3 {{ font-size: 21px; line-height: 1.1; }}
.pita .stitch {{ position: absolute; left: 26px; right: 26px; border-top: 1.5px dashed; opacity: .45; }}
/* Kanopi kedai: atap bergaris, tepi bergelombang */
.kanopi {{ display: flex; flex-direction: column; }}
.kanopi .awn {{ flex: none; height: 30px;
  -webkit-mask: radial-gradient(circle 11px at 50% 19px, #000 97%, #0000) 0 0 / 22px 30px repeat-x, linear-gradient(#000 0 0) 0 0 / 100% 19px no-repeat;
  mask: radial-gradient(circle 11px at 50% 19px, #000 97%, #0000) 0 0 / 22px 30px repeat-x, linear-gradient(#000 0 0) 0 0 / 100% 19px no-repeat; }}
.kanopi .shop {{ flex: 1; display: flex; align-items: center; gap: 12px; padding: 2px 18px 8px; }}
.kanopi h3 {{ font-size: 17px; line-height: 1.12; }}
/* Lembar pilihan: banner di bawah hero asli */
.sheet {{ padding: 28px; background: #e9eef5; width: max-content; }}
.sheet h1 {{ margin: 0 0 4px; font-size: 20px; color: #0b2545; }}
.sheet > small {{ display: block; margin-bottom: 20px; font-size: 12px; color: #526781; }}
.grid {{ display: grid; grid-template-columns: repeat(3, 390px); gap: 24px; }}
.phone {{ background: #f3f8fe; border-radius: 22px; padding: 16px; display: flex; flex-direction: column; gap: 14px; }}
.phone figcaption {{ font-size: 13px; font-weight: 800; color: #0b2545; }}
.hero {{ position: relative; height: {H}px; box-sizing: border-box; padding: 18px; border-radius: 24px; background: #e6f1fd; overflow: hidden; color: #0b2545; }}
.hero > :not(.side) {{ position: relative; max-width: 58%; }}
.hero .pill {{ display: inline-block; padding: 5px 10px; border-radius: 999px; background: #fff; font-size: 9.5px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; }}
.hero h2 {{ margin: 10px 0 5px; font-size: 21px; line-height: 1.15; font-weight: 800; }}
.hero p {{ margin: 0 0 10px; font-size: 11px; line-height: 1.45; color: #3c5675; }}
.hero .btn {{ background: #1e7be6; color: #fff; height: 30px; }}
.hero .side {{ position: absolute; right: 12px; top: 16px; bottom: 12px; width: 42%; display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }}
.hero .side .lg {{ height: 34px; padding: 3px 8px; border-radius: 12px; background: #f7f7f7; }}
.hero .side .art {{ flex: 1; min-height: 0; width: 100%; object-fit: contain; object-position: right bottom; }}
"""

# Pilihan akhir: gelembung chat, warna hijau Lingkar Kopi (sama dengan tema aplikasi kasir)
HIJAU = [
    ("gelembung-hijau-1-hutan", "Gelembung chat · Hijau hutan", bubble, dict(bg="#173f2e", ink="#f1fbf4", soft="#b5d6c1", acc="#8fe0b0", btn="#173f2e")),
    ("gelembung-hijau-2-segar", "Gelembung chat · Hijau segar", bubble, dict(bg="#2f9e62", ink="#ffffff", soft="#dcf3e5", acc="#ffffff", btn="#1b6a40")),
    ("gelembung-hijau-3-mint", "Gelembung chat · Mint", bubble, dict(bg="#e4f4ea", ink="#173f2e", soft="#3d6b52", acc="#173f2e", btn="#ffffff")),
]
HERO = f'''<div class="hero"><span class="pill">Antar · Beli · Bantu</span><h2>Saget sembarang kalir.</h2>
<p>Antar, beli, dan bantu di Madiun dan sekitarnya.</p><span class="btn">Pesan sekarang {ARROW}</span>
<div class="side"><img class="lg" src="{LOGO}" alt=""><img class="art" src="{MOTOR}" alt=""></div></div>'''


def show(pg, body):
    """Buka dari file (bukan set_content): halaman about:blank tidak boleh memuat gambar & huruf file:// lokal."""
    f = OUT / "_tmp.html"
    f.write_text(f"<!doctype html><html lang='id'><head><meta charset='utf-8'><style>{CSS}</style></head><body>{body}</body></html>", encoding="utf8")
    pg.goto(f.as_uri()); pg.evaluate("document.fonts.ready")
    pg.wait_for_function("[...document.images].every(i => i.complete && i.naturalWidth > 0)")
    assert pg.evaluate("document.fonts.check('800 20px PJS')"), "huruf tidak termuat"


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=r"C:\Program Files\Google\Chrome\Application\chrome.exe")
        pg = b.new_page(viewport={"width": W, "height": BH}, device_scale_factor=3)
        for key, name, make, t in CHOICES + UNIK + HIJAU:
            show(pg, make(t))
            bad = pg.evaluate("""(() => { const c = document.querySelector('.bn').getBoundingClientRect();
              return [...document.querySelectorAll('.bn h3, .bn p, .bn .btn, .bn ul, .bn .mini, .bn .tag')].filter(e => { const r = e.getBoundingClientRect();
                return r.left < c.left + 8 || r.right > c.right - 8 || r.top < c.top + 6 || r.bottom > c.bottom - 6; }).map(e => e.textContent.trim().slice(0, 20)); })()""")
            assert not bad, f"{key}: teks keluar batas {bad}"
            pg.locator(".bn").screenshot(path=str(OUT / f"{key}.png"), omit_background=True)
            print("OK", key)
        pg.set_viewport_size({"width": 3 * 390 + 2 * 24 + 56, "height": 900})
        for file, title, items in [("pilihan-banner.png", "Banner Lingkar Kopi di bawah kartu Beranda: pilih satu", CHOICES),
                                   ("pilihan-bentuk-unik.png", "Banner bentuk unik: pilih satu", UNIK),
                                   ("pilihan-gelembung-hijau.png", "Gelembung chat warna hijau Lingkar Kopi: pilih satu", HIJAU)]:
            cells = "".join(f'<figure class="phone" style="margin:0">{HERO}{make(t)}<figcaption>{name}</figcaption></figure>' for key, name, make, t in items)
            show(pg, f"<div class='sheet'><h1>{title}</h1><small>Kartu biru atas = kartu Agi Mas yang sudah ada. Banner baru tampil tepat di bawahnya.</small><div class='grid'>{cells}</div></div>")
            pg.locator(".sheet").screenshot(path=str(OUT / file))
            print("OK", file)
        (OUT / "_tmp.html").unlink()


if __name__ == "__main__":
    main()
