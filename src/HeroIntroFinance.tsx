/**
 * HeroIntroFinance — Cold-open title card, finance (BRAND blue) variant.
 *
 * Hierarchy is documentary-first: the VIDEO TITLE is the hero (typewriter
 * serif, ink cursor accent), the channel name is a small kicker above it.
 * `sideImage`, when present, is a full-bleed graded background plate (desat +
 * darkened + brand-blue scrim, slow push-in) — never a floating window.
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { fontFamily, serifFontFamily, Grain, PALETTES, PaperBackground, SmartImg, WorldStateSchema } from "./shared";

// ── Colours: the deep-blue BRAND ground (matches finance/kit.tsx v4 pivot) ────
const P = PALETTES.paperOrange; // burnt-orange accent (the cursor marker) still sourced here
const BRAND_BG   = "#0A4AA0";
const BRAND_INK  = "#F5F5F3";
const BRAND_MUTE = "rgba(245,245,243,0.60)";
// Dark ground → depth is a subtle deep vignette (never white glow).
const VIGNETTE = "radial-gradient(125% 125% at 50% 42%, transparent 55%, rgba(0,0,0,0.28) 100%)";
// Brand-tinted scrim so the title always reads over a photographic plate.
const IMAGE_SCRIM = "linear-gradient(180deg, rgba(5,26,58,0.62) 0%, rgba(5,26,58,0.78) 100%)";

const CHANNEL_NAME = "friction.";

export const HeroIntroFinancePropsSchema = z.object({
  subtitle:       z.string().optional().default("the science of football"),
  bgColor:        z.string().optional().default(BRAND_BG),
  sideImage:      z.string().optional(),
  /** Background-plate framing: X/Y are objectPosition percentages (50/50 =
   *  centred), scale multiplies the base push-in. */
  sideImageX:     z.number().optional().default(50),
  sideImageY:     z.number().optional().default(50),
  sideImageScale: z.number().optional().default(1),
  skipIntro:      z.boolean().optional().default(false),
  worldState:     WorldStateSchema.optional(),
});
export type HeroIntroFinanceProps = z.infer<typeof HeroIntroFinancePropsSchema>;

const KICKER_FPC        = 3;   // channel name types slower — it's a signature, not a race
const KICKER_START      = 10;
const PAUSE_AFTER_KICKER = 18; // beat of silence before the title lands
const TITLE_FPC         = 2;

// ── Component ─────────────────────────────────────────────────────────────────
export const HeroIntroFinance: React.FC<HeroIntroFinanceProps> = ({
  subtitle,
  bgColor,
  sideImage,
  sideImageX     = 50,
  sideImageY     = 50,
  sideImageScale = 1,
  skipIntro      = false,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const kicker = CHANNEL_NAME.replace(/\.$/, "");
  const title  = subtitle || "";

  // Sequence: kicker typewrites → pause → title typewrites.
  const kickerChars   = skipIntro ? kicker.length : Math.max(0, Math.floor((frame - KICKER_START) / KICKER_FPC));
  const kickerDone    = kickerChars >= kicker.length;
  const visibleKicker = kicker.slice(0, kickerChars);
  const kickerDoneAt  = KICKER_START + kicker.length * KICKER_FPC;
  const titleStart    = kickerDoneAt + PAUSE_AFTER_KICKER;

  const charsVisible = skipIntro ? title.length : Math.max(0, Math.floor((frame - titleStart) / TITLE_FPC));
  const titleDone    = charsVisible >= title.length;
  const visibleTitle = title.slice(0, charsVisible);
  const cursorBlink  = Math.floor(frame / 14) % 2 === 0;
  // ONE cursor — it sits with the kicker while that types (and through the
  // pause), then jumps to the title line.
  const kickerCursorOn = !skipIntro && frame < titleStart;
  const titleCursorOn  = !skipIntro && frame >= titleStart && (!titleDone || cursorBlink);

  // Long documentary titles wrap — scale the serif down with length.
  const titleSize = title.length <= 18 ? 104 : title.length <= 30 ? 86 : 72;

  // Slow push-in keeps the photographic plate alive without drawing the eye.
  const imageScale = interpolate(frame, [0, Math.max(1, durationInFrames)], [1.05, 1.12]) * sideImageScale;

  return (
    <AbsoluteFill>
      <PaperBackground color={bgColor} />

      {sideImage && (
        <>
          <AbsoluteFill style={{ overflow: "hidden", pointerEvents: "none" }}>
            <SmartImg
              src={sideImage}
              style={{
                width: "100%", height: "100%",
                objectFit: "cover",
                objectPosition: `${sideImageX}% ${sideImageY}%`,
                transform: `scale(${imageScale})`,
                filter: "saturate(0.5) brightness(0.6) contrast(1.06)",
              }}
            />
          </AbsoluteFill>
          <AbsoluteFill style={{ background: IMAGE_SCRIM, pointerEvents: "none" }} />
        </>
      )}

      <AbsoluteFill style={{ background: VIGNETTE, pointerEvents: "none" }} />
      <Grain />

      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 28, pointerEvents: "none" }}>
        {/* Channel kicker — types first, above the title */}
        <div style={{ display: "flex", alignItems: "center", minHeight: "1.5em" }}>
          <div style={{ fontFamily, fontSize: 21, fontWeight: 600, color: BRAND_MUTE, letterSpacing: 5, textTransform: "uppercase", minHeight: "1.2em" }}>
            {visibleKicker}
            {kickerCursorOn && <span style={{ display: "inline-block", width: 2, backgroundColor: P.accent, marginLeft: 3, verticalAlign: "middle", height: "1.05em", position: "relative", top: "-0.05em", opacity: kickerDone && !cursorBlink ? 0 : 1 }} />}
          </div>
        </div>

        {/* The documentary title is the hero */}
        <div style={{ fontFamily: serifFontFamily, fontSize: titleSize, fontWeight: 900, color: BRAND_INK, letterSpacing: -2, lineHeight: 1.08, minHeight: "1.1em", maxWidth: 1360, textAlign: "center" }}>
          {visibleTitle}
          {titleCursorOn && <span style={{ display: "inline-block", width: "0.06em", backgroundColor: P.accent, marginLeft: "0.04em", verticalAlign: "middle", height: "0.88em", position: "relative", top: "-0.04em" }} />}
        </div>
      </div>
    </AbsoluteFill>
  );
};
