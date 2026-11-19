// Ilustrasi 2D per adegan. Setiap komponen menerima Ctx: c.b = kalimat aktif (tahap), c.fb = frame sejak kalimat itu mulai,
// jadi tiap kalimat narasi menggerakkan bagian ilustrasinya sendiri (sinkron dengan suara).
import React from "react";
import { Img, interpolate, staticFile } from "remotion";
import { Abs, Badge, Box, Btn, Chip, Ctx, FakeQR, Icon, Motor, Phone, Pin, Tablet, TapAt, Txt, at, clamp, lin, usePop } from "./prim";

const typed = (text: string, fb: number, speed = 1.6) => text.slice(0, Math.max(0, Math.floor(fb * speed)));

/* ---------------- Latar kota (dipakai pembuka, penutup, Agi Kirim) ---------------- */
export const City: React.FC<{ c: Ctx; road?: boolean }> = ({ c, road = true }) => {
  const { f, theme } = c, sh = (f * 6) % 120;
  const bld = [[0, 220, 120], [130, 300, 90], [230, 180, 140], [380, 340, 100], [490, 250, 130], [630, 310, 90], [730, 200, 150], [890, 280, 110], [1010, 230, 190]];
  return (
    <>
      <Abs x={0} y={0} w={1200} h={900} style={{ background: `linear-gradient(180deg, ${theme.light}, #fff 70%)` }} />
      <Abs x={900} y={80} w={120} h={120} style={{ borderRadius: "50%", background: theme.accent, opacity: 0.85 }} />
      {[0, 1, 2].map((k) => <Abs key={k} x={((k * 430 + f * (1 + k * 0.4)) % 1500) - 200} y={90 + k * 70} w={180} h={50} style={{ borderRadius: 40, background: "#fff", opacity: 0.9 }} />)}
      {bld.map(([x, h, w], k) => <Abs key={k} x={x} y={640 - h} w={w} h={h} style={{ background: theme.brand, opacity: 0.12 + (k % 3) * 0.05, borderRadius: "10px 10px 0 0" }} />)}
      {road && <>
        <Abs x={0} y={640} w={1200} h={260} style={{ background: "#3d4a5c" }} />
        {Array.from({ length: 12 }, (_, k) => <Abs key={k} x={k * 120 - sh} y={760} w={70} h={10} style={{ background: "#fff", borderRadius: 5, opacity: 0.8 }} />)}
      </>}
    </>
  );
};

/* ---------------- Layar aplikasi Agi Mas yang disederhanakan ---------------- */
const AppHome: React.FC<{ c: Ctx; hl: number }> = ({ c, hl }) => {
  const { theme } = c, tiles = [["Agi Antar", "#e6f1fd", "bike"], ["Agi Kirim", "#fff4d6", "box"], ["Agi Beli", "#e3f5ea", "bag"], ["Agi Bersih", "#eee9fc", "brush"]];
  return (
    <>
      <Box x={0} y={0} w={276} h={120} bg={theme.brand} r={0} />
      <Txt x={18} y={22} size={20} color="#fff">Selamat pagi!</Txt>
      <Box x={14} y={60} w={248} h={110} r={16} bg="#eaf3fe"><Txt x={14} y={16} size={17}>Saget{"\n"}sembarang kalir.</Txt><Motor x={140} y={18} w={100} /></Box>
      <Box x={14} y={182} w={248} h={58} r={14} bg="#e4f4ea" style={{ boxShadow: hl === 1 ? `0 0 0 4px ${theme.accent}` : undefined }}><Txt x={14} y={10} size={13} color="#173f2e">"Kak, pesan kopi Lingkar{"\n"}ya, antar ke rumah."</Txt></Box>
      {tiles.map(([n, bg, ic], k) => (
        <Box key={n} x={14 + (k % 2) * 128} y={254 + Math.floor(k / 2) * 98} w={120} h={88} r={14} bg={bg} style={{ boxShadow: hl === 10 + k ? `0 0 0 4px ${theme.accent}` : undefined }}>
          <Abs x={10} y={10}><Icon name={ic} size={26} color="#0b2545" /></Abs><Txt x={10} y={52} size={15}>{n}</Txt>
        </Box>))}
      <Box x={14} y={452} w={248} h={46} r={14} bg="#eef2f7" style={{ boxShadow: hl === 2 ? `0 0 0 4px ${theme.accent}` : undefined }}><Txt x={16} y={12} size={15}>💬 Lainnya</Txt></Box>
    </>
  );
};

export const AgHome: React.FC<{ c: Ctx }> = ({ c }) => {
  const pop = usePop(), p = pop(c.f);
  const hl = c.b === 1 ? 1 : c.b === 2 ? 10 + Math.min(3, Math.floor(c.fb / 25)) : c.b === 3 ? 2 : -1;
  const names = ["Agi Antar", "Agi Kirim", "Agi Beli", "Agi Bersih"], icons = ["bike", "box", "bag", "brush"], cols = ["#1e7be6", "#e9a800", "#16a34a", "#7c5cd6"];
  return (
    <>
      <div style={{ opacity: p, transform: `translateY(${(1 - p) * 60}px)` }}><Phone x={180} y={120} w={300} h={540}><AppHome c={c} hl={hl} /></Phone></div>
      {c.b >= 2 && names.map((n, k) => { const q = c.b > 2 ? 1 : pop(c.fb, k * 25); return <React.Fragment key={n}><Badge x={590} y={150 + k * 130} name={icons[k]} bg={cols[k]} size={92} p={q} /><Txt x={710} y={180 + k * 130} size={40} style={{ opacity: q }}>{n}</Txt></React.Fragment>; })}
      {c.b === 1 && <Chip x={560} y={330} bg={c.theme.dark} p={pop(c.fb)}>Mitra: Lingkar Kopi</Chip>}
      {c.b >= 3 && <Chip x={590} y={700} bg="#1fa855" p={at(c, 3, pop)}>💬 Lainnya: chat admin langsung</Chip>}
    </>
  );
};

/** Layar peta: jalan, pin A/B, rute yang tergambar, kolom cari, tombol GPS & "Pakai lokasi ini". */
const MapScreen: React.FC<{ c: Ctx; a?: number; bp?: number; route?: number; q?: string; gps?: number; ok?: number; store?: boolean }> = ({ c, a = 0, bp = 0, route = 0, q, gps = 0, ok = -1, store }) => {
  const roads = [70, 190, 330, 450], cols = [60, 150, 230];
  const len = 420, d = `M 70 400 L 70 300 L 200 300 L 200 170`;
  return (
    <>
      <Abs x={0} y={0} w={276} h={516} style={{ background: "#eef3ea" }} />
      {roads.map((y) => <Abs key={y} x={0} y={y} w={276} h={14} style={{ background: "#fff" }} />)}
      {cols.map((x) => <Abs key={x} x={x} y={0} w={14} h={516} style={{ background: "#fff" }} />)}
      <Abs x={160} y={30} w={60} h={40} style={{ background: "#cfe8c5", borderRadius: 8 }} />
      <svg width={276} height={516} style={{ position: "absolute", left: 0, top: 0 }}>
        <path d={d} fill="none" stroke={c.theme.brand} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={len} strokeDashoffset={len * (1 - route)} />
      </svg>
      {store ? <Abs x={48} y={366} w={46} h={46} style={{ borderRadius: 14, background: "#173f2e", display: "grid", placeItems: "center", opacity: a, transform: `scale(${a})` }}><Icon name="cup" size={26} color="#8fe0b0" /></Abs>
        : <Pin x={76} y={408} color="#16a34a" p={a} />}
      <Pin x={206} y={176} color="#e9a800" p={bp} />
      {q !== undefined && <Box x={12} y={12} w={252} h={44} r={12} style={{ boxShadow: "0 6px 14px rgba(0,0,0,.12)" }}><Txt x={14} y={12} size={15} color={q ? "#0b2545" : "#9aa9bb"}>🔍 {q || "Cari tempat"}</Txt></Box>}
      {gps > 0 && <Abs x={218} y={380} w={42} h={42} style={{ borderRadius: "50%", background: "#fff", display: "grid", placeItems: "center", boxShadow: `0 0 0 ${gps * 10}px rgba(30,123,230,${0.3 * (1 - gps)})` }}>◎</Abs>}
      {ok >= 0 && <Btn x={14} y={454} w={248} h={46} bg={c.theme.brand} press={ok}>Pakai lokasi ini</Btn>}
    </>
  );
};

export const AgPick: React.FC<{ c: Ctx }> = ({ c }) => {
  const pop = usePop();
  const q = c.b >= 2 ? (c.b === 2 ? typed("Stasiun Madiun", c.fb) : "Stasiun Madiun") : "";
  return (
    <>
      <Phone x={180} y={110} w={300} h={540}>
        {c.b === 0 ? <AppHome c={c} hl={10} /> : <MapScreen c={c} a={at(c, 2, pop, 20)} q={q} gps={c.b === 3 ? (c.fb % 30) / 30 : 0} ok={c.b >= 4 ? lin(c.fb, 0, 8) : 0} />}
      </Phone>
      {c.b === 0 && <TapAt x={180 + 12 + 14 + 60} y={110 + 12 + 254 + 44} f={c.fb} color={c.theme.brand} />}
      {c.b === 4 && <TapAt x={330} y={110 + 12 + 477} f={c.fb} color={c.theme.brand} />}
      <Txt x={560} y={170} size={30} w={560} color={c.theme.dark}>Titik jemput</Txt>
      <Chip x={560} y={230} bg="#16a34a" p={at(c, 2, pop, 20)}>📍 Stasiun Madiun</Chip>
      {c.b >= 3 && <Chip x={560} y={300} bg={c.theme.brand} p={at(c, 3, pop)}>◎ Pakai lokasi saya</Chip>}
      {c.b >= 4 && <Chip x={560} y={370} bg={c.theme.dark} p={at(c, 4, pop)}>✓ Lokasi dipakai</Chip>}
    </>
  );
};

export const AgTo: React.FC<{ c: Ctx }> = ({ c }) => {
  const pop = usePop(), q = c.b >= 1 ? (c.b === 1 ? typed("Alun-alun Kota Madiun", c.fb) : "Alun-alun Kota Madiun") : "";
  return (
    <>
      <Phone x={180} y={110} w={300} h={540}><MapScreen c={c} a={1} bp={at(c, 1, pop, 30)} q={q} ok={c.b >= 2 ? lin(c.fb, 0, 8) : 0} /></Phone>
      <Txt x={560} y={170} size={30} w={560} color={c.theme.dark}>Tujuan</Txt>
      <Chip x={560} y={230} bg="#16a34a">📍 Stasiun Madiun</Chip>
      <Chip x={560} y={300} bg="#e9a800" p={at(c, 1, pop, 30)}>📍 Alun-alun Kota Madiun</Chip>
      {c.b >= 2 && <TapAt x={330} y={110 + 12 + 477} f={c.fb} color={c.theme.brand} />}
    </>
  );
};

export const AgPrice: React.FC<{ c: Ctx }> = ({ c }) => {
  const pop = usePop(), r = c.b > 0 ? 1 : lin(c.fb, 0, 40);
  return (
    <>
      <Phone x={180} y={110} w={300} h={540}>
        <MapScreen c={c} a={1} bp={1} route={r} />
        {c.b >= 1 && <Box x={10} y={300 - (1 - at(c, 1, pop)) * 200} w={256} h={200} r={18} style={{ boxShadow: "0 -6px 18px rgba(0,0,0,.15)" }}>
          <Txt x={14} y={14} size={14} color="#6a7f97">Nama Anda</Txt><Txt x={14} y={36} size={18}>{c.b === 1 ? typed("Budi", c.fb, 0.6) : "Budi"}</Txt>
          <Txt x={14} y={78} size={14} color="#6a7f97">Catatan</Txt><Txt x={14} y={100} size={16}>{c.b === 1 ? typed("Tunggu di pintu keluar", Math.max(0, c.fb - 12)) : "Tunggu di pintu keluar"}</Txt>
          <Btn x={14} y={140} w={228} h={44} bg={c.theme.brand} press={c.b >= 2 ? lin(c.fb, 0, 6) : 0}>Lanjut →</Btn>
        </Box>}
      </Phone>
      <Chip x={560} y={190} bg={c.theme.dark} p={lin(c.f, 30, 45)} size={34}>🛣️ 3 km</Chip>
      <Box x={560} y={290} w={440} h={210} r={28} style={{ opacity: lin(c.f, 45, 60), boxShadow: "0 20px 40px -20px rgba(11,37,69,.4)" }}>
        <Txt x={30} y={28} size={22} color="#6a7f97">Perkiraan harga</Txt>
        <Txt x={30} y={70} size={72} color={c.theme.brand} weight={800}>Rp 5.500</Txt>
        <Txt x={30} y={160} size={18} color="#6a7f97">dihitung otomatis dari rute jalan</Txt>
      </Box>
      {c.b >= 2 && <TapAt x={330} y={110 + 12 + 300 + 162} f={c.fb} color={c.theme.brand} />}
    </>
  );
};

export const AgSummary: React.FC<{ c: Ctx }> = ({ c }) => {
  const pop = usePop(), rad = (c.f % 45) / 45;
  return (
    <>
      <Box x={90} y={130} w={460} h={260} r={28} style={{ opacity: pop(c.f), boxShadow: "0 20px 40px -24px rgba(11,37,69,.45)" }}>
        <Txt x={30} y={26} size={20} color="#6a7f97">Ringkasan · Agi Antar</Txt>
        <Txt x={30} y={74} size={26}>🟢 Parkir Stasiun Madiun</Txt><Txt x={30} y={124} size={26}>🟡 Alun-alun Kota Madiun</Txt>
        <Txt x={30} y={186} size={40} color={c.theme.brand} weight={800}>Rp 5.500</Txt>
      </Box>
      {c.b >= 1 && <Abs x={660} y={140} w={420} h={420} style={{ opacity: at(c, 1, pop) }}>
        <Abs x={210 - 180 * (0.3 + rad)} y={210 - 180 * (0.3 + rad)} w={360 * (0.3 + rad)} h={360 * (0.3 + rad)} style={{ borderRadius: "50%", border: `4px solid ${c.theme.brand}`, opacity: 1 - rad }} />
        <Pin x={210} y={220} color="#16a34a" p={1} />
        {[[40, 60], [330, 110], [90, 330]].map(([x, y], k) => <Abs key={k} x={x} y={y} w={64} h={64} style={{ borderRadius: "50%", background: k === 0 ? c.theme.brand : "#cfd9e6", display: "grid", placeItems: "center", boxShadow: k === 0 ? `0 0 0 6px ${c.theme.accent}` : undefined }}><Icon name="bike" size={34} color="#fff" /></Abs>)}
        <Chip x={0} y={0} bg={c.theme.dark}>Driver terdekat</Chip>
      </Abs>}
      {c.b >= 2 && <>
        <Box x={90} y={450} w={220} h={90} r={22} style={{ opacity: at(c, 2, pop), border: "3px solid #cfd9e6" }}><Txt x={0} y={28} w={220} align="center" size={26}>💵 Tunai</Txt></Box>
        <Box x={330} y={450} w={220} h={90} r={22} style={{ opacity: at(c, 2, pop, 8), border: `3px solid ${c.theme.brand}` }}><Txt x={0} y={28} w={220} align="center" size={26}>▦ QRIS</Txt></Box>
      </>}
    </>
  );
};

const QrisCard: React.FC<{ c: Ctx; hlAmt?: boolean; hlCode?: boolean }> = ({ c, hlAmt, hlCode }) => (
  <>
    <Box x={0} y={0} w={276} h={170} r={0} bg={`linear-gradient(135deg,#3d9bff,${c.theme.brand} 55%,#0f5bb5)`} />
    <Txt x={16} y={18} size={16} color="#fff">Bayar dengan QRIS</Txt>
    <Txt x={16} y={56} size={13} color="#dbeafe">Total yang dibayar</Txt>
    <Txt x={16} y={76} size={34} color="#fff" weight={800} style={{ textShadow: hlAmt ? `0 0 18px ${c.theme.accent}` : undefined }}>Rp 5.500</Txt>
    <Box x={12} y={140} w={252} h={300} r={18} style={{ boxShadow: "0 8px 20px -10px rgba(0,0,0,.3)" }}>
      <Txt x={14} y={12} size={15} weight={900}>QRIS</Txt><Txt x={200} y={10} size={15} color="#c8102e" weight={900}>GPN</Txt>
      <FakeQR x={36} y={44} s={180} />
      <Txt x={0} y={236} w={252} size={15} align="center">AGI.PAY, Service</Txt>
      <Txt x={0} y={258} w={252} size={11} align="center" color="#6a7f97">NMID: ID1026538172085</Txt>
    </Box>
    <Box x={12} y={452} w={130} h={30} r={15} bg="#e6f1fd" style={{ boxShadow: hlCode ? `0 0 0 3px ${c.theme.accent}` : undefined }}><Txt x={10} y={6} size={13} color="#0f5bb5">Kode AGU84NS</Txt></Box>
  </>
);

export const AgQris: React.FC<{ c: Ctx }> = ({ c }) => {
  const pop = usePop(), beam = (c.fb % 40) / 40;
  return (
    <>
      <Phone x={160} y={110} w={300} h={540}><QrisCard c={c} hlAmt={c.b === 1} hlCode={c.b === 2} /></Phone>
      {c.b === 0 && <TapAt x={330} y={330} f={c.fb} color={c.theme.brand} />}
      {c.b >= 3 && <div style={{ opacity: at(c, 3, pop), transform: `translateX(${(1 - at(c, 3, pop)) * 200}px)` }}>
        <Phone x={620} y={170} w={260} h={470} tint="#0f172a">
          <Txt x={0} y={24} w={236} size={18} align="center" color="#fff">Scan QR</Txt>
          <Abs x={38} y={90} w={160} h={160} style={{ border: "4px solid #fff", borderRadius: 16 }} />
          <Abs x={38} y={90 + 150 * beam} w={160} h={4} style={{ background: "#22c55e", boxShadow: "0 0 12px #22c55e" }} />
          <Txt x={0} y={290} w={236} size={16} align="center" color="#cbd5e1">DANA · GoPay · OVO{"\n"}m-banking</Txt>
        </Phone>
      </div>}
      {c.b >= 4 && <Chip x={600} y={680} bg="#16a34a" p={at(c, 4, pop)} size={30}>☑ Saya sudah bayar</Chip>}
      {c.b === 1 && <Chip x={560} y={250} bg={c.theme.dark} p={pop(c.fb)} size={30}>Nominal sudah terisi</Chip>}
      {c.b === 2 && <Chip x={560} y={250} bg={c.theme.dark} p={pop(c.fb)} size={30}>Kode pesanan ikut tercatat</Chip>}
    </>
  );
};

const Chat: React.FC<{ c: Ctx; n: number; sent?: number }> = ({ c, n, sent = 0 }) => {
  const lines = ["Halo Admin Agi Mas,", "pesan Agi Antar", "Kode pesanan: AGU84NS", "Jemput: Stasiun Madiun", "Tujuan: Alun-alun", "Bayar: QRIS SUDAH DIBAYAR"];
  return (
    <>
      <Box x={0} y={0} w={276} h={70} r={0} bg="#075e54" /><Txt x={16} y={22} size={18} color="#fff">Admin Agi Mas</Txt>
      <Abs x={0} y={70} w={276} h={446} style={{ background: "#ece5dd" }} />
      <Box x={40} y={96} w={224} h={30 + Math.min(n, lines.length) * 26} r={14} bg="#dcf8c6">
        {lines.slice(0, n).map((l, k) => <Txt key={k} x={12} y={12 + k * 26} size={14} weight={k === 2 || k === 5 ? 800 : 600}>{l}</Txt>)}
      </Box>
      {sent > 0 && <Txt x={200} y={110 + Math.min(n, lines.length) * 26} size={16} color="#34b7f1" style={{ opacity: sent }}>✓✓</Txt>}
    </>
  );
};

export const AgSend: React.FC<{ c: Ctx }> = ({ c }) => {
  const pop = usePop(), n = c.b === 0 ? Math.min(2, 1 + Math.floor(c.fb / 15)) : c.b === 1 ? Math.min(6, 2 + Math.floor(c.fb / 18)) : 6;
  return (
    <>
      <Phone x={160} y={110} w={300} h={540}><Chat c={c} n={n} sent={c.b >= 2 ? lin(c.fb, 20, 30) : 0} /></Phone>
      <Badge x={620} y={200} name="chat" bg="#1fa855" size={120} p={pop(c.f)} />
      <Txt x={760} y={230} size={40} w={400}>WhatsApp admin</Txt>
      {c.b >= 2 && <>
        <Btn x={620} y={400} w={360} h={70} bg="#1fa855" press={lin(c.fb, 0, 8)}>Kirim ke admin ➤</Btn>
        <TapAt x={800} y={435} f={c.fb} color="#1fa855" />
      </>}
    </>
  );
};

export const AgKirim: React.FC<{ c: Ctx }> = ({ c }) => {
  const pop = usePop(), x = interpolate(c.f, [0, 60], [-300, 380], clamp), bob = Math.sin(c.f / 3) * 3;
  return (
    <>
      <City c={c} />
      <Motor x={x} y={430} w={320} bob={bob} />
      <Abs x={x + 40} y={420 + bob} w={90} h={80} style={{ background: "#c8873f", borderRadius: 8, border: "3px solid #8a5426", opacity: pop(c.f, 30) }} />
      {c.b >= 1 && <><Pin x={150} y={600} color="#16a34a" p={at(c, 1, pop)} /><Pin x={1050} y={600} color="#e9a800" p={at(c, 1, pop, 12)} /></>}
      {c.b >= 2 && <><Chip x={700} y={250} bg={c.theme.dark} p={at(c, 2, pop)} size={30}>📦 Dokumen dalam map biru</Chip><Chip x={700} y={320} bg={c.theme.brand} p={at(c, 2, pop, 15)} size={30}>⚖️ Sampai 5 kg</Chip></>}
    </>
  );
};

const Cup: React.FC<{ x: number; y: number; s?: number; f: number; color?: string }> = ({ x, y, s = 1, f, color = "#f4e9dd" }) => (
  <Abs x={x} y={y} w={120 * s} h={150 * s}>
    {[0, 1, 2].map((k) => <Abs key={k} x={(30 + k * 22) * s} y={(-10 - ((f + k * 10) % 30)) * s} w={8 * s} h={26 * s} style={{ borderRadius: 8, background: "#cbd5e1", opacity: 0.6 - ((f + k * 10) % 30) / 60 }} />)}
    <Abs x={10 * s} y={40 * s} w={90 * s} h={100 * s} style={{ background: color, borderRadius: `${10 * s}px ${10 * s}px ${36 * s}px ${36 * s}px`, border: `${4 * s}px solid #7a4a26` }} />
    <Abs x={92 * s} y={60 * s} w={28 * s} h={44 * s} style={{ borderRadius: "0 20px 20px 0", border: `${5 * s}px solid #7a4a26`, borderLeft: "none" }} />
  </Abs>
);

export const AgMitra: React.FC<{ c: Ctx }> = ({ c }) => {
  const pop = usePop(), menu = [["Nebula", "15.000"], ["Kopi Susu", "12.000"], ["Croffle", "15.000"]];
  return (
    <>
      <Abs x={120} y={120} w={540} h={520} style={{ background: "#fff", borderRadius: 24, boxShadow: "0 24px 50px -24px rgba(23,63,46,.45)", opacity: pop(c.f) }}>
        <Abs x={0} y={0} w={540} h={70} style={{ background: "repeating-linear-gradient(90deg,#173f2e 0 45px,#e4f4ea 45px 90px)", borderRadius: "24px 24px 0 0" }} />
        <Txt x={0} y={100} w={540} align="center" size={44} color="#173f2e" weight={800}>Lingkar Kopi</Txt>
        <Cup x={210} y={180} s={1} f={c.f} />
        <Abs x={150} y={350} w={240} h={150} style={{ background: "#e4f4ea", borderRadius: 16 }} />
        <Txt x={0} y={400} w={540} align="center" size={26} color="#173f2e">Kopi kafe, harga gerobak</Txt>
      </Abs>
      {c.b >= 1 && <Chip x={720} y={140} bg="#16a34a" p={at(c, 1, pop)}>🕖 Buka 07.00–22.00</Chip>}
      {c.b >= 1 && menu.map(([n, p], k) => { const q = at(c, 1, pop, 10 + k * 8); return (
        <Box key={n} x={720} y={220 + k * 130} w={400} h={110} r={20} style={{ opacity: q, transform: `translateX(${(1 - q) * 80}px)`, boxShadow: c.b === 2 && k === 0 ? `0 0 0 5px ${c.theme.accent}` : "0 12px 26px -16px rgba(0,0,0,.35)" }}>
          <Abs x={14} y={14} w={82} h={82} style={{ borderRadius: 16, background: k === 2 ? "#fff0d4" : "#f3e6d6", display: "grid", placeItems: "center" }}><Icon name={k === 2 ? "bag" : "cup"} size={40} color={k === 2 ? "#b26b00" : "#8a5426"} /></Abs>
          <Txt x={116} y={22} size={26}>{n}</Txt><Txt x={116} y={62} size={22} color={c.theme.brand}>Rp {p}</Txt>
        </Box>); })}
      {c.b >= 2 && <TapAt x={900} y={275} f={c.fb} color={c.theme.brand} />}
    </>
  );
};

export const AgDetail: React.FC<{ c: Ctx }> = ({ c }) => {
  const pop = usePop(), qty = c.b >= 2 && c.fb > 10 ? 2 : 1;
  return (
    <>
      <Box x={260} y={90} w={680} h={640} r={32} style={{ opacity: pop(c.f), boxShadow: "0 30px 60px -30px rgba(11,37,69,.5)" }}>
        <Abs x={0} y={0} w={680} h={230} style={{ background: "#f3e6d6", borderRadius: "32px 32px 0 0" }} />
        <Cup x={280} y={50} s={1.1} f={c.f} />
        <Txt x={40} y={250} size={40} weight={800}>Nebula</Txt><Txt x={520} y={258} size={30} color={c.theme.brand}>Rp 15.000</Txt>
        <Txt x={40} y={310} w={600} size={22} color="#4b6280" weight={500} style={{ background: c.b === 0 ? "#fff8e1" : undefined }}>Espresso, susu segar, dan krim gula aren. Disajikan dingin, 350 ml.</Txt>
        <Txt x={40} y={400} size={18} color="#6a7f97">Catatan untuk menu ini</Txt>
        <Box x={40} y={430} w={600} h={56} r={14} bg="#f6f8fb" style={{ border: c.b === 1 ? `3px solid ${c.theme.brand}` : "2px solid #e3ebf5" }}><Txt x={18} y={14} size={22}>{c.b === 1 ? typed("Gula sedikit", c.fb) : c.b > 1 ? "Gula sedikit" : ""}</Txt></Box>
        <Box x={40} y={540} w={170} h={64} r={32} bg="#f1f5f9"><Txt x={0} y={14} w={170} align="center" size={30}>−  {qty}  +</Txt></Box>
        <Btn x={240} y={540} w={400} h={64} bg={c.theme.brand} press={c.b >= 2 ? lin(c.fb, 25, 32) : 0}>Tambah ke keranjang · Rp {qty * 15}.000</Btn>
      </Box>
      {c.b >= 2 && <TapAt x={260 + 40 + 140} y={90 + 572} f={c.fb} color={c.theme.brand} />}
      {c.b >= 2 && c.fb > 25 && <TapAt x={260 + 440} y={90 + 572} f={c.fb - 25} color={c.theme.brand} />}
    </>
  );
};

export const AgCart: React.FC<{ c: Ctx }> = ({ c }) => {
  const pop = usePop();
  const open = c.b === 2 ? lin(c.fb, 0, 20) : c.b === 3 ? 1 : c.b === 4 ? 1 - lin(c.fb, 0, 20) : 0;
  const n = c.b === 0 && c.fb < 10 ? 2 : 3;
  const rows = [["Nebula", "2", "30.000", "Gula sedikit"], ["Croffle", "1", "15.000", ""]];
  return (
    <>
      <Phone x={180} y={90} w={320} h={600}>
        <Txt x={16} y={18} size={18}>Menu Lingkar Kopi</Txt>
        {["Nebula", "Kopi Susu", "Teh Lemon", "Croffle"].map((m, k) => <Box key={m} x={12} y={56 + k * 82} w={272} h={72} r={14} bg="#f8fafc">
          <Abs x={8} y={8} w={56} h={56} style={{ borderRadius: 12, background: k === 3 ? "#fff0d4" : "#f3e6d6", display: "grid", placeItems: "center" }}><Icon name={k === 3 ? "bag" : "cup"} size={28} color="#8a5426" /></Abs>
          <Txt x={76} y={14} size={16}>{m}</Txt><Box x={200} y={20} w={62} h={32} r={16} bg={c.theme.brand}><Txt x={0} y={6} w={62} align="center" size={16} color="#fff">+</Txt></Box>
        </Box>)}
        <Box x={0} y={576 - 90 - open * 330} w={296} h={420} r={24} style={{ boxShadow: "0 -10px 30px rgba(11,37,69,.25)" }}>
          <Abs x={124} y={10} w={48} h={6} style={{ borderRadius: 3, background: "#cfd9e6" }} />
          <Abs x={16} y={28} w={44} h={44} style={{ borderRadius: 12, background: "#e6f1fd", display: "grid", placeItems: "center" }}><Icon name="bag" size={24} color={c.theme.brand} /></Abs>
          <Txt x={70} y={30} size={16}>Keranjang · {n} item</Txt><Txt x={70} y={52} size={13} color="#6a7f97">geser ke atas</Txt>
          <Txt x={196} y={38} size={16} color={c.theme.brand}>Rp {n === 3 ? "45" : "30"}.000</Txt>
          {rows.map(([nm, q, p, note], k) => <React.Fragment key={nm}>
            <Txt x={16} y={110 + k * 100} size={17}>{nm}</Txt><Txt x={16} y={136 + k * 100} size={14} color={c.theme.brand}>Rp {p}</Txt>
            {note && <Txt x={16} y={158 + k * 100} size={12} color="#8a5426">📝 {note}</Txt>}
            <Box x={196} y={112 + k * 100} w={86} h={36} r={18} bg="#f1f5f9" style={{ boxShadow: c.b === 3 ? `0 0 0 3px ${c.theme.accent}` : undefined }}><Txt x={0} y={7} w={86} align="center" size={16}>−  {q}  +</Txt></Box>
          </React.Fragment>)}
        </Box>
      </Phone>
      {c.b === 0 && <TapAt x={180 + 12 + 12 + 231} y={90 + 12 + 56 + 3 * 82 + 36} f={c.fb} color={c.theme.brand} />}
      {(c.b === 2 || c.b === 4) && <Abs x={590} y={c.b === 2 ? 420 : 200} style={{ fontSize: 120, opacity: lin(c.fb, 0, 8), transform: `translateY(${(c.b === 2 ? -1 : 1) * lin(c.fb, 0, 25) * 120}px)` }}>{c.b === 2 ? "☝️" : "👇"}</Abs>}
      <Chip x={600} y={140} bg={c.theme.dark} p={at(c, 1, pop)} size={28}>🧺 3 item · Rp 45.000</Chip>
    </>
  );
};

export const AgBeliSend: React.FC<{ c: Ctx }> = ({ c }) => {
  const pop = usePop();
  return (
    <>
      <Phone x={180} y={110} w={300} h={540}><MapScreen c={c} store a={pop(c.f)} bp={at(c, 1, pop, 20)} route={c.b >= 2 ? (c.b === 2 ? lin(c.fb, 0, 30) : 1) : 0} /></Phone>
      <Chip x={560} y={160} bg="#173f2e" p={pop(c.f)} size={28}>☕ Ambil di Lingkar Kopi</Chip>
      {c.b >= 1 && <Chip x={560} y={230} bg="#e9a800" p={at(c, 1, pop, 20)} size={28}>🏠 Pasar Besar Madiun</Chip>}
      {c.b >= 2 && <Box x={560} y={310} w={460} h={200} r={26} style={{ opacity: at(c, 2, pop), boxShadow: "0 20px 40px -22px rgba(11,37,69,.45)" }}>
        <Txt x={28} y={24} size={24}>Menu</Txt><Txt x={300} y={24} size={24}>Rp 45.000</Txt>
        <Txt x={28} y={64} size={24}>Ongkir</Txt><Txt x={300} y={64} size={24}>Rp 7.500</Txt>
        <Abs x={28} y={108} w={404} h={3} style={{ background: "#e3ebf5" }} />
        <Txt x={28} y={128} size={34} weight={800}>Total</Txt><Txt x={250} y={128} size={34} weight={800} color={c.theme.brand}>Rp 52.500</Txt>
      </Box>}
      {c.b >= 3 && <Btn x={560} y={540} w={460} h={70} bg="#1fa855" press={c.b === 3 ? lin(c.fb, 10, 18) : 0}>💬 Kirim ke admin</Btn>}
      {c.b >= 4 && <Chip x={560} y={640} bg={c.theme.brand} p={at(c, 4, pop)} size={28}>Kode pesanan AGU84NS</Chip>}
    </>
  );
};

export const AgBersih: React.FC<{ c: Ctx }> = ({ c }) => {
  const pop = usePop(), spark = (k: number) => 0.6 + 0.4 * Math.sin(c.f / 6 + k);
  return (
    <>
      <Abs x={150} y={200} w={420} h={420} style={{ opacity: pop(c.f) }}>
        <svg viewBox="0 0 420 420" width={420} height={420}><path d="M30 190 210 40l180 150v200H30z" fill="#fff" stroke="#7c5cd6" strokeWidth={10} strokeLinejoin="round" /><rect x={170} y={270} width={80} height={120} fill="#eee9fc" stroke="#7c5cd6" strokeWidth={8} /><rect x={70} y={220} width={70} height={60} fill="#e6f1fd" stroke="#7c5cd6" strokeWidth={6} /><rect x={280} y={220} width={70} height={60} fill="#e6f1fd" stroke="#7c5cd6" strokeWidth={6} /></svg>
        {[[30, 60], [360, 80], [380, 300], [10, 330]].map(([x, y], k) => <Abs key={k} x={x} y={y} style={{ transform: `scale(${(c.b >= 3 || k < 2 ? 1 : 0) * spark(k)})` }}><Icon name="sparkle" size={50} color="#e9a800" /></Abs>)}
      </Abs>
      <Abs x={500 + Math.sin(c.f / 8) * 30} y={460} style={{ transform: `rotate(${Math.sin(c.f / 8) * 15}deg)` }}><Icon name="brush" size={120} color="#7c5cd6" /></Abs>
      {c.b >= 1 && <Box x={700} y={220} w={420} h={170} r={24} style={{ opacity: at(c, 1, pop), boxShadow: "0 16px 34px -20px rgba(0,0,0,.4)" }}>
        <Txt x={24} y={22} size={18} color="#6a7f97">Lokasi</Txt><Txt x={24} y={46} size={22}>Jl. Pahlawan No. 10</Txt>
        <Txt x={24} y={90} size={18} color="#6a7f97">Yang dibersihkan</Txt><Txt x={24} y={114} size={22}>{c.b === 1 ? typed("Rumah 2 kamar + kamar mandi", c.fb) : "Rumah 2 kamar + kamar mandi"}</Txt>
      </Box>}
      {c.b >= 2 && <Chip x={700} y={430} bg="#7c5cd6" p={at(c, 2, pop)} size={30}>💬 Harga dari admin</Chip>}
    </>
  );
};

export const AgUlasan: React.FC<{ c: Ctx }> = ({ c }) => {
  const pop = usePop();
  return (
    <>
      <Box x={200} y={120} w={800} h={320} r={32} style={{ opacity: pop(c.f), boxShadow: "0 24px 50px -26px rgba(11,37,69,.45)" }}>
        <Txt x={0} y={30} w={800} align="center" size={34}>Bagaimana pengalamanmu?</Txt>
        {[0, 1, 2, 3, 4].map((k) => { const on = c.b > 0 || c.fb > 8 + k * 6; return <Abs key={k} x={170 + k * 96} y={100} style={{ transform: `scale(${on ? 1 : 0.8})` }}><svg viewBox="0 0 24 24" width={80} height={80}><path d="M12 2.5l2.9 6 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.5l1.3-6.6L2.5 9.3l6.6-.8z" fill={on ? "#ffc93c" : "#e2e8f0"} stroke={on ? "#e9a800" : "#cbd5e1"} strokeWidth={1.2} /></svg></Abs>; })}
        <Box x={60} y={210} w={680} h={70} r={16} bg="#f6f8fb"><Txt x={20} y={20} size={24}>{c.b === 1 ? typed("Drivernya ramah dan cepat sampai.", c.fb) : c.b > 1 ? "Drivernya ramah dan cepat sampai." : ""}</Txt></Box>
      </Box>
      {c.b >= 2 && ["⭐⭐⭐⭐⭐  Cepat dan murah!", "⭐⭐⭐⭐⭐  Adminnya responsif"].map((t, k) => { const q = at(c, 2, pop, k * 10); return <Box key={k} x={200 + k * 410} y={500} w={390} h={110} r={22} style={{ opacity: q, transform: `translateY(${(1 - q) * 60}px)`, boxShadow: "0 14px 30px -18px rgba(0,0,0,.35)" }}><Txt x={22} y={38} size={22}>{t}</Txt></Box>; })}
    </>
  );
};

export const AgBantuan: React.FC<{ c: Ctx }> = ({ c }) => {
  const pop = usePop();
  const items: [string, string, string, number][] = [["chat", "Chat admin", "#1fa855", 0], ["tag", "Daftar tarif", "#e9a800", 1], ["help", "Cara kerja & ketentuan", c.theme.brand, 1], ["refresh", "Bagikan QR & cek pembaruan", "#7c5cd6", 2]];
  return (
    <>{items.map(([ic, t, col, k], i) => { const q = at(c, k, pop, i * 8); return (
      <Box key={t} x={130 + (i % 2) * 480} y={150 + Math.floor(i / 2) * 260} w={450} h={220} r={28} style={{ opacity: q, transform: `scale(${0.85 + 0.15 * q})`, boxShadow: "0 20px 40px -24px rgba(0,0,0,.4)" }}>
        <Badge x={30} y={30} name={ic} bg={col} size={90} /><Txt x={30} y={146} size={30} w={400}>{t}</Txt>
      </Box>); })}</>
  );
};

/* ---------------- Saget Kasir ---------------- */
const POS: React.FC<{ c: Ctx; hlCats?: boolean; hlStock?: boolean; hlOrder?: boolean; lines?: [string, string, string][]; total?: string }> = ({ c, hlCats, hlStock, hlOrder, lines = [], total = "Rp 0" }) => {
  const items = [["Nebula", "15.000", "cup", 19], ["Kopi Susu", "12.000", "cup", 25], ["Americano", "10.000", "cup", 30], ["Matcha", "17.000", "cup", 15], ["Roti Bakar", "12.000", "bag", 9], ["Kentang", "13.000", "bag", 0]];
  return (
    <>
      <Abs x={0} y={0} w={70} h={552} style={{ background: "#e4f4ea" }} />
      {["Semua", "Kopi", "Non-kopi", "Makanan"].map((t, k) => <Box key={t} x={86 + k * 108} y={16} w={100} h={38} r={10} bg={k === 0 ? "#173f2e" : "#fff"} style={{ boxShadow: hlCats ? `0 0 0 3px ${c.theme.accent}` : "0 1px 3px rgba(0,0,0,.1)" }}><Txt x={0} y={9} w={100} align="center" size={15} color={k === 0 ? "#fff" : "#13201a"}>{t}</Txt></Box>)}
      {items.map(([n, p, ic, s], k) => <Box key={n as string} x={86 + (k % 3) * 160} y={70 + Math.floor(k / 3) * 160} w={150} h={150} r={14} style={{ opacity: s === 0 ? 0.45 : 1, boxShadow: "0 2px 6px rgba(0,0,0,.08)" }}>
        <Abs x={0} y={0} w={150} h={62} style={{ background: ic === "cup" ? "#f4e9dd" : "#fcefd9", borderRadius: "14px 14px 0 0", display: "grid", placeItems: "center" }}><Icon name={ic as string} size={30} color="#7a4a26" /></Abs>
        <Box x={84} y={6} w={58} h={22} r={6} bg={s === 0 ? "#fbe9e7" : "rgba(255,255,255,.9)"} style={{ boxShadow: hlStock ? `0 0 0 3px ${c.theme.accent}` : undefined }}><Txt x={0} y={3} w={58} align="center" size={12} color={s === 0 ? "#c2362b" : "#3d5a4b"}>{s === 0 ? "Habis" : `Stok ${s}`}</Txt></Box>
        <Txt x={10} y={74} size={16}>{n}</Txt><Txt x={10} y={100} size={15} color="#1f6b45">Rp {p}</Txt>
      </Box>)}
      <Box x={580} y={0} w={292} h={552} r={0} style={{ borderLeft: "1px solid #dcebe1", boxShadow: hlOrder ? `inset 0 0 0 4px ${c.theme.accent}` : undefined }}>
        <Txt x={16} y={16} size={17}>Pesanan</Txt>
        {lines.map(([n, d, p], k) => <React.Fragment key={k}><Txt x={16} y={58 + k * 64} size={16}>{n}</Txt><Txt x={16} y={80 + k * 64} size={12} color="#64806f">{d}</Txt><Txt x={200} y={58 + k * 64} size={15}>{p}</Txt></React.Fragment>)}
        <Txt x={16} y={430} size={22} weight={800}>Total</Txt><Txt x={150} y={430} size={22} weight={800}>{total}</Txt>
        <Btn x={16} y={480} w={260} h={52} bg="#173f2e">Bayar</Btn>
      </Box>
    </>
  );
};

export const KIntro: React.FC<{ c: Ctx }> = ({ c }) => {
  const pop = usePop();
  return (
    <>
      <Abs x={0} y={0} w={1200} h={900} style={{ background: "linear-gradient(180deg,#f1faf4,#fff)" }} />
      <Abs x={60} y={600} w={1080} h={60} style={{ background: "#8a5a3b", borderRadius: 14 }} />
      <Abs x={90} y={660} w={1020} h={200} style={{ background: "#a8754f" }} />
      <div style={{ opacity: pop(c.f), transform: `translateY(${(1 - pop(c.f)) * 80}px)` }}><Tablet x={300} y={170} w={600} h={400}><POS c={c} /></Tablet></div>
      <Cup x={120} y={440} s={1} f={c.f} /><Cup x={950} y={440} s={1} f={c.f + 10} color="#e7f1e6" />
    </>
  );
};

export const KOpen: React.FC<{ c: Ctx }> = ({ c }) => {
  const pop = usePop(), drawer = lin(c.f, 5, 30), money = Math.round(lin(c.fb, 0, 40) * 150000);
  return (
    <>
      <Abs x={260} y={380} w={680} h={260} style={{ background: "#334155", borderRadius: 24 }} />
      <Abs x={290} y={380 + drawer * 120} w={620} h={140} style={{ background: "#475569", borderRadius: 18, boxShadow: "0 10px 20px rgba(0,0,0,.3)" }}>
        {[0, 1, 2, 3].map((k) => <Abs key={k} x={30 + k * 150} y={20} w={130} h={70} style={{ background: k % 2 ? "#86efac" : "#bbf7d0", borderRadius: 8, border: "3px solid #166534" }} />)}
      </Abs>
      <Box x={330} y={120} w={540} h={200} r={28} style={{ opacity: pop(c.f), boxShadow: "0 20px 40px -24px rgba(0,0,0,.4)" }}>
        <Txt x={30} y={26} size={24} color="#64806f">Modal awal di laci</Txt>
        <Txt x={30} y={70} size={64} weight={800} color="#173f2e">Rp {(c.b > 0 ? 150000 : money).toLocaleString("id-ID")}</Txt>
      </Box>
      {c.b >= 1 && <><Btn x={420} y={700} w={360} h={70} bg="#173f2e" press={lin(c.fb, 0, 8)}>Buka kasir</Btn><TapAt x={600} y={735} f={c.fb} color="#1f6b45" />
        <Chip x={430} y={800} bg="#16a34a" p={at(c, 1, pop, 15)} size={26}>● Kasir dibuka</Chip></>}
    </>
  );
};

export const KJual: React.FC<{ c: Ctx }> = ({ c }) => (
  <Tablet x={150} y={130} w={900} h={580}><POS c={c} hlCats={c.b === 1} hlStock={c.b === 2} hlOrder={c.b === 3} /></Tablet>
);

export const KVar: React.FC<{ c: Ctx }> = ({ c }) => {
  const pop = usePop(), groups = [["Ukuran", ["Regular", "Large +4.000"]], ["Suhu", ["Ice", "Hot"]], ["Gula", ["Normal", "Less sugar"]], ["Tambahan", ["Extra shot +5.000", "Oat milk"]]];
  const picked = (g: number) => (c.b >= 2 ? true : c.b === 1 ? c.fb > 10 + g * 14 : false);
  const price = 15000 + (picked(0) ? 4000 : 0) + (picked(3) ? 5000 : 0);
  return (
    <>
      <Tablet x={150} y={130} w={900} h={580}><POS c={c} /><Abs x={0} y={0} w={872} h={552} style={{ background: "rgba(13,30,22,.4)" }} /></Tablet>
      <Box x={330} y={170} w={540} h={500} r={24} style={{ opacity: pop(c.f), transform: `scale(${0.9 + 0.1 * pop(c.f)})`, boxShadow: "0 30px 60px -20px rgba(0,0,0,.5)" }}>
        <Txt x={24} y={20} size={24}>Nebula · Rp 15.000</Txt>
        {groups.map(([g, opts], k) => <React.Fragment key={g as string}><Txt x={24} y={70 + k * 82} size={16} color="#64806f">{g}</Txt>
          {(opts as string[]).map((o, j) => { const on = (j === 1 && k !== 1 && picked(k)) || (k === 1 && j === 0); return <Box key={o} x={24 + j * 190} y={94 + k * 82} w={180} h={42} r={10} bg={on ? "#e4f4ea" : "#fff"} style={{ border: on ? "2px solid #2f9e62" : "1px solid #c7dccf" }}><Txt x={0} y={10} w={180} align="center" size={15} color={on ? "#1b6a40" : "#3d5a4b"}>{o}</Txt></Box>; })}
        </React.Fragment>)}
        <Box x={24} y={418} w={300} h={50} r={12} bg="#f4faf6" style={{ border: c.b === 3 ? "2px solid #2f9e62" : "1px solid #c7dccf" }}><Txt x={14} y={14} size={17}>{c.b === 3 ? typed("Es sedikit", c.fb) : ""}</Txt></Box>
        <Btn x={340} y={418} w={176} h={50} bg="#173f2e" press={c.b === 3 ? lin(c.fb, 30, 36) : 0}>Rp {price.toLocaleString("id-ID")}</Btn>
      </Box>
      {c.b === 2 && <Chip x={880} y={140} bg="#e9a800" p={pop(c.fb)} size={26}>+ harga tambahan</Chip>}
    </>
  );
};

export const KPlain: React.FC<{ c: Ctx }> = ({ c }) => {
  const qty = c.b >= 1 && c.fb > 12 ? 2 : 1;
  const lines: [string, string, string][] = [["Nebula", "Large, Ice, Less sugar", "24.000"], ...(c.b >= 0 && c.fb > 12 || c.b > 0 ? [["Roti Bakar", `${qty} × 12.000`, `${qty * 12}.000`] as [string, string, string]] : [])];
  return (
    <>
      <Tablet x={150} y={130} w={900} h={580}><POS c={c} lines={lines} hlOrder={c.b === 2} total={`Rp ${24 + (lines.length > 1 ? qty * 12 : 0)}.000`} /></Tablet>
      {c.b === 0 && <TapAt x={150 + 14 + 86 + 160 + 75} y={130 + 14 + 230 + 75} f={c.fb} color="#1f6b45" />}
      {c.b === 1 && <TapAt x={150 + 14 + 580 + 250} y={130 + 14 + 122 + 8} f={c.fb} color="#1f6b45" />}
    </>
  );
};

export const KDisc: React.FC<{ c: Ctx }> = ({ c }) => {
  const pop = usePop(), take = c.b > 0 || c.fb > 10;
  return (
    <>
      <Box x={200} y={150} w={360} h={70} r={35} bg="#f4faf6" style={{ border: "2px solid #c7dccf" }}>
        <Box x={6} y={6} w={170} h={56} r={28} bg={take ? "transparent" : "#fff"}><Txt x={0} y={15} w={170} align="center" size={22}>🍽️ Dine in</Txt></Box>
        <Box x={180} y={6} w={170} h={56} r={28} bg={take ? "#fff" : "transparent"} style={{ boxShadow: take ? "0 2px 6px rgba(0,0,0,.15)" : undefined }}><Txt x={0} y={15} w={170} align="center" size={22}>🛍️ Take away</Txt></Box>
      </Box>
      {c.b >= 1 && <Box x={200} y={260} w={500} h={70} r={16} style={{ border: "2px solid #2f9e62", opacity: at(c, 1, pop) }}><Txt x={20} y={20} size={26}>👤 {c.b === 1 ? typed("Mas Rizal", c.fb) : "Mas Rizal"}</Txt></Box>}
      <Box x={200} y={380} w={500} h={200} r={24} style={{ boxShadow: "0 16px 34px -20px rgba(0,0,0,.4)" }}>
        <Txt x={30} y={30} size={24}>Subtotal</Txt><Txt x={330} y={30} size={24} style={{ textDecoration: c.b >= 2 ? "line-through" : undefined, color: c.b >= 2 ? "#94a3b8" : undefined }}>Rp 48.000</Txt>
        {c.b >= 2 && <Txt x={30} y={80} size={24} color="#1b6a40" style={{ opacity: at(c, 2, pop) }}>Diskon 10%</Txt>}
        <Txt x={30} y={130} size={34} weight={800}>Total</Txt><Txt x={300} y={130} size={34} weight={800}>{c.b >= 2 ? "Rp 43.200" : "Rp 48.000"}</Txt>
      </Box>
      {c.b >= 2 && <Abs x={800} y={300} style={{ opacity: at(c, 2, pop), transform: `rotate(${-12 * at(c, 2, pop)}deg) scale(${at(c, 2, pop)})` }}><Badge x={0} y={0} name="tag" bg="#e9a800" size={180} /></Abs>}
    </>
  );
};

export const KPay: React.FC<{ c: Ctx }> = ({ c }) => {
  const pop = usePop();
  return (
    <>
      <Box x={150} y={120} w={900} h={560} r={28} style={{ boxShadow: "0 30px 60px -26px rgba(0,0,0,.45)", opacity: pop(c.f) }}>
        {["💵 Tunai", "▦ QRIS", "💳 Debit / Transfer"].map((m, k) => <Box key={m} x={24} y={30 + k * 86} w={240} h={70} r={16} bg={k === 0 ? "#173f2e" : "#f4faf6"} style={{ boxShadow: c.b === 1 ? `0 0 0 3px ${c.theme.accent}` : undefined }}><Txt x={20} y={22} size={20} color={k === 0 ? "#fff" : "#13201a"}>{m}</Txt></Box>)}
        <Txt x={300} y={34} size={20} color="#64806f">Total tagihan</Txt><Txt x={300} y={62} size={56} weight={800}>Rp 45.600</Txt>
        {c.b >= 2 && [0, 1].map((k) => { const q = at(c, 2, pop, k * 10); return <Abs key={k} x={310 + k * 40} y={170 + (1 - q) * 120} w={260} h={120} style={{ background: "#93c5fd", border: "4px solid #1d4ed8", borderRadius: 12, opacity: q, transform: `rotate(${k * 6 - 3}deg)` }}><Txt x={0} y={36} w={260} align="center" size={34} color="#1e3a8a">Rp 50.000</Txt></Abs>; })}
        {c.b >= 3 && <Box x={300} y={380} w={560} h={110} r={20} bg="#e5f4ec" style={{ opacity: at(c, 3, pop) }}><Txt x={30} y={34} size={36} weight={800} color="#16794a">Kembalian Rp 4.400</Txt></Box>}
      </Box>
    </>
  );
};

export const KReceipt: React.FC<{ c: Ctx }> = ({ c }) => {
  const pop = usePop(), paper = c.b >= 1 ? (c.b === 1 ? lin(c.fb, 0, 40) : 1) : 0;
  return (
    <>
      <Box x={130} y={160} w={360} h={300} r={30} style={{ opacity: pop(c.f), boxShadow: "0 24px 50px -26px rgba(0,0,0,.45)" }}>
        <Abs x={140} y={30} w={80} h={80} style={{ borderRadius: "50%", background: "#e5f4ec", display: "grid", placeItems: "center" }}><Icon name="check" size={46} color="#16794a" sw={3} /></Abs>
        <Txt x={0} y={130} w={360} align="center" size={30} weight={800}>Antrean #1</Txt><Txt x={0} y={180} w={360} align="center" size={20} color="#64806f">Take away · Mas Rizal</Txt>
      </Box>
      <Abs x={600} y={140} w={360} h={180} style={{ background: "#334155", borderRadius: 24 }}><Txt x={30} y={30} size={22} color="#e2e8f0">🖨️ Printer thermal 58 mm</Txt></Abs>
      <Abs x={660} y={300} w={240} h={paper * 360} style={{ background: "#fff", boxShadow: "0 8px 20px rgba(0,0,0,.15)", overflow: "hidden", fontFamily: "monospace", fontSize: 15, padding: 14 }}>
        {"   LINGKAR KOPI\n--------------------\nNebula       24.000\nRoti Bakar   24.000\nDiskon       -4.800\n--------------------\nTOTAL        43.200\nTunai        50.000\nKembali       6.800\n   Terima kasih!".split("\n").map((l, k) => <div key={k} style={{ whiteSpace: "pre" }}>{l}</div>)}
      </Abs>
      {c.b >= 2 && <Badge x={1000} y={360} name="chat" bg="#1fa855" size={110} p={at(c, 2, pop)} />}
      {c.b >= 3 && <><Btn x={130} y={540} w={360} h={70} bg="#173f2e" press={lin(c.fb, 0, 8)}>+ Transaksi baru</Btn><TapAt x={310} y={575} f={c.fb} color="#1f6b45" /></>}
    </>
  );
};

const Ticket: React.FC<{ x: number; y: number; t: string; sub: string; agimas?: boolean; p?: number }> = ({ x, y, t, sub, agimas, p = 1 }) => (
  <Box x={x} y={y} w={250} h={110} r={16} style={{ opacity: p, borderLeft: agimas ? "8px solid #1e7be6" : "1px solid #dcebe1", boxShadow: "0 8px 18px -10px rgba(0,0,0,.35)" }}>
    <Txt x={16} y={14} size={26} weight={800}>{t}</Txt><Txt x={16} y={60} size={15} color="#64806f">{sub}</Txt>
    {agimas && <Box x={150} y={16} w={86} h={26} r={13} bg="#e7f0fc"><Txt x={0} y={4} w={86} align="center" size={13} color="#1f6fd6">Agi Mas</Txt></Box>}
  </Box>
);

export const KHold: React.FC<{ c: Ctx }> = ({ c }) => {
  const pop = usePop();
  return (
    <>
      <Abs x={140} y={420} w={460} h={30} style={{ background: "#a8754f", borderRadius: 10 }} />
      <Abs x={170} y={450} w={30} h={250} style={{ background: "#8a5a3b" }} /><Abs x={540} y={450} w={30} h={250} style={{ background: "#8a5a3b" }} />
      <Box x={300} y={300} w={140} h={110} r={14} style={{ border: "4px solid #173f2e" }}><Txt x={0} y={30} w={140} align="center" size={36} weight={800} color="#173f2e">Meja 4</Txt></Box>
      <Cup x={180} y={290} s={0.8} f={c.f} color="#e7f1e6" />
      {c.b >= 1 && <Badge x={700} y={180} name="tag" bg="#173f2e" size={130} p={at(c, 1, pop)} />}
      {c.b >= 1 && <Txt x={850} y={220} size={34} style={{ opacity: at(c, 1, pop) }}>Simpan{"\n"}(open bill)</Txt>}
      {c.b >= 2 && <><Ticket x={700} y={420} t="#2 Meja 4" sub="Teh Lemon · Croffle" p={at(c, 2, pop)} /><Chip x={700} y={560} bg="#e9a800" p={at(c, 2, pop, 10)}>Belum dibayar</Chip></>}
    </>
  );
};

export const KHeldPay: React.FC<{ c: Ctx }> = ({ c }) => {
  const pop = usePop();
  return (
    <>
      <Box x={150} y={140} w={520} h={300} r={24} style={{ boxShadow: "0 20px 40px -24px rgba(0,0,0,.4)" }}>
        <Txt x={24} y={20} size={22}>Pesanan tersimpan</Txt>
        {[["#2 Meja 4", "Rp 23.000"], ["#3 Meja 1", "Rp 31.000"]].map(([a, b], k) => <React.Fragment key={a}><Txt x={24} y={80 + k * 90} size={24}>{a}</Txt><Txt x={200} y={80 + k * 90} size={22} color="#64806f">{b}</Txt><Btn x={380} y={70 + k * 90} w={110} h={48} bg="#173f2e" press={c.b === 1 && k === 0 ? lin(c.fb, 0, 8) : 0}>Bayar</Btn></React.Fragment>)}
      </Box>
      {c.b === 1 && <TapAt x={150 + 435} y={140 + 94} f={c.fb} color="#1f6b45" />}
      {c.b >= 2 && <Box x={720} y={140} w={340} h={420} r={24} style={{ opacity: at(c, 2, pop), boxShadow: "0 20px 40px -24px rgba(0,0,0,.4)" }}>
        <Txt x={0} y={24} w={340} align="center" size={24}>QRIS · Rp 23.000</Txt><FakeQR x={70} y={80} s={200} />
        {c.b >= 3 && <Abs x={0} y={300} w={340} style={{ opacity: at(c, 3, pop) }}><Txt x={0} y={20} w={340} align="center" size={26} color="#16794a" weight={800}>✓ Pembayaran diterima</Txt></Abs>}
      </Box>}
    </>
  );
};

export const KQueue: React.FC<{ c: Ctx }> = ({ c }) => {
  const pop = usePop(), cols = ["Baru", "Sedang dibuat", "Selesai"];
  const col = c.b < 2 ? 0 : c.b === 2 ? (c.fb > 10 ? 1 : 0) : (c.fb > 10 ? 2 : 1);
  const move = c.b >= 2 ? lin(c.fb, 10, 30) : 0, from = c.b === 3 ? 1 : 0;
  const x = 120 + (from + (col > from ? move : 0)) * 330;
  return (
    <>
      {cols.map((t, k) => <Box key={t} x={100 + k * 330} y={140} w={300} h={540} r={22} bg="#f4faf6" style={{ border: "1px solid #dcebe1", opacity: pop(c.f, k * 6) }}><Txt x={20} y={20} size={22}>{["🟠", "🔵", "🟢"][k]} {t}</Txt></Box>)}
      <Ticket x={120 + 330 * 0} y={300} t="#3" sub="Kopi Susu" p={at(c, 1, pop, 10)} />
      <Ticket x={x} y={210} t="#2" sub="Teh Lemon · Croffle" p={at(c, 1, pop)} />
      {c.b === 3 && c.fb > 30 && <Abs x={1000} y={120} style={{ fontSize: 70, transform: `rotate(${Math.sin(c.fb) * 15}deg)` }}>🔔</Abs>}
    </>
  );
};

export const KAgimas: React.FC<{ c: Ctx }> = ({ c }) => {
  const pop = usePop(), mx = interpolate(c.f, [0, 50], [-320, 60], clamp);
  return (
    <>
      <Abs x={0} y={600} w={1200} h={300} style={{ background: "#e4f4ea" }} />
      <Motor x={mx} y={380} w={340} bob={Math.sin(c.f / 3) * 3} />
      <Ticket x={560} y={200} t="AGU84NS" sub="2× Nebula · Croffle" agimas p={pop(c.f, 20)} />
      {c.b >= 1 && <Btn x={560} y={340} w={360} h={64} bg="#16794a" press={lin(c.fb, 15, 22)}>✓ Siap diambil driver</Btn>}
      {c.b >= 2 && <Chip x={560} y={450} bg="#1f6fd6" p={at(c, 2, pop)} size={30}>+ Penjualan Agi Mas</Chip>}
    </>
  );
};

export const KHist: React.FC<{ c: Ctx }> = ({ c }) => {
  const pop = usePop();
  return (
    <>
      <Box x={130} y={130} w={460} h={560} r={24} style={{ boxShadow: "0 20px 40px -24px rgba(0,0,0,.4)", opacity: pop(c.f) }}>
        {["LK-0004  Rp 23.000", "LK-0003  Rp 43.200", "LK-0002  Rp 31.000", "LK-0001  Rp 45.600"].map((t, k) => <Box key={t} x={16} y={20 + k * 90} w={428} h={76} r={14} bg={c.b >= 1 && k === 1 ? "#e4f4ea" : "#f8fafc"}><Txt x={20} y={24} size={22}>{t}</Txt></Box>)}
      </Box>
      {c.b >= 1 && <Box x={640} y={130} w={420} h={560} r={24} style={{ opacity: at(c, 1, pop), boxShadow: "0 20px 40px -24px rgba(0,0,0,.4)" }}>
        <Txt x={30} y={30} size={26}>LK-0003</Txt><Txt x={30} y={80} size={20} color="#64806f">Nebula · Roti Bakar{"\n"}Diskon 10% · Tunai</Txt>
        {c.b >= 2 && <><Badge x={30} y={200} name="printer" bg="#173f2e" size={90} p={at(c, 2, pop)} /><Badge x={150} y={200} name="chat" bg="#1fa855" size={90} p={at(c, 2, pop, 8)} /></>}
        {c.b >= 3 && <Abs x={60} y={340} style={{ border: "6px solid #c2362b", color: "#c2362b", fontSize: 44, fontWeight: 900, padding: "6px 20px", borderRadius: 12, transform: `rotate(-10deg) scale(${at(c, 3, pop)})` }}>DIBATALKAN</Abs>}
      </Box>}
    </>
  );
};

export const KReport: React.FC<{ c: Ctx }> = ({ c }) => {
  const pop = usePop(), bars = [0.5, 0.65, 0.45, 0.8, 0.7, 0.95, 0.6];
  const ranges = ["Hari ini", "Kemarin", "7 hari", "30 hari", "Bulan ini"], sel = c.b === 3 ? Math.min(4, Math.floor(c.fb / 20)) : 2;
  return (
    <>
      {[["Penjualan", "Rp 4,4 jt"], ["Transaksi", "122"], ["Rata-rata", "Rp 36 rb"]].map(([a, b], k) => <Box key={a} x={120 + k * 330} y={110} w={300} h={130} r={22} style={{ opacity: pop(c.f, k * 6), boxShadow: "0 14px 30px -20px rgba(0,0,0,.4)" }}><Txt x={24} y={22} size={20} color="#64806f">{a}</Txt><Txt x={24} y={58} size={40} weight={800}>{b}</Txt></Box>)}
      <Box x={120} y={280} w={960} h={330} r={24} style={{ boxShadow: "0 14px 30px -20px rgba(0,0,0,.4)" }}>
        {bars.map((h, k) => { const g = c.b >= 2 ? (c.b === 2 ? lin(c.fb, k * 4, k * 4 + 20) : 1) : 0; return <Abs key={k} x={60 + k * 128} y={290 - 250 * h * g} w={80} h={250 * h * g} style={{ background: "#2f9e62", borderRadius: "10px 10px 0 0" }} />; })}
      </Box>
      {c.b >= 3 && ranges.map((r, k) => <Box key={r} x={120 + k * 192} y={650} w={180} h={56} r={28} bg={k === sel ? "#173f2e" : "#fff"} style={{ border: "2px solid #c7dccf" }}><Txt x={0} y={15} w={180} align="center" size={20} color={k === sel ? "#fff" : "#13201a"}>{r}</Txt></Box>)}
    </>
  );
};

export const KExport: React.FC<{ c: Ctx }> = ({ c }) => {
  const pop = usePop(), files = ["laporan", "transaksi", "rincian-item"];
  return (
    <>
      <Box x={150} y={140} w={500} h={460} r={20} style={{ opacity: pop(c.f), boxShadow: "0 20px 40px -24px rgba(0,0,0,.4)" }}>
        <Abs x={0} y={0} w={500} h={56} style={{ background: "#16794a", borderRadius: "20px 20px 0 0" }}><Txt x={20} y={14} size={22} color="#fff">Excel</Txt></Abs>
        {Array.from({ length: 7 }, (_, r) => Array.from({ length: 4 }, (_, k) => <Abs key={`${r}${k}`} x={20 + k * 118} y={76 + r * 52} w={110} h={44} style={{ background: r === 0 ? "#e5f4ec" : "#f8fafc", border: "1px solid #dcebe1" }} />))}
      </Box>
      {files.map((f, k) => { const q = at(c, 1, pop, k * 8); return <React.Fragment key={f}><Badge x={720} y={150 + k * 150} name="file" bg="#173f2e" size={100} p={c.b >= 1 ? q : 0} /><Txt x={840} y={185 + k * 150} size={26} style={{ opacity: c.b >= 1 ? q : 0 }}>{f}.csv</Txt></React.Fragment>; })}
      <Abs x={360} y={620 + Math.sin(c.f / 6) * 8}><Icon name="down" size={90} color="#16794a" sw={2.5} /></Abs>
      {c.b >= 2 && <Chip x={720} y={620} bg="#16794a" p={at(c, 2, pop)} size={28}>✓ Rapi di Excel</Chip>}
    </>
  );
};

export const KClose: React.FC<{ c: Ctx }> = ({ c }) => {
  const pop = usePop();
  return (
    <>
      <Abs x={160} y={420} w={600} h={230} style={{ background: "#334155", borderRadius: 24 }} />
      <Abs x={190} y={420 + lin(c.f, 0, 20) * 110} w={540} h={130} style={{ background: "#475569", borderRadius: 18 }}>{[0, 1, 2].map((k) => <Abs key={k} x={30 + k * 170} y={20} w={150} h={70} style={{ background: "#bbf7d0", border: "3px solid #166534", borderRadius: 8 }} />)}</Abs>
      <Chip x={160} y={150} bg="#c2362b" p={pop(c.f)} size={28}>− Rp 20.000 · Beli es batu 🧊</Chip>
      {c.b >= 1 && <Box x={160} y={230} w={600} h={120} r={22} style={{ opacity: at(c, 1, pop), boxShadow: "0 14px 30px -20px rgba(0,0,0,.4)" }}><Txt x={24} y={20} size={20} color="#64806f">Uang dihitung di laci</Txt><Txt x={24} y={50} size={44} weight={800}>Rp {Math.round(lin(c.b === 1 ? c.fb : 99, 0, 40) * 245000).toLocaleString("id-ID")}</Txt></Box>}
      {c.b >= 2 && <Box x={820} y={250} w={300} h={160} r={24} bg="#e5f4ec" style={{ opacity: at(c, 2, pop) }}><Txt x={24} y={24} size={22} color="#16794a">Selisih</Txt><Txt x={24} y={64} size={48} weight={800} color="#16794a">Rp 0 ✓</Txt></Box>}
    </>
  );
};

export const KHelp: React.FC<{ c: Ctx }> = ({ c }) => {
  const pop = usePop(), wave = (c.f % 30) / 30, paper = c.b >= 2 ? lin(c.fb, 10, 50) : 0;
  return (
    <>
      <Tablet x={110} y={200} w={480} h={320}><Txt x={20} y={20} size={20}>Bantuan</Txt>{["💬 Hubungi pengembang", "📘 Cara pakai", "🖨️ Sambungkan printer"].map((t, k) => <Box key={t} x={20} y={60 + k * 70} w={410} h={56} r={12} bg={k === 2 && c.b >= 1 ? "#e4f4ea" : "#fff"}><Txt x={16} y={16} size={18}>{t}</Txt></Box>)}</Tablet>
      {c.b >= 1 && <>
        <Abs x={800} y={260} w={260} h={170} style={{ background: "#334155", borderRadius: 24, opacity: at(c, 1, pop) }}><Abs x={20} y={20}><Icon name="bluetooth" size={50} color="#93c5fd" /></Abs><Txt x={90} y={30} size={20} color="#e2e8f0">58 mm</Txt></Abs>
        {[0, 1, 2].map((k) => <Abs key={k} x={640 + k * 40} y={330 - k * 20} w={40 + k * 40} h={80 + k * 40} style={{ borderRadius: "50%", border: "5px solid #2f9e62", borderLeft: "none", borderBottom: "none", transform: "rotate(45deg)", opacity: ((wave + k / 3) % 1) }} />)}
      </>}
      <Abs x={860} y={420} w={140} h={paper * 220} style={{ background: "#fff", boxShadow: "0 8px 20px rgba(0,0,0,.15)", overflow: "hidden", fontFamily: "monospace", fontSize: 13, padding: 8 }}>{"TES PRINTER\n12345678901234\nPrinter siap ✓".split("\n").map((l, k) => <div key={k}>{l}</div>)}</Abs>
    </>
  );
};

export const KBook: React.FC<{ c: Ctx }> = ({ c }) => {
  const pop = usePop(), cross = lin(c.f, 30, 45);
  return (
    <>
      <Abs x={200} y={200} w={420} h={500} style={{ background: "#fef3c7", borderRadius: 16, border: "4px solid #a16207", transform: "rotate(-6deg)" }}>
        {Array.from({ length: 9 }, (_, k) => <Abs key={k} x={30} y={50 + k * 48} w={300 - (k % 3) * 60} h={6} style={{ background: "#78350f", opacity: 0.5, borderRadius: 3 }} />)}
      </Abs>
      <Abs x={190} y={420} w={460 * cross} h={18} style={{ background: "#c2362b", borderRadius: 9, transform: "rotate(-40deg)", transformOrigin: "left center" }} />
      <div style={{ opacity: pop(c.f, 40), transform: `translateX(${(1 - pop(c.f, 40)) * 200}px)` }}><Tablet x={680} y={260} w={440} h={300}><POS c={c} /></Tablet></div>
    </>
  );
};

/* ---------------- Untuk video promosi & deskripsi ---------------- */
export const Logo: React.FC<{ c: Ctx; city?: boolean }> = ({ c, city }) => {
  const pop = usePop(), p = pop(c.f), logo = c.theme.logo;
  return (
    <>
      {city ? <City c={c} /> : <Abs x={0} y={0} w={1200} h={900} style={{ background: `linear-gradient(180deg,${c.theme.light},#fff)` }} />}
      {city && <Motor x={interpolate(c.f, [0, 70], [-320, 820], clamp)} y={470} w={300} bob={Math.sin(c.f / 3) * 3} />}
      <Box x={250} y={170} w={700} h={260} r={40} style={{ opacity: p, transform: `scale(${0.8 + 0.2 * p})`, display: "grid", placeItems: "center", boxShadow: "0 30px 70px -30px rgba(0,0,0,.45)" }}>
        <Img src={staticFile(logo)} style={{ width: 600 }} />
      </Box>
    </>
  );
};

export const Badges: React.FC<{ c: Ctx; items: [string, string, string][] }> = ({ c, items }) => {
  const pop = usePop();
  return <>{items.map(([ic, t, col], k) => { const q = pop(c.f, 8 + k * 12); return (
    <React.Fragment key={t}>
      <Badge x={130 + (k % 2) * 500} y={140 + Math.floor(k / 2) * 300} name={ic} bg={col} size={150} p={q} />
      <Txt x={300 + (k % 2) * 500} y={190 + Math.floor(k / 2) * 300} size={38} w={320} style={{ opacity: q }}>{t}</Txt>
    </React.Fragment>); })}</>;
};

export const Flow: React.FC<{ c: Ctx; items: [string, string][]; color: string }> = ({ c, items, color }) => {
  const pop = usePop();
  return <>{items.map(([ic, t], k) => { const q = pop(c.f, 8 + k * 22); return (
    <React.Fragment key={t}>
      <Badge x={110 + k * 370} y={260} name={ic} bg={color} size={190} p={q} />
      <Txt x={60 + k * 370} y={490} w={290} align="center" size={32} style={{ opacity: q }}>{t}</Txt>
      {k < items.length - 1 && <Txt x={320 + k * 370} y={320} size={80} color={color} style={{ opacity: pop(c.f, 20 + k * 22) }}>→</Txt>}
    </React.Fragment>); })}</>;
};

export const QrCta: React.FC<{ c: Ctx; qr?: string }> = ({ c, qr }) => {
  const pop = usePop(), p = pop(c.f), q = pop(c.f, 12);
  return (
    <>
      <City c={c} road={false} />
      <Box x={qr ? 80 : 250} y={260} w={qr ? 600 : 700} h={240} r={40} style={{ opacity: p, display: "grid", placeItems: "center", boxShadow: "0 30px 70px -30px rgba(0,0,0,.45)" }}><Img src={staticFile(c.theme.logo)} style={{ width: qr ? 520 : 600 }} /></Box>
      {qr && <Box x={760} y={170} w={380} h={440} r={32} style={{ opacity: q, transform: `scale(${0.85 + 0.15 * q})`, boxShadow: "0 30px 70px -30px rgba(0,0,0,.5)" }}>
        <Img src={staticFile(qr)} style={{ position: "absolute", left: 30, top: 30, width: 320, height: 320 }} />
        <Txt x={0} y={372} w={380} align="center" size={28}>Pindai untuk unduh</Txt>
      </Box>}
    </>
  );
};
