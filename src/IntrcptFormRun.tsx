/**
 * IntrcptFormRun — Recent match results displayed as animated coloured squares.
 * Updated: Improved layering, soft gradient masking, and scaled layout.
 * Colors: Win=Green, Loss=Red, Draw=Orangey Yellow.
 */
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { fontFamily, serifFontFamily, Grain, PaperBackground, COLORS, SmartImg } from "./shared";

const ResultSchema = z.object({
  result:   z.enum(["W", "D", "L"]),
  opponent: z.string().default(""),
  score:    z.string().default(""),
});

export const IntrcptFormRunPropsSchema = z.object({
  teamName:  z.string().default("Liverpool"),
  teamColor: z.string().default("#C8102E"),
  label:     z.string().default("last 10 matches"),
  sideImage: z.string().optional(),
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
  bgColor: z.string().default("#f0ece4"),
});

export type IntrcptFormRunProps = z.infer<typeof IntrcptFormRunPropsSchema>;

const RESULT_START   = 18;
const RESULT_STAGGER = 8;
const WIN_COLOR      = "#22c55e"; // Bright Green
const DRAW_COLOR     = "#f59e0b"; // Orangey Yellow
const LOSS_COLOR     = "#ef4444"; // Red

export const IntrcptFormRun: React.FC<IntrcptFormRunProps> = ({ teamName, teamColor, label, sideImage, results, bgColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const headerProg = spring({ frame, fps, config: { damping: 28, stiffness: 55 } });
  const imageProg  = spring({ frame, fps, config: { damping: 24, stiffness: 50 }, delay: 6 });
  const wins   = results.filter(r => r.result === "W").length;
  const draws  = results.filter(r => r.result === "D").length;
  const losses = results.filter(r => r.result === "L").length;
  const getColor = (r: "W" | "D" | "L") => r === "W" ? WIN_COLOR : r === "D" ? DRAW_COLOR : LOSS_COLOR;
  const SQUARE_SIZE = 120;
  const SQUARE_GAP  = 24;

  return (
    <AbsoluteFill>
      <PaperBackground color={bgColor} />
      {sideImage && (
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 900, opacity: interpolate(imageProg, [0, 1], [0, 0.75], { extrapolateRight: "clamp" }), transform: `translateX(${interpolate(imageProg, [0, 1], [100, 0])}px)`, WebkitMaskImage: 'linear-gradient(to right, transparent, black 350px, black 85%, transparent)', maskImage: 'linear-gradient(to right, transparent, black 350px, black 85%, transparent)', zIndex: 1 }}>
          <SmartImg src={sideImage} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center", filter: "contrast(1.05) brightness(1.05)" }} />
        </div>
      )}
      <div style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none" }}><Grain /></div>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 140px", maxWidth: sideImage ? 1200 : 1920, zIndex: 10 }}>
        <div style={{ opacity: headerProg, transform: `translateY(${interpolate(headerProg, [0, 1], [-16, 0])}px)`, marginBottom: 80 }}>
          <div style={{ fontFamily, fontSize: 14, fontWeight: 800, color: COLORS.muted, letterSpacing: 3, textTransform: "uppercase", marginBottom: 12 }}>{label}</div>
          <div style={{ fontFamily: serifFontFamily, fontSize: 100, fontWeight: 900, color: COLORS.primary, letterSpacing: -4, lineHeight: 1 }}>{teamName}</div>
          <div style={{ display: "flex", gap: 60, marginTop: 32 }}>
            {([ { key: "W", count: wins, color: WIN_COLOR }, { key: "D", count: draws, color: DRAW_COLOR }, { key: "L", count: losses, color: LOSS_COLOR } ] as const).map(({ key, count, color }) => (
              <div key={key} style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
                <span style={{ fontFamily, fontSize: 20, fontWeight: 800, color: COLORS.muted, letterSpacing: 1.5 }}>{key}</span>
                <span style={{ fontFamily: serifFontFamily, fontSize: 72, fontWeight: 900, color }}>{count}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: SQUARE_GAP, flexWrap: "wrap", alignItems: "flex-start" }}>
          {results.map((r, i) => {
            const prog = spring({ frame: frame - (RESULT_START + i * RESULT_STAGGER), fps, config: { damping: 14, stiffness: 200 } });
            const sc = interpolate(prog, [0, 1], [0.15, 1], { extrapolateRight: "clamp" });
            const op = interpolate(prog, [0, 0.25], [0, 1], { extrapolateRight: "clamp" });
            const color = getColor(r.result);
            return (
              <div key={i} style={{ opacity: op, transform: `scale(${sc})`, transformOrigin: "bottom center", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                <div style={{ width: SQUARE_SIZE, height: SQUARE_SIZE, borderRadius: 16, backgroundColor: color, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 6px 20px ${color}44` }}>
                  <span style={{ fontFamily: serifFontFamily, fontSize: 60, fontWeight: 900, color: "#fff" }}>{r.result}</span>
                </div>
                {r.opponent && <div style={{ fontFamily, fontSize: 16, fontWeight: 700, color: COLORS.muted, letterSpacing: 0.4, textAlign: "center", maxWidth: SQUARE_SIZE, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.opponent}</div>}
                {r.score && <div style={{ fontFamily, fontSize: 20, fontWeight: 800, color: COLORS.primary, letterSpacing: 0.3, marginTop: -4 }}>{r.score}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
