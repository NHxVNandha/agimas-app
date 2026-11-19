// Komponen dasar animasi ilustrasi 2D (vektor/CSS, tanpa 3D). Semua digambar di kanvas 1200x900.
import React from "react";
import { Img, interpolate, spring, staticFile, useVideoConfig, Easing } from "remotion";
import { Theme } from "../theme";

export const CW = 1200, CH = 900;
/** Konteks waktu adegan: f = frame sejak adegan mulai, b = indeks kalimat aktif, fb = frame sejak kalimat aktif mulai. */
export type Ctx = { f: number; b: number; fb: number; theme: Theme; app: string };

export const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
export const lin = (f: number, a: number, b: number, from = 0, to = 1) => interpolate(f, [a, b], [from, to], { ...clamp, easing: Easing.out(Easing.cubic) });
export const usePop = () => { const { fps } = useVideoConfig(); return (f: number, delay = 0) => spring({ frame: f - delay, fps, config: { damping: 13, stiffness: 150 } }); };
/** Nilai 0..1 yang muncul ketika kalimat ke-k dimulai (dan tetap 1 sesudahnya). */
export const at = (c: Ctx, k: number, pop: (f: number, d?: number) => number, delay = 0) => (c.b > k ? 1 : c.b === k ? pop(c.fb, delay) : 0);

export const Abs: React.FC<{ x: number; y: number; w?: number; h?: number; style?: React.CSSProperties; children?: React.ReactNode }> = ({ x, y, w, h, style, children }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, height: h, ...style }}>{children}</div>
);

export const Phone: React.FC<{ x: number; y: number; w?: number; h?: number; children?: React.ReactNode; tint?: string; style?: React.CSSProperties }> = ({ x, y, w = 300, h = 600, children, tint = "#fff", style }) => (
  <Abs x={x} y={y} w={w} h={h} style={{ borderRadius: 44, background: "#14213d", padding: 12, boxShadow: "0 30px 60px -24px rgba(11,37,69,.5)", ...style }}>
    <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 34, overflow: "hidden", background: tint }}>{children}</div>
  </Abs>
);

export const Tablet: React.FC<{ x: number; y: number; w?: number; h?: number; children?: React.ReactNode; style?: React.CSSProperties }> = ({ x, y, w = 900, h = 580, children, style }) => (
  <Abs x={x} y={y} w={w} h={h} style={{ borderRadius: 34, background: "#13201a", padding: 14, boxShadow: "0 30px 60px -24px rgba(19,32,26,.5)", ...style }}>
    <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 22, overflow: "hidden", background: "#f4faf6" }}>{children}</div>
  </Abs>
);

export const Box: React.FC<{ x: number; y: number; w: number; h: number; bg?: string; r?: number; children?: React.ReactNode; style?: React.CSSProperties }> = ({ x, y, w, h, bg = "#fff", r = 16, children, style }) => (
  <Abs x={x} y={y} w={w} h={h} style={{ background: bg, borderRadius: r, ...style }}>{children}</Abs>
);

export const Txt: React.FC<{ x: number; y: number; size?: number; w?: number; color?: string; weight?: number; align?: "left" | "center" | "right"; children: React.ReactNode; style?: React.CSSProperties }> = ({ x, y, size = 22, w, color = "#0b2545", weight = 700, align = "left", children, style }) => (
  <Abs x={x} y={y} w={w} style={{ fontSize: size, fontWeight: weight, color, textAlign: align, lineHeight: 1.2, whiteSpace: "pre-wrap", ...style }}>{children}</Abs>
);

/** Lingkaran ketuk: jari muncul lalu riak. */
export const TapAt: React.FC<{ x: number; y: number; f: number; color: string }> = ({ x, y, f, color }) => {
  const o = lin(f, 0, 6), r = interpolate(f, [8, 24], [0.6, 2.4], clamp), ro = interpolate(f, [8, 24], [1, 0], clamp);
  return (
    <Abs x={x - 24} y={y - 24} w={48} h={48} style={{ opacity: o }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(255,255,255,.55)", border: "3px solid rgba(20,20,20,.7)" }} />
      <div style={{ position: "absolute", inset: -3, borderRadius: "50%", border: `4px solid ${color}`, transform: `scale(${r})`, opacity: ro }} />
    </Abs>
  );
};

export const Pin: React.FC<{ x: number; y: number; color: string; p: number; label?: string }> = ({ x, y, color, p, label }) => (
  <Abs x={x - 26} y={y - 70 - (1 - p) * 120} w={52} h={70} style={{ opacity: Math.min(1, p * 2) }}>
    <svg viewBox="0 0 52 70" width={52} height={70}><path d="M26 2C12 2 2 12 2 26c0 18 24 42 24 42s24-24 24-42C50 12 40 2 26 2z" fill={color} stroke="#fff" strokeWidth={3} /><circle cx={26} cy={26} r={9} fill="#fff" /></svg>
    {label && <div style={{ position: "absolute", top: -34, left: "50%", transform: "translateX(-50%)", whiteSpace: "nowrap", background: "#fff", borderRadius: 10, padding: "4px 10px", fontSize: 18, fontWeight: 800, color: "#0b2545", boxShadow: "0 6px 16px rgba(0,0,0,.15)" }}>{label}</div>}
  </Abs>
);

export const Chip: React.FC<{ x: number; y: number; bg: string; color?: string; size?: number; p?: number; children: React.ReactNode }> = ({ x, y, bg, color = "#fff", size = 22, p = 1, children }) => (
  <Abs x={x} y={y} style={{ background: bg, color, fontSize: size, fontWeight: 800, padding: "8px 16px", borderRadius: 99, whiteSpace: "nowrap", opacity: p, transform: `scale(${0.6 + 0.4 * p})`, transformOrigin: "left center", boxShadow: "0 8px 18px -8px rgba(0,0,0,.35)" }}>{children}</Abs>
);

export const Btn: React.FC<{ x: number; y: number; w: number; h?: number; bg: string; children: React.ReactNode; press?: number }> = ({ x, y, w, h = 52, bg, children, press = 0 }) => (
  <Box x={x} y={y} w={w} h={h} bg={bg} r={h / 2} style={{ display: "grid", placeItems: "center", color: "#fff", fontWeight: 800, fontSize: 20, transform: `scale(${1 - 0.06 * press})` }}>{children}</Box>
);

/** Ikon garis sederhana (Lucide, ISC) digambar langsung sebagai SVG. */
const PATHS: Record<string, string> = {
  bike: "M5.5 17.5m-3.5 0a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0 -7 0M18.5 17.5m-3.5 0a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0 -7 0M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM12 17.5V14l-3-3 4-3 2 3h2",
  box: "M21 8v8a2 2 0 0 1-1 1.73l-7 4a2 2 0 0 1-2 0l-7-4A2 2 0 0 1 3 16V8a2 2 0 0 1 1-1.73l7-4a2 2 0 0 1 2 0l7 4A2 2 0 0 1 21 8zM3.3 7 12 12l8.7-5M12 22V12",
  bag: "M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0",
  brush: "m9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z",
  chat: "M7.9 20A9 9 0 1 0 4 16.1L2 22Z",
  cup: "M10 2v2M14 2v2M6 2v2M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1",
  star: "M11.5 2.3a.5.5 0 0 1 .95 0l2.3 4.7a2.1 2.1 0 0 0 1.6 1.2l5.2.75a.5.5 0 0 1 .3.9l-3.75 3.65a2.1 2.1 0 0 0-.6 1.9l.88 5.1a.5.5 0 0 1-.77.56l-4.6-2.4a2.1 2.1 0 0 0-2 0l-4.6 2.4a.5.5 0 0 1-.77-.56l.88-5.1a2.1 2.1 0 0 0-.6-1.9L2.2 9.85a.5.5 0 0 1 .3-.9l5.15-.75a2.1 2.1 0 0 0 1.6-1.2z",
  printer: "M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 9V3h12v6M6 14h12v8H6z",
  help: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01",
  check: "M20 6 9 17l-5-5",
  bluetooth: "m7 7 10 10-5 5V2l5 5L7 17",
  chart: "M3 3v18h18M18 17V9M13 17V5M8 17v-3",
  wallet: "M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4",
  store: "m2 7 4.4-4.4A2 2 0 0 1 7.8 2h8.4a2 2 0 0 1 1.4.6L22 7M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4M2 7h20M22 7v3a2 2 0 0 1-4 0 2 2 0 0 1-4 0 2 2 0 0 1-4 0 2 2 0 0 1-4 0 2 2 0 0 1-4 0V7",
  file: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7zM14 2v4a2 2 0 0 0 2 2h4M8 13h8M8 17h8",
  down: "M12 15V3M7 10l5 5 5-5M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",
  refresh: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M8 16H3v5",
  ban: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM4.9 4.9l14.2 14.2",
  clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2",
  user: "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  home: "M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8M3 10a2 2 0 0 1 .7-1.5l7-6a2 2 0 0 1 2.6 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  tag: "M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4zM7.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z",
  sparkle: "M9.9 15.5A2 2 0 0 0 8.5 14l-6.1-1.6a.5.5 0 0 1 0-1l6.1-1.6a2 2 0 0 0 1.4-1.4l1.6-6.1a.5.5 0 0 1 1 0l1.6 6.1a2 2 0 0 0 1.4 1.4l6.1 1.6a.5.5 0 0 1 0 1l-6.1 1.6a2 2 0 0 0-1.4 1.4l-1.6 6.1a.5.5 0 0 1-1 0z",
};
export const Icon: React.FC<{ name: keyof typeof PATHS | string; size?: number; color?: string; sw?: number }> = ({ name, size = 40, color = "currentColor", sw = 2 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d={PATHS[name] || PATHS.help} /></svg>
);
/** Ikon dalam lingkaran berwarna. */
export const Badge: React.FC<{ x: number; y: number; name: string; bg: string; color?: string; size?: number; p?: number }> = ({ x, y, name, bg, color = "#fff", size = 96, p = 1 }) => (
  <Abs x={x} y={y} w={size} h={size} style={{ borderRadius: size * 0.3, background: bg, display: "grid", placeItems: "center", opacity: p, transform: `scale(${0.5 + 0.5 * p})`, boxShadow: "0 14px 30px -14px rgba(0,0,0,.4)" }}>
    <Icon name={name} size={size * 0.5} color={color} />
  </Abs>
);

export const Motor: React.FC<{ x: number; y: number; w?: number; bob?: number; flip?: boolean }> = ({ x, y, w = 260, bob = 0, flip }) => (
  <Img src={staticFile("gen/assets/motor.png")} style={{ position: "absolute", left: x, top: y + bob, width: w, transform: flip ? "scaleX(-1)" : undefined }} />
);

/** Kode QR hiasan (pola tetap, bukan untuk dipindai). */
export const FakeQR: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => {
  const n = 21, cells: React.ReactNode[] = [];
  let seed = 7;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  const finder = (i: number, j: number) => (i < 7 && j < 7) || (i < 7 && j > 13) || (i > 13 && j < 7);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    let on = rnd() > 0.52;
    if (finder(i, j)) { const a = i % 14, b = j % 14; const ii = i > 13 ? i - 14 : i, jj = j > 13 ? j - 14 : j; on = ii === 0 || ii === 6 || jj === 0 || jj === 6 || (ii >= 2 && ii <= 4 && jj >= 2 && jj <= 4); void a; void b; }
    if (on) cells.push(<rect key={`${i}-${j}`} x={j} y={i} width={1.02} height={1.02} fill="#111" />);
  }
  return <Abs x={x} y={y} w={s} h={s}><svg viewBox={`0 0 ${n} ${n}`} width={s} height={s} shapeRendering="crispEdges"><rect width={n} height={n} fill="#fff" />{cells}</svg></Abs>;
};
