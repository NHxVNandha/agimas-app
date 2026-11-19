"""Video tutorial aplikasi pelanggan Agi Mas -> D:/HU/AgiMasApp/promo/video/tutorial-agimas.mp4 (+ story/ dengan argumen "story")
Data Firestore ditiru (menu contoh Lingkar Kopi, nama driver contoh); semua penulisan ke database dicegat (tidak ada pesanan sungguhan).
Peta, pencarian alamat, dan rute memakai layanan aslinya (internet).
appdata.json (tidak di-commit) = salinan dokumen Firestore app/data: unduh dari
https://firestore.googleapis.com/v1/projects/<firebaseProjectId>/databases/(default)/documents/app/data
Setiap adegan = beberapa ketukan B(kalimat, aksi): kalimat dibacakan tepat saat aksinya berlangsung (lihat vidlib.py).
Jalankan: python tools/video/agimas.py [story]"""
import json, pathlib, sys
from playwright.sync_api import sync_playwright
from vidlib import HERE, Rec, B, tts, serve, mux, srt, split_parts
STORY = "story" in sys.argv
VW, VH = (1080, 1920) if STORY else (1920, 1080)

OUT = pathlib.Path("D:/HU/AgiMasApp/promo/video"); OUT.mkdir(parents=True, exist_ok=True)
DIST = "D:/HU/AgiMasApp/dist"
ROOT = serve({"/app/": DIST, "/tfonts/": "D:/HU/AgiMasApp/tools/fonts", "/bg/": "D:/HU/AgiMasApp/promo/video-bg", "/": str(HERE)}, 18811)

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


# ---------- aksi
def W(r, ms): r.pg.wait_for_timeout(ms)
def at(r, sel, ms=900): r.point(sel); W(r, ms)
def home(r): r.f.locator("html").evaluate("() => { location.hash = '#'; scrollTo(0, 0); }"); W(r, 700)
def open_map(r, which):
    r.tap(f'[data-pick="{which}"]', after=600)
    r.f.locator("#mapLoading.done").wait_for(state="attached", timeout=40000); W(r, 500)
def search(r, q):
    r.type("#mapQ", q, delay=85)
    sug = r.f.locator("#mapSug li").first; sug.wait_for(timeout=20000); W(r, 400)
    r.tap(sug, after=1500)
def wait_km(r): r.pg.wait_for_function("() => /km/.test(document.querySelector('#app').contentDocument.getElementById('kmOut').textContent)", timeout=30000)
def intro(r):
    r.pg.evaluate("u => loadApp(u)", ROOT + "app/#")
    r.f.locator("#splash").wait_for(state="detached", timeout=30000)
    r.f.locator("#v-home:not([hidden]) .feat.blue").wait_for(timeout=30000)
def open_mitra(r):
    home(r); r.tap("#promoLk", after=1000)
    if not r.f.locator(".mhours").is_visible(): r.tap("#promoLk", after=1000)   # ketukan kalah cepat dengan gambar ulang
def feats(r):
    r.scroll("html", 520, 1000)
    for c in ["blue", "yellow", "green", "purple"]: at(r, f".feat.{c}", 450)


CARD_IN = {"logo": 1, "k": "Video tutorial", "h": "Aplikasi Agi Mas", "p": "Antar, beli, dan bantu di Madiun dan sekitarnya"}
CARD_OUT = {"logo": 1, "k": "Agi Mas", "h": "Selamat mencoba!", "p": "Ada pertanyaan? Ketuk Chat admin di menu Bantuan."}
SCENES = [
    {"title": "Tutorial Agi Mas", "card": CARD_IN, "settle": 0, "beats": [
        B("Halo, selamat datang di tutorial aplikasi Agi Mas, layanan antar, beli, dan bantu di Madiun dan sekitarnya.", intro),
        B("Di video ini saya tunjukkan cara memesan, dari awal sampai pesanan terkirim ke admin.")]},
    {"title": "Kenali Beranda", "beats": [
        B("Ini halaman Beranda."),
        B("Di bawah kartu utama ada kartu mitra Agi Mas berbentuk gelembung chat, contohnya Lingkar Kopi.", lambda r: at(r, "#promoLk")),
        B("Di bawahnya ada layanan utama: Agi Antar, Agi Kirim, Agi Beli, dan Agi Bersih.", feats),
        B("Untuk kebutuhan lain, ketuk Lainnya untuk chat admin langsung.", lambda r: at(r, ".feat.gray"))]},
    {"title": "Agi Antar: titik jemput", "beats": [
        B("Kita coba pesan Agi Antar. Ketuk Agi Antar.", lambda r: r.tap(".feat.blue", after=900)),
        B("Lalu ketuk tombol Peta di kolom titik jemput.", lambda r: open_map(r, "from")),
        B("Ketik nama tempat, lalu pilih dari daftar.", lambda r: search(r, "Stasiun Madiun")),
        B("Tombol bulat di kanan bawah peta dipakai untuk lokasi Anda saat ini.", lambda r: at(r, "#mapGps")),
        B("Alamatnya tampil di bawah peta. Jika sudah benar, ketuk Pakai lokasi ini.", lambda r: (at(r, "#mapAddr", 600), r.tap("#mapOk", after=600)))]},
    {"title": "Pilih tujuan", "beats": [
        B("Lakukan hal yang sama untuk tujuan.", lambda r: open_map(r, "to")),
        B("Ketik nama tempat tujuan dan pilih dari daftar.", lambda r: search(r, "Alun-alun Kota Madiun")),
        B("Jika perlu, geser peta supaya pin tepat di lokasinya, lalu ketuk Pakai lokasi ini.", lambda r: r.tap("#mapOk", after=600))]},
    {"title": "Harga keluar otomatis", "beats": [
        B("Jarak dihitung otomatis mengikuti rute jalan, dan perkiraan harga langsung muncul beserta rinciannya.", lambda r: (wait_km(r), at(r, "#kmField", 400))),
        B("Isi nama Anda dan catatan untuk driver.", lambda r: (r.type("#name", "Budi"), r.type("#note", "Tunggu di pintu keluar"))),
        B("Lalu ketuk Lanjut.", lambda r: r.tap("#next", after=900))]},
    {"title": "Cek ringkasan pesanan", "beats": [
        B("Di halaman ini ada ringkasan pesanan.", lambda r: at(r, ".summary")),
        B("Admin akan menugaskan driver aktif yang paling dekat dengan titik jemput.", lambda r: at(r, ".nearcard")),
        B("Lalu pilih cara bayar: tunai ke driver, atau QRIS.", lambda r: at(r, ".paypick"))]},
    {"title": "Bayar pakai QRIS", "beats": [
        B("Kita pilih QRIS.", lambda r: r.tap(r.f.locator(".paypick label").nth(1), after=700)),
        B("Kartu QRIS langsung muncul dengan nominal yang sudah terisi.", lambda r: at(r, "#qrisAmt")),
        B("Kode pesanan juga ikut tercatat.", lambda r: at(r, "#qrisCode")),
        B("Screenshot kartu ini, lalu scan dari DANA, GoPay, OVO, atau m-banking.", lambda r: at(r, "#qrisQr")),
        B("Setelah membayar, centang Saya sudah bayar.", lambda r: r.tap(".paid", after=600))]},
    {"title": "Kirim ke admin", "beats": [
        B("Ketuk Lihat pesan WhatsApp untuk mengecek isi pesan.", lambda r: r.tap(".preview summary", after=700)),
        B("Semua detail sudah tersusun, termasuk kode pesanan dan status pembayaran.", lambda r: (r.scroll("html", 600, 1400), r.scroll("html", 600, 1400))),
        B("Terakhir, ketuk Kirim ke admin. WhatsApp terbuka dengan pesan yang siap dikirim.", lambda r: (at(r, "#send", 300), r.pg.evaluate("window.ripple()")))]},
    {"title": "Agi Kirim: kirim barang", "beats": [
        B("Agi Kirim dipakai untuk mengirim paket, dokumen, atau oleh-oleh.", lambda r: (home(r), r.scroll("html", 520, 900), r.tap(".feat.yellow", after=900))),
        B("Caranya sama seperti Agi Antar: pilih titik jemput dan tujuan di peta.", lambda r: at(r, ".route")),
        B("Bedanya, isi barang apa yang dikirim dan pilih perkiraan beratnya.", lambda r: (r.type("#item", "Dokumen dalam map biru"), at(r, "#w")))]},
    {"title": "Agi Beli dari mitra", "beats": [
        B("Mau pesan kopi atau makanan dari mitra? Di Beranda, ketuk gelembung chat Lingkar Kopi.", open_mitra),
        B("Jam buka mitra tampil di atas daftar menu, dan setiap menu ada gambarnya.", lambda r: (at(r, ".mhours", 500), at(r, "#menuList .mimg"))),
        B("Ketuk nama menu untuk melihat detailnya.", lambda r: r.tap('.mopen[data-detail="nebula"]', after=900))]},
    {"title": "Detail menu dan catatan", "beats": [
        B("Di detail menu ada keterangan lengkap.", lambda r: at(r, "#mdInfo")),
        B("Tulis catatan khusus, misalnya gula sedikit.", lambda r: r.type("#mdNote", "Gula sedikit")),
        B("Atur jumlahnya, lalu ketuk Tambah ke keranjang.", lambda r: (r.tap('#mdQty [data-d="1"]', after=400), r.tap("#mdAdd", after=900)))]},
    {"title": "Keranjang", "beats": [
        B("Tambah menu lain dengan tombol plus.", lambda r: r.tap('button[data-q="1"][data-id="croffle"]', after=700)),
        B("Keranjang ada di bilah harga bawah, lengkap dengan jumlah dan total belanja.", lambda r: at(r, "#sCart .shead")),
        B("Geser ke atas untuk membuka keranjang.", lambda r: r.drag("#sGrab", -220)),
        B("Di sini jumlah bisa diubah, menu dihapus, atau diberi catatan.", lambda r: (at(r, "#sList .qty", 500), at(r, "#sList .cnote"))),
        B("Geser ke bawah untuk menutup, lalu isi alamat tujuan.", lambda r: r.drag("#sGrab", 220))]},
    {"title": "Alamat antar dan kirim", "beats": [
        B("Lokasi ambil otomatis di alamat mitra.", lambda r: at(r, ".route .stop")),
        B("Cukup pilih alamat tujuan di peta.", lambda r: (open_map(r, "to"), search(r, "Pasar Besar Madiun"), r.tap("#mapOk", after=600))),
        B("Harga menu dan ongkos kirim langsung dijumlahkan.", lambda r: (wait_km(r), at(r, "#lines"))),
        B("Ketuk Lanjut, pilih cara bayar, lalu kirim ke admin seperti tadi.", lambda r: (r.tap("#next", after=900), at(r, ".summary", 500), at(r, "#send", 300))),
        B("Kode pesanan ikut di pesan, sehingga admin bisa mencocokkan pesanan Anda dengan cepat.")]},
    {"title": "Agi Bersih", "beats": [
        B("Untuk jasa bersih-bersih, pilih Agi Bersih.", lambda r: (home(r), r.scroll("html", 520, 900), r.tap(".feat.purple", after=900))),
        B("Isi lokasi dan apa saja yang perlu dibersihkan.", lambda r: (r.type("#from", "Jl. Pahlawan No. 10, Madiun"), r.type("#item", "Rumah 2 kamar dan kamar mandi"))),
        B("Harganya diberikan oleh admin sesuai keterangan Anda.", lambda r: at(r, "#price")),
        B("Ceritakan sedetail mungkin, misalnya jumlah ruangan, supaya admin bisa memberi harga yang pas.")]},
    {"title": "Beri ulasan", "beats": [
        B("Di menu Ulasan, Anda bisa memberi bintang.", lambda r: (home(r), r.tap('[data-tab="ulasan"]', after=800), r.tap('#stars [data-v="5"]', after=500))),
        B("Tulis kritik dan saran, lalu ketuk Kirim ulasan.", lambda r: (r.type("#revText", "Drivernya ramah dan cepat sampai."), at(r, "#revSend"))),
        B("Ulasan pelanggan lain juga bisa dibaca di sini.", lambda r: r.scroll("html", 700, 1400))]},
    {"title": "Bantuan dan info", "beats": [
        B("Menu Bantuan berisi kontak admin.", lambda r: (r.f.locator("html").evaluate("() => scrollTo(0, 0)"), r.tap('[data-tab="bantuan"]', after=800), at(r, "#adminBtn"))),
        B("Ada juga daftar tarif, cara kerja, dan ketentuan.", lambda r: [r.scroll("html", 520, 1100) for _ in range(3)]),
        B("Anda bisa membagikan aplikasi lewat kode QR, dan mengecek pembaruan aplikasi.", lambda r: (at(r, "#qrBox", 600), at(r, "#updCheck")))]},
    {"title": "Selamat mencoba!", "card": CARD_OUT, "settle": 0, "pad": 1.5, "beats": [
        B("Itulah cara memesan di aplikasi Agi Mas.", lambda r: r.hide_cursor()),
        B("Jika ada pertanyaan, ketuk Chat admin di menu Bantuan."),
        B("Terima kasih, dan selamat mencoba!")]},
]

if __name__ == "__main__":
    print("narasi total", round(tts(SCENES, HERE / "audio-agimas")), "detik")
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=r"C:\Program Files\Google\Chrome\Application\chrome.exe")
        c = b.new_context(viewport={"width": VW, "height": VH}, record_video_dir=str(HERE / ("raw-agimas-story" if STORY else "raw-agimas")), record_video_size={"width": VW, "height": VH},
                          service_workers="block", locale="id-ID", timezone_id="Asia/Jakarta")
        c.add_init_script("try{localStorage.setItem('agimas.seenVersion', window.AGIMAS_VERSION || '3.8');localStorage.removeItem('agimas.cart')}catch(e){}")
        c.route("https://firestore.googleapis.com/**", fb)
        c.route("https://api.open-meteo.com/**", lambda r: r.fulfill(json={}))
        c.route("**/version.js?t=*", lambda r: r.fulfill(body='window.AGIMAS_VERSION="3.8";', content_type="application/javascript"))
        pg = c.new_page(); errs = []
        pg.on("pageerror", lambda e: errs.append(str(e))); pg.on("popup", lambda pp: pp.close())
        rec = Rec(pg)
        pg.goto(ROOT + "stage.html?mode=agimas" + ("&fmt=story" if STORY else "")); pg.wait_for_timeout(800)
        rec.run(SCENES)
        video = pg.video; c.close(); webm = video.path(); b.close()
    print("penulisan dicegat:", len(blocked), "| error JS:", errs[:3])
    if STORY:
        sdir = OUT / "story"; sdir.mkdir(exist_ok=True)
        full = sdir / "tutorial-agimas-story-penuh.mp4"
        rel, total = mux(webm, rec.beats, full)
        split_parts(full, rel, rec.beats, total, sdir / "tutorial-agimas-story")
    else:
        rel, total = mux(webm, rec.beats, OUT / "tutorial-agimas.mp4")
        srt(rel, rec.beats, OUT / "tutorial-agimas.srt")
