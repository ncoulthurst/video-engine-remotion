/**
 * HeroOutro — End-of-video outro with channel wordmark + two related-video panels.
 *
 * Mirrors HeroIntro's structural language (wordmark + serif/sans pairing,
 * paper background, grain). Below the wordmark sit two glassmorphic 16:9
 * windows for linked YouTube videos. Bottom carries a topic-aware lead-in
 * sentence and a rotating subscribe ask, both passed in as props from the
 * engine so each video has unique outro copy.
 *
 * Modern/SaaS aesthetic via:
 *  - Soft glassmorphic clip frames (subtle inset shadow + 1px hairline border)
 *  - Ambient orbiting border glow on each frame (same primitive as ClipCompare)
 *  - Spring stagger on entry (frame A then frame B)
 *  - Restrained animation per STYLE_GUIDE §6 (deceleration, no bounce)
 */
import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  Easing,
  useCurrentFrame,
  useVideoConfig,
  Video,
} from "remotion";
import { z } from "zod";
import { fontFamily, serifFontFamily, Grain, PaperBackground, SmartImg, WorldStateSchema } from "./shared";

const CHANNEL_NAME = "Frequency";

export const HeroOutroPropsSchema = z.object({
  /** Topic-aware lead-in sentence (engine generates per-video). */
  leadIn:        z.string().optional().default("If this story stayed with you, there's more where it came from."),
  /** Subscribe ask / CTA — engine rotates among ~5 phrasings. */
  subscribeAsk:  z.string().optional().default("Subscribe for a new story every week."),
  /** Title shown under the left clip frame. */
  videoLeftTitle:  z.string().optional().default("Watch next"),
  /** Title shown under the right clip frame. */
  videoRightTitle: z.string().optional().default("Or this one"),
  /** Optional video src for left panel (mp4 path or URL). */
  videoLeftSrc:    z.string().optional().default(""),
  /** Optional video src for right panel. */
  videoRightSrc:   z.string().optional().default(""),
  /** Optional poster image for left panel (used when no video). */
  videoLeftImage:  z.string().optional().default(""),
  /** Optional poster image for right panel. */
  videoRightImage: z.string().optional().default(""),
  bgColor:    z.string().optional().default("#f0ece4"),
  accentColor: z.string().optional().default("#0a0a0a"),
  skipIntro:  z.boolean().optional().default(false),
  worldState: WorldStateSchema.optional(),
});
export type HeroOutroProps = z.infer<typeof HeroOutroPropsSchema>;

// ── Layout constants ─────────────────────────────────────────────────────────
const FRAME_W = 720;
const FRAME_H = 405; // 16:9
const FRAME_GAP = 48;

// ── Motion constants ─────────────────────────────────────────────────────────
const WORDMARK_IN  = 6;
const FRAME_A_IN   = 28;
const FRAME_B_IN   = FRAME_A_IN + 12; // stagger
const COPY_IN      = 64;

// ── Border glow (ambient, slow rotation — SaaS hero pattern) ────────────────
const GLOW_LOOP = 360;

const BorderGlow: React.FC<{
  w: number; h: number; frame: number; fps: number; filterId: string; delay: number;
}> = ({ w, h, frame, fps, filterId, delay }) => {
  const PAD       = 4;
  const STROKE_W  = 2;
  const RADIUS    = 8;
  const perim     = 2 * (w + h);
  const glowLen   = Math.round(perim * 0.40);
  const fadeIn    = spring({ frame, fps, config: { damping: 22, stiffness: 30 }, delay: delay + 6 });
  const loopF     = (frame - delay) < 0 ? 0 : (frame - delay) % GLOW_LOOP;
  const offset    = -interpolate(loopF, [0, GLOW_LOOP], [0, perim]);

  return (
    <svg
      style={{ position: "absolute", top: -PAD, left: -PAD, pointerEvents: "none" }}
      width={w + PAD * 2}
      height={h + PAD * 2}
    >
      <defs>
        <filter id={filterId} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <rect
        x={PAD} y={PAD} width={w} height={h} rx={RADIUS} ry={RADIUS}
        fill="none"
        stroke="rgba(10,10,10,0.45)"
        strokeWidth={STROKE_W}
        strokeDasharray={`${glowLen} ${perim - glowLen}`}
        strokeDashoffset={offset}
        filter={`url(#${filterId})`}
        opacity={fadeIn * 0.9}
      />
    </svg>
  );
};

// ── Clip frame — glassmorphic SaaS card ─────────────────────────────────────
const ClipFrame: React.FC<{
  src: string; image: string; title: string;
  delay: number; frame: number; fps: number; skipIntro: boolean; filterId: string;
  accentColor: string;
}> = ({ src, image, title, delay, frame, fps, skipIntro, filterId, accentColor }) => {
  // SaaS-style entry: drop down + scale up + opacity rise. Pure deceleration, no spring.
  const entryProg = skipIntro ? 1 : interpolate(frame, [delay, delay + 30], [0, 1], {
    extrapolateLeft:  "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const ty       = interpolate(entryProg, [0, 1], [-44, 0]);
  const scale    = interpolate(entryProg, [0, 1], [0.94, 1]);
  const op       = interpolate(entryProg, [0, 0.55], [0, 1], { extrapolateRight: "clamp" });
  const titleOp  = skipIntro ? 1 : interpolate(frame, [delay + 24, delay + 38], [0, 1], { extrapolateRight: "clamp" });
  const titleTy  = interpolate(titleOp, [0, 1], [10, 0]);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 16,
      transform: `translateY(${ty}px) scale(${scale})`,
      opacity: op,
    }}>
      {/* Glassmorphic frame */}
      <div style={{
        position:        "relative",
        width:           FRAME_W,
        height:          FRAME_H,
        borderRadius:    8,
        overflow:        "hidden",
        background:      "rgba(255,255,255,0.55)",
        backdropFilter:  "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        border:          "1px solid rgba(10,10,10,0.08)",
        boxShadow:       "0 18px 48px -16px rgba(10,10,10,0.18), inset 0 0 0 1px rgba(255,255,255,0.5)",
      }}>
        {src ? (
          <Video
            src={src}
            startFrom={0}
            muted
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : image ? (
          <SmartImg src={image} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          /* Placeholder pattern when nothing loaded — soft graphite gradient */
          <div style={{
            width: "100%", height: "100%",
            background: "linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{
              fontFamily: serifFontFamily,
              fontSize: 36,
              fontWeight: 900,
              color: "rgba(255,255,255,0.18)",
              letterSpacing: -1,
            }}>▶</div>
          </div>
        )}
        <BorderGlow w={FRAME_W} h={FRAME_H} frame={frame} fps={fps} filterId={filterId} delay={delay} />
      </div>
      {/* Title strip */}
      <div style={{
        opacity: titleOp,
        transform: `translateY(${titleTy}px)`,
        fontFamily,
        fontSize: 17,
        fontWeight: 600,
        color: "#0a0a0a",
        letterSpacing: 0.2,
        maxWidth: FRAME_W,
        textAlign: "center",
      }}>{title}</div>
    </div>
  );
};

// ── Component ─────────────────────────────────────────────────────────────────
export const HeroOutro: React.FC<HeroOutroProps> = ({
  leadIn,
  subscribeAsk,
  videoLeftTitle,
  videoRightTitle,
  videoLeftSrc,
  videoRightSrc,
  videoLeftImage,
  videoRightImage,
  bgColor,
  accentColor = "#0a0a0a",
  skipIntro = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Wordmark entry — soft fade-and-rise
  const wordmarkProg = skipIntro ? 1 : interpolate(frame, [WORDMARK_IN, WORDMARK_IN + 22], [0, 1], {
    extrapolateLeft:  "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const wordmarkTy = interpolate(wordmarkProg, [0, 1], [-12, 0]);

  // Lead-in copy entry
  const leadInProg = skipIntro ? 1 : interpolate(frame, [COPY_IN, COPY_IN + 24], [0, 1], {
    extrapolateLeft:  "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const leadInTy = interpolate(leadInProg, [0, 1], [12, 0]);

  // Subscribe ask entry — appears slightly after lead-in
  const askProg = skipIntro ? 1 : interpolate(frame, [COPY_IN + 18, COPY_IN + 42], [0, 1], {
    extrapolateLeft:  "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const askTy = interpolate(askProg, [0, 1], [12, 0]);

  return (
    <AbsoluteFill>
      <PaperBackground color={bgColor} />

      {/* Wordmark — top */}
      <div style={{
        position: "absolute",
        top: 88,
        left: 0,
        right: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        opacity: wordmarkProg,
        transform: `translateY(${wordmarkTy}px)`,
      }}>
        <div style={{
          fontFamily: serifFontFamily,
          fontSize:   88,
          fontWeight: 900,
          color:      "#0a0a0a",
          letterSpacing: -3,
          lineHeight: 1,
        }}>{CHANNEL_NAME}</div>
        <div style={{
          marginTop: 14,
          fontFamily,
          fontSize:   11,
          fontWeight: 700,
          letterSpacing: 4,
          textTransform: "uppercase",
          color: "rgba(10,10,10,0.45)",
        }}>· thanks for watching ·</div>
      </div>

      {/* Two clip frames — center */}
      <div style={{
        position: "absolute",
        top: 320,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        gap: FRAME_GAP,
      }}>
        <ClipFrame
          src={videoLeftSrc || ""}
          image={videoLeftImage || ""}
          title={videoLeftTitle || ""}
          delay={FRAME_A_IN}
          frame={frame}
          fps={fps}
          skipIntro={skipIntro}
          filterId="outro-glow-a"
          accentColor={accentColor}
        />
        <ClipFrame
          src={videoRightSrc || ""}
          image={videoRightImage || ""}
          title={videoRightTitle || ""}
          delay={FRAME_B_IN}
          frame={frame}
          fps={fps}
          skipIntro={skipIntro}
          filterId="outro-glow-b"
          accentColor={accentColor}
        />
      </div>

      {/* Bottom copy — lead-in + subscribe ask */}
      <div style={{
        position: "absolute",
        bottom: 64,
        left: 0,
        right: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        padding: "0 200px",
      }}>
        <div style={{
          fontFamily: serifFontFamily,
          fontSize:   26,
          fontWeight: 400,
          fontStyle:  "italic",
          color:      "rgba(10,10,10,0.78)",
          textAlign:  "center",
          letterSpacing: -0.3,
          lineHeight: 1.3,
          maxWidth:   1100,
          opacity:    leadInProg,
          transform:  `translateY(${leadInTy}px)`,
        }}>{leadIn}</div>
        <div style={{
          marginTop: 6,
          fontFamily,
          fontSize:   13,
          fontWeight: 700,
          letterSpacing: 3,
          textTransform: "uppercase",
          color: "#0a0a0a",
          opacity: askProg,
          transform: `translateY(${askTy}px)`,
        }}>
          <span style={{ opacity: 0.4 }}>/</span>
          <span style={{ marginLeft: 8 }}>{subscribeAsk}</span>
        </div>
      </div>

      <Grain />
    </AbsoluteFill>
  );
};
