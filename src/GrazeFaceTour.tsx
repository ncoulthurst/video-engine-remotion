/**
 * GrazeFaceTour — an extreme close-up, tilted 3D camera that grazes down a
 * list of rows: each row's content initially hovers above the surface (3D
 * lift + a blurred ghost-shadow duplicate on the surface below it) and lands
 * flush into place as the camera passes over it, top to bottom. Shallow
 * depth-of-field blur outside a moving focus ellipse; an accent-tinted edge
 * glow for atmosphere.
 *
 * Ported from video-shotcraft's graze-face-tour demo, which hardcoded three
 * literal product-UI mockups (a ClickUp-style sidebar tree, a top-nav bar, a
 * task list). That's product-specific and not reusable — this version keeps
 * only the technique (FloatWrap's hover+ghost-shadow treatment, the
 * accelerating-then-soft-landing fall easing, the tilted 3D camera +
 * shallow-DOF mask) and applies it to ONE generic, arbitrary-length row list
 * restyled onto the shared kit. Useful for "the engine is grazing across a
 * dense list of data points, each one settling into place" reveals — a long
 * stat/roster/list beat.
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import { z } from "zod";
import {
  Ground,
  resolveTheme,
  SectionTitle,
  SourceTag,
  useOutro,
  TYPE,
  SPACE,
  RADIUS,
  STROKE,
  rgbaOf,
  lift,
  baseTemplateSchema,
  type BaseTemplateProps,
  type Theme,
} from "./lib/kit";

// ── Schema ──────────────────────────────────────────────────────────────────

const GrazeRowSchema = z.object({
  label: z.string(),
  value: z.string().optional(),
});

export const GrazeFaceTourPropsSchema = z.object({
  ...baseTemplateSchema,
  title: z.string().optional().default(""),
  rows: z.array(GrazeRowSchema).optional().default([
    { label: "Total revenue", value: "$4.2M" },
    { label: "Active users", value: "128,400" },
    { label: "Churn rate", value: "2.1%" },
    { label: "New signups", value: "9,880" },
    { label: "Support tickets", value: "312" },
    { label: "Avg. session", value: "6m 40s" },
    { label: "Conversion rate", value: "3.4%" },
    { label: "NPS score", value: "61" },
  ]),
  ground: z.enum(["paper", "ink", "structure"]).optional().default("structure"),
});
export type GrazeFaceTourProps = z.input<typeof GrazeFaceTourPropsSchema> & BaseTemplateProps;

// ── Fall / hover technique — preserved from source ─────────────────────────

const easeFall = Easing.bezier(0.5, 0.05, 0.6, 1); // accelerate then soft-land
const easeCam = Easing.bezier(0.45, 0, 0.25, 1);

/** FloatWrap — the row hovers `h` px above the surface, with a blurred, darkened
 *  ghost duplicate left behind at the resting position; the two converge as h→0. */
const FloatWrap: React.FC<{ h: number; children: React.ReactNode }> = ({ h, children }) => (
  <div style={{ position: "relative" }}>
    {h > 1.5 && (
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translate(${h * 0.22}px, ${h * 0.42}px) scale(${1 + h * 0.0011})`,
          filter: `blur(${3.5 + h * 0.085}px) brightness(0.32) saturate(0.4)`,
          opacity: Math.min(0.38, 0.16 + h * 0.004),
          pointerEvents: "none",
        }}
      >
        {children}
      </div>
    )}
    <div style={{ transform: `translate(${-h * 0.34}px, ${-h * 0.78}px)` }}>{children}</div>
  </div>
);

/** liftOf — the hover height (px) at progress `t` for a row that lands at
 *  fraction `land` of the timeline, falling from height `H`. */
const liftOf = (t: number, land: number, H = 120) => {
  const FALL = 0.3;
  const p = Math.min(1, Math.max(0, (t - (land - FALL)) / FALL));
  return (1 - easeFall(p)) * H;
};

// ── Generic row content ─────────────────────────────────────────────────────

const ROW_H = 172;

const GrazeRow: React.FC<{ label: string; value?: string; i: number; theme: Theme }> = ({ label, value, i, theme: t }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: SPACE[8],
      height: ROW_H,
      paddingLeft: SPACE[10],
      paddingRight: SPACE[10],
      borderBottom: `${STROKE.hair}px solid ${t.line}`,
      boxSizing: "border-box",
    }}
  >
    <div
      style={{
        width: 14,
        height: 14,
        borderRadius: RADIUS.sm,
        background: t.accent,
        opacity: 0.85,
        flexShrink: 0,
      }}
    />
    <div style={{ fontFamily: TYPE.sans, fontSize: 44, fontWeight: TYPE.weight.medium, color: t.ink, letterSpacing: -0.3 }}>
      {label}
    </div>
    {value && (
      <div style={{ marginLeft: "auto", fontFamily: TYPE.mono, fontSize: 38, fontWeight: TYPE.weight.semibold, color: t.muted, letterSpacing: 0.5 }}>
        {value}
      </div>
    )}
  </div>
);

/** RowList — the world the camera grazes: N rows stacked in a fixed WORLD_W ×
 *  WORLD_H box (their landing schedule spread proportionally across the whole
 *  timeline so the graze reads as one continuous top-to-bottom pass). */
const RowList: React.FC<{ t: number; rows: { label: string; value?: string }[]; worldW: number; theme: Theme }> = ({ t, rows, worldW, theme }) => {
  const n = Math.max(1, rows.length);
  const landOf = (i: number) => 0.1 + (n > 1 ? (i / (n - 1)) * 0.82 : 0);
  return (
    <div style={{ width: worldW, height: rows.length * ROW_H, background: theme.surface, borderRadius: RADIUS.lg }}>
      {rows.map((r, i) => (
        <FloatWrap key={i} h={liftOf(t, landOf(i), 130)}>
          <GrazeRow label={r.label} value={r.value} i={i} theme={theme} />
        </FloatWrap>
      ))}
    </div>
  );
};

// ── Tilted 3D camera plane ──────────────────────────────────────────────────

type Cam = { rx: number; ry: number; rz: number; scale: number; x: [number, number]; y: [number, number] };

const Plane: React.FC<{ cam: Cam; t: number; theme: Theme; children: React.ReactNode }> = ({ cam, t, theme, children }) => {
  const x = interpolate(t, [0, 1], cam.x, { easing: easeCam });
  const y = interpolate(t, [0, 1], cam.y, { easing: easeCam });
  const glowA = theme.accent;
  const glowB = lift(theme.accent, -0.3, 1);
  return (
    <AbsoluteFill style={{ perspective: 1050, perspectiveOrigin: "50% 46%" }}>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 0,
          height: 0,
          transformStyle: "preserve-3d",
          transform: `scale(${cam.scale}) rotateX(${cam.rx}deg) rotateY(${cam.ry}deg) rotateZ(${cam.rz}deg)`,
        }}
      >
        <div style={{ position: "absolute", transform: `translate3d(${x}px, ${y}px, 0)` }}>
          <div style={{ position: "relative", transform: "translate(-50%, -50%)" }}>
            {/* accent-tinted edge glow — atmosphere, not literal neon */}
            <div
              style={{
                position: "absolute",
                left: -70,
                top: -40,
                width: 110,
                height: "104%",
                background: `linear-gradient(185deg, ${rgbaOf(glowA, 0.65)}, ${rgbaOf(glowB, 0.55)})`,
                filter: "blur(70px)",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: -10,
                top: 0,
                width: 8,
                height: "100%",
                background: `linear-gradient(180deg, ${rgbaOf(glowA, 0.8)}, ${rgbaOf(glowB, 0.75)})`,
                filter: "blur(3px)",
              }}
            />
            {children}
            {/* far edge falls into shadow — perspective depth cue */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `linear-gradient(105deg, rgba(0,0,10,0) 30%, rgba(0,0,10,0.35) 75%, rgba(0,0,10,0.6) 100%)`,
                pointerEvents: "none",
              }}
            />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** AtmosphereRects — a few soft accent-bordered rects drifting in the dark
 *  background, restyled from the source's hardcoded neon-pink/purple set. */
const AtmosphereRects: React.FC<{ drift: number; theme: Theme }> = ({ drift, theme: t }) => {
  const c1 = t.accent;
  const c2 = lift(t.accent, -0.25, 1);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <div style={{ position: "absolute", left: -140 + drift * 40, top: 240, width: 620, height: 380, border: `4px solid ${rgbaOf(c1, 0.5)}`, borderRadius: 34, filter: "blur(7px)" }} />
      <div style={{ position: "absolute", left: 60 + drift * 25, top: 700, width: 420, height: 260, border: `4px solid ${rgbaOf(c2, 0.4)}`, borderRadius: 28, filter: "blur(10px)" }} />
      <div style={{ position: "absolute", right: -180 - drift * 30, top: -80, width: 560, height: 340, border: `4px solid ${rgbaOf(c1, 0.35)}`, borderRadius: 30, filter: "blur(12px)" }} />
    </AbsoluteFill>
  );
};

// ── Component ────────────────────────────────────────────────────────────────

export const GrazeFaceTour: React.FC<GrazeFaceTourProps> = ({
  title = "",
  rows = [],
  ground = "structure",
  accentColor,
  kicker,
  source,
  skipIntro,
  animateOut,
}) => {
  const frame = useCurrentFrame();
  const t = resolveTheme(ground, accentColor);
  const outro = useOutro(animateOut);
  const d = skipIntro ? -999 : 0;

  // full-bleed: wide enough that the tilted/rotated plane still fills the
  // frame edge-to-edge (no dark stage background visible either side)
  const WORLD_W = 2260;
  const n = Math.max(1, rows.length);
  const worldH = n * ROW_H;
  // Camera focus offset (in the Plane's translate() sense) needed to bring
  // row i's vertical centre to the anchor point: worldH/2 - rowCenterY(i).
  const rowFocusY = (i: number) => worldH / 2 - (i + 0.5) * (worldH / n);
  // Camera travels from the first row's centre to the last row's centre,
  // with a gentle lateral drift for a handheld-graze feel.
  const cam: Cam = {
    rx: 14,
    ry: 26,
    rz: -5,
    scale: 1.05,
    x: [90, -90],
    y: [rowFocusY(0), rowFocusY(n - 1)],
  };

  // localFrame/tt/stage are plain values (not a nested component) — a
  // component defined inside a render body would get a fresh type every
  // frame and force React to remount the whole subtree each tick.
  const localFrame = frame - d;
  const durEstimate = 150; // matches recommended durationInFrames; clamps gracefully either side
  const tt = interpolate(localFrame, [0, durEstimate], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const stage = (
    <AbsoluteFill style={{ background: t.bg }}>
      <AtmosphereRects drift={tt} theme={t} />
      <Plane cam={cam} t={tt} theme={t}>
        <RowList t={tt} rows={rows} worldW={WORLD_W} theme={t} />
      </Plane>
    </AbsoluteFill>
  );

  return (
    <Ground ground={ground} accentColor={accentColor} skipIntro={skipIntro} pad={0} texture={false} focus={{ x: 0.42, y: 0.42 }}>
      <div style={{ width: "100%", height: "100%", position: "relative", ...outro }}>
        {stage}
        {/* shallow depth-of-field: everything outside the focus ellipse blurs */}
        <AbsoluteFill
          style={{
            filter: "blur(16px) brightness(0.94)",
            WebkitMaskImage: "radial-gradient(ellipse 58% 52% at 42% 42%, transparent 34%, rgba(0,0,0,0.85) 72%, black 92%)",
            maskImage: "radial-gradient(ellipse 58% 52% at 42% 42%, transparent 34%, rgba(0,0,0,0.85) 72%, black 92%)",
          }}
        >
          {stage}
        </AbsoluteFill>
        {/* vignette + cool-down */}
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse 90% 80% at 50% 45%, transparent 40%, ${rgbaOf(t.bg, 0.55)} 78%, ${rgbaOf(t.bg, 0.92)} 100%)`,
            pointerEvents: "none",
          }}
        />

        {title && (
          <div style={{ position: "absolute", top: SPACE.page, left: SPACE.page }}>
            <SectionTitle title={title} kicker={kicker} theme={t} frame={frame} delay={d} size={TYPE.cardTitle + 8} />
          </div>
        )}
        <SourceTag source={source} theme={t} frame={frame} delay={d + 48} />
      </div>
    </Ground>
  );
};
