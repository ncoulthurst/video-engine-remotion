/**
 * Track E — PortraitWithBars
 *
 * Masked portrait top, 3 stat bars beneath. Hybrid composition for
 * dense data sections that still need a human anchor.
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

const BarSchema = z.object({
  label: z.string(),
  value: z.number(),
  unit: z.string().optional().default(""),
  max:  z.number().optional(),
});

export const PortraitWithBarsPropsSchema = z.object({
  playerName: z.string().optional().default(""),
  playerImage: z.string().optional().default(""),
  title: z.string().optional().default(""),
  bars: z.array(BarSchema).optional().default([
    { label: "Goals", value: 31, unit: "", max: 40 },
    { label: "Assists", value: 12, unit: "", max: 40 },
    { label: "G+A / 90", value: 1.27, unit: "", max: 2 },
  ]),
  accentColor: z.string().optional().default("#C8102E"),
  bgColor: z.string().optional().default("#f0ece4"),
  skipIntro: z.boolean().optional().default(false),
  worldState: WorldStateSchema.optional(),
});
export type PortraitWithBarsProps = z.infer<typeof PortraitWithBarsPropsSchema>;

export const PortraitWithBars: React.FC<PortraitWithBarsProps> = ({
  playerName,
  playerImage,
  title,
  bars,
  accentColor = "#C8102E",
  bgColor = "#f0ece4",
  skipIntro = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const portraitProg = skipIntro ? 1 : spring({ frame, fps, config: { damping: 22, stiffness: 50 } });
  const titleProg    = skipIntro ? 1 : spring({ frame: frame - 8, fps, config: { damping: 28, stiffness: 60 } });

  return (
    <AbsoluteFill style={{ fontFamily, padding: 80 }}>
      <PaperBackground color={bgColor} />

      {/* Top: masked portrait band */}
      <div style={{
        position: "relative", height: 540, marginBottom: 40,
        opacity: portraitProg,
      }}>
        <div style={{
          position: "absolute", inset: 0,
          WebkitMaskImage: "radial-gradient(ellipse 70% 95% at 50% 30%, black 55%, transparent)",
          maskImage:       "radial-gradient(ellipse 70% 95% at 50% 30%, black 55%, transparent)",
        }}>
          {/* H-2: never a raw photo — grade via EditorialPortrait (the ellipse
              mask above vignettes the crop; offset stroke off — the mask would
              clip an offset silhouette awkwardly) */}
          <EditorialPortrait
            src={playerImage}
            accent={accentColor}
            offsetStroke={false}
            style={{ width: "100%", height: "100%" }}
          />
        </div>
        {playerName && (
          <div style={{
            position: "absolute", bottom: 24, left: 0, right: 0, textAlign: "center",
            fontFamily: serifFontFamily, fontWeight: 900, fontSize: 88,
            color: COLORS.primary, letterSpacing: "-0.01em",
            textShadow: "0 2px 24px rgba(255,255,255,0.6)",
          }}>{playerName}</div>
        )}
      </div>

      {title && (
        <div style={{
          fontFamily, fontSize: 36, fontWeight: 600,
          color: COLORS.muted, letterSpacing: "0.08em",
          textTransform: "uppercase", marginBottom: 16,
          opacity: titleProg,
        }}>{title}</div>
      )}
      <RuleLine color={accentColor} progress={titleProg} />

      {/* Bars */}
      <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 28 }}>
        {bars.map((bar, i) => {
          const delay = 18 + i * 8;
          const barProg = skipIntro ? 1 : spring({ frame: frame - delay, fps, config: { damping: 22, stiffness: 50 } });
          const max = bar.max ?? Math.max(1, bar.value * 1.15);
          const fillPct = Math.min(1, bar.value / max) * 100;
          return (
            <div key={i} style={{ opacity: barProg }}>
              <div style={{
                display: "flex", justifyContent: "space-between",
                fontFamily, fontSize: 28, fontWeight: 600,
                color: COLORS.primary, marginBottom: 8,
              }}>
                <span>{bar.label}</span>
                <span style={{ color: accentColor }}>
                  {bar.value}{bar.unit && ` ${bar.unit}`}
                </span>
              </div>
              <div style={{
                position: "relative", height: 18,
                background: "rgba(0,0,0,0.06)", borderRadius: 4, overflow: "hidden",
              }}>
                <div style={{
                  position: "absolute", left: 0, top: 0, bottom: 0,
                  width: `${fillPct * barProg}%`,
                  background: accentColor,
                  borderRadius: 4,
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
