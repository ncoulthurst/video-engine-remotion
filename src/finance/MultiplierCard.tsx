/**
 * MultiplierCard (C4) — dramatize a return as a single multiple ("2,600×").
 *
 * Editorial, left-weighted, three beats (§1A Investment → Outcome → Reflection):
 *   1. Context   — the from → to resolves quietly (where it started, where it ended).
 *   2. Payoff    — the multiple rises out of a mask as the hero, accent, huge, with
 *                  a ghosted echo of itself bleeding off the frame for depth.
 *   3. Reflection— the label settles; the scene rests.
 *
 * SBF: SOL $0.10 → $260 (≈2,600×). Generalizes: Nvidia's run, Buffett's
 * compounding, a wipeout (−98%).
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  Ground,
  Kicker,
  HeroNumber,
  AnimatedCounter,
  SourceTag,
  resolveTheme,
  useOutro,
  fadeUp,
  wipe,
  TYPE,
  SPACE,
  baseTemplateSchema,
  type BaseTemplateProps,
} from "./kit";

export const MultiplierCardPropsSchema = z.object({
  ...baseTemplateSchema,
  multiple: z.string().optional().default("2,600×"),
  from: z.string().optional().default("$0.10"),
  to: z.string().optional().default("$260"),
  label: z.string().optional().default("Solana — from Alameda's 2020 entry to the 2021 peak."),
  direction: z.enum(["up", "down"]).optional().default("up"),
  ground: z.enum(["paper", "ink", "structure"]).optional().default("paper"),
});
export type MultiplierCardProps = z.input<typeof MultiplierCardPropsSchema> & BaseTemplateProps;

export const MultiplierCard: React.FC<MultiplierCardProps> = ({
  multiple = "",
  from = "",
  to = "",
  label = "",
  direction = "up",
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
  const cleanMult = multiple.replace(/^-/, "");

  return (
    <Ground ground={ground} accentColor={accentColor} skipIntro={skipIntro} focus={{ x: 0.3, y: 0.5 }}>
      <AbsoluteFill style={{ padding: SPACE.page, justifyContent: "center", ...outro }}>
        <div style={{ maxWidth: 1250 }}>
          <Kicker label={kicker ?? "Return"} theme={t} frame={frame} delay={d} />

          {/* Beat 1 — context: from → to */}
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: SPACE[5],
              marginTop: SPACE[6],
              marginBottom: SPACE[4],
              fontFamily: TYPE.sans,
              fontSize: 54,
              fontWeight: TYPE.weight.semibold,
              color: t.muted,
              ...fadeUp(frame, { delay: d + 6, dur: 20 }),
            }}
          >
            <AnimatedCounter value={from} delay={d + 8} skip={skipIntro} frame={frame} />
            <span style={{ color: t.accent, fontSize: 40, opacity: wipe(frame, { delay: d + 16, dur: 14 }) }}>→</span>
            <AnimatedCounter value={to} delay={d + 16} skip={skipIntro} frame={frame} style={{ color: t.ink }} />
          </div>

          {/* Beat 2 — the payoff */}
          <HeroNumber
            value={cleanMult}
            theme={t}
            frame={frame}
            delay={d + 30}
            skip={skipIntro}
            size={direction === "down" ? 300 : 320}
            underline
            label={label}
          />
        </div>
      </AbsoluteFill>
      <SourceTag source={source} theme={t} frame={frame} delay={d + 52} />
    </Ground>
  );
};
