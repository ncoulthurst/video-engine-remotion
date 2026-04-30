/**
 * HeroClipCompare — Two large side-by-side clip frames for comparison.
 *
 * This is strictly a TWO-item comparison template (before/after, player A vs
 * player B, tactic A vs tactic B). Do NOT use for single-topic illustrations.
 * Each side must be a discrete, comparable item with its own clip + label.
 *
 * Formerly named HeroConceptCard (renamed 2026-04-24 — the old name caused
 * the storyboard LLM to misroute single-concept topics here).
 */
import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Video,
} from "remotion";
import { z } from "zod";
import { fontFamily, serifFontFamily, Grain, PaperBackground, SmartImg, WorldStateSchema} from "./shared";

export const HeroClipComparePropsSchema = z.object({
  labelLeft:  z.string().optional().default("First Touch"),
  labelRight: z.string().optional().default("Final Ball"),
  clipLeft:   z.string().optional().default(""),
  clipRight:  z.string().optional().default(""),
  title:      z.string().optional().default(""),
  bgColor:    z.string().optional().default("#f0ece4"),
  worldState: WorldStateSchema.optional(),
  skipIntro: z.boolean().optional().default(false),
});
export type HeroClipCompareProps = z.infer<typeof HeroClipComparePropsSchema>;

const CLIP_W = 876;
const CLIP_H = 493; // 16:9
const GLOW_LOOP_FRAMES = 330; // one full revolution every 11 seconds — barely perceptible

const BorderGlow: React.FC<{
  w:        number;
  h:        number;
  frame:    number;
  fps:      number;
  filterId: string;
  delay?:   number;
}> = ({ w, h, frame, fps, filterId, delay = 0 }) => {
  const PAD          = 4;
  const STROKE_W     = 2;
  const borderRadius = 6;
  const perimeter    = 2 * (w + h);
  const GLOW_LENGTH  = Math.round(perimeter * 0.42); // ~40% — ambient wash, not a spot

  const fadeIn = spring({ frame, fps, config: { damping: 22, stiffness: 30 }, delay });

  const loopFrame  = (frame - delay) < 0 ? 0 : (frame - delay) % GLOW_LOOP_FRAMES;
  const dashOffset = -interpolate(loopFrame, [0, GLOW_LOOP_FRAMES], [0, perimeter]);

  return (
    <svg
      style={{ position: "absolute", top: -PAD, left: -PAD, pointerEvents: "none" }}
      width={w + PAD * 2}
      height={h + PAD * 2}
    >
      <defs>
        <filter id={filterId} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="10" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Ambient light wash — 40% of perimeter, very dim, barely moves */}
      <rect
        x={PAD} y={PAD}
        width={w} height={h}
        rx={borderRadius} ry={borderRadius}
        fill="none"
        stroke="rgba(255,255,255,0.10)"
        strokeWidth={STROKE_W}
        strokeDasharray={`${GLOW_LENGTH} ${perimeter - GLOW_LENGTH}`}
        strokeDashoffset={dashOffset}
        filter={`url(#${filterId})`}
        opacity={fadeIn}
      />
    </svg>
  );
};

const ClipFrame: React.FC<{
  clipSrc:       string;
  label:         string;
  frameProgress: number;
  translateX:    number;
  frame:         number;
  fps:           number;
  glowDelay:     number;
  filterId:      string;
}> = ({ clipSrc, label, frameProgress, translateX, frame, fps, glowDelay, filterId }) => {
  const isVideo = /\.(mp4|webm|mov)$/i.test(clipSrc);
  const isImage = /\.(jpe?g|png|webp|gif)$/i.test(clipSrc);

  const labelIn = spring({ frame, fps, config: { damping: 24, stiffness: 55 }, delay: glowDelay + 8 });

  return (
    <div style={{
      display:       "flex",
      flexDirection: "column",
      alignItems:    "center",
      gap:           24,
      opacity:       frameProgress,
      transform:     `translateX(${translateX}px)`,
    }}>
      {/* Clip frame + glow border */}
      <div style={{ position: "relative" }}>
        <div style={{
          width:        CLIP_W,
          height:       CLIP_H,
          borderRadius: 6,
          overflow:     "hidden",
          background:   "#0d0d0d",
          boxShadow:    [
            "0 24px 80px rgba(0,0,0,0.45)",
            "0 8px 24px rgba(0,0,0,0.3)",
            "inset 0 1px 0 rgba(255,255,255,0.05)",
          ].join(", "),
        }}>
          {isVideo && clipSrc ? (
            <Video
              src={staticFile(clipSrc)}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              muted
            />
          ) : isImage && clipSrc ? (
            <SmartImg src={clipSrc} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{
              width: "100%", height: "100%",
              background: "linear-gradient(160deg, #191919 0%, #0d0d0d 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{
                fontFamily,
                fontSize: 13,
                letterSpacing: 4,
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.12)",
              }}>clip</div>
            </div>
          )}
        </div>

        <BorderGlow
          w={CLIP_W} h={CLIP_H}
          frame={frame} fps={fps}
          filterId={filterId}
          delay={glowDelay}
        />
      </div>

      {label ? (
        <div style={{
          fontFamily:    serifFontFamily,
          fontSize:      20,
          fontWeight:    400,
          fontStyle:     "italic",
          color:         "#555",
          letterSpacing: 0.3,
          opacity:       labelIn,
        }}>
          {label}
        </div>
      ) : null}
    </div>
  );
};

export const HeroClipCompare: React.FC<HeroClipCompareProps> = ({
  labelLeft, labelRight, clipLeft, clipRight, title, bgColor,
}) => {
  const frame      = useCurrentFrame();
  const { fps }    = useVideoConfig();

  const titleIn  = spring({ frame, fps, config: { damping: 24, stiffness: 55 }, delay: 0 });
  const leftIn   = spring({ frame, fps, config: { damping: 22, stiffness: 55 }, delay: 8 });
  const rightIn  = spring({ frame, fps, config: { damping: 22, stiffness: 55 }, delay: 16 });

  return (
    <AbsoluteFill>
      <PaperBackground color={bgColor} />
      <Grain />

      <div style={{
        position:       "absolute",
        inset:          0,
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        justifyContent: "center",
        gap:            40,
        paddingInline:  60,
      }}>
        {title ? (
          <div style={{
            fontFamily:    serifFontFamily,
            fontSize:      28,
            fontWeight:    700,
            fontStyle:     "italic",
            color:         "#222",
            letterSpacing: -0.5,
            opacity:       titleIn,
            transform:     `translateY(${interpolate(titleIn, [0, 1], [12, 0])}px)`,
          }}>
            {title}
          </div>
        ) : null}

        <div style={{ display: "flex", gap: 48 }}>
          <ClipFrame
            clipSrc={clipLeft}
            label={labelLeft}
            frameProgress={leftIn}
            translateX={interpolate(leftIn, [0, 1], [-24, 0])}
            frame={frame}
            fps={fps}
            glowDelay={20}
            filterId="glow-left"
          />
          <ClipFrame
            clipSrc={clipRight}
            label={labelRight}
            frameProgress={rightIn}
            translateX={interpolate(rightIn, [0, 1], [24, 0])}
            frame={frame}
            fps={fps}
            glowDelay={28}
            filterId="glow-right"
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
