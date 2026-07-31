/**
 * AxisRescaleShock — a line chart whose last data point blows past the axis
 * ceiling: the card kicks, the old ticks crossfade-swap for a rescaled axis,
 * extra gridlines densify in, and a value pill pops onto the breakout point.
 *
 * Ported from video-shotcraft's AxisRescaleShockV2 (chart-live-moves demo
 * pack) — the two-stage easing (draw → shock → rescale → pop), the axis-tick
 * crossfade-swap mechanic, the gridline densify, and the decaying-sine card
 * kick are all preserved frame-for-frame. Colour / type / spacing now resolve
 * from the kit; content (data, labels, breakout value) is fully data-driven.
 */
import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { z } from "zod";
import {
  Ground,
  SectionTitle,
  SourceTag,
  GlassCard,
  resolveTheme,
  useOutro,
  pillShadow,
  TYPE,
  SPACE,
  STROKE,
  RADIUS,
  baseTemplateSchema,
  type BaseTemplateProps,
} from "./lib/kit";

export const AxisRescaleShockPropsSchema = z.object({
  ...baseTemplateSchema,
  title: z.string().optional().default("Monthly Revenue"),
  subtitle: z.string().optional().default("FY2026 · all products · USD"),
  data: z
    .array(z.number())
    .optional()
    .default([22, 30, 26, 38, 35, 47, 44, 58, 55, 66, 72, 340]),
  xLabels: z
    .array(z.string())
    .optional()
    .default(["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]),
  unit: z.string().optional().default("$"),
  breakoutLabel: z.string().optional().default("$340k"),
  ground: z.enum(["paper", "ink", "structure"]).optional().default("structure"),
});
export type AxisRescaleShockProps = z.input<typeof AxisRescaleShockPropsSchema> & BaseTemplateProps;

// ── nice-number axis rounding — ticks are round numbers, never raw maxima ──
function niceStep(x: number): number {
  if (x <= 0) return 1;
  const exp = Math.floor(Math.log10(x));
  const f = x / 10 ** exp;
  const nf = f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10;
  return nf * 10 ** exp;
}
const niceAxisMax = (rawMax: number) => niceStep(Math.max(rawMax, 1) / 4) * 4;

// ── timing beats (preserved verbatim from the source: hold → draw → shock →
//    rescale → pop). Only the frame anchor `d` (skipIntro offset) is new. ──
const HOLD = 12;
const DRAW_END = HOLD + 34; // history line finishes drawing
const SHOCK_END = DRAW_END + 16; // breakout point punches through the top
const BEAT = SHOCK_END + 16; // half-beat hang before rescale
const RESCALE_END = BEAT + 12; // rescale completes
const MARK_END = RESCALE_END + 8; // endpoint marker pops
const VAL_END = MARK_END + 10; // value pill pops
const easeDraw = Easing.inOut(Easing.cubic);

const CARD_W = 1060;
const CARD_H = 560;
const PAD = 52;
const AXIS_W = 96;
const PLOT_W = CARD_W - PAD * 2 - AXIS_W;
const PLOT_H = 340;
const PLOT_X = PAD + AXIS_W;
const PLOT_Y = 70;

export const AxisRescaleShock: React.FC<AxisRescaleShockProps> = ({
  title = "",
  subtitle = "",
  data = [],
  xLabels = [],
  unit = "$",
  breakoutLabel = "",
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

  const safeData = data.length >= 2 ? data : [0, 0];
  const n = safeData.length;
  const oldMax = niceAxisMax(Math.max(...safeData.slice(0, -1), 1));
  const newMax = niceAxisMax(Math.max(safeData[n - 1] ?? 1, 1));

  const range = interpolate(frame, [d + BEAT, d + RESCALE_END], [oldMax, newMax], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const yOf = (v: number) => PLOT_H - (v / range) * PLOT_H;
  const xOf = (i: number) => (i / (n - 1)) * PLOT_W;

  const drawT = skipIntro
    ? n - 2
    : interpolate(frame, [d + HOLD, d + DRAW_END], [0, n - 2], {
        easing: easeDraw,
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
  const shockT = skipIntro
    ? 1
    : interpolate(frame, [d + DRAW_END + 2, d + SHOCK_END], [0, 1], {
        easing: Easing.in(Easing.cubic),
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
  const SHOCK_Y = -(PLOT_Y + 220);
  const rescaleP = skipIntro
    ? 1
    : interpolate(frame, [d + BEAT, d + RESCALE_END], [0, 1], {
        easing: Easing.out(Easing.cubic),
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });

  const basePts: string[] = [];
  const upto = Math.min(drawT, n - 2);
  for (let i = 0; i <= Math.floor(upto); i++) {
    basePts.push(`${xOf(i).toFixed(2)},${yOf(safeData[i]).toFixed(2)}`);
  }
  if (upto < n - 2 && upto > Math.floor(upto)) {
    const i = Math.floor(upto);
    const f = upto - i;
    const x = xOf(i) + (xOf(i + 1) - xOf(i)) * f;
    const y = yOf(safeData[i]) + (yOf(safeData[i + 1]) - yOf(safeData[i])) * f;
    basePts.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }

  let headX = basePts.length ? Number(basePts[basePts.length - 1].split(",")[0]) : 0;
  let headY = basePts.length ? Number(basePts[basePts.length - 1].split(",")[1]) : 0;
  let shockSeg: string[] = [];
  if (shockT > 0) {
    const x0 = xOf(n - 2);
    const y0 = yOf(safeData[n - 2]);
    const x = x0 + (xOf(n - 1) - x0) * shockT;
    const yEnd = SHOCK_Y + (yOf(safeData[n - 1]) - SHOCK_Y) * rescaleP;
    const y = y0 + (yEnd - y0) * shockT;
    shockSeg = [`${x0.toFixed(2)},${y0.toFixed(2)}`, `${x.toFixed(2)},${y.toFixed(2)}`];
    headX = x;
    headY = y;
  }

  const swap = skipIntro
    ? 1
    : interpolate(frame, [d + BEAT, d + BEAT + 10], [0, 1], {
        easing: Easing.out(Easing.cubic),
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
  const oldTicks = [1, 2, 3, 4].map((i) => `${unit}${Math.round((oldMax / 4) * i)}k`);
  const newTicks = [1, 2, 3, 4].map((i) => `${unit}${Math.round((newMax / 4) * i)}k`);
  const denseOp = swap;

  const markS = skipIntro
    ? 1
    : interpolate(frame, [d + RESCALE_END, d + MARK_END], [0, 1], {
        easing: Easing.out(Easing.back(2.2)),
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
  const valS = skipIntro
    ? 1
    : interpolate(frame, [d + MARK_END, d + VAL_END], [0, 1], {
        easing: Easing.out(Easing.back(1.8)),
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
  const KICK_DUR = 16;
  const kick =
    !skipIntro && frame >= d + SHOCK_END && frame < d + SHOCK_END + KICK_DUR
      ? 3.5 * (1 - (frame - (d + SHOCK_END)) / KICK_DUR) * Math.sin((frame - (d + SHOCK_END)) * 0.5)
      : 0;
  const shockOn = frame >= d + DRAW_END;

  return (
    <Ground ground={ground} accentColor={accentColor} skipIntro={skipIntro} focus={{ x: 0.5, y: 0.4 }}>
      <div style={{ height: "100%", display: "flex", flexDirection: "column", gap: SPACE[10], ...outro }}>
        <SectionTitle title={title} kicker={kicker ?? "Trend Break"} dek={subtitle} theme={t} frame={frame} delay={d} align="center" />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <GlassCard
            theme={t}
            style={{
              width: CARD_W,
              height: CARD_H,
              overflow: "visible",
              transform: `translateY(${kick.toFixed(2)}px)`,
            }}
          >
            <div style={{ position: "absolute", left: PLOT_X, top: PLOT_Y, width: PLOT_W, height: PLOT_H }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={`g${i}`} style={{ position: "absolute", left: 0, right: 0, top: (PLOT_H / 4) * i, height: STROKE.hair * 2, background: t.line }} />
              ))}
              {[1, 3, 5, 7].map((i) => (
                <div
                  key={`gd${i}`}
                  style={{ position: "absolute", left: 0, right: 0, top: (PLOT_H / 8) * i, height: STROKE.hair * 1.5, background: t.line, opacity: 0.8 * denseOp }}
                />
              ))}
              {oldTicks.map((v, i) => {
                const y = (PLOT_H / 4) * (3 - i);
                return (
                  <div key={`t${i}`} style={{ position: "absolute", left: -AXIS_W, top: y - 13, width: AXIS_W - 14, height: 26, textAlign: "right" }}>
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        fontFamily: TYPE.mono,
                        fontWeight: TYPE.weight.bold,
                        fontSize: 21,
                        color: t.muted,
                        textAlign: "right",
                        opacity: 1 - swap,
                        transform: `translateY(${(swap * 30).toFixed(2)}px)`,
                      }}
                    >
                      {v}
                    </div>
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        fontFamily: TYPE.mono,
                        fontWeight: TYPE.weight.bold,
                        fontSize: 21,
                        color: t.ink,
                        textAlign: "right",
                        opacity: swap,
                        transform: `translateY(${((swap - 1) * 30).toFixed(2)}px)`,
                      }}
                    >
                      {newTicks[i]}
                    </div>
                  </div>
                );
              })}
              <div style={{ position: "absolute", left: -AXIS_W, top: PLOT_H - 13, width: AXIS_W - 14, fontFamily: TYPE.mono, fontWeight: TYPE.weight.bold, fontSize: 21, color: t.muted, textAlign: "right" }}>
                {unit}0
              </div>
              <svg width={PLOT_W} height={PLOT_H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
                <polyline points={basePts.join(" ")} fill="none" stroke={t.ink} strokeWidth={5} strokeLinejoin="round" strokeLinecap="round" />
                {shockSeg.length > 0 && (
                  <polyline
                    points={shockSeg.join(" ")}
                    fill="none"
                    stroke={t.accent}
                    strokeWidth={shockOn && frame < d + RESCALE_END ? 10 : 6}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                )}
                {markS > 0 && (
                  <>
                    <circle cx={headX} cy={headY} r={13 * markS} fill={t.accent} />
                    <circle cx={headX} cy={headY} r={22 * markS} fill="none" stroke={t.accent} strokeWidth={3} opacity={0.55} />
                  </>
                )}
              </svg>
              {valS > 0 && (
                <div
                  style={{
                    position: "absolute",
                    left: headX - 178,
                    top: headY - 27,
                    width: 150,
                    height: 54,
                    background: t.accent,
                    borderRadius: RADIUS.sm,
                    boxShadow: pillShadow(t),
                    color: "#FFFFFF",
                    fontFamily: TYPE.sans,
                    fontWeight: TYPE.weight.heavy,
                    fontSize: 30,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transform: `scale(${valS.toFixed(4)})`,
                    transformOrigin: "right center",
                  }}
                >
                  {breakoutLabel}
                </div>
              )}
              {xLabels.slice(0, n).map((m, i) => (
                <div
                  key={`m${i}`}
                  style={{
                    position: "absolute",
                    left: xOf(i) - 30,
                    top: PLOT_H + 16,
                    width: 60,
                    textAlign: "center",
                    fontFamily: TYPE.mono,
                    fontSize: 18,
                    fontWeight: TYPE.weight.semibold,
                    color: i === n - 1 ? t.accent : t.muted,
                  }}
                >
                  {m}
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
      <SourceTag source={source} theme={t} frame={frame} delay={d + VAL_END + 10} />
    </Ground>
  );
};
