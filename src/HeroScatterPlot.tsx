/**
 * HeroScatterPlot — Player scatter plot on dark background.
 */
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { serifFontFamily, DarkBackground, SmartImg, WorldStateSchema} from "./shared";

const PlayerSchema = z.object({ name: z.string().optional().default(""), image: z.string().optional().default(""), ringColor: z.string().optional().default("#ffffff"), x: z.number(), y: z.number() });
export const HeroScatterPlotPropsSchema = z.object({
  axisXLabel: z.string().optional().default("speed"), axisYLabel: z.string().optional().default("space efficiency"), q1Label: z.string().optional().default("Wizard Zone"), q2Label: z.string().optional().default("maestros"), q3Label: z.string().optional().default("stiff"), q4Label: z.string().optional().default("robotic"), showWizardArrow: z.boolean().default(true), players: z.array(PlayerSchema).default([ { name: "Player A", image: "suarez.jpg", ringColor: "#C8102E", x: 72, y: 75 } ]), bgColor: z.string().optional().default("#111111"),
  worldState: WorldStateSchema.optional(),
  skipIntro: z.boolean().optional().default(false),
});
export type HeroScatterPlotProps = z.infer<typeof HeroScatterPlotPropsSchema>;

export const HeroScatterPlot: React.FC<HeroScatterPlotProps> = ({ axisXLabel, axisYLabel, q1Label, q2Label, q3Label, q4Label, showWizardArrow, players, bgColor }) => {
  const frame = useCurrentFrame(); const { fps, width, height } = useVideoConfig();
  const axisProgress = spring({ frame, fps, config: { damping: 28, stiffness: 40 }, delay: 0 });
  const playerSprings = players.map((_, i) => spring({ frame, fps, config: { damping: 16, stiffness: 180 }, delay: 28 + i * 8 }));
  const PADDING = 140; const cx = width / 2; const cy = height / 2; const axisW = width - PADDING * 2; const axisH = height - PADDING * 2;
  const plotX = (pct: number) => PADDING + (pct / 100) * axisW; const plotY = (pct: number) => PADDING + ((100 - pct) / 100) * axisH;

  return (
    <AbsoluteFill>
      <DarkBackground color={bgColor} />
      <AbsoluteFill style={{ pointerEvents: "none" }}><svg width={width} height={height} style={{ position: "absolute", top: 0, left: 0 }}><defs><filter id="dark-grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" seed={frame % 60} stitchTiles="stitch" /><feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 0.04" /></filter></defs><rect width={width} height={height} filter="url(#dark-grain)" /></svg></AbsoluteFill>
      <svg width={width} height={height} style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}>
        <line x1={cx - interpolate(axisProgress, [0, 1], [0, axisW / 2])} y1={cy} x2={cx + interpolate(axisProgress, [0, 1], [0, axisW / 2])} y2={cy} stroke="rgba(255,255,255,0.18)" strokeWidth={1} />
        <line x1={cx} y1={cy - interpolate(axisProgress, [0, 1], [0, axisH / 2])} x2={cx} y2={cy + interpolate(axisProgress, [0, 1], [0, axisH / 2])} stroke="rgba(255,255,255,0.18)" strokeWidth={1} />
        <text x={PADDING + axisW - 8} y={cy + 28} fill="rgba(255,255,255,0.28)" fontSize={13} fontFamily={serifFontFamily} fontStyle="italic" textAnchor="end" opacity={axisProgress}>{axisXLabel}</text>
        <text x={cx + 12} y={PADDING + 18} fill="rgba(255,255,255,0.28)" fontSize={13} fontFamily={serifFontFamily} fontStyle="italic" opacity={axisProgress}>{axisYLabel}</text>
      </svg>
      {[ { label: q2Label, x: PADDING + 30, y: PADDING + 50, rotate: -20 }, { label: q1Label, x: width - PADDING - 30, y: PADDING + 50, rotate: 20, anchor: "end" }, { label: q3Label, x: PADDING + 30, y: height - PADDING - 30, rotate: 20 }, { label: q4Label, x: width - PADDING - 30, y: height - PADDING - 30, rotate: -20, anchor: "end" } ].map((q, i) => (
        <div key={i} style={{ position: "absolute", left: q.x, top: q.y, fontFamily: serifFontFamily, fontSize: 20, fontStyle: "italic", fontWeight: 400, color: "rgba(255,255,255,0.28)", transform: `translate(-50%, -50%) rotate(${q.rotate}deg)`, opacity: axisProgress, whiteSpace: "nowrap", textAlign: q.anchor === "end" ? "right" : "left" }}>{q.label}</div>
      ))}
      {players.map((player, i) => (
        <div key={i} style={{ position: "absolute", left: plotX(player.x) - 31, top: plotY(player.y) - 31, width: 62, height: 62, opacity: playerSprings[i], transform: `scale(${interpolate(playerSprings[i], [0, 1], [0.3, 1])})` }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `2.5px solid ${player.ringColor}`, boxShadow: `0 0 12px 2px ${player.ringColor}44` }} />
          <div style={{ position: "absolute", inset: 3, borderRadius: "50%", overflow: "hidden", background: "#222" }}>{player.image && <SmartImg src={player.image} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}</div>
        </div>
      ))}
    </AbsoluteFill>
  );
};
