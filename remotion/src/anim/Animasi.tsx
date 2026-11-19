// Video animasi ilustrasi 2D: data & narasi sama dengan versi Remotion lain (src/gen/*.json), jadi durasi tiap kalimat = durasi suaranya.
import React from "react";
import { AbsoluteFill, Img, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { Data, Line, Theme, Fonts, audio } from "../theme";
import { CW, CH, Ctx, lin } from "./prim";
import * as S from "./scenes";

type Comp = React.FC<{ c: Ctx }>;
const ICON4: [string, string, string][] = [["bike", "Agi Antar", "#1e7be6"], ["box", "Agi Kirim", "#e9a800"], ["bag", "Agi Beli", "#16a34a"], ["brush", "Agi Bersih", "#7c5cd6"]];

/** Ilustrasi untuk tiap adegan tutorial (judul adegan di data) dan tiap kalimat promosi/deskripsi (judul slide). */
const TUT: Record<string, Comp> = {
  "Tutorial Agi Mas": ({ c }) => <S.Logo c={c} city />, "Kenali Beranda": S.AgHome, "Agi Antar: titik jemput": S.AgPick, "Pilih tujuan": S.AgTo,
  "Harga keluar otomatis": S.AgPrice, "Cek ringkasan pesanan": S.AgSummary, "Bayar pakai QRIS": S.AgQris, "Kirim ke admin": S.AgSend,
  "Agi Kirim: kirim barang": S.AgKirim, "Agi Beli dari mitra": S.AgMitra, "Detail menu dan catatan": S.AgDetail, "Keranjang": S.AgCart,
  "Alamat antar dan kirim": S.AgBeliSend, "Agi Bersih": S.AgBersih, "Beri ulasan": S.AgUlasan, "Bantuan dan info": S.AgBantuan, "Selamat mencoba!": ({ c }) => <S.Logo c={c} city />,
  "Tutorial Saget Kasir": S.KIntro, "Buka kasir": S.KOpen, "Layar Jual": S.KJual, "Pilih menu dan varian": S.KVar, "Menu tanpa varian": S.KPlain,
  "Jenis pesanan dan diskon": S.KDisc, "Bayar tunai": S.KPay, "Struk dan nomor antrean": S.KReceipt, "Simpan pesanan (open bill)": S.KHold,
  "Bayar pesanan tersimpan": S.KHeldPay, "Antrean barista": S.KQueue, "Pesanan dari Agi Mas": S.KAgimas, "Riwayat transaksi": S.KHist,
  "Laporan dan rentang waktu": S.KReport, "Ekspor ke Excel": S.KExport, "Kas dan tutup kasir": S.KClose, "Bantuan dan printer": S.KHelp, "Terima kasih!": ({ c }) => <S.Logo c={c} />,
};
const SLIDE: Record<string, Record<string, Comp>> = {
  agimas: {
    "Antar, beli, bantu.": S.AgHome, "Agi Mas": ({ c }) => <S.Logo c={c} city />, "Harga langsung keluar": S.AgPrice, "Pesan dari mitra": S.AgCart,
    "Tunai atau QRIS": S.AgQris, "Langsung ke admin": S.AgSend, "Tentang Agi Mas": ({ c }) => <S.Logo c={c} city />,
    "Empat layanan utama": ({ c }) => <S.Badges c={c} items={ICON4} />,
    "Cara kerjanya": ({ c }) => <S.Flow c={c} color={c.theme.brand} items={[["tag", "Pesan di aplikasi"], ["chat", "WhatsApp admin"], ["bike", "Driver terdekat berangkat"]]} />,
    "Bayar tunai atau QRIS": S.AgQris, "Mitra usaha lokal": S.AgMitra,
    "Untuk pelanggan & admin": ({ c }) => <S.Badges c={c} items={[["user", "Aplikasi Android", "#1e7be6"], ["home", "Aplikasi web iPhone", "#0f5bb5"], ["chart", "Panel admin", "#0b3d8c"]]} />,
    "Dibangun dengan layanan gratis": ({ c }) => <S.Badges c={c} items={[["home", "Peta OpenStreetMap", "#16a34a"], ["refresh", "Firebase gratis", "#e9a800"], ["store", "Netlify", "#0f5bb5"], ["bike", "Capacitor Android", "#1e7be6"]]} />,
  },
  kasir: {
    "Masih pakai buku?": S.KBook, "Saget Kasir": ({ c }) => <S.Logo c={c} />, "Varian & catatan": S.KVar, "Bayar & cetak struk": S.KReceipt,
    "Antrean barista": S.KQueue, "Laporan otomatis": S.KReport, "Coba demonya": ({ c }) => <S.Logo c={c} />, "Tentang Saget Kasir": S.KIntro,
    "Alur satu shift": ({ c }) => <S.Flow c={c} color={c.theme.brand} items={[["wallet", "Buka kasir"], ["store", "Jual & bayar"], ["clock", "Tutup kasir"]]} />,
    "Bayar langsung atau open bill": S.KHold, "Terhubung dengan Agi Mas": S.KAgimas, "Laporan lengkap": S.KReport, "Bantuan & printer thermal": S.KHelp,
    "Status saat ini": ({ c }) => <S.Badges c={c} items={[["store", "Demo di browser tablet", "#1f6b45"], ["down", "Siap jadi aplikasi Android", "#173f2e"], ["refresh", "Terhubung dengan Agi Mas", "#1e7be6"]]} />,
  },
};

/** Bingkai video: kiri judul & narasi (sorot kalimat aktif), kanan kanvas ilustrasi; vertikal: atas-tengah-bawah. */
const Frame: React.FC<{ theme: Theme; vertical: boolean; chip?: string; title: string; says: string[]; cur: number; children: React.ReactNode }> = ({ theme, vertical, chip, title, says, cur, children }) => {
  const f = useCurrentFrame(), k = vertical ? 0.9 : 0.86;
  const rise = { opacity: lin(f, 0, 12), transform: `translateY(${(1 - lin(f, 0, 12)) * 20}px)` };
  return (
    <AbsoluteFill style={{ fontFamily: theme.font, background: `linear-gradient(160deg,#fff 0%,${theme.light} 100%)`, color: theme.ink }}>
      <div style={{ position: "absolute", left: vertical ? 0 : 860, top: vertical ? 440 : (1080 - CH * k) / 2, width: CW * k, height: CH * k, borderRadius: 36, overflow: "hidden", background: "#fff",
        boxShadow: "0 30px 70px -36px rgba(11,37,69,.45)" }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: CW, height: CH, transform: `scale(${k})`, transformOrigin: "0 0" }}>{children}</div>
      </div>
      <div style={{ position: "absolute", left: vertical ? 70 : 80, top: vertical ? 80 : 110, width: vertical ? 940 : 720, display: "flex", flexDirection: "column", gap: 18 }}>
        <Img src={staticFile(theme.logo)} style={{ width: vertical ? 300 : 280 }} />
        {chip && <div style={{ ...rise, alignSelf: "flex-start", padding: "8px 18px", borderRadius: 99, background: theme.brand, color: "#fff", fontWeight: 700, fontSize: 22 }}>{chip}</div>}
        <div style={{ ...rise, fontSize: vertical ? 54 : 58, fontWeight: 800, letterSpacing: "-.02em", lineHeight: 1.08 }}>{title}</div>
        {!vertical && <div style={{ fontSize: 30, lineHeight: 1.5, fontWeight: 500 }}>{says.map((s, i) => <span key={i} style={{ color: i === cur ? theme.ink : "#9aa9bb" }}>{s} </span>)}</div>}
      </div>
      {vertical && <div style={{ position: "absolute", left: 70, right: 70, top: 1300, fontSize: 34, lineHeight: 1.45, fontWeight: 500 }}>{says.map((s, i) => <span key={i} style={{ color: i === cur ? theme.ink : "#9aa9bb" }}>{s} </span>)}</div>}
    </AbsoluteFill>
  );
};

export const animTutorialFrames = (d: Data) => d.tutorial.reduce((a, s) => a + s.beats.reduce((b, x) => b + x.frames, 0), 0);
export const animSlidesFrames = (lines: Line[]) => lines.reduce((a, l) => a + l.frames, 0);

/** Satu adegan tutorial: ilustrasi berjalan terus selama adegan, tahapnya maju setiap kalimat (frame awal kalimat dari data). */
const TutScene: React.FC<{ d: Data; theme: Theme; si: number; vertical: boolean }> = ({ d, theme, si, vertical }) => {
  const f = useCurrentFrame(), sc = d.tutorial[si];
  let b = 0, start = 0, acc = 0;
  sc.beats.forEach((x, k) => { if (f >= acc) { b = k; start = acc; } acc += x.frames; });
  const C = TUT[sc.title] || S.AgBantuan, real = d.tutorial.length - 2;
  const c: Ctx = { f, b, fb: f - start, theme, app: d.app };
  return (
    <Frame theme={theme} vertical={vertical} chip={sc.card ? sc.card.k : `Langkah ${si} dari ${real}`} title={sc.card ? sc.card.h : sc.title} says={sc.beats.map((x) => x.say)} cur={b}>
      <C c={c} />
    </Frame>
  );
};

export const AnimTutorial: React.FC<{ data: Data; theme: Theme; vertical?: boolean }> = ({ data, theme, vertical = false }) => {
  let t = 0;
  const scenes = data.tutorial.map((sc, si) => { const from = t, len = sc.beats.reduce((a, b) => a + b.frames, 0); t += len; return { si, from, len }; });
  let bt = 0;
  const beats = data.tutorial.flatMap((sc) => sc.beats).map((b) => { const from = bt; bt += b.frames; return { b, from }; });
  return (
    <AbsoluteFill>
      <Fonts />
      {scenes.map(({ si, from, len }) => <Sequence key={si} from={from} durationInFrames={len}><TutScene d={data} theme={theme} si={si} vertical={vertical} /></Sequence>)}
      {beats.map(({ b, from }, k) => <Sequence key={`a${k}`} from={from} durationInFrames={b.frames} layout="none"><Audio src={audio(data.app, b.audio)} /></Sequence>)}
    </AbsoluteFill>
  );
};

/** Slide promosi/deskripsi: satu kalimat; tahap ilustrasi maju otomatis 5 kali sepanjang kalimat. */
const SlideScene: React.FC<{ d: Data; theme: Theme; l: Line; vertical: boolean }> = ({ d, theme, l, vertical }) => {
  const f = useCurrentFrame(), step = Math.max(1, Math.floor(l.frames / 5)), b = Math.min(4, Math.floor(f / step));
  const C = (SLIDE[d.app] || {})[l.head] || (l.qr ? ({ c }: { c: Ctx }) => <S.QrCta c={c} qr={l.qr} /> : ({ c }: { c: Ctx }) => <S.Logo c={c} city={d.app === "agimas"} />);
  return (
    <Frame theme={theme} vertical={vertical} chip={l.sub} title={l.head} says={[l.say]} cur={0}>
      <C c={{ f, b, fb: f - b * step, theme, app: d.app }} />
    </Frame>
  );
};

export const AnimSlides: React.FC<{ data: Data; lines: Line[]; theme: Theme; vertical?: boolean }> = ({ data, lines, theme, vertical = false }) => {
  let t = 0;
  const seq = lines.map((l) => { const from = t; t += l.frames; return { l, from }; });
  return (
    <AbsoluteFill>
      <Fonts />
      {seq.map(({ l, from }, k) => (
        <Sequence key={k} from={from} durationInFrames={l.frames}>
          <Audio src={audio(data.app, l.audio)} />
          <SlideScene d={data} theme={theme} l={l} vertical={vertical} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
