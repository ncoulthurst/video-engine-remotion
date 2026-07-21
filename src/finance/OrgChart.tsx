/**
 * OrgChart / CorporateStructure (G3) — entity / ownership hierarchy.
 *
 * A parent node with a row of children (and optional grandchildren under a
 * featured child), connected by shared FlowEdge connectors. Structure ground for
 * a legitimate org; Ink for a shell-company map. The "who owns what" beat.
 *
 * SBF: FTX ↔ Alameda ↔ FTX Ventures. Generalizes: Berkshire subsidiaries, Enron
 * SPEs, any conglomerate.
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
  resolveTheme,
  useOutro,
  scaleSettle,
  stagger,
  cameraPan,
  SPACE,
  baseTemplateSchema,
  type BaseTemplateProps,
} from "./kit";

const ChildSchema = z.object({
  label: z.string(),
  sub: z.string().optional(),
  featured: z.boolean().optional(),
  children: z.array(z.object({ label: z.string() })).optional(),
});

export const OrgChartPropsSchema = z.object({
  ...baseTemplateSchema,
  root: z.object({ label: z.string(), sub: z.string().optional() }).optional().default({ label: "FTX Group", sub: "Sam Bankman-Fried, CEO" }),
  children: z.array(ChildSchema).optional().default([
    { label: "FTX.com", sub: "Int'l exchange" },
    { label: "FTX US", sub: "US exchange" },
    { label: "Alameda Research", sub: "Trading firm", featured: true, children: [{ label: "FTX Ventures" }, { label: "Venture book" }] },
  ]),
  ground: z.enum(["paper", "ink", "structure"]).optional().default("structure"),
});
export type OrgChartProps = z.input<typeof OrgChartPropsSchema> & BaseTemplateProps;

export const OrgChart: React.FC<OrgChartProps> = ({
  root = { label: "" },
  children = [],
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
  const rootPos = { x: W / 2, y: 90 };
  const childY = 320;
  const n = children.length;
  const childXs = children.map((_, i) => (n === 1 ? W / 2 : (i / (n - 1)) * (W - 340) + 170));
  const featIdx = children.findIndex((c) => c.featured);

  return (
    <Ground ground={ground} accentColor={accentColor} skipIntro={skipIntro} focus={{ x: 0.72, y: 0.52 }}>
      <div style={{ height: "100%", display: "flex", flexDirection: "column", gap: SPACE[10], ...outro }}>
        <SectionTitle title="Corporate Structure" kicker={kicker ?? "Who Owns What"} theme={t} frame={frame} delay={d} />

        <div style={{ flex: 1, position: "relative" }}>
          <div style={{ position: "absolute", left: "50%", top: "50%", width: W, height: H, transform: `translate(-50%, -50%) ${cameraPan(frame, { delay: d + 6, dur: 28, fromScale: 1.04 })}` }}>
            <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
              {children.map((c, i) => (
                <FlowEdge
                  key={i}
                  from={{ x: rootPos.x, y: rootPos.y + 44 }}
                  to={{ x: childXs[i], y: childY - 44 }}
                  frame={frame}
                  delay={d + 16 + stagger(i, 8)}
                  dur={20}
                  theme={t}
                  accent={c.featured}
                  ortho
                  orthoAxis="v"
                  endDots
                  skip={skipIntro}
                />
              ))}
              {/* grandchildren edges under the featured child */}
              {featIdx >= 0 &&
                (children[featIdx].children ?? []).map((_, j, arr) => {
                  const gx = childXs[featIdx] + (arr.length === 1 ? 0 : (j - (arr.length - 1) / 2) * 320);
                  return (
                    <FlowEdge
                      key={`g${j}`}
                      from={{ x: childXs[featIdx], y: childY + 44 }}
                      to={{ x: gx, y: 540 - 30 }}
                      frame={frame}
                      delay={d + 30 + stagger(j, 6)}
                      dur={18}
                      theme={t}
                      accent
                      ortho
                      orthoAxis="v"
                      endDots
                      skip={skipIntro}
                    />
                  );
                })}
            </svg>

            {/* root */}
            <div style={{ position: "absolute", left: rootPos.x, top: rootPos.y, transform: "translate(-50%, -50%)" }}>
              <MapNode label={root.label} eyebrow="Parent group" sub={(root as any).sub} theme={t} width={340} progress={skipIntro ? 1 : scaleSettle(frame, { delay: d + 6, dur: 16, from: 0.6 })} />
            </div>

            {/* children */}
            {children.map((c, i) => (
              <div key={i} style={{ position: "absolute", left: childXs[i], top: childY, transform: "translate(-50%, -50%)" }}>
                <MapNode label={c.label} eyebrow={c.sub} featured={c.featured} theme={t} width={300} progress={skipIntro ? 1 : scaleSettle(frame, { delay: d + 16 + stagger(i, 8), dur: 16, from: 0.6 })} />
              </div>
            ))}

            {/* grandchildren */}
            {featIdx >= 0 &&
              (children[featIdx].children ?? []).map((g, j, arr) => {
                const gx = childXs[featIdx] + (arr.length === 1 ? 0 : (j - (arr.length - 1) / 2) * 320);
                return (
                  <div key={`gc${j}`} style={{ position: "absolute", left: gx, top: 540, transform: "translate(-50%, -50%)" }}>
                    <MapNode label={g.label} eyebrow="Unit" theme={t} width={250} labelSize={22} progress={skipIntro ? 1 : scaleSettle(frame, { delay: d + 30 + stagger(j, 6), dur: 16, from: 0.6 })} />
                  </div>
                );
              })}
          </div>
        </div>
      </div>
      <SourceTag source={source} theme={t} frame={frame} delay={d + 44} />
    </Ground>
  );
};
