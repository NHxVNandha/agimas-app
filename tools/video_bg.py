"""Background video tutorial Agi Mas (PNG) dengan logo lengkap "Agimas · Saget sembarang kalir".
Hasil: promo/video-bg/<pilihan>-<landscape|story>.png (latar saja, dipakai perekam video)
     + promo/video-bg/pratinjau-*.png (latar + HP contoh, untuk memilih) + pilihan-background.png (semua sekaligus).
Logo transparan: promo/video-bg/logo-agimas-full(.png|-putih.png), dipotong dari assets/logo-agimas-fhd.png.
Jalankan: python tools/video_bg.py   (butuh Playwright + Chrome)."""
import pathlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "promo" / "video-bg"
U = lambda p: (ROOT / p).as_uri()
LOGO = U("promo/video-bg/logo-agimas-full.png")
MOTOR, SHOT = U("web/splash-motor.png"), U("assets/promo/src/app-home.png")

# Tata letak sama dengan panggung video (tools/video/stage.html): logo kiri atas / tengah atas, HP di kanan / tengah bawah,
# area putih kosong untuk teks narasi.
FMT = {
    "landscape": dict(w=1920, h=1080, logo="left:140px;top:110px;width:560px", phone=(1270, 54, 468, 972)),
    "story": dict(w=1080, h=1920, logo="left:320px;top:110px;width:440px", phone=(296, 720, 488, 1060)),   # ruang narasi antara logo dan HP
}


def terang(f, w, h):
    px, py, pw, ph = f["phone"]; cx, cy = px + pw / 2, py + ph / 2
    return f'''<div class="bg" style="background:linear-gradient(160deg,#ffffff 0%,#f1f7ff 45%,#d9e9fd 100%)">
<div class="dots" style="right:0;top:0;width:{w * .45}px;height:{h * .4}px"></div>
<div class="blob" style="left:{cx - 520}px;top:{cy - 520}px;width:1040px;height:1040px;background:radial-gradient(closest-side,rgba(30,123,230,.30),rgba(30,123,230,.10) 60%,transparent)"></div>
<div class="ring" style="left:{cx - 420}px;top:{cy - 420}px;width:840px;height:840px"></div>
<div class="ring" style="left:{cx - 600}px;top:{cy - 600}px;width:1200px;height:1200px;opacity:.5"></div>
<svg class="wave" viewBox="0 0 1440 320" preserveAspectRatio="none" style="height:{h * .22}px"><path fill="#1e7be6" fill-opacity=".10" d="M0 190c180-60 380-90 600-40s420 110 840 10v160H0z"/><path fill="#1e7be6" fill-opacity=".16" d="M0 250c240-50 460-40 720 0s480 40 720-20v90H0z"/></svg>
<img class="logo" src="{LOGO}" style="{f['logo']}"></div>'''


def biru(f, w, h):
    px, py, pw, ph = f["phone"]; cx, cy = px + pw / 2, py + ph / 2
    story = h > w
    motor = f'<img src="{MOTOR}" style="position:absolute;{"right:-60px;bottom:40px;width:520px" if story else "left:110px;bottom:60px;width:600px"};opacity:.95;filter:drop-shadow(0 30px 40px rgba(0,0,0,.25))">'
    return f'''<div class="bg" style="background:radial-gradient(1400px 1000px at 25% 15%,#3d9bff 0%,#1e7be6 40%,#0b3d8c 100%)">
<div class="lines"></div>
<div class="blob" style="left:{cx - 560}px;top:{cy - 560}px;width:1120px;height:1120px;background:radial-gradient(closest-side,rgba(255,255,255,.22),transparent)"></div>
<div class="blob" style="left:-200px;top:-200px;width:700px;height:700px;background:radial-gradient(closest-side,rgba(127,195,255,.45),transparent)"></div>
{motor}
<div class="card" style="{f['logo']}"><img src="{LOGO}" style="width:100%;display:block"></div></div>'''


def duawarna(f, w, h):
    px, py, pw, ph = f["phone"]; cx, cy = px + pw / 2, py + ph / 2
    big = 1500 if h > w else 1400
    return f'''<div class="bg" style="background:linear-gradient(180deg,#ffffff,#f3f8fe)">
<div class="blob" style="left:{cx - big / 2}px;top:{cy - big / 2 + (260 if h > w else 0)}px;width:{big}px;height:{big}px;background:linear-gradient(150deg,#3d9bff,#1e7be6 45%,#0f5bb5)"></div>
<div class="ring" style="left:{cx - big / 2 - 60}px;top:{cy - big / 2 - 60 + (260 if h > w else 0)}px;width:{big + 120}px;height:{big + 120}px;border-color:rgba(30,123,230,.18)"></div>
<span class="dot" style="left:{cx - big / 2 + 40}px;top:{cy - 40}px;background:#ffc93c;width:46px;height:46px"></span>
<span class="dot" style="left:{w - 120}px;top:{90 if h < w else h - 300}px;background:#ffc93c;width:24px;height:24px"></span>
<span class="dot" style="left:{(px - 140) if h < w else 120}px;top:{h - 160}px;background:#1e7be6;width:18px;height:18px;opacity:.5"></span>
<img class="logo" src="{LOGO}" style="{f['logo']}"></div>'''


CHOICES = [("1-terang", "Terang · biru muda", terang), ("2-biru", "Biru Agi Mas + motor", biru), ("3-dua-warna", "Dua warna · lingkaran biru", duawarna)]
CSS = '''*{box-sizing:border-box}body{margin:0}
.bg{position:relative;overflow:hidden}
.bg>*{position:absolute}
.logo{height:auto;z-index:3}
.card{z-index:3;background:#fff;padding:34px 40px 30px;border-radius:32px;box-shadow:0 24px 60px -16px rgba(5,25,60,.55)}
.blob{border-radius:50%}
.ring{border-radius:50%;border:2px solid rgba(30,123,230,.16)}
.dot{border-radius:50%}
.dots{background-image:radial-gradient(rgba(30,123,230,.22) 2.5px,transparent 3px);background-size:34px 34px;
  -webkit-mask-image:radial-gradient(circle at 100% 0,#000 20%,transparent 75%);mask-image:radial-gradient(circle at 100% 0,#000 20%,transparent 75%)}
.lines{inset:0;background-image:repeating-linear-gradient(135deg,rgba(255,255,255,.05) 0 2px,transparent 2px 36px)}
.wave{left:0;bottom:0;width:100%}
.phone{z-index:5;background:#0d1117;padding:14px;box-shadow:0 40px 90px -20px rgba(10,30,60,.5)}
.phone img{display:block;width:100%;height:100%;object-fit:cover;object-position:top}
.sheet{padding:40px;background:#e9eef5;font-family:system-ui,sans-serif;color:#0b2545}
.sheet h1{margin:0 0 6px;font-size:30px}.sheet small{color:#55677d;font-size:16px}
.row{display:flex;gap:28px;align-items:flex-start;margin-top:26px}
figure{margin:0;display:flex;flex-direction:column;gap:10px}figcaption{font-weight:700;font-size:18px}
figure img{border-radius:12px;box-shadow:0 6px 20px rgba(0,0,0,.12);display:block}'''


def page(pg, body, w, h):
    f = OUT / "_tmp.html"
    f.write_text(f"<!doctype html><html><head><meta charset='utf-8'><style>{CSS}</style></head><body style='width:{w}px'>{body}</body></html>", encoding="utf8")
    pg.set_viewport_size({"width": w, "height": h}); pg.goto(f.as_uri())
    pg.wait_for_function("[...document.images].every(i => i.complete && i.naturalWidth > 0)")


def main():
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=r"C:\Program Files\Google\Chrome\Application\chrome.exe")
        pg = b.new_page()
        for key, name, make in CHOICES:
            for fk, f in FMT.items():
                w, h = f["w"], f["h"]
                bg = make(f, w, h).replace('<div class="bg" style="', f'<div class="bg" style="width:{w}px;height:{h}px;', 1)
                page(pg, bg, w, h); pg.locator(".bg").screenshot(path=str(OUT / f"{key}-{fk}.png"))
                x, y, pw, ph = f["phone"]
                phone = f'<div class="phone" style="left:{x}px;top:{y}px;width:{pw}px;height:{ph}px;border-radius:{56 if fk == "landscape" else 60}px"><img src="{SHOT}" style="border-radius:44px"></div>'
                page(pg, bg[:-6] + phone + "</div>", w, h)   # HP contoh sebagai anak terakhir .bg
                pg.locator(".bg").screenshot(path=str(OUT / f"pratinjau-{key}-{fk}.png"))
                print("OK", key, fk)
        # lembar pilihan: pratinjau landscape (atas) dan story (bawah)
        cells = "".join(f'<figure><img src="{(OUT / f"pratinjau-{k}-landscape.png").as_uri()}" width="560"><figcaption>{i + 1}. {n}</figcaption></figure>' for i, (k, n, _) in enumerate(CHOICES))
        cells2 = "".join(f'<figure><img src="{(OUT / f"pratinjau-{k}-story.png").as_uri()}" width="250"><figcaption>{i + 1}. {n} (Story)</figcaption></figure>' for i, (k, n, _) in enumerate(CHOICES))
        page(pg, f"<div class='sheet'><h1>Background video Agi Mas: pilih satu</h1><small>HP di depan hanya contoh posisi. Teks langkah tutorial nanti tampil di bawah logo.</small><div class='row'>{cells}</div><div class='row'>{cells2}</div></div>", 1840, 1000)
        pg.locator(".sheet").screenshot(path=str(OUT / "pilihan-background.png")); print("OK pilihan-background.png")
        (OUT / "_tmp.html").unlink(); b.close()


if __name__ == "__main__":
    main()
