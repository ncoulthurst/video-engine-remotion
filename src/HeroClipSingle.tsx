/**
 * HeroClipSingle — One large centred clip frame with traveling border glow.
 * Used for goal analysis, key moments, tactical highlights.
 */
import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  staticFile,
  Freeze,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  Video,
} from "remotion";
import { z } from "zod";
import { fontFamily, serifFontFamily, Grain, PaperBackground, SmartImg } from "./shared";
import { ArchivalFrame } from "./ArchivalFrame";

export const HeroClipSinglePropsSchema = z.object({
  label:   z.string().optional().default(""),
  clip:    z.string().optional().default(""),
  title:   z.string().optional().default(""),
  bgColor: z.string().optional().default("#f0ece4"),
  /** Frame offset in the source file to start from (for splice support) */
  trimIn:  z.number().int().min(0).optional(),
  /** Frame offset in the source file to end at (for splice support) */
  trimOut: z.number().int().optional(),
  /** Intrinsic source length in frames (probed at upload) — freeze-hold bound */
  durationInFrames: z.number().int().optional(),
  /**
   * C3b multi-cut slot: 1–N source files played back-to-back as HARD CUTS
   * inside the same frame (the reference's 2–5s archival rhythm). When set,
   * takes precedence over the single `clip` path. Last cut freeze-holds if
   * the scene outlives the footage.
   */
  sources: z.array(z.object({
    clip:             z.string(),
    trimIn:           z.number().int().min(0).optional(),
    trimOut:          z.number().int().optional(),
    durationInFrames: z.number().int().optional(),
  })).optional(),
  /** Enable audio track on the clip — muted by default */
  soundOn: z.boolean().default(false),
  /** Track E — optional context portrait (resolver-filled, rendered via SmartImg) */
  playerImage: z.string().optional().default(""),
  skipIntro: z.boolean().optional().default(false),
  /** H4 — archival treatment: letterbox + desat grade + /YEAR tag (ArchivalFrame) */
  archivalTreatment: z.boolean().optional().default(false),
  /** Archive year shown as the top-left `/YEAR` tag when archivalTreatment is on */
  archivalYear: z.string().optional(),
  /** Legacy centred-window layout. Default is the H4 full-bleed treatment —
   *  footage fills the frame inside the archival letterbox, label rendered as
   *  a reference-style lower-third card. */
  boxed: z.boolean().optional().default(false),
});
export type HeroClipSingleProps = z.infer<typeof HeroClipSinglePropsSchema>;

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

/** Resolved playback segment for the multi-cut path. */
type CutSeg = { clip: string; start: number; dur: number; from: number };

const FALLBACK_SEG_FRAMES = 150; // 5s @30 — used only when a cut was never probed

export const HeroClipSingle: React.FC<HeroClipSingleProps> = ({
  label, clip = "", title, bgColor, trimIn, trimOut, durationInFrames, soundOn = false,
  archivalTreatment = false, archivalYear, sources, boxed = false,
}) => {
  const frame   = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Freeze-hold: when the scene outlives the footage (narration-paced scenes
  // regularly do), hold the last available frame instead of going black
  // (F2 watched export: 15s of footage inside a 186s scene = ~170s of black).
  const clipStartFrame = trimIn ?? 0;
  const clipEndFrame   = trimOut ?? durationInFrames;
  const availFrames    = clipEndFrame !== undefined
    ? Math.max(1, clipEndFrame - clipStartFrame)
    : undefined;
  const pastFootage = availFrames !== undefined && frame >= availFrames;

  // C3b — multi-cut slot: resolve segments (sequential hard cuts) and the
  // total footage length; freeze-holds on the final frame past the total.
  const cutSegs: CutSeg[] = [];
  if (sources && sources.length > 0) {
    let cursor = 0;
    for (const s of sources) {
      if (!s.clip || !/\.(mp4|webm|mov)$/i.test(s.clip)) continue;
      const start = s.trimIn ?? 0;
      const end   = s.trimOut ?? s.durationInFrames ?? (start + FALLBACK_SEG_FRAMES);
      const dur   = Math.max(1, end - start);
      cutSegs.push({ clip: s.clip, start, dur, from: cursor });
      cursor += dur;
    }
  }
  const multiCut    = cutSegs.length > 0;
  const cutsTotal   = cutSegs.reduce((a, s) => a + s.dur, 0);
  const pastCuts    = multiCut && frame >= cutsTotal;

  const titleIn  = spring({ frame, fps, config: { damping: 24, stiffness: 55 }, delay: 0 });
  const frameIn  = spring({ frame, fps, config: { damping: 22, stiffness: 50 }, delay: 8 });
  const labelIn  = spring({ frame, fps, config: { damping: 24, stiffness: 55 }, delay: 28 });

  const isVideo = /\.(mp4|webm|mov)$/i.test(clip);
  const isImage = /\.(jpe?g|png|webp|gif)$/i.test(clip);

  // C3b — multi-cut path: sequential HARD CUTS inside the frame (the
  // reference's archival rhythm). layout="none" keeps the surrounding layout;
  // only one segment is mounted at a time.
  const cutStack = multiCut ? (
    <>
      {cutSegs.map((s, i) => (
        <Sequence key={i} layout="none" from={s.from} durationInFrames={s.dur}>
          <Video
            src={staticFile(s.clip)}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            muted={!soundOn}
            startFrom={s.start}
            endAt={s.start + s.dur}
          />
        </Sequence>
      ))}
    </>
  ) : null;
  // Only construct the <Video> when a clip path exists — JSX props evaluate
  // eagerly, and staticFile(undefined/"") throws even when the placeholder
  // branch below is the one that renders.
  const clipVideo = isVideo && clip ? (
    <Video
      src={staticFile(clip)}
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
      muted={!soundOn}
      startFrom={clipStartFrame}
      {...(trimOut !== undefined ? { endAt: trimOut } : {})}
    />
  ) : null;
  const media = multiCut ? (
    pastCuts ? (
      <Freeze frame={cutsTotal - 1}>{cutStack}</Freeze>
    ) : (
      cutStack
    )
  ) : isVideo && clip ? (
    pastFootage ? (
      <Freeze frame={availFrames - 1}>{clipVideo}</Freeze>
    ) : (
      clipVideo
    )
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
  );

  // ── H4 full-bleed treatment (default) ────────────────────────────────────
  // Footage owns the whole frame inside the archival letterbox; the label is
  // a reference-style lower-third card riding the bottom bar. No floating
  // window, no plate, no border glow.
  if (!boxed) {
    // Hard cut in — the archival grammar. No entrance fade (it reads as a
    // pulse when clip scenes chain); only the lower-third animates.
    return (
      <AbsoluteFill style={{ background: "#0b0b0b" }}>
        <div style={{ position: "absolute", inset: 0 }}>
          {/* letterbox off — footage uses the full frame; grade + /YEAR tag stay */}
          <ArchivalFrame year={archivalYear} letterbox={false}>{media}</ArchivalFrame>
        </div>

        {/* Lower-third card — mono uppercase on a paper chip, above the bar */}
        {label ? (
          <div style={{
            position: "absolute",
            left: 90,
            bottom: 84,
            zIndex: 5,
            opacity: labelIn,
            transform: `translateY(${interpolate(labelIn, [0, 1], [16, 0])}px)`,
            maxWidth: 760,
          }}>
            {title ? (
              <div style={{
                display: "inline-block",
                background: "rgba(11,11,11,0.82)",
                color: "rgba(236,231,219,0.75)",
                fontFamily,
                fontSize: 15,
                fontWeight: 600,
                letterSpacing: 3,
                textTransform: "uppercase",
                padding: "7px 14px 6px",
                marginBottom: 2,
              }}>
                {title}
              </div>
            ) : null}
            <div style={{
              display: "inline-block",
              background: "#EFEAE0",
              color: "#161616",
              fontFamily,
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: 2.4,
              textTransform: "uppercase",
              lineHeight: 1.35,
              padding: "12px 18px 10px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.45)",
            }}>
              {label}
            </div>
          </div>
        ) : null}

        <Grain />
      </AbsoluteFill>
    );
  }

  // ── Legacy boxed layout (explicit opt-in via `boxed`) ────────────────────
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
            {archivalTreatment ? (
              <ArchivalFrame year={archivalYear}>{media}</ArchivalFrame>
            ) : media}
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
