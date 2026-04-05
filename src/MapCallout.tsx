/**
 * MapCallout — Animated England map with pin drops and typed callout labels.
 * Style: paper background, SVG England silhouette on right half of frame,
 * title on left. Pins drop → callout line draws → label types in.
 */
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { fontFamily, serifFontFamily, Grain, PaperBackground, DarkBackground, COLORS, SPRINGS } from "./shared";

// ══════════════════════════════════════════════════════════════════════════════
// ENGLAND SVG
// The path is defined in its own 320×440 coordinate space.
// We render it inside an explicit <svg width height> positioned on screen.
// No viewBox distortion — direct pixel mapping.
// ══════════════════════════════════════════════════════════════════════════════

// England outline — 320×440 natural bounds, clockwise from Solway Firth
const ENGLAND_PATH = `
  M 112,12
  C 138,4 188,6 222,30
  L 252,88
  L 264,140
  C 266,158 278,178 264,202
  L 284,256
  C 287,272 286,302 276,320
  L 256,344
  C 234,374 200,388 168,396
  L 128,400
  C 96,402 58,390 36,378
  C 14,366 8,344 16,328
  L 38,304
  C 44,292 52,280 54,264
  L 52,238
  C 52,216 54,196 62,164
  L 70,122
  C 74,92 96,48 112,12
  Z
`;

// The SVG canvas is 320×440. We position it on the right side of the 1920×1080 frame.
const SVG_W = 320;
const SVG_H = 440;

// On-screen position of the SVG top-left corner
const MAP_LEFT = 860;
const MAP_TOP  = 80;

// ══════════════════════════════════════════════════════════════════════════════
// CITY DATABASE — in the 320×440 SVG coordinate space
// ══════════════════════════════════════════════════════════════════════════════

const CITY_COORDS: Record<string, [number, number]> = {
  // North
  newcastle:      [200,  55],
  sunderland:     [208,  65],
  middlesbrough:  [214,  78],
  // Yorkshire
  leeds:          [188, 108],
  sheffield:      [192, 124],
  hull:           [220, 110],
  york:           [198,  95],
  // North West
  manchester:     [148, 120],
  liverpool:      [120, 125],
  blackburn:      [146, 108],
  burnley:        [152, 103],
  bolton:         [140, 118],
  // Midlands
  nottingham:     [196, 146],
  leicester:      [192, 158],
  birmingham:     [170, 175],
  coventry:       [184, 170],
  wolves:         [160, 175],
  derby:          [188, 145],
  stoke:          [162, 148],
  // East
  cambridge:      [224, 195],
  norwich:        [254, 185],
  ipswich:        [250, 205],
  // London & SE
  london:         [236, 262],
  "west ham":     [242, 258],
  tottenham:      [236, 254],
  arsenal:        [232, 254],
  chelsea:        [228, 264],
  "crystal palace":[240, 266],
  fulham:         [226, 262],
  brentford:      [224, 260],
  watford:        [220, 248],
  luton:          [214, 238],
  // South
  brighton:       [226, 340],
  southampton:    [188, 340],
  portsmouth:     [198, 348],
  bournemouth:    [172, 348],
  // West / SW
  bristol:        [118, 278],
  bath:           [128, 284],
  exeter:         [ 98, 342],
  plymouth:       [ 80, 360],
  swindon:        [152, 278],
  reading:        [204, 272],
  oxford:         [192, 260],
  // Wales border
  cardiff:        [ 88, 296],
  swansea:        [ 68, 304],
};

// ══════════════════════════════════════════════════════════════════════════════
// SCHEMA
// ══════════════════════════════════════════════════════════════════════════════

const PinSchema = z.object({
  city:        z.string().optional().default(""),
  label:       z.string().optional().default(""),
  highlighted: z.boolean().default(false),
});

export const MapCalloutPropsSchema = z.object({
  title:            z.string().optional().default("Where it all began"),
  titleSize:        z.number().default(64),
  pins:             z.array(PinSchema).default([
    { city: "bournemouth", label: "Bournemouth", highlighted: true },
    { city: "london",      highlighted: false },
    { city: "manchester",  highlighted: false },
    { city: "liverpool",   highlighted: false },
  ]),
  calloutCity:      z.string().optional().default(""),
  calloutText:      z.string().optional().default(""),
  calloutDirection: z.enum(["left", "right", "up", "down"]).default("left"),
  accentColor:      z.string().optional().default("#C8102E"),
  bgColor:          z.string().optional().default("#f0ece4"),
  darkMode:         z.boolean().default(false),
});

export type MapCalloutProps = z.infer<typeof MapCalloutPropsSchema>;

// ══════════════════════════════════════════════════════════════════════════════
// TIMING
// ══════════════════════════════════════════════════════════════════════════════

const MAP_FADE_START   = 0;
const MAP_FADE_DUR     = 22;
const PINS_START       = 26;
const PIN_STAGGER      = 10;
const CALLOUT_START    = 58;
const CALLOUT_LINE_DUR = 22;
const LABEL_START      = 80;
const LABEL_FPC        = 2;

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

export const MapCallout: React.FC<MapCalloutProps> = ({
  title,
  titleSize,
  pins,
  calloutCity,
  calloutText,
  calloutDirection,
  accentColor,
  bgColor,
  darkMode,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const textColor  = darkMode ? "#f5f0e8" : COLORS.primary;
  const mapFill    = darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.055)";
  const mapStroke  = darkMode ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.22)";

  // Map fades in
  const mapAlpha = interpolate(frame, [MAP_FADE_START, MAP_FADE_START + MAP_FADE_DUR], [0, 1], { extrapolateRight: "clamp" });
  const mapScale = interpolate(frame, [MAP_FADE_START, MAP_FADE_START + MAP_FADE_DUR], [0.97, 1], { extrapolateRight: "clamp" });

  // Title springs in
  const titleProg = spring({ frame: frame - 5, fps, config: SPRINGS.header });

  // Callout city screen coords (within the positioned SVG)
  const calloutKey    = calloutCity?.toLowerCase().trim();
  const calloutSvgXY  = calloutKey ? CITY_COORDS[calloutKey] : null;
  // Convert from SVG space to screen space
  const toScreen = (sx: number, sy: number): [number, number] => [MAP_LEFT + sx, MAP_TOP + sy];
  const calloutScreenXY = calloutSvgXY ? toScreen(calloutSvgXY[0], calloutSvgXY[1]) : null;

  // Line progress
  const lineProg = Math.max(0, Math.min(1, interpolate(frame, [CALLOUT_START, CALLOUT_START + CALLOUT_LINE_DUR], [0, 1], { extrapolateRight: "clamp" })));

  // Label typing
  const labelChars = calloutText ? Math.max(0, Math.floor((frame - LABEL_START) / LABEL_FPC)) : 0;
  const visibleLabel = calloutText ? calloutText.slice(0, labelChars) : "";
  const labelDone = labelChars >= (calloutText?.length ?? 0);

  // Build callout line end + label position
  const LINE_LEN = 110;
  let lineEndX = 0, lineEndY = 0, labelLeft = 0, labelTop = 0;
  if (calloutScreenXY) {
    const [cx, cy] = calloutScreenXY;
    if (calloutDirection === "left")  { lineEndX = cx - LINE_LEN; lineEndY = cy - 18; }
    if (calloutDirection === "right") { lineEndX = cx + LINE_LEN; lineEndY = cy - 18; }
    if (calloutDirection === "up")    { lineEndX = cx + 10;       lineEndY = cy - LINE_LEN; }
    if (calloutDirection === "down")  { lineEndX = cx + 10;       lineEndY = cy + LINE_LEN; }
    labelLeft = lineEndX + (calloutDirection === "right" ? 12 : calloutDirection === "left" ? -12 : 0);
    labelTop  = lineEndY + (calloutDirection === "up" ? -46 : calloutDirection === "down" ? 10 : -22);
  }

  return (
    <AbsoluteFill>
      {darkMode ? <DarkBackground /> : <PaperBackground color={bgColor} />}
      <Grain />

      {/* Title — left side */}
      <div style={{
        position:   "absolute",
        left:       130,
        top:        "50%",
        transform:  `translateY(-50%) translateY(${interpolate(Math.max(0, Math.min(1, titleProg)), [0, 1], [-10, 0])}px)`,
        maxWidth:   620,
        zIndex:     10,
        opacity:    Math.max(0, Math.min(1, titleProg)),
      }}>
        <div style={{
          fontFamily,
          fontSize:      13,
          fontWeight:    700,
          letterSpacing: 3.5,
          color:         accentColor,
          textTransform: "uppercase",
          marginBottom:  18,
        }}>
          Location
        </div>
        <div style={{
          fontFamily:    serifFontFamily,
          fontSize:      titleSize,
          fontWeight:    900,
          color:         textColor,
          letterSpacing: -2,
          lineHeight:    1.05,
        }}>
          {title}
        </div>
        <div style={{
          width:        interpolate(Math.max(0, Math.min(1, titleProg)), [0, 1], [0, 48]),
          height:       3,
          background:   accentColor,
          borderRadius: 2,
          marginTop:    22,
        }} />
      </div>

      {/* Map SVG — explicit position and size, no viewBox distortion */}
      <svg
        style={{
          position:        "absolute",
          left:            MAP_LEFT,
          top:             MAP_TOP,
          opacity:         mapAlpha,
          transform:       `scale(${mapScale})`,
          transformOrigin: `${SVG_W / 2}px ${SVG_H / 2}px`,
          zIndex:          5,
          overflow:        "visible",
        }}
        width={SVG_W}
        height={SVG_H}
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      >
        {/* England silhouette */}
        <path
          d={ENGLAND_PATH}
          fill={mapFill}
          stroke={mapStroke}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Pins */}
        {pins.map((pin, i) => {
          const cityKey  = pin.city.toLowerCase().trim();
          const svgCoords = CITY_COORDS[cityKey];
          if (!svgCoords) return null;

          const pinFrame  = PINS_START + i * PIN_STAGGER;
          const pinProg   = Math.max(0, Math.min(1, spring({ frame: frame - pinFrame, fps, config: SPRINGS.bounce })));
          const isHighlighted = pin.highlighted || cityKey === calloutKey;
          const pinColor  = isHighlighted ? accentColor : (darkMode ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.3)");
          const r         = isHighlighted ? 9 : 5;
          const [sx, sy]  = svgCoords;

          return (
            <g key={pin.city} style={{ opacity: pinProg }}>
              {/* Ripple */}
              {isHighlighted && (
                <circle
                  cx={sx} cy={sy}
                  r={r + interpolate((frame - pinFrame) % 55, [0, 55], [0, r * 2.8], { extrapolateRight: "clamp" })}
                  fill="none"
                  stroke={accentColor}
                  strokeWidth={1.5}
                  opacity={interpolate((frame - pinFrame) % 55, [0, 55], [0.55, 0], { extrapolateRight: "clamp" })}
                />
              )}
              <circle cx={sx} cy={sy} r={r * pinProg} fill={pinColor} />
              {/* Non-callout pin labels */}
              {pin.label && cityKey !== calloutKey && pinProg > 0.5 && (
                <text
                  x={sx + 13}
                  y={sy + 5}
                  fontSize="13"
                  fontWeight="700"
                  fontFamily={fontFamily}
                  fill={darkMode ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.45)"}
                  opacity={interpolate(pinProg, [0.5, 1], [0, 1], { extrapolateRight: "clamp" })}
                >
                  {pin.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Callout line — drawn on top of the map in screen space */}
      {calloutScreenXY && (
        <svg
          style={{ position: "absolute", left: 0, top: 0, zIndex: 15, overflow: "visible", pointerEvents: "none" }}
          width={1920}
          height={1080}
        >
          <line
            x1={calloutScreenXY[0]}
            y1={calloutScreenXY[1]}
            x2={interpolate(lineProg, [0, 1], [calloutScreenXY[0], lineEndX])}
            y2={interpolate(lineProg, [0, 1], [calloutScreenXY[1], lineEndY])}
            stroke={accentColor}
            strokeWidth={2.2}
            strokeLinecap="round"
          />
          {/* End dot */}
          {lineProg > 0.85 && (
            <circle
              cx={lineEndX} cy={lineEndY}
              r={interpolate(lineProg, [0.85, 1], [0, 4])}
              fill={accentColor}
            />
          )}
        </svg>
      )}

      {/* Callout label — HTML for crisp text */}
      {calloutScreenXY && visibleLabel && (
        <div style={{
          position:   "absolute",
          left:       calloutDirection === "left" ? labelLeft - 200 : labelLeft,
          top:        labelTop,
          width:      220,
          textAlign:  calloutDirection === "left" ? "right" : "left",
          zIndex:     20,
          pointerEvents: "none",
        }}>
          <div style={{
            display:       "inline-block",
            background:    accentColor,
            color:         "#fff",
            fontFamily,
            fontSize:      18,
            fontWeight:    800,
            letterSpacing: 0.5,
            padding:       "7px 16px",
            borderRadius:  5,
            whiteSpace:    "nowrap",
            boxShadow:     "0 3px 16px rgba(0,0,0,0.22)",
          }}>
            {visibleLabel}
            {!labelDone && (
              <span style={{
                display:         "inline-block",
                width:           2,
                height:          "1em",
                background:      "#fff",
                marginLeft:      3,
                verticalAlign:   "middle",
                opacity:         Math.floor(frame / 8) % 2 === 0 ? 1 : 0,
              }} />
            )}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
