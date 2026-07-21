/**
 * SankeyFlow (F2) — proportional flows: where the money actually went.
 *
 * A single source node on the left, proportional ribbons widening out to right-hand
 * branches (investments / donations / real estate / loans). Ribbon thickness ∝
 * amount; amounts count up; the featured branch takes the accent. Ink ground.
 *
 * SBF: customer funds → ventures / political donations / real estate / loans.
 * Generalizes: fund flows, budget breakdowns, use-of-proceeds.
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

const BranchSchema = z.object({ label: z.string(), amount: z.string(), value: z.number(), featured: z.boolean().optional() });

export const SankeyFlowPropsSchema = z.object({
  ...baseTemplateSchema,
  sourceLabel: z.string().optional().default("FTX Customer Funds"),
  sourceTotal: z.string().optional().default("$8B"),
  branches: z.array(BranchSchema).optional().default([
    { label: "Venture investments", amount: "$5.0B", value: 5.0, featured: true },
    { label: "Real estate", amount: "$1.0B", value: 1.0 },
    { label: "Political donations", amount: "$0.1B", value: 0.1 },
    { label: "Insider loans", amount: "$1.9B", value: 1.9 },
  ]),
  ground: z.enum(["paper", "ink", "structure"]).optional().default("ink"),
});
export type SankeyFlowProps = z.input<typeof SankeyFlowPropsSchema> & BaseTemplateProps;

export const SankeyFlow: React.FC<SankeyFlowProps> = ({
  sourceLabel = "",
  sourceTotal = "",
  branches = [],
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

  const W = 1680;
  const H = 620;
  const total = branches.reduce((s, b) => s + b.value, 0) || 1;
  const srcX = 60;
  const srcW = 44;
  const brX = W - 380; // leave a right gutter for branch labels
  const gap = 20;
  const usableH = H - gap * (branches.length - 1);
  // stacked source slice tops + branch tops
  let srcCursor = 0;
  let brCursor = 0;
  const rows = branches.map((b) => {
    const h = (b.value / total) * usableH;
    const sTop = srcCursor;
    const bTop = brCursor;
    srcCursor += h;
    brCursor += h + gap;
    return { b, h, sTop, bTop };
  });

  return (
    <Ground ground={ground} accentColor={accentColor} skipIntro={skipIntro}>
      <div style={{ height: "100%", display: "flex", flexDirection: "column", gap: SPACE[8], ...outro }}>
        <SectionTitle title="Where the Money Went" kicker={kicker ?? "Use of Proceeds"} theme={t} frame={frame} delay={d} />

        <div style={{ flex: 1, position: "relative" }}>
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
            {/* ribbons */}
            {rows.map(({ b, h, sTop, bTop }, i) => {
              const delay = d + 16 + stagger(i, 10);
              const p = skipIntro ? 1 : wipe(frame, { delay, dur: 30 });
              const col = b.featured ? t.accent : t.muted;
              const x0 = srcX + srcW;
              const x1 = brX - srcW;
              const midX = (x0 + x1) / 2;
              const topPath = `M ${x0} ${sTop} C ${midX} ${sTop}, ${midX} ${bTop}, ${x1} ${bTop}`;
              const botPath = `L ${x1} ${bTop + h} C ${midX} ${bTop + h}, ${midX} ${sTop + h}, ${x0} ${sTop + h} Z`;
              return (
                <path
                  key={i}
                  d={`${topPath} ${botPath}`}
                  fill={col}
                  fillOpacity={(b.featured ? 0.3 : 0.14) * p}
                  stroke={col}
                  strokeOpacity={b.featured ? 0.5 * p : 0.2 * p}
                  strokeWidth={1}
                />
              );
            })}
            {/* source bar */}
            <rect x={srcX} y={0} width={srcW} height={H * (skipIntro ? 1 : wipe(frame, { delay: d + 6, dur: 20 }))} fill={t.accent} rx={6} />
            {/* branch bars */}
            {rows.map(({ b, h, bTop }, i) => (
              <rect key={i} x={brX - srcW} y={bTop} width={srcW} height={h * (skipIntro ? 1 : wipe(frame, { delay: d + 16 + stagger(i, 10), dur: 26 }))} fill={b.featured ? t.accent : rgbaOf(t.ink, 0.4)} rx={6} />
            ))}
          </svg>

          {/* source label */}
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 540, display: "flex", flexDirection: "column", justifyContent: "center", paddingLeft: srcX + srcW + 24, ...fadeUp(frame, { delay: d + 8, dur: 20 }) }}>
            <div style={{ fontFamily: TYPE.sans, fontSize: 30, fontWeight: TYPE.weight.bold, color: "rgba(255,255,255,0.62)", whiteSpace: "nowrap" }}>{sourceLabel}</div>
            <div style={{ fontFamily: TYPE.sans, fontSize: 48, fontWeight: TYPE.weight.black, color: "#FFFFFF", letterSpacing: -1 }}>
              <AnimatedCounter value={sourceTotal} delay={d + 12} skip={skipIntro} frame={frame} />
            </div>
          </div>

          {/* branch labels */}
          {rows.map(({ b, h, bTop }, i) => {
            const delay = d + 20 + stagger(i, 10);
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: `${(brX / W) * 100}%`,
                  marginLeft: 30,
                  top: `${((bTop + h / 2) / H) * 100}%`,
                  transform: "translateY(-50%)",
                  width: 340,
                  textAlign: "left",
                  ...fadeUp(frame, { delay, dur: 18 }),
                }}
              >
                <div style={{ fontFamily: TYPE.sans, fontSize: 26, fontWeight: TYPE.weight.bold, color: b.featured ? "#FFFFFF" : "rgba(255,255,255,0.64)", lineHeight: 1.1 }}>{b.label}</div>
                <div style={{ fontFamily: TYPE.mono, fontSize: TYPE.sub, fontWeight: TYPE.weight.semibold, color: b.featured ? "#FFFFFF" : "rgba(255,255,255,0.5)" }}>
                  <AnimatedCounter value={b.amount} delay={delay + 4} skip={skipIntro} frame={frame} />
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
