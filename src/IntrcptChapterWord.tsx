/**
 * IntrcptChapterWord — Oversized chapter word with two duotoned player cutouts.
 *
 * The word is the hero. Player images are duotoned to the blob colours (so they
 * read as part of the colour world, not raw photos), feathered into the canvas
 * via radial masks (no hard rectangles), and slowly Ken-Burns. The word punches
 * through the composition via mix-blend-mode "multiply" on paper.
 */
import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { fontFamily, serifFontFamily, Grain, PaperBackground, SmartImg, WorldStateSchema } from "./shared";

export const IntrcptChapterWordPropsSchema = z.object({
  word:         z.string().optional().default("aesthetics."),
  chapterLabel: z.string().optional().default("CHAPTER"),
  player1Image: z.string().optional().default("suarez.jpg"),
  player2Image: z.string().optional().default("aguero.png"),
  blob1Color:   z.string().optional().default("#7C5CBF"),
  blob2Color:   z.string().optional().default("#D94F4F"),
  bgColor:      z.string().optional().default(""),
  worldState:   WorldStateSchema.optional(),
  skipIntro:    z.boolean().optional().default(false),
});
export type IntrcptChapterWordProps = z.infer<typeof IntrcptChapterWordPropsSchema>;

const FEATHER_MASK_LEFT  = "radial-gradient(ellipse 75% 95% at 30% 70%, #000 50%, transparent 100%)";
const FEATHER_MASK_RIGHT = "radial-gradient(ellipse 75% 95% at 70% 70%, #000 50%, transparent 100%)";

export const IntrcptChapterWord: React.FC<IntrcptChapterWordProps> = ({
  word, chapterLabel, player1Image, player2Image, blob1Color, blob2Color, bgColor, skipIntro,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sf = (delay: number, cfg = { damping: 22, stiffness: 52 }) =>
    skipIntro ? 1 : spring({ frame: frame - delay, fps, config: cfg });

  const blob1In = sf(0,  { damping: 24, stiffness: 50 });
  const blob2In = sf(6,  { damping: 24, stiffness: 50 });
  const p1In    = sf(12);
  const p2In    = sf(16);
  const wordIn  = skipIntro ? 1 : interpolate(frame, [22, 60], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const labelIn = skipIntro ? 1 : interpolate(frame, [10, 28], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Slow Ken Burns — both images drift inward at slightly different rates
  const kenBurns = (delay: number, dir: 1 | -1) => {
    const t = Math.max(0, frame - delay);
    return {
      scale:      1 + (t / 600) * 0.08,
      translateX: dir * Math.min(20, t * 0.06),
    };
  };
  const kb1 = kenBurns(12, 1);
  const kb2 = kenBurns(16, -1);

  const BLOB_SIZE = 720;

  return (
    <AbsoluteFill>
      <PaperBackground color={bgColor || undefined} />

      {/* Chapter label — small caps top-left, sets editorial frame */}
      <div style={{
        position:      "absolute",
        top:           120,
        left:          140,
        fontFamily,
        fontSize:      13,
        fontWeight:    700,
        letterSpacing: 4,
        textTransform: "uppercase" as const,
        color:         "rgba(17,17,17,0.45)",
        opacity:       labelIn,
        transform:     `translateY(${interpolate(labelIn, [0, 1], [8, 0])}px)`,
      }}>{chapterLabel}</div>

      {/* Blob 1 — bottom-left */}
      <div style={{
        position:        "absolute",
        left:            -BLOB_SIZE * 0.22,
        bottom:          -BLOB_SIZE * 0.20,
        width:           BLOB_SIZE,
        height:          BLOB_SIZE,
        borderRadius:    "50%",
        background:      `radial-gradient(circle at 35% 35%, ${blob1Color}, ${blob1Color}cc 70%, ${blob1Color}66 100%)`,
        opacity:         blob1In * 0.85,
        transform:       `scale(${interpolate(blob1In, [0, 1], [0.6, 1])})`,
        transformOrigin: "center",
        filter:          "blur(2px)",
      }} />

      {/* Blob 2 — bottom-right */}
      <div style={{
        position:        "absolute",
        right:           -BLOB_SIZE * 0.22,
        bottom:          -BLOB_SIZE * 0.20,
        width:           BLOB_SIZE,
        height:          BLOB_SIZE,
        borderRadius:    "50%",
        background:      `radial-gradient(circle at 65% 35%, ${blob2Color}, ${blob2Color}cc 70%, ${blob2Color}66 100%)`,
        opacity:         blob2In * 0.85,
        transform:       `scale(${interpolate(blob2In, [0, 1], [0.6, 1])})`,
        transformOrigin: "center",
        filter:          "blur(2px)",
      }} />

      {/* Player 1 — duotoned + feathered, ken-burns drift */}
      {player1Image && (
        <div style={{
          position:        "absolute",
          left:            0,
          bottom:          0,
          width:           "46%",
          height:          "92%",
          opacity:         p1In,
          transform:       `translateX(${interpolate(p1In, [0, 1], [-40, kb1.translateX])}px) scale(${kb1.scale})`,
          transformOrigin: "bottom center",
          WebkitMaskImage: FEATHER_MASK_LEFT,
          maskImage:       FEATHER_MASK_LEFT,
          mixBlendMode:    "multiply",
        }}>
          <div style={{
            position: "absolute", inset: 0,
            background: `linear-gradient(180deg, ${blob1Color}66 0%, ${blob1Color}aa 70%, ${blob1Color} 100%)`,
            mixBlendMode: "color",
            zIndex: 2,
            pointerEvents: "none",
          }} />
          <SmartImg
            src={player1Image}
            style={{
              width:          "100%",
              height:         "100%",
              objectFit:      "contain",
              objectPosition: "bottom center",
              display:        "block",
              filter:         "grayscale(1) contrast(1.15) brightness(0.95)",
            }}
          />
        </div>
      )}

      {/* Player 2 — mirror */}
      {player2Image && (
        <div style={{
          position:        "absolute",
          right:           0,
          bottom:          0,
          width:           "46%",
          height:          "92%",
          opacity:         p2In,
          transform:       `translateX(${interpolate(p2In, [0, 1], [40, kb2.translateX])}px) scale(${kb2.scale})`,
          transformOrigin: "bottom center",
          WebkitMaskImage: FEATHER_MASK_RIGHT,
          maskImage:       FEATHER_MASK_RIGHT,
          mixBlendMode:    "multiply",
        }}>
          <div style={{
            position: "absolute", inset: 0,
            background: `linear-gradient(180deg, ${blob2Color}66 0%, ${blob2Color}aa 70%, ${blob2Color} 100%)`,
            mixBlendMode: "color",
            zIndex: 2,
            pointerEvents: "none",
          }} />
          <SmartImg
            src={player2Image}
            style={{
              width:          "100%",
              height:         "100%",
              objectFit:      "contain",
              objectPosition: "bottom center",
              display:        "block",
              filter:         "grayscale(1) contrast(1.15) brightness(0.95)",
            }}
          />
        </div>
      )}

      {/* The word — punches through via multiply blend on paper */}
      <div style={{
        position:       "absolute",
        inset:          0,
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        paddingBottom:  "12%",
        pointerEvents:  "none",
      }}>
        <div style={{
          fontFamily:    serifFontFamily,
          fontStyle:     "italic",
          fontSize:      210,
          fontWeight:    900,
          color:         "#111",
          letterSpacing: -6,
          lineHeight:    1,
          opacity:       wordIn,
          transform:     `translateY(${interpolate(wordIn, [0, 1], [24, 0])}px) scale(${interpolate(wordIn, [0, 1], [0.94, 1])})`,
          mixBlendMode:  "multiply",
        }}>{word}</div>
      </div>

      {/* Single accent rule — the editorial decorative device, under the word */}
      <div style={{
        position:        "absolute",
        left:            "50%",
        bottom:          "16%",
        width:           interpolate(wordIn, [0, 1], [0, 220]),
        height:          3,
        background:      "#111",
        transform:       "translateX(-50%)",
        opacity:         wordIn * 0.85,
      }} />

      <Grain />
    </AbsoluteFill>
  );
};
