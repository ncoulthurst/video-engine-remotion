/**
 * DateStamp (D3) — punctuate a single pivotal date.
 *
 * When a narration sentence *is* a date ("November 11, 2022."), this lands it as
 * a giant mono date whose characters resolve in, with a one-line label beneath.
 * Ink for grim hinge dates (collapse, verdict); Paper for neutral.
 *
 * SBF: "November 11, 2022. FTX declared bankruptcy" · "November 2, 2023 … guilty"
 * · "March 28, 2024. 25 years." Generalizes: every doc has hinge dates.
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
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

export const DateStampPropsSchema = z.object({
  ...baseTemplateSchema,
  date: z.string().optional().default("November 11, 2022"),
  label: z.string().optional().default("FTX and Alameda declared bankruptcy"),
  ground: z.enum(["paper", "ink", "structure"]).optional().default("ink"),
});
export type DateStampProps = z.input<typeof DateStampPropsSchema> & BaseTemplateProps;

export const DateStamp: React.FC<DateStampProps> = ({
  date = "",
  label = "",
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

  // Resolve the date character-by-character (mono "typewriter settle").
  const chars = date.split("");
  const revealed = skipIntro ? chars.length : Math.floor(wipe(frame, { delay: d + 6, dur: 26 }) * chars.length);

  return (
    <Ground ground={ground} accentColor={accentColor} skipIntro={skipIntro}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: SPACE.page, textAlign: "center" }}>
        <div style={{ ...outro, display: "flex", flexDirection: "column", alignItems: "center", gap: SPACE[8] }}>
          <Kicker label={kicker ?? "The Date"} theme={t} frame={frame} delay={d + 2} align="center" />

          <div
            style={{
              fontFamily: TYPE.mono,
              fontSize: 130,
              fontWeight: TYPE.weight.semibold,
              letterSpacing: -2,
              color: t.ink,
              lineHeight: 1,
            }}
          >
            {chars.map((c, i) => (
              <span key={i} style={{ opacity: i < revealed ? 1 : 0 }}>
                {c}
              </span>
            ))}
            <span
              style={{
                display: "inline-block",
                width: 8,
                height: 96,
                marginLeft: 10,
                background: t.accent,
                transform: `translateY(14px) scaleY(${revealed >= chars.length ? interpolate(frame % 40, [0, 20, 40], [1, 0.2, 1]) : 1})`,
                opacity: revealed >= chars.length ? 1 : 0.9,
              }}
            />
          </div>

          {label && (
            <div
              style={{
                fontFamily: TYPE.sans,
                fontSize: TYPE.sub + 4,
                fontWeight: TYPE.weight.medium,
                lineHeight: 1.35,
                color: t.muted,
                maxWidth: 1100,
                ...fadeUp(frame, { delay: d + 30, dur: 22 }),
              }}
            >
              {label}
            </div>
          )}
        </div>
      </AbsoluteFill>
      <SourceTag source={source} theme={t} frame={frame} delay={d + 34} />
    </Ground>
  );
};
