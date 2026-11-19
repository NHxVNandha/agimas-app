import React from "react";
import { Composition } from "remotion";
import agimas from "./gen/agimas.json";
import kasir from "./gen/kasir.json";
import { Tutorial, tutorialFrames } from "./Tutorial";
import { Slides, slidesFrames } from "./Slides";
import { THEMES, Data } from "./theme";
import { AnimTutorial, AnimSlides, animTutorialFrames, animSlidesFrames } from "./anim/Animasi";

// Panjang tiap video = jumlah frame semua kalimat (frame kalimat = durasi suaranya + jeda), jadi narasi & gambar selalu pas.
export const RemotionRoot: React.FC = () => {
  const apps: [string, Data][] = [["Agimas", agimas as Data], ["SagetKasir", kasir as Data]];
  return (
    <>
      {apps.map(([name, d]) => {
        const theme = THEMES[d.app];
        return (
          <React.Fragment key={name}>
            <Composition id={`${name}-Promosi`} component={Slides} durationInFrames={slidesFrames(d.promo)} fps={d.fps} width={1920} height={1080}
              defaultProps={{ data: d, lines: d.promo, theme, mode: "promo" as const }} />
            <Composition id={`${name}-Deskripsi`} component={Slides} durationInFrames={slidesFrames(d.desc)} fps={d.fps} width={1920} height={1080}
              defaultProps={{ data: d, lines: d.desc, theme, mode: "desc" as const }} />
            <Composition id={`${name}-Tutorial`} component={Tutorial} durationInFrames={tutorialFrames(d)} fps={d.fps} width={1920} height={1080}
              defaultProps={{ data: d, theme }} />
            {/* versi vertikal 1080x1920 (Story/Reels/TikTok): data & narasi sama, tata letak atas-bawah */}
            <Composition id={`${name}-Promosi-Vertikal`} component={Slides} durationInFrames={slidesFrames(d.promo)} fps={d.fps} width={1080} height={1920}
              defaultProps={{ data: d, lines: d.promo, theme, mode: "promo" as const }} />
            <Composition id={`${name}-Deskripsi-Vertikal`} component={Slides} durationInFrames={slidesFrames(d.desc)} fps={d.fps} width={1080} height={1920}
              defaultProps={{ data: d, lines: d.desc, theme, mode: "desc" as const }} />
            <Composition id={`${name}-Tutorial-Vertikal`} component={Tutorial} durationInFrames={tutorialFrames(d)} fps={d.fps} width={1080} height={1920}
              defaultProps={{ data: d, theme, vertical: true }} />
            {/* animasi ilustrasi 2D (landscape & vertikal) */}
            {([false, true] as const).map((v) => (
              <React.Fragment key={String(v)}>
                <Composition id={`${name}-Animasi-Promosi${v ? "-Vertikal" : ""}`} component={AnimSlides} durationInFrames={animSlidesFrames(d.promo)} fps={d.fps} width={v ? 1080 : 1920} height={v ? 1920 : 1080}
                  defaultProps={{ data: d, lines: d.promo, theme, vertical: v }} />
                <Composition id={`${name}-Animasi-Deskripsi${v ? "-Vertikal" : ""}`} component={AnimSlides} durationInFrames={animSlidesFrames(d.desc)} fps={d.fps} width={v ? 1080 : 1920} height={v ? 1920 : 1080}
                  defaultProps={{ data: d, lines: d.desc, theme, vertical: v }} />
                <Composition id={`${name}-Animasi-Tutorial${v ? "-Vertikal" : ""}`} component={AnimTutorial} durationInFrames={animTutorialFrames(d)} fps={d.fps} width={v ? 1080 : 1920} height={v ? 1920 : 1080}
                  defaultProps={{ data: d, theme, vertical: v }} />
              </React.Fragment>
            ))}
          </React.Fragment>
        );
      })}
    </>
  );
};
