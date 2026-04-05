/**
 * IntrcptTactical — Annotated pitch diagram with player positions and movement arrows.
 * Updated: Larger circles/labels, draw-on arrow animation with per-arrow stagger.
 */
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { fontFamily, serifFontFamily, Grain } from "./shared";

const PlayerDotSchema = z.object({ label: z.string().optional().default(""), x: z.number(), y: z.number() });
const ArrowSchema = z.object({
  fromX: z.number(), fromY: z.number(),
  toX: z.number(),   toY: z.number(),
  style: z.enum(["solid", "dashed"]).default("solid"),
});

export const IntrcptTacticalPropsSchema = z.object({
  title:       z.string().optional().default("the press"),
  description: z.string().optional().default("coordinated high press from the front three"),
  players: z.array(PlayerDotSchema).default([
    { label: "GK", x: 50, y: 88 }, { label: "RB", x: 80, y: 72 }, { label: "CB", x: 62, y: 72 },
    { label: "CB", x: 38, y: 72 }, { label: "LB", x: 20, y: 72 }, { label: "CM", x: 65, y: 55 },
    { label: "DM", x: 50, y: 58 }, { label: "CM", x: 35, y: 55 }, { label: "RW", x: 78, y: 36 },
    { label: "ST", x: 50, y: 30 }, { label: "LW", x: 22, y: 36 },
  ]),
  arrows: z.array(ArrowSchema).default([
    { fromX: 78, fromY: 36, toX: 85, toY: 20, style: "solid"  },
    { fromX: 50, fromY: 30, toX: 50, toY: 15, style: "solid"  },
    { fromX: 22, fromY: 36, toX: 15, toY: 20, style: "solid"  },
    { fromX: 65, fromY: 55, toX: 70, toY: 42, style: "dashed" },
    { fromX: 35, fromY: 55, toX: 30, toY: 42, style: "dashed" },
  ]),
  teamColor: z.string().optional().default("#C8102E"),
  bgColor:   z.string().optional().default("#1a1a1a"),
});

export type IntrcptTacticalProps = z.infer<typeof IntrcptTacticalPropsSchema>;

// ── Layout constants ───────────────────────────────────────────────────────────

const PITCH_W = 640;
const PITCH_H = 900;
const PITCH_X = (1920 - PITCH_W) / 2;
const PITCH_Y = (1080 - PITCH_H) / 2;
const DOT_R   = 28;  // enlarged from 20 → 28
const px = (x: number) => PITCH_X + (x / 100) * PITCH_W;
const py = (y: number) => PITCH_Y + (y / 100) * PITCH_H;

// Arrows begin after all players have popped in
const ARROW_START   = 45;
const ARROW_STAGGER = 8;

// ── Component ─────────────────────────────────────────────────────────────────

export const IntrcptTactical: React.FC<IntrcptTacticalProps> = ({
  title, description, players, arrows, teamColor, bgColor,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pitchProg    = spring({ frame, fps, config: { damping: 25, stiffness: 50 } });
  const titleProg    = spring({ frame, fps, config: { damping: 28, stiffness: 55 }, delay: players.length * 5 + 12 });
  const playerSprings = players.map((_, i) =>
    spring({ frame, fps, config: { damping: 16, stiffness: 160 }, delay: 12 + i * 5 }),
  );

  // Per-arrow draw-on progress
  const arrowProgress = arrows.map((_, i) =>
    spring({ frame, fps, config: { damping: 30, stiffness: 55 }, delay: ARROW_START + i * ARROW_STAGGER }),
  );

  // Pitch markings geometry
  const s   = "rgba(255,255,255,0.45)";
  const sw  = 1.5;
  const pad = 14;
  const iW  = PITCH_W - pad * 2;
  const iH  = PITCH_H - pad * 2;
  const cx  = PITCH_X + PITCH_W / 2;
  const cy  = PITCH_Y + PITCH_H / 2;
  const pAW = iW * 0.62;  const pAH = iH * 0.152;
  const pAX = PITCH_X + pad + (iW - pAW) / 2;
  const gAW = iW * 0.36;  const gAH = iH * 0.057;
  const gAX = PITCH_X + pad + (iW - gAW) / 2;

  return (
    <AbsoluteFill style={{ background: bgColor }}>
      <Grain />

      {/* ── Grass ────────────────────────────────────────────────────── */}
      <div style={{
        position: "absolute",
        left: PITCH_X, top: PITCH_Y,
        width: PITCH_W, height: PITCH_H,
        borderRadius: 8, overflow: "hidden",
        opacity: pitchProg,
        transform: `scale(${interpolate(pitchProg, [0, 1], [0.97, 1])})`,
        transformOrigin: "center center",
      }}>
        {Array.from({ length: 14 }).map((_, i) => (
          <div key={i} style={{
            position: "absolute",
            top: i * (PITCH_H / 14), left: 0,
            width: PITCH_W, height: PITCH_H / 14 + 0.5,
            backgroundColor: i % 2 === 0 ? "#1f5c2e" : "#236832",
          }} />
        ))}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse 110% 105% at 50% 50%, transparent 60%, rgba(0,0,0,0.3) 100%)",
          pointerEvents: "none",
        }} />
      </div>

      {/* ── Pitch lines + arrows (SVG layer) ─────────────────────────── */}
      <svg width={1920} height={1080} style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}>
        <defs>
          {/* Solid arrow marker */}
          <marker id="arrow-head" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="rgba(255,255,255,0.95)" />
          </marker>
          {/* Glow filter for solid pressing arrows */}
          <filter id="arrow-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Pitch markings */}
        <rect x={PITCH_X + pad} y={PITCH_Y + pad} width={iW} height={iH}
          stroke={s} strokeWidth={sw} fill="none" rx={2} opacity={pitchProg} />
        <line x1={PITCH_X + pad} y1={cy} x2={PITCH_X + PITCH_W - pad} y2={cy}
          stroke={s} strokeWidth={sw} opacity={pitchProg} />
        <circle cx={cx} cy={cy} r={iW * 0.142}
          stroke={s} strokeWidth={sw} fill="none" opacity={pitchProg} />
        <circle cx={cx} cy={cy} r={4} fill={s} opacity={pitchProg} />
        <rect x={pAX} y={PITCH_Y + pad} width={pAW} height={pAH}
          stroke={s} strokeWidth={sw} fill="none" opacity={pitchProg} />
        <rect x={gAX} y={PITCH_Y + pad} width={gAW} height={gAH}
          stroke={s} strokeWidth={sw} fill="none" opacity={pitchProg} />
        <rect x={pAX} y={PITCH_Y + PITCH_H - pad - pAH} width={pAW} height={pAH}
          stroke={s} strokeWidth={sw} fill="none" opacity={pitchProg} />
        <rect x={gAX} y={PITCH_Y + PITCH_H - pad - gAH} width={gAW} height={gAH}
          stroke={s} strokeWidth={sw} fill="none" opacity={pitchProg} />

        {/* Arrows — draw-on via strokeDashoffset */}
        {arrows.map((arrow, i) => {
          const x1 = px(arrow.fromX);
          const y1 = py(arrow.fromY);
          const x2 = px(arrow.toX);
          const y2 = py(arrow.toY);

          // Shrink start/end so line doesn't overlap the player circles
          const dx = x2 - x1;
          const dy = y2 - y1;
          const len = Math.sqrt(dx * dx + dy * dy);
          const ux = dx / len;
          const uy = dy / len;
          const headClearance = arrow.style === "solid" ? DOT_R + 10 : DOT_R + 6;
          const sx = x1 + ux * (DOT_R + 4);
          const sy = y1 + uy * (DOT_R + 4);
          const ex = x2 - ux * headClearance;
          const ey = y2 - uy * headClearance;

          const segLen = Math.sqrt((ex - sx) ** 2 + (ey - sy) ** 2);
          const prog   = arrowProgress[i];
          // strokeDashoffset trick: draw from tail→tip
          const offset = interpolate(prog, [0, 1], [segLen, 0], { extrapolateRight: "clamp" });
          const opacity = interpolate(prog, [0, 0.3], [0, 1], { extrapolateRight: "clamp" });

          const isSolid = arrow.style === "solid";

          return (
            <line
              key={i}
              x1={sx} y1={sy} x2={ex} y2={ey}
              stroke={isSolid ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.5)"}
              strokeWidth={isSolid ? 3 : 2}
              strokeDasharray={isSolid ? `${segLen}` : `8 5`}
              strokeDashoffset={isSolid ? offset : interpolate(prog, [0, 1], [16, 0], { extrapolateRight: "clamp" })}
              markerEnd={isSolid && prog > 0.6 ? "url(#arrow-head)" : undefined}
              opacity={opacity}
              filter={isSolid ? "url(#arrow-glow)" : undefined}
              strokeLinecap="round"
            />
          );
        })}
      </svg>

      {/* ── Player circles ────────────────────────────────────────────── */}
      {players.map((player, i) => {
        const prog = playerSprings[i];
        const sc   = interpolate(prog, [0, 1], [0.1, 1], { extrapolateRight: "clamp" });
        const op   = interpolate(prog, [0, 0.4], [0, 1], { extrapolateRight: "clamp" });
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: px(player.x) - DOT_R,
              top:  py(player.y) - DOT_R,
              width:  DOT_R * 2,
              height: DOT_R * 2,
              borderRadius: "50%",
              backgroundColor: teamColor,
              border: "2px solid #fff",
              boxShadow: "0 4px 14px rgba(0,0,0,0.45)",
              display: "flex", alignItems: "center", justifyContent: "center",
              opacity: op,
              transform: `scale(${sc})`,
            }}
          >
            <div style={{ fontFamily, fontSize: 15, fontWeight: 900, color: "#fff" }}>
              {player.label}
            </div>
          </div>
        );
      })}

      {/* ── Title block ───────────────────────────────────────────────── */}
      <div style={{
        position: "absolute",
        left: 100, bottom: 100,
        opacity: titleProg,
        transform: `translateY(${interpolate(titleProg, [0, 1], [20, 0])}px)`,
      }}>
        <div style={{
          fontFamily: serifFontFamily,
          fontSize: 72, fontWeight: 900,
          color: "#fff", letterSpacing: -2, lineHeight: 1,
        }}>
          {title}
        </div>
        <div style={{
          fontFamily: serifFontFamily,
          fontSize: 24, fontWeight: 400, fontStyle: "italic",
          color: "rgba(255,255,255,0.6)", marginTop: 12,
        }}>
          {description}
        </div>
      </div>
    </AbsoluteFill>
  );
};
