/**
 * TimelineGeneric — Domain-agnostic horizontal event timeline.
 *
 * Pure time-axis with N event nodes — no club badges, no team colour palette.
 * Designed for non-football documentaries (tech, history, finance, etc.).
 *
 * Camera: rail draws left-to-right, then nodes pop in staggered with their
 * year/label cards above-and-below alternating to avoid crowding.
 *
 * Stack: Bg (0) → Rail (1) → Content (10) → Grain (last in JSX).
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

const PADDING_X = 160;
const RAIL_Y    = 540; // canvas vertical centre
const NODE_R    = 11;

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
  const { fps, width, height } = useVideoConfig();

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
  const railRight = width - PADDING_X;
  const railWidth = innerW * railProgress;

  // Compute node X positions evenly across the rail
  const n = events.length || 1;
  const nodes = events.map((e, i) => ({
    ...e,
    x: PADDING_X + (innerW * (n === 1 ? 0.5 : i / (n - 1))),
    above: i % 2 === 0,
    appearAt: introOffset + 32 + i * 6,
  }));

  return (
    <AbsoluteFill style={{ fontFamily }}>
      {isDark ? <DarkBackground color="#141414" /> : <PaperBackground />}

      {/* Content layer */}
      <AbsoluteFill style={{ zIndex: 10 }}>
        {/* Dateline + source — folio top corners */}
        {dateline ? (
          <div
            style={{
              position: "absolute",
              top: 48,
              left: PADDING_X,
              fontSize: 13,
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
            top: 96,
            left: PADDING_X,
            right: PADDING_X,
            fontSize: 62,
            fontWeight: 900,
            lineHeight: 1.05,
            letterSpacing: -1.6,
            color: fg,
            fontFamily: serifFontFamily,
            opacity: titleProgress,
            transform: `translateY(${titleY}px)`,
          }}
        >
          {title}
        </div>

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

          const cardY = node.above ? RAIL_Y - 220 : RAIL_Y + 60;
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
                  left: node.x - 180,
                  width: 360,
                  textAlign: "center",
                  opacity: cardOpacity,
                  transform: `translateY(${cardTranslate}px)`,
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    letterSpacing: 2.4,
                    color: accent,
                    textTransform: "uppercase",
                    fontFamily,
                    marginBottom: 6,
                  }}
                >
                  {node.year}
                </div>
                <div
                  style={{
                    fontSize: 26,
                    fontWeight: 700,
                    color: fg,
                    lineHeight: 1.15,
                    letterSpacing: -0.4,
                    fontFamily,
                  }}
                >
                  {node.label}
                </div>
                {node.sub ? (
                  <div
                    style={{
                      fontSize: 14,
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
