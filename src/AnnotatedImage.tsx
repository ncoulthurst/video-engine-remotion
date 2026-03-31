/**
 * AnnotatedImage — Full-bleed photo with animated draw-on arrow annotations.
 * Style: image fills the entire frame, paper-textured overlay strip at bottom
 * matching the ecosystem exactly. Annotation dots appear, lines draw, labels type.
 */
import React from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { fontFamily, serifFontFamily, Grain, COLORS, SPRINGS } from "./shared";

// ══════════════════════════════════════════════════════════════════════════════
// SCHEMA
// ══════════════════════════════════════════════════════════════════════════════

const AnnotationSchema = z.object({
  x:         z.number().min(0).max(100),
  y:         z.number().min(0).max(100),
  label:     z.string(),
  direction: z.enum(["up", "down", "left", "right"]).default("up"),
  color:     z.string().optional(),
});

export const AnnotatedImagePropsSchema = z.object({
  imageSrc:     z.string().default(""),
  title:        z.string().optional(),
  subtitle:     z.string().optional(),
  annotations:  z.array(AnnotationSchema).default([]),
  accentColor:  z.string().default("#C8102E"),
  bgColor:      z.string().default("#f0ece4"),
  kenBurns:     z.boolean().default(true),
});

export type AnnotatedImageProps = z.infer<typeof AnnotatedImagePropsSchema>;

// ══════════════════════════════════════════════════════════════════════════════
// TIMING
// ══════════════════════════════════════════════════════════════════════════════

const IMAGE_FADE_DUR = 28;
const ANN_START      = 32;
const ANN_STAGGER    = 24;
const LINE_DUR       = 18;
const LABEL_FPC      = 2;

// ══════════════════════════════════════════════════════════════════════════════
// ANNOTATION OVERLAY
// ══════════════════════════════════════════════════════════════════════════════

const AnnotationOverlay: React.FC<{
  ann:         z.infer<typeof AnnotationSchema>;
  startFrame:  number;
  frame:       number;
  fps:         number;
  accentColor: string;
}> = ({ ann, startFrame, frame, fps, accentColor }) => {
  const color = ann.color ?? accentColor;

  const dotProg  = Math.max(0, Math.min(1, spring({ frame: frame - startFrame, fps, config: SPRINGS.bounce })));
  const lineProg = Math.max(0, Math.min(1, interpolate(frame, [startFrame + 8, startFrame + 8 + LINE_DUR], [0, 1], { extrapolateRight: "clamp" })));
  const labelStart = startFrame + 8 + LINE_DUR;
  const labelChars  = Math.max(0, Math.floor((frame - labelStart) / LABEL_FPC));
  const visibleLabel = ann.label.slice(0, labelChars);
  const labelDone    = labelChars >= ann.label.length;

  // Convert % coordinates to 1920×1080 pixels
  const dotX = (ann.x / 100) * 1920;
  const dotY = (ann.y / 100) * 1080;
  const LINE_LEN = 90;
  let endX = dotX, endY = dotY;
  if (ann.direction === "up")    endY = dotY - LINE_LEN;
  if (ann.direction === "down")  endY = dotY + LINE_LEN;
  if (ann.direction === "left")  endX = dotX - LINE_LEN;
  if (ann.direction === "right") endX = dotX + LINE_LEN;

  const curEndX = interpolate(lineProg, [0, 1], [dotX, endX]);
  const curEndY = interpolate(lineProg, [0, 1], [dotY, endY]);

  // Label anchor position
  let lx = endX, ly = endY;
  let anchor: "start" | "end" | "middle" = "start";
  if (ann.direction === "right") { lx += 14; anchor = "start"; }
  if (ann.direction === "left")  { lx -= 14; anchor = "end"; }
  if (ann.direction === "up")    { ly -= 16; anchor = "middle"; }
  if (ann.direction === "down")  { ly += 22; anchor = "middle"; }

  return (
    <g style={{ opacity: dotProg > 0.01 ? 1 : 0 }}>
      {/* Dot */}
      <circle cx={dotX} cy={dotY} r={9 * dotProg} fill={color} />
      <circle cx={dotX} cy={dotY} r={16 * dotProg} fill="none" stroke={color} strokeWidth={1.8} opacity={0.38} />

      {/* Line */}
      <line
        x1={dotX} y1={dotY} x2={curEndX} y2={curEndY}
        stroke={color} strokeWidth={2} strokeLinecap="round"
        opacity={lineProg}
      />

      {/* Label */}
      {visibleLabel && (
        <text
          x={lx} y={ly}
          textAnchor={anchor}
          fontSize={19}
          fontWeight={800}
          fontFamily={fontFamily}
          fill="#ffffff"
          opacity={Math.max(0, Math.min(1, interpolate(frame, [labelStart, labelStart + 6], [0, 1], { extrapolateRight: "clamp" })))}
          style={{ filter: "drop-shadow(0 1px 8px rgba(0,0,0,0.8))" }}
        >
          {visibleLabel}{!labelDone ? "▌" : ""}
        </text>
      )}
    </g>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

export const AnnotatedImage: React.FC<AnnotatedImageProps> = ({
  imageSrc,
  title,
  subtitle,
  annotations,
  accentColor,
  bgColor,
  kenBurns,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const imgOpacity = interpolate(frame, [0, IMAGE_FADE_DUR], [0, 1], { extrapolateRight: "clamp" });
  const kbScale    = kenBurns ? interpolate(frame, [0, 300], [1.0, 1.07], { extrapolateRight: "clamp" }) : 1;

  const hasCaption = !!(title || subtitle);
  const CAPTION_H  = 110;

  // Caption strip springs in
  const captionProg = spring({ frame: frame - 12, fps, config: SPRINGS.header });

  return (
    <AbsoluteFill>
      {/* Full-bleed image */}
      <AbsoluteFill style={{ background: "#111" }}>
        {imageSrc && (
          <Img
            src={staticFile(imageSrc)}
            style={{
              width:           "100%",
              height:          "100%",
              objectFit:       "cover",
              objectPosition:  "center",
              opacity:         imgOpacity,
              transform:       `scale(${kbScale})`,
              transformOrigin: "center center",
            }}
          />
        )}
        {/* Gradient overlay: darkens bottom for caption readability */}
        <div style={{
          position:   "absolute",
          inset:      0,
          background: hasCaption
            ? `linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.22) 45%, transparent 75%)`
            : `linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 60%)`,
        }} />
      </AbsoluteFill>

      <Grain />

      {/* Annotation SVG — full 1920×1080 */}
      <svg
        style={{ position: "absolute", left: 0, top: 0, zIndex: 10, overflow: "visible" }}
        width={1920}
        height={hasCaption ? 1080 - CAPTION_H : 1080}
        viewBox={`0 0 1920 ${hasCaption ? 1080 - CAPTION_H : 1080}`}
        preserveAspectRatio="none"
      >
        {annotations.map((ann, i) => (
          <AnnotationOverlay
            key={i}
            ann={ann}
            startFrame={ANN_START + i * ANN_STAGGER}
            frame={frame}
            fps={fps}
            accentColor={accentColor}
          />
        ))}
      </svg>

      {/* Caption strip — paper texture matching the ecosystem */}
      {hasCaption && (
        <div style={{
          position:   "absolute",
          bottom:     0,
          left:       0,
          right:      0,
          height:     CAPTION_H,
          background: bgColor,
          zIndex:     20,
          display:    "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding:    "0 130px",
          borderTop:  `1px solid rgba(0,0,0,0.06)`,
          opacity:    Math.max(0, Math.min(1, captionProg)),
          transform:  `translateY(${interpolate(Math.max(0, Math.min(1, captionProg)), [0, 1], [12, 0])}px)`,
        }}>
          {/* Paper texture overlay (matches Grain in other components) */}
          <svg
            style={{ position: "absolute", inset: 0, opacity: 0.08, pointerEvents: "none" }}
            width="100%" height="100%"
          >
            <defs>
              <filter id="caption-grain">
                <feTurbulence type="fractalNoise" baseFrequency="0.42" numOctaves="6" seed={5} stitchTiles="stitch" />
                <feColorMatrix type="matrix" values="0.38 0.5 0.12 0 0  0.28 0.58 0.14 0 0  0.22 0.5 0.28 0 0  0 0 0 0 1" />
              </filter>
            </defs>
            <rect width="100%" height="100%" filter="url(#caption-grain)" />
          </svg>
          {title && (
            <div style={{
              fontFamily:    serifFontFamily,
              fontSize:      36,
              fontWeight:    900,
              color:         COLORS.primary,
              letterSpacing: -0.8,
              lineHeight:    1,
            }}>
              {title}
            </div>
          )}
          {subtitle && (
            <div style={{
              fontFamily,
              fontSize:  16,
              fontWeight: 500,
              color:      COLORS.muted,
              marginTop:  5,
            }}>
              {subtitle}
            </div>
          )}
        </div>
      )}
    </AbsoluteFill>
  );
};
