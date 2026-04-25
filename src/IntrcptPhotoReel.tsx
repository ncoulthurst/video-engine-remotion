/**
 * IntrcptPhotoReel — Cycling photo gallery with camera shutter transitions.
 * Each image switch triggers a shutter sound and iris-close/open animation.
 */
import React from "react";
import {
  AbsoluteFill,
  Audio,
  CalculateMetadataFunction,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";
import { fontFamily, serifFontFamily, Grain, PaperBackground, SmartImg, WorldStateSchema} from "./shared";

export const IntrcptPhotoReelPropsSchema = z.object({
  /** Array of image paths relative to /public */
  images:        z.array(z.string()).default(["frame1.png", "frame2.png", "frame3.png"]),
  /** Frames each image is shown (default 90 = 3 s at 30 fps) */
  frameDuration: z.number().int().min(20).default(90),
  title:         z.string().optional().default(""),
  label:         z.string().optional().default(""),
  bgColor:       z.string().optional().default("#f0ece4"),
  /** Path to shutter audio inside /public (default extracted from shutter source) */
  shutterAudio:  z.string().optional().default("sounds/shutter.mp3"),
  /** Volume multiplier for the shutter click (0–4) */
  shutterVolume: z.number().min(0).max(4).optional().default(1.4),
  worldState: WorldStateSchema.optional(),
  skipIntro: z.boolean().optional().default(false),
});
export type IntrcptPhotoReelProps = z.infer<typeof IntrcptPhotoReelPropsSchema>;

export const calculateMetadata: CalculateMetadataFunction<IntrcptPhotoReelProps> = async ({ props }) => ({
  durationInFrames: Math.max(1, props.images.length) * props.frameDuration,
});

// ─── constants ────────────────────────────────────────────────────────────────
const CLIP_W      = 1400;
const CLIP_H      = 788;
const CLOSE_DUR   = 6;   // frames to close the iris shutter
const OPEN_DUR    = 10;  // frames to open the iris shutter
const GLOW_LOOP   = 390;

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Iris shutter progress at a single transition frame T. Returns 0→1→0 peak. */
function shutterAt(frame: number, T: number): number {
  const closeStart = T - CLOSE_DUR;
  const openEnd    = T + OPEN_DUR;
  if (frame <= closeStart || frame >= openEnd) return 0;
  if (frame < T)  return (frame - closeStart) / CLOSE_DUR; // 0 → 1
  if (frame === T) return 1;
  return 1 - (frame - T) / OPEN_DUR;                       // 1 → 0
}

// ─── BorderGlow (same as IntrcptClipSingle) ───────────────────────────────────
const BorderGlow: React.FC<{ w: number; h: number; frame: number; fps: number; delay: number }> = ({
  w, h, frame, fps, delay,
}) => {
  const PAD    = 4;
  const SW     = 2;
  const BR     = 6;
  const perim  = 2 * (w + h);
  const GLOW_L = Math.round(perim * 0.42);
  const fadeIn = spring({ frame, fps, config: { damping: 22, stiffness: 30 }, delay });
  const loop   = (frame - delay) < 0 ? 0 : (frame - delay) % GLOW_LOOP;
  const offset = -interpolate(loop, [0, GLOW_LOOP], [0, perim]);

  return (
    <svg
      style={{ position: "absolute", top: -PAD, left: -PAD, pointerEvents: "none" }}
      width={w + PAD * 2}
      height={h + PAD * 2}
    >
      <defs>
        <filter id="glow-reel" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="10" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <rect
        x={PAD} y={PAD} width={w} height={h} rx={BR} ry={BR}
        fill="none"
        stroke="rgba(255,255,255,0.10)"
        strokeWidth={SW + 1}
        strokeDasharray={`${GLOW_L} ${perim - GLOW_L}`}
        strokeDashoffset={offset}
        filter="url(#glow-reel)"
        opacity={fadeIn}
      />
    </svg>
  );
};

// ─── IrisShutter overlay ──────────────────────────────────────────────────────
/**
 * Renders a radial iris-style shutter overlay.
 * When shutterProg = 0: invisible.
 * When shutterProg = 1: fully opaque black (iris fully closed).
 */
const IrisShutter: React.FC<{ progress: number }> = ({ progress }) => {
  if (progress <= 0) return null;

  // Iris hole radius shrinks to 0 as shutter closes.
  // The dark gradient fills everything outside the hole.
  const holeRadius = (1 - progress) * 82;           // % of the container
  const edgeRadius = holeRadius + 6 * progress;     // soft blend edge

  const gradient = [
    `transparent 0%`,
    `transparent ${holeRadius.toFixed(1)}%`,
    `rgba(0,0,0,${(progress * 0.97).toFixed(3)}) ${edgeRadius.toFixed(1)}%`,
    `rgba(0,0,0,${(progress * 0.97).toFixed(3)}) 100%`,
  ].join(", ");

  // Secondary full overlay for the deepest close phase
  const fullOpacity = Math.max(0, (progress - 0.8) / 0.2) * 0.97;

  return (
    <>
      {/* Iris mask */}
      <div style={{
        position:         "absolute",
        inset:            0,
        borderRadius:     6,
        background:       `radial-gradient(circle at 50% 50%, ${gradient})`,
        pointerEvents:    "none",
      }} />
      {/* Full blackout at peak close */}
      {fullOpacity > 0 && (
        <div style={{
          position:      "absolute",
          inset:         0,
          borderRadius:  6,
          background:    `rgba(0,0,0,${fullOpacity.toFixed(3)})`,
          pointerEvents: "none",
        }} />
      )}
    </>
  );
};

// ─── PhotoCounter ─────────────────────────────────────────────────────────────
const PhotoCounter: React.FC<{ current: number; total: number; opacity: number }> = ({
  current, total, opacity,
}) => (
  <div style={{
    fontFamily,
    fontSize:      13,
    letterSpacing: 3,
    textTransform: "uppercase",
    color:         `rgba(100,90,80,${opacity})`,
    userSelect:    "none",
  }}>
    {String(current + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────
export const IntrcptPhotoReel: React.FC<IntrcptPhotoReelProps> = ({
  images, frameDuration, title, label, bgColor, shutterAudio, shutterVolume, skipIntro = false,
}) => {
  const frame   = useCurrentFrame();
  const { fps } = useVideoConfig();

  const n           = Math.max(1, images.length);
  const imageIndex  = Math.min(Math.floor(frame / frameDuration), n - 1);
  const localFrame  = frame - imageIndex * frameDuration;

  // ── Compute combined shutter progress across all transitions ──
  let shutterProg = 0;

  // Image 0: open-only shutter at frame 0
  shutterProg = Math.max(shutterProg, shutterAt(frame, 0));

  // Images 1..n-1: full close→open at each boundary
  for (let i = 1; i < n; i++) {
    shutterProg = Math.max(shutterProg, shutterAt(frame, i * frameDuration));
  }

  // Outro close after last image
  const outroT = n * frameDuration;
  shutterProg = Math.max(shutterProg, shutterAt(frame, outroT));

  // ── Per-image reveal spring (starts once shutter is ~half open) ──
  const revealDelay = imageIndex === 0 ? OPEN_DUR * 0.4 : OPEN_DUR * 0.4;
  const revealSpring = spring({
    frame:  localFrame - Math.round(revealDelay),
    fps,
    config: { damping: 22, stiffness: 58 },
  });

  // ── Entrance springs (title, label — fire once on comp start) ──
  const titleIn = skipIntro ? 1 : spring({ frame, fps, config: { damping: 24, stiffness: 55 }, delay: OPEN_DUR + 2 });
  const labelIn = skipIntro ? 1 : spring({ frame, fps, config: { damping: 24, stiffness: 55 }, delay: OPEN_DUR + 18 });

  // ── Frame container scale punch at transition ──
  // Brief micro-scale snap (1.000 → 0.992 → 1.000) at shutter peak
  const punchScale = 1 - shutterProg * 0.008;

  return (
    <AbsoluteFill>
      <PaperBackground color={bgColor} />
      <Grain />

      {/* ── Audio: one shutter click per image including the first ── */}
      {images.map((_, i) => (
        <Sequence key={i} from={i * frameDuration} durationInFrames={fps * 2}>
          <Audio
            src={staticFile(shutterAudio ?? "sounds/shutter.mp3")}
            volume={shutterVolume ?? 1.4}
          />
        </Sequence>
      ))}

      {/* ── Layout ── */}
      <div style={{
        position:       "absolute",
        inset:          0,
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        justifyContent: "center",
        gap:            28,
      }}>

        {/* Title */}
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

        {/* Image frame */}
        <div style={{
          position:  "relative",
          transform: `scale(${punchScale})`,
        }}>
          <div style={{
            width:        CLIP_W,
            height:       CLIP_H,
            borderRadius: 6,
            overflow:     "hidden",
            background:   "#0d0d0d",
            boxShadow: [
              "0 32px 100px rgba(0,0,0,0.5)",
              "0 12px 32px rgba(0,0,0,0.35)",
              "inset 0 1px 0 rgba(255,255,255,0.06)",
            ].join(", "),
            position:     "relative",
          }}>
            {/* Image — only render current image; spring scales it in */}
            <div style={{
              width:     "100%",
              height:    "100%",
              transform: `scale(${interpolate(revealSpring, [0, 1], [1.04, 1.0])})`,
              opacity:   revealSpring,
            }}>
              {images[imageIndex] ? (
                <SmartImg
                  src={images[imageIndex]}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
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
                  }}>
                    image
                  </div>
                </div>
              )}
            </div>

            {/* Iris shutter overlay */}
            <IrisShutter progress={shutterProg} />
          </div>

          <BorderGlow w={CLIP_W} h={CLIP_H} frame={frame} fps={fps} delay={18} />
        </div>

        {/* Bottom row: label + counter */}
        <div style={{
          display:        "flex",
          alignItems:     "center",
          justifyContent: "space-between",
          width:          CLIP_W,
          opacity:        labelIn,
        }}>
          <div style={{
            fontFamily:    serifFontFamily,
            fontSize:      22,
            fontWeight:    400,
            fontStyle:     "italic",
            color:         "#555",
            letterSpacing: 0.3,
          }}>
            {label ?? ""}
          </div>

          <PhotoCounter current={imageIndex} total={n} opacity={0.55} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
