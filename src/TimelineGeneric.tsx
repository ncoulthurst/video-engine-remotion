/**
 * TimelineGeneric — Domain-agnostic horizontal event timeline.
 *
 * Pure time-axis with N event nodes — no club badges, no team colour palette.
 * Designed for non-football documentaries (tech, history, finance, etc.).
 *
 * Pacing: node reveals are DISTRIBUTED across the scene duration (not a fixed
 * 6-frame stagger) so the board unfolds with the narration instead of spoiling
 * every point in the first two seconds. A camera layer zooms to each node as
 * it lands and settles back to the full view for the closing beat.
 *
 * Stack: Bg (0) → static header/footer (5) → camera layer [rail + nodes] (10)
 *        → Grain (last in JSX).
 */

import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";
import {
  fontFamily,
  serifFontFamily,
  Grain,
  PaperBackground,
  DarkBackground,
  COLORS,
  SPRINGS,
  WorldStateSchema,
} from "./shared";

// ── Schema ────────────────────────────────────────────────────────────────────

const EventSchema = z.object({
  year:  z.string(),
  label: z.string(),
  sub:   z.string().optional().default(""),
});

export const TimelineGenericPropsSchema = z.object({
  title:      z.string().optional().default("A Decade of Transformation"),
  events:     z.array(EventSchema).optional().default([
    { year: "2015", label: "Founded",         sub: "Sam Altman, Elon Musk + others" },
    { year: "2019", label: "Microsoft $1B",   sub: "First major strategic backer" },
    { year: "2022", label: "ChatGPT launch",  sub: "1M users in five days" },
    { year: "2023", label: "$13B raise",      sub: "Largest private AI round to date" },
    { year: "2024", label: "Sora + reasoning", sub: "Multimodal expansion" },
  ]),
  palette:    z.enum(["dark", "paper"]).optional().default("paper"),
  accent:     z.string().optional().default("#C9A84C"),
  source:     z.string().optional().default(""),
  dateline:   z.string().optional().default(""),
  skipIntro:  z.boolean().optional().default(false),
  worldState: WorldStateSchema,
});
export type TimelineGenericProps = z.infer<typeof TimelineGenericPropsSchema>;

// ── Constants ─────────────────────────────────────────────────────────────────

const PADDING_X  = 160;
const RAIL_Y     = 560; // canvas vertical centre (below the static title block)
const NODE_R     = 13;
const TOUR_SCALE = 1.3; // camera zoom while stepping node-to-node

// ── Component ─────────────────────────────────────────────────────────────────

export const TimelineGeneric: React.FC<TimelineGenericProps> = ({
  title,
  events,
  palette,
  accent,
  source,
  dateline,
  skipIntro,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, durationInFrames } = useVideoConfig();

  const isDark = palette === "dark";
  const fg      = isDark ? "#f5f0e8" : COLORS.primary;
  const muted   = isDark ? "rgba(245,240,232,0.55)" : COLORS.muted;
  const railCol = isDark ? "rgba(245,240,232,0.25)" : "rgba(0,0,0,0.18)";

  const introOffset = skipIntro ? 0 : 12;

  // Title fade-in
  const titleProgress = spring({ frame: frame - introOffset, fps, config: SPRINGS.header });
  const titleY        = interpolate(titleProgress, [0, 1], [16, 0]);

  // Rail draws left-to-right
  const railProgress = interpolate(
    frame - introOffset,
    [4, 32],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }
  );

  const innerW = width - PADDING_X * 2;
  const railLeft  = PADDING_X;
  const railWidth = innerW * railProgress;

  // ── Duration-aware reveal schedule ─────────────────────────────────────────
  // First node lands as the rail finishes; the last lands at ~78% of the scene,
  // leaving the final stretch for the zoomed-out full view. Minimum spacing
  // keeps short scenes from stacking reveals on one frame.
  const n = events.length || 1;
  const tourStart = introOffset + 38;
  const tourEnd   = Math.max(tourStart + (n - 1) * 15, Math.round(durationInFrames * 0.78));
  const step      = n > 1 ? (tourEnd - tourStart) / (n - 1) : 0;

  const nodes = events.map((e, i) => ({
    ...e,
    x: PADDING_X + (innerW * (n === 1 ? 0.5 : i / (n - 1))),
    above: i % 2 === 0,
    appearAt: Math.round(tourStart + step * i),
  }));

  // ── Camera: full view → zoom to node 0 → travel node-to-node → settle out ──
  const settleStart = Math.min(tourEnd + 12, durationInFrames - 40);
  const settleEnd   = Math.min(settleStart + 34, Math.max(settleStart + 1, durationInFrames - 4));

  const txFor = (nodeX: number, s: number) => {
    const raw = width / 2 - s * nodeX;
    return Math.min(0, Math.max(width - s * width, raw)); // never past canvas edges
  };

  // Keyframes must be strictly increasing for interpolate()
  const camFrames: number[] = [];
  const camXs: number[] = [];
  const camScales: number[] = [];
  const pushKey = (f: number, tx: number, s: number) => {
    const ff = camFrames.length ? Math.max(f, camFrames[camFrames.length - 1] + 1) : f;
    camFrames.push(ff);
    camXs.push(tx);
    camScales.push(s);
  };
  pushKey(0, 0, 1);
  pushKey(tourStart - 10, 0, 1);
  nodes.forEach((nd) => pushKey(nd.appearAt, txFor(nd.x, TOUR_SCALE), TOUR_SCALE));
  pushKey(settleStart, txFor(nodes[n - 1].x, TOUR_SCALE), TOUR_SCALE);
  pushKey(settleEnd, 0, 1);

  const camOpts = {
    extrapolateLeft: "clamp" as const,
    extrapolateRight: "clamp" as const,
    easing: Easing.inOut(Easing.cubic),
  };
  const camX     = interpolate(frame, camFrames, camXs, camOpts);
  const camScale = interpolate(frame, camFrames, camScales, camOpts);
  // Keep the rail band vertically centred while zoomed
  const camY = RAIL_Y - camScale * RAIL_Y + (camScale - 1) * 30;

  return (
    <AbsoluteFill style={{ fontFamily }}>
      {isDark ? <DarkBackground color="#141414" /> : <PaperBackground />}

      {/* Static header/footer — outside the camera so they never crop */}
      <AbsoluteFill style={{ zIndex: 5 }}>
        {dateline ? (
          <div
            style={{
              position: "absolute",
              top: 48,
              left: PADDING_X,
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: muted,
              opacity: titleProgress,
              fontFamily,
            }}
          >
            {dateline}
          </div>
        ) : null}

        {/* Title */}
        <div
          style={{
            position: "absolute",
            top: 92,
            left: PADDING_X,
            right: PADDING_X,
            fontSize: 68,
            fontWeight: 900,
            lineHeight: 1.05,
            letterSpacing: -1.8,
            color: fg,
            fontFamily: serifFontFamily,
            opacity: titleProgress,
            transform: `translateY(${titleY}px)`,
          }}
        >
          {title}
        </div>

        {/* Source attribution — bottom right */}
        {source ? (
          <div
            style={{
              position: "absolute",
              bottom: 48,
              right: PADDING_X,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: muted,
              fontFamily,
              opacity: titleProgress,
            }}
          >
            {source}
          </div>
        ) : null}
      </AbsoluteFill>

      {/* Camera layer — rail + nodes ride the zoom/pan */}
      <AbsoluteFill style={{ zIndex: 10 }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `translate(${camX}px, ${camY}px) scale(${camScale})`,
            transformOrigin: "0 0",
          }}
        >
          {/* Rail */}
          <div
            style={{
              position: "absolute",
              top: RAIL_Y,
              left: railLeft,
              height: 2,
              width: railWidth,
              background: railCol,
              transformOrigin: "left center",
            }}
          />
          {/* End-cap dot at the right tip of the rail */}
          <div
            style={{
              position: "absolute",
              top: RAIL_Y - 4,
              left: railLeft + railWidth - 4,
              width: 8,
              height: 8,
              background: accent,
              borderRadius: 8,
              opacity: railProgress,
            }}
          />

          {/* Event nodes + cards */}
          {nodes.map((node, i) => {
            const local = frame - node.appearAt;
            const reveal = spring({ frame: local, fps, config: SPRINGS.row });
            if (reveal <= 0.001) return null;

            const cardY = node.above ? RAIL_Y - 250 : RAIL_Y + 64;
            const cardOpacity = reveal;
            const cardTranslate = interpolate(reveal, [0, 1], [node.above ? 20 : -20, 0]);

            return (
              <React.Fragment key={i}>
                {/* Node dot */}
                <div
                  style={{
                    position: "absolute",
                    top:  RAIL_Y - NODE_R,
                    left: node.x - NODE_R,
                    width:  NODE_R * 2,
                    height: NODE_R * 2,
                    background: accent,
                    borderRadius: NODE_R * 2,
                    boxShadow: `0 0 0 4px ${isDark ? "#141414" : COLORS.bgFrom}`,
                    transform: `scale(${reveal})`,
                    transformOrigin: "center center",
                  }}
                />
                {/* Connector tick from rail to card */}
                <div
                  style={{
                    position: "absolute",
                    top: node.above ? RAIL_Y - 60 : RAIL_Y + 12,
                    left: node.x - 1,
                    width: 2,
                    height: 48 * reveal,
                    background: railCol,
                    transformOrigin: node.above ? "bottom center" : "top center",
                  }}
                />
                {/* Card */}
                <div
                  style={{
                    position: "absolute",
                    top: cardY,
                    left: node.x - 210,
                    width: 420,
                    textAlign: "center",
                    opacity: cardOpacity,
                    transform: `translateY(${cardTranslate}px)`,
                  }}
                >
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      letterSpacing: 2.4,
                      color: accent,
                      textTransform: "uppercase",
                      fontFamily,
                      marginBottom: 8,
                    }}
                  >
                    {node.year}
                  </div>
                  <div
                    style={{
                      fontSize: 36,
                      fontWeight: 700,
                      color: fg,
                      lineHeight: 1.12,
                      letterSpacing: -0.5,
                      fontFamily,
                    }}
                  >
                    {node.label}
                  </div>
                  {node.sub ? (
                    <div
                      style={{
                        fontSize: 18,
                        color: muted,
                        marginTop: 8,
                        lineHeight: 1.35,
                        fontFamily,
                        fontStyle: "italic",
                      }}
                    >
                      {node.sub}
                    </div>
                  ) : null}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </AbsoluteFill>

      <Grain />
    </AbsoluteFill>
  );
};

// Default duration inferred from event count — minimum 5s, +0.8s per event.
export const calculateMetadata: (props: { props: TimelineGenericProps; defaultProps: TimelineGenericProps }) => { durationInFrames: number } = ({ props }) => {
  const fps   = 30;
  const count = props.events?.length ?? 5;
  const seconds = Math.max(5, 3 + 0.8 * count);
  return { durationInFrames: Math.round(seconds * fps) };
};
