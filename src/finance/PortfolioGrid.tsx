/**
 * PortfolioGrid (G1) — the core "what they owned" graphic. FLAGSHIP.
 *
 * A portfolio of holdings as ranked ledger rows: logo · name · a bar that grows
 * to the position's value · the value counting up. The featured (largest) position
 * takes the accent + a "LARGEST POSITION" tag. Everything else is neutral (§1.2).
 *
 * SBF: "a portfolio containing stakes in Anthropic, SpaceX, Solana" — the Act-3
 * portfolio walk. Generalizes: Berkshire holdings, BlackRock, any fund/VC book.
 */
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  Ground,
  SectionTitle,
  LogoBadge,
  Pill,
  AnimatedCounter,
  SourceTag,
  resolveTheme,
  useOutro,
  fadeUp,
  wipe,
  stagger,
  focusPush,
  dimAt,
  pulseAt,
  rgbaOf,
  cardShadow,
  TYPE,
  SPACE,
  RADIUS,
  baseTemplateSchema,
  type BaseTemplateProps,
} from "./kit";

const HoldingSchema = z.object({
  name: z.string(),
  value: z.string(), // display string e.g. "$1.3B"
  valueNum: z.number(), // for bar scaling
  sub: z.string().optional(),
  logo: z.string().optional(),
  featured: z.boolean().optional(),
});

export const PortfolioGridPropsSchema = z.object({
  ...baseTemplateSchema,
  title: z.string().optional().default("The FTX Estate Portfolio"),
  asOf: z.string().optional().default("As recovered, 2024"),
  holdings: z.array(HoldingSchema).optional().default([
    { name: "Anthropic", value: "$1.3B", valueNum: 1300, sub: "Generative AI · sold 2024", featured: true },
    { name: "Solana (SOL)", value: "$1.1B", valueNum: 1100, sub: "Token position" },
    { name: "SpaceX", value: "$0.5B", valueNum: 500, sub: "Private equity" },
    { name: "Serum (SRM)", value: "$0.2B", valueNum: 200, sub: "Paper valuation" },
  ]),
  ground: z.enum(["paper", "ink", "structure"]).optional().default("paper"),
});
export type PortfolioGridProps = z.input<typeof PortfolioGridPropsSchema> & BaseTemplateProps;

export const PortfolioGrid: React.FC<PortfolioGridProps> = ({
  title = "",
  asOf = "",
  holdings = [],
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
  const max = Math.max(1, ...holdings.map((h) => h.valueNum));
  const featIdx = Math.max(0, holdings.findIndex((h) => h.featured));
  const featValue = holdings[featIdx]?.value ?? "";
  const n = Math.max(1, holdings.length);

  // Beats: rows reveal one by one, then a close-up settles on the largest position.
  const lastReveal = d + 16 + stagger(n - 1, 12);
  const bFocus = lastReveal + 34;
  const focusOy = ((featIdx + 0.5) / n) * 100;
  const push = skipIntro ? {} : focusPush(frame, { delay: bFocus, dur: 42, to: 1.09, ox: 42, oy: focusOy });

  return (
    <Ground ground={ground} accentColor={accentColor} skipIntro={skipIntro} focus={{ x: 0.32, y: 0.3 + (featIdx / n) * 0.4 }}>
      <div style={{ height: "100%", display: "flex", flexDirection: "column", gap: SPACE[12], ...outro }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <SectionTitle title={title} kicker={kicker ?? "Holdings"} theme={t} frame={frame} delay={d} />
          {asOf && (
            <div style={{ fontFamily: TYPE.mono, fontSize: TYPE.label, letterSpacing: 1.6, textTransform: "uppercase", color: t.muted, ...fadeUp(frame, { delay: d + 8 }) }}>
              {asOf}
            </div>
          )}
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: SPACE[5], ...push }}>
          {holdings.map((h, i) => {
            const delay = d + 16 + stagger(i, 12);
            const rowP = skipIntro ? 1 : wipe(frame, { delay, dur: 20 });
            const barP = skipIntro ? 1 : wipe(frame, { delay: delay + 6, dur: 30 });
            const w = (h.valueNum / max) * barP;
            const feat = !!h.featured;
            // close-up beat: non-featured rows recede, the featured one swells.
            const rowDim = skipIntro || feat ? 1 : dimAt(frame, bFocus, 0.22, 22);
            const rowScale = skipIntro || !feat ? 1 : pulseAt(frame, bFocus + 8, 0.02, 30);
            return (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "84px 1fr 260px",
                  alignItems: "center",
                  gap: SPACE[6],
                  padding: `${SPACE[5]}px ${SPACE[6]}px`,
                  borderRadius: RADIUS.md,
                  // featured = a defined surface card (accent-tinted, uniform accent
                  // border, lifted) — not a flat translucent wash; others = ledger rows.
                  background: feat ? `linear-gradient(180deg, ${rgbaOf(t.accent, 0.13)}, ${rgbaOf(t.accent, 0.03)}), ${t.surface}` : "transparent",
                  border: feat ? `1.5px solid ${t.accent}` : "none",
                  borderBottom: feat ? `1.5px solid ${t.accent}` : `1px solid ${t.line}`,
                  boxShadow: feat ? cardShadow(t) : "none",
                  opacity: rowP * rowDim,
                  transform: `translateX(${(1 - rowP) * -20}px) scale(${rowScale})`,
                }}
              >
                <LogoBadge src={h.logo} name={h.name} theme={t} featured={feat} size={72} />

                <div style={{ display: "flex", flexDirection: "column", gap: SPACE[2] }}>
                  <div style={{ display: "flex", alignItems: "center", gap: SPACE[4] }}>
                    <span style={{ fontFamily: TYPE.sans, fontSize: TYPE.cardTitle, fontWeight: TYPE.weight.bold, color: t.ink, letterSpacing: -0.5 }}>
                      {h.name}
                    </span>
                    {feat && <Pill theme={t} filled>Largest Position</Pill>}
                  </div>
                  {/* value bar */}
                  <div style={{ height: 14, borderRadius: RADIUS.pill, background: t.line, overflow: "hidden", width: "100%" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${w * 100}%`,
                        borderRadius: RADIUS.pill,
                        background: feat ? t.accent : rgbaOf(t.ink, 0.28),
                      }}
                    />
                  </div>
                  {h.sub && <span style={{ fontFamily: TYPE.mono, fontSize: TYPE.source, letterSpacing: 0.8, textTransform: "uppercase", color: t.muted }}>{h.sub}</span>}
                </div>

                <div style={{ textAlign: "right", fontFamily: TYPE.sans, fontSize: 52, fontWeight: TYPE.weight.black, letterSpacing: -1.5, color: feat ? "#FFFFFF" : t.ink }}>
                  <AnimatedCounter value={h.value} delay={delay + 10} skip={skipIntro} frame={frame} />
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
