"""Video tutorial aplikasi pelanggan Agi Mas -> D:/HU/AgiMasApp/promo/video/tutorial-agimas.mp4
Data Firestore ditiru (menu contoh Lingkar Kopi, nama driver contoh); semua penulisan ke database dicegat (tidak ada pesanan sungguhan).
Peta, pencarian alamat, dan rute memakai layanan aslinya (internet).
appdata.json (tidak di-commit) = salinan dokumen Firestore app/data: unduh dari
https://firestore.googleapis.com/v1/projects/<firebaseProjectId>/databases/(default)/documents/app/data
Jalankan: python tools/video/agimas.py [story]   (hasil di promo/video/)"""
import json, pathlib, sys
from playwright.sync_api import sync_playwright
import sys
from vidlib import HERE, Rec, tts, serve, mux, srt, split_parts
STORY = "story" in sys.argv   # python agimas.py story -> Instagram Story 1080x1920, dipotong per 60 detik
VW, VH = (1080, 1920) if STORY else (1920, 1080)

OUT = pathlib.Path("D:/HU/AgiMasApp/promo/video"); OUT.mkdir(parents=True, exist_ok=True)
DIST = "D:/HU/AgiMasApp/dist"
ROOT = serve({"/app/": DIST, "/tfonts/": "D:/HU/AgiMasApp/tools/fonts", "/": str(HERE)}, 18811)

data = json.loads(json.load(open(HERE / "appdata.json", encoding="utf8"))["fields"]["json"]["stringValue"])
data["drivers"] = [{"id": f"d{i}", "name": n, "area": a, "status": "aktif"} for i, (n, a) in
                   enumerate([("Mas Andi", "Taman"), ("Mas Bayu", "Kartoharjo"), ("Mas Candra", "Manguharjo")], 1)]
def mi(i, n, p, c, d, info, stock=20):
    return {"id": i, "name": n, "price": p, "cat": c, "desc": d, "info": info, "available": True, "stock": stock, "stockStart": stock}
MENU = [
    mi("nebula", "Nebula", 15000, "Kopi", "Kopi susu andalan Lingkar", "Espresso, susu segar, dan krim gula aren. Disajikan dingin, ukuran 350 ml."),
    mi("kopisusu", "Kopi Susu", 12000, "Kopi", "Kopi susu gula aren", "Espresso, susu, dan gula aren. Bisa dingin atau panas."),
    mi("americano", "Americano", 10000, "Kopi", "Espresso dan air", "Tanpa gula, cocok untuk yang suka kopi pekat."),
    mi("matcha", "Matcha Latte", 17000, "Non-kopi", "Matcha dan susu segar", "Bubuk matcha Jepang dan susu segar, manis sedang."),
    mi("tehlemon", "Teh Lemon", 8000, "Non-kopi", "Teh segar dengan lemon", "Teh melati dan perasan lemon asli."),
    mi("rotibakar", "Roti Bakar", 12000, "Makanan", "Coklat keju", "Roti tebal dipanggang, isi coklat dan keju parut."),
    mi("croffle", "Croffle", 15000, "Makanan", "Croissant waffle", "Croissant dipanggang di cetakan waffle, saus karamel.", 3),
]
lk = data["mitra"][0]; lk.update(active=True, menu=MENU, open="07:00", close="22:00")
MITRA_DOC = {"documents": [{"name": "projects/p/databases/(default)/documents/mitra/lingkar", "updateTime": "2026-11-19T00:00:00Z",
                            "fields": {"json": {"stringValue": json.dumps({"menu": MENU, "open": "07:00", "close": "22:00"})}}}]}
blocked = []
def fb(route):
    r = route.request; u = r.url
    if r.method == "GET" and "/documents/app/data" in u: return route.fulfill(json={"fields": {"json": {"stringValue": json.dumps(data)}}, "updateTime": "2026-11-19T00:00:00Z"})
    if r.method == "GET" and "/documents/mitra" in u: return route.fulfill(json=MITRA_DOC)
    if "/documents/app/foto" in u: return route.fulfill(status=404, json={"error": {"code": 404}})
    if r.method == "GET" or ":runAggregationQuery" in u: return route.continue_()   # ulasan publik: hanya baca
    blocked.append(u); route.fulfill(json={"name": "x", "updateTime": "2026-11-19T00:00:00Z"})


def home(r):
    r.f.locator("html").evaluate("() => { location.hash = '#'; scrollTo(0, 0); }"); r.pg.wait_for_timeout(700)

def map_pick(r, which, q):
    r.tap(f'[data-pick="{which}"]', after=900)
    r.f.locator("#mapLoading.done").wait_for(state="attached", timeout=40000); r.pg.wait_for_timeout(600)
    r.type("#mapQ", q, delay=85)
    sug = r.f.locator("#mapSug li").first; sug.wait_for(timeout=20000); r.pg.wait_for_timeout(500)
    r.tap(sug, after=1600)
    r.tap("#mapOk", after=600)

def wait_km(r):
    r.pg.wait_for_function("() => /km/.test(document.querySelector('#app').contentDocument.getElementById('kmOut').textContent)", timeout=30000)


def s_intro(r):
    r.pg.evaluate("u => loadApp(u)", ROOT + "app/#")
    r.f.locator("#splash").wait_for(state="detached", timeout=30000)
    r.f.locator("#v-home:not([hidden]) .feat.blue").wait_for(timeout=30000); r.pg.wait_for_timeout(800)

def s_home(r):
    r.point(r.f.locator("#promoLk")); r.pg.wait_for_timeout(1500)
    r.scroll("html", 520, 1200)
    for c in ["blue", "yellow", "green", "purple", "gray"]:
        r.point(r.f.locator(f".feat.{c}")); r.pg.wait_for_timeout(900)

def s_from(r):
    r.tap(".feat.blue", after=900)
    map_pick(r, "from", "Stasiun Madiun")

def s_to(r): map_pick(r, "to", "Alun-alun Kota Madiun")

def s_price(r):
    wait_km(r); r.pg.wait_for_timeout(600)
    r.point(r.f.locator("#kmField")); r.pg.wait_for_timeout(1800)
    r.type("#name", "Budi"); r.type("#note", "Tunggu di pintu keluar")
    r.point(r.f.locator("#price")); r.pg.wait_for_timeout(1200)
    r.tap("#next", after=900)

def s_sum(r):
    r.point(r.f.locator(".summary")); r.pg.wait_for_timeout(2600)
    r.point(r.f.locator(".nearcard")); r.pg.wait_for_timeout(2600)
    r.point(r.f.locator(".paypick")); r.pg.wait_for_timeout(1500)

def s_qris(r):
    r.tap(r.f.locator('.paypick label').nth(1), after=800)
    r.scroll("html", 380, 1000)
    r.point(r.f.locator("#qrisQr")); r.pg.wait_for_timeout(3500)
    r.point(r.f.locator("#qrisAmt")); r.pg.wait_for_timeout(2500)
    r.tap(".paid", after=600)

def s_send(r):
    r.tap(".preview summary", after=700)
    r.scroll("html", 600, 1600); r.pg.wait_for_timeout(1500)
    r.scroll("html", 600, 1600)
    r.point(r.f.locator("#send")); r.pg.wait_for_timeout(1500); r.pg.evaluate("window.ripple()")

def s_kirim(r):
    home(r); r.scroll("html", 520, 900)
    r.tap(".feat.yellow", after=900)
    r.point(r.f.locator(".route")); r.pg.wait_for_timeout(1500)
    r.scroll("html", 420, 900)
    r.type("#item", "Dokumen dalam map biru")
    r.tap("#w", after=300); r.f.locator("#w").select_option(index=0); r.pg.wait_for_timeout(500)

def s_mitra(r):
    home(r)
    r.tap("#promoLk", after=1000)
    if not r.f.locator(".mhours").is_visible():   # ketukan kalah cepat dengan gambar ulang kartu: ulangi
        r.tap("#promoLk", after=1000)
    r.point(r.f.locator(".mhours")); r.pg.wait_for_timeout(1800)
    r.point(r.f.locator(".mcat").nth(1)); r.pg.wait_for_timeout(1200)
    r.tap('.mopen[data-detail="nebula"]', after=900)

def s_detail(r):
    r.point(r.f.locator("#mdInfo")); r.pg.wait_for_timeout(2200)
    r.type("#mdNote", "Gula sedikit")
    r.tap('#mdQty [data-d="1"]', after=500)
    r.tap("#mdAdd", after=900)

def s_cart(r):
    r.tap('button[data-q="1"][data-id="croffle"]', after=700)
    r.point(r.f.locator("#cartBar")); r.pg.wait_for_timeout(1800)
    r.tap("#cartBar", after=1000)
    r.point(r.f.locator("#cartBox")); r.pg.wait_for_timeout(2500)
    r.tap("#cartGo", after=900)

def s_beli_send(r):
    r.point(r.f.locator(".route .stop").first); r.pg.wait_for_timeout(1500)
    map_pick(r, "to", "Pasar Besar Madiun")
    wait_km(r); r.pg.wait_for_timeout(500)
    r.point(r.f.locator("#price")); r.pg.wait_for_timeout(1500)
    r.tap("#next", after=900)
    r.point(r.f.locator(".summary")); r.pg.wait_for_timeout(2000)
    r.point(r.f.locator("#send")); r.pg.wait_for_timeout(800)

def s_bersih(r):
    home(r); r.scroll("html", 520, 900)
    r.tap(".feat.purple", after=900)
    r.type("#from", "Jl. Pahlawan No. 10, Madiun")
    r.type("#item", "Rumah 2 kamar dan kamar mandi")
    r.point(r.f.locator("#price")); r.pg.wait_for_timeout(1000)

def s_ulasan(r):
    home(r)
    r.tap('[data-tab="ulasan"]', after=900)
    r.tap('#stars [data-v="5"]', after=600)
    r.type("#revText", "Drivernya ramah dan cepat sampai.")
    r.scroll("html", 700, 1400); r.pg.wait_for_timeout(1200)

def s_bantuan(r):
    r.f.locator("html").evaluate("() => scrollTo(0, 0)")
    r.tap('[data-tab="bantuan"]', after=900)
    r.point(r.f.locator("#adminBtn")); r.pg.wait_for_timeout(1500)
    for _ in range(4): r.scroll("html", 520, 1300); r.pg.wait_for_timeout(700)
    r.point(r.f.locator("#qrBox")); r.pg.wait_for_timeout(1200)
    r.scroll("html", 600, 1300); r.point(r.f.locator("#updCheck"))

def s_outro(r): r.hide_cursor()


SCENES = [
    {"title": "Tutorial Agi Mas", "act": s_intro, "card": {"logo": 1, "k": "Video tutorial", "h": "Aplikasi Agi Mas", "p": "Antar, beli, dan bantu di Madiun dan sekitarnya"},
     "say": "Halo, selamat datang di tutorial aplikasi Agi Mas, layanan antar, beli, dan bantu di Madiun dan sekitarnya. Di video ini saya tunjukkan cara memesan, dari awal sampai pesanan terkirim ke admin."},
    {"title": "Kenali Beranda", "act": s_home,
     "say": "Ini halaman Beranda. Di bawah kartu utama ada kartu mitra Agi Mas berbentuk gelembung chat, contohnya Lingkar Kopi. Di bawahnya ada layanan utama: Agi Antar, Agi Kirim, Agi Beli, dan Agi Bersih. Untuk kebutuhan lain, ketuk Lainnya untuk chat admin langsung."},
    {"title": "Agi Antar: titik jemput", "act": s_from,
     "say": "Kita coba pesan Agi Antar. Ketuk Agi Antar, lalu ketuk tombol Peta di kolom titik jemput. Ketik nama tempat, pilih dari daftar, lalu ketuk Pakai lokasi ini. Peta perlu beberapa detik untuk dimuat. Anda juga bisa mengetuk tombol bulat di kanan bawah peta untuk memakai lokasi Anda saat ini."},
    {"title": "Pilih tujuan", "act": s_to,
     "say": "Lakukan hal yang sama untuk tujuan. Jika perlu, geser peta supaya pin tepat di lokasi yang diinginkan. Alamat yang dipilih tampil di bagian bawah peta, jadi pastikan sudah benar sebelum mengetuk Pakai lokasi ini."},
    {"title": "Harga keluar otomatis", "act": s_price,
     "say": "Jarak dihitung otomatis mengikuti rute jalan, dan perkiraan harga langsung muncul beserta rinciannya. Grafik di bawahnya membandingkan tarif Agi Mas dengan kisaran tarif ojek online. Isi nama dan catatan untuk driver, lalu ketuk Lanjut."},
    {"title": "Cek ringkasan pesanan", "act": s_sum,
     "say": "Di halaman ini ada ringkasan pesanan. Admin akan menugaskan driver aktif yang paling dekat dengan titik jemput. Lalu pilih cara bayar: tunai ke driver, atau QRIS."},
    {"title": "Bayar pakai QRIS", "act": s_qris,
     "say": "Jika memilih QRIS, kode QR langsung muncul dengan nominal yang sudah terisi, beserta kode pesanan. Screenshot QR ini, lalu scan dari DANA, GoPay, OVO, atau m-banking. Setelah membayar, centang Saya sudah bayar."},
    {"title": "Kirim ke admin", "act": s_send,
     "say": "Ketuk Lihat pesan WhatsApp untuk mengecek isi pesan. Semua detail sudah tersusun, termasuk kode pesanan dan status pembayaran. Terakhir, ketuk Kirim ke admin. WhatsApp terbuka dengan pesan yang siap dikirim."},
    {"title": "Agi Kirim: kirim barang", "act": s_kirim,
     "say": "Agi Kirim dipakai untuk mengirim paket, dokumen, atau oleh-oleh. Caranya sama seperti Agi Antar. Bedanya, isi barang apa yang dikirim dan pilih perkiraan beratnya."},
    {"title": "Agi Beli dari mitra", "act": s_mitra,
     "say": "Mau pesan kopi atau makanan dari mitra? Di Beranda, ketuk gelembung chat Lingkar Kopi. Jam buka mitra tampil di atas daftar menu. Ketuk nama menu untuk melihat detailnya."},
    {"title": "Detail menu dan catatan", "act": s_detail,
     "say": "Di detail menu ada keterangan lengkap. Tulis catatan khusus, misalnya gula sedikit, atur jumlahnya, lalu ketuk tombol tambah ke keranjang."},
    {"title": "Keranjang", "act": s_cart,
     "say": "Tambah menu lain dengan tombol plus. Bilah keranjang di bawah menampilkan jumlah dan total belanja. Ketuk untuk membuka keranjang. Di sini jumlah bisa diubah atau menu dihapus. Lalu ketuk Isi alamat."},
    {"title": "Alamat antar dan kirim", "act": s_beli_send,
     "say": "Lokasi ambil otomatis di alamat mitra. Cukup pilih alamat tujuan. Harga menu dan ongkos kirim langsung dijumlahkan. Ketuk Lanjut, pilih cara bayar, lalu kirim ke admin seperti tadi. Kode pesanan ikut di pesan, sehingga admin bisa mencocokkan pesanan Anda dengan cepat."},
    {"title": "Agi Bersih", "act": s_bersih,
     "say": "Untuk jasa bersih-bersih, pilih Agi Bersih. Isi lokasi dan apa saja yang perlu dibersihkan. Harganya diberikan oleh admin sesuai keterangan Anda. Ceritakan sedetail mungkin, misalnya jumlah ruangan, supaya admin bisa memberi harga yang pas."},
    {"title": "Beri ulasan", "act": s_ulasan,
     "say": "Di menu Ulasan, Anda bisa memberi bintang serta kritik dan saran, lalu ketuk Kirim ulasan. Ulasan pelanggan lain juga bisa dibaca di sini."},
    {"title": "Bantuan dan info", "act": s_bantuan,
     "say": "Menu Bantuan berisi kontak admin, daftar tarif, cara kerja, dan ketentuan. Anda juga bisa membagikan aplikasi lewat kode QR, dan mengecek pembaruan aplikasi."},
    {"title": "Selamat mencoba!", "act": s_outro, "card": {"logo": 1, "k": "Agi Mas", "h": "Selamat mencoba!", "p": "Ada pertanyaan? Ketuk Chat admin di menu Bantuan."},
     "say": "Itulah cara memesan di aplikasi Agi Mas. Jika ada pertanyaan, ketuk Chat admin di menu Bantuan. Terima kasih, dan selamat mencoba!", "pad": 1.5},
]

if __name__ == "__main__":
    tts(SCENES, HERE / "audio-agimas")
    print("narasi total", round(sum(s["dur"] for s in SCENES)), "detik")
    vdir = HERE / "raw-agimas"
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=r"C:\Program Files\Google\Chrome\Application\chrome.exe")
        c = b.new_context(viewport={"width": VW, "height": VH}, record_video_dir=str(vdir) + ("-story" if STORY else ""), record_video_size={"width": VW, "height": VH},
                          service_workers="block", locale="id-ID", timezone_id="Asia/Jakarta")
        c.add_init_script("try{localStorage.setItem('agimas.seenVersion', window.AGIMAS_VERSION || '3.8');localStorage.setItem('agimas.hlhint','1');localStorage.removeItem('agimas.cart')}catch(e){}")
        c.route("https://firestore.googleapis.com/**", fb)
        c.route("https://api.open-meteo.com/**", lambda r: r.fulfill(json={}))
        c.route("**/version.js?t=*", lambda r: r.fulfill(body='window.AGIMAS_VERSION="3.8";', content_type="application/javascript"))
        pg = c.new_page(); errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.on("popup", lambda pp: pp.close())
        rec = Rec(pg)
        pg.goto(ROOT + "stage.html?mode=agimas" + ("&fmt=story" if STORY else "")); pg.wait_for_timeout(800)
        rec.run(SCENES, len(SCENES))
        video = pg.video; c.close(); webm = video.path(); b.close()
    print("penulisan dicegat:", len(blocked), "| error JS:", errs[:3])
    if STORY:
        sdir = OUT / "story"; sdir.mkdir(exist_ok=True)
        full = sdir / "tutorial-agimas-story-penuh.mp4"
        mux(webm, rec.marks, rec.end, full)
        split_parts(full, rec.marks, rec.end, sdir / "tutorial-agimas-story")
    else:
        mux(webm, rec.marks, rec.end, OUT / "tutorial-agimas.mp4")
        srt(rec.marks, OUT / "tutorial-agimas.srt")
