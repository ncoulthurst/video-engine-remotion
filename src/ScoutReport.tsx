/**
 * ScoutReport — Editorial scouting dossier on a single player.
 *
 * Broadcast-documentary aesthetic (BBC / 30-for-30 / The Athletic). Paper
 * background + Grain. Left: 680px masked portrait (canonical §5). Right:
 * folio top-left (serif italic byline + accent tab + small caps dateline),
 * subject name in massive black serif, meta row, single accent rule, then
 * scouting attributes — label (sans uppercase, tracked) + animated bar fill
 * (spring + ease-out-cubic) + numeric value (serif italic, count-up). Slow
 * camera zoom on the whole plane gives the §6 camera movement.
 *
 * Active-state spring accumulation (`onProg - offProg`) — as each attribute
 * reveals, the prior dims to a 0.30 floor. Stagger 16 frames per attribute.
 *
 * Z-order: Bg (0) → Portrait (1) → Content (10) → Grain (last in JSX).
 *
 * Backward-compatible schema with the prior dark-card ScoutReport. New
 * optional props: playerImageSlug / portraitSrc, competition, clubColor,
 * badgeSlug, source, dateline, attributes (alias of metrics, with optional
 * `category` per row). `lightMode` is retained but ignored — paper is the
 * only mode this template renders now.
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
  COLORS,
  SmartImg,
  WorldStateSchema,
} from "./shared";

// ══════════════════════════════════════════════════════════════════════════════
// SCHEMA — backward compatible
// ══════════════════════════════════════════════════════════════════════════════

const MetricSchema = z.object({
  label:    z.string().optional().default(""),
  value:    z.string().optional().default(""),
  detail:   z.string().optional().default(""),    // e.g., "in 38 appearances"
  bar:      z.number().min(0).max(100).optional(),// 0–100 percentile bar
  category: z.string().optional(),                // optional grouping label
});

export const ScoutReportPropsSchema = z.object({
  // — Subject identity —
  playerName:      z.string().optional().default("Ollie Watkins"),
  origin:          z.string().optional().default("Exeter City"),
  league:          z.string().optional().default("EFL League Two"),
  competition:     z.string().optional().default(""),         // alias of `league`
  signingFee:      z.string().optional().default("£1.8m"),
  signingYear:     z.string().optional().default("2017"),
  playerAge:       z.number().optional().default(21),
  dateline:        z.string().optional().default(""),         // override dateline

  // — Headline / footer —
  headline:        z.string().optional().default("25 goals in 35 Championship apps"),
  headlineStat:    z.string().optional().default("25"),
  headlineUnit:    z.string().optional().default("goals"),
  source:          z.string().optional().default("scouting · internal report"),

  // — Visual identity —
  accentColor:     z.string().optional().default("#C8102E"),
  clubColor:       z.string().optional().default(""),         // tints rule/tab if set
  bgColor:         z.string().optional().default("#f0ece4"),
  badgeSlug:       z.string().optional().default(""),

  // — Portrait (NEW) —
  playerImageSlug: z.string().optional().default(""),
  portraitSrc:     z.string().optional().default(""),         // alias of playerImageSlug

  // — Data —
  metrics:         z.array(MetricSchema).optional().default([
    { label: "Goals",        value: "25",   detail: "Championship 19/20",     bar: 92, category: "ATTACKING" },
    { label: "Assists",      value: "7",    detail: "same season",            bar: 78, category: "CREATING" },
    { label: "Shots/90",     value: "3.4",  detail: "top 5% in league",       bar: 96, category: "ATTACKING" },
    { label: "Dribbles/90",  value: "2.1",  detail: "direct runner",          bar: 85, category: "CREATING" },
    { label: "Pace",         value: "88",   detail: "elite acceleration",     bar: 90, category: "PHYSICAL" },
    { label: "Aerial duels", value: "62%",  detail: "above average for #9",   bar: 70, category: "PHYSICAL" },
  ]),
  attributes:      z.array(MetricSchema).optional(),          // alias of `metrics`

  // — Engine flags —
  lightMode:       z.boolean().optional().default(true),      // retained for back-compat; ignored
  worldState:      WorldStateSchema.optional(),
  skipIntro:       z.boolean().optional().default(false),
});

export type ScoutReportProps = z.infer<typeof ScoutReportPropsSchema>;

// ══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════════════════════════════

const PORTRAIT_W   = 680;
const PORTRAIT_MASK =
  "linear-gradient(to right, transparent, black 350px, black 85%, transparent)";

// Content layout (canvas 1920×1080)
const CONTENT_X    = 760;     // portrait width + ~80px gap
const CONTENT_TOP  = 200;     // matches folio top in IntrcptBigStat
const CONTENT_W    = 1080;    // 1920 - 760 - 80 right margin

// Animation timing (frames @ 30fps)
const PORTRAIT_F   = 2;
const FOLIO_F      = 18;
const NAME_F       = 28;
const META_F       = 44;
const RULE_F       = 56;
const ATTR_START_F = 70;
const ATTR_STAGGER = 16;       // §6 stagger 14–20

// Spring configs (§6)
const ON_CFG       = { damping: 22, stiffness: 52 };
const PANEL_CFG    = { damping: 28, stiffness: 55 };

// ══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════════════════

function clamp01(v: number) { return Math.max(0, Math.min(1, v)); }

/** WCAG relative luminance from a #RRGGBB hex string. Returns 1 on parse failure. */
function getLuminance(hex: string): number {
  const h = String(hex || "").replace(/^#/, "").trim();
  if (h.length < 6) return 1;
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  if ([r, g, b].some(Number.isNaN)) return 1;
  const lin = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** Parse a leading number from a value string (e.g. "£1.8m", "62%", "25"). */
function parseLeadingNumber(s: string): { prefix: string; num: number | null; suffix: string; decimals: number } {
  const m = String(s).match(/^(\D*)(-?\d+(?:\.\d+)?)(.*)$/);
  if (!m) return { prefix: "", num: null, suffix: String(s), decimals: 0 };
  const prefix   = m[1] ?? "";
  const raw      = m[2] ?? "0";
  const suffix   = m[3] ?? "";
  const decimals = raw.includes(".") ? (raw.split(".")[1]?.length ?? 0) : 0;
  return { prefix, num: parseFloat(raw), suffix, decimals };
}

/** Count-up display string driven by a 0–1 progress. */
function formatCountUp(value: string, progress: number): string {
  const p = parseLeadingNumber(value);
  if (p.num === null) return value;
  const v = p.num * progress;
  const n = p.decimals > 0 ? v.toFixed(p.decimals) : String(Math.round(v));
  return `${p.prefix}${n}${p.suffix}`;
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

export const ScoutReport: React.FC<ScoutReportProps> = ({
  playerName,
  origin,
  league,
  competition,
  signingFee,
  signingYear,
  playerAge,
  dateline,
  headline,
  headlineStat,
  headlineUnit,
  source,
  accentColor,
  clubColor,
  bgColor,
  badgeSlug,
  playerImageSlug,
  portraitSrc,
  metrics,
  attributes,
  skipIntro = false,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // ── Resolve aliased props ─────────────────────────────────────────────────
  const portrait    = playerImageSlug || portraitSrc || "";
  const hasPortrait = Boolean(portrait);
  const attrs       = (attributes && attributes.length ? attributes : metrics) ?? [];
  const safeAttrs   = attrs.slice(0, 6);          // hard cap — readability
  const compLabel   = competition || league || "";

  // ── Contrast-aware palette ────────────────────────────────────────────────
  // Engine may pass a team color (Liverpool red, Everton blue, Villa purple)
  // as bgColor. Derive every ink/divider/bar tint from that so the report
  // remains readable regardless of the team. When the bg is dark, the
  // accent rule + tab fall back to a contrasting cream if the supplied
  // accent is too close in luminance to the background.
  const bgLum    = getLuminance(bgColor);
  const bgIsDark = bgLum < 0.5;
  // Dark-bg labels need to read prominently — bumped up vs the previous
  // soft-cream values which felt washed out against deep team colours.
  const inkColor      = bgIsDark ? "#ffffff" : COLORS.primary;
  const inkSubtle     = bgIsDark ? "rgba(255,255,255,0.92)" : "rgba(0,0,0,0.78)";
  const inkMid        = bgIsDark ? "rgba(255,255,255,0.95)" : "rgba(0,0,0,0.62)";
  const inkMuted      = bgIsDark ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.45)";
  const inkDim        = bgIsDark ? "rgba(255,255,255,0.68)" : "rgba(0,0,0,0.40)";
  const dividerColor  = bgIsDark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.08)";
  const barBgColor    = bgIsDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.07)";
  const tickColor     = bgIsDark ? "#ffffff" : COLORS.primary;

  // Pick the accent: explicit clubColor > accentColor > team-aware default.
  // If the chosen accent is too close to the background luminance to read,
  // swap to a contrasting cream/red (the rule has to be visible).
  const supplied = clubColor || accentColor || "";
  const ruleColor = (() => {
    if (!supplied) return bgIsDark ? "#E8D9A5" : "#C8102E";
    const diff = Math.abs(getLuminance(supplied) - bgLum);
    if (diff < 0.18) return bgIsDark ? "#E8D9A5" : "#111";
    return supplied;
  })();

  // Dateline: prefer explicit `dateline` prop; else editorial default.
  const datelineText = dateline
    ? dateline
    : [
        "SCOUT REPORT",
        origin,
        compLabel,
        signingYear ? `signed ${signingYear}` : "",
      ].filter(Boolean).join("  ·  ").toUpperCase();

  // ── Entry springs ─────────────────────────────────────────────────────────
  const springAt = (f: number, cfg: { damping: number; stiffness: number }) =>
    skipIntro ? 1 : clamp01(spring({ fps, frame: frame - f, config: cfg }));

  const portraitProg = springAt(PORTRAIT_F, PANEL_CFG);
  const folioProg    = springAt(FOLIO_F,    ON_CFG);
  const nameProg     = springAt(NAME_F,     PANEL_CFG);
  const metaProg     = springAt(META_F,     ON_CFG);
  const ruleProg     = springAt(RULE_F,     ON_CFG);

  // Portrait slide-in from -55% width (§5)
  const portraitX  = skipIntro ? 0 : interpolate(portraitProg, [0, 1], [-PORTRAIT_W * 0.55, 0]);
  const portraitOp = skipIntro ? 1 : interpolate(portraitProg, [0, 0.25], [0, 1], { extrapolateRight: "clamp" });

  // ── Camera: slow zoom on the whole plane (§6) ─────────────────────────────
  // Linear time-progress so the zoom traverses across the whole dwell.
  const timeProg = clamp01(frame / Math.max(1, durationInFrames - 1));
  const cameraScale = skipIntro
    ? 1
    : interpolate(timeProg, [0, 1], [0.97, 1.005], {
        extrapolateLeft:  "clamp",
        extrapolateRight: "clamp",
      });

  // ── Active-state spring accumulation per §6 ───────────────────────────────
  const revealFrame = (i: number) => ATTR_START_F + i * ATTR_STAGGER;
  const activeState = (i: number): number => {
    if (skipIntro) {
      return i === safeAttrs.length - 1 ? 1 : 0.32;
    }
    const onProg  = clamp01(spring({ fps, frame: frame - revealFrame(i),     config: ON_CFG }));
    const offProg = i < safeAttrs.length - 1
      ? clamp01(spring({ fps, frame: frame - revealFrame(i + 1), config: ON_CFG }))
      : 0;
    const pure  = Math.max(0, onProg - offProg);
    const floor = onProg * 0.30;        // revealed-but-superseded floor (§4)
    return Math.max(pure, floor);
  };

  // ── Footer reveal ─────────────────────────────────────────────────────────
  const footerRevealF = ATTR_START_F + safeAttrs.length * ATTR_STAGGER + 14;
  const footerProg = springAt(footerRevealF, ON_CFG);

  return (
    <AbsoluteFill style={{ fontFamily, overflow: "hidden", background: bgColor }}>
      {/* z:0 — background: paper-textured for light bgs, flat tinted for dark team-colour bgs */}
      {bgIsDark
        ? <AbsoluteFill style={{ background: bgColor }} />
        : <PaperBackground color={bgColor} />
      }

      {/* z:1–10 — camera-scaled plane (portrait + content scale together) */}
      <AbsoluteFill style={{
        transform:       `scale(${cameraScale})`,
        transformOrigin: hasPortrait ? "30% 50%" : "center center",
      }}>
        {/* ── Portrait (canonical §5: 680px, mask, two vignettes) ─────── */}
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
              src={portrait}
              style={{
                width:          "100%",
                height:         "110%",
                objectFit:      "cover",
                objectPosition: "top center",
                display:        "block",
              }}
            />
            {/* Bottom vignette — dissolves feet into background */}
            <div style={{
              position:      "absolute",
              bottom:        0, left: 0, right: 0,
              height:        380,
              background:    `linear-gradient(to top, ${bgColor} 0%, ${bgColor} 16%, transparent 100%)`,
              pointerEvents: "none",
            }} />
            {/* Top vignette — softens crown */}
            <div style={{
              position:      "absolute",
              top:           0, left: 0, right: 0,
              height:        70,
              background:    `linear-gradient(to bottom, ${bgColor} 0%, transparent 100%)`,
              pointerEvents: "none",
            }} />
          </div>
        )}

        {/* ── Content column (right of portrait) ──────────────────────── */}
        <div style={{
          position: "absolute",
          left:     hasPortrait ? CONTENT_X : 140,
          top:      0,
          width:    hasPortrait ? CONTENT_W : 1640,
          height:   "100%",
          zIndex:   10,
        }}>
          {/* ── Folio (top-left of column) ─────────────────────────── */}
          <div style={{
            position:  "absolute",
            left:      0,
            top:       CONTENT_TOP,
            opacity:   interpolate(folioProg, [0, 0.6], [0, 1], { extrapolateRight: "clamp" }),
            transform: `translateY(${interpolate(folioProg, [0, 1], [10, 0], { extrapolateRight: "clamp" })}px)`,
          }}>
            {/* Editorial byline — serif italic */}
            <div style={{
              fontFamily:    serifFontFamily,
              fontStyle:     "italic",
              fontWeight:    500,
              fontSize:      44,
              letterSpacing: -1,
              lineHeight:    1,
              color:         inkColor,
            }}>
              The Scout&apos;s Dossier
            </div>
            {/* Tiny accent tab — the one decorative device */}
            <div style={{
              width:        36,
              height:       3,
              background:   ruleColor,
              marginTop:    18,
              marginBottom: 14,
            }} />
            {/* Dateline — small caps, sans, tracked */}
            <div style={{
              fontFamily,
              fontSize:      12,
              fontWeight:    700,
              letterSpacing: 3.5,
              textTransform: "uppercase" as const,
              color:         inkMuted,
              lineHeight:    1.2,
              maxWidth:      CONTENT_W - 220,
            }}>
              {datelineText}
            </div>
          </div>

          {/* ── Subject name overlay — large serif, BLACK ink ───────── */}
          <div style={{
            position:  "absolute",
            left:      0,
            top:       CONTENT_TOP + 130,
            opacity:   nameProg,
            transform: `translateY(${interpolate(nameProg, [0, 1], [16, 0], { extrapolateRight: "clamp" })}px)`,
            maxWidth:  CONTENT_W - 80,
          }}>
            <div style={{
              fontFamily:    serifFontFamily,
              fontSize:      82,
              fontWeight:    900,
              color:         inkColor,
              letterSpacing: -3.5,
              lineHeight:    0.96,
            }}>
              {playerName}
            </div>
          </div>

          {/* ── Meta row — origin · league · age · fee ──────────────── */}
          <div style={{
            position:   "absolute",
            left:       0,
            top:        CONTENT_TOP + 232,
            opacity:    metaProg,
            transform:  `translateY(${interpolate(metaProg, [0, 1], [10, 0], { extrapolateRight: "clamp" })}px)`,
            display:    "flex",
            alignItems: "center",
            gap:        18,
            flexWrap:   "wrap",
            maxWidth:   CONTENT_W - 80,
          }}>
            {badgeSlug && (
              <SmartImg
                src={`badges/${badgeSlug}`}
                style={{ width: 32, height: 32, objectFit: "contain", opacity: 0.9 }}
              />
            )}
            {origin && (
              <span style={{
                fontFamily, fontSize: 18, fontWeight: 600, color: inkSubtle,
              }}>
                {origin}
              </span>
            )}
            {compLabel && (
              <>
                <span style={{ width: 1, height: 16, background: dividerColor }} />
                <span style={{
                  fontFamily, fontSize: 16, fontWeight: 500, color: inkMid,
                }}>
                  {compLabel}
                </span>
              </>
            )}
            {(playerAge || playerAge === 0) && (
              <>
                <span style={{ width: 1, height: 16, background: dividerColor }} />
                <span style={{
                  fontFamily, fontSize: 13, fontWeight: 700, letterSpacing: 2.2,
                  textTransform: "uppercase" as const, color: inkMid,
                }}>
                  Age {playerAge}
                </span>
              </>
            )}
            {signingFee && (
              <>
                <span style={{ width: 1, height: 16, background: dividerColor }} />
                <span style={{
                  fontFamily, fontSize: 13, fontWeight: 700, letterSpacing: 2.2,
                  textTransform: "uppercase" as const, color: inkMid,
                }}>
                  Fee {signingFee}
                </span>
              </>
            )}
          </div>

          {/* ── Headline — italic serif, sits directly under the meta row ── */}
          {headline && (
            <div style={{
              position:  "absolute",
              left:      0,
              top:       CONTENT_TOP + 270,
              opacity:   metaProg,
              transform: `translateY(${interpolate(metaProg, [0, 1], [10, 0], { extrapolateRight: "clamp" })}px)`,
              maxWidth:  CONTENT_W - 80,
              fontFamily: serifFontFamily,
              fontStyle:  "italic",
              fontWeight: 400,
              fontSize:   22,
              color:      inkSubtle,
              letterSpacing: -0.3,
              lineHeight: 1.25,
            }}>
              {headline}
            </div>
          )}

          {/* ── Single accent rule — the one decorative device ──────── */}
          <div style={{
            position:   "absolute",
            left:       0,
            top:        CONTENT_TOP + 326,
            width:      interpolate(ruleProg, [0, 1], [0, 480], {
                          extrapolateLeft:  "clamp",
                          extrapolateRight: "clamp",
                        }),
            height:     2,
            background: ruleColor,
          }} />

          {/* ── Attribute list ──────────────────────────────────────── */}
          <div style={{
            position: "absolute",
            left:     0,
            top:      CONTENT_TOP + 356,
            width:    Math.min(CONTENT_W - 80, 980),
          }}>
            {safeAttrs.map((attr, i) => {
              const as    = activeState(i);
              const start = revealFrame(i);

              // Per-row entry (Fade-and-Rise §6.4 / Stagger §6.4)
              const entryProg = skipIntro
                ? 1
                : clamp01(spring({ fps, frame: frame - start, config: ON_CFG }));
              const entryY = interpolate(entryProg, [0, 1], [12, 0]);

              // Active-state colour mix — driven by contrast-aware tokens
              const isLead     = as > 0.55;
              const labelColor = isLead ? inkMid : inkDim;
              const valueColor = inkColor;
              const detailCol  = isLead ? inkMuted : inkDim;

              // Bar fill — ease-out cubic in sync with row reveal
              const barTarget  = typeof attr.bar === "number" ? Math.max(0, Math.min(100, attr.bar)) : 0;
              const barProgRaw = skipIntro
                ? 1
                : interpolate(frame, [start + 6, start + 6 + 24], [0, 1], {
                    extrapolateLeft:  "clamp",
                    extrapolateRight: "clamp",
                    easing: Easing.out(Easing.cubic),
                  });
              const barFillPct = barTarget * barProgRaw;

              // Numeric count-up (§6 odometer)
              const countDur  = 22;
              const countProg = skipIntro
                ? 1
                : interpolate(frame, [start + 4, start + 4 + countDur], [0, 1], {
                    extrapolateLeft:  "clamp",
                    extrapolateRight: "clamp",
                    easing: Easing.out(Easing.cubic),
                  });
              const valueText = formatCountUp(attr.value, countProg);

              // Active-state opacity ramp
              const rowOpacity = skipIntro
                ? 1
                : interpolate(as, [0, 0.35, 1], [0.0, 0.55, 1.0], {
                    extrapolateLeft:  "clamp",
                    extrapolateRight: "clamp",
                  });

              return (
                <div
                  key={i}
                  style={{
                    display:             "grid",
                    gridTemplateColumns: "minmax(180px, 220px) 1fr 140px",
                    columnGap:    28,
                    alignItems:   "baseline",
                    paddingBottom: 22,
                    marginBottom:  22,
                    borderBottom: `1px solid ${dividerColor}`,
                    opacity:      rowOpacity,
                    transform:    `translateY(${entryY}px)`,
                  }}
                >
                  {/* Label column */}
                  <div>
                    {attr.category && (
                      <div style={{
                        fontFamily:    serifFontFamily,
                        fontSize:      11,
                        fontWeight:    700,
                        letterSpacing: 2.4,
                        textTransform: "uppercase" as const,
                        color:         inkDim,
                        marginBottom:  4,
                      }}>
                        {attr.category}
                      </div>
                    )}
                    <div style={{
                      fontFamily,
                      fontSize:      13,
                      fontWeight:    700,
                      letterSpacing: 2.2,
                      textTransform: "uppercase" as const,
                      color:         labelColor,
                      marginBottom:  attr.detail ? 4 : 0,
                    }}>
                      {attr.label}
                    </div>
                    {attr.detail && (
                      <div style={{
                        fontFamily,
                        fontSize:   12,
                        fontWeight: 500,
                        color:      detailCol,
                        lineHeight: 1.3,
                      }}>
                        {attr.detail}
                      </div>
                    )}
                  </div>

                  {/* Bar column */}
                  <div style={{
                    height:    8,
                    width:     "100%",
                    background: barBgColor,
                    position:  "relative",
                    alignSelf: "center",
                  }}>
                    <div style={{
                      position:   "absolute",
                      top:        0,
                      left:       0,
                      bottom:     0,
                      width:      `${barFillPct}%`,
                      background: ruleColor,
                    }} />
                    {/* Tick mark — rule cap, no glow */}
                    {barFillPct > 0 && (
                      <div style={{
                        position:   "absolute",
                        top:        -4,
                        bottom:     -4,
                        left:       `calc(${barFillPct}% - 1px)`,
                        width:      2,
                        background: tickColor,
                        opacity:    isLead ? 0.75 : 0.30,
                      }} />
                    )}
                  </div>

                  {/* Value column — serif italic, BLACK ink */}
                  <div style={{
                    fontFamily:    serifFontFamily,
                    fontStyle:     "italic",
                    fontSize:      48,
                    fontWeight:    900,
                    color:         valueColor,
                    letterSpacing: -1.5,
                    lineHeight:    1,
                    textAlign:     "right",
                    fontFeatureSettings: '"lnum" 1, "tnum" 1',
                  }}>
                    {valueText}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </AbsoluteFill>

      {/* ── Source attribution — frame-level, bottom-right only ── */}
      {source && (
        <div style={{
          position:      "absolute",
          right:         80,
          bottom:        44,
          opacity:       footerProg,
          transform:     `translateY(${interpolate(footerProg, [0, 1], [8, 0], { extrapolateRight: "clamp" })}px)`,
          fontFamily,
          fontSize:      11,
          fontWeight:    700,
          letterSpacing: 2.8,
          textTransform: "uppercase" as const,
          color:         inkDim,
          whiteSpace:    "nowrap",
          zIndex:        12,
        }}>
          {source}
        </div>
      )}

      {/* z:2 — Grain LAST in JSX (§2) */}
      <Grain />
    </AbsoluteFill>
  );
};
