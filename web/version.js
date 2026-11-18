// Versi aplikasi: satu-satunya tempat. build.gradle membaca versionName dari sini.
window.AGIMAS_VERSION = "3.8";
// Catatan pembaruan (terbaru di atas), ditampilkan di jendela "Yang baru" dan saat ada versi baru.
// Tambahkan entri baru di atas setiap menaikkan AGIMAS_VERSION.
// Format JSON murni (kunci dan teks pakai tanda kutip dua), karena APK membacanya dari server dengan JSON.parse.
window.AGIMAS_CHANGES = [
  { "v": "3.8", "items": [
    "Keranjang: pilih menu mitra, ubah jumlah, dan beri catatan per menu. Isinya tetap tersimpan walau aplikasi ditutup.",
    "Ketuk menu untuk melihat foto lebih besar dan informasi lengkapnya.",
    "Bayar tunai ke driver atau QRIS dengan nominal yang sudah terisi otomatis.",
    "Setiap pesanan punya kode pesanan, memudahkan admin mengecek pesanan Anda.",
    "Jam buka mitra tampil di kartu dan menu; saat tutup, keranjang tetap tersimpan.",
    "Ulasan tampil per halaman, dan driver terdekat selalu dari status terbaru."
  ] },
  { "v": "3.7", "items": [
    "Beranda lebih ringkas: Makanan & Minuman dan Kebutuhan Harian digabung jadi satu, Agi Beli.",
    "Pesan dari mitra: lokasi ambil otomatis di alamat mitra dan tanpa biaya berat barang."
  ] },
  { "v": "3.6", "items": [
    "Menu mitra kini dilengkapi foto, dikelompokkan Makanan dan Minuman.",
    "Kartu mitra di Beranda lebih jelas: foto menu, harga mulai, dan tombol Pesan.",
    "Tampilan ringkasan pesanan lebih rapi."
  ] },
  { "v": "3.5", "items": [
    "Siap untuk mitra Agimas: pesan menu mitra langsung dari aplikasi, cukup pilih menu dan jumlahnya.",
    "Total harga menu + ongkir dihitung otomatis, menu yang habis tidak bisa dipilih.",
    "Stok dicek ulang sebelum pesanan dikirim ke admin."
  ] },
  { "v": "3.4", "items": [
    "Semua ulasan pelanggan tampil di tab Ulasan, terbaru di atas.",
    "Rata-rata bintang beserta persentase dan jumlah ulasan untuk tiap bintang.",
    "Ulasan tanpa nama tampil sebagai Anonim."
  ] },
  { "v": "3.3.1", "items": [
    "Judul jendela Yang baru kini sejajar dengan ikonnya."
  ] },
  { "v": "3.3", "items": [
    "Kartu sorotan di Beranda (Agimas Murah, KDMP, Admin, Kata pelanggan) kini berikon.",
    "Ada penanda titik di bawah kartu sorotan, tanda bahwa kartu bisa digeser."
  ] },
  { "v": "3.2", "items": [
    "Pembaruan langsung di dalam aplikasi: unduhan dengan progres, tanpa membuka Chrome.",
    "Cukup ketuk Update di layar pemasangan, lalu Buka."
  ] },
  { "v": "3.1", "items": [
    "Aplikasi kembali tersimpan di dalam APK: lebih cepat dibuka dan tanpa badge Netlify.",
    "Ada versi baru? Aplikasi memberi tahu, menampilkan fitur barunya, dan APK bisa diunduh langsung dari aplikasi tanpa scan QR."
  ] },
  { "v": "3.0", "items": [
    "Info fitur baru seperti ini tampil setiap ada pembaruan.",
    "Tombol Cek pembaruan di menu Bantuan."
  ] },
  { "v": "2.9", "items": [
    "Cari toko & usaha: lebih dari 21 ribu warung, toko, apotek, dan bengkel di Madiun dan sekitarnya.",
    "Peta lebih berwarna, mirip Google Maps."
  ] },
  { "v": "2.8", "items": [
    "Layanan baru: Agi Antar, Agi Kirim, Agi Beli (makanan & kebutuhan harian), dan Agi Bersih.",
    "Beri bintang serta kritik & saran di tab Ulasan.",
    "Driver terdekat dicarikan otomatis.",
    "Peta menampilkan patokan: toko, masjid, sekolah, SPBU."
  ] }
];
