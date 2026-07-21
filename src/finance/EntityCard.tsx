/**
 * EntityCard (B3) — introduce a company / fund / token.
 *
 * Logo (or monogram) + name, a meta grid (founded / HQ), a one-liner, and one
 * accent key metric that counts up. Sits on the structure tint by default; Ink for
 * a fraudulent / failed entity. The "a company enters the story" beat.
 *
 * SBF: "Alameda Research was founded in 2017…" · "Then came Anthropic…".
 * Generalizes: Nvidia, Enron, WeWork — any company doc.
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  Ground,
  Kicker,
  LogoBadge,
  AnimatedCounter,
  RuleSweep,
  SourceTag,
  resolveTheme,
  useOutro,
  fadeUp,
  stagger,
  TITLE_FONT,
  TYPE,
  SPACE,
  baseTemplateSchema,
  type BaseTemplateProps,
} from "./kit";

const MetaSchema = z.object({ label: z.string(), value: z.string() });

export const EntityCardPropsSchema = z.object({
  ...baseTemplateSchema,
  name: z.string().optional().default("Alameda Research"),
  logo: z.string().optional().default(""),
  oneLiner: z.string().optional().default("Quant trading firm — the sister fund whose losses sank FTX."),
  meta: z.array(MetaSchema).optional().default([
    { label: "Founded", value: "2017" },
    { label: "HQ", value: "Hong Kong / Bahamas" },
    { label: "Sector", value: "Crypto trading" },
  ]),
  statValue: z.string().optional().default("$14.6B"),
  statLabel: z.string().optional().default("Assets at peak"),
  ground: z.enum(["paper", "ink", "structure"]).optional().default("structure"),
});
export type EntityCardProps = z.input<typeof EntityCardPropsSchema> & BaseTemplateProps;

export const EntityCard: React.FC<EntityCardProps> = ({
  name = "",
  logo = "",
  oneLiner = "",
  meta = [],
  statValue = "",
  statLabel = "",
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
      <AbsoluteFill style={{ justifyContent: "center", padding: SPACE.page }}>
        <div style={{ display: "flex", flexDirection: "column", gap: SPACE[10], maxWidth: 1400, ...outro }}>
          <Kicker label={kicker ?? "The Entity"} theme={t} frame={frame} delay={d} />

          {/* header: logo + name */}
          <div style={{ display: "flex", alignItems: "center", gap: SPACE[6], ...fadeUp(frame, { delay: d + 4, dur: 22 }) }}>
            <LogoBadge src={logo} name={name} theme={t} featured size={120} />
            <div style={{ ...TITLE_FONT, fontSize: 88, letterSpacing: -2.5, color: t.ink, lineHeight: 0.98 }}>{name}</div>
          </div>

          {oneLiner && (
            <div style={{ fontFamily: TYPE.sans, fontSize: TYPE.sub + 2, fontWeight: TYPE.weight.medium, lineHeight: 1.4, color: t.muted, maxWidth: 1000, ...fadeUp(frame, { delay: d + 10, dur: 22 }) }}>
              {oneLiner}
            </div>
          )}

          <RuleSweep theme={t} frame={frame} delay={d + 14} />

          {/* meta grid + key stat */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: SPACE[10] }}>
            <div style={{ display: "flex", gap: SPACE[16] }}>
              {meta.map((m, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: SPACE[2], ...fadeUp(frame, { delay: d + 18 + stagger(i, 6), dur: 20 }) }}>
                  <span style={{ fontFamily: TYPE.mono, fontSize: TYPE.source, letterSpacing: 1.6, textTransform: "uppercase", color: t.muted }}>{m.label}</span>
                  <span style={{ fontFamily: TYPE.sans, fontSize: TYPE.cardTitle, fontWeight: TYPE.weight.bold, color: t.ink }}>{m.value}</span>
                </div>
              ))}
            </div>

            {statValue && (
              <div style={{ textAlign: "right", ...fadeUp(frame, { delay: d + 26, dur: 22 }) }}>
                <div style={{ fontFamily: TYPE.sans, fontSize: 92, fontWeight: TYPE.weight.black, letterSpacing: -2.5, color: t.accent, lineHeight: 1 }}>
                  <AnimatedCounter value={statValue} delay={d + 30} skip={skipIntro} frame={frame} />
                </div>
                <div style={{ fontFamily: TYPE.mono, fontSize: TYPE.label, letterSpacing: 1.6, textTransform: "uppercase", color: t.muted, marginTop: SPACE[2] }}>{statLabel}</div>
              </div>
            )}
          </div>
        </div>
      </AbsoluteFill>
      <SourceTag source={source} theme={t} frame={frame} delay={d + 36} />
    </Ground>
  );
};
