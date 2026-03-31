/**
 * TitleCard — Bold full-screen section title card.
 * Style: high-contrast colour block, all-caps chapter/section title, energetic entrance.
 * Use for: ACT breaks, chapter titles, section dividers. Replaces flat letterbox transition.
 */
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { fontFamily, serifFontFamily, Grain, COLORS, SPRINGS } from "./shared";

// ══════════════════════════════════════════════════════════════════════════════
// SCHEMA
// ══════════════════════════════════════════════════════════════════════════════

export const TitleCardPropsSchema = z.object({
  chapter:     z.string().optional(),
  title:       z.string().default("THE RISE"),
  subtitle:    z.string().optional(),
  accentColor: z.string().default("#C8102E"),
  style:       z.enum(["bold", "dark", "split", "minimal"]).default("bold"),
  bgColor:     z.string().optional(),
});

export type TitleCardProps = z.infer<typeof TitleCardPropsSchema>;

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

export const TitleCard: React.FC<TitleCardProps> = ({
  chapter,
  title,
  subtitle,
  accentColor,
  style,
  bgColor,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Determine colours based on style
  const isDark = style === "dark" || style === "split";
  const bg     = bgColor ?? (isDark ? "#111111" : accentColor);
  const txtPrimary   = style === "bold" ? "#ffffff" : (isDark ? "#f5f0e8" : COLORS.primary);
  const txtSecondary = style === "bold" ? "rgba(255,255,255,0.7)" : (isDark ? "rgba(255,255,255,0.55)" : COLORS.muted);

  // Panel slam-in from left (bold style)
  const panelProg = interpolate(frame, [0, 22], [0, 1], { extrapolateRight: "clamp" });

  // Chapter overline spring in
  const chapterProg = spring({ frame: frame - 8, fps, config: SPRINGS.row });

  // Title clip reveal — slides up from below its own height
  const titleProg = spring({ frame: frame - 15, fps, config: { damping: 20, stiffness: 80 } });
  const titleY    = interpolate(titleProg, [0, 1], [80, 0], { extrapolateRight: "clamp" });

  // Subtitle fades in
  const subtitleProg = spring({ frame: frame - 30, fps, config: SPRINGS.feature });

  // Horizontal rule grows
  const ruleProg = interpolate(frame, [12, 32], [0, 1], { extrapolateRight: "clamp" });

  // For split style — dark right panel
  const splitPanelProg = interpolate(frame, [5, 30], [0, 1], { extrapolateRight: "clamp" });

  // Font size based on title length
  const titleSize = title.length > 20 ? 88 : title.length > 12 ? 108 : 130;

  if (style === "split") {
    return (
      <AbsoluteFill>
        <AbsoluteFill style={{ background: "#111111" }} />
        {/* Left colour panel */}
        <div style={{
          position:   "absolute",
          top:        0, left: 0, bottom: 0,
          width:      `${splitPanelProg * 48}%`,
          background: accentColor,
        }} />
        <Grain />
        <div style={{
          position:       "absolute",
          inset:          0,
          display:        "flex",
          alignItems:     "center",
          padding:        "0 130px",
          zIndex:         10,
          gap:            60,
        }}>
          {/* Left: chapter */}
          {chapter && (
            <div style={{
              width:         "38%",
              flexShrink:    0,
              opacity:       chapterProg,
            }}>
              <div style={{
                fontFamily,
                fontSize:      15,
                fontWeight:    800,
                letterSpacing: 4,
                color:         "rgba(255,255,255,0.85)",
                textTransform: "uppercase",
              }}>
                {chapter}
              </div>
            </div>
          )}
          {/* Right: title */}
          <div style={{ overflow: "hidden" }}>
            <div style={{
              fontFamily:    serifFontFamily,
              fontSize:      titleSize,
              fontWeight:    900,
              color:         "#f5f0e8",
              letterSpacing: -3,
              lineHeight:    0.95,
              transform:     `translateY(${titleY}px)`,
            }}>
              {title}
            </div>
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill>
      {/* Background */}
      <AbsoluteFill style={{ background: bg }} />

      {/* Bold style: moving diagonal line detail */}
      {style === "bold" && (
        <svg
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 1 }}
          viewBox="0 0 1600 900"
          preserveAspectRatio="none"
        >
          <line
            x1={interpolate(panelProg, [0, 1], [-200, 1700])}
            y1="0"
            x2={interpolate(panelProg, [0, 1], [-100, 1900])}
            y2="900"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="120"
          />
        </svg>
      )}

      <Grain />

      {/* Content */}
      <div style={{
        position:       "absolute",
        inset:          0,
        display:        "flex",
        flexDirection:  "column",
        justifyContent: "center",
        padding:        "0 130px",
        zIndex:         10,
      }}>
        {/* Chapter label */}
        {chapter && (
          <div style={{
            fontFamily,
            fontSize:      14,
            fontWeight:    800,
            letterSpacing: 4,
            color:         txtSecondary,
            textTransform: "uppercase",
            marginBottom:  20,
            opacity:       chapterProg,
            transform:     `translateX(${interpolate(chapterProg, [0, 1], [-20, 0])}px)`,
          }}>
            {chapter}
          </div>
        )}

        {/* Accent rule */}
        <div style={{
          width:        `${ruleProg * 80}px`,
          height:       4,
          background:   style === "bold" ? "rgba(255,255,255,0.5)" : accentColor,
          borderRadius: 2,
          marginBottom: 28,
        }} />

        {/* Title with clip reveal */}
        <div style={{ overflow: "hidden", marginBottom: subtitle ? 24 : 0 }}>
          <div style={{
            fontFamily:    style === "minimal" ? fontFamily : serifFontFamily,
            fontSize:      titleSize,
            fontWeight:    900,
            color:         txtPrimary,
            letterSpacing: style === "minimal" ? 6 : -3,
            lineHeight:    0.95,
            textTransform: style === "minimal" ? "uppercase" : "none",
            transform:     `translateY(${titleY}px)`,
          }}>
            {title}
          </div>
        </div>

        {/* Subtitle */}
        {subtitle && (
          <div style={{
            fontFamily,
            fontSize:    28,
            fontWeight:  400,
            color:       txtSecondary,
            opacity:     interpolate(subtitleProg, [0, 1], [0, 1]) * (subtitleProg > 0 ? 1 : 0),
            transform:   `translateY(${interpolate(subtitleProg, [0, 1], [10, 0])}px)`,
            marginTop:   8,
            lineHeight:  1.5,
          }}>
            {subtitle}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
