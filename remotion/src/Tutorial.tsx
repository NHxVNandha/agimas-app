import React from "react";
import { AbsoluteFill, Img, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { Data, Theme, Fonts, src, audio } from "./theme";
import { Device, Screen, Tap } from "./Device";

export const tutorialFrames = (d: Data) => d.tutorial.reduce((a, s) => a + s.beats.reduce((b, x) => b + x.frames, 0), 0);

type Item = { from: number; len: number; file: string; tap?: { x: number; y: number } };

/** Garis waktu: tiap kalimat mulai di frame-nya sendiri (= jumlah frame kalimat sebelumnya), suaranya diputar di frame yang sama.
 *  Di dalam kalimat: gambar sebelum tiap ketukan (dengan titik tap), lalu gambar sesudah aksi sampai kalimat selesai. */
function timeline(d: Data) {
  const beats: { from: number; frames: number; scene: number; idx: number; audio: string }[] = [];
  const items: Item[] = [];
  let t = 0;
  d.tutorial.forEach((sc, si) => sc.beats.forEach((b, bi) => {
    beats.push({ from: t, frames: b.frames, scene: si, idx: bi, audio: b.audio });
    if (!sc.card) {
      const n = b.segs.length, tapLen = n ? Math.max(18, Math.min(36, Math.floor((b.frames * 0.6) / n))) : 0;
      b.segs.forEach((s, k) => items.push({ from: t + k * tapLen, len: tapLen, file: s.shot, tap: { x: s.x, y: s.y } }));
      if (b.after) items.push({ from: t + n * tapLen, len: b.frames - n * tapLen, file: b.after });
    }
    t += b.frames;
  }));
  return { beats, items };
}

const Panel: React.FC<{ d: Data; theme: Theme; scene: number; idx: number }> = ({ d, theme, scene, idx }) => {
  const f = useCurrentFrame();
  const sc = d.tutorial[scene], real = d.tutorial.length - 2;
  // judul & teks hanya beranimasi di kalimat pertama adegan; kalimat berikutnya cukup menggeser sorotan
  const rise = (delay: number) => idx > 0 ? {} : ({ opacity: interpolate(f, [delay, delay + 12], [0, 1], { extrapolateRight: "clamp" }), transform: `translateY(${interpolate(f, [delay, delay + 12], [16, 0], { extrapolateRight: "clamp" })}px)` });
  return (
    <div style={{ position: "absolute", left: theme.panel.x, top: theme.panel.y, width: theme.panel.w, display: "flex", flexDirection: "column", gap: 16,
      ...(theme.panel.card ? { background: "rgba(255,255,255,.95)", padding: "22px 26px", borderRadius: 22, boxShadow: "0 14px 34px -18px rgba(23,63,46,.45)" } : {}) }}>
      <div style={{ ...rise(0), alignSelf: "flex-start", padding: "8px 16px", borderRadius: 99, background: theme.brand, color: "#fff", fontWeight: 700, fontSize: 20 }}>Langkah {scene} dari {real}</div>
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
        {Array.from({ length: real }, (_, k) => <i key={k} style={{ width: 26, height: 6, borderRadius: 9, background: theme.brand, opacity: k + 1 === scene ? 1 : k + 1 < scene ? 0.35 : 0.12 }} />)}
      </div>
      <div style={{ ...rise(3), fontWeight: 800, fontSize: theme.panel.card ? 40 : 52, lineHeight: 1.1, letterSpacing: "-.02em", color: theme.ink }}>{sc.title}</div>
      <div style={{ ...rise(6), fontSize: theme.panel.card ? 24 : 28, lineHeight: 1.5, fontWeight: 500 }}>
        {sc.beats.map((b, k) => <span key={k} style={{ color: k === idx ? theme.ink : "#9aa9bb", transition: "none" }}>{b.say} </span>)}
      </div>
    </div>
  );
};

const Card: React.FC<{ theme: Theme; card: NonNullable<Data["tutorial"][0]["card"]>; first: boolean }> = ({ theme, card, first }) => {
  const f = useCurrentFrame();
  const rise = (d: number) => !first ? {} : ({ opacity: interpolate(f, [d, d + 15], [0, 1], { extrapolateRight: "clamp" }), transform: `translateY(${interpolate(f, [d, d + 15], [24, 0], { extrapolateRight: "clamp" })}px)` });
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg,#fff,${theme.light})`, alignItems: "center", justifyContent: "center", gap: 26, textAlign: "center", color: theme.ink }}>
      <Img src={staticFile(theme.logo)} style={{ width: 720, ...rise(0) }} />
      <div style={{ ...rise(8), fontSize: 22, fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", color: theme.brand }}>{card.k}</div>
      <div style={{ ...rise(14), fontSize: 84, fontWeight: 800, letterSpacing: "-.03em" }}>{card.h}</div>
      <div style={{ ...rise(20), fontSize: 32, color: theme.muted, maxWidth: 1200 }}>{card.p}</div>
    </AbsoluteFill>
  );
};

export const Tutorial: React.FC<{ data: Data; theme: Theme }> = ({ data, theme }) => {
  const { beats, items } = timeline(data);
  const s = theme.screen;
  return (
    <AbsoluteFill style={{ fontFamily: theme.font, background: "#fff" }}>
      <Fonts />
      <Img src={staticFile(theme.bg)} style={{ position: "absolute", inset: 0, width: 1920, height: 1080 }} />
      <Device theme={theme} x={s.x} y={s.y} w={s.w} h={s.h}>
        {items.map((it, k) => (
          <Sequence key={k} from={it.from} durationInFrames={it.len + 8} layout="none">
            <Screen file={src(data.app, it.file)} w={s.w} h={s.h} />
            {it.tap && <Tap x={it.tap.x} y={it.tap.y} w={s.w} h={s.h} color={theme.brand} />}
          </Sequence>
        ))}
      </Device>
      {beats.map((b, k) => (
        <Sequence key={k} from={b.from} durationInFrames={b.frames}>
          <Audio src={audio(data.app, b.audio)} />
          {data.tutorial[b.scene].card ? <Card theme={theme} card={data.tutorial[b.scene].card!} first={b.idx === 0} /> : <Panel d={data} theme={theme} scene={b.scene} idx={b.idx} />}
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
