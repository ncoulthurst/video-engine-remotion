/**
 * IntrcptGoalRush — Season-by-season goal tally that builds row by row.
 *
 * Each season slides in staggered; goals count up as the spring settles.
 * Highlighted seasons get accent colour and a larger number.
 * Career total slams in at the end with an underdamped pop.
 */
import React from "react";
import {
  AbsoluteFill,
  CalculateMetadataFunction,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";
import { fontFamily, serifFontFamily, Grain, PaperBackground, DarkBackground } from "./shared";

// ─── Schema ───────────────────────────────────────────────────────────────────

export const IntrcptGoalRushPropsSchema = z.object({
  label: z.string().optional().default("Luis Suárez"),
  title: z.string().optional().default("Club Goals"),
  seasons: z.array(z.object({
    season:    z.string(),
    club:      z.string(),
    goals:     z.number().int().min(0),
    /** Accent colour + larger number for standout seasons */
    highlight: z.boolean().optional().default(false),
  })).default([
    { season: "2010/11", club: "Ajax",      goals: 49, highlight: false },
    { season: "2011/12", club: "Liverpool", goals: 17, highlight: false },
    { season: "2012/13", club: "Liverpool", goals: 23, highlight: false },
    { season: "2013/14", club: "Liverpool", goals: 31, highlight: true  },
    { season: "2014/15", club: "Barcelona", goals: 25, highlight: false },
    { season: "2015/16", club: "Barcelona", goals: 59, highlight: true  },
  ]),
  accentColor:  z.string().optional().default("#D00027"),
  bgColor:      z.string().optional().default("#f0ece4"),
  /** Frames between each row's reveal */
  stagger:      z.number().int().min(6).default(20),
  /** Frames held after career total appears */
  holdDuration: z.number().int().min(20).default(90),
  darkMode:     z.boolean().optional().default(false),
  skipIntro:    z.boolean().optional().default(false),
});

export type IntrcptGoalRushProps = z.infer<typeof IntrcptGoalRushPropsSchema>;

// ─── Timing ───────────────────────────────────────────────────────────────────

const INTRO_F      = 24;
const TOTAL_DELAY  = 30; // extra frames after last row before total fires

export const calculateMetadata: CalculateMetadataFunction<IntrcptGoalRushProps> = async ({ props }) => ({
  durationInFrames: INTRO_F + (props.seasons.length - 1) * props.stagger + TOTAL_DELAY + props.holdDuration,
});

// ─── Spring configs ───────────────────────────────────────────────────────────

const HEADER_CFG = { damping: 24, stiffness: 60 };
const ROW_CFG    = { damping: 22, stiffness: 140 };
const TOTAL_CFG  = { damping: 7,  stiffness: 260, mass: 0.75 }; // underdamped → pop overshoot

// ─── Component ────────────────────────────────────────────────────────────────

export const IntrcptGoalRush: React.FC<IntrcptGoalRushProps> = ({
  label, title, seasons, accentColor, bgColor, stagger, holdDuration, darkMode, skipIntro,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const n           = seasons.length;
  const careerTotal = seasons.reduce((s, r) => s + r.goals, 0);
  const totalFrame  = INTRO_F + (n - 1) * stagger + TOTAL_DELAY;

  const headerSp = skipIntro ? 1 : spring({ frame, fps, config: HEADER_CFG });
  const ruleSp   = skipIntro ? 1 : spring({ frame, fps, config: { damping: 28, stiffness: 55 }, delay: 12 });
  const totalSp  = skipIntro ? 1 : spring({ frame: frame - totalFrame, fps, config: TOTAL_CFG });

  // Clamp display total so overshoot doesn't show >careerTotal
  const displayTotal = Math.round(
    interpolate(totalSp, [0, 1], [0, careerTotal], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
  );

  // Underdamped spring naturally goes above 1 — use that for scale pop on the total
  const totalScale = interpolate(totalSp, [0, 0.6, 1], [0.82, 1.06, 1.0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const accent = accentColor ?? "#D00027";
  const bg     = bgColor     ?? "#f0ece4";
  const textPrimary = darkMode ? "#f0ece4" : "#111111";
  const textMuted   = darkMode ? "rgba(240,236,228,0.5)" : "rgba(0,0,0,0.4)";
  const rowBorder   = darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";

  // Dynamic row height — tighten if there are many seasons
  const ROW_H = n > 7 ? 72 : 82;

  return (
    <AbsoluteFill>
      {darkMode ? <DarkBackground color={bg === "#f0ece4" ? "#111111" : bg} /> : <PaperBackground color={bg} />}

      <div style={{
        position:       "absolute",
        inset:          0,
        display:        "flex",
        flexDirection:  "column",
        justifyContent: "center",
        padding:        "0 130px",
      }}>

        {/* Header */}
        <div style={{
          opacity:   headerSp,
          transform: `translateY(${interpolate(headerSp, [0, 1], [14, 0])}px)`,
        }}>
          {label ? (
            <div style={{
              fontFamily,
              fontSize:      13,
              fontWeight:    700,
              letterSpacing: 4,
              textTransform: "uppercase",
              color:         accent,
              marginBottom:  10,
            }}>
              {label}
            </div>
          ) : null}

          <div style={{
            fontFamily:    serifFontFamily,
            fontSize:      50,
            fontWeight:    700,
            fontStyle:     "italic",
            color:         textPrimary,
            letterSpacing: -1.5,
            lineHeight:    1.1,
          }}>
            {title}
          </div>
        </div>

        {/* Top rule */}
        <div style={{
          height:          1.5,
          background:      textPrimary,
          opacity:         darkMode ? 0.2 : 0.14,
          transformOrigin: "left center",
          transform:       `scaleX(${ruleSp})`,
          margin:          "22px 0 0",
        }} />

        {/* Season rows */}
        {seasons.map((row, i) => {
          const sp = skipIntro ? 1 : spring({ frame: frame - (INTRO_F + i * stagger), fps, config: ROW_CFG });

          const displayGoals = Math.round(
            interpolate(sp, [0, 1], [0, row.goals], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
          );

          const hi = row.highlight ?? false;

          return (
            <React.Fragment key={i}>
              <div style={{
                display:    "flex",
                alignItems: "center",
                height:     ROW_H,
                opacity:    sp,
                transform:  `translateX(${interpolate(sp, [0, 1], [-24, 0])}px)`,
              }}>
                {/* Season label */}
                <div style={{
                  fontFamily,
                  fontSize:      14,
                  fontWeight:    600,
                  letterSpacing: 1.5,
                  color:         textMuted,
                  width:         110,
                  flexShrink:    0,
                }}>
                  {row.season}
                </div>

                {/* Club name */}
                <div style={{
                  fontFamily,
                  fontSize:      hi ? 22 : 18,
                  fontWeight:    hi ? 800 : 600,
                  color:         hi ? textPrimary : textMuted,
                  flex:          1,
                  letterSpacing: hi ? 0.4 : 0.1,
                }}>
                  {row.club}
                </div>

                {/* Goals */}
                <div style={{
                  fontFamily,
                  fontSize:           hi ? 58 : 48,
                  fontWeight:         900,
                  letterSpacing:      -2.5,
                  color:              hi ? accent : "#1a1a1a",
                  minWidth:           90,
                  textAlign:          "right",
                  fontVariantNumeric: "tabular-nums",
                  lineHeight:         1,
                }}>
                  {displayGoals}
                </div>
              </div>

              {/* Row divider */}
              <div style={{
                height:  1,
                background: rowBorder,
                opacity: sp,
              }} />
            </React.Fragment>
          );
        })}

        {/* Bottom rule — draws in with total */}
        <div style={{
          height:          2,
          background:      textPrimary,
          opacity:         Math.min(totalSp * 3, 1) * (darkMode ? 0.18 : 0.12),
          transformOrigin: "left center",
          transform:       `scaleX(${Math.min(totalSp * 3, 1)})`,
          marginTop:       2,
        }} />

        {/* Career total */}
        <div style={{
          display:    "flex",
          alignItems: "baseline",
          marginTop:  22,
          opacity:    Math.min(totalSp * 4, 1),
          transform:  `scale(${totalScale})`,
          transformOrigin: "left bottom",
        }}>
          <div style={{
            fontFamily,
            fontSize:      13,
            fontWeight:    700,
            letterSpacing: 4,
            textTransform: "uppercase",
            color:         textMuted,
            marginRight:   30,
            paddingBottom: 10,
          }}>
            Career Total
          </div>

          <div style={{
            fontFamily,
            fontSize:           96,
            fontWeight:         900,
            letterSpacing:      -5,
            color:              accent,
            fontVariantNumeric: "tabular-nums",
            lineHeight:         1,
          }}>
            {displayTotal}
          </div>
        </div>

      </div>

      <div style={{ position: "absolute", inset: 0, zIndex: 10, pointerEvents: "none" }}>
        <Grain />
      </div>
    </AbsoluteFill>
  );
};
