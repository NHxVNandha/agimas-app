"""Data untuk video Remotion (remotion/): tangkapan layar aplikasi per ketukan + narasi + naskah promosi & deskripsi.
- Tutorial: memutar ulang skenario agimas.py / kasir.py. Setiap ketukan menyimpan tangkapan sebelum tiap tap (dengan titik tap)
  dan tangkapan sesudah aksi. Narasinya sama (mp3 edge-tts yang sudah ada).
- Promosi & deskripsi: naskah di bawah; tiap kalimat punya mp3 sendiri dan gambar dari tangkapan tutorial.
Hasil: remotion/public/gen/<app>/... dan remotion/src/gen/<app>.json (durasi tiap kalimat -> jumlah frame, jadi suara & gambar sinkron).
Jalankan: python tools/video/remotion_data.py [agimas|kasir] [ulang]   (ulang = potret ulang meski sudah ada)"""
import asyncio, hashlib, json, math, pathlib, shutil, subprocess, sys
import edge_tts
from playwright.sync_api import sync_playwright
from vidlib import Rec, VOICE, duration

RM = pathlib.Path("D:/HU/AgiMasApp/remotion")
FPS, GAP = 30, 0.35          # jeda sesudah tiap kalimat (detik)
UNDUH = "https://solusiagimas.netlify.app/unduh/"
SITUS = "https://solusiagimas.netlify.app/"
QR_HOLD = 3.0                # detik tambahan di slide QR agar sempat dipindai
SNAP_FRAMES = 30 * FPS       # video Snapgram tepat 30 detik


class Capture(Rec):
    """Rec tanpa perekaman video: kursor tidak digambar; setiap tap memotret iframe aplikasi lebih dulu."""
    def __init__(self, page, out):
        super().__init__(page); self.out, self.n, self.segs = out, 0, []

    def shot(self):
        self.n += 1; name = f"s{self.n:03d}.jpg"
        self.pg.locator("#app").screenshot(path=str(self.out / name), type="jpeg", quality=88)
        return name

    def point(self, loc, dx=0.5, dy=0.5):
        if isinstance(loc, str): loc = self.f.locator(loc).first
        for k in range(5):
            try:
                loc.wait_for(state="visible", timeout=15000); loc.scroll_into_view_if_needed(timeout=15000); b = loc.bounding_box(timeout=15000)
                if b: break
                raise RuntimeError("not attached")
            except Exception as e:
                if k == 4 or "not attached" not in str(e): raise
                self.pg.wait_for_timeout(600)
        x, y = b["x"] + b["width"] * dx, b["y"] + b["height"] * dy
        fb = self.pg.locator("#app").bounding_box()
        self.pg.wait_for_timeout(250)
        self.segs.append({"shot": self.shot(), "x": round((x - fb["x"]) / fb["width"], 4), "y": round((y - fb["y"]) / fb["height"], 4)})
        return x, y

    def run(self, scenes):
        for i, sc in enumerate(scenes):
            for j, b in enumerate(sc["beats"]):
                self.segs = []
                if b["act"]: b["act"](self)
                self.pg.wait_for_timeout(500)
                b["segs"], b["after"] = self.segs, (None if sc.get("card") else self.shot())
            print(f"{i:02d} {sc['title'][:40]}", flush=True)


async def say_to(text, mp3):
    """edge-tts kadang menolak sementara (NoAudioReceived) bila banyak permintaan: coba lagi dengan jeda bertambah."""
    for k in range(6):
        try:
            await asyncio.wait_for(edge_tts.Communicate(text, VOICE).save(str(mp3)), timeout=45)   # layanan kadang diam tanpa jawaban
            if mp3.stat().st_size > 1000: return
        except Exception as e:
            if k == 5: raise
            print("  suara ditolak sementara, coba lagi:", type(e).__name__, flush=True)
        await asyncio.sleep(10 * (k + 1))


def tts_lines(lines, adir):
    async def run():
        for l in lines:
            mp3 = adir / (hashlib.md5(l["say"].encode()).hexdigest()[:12] + ".mp3")
            if not mp3.exists() or mp3.stat().st_size < 1000: await say_to(l["say"], mp3); await asyncio.sleep(1.5)
            l["audio"] = mp3.name
    asyncio.run(run())
    for l in lines: l["frames"] = math.ceil((duration(adir / l["audio"]) + GAP + l.get("hold", 0)) * FPS)


def capture(app):
    mod = __import__("agimas" if app == "agimas" else "kasir")
    gen = RM / "public/gen" / app; shots, adir = gen / "shots", gen / "audio"
    cache = gen / "capture.json"   # hasil tangkapan disimpan: bila langkah suara gagal, tidak perlu memotret ulang
    if cache.exists() and "ulang" not in sys.argv:
        return json.loads(cache.read_text(encoding="utf8")), adir
    shutil.rmtree(gen, ignore_errors=True); shots.mkdir(parents=True); adir.mkdir(parents=True)
    mod.tts(mod.SCENES, mod.HERE / ("audio-agimas" if app == "agimas" else "audio-kasir"))
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=r"C:\Program Files\Google\Chrome\Application\chrome.exe")
        c = b.new_context(viewport={"width": 1920, "height": 1080}, device_scale_factor=2 if app == "agimas" else 1.5,
                          service_workers="block", accept_downloads=True, locale="id-ID", timezone_id="Asia/Jakarta")
        if app == "agimas":
            c.add_init_script("try{localStorage.setItem('agimas.seenVersion','3.8');localStorage.removeItem('agimas.cart')}catch(e){}")
            c.route("https://firestore.googleapis.com/**", mod.fb); c.route("https://api.open-meteo.com/**", lambda r: r.fulfill(json={}))
            c.route("**/version.js?t=*", lambda r: r.fulfill(body='window.AGIMAS_VERSION="3.8";', content_type="application/javascript"))
        pg = c.new_page(); pg.on("dialog", lambda d: d.accept()); pg.on("popup", lambda x: x.close())
        cap = Capture(pg, shots)
        pg.goto(mod.ROOT + "stage.html?mode=" + ("agimas" if app == "agimas" else "kasir")); pg.wait_for_timeout(800)
        cap.run(mod.SCENES); b.close()
    scenes = []
    for sc in mod.SCENES:
        beats = []
        for bt in sc["beats"]:
            shutil.copy(bt["mp3"], adir / bt["mp3"].name)
            beats.append({"say": bt["say"], "audio": bt["mp3"].name, "frames": math.ceil((bt["dur"] + GAP) * FPS), "segs": bt["segs"], "after": bt["after"]})
        scenes.append({"title": sc["title"], "card": sc.get("card"), "beats": beats})
    cache.write_text(json.dumps(scenes, ensure_ascii=False), encoding="utf8")
    return scenes, adir


def pick(scenes, title, beat=-1, seg=None):
    """Gambar dari tutorial: tangkapan sesudah ketukan ke-beat pada adegan berjudul title (atau segmen tap ke-seg)."""
    sc = next(s for s in scenes if s["title"] == title); b = sc["beats"][beat]
    return b["segs"][seg]["shot"] if seg is not None else b["after"]


def assets():
    """Latar, logo, dan huruf yang sama dengan video sebelumnya, disalin ke public/gen/assets."""
    A = RM / "public/gen/assets"; A.mkdir(parents=True, exist_ok=True); R = RM.parent
    for src, dst in [("promo/video-bg/3-dua-warna-landscape.png", "bg-agimas.png"), ("promo/video-bg/kasir-3-geometris-landscape.png", "bg-kasir.png"),
                     ("promo/video-bg/3-dua-warna-story.png", "bg-agimas-v.png"), ("promo/video-bg/kasir-3-geometris-story.png", "bg-kasir-v.png"),
                     ("promo/video-bg/logo-agimas-full.png", "logo-agimas.png"), ("promo/video-bg/logo-saget-kasir-full.png", "logo-kasir.png"),
                     ("web/fonts/PlusJakartaSans-1.woff2", "PlusJakartaSans.woff2"), ("web/splash-motor.png", "motor.png"), ("tools/fonts/Inter-latin-var.woff2", "Inter.woff2")]:
        shutil.copy(R / src, A / dst)
    # QR unduh aplikasi Agi Mas (halaman /unduh selalu menyajikan APK terbaru), dibuat dengan qrcode-generator milik aplikasi
    js = ("const q=require(process.argv[1]);const c=q(0,'M');c.addData(process.argv[2]);c.make();"
          "process.stdout.write(c.createSvgTag({cellSize:10,margin:2,scalable:true}))")
    svg = subprocess.run(["node", "-e", js, str(R / "web/vendor/qrcode.js"), UNDUH], capture_output=True, text=True, check=True).stdout
    (A / "qr-unduh-agimas.svg").write_text(svg, encoding="utf8")
    svg = subprocess.run(["node", "-e", js, str(R / "web/vendor/qrcode.js"), SITUS], capture_output=True, text=True, check=True).stdout
    (A / "qr-web-agimas.svg").write_text(svg, encoding="utf8")   # QR ke versi website (Snapgram)


def build(app):
    assets()
    scenes, adir = capture(app)
    S = lambda *a: pick(scenes, *a)
    if app == "agimas":
        promo = [
            {"kind": "hook", "head": "Antar, beli, bantu.", "say": "Mau ke kantor, kirim paket, atau beli kopi di Madiun? Sekarang cukup dari HP.", "shot": S("Kenali Beranda", 0)},
            {"kind": "logo", "head": "Agi Mas", "say": "Kenalkan Agi Mas. Saget sembarang kalir."},
            {"kind": "shot", "head": "Harga langsung keluar", "say": "Pilih lokasi di peta, jarak dan harga langsung dihitung otomatis.", "shot": S("Harga keluar otomatis", 0)},
            {"kind": "shot", "head": "Pesan dari mitra", "say": "Pesan kopi dan makanan dari mitra seperti Lingkar Kopi, lengkap dengan keranjang.", "shot": S("Keranjang", 2)},
            {"kind": "shot", "head": "Tunai atau QRIS", "say": "Bayar tunai ke driver, atau QRIS dengan nominal yang sudah terisi.", "shot": S("Bayar pakai QRIS", 1)},
            {"kind": "shot", "head": "Langsung ke admin", "say": "Pesanan terkirim ke admin lewat WhatsApp, lalu driver terdekat segera berangkat.", "shot": S("Kirim ke admin", 1)},
            {"kind": "cta", "head": "Unduh gratis", "sub": "solusiagimas.netlify.app/unduh", "qr": "gen/assets/qr-unduh-agimas.svg", "hold": QR_HOLD,
             "say": "Unduh aplikasinya gratis sekarang. Pindai kode QR di layar. Agi Mas, saget sembarang kalir!"},
        ]
        desc = [
            {"kind": "logo", "head": "Tentang Agi Mas", "say": "Agi Mas adalah aplikasi layanan antar, beli, dan bantu untuk warga Madiun dan sekitarnya."},
            {"kind": "list", "head": "Empat layanan utama", "items": ["Agi Antar", "Agi Kirim", "Agi Beli", "Agi Bersih"], "say": "Ada empat layanan utama: Agi Antar untuk penumpang, Agi Kirim untuk barang, Agi Beli untuk belanja, dan Agi Bersih untuk jasa bersih-bersih."},
            {"kind": "flow", "head": "Cara kerjanya", "items": ["Pesan di aplikasi", "Kirim ke WhatsApp admin", "Driver terdekat berangkat"], "say": "Pelanggan memesan di aplikasi, harga dihitung otomatis dari rute jalan, lalu pesanan dikirim ke admin lewat WhatsApp. Admin menugaskan driver aktif terdekat."},
            {"kind": "shot", "head": "Bayar tunai atau QRIS", "say": "Pembayaran bisa tunai ke driver, atau QRIS dengan nominal dan kode pesanan yang sudah terisi.", "shot": S("Bayar pakai QRIS", 1)},
            {"kind": "shot", "head": "Mitra usaha lokal", "say": "Agi Mas juga bermitra dengan usaha lokal seperti Lingkar Kopi. Menu, stok, dan jam bukanya tampil langsung di aplikasi.", "shot": S("Agi Beli dari mitra", 1)},
            {"kind": "list", "head": "Untuk pelanggan & admin", "items": ["Aplikasi Android", "Aplikasi web untuk iPhone", "Panel admin: tarif, driver, mitra, pesanan"], "say": "Aplikasinya tersedia untuk Android dan bisa dipasang di iPhone sebagai aplikasi web. Admin punya panel sendiri untuk mengelola tarif, driver, mitra, dan pesanan."},
            {"kind": "list", "head": "Dibangun dengan layanan gratis", "items": ["Peta OpenStreetMap", "Firebase paket gratis", "Netlify", "Capacitor untuk Android"], "say": "Semuanya dibangun dengan layanan gratis: peta OpenStreetMap, data di Firebase paket gratis, situs di Netlify, dan Capacitor untuk aplikasi Android."},
            {"kind": "cta", "head": "Agi Mas", "sub": "Saget sembarang kalir", "say": "Agi Mas. Saget sembarang kalir."},
        ]
    else:
        promo = [
            {"kind": "hook", "head": "Masih pakai buku?", "say": "Kedai Anda masih mencatat penjualan di buku?", "shot": S("Layar Jual", 0)},
            {"kind": "logo", "head": "Saget Kasir", "say": "Kenalkan Saget Kasir, aplikasi kasir untuk kedai dan kafe. Cukup satu tablet."},
            {"kind": "shot", "head": "Varian & catatan", "say": "Catat pesanan lengkap dengan varian, diskon, dan catatan untuk barista.", "shot": S("Pilih menu dan varian", 1)},
            {"kind": "shot", "head": "Bayar & cetak struk", "say": "Bayar tunai, QRIS, atau debit, lalu cetak struk ke printer thermal.", "shot": S("Struk dan nomor antrean", 1, 1)},
            {"kind": "shot", "head": "Antrean barista", "say": "Antrean barista selalu rapi, termasuk pesanan yang masuk dari Agi Mas.", "shot": S("Pesanan dari Agi Mas", 0)},
            {"kind": "shot", "head": "Laporan otomatis", "say": "Laporan harian, rentang waktu, dan ekspor ke Excel, semuanya otomatis.", "shot": S("Laporan dan rentang waktu", 2)},
            {"kind": "cta", "head": "Coba demonya", "sub": "Saget Kasir · kasir untuk kedai & kafe", "say": "Saget Kasir. Hubungi kami untuk mencoba demonya."},
        ]
        desc = [
            {"kind": "logo", "head": "Tentang Saget Kasir", "say": "Saget Kasir adalah aplikasi kasir untuk kedai, kafe, dan warung, yang dirancang untuk tablet."},
            {"kind": "flow", "head": "Alur satu shift", "items": ["Buka kasir", "Jual & bayar", "Tutup kasir"], "say": "Alurnya mengikuti kerja satu shift: buka kasir dengan modal awal, layani penjualan, lalu tutup kasir dengan hitungan selisih uang di laci."},
            {"kind": "shot", "head": "Bayar langsung atau open bill", "say": "Pesanan bisa langsung dibayar atau disimpan sebagai open bill, dan semuanya masuk ke antrean barista.", "shot": S("Bayar pesanan tersimpan", 0)},
            {"kind": "shot", "head": "Terhubung dengan Agi Mas", "say": "Saget Kasir terhubung dengan Agi Mas. Pesanan dari aplikasi pelanggan masuk ke antrean, dengan menu dan stok yang sama.", "shot": S("Pesanan dari Agi Mas", 1)},
            {"kind": "list", "head": "Laporan lengkap", "items": ["Penjualan bersih", "Menu terlaris", "Per metode bayar", "Ekspor CSV untuk Excel"], "say": "Laporannya menampilkan penjualan bersih, menu terlaris, dan pembagian per metode bayar, dengan ekspor CSV untuk Excel."},
            {"kind": "shot", "head": "Bantuan & printer thermal", "say": "Menu Bantuan berisi panduan pemakaian, termasuk cara menyambungkan printer thermal Bluetooth.", "shot": S("Bantuan dan printer", 1)},
            {"kind": "list", "head": "Status saat ini", "items": ["Demo di browser tablet", "Siap jadi aplikasi Android", "Data terhubung dengan Agi Mas"], "say": "Saat ini Saget Kasir berupa demo yang bisa dicoba di browser tablet, dan siap dikembangkan menjadi aplikasi Android."},
            {"kind": "cta", "head": "Saget Kasir", "sub": "Kasir untuk kedai & kafe", "say": "Saget Kasir. Kasir untuk kedai dan kafe."},
        ]
    # Snapgram / Instagram Story: promosi tepat 30 detik (1080x1920), latar & screenshot seperti tutorial
    if app == "agimas":
        snap = [   # versi website: pesan dari browser HP tanpa install
            {"kind": "intro", "head": "Butuh ojek atau titip belanja di Madiun?", "say": "Butuh ojek atau titip belanja di Madiun?"},
            {"head": "Pesan dari browser", "say": "Pakai Agi Mas, langsung dari browser HP. Tanpa install.", "shot": S("Kenali Beranda", 0)},
            {"head": "Harga langsung keluar", "say": "Pilih lokasi di peta, harga langsung keluar otomatis.", "shot": S("Harga keluar otomatis", 0)},
            {"head": "Tunai atau QRIS", "say": "Bayar tunai ke driver, atau QRIS dengan nominal yang sudah terisi.", "shot": S("Bayar pakai QRIS", 1)},
            {"head": "Langsung ke admin", "say": "Pesanan langsung terkirim ke admin lewat WhatsApp.", "shot": S("Kirim ke admin", 1)},
            {"kind": "outro", "head": "Buka sekarang", "say": "Buka situs Agi Mas sekarang. Pindai kode QR ini!", "qr": "gen/assets/qr-web-agimas.svg", "sub": "solusiagimas.netlify.app"},
        ]
    else:
        snap = [
            {"head": "Kasir untuk kedai & kafe", "say": "Kedai Anda butuh kasir yang rapi? Pakai Saget Kasir.", "shot": S("Layar Jual", 3)},
            {"head": "Varian & catatan", "say": "Catat pesanan lengkap dengan varian dan catatan barista.", "shot": S("Pilih menu dan varian", 1)},
            {"head": "Bayar & cetak struk", "say": "Bayar tunai, QRIS, atau debit, lalu cetak struk.", "shot": S("Struk dan nomor antrean", 1, 1)},
            {"head": "Laporan otomatis", "say": "Laporan penjualan dan ekspor Excel, semuanya otomatis.", "shot": S("Laporan dan rentang waktu", 2)},
            {"head": "Coba demonya", "say": "Saget Kasir. Hubungi kami untuk mencoba demonya.", "sub": "Kasir untuk kedai & kafe"},
        ]
    tts_lines(promo, adir); tts_lines(desc, adir); tts_lines(snap, adir)
    over = sum(l["frames"] for l in snap) - SNAP_FRAMES
    assert over <= 0, f"naskah Snapgram {app} {over / FPS:.1f} detik terlalu panjang"
    snap[-1]["frames"] -= over            # sisa waktu untuk slide terakhir (QR / ajakan) -> total tepat 30 detik
    out = {"app": app, "fps": FPS, "tutorial": scenes, "promo": promo, "desc": desc, "snap": snap}
    (RM / "src/gen").mkdir(parents=True, exist_ok=True)
    (RM / "src/gen" / f"{app}.json").write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf8")
    tot = lambda ls: sum(l["frames"] for l in ls) / FPS
    print(app, "tutorial", round(sum(b["frames"] for s in scenes for b in s["beats"]) / FPS), "s | promo", round(tot(promo)), "s | deskripsi", round(tot(desc)), "s | snapgram", tot(snap), "s, slide terakhir", round(snap[-1]["frames"] / FPS, 1), "s")


if __name__ == "__main__":
    for a in ([x for x in sys.argv[1:] if x != "ulang"] or ["agimas", "kasir"]): build(a)
