import React from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { z } from "zod";
import {
  Grain, PaperBackground,
  COLORS, SPRINGS, fontFamily, serifFontFamily, SmartImg, hexToRgb,
} from "./shared";

const StatSchema = z.object({
  label: z.string(),
  value: z.union([z.string(), z.number()]).optional(),
  sub:   z.string().optional(),
});

export const PlayerStatsPropsSchema = z.object({
  playerName:  z.string(),
  club:        z.string().optional(),
  season:      z.string().optional(),
  competition: z.string().optional(),
  badgeSlug:   z.string().optional(),
  clubColor:   z.string().optional(),
  stats:       z.array(StatSchema),
  bgColor:     z.string().default("#f0ece4"),
});

export type PlayerStatsProps = z.infer<typeof PlayerStatsPropsSchema>;

export const PlayerStats: React.FC<PlayerStatsProps> = ({
  playerName, club, season, competition, badgeSlug,
  clubColor = COLORS.gold, stats, bgColor = "#f0ece4",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOp = interpolate(frame, [0, 22], [0, 1], { extrapolateRight: "clamp" });
  const headerY  = spring({ frame, fps, from: -30, to: 0, config: SPRINGS.header, delay: 0 });
  const lineW    = spring({ frame, fps, from: 0, to: 1, config: SPRINGS.cols, delay: 14 });

  const [cr, cg, cb] = hexToRgb(clubColor);

  // Show up to 4 stats in the 2×2 grid
  const displayStats = stats.slice(0, 4);
  const countProgress = interpolate(frame, [40, 95], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      <PaperBackground color={bgColor} />
      <Grain />

      {/* Subtle club colour ambient top-right */}
      <div style={{
        position:     "absolute",
        right:        -60,
        top:          -60,
        width:        600,
        height:       600,
        borderRadius: "50%",
        background:   `radial-gradient(circle, rgba(${cr},${cg},${cb},0.10) 0%, transparent 65%)`,
        filter:       "blur(60px)",
        pointerEvents:"none",
      }} />

      <div style={{
        position:      "absolute",
        inset:         0,
        display:       "flex",
        flexDirection: "column",
        padding:       "60px 140px 60px",
      }}>

        {/* ── Header ─────────────────────────────────────────── */}
        <div style={{
          opacity:   headerOp,
          transform: `translateY(${headerY}px)`,
          display:   "flex",
          alignItems:"center",
          gap:       28,
          marginBottom: 16,
        }}>
          {badgeSlug ? (
            <SmartImg src={`badges/${badgeSlug}`} style={{ width: 88, height: 88, objectFit: "contain" }} />
          ) : null}
          <div>
            <div style={{
              fontFamily,
              fontSize:      13,
              fontWeight:    700,
              letterSpacing: 3.5,
              color:         COLORS.muted,
              textTransform: "uppercase",
              marginBottom:  6,
            }}>
              {[competition, season].filter(Boolean).join(" · ")}
            </div>
            <div style={{
              fontFamily:    serifFontFamily,
              fontSize:      80,
              fontWeight:    900,
              color:         COLORS.primary,
              letterSpacing: -3,
              lineHeight:    1,
            }}>
              {playerName}
            </div>
            {club ? (
              <div style={{
                fontFamily,
                fontSize:   24,
                fontWeight: 700,
                color:      clubColor,
                marginTop:  8,
                letterSpacing: 0.3,
              }}>
                {club}
              </div>
            ) : null}
          </div>
        </div>

        {/* Accent divider */}
        <div style={{
          height:       3,
          width:        `${lineW * 100}%`,
          background:   `linear-gradient(90deg, ${clubColor}, transparent)`,
          borderRadius: 2,
          marginBottom: 44,
          opacity:      0.7,
        }} />

        {/* ── 2×2 Stats grid ─────────────────────────────────── */}
        <div style={{
          flex:                1,
          display:             "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gridTemplateRows:    displayStats.length > 2 ? "repeat(2, 1fr)" : "repeat(1, 1fr)",
          gap:                 28,
        }}>
          {displayStats.map((stat, i) => {
            const delay  = 28 + i * 12;
            const cardOp = interpolate(frame, [delay, delay + 20], [0, 1], { extrapolateRight: "clamp" });
            const cardY  = spring({ frame, fps, from: 40, to: 0, config: SPRINGS.row, delay });

            const numVal  = typeof stat.value === "number" ? stat.value : parseFloat(String(stat.value));
            const isNum   = !isNaN(numVal);

            // Count-up: integers use toLocaleString for comma formatting, decimals keep 1dp
            const counted = isNum
              ? (Number.isInteger(numVal)
                  ? Math.round(numVal * countProgress)
                  : parseFloat((numVal * countProgress).toFixed(1)))
              : null;
            const displayVal = counted !== null
              ? (Number.isInteger(counted)
                  ? counted.toLocaleString()
                  : counted.toFixed(1))
              : stat.value;

            // Shrink font for long values so they never overflow the card
            const strLen     = String(displayVal).replace(/,/g, "").length;
            const numFontSize = strLen >= 5 ? 72 : strLen === 4 ? 92 : 120;

            return (
              <div
                key={i}
                style={{
                  opacity:         cardOp,
                  transform:       `translateY(${cardY}px)`,
                  backgroundColor: COLORS.card,
                  borderRadius:    20,
                  border:          `1px solid ${COLORS.cardBorder}`,
                  padding:         "36px 44px",
                  position:        "relative",
                  overflow:        "hidden",
                  boxShadow:       "0 6px 28px rgba(0,0,0,0.07)",
                  display:         "flex",
                  flexDirection:   "column",
                  justifyContent:  "center",
                }}
              >
                {/* Top accent bar — thicker, full opacity for stronger club branding */}
                <div style={{
                  position:   "absolute",
                  top: 0, left: 0, right: 0,
                  height:     6,
                  background: `linear-gradient(90deg, ${clubColor}, ${clubColor}88)`,
                }} />

                <div style={{
                  fontFamily,
                  fontSize:      13,
                  fontWeight:    700,
                  letterSpacing: 2.5,
                  color:         COLORS.muted,
                  textTransform: "uppercase",
                  marginBottom:  12,
                }}>
                  {stat.label}
                </div>

                <div style={{
                  fontFamily,
                  fontSize:      numFontSize,
                  fontWeight:    900,
                  color:         COLORS.primary,
                  letterSpacing: -5,
                  lineHeight:    0.9,
                }}>
                  {displayVal}
                </div>

                {stat.sub ? (
                  <div style={{
                    fontFamily,
                    fontSize:   17,
                    color:      COLORS.muted,
                    marginTop:  14,
                    fontWeight: 500,
                  }}>
                    {stat.sub}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

      </div>
    </AbsoluteFill>
  );
};
