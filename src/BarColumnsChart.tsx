/**
 * BarColumnsChart — a vertical bar chart across a shared 0→max axis: bars
 * grow up from the baseline one at a time, gridlines behind, month/category
 * labels below each column. The "how did this figure move across the year"
 * chart — costs/rates/counts by month.
 *
 * Recreated from a reference reel (recreate.mp4, segment 6: "The rise and
 * fall of energy costs") onto this kit's own visual language — kit tokens
 * only, no local hex/font/spacing. Each bar fills the same way as
 * ParticleSandFill.tsx: small "sand" particles rain down (closed-form
 * gravity, no physics engine) and land layer by layer, then cross-fade into
 * a solid bar once full — reused here rather than a plain grow-from-zero
 * bar, per direction to lean on that technique more.
 */
import React from "react";
import { useCurrentFrame } from "remotion";
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
  TYPE,
  SPACE,
  RADIUS,
  baseTemplateSchema,
  type BaseTemplateProps,
} from "./lib/kit";

// ── Title emphasis — "...*energy*..." renders the marked span in the serif
// italic register; everything else stays in the sans display face. ─────────
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

// ── Schema ──────────────────────────────────────────────────────────────────

const ColumnSchema = z.object({ label: z.string(), value: z.number() });

export const BarColumnsChartPropsSchema = z.object({
  ...baseTemplateSchema,
  title: z.string().optional().default("The rise and fall of *energy* costs"),
  dek: z.string().optional().default(
    "Monthly averages illustrate how electricity prices moved between highs and lows, measured as a percentage of household income. Source: Eurostat.",
  ),
  columns: z.array(ColumnSchema).optional().default([
    { label: "Jan", value: 22 }, { label: "Feb", value: 58 }, { label: "Mar", value: 71 },
    { label: "Apr", value: 74 }, { label: "May", value: 46 }, { label: "June", value: 19 },
    { label: "July", value: 88 }, { label: "Aug", value: 63 }, { label: "Sept", value: 93 },
    { label: "Oct", value: 68 }, { label: "Nov", value: 54 }, { label: "Dec", value: 70 },
  ]),
  maxValue: z.number().optional().default(100),
  unit: z.string().optional().default("%"),
  ground: z.enum(["paper", "ink", "structure"]).optional().default("structure"),
});
export type BarColumnsChartProps = z.input<typeof BarColumnsChartPropsSchema> & BaseTemplateProps;

export const BARCOLUMNSCHART_DUR = 210;

const PLOT_H = 460;

// ── Sand-fill geometry / motion — same closed-form technique as
// ParticleSandFill.tsx, retuned for a wider row of narrower bars (12 monthly
// columns vs. that template's 2–6). ──────────────────────────────────────────
const GRAIN = 12;
const PER_LAYER = 5; // → 60px bar width, close to the previous 64px cap
const BAR_W = GRAIN * PER_LAYER;
const DROP_FROM = 210;
const GRAV = 1.6;
const BAR_STAGGER = 4; // frames between one bar's rain starting and the next's — smaller than
// ParticleSandFill's 7 since there are up to 12 bars here, not 2–6
const INTRO = 10;
const DEPART_BUDGET = 34;

const fracOf = (x: number) => x - Math.floor(x);
/** Frame-deterministic pseudo-random jitter in [0,1) — sin-hash, not Math.random. */
const rnd = (i: number, salt: number) => fracOf(Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453);
const fallTime = (dist: number) => Math.sqrt((2 * dist) / GRAV);

const SandBar: React.FC<{
  b: number;
  frame: number;
  h: number;
  color: string;
  neutral: string;
  skipIntro?: boolean;
}> = ({ b, frame, h, color, neutral, skipIntro = false }) => {
  const layers = Math.max(1, Math.round(h / GRAIN));
  const n = layers * PER_LAYER;
  const rate = n > 1 ? Math.min(0.22, DEPART_BUDGET / (n - 1)) : 0;
  const departOf = (i: number) => INTRO + b * BAR_STAGGER + i * rate + rnd(i, b * 7 + 1) * 1.2;
  const lastIdx = Math.max(0, n - 1);
  const lastJitter = rnd(lastIdx, b * 13 + 3) * 50;
  const lastLand = departOf(lastIdx) + fallTime(DROP_FROM + lastJitter);
  const doneAt = lastLand + 6;
  const eff = skipIntro ? doneAt + 999 : frame;

  const solidOp = Math.max(0, Math.min(1, (eff - doneAt) / 10));

  return (
    <div style={{ position: "relative", width: BAR_W, height: PLOT_H }}>
      {solidOp > 0 && (
        <div
          style={{
            position: "absolute",
            left: 0,
            bottom: 0,
            width: BAR_W,
            height: h,
            background: color,
            borderRadius: `${RADIUS.sm}px ${RADIUS.sm}px 0 0`,
            opacity: solidOp,
          }}
        />
      )}
      {!skipIntro &&
        solidOp < 1 &&
        Array.from({ length: n }).map((_, i) => {
          const depart = departOf(i);
          const age = frame - depart;
          if (age <= 0) return null;
          const layer = Math.floor(i / PER_LAYER);
          const col = i % PER_LAYER;
          const targetTop = PLOT_H - (layer + 1) * GRAIN;
          const jitter = rnd(i, b * 13 + 3) * 50;
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
          const isAccent = rnd(i, b * 13 + 7) < 0.2;
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
  );
};

export const BarColumnsChart: React.FC<BarColumnsChartProps> = ({
  title = "",
  dek = "",
  columns = [],
  maxValue = 100,
  unit = "%",
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

  const yTicks = [0, 0.2, 0.4, 0.6, 0.8, 1].map((f) => `${Math.round(f * maxValue)}${unit}`).reverse();

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
          <AxisFrame theme={t} frame={frame} delay={d + 16} rows={5} yTicks={yTicks} baseline />

          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: SPACE[3] }}>
            {columns.map((col, i) => {
              const pct = Math.max(0, Math.min(1, col.value / maxValue));
              const h = Math.max(GRAIN, Math.round(pct * PLOT_H));
              return (
                <div key={i} style={{ flex: 1, display: "flex", justifyContent: "center", height: "100%", alignItems: "flex-end" }}>
                  <SandBar b={i} frame={frame} h={h} color={t.accent} neutral={t.muted} skipIntro={skipIntro} />
                </div>
              );
            })}
          </div>

          <div style={{ position: "absolute", left: 0, right: 0, top: PLOT_H + 20, display: "flex", justifyContent: "space-between", gap: SPACE[3] }}>
            {columns.map((col, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  textAlign: "center",
                  fontFamily: TYPE.mono,
                  fontSize: TYPE.source,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  color: t.muted,
                  opacity: wipe(frame, { delay: d + 14, dur: 16 }),
                }}
              >
                {col.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      <SourceTag source={source} theme={t} frame={frame} delay={d + INTRO + columns.length * BAR_STAGGER + 40} />
    </Ground>
  );
};
