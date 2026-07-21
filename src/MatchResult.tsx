/**
 * MatchResult — full-time scoreline with chronological goal reveals.
 * F3: composed from the shared kit (Ground/TYPE/prog) — no per-comp springs,
 * grain or bounce pops. The goal sequence starts on the "stat" beat (H1).
 */
import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { z } from "zod";
import { SmartImg, WorldStateSchema, BadgeTreatment } from "./shared";
import { Ground, TYPE, EASE, prog, beatDelay, resolveTheme, Kicker } from "./lib/kit";

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
  beats:     z.record(z.string(), z.number()).optional(),
});

export type MatchResultProps = z.infer<typeof MatchResultPropsSchema>;

const SCORE_START = 40;
const GOAL_DELAY  = 20; // frames between each goal
const BADGE_SIZE  = 160;

/** Score punch — a fast settle from 1.3 → 1.0 (kit-eased, no underdamped wobble). */
const punch = (frame: number, at: number) =>
  at > -999 ? interpolate(prog(frame, at, 14, EASE.snap), [0, 1], [1.3, 1.0]) : 1.0;

export const MatchResult: React.FC<MatchResultProps> = ({
  homeTeam, awayTeam, homeBadgeSlug, awayBadgeSlug,
  homeColor = "#C8102E", awayColor = "#034694",
  homeScore, awayScore, date, competition, venue, scorers = [], bgColor,
  skipIntro = false, beats,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = resolveTheme("paper", homeColor, bgColor);

  // ── Entrance animations ────────────────────────────────────────────────
  const topProg    = skipIntro ? 1 : prog(frame, 0, 20, EASE.snap);
  const topOp      = topProg;
  const topY       = interpolate(topProg, [0, 1], [-20, 0], { extrapolateRight: "clamp" });

  const homeIn     = skipIntro ? 1 : prog(frame, 10, 22, EASE.snap);
  const homeOp     = homeIn;
  const homeX      = interpolate(homeIn, [0, 1], [-80, 0]);

  const scoreIn    = skipIntro ? 1 : prog(frame, 20, 24, EASE.snap);
  const scoreOp    = scoreIn;
  const scoreScale = interpolate(scoreIn, [0, 1], [0.6, 1]);

  const awayIn     = skipIntro ? 1 : prog(frame, 18, 22, EASE.snap);
  const awayOp     = awayIn;
  const awayX      = interpolate(awayIn, [0, 1], [80, 0]);

  // ── Goal sequence ──────────────────────────────────────────────────────
  // H1: the first goal lands on the narration beat that names the score.
  const scoreStart = beatDelay(beats, "stat", fps, SCORE_START);

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
  const goalsRevealed = goalSeq.filter((_, i) => frame >= scoreStart + i * GOAL_DELAY).length;
  const dispHome = goalSeq.slice(0, goalsRevealed).filter(g => g === "home").length;
  const dispAway = goalSeq.slice(0, goalsRevealed).filter(g => g === "away").length;

  // Scale punch per team when their goal increments
  let lastHomeFrame = -999;
  let lastAwayFrame = -999;
  goalSeq.forEach((g, i) => {
    const gf = scoreStart + i * GOAL_DELAY;
    if (gf <= frame) {
      if (g === "home") lastHomeFrame = gf;
      if (g === "away") lastAwayFrame = gf;
    }
  });

  const homeNumScale = punch(frame, lastHomeFrame);
  const awayNumScale = punch(frame, lastAwayFrame);

  const isHomeWin = homeScore > awayScore;
  const isAwayWin = awayScore > homeScore;

  // Accent rule appears just before first goal
  const ruleOp = interpolate(frame, [scoreStart - 6, scoreStart + 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <Ground ground="paper" bgColor={bgColor} accentColor={homeColor} domain="football" texture skipIntro={skipIntro} pad={0}>
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
          <Kicker label={competition} theme={t} frame={frame} />
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: t.muted }} />
          <div style={{ fontFamily: TYPE.mono, fontSize: 22, fontWeight: 400, color: t.muted, letterSpacing: 1 }}>{date}</div>
          {venue && <>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: t.muted }} />
            <div style={{ fontFamily: TYPE.mono, fontSize: 22, fontWeight: 400, color: t.muted, letterSpacing: 1 }}>{venue}</div>
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
              ? <BadgeTreatment src={`badges/${homeBadgeSlug}`} size={BADGE_SIZE} />
              : <div style={{
                  width: BADGE_SIZE, height: BADGE_SIZE, borderRadius: "50%",
                  background: `rgba(200,16,46,0.12)`, border: `3px solid rgba(200,16,46,0.35)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: TYPE.serif, fontSize: 72, fontWeight: 900, color: homeColor,
                }}>{homeTeam[0]}</div>
            }
            <div style={{ fontFamily: TYPE.serif, fontSize: 52, fontWeight: 900, color: t.ink, textAlign: "center" as const, letterSpacing: -1, lineHeight: 1.1 }}>
              {homeTeam}
            </div>
          </div>

          {/* Score */}
          <div style={{
            opacity: scoreOp, transform: `scale(${scoreScale})`,
            display: "flex", alignItems: "center", flexShrink: 0,
          }}>
            <div style={{
              fontFamily: TYPE.serif, fontSize: 200, fontWeight: 900,
              color: isHomeWin ? homeColor : t.ink,
              letterSpacing: -8, lineHeight: 1, minWidth: 130, textAlign: "center" as const,
              transform: `scale(${homeNumScale})`, transformOrigin: "center center",
              fontVariantNumeric: "tabular-nums",
            }}>
              {dispHome}
            </div>
            <div style={{ fontFamily: TYPE.sans, fontSize: 100, fontWeight: 300, color: t.muted, margin: "0 20px", lineHeight: 1 }}>–</div>
            <div style={{
              fontFamily: TYPE.serif, fontSize: 200, fontWeight: 900,
              color: isAwayWin ? awayColor : t.ink,
              letterSpacing: -8, lineHeight: 1, minWidth: 130, textAlign: "center" as const,
              transform: `scale(${awayNumScale})`, transformOrigin: "center center",
              fontVariantNumeric: "tabular-nums",
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
              ? <BadgeTreatment src={`badges/${awayBadgeSlug}`} size={BADGE_SIZE} />
              : <div style={{
                  width: BADGE_SIZE, height: BADGE_SIZE, borderRadius: "50%",
                  background: `rgba(3,70,148,0.12)`, border: `3px solid rgba(3,70,148,0.35)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: TYPE.serif, fontSize: 72, fontWeight: 900, color: awayColor,
                }}>{awayTeam[0]}</div>
            }
            <div style={{ fontFamily: TYPE.serif, fontSize: 52, fontWeight: 900, color: t.ink, textAlign: "center" as const, letterSpacing: -1, lineHeight: 1.1 }}>
              {awayTeam}
            </div>
          </div>

        </div>

        {/* Accent rule — appears just before first goal */}
        {scorers.length > 0 && (
          <div style={{
            opacity:      ruleOp,
            width:        "50%",
            height:       1,
            background:   `linear-gradient(90deg, transparent, ${t.accent}, transparent)`,
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
                const goalFrame   = scoreStart + globalIndex * GOAL_DELAY;
                const p           = prog(frame, goalFrame, 14, EASE.snap);
                return (
                  <div key={hi} style={{ opacity: p, transform: `translateY(${(1 - p) * 12}px)` }}>
                    <div style={{ fontFamily: TYPE.sans, fontSize: 28, fontWeight: 500, color: t.muted }}>
                      {scorer.name}{scorer.minute ? ` ${scorer.minute}'` : ""}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Divider */}
            <div style={{ width: 1, background: t.line, opacity: ruleOp }} />

            {/* Away scorers */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-start", minWidth: 280 }}>
              {sortedScorers.filter(s => s.team === "away").map((scorer, ai) => {
                const globalIndex = sortedScorers.indexOf(scorer);
                const goalFrame   = scoreStart + globalIndex * GOAL_DELAY;
                const p           = prog(frame, goalFrame, 14, EASE.snap);
                return (
                  <div key={ai} style={{ opacity: p, transform: `translateY(${(1 - p) * 12}px)` }}>
                    <div style={{ fontFamily: TYPE.sans, fontSize: 28, fontWeight: 500, color: t.muted }}>
                      {scorer.name}{scorer.minute ? ` ${scorer.minute}'` : ""}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </Ground>
  );
};
