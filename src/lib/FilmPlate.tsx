/**
 * FilmPlate — the single full-timeline grade layer (roadmap H4,
 * PRODUCTION_GAP_ANALYSIS §7 "Textures/grain" + §3 row 19).
 *
 * Mounted ONCE at the VideoSequence root, ABOVE the TransitionSeries, so one
 * grain + vignette + temperature treatment unifies every scene AND every
 * transition — graphics and archival footage read as one film stock.
 *
 * Cost discipline: the grain is a single static feTurbulence tile (fixed seed,
 * rendered oversized) whose PARENT is translated on a 4-frame cycle — the
 * filter is never re-parameterised per frame.
 *
 * Grade rules honoured: never a white radial glow (edge vignette only), warm
 * temperature unification at very low opacity.
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";

/** Oversize so cycle translation never exposes an edge. */
const TILE_W = 2080;
const TILE_H = 1240;

/** 4-position jitter cycle, advanced every 2 frames — grain "moves" cheaply. */
const CYCLE: Array<[number, number]> = [
  [0, 0],
  [6, -4],
  [-5, 3],
  [3, 5],
];

export const FilmPlate: React.FC<{ intensity?: number }> = ({ intensity = 1 }) => {
  const frame = useCurrentFrame();
  const [jx, jy] = CYCLE[Math.floor(frame / 2) % CYCLE.length];

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* (a) film grain — static tile, jittered parent */}
      <div
        style={{
          position: "absolute",
          top: -(TILE_H - 1080) / 2 + jy,
          left: -(TILE_W - 1920) / 2 + jx,
          width: TILE_W,
          height: TILE_H,
          opacity: 0.05 * intensity,
        }}
      >
        <svg width={TILE_W} height={TILE_H} style={{ display: "block" }}>
          <defs>
            <filter id="filmplate-grain" x="0" y="0" width="100%" height="100%">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.65"
                numOctaves="3"
                seed={7}
                stitchTiles="stitch"
              />
              <feColorMatrix
                type="matrix"
                values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0"
              />
            </filter>
          </defs>
          <rect width={TILE_W} height={TILE_H} filter="url(#filmplate-grain)" />
        </svg>
      </div>

      {/* (b) edge vignette — subtle darkening, never a glow */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 78% 72% at 50% 48%, rgba(0,0,0,0) 62%, rgba(0,0,0,0.10) 100%)",
          opacity: intensity,
        }}
      />

      {/* (c) warm temperature unification — barely-there soft-light lift */}
      <AbsoluteFill
        style={{
          background: "rgba(255,244,230,1)",
          mixBlendMode: "soft-light",
          opacity: 0.03 * intensity,
        }}
      />
    </AbsoluteFill>
  );
};
