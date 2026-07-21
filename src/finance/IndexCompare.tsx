/**
 * IndexCompare (E3) — 2–4 series on one axis, compare trajectories.
 *
 * Shared AxisFrame grid + several drawn lines; the featured series draws last and
 * in the accent (on top), the rest neutral. Legend staggers. The "X outperformed
 * Y" beat.
 *
 * SBF: SOL vs the broader market. Generalizes: Nvidia vs the S&P — outperformance
 * is a core finance beat.
 */
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  Ground,
  SectionTitle,
  AxisFrame,
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

const SeriesSchema = z.object({
  name: z.string(),
  points: z.array(z.number()),
  featured: z.boolean().optional(),
});

export const IndexComparePropsSchema = z.object({
  ...baseTemplateSchema,
  title: z.string().optional().default("SOL vs the Market"),
  unit: z.string().optional().default("indexed to 100"),
  series: z.array(SeriesSchema).optional().default([
    { name: "Solana (SOL)", points: [100, 180, 520, 1400, 2600, 900], featured: true },
    { name: "Bitcoin", points: [100, 150, 190, 240, 210, 130] },
    { name: "S&P 500", points: [100, 108, 118, 128, 120, 116] },
  ]),
  xLabels: z.array(z.string()).optional().default(["2020", "H1 '21", "H2 '21", "Nov '21", "'22", "Nov '22"]),
  ground: z.enum(["paper", "ink", "structure"]).optional().default("paper"),
});
export type IndexCompareProps = z.input<typeof IndexComparePropsSchema> & BaseTemplateProps;

export const IndexCompare: React.FC<IndexCompareProps> = ({
  title = "",
  unit = "",
  series = [],
  xLabels = [],
  ground = "paper",
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

  const W = 1680;
  const H = 560;
  const allVals = series.flatMap((s) => s.points);
  const max = Math.max(...allVals, 1);
  const coordsFor = (pts: number[]) =>
    pts.map((v, i) => ({ x: (i / (pts.length - 1)) * W, y: H - (v / max) * H * 0.88 - H * 0.06 }));
  // featured drawn last (on top)
  const ordered = [...series].sort((a, b) => (a.featured ? 1 : 0) - (b.featured ? 1 : 0));

  return (
    <Ground ground={ground} accentColor={accentColor} skipIntro={skipIntro}>
      <div style={{ height: "100%", display: "flex", flexDirection: "column", gap: SPACE[8], ...outro }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <SectionTitle title={title} kicker={kicker ?? "Relative Performance"} theme={t} frame={frame} delay={d} />
          <span style={{ fontFamily: TYPE.mono, fontSize: TYPE.label, letterSpacing: 1.6, textTransform: "uppercase", color: t.muted }}>{unit}</span>
        </div>

        {/* legend */}
        <div style={{ display: "flex", gap: SPACE[8] }}>
          {series.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: SPACE[3], ...fadeUp(frame, { delay: d + 6 + stagger(i, 6), dur: 18 }) }}>
              <div style={{ width: 22, height: 4, borderRadius: 2, background: s.featured ? t.accent : rgbaOf(t.ink, 0.35) }} />
              <span style={{ fontFamily: TYPE.mono, fontSize: TYPE.label, letterSpacing: 1, textTransform: "uppercase", color: s.featured ? "#FFFFFF" : t.muted, fontWeight: s.featured ? TYPE.weight.bold : TYPE.weight.medium }}>{s.name}</span>
            </div>
          ))}
        </div>

        <div style={{ flex: 1, position: "relative" }}>
          <AxisFrame theme={t} frame={frame} delay={d + 8} rows={4} baseline />
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" preserveAspectRatio="none" style={{ position: "relative", overflow: "visible" }}>
            {ordered.map((s, i) => {
              const c = coordsFor(s.points);
              const delay = d + 16 + stagger(i, 10);
              const drawP = skipIntro ? 1 : wipe(frame, { delay, dur: 46 });
              const shown = Math.max(2, Math.floor(drawP * c.length));
              const vis = c.slice(0, shown);
              const path = vis.map((p, k) => `${k === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
              const col = s.featured ? t.accent : rgbaOf(t.ink, 0.35);
              const head = vis[vis.length - 1];
              return (
                <g key={i}>
                  <path d={path} fill="none" stroke={col} strokeWidth={s.featured ? 6 : 3} strokeLinecap="round" strokeLinejoin="round" />
                  {head && s.featured && <circle cx={head.x} cy={head.y} r={9} fill={t.accent} />}
                </g>
              );
            })}
          </svg>
          {/* x labels */}
          <div style={{ position: "absolute", left: 0, right: 0, bottom: -34, display: "flex", justifyContent: "space-between", opacity: wipe(frame, { delay: d + 20, dur: 16 }) }}>
            {xLabels.map((x, i) => (
              <span key={i} style={{ fontFamily: TYPE.mono, fontSize: TYPE.source, letterSpacing: 0.8, color: t.muted }}>{x}</span>
            ))}
          </div>
        </div>
      </div>
      <SourceTag source={source} theme={t} frame={frame} delay={d + 52} position="top-right" />
    </Ground>
  );
};
