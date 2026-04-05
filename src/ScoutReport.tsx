/**
 * ScoutReport — Analytics dossier for a single player acquisition.
 *
 * Dark card with an editorial analytics feel — like the actual spreadsheet
 * Tony Khan's team used. Player name large at top, signing details, a 2×3
 * metric grid, and a headline "reason we signed him" stat at the bottom.
 *
 * Reveal sequence: header strip → player name → origin info → divider →
 * metrics stagger in (left then right) → headline stat blooms in.
 */
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { fontFamily, serifFontFamily, Grain, DarkBackground, PaperBackground, COLORS, SPRINGS, rgbaFromHex } from "./shared";

// ══════════════════════════════════════════════════════════════════════════════
// SCHEMA
// ══════════════════════════════════════════════════════════════════════════════

const MetricSchema = z.object({
  label:   z.string().optional().default(""),
  value:   z.string().optional().default(""),
  detail:  z.string().optional().default(""),   // e.g., "in 38 appearances"
  bar:     z.number().min(0).max(100).optional(),  // 0-100 percentile bar
});

export const ScoutReportPropsSchema = z.object({
  playerName:   z.string().optional().default("Ollie Watkins"),
  origin:       z.string().optional().default("Exeter City"),
  league:       z.string().optional().default("EFL League Two"),
  signingFee:   z.string().optional().default("£1.8m"),
  signingYear:  z.string().optional().default("2017"),
  playerAge:    z.number().default(21),
  headline:     z.string().optional().default("25 goals in 35 Championship apps"),
  headlineStat: z.string().optional().default("25"),
  headlineUnit: z.string().optional().default("goals"),
  accentColor:  z.string().optional().default("#E30613"),
  bgColor:      z.string().optional().default("#0f0f0f"),
  lightMode:    z.boolean().default(false),
  metrics:      z.array(MetricSchema).default([
    { label: "Goals",        value: "25",   detail: "Championship 19/20",  bar: 92 },
    { label: "Assists",      value: "7",    detail: "same season",         bar: 78 },
    { label: "Shots/90",     value: "3.4",  detail: "top 5% in league",   bar: 96 },
    { label: "Dribbles/90",  value: "2.1",  detail: "direct runner",       bar: 85 },
    { label: "Age at sign",  value: "21",   detail: "high sell-on value",  bar: 70 },
    { label: "Fee paid",     value: "£1.8m",detail: "below market",        bar: 15 },
  ]),
});

export type ScoutReportProps = z.infer<typeof ScoutReportPropsSchema>;

// ══════════════════════════════════════════════════════════════════════════════
// LAYOUT
// ══════════════════════════════════════════════════════════════════════════════

const SCREEN_W = 1920;
const SCREEN_H = 1080;
const CARD_L   = 200;
const CARD_R   = SCREEN_W - 200;
const CARD_W   = CARD_R - CARD_L;
const CARD_T   = 60;

// ══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════════════════

function clamp01(v: number) { return Math.max(0, Math.min(1, v)); }

// ── Timing ────────────────────────────────────────────────────────────────────
const STRIP_F      = 0;
const NAME_F       = 18;
const ORIGIN_F     = 32;
const DIVIDER_F    = 44;
const METRICS_F    = 60;
const METRIC_STAGGER = 14;
const HEADLINE_F   = METRICS_F + 6 * METRIC_STAGGER + 30;

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

export const ScoutReport: React.FC<ScoutReportProps> = ({
  playerName,
  origin,
  league,
  signingFee,
  signingYear,
  playerAge,
  headline,
  headlineStat,
  headlineUnit,
  accentColor,
  bgColor,
  lightMode,
  metrics,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const textColor = lightMode ? COLORS.primary    : "#f0ece4";
  const subColor  = lightMode ? COLORS.secondary  : "rgba(255,255,255,0.55)";
  const mutedCol  = lightMode ? COLORS.muted      : "rgba(255,255,255,0.35)";
  const divColor  = lightMode ? "rgba(0,0,0,0.10)": "rgba(255,255,255,0.08)";
  const cardBg    = lightMode ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.04)";
  const barBg     = lightMode ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.06)";
  const accRgba   = (a: number) => rgbaFromHex(accentColor, a);

  // ── Reveal progs ──────────────────────────────────────────────────────────
  const stripProg  = clamp01(spring({ frame: frame - STRIP_F,   fps, config: { damping: 22, stiffness: 60 } }));
  const nameProg   = clamp01(spring({ frame: frame - NAME_F,    fps, config: { damping: 20, stiffness: 52 } }));
  const originProg = clamp01(spring({ frame: frame - ORIGIN_F,  fps, config: SPRINGS.feature }));
  const divProg    = clamp01(spring({ frame: frame - DIVIDER_F, fps, config: { damping: 22, stiffness: 80 } }));

  const metricProgs = metrics.map((_, i) =>
    clamp01(spring({ frame: frame - METRICS_F - i * METRIC_STAGGER, fps, config: { damping: 18, stiffness: 80 } }))
  );

  const hlProg = clamp01(spring({ frame: frame - HEADLINE_F, fps, config: { damping: 16, stiffness: 45 } }));

  const cols = 3;
  const rows = Math.ceil(metrics.length / cols);

  return (
    <AbsoluteFill>
      {lightMode ? <PaperBackground color={bgColor} /> : <DarkBackground color={bgColor} />}
      <Grain />

      {/* ── Top classification strip ─────────────────────────────────────── */}
      <div style={{
        position:   "absolute",
        top:        0,
        left:       0,
        right:      0,
        height:     interpolate(stripProg, [0, 1], [0, 56]),
        background: accentColor,
        overflow:   "hidden",
        display:    "flex",
        alignItems: "center",
        paddingLeft: CARD_L,
        gap:        32,
      }}>
        <div style={{
          fontFamily,
          fontSize:   12,
          fontWeight: 800,
          color:      "rgba(255,255,255,0.9)",
          letterSpacing: 3.5,
          textTransform: "uppercase",
          opacity:    stripProg,
        }}>
          Acquisition Report
        </div>
        <div style={{
          fontFamily,
          fontSize:   12,
          fontWeight: 500,
          color:      "rgba(255,255,255,0.60)",
          letterSpacing: 1.5,
          textTransform: "uppercase",
          opacity:    stripProg,
        }}>
          {signingYear} · {signingFee}
        </div>
      </div>

      {/* ── Player name ───────────────────────────────────────────────────── */}
      <div style={{
        position:  "absolute",
        top:       CARD_T + 70,
        left:      CARD_L,
        opacity:   nameProg,
        transform: `translateX(${interpolate(nameProg, [0, 1], [-20, 0])}px)`,
      }}>
        <div style={{
          fontFamily:    serifFontFamily,
          fontSize:      96,
          fontWeight:    900,
          color:         textColor,
          letterSpacing: -4,
          lineHeight:    0.92,
        }}>
          {playerName}
        </div>
      </div>

      {/* ── Age badge (top-right corner) ─────────────────────────────────── */}
      <div style={{
        position:   "absolute",
        top:        CARD_T + 70,
        right:      CARD_L,
        opacity:    nameProg,
        textAlign:  "right",
      }}>
        <div style={{
          fontFamily:    serifFontFamily,
          fontSize:      72,
          fontWeight:    900,
          color:         accentColor,
          letterSpacing: -3,
          lineHeight:    1,
          opacity:       0.20,
        }}>
          {playerAge}
        </div>
        <div style={{
          fontFamily,
          fontSize:   13,
          fontWeight: 600,
          color:      mutedCol,
          letterSpacing: 2,
          textTransform: "uppercase",
          marginTop:  4,
        }}>
          Age at signing
        </div>
      </div>

      {/* ── Origin info ───────────────────────────────────────────────────── */}
      <div style={{
        position:   "absolute",
        top:        CARD_T + 190,
        left:       CARD_L,
        display:    "flex",
        alignItems: "center",
        gap:        16,
        opacity:    originProg,
        transform:  `translateY(${interpolate(originProg, [0, 1], [8, 0])}px)`,
      }}>
        <div style={{
          fontFamily,
          fontSize:   20,
          fontWeight: 500,
          color:      subColor,
        }}>
          {origin}
        </div>
        <div style={{ width: 1, height: 16, background: divColor }} />
        <div style={{
          fontFamily,
          fontSize:   20,
          fontWeight: 400,
          color:      mutedCol,
        }}>
          {league}
        </div>
      </div>

      {/* ── Divider ───────────────────────────────────────────────────────── */}
      <div style={{
        position:     "absolute",
        top:          CARD_T + 244,
        left:         CARD_L,
        width:        `${interpolate(divProg, [0, 1], [0, CARD_W])}px`,
        height:       1,
        background:   divColor,
      }} />

      {/* ── Metrics grid ─────────────────────────────────────────────────── */}
      <div style={{
        position:             "absolute",
        top:                  CARD_T + 266,
        left:                 CARD_L,
        width:                CARD_W,
        display:              "grid",
        gridTemplateColumns:  `repeat(${cols}, 1fr)`,
        gap:                  "20px 28px",
      }}>
        {metrics.map((metric, i) => {
          const mp = metricProgs[i];
          if (mp < 0.01) return <div key={i} />;

          return (
            <div
              key={i}
              style={{
                background:   cardBg,
                borderRadius: 10,
                border:       `1px solid ${divColor}`,
                padding:      "18px 20px 16px",
                opacity:      mp,
                transform:    `translateY(${interpolate(mp, [0, 1], [10, 0])}px)`,
              }}
            >
              <div style={{
                fontFamily,
                fontSize:   11,
                fontWeight: 700,
                color:      mutedCol,
                letterSpacing: 2,
                textTransform: "uppercase",
                marginBottom: 8,
              }}>
                {metric.label}
              </div>
              <div style={{
                fontFamily:    serifFontFamily,
                fontSize:      38,
                fontWeight:    900,
                color:         textColor,
                letterSpacing: -1.5,
                lineHeight:    1,
                marginBottom:  metric.bar !== undefined ? 10 : 0,
              }}>
                {metric.value}
              </div>
              {metric.detail && (
                <div style={{
                  fontFamily,
                  fontSize:   12,
                  fontWeight: 400,
                  color:      mutedCol,
                  marginTop:  4,
                  lineHeight: 1.3,
                }}>
                  {metric.detail}
                </div>
              )}
              {metric.bar !== undefined && (
                <div style={{ marginTop: 8 }}>
                  <div style={{
                    width:        "100%",
                    height:       4,
                    background:   barBg,
                    borderRadius: 2,
                    overflow:     "hidden",
                  }}>
                    <div style={{
                      width:        `${metric.bar * mp}%`,
                      height:       "100%",
                      background:   accentColor,
                      borderRadius: 2,
                      boxShadow:    `0 0 8px ${accRgba(0.4)}`,
                    }} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Headline stat (bottom) ────────────────────────────────────────── */}
      <div style={{
        position:   "absolute",
        bottom:     60,
        left:       CARD_L,
        right:      CARD_L,
        opacity:    hlProg,
        transform:  `translateY(${interpolate(hlProg, [0, 1], [20, 0])}px) scale(${interpolate(hlProg, [0, 1], [0.96, 1])})`,
        display:    "flex",
        alignItems: "baseline",
        gap:        20,
        borderTop:  `1px solid ${divColor}`,
        paddingTop: 20,
      }}>
        <div style={{
          fontFamily:    serifFontFamily,
          fontSize:      72,
          fontWeight:    900,
          color:         accentColor,
          letterSpacing: -3,
          lineHeight:    1,
        }}>
          {headlineStat}
        </div>
        <div style={{
          fontFamily,
          fontSize:   22,
          fontWeight: 500,
          color:      subColor,
          paddingBottom: 6,
        }}>
          {headlineUnit}
        </div>
        <div style={{
          fontFamily,
          fontSize:   18,
          fontWeight: 400,
          color:      mutedCol,
          paddingBottom: 6,
          marginLeft: 4,
        }}>
          — {headline}
        </div>
      </div>
    </AbsoluteFill>
  );
};
