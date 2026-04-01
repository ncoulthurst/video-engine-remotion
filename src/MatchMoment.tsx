/**
 * MatchMoment — Cinematic match score reveal.
 *
 * Dark, full-bleed card. Score digits spring in one at a time with a
 * physical bounce. Team names slide in from opposite sides. Competition
 * and date rise up from the bottom. A brief glow pulse crowns the moment.
 *
 * Use for iconic match flashbacks: "Liverpool 4-0 Barcelona", "Man City
 * 6-1 Man Utd", "England 1-4 Germany". The score IS the story.
 */
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { fontFamily, serifFontFamily, Grain, COLORS, SPRINGS, rgbaFromHex } from "./shared";

// ══════════════════════════════════════════════════════════════════════════════
// SCHEMA
// ══════════════════════════════════════════════════════════════════════════════

export const MatchMomentPropsSchema = z.object({
  homeTeam:    z.string().default("Liverpool"),
  awayTeam:    z.string().default("Barcelona"),
  homeScore:   z.number().default(4),
  awayScore:   z.number().default(0),
  competition: z.string().default("UEFA Champions League"),
  date:        z.string().default("7 May 2019"),
  context:     z.string().optional(),       // e.g., "SEMI-FINAL SECOND LEG"
  minute:      z.string().optional(),       // e.g., "79'"
  accentColor: z.string().default("#C8102E"),
  bgColor:     z.string().default("#0a0a0a"),
  homeColor:   z.string().default("#C8102E"),
  awayColor:   z.string().default("#004D98"),
});

export type MatchMomentProps = z.infer<typeof MatchMomentPropsSchema>;

// ══════════════════════════════════════════════════════════════════════════════
// LAYOUT
// ══════════════════════════════════════════════════════════════════════════════

const SCREEN_W   = 1920;
const SCREEN_H   = 1080;
const CX         = SCREEN_W / 2;
const CY         = SCREEN_H / 2;

// Score reveal timing constants
const INTRO_DUR      = 25;  // dark bg settles
const CONTEXT_F      = 30;  // context label appears
const TEAMS_F        = 48;  // team names slide in
const HOME_SCORE_F   = 82;  // home score digit bounces in
const SEP_F          = 105; // separator dash appears
const AWAY_SCORE_F   = 118; // away score digit bounces in
const GLOW_F         = 145; // accent glow pulses
const DETAILS_F      = 162; // competition + date rise up

// ══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════════════════

function clamp01(v: number) { return Math.max(0, Math.min(1, v)); }

/** Spring in a single digit with an overshoot bounce */
function digitSpring(frame: number, startF: number, fps: number) {
  return clamp01(spring({ frame: frame - startF, fps, config: { damping: 14, stiffness: 160, mass: 1 } }));
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

export const MatchMoment: React.FC<MatchMomentProps> = ({
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  competition,
  date,
  context,
  minute,
  accentColor,
  bgColor,
  homeColor,
  awayColor,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ── Background fade-in ────────────────────────────────────────────────────
  const bgProg = clamp01(spring({ frame, fps, config: { damping: 22, stiffness: 45 } }));

  // ── Context label (above score, e.g., "SEMI-FINAL SECOND LEG") ───────────
  const contextProg = clamp01(spring({ frame: frame - CONTEXT_F, fps, config: SPRINGS.header }));

  // ── Team names ────────────────────────────────────────────────────────────
  const teamProg = clamp01(spring({ frame: frame - TEAMS_F, fps, config: { damping: 20, stiffness: 55 } }));

  // ── Score digits — each bounces in separately ─────────────────────────────
  const homeDigits = String(homeScore).split("");
  const awayDigits = String(awayScore).split("");
  const homeProgs  = homeDigits.map((_, di) => digitSpring(frame, HOME_SCORE_F + di * 12, fps));
  const awayProgs  = awayDigits.map((_, di) => digitSpring(frame, AWAY_SCORE_F + di * 12, fps));
  const sepProg    = clamp01(spring({ frame: frame - SEP_F, fps, config: { damping: 18, stiffness: 90 } }));

  // ── Glow pulse ────────────────────────────────────────────────────────────
  // Pulse fades in after scores appear, oscillates slightly
  const glowProg = clamp01(spring({ frame: frame - GLOW_F, fps, config: { damping: 22, stiffness: 40 } }));
  const glowPulse = Math.sin(Math.max(0, frame - GLOW_F) * 0.05) * 0.12 + 0.88;

  // ── Competition + date ────────────────────────────────────────────────────
  const detailProg = clamp01(spring({ frame: frame - DETAILS_F, fps, config: SPRINGS.feature }));

  // ── Colour utilities ──────────────────────────────────────────────────────
  const homeRgba = (a: number) => rgbaFromHex(homeColor, a);
  const awayRgba = (a: number) => rgbaFromHex(awayColor, a);
  const accRgba  = (a: number) => rgbaFromHex(accentColor, a);

  return (
    <AbsoluteFill style={{ background: bgColor, opacity: bgProg }}>
      <Grain />

      {/* ── Ambient team colour washes — left (home) and right (away) ──── */}
      <AbsoluteFill style={{ pointerEvents: "none" }}>
        {/* Home colour — bleeds in from left */}
        <div style={{
          position:   "absolute",
          left:       0,
          top:        0,
          width:      SCREEN_W * 0.48,
          height:     SCREEN_H,
          background: `radial-gradient(ellipse 80% 100% at 0% 50%, ${homeRgba(0.22 * teamProg)} 0%, transparent 100%)`,
        }} />
        {/* Away colour — bleeds in from right */}
        <div style={{
          position:   "absolute",
          right:      0,
          top:        0,
          width:      SCREEN_W * 0.48,
          height:     SCREEN_H,
          background: `radial-gradient(ellipse 80% 100% at 100% 50%, ${awayRgba(0.22 * teamProg)} 0%, transparent 100%)`,
        }} />
      </AbsoluteFill>

      {/* ── Glow behind score ─────────────────────────────────────────────── */}
      <div style={{
        position:   "absolute",
        left:       "50%",
        top:        "50%",
        transform:  "translate(-50%, -50%)",
        width:      600,
        height:     300,
        background: `radial-gradient(ellipse at center, ${accRgba(0.18 * glowProg * glowPulse)} 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />

      {/* ── Context label (e.g., "SEMI-FINAL SECOND LEG") ─────────────────── */}
      {context && (
        <div style={{
          position:      "absolute",
          top:           CY - 260,
          left:          "50%",
          transform:     `translateX(-50%) translateY(${interpolate(contextProg, [0, 1], [-12, 0])}px)`,
          opacity:       contextProg * 0.65,
          fontFamily,
          fontSize:      16,
          fontWeight:    700,
          color:         "#ffffff",
          letterSpacing: 4,
          textTransform: "uppercase",
          whiteSpace:    "nowrap",
          textAlign:     "center",
        }}>
          {context}
        </div>
      )}

      {/* ── Thin accent separator line above score ─────────────────────────── */}
      <div style={{
        position:   "absolute",
        left:       "50%",
        top:        CY - 220,
        transform:  "translateX(-50%)",
        width:      `${interpolate(contextProg, [0, 1], [0, 80])}px`,
        height:     2,
        background: accentColor,
        borderRadius: 1,
        opacity:    0.7,
      }} />

      {/* ── Home team name — slides in from left ──────────────────────────── */}
      <div style={{
        position:   "absolute",
        top:        CY - 48,
        right:      CX + 220,
        textAlign:  "right",
        transform:  `translateX(${interpolate(teamProg, [0, 1], [-40, 0])}px)`,
        opacity:    teamProg,
      }}>
        <div style={{
          fontFamily:    serifFontFamily,
          fontSize:      42,
          fontWeight:    900,
          color:         "#ffffff",
          letterSpacing: -1.5,
          lineHeight:    1,
        }}>
          {homeTeam}
        </div>
        <div style={{
          fontFamily,
          fontSize:   13,
          fontWeight: 500,
          color:      homeRgba(0.70),
          marginTop:  6,
          letterSpacing: 2,
          textTransform: "uppercase",
        }}>
          Home
        </div>
      </div>

      {/* ── Away team name — slides in from right ─────────────────────────── */}
      <div style={{
        position:  "absolute",
        top:       CY - 48,
        left:      CX + 220,
        textAlign: "left",
        transform: `translateX(${interpolate(teamProg, [0, 1], [40, 0])}px)`,
        opacity:   teamProg,
      }}>
        <div style={{
          fontFamily:    serifFontFamily,
          fontSize:      42,
          fontWeight:    900,
          color:         "#ffffff",
          letterSpacing: -1.5,
          lineHeight:    1,
        }}>
          {awayTeam}
        </div>
        <div style={{
          fontFamily,
          fontSize:   13,
          fontWeight: 500,
          color:      awayRgba(0.70),
          marginTop:  6,
          letterSpacing: 2,
          textTransform: "uppercase",
        }}>
          Away
        </div>
      </div>

      {/* ── Score display ─────────────────────────────────────────────────── */}
      <div style={{
        position:   "absolute",
        left:       "50%",
        top:        "50%",
        transform:  "translate(-50%, -50%)",
        display:    "flex",
        alignItems: "center",
        gap:        0,
      }}>
        {/* Home digits */}
        {homeDigits.map((digit, di) => (
          <div
            key={`h${di}`}
            style={{
              fontFamily:    serifFontFamily,
              fontSize:      220,
              fontWeight:    900,
              color:         "#ffffff",
              letterSpacing: -8,
              lineHeight:    0.9,
              opacity:       homeProgs[di],
              transform:     `scale(${interpolate(homeProgs[di], [0, 0.6, 1], [0.5, 1.06, 1])}) translateY(${interpolate(homeProgs[di], [0, 1], [20, 0])}px)`,
              textShadow:    `0 0 60px ${homeRgba(0.4 * homeProgs[di])}`,
            }}
          >
            {digit}
          </div>
        ))}

        {/* Separator */}
        <div style={{
          fontFamily:    serifFontFamily,
          fontSize:      130,
          fontWeight:    400,
          color:         "rgba(255,255,255,0.30)",
          letterSpacing: 0,
          lineHeight:    1,
          marginBottom:  12,
          opacity:       sepProg,
          paddingLeft:   16,
          paddingRight:  16,
          transform:     `scale(${interpolate(sepProg, [0, 1], [0.8, 1])})`,
        }}>
          –
        </div>

        {/* Away digits */}
        {awayDigits.map((digit, di) => (
          <div
            key={`a${di}`}
            style={{
              fontFamily:    serifFontFamily,
              fontSize:      220,
              fontWeight:    900,
              color:         "#ffffff",
              letterSpacing: -8,
              lineHeight:    0.9,
              opacity:       awayProgs[di],
              transform:     `scale(${interpolate(awayProgs[di], [0, 0.6, 1], [0.5, 1.06, 1])}) translateY(${interpolate(awayProgs[di], [0, 1], [20, 0])}px)`,
              textShadow:    `0 0 60px ${awayRgba(0.4 * awayProgs[di])}`,
            }}
          >
            {digit}
          </div>
        ))}
      </div>

      {/* ── Minute indicator (optional, top-right) ────────────────────────── */}
      {minute && (
        <div style={{
          position:   "absolute",
          top:        CY - 225,
          right:      180,
          opacity:    sepProg * 0.7,
          fontFamily,
          fontSize:   22,
          fontWeight: 700,
          color:      "#ffffff",
          letterSpacing: 0.5,
          transform:  `translateY(${interpolate(sepProg, [0, 1], [10, 0])}px)`,
        }}>
          {minute}
        </div>
      )}

      {/* ── Competition + date ────────────────────────────────────────────── */}
      <div style={{
        position:  "absolute",
        bottom:    130,
        left:      "50%",
        transform: `translateX(-50%) translateY(${interpolate(detailProg, [0, 1], [16, 0])}px)`,
        opacity:   detailProg * 0.65,
        textAlign: "center",
      }}>
        <div style={{
          fontFamily,
          fontSize:      16,
          fontWeight:    600,
          color:         "#ffffff",
          letterSpacing: 3,
          textTransform: "uppercase",
        }}>
          {competition}
        </div>
        <div style={{
          fontFamily,
          fontSize:   14,
          fontWeight: 400,
          color:      "rgba(255,255,255,0.50)",
          marginTop:  6,
          letterSpacing: 1,
        }}>
          {date}
        </div>
      </div>

      {/* ── Vignette ──────────────────────────────────────────────────────── */}
      <AbsoluteFill style={{
        background:    "radial-gradient(ellipse 90% 80% at center, transparent 40%, rgba(0,0,0,0.55) 100%)",
        pointerEvents: "none",
      }} />
    </AbsoluteFill>
  );
};
