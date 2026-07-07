/**
 * MetricTrajectory — Generic value-over-time line/area chart.
 *
 * A title + a single series of {t, value} points drawn as an area-filled line
 * that reveals left→right, with the endpoint value called out. Auto-scales the
 * y-axis from the data. Domain-agnostic — a token price, a valuation, an index,
 * a headcount over time. The signature "number went up (or down)" graphic.
 *
 * Reveal uses an animated SVG clip-path rect (not getTotalLength, which is
 * unreliable in headless rendering).
 *
 * Stack: Bg (0) → Content/SVG (10) → Grain (last).
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
import {
  fontFamily,
  serifFontFamily,
  Grain,
  PaperBackground,
  DarkBackground,
  InkBackground,
  COLORS,
  SPRINGS,
  rgbaFromHex,
  WorldStateSchema,
} from "./shared";

const PointSchema = z.object({
  t:     z.string(),                 // "2020", "Nov 2021", "Q3"
  value: z.number(),
  label: z.string().optional().default(""),
});

export const MetricTrajectoryPropsSchema = z.object({
  title:      z.string().optional().default("Solana (SOL) — price"),
  subtitle:   z.string().optional().default(""),
  unit:       z.string().optional().default("$"),   // "$" prefix, or "%", "M" suffix
  points:     z.array(PointSchema).min(2).optional().default([
    { t: "2020",     value: 0.1 },
    { t: "early '21", value: 3 },
    { t: "May '21",  value: 40 },
    { t: "Nov 2021", value: 260, label: "peak" },
    { t: "Nov 2022", value: 13 },
  ]),
  accent:     z.string().optional().default(""),
  palette:    z.enum(["ink", "dark", "paper"]).optional().default("ink"),
  worldState: WorldStateSchema,
});
export type MetricTrajectoryProps = z.infer<typeof MetricTrajectoryPropsSchema>;

const PLOT_L = 230;
const PLOT_R = 1690;
const PLOT_T = 380;
const PLOT_B = 880;
const DEFAULT_ACCENT = "#3b82c4";
const INK_ACCENT = "#FFD23F";

const fmtVal = (n: number, unit: string): string => {
  const abs = Math.abs(n);
  const num = abs >= 1000 ? n.toLocaleString()
            : Number.isInteger(n) ? String(n)
            : n < 1 ? n.toFixed(2) : n.toFixed(1);
  if (!unit) return num;
  return unit.trim() === "$" ? `$${num}` : `${num}${unit.startsWith("%") ? "" : " "}${unit}`;
};

export const MetricTrajectory: React.FC<MetricTrajectoryProps> = ({
  title,
  subtitle,
  unit,
  points,
  accent,
  palette,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const isInk   = palette === "ink";
  const isDark  = palette === "dark";
  const fg      = (isInk || isDark) ? "#ffffff" : COLORS.primary;
  const muted   = isInk ? "rgba(255,255,255,0.62)" : isDark ? "rgba(245,240,232,0.55)" : COLORS.muted;
  const grid    = isInk ? "rgba(255,255,255,0.14)" : isDark ? "rgba(245,240,232,0.10)" : "rgba(0,0,0,0.07)";
  const ac      = accent || (isInk ? INK_ACCENT : DEFAULT_ACCENT);

  const pts = (points || []).filter((p) => typeof p.value === "number");
  const n = pts.length;
  const vals = pts.map((p) => p.value);
  const vmin = Math.min(...vals);
  const vmax = Math.max(...vals);
  const pad  = (vmax - vmin) * 0.12 || Math.abs(vmax) * 0.12 || 1;
  const lo = vmin - pad;
  const hi = vmax + pad;

  const xAt = (i: number) => PLOT_L + (n <= 1 ? 0 : (i / (n - 1)) * (PLOT_R - PLOT_L));
  const yAt = (v: number) => PLOT_B - ((v - lo) / (hi - lo || 1)) * (PLOT_B - PLOT_T);

  const xy = pts.map((p, i) => ({ x: xAt(i), y: yAt(p.value), p }));
  const linePath = xy.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L ${xy[xy.length - 1].x.toFixed(1)} ${PLOT_B} L ${xy[0].x.toFixed(1)} ${PLOT_B} Z`;

  const titleP = spring({ frame, fps, config: SPRINGS.header });
  const titleY = interpolate(titleP, [0, 1], [40, 0]);

  // Left→right reveal.
  const drawP = spring({ frame: frame - 12, fps, config: { damping: 30, stiffness: 44, mass: 1 } });
  const revealW = interpolate(drawP, [0, 1], [0, PLOT_R - PLOT_L + 12]);

  const last = xy[xy.length - 1];
  const dotP = spring({ frame: frame - 46, fps, config: SPRINGS.bounce });

  return (
    <AbsoluteFill style={{ fontFamily }}>
      {isInk ? <InkBackground /> : isDark ? <DarkBackground /> : <PaperBackground />}

      <AbsoluteFill style={{ zIndex: 10, padding: `120px 200px` }}>
        <div style={{ opacity: titleP, transform: `translateY(${titleY}px)` }}>
          <div style={{ width: 64, height: 5, background: ac, borderRadius: 3, marginBottom: 22 }} />
          <div style={{
            fontFamily: serifFontFamily, fontWeight: 900, fontSize: 64,
            lineHeight: 1.0, letterSpacing: -1.5, color: fg, maxWidth: 1300,
          }}>
            {title}
          </div>
          {subtitle ? (
            <div style={{ fontSize: 23, color: muted, marginTop: 14 }}>{subtitle}</div>
          ) : null}
        </div>
      </AbsoluteFill>

      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, zIndex: 11 }}>
        <defs>
          <clipPath id="mt-reveal">
            <rect x={PLOT_L - 6} y={PLOT_T - 60} width={revealW} height={PLOT_B - PLOT_T + 120} />
          </clipPath>
          <linearGradient id="mt-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={rgbaFromHex(ac, isInk ? 0.34 : isDark ? 0.42 : 0.30)} />
            <stop offset="100%" stopColor={rgbaFromHex(ac, 0)} />
          </linearGradient>
        </defs>

        {/* baseline + subtle gridlines */}
        {[0, 0.5, 1].map((f, i) => {
          const y = PLOT_B - f * (PLOT_B - PLOT_T);
          return <line key={i} x1={PLOT_L} y1={y} x2={PLOT_R} y2={y} stroke={grid} strokeWidth={i === 0 ? 2 : 1} />;
        })}

        <g clipPath="url(#mt-reveal)">
          <path d={areaPath} fill="url(#mt-area)" />
          <path d={linePath} fill="none" stroke={ac} strokeWidth={5} strokeLinejoin="round" strokeLinecap="round" />
        </g>

        {/* x-axis labels (first, last, and any point flagged with a label) */}
        {xy.map((c, i) => {
          const show = i === 0 || i === n - 1 || (c.p.label && c.p.label.length > 0);
          if (!show) return null;
          const lp = interpolate(drawP, [i / Math.max(1, n - 1) * 0.8, i / Math.max(1, n - 1) * 0.8 + 0.15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <text key={i} x={c.x} y={PLOT_B + 42} fill={muted} fontSize={22} fontFamily={fontFamily}
                  textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"} opacity={lp}>
              {c.p.t}
            </text>
          );
        })}

        {/* endpoint dot + value callout */}
        <g opacity={dotP} transform={`translate(${last.x} ${last.y})`}>
          <circle r={14} fill={ac} />
          <circle r={26} fill="none" stroke={rgbaFromHex(ac, 0.4)} strokeWidth={3} />
        </g>
      </svg>

      {/* endpoint value label (HTML for crisp text) — placed clear of the dot:
          left of it when near the right edge, else to its right; always above. */}
      <div style={{
        position: "absolute", zIndex: 12,
        left: last.x > 1400 ? last.x - 240 : last.x + 46,
        top: Math.max(last.y - 104, PLOT_T - 30),
        textAlign: last.x > 1400 ? "right" as const : "left" as const,
        width: 220,
        opacity: dotP,
      }}>
        <div style={{ fontFamily: serifFontFamily, fontWeight: 900, fontSize: 58, color: ac, lineHeight: 1 }}>
          {fmtVal(pts[n - 1].value, unit)}
        </div>
        {pts[n - 1].label ? (
          <div style={{ fontSize: 22, color: muted, marginTop: 6, textTransform: "uppercase", letterSpacing: 1 }}>
            {pts[n - 1].label}
          </div>
        ) : null}
      </div>

      {!isInk ? <Grain /> : null}
    </AbsoluteFill>
  );
};

export default MetricTrajectory;
