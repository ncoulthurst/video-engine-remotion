import React from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { z } from "zod";
import { fontFamily, serifFontFamily, Grain, PaperBackground, COLORS, SmartImg } from "./shared";

const PlayerSchema = z.object({
  pos:       z.number(),
  name:      z.string(),
  club:      z.string(),
  badgeSlug: z.string().optional(),
  clubColor: z.string().optional(),
  goals:     z.number(),
  assists:   z.number().optional(),
  apps:      z.number().optional(),
});

export const TopScorersPropsSchema = z.object({
  season:      z.string().default("2013-14"),
  competition: z.string().default("Premier League"),
  statLabel:   z.string().optional(),
  statKey:     z.string().optional(),
  players:     z.array(PlayerSchema).default([]),
  bgColor:     z.string().default("#f0ece4"),
});

export type TopScorersProps = z.infer<typeof TopScorersPropsSchema>;

const COL = { POS: 60, BADGE: 88, APPS: 72, AST: 72, GOALS: 96 };

const ROW_START   = 20;
const ROW_STAGGER = 10;
const ROW_H       = 100;
const BADGE_SIZE  = 72;

export const TopScorersTable: React.FC<TopScorersProps> = ({
  season, competition, statLabel = "Goals", players, bgColor,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerProg = spring({ frame, fps, config: { damping: 28, stiffness: 55 } });
  const headerOp   = interpolate(headerProg, [0, 1], [0, 1], { extrapolateRight: "clamp" });
  const headerY    = interpolate(headerProg, [0, 1], [-20, 0], { extrapolateRight: "clamp" });

  const colsProg = spring({ frame: frame - 10, fps, config: { damping: 20, stiffness: 80 } });
  const colsOp   = interpolate(colsProg, [0, 1], [0, 1], { extrapolateRight: "clamp" });
  const ruleW    = interpolate(colsProg, [0, 1], [0, 100], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      <PaperBackground color={bgColor} />
      <Grain />

      <div style={{
        position:      "absolute",
        inset:         0,
        display:       "flex",
        flexDirection: "column",
        justifyContent:"center",
        padding:       "0 140px",
      }}>

        {/* Title block */}
        <div style={{ opacity: headerOp, transform: `translateY(${headerY}px)`, marginBottom: 32 }}>
          <div style={{ fontFamily, fontSize: 16, fontWeight: 700, letterSpacing: 3, color: COLORS.muted, textTransform: "uppercase" as const, marginBottom: 8 }}>
            {competition}
          </div>
          <div style={{ fontFamily: serifFontFamily, fontSize: 90, fontWeight: 900, color: COLORS.primary, letterSpacing: -3, lineHeight: 1 }}>
            top scorers
          </div>
          <div style={{ fontFamily, fontSize: 25, fontWeight: 500, color: COLORS.muted, letterSpacing: 0.5, marginTop: 10 }}>
            {season}
          </div>
        </div>

        {/* Gold rule */}
        <div style={{
          height: 2, width: `${ruleW}%`,
          background:   `linear-gradient(90deg, ${COLORS.gold}, rgba(201,168,76,0.12))`,
          borderRadius: 2, marginBottom: 16, opacity: colsOp,
        }} />

        {/* Column headers */}
        <div style={{
          opacity: colsOp, display: "flex", alignItems: "center",
          paddingBottom: 10, borderBottom: "1px solid rgba(0,0,0,0.08)", marginBottom: 4,
        }}>
          <div style={{ width: COL.POS,   fontFamily, fontSize: 14, fontWeight: 700, letterSpacing: 2, color: COLORS.colHeader, textTransform: "uppercase" as const, textAlign: "center" as const }}>#</div>
          <div style={{ width: COL.BADGE }} />
          <div style={{ flex: 1,          fontFamily, fontSize: 14, fontWeight: 700, letterSpacing: 2, color: COLORS.colHeader, textTransform: "uppercase" as const, paddingLeft: 20 }}>Player</div>
          <div style={{ width: COL.APPS,  fontFamily, fontSize: 14, fontWeight: 700, letterSpacing: 2, color: COLORS.colHeader, textTransform: "uppercase" as const, textAlign: "center" as const }}>Apps</div>
          <div style={{ width: COL.AST,   fontFamily, fontSize: 14, fontWeight: 700, letterSpacing: 2, color: COLORS.colHeader, textTransform: "uppercase" as const, textAlign: "center" as const }}>Ast</div>
          <div style={{ width: COL.GOALS, fontFamily, fontSize: 14, fontWeight: 700, letterSpacing: 2, color: COLORS.gold,      textTransform: "uppercase" as const, textAlign: "center" as const }}>{statLabel}</div>
        </div>

        {/* Player rows */}
        <div>
          {players.map((p, i) => {
            const delay = ROW_START + i * ROW_STAGGER;
            const prog  = spring({ frame: frame - delay, fps, config: { damping: 24, stiffness: 60 } });
            const rowOp = interpolate(prog, [0, 0.4], [0, 1], { extrapolateRight: "clamp" });
            const rowX  = interpolate(prog, [0, 1], [-36, 0], { extrapolateRight: "clamp" });
            const isTop = p.pos === 1;

            return (
              <div key={i} style={{
                opacity: rowOp, transform: `translateX(${rowX}px)`,
                display: "flex", alignItems: "center",
                height: ROW_H,
                borderBottom: i < players.length - 1 ? "1px solid rgba(0,0,0,0.06)" : "none",
                position: "relative",
              }}>
                {isTop && (
                  <div style={{
                    position: "absolute", left: -20, top: 16, bottom: 16,
                    width: 3, borderRadius: 3,
                    backgroundColor: COLORS.gold,
                    boxShadow: "0 0 12px rgba(201,168,76,0.55)",
                  }} />
                )}

                {/* Position */}
                <div style={{ width: COL.POS, flexShrink: 0, textAlign: "center" as const }}>
                  <span style={{ fontFamily, fontSize: isTop ? 25 : 21, fontWeight: isTop ? 900 : 600, color: isTop ? COLORS.gold : COLORS.muted }}>
                    {p.pos}
                  </span>
                </div>

                {/* Badge */}
                <div style={{ width: COL.BADGE, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {p.badgeSlug
                    ? <SmartImg src={`badges/${p.badgeSlug}`} style={{ width: BADGE_SIZE, height: BADGE_SIZE, objectFit: "contain" as const }} />
                    : <div style={{ width: BADGE_SIZE, height: BADGE_SIZE, borderRadius: "50%", background: p.clubColor ?? COLORS.gold, opacity: 0.3 }} />
                  }
                </div>

                {/* Name */}
                <div style={{
                  flex: 1,
                  fontFamily:    isTop ? serifFontFamily : fontFamily,
                  fontSize:      isTop ? 38 : 28,
                  fontWeight:    isTop ? 900 : 600,
                  color:         COLORS.primary,
                  letterSpacing: isTop ? -0.5 : 0,
                  paddingLeft:   20,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const,
                }}>
                  {p.name}
                </div>

                {/* Apps */}
                <div style={{ width: COL.APPS, fontFamily, fontSize: 20, fontWeight: 400, color: COLORS.muted, textAlign: "center" as const, flexShrink: 0 }}>
                  {p.apps ?? "—"}
                </div>

                {/* Assists */}
                <div style={{ width: COL.AST, fontFamily, fontSize: 20, fontWeight: 400, color: COLORS.muted, textAlign: "center" as const, flexShrink: 0 }}>
                  {p.assists ?? "—"}
                </div>

                {/* Goals */}
                <div style={{
                  width: COL.GOALS,
                  fontFamily:    isTop ? serifFontFamily : fontFamily,
                  fontSize:      isTop ? 43 : 30,
                  fontWeight:    900,
                  color:         isTop ? COLORS.gold : COLORS.primary,
                  textAlign:     "center" as const, letterSpacing: -0.5, flexShrink: 0,
                }}>
                  {p.goals}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
