/**
 * ComparisonTable (K2) — A vs B across several attributes. The tabular argument.
 *
 * Two header columns settle, then rows stagger in; the winning cell per row takes
 * the accent. The structured version of a "case for / against".
 *
 * SBF: "Normal VC vs Alameda" — the risk-appetite argument as a table.
 * Generalizes: Buffett vs the market, product vs product, plan vs reality.
 */
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  Ground,
  SectionTitle,
  SourceTag,
  resolveTheme,
  useOutro,
  fadeUp,
  wipe,
  stagger,
  rgbaOf,
  labelColumnBg,
  TYPE,
  SPACE,
  baseTemplateSchema,
  type BaseTemplateProps,
} from "./kit";

const RowSchema = z.object({
  attribute: z.string(),
  a: z.string(),
  b: z.string(),
  winner: z.enum(["a", "b", "none"]).optional(),
});

export const ComparisonTablePropsSchema = z.object({
  ...baseTemplateSchema,
  title: z.string().optional().default("Normal VC vs Alameda"),
  colA: z.string().optional().default("A responsible fund"),
  colB: z.string().optional().default("Alameda Research"),
  rows: z.array(RowSchema).optional().default([
    { attribute: "Capital", a: "Raised from LPs", b: "Customer deposits", winner: "b" },
    { attribute: "Risk appetite", a: "Downside protected", b: "Effectively unlimited", winner: "b" },
    { attribute: "Accountability", a: "Answers to investors", b: "Answered to no one", winner: "b" },
    { attribute: "On a loss", a: "Fund takes the hit", b: "Depositors take the hit", winner: "b" },
  ]),
  ground: z.enum(["paper", "ink", "structure"]).optional().default("paper"),
});
export type ComparisonTableProps = z.input<typeof ComparisonTablePropsSchema> & BaseTemplateProps;

export const ComparisonTable: React.FC<ComparisonTableProps> = ({
  title = "",
  colA = "",
  colB = "",
  rows = [],
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
  const grid = "minmax(240px, 1fr) 1.4fr 1.4fr";
  // The row-label rail — a near-black column that sets the attributes apart from the data.
  const attrBg = labelColumnBg(t);

  // Column cell — carries the vertical divider (left border) AND the winner highlight:
  // a full-cell accent band + a stronger 3px accent edge so the damning column pops.
  const colCell = (win: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    padding: `${SPACE[5]}px ${SPACE[6]}px`,
    borderLeft: `${win ? 3 : 1}px solid ${win ? t.accent : t.line}`,
    background: win ? rgbaOf(t.accent, 0.2) : "transparent",
    fontFamily: TYPE.sans,
    fontSize: TYPE.sub,
    fontWeight: win ? TYPE.weight.bold : TYPE.weight.medium,
    color: win ? "#FFFFFF" : t.ink,
  });

  return (
    <Ground ground={ground} accentColor={accentColor} skipIntro={skipIntro}>
      <div style={{ height: "100%", display: "flex", flexDirection: "column", gap: SPACE[10], ...outro }}>
        <SectionTitle title={title} kicker={kicker ?? "Side by Side"} theme={t} frame={frame} delay={d} />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          {/* header */}
          <div style={{ display: "grid", gridTemplateColumns: grid, alignItems: "end", paddingBottom: SPACE[4], borderBottom: `2px solid ${t.line}`, ...fadeUp(frame, { delay: d + 6, dur: 20 }) }}>
            <span />
            <span style={{ fontFamily: TYPE.mono, fontSize: TYPE.label, letterSpacing: 1.6, textTransform: "uppercase", color: t.muted, padding: `0 ${SPACE[6]}px`, borderLeft: `1px solid ${t.line}` }}>{colA}</span>
            <span style={{ fontFamily: TYPE.mono, fontSize: TYPE.label, letterSpacing: 1.6, textTransform: "uppercase", color: "#FFFFFF", padding: `0 ${SPACE[6]}px`, borderLeft: `1px solid ${t.line}` }}>{colB}</span>
          </div>

          {rows.map((r, i) => {
            const delay = d + 14 + stagger(i, 8);
            const p = skipIntro ? 1 : wipe(frame, { delay, dur: 18 });
            return (
              <div key={i} style={{ display: "grid", gridTemplateColumns: grid, alignItems: "stretch", borderBottom: `1px solid ${t.line}`, opacity: p, transform: `translateY(${(1 - p) * 12}px)`, minHeight: 92 }}>
                <div style={{ display: "flex", alignItems: "center", fontFamily: TYPE.mono, fontSize: TYPE.label, letterSpacing: 1.2, textTransform: "uppercase", color: rgbaOf(t.ink, 0.82), background: attrBg, paddingLeft: SPACE[6], paddingRight: SPACE[4], borderRadius: i === 0 ? `${8}px ${8}px 0 0` : i === rows.length - 1 ? `0 0 ${8}px ${8}px` : 0 }}>{r.attribute}</div>
                <div style={colCell(r.winner === "a")}>{r.a}</div>
                <div style={colCell(r.winner === "b")}>{r.b}</div>
              </div>
            );
          })}
        </div>
      </div>
      <SourceTag source={source} theme={t} frame={frame} delay={d + 40} />
    </Ground>
  );
};
