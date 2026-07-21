/**
 * HeroQuote — Quote card with player photo.
 * F3: composed from the shared kit (Ground/TYPE/prog) — no per-comp springs,
 * grain or hex text colours. Reveals accept narration beats (H1): the quote
 * lands on the "subject" beat, the attribution on the "entity" beat.
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { SmartImg, WorldStateSchema } from "./shared";
import { Ground, TYPE, EASE, prog, beatDelay, resolveTheme } from "./lib/kit";

export const HeroQuotePropsSchema = z.object({
  quote: z.string().optional().default('"I am not a diver."'), attribution: z.string().optional().default("Luis Suárez"), context: z.string().optional().default(""), playerImage: z.string().optional().default("suarez.jpg"), accentColor: z.string().optional().default("#C8102E"), bgColor: z.string().optional().default("#f0ece4"),
  skipIntro:  z.boolean().optional().default(false),
  beats:      z.record(z.string(), z.number()).optional(),
  worldState: WorldStateSchema.optional(),
});
export type HeroQuoteProps = z.infer<typeof HeroQuotePropsSchema>;

export const HeroQuote: React.FC<HeroQuoteProps> = ({ quote, attribution, context, playerImage, accentColor, bgColor, skipIntro = false, beats }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  const t = resolveTheme("paper", accentColor, bgColor);
  const photoIn = skipIntro ? 1 : prog(frame, 0, 20, EASE.snap);
  const quoteIn = skipIntro ? 1 : prog(frame, beatDelay(beats, "subject", fps, 14), 18, EASE.snap);
  const attrIn  = skipIntro ? 1 : prog(frame, beatDelay(beats, "entity", fps, 28), 18, EASE.snap);
  const hasPhoto = Boolean(playerImage);

  return (
    <Ground ground="paper" bgColor={bgColor} accentColor={accentColor} domain="football" texture skipIntro={skipIntro} pad={0} focus={{ x: 0.3, y: 0.45 }}>
      <div style={{ position: "absolute", right: 80, top: "10%", bottom: "10%", width: 5, background: t.accent, opacity: photoIn * 0.75, transform: `scaleY(${photoIn})`, transformOrigin: "bottom center", zIndex: 0 }} />
      {hasPhoto && (
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "46%", zIndex: 1, overflow: "hidden", opacity: interpolate(photoIn, [0, 1], [0, 0.75]), transform: `translateX(${interpolate(photoIn, [0, 1], [50, 0])}px)`, WebkitMaskImage: 'linear-gradient(to right, transparent, black 350px, black 85%, transparent)', maskImage: 'linear-gradient(to right, transparent, black 350px, black 85%, transparent)' }}>
          <SmartImg src={playerImage} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center", filter: "grayscale(100%) contrast(1.08)" }} />
        </div>
      )}
      <div style={{ position: "absolute", left: 110, zIndex: 10, right: hasPhoto ? "50%" : 110, top: 0, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "center", gap: 28 }}>
        <div style={{ fontFamily: TYPE.serif, fontSize: 160, fontWeight: 700, color: t.accent, lineHeight: 0.35, opacity: quoteIn * 0.5, userSelect: "none", pointerEvents: "none" }}>"</div>
        <div style={{ fontFamily: TYPE.serif, fontSize: 36, fontWeight: 400, fontStyle: "italic", color: t.ink, lineHeight: 1.5, opacity: quoteIn, transform: `translateY(${(1 - quoteIn) * 18}px)` }}>{quote}</div>
        <div style={{ opacity: attrIn, transform: `translateY(${(1 - attrIn) * 10}px)` }}>
          <div style={{ fontFamily: TYPE.serif, fontSize: 20, fontWeight: 700, color: t.ink, letterSpacing: 0.3 }}>{attribution}</div>
          {context && <div style={{ fontFamily: TYPE.mono, fontSize: 15, fontWeight: 400, color: t.muted, marginTop: 5, textTransform: "uppercase", letterSpacing: TYPE.track }}>{context}</div>}
        </div>
      </div>
    </Ground>
  );
};
