/**
 * ParticleSandFill — a bar chart where each bar fills via individual small
 * square "sand" particles raining down from above: gravity-accelerated fall
 * (closed-form landing time, not real collision physics), a slight bounce on
 * landing, bars staggered start-to-start, and once a bar's particles finish
 * landing the particle cloud cross-fades into a solid bar + a value label
 * that pops in (back-ease).
 *
 * Ported from an external OSS Remotion template pack ("video-shotcraft") into
 * this project's own visual language — kit tokens only, no local hex/font/
 * spacing. Bar heights scale relative to the max value in `bars`; particle
 * grain size / count-per-layer stay proportional to bar count so the fill
 * reads as sand at 2 bars or at 6.
 */
import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { z } from "zod";
import {
  Ground,
  SectionTitle,
  SourceTag,
  GlassCard,
  AxisFrame,
  resolveTheme,
  useOutro,
  scaleSettle,
  formatNum,
  TYPE,
  SPACE,
  baseTemplateSchema,
  type BaseTemplateProps,
} from "./lib/kit";

const BarSchema = z.object({ label: z.string(), value: z.number() });

export const ParticleSandFillPropsSchema = z.object({
  ...baseTemplateSchema,
  title: z.string().optional().default("Feature Adoption"),
  subtitle: z.string().optional().default("Teams active in the last 30 days, by feature"),
  bars: z
    .array(BarSchema)
    .optional()
    .default([
      { label: "Search", value: 238 },
      { label: "Summarize", value: 336 },
      { label: "Draft", value: 182 },
      { label: "Translate", value: 294 },
    ]),
  ground: z.enum(["paper", "ink", "structure"]).optional().default("structure"),
  // Full palette override (brand preview / brand-recolor path) — resolveTheme
  // already supports all four; ground+accentColor alone can't express a
  // specific brand background/ink/muted, only pick a preset register.
  bgColor: z.string().optional(),
  inkColor: z.string().optional(),
  mutedColor: z.string().optional(),
});
export type ParticleSandFillProps = z.input<typeof ParticleSandFillPropsSchema> & BaseTemplateProps;

// ── Sand geometry / motion constants (closed-form, frame-deterministic) ────────
const GRAIN = 14; // one particle's square footprint (px)
const CARD_H = 620;
const PAD = SPACE[10]; // 40
const LABEL_HEAD = 92; // headroom above the plot for the pop-in value label
const CAPTION_H = 44; // room below the baseline for the bar's own label
const MAX_PLOT_H = CARD_H - PAD * 2 - LABEL_HEAD - CAPTION_H;
const BAR_GAP = SPACE[10];
const DROP_FROM = 230; // particles originate this far above their landing spot
const GRAV = 1.6; // closed-form "gravity" constant
const BAR_STAGGER = 7; // frames between one bar's rain starting and the next's
const INTRO = 10; // frames before the first particle departs
const DEPART_BUDGET = 46; // frames spread across one bar's particle departures (keeps a 300-particle bar as brisk as a 20-particle one)

const frac = (x: number) => x - Math.floor(x);
/** Frame-deterministic pseudo-random jitter in [0,1) — sin-hash, not Math.random. */
const rnd = (i: number, salt: number) => frac(Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453);
const fallTime = (dist: number) => Math.sqrt((2 * dist) / GRAV);

type BarDatum = { label: string; value: number; h: number; layers: number; n: number };

const BarColumn: React.FC<{
  bar: BarDatum;
  b: number;
  frame: number;
  featured: boolean;
  perLayer: number;
  barW: number;
  color: string;
  neutral: string;
  skipIntro?: boolean;
}> = ({ bar, b, frame, featured, perLayer, barW, color, neutral, skipIntro = false }) => {
  const { h, n, label, value } = bar;
  const rate = n > 1 ? Math.min(0.28, DEPART_BUDGET / (n - 1)) : 0;
  const departOf = (i: number) => INTRO + b * BAR_STAGGER + i * rate + rnd(i, b * 7 + 1) * 1.5;
  const lastIdx = Math.max(0, n - 1);
  const lastJitter = rnd(lastIdx, b * 13 + 3) * 70;
  const lastLand = departOf(lastIdx) + fallTime(DROP_FROM + lastJitter);
  const doneAt = lastLand + 7;
  const eff = skipIntro ? doneAt + 999 : frame;

  const solidOp = interpolate(eff, [doneAt, doneAt + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const labelScale = scaleSettle(eff, { delay: doneAt + 6, dur: 12, from: 0, ease: Easing.out(Easing.back(1.7)) });

  return (
    <div style={{ width: barW, display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
      <div style={{ position: "relative", width: barW, height: MAX_PLOT_H }}>
        {solidOp > 0 && (
          <div
            style={{
              position: "absolute",
              left: 0,
              bottom: 0,
              width: barW,
              height: h,
              background: color,
              borderRadius: "6px 6px 0 0",
              opacity: solidOp,
            }}
          />
        )}
        {labelScale > 0 && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              bottom: h + 18,
              transform: `translateX(-50%) scale(${labelScale})`,
              transformOrigin: "center bottom",
              fontFamily: TYPE.sans,
              fontWeight: TYPE.weight.black,
              fontSize: 34,
              letterSpacing: -0.5,
              color,
              whiteSpace: "nowrap",
            }}
          >
            {formatNum(value)}
          </div>
        )}
        {!skipIntro &&
          solidOp < 1 &&
          Array.from({ length: n }).map((_, i) => {
            const depart = departOf(i);
            const age = frame - depart;
            if (age <= 0) return null;
            const layer = Math.floor(i / perLayer);
            const col = i % perLayer;
            const targetTop = MAX_PLOT_H - (layer + 1) * GRAIN;
            const jitter = rnd(i, b * 13 + 3) * 70;
            const startTop = targetTop - DROP_FROM - jitter;
            const dist = targetTop - startTop;
            const tLand = fallTime(dist);
            let top: number;
            if (age < tLand) {
              top = startTop + 0.5 * GRAV * age * age;
            } else {
              const ba = age - tLand;
              const bounce = ba < 6 ? Math.sin((ba / 6) * Math.PI) * GRAIN * 2 * 0.15 * (1 + rnd(i, b * 13 + 9)) : 0;
              top = targetTop - bounce;
            }
            const isAccent = featured || rnd(i, b * 13 + 7) < 0.18;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: col * GRAIN + 1,
                  top,
                  width: GRAIN - 2,
                  height: GRAIN - 2,
                  background: isAccent ? color : neutral,
                  opacity: 1 - solidOp,
                  borderRadius: 2,
                }}
              />
            );
          })}
      </div>
      <div
        style={{
          marginTop: SPACE[3],
          fontFamily: TYPE.mono,
          fontSize: TYPE.source,
          fontWeight: TYPE.weight.medium,
          letterSpacing: 1.4,
          textTransform: "uppercase",
          color: neutral,
          textAlign: "center",
        }}
      >
        {label}
      </div>
    </div>
  );
};

export const ParticleSandFill: React.FC<ParticleSandFillProps> = ({
  title = "",
  subtitle = "",
  bars = [],
  ground = "structure",
  accentColor,
  bgColor,
  inkColor,
  mutedColor,
  kicker,
  source,
  skipIntro,
  animateOut,
}) => {
  const frame = useCurrentFrame();
  const t = resolveTheme(ground, accentColor, bgColor, inkColor, mutedColor);
  const outro = useOutro(animateOut);
  const d = skipIntro ? -999 : 0;

  const rawMax = bars.length ? Math.max(...bars.map((b) => b.value)) : 0;
  const featuredIdx = bars.findIndex((b) => b.value === rawMax);
  const scaleMax = Math.max(rawMax, 1);

  // Grain / count-per-layer scale with bar count so a 2-bar chart isn't
  // sparse and a 6-bar chart isn't crushed together.
  const perLayer = Math.max(5, Math.min(12, 13 - bars.length));
  const barW = GRAIN * perLayer;

  const barsData: BarDatum[] = bars.map((bar) => {
    const h = Math.max(GRAIN, Math.round((bar.value / scaleMax) * MAX_PLOT_H));
    const layers = Math.max(1, Math.round(h / GRAIN));
    return { ...bar, h, layers, n: layers * perLayer };
  });

  return (
    <Ground ground={ground} accentColor={accentColor} bgColor={bgColor} inkColor={inkColor} mutedColor={mutedColor} skipIntro={skipIntro} focus={{ x: 0.5, y: 0.36 }}>
      <div style={{ height: "100%", display: "flex", flexDirection: "column", gap: SPACE[10], ...outro }}>
        <SectionTitle title={title} kicker={kicker ?? "Distribution"} dek={subtitle} theme={t} frame={frame} delay={d} />

        <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
          <GlassCard
            theme={t}
            style={{ width: "100%", height: CARD_H, position: "relative", overflow: "visible", padding: PAD, display: "flex", flexDirection: "column" }}
          >
            <div style={{ height: LABEL_HEAD, flexShrink: 0 }} />
            <div style={{ position: "relative", height: MAX_PLOT_H, flexShrink: 0 }}>
              <AxisFrame theme={t} frame={frame} delay={d + 8} rows={4} baseline />
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-end", justifyContent: "space-evenly", gap: BAR_GAP }}>
                {barsData.map((bar, b) => (
                  <BarColumn
                    key={b}
                    bar={bar}
                    b={b}
                    frame={frame}
                    featured={b === featuredIdx}
                    perLayer={perLayer}
                    barW={barW}
                    color={b === featuredIdx ? t.accent : t.ink}
                    neutral={t.muted}
                    skipIntro={skipIntro}
                  />
                ))}
              </div>
            </div>
            <div style={{ height: CAPTION_H, flexShrink: 0 }} />
          </GlassCard>
        </div>
      </div>
      <SourceTag source={source} theme={t} frame={frame} delay={d + 80} />
    </Ground>
  );
};
