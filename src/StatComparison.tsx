/**
 * StatComparison — Generic head-to-head bar comparison.
 *
 * Two entities, N metrics. Each row shows a metric label centred above two
 * bars that grow outward from a centre divider — left bar leftward, right
 * bar rightward, sized proportionally to max(left, right) across the row.
 *
 * Domain-agnostic by design: no badges, no club colours, neutral accents
 * with optional per-side overrides. Suitable for tech, finance, history,
 * any "X vs Y by the numbers" framing.
 *
 * Stack: Bg (0) → Content (10) → Grain (last in JSX).
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

const RowSchema = z.object({
  metric: z.string(),
  left:   z.number(),
  right:  z.number(),
  unit:   z.string().optional().default(""),
});

export const StatComparisonPropsSchema = z.object({
  title:        z.string().optional().default("OpenAI vs Anthropic — by the numbers"),
  leftLabel:    z.string().optional().default("OpenAI"),
  rightLabel:   z.string().optional().default("Anthropic"),
  leftAccent:   z.string().optional().default(""),  // hex; empty → use default
  rightAccent:  z.string().optional().default(""),
  rows:         z.array(RowSchema).optional().default([
    { metric: "Founded",        left: 2015, right: 2021, unit: "" },
    { metric: "Total raised",   left: 13,   right: 8.5,  unit: "$B" },
    { metric: "Employees",      left: 1700, right: 500,  unit: "" },
    { metric: "Valuation",      left: 90,   right: 18,   unit: "$B" },
  ]),
  palette:      z.enum(["dark", "paper"]).optional().default("paper"),
  source:       z.string().optional().default(""),
  dateline:     z.string().optional().default(""),
  skipIntro:    z.boolean().optional().default(false),
  worldState:   WorldStateSchema,
});
export type StatComparisonProps = z.infer<typeof StatComparisonPropsSchema>;

// ── Constants ─────────────────────────────────────────────────────────────────

const PADDING_X      = 160;
const CENTRE_GUTTER  = 36;        // gap between left bar end and right bar start
const ROW_HEIGHT     = 88;
const ROWS_TOP_BASE  = 320;
const BAR_HEIGHT     = 44;
const DEFAULT_LEFT   = "#3b82c4"; // calm blue
const DEFAULT_RIGHT  = "#d97a3e"; // burnt orange

const fmt = (n: number, unit: string) => {
  const abs = Math.abs(n);
  let s: string;
  if (abs >= 1000) s = n.toLocaleString();
  else if (Number.isInteger(n)) s = String(n);
  else s = n.toFixed(1);
  return unit ? `${unit.startsWith("$") ? unit : ""}${s}${unit.startsWith("$") ? "" : unit ? " " + unit : ""}` : s;
};

// Special-case unit formatting so "$" sticks before the number and other units after.
const formatValue = (n: number, unit: string): string => {
  if (!unit) return Number.isInteger(n) ? n.toLocaleString() : n.toFixed(1);
  if (unit.trim().startsWith("$")) {
    const tail = unit.trim().slice(1).trim();
    const num  = Number.isInteger(n) ? n.toLocaleString() : n.toFixed(1);
    return `$${num}${tail ? " " + tail : ""}`;
  }
  const num = Number.isInteger(n) ? n.toLocaleString() : n.toFixed(1);
  return `${num} ${unit}`;
};

// ── Component ─────────────────────────────────────────────────────────────────

export const StatComparison: React.FC<StatComparisonProps> = ({
  title,
  leftLabel,
  rightLabel,
  leftAccent,
  rightAccent,
  rows,
  palette,
  source,
  dateline,
  skipIntro,
}) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();

  const isDark    = palette === "dark";
  const fg        = isDark ? "#f5f0e8" : COLORS.primary;
  const muted     = isDark ? "rgba(245,240,232,0.55)" : COLORS.muted;
  const divider   = isDark ? "rgba(245,240,232,0.18)" : "rgba(0,0,0,0.12)";
  const trackBg   = isDark ? "rgba(245,240,232,0.05)" : "rgba(0,0,0,0.04)";
  const accentL   = leftAccent  || DEFAULT_LEFT;
  const accentR   = rightAccent || DEFAULT_RIGHT;

  const introOffset = skipIntro ? 0 : 10;

  const titleProgress = spring({ frame: frame - introOffset, fps, config: SPRINGS.header });
  const titleY        = interpolate(titleProgress, [0, 1], [16, 0]);

  // Layout maths
  const innerW    = width - PADDING_X * 2;
  const centreX   = PADDING_X + innerW / 2;
  const halfTrack = innerW / 2 - CENTRE_GUTTER / 2;

  return (
    <AbsoluteFill style={{ fontFamily }}>
      {isDark ? <DarkBackground color="#141414" /> : <PaperBackground />}

      <AbsoluteFill style={{ zIndex: 10 }}>
        {/* Dateline top-left */}
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
            top: 100,
            left: PADDING_X,
            right: PADDING_X,
            fontSize: 58,
            fontWeight: 900,
            lineHeight: 1.05,
            letterSpacing: -1.4,
            color: fg,
            fontFamily: serifFontFamily,
            opacity: titleProgress,
            transform: `translateY(${titleY}px)`,
          }}
        >
          {title}
        </div>

        {/* Entity labels above the bars */}
        <div
          style={{
            position: "absolute",
            top: ROWS_TOP_BASE - 56,
            left: PADDING_X,
            width: halfTrack,
            textAlign: "right",
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: 1.8,
            textTransform: "uppercase",
            color: accentL,
            fontFamily,
            opacity: titleProgress,
          }}
        >
          {leftLabel}
        </div>
        <div
          style={{
            position: "absolute",
            top: ROWS_TOP_BASE - 56,
            left: centreX + CENTRE_GUTTER / 2,
            width: halfTrack,
            textAlign: "left",
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: 1.8,
            textTransform: "uppercase",
            color: accentR,
            fontFamily,
            opacity: titleProgress,
          }}
        >
          {rightLabel}
        </div>

        {/* Centre divider */}
        <div
          style={{
            position: "absolute",
            top: ROWS_TOP_BASE - 24,
            left: centreX - 1,
            width: 2,
            height: rows.length * ROW_HEIGHT + 48,
            background: divider,
            opacity: titleProgress,
          }}
        />

        {/* Rows */}
        {rows.map((row, i) => {
          const appearAt = introOffset + 24 + i * 10;
          const rowReveal = spring({ frame: frame - appearAt, fps, config: SPRINGS.row });
          if (rowReveal <= 0.001) return null;

          const rowMax = Math.max(Math.abs(row.left), Math.abs(row.right), 1);
          const leftFill  = (Math.abs(row.left)  / rowMax) * halfTrack;
          const rightFill = (Math.abs(row.right) / rowMax) * halfTrack;

          const barProgress = interpolate(
            frame - appearAt,
            [0, 22],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }
          );

          const rowTop = ROWS_TOP_BASE + i * ROW_HEIGHT;

          return (
            <React.Fragment key={i}>
              {/* Metric label centred above the row */}
              <div
                style={{
                  position: "absolute",
                  top: rowTop - 4,
                  left: centreX - 220,
                  width: 440,
                  textAlign: "center",
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  color: muted,
                  fontFamily,
                  opacity: rowReveal,
                }}
              >
                {row.metric}
              </div>

              {/* Left bar track */}
              <div
                style={{
                  position: "absolute",
                  top: rowTop + 22,
                  left: PADDING_X,
                  width: halfTrack,
                  height: BAR_HEIGHT,
                  background: trackBg,
                  opacity: rowReveal * 0.6,
                }}
              />
              {/* Left bar fill (grows leftward from centre) */}
              <div
                style={{
                  position: "absolute",
                  top: rowTop + 22,
                  left: centreX - CENTRE_GUTTER / 2 - leftFill * barProgress,
                  width: leftFill * barProgress,
                  height: BAR_HEIGHT,
                  background: accentL,
                }}
              />
              {/* Left value label */}
              <div
                style={{
                  position: "absolute",
                  top: rowTop + 22,
                  left: centreX - CENTRE_GUTTER / 2 - leftFill * barProgress - 130,
                  width: 120,
                  height: BAR_HEIGHT,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  fontSize: 22,
                  fontWeight: 800,
                  color: fg,
                  fontFamily,
                  opacity: barProgress,
                }}
              >
                {formatValue(row.left, row.unit)}
              </div>

              {/* Right bar track */}
              <div
                style={{
                  position: "absolute",
                  top: rowTop + 22,
                  left: centreX + CENTRE_GUTTER / 2,
                  width: halfTrack,
                  height: BAR_HEIGHT,
                  background: trackBg,
                  opacity: rowReveal * 0.6,
                }}
              />
              {/* Right bar fill */}
              <div
                style={{
                  position: "absolute",
                  top: rowTop + 22,
                  left: centreX + CENTRE_GUTTER / 2,
                  width: rightFill * barProgress,
                  height: BAR_HEIGHT,
                  background: accentR,
                }}
              />
              {/* Right value label */}
              <div
                style={{
                  position: "absolute",
                  top: rowTop + 22,
                  left: centreX + CENTRE_GUTTER / 2 + rightFill * barProgress + 10,
                  width: 120,
                  height: BAR_HEIGHT,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  fontSize: 22,
                  fontWeight: 800,
                  color: fg,
                  fontFamily,
                  opacity: barProgress,
                }}
              >
                {formatValue(row.right, row.unit)}
              </div>
            </React.Fragment>
          );
        })}

        {/* Source attribution */}
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

export const calculateMetadata: (props: { props: StatComparisonProps; defaultProps: StatComparisonProps }) => { durationInFrames: number } = ({ props }) => {
  const fps   = 30;
  const count = props.rows?.length ?? 4;
  const seconds = Math.max(6, 4 + 1.2 * count);
  return { durationInFrames: Math.round(seconds * fps) };
};
