/**
 * MarketPanel / TickerCard (E6) — a Bloomberg-terminal-style live panel.
 *
 * Mono ticker rows on the Ink ground: ticker · price · change% · mini sparkline.
 * Rows stagger in, sparks draw, negative changes flash accent-red. The "markets
 * react" beat.
 *
 * SBF: FTT price cratering during the bank run. Generalizes: any crypto/stock doc,
 * the "terminal" look.
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
  wipe,
  stagger,
  rgbaOf,
  ACCENTS,
  TYPE,
  SPACE,
  baseTemplateSchema,
  type BaseTemplateProps,
} from "./kit";

const RowSchema = z.object({
  ticker: z.string(),
  price: z.string(),
  changePct: z.string(),
  spark: z.array(z.number()),
  featured: z.boolean().optional(),
});

export const MarketPanelPropsSchema = z.object({
  ...baseTemplateSchema,
  title: z.string().optional().default("Markets React"),
  rows: z.array(RowSchema).optional().default([
    { ticker: "FTT", price: "$2.29", changePct: "-88.4%", spark: [22, 21, 20, 18, 12, 6, 3, 2.3], featured: true },
    { ticker: "SOL", price: "$13.10", changePct: "-51.2%", spark: [30, 28, 24, 20, 16, 14, 13] },
    { ticker: "BTC", price: "$16,800", changePct: "-22.1%", spark: [21, 20, 19, 18, 17, 16.8] },
    { ticker: "SRM", price: "$0.28", changePct: "-64.0%", spark: [0.8, 0.7, 0.5, 0.4, 0.3, 0.28] },
  ]),
  ground: z.enum(["paper", "ink", "structure"]).optional().default("ink"),
});
export type MarketPanelProps = z.input<typeof MarketPanelPropsSchema> & BaseTemplateProps;

const Spark: React.FC<{ pts: number[]; color: string; p: number }> = ({ pts, color, p }) => {
  const W = 220;
  const H = 60;
  const max = Math.max(...pts);
  const min = Math.min(...pts);
  const rng = max - min || 1;
  const c = pts.map((v, i) => ({ x: (i / (pts.length - 1)) * W, y: H - ((v - min) / rng) * H * 0.9 - H * 0.05 }));
  const shown = Math.max(2, Math.floor(p * c.length));
  const vis = c.slice(0, shown);
  const path = vis.map((pt, k) => `${k === 0 ? "M" : "L"} ${pt.x} ${pt.y}`).join(" ");
  return (
    <svg width={W} height={H} style={{ overflow: "visible" }}>
      <path d={path} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export const MarketPanel: React.FC<MarketPanelProps> = ({
  title = "",
  rows = [],
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

  return (
    <Ground ground={ground} accentColor={accentColor} skipIntro={skipIntro}>
      <div style={{ height: "100%", display: "flex", flexDirection: "column", gap: SPACE[10], ...outro }}>
        <SectionTitle title={title} kicker={kicker ?? "Live Terminal"} theme={t} frame={frame} delay={d} />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          {/* header */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr 1.1fr 240px", padding: `0 ${SPACE[6]}px ${SPACE[3]}px`, borderBottom: `2px solid ${t.line}` }}>
            {["Ticker", "Price", "24h", "Trend"].map((h, i) => (
              <span key={i} style={{ fontFamily: TYPE.mono, fontSize: TYPE.source, letterSpacing: 1.6, textTransform: "uppercase", color: t.muted, textAlign: i === 0 ? "left" : i === 3 ? "right" : "left" }}>{h}</span>
            ))}
          </div>

          {rows.map((r, i) => {
            const delay = d + 14 + stagger(i, 8);
            const p = skipIntro ? 1 : wipe(frame, { delay, dur: 18 });
            const sparkP = skipIntro ? 1 : wipe(frame, { delay: delay + 6, dur: 30 });
            const down = r.changePct.trim().startsWith("-");
            // Hierarchy over uniformity: ONLY the featured row's fall gets the bright
            // loss-red (so it reads as significant); the rest stay muted. No blanket orange.
            const changeCol = r.featured ? ACCENTS.loss : down ? rgbaOf(t.ink, 0.5) : rgbaOf(t.ink, 0.7);
            return (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1.1fr 1.1fr 240px",
                  alignItems: "center",
                  padding: `${SPACE[4]}px ${SPACE[6]}px`,
                  borderBottom: `1px solid ${t.line}`,
                  background: r.featured ? rgbaOf(ACCENTS.loss, 0.14) : "transparent",
                  borderLeft: r.featured ? `3px solid ${ACCENTS.loss}` : "3px solid transparent",
                  opacity: p,
                  transform: `translateX(${(1 - p) * -14}px)`,
                }}
              >
                <span style={{ fontFamily: TYPE.mono, fontSize: 30, fontWeight: TYPE.weight.bold, letterSpacing: 1, color: r.featured ? "#FFFFFF" : t.ink }}>{r.ticker}</span>
                <span style={{ fontFamily: TYPE.mono, fontSize: 30, fontWeight: TYPE.weight.medium, color: t.ink, fontVariantNumeric: "tabular-nums" }}>{r.price}</span>
                <span style={{ fontFamily: TYPE.mono, fontSize: r.featured ? 36 : 30, fontWeight: TYPE.weight.bold, color: changeCol, fontVariantNumeric: "tabular-nums" }}>{r.changePct}</span>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <Spark pts={r.spark} color={changeCol} p={sparkP} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <SourceTag source={source} theme={t} frame={frame} delay={d + 40} />
    </Ground>
  );
};
