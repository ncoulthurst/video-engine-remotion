/**
 * VoiceWaveformLive — a live-audio-style waveform capsule (mic → bars →
 * submit), ported from an OSS "AI chat input" demo into the house palette.
 *
 * Frame-deterministic (mulberry32-seeded) value noise drives the synthetic
 * "speak → pause → speak" envelope so the fallback reads as live audio, not a
 * canned loop — kept as an exact port. When the engine has REAL narration
 * loudness (an `amplitudes[]` array derived upstream from ElevenLabs audio),
 * the bars sample that directly instead — same right-to-left scroll, same
 * visual language, real signal driving the motion.
 *
 * Deliberately renders on its own (not wrapped in <Ground>) so it CAN double
 * as a floating overlay element on top of other footage/graphics — but every
 * colour still resolves from the kit's theme system, never a hardcoded white.
 * Defaults to an opaque themed backdrop (`transparentBg: false`) since that's
 * what every other composition in this kit does and what a standalone
 * preview/export needs — the glass capsule's `backdropFilter: blur()` has
 * nothing to blur against a truly transparent root, so on its own it read as
 * "floating on a void." Pass `transparentBg: true` only when compositing
 * this over other footage in a sequence.
 */
import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  resolveTheme,
  useOutro,
  Kicker,
  rgbaOf,
  lift,
  SHADOW,
  TYPE,
  SPACE,
  baseTemplateSchema,
  type BaseTemplateProps,
} from "./lib/kit";

// ── frame-deterministic value noise (mulberry32) — exact port. This is what
// makes the fallback waveform read as live audio rather than a repeating loop. ──
const mulberry32 = (a: number) => () => {
  let t = (a += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const noiseAt = (x: number) => {
  const i = Math.floor(x);
  const fr = x - i;
  const a = mulberry32(i * 7919 + 13)();
  const b = mulberry32((i + 1) * 7919 + 13)();
  const s = fr * fr * (3 - 2 * fr);
  return a + (b - a) * s;
};

/** synthetic speak→pause→speak loudness envelope — the fallback when no real amplitudes are given. */
const envelope = (t: number) => {
  const seg = (a: number, b: number, rise = 5, fall = 7) =>
    interpolate(t, [a, a + rise, b - fall, b], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const talk = Math.max(seg(15, 57), seg(80, 124));
  const syllable = 0.55 + 0.45 * noiseAt(t / 4.5 + 200);
  return talk * syllable;
};

/** linear-sample a real amplitude array at a fractional frame position (0 outside range). */
function sampleAmplitudes(arr: number[], tt: number): number {
  if (tt < 0 || arr.length === 0) return 0;
  const i0 = Math.floor(tt);
  const i1 = i0 + 1;
  const frac = tt - i0;
  const a = arr[i0] ?? arr[arr.length - 1] ?? 0;
  const b = arr[i1] ?? a;
  return a + (b - a) * frac;
}

const N_BARS = 64;
const SCROLL = 1.6;

export const VoiceWaveformLivePropsSchema = z.object({
  ...baseTemplateSchema,
  /** real per-frame loudness (0–1), e.g. derived upstream from ElevenLabs
   *  narration audio. When present, bars are driven by this instead of the
   *  synthetic envelope. */
  amplitudes: z.array(z.number()).optional(),
  /** optional caption above the capsule. */
  label: z.string().optional(),
  /** frame at which the submit button presses + the capsule collapses. */
  submitAtFrame: z.number().optional().default(126),
  showSubmitButton: z.boolean().optional().default(true),
  /** true = fully transparent root, for compositing over other footage in a
   *  sequence. false (default) = an opaque themed backdrop, so the capsule
   *  reads correctly on its own instead of floating on a void. */
  transparentBg: z.boolean().optional().default(false),
  ground: z.enum(["paper", "ink", "structure"]).optional().default("ink"),
});
export type VoiceWaveformLiveProps = z.input<typeof VoiceWaveformLivePropsSchema> & BaseTemplateProps;

export const VoiceWaveformLive: React.FC<VoiceWaveformLiveProps> = ({
  amplitudes,
  label,
  submitAtFrame = 126,
  showSubmitButton = true,
  transparentBg = false,
  ground = "ink",
  accentColor,
  skipIntro,
  animateOut,
}) => {
  const frame = useCurrentFrame();
  const t = resolveTheme(ground, accentColor);
  const outro = useOutro(animateOut);
  const live = !!amplitudes && amplitudes.length > 0;

  const submitted = frame >= submitAtFrame;
  const btnPress = interpolate(frame, [submitAtFrame, submitAtFrame + 3, submitAtFrame + 9], [1, 0.82, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.ease),
  });
  const collapse = interpolate(frame, [submitAtFrame, submitAtFrame + 12], [1, 0.06], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.ease),
  });
  const capsuleScale = interpolate(frame, [submitAtFrame, submitAtFrame + 20], [1, 0.96], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.ease),
  });
  const inOp = skipIntro
    ? 1
    : interpolate(frame, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.ease) });
  const inScale = skipIntro
    ? 1
    : interpolate(frame, [0, 14], [1.04, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });

  const sampleEnv = (tt: number) => (tt < 0 ? 0 : live ? Math.max(0, Math.min(1, sampleAmplitudes(amplitudes!, tt))) : envelope(tt));

  const bars = Array.from({ length: N_BARS }).map((_, i) => {
    const sampleT = frame - (N_BARS - 1 - i) * SCROLL;
    const env = sampleEnv(sampleT);
    const center = Math.pow(Math.sin((i / (N_BARS - 1)) * Math.PI), 0.8);
    // real data already carries organic variance — only add synthetic jitter for the fallback.
    const jitter = live ? 1 : 0.35 + 0.65 * noiseAt(sampleT * 1.7 + i * 0.13);
    const hRaw = env * center * jitter;
    return Math.max(5, hRaw * 235 * collapse);
  });

  const nowEnv = sampleEnv(frame);
  const micGlow = submitted ? 0 : nowEnv;

  const glowCol = t.highlight; // "listening" emphasis — the editorial signal colour
  const goCol = t.accent; // "submitted" — the structural go colour

  return (
    <AbsoluteFill style={{ background: transparentBg ? "transparent" : t.bg, overflow: "hidden", fontFamily: TYPE.sans, ...outro }}>
      {/* ambient key-light, derived from the ground hue — never a foreign-coloured blob */}
      <div
        style={{
          position: "absolute",
          left: -300,
          top: -200,
          width: 2600,
          height: 1700,
          background: `radial-gradient(closest-side, ${rgbaOf(t.ink, 0.1)}, rgba(0,0,0,0) 70%)`,
          transform: `translate(${frame * 0.6}px, ${frame * 0.25}px)`,
        }}
      />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: SPACE[6] }}>
          {label && (
            <div style={{ opacity: inOp }}>
              <Kicker label={label} theme={t} frame={frame} align="center" />
            </div>
          )}
          <div
            style={{
              width: 1320,
              height: 300,
              borderRadius: 150,
              opacity: inOp,
              transform: `scale(${inScale * capsuleScale})`,
              background: `linear-gradient(180deg, ${rgbaOf(t.ink, 0.5)}, ${rgbaOf(t.ink, 0.08)} 40%, ${lift(t.bg, -0.6, 0.3)})`,
              padding: 2.5,
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                borderRadius: 148,
                background: rgbaOf(t.bg, 0.72),
                backdropFilter: "blur(24px)",
                boxShadow: `inset 0 1px 0 ${rgbaOf(t.ink, 0.1)}, ${SHADOW.cardInk}`,
                display: "flex",
                alignItems: "center",
                gap: 36,
                padding: "0 44px",
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 48,
                  flexShrink: 0,
                  background: rgbaOf(t.ink, 0.08 + micGlow * 0.14),
                  border: `2.5px solid ${rgbaOf(t.ink, 0.28)}`,
                  boxShadow: `0 0 ${28 * micGlow}px ${rgbaOf(glowCol, micGlow * 0.55)}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxSizing: "border-box",
                }}
              >
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.55 + micGlow * 0.45 }}>
                  <rect x="9" y="2" width="6" height="12" rx="3" fill={t.ink} />
                  <path d="M5.5 11a6.5 6.5 0 0 0 13 0" stroke={t.ink} strokeWidth={2} strokeLinecap="round" fill="none" />
                  <path d="M12 17.5v3.5M8.5 21h7" stroke={t.ink} strokeWidth={2} strokeLinecap="round" />
                </svg>
              </div>
              <div style={{ flex: 1, height: 244, display: "flex", alignItems: "center", gap: 6, overflow: "hidden" }}>
                {bars.map((h, i) => (
                  <div key={i} style={{ flex: 1, height: h, borderRadius: 4, background: rgbaOf(t.ink, 0.4 + (h / 235) * 0.6) }} />
                ))}
              </div>
              {showSubmitButton && (
                <div
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: 48,
                    flexShrink: 0,
                    background: rgbaOf(t.ink, submitted ? 1 : 0.92),
                    transform: `scale(${btnPress})`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: submitted ? `0 0 60px ${rgbaOf(goCol, 0.55)}` : SHADOW.pillInk,
                  }}
                >
                  <svg width="44" height="44" viewBox="0 0 24 24">
                    <path
                      d="M12 20V5M12 5l-6.5 6.5M12 5l6.5 6.5"
                      stroke={t.bg}
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </svg>
                </div>
              )}
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
