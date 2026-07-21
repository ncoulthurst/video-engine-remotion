/**
 * ChapterCard (A2) — the act / chapter divider.
 *
 * A numbered editorial title that sets the GROUND for the coming act: Paper for
 * "case-for" chapters, Ink for "case-against / verdict" chapters. The ground
 * choice is itself the storytelling (§1.1). Composes ChapterNumber + a serif
 * title that mask-wipes in + an accent rule that draws.
 *
 * SBF: "The Central Question" (paper) · "The Case Against" (ink) · "The Verdict" (ink).
 * Generalizes: "The Rise" / "The Fall" / "The Reckoning" in any doc.
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  Ground,
  ChapterNumber,
  SourceTag,
  RuleSweep,
  resolveTheme,
  useOutro,
  fadeUp,
  wipe,
  TITLE_FONT,
  TYPE,
  SPACE,
  baseTemplateSchema,
  type BaseTemplateProps,
} from "./kit";

export const ChapterCardPropsSchema = z.object({
  ...baseTemplateSchema,
  index: z.number().optional().default(1),
  title: z.string().optional().default("The Central Question"),
  dek: z.string().optional().default(""),
  ground: z.enum(["paper", "ink", "structure"]).optional().default("ink"),
});
export type ChapterCardProps = z.input<typeof ChapterCardPropsSchema> & BaseTemplateProps;

export const ChapterCard: React.FC<ChapterCardProps> = ({
  index = 1,
  title = "",
  dek = "",
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
      <AbsoluteFill style={{ justifyContent: "center", padding: SPACE.page }}>
        <div style={{ ...outro, display: "flex", flexDirection: "column", gap: SPACE[8] }}>
          <ChapterNumber index={index} theme={t} frame={frame} delay={d + 2} />

          {kicker && (
            <div
              style={{
                fontFamily: TYPE.mono,
                fontSize: TYPE.label,
                fontWeight: TYPE.weight.semibold,
                letterSpacing: TYPE.track,
                textTransform: "uppercase",
                color: t.muted,
                ...fadeUp(frame, { delay: d + 6, dur: 18 }),
              }}
            >
              {kicker}
            </div>
          )}

          {/* Serif title — mask-wipes up, clause by clause via a clip reveal. */}
          <div style={{ overflow: "hidden", paddingBottom: 8 }}>
            <div
              style={{
                ...TITLE_FONT,
                fontSize: 104,
                lineHeight: 1.0,
                letterSpacing: -1.5,
                color: t.ink,
                maxWidth: 1400,
                transform: `translateY(${(1 - wipe(frame, { delay: d + 6, dur: 26 })) * 118}px)`,
              }}
            >
              {title}
            </div>
          </div>

          <div style={{ width: 220 }}>
            <RuleSweep theme={t} frame={frame} delay={d + 18} accent height={4} />
          </div>

          {dek && (
            <div
              style={{
                fontFamily: TYPE.sans,
                fontSize: TYPE.sub,
                fontWeight: TYPE.weight.medium,
                lineHeight: 1.4,
                color: t.muted,
                maxWidth: 1000,
                ...fadeUp(frame, { delay: d + 24, dur: 22 }),
              }}
            >
              {dek}
            </div>
          )}
        </div>
      </AbsoluteFill>

      <SourceTag source={source} theme={t} frame={frame} delay={d + 28} />
    </Ground>
  );
};
