"""Pilihan desain tampilan QRIS di aplikasi Agi Mas (layar Kirim ke admin), dengan QR dinamis asli (nominal + kode pesanan).
Logo QRIS & GPN dipotong dari stiker QRIS DANA Bisnis (promo/qris/logo-qris.png, logo-gpn.png).
Hasil: promo/qris/<n>-<nama>.png + promo/qris/pilihan-qris.png. Jalankan: python tools/qris_designs.py"""
import pathlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "promo" / "qris"
U = lambda p: (ROOT / p).as_uri()
AMT, CODE, NMID = 5500, "AGU84NS", "ID1026538172085"

HEAD = f'''<link rel="stylesheet" href="{U("web/fonts.css")}">
<script src="{U("web/config.js")}"></script><script src="{U("web/pricing.js")}"></script><script src="{U("web/vendor/qrcode.js")}"></script>
<style>
*{{box-sizing:border-box}}body{{margin:0;background:#f3f8fe;font-family:"Plus Jakarta Sans",system-ui,sans-serif;color:#0b2545}}
.wrap{{width:390px;padding:24px 18px}}
.qr svg{{display:block;width:100%;height:100%}}
.amt{{font-size:30px;font-weight:800;letter-spacing:-.02em;font-variant-numeric:tabular-nums}}
.code{{display:inline-flex;gap:6px;align-items:center;padding:5px 12px;border-radius:99px;background:#e6f1fd;color:#0f5bb5;font-weight:700;font-size:13px}}
.mer{{font-weight:800;font-size:16px}}.nmid{{font-size:12px;color:#6a7f97;font-weight:600}}
.lq{{height:26px}}.lg{{height:34px}}
</style>'''
QR_JS = f'''<script>
(function () {{
  var C = window.AGIMAS_CONFIG, q = qrcode(0, "M"); q.addData(Pricing.qrisAmount(C.qris, {AMT}, "{CODE}")); q.make();
  document.querySelectorAll(".qr").forEach(function (e) {{ e.innerHTML = q.createSvgTag({{ cellSize: 6, margin: 0, scalable: true }}); }});
}})();
</script>'''


def stiker():
    return f'''<div style="position:relative;border-radius:14px;overflow:hidden;box-shadow:0 10px 28px -10px rgba(11,37,69,.35);border:1px solid #e3ebf5">
<img src="{U("promo/qris/qris-frame.jpg")}" style="display:block;width:100%">
<div class="qr" style="position:absolute;left:23.66%;top:33.31%;width:52.51%;aspect-ratio:1"></div></div>
<div style="text-align:center;margin-top:12px"><div class="amt">Rp 5.500</div><div class="nmid">ke AGI.PAY, Service · kode pesanan {CODE}</div></div>'''


def kartu():
    return f'''<div style="border-radius:22px;overflow:hidden;background:#fff;box-shadow:0 16px 40px -14px rgba(11,37,69,.35)">
<div style="background:linear-gradient(135deg,#3d9bff,#1e7be6 55%,#0f5bb5);color:#fff;padding:18px 20px 46px;position:relative">
  <div style="display:flex;align-items:center;justify-content:space-between"><b style="font-size:17px">Bayar dengan QRIS</b>
  <span style="background:#fff;border-radius:10px;padding:4px 8px"><img src="{U("promo/video-bg/logo-agimas-full.png")}" style="height:24px;display:block"></span></div>
  <div style="margin-top:10px;font-size:13px;opacity:.9">Total yang dibayar</div><div class="amt" style="color:#fff">Rp 5.500</div></div>
<div style="margin:-30px 16px 0;background:#fff;border-radius:18px;box-shadow:0 8px 24px -10px rgba(11,37,69,.3);padding:16px 18px 18px;position:relative">
  <div style="display:flex;align-items:center;justify-content:space-between"><img class="lq" src="{U("promo/qris/logo-qris.png")}"><img class="lg" src="{U("promo/qris/logo-gpn.png")}"></div>
  <div class="qr" style="width:220px;height:220px;margin:16px auto 12px"></div>
  <div style="text-align:center"><div class="mer">AGI.PAY, Service</div><div class="nmid">NMID: {NMID}</div></div></div>
<div style="padding:14px 18px 18px;display:flex;justify-content:space-between;align-items:center"><span class="code">Kode {CODE}</span><span class="nmid">Nominal sudah terisi</span></div></div>'''


def minimal():
    corner = lambda pos: f'<i style="position:absolute;{pos};width:34px;height:34px;border:5px solid #1e7be6;{"border-right:0;border-bottom:0;border-top-left-radius:16px" if pos.startswith("left:0;top") else "border-left:0;border-bottom:0;border-top-right-radius:16px" if pos.startswith("right:0;top") else "border-right:0;border-top:0;border-bottom-left-radius:16px" if pos.startswith("left") else "border-left:0;border-top:0;border-bottom-right-radius:16px"}"></i>'
    step = lambda n, t: f'<div style="flex:1;text-align:center"><span style="display:grid;place-items:center;width:30px;height:30px;margin:0 auto 6px;border-radius:50%;background:#e6f1fd;color:#1e7be6;font-weight:800">{n}</span><span style="font-size:11.5px;color:#33475e;font-weight:600;line-height:1.3;display:block">{t}</span></div>'
    return f'''<div style="background:#fff;border-radius:22px;padding:22px 20px;border:1px solid #e3ebf5">
<div style="text-align:center"><img class="lq" src="{U("promo/qris/logo-qris.png")}" style="height:30px"></div>
<div style="position:relative;width:250px;height:250px;margin:18px auto 14px;padding:18px">{corner("left:0;top:0")}{corner("right:0;top:0")}{corner("left:0;bottom:0")}{corner("right:0;bottom:0")}<div class="qr" style="width:100%;height:100%"></div></div>
<div style="text-align:center"><div class="amt">Rp 5.500</div><div class="nmid" style="margin-top:2px">AGI.PAY, Service · NMID {NMID}</div><div style="margin-top:10px"><span class="code">Kode pesanan {CODE}</span></div></div>
<div style="display:flex;gap:8px;margin-top:18px;padding-top:16px;border-top:1px dashed #d6e2f0">{step(1, "Screenshot QR ini")}{step(2, "Buka DANA, GoPay, OVO, m-banking")}{step(3, "Scan dari galeri, nominal terisi")}</div></div>'''


def tiket():
    return f'''<div style="filter:drop-shadow(0 14px 26px rgba(11,37,69,.22))">
<div style="background:#fff;border-radius:20px 20px 0 0;padding:20px 22px 18px;
  -webkit-mask:radial-gradient(circle 14px at 0 100%,#0000 98%,#000) left/51% 100% no-repeat,radial-gradient(circle 14px at 100% 100%,#0000 98%,#000) right/51% 100% no-repeat">
  <div style="display:flex;justify-content:space-between;align-items:flex-start"><div><div class="nmid">TAGIHAN AGI MAS</div><div class="amt" style="margin-top:2px">Rp 5.500</div></div>
  <span class="code" style="background:#fff4d6;color:#8a5a00">{CODE}</span></div>
  <div style="margin-top:12px;display:flex;justify-content:space-between;font-size:13px"><span class="nmid">Dibayar ke</span><b>AGI.PAY, Service</b></div></div>
<div style="background:#fff;height:2px;margin:0 16px;border-top:2px dashed #cfdcec"></div>
<div style="background:#fff;border-radius:0 0 20px 20px;padding:18px 22px 20px;
  -webkit-mask:radial-gradient(circle 14px at 0 0,#0000 98%,#000) left/51% 100% no-repeat,radial-gradient(circle 14px at 100% 0,#0000 98%,#000) right/51% 100% no-repeat">
  <div class="qr" style="width:230px;height:230px;margin:2px auto 14px"></div>
  <div style="display:flex;align-items:center;justify-content:space-between;padding-top:12px;border-top:1px solid #eef2f7"><img class="lq" src="{U("promo/qris/logo-qris.png")}" style="height:22px"><span class="nmid">NMID {NMID}</span><img class="lg" src="{U("promo/qris/logo-gpn.png")}" style="height:28px"></div></div></div>'''


CHOICES = [("1-stiker-resmi", "Stiker resmi (sekarang)", stiker), ("2-kartu-agimas", "Kartu Agi Mas", kartu),
           ("3-minimal", "Minimal + cara bayar", minimal), ("4-tiket", "Tiket tagihan", tiket)]


def main():
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=r"C:\Program Files\Google\Chrome\Application\chrome.exe")
        pg = b.new_page(viewport={"width": 390, "height": 900}, device_scale_factor=2)
        tmp = OUT / "_tmp.html"
        for key, name, make in CHOICES:
            tmp.write_text(f"<!doctype html><html><head><meta charset='utf-8'>{HEAD}</head><body><div class='wrap'>{make()}</div>{QR_JS}</body></html>", encoding="utf8")
            pg.goto(tmp.as_uri()); pg.wait_for_function("document.querySelectorAll('.qr svg').length > 0 && [...document.images].every(i => i.complete && i.naturalWidth)")
            pg.evaluate("document.fonts.ready"); pg.locator(".wrap").screenshot(path=str(OUT / f"{key}.png")); print("OK", key)
        cells = "".join(f'<figure style="margin:0"><img src="{(OUT / f"{k}.png").as_uri()}" width="390"><figcaption style="font:700 18px system-ui;margin-top:8px;color:#0b2545">{i + 1}. {n}</figcaption></figure>' for i, (k, n, _) in enumerate(CHOICES))
        tmp.write_text(f"<!doctype html><html><body style='margin:0'><div id='s' style='display:inline-flex;gap:26px;align-items:flex-start;padding:34px;background:#e9eef5'>{cells}</div></body></html>", encoding="utf8")
        pg.set_viewport_size({"width": 1800, "height": 1200}); pg.goto(tmp.as_uri()); pg.wait_for_function("[...document.images].every(i => i.complete)")
        pg.locator("#s").screenshot(path=str(OUT / "pilihan-qris.png")); print("OK pilihan-qris.png")
        tmp.unlink(); b.close()


if __name__ == "__main__":
    main()
