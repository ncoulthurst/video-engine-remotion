/**
 * LowerThirdCard (B2) — name / role caption over archival footage.
 *
 * A transparent overlay composition (the only template with no Ground of its own —
 * it composites onto a clip). Reuses the shared <LowerThird> primitive, adds a soft
 * bottom scrim so the caption stays legible over any footage.
 *
 * SBF: over "Archival footage of SBF at conferences". Generalizes: every
 * interview / archival clip in every doc (Ellison, Wang, prosecutors, Buffett…).
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { LowerThird, resolveTheme, useOutro, SPACE, baseTemplateSchema, type BaseTemplateProps } from "./kit";

export const LowerThirdCardPropsSchema = z.object({
  ...baseTemplateSchema,
  name: z.string().optional().default("Sam Bankman-Fried"),
  role: z.string().optional().default("Founder, FTX & Alameda Research"),
  align: z.enum(["left", "right"]).optional().default("left"),
  scrim: z.boolean().optional().default(true),
});
export type LowerThirdCardProps = z.input<typeof LowerThirdCardPropsSchema> & BaseTemplateProps;

export const LowerThirdCard: React.FC<LowerThirdCardProps> = ({
  name = "",
  role = "",
  align = "left",
  scrim = true,
  accentColor,
  animateOut,
}) => {
  const frame = useCurrentFrame();
  // Lower thirds sit over footage → always the ink theme (cream text + accent tick).
  const t = resolveTheme("ink", accentColor);
  const outro = useOutro(animateOut);

  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: align === "right" ? "flex-end" : "flex-start" }}>
      {scrim && (
        <AbsoluteFill
          style={{
            pointerEvents: "none",
            background:
              "linear-gradient(0deg, rgba(10,8,6,0.72) 0%, rgba(10,8,6,0.34) 14%, rgba(10,8,6,0) 30%)",
          }}
        />
      )}
      <div style={{ position: "relative", padding: `${SPACE[20]}px ${SPACE.page}px`, ...outro }}>
        <LowerThird name={name} role={role} theme={t} frame={frame} delay={4} align={align} />
      </div>
    </AbsoluteFill>
  );
};
