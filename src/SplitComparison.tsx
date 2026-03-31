/**
 * SplitComparison — Two-column side-by-side animated comparison.
 * Style: paper background matching the ecosystem, divider drops from top,
 * left/right panels slide in. Neutral, clean — same feel as other templates.
 */
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { fontFamily, serifFontFamily, Grain, PaperBackground, COLORS, SPRINGS, SmartImg } from "./shared";

// ══════════════════════════════════════════════════════════════════════════════
// SCHEMA
// ══════════════════════════════════════════════════════════════════════════════

export const SplitComparisonPropsSchema = z.object({
  label:        z.string().default("THEN vs NOW"),
  leftLabel:    z.string().default("THEN"),
  rightLabel:   z.string().default("NOW"),
  leftValue:    z.string().optional(),
  rightValue:   z.string().optional(),
  leftSubtext:  z.string().optional(),
  rightSubtext: z.string().optional(),
  leftImage:    z.string().optional(),
  rightImage:   z.string().optional(),
  leftColor:    z.string().default("#C8102E"),
  rightColor:   z.string().default("#034694"),
  bgColor:      z.string().default("#f0ece4"),
  stats:        z.array(z.object({
    label:   z.string(),
    leftVal: z.string(),
    rightVal: z.string(),
  })).default([]),
});

export type SplitComparisonProps = z.infer<typeof SplitComparisonPropsSchema>;

// ══════════════════════════════════════════════════════════════════════════════
// TIMING
// ══════════════════════════════════════════════════════════════════════════════

const DIVIDER_DUR   = 22;
const PANEL_START   = 14;
const CONTENT_START = 28;
const STAT_STAGGER  = 12;

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

export const SplitComparison: React.FC<SplitComparisonProps> = ({
  label,
  leftLabel,
  rightLabel,
  leftValue,
  rightValue,
  leftSubtext,
  rightSubtext,
  leftImage,
  rightImage,
  leftColor,
  rightColor,
  bgColor,
  stats,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Divider drops from top
  const dividerH = interpolate(frame, [0, DIVIDER_DUR], [0, 1080], { extrapolateRight: "clamp" });

  // Panels slide in
  const leftProg  = spring({ frame: frame - PANEL_START, fps, config: SPRINGS.feature });
  const rightProg = spring({ frame: frame - PANEL_START, fps, config: SPRINGS.feature });
  const leftX     = interpolate(leftProg,  [0, 1], [-60, 0], { extrapolateRight: "clamp" });
  const rightX    = interpolate(rightProg, [0, 1], [60,  0], { extrapolateRight: "clamp" });

  // Content fades in
  const contentProg = spring({ frame: frame - CONTENT_START, fps, config: SPRINGS.header });

  // Centre label
  const labelProg = spring({ frame: frame - 8, fps, config: SPRINGS.row });

  const renderPanel = (side: "left" | "right") => {
    const isLeft   = side === "left";
    const label2   = isLeft ? leftLabel    : rightLabel;
    const value    = isLeft ? leftValue    : rightValue;
    const subtext  = isLeft ? leftSubtext  : rightSubtext;
    const image    = isLeft ? leftImage    : rightImage;
    const color    = isLeft ? leftColor    : rightColor;
    const tx       = isLeft ? leftX        : rightX;
    const cp       = isLeft ? contentProg  : contentProg;

    return (
      <div style={{
        position:   "absolute",
        top: 0, bottom: 0,
        [isLeft ? "left" : "right"]: 0,
        width:      "50%",
        overflow:   "hidden",
        transform:  `translateX(${tx}px)`,
      }}>
        {/* Paper background matches the ecosystem exactly */}
        <PaperBackground color={bgColor} />

        {/* Optional image — subtle, behind content */}
        {image && (
          <SmartImg
            src={image}
            style={{
              position:   "absolute",
              inset:      0,
              width:      "100%",
              height:     "100%",
              objectFit:  "cover",
              opacity:    0.18,
              filter:     "grayscale(40%)",
            }}
          />
        )}

        {/* Thin colour top border */}
        <div style={{
          position:   "absolute",
          top:        0, left: 0, right: 0,
          height:     5,
          background: color,
          opacity:    0.9,
        }} />

        {/* Content */}
        <div style={{
          position:       "absolute",
          inset:          0,
          display:        "flex",
          flexDirection:  "column",
          justifyContent: "center",
          alignItems:     "center",
          padding:        isLeft
            ? "60px 80px 60px 130px"
            : "60px 130px 60px 80px",
          opacity: Math.max(0, Math.min(1, cp)),
        }}>
          {/* Label overline */}
          <div style={{
            fontFamily,
            fontSize:      13,
            fontWeight:    800,
            letterSpacing: 4,
            color,
            textTransform: "uppercase",
            marginBottom:  18,
          }}>
            {label2}
          </div>

          {/* Main value */}
          {value && (
            <div style={{
              fontFamily:    serifFontFamily,
              fontSize:      value.length > 10 ? 68 : value.length > 6 ? 90 : 116,
              fontWeight:    900,
              color:         COLORS.primary,
              letterSpacing: -2.5,
              lineHeight:    0.92,
              textAlign:     "center",
            }}>
              {value}
            </div>
          )}

          {/* Accent rule */}
          <div style={{
            width:        44,
            height:       3,
            background:   color,
            borderRadius: 2,
            margin:       "22px 0",
            opacity:      0.7,
          }} />

          {/* Subtext */}
          {subtext && (
            <div style={{
              fontFamily,
              fontSize:   20,
              fontWeight: 400,
              color:      COLORS.secondary,
              textAlign:  "center",
              lineHeight: 1.5,
              maxWidth:   360,
            }}>
              {subtext}
            </div>
          )}

          {/* Stats rows */}
          {stats.length > 0 && (
            <div style={{ width: "100%", marginTop: 28 }}>
              {stats.map((stat, i) => {
                const sp = spring({ frame: frame - (CONTENT_START + 12 + i * STAT_STAGGER), fps, config: SPRINGS.row });
                return (
                  <div key={i} style={{
                    display:        "flex",
                    justifyContent: "space-between",
                    alignItems:     "center",
                    padding:        "11px 0",
                    borderBottom:   `1px solid ${COLORS.divider}`,
                    opacity:        Math.max(0, Math.min(1, sp)),
                    transform:      `translateY(${interpolate(Math.max(0, Math.min(1, sp)), [0, 1], [8, 0])}px)`,
                  }}>
                    <span style={{ fontFamily, fontSize: 13, fontWeight: 700, color: COLORS.muted, letterSpacing: 1.5, textTransform: "uppercase" }}>
                      {stat.label}
                    </span>
                    <span style={{ fontFamily: serifFontFamily, fontSize: 26, fontWeight: 900, color, letterSpacing: -0.5 }}>
                      {isLeft ? stat.leftVal : stat.rightVal}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <AbsoluteFill>
      <PaperBackground color={bgColor} />
      <Grain />

      {renderPanel("left")}
      {renderPanel("right")}

      {/* Vertical divider — drops from top */}
      <div style={{
        position:   "absolute",
        left:       "50%",
        top:        0,
        width:      1,
        height:     dividerH,
        background: COLORS.divider,
        transform:  "translateX(-50%)",
        zIndex:     20,
      }} />

      {/* Centre label pill */}
      <div style={{
        position:     "absolute",
        left:         "50%",
        top:          "50%",
        transform:    "translate(-50%, -50%)",
        background:   bgColor,
        border:       `1px solid ${COLORS.cardBorder}`,
        borderRadius: 6,
        padding:      "10px 22px",
        zIndex:       25,
        opacity:      Math.max(0, Math.min(1, labelProg)),
        boxShadow:    "0 2px 12px rgba(0,0,0,0.06)",
      }}>
        <div style={{
          fontFamily,
          fontSize:      12,
          fontWeight:    800,
          letterSpacing: 3,
          color:         COLORS.muted,
          textTransform: "uppercase",
          whiteSpace:    "nowrap",
        }}>
          {label}
        </div>
      </div>
    </AbsoluteFill>
  );
};
