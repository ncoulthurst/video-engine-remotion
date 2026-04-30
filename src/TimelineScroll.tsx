/**
 * TimelineScroll — Narrative timeline with cinematic camera pan + zoom.
 *
 * Camera zooms in on each event, dwells for narration, pans to next.
 * Finally zooms out to reveal the complete timeline in full colour.
 *
 * Active item: accent colour node + text. Inactive: muted.
 * Zoom-out overview: ALL items shown at full colour (no grey).
 *
 * dwellFrames — how long camera stays on each item (default 120 = 4s).
 */
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { fontFamily, serifFontFamily, Grain, PaperBackground, DarkBackground, COLORS, SPRINGS, WorldStateSchema} from "./shared";

// ══════════════════════════════════════════════════════════════════════════════
// SCHEMA
// ══════════════════════════════════════════════════════════════════════════════

const EventSchema = z.object({
  year:        z.string().optional().default(""),
  title:       z.string().optional().default(""),
  description: z.string().optional().default(""),
  highlight:   z.boolean().default(false),
  color:       z.string().optional().default(""),
});

export const TimelineScrollPropsSchema = z.object({
  title:        z.string().optional().default("The Journey"),
  subtitle:     z.string().optional().default(""),
  dwellFrames:  z.number().default(120),
  events:       z.array(EventSchema).default([
    { year: "1992", title: "Premier League founded",    description: "22 clubs breakaway from the Football League.",        highlight: true,  color: "" },
    { year: "1995", title: "Bosman ruling",             description: "Freedom of movement transforms the transfer market.", highlight: false, color: "" },
    { year: "2003", title: "Roman Abramovich",          description: "Chelsea's transformation begins.",                    highlight: false, color: "" },
    { year: "2012", title: "Financial Fair Play",       description: "UEFA introduces new spending rules.",                 highlight: false, color: "" },
    { year: "2017", title: "£5.1bn TV deal",            description: "Record broadcast rights reshape the game.",           highlight: true,  color: "" },
  ]),
  accentColor:  z.string().optional().default("#C8102E"),
  bgColor:      z.string().optional().default("#f0ece4"),
  darkMode:     z.boolean().default(false),
  worldState: WorldStateSchema.optional(),
  skipIntro: z.boolean().optional().default(false),
});

export type TimelineScrollProps = z.infer<typeof TimelineScrollPropsSchema>;

// ══════════════════════════════════════════════════════════════════════════════
// LAYOUT — 1920 × 1080
// ══════════════════════════════════════════════════════════════════════════════

const SCREEN_W   = 1920;
const SCREEN_H   = 1080;
const TIMELINE_Y = 540;
const PADDING    = 220;
const USABLE_W   = SCREEN_W - PADDING * 2;
const YEAR_GAP   = 90;   // px from timeline bar to bottom of year text area
const TEXT_GAP   = 95;   // px from timeline bar to top of title text area

// ══════════════════════════════════════════════════════════════════════════════
// CAMERA
// ══════════════════════════════════════════════════════════════════════════════

const ZOOM_IN_VAL = 1.85;
const INTRO_DUR   = 30;
const PAN_DUR     = 22;   // camera starts moving this many frames before next reveal
const OUTRO_DUR   = 60;

function clamp01(v: number) { return Math.max(0, Math.min(1, v)); }

function nodeX(i: number, n: number): number {
  if (n <= 1) return SCREEN_W / 2;
  return PADDING + (i / (n - 1)) * USABLE_W;
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

export const TimelineScroll: React.FC<TimelineScrollProps> = ({
  title,
  subtitle,
  dwellFrames,
  events,
  accentColor,
  bgColor,
  darkMode,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const n = events.length;

  const textColor  = darkMode ? "#f5f0e8" : COLORS.primary;
  const mutedColor = darkMode ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.25)";
  const lineColor  = darkMode ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.12)";
  // Opaque background used as node fill — covers the horizontal timeline line
  const nodeBgFill = darkMode ? "#1a1a1a" : bgColor;

  // ── Timing ───────────────────────────────────────────────────────────────
  const PHASE = dwellFrames + PAN_DUR;

  const revealFrame = (i: number) => INTRO_DUR + i * PHASE;
  const panFrame    = (i: number) => INTRO_DUR + i * PHASE - PAN_DUR;

  // FIX 1: last item gets its full dwellFrames before zoom-out starts
  const outroStart = INTRO_DUR + (n - 1) * PHASE + dwellFrames;

  // ── Zoom-out progress ────────────────────────────────────────────────────
  const zoomOutProg = clamp01(spring({ frame: frame - outroStart, fps, config: { damping: 26, stiffness: 38 } }));
  const allActive   = zoomOutProg > 0.5;

  // ── Per-item smooth active state (0 → 1 when activated, 1 → 0 when next activates)
  // Using spring accumulation: activation spring fires at revealFrame(i),
  // deactivation spring fires at revealFrame(i+1). Net = activate − deactivate.
  const itemActive = (i: number): number => {
    if (allActive) return 1;
    const onProg  = clamp01(spring({ frame: frame - revealFrame(i),     fps, config: { damping: 22, stiffness: 52 } }));
    const offProg = i < n - 1
      ? clamp01(spring({ frame: frame - revealFrame(i + 1), fps, config: { damping: 22, stiffness: 52 } }))
      : 0;
    return Math.max(0, onProg - offProg);
  };

  // ── Camera pan ────────────────────────────────────────────────────────────
  let panX = nodeX(0, n);
  for (let i = 1; i < n; i++) {
    const prog = clamp01(spring({ frame: frame - panFrame(i), fps, config: { damping: 26, stiffness: 40 } }));
    panX += (nodeX(i, n) - nodeX(i - 1, n)) * prog;
  }
  const finalPanX = panX + (SCREEN_W / 2 - panX) * zoomOutProg;

  // ── Camera zoom ───────────────────────────────────────────────────────────
  const zoomInProg  = clamp01(spring({ frame, fps, config: { damping: 28, stiffness: 42 } }));
  const zoom        = 1 + (ZOOM_IN_VAL - 1) * zoomInProg - (ZOOM_IN_VAL - 1) * zoomOutProg;
  const clampedZoom = Math.max(1.0, Math.min(ZOOM_IN_VAL, zoom));

  const tx = SCREEN_W / 2 - finalPanX * clampedZoom;
  const ty = SCREEN_H / 2 - TIMELINE_Y * clampedZoom;

  // ── Header ────────────────────────────────────────────────────────────────
  const headerProg = clamp01(spring({ frame, fps, config: SPRINGS.header }));

  return (
    <AbsoluteFill>
      {darkMode ? <DarkBackground /> : <PaperBackground color={bgColor} />}
      <Grain />

      {/* Fixed header — doubled font size */}
      <div style={{
        position:  "absolute",
        top:       48,
        left:      130,
        zIndex:    30,
        opacity:   headerProg,
        transform: `translateY(${interpolate(headerProg, [0, 1], [-10, 0])}px)`,
      }}>
        <div style={{
          fontFamily:    serifFontFamily,
          fontSize:      64,
          fontWeight:    900,
          color:         textColor,
          letterSpacing: -2,
          lineHeight:    1,
        }}>
          {title}
        </div>
        {subtitle && (
          <div style={{
            fontFamily,
            fontSize:   20,
            fontWeight: 400,
            color:      darkMode ? "rgba(255,255,255,0.60)" : COLORS.secondary,
            marginTop:  8,
          }}>
            {subtitle}
          </div>
        )}
        <div style={{
          width:        `${interpolate(headerProg, [0, 1], [0, 60])}px`,
          height:       4,
          background:   accentColor,
          borderRadius: 2,
          marginTop:    16,
        }} />
      </div>

      {/* Camera layer */}
      <div style={{
        position:        "absolute",
        left:            0,
        top:             0,
        width:           SCREEN_W,
        height:          SCREEN_H,
        transformOrigin: "0 0",
        transform:       `translate(${tx}px, ${ty}px) scale(${clampedZoom})`,
        overflow:        "visible",
        zIndex:          10,
      }}>

        <svg
          style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          width={SCREEN_W}
          height={SCREEN_H}
        >
          {/* Horizontal timeline line — drawn FIRST so nodes paint over it */}
          {n > 1 && (() => {
            const lastRevealed = events.reduce((acc, _, i) =>
              frame >= revealFrame(i) - 4 ? i : acc, -1);
            if (lastRevealed < 0) return null;
            const lineEndX = lastRevealed < n - 1
              ? interpolate(
                  frame,
                  [revealFrame(lastRevealed), revealFrame(lastRevealed + 1)],
                  [nodeX(lastRevealed, n), nodeX(lastRevealed + 1, n)],
                  { extrapolateRight: "clamp" }
                )
              : nodeX(n - 1, n);
            return (
              <line
                x1={nodeX(0, n)} y1={TIMELINE_Y}
                x2={lineEndX}    y2={TIMELINE_Y}
                stroke={lineColor}
                strokeWidth={2.5}
              />
            );
          })()}

          {/* Per-event nodes — smooth active state via spring blend */}
          {events.map((event, i) => {
            const rf        = revealFrame(i);
            // Smooth entrance — no bounce, just a clean scale-in
            const nodeProg  = clamp01(spring({ frame: frame - rf, fps, config: { damping: 24, stiffness: 80 } }));
            if (nodeProg < 0.01) return null;

            const as        = itemActive(i);                      // 0–1 smooth active value
            const nodeR     = 7 + 4 * as;                         // 7 (inactive) → 11 (active)
            const stubGap   = nodeR + 3;
            const x         = nodeX(i, n);
            const stubOpacity = interpolate(nodeProg, [0.2, 0.8], [0, 1], { extrapolateRight: "clamp" });

            return (
              <g key={i}>
                {/* Stub up */}
                <line
                  x1={x} y1={TIMELINE_Y - stubGap}
                  x2={x} y2={TIMELINE_Y - YEAR_GAP + 10}
                  stroke={accentColor}
                  strokeWidth={1.2 + 0.6 * as}
                  opacity={stubOpacity * (0.35 + 0.3 * as)}
                />
                {/* Stub down */}
                <line
                  x1={x} y1={TIMELINE_Y + stubGap}
                  x2={x} y2={TIMELINE_Y + TEXT_GAP - 10}
                  stroke={accentColor}
                  strokeWidth={1.2 + 0.6 * as}
                  opacity={stubOpacity * (0.35 + 0.3 * as)}
                />

                {/* Glow ring — fades smoothly with activeState */}
                <circle
                  cx={x} cy={TIMELINE_Y}
                  r={(nodeR + 6 + Math.sin(frame * 0.12) * 1.5) * nodeProg}
                  fill="none"
                  stroke={accentColor}
                  strokeWidth={1.5}
                  opacity={0.28 * as}
                />

                {/* Base circle — opaque bgColor, covers the horizontal line */}
                <circle
                  cx={x} cy={TIMELINE_Y}
                  r={nodeR * nodeProg}
                  fill={nodeBgFill}
                  stroke={lineColor}
                  strokeWidth={1.5}
                />
                {/* Accent overlay — opacity driven by smooth activeState */}
                <circle
                  cx={x} cy={TIMELINE_Y}
                  r={nodeR * nodeProg}
                  fill={accentColor}
                  opacity={as}
                />
              </g>
            );
          })}
        </svg>

        {/* Text labels */}
        {events.map((event, i) => {
          const rf       = revealFrame(i);
          const textProg = clamp01(spring({ frame: frame - rf - 4, fps, config: SPRINGS.feature }));
          if (textProg < 0.01) return null;

          const as   = itemActive(i);   // 0–1 smooth active value
          const x    = nodeX(i, n);
          const colW = n > 1 ? Math.min(280, USABLE_W / (n - 1) * 0.82) : 420;

          // Fixed sizes/positions — no reflow as active state changes
          // Colour blended via a single opacity-controlled overlay on the whole label block
          const yearAlpha    = interpolate(textProg, [0, 0.5],  [0, 1], { extrapolateRight: "clamp" });
          const contentAlpha = interpolate(textProg, [0.15, 0.7], [0, 1], { extrapolateRight: "clamp" });

          // Inactive opacity multiplier — items read as muted but visible
          const mutedMult  = 0.28 + 0.72 * as;   // 0.28 → 1.0

          return (
            <div
              key={i}
              style={{ position: "absolute", left: 0, top: 0, width: SCREEN_W, height: SCREEN_H, pointerEvents: "none" }}
            >
              {/* Year — above node, centred on x */}
              <div style={{
                position:  "absolute",
                left:      x,
                top:       TIMELINE_Y - YEAR_GAP - 32,
                transform: `translateX(-50%) translateY(${interpolate(textProg, [0, 1], [8, 0])}px)`,
                width:     colW,
                textAlign: "center",
                opacity:   yearAlpha * mutedMult,
              }}>
                <div style={{
                  fontFamily:    serifFontFamily,
                  fontSize:      28,
                  fontWeight:    900,
                  color:         accentColor,
                  letterSpacing: -0.5,
                  lineHeight:    1,
                }}>
                  {event.year}
                </div>
              </div>

              {/* Title + description — below node, centred on x */}
              <div style={{
                position:  "absolute",
                left:      x,
                top:       TIMELINE_Y + TEXT_GAP + 11,
                transform: `translateX(-50%) translateY(${interpolate(textProg, [0, 1], [10, 0])}px)`,
                width:     colW,
                textAlign: "center",
                opacity:   contentAlpha * mutedMult,
              }}>
                <div style={{
                  fontFamily:   serifFontFamily,
                  fontSize:     17,
                  fontWeight:   700,
                  color:        textColor,
                  lineHeight:   1.3,
                  marginBottom: 4,
                }}>
                  {event.title}
                </div>
                {event.description && (
                  <div style={{
                    fontFamily,
                    fontSize:   12,
                    fontWeight: 400,
                    color:      darkMode ? "rgba(255,255,255,0.70)" : COLORS.muted,
                    lineHeight: 1.45,
                  }}>
                    {event.description}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
