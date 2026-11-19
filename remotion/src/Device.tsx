import React from "react";
import { Img, interpolate, useCurrentFrame } from "remotion";
import { Theme } from "./theme";

/** Bingkai HP / tablet datar (tanpa 3D) di posisi layar w x h; children = isi layar. */
export const Device: React.FC<{ theme: Theme; x: number; y: number; w: number; h: number; children: React.ReactNode; shadow?: boolean }> = ({ theme, x, y, w, h, children, shadow = true }) => {
  const pad = theme.device === "phone" ? 14 : 14, r = theme.device === "phone" ? 56 : 34;
  return (
    <div style={{ position: "absolute", left: x - pad, top: y - pad, width: w + pad * 2, height: h + pad * 2, borderRadius: r, background: "#0d1117", padding: pad,
      boxShadow: shadow ? "0 40px 90px -24px rgba(5,25,60,.55), inset 0 0 0 2px rgba(255,255,255,.3)" : undefined }}>
      <div style={{ position: "relative", width: w, height: h, borderRadius: r - pad, overflow: "hidden", background: "#fff" }}>{children}</div>
    </div>
  );
};

/** Gambar layar yang muncul halus (fade 6 frame) di atas gambar sebelumnya. */
export const Screen: React.FC<{ file: string; w: number; h: number }> = ({ file, w, h }) => {
  const f = useCurrentFrame();
  return <Img src={file} style={{ position: "absolute", inset: 0, width: w, height: h, objectFit: "cover", objectPosition: "top", opacity: interpolate(f, [0, 6], [0, 1], { extrapolateRight: "clamp" }) }} />;
};

/** Titik ketukan: lingkaran jari muncul lalu riak membesar, di koordinat relatif layar. */
export const Tap: React.FC<{ x: number; y: number; w: number; h: number; color: string }> = ({ x, y, w, h, color }) => {
  const f = useCurrentFrame();
  const show = interpolate(f, [0, 6], [0, 1], { extrapolateRight: "clamp" });
  const rip = interpolate(f, [8, 26], [0.5, 2.6], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ripO = interpolate(f, [8, 26], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const size = 46;
  return (
    <div style={{ position: "absolute", left: x * w - size / 2, top: y * h - size / 2, width: size, height: size, opacity: show }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(255,255,255,.45)", border: "3px solid rgba(20,20,20,.75)", boxShadow: "0 6px 18px rgba(0,0,0,.35)" }} />
      <div style={{ position: "absolute", inset: -3, borderRadius: "50%", border: `4px solid ${color}`, transform: `scale(${rip})`, opacity: ripO }} />
    </div>
  );
};
