/**
 * IntrcptTransferRecord — Transfer fee timeline as animated horizontal bars.
 * Updated: Improved layering, soft gradient masking, and scaled layout.
 */
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { fontFamily, serifFontFamily, Grain, PaperBackground, COLORS, SmartImg } from "./shared";

const TransferSchema = z.object({ year: z.string().optional().default(""), player: z.string().optional().default(""), fromClub: z.string().optional().default(""), toClub: z.string().optional().default(""), fee: z.string().optional().default(""), feeValue: z.number(), highlight: z.boolean().default(false) });
export const IntrcptTransferRecordPropsSchema = z.object({
  title: z.string().optional().default("world record transfer fees"), subtitle: z.string().optional().default(""), sideImage: z.string().optional().default(""), accentColor: z.string().optional().default("#C9A84C"), transfers: z.array(TransferSchema).default([ { year: "2017", player: "Neymar", fromClub: "Barcelona", toClub: "PSG", fee: "£198m", feeValue: 198, highlight: true } ]), bgColor: z.string().optional().default("#f0ece4"),
});
export type IntrcptTransferRecordProps = z.infer<typeof IntrcptTransferRecordPropsSchema>;

const ROW_START = 18; const ROW_STAGGER = 10;

export const IntrcptTransferRecord: React.FC<IntrcptTransferRecordProps> = ({ title, subtitle, sideImage, accentColor, transfers, bgColor }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  const maxFee = Math.max(...transfers.map(t => t.feeValue));
  const headerProg = spring({ frame, fps, config: { damping: 28, stiffness: 55 } });
  const imageProg = spring({ frame, fps, config: { damping: 24, stiffness: 50 }, delay: 6 });
  const BAR_MAX_W = sideImage ? 520 : 1000;

  return (
    <AbsoluteFill>
      <PaperBackground color={bgColor} />
      {sideImage && (
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 900, opacity: interpolate(imageProg, [0, 1], [0, 0.75]), transform: `translateX(${interpolate(imageProg, [0, 1], [100, 0])}px)`, WebkitMaskImage: 'linear-gradient(to right, transparent, black 350px, black 85%, transparent)', maskImage: 'linear-gradient(to right, transparent, black 350px, black 85%, transparent)', zIndex: 1 }}>
          <SmartImg src={sideImage} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center", filter: "contrast(1.05) brightness(1.05)" }} />
        </div>
      )}
      <div style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none" }}><Grain /></div>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 140px", maxWidth: sideImage ? 1100 : 1920, zIndex: 10 }}>
        <div style={{ opacity: headerProg, transform: `translateY(${interpolate(headerProg, [0, 1], [-20, 0])}px)`, marginBottom: 60 }}>
          <div style={{ fontFamily: serifFontFamily, fontSize: 72, fontWeight: 900, color: COLORS.primary, letterSpacing: -3, lineHeight: 1 }}>{title}</div>
          {subtitle && <div style={{ fontFamily, fontSize: 20, fontWeight: 500, color: COLORS.muted, letterSpacing: 0.5, marginTop: 12 }}>{subtitle}</div>}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {transfers.map((t, i) => {
            const prog = spring({ frame: frame - (ROW_START + i * ROW_STAGGER), fps, config: { damping: 24, stiffness: 60 } });
            const opacity = interpolate(prog, [0, 0.4], [0, 1], { extrapolateRight: "clamp" });
            const barW = interpolate(prog, [0, 1], [0, (t.feeValue / maxFee) * BAR_MAX_W], { extrapolateRight: "clamp" });
            const color = t.highlight ? accentColor : COLORS.primary;
            return (
              <div key={i} style={{ opacity, display: "flex", alignItems: "center", height: 90, borderBottom: i < transfers.length - 1 ? "1px solid rgba(0,0,0,0.06)" : "none" }}>
                <div style={{ width: 80, fontFamily, fontSize: 18, fontWeight: 800, color: COLORS.muted, letterSpacing: 0.5, flexShrink: 0 }}>{t.year}</div>
                <div style={{ width: sideImage ? 360 : 440, flexShrink: 0, paddingRight: 24 }}>
                  <div style={{ fontFamily: serifFontFamily, fontSize: t.highlight ? 34 : 28, fontWeight: 900, color, letterSpacing: -0.5, lineHeight: 1.1 }}>{t.player}</div>
                  {(t.fromClub || t.toClub) && <div style={{ fontFamily, fontSize: 16, fontWeight: 600, color: COLORS.muted, marginTop: 4 }}>{t.fromClub && t.toClub ? `${t.fromClub} → ${t.toClub}` : t.fromClub || t.toClub}</div>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 20, flex: 1 }}>
                  <div style={{ width: barW, height: t.highlight ? 16 : 8, borderRadius: 8, backgroundColor: color, opacity: t.highlight ? 1 : 0.45 }} />
                  <span style={{ fontFamily, fontSize: t.highlight ? 32 : 26, fontWeight: 900, color, letterSpacing: -0.5, whiteSpace: "nowrap" }}>{t.fee}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
