/**
 * PieShareChart — proportional share as a ring of wedges that sweep in one
 * at a time, with a simple dot-legend beside it. `innerRadiusRatio` picks the
 * silhouette: 0 renders a solid pie (the "how is this whole divided" read);
 * a value like 0.55 renders a donut/ring instead — both are real filled
 * wedge paths (annular sectors) sharing one outer/inner radius pair, not a
 * stack of stroked circles — that earlier technique left visible seams at
 * every wedge boundary (each stroke is anti-aliased independently, so
 * adjacent dash edges don't line up at the sub-pixel level).
 *
 * Recreated from a reference reel (recreate.mp4, segment 4: "How Americans
 * split their political loyalties" — shown once as a solid pie, once as a
 * ring) onto this kit's own visual language — kit tokens only, no local hex/
 * font/spacing. Close cousin of finance/DonutShare.tsx, but generic-domain
 * and with the pie silhouette as a first-class option rather than always a
 * ring.
 */
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  Ground,
  Kicker,
  SourceTag,
  resolveTheme,
  useOutro,
  wipe,
  fadeUp,
  stagger,
  rgbaOf,
  TYPE,
  SPACE,
  baseTemplateSchema,
  type BaseTemplateProps,
} from "./lib/kit";

// ── Title emphasis — "...*Americans*..." renders the marked span in the
// serif italic register; everything else stays in the sans display face. ────
function EmphasisTitle({ text, color }: { text: string; color: string }) {
  const parts = text.split(/\*([^*]+)\*/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} style={{ fontFamily: TYPE.serif, fontStyle: "italic", fontWeight: TYPE.weight.bold, color }}>
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

// ── Schema ──────────────────────────────────────────────────────────────────

const SliceSchema = z.object({ label: z.string(), value: z.number(), featured: z.boolean().optional() });

export const PieShareChartPropsSchema = z.object({
  ...baseTemplateSchema,
  title: z.string().optional().default("How *Americans* split their political loyalties"),
  dek: z.string().optional().default(
    "Based on national survey data collected by Gallup in 2024, showing how U.S. adults identify politically across the two major parties and independents.",
  ),
  slices: z.array(SliceSchema).optional().default([
    { label: "Democrats", value: 49 },
    { label: "Republicans", value: 49, featured: true },
    { label: "Others", value: 2 },
  ]),
  /** 0 = solid pie; ~0.55 = donut/ring. */
  innerRadiusRatio: z.number().min(0).max(0.85).optional().default(0),
  ground: z.enum(["paper", "ink", "structure"]).optional().default("structure"),
  // Full palette override (brand preview / brand-recolor path) — see
  // ParticleSandFill.tsx for why ground+accentColor alone isn't enough.
  bgColor: z.string().optional(),
  inkColor: z.string().optional(),
  mutedColor: z.string().optional(),
});
export type PieShareChartProps = z.input<typeof PieShareChartPropsSchema> & BaseTemplateProps;

export const PIESHARECHART_DUR = 150;

// 12 o'clock, clockwise (standard pie convention). frac is 0..1 of a full turn.
function polarPt(cx: number, cy: number, r: number, frac: number) {
  const a = frac * 2 * Math.PI;
  return { x: cx + r * Math.sin(a), y: cy - r * Math.cos(a) };
}

/** filled annular-sector path from startFrac to endFrac (innerR 0 = solid pie wedge). */
function wedgePath(cx: number, cy: number, outerR: number, innerR: number, startFrac: number, endFrac: number) {
  const span = endFrac - startFrac;
  if (span <= 0) return "";
  const large = span > 0.5 ? 1 : 0;
  const oStart = polarPt(cx, cy, outerR, startFrac);
  const oEnd = polarPt(cx, cy, outerR, endFrac);
  if (innerR <= 0) {
    return `M ${cx} ${cy} L ${oStart.x} ${oStart.y} A ${outerR} ${outerR} 0 ${large} 1 ${oEnd.x} ${oEnd.y} Z`;
  }
  const iStart = polarPt(cx, cy, innerR, startFrac);
  const iEnd = polarPt(cx, cy, innerR, endFrac);
  return (
    `M ${iStart.x} ${iStart.y} L ${oStart.x} ${oStart.y} ` +
    `A ${outerR} ${outerR} 0 ${large} 1 ${oEnd.x} ${oEnd.y} L ${iEnd.x} ${iEnd.y} ` +
    `A ${innerR} ${innerR} 0 ${large} 0 ${iStart.x} ${iStart.y} Z`
  );
}

export const PieShareChart: React.FC<PieShareChartProps> = ({
  title = "",
  dek = "",
  slices = [],
  innerRadiusRatio = 0,
  ground = "structure",
  accentColor,
  bgColor,
  inkColor,
  mutedColor,
  kicker,
  source,
  skipIntro,
  animateOut,
}) => {
  const frame = useCurrentFrame();
  const t = resolveTheme(ground, accentColor, bgColor, inkColor, mutedColor);
  const outro = useOutro(animateOut);
  const d = skipIntro ? -999 : 0;

  const SZ = 460;
  const OUTER_R = 190;
  const INNER_R = OUTER_R * innerRadiusRatio;

  const total = slices.reduce((s, sl) => s + sl.value, 0) || 1;
  // featured gets the hero accent; the FIRST non-featured slice gets the
  // editorial highlight (a genuinely different hue, not just a paler accent)
  // so two adjacent non-featured slices never read as "the same colour, one
  // fainter" — the rest fall back to ink-tint shades.
  const inkShades = [0.85, 0.55, 0.34];
  let plainSeen = 0;
  let acc = 0;
  const arcs = slices.map((sl, i) => {
    const frac = sl.value / total;
    const start = acc;
    acc += frac;
    let col: string;
    if (sl.featured) {
      col = t.accent;
    } else {
      col = plainSeen === 0 ? t.highlight : rgbaOf(t.ink, inkShades[Math.min(inkShades.length - 1, plainSeen - 1)]);
      plainSeen += 1;
    }
    return { sl, frac, start, col };
  });

  return (
    <Ground ground={ground} accentColor={accentColor} bgColor={bgColor} inkColor={inkColor} mutedColor={mutedColor} skipIntro={skipIntro} texture domain="generic" focus={{ x: 0.32, y: 0.36 }}>
      <div style={{ height: "100%", display: "flex", alignItems: "center", gap: SPACE[20], ...outro }}>
        <div style={{ flex: "1 1 auto", display: "flex", flexDirection: "column", gap: SPACE[8], maxWidth: 900 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: SPACE[4] }}>
            <Kicker label={kicker} theme={t} frame={frame} delay={d} />
            <div style={{ overflow: "hidden", paddingBottom: 8 }}>
              <div
                style={{
                  fontFamily: TYPE.sans,
                  fontSize: TYPE.cardTitle + 12,
                  fontWeight: TYPE.weight.bold,
                  letterSpacing: -0.8,
                  lineHeight: 1.1,
                  color: t.ink,
                  transform: `translateY(${(1 - wipe(frame, { delay: d + 4, dur: 26 })) * (TYPE.cardTitle + 12) * 1.05}px)`,
                }}
              >
                <EmphasisTitle text={title} color={t.accent} />
              </div>
            </div>
            {dek && (
              <div style={{ fontFamily: TYPE.sans, fontSize: TYPE.sub, color: t.muted, lineHeight: 1.45, ...fadeUp(frame, { delay: d + 12, dur: 22 }) }}>
                {dek}
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: SPACE[5], marginTop: SPACE[4] }}>
            {arcs.map((a, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: SPACE[4], ...fadeUp(frame, { delay: d + 16 + stagger(i, 8), dur: 18 }) }}>
                <div style={{ width: 14, height: 14, borderRadius: 4, background: a.col, flexShrink: 0 }} />
                <span style={{ flex: 1, fontFamily: TYPE.sans, fontSize: TYPE.sub, fontWeight: a.sl.featured ? TYPE.weight.bold : TYPE.weight.medium, color: t.ink }}>
                  {a.sl.label}
                </span>
                <span style={{ fontFamily: TYPE.mono, fontSize: TYPE.sub, fontWeight: TYPE.weight.semibold, color: t.muted }}>
                  {Math.round(a.frac * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: "0 0 auto", position: "relative", width: SZ, height: SZ }}>
          <svg width={SZ} height={SZ}>
            {arcs.map((a, i) => {
              const p = skipIntro ? 1 : wipe(frame, { delay: d + 10 + stagger(i, 10), dur: 30 });
              const end = a.start + a.frac * p;
              return <path key={i} d={wedgePath(SZ / 2, SZ / 2, OUTER_R, INNER_R, a.start, end)} fill={a.col} />;
            })}
          </svg>
        </div>
      </div>

      <SourceTag source={source} theme={t} frame={frame} delay={d + 40} />
    </Ground>
  );
};
