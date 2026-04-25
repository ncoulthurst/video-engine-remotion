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
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { CalculateMetadataFunction } from "remotion";
import { z } from "zod";
import { fontFamily, serifFontFamily, Grain, PaperBackground, DarkBackground, COLORS, SPRINGS, WorldStateSchema} from "./shared";

// ══════════════════════════════════════════════════════════════════════════════
// SCHEMA
// ══════════════════════════════════════════════════════════════════════════════

const ItemSchema = z.object({
  name:   z.string().optional().default(""),
  detail: z.string().optional().default(""),
  value:  z.string().optional().default(""),
  color:  z.string().optional().default(""),
});

export const CountdownRevealPropsSchema = z.object({
  title:       z.string().optional().default("Top 10"),
  subtitle:    z.string().optional().default(""),
  items:       z.array(ItemSchema).default(() => [
    { name: "Alan Shearer",        detail: "1993/94 season", value: "31 goals", color: "" },
    { name: "Andrew Cole",         detail: "1993/94 season", value: "34 goals", color: "" },
    { name: "Kevin Phillips",      detail: "1999/00 season", value: "30 goals", color: "" },
    { name: "Cristiano Ronaldo",   detail: "2007/08 season", value: "31 goals", color: "" },
    { name: "Luis Suárez",         detail: "2013/14 season", value: "31 goals", color: "" },
    { name: "Mohamed Salah",       detail: "2017/18 season", value: "32 goals", color: "" },
    { name: "Thierry Henry",       detail: "2002/03 season", value: "24 goals", color: "" },
    { name: "Harry Kane",          detail: "2016/17 season", value: "29 goals", color: "" },
    { name: "Erling Haaland",      detail: "2022/23 season", value: "36 goals", color: "" },
    { name: "Robbie Fowler",       detail: "1995/96 season", value: "28 goals", color: "" },
  ]),
  accentColor: z.string().optional().default(""),
  teamColor:   z.string().optional().default(""),
  bgColor:     z.string().optional().default("#f0ece4"),
  darkMode:    z.boolean().default(false),
  dwellFrames: z.number().default(90),
  worldState: WorldStateSchema.optional(),
  skipIntro: z.boolean().optional().default(false),
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

const ACCENT_FALLBACK = "#C9A84C"; // neutral gold — used when no teamColor / accentColor / worldState supplied

export const CountdownReveal: React.FC<CountdownRevealProps> = ({
  title,
  subtitle,
  items,
  accentColor,
  teamColor,
  bgColor,
  darkMode,
  dwellFrames,
  worldState,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const n = items.length;

  // Accent priority: explicit teamColor → explicit accentColor → worldState accent → neutral gold
  const wsAccent = (worldState as { accentColor?: string } | undefined)?.accentColor;
  const resolvedAccent = (teamColor && teamColor !== "")
    ? teamColor
    : (accentColor && accentColor !== "")
      ? accentColor
      : (wsAccent && wsAccent !== "")
        ? wsAccent
        : ACCENT_FALLBACK;

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
  // OUTRO_ZOOM is set so the full list (n items × stride) fits inside the
  // available area BELOW the masthead. With header occupying y≈72→180, the
  // safe area is roughly y=200→1060 (~860px). The list world-height is
  // n*ITEM_H + (n-1)*GAP, so we shrink to fit with a small margin.
  const SAFE_TOP    = 200;
  const SAFE_BOTTOM = 1060;
  const SAFE_H      = SAFE_BOTTOM - SAFE_TOP;
  const totalListH  = n * ITEM_H + (n - 1) * GAP;
  const OUTRO_ZOOM  = Math.min(1.0, (SAFE_H - 24) / totalListH); // 24px margin

  const zoomInProg  = clamp01(spring({ frame, fps, config: { damping: 28, stiffness: 42 } }));
  const zoom        = 1 + (ZOOM_IN_VAL - 1) * zoomInProg - (ZOOM_IN_VAL - OUTRO_ZOOM) * zoomOutProg;
  const clampedZoom = Math.max(OUTRO_ZOOM, Math.min(ZOOM_IN_VAL, zoom));

  // Camera target Y — during reveal phase, push downward so active item
  // sits below the masthead. During outro, recenter to the safe area so
  // the full ranked list is symmetrical between header and frame edge.
  const VIEW_CENTER_REVEAL = SCREEN_H / 2 + 110;
  const VIEW_CENTER_OUTRO  = (SAFE_TOP + SAFE_BOTTOM) / 2;
  const viewCenterY = interpolate(zoomOutProg, [0, 1], [VIEW_CENTER_REVEAL, VIEW_CENTER_OUTRO]);

  const tx = SCREEN_W / 2 - SCREEN_W / 2 * clampedZoom;   // items are horizontally centered
  const ty = viewCenterY - finalPanY * clampedZoom;

  // ── Header ────────────────────────────────────────────────────────────────
  // Stacked top-left masthead — visible the entire composition. Single
  // clean ease-out fade-in, then stays put. The leaderboard camera target
  // is pushed downward (VIEW_CENTER_Y) so the active item sits below the
  // header instead of behind it.
  const headerVisible = clamp01(interpolate(frame, [0, 22], [0, 1], { easing: Easing.out(Easing.cubic), extrapolateRight: "clamp" }));
  const headerOffsetY = interpolate(headerVisible, [0, 1], [-12, 0]);

  return (
    <AbsoluteFill>
      {darkMode ? <DarkBackground /> : <PaperBackground color={bgColor} />}
      <Grain />

      {/* Top-left masthead — stacked editorial folio:
            subtitle (small caps) → title (serif italic) → accent rule */}
      <div style={{
        position:   "absolute",
        top:        72,
        left:       96,
        zIndex:     30,
        opacity:    headerVisible,
        transform:  `translateY(${headerOffsetY}px)`,
      }}>
        {subtitle && (
          <div style={{
            fontFamily,
            fontSize:      12,
            fontWeight:    700,
            letterSpacing: 3.5,
            textTransform: "uppercase" as const,
            color:         darkMode ? "rgba(255,255,255,0.55)" : COLORS.muted,
            marginBottom:  14,
            lineHeight:    1,
          }}>
            {subtitle}
          </div>
        )}
        <div style={{
          fontFamily:    serifFontFamily,
          fontStyle:     "italic",
          fontSize:      52,
          fontWeight:    900,
          color:         textColor,
          letterSpacing: -1.5,
          lineHeight:    1,
        }}>
          {title}
        </div>
        <div style={{
          width:        interpolate(headerVisible, [0, 1], [0, 48]),
          height:       3,
          background:   resolvedAccent,
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
        {items.map((item, i) => {
          if (!itemRevealed(i)) return null;

          const s        = n - 1 - i;  // reveal step for this item
          const rf       = revealFrame(s);
          const itemProg = clamp01(spring({ frame: frame - rf, fps, config: SPRINGS.feature }));
          const as       = itemActive(i);
          const mutedMult = 0.28 + 0.72 * as;

          const rankNum  = i + 1;
          const itemY    = topOffset + i * ITEM_STRIDE;

          // Per-item accent — each row drives its own colour (Aston Villa
          // claret, Everton blue, etc.) when supplied, else the global default.
          const itemAccent = (item.color && item.color !== "") ? item.color : resolvedAccent;

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
              {/* Accent bar — left edge, per-item colour, grows with active state */}
              <div style={{
                position:     "absolute",
                left:         0,
                top:          12,
                bottom:       12,
                width:        barW,
                background:   itemAccent,
                borderRadius: 3,
                boxShadow:    `0 0 10px 2px ${itemAccent}55`,
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
                {/* Rank number — driven by per-item accent */}
                <div style={{
                  fontFamily:    serifFontFamily,
                  fontSize:      38,
                  fontWeight:    900,
                  color:         itemAccent,
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

                {/* Value — per-item accent, slides in from right when active */}
                {item.value && (
                  <div style={{
                    fontFamily:    serifFontFamily,
                    fontSize:      24,
                    fontWeight:    900,
                    color:         itemAccent,
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
