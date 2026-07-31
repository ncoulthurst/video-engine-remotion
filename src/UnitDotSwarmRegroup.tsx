/**
 * UnitDotSwarmRegroup — ~300 unit dots scatter, then spring-migrate through
 * three staged formations: labelled clusters → grouped bar-chart columns →
 * a bitmap-digit formation spelling the final total, with a caption below.
 *
 * Ported from video-shotcraft's UnitDotSwarmRegroupV2 (chart-live-moves demo
 * pack) — the frame-deterministic pseudo-random scatter/cluster positions
 * (the `rnd(i,salt)` sin-hash), the 3-stage spring migration, and the
 * per-stage label fade timing are all preserved exactly. The source only
 * defined bitmap glyphs for 1/2/4/7/8 and hardcoded the digit formation for
 * the literal string "12,847" — this port extends the glyph table to 0-9 +
 * comma and builds the formation generically from any `totalLabel`.
 */
import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { z } from "zod";
import {
  Ground,
  Kicker,
  SourceTag,
  resolveTheme,
  useOutro,
  formatNum,
  TYPE,
  SPACE,
  baseTemplateSchema,
  type BaseTemplateProps,
} from "./lib/kit";

const GroupSchema = z.object({
  label: z.string(),
  count: z.number(),
  color: z.enum(["accent", "muted", "ink"]).optional(),
});

export const UnitDotSwarmRegroupPropsSchema = z.object({
  ...baseTemplateSchema,
  groups: z
    .array(GroupSchema)
    .min(2)
    .max(4)
    .optional()
    .default([
      { label: "Free", count: 7210, color: "muted" },
      { label: "Pro", count: 4102, color: "accent" },
      { label: "Enterprise", count: 1535, color: "ink" },
    ]),
  totalLabel: z.string().optional().default("12,847"),
  totalCaption: z.string().optional().default("Total customers"),
  unitCaption: z.string().optional().default("Each dot ≈ 40 customers"),
  ground: z.enum(["paper", "ink", "structure"]).optional().default("structure"),
});
export type UnitDotSwarmRegroupProps = z.input<typeof UnitDotSwarmRegroupPropsSchema> & BaseTemplateProps;

// ── frame-deterministic pseudo-random (sin-hash) — organic, never jittery ──
const rnd = (i: number, salt: number) => {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
};
const lerp = (a: [number, number], b: [number, number], p: number): [number, number] => [
  a[0] + (b[0] - a[0]) * p,
  a[1] + (b[1] - a[1]) * p,
];

// ── timing beats: scatter → cluster → (hold, readable) → bars → (hold,
//    readable) → digits. Each formation gets ~2.7s fully-settled hold so the
//    numbers can actually be read against the narration, and migrations are
//    slower/softer so the swarm reads as a deliberate regroup, not a flick. ──
const M1 = 14;
const DUR = 28; // spring migration duration
const STAG = 10; // per-dot stagger
const SETTLE = DUR + STAG; // frames from migration start until fully settled
const HOLD = 82; // ~2.7s readable hold on each formed shape
const M2 = M1 + SETTLE + HOLD;
const M3 = M2 + SETTLE + HOLD;
const TOTAL_DOTS = 300;
const DOT_R = 9;

// ── largest-remainder split: dot count per group, proportional to `count` ──
function distributeDots(counts: number[], total: number): number[] {
  const sum = counts.reduce((a, b) => a + b, 0) || 1;
  const raw = counts.map((c) => (c / sum) * total);
  const floors = raw.map(Math.floor);
  const used = floors.reduce((a, b) => a + b, 0);
  const remainder = total - used;
  const order = raw
    .map((r, i) => ({ i, frac: r - floors[i] }))
    .sort((a, b) => b.frac - a.frac);
  const out = [...floors];
  for (let k = 0; k < remainder; k++) out[order[k % order.length].i] += 1;
  return out;
}

// ── 5×7 bitmap glyphs (1/2/4/7/8 preserved verbatim from the source; 0/3/5/6/9
//    + comma added so any totalLabel renders). "1" cells are drawn as 4 dot
//    corners (cellPts), matching the source's density-via-repetition look. ──
const DIGIT_GLYPHS: Record<string, string[]> = {
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  "3": ["11111", "00010", "00100", "00010", "00001", "10001", "01110"],
  "4": ["00110", "01010", "10010", "11111", "00010", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "00100", "00100", "00100"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
  // comma — a small baseline dot + trailing tail, 2 cells wide (not 5)
  ",": ["00", "00", "00", "00", "00", "10", "01"],
};

const CELL = 40;
const SUB = 20;
const Y0 = 390;
const DIGIT_ADV = 5 * CELL;
const COMMA_ADV = 2 * CELL;

const cellPts = (x: number, y: number): [number, number][] => [
  [x, y],
  [x + SUB, y],
  [x, y + SUB],
  [x + SUB, y + SUB],
];

function buildGlyph(bitmap: string[], x0: number): [number, number][] {
  const out: [number, number][] = [];
  bitmap.forEach((rowStr, r) => {
    rowStr.split("").forEach((c, col) => {
      if (c === "1") out.push(...cellPts(x0 + col * CELL, Y0 + r * CELL));
    });
  });
  return out;
}

/** buildDigitPts — lay out `label`'s glyphs left→right, centred on 1920. */
function buildDigitPts(label: string): [number, number][] {
  const chars = label.split("");
  const advances = chars.map((c) => (c === "," ? COMMA_ADV : DIGIT_ADV));
  const totalW = advances.reduce((a, b) => a + b, 0);
  let x = (1920 - totalW) / 2;
  const pts: [number, number][] = [];
  chars.forEach((c, i) => {
    const glyph = DIGIT_GLYPHS[c];
    if (glyph) pts.push(...buildGlyph(glyph, x));
    x += advances[i];
  });
  return pts.length ? pts : [[960, Y0 + 3 * CELL]];
}

const digitTarget = (i: number, pts: [number, number][]): [number, number] => {
  const p = pts[i % pts.length];
  const jx = (rnd(i, 5) - 0.5) * 7;
  const jy = (rnd(i, 6) - 0.5) * 7;
  return [p[0] + jx, p[1] + jy];
};

const fade = (frame: number, inA: number, inB: number, outA?: number, outB?: number) => {
  const fi = interpolate(frame, [inA, inB], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (outA === undefined || outB === undefined) return fi;
  const fo = interpolate(frame, [outA, outB], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return Math.min(fi, fo);
};

export const UnitDotSwarmRegroup: React.FC<UnitDotSwarmRegroupProps> = ({
  groups = [],
  totalLabel = "",
  totalCaption = "",
  unitCaption = "",
  ground = "structure",
  accentColor,
  kicker,
  source,
  skipIntro,
  animateOut,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = resolveTheme(ground, accentColor);
  const outro = useOutro(animateOut);

  const dotCounts = distributeDots(groups.map((g) => g.count), TOTAL_DOTS);
  const cum: number[] = [];
  dotCounts.reduce((acc, n, i) => {
    cum[i] = acc + n;
    return cum[i];
  }, 0);
  const groupOf = (i: number) => {
    for (let g = 0; g < cum.length; g++) if (i < cum[g]) return g;
    return cum.length - 1;
  };
  const idxInGroup = (i: number, g: number) => i - (g === 0 ? 0 : cum[g - 1]);

  const colorOf = (g: number): string => {
    const explicit = groups[g]?.color;
    if (explicit === "accent") return t.accent;
    if (explicit === "muted") return t.muted;
    if (explicit === "ink") return t.ink;
    return g === 0 ? t.muted : g === 1 ? t.accent : t.ink;
  };

  // cluster + bar column centres — spread evenly, generalised to 2-4 groups
  const marginX = 340;
  const spanW = 1920 - marginX * 2;
  const gx = (g: number) => (groups.length > 1 ? marginX + (spanW / (groups.length - 1)) * g : 960);
  const clusterY = 610;
  const clusterR = dotCounts.map((n) => 58 + n * 0.46);
  const barBase = 840;
  const barSpacing = 20;

  const scatter = (i: number): [number, number] => [300 + rnd(i, 1) * 1320, 330 + rnd(i, 2) * 620];
  const cluster = (i: number, g: number): [number, number] => {
    const r = Math.sqrt(rnd(i, 3)) * clusterR[g];
    const a = rnd(i, 4) * Math.PI * 2;
    return [gx(g) + r * Math.cos(a), clusterY + r * Math.sin(a)];
  };
  const bar = (i: number, g: number): [number, number] => {
    const j = idxInGroup(i, g);
    const col = j % 8;
    const row = Math.floor(j / 8);
    return [gx(g) + (col - 3.5) * barSpacing, barBase - row * barSpacing];
  };

  const digitPts = buildDigitPts(totalLabel);

  const dots = Array.from({ length: TOTAL_DOTS }, (_, i) => {
    const g = groupOf(i);
    if (skipIntro) return digitTarget(i, digitPts);
    const stag = rnd(i, 7) * STAG;
    const mig = (start: number) =>
      spring({ frame: frame - start - stag, fps, config: { damping: 15, stiffness: 90, mass: 1 }, durationInFrames: DUR, durationRestThreshold: 0.0001 });
    let p = scatter(i);
    p = lerp(p, cluster(i, g), mig(M1));
    p = lerp(p, bar(i, g), mig(M2));
    p = lerp(p, digitTarget(i, digitPts), mig(M3));
    return p;
  });

  const clusterLabelOp = skipIntro ? 0 : fade(frame, M1 + SETTLE - 6, M1 + SETTLE + 4, M2, M2 + 10);
  const barLabelOp = skipIntro ? 0 : fade(frame, M2 + SETTLE - 6, M2 + SETTLE + 4, M3, M3 + 10);
  const captionOp = skipIntro ? 1 : fade(frame, M3 + SETTLE, M3 + SETTLE + 14);

  const barMinX = Math.min(...groups.map((_, g) => gx(g))) - 160;
  const barMaxX = Math.max(...groups.map((_, g) => gx(g))) + 160;

  return (
    <Ground ground={ground} accentColor={accentColor} skipIntro={skipIntro} pad={0} focus={{ x: 0.5, y: 0.4 }}>
      <div style={{ position: "absolute", inset: 0, ...outro }}>
        <div style={{ position: "absolute", left: SPACE.page, top: SPACE.page }}>
          <Kicker label={kicker ?? "Customer Base"} theme={t} frame={frame} align="left" />
        </div>

        <div
          style={{
            position: "absolute",
            left: SPACE.page,
            bottom: 70,
            display: "flex",
            alignItems: "center",
            gap: SPACE[3],
            fontFamily: TYPE.sans,
            fontSize: 24,
            fontWeight: TYPE.weight.semibold,
            color: t.muted,
          }}
        >
          <div style={{ width: 18, height: 18, borderRadius: 9, background: t.muted }} />
          {unitCaption}
        </div>

        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          {dots.map((p, i) => (
            <circle key={i} cx={p[0]} cy={p[1]} r={DOT_R} fill={colorOf(groupOf(i))} />
          ))}
        </svg>

        {clusterLabelOp > 0 &&
          groups.map((gp, g) => (
            <div
              key={`cl${g}`}
              style={{
                position: "absolute",
                left: gx(g) - 200,
                top: clusterY - clusterR[g] - 66,
                width: 400,
                textAlign: "center",
                fontFamily: TYPE.sans,
                fontSize: 30,
                fontWeight: TYPE.weight.bold,
                color: colorOf(g),
                opacity: clusterLabelOp,
              }}
            >
              {gp.label} · {formatNum(gp.count)}
            </div>
          ))}

        {barLabelOp > 0 && (
          <>
            <div style={{ position: "absolute", left: barMinX, width: barMaxX - barMinX, top: barBase + 16, height: 3, background: t.accent, opacity: barLabelOp }} />
            {groups.map((gp, g) => (
              <div
                key={`bl${g}`}
                style={{
                  position: "absolute",
                  left: gx(g) - 150,
                  top: barBase + 30,
                  width: 300,
                  textAlign: "center",
                  fontFamily: TYPE.sans,
                  fontSize: 28,
                  fontWeight: TYPE.weight.bold,
                  color: colorOf(g),
                  opacity: barLabelOp,
                }}
              >
                {gp.label}
              </div>
            ))}
          </>
        )}

        {captionOp > 0 && (
          <div
            style={{
              position: "absolute",
              left: 0,
              width: 1920,
              top: Y0 + 7 * CELL + 60,
              textAlign: "center",
              fontFamily: TYPE.sans,
              fontSize: 34,
              fontWeight: TYPE.weight.semibold,
              color: t.muted,
              opacity: captionOp,
              letterSpacing: 2,
            }}
          >
            {totalCaption}
          </div>
        )}
      </div>
      <SourceTag source={source} theme={t} frame={frame} delay={340} position="top-right" />
    </Ground>
  );
};
