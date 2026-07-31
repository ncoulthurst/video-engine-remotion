/**
 * shared.tsx — Design tokens and reusable components for all 90th templates.
 */
import React from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile, continueRender, delayRender, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { loadFont } from "@remotion/google-fonts/Inter";
import { loadFont as loadPlayfair } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as loadPlexSans } from "@remotion/google-fonts/IBMPlexSans";
import { loadFont as loadPlexMono } from "@remotion/google-fonts/IBMPlexMono";
import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadGeistMono } from "@remotion/google-fonts/GeistMono";
// Full brand font-picker roster (engine/server.py's brand editor "FONTS" list) —
// loaded here so every choice in that picker actually renders, not just Geist's
// pair + the four legacy faces above.
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { loadFont as loadOutfit } from "@remotion/google-fonts/Outfit";
import { loadFont as loadSpaceGrotesk } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as loadArchivoSans } from "@remotion/google-fonts/Archivo";
import { loadFont as loadSourceSans3 } from "@remotion/google-fonts/SourceSans3";
import { loadFont as loadBricolage } from "@remotion/google-fonts/BricolageGrotesque";
import { loadFont as loadFraunces } from "@remotion/google-fonts/Fraunces";
import { loadFont as loadDMSerifDisplay } from "@remotion/google-fonts/DMSerifDisplay";
import { loadFont as loadLora } from "@remotion/google-fonts/Lora";
import { loadFont as loadCormorantGaramond } from "@remotion/google-fonts/CormorantGaramond";
import { loadFont as loadJetBrainsMono } from "@remotion/google-fonts/JetBrainsMono";

// ── Geist — primary type family across all templates (sans + mono) ───────────
// Geist + Geist Mono are a designed pair (Vercel); the neutral-grotesque + mono
// combination is the finance / investigative / data-journalism register.
export const { fontFamily: geistFontFamily } = loadGeist("normal", { weights: ["400", "500", "600", "700", "800", "900"] });
export const { fontFamily: geistMonoFamily } = loadGeistMono("normal", { weights: ["400", "500", "600", "700"] });
// `fontFamily` is the default sans used everywhere → Geist. `let`, not `const`:
// setBrandFonts() below reassigns it (and the two "active" faces) per render
// when a project carries a brand font — every existing `import { fontFamily }`
// site keeps working unchanged because ES module imports are live bindings.
export let fontFamily = geistFontFamily;

export const { fontFamily: serifFontFamily } = loadPlayfair("normal", { weights: ["400", "700", "900"] });
// Legacy faces — still loaded so existing comps keep working; prefer Geist for new work.
export const { fontFamily: interFontFamily } = loadFont("normal", { weights: ["400", "500", "600", "700", "800", "900"] });
export const { fontFamily: plexFontFamily } = loadPlexSans("normal", { weights: ["400", "500", "600", "700"] });
export const { fontFamily: plexMonoFamily } = loadPlexMono("normal", { weights: ["400", "500", "600"] });

// Remaining brand-picker faces — loaded once, only ever reached via the brand
// font registry below (no template hardcodes these directly).
export const { fontFamily: manropeFontFamily }    = loadManrope("normal", { weights: ["400", "600", "700"] });
export const { fontFamily: outfitFontFamily }     = loadOutfit("normal", { weights: ["400", "600", "700"] });
export const { fontFamily: spaceGroteskFamily }   = loadSpaceGrotesk("normal", { weights: ["400", "600", "700"] });
export const { fontFamily: archivoSansFamily }    = loadArchivoSans("normal", { weights: ["400", "600", "700"] });
export const { fontFamily: sourceSans3Family }    = loadSourceSans3("normal", { weights: ["400", "600"] });
export const { fontFamily: bricolageFamily }      = loadBricolage("normal", { weights: ["400", "600", "800"] });
export const { fontFamily: frauncesFamily }       = loadFraunces("normal", { weights: ["400", "700"] });
export const { fontFamily: dmSerifDisplayFamily } = loadDMSerifDisplay("normal", { weights: ["400"] });
export const { fontFamily: loraFamily }           = loadLora("normal", { weights: ["400", "700"] });
export const { fontFamily: cormorantGaramondFamily } = loadCormorantGaramond("normal", { weights: ["400", "700"] });
export const { fontFamily: jetBrainsMonoFamily }  = loadJetBrainsMono("normal", { weights: ["400", "600"] });

// "Active" mono/display faces — same live-binding trick as `fontFamily` above,
// read by `TYPE.mono` / `TYPE.serif` getters in lib/kit.tsx.
export let activeMonoFamily = geistMonoFamily;
export let activeDisplayFamily = serifFontFamily;

// ── Brand font override (per-render, from the project's Sequencely brand kit) ─
// Remotion's google-fonts packages are static per-font imports, so brand font
// selection is matched against this small curated allow-list rather than
// loading an arbitrary Google Font string at render time. Unknown/blank names
// silently fall back to the Geist default instead of breaking the render.
const _BRAND_FONT_REGISTRY: Record<string, string> = {
  "geist":               geistFontFamily,
  "geist mono":          geistMonoFamily,
  "inter":               interFontFamily,
  "playfair display":    serifFontFamily,
  "ibm plex sans":       plexFontFamily,
  "ibm plex mono":       plexMonoFamily,
  // Full engine/server.py brand-picker roster:
  "manrope":             manropeFontFamily,
  "outfit":              outfitFontFamily,
  "space grotesk":       spaceGroteskFamily,
  "archivo":             archivoSansFamily,
  "source sans 3":       sourceSans3Family,
  "bricolage grotesque": bricolageFamily,
  "fraunces":            frauncesFamily,
  "dm serif display":    dmSerifDisplayFamily,
  "lora":                loraFamily,
  "cormorant garamond":  cormorantGaramondFamily,
  "jetbrains mono":      jetBrainsMonoFamily,
};

function _resolveBrandFont(name: string | null | undefined): string | null {
  if (!name) return null;
  return _BRAND_FONT_REGISTRY[name.trim().toLowerCase()] ?? null;
}

/** Called once at the top of VideoSequence's render from the project's brand
 * fonts (style_director.json → "fonts": {body, mono, display}). Anything not
 * in _BRAND_FONT_REGISTRY falls back to the Geist default. */
export function setBrandFonts(
  fonts: { body?: string | null; mono?: string | null; display?: string | null } | null | undefined,
): void {
  fontFamily          = _resolveBrandFont(fonts?.body)    ?? geistFontFamily;
  activeMonoFamily     = _resolveBrandFont(fonts?.mono)    ?? geistMonoFamily;
  activeDisplayFamily  = _resolveBrandFont(fonts?.display) ?? serifFontFamily;
}

// ── Archivo (variable) — the display TITLE face ──────────────────────────────
// @remotion/google-fonts/Archivo only ships the weight axis, so the width (wdth)
// axis is self-hosted here: the full variable woff2 (wght 100–900, wdth 62–125)
// lives in public/fonts. Titles use it at wdth 125 (expanded) / wght 600 — see
// `TITLE_FONT` in the finance kit. delayRender guards the render until it loads.
export const archivoFontFamily = "ArchivoVar";
if (typeof document !== "undefined") {
  const handle = delayRender("archivo-variable");
  const style = document.createElement("style");
  style.textContent = `
    @font-face {
      font-family: 'ArchivoVar';
      font-style: normal;
      font-weight: 100 900;
      font-stretch: 62% 125%;
      src: url(${staticFile("fonts/Archivo-var-latin.woff2")}) format('woff2');
      unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
    }
    @font-face {
      font-family: 'ArchivoVar';
      font-style: normal;
      font-weight: 100 900;
      font-stretch: 62% 125%;
      src: url(${staticFile("fonts/Archivo-var-latinext.woff2")}) format('woff2');
      unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
    }
  `;
  document.head.appendChild(style);
  Promise.all([
    document.fonts.load('600 40px "ArchivoVar"'),
    document.fonts.load('expanded 600 40px "ArchivoVar"'),
  ])
    .then(() => continueRender(handle))
    .catch(() => continueRender(handle));
}

export const COLORS = {
  bgFrom:          "#f5f0e8",
  bgTo:            "#e9e2d8",
  card:            "#eae4dc",
  cardBorder:      "rgba(0,0,0,0.07)",
  primary:         "#111",
  secondary:       "#444",
  muted:           "#999",
  colHeader:       "#555",
  colHeaderStrong: "#222",
  champion: {
    rowBg: "rgba(232, 217, 165, 0.45)",
    pill:  "#e8d9a5",
    glow:  "rgba(232, 217, 165, 0.55)",
  },
  gold:        "#C9A84C",
  rowAlt:      "rgba(0,0,0,0.025)",
  divider:     "rgba(0,0,0,0.08)",
  fallback:    "#555555",
  championRow: "rgba(232, 217, 165, 0.45)",
} as const;

export const SPRINGS = {
  header:  { damping: 18, stiffness: 55,  mass: 1 },
  row:     { damping: 13, stiffness: 140, mass: 1 },
  cols:    { damping: 20, stiffness: 80,  mass: 1 },
  feature: { damping: 24, stiffness: 60,  mass: 1 },
  brand:   { damping: 24, stiffness: 50,  mass: 1 },
  bounce:  { damping: 10, stiffness: 180, mass: 1 },
} as const;

// ── Project palette system ───────────────────────────────────────────────────
// One video = ONE palette. The Search Party teardown (SEARCH_PARTY_STYLE_ANALYSIS.md)
// showed the quality comes from repeating the SAME decisions across every graphic:
// two backgrounds (a "data" ground + a "structure/geography" ground), ONE accent
// used only to mark the subject, and a small set of neutrals. Thread `PALETTE`
// through every composition instead of per-comp colour constants.
export type Palette = {
  bg: string;         // primary background — the "data / numbers" ground
  bgGeo: string;      // secondary background — the "structure / geography / timeline" ground
  surface: string;    // raised card / panel on the bg
  accent: string;     // THE single signal colour — subject highlight, chart lines, key words
  accentSoft: string; // translucent accent — row/area fills, highlights
  ink: string;        // primary text
  muted: string;      // secondary text / labels
  line: string;       // hairline / divider
};

// "Signal" — dark investigative-finance (Bloomberg × Search Party). Deep money-green
// primary + navy structural alt + one burnt-orange signal. Warm off-white text.
const SIGNAL: Palette = {
  bg:         "#0C1A14",
  bgGeo:      "#0F1C2B",
  surface:    "#12241C",
  accent:     "#E8623A",
  accentSoft: "rgba(232, 98, 58, 0.15)",
  ink:        "#EEEAE1",
  muted:      "#7E8C84",
  line:       "rgba(238, 234, 225, 0.09)",
};

export const PALETTES: Record<string, Palette> = {
  // ── Reference-derived (kept for comparison; signal/amber ≈ Search Party) ──
  signal: SIGNAL,
  amber: { ...SIGNAL, accent: "#E0A63C", accentSoft: "rgba(224, 166, 60, 0.16)" },
  ledger: { ...SIGNAL, bg: "#0E1826", bgGeo: "#0B1420", surface: "#152234" },
  editorial: {
    bg: "#F4EEE3", bgGeo: "#EDE6D9", surface: "#EAE3D7",
    accent: "#B4472A", accentSoft: "rgba(180, 71, 42, 0.12)",
    ink: "#1C1A15", muted: "#8C857A", line: "rgba(28, 26, 21, 0.08)",
  },
  // PAPER-ORANGE — the editorial (light) system recoloured to soft warm-white +
  // burnt orange. bg is a broadcast-safe near-white (NOT pure #FFF, which blooms
  // full-bleed); orange is the single accent (bars / line / featured), text stays
  // dark ink. Surface is clean white for raised pills/cards on the paper ground.
  paperOrange: {
    bg: "#F7F4EE", bgGeo: "#F1EDE4", surface: "#FFFFFF",
    accent: "#E8623A", accentSoft: "rgba(232, 98, 58, 0.14)",
    ink: "#1C1A15", muted: "#8C857A", line: "rgba(28, 26, 21, 0.08)",
  },

  // ── "Own it" directions — distinct from the reference's green + orange ──────
  // VAULT — deep pine/emerald green (a green of your own, not the reference's
  // olive) + a warm signal red. Red is complementary to green (max pop) and reads
  // alert / loss / scandal — apt for investigative finance.
  vault: {
    bg: "#0A1613", bgGeo: "#0B1A22", surface: "#102019",
    accent: "#C24438", accentSoft: "rgba(194, 68, 56, 0.16)",
    ink: "#ECE7DB", muted: "#7B897F", line: "rgba(236, 231, 219, 0.09)",
  },
  // OXBLOOD — drops green entirely: warm near-black + oxblood red. FT / long-read
  // investigative. Serious, literary, no relation to the reference.
  oxblood: {
    bg: "#15110F", bgGeo: "#120E0C", surface: "#211915",
    accent: "#B23A32", accentSoft: "rgba(178, 58, 50, 0.16)",
    ink: "#ECE3D7", muted: "#8B8174", line: "rgba(236, 227, 215, 0.08)",
  },
  // MIDNIGHT — deep indigo-navy + warm amber. Cold structural ground, warm
  // signal. Reads "markets / terminal" without the green.
  midnight: {
    bg: "#0C1220", bgGeo: "#0A0F1A", surface: "#141C2E",
    accent: "#E0A63C", accentSoft: "rgba(224, 166, 60, 0.16)",
    ink: "#E9E9EF", muted: "#7C8398", line: "rgba(233, 233, 239, 0.08)",
  },
  // ROYAL — deep royal/sapphire blue + warm accent. Classic finance (trust,
  // banking, wealth); reads clearly blue, not the reference's green.
  royal: {
    bg: "#122456", bgGeo: "#0D1A42", surface: "#1B2E68",
    accent: "#E0A63C", accentSoft: "rgba(224, 166, 60, 0.16)",
    ink: "#EAECF5", muted: "#8A93B5", line: "rgba(234, 236, 245, 0.09)",
  },
};

// The active project palette. Swap this one line to reskin every comp at once.
export const PALETTE: Palette = PALETTES.vault;

export const DEFAULT_DURATION = 270;

export const FRAME_W = 1600;
export const FRAME_H = 900;

export function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

export function rgbaFromHex(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ── SmartImg ──────────────────────────────────────────────────────────────────

const IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"];

export const SmartImg: React.FC<
  Omit<React.ComponentProps<typeof Img>, "src"> & { src: string }
> = ({ src, style, ...props }) => {
  const safeSrc = src || "";
  const base = safeSrc.replace(/\.(jpe?g|png|webp|gif|svg)$/i, "");
  const origExt = safeSrc !== base ? safeSrc.slice(base.length).toLowerCase() : "";
  const candidates = [safeSrc, ...IMAGE_EXTS.filter((e) => e !== origExt).map((e) => base + e)].filter(Boolean);
  const [idx, setIdx] = React.useState(0);

  // No src or all candidates exhausted — render transparent placeholder, never timeout
  if (!safeSrc || idx >= candidates.length) {
    return <div style={style as React.CSSProperties} />;
  }

  return (
    <Img
      src={staticFile(candidates[idx])}
      onError={() => setIdx((i) => i + 1)}
      style={style}
      {...props}
    />
  );
};

// ── Visual overlays ──────────────────────────────────────────────────────────

export const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const animSeed = frame % 120;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width={width} height={height} style={{ position: "absolute", top: 0, left: 0, opacity: 0.10 }}>
        <defs>
          <filter id="inner-paper-weave" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.42" numOctaves="6" seed={5} stitchTiles="stitch" />
            <feColorMatrix type="matrix" values="0.38 0.5  0.12 0 0  0.28 0.58 0.14 0 0  0.22 0.5  0.28 0 0  0 0 0 0 1" />
          </filter>
        </defs>
        <rect width={width} height={height} filter="url(#inner-paper-weave)" />
      </svg>
      <svg width={width} height={height} style={{ position: "absolute", top: 0, left: 0 }}>
        <defs>
          <filter id={`g${animSeed}`} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" seed={animSeed} stitchTiles="stitch" />
            <feColorMatrix type="matrix" values="0.38 0.5  0.12 0 0  0.28 0.58 0.14 0 0  0.22 0.5  0.28 0 0  0 0 0 0 0.14" />
          </filter>
        </defs>
        <rect width={width} height={height} filter={`url(#g${animSeed})`} />
      </svg>
    </AbsoluteFill>
  );
};

export const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{
      background: "radial-gradient(circle at center, transparent 60%, rgba(0,0,0,0.05) 100%)",
      pointerEvents: "none",
    }}
  />
);

// ── FilmGrade ────────────────────────────────────────────────────────────────
// A unified cinematic post-process wrapper. Wrap any composition's content in
// <FilmGrade>…</FilmGrade> to fuse it into "one film": color grade + filmic
// animated grain + elliptical vignette + subtle film-gate weave & exposure
// flicker + optional letterbox / scanlines / edge fringe.
//
// HONESTY NOTE: pure DOM can't sample the rendered frame, so TRUE chromatic
// aberration and highlight bloom (what apple.tsx gets from its WebGL/HtmlInCanvas
// shader) are only *approximated* here (`aberration`, `bloom` — off by default).
// Everything else (grade, grain, vignette, weave, flicker, letterbox) is real.
//
// One master knob: `intensity` (0 = off, 1 = default, >1 = heavier) scales the
// grain, vignette, weave, flicker and fringe together. Individual props override.
export const FilmGrade: React.FC<{
  children: React.ReactNode;
  intensity?: number;      // master 0..~1.5 — scales grain/vignette/weave/flicker/aberration
  contrast?: number;       // filter contrast on content (1 = none)
  saturation?: number;     // filter saturate on content (1 = none)
  brightness?: number;     // filter brightness on content (1 = none)
  grain?: number;          // grain opacity override (default 0.13 * intensity)
  vignette?: number;       // vignette darkness override 0..1 (default 0.55 * intensity)
  tint?: string;           // color-grade wash, soft-light blend (e.g. "#12324a")
  tintOpacity?: number;    // 0..1 (default 0.12)
  gateWeave?: boolean;     // subtle sub-pixel film-gate wobble + exposure flicker (default true)
  letterbox?: number;      // black bar height top+bottom in px (0 = off)
  scanlines?: boolean;     // CRT/tech scanline overlay (default false)
  aberration?: number;     // APPROX edge R/C fringe px (0 = off, default off)
  bloom?: number;          // APPROX soft-glow highlight lift 0..1 (0 = off, default off)
}> = ({
  children,
  intensity = 1,
  contrast = 1.06,
  saturation = 1.04,
  brightness = 1.0,
  grain,
  vignette,
  tint,
  tintOpacity = 0.12,
  gateWeave = true,
  letterbox = 0,
  scanlines = false,
  aberration = 0,
  bloom = 0,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const grainOpacity = (grain ?? 0.13) * intensity;
  const vigDark = Math.min(0.9, (vignette ?? 0.55) * intensity);
  const grainSeed = frame % 90;

  // Film-gate weave: sub-pixel positional wobble (two detuned sines so it never
  // repeats obviously) + a faint exposure flicker folded into brightness.
  const weaveAmp = 0.7 * intensity;
  const weaveX = gateWeave ? (Math.sin(frame * 0.31) * 0.6 + Math.sin(frame * 0.13) * 0.4) * weaveAmp : 0;
  const weaveY = gateWeave ? (Math.sin(frame * 0.27 + 1.3) * 0.6 + Math.sin(frame * 0.09) * 0.4) * weaveAmp : 0;
  const flicker = gateWeave ? 1 + Math.sin(frame * 0.9) * 0.006 * intensity + (frame % 97 === 0 ? -0.02 : 0) : 1;

  return (
    <AbsoluteFill style={{ isolation: "isolate", overflow: "hidden" }}>
      {/* Graded content — slight over-scale hides edges revealed by weave/aberration */}
      <AbsoluteFill
        style={{
          transform: `translate(${weaveX}px, ${weaveY}px) scale(1.012)`,
          filter: `contrast(${contrast}) saturate(${saturation}) brightness(${brightness * flicker})`,
        }}
      >
        {children}
      </AbsoluteFill>

      {/* APPROX edge chromatic-aberration fringe (masked to periphery) */}
      {aberration > 0 && (
        <>
          <AbsoluteFill
            style={{
              pointerEvents: "none",
              mixBlendMode: "screen",
              background: `linear-gradient(90deg, rgba(255,40,40,${0.5 * intensity}) 0%, transparent ${aberration}%, transparent ${100 - aberration}%, rgba(40,120,255,${0.5 * intensity}) 100%)`,
              WebkitMaskImage: "radial-gradient(120% 120% at 50% 50%, transparent 70%, #000 100%)",
              maskImage: "radial-gradient(120% 120% at 50% 50%, transparent 70%, #000 100%)",
            }}
          />
        </>
      )}

      {/* APPROX bloom — soft screen-blend light lift from centre */}
      {bloom > 0 && (
        <AbsoluteFill
          style={{
            pointerEvents: "none",
            mixBlendMode: "screen",
            background: `radial-gradient(ellipse 70% 55% at 50% 42%, rgba(255,248,235,${0.16 * bloom}), transparent 70%)`,
          }}
        />
      )}

      {/* Color-grade wash */}
      {tint && (
        <AbsoluteFill
          style={{ pointerEvents: "none", mixBlendMode: "soft-light", background: tint, opacity: tintOpacity }}
        />
      )}

      {/* Filmic animated grain — luminance noise, overlay blend */}
      <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "overlay", opacity: grainOpacity }}>
        <svg width={width} height={height} style={{ position: "absolute", top: 0, left: 0 }}>
          <defs>
            <filter id={`fg-grain-${grainSeed}`} x="0" y="0" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={grainSeed} stitchTiles="stitch" />
              <feColorMatrix type="matrix" values="0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 0 1" />
            </filter>
          </defs>
          <rect width={width} height={height} filter={`url(#fg-grain-${grainSeed})`} />
        </svg>
      </AbsoluteFill>

      {/* Scanlines (tech register) */}
      {scanlines && (
        <AbsoluteFill
          style={{
            pointerEvents: "none",
            mixBlendMode: "multiply",
            opacity: 0.5,
            backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.35) 2px, rgba(0,0,0,0.35) 3px)",
          }}
        />
      )}

      {/* Elliptical vignette — stronger than the light `Vignette` token */}
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          background: `radial-gradient(ellipse 78% 78% at 50% 48%, transparent 46%, rgba(0,0,0,${vigDark}) 100%)`,
        }}
      />

      {/* Letterbox bars */}
      {letterbox > 0 && (
        <>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: letterbox, background: "#000", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: letterbox, background: "#000", pointerEvents: "none" }} />
        </>
      )}
    </AbsoluteFill>
  );
};

export const Background: React.FC<{ scale?: number }> = ({ scale = 1 }) => (
  <AbsoluteFill
    style={{
      background: `linear-gradient(155deg, ${COLORS.bgFrom} 0%, ${COLORS.bgTo} 100%)`,
      transform: `scale(${scale})`,
      transformOrigin: "center center",
    }}
  />
);

export const PaperBackground: React.FC<{ color?: string }> = ({ color }) => (
  <AbsoluteFill
    style={{
      background: color ?? `linear-gradient(155deg, ${COLORS.bgFrom} 0%, ${COLORS.bgTo} 100%)`,
    }}
  />
);

export const DarkBackground: React.FC<{ color?: string }> = ({ color = "#111111" }) => (
  <AbsoluteFill style={{ background: color }} />
);

// Electric-blue "ink" background: solid base + radial light depth + an intentional
// fine dot-grid texture (NOT random noise/grain). The dot grid reads as designed
// material — the bold, textured base for finance/news documentary graphics
// (Vox / Bloomberg / Johnny Harris register).
export const InkBackground: React.FC<{ color?: string }> = ({ color = "#0b0be5" }) => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <AbsoluteFill style={{ background: color }} />
    {/* light + shadow depth so the field is not flat */}
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(130% 95% at 50% -14%, rgba(255,255,255,0.22), rgba(255,255,255,0) 48%), " +
          "radial-gradient(130% 120% at 50% 120%, rgba(0,0,0,0.52), rgba(0,0,0,0) 58%)",
      }}
    />
    {/* fine dot grid — intentional texture (not noise), visible across the field */}
    <AbsoluteFill
      style={{
        backgroundImage: "radial-gradient(rgba(255,255,255,0.26) 1.7px, transparent 1.9px)",
        backgroundSize: "38px 38px",
        WebkitMaskImage: "radial-gradient(135% 115% at 50% 28%, #000 70%, transparent 100%)",
        maskImage: "radial-gradient(135% 115% at 50% 28%, #000 70%, transparent 100%)",
      }}
    />
  </AbsoluteFill>
);

// ── Typography helpers ────────────────────────────────────────────────────────

export const Overline: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: 2, color: COLORS.primary, textTransform: "uppercase" as const, marginBottom: 6, fontFamily }}>
    {children}
  </div>
);

export const DisplayTitle: React.FC<{ children: React.ReactNode; size?: number }> = ({ children, size = 68 }) => (
  <div style={{ fontSize: size, fontWeight: 900, color: COLORS.primary, lineHeight: 0.95, letterSpacing: -2, fontFamily }}>
    {children}
  </div>
);

export const MetaLine: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = COLORS.muted }) => (
  <div style={{ fontSize: 15, fontWeight: 400, color, marginTop: 10, letterSpacing: 0.3, fontFamily }}>
    {children}
  </div>
);

// ── Card components ───────────────────────────────────────────────────────────

export const colH = (width: number, color: string = COLORS.colHeader): React.CSSProperties => ({
  width: width || undefined,
  fontSize: 12,
  fontWeight: 700,
  color,
  textAlign: "center" as const,
  letterSpacing: 1.5,
  textTransform: "uppercase" as const,
  fontFamily,
  flexShrink: 0,
});

export const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ backgroundColor: COLORS.card, borderRadius: 16, border: `1px solid ${COLORS.cardBorder}`, boxShadow: "0px 20px 60px rgba(0,0,0,0.1), 0 4px 16px rgba(0,0,0,0.05)", ...style }}>
    {children}
  </div>
);

export const AccentBar: React.FC<{ color: string }> = ({ color }) => {
  const [r, g, b] = hexToRgb(color);
  return (
    <div style={{ position: "absolute", left: 0, top: 18, bottom: 18, width: 5, borderRadius: 3, backgroundColor: color, boxShadow: `0 0 14px 4px rgba(${r},${g},${b},0.4)` }} />
  );
};

export const RowSheen: React.FC = () => (
  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 50%)", pointerEvents: "none" }} />
);

export const TrophyIcon: React.FC<{ size?: number; opacity?: number }> = ({ size = 22, opacity = 1 }) => (
  <div style={{ opacity, display: "flex", alignItems: "center" }}>
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M6 2h12v8a6 6 0 01-12 0V2z" fill={COLORS.gold} />
      <path d="M9 16.5h6M12 16.5V20M9 20h6" stroke={COLORS.gold} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M6 4.5H3.5v2.5a2.5 2.5 0 002.5 2.5" stroke={COLORS.gold} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M18 4.5h2.5v2.5a2.5 2.5 0 01-2.5 2.5" stroke={COLORS.gold} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  </div>
);

// ── Documentary Frame ─────────────────────────────────────────────────────────

const FRAME_X = (1920 - FRAME_W) / 2;
const FRAME_Y = Math.round((1080 - FRAME_H) * 0.38);

export const DocumentaryFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const animSeed = Math.floor(frame / 3) % 40;

  return (
    <AbsoluteFill style={{ fontFamily, overflow: "hidden" }}>
      <AbsoluteFill style={{ background: "#2c2825" }} />
      <AbsoluteFill style={{ pointerEvents: "none" }}>
        <svg width={width} height={height} style={{ position: "absolute", top: 0, left: 0, opacity: 0.20 }}>
          <defs>
            <filter id="outer-paper-weave" x="0" y="0" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.40" numOctaves="6" seed={12} stitchTiles="stitch" />
              <feColorMatrix type="matrix" values="0 0 0 0 0.90  0 0 0 0 0.86  0 0 0 0 0.80  0 0 0 0 1" />
            </filter>
          </defs>
          <rect width={width} height={height} filter="url(#outer-paper-weave)" />
        </svg>
      </AbsoluteFill>
      <AbsoluteFill style={{ pointerEvents: "none" }}>
        <svg width={width} height={height} style={{ position: "absolute", top: 0, left: 0, opacity: 0.14 }}>
          <defs>
            <filter id={`outer-film-${animSeed}`} x="0" y="0" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.80" numOctaves="4" seed={animSeed} stitchTiles="stitch" />
              <feColorMatrix type="matrix" values="0 0 0 0 0.90  0 0 0 0 0.86  0 0 0 0 0.80  0 0 0 0 1" />
            </filter>
          </defs>
          <rect width={width} height={height} filter={`url(#outer-film-${animSeed})`} />
        </svg>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 75% at center, transparent 30%, rgba(0,0,0,0.22) 100%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", left: FRAME_X, top: FRAME_Y, width: FRAME_W, height: FRAME_H, overflow: "hidden", borderRadius: 18, boxShadow: "0 2px 6px rgba(0,0,0,0.28), 0 20px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.05)" }}>
        {children}
      </div>
      <div style={{ position: "absolute", bottom: Math.round((1080 - FRAME_Y - FRAME_H) / 2) - 10, right: FRAME_X, fontFamily, fontSize: 22, fontWeight: 800, color: "#1660FF", opacity: 0.55, letterSpacing: -0.5, userSelect: "none" as const, pointerEvents: "none" }}>
        Friction
      </div>
    </AbsoluteFill>
  );
};

// ── Trio portrait masks — shared by trio-of-portraits templates ──────────────
// Soft-edged radial alpha mask: prevents both the bottom hard-cut at the feet
// AND the side hard-cut at column borders. The two trio templates MUST share
// these so the cutouts read as part of the same studio look.
//
// TRIO_PORTRAIT_MASK: for templates with a header above (image starts mid-frame).
// TRIO_PORTRAIT_MASK_FULL: for full-bleed trios where the image goes top-to-baseline.
export const TRIO_PORTRAIT_MASK =
  "radial-gradient(ellipse 92% 96% at 50% 38%, #000 55%, transparent 96%)";
export const TRIO_PORTRAIT_MASK_FULL =
  "radial-gradient(ellipse 95% 100% at 50% 42%, #000 60%, transparent 100%)";

// ── WorldState — shared spatial context across scenes ────────────────────────

export const WorldStateSchema = z.object({
  cameraX: z.number().default(0),
  cameraY: z.number().default(0),
  zoom:    z.number().default(1),
}).optional();

export type WorldState = z.infer<typeof WorldStateSchema>;

/**
 * Track E — direction-aware spatial wrapper.
 *
 * `direction` controls the sign of the cameraX translate so that retrospective
 * acts (Act 5, or any flow_hint=="left") visually retreat through the
 * continuous canvas instead of always advancing forward.
 *   "advance" (default) → translate(-cameraX, -cameraY)
 *   "retreat"           → translate(+cameraX, -cameraY)
 */
export const WorldStateRoot: React.FC<{
  worldState?: WorldState;
  direction?: "advance" | "retreat";
  children: React.ReactNode;
}> = ({ worldState, direction = "advance", children }) => {
  const dx = (worldState?.cameraX ?? 0) * (direction === "retreat" ? 1 : -1);
  const dy = -(worldState?.cameraY ?? 0);
  return (
    <div style={{
      position:  "absolute",
      inset:     0,
      transform: `translate(${dx}px, ${dy}px)`,
      width:     "100%",
      height:    "100%",
    }}>
      {children}
    </div>
  );
};

// ── Visual Motifs ─────────────────────────────────────────────────────────────

/** Horizontal rule with optional accent sweep and section label. */
export const RuleLine: React.FC<{
  color?: string;
  opacity?: number;
  label?: string;
  progress?: number;
}> = ({ color = COLORS.primary, opacity = 0.12, label, progress = 1 }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
    <div style={{
      height: 1.5,
      flex: 1,
      background: color,
      opacity,
      transformOrigin: "left center",
      transform: `scaleX(${progress})`,
    }} />
    {label && (
      <div style={{
        fontFamily,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 3,
        textTransform: "uppercase" as const,
        color,
        opacity: Math.min(1, opacity * 5),
        whiteSpace: "nowrap",
      }}>
        {label}
      </div>
    )}
  </div>
);

/** "/ LABEL" context stamp — identifies scene category or era. */
export const ContextChip: React.FC<{
  label: string;
  color?: string;
  size?: number;
}> = ({ label, color = COLORS.muted, size = 11 }) => (
  <div style={{
    fontFamily,
    fontSize: size,
    fontWeight: 700,
    letterSpacing: 3,
    textTransform: "uppercase" as const,
    color,
    display: "flex",
    alignItems: "center",
    gap: 6,
  }}>
    <span style={{ opacity: 0.4 }}>/</span>
    <span>{label}</span>
  </div>
);

/** Animated glow arc that orbits the perimeter of a rect container. */
export const FrameGlow: React.FC<{
  w: number;
  h: number;
  color?: string;
  delay?: number;
  loopFrames?: number;
}> = ({ w, h, color = "rgba(255,255,255,0.18)", delay = 0, loopFrames = 360 }) => {
  const frame    = useCurrentFrame();
  const { fps }  = useVideoConfig();
  const PAD      = 4;
  const SW       = 2;
  const BR       = 6;
  const perim    = 2 * (w + h);
  const GLOW_L   = Math.round(perim * 0.40);
  const fadeIn   = spring({ frame, fps, config: { damping: 22, stiffness: 30 }, delay });
  const elapsed  = Math.max(0, frame - delay);
  const loop     = elapsed % loopFrames;
  const offset   = -interpolate(loop, [0, loopFrames], [0, perim]);

  return (
    <svg
      style={{ position: "absolute", top: -PAD, left: -PAD, pointerEvents: "none" }}
      width={w + PAD * 2}
      height={h + PAD * 2}
    >
      <defs>
        <filter id="frame-glow-blur" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <rect
        x={PAD} y={PAD} width={w} height={h} rx={BR} ry={BR}
        fill="none"
        stroke={color}
        strokeWidth={SW + 1}
        strokeDasharray={`${GLOW_L} ${perim - GLOW_L}`}
        strokeDashoffset={offset}
        filter="url(#frame-glow-blur)"
        opacity={fadeIn}
      />
    </svg>
  );
};

/** Club badge with standardised sizing and optional glow halo. */
export const BadgeTreatment: React.FC<{
  src: string;
  size?: number;
  glowColor?: string;
  opacity?: number;
}> = ({ src, size = 56, glowColor, opacity = 1 }) => (
  <div style={{
    width:    size,
    height:   size,
    flexShrink: 0,
    opacity,
    filter: glowColor
      ? `drop-shadow(0 0 ${Math.round(size * 0.18)}px ${glowColor}66)`
      : undefined,
  }}>
    <SmartImg src={src} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
  </div>
);
