/**
 * SpeedRampReveal — a horizontal rail of image cards glides smoothly and
 * decelerates into a full stop centred on the target card (the one that
 * matters), then holds there — lifted, shadowed, and labelled — for the
 * remainder of the scene. No motion blur: the whole move is gentle enough
 * (ease in, ease out) that blur was never earning its keep.
 *
 * `startIndex` lets a later invocation resume from where a previous one left
 * off (e.g. subject A's scene ends resting on card 3; subject B's scene opens
 * with `startIndex: 3` and new cards to the right so the camera continues the
 * same rail instead of resetting to card 0). The engine doesn't wire this
 * hand-off between scenes yet — that's a follow-up — but the prop is here so
 * the template is ready for it.
 *
 * Ported from video-shotcraft's speed-ramp-reveal recipe; the card rail
 * layout (width/gap) is the same family as FreezeAnnotate.tsx.
 */
import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { z } from "zod";
import {
  Ground,
  SourceTag,
  resolveTheme,
  useOutro,
  cardShadow,
  rgbaOf,
  TYPE,
  SPACE,
  RADIUS,
  baseTemplateSchema,
  type BaseTemplateProps,
} from "./lib/kit";
import { SmartImg } from "./shared";

// ── Schema ──────────────────────────────────────────────────────────────────

// each rail image is {src, x, y} — x/y (in %, roughly -50..50) pan the image
// within its fixed-size tile — the tile itself never moves or resizes, only
// the crop underneath it does. (Previously a string|object union; that made
// the Studio props panel show a per-item type toggle with no way to reach
// the x/y sliders unless you first switched every item to the object variant
// — now every entry is always the full object, so the sliders are always
// there.)
const RailImageSchema = z.object({
  src: z.string(),
  x: z.number().optional().default(0),
  y: z.number().optional().default(0),
});

export const SpeedRampRevealPropsSchema = z.object({
  ...baseTemplateSchema,
  images: z.array(RailImageSchema).optional().default([
    { src: "suarez.png", x: 0, y: 0 },
    { src: "neymar.png", x: 0, y: 0 },
    { src: "aguero.png", x: 0, y: 0 },
    { src: "toney.png", x: 0, y: 0 },
    { src: "rooney.png", x: 0, y: 0 },
    { src: "dinho.png", x: 0, y: 0 },
    { src: "maupay.png", x: 0, y: 0 },
    { src: "thiago.png", x: 0, y: 0 },
    { src: "benrahma.png", x: 0, y: 0 },
    { src: "mbeumo.png", x: 0, y: 0 },
  ]),
  targetIndex: z.number().int().min(0).optional().default(4),
  targetLabel: z.string().optional(),
  /** index the rail starts centred on before it begins moving — set this to a
   *  previous scene's `targetIndex` to continue the same rail instead of
   *  restarting from card 0. */
  startIndex: z.number().int().min(0).optional().default(0),
  ground: z.enum(["paper", "ink", "structure"]).optional().default("structure"),
});
export type SpeedRampRevealProps = z.input<typeof SpeedRampRevealPropsSchema> & BaseTemplateProps;

export const SPEEDRAMP_DUR = 230;

// ── Rail layout — shared family with FreezeAnnotate.tsx ─────────────────────

export const RAIL_CARD_W = 460;
export const RAIL_GAP = 60;
const CARD_H = Math.round(RAIL_CARD_W * 0.62);
const CARD_STEP = RAIL_CARD_W + RAIL_GAP;
const CL = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// the stage's actual on-screen box — Ground insets children by SPACE.page on
// every side, so the real local coordinate space here is not the full 1920
// frame width.
const STAGE_W = 1920 - SPACE.page * 2;

/** translateX so that a (possibly fractional, mid-transit) index's card
 *  centre sits at the stage's horizontal centre. */
function railXForCenteredIndex(index: number) {
  return STAGE_W / 2 - (index * CARD_STEP + RAIL_CARD_W / 2);
}

// hold at the start position briefly, then ease smoothly (in AND out — no
// fast whip at either end) into a full stop centred on the target, where it
// then holds for the rest of the scene.
const PRE_HOLD = 15;
const REST_FRAME = 150;

// ── Component ────────────────────────────────────────────────────────────────

export const SpeedRampReveal: React.FC<SpeedRampRevealProps> = ({
  images = [],
  targetIndex = 4,
  targetLabel,
  startIndex = 0,
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

  // skipIntro's natural settled state: fully arrived and resting on target.
  const frameEff = skipIntro ? REST_FRAME : frame;
  const target = Math.max(0, Math.min(images.length - 1, targetIndex));
  const start = Math.max(0, Math.min(images.length - 1, startIndex));

  const posIndex = interpolate(frameEff, [PRE_HOLD, REST_FRAME], [start, target], {
    ...CL,
    easing: Easing.inOut(Easing.cubic),
  });
  const worldX = railXForCenteredIndex(posIndex);

  // fades in as the rail settles onto the target, then stays fully engaged
  // (lifted, shadowed, labelled) for the remainder of the scene.
  const gaze = interpolate(frameEff, [REST_FRAME - 24, REST_FRAME], [0, 1], CL);

  return (
    <Ground ground={ground} accentColor={accentColor} skipIntro={skipIntro} texture domain="generic" focus={{ x: 0.5, y: 0.5 }}>
      <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", gap: SPACE[8], ...outro }}>
        {kicker && (
          <div style={{ fontFamily: TYPE.mono, fontSize: TYPE.label, fontWeight: TYPE.weight.semibold, letterSpacing: TYPE.track, textTransform: "uppercase", color: t.muted }}>
            {kicker}
          </div>
        )}

        <div style={{ position: "relative", height: CARD_H + 100, overflow: "visible" }}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: "50%",
              display: "flex",
              gap: RAIL_GAP,
              transform: `translateY(-50%) translateX(${worldX}px)`,
            }}
          >
            {images.map((entry, i) => {
              const { src, x: imgX = 0, y: imgY = 0 } = entry;
              const isTarget = i === target;
              const lift = isTarget ? gaze * 22 : 0;
              const shadow = isTarget
                ? `0 ${Math.round(30 + 40 * gaze)}px ${Math.round(60 + 60 * gaze)}px rgba(0,0,0,${(0.25 + 0.2 * gaze).toFixed(3)})`
                : cardShadow(t);
              return (
                <div
                  key={i}
                  style={{
                    width: RAIL_CARD_W,
                    height: CARD_H,
                    flexShrink: 0,
                    position: "relative",
                    borderRadius: RADIUS.lg,
                    overflow: "hidden",
                    background: t.surface,
                    border: `1px solid ${isTarget ? t.accent : t.line}`,
                    boxShadow: shadow,
                    transform: `translateY(${-lift}px) scale(${1 + gaze * (isTarget ? 0.05 : 0)})`,
                  }}
                >
                  <SmartImg
                    src={src}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      objectPosition: `${50 + imgX}% ${50 + imgY}%`,
                    }}
                  />
                  {isTarget && targetLabel && gaze > 0.05 && (
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        bottom: 0,
                        padding: `${SPACE[3]}px ${SPACE[4]}px`,
                        background: `linear-gradient(to top, ${rgbaOf(t.bg, 0.86)}, transparent)`,
                        opacity: gaze,
                      }}
                    >
                      <div style={{ fontFamily: TYPE.mono, fontSize: TYPE.source, letterSpacing: 1.4, textTransform: "uppercase", color: t.highlight }}>
                        {targetLabel}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <SourceTag source={source} theme={t} frame={frame} delay={45} />
    </Ground>
  );
};
