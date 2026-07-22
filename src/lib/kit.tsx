/**
 * lib/kit.tsx — THE shared design-system kit for every documentary graphics
 * template, promoted from finance/kit.tsx (roadmap item F3-core,
 * PRODUCTION_GAP_ANALYSIS.md §5): one kit, every domain, so 100+ templates
 * feel like one film.
 *
 *   • Grounds        — paper / ink / structure (the two-ground system + 1 ink token)
 *   • Accent         — one signal colour, marks exactly one thing per frame
 *   • Typography     — Geist (display/body) · Geist Mono (data/labels) · Playfair (gravity)
 *   • Spacing        — one 8px-based scale (SPACE) + generous page margins
 *   • Shadows        — shared card/pill/lift tokens (SHADOW), ground-aware
 *   • Motion         — fade-up · mask-wipe · line-draw · scale-settle · count-up ·
 *                      stagger(i) · camera-pan · beatDelay · out
 *   • Primitives     — Ground, DomainTexture, SourceTag, Kicker, ChapterNumber,
 *                      LowerThird, SectionTitle, AnimatedCounter, StatCard, GlassCard,
 *                      ChartContainer, TimelineMarker, LogoBadge, Pill, DeltaChip, RuleSweep
 *
 * NO template hardcodes a hex, a font, a spacing value, a shadow, or an easing.
 * Everything resolves from here.
 *
 * Import path from a root template:      import { EASE, fadeUp, Ground } from "./lib/kit";
 * Import path from a domain subfolder:   import { EASE, fadeUp, Ground } from "../lib/kit";
 * (finance/kit.tsx remains as a re-export shim so existing finance templates
 *  compile unchanged.)
 */
import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";
import {
  fontFamily,
  geistMonoFamily,
  serifFontFamily,
  PALETTES,
  rgbaFromHex,
  SmartImg,
  Grain as PaperWeave,
  archivoFontFamily,
  WorldStateSchema,
  type WorldState,
} from "../shared";

// ═══════════════════════════════════════════════════════════════════════════
// 1 · GROUNDS — the two-ground system (§1.1). One palette, two grounds, one accent.
// ═══════════════════════════════════════════════════════════════════════════

const P = PALETTES.paperOrange;

/** Re-export the shared alpha helper so templates import colour utils from the kit only. */
export const rgbaOf = rgbaFromHex;

/**
 * Fixed paper tokens — the warm paper ground colours, available regardless of the
 * active ground. Used when a template insets a literal paper object (a document, a
 * clipping) onto an ink ground.
 */
export const PALETTES_PAPER = {
  bg: P.bg,
  surface: P.surface,
  ink: P.ink,
  muted: P.muted,
  line: P.line,
} as const;

/** The ONE new colour the whole system depends on: the content-keyed second ground. */
export const INK_GROUND = {
  bg: "#17120E", // warm near-black
  surface: "#211915",
  ink: "#ECE7DB", // cream text on ink
  muted: "#8C857A",
  line: "rgba(236,231,219,0.09)",
} as const;

/**
 * Semantic accent overrides — fitting signal colours for specific registers.
 * The default subject accent stays burnt-orange (`P.accent`). But some registers
 * read wrong in orange: loss / debt / insolvency / collapse wants "red ink"
 * (oxblood), not a warm brand orange. Templates pass these via `accentColor` — it's
 * still exactly ONE accent per frame, just keyed to the register. No hex in a template.
 */
export const ACCENTS = {
  // "red ink" — debt, insolvency, "in the red", a collapse. A BRIGHT danger-red that
  // pops sharply on both the blue and green grounds (the earlier #D33B2C / #9B2B22
  // still read as too dark on the saturated green terminal). Distinct from the
  // burnt-orange structural accent.
  loss: "#F04438",
} as const;

/**
 * lift — mix a hex colour toward white (amt > 0) or black (amt < 0) by `amt` (0–1),
 * returned as rgba with `alpha`. Used so lighting/atmosphere derives from the ACTUAL
 * background: a lighter/darker shade of the same hue reads as gentle illumination on
 * any bg, never a foreign-coloured radial blob. Falls back to transparent if not hex.
 */
export function lift(hex: string, amt: number, alpha: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec((hex ?? "").trim());
  if (!m) return `rgba(255,255,255,0)`;
  const n = parseInt(m[1], 16);
  const target = amt >= 0 ? 255 : 0;
  const p = Math.min(1, Math.abs(amt));
  const ch = (c: number) => Math.round(c + (target - c) * p);
  const r = ch((n >> 16) & 255);
  const g = ch((n >> 8) & 255);
  const b = ch(n & 255);
  return `rgba(${r},${g},${b},${alpha})`;
}

export type Ground = "paper" | "ink" | "structure";

export interface Theme {
  ground: Ground;
  isInk: boolean;
  bg: string;
  surface: string;
  ink: string; // primary text
  muted: string; // secondary text / labels
  line: string; // hairline / divider
  accent: string; // structural signal — big graphic mass (bars, lines, ribbons, axes)
  accentSoft: string; // translucent accent — fills
  highlight: string; // editorial signal — text emphasis, ticks, source slash, image callouts
  highlightSoft: string; // translucent highlight
}

/**
 * Resolve a fully-typed Theme from a ground name + optional accent override.
 * Paper = the business · Ink = the crime · Structure = time / place / mechanics.
 */
/**
 * BRAND — the identity palette. Deep blue background, light text.
 * The three grounds are tonal shades of the same blue (default / drama-darker /
 * structure-lighter) so the whole film reads as one world. All are "dark grounds"
 * (isInk = true) → dark-ground legibility + shadows everywhere.
 */
const BRAND = {
  // Contrast pass 2026-07-22 (WeWork feedback: "no contrast, hard to read,
  // orange too faint"): grounds deepened so text/accent luminance separation
  // roughly doubles; secondary text lifted from 0.60 → 0.72 alpha.
  bg: "#073B84", // the main video background — ONE uniform blue across all grounds
  surface: "#0D4E9E", // raised cards — a lift of the bg
  ink: "#F5F5F3", // primary text — near-white
  muted: "rgba(245,245,243,0.72)", // secondary / labels — light grey
  line: "rgba(245,245,243,0.20)", // hairlines on blue
  // structural accent = orange (big graphic mass); editorial highlight = warm gold
  // (text, ticks, image callouts) — legible + premium on navy, buzz-free at small scale.
  highlight: "#E8B24A",
} as const;

/** Default structural accent on DARK grounds — a brighter orange than the
 *  paper-register #E8623A, which sat at ~1.7:1 against the deep green and read
 *  as "too faint" on every WeWork board. Explicit accentColor still wins. */
const DARK_ACCENT = "#FF7A45";

/** ALT — the alternate ground: deep green, for the dramatic `ink` register
 *  (verdict / sentence / money-flow / court). Blue = default, green = the shadow. */
const ALT = {
  bg: "#08341F", // deep forest green — near-black so cream/orange pop
  surface: "#0E4A2E", // raised cards — a lift of the green
} as const;

/** Perceived luminance (0–255) of a hex colour; NaN-safe (returns 0 on non-hex). */
function hexLuminance(hex: string): number {
  const m = /^#?([0-9a-f]{6})$/i.exec((hex ?? "").trim());
  if (!m) return 0;
  const n = parseInt(m[1], 16);
  return 0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255);
}

export function resolveTheme(
  ground: Ground = "paper",
  accentColor?: string,
  bgColor?: string,
  inkColor?: string,
  mutedColor?: string,
  highlightColor?: string,
): Theme {
  const accent = accentColor || P.accent;
  const highlight = highlightColor || BRAND.highlight;

  // A LIGHT bg override (football's warm-paper worlds, e.g. #f0ece4) flips the
  // theme to a paper register: dark ink, warm-grey muted, ink hairlines, and a
  // slightly-lifted surface derived from the actual bg. Without an override —
  // or with a dark override — behaviour is exactly the historic dark-ground
  // BRAND system, so the 34 finance templates are unaffected.
  if (bgColor && hexLuminance(bgColor) > 150) {
    return {
      ground,
      isInk: false,
      bg: bgColor,
      surface: lift(bgColor, 0.45, 1),
      ink: inkColor || PALETTES_PAPER.ink,
      muted: mutedColor || PALETTES_PAPER.muted,
      line: PALETTES_PAPER.line,
      accent,
      accentSoft: rgbaFromHex(accent, 0.16),
      highlight: highlightColor || accent,
      highlightSoft: rgbaFromHex(highlightColor || accent, 0.16),
    };
  }

  // Two registers: blue (paper/structure = default/business) and green (ink = the
  // dramatic alternate). Within each, one uniform tone — no per-ground darkening.
  const isAlt = ground === "ink";
  const darkAccent = accentColor || DARK_ACCENT;
  return {
    ground,
    isInk: true,
    bg: bgColor || (isAlt ? ALT.bg : BRAND.bg),
    surface: bgColor ? lift(bgColor, 0.12, 1) : isAlt ? ALT.surface : BRAND.surface,
    ink: inkColor || BRAND.ink,
    muted: mutedColor || BRAND.muted,
    line: BRAND.line,
    accent: darkAccent,
    accentSoft: rgbaFromHex(darkAccent, 0.16),
    highlight,
    highlightSoft: rgbaFromHex(highlight, 0.16),
  };
}

/**
 * labelColumnBg — a near-black column fill (a deep shade of the ground hue) used to
 * set a table's row-label / header column apart from the data columns. Ground-derived
 * so it stays in-family on any bg. Shared so every table treats its label rail the same.
 */
export const labelColumnBg = (t: Theme) => lift(t.bg, -0.72, 1);

// ═══════════════════════════════════════════════════════════════════════════
// 2 · TYPOGRAPHY (§1.3) — three faces, used the same way everywhere.
// ═══════════════════════════════════════════════════════════════════════════

export const TYPE = {
  /** Display / body / hero numbers. */
  sans: fontFamily,
  /** Data / labels / meta — the technical signature (UPPERCASE + tracked). */
  mono: geistMonoFamily,
  /** Editorial gravity — chapter titles, pull-quotes, closing lines. Sparingly. */
  serif: serifFontFamily,

  /** Type scale (px @ 1920×1080). */
  hero: 210, // 200–230 hero number
  display: 80, // 68–92 display title
  cardTitle: 36, // 34–40 card title
  sub: 24, // 22–28 sub / lede
  body: 19, // 18–20 body
  label: 16, // 15–18 label / mono (tracked)
  source: 15, // 14–16 source

  weight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    heavy: 800,
    black: 900,
  },
  /** letterSpacing for tracked mono labels. */
  track: 2.5,
} as const;

/**
 * TITLE_FONT — the display headline style: Archivo variable at width 125%
 * (expanded) / weight 600. Spread onto sans title elements. The width axis is
 * self-hosted (see shared.tsx `archivoFontFamily`); both the CSS `font-stretch`
 * and `font-variation-settings` are set so Chromium picks the expanded instance.
 */
export const TITLE_FONT: React.CSSProperties = {
  fontFamily: archivoFontFamily,
  fontWeight: 600,
  fontStretch: "125%",
  fontVariationSettings: '"wght" 600, "wdth" 125',
};

// ═══════════════════════════════════════════════════════════════════════════
// 3 · SPACING (§1) — one 8px-based scale + generous page margins.
// ═══════════════════════════════════════════════════════════════════════════

export const SPACE = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  /** default side margin — generous editorial gutters. */
  page: 120,
} as const;

export const RADIUS = {
  sm: 8,
  md: 14,
  lg: 20,
  pill: 999,
} as const;

/**
 * STROKE — the monoline weight scale (§1.1 "one line weight"). Every drawn LINE
 * — connectors, axes, baselines, rules, leaders, ticks — resolves its width from
 * here so the whole film reads as one instrument, never a grab-bag of 1.5 / 2.5 /
 * 3px magic numbers. `line` is THE monoline: connectors and axes share it exactly,
 * differentiated by colour/opacity, NOT width. `hair` is reserved for faint
 * background gridlines; `bar` is the chunky accent MARK (kicker rule / featured
 * spine / hero underline) — a graphic bar, not a routed line.
 */
export const STROKE = {
  hair: 1, // faint background gridlines only
  line: 2, // THE monoline — every connector · axis · baseline · rule · leader
  bar: 4, // chunky accent mark (not a "line": kicker rule / spine / underline)
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// 4 · SHADOWS — shared, ground-aware. No white glow, ever (§1.5).
// ═══════════════════════════════════════════════════════════════════════════

export const SHADOW = {
  card: "0 20px 60px rgba(28,26,21,0.10), 0 4px 16px rgba(28,26,21,0.05)",
  cardInk: "0 24px 70px rgba(0,0,0,0.45), 0 4px 16px rgba(0,0,0,0.30)",
  pill: "0 2px 10px rgba(28,26,21,0.08)",
  pillInk: "0 2px 12px rgba(0,0,0,0.40)",
  lift: "0 30px 80px rgba(28,26,21,0.14)",
  // Node shadows — directional + soft (light from above), for map nodes. Longer
  // and warmer than the default card shadow; reads as a lit object, not a chip.
  node: "0 2px 2px rgba(28,26,21,0.05), 0 24px 46px -18px rgba(28,26,21,0.28)",
  nodeInk: "0 2px 3px rgba(0,0,0,0.4), 0 26px 52px -16px rgba(0,0,0,0.62)",
} as const;

/** Pick the correct card / pill shadow for the active ground. */
export const cardShadow = (t: Theme) => (t.isInk ? SHADOW.cardInk : SHADOW.card);
export const pillShadow = (t: Theme) => (t.isInk ? SHADOW.pillInk : SHADOW.pill);

// ═══════════════════════════════════════════════════════════════════════════
// 5 · MOTION (§1.4) — the fixed vocabulary. Everything eased, never linear.
// ═══════════════════════════════════════════════════════════════════════════

export const EASE = {
  /** Default workhorse — count-ups, draws, position shifts. */
  out: Easing.out(Easing.cubic),
  /** Soft-landing hero entries. */
  soft: Easing.bezier(0.16, 1, 0.3, 1),
  /** Symmetric drift envelopes. */
  inOut: Easing.inOut(Easing.cubic),
  /** Short reveals (< 18f). */
  quad: Easing.out(Easing.quad),
  /** Snap — near-instant attack, smooth settle. Elements "pop" into frame (entries). */
  snap: Easing.out(Easing.exp),
} as const;

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/**
 * prog — the kit's canonical progress primitive: eased 0→1 over [delay, delay+dur]
 * frames, clamped both sides. Every motion helper below derives from it; exported
 * so templates and future layers (beat sheets, camera rigs) share ONE clock.
 */
export const prog = (
  frame: number,
  delay: number,
  dur: number,
  ease: (n: number) => number = EASE.out,
) =>
  clamp01(
    interpolate(frame, [delay, delay + dur], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: ease,
    }),
  );

/** stagger(i) — canonical list delay. §1.4: delay = i * gap. */
export const STAGGER_GAP = 4;
export const stagger = (i: number, gap: number = STAGGER_GAP) => i * gap;

/**
 * beatDelay — narration-anchored reveal timing (roadmap H1, the "audio anchor"
 * rule). `beats` maps a reveal role (e.g. "figure", "chart", "verdict") to the
 * SECOND (from scene start) at which the narrator names it; the element's entry
 * is scheduled 2 frames BEFORE that word lands (the reference's temporal-
 * anticipation rule — motion begins just before the phrase finishes). When no
 * beat exists for the role, the template's hand-tuned `fallbackFrames` applies,
 * so beat sheets are always optional.
 *
 *   const f = useCurrentFrame();
 *   const { fps } = useVideoConfig();
 *   const heroStyle = fadeUp(f, { delay: beatDelay(beats, "figure", fps, 8) });
 */
export function beatDelay(
  beats: Record<string, number> | undefined,
  role: string,
  fps: number,
  fallbackFrames: number,
): number {
  if (beats?.[role] === undefined) return fallbackFrames;
  // Cap the anchored delay at 3s: a late narration cue must never hold a
  // board's content back so long the scene reads as blank ground (observed
  // as multi-second green/blue empty frames in the WeWork export). Beyond
  // the cap, showing the element early beats showing nothing.
  const MAX_BEAT_FRAMES = Math.round(3 * fps);
  return Math.min(
    Math.max(0, Math.round(beats[role] * fps) - 2),
    Math.max(fallbackFrames, MAX_BEAT_FRAMES),
  );
}

/** fade-up — opacity 0→1 + translateY dist→0 (entry default). */
export function fadeUp(
  frame: number,
  opts: { delay?: number; dist?: number; dur?: number; ease?: (n: number) => number } = {},
): React.CSSProperties {
  // Snap by default — a crisp pop-up entry (fast attack, smooth settle), shorter dur.
  const { delay = 0, dist = 14, dur = 16, ease = EASE.snap } = opts;
  const p = prog(frame, delay, dur, ease);
  return { opacity: p, transform: `translateY(${(1 - p) * dist}px)` };
}

/** mask-wipe / line-draw — returns a 0→1 progress for width / clip-path / stroke. */
export function wipe(
  frame: number,
  opts: { delay?: number; dur?: number; ease?: (n: number) => number } = {},
): number {
  const { delay = 0, dur = 24, ease = EASE.out } = opts;
  return prog(frame, delay, dur, ease);
}
export const lineDraw = wipe;

/** scale-settle — hero elements 0.96→1 ease-out. */
export function scaleSettle(
  frame: number,
  opts: { delay?: number; dur?: number; from?: number; ease?: (n: number) => number } = {},
): number {
  const { delay = 0, dur = 22, from = 0.96, ease = EASE.soft } = opts;
  return interpolate(prog(frame, delay, dur, ease), [0, 1], [from, 1]);
}

/** count-up — animate a figure from 0 → target (skip when skipIntro). */
export function countUp(
  frame: number,
  target: number,
  opts: { delay?: number; dur?: number; skip?: boolean; ease?: (n: number) => number } = {},
): number {
  const { delay = 8, dur = 40, skip = false, ease = EASE.out } = opts;
  if (skip) return target;
  return target * prog(frame, delay, dur, ease);
}

/** camera-pan — a wrapper transform that settles a large board on its focus. */
export function cameraPan(
  frame: number,
  opts: {
    fromX?: number;
    fromY?: number;
    fromScale?: number;
    delay?: number;
    dur?: number;
    ease?: (n: number) => number;
  } = {},
): string {
  const { fromX = 0, fromY = 0, fromScale = 1.06, delay = 0, dur = 40, ease = EASE.out } = opts;
  const p = prog(frame, delay, dur, ease);
  const x = interpolate(p, [0, 1], [fromX, 0]);
  const y = interpolate(p, [0, 1], [fromY, 0]);
  const s = interpolate(p, [0, 1], [fromScale, 1]);
  return `translate(${x}px, ${y}px) scale(${s})`;
}

/**
 * out — the mirror of entry: fade + 8px drift, ~10f before scene end.
 * Hook (reads video config); call once at the top of a template.
 */
export function useOutro(animateOut?: boolean, lead = 12): React.CSSProperties {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  if (!animateOut) return { opacity: 1 };
  const p = prog(frame, durationInFrames - lead, lead - 2);
  return { opacity: 1 - p, transform: `translateY(${p * 8}px)` };
}

// ── Cinematic staging (§0, §1A, §1D) — scenes evolve through beats, not one reveal ──
// The difference between a dashboard and documentary motion graphics: one major
// change at a time (§1D), a camera that settles on the focus (§1.4 camera-pan),
// and non-focal material that recedes so the hero pops (§0 hero→support→context).

/**
 * focusPush — a board-level camera push toward a focal point. Start wide, then
 * after `delay` ease in to `to` scale, anchored at (ox,oy) in %. Returns the
 * wrapper transform + origin. This is the "zoom into detail" beat.
 */
export function focusPush(
  frame: number,
  opts: { delay?: number; dur?: number; from?: number; to?: number; ox?: number; oy?: number; ease?: (n: number) => number } = {},
): React.CSSProperties {
  const { delay = 0, dur = 34, from = 1, to = 1.12, ox = 50, oy = 50, ease = EASE.soft } = opts;
  const s = interpolate(prog(frame, delay, dur, ease), [0, 1], [from, to]);
  return { transform: `scale(${s})`, transformOrigin: `${ox}% ${oy}%` };
}

/** dimAt — recede non-focal material to `to` opacity after frame `at` (close-up beat). */
export function dimAt(frame: number, at: number, to = 0.26, dur = 18): number {
  return interpolate(prog(frame, at, dur), [0, 1], [1, to]);
}

/** pulseAt — a one-shot emphasis swell (scale) centred on frame `at` (the annotate beat). */
export function pulseAt(frame: number, at: number, amp = 0.045, dur = 20): number {
  return 1 + Math.sin(prog(frame, at, dur) * Math.PI) * amp;
}

/**
 * useAmbientDrift — a perpetual, barely-perceptible push applied to the whole
 * scene so even a "resting" frame breathes like a locked-off camera on film,
 * never a static export. Sub-pixel + <1% scale.
 */
export function useAmbientDrift(intensity = 1): React.CSSProperties {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const t = durationInFrames > 0 ? frame / durationInFrames : 0;
  const scale = 1 + t * 0.01 * intensity; // slow 1% push across the scene
  const x = Math.sin(frame * 0.018) * 1.1 * intensity;
  const y = Math.cos(frame * 0.014) * 0.8 * intensity;
  return { transform: `translate(${x}px, ${y}px) scale(${scale})`, transformOrigin: "50% 42%" };
}

/**
 * useSignatureCamera — THE house camera move, applied by <Ground> to EVERY scene
 * so any two videos (any subject, any domain) feel like the same film. Two layers,
 * always identical:
 *   1. Opening SETTLE — the camera "finds the frame": a gentle pull-back from a
 *      slight over-scale to rest over the first ~26f (soft ease). Skipped on
 *      `skipIntro` scenes (a worldPan/evolve continuation must NOT re-settle).
 *   2. Perpetual DRIFT — a sub-pixel sway + a slow <1% push for the life of the
 *      scene, so a resting frame still breathes like a locked-off film camera.
 * This is the ONE source of within-scene camera motion; templates layer focal
 * `focusPush`es on top but never redefine the baseline.
 */
export function useSignatureCamera(opts: { drift?: boolean; skipIntro?: boolean } = {}): React.CSSProperties {
  const { drift = true, skipIntro = false } = opts;
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  // 1 · opening settle — over-scale 1.045 → 1.0 (skipped mid-continuation)
  const settle = skipIntro ? 1 : interpolate(prog(frame, 0, 26, EASE.soft), [0, 1], [1.045, 1]);
  // 2 · perpetual drift + slow push
  const t = durationInFrames > 0 ? frame / durationInFrames : 0;
  const slowPush = 1 + t * 0.008 * (drift ? 1 : 0);
  const x = drift ? Math.sin(frame * 0.018) * 1.1 : 0;
  const y = drift ? Math.cos(frame * 0.014) * 0.8 : 0;
  return { transform: `translate(${x}px, ${y}px) scale(${settle * slowPush})`, transformOrigin: "50% 45%" };
}

/** revealClip — a directional mask reveal (for text/rows that "wipe" in from an edge). */
export function revealClip(frame: number, opts: { delay?: number; dur?: number; from?: "left" | "bottom" | "right" } = {}): React.CSSProperties {
  const { delay = 0, dur = 24, from = "bottom" } = opts;
  const p = wipe(frame, { delay, dur });
  const inset =
    from === "left"
      ? `inset(0 ${(1 - p) * 100}% 0 0)`
      : from === "right"
        ? `inset(0 0 0 ${(1 - p) * 100}%)`
        : `inset(${(1 - p) * 100}% 0 0 0)`;
  return { clipPath: inset, WebkitClipPath: inset };
}

// ── Number parsing / formatting (shared by AnimatedCounter + hero figures) ────

export function parseStat(s: string): {
  prefix: string;
  num: number | null;
  suffix: string;
  decimals: number;
} {
  const cleaned = (s ?? "").replace(/,/g, "");
  const m = cleaned.match(/^(\D*)(-?\d+(?:\.\d+)?)(.*)$/);
  if (!m) return { prefix: "", num: null, suffix: s, decimals: 0 };
  const raw = m[2] ?? "0";
  const dec = raw.includes(".") ? raw.split(".")[1]?.length ?? 0 : 0;
  return { prefix: m[1] ?? "", num: parseFloat(raw), suffix: m[3] ?? "", decimals: dec };
}

export function formatNum(n: number, decimals = 0): string {
  const fixed = n.toFixed(decimals);
  const [intPart, frac] = fixed.split(".");
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return frac ? `${grouped}.${frac}` : grouped;
}

// ═══════════════════════════════════════════════════════════════════════════
// 6 · SHARED PROP CONTRACT (§1.6) — every template spreads this.
// ═══════════════════════════════════════════════════════════════════════════

export const baseTemplateSchema = {
  ground: z.enum(["paper", "ink", "structure"]).optional(),
  accentColor: z.string().optional(),
  kicker: z.string().optional(),
  source: z.string().optional(),
  skipIntro: z.boolean().optional().default(false),
  animateOut: z.boolean().optional().default(false),
  // Shared spatial context. The pipeline injects a neutral worldState per scene
  // today (F1 fix — the static-offset camera was removed); the schema is retained
  // as the single injection point for the keyframed CameraRig (roadmap H2/H3).
  worldState: WorldStateSchema,
  // H1 beat sheet — narration-anchored reveal times: role → seconds from scene
  // start. Optional everywhere; templates resolve entries via `beatDelay(...)`
  // and keep their hand-tuned frame delays as the fallback.
  beats: z.record(z.string(), z.number()).optional(),
};

export type BaseTemplateProps = {
  ground?: Ground;
  accentColor?: string;
  kicker?: string;
  source?: string;
  skipIntro?: boolean;
  animateOut?: boolean;
  worldState?: WorldState;
  beats?: Record<string, number>;
};

// ═══════════════════════════════════════════════════════════════════════════
// 7 · THEME CONTEXT — so primitives inherit the ground without prop-drilling.
// ═══════════════════════════════════════════════════════════════════════════

const ThemeCtx = React.createContext<Theme>(resolveTheme("paper"));
export const useTheme = () => React.useContext(ThemeCtx);

// ═══════════════════════════════════════════════════════════════════════════
// 8 · PRIMITIVES — composed by every template. Never rebuilt.
// ═══════════════════════════════════════════════════════════════════════════

export type TextureDomain = "finance" | "football" | "generic";

/**
 * DomainTexture — the "studio glue" designed background texture (§1.5),
 * generalised from FinanceTexture (F3-core). THEMATIC material, never noise —
 * it says what film you're watching on every graphic:
 *
 *   finance  → ink: faint dot/ticker grid · paper: faint warm ledger rules
 *   football → faint pitch markings (halfway line · centre circle · penalty
 *              boxes) in the theme ink, at ledger-grid opacity discipline
 *   generic  → the plain paper grid
 *
 * finance/kit.tsx keeps exporting `FinanceTexture` as a thin wrapper over
 * <DomainTexture domain="finance" /> so existing templates compile unchanged.
 */
export const DomainTexture: React.FC<{ theme?: Theme; domain?: TextureDomain }> = ({
  theme,
  domain = "finance",
}) => {
  const t = theme ?? useTheme();

  if (domain === "football") {
    // Faint pitch-line texture — centre circle + halfway line + penalty boxes,
    // drawn in the theme ink at the same low-opacity discipline as the ledger
    // grid (thematic, NOT noise — SEARCH_PARTY_STYLE_ANALYSIS.md §4).
    const stroke = rgbaFromHex(t.ink, t.isInk ? 0.1 : 0.045);
    const sw = STROKE.hair * 2; // reads as a hairline at 1920×1080 after masking
    return (
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          WebkitMaskImage: "radial-gradient(130% 120% at 50% 40%, #000 60%, transparent 100%)",
          maskImage: "radial-gradient(130% 120% at 50% 40%, #000 60%, transparent 100%)",
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 1920 1080"
          preserveAspectRatio="xMidYMid slice"
          style={{ position: "absolute", inset: 0 }}
        >
          {/* halfway line */}
          <line x1={960} y1={0} x2={960} y2={1080} stroke={stroke} strokeWidth={sw} />
          {/* centre circle + spot */}
          <circle cx={960} cy={540} r={168} fill="none" stroke={stroke} strokeWidth={sw} />
          <circle cx={960} cy={540} r={5} fill={stroke} />
          {/* left penalty box + six-yard box */}
          <rect x={0} y={266} width={286} height={548} fill="none" stroke={stroke} strokeWidth={sw} />
          <rect x={0} y={396} width={110} height={288} fill="none" stroke={stroke} strokeWidth={sw} />
          {/* right penalty box + six-yard box */}
          <rect x={1634} y={266} width={286} height={548} fill="none" stroke={stroke} strokeWidth={sw} />
          <rect x={1810} y={396} width={110} height={288} fill="none" stroke={stroke} strokeWidth={sw} />
          {/* penalty arcs */}
          <path d="M 286 447 A 168 168 0 0 1 286 633" fill="none" stroke={stroke} strokeWidth={sw} />
          <path d="M 1634 447 A 168 168 0 0 0 1634 633" fill="none" stroke={stroke} strokeWidth={sw} />
        </svg>
      </AbsoluteFill>
    );
  }

  if (domain === "finance" && t.isInk) {
    return (
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          backgroundImage: `radial-gradient(${rgbaFromHex(t.ink, 0.14)} 1.4px, transparent 1.6px)`,
          backgroundSize: "44px 44px",
          WebkitMaskImage: "radial-gradient(130% 115% at 50% 30%, #000 65%, transparent 100%)",
          maskImage: "radial-gradient(130% 115% at 50% 30%, #000 65%, transparent 100%)",
        }}
      />
    );
  }

  // finance paper/structure + generic — a faint warm ledger rule (horizontal +
  // vertical hairlines).
  const rule = rgbaFromHex(t.ink, 0.04);
  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        backgroundImage: `repeating-linear-gradient(0deg, ${rule} 0 1px, transparent 1px 46px), repeating-linear-gradient(90deg, ${rule} 0 1px, transparent 1px 46px)`,
        WebkitMaskImage: "radial-gradient(130% 120% at 50% 40%, #000 60%, transparent 100%)",
        maskImage: "radial-gradient(130% 120% at 50% 40%, #000 60%, transparent 100%)",
      }}
    />
  );
};

/**
 * Grain — a living film-grain plate (§1.5 "low grain"). Grayscale fractal noise
 * composited in OVERLAY (paper) / SOFT-LIGHT (ink) so the frame's average stays
 * neutral and only the *tooth* shows — tactile paper stock, never a murky wash. The
 * plate is oversized and jitters a few px each frame so the grain LIVES like film
 * rather than sitting there like a dirty lens. This is the one place random noise is
 * allowed; DomainTexture stays a designed thematic layer.
 */
export const Grain: React.FC<{ opacity?: number; theme?: Theme; frame?: number }> = ({ opacity = 1 }) => (
  // The HeroTactical paper-weave (shared/Grain): a static tactile weave + an animated
  // fine grain layer. `opacity` (default 1) scales the whole plate. This is the house
  // film stock — designed texture, replacing the old grid.
  <AbsoluteFill style={{ pointerEvents: "none", opacity }}>
    <PaperWeave />
  </AbsoluteFill>
);

/**
 * Atmosphere — directional key light + depth + warm vignette (§1.5). Gives every
 * scene foreground/background separation without decoration and NEVER a white glow:
 * on ink the key light is a warm firelight pool; on paper a soft warm lift with the
 * far corner falling into shadow. `focus` (0–1) aims the light at the scene's hero.
 */
const Atmosphere: React.FC<{ theme: Theme; focus: { x: number; y: number } }> = ({ theme, focus }) => {
  const fx = `${focus.x * 100}%`;
  const fy = `${focus.y * 100}%`;
  // Key light + depth derived from the ACTUAL bg (a lighter/darker shade of the same
  // hue) → gentle in-family illumination on any background, never a foreign-coloured
  // radial blob. Dark grounds get a deeper vignette.
  const key = lift(theme.bg, 0.45, theme.isInk ? 0.3 : 0.42);
  const keyEdge = lift(theme.bg, 0.45, 0);
  const deep = lift(theme.bg, -0.55, theme.isInk ? 0.34 : 0.1);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* soft key light, toned to the bg */}
      <AbsoluteFill style={{ background: `radial-gradient(72% 72% at ${fx} ${fy}, ${key}, ${keyEdge} 58%)` }} />
      {/* directional depth — opposite corner falls into shadow */}
      <AbsoluteFill style={{ background: `radial-gradient(125% 125% at ${fx} ${fy}, transparent 52%, ${deep} 100%)` }} />
    </AbsoluteFill>
  );
};

/**
 * GroundImage — a photo bled into the RIGHT of the frame and dissolved into the
 * ground: a left-edge mask fades it toward the content, a hue-matched tint recolours
 * it to the bg, and top/bottom vignettes melt the edges — so it reads as atmosphere,
 * not a pasted still. (ScoutReport's masked portrait, mirrored to the right.)
 */
const GroundImage: React.FC<{ src: string; theme: Theme }> = ({ src, theme }) => (
  <div
    style={{
      position: "absolute",
      right: 0,
      top: 0,
      bottom: 0,
      width: "56%",
      overflow: "hidden",
      pointerEvents: "none",
      WebkitMaskImage: "linear-gradient(to right, transparent 0%, #000 52%, #000 100%)",
      maskImage: "linear-gradient(to right, transparent 0%, #000 52%, #000 100%)",
    }}
  >
    <SmartImg src={src} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", filter: "grayscale(0.6) contrast(1.05)" }} />
    {/* recolour the photo to the ground hue so it joins the world */}
    <AbsoluteFill style={{ background: theme.bg, opacity: 0.5, mixBlendMode: "color" }} />
    {/* settle it back so overlaid text/stamps stay readable */}
    <AbsoluteFill style={{ background: theme.bg, opacity: 0.32 }} />
    {/* top + bottom vignettes dissolve the frame edges into the ground */}
    <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 180, background: `linear-gradient(to bottom, ${theme.bg}, transparent)` }} />
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 260, background: `linear-gradient(to top, ${theme.bg}, transparent)` }} />
  </div>
);

/**
 * Ground — the root wrapper for every template. Paints the ground, composites the
 * DomainTexture + cinematic Atmosphere, provides the Theme via context, wraps the
 * content in a perpetual ambient drift so it breathes like film, and sets the base
 * font + generous page padding. Every template's root is <Ground …>.
 */
/**
 * SequenceCtx — true when rendering INSIDE a SceneSequence canvas (H3,
 * PRODUCTION_GAP_ANALYSIS §4.4 Layer 2). The sequence owns the ground, texture,
 * atmosphere, grain and signature camera; a template's own <Ground> collapses
 * to a transparent Theme provider so the template renders as a PANEL on the
 * shared canvas instead of painting a full screen of its own.
 */
export const SequenceCtx = React.createContext(false);

export const Ground: React.FC<{
  ground?: Ground;
  accentColor?: string;
  /** override the ground's background hex (paper/ink/structure default otherwise). */
  bgColor?: string;
  /** override primary text colour. */
  inkColor?: string;
  /** override secondary / label text colour. */
  mutedColor?: string;
  /** override the editorial highlight colour (ticks / text emphasis / image callouts). */
  highlightColor?: string;
  /** a photo bled into the right of the frame, blended into the ground. */
  bgImage?: string;
  texture?: boolean;
  /** which thematic texture family to draw when `texture` is on. Default "finance"
   *  (preserves existing finance templates verbatim); football templates pass
   *  "football" for the faint pitch markings. */
  domain?: TextureDomain;
  vignette?: boolean;
  /** aim the key light at the scene's hero (0–1). Default editorial upper-left. */
  focus?: { x: number; y: number };
  /** perpetual sub-pixel camera drift (film-locked-off feel). Default on. */
  drift?: boolean;
  /** freeze the opening camera settle — pass on worldPan/evolve continuation scenes. */
  skipIntro?: boolean;
  /** film-grain plate on top of everything. `true` = default strength, or pass 0–1. Default off. */
  grain?: boolean | number;
  pad?: number | string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ ground = "paper", accentColor, bgColor, inkColor, mutedColor, highlightColor, bgImage, texture = false, domain = "finance", vignette = true, focus = { x: 0.34, y: 0.32 }, drift = true, skipIntro = false, grain = true, pad, children, style }) => {
  const theme = resolveTheme(ground, accentColor, bgColor, inkColor, mutedColor, highlightColor);
  const inSequence = React.useContext(SequenceCtx);
  // THE signature camera — identical opening settle + perpetual drift on every scene.
  const driftStyle = useSignatureCamera({ drift: drift && !inSequence, skipIntro: skipIntro || inSequence });

  if (inSequence) {
    // Panel mode: the SceneSequence owns ground/texture/atmosphere/grain and
    // the camera. Provide the Theme + layout shell only, fully transparent.
    return (
      <ThemeCtx.Provider value={theme}>
        <AbsoluteFill style={{ fontFamily: TYPE.sans, overflow: "hidden" }}>
          <AbsoluteFill
            style={{
              padding: pad ?? SPACE.page,
              color: theme.ink,
              ...style,
            }}
          >
            {children}
          </AbsoluteFill>
        </AbsoluteFill>
      </ThemeCtx.Provider>
    );
  }

  return (
    <ThemeCtx.Provider value={theme}>
      <AbsoluteFill style={{ backgroundColor: theme.bg, fontFamily: TYPE.sans, overflow: "hidden" }}>
        {texture && <DomainTexture theme={theme} domain={domain} />}
        {bgImage && <GroundImage src={bgImage} theme={theme} />}
        {vignette && <Atmosphere theme={theme} focus={focus} />}
        <AbsoluteFill style={{ ...driftStyle }}>
          <AbsoluteFill
            style={{
              padding: pad ?? SPACE.page,
              color: theme.ink,
              ...style,
            }}
          >
            {children}
          </AbsoluteFill>
        </AbsoluteFill>
        {grain && <Grain theme={theme} opacity={typeof grain === "number" ? grain : undefined} />}
      </AbsoluteFill>
    </ThemeCtx.Provider>
  );
};

/** Kicker — short accent rule + mono label above a title (§1.5). */
export const Kicker: React.FC<{
  label?: string;
  theme?: Theme;
  frame?: number;
  delay?: number;
  align?: "left" | "center";
}> = ({ label, theme, frame, delay = 0, align = "left" }) => {
  const t = theme ?? useTheme();
  const f = frame ?? useCurrentFrame();
  if (!label) return null;
  const p = wipe(f, { delay, dur: 18 });
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: SPACE[3],
        justifyContent: align === "center" ? "center" : "flex-start",
        opacity: p,
      }}
    >
      <div style={{ width: interpolate(p, [0, 1], [0, 34]), height: 3, background: t.highlight, borderRadius: 2 }} />
      <div
        style={{
          fontFamily: TYPE.mono,
          fontSize: TYPE.label,
          fontWeight: TYPE.weight.semibold,
          letterSpacing: TYPE.track,
          textTransform: "uppercase",
          color: t.muted,
        }}
      >
        {label}
      </div>
    </div>
  );
};

/** SourceTag — accent slash + mono source/year, corner overlay (§1.5). */
export const SourceTag: React.FC<{
  source?: string;
  theme?: Theme;
  frame?: number;
  delay?: number;
  position?: "bottom-left" | "bottom-right" | "top-right";
}> = ({ source, theme, frame, delay = 20, position = "bottom-right" }) => {
  const t = theme ?? useTheme();
  const f = frame ?? useCurrentFrame();
  if (!source) return null;
  const p = wipe(f, { delay, dur: 16 });
  const corner: React.CSSProperties =
    position === "bottom-left"
      ? { left: SPACE.page, bottom: SPACE[10] }
      : position === "top-right"
        ? { right: SPACE.page, top: SPACE[10] }
        : { right: SPACE.page, bottom: SPACE[10] };
  return (
    <div
      style={{
        position: "absolute",
        ...corner,
        display: "flex",
        alignItems: "center",
        gap: SPACE[2],
        opacity: p,
        fontFamily: TYPE.mono,
        fontSize: TYPE.source,
        fontWeight: TYPE.weight.medium,
        letterSpacing: 1.4,
        textTransform: "uppercase",
        color: t.muted,
      }}
    >
      <span style={{ color: t.highlight, fontWeight: TYPE.weight.bold }}>/</span>
      {source}
    </div>
  );
};

/** ChapterNumber — the /03 mono index for chapter cards (§1.5). */
export const ChapterNumber: React.FC<{ index: number; theme?: Theme; frame?: number; delay?: number }> = ({
  index,
  theme,
  frame,
  delay = 0,
}) => {
  const t = theme ?? useTheme();
  const f = frame ?? useCurrentFrame();
  const p = wipe(f, { delay, dur: 18 });
  return (
    <div
      style={{
        fontFamily: TYPE.mono,
        fontSize: 30,
        fontWeight: TYPE.weight.semibold,
        letterSpacing: 3,
        color: t.highlight,
        opacity: p,
        transform: `translateX(${interpolate(p, [0, 1], [-16, 0])}px)`,
      }}
    >
      /{String(index).padStart(2, "0")}
    </div>
  );
};

/**
 * LowerThird — name + accent tick + / role caption for people over footage.
 * Transparent overlay; the only template with no Ground of its own.
 */
export const LowerThird: React.FC<{
  name: string;
  role?: string;
  theme?: Theme;
  frame?: number;
  delay?: number;
  align?: "left" | "right";
}> = ({ name, role, theme, frame, delay = 6, align = "left" }) => {
  const t = theme ?? useTheme();
  const f = frame ?? useCurrentFrame();
  const p = wipe(f, { delay, dur: 18, ease: EASE.soft });
  return (
    <div
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: align === "right" ? "flex-end" : "flex-start",
        opacity: p,
        transform: `translateY(${interpolate(p, [0, 1], [18, 0])}px)`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: SPACE[3], flexDirection: align === "right" ? "row-reverse" : "row" }}>
        <div style={{ width: 6, height: 34, background: t.highlight, borderRadius: 3 }} />
        <div style={{ fontFamily: TYPE.sans, fontSize: 40, fontWeight: TYPE.weight.bold, color: t.ink, letterSpacing: -0.6 }}>
          {name}
        </div>
      </div>
      {role && (
        <div
          style={{
            fontFamily: TYPE.mono,
            fontSize: TYPE.label,
            fontWeight: TYPE.weight.medium,
            letterSpacing: 1.8,
            textTransform: "uppercase",
            color: t.muted,
            marginTop: SPACE[2],
            marginLeft: align === "right" ? 0 : SPACE[6],
            marginRight: align === "right" ? SPACE[6] : 0,
          }}
        >
          / {role}
        </div>
      )}
    </div>
  );
};

/** SectionTitle — Kicker + display title + optional dek. The standard header stack. */
export const SectionTitle: React.FC<{
  title: string;
  kicker?: string;
  dek?: string;
  theme?: Theme;
  frame?: number;
  delay?: number;
  size?: number;
  serif?: boolean;
  align?: "left" | "center";
}> = ({ title, kicker, dek, theme, frame, delay = 0, size = TYPE.display, serif = false, align = "left" }) => {
  const t = theme ?? useTheme();
  const f = frame ?? useCurrentFrame();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: SPACE[4], alignItems: align === "center" ? "center" : "flex-start", textAlign: align }}>
      {kicker && <Kicker label={kicker} theme={t} frame={f} delay={delay} align={align} />}
      {/* title rises out of a mask — filmic, not a plain fade */}
      <div style={{ overflow: "hidden", paddingBottom: Math.round(size * 0.06) }}>
        <div
          style={{
            fontSize: size,
            lineHeight: 1.0,
            color: t.ink,
            maxWidth: 1500,
            ...(serif
              ? { fontFamily: TYPE.serif, fontWeight: TYPE.weight.bold, letterSpacing: -0.5 }
              : { ...TITLE_FONT, letterSpacing: -1 }),
            transform: `translateY(${(1 - wipe(f, { delay: delay + 4, dur: 26 })) * (size * 1.05)}px)`,
          }}
        >
          {title}
        </div>
      </div>
      {dek && (
        <div
          style={{
            fontFamily: TYPE.sans,
            fontSize: TYPE.sub,
            fontWeight: TYPE.weight.regular,
            lineHeight: 1.45,
            color: t.muted,
            maxWidth: 1000,
            ...fadeUp(f, { delay: delay + 12, dist: 12, dur: 22 }),
          }}
        >
          {dek}
        </div>
      )}
    </div>
  );
};

/** AnimatedCounter — count-up any figure string, preserving prefix/unit + grouping. */
export const AnimatedCounter: React.FC<{
  value: string;
  delay?: number;
  dur?: number;
  decimals?: number;
  skip?: boolean;
  frame?: number;
  style?: React.CSSProperties;
}> = ({ value, delay = 8, dur = 42, decimals, skip = false, frame, style }) => {
  const f = frame ?? useCurrentFrame();
  const { prefix, num, suffix, decimals: dec } = parseStat(value);
  if (num === null) return <span style={style}>{value}</span>;
  const d = decimals ?? dec;
  const shown = countUp(f, num, { delay, dur, skip });
  return (
    <span style={{ fontVariantNumeric: "tabular-nums", ...style }}>
      {prefix}
      {formatNum(shown, d)}
      {suffix}
    </span>
  );
};

/** GlassCard — the base raised surface. Every card-shaped template builds on this. */
export const GlassCard: React.FC<{
  theme?: Theme;
  featured?: boolean;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ theme, featured = false, style, children }) => {
  const t = theme ?? useTheme();
  return (
    <div
      style={{
        backgroundColor: t.surface,
        borderRadius: RADIUS.lg,
        border: `${featured ? 1.5 : 1}px solid ${featured ? t.accent : t.line}`,
        boxShadow: cardShadow(t),
        position: "relative",
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** StatCard — a single figure + label tile (the KPI atom). Featured → accent. */
export const StatCard: React.FC<{
  value: string;
  label: string;
  sub?: string;
  featured?: boolean;
  theme?: Theme;
  frame?: number;
  delay?: number;
  skip?: boolean;
  style?: React.CSSProperties;
}> = ({ value, label, sub, featured = false, theme, frame, delay = 0, skip = false, style }) => {
  const t = theme ?? useTheme();
  const f = frame ?? useCurrentFrame();
  return (
    <GlassCard
      theme={t}
      featured={featured}
      style={{
        padding: `${SPACE[8]}px ${SPACE[8]}px`,
        display: "flex",
        flexDirection: "column",
        gap: SPACE[3],
        ...fadeUp(f, { delay, dist: 16, dur: 22 }),
        ...style,
      }}
    >
      {/* label first (context), figure second (hero) — reading order, strong contrast */}
      <div
        style={{
          fontFamily: TYPE.mono,
          fontSize: TYPE.source,
          fontWeight: TYPE.weight.medium,
          letterSpacing: 2,
          textTransform: "uppercase",
          color: featured ? t.accent : t.muted,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: TYPE.sans,
          fontSize: featured ? 88 : 76,
          fontWeight: TYPE.weight.black,
          letterSpacing: -2,
          lineHeight: 0.95,
          color: featured ? t.accent : t.ink,
        }}
      >
        <AnimatedCounter value={value} delay={delay + 6} skip={skip} frame={f} />
      </div>
      {sub && <div style={{ fontFamily: TYPE.sans, fontSize: TYPE.body, fontWeight: TYPE.weight.regular, color: t.muted, lineHeight: 1.3 }}>{sub}</div>}
    </GlassCard>
  );
};

/** ChartContainer — the standard framed plot area: header stack + gridded body. */
export const ChartContainer: React.FC<{
  title?: string;
  kicker?: string;
  unit?: string;
  theme?: Theme;
  frame?: number;
  height?: number;
  children: React.ReactNode;
}> = ({ title, kicker, unit, theme, frame, height, children }) => {
  const t = theme ?? useTheme();
  const f = frame ?? useCurrentFrame();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: SPACE[8], width: "100%" }}>
      {(title || kicker) && (
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <SectionTitle title={title ?? ""} kicker={kicker} theme={t} frame={f} size={TYPE.cardTitle + 8} />
          {unit && (
            <div style={{ fontFamily: TYPE.mono, fontSize: TYPE.label, letterSpacing: 1.6, textTransform: "uppercase", color: t.muted }}>
              {unit}
            </div>
          )}
        </div>
      )}
      <div style={{ position: "relative", height: height ?? 520, width: "100%" }}>{children}</div>
    </div>
  );
};

/** Pill — a small mono chip. The building block for tags, deltas, legends. */
export const Pill: React.FC<{
  children: React.ReactNode;
  theme?: Theme;
  accent?: boolean;
  /** solid accent fill + white text — a legible "button" (vs the faint outlined chip). */
  filled?: boolean;
  style?: React.CSSProperties;
}> = ({ children, theme, accent = false, filled = false, style }) => {
  const t = theme ?? useTheme();
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: SPACE[2],
        padding: `${SPACE[2]}px ${SPACE[4]}px`,
        borderRadius: RADIUS.pill,
        background: filled ? t.accent : accent ? t.highlightSoft : "transparent",
        border: `1px solid ${filled ? t.accent : accent ? t.highlight : t.line}`,
        boxShadow: filled ? pillShadow(t) : undefined,
        fontFamily: TYPE.mono,
        fontSize: TYPE.source,
        fontWeight: filled ? TYPE.weight.bold : TYPE.weight.semibold,
        letterSpacing: 1.2,
        textTransform: "uppercase",
        color: filled ? "#FFFFFF" : accent ? t.highlight : t.muted,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** DeltaChip — the ×N / +% / −% comparison chip that pops between two figures. */
export const DeltaChip: React.FC<{
  value: string;
  direction?: "up" | "down" | "neutral";
  theme?: Theme;
  frame?: number;
  delay?: number;
}> = ({ value, direction = "up", theme, frame, delay = 20 }) => {
  const t = theme ?? useTheme();
  const f = frame ?? useCurrentFrame();
  const s = scaleSettle(f, { delay, dur: 16, from: 0.7 });
  const arrow = direction === "up" ? "▲" : direction === "down" ? "▼" : "→";
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: SPACE[2],
        padding: `${SPACE[2]}px ${SPACE[5]}px`,
        borderRadius: RADIUS.pill,
        background: t.accent,
        color: t.isInk ? INK_GROUND.bg : "#FFFFFF",
        fontFamily: TYPE.mono,
        fontSize: 22,
        fontWeight: TYPE.weight.bold,
        letterSpacing: 0.5,
        boxShadow: pillShadow(t),
        transform: `scale(${s})`,
        opacity: wipe(f, { delay, dur: 10 }),
      }}
    >
      {direction !== "neutral" && <span style={{ fontSize: 13 }}>{arrow}</span>}
      {value}
    </div>
  );
};

/** TimelineMarker — a node on a time axis: dot + date + label, featured → accent. */
export const TimelineMarker: React.FC<{
  date: string;
  label: string;
  featured?: boolean;
  theme?: Theme;
  frame?: number;
  delay?: number;
  above?: boolean;
}> = ({ date, label, featured = false, theme, frame, delay = 0, above = true }) => {
  const t = theme ?? useTheme();
  const f = frame ?? useCurrentFrame();
  const p = wipe(f, { delay, dur: 16, ease: EASE.soft });
  const dot = featured ? 20 : 12;
  const content = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: SPACE[1], opacity: p, transform: `translateY(${interpolate(p, [0, 1], [above ? -8 : 8, 0])}px)` }}>
      <div style={{ fontFamily: TYPE.mono, fontSize: TYPE.label, fontWeight: TYPE.weight.semibold, letterSpacing: 1, color: featured ? t.accent : t.muted }}>{date}</div>
      <div style={{ fontFamily: TYPE.sans, fontSize: TYPE.body, fontWeight: featured ? TYPE.weight.bold : TYPE.weight.medium, color: t.ink, maxWidth: 200, textAlign: "center", lineHeight: 1.2 }}>{label}</div>
    </div>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: SPACE[3] }}>
      {above && content}
      <div
        style={{
          width: dot,
          height: dot,
          borderRadius: "50%",
          background: featured ? t.accent : t.surface,
          border: `${featured ? 0 : 3}px solid ${t.muted}`,
          boxShadow: featured ? `0 0 0 6px ${t.accentSoft}` : "none",
          transform: `scale(${scaleSettle(f, { delay, from: 0.2, dur: 14 })})`,
        }}
      />
      {!above && content}
    </div>
  );
};

/** LogoBadge — a company mark (image) or a monogram fallback, standardised. */
export const LogoBadge: React.FC<{
  src?: string;
  name: string;
  size?: number;
  theme?: Theme;
  featured?: boolean;
}> = ({ src, name, size = 64, theme, featured = false }) => {
  const t = theme ?? useTheme();
  const monogram = name.trim().slice(0, 1).toUpperCase();
  return (
    <div
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: RADIUS.md,
        background: t.surface,
        border: `1px solid ${featured ? t.accent : t.line}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        boxShadow: pillShadow(t),
      }}
    >
      {src ? (
        <SmartImg src={src} style={{ width: "78%", height: "78%", objectFit: "contain" }} />
      ) : (
        <span
          style={{
            fontFamily: TYPE.sans,
            fontSize: size * 0.42,
            fontWeight: TYPE.weight.black,
            color: featured ? t.accent : t.ink,
          }}
        >
          {monogram}
        </span>
      )}
    </div>
  );
};

/** RuleSweep — a hairline that draws in; the connective rule under headers. */
export const RuleSweep: React.FC<{
  theme?: Theme;
  frame?: number;
  delay?: number;
  accent?: boolean;
  height?: number;
}> = ({ theme, frame, delay = 0, accent = false, height = STROKE.line }) => {
  const t = theme ?? useTheme();
  const f = frame ?? useCurrentFrame();
  return (
    <div
      style={{
        height,
        width: "100%",
        background: accent ? t.accent : t.line,
        transformOrigin: "left center",
        transform: `scaleX(${wipe(f, { delay, dur: 26 })})`,
      }}
    />
  );
};

// ── FlowEdge — an animated connector between two points ───────────────────────
// The shared edge for every node/flow diagram (MoneyFlow, SystemDiagram, and
// future OrgChart / Sankey / TokenWeb). Draws on left→right, optionally runs
// particles along its length, and can be a straight line or an S-curve, with an
// optional arrowhead + mono label. MUST be rendered inside an <svg>.

export type Pt = { x: number; y: number };

function edgePoint(from: Pt, to: Pt, curve: boolean, tt: number): Pt {
  if (!curve) return { x: from.x + (to.x - from.x) * tt, y: from.y + (to.y - from.y) * tt };
  const midX = (from.x + to.x) / 2;
  const u = 1 - tt;
  const p1 = { x: midX, y: from.y };
  const p2 = { x: midX, y: to.y };
  return {
    x: u * u * u * from.x + 3 * u * u * tt * p1.x + 3 * u * tt * tt * p2.x + tt * tt * tt * to.x,
    y: u * u * u * from.y + 3 * u * u * tt * p1.y + 3 * u * tt * tt * p2.y + tt * tt * tt * to.y,
  };
}

/**
 * orthoSegs — the corner points for a 90°-routed elbow between two nodes (§1.1
 * orthogonal routing). `axis` forces the split direction: "v" → V·H·V (exit the
 * node vertically first — org trees), "h" → H·V·H (exit horizontally first —
 * left→right flows). Omitted → split on the dominant axis. Returns the 4 polyline
 * vertices; the connector never travels diagonally.
 */
function orthoSegs(from: Pt, to: Pt, axis?: "v" | "h"): [Pt, Pt, Pt, Pt] {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const vertical = axis ? axis === "v" : Math.abs(dy) >= Math.abs(dx);
  if (vertical) {
    const my = from.y + dy / 2;
    return [from, { x: from.x, y: my }, { x: to.x, y: my }, to];
  }
  const mx = from.x + dx / 2;
  return [from, { x: mx, y: from.y }, { x: mx, y: to.y }, to];
}

/** polyPoint — a point at fraction `tt` (0–1) along a polyline, walked by segment length. */
function polyPoint(pts: Pt[], tt: number): Pt {
  const lens: number[] = [];
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const l = Math.abs(pts[i + 1].x - pts[i].x) + Math.abs(pts[i + 1].y - pts[i].y);
    lens.push(l);
    total += l;
  }
  let target = tt * total;
  for (let i = 0; i < lens.length; i++) {
    if (target <= lens[i] || i === lens.length - 1) {
      const f = lens[i] ? target / lens[i] : 0;
      return { x: pts[i].x + (pts[i + 1].x - pts[i].x) * f, y: pts[i].y + (pts[i + 1].y - pts[i].y) * f };
    }
    target -= lens[i];
  }
  return pts[pts.length - 1];
}

export const FlowEdge: React.FC<{
  from: Pt;
  to: Pt;
  frame: number;
  delay?: number;
  dur?: number;
  theme?: Theme;
  /** accent (illicit / featured) vs muted (legitimate / default). */
  accent?: boolean;
  /** S-curve bezier (flow diagrams) vs straight line (step diagrams). */
  curve?: boolean;
  /** 90°-only orthogonal routing (org trees / system maps). Overrides `curve`. */
  ortho?: boolean;
  /** force the ortho split axis: "v" (exit vertically — trees) · "h" (exit horizontally — flows). */
  orthoAxis?: "v" | "h";
  /** draw an arrowhead at the destination. */
  arrow?: boolean;
  /** number of running particle dots (0 = none). */
  particles?: number;
  label?: string;
  /** stroke width override; defaults to accent?4:2.5. */
  width?: number;
  /** small dots where the edge meets each node (clean connection ports). */
  endDots?: boolean;
  skip?: boolean;
}> = ({ from, to, frame, delay = 0, dur = 24, theme, accent = false, curve = false, ortho = false, orthoAxis, arrow = false, particles = 0, label, width, endDots = false, skip = false }) => {
  const t = theme ?? useTheme();
  const col = accent ? t.accent : t.muted;
  const segs = ortho ? orthoSegs(from, to, orthoAxis) : null;
  const dPath = segs
    ? `M ${segs[0].x} ${segs[0].y} L ${segs[1].x} ${segs[1].y} L ${segs[2].x} ${segs[2].y} L ${segs[3].x} ${segs[3].y}`
    : curve
      ? `M ${from.x} ${from.y} C ${(from.x + to.x) / 2} ${from.y}, ${(from.x + to.x) / 2} ${to.y}, ${to.x} ${to.y}`
      : `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
  const len = segs
    ? Math.abs(to.x - from.x) + Math.abs(to.y - from.y)
    : Math.hypot(to.x - from.x, to.y - from.y) * (curve ? 1.2 : 1);
  const pointAt = (tt: number): Pt => (segs ? polyPoint(segs, tt) : edgePoint(from, to, curve, tt));
  const drawP = skip ? 1 : wipe(frame, { delay, dur });
  // Monoline: connectors share ONE weight (STROKE.line); accent differs by colour/opacity,
  // not width. Templates can still force emphasis via an explicit `width`.
  const sw = width ?? STROKE.line;
  const mid = pointAt(0.5);
  const back = pointAt(0.94);
  const ang = (Math.atan2(to.y - back.y, to.x - back.x) * 180) / Math.PI;
  const base = ((frame - delay) % 60) / 60;

  return (
    <g>
      <path
        d={dPath}
        fill="none"
        stroke={col}
        strokeOpacity={accent ? 0.9 : 0.5}
        strokeWidth={sw}
        strokeDasharray={len}
        strokeDashoffset={len * (1 - drawP)}
        strokeLinecap={ortho ? "butt" : "round"}
        strokeLinejoin={ortho ? "miter" : "round"}
      />
      {particles > 0 &&
        drawP > 0.9 &&
        Array.from({ length: particles }).map((_, k) => {
          const tt = (base + k / particles) % 1;
          const pt = pointAt(tt);
          return <circle key={k} cx={pt.x} cy={pt.y} r={accent ? 7 : 5} fill={col} opacity={accent ? 1 : 0.7} />;
        })}
      {endDots && (
        <>
          <circle cx={from.x} cy={from.y} r={4} fill={col} opacity={drawP > 0.02 ? 1 : 0} />
          <circle cx={to.x} cy={to.y} r={accent ? 5 : 4} fill={col} opacity={drawP > 0.9 ? 1 : 0} />
        </>
      )}
      {arrow && drawP > 0.95 && (
        <polygon points="0,0 -14,-8 -14,8" fill={col} transform={`translate(${to.x} ${to.y}) rotate(${ang})`} />
      )}
      {label && drawP > 0.5 && (
        <text
          x={mid.x}
          y={mid.y - 16}
          textAnchor="middle"
          fill={col}
          opacity={drawP}
          stroke={t.bg}
          strokeWidth={5}
          strokeLinejoin="round"
          style={{ fontFamily: TYPE.mono, fontSize: 16, fontWeight: TYPE.weight.bold, letterSpacing: 1.6, textTransform: "uppercase", paintOrder: "stroke" }}
        >
          {label}
        </text>
      )}
    </g>
  );
};

// ── Stamp — the rotated bordered "thud" label ─────────────────────────────────
// The verdict / evidence stamp shared by CourtVerdict (GUILTY), BalanceSheet
// (INSOLVENT) and DocumentReveal (EXHIBIT). Scale-settles in with no bounce.
// `active` → accent (the damning state); else muted.

const STAMP_SIZES = {
  sm: { fontSize: TYPE.label, border: 2, padX: SPACE[5], padY: SPACE[1], track: 2.5 },
  md: { fontSize: 34, border: 4, padX: SPACE[6], padY: SPACE[2], track: 4 },
  lg: { fontSize: 44, border: 3, padX: SPACE[10], padY: SPACE[3], track: 6 },
} as const;

export const Stamp: React.FC<{
  label: string;
  theme?: Theme;
  frame?: number;
  delay?: number;
  active?: boolean;
  rotate?: number;
  size?: "sm" | "md" | "lg";
  from?: number;
  skip?: boolean;
  /** solid accent fill + white text (vs the default outlined chip). */
  filled?: boolean;
}> = ({ label, theme, frame, delay = 0, active = true, rotate = 0, size = "md", from = 1.5, skip = false, filled = false }) => {
  const t = theme ?? useTheme();
  const f = frame ?? useCurrentFrame();
  const s = STAMP_SIZES[size];
  const settle = skip ? 1 : scaleSettle(f, { delay, dur: 12, from });
  const col = active ? t.accent : t.muted;
  const solid = filled && active;
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `scale(${settle}) rotate(${rotate}deg)`,
        opacity: skip ? 1 : wipe(f, { delay, dur: 10 }),
        padding: `${s.padY}px ${s.padX}px`,
        borderRadius: RADIUS.sm,
        border: `${s.border}px solid ${col}`,
        background: solid ? col : active ? rgbaOf(t.accent, 0.09) : "transparent",
        fontFamily: TYPE.mono,
        fontSize: s.fontSize,
        fontWeight: TYPE.weight.bold,
        letterSpacing: s.track,
        textTransform: "uppercase",
        color: solid ? "#FFFFFF" : col,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </div>
  );
};

// ── AxisFrame — reusable chart gridlines + baseline + optional y ticks ─────────
// An HTML overlay (no SVG distortion) placed inside a position:relative chart
// container. The shared grid for every chart (DrawdownChart, and future
// IndexCompare / GrowthArea / MetricTrajectory).

export const AxisFrame: React.FC<{
  theme?: Theme;
  frame?: number;
  delay?: number;
  /** number of horizontal divisions (interior gridlines = rows-1). */
  rows?: number;
  /** optional labels, distributed top→bottom across the full height. */
  yTicks?: string[];
  /** draw a stronger baseline at the bottom. */
  baseline?: boolean;
}> = ({ theme, frame, delay = 0, rows = 4, yTicks, baseline = true }) => {
  const t = theme ?? useTheme();
  const f = frame ?? useCurrentFrame();
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: Math.max(0, rows - 1) }).map((_, i) => {
        const top = ((i + 1) / rows) * 100;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: `${top}%`,
              height: STROKE.hair,
              background: t.line,
              transformOrigin: "left center",
              transform: `scaleX(${wipe(f, { delay: delay + i * 3, dur: 24 })})`,
            }}
          />
        );
      })}
      {baseline && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: STROKE.line,
            background: t.muted,
            opacity: 0.4,
            transformOrigin: "left center",
            transform: `scaleX(${wipe(f, { delay, dur: 26 })})`,
          }}
        />
      )}
      {yTicks?.map((tk, i) => (
        <div
          key={`tk${i}`}
          style={{
            position: "absolute",
            left: 0,
            top: yTicks.length > 1 ? `${(i / (yTicks.length - 1)) * 100}%` : "0%",
            transform: "translateY(-50%)",
            fontFamily: TYPE.mono,
            fontSize: TYPE.source,
            letterSpacing: 1,
            color: t.muted,
            opacity: wipe(f, { delay: delay + 8, dur: 16 }),
          }}
        >
          {tk}
        </div>
      ))}
    </div>
  );
};

// ── GhostMark — a giant faint background word/number (editorial depth) ─────────
// ⚠️ DEPRECATED — DO NOT USE in new/updated templates. Per direction, the giant
// ghosted numeral read as clutter (and misaligned fragments read as the wrong
// number), so it has been removed from every finance template. Kept only so old
// imports don't break; do not add it back.
export const GhostMark: React.FC<{
  text: string;
  theme?: Theme;
  frame?: number;
  delay?: number;
  corner?: "bottom-right" | "bottom-left" | "top-right" | "center";
  size?: number;
  opacity?: number;
}> = ({ text, theme, frame, delay = 0, corner = "bottom-right", size = 620, opacity }) => {
  const t = theme ?? useTheme();
  const f = frame ?? useCurrentFrame();
  const p = wipe(f, { delay, dur: 40, ease: EASE.soft });
  const op = (opacity ?? (t.isInk ? 0.05 : 0.045)) * p;
  const drift = Math.sin(f * 0.01) * 8;
  const pos: React.CSSProperties =
    corner === "bottom-left"
      ? { left: -40, bottom: -size * 0.28 }
      : corner === "top-right"
        ? { right: -40, top: -size * 0.28 }
        : corner === "center"
          ? { left: "50%", top: "50%", transform: `translate(-50%,-50%) translateX(${drift}px)` }
          : { right: -40, bottom: -size * 0.28 };
  return (
    <div
      style={{
        position: "absolute",
        ...pos,
        transform: (pos.transform as string) ?? `translateX(${drift}px)`,
        fontFamily: TYPE.sans,
        fontSize: size,
        fontWeight: TYPE.weight.black,
        letterSpacing: -size * 0.03,
        lineHeight: 0.8,
        color: t.ink,
        opacity: op,
        pointerEvents: "none",
        whiteSpace: "nowrap",
        userSelect: "none",
      }}
    >
      {text}
    </div>
  );
};

// ── HeroNumber — the dramatic figure, art-directed (§1B reading order) ─────────
// Overline (context) → giant figure (hero, accent) → label (support). Strong type
// contrast built in; count-up; optional accent underline that draws. Left-aligned
// editorial by default. This is THE hero-figure primitive — reuse it, don't rebuild.
export const HeroNumber: React.FC<{
  value: string;
  overline?: string;
  label?: string;
  theme?: Theme;
  frame?: number;
  delay?: number;
  skip?: boolean;
  size?: number;
  align?: "left" | "center";
  color?: string;
  underline?: boolean;
}> = ({ value, overline, label, theme, frame, delay = 0, skip = false, size = 210, align = "left", color, underline = true }) => {
  const t = theme ?? useTheme();
  const f = frame ?? useCurrentFrame();
  const col = color ?? t.accent;
  const items = align === "center" ? "center" : "flex-start";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: items, textAlign: align, gap: SPACE[3] }}>
      {overline && (
        <div style={{ fontFamily: TYPE.mono, fontSize: TYPE.label, fontWeight: TYPE.weight.medium, letterSpacing: TYPE.track, textTransform: "uppercase", color: t.muted, ...fadeUp(f, { delay, dur: 16 }) }}>
          {overline}
        </div>
      )}
      <div style={{ overflow: "hidden", paddingBottom: Math.round(size * 0.04) }}>
        <div
          style={{
            fontFamily: TYPE.sans,
            fontSize: size,
            fontWeight: TYPE.weight.black,
            letterSpacing: -size * 0.035,
            lineHeight: 0.86,
            color: col,
            transform: `translateY(${(1 - wipe(f, { delay: delay + 4, dur: 22 })) * size}px)`,
          }}
        >
          <AnimatedCounter value={value} delay={delay + 8} skip={skip} frame={f} />
        </div>
      </div>
      {underline && <div style={{ width: interpolate(wipe(f, { delay: delay + 14, dur: 20 }), [0, 1], [0, size * 0.9]), height: 5, background: col, borderRadius: 3 }} />}
      {label && (
        <div style={{ fontFamily: TYPE.sans, fontSize: TYPE.sub, fontWeight: TYPE.weight.medium, color: t.ink, maxWidth: 900, lineHeight: 1.3, ...fadeUp(f, { delay: delay + 18, dur: 20 }) }}>
          {label}
        </div>
      )}
    </div>
  );
};

// ── Annotation — a leader line + mono label (the "annotate" beat) ──────────────
// Draws a thin accent leader from an anchor point out to a short mono caption, so
// the scene can point at the one thing that matters (§1E: one key passage only).
export const Annotation: React.FC<{
  x: number; // anchor, 0–1 of parent
  y: number;
  label: string;
  theme?: Theme;
  frame?: number;
  delay?: number;
  dir?: "up" | "down";
  len?: number;
}> = ({ x, y, label, theme, frame, delay = 0, dir = "up", len = 90 }) => {
  const t = theme ?? useTheme();
  const f = frame ?? useCurrentFrame();
  const draw = wipe(f, { delay, dur: 18 });
  const op = wipe(f, { delay: delay + 10, dur: 16 });
  const up = dir === "up";
  return (
    <div style={{ position: "absolute", left: `${x * 100}%`, top: `${y * 100}%`, pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: 0, [up ? "bottom" : "top"]: 0, width: STROKE.line, height: len * draw, background: t.highlight, transformOrigin: up ? "bottom" : "top" }} />
      <div style={{ position: "absolute", left: 8, bottom: up ? len + 6 : undefined, top: up ? undefined : len + 6, width: 8, height: 8, borderRadius: "50%", background: t.highlight, transform: `scale(${draw})` }} />
      <div
        style={{
          position: "absolute",
          left: 18,
          [up ? "bottom" : "top"]: len + 2,
          whiteSpace: "nowrap",
          fontFamily: TYPE.mono,
          fontSize: TYPE.label,
          fontWeight: TYPE.weight.semibold,
          letterSpacing: 1.4,
          textTransform: "uppercase",
          color: t.highlight,
          opacity: op,
          transform: `translateY(${(1 - op) * (up ? 6 : -6)}px)`,
        }}
      >
        {label}
      </div>
    </div>
  );
};

// ── MapNode — a labelled node in the cinematic information map ─────────────────
// The shared "entity object" for every diagram (OrgChart, SystemDiagram,
// AcquisitionTree). Deliberately NOT a UI button: tight architectural radius,
// left-aligned editorial type (eyebrow → name → detail), asymmetric padding, a
// top edge-light + directional shadow for depth, and — for the featured node — a
// restrained accent SPINE + accent eyebrow instead of a heavy saturated outline.
// The accent is a precise mark, not a fill.
export const MapNode: React.FC<{
  label: string;
  eyebrow?: string;
  sub?: string;
  featured?: boolean;
  theme?: Theme;
  width?: number | string;
  align?: "left" | "center";
  /** enter progress (scale + opacity) — templates keep their own stagger. */
  progress?: number;
  labelSize?: number;
  style?: React.CSSProperties;
}> = ({ label, eyebrow, sub, featured = false, theme, width, align = "left", progress = 1, labelSize = 27, style }) => {
  const t = theme ?? useTheme();
  const p = progress;
  const edgeLight = t.isInk ? "inset 0 1px 0 rgba(255,247,238,0.08)" : "inset 0 1px 0 rgba(255,255,255,0.85)";
  const shadow = t.isInk ? SHADOW.nodeInk : SHADOW.node;
  // ONE uniform border weight on every side (no left spine): featured = solid accent,
  // else a clearly-visible hairline (t.line is too faint on the dark ground).
  const border = featured ? t.accent : rgbaOf(t.ink, 0.22);
  // featured gets a whisper of warm accent wash over the surface — not an orange fill.
  const bg = featured
    ? `linear-gradient(180deg, ${rgbaOf(t.accent, 0.09)}, ${rgbaOf(t.accent, 0.02)}), ${t.surface}`
    : t.surface;
  return (
    <div
      style={{
        position: "relative",
        width,
        minWidth: 190,
        borderRadius: 9,
        background: bg,
        border: `1.5px solid ${border}`,
        boxShadow: `${edgeLight}, ${shadow}`,
        padding: align === "center" ? "22px 26px 20px" : "20px 30px 18px 30px",
        textAlign: align,
        transform: `scale(${p})`,
        opacity: p,
        overflow: "hidden",
        ...style,
      }}
    >
      {eyebrow && (
        <div style={{ fontFamily: TYPE.mono, fontSize: 16, fontWeight: TYPE.weight.semibold, letterSpacing: 1.8, textTransform: "uppercase", color: featured ? t.accent : t.muted, marginBottom: 10 }}>
          {eyebrow}
        </div>
      )}
      <div style={{ fontFamily: TYPE.sans, fontSize: labelSize, fontWeight: TYPE.weight.bold, letterSpacing: -0.4, lineHeight: 1.12, color: t.ink, whiteSpace: "pre-line" }}>
        {label}
      </div>
      {sub && (
        <div style={{ fontFamily: TYPE.mono, fontSize: 15.5, letterSpacing: 0.8, textTransform: "uppercase", color: t.muted, marginTop: 10 }}>
          {sub}
        </div>
      )}
    </div>
  );
};
