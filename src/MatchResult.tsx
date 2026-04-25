import React from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { z } from "zod";
import { fontFamily, serifFontFamily, Grain, PaperBackground, COLORS, SmartImg, WorldStateSchema} from "./shared";

const ScorerSchema = z.object({
  name:   z.string().optional().default(""),
  minute: z.string().optional().default(""),
  team:   z.enum(["home", "away"]).optional(),
});

export const MatchResultPropsSchema = z.object({
  homeTeam:      z.string().optional().default("Home"),
  awayTeam:      z.string().optional().default("Away"),
  homeBadgeSlug: z.string().optional().default(""),
  awayBadgeSlug: z.string().optional().default(""),
  homeColor:     z.string().optional().default(""),
  awayColor:     z.string().optional().default(""),
  homeScore:     z.number(),
  awayScore:     z.number(),
  date:          z.string().optional().default(""),
  competition:   z.string().optional().default(""),
  venue:         z.string().optional().default(""),
  scorers:       z.array(ScorerSchema).optional(),
  bgColor:       z.string().optional().default("#f0ece4"),
  // Track E — optional portrait of match-defining player (resolver-filled)
  playerImage:   z.string().optional().default(""),
  worldState: WorldStateSchema.optional(),
  skipIntro: z.boolean().optional().default(false),
});

export type MatchResultProps = z.infer<typeof MatchResultPropsSchema>;

const SCORE_START = 40;
const GOAL_DELAY  = 20; // frames between each goal
const BADGE_SIZE  = 160;

export const MatchResult: React.FC<MatchResultProps> = ({
  homeTeam, awayTeam, homeBadgeSlug, awayBadgeSlug,
  homeColor = "#C8102E", awayColor = "#034694",
  homeScore, awayScore, date, competition, venue, scorers = [], bgColor,
  skipIntro = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ── Entrance animations ────────────────────────────────────────────────
  const topProg    = skipIntro ? 1 : spring({ frame, fps, config: { damping: 28, stiffness: 55 } });
  const topOp      = interpolate(topProg, [0, 1], [0, 1],  { extrapolateRight: "clamp" });
  const topY       = interpolate(topProg, [0, 1], [-20, 0], { extrapolateRight: "clamp" });

  const homeOp     = skipIntro ? 1 : interpolate(frame, [10, 32], [0, 1], { extrapolateRight: "clamp" });
  const homeX      = skipIntro ? 0 : spring({ frame, fps, from: -80, to: 0, config: { damping: 24, stiffness: 60 }, delay: 10 });

  const scoreOp    = skipIntro ? 1 : interpolate(frame, [20, 44], [0, 1], { extrapolateRight: "clamp" });
  const scoreScale = skipIntro ? 1 : spring({ frame, fps, from: 0, to: 1, config: { damping: 20, stiffness: 70 }, delay: 20 });

  const awayOp     = skipIntro ? 1 : interpolate(frame, [18, 40], [0, 1], { extrapolateRight: "clamp" });
  const awayX      = skipIntro ? 0 : spring({ frame, fps, from: 80, to: 0, config: { damping: 24, stiffness: 60 }, delay: 18 });

  // ── Goal sequence ──────────────────────────────────────────────────────
  // Sort scorers by minute — this defines the chronological goal order
  const sortedScorers = [...scorers].sort((a, b) => {
    const mA = a.minute ? parseInt(a.minute) : 999;
    const mB = b.minute ? parseInt(b.minute) : 999;
    return mA - mB;
  });

  // Derive goal sequence from sorted scorers if they cover all goals,
  // otherwise fall back to interleaved home/away
  const scorerSeq = sortedScorers
    .filter(s => s.team === "home" || s.team === "away")
    .map(s => s.team as "home" | "away");

  const goalSeq: Array<"home" | "away"> = scorerSeq.length === homeScore + awayScore
    ? scorerSeq
    : (() => {
        const seq: Array<"home" | "away"> = [];
        for (let i = 0; i < Math.max(homeScore, awayScore); i++) {
          if (i < homeScore) seq.push("home");
          if (i < awayScore) seq.push("away");
        }
        return seq;
      })();

  // Current score based on how many goals have been revealed
  const goalsRevealed = goalSeq.filter((_, i) => frame >= SCORE_START + i * GOAL_DELAY).length;
  const dispHome = goalSeq.slice(0, goalsRevealed).filter(g => g === "home").length;
  const dispAway = goalSeq.slice(0, goalsRevealed).filter(g => g === "away").length;

  // Scale punch per team when their goal increments
  let lastHomeFrame = -999;
  let lastAwayFrame = -999;
  goalSeq.forEach((g, i) => {
    const gf = SCORE_START + i * GOAL_DELAY;
    if (gf <= frame) {
      if (g === "home") lastHomeFrame = gf;
      if (g === "away") lastAwayFrame = gf;
    }
  });

  const homeNumScale = lastHomeFrame > -999
    ? spring({ frame: frame - lastHomeFrame, fps, from: 1.3, to: 1.0, config: { damping: 9, stiffness: 200 } })
    : 1.0;
  const awayNumScale = lastAwayFrame > -999
    ? spring({ frame: frame - lastAwayFrame, fps, from: 1.3, to: 1.0, config: { damping: 9, stiffness: 200 } })
    : 1.0;

  const isHomeWin = homeScore > awayScore;
  const isAwayWin = awayScore > homeScore;

  // Gold rule appears just before first goal
  const ruleOp = interpolate(frame, [SCORE_START - 6, SCORE_START + 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      <PaperBackground color={bgColor} />
      <Grain />

      <div style={{
        position:       "absolute",
        inset:          0,
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        justifyContent: "center",
        padding:        "40px 80px",
      }}>

        {/* Competition + date */}
        <div style={{
          opacity:      topOp,
          transform:    `translateY(${topY}px)`,
          display:      "flex",
          gap:          20,
          alignItems:   "center",
          marginBottom: 52,
        }}>
          <div style={{ fontFamily, fontSize: 26, fontWeight: 700, letterSpacing: 2, color: COLORS.muted, textTransform: "uppercase" as const }}>{competition}</div>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: COLORS.muted }} />
          <div style={{ fontFamily, fontSize: 26, fontWeight: 400, color: COLORS.muted }}>{date}</div>
          {venue && <>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: COLORS.muted }} />
            <div style={{ fontFamily, fontSize: 26, fontWeight: 400, color: COLORS.muted }}>{venue}</div>
          </>}
        </div>

        {/* Main score row */}
        <div style={{
          display:        "flex",
          alignItems:     "center",
          gap:            72,
          width:          "100%",
          justifyContent: "center",
          marginBottom:   44,
        }}>

          {/* Home team */}
          <div style={{
            opacity: homeOp, transform: `translateX(${homeX}px)`,
            display: "flex", flexDirection: "column", alignItems: "center",
            gap: 24, flex: 1, maxWidth: 480,
          }}>
            {homeBadgeSlug
              ? <SmartImg src={`badges/${homeBadgeSlug}`} style={{ width: BADGE_SIZE, height: BADGE_SIZE, objectFit: "contain" as const }} />
              : <div style={{
                  width: BADGE_SIZE, height: BADGE_SIZE, borderRadius: "50%",
                  background: `rgba(200,16,46,0.12)`, border: `3px solid rgba(200,16,46,0.35)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: serifFontFamily, fontSize: 72, fontWeight: 900, color: homeColor,
                }}>{homeTeam[0]}</div>
            }
            <div style={{ fontFamily: serifFontFamily, fontSize: 52, fontWeight: 900, color: COLORS.primary, textAlign: "center" as const, letterSpacing: -1, lineHeight: 1.1 }}>
              {homeTeam}
            </div>
          </div>

          {/* Score */}
          <div style={{
            opacity: scoreOp, transform: `scale(${scoreScale})`,
            display: "flex", alignItems: "center", flexShrink: 0,
          }}>
            <div style={{
              fontFamily: serifFontFamily, fontSize: 200, fontWeight: 900,
              color: isHomeWin ? homeColor : COLORS.primary,
              letterSpacing: -8, lineHeight: 1, minWidth: 130, textAlign: "center" as const,
              transform: `scale(${homeNumScale})`, transformOrigin: "center center",
            }}>
              {dispHome}
            </div>
            <div style={{ fontFamily, fontSize: 100, fontWeight: 300, color: COLORS.muted, margin: "0 20px", lineHeight: 1 }}>–</div>
            <div style={{
              fontFamily: serifFontFamily, fontSize: 200, fontWeight: 900,
              color: isAwayWin ? awayColor : COLORS.primary,
              letterSpacing: -8, lineHeight: 1, minWidth: 130, textAlign: "center" as const,
              transform: `scale(${awayNumScale})`, transformOrigin: "center center",
            }}>
              {dispAway}
            </div>
          </div>

          {/* Away team */}
          <div style={{
            opacity: awayOp, transform: `translateX(${awayX}px)`,
            display: "flex", flexDirection: "column", alignItems: "center",
            gap: 24, flex: 1, maxWidth: 480,
          }}>
            {awayBadgeSlug
              ? <SmartImg src={`badges/${awayBadgeSlug}`} style={{ width: BADGE_SIZE, height: BADGE_SIZE, objectFit: "contain" as const }} />
              : <div style={{
                  width: BADGE_SIZE, height: BADGE_SIZE, borderRadius: "50%",
                  background: `rgba(3,70,148,0.12)`, border: `3px solid rgba(3,70,148,0.35)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: serifFontFamily, fontSize: 72, fontWeight: 900, color: awayColor,
                }}>{awayTeam[0]}</div>
            }
            <div style={{ fontFamily: serifFontFamily, fontSize: 52, fontWeight: 900, color: COLORS.primary, textAlign: "center" as const, letterSpacing: -1, lineHeight: 1.1 }}>
              {awayTeam}
            </div>
          </div>

        </div>

        {/* Gold rule — appears just before first goal */}
        {scorers.length > 0 && (
          <div style={{
            opacity:      ruleOp,
            width:        "50%",
            height:       1,
            background:   `linear-gradient(90deg, transparent, ${COLORS.gold}, transparent)`,
            marginBottom: 24,
          }} />
        )}

        {/* Goalscorers — two columns with divider, names appear as each goal increments */}
        {scorers.length > 0 && (
          <div style={{ display: "flex", gap: 100, justifyContent: "center", width: "100%" }}>
            {/* Home scorers */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end", minWidth: 280 }}>
              {sortedScorers.filter(s => s.team === "home").map((scorer, hi) => {
                // Find this scorer's position in the full sorted list for timing
                const globalIndex = sortedScorers.indexOf(scorer);
                const goalFrame   = SCORE_START + globalIndex * GOAL_DELAY;
                const scorerOp    = interpolate(frame, [goalFrame, goalFrame + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
                const scorerY     = frame >= goalFrame
                  ? spring({ frame: frame - goalFrame, fps, from: 12, to: 0, config: { damping: 22, stiffness: 90 } })
                  : 12;
                return (
                  <div key={hi} style={{ opacity: scorerOp, transform: `translateY(${scorerY}px)` }}>
                    <div style={{ fontFamily, fontSize: 28, fontWeight: 500, color: COLORS.secondary }}>
                      {scorer.name}{scorer.minute ? ` ${scorer.minute}'` : ""}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Divider */}
            <div style={{ width: 1, background: "rgba(0,0,0,0.08)", opacity: ruleOp }} />

            {/* Away scorers */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-start", minWidth: 280 }}>
              {sortedScorers.filter(s => s.team === "away").map((scorer, ai) => {
                const globalIndex = sortedScorers.indexOf(scorer);
                const goalFrame   = SCORE_START + globalIndex * GOAL_DELAY;
                const scorerOp    = interpolate(frame, [goalFrame, goalFrame + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
                const scorerY     = frame >= goalFrame
                  ? spring({ frame: frame - goalFrame, fps, from: 12, to: 0, config: { damping: 22, stiffness: 90 } })
                  : 12;
                return (
                  <div key={ai} style={{ opacity: scorerOp, transform: `translateY(${scorerY}px)` }}>
                    <div style={{ fontFamily, fontSize: 28, fontWeight: 500, color: COLORS.secondary }}>
                      {scorer.name}{scorer.minute ? ` ${scorer.minute}'` : ""}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </AbsoluteFill>
  );
};
