/**
 * IntrcptSeasonTimeline — Opening-sequence template.
 *
 * Cinematic zoom-out cold open: starts hyper-zoomed into red grain, pulls back
 * to reveal B&W portrait (left) + scrolling season timeline (right).
 *
 * Portrait masking: identical technique to IntrcptPlayerReveal —
 *   WebkitMaskImage + bottom/top vignette divs inside the container.
 *   No background-colour overlay on the container itself.
 *
 * Tag:
 *   [INTRCPT SEASON TIMELINE: Subject | img:file.png | 22/23:8th, 23/24:2nd, 25/26:1st(PL,FA) | headline:word?]
 */

import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";
import { fontFamily, serifFontFamily, SmartImg } from "./shared";

// ── Schema ─────────────────────────────────────────────────────────────────────

const SeasonEntrySchema = z.object({
  season:        z.string(),                        // "22/23"
  positionLabel: z.string(),                        // "8th" / "2nd" / "1st?"
  position:      z.number().optional(),             // numeric (1 = champion)
  trophies:      z.array(z.string()).optional(),    // ["PL","FA"]
});

export const IntrcptSeasonTimelinePropsSchema = z.object({
  subjectName:   z.string().optional(),
  subjectImage:  z.string().optional(),    // portrait filename in public/
  seasons:       z.array(SeasonEntrySchema),
  headline:      z.string().optional(),    // italic serif word, e.g. "quadruple?"
  monochrome:    z.boolean().optional(),   // B&W portrait toggle (default: true)
  bgColor:       z.string().optional(),    // default deep crimson
  lineColor:     z.string().optional(),    // default brighter red
  accentColor:   z.string().optional(),    // off-white for current season
  /**
   * skipIntro — for use with the `evolve` transition.
   * When true: zoom-out and entrance animations are skipped; the composition
   * starts fully settled (portrait positioned, timeline drawn, seasons visible).
   * Only the headline word has a short entrance, as new "arriving" content.
   * Use this when the scene follows another on the same bgColor, so it looks
   * like a continuation rather than a fresh composition start.
   */
  skipIntro:     z.boolean().optional(),
});

export type IntrcptSeasonTimelineProps = z.infer<typeof IntrcptSeasonTimelinePropsSchema>;

// ── Design constants ───────────────────────────────────────────────────────────

const RED_BG     = "#5E1212";
const LINE_COLOR = "#C41E3A";
const ACCENT     = "#E8E0D0";

// Portrait zone
const PORTRAIT_W = 680;         // portrait container width
// Portrait CSS mask: fade transparent→solid from left, solid→transparent on right edge
const PORTRAIT_MASK =
  "linear-gradient(to right, black 50%, transparent 92%)";

// Timeline geometry
const TL_GAP      = 50;         // gap between portrait right edge and first season
const LINE_Y_FRAC = 0.45;       // timeline sits at 45% of frame height
const TICK_H      = 18;         // half-height of tick mark
const MAX_STEP    = 200;        // max px between seasons

// Animation timing (frames)
const ZOOM_IN_F      = 0;
const PORTRAIT_IN_F  = 16;
const LINE_IN_F      = 30;
const FIRST_TICK_F   = 46;
const TICK_STAGGER   = 14;

// ── Red grain background ───────────────────────────────────────────────────────

// grainOnly=true: renders only the noise overlays, no solid bg fill.
// Use when the solid base is rendered separately inside a zoom layer.
const RedGrainBg: React.FC<{ color: string; width: number; height: number; grainOnly?: boolean }> = ({
  color, width, height, grainOnly = false,
}) => {
  const frame = useCurrentFrame();
  const seed  = frame % 90;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {!grainOnly && <AbsoluteFill style={{ background: color }} />}

      {/* Static coarse texture */}
      <svg width={width} height={height} style={{ position: "absolute", top: 0, left: 0, opacity: 0.22 }}>
        <defs>
          <filter id="rst" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.48" numOctaves="6" seed={9} stitchTiles="stitch" />
            <feColorMatrix type="matrix"
              values="0.85 0.1 0.05 0 0
                      0.12 0.04 0.04 0 0
                      0.10 0.04 0.04 0 0
                      0    0   0    0 1" />
          </filter>
        </defs>
        <rect width={width} height={height} filter="url(#rst)" />
      </svg>

      {/* Animated fine film grain */}
      <svg width={width} height={height} style={{ position: "absolute", top: 0, left: 0 }}>
        <defs>
          <filter id={`raf${seed}`} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.78" numOctaves="3" seed={seed} stitchTiles="stitch" />
            <feColorMatrix type="matrix"
              values="0.80 0.1 0.1 0 0
                      0.10 0.04 0.04 0 0
                      0.10 0.04 0.04 0 0
                      0    0   0    0 0.13" />
          </filter>
        </defs>
        <rect width={width} height={height} filter={`url(#raf${seed})`} />
      </svg>

      {/* Edge vignette */}
      <AbsoluteFill style={{
        background: "radial-gradient(ellipse 88% 78% at 55% 52%, transparent 28%, rgba(0,0,0,0.42) 100%)",
        pointerEvents: "none",
      }} />
    </AbsoluteFill>
  );
};

// ── Trophy icon ────────────────────────────────────────────────────────────────

const TrophyMini: React.FC<{ label: string }> = ({ label }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
    <svg width={20} height={24} viewBox="0 0 22 26" fill="none">
      <path d="M5 2h12v7a6 6 0 01-12 0V2z" fill="rgba(232,224,208,0.72)" />
      <path d="M8 15.5h6M11 15.5V18.5M8.5 18.5h5" stroke="rgba(232,224,208,0.72)" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M5 4H2.5v2.5A2.5 2.5 0 005 9" stroke="rgba(232,224,208,0.72)" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M17 4h2.5v2.5A2.5 2.5 0 0117 9" stroke="rgba(232,224,208,0.72)" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
    <span style={{
      fontFamily, fontSize: 9, fontWeight: 700,
      color: "rgba(232,224,208,0.60)", letterSpacing: 1.2,
      textTransform: "uppercase" as const,
    }}>{label}</span>
  </div>
);

// ── Main component ─────────────────────────────────────────────────────────────

export const IntrcptSeasonTimeline: React.FC<IntrcptSeasonTimelineProps> = ({
  subjectName,
  subjectImage,
  seasons = [],
  headline,
  monochrome  = true,
  bgColor     = RED_BG,
  lineColor   = LINE_COLOR,
  accentColor = ACCENT,
  skipIntro   = false,
}) => {
  const frame              = useCurrentFrame();
  const { fps, width: W, height: H } = useVideoConfig();

  const N      = seasons.length;
  const LINE_Y = Math.round(H * LINE_Y_FRAC);

  // ── Timeline geometry ────────────────────────────────────────────────────────
  const TL_ZONE_LEFT  = PORTRAIT_W + TL_GAP;
  const TL_ZONE_RIGHT = W - 70;
  const TL_ZONE_W     = TL_ZONE_RIGHT - TL_ZONE_LEFT;

  const STEP   = N <= 1 ? 0 : Math.min(MAX_STEP, Math.floor(TL_ZONE_W / (N - 1)));
  const totalW = (N - 1) * STEP;

  const tlTargetX = TL_ZONE_LEFT + Math.round((TL_ZONE_W - totalW) / 2);
  const tlStartX  = W + 120;

  // ── skipIntro: when true everything starts settled from frame 0 ─────────────
  // Used with the `evolve` transition so this scene looks like a continuation.

  // Zoom-out (skipped when skipIntro)
  const zoomProg = skipIntro ? 1 : spring({
    fps,
    frame: Math.max(0, frame - ZOOM_IN_F),
    config: { damping: 32, stiffness: 22, mass: 1.8 },
  });
  // Start at 2.2× — enough to feel like a cinematic pull-back without magnifying
  // grain pixels into visible chunks. Grain is rendered outside the zoom layer
  // at native 1× resolution so it always looks sharp regardless of scale.
  const scale = skipIntro ? 1 : interpolate(zoomProg as number, [0, 1], [2.2, 1], { extrapolateRight: "clamp" });

  // Portrait (skipIntro: already at final position, full opacity)
  const portraitProg = skipIntro ? 1 : spring({
    fps,
    frame: Math.max(0, frame - PORTRAIT_IN_F),
    config: { damping: 22, stiffness: 45, mass: 1 },
  });
  const portraitX  = skipIntro ? 0 : interpolate(portraitProg as number, [0, 1], [-PORTRAIT_W * 0.55, 0]);
  const portraitOp = skipIntro ? 1 : interpolate(portraitProg as number, [0, 0.25], [0, 1], { extrapolateRight: "clamp" });

  // Timeline (skipIntro: already drawn)
  const panProg = skipIntro ? 1 : spring({
    fps,
    frame: Math.max(0, frame - LINE_IN_F + 4),
    config: { damping: 28, stiffness: 30, mass: 1.2 },
  });
  const tlX = skipIntro ? tlTargetX : interpolate(panProg as number, [0, 1], [tlStartX, tlTargetX]);

  const lineProg = skipIntro ? 1 : spring({
    fps,
    frame: Math.max(0, frame - LINE_IN_F),
    config: { damping: 20, stiffness: 55, mass: 1 },
  });

  // Headline (skipIntro: short entrance only — this is the "new" element)
  const headlineF    = skipIntro ? 8 : FIRST_TICK_F + N * TICK_STAGGER + 20;
  const headlineProg = spring({
    fps,
    frame: Math.max(0, frame - headlineF),
    config: { damping: 20, stiffness: 80, mass: 0.9 },
  });

  // Portrait image filter
  const portraitFilter = monochrome
    ? "grayscale(1) contrast(1.12) brightness(0.92)"
    : "contrast(1.05) brightness(1.0)";

  return (
    <AbsoluteFill style={{ fontFamily, overflow: "hidden", background: bgColor }}>

      {/* ── Everything EXCEPT grain scales for the zoom-out open ── */}
      <AbsoluteFill style={{
        transform:       `scale(${scale})`,
        transformOrigin: "center center",
      }}>
        {/* Solid colour base that zooms with the content */}
        <AbsoluteFill style={{ background: bgColor }} />

        {/* ── Portrait (IntrcptPlayerReveal masking method) ── */}
        {subjectImage && (
          <div style={{
            position:        "absolute",
            left:            portraitX,
            top:             0,
            width:           PORTRAIT_W,
            height:          H,
            opacity:         portraitOp * 0.88,   // max 0.88 — same as IntrcptPlayerReveal
            WebkitMaskImage: PORTRAIT_MASK,
            maskImage:       PORTRAIT_MASK,
            zIndex:          2,
            // NO background colour here — the mask handles all blending
          }}>
            <SmartImg
              src={subjectImage}
              style={{
                width:          "100%",
                height:         "110%",
                objectFit:      "cover",
                objectPosition: "top center",
                filter:         portraitFilter,
                display:        "block",
              }}
            />

            {/* Bottom vignette — dissolves feet into bg colour */}
            <div style={{
              position:   "absolute",
              bottom:     0, left: 0, right: 0,
              height:     380,
              background: `linear-gradient(to top, ${bgColor} 0%, ${bgColor} 16%, transparent 100%)`,
              pointerEvents: "none",
            }} />

            {/* Top vignette — softens the top edge */}
            <div style={{
              position:   "absolute",
              top:        0, left: 0, right: 0,
              height:     70,
              background: `linear-gradient(to bottom, ${bgColor} 0%, transparent 100%)`,
              pointerEvents: "none",
            }} />
          </div>
        )}

        {/* ── Timeline group (pans as one unit) ── */}
        <div style={{
          position: "absolute",
          left:     tlX,
          top:      0,
          width:    totalW + 300,
          height:   H,
          zIndex:   3,
        }}>
          {/* Horizontal line draws left→right */}
          <div style={{
            position:  "absolute",
            left:      0,
            top:       LINE_Y,
            height:    2,
            width:     totalW * lineProg,
            background: lineColor,
            borderRadius: 1,
          }} />

          {/* Seasons */}
          {seasons.map((s, i) => {
            const tickF = skipIntro ? 0 : FIRST_TICK_F + i * TICK_STAGGER;
            const tickProg = skipIntro ? 1 : spring({
              fps,
              frame:  Math.max(0, frame - tickF),
              config: { damping: 16, stiffness: 200, mass: 0.85 },
            });
            const tickOp = skipIntro ? 1 : interpolate(tickProg as number, [0, 0.3], [0, 1], { extrapolateRight: "clamp" });
            const tickDY = skipIntro ? 0 : interpolate(tickProg as number, [0, 1],  [20, 0]);

            const x         = i * STEP;
            const isCurrent = i === N - 1;
            const posNum    = s.position ?? 20;

            // Label sizing: current season biggest, 1st biggest among rest
            const labelSize   = isCurrent ? 58 : posNum === 1 ? 50 : posNum <= 3 ? 42 : 34;
            const labelWeight = isCurrent ? 800 : posNum <= 2 ? 700 : 500;
            const labelColor  = isCurrent
              ? accentColor
              : posNum === 1
              ? "#C9A84C"
              : "rgba(232,224,208,0.60)";

            return (
              <div key={i} style={{
                position:  "absolute",
                left:      x,
                top:       0,
                width:     STEP,
                height:    H,
                opacity:   tickOp,
                transform: `translateY(${tickDY.toFixed(2)}px)`,
              }}>
                {/* Tick mark */}
                <div style={{
                  position:     "absolute",
                  left:         0,
                  top:          LINE_Y - TICK_H,
                  width:        2,
                  height:       TICK_H * 2,
                  background:   lineColor,
                  borderRadius: 1,
                }} />

                {/* Position label (above the line) */}
                <div style={{
                  position:   "absolute",
                  left:       -72,
                  top:        LINE_Y - TICK_H - labelSize - 18,
                  width:      144,
                  textAlign:  "center" as const,
                  fontSize:   labelSize,
                  fontWeight: labelWeight,
                  color:      labelColor,
                  letterSpacing: -2,
                  lineHeight: 1,
                }}>
                  {s.positionLabel}
                </div>

                {/* Season label (below the line) */}
                <div style={{
                  position:     "absolute",
                  left:         -44,
                  top:          LINE_Y + TICK_H + 12,
                  width:        88,
                  textAlign:    "center" as const,
                  fontSize:     13,
                  fontWeight:   500,
                  color:        "rgba(232,224,208,0.45)",
                  letterSpacing: 0.5,
                }}>
                  {s.season}
                </div>

                {/* Glow dot on current season */}
                {isCurrent && (
                  <div style={{
                    position:     "absolute",
                    left:         -7,
                    top:          LINE_Y - 7,
                    width:        14,
                    height:       14,
                    borderRadius: "50%",
                    background:   accentColor,
                    boxShadow:    `0 0 14px 5px rgba(232,224,208,0.35)`,
                  }} />
                )}

                {/* Trophy icons below season label */}
                {s.trophies && s.trophies.length > 0 && (
                  <div style={{
                    position:       "absolute",
                    left:           -52,
                    top:            LINE_Y + TICK_H + 46,
                    width:          104,
                    display:        "flex",
                    gap:            8,
                    justifyContent: "center",
                  }}>
                    {s.trophies.map((t, ti) => <TrophyMini key={ti} label={t} />)}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Headline — below the timeline, right side ── */}
        {headline && (
          <div style={{
            position:  "absolute",
            // Sits below the timeline's season labels; ~55% of frame height
            top:       LINE_Y + TICK_H + 90,
            // Right portion of frame, starting just inside the timeline zone
            left:      TL_ZONE_LEFT + 10,
            opacity:   interpolate(headlineProg, [0, 0.5], [0, 1], { extrapolateRight: "clamp" }),
            transform: `translateY(${interpolate(headlineProg, [0, 1], [20, 0])}px)`,
            zIndex:    4,
          }}>
            <span style={{
              fontFamily:    serifFontFamily,
              fontSize:      100,
              fontWeight:    700,
              fontStyle:     "italic",
              color:         accentColor,
              letterSpacing: -3,
              lineHeight:    1,
              opacity:       0.90,
            }}>
              {headline}
            </span>
          </div>
        )}

        {/* ── Subject name — large, left of portrait ── */}
        {subjectName && (
          <div style={{
            position:      "absolute",
            left:          40,
            bottom:        52,
            opacity:       portraitOp * 0.7,
            fontSize:      30,
            fontWeight:    700,
            color:         accentColor,
            letterSpacing: 1,
            textTransform: "uppercase" as const,
            zIndex:        5,
          }}>
            {subjectName}
          </div>
        )}
      </AbsoluteFill>

      {/* ── Grain at native 1× — rendered LAST so it sits on top of everything.
           Must be outside and after the zoom layer; if placed before or inside
           the zoom layer, the solid bgColor base covers it entirely. ── */}
      <RedGrainBg color={bgColor} width={W} height={H} grainOnly />

    </AbsoluteFill>
  );
};
