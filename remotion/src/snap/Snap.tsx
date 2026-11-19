// Promosi Snapgram / Instagram Story: 1080x1920, tepat 30 detik. Latar & perangkat sama dengan tutorial vertikal (bukan animasi 2D).
// Satu kalimat narasi = satu Sequence sepanjang suaranya, jadi gambar & suara mulai di frame yang sama.
import React from "react";
import { AbsoluteFill, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { Fonts, Theme, src, audio } from "../theme";
import { Device } from "../Device";

export type SnapLine = { head: string; say: string; shot?: string; qr?: string; sub?: string; audio: string; frames: number };
export const snapFrames = (lines: SnapLine[]) => lines.reduce((a, l) => a + l.frames, 0);

const CARD: React.CSSProperties = { background: "rgba(255,255,255,.96)", borderRadius: 26, padding: "24px 30px", boxShadow: "0 16px 40px -20px rgba(11,37,69,.45)" };

const Text: React.FC<{ l: SnapLine; theme: Theme }> = ({ l, theme }) => {
  const f = useCurrentFrame(), { fps } = useVideoConfig();
  const p = spring({ frame: f, fps, config: { damping: 15, stiffness: 140 } });
  const tablet = theme.device === "tablet", v = theme.v;
  const head = (
    <div style={{ fontSize: tablet ? 60 : 68, fontWeight: 800, lineHeight: 1.05, letterSpacing: "-.03em", color: theme.ink, opacity: p, transform: `translateY(${(1 - p) * 40}px)` }}>{l.head}</div>
  );
  const say = <div style={{ fontSize: 36, lineHeight: 1.4, fontWeight: 600, color: "#33475e", opacity: interpolate(f, [6, 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>{l.say}</div>;
  return tablet ? (
    <>
      <div style={{ position: "absolute", left: v.panel.x, top: v.panel.y, width: v.panel.w, boxSizing: "border-box", ...CARD }}>{head}</div>
      <div style={{ position: "absolute", left: v.panel.x, top: v.sayTop, width: v.panel.w, boxSizing: "border-box", ...CARD }}>{say}</div>
    </>
  ) : (
    <div style={{ position: "absolute", left: v.panel.x, top: v.panel.y - 10, width: v.panel.w, display: "flex", flexDirection: "column", gap: 16 }}>{head}{say}</div>
  );
};

/** Slide penutup: kartu QR unduh (Agi Mas) atau ajakan (Saget Kasir) di atas area perangkat. */
const Closing: React.FC<{ l: SnapLine; theme: Theme; web?: boolean }> = ({ l, theme, web }) => {
  const f = useCurrentFrame(), { fps } = useVideoConfig();
  const p = spring({ frame: f - 4, fps, config: { damping: 14, stiffness: 130 } }), s = theme.v.screen;
  const cx = s.x + s.w / 2, w = l.qr ? 620 : 860;
  return (
    <div style={{ position: "absolute", left: cx - w / 2, top: l.qr ? s.y + 40 : s.y + 60, width: w, display: "flex", flexDirection: "column", alignItems: "center", gap: 22, padding: "36px 30px",
      background: "#fff", borderRadius: 40, boxShadow: "0 40px 90px -30px rgba(5,25,60,.6)", opacity: p, transform: `scale(${0.85 + 0.15 * p})` }}>
      <Img src={staticFile(theme.logo)} style={{ width: l.qr ? 460 : 640 }} />
      {l.qr && <Img src={staticFile(l.qr)} style={{ width: 440, height: 440 }} />}
      {l.qr && <div style={{ fontSize: 40, fontWeight: 800, color: theme.ink }}>{web ? "Pindai untuk membuka" : "Pindai untuk unduh"}</div>}
      {l.sub && <div style={{ fontSize: 30, fontWeight: 700, color: theme.brand }}>{l.sub}</div>}
    </div>
  );
};

export const Snap: React.FC<{ app: string; lines: SnapLine[]; theme: Theme; url?: string }> = ({ app, lines, theme, url }) => {
  const s = theme.v.screen, top = url ? 64 : 0;   // versi website: bilah alamat browser di atas layar
  let t = 0;
  const seq = lines.map((l) => { const from = t; t += l.frames; return { l, from }; });
  const shots = seq.filter(({ l }) => l.shot);
  return (
    <AbsoluteFill style={{ fontFamily: theme.font, background: "#fff" }}>
      <Fonts />
      <Img src={staticFile(theme.v.bg)} style={{ position: "absolute", inset: 0, width: 1080, height: 1920 }} />
      <Device theme={theme} x={s.x} y={s.y} w={s.w} h={s.h}>
        {shots.map(({ l, from }, k) => (
          <Sequence key={k} from={from} durationInFrames={k === shots.length - 1 ? t - from : shots[k + 1].from - from + 8} layout="none">
            <div style={{ position: "absolute", left: 0, top, width: s.w, height: s.h - top, overflow: "hidden" }}><Shot file={src(app, l.shot!)} w={s.w} h={s.h} /></div>
          </Sequence>
        ))}
        {url && (
          <div style={{ position: "absolute", left: 0, top: 0, width: s.w, height: top, background: "#f1f3f4", display: "flex", alignItems: "center", padding: "0 14px", boxSizing: "border-box", borderBottom: "1px solid #dadce0" }}>
            <div style={{ flex: 1, height: 42, borderRadius: 21, background: "#fff", display: "flex", alignItems: "center", gap: 10, padding: "0 16px", fontSize: 20, fontWeight: 600, color: "#202124", boxShadow: "inset 0 0 0 1px #dadce0" }}>
              <span style={{ fontSize: 18 }}>🔒</span>{url}
            </div>
          </div>
        )}
      </Device>
      {seq.map(({ l, from }, k) => (
        <Sequence key={k} from={from} durationInFrames={l.frames}>
          <Audio src={audio(app, l.audio)} />
          <Text l={l} theme={theme} />
          {!l.shot && <Closing l={l} theme={theme} web={!!url} />}
        </Sequence>
      ))}
      <Bar total={t} color={theme.brand} />
    </AbsoluteFill>
  );
};

const Shot: React.FC<{ file: string; w: number; h: number }> = ({ file, w, h }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 8], [0, 1], { extrapolateRight: "clamp" }), z = interpolate(f, [0, 200], [1, 1.05], { extrapolateRight: "clamp" });
  return <Img src={file} style={{ position: "absolute", inset: 0, width: w, height: h, objectFit: "cover", objectPosition: "top", opacity: o, transform: `scale(${z})`, transformOrigin: "50% 0" }} />;
};

const Bar: React.FC<{ total: number; color: string }> = ({ total, color }) => {
  const f = useCurrentFrame();
  return <div style={{ position: "absolute", left: 0, bottom: 0, height: 10, width: `${(100 * f) / total}%`, background: color }} />;
};
