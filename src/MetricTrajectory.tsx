/**
 * MetricTrajectory — High-ISO Editorial Style (v3)
 * Inspired by J.P. Morgan "Too Big to Fail" editorial aesthetic.
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

// Mocking some shared utilities based on the design system and previous context
const COLORS = {
  blue: "#0033CC",
  yellow: "#FFCC00",
  ink: "#131313",
  white: "#FFFFFF",
};

const PointSchema = z.object({
  t: z.string(),
  value: z.number(),
  label: z.string().optional().default(""),
});

export const MetricTrajectoryPropsSchema = z.object({
  title: z.string().optional().default("SOLANA (SOL) — PRICE"),
  unit: z.string().optional().default("$"),
  points: z.array(PointSchema).min(2).optional().default([
    { t: "2020", value: 0.1, label: "" },
    { t: "early '21", value: 3, label: "" },
    { t: "May '21", value: 40, label: "" },
    { t: "Nov 2021", value: 260, label: "high" },
    { t: "Nov 2022", value: 13, label: "capitulation" },
  ]),
  accent: z.string().optional().default(COLORS.yellow),
  bg: z.string().optional().default(COLORS.blue),
});

export type MetricTrajectoryProps = z.infer<typeof MetricTrajectoryPropsSchema>;

const PLOT_L = 180;
const PLOT_R = 1740;
const PLOT_T = 350;
const PLOT_B = 850;

const fmtVal = (n: number, unit: string): string => {
  const num = n < 1 ? n.toFixed(2) : Math.floor(n).toLocaleString();
  return unit === "$" ? `$${num}` : `${num}${unit}`;
};

export const MetricTrajectory: React.FC<MetricTrajectoryProps> = ({
  title,
  unit,
  points,
  accent = COLORS.yellow,
  bg = COLORS.blue,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Animation Springs
  const titleP = spring({ frame, fps, config: { stiffness: 100 } });
  const drawP = spring({ frame: frame - 15, fps, config: { damping: 200, stiffness: 50 } });
  const revealW = interpolate(drawP, [0, 1], [0, PLOT_R - PLOT_L]);
  const boxP = spring({ frame: frame - 60, fps, config: { damping: 12, stiffness: 100 } });

  const pts = points || [];
  const n = pts.length;
  const vals = pts.map((p) => p.value);
  const vmin = Math.min(...vals);
  const vmax = Math.max(...vals);
  const pad = (vmax - vmin) * 0.15 || 1;
  const lo = vmin - pad;
  const hi = vmax + pad;

  const xAt = (i: number) => PLOT_L + (n <= 1 ? 0 : (i / (n - 1)) * (PLOT_R - PLOT_L));
  const yAt = (v: number) => PLOT_B - ((v - lo) / (hi - lo || 1)) * (PLOT_B - PLOT_T);

  const xy = pts.map((p, i) => ({ x: xAt(i), y: yAt(p.value), p }));
  const linePath = xy.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
  
  const last = xy[xy.length - 1];

  return (
    <AbsoluteFill style={{ backgroundColor: bg, fontFamily: 'Work Sans, sans-serif', color: COLORS.white }}>
      {/* Editorial Scanlines/Grain Overlay Effect */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.05) 0px, rgba(0,0,0,0.05) 1px, transparent 1px, transparent 2px)',
        zIndex: 5,
        pointerEvents: 'none'
      }} />

      {/* Header */}
      <div style={{ padding: '80px 120px', opacity: titleP, zIndex: 10 }}>
        <div style={{ width: 120, height: 12, backgroundColor: accent, marginBottom: 30 }} />
        <h1 style={{ 
          fontSize: 80, 
          fontWeight: 800, 
          letterSpacing: '-0.04em', 
          margin: 0,
          textTransform: 'uppercase' 
        }}>
          {title}
        </h1>
      </div>

      {/* SVG Chart Layer */}
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ position: "absolute", inset: 0, zIndex: 6 }}>
        <defs>
          <clipPath id="reveal">
            <rect x={PLOT_L} y={0} width={revealW} height={height} />
          </clipPath>
          <filter id="glow">
            <feGaussianBlur stdDeviation="6" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {/* Horizontal Grid Lines */}
        {[0, 0.5, 1].map((f, i) => {
          const y = PLOT_B - f * (PLOT_B - PLOT_T);
          return <line key={i} x1={PLOT_L} y1={y} x2={PLOT_R} y2={y} stroke="rgba(255,255,255,0.2)" strokeWidth={2} />;
        })}

        <path 
          d={linePath} 
          fill="none" 
          stroke={accent} 
          strokeWidth={10} 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          filter="url(#glow)"
          clipPath="url(#reveal)"
        />
        
        {/* Endpoint Dot */}
        {boxP > 0 && (
          <circle cx={last.x} cy={last.y} r={15 * boxP} fill={accent} />
        )}
      </svg>

      {/* Signature Yellow Callout Box (The "Too Big to Fail" style) */}
      <div style={{
        position: 'absolute',
        bottom: 120,
        right: 120,
        opacity: boxP,
        transform: `scale(${interpolate(boxP, [0, 1], [0.8, 1])})`,
        zIndex: 20
      }}>
        <div style={{
          backgroundColor: accent,
          padding: '40px 60px',
          boxShadow: '20px 20px 0px #000',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <span style={{ 
            color: '#000', 
            fontSize: 160, 
            fontWeight: 900, 
            lineHeight: 0.9,
            letterSpacing: '-0.05em'
          }}>
            {fmtVal(last.p.value, unit)}
          </span>
          <div style={{
            marginTop: 20,
            backgroundColor: '#000',
            color: accent,
            padding: '8px 24px',
            fontSize: 32,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.1em'
          }}>
            NOVEMBER 2022
          </div>
        </div>
        
        <div style={{
          marginTop: 60,
          textAlign: 'right',
          fontSize: 36,
          fontWeight: 600,
          color: COLORS.white,
          maxWidth: 600,
          lineHeight: 1.2,
          textTransform: 'uppercase'
        }}>
          Asset capitulation detected following ecosystem liquidity crunch.
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default MetricTrajectory;