/**
 * ChangelogScrollBrake — a long list of variable-height rows scrolls upward
 * with exponential deceleration to a precise stop on a target row (centred
 * in frame); that row alone then lifts (scale + growing shadow) and gets a
 * highlight border while every other row dims to atmosphere.
 *
 * A simpler sibling of BrakeReticleLock: same scroll-brake family (velocity-
 * derived blur, frame-deterministic pseudo-random row heights) but no
 * corner-bracket lock-on — the payoff here is the lift + surrounding dim.
 * Ported from video-shotcraft's ChangelogScrollBrake demo; preserves the
 * per-row height hashing technique, the velocity blur, the `Easing.out(exp)`
 * brake, and the target-lift + others-dim mechanic; restyled onto the shared
 * kit and made data-driven for an arbitrary item count + target index.
 */
import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { z } from "zod";
import {
  Ground,
  GlassCard,
  SourceTag,
  resolveTheme,
  useOutro,
  TYPE,
  SPACE,
  RADIUS,
  baseTemplateSchema,
  type BaseTemplateProps,
  type Theme,
} from "./lib/kit";

// ── Schema ──────────────────────────────────────────────────────────────────

const ChangelogItemSchema = z.object({ title: z.string() });

export const ChangelogScrollBrakePropsSchema = z.object({
  ...baseTemplateSchema,
  items: z.array(ChangelogItemSchema).optional().default(
    Array.from({ length: 30 }, (_, i) => ({ title: `Change entry ${String(i + 1).padStart(2, "0")}` })),
  ),
  targetIndex: z.number().optional().default(24),
  ground: z.enum(["paper", "ink", "structure"]).optional().default("structure"),
});
export type ChangelogScrollBrakeProps = z.input<typeof ChangelogScrollBrakePropsSchema> & BaseTemplateProps;

// ── Layout / scroll physics ─────────────────────────────────────────────────

const CL = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const SCROLL0 = 14;
const SCROLL1 = 64;
const LIFT0 = 68;
const LIFT1 = 82;
const COL_W = 1000;
const COL_X = (1920 - COL_W) / 2;
const GAP = 20;

/** frame-deterministic pseudo-random row height, same hashing technique as source. */
const rowH = (i: number) => 72 + ((i * 29) % 3) * 22;

function buildRowY(n: number): number[] {
  const ys: number[] = [];
  let y = 0;
  for (let i = 0; i < n; i++) {
    ys.push(y);
    y += rowH(i) + GAP;
  }
  return ys;
}

const Row: React.FC<{ i: number; title: string; frame: number; isTarget: boolean; y: number; theme: Theme }> = ({
  i,
  title,
  frame,
  isTarget,
  y,
  theme: t,
}) => {
  const h = rowH(i);
  const tt = interpolate(frame, [LIFT0, LIFT1], [0, 1], { easing: Easing.out(Easing.cubic), ...CL });
  const lift = isTarget ? tt : 0;
  const dim = isTarget ? 0 : tt;
  return (
    <GlassCard
      theme={t}
      style={{
        position: "absolute",
        left: 0,
        top: y,
        width: COL_W,
        height: h,
        display: "flex",
        alignItems: "center",
        gap: SPACE[6],
        padding: `0 ${SPACE[8]}px`,
        boxSizing: "border-box",
        transform: `scale(${1 + 0.03 * lift})`,
        boxShadow: lift > 0 ? `0 ${6 + 22 * lift}px ${16 + 44 * lift}px rgba(0,0,0,${0.1 + 0.3 * lift})` : undefined,
        opacity: 1 - 0.62 * dim,
        zIndex: isTarget ? 2 : 1,
      }}
    >
      <div
        style={{
          fontFamily: TYPE.mono,
          fontSize: TYPE.source,
          fontWeight: TYPE.weight.bold,
          color: isTarget ? "#FFFFFF" : t.muted,
          background: isTarget ? t.accent : t.surface,
          border: isTarget ? "none" : `1px solid ${t.line}`,
          borderRadius: RADIUS.pill,
          width: 44,
          height: 26,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {String(i + 1).padStart(2, "0")}
      </div>
      <div style={{ fontFamily: TYPE.sans, fontSize: 26, fontWeight: TYPE.weight.medium, color: t.ink, letterSpacing: -0.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {title}
      </div>
    </GlassCard>
  );
};

// ── Component ────────────────────────────────────────────────────────────────

export const ChangelogScrollBrake: React.FC<ChangelogScrollBrakeProps> = ({
  items = [],
  targetIndex = 0,
  ground = "structure",
  accentColor,
  source,
  skipIntro,
  animateOut,
}) => {
  const frame = useCurrentFrame();
  const t = resolveTheme(ground, accentColor);
  const outro = useOutro(animateOut);

  const n = Math.max(1, items.length);
  const clampedTarget = Math.max(0, Math.min(n - 1, targetIndex));
  const rowY = buildRowY(n);
  const targetCy = rowY[clampedTarget] + rowH(clampedTarget) / 2;
  const endT = 540 - targetCy;
  const startT = 80;

  const scrollAt = (f: number) => interpolate(f, [SCROLL0, SCROLL1], [startT, endT], { easing: Easing.out(Easing.exp), ...CL });
  const T = scrollAt(frame);
  const v = Math.abs(scrollAt(frame) - scrollAt(frame - 1));
  const blur = Math.min(v / 60, 1) * 6;

  const totalH = rowY.length ? rowY[rowY.length - 1] + rowH(n - 1) : 0;

  return (
    <Ground ground={ground} accentColor={accentColor} skipIntro={skipIntro} pad={0} focus={{ x: 0.5, y: 0.5 }}>
      <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", ...outro }}>
        <div
          style={{
            position: "absolute",
            left: COL_X,
            top: 0,
            width: COL_W,
            height: "100%",
            transform: `translateY(${T}px)`,
            filter: blur > 0.15 ? `blur(${blur}px)` : undefined,
          }}
        >
          <div style={{ position: "relative", width: COL_W, height: totalH }}>
            {items.map((item, i) => (
              <Row key={i} i={i} title={item.title} frame={frame} isTarget={i === clampedTarget} y={rowY[i]} theme={t} />
            ))}
          </div>
        </div>
        <SourceTag source={source} theme={t} frame={frame} delay={LIFT1 + 10} />
      </div>
    </Ground>
  );
};
