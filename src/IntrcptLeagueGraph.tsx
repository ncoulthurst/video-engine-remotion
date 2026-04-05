/**
 * IntrcptLeagueGraph — Title race chart: two teams, animated dual lines, X/Y axes, badges.
 */
import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { fontFamily, serifFontFamily, DarkBackground, SmartImg } from "./shared";

const DataPointSchema = z.object({ matchday: z.number(), position: z.number() });

const TeamSchema = z.object({
  name:      z.string().optional().default(""),
  color:     z.string().optional().default("#C8102E"),
  data:      z.array(DataPointSchema),
  badgeSlug: z.string().optional().default(""),
});

export const IntrcptLeagueGraphPropsSchema = z.object({
  season:      z.string().optional().default("2013–14"),
  title:       z.string().optional().default("Title Race"),
  teamA:       TeamSchema,
  teamB:       TeamSchema.optional(),
  maxPosition: z.number().default(6),
  bgColor:     z.string().optional().default("#111111"),
});
export type IntrcptLeagueGraphProps = z.infer<typeof IntrcptLeagueGraphPropsSchema>;

// Chart geometry (in SVG coordinate space = 1920×1080)
const PAD_L = 110;
const PAD_R = 80;
const PAD_T = 220;
const PAD_B = 110;
const CW    = 1920 - PAD_L - PAD_R;
const CH    = 1080 - PAD_T - PAD_B;

const toX = (md: number, maxMd: number) => PAD_L + ((md - 1) / Math.max(maxMd - 1, 1)) * CW;
const toY = (pos: number, maxPos: number) => PAD_T + ((pos - 1) / Math.max(maxPos - 1, 1)) * CH;

/**
 * Returns data points for the current draw progress, including a smoothly
 * interpolated fractional point at the tip so the line moves continuously
 * rather than snapping between discrete matchday positions.
 */
function buildVisible(
  data: { matchday: number; position: number }[],
  drawProgress: number,
): { matchday: number; position: number }[] {
  const sorted = [...data].sort((a, b) => a.matchday - b.matchday);
  if (sorted.length < 2) return sorted;

  const totalSegments   = sorted.length - 1;
  const segmentProgress = drawProgress * totalSegments;
  const fullSegments    = Math.floor(segmentProgress);
  const fraction        = segmentProgress - fullSegments;

  // All fully completed points
  const result = sorted.slice(0, fullSegments + 1);

  // Smoothly interpolated tip between the current and next data point
  if (fullSegments < totalSegments) {
    const from = sorted[fullSegments];
    const to   = sorted[fullSegments + 1];
    result.push({
      matchday: from.matchday + (to.matchday - from.matchday) * fraction,
      position: from.position + (to.position - from.position) * fraction,
    });
  }

  return result;
}

function toSvgPath(pts: { matchday: number; position: number }[], maxMd: number, maxPos: number) {
  return pts.map((p, i) => `${i === 0 ? "M" : "L"} ${toX(p.matchday, maxMd).toFixed(1)} ${toY(p.position, maxPos).toFixed(1)}`).join(" ");
}

const ordinal = (n: number) => n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : `${n}th`;

export const IntrcptLeagueGraph: React.FC<IntrcptLeagueGraphProps> = ({
  season, title, teamA, teamB, maxPosition = 6, bgColor,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();

  const drawProgress = Math.min(1, frame / durationInFrames);
  const headerProg   = spring({ frame, fps, config: { damping: 26, stiffness: 55 } });
  const gridOp       = interpolate(frame, [0, 28], [0, 1], { extrapolateRight: "clamp" });
  const labelEndOp   = interpolate(drawProgress, [0.12, 0.25], [0, 1], { extrapolateRight: "clamp" });

  const allData = [...teamA.data, ...(teamB?.data ?? [])];
  const maxMd   = Math.max(...allData.map(p => p.matchday), 38);
  const maxPos  = maxPosition;

  const visA = buildVisible(teamA.data, drawProgress);
  const visB = teamB ? buildVisible(teamB.data, drawProgress) : [];

  const lastA = visA[visA.length - 1];
  const lastB = visB[visB.length - 1];

  // Y-axis: positions 1 → maxPos
  const yLabels = Array.from({ length: maxPos }, (_, i) => i + 1);
  // X-axis: every 5 matchdays + last
  const xLabels = Array.from({ length: Math.floor((maxMd - 1) / 5) + 1 }, (_, i) => Math.min(1 + i * 5, maxMd))
    .filter((v, i, a) => a.indexOf(v) === i);

  const teams = [teamA, ...(teamB ? [teamB] : [])];

  return (
    <AbsoluteFill>
      <DarkBackground color={bgColor} />

      {/* Header — title + season */}
      <div style={{
        position:  "absolute",
        top:       52,
        left:      PAD_L,
        opacity:   headerProg,
        transform: `translateY(${interpolate(headerProg, [0, 1], [-16, 0])}px)`,
      }}>
        <div style={{
          fontFamily, fontSize: 13, fontWeight: 700, letterSpacing: 3.5,
          color: "rgba(255,255,255,0.38)", textTransform: "uppercase", marginBottom: 8,
        }}>{season}</div>
        <div style={{
          fontFamily: serifFontFamily, fontSize: 64, fontWeight: 900,
          color: "#fff", letterSpacing: -2, lineHeight: 1,
        }}>{title}</div>
      </div>

      {/* Legend — top right */}
      <div style={{
        position:       "absolute",
        top:            60,
        right:          PAD_R + 10,
        display:        "flex",
        flexDirection:  "column",
        gap:            18,
        alignItems:     "flex-end",
        opacity:        headerProg,
      }}>
        {teams.map((team, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              fontFamily: serifFontFamily, fontSize: 26, fontWeight: 900,
              color: team.color, letterSpacing: -0.5,
            }}>{team.name}</div>
            {team.badgeSlug ? (
              <SmartImg
                src={`badges/${team.badgeSlug}`}
                style={{ width: 48, height: 48, objectFit: "contain" }}
              />
            ) : (
              <div style={{
                width: 18, height: 18, borderRadius: "50%", backgroundColor: team.color,
                boxShadow: `0 0 10px ${team.color}88`,
              }} />
            )}
          </div>
        ))}
      </div>

      {/* SVG chart */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {/* Horizontal grid lines + Y-axis labels */}
        {yLabels.map(pos => {
          const cy = toY(pos, maxPos);
          return (
            <g key={pos}>
              <line
                x1={PAD_L} y1={cy} x2={1920 - PAD_R} y2={cy}
                stroke={pos === 1 ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.06)"}
                strokeWidth={pos === 1 ? 1.5 : 1}
                strokeDasharray={pos === 1 ? "none" : "4 6"}
                opacity={gridOp}
              />
              <text
                x={PAD_L - 16} y={cy + 7}
                textAnchor="end"
                fontFamily={fontFamily}
                fontSize={18}
                fontWeight={600}
                fill={pos === 1 ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.32)"}
                opacity={gridOp}
              >{ordinal(pos)}</text>
            </g>
          );
        })}

        {/* X-axis baseline */}
        <line
          x1={PAD_L} y1={PAD_T + CH} x2={1920 - PAD_R} y2={PAD_T + CH}
          stroke="rgba(255,255,255,0.14)" strokeWidth={1} opacity={gridOp}
        />

        {/* X-axis labels */}
        {xLabels.map(md => (
          <text
            key={md}
            x={toX(md, maxMd)} y={PAD_T + CH + 36}
            textAnchor="middle"
            fontFamily={fontFamily}
            fontSize={16}
            fontWeight={500}
            fill="rgba(255,255,255,0.28)"
            opacity={gridOp}
          >{md === 1 ? "GW1" : md === maxMd ? `GW${md}` : String(md)}</text>
        ))}

        {/* X-axis label header */}
        <text
          x={PAD_L + CW / 2} y={PAD_T + CH + 70}
          textAnchor="middle"
          fontFamily={fontFamily}
          fontSize={13}
          fontWeight={700}
          fill="rgba(255,255,255,0.18)"
          letterSpacing={3}
          opacity={gridOp}
        >MATCHDAY</text>

        {/* Team B line (behind) */}
        {teamB && visB.length > 1 && (
          <path
            d={toSvgPath(visB, maxMd, maxPos)}
            fill="none"
            stroke={teamB.color}
            strokeWidth={4}
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity={0.85}
          />
        )}

        {/* Team A line (front) */}
        {visA.length > 1 && (
          <path
            d={toSvgPath(visA, maxMd, maxPos)}
            fill="none"
            stroke={teamA.color}
            strokeWidth={4}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        {/* Pulsing dot — Team A current position */}
        {lastA && drawProgress > 0.05 && (
          <>
            <circle
              cx={toX(lastA.matchday, maxMd)}
              cy={toY(lastA.position, maxPos)}
              r={14}
              fill={teamA.color}
              opacity={0.18}
            />
            <circle
              cx={toX(lastA.matchday, maxMd)}
              cy={toY(lastA.position, maxPos)}
              r={7}
              fill={teamA.color}
            />
          </>
        )}

        {/* Pulsing dot — Team B current position */}
        {teamB && lastB && drawProgress > 0.05 && (
          <>
            <circle
              cx={toX(lastB.matchday, maxMd)}
              cy={toY(lastB.position, maxPos)}
              r={14}
              fill={teamB.color}
              opacity={0.18}
            />
            <circle
              cx={toX(lastB.matchday, maxMd)}
              cy={toY(lastB.position, maxPos)}
              r={7}
              fill={teamB.color}
            />
          </>
        )}
      </svg>

      {/* Floating line-end labels */}
      {lastA && (
        <div style={{
          position:   "absolute",
          left:       toX(lastA.matchday, maxMd) + 18,
          top:        toY(lastA.position, maxPos) - 20,
          fontFamily: serifFontFamily,
          fontSize:   22,
          fontWeight: 900,
          color:      teamA.color,
          letterSpacing: -0.5,
          textShadow: "0 1px 10px rgba(0,0,0,0.9)",
          opacity:    labelEndOp,
          whiteSpace: "nowrap",
        }}>{teamA.name}</div>
      )}
      {teamB && lastB && (
        <div style={{
          position:   "absolute",
          left:       toX(lastB.matchday, maxMd) + 18,
          top:        toY(lastB.position, maxPos) - 20,
          fontFamily: serifFontFamily,
          fontSize:   22,
          fontWeight: 900,
          color:      teamB.color,
          letterSpacing: -0.5,
          textShadow: "0 1px 10px rgba(0,0,0,0.9)",
          opacity:    labelEndOp,
          whiteSpace: "nowrap",
        }}>{teamB.name}</div>
      )}
    </AbsoluteFill>
  );
};
