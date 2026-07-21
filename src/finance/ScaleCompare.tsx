/**
 * ScaleCompare / ComprehensionStat (K3) — make a huge number graspable.
 *
 * A hero value counts up, then stacked comparison bars grow to scale beneath it
 * ("$26B = more than the GDP of…"). Anchors a number too big to grasp.
 *
 * SBF: net worth ~$26B; the ~$8B customer hole. Generalizes: "how big is a
 * trillion", bailout scale (2008).
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
  lift,
  TYPE,
  SPACE,
  RADIUS,
  baseTemplateSchema,
  type BaseTemplateProps,
} from "./kit";

const CmpSchema = z.object({ label: z.string(), rel: z.number(), amount: z.string().optional() });

export const ScaleComparePropsSchema = z.object({
  ...baseTemplateSchema,
  value: z.string().optional().default("$8B"),
  valueLabel: z.string().optional().default("The hole in customer funds"),
  comparisons: z.array(CmpSchema).optional().default([
    { label: "The FTX customer hole", rel: 1.0, amount: "$8B" },
    { label: "Theranos, at its peak valuation", rel: 1.15, amount: "$9B" },
    { label: "GDP of Monaco", rel: 0.94, amount: "$7.5B" },
    { label: "Madoff's actual cash losses", rel: 2.1, amount: "$17B" },
  ]),
  ground: z.enum(["paper", "ink", "structure"]).optional().default("ink"),
});
export type ScaleCompareProps = z.input<typeof ScaleComparePropsSchema> & BaseTemplateProps;

export const ScaleCompare: React.FC<ScaleCompareProps> = ({
  value = "",
  valueLabel = "",
  comparisons = [],
  ground = "ink",
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
  const maxRel = Math.max(...comparisons.map((c) => c.rel), 1);

  return (
    <Ground ground={ground} accentColor={accentColor} skipIntro={skipIntro} focus={{ x: 0.3, y: 0.34 }}>
      <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", gap: SPACE[12], ...outro }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: SPACE[8] }}>
          <SectionTitle title="" kicker={kicker ?? "For Scale"} theme={t} frame={frame} delay={d} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontFamily: TYPE.sans, fontSize: 180, fontWeight: TYPE.weight.black, letterSpacing: -6, lineHeight: 0.9, color: t.accent }}>
              <AnimatedCounter value={value} delay={d + 6} skip={skipIntro} frame={frame} />
            </span>
            <span style={{ fontFamily: TYPE.mono, fontSize: TYPE.sub, letterSpacing: 1.6, textTransform: "uppercase", color: t.muted }}>{valueLabel}</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: SPACE[5] }}>
          {comparisons.map((c, i) => {
            const delay = d + 20 + stagger(i, 8);
            const p = skipIntro ? 1 : wipe(frame, { delay, dur: 30 });
            const featured = i === 0;
            const w = (c.rel / maxRel) * p;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: SPACE[6], ...fadeUp(frame, { delay, dur: 18 }) }}>
                <div style={{ width: 520, textAlign: "right", fontFamily: TYPE.sans, fontSize: TYPE.body + 2, fontWeight: featured ? TYPE.weight.bold : TYPE.weight.medium, color: featured ? "#FFFFFF" : t.ink }}>{c.label}</div>
                <div style={{ flex: 1, height: 44, borderRadius: RADIUS.sm, background: rgbaOf(t.ink, 0.08), overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${w * 100}%`, background: featured ? t.accent : rgbaOf(t.ink, 0.44), borderRadius: RADIUS.sm, display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: SPACE[4] }}>
                    {/* dark label on the (lightened) muted bars so the number reads; the
                        featured accent bar keeps the dark ground-tone label (as DeltaChip). */}
                    {c.amount && p > 0.6 && <span style={{ fontFamily: TYPE.mono, fontSize: TYPE.label, fontWeight: TYPE.weight.bold, color: featured ? (t.isInk ? t.bg : "#fff") : lift(t.bg, -0.5, 0.96) }}>{c.amount}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <SourceTag source={source} theme={t} frame={frame} delay={d + 44} />
    </Ground>
  );
};
