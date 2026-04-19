/**
 * IntrcptHeadlineStack — Editorial headline reveal. Bold text lines snap in
 * staggered from the left with a slightly underdamped spring.
 *
 * Designed for punchy, narrative moments — "THE BITE. THE BAN. THE BRILLIANCE."
 * No data, pure typography. Mix sizes to build visual hierarchy.
 */
import React from "react";
import {
  AbsoluteFill,
  CalculateMetadataFunction,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";
import { fontFamily, serifFontFamily, Grain, PaperBackground, DarkBackground } from "./shared";

// ─── Schema ───────────────────────────────────────────────────────────────────

const LineSchema = z.object({
  text:   z.string(),
  /**
   * "hero"  — 96px bold serif, full weight. Use for the main punchlines.
   * "sub"   — 56px, medium weight. Use for supporting context.
   * "label" — 16px small-caps. Use for category/chapter markers.
   */
  size:   z.enum(["hero", "sub", "label"]).optional().default("hero"),
  /** Renders this line in accentColor */
  accent: z.boolean().optional().default(false),
});

export const IntrcptHeadlineStackPropsSchema = z.object({
  lines: z.array(LineSchema).default([
    { text: "THE BITE.",       size: "hero", accent: false },
    { text: "THE BAN.",        size: "hero", accent: false },
    { text: "THE BRILLIANCE.", size: "hero", accent: true  },
  ]),
  /** Small uppercase label above the rule (e.g. "Luis Suárez · 2013/14") */
  eyebrow:      z.string().optional().default(""),
  accentColor:  z.string().optional().default("#D00027"),
  bgColor:      z.string().optional().default("#f0ece4"),
  /** Frames between each line's reveal */
  stagger:      z.number().int().min(4).default(14),
  /** Frames held after last line appears */
  holdDuration: z.number().int().min(20).default(90),
  darkMode:     z.boolean().optional().default(false),
  skipIntro:    z.boolean().optional().default(false),
});

export type IntrcptHeadlineStackProps = z.infer<typeof IntrcptHeadlineStackPropsSchema>;

// ─── Timing ───────────────────────────────────────────────────────────────────

/** Frames before the first line fires — eyebrow + rule draw-in window */
const INTRO_F = 20;

export const calculateMetadata: CalculateMetadataFunction<IntrcptHeadlineStackProps> = async ({ props }) => ({
  durationInFrames: INTRO_F + (props.lines.length - 1) * props.stagger + props.holdDuration,
});

// ─── Type styles ──────────────────────────────────────────────────────────────

const SIZE_STYLES = {
  hero: {
    fontFamily:    serifFontFamily,
    fontSize:      96,
    fontWeight:    900,
    fontStyle:     "italic" as const,
    letterSpacing: -3,
    lineHeight:    0.92,
  },
  sub: {
    fontFamily,
    fontSize:      54,
    fontWeight:    700,
    fontStyle:     "normal" as const,
    letterSpacing: -1,
    lineHeight:    1.1,
  },
  label: {
    fontFamily,
    fontSize:      15,
    fontWeight:    700,
    fontStyle:     "normal" as const,
    letterSpacing: 4,
    lineHeight:    1.5,
    textTransform: "uppercase" as const,
  },
};

// ─── Spring configs ───────────────────────────────────────────────────────────

/** Slightly underdamped — the line overshoots slightly then settles. Feels snappy. */
const LINE_CFG    = { damping: 16, stiffness: 220, mass: 0.80 };
const EYEBROW_CFG = { damping: 24, stiffness: 60 };
const RULE_CFG    = { damping: 28, stiffness: 55 };

// ─── Component ────────────────────────────────────────────────────────────────

export const IntrcptHeadlineStack: React.FC<IntrcptHeadlineStackProps> = ({
  lines, eyebrow, accentColor, bgColor, stagger, holdDuration, darkMode, skipIntro,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const accent      = accentColor ?? "#D00027";
  const bg          = bgColor     ?? "#f0ece4";
  const textPrimary = darkMode ? "#f0ece4" : "#1a1a1a";
  const textMuted   = darkMode ? "rgba(240,236,228,0.45)" : "rgba(0,0,0,0.35)";
  const ruleOpacity = darkMode ? 0.72 : 0.88;

  const eyebrowSp = skipIntro ? 1 : spring({ frame, fps, config: EYEBROW_CFG });
  const ruleSp    = skipIntro ? 1 : spring({ frame, fps, config: RULE_CFG, delay: 8 });

  return (
    <AbsoluteFill>
      {darkMode ? <DarkBackground color={bg === "#f0ece4" ? "#111111" : bg} /> : <PaperBackground color={bg} />}

      <div style={{
        position:       "absolute",
        inset:          0,
        display:        "flex",
        flexDirection:  "column",
        justifyContent: "center",
        padding:        "0 130px",
      }}>

        {/* Eyebrow */}
        {eyebrow ? (
          <div style={{
            fontFamily,
            fontSize:      13,
            fontWeight:    700,
            letterSpacing: 4,
            textTransform: "uppercase",
            color:         textMuted,
            marginBottom:  18,
            opacity:       eyebrowSp,
            transform:     `translateY(${interpolate(eyebrowSp, [0, 1], [8, 0])}px)`,
          }}>
            {eyebrow}
          </div>
        ) : null}

        {/* Rule — draws left to right before first line fires */}
        <div style={{
          height:          3,
          background:      textPrimary,
          opacity:         ruleOpacity,
          transformOrigin: "left center",
          transform:       `scaleX(${ruleSp})`,
          marginBottom:    32,
        }} />

        {/* Lines */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {lines.map((line, i) => {
            const sp = skipIntro ? 1 : spring({
              frame:  frame - (INTRO_F + i * stagger),
              fps,
              config: LINE_CFG,
            });

            const sizeStyle = SIZE_STYLES[line.size ?? "hero"];
            const color     = (line.accent ?? false) ? accent : textPrimary;

            return (
              <div
                key={i}
                style={{
                  ...sizeStyle,
                  color,
                  opacity:   interpolate(sp, [0, 0.25], [0, 1], { extrapolateRight: "clamp" }),
                  transform: `translateX(${interpolate(sp, [0, 1], [-48, 0])}px)`,
                  willChange: "transform, opacity",
                }}
              >
                {line.text}
              </div>
            );
          })}
        </div>

      </div>

      <div style={{ position: "absolute", inset: 0, zIndex: 10, pointerEvents: "none" }}>
        <Grain />
      </div>
    </AbsoluteFill>
  );
};
