/**
 * TimelineTravel — a single continuous camera SWEEP along a horizontal time
 * axis (accelerating cruise → hard brake), with each event's card springing
 * up out of the axis exactly as the camera passes its tick, then a hard
 * zoom-in on the final beat.
 *
 * Different camera language from TimelineScroll (which dwells + zooms on
 * each node in discrete steps, itemActive() crossfading between them) and
 * TimelineGeneric (a rail + step-tour camera): TimelineTravel never stops
 * moving until the very end — it's one accelerating pass across the whole
 * axis, tick-triggered pop-ups riding past as the camera goes, landing on a
 * hard brake + punch-in on the last event. Ported from video-shotcraft's
 * TimelineTravel demo (see engine PR notes) — preserves the two-stage eased
 * camera position function, the reverse-lookup "card pops exactly when the
 * camera passes its tick" mechanic, the spring overshoot on each card, and
 * the end zoom-in; restyled onto the shared kit (GlassCard, SectionTitle,
 * theme tokens) and made data-driven for an arbitrary event count.
 */
import React from "react";
import { useCurrentFrame, interpolate, Easing, spring } from "remotion";
import { z } from "zod";
import {
  Ground,
  SectionTitle,
  SourceTag,
  GlassCard,
  resolveTheme,
  useOutro,
  TYPE,
  SPACE,
  RADIUS,
  STROKE,
  EASE,
  baseTemplateSchema,
  type BaseTemplateProps,
} from "./lib/kit";

// ── Schema ──────────────────────────────────────────────────────────────────

const TravelEventSchema = z.object({
  label: z.string(),
  title: z.string(),
  detail: z.string().optional(),
});

export const TimelineTravelPropsSchema = z.object({
  ...baseTemplateSchema,
  title: z.string().optional().default("Timeline Travel"),
  events: z.array(TravelEventSchema).optional().default([
    { label: "v1.0", title: "First release", detail: "The original build ships." },
    { label: "v2.0", title: "Rewrite", detail: "Core engine replaced end to end." },
    { label: "v3.0", title: "Scale-up", detail: "Multi-region rollout begins." },
    { label: "Today", title: "Current state", detail: "The system as it stands now." },
  ]),
  ground: z.enum(["paper", "ink", "structure"]).optional().default("structure"),
});
export type TimelineTravelProps = z.input<typeof TimelineTravelPropsSchema> & BaseTemplateProps;

// ── Layout constants (1920×1080) ──────────────────────────────────────────

const SCREEN_W = 1920;
const SCREEN_H = 1080;
const AXIS_Y = 700;
const AXIS_X0 = 960; // world x of the first tick — camera starts centred here

// A default 4-event set travels a 4200px span (3 gaps × 1400px, matching the
// source exactly). More events tighten the gap so the sweep still reads as
// one continuous pass in the same time budget; fewer events widen it.
const DEFAULT_SPAN = 4200;
const MIN_GAP = 460;
const MAX_GAP = 1600;
const CARD_W_MAX = 360;
const CARD_H = 240;

const TRAVEL_START = 12;
const SPEED_SCALE = 4; // travel moves at 1/4 of the original pace
const ORIG_TRAVEL_FRAMES = 92; // original TRAVEL_END(104) - TRAVEL_START(12)
const PAUSE = 22; // brief hold at each intermediate tick before moving on
const ZOOM_DUR = 10;
const SEG_EASE = Easing.inOut(Easing.quad);

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

export const TimelineTravel: React.FC<TimelineTravelProps> = ({
  title = "",
  events = [],
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

  const n = Math.max(1, events.length);
  const tickGap = n > 1 ? clamp(DEFAULT_SPAN / (n - 1), MIN_GAP, MAX_GAP) : 0;
  const cardW = Math.round(clamp(tickGap - 140, 220, CARD_W_MAX));
  const ticks = events.map((ev, i) => ({ ...ev, x: AXIS_X0 + i * tickGap }));
  const worldW = AXIS_X0 + tickGap * (n - 1) + AXIS_X0;
  const totalTravel = ticks.length ? ticks[ticks.length - 1].x - AXIS_X0 : 0;

  // ── Camera: ease into each tick, hold briefly, ease into the next — one
  //    continuous journey but with a readable pause riding on every item,
  //    at 1/4 the px/frame pace of the original single-sweep version. ──────
  const basePxPerFrame = totalTravel > 0 ? totalTravel / (ORIG_TRAVEL_FRAMES * SPEED_SCALE) : 1;
  const arrive: number[] = new Array(n).fill(TRAVEL_START);
  const depart: number[] = new Array(n).fill(TRAVEL_START);
  arrive[0] = TRAVEL_START;
  depart[0] = TRAVEL_START + (n > 1 ? PAUSE : 0);
  for (let i = 1; i < n; i++) {
    const segDist = ticks[i].x - ticks[i - 1].x;
    const segDur = segDist / basePxPerFrame;
    arrive[i] = depart[i - 1] + segDur;
    depart[i] = i < n - 1 ? arrive[i] + PAUSE : arrive[i];
  }
  const TRAVEL_END = arrive[n - 1];
  const ZOOM_END = TRAVEL_END + ZOOM_DUR;

  const camXAt = (f: number) => {
    if (f <= depart[0]) return ticks[0] ? ticks[0].x - AXIS_X0 : 0;
    for (let i = 1; i < n; i++) {
      if (f <= arrive[i]) {
        const p = interpolate(f, [depart[i - 1], arrive[i]], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: SEG_EASE,
        });
        const posStart = ticks[i - 1].x - AXIS_X0;
        const posEnd = ticks[i].x - AXIS_X0;
        return posStart + (posEnd - posStart) * p;
      }
      if (f <= depart[i]) return ticks[i].x - AXIS_X0;
    }
    return ticks[n - 1].x - AXIS_X0;
  };

  const camX = camXAt(frame);
  const zoom = interpolate(frame, [TRAVEL_END, ZOOM_END], [1, 1.28], {
    easing: EASE.out,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Which tick the camera is currently riding past — gets the featured card.
  let activeIdx = -1;
  for (let i = 0; i < ticks.length; i++) {
    if (frame >= arrive[i] - 6) activeIdx = i;
  }

  return (
    <Ground ground={ground} accentColor={accentColor} skipIntro={skipIntro} pad={0} focus={{ x: 0.4, y: 0.55 }}>
      <div style={{ width: SCREEN_W, height: SCREEN_H, overflow: "hidden", position: "relative", ...outro }}>
        <div style={{ width: SCREEN_W, height: SCREEN_H, transform: `scale(${zoom})`, transformOrigin: "50% 62%" }}>
          <div style={{ position: "absolute", left: 0, top: 0, width: worldW, height: SCREEN_H, transform: `translateX(${-camX}px)` }}>
            {/* the axis rail */}
            <div
              style={{
                position: "absolute",
                left: 200,
                top: AXIS_Y - STROKE.line,
                width: worldW - 400,
                height: STROKE.line * 2,
                background: t.line,
                borderRadius: 3,
              }}
            />
            {/* minor rail ticks — decorative texture only */}
            {Array.from({ length: Math.max(1, Math.round((worldW - AXIS_X0) / 90)) }).map((_, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: AXIS_X0 + i * 90 - 2,
                  top: AXIS_Y - 10,
                  width: 4,
                  height: 20,
                  background: t.line,
                  borderRadius: 2,
                }}
              />
            ))}
            {ticks.map((tick, i) => {
              const popFrame = arrive[i] - 6;
              const s = spring({ frame: frame - popFrame, fps: 30, config: { damping: 11, stiffness: 160, mass: 0.9 }, durationInFrames: 26 });
              const appeared = frame >= popFrame;
              const featured = i === activeIdx;
              return (
                <div key={i} style={{ position: "absolute", left: tick.x, top: 0 }}>
                  {/* the mile-marker stem */}
                  <div style={{ position: "absolute", left: -3, top: AXIS_Y - 28, width: 6, height: 56, background: featured ? t.accent : t.muted, borderRadius: 3, opacity: featured ? 1 : 0.6 }} />
                  <div
                    style={{
                      position: "absolute",
                      left: -Math.max(cardW, 160) / 2,
                      top: AXIS_Y + 44,
                      width: Math.max(cardW, 160),
                      textAlign: "center",
                      fontFamily: TYPE.mono,
                      fontWeight: TYPE.weight.semibold,
                      fontSize: TYPE.label,
                      letterSpacing: 1.6,
                      textTransform: "uppercase",
                      color: featured ? t.accent : t.muted,
                    }}
                  >
                    {tick.label}
                  </div>
                  {appeared && (
                    <div
                      style={{
                        position: "absolute",
                        left: -cardW / 2,
                        top: AXIS_Y - 36 - CARD_H,
                        width: cardW,
                        transform: `scaleY(${s}) scaleX(${0.6 + 0.4 * s})`,
                        transformOrigin: "50% 100%",
                        opacity: Math.min(1, s * 2),
                      }}
                    >
                      <GlassCard theme={t} featured={featured} style={{ width: cardW, height: CARD_H, padding: SPACE[6], display: "flex", flexDirection: "column", justifyContent: "center", gap: SPACE[3], borderRadius: RADIUS.lg }}>
                        <div style={{ fontFamily: TYPE.sans, fontSize: TYPE.cardTitle - 6, fontWeight: TYPE.weight.bold, color: t.ink, letterSpacing: -0.4, lineHeight: 1.15 }}>
                          {tick.title}
                        </div>
                        {tick.detail && (
                          <div style={{ fontFamily: TYPE.sans, fontSize: TYPE.body - 1, fontWeight: TYPE.weight.regular, color: t.muted, lineHeight: 1.35 }}>
                            {tick.detail}
                          </div>
                        )}
                      </GlassCard>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {title && (
          <div style={{ position: "absolute", top: SPACE[16], left: 0, right: 0, display: "flex", justifyContent: "center" }}>
            <SectionTitle title={title} kicker={kicker} theme={t} frame={frame} delay={d} align="center" size={TYPE.display - 12} />
          </div>
        )}
        <SourceTag source={source} theme={t} frame={frame} delay={d + 48} />
      </div>
    </Ground>
  );
};
