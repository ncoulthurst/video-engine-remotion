/**
 * TextColumnConverge — a fixed left word + a rapidly cycling right word, both
 * pinned to constant screen margins (never resizing/recentering mid-cycle),
 * that finally slide together into one centered phrase.
 *
 * Ported from an OSS "product feature ticker" demo (Raycast-style) into the
 * house dark-ground palette: the cycle table, the fixed-margin word pinning,
 * and the single ease-in-out convergence slide are preserved exactly; the
 * flat #050506 backdrop is replaced by <Ground>'s ink register so it carries
 * the same grain/atmosphere/camera-drift as every other graphic in the film.
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  Ground,
  resolveTheme,
  useOutro,
  EASE,
  TYPE,
  SPACE,
  baseTemplateSchema,
  type BaseTemplateProps,
} from "./lib/kit";

const CycleStepSchema = z.object({
  word: z.string(),
  /** frames this word holds before the cycle advances. Ignored on the last
   *  entry — it holds until convergence fires, so any value works there. */
  holdFrames: z.number(),
});

export const TextColumnConvergePropsSchema = z.object({
  ...baseTemplateSchema,
  /** the fixed left-anchored word — never moves during the cycle. */
  prefix: z.string().optional().default("NEW"),
  /** the right-anchored word cycles through this list, each held for its own
   *  duration — a deliberately uneven, machine-rhythm cadence, NOT evenly
   *  spaced. The LAST entry is the one that triggers convergence. */
  cycle: z
    .array(CycleStepSchema)
    .optional()
    .default([
      { word: "LAUNCHER", holdFrames: 16 },
      { word: "COMPACT MODE", holdFrames: 12 },
      { word: "HOTKEYS", holdFrames: 9 },
      { word: "VOICE INPUT", holdFrames: 8 },
      { word: "FILE SEARCH", holdFrames: 7 },
      { word: "RAYCAST", holdFrames: 999 },
    ]),
  /** near-instant reveal beneath the converged phrase (not a slow fade). */
  subtitle: z.string().optional().default("COMING 2026"),
  ground: z.enum(["paper", "ink", "structure"]).optional().default("ink"),
});
export type TextColumnConvergeProps = z.input<typeof TextColumnConvergePropsSchema> & BaseTemplateProps;

// ── layout geometry — a fixed gap either side of screen-centre, so the two
// words sit symmetric around 960 while cycling, then converge to meet there.
const CENTER_X = 960;
const GAP = 342;
const CANVAS_W = 1920;
const START = 8;
const CONVERGE_DUR = 36;
const CONVERGE_DELAY = 10;
const SUB_DELAY = 18;
const FS = 42; // technical mono readout size — not the kit's editorial type scale

export const TextColumnConverge: React.FC<TextColumnConvergeProps> = ({
  prefix = "NEW",
  cycle = [],
  subtitle,
  ground = "ink",
  accentColor,
  skipIntro,
  animateOut,
}) => {
  const frame = useCurrentFrame();
  const t = resolveTheme(ground, accentColor);
  const outro = useOutro(animateOut);

  const steps = cycle.length ? cycle : [{ word: "", holdFrames: 999 }];
  const tt = frame - START;

  // walk the cumulative-duration table to find the active step (exact port).
  let acc = 0;
  let idx = 0;
  let stepStart = 0;
  for (let i = 0; i < steps.length; i++) {
    if (tt >= acc) {
      idx = i;
      stepStart = acc;
    }
    acc += steps[i].holdFrames;
  }
  const cur = steps[idx];
  const isLast = idx === steps.length - 1;
  const local = tt - stepStart;

  // the ONE convergence slide — fires once, only after the last word settles.
  const cvT = isLast ? local - CONVERGE_DELAY : -1;
  const cv = interpolate(cvT, [0, CONVERGE_DUR], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.inOut,
  });

  // estimated advance-width per character (monospace assumption) → the merged
  // phrase's width, so the two words meet cleanly with no gap/overlap.
  const LSP = TYPE.track;
  const ADV = 0.6 * FS + LSP;
  const lastWord = steps[steps.length - 1].word;
  const charCount = prefix.length + 1 + lastWord.length; // "+1" = the joining space
  const lineW = charCount * ADV;
  const mergedLeft = CENTER_X - lineW / 2;
  const mergedRight = CENTER_X + lineW / 2;

  const prefixLeft = interpolate(cv, [0, 1], [CENTER_X - GAP, mergedLeft]);
  const wordRight = interpolate(cv, [0, 1], [CENTER_X + GAP, mergedRight]);
  const converged = cv >= 1;

  const subT = converged ? cvT - CONVERGE_DUR - SUB_DELAY : -1;
  const subOp = interpolate(subT, [0, 4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // centred on its OWN estimated width, not the headline's — otherwise a
  // subtitle shorter/longer than the merged phrase drifts off-centre below it.
  const subLineW = (subtitle?.length ?? 0) * ADV;
  const subLeft = CENTER_X - subLineW / 2;

  const visible = tt >= 0;

  const wordStyle: React.CSSProperties = {
    fontFamily: TYPE.mono,
    fontWeight: TYPE.weight.medium,
    fontSize: FS,
    letterSpacing: LSP,
    color: t.ink,
    whiteSpace: "nowrap",
    lineHeight: 1,
  };

  return (
    <Ground ground={ground} accentColor={accentColor} skipIntro={skipIntro} texture={false} pad={0}>
      <AbsoluteFill style={{ ...outro }}>
        {visible && (
          <>
            <div style={{ ...wordStyle, position: "absolute", left: prefixLeft, top: "50%", transform: "translateY(-50%)" }}>
              {prefix}
            </div>
            <div
              style={{ ...wordStyle, position: "absolute", right: CANVAS_W - wordRight, top: "50%", transform: "translateY(-50%)" }}
            >
              {cur.word}
            </div>
            {subtitle && (
              <div
                style={{
                  ...wordStyle,
                  fontStyle: "italic",
                  color: t.muted,
                  position: "absolute",
                  left: subLeft,
                  top: `calc(50% + ${FS / 2 + SPACE[4]}px)`,
                  opacity: subOp,
                }}
              >
                {subtitle}
              </div>
            )}
          </>
        )}
      </AbsoluteFill>
    </Ground>
  );
};
