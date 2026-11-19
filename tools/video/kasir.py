"""Video tutorial demo Saget Kasir (contoh toko: Lingkar Kopi) -> D:/HU/AgiMasApp/promo/video/tutorial-saget-kasir.mp4 (+ story/ dengan argumen "story")
Setiap adegan = beberapa ketukan B(kalimat, aksi): kalimat dibacakan tepat saat aksinya berlangsung (lihat vidlib.py).
Jalankan: python tools/video/kasir.py [story]"""
import pathlib, sys
from playwright.sync_api import sync_playwright
from vidlib import HERE, Rec, B, tts, serve, mux, srt, split_parts
STORY = "story" in sys.argv
VW, VH = (1080, 1920) if STORY else (1920, 1080)

OUT = pathlib.Path("D:/HU/AgiMasApp/promo/video"); OUT.mkdir(parents=True, exist_ok=True)
ROOT = serve({"/app/": "D:/HU/AgiMasApp/dist", "/kasir/": "D:/HU/AgiMasApp/promo/kasir", "/tfonts/": "D:/HU/AgiMasApp/tools/fonts", "/bg/": "D:/HU/AgiMasApp/promo/video-bg", "/": str(HERE)}, 18812)

def W(r, ms): r.pg.wait_for_timeout(ms)
def at(r, sel, ms=900): r.point(sel); W(r, ms)
def tab(r, v): r.tap(f'.tabs [data-v="{v}"]', after=800)
def intro(r):
    r.pg.evaluate("u => loadApp(u)", ROOT + "kasir/kasir-lingkar-demo.html")
    r.f.locator("#dForm[open]").wait_for(timeout=30000)
def cash(r, v):
    c = r.f.locator("#fCash"); r.tap(c, after=200); c.fill(""); c.press_sequentially(v, delay=110); W(r, 400)


CARD_IN = {"k": "Video tutorial", "h": "Saget Kasir", "p": "Aplikasi kasir untuk kedai dan kafe: jual, antrean barista, pesanan Agi Mas, dan laporan dalam satu tablet"}
CARD_OUT = {"k": "Saget Kasir", "h": "Terima kasih!", "p": "Terhubung langsung dengan pesanan Agi Mas"}
SCENES = [
    {"title": "Tutorial Saget Kasir", "card": CARD_IN, "settle": 0, "beats": [
        B("Halo, selamat datang di tutorial Saget Kasir, aplikasi kasir untuk kedai dan kafe.", intro),
        B("Di video ini kita pakai contoh toko Lingkar Kopi."),
        B("Aplikasi ini dipakai di tablet kasir untuk mencatat penjualan, mengatur antrean barista, menerima pesanan dari Agi Mas, sampai membuat laporan.")]},
    {"title": "Buka kasir", "beats": [
        B("Setiap awal shift, buka kasir dulu dengan mengisi modal awal di laci, yaitu uang untuk kembalian.", lambda r: cash(r, "150000")),
        B("Lalu ketuk Buka kasir.", lambda r: r.tap("#fOk", after=900))]},
    {"title": "Layar Jual", "beats": [
        B("Ini layar Jual.", lambda r: tab(r, "jual")),
        B("Di kiri ada daftar menu, lengkap dengan kategori dan pencarian.", lambda r: (at(r, "#cats", 500), r.tap('#cats [data-c="Kopi"]', after=800), r.tap('#cats [data-c="Semua"]', after=500))),
        B("Angka di kartu menu menunjukkan sisa stok, dan menu yang habis tidak bisa dipilih.", lambda r: (at(r, ".item[data-id=cap] .stk", 600), at(r, ".item[data-id=ken]"))),
        B("Di kanan ada pesanan yang sedang dibuat.", lambda r: at(r, ".cart"))]},
    {"title": "Pilih menu dan varian", "beats": [
        B("Ketuk menu untuk menambah pesanan.", lambda r: r.tap(".item[data-id=neb]", after=800)),
        B("Menu yang punya pilihan membuka jendela varian: ukuran, suhu, gula, dan tambahan seperti extra shot.",
          lambda r: (r.tap('#vBody [data-g="size"] [data-i="1"]', after=500), r.tap('#vBody [data-g="sugar"] [data-i="1"]', after=500), r.tap('#vBody [data-g="extra"] [data-i="0"]', after=500))),
        B("Harga tambahan langsung dihitung.", lambda r: at(r, "#vAdd")),
        B("Tulis catatan untuk barista bila perlu, lalu ketuk Tambah.", lambda r: (r.type("#vNote", "Es sedikit"), r.tap("#vAdd", after=800)))]},
    {"title": "Menu tanpa varian", "beats": [
        B("Menu tanpa varian, seperti Roti Bakar, langsung masuk ke pesanan.", lambda r: r.tap(".item[data-id=rot]", after=900)),
        B("Pakai tombol plus dan minus untuk mengubah jumlah.", lambda r: r.tap('#lines [aria-label="Tambah"] >> nth=-1', after=800)),
        B("Atau ketuk nama menu untuk mengubah variannya.", lambda r: at(r, "#lines .line >> nth=0"))]},
    {"title": "Jenis pesanan dan diskon", "beats": [
        B("Pilih jenis pesanan, dine in atau take away.", lambda r: r.tap('#otype [data-t="take"]', after=600)),
        B("Lalu isi nama pelanggan atau nomor meja.", lambda r: r.type("#cname", "Mas Rizal")),
        B("Ketuk Tambah diskon untuk memberi potongan dalam persen atau rupiah.", lambda r: (r.tap("#discBtn", after=700), r.tap("#dcQuick button >> nth=0", after=700), r.tap("#dcOk", after=700)))]},
    {"title": "Bayar tunai", "beats": [
        B("Ketuk Bayar.", lambda r: r.tap("#payBtn", after=800)),
        B("Pilih metode: tunai, QRIS, atau debit dan transfer.", lambda r: at(r, "#methods")),
        B("Untuk tunai, ketuk nominal cepat atau ketik dengan tombol angka.", lambda r: r.tap("#quick button >> nth=1", after=700)),
        B("Kembalian dihitung otomatis.", lambda r: (at(r, "#pChange", 600), r.tap("#payOk", after=900)))]},
    {"title": "Struk dan nomor antrean", "beats": [
        B("Pembayaran berhasil, dan pelanggan mendapat nomor antrean.", lambda r: at(r, "#dnQ")),
        B("Struk bisa dicetak ke printer thermal.", lambda r: (r.tap("#dnPrint", after=900), at(r, "#paper", 1200), r.tap("#dPaper [data-close]", after=500))),
        B("Atau dikirim lewat WhatsApp.", lambda r: at(r, "#dnWa")),
        B("Lalu ketuk Transaksi baru untuk pelanggan berikutnya.", lambda r: r.tap("#dDone [data-close]", after=800))]},
    {"title": "Simpan pesanan (open bill)", "beats": [
        B("Pelanggan dine in yang mau bayar belakangan? Buat pesanannya.",
          lambda r: (r.tap('#otype [data-t="dine"]', after=500), r.type("#cname", "Meja 4"), r.tap(".item[data-id=teh]", after=800), r.tap("#vAdd", after=600), r.tap(".item[data-id=cro]", after=600))),
        B("Lalu ketuk Simpan.", lambda r: r.tap("#holdBtn", after=1000)),
        B("Pesanan langsung dikirim ke barista, tapi belum dihitung sebagai penjualan sampai dibayar.", lambda r: at(r, "#heldBtn"))]},
    {"title": "Bayar pesanan tersimpan", "beats": [
        B("Semua pesanan yang belum dibayar ada di tombol Pesanan tersimpan.", lambda r: (r.tap("#heldBtn", after=800), at(r, "#hBody table"))),
        B("Saat pelanggan selesai, ketuk Bayar.", lambda r: r.tap('#hBody [data-pay="0"]', after=800)),
        B("Kali ini kita bayar dengan QRIS.", lambda r: (r.tap('#methods [data-m="QRIS"]', after=700), at(r, "#noncashBox"))),
        B("Setelah pelanggan scan, ketuk Pembayaran diterima.", lambda r: (r.tap("#payOk", after=900), r.tap("#dDone [data-close]", after=700)))]},
    {"title": "Antrean barista", "beats": [
        B("Buka menu Antrean.", lambda r: tab(r, "antrean")),
        B("Barista melihat pesanan dalam tiga kolom: baru, sedang dibuat, dan selesai.", lambda r: at(r, ".board")),
        B("Ketuk Mulai buat.", lambda r: r.tap('#colNew [data-a="make"] >> nth=0', after=900)),
        B("Lalu ketuk Selesai, panggil saat minuman sudah siap.", lambda r: (r.tap('#colMake [data-a="done"] >> nth=0', after=900), at(r, "#colDone")))]},
    {"title": "Pesanan dari Agi Mas", "beats": [
        B("Pesanan dari aplikasi Agi Mas juga masuk ke antrean ini, dengan bunyi notifikasi. Di demo ini kita simulasikan.", lambda r: (r.tap("#simOrder", after=1200), at(r, ".tk.agimas"))),
        B("Setelah dibuat, ketuk Siap diambil driver.", lambda r: (r.tap('.tk.agimas [data-a="make"]', after=900), r.tap('.tk.agimas [data-a="done"]', after=900))),
        B("Pesanan tercatat sebagai penjualan Agi Mas.")]},
    {"title": "Riwayat transaksi", "beats": [
        B("Menu Riwayat berisi semua transaksi.", lambda r: tab(r, "riwayat")),
        B("Ketuk satu transaksi untuk melihat detailnya.", lambda r: (r.tap("#txList button >> nth=0", after=800), at(r, "#txDetail"))),
        B("Dari sini struk bisa dicetak ulang atau dikirim lewat WhatsApp.", lambda r: (at(r, '#txDetail [data-r="print"]', 500), at(r, '#txDetail [data-r="wa"]'))),
        B("Transaksi juga bisa dibatalkan dengan alasan, dan stoknya otomatis kembali.", lambda r: at(r, '#txDetail [data-r="void"]'))]},
    {"title": "Laporan dan rentang waktu", "beats": [
        B("Menu Laporan menampilkan penjualan bersih, jumlah transaksi, menu terlaris, dan pembagian per metode bayar.", lambda r: (tab(r, "laporan"), at(r, "#stats"))),
        B("Untuk demo, kita isi contoh data dua minggu.", lambda r: r.tap("#seedDemo", after=1000)),
        B("Penjualan per hari tampil dengan grafik batang.", lambda r: at(r, "#dailyCard")),
        B("Pilih rentang waktu: hari ini, kemarin, tujuh hari, tiga puluh hari, bulan ini, atau tanggal sendiri.", lambda r: (at(r, '#v-laporan [data-rp="7d"]', 500), r.tap('#v-laporan [data-rp="30d"]', after=900)))]},
    {"title": "Ekspor ke Excel", "beats": [
        B("Laporan dan riwayat bisa diekspor sesuai rentang waktu yang dipilih.", lambda r: r.tap("#expRep", after=1000)),
        B("Ada ekspor laporan, ekspor transaksi, dan ekspor rincian item.", lambda r: (tab(r, "riwayat"), r.tap("#expTx", after=800), r.tap("#expItems", after=800))),
        B("Filenya langsung rapi saat dibuka di Excel.")]},
    {"title": "Kas dan tutup kasir", "beats": [
        B("Catat uang keluar atau masuk dari laci, misalnya beli es batu.",
          lambda r: (tab(r, "laporan"), r.tap('#v-laporan [data-rp="today"]', after=600), r.tap("#moveBtn", after=800), r.type("#fCash", "20000"), r.type("#fNote", "Beli es batu"), r.tap("#fOk", after=800))),
        B("Di akhir shift, ketuk Tutup kasir dan masukkan uang yang dihitung di laci.", lambda r: (r.tap("#closeShift", after=800), cash(r, "245000"))),
        B("Aplikasi langsung menunjukkan selisihnya.", lambda r: (at(r, "#fDiff"), r.tap("#fOk", after=800)))]},
    {"title": "Bantuan dan printer", "beats": [
        B("Menu Bantuan berisi kontak pengembang, cara pakai, dan pertanyaan umum.", lambda r: (tab(r, "bantuan"), at(r, ".helpgrid .card >> nth=0"))),
        B("Di sini juga ada panduan menyambungkan printer thermal Bluetooth.", lambda r: at(r, "#printerHelp .steps")),
        B("Siapkan kertas, pasangkan printer lewat Bluetooth tablet, lalu ketuk Tes cetak untuk memastikan hasilnya rapi.",
          lambda r: (r.tap("#testPrint", after=800), at(r, "#paper", 1200), r.tap("#dPaper [data-close]", after=500)))]},
    {"title": "Terima kasih!", "card": CARD_OUT, "settle": 0, "pad": 1.5, "beats": [
        B("Itulah tutorial Saget Kasir.", lambda r: r.hide_cursor()),
        B("Semua fitur ini bisa dipakai di satu tablet, dan terhubung langsung dengan pesanan dari Agi Mas."),
        B("Terima kasih sudah menonton.")]},
]

if __name__ == "__main__":
    print("narasi total", round(tts(SCENES, HERE / "audio-kasir")), "detik")
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=r"C:\Program Files\Google\Chrome\Application\chrome.exe")
        c = b.new_context(viewport={"width": VW, "height": VH}, record_video_dir=str(HERE / ("raw-kasir-story" if STORY else "raw-kasir")), record_video_size={"width": VW, "height": VH},
                          accept_downloads=True, locale="id-ID", timezone_id="Asia/Jakarta")
        pg = c.new_page(); errs = []
        pg.on("pageerror", lambda e: errs.append(str(e))); pg.on("dialog", lambda d: d.accept()); pg.on("popup", lambda pp: pp.close())
        rec = Rec(pg)
        pg.goto(ROOT + "stage.html?mode=kasir" + ("&fmt=story" if STORY else "")); pg.wait_for_timeout(800)
        rec.run(SCENES)
        video = pg.video; c.close(); webm = video.path(); b.close()
    print("error JS:", errs[:3])
    if STORY:
        sdir = OUT / "story"; sdir.mkdir(exist_ok=True)
        full = sdir / "tutorial-saget-kasir-story-penuh.mp4"
        rel, total = mux(webm, rec.beats, full)
        split_parts(full, rel, rec.beats, total, sdir / "tutorial-saget-kasir-story")
    else:
        rel, total = mux(webm, rec.beats, OUT / "tutorial-saget-kasir.mp4")
        srt(rel, rec.beats, OUT / "tutorial-saget-kasir.srt")
