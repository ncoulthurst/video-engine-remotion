/**
 * HeroStatBars — Head-to-head animated stat comparison bars.
 * F3: composed from the shared kit (Ground/TYPE/prog) — no per-comp springs or
 * grain. Rows accept the "stat" narration beat (H1): the first bar lands on the
 * word that names the number.
 */
import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { SmartImg, WorldStateSchema } from "./shared";
import { Ground, TYPE, EASE, prog, beatDelay, stagger, resolveTheme, type Theme } from "./lib/kit";

const StatItemSchema = z.object({
  label:    z.string().optional().default(""),
  valueA:   z.number(),
  valueB:   z.number(),
  maxValue: z.number().optional(),
  suffix:   z.string().optional().default(""),
});

export const HeroStatBarsPropsSchema = z.object({
  title:     z.string().optional().default("head to head"),
  subtitle:  z.string().optional().default(""),
  sideImage: z.string().optional().default(""),
  teamA: z.object({ name:  z.string().optional().default("Liverpool"), color: z.string().optional().default("#C8102E") }),
  teamB: z.object({ name:  z.string().optional().default("Arsenal"), color: z.string().optional().default("#EF0107") }),
  stats: z.array(StatItemSchema).default([
    { label: "Possession",  valueA: 58,  valueB: 42,  maxValue: 100, suffix: "%" },
    { label: "Shots",       valueA: 14,  valueB: 9, suffix: "" },
    { label: "xG",          valueA: 2.4, valueB: 0.8, suffix: "" },
    { label: "Key Passes",  valueA: 8,   valueB: 5, suffix: "" },
    { label: "Dribbles",    valueA: 7,   valueB: 4, suffix: "" },
  ]),
  bgColor:    z.string().optional().default("#f0ece4"),
  skipIntro:  z.boolean().optional().default(false),
  beats:      z.record(z.string(), z.number()).optional(),
  worldState: WorldStateSchema.optional(),
});

export type HeroStatBarsProps = z.infer<typeof HeroStatBarsPropsSchema>;

const ROW_START   = 20;
const ROW_STAGGER = 10;
const LABEL_W     = 200;

const StatRow: React.FC<{ stat: z.infer<typeof StatItemSchema>; colorA: string; colorB: string; rowFrame: number; frame: number; barMaxW: number; skipIntro?: boolean; theme: Theme }> = ({ stat, colorA, colorB, rowFrame, frame, barMaxW, skipIntro, theme }) => {
  const p       = skipIntro ? 1 : prog(frame, rowFrame, 22, EASE.snap);
  const opacity = interpolate(p, [0, 0.5], [0, 1], { extrapolateRight: "clamp" });
  const maxV   = stat.maxValue ?? Math.max(stat.valueA, stat.valueB);
  const ratioA = maxV > 0 ? stat.valueA / maxV : 0;
  const ratioB = maxV > 0 ? stat.valueB / maxV : 0;
  const barWA  = p * ratioA * barMaxW;
  const barWB  = p * ratioB * barMaxW;
  const leadsA = stat.valueA > stat.valueB;
  const leadsB = stat.valueB > stat.valueA;
  const fmt = (v: number) => { const s = Number.isInteger(v) ? String(v) : v.toFixed(1); return s + stat.suffix; };

  return (
    <div style={{ opacity, display: "flex", alignItems: "center", height: 72 }}>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 16 }}>
        <span style={{ fontFamily: TYPE.sans, fontSize: 24, fontWeight: leadsA ? 800 : 500, color: leadsA ? colorA : theme.muted, letterSpacing: -0.5, minWidth: 70, textAlign: "right" }}>{fmt(stat.valueA)}</span>
        <div style={{ width: barWA, height: 10, borderRadius: 5, backgroundColor: colorA, opacity: leadsA ? 1 : 0.38 }} />
      </div>
      <div style={{ width: LABEL_W, textAlign: "center", fontFamily: TYPE.mono, fontSize: 12, fontWeight: 800, color: theme.muted, letterSpacing: TYPE.track, textTransform: "uppercase", flexShrink: 0 }}>{stat.label}</div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: barWB, height: 10, borderRadius: 5, backgroundColor: colorB, opacity: leadsB ? 1 : 0.38 }} />
        <span style={{ fontFamily: TYPE.sans, fontSize: 24, fontWeight: leadsB ? 800 : 500, color: leadsB ? colorB : theme.muted, letterSpacing: -0.5, minWidth: 70 }}>{fmt(stat.valueB)}</span>
      </div>
    </div>
  );
};

export const HeroStatBars: React.FC<HeroStatBarsProps> = ({ title, subtitle, sideImage, teamA, teamB, stats, bgColor, skipIntro = false, beats }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = resolveTheme("paper", teamA.color, bgColor);
  const headerProg = skipIntro ? 1 : prog(frame, 0, 20, EASE.snap);
  const imageProg  = skipIntro ? 1 : prog(frame, 6, 22, EASE.soft);
  const rowStart   = beatDelay(beats, "stat", fps, ROW_START);
  const BAR_MAX_W = sideImage ? 340 : 500;

  return (
    <Ground ground="paper" bgColor={bgColor} accentColor={teamA.color} domain="football" texture skipIntro={skipIntro} pad={0}>
      {sideImage && (
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 900, opacity: interpolate(imageProg, [0, 1], [0, 0.75], { extrapolateRight: "clamp" }), transform: `translateX(${interpolate(imageProg, [0, 1], [100, 0])}px)`, WebkitMaskImage: 'linear-gradient(to right, transparent, black 350px, black 85%, transparent)', maskImage: 'linear-gradient(to right, transparent, black 350px, black 85%, transparent)', zIndex: 1 }}>
          <SmartImg src={sideImage} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center", filter: "contrast(1.05) brightness(1.05)" }} />
        </div>
      )}

      {/* Title — top left */}
      <div style={{
        position: "absolute", top: 52, left: 140, zIndex: 10,
        opacity: headerProg,
        transform: `translateY(${interpolate(headerProg, [0, 1], [-16, 0])}px)`,
      }}>
        <div style={{ fontFamily: TYPE.serif, fontSize: 52, fontWeight: 900, color: t.ink, letterSpacing: -2, lineHeight: 1 }}>{title}</div>
        {subtitle && <div style={{ fontFamily: TYPE.sans, fontSize: 16, fontWeight: 500, color: t.muted, letterSpacing: 0.5, marginTop: 8 }}>{subtitle}</div>}
      </div>

      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "160px 140px 60px", maxWidth: sideImage ? 1200 : 1920, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", opacity: headerProg, marginBottom: 20, paddingBottom: 24, borderBottom: `1px solid ${t.line}` }}>
          <div style={{ flex: 1, display: "flex", justifyContent: "flex-end", paddingRight: LABEL_W / 2 + 20 }}><span style={{ fontFamily: TYPE.serif, fontSize: 42, fontWeight: 900, color: teamA.color, letterSpacing: -1 }}>{teamA.name}</span></div>
          <div style={{ width: LABEL_W, flexShrink: 0 }} />
          <div style={{ flex: 1, paddingLeft: LABEL_W / 2 + 20 }}><span style={{ fontFamily: TYPE.serif, fontSize: 42, fontWeight: 900, color: teamB.color, letterSpacing: -1 }}>{teamB.name}</span></div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {stats.map((stat, i) => (
            <StatRow key={i} stat={stat} colorA={teamA.color} colorB={teamB.color} rowFrame={rowStart + stagger(i, ROW_STAGGER)} frame={frame} barMaxW={BAR_MAX_W} skipIntro={skipIntro} theme={t} />
          ))}
        </div>
      </div>
    </Ground>
  );
};
