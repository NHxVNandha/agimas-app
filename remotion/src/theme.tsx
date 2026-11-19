import React, { useEffect, useState } from "react";
import { continueRender, delayRender, staticFile } from "remotion";

export type Seg = { shot: string; x: number; y: number };
export type Beat = { say: string; audio: string; frames: number; segs: Seg[]; after: string | null };
export type Scene = { title: string; card?: { h: string; p: string; k: string } | null; beats: Beat[] };
export type Line = { kind: "hook" | "logo" | "shot" | "list" | "flow" | "cta"; head: string; sub?: string; say: string; shot?: string; items?: string[]; audio: string; frames: number };
export type Data = { app: "agimas" | "kasir"; fps: number; tutorial: Scene[]; promo: Line[]; desc: Line[] };

export type Theme = {
  name: string; brand: string; dark: string; light: string; ink: string; muted: string; accent: string; font: string;
  logo: string; bg: string; device: "phone" | "tablet";
  // posisi layar perangkat di latar tutorial (piksel 1920x1080) dan panel teks
  screen: { x: number; y: number; w: number; h: number; r: number }; panel: { x: number; y: number; w: number; card: boolean };
};

export const THEMES: Record<Data["app"], Theme> = {
  agimas: {
    name: "Agi Mas", brand: "#1e7be6", dark: "#0b3d8c", light: "#eaf3fe", ink: "#0b2545", muted: "#6a7f97", accent: "#ffc93c", font: "Plus Jakarta Sans",
    logo: "gen/assets/logo-agimas.png", bg: "gen/assets/bg-agimas.png", device: "phone",
    screen: { x: 1284, y: 67, w: 440, h: 946, r: 42 }, panel: { x: 140, y: 380, w: 640, card: false },
  },
  kasir: {
    name: "Saget Kasir", brand: "#1f6b45", dark: "#173f2e", light: "#e4f4ea", ink: "#13201a", muted: "#5f7268", accent: "#f2b33d", font: "Inter",
    logo: "gen/assets/logo-kasir.png", bg: "gen/assets/bg-kasir.png", device: "tablet",
    screen: { x: 74, y: 140, w: 1280, h: 800, r: 20 }, panel: { x: 1438, y: 210, w: 432, card: true },
  },
};

export const src = (app: string, f: string) => staticFile(`gen/${app}/shots/${f}`);
export const audio = (app: string, f: string) => staticFile(`gen/${app}/audio/${f}`);

/** Huruf lokal (sama dengan aplikasi): render ditahan sampai huruf termuat agar teks tidak berganti di tengah video. */
export const Fonts: React.FC = () => {
  const [h] = useState(() => delayRender("huruf"));
  useEffect(() => {
    Promise.all([
      new FontFace("Plus Jakarta Sans", `url(${staticFile("gen/assets/PlusJakartaSans.woff2")})`, { weight: "200 800" }).load(),
      new FontFace("Inter", `url(${staticFile("gen/assets/Inter.woff2")})`, { weight: "100 900" }).load(),
    ]).then((fs) => { fs.forEach((f) => document.fonts.add(f)); continueRender(h); })
      .catch(() => continueRender(h));
  }, [h]);
  return null;
};
