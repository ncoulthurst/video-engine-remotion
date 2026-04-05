/**
 * ValueCurve — Single player's market value as a rising stock chart arc.
 *
 * The line draws left→right from the buy price to the peak to the sale.
 * Key milestones are annotated with spring callouts. The final beat is a
 * large profit readout — "+£26.2m" — that springs in after the line
 * reaches the right edge. This is the "stock ticker" metaphor for
 * Brentford's talent-development model.
 *
 * Two special markers override the standard annotation treatment:
 *   buyMarker  — downward arrow + "Signed £Xm" at the start
 *   sellMarker — upward arrow + "Sold £Xm" at the end
 */
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { fontFamily, serifFontFamily, Grain, PaperBackground, DarkBackground, COLORS, SPRINGS, rgbaFromHex } from "./shared";

// ══════════════════════════════════════════════════════════════════════════════
// SCHEMA
// ══════════════════════════════════════════════════════════════════════════════

const DataPointSchema = z.object({
  label:      z.string().optional().default(""),  // e.g., "2017/18"
  value:      z.number(),          // market value in millions
  annotation: z.string().optional().default(""),
});

export const ValueCurvePropsSchema = z.object({
  playerName:  z.string().optional().default("Ollie Watkins"),
  buyFee:      z.number().default(1.8),        // £m paid
  sellFee:     z.number().default(28.0),       // £m received (0 = still at club)
  buySeason:   z.string().optional().default("2017"),
  sellSeason:  z.string().optional().default("2020"),
  currency:    z.string().optional().default("£"),
  accentColor: z.string().optional().default("#E30613"),
  bgColor:     z.string().optional().default("#f0ece4"),
  darkMode:    z.boolean().default(false),
  dataPoints:  z.array(DataPointSchema).default([
    { label: "Sign",      value: 1.8,  annotation: undefined             },
    { label: "2017/18",   value: 3.5,  annotation: undefined             },
    { label: "2018/19",   value: 6.0,  annotation: undefined             },
    { label: "2019/20",   value: 18.0, annotation: "25 Championship goals" },
    { label: "Sale",      value: 28.0, annotation: undefined             },
  ]),
});

export type ValueCurveProps = z.infer<typeof ValueCurvePropsSchema>;

// ══════════════════════════════════════════════════════════════════════════════
// LAYOUT
// ══════════════════════════════════════════════════════════════════════════════

const SCREEN_W = 1920;
const SCREEN_H = 1080;
const CHART_L  = 200;
const CHART_R  = 1720;
const CHART_T  = 220;
const CHART_B  = 860;
const CHART_W  = CHART_R - CHART_L;
const CHART_H  = CHART_B - CHART_T;

// ══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════════════════

function clamp01(v: number) { return Math.max(0, Math.min(1, v)); }

function ptCoords(i: number, n: number, values: number[], yMin: number, yMax: number) {
  const x = CHART_L + (i / (n - 1)) * CHART_W;
  const yNorm = yMax === yMin ? 0.5 : (values[i] - yMin) / (yMax - yMin);
  const y = CHART_B - yNorm * CHART_H;
  return { x, y };
}

function buildSmoothPath(coords: { x: number; y: number }[]): string {
  if (coords.length < 2) return "";
  let d = `M ${coords[0].x} ${coords[0].y}`;
  for (let i = 1; i < coords.length; i++) {
    const p = coords[i - 1];
    const c = coords[i];
    const cpX = (p.x + c.x) / 2;
    d += ` C ${cpX} ${p.y}, ${cpX} ${c.y}, ${c.x} ${c.y}`;
  }
  return d;
}

function segLens(coords: { x: number; y: number }[]): number[] {
  return coords.slice(1).map((c, i) => {
    const dx = c.x - coords[i].x;
    const dy = c.y - coords[i].y;
    return Math.sqrt(dx * dx + dy * dy);
  });
}

function fmt(currency: string, m: number) {
  return `${currency}${m}m`;
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

export const ValueCurve: React.FC<ValueCurveProps> = ({
  playerName,
  buyFee,
  sellFee,
  buySeason,
  sellSeason,
  currency,
  accentColor,
  bgColor,
  darkMode,
  dataPoints,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const n = dataPoints.length;

  const textColor  = darkMode ? "#f5f0e8" : COLORS.primary;
  const mutedText  = darkMode ? "rgba(255,255,255,0.45)" : COLORS.muted;
  const gridColor  = darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const accRgba    = (a: number) => rgbaFromHex(accentColor, a);

  // ── Data ──────────────────────────────────────────────────────────────────
  const values = dataPoints.map((d) => d.value);
  const yMin   = 0;
  const yMax   = Math.max(...values) * 1.18;
  const coords = dataPoints.map((_, i) => ptCoords(i, n, values, yMin, yMax));
  const pathStr = buildSmoothPath(coords);
  const segs    = segLens(coords);
  const totalLen = segs.reduce((a, b) => a + b, 0);

  const sold = sellFee > 0;
  const profit = sold ? sellFee - buyFee : 0;

  // ── Timing ────────────────────────────────────────────────────────────────
  const INTRO_DUR    = 30;
  const DRAW_SPEED   = 0.28;
  const DWELL        = 50;
  const OUTRO        = 70;

  const arrivalFrames: number[] = [INTRO_DUR];
  for (let i = 1; i < n; i++) {
    const prevDwell = dataPoints[i - 1].annotation ? DWELL : 0;
    arrivalFrames.push(arrivalFrames[i - 1] + prevDwell + Math.round(segs[i - 1] * DRAW_SPEED));
  }
  const lastArrival = arrivalFrames[n - 1];
  const profitReveal = lastArrival + (dataPoints[n - 1].annotation ? DWELL : 0) + 30;

  // ── Drawn fraction ────────────────────────────────────────────────────────
  let drawnFrac = 0;
  for (let i = 0; i < n - 1; i++) {
    const dwellEnd = arrivalFrames[i] + (dataPoints[i].annotation ? DWELL : 0);
    const segEnd   = arrivalFrames[i + 1];
    const segFrac  = segs[i] / totalLen;
    const startFrac = segs.slice(0, i).reduce((a, b) => a + b, 0) / totalLen;
    if (frame <= dwellEnd) { drawnFrac = startFrac; break; }
    if (frame < segEnd) { drawnFrac = startFrac + segFrac * ((frame - dwellEnd) / (segEnd - dwellEnd)); break; }
    drawnFrac = startFrac + segFrac;
  }
  if (frame >= lastArrival) drawnFrac = 1;

  // ── Gradient defs ─────────────────────────────────────────────────────────
  // Line uses a gradient from buy color → accent (shows value growth)
  const buyColor = darkMode ? "#888" : "#999";

  // ── Header ────────────────────────────────────────────────────────────────
  const headerProg = clamp01(spring({ frame, fps, config: SPRINGS.header }));

  // ── Grid y-values ─────────────────────────────────────────────────────────
  const gridTicks = [0, 0.25, 0.5, 0.75, 1.0].map((t) => ({
    v: Math.round(t * yMax),
    y: CHART_B - t * CHART_H,
  }));

  return (
    <AbsoluteFill>
      {darkMode ? <DarkBackground /> : <PaperBackground color={bgColor} />}
      <Grain />

      {/* ── Fixed header ──────────────────────────────────────────────────── */}
      <div style={{
        position:  "absolute",
        top:       46,
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
          {playerName}
        </div>
        <div style={{
          fontFamily,
          fontSize:   18,
          fontWeight: 400,
          color:      mutedText,
          marginTop:  6,
        }}>
          Market value · {buySeason}
          {sold && sellSeason ? ` → ${sellSeason}` : ""}
        </div>
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
        <defs>
          {/* Gradient along the line: muted at start → accent at end */}
          <linearGradient id="valueLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor={buyColor}    />
            <stop offset="60%"  stopColor={accentColor} />
            <stop offset="100%" stopColor={accentColor} />
          </linearGradient>

          {/* Clip rect: only show drawn portion */}
          <clipPath id="valueDraw">
            <rect
              x={CHART_L - 4}
              y={CHART_T - 40}
              width={CHART_W * drawnFrac + 4}
              height={CHART_H + 80}
            />
          </clipPath>
        </defs>

        {/* Grid lines */}
        {gridTicks.map(({ y }, gi) => (
          <line key={gi} x1={CHART_L} y1={y} x2={CHART_R} y2={y}
            stroke={gridColor} strokeWidth={1} />
        ))}

        {/* Baseline */}
        <line x1={CHART_L} y1={CHART_B} x2={CHART_R} y2={CHART_B}
          stroke={darkMode ? "rgba(255,255,255,0.20)" : "rgba(0,0,0,0.18)"}
          strokeWidth={1.5} />

        {/* Area fill under the line */}
        {drawnFrac > 0.01 && (
          <path
            d={pathStr + ` L ${coords[0].x + (coords[n-1].x - coords[0].x) * drawnFrac} ${CHART_B} L ${coords[0].x} ${CHART_B} Z`}
            fill={`url(#valueLine)`}
            opacity={0.07}
            clipPath="url(#valueDraw)"
          />
        )}

        {/* The value line */}
        <path
          d={pathStr}
          fill="none"
          stroke="url(#valueLine)"
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={Math.max(0, 1 - drawnFrac)}
        />

        {/* Data point nodes */}
        {dataPoints.map((dp, i) => {
          const nodeProg = clamp01(spring({ frame: frame - arrivalFrames[i], fps, config: { damping: 18, stiffness: 120 } }));
          if (nodeProg < 0.01) return null;
          const { x, y } = coords[i];
          const isFirst = i === 0;
          const isLast  = i === n - 1;
          const r = (isFirst || isLast) ? 9 : 6;
          return (
            <g key={i}>
              {(isFirst || isLast) && (
                <circle cx={x} cy={y} r={(r + 8) * nodeProg} fill={accentColor} opacity={0.15} />
              )}
              <circle cx={x} cy={y} r={r * nodeProg} fill={darkMode ? "#111" : (bgColor ?? "#f0ece4")} />
              <circle cx={x} cy={y} r={r * nodeProg} fill={accentColor} opacity={nodeProg} />
            </g>
          );
        })}
      </svg>

      {/* ── Buy marker (first point) ─────────────────────────────────────── */}
      {(() => {
        const mp = clamp01(spring({ frame: frame - arrivalFrames[0] - 4, fps, config: SPRINGS.feature }));
        if (mp < 0.01) return null;
        const { x, y } = coords[0];
        return (
          <div style={{
            position:  "absolute",
            left:      x,
            top:       y + 22,
            transform: `translateX(-50%) translateY(${interpolate(mp, [0, 1], [-8, 0])}px)`,
            opacity:   mp,
            textAlign: "center",
            pointerEvents: "none",
          }}>
            <div style={{ fontFamily, fontSize: 13, fontWeight: 700, color: mutedText, letterSpacing: 2, textTransform: "uppercase" }}>
              Signed
            </div>
            <div style={{
              fontFamily:    serifFontFamily,
              fontSize:      22,
              fontWeight:    900,
              color:         textColor,
              letterSpacing: -0.5,
            }}>
              {fmt(currency, buyFee)}
            </div>
          </div>
        );
      })()}

      {/* ── Sell marker (last point) ─────────────────────────────────────── */}
      {sold && (() => {
        const sp = clamp01(spring({ frame: frame - lastArrival - 4, fps, config: SPRINGS.feature }));
        if (sp < 0.01) return null;
        const { x, y } = coords[n - 1];
        return (
          <div style={{
            position:  "absolute",
            left:      x,
            top:       y + 22,
            transform: `translateX(-50%) translateY(${interpolate(sp, [0, 1], [-8, 0])}px)`,
            opacity:   sp,
            textAlign: "center",
            pointerEvents: "none",
          }}>
            <div style={{ fontFamily, fontSize: 13, fontWeight: 700, color: mutedText, letterSpacing: 2, textTransform: "uppercase" }}>
              Sold
            </div>
            <div style={{
              fontFamily:    serifFontFamily,
              fontSize:      22,
              fontWeight:    900,
              color:         accentColor,
              letterSpacing: -0.5,
            }}>
              {fmt(currency, sellFee)}
            </div>
          </div>
        );
      })()}

      {/* ── Intermediate annotation callouts ─────────────────────────────── */}
      {dataPoints.map((dp, i) => {
        if (!dp.annotation || i === 0 || i === n - 1) return null;
        const cp = clamp01(spring({ frame: frame - arrivalFrames[i] - 6, fps, config: { damping: 20, stiffness: 65 } }));
        if (cp < 0.01) return null;
        const { x, y } = coords[i];
        const above = y > CHART_T + CHART_H * 0.4;
        const calloutY = above ? y - 68 : y + 36;
        return (
          <div key={i} style={{
            position:  "absolute",
            left:      x,
            top:       calloutY,
            transform: `translateX(-50%) translateY(${interpolate(cp, [0, 1], [above ? 8 : -8, 0])}px)`,
            opacity:   cp,
            textAlign: "center",
            pointerEvents: "none",
          }}>
            <div style={{
              display:    "inline-block",
              background: darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
              borderRadius: 6,
              padding:    "5px 12px",
              fontFamily:  serifFontFamily,
              fontSize:   14,
              fontWeight: 700,
              color:      textColor,
              whiteSpace: "nowrap",
            }}>
              {dp.annotation}
            </div>
          </div>
        );
      })}

      {/* ── Y-axis labels ─────────────────────────────────────────────────── */}
      {gridTicks.filter((_, gi) => gi > 0).map(({ v, y }, gi) => (
        <div key={gi} style={{
          position:   "absolute",
          right:      SCREEN_W - CHART_L + 12,
          top:        y,
          transform:  "translateY(-50%)",
          opacity:    0.45,
          fontFamily,
          fontSize:   13,
          fontWeight: 500,
          color:      mutedText,
          textAlign:  "right",
        }}>
          {currency}{v}m
        </div>
      ))}

      {/* ── Profit readout ────────────────────────────────────────────────── */}
      {sold && (() => {
        const pp = clamp01(spring({ frame: frame - profitReveal, fps, config: { damping: 16, stiffness: 45 } }));
        if (pp < 0.01) return null;
        return (
          <div style={{
            position:  "absolute",
            bottom:    68,
            right:     SCREEN_W - CHART_R,
            textAlign: "right",
            opacity:   pp,
            transform: `translateY(${interpolate(pp, [0, 1], [20, 0])}px) scale(${interpolate(pp, [0, 1], [0.92, 1])})`,
          }}>
            <div style={{
              fontFamily,
              fontSize:   13,
              fontWeight: 700,
              color:      mutedText,
              letterSpacing: 2,
              textTransform: "uppercase",
              marginBottom: 4,
            }}>
              Profit on sale
            </div>
            <div style={{
              fontFamily:    serifFontFamily,
              fontSize:      80,
              fontWeight:    900,
              color:         accentColor,
              letterSpacing: -4,
              lineHeight:    1,
            }}>
              +{fmt(currency, profit)}
            </div>
          </div>
        );
      })()}
    </AbsoluteFill>
  );
};
