/**
 * LineTrendChart — a value-over-time line chart: shared gridlines, a
 * left→right draw-on reveal with a soft area fill and a leading head dot,
 * point markers, and labelled ticks on both axes. The "how did this number
 * move" chart — unemployment/rates/counts across days or months.
 *
 * Recreated from a reference reel (recreate.mp4, segment 3: "Unemployment in
 * the United States, month by month") onto this kit's own visual language —
 * kit tokens only, no local hex/font/spacing.
 */
import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { z } from "zod";
import {
  Ground,
  Kicker,
  AxisFrame,
  SourceTag,
  resolveTheme,
  useOutro,
  wipe,
  fadeUp,
  SPACE,
  TYPE,
  baseTemplateSchema,
  type BaseTemplateProps,
} from "./lib/kit";

// ── Title emphasis — "...*United States*..." renders the marked span in the
// serif italic register; everything else stays in the sans display face. ────
function EmphasisTitle({ text, color }: { text: string; color: string }) {
  const parts = text.split(/\*([^*]+)\*/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} style={{ fontFamily: TYPE.serif, fontStyle: "italic", fontWeight: TYPE.weight.bold, color }}>
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

// smallest 1/2/5 × 10^k at or above v (108000 → 150000, 43 → 50, 850 → 1000)
function niceCeil(v: number): number {
  if (v <= 0) return 1;
  const k = Math.floor(Math.log10(v));
  const base = Math.pow(10, k);
  for (const m of [1, 1.5, 2, 3, 5]) if (m * base >= v - 1e-9) return m * base;
  return 10 * base;
}
function fmtTick(v: number): string {
  if (v >= 1000) return `${Math.round(v / 1000)}k`;
  return String(Math.round(v));
}

// ── Smooth curve (Catmull-Rom → cubic Bezier) — a straight-segment polyline
// changes direction abruptly at every point, which read as jerky/chaotic
// motion on the head dot; this makes the line sail through each point
// instead. Clamped at the ends (reuses the first/last point as the phantom
// neighbour) so the curve doesn't overshoot past the first/last segment. ──
type XY = { x: number; y: number };
function catmullRomControls(pts: XY[], i: number) {
  const p0 = pts[Math.max(0, i - 1)];
  const p1 = pts[i];
  const p2 = pts[i + 1];
  const p3 = pts[Math.min(pts.length - 1, i + 2)];
  return {
    cp1: { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 },
    cp2: { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 },
  };
}
function smoothSegments(pts: XY[]): string {
  let s = "";
  for (let i = 0; i < pts.length - 1; i++) {
    const { cp1, cp2 } = catmullRomControls(pts, i);
    s += ` C ${cp1.x} ${cp1.y} ${cp2.x} ${cp2.y} ${pts[i + 1].x} ${pts[i + 1].y}`;
  }
  return s;
}
function cubicBezierAt(p0: XY, cp1: XY, cp2: XY, p1: XY, t: number): XY {
  const mt = 1 - t;
  const a = mt * mt * mt, b = 3 * mt * mt * t, c = 3 * mt * t * t, e = t * t * t;
  return { x: a * p0.x + b * cp1.x + c * cp2.x + e * p1.x, y: a * p0.y + b * cp1.y + c * cp2.y + e * p1.y };
}

// ── Schema ──────────────────────────────────────────────────────────────────

const PointSchema = z.object({
  label: z.string(),
  value: z.number(),
});

export const LineTrendChartPropsSchema = z.object({
  ...baseTemplateSchema,
  title: z.string().optional().default("Unemployment in the *United States*, month by month"),
  dek: z.string().optional().default(
    "The chart below shows how joblessness rose during 1930, based on data from the U.S. Bureau of Labor Statistics. Each line represents the official unemployment rate reported that month.",
  ),
  points: z.array(PointSchema).optional().default([
    { label: "Monday", value: 12000 },
    { label: "Tuesday", value: 98000 },
    { label: "Wednesday", value: 52000 },
    { label: "Thursday", value: 108000 },
    { label: "Friday", value: 88000 },
    { label: "Saturday", value: 92000 },
    { label: "Sunday", value: 30000 },
  ]),
  ground: z.enum(["paper", "ink", "structure"]).optional().default("structure"),
});
export type LineTrendChartProps = z.input<typeof LineTrendChartPropsSchema> & BaseTemplateProps;

export const LINETRENDCHART_DUR = 210;

const PLOT_H = 420;
const DRAW_START = 30;
// real pixel width, matching Ground's inset stage — NOT a normalised 0–100
// unit box. A 0–100 x-domain stretched to fill the container would scale x
// and y by wildly different factors, turning every point-marker circle into
// a flat ellipse.
const PLOT_W = 1920 - SPACE.page * 2;

export const LineTrendChart: React.FC<LineTrendChartProps> = ({
  title = "",
  dek = "",
  points = [],
  ground = "structure",
  accentColor,
  kicker,
  source,
  skipIntro,
  animateOut,
}) => {
  const frame = useCurrentFrame();
  const t = resolveTheme(ground, accentColor);
  const outro = useOutro(animateOut);
  const d = skipIntro ? -999 : 0;
  const n = Math.max(2, points.length);

  const values = points.map((p) => p.value);
  const hi = niceCeil(Math.max(...values, 1));
  // AxisFrame distributes yTicks top→bottom, and this chart plots 0 at the
  // bottom (standard), so the label list must run high→low to match.
  const yTicks = [1, 0.5, 0].map((f) => fmtTick(f * hi));

  const px = (i: number) => (i / (n - 1)) * PLOT_W;
  const py = (v: number) => PLOT_H - (v / hi) * PLOT_H;
  const pts: XY[] = points.map((p, i) => ({ x: px(i), y: py(p.value) }));

  // slower and eased across the whole reveal (not just per-segment) — a
  // sharper draw read as rushed even before the curve-smoothing fix.
  const drawDur = Math.min(170, 80 + n * 12);
  const raw = skipIntro
    ? 1
    : interpolate(frame, [d + DRAW_START, d + DRAW_START + drawDur], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.cubic),
      });
  const headPx = raw * PLOT_W;

  const curveSegs = smoothSegments(pts);
  const linePath = `M ${pts[0].x} ${pts[0].y}` + curveSegs;
  const areaPath = `M ${pts[0].x} ${PLOT_H} L ${pts[0].x} ${pts[0].y}` + curveSegs + ` L ${pts[n - 1].x} ${PLOT_H} Z`;

  // current head position along the SAME curve (not a straight-segment
  // approximation), for the leading dot
  const headIdxF = raw * (n - 1);
  const i0 = Math.min(n - 2, Math.floor(headIdxF));
  const segT = headIdxF - i0;
  const { cp1, cp2 } = catmullRomControls(pts, i0);
  const headPt = cubicBezierAt(pts[i0], cp1, cp2, pts[i0 + 1], segT);
  const headX = headPt.x;
  const headY = headPt.y;

  return (
    <Ground ground={ground} accentColor={accentColor} skipIntro={skipIntro} texture domain="generic" focus={{ x: 0.3, y: 0.3 }}>
      <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", gap: SPACE[12], ...outro }}>
        <div style={{ display: "flex", flexDirection: "column", gap: SPACE[4] }}>
          <Kicker label={kicker} theme={t} frame={frame} delay={d} />
          <div style={{ overflow: "hidden", paddingBottom: 8 }}>
            <div
              style={{
                fontFamily: TYPE.sans,
                fontSize: TYPE.display,
                fontWeight: TYPE.weight.bold,
                letterSpacing: -1,
                lineHeight: 1.05,
                color: t.ink,
                maxWidth: 1500,
                transform: `translateY(${(1 - wipe(frame, { delay: d + 4, dur: 26 })) * TYPE.display * 1.05}px)`,
              }}
            >
              <EmphasisTitle text={title} color={t.accent} />
            </div>
          </div>
          {dek && (
            <div style={{ fontFamily: TYPE.sans, fontSize: TYPE.sub, color: t.muted, maxWidth: 1100, lineHeight: 1.45, ...fadeUp(frame, { delay: d + 12, dur: 22 }) }}>
              {dek}
            </div>
          )}
        </div>

        <div style={{ position: "relative", height: PLOT_H, marginTop: SPACE[6] }}>
          <AxisFrame theme={t} frame={frame} delay={d + 18} rows={2} yTicks={yTicks} baseline />

          <svg width={PLOT_W} height={PLOT_H} viewBox={`0 0 ${PLOT_W} ${PLOT_H}`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
            <defs>
              <linearGradient id="ltc-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={t.accent} stopOpacity={0.3} />
                <stop offset="100%" stopColor={t.accent} stopOpacity={0} />
              </linearGradient>
              <clipPath id="ltc-reveal">
                <rect x={0} y={0} width={headPx} height={PLOT_H} />
              </clipPath>
            </defs>
            <g clipPath="url(#ltc-reveal)">
              <path d={areaPath} fill="url(#ltc-area)" />
              <path d={linePath} fill="none" stroke={t.accent} strokeWidth={4} strokeLinejoin="round" strokeLinecap="round" />
              {points.map((p, i) => (
                <circle key={i} cx={px(i)} cy={py(p.value)} r={5} fill={ground === "paper" ? t.surface : t.bg} stroke={t.accent} strokeWidth={3} />
              ))}
            </g>
            {raw > 0.001 && raw < 0.999 && (
              <>
                <circle cx={headX} cy={headY} r={13} fill={t.accent} opacity={0.22} />
                <circle cx={headX} cy={headY} r={6} fill={t.accent} />
              </>
            )}
          </svg>

          <div style={{ position: "absolute", left: 0, right: 0, top: PLOT_H + 20, display: "flex", justifyContent: "space-between" }}>
            {points.map((p, i) => (
              <div
                key={i}
                style={{
                  fontFamily: TYPE.mono,
                  fontSize: TYPE.source,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  color: t.muted,
                  opacity: wipe(frame, { delay: d + 14, dur: 16 }),
                }}
              >
                {p.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      <SourceTag source={source} theme={t} frame={frame} delay={d + DRAW_START + 60} />
    </Ground>
  );
};
