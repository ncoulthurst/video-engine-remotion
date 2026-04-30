/**
 * HeroBigStat — Editorial hero-stat reveal.
 *
 * Broadcast/newsprint aesthetic: folio dateline top-left, massive serif hero
 * number left-anchored with inline italic unit, a single accent rule as the
 * one decorative device, serif italic narrative caption, optional typographic
 * comparator line (NOT a widget), and a source dateline bottom-right. A thin
 * vertical accent rule anchors the left margin.
 *
 * Cold-open camera: starts hyper-zoomed on the hero digit (scale 2.4, origin
 * at the number's left edge) and pulls back to 1.0 with ease-out-cubic. The
 * count-up runs during the zoom-out; surrounding text fades in as the camera
 * settles.
 *
 * Stack: Bg (0) → Portrait (1) → Content (10) → Grain (2, LAST in JSX).
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
  COLORS,
  SmartImg,
  WorldStateSchema,
  ContextChip,
  BadgeTreatment,
} from "./shared";

// ── Schema ────────────────────────────────────────────────────────────────────

const ComparatorSchema = z.object({
  label: z.string(),
  value: z.number().optional(),
  max:   z.number().optional(),
  kind:  z.enum(["bar", "rank", "line"]).optional().default("line"),
  total: z.number().optional(),
  rank:  z.number().optional(),
});

export const HeroBigStatPropsSchema = z.object({
  stat:        z.string().optional().default("31"),
  unit:        z.string().optional().default("goals"),
  label:       z.string().optional().default("in a single Premier League season."),
  stat2:       z.string().optional().default(""),
  unit2:       z.string().optional().default(""),
  label2:      z.string().optional().default(""),
  /** Folio dateline — split on " · " into stacked lines, newspaper-style.
   *  Convention: "{Subject} · {Club} · {Season}". If `badgeSlug` is provided,
   *  the middle (club) line is replaced by the badge SVG to break the text stack. */
  context:     z.string().optional().default("Luis Suárez · Liverpool · 2013/14"),
  /** Optional club/team badge slug — renders above the subject name in the folio. */
  badgeSlug:   z.string().optional().default(""),
  /** Optional small attribution line, bottom-right (e.g. "STATS · FBREF"). */
  source:      z.string().optional().default("stats · fbref"),
  playerImage: z.string().optional().default(""),
  accentColor: z.string().optional().default("#C8102E"),
  darkMode:    z.boolean().default(false),
  bgColor:     z.string().optional().default("#f0ece4"),
  skipIntro:   z.boolean().optional().default(false),
  comparator:  ComparatorSchema.optional(),
  worldState:  WorldStateSchema,
});
export type HeroBigStatProps = z.infer<typeof HeroBigStatPropsSchema>;

// ── Constants ─────────────────────────────────────────────────────────────────

const PORTRAIT_W    = 680;
const PORTRAIT_MASK = "linear-gradient(to right, transparent, black 350px, black 85%, transparent)";

// Entry frames — camera leads, text follows as it settles
const HERO_F       = 6;    // count-up starts
const DATELINE_F   = 26;   // folio fades in as camera drops below 1.4x
const RULE_F       = 50;
const CAPTION_F    = 64;
const COMPARE_F    = 82;
const SOURCE_F     = 96;
const PORTRAIT_F   = 2;

// Camera
const CAM_START_F   = 0;
const CAM_DUR       = 38;
const CAM_FROM      = 2.4;
const CAM_TO        = 1.0;

// Count-up
const COUNT_DUR     = 44;

// Hero typography
const HERO_SIZE     = 220;   // editorial-dominant; above guide's 180 ceiling deliberately
const HERO_SIZE_DUAL = 172;  // when a second stat is also shown
const UNIT_SIZE_FACTOR = 0.32;  // italic unit ≈ 1/3 of hero height, inline

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseStat(s: string): { prefix: string; num: number | null; suffix: string; decimals: number } {
  const m = s.match(/^(\D*)(-?\d+(?:\.\d+)?)(.*)$/);
  if (!m) return { prefix: "", num: null, suffix: s, decimals: 0 };
  const prefix = m[1] ?? "";
  const raw    = m[2] ?? "0";
  const suffix = m[3] ?? "";
  const dec    = raw.includes(".") ? (raw.split(".")[1]?.length ?? 0) : 0;
  return { prefix, num: parseFloat(raw), suffix, decimals: dec };
}

function countUp(frame: number, target: number, start: number, dur: number, decimals: number): string {
  const v = interpolate(frame, [start, start + dur], [0, target], {
    extrapolateLeft:  "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  if (decimals > 0) return v.toFixed(decimals);
  return String(Math.round(v));
}

/** Split a " · "-delimited context string into stacked folio lines. */
function parseFolio(ctx: string): string[] {
  if (!ctx) return [];
  return ctx
    .split(/\s*[·•|]\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
}

// ── Component ─────────────────────────────────────────────────────────────────

export const HeroBigStat: React.FC<HeroBigStatProps> = ({
  stat,
  unit,
  label,
  stat2,
  unit2,
  label2,
  context,
  badgeSlug,
  source,
  playerImage,
  accentColor,
  darkMode,
  bgColor,
  skipIntro = false,
  comparator,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const hasPortrait = Boolean(playerImage);
  const hasSecond   = Boolean(stat2);
  const textColor   = darkMode ? "#f5f0e8" : "#111111";
  const mutedColor  = darkMode ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.42)";

  // ── Entry springs ─────────────────────────────────────────────────────────
  const springAt = (f: number, cfg: { damping: number; stiffness: number }) =>
    skipIntro ? 1 : spring({ fps, frame: Math.max(0, frame - f), config: cfg });

  const datelineProg = springAt(DATELINE_F, { damping: 22, stiffness: 52 });
  const ruleProg     = springAt(RULE_F,     { damping: 26, stiffness: 60 });
  const captionProg  = springAt(CAPTION_F,  { damping: 22, stiffness: 52 });
  const compareProg  = springAt(COMPARE_F,  { damping: 22, stiffness: 52 });
  const sourceProg   = springAt(SOURCE_F,   { damping: 22, stiffness: 52 });
  const portraitProg = springAt(PORTRAIT_F, { damping: 28, stiffness: 55 });

  // ── Camera: hyper-zoom cold open ──────────────────────────────────────────
  const cameraScale = skipIntro
    ? 1
    : interpolate(frame, [CAM_START_F, CAM_START_F + CAM_DUR], [CAM_FROM, CAM_TO], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.cubic),
      });

  // ── Parse stats + count-up strings ────────────────────────────────────────
  const p1 = parseStat(stat);
  const p2 = parseStat(stat2);

  const heroNumStr = skipIntro || p1.num === null
    ? (p1.num !== null ? (p1.decimals > 0 ? p1.num.toFixed(p1.decimals) : String(Math.round(p1.num))) : stat)
    : countUp(frame, p1.num, HERO_F, COUNT_DUR, p1.decimals);
  const heroStr = `${p1.prefix}${heroNumStr}${p1.suffix}`;

  const secondNumStr = skipIntro || p2.num === null
    ? (p2.num !== null ? (p2.decimals > 0 ? p2.num.toFixed(p2.decimals) : String(Math.round(p2.num))) : stat2)
    : countUp(frame, p2.num ?? 0, HERO_F + 8, COUNT_DUR, p2.decimals);
  const secondStr = hasSecond ? `${p2.prefix}${secondNumStr}${p2.suffix}` : "";

  // ── Layout ────────────────────────────────────────────────────────────────
  const contentLeft  = hasPortrait ? 748 : 140;
  const contentRight = 140;

  // Hero sizing — shrink for longer strings so it doesn't overflow the column
  const heroStrLen = heroStr.replace(/[,.\s]/g, "").length;
  const baseHeroSize = hasSecond ? HERO_SIZE_DUAL : HERO_SIZE;
  const heroSize = heroStrLen >= 6 ? Math.round(baseHeroSize * 0.68)
                  : heroStrLen >= 5 ? Math.round(baseHeroSize * 0.78)
                  : heroStrLen >= 4 ? Math.round(baseHeroSize * 0.88)
                  :                   baseHeroSize;
  const unitSize = Math.round(heroSize * UNIT_SIZE_FACTOR);

  const folioLines = parseFolio(context);

  // Camera transform origin — pin to the hero number's left edge so the
  // cold-open zoom reads as "pulling back from the digit" rather than a
  // center squeeze.
  const originX = contentLeft + 10;
  const originY = 540;  // vertical center of the hero row (approx)

  return (
    <AbsoluteFill style={{ fontFamily, overflow: "hidden" }}>
      {/* Z-0  background */}
      {darkMode ? <DarkBackground color={bgColor} /> : <PaperBackground color={bgColor} />}

      {/* Z-1  masked portrait (canonical §5) */}
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
            src={playerImage}
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

      {/* Z-10  camera-scaled content plane */}
      <div style={{
        position:        "absolute",
        inset:           0,
        zIndex:          10,
        transform:       `scale(${cameraScale})`,
        transformOrigin: `${originX}px ${originY}px`,
      }}>
        {/* Folio dateline — top-left, byline-style:
              subject in large serif italic (the editorial anchor)
              ↓ tiny accent tab marker
              dateline in small sans caps (club · season)
            Aligned to badge top so they share a header baseline. */}
        {folioLines.length > 0 && (() => {
          const subject = folioLines[0];
          const dateParts = folioLines.slice(1);
          const dateline  = dateParts.join("  ·  ");
          return (
            <div style={{
              position:  "absolute",
              left:      contentLeft,
              top:       200,
              opacity:   interpolate(datelineProg, [0, 0.6], [0, 1], { extrapolateRight: "clamp" }),
              transform: `translateY(${interpolate(datelineProg, [0, 1], [8, 0], { extrapolateRight: "clamp" })}px)`,
            }}>
              {/* Subject — serif italic, the dominant byline */}
              <div style={{
                fontFamily:    serifFontFamily,
                fontStyle:     "italic",
                fontWeight:    500,
                fontSize:      44,
                letterSpacing: -1,
                lineHeight:    1,
                color:         textColor,
              }}>
                {subject}
              </div>
              {/* Tiny accent tab marker — anchors subject to dateline */}
              <div style={{
                width:      36,
                height:     3,
                background: accentColor,
                marginTop:  18,
                marginBottom: 14,
              }} />
              {/* Dateline — small caps, supporting */}
              {dateline && (
                <ContextChip label={dateline} color={mutedColor} size={12} />
              )}
            </div>
          );
        })()}

        {/* Club badge — top-right credential, broadcast-scale (140px) */}
        {badgeSlug && (
          <div style={{
            position:  "absolute",
            right:     contentRight,
            top:       180,
            opacity:   interpolate(datelineProg, [0, 0.6], [0, 1], { extrapolateRight: "clamp" }),
            transform: `translateY(${interpolate(datelineProg, [0, 1], [8, 0], { extrapolateRight: "clamp" })}px)`,
          }}>
            <BadgeTreatment src={`badges/${badgeSlug}`} size={140} />
          </div>
        )}

        {/* Hero row — serif number + inline italic unit, baseline-aligned */}
        <div style={{
          position:   "absolute",
          left:       contentLeft,
          top:        380,
          display:    "flex",
          alignItems: "baseline",
          gap:        hasSecond ? 48 : 24,
        }}>
          {/* Primary stat */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 22 }}>
            <div style={{
              fontFamily:    serifFontFamily,
              fontSize:      heroSize,
              fontWeight:    900,
              color:         textColor,
              letterSpacing: -7,
              lineHeight:    1,
              fontFeatureSettings: '"lnum" 1, "tnum" 1',
            }}>
              {heroStr}
            </div>
            {unit && (
              <div style={{
                fontFamily:    serifFontFamily,
                fontSize:      unitSize,
                fontWeight:    400,
                fontStyle:     "italic",
                color:         textColor,
                opacity:       0.78,
                letterSpacing: -1,
                lineHeight:    1,
              }}>
                {unit}
              </div>
            )}
          </div>

          {/* Optional second stat — vs/ layout, same baseline, smaller */}
          {hasSecond && (
            <>
              <div style={{
                fontFamily,
                fontSize:      20,
                fontWeight:    700,
                letterSpacing: 3,
                textTransform: "uppercase" as const,
                color:         mutedColor,
                alignSelf:     "center",
                marginBottom:  Math.round(heroSize * 0.3),
              }}>
                vs.
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
                <div style={{
                  fontFamily:    serifFontFamily,
                  fontSize:      Math.round(heroSize * 0.7),
                  fontWeight:    900,
                  color:         textColor,
                  letterSpacing: -5,
                  lineHeight:    1,
                  opacity:       0.7,
                  fontFeatureSettings: '"lnum" 1, "tnum" 1',
                }}>
                  {secondStr}
                </div>
                {unit2 && (
                  <div style={{
                    fontFamily:    serifFontFamily,
                    fontSize:      Math.round(heroSize * 0.7 * UNIT_SIZE_FACTOR),
                    fontStyle:     "italic",
                    fontWeight:    400,
                    color:         textColor,
                    opacity:       0.55,
                    letterSpacing: -0.5,
                  }}>
                    {unit2}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Accent rule — the ONE decorative device */}
        <div style={{
          position:   "absolute",
          left:       contentLeft,
          top:        380 + heroSize + 40,
          width:      interpolate(ruleProg, [0, 1], [0, 200], { extrapolateRight: "clamp" }),
          height:     3,
          background: accentColor,
        }} />

        {/* Caption — serif italic narrative clause */}
        {(label || label2) && (
          <div style={{
            position:      "absolute",
            left:          contentLeft,
            top:           380 + heroSize + 80,
            maxWidth:      hasPortrait ? 900 : 1100,
            fontFamily:    serifFontFamily,
            fontStyle:     "italic",
            fontWeight:    400,
            fontSize:      32,
            lineHeight:    1.28,
            letterSpacing: -0.3,
            color:         textColor,
            opacity:       interpolate(captionProg, [0, 0.6], [0, 0.9], { extrapolateRight: "clamp" }),
            transform:     `translateY(${interpolate(captionProg, [0, 1], [10, 0], { extrapolateRight: "clamp" })}px)`,
          }}>
            {label}
            {hasSecond && label2 ? (
              <span style={{ color: mutedColor, fontFamily, fontStyle: "normal", fontSize: 20 }}>
                {"   ·   "}
              </span>
            ) : null}
            {hasSecond && label2 ? label2 : null}
          </div>
        )}

        {/* Comparator — typographic pull-line, not a widget */}
        {comparator && (
          <ComparatorLine
            data={comparator}
            top={380 + heroSize + 80 + 92}
            left={contentLeft}
            accentColor={accentColor}
            textColor={textColor}
            mutedColor={mutedColor}
            prog={compareProg}
          />
        )}

        {/* Source attribution — bottom-right dateline */}
        {source && (
          <div style={{
            position:      "absolute",
            right:         contentRight,
            bottom:        80,
            opacity:       interpolate(sourceProg, [0, 0.6], [0, 1], { extrapolateRight: "clamp" }),
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

// ── ComparatorLine — editorial typographic callout ────────────────────────────
// Not a bar, not a dot-scale. Just a line of serif italic prose with an
// accent-coloured number embedded, prefixed by an em-dash, sitting on a
// thin horizontal tick anchored to the left margin.

const ComparatorLine: React.FC<{
  data: z.infer<typeof ComparatorSchema>;
  top: number;
  left: number;
  accentColor: string;
  textColor: string;
  mutedColor: string;
  prog: number;
}> = ({ data, top, left, accentColor, mutedColor, prog }) => {
  const op    = interpolate(prog, [0, 0.6], [0, 1], { extrapolateRight: "clamp" });
  const shift = interpolate(prog, [0, 1],   [8, 0], { extrapolateRight: "clamp" });
  const tickW = interpolate(prog, [0, 0.7], [0, 36], { extrapolateRight: "clamp" });

  // Rank mode: "— #1 of 98 strikers in Europe's top five leagues"
  // Line mode (default): "— {label}: {value}"
  const isRank = data.kind === "rank" && data.total !== undefined && data.rank !== undefined;

  return (
    <div style={{
      position:  "absolute",
      left,
      top,
      opacity:   op,
      transform: `translateY(${shift}px)`,
      display:   "flex",
      alignItems:"baseline",
      gap:       14,
      maxWidth:  900,
    }}>
      {/* Tick — thin horizontal line, not an arrow or bar */}
      <div style={{
        width:      tickW,
        height:     2,
        background: accentColor,
        alignSelf:  "center",
        marginRight: 4,
      }} />

      <div style={{
        fontFamily:    serifFontFamily,
        fontStyle:     "italic",
        fontWeight:    400,
        fontSize:      22,
        lineHeight:    1.4,
        letterSpacing: -0.2,
        color:         mutedColor,
      }}>
        {isRank ? (
          <>
            <span style={{ color: accentColor, fontWeight: 800, fontStyle: "normal" }}>#{data.rank}</span>
            {` of ${data.total} · `}
            <span>{data.label}</span>
          </>
        ) : (
          <>
            <span>{data.label}</span>
            {data.value !== undefined ? (
              <>
                <span style={{ color: mutedColor, margin: "0 10px" }}>—</span>
                <span style={{ color: accentColor, fontWeight: 800, fontStyle: "normal" }}>{data.value}</span>
              </>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
};
