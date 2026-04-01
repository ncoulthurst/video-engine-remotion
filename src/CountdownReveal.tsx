/**
 * CountdownReveal — Cinematic ranked list countdown with vertical camera.
 *
 * Items should be passed in rank order: items[0] = #1 (best), items[n-1] = last.
 * Camera starts at last place and pans UPWARD through each entry, counting
 * down to #1. Final zoom-out reveals the complete ranked list in full colour.
 *
 * Same camera philosophy as TimelineScroll — spring pan + zoom, active state
 * is a continuous 0→1 value, payoff zoom-out at the end.
 */
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { CalculateMetadataFunction } from "remotion";
import { z } from "zod";
import { fontFamily, serifFontFamily, Grain, PaperBackground, DarkBackground, COLORS, SPRINGS } from "./shared";

// ══════════════════════════════════════════════════════════════════════════════
// SCHEMA
// ══════════════════════════════════════════════════════════════════════════════

const ItemSchema = z.object({
  name:   z.string(),
  detail: z.string().default(""),
  value:  z.string().default(""),
  color:  z.string().optional(),
});

export const CountdownRevealPropsSchema = z.object({
  title:       z.string().default("Top 10"),
  subtitle:    z.string().optional(),
  items:       z.array(ItemSchema).default([
    { name: "Alan Shearer",        detail: "1993/94 season",          value: "31 goals"  },
    { name: "Andrew Cole",         detail: "1993/94 season",          value: "34 goals"  },
    { name: "Kevin Phillips",      detail: "1999/00 season",          value: "30 goals"  },
    { name: "Cristiano Ronaldo",   detail: "2007/08 season",          value: "31 goals"  },
    { name: "Luis Suárez",         detail: "2013/14 season",          value: "31 goals"  },
    { name: "Mohamed Salah",       detail: "2017/18 season",          value: "32 goals"  },
    { name: "Thierry Henry",       detail: "2002/03 season",          value: "24 goals"  },
    { name: "Harry Kane",          detail: "2016/17 season",          value: "29 goals"  },
    { name: "Erling Haaland",      detail: "2022/23 season",          value: "36 goals"  },
    { name: "Robbie Fowler",       detail: "1995/96 season",          value: "28 goals"  },
  ]),
  accentColor: z.string().default("#C8102E"),
  bgColor:     z.string().default("#f0ece4"),
  darkMode:    z.boolean().default(false),
  dwellFrames: z.number().default(90),
});

export type CountdownRevealProps = z.infer<typeof CountdownRevealPropsSchema>;

// ── Dynamic duration — computed from item count + dwellFrames ─────────────────
const _INTRO = 28;
const _PAN   = 20;
const _OUTRO = 60;

export const calculateMetadata: CalculateMetadataFunction<CountdownRevealProps> = ({ props }) => {
  const n     = props.items.length;
  const phase = props.dwellFrames + _PAN;
  const outroStart = _INTRO + (n - 1) * phase + props.dwellFrames;
  return { durationInFrames: outroStart + _OUTRO };
};

// ══════════════════════════════════════════════════════════════════════════════
// LAYOUT
// ══════════════════════════════════════════════════════════════════════════════

const SCREEN_W   = 1920;
const SCREEN_H   = 1080;
const ITEM_H     = 82;
const GAP        = 16;
const ITEM_STRIDE = ITEM_H + GAP;
const ITEM_W     = 900;
const ITEM_L     = (SCREEN_W - ITEM_W) / 2;  // left edge of item column

// ══════════════════════════════════════════════════════════════════════════════
// CAMERA
// ══════════════════════════════════════════════════════════════════════════════

const ZOOM_IN_VAL = 1.8;
const INTRO_DUR   = 28;
const PAN_DUR     = 20;
const OUTRO_DUR   = 60;

function clamp01(v: number) { return Math.max(0, Math.min(1, v)); }

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

export const CountdownReveal: React.FC<CountdownRevealProps> = ({
  title,
  subtitle,
  items,
  accentColor,
  bgColor,
  darkMode,
  dwellFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const n = items.length;

  const textColor  = darkMode ? "#f5f0e8" : COLORS.primary;
  const mutedColor = darkMode ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.12)";
  const divColor   = darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";

  // ── Layout ────────────────────────────────────────────────────────────────
  const totalH   = n * ITEM_H + (n - 1) * GAP;
  const topOffset = Math.round((SCREEN_H - totalH) / 2);

  // nodeY = vertical center of item i (items[0] = #1 at top, items[n-1] = last at bottom)
  const nodeY = (i: number) => topOffset + i * ITEM_STRIDE + ITEM_H / 2;

  // ── Timing ────────────────────────────────────────────────────────────────
  // Countdown order: reveal step s reveals item index (n - 1 - s)
  // Step 0 → items[n-1] (last place), step n-1 → items[0] (#1)
  const PHASE = dwellFrames + PAN_DUR;

  const revealFrame = (s: number) => INTRO_DUR + s * PHASE;
  const panFrame    = (s: number) => INTRO_DUR + s * PHASE - PAN_DUR;

  // Last step is step n-1 (reveals item 0, rank #1). Outro starts after its full dwell.
  const outroStart = INTRO_DUR + (n - 1) * PHASE + dwellFrames;

  // ── Zoom-out progress ────────────────────────────────────────────────────
  const zoomOutProg = clamp01(spring({ frame: frame - outroStart, fps, config: { damping: 26, stiffness: 38 } }));
  const allActive   = zoomOutProg > 0.5;

  // ── Per-item smooth active state (same technique as TimelineScroll) ───────
  // Step s → item index (n-1-s). Active state via spring accumulation.
  const itemActive = (itemIdx: number): number => {
    if (allActive) return 1;
    // What reveal step activates this item?
    const s = n - 1 - itemIdx;
    const onProg  = clamp01(spring({ frame: frame - revealFrame(s),     fps, config: { damping: 22, stiffness: 52 } }));
    const offProg = s < n - 1
      ? clamp01(spring({ frame: frame - revealFrame(s + 1), fps, config: { damping: 22, stiffness: 52 } }))
      : 0;
    return Math.max(0, onProg - offProg);
  };

  // Whether item i has been revealed at all (for rendering)
  const itemRevealed = (itemIdx: number): boolean => {
    const s = n - 1 - itemIdx;
    return frame >= revealFrame(s) - 6;
  };

  // ── Camera pan (vertical) ─────────────────────────────────────────────────
  // Start at nodeY of last item (bottom). Pan upward as each item is revealed.
  let panY = nodeY(n - 1);
  for (let s = 1; s < n; s++) {
    const itemIdx = n - 1 - s;
    const prog = clamp01(spring({ frame: frame - panFrame(s), fps, config: { damping: 26, stiffness: 40 } }));
    panY += (nodeY(itemIdx) - nodeY(n - s)) * prog;
  }
  const centerY = nodeY(0) + (nodeY(n - 1) - nodeY(0)) / 2;
  const finalPanY = panY + (centerY - panY) * zoomOutProg;

  // ── Camera zoom ───────────────────────────────────────────────────────────
  const zoomInProg  = clamp01(spring({ frame, fps, config: { damping: 28, stiffness: 42 } }));
  const zoom        = 1 + (ZOOM_IN_VAL - 1) * zoomInProg - (ZOOM_IN_VAL - 1) * zoomOutProg;
  const clampedZoom = Math.max(1.0, Math.min(ZOOM_IN_VAL, zoom));

  const tx = SCREEN_W / 2 - SCREEN_W / 2 * clampedZoom;   // items are horizontally centered
  const ty = SCREEN_H / 2 - finalPanY * clampedZoom;

  // ── Header ────────────────────────────────────────────────────────────────
  const headerProg = clamp01(spring({ frame, fps, config: SPRINGS.header }));

  return (
    <AbsoluteFill>
      {darkMode ? <DarkBackground /> : <PaperBackground color={bgColor} />}
      <Grain />

      {/* Fixed header — outside camera layer, never moves */}
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
          fontSize:      58,
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
            fontSize:   19,
            fontWeight: 400,
            color:      darkMode ? "rgba(255,255,255,0.55)" : COLORS.secondary,
            marginTop:  8,
          }}>
            {subtitle}
          </div>
        )}
        <div style={{
          width:        `${interpolate(headerProg, [0, 1], [0, 52])}px`,
          height:       4,
          background:   accentColor,
          borderRadius: 2,
          marginTop:    14,
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
        {items.map((item, i) => {
          if (!itemRevealed(i)) return null;

          const s        = n - 1 - i;  // reveal step for this item
          const rf       = revealFrame(s);
          const itemProg = clamp01(spring({ frame: frame - rf, fps, config: SPRINGS.feature }));
          const as       = itemActive(i);
          const mutedMult = 0.28 + 0.72 * as;

          const rankNum  = i + 1;
          const itemY    = topOffset + i * ITEM_STRIDE;

          // Accent bar width grows in when active
          const barW = interpolate(as, [0, 1], [0, 5], { extrapolateRight: "clamp" });

          // Value slides in from the right when item activates
          const valueSlide = interpolate(as, [0, 0.6], [24, 0], { extrapolateRight: "clamp" });
          const valueOpacity = interpolate(as, [0, 0.5], [0, 1], { extrapolateRight: "clamp" });

          // Item entrance: slides up slightly
          const entranceY = interpolate(itemProg, [0, 1], [12, 0]);

          return (
            <div
              key={i}
              style={{
                position:  "absolute",
                left:      ITEM_L,
                top:       itemY,
                width:     ITEM_W,
                height:    ITEM_H,
                opacity:   itemProg * mutedMult,
                transform: `translateY(${entranceY}px)`,
              }}
            >
              {/* Accent bar — left edge, height-full, grows with active state */}
              <div style={{
                position:     "absolute",
                left:         0,
                top:          12,
                bottom:       12,
                width:        barW,
                background:   accentColor,
                borderRadius: 3,
                boxShadow:    `0 0 10px 2px ${accentColor}55`,
              }} />

              {/* Bottom divider */}
              {i < n - 1 && (
                <div style={{
                  position:   "absolute",
                  bottom:     0,
                  left:       28,
                  right:      0,
                  height:     1,
                  background: divColor,
                }} />
              )}

              {/* Row content */}
              <div style={{
                position:   "absolute",
                left:       28,
                right:      0,
                top:        0,
                bottom:     0,
                display:    "flex",
                alignItems: "center",
                gap:        24,
                paddingLeft: 14,
              }}>
                {/* Rank number */}
                <div style={{
                  fontFamily:    serifFontFamily,
                  fontSize:      38,
                  fontWeight:    900,
                  color:         accentColor,
                  opacity:       0.28 + 0.72 * as,
                  letterSpacing: -1.5,
                  lineHeight:    1,
                  minWidth:      52,
                  textAlign:     "right",
                  flexShrink:    0,
                }}>
                  {rankNum}
                </div>

                {/* Name + detail */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily:    serifFontFamily,
                    fontSize:      22,
                    fontWeight:    700,
                    color:         textColor,
                    letterSpacing: -0.3,
                    lineHeight:    1.2,
                    whiteSpace:    "nowrap",
                    overflow:      "hidden",
                    textOverflow:  "ellipsis",
                  }}>
                    {item.name}
                  </div>
                  {item.detail && (
                    <div style={{
                      fontFamily,
                      fontSize:   13,
                      fontWeight: 400,
                      color:      darkMode ? "rgba(255,255,255,0.50)" : COLORS.muted,
                      marginTop:  2,
                      lineHeight: 1,
                    }}>
                      {item.detail}
                    </div>
                  )}
                </div>

                {/* Value — slides in from right when active */}
                {item.value && (
                  <div style={{
                    fontFamily:    serifFontFamily,
                    fontSize:      24,
                    fontWeight:    900,
                    color:         accentColor,
                    letterSpacing: -0.5,
                    flexShrink:    0,
                    opacity:       valueOpacity,
                    transform:     `translateX(${valueSlide}px)`,
                  }}>
                    {item.value}
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
