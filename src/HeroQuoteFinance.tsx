/**
 * HeroQuoteFinance — copy of HeroQuote pinned to the light paper-orange
 * palette (soft warm-white + burnt orange). Orange is the single signal:
 * the decorative quotation mark + the attribution rule. Quote text is ink,
 * attribution/context are muted mono. HeroQuote.tsx stays the cream reference.
 */
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { geistMonoFamily, serifFontFamily, Grain, PaperBackground, SmartImg, WorldStateSchema, PALETTES, type Palette } from "./shared";

// Pinned to the light paper-orange palette (warm-white + burnt orange).
const P: Palette = PALETTES.paperOrange;

export const HeroQuoteFinancePropsSchema = z.object({
  quote: z.string().optional().default('"I am not a diver."'), attribution: z.string().optional().default("Luis Suárez"), context: z.string().optional().default(""), playerImage: z.string().optional().default("suarez.jpg"), accentColor: z.string().optional().default("#E8623A"), bgColor: z.string().optional().default("#F7F4EE"),
  skipIntro:  z.boolean().optional().default(false),
  worldState: WorldStateSchema.optional(),
});
export type HeroQuoteFinanceProps = z.infer<typeof HeroQuoteFinancePropsSchema>;

export const HeroQuoteFinance: React.FC<HeroQuoteFinanceProps> = ({ quote, attribution, context, playerImage, accentColor, bgColor, skipIntro = false }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  const photoIn = skipIntro ? 1 : spring({ frame, fps, config: { damping: 22, stiffness: 50 }, delay: 0 });
  const quoteIn = skipIntro ? 1 : spring({ frame, fps, config: { damping: 28, stiffness: 55 }, delay: 14 });
  const attrIn  = skipIntro ? 1 : spring({ frame, fps, config: { damping: 28, stiffness: 55 }, delay: 28 });
  const hasPhoto = Boolean(playerImage);
  const accent = accentColor && accentColor !== "#C8102E" ? accentColor : P.accent;
  const paper = bgColor && bgColor !== "#f0ece4" ? bgColor : P.bg;

  return (
    <AbsoluteFill>
      <PaperBackground color={paper} />
      <div style={{ position: "absolute", right: 80, top: "10%", bottom: "10%", width: 5, background: accent, opacity: photoIn * 0.75, transform: `scaleY(${photoIn})`, transformOrigin: "bottom center", zIndex: 0 }} />
      {hasPhoto && (
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "46%", zIndex: 1, overflow: "hidden", opacity: interpolate(photoIn, [0, 1], [0, 0.75]), transform: `translateX(${interpolate(photoIn, [0, 1], [50, 0])}px)`, WebkitMaskImage: 'linear-gradient(to right, transparent, black 350px, black 85%, transparent)', maskImage: 'linear-gradient(to right, transparent, black 350px, black 85%, transparent)' }}>
          <SmartImg src={playerImage} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center", filter: "grayscale(100%) contrast(1.08)" }} />
        </div>
      )}
      {/* Faint warm edge vignette — depth without heavy black or white glow */}
      <div style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none", background: "radial-gradient(ellipse at center, transparent 62%, rgba(28,26,21,0.06) 100%)" }} />
      <div style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none", opacity: 0.45 }}><Grain /></div>
      <div style={{ position: "absolute", left: 110, zIndex: 10, right: hasPhoto ? "50%" : 110, top: 0, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "center", gap: 28 }}>
        <div style={{ fontFamily: serifFontFamily, fontSize: 160, fontWeight: 700, color: accent, lineHeight: 0.35, opacity: quoteIn * 0.5, userSelect: "none", pointerEvents: "none" }}>"</div>
        <div style={{ fontFamily: serifFontFamily, fontSize: 36, fontWeight: 400, fontStyle: "italic", color: P.ink, lineHeight: 1.5, opacity: quoteIn, transform: `translateY(${interpolate(quoteIn, [0, 1], [18, 0])}px)` }}>{quote}</div>
        <div style={{ opacity: attrIn, transform: `translateY(${interpolate(attrIn, [0, 1], [10, 0])}px)` }}>
          <div style={{ width: 44, height: 3, background: accent, borderRadius: 2, marginBottom: 12 }} />
          <div style={{ fontFamily: geistMonoFamily, fontSize: 18, fontWeight: 600, color: P.muted, letterSpacing: 1.2, textTransform: "uppercase" }}>{attribution}</div>
          {context && <div style={{ fontFamily: geistMonoFamily, fontSize: 14, fontWeight: 400, color: P.muted, marginTop: 6, letterSpacing: 0.4 }}>{context}</div>}
        </div>
      </div>
    </AbsoluteFill>
  );
};
