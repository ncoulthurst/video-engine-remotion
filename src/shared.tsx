/**
 * shared.tsx — Design tokens and reusable components for all 90th templates.
 */
import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { loadFont as loadPlayfair } from "@remotion/google-fonts/PlayfairDisplay";

export const { fontFamily } = loadFont("normal", { weights: ["400", "500", "600", "700", "800", "900"] });
export const { fontFamily: serifFontFamily } = loadPlayfair("normal", { weights: ["400", "700", "900"] });

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
      <div style={{ position: "absolute", bottom: Math.round((1080 - FRAME_Y - FRAME_H) / 2) - 10, right: FRAME_X, fontFamily, fontSize: 22, fontWeight: 800, color: "#fff", opacity: 0.22, letterSpacing: -0.5, userSelect: "none" as const, pointerEvents: "none" }}>
        90th
      </div>
    </AbsoluteFill>
  );
};
