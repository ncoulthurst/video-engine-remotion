/**
 * SentenceCard (I2) — the sentence as a single grim figure ("25 YEARS").
 *
 * The term slams in (scale-settle, no bounce) on the Ink ground; date + defendant
 * fade beneath. The sentencing beat.
 *
 * SBF: "March 28, 2024. The sentence: 25 years." Generalizes: any sentencing beat.
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  Ground,
  Kicker,
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

export const SentenceCardPropsSchema = z.object({
  ...baseTemplateSchema,
  term: z.string().optional().default("25 Years"),
  defendant: z.string().optional().default("Sam Bankman-Fried"),
  date: z.string().optional().default("March 28, 2024"),
  note: z.string().optional().default("Plus forfeiture of $11 billion."),
  ground: z.enum(["paper", "ink", "structure"]).optional().default("ink"),
});
export type SentenceCardProps = z.input<typeof SentenceCardPropsSchema> & BaseTemplateProps;

export const SentenceCard: React.FC<SentenceCardProps> = ({
  term = "",
  defendant = "",
  date = "",
  note = "",
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
  const termRise = skipIntro ? 1 : wipe(frame, { delay: d + 10, dur: 26 });

  return (
    <Ground ground={ground} accentColor={accentColor} skipIntro={skipIntro}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: SPACE.page, textAlign: "center" }}>
        <div style={{ ...outro, display: "flex", flexDirection: "column", alignItems: "center", gap: SPACE[6] }}>
          <Kicker label={kicker ?? "The Sentence"} theme={t} frame={frame} delay={d} align="center" />

          {/* rises out of a mask — the system's hero-figure reveal (matches HeroNumber /
              SectionTitle), not a scale-slam. */}
          <div style={{ overflow: "hidden", paddingBottom: 20 }}>
            <div
              style={{
                fontFamily: TYPE.sans,
                fontSize: 260,
                fontWeight: TYPE.weight.black,
                letterSpacing: -8,
                lineHeight: 0.86,
                color: t.accent,
                transform: `translateY(${(1 - termRise) * 260}px)`,
              }}
            >
              {term}
            </div>
          </div>

          <div style={{ fontFamily: TYPE.mono, fontSize: TYPE.sub, letterSpacing: 2, textTransform: "uppercase", color: t.ink, ...fadeUp(frame, { delay: d + 26, dur: 20 }) }}>
            {defendant} · {date}
          </div>

          {note && (
            <div style={{ fontFamily: TYPE.sans, fontSize: TYPE.body + 2, color: t.muted, ...fadeUp(frame, { delay: d + 32, dur: 20 }) }}>{note}</div>
          )}
        </div>
      </AbsoluteFill>
      <SourceTag source={source} theme={t} frame={frame} delay={d + 36} />
    </Ground>
  );
};
