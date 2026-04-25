/**
 * IntrcptTactical — Editorial tactical-pitch annotation with opposition + depth.
 *
 * Two-team broadcast aesthetic. Own team in `teamColor` press toward
 * opposition (in `oppositionColor`) with curved Bézier arrows targetting
 * specific opposition nodes. CSS perspective tilt on the whole pitch for
 * 3D depth (broadcast camera angle, ~8°). Player dots counter-rotate so
 * they billboard the camera (labels stay readable).
 *
 * Arrow design:
 *  - Curved cubic Bézier paths (off-ball runs are never straight). Control
 *    points perpendicular to the chord, side alternating per arrow index.
 *  - Tapered stroke via doubled-path technique (thick body 0→72%, thin
 *    neck 55→100%, soft overlap → visible narrowing into the arrowhead).
 *  - `feDropShadow` filter (no fuzzy Gaussian).
 *  - `pathLength=1` normalized clearance.
 *  - Arrowhead overshoots scale 1.0 → 1.15 → 1.0 across 3 frames at arrival.
 *  - Aftertrail: body fades to 0.30 ghost opacity once head lands.
 *  - Player drift on the originating dot during arrow draw.
 *  - **Target pulse**: when an arrow has `targetIndex`, the opposition
 *    player at that index pulses (scale 1.0 → 1.2 → 1.0, brief brightness)
 *    when the arrowhead arrives — reads as "pressed at source."
 *
 * Stack: Bg (0) → perspective pitch group (grass + markings + arrows +
 *         opposition + own players) → folio (12) → Grain (LAST).
 */

import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";
import { fontFamily, serifFontFamily, Grain, WorldStateSchema } from "./shared";

// ── Schema ────────────────────────────────────────────────────────────────────

const PlayerDotSchema = z.object({
  label: z.string().optional().default(""),
  x: z.number(),
  y: z.number(),
  /** Optional press/end position. When set, the dot animates from (x,y) to
   *  (pressX,pressY) once the press phase fires — lets the LLM choreograph
   *  formation shifts (gegenpressing squeeze, possession-play half-space
   *  rotation, low-block compaction, high-line trap, etc). */
  pressX: z.number().optional(),
  pressY: z.number().optional(),
});

const ArrowSchema = z.object({
  fromX: z.number(),
  fromY: z.number(),
  toX:   z.number(),
  toY:   z.number(),
  /** Optional: index into `oppositionPlayers`. When set, the arrow's tip
   *  resolves to that opposition node (overriding toX/toY) AND the target
   *  node receives a pulse highlight at arrowhead arrival. */
  targetIndex: z.number().int().optional(),
  style: z.enum(["solid", "dashed"]).default("solid"),
});

export const IntrcptTacticalPropsSchema = z.object({
  title:       z.string().optional().default("the press"),
  description: z.string().optional().default("Coordinated high press from the front three traps the build-up at source."),
  /** Kept for back-compat; no longer rendered. */
  dateline:    z.string().optional().default(""),
  /** Kept for back-compat; no longer rendered. */
  source:      z.string().optional().default(""),

  /** Own team — the pressers (default: 4-3-3 with high front three). */
  players: z.array(PlayerDotSchema).default([
    { label: "GK", x: 50, y: 88 }, { label: "RB", x: 80, y: 72 }, { label: "CB", x: 62, y: 72 },
    { label: "CB", x: 38, y: 72 }, { label: "LB", x: 20, y: 72 }, { label: "CM", x: 65, y: 55 },
    { label: "DM", x: 50, y: 58 }, { label: "CM", x: 35, y: 55 }, { label: "RW", x: 78, y: 36 },
    { label: "ST", x: 50, y: 30 }, { label: "LW", x: 22, y: 36 },
  ]),

  /** Opposition — the team with the ball, holding deep (default: 4-2-3-1 holding). */
  oppositionPlayers: z.array(PlayerDotSchema).default([
    { label: "GK", x: 50, y: 10 },
    { label: "RB", x: 78, y: 22 }, { label: "CB", x: 60, y: 22 },
    { label: "CB", x: 40, y: 22 }, { label: "LB", x: 22, y: 22 },
    { label: "DM", x: 55, y: 40 }, { label: "DM", x: 45, y: 40 },
    { label: "RW", x: 72, y: 58 }, { label: "AM", x: 50, y: 58 }, { label: "LW", x: 28, y: 58 },
    { label: "ST", x: 50, y: 72 },
  ]),

  /** Default arrows: own front three press the opposition back four;
   *  own midfield two cover-shadow opposition pivot. */
  arrows: z.array(ArrowSchema).default([
    { fromX: 78, fromY: 36, toX: 0, toY: 0, targetIndex: 1, style: "solid"  }, // RW → opposition RB
    { fromX: 50, fromY: 30, toX: 0, toY: 0, targetIndex: 2, style: "solid"  }, // ST → opposition CB
    { fromX: 22, fromY: 36, toX: 0, toY: 0, targetIndex: 4, style: "solid"  }, // LW → opposition LB
    { fromX: 65, fromY: 55, toX: 0, toY: 0, targetIndex: 5, style: "dashed" }, // CM → opposition DM (cover)
    { fromX: 35, fromY: 55, toX: 0, toY: 0, targetIndex: 6, style: "dashed" }, // CM → opposition DM (cover)
  ]),

  teamColor:       z.string().optional().default("#C8102E"),
  oppositionColor: z.string().optional().default("#1F4E8C"),
  accentColor:     z.string().optional().default("#C8102E"),
  textColor:       z.string().optional().default("#f5f0e8"),
  bgColor:         z.string().optional().default("#141414"),
  // Track E — optional manager / featured-player portrait
  playerImage:     z.string().optional().default(""),
  worldState:      WorldStateSchema.optional(),
  skipIntro:       z.boolean().optional().default(false),
});

export type IntrcptTacticalProps = z.infer<typeof IntrcptTacticalPropsSchema>;

// ── Layout ────────────────────────────────────────────────────────────────────

const PITCH_W = 700;
const PITCH_H = 920;
const PITCH_X = 940;
const PITCH_Y = (1080 - PITCH_H) / 2;
const DOT_R     = 28;        // own players
const DOT_R_OPP = 24;        // opposition (slightly subordinate)
const TILT_DEG  = 8;         // CSS perspective tilt for depth

const px = (xPct: number) => PITCH_X + (xPct / 100) * PITCH_W;
const py = (yPct: number) => PITCH_Y + (yPct / 100) * PITCH_H;

// ── Animation timing ──────────────────────────────────────────────────────────

// SaaS-style float-in entry: pitch glides down + forward into its resting pose
const PITCH_ENTRY_F   = 0;
const PITCH_ENTRY_DUR = 52;     // ~1.7s @ 30fps — long enough to read as "settling"
const PLAYERS_START   = 60;     // wait for pitch to land before placing players
const PLAYER_STAGGER  = 5;
const OPPOSITION_OFFSET = 32;
const FOLIO_F         = 80;
const CAPTION_F       = 100;
const ARROW_START     = 150;
const ARROW_STAGGER   = 22;

// Press-position move: animates each player from (x,y) → (pressX,pressY)
// using the same easeOutExpo curve as the entry, starting just before the
// first arrow draws so the formation shift leads into the arrow trace.
const PRESS_MOVE_START = ARROW_START - 12;   // 138 — fires before first arrow
const PRESS_MOVE_DUR   = 38;

const BODY_DUR        = 26;
const HEAD_OVERSHOOT  = 3;
const TRAIL_FADE_DUR  = 18;
const DRIFT_DUR       = 30;
const PULSE_PEAK      = 6;       // frames after head-land where pulse peaks
const PULSE_DUR       = 22;      // total pulse window

// ── Helpers ───────────────────────────────────────────────────────────────────

function bezierControlPoints(
  x1: number, y1: number, x2: number, y2: number, side: 1 | -1,
): { c1x: number; c1y: number; c2x: number; c2y: number } {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = -dy / len;
  const ny =  dx / len;
  const mag = Math.max(30, Math.min(110, len * 0.22));
  const c1x = x1 + dx * 0.33 + nx * mag * side;
  const c1y = y1 + dy * 0.33 + ny * mag * side;
  const c2x = x1 + dx * 0.67 + nx * mag * side;
  const c2y = y1 + dy * 0.67 + ny * mag * side;
  return { c1x, c1y, c2x, c2y };
}

function evalBezier(
  x1: number, y1: number, c1x: number, c1y: number,
  c2x: number, c2y: number, x2: number, y2: number, t: number,
): { x: number; y: number; tx: number; ty: number } {
  const u = 1 - t;
  const x = u*u*u*x1 + 3*u*u*t*c1x + 3*u*t*t*c2x + t*t*t*x2;
  const y = u*u*u*y1 + 3*u*u*t*c1y + 3*u*t*t*c2y + t*t*t*y2;
  const tx = 3*u*u*(c1x - x1) + 6*u*t*(c2x - c1x) + 3*t*t*(x2 - c2x);
  const ty = 3*u*u*(c1y - y1) + 6*u*t*(c2y - c1y) + 3*t*t*(y2 - c2y);
  return { x, y, tx, ty };
}

// ── Component ─────────────────────────────────────────────────────────────────

export const IntrcptTactical: React.FC<IntrcptTacticalProps> = ({
  title,
  description,
  players,
  oppositionPlayers,
  arrows,
  teamColor,
  oppositionColor,
  accentColor,
  textColor,
  bgColor,
  skipIntro = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const mutedColor = "rgba(245,240,232,0.42)";

  // ── Pitch entry — SaaS-style float in from above ──────────────────────────
  // Single eased progress drives translateY + translateZ + rotateX + scale.
  // Easing.bezier(0.16, 1, 0.3, 1) is the iOS easeOutExpo curve — heavy
  // deceleration, soft landing, no spring overshoot. Same feel as Linear,
  // Stripe, Vercel hero graphics.
  const entryProg = skipIntro
    ? 1
    : interpolate(frame, [PITCH_ENTRY_F, PITCH_ENTRY_F + PITCH_ENTRY_DUR], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      });

  // Opacity rises faster than position settles (in the first ~55% of entry)
  // so the pitch is visible during the bulk of the float-in.
  const pitchOpacity = skipIntro
    ? 1
    : interpolate(entryProg, [0, 0.55], [0, 1], { extrapolateRight: "clamp" });

  // Compose entry deltas — at prog 0 the pitch sits above + back + tilted-down.
  const entryTranslateY = interpolate(entryProg, [0, 1], [-140, 0]);
  const entryTranslateZ = interpolate(entryProg, [0, 1], [-220, 0]);
  const entryRotateX    = interpolate(entryProg, [0, 1], [32, TILT_DEG]);   // settles to resting tilt
  const entryScale      = interpolate(entryProg, [0, 1], [0.92, 1.0]);

  // Legacy alias — used by elements that should follow the pitch's overall
  // visibility (markings opacity, dot opacity scaling, etc.).
  const pitchProg = pitchOpacity;

  const folioProg = skipIntro
    ? 1
    : spring({ frame: frame - FOLIO_F, fps, config: { damping: 24, stiffness: 60 } });
  const captionProg = skipIntro
    ? 1
    : spring({ frame: frame - CAPTION_F, fps, config: { damping: 22, stiffness: 52 } });
  const ruleProg = skipIntro
    ? 1
    : spring({ frame: frame - (FOLIO_F + 14), fps, config: { damping: 26, stiffness: 60 } });

  // ── Press-position move progress ──────────────────────────────────────────
  // Single eased value driving every player's (x,y) → (pressX,pressY) shift.
  // Same easeOutExpo curve as the pitch entry — visual cohesion.
  const pressProg = skipIntro
    ? 1
    : interpolate(frame, [PRESS_MOVE_START, PRESS_MOVE_START + PRESS_MOVE_DUR], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      });

  /** Resolve a player's animated position. If pressX/pressY are set,
   *  interpolate from (x,y) → (pressX,pressY) by `pressProg`. */
  const resolvePos = (p: { x: number; y: number; pressX?: number; pressY?: number }) => {
    const tx = p.pressX !== undefined ? p.pressX : p.x;
    const ty = p.pressY !== undefined ? p.pressY : p.y;
    return {
      x: p.x + (tx - p.x) * pressProg,
      y: p.y + (ty - p.y) * pressProg,
    };
  };

  // ── Per-player entry springs (own team) ───────────────────────────────────
  const playerProgs = players.map((_, i) =>
    skipIntro
      ? 1
      : spring({
          frame: frame - (PLAYERS_START + i * PLAYER_STAGGER),
          fps,
          config: { damping: 16, stiffness: 160 },
        }),
  );

  // ── Per-player entry springs (opposition — appear after own team) ────────
  const oppositionProgs = oppositionPlayers.map((_, i) =>
    skipIntro
      ? 1
      : spring({
          frame: frame - (PLAYERS_START + OPPOSITION_OFFSET + i * PLAYER_STAGGER),
          fps,
          config: { damping: 16, stiffness: 160 },
        }),
  );

  // ── Pre-compute arrow geometry + per-arrow timing ─────────────────────────
  const arrowStates = arrows.map((arrow, i) => {
    // Resolve target — if `targetIndex` is set and valid, use opposition coords
    const target = arrow.targetIndex !== undefined && oppositionPlayers[arrow.targetIndex]
      ? oppositionPlayers[arrow.targetIndex]
      : null;

    // Find the originating player (if any) so the arrow tail tracks its
    // animated position when the press shifts. Same for the target node.
    const fromPlayer = players.find((p) => p.x === arrow.fromX && p.y === arrow.fromY);
    const fromPos    = fromPlayer ? resolvePos(fromPlayer) : { x: arrow.fromX, y: arrow.fromY };
    const targetPos  = target ? resolvePos(target) : null;

    const x1 = px(fromPos.x);
    const y1 = py(fromPos.y);
    const x2 = targetPos ? px(targetPos.x) : px(arrow.toX);
    const y2 = targetPos ? py(targetPos.y) : py(arrow.toY);

    const side: 1 | -1 = i % 2 === 0 ? 1 : -1;
    const { c1x, c1y, c2x, c2y } = bezierControlPoints(x1, y1, x2, y2, side);
    const d = `M ${x1} ${y1} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x2} ${y2}`;

    const localStart = ARROW_START + i * ARROW_STAGGER;
    const local = skipIntro ? BODY_DUR + HEAD_OVERSHOOT + TRAIL_FADE_DUR : frame - localStart;

    const bodyDraw = skipIntro
      ? 1
      : interpolate(local, [0, BODY_DUR], [0, 1], {
          extrapolateLeft: "clamp", extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        });

    const headLandFrame = BODY_DUR;
    const headT = local - headLandFrame;
    const headOpacity = skipIntro
      ? 1
      : interpolate(headT, [-3, 0], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const headScale = skipIntro
      ? 1
      : interpolate(headT, [0, HEAD_OVERSHOOT * 0.5, HEAD_OVERSHOOT],
          [1.0, 1.15, 1.0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

    const trailStart = BODY_DUR + HEAD_OVERSHOOT;
    const bodyOpacity = skipIntro
      ? 0.30
      : interpolate(local, [trailStart, trailStart + TRAIL_FADE_DUR],
          [arrow.style === "solid" ? 1.0 : 0.7, 0.30],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

    const driftMag = 8;
    const dirX = (x2 - x1) / Math.max(1, Math.hypot(x2 - x1, y2 - y1));
    const dirY = (y2 - y1) / Math.max(1, Math.hypot(x2 - x1, y2 - y1));
    const driftEnv = skipIntro
      ? 0
      : interpolate(local, [0, DRIFT_DUR * 0.5, DRIFT_DUR], [0, 1, 0], {
          extrapolateLeft: "clamp", extrapolateRight: "clamp",
          easing: Easing.inOut(Easing.cubic),
        });

    return {
      x1, y1, x2, y2, c1x, c1y, c2x, c2y, d,
      bodyDraw, bodyOpacity, headOpacity, headScale,
      driftDx: dirX * driftMag * driftEnv,
      driftDy: dirY * driftMag * driftEnv,
      style: arrow.style,
      headLandAbsoluteFrame: localStart + headLandFrame,
      targetIndex: arrow.targetIndex,
    };
  });

  // ── Per-opposition pulse: triggered when ANY arrow targeting it lands ─────
  const oppositionPulses = oppositionPlayers.map((_, idx) => {
    if (skipIntro) return 0;
    let env = 0;
    arrowStates.forEach((s) => {
      if (s.targetIndex === idx) {
        const t = frame - s.headLandAbsoluteFrame;
        const e = interpolate(t, [0, PULSE_PEAK, PULSE_DUR], [0, 1, 0], {
          extrapolateLeft: "clamp", extrapolateRight: "clamp",
          easing: Easing.inOut(Easing.cubic),
        });
        if (e > env) env = e;
      }
    });
    return env;
  });

  // ── Per-own-player drift accumulation ─────────────────────────────────────
  const playerDrifts = players.map((p) => {
    let dx = 0, dy = 0;
    arrows.forEach((arrow, i) => {
      if (arrow.fromX === p.x && arrow.fromY === p.y) {
        dx += arrowStates[i].driftDx;
        dy += arrowStates[i].driftDy;
      }
    });
    return { dx, dy };
  });

  // ── Pitch markings geometry ───────────────────────────────────────────────
  const lineCol = "rgba(255,255,255,0.55)";
  const sw = 1.5;
  const pad = 14;
  const iW = PITCH_W - pad * 2;
  const iH = PITCH_H - pad * 2;
  const cx = PITCH_X + PITCH_W / 2;
  const cy = PITCH_Y + PITCH_H / 2;
  const pAW = iW * 0.62;  const pAH = iH * 0.152;
  const pAX = PITCH_X + pad + (iW - pAW) / 2;
  const gAW = iW * 0.36;  const gAH = iH * 0.057;
  const gAX = PITCH_X + pad + (iW - gAW) / 2;

  const HEAD_SIZE = 14;

  // ── 3D depth wrapper (perspective + tilt + entry float) ──────────────────
  // The whole pitch group sits inside a perspective container; the inner
  // group rotates around its bottom edge so the top of the pitch recedes.
  // During entry the rotateX is more aggressive (32°), translates negative
  // Y/Z (above + back), and scales down — settles to the resting pose over
  // PITCH_ENTRY_DUR frames with an iOS easeOutExpo curve.
  // Player dots counter-rotate by the *current* tilt so labels stay readable
  // throughout the entry.
  const pitchGroupTransform =
    `translateY(${entryTranslateY}px) ` +
    `translateZ(${entryTranslateZ}px) ` +
    `rotateX(${entryRotateX}deg) ` +
    `scale(${entryScale})`;
  const pitchGroupOrigin = "50% 100%";
  const dotCounterRotate = `rotateX(-${entryRotateX}deg)`;

  return (
    <AbsoluteFill style={{ background: bgColor, fontFamily }}>
      {/* PERSPECTIVE WRAPPER — gives the pitch 3D depth */}
      <div style={{
        position: "absolute",
        inset: 0,
        perspective: "2400px",
        perspectiveOrigin: `${cx}px ${PITCH_Y + PITCH_H * 0.7}px`,
      }}>
        <div style={{
          position: "absolute",
          inset: 0,
          transform: pitchGroupTransform,
          transformOrigin: pitchGroupOrigin,
          transformStyle: "preserve-3d",
        }}>
          {/* Z-1 — Grass + vignette */}
          <div style={{
            position: "absolute",
            left: PITCH_X, top: PITCH_Y,
            width: PITCH_W, height: PITCH_H,
            borderRadius: 8,
            overflow: "hidden",
            opacity: pitchProg,
            zIndex: 1,
            boxShadow: "0 30px 80px rgba(0,0,0,0.55), 0 12px 30px rgba(0,0,0,0.45)",
          }}>
            {/* Mowing stripes */}
            {Array.from({ length: 14 }).map((_, i) => (
              <div key={i} style={{
                position: "absolute",
                top: i * (PITCH_H / 14),
                left: 0,
                width: PITCH_W,
                height: PITCH_H / 14 + 0.5,
                backgroundColor: i % 2 === 0 ? "#1f5c2e" : "#236832",
              }} />
            ))}
            {/* Top-edge horizon shadow — overhead-light feel */}
            <div style={{
              position: "absolute",
              top: 0, left: 0, right: 0, height: 220,
              background: "linear-gradient(to bottom, rgba(0,0,0,0.30) 0%, transparent 100%)",
              pointerEvents: "none",
            }} />
            {/* Bottom-edge depth shadow */}
            <div style={{
              position: "absolute",
              bottom: 0, left: 0, right: 0, height: 100,
              background: "linear-gradient(to top, rgba(0,0,0,0.18) 0%, transparent 100%)",
              pointerEvents: "none",
            }} />
            {/* Stronger radial vignette */}
            <div style={{
              position: "absolute",
              inset: 0,
              background: "radial-gradient(ellipse 110% 105% at 50% 50%, transparent 55%, rgba(0,0,0,0.45) 100%)",
              pointerEvents: "none",
            }} />
          </div>

          {/* Pitch markings (SVG) */}
          <svg width={1920} height={1080} style={{
            position: "absolute", top: 0, left: 0, pointerEvents: "none", zIndex: 1,
          }}>
            <rect x={PITCH_X + pad} y={PITCH_Y + pad} width={iW} height={iH}
              stroke={lineCol} strokeWidth={sw} fill="none" rx={2} opacity={pitchProg} />
            <line x1={PITCH_X + pad} y1={cy} x2={PITCH_X + PITCH_W - pad} y2={cy}
              stroke={lineCol} strokeWidth={sw} opacity={pitchProg} />
            <circle cx={cx} cy={cy} r={iW * 0.142} stroke={lineCol} strokeWidth={sw} fill="none" opacity={pitchProg} />
            <circle cx={cx} cy={cy} r={4} fill={lineCol} opacity={pitchProg} />
            <rect x={pAX} y={PITCH_Y + pad} width={pAW} height={pAH} stroke={lineCol} strokeWidth={sw} fill="none" opacity={pitchProg} />
            <rect x={gAX} y={PITCH_Y + pad} width={gAW} height={gAH} stroke={lineCol} strokeWidth={sw} fill="none" opacity={pitchProg} />
            <rect x={pAX} y={PITCH_Y + PITCH_H - pad - pAH} width={pAW} height={pAH} stroke={lineCol} strokeWidth={sw} fill="none" opacity={pitchProg} />
            <rect x={gAX} y={PITCH_Y + PITCH_H - pad - gAH} width={gAW} height={gAH} stroke={lineCol} strokeWidth={sw} fill="none" opacity={pitchProg} />
          </svg>

          {/* Z-5 — Arrows */}
          <svg width={1920} height={1080} style={{
            position: "absolute", top: 0, left: 0, pointerEvents: "none", zIndex: 5,
          }}>
            <defs>
              <filter id="tactical-arrow-shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="2.4" floodColor="#000" floodOpacity="0.55" />
              </filter>
            </defs>

            {arrowStates.map((a, i) => {
              const isSolid = a.style === "solid";
              const chord = Math.hypot(a.x2 - a.x1, a.y2 - a.y1) || 1;
              const startClear = (DOT_R + 6) / chord;
              const endClear   = (DOT_R_OPP + (isSolid ? 14 : 8)) / chord;
              const usableLen  = Math.max(0.05, 1 - startClear - endClear);

              const bodyEnd = startClear + usableLen * a.bodyDraw;
              const bodyDashArray  = `${Math.max(0, bodyEnd - startClear)} 1`;
              const bodyDashOffset = -startClear;

              const NECK_KICKIN = 0.55;
              const neckProg = isSolid && a.bodyDraw > NECK_KICKIN
                ? (a.bodyDraw - NECK_KICKIN) / (1 - NECK_KICKIN)
                : 0;
              const neckStart  = startClear + usableLen * NECK_KICKIN;
              const neckCurEnd = startClear + usableLen * (NECK_KICKIN + (1 - NECK_KICKIN) * neckProg);
              const neckDashArray  = `${Math.max(0, neckCurEnd - neckStart)} 1`;
              const neckDashOffset = -neckStart;

              const tipT = startClear + usableLen;
              const tip = evalBezier(a.x1, a.y1, a.c1x, a.c1y, a.c2x, a.c2y, a.x2, a.y2, tipT);
              const headAngle = Math.atan2(tip.ty, tip.tx) * (180 / Math.PI);

              return (
                <g key={i} opacity={pitchProg}>
                  <path
                    d={a.d}
                    pathLength={1}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth={isSolid ? 4.5 : 2}
                    strokeLinecap="round"
                    strokeDasharray={
                      isSolid ? bodyDashArray : `${Math.max(0, bodyEnd - startClear)} 1`
                    }
                    strokeDashoffset={bodyDashOffset}
                    opacity={a.bodyOpacity}
                    filter={isSolid ? "url(#tactical-arrow-shadow)" : undefined}
                  />
                  {!isSolid && (
                    <path
                      d={a.d}
                      pathLength={chord}
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeDasharray="8 5"
                      strokeDashoffset={
                        interpolate(a.bodyDraw, [0, 1], [chord, 0], { extrapolateRight: "clamp" })
                      }
                      opacity={a.bodyOpacity * 0.95}
                    />
                  )}
                  {isSolid && neckProg > 0 && (
                    <path
                      d={a.d}
                      pathLength={1}
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth={1.8}
                      strokeLinecap="round"
                      strokeDasharray={neckDashArray}
                      strokeDashoffset={neckDashOffset}
                      opacity={a.bodyOpacity}
                      filter="url(#tactical-arrow-shadow)"
                    />
                  )}
                  {isSolid && a.headOpacity > 0 && (
                    <g
                      transform={`translate(${tip.x} ${tip.y}) rotate(${headAngle}) scale(${a.headScale})`}
                      opacity={a.headOpacity * Math.min(1, a.bodyOpacity * 1.6)}
                      filter="url(#tactical-arrow-shadow)"
                    >
                      <path
                        d={`M 0 0 L ${-HEAD_SIZE} ${-HEAD_SIZE * 0.55} L ${-HEAD_SIZE * 0.7} 0 L ${-HEAD_SIZE} ${HEAD_SIZE * 0.55} Z`}
                        fill="#ffffff"
                      />
                    </g>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Z-9 — Opposition dots (rendered BENEATH own team for layering) */}
          <div style={{ position: "absolute", inset: 0, zIndex: 9, pointerEvents: "none" }}>
            {oppositionPlayers.map((p, i) => {
              const prog  = oppositionProgs[i];
              const sc    = interpolate(prog, [0, 1], [0.2, 1], { extrapolateRight: "clamp" });
              const op    = interpolate(prog, [0, 0.6], [0, 0.92], { extrapolateRight: "clamp" });
              const pulse = oppositionPulses[i];
              const pulseScale  = 1 + 0.22 * pulse;
              const pulseOpacity = 0.92 + 0.08 * pulse;
              const pulseRing   = 4 + 8 * pulse;
              const pos = resolvePos(p);

              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: px(pos.x) - DOT_R_OPP,
                    top:  py(pos.y) - DOT_R_OPP,
                    width:  DOT_R_OPP * 2,
                    height: DOT_R_OPP * 2,
                    opacity: op * pitchProg,
                    transform: `${dotCounterRotate} scale(${sc * pulseScale})`,
                    transformOrigin: "center center",
                  }}
                >
                  {/* Outer pulse ring (only visible when pulse > 0) */}
                  {pulse > 0 && (
                    <div style={{
                      position: "absolute",
                      inset: -pulseRing,
                      borderRadius: "50%",
                      border: `2px solid ${accentColor}`,
                      opacity: 0.55 * pulse,
                    }} />
                  )}
                  <div style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    backgroundColor: oppositionColor,
                    border: `2px solid rgba(255,255,255,${0.85 + 0.15 * pulse})`,
                    boxShadow: "0 2px 6px rgba(0,0,0,0.5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: pulseOpacity,
                  }}>
                    <div style={{
                      fontFamily,
                      fontSize: 13,
                      fontWeight: 900,
                      color: "#ffffff",
                      lineHeight: 1,
                    }}>
                      {p.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Z-10 — Own team dots */}
          <div style={{ position: "absolute", inset: 0, zIndex: 10, pointerEvents: "none" }}>
            {players.map((p, i) => {
              const prog = playerProgs[i];
              const sc   = interpolate(prog, [0, 1], [0.2, 1], { extrapolateRight: "clamp" });
              const op   = interpolate(prog, [0, 0.6], [0, 1], { extrapolateRight: "clamp" });
              const drift = playerDrifts[i];
              const pos = resolvePos(p);
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: px(pos.x) - DOT_R + drift.dx,
                    top:  py(pos.y) - DOT_R + drift.dy,
                    width:  DOT_R * 2,
                    height: DOT_R * 2,
                    borderRadius: "50%",
                    backgroundColor: teamColor,
                    border: "2px solid #ffffff",
                    boxShadow: "0 3px 9px rgba(0,0,0,0.55)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: op * pitchProg,
                    transform: `${dotCounterRotate} scale(${sc})`,
                    transformOrigin: "center center",
                  }}
                >
                  <div style={{
                    fontFamily,
                    fontSize: 15,
                    fontWeight: 900,
                    color: "#ffffff",
                    lineHeight: 1,
                  }}>
                    {p.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Z-12 — Folio (flat, outside perspective) */}
      <div style={{ position: "absolute", left: 120, top: 200, width: 720, zIndex: 12 }}>
        <div style={{
          fontFamily: serifFontFamily,
          fontStyle:  "italic",
          fontWeight: 500,
          fontSize:   44,
          letterSpacing: -1,
          lineHeight: 1.05,
          color:      textColor,
          opacity:    interpolate(folioProg, [0, 0.6], [0, 1], { extrapolateRight: "clamp" }),
          transform:  `translateY(${interpolate(folioProg, [0, 1], [10, 0], { extrapolateRight: "clamp" })}px)`,
        }}>
          {title}
        </div>

        <div style={{
          width: interpolate(ruleProg, [0, 1], [0, 36], { extrapolateRight: "clamp" }),
          height: 3,
          background: accentColor,
          marginTop: 22,
          marginBottom: 16,
        }} />

        {description && (
          <div style={{
            fontFamily: serifFontFamily,
            fontStyle:  "italic",
            fontWeight: 400,
            fontSize:   26,
            lineHeight: 1.32,
            letterSpacing: -0.3,
            color:      textColor,
            opacity:    interpolate(captionProg, [0, 0.6], [0, 0.92], { extrapolateRight: "clamp" }),
            transform:  `translateY(${interpolate(captionProg, [0, 1], [12, 0], { extrapolateRight: "clamp" })}px)`,
            maxWidth:   680,
          }}>
            {description}
          </div>
        )}

        {/* Tiny legend — colour swatches for own / opposition teams */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 24,
          marginTop: 36,
          opacity: interpolate(captionProg, [0, 1], [0, 0.85], { extrapolateRight: "clamp" }),
        }}>
          <LegendDot color={teamColor} label="press" />
          <LegendDot color={oppositionColor} label="opposition" />
        </div>
      </div>

      {/* Grain LAST */}
      <Grain />
    </AbsoluteFill>
  );
};

// ── Tiny legend dot + label ──────────────────────────────────────────────────

const LegendDot: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
    <div style={{
      width: 14,
      height: 14,
      borderRadius: "50%",
      backgroundColor: color,
      border: "2px solid rgba(255,255,255,0.9)",
    }} />
    <div style={{
      fontFamily,
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: 3,
      textTransform: "uppercase" as const,
      color: "rgba(245,240,232,0.6)",
    }}>
      {label}
    </div>
  </div>
);
