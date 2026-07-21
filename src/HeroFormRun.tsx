/**
 * HeroFormRun — Recent match results displayed as animated coloured squares.
 * F3: composed from the shared kit (Ground/TYPE/prog/Kicker) — no per-comp
 * springs, grain or ContextChip. Squares accept the "entity" beat (H1).
 * Colors: Win=Green, Loss=Red, Draw=Orangey Yellow.
 */
import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { SmartImg, WorldStateSchema } from "./shared";
import { Ground, TYPE, EASE, prog, beatDelay, stagger, resolveTheme, Kicker } from "./lib/kit";

const ResultSchema = z.object({
  result:   z.enum(["W", "D", "L"]),
  opponent: z.string().optional().default(""),
  score:    z.string().optional().default(""),
});

export const HeroFormRunPropsSchema = z.object({
  teamName:  z.string().optional().default("Liverpool"),
  teamColor: z.string().optional().default("#C8102E"),
  label:     z.string().optional().default("last 10 matches"),
  sideImage: z.string().optional().default(""),
  results:   z.array(ResultSchema).default([
    { result: "W", opponent: "Arsenal",   score: "4-0" },
    { result: "W", opponent: "Man City",  score: "2-1" },
    { result: "D", opponent: "Chelsea",   score: "1-1" },
    { result: "W", opponent: "Everton",   score: "3-0" },
    { result: "W", opponent: "Spurs",     score: "5-0" },
    { result: "L", opponent: "Man Utd",   score: "0-3" },
    { result: "W", opponent: "Newcastle", score: "2-0" },
    { result: "D", opponent: "West Ham",  score: "2-2" },
    { result: "W", opponent: "Fulham",    score: "3-1" },
    { result: "W", opponent: "Brentford", score: "1-0" },
  ]),
  bgColor:   z.string().optional().default("#f0ece4"),
  darkMode:  z.boolean().optional().default(false),
  skipIntro: z.boolean().optional().default(false),
  beats:     z.record(z.string(), z.number()).optional(),
  worldState: WorldStateSchema.optional(),
});

export type HeroFormRunProps = z.infer<typeof HeroFormRunPropsSchema>;

const RESULT_START   = 18;
const RESULT_STAGGER = 8;
const WIN_COLOR      = "#22c55e"; // Bright Green
const DRAW_COLOR     = "#f59e0b"; // Orangey Yellow
const LOSS_COLOR     = "#ef4444"; // Red

export const HeroFormRun: React.FC<HeroFormRunProps> = ({ teamName, teamColor, label, sideImage, results, bgColor, darkMode, skipIntro = false, beats }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ground = darkMode && bgColor === "#f0ece4" ? "#111111" : bgColor;
  const t = resolveTheme("paper", teamColor, ground);
  const headerProg = skipIntro ? 1 : prog(frame, 0, 20, EASE.snap);
  const imageProg  = skipIntro ? 1 : prog(frame, 6, 22, EASE.soft);
  const squareStart = beatDelay(beats, "entity", fps, RESULT_START);
  const wins   = results.filter(r => r.result === "W").length;
  const draws  = results.filter(r => r.result === "D").length;
  const losses = results.filter(r => r.result === "L").length;
  const getColor = (r: "W" | "D" | "L") => r === "W" ? WIN_COLOR : r === "D" ? DRAW_COLOR : LOSS_COLOR;
  const SQUARE_SIZE = 120;
  const SQUARE_GAP  = 24;

  return (
    <Ground ground="paper" bgColor={ground} accentColor={teamColor} domain="football" texture skipIntro={skipIntro} pad={0}>
      {sideImage && (
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 900, opacity: interpolate(imageProg, [0, 1], [0, 0.75], { extrapolateRight: "clamp" }), transform: `translateX(${interpolate(imageProg, [0, 1], [100, 0])}px)`, WebkitMaskImage: 'linear-gradient(to right, transparent, black 350px, black 85%, transparent)', maskImage: 'linear-gradient(to right, transparent, black 350px, black 85%, transparent)', zIndex: 1 }}>
          <SmartImg src={sideImage} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center", filter: "contrast(1.05) brightness(1.05)" }} />
        </div>
      )}
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 140px", maxWidth: sideImage ? 1200 : 1920, zIndex: 10 }}>
        <div style={{ opacity: headerProg, transform: `translateY(${interpolate(headerProg, [0, 1], [-16, 0])}px)`, marginBottom: 80 }}>
          <div style={{ marginBottom: 12 }}><Kicker label={label} theme={t} frame={frame} /></div>
          <div style={{ fontFamily: TYPE.serif, fontSize: 100, fontWeight: 900, color: t.ink, letterSpacing: -4, lineHeight: 1 }}>{teamName}</div>
          <div style={{ display: "flex", gap: 60, marginTop: 32 }}>
            {([ { key: "W", count: wins, color: WIN_COLOR }, { key: "D", count: draws, color: DRAW_COLOR }, { key: "L", count: losses, color: LOSS_COLOR } ] as const).map(({ key, count, color }) => (
              <div key={key} style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
                <span style={{ fontFamily: TYPE.mono, fontSize: 20, fontWeight: 800, color: t.muted, letterSpacing: 1.5 }}>{key}</span>
                <span style={{ fontFamily: TYPE.serif, fontSize: 72, fontWeight: 900, color }}>{count}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: SQUARE_GAP, flexWrap: "wrap", alignItems: "flex-start" }}>
          {results.map((r, i) => {
            const p  = skipIntro ? 1 : prog(frame, squareStart + stagger(i, RESULT_STAGGER), 16, EASE.snap);
            const sc = interpolate(p, [0, 1], [0.15, 1], { extrapolateRight: "clamp" });
            const op = interpolate(p, [0, 0.25], [0, 1], { extrapolateRight: "clamp" });
            const color = getColor(r.result);
            return (
              <div key={i} style={{ opacity: op, transform: `scale(${sc})`, transformOrigin: "bottom center", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                <div style={{ width: SQUARE_SIZE, height: SQUARE_SIZE, borderRadius: 16, backgroundColor: color, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 6px 20px ${color}44` }}>
                  <span style={{ fontFamily: TYPE.serif, fontSize: 60, fontWeight: 900, color: "#fff" }}>{r.result}</span>
                </div>
                {r.opponent && <div style={{ fontFamily: TYPE.sans, fontSize: 16, fontWeight: 700, color: t.muted, letterSpacing: 0.4, textAlign: "center", maxWidth: SQUARE_SIZE, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.opponent}</div>}
                {r.score && <div style={{ fontFamily: TYPE.sans, fontSize: 20, fontWeight: 800, color: t.ink, letterSpacing: 0.3, marginTop: -4 }}>{r.score}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </Ground>
  );
};
