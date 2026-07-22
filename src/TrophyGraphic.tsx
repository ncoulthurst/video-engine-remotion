/**
 * TrophyGraphic — single trophy moment card.
 * F3: composed from the shared kit (Ground/TYPE/prog) — no per-comp springs,
 * grain or blurred glow (the Ground's Atmosphere key light provides depth).
 * The trophy lands on the "entity" beat, the year line on "year" (H1).
 */
import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { z } from "zod";
import { COLORS, SmartImg, WorldStateSchema } from "./shared";
import { Ground, TYPE, EASE, prog, beatDelay, resolveTheme } from "./lib/kit";

export const TrophyPropsSchema = z.object({
  trophyName:  z.string().optional().default("Premier League"),
  trophyYear:  z.string().optional().default("2024"),
  clubName:    z.string().optional().default("Club Name"),
  badgeSlug:   z.string().optional().default(""),
  clubColor:   z.string().optional().default(""),
  subtext:     z.string().optional().default(""),
  trophyCount: z.number().optional(),
  bgColor:     z.string().optional().default("#f0ece4"),
  worldState: WorldStateSchema.optional(),
  skipIntro: z.boolean().optional().default(false),
  beats:     z.record(z.string(), z.number()).optional(),
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
  skipIntro = false, beats,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = resolveTheme("paper", clubColor || COLORS.gold, bgColor);

  const trophyAt = beatDelay(beats, "entity", fps, 8);
  const yearAt   = beatDelay(beats, "year", fps, 45);

  const trophyScale = skipIntro ? 1 : interpolate(prog(frame, trophyAt, 24, EASE.snap), [0, 1], [0.4, 1]);
  const trophyOp    = skipIntro ? 1 : prog(frame, trophyAt, 14, EASE.quad);
  const titleIn     = skipIntro ? 1 : prog(frame, trophyAt + 10, 22, EASE.snap);
  const badgeIn     = skipIntro ? 1 : prog(frame, trophyAt + 22, 18, EASE.snap);
  const subtextIn   = skipIntro ? 1 : prog(frame, yearAt, 20, EASE.snap);
  const pillsOp     = skipIntro ? 1 : prog(frame, yearAt + 15, 20, EASE.quad);

  return (
    <Ground ground="paper" bgColor={bgColor} accentColor={clubColor || COLORS.gold} domain="football" texture skipIntro={skipIntro} pad={0} focus={{ x: 0.5, y: 0.4 }}>
      {/* Club color accent bar at top */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, right: 0,
        height: 6,
        background: `linear-gradient(90deg, transparent, ${clubColor || t.accent}, transparent)`,
        opacity: 0.8,
      }} />

      {/* Trophy centred */}
      <div style={{
        position: "absolute",
        left: "50%",
        top: "38%",
        transform: `translate(-50%, -50%) scale(${trophyScale})`,
        transformOrigin: "center center",
        opacity: trophyOp,
      }}>
        <TrophySVG size={210} />
      </div>

      {/* Badge (below trophy) */}
      <div style={{
        position: "absolute",
        left: "50%",
        top: "56%",
        transform: `translate(-50%, 0) scale(${badgeIn})`,
        width: 72,
        height: 72,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: badgeIn,
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
          }} />
        ))}
      </div>

      {/* Club name */}
      <div style={{
        position: "absolute",
        left: "50%",
        top: "76%",
        transform: `translate(-50%, ${(1 - titleIn) * 60}px)`,
        opacity: titleIn,
        textAlign: "center",
        whiteSpace: "nowrap",
      }}>
        <div style={{
          fontFamily: TYPE.serif,
          fontSize: 48,
          fontWeight: 900,
          color: t.ink,
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
        transform: `translate(-50%, ${(1 - subtextIn) * 20}px)`,
        opacity: subtextIn,
        textAlign: "center",
        whiteSpace: "nowrap",
      }}>
        <div style={{
          fontFamily: TYPE.mono,
          fontSize: 22,
          fontWeight: 700,
          color: COLORS.gold,
          letterSpacing: TYPE.track,
          textTransform: "uppercase",
        }}>
          {trophyName} · {trophyYear}
        </div>
        <div style={{
          fontFamily: TYPE.sans,
          fontSize: 16,
          fontWeight: 400,
          color: t.muted,
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
        opacity: subtextIn * 0.4,
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}>
        <div style={{ flex: 1, height: 1, background: COLORS.gold, opacity: 0.6 }} />
        <div style={{ fontFamily: TYPE.mono, fontSize: 11, fontWeight: 700, letterSpacing: 3, color: COLORS.gold, textTransform: "uppercase" }}>Friction</div>
        <div style={{ flex: 1, height: 1, background: COLORS.gold, opacity: 0.6 }} />
      </div>
    </Ground>
  );
};
