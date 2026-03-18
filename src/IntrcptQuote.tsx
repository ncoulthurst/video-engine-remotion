/**
 * IntrcptQuote — Quote card with player photo.
 * Updated: Improved layering, masking, and background hero styling.
 */
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { fontFamily, serifFontFamily, Grain, PaperBackground, SmartImg } from "./shared";

export const IntrcptQuotePropsSchema = z.object({
  quote: z.string().default('"I am not a diver."'), attribution: z.string().default("Luis Suárez"), context: z.string().optional(), playerImage: z.string().default("suarez.jpg"), accentColor: z.string().default("#C8102E"), bgColor: z.string().default("#f0ece4"),
});
export type IntrcptQuoteProps = z.infer<typeof IntrcptQuotePropsSchema>;

export const IntrcptQuote: React.FC<IntrcptQuoteProps> = ({ quote, attribution, context, playerImage, accentColor, bgColor }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  const photoIn = spring({ frame, fps, config: { damping: 22, stiffness: 50 }, delay: 0 });
  const quoteIn = spring({ frame, fps, config: { damping: 28, stiffness: 55 }, delay: 14 });
  const attrIn = spring({ frame, fps, config: { damping: 28, stiffness: 55 }, delay: 28 });
  const hasPhoto = Boolean(playerImage);

  return (
    <AbsoluteFill>
      <PaperBackground color={bgColor} />
      <div style={{ position: "absolute", right: 80, top: "10%", bottom: "10%", width: 5, background: accentColor, opacity: photoIn * 0.75, transform: `scaleY(${photoIn})`, transformOrigin: "bottom center", zIndex: 0 }} />
      {hasPhoto && (
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "46%", zIndex: 1, overflow: "hidden", opacity: interpolate(photoIn, [0, 1], [0, 0.75]), transform: `translateX(${interpolate(photoIn, [0, 1], [50, 0])}px)`, WebkitMaskImage: 'linear-gradient(to right, transparent, black 350px, black 85%, transparent)', maskImage: 'linear-gradient(to right, transparent, black 350px, black 85%, transparent)' }}>
          <SmartImg src={playerImage} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center", filter: "grayscale(100%) contrast(1.08)" }} />
        </div>
      )}
      <div style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none" }}><Grain /></div>
      <div style={{ position: "absolute", left: 110, zIndex: 10, right: hasPhoto ? "50%" : 110, top: 0, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "center", gap: 28 }}>
        <div style={{ fontFamily: serifFontFamily, fontSize: 160, fontWeight: 700, color: accentColor, lineHeight: 0.35, opacity: quoteIn * 0.5, userSelect: "none", pointerEvents: "none" }}>"</div>
        <div style={{ fontFamily: serifFontFamily, fontSize: 36, fontWeight: 400, fontStyle: "italic", color: "#111", lineHeight: 1.5, opacity: quoteIn, transform: `translateY(${interpolate(quoteIn, [0, 1], [18, 0])}px)` }}>{quote}</div>
        <div style={{ opacity: attrIn, transform: `translateY(${interpolate(attrIn, [0, 1], [10, 0])}px)` }}>
          <div style={{ fontFamily: serifFontFamily, fontSize: 20, fontWeight: 700, color: "#111", letterSpacing: 0.3 }}>{attribution}</div>
          {context && <div style={{ fontFamily, fontSize: 15, fontWeight: 400, color: "#888", marginTop: 5 }}>{context}</div>}
        </div>
      </div>
    </AbsoluteFill>
  );
};
