/**
 * HeroContactSheet — Photograph on paper. One frame at a time.
 *
 * Brand-matched: #f0ece4 paper + Grain, same as HeroTransferProfit.
 * Each print arrives with a weighted spring and a shadow that smacks the surface.
 * Between arrivals: Ken Burns keeps the image alive. Outgoing print gets picked
 * up and turned as it leaves. Nothing cuts. Everything breathes.
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
import { fontFamily, Grain, PaperBackground, SmartImg, WorldStateSchema} from "./shared";

// ─── Schema ───────────────────────────────────────────────────────────────────

export const HeroContactSheetPropsSchema = z.object({
  images: z.array(z.object({
    src:     z.string(),
    caption: z.string().optional().default(""),
  })).default([
    { src: "frame1.png", caption: "ANFIELD  ·  MATCHDAY 14  ·  NOV 2024" },
    { src: "frame2.png", caption: "TRAINING GROUND  ·  PRE-SEASON" },
    { src: "frame3.png", caption: "WEMBLEY  ·  FA CUP FINAL" },
  ]),
  /** Frames each image is held. 82 = 2.7 s at 30 fps — editorial pace. */
  frameDuration: z.number().int().min(40).default(82),
  bgColor:       z.string().optional().default("#f0ece4"),
  shutterAudio:  z.string().optional().default("sounds/shutter.mp3"),
  shutterVolume: z.number().min(0).max(4).optional().default(1.5),
  worldState: WorldStateSchema.optional(),
  skipIntro: z.boolean().optional().default(false),
});
export type HeroContactSheetProps = z.infer<typeof HeroContactSheetPropsSchema>;

export const calculateMetadata: CalculateMetadataFunction<HeroContactSheetProps> = async ({ props }) => ({
  durationInFrames: Math.max(1, props.images.length) * props.frameDuration,
});

// ─── Geometry ─────────────────────────────────────────────────────────────────

const IMG_W = 1120;
const IMG_H = Math.round(IMG_W * 9 / 16); // 630 — true 16:9

const B_SIDE   = 32;
const B_TOP    = 32;
const B_BOTTOM = 78;

const PRINT_W = IMG_W + B_SIDE * 2;       // 1184
const PRINT_H = IMG_H + B_TOP + B_BOTTOM; // 740

// ─── Authored motion values ───────────────────────────────────────────────────

// Print landing rotations — feel hand-placed, never symmetric, never exceed ±2°
const ROTATIONS = [-1.1, 0.9, -1.65, 1.35, -0.75, 1.9, -1.2, 1.55, -0.5, 1.75];

/**
 * Ken Burns moves — authored per image index.
 * zoomIn: true = slow push-in (1.0→1.042), false = slow pull-out (1.042→1.0).
 * panX / panY: direction multipliers for pan amount (−1 to +1).
 * Alternates zoom direction so consecutive images breathe against each other.
 */
const KB_MOVES = [
  { zoomIn: true,  panX: -1,    panY: -0.5  }, // push in, drift upper-left
  { zoomIn: false, panX:  1,    panY:  0    }, // pull out, drift right
  { zoomIn: true,  panX:  0.5,  panY:  1   }, // push in, drift lower-right
  { zoomIn: false, panX: -1,    panY: -0.5  }, // pull out, drift upper-left
  { zoomIn: true,  panX:  0,    panY: -1   }, // push in, drift up
  { zoomIn: false, panX:  0,    panY:  0.6  }, // pull out, drift down
];
const KB_SCALE = 0.042; // 4.2% zoom range — perceptible over 2.7 s, invisible frame-to-frame
const KB_PAN_X = 14;    // max horizontal pan in px
const KB_PAN_Y = 9;     // max vertical pan in px

// Typewriter
const TYPER_SPEED = 0.72; // chars per frame

// Spring configs — principle 2: springs not easing curves
const ARRIVE_CFG  = { damping: 12, stiffness: 220, mass: 0.82 } as const; // decisive, one clean overshoot
const DEPART_CFG  = { damping: 22, stiffness: 120 }              as const; // soft exit, no bounce
const IMPACT_CFG  = { damping:  5, stiffness: 260, mass: 0.65 }  as const; // underdamped → shadow smack
const COUNTER_CFG = { damping:  5, stiffness: 380, mass: 0.55 }  as const; // fast pop, big overshoot

// Frames the outgoing print stays rendered — the overlap IS the continuity
const DEPART_DUR = 14;

// ─── PhotoPrint ───────────────────────────────────────────────────────────────

const PhotoPrint: React.FC<{
  src:            string;
  caption:        string;
  rotation:       number;
  arriveProgress: number; // 0 = just arrived, 1 = fully settled
  departProgress: number; // 0 = here, 1 = gone (outgoing only)
  localFrame:     number; // frame within THIS image's slot
  frameDuration:  number;
  isOutgoing:     boolean;
  index:          number;
  total:          number;
  fps:            number;
}> = ({
  src, caption, rotation, arriveProgress, departProgress,
  localFrame, frameDuration, isOutgoing, index, total, fps,
}) => {

  // ── Opacity ──────────────────────────────────────────────────────────────
  // Incoming: snaps to full in ~4 frames (fast reveal, spring handles the landing)
  // Outgoing: fades steadily as departProgress rises
  const opacity = isOutgoing
    ? Math.max(0, 1 - departProgress * 1.25)
    : Math.min(1, arriveProgress * 3.5);

  if (opacity <= 0.005) return null;

  // ── Position + scale ─────────────────────────────────────────────────────
  const yOffset = isOutgoing
    ? interpolate(departProgress, [0, 1], [0, 12])
    : interpolate(arriveProgress, [0, 1], [-30, 0]);

  const scale = isOutgoing
    ? interpolate(departProgress, [0, 1], [1.0, 0.972])
    : interpolate(arriveProgress, [0, 1], [0.955, 1.0]);

  // ── Rotation ─────────────────────────────────────────────────────────────
  // Incoming: springs from 4° beyond authored angle — lands with character
  // Outgoing: rotates +1.8° as it's "picked up" — feels intentional, not dropped
  const baseRot = isOutgoing
    ? rotation + interpolate(departProgress, [0, 1], [0, 1.8])
    : interpolate(arriveProgress, [0, 1], [rotation - 4, rotation]);

  // Ambient rock — sine wave, only once spring fully settled
  const settled  = !isOutgoing && arriveProgress > 0.97;
  const rock     = settled ? Math.sin((localFrame / 96) * Math.PI * 2) * 0.13 : 0;
  const finalRot = baseRot + rock;

  // ── Shadow smack — underdamped spring on landing ──────────────────────────
  // impactSp overshoots 1.0 → shadow compresses on impact, then spreads wider
  // than resting, then settles. Implies the print hit a physical surface.
  const impactSp = isOutgoing
    ? 1
    : spring({ frame: localFrame - 1, fps, config: IMPACT_CFG });

  const restBlur   = 52 + Math.abs(rock) * 14;
  const shadowX    = (rock - 0.25) * 6; // slight directional shift
  const shadowBlur = isOutgoing
    ? restBlur
    : impactSp <= 1
      ? interpolate(impactSp, [0, 1], [14, restBlur], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
      : restBlur + (impactSp - 1) * restBlur * 0.28; // spreads wider at overshoot peak

  // ── Ken Burns ────────────────────────────────────────────────────────────
  // Linear progress through the image's dwell time.
  // Outgoing: frozen at end of its move (kbProgress = 1).
  const kbProgress = isOutgoing ? 1 : Math.min(1, localFrame / frameDuration);
  const kb         = KB_MOVES[index % KB_MOVES.length];
  const kbT        = kb.zoomIn ? kbProgress : 1 - kbProgress; // 0→1 zoom-in, 1→0 zoom-out
  const kbScale    = 1 + kbT * KB_SCALE;
  const kbX        = kb.panX * KB_PAN_X * kbProgress;
  const kbY        = kb.panY * KB_PAN_Y * kbProgress;

  // ── Caption — inline typewriter using localFrame (not useCurrentFrame) ────
  // Principle 11: cursor is a fixed-width span toggled by opacity, not " " / "|"
  const captionStartF = 22;
  const captionElapsed = Math.max(0, localFrame - captionStartF);
  const captionChars   = isOutgoing
    ? caption.length
    : Math.min(caption.length, Math.floor(captionElapsed * TYPER_SPEED));
  const captionDone    = captionChars >= caption.length;
  const captionBlink   = Math.floor(captionElapsed / 9) % 2 === 0;

  // ── Hairline rule — draws left-to-right after print lands ────────────────
  const ruleSp = spring({ frame: localFrame - 16, fps, config: { damping: 26, stiffness: 88 } });

  // ── Counter pop — underdamped scale burst when this print first arrives ───
  const counterSp  = spring({ frame: localFrame, fps, config: COUNTER_CFG });
  const counterScale = isOutgoing ? 1 : 1 + Math.max(0, counterSp - 1) * 0.28;

  return (
    <div style={{
      position:   "absolute",
      left:       "50%",
      top:        "50%",
      transform:  [
        `translate(-50%, calc(-50% + ${yOffset.toFixed(2)}px))`,
        `scale(${scale.toFixed(4)})`,
        `rotate(${finalRot.toFixed(3)}deg)`,
      ].join(" "),
      opacity,
      willChange: "transform, opacity",
      zIndex:     isOutgoing ? 1 : 2,
    }}>

      {/* Drop shadow — own element so overflow:hidden on print doesn't clip it */}
      <div style={{
        position:      "absolute",
        inset:         0,
        boxShadow:     [
          `${shadowX.toFixed(1)}px 9px ${shadowBlur.toFixed(1)}px rgba(0,0,0,0.21)`,
          `0 3px 10px rgba(0,0,0,0.11)`,
          `0 1px 2px rgba(0,0,0,0.06)`,
        ].join(", "),
        pointerEvents: "none",
      }} />

      {/* Print paper */}
      <div style={{
        width:     PRINT_W,
        height:    PRINT_H,
        background: "#F7F4EE",
        position:  "relative",
        overflow:  "hidden",
      }}>

        {/* Image area */}
        <div style={{
          position:   "absolute",
          top:        B_TOP,
          left:       B_SIDE,
          width:      IMG_W,
          height:     IMG_H,
          overflow:   "hidden",
          background: "#111",
        }}>
          {/* Ken Burns applied to the image only — print border stays still */}
          <SmartImg
            src={src}
            style={{
              width:          "100%",
              height:         "100%",
              objectFit:      "cover",
              display:        "block",
              transform:      `scale(${kbScale.toFixed(4)}) translate(${kbX.toFixed(2)}px, ${kbY.toFixed(2)}px)`,
              transformOrigin:"center center",
            }}
          />
          {/* Inset shadow — photographic darkroom print feel */}
          <div style={{
            position:      "absolute",
            inset:         0,
            boxShadow:     "inset 0 0 32px rgba(0,0,0,0.20)",
            pointerEvents: "none",
          }} />
        </div>

        {/* Hairline rule — draws left to right after landing */}
        <div style={{
          position:        "absolute",
          top:             B_TOP + IMG_H,
          left:            B_SIDE,
          width:           IMG_W,
          height:          1,
          background:      "rgba(0,0,0,0.09)",
          transformOrigin: "left center",
          transform:       `scaleX(${isOutgoing ? 1 : ruleSp.toFixed(4)})`,
        }} />

        {/* Caption margin */}
        <div style={{
          position:       "absolute",
          bottom:         0,
          left:           B_SIDE,
          right:          B_SIDE,
          height:         B_BOTTOM,
          display:        "flex",
          alignItems:     "center",
          justifyContent: "space-between",
        }}>

          {/* Caption — typewriter, no reflow on blink */}
          <div style={{
            fontFamily,
            fontSize:      11,
            fontWeight:    500,
            letterSpacing: 2.6,
            textTransform: "uppercase" as const,
            color:         "#8A8070",
          }}>
            {caption.slice(0, captionChars)}
            {!captionDone && !isOutgoing && (
              <span style={{
                display:       "inline-block",
                width:         1.5,
                height:        "0.78em",
                background:    "currentColor",
                verticalAlign: "text-bottom",
                marginLeft:    2,
                opacity:       captionBlink ? 1 : 0,
              }} />
            )}
          </div>

          {/* Frame counter with arrival pop */}
          <div style={{
            fontFamily,
            fontSize:   10,
            fontWeight: 400,
            letterSpacing: 2,
            color:      "#B8AFA4",
            transform:  `scale(${counterScale.toFixed(4)})`,
            transformOrigin: "right center",
          }}>
            {String(index + 1).padStart(2, "0")}&thinsp;/&thinsp;{String(total).padStart(2, "0")}
          </div>

        </div>
      </div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

export const HeroContactSheet: React.FC<HeroContactSheetProps> = ({
  images, frameDuration, bgColor, shutterAudio, shutterVolume,
}) => {
  const frame          = useCurrentFrame();
  const { fps }        = useVideoConfig();
  const n              = Math.max(1, images.length);
  const imageIndex     = Math.min(Math.floor(frame / frameDuration), n - 1);
  const localFrame     = frame - imageIndex * frameDuration;
  const prevIndex      = imageIndex - 1;
  const showPrev       = prevIndex >= 0 && localFrame < DEPART_DUR;

  const arriveSpring   = spring({ frame: localFrame - 1, fps, config: ARRIVE_CFG });
  const departSpring   = showPrev
    ? spring({ frame: localFrame, fps, config: DEPART_CFG })
    : 1;

  const current  = images[imageIndex] ?? { src: "", caption: "" };
  const previous = images[prevIndex]  ?? { src: "", caption: "" };

  return (
    <AbsoluteFill>

      {/* Brand-matched background — identical stack to HeroTransferProfit */}
      <PaperBackground color={bgColor ?? "#f0ece4"} />
      <div style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none" }}>
        <Grain />
      </div>

      {/* Outgoing print — recedes as incoming arrives */}
      {showPrev && (
        <div style={{ position: "absolute", inset: 0, zIndex: 3 }}>
          <PhotoPrint
            src={previous.src}
            caption={previous.caption ?? ""}
            rotation={ROTATIONS[prevIndex % ROTATIONS.length]}
            arriveProgress={1}
            departProgress={departSpring}
            localFrame={frameDuration}  // frozen at end of its Ken Burns move
            frameDuration={frameDuration}
            isOutgoing
            index={prevIndex}
            total={n}
            fps={fps}
          />
        </div>
      )}

      {/* Incoming print */}
      <div style={{ position: "absolute", inset: 0, zIndex: 4 }}>
        <PhotoPrint
          src={current.src}
          caption={current.caption ?? ""}
          rotation={ROTATIONS[imageIndex % ROTATIONS.length]}
          arriveProgress={arriveSpring}
          departProgress={0}
          localFrame={localFrame}
          frameDuration={frameDuration}
          isOutgoing={false}
          index={imageIndex}
          total={n}
          fps={fps}
        />
      </div>

      {/* Shutter — one click per transition, never on the first image */}
      {images.map((_, i) => i > 0 && (
        <Sequence key={i} from={i * frameDuration} durationInFrames={fps}>
          <Audio
            src={staticFile(shutterAudio ?? "sounds/shutter.mp3")}
            volume={shutterVolume ?? 1.5}
          />
        </Sequence>
      ))}

    </AbsoluteFill>
  );
};
