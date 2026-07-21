/**
 * HeroShotMap — xG-weighted shot location map on a half-pitch.
 *
 * Motion design:
 *  - Player name types on character by character
 *  - Accent rule grows out after the name
 *  - Competition label and legend items stagger in individually
 *  - Live xG ticker counts up as shots reveal
 *  - Goal shots fire an expanding pulse ring
 *  - Outro stats card numbers count up from zero
 */
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { fontFamily, serifFontFamily, COLORS, SmartImg, WorldStateSchema, ContextChip } from "./shared";
import { Ground, EASE, prog } from "./lib/kit";

const ShotSchema = z.object({
  x:      z.number(),
  y:      z.number(),
  xg:     z.number(),
  goal:   z.boolean().default(false),
  saved:  z.boolean().default(false),
  minute: z.number().default(0),
  label:  z.string().default(""),
});

export const HeroShotMapPropsSchema = z.object({
  playerName:   z.string().default("Luis Suárez"),
  competition:  z.string().default("Premier League 2013/14"),
  playerImage:  z.string().optional(),
  totalXg:      z.number().optional(),
  totalGoals:   z.number().optional(),
  accentColor:  z.string().default("#C8102E"),
  bgColor:      z.string().default("#f0ece4"),
  stagger:      z.number().default(6),
  shots: z.array(ShotSchema).optional(),
  worldState: WorldStateSchema.optional(),
  skipIntro: z.boolean().optional().default(false),
});
export type HeroShotMapProps = z.infer<typeof HeroShotMapPropsSchema>;

// ── Pitch geometry ──────────────────────────────────────────────────────────
const PW         = 1120;
const PH         = 730;
const PITCH_LEFT = 740;
const PITCH_TOP  = 80;

const goalColor   = "#22c55e";
const noGoalColor = "#ef4444";
const savedColor  = "#f59e0b";

const toSVGX = (x: number) => PITCH_LEFT + (x / 100) * PW;
const toSVGY = (y: number) => PITCH_TOP  + (y / 100) * PH;

// ── Typewriter ──────────────────────────────────────────────────────────────
const TYPER_SPEED = 0.45; // chars per frame
const Typewriter: React.FC<{ text: string; startF: number; speed?: number; color?: string }> = ({
  text, startF, speed = TYPER_SPEED, color = "currentColor",
}) => {
  const frame = useCurrentFrame();
  const dur   = Math.max(1, text.length / speed);
  const chars = Math.floor(
    interpolate(frame, [startF, startF + dur], [0, text.length], {
      extrapolateLeft: "clamp", extrapolateRight: "clamp",
    })
  );
  const done  = chars >= text.length;
  const blink = Math.floor(frame / 8) % 2 === 0;
  return (
    <>
      {text.slice(0, chars)}
      <span style={{
        display: "inline-block", width: 3, height: "0.8em",
        background: color, verticalAlign: "text-bottom",
        marginLeft: 3, opacity: done ? 0 : (blink ? 1 : 0),
      }} />
    </>
  );
};

export const HeroShotMap: React.FC<HeroShotMapProps> = ({
  playerName, competition, playerImage, totalXg, totalGoals,
  accentColor, bgColor, stagger, shots: shotsProp, skipIntro = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const shots = shotsProp ?? [];

  // ── Timing ────────────────────────────────────────────────────────────────
  const INTRO_F      = 20;
  const NAME_START   = INTRO_F;
  const NAME_DUR     = Math.ceil(playerName.length / TYPER_SPEED);
  const COMP_START   = NAME_START + NAME_DUR + 4;
  const RULE_START   = NAME_START + NAME_DUR + 2;
  const LEGEND_START = RULE_START + 10;
  const PITCH_START  = INTRO_F;
  const SHOTS_START  = INTRO_F + 40;
  const OUTRO_F      = SHOTS_START + shots.length * stagger + 40;
  const COUNT_DUR    = 22; // frames to count up stats

  // ── Springs ───────────────────────────────────────────────────────────────
  const pitchProg  = skipIntro ? 1 : prog(frame, PITCH_START, 24, EASE.soft);
  const compProg   = skipIntro ? 1 : prog(frame, COMP_START, 22, EASE.snap);
  const ruleProg   = skipIntro ? 1 : prog(frame, RULE_START, 18, EASE.out);
  const imageProg  = skipIntro ? 1 : prog(frame, INTRO_F, 26, EASE.soft);
  const outroProg  = prog(frame, OUTRO_F, 26, EASE.soft);

  const LEGEND_ITEMS = [
    { colour: goalColor,   label: "Goal" },
    { colour: savedColor,  label: "Saved" },
    { colour: noGoalColor, label: "Off target / blocked" },
  ];
  const legendSprings = LEGEND_ITEMS.map((_, i) =>
    skipIntro ? 1 : prog(frame, LEGEND_START + i * 6, 18, EASE.snap)
  );
  const xgNoteProg = skipIntro ? 1 : prog(frame, LEGEND_START + 24, 20, EASE.snap);

  // ── Running xG ticker ─────────────────────────────────────────────────────
  const runningXg = shots.reduce((sum, sh, i) => {
    const rp = skipIntro ? 1 : Math.min(1, Math.max(0,
      prog(frame, SHOTS_START + i * stagger, 14, EASE.snap)
    ));
    return sum + sh.xg * rp;
  }, 0);
  const revealedCount = shots.reduce((n, _, i) => {
    const rp = prog(frame, SHOTS_START + i * stagger, 14, EASE.snap);
    return n + (rp > 0.05 ? 1 : 0);
  }, 0);
  const tickerProg = prog(frame, SHOTS_START, 22, EASE.snap);
  // Ticker fades out as outro card fades in
  const tickerOpacity = interpolate(tickerProg, [0, 0.6], [0, 1], { extrapolateRight: "clamp" })
    * interpolate(outroProg, [0, 0.4], [1, 0], { extrapolateRight: "clamp" });

  // ── Outro count-up ────────────────────────────────────────────────────────
  const xgTotal      = totalXg   ?? shots.reduce((s, sh) => s + sh.xg, 0);
  const gTotal       = totalGoals ?? shots.filter(sh => sh.goal).length;
  const displayXg    = interpolate(frame, [OUTRO_F, OUTRO_F + COUNT_DUR], [0, xgTotal],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const displayGoals = Math.round(interpolate(frame, [OUTRO_F, OUTRO_F + COUNT_DUR * 0.6], [0, gTotal],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));

  return (
    <Ground ground="paper" bgColor={bgColor} domain="football" texture skipIntro={skipIntro} pad={0}>
      <AbsoluteFill style={{ zIndex: 10 }}>

        {/* ── Player image ────────────────────────────────────────────── */}
        {playerImage && (
          <div style={{
            position: "absolute", left: 0, bottom: 0,
            width: 680, height: "100%",
            opacity: interpolate(imageProg, [0, 0.8], [0, 1], { extrapolateRight: "clamp" }),
            WebkitMaskImage: "linear-gradient(to right, black 30%, transparent 82%), linear-gradient(to top, black 55%, transparent 100%)",
            maskImage:       "linear-gradient(to right, black 30%, transparent 82%), linear-gradient(to top, black 55%, transparent 100%)",
            WebkitMaskComposite: "destination-in",
            maskComposite: "intersect",
            pointerEvents: "none",
            zIndex: 1,
          }}>
            <SmartImg
              src={playerImage}
              style={{
                width: "100%", height: "100%",
                objectFit: "contain", objectPosition: "bottom left",
                filter: "contrast(1.05) brightness(1.02)",
              }}
            />
          </div>
        )}

        {/* ── Title ───────────────────────────────────────────────────── */}
        <div style={{ position: "absolute", left: 72, top: 72, maxWidth: 600, zIndex: 12 }}>

          {/* "Shot Map" eyebrow — fades in immediately */}
          <div style={{
            marginBottom: 10,
            opacity: interpolate(imageProg, [0, 0.5], [0, 1], { extrapolateRight: "clamp" }),
          }}>
            <ContextChip label="Shot Map" color={COLORS.muted} size={13} />
          </div>

          {/* Player name — typewriter */}
          <div style={{
            fontFamily: serifFontFamily, fontSize: 56, fontWeight: 900,
            color: COLORS.primary, letterSpacing: -2, lineHeight: 1.05, minHeight: 68,
          }}>
            <Typewriter text={playerName} startF={NAME_START} color={COLORS.primary as string} />
          </div>

          {/* Competition — slides up after name */}
          <div style={{
            fontFamily, fontSize: 17, fontWeight: 500,
            color: COLORS.muted, letterSpacing: "0.04em", textTransform: "uppercase",
            marginTop: 8,
            opacity: interpolate(compProg, [0, 0.7], [0, 1], { extrapolateRight: "clamp" }),
            transform: `translateY(${interpolate(compProg, [0, 1], [8, 0])}px)`,
          }}>{competition}</div>

          {/* Accent rule — grows out */}
          <div style={{
            width: `${56 * ruleProg}px`, height: 3,
            background: accentColor, marginTop: 18, borderRadius: 2,
          }} />
        </div>

        {/* ── Legend ──────────────────────────────────────────────────── */}
        <div style={{ position: "absolute", left: 72, top: 340, zIndex: 12 }}>
          <div style={{
            marginBottom: 16,
            opacity: legendSprings[0],
          }}>
            <ContextChip label="Key" color={COLORS.muted} size={12} />
          </div>
          {LEGEND_ITEMS.map(({ colour, label }, i) => (
            <div key={label} style={{
              display: "flex", alignItems: "center", gap: 14, marginBottom: 20,
              opacity: legendSprings[i],
              transform: `translateX(${interpolate(legendSprings[i], [0, 1], [-12, 0])}px)`,
            }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: colour, opacity: 0.85, flexShrink: 0 }} />
              <div style={{ fontFamily, fontSize: 18, fontWeight: 500, color: COLORS.muted }}>{label}</div>
            </div>
          ))}
          <div style={{
            fontFamily, fontSize: 14, color: COLORS.muted, opacity: 0.55 * xgNoteProg,
            transform: `translateX(${interpolate(xgNoteProg, [0, 1], [-8, 0])}px)`,
          }}>
            Circle size = xG value
          </div>
        </div>

        {/* ── Live xG ticker — visible during shot reveal, fades before outro ── */}
        <div style={{
          position: "absolute", left: 72, bottom: 72,
          opacity: tickerOpacity,
          zIndex: 12,
        }}>
          <div style={{ marginBottom: 6 }}>
            <ContextChip label="Live xG" color={COLORS.muted} size={12} />
          </div>
          <div style={{
            fontFamily: serifFontFamily, fontSize: 64, fontWeight: 900,
            color: accentColor, letterSpacing: -2, lineHeight: 1,
          }}>{runningXg.toFixed(2)}</div>
          <div style={{
            fontFamily, fontSize: 13, color: COLORS.muted, marginTop: 6, opacity: 0.6,
          }}>{revealedCount} shot{revealedCount !== 1 ? "s" : ""}</div>
        </div>

        {/* ── Outro stats card ────────────────────────────────────────── */}
        <div style={{
          position: "absolute", left: 72, bottom: 72,
          opacity: interpolate(outroProg, [0, 0.7], [0, 1], { extrapolateRight: "clamp" }),
          transform: `translateY(${interpolate(outroProg, [0, 1], [16, 0])}px)`,
          zIndex: 20,
        }}>
          <div style={{ width: "100%", height: 3, background: accentColor, borderRadius: 2, marginBottom: 20 }} />
          <div style={{
            background: bgColor,
            borderRadius: 4,
            border: "1px solid rgba(0,0,0,0.08)",
            padding: "24px 32px 20px",
            display: "flex", gap: 36, alignItems: "flex-end",
            boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
          }}>
            <div>
              <div style={{
                fontFamily: serifFontFamily, fontSize: 72, fontWeight: 900,
                color: accentColor, letterSpacing: -3, lineHeight: 1,
              }}>{displayXg.toFixed(1)}</div>
              <div style={{ marginTop: 8 }}>
                <ContextChip label="Expected Goals" color={COLORS.muted} size={12} />
              </div>
            </div>
            <div style={{ width: 1, alignSelf: "stretch", background: "rgba(0,0,0,0.10)", flexShrink: 0 }} />
            <div>
              <div style={{
                fontFamily: serifFontFamily, fontSize: 72, fontWeight: 900,
                color: COLORS.primary, letterSpacing: -3, lineHeight: 1,
              }}>{displayGoals}</div>
              <div style={{ marginTop: 8 }}>
                <ContextChip label="Actual Goals" color={COLORS.muted} size={12} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Pitch SVG ───────────────────────────────────────────────── */}
        <svg
          viewBox="0 0 1920 1080"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: pitchProg }}
        >
          {/* Pitch fill */}
          <rect x={PITCH_LEFT} y={PITCH_TOP} width={PW} height={PH}
            fill={accentColor} fillOpacity={0.03}
            stroke={accentColor} strokeWidth={2} strokeOpacity={0.15} />

          {/* Penalty area — 18 yards */}
          <rect x={PITCH_LEFT + PW * 0.203} y={PITCH_TOP}
            width={PW * 0.594} height={PH * 0.36}
            fill="none" stroke={accentColor} strokeWidth={1.5} strokeOpacity={0.3} />

          {/* 6-yard box */}
          <rect x={PITCH_LEFT + PW * 0.365} y={PITCH_TOP}
            width={PW * 0.270} height={PH * 0.12}
            fill="none" stroke={accentColor} strokeWidth={1.5} strokeOpacity={0.25} />

          {/* Goal */}
          <rect x={PITCH_LEFT + PW * 0.446} y={PITCH_TOP - 22}
            width={PW * 0.108} height={22}
            fill="none" stroke={accentColor} strokeWidth={2.5} strokeOpacity={0.55} />

          {/* Penalty spot */}
          <circle cx={PITCH_LEFT + PW * 0.5} cy={PITCH_TOP + PH * 0.24} r={6}
            fill={accentColor} opacity={0.3} />

          {/* D arc */}
          <path d={`M ${PITCH_LEFT + PW * (0.5 - 0.108)} ${PITCH_TOP + PH * 0.36}
                     A ${PH * 0.20} ${PH * 0.20} 0 0 0
                       ${PITCH_LEFT + PW * (0.5 + 0.108)} ${PITCH_TOP + PH * 0.36}`}
            fill="none" stroke={accentColor} strokeWidth={1.5} strokeOpacity={0.25} />

          {/* Corner arcs */}
          <path d={`M ${PITCH_LEFT} ${PITCH_TOP + 30} A 30 30 0 0 1 ${PITCH_LEFT + 30} ${PITCH_TOP}`}
            fill="none" stroke={accentColor} strokeWidth={1.5} strokeOpacity={0.2} />
          <path d={`M ${PITCH_LEFT + PW - 30} ${PITCH_TOP} A 30 30 0 0 1 ${PITCH_LEFT + PW} ${PITCH_TOP + 30}`}
            fill="none" stroke={accentColor} strokeWidth={1.5} strokeOpacity={0.2} />

          {/* Halfway line */}
          <line x1={PITCH_LEFT} y1={PITCH_TOP + PH} x2={PITCH_LEFT + PW} y2={PITCH_TOP + PH}
            stroke={accentColor} strokeWidth={1.5} strokeOpacity={0.12} />

          {/* Yard labels */}
          {[6, 12, 18, 30].map(yd => {
            const svgY = toSVGY((yd / 50) * 100);
            if (svgY < PITCH_TOP || svgY > PITCH_TOP + PH) return null;
            return (
              <text key={yd} x={PITCH_LEFT - 14} y={svgY + 5}
                textAnchor="end" fontSize={13} fontFamily={fontFamily}
                fill={accentColor} fillOpacity={0.35}>{yd}y</text>
            );
          })}

          {/* Shots */}
          {shots.map((sh, i) => {
            const revealF   = SHOTS_START + i * stagger;
            const shotP     = prog(frame, revealF, 14, EASE.snap);
            const cx        = toSVGX(sh.x);
            const cy        = toSVGY(sh.y);
            const r         = Math.max(12, Math.min(48, sh.xg * 52));
            const colour    = sh.goal ? goalColor : sh.saved ? savedColor : noGoalColor;

            // Pulse ring — only for goals, expands once on reveal
            const pulseProg = sh.goal
              ? interpolate(frame - revealF, [0, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
              : 0;
            const pulseR   = r + pulseProg * 52;
            const pulseOp  = Math.max(0, 1 - pulseProg * 1.4);

            // Minute label fades in after shot settles
            const labelProg = prog(frame, revealF + 12, 18, EASE.snap);

            return (
              <g key={i}>
                {/* Pulse ring */}
                {sh.goal && pulseOp > 0.01 && (
                  <circle cx={cx} cy={cy} r={pulseR}
                    fill="none" stroke={goalColor} strokeWidth={2.5} opacity={pulseOp} />
                )}
                {/* Shot circle */}
                <circle
                  cx={cx} cy={cy}
                  r={r * shotP}
                  fill={colour}
                  fillOpacity={sh.goal ? 0.85 : 0.45}
                  stroke={colour}
                  strokeWidth={sh.goal ? 2.5 : 1.5}
                  strokeOpacity={shotP}
                />
                {/* Goal tick */}
                {sh.goal && (
                  <text x={cx} y={cy + 6} textAnchor="middle"
                    fontSize={18} fontWeight={700} fill="#fff" opacity={shotP}>✓</text>
                )}
                {/* Minute label */}
                {sh.minute > 0 && shotP > 0.5 && (
                  <text
                    x={cx} y={cy - r - 8}
                    textAnchor="middle" fontSize={11} fontWeight={700}
                    fontFamily={fontFamily} fill={colour} opacity={labelProg * 0.85}
                  >{sh.minute}'</text>
                )}
              </g>
            );
          })}
        </svg>

      </AbsoluteFill>
    </Ground>
  );
};
