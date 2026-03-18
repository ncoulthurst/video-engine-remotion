/**
 * AttackingRadar — StatsBomb-style football analytics radar chart.
 *
 * Narration-sync: each metric has a revealFrame so the polygon builds
 * segment-by-segment in time with a voiceover.
 *
 * Dot / pill colours are 100% percentile-driven — no manual override needed.
 * The polygon stays team colour; each axis dot uses a heat scale.
 *
 * lightMode: true  → warm cream background, dark text (matches Intrcpt series)
 * lightMode: false → dark background, light text
 */
import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";
import { fontFamily, PaperBackground, DarkBackground, Grain, Vignette } from "./shared";

// ── Schema ────────────────────────────────────────────────────────────────────

const MetricSchema = z.object({
  label:       z.string(),
  value:       z.number(),
  percentile:  z.number(),
  unit:        z.string().default(""),
  revealFrame: z.number().optional(),
});

export const AttackingRadarPropsSchema = z.object({
  entityName:     z.string().default("Florian Wirtz"),
  competition:    z.string().default("Premier League"),
  season:         z.string().default("2025/2026"),
  matchType:      z.string().default("All Matches"),
  nineties:       z.number().default(26),
  accentColor:    z.string().default("#D4001A"),
  bgColor:        z.string().default("#f0ece4"),
  lightMode:      z.boolean().default(true),
  introFrames:    z.number().default(40),
  revealInterval: z.number().default(50),
  metrics: z.array(MetricSchema).default([
    { label: "Non-Penalty\nGoals",      value: 0.42, percentile: 86, unit: "" },
    { label: "Expected\nGoals (xG)",    value: 0.38, percentile: 89, unit: "" },
    { label: "Expected\nAssists (xA)",  value: 0.41, percentile: 94, unit: "" },
    { label: "Shot-Creating\nActions",  value: 6.2,  percentile: 96, unit: "" },
    { label: "Key Passes",              value: 3.4,  percentile: 93, unit: "" },
    { label: "Dribbles\nCompleted",     value: 3.8,  percentile: 88, unit: "" },
    { label: "Progressive\nCarries",    value: 7.9,  percentile: 91, unit: "" },
    { label: "Progressive\nPasses",     value: 6.8,  percentile: 82, unit: "" },
    { label: "Touches in\nPenalty Box", value: 7.1,  percentile: 85, unit: "" },
  ]),
});

export type AttackingRadarProps = z.infer<typeof AttackingRadarPropsSchema>;

// ── Colour helpers ────────────────────────────────────────────────────────────

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// Heat colours — two sets so they read well against either background
const HEAT_LIGHT = { elite: "#0277BD", good: "#2E7D32", avg: "#E65100", weak: "#C62828" };
const HEAT_DARK  = { elite: "#4FC3F7", good: "#81C784", avg: "#FFD54F", weak: "#EF5350" };

function heatColor(p: number, light: boolean): string {
  const h = light ? HEAT_LIGHT : HEAT_DARK;
  if (p >= 80) return h.elite;
  if (p >= 65) return h.good;
  if (p >= 45) return h.avg;
  return h.weak;
}

function getRevealFrame(
  m: z.infer<typeof MetricSchema>,
  i: number,
  introFrames: number,
  revealInterval: number,
): number {
  return m.revealFrame ?? introFrames + i * revealInterval;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const AttackingRadar: React.FC<AttackingRadarProps> = ({
  entityName,
  competition,
  season,
  matchType,
  nineties,
  accentColor,
  bgColor,
  lightMode,
  introFrames,
  revealInterval,
  metrics,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Derived colour tokens — everything in one place
  const T = lightMode ? {
    text:           "#111111",
    textSub:        "rgba(0,0,0,0.55)",
    textMeta:       "rgba(0,0,0,0.40)",
    textLabel:      "rgba(0,0,0,0.65)",
    textLabelActive:"#111111",
    textMuted:      "rgba(0,0,0,0.28)",
    ring:           "rgba(0,0,0,0.07)",
    ringOuter:      "rgba(0,0,0,0.14)",
    ringLabel:      "rgba(0,0,0,0.35)",
    axis:           "rgba(0,0,0,0.13)",
    axisUnrevealed: "rgba(0,0,0,0.06)",
    polyFill:       0.18,    // polygon fill alpha
    divider:        "rgba(0,0,0,0.08)",
    headerBorder:   "rgba(0,0,0,0.09)",
    colHeader:      "rgba(0,0,0,0.35)",
    rowAlt:         "rgba(0,0,0,0.025)",
    rowBorder:      "rgba(0,0,0,0.05)",
    valueText:      "rgba(0,0,0,0.88)",
    valueActive:    "#111111",
    footer:         "rgba(0,0,0,0.30)",
  } : {
    text:           "#ffffff",
    textSub:        "rgba(255,255,255,0.50)",
    textMeta:       "rgba(255,255,255,0.28)",
    textLabel:      "rgba(255,255,255,0.65)",
    textLabelActive:"#ffffff",
    textMuted:      "rgba(255,255,255,0.25)",
    ring:           "rgba(255,255,255,0.07)",
    ringOuter:      "rgba(255,255,255,0.14)",
    ringLabel:      "rgba(255,255,255,0.18)",
    axis:           "rgba(255,255,255,0.14)",
    axisUnrevealed: "rgba(255,255,255,0.06)",
    polyFill:       0.28,
    divider:        "rgba(255,255,255,0.07)",
    headerBorder:   "rgba(255,255,255,0.09)",
    colHeader:      "rgba(255,255,255,0.30)",
    rowAlt:         "rgba(255,255,255,0.012)",
    rowBorder:      "rgba(255,255,255,0.045)",
    valueText:      "rgba(255,255,255,0.88)",
    valueActive:    "#ffffff",
    footer:         "rgba(255,255,255,0.20)",
  };

  const N  = metrics.length;
  const R  = 295;
  const cx = 510;
  const cy = 575;

  // ── Springs ───────────────────────────────────────────────────────────────

  const titleIn = spring({ frame, fps, config: { damping: 22, stiffness: 60 }, delay: 0 });
  const gridIn  = spring({ frame, fps, config: { damping: 28, stiffness: 50 }, delay: 8 });

  const metricSprings = metrics.map((m, i) =>
    spring({ frame, fps, config: { damping: 16, stiffness: 52 },
             delay: getRevealFrame(m, i, introFrames, revealInterval) })
  );
  const labelSprings = metrics.map((m, i) =>
    spring({ frame, fps, config: { damping: 22, stiffness: 80 },
             delay: getRevealFrame(m, i, introFrames, revealInterval) + 10 })
  );
  const tableRowSprings = metrics.map((m, i) =>
    spring({ frame, fps, config: { damping: 22, stiffness: 68 },
             delay: getRevealFrame(m, i, introFrames, revealInterval) })
  );

  // ── Active metric ─────────────────────────────────────────────────────────

  const activeIndex = metrics.reduce<number>((acc, m, i) =>
    frame >= getRevealFrame(m, i, introFrames, revealInterval) ? i : acc, -1
  );

  const isActive = (i: number): boolean => {
    if (activeIndex !== i) return false;
    if (i < metrics.length - 1)
      return frame < getRevealFrame(metrics[i + 1], i + 1, introFrames, revealInterval);
    return true;
  };

  const activePulse = 0.55 + 0.45 * Math.sin(frame * 0.18);

  // ── Geometry ──────────────────────────────────────────────────────────────

  const angleOf = (i: number) => -Math.PI / 2 + (2 * Math.PI * i) / N;

  const getPoint = (i: number, pct: number, scale: number) => {
    const a = angleOf(i);
    const r = (pct / 100) * R * scale;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  };

  const polygonPoints = metrics
    .map((m, i) => { const pt = getPoint(i, m.percentile, metricSprings[i]); return `${pt.x},${pt.y}`; })
    .join(" ");

  // ── Label helpers ─────────────────────────────────────────────────────────

  const LABEL_GAP = 36;
  const labelAnchor = (a: number) => Math.cos(a) > 0.25 ? "start" : Math.cos(a) < -0.25 ? "end" : "middle";
  const labelStartDy = (a: number, n: number) => {
    const h = n * 17;
    if (Math.sin(a) > 0.25) return 0;
    if (Math.sin(a) < -0.25) return -h + 16;
    return -(h / 2) + 8;
  };

  // ── Layout ────────────────────────────────────────────────────────────────

  const TABLE_X = 960; const TABLE_W = 880; const TABLE_PAD = 44;
  const ROW_H = 70; const TABLE_TOP = 148; const HEADER_H = 52;

  return (
    <AbsoluteFill style={{ fontFamily, overflow: "hidden" }}>

      {/* Background */}
      {lightMode
        ? <PaperBackground color={bgColor} />
        : <DarkBackground color={bgColor} />
      }
      {lightMode ? <Grain /> : null}
      {lightMode ? <Vignette /> : null}

      {/* ── Header ── */}
      <div style={{
        position: "absolute", top: 50, left: 68,
        opacity: titleIn,
        transform: `translateY(${interpolate(titleIn, [0, 1], [-20, 0])}px)`,
      }}>
        <div style={{ fontSize: 44, fontWeight: 900, color: accentColor, letterSpacing: -1.5 }}>
          {entityName}
        </div>
        <div style={{ fontSize: 17, fontWeight: 600, color: T.textSub, marginTop: 5, letterSpacing: 0.3 }}>
          {competition} · {season}
        </div>
        <div style={{ fontSize: 14, fontWeight: 400, color: T.textMeta, marginTop: 3 }}>
          {nineties} × 90s · {matchType}
        </div>
      </div>

      <div style={{
        position: "absolute", top: 62, right: 68,
        opacity: titleIn, textAlign: "right",
        color: T.textMuted,
        fontSize: 13, fontWeight: 700, letterSpacing: 2.5, textTransform: "uppercase",
      }}>
        Player Radar
      </div>

      {/* ── SVG radar ── */}
      <svg width={width} height={height}
        style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}>

        {/* Concentric rings */}
        {[20, 40, 60, 80, 100].map((pct, ri) => (
          <circle key={ri} cx={cx} cy={cy} r={(pct / 100) * R * gridIn}
            fill="none"
            stroke={ri === 4 ? T.ringOuter : T.ring}
            strokeWidth={ri === 4 ? 1.5 : 1} />
        ))}

        {/* Ring labels */}
        {[20, 40, 60, 80].map((pct, ri) => (
          <text key={ri} x={cx + 6} y={cy - (pct / 100) * R * gridIn + 13}
            fill={T.ringLabel} fontSize={10} fontFamily={fontFamily}
            fontWeight={600} opacity={gridIn}>
            {pct}
          </text>
        ))}

        {/* Axis lines */}
        {metrics.map((_, i) => {
          const a = angleOf(i); const active = isActive(i); const revealed = metricSprings[i] > 0.01;
          return (
            <line key={i} x1={cx} y1={cy}
              x2={cx + R * Math.cos(a) * gridIn} y2={cy + R * Math.sin(a) * gridIn}
              stroke={active ? hexToRgba(accentColor, 0.55 * activePulse) : revealed ? T.axis : T.axisUnrevealed}
              strokeWidth={active ? 1.5 : 1} />
          );
        })}

        {/* Filled polygon */}
        <polygon points={polygonPoints}
          fill={hexToRgba(accentColor, T.polyFill)}
          stroke={accentColor} strokeWidth={2} strokeLinejoin="round" />

        {/* Vertex dots — heat-coloured */}
        {metrics.map((m, i) => {
          const s = metricSprings[i]; if (s < 0.01) return null;
          const pt = getPoint(i, m.percentile, s);
          const active = isActive(i);
          const color = heatColor(m.percentile, lightMode);
          return (
            <g key={i}>
              {active && (
                <circle cx={pt.x} cy={pt.y}
                  r={interpolate(activePulse, [0, 1], [8, 14])}
                  fill="none" stroke={hexToRgba(color, 0.5 * activePulse)} strokeWidth={1.5} />
              )}
              <circle cx={pt.x} cy={pt.y}
                r={active ? interpolate(activePulse, [0, 1], [5, 7]) : 5}
                fill={color} opacity={s} />
            </g>
          );
        })}

        {/* Axis labels */}
        {metrics.map((m, i) => {
          const a = angleOf(i);
          const lx = cx + (R + LABEL_GAP) * Math.cos(a);
          const ly = cy + (R + LABEL_GAP) * Math.sin(a);
          const anchor = labelAnchor(a) as "start" | "middle" | "end";
          const lines = m.label.split("\n");
          const dy0 = labelStartDy(a, lines.length);
          const active = isActive(i);
          return (
            <text key={i} x={lx} y={ly} textAnchor={anchor}
              fill={active ? T.textLabelActive : T.textLabel}
              fontSize={active ? 14 : 13} fontWeight={active ? 800 : 600}
              fontFamily={fontFamily} letterSpacing={0.2} opacity={labelSprings[i]}>
              {lines.map((line, li) => (
                <tspan key={li} x={lx} dy={li === 0 ? dy0 : 17}>{line}</tspan>
              ))}
            </text>
          );
        })}

        {/* Active metric value callout */}
        {activeIndex >= 0 && (() => {
          const m = metrics[activeIndex]; const s = metricSprings[activeIndex];
          if (s < 0.5) return null;
          const pt = getPoint(activeIndex, m.percentile, s);
          const a = angleOf(activeIndex);
          const cos = Math.cos(a); const sin = Math.sin(a);
          const offX = cos * 22 + (cos > 0 ? 0 : -14);
          const offY = sin * 22 + (sin > 0.2 ? 16 : sin < -0.2 ? -8 : 5);
          return (
            <text x={pt.x + offX} y={pt.y + offY}
              textAnchor={cos > 0.1 ? "start" : cos < -0.1 ? "end" : "middle"}
              fill={heatColor(m.percentile, lightMode)}
              fontSize={13} fontWeight={800} fontFamily={fontFamily}
              opacity={activePulse * 0.9}>
              {m.value % 1 === 0 ? m.value : m.value.toFixed(2)}{m.unit}
            </text>
          );
        })()}
      </svg>

      {/* Divider */}
      <div style={{
        position: "absolute", left: TABLE_X - 1, top: TABLE_TOP, bottom: 56,
        width: 1, background: T.divider, opacity: gridIn,
      }} />

      {/* ── Stats table ── */}
      <div style={{ position: "absolute", left: TABLE_X, top: TABLE_TOP, width: TABLE_W }}>

        {/* Column headers */}
        <div style={{
          display: "flex", alignItems: "center",
          paddingLeft: TABLE_PAD, paddingRight: TABLE_PAD,
          height: HEADER_H, borderBottom: `1px solid ${T.headerBorder}`,
          marginBottom: 2, opacity: gridIn,
        }}>
          {[["Metric (per 90)", 1], ["Value", 120], ["%ile", 120]].map(([label, w], i) => (
            <div key={i} style={{
              ...(i === 0 ? { flex: 1 } : { width: w as number }),
              textAlign: i === 0 ? "left" : "center",
              fontSize: 11, fontWeight: 700, color: T.colHeader,
              letterSpacing: 2.5, textTransform: "uppercase",
            }}>
              {label}
            </div>
          ))}
        </div>

        {/* Rows */}
        {metrics.map((m, i) => {
          const s = tableRowSprings[i]; const active = isActive(i);
          const hc = heatColor(m.percentile, lightMode);
          const label = m.label.replace("\n", " ");
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center",
              paddingLeft: TABLE_PAD, paddingRight: TABLE_PAD,
              height: ROW_H, opacity: s,
              transform: `translateX(${interpolate(s, [0, 1], [50, 0])}px)`,
              borderBottom: `1px solid ${T.rowBorder}`,
              background: active
                ? hexToRgba(accentColor, 0.07 * activePulse)
                : i % 2 === 0 ? T.rowAlt : "transparent",
              borderLeft: active ? `3px solid ${accentColor}` : "3px solid transparent",
            }}>
              {/* Heat dot */}
              <div style={{
                width: active ? 10 : 7, height: active ? 10 : 7,
                borderRadius: "50%", background: hc,
                marginRight: 14, flexShrink: 0,
                boxShadow: active ? `0 0 8px 2px ${hexToRgba(hc, 0.5)}` : "none",
              }} />
              {/* Label */}
              <div style={{
                flex: 1, fontSize: active ? 18 : 16,
                fontWeight: active ? 800 : 600,
                color: active ? T.textLabelActive : T.textLabel,
                letterSpacing: 0.1,
              }}>
                {label}
              </div>
              {/* Value */}
              <div style={{
                width: 120, textAlign: "center",
                fontSize: active ? 22 : 19, fontWeight: 700,
                color: active ? T.valueActive : T.valueText,
              }}>
                {m.value % 1 === 0 ? m.value : m.value.toFixed(2)}{m.unit}
              </div>
              {/* Percentile pill */}
              <div style={{ width: 120, textAlign: "center" }}>
                <div style={{
                  display: "inline-block", minWidth: 52,
                  padding: "5px 14px", borderRadius: 8,
                  background: active
                    ? hexToRgba(accentColor, lightMode ? 0.12 * activePulse : 0.25 * activePulse)
                    : hexToRgba(hc, lightMode ? 0.10 : 0.12),
                  border: active
                    ? `1.5px solid ${hexToRgba(accentColor, 0.7)}`
                    : `1.5px solid ${hexToRgba(hc, lightMode ? 0.35 : 0.45)}`,
                  fontSize: active ? 20 : 17, fontWeight: 900, color: active ? accentColor : hc,
                  boxShadow: active ? `0 0 10px 2px ${hexToRgba(accentColor, 0.25)}` : "none",
                }}>
                  {m.percentile}
                </div>
              </div>
            </div>
          );
        })}

        {/* Footer */}
        <div style={{
          marginTop: 16, paddingLeft: TABLE_PAD,
          fontSize: 12, color: T.footer, fontStyle: "italic", opacity: gridIn,
        }}>
          All units per 90 mins · percentile vs positional peers · {competition} {season}
        </div>
      </div>
    </AbsoluteFill>
  );
};
