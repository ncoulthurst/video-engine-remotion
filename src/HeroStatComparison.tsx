/**
 * HeroStatComparison — two-number contrast reveal (A vs B). The staple finance-doc
 * "before/after · invested/returned · reported/discovered" graphic. Big count-up
 * figures, shared-scale magnitude bars, and a delta chip between them.
 * Style modelled on the Search Party stat panels; colour pinned to the light
 * paper-orange palette (warm-white paper + burnt orange as the single accent).
 */
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { fontFamily, geistMonoFamily, Grain, PALETTES, rgbaFromHex } from "./shared";

const P = PALETTES.paperOrange;
// Light background → the depth vignette must be a faint warm tint, not heavy black
// (dark corners on white read muddy). Chip shadows likewise stay soft.
const IS_LIGHT = (() => { const h = P.bg.replace("#", ""); return parseInt(h.slice(0, 2), 16) > 140; })();
const VIGNETTE = IS_LIGHT
  ? "radial-gradient(125% 125% at 50% 42%, transparent 62%, rgba(28,26,21,0.06) 100%)"
  : "radial-gradient(125% 125% at 50% 42%, transparent 58%, rgba(0,0,0,0.34) 100%)";
const PILL_SHADOW = IS_LIGHT ? "0 6px 18px rgba(28,26,21,0.12)" : "0 8px 24px rgba(0,0,0,0.35)";

const StatSchema = z.object({
  label: z.string().optional().default(""),   // overline
  value: z.number(),                          // raw number (for count-up + bar)
  prefix: z.string().optional().default("$"),
  suffix: z.string().optional().default(""),
  context: z.string().optional().default(""), // sublabel under the number
});

export const HeroStatComparisonPropsSchema = z.object({
  title: z.string().optional().default("REPORTED VS DISCOVERED"),
  subtitle: z.string().optional().default(""),
  left: StatSchema,
  right: StatSchema,
  highlight: z.enum(["left", "right"]).optional().default("right"),
  deltaLabel: z.string().optional().default(""),   // override auto multiplier/percent
  accentColor: z.string().optional(),
  bgColor: z.string().optional(),
  skipIntro: z.boolean().optional().default(false),
});
export type HeroStatComparisonProps = z.input<typeof HeroStatComparisonPropsSchema>;

export function calculateMetadata() {
  return { durationInFrames: 170 };
}

// format v in the UNIT of target, so a column counts up within one unit ($0.0B→$1.3B)
function fmtScaled(v: number, target: number, prefix: string, suffix: string) {
  const a = Math.abs(target);
  let s: string;
  if (a >= 1e9) s = (v / 1e9).toFixed(a >= 1e10 ? 0 : 1) + "B";
  else if (a >= 1e6) s = String(Math.round(v / 1e6)) + "M";
  else if (a >= 1e3) s = String(Math.round(v / 1e3)) + "K";
  else s = String(Math.round(v));
  return prefix + s + suffix;
}
function autoDelta(l: number, r: number) {
  if (l <= 0 || r <= 0) return "";
  const ratio = r / l;
  if (ratio >= 1) return (ratio >= 10 ? ratio.toFixed(0) : ratio.toFixed(1)) + "×";
  return "−" + Math.round((1 - ratio) * 100) + "%";
}

type StatIn = z.input<typeof StatSchema>;

export const HeroStatComparison: React.FC<HeroStatComparisonProps> = ({
  title = "REPORTED VS DISCOVERED", subtitle = "", left, right,
  highlight = "right", deltaLabel = "", accentColor, bgColor, skipIntro = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const accent = accentColor && accentColor !== "#000000" ? accentColor : P.accent;
  const bg = bgColor || P.bg;

  const headerProg = skipIntro ? 1 : spring({ frame, fps, config: { damping: 26, stiffness: 55 } });
  const maxVal = Math.max(left.value, right.value, 1);
  const delta = deltaLabel || autoDelta(left.value, right.value);

  const deltaProg = skipIntro ? 1 : spring({ frame: frame - 104, fps, config: { damping: 14, stiffness: 170 } });

  const Column: React.FC<{ stat: StatIn; isHi: boolean; delay: number; align: "flex-end" | "flex-start" }> = ({ stat, isHi, delay, align }) => {
    const prefix = stat.prefix ?? "$"; const suffix = stat.suffix ?? "";
    const enter = skipIntro ? 1 : spring({ frame: frame - delay, fps, config: { damping: 24, stiffness: 60 } });
    const raw = skipIntro ? 1 : interpolate(frame, [delay, delay + 46], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const eased = 1 - Math.pow(1 - raw, 3);                 // easeOutCubic count-up
    const shown = stat.value * eased;
    const numColor = isHi ? accent : P.ink;
    const barW = (stat.value / maxVal) * 360 * eased;
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", opacity: enter, transform: `translateY(${interpolate(enter, [0, 1], [22, 0])}px)` }}>
        <div style={{ fontFamily: geistMonoFamily, fontSize: 20, fontWeight: 600, letterSpacing: 2.4, textTransform: "uppercase", color: isHi ? accent : P.muted }}>{stat.label}</div>
        <div style={{ fontFamily: geistMonoFamily, fontSize: 132, fontWeight: 600, letterSpacing: -3, color: numColor, lineHeight: 1.05, marginTop: 18, fontVariantNumeric: "tabular-nums" }}>
          {fmtScaled(shown, stat.value, prefix, suffix)}
        </div>
        <div style={{ width: 360, height: 6, marginTop: 26, background: rgbaFromHex(P.ink, 0.08), borderRadius: 3, overflow: "hidden" }}>
          <div style={{ width: barW, height: "100%", background: isHi ? accent : P.muted, borderRadius: 3 }} />
        </div>
        {stat.context && <div style={{ fontFamily: geistMonoFamily, fontSize: 17, fontWeight: 500, color: P.muted, letterSpacing: 0.4, marginTop: 22, maxWidth: 420, textAlign: "center" }}>{stat.context}</div>}
      </div>
    );
  };

  return (
    <AbsoluteFill style={{ background: bg }}>
      {/* subtle edge vignette for depth (darkened corners, not a glow) */}
      <AbsoluteFill style={{ background: VIGNETTE, pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none", opacity: 0.35 }}><Grain /></div>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ position: "absolute", top: 120, left: 0, right: 0, textAlign: "center", opacity: headerProg, transform: `translateY(${interpolate(headerProg, [0, 1], [-14, 0])}px)`, zIndex: 5 }}>
        <div style={{ fontFamily, fontSize: 40, fontWeight: 700, color: P.ink, letterSpacing: 4, textTransform: "uppercase" }}>{title}</div>
        {subtitle && <div style={{ fontFamily: geistMonoFamily, fontSize: 18, fontWeight: 500, color: P.muted, letterSpacing: 1.5, marginTop: 14 }}>{subtitle}</div>}
      </div>

      {/* ── Two stats + delta ──────────────────────────────────── */}
      <div style={{ position: "absolute", top: 300, bottom: 150, left: 150, right: 150, display: "flex", alignItems: "center", zIndex: 4 }}>
        <Column stat={left} isHi={highlight === "left"} delay={18} align="flex-end" />

        {/* divider + delta chip */}
        <div style={{ position: "relative", width: 2, alignSelf: "stretch", margin: "0 20px", background: P.line }}>
          {delta && (
            <div style={{ position: "absolute", left: "50%", top: "50%", transform: `translate(-50%,-50%) scale(${interpolate(deltaProg, [0, 1], [0.6, 1])})`, opacity: interpolate(deltaProg, [0, 1], [0, 1]), background: accent, color: bg, fontFamily: geistMonoFamily, fontSize: 30, fontWeight: 700, letterSpacing: -0.5, padding: "12px 22px", borderRadius: 999, whiteSpace: "nowrap", boxShadow: PILL_SHADOW }}>
              {delta}
            </div>
          )}
        </div>

        <Column stat={right} isHi={highlight === "right"} delay={40} align="flex-start" />
      </div>
    </AbsoluteFill>
  );
};
