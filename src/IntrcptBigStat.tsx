/**
 * IntrcptBigStat — Two side-by-side stats with player image on right.
 */
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { fontFamily, serifFontFamily, Grain, PaperBackground, DarkBackground, COLORS, SmartImg } from "./shared";

export const IntrcptBigStatPropsSchema = z.object({
  stat:       z.string().default("31"),
  unit:       z.string().default("goals"),
  label:      z.string().default("in a single Premier League season"),
  stat2:      z.string().optional(),
  unit2:      z.string().optional(),
  label2:     z.string().optional(),
  context:    z.string().default("Luis Suárez · Liverpool · 2013–14"),
  playerImage:z.string().default(""),
  accentColor:z.string().default("#C8102E"),
  darkMode:   z.boolean().default(false),
  bgColor:    z.string().default("#f0ece4"),
});
export type IntrcptBigStatProps = z.infer<typeof IntrcptBigStatPropsSchema>;

export const IntrcptBigStat: React.FC<IntrcptBigStatProps> = ({
  stat, unit, label, stat2, unit2, label2, context, playerImage, accentColor, darkMode, bgColor,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p1    = spring({ frame, fps, config: { damping: 20, stiffness: 70 } });
  const p2    = spring({ frame, fps, config: { damping: 20, stiffness: 70 }, delay: 12 });
  const lProg = spring({ frame, fps, config: { damping: 28, stiffness: 55 }, delay: 18 });
  const cProg = spring({ frame, fps, config: { damping: 28, stiffness: 55 }, delay: 30 });
  const iProg = spring({ frame, fps, config: { damping: 24, stiffness: 50 }, delay: 6 });

  const textColor  = darkMode ? "#fff" : COLORS.primary;
  const mutedColor = darkMode ? "rgba(255,255,255,0.42)" : COLORS.muted;
  const hasTwo     = Boolean(stat2);

  const labelStyle = (prog: typeof lProg) => ({
    opacity:   interpolate(prog, [0, 0.6], [0, 1], { extrapolateRight: "clamp" }),
    transform: `translateY(${interpolate(prog, [0, 1], [12, 0])}px)`,
  });

  const StatBlock: React.FC<{ s: string; u?: string; l?: string; prog: number }> = ({ s, u, l, prog }) => (
    <div style={{
      opacity:         prog,
      transform:       `scale(${interpolate(prog, [0, 1], [0.6, 1])}) translateY(${interpolate(prog, [0, 1], [40, 0])}px)`,
      transformOrigin: "left bottom",
    }}>
      <div style={{
        fontFamily: serifFontFamily, fontSize: 160, fontWeight: 900,
        color: accentColor, letterSpacing: -8, lineHeight: 0.85,
      }}>{s}</div>
      {u && (
        <div style={{
          fontFamily: serifFontFamily, fontSize: 44, fontWeight: 900,
          color: textColor, letterSpacing: -1, lineHeight: 1, marginTop: 14,
          ...labelStyle(lProg),
        }}>{u}</div>
      )}
      {l && (
        <div style={{
          fontFamily, fontSize: 16, fontWeight: 400, color: mutedColor,
          letterSpacing: 0.3, marginTop: 10, maxWidth: 340,
          ...labelStyle(lProg),
        }}>{l}</div>
      )}
    </div>
  );

  return (
    <AbsoluteFill>
      {darkMode ? <DarkBackground color={bgColor} /> : <PaperBackground color={bgColor} />}

      {playerImage && (
        <div style={{
          position: "absolute", right: 0, top: 0, bottom: 0, width: 900,
          opacity:   interpolate(iProg, [0, 1], [0, 0.75], { extrapolateRight: "clamp" }),
          transform: `translateX(${interpolate(iProg, [0, 1], [100, 0])}px)`,
          WebkitMaskImage: "linear-gradient(to right, transparent, black 350px, black 85%, transparent)",
          maskImage:       "linear-gradient(to right, transparent, black 350px, black 85%, transparent)",
          zIndex: 1,
        }}>
          <SmartImg src={playerImage} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center", filter: "contrast(1.05) brightness(1.05)" }} />
        </div>
      )}

      <div style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none" }}><Grain /></div>

      <div style={{
        position: "absolute", inset: 0, zIndex: 10,
        display: "flex", flexDirection: "column", justifyContent: "center",
        paddingLeft: 120, maxWidth: playerImage ? 1100 : 1700,
      }}>
        {/* Accent bar */}
        <div style={{
          width:           interpolate(p1, [0, 1], [0, 60], { extrapolateRight: "clamp" }),
          height:          4,
          backgroundColor: accentColor,
          borderRadius:    2,
          marginBottom:    40,
        }} />

        {/* Stats row */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: hasTwo ? 64 : 0 }}>
          <StatBlock s={stat} u={unit} l={label} prog={p1} />

          {hasTwo && (
            <>
              <div style={{
                width:           1,
                alignSelf:       "stretch",
                marginBottom:    8,
                backgroundColor: darkMode ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.10)",
                opacity:         interpolate(p2, [0, 0.5], [0, 1], { extrapolateRight: "clamp" }),
              }} />
              <StatBlock s={stat2!} u={unit2} l={label2} prog={p2} />
            </>
          )}
        </div>

        {/* Context line */}
        {context && (
          <div style={{
            fontFamily, fontSize: 13, fontWeight: 700, color: mutedColor,
            letterSpacing: 2.5, textTransform: "uppercase", marginTop: 40,
            opacity: interpolate(cProg, [0, 0.6], [0, 1], { extrapolateRight: "clamp" }),
          }}>{context}</div>
        )}
      </div>
    </AbsoluteFill>
  );
};
