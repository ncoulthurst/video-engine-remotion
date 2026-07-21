/**
 * HeroBigStat — single hero-number reveal (paper-orange palette, Search-Party register).
 *
 * A huge count-up figure with an inline unit, one accent rule, a narrative label,
 * and a mono source dateline. Supports a DUAL layout (before → after) when a
 * second stat is provided. Schema is unchanged so the pipeline parser still maps.
 */
import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { fontFamily, geistMonoFamily, PALETTES, rgbaFromHex, WorldStateSchema } from "./shared";
import { EASE, prog as kprog, beatDelay, Ground } from "./lib/kit";

// ── Colours: pinned to the light paper-orange palette (warm-white + burnt orange) ──
const P = PALETTES.paperOrange;

// ── Schema (unchanged shape — pipeline-compatible) ───────────────────────────
const ComparatorSchema = z.object({
  label: z.string(),
  value: z.number().optional(),
  max:   z.number().optional(),
  kind:  z.enum(["bar", "rank", "line"]).optional().default("line"),
  total: z.number().optional(),
  rank:  z.number().optional(),
});

export const HeroBigStatPropsSchema = z.object({
  stat:        z.string().optional().default("31"),
  unit:        z.string().optional().default("goals"),
  label:       z.string().optional().default("in a single Premier League season."),
  stat2:       z.string().optional().default(""),
  unit2:       z.string().optional().default(""),
  label2:      z.string().optional().default(""),
  context:     z.string().optional().default(""),
  badgeSlug:   z.string().optional().default(""),
  source:      z.string().optional().default(""),
  playerImage: z.string().optional().default(""),
  accentColor: z.string().optional().default("#C8102E"),
  darkMode:    z.boolean().default(false),
  bgColor:     z.string().optional().default("#f0ece4"),
  skipIntro:   z.boolean().optional().default(false),
  beats:       z.record(z.string(), z.number()).optional(),
  comparator:  ComparatorSchema.optional(),
  worldState:  WorldStateSchema.optional(),
});
export type HeroBigStatProps = z.infer<typeof HeroBigStatPropsSchema>;

// ── Helpers ──────────────────────────────────────────────────────────────────
function parseStat(s: string): { prefix: string; num: number | null; suffix: string; decimals: number } {
  const m = s.match(/^(\D*)(-?\d+(?:\.\d+)?)(.*)$/);
  if (!m) return { prefix: "", num: null, suffix: s, decimals: 0 };
  const raw = m[2] ?? "0";
  const dec = raw.includes(".") ? (raw.split(".")[1]?.length ?? 0) : 0;
  return { prefix: m[1] ?? "", num: parseFloat(raw), suffix: m[3] ?? "", decimals: dec };
}
function countUp(frame: number, target: number, start: number, dur: number, decimals: number, skip: boolean): string {
  if (skip) return decimals > 0 ? target.toFixed(decimals) : String(Math.round(target));
  const v = interpolate(frame, [start, start + dur], [0, target], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return decimals > 0 ? v.toFixed(decimals) : String(Math.round(v));
}

// One rendered figure (prefix+number counting up, inline unit)
const Figure: React.FC<{ stat: string; unit: string; size: number; color: string; delay: number; skip: boolean }> = ({ stat, unit, size, color, delay, skip }) => {
  const frame = useCurrentFrame();
  const { prefix, num, suffix, decimals } = parseStat(stat);
  const shown = num === null ? stat : prefix + countUp(frame, num, delay, 40, decimals, skip) + suffix;
  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 18, whiteSpace: "nowrap" }}>
      <span style={{ fontFamily, fontSize: size, fontWeight: 800, letterSpacing: -size * 0.03, color, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{shown}</span>
      {unit && <span style={{ fontFamily, fontSize: size * 0.24, fontWeight: 500, color: P.muted, letterSpacing: 0.5 }}>{unit}</span>}
    </div>
  );
};

export const HeroBigStat: React.FC<HeroBigStatProps> = ({
  stat = "31", unit = "goals", label = "", stat2 = "", unit2 = "", label2 = "",
  context = "", source = "", accentColor, bgColor, skipIntro = false, beats,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // Old football defaults map to the palette; explicit overrides still win.
  const accent = accentColor && accentColor !== "#C8102E" ? accentColor : P.accent;
  const bg = bgColor && bgColor !== "#f0ece4" ? bgColor : P.bg;

  const dual = Boolean(stat2);
  // H1: the hero figure's count-up starts on the "stat" narration beat.
  const statAt = beatDelay(beats, "stat", fps, 6);
  const headerProg = skipIntro ? 1 : kprog(frame, Math.max(0, statAt - 6), 22, EASE.snap);
  const ruleProg = skipIntro ? 1 : kprog(frame, statAt + 20, 20, EASE.out);
  const labelProg = skipIntro ? 1 : kprog(frame, statAt + 26, 22, EASE.snap);
  const srcProg = skipIntro ? 1 : kprog(frame, statAt + 44, 16, EASE.quad);

  return (
    // Kit Ground: owns bg/vignette/grain standalone, collapses to a transparent
    // theme shell inside a SceneSequence so the shared canvas survives (H3).
    <Ground ground="paper" bgColor={bg} accentColor={accent} skipIntro={skipIntro} pad={0}>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 160px", zIndex: 5 }}>
        {/* optional dateline overline */}
        {context && (
          <div style={{ fontFamily: geistMonoFamily, fontSize: 18, fontWeight: 600, letterSpacing: 3, textTransform: "uppercase", color: accent, marginBottom: 40, opacity: headerProg, transform: `translateY(${interpolate(headerProg, [0, 1], [-12, 0])}px)` }}>{context}</div>
        )}

        {dual ? (
          // ── DUAL: before → after ──
          <div style={{ display: "flex", alignItems: "center", gap: 70 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, opacity: headerProg }}>
              <Figure stat={stat} unit={unit} size={132} color={P.ink} delay={statAt} skip={skipIntro} />
              {label && <div style={{ fontFamily: geistMonoFamily, fontSize: 18, fontWeight: 500, color: P.muted, letterSpacing: 0.4, maxWidth: 420, textAlign: "center" }}>{label}</div>}
            </div>
            <div style={{ fontFamily, fontSize: 60, fontWeight: 400, color: rgbaFromHex(P.ink, 0.4), transform: `scale(${interpolate(labelProg, [0, 1], [0.6, 1])})`, opacity: labelProg }}>→</div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, opacity: labelProg }}>
              <Figure stat={stat2} unit={unit2} size={132} color={accent} delay={statAt + 24} skip={skipIntro} />
              {label2 && <div style={{ fontFamily: geistMonoFamily, fontSize: 18, fontWeight: 500, color: P.muted, letterSpacing: 0.4, maxWidth: 420, textAlign: "center" }}>{label2}</div>}
            </div>
          </div>
        ) : (
          // ── SINGLE: one dominant figure ──
          <>
            <div style={{ opacity: headerProg, transform: `translateY(${interpolate(headerProg, [0, 1], [18, 0])}px)` }}>
              <Figure stat={stat} unit={unit} size={230} color={accent} delay={statAt} skip={skipIntro} />
            </div>
            {/* single accent rule */}
            <div style={{ width: interpolate(ruleProg, [0, 1], [0, 120]), height: 4, background: accent, borderRadius: 2, marginTop: 40 }} />
            {label && (
              <div style={{ fontFamily, fontSize: 34, fontWeight: 500, color: P.ink, letterSpacing: -0.4, lineHeight: 1.28, maxWidth: 1100, textAlign: "center", marginTop: 40, opacity: labelProg, transform: `translateY(${interpolate(labelProg, [0, 1], [14, 0])}px)` }}>{label}</div>
            )}
          </>
        )}

        {/* source dateline */}
        {source && (
          <div style={{ fontFamily: geistMonoFamily, fontSize: 16, fontWeight: 500, color: P.muted, letterSpacing: 1, marginTop: 56, opacity: srcProg, textTransform: "uppercase" }}>{source}</div>
        )}
      </div>
    </Ground>
  );
};
