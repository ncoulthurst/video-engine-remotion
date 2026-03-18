/**
 * IntrcptChapterWord — Oversized chapter word with player cutouts and color blobs.
 */
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { serifFontFamily, Grain, PaperBackground, SmartImg } from "./shared";

export const IntrcptChapterWordPropsSchema = z.object({
  word: z.string().default("aesthetics."), player1Image: z.string().default("suarez.jpg"), player2Image: z.string().default("aguero.png"), blob1Color: z.string().default("#7C5CBF"), blob2Color: z.string().default("#D94F4F"), bgColor: z.string().default("#f0ece4"),
});
export type IntrcptChapterWordProps = z.infer<typeof IntrcptChapterWordPropsSchema>;

export const IntrcptChapterWord: React.FC<IntrcptChapterWordProps> = ({ word, player1Image, player2Image, blob1Color, blob2Color, bgColor }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  const blob1In = spring({ frame, fps, config: { damping: 22, stiffness: 55 }, delay: 0 });
  const blob2In = spring({ frame, fps, config: { damping: 22, stiffness: 55 }, delay: 5 });
  const p1In = spring({ frame, fps, config: { damping: 22, stiffness: 50 }, delay: 8 });
  const p2In = spring({ frame, fps, config: { damping: 22, stiffness: 50 }, delay: 8 });
  const wordIn = spring({ frame, fps, config: { damping: 28, stiffness: 60 }, delay: 18 });
  const BLOB_SIZE = 680;

  return (
    <AbsoluteFill>
      <PaperBackground color={bgColor} />
      <Grain />
      <div style={{ position: "absolute", left: -BLOB_SIZE * 0.25, bottom: -BLOB_SIZE * 0.18, width: BLOB_SIZE, height: BLOB_SIZE, borderRadius: "50%", background: blob1Color, opacity: blob1In, transform: `scale(${interpolate(blob1In, [0, 1], [0.6, 1])})`, transformOrigin: "center" }} />
      <div style={{ position: "absolute", right: -BLOB_SIZE * 0.25, bottom: -BLOB_SIZE * 0.18, width: BLOB_SIZE, height: BLOB_SIZE, borderRadius: "50%", background: blob2Color, opacity: blob2In, transform: `scale(${interpolate(blob2In, [0, 1], [0.6, 1])})`, transformOrigin: "center" }} />
      {player1Image && <div style={{ position: "absolute", left: 0, bottom: 0, width: "44%", height: "88%", opacity: p1In, transform: `translateX(${interpolate(p1In, [0, 1], [-40, 0])}px)` }}><SmartImg src={player1Image} style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "bottom center" }} /></div>}
      {player2Image && <div style={{ position: "absolute", right: 0, bottom: 0, width: "44%", height: "88%", opacity: p2In, transform: `translateX(${interpolate(p2In, [0, 1], [40, 0])}px)` }}><SmartImg src={player2Image} style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "bottom center" }} /></div>}
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", paddingBottom: "18%", pointerEvents: "none" }}>
        <div style={{ fontFamily: serifFontFamily, fontSize: 160, fontWeight: 900, color: "#111", letterSpacing: -4, lineHeight: 1, opacity: wordIn, transform: `scale(${interpolate(wordIn, [0, 1], [0.9, 1])}) translateY(${interpolate(wordIn, [0, 1], [12, 0])}px)` }}>{word}</div>
      </div>
    </AbsoluteFill>
  );
};
