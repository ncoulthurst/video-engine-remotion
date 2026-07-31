/**
 * OdometerDigitRoll — a giant number where each digit is an independent
 * vertical slot-reel that spins fast then decelerates and locks on its target
 * digit, staggered left→right (later digits keep spinning after earlier ones
 * lock), with speed-gated blurred ghost copies during the fast spin and a
 * single ink-pulse flash across the whole number once every digit has
 * settled, followed by a caption/label.
 *
 * Ported from an external OSS Remotion template pack ("video-shotcraft") into
 * this project's own visual language — kit tokens only, no local hex/font/
 * spacing. This is a DIFFERENT, more elaborate mechanism than
 * AnimatedCounter/countUp (mechanical slot-reel digits vs a simple count-up)
 * and is kept as its own primitive rather than folded into those.
 */
import React from "react";
import { useCurrentFrame, interpolate, interpolateColors } from "remotion";
import { z } from "zod";
import {
  Ground,
  Kicker,
  SourceTag,
  resolveTheme,
  useOutro,
  wipe,
  EASE,
  TYPE,
  SPACE,
  baseTemplateSchema,
  type BaseTemplateProps,
} from "./lib/kit";

export const OdometerDigitRollPropsSchema = z.object({
  ...baseTemplateSchema,
  /** The figure to roll to, e.g. "27.04.2026", "1,204", "87%". Digit characters
   *  (0-9) become rolling reel slots; everything else (., %, comma, currency
   *  signs, letters, spaces) becomes a static glyph that doesn't roll. */
  value: z.string().optional().default("27.04.2026"),
  /** Optional caption below the number/reveal text. */
  label: z.string().optional().default(""),
  /** Text the reeled number morphs into on the settle flash, e.g.
   *  "27th April 2026". If omitted and `value` looks like a DD.MM.YYYY date,
   *  it's derived automatically; otherwise the reel just holds (no morph). */
  revealText: z.string().optional(),
  ground: z.enum(["paper", "ink", "structure"]).optional().default("structure"),
});
export type OdometerDigitRollProps = z.input<typeof OdometerDigitRollPropsSchema> & BaseTemplateProps;

// ── Reel geometry — derived from the kit's hero type scale, not a magic number ──
const ROW = TYPE.hero; // 210 — one reel row height = the hero figure size
const FS = ROW - 20; // digit glyph size sits just under the row
const DW = Math.round(ROW * 0.6); // reel column width
const SPIN = 0.85; // reel travel per frame at full spin (rows/frame)

// settle-flash timing — was an 8-frame blip (in/out only, no hold), which read
// as "not on screen long enough"; now ramps in, holds at peak, ramps out.
const FLASH_IN = 5;
const FLASH_HOLD = 10;
const FLASH_OUT = 15;

/** Deceleration-start frame for the i-th digit reel (later digits spin longer). */
const startOf = (i: number) => 20 + i * 7;

/**
 * Frame-deterministic reel position for digit reel `i`, target digit `d`.
 * Spins at constant speed, then decelerates with a slight overshoot past the
 * target before settling back — never a plain linear stop.
 */
function posAt(f: number, i: number, d: number): number {
  const s = startOf(i);
  const p0 = SPIN * s;
  const T = Math.ceil((p0 + 6 - d) / 10) * 10 + d;
  if (f < s) return SPIN * Math.max(f, 0);
  if (f < s + 16) {
    return interpolate(f, [s, s + 16], [p0, T + 0.5], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASE.out,
    });
  }
  if (f < s + 22) {
    return interpolate(f, [s + 16, s + 22], [T + 0.5, T], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASE.out,
    });
  }
  return T;
}

const Strip: React.FC<{ pos: number; color: string; opacity?: number; dy?: number }> = ({
  pos,
  color,
  opacity = 1,
  dy = 0,
}) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      top: 0,
      width: DW,
      transform: `translateY(${-(pos % 10) * ROW + dy}px)`,
      opacity,
    }}
  >
    {Array.from({ length: 20 }).map((_, k) => (
      <div
        key={k}
        style={{
          width: DW,
          height: ROW,
          lineHeight: `${ROW}px`,
          textAlign: "center",
          fontFamily: TYPE.sans,
          fontSize: FS,
          fontWeight: TYPE.weight.heavy,
          fontVariantNumeric: "tabular-nums",
          color,
        }}
      >
        {k % 10}
      </div>
    ))}
  </div>
);

/** One slot-reel: the settled digit + two speed-gated blurred ghost copies while spinning fast. */
const DigitReel: React.FC<{ frame: number; i: number; digit: number; color: string; skip?: boolean }> = ({
  frame,
  i,
  digit,
  color,
  skip = false,
}) => {
  const pos = skip ? digit : posAt(frame, i, digit);
  const speed = skip ? 0 : Math.abs(pos - posAt(frame - 1, i, digit));
  const gate = interpolate(speed, [0.06, 0.5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "relative", width: DW, height: ROW, overflow: "hidden" }}>
      {gate > 0.001 && (
        <>
          <Strip pos={pos} color={color} opacity={0.25 * gate} dy={ROW * 0.5} />
          <Strip pos={pos} color={color} opacity={0.12 * gate} dy={-ROW * 0.5} />
        </>
      )}
      <Strip pos={pos} color={color} />
    </div>
  );
};

/** A non-rolling character (., %, comma, letters, spaces…) that shares the reel's baseline. */
const StaticGlyph: React.FC<{ ch: string; color: string; w?: number }> = ({ ch, color, w }) => (
  <div
    style={{
      width: w,
      height: ROW,
      lineHeight: `${ROW}px`,
      textAlign: "center",
      fontFamily: TYPE.sans,
      fontSize: FS,
      fontWeight: TYPE.weight.heavy,
      fontVariantNumeric: "tabular-nums",
      color,
      whiteSpace: "pre",
    }}
  >
    {ch === " " ? " " : ch}
  </div>
);

// ── date-string → written-form morph (e.g. "27.04.2026" → "27th April 2026") ──
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
function ordinal(n: number): string {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  switch (n % 10) {
    case 1: return `${n}st`;
    case 2: return `${n}nd`;
    case 3: return `${n}rd`;
    default: return `${n}th`;
  }
}
function tryFormatDateWritten(value: string): string | null {
  const m = value.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (!m) return null;
  const day = parseInt(m[1], 10);
  const month = parseInt(m[2], 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${ordinal(day)} ${MONTH_NAMES[month - 1]} ${m[3]}`;
}

type Glyph = { type: "digit"; digit: number; i: number } | { type: "static"; ch: string };

/** Parse `value` into an ordered sequence of rolling digit reels + static glyphs. */
function parseGlyphs(value: string): Glyph[] {
  const glyphs: Glyph[] = [];
  let i = 0;
  for (const ch of value) {
    if (ch >= "0" && ch <= "9") {
      glyphs.push({ type: "digit", digit: Number(ch), i });
      i += 1;
    } else {
      glyphs.push({ type: "static", ch });
    }
  }
  return glyphs;
}

export const OdometerDigitRoll: React.FC<OdometerDigitRollProps> = ({
  value = "27.04.2026",
  label = "",
  revealText,
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

  const glyphs = React.useMemo(() => parseGlyphs(value), [value]);
  const digitCount = glyphs.filter((g) => g.type === "digit").length;
  // Every reel's deceleration completes at startOf(i)+22, independent of its
  // target digit — the last reel (highest i) locks last.
  const settleAt = digitCount > 0 ? startOf(digitCount - 1) + 22 : 0;
  const pulseAt = skipIntro ? -20 : settleAt;

  // flash colour follows the graphic's own accent (so `accentColor` actually
  // has an effect), not the fixed editorial `highlight` — that was reading as
  // "hardcoded yellow" since resolveTheme() only takes a highlightColor override
  // this component never passes.
  const inkNow = skipIntro
    ? t.ink
    : interpolateColors(
        frame,
        [pulseAt, pulseAt + FLASH_IN, pulseAt + FLASH_IN + FLASH_HOLD, pulseAt + FLASH_IN + FLASH_HOLD + FLASH_OUT],
        [t.ink, t.accent, t.accent, t.ink],
      );
  const pulseScale = skipIntro
    ? 1
    : interpolate(
        frame,
        [pulseAt, pulseAt + FLASH_IN, pulseAt + FLASH_IN + FLASH_HOLD, pulseAt + FLASH_IN + FLASH_HOLD + FLASH_OUT],
        [1, 1.035, 1.035, 1],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.inOut },
      );
  const labelOp = skipIntro ? 1 : wipe(frame, { delay: d + pulseAt + 3, dur: 18 });

  const writtenLabel = revealText ?? tryFormatDateWritten(value);
  const MORPH_START = pulseAt + 2;
  const MORPH_END = pulseAt + 20;
  const morphT = !writtenLabel
    ? 0
    : skipIntro
      ? 1
      : interpolate(frame, [MORPH_START, MORPH_END], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: EASE.inOut,
        });
  const reelsOp = 1 - morphT;
  const reelsScale = 1 - 0.08 * morphT;
  const revealOp = morphT;
  const revealScale = 0.94 + 0.06 * morphT;

  return (
    <Ground ground={ground} accentColor={accentColor} skipIntro={skipIntro} focus={{ x: 0.5, y: 0.4 }}>
      <div style={{ height: "100%", display: "flex", flexDirection: "column", ...outro }}>
        {kicker && (
          <div style={{ position: "absolute", left: SPACE.page, top: SPACE[16] }}>
            <Kicker label={kicker} theme={t} frame={frame} delay={d} align="left" />
          </div>
        )}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `scale(${pulseScale})`,
            transformOrigin: "50% 50%",
            position: "relative",
          }}
        >
          {reelsOp > 0.001 && (
            <div style={{ display: "flex", opacity: reelsOp, transform: `scale(${reelsScale})` }}>
              {glyphs.map((g, k) =>
                g.type === "digit" ? (
                  <DigitReel key={k} frame={frame} i={g.i} digit={g.digit} color={inkNow} skip={skipIntro} />
                ) : (
                  <StaticGlyph
                    key={k}
                    ch={g.ch}
                    color={inkNow}
                    w={g.ch === "." || g.ch === "," ? DW * 0.56 : g.ch === " " ? DW * 0.32 : undefined}
                  />
                ),
              )}
            </div>
          )}
          {writtenLabel && revealOp > 0.001 && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: revealOp,
                transform: `scale(${revealScale})`,
                fontFamily: TYPE.sans,
                fontSize: FS, // match the reel digits' size, not the smaller TYPE.display
                fontWeight: TYPE.weight.heavy,
                letterSpacing: -1,
                color: inkNow,
                whiteSpace: "nowrap",
              }}
            >
              {writtenLabel}
            </div>
          )}
        </div>
        {label && (
          <div
            style={{
              textAlign: "center",
              fontFamily: TYPE.mono,
              fontSize: TYPE.label,
              fontWeight: TYPE.weight.semibold,
              letterSpacing: TYPE.track,
              textTransform: "uppercase",
              color: t.muted,
              opacity: labelOp,
              transform: `translateY(${interpolate(labelOp, [0, 1], [10, 0])}px)`,
              paddingBottom: SPACE[16],
            }}
          >
            {label}
          </div>
        )}
      </div>
      <SourceTag source={source} theme={t} frame={frame} delay={d + pulseAt + 10} />
    </Ground>
  );
};
