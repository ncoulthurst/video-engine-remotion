/**
 * HeroValueChart — value/price over time as a progressively-drawn line chart with
 * event callout pills. The archetypal finance-doc graphic (price/valuation/AUM
 * trajectory with key moments annotated). Style modelled on the Search Party
 * "economic history" chart (SEARCH_PARTY_STYLE_ANALYSIS.md); colour from PALETTE.
 *
 * Signature moves: left→right line-draw reveal, single-accent line + soft area
 * fill, log or linear Y axis, mono axis labels, staggered event callouts revealed
 * as the line passes them, and a live head dot.
 */
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { fontFamily, geistMonoFamily, Grain, PALETTES, rgbaFromHex } from "./shared";

// ── Colours: pinned to the light paper-orange palette (warm-white + burnt orange) ──
const P = PALETTES.paperOrange;
// Light background → the depth vignette must be a faint warm tint, not heavy black
// (dark corners on white read muddy). Pill shadows likewise stay soft.
const IS_LIGHT = (() => { const h = P.bg.replace("#", ""); return parseInt(h.slice(0, 2), 16) > 140; })();
const VIGNETTE = IS_LIGHT
  ? "radial-gradient(125% 125% at 50% 42%, transparent 62%, rgba(28,26,21,0.06) 100%)"
  : "radial-gradient(125% 125% at 50% 42%, transparent 58%, rgba(0,0,0,0.34) 100%)";
const PILL_SHADOW = IS_LIGHT ? "0 6px 18px rgba(28,26,21,0.12)" : "0 8px 24px rgba(0,0,0,0.35)";
const GRID = rgbaFromHex(P.ink, 0.08);

// ── Plot geometry (1920×1080) ────────────────────────────────────────────────
const W = 1920, H = 1080;
const M = { left: 190, right: 96, top: 288, bottom: 176 };
const PLOT_W = W - M.left - M.right;
const PLOT_H = H - M.top - M.bottom;
const BASE_Y = M.top + PLOT_H;

const PointSchema = z.object({
  label: z.string().optional().default(""),   // x-axis label (blank = tick only)
  value: z.number(),
});
const EventSchema = z.object({
  index: z.number(),                            // which point this pins to
  title: z.string().optional().default(""),
  sub: z.string().optional().default(""),
});

export const HeroValueChartPropsSchema = z.object({
  title: z.string().optional().default("VALUE OVER TIME"),
  subtitle: z.string().optional().default(""),
  source: z.string().optional().default(""),
  unit: z.string().optional().default("$"),
  logScale: z.boolean().optional().default(true),
  points: z.array(PointSchema).min(2),
  events: z.array(EventSchema).optional().default([]),
  accentColor: z.string().optional(),
  bgColor: z.string().optional(),
  skipIntro: z.boolean().optional().default(false),
});
export type HeroValueChartProps = z.input<typeof HeroValueChartPropsSchema>;

export function calculateMetadata({ props }: { props: HeroValueChartProps }) {
  const n = (props.points ?? []).length;
  return { durationInFrames: Math.max(180, 40 + n * 14 + 110) };
}

// value → 0..1 fraction of the plot height (log or linear)
function makeScale(values: number[], logScale: boolean) {
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  if (logScale) {
    const lo = Math.pow(10, Math.floor(Math.log10(Math.max(dataMin, 1e-9))));
    const hi = niceLogCeil(dataMax);              // just above the data (e.g. 260 → 300), not the next decade
    const lLo = Math.log10(lo), lHi = Math.log10(hi);
    // decade ticks between lo and hi, plus lo at the floor and hi at the top
    const ticks: number[] = [lo];
    for (let e = Math.ceil(lLo + 1e-9); e < lHi - 1e-9; e++) ticks.push(Math.pow(10, e));
    ticks.push(hi);
    return { lo, hi, ticks, frac: (v: number) => (Math.log10(Math.max(v, lo)) - lLo) / (lHi - lLo) };
  }
  const lo = 0;
  const hi = niceCeil(dataMax);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * hi);
  return { lo, hi, ticks, frac: (v: number) => (v - lo) / (hi - lo) };
}
// smallest 1/2/3/5 × 10^k at or above v  (260 → 300, 85 → 100, 4200 → 5000)
function niceLogCeil(v: number) {
  const k = Math.floor(Math.log10(v));
  const base = Math.pow(10, k);
  for (const m of [1, 2, 3, 5]) if (m * base >= v - 1e-9) return m * base;
  return 10 * base;
}
function niceCeil(v: number) {
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  return Math.ceil(v / p) * p;
}
function fmt(v: number, unit: string) {
  const s =
    v >= 1e9 ? (v / 1e9).toFixed(v >= 1e10 ? 0 : 1) + "B" :
    v >= 1e6 ? (v / 1e6).toFixed(v >= 1e7 ? 0 : 1) + "M" :
    v >= 1e3 ? (v / 1e3).toFixed(v >= 1e4 ? 0 : 1) + "K" :
    v >= 1 ? String(Math.round(v)) :
    v.toFixed(2);
  return unit + s;
}

export const HeroValueChart: React.FC<HeroValueChartProps> = ({
  title = "VALUE OVER TIME", subtitle = "", source = "", unit = "$",
  logScale = true, points, events = [], accentColor, bgColor, skipIntro = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const accent = accentColor && accentColor !== "#000000" ? accentColor : P.accent;
  const bg = bgColor || P.bg;

  const n = points.length;
  const values = points.map((p) => p.value);
  const scale = makeScale(values, logScale);

  // pixel coords per point (x evenly spaced by index, y from value scale)
  const px = (i: number) => M.left + (i / (n - 1)) * PLOT_W;
  const py = (v: number) => M.top + (1 - scale.frac(v)) * PLOT_H;
  const pts = points.map((p, i) => ({ x: px(i), y: py(p.value) }));

  // ── Reveal: left→right, x is monotonic so a single x-clip reveals line + area ──
  const drawStart = skipIntro ? 0 : 16;
  const drawDur = Math.min(160, 60 + n * 10);
  const raw = skipIntro ? 1 : interpolate(frame, [drawStart, drawStart + drawDur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // easeInOutCubic
  const drawProg = raw < 0.5 ? 4 * raw * raw * raw : 1 - Math.pow(-2 * raw + 2, 3) / 2;
  const headX = M.left + drawProg * PLOT_W;

  // y at the current head x (x monotonic → find segment)
  const yAtX = (x: number) => {
    if (x <= pts[0].x) return pts[0].y;
    if (x >= pts[n - 1].x) return pts[n - 1].y;
    for (let i = 0; i < n - 1; i++) {
      if (x >= pts[i].x && x <= pts[i + 1].x) {
        const t = (x - pts[i].x) / (pts[i + 1].x - pts[i].x);
        return pts[i].y + (pts[i + 1].y - pts[i].y) * t;
      }
    }
    return pts[n - 1].y;
  };
  const headY = yAtX(headX);

  const linePath = "M " + pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" L ");
  const areaPath = `M ${pts[0].x},${BASE_Y} L ` + pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" L ") + ` L ${pts[n - 1].x},${BASE_Y} Z`;

  const headerProg = skipIntro ? 1 : spring({ frame, fps, config: { damping: 26, stiffness: 55 } });

  return (
    <AbsoluteFill style={{ background: bg }}>
      {/* subtle edge vignette for depth (darkened corners, not a glow) */}
      <AbsoluteFill style={{ background: VIGNETTE, pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none", opacity: 0.35 }}><Grain /></div>

      {/* ── Header (centred, mono/sans data register) ─────────────── */}
      <div style={{ position: "absolute", top: 96, left: 0, right: 0, textAlign: "center", opacity: headerProg, transform: `translateY(${interpolate(headerProg, [0, 1], [-14, 0])}px)`, zIndex: 5 }}>
        <div style={{ fontFamily, fontSize: 40, fontWeight: 700, color: P.ink, letterSpacing: 4, textTransform: "uppercase" }}>{title}</div>
        {subtitle && <div style={{ fontFamily: geistMonoFamily, fontSize: 19, fontWeight: 500, color: accent, letterSpacing: 2, marginTop: 12, textTransform: "uppercase" }}>{subtitle}</div>}
        {source && <div style={{ fontFamily: geistMonoFamily, fontSize: 15, fontWeight: 400, color: P.muted, letterSpacing: 1, marginTop: subtitle ? 8 : 12 }}>{source}</div>}
      </div>

      {/* ── Chart ─────────────────────────────────────────────────── */}
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, zIndex: 3 }}>
        <defs>
          <linearGradient id="hvc-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity={0.28} />
            <stop offset="100%" stopColor={accent} stopOpacity={0} />
          </linearGradient>
          <clipPath id="hvc-reveal"><rect x={0} y={0} width={headX} height={H} /></clipPath>
        </defs>

        {/* horizontal gridlines + y labels */}
        {scale.ticks.map((tv, i) => {
          const y = py(tv);
          if (y < M.top - 1 || y > BASE_Y + 1) return null;
          return (
            <g key={i}>
              <line x1={M.left} y1={y} x2={M.left + PLOT_W} y2={y} stroke={GRID} strokeWidth={1} strokeDasharray="2 6" />
              <text x={M.left - 20} y={y + 5} textAnchor="end" fontFamily={geistMonoFamily} fontSize={16} fill={P.muted} letterSpacing={0.5}>{fmt(tv, unit)}</text>
            </g>
          );
        })}

        {/* baseline + x labels */}
        <line x1={M.left} y1={BASE_Y} x2={M.left + PLOT_W} y2={BASE_Y} stroke={rgbaFromHex(P.ink, 0.18)} strokeWidth={1.5} />
        {points.map((p, i) => p.label ? (
          <text key={i} x={px(i)} y={BASE_Y + 34} textAnchor="middle" fontFamily={geistMonoFamily} fontSize={16} fill={P.muted} letterSpacing={0.5}>{p.label}</text>
        ) : null)}

        {/* area + line, revealed by the growing clip */}
        <g clipPath="url(#hvc-reveal)">
          <path d={areaPath} fill="url(#hvc-area)" />
          <path d={linePath} fill="none" stroke={accent} strokeWidth={4} strokeLinejoin="round" strokeLinecap="round" />
        </g>

        {/* head dot */}
        {drawProg > 0.001 && drawProg < 0.999 && (
          <>
            <circle cx={headX} cy={headY} r={11} fill={accent} opacity={0.22} />
            <circle cx={headX} cy={headY} r={5} fill={accent} />
          </>
        )}
      </svg>

      {/* ── Event callouts (revealed as the draw passes them) ─────── */}
      <div style={{ position: "absolute", inset: 0, zIndex: 4 }}>
        {events.map((ev, i) => {
          const idx = Math.max(0, Math.min(n - 1, ev.index));
          const frac = idx / (n - 1);
          // reveal window — clamped so the range is always strictly increasing
          const a = Math.max(0, Math.min(0.97, frac - 0.01));
          const b = Math.min(1, a + 0.06);
          const rev = skipIntro ? 1 : interpolate(drawProg, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          if (rev <= 0) return null;
          const x = px(idx), y = py(points[idx].value);
          const PILL_H = 62, GAP = 26;
          // High points push the pill BELOW so it never collides with the header.
          const below = scale.frac(points[idx].value) > 0.72;
          const connectorTop = below ? y : y - GAP;
          const pillTop = below ? y + GAP : y - GAP - PILL_H;
          // Anchor edge pills inward so they never clip the frame.
          const anchorX = frac > 0.85 ? "-100%" : frac < 0.15 ? "0%" : "-50%";
          const slideFrom = below ? -8 : 8;
          return (
            <div key={i} style={{ position: "absolute", left: x, top: 0, opacity: rev }}>
              {/* connector */}
              <div style={{ position: "absolute", left: 0, top: connectorTop, width: 1, height: GAP, borderLeft: `1px dashed ${rgbaFromHex(P.ink, 0.35)}`, transform: "translateX(-0.5px)" }} />
              {/* point ring */}
              <div style={{ position: "absolute", left: -5, top: y - 5, width: 10, height: 10, borderRadius: 5, background: accent }} />
              {/* pill */}
              <div style={{ position: "absolute", left: 0, top: pillTop, transform: `translate(${anchorX}, ${interpolate(rev, [0, 1], [slideFrom, 0])}px)`, background: P.surface, border: `1px solid ${rgbaFromHex(P.ink, 0.14)}`, borderRadius: 8, padding: "10px 16px", whiteSpace: "nowrap", boxShadow: PILL_SHADOW }}>
                <div style={{ fontFamily: geistMonoFamily, fontSize: 13, fontWeight: 700, color: accent, letterSpacing: 1.6, textTransform: "uppercase" }}>{ev.title}</div>
                {ev.sub && <div style={{ fontFamily: geistMonoFamily, fontSize: 15, fontWeight: 500, color: P.ink, letterSpacing: 0.3, marginTop: 3 }}>{ev.sub}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
