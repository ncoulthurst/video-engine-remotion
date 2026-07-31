/**
 * brandPreview — mounts the REAL ParticleSandFill / PieShareChart components
 * via @remotion/player inside the Sequencely brand editor's live preview
 * panel. Bundled standalone with esbuild (see scripts/build-brand-preview.mjs)
 * into a single browser-ready JS file the Flask app serves as a static asset
 * — this file is NOT part of the Remotion CLI render pipeline (Root.tsx is
 * untouched), it's a second, tiny entry point into the same component code.
 */
import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Player } from "@remotion/player";
import { ParticleSandFill, type ParticleSandFillProps } from "./ParticleSandFill";
import { PieShareChart, type PieShareChartProps } from "./PieShareChart";
import { setBrandFonts } from "./shared";

type Kind = "barchart" | "piechart";

const COMPONENTS = {
  barchart: ParticleSandFill,
  piechart: PieShareChart,
} as const;

// Matches these two compositions' Root.tsx registration exactly.
const DURATION = 150;
const FPS = 30;
const WIDTH = 1920;
const HEIGHT = 1080;

type MountHandle = {
  setProps: (p: ParticleSandFillProps | PieShareChartProps) => void;
  bumpFontGen: () => void;
};

const mounts: Record<string, MountHandle> = {};

function Wrapper({
  mountId,
  kind,
  initialProps,
}: {
  mountId: string;
  kind: Kind;
  initialProps: ParticleSandFillProps | PieShareChartProps;
}) {
  const [props, setProps] = useState(initialProps);
  const [fontGen, setFontGen] = useState(0);

  useEffect(() => {
    mounts[mountId] = { setProps, bumpFontGen: () => setFontGen((g) => g + 1) };
    return () => {
      delete mounts[mountId];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mountId]);

  const Comp = COMPONENTS[kind];
  return (
    <Player
      // Remount on font change — TYPE.sans/mono/serif are getters read once
      // per component evaluation; bumping the key forces a fresh mount so
      // every element in the tree re-reads the new brand font.
      key={fontGen}
      component={Comp as React.ComponentType<Record<string, unknown>>}
      inputProps={props as unknown as Record<string, unknown>}
      durationInFrames={DURATION}
      fps={FPS}
      compositionWidth={WIDTH}
      compositionHeight={HEIGHT}
      style={{ width: "100%", height: "100%" }}
      loop
      autoPlay
      controls={false}
      showVolumeControls={false}
      clickToPlay={false}
    />
  );
}

function mount(
  mountId: string,
  containerId: string,
  kind: Kind,
  initialProps: ParticleSandFillProps | PieShareChartProps,
): void {
  const el = document.getElementById(containerId);
  if (!el) return;
  const root = createRoot(el);
  root.render(<Wrapper mountId={mountId} kind={kind} initialProps={initialProps} />);
}

function updateProps(mountId: string, props: ParticleSandFillProps | PieShareChartProps): void {
  mounts[mountId]?.setProps(props);
}

function updateFonts(fonts: { body?: string; mono?: string; display?: string } | null | undefined): void {
  setBrandFonts(fonts);
  Object.values(mounts).forEach((m) => m.bumpFontGen());
}

declare global {
  interface Window {
    SequencelyBrandPreview: {
      mount: typeof mount;
      updateProps: typeof updateProps;
      updateFonts: typeof updateFonts;
    };
  }
}

window.SequencelyBrandPreview = { mount, updateProps, updateFonts };
