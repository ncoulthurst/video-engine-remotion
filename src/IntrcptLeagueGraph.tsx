/**
 * IntrcptLeagueGraph — Title race chart, editorial paper aesthetic.
 *
 * Folio top-left, accent rule, paper + Grain. Subject team renders in accent
 * with a draw-on stroke-dashoffset; peer renders muted gray as a reference,
 * never competing for attention.
 */
import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { fontFamily, serifFontFamily, PaperBackground, Grain, SmartImg, COLORS, WorldStateSchema } from "./shared";

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
  competition: z.string().optional().default("Premier League"),
  source:      z.string().optional().default("Source · FBref"),
  teamA:       TeamSchema,
  teamB:       TeamSchema.optional(),
  maxPosition: z.number().default(6),
  bgColor:     z.string().optional().default(""),
  accentColor: z.string().optional().default(""),
  // Track E — optional entity portrait for the leading subject
  entityImage: z.string().optional().default(""),
  worldState:  WorldStateSchema.optional(),
  skipIntro:   z.boolean().optional().default(false),
});
export type IntrcptLeagueGraphProps = z.infer<typeof IntrcptLeagueGraphPropsSchema>;

const PAD_L = 160;
const PAD_R = 160;
const PAD_T = 380;
const PAD_B = 160;
const CW    = 1920 - PAD_L - PAD_R;
const CH    = 1080 - PAD_T - PAD_B;

const toX = (md: number, maxMd: number) => PAD_L + ((md - 1) / Math.max(maxMd - 1, 1)) * CW;
const toY = (pos: number, maxPos: number) => PAD_T + ((pos - 1) / Math.max(maxPos - 1, 1)) * CH;

function toFullPath(data: { matchday: number; position: number }[], maxMd: number, maxPos: number) {
  const sorted = [...data].sort((a, b) => a.matchday - b.matchday);
  return sorted.map((p, i) => `${i === 0 ? "M" : "L"} ${toX(p.matchday, maxMd).toFixed(2)} ${toY(p.position, maxPos).toFixed(2)}`).join(" ");
}

function lastVisiblePoint(
  data: { matchday: number; position: number }[],
  drawProgress: number,
): { matchday: number; position: number } | null {
  const sorted = [...data].sort((a, b) => a.matchday - b.matchday);
  if (sorted.length < 2) return sorted[0] ?? null;
  const totalSegments   = sorted.length - 1;
  const segmentProgress = drawProgress * totalSegments;
  const fullSegments    = Math.floor(segmentProgress);
  const fraction        = segmentProgress - fullSegments;
  if (fullSegments >= totalSegments) return sorted[sorted.length - 1];
  const from = sorted[fullSegments];
  const to   = sorted[fullSegments + 1];
  return {
    matchday: from.matchday + (to.matchday - from.matchday) * fraction,
    position: from.position + (to.position - from.position) * fraction,
  };
}

const ordinal = (n: number) => n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : `${n}th`;

export const IntrcptLeagueGraph: React.FC<IntrcptLeagueGraphProps> = ({
  season, title, competition, source, teamA, teamB, maxPosition = 6,
  bgColor, accentColor, skipIntro = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const ENTRY_DUR  = 52;
  const DRAW_START = 36;
  const DRAW_DUR   = 150;

  // Cinematic cold-open zoom on the chart plane
  const entryProg = skipIntro ? 1 : interpolate(frame, [0, ENTRY_DUR], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const planeScale = interpolate(entryProg, [0, 1], [1.04, 1.0]);
  const planeOp    = interpolate(entryProg, [0, 0.55], [0, 1], { extrapolateRight: "clamp" });

  const folioProg  = skipIntro ? 1 : interpolate(frame, [DRAW_START - 12, DRAW_START + 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const drawProgress = skipIntro ? 1 : interpolate(frame, [DRAW_START, DRAW_START + DRAW_DUR], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const labelEndOp = skipIntro ? 1 : interpolate(drawProgress, [0.85, 1.0], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const allData = [...teamA.data, ...(teamB?.data ?? [])];
  const maxMd   = Math.max(...allData.map(p => p.matchday), 38);
  const maxPos  = maxPosition;

  const yLabels = Array.from({ length: maxPos }, (_, i) => i + 1);
  const xLabels = Array.from({ length: Math.floor((maxMd - 1) / 5) + 1 }, (_, i) => Math.min(1 + i * 5, maxMd))
    .filter((v, i, a) => a.indexOf(v) === i);

  const subjectAccent = (accentColor && accentColor !== "") ? accentColor : (teamA.color || "#C8102E");
  const peerColor     = "rgba(17,17,17,0.34)";
  const inkColor      = "#111";
  const mutedInk      = "rgba(17,17,17,0.45)";
  const whisper       = "rgba(17,17,17,0.10)";

  const lastA = lastVisiblePoint(teamA.data, drawProgress);
  const lastB = teamB ? lastVisiblePoint(teamB.data, drawProgress) : null;

  const dateline = [competition, season].filter(Boolean).join("  ·  ").toUpperCase();

  return (
    <AbsoluteFill style={{ perspective: "2400px" }}>
      <PaperBackground color={bgColor || undefined} />

      {/* Plane that holds the chart — settles via cinematic cold-open zoom */}
      <AbsoluteFill style={{
        opacity:         planeOp,
        transform:       `scale(${planeScale})`,
        transformOrigin: "50% 60%",
      }}>
        {/* Folio top-left — serif italic subject + accent tab + small caps dateline */}
        <div style={{
          position:  "absolute",
          left:      PAD_L,
          top:       140,
          opacity:   folioProg,
          transform: `translateY(${interpolate(folioProg, [0, 1], [8, 0])}px)`,
        }}>
          <div style={{
            fontFamily:    serifFontFamily,
            fontStyle:     "italic",
            fontWeight:    500,
            fontSize:      44,
            letterSpacing: -1,
            lineHeight:    1,
            color:         inkColor,
          }}>{title}</div>
          <div style={{ width: 36, height: 3, background: subjectAccent, marginTop: 18, marginBottom: 14 }} />
          {dateline && (
            <div style={{
              fontFamily,
              fontSize:      12,
              fontWeight:    700,
              letterSpacing: 3.5,
              textTransform: "uppercase" as const,
              color:         mutedInk,
              lineHeight:    1,
            }}>{dateline}</div>
          )}
        </div>

        {/* SVG chart */}
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <defs>
            {/* Per-team draw-on via dashoffset on a normalised path */}
            <clipPath id="lg-clip">
              <rect x={0} y={0} width={1920} height={1080} />
            </clipPath>
          </defs>

          {/* Whisper-light grid */}
          {yLabels.map(pos => {
            const cy = toY(pos, maxPos);
            return (
              <g key={pos} opacity={folioProg}>
                <line
                  x1={PAD_L} y1={cy} x2={1920 - PAD_R} y2={cy}
                  stroke={pos === 1 ? "rgba(17,17,17,0.18)" : whisper}
                  strokeWidth={pos === 1 ? 1.25 : 1}
                  strokeDasharray={pos === 1 ? "none" : "3 7"}
                />
                <text
                  x={PAD_L - 18} y={cy + 6}
                  textAnchor="end"
                  fontFamily={fontFamily}
                  fontSize={15}
                  fontWeight={700}
                  letterSpacing={1.5}
                  fill={pos === 1 ? inkColor : mutedInk}
                >{ordinal(pos).toUpperCase()}</text>
              </g>
            );
          })}

          {/* X-axis baseline */}
          <line
            x1={PAD_L} y1={PAD_T + CH} x2={1920 - PAD_R} y2={PAD_T + CH}
            stroke="rgba(17,17,17,0.20)" strokeWidth={1.25} opacity={folioProg}
          />

          {/* X-axis tick labels */}
          {xLabels.map(md => (
            <text
              key={md}
              x={toX(md, maxMd)} y={PAD_T + CH + 30}
              textAnchor="middle"
              fontFamily={fontFamily}
              fontSize={13}
              fontWeight={600}
              letterSpacing={2}
              fill={mutedInk}
              opacity={folioProg}
            >{md === 1 ? "GW1" : md === maxMd ? `GW${md}` : String(md)}</text>
          ))}

          <text
            x={PAD_L + CW / 2} y={PAD_T + CH + 70}
            textAnchor="middle"
            fontFamily={fontFamily}
            fontSize={11}
            fontWeight={700}
            fill="rgba(17,17,17,0.30)"
            letterSpacing={4}
            opacity={folioProg}
          >MATCHDAY</text>

          {/* Peer team line — muted reference, never competes */}
          {teamB && teamB.data.length > 1 && (
            <PathDrawOn
              d={toFullPath(teamB.data, maxMd, maxPos)}
              stroke={peerColor}
              strokeWidth={2.5}
              strokeDasharray="4 5"
              progress={drawProgress}
            />
          )}

          {/* Subject team line — full accent draw-on */}
          {teamA.data.length > 1 && (
            <PathDrawOn
              d={toFullPath(teamA.data, maxMd, maxPos)}
              stroke={subjectAccent}
              strokeWidth={3.5}
              progress={drawProgress}
            />
          )}

          {/* Subject travelling node */}
          {lastA && drawProgress > 0.05 && (
            <>
              <circle
                cx={toX(lastA.matchday, maxMd)} cy={toY(lastA.position, maxPos)}
                r={14} fill={subjectAccent} opacity={0.18}
              />
              <circle
                cx={toX(lastA.matchday, maxMd)} cy={toY(lastA.position, maxPos)}
                r={6} fill={subjectAccent}
              />
            </>
          )}

          {/* Peer travelling node */}
          {teamB && lastB && drawProgress > 0.05 && (
            <circle
              cx={toX(lastB.matchday, maxMd)} cy={toY(lastB.position, maxPos)}
              r={4} fill={peerColor}
            />
          )}
        </svg>

        {/* Floating end labels (only after draw resolves) */}
        {lastA && (
          <div style={{
            position:   "absolute",
            left:       toX(lastA.matchday, maxMd) + 16,
            top:        toY(lastA.position, maxPos) - 24,
            fontFamily: serifFontFamily,
            fontSize:   24,
            fontWeight: 900,
            color:      inkColor,
            letterSpacing: -0.4,
            opacity:    labelEndOp,
            whiteSpace: "nowrap",
            display:    "flex",
            alignItems: "center",
            gap:        10,
          }}>
            <span style={{ width: 8, height: 8, borderRadius: 8, background: subjectAccent }} />
            {teamA.name}
          </div>
        )}
        {teamB && lastB && (
          <div style={{
            position:   "absolute",
            left:       toX(lastB.matchday, maxMd) + 14,
            top:        toY(lastB.position, maxPos) - 18,
            fontFamily,
            fontSize:   13,
            fontWeight: 700,
            color:      mutedInk,
            letterSpacing: 2,
            textTransform: "uppercase" as const,
            opacity:    labelEndOp,
            whiteSpace: "nowrap",
          }}>{teamB.name}</div>
        )}

        {/* Badges — quiet credentials, top-right */}
        {(teamA.badgeSlug || teamB?.badgeSlug) && (
          <div style={{
            position:      "absolute",
            top:           150,
            right:         PAD_R,
            display:       "flex",
            flexDirection: "column",
            alignItems:    "flex-end",
            gap:           18,
            opacity:       folioProg,
          }}>
            {teamA.badgeSlug && (
              <SmartImg src={`badges/${teamA.badgeSlug}`} style={{ width: 96, height: 96, objectFit: "contain" }} />
            )}
            {teamB?.badgeSlug && (
              <SmartImg src={`badges/${teamB.badgeSlug}`} style={{ width: 56, height: 56, objectFit: "contain", opacity: 0.5 }} />
            )}
          </div>
        )}
      </AbsoluteFill>

      {/* Source attribution — bottom-right */}
      {source && (
        <div style={{
          position:      "absolute",
          right:         PAD_R,
          bottom:        72,
          fontFamily,
          fontSize:      11,
          fontWeight:    700,
          letterSpacing: 3.5,
          textTransform: "uppercase" as const,
          color:         mutedInk,
          opacity:       folioProg,
        }}>{source}</div>
      )}

      <Grain />
    </AbsoluteFill>
  );
};

/** Draw-on line via stroke-dasharray + dashoffset against pathLength=1. */
const PathDrawOn: React.FC<{
  d: string;
  stroke: string;
  strokeWidth: number;
  strokeDasharray?: string;
  progress: number;
}> = ({ d, stroke, strokeWidth, strokeDasharray, progress }) => {
  const offset = 1 - progress;
  return (
    <path
      d={d}
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={strokeDasharray ?? "1 1"}
      pathLength={1}
      style={{
        strokeDashoffset: strokeDasharray ? undefined : offset,
        // For dashed peer lines, fade in instead of draw-on
        opacity: strokeDasharray ? Math.min(1, progress * 1.4) : 1,
      }}
    />
  );
};
