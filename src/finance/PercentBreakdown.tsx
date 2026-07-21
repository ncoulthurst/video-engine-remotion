/**
 * PercentBreakdown / ShareBar (C5) — a 100% stacked bar: what a whole is made of.
 *
 * Segments wipe in left→right, staggered; the featured segment takes the accent;
 * percentages count up in a mono legend below. The "X% was Y" composition beat.
 *
 * SBF: much of Alameda's balance sheet was illiquid FTT. Generalizes: portfolio
 * mix, revenue mix, debt composition.
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
  RADIUS,
  baseTemplateSchema,
  type BaseTemplateProps,
} from "./kit";

const SegSchema = z.object({ label: z.string(), pct: z.number(), featured: z.boolean().optional() });

export const PercentBreakdownPropsSchema = z.object({
  ...baseTemplateSchema,
  title: z.string().optional().default("Alameda's Balance Sheet"),
  segments: z.array(SegSchema).optional().default([
    { label: "FTT (own token, illiquid)", pct: 58, featured: true },
    { label: "Other tokens", pct: 22 },
    { label: "Venture equity", pct: 14 },
    { label: "Cash", pct: 6 },
  ]),
  note: z.string().optional().default("A balance sheet backed largely by a token it printed itself."),
  ground: z.enum(["paper", "ink", "structure"]).optional().default("paper"),
});
export type PercentBreakdownProps = z.input<typeof PercentBreakdownPropsSchema> & BaseTemplateProps;

export const PercentBreakdown: React.FC<PercentBreakdownProps> = ({
  title = "",
  segments = [],
  note = "",
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
  const shades = [0.42, 0.3, 0.2];

  return (
    <Ground ground={ground} accentColor={accentColor} skipIntro={skipIntro}>
      <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", gap: SPACE[12], ...outro }}>
        <SectionTitle title={title} kicker={kicker ?? "Composition"} theme={t} frame={frame} delay={d} />

        {/* the 100% bar */}
        <div style={{ display: "flex", width: "100%", height: 130, borderRadius: RADIUS.md, overflow: "hidden", border: `1px solid ${t.line}` }}>
          {segments.map((s, i) => {
            const delay = d + 12 + stagger(i, 8);
            const p = skipIntro ? 1 : wipe(frame, { delay, dur: 26 });
            const col = s.featured ? t.accent : rgbaOf(t.ink, shades[Math.min(shades.length - 1, i)]);
            return (
              <div key={i} style={{ width: `${s.pct}%`, background: col, transformOrigin: "left", transform: `scaleX(${p})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {p > 0.6 && s.pct >= 10 && (
                  <span style={{ fontFamily: TYPE.sans, fontSize: 40, fontWeight: TYPE.weight.black, color: s.featured || i < 1 ? (t.isInk ? t.ink : "#fff") : "#fff", opacity: (p - 0.6) / 0.4 }}>
                    <AnimatedCounter value={`${s.pct}%`} delay={delay + 8} skip={skipIntro} frame={frame} />
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* legend */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: SPACE[10] }}>
          {segments.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: SPACE[3], ...fadeUp(frame, { delay: d + 20 + stagger(i, 6), dur: 18 }) }}>
              <div style={{ width: 16, height: 16, borderRadius: 4, background: s.featured ? t.accent : rgbaOf(t.ink, shades[Math.min(shades.length - 1, i)]) }} />
              <span style={{ fontFamily: TYPE.sans, fontSize: TYPE.body, fontWeight: s.featured ? TYPE.weight.bold : TYPE.weight.medium, color: s.featured ? "#FFFFFF" : t.ink }}>{s.label}</span>
              <span style={{ fontFamily: TYPE.mono, fontSize: TYPE.label, color: t.muted }}>{s.pct}%</span>
            </div>
          ))}
        </div>

        {note && (
          <div style={{ fontFamily: TYPE.sans, fontSize: TYPE.sub, fontWeight: TYPE.weight.medium, color: t.muted, maxWidth: 1100, ...fadeUp(frame, { delay: d + 34, dur: 20 }) }}>{note}</div>
        )}
      </div>
      <SourceTag source={source} theme={t} frame={frame} delay={d + 40} />
    </Ground>
  );
};
