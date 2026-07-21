/**
 * StakeCard (G2) — a single holding in detail. "The trade that made them."
 *
 * Logo + name header, an entry → current row (date / price / amount), a big
 * multiple that pops in the accent, and a one-line thesis. Zooms into one
 * investment inside a portfolio.
 *
 * SBF: the Solana stake ($10M @ $0.10 → billions); the Anthropic stake.
 * Generalizes: any "the trade that made them" beat.
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  Ground,
  Kicker,
  LogoBadge,
  AnimatedCounter,
  DeltaChip,
  SourceTag,
  resolveTheme,
  useOutro,
  fadeUp,
  wipe,
  TITLE_FONT,
  TYPE,
  SPACE,
  RADIUS,
  cardShadow,
  type Theme,
  baseTemplateSchema,
  type BaseTemplateProps,
} from "./kit";

export const StakeCardPropsSchema = z.object({
  ...baseTemplateSchema,
  name: z.string().optional().default("Solana (SOL)"),
  logo: z.string().optional().default(""),
  entryDate: z.string().optional().default("2020"),
  entryPrice: z.string().optional().default("$0.10"),
  entryAmount: z.string().optional().default("$10M invested"),
  currentDate: z.string().optional().default("Nov 2021 peak"),
  currentValue: z.string().optional().default("$1.1B"),
  multiple: z.string().optional().default("2,600×"),
  direction: z.enum(["up", "down"]).optional().default("up"),
  thesis: z.string().optional().default("Backed at the token's earliest, unproven stage — then promoted publicly."),
  ground: z.enum(["paper", "ink", "structure"]).optional().default("paper"),
});
export type StakeCardProps = z.input<typeof StakeCardPropsSchema> & BaseTemplateProps;

const Leg: React.FC<{ tag: string; date: string; big: React.ReactNode; sub: string; theme: Theme; frame: number; delay: number; accent?: boolean; skip?: boolean }> = ({
  tag,
  date,
  big,
  sub,
  theme,
  frame,
  delay,
  accent,
  skip,
}) => (
  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: SPACE[2], ...fadeUp(frame, { delay, dur: 22 }) }}>
    <span style={{ fontFamily: TYPE.mono, fontSize: TYPE.source, letterSpacing: 1.6, textTransform: "uppercase", color: theme.muted }}>{tag} · {date}</span>
    <span style={{ fontFamily: TYPE.sans, fontSize: 76, fontWeight: TYPE.weight.black, letterSpacing: -2, color: accent ? theme.accent : theme.ink, lineHeight: 1 }}>{big}</span>
    <span style={{ fontFamily: TYPE.sans, fontSize: TYPE.body, color: theme.muted }}>{sub}</span>
  </div>
);

export const StakeCard: React.FC<StakeCardProps> = ({
  name = "",
  logo = "",
  entryDate = "",
  entryPrice = "",
  entryAmount = "",
  currentDate = "",
  currentValue = "",
  multiple = "",
  direction = "up",
  thesis = "",
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
  // White card (matches SocialPost): dark ink on white, floating on the grainy ground.
  const CARD_BG = "#FFFFFF";
  const CARD_INK = "#15202B";
  const CARD_MUTED = "#536471";
  const CARD_LINE = "rgba(0,0,0,0.10)";
  const ct: Theme = { ...t, ink: CARD_INK, muted: CARD_MUTED, line: CARD_LINE };

  return (
    <Ground ground={ground} accentColor={accentColor} skipIntro={skipIntro}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: SPACE.page }}>
        <div style={{ width: "100%", maxWidth: 1360, ...outro }}>
          <div style={{ marginBottom: SPACE[6] }}>
            <Kicker label={kicker ?? "The Position"} theme={t} frame={frame} delay={d} />
          </div>

          <div
            style={{
              background: CARD_BG,
              border: `1px solid ${CARD_LINE}`,
              borderRadius: RADIUS.lg,
              boxShadow: cardShadow(t),
              padding: SPACE[12],
              opacity: wipe(frame, { delay: d + 2, dur: 22 }),
            }}
          >
            {/* header */}
            <div style={{ display: "flex", alignItems: "center", gap: SPACE[5], marginBottom: SPACE[10] }}>
              <LogoBadge src={logo} name={name} theme={t} featured size={88} />
              <span style={{ ...TITLE_FONT, fontSize: 60, letterSpacing: -1.8, color: CARD_INK }}>{name}</span>
            </div>

            {/* entry → current */}
            <div style={{ display: "flex", alignItems: "center", gap: SPACE[8] }}>
              <Leg tag="Entry" date={entryDate} big={<AnimatedCounter value={entryPrice} delay={d + 10} skip={skipIntro} frame={frame} />} sub={entryAmount} theme={ct} frame={frame} delay={d + 8} skip={skipIntro} />
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: SPACE[3] }}>
                <span style={{ fontFamily: TYPE.sans, fontSize: 48, color: CARD_MUTED, opacity: wipe(frame, { delay: d + 16, dur: 12 }) }}>→</span>
                <DeltaChip value={multiple} direction={direction} theme={t} frame={frame} delay={d + 24} />
              </div>
              <Leg tag="Value" date={currentDate} big={<AnimatedCounter value={currentValue} delay={d + 18} skip={skipIntro} frame={frame} />} sub="on paper" theme={ct} frame={frame} delay={d + 16} accent skip={skipIntro} />
            </div>

            {thesis && (
              <div style={{ marginTop: SPACE[10], paddingTop: SPACE[6], borderTop: `1px solid ${CARD_LINE}`, fontFamily: TYPE.sans, fontSize: TYPE.sub, fontWeight: TYPE.weight.medium, lineHeight: 1.4, color: CARD_MUTED, ...fadeUp(frame, { delay: d + 30, dur: 22 }) }}>
                {thesis}
              </div>
            )}
          </div>
        </div>
      </AbsoluteFill>
      <SourceTag source={source} theme={t} frame={frame} delay={d + 36} />
    </Ground>
  );
};
