/**
 * shared.tsx — Design tokens and reusable components for all 90th templates.
 */
import React from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { loadFont } from "@remotion/google-fonts/Inter";
import { loadFont as loadPlayfair } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as loadPlexSans } from "@remotion/google-fonts/IBMPlexSans";
import { loadFont as loadPlexMono } from "@remotion/google-fonts/IBMPlexMono";

export const { fontFamily } = loadFont("normal", { weights: ["400", "500", "600", "700", "800", "900"] });
export const { fontFamily: serifFontFamily } = loadPlayfair("normal", { weights: ["400", "700", "900"] });
// IBM Plex — display/body + mono for numbers/labels (generic finance primitives).
export const { fontFamily: plexFontFamily } = loadPlexSans("normal", { weights: ["400", "500", "600", "700"] });
export const { fontFamily: plexMonoFamily } = loadPlexMono("normal", { weights: ["400", "500", "600"] });

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
        Frequency
      </div>
    </AbsoluteFill>
  );
};

// ── Trio portrait masks — shared by PlayerTrio + TrioFeature ─────────────────
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
