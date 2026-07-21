/**
 * DonutShare / PieBreakdown (C6) — proportional share as a donut.
 *
 * Arcs sweep in around a ring; the featured slice thickens + takes the accent; the
 * center figure counts up; a mono legend sits to the right. For ownership %,
 * market share, allocation where the slice is the point.
 *
 * SBF: equity stakes / ownership %. Generalizes: market share (Nvidia), AUM split.
 */
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  Ground,
  SectionTitle,
  AnimatedCounter,
  SourceTag,
  resolveTheme,
  useOutro,
  fadeUp,
  wipe,
  stagger,
  rgbaOf,
  TYPE,
  SPACE,
  baseTemplateSchema,
  type BaseTemplateProps,
} from "./kit";

const SliceSchema = z.object({ label: z.string(), value: z.number(), featured: z.boolean().optional() });

export const DonutSharePropsSchema = z.object({
  ...baseTemplateSchema,
  title: z.string().optional().default("Who Owned Alameda"),
  slices: z.array(SliceSchema).optional().default([
    { label: "Sam Bankman-Fried", value: 90, featured: true },
    { label: "Gary Wang", value: 10 },
  ]),
  centerLabel: z.string().optional().default("90%"),
  centerSub: z.string().optional().default("SBF stake"),
  ground: z.enum(["paper", "ink", "structure"]).optional().default("structure"),
});
export type DonutShareProps = z.input<typeof DonutSharePropsSchema> & BaseTemplateProps;

export const DonutShare: React.FC<DonutShareProps> = ({
  title = "",
  slices = [],
  centerLabel = "",
  centerSub = "",
  ground = "structure",
  accentColor,
  kicker,
  source,
  skipIntro,
  animateOut,
}) => {
  const frame = useCurrentFrame();
  const t = resolveTheme(ground, accentColor);
  const outro = useOutro(animateOut);
  const d = skipIntro ? -999 : 0;

  const SZ = 460;
  const R = 180;
  const SW = 64;
  const C = 2 * Math.PI * R;
  const total = slices.reduce((s, sl) => s + sl.value, 0) || 1;
  const shades = [0.4, 0.28, 0.18, 0.12];

  let acc = 0;
  const arcs = slices.map((sl, i) => {
    const frac = sl.value / total;
    const start = acc;
    acc += frac;
    return { sl, frac, start, col: sl.featured ? t.accent : rgbaOf(t.ink, shades[Math.min(shades.length - 1, i)]) };
  });

  return (
    <Ground ground={ground} accentColor={accentColor} skipIntro={skipIntro}>
      <div style={{ height: "100%", display: "flex", alignItems: "center", gap: SPACE[20], ...outro }}>
        <div style={{ flex: "0 0 auto", position: "relative", width: SZ, height: SZ }}>
          <svg width={SZ} height={SZ} style={{ transform: "rotate(-90deg)" }}>
            {arcs.map((a, i) => {
              const p = skipIntro ? 1 : wipe(frame, { delay: d + 10 + stagger(i, 8), dur: 28 });
              const len = a.frac * C * p;
              return (
                <circle
                  key={i}
                  cx={SZ / 2}
                  cy={SZ / 2}
                  r={R}
                  fill="none"
                  stroke={a.col}
                  strokeWidth={a.sl.featured ? SW + 10 : SW}
                  strokeDasharray={`${len} ${C - len}`}
                  strokeDashoffset={-a.start * C}
                />
              );
            })}
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", ...fadeUp(frame, { delay: d + 24, dur: 20 }) }}>
            <div style={{ fontFamily: TYPE.sans, fontSize: 88, fontWeight: TYPE.weight.black, letterSpacing: -2, color: t.accent, lineHeight: 1 }}>
              <AnimatedCounter value={centerLabel} delay={d + 26} skip={skipIntro} frame={frame} />
            </div>
            {centerSub && <div style={{ fontFamily: TYPE.mono, fontSize: TYPE.label, letterSpacing: 1.6, textTransform: "uppercase", color: t.muted, marginTop: SPACE[2] }}>{centerSub}</div>}
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: SPACE[8] }}>
          <SectionTitle title={title} kicker={kicker ?? "Ownership"} theme={t} frame={frame} delay={d} />
          <div style={{ display: "flex", flexDirection: "column", gap: SPACE[5] }}>
            {arcs.map((a, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: SPACE[4], ...fadeUp(frame, { delay: d + 16 + stagger(i, 8), dur: 18 }) }}>
                <div style={{ width: 18, height: 18, borderRadius: 5, background: a.col }} />
                <span style={{ flex: 1, fontFamily: TYPE.sans, fontSize: TYPE.sub, fontWeight: a.sl.featured ? TYPE.weight.bold : TYPE.weight.medium, color: a.sl.featured ? "#FFFFFF" : t.ink }}>{a.sl.label}</span>
                <span style={{ fontFamily: TYPE.mono, fontSize: TYPE.sub, fontWeight: TYPE.weight.semibold, color: t.muted }}>{Math.round(a.frac * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <SourceTag source={source} theme={t} frame={frame} delay={d + 36} />
    </Ground>
  );
};
