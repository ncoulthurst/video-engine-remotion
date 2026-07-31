/**
 * BarRowsAxis — a ranked list of horizontal bars sharing one 0→max axis, each
 * bar growing left→right with its value tracking the bar's leading edge, and
 * a shared tick axis running underneath. The "how big are these things,
 * relative to a common scale" chart — unemployment/failure-rate/spending-type
 * comparisons.
 *
 * Recreated from a reference reel (recreate.mp4, segment 1: "U.S. Economy
 * after the Great Depression") onto this kit's own visual language — kit
 * tokens only, no local hex/font/spacing. The reference's literal black/white
 * halftone-print look is NOT reproduced; this uses the kit's standard
 * ground/theme/accent system instead so it composes with every other
 * template in the family.
 */
import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { z } from "zod";
import {
  Ground,
  Kicker,
  SourceTag,
  resolveTheme,
  useOutro,
  wipe,
  fadeUp,
  stagger,
  rgbaOf,
  TYPE,
  SPACE,
  RADIUS,
  baseTemplateSchema,
  type BaseTemplateProps,
} from "./lib/kit";

// ── Title emphasis — "...*Great Depression*" renders the marked span in the
// serif italic register; everything else stays in the sans display face. ────
function EmphasisTitle({ text, size, color }: { text: string; size: number; color: string }) {
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

const BarRowSchema = z.object({
  label: z.string(),
  value: z.number(),
});

export const BarRowsAxisPropsSchema = z.object({
  ...baseTemplateSchema,
  title: z.string().optional().default("U.S. Economy after the *Great Depression*"),
  dek: z.string().optional().default(
    "The chart below shows how joblessness rose during 1930, based on data from the U.S. Bureau of Labor Statistics.",
  ),
  rows: z.array(BarRowSchema).optional().default([
    { label: "Unemployment", value: 43 },
    { label: "Banks that failed", value: 85 },
    { label: "Growth of government spending (New Deal)", value: 72 },
  ]),
  maxValue: z.number().optional().default(100),
  unit: z.string().optional().default("%"),
  ground: z.enum(["paper", "ink", "structure"]).optional().default("structure"),
});
export type BarRowsAxisProps = z.input<typeof BarRowsAxisPropsSchema> & BaseTemplateProps;

export const BARROWSAXIS_DUR = 160;

const ROW_H = 64;
const ROW_GAP = 46;
const ROW_START = 24;
const ROW_STAGGER = 14;

export const BarRowsAxis: React.FC<BarRowsAxisProps> = ({
  title = "",
  dek = "",
  rows = [],
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

  const ticks = [0, 0.2, 0.4, 0.6, 0.8, 1].map((f) => Math.round(f * maxValue));

  return (
    <Ground ground={ground} accentColor={accentColor} skipIntro={skipIntro} texture domain="generic" focus={{ x: 0.3, y: 0.3 }}>
      <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", gap: SPACE[12], ...outro }}>
        <div style={{ display: "flex", flexDirection: "column", gap: SPACE[4] }}>
          <Kicker label={kicker} theme={t} frame={frame} delay={d} />
          <div style={{ overflow: "hidden", paddingBottom: 10 }}>
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
              <EmphasisTitle text={title} size={TYPE.display} color={t.accent} />
            </div>
          </div>
          {dek && (
            <div style={{ fontFamily: TYPE.sans, fontSize: TYPE.sub, color: t.muted, maxWidth: 1100, lineHeight: 1.45, ...fadeUp(frame, { delay: d + 12, dur: 22 }) }}>
              {dek}
            </div>
          )}
        </div>

        <div style={{ position: "relative", paddingBottom: 40 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: ROW_GAP }}>
            {rows.map((row, i) => {
              const rowDelay = d + ROW_START + stagger(i, ROW_STAGGER);
              const rowIn = fadeUp(frame, { delay: rowDelay, dur: 18 });
              const growP = wipe(frame, { delay: rowDelay + 6, dur: 34 });
              const pct = Math.max(0, Math.min(1, row.value / maxValue));
              const barPct = growP * pct * 100;
              return (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: SPACE[2], ...rowIn }}>
                  <div style={{ fontFamily: TYPE.mono, fontSize: TYPE.label, fontWeight: TYPE.weight.semibold, letterSpacing: TYPE.track, textTransform: "uppercase", color: t.muted }}>
                    {row.label}
                  </div>
                  <div style={{ position: "relative", height: ROW_H / 2.6 }}>
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: `${barPct}%`,
                        background: t.accent,
                        borderRadius: RADIUS.sm,
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        left: `${barPct}%`,
                        top: "50%",
                        transform: "translate(14px, -50%)",
                        fontFamily: TYPE.sans,
                        fontSize: TYPE.sub,
                        fontWeight: TYPE.weight.bold,
                        color: t.ink,
                        whiteSpace: "nowrap",
                        opacity: growP > 0.05 ? 1 : 0,
                      }}
                    >
                      {Math.round(pct * maxValue * growP)}
                      {unit}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* shared axis */}
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 1, background: t.line }} />
          {ticks.map((tv, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `${(i / (ticks.length - 1)) * 100}%`,
                bottom: -30,
                transform: i === 0 ? "translateX(0)" : i === ticks.length - 1 ? "translateX(-100%)" : "translateX(-50%)",
                fontFamily: TYPE.mono,
                fontSize: TYPE.source,
                letterSpacing: 1,
                color: t.muted,
                opacity: wipe(frame, { delay: d + 10, dur: 16 }),
              }}
            >
              {tv}
              {unit}
            </div>
          ))}
        </div>
      </div>

      <SourceTag source={source} theme={t} frame={frame} delay={d + 40} />
    </Ground>
  );
};
