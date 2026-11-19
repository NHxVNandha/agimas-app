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

const CARD = { background: "rgba(255,255,255,.95)", padding: "22px 26px", borderRadius: 22, boxShadow: "0 14px 34px -18px rgba(23,63,46,.45)" };

const Panel: React.FC<{ d: Data; theme: Theme; scene: number; idx: number; vertical: boolean }> = ({ d, theme, scene, idx, vertical }) => {
  const f = useCurrentFrame();
  const sc = d.tutorial[scene], real = d.tutorial.length - 2;
  // judul & teks hanya beranimasi di kalimat pertama adegan; kalimat berikutnya cukup menggeser sorotan
  const rise = (delay: number) => idx > 0 ? {} : ({ opacity: interpolate(f, [delay, delay + 12], [0, 1], { extrapolateRight: "clamp" }), transform: `translateY(${interpolate(f, [delay, delay + 12], [16, 0], { extrapolateRight: "clamp" })}px)` });
  const titleSize = vertical ? (theme.panel.card ? 44 : 46) : theme.panel.card ? 40 : 52;
  const saySize = vertical ? (theme.panel.card ? 32 : 27) : theme.panel.card ? 24 : 28;
  const sayTop = vertical ? theme.v.sayTop : undefined;   // tablet vertikal: narasi di kotak sendiri di bawah perangkat
  const say = (
    <div style={{ ...rise(6), fontSize: saySize, lineHeight: 1.5, fontWeight: 500,
      ...(sayTop ? { position: "absolute", left: theme.panel.x, top: sayTop, width: theme.panel.w, boxSizing: "border-box", ...CARD } : {}) }}>
      {d.tutorial[scene].beats.map((b, k) => <span key={k} style={{ color: k === idx ? theme.ink : "#9aa9bb" }}>{b.say} </span>)}
    </div>
  );
  return (<>
    <div style={{ position: "absolute", left: theme.panel.x, top: theme.panel.y, width: theme.panel.w, boxSizing: "border-box", display: "flex", flexDirection: "column", gap: vertical ? 14 : 16,
      ...(theme.panel.card ? CARD : {}) }}>
      <div style={{ ...rise(0), alignSelf: "flex-start", padding: "8px 16px", borderRadius: 99, background: theme.brand, color: "#fff", fontWeight: 700, fontSize: 20 }}>Langkah {scene} dari {real}</div>
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
        {Array.from({ length: real }, (_, k) => <i key={k} style={{ width: 26, height: 6, borderRadius: 9, background: theme.brand, opacity: k + 1 === scene ? 1 : k + 1 < scene ? 0.35 : 0.12 }} />)}
      </div>
      <div style={{ ...rise(3), fontWeight: 800, fontSize: titleSize, lineHeight: 1.1, letterSpacing: "-.02em", color: theme.ink }}>{sc.title}</div>
      {!sayTop && say}
    </div>
    {sayTop && say}
  </>);
};

const Card: React.FC<{ theme: Theme; card: NonNullable<Data["tutorial"][0]["card"]>; first: boolean }> = ({ theme, card, first }) => {
  const f = useCurrentFrame();
  const rise = (d: number) => !first ? {} : ({ opacity: interpolate(f, [d, d + 15], [0, 1], { extrapolateRight: "clamp" }), transform: `translateY(${interpolate(f, [d, d + 15], [24, 0], { extrapolateRight: "clamp" })}px)` });
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg,#fff,${theme.light})`, alignItems: "center", justifyContent: "center", gap: 26, textAlign: "center", color: theme.ink }}>
      <Img src={staticFile(theme.logo)} style={{ width: 720, ...rise(0) }} />
      <div style={{ ...rise(8), fontSize: 22, fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", color: theme.brand }}>{card.k}</div>
      <div style={{ ...rise(14), fontSize: 84, fontWeight: 800, letterSpacing: "-.03em" }}>{card.h}</div>
      <div style={{ ...rise(20), fontSize: 32, color: theme.muted, maxWidth: 1200, padding: "0 60px" }}>{card.p}</div>
    </AbsoluteFill>
  );
};

export const Tutorial: React.FC<{ data: Data; theme: Theme; vertical?: boolean }> = ({ data, theme: base, vertical = false }) => {
  const { beats, items } = timeline(data);
  // vertikal: latar story, posisi layar & panel dari theme.v (sama dengan video rekaman versi story)
  const theme: Theme = vertical ? { ...base, bg: base.v.bg, screen: base.v.screen, panel: { ...base.v.panel, card: base.panel.card } } : base;
  const s = theme.screen, W = vertical ? 1080 : 1920, H = vertical ? 1920 : 1080;
  return (
    <AbsoluteFill style={{ fontFamily: theme.font, background: "#fff" }}>
      <Fonts />
      <Img src={staticFile(theme.bg)} style={{ position: "absolute", inset: 0, width: W, height: H }} />
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
          {data.tutorial[b.scene].card ? <Card theme={theme} card={data.tutorial[b.scene].card!} first={b.idx === 0} /> : <Panel d={data} theme={theme} scene={b.scene} idx={b.idx} vertical={vertical} />}
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
