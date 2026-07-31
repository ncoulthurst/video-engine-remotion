/**
 * RingStatReveal — a headline + dek on one side, and on the other a giant
 * percentage that counts up in lockstep with a circular progress ring
 * tracing around it. The "how big is the consensus/share/rate" hero-stat
 * beat, with the ring giving the number a visual "fullness" read instead of
 * sitting bare.
 *
 * Recreated from a reference reel (recreate.mp4, segment 2: "the overwhelming
 * scientific consensus on climate change") onto this kit's own visual
 * language — kit tokens only, no local hex/font/spacing.
 */
import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { z } from "zod";
import {
  Ground,
  Kicker,
  SourceTag,
  resolveTheme,
  useOutro,
  wipe,
  fadeUp,
  prog,
  EASE,
  TYPE,
  SPACE,
  baseTemplateSchema,
  type BaseTemplateProps,
} from "./lib/kit";

// ── Title emphasis — "...*scientific*..." renders the marked span in the
// serif italic register; everything else stays in the sans display face. ────
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

export const RingStatRevealPropsSchema = z.object({
  ...baseTemplateSchema,
  title: z.string().optional().default("The overwhelming *scientific* consensus on climate change"),
  dek: z.string().optional().default(
    "Across decades of studies and international reports, scientists have reached near-total agreement: global warming is real and primarily driven by human activity.",
  ),
  value: z.number().optional().default(78),
  maxValue: z.number().optional().default(100),
  unit: z.string().optional().default("%"),
  ground: z.enum(["paper", "ink", "structure"]).optional().default("structure"),
});
export type RingStatRevealProps = z.input<typeof RingStatRevealPropsSchema> & BaseTemplateProps;

export const RINGSTATREVEAL_DUR = 130;

const RING_START = 20;
const RING_DUR = 70;

export const RingStatReveal: React.FC<RingStatRevealProps> = ({
  title = "",
  dek = "",
  value = 78,
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
  const frameEff = skipIntro ? RING_START + RING_DUR + 20 : frame;

  const SZ = 380;
  const R = 150;
  const SW = 16;
  const C = 2 * Math.PI * R;
  const frac = Math.max(0, Math.min(1, value / maxValue));

  // ring sweep and the number count-up share one clock, so the ring is always
  // exactly as "full" as the number reads — no drift between the two.
  const p = prog(frameEff, d + RING_START, RING_DUR, Easing.out(Easing.cubic));
  const shownValue = Math.round(p * value);
  const ringLen = p * frac * C;

  return (
    <Ground ground={ground} accentColor={accentColor} skipIntro={skipIntro} texture domain="generic" focus={{ x: 0.3, y: 0.4 }}>
      <div style={{ height: "100%", display: "flex", alignItems: "center", gap: SPACE[16], ...outro }}>
        <div style={{ flex: "1 1 auto", display: "flex", flexDirection: "column", gap: SPACE[4], maxWidth: 980 }}>
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
                transform: `translateY(${(1 - wipe(frame, { delay: d + 4, dur: 26 })) * TYPE.display * 1.05}px)`,
              }}
            >
              <EmphasisTitle text={title} color={t.accent} />
            </div>
          </div>
          {dek && (
            <div style={{ fontFamily: TYPE.sans, fontSize: TYPE.sub, color: t.muted, lineHeight: 1.45, ...fadeUp(frame, { delay: d + 12, dur: 22 }) }}>
              {dek}
            </div>
          )}
        </div>

        <div style={{ flex: "0 0 auto", position: "relative", width: SZ, height: SZ }}>
          <svg width={SZ} height={SZ} style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
            <circle cx={SZ / 2} cy={SZ / 2} r={R} fill="none" stroke={t.line} strokeWidth={SW} />
            <circle
              cx={SZ / 2}
              cy={SZ / 2}
              r={R}
              fill="none"
              stroke={t.accent}
              strokeWidth={SW}
              strokeLinecap="round"
              strokeDasharray={`${ringLen} ${C}`}
            />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontFamily: TYPE.sans, fontSize: 96, fontWeight: TYPE.weight.black, letterSpacing: -3, color: t.ink, fontVariantNumeric: "tabular-nums" }}>
              {shownValue}
              {unit}
            </div>
          </div>
        </div>
      </div>

      <SourceTag source={source} theme={t} frame={frame} delay={d + RING_START + RING_DUR + 6} />
    </Ground>
  );
};
