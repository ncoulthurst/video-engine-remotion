/**
 * SystemDiagram (F3) — explain how a mechanism works.
 *
 * Boxed nodes + labelled connectors reveal in step order, with numbered step
 * captions staggering beneath. A camera settles the board. The "here's how X
 * worked" explanatory beat.
 *
 * SBF: how the FTX / Alameda relationship worked; how commingling happened.
 * Generalizes: CDOs (2008), how a hedge fund works, banking mechanics.
 */
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  Ground,
  SectionTitle,
  SourceTag,
  MapNode,
  resolveTheme,
  useOutro,
  wipe,
  scaleSettle,
  stagger,
  rgbaOf,
  STROKE,
  TYPE,
  SPACE,
  baseTemplateSchema,
  type BaseTemplateProps,
} from "./kit";

const NodeSchema = z.object({ id: z.string(), label: z.string(), featured: z.boolean().optional() });
const EdgeSchema = z.object({ from: z.string(), to: z.string(), label: z.string().optional() });

export const SystemDiagramPropsSchema = z.object({
  ...baseTemplateSchema,
  title: z.string().optional().default("How the Money Moved"),
  nodes: z.array(NodeSchema).optional().default([
    { id: "cust", label: "Customer\nDeposits" },
    { id: "ftx", label: "FTX\nExchange" },
    { id: "alam", label: "Alameda\nResearch", featured: true },
    { id: "bets", label: "Venture\nBets" },
  ]),
  edges: z.array(EdgeSchema).optional().default([
    { from: "cust", to: "ftx", label: "deposit" },
    { from: "ftx", to: "alam", label: "secret credit line" },
    { from: "alam", to: "bets", label: "invested" },
  ]),
  steps: z.array(z.string()).optional().default([
    "Customers deposit funds on FTX.",
    "FTX extends a secret, uncapped credit line to Alameda.",
    "Alameda spends customer money on illiquid venture bets.",
  ]),
  ground: z.enum(["paper", "ink", "structure"]).optional().default("structure"),
});
export type SystemDiagramProps = z.input<typeof SystemDiagramPropsSchema> & BaseTemplateProps;

export const SystemDiagram: React.FC<SystemDiagramProps> = ({
  title = "",
  nodes = [],
  edges = [],
  steps = [],
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

  return (
    <Ground ground={ground} accentColor={accentColor} skipIntro={skipIntro} focus={{ x: 0.42, y: 0.5 }}>
      <div style={{ height: "100%", display: "flex", flexDirection: "column", gap: SPACE[10], ...outro }}>
        <SectionTitle title={title} kicker={kicker ?? "The Mechanism"} theme={t} frame={frame} delay={d} />

        {/* Integrated top-down flow: each stage is a node; the transition between two
            stages carries its own label + the step that explains it (no separate list). */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", paddingLeft: SPACE[6] }}>
          {nodes.map((nd, i) => {
            const nodeP = skipIntro ? 1 : scaleSettle(frame, { delay: d + 10 + stagger(i, 16), dur: 16, from: 0.6 });
            const hasNext = i < nodes.length - 1;
            const eIdx = edges.findIndex((e) => e.from === nd.id);
            const edge = eIdx >= 0 ? edges[eIdx] : undefined;
            const step = eIdx >= 0 ? steps[eIdx] : undefined;
            const tgt = edge ? nodes.find((x) => x.id === edge.to) : undefined;
            const edgeFeat = !!tgt?.featured;
            const cDelay = d + 22 + stagger(i, 16);
            const cP = skipIntro ? 1 : wipe(frame, { delay: cDelay, dur: 18 });
            const arrowCol = edgeFeat ? t.accent : rgbaOf(t.ink, 0.5);
            return (
              <div key={nd.id}>
                <div style={{ width: 500 }}>
                  <MapNode label={nd.label} featured={!!nd.featured} theme={t} width="100%" align="left" labelSize={30} progress={nodeP} />
                </div>

                {hasNext && (
                  <div style={{ display: "flex", alignItems: "center", gap: SPACE[6], paddingLeft: 34, minHeight: 104 }}>
                    {/* vertical arrow — money moving down to the next stage */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, opacity: cP }}>
                      <div style={{ width: 0, height: 54 * cP, borderLeft: `${STROKE.line}px solid ${arrowCol}` }} />
                      <div style={{ width: 0, height: 0, borderLeft: "7px solid transparent", borderRight: "7px solid transparent", borderTop: `9px solid ${arrowCol}`, marginTop: -1, opacity: cP > 0.9 ? 1 : 0 }} />
                    </div>
                    {/* the transition's label + the step that explains it */}
                    <div style={{ opacity: cP, transform: `translateX(${(1 - cP) * -12}px)`, maxWidth: 980 }}>
                      {edge?.label && (
                        <div style={{ fontFamily: TYPE.mono, fontSize: 15, fontWeight: TYPE.weight.bold, letterSpacing: 1.8, textTransform: "uppercase", color: edgeFeat ? t.accent : t.muted, marginBottom: 7 }}>
                          {edge.label}
                        </div>
                      )}
                      {step && (
                        <div style={{ fontFamily: TYPE.sans, fontSize: TYPE.sub, fontWeight: TYPE.weight.medium, color: t.ink, lineHeight: 1.35 }}>
                          {step}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <SourceTag source={source} theme={t} frame={frame} delay={d + 48} />
    </Ground>
  );
};
