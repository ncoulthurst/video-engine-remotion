/**
 * HeroTransferRecordVault — copy of HeroTransferRecord pinned to the light
 * paper-orange palette (soft warm-white + burnt orange). The palette-aware
 * portrait treatment auto-switches to the light (grayscale) path via IS_DARK.
 * This is the editable variant; HeroTransferRecord.tsx stays the cream reference.
 */
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { fontFamily, serifFontFamily, geistMonoFamily, Grain, PaperBackground, SmartImg, WorldStateSchema, PALETTES, rgbaFromHex, hexToRgb, type Palette } from "./shared";

// Pinned to the light paper-orange palette (warm-white + burnt orange).
const PAL: Palette = PALETTES.paperOrange;

const PORTRAIT_MASK = "linear-gradient(to right, transparent 3%, black 44%)";

const TransferSchema = z.object({ year: z.string().optional().default(""), player: z.string().optional().default(""), fromClub: z.string().optional().default(""), toClub: z.string().optional().default(""), fee: z.string().optional().default(""), feeValue: z.number(), highlight: z.boolean().default(false), accentColor: z.string().optional() });
export const HeroTransferRecordVaultPropsSchema = z.object({
  title: z.string().optional().default("world record transfer fees"), titleSize: z.number().optional().default(74), subtitle: z.string().optional().default(""), sideImage: z.string().optional().default(""), accentColor: z.string().optional(), transfers: z.array(TransferSchema).default([ { year: "2017", player: "Neymar", fromClub: "Barcelona", toClub: "PSG", fee: "£198m", feeValue: 198, highlight: true } ]), bgColor: z.string().optional(),
  worldState: WorldStateSchema.optional(),
  skipIntro: z.boolean().optional().default(false),
});
export type HeroTransferRecordVaultProps = z.infer<typeof HeroTransferRecordVaultPropsSchema>;

const ROW_START = 18; const ROW_STAGGER = 10;
const ROW_H = 96;

const INK       = PAL.ink;
const SECONDARY = rgbaFromHex(PAL.ink, 0.66);
const FAINT     = PAL.muted;
const BAR_SOFT  = rgbaFromHex(PAL.ink, 0.20);
const HAIRLINE  = PAL.line;
const ACCENT    = PAL.accent;
const BG_LUM    = (() => { const [r, g, b] = hexToRgb(PAL.bg); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; })();
const IS_DARK   = BG_LUM < 0.4;

export const HeroTransferRecordVault: React.FC<HeroTransferRecordVaultProps> = ({ title, titleSize = 74, subtitle, sideImage, accentColor, transfers, bgColor, skipIntro = false }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  const maxFee = Math.max(1, ...transfers.map(t => t.feeValue || 0));
  const headerProg = skipIntro ? 1 : spring({ frame, fps, config: { damping: 28, stiffness: 55 } });
  const imageProg  = skipIntro ? 1 : spring({ frame, fps, config: { damping: 24, stiffness: 50 }, delay: 6 });
  const BAR_MAX_W = sideImage ? 360 : 760;
  const accent = accentColor && accentColor !== "#000000" ? accentColor : ACCENT;
  const paper = bgColor || PAL.bg;

  return (
    <AbsoluteFill>
      <PaperBackground color={paper} />

      {sideImage && (
        <div style={{ position: "absolute", right: 0, top: 0, width: 900, height: "100%", opacity: interpolate(imageProg, [0, 1], [0, IS_DARK ? 0.92 : 0.88]), transform: `translateX(${interpolate(imageProg, [0, 1], [80, 0])}px)`, WebkitMaskImage: PORTRAIT_MASK, maskImage: PORTRAIT_MASK, zIndex: 1 }}>
          {/* Palette-aware duotone: shadows→surface (screen), highlights→muted (multiply),
              faint accent kiss. Maps the whole photo into the palette tones. */}
          <div style={{ position: "absolute", inset: 0, isolation: "isolate" }}>
            <SmartImg src={sideImage} style={{ width: "100%", height: "110%", objectFit: "cover", objectPosition: "top center", filter: IS_DARK ? "grayscale(1) contrast(1.42) brightness(1.06)" : "grayscale(1) contrast(1.16) brightness(0.95)", display: "block" }} />
            {IS_DARK && <>
              <div style={{ position: "absolute", inset: 0, mixBlendMode: "screen", background: PAL.surface, pointerEvents: "none" }} />
              <div style={{ position: "absolute", inset: 0, mixBlendMode: "multiply", background: PAL.muted, pointerEvents: "none" }} />
              <div style={{ position: "absolute", inset: 0, mixBlendMode: "soft-light", background: accent, opacity: 0.18, pointerEvents: "none" }} />
            </>}
          </div>
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 380, background: `linear-gradient(to top, ${paper} 0%, ${paper} 14%, transparent 100%)`, pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 80, background: `linear-gradient(to bottom, ${paper} 0%, transparent 100%)`, pointerEvents: "none" }} />
        </div>
      )}

      <div style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none", opacity: 0.45 }}><Grain /></div>

      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 150px", maxWidth: sideImage ? 1180 : 1920, zIndex: 10 }}>
        <div style={{ opacity: headerProg, transform: `translateY(${interpolate(headerProg, [0, 1], [-20, 0])}px)`, marginBottom: 64 }}>
          <div style={{ fontFamily: serifFontFamily, fontSize: titleSize, fontWeight: 900, color: INK, letterSpacing: -2.5, lineHeight: 1.02 }}>{title}</div>
          {subtitle && <div style={{ fontFamily, fontSize: 18, fontWeight: 500, color: FAINT, letterSpacing: 0.4, marginTop: 14 }}>{subtitle}</div>}
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {transfers.map((t, i) => {
            const prog = skipIntro ? 1 : spring({ frame: frame - (ROW_START + i * ROW_STAGGER), fps, config: { damping: 24, stiffness: 60 } });
            const opacity = interpolate(prog, [0, 0.4], [0, 1], { extrapolateRight: "clamp" });
            const rowShift = interpolate(prog, [0, 1], [26, 0], { extrapolateRight: "clamp" });
            const featured = t.highlight;
            const barW = interpolate(prog, [0, 1], [0, (t.feeValue / maxFee) * BAR_MAX_W], { extrapolateRight: "clamp" });
            const rowAccent  = t.accentColor || (featured ? accent : BAR_SOFT);
            const nameColor  = featured ? INK : SECONDARY;
            const valueColor = featured ? INK : FAINT;

            return (
              <div key={i} style={{ position: "relative", opacity, transform: `translateY(${rowShift}px)`, display: "flex", alignItems: "center", height: ROW_H, borderBottom: i < transfers.length - 1 ? `1px solid ${HAIRLINE}` : "none" }}>
                <div style={{ position: "absolute", left: -30, top: "50%", transform: "translateY(-50%)", width: 4, height: featured ? 54 : 40, background: rowAccent, borderRadius: 2 }} />

                <div style={{ width: 68, flexShrink: 0, fontFamily, fontSize: 15, fontWeight: 600, color: FAINT, letterSpacing: 0.8 }}>{t.year}</div>

                <div style={{ width: 400, flexShrink: 0, paddingRight: 28 }}>
                  {featured && <div style={{ fontFamily: serifFontFamily, fontStyle: "italic", fontSize: 19, fontWeight: 500, color: INK, letterSpacing: 0.2, marginBottom: 3 }}>Largest position</div>}
                  <div style={{ fontFamily: serifFontFamily, fontSize: featured ? 40 : 28, fontWeight: featured ? 900 : 700, color: nameColor, letterSpacing: -0.8, lineHeight: 1.05 }}>{t.player}</div>
                  {(t.fromClub || t.toClub) && <div style={{ fontFamily, fontSize: 15, fontWeight: 500, color: FAINT, marginTop: 5, letterSpacing: 0.2 }}>{t.fromClub && t.toClub ? `${t.fromClub} → ${t.toClub}` : t.fromClub || t.toClub}</div>}
                </div>

                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "flex-end", minWidth: 0, paddingRight: 22 }}>
                  <div style={{ width: barW, height: featured ? 12 : 6, borderRadius: 6, backgroundColor: rowAccent, opacity: featured ? 1 : 0.92 }} />
                </div>

                <div style={{ width: 160, flexShrink: 0, textAlign: "left", fontFamily: geistMonoFamily, fontSize: featured ? 36 : 24, fontWeight: featured ? 600 : 500, color: valueColor, letterSpacing: -0.5, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{t.fee}</div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
