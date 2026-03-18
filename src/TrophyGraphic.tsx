import React from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { z } from "zod";
import {
  Grain, PaperBackground,
  COLORS, SPRINGS, fontFamily, serifFontFamily,
  SmartImg, hexToRgb, rgbaFromHex,
} from "./shared";

export const TrophyPropsSchema = z.object({
  trophyName:  z.string(),
  trophyYear:  z.string(),
  clubName:    z.string(),
  badgeSlug:   z.string().optional(),
  clubColor:   z.string().optional(),
  subtext:     z.string().optional(),
  trophyCount: z.number().optional(),
  bgColor:     z.string().default("#f0ece4"),
});

export const TrophyGraphicPropsSchema = TrophyPropsSchema;
export type TrophyGraphicProps = z.infer<typeof TrophyPropsSchema>;

// Large trophy SVG — gold, detailed
const TrophySVG: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 120 140" fill="none">
    {/* Cup body */}
    <path d="M30 8 L90 8 L90 62 Q90 95 60 100 Q30 95 30 62 Z" fill="url(#trophyGold)" />
    {/* Handles */}
    <path d="M30 18 L10 18 L10 42 Q10 58 26 60" stroke="#C9A84C" strokeWidth="5" strokeLinecap="round" fill="none" />
    <path d="M90 18 L110 18 L110 42 Q110 58 94 60" stroke="#C9A84C" strokeWidth="5" strokeLinecap="round" fill="none" />
    {/* Stem */}
    <rect x="52" y="100" width="16" height="20" fill="#C9A84C" rx="2" />
    {/* Base */}
    <rect x="32" y="118" width="56" height="12" fill="url(#trophyGold)" rx="4" />
    <rect x="22" y="128" width="76" height="8" fill="#b8922d" rx="3" />
    {/* Sheen */}
    <path d="M45 14 Q42 45 46 75" stroke="rgba(255,255,255,0.35)" strokeWidth="3" strokeLinecap="round" fill="none" />
    {/* Star */}
    <polygon points="60,20 62.8,28 71,28 64.6,33 67,41 60,36.4 53,41 55.4,33 49,28 57.2,28" fill="rgba(255,255,255,0.6)" />
    <defs>
      <linearGradient id="trophyGold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#f0cb6a" />
        <stop offset="40%" stopColor="#C9A84C" />
        <stop offset="100%" stopColor="#96721d" />
      </linearGradient>
    </defs>
  </svg>
);

export const TrophyGraphic: React.FC<TrophyGraphicProps> = ({
  trophyName, trophyYear, clubName, badgeSlug, clubColor, subtext, trophyCount, bgColor = "#f0ece4",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const trophyScale = spring({ frame, fps, from: 0, to: 1, config: { damping: 18, stiffness: 55, mass: 1 }, delay: 8 });
  const titleY = spring({ frame, fps, from: 60, to: 0, config: SPRINGS.header, delay: 18 });
  const titleOp = interpolate(frame, [18, 38], [0, 1], { extrapolateRight: "clamp" });
  const badgeScale = spring({ frame, fps, from: 0, to: 1, config: SPRINGS.bounce, delay: 30 });
  const subtextOp = interpolate(frame, [45, 65], [0, 1], { extrapolateRight: "clamp" });
  const subtextY = spring({ frame, fps, from: 20, to: 0, config: SPRINGS.row, delay: 45 });
  const pillsOp = interpolate(frame, [60, 80], [0, 1], { extrapolateRight: "clamp" });

  const [r, g, b] = hexToRgb(clubColor);

  return (
    <AbsoluteFill>
      <PaperBackground color={bgColor} />
      <Grain />

      {/* Glow behind trophy */}
      <div style={{
        position: "absolute",
        left: "50%",
        top: "42%",
        transform: "translate(-50%, -50%)",
        width: 360,
        height: 360,
        borderRadius: "50%",
        background: `radial-gradient(circle, rgba(${r},${g},${b},0.18) 0%, rgba(201,168,76,0.12) 40%, transparent 70%)`,
        filter: "blur(40px)",
      }} />

      {/* Club color accent bar at top */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, right: 0,
        height: 6,
        background: `linear-gradient(90deg, transparent, ${clubColor}, transparent)`,
        opacity: 0.8,
      }} />

      {/* Trophy centred */}
      <div style={{
        position: "absolute",
        left: "50%",
        top: "38%",
        transform: `translate(-50%, -50%) scale(${trophyScale})`,
        transformOrigin: "center center",
      }}>
        <TrophySVG size={210} />
      </div>

      {/* Badge (top-left of trophy area) */}
      <div style={{
        position: "absolute",
        left: "50%",
        top: "56%",
        transform: `translate(-50%, 0) scale(${badgeScale})`,
        width: 72,
        height: 72,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <SmartImg
          src={badgeSlug}
          style={{ width: 72, height: 72, objectFit: "contain" }}
        />
      </div>

      {/* Trophy count pills */}
      <div style={{
        position: "absolute",
        left: "50%",
        top: "68%",
        transform: "translateX(-50%)",
        display: "flex",
        gap: 10,
        opacity: pillsOp,
      }}>
        {Array.from({ length: trophyCount }).map((_, i) => (
          <div key={i} style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: COLORS.gold,
            boxShadow: `0 0 8px 2px rgba(201,168,76,0.5)`,
          }} />
        ))}
      </div>

      {/* Club name */}
      <div style={{
        position: "absolute",
        left: "50%",
        top: "76%",
        transform: `translate(-50%, ${titleY}px)`,
        opacity: titleOp,
        textAlign: "center",
        whiteSpace: "nowrap",
      }}>
        <div style={{
          fontFamily: serifFontFamily,
          fontSize: 48,
          fontWeight: 900,
          color: COLORS.primary,
          letterSpacing: -1,
        }}>
          {clubName}
        </div>
      </div>

      {/* Trophy name + year */}
      <div style={{
        position: "absolute",
        left: "50%",
        top: "84%",
        transform: `translate(-50%, ${subtextY}px)`,
        opacity: subtextOp,
        textAlign: "center",
        whiteSpace: "nowrap",
      }}>
        <div style={{
          fontFamily,
          fontSize: 22,
          fontWeight: 700,
          color: COLORS.gold,
          letterSpacing: 2,
          textTransform: "uppercase",
        }}>
          {trophyName} · {trophyYear}
        </div>
        <div style={{
          fontFamily,
          fontSize: 16,
          fontWeight: 400,
          color: COLORS.muted,
          marginTop: 4,
          letterSpacing: 1,
        }}>
          {subtext}
        </div>
      </div>

      {/* Decorative horizontal rule */}
      <div style={{
        position: "absolute",
        left: "50%",
        top: "14%",
        transform: "translateX(-50%)",
        width: 320,
        opacity: subtextOp * 0.4,
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}>
        <div style={{ flex: 1, height: 1, background: COLORS.gold, opacity: 0.6 }} />
        <div style={{ fontFamily, fontSize: 11, fontWeight: 700, letterSpacing: 3, color: COLORS.gold, textTransform: "uppercase" }}>90th</div>
        <div style={{ flex: 1, height: 1, background: COLORS.gold, opacity: 0.6 }} />
      </div>
    </AbsoluteFill>
  );
};
