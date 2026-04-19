/**
 * IntrcptDualPanel — Two parallel events on a shared canvas.
 *
 * The "same container" principle made explicit: two panels share one spatial world,
 * divided by a single vertical seam. Each panel has its own context chip
 * (the "/ LABEL" stamp from the reference design) anchored to its top-left.
 *
 * Primary use: "Meanwhile..." | "By contrast..." | "Same day, different worlds"
 * e.g. show Trump in a diplomatic meeting (left) and on a golf course (right).
 *
 * Tag: [INTRCPT DUAL PANEL: Left Label | Right Label | leftTitle | rightTitle]
 *
 * Animation model:
 *  - Divider draws top→bottom (spring, first)
 *  - Left panel content slides in from left, right panel from right (staggered ~8f)
 *  - Context chips appear after their panel
 *  - Both panels breathe together (subtle shared Ken Burns on images)
 */
import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";
import {
  fontFamily,
  serifFontFamily,
  Grain,
  PaperBackground,
  COLORS,
  SmartImg,
} from "./shared";

// ══════════════════════════════════════════════════════════════════════════════
// SCHEMA
// ══════════════════════════════════════════════════════════════════════════════

export const IntrcptDualPanelPropsSchema = z.object({
  // Context chips — "/ LABEL" format, top-left of each panel
  leftLabel:       z.string().optional().default(""),
  rightLabel:      z.string().optional().default(""),
  leftChipColor:   z.string().optional().default("#111111"),  // dark = formal/serious
  rightChipColor:  z.string().optional().default("#1a5c1a"),  // green = action/sport (like reference)

  // Optional images — full-bleed background for each panel
  leftImage:       z.string().optional().default(""),
  rightImage:      z.string().optional().default(""),

  // Optional headline text over each panel
  leftTitle:       z.string().optional().default(""),
  rightTitle:      z.string().optional().default(""),

  // Optional body text (small, under title)
  leftBody:        z.string().optional().default(""),
  rightBody:       z.string().optional().default(""),

  // Fallback when no image — each panel's solid bg tint
  leftBgTint:      z.string().optional().default("#1a1a1a"),
  rightBgTint:     z.string().optional().default("#111111"),

  // Shared background (visible as the gap/neutral zone)
  bgColor:         z.string().optional().default("#f0ece4"),

  // Accent color for the divider line
  dividerColor:    z.string().optional().default("rgba(17,17,17,0.18)"),
});

export type IntrcptDualPanelProps = z.infer<typeof IntrcptDualPanelPropsSchema>;

// ══════════════════════════════════════════════════════════════════════════════
// TIMING
// ══════════════════════════════════════════════════════════════════════════════

const DIVIDER_START  = 0;   // divider line draws in
const LEFT_START     = 6;   // left panel slides in
const RIGHT_START    = 14;  // right panel slides in (staggered)
const CHIP_DELAY_L   = 22;  // left chip appears
const CHIP_DELAY_R   = 30;  // right chip appears

// ══════════════════════════════════════════════════════════════════════════════
// CONTEXT CHIP — the "/" LABEL stamp
// ══════════════════════════════════════════════════════════════════════════════

interface ChipProps {
  label: string;
  chipColor: string;
  progress: number; // 0→1 reveal spring
}

const ContextChip: React.FC<ChipProps> = ({ label, chipColor, progress }) => {
  if (!label) return null;
  const opacity   = interpolate(progress, [0, 0.5], [0, 1], { extrapolateRight: "clamp" });
  const translateY = interpolate(progress, [0, 1], [-8, 0], { extrapolateRight: "clamp" });

  return (
    <div style={{
      position:        "absolute",
      top:             28,
      left:            28,
      display:         "flex",
      alignItems:      "center",
      gap:             0,
      opacity,
      transform:       `translateY(${translateY}px)`,
      zIndex:          20,
    }}>
      <div style={{
        backgroundColor: chipColor,
        borderRadius:    6,
        padding:         "7px 13px",
        display:         "flex",
        alignItems:      "center",
        gap:             6,
      }}>
        {/* The "/" separator — in accent/highlight colour */}
        <span style={{
          fontFamily,
          fontSize:    13,
          fontWeight:  700,
          color:       COLORS.gold,
          lineHeight:  1,
          letterSpacing: 0,
        }}>/</span>
        <span style={{
          fontFamily,
          fontSize:    13,
          fontWeight:  700,
          color:       "#ffffff",
          letterSpacing: 0.5,
          lineHeight:  1,
        }}>{label}</span>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// PANEL CONTENT — photo + optional title/body
// ══════════════════════════════════════════════════════════════════════════════

interface PanelContentProps {
  image:      string;
  bgTint:     string;
  title:      string;
  body:       string;
  enterProg:  number; // 0→1
  side:       "left" | "right";
}

const PanelContent: React.FC<PanelContentProps> = ({
  image, bgTint, title, body, enterProg, side,
}) => {
  const sign     = side === "left" ? -1 : 1;
  const slideX   = interpolate(enterProg, [0, 1], [sign * 40, 0], { extrapolateRight: "clamp" });
  const opacity  = interpolate(enterProg, [0, 0.6], [0, 1], { extrapolateRight: "clamp" });

  // Subtle Ken Burns — image drifts slowly inward
  const scale    = interpolate(enterProg, [0, 1], [1.04, 1.0], { extrapolateRight: "clamp" });

  const textProg = interpolate(enterProg, [0.4, 1], [0, 1], { extrapolateRight: "clamp" });

  return (
    <div style={{
      position:  "absolute",
      inset:     0,
      overflow:  "hidden",
      opacity,
      transform: `translateX(${slideX}px)`,
    }}>
      {/* Background — image or solid tint */}
      <div style={{
        position: "absolute",
        inset:    0,
        backgroundColor: bgTint,
        transform: `scale(${scale})`,
        transformOrigin: "center center",
        overflow: "hidden",
      }}>
        {image ? (
          <SmartImg
            src={image}
            style={{
              width:        "100%",
              height:       "100%",
              objectFit:    "cover",
              objectPosition: "center top",
              filter:       "brightness(0.75) contrast(1.05)",
            }}
          />
        ) : null}
      </div>

      {/* Dark gradient at bottom for text legibility */}
      {(title || body) && (
        <div style={{
          position:   "absolute",
          bottom:     0,
          left:       0,
          right:      0,
          height:     300,
          background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 100%)",
          zIndex:     2,
        }} />
      )}

      {/* Title + body text */}
      {(title || body) && (
        <div style={{
          position:  "absolute",
          bottom:    48,
          left:      32,
          right:     32,
          zIndex:    3,
          opacity:   textProg,
          transform: `translateY(${interpolate(textProg, [0, 1], [16, 0])}px)`,
        }}>
          {title && (
            <div style={{
              fontFamily:    serifFontFamily,
              fontSize:      36,
              fontWeight:    900,
              color:         "#fff",
              letterSpacing: -0.5,
              lineHeight:    1.1,
              marginBottom:  body ? 8 : 0,
            }}>{title}</div>
          )}
          {body && (
            <div style={{
              fontFamily:    fontFamily,
              fontSize:      15,
              fontWeight:    400,
              color:         "rgba(255,255,255,0.72)",
              letterSpacing: 0.2,
              lineHeight:    1.5,
            }}>{body}</div>
          )}
        </div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

export const IntrcptDualPanel: React.FC<IntrcptDualPanelProps> = ({
  leftLabel, rightLabel, leftChipColor, rightChipColor,
  leftImage, rightImage,
  leftTitle, rightTitle,
  leftBody, rightBody,
  leftBgTint, rightBgTint,
  bgColor, dividerColor,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const spCfg = { damping: 22, stiffness: 80 };

  const dividerProg  = spring({ frame, fps, config: { damping: 18, stiffness: 120 }, from: 0, to: 1, delay: DIVIDER_START });
  const leftEnter    = spring({ frame, fps, config: spCfg, from: 0, to: 1, delay: LEFT_START });
  const rightEnter   = spring({ frame, fps, config: spCfg, from: 0, to: 1, delay: RIGHT_START });
  const leftChip     = spring({ frame, fps, config: { damping: 20, stiffness: 90 }, from: 0, to: 1, delay: CHIP_DELAY_L });
  const rightChip    = spring({ frame, fps, config: { damping: 20, stiffness: 90 }, from: 0, to: 1, delay: CHIP_DELAY_R });

  // Divider draws from top to bottom — clipPath height grows
  const dividerH = interpolate(dividerProg, [0, 1], [0, 100], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      {/* Shared parchment background — shows as neutral ground between panels */}
      <PaperBackground color={bgColor} />

      {/* ── LEFT PANEL ─────────────────────────────────────────────────────── */}
      <div style={{
        position:    "absolute",
        top:         0,
        left:        0,
        width:       "50%",
        height:      "100%",
        overflow:    "hidden",
      }}>
        <PanelContent
          image={leftImage}
          bgTint={leftBgTint}
          title={leftTitle}
          body={leftBody}
          enterProg={leftEnter}
          side="left"
        />
        <ContextChip label={leftLabel} chipColor={leftChipColor} progress={leftChip} />
      </div>

      {/* ── RIGHT PANEL ────────────────────────────────────────────────────── */}
      <div style={{
        position:    "absolute",
        top:         0,
        right:       0,
        width:       "50%",
        height:      "100%",
        overflow:    "hidden",
      }}>
        <PanelContent
          image={rightImage}
          bgTint={rightBgTint}
          title={rightTitle}
          body={rightBody}
          enterProg={rightEnter}
          side="right"
        />
        <ContextChip label={rightLabel} chipColor={rightChipColor} progress={rightChip} />
      </div>

      {/* ── DIVIDER LINE — draws from top ──────────────────────────────────── */}
      <div style={{
        position:   "absolute",
        top:        0,
        left:       "50%",
        width:      2,
        height:     "100%",
        backgroundColor: dividerColor,
        clipPath:   `inset(0 0 ${100 - dividerH}% 0)`,
        transform:  "translateX(-1px)",
        zIndex:     10,
        pointerEvents: "none",
      }} />

      {/* ── GRAIN ──────────────────────────────────────────────────────────── */}
      <div style={{ position: "absolute", inset: 0, zIndex: 12, pointerEvents: "none" }}>
        <Grain />
      </div>
    </AbsoluteFill>
  );
};
