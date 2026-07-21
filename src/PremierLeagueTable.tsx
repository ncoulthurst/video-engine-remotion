import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { fontFamily, serifFontFamily, COLORS, SmartImg, TrophyIcon, WorldStateSchema } from "./shared";
import { Ground, EASE, prog, beatDelay, stagger, resolveTheme } from "./lib/kit";

// ── Schema ────────────────────────────────────────────────────────────────────

const TeamSchema = z.object({
  pos:       z.number(),
  name:      z.string().optional().default(""),
  badgeSlug: z.string().optional().default("").default(""),
  color:     z.string().optional().default("").default(COLORS.gold),
  p:         z.number(),
  w:         z.number(),
  d:         z.number(),
  l:         z.number(),
  gd:        z.number(),
  pts:       z.number(),
});

export const TablePropsSchema = z.object({
  season:  z.string().optional().default("2013-14"),
  teams:   z.array(TeamSchema).default([]),
  bgColor: z.string().optional().default("#f0ece4"),
  worldState: WorldStateSchema.optional(),
  skipIntro: z.boolean().optional().default(false),
  beats:     z.record(z.string(), z.number()).optional(),
});

export type TableProps = z.infer<typeof TablePropsSchema>;

// ── Column widths ─────────────────────────────────────────────────────────────

const COL = { POS: 60, BADGE: 88, P: 64, W: 64, D: 64, L: 64, GD: 80, PTS: 96 };

const ROW_H      = 100;
const BADGE_SIZE = 72;

// ── Component ─────────────────────────────────────────────────────────────────

export const PremierLeagueTable: React.FC<TableProps> = ({ season, teams, bgColor, skipIntro = false, beats }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = resolveTheme("paper", COLORS.gold, bgColor);

  const ROW_STAGGER = 10;
  const ROW_START   = beatDelay(beats, "entity", fps, 20);

  const headerProg = skipIntro ? 1 : prog(frame, 0, 20, EASE.snap);
  const headerOp   = headerProg;
  const headerY    = interpolate(headerProg, [0, 1], [-20, 0], { extrapolateRight: "clamp" });

  const colsProg = skipIntro ? 1 : prog(frame, 10, 20, EASE.out);
  const colsOp   = colsProg;
  const ruleW    = colsProg * 100;

  return (
    <Ground ground="paper" bgColor={bgColor} accentColor={COLORS.gold} domain="football" texture skipIntro={skipIntro} pad={0}>

      <div style={{
        position:       "absolute",
        inset:          0,
        display:        "flex",
        flexDirection:  "column",
        justifyContent: "center",
        padding:        "0 140px",
      }}>

        {/* Title block */}
        <div style={{ opacity: headerOp, transform: `translateY(${headerY}px)`, marginBottom: 32 }}>
          <div style={{
            fontFamily: serifFontFamily, fontSize: 90, fontWeight: 900,
            color: COLORS.primary, letterSpacing: -3, lineHeight: 1,
          }}>
            premier league
          </div>
          <div style={{
            fontFamily, fontSize: 25, fontWeight: 500,
            color: COLORS.muted, letterSpacing: 0.5, marginTop: 10,
          }}>
            {season} · final standings
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
          <div style={{ width: COL.POS,  fontFamily, fontSize: 14, fontWeight: 700, letterSpacing: 2, color: COLORS.colHeader, textTransform: "uppercase" as const, textAlign: "center" as const }}>#</div>
          <div style={{ width: COL.BADGE }} />
          <div style={{ flex: 1,         fontFamily, fontSize: 14, fontWeight: 700, letterSpacing: 2, color: COLORS.colHeader, textTransform: "uppercase" as const, paddingLeft: 20 }}>Club</div>
          {(["P","W","D","L","GD","Pts"] as const).map((h, i) => (
            <div key={h} style={{
              width: [COL.P, COL.W, COL.D, COL.L, COL.GD, COL.PTS][i],
              fontFamily, fontSize: 14, fontWeight: 700, letterSpacing: 2,
              color: h === "Pts" ? COLORS.gold : COLORS.colHeader,
              textTransform: "uppercase" as const, textAlign: "center" as const, flexShrink: 0,
            }}>{h}</div>
          ))}
        </div>

        {/* Team rows */}
        <div>
          {teams.map((team, i) => {
            const delay   = ROW_START + stagger(i, ROW_STAGGER);
            const p       = skipIntro ? 1 : prog(frame, delay, 20, EASE.snap);
            const rowOp   = interpolate(p, [0, 0.4], [0, 1], { extrapolateRight: "clamp" });
            const rowX    = interpolate(p, [0, 1], [-36, 0], { extrapolateRight: "clamp" });
            const isChamp = team.pos === 1;

            return (
              <div
                key={i}
                style={{
                  opacity: rowOp, transform: `translateX(${rowX}px)`,
                  display: "flex", alignItems: "center",
                  height: ROW_H,
                  borderBottom: i < teams.length - 1 ? "1px solid rgba(0,0,0,0.06)" : "none",
                  position: "relative",
                }}
              >
                {isChamp && (
                  <div style={{
                    position: "absolute", left: -20, top: 16, bottom: 16,
                    width: 3, borderRadius: 3,
                    backgroundColor: COLORS.gold,
                  }} />
                )}

                {/* Position */}
                <div style={{ width: COL.POS, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {isChamp
                    ? <TrophyIcon size={24} />
                    : <span style={{ fontFamily, fontSize: 23, fontWeight: 800, color: COLORS.muted }}>{team.pos}</span>
                  }
                </div>

                {/* Badge */}
                <div style={{ width: COL.BADGE, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {team.badgeSlug
                    ? <SmartImg src={`badges/${team.badgeSlug}`} style={{ width: BADGE_SIZE, height: BADGE_SIZE, objectFit: "contain" as const }} />
                    : <div style={{ width: BADGE_SIZE, height: BADGE_SIZE, borderRadius: "50%", background: team.color, opacity: 0.35 }} />
                  }
                </div>

                {/* Name */}
                <div style={{
                  flex: 1,
                  fontFamily:    isChamp ? serifFontFamily : fontFamily,
                  fontSize:      isChamp ? 38 : 28,
                  fontWeight:    isChamp ? 900 : 600,
                  color:         COLORS.primary,
                  letterSpacing: isChamp ? -0.5 : 0,
                  paddingLeft:   20,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const,
                }}>
                  {team.name}
                </div>

                {/* P W D L */}
                {[team.p, team.w, team.d, team.l].map((val, ci) => (
                  <div key={ci} style={{
                    width: [COL.P, COL.W, COL.D, COL.L][ci],
                    fontFamily, fontSize: 20, fontWeight: 400,
                    color: COLORS.muted, textAlign: "center" as const, flexShrink: 0,
                  }}>{val}</div>
                ))}

                {/* GD */}
                <div style={{
                  width: COL.GD, fontFamily, fontSize: 20, fontWeight: 600,
                  color: team.gd > 0 ? "#2d7a2d" : team.gd < 0 ? "#c0392b" : COLORS.muted,
                  textAlign: "center" as const, flexShrink: 0,
                }}>
                  {team.gd > 0 ? `+${team.gd}` : team.gd}
                </div>

                {/* Points */}
                <div style={{
                  width: COL.PTS,
                  fontFamily:    isChamp ? serifFontFamily : fontFamily,
                  fontSize:      isChamp ? 43 : 30,
                  fontWeight:    900,
                  color:         isChamp ? COLORS.gold : COLORS.primary,
                  textAlign:     "center" as const, letterSpacing: -0.5, flexShrink: 0,
                }}>
                  {team.pts}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Ground>
  );
};
