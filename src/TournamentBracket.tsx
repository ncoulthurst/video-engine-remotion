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
  serifFontFamily,
  COLORS,
  Grain,
  PaperBackground,
  WorldStateSchema,
} from "./shared";

// ── Schema ────────────────────────────────────────────────────────────────────

const MatchSchema = z.object({
  round:  z.enum(["R16", "QF", "SF", "Final"]),
  teamA:  z.string(),
  teamB:  z.string(),
  scoreA: z.number(),
  scoreB: z.number(),
  winner: z.string(),
});
export type Match = z.infer<typeof MatchSchema>;

export const TournamentBracketPropsSchema = z.object({
  matches:           z.array(MatchSchema).default([]),
  focusTeam:         z.string().default(""),
  title:             z.string().optional().default("FIFA World Cup 2002"),
  subtitle:          z.string().optional().default(""),
  accentColor:       z.string().optional().default("#22C55E"),
  highlightLineColor:z.string().optional().default("#22C55E"),
  bgColor:           z.string().optional().default("#f0ece4"),
  skipIntro:         z.boolean().optional().default(false),
  worldState:        WorldStateSchema.optional(),
});
export type TournamentBracketProps = z.infer<typeof TournamentBracketPropsSchema>;

// ── Types ─────────────────────────────────────────────────────────────────────

type StageKey = "R16" | "QF" | "SF" | "Final";
type Side     = "L" | "R" | "C";

type BracketNode = {
  key:        string;
  team:       string;
  score:      number;
  stage:      StageKey;
  side:       Side;
  index:      number;
  teamSlot:   "A" | "B";
  x:          number;
  y:          number;
  isFocus:    boolean;
  isWinner:   boolean;
  entryFrame: number; // frame at which this pill waves in
};

type BracketEdge = {
  d:            string;
  pathLength:   number;
  isActive:     boolean;
  focusRound:   number; // 0=R16, 1=QF, 2=SF+Final
  staggerIndex: number; // position within this round's edge group
};

type CamValues = { cx: number; cy: number; scale: number };

// ── Canvas constants ──────────────────────────────────────────────────────────

const VIEW_W   = 1920;
const VIEW_H   = 1080;
const CANVAS_W = 3360;
const CANVAS_H = 1460;
const PILL_W   = 300;
const PILL_H   = 84;
const ENTRY_GAP = 42;

// ─────────────────────────────────────────────────────────────────────────────
// generateBracketLayout — pure function, no DOM, no React, deterministic
// ─────────────────────────────────────────────────────────────────────────────
function generateBracketLayout(
  allMatches: Match[],
  focusTeam: string,
): { nodes: BracketNode[]; edges: BracketEdge[] } {
  const MATCH_GAP = 90, TOP = 300;

  const COL_X = {
    r16L: 96, qfL: 520, sfL: 980,
    fin:  1530,
    sfR:  2080, qfR: 2540, r16R: 2964,
  } as const;

  function groupCenter(base: number) { return base + PILL_H + ENTRY_GAP / 2; }
  function centeredBase(a: number, b: number) {
    return (groupCenter(a) + groupCenter(b)) / 2 - (PILL_H + ENTRY_GAP / 2);
  }

  const R16_BASES = Array.from({ length: 4 }, (_, i) => TOP + i * (PILL_H * 2 + ENTRY_GAP + MATCH_GAP));
  const QF_BASES  = [centeredBase(R16_BASES[0], R16_BASES[1]), centeredBase(R16_BASES[2], R16_BASES[3])];
  const SF_BASES  = [centeredBase(QF_BASES[0], QF_BASES[1])];
  const FINAL_BASE = SF_BASES[0];

  function stageBaseY(stage: StageKey, index: number) {
    if (stage === "R16")   return R16_BASES[index];
    if (stage === "QF")    return QF_BASES[index];
    if (stage === "SF")    return SF_BASES[0];
    return FINAL_BASE;
  }
  function stageX(stage: StageKey, side: Side) {
    if (stage === "R16") return side === "L" ? COL_X.r16L : COL_X.r16R;
    if (stage === "QF")  return side === "L" ? COL_X.qfL  : COL_X.qfR;
    if (stage === "SF")  return side === "L" ? COL_X.sfL  : COL_X.sfR;
    return COL_X.fin;
  }

  // ── Group flat match array by stage + side ──────────────────────────────
  const r16 = allMatches.filter(m => m.round === "R16");
  const qf  = allMatches.filter(m => m.round === "QF");
  const sf  = allMatches.filter(m => m.round === "SF");
  const fin = allMatches.find(m => m.round === "Final");

  type MatchGroup = { m: Match; stage: StageKey; side: Side; index: number; round: number };

  const groups: MatchGroup[] = [
    ...r16.slice(0, 4).map((m, i) => ({ m, stage: "R16" as StageKey, side: "L" as Side, index: i, round: 0 })),
    ...qf.slice(0, 2).map((m, i)  => ({ m, stage: "QF"  as StageKey, side: "L" as Side, index: i, round: 1 })),
    ...(sf[0] ? [{ m: sf[0], stage: "SF"    as StageKey, side: "L" as Side, index: 0, round: 2 }] : []),
    ...(fin   ? [{ m: fin,   stage: "Final" as StageKey, side: "C" as Side, index: 0, round: 2 }] : []),
    ...(sf[1] ? [{ m: sf[1], stage: "SF"    as StageKey, side: "R" as Side, index: 0, round: 2 }] : []),
    ...qf.slice(2).map((m, i)  => ({ m, stage: "QF"  as StageKey, side: "R" as Side, index: i, round: 1 })),
    ...r16.slice(4).map((m, i) => ({ m, stage: "R16" as StageKey, side: "R" as Side, index: i, round: 0 })),
  ];

  const nodes: BracketNode[] = [];
  const edges: BracketEdge[] = [];

  // ── Build nodes ─────────────────────────────────────────────────────────
  for (const { m, stage, side, index } of groups) {
    const x = stageX(stage, side), baseY = stageBaseY(stage, index);
    nodes.push({ key: `${stage}-${side}-${index}-A`, team: m.teamA, score: m.scoreA, stage, side, index, teamSlot: "A", x, y: baseY,                isFocus: m.teamA === focusTeam, isWinner: m.winner === m.teamA, entryFrame: 0 });
    nodes.push({ key: `${stage}-${side}-${index}-B`, team: m.teamB, score: m.scoreB, stage, side, index, teamSlot: "B", x, y: baseY + PILL_H + ENTRY_GAP, isFocus: m.teamB === focusTeam, isWinner: m.winner === m.teamB, entryFrame: 0 });
  }

  // ── Build edges ──────────────────────────────────────────────────────────
  const staggerCounters: Record<string, number> = {};

  function addEdges(from: MatchGroup, to: MatchGroup) {
    const { stage: fs, side: fside, index: findex, round } = from;
    const { stage: ts, side: tside, index: tindex } = to;

    // The winner advances → they appear as a pill in the target match.
    // Draw one smooth cubic bezier from the source winner pill to that same
    // team's pill in the next round. No stubs, no elbows — a single flowing line.
    const winner = from.m.winner;
    const src = nodes.find(n => n.stage === fs && n.side === fside && n.index === findex && n.team === winner);
    const dst = nodes.find(n => n.stage === ts && n.side === tside && n.index === tindex && n.team === winner);
    if (!src || !dst) return;

    const movingRight = fside !== "R";
    const sx = movingRight ? src.x + PILL_W : src.x;
    const sy = src.y + PILL_H / 2;
    const tx = movingRight ? dst.x : dst.x + PILL_W;
    const ty = dst.y + PILL_H / 2;

    // Horizontal-tangent cubic bezier — premium S-curve, no 90° corners.
    const dx = tx - sx;
    const c1x = sx + dx * 0.55;
    const c2x = tx - dx * 0.55;
    const d = `M${sx},${sy} C${c1x},${sy} ${c2x},${ty} ${tx},${ty}`;

    // Approximate arc length for the dash-offset draw-in animation.
    const pathLength = Math.hypot(dx, ty - sy) * 1.15;

    const active = winner === focusTeam;
    const gk = `${round}-${active}`;
    const si = staggerCounters[gk] ?? 0;
    staggerCounters[gk] = si + 1;
    edges.push({ d, pathLength, isActive: active, focusRound: round, staggerIndex: si });
  }

  // Bracket connections: R16→QF→SF→Final on each side
  const r16L = groups.filter(g => g.stage === "R16" && g.side === "L");
  const r16R = groups.filter(g => g.stage === "R16" && g.side === "R");
  const qfL  = groups.filter(g => g.stage === "QF"  && g.side === "L");
  const qfR  = groups.filter(g => g.stage === "QF"  && g.side === "R");
  const sfL  = groups.find(g => g.stage === "SF" && g.side === "L");
  const sfR  = groups.find(g => g.stage === "SF" && g.side === "R");
  const finG = groups.find(g => g.stage === "Final");

  r16L.forEach((g, i) => { const next = qfL[Math.floor(i / 2)]; if (next) addEdges(g, next); });
  qfL.forEach(g  => { if (sfL) addEdges(g, sfL); });
  if (sfL && finG) addEdges(sfL, finG);

  r16R.forEach((g, i) => { const next = qfR[Math.floor(i / 2)]; if (next) addEdges(g, next); });
  qfR.forEach(g  => { if (sfR) addEdges(g, sfR); });
  if (sfR && finG) addEdges(sfR, finG);

  // ── Post-process: assign wave-in entry frames per stage ──────────────────
  const STAGE_ENTRY: Record<StageKey, number> = { R16: 12, QF: 54, SF: 81, Final: 81 };
  const STAGE_STAGGER: Record<StageKey, number> = { R16: 1.1, QF: 1.95, SF: 2.4, Final: 2.4 };
  const stageCounts: Partial<Record<StageKey, number>> = {};
  for (const node of nodes) {
    const count = stageCounts[node.stage] ?? 0;
    node.entryFrame = STAGE_ENTRY[node.stage] + count * STAGE_STAGGER[node.stage];
    stageCounts[node.stage] = count + 1;
  }

  return { nodes, edges };
}

// ── Frame timing constants (GSAP times × 30fps) ───────────────────────────────
//   Phase 1 materialise: 0–120f
//   Phase 2 dimming:    120–150f
//   Phase 3 R16:        150–214f
//   Phase 4 QF:         214–279f
//   Phase 5 SF:         279–343f
//   Phase 6 Final:      343–441f
//   Phase 7 reveal:     441–540f

const F = {
  DIM_START:   120,  // 4.0s
  R16_CAM:     150,  // 5.0s
  R16_LABEL:   174,  // 5.8s
  R16_EDGE:    177,  // 5.9s
  R16_SCORE:   186,  // 6.2s
  QF_EXIT:     208,  // 6.95s
  R16_GLOW:    210,  // 7.0s
  QF_CAM:      214,  // 7.15s
  QF_TEXT:     219,  // 7.3s
  QF_LABEL:    225,  // 7.5s
  QF_EDGE:     235,  // 7.85s
  QF_SCORE:    243,  // 8.1s
  QF_GLOW:     268,  // 8.95s
  SF_EXIT:     273,  // 9.1s
  SF_CAM:      279,  // 9.3s
  SF_TEXT:     283,  // 9.45s
  SF_LABEL:    289,  // 9.65s
  SF_EDGE:     301,  // 10.05s
  SF_SCORE:    309,  // 10.3s
  SF_GLOW:     327,  // 10.9s
  FIN_EXIT:    337,  // 11.25s
  FIN_CAM:     343,  // 11.45s
  FIN_TEXT:    351,  // 11.7s
  FIN_LABEL:   357,  // 11.9s
  FIN_SCORE:   372,  // 12.4s
  WIN_CIRCLE:  388,  // 12.95s
  FIN_GLOW:    397,  // 13.25s
  REV_EXIT:    435,  // 14.5s
  REV_CAM:     441,  // 14.7s
  HDR_RESTORE: 450,  // 15.0s
  PILL_RESTORE:456,  // 15.2s
  SCORE_SET:   462,  // 15.4s
  SCORE_FADE:  465,  // 15.5s
  END:         540,  // 18s
};

// ── Camera ────────────────────────────────────────────────────────────────────

// Material-standard ease — the smooth, deliberate curve used for cinematic camera work.
const easeInOut = Easing.bezier(0.4, 0, 0.2, 1);

function cameraForPose({ cx, cy, scale }: CamValues) {
  // No clamp — poses place (cx, cy) exactly at view center. When we zoom in
  // tight on a pill near the canvas edge, the PaperBackground (rendered behind
  // the camera div) fills whatever the bracket doesn't cover.
  return {
    scale,
    tx: VIEW_W / 2 - cx * scale,
    ty: VIEW_H / 2 - cy * scale,
  };
}

type CamSegment = { f0: number; f1: number; from: CamValues; to: CamValues };

function activeCam(frame: number, segs: CamSegment[], initial: CamValues): CamValues {
  let pose = initial;
  for (const seg of segs) {
    if (frame < seg.f0) break;
    const t = easeInOut(interpolate(frame, [seg.f0, seg.f1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
    pose = {
      cx:    seg.from.cx    + (seg.to.cx    - seg.from.cx)    * t,
      cy:    seg.from.cy    + (seg.to.cy    - seg.from.cy)    * t,
      scale: seg.from.scale + (seg.to.scale - seg.from.scale) * t,
    };
  }
  return pose;
}

// ── Animation helpers ─────────────────────────────────────────────────────────

function getNonFocusDimFactor(frame: number) {
  if (frame < F.DIM_START) return 1;
  if (frame < F.R16_CAM)   return interpolate(frame, [F.DIM_START, F.R16_CAM], [1, 0.05], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeInOut });
  return 0.05; // Stay dim — camera holds on Brazil's path through to the hero shot.
}

function getPillOpacity(node: BracketNode, frame: number, isFocusMatch: boolean): number {
  const reveal = interpolate(frame, [node.entryFrame, node.entryFrame + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  // Both teams in each Brazil-involved match stay fully visible so the viewer
  // can read both scorelines — it's not just the focus pill that matters.
  if (isFocusMatch) return reveal;
  return reveal * getNonFocusDimFactor(frame);
}

function getEdgeDrawState(edge: BracketEdge, frame: number): { progress: number; opacity: number } {
  const si = edge.staggerIndex;
  if (edge.isActive) {
    const starts: Record<number, number> = { 0: F.R16_EDGE, 1: F.QF_EDGE, 2: F.SF_EDGE };
    const start = starts[edge.focusRound] ?? F.R16_EDGE;
    const p = interpolate(frame, [start + si * 0.5, start + si * 0.5 + 36], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
    return { progress: p, opacity: p };
  }
  const bases: Record<number, number> = { 0: 39, 1: 66, 2: 93 };
  const base = bases[edge.focusRound] ?? 39;
  const p = interpolate(frame, [base + si * 0.5, base + si * 0.5 + 21], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.quad) });
  return { progress: p, opacity: p * 0.75 };
}

function getDisplayScore(node: BracketNode, frame: number, isFocusMatch: boolean): number {
  if (!isFocusMatch || frame >= F.SCORE_SET) return node.score;
  const starts: Record<StageKey, number> = { R16: F.R16_SCORE, QF: F.QF_SCORE, SF: F.SF_SCORE, Final: F.FIN_SCORE };
  const start = starts[node.stage];
  // Smooth count-up: ~12 frames per goal (0.4s each) plus a 24-frame baseline,
  // with ease-out cubic so the number decelerates like an odometer settling.
  // Caps at 66 frames (2.2s) so high scores don't run long.
  const dur = Math.max(24, Math.min(66, 24 + node.score * 12));
  return Math.round(interpolate(frame, [start, start + dur], [0, node.score], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  }));
}

function getScoreOpacity(node: BracketNode, frame: number, isFocusMatch: boolean): number {
  // Focus matches count up at their stage's SCORE frame (dramatic reveal).
  // Every other match shows its scoreline too — faded in shortly after the
  // pill materialises — so the viewer can read both teams' goals everywhere.
  if (isFocusMatch) {
    const starts: Record<StageKey, number> = { R16: F.R16_SCORE, QF: F.QF_SCORE, SF: F.SF_SCORE, Final: F.FIN_SCORE };
    return interpolate(frame, [starts[node.stage], starts[node.stage] + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  }
  return interpolate(frame, [node.entryFrame + 14, node.entryFrame + 28], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
}

function getLabelState(frame: number): { text: string; x: number; opacity: number } {
  const phases = [
    { enter: F.R16_LABEL, exit: F.QF_EXIT,  text: "Round of 16"  },
    { enter: F.QF_LABEL,  exit: F.SF_EXIT,  text: "Quarter-final" },
    { enter: F.SF_LABEL,  exit: F.FIN_EXIT, text: "Semi-final"   },
    { enter: F.FIN_LABEL, exit: F.END + 60, text: "The Final"    },
  ];
  let text = phases[0].text, x = 32, opacity = 0;
  for (const ph of phases) {
    if (frame < ph.enter) break;
    text = ph.text;
    if (frame < ph.exit) {
      const t = Easing.out(Easing.cubic)(interpolate(frame, [ph.enter, ph.enter + 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
      x = 32 * (1 - t);
      opacity = t;
    } else {
      const t = Easing.in(Easing.quad)(interpolate(frame, [ph.exit, ph.exit + 11], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
      x = -24 * t;
      opacity = 1 - t;
    }
  }
  return { text, x, opacity };
}

function getArrivalGlowIntensity(node: BracketNode, frame: number): number {
  const glowFrames: Partial<Record<StageKey, number>> = {
    R16: F.R16_GLOW, QF: F.QF_GLOW, SF: F.SF_GLOW, Final: F.FIN_GLOW,
  };
  const gf = glowFrames[node.stage];
  if (!gf) return 0;
  // Victory surge — the Final pill continues glowing through the hero shot.
  if (node.stage === "Final" && frame >= F.REV_CAM) {
    return interpolate(frame, [F.REV_CAM, F.REV_CAM + 30, F.END], [0.22, 0.78, 0.6],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  }
  return interpolate(frame, [gf, gf + 10, gf + 37], [0, 0.52, 0.22], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
}

// ── Sub-components ────────────────────────────────────────────────────────────

// SVG polygon points for an N-pointed star, centred at (0,0).
function starPoints(n: number, outer: number, inner: number = outer * 0.4): string {
  const pts: string[] = [];
  for (let i = 0; i < n * 2; i++) {
    const angle = (Math.PI / n) * i - Math.PI / 2;
    const r = i % 2 === 0 ? outer : inner;
    pts.push(`${(r * Math.cos(angle)).toFixed(2)},${(r * Math.sin(angle)).toFixed(2)}`);
  }
  return pts.join(" ");
}

const FlagBadge: React.FC<{ team: string; size?: number }> = ({ team, size = 44 }) => {
  const base: React.CSSProperties = {
    width: size, height: size,
    borderRadius: Math.round(size * 0.29),
    overflow: "hidden", position: "relative", flexShrink: 0,
    boxShadow: "0 0 0 1px rgba(17,17,17,0.10), 0 2px 6px rgba(0,0,0,0.10)",
    background: "#f0ece4",
  };
  const el = (style: React.CSSProperties) => <div style={{ position: "absolute", ...style }} />;

  switch (team) {
    case "Argentina":   return <div style={{ ...base, background: "linear-gradient(180deg, #74acdf 0 33%, #fff 33% 66%, #74acdf 66%)" }}>{el({ left:"50%", top:"50%", width:size*.14, height:size*.14, background:"#f0c419", transform:"translate(-50%,-50%)", borderRadius:999 })}</div>;
    case "France":      return <div style={{ ...base, background: "linear-gradient(90deg, #1d4fa3 0 33%, #fff 33% 66%, #d62828 66%)" }} />;
    case "Netherlands": return <div style={{ ...base, background: "linear-gradient(180deg, #ae1c28 0 33%, #fff 33% 66%, #21468b 66%)" }} />;
    case "Croatia":     return <div style={{ ...base, background: "linear-gradient(180deg, #d62828 0 33%, #fff 33% 66%, #1d4fa3 66%)" }}>{el({
      left:"50%", top:"50%",
      width: size*0.40, height: size*0.34,
      transform:"translate(-50%,-50%)",
      background: "conic-gradient(#d62828 25%, #fff 0 50%, #d62828 0 75%, #fff 0)",
      backgroundSize: `${size*0.095}px ${size*0.095}px`,
      boxShadow: "0 0 0 0.5px rgba(17,17,17,0.45)",
      borderRadius: 1,
    })}</div>;
    case "England":     return <div style={{ ...base, background:"#fff" }}>{el({left:"50%",top:0,width:size*.2,height:size,background:"#ce2028",transform:"translateX(-50%)"})}{el({left:0,top:"50%",width:size,height:size*.2,background:"#ce2028",transform:"translateY(-50%)"})}</div>;
    case "Poland":      return <div style={{ ...base, background: "linear-gradient(180deg, #fff 0 50%, #dc143c 50%)" }} />;
    case "Senegal":     return <div style={{ ...base, background: "linear-gradient(90deg, #00853f 0 33.33%, #fcd116 33.33% 66.67%, #e31b23 66.67%)" }}>
      <svg viewBox="-10 -10 20 20" style={{ position:"absolute", inset:0, width:"100%", height:"100%" }}>
        <polygon points={starPoints(5, 4.2)} fill="#00853f" />
      </svg>
    </div>;
    case "USA":         return <div style={{ ...base, background: "repeating-linear-gradient(180deg, #b22234 0 10%, #fff 10% 20%)" }}>{el({left:0,top:0,width:size*.48,height:size*.52,background:"#3c3b6e"})}</div>;
    case "Australia":   return <div style={{ ...base, background: "#012169" }}>
      <svg viewBox="0 0 100 100" style={{ position:"absolute", inset:0, width:"100%", height:"100%" }}>
        {/* Union Jack canton, clipped to the upper-left quadrant */}
        <svg viewBox="0 0 50 50" width="50" height="50" x="0" y="0" overflow="hidden">
          <rect width="50" height="50" fill="#012169" />
          {/* White saltire (St Andrew + St Patrick fimbriation merged) */}
          <line x1="0"  y1="0"  x2="50" y2="50" stroke="#fff"    strokeWidth="10" />
          <line x1="50" y1="0"  x2="0"  y2="50" stroke="#fff"    strokeWidth="10" />
          {/* Red St Patrick saltire (simplified centred, omits offset fimbriation) */}
          <line x1="0"  y1="0"  x2="50" y2="50" stroke="#c8102e" strokeWidth="3" />
          <line x1="50" y1="0"  x2="0"  y2="50" stroke="#c8102e" strokeWidth="3" />
          {/* White St George cross */}
          <rect x="20" y="0"  width="10" height="50" fill="#fff" />
          <rect x="0"  y="20" width="50" height="10" fill="#fff" />
          {/* Red St George cross */}
          <rect x="23" y="0"  width="4"  height="50" fill="#c8102e" />
          <rect x="0"  y="23" width="50" height="4"  fill="#c8102e" />
        </svg>
        {/* Commonwealth Star — 7-pointed, large, under the canton */}
        <polygon points={starPoints(7, 11)}  transform="translate(25, 77)" fill="#fff" />
        {/* Southern Cross — four 7-pointed stars + small 5-pointed Epsilon */}
        <polygon points={starPoints(7, 5.5)} transform="translate(72, 22)" fill="#fff" />
        <polygon points={starPoints(7, 5)}   transform="translate(87, 42)" fill="#fff" />
        <polygon points={starPoints(7, 5.5)} transform="translate(80, 64)" fill="#fff" />
        <polygon points={starPoints(7, 5)}   transform="translate(64, 75)" fill="#fff" />
        <polygon points={starPoints(5, 3)}   transform="translate(78, 55)" fill="#fff" />
      </svg>
    </div>;
    case "Brazil":      return <div style={{ ...base, background: "#169b62" }}>{el({left:"50%",top:"50%",width:size*.62,height:size*.62,background:"#f7d046",transform:"translate(-50%,-50%) rotate(45deg)",borderRadius:3})}{el({left:"50%",top:"50%",width:size*.28,height:size*.28,background:"#2b59c3",transform:"translate(-50%,-50%)",borderRadius:999})}</div>;
    case "Japan":       return <div style={{ ...base, background: "#fff" }}>{el({left:"50%",top:"50%",width:size*.42,height:size*.42,background:"#c1121f",transform:"translate(-50%,-50%)",borderRadius:999})}</div>;
    case "South Korea": return <div style={{ ...base, background: "#fff" }}>
      <svg viewBox="-20 -20 40 40" style={{ position:"absolute", inset:0, width:"100%", height:"100%" }}>
        {/* Taegeuk — red full disc, blue S-curve half overlaid */}
        <circle r="10" fill="#cd2e3a" />
        <path d="M -10,0 A 10,10 0 0,1 10,0 A 5,5 0 0,1 0,0 A 5,5 0 0,0 -10,0 Z" fill="#0047a0" />
        {/* Trigrams — four corners, perpendicular to the taegeuk axis */}
        <g fill="#000">
          {/* TL: ☰ Geon (3 solid) */}
          <g transform="translate(-13, -13) rotate(-45)">
            <rect x="-4.5" y="-3.7" width="9" height="1.2" />
            <rect x="-4.5" y="-0.6" width="9" height="1.2" />
            <rect x="-4.5" y="2.5"  width="9" height="1.2" />
          </g>
          {/* TR: ☵ Gam (broken-solid-broken) */}
          <g transform="translate(13, -13) rotate(45)">
            <rect x="-4.5" y="-3.7" width="3.7" height="1.2" />
            <rect x="0.8"  y="-3.7" width="3.7" height="1.2" />
            <rect x="-4.5" y="-0.6" width="9"   height="1.2" />
            <rect x="-4.5" y="2.5"  width="3.7" height="1.2" />
            <rect x="0.8"  y="2.5"  width="3.7" height="1.2" />
          </g>
          {/* BL: ☲ Ri (solid-broken-solid) */}
          <g transform="translate(-13, 13) rotate(45)">
            <rect x="-4.5" y="-3.7" width="9"   height="1.2" />
            <rect x="-4.5" y="-0.6" width="3.7" height="1.2" />
            <rect x="0.8"  y="-0.6" width="3.7" height="1.2" />
            <rect x="-4.5" y="2.5"  width="9"   height="1.2" />
          </g>
          {/* BR: ☷ Gon (all broken) */}
          <g transform="translate(13, 13) rotate(-45)">
            <rect x="-4.5" y="-3.7" width="3.7" height="1.2" />
            <rect x="0.8"  y="-3.7" width="3.7" height="1.2" />
            <rect x="-4.5" y="-0.6" width="3.7" height="1.2" />
            <rect x="0.8"  y="-0.6" width="3.7" height="1.2" />
            <rect x="-4.5" y="2.5"  width="3.7" height="1.2" />
            <rect x="0.8"  y="2.5"  width="3.7" height="1.2" />
          </g>
        </g>
      </svg>
    </div>;
    case "Morocco":     return <div style={{ ...base, background: "#c1272d" }}>{el({left:"50%",top:"50%",width:size*.28,height:size*.28,border:`${Math.max(1,size*.05)}px solid #006233`,transform:"translate(-50%,-50%) rotate(45deg)",boxSizing:"border-box"})}</div>;
    case "Spain":       return <div style={{ ...base, background: "linear-gradient(180deg, #aa151b 0 25%, #f1bf00 25% 75%, #aa151b 75%)" }} />;
    case "Portugal":    return <div style={{ ...base, background: "linear-gradient(90deg, #046a38 0 40%, #da291c 40%)" }}>{el({left:"42%",top:"50%",width:size*.2,height:size*.2,background:"#f7d046",transform:"translate(-50%,-50%)",borderRadius:999})}</div>;
    case "Switzerland": return <div style={{ ...base, background: "#d52b1e" }}>{el({left:"50%",top:"50%",width:size*.18,height:size*.58,background:"#fff",transform:"translate(-50%,-50%)"})}{el({left:"50%",top:"50%",width:size*.58,height:size*.18,background:"#fff",transform:"translate(-50%,-50%)"})}</div>;
    default: return <div style={{ ...base, display:"flex", alignItems:"center", justifyContent:"center", fontFamily, fontSize: size*.32, fontWeight:800, color:COLORS.secondary }}>{team.slice(0,2).toUpperCase()}</div>;
  }
};

const TeamPill: React.FC<{
  node:          BracketNode;
  opacity:       number;
  scoreValue:    number;
  scoreOpacity:  number;
  accentColor:   string;
  glowIntensity: number;
}> = ({ node, opacity, scoreValue, scoreOpacity, accentColor, glowIntensity }) => (
  <div
    style={{
      position:    "absolute",
      left:        node.x,
      top:         node.y,
      width:       PILL_W,
      height:      PILL_H,
      borderRadius: 12,
      background:  "rgba(249,245,239,0.98)",
      border:      `1.5px solid ${node.isFocus ? `${accentColor}42` : "rgba(17,17,17,0.10)"}`,
      display:     "flex",
      alignItems:  "center",
      gap:          14,
      padding:     "0 18px",
      boxSizing:   "border-box",
      opacity,
      boxShadow:   node.isFocus
        ? `0 8px 24px rgba(0,0,0,0.10), 0 0 0 ${1 + 2 * glowIntensity}px rgba(34,197,94,${glowIntensity}), 0 0 ${24 * glowIntensity}px rgba(34,197,94,${glowIntensity * 0.7})`
        : "0 4px 16px rgba(0,0,0,0.06)",
    }}
  >
    <FlagBadge team={node.team} />
    <div style={{ flex:1, minWidth:0, fontFamily, fontSize:26, fontWeight: node.isWinner ? 800 : 700, color: COLORS.primary, letterSpacing:-0.3, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
      {node.team}
    </div>
    <div style={{ fontFamily: serifFontFamily, fontSize:32, fontWeight:900, minWidth:16, textAlign:"right", color: node.isWinner ? accentColor : "rgba(17,17,17,0.8)", opacity: scoreOpacity, letterSpacing:-0.6 }}>
      {scoreValue}
    </div>
  </div>
);

const BracketEdgePath: React.FC<{ edge: BracketEdge; progress: number; opacity: number; accentColor: string }> = ({ edge, progress, opacity, accentColor }) => (
  // Normalize with pathLength={100} so dash math is geometry-agnostic — the
  // cubic's true arc length doesn't need to match our hypot approximation.
  <path
    d={edge.d}
    fill="none"
    stroke={edge.isActive ? accentColor : "rgba(17,17,17,0.13)"}
    strokeWidth={edge.isActive ? 5.5 : 2}
    opacity={opacity}
    pathLength={100}
    strokeDasharray={100}
    strokeDashoffset={100 * (1 - progress)}
    strokeLinecap="round"
    strokeLinejoin="round"
  />
);

const WinnerEllipse: React.FC<{ node: BracketNode; progress: number; color: string }> = ({ node, progress, color }) => {
  const cx = node.x + PILL_W / 2, cy = node.y + PILL_H / 2;
  const rx = PILL_W / 2 + 16, ry = PILL_H / 2 + 14;
  const circ = 2 * Math.PI * Math.sqrt((rx * rx + ry * ry) / 2);
  return (
    <ellipse cx={cx} cy={cy} rx={rx} ry={ry}
      fill="none" stroke={color} strokeWidth={4.5}
      strokeDasharray={circ} strokeDashoffset={circ * (1 - progress)}
      strokeLinecap="round" opacity={progress}
    />
  );
};

// ── Main component ────────────────────────────────────────────────────────────

export const TournamentBracket: React.FC<TournamentBracketProps> = ({
  matches,
  focusTeam,
  title      = "FIFA World Cup 2002",
  subtitle   = "",
  accentColor       = "#22C55E",
  highlightLineColor = "#22C55E",
  bgColor    = "#f0ece4",
  skipIntro  = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pathTeam = focusTeam || matches.find(m => m.round === "Final")?.winner || "";
  const { nodes, edges } = generateBracketLayout(matches, pathTeam);

  // Focus-match key set (any match containing the focus team)
  const focusMatchKeys = new Set(
    nodes.filter(n => n.isFocus).map(n => `${n.stage}|${n.side}|${n.index}`)
  );

  // ── Camera poses ───────────────────────────────────────────────────────────
  // Establishing shot: whole bracket visible, slight breathing room.
  const fullPose: CamValues = { cx: CANVAS_W / 2, cy: CANVAS_H / 2, scale: 0.56 };

  // Focus pose: camera centered precisely on the Brazil pill at that stage.
  function focusPose(stage: StageKey, scale: number): CamValues {
    const pill = nodes.find(n => n.stage === stage && n.isFocus);
    if (!pill) return fullPose;
    return { cx: pill.x + PILL_W / 2, cy: pill.y + PILL_H / 2, scale };
  }

  const r16Pose  = focusPose("R16",   1.00);
  const qfPose   = focusPose("QF",    1.05);
  const sfPose   = focusPose("SF",    1.10);
  const finPose  = focusPose("Final", 1.15);
  // Victory hero shot — a subtle, slower push-in on the champion pill.
  const heroPose: CamValues = finPose === fullPose ? fullPose : { ...finPose, scale: 1.32 };

  const effectiveFrame = skipIntro ? F.END : frame;

  // Camera sequence: wide establishing → slow pan/zoom through each Brazil pill → victory hero shot.
  const camValues = activeCam(effectiveFrame, [
    { f0: F.R16_CAM, f1: F.R16_CAM + 42, from: fullPose, to: r16Pose  },
    { f0: F.QF_CAM,  f1: F.QF_CAM  + 36, from: r16Pose,  to: qfPose   },
    { f0: F.SF_CAM,  f1: F.SF_CAM  + 36, from: qfPose,   to: sfPose   },
    { f0: F.FIN_CAM, f1: F.FIN_CAM + 42, from: sfPose,   to: finPose  },
    { f0: F.REV_CAM, f1: F.REV_CAM + 54, from: finPose,  to: heroPose },
  ], fullPose);
  const cam = cameraForPose(camValues);

  // ── Header opacity ─────────────────────────────────────────────────────────
  // Header fades to a soft background tone once the camera starts following Brazil;
  // it stays dim through to the hero shot so nothing competes with the pill.
  const headerOpacity = (() => {
    const revealed = interpolate(effectiveFrame, [6, 33], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    if (effectiveFrame < F.DIM_START) return revealed;
    if (effectiveFrame < F.R16_CAM)   return interpolate(effectiveFrame, [F.DIM_START, F.R16_CAM], [1, 0.35], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeInOut });
    return 0.35;
  })();

  // ── Focus label (bottom-right, horizontal sweep) ───────────────────────────
  const label = getLabelState(effectiveFrame);

  // ── Winner circle ──────────────────────────────────────────────────────────
  const finalFocusNode = nodes.find(n => n.stage === "Final" && n.isFocus);
  const winnerProgress = interpolate(effectiveFrame, [F.WIN_CIRCLE, F.WIN_CIRCLE + 45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });

  return (
    <AbsoluteFill style={{ fontFamily, overflow: "hidden" }}>
      <PaperBackground color={bgColor} />

      {/* Camera world */}
      <div style={{
        position: "absolute", left: 0, top: 0,
        width: CANVAS_W, height: CANVAS_H,
        transform: `translate(${cam.tx}px, ${cam.ty}px) scale(${cam.scale})`,
        transformOrigin: "top left",
        // No willChange: "transform" — it promotes the canvas to a GPU layer
        // that bitmap-upscales when we push past scale 1.0, making flags/text
        // look soft. Letting the browser re-rasterise each frame keeps it crisp.
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
        textRendering: "geometricPrecision" as const,
      }}>
        <svg style={{ position: "absolute", inset: 0, width: CANVAS_W, height: CANVAS_H, overflow: "visible" }}>
          {edges.map((edge, i) => {
            const { progress, opacity } = getEdgeDrawState(edge, effectiveFrame);
            return <BracketEdgePath key={i} edge={edge} progress={progress} opacity={opacity} accentColor={accentColor} />;
          })}
          {finalFocusNode && (
            <WinnerEllipse node={finalFocusNode} progress={winnerProgress} color={highlightLineColor} />
          )}
        </svg>

        {nodes.map((node) => {
          const isFM = focusMatchKeys.has(`${node.stage}|${node.side}|${node.index}`);
          return (
            <TeamPill
              key={node.key}
              node={node}
              opacity={getPillOpacity(node, effectiveFrame, isFM)}
              scoreValue={getDisplayScore(node, effectiveFrame, isFM)}
              scoreOpacity={getScoreOpacity(node, effectiveFrame, isFM)}
              accentColor={accentColor}
              glowIntensity={node.isFocus ? getArrivalGlowIntensity(node, effectiveFrame) : 0}
            />
          );
        })}
      </div>

      {/* Header */}
      <div style={{ position: "absolute", top: 48, left: 64, zIndex: 10, opacity: headerOpacity }}>
        <div style={{ fontFamily: serifFontFamily, fontSize: 52, fontWeight: 900, color: COLORS.primary, letterSpacing: -1.5, lineHeight: 1 }}>
          {title.split("\\n").map((line, i) => <span key={i}>{line}{i < title.split("\\n").length - 1 && <br />}</span>)}
        </div>
        {subtitle ? (
          <div style={{ fontFamily, fontSize: 14, fontWeight: 500, color: "rgba(17,17,17,0.45)", marginTop: 10, letterSpacing: 0.2 }}>
            {subtitle}
          </div>
        ) : null}
      </div>

      {/* Focus label — top-right, clear of the pill graphics that occupy centre-screen */}
      <div style={{
        position: "absolute", top: 52, right: 64, zIndex: 30,
        display: "flex", alignItems: "center", gap: 12,
        textAlign: "right",
        opacity: label.opacity,
        transform: `translateX(${-label.x}px)`,
      }}>
        <div>
          <div style={{ fontFamily, fontSize: 10, fontWeight: 700, letterSpacing: 2.5, textTransform: "uppercase", color: "rgba(17,17,17,0.4)", marginBottom: 3 }}>
            Knockout Stage
          </div>
          <div style={{ fontFamily: serifFontFamily, fontSize: 26, fontWeight: 900, color: COLORS.primary, letterSpacing: -0.4, lineHeight: 1 }}>
            {label.text}
          </div>
        </div>
        <div style={{ width: 3, height: 30, borderRadius: 2, background: accentColor, flexShrink: 0 }} />
      </div>

      <Grain />
    </AbsoluteFill>
  );
};
