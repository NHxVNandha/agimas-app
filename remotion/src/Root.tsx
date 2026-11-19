import React from "react";
import { Composition } from "remotion";
import agimas from "./gen/agimas.json";
import kasir from "./gen/kasir.json";
import { Tutorial, tutorialFrames } from "./Tutorial";
import { Slides, slidesFrames } from "./Slides";
import { THEMES, Data } from "./theme";

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
          </React.Fragment>
        );
      })}
    </>
  );
};
