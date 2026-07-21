/**
 * FundingRounds (G5) — a startup's raise history as a valuation ladder.
 *
 * Rounds climb a stepped ladder (seed → A → B…), each rung a card with stage /
 * date / amount / valuation and lead-investor chips. Valuations count up; the
 * featured round takes the accent. On Structure ground.
 *
 * SBF: "FTX and Alameda led a $500M round into Anthropic, ~$5B valuation".
 * Generalizes: OpenAI, WeWork — any startup doc.
 */
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  Ground,
  SectionTitle,
  Pill,
  AnimatedCounter,
  SourceTag,
  resolveTheme,
  useOutro,
  wipe,
  scaleSettle,
  stagger,
  rgbaOf,
  TYPE,
  SPACE,
  RADIUS,
  cardShadow,
  baseTemplateSchema,
  type BaseTemplateProps,
} from "./kit";

const RoundSchema = z.object({
  stage: z.string(),
  date: z.string(),
  amount: z.string(),
  valuation: z.string(),
  leads: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
});

export const FundingRoundsPropsSchema = z.object({
  ...baseTemplateSchema,
  company: z.string().optional().default("Anthropic"),
  rounds: z.array(RoundSchema).optional().default([
    { stage: "Series A", date: "2021", amount: "$124M", valuation: "$1.0B", leads: ["Jaan Tallinn"] },
    { stage: "Series B", date: "2022", amount: "$580M", valuation: "$5.0B", leads: ["FTX / Alameda"], featured: true },
    { stage: "Google", date: "2023", amount: "$2.0B", valuation: "$25B", leads: ["Google"] },
    { stage: "Amazon", date: "2024", amount: "$4.0B", valuation: "$60B+", leads: ["Amazon"] },
  ]),
  ground: z.enum(["paper", "ink", "structure"]).optional().default("structure"),
});
export type FundingRoundsProps = z.input<typeof FundingRoundsPropsSchema> & BaseTemplateProps;

export const FundingRounds: React.FC<FundingRoundsProps> = ({
  company = "",
  rounds = [],
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
    <Ground ground={ground} accentColor={accentColor} skipIntro={skipIntro}>
      <div style={{ height: "100%", display: "flex", flexDirection: "column", gap: SPACE[10], ...outro }}>
        <SectionTitle title={`${company} — funding ladder`} kicker={kicker ?? "The Raise"} theme={t} frame={frame} delay={d} />

        {/* Vertical timeline: each round a card on a rail, dotted lines connecting them. */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", maxWidth: 1240 }}>
          {rounds.map((r, i) => {
            const delay = d + 14 + stagger(i, 10);
            const p = skipIntro ? 1 : wipe(frame, { delay, dur: 22 });
            const dotP = skipIntro ? 1 : scaleSettle(frame, { delay, dur: 14, from: 0.3 });
            const feat = !!r.featured;
            const last = i === rounds.length - 1;
            return (
              <div key={i} style={{ display: "flex", gap: SPACE[6], alignItems: "stretch" }}>
                {/* rail — node dot + dotted connector down to the next card */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 36, flexShrink: 0 }}>
                  <div
                    style={{
                      width: feat ? 22 : 15,
                      height: feat ? 22 : 15,
                      borderRadius: "50%",
                      background: feat ? t.accent : t.surface,
                      border: `3px solid ${feat ? t.accent : rgbaOf(t.ink, 0.4)}`,
                      marginTop: 30,
                      boxShadow: feat ? `0 0 0 6px ${rgbaOf(t.accent, 0.14)}` : "none",
                      transform: `scale(${dotP})`,
                      flexShrink: 0,
                    }}
                  />
                  {!last && <div style={{ flex: 1, width: 0, borderLeft: `3px dotted ${rgbaOf(t.ink, 0.34)}`, margin: "8px 0", opacity: p }} />}
                </div>

                {/* card */}
                <div
                  style={{
                    flex: 1,
                    marginBottom: last ? 0 : SPACE[5],
                    background: feat ? `linear-gradient(180deg, ${rgbaOf(t.accent, 0.11)}, ${rgbaOf(t.accent, 0.02)}), ${t.surface}` : t.surface,
                    border: `1.5px solid ${feat ? t.accent : rgbaOf(t.ink, 0.22)}`,
                    borderRadius: RADIUS.lg,
                    boxShadow: `inset 0 1px 0 rgba(255,247,238,0.08), ${cardShadow(t)}`,
                    padding: `${SPACE[6]}px ${SPACE[8]}px`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: SPACE[8],
                    opacity: p,
                    transform: `translateX(${(1 - p) * 24}px)`,
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: SPACE[2] }}>
                    <span style={{ fontFamily: TYPE.mono, fontSize: TYPE.source, letterSpacing: 1.6, textTransform: "uppercase", color: feat ? t.accent : t.muted }}>
                      {r.stage} · {r.date}
                    </span>
                    <span style={{ fontFamily: TYPE.sans, fontSize: 52, fontWeight: TYPE.weight.black, letterSpacing: -1.5, lineHeight: 1, color: t.ink }}>
                      <AnimatedCounter value={r.amount} delay={delay + 6} skip={skipIntro} frame={frame} />
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: SPACE[3] }}>
                    <span style={{ fontFamily: TYPE.sans, fontSize: TYPE.sub, color: t.muted }}>
                      at <b style={{ color: "#FFFFFF", fontWeight: TYPE.weight.bold }}>{r.valuation}</b> valuation
                    </span>
                    {r.leads && r.leads.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "flex-end", gap: SPACE[2] }}>
                        {r.leads.map((l, k) => (
                          <Pill key={k} theme={t} accent={feat}>{l}</Pill>
                        ))}
                      </div>
                    )}
                  </div>
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
