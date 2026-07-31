/**
 * ListStackPress — items fly up from the bottom of frame and land one at a
 * time into a growing stack, staggered well apart with a calm ease-out entry
 * and a slight straightening tilt.
 *
 * Deliberately calmed down from the original port: no cumulative "stack
 * press" cascade (every new card no longer jostles all earlier ones), no
 * per-card highlight flourish, no top-right digit-roll counter, no payoff
 * light-sweep across the stack — one thing moves at a time so the eye has a
 * single focal point.
 *
 * Ported from video-shotcraft's ScenePapers demo, which drew onto pre-baked
 * page-texture PNGs in fixed layout slots; this version replaces the texture
 * cards with generic GlassCard content tiles (title/sub) so it's data-driven
 * for an arbitrary item count, and restyles every colour/type/shadow token
 * onto the shared kit.
 */
import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { z } from "zod";
import {
  Ground,
  GlassCard,
  SectionTitle,
  SourceTag,
  resolveTheme,
  useOutro,
  cardShadow,
  TYPE,
  SPACE,
  baseTemplateSchema,
  type BaseTemplateProps,
} from "./lib/kit";

// ── Schema ──────────────────────────────────────────────────────────────────

const StackItemSchema = z.object({
  title: z.string(),
  sub: z.string().optional(),
});

export const ListStackPressPropsSchema = z.object({
  ...baseTemplateSchema,
  title: z.string().optional().default("Daily Radar"),
  items: z.array(StackItemSchema).optional().default([
    { title: "Nano-Lab Materials", sub: "MIT · Applied Physics" },
    { title: "Fusion Ignition Yield", sub: "Lawrence Livermore" },
    { title: "Protein Folding Update", sub: "DeepMind" },
    { title: "Quantum Error Correction", sub: "Google Quantum AI" },
    { title: "Carbon Capture Membranes", sub: "ETH Zürich" },
  ]),
  ground: z.enum(["paper", "ink", "structure"]).optional().default("structure"),
});
export type ListStackPressProps = z.input<typeof ListStackPressPropsSchema> & BaseTemplateProps;

export const LISTSTACKPRESS_DUR = 190;

// ── Timing / easing — slower, single-focus: one card moves at a time ────────

const DUR = 30;
const CUE0 = 20;
const CUE_GAP = 24;
const FLY_EASE = Easing.bezier(0.22, 1, 0.36, 1); // calm ease-out, no overshoot snap
const CL = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const CARD_W = 900;
const CARD_H = 108;
const CARD_GAP = 18;

// ── Component ────────────────────────────────────────────────────────────────

export const ListStackPress: React.FC<ListStackPressProps> = ({
  title = "",
  items = [],
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

  const cue = (i: number) => d + CUE0 + i * CUE_GAP;

  const listH = items.length * (CARD_H + CARD_GAP) - CARD_GAP;

  return (
    <Ground ground={ground} accentColor={accentColor} skipIntro={skipIntro} texture domain="generic" focus={{ x: 0.34, y: 0.4 }}>
      <div style={{ height: "100%", display: "flex", flexDirection: "column", gap: SPACE[10], ...outro }}>
        <SectionTitle title={title} kicker={kicker ?? "Watching"} theme={t} frame={frame} delay={d} />

        <div style={{ position: "relative", width: CARD_W, height: Math.max(listH, CARD_H), overflow: "visible" }}>
          {items.map((item, i) => {
            const c = cue(i);
            const p = interpolate(frame, [c, c + DUR], [0, 1], { ...CL, easing: FLY_EASE });
            if (p <= 0) return null;
            const settled = p >= 0.999;
            const dy = 600 * (1 - p);
            const tilt = (i % 2 === 0 ? 2 : -2) * (1 - p);
            const scale = 1.06 - 0.06 * p;
            const shadow = settled
              ? cardShadow(t)
              : `0 ${Math.round(32 * (1 - p))}px ${Math.round(64 * (1 - p))}px rgba(10,8,4,${(0.22 * (1 - p) + 0.06).toFixed(3)})`;

            const top = i * (CARD_H + CARD_GAP);

            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: 0,
                  top,
                  width: CARD_W,
                  height: CARD_H,
                  transform: `translateY(${dy}px) rotate(${tilt}deg) scale(${scale})`,
                  transformOrigin: "center center",
                }}
              >
                <GlassCard
                  theme={t}
                  style={{
                    width: "100%",
                    height: "100%",
                    padding: `${SPACE[5]}px ${SPACE[6]}px`,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    gap: SPACE[1],
                    boxShadow: shadow,
                  }}
                >
                  <div style={{ fontFamily: TYPE.sans, fontSize: TYPE.cardTitle - 6, fontWeight: TYPE.weight.bold, color: t.ink, letterSpacing: -0.3 }}>
                    {item.title}
                  </div>
                  {item.sub && (
                    <div style={{ fontFamily: TYPE.mono, fontSize: TYPE.source, letterSpacing: 1.4, textTransform: "uppercase", color: t.muted }}>
                      {item.sub}
                    </div>
                  )}
                </GlassCard>
              </div>
            );
          })}
        </div>
      </div>

      <SourceTag source={source} theme={t} frame={frame} delay={d + 48} />
    </Ground>
  );
};
