/**
 * Track E — PortraitStatHero
 *
 * Full-bleed portrait left half, single big stat + caption right half.
 * Hybrid composition that breaks up data-heavy stretches with human imagery.
 * Paper-world by default.
 */
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import {
  fontFamily,
  serifFontFamily,
  COLORS,
  PaperBackground,
  RuleLine,
  WorldStateSchema,
} from "./shared";
import { EditorialPortrait } from "./lib/EditorialPortrait";

export const PortraitStatHeroPropsSchema = z.object({
  playerName: z.string().optional().default(""),
  playerImage: z.string().optional().default(""),
  stat: z.string().optional().default("31"),
  unit: z.string().optional().default("goals"),
  caption: z.string().optional().default("in a single Premier League season"),
  context: z.string().optional().default(""),
  accentColor: z.string().optional().default("#C8102E"),
  bgColor: z.string().optional().default("#f0ece4"),
  skipIntro: z.boolean().optional().default(false),
  worldState: WorldStateSchema.optional(),
});
export type PortraitStatHeroProps = z.infer<typeof PortraitStatHeroPropsSchema>;

export const PortraitStatHero: React.FC<PortraitStatHeroProps> = ({
  playerName,
  playerImage,
  stat,
  unit,
  caption,
  context,
  accentColor = "#C8102E",
  bgColor = "#f0ece4",
  skipIntro = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const portraitProg = skipIntro ? 1 : spring({ frame, fps, config: { damping: 24, stiffness: 50 } });
  const statProg     = skipIntro ? 1 : spring({ frame: frame - 12, fps, config: { damping: 28, stiffness: 60 } });
  const capProg      = skipIntro ? 1 : spring({ frame: frame - 24, fps, config: { damping: 28, stiffness: 60 } });

  return (
    <AbsoluteFill style={{ fontFamily }}>
      <PaperBackground color={bgColor} />

      {/* Portrait — left half */}
      <div style={{
        position: "absolute",
        left: 0, top: 0, bottom: 0, width: "50%",
        opacity: portraitProg,
        transform: `translateX(${interpolate(portraitProg, [0, 1], [-40, 0])}px)`,
        WebkitMaskImage: "linear-gradient(to right, black 70%, transparent)",
        maskImage:       "linear-gradient(to right, black 70%, transparent)",
      }}>
        {/* H-2: never a raw photo — grade + offset silhouette via EditorialPortrait */}
        <EditorialPortrait
          src={playerImage}
          accent={accentColor}
          style={{ width: "100%", height: "100%" }}
        />
      </div>

      {/* Stat block — right half */}
      <div style={{
        position: "absolute",
        right: 80, top: "50%", width: "45%",
        transform: `translateY(-50%)`,
        opacity: statProg,
      }}>
        {playerName && (
          <div style={{
            fontFamily, fontSize: 36, fontWeight: 600,
            color: COLORS.muted, letterSpacing: "0.08em",
            textTransform: "uppercase", marginBottom: 24,
          }}>{playerName}</div>
        )}
        <div style={{
          fontFamily: serifFontFamily, fontWeight: 900,
          fontSize: 360, lineHeight: 0.9, color: accentColor,
          transform: `translateY(${interpolate(statProg, [0, 1], [40, 0])}px)`,
        }}>{stat}</div>
        <div style={{
          fontFamily, fontSize: 56, fontWeight: 700,
          color: COLORS.primary, marginTop: 12,
          opacity: capProg,
        }}>{unit}</div>
        <RuleLine color={accentColor} progress={capProg} />
        <div style={{
          fontFamily, fontSize: 32, color: COLORS.secondary,
          marginTop: 24, lineHeight: 1.35,
          opacity: capProg,
        }}>{caption}</div>
        {context && (
          <div style={{
            fontFamily, fontSize: 24, color: COLORS.muted,
            marginTop: 12, fontStyle: "italic",
            opacity: capProg,
          }}>{context}</div>
        )}
      </div>
    </AbsoluteFill>
  );
};
