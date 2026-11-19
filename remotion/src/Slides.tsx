import React from "react";
import { AbsoluteFill, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { Data, Line, Theme, Fonts, src, audio } from "./theme";
import { Device } from "./Device";

export const slidesFrames = (lines: Line[]) => lines.reduce((a, l) => a + l.frames, 0);

/** Video promosi & deskripsi: satu kalimat narasi = satu slide; panjang slide = panjang suaranya (+ jeda), jadi selalu sinkron. */
export const Slides: React.FC<{ data: Data; lines: Line[]; theme: Theme; mode: "promo" | "desc" }> = ({ data, lines, theme, mode }) => {
  let t = 0;
  const seq = lines.map((l) => { const from = t; t += l.frames; return { l, from }; });
  return (
    <AbsoluteFill style={{ fontFamily: theme.font, background: "#fff" }}>
      <Fonts />
      {seq.map(({ l, from }, k) => (
        <Sequence key={k} from={from} durationInFrames={l.frames}>
          <Audio src={audio(data.app, l.audio)} />
          <Slide l={l} theme={theme} app={data.app} mode={mode} />
          <Caption text={l.say} theme={theme} dark={mode === "promo" && l.kind !== "shot"} />
        </Sequence>
      ))}
      <Progress total={t} theme={theme} />
    </AbsoluteFill>
  );
};

const useIn = (delay = 0) => {
  const f = useCurrentFrame(), { fps } = useVideoConfig();
  return spring({ frame: f - delay, fps, config: { damping: 16, stiffness: 120 } });
};

const Bg: React.FC<{ theme: Theme; dark: boolean }> = ({ theme, dark }) => {
  const f = useCurrentFrame(), { width } = useVideoConfig(), v = width < 1200;
  const drift = interpolate(f, [0, 300], [0, 60]);
  return dark ? (
    <AbsoluteFill style={{ background: `radial-gradient(1300px 900px at 30% 20%, ${theme.brand} 0%, ${theme.dark} 70%)` }}>
      <div style={{ position: "absolute", width: 900, height: 900, borderRadius: "50%", right: -250 + drift, top: -300, background: "rgba(255,255,255,.07)" }} />
      <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", left: -200, bottom: -260 - drift, background: "rgba(255,255,255,.05)" }} />
    </AbsoluteFill>
  ) : (
    <AbsoluteFill style={{ background: `linear-gradient(160deg,#ffffff 0%,${theme.light} 100%)` }}>
      <div style={{ position: "absolute", width: 1100, height: 1100, borderRadius: "50%", right: v ? -60 + drift : -380 + drift, top: v ? 820 : -60, background: theme.brand, opacity: 0.95 }} />
      <div style={{ position: "absolute", width: 34, height: 34, borderRadius: "50%", left: v ? 940 : 980, top: (v ? 560 : 140) + drift / 2, background: theme.accent }} />
    </AbsoluteFill>
  );
};

const Words: React.FC<{ text: string; size: number; color: string; delay?: number; center?: boolean }> = ({ text, size, color, delay = 0, center }) => {
  const f = useCurrentFrame(), { fps } = useVideoConfig();
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: `0 ${size * 0.25}px`, justifyContent: center ? "center" : "flex-start", fontSize: size, fontWeight: 800, letterSpacing: "-.03em", lineHeight: 1.05, color }}>
      {text.split(" ").map((w, i) => {
        const p = spring({ frame: f - delay - i * 3, fps, config: { damping: 14, stiffness: 140 } });
        return <span key={i} style={{ display: "inline-block", opacity: p, transform: `translateY(${(1 - p) * 40}px)` }}>{w}</span>;
      })}
    </div>
  );
};

const Shot: React.FC<{ theme: Theme; app: string; file: string; x: number; scale?: number }> = ({ theme, app, file, x: x0, scale = 1 }) => {
  const p = useIn(4), f = useCurrentFrame(), { width } = useVideoConfig(), v = width < 1200;
  const phone = theme.device === "phone";
  const w = v ? (phone ? 480 : 960) : (phone ? 420 : 1040) * scale, h = v ? (phone ? 1032 : 600) : (phone ? 903 : 650) * scale;   // vertikal: perangkat selesai di atas subtitle
  const x = v ? (1080 - w) / 2 : x0;
  const y = (v ? (phone ? 500 : 700) : phone ? (1080 - h) / 2 - 20 : 250) + (1 - p) * 120;
  const zoom = interpolate(f, [0, 240], [1, 1.04], { extrapolateRight: "clamp" });   // gerak pelan agar gambar tidak diam
  return (
    <div style={{ opacity: p }}>
      <Device theme={theme} x={x} y={y} w={w} h={h}>
        <Img src={src(app, file)} style={{ width: w, height: h, objectFit: "cover", objectPosition: "top", transform: `scale(${zoom})`, transformOrigin: "50% 0" }} />
      </Device>
    </div>
  );
};

const Slide: React.FC<{ l: Line; theme: Theme; app: string; mode: "promo" | "desc" }> = ({ l, theme, app, mode }) => {
  const phone = theme.device === "phone", v = useVideoConfig().width < 1200;
  const logo = staticFile(theme.logo);
  const pLogo = useIn(0), pList = useIn(8);
  if (l.kind === "logo" || l.kind === "cta") {
    const dark = mode === "promo";
    const qr = l.qr && (   // kode QR unduh: kartu putih besar, cukup lama di layar untuk dipindai
      <div style={{ background: "#fff", borderRadius: 32, padding: 28, display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
        boxShadow: "0 30px 80px -30px rgba(0,0,0,.5)", opacity: pList, transform: `scale(${0.85 + 0.15 * pList})` }}>
        <Img src={staticFile(l.qr)} style={{ width: v ? 420 : 380, height: v ? 420 : 380, display: "block" }} />
        <b style={{ fontSize: v ? 32 : 28, color: theme.ink }}>Pindai untuk unduh</b>
      </div>
    );
    if (qr && !v) return (
      <AbsoluteFill>
        <Bg theme={theme} dark={dark} />
        <AbsoluteFill style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 110, paddingBottom: 110 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 30 }}>
            <div style={{ background: "#fff", borderRadius: 36, padding: "34px 46px", boxShadow: "0 30px 80px -30px rgba(0,0,0,.45)", opacity: pLogo }}>
              <Img src={logo} style={{ width: 620, display: "block" }} />
            </div>
            <Words text={l.head} size={72} color={dark ? "#fff" : theme.ink} delay={10} center />
            {l.sub && <div style={{ fontSize: 34, fontWeight: 700, color: dark ? "rgba(255,255,255,.9)" : theme.brand, opacity: pList }}>{l.sub}</div>}
          </div>
          {qr}
        </AbsoluteFill>
      </AbsoluteFill>
    );
    return (
      <AbsoluteFill>
        <Bg theme={theme} dark={dark} />
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: qr ? 26 : 34, paddingBottom: v ? 260 : 120 }}>
          <div style={{ background: "#fff", borderRadius: 40, padding: "40px 56px", boxShadow: "0 30px 80px -30px rgba(0,0,0,.45)", transform: `scale(${0.8 + 0.2 * pLogo})`, opacity: pLogo }}>
            <Img src={logo} style={{ width: v ? 700 : 760, display: "block" }} />
          </div>
          <Words text={l.head} size={l.kind === "cta" ? 72 : 64} color={dark ? "#fff" : theme.ink} delay={10} center />
          {l.sub && <div style={{ fontSize: 36, fontWeight: 700, color: dark ? "rgba(255,255,255,.9)" : theme.brand, opacity: pList }}>{l.sub}</div>}
          {qr}
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }
  if (l.kind === "list" || l.kind === "flow") {
    return (
      <AbsoluteFill>
        <Bg theme={theme} dark={false} />
        <AbsoluteFill style={{ padding: v ? "170px 80px" : "110px 140px", gap: 50 }}>
          <Img src={logo} style={{ width: v ? 360 : 300, opacity: pLogo }} />
          <Words text={l.head} size={v ? 80 : 76} color={theme.ink} delay={4} />
          <div style={{ display: "flex", flexDirection: l.kind === "flow" && !v ? "row" : "column", gap: l.kind === "flow" ? 0 : 20, alignItems: l.kind === "flow" && !v ? "center" : "flex-start", maxWidth: l.kind === "flow" && !v ? 1640 : 980 }}>
            {(l.items || []).map((it, i) => <Item key={i} i={i} text={it} theme={theme} flow={l.kind === "flow"} last={i === (l.items || []).length - 1} vertical={v} />)}
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }
  // hook & shot: judul besar + perangkat berisi tangkapan layar aplikasi
  const dark = mode === "promo" && l.kind === "hook";
  return (
    <AbsoluteFill>
      <Bg theme={theme} dark={dark} />
      <div style={{ position: "absolute", left: v ? 80 : 140, top: v ? 200 : phone ? 300 : 110, width: v ? 920 : phone ? 900 : 1640 }}>
        <Words text={l.head} size={v ? 88 : phone ? 96 : 72} color={dark ? "#fff" : theme.ink} delay={2} />
      </div>
      {l.shot && <Shot theme={theme} app={app} file={l.shot} x={phone ? 1290 : 440} scale={phone ? 1 : 1.08} />}
    </AbsoluteFill>
  );
};

const Item: React.FC<{ i: number; text: string; theme: Theme; flow: boolean; last: boolean; vertical?: boolean }> = ({ i, text, theme, flow, last, vertical }) => {
  const p = useIn(14 + i * 9);
  const box = (
    <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "22px 30px", borderRadius: 22, background: "#fff", boxShadow: "0 16px 40px -20px rgba(11,37,69,.35)",
      border: `2px solid ${theme.light}`, opacity: p, transform: `translateX(${(1 - p) * -40}px)`, ...(flow ? { width: vertical ? 920 : 440, boxSizing: "border-box" as const } : {}) }}>
      <span style={{ flex: "none", width: 52, height: 52, borderRadius: 16, background: theme.brand, color: "#fff", display: "grid", placeItems: "center", fontSize: 26, fontWeight: 800 }}>{i + 1}</span>
      <span style={{ fontSize: 36, fontWeight: 700, color: theme.ink, lineHeight: 1.2 }}>{text}</span>
    </div>
  );
  return flow ? (
    <div style={{ display: "flex", flexDirection: vertical ? "column" : "row", alignItems: "center" }}>
      {box}
      {!last && <span style={{ width: 90, textAlign: "center", fontSize: 56, fontWeight: 800, color: theme.brand, opacity: p }}>{vertical ? "↓" : "→"}</span>}
    </div>
  ) : box;
};

const Caption: React.FC<{ text: string; theme: Theme; dark: boolean }> = ({ text, dark }) => {
  const f = useCurrentFrame(), v = useVideoConfig().width < 1200;
  const o = interpolate(f, [0, 8], [0, 1], { extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: v ? 60 : 140, right: v ? 60 : 140, bottom: v ? 230 : 56, display: "flex", justifyContent: "center", opacity: o }}>
      <div style={{ maxWidth: 1400, padding: "14px 26px", borderRadius: 16, fontSize: v ? 34 : 30, fontWeight: 600, lineHeight: 1.35, textAlign: "center",
        background: dark ? "rgba(0,0,0,.35)" : "rgba(11,37,69,.78)", color: "#fff" }}>{text}</div>
    </div>
  );
};

const Progress: React.FC<{ total: number; theme: Theme }> = ({ total, theme }) => {
  const f = useCurrentFrame();
  return <div style={{ position: "absolute", left: 0, bottom: 0, height: 8, width: `${(100 * f) / total}%`, background: theme.accent }} />;
};
