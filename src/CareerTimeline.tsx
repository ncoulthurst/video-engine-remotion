/**
 * CareerTimeline — Editorial career-rail of a player's clubs.
 *
 * Broadcast/newsprint aesthetic per STYLE_GUIDE §0–§10:
 *   • Folio dateline top-left: serif italic subject (44px) + 36×3 accent tab
 *     + small-caps dateline ("CAREER · 2008–2024") — same anchor pattern as
 *     HeroBigStat.
 *   • A single accent rule (the timeline rail) is the ONE decorative device.
 *   • The rail draws on via stroke-dashoffset / pathLength={1} —
 *     Easing.out(Easing.cubic) per §6.
 *   • Club nodes stagger along the rail with 16-frame gaps, each composing
 *     opacity + translateY off a medium spring.
 *   • Active-state spring accumulation (`onProg - offProg`) drives focus —
 *     the subject club node grows, gets the accent ring + a thicker tick;
 *     all other nodes sit muted at 0.30 opacity. No hard cuts.
 *   • Camera: gentle horizontal pan toward the focus club. Spring-driven
 *     lateral shift, clamped, lets the rail world drift behind the folio.
 *   • Source attribution bottom-right (small-caps).
 *   • Z-stack: Bg (0) → portrait (1) → Grain (2 LAST in JSX) → Content (10).
 *
 * Backwards-compatible schema. New OPTIONAL props (all default safely):
 *   accentColor, bgColor, subjectImage, source, dateline, darkMode.
 */
import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";
import {
  fontFamily,
  serifFontFamily,
  Grain,
  PaperBackground,
  DarkBackground,
  SmartImg,
  WorldStateSchema,
  ContextChip,
  BadgeTreatment,
} from "./shared";

// ── Schema ────────────────────────────────────────────────────────────────────

export const TimelineEventSchema = z.object({
  year:        z.string().optional().default(""),
  club:        z.string().optional().default(""),
  badgeSlug:   z.string().optional().default(""),
  clubColor:   z.string().optional().default(""),
  detail:      z.string().optional().default(""),
  isHighlight: z.boolean().default(false),
});

export const CareerTimelinePropsSchema = z.object({
  playerName:   z.string(),
  events:       z.array(TimelineEventSchema),
  activeIndex:  z.number().default(-1),
  startFrame:   z.number().default(40),
  skipIntro:    z.boolean().optional().default(false),

  // Optional editorial enrichment (engine may set; rendering does not require)
  accentColor:  z.string().optional().default("#C8102E"),
  bgColor:      z.string().optional().default("#f0ece4"),
  darkMode:     z.boolean().optional().default(false),
  subjectImage: z.string().optional().default(""),     // NEW: optional left portrait
  source:       z.string().optional().default(""),     // NEW: small-caps attribution bottom-right
  dateline:     z.string().optional().default(""),     // NEW: small-caps dateline below subject.
                                                       //      Auto-derived from event years if empty.
  worldState:   WorldStateSchema.optional(),
});

export type TimelineEvent       = z.infer<typeof TimelineEventSchema>;
export type CareerTimelineProps = z.infer<typeof CareerTimelinePropsSchema>;

// ── Constants ─────────────────────────────────────────────────────────────────

const PORTRAIT_W    = 680;
const PORTRAIT_MASK = "linear-gradient(to right, transparent, black 350px, black 85%, transparent)";

// Entry timing
const FOLIO_F     = 6;
const RULE_F      = 24;     // accent tab marker
const RAIL_F      = 30;     // rail draw-on starts
const RAIL_DUR    = 36;
const NODES_F     = 56;     // first node entry
const NODE_GAP    = 16;     // stagger between nodes
const SOURCE_F    = 110;
const PORTRAIT_F  = 4;

// Camera: subtle horizontal pan toward focus club, after the rail settles
const CAM_DELAY   = 80;
const CAM_DUR     = 36;
const CAM_AMOUNT  = 60;     // px lateral drift; small, cinematic, not a scroll

// Rail geometry
const RAIL_Y_FRAC     = 0.56;
const RAIL_LEFT_FRAC  = 0.07;
const RAIL_RIGHT_FRAC = 0.94;

// Node sizing
const NODE_R            = 9;
const NODE_R_ACTIVE     = 14;
const RING_R_BASE       = 26;
const BADGE_SIZE        = 96;
const BADGE_SIZE_ACTIVE = 116;

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Derive a dateline like "CAREER · 2008–2024" from the events array. */
function deriveDateline(events: TimelineEvent[]): string {
  const years: number[] = [];
  for (const e of events) {
    const m = (e.year || "").match(/(\d{4})/g);
    if (m) for (const y of m) years.push(parseInt(y, 10));
  }
  if (years.length === 0) return "CAREER";
  const lo = Math.min(...years);
  const hi = Math.max(...years);
  if (lo === hi) return `CAREER · ${lo}`;
  return `CAREER · ${lo}–${hi}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const CareerTimeline: React.FC<CareerTimelineProps> = ({
  playerName,
  events,
  activeIndex,
  startFrame,
  skipIntro    = false,
  accentColor  = "#C8102E",
  bgColor      = "#f0ece4",
  darkMode     = false,
  subjectImage = "",
  source       = "",
  dateline     = "",
}) => {
  const frame = useCurrentFrame();
  const { fps, width: W, height: H } = useVideoConfig();

  const N        = Math.max(0, events.length);
  const focusIdx = activeIndex ?? -1;
  const sf       = startFrame ?? 40;

  const textColor       = darkMode ? "#f5f0e8" : "#111111";
  const mutedColor      = darkMode ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.42)";
  const railBaseCol     = darkMode ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.16)";
  const inactiveOpacity = 0.30;

  const hasPortrait = Boolean(subjectImage);

  // ── Entry springs ─────────────────────────────────────────────────────────
  const springAt = (f: number, cfg: { damping: number; stiffness: number; mass?: number }) =>
    skipIntro ? 1 : spring({ fps, frame: Math.max(0, frame - f), config: cfg });

  const folioProg    = springAt(FOLIO_F,    { damping: 22, stiffness: 52 });
  const ruleProg     = springAt(RULE_F,     { damping: 26, stiffness: 60 });
  const sourceProg   = springAt(SOURCE_F,   { damping: 22, stiffness: 52 });
  const portraitProg = springAt(PORTRAIT_F, { damping: 28, stiffness: 55 });

  // Rail draw-on — eased, not a spring (per §6 draw-on pattern).
  const railProg = skipIntro
    ? 1
    : interpolate(frame, [RAIL_F, RAIL_F + RAIL_DUR], [0, 1], {
        extrapolateLeft:  "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.cubic),
      });

  // ── Per-node entry & active-state ─────────────────────────────────────────
  const nodeRevealF = (i: number) => NODES_F + i * NODE_GAP;

  /** Node entry: opacity 0→1 + translateY 14→0 driven by medium spring. */
  const nodeEntry = (i: number): { op: number; ty: number } => {
    if (skipIntro) return { op: 1, ty: 0 };
    const p = spring({
      fps,
      frame: Math.max(0, frame - nodeRevealF(i)),
      config: { damping: 22, stiffness: 52 },
    });
    return {
      op: interpolate(p, [0, 1], [0, 1], { extrapolateRight: "clamp" }),
      ty: interpolate(p, [0, 1], [14, 0], { extrapolateRight: "clamp" }),
    };
  };

  /**
   * Active-state spring accumulation per §6:
   *   onProg - offProg, where:
   *     - "on" rises when the narration arrives at the focus moment
   *       (frame ≥ startFrame).
   *     - "off" never falls in this template (single focus subject).
   *
   * Result: only the focusIdx node accumulates focus to 1.0; all others
   * sit at the inactive baseline (0.30 dim).
   */
  const focusAccum = skipIntro
    ? 1
    : spring({ fps, frame: Math.max(0, frame - sf), config: { damping: 22, stiffness: 52 } });

  const activeState = (i: number): number => {
    if (focusIdx < 0) return 0;
    return i === focusIdx ? Math.max(0, focusAccum) : 0;
  };

  // ── Camera: gentle horizontal pan toward the focus node ───────────────────
  // Pan left (-x) if focus is in the right half, right (+x) if left half —
  // so the focused node drifts toward the centre of frame.
  const camProg = skipIntro
    ? 1
    : interpolate(frame, [CAM_DELAY, CAM_DELAY + CAM_DUR], [0, 1], {
        extrapolateLeft:  "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.cubic),
      });
  const focusFrac    = N > 1 && focusIdx >= 0 ? focusIdx / (N - 1) : 0.5;
  const camDirection = focusFrac > 0.5 ? -1 : 1;
  const cameraX      = focusIdx >= 0 ? camDirection * CAM_AMOUNT * camProg : 0;

  // ── Rail geometry ─────────────────────────────────────────────────────────
  const railY     = Math.round(H * RAIL_Y_FRAC);
  const railLeft  = hasPortrait
    ? Math.max(Math.round(W * RAIL_LEFT_FRAC), PORTRAIT_W - 30)
    : Math.round(W * RAIL_LEFT_FRAC);
  const railRight = Math.round(W * RAIL_RIGHT_FRAC);
  const railSpan  = Math.max(0, railRight - railLeft);
  const nodeXs: number[] = N <= 1
    ? [Math.round((railLeft + railRight) / 2)]
    : events.map((_, i) => Math.round(railLeft + (railSpan * i) / (N - 1)));

  // ── Folio dateline (auto-derive if not provided) ──────────────────────────
  const datelineText = (dateline && dateline.trim().length > 0)
    ? dateline.trim()
    : deriveDateline(events);

  // ── Layout ────────────────────────────────────────────────────────────────
  const folioLeft = hasPortrait ? 748 : 130;
  const folioTop  = 110;

  return (
    <AbsoluteFill style={{ fontFamily, overflow: "hidden" }}>
      {/* Z-0  background */}
      {darkMode ? <DarkBackground color={bgColor} /> : <PaperBackground color={bgColor} />}

      {/* Z-1  optional masked portrait (canonical §5) */}
      {hasPortrait && (
        <div
          style={{
            position:        "absolute",
            left:            skipIntro
              ? 0
              : interpolate(portraitProg, [0, 1], [-PORTRAIT_W * 0.55, 0], {
                  extrapolateLeft: "clamp", extrapolateRight: "clamp",
                }),
            top:             0,
            width:           PORTRAIT_W,
            height:          "100%",
            overflow:        "hidden",
            opacity:         portraitProg * 0.88,
            WebkitMaskImage: PORTRAIT_MASK,
            maskImage:       PORTRAIT_MASK,
            zIndex:          1,
          }}
        >
          <SmartImg
            src={subjectImage}
            style={{
              width:          "100%",
              height:         "110%",
              objectFit:      "cover",
              objectPosition: "top center",
              display:        "block",
            }}
          />
          <div style={{
            position:"absolute", bottom:0, left:0, right:0, height:380,
            background:`linear-gradient(to top, ${bgColor} 0%, ${bgColor} 16%, transparent 100%)`,
            pointerEvents:"none",
          }} />
          <div style={{
            position:"absolute", top:0, left:0, right:0, height:70,
            background:`linear-gradient(to bottom, ${bgColor} 0%, transparent 100%)`,
            pointerEvents:"none",
          }} />
        </div>
      )}

      {/* Z-10  content plane (camera-panned) */}
      <div style={{
        position:  "absolute",
        inset:     0,
        zIndex:    10,
        transform: `translateX(${cameraX}px)`,
      }}>
        {/* ── Folio top-left: serif italic subject + accent tab + dateline ─── */}
        <div style={{
          position:  "absolute",
          left:      folioLeft,
          top:       folioTop,
          opacity:   interpolate(folioProg, [0, 0.6], [0, 1], { extrapolateRight: "clamp" }),
          transform: `translateY(${interpolate(folioProg, [0, 1], [10, 0], { extrapolateRight: "clamp" })}px)`,
          zIndex:    30,
        }}>
          {/* Subject — serif italic, 44px, the editorial anchor */}
          <div style={{
            fontFamily:    serifFontFamily,
            fontStyle:     "italic",
            fontWeight:    500,
            fontSize:      44,
            letterSpacing: -1,
            lineHeight:    1,
            color:         textColor,
          }}>
            {playerName}
          </div>
          {/* 36×3 accent tab — the marker between subject and dateline */}
          <div style={{
            width:        interpolate(ruleProg, [0, 1], [0, 36], { extrapolateRight: "clamp" }),
            height:       3,
            background:   accentColor,
            marginTop:    18,
            marginBottom: 14,
          }} />
          {/* Small-caps dateline */}
          <ContextChip label={datelineText} color={mutedColor} size={12} />
        </div>

        {/* ── Timeline rail (the ONE decorative device) ────────────────────
            SVG so we can use stroke-dashoffset draw-on per §7 */}
        <svg
          width={W}
          height={H}
          style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        >
          {/* Base rail — drawn on with pathLength={1} */}
          <line
            x1={railLeft}
            y1={railY}
            x2={railRight}
            y2={railY}
            stroke={railBaseCol}
            strokeWidth={2}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - railProg}
          />

          {/* Subject-club accent overlay on the rail span up to & through
              the focus node — emphasises the focused club without using
              a second decorative rule (the rail itself is the device). */}
          {focusIdx >= 0 && nodeXs[focusIdx] !== undefined && (
            <line
              x1={railLeft}
              y1={railY}
              x2={nodeXs[focusIdx]}
              y2={railY}
              stroke={accentColor}
              strokeWidth={2.5}
              strokeLinecap="round"
              opacity={Math.min(1, focusAccum) * 0.85 * railProg}
            />
          )}

          {/* Per-node ticks — short verticals where the badge meets the rail */}
          {events.map((_, i) => {
            const ne      = nodeEntry(i);
            const as      = activeState(i);
            const isFocus = i === focusIdx;
            const tickH   = isFocus ? 22 : 12;
            const tickColor = isFocus
              ? accentColor
              : (darkMode ? "rgba(255,255,255,0.30)" : "rgba(0,0,0,0.28)");
            const tickOp = ne.op * (isFocus ? (0.55 + 0.45 * as) : inactiveOpacity);
            const x      = nodeXs[i] ?? 0;
            return (
              <line
                key={`tick-${i}`}
                x1={x}
                y1={railY - tickH}
                x2={x}
                y2={railY + tickH}
                stroke={tickColor}
                strokeWidth={isFocus ? 2.5 : 1.5}
                strokeLinecap="round"
                opacity={tickOp}
              />
            );
          })}
        </svg>

        {/* ── Per-node content (badge above rail, year + club + detail below) ── */}
        {events.map((event, i) => {
          const ne      = nodeEntry(i);
          const as      = activeState(i);
          const isFocus = i === focusIdx;
          const x       = nodeXs[i] ?? 0;

          // Active accumulation drives: scale up, opacity up, badge size up.
          const baseOp  = isFocus ? 1 : inactiveOpacity;
          const opacity = ne.op * (isFocus ? interpolate(as, [0, 1], [0.55, 1]) : inactiveOpacity);
          const scale   = 1 + (isFocus ? as * 0.06 : 0);

          const badgeSize = isFocus
            ? interpolate(as, [0, 1], [BADGE_SIZE, BADGE_SIZE_ACTIVE])
            : BADGE_SIZE;
          const nodeR     = isFocus
            ? interpolate(as, [0, 1], [NODE_R, NODE_R_ACTIVE])
            : NODE_R;
          const ringR     = RING_R_BASE + as * 8;

          // Badge sits just ABOVE the rail; year + club + detail BELOW
          const badgeTop = railY - 26 - badgeSize;
          const labelTop = railY + 36;

          // Type sizes — focus node is denser/larger
          const yearSize   = isFocus ? 22 : 18;
          const clubSize   = isFocus ? 30 : 22;
          const detailSize = isFocus ? 14 : 12;

          // Active node breathing ring — sin permitted on timeline node glow only (§7)
          const breath = isFocus ? Math.sin(frame * 0.12) * 1.5 : 0;

          return (
            <React.Fragment key={i}>
              {/* Active-node glow ring (focus only) */}
              {isFocus && (
                <svg
                  width={W}
                  height={H}
                  style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 11 }}
                >
                  <circle
                    cx={x}
                    cy={railY}
                    r={(ringR + breath) * Math.max(0, ne.op)}
                    fill="none"
                    stroke={accentColor}
                    strokeWidth={1.5}
                    opacity={0.32 * Math.max(0, as) * ne.op}
                  />
                </svg>
              )}

              {/* Badge above rail */}
              <div style={{
                position:        "absolute",
                left:            x - badgeSize / 2,
                top:             badgeTop,
                opacity,
                transform:       `translateY(${ne.ty}px) scale(${scale})`,
                transformOrigin: "50% 100%",
                zIndex:          12,
                filter:          isFocus ? "none" : (darkMode ? "none" : "saturate(0.7)"),
              }}>
                <BadgeTreatment src={`badges/${event.badgeSlug}`} size={badgeSize} />
              </div>

              {/* Node dot on the rail (accent on focus, ink-muted otherwise) */}
              <svg
                width={W}
                height={H}
                style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 13 }}
              >
                <circle
                  cx={x}
                  cy={railY}
                  r={nodeR * Math.max(0, ne.op)}
                  fill={isFocus ? accentColor : (darkMode ? "#f5f0e8" : "#111111")}
                  opacity={isFocus ? opacity : (ne.op * inactiveOpacity * 1.6)}
                />
                {/* Inner radio-button dot on focus only, per §7 */}
                {isFocus && (
                  <circle
                    cx={x}
                    cy={railY}
                    r={Math.max(0, nodeR * 0.38) * Math.max(0, ne.op)}
                    fill={bgColor}
                    opacity={opacity}
                  />
                )}
              </svg>

              {/* Below-rail labels: year (sans caps) → club (serif) → detail (sans) */}
              <div style={{
                position:        "absolute",
                left:            x - 200,
                top:             labelTop,
                width:           400,
                opacity,
                transform:       `translateY(${ne.ty}px) scale(${scale})`,
                transformOrigin: "50% 0%",
                textAlign:       "center",
                zIndex:          12,
              }}>
                {/* Year — small caps */}
                <div style={{
                  fontFamily,
                  fontSize:      yearSize - 4,
                  fontWeight:    700,
                  letterSpacing: 2.5,
                  textTransform: "uppercase" as const,
                  color:         isFocus ? accentColor : mutedColor,
                  lineHeight:    1,
                  marginBottom:  10,
                }}>
                  {event.year}
                </div>

                {/* Club — serif, BLACK ink (per "hero numbers/labels always BLACK ink") */}
                <div style={{
                  fontFamily:    serifFontFamily,
                  fontWeight:    900,
                  fontSize:      clubSize,
                  letterSpacing: -0.5,
                  color:         isFocus ? textColor : mutedColor,
                  lineHeight:    1.05,
                }}>
                  {event.club}
                </div>

                {/* Detail (e.g. "82 goals · 133 apps") */}
                {event.detail && (
                  <div style={{
                    fontFamily,
                    fontSize:      detailSize,
                    fontWeight:    500,
                    letterSpacing: 0.4,
                    color:         mutedColor,
                    marginTop:     8,
                    lineHeight:    1.35,
                    opacity:       baseOp + (isFocus ? 0.4 * as : 0),
                  }}>
                    {event.detail}
                  </div>
                )}
              </div>
            </React.Fragment>
          );
        })}

        {/* ── Source attribution bottom-right ─────────────────────────────── */}
        {source && (
          <div style={{
            position:      "absolute",
            right:         130,
            bottom:        80,
            opacity:       interpolate(sourceProg, [0, 0.6], [0, 1], { extrapolateRight: "clamp" }),
            zIndex:        30,
          }}>
            <ContextChip label={source} color={mutedColor} size={12} />
          </div>
        )}
      </div>

      {/* Z-2  Grain — LAST in JSX per §2 */}
      <div style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none" }}>
        <Grain />
      </div>
    </AbsoluteFill>
  );
};
