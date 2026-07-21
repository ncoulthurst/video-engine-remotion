/**
 * HeroAwardsList — Editorial year-by-year award history.
 *
 * Layout (1920×1080, paper bg):
 *   • LEFT 680px  — masked portrait of the subject (canonical §5).
 *   • RIGHT col   — folio top-left (serif italic award name + accent tab +
 *                   small caps dateline) → subject name in massive black
 *                   serif → hero count-up of total wins → single accent rule
 *                   → vertical year list with active-state pan + dim.
 *   • Bottom-right source attribution.
 *
 * Motion (§6):
 *   • Portrait slides in from -55% width on a panel spring.
 *   • Hero wins count-up uses Easing.out(Easing.cubic) over ~26f.
 *   • Camera does a slow vertical pan down the year list (continuous focus).
 *   • Each row uses active-state spring accumulation (onProg - offProg) so
 *     the currently-narrated year is full-ink and others muted to ~0.32.
 *   • Stagger 18f between row reveals (§6 catalog: 14–20f window).
 *
 * Z-order:  Bg(0) → Portrait(1) → Content(10) → Grain(2, LAST in JSX).
 *
 * Use for: Ballon d'Or, Golden Boot, PFA POTY, Champions League winners, etc.
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
  COLORS,
  SmartImg,
  WorldStateSchema,
  ContextChip,
} from "./shared";
import { Ground, EASE, prog } from "./lib/kit";

// ── Schema ────────────────────────────────────────────────────────────────────

const AwardYearSchema = z.object({
  year:     z.string(),
  winner:   z.string(),
  /** The entity being documented — highlighted if they won this year. */
  entity:   z.string().default(""),
  /** Ranking of the entity that year (1 = winner). */
  position: z.number().default(0),
  /** Extra context (club, votes, goals). */
  detail:   z.string().default(""),
});

export const HeroAwardsListPropsSchema = z.object({
  award:        z.string().default("Ballon d'Or"),
  entityName:   z.string().default("Lionel Messi"),
  /** Subject portrait (filename in /public). Canonical §5 left-side mask. */
  subjectImage: z.string().optional(),
  /**
   * Legacy alias — older render manifests wrote this prop name. Kept in the
   * Zod schema as a silent backward-compat fallback so old projects still
   * find their portrait. NEW code should write `subjectImage` only and the
   * Studio editor exposes only `subjectImage`.
   */
  entityImage:  z.string().optional(),
  /** Award trophy image — small icon shown beside winning rows. */
  awardImage:   z.string().optional(),
  accentColor:  z.string().default("#C9A84C"),
  /** Optional club tint applied to the accent rule + hero count when set. */
  clubColor:    z.string().optional(),
  bgColor:      z.string().default("#f0ece4"),
  /** Folio dateline shown under the award name (e.g. "1956 — present"). */
  dateline:     z.string().optional(),
  /** Bottom-right attribution (e.g. "FRANCE FOOTBALL · ARCHIVE"). */
  source:       z.string().optional(),
  stagger:      z.number().default(18),
  holdDuration: z.number().default(40),
  years: z.array(AwardYearSchema).optional(),
  worldState: WorldStateSchema.optional(),
  skipIntro: z.boolean().optional().default(false),
});
export type HeroAwardsListProps = z.infer<typeof HeroAwardsListPropsSchema>;

// ── Constants ─────────────────────────────────────────────────────────────────

const SCREEN_W = 1920;
const SCREEN_H = 1080;

const PORTRAIT_W    = 680;
const PORTRAIT_MASK =
  "linear-gradient(to right, transparent, black 350px, black 85%, transparent)";

// Right content column
const CONTENT_X     = 760;
const CONTENT_RIGHT = 120;
const CONTENT_W     = SCREEN_W - CONTENT_X - CONTENT_RIGHT; // ~1040

// Vertical rhythm
const FOLIO_TOP   = 96;
const NAME_TOP    = FOLIO_TOP + 110;     // serif italic 44 + tab + dateline ≈ 110
const HERO_TOP    = NAME_TOP + 110;      // 82px name + spacing
const RULE_TOP    = HERO_TOP + 200;      // hero number block ≈ 200 tall
const LIST_TOP    = RULE_TOP + 56;
const ROW_H       = 64;

// Animation timing (frames)
const PORTRAIT_F  = 2;
const FOLIO_F     = 18;
const NAME_F      = 30;
const HERO_F      = 44;
const HERO_DUR    = 26;
const RULE_F      = HERO_F + HERO_DUR + 4;
const LIST_F      = RULE_F + 6;          // first row reveals just after the rule lands
const SOURCE_F    = LIST_F + 30;

// Active-state spring config
const AS_CFG = { damping: 22, stiffness: 52 };

function clamp01(v: number) { return Math.max(0, Math.min(1, v)); }

// ── Component ─────────────────────────────────────────────────────────────────

export const HeroAwardsList: React.FC<HeroAwardsListProps> = ({
  award,
  entityName,
  subjectImage,
  entityImage,
  awardImage,
  accentColor,
  clubColor,
  bgColor,
  dateline,
  source,
  stagger,
  holdDuration,
  years: yearsProp,
  skipIntro = false,
}) => {
  const frame   = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const years = yearsProp ?? [];
  const N     = years.length;

  // Resolve portrait source — `subjectImage` is the canonical prop; fall
  // back to the legacy `entityImage` so older render manifests still work.
  const portraitSrc = subjectImage || entityImage || "";
  const hasPortrait = Boolean(portraitSrc);

  // Effective accent — clubColor takes precedence when explicitly provided
  const effAccent = (clubColor && clubColor !== "") ? clubColor : accentColor;

  // Subject's wins
  const isSubjectWin = (y: { winner: string; entity: string; position: number }): boolean =>
    (y.winner === entityName) || (y.entity === entityName && y.position === 1);
  const wins = years.filter(isSubjectWin).length;

  const textColor  = COLORS.primary;          // #111
  const mutedColor = "rgba(0,0,0,0.42)";
  const inactiveOp = 0.32;

  // ── Spring helper ──────────────────────────────────────────────────────────
  const springAt = (f: number, _cfg?: { damping: number; stiffness: number }) =>
    skipIntro ? 1 : prog(frame, f, 24, EASE.soft);

  // ── Portrait entrance (panel spring, slides in from left) ──────────────────
  const portraitProg = springAt(PORTRAIT_F, { damping: 28, stiffness: 55 });
  const portraitX  = skipIntro ? 0 : interpolate(portraitProg, [0, 1], [-PORTRAIT_W * 0.55, 0]);
  const portraitOp = skipIntro ? 1 : interpolate(portraitProg, [0, 0.25], [0, 1], { extrapolateRight: "clamp" });

  // ── Folio + name + accent rule ─────────────────────────────────────────────
  const folioProg = springAt(FOLIO_F, { damping: 22, stiffness: 52 });
  const nameProg  = springAt(NAME_F,  { damping: 22, stiffness: 52 });
  const ruleProg  = springAt(RULE_F,  { damping: 26, stiffness: 60 });
  const sourceProg = springAt(SOURCE_F, { damping: 22, stiffness: 52 });

  // ── Hero count-up: 0 → wins on Easing.out(Easing.cubic) ────────────────────
  const heroCount = skipIntro
    ? wins
    : Math.round(
        interpolate(frame, [HERO_F, HERO_F + HERO_DUR], [0, wins], {
          extrapolateLeft:  "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        }),
      );
  const heroOp = skipIntro
    ? 1
    : interpolate(frame, [HERO_F - 4, HERO_F + 6], [0, 1], {
        extrapolateLeft:  "clamp",
        extrapolateRight: "clamp",
      });

  // ── Spotlight carousel ─────────────────────────────────────────────────────
  // The list reads as: "here's who won this year, now next year, now next…"
  // To make that legible, we use a SPOTLIGHT pattern instead of an ambient
  // pan. One row sits in a fixed centre band at a time; the camera glides
  // smoothly to the next row at each step, the active row scales up and
  // hits full ink, and inactive rows dim to a stable floor. The viewer's
  // focus is unambiguous: "the row in the centre band is what we're on".
  //
  // FRAMES_PER_ROW: the dwell cadence. Each row spends this many frames in
  // the spotlight. We use the existing `stagger` knob (sane default 18f)
  // but lift it to a more readable rhythm (≥ 28f) so each year actually
  // gets read before we move on.
  const FRAMES_PER_ROW = Math.max(28, stagger + 10);
  const SETTLE_FRAMES  = 12;            // time the camera takes to glide into a new spot
  const lastIdx        = Math.max(0, N - 1);

  const elapsed = Math.max(0, frame - LIST_F);
  // Fractional active index — clamps at the last row, never overshoots.
  const activeIdxRaw = skipIntro ? lastIdx : Math.min(lastIdx, elapsed / FRAMES_PER_ROW);
  const activeIdxInt = Math.min(lastIdx, Math.floor(activeIdxRaw));

  // Smoothed camera index — easing only happens during the SETTLE window
  // between rows; otherwise the camera holds steady so the eye can read.
  const stepFrac = skipIntro
    ? 1
    : Math.max(0, Math.min(1, (elapsed - activeIdxInt * FRAMES_PER_ROW) / SETTLE_FRAMES));
  const easedStepFrac = skipIntro ? 1 : Easing.out(Easing.cubic)(stepFrac);
  const cameraIdx = Math.min(lastIdx, activeIdxInt + easedStepFrac);

  // ── Layout constants for the visible window of the year list ──────────────
  // The list lives inside a window we mask with a soft fade top/bottom so
  // the carousel doesn't reveal sudden cut-offs at the rule or source line.
  const LIST_WINDOW_H = SCREEN_H - LIST_TOP - 110;  // leaves room for source
  const SPOTLIGHT_Y   = LIST_WINDOW_H / 2 - ROW_H / 2;  // centre of the window
  // Camera offset = put the active row at SPOTLIGHT_Y in the list inner.
  const cameraY = SPOTLIGHT_Y - cameraIdx * ROW_H;

  // Per-row "active-ness" — 1 when sitting in the spotlight, fades with
  // distance. Subject wins get a persistent bonus so they always feel
  // present in the timeline even when not the active row.
  const rowActive = (i: number): number => {
    if (skipIntro) return i === lastIdx ? 1 : 0;
    const dist = Math.abs(i - cameraIdx);
    // Active band is ±0.5 from the spotlight; falls off over 1 row.
    return Math.max(0, 1 - dist * 1.6);
  };
  // Entrance window — rows below the spotlight slide up + fade in as the
  // camera approaches them, instead of just popping into view. Each row gets
  // a clean ~22-frame entrance that completes ~1 row before reaching the
  // spotlight. Fully-revealed rows (already past the spotlight) stay at 1.
  const rowEntered = (i: number): number => {
    if (skipIntro) return 1;
    // distAhead < 0 = row already passed (above spotlight) → fully revealed
    // distAhead = 0   = row IS the active spotlight row
    // distAhead > 0   = row hasn't reached spotlight yet
    const distAhead = i - cameraIdx;
    if (distAhead <= 0) return 1;
    // Reveal window: fade in across ~1.5 rows of approach distance.
    return clamp01(1 - distAhead / 1.5);
  };

  // Avoid the "unused durationInFrames" lint while keeping it in scope for
  // anyone tuning camera timing later. Kept intentionally:
  void durationInFrames;

  return (
    <Ground ground="paper" bgColor={bgColor} accentColor={accentColor} domain="football" texture skipIntro={skipIntro} pad={0} style={{ fontFamily, padding: 0 }}>

      {/* Z-1 — masked portrait (canonical §5) */}
      {hasPortrait && (
        <div style={{
          position:        "absolute",
          left:            portraitX,
          top:             0,
          width:           PORTRAIT_W,
          height:          "100%",
          overflow:        "hidden",
          opacity:         portraitOp * 0.88,
          WebkitMaskImage: PORTRAIT_MASK,
          maskImage:       PORTRAIT_MASK,
          zIndex:          1,
        }}>
          <SmartImg
            src={portraitSrc}
            style={{
              width:          "100%",
              height:         "110%",
              objectFit:      "cover",
              objectPosition: "top center",
              filter:         "contrast(1.05) brightness(1.02)",
              display:        "block",
            }}
          />
          {/* Bottom vignette — dissolves feet into bg */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            height:   380,
            background: `linear-gradient(to top, ${bgColor} 0%, ${bgColor} 16%, transparent 100%)`,
            pointerEvents: "none",
          }} />
          {/* Top vignette — softens crown */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0,
            height:   70,
            background: `linear-gradient(to bottom, ${bgColor} 0%, transparent 100%)`,
            pointerEvents: "none",
          }} />
        </div>
      )}

      {/* Z-10 — editorial content column */}
      <div style={{ position: "absolute", inset: 0, zIndex: 10 }}>

        {/* Folio top-left of column — serif italic award + accent tab + dateline */}
        <div style={{
          position:  "absolute",
          left:      CONTENT_X,
          top:       FOLIO_TOP,
          opacity:   skipIntro ? 1 : interpolate(folioProg, [0, 0.6], [0, 1], { extrapolateRight: "clamp" }),
          transform: `translateY(${skipIntro ? 0 : interpolate(folioProg, [0, 1], [10, 0])}px)`,
        }}>
          <div style={{
            fontFamily:    serifFontFamily,
            fontStyle:     "italic",
            fontWeight:    500,
            fontSize:      44,
            letterSpacing: -1,
            lineHeight:    1,
            color:         textColor,
          }}>
            {award}
          </div>
          {/* Accent tab — the canonical 36×3 marker */}
          <div style={{
            width:        36,
            height:       3,
            background:   effAccent,
            marginTop:    18,
            marginBottom: 14,
          }} />
          {/* Dateline — small caps */}
          <ContextChip
            label={dateline ?? `${N} editions  ·  ${wins} ${wins === 1 ? "win" : "wins"}`}
            color={mutedColor}
            size={12}
          />
        </div>

        {/* Subject name — large black serif, the hero anchor */}
        <div style={{
          position:  "absolute",
          left:      CONTENT_X,
          top:       NAME_TOP,
          maxWidth:  CONTENT_W,
          opacity:   skipIntro ? 1 : interpolate(nameProg, [0, 0.6], [0, 1], { extrapolateRight: "clamp" }),
          transform: `translateY(${skipIntro ? 0 : interpolate(nameProg, [0, 1], [12, 0])}px)`,
        }}>
          <div style={{
            fontFamily:    serifFontFamily,
            fontSize:      82,
            fontWeight:    900,
            color:         textColor,
            letterSpacing: -3,
            lineHeight:    1,
          }}>
            {entityName}
          </div>
        </div>

        {/* Hero count-up — massive serif italic number + small caps "wins" */}
        <div style={{
          position:   "absolute",
          left:       CONTENT_X,
          top:        HERO_TOP,
          display:    "flex",
          alignItems: "baseline",
          gap:        24,
          opacity:    heroOp,
        }}>
          <div style={{
            fontFamily:    serifFontFamily,
            fontStyle:     "italic",
            fontSize:      168,
            fontWeight:    900,
            color:         textColor,
            letterSpacing: -6,
            lineHeight:    1,
            fontFeatureSettings: '"lnum" 1, "tnum" 1',
          }}>
            {heroCount}
          </div>
          <div style={{ paddingBottom: 16 }}>
            <ContextChip label={wins === 1 ? "win" : "wins"} color={mutedColor} size={18} />
          </div>
        </div>

        {/* Single accent rule — the ONE decorative device */}
        <div style={{
          position:   "absolute",
          left:       CONTENT_X,
          top:        RULE_TOP,
          width:      skipIntro ? 220 : interpolate(ruleProg, [0, 1], [0, 220], { extrapolateRight: "clamp" }),
          height:     3,
          background: effAccent,
        }} />

        {/* Year list — spotlight carousel: active row sits in the centre band,
            camera glides smoothly to the next year. Window is mask-faded
            top/bottom so rows enter/exit softly. */}
        <div style={{
          position: "absolute",
          left:     CONTENT_X,
          top:      LIST_TOP,
          width:    CONTENT_W,
          height:   LIST_WINDOW_H,
          overflow: "hidden",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0px, black 64px, black calc(100% - 64px), transparent 100%)",
          maskImage:
            "linear-gradient(to bottom, transparent 0px, black 64px, black calc(100% - 64px), transparent 100%)",
        }}>
          {/* Spotlight indicator — fixed, marks the active band so the viewer
              has an unambiguous focal point. Sits BEHIND the rows. */}
          <div style={{
            position:   "absolute",
            left:       0,
            right:      0,
            top:        SPOTLIGHT_Y - 6,
            height:     ROW_H + 12,
            background: "rgba(0,0,0,0.045)",
            borderTop:    "1px solid rgba(0,0,0,0.10)",
            borderBottom: "1px solid rgba(0,0,0,0.10)",
            pointerEvents: "none",
          }} />
          {/* Spotlight accent stub on the left margin */}
          <div style={{
            position:   "absolute",
            left:       0,
            top:        SPOTLIGHT_Y + ROW_H / 2 - 12,
            width:      4,
            height:     24,
            background: effAccent,
            borderRadius: 2,
            pointerEvents: "none",
          }} />

          <div style={{
            position:  "absolute",
            left:      0,
            top:       0,
            width:     "100%",
            transform: `translateY(${cameraY}px)`,
          }}>
            {years.map((y, i) => {
              const enteredProg = rowEntered(i);
              if (!skipIntro && enteredProg < 0.001) return null;

              const as    = rowActive(i);
              const isWin = isSubjectWin(y);
              const yearTop = i * ROW_H;

              // Active row pops via FONT SCALE + ink, not a CSS transform —
              // transform: scale was pushing the right-most column past the
              // mask edge and clipping the detail text on the first row.
              const yearSize   = 28 + as * 4;     // 28 → 32
              const winnerSize = (isWin ? 22 : 18) + as * 3;
              const detailSize = 13 + as * 1;

              const inkBase   = isWin ? 1 : 0.32;
              const inkBoost  = as * (isWin ? 0 : 0.55);
              const rowOpacity = skipIntro
                ? (isWin ? 1 : 0.32)
                : Math.min(1, enteredProg * (inkBase + inkBoost));

              // Entrance lift — rows slide up from below as they enter.
              const distAhead = Math.max(0, i - cameraIdx);
              const entranceY = skipIntro ? 0 : Math.min(28, distAhead * 18);

              // Subject wins always show in accent year + bold winner name.
              const yearColor   = isWin ? effAccent : mutedColor;
              const winnerColor = isWin ? textColor : `rgba(17,17,17,${0.42 + as * 0.45})`;
              const detailColor = isWin ? mutedColor : `rgba(17,17,17,${0.30 + as * 0.30})`;

              // Tick — accent rule that grows when this row is in the spotlight
              const tickW = interpolate(as, [0, 1], [isWin ? 14 : 0, 28], { extrapolateRight: "clamp" });

              return (
                <div
                  key={i}
                  style={{
                    position:    "absolute",
                    left:        0,
                    top:         yearTop,
                    width:       "100%",
                    paddingRight: 12,                  // protect against right-edge clip
                    boxSizing:   "border-box" as const,
                    height:      ROW_H,
                    opacity:     rowOpacity,
                    transform:   `translateY(${entranceY}px)`,
                    display:     "flex",
                    alignItems:  "center",
                    gap:         18,
                  }}
                >
                  {/* Active tick — accent micro-rule on the left margin */}
                  <div style={{
                    width:      tickW,
                    height:     2,
                    background: effAccent,
                    flexShrink: 0,
                  }} />

                  {/* Year — serif italic, scales with active state */}
                  <div style={{
                    fontFamily:    serifFontFamily,
                    fontStyle:     "italic",
                    fontSize:      yearSize,
                    fontWeight:    700,
                    color:         yearColor,
                    letterSpacing: -0.5,
                    minWidth:      80,
                    flexShrink:    0,
                    lineHeight:    1,
                  }}>
                    {y.year}
                  </div>

                  {/* Winner name — sans for body legibility */}
                  <div style={{
                    fontFamily,
                    fontSize:   winnerSize,
                    fontWeight: isWin ? 700 : 500,
                    color:      winnerColor,
                    letterSpacing: -0.1,
                    flex:       1,
                    minWidth:   0,
                    whiteSpace: "nowrap",
                    overflow:   "hidden",
                    textOverflow: "ellipsis",
                    lineHeight: 1.1,
                  }}>
                    {y.winner}
                  </div>

                  {/* Trophy icon — only when subject won */}
                  {isWin && (
                    awardImage
                      ? <SmartImg
                          src={awardImage}
                          style={{
                            width:    26,
                            height:   26,
                            objectFit:"contain",
                            flexShrink: 0,
                            opacity:  0.92,
                          }}
                        />
                      : <TrophyMark color={effAccent} />
                  )}

                  {/* Detail — small sans, right-aligned. Generous min-width
                      so club names like "Real Madrid" never ellipsis. */}
                  {y.detail && (
                    <div style={{
                      fontFamily,
                      fontSize:      detailSize,
                      fontWeight:    500,
                      color:         detailColor,
                      letterSpacing: 0.2,
                      flexShrink:    0,
                      minWidth:      170,
                      maxWidth:      220,
                      textAlign:     "right" as const,
                      lineHeight:    1.2,
                      whiteSpace:    "nowrap" as const,
                      overflow:      "hidden",
                      textOverflow:  "ellipsis",
                    }}>
                      {y.detail}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Source attribution — bottom-right small caps */}
        {source && (
          <div style={{
            position:  "absolute",
            right:     CONTENT_RIGHT,
            bottom:    72,
            opacity:       skipIntro ? 1 : interpolate(sourceProg, [0, 0.6], [0, 1], { extrapolateRight: "clamp" }),
          }}>
            <ContextChip label={source} color={mutedColor} size={12} />
          </div>
        )}
      </div>

      {/* Z-2 — Grain LAST in JSX per §2, pointerEvents:none */}
    </Ground>
  );
};

// ── TrophyMark — tiny SVG cup used when no awardImage is supplied ────────────

const TrophyMark: React.FC<{ color: string }> = ({ color }) => (
  <svg width={22} height={26} viewBox="0 0 22 26" fill="none" style={{ flexShrink: 0 }}>
    <path d="M5 2h12v7a6 6 0 01-12 0V2z" fill={color} opacity={0.92} />
    <path
      d="M8 15.5h6M11 15.5V18.5M8.5 18.5h5"
      stroke={color}
      strokeWidth="1.4"
      strokeLinecap="round"
    />
    <path
      d="M5 4H2.5v2.5A2.5 2.5 0 005 9"
      stroke={color}
      strokeWidth="1.3"
      strokeLinecap="round"
    />
    <path
      d="M17 4h2.5v2.5A2.5 2.5 0 0117 9"
      stroke={color}
      strokeWidth="1.3"
      strokeLinecap="round"
    />
  </svg>
);
