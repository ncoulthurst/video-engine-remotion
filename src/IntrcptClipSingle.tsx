/**
 * IntrcptClipSingle — One large centred clip frame with traveling border glow.
 * Used for goal analysis, key moments, tactical highlights.
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
import { fontFamily, serifFontFamily, Grain, PaperBackground, SmartImg } from "./shared";

export const IntrcptClipSinglePropsSchema = z.object({
  label:   z.string().optional().default(""),
  clip:    z.string().optional().default(""),
  title:   z.string().optional().default(""),
  bgColor: z.string().optional().default("#f0ece4"),
  /** Frame offset in the source file to start from (for splice support) */
  trimIn:  z.number().int().min(0).optional(),
  /** Frame offset in the source file to end at (for splice support) */
  trimOut: z.number().int().optional(),
  /** Enable audio track on the clip — muted by default */
  soundOn: z.boolean().default(false),
});
export type IntrcptClipSingleProps = z.infer<typeof IntrcptClipSinglePropsSchema>;

const CLIP_W = 1400;
const CLIP_H = 788; // 16:9
const GLOW_LOOP_FRAMES = 390; // one full revolution every 13 seconds — barely perceptible

const BorderGlow: React.FC<{
  w:     number;
  h:     number;
  frame: number;
  fps:   number;
  delay: number;
}> = ({ w, h, frame, fps, delay }) => {
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
        <filter id="glow-single" x="-40%" y="-40%" width="180%" height="180%">
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
        strokeWidth={STROKE_W + 1}
        strokeDasharray={`${GLOW_LENGTH} ${perimeter - GLOW_LENGTH}`}
        strokeDashoffset={dashOffset}
        filter="url(#glow-single)"
        opacity={fadeIn}
      />
    </svg>
  );
};

export const IntrcptClipSingle: React.FC<IntrcptClipSingleProps> = ({
  label, clip, title, bgColor, trimIn, trimOut, soundOn = false,
}) => {
  const frame   = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleIn  = spring({ frame, fps, config: { damping: 24, stiffness: 55 }, delay: 0 });
  const frameIn  = spring({ frame, fps, config: { damping: 22, stiffness: 50 }, delay: 8 });
  const labelIn  = spring({ frame, fps, config: { damping: 24, stiffness: 55 }, delay: 28 });

  const isVideo = /\.(mp4|webm|mov)$/i.test(clip);
  const isImage = /\.(jpe?g|png|webp|gif)$/i.test(clip);

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
        gap:            28,
      }}>
        {title ? (
          <div style={{
            fontFamily:    serifFontFamily,
            fontSize:      26,
            fontWeight:    700,
            fontStyle:     "italic",
            color:         "#222",
            letterSpacing: -0.5,
            opacity:       titleIn,
            transform:     `translateY(${interpolate(titleIn, [0, 1], [10, 0])}px)`,
          }}>
            {title}
          </div>
        ) : null}

        {/* Clip frame */}
        <div style={{
          position:  "relative",
          opacity:   frameIn,
          transform: `scale(${interpolate(frameIn, [0, 1], [0.96, 1])})`,
        }}>
          <div style={{
            width:        CLIP_W,
            height:       CLIP_H,
            borderRadius: 6,
            overflow:     "hidden",
            background:   "#0d0d0d",
            boxShadow:    [
              "0 32px 100px rgba(0,0,0,0.5)",
              "0 12px 32px rgba(0,0,0,0.35)",
              "inset 0 1px 0 rgba(255,255,255,0.06)",
            ].join(", "),
          }}>
            {isVideo && clip ? (
              <Video
                src={staticFile(clip)}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                muted={!soundOn}
                startFrom={trimIn ?? 0}
                {...(trimOut !== undefined ? { endAt: trimOut } : {})}
              />
            ) : isImage && clip ? (
              <SmartImg src={clip} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
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

          <BorderGlow w={CLIP_W} h={CLIP_H} frame={frame} fps={fps} delay={18} />
        </div>

        {label ? (
          <div style={{
            fontFamily:    serifFontFamily,
            fontSize:      22,
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
    </AbsoluteFill>
  );
};
