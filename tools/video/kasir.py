"""Video tutorial demo Saget Kasir (contoh toko: Lingkar Kopi) -> D:/HU/AgiMasApp/promo/video/tutorial-saget-kasir.mp4"""
import pathlib
from playwright.sync_api import sync_playwright
import sys
from vidlib import HERE, Rec, tts, serve, mux, srt, split_parts
STORY = "story" in sys.argv   # python kasir.py story -> Instagram Story 1080x1920, dipotong per 60 detik
VW, VH = (1080, 1920) if STORY else (1920, 1080)

OUT = pathlib.Path("D:/HU/AgiMasApp/promo/video"); OUT.mkdir(parents=True, exist_ok=True)
ROOT = serve({"/app/": "D:/HU/AgiMasApp/dist", "/kasir/": "D:/HU/AgiMasApp/promo/kasir", "/tfonts/": "D:/HU/AgiMasApp/tools/fonts", "/": str(HERE)}, 18812)

def W(r, ms): r.pg.wait_for_timeout(ms)
def at(r, sel, ms=1200): r.point(r.f.locator(sel).first); W(r, ms)
def tab(r, v): r.tap(f'.tabs [data-v="{v}"]', after=800)

def s_intro(r):
    r.pg.evaluate("u => loadApp(u)", ROOT + "kasir/kasir-lingkar-demo.html")
    r.f.locator("#dForm[open]").wait_for(timeout=30000); W(r, 500)

def s_open(r):
    c = r.f.locator("#fCash"); r.tap(c, after=200); c.fill(""); c.press_sequentially("150000", delay=110); W(r, 600)
    r.tap("#fOk", after=900)

def s_jual(r):
    tab(r, "jual"); at(r, "#cats", 1500); r.tap('#cats [data-c="Kopi"]', after=1200)
    at(r, ".item[data-id=cap] .stk", 1800)
    r.tap('#cats [data-c="Semua"]', after=900)
    at(r, ".item[data-id=ken]", 1500)
    at(r, ".cart", 1500)

def s_var(r):
    r.tap(".item[data-id=neb]", after=900)
    r.tap('#vBody [data-g="size"] [data-i="1"]', after=700)
    r.tap('#vBody [data-g="sugar"] [data-i="1"]', after=700)
    r.tap('#vBody [data-g="extra"] [data-i="0"]', after=900)
    r.type("#vNote", "Es sedikit")
    r.tap("#vAdd", after=900)

def s_plain(r):
    r.tap(".item[data-id=rot]", after=900)
    r.tap('#lines [aria-label="Tambah"] >> nth=-1', after=900)
    at(r, "#lines .line >> nth=0", 1500)

def s_disc(r):
    r.tap('#otype [data-t="take"]', after=700)
    r.type("#cname", "Mas Rizal")
    r.tap("#discBtn", after=800)
    r.tap("#dcQuick button >> nth=0", after=900)
    r.tap("#dcOk", after=900)
    at(r, "#total", 1200)

def s_pay(r):
    r.tap("#payBtn", after=900)
    at(r, "#methods", 1500)
    r.tap("#quick button >> nth=1", after=900)
    at(r, "#pChange", 1500)
    r.tap("#payOk", after=1000)

def s_receipt(r):
    at(r, "#dnQ", 1500)
    r.tap("#dnPrint", after=1000)
    at(r, "#paper", 3500)
    r.tap("#dPaper [data-close]", after=700)
    at(r, "#dnWa", 1200)
    r.tap("#dDone [data-close]", after=800)

def s_hold(r):
    r.tap('#otype [data-t="dine"]', after=600)
    r.type("#cname", "Meja 4")
    r.tap(".item[data-id=teh]", after=900); r.tap("#vAdd", after=800)
    r.tap(".item[data-id=cro]", after=800)
    r.tap("#holdBtn", after=1200)
    at(r, "#heldBtn", 1000)

def s_heldpay(r):
    r.tap("#heldBtn", after=900)
    at(r, "#hBody table", 1500)
    r.tap('#hBody [data-pay="0"]', after=900)
    r.tap('#methods [data-m="QRIS"]', after=900)
    at(r, "#noncashBox", 2000)
    r.tap("#payOk", after=1200)
    r.tap("#dDone [data-close]", after=800)

def s_queue(r):
    tab(r, "antrean"); at(r, ".board", 1500)
    r.tap('#colNew [data-a="make"] >> nth=0', after=1200)
    r.tap('#colMake [data-a="done"] >> nth=0', after=1200)
    at(r, "#colDone", 1000)

def s_agimas(r):
    r.tap("#simOrder", after=1500)
    at(r, ".tk.agimas", 2000)
    r.tap('.tk.agimas [data-a="make"]', after=1200)
    r.tap('.tk.agimas [data-a="done"]', after=1500)

def s_hist(r):
    tab(r, "riwayat")
    r.tap("#txList button >> nth=0", after=900)
    at(r, "#txDetail", 2000)
    at(r, '#txDetail [data-r="print"]', 1000)
    at(r, '#txDetail [data-r="void"]', 1200)

def s_report(r):
    tab(r, "laporan"); at(r, "#stats", 1800)
    r.tap("#seedDemo", after=1200)
    at(r, '#v-laporan [data-rp="7d"]', 1000)
    at(r, "#dailyCard", 2500)
    r.scroll("#v-laporan", 500, 1200)
    at(r, "#best", 1500)
    r.scroll("#v-laporan", -800, 1000)
    r.tap('#v-laporan [data-rp="30d"]', after=1500)

def s_export(r):
    r.tap("#expRep", after=1500)
    tab(r, "riwayat")
    at(r, "#v-riwayat .rangebar", 1200)
    r.tap("#expTx", after=1200)
    r.tap("#expItems", after=1200)

def s_close(r):
    tab(r, "laporan"); r.tap('#v-laporan [data-rp="today"]', after=800)
    r.tap("#moveBtn", after=900)
    r.type("#fCash", "20000"); r.type("#fNote", "Beli es batu")
    r.tap("#fOk", after=1000)
    r.tap("#closeShift", after=900)
    c = r.f.locator("#fCash"); r.tap(c, after=200); c.fill(""); c.press_sequentially("245000", delay=110)
    at(r, "#fDiff", 2000)
    r.tap("#fOk", after=1000)

def s_help(r):
    tab(r, "bantuan"); at(r, ".helpgrid .card >> nth=0", 1500)
    at(r, "#printerHelp .steps", 3000)
    r.tap("#testPrint", after=900); at(r, "#paper", 2500)
    r.tap("#dPaper [data-close]", after=700)

def s_outro(r): r.hide_cursor()


CARD_IN = {"k": "Video tutorial", "h": "Saget Kasir", "p": "Aplikasi kasir untuk kedai dan kafe: jual, antrean barista, pesanan Agi Mas, dan laporan dalam satu tablet"}
SCENES = [
    {"title": "Tutorial Saget Kasir", "act": s_intro, "card": CARD_IN,
     "say": "Halo, selamat datang di tutorial Saget Kasir, aplikasi kasir untuk kedai dan kafe. Di video ini kita pakai contoh toko Lingkar Kopi. Aplikasi ini dipakai di tablet kasir untuk mencatat penjualan, mengatur antrean barista, menerima pesanan dari Agi Mas, sampai membuat laporan. Mari kita mulai."},
    {"title": "Buka kasir", "act": s_open,
     "say": "Setiap awal shift, buka kasir dulu dengan mengisi modal awal di laci, yaitu uang untuk kembalian. Ketik jumlahnya, lalu ketuk Buka kasir."},
    {"title": "Layar Jual", "act": s_jual,
     "say": "Ini layar Jual. Di kiri ada daftar menu, lengkap dengan kategori dan pencarian. Angka di kartu menu menunjukkan sisa stok, dan menu yang habis tidak bisa dipilih. Di kanan ada pesanan yang sedang dibuat."},
    {"title": "Pilih menu dan varian", "act": s_var,
     "say": "Ketuk menu untuk menambah pesanan. Menu yang punya pilihan membuka jendela varian: ukuran, suhu, gula, dan tambahan seperti extra shot. Harga tambahan langsung dihitung. Tulis catatan untuk barista bila perlu, lalu ketuk Tambah."},
    {"title": "Menu tanpa varian", "act": s_plain,
     "say": "Menu tanpa varian, seperti Roti Bakar, langsung masuk ke pesanan. Pakai tombol plus dan minus untuk mengubah jumlah, atau ketuk nama menu untuk mengubah variannya."},
    {"title": "Jenis pesanan dan diskon", "act": s_disc,
     "say": "Pilih jenis pesanan, dine in atau take away, lalu isi nama pelanggan atau nomor meja. Ketuk Tambah diskon untuk memberi potongan dalam persen atau rupiah."},
    {"title": "Bayar tunai", "act": s_pay,
     "say": "Ketuk Bayar. Pilih metode: tunai, QRIS, atau debit dan transfer. Untuk tunai, ketuk nominal cepat atau ketik dengan tombol angka. Kembalian dihitung otomatis."},
    {"title": "Struk dan nomor antrean", "act": s_receipt,
     "say": "Pembayaran berhasil, dan pelanggan mendapat nomor antrean. Struk bisa dicetak ke printer thermal, atau dikirim lewat WhatsApp. Lalu ketuk Transaksi baru untuk pelanggan berikutnya."},
    {"title": "Simpan pesanan (open bill)", "act": s_hold,
     "say": "Pelanggan dine in yang mau bayar belakangan? Buat pesanannya, lalu ketuk Simpan. Pesanan langsung dikirim ke barista, tapi belum dihitung sebagai penjualan sampai dibayar."},
    {"title": "Bayar pesanan tersimpan", "act": s_heldpay,
     "say": "Semua pesanan yang belum dibayar ada di tombol Pesanan tersimpan. Saat pelanggan selesai, ketuk Bayar. Kali ini kita bayar dengan QRIS, lalu ketuk Pembayaran diterima setelah pelanggan scan."},
    {"title": "Antrean barista", "act": s_queue,
     "say": "Buka menu Antrean. Barista melihat pesanan dalam tiga kolom: baru, sedang dibuat, dan selesai. Ketuk Mulai buat, lalu ketuk Selesai, panggil saat minuman sudah siap."},
    {"title": "Pesanan dari Agi Mas", "act": s_agimas,
     "say": "Pesanan dari aplikasi Agi Mas juga masuk ke antrean ini, dengan bunyi notifikasi. Di demo ini kita simulasikan. Setelah dibuat, ketuk Siap diambil driver. Pesanan tercatat sebagai penjualan Agi Mas."},
    {"title": "Riwayat transaksi", "act": s_hist,
     "say": "Menu Riwayat berisi semua transaksi. Ketuk satu transaksi untuk melihat detailnya, mencetak ulang struk, mengirim WhatsApp, atau membatalkan dengan alasan. Saat dibatalkan, stok otomatis kembali."},
    {"title": "Laporan dan rentang waktu", "act": s_report,
     "say": "Menu Laporan menampilkan penjualan bersih, jumlah transaksi, menu terlaris, dan pembagian per metode bayar. Untuk demo, kita isi contoh data dua minggu. Pilih rentang waktu: hari ini, kemarin, tujuh hari, tiga puluh hari, bulan ini, atau tanggal sendiri."},
    {"title": "Ekspor ke Excel", "act": s_export,
     "say": "Laporan dan riwayat bisa diekspor sesuai rentang waktu yang dipilih. Ada ekspor laporan, ekspor transaksi, dan ekspor rincian item. Filenya langsung rapi saat dibuka di Excel."},
    {"title": "Kas dan tutup kasir", "act": s_close,
     "say": "Catat uang keluar atau masuk dari laci, misalnya beli es batu, lewat tombol Kas masuk atau keluar. Di akhir shift, ketuk Tutup kasir, masukkan uang yang dihitung di laci, dan aplikasi menunjukkan selisihnya."},
    {"title": "Bantuan dan printer", "act": s_help,
     "say": "Menu Bantuan berisi kontak pengembang, cara pakai, dan pertanyaan umum. Di sini juga ada panduan menyambungkan printer thermal Bluetooth: siapkan kertas, pasangkan printer lewat Bluetooth tablet, lalu ketuk Tes cetak untuk memastikan hasilnya rapi."},
    {"title": "Terima kasih!", "act": s_outro, "card": {"k": "Saget Kasir", "h": "Terima kasih!", "p": "Terhubung langsung dengan pesanan Agi Mas"},
     "say": "Itulah tutorial Saget Kasir. Semua fitur ini bisa dipakai di satu tablet, dan terhubung langsung dengan pesanan dari Agi Mas. Terima kasih sudah menonton.", "pad": 1.5},
]

if __name__ == "__main__":
    tts(SCENES, HERE / "audio-kasir")
    print("narasi total", round(sum(s["dur"] for s in SCENES)), "detik")
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=r"C:\Program Files\Google\Chrome\Application\chrome.exe")
        c = b.new_context(viewport={"width": VW, "height": VH}, record_video_dir=str(HERE / ("raw-kasir-story" if STORY else "raw-kasir")), record_video_size={"width": VW, "height": VH},
                          accept_downloads=True, locale="id-ID", timezone_id="Asia/Jakarta")
        pg = c.new_page(); errs = []
        pg.on("pageerror", lambda e: errs.append(str(e))); pg.on("dialog", lambda d: d.accept()); pg.on("popup", lambda pp: pp.close())
        rec = Rec(pg)
        pg.goto(ROOT + "stage.html?mode=kasir" + ("&fmt=story" if STORY else "")); pg.wait_for_timeout(800)
        rec.run(SCENES, len(SCENES))
        video = pg.video; c.close(); webm = video.path(); b.close()
    print("error JS:", errs[:3])
    if STORY:
        sdir = OUT / "story"; sdir.mkdir(exist_ok=True)
        full = sdir / "tutorial-saget-kasir-story-penuh.mp4"
        mux(webm, rec.marks, rec.end, full)
        split_parts(full, rec.marks, rec.end, sdir / "tutorial-saget-kasir-story")
    else:
        mux(webm, rec.marks, rec.end, OUT / "tutorial-saget-kasir.mp4")
        srt(rec.marks, OUT / "tutorial-saget-kasir.srt")
