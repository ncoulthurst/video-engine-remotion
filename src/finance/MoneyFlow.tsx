/**
 * MoneyFlow (F1) — money *moving* between parties. FLAGSHIP · the fraud-doc graphic.
 *
 * Source(s) → conduit → sink(s) on the Ink ground, with animated particles running
 * the edges. Illicit flows run in accent-red; legitimate flows in muted. A camera
 * settles the board and the key transfer pulses. This is the template that makes a
 * fraud documentary.
 *
 * SBF: "FTX customer money allegedly funded Alameda's investments" — the "Stolen
 * Capital" scene (blue dots → red vortex). Generalizes: Enron SPEs, Madoff, 2008
 * MBS chain, Wirecard.
 */
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  Ground,
  SectionTitle,
  Pill,
  SourceTag,
  FlowEdge,
  resolveTheme,
  useOutro,
  wipe,
  scaleSettle,
  stagger,
  rgbaOf,
  TYPE,
  SPACE,
  type Theme,
  baseTemplateSchema,
  type BaseTemplateProps,
} from "./kit";

const NodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  kind: z.enum(["source", "conduit", "sink"]),
  featured: z.boolean().optional(),
});
const FlowSchema = z.object({
  from: z.string(),
  to: z.string(),
  illicit: z.boolean().optional(),
  label: z.string().optional(),
});

export const MoneyFlowPropsSchema = z.object({
  ...baseTemplateSchema,
  title: z.string().optional().default("Stolen Capital"),
  nodes: z.array(NodeSchema).optional().default([
    { id: "cust", label: "FTX Customers", kind: "source" },
    { id: "ftx", label: "FTX Exchange", kind: "conduit" },
    { id: "alam", label: "Alameda Research", kind: "sink", featured: true },
  ]),
  flows: z.array(FlowSchema).optional().default([
    { from: "cust", to: "ftx", label: "deposits" },
    { from: "ftx", to: "alam", illicit: true, label: "commingled" },
  ]),
  ground: z.enum(["paper", "ink", "structure"]).optional().default("ink"),
});
export type MoneyFlowProps = z.input<typeof MoneyFlowPropsSchema> & BaseTemplateProps;

const COL_X: Record<string, number> = { source: 0.12, conduit: 0.5, sink: 0.88 };

const FlowNode: React.FC<{ label: string; featured?: boolean; theme: Theme; p: number }> = ({ label, featured, theme, p }) => (
  <div
    style={{
      transform: `scale(${p})`,
      opacity: p,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: SPACE[3],
    }}
  >
    <div
      style={{
        width: featured ? 200 : 168,
        height: featured ? 200 : 168,
        borderRadius: "50%",
        // featured = the main attention element → SOLID accent fill + white text.
        background: featured ? theme.accent : theme.surface,
        border: `2px solid ${featured ? theme.accent : theme.line}`,
        boxShadow: featured ? `0 0 0 10px ${rgbaOf(theme.accent, 0.1)}` : "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: SPACE[5],
      }}
    >
      <span style={{ fontFamily: TYPE.sans, fontSize: featured ? 26 : 22, fontWeight: TYPE.weight.bold, color: featured ? "#FFFFFF" : theme.ink, lineHeight: 1.1 }}>
        {label}
      </span>
    </div>
  </div>
);

export const MoneyFlow: React.FC<MoneyFlowProps> = ({
  title = "",
  nodes = [],
  flows = [],
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
  const H = 560;
  const pos: Record<string, { x: number; y: number }> = {};
  const kindCount: Record<string, number> = {};
  const kindIndex: Record<string, number> = {};
  nodes.forEach((n) => (kindCount[n.kind] = (kindCount[n.kind] ?? 0) + 1));
  nodes.forEach((n) => {
    const idx = kindIndex[n.kind] ?? 0;
    kindIndex[n.kind] = idx + 1;
    const total = kindCount[n.kind];
    const y = total === 1 ? 0.5 : 0.5 + (idx - (total - 1) / 2) * (0.7 / total);
    pos[n.id] = { x: COL_X[n.kind] * W, y: y * H };
  });

  return (
    <Ground ground={ground} accentColor={accentColor} skipIntro={skipIntro}>
      <div style={{ height: "100%", display: "flex", flexDirection: "column", gap: SPACE[10], ...outro }}>
        <SectionTitle title={title} kicker={kicker ?? "Follow the Money"} theme={t} frame={frame} delay={d} />

        <div style={{ flex: 1, position: "relative" }}>
          <div style={{ position: "absolute", left: "50%", top: "50%", width: W, height: H, transform: `translate(-50%, -50%) scale(${scaleSettle(frame, { delay: d + 6, dur: 30, from: 1.05 })})` }}>
            {/* Edges (SVG) — particles animate along each path */}
            <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
              {flows.map((fl, i) => {
                const a = pos[fl.from];
                const b = pos[fl.to];
                if (!a || !b) return null;
                // Meet each circle at its EDGE, not its centre: exit the right side of the
                // source node, touch the left side of the target node.
                const radOf = (id: string) => ((nodes.find((n) => n.id === id)?.featured ? 100 : 84) + 2);
                const from = { x: a.x + radOf(fl.from), y: a.y };
                const to = { x: b.x - radOf(fl.to), y: b.y };
                return (
                  <FlowEdge
                    key={i}
                    from={from}
                    to={to}
                    frame={frame}
                    delay={d + 18 + stagger(i, 10)}
                    dur={26}
                    theme={t}
                    accent={fl.illicit}
                    curve
                    particles={3}
                    label={fl.label}
                    width={fl.illicit ? 5 : 3}
                    skip={skipIntro}
                  />
                );
              })}
            </svg>

            {/* Nodes */}
            {nodes.map((n, i) => {
              const p = skipIntro ? 1 : scaleSettle(frame, { delay: d + 8 + stagger(i, 8), dur: 18, from: 0.4 });
              return (
                <div key={n.id} style={{ position: "absolute", left: pos[n.id].x, top: pos[n.id].y, transform: "translate(-50%, -50%)" }}>
                  <FlowNode label={n.label} featured={n.featured} theme={t} p={p} />
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", gap: SPACE[4], opacity: wipe(frame, { delay: d + 40, dur: 16 }) }}>
          <Pill theme={t} filled>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#FFFFFF", display: "inline-block" }} /> Illicit flow
          </Pill>
          <Pill theme={t}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: t.muted, display: "inline-block" }} /> Legitimate flow
          </Pill>
        </div>
      </div>
      <SourceTag source={source} theme={t} frame={frame} delay={d + 44} />
    </Ground>
  );
};
