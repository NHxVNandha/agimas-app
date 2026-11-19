// Titik masuk terpisah untuk video Snapgram (30 detik, Agi Mas versi website): npx remotion render src/snap/index.tsx Agimas-Snapgram out.mp4
import React from "react";
import { Composition, registerRoot } from "remotion";
import agimas from "../gen/agimas.json";
import kasir from "../gen/kasir.json";
import { THEMES } from "../theme";
import { Snap, SnapLine, snapFrames } from "./Snap";

const Root: React.FC = () => (
  <>
    {([["Agimas", agimas], ["SagetKasir", kasir]] as const).map(([name, d]) => {
      const lines = (d as unknown as { snap: SnapLine[] }).snap, app = (d as { app: "agimas" | "kasir" }).app;
      return <Composition key={name} id={`${name}-Snapgram`} component={Snap} durationInFrames={snapFrames(lines)} fps={30} width={1080} height={1920}
        defaultProps={{ app, lines, theme: THEMES[app], url: app === "agimas" ? "solusiagimas.netlify.app" : undefined }} />;
    })}
  </>
);
registerRoot(Root);
