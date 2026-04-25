/**
 * StatPulse — Animated line chart that draws itself from left to right.
 *
 * The line traces out across the chart, pausing at annotated data points
 * while a callout label springs into view. The peak value is spotlit with a
 * glowing circle. Gridlines and axis labels are already present, ghosted,
 * so the viewer understands the chart structure before the line arrives.
 *
 * No camera movement — the drawing line IS the animation. Dwell at each
 * annotated point gives narration time to land.
 */
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { fontFamily, serifFontFamily, Grain, PaperBackground, DarkBackground, COLORS, SPRINGS, WorldStateSchema} from "./shared";

// ══════════════════════════════════════════════════════════════════════════════
// SCHEMA
// ══════════════════════════════════════════════════════════════════════════════

const DataPointSchema = z.object({
  label:      z.string().optional().default(""),
  value:      z.number(),
  annotation: z.string().optional().default(""),   // if set, line pauses here and callout appears
});

export const StatPulsePropsSchema = z.object({
  title:        z.string().optional().default("Season by Season"),
  subtitle:     z.string().optional().default(""),
  unit:         z.string().optional().default("goals"),
  accentColor:  z.string().optional().default("#C8102E"),
  bgColor:      z.string().optional().default("#f0ece4"),
  darkMode:     z.boolean().default(false),
  showArea:     z.boolean().default(true),
  dwellFrames:  z.number().default(55),   // how long to pause at each annotated point
  dataPoints:   z.array(DataPointSchema).default([
    { label: "03/04", value: 30,  annotation: undefined          },
    { label: "04/05", value: 25,  annotation: undefined          },
    { label: "05/06", value: 27,  annotation: undefined          },
    { label: "06/07", value: 23,  annotation: undefined          },
    { label: "07/08", value: 31,  annotation: "Golden Boot"      },
    { label: "08/09", value: 18,  annotation: undefined          },
    { label: "09/10", value: 29,  annotation: undefined          },
    { label: "10/11", value: 33,  annotation: "All-time record"  },
    { label: "11/12", value: 14,  annotation: undefined          },
    { label: "12/13", value: 26,  annotation: undefined          },
  ]),
  worldState: WorldStateSchema.optional(),
  skipIntro: z.boolean().optional().default(false),
});

export type StatPulseProps = z.infer<typeof StatPulsePropsSchema>;

// ══════════════════════════════════════════════════════════════════════════════
// LAYOUT CONSTANTS
// ══════════════════════════════════════════════════════════════════════════════

const SCREEN_W   = 1920;
const SCREEN_H   = 1080;
const CHART_L    = 160;   // left edge of chart (y-axis space)
const CHART_R    = 1800;  // right edge
const CHART_T    = 220;   // top of chart area
const CHART_B    = 920;   // bottom of chart area (x-axis space)
const CHART_W    = CHART_R - CHART_L;
const CHART_H    = CHART_B - CHART_T;
const GRID_LINES = 5;

// ══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════════════════

function clamp01(v: number) { return Math.max(0, Math.min(1, v)); }

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

function pointCoords(
  i: number,
  n: number,
  values: number[],
  minV: number,
  maxV: number,
): { x: number; y: number } {
  const x = CHART_L + (i / (n - 1)) * CHART_W;
  const yNorm = maxV === minV ? 0.5 : (values[i] - minV) / (maxV - minV);
  const y = CHART_B - yNorm * CHART_H;
  return { x, y };
}

/** Build the SVG path string for the full line */
function buildPath(coords: { x: number; y: number }[]): string {
  if (coords.length < 2) return "";
  let d = `M ${coords[0].x} ${coords[0].y}`;
  for (let i = 1; i < coords.length; i++) {
    // Cubic bezier for a smooth curve
    const prev = coords[i - 1];
    const curr = coords[i];
    const cpX  = (prev.x + curr.x) / 2;
    d += ` C ${cpX} ${prev.y}, ${cpX} ${curr.y}, ${curr.x} ${curr.y}`;
  }
  return d;
}

/** Approximate path length for n segments (simplified — good enough for timing) */
function approxPathLength(coords: { x: number; y: number }[]): number {
  let len = 0;
  for (let i = 1; i < coords.length; i++) {
    const dx = coords[i].x - coords[i - 1].x;
    const dy = coords[i].y - coords[i - 1].y;
    len += Math.sqrt(dx * dx + dy * dy);
  }
  return len;
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

export const StatPulse: React.FC<StatPulseProps> = ({
  title,
  subtitle,
  unit,
  accentColor,
  bgColor,
  darkMode,
  showArea,
  dwellFrames,
  dataPoints,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const n = dataPoints.length;

  const textColor    = darkMode ? "#f5f0e8" : COLORS.primary;
  const gridColor    = darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)";
  const axisColor    = darkMode ? "rgba(255,255,255,0.30)" : "rgba(0,0,0,0.25)";
  const mutedText    = darkMode ? "rgba(255,255,255,0.40)" : COLORS.muted;

  // ── Data ──────────────────────────────────────────────────────────────────
  const values  = dataPoints.map((d) => d.value);
  const minV    = Math.min(...values);
  const maxV    = Math.max(...values);
  const padding = (maxV - minV) * 0.15;
  const yMin    = Math.max(0, minV - padding);
  const yMax    = maxV + padding;
  const peakIdx = values.indexOf(maxV);

  const coords = dataPoints.map((_, i) =>
    pointCoords(i, n, values, yMin, yMax)
  );

  const pathStr     = buildPath(coords);
  const totalLength = approxPathLength(coords);

  // ── Timing ────────────────────────────────────────────────────────────────
  // The line draws continuously with dwells at annotated points.
  // We compute segment lengths for proportional timing.
  const segLengths: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    const dx = coords[i + 1].x - coords[i].x;
    const dy = coords[i + 1].y - coords[i].y;
    segLengths.push(Math.sqrt(dx * dx + dy * dy));
  }
  const totalSegLen = segLengths.reduce((a, b) => a + b, 0);

  // drawSpeed: frames per unit length (controls how fast line draws between points)
  const DRAW_SPEED    = 0.32;  // frames per pixel of path length
  const INTRO_DUR     = 35;
  const OUTRO_DUR     = 70;

  // For each data point, compute the frame when the line ARRIVES at it
  const arrivalFrames: number[] = [INTRO_DUR];
  for (let i = 1; i < n; i++) {
    const prevArrival  = arrivalFrames[i - 1];
    const prevDwell    = dataPoints[i - 1].annotation ? dwellFrames : 0;
    const drawDuration = Math.round(segLengths[i - 1] * DRAW_SPEED);
    arrivalFrames.push(prevArrival + prevDwell + drawDuration);
  }

  const drawEndFrame = arrivalFrames[n - 1] + (dataPoints[n - 1].annotation ? dwellFrames : 0);
  const outroStart   = drawEndFrame + 20;

  // ── Line draw progress (0→1 over the path) ───────────────────────────────
  // We advance through arrival frames, computing how much of the path is drawn.
  // Between arrival[i] and arrival[i+1] (minus dwell), we interpolate linearly.
  let drawnFraction = 0;
  for (let i = 0; i < n - 1; i++) {
    const dwellEnd    = arrivalFrames[i] + (dataPoints[i].annotation ? dwellFrames : 0);
    const segEnd      = arrivalFrames[i + 1];
    const segLenFrac  = segLengths[i] / totalSegLen;
    const startFrac   = segLengths.slice(0, i).reduce((a, b) => a + b, 0) / totalSegLen;

    if (frame <= dwellEnd) {
      // Line at start of this segment
      drawnFraction = startFrac;
      break;
    } else if (frame < segEnd) {
      // Drawing this segment
      const t = (frame - dwellEnd) / (segEnd - dwellEnd);
      drawnFraction = startFrac + segLenFrac * t;
      break;
    }
    // Past this segment
    drawnFraction = startFrac + segLenFrac;
  }
  if (frame >= arrivalFrames[n - 1]) drawnFraction = 1;

  // strokeDashoffset: 1 = fully hidden, 0 = fully drawn (using pathLength="1")
  const dashOffset = Math.max(0, 1 - drawnFraction);

  // ── Header ────────────────────────────────────────────────────────────────
  const headerProg = clamp01(spring({ frame, fps, config: SPRINGS.header }));

  // ── Y-axis grid label values ──────────────────────────────────────────────
  const gridLabels = Array.from({ length: GRID_LINES + 1 }, (_, i) => {
    const v = yMin + (i / GRID_LINES) * (yMax - yMin);
    const y = CHART_B - (i / GRID_LINES) * CHART_H;
    return { v: Math.round(v), y };
  });

  // ── Axis reveal progress ──────────────────────────────────────────────────
  const axisProg = clamp01(spring({ frame: frame - 10, fps, config: { damping: 20, stiffness: 50 } }));

  return (
    <AbsoluteFill>
      {darkMode ? <DarkBackground /> : <PaperBackground color={bgColor} />}
      <Grain />

      {/* ── Fixed header ──────────────────────────────────────────────────── */}
      <div style={{
        position:  "absolute",
        top:       48,
        left:      CHART_L,
        zIndex:    30,
        opacity:   headerProg,
        transform: `translateY(${interpolate(headerProg, [0, 1], [-10, 0])}px)`,
      }}>
        <div style={{
          fontFamily:    serifFontFamily,
          fontSize:      58,
          fontWeight:    900,
          color:         textColor,
          letterSpacing: -2,
          lineHeight:    1,
        }}>
          {title}
        </div>
        {subtitle && (
          <div style={{
            fontFamily,
            fontSize:   19,
            fontWeight: 400,
            color:      darkMode ? "rgba(255,255,255,0.55)" : COLORS.secondary,
            marginTop:  7,
          }}>
            {subtitle}
          </div>
        )}
        <div style={{
          width:        `${interpolate(headerProg, [0, 1], [0, 52])}px`,
          height:       4,
          background:   accentColor,
          borderRadius: 2,
          marginTop:    14,
        }} />
      </div>

      {/* ── Chart SVG ─────────────────────────────────────────────────────── */}
      <svg
        style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
        width={SCREEN_W}
        height={SCREEN_H}
      >
        {/* Grid lines */}
        {gridLabels.map(({ y }, gi) => (
          <line
            key={gi}
            x1={CHART_L} y1={y}
            x2={CHART_R} y2={y}
            stroke={gridColor}
            strokeWidth={1}
            opacity={axisProg}
          />
        ))}

        {/* X-axis baseline */}
        <line
          x1={CHART_L} y1={CHART_B}
          x2={CHART_R} y2={CHART_B}
          stroke={axisColor}
          strokeWidth={1.5}
          opacity={axisProg}
        />

        {/* Area fill — same path, closed to baseline */}
        {showArea && drawnFraction > 0.01 && (() => {
          // Build partial area path up to drawn fraction
          // We approximate by taking the full path and using a clip approach
          const areaPath = pathStr + ` L ${lerp(coords[0].x, coords[n-1].x, drawnFraction)} ${CHART_B} L ${coords[0].x} ${CHART_B} Z`;
          return (
            <path
              d={areaPath}
              fill={accentColor}
              opacity={0.08}
              clipPath={`url(#drawClip)`}
            />
          );
        })()}

        {/* Clip rect — only shows drawn portion of area */}
        <defs>
          <clipPath id="drawClip">
            <rect
              x={CHART_L}
              y={CHART_T - 20}
              width={CHART_W * drawnFraction}
              height={CHART_H + 40}
            />
          </clipPath>
        </defs>

        {/* The line — uses pathLength="1" + strokeDashoffset for clean animation */}
        <path
          d={pathStr}
          fill="none"
          stroke={accentColor}
          strokeWidth={3.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={dashOffset}
        />

        {/* Data point nodes — appear when line arrives at them */}
        {dataPoints.map((dp, i) => {
          const arrF = arrivalFrames[i];
          const nodeProg = clamp01(spring({ frame: frame - arrF, fps, config: { damping: 18, stiffness: 120 } }));
          if (nodeProg < 0.01) return null;

          const { x, y } = coords[i];
          const isPeak   = i === peakIdx;

          return (
            <g key={i}>
              {/* Glow for peak */}
              {isPeak && (
                <circle
                  cx={x} cy={y}
                  r={(16 + Math.sin(frame * 0.08) * 2) * nodeProg}
                  fill={accentColor}
                  opacity={0.18 * nodeProg}
                />
              )}
              {/* Opaque bg circle — covers gridline behind it */}
              <circle
                cx={x} cy={y}
                r={isPeak ? 9 * nodeProg : 5.5 * nodeProg}
                fill={darkMode ? "#111111" : (bgColor ?? "#f0ece4")}
              />
              {/* Accent circle */}
              <circle
                cx={x} cy={y}
                r={isPeak ? 9 * nodeProg : 5.5 * nodeProg}
                fill={accentColor}
                opacity={nodeProg}
              />
            </g>
          );
        })}
      </svg>

      {/* ── X-axis labels ─────────────────────────────────────────────────── */}
      {dataPoints.map((dp, i) => {
        const arrF   = arrivalFrames[i];
        const lProg  = clamp01(spring({ frame: frame - arrF, fps, config: { damping: 22, stiffness: 70 } }));
        if (lProg < 0.01) return null;

        const { x } = coords[i];
        return (
          <div
            key={i}
            style={{
              position:  "absolute",
              left:      x,
              top:       CHART_B + 18,
              transform: `translateX(-50%) translateY(${interpolate(lProg, [0, 1], [6, 0])}px)`,
              opacity:   lProg * 0.7,
              fontFamily,
              fontSize:  14,
              fontWeight: 500,
              color:     mutedText,
              whiteSpace: "nowrap",
            }}
          >
            {dp.label}
          </div>
        );
      })}

      {/* ── Y-axis labels ─────────────────────────────────────────────────── */}
      {gridLabels.map(({ v, y }, gi) => (
        <div
          key={gi}
          style={{
            position:  "absolute",
            right:     SCREEN_W - CHART_L + 14,
            top:       y,
            transform: "translateY(-50%)",
            opacity:   axisProg * 0.6,
            fontFamily,
            fontSize:  13,
            fontWeight: 500,
            color:     mutedText,
            textAlign: "right",
          }}
        >
          {v}
        </div>
      ))}

      {/* ── Unit label ────────────────────────────────────────────────────── */}
      <div style={{
        position:  "absolute",
        left:      CHART_L - 8,
        top:       CHART_T - 30,
        opacity:   axisProg * 0.55,
        fontFamily,
        fontSize:  12,
        fontWeight: 700,
        color:     mutedText,
        letterSpacing: 1.5,
        textTransform: "uppercase",
      }}>
        {unit}
      </div>

      {/* ── Annotation callouts ───────────────────────────────────────────── */}
      {dataPoints.map((dp, i) => {
        if (!dp.annotation) return null;

        const arrF    = arrivalFrames[i];
        const cProg   = clamp01(spring({ frame: frame - arrF - 6, fps, config: { damping: 20, stiffness: 65 } }));
        if (cProg < 0.01) return null;

        const { x, y } = coords[i];
        const above     = y > CHART_T + CHART_H / 2;
        const calloutY  = above ? y - 70 : y + 40;
        const isPeak    = i === peakIdx;

        return (
          <div
            key={i}
            style={{
              position:  "absolute",
              left:      x,
              top:       calloutY,
              transform: `translateX(-50%) translateY(${interpolate(cProg, [0, 1], [above ? 10 : -10, 0])}px)`,
              opacity:   cProg,
              textAlign: "center",
              pointerEvents: "none",
            }}
          >
            {/* Connector line */}
            <svg
              style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", top: above ? "100%" : undefined, bottom: above ? undefined : "100%" }}
              width={2}
              height={24}
            >
              <line x1={1} y1={0} x2={1} y2={24} stroke={accentColor} strokeWidth={1.5} opacity={0.6} />
            </svg>

            {/* Label pill */}
            <div style={{
              display:       "inline-block",
              background:    isPeak ? accentColor : (darkMode ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.07)"),
              borderRadius:  6,
              padding:       "5px 12px",
              fontFamily:    serifFontFamily,
              fontSize:      15,
              fontWeight:    700,
              color:         isPeak ? "#fff" : textColor,
              letterSpacing: 0,
              whiteSpace:    "nowrap",
              boxShadow:     isPeak ? `0 4px 18px ${accentColor}55` : "none",
            }}>
              {dp.annotation}
            </div>
          </div>
        );
      })}

      {/* ── Peak value readout ────────────────────────────────────────────── */}
      {(() => {
        const arrF  = arrivalFrames[peakIdx];
        const vProg = clamp01(spring({ frame: frame - arrF - 4, fps, config: SPRINGS.feature }));
        if (vProg < 0.01) return null;

        const { x, y } = coords[peakIdx];
        const above    = y > CHART_T + CHART_H / 2;
        const labelTop = above ? y - 130 : y + 26;

        return (
          <div style={{
            position:  "absolute",
            left:      x,
            top:       labelTop,
            transform: `translateX(-50%) scale(${interpolate(vProg, [0, 1], [0.85, 1])})`,
            opacity:   vProg,
            textAlign: "center",
            pointerEvents: "none",
          }}>
            <div style={{
              fontFamily:    serifFontFamily,
              fontSize:      48,
              fontWeight:    900,
              color:         accentColor,
              letterSpacing: -2,
              lineHeight:    1,
            }}>
              {dataPoints[peakIdx].value}
            </div>
          </div>
        );
      })()}
    </AbsoluteFill>
  );
};
