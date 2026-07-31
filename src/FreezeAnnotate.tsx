/**
 * FreezeAnnotate — the same horizontal card-rail family as SpeedRampReveal,
 * but instead of a speed ramp the rail FLOWS then FREEZES completely on a
 * target card (the frame→world-position remap goes flat mid-animation).
 * While frozen, a clean broadcast-style callout — a precise ring that draws
 * itself on, a straight connector line, and a solid filled arrowhead, all in
 * the theme accent colour with a soft drop shadow for depth — points at the
 * target card, then fades out before the rail unfreezes and continues.
 *
 * Ported from video-shotcraft's freeze-annotate recipe; the exact 4-point
 * frame→world-position remap and the draw/fade frame windows are preserved
 * verbatim. Card rail layout (width/gap/positioning) is the same family as
 * SpeedRampReveal.tsx — kept as a separate, self-contained file per the
 * porting brief. No motion blur — the flow is gentle enough not to need it.
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
// the crop underneath it does. (Previously a string|object union, which made
// the Studio props panel show a per-item type toggle with no way to reach
// the x/y sliders unless every item was first switched to the object variant
// — now every entry is always the full object, so the sliders are always
// there.)
const RailImageSchema = z.object({
  src: z.string(),
  x: z.number().optional().default(0),
  y: z.number().optional().default(0),
});

export const FreezeAnnotatePropsSchema = z.object({
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
  annotationLabel: z.string().optional(),
  ground: z.enum(["paper", "ink", "structure"]).optional().default("structure"),
});
export type FreezeAnnotateProps = z.input<typeof FreezeAnnotatePropsSchema> & BaseTemplateProps;

export const FREEZEANNOTATE_DUR = 230;

// ── Rail layout — shared family with SpeedRampReveal.tsx ────────────────────

const CARD_W = 460;
const GAP = 60;
const CARD_H = Math.round(CARD_W * 0.62);
const CL = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// the stage's actual on-screen box — Ground insets children by SPACE.page on
// every side by default, so the real local coordinate space here is NOT the
// full 1920×1080 frame. Used only to centre the rail itself (`offset` below);
// the annotation overlay no longer depends on this (see V_PAD below).
const STAGE_W = 1920 - SPACE.page * 2;

// vertical room reserved above/below the card row for the annotation's arrow
// + label, which sit above the circled card.
const V_PAD = 190;
const STAGE_H = CARD_H + V_PAD * 2;

// frame → world-position remap: flows, slows ~1.7x compared to the source,
// eased WITHIN each leg (continuous speed, no instant snap at the freeze
// boundary), flows again to finish.
const posAt = (fr: number) =>
  interpolate(fr, [0, 77, 170, 230], [0, 45, 45, 94], { ...CL, easing: Easing.inOut(Easing.cubic) }) * 22;

const FREEZE_MID = 123; // centre of the frozen window (77–170)

// solid filled arrowhead at the pointer end of the callout line.
const ARROWHEAD_LEN = 22;
const ARROWHEAD_HALF_W = 9;

// ── Component ────────────────────────────────────────────────────────────────

export const FreezeAnnotate: React.FC<FreezeAnnotateProps> = ({
  images = [],
  targetIndex = 4,
  annotationLabel,
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
  const fxId = React.useId().replace(/[^a-zA-Z0-9]/g, "");

  // skipIntro's natural settled state: fully frozen, fully drawn, before fade.
  const frameEff = skipIntro ? 153 : frame;
  const target = Math.max(0, Math.min(images.length - 1, targetIndex));
  const railWidth = images.length * (CARD_W + GAP) - GAP;

  const dx = posAt(frameEff);

  // worldX is the rail's translateX, in the rail's own left:0 coordinate
  // frame (no self-centering "translate(-50%)" trick — that trick shifts by
  // half of the RAIL's own total width, not the stage's, so it silently threw
  // the target off-screen for any image count where those two widths
  // differ, which is always). At the frozen plateau (dx === dxAtFreeze) this
  // reduces to exactly `STAGE_W/2 - targetCenterX`, i.e. the target card's
  // centre lands exactly on the stage's centre — guaranteed, not tuned.
  const dxAtFreeze = posAt(FREEZE_MID);
  const targetCenterX = target * (CARD_W + GAP) + CARD_W / 2;
  const worldX = STAGE_W / 2 - targetCenterX - (dx - dxAtFreeze);

  const draw = interpolate(frameEff, [89, 103], [0, 1], CL); // circle draws in while frozen
  const arrowDraw = interpolate(frameEff, [103, 113], [0, 1], CL);
  const fade = interpolate(frameEff, [164, 178], [1, 0], CL); // fades before unfreezing at 170

  const RX = CARD_W * 0.63;
  const RY = CARD_H * 0.62;
  // Ramanujan's ellipse-circumference approximation — the previous "average
  // radius" formula (2π·(rx+ry)/2) undershoots the true circumference by
  // ~1.5% whenever rx and ry differ this much, which left a visible gap
  // where the ring's start/end met. A tiny extra 0.5% keeps it closed even
  // against residual floating-point error.
  const h = ((RX - RY) / (RX + RY)) ** 2;
  const C = Math.PI * (RX + RY) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h))) * 1.005;

  return (
    <Ground ground={ground} accentColor={accentColor} skipIntro={skipIntro} texture domain="generic" focus={{ x: 0.5, y: 0.5 }}>
      <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", gap: SPACE[8], ...outro }}>
        {kicker && (
          <div style={{ fontFamily: TYPE.mono, fontSize: TYPE.label, fontWeight: TYPE.weight.semibold, letterSpacing: TYPE.track, textTransform: "uppercase", color: t.muted }}>
            {kicker}
          </div>
        )}

        <div style={{ position: "relative", height: STAGE_H, overflow: "visible" }}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: "50%",
              transform: `translateY(-50%) translateX(${worldX}px)`,
            }}
          >
            <div style={{ display: "flex", gap: GAP }}>
              {images.map((entry, i) => {
                const { src, x: imgX = 0, y: imgY = 0 } = entry;
                return (
                  <div
                    key={i}
                    style={{
                      width: CARD_W,
                      height: CARD_H,
                      flexShrink: 0,
                      position: "relative",
                      borderRadius: RADIUS.lg,
                      overflow: "hidden",
                      background: t.surface,
                      border: `1px solid ${i === target ? t.accent : t.line}`,
                      boxShadow: cardShadow(t),
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
                  </div>
                );
              })}
            </div>

            {/* hand-drawn marker circle + arrow — nested INSIDE the rail's own
                transformed box (not re-deriving its screen position from
                scratch) so cardCx/cardCy are plain rail-local coordinates and
                always line up with the target card exactly, whatever the
                rail's real on-screen offset turns out to be. (The previous
                version recomputed a "railLeftEdge" against STAGE_W/STAGE_H
                independently of the rail's actual CSS transform — the two
                didn't agree, and the annotation rendered ~1800px off-canvas.) */}
            <svg
              width={railWidth}
              height={CARD_H + V_PAD * 2}
              viewBox={`0 0 ${railWidth} ${CARD_H + V_PAD * 2}`}
              style={{ position: "absolute", left: 0, top: -V_PAD, overflow: "visible", pointerEvents: "none" }}
            >
              <defs>
                {/* soft elevation only — no organic wobble — so the callout
                    reads as a deliberate, precise graphic, not a sketch. */}
                <filter id={`depth-${fxId}`} x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="rgba(0,0,0,0.4)" />
                </filter>
              </defs>
              {(() => {
                const cardCx = target * (CARD_W + GAP) + CARD_W / 2;
                const cardCy = V_PAD + CARD_H / 2;

                const lineStart = { x: cardCx + RX * 1.14, y: cardCy - RY * 1.6 };
                const arrowTip = { x: cardCx + RX * 0.48, y: cardCy - RY * 0.4 };
                const angle = Math.atan2(arrowTip.y - lineStart.y, arrowTip.x - lineStart.x);
                const dir = { x: Math.cos(angle), y: Math.sin(angle) };
                const perp = { x: -dir.y, y: dir.x };
                // pull the line's visible end back by the arrowhead's length so
                // the shaft tucks neatly under the solid triangle instead of
                // poking out past its tip.
                const headBase = {
                  x: arrowTip.x - dir.x * ARROWHEAD_LEN,
                  y: arrowTip.y - dir.y * ARROWHEAD_LEN,
                };
                const lineLen = Math.hypot(headBase.x - lineStart.x, headBase.y - lineStart.y);
                const headLeft = { x: headBase.x + perp.x * ARROWHEAD_HALF_W, y: headBase.y + perp.y * ARROWHEAD_HALF_W };
                const headRight = { x: headBase.x - perp.x * ARROWHEAD_HALF_W, y: headBase.y - perp.y * ARROWHEAD_HALF_W };
                // arrowhead pops in right as the shaft finishes drawing.
                const headOpacity = interpolate(frameEff, [110, 114], [0, 1], CL) * fade;

                return (
                  <>
                    {draw > 0 && (
                      <ellipse
                        cx={cardCx}
                        cy={cardCy}
                        rx={RX}
                        ry={RY}
                        fill="none"
                        stroke={t.accent}
                        strokeWidth={6}
                        strokeDasharray={C}
                        strokeDashoffset={C * (1 - draw)}
                        opacity={fade}
                        filter={`url(#depth-${fxId})`}
                      />
                    )}
                    {arrowDraw > 0 && (
                      <line
                        x1={lineStart.x}
                        y1={lineStart.y}
                        x2={headBase.x}
                        y2={headBase.y}
                        stroke={t.accent}
                        strokeWidth={6}
                        // "butt", not "round": a round cap on a dash-reveal
                        // line still paints a small solid dot at the dash
                        // boundary even when the visible length is meant to
                        // be zero — that stray dot was reading as "the arrow
                        // is always on screen." Butt caps have no such edge.
                        strokeLinecap="butt"
                        strokeDasharray={lineLen}
                        strokeDashoffset={lineLen * (1 - arrowDraw)}
                        opacity={fade}
                        filter={`url(#depth-${fxId})`}
                      />
                    )}
                    {headOpacity > 0 && (
                      <polygon
                        points={`${arrowTip.x},${arrowTip.y} ${headLeft.x},${headLeft.y} ${headRight.x},${headRight.y}`}
                        fill={t.accent}
                        opacity={headOpacity}
                        filter={`url(#depth-${fxId})`}
                      />
                    )}
                    {annotationLabel && draw > 0.5 && (
                      <text
                        x={cardCx + RX * 1.05}
                        y={cardCy - RY * 1.7}
                        textAnchor="start"
                        fill={t.accent}
                        opacity={fade * draw}
                        style={{ fontFamily: TYPE.mono, fontSize: 22, fontWeight: TYPE.weight.bold, letterSpacing: 1.4, textTransform: "uppercase" }}
                      >
                        {annotationLabel}
                      </text>
                    )}
                  </>
                );
              })()}
            </svg>
          </div>
        </div>
      </div>

      <SourceTag source={source} theme={t} frame={frame} delay={45} />
    </Ground>
  );
};
