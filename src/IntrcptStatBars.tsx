/**
 * IntrcptStatBars — Head-to-head animated stat comparison bars.
 * Updated: Improved layering, soft gradient masking, and scaled layout.
 */
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { fontFamily, serifFontFamily, Grain, PaperBackground, COLORS, SmartImg } from "./shared";

const StatItemSchema = z.object({
  label:    z.string(),
  valueA:   z.number(),
  valueB:   z.number(),
  maxValue: z.number().optional(),
  suffix:   z.string().default(""),
});

export const IntrcptStatBarsPropsSchema = z.object({
  title:     z.string().default("head to head"),
  subtitle:  z.string().default(""),
  sideImage: z.string().optional(),
  teamA: z.object({ name:  z.string().default("Liverpool"), color: z.string().default("#C8102E") }),
  teamB: z.object({ name:  z.string().default("Arsenal"), color: z.string().default("#EF0107") }),
  stats: z.array(StatItemSchema).default([
    { label: "Possession",  valueA: 58,  valueB: 42,  maxValue: 100, suffix: "%" },
    { label: "Shots",       valueA: 14,  valueB: 9, suffix: "" },
    { label: "xG",          valueA: 2.4, valueB: 0.8, suffix: "" },
    { label: "Key Passes",  valueA: 8,   valueB: 5, suffix: "" },
    { label: "Dribbles",    valueA: 7,   valueB: 4, suffix: "" },
  ]),
  bgColor: z.string().default("#f0ece4"),
});

export type IntrcptStatBarsProps = z.infer<typeof IntrcptStatBarsPropsSchema>;

const ROW_START   = 20;
const ROW_STAGGER = 10;
const LABEL_W     = 200;

const StatRow: React.FC<{ stat: z.infer<typeof StatItemSchema>; colorA: string; colorB: string; rowFrame: number; frame: number; fps: number; barMaxW: number; }> = ({ stat, colorA, colorB, rowFrame, frame, fps, barMaxW }) => {
  const prog    = spring({ frame: frame - rowFrame, fps, config: { damping: 28, stiffness: 55 } });
  const opacity = interpolate(prog, [0, 0.5], [0, 1], { extrapolateRight: "clamp" });
  const maxV   = stat.maxValue ?? Math.max(stat.valueA, stat.valueB);
  const ratioA = maxV > 0 ? stat.valueA / maxV : 0;
  const ratioB = maxV > 0 ? stat.valueB / maxV : 0;
  const barWA  = interpolate(prog, [0, 1], [0, ratioA * barMaxW], { extrapolateRight: "clamp" });
  const barWB  = interpolate(prog, [0, 1], [0, ratioB * barMaxW], { extrapolateRight: "clamp" });
  const leadsA = stat.valueA > stat.valueB;
  const leadsB = stat.valueB > stat.valueA;
  const fmt = (v: number) => { const s = Number.isInteger(v) ? String(v) : v.toFixed(1); return s + stat.suffix; };

  return (
    <div style={{ opacity, display: "flex", alignItems: "center", height: 72 }}>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 16 }}>
        <span style={{ fontFamily, fontSize: 24, fontWeight: leadsA ? 800 : 500, color: leadsA ? colorA : COLORS.muted, letterSpacing: -0.5, minWidth: 70, textAlign: "right" }}>{fmt(stat.valueA)}</span>
        <div style={{ width: barWA, height: 10, borderRadius: 5, backgroundColor: colorA, opacity: leadsA ? 1 : 0.38 }} />
      </div>
      <div style={{ width: LABEL_W, textAlign: "center", fontFamily, fontSize: 12, fontWeight: 800, color: COLORS.muted, letterSpacing: 2.5, textTransform: "uppercase", flexShrink: 0 }}>{stat.label}</div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: barWB, height: 10, borderRadius: 5, backgroundColor: colorB, opacity: leadsB ? 1 : 0.38 }} />
        <span style={{ fontFamily, fontSize: 24, fontWeight: leadsB ? 800 : 500, color: leadsB ? colorB : COLORS.muted, letterSpacing: -0.5, minWidth: 70 }}>{fmt(stat.valueB)}</span>
      </div>
    </div>
  );
};

export const IntrcptStatBars: React.FC<IntrcptStatBarsProps> = ({ title, subtitle, sideImage, teamA, teamB, stats, bgColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const headerProg = spring({ frame, fps, config: { damping: 28, stiffness: 55 } });
  const imageProg  = spring({ frame, fps, config: { damping: 24, stiffness: 50 }, delay: 6 });
  const BAR_MAX_W = sideImage ? 340 : 500;

  return (
    <AbsoluteFill>
      <PaperBackground color={bgColor} />
      {sideImage && (
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 900, opacity: interpolate(imageProg, [0, 1], [0, 0.75], { extrapolateRight: "clamp" }), transform: `translateX(${interpolate(imageProg, [0, 1], [100, 0])}px)`, WebkitMaskImage: 'linear-gradient(to right, transparent, black 350px, black 85%, transparent)', maskImage: 'linear-gradient(to right, transparent, black 350px, black 85%, transparent)', zIndex: 1 }}>
          <SmartImg src={sideImage} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center", filter: "contrast(1.05) brightness(1.05)" }} />
        </div>
      )}
      <div style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none" }}><Grain /></div>

      {/* Title — top left */}
      <div style={{
        position: "absolute", top: 52, left: 140, zIndex: 10,
        opacity: headerProg,
        transform: `translateY(${interpolate(headerProg, [0, 1], [-16, 0])}px)`,
      }}>
        <div style={{ fontFamily: serifFontFamily, fontSize: 52, fontWeight: 900, color: COLORS.primary, letterSpacing: -2, lineHeight: 1 }}>{title}</div>
        {subtitle && <div style={{ fontFamily, fontSize: 16, fontWeight: 500, color: COLORS.muted, letterSpacing: 0.5, marginTop: 8 }}>{subtitle}</div>}
      </div>

      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "160px 140px 60px", maxWidth: sideImage ? 1200 : 1920, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", opacity: headerProg, marginBottom: 20, paddingBottom: 24, borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
          <div style={{ flex: 1, display: "flex", justifyContent: "flex-end", paddingRight: LABEL_W / 2 + 20 }}><span style={{ fontFamily: serifFontFamily, fontSize: 42, fontWeight: 900, color: teamA.color, letterSpacing: -1 }}>{teamA.name}</span></div>
          <div style={{ width: LABEL_W, flexShrink: 0 }} />
          <div style={{ flex: 1, paddingLeft: LABEL_W / 2 + 20 }}><span style={{ fontFamily: serifFontFamily, fontSize: 42, fontWeight: 900, color: teamB.color, letterSpacing: -1 }}>{teamB.name}</span></div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {stats.map((stat, i) => (
            <StatRow key={i} stat={stat} colorA={teamA.color} colorB={teamB.color} rowFrame={ROW_START + i * ROW_STAGGER} frame={frame} fps={fps} barMaxW={BAR_MAX_W} />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
