/**
 * AcquisitionTree / DealMap (G4) — investments radiating from a parent over time.
 *
 * A central parent node on the left; dated deal nodes spray out to the right,
 * connected by shared FlowEdge curves and staggered by year. The featured deal
 * takes the accent. The "acquisition spree / roll-up" beat.
 *
 * SBF: FTX Ventures' bets (Anthropic, Solana, SpaceX…). Generalizes:
 * Nvidia / Google / Meta acquisition history.
 */
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  Ground,
  SectionTitle,
  SourceTag,
  FlowEdge,
  MapNode,
  SHADOW,
  resolveTheme,
  useOutro,
  scaleSettle,
  stagger,
  rgbaOf,
  TYPE,
  SPACE,
  baseTemplateSchema,
  type BaseTemplateProps,
} from "./kit";

const DealSchema = z.object({ name: z.string(), year: z.string(), amount: z.string().optional(), featured: z.boolean().optional() });

export const AcquisitionTreePropsSchema = z.object({
  ...baseTemplateSchema,
  parent: z.string().optional().default("FTX Ventures"),
  deals: z.array(DealSchema).optional().default([
    { name: "Anthropic", year: "2022", amount: "$500M", featured: true },
    { name: "Solana", year: "2020", amount: "$10M" },
    { name: "SpaceX", year: "2021", amount: "$hundreds M" },
    { name: "Serum", year: "2020", amount: "seed" },
    { name: "Sui / Mysten", year: "2022", amount: "—" },
  ]),
  ground: z.enum(["paper", "ink", "structure"]).optional().default("structure"),
});
export type AcquisitionTreeProps = z.input<typeof AcquisitionTreePropsSchema> & BaseTemplateProps;

export const AcquisitionTree: React.FC<AcquisitionTreeProps> = ({
  parent = "",
  deals = [],
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

  const W = 1680;
  const H = 620;
  const parentPos = { x: 220, y: H / 2 };
  const n = deals.length;
  const dealX = W - 300;
  const dealYs = deals.map((_, i) => (n === 1 ? H / 2 : (i / (n - 1)) * (H - 120) + 60));
  const featIdx = Math.max(0, deals.findIndex((dl) => dl.featured));
  const focusY = n > 1 ? 0.28 + (featIdx / (n - 1)) * 0.44 : 0.5;

  return (
    <Ground ground={ground} accentColor={accentColor} skipIntro={skipIntro} focus={{ x: 0.74, y: focusY }}>
      <div style={{ height: "100%", display: "flex", flexDirection: "column", gap: SPACE[8], ...outro }}>
        <SectionTitle title={`${parent} — the bets`} kicker={kicker ?? "Deal Map"} theme={t} frame={frame} delay={d} />

        <div style={{ flex: 1, position: "relative" }}>
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
            {deals.map((dl, i) => (
              <FlowEdge
                key={i}
                from={{ x: parentPos.x + 130, y: parentPos.y }}
                to={{ x: dealX - 210, y: dealYs[i] }}
                frame={frame}
                delay={d + 16 + stagger(i, 8)}
                dur={22}
                theme={t}
                accent={dl.featured}
                curve
                width={dl.featured ? 3.5 : 2}
                endDots
                skip={skipIntro}
              />
            ))}
          </svg>

          {/* parent node — the origin (neutral; the accent belongs to the standout bet) */}
          <div style={{ position: "absolute", left: parentPos.x, top: parentPos.y, transform: "translate(-50%, -50%)" }}>
            <MapNode label={parent} eyebrow="Parent fund" theme={t} width={280} progress={skipIntro ? 1 : scaleSettle(frame, { delay: d + 6, dur: 16, from: 0.6 })} />
          </div>

          {/* deal nodes — refined data chips (same design language as MapNode) */}
          {deals.map((dl, i) => {
            const p = skipIntro ? 1 : scaleSettle(frame, { delay: d + 16 + stagger(i, 8), dur: 16, from: 0.6 });
            const feat = !!dl.featured;
            const edgeLight = t.isInk ? "inset 0 1px 0 rgba(255,247,238,0.08)" : "inset 0 1px 0 rgba(255,255,255,0.85)";
            return (
              <div key={i} style={{ position: "absolute", left: dealX, top: dealYs[i], transform: `translate(-50%, -50%) scale(${p})`, opacity: p }}>
                <div
                  style={{
                    position: "relative",
                    width: 340,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: SPACE[4],
                    padding: `18px 24px 16px 28px`,
                    borderRadius: 9,
                    background: feat ? `linear-gradient(180deg, ${rgbaOf(t.accent, 0.09)}, ${rgbaOf(t.accent, 0.02)}), ${t.surface}` : t.surface,
                    border: `1.5px solid ${feat ? t.accent : rgbaOf(t.ink, 0.22)}`,
                    boxShadow: `${edgeLight}, ${t.isInk ? SHADOW.nodeInk : SHADOW.node}`,
                    overflow: "hidden",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontFamily: TYPE.mono, fontSize: 12.5, fontWeight: TYPE.weight.semibold, letterSpacing: 2, textTransform: "uppercase", color: feat ? "#FFFFFF" : t.muted }}>{dl.year}</span>
                    <span style={{ fontFamily: TYPE.sans, fontSize: 26, fontWeight: TYPE.weight.bold, letterSpacing: -0.4, color: t.ink }}>{dl.name}</span>
                  </div>
                  {dl.amount && <span style={{ fontFamily: TYPE.sans, fontSize: 24, fontWeight: TYPE.weight.black, letterSpacing: -0.5, color: feat ? "#FFFFFF" : t.ink }}>{dl.amount}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <SourceTag source={source} theme={t} frame={frame} delay={d + 42} />
    </Ground>
  );
};
