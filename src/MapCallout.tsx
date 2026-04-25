/**
 * MapCallout — Editorial cartographic callout.
 *
 * Broadcast/newsprint aesthetic: folio dateline top-left (subject in serif italic
 * + small-caps dateline), single accent rule, asymmetric left-anchored layout.
 * The map occupies the right ~58% of the frame; the folio + description sit in
 * the left 35-40%. A real simplified GeoJSON-derived path of the British Isles
 * is rendered with a subtle graticule, a target region highlighted in accent,
 * and a pin → callout-line → label callout sequence.
 *
 * Cinematic camera: slow zoom-in (scale 0.92 → 1.0 over 36 frames, ease-out
 * cubic) with origin pinned to the highlighted region. Folio + label fade in
 * as the camera settles.
 *
 * SVG path origin: hand-simplified from Natural Earth 50m admin-0 outlines,
 * projected to a 1000×1200 box (Mercator-ish, Britain-tuned). Recognisable
 * shape — England, Scotland, Wales, plus Ireland silhouette.
 *
 * Stack: Bg (0) → Map+Content (10) → Grain (2, LAST in JSX).
 */

import React from "react";
import {
  AbsoluteFill,
  Easing,
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
  DarkBackground,
  COLORS,
} from "./shared";

// ══════════════════════════════════════════════════════════════════════════════
// SCHEMA
// ══════════════════════════════════════════════════════════════════════════════

const PinSchema = z.object({
  city:        z.string().optional().default(""),
  label:       z.string().optional().default(""),
  highlighted: z.boolean().default(false),
});

export const MapCalloutPropsSchema = z.object({
  /** Editorial subject — the location being highlighted, e.g. "Manchester". */
  title:            z.string().optional().default("Manchester"),
  titleSize:        z.number().default(64),
  /** Folio dateline below the subject — small-caps, e.g. "England · North West". */
  dateline:         z.string().optional().default("England · North West"),
  /** Serif italic narrative line below the folio. */
  description:      z.string().optional().default(
    "The industrial heart of the north — a city whose football clubs have shaped the modern English game."
  ),
  /** Bottom-right attribution. */
  source:           z.string().optional().default("MAP · NATURAL EARTH"),
  /** Pins (each rendered on the map). The "highlighted" pin or `calloutCity` is the focus. */
  pins:             z.array(PinSchema).default([
    { city: "manchester",  label: "Manchester",  highlighted: true  },
    { city: "london",      label: "London",      highlighted: false },
    { city: "edinburgh",   label: "Edinburgh",   highlighted: false },
    { city: "cardiff",     label: "Cardiff",     highlighted: false },
  ]),
  /** Override which city receives the callout line + label — falls back to highlighted pin. */
  calloutCity:      z.string().optional().default("manchester"),
  calloutText:      z.string().optional().default(""),
  /** Which target region is filled in accent. */
  highlightRegion:  z.enum(["england", "scotland", "wales", "ireland", "uk"]).default("england"),
  accentColor:      z.string().optional().default("#C8102E"),
  bgColor:          z.string().optional().default("#f0ece4"),
  darkMode:         z.boolean().default(false),
  skipIntro:        z.boolean().optional().default(false),
});

export type MapCalloutProps = z.infer<typeof MapCalloutPropsSchema>;

// ══════════════════════════════════════════════════════════════════════════════
// MAP DATA — simplified outlines (Natural Earth-derived), 1000×1200 viewBox
// Hand-traced from public-domain Natural Earth 50m admin-0 boundaries and
// normalized to a tall portrait box (1000 wide × 1200 tall).
// Coordinates are SVG-space (y increases downward).
// ══════════════════════════════════════════════════════════════════════════════

const MAP_W = 1000;
const MAP_H = 1200;

// England — south-east block. From Berwick (NE) clockwise around the coast,
// includes Cornwall, Bristol Channel, up along the Welsh border, to the
// Solway Firth.
const ENGLAND_PATH = `
  M 690,470
  L 715,485 L 740,495 L 760,512 L 778,538
  L 790,572 L 798,608 L 812,650 L 822,690
  L 834,730 L 842,770 L 852,808 L 858,848
  L 854,880 L 838,902 L 818,918 L 790,928
  L 758,938 L 720,944 L 680,948 L 640,950
  L 605,948 L 575,940 L 552,924 L 535,902
  L 522,878 L 510,852 L 498,824 L 488,792
  L 478,760 L 462,736 L 442,720 L 418,712
  L 392,710 L 368,716 L 348,728 L 332,742
  L 320,734 L 312,712 L 308,684 L 312,654
  L 322,628 L 338,608 L 358,592 L 378,580
  L 392,562 L 398,540 L 396,516 L 388,494
  L 376,476 L 362,462 L 348,452 L 338,438
  L 336,420 L 344,402 L 360,388 L 380,378
  L 402,372 L 425,372 L 448,378 L 470,388
  L 490,398 L 512,406 L 535,410 L 558,408
  L 580,402 L 602,394 L 624,388 L 646,388
  L 666,394 L 680,408 L 686,428 L 688,450
  Z
`;

// Scotland — northern block, from Berwick up the east coast around the
// Highlands and back down the west coast.
const SCOTLAND_PATH = `
  M 690,470
  L 686,448 L 678,420 L 668,392 L 656,366
  L 642,342 L 624,322 L 600,308 L 575,300
  L 552,300 L 534,310 L 524,328 L 522,350
  L 528,370 L 538,386 L 540,402 L 532,416
  L 514,422 L 490,420 L 466,412 L 442,400
  L 420,388 L 402,378 L 388,368 L 380,354
  L 380,336 L 388,316 L 402,294 L 420,272
  L 442,250 L 466,228 L 488,206 L 506,184
  L 520,160 L 528,134 L 532,108 L 542,86
  L 560,72 L 582,68 L 604,72 L 622,82
  L 632,98 L 632,118 L 624,138 L 612,156
  L 602,176 L 600,198 L 608,216 L 626,224
  L 648,222 L 668,212 L 686,196 L 700,178
  L 712,158 L 720,138 L 730,122 L 746,114
  L 766,116 L 782,128 L 790,148 L 788,170
  L 778,190 L 762,206 L 744,220 L 728,236
  L 718,256 L 716,278 L 722,298 L 736,314
  L 754,326 L 772,338 L 786,354 L 792,374
  L 788,394 L 776,410 L 758,422 L 738,432
  L 718,444 L 700,458 L 690,470
  Z
`;

// Wales — west bulge attached to England's western flank.
const WALES_PATH = `
  M 332,742
  L 320,734 L 304,720 L 290,702 L 278,682
  L 270,660 L 268,636 L 274,614 L 286,594
  L 302,580 L 320,572 L 338,572 L 354,580
  L 366,594 L 372,612 L 372,632 L 366,650
  L 358,668 L 350,686 L 344,706 L 338,728
  L 332,742
  Z
`;

// Ireland — separate landmass to the west.
const IRELAND_PATH = `
  M 162,720
  L 142,712 L 122,700 L 106,684 L 94,664
  L 86,640 L 84,614 L 88,588 L 100,564
  L 116,544 L 136,528 L 158,518 L 182,514
  L 206,516 L 228,524 L 246,538 L 258,556
  L 264,578 L 264,602 L 258,624 L 248,642
  L 244,660 L 248,676 L 256,690 L 262,706
  L 260,724 L 248,738 L 230,748 L 208,752
  L 184,750 L 162,742 L 152,728 L 162,720
  Z
`;

// Northern Ireland — small block in the NE of Ireland (for UK shading).
const NORTHERN_IRELAND_PATH = `
  M 198,548
  L 222,544 L 244,548 L 260,560 L 264,578
  L 260,594 L 248,604 L 230,608 L 210,608
  L 192,602 L 180,590 L 178,572 L 188,558
  L 198,548
  Z
`;

// Convenience grouping — UK = England + Scotland + Wales + NI
const UK_PATHS = [ENGLAND_PATH, SCOTLAND_PATH, WALES_PATH, NORTHERN_IRELAND_PATH];

// ══════════════════════════════════════════════════════════════════════════════
// CITY DATABASE — coordinates in 1000×1200 map space
// Hand-placed against the simplified outline above (approximate).
// ══════════════════════════════════════════════════════════════════════════════

const CITY_COORDS: Record<string, [number, number]> = {
  // Scotland
  edinburgh:      [560, 380],
  glasgow:        [510, 388],
  aberdeen:       [612, 306],
  inverness:      [552, 268],

  // Northern England
  newcastle:      [612, 478],
  sunderland:     [624, 488],
  middlesbrough:  [620, 506],
  carlisle:       [538, 488],

  // Yorkshire
  leeds:          [602, 564],
  sheffield:      [610, 600],
  hull:           [658, 568],
  york:           [620, 552],
  bradford:       [592, 562],

  // North West
  manchester:     [552, 600],
  liverpool:      [510, 608],
  blackburn:      [538, 580],
  burnley:        [552, 574],
  bolton:         [538, 596],
  preston:        [528, 580],

  // Midlands
  nottingham:     [620, 644],
  leicester:      [624, 676],
  birmingham:     [578, 700],
  coventry:       [608, 692],
  wolverhampton:  [566, 696],
  derby:          [608, 654],
  "stoke":        [560, 660],
  "stoke on trent":[560, 660],

  // East Anglia
  cambridge:      [682, 724],
  norwich:        [732, 700],
  ipswich:        [722, 740],
  peterborough:   [666, 698],

  // London & SE
  london:         [678, 798],
  "west ham":     [690, 794],
  tottenham:      [678, 790],
  arsenal:        [676, 792],
  chelsea:        [670, 800],
  fulham:         [668, 800],
  "crystal palace":[684, 804],
  brentford:      [664, 798],
  watford:        [654, 778],
  luton:          [648, 762],

  // South Coast
  brighton:       [668, 882],
  southampton:    [582, 880],
  portsmouth:     [600, 886],
  bournemouth:    [556, 892],

  // West / SW
  bristol:        [510, 770],
  bath:           [524, 778],
  exeter:         [442, 880],
  plymouth:       [402, 902],
  swindon:        [560, 760],
  reading:        [620, 778],
  oxford:         [600, 752],

  // Wales
  cardiff:        [402, 774],
  swansea:        [362, 776],

  // Northern Ireland
  belfast:        [232, 580],

  // Republic of Ireland
  dublin:         [228, 656],
  cork:           [134, 720],
};

// ══════════════════════════════════════════════════════════════════════════════
// LAYOUT
// ══════════════════════════════════════════════════════════════════════════════

const FRAME_W = 1920;
const FRAME_H = 1080;

// Map column on the right side (~58% of frame width).
const MAP_RENDER_W = 760;
const MAP_RENDER_H = 912;
const MAP_LEFT     = 1040;    // start of map column
const MAP_TOP      = 84;

// Folio column on the left.
const FOLIO_LEFT   = 130;
const FOLIO_RIGHT_LIMIT = 720; // max width of left column

// Convert a (mapX, mapY) in 1000×1200 space to screen-pixel coordinates,
// accounting for the rendered map size and its position on the frame.
const toScreen = (mx: number, my: number): [number, number] => [
  MAP_LEFT + (mx / MAP_W) * MAP_RENDER_W,
  MAP_TOP  + (my / MAP_H) * MAP_RENDER_H,
];

// Rough region centroids in map space (for scaling the camera origin).
const REGION_CENTROIDS: Record<string, [number, number]> = {
  england:  [560, 740],
  scotland: [580, 280],
  wales:    [330, 660],
  ireland:  [170, 640],
  uk:       [490, 600],
};

// ══════════════════════════════════════════════════════════════════════════════
// TIMING
// ══════════════════════════════════════════════════════════════════════════════

const CAM_DUR        = 36;    // 0 → 36
const COUNTRY_DRAW_F = 8;     // outlines start drawing
const TARGET_FILL_F  = 24;    // accent fill grows in
const PIN_F          = 40;    // primary pin drops
const PIN_STAGGER    = 14;    // secondary pins follow
const LINE_F         = 56;    // callout line draws
const LINE_DUR       = 18;
const LABEL_F        = 72;    // folio fades in
const DESC_F         = 90;
const SOURCE_F       = 108;

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

export const MapCallout: React.FC<MapCalloutProps> = ({
  title,
  titleSize,
  dateline,
  description,
  source,
  pins,
  calloutCity,
  calloutText,
  highlightRegion,
  accentColor,
  bgColor,
  darkMode,
  skipIntro = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const textColor   = darkMode ? "#f5f0e8" : COLORS.primary;
  const mutedColor  = darkMode ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.42)";
  const coastStroke = darkMode ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.55)";
  const landFill    = darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
  const graticule   = darkMode ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)";

  // ── Springs (skipIntro = full reveal immediately) ────────────────────────
  const springAt = (f: number, cfg: { damping: number; stiffness: number }) =>
    skipIntro ? 1 : spring({ fps, frame: Math.max(0, frame - f), config: cfg });

  // Camera: slow ease-out-cubic zoom 0.92 → 1.0
  const cameraScale = skipIntro
    ? 1
    : interpolate(frame, [0, CAM_DUR], [0.92, 1.0], {
        extrapolateLeft:  "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.cubic),
      });

  // Map + graticule fade
  const mapAlpha = skipIntro
    ? 1
    : interpolate(frame, [0, CAM_DUR], [0, 1], {
        extrapolateLeft: "clamp", extrapolateRight: "clamp",
      });

  // Country-outline draw progress (0 → 1)
  const outlineProg = skipIntro
    ? 1
    : Math.max(0, Math.min(1, interpolate(frame, [COUNTRY_DRAW_F, COUNTRY_DRAW_F + 22], [0, 1], {
        extrapolateLeft: "clamp", extrapolateRight: "clamp",
      })));

  // Target-region fill grow-in
  const targetFillProg = skipIntro
    ? 1
    : Math.max(0, Math.min(1, spring({
        fps, frame: Math.max(0, frame - TARGET_FILL_F),
        config: { damping: 22, stiffness: 60 },
      })));

  // Folio + description + source springs
  const labelProg  = springAt(LABEL_F,  { damping: 22, stiffness: 52 });
  const descProg   = springAt(DESC_F,   { damping: 22, stiffness: 52 });
  const sourceProg = springAt(SOURCE_F, { damping: 22, stiffness: 52 });

  // ── Resolve callout target ───────────────────────────────────────────────
  const calloutKey = (calloutCity || pins.find(p => p.highlighted)?.city || "").toLowerCase().trim();
  const calloutMapXY = calloutKey ? CITY_COORDS[calloutKey] : null;
  const calloutScreenXY = calloutMapXY ? toScreen(calloutMapXY[0], calloutMapXY[1]) : null;

  // ── Camera origin pinned to highlighted region centroid (in screen space)
  const regionCentroid = REGION_CENTROIDS[highlightRegion] ?? REGION_CENTROIDS.england;
  const regionScreen   = toScreen(regionCentroid[0], regionCentroid[1]);

  // ── Callout line geometry ────────────────────────────────────────────────
  // Place the label in the safe whitespace to the LEFT of the map column
  // (between folio and map). The line goes from pin → leftward elbow → label.
  const lineProg = skipIntro
    ? 1
    : Math.max(0, Math.min(1, interpolate(frame, [LINE_F, LINE_F + LINE_DUR], [0, 1], {
        extrapolateLeft: "clamp", extrapolateRight: "clamp",
      })));

  // Callout label position — in safe space, anchored to the left edge of the map column
  // We draw the line as: pin → up/diagonal → label. Use an L-shaped path.
  let labelEndX = 0, labelEndY = 0;
  if (calloutScreenXY) {
    const [cx, cy] = calloutScreenXY;
    // Pull out to the left of the pin into safe whitespace, slightly upward
    labelEndX = Math.max(MAP_LEFT - 80, cx - 200);
    labelEndY = cy - 40;
  }

  // Build callout path data (M pin L bend L end)
  const calloutPathFull = calloutScreenXY
    ? (() => {
        const [cx, cy] = calloutScreenXY;
        const bx = (cx + labelEndX) / 2;
        const by = labelEndY;
        return `M ${cx} ${cy} L ${bx} ${by} L ${labelEndX} ${labelEndY}`;
      })()
    : "";

  // Stroke-dasharray draw-on. We use a generous pathLength estimate.
  const calloutLineLen = calloutScreenXY
    ? Math.hypot((calloutScreenXY[0] - labelEndX) / 2, (calloutScreenXY[1] - labelEndY))
      + Math.hypot((calloutScreenXY[0] - labelEndX) / 2, 0)
    : 0;

  // ── Render text for the label (defaults to the title if no calloutText)
  const labelPrimary = calloutText || title;

  return (
    <AbsoluteFill style={{ fontFamily, overflow: "hidden" }}>
      {/* Z-0  background */}
      {darkMode ? <DarkBackground color={bgColor} /> : <PaperBackground color={bgColor} />}

      {/* Z-10  camera-scaled content plane */}
      <div style={{
        position:        "absolute",
        inset:           0,
        zIndex:          10,
        transform:       `scale(${cameraScale})`,
        transformOrigin: `${regionScreen[0]}px ${regionScreen[1]}px`,
      }}>
        {/* ── MAP SVG ───────────────────────────────────────────────────── */}
        <svg
          style={{
            position:   "absolute",
            left:       MAP_LEFT,
            top:        MAP_TOP,
            opacity:    mapAlpha,
            // Subtle drop-shadow under the country (CSS, NOT svg glow)
            filter:     "drop-shadow(0 4px 20px rgba(0,0,0,0.10))",
            overflow:   "visible",
          }}
          width={MAP_RENDER_W}
          height={MAP_RENDER_H}
          viewBox={`0 0 ${MAP_W} ${MAP_H}`}
        >
          {/* Graticule — subtle latitude/longitude hairlines */}
          <g stroke={graticule} strokeWidth={1} fill="none" opacity={mapAlpha}>
            {/* Horizontals */}
            {[150, 300, 450, 600, 750, 900, 1050].map((y) => (
              <line key={`h${y}`} x1={0} y1={y} x2={MAP_W} y2={y} />
            ))}
            {/* Verticals */}
            {[100, 250, 400, 550, 700, 850].map((x) => (
              <line key={`v${x}`} x1={x} y1={0} x2={x} y2={MAP_H} />
            ))}
          </g>

          {/* All landmasses with faint base fill (non-target regions) */}
          {/* Ireland (separate landmass — neutral fill) */}
          <path
            d={IRELAND_PATH}
            fill={highlightRegion === "ireland" ? `${accentColor}33` : landFill}
            stroke={coastStroke}
            strokeWidth={1.6}
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity={outlineProg}
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - outlineProg}
          />

          {/* England base */}
          <path
            d={ENGLAND_PATH}
            fill={highlightRegion === "england" || highlightRegion === "uk" ? "transparent" : landFill}
            stroke={coastStroke}
            strokeWidth={1.6}
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity={outlineProg}
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - outlineProg}
          />

          {/* Scotland base */}
          <path
            d={SCOTLAND_PATH}
            fill={highlightRegion === "scotland" || highlightRegion === "uk" ? "transparent" : landFill}
            stroke={coastStroke}
            strokeWidth={1.6}
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity={outlineProg}
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - outlineProg}
          />

          {/* Wales base */}
          <path
            d={WALES_PATH}
            fill={highlightRegion === "wales" || highlightRegion === "uk" ? "transparent" : landFill}
            stroke={coastStroke}
            strokeWidth={1.6}
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity={outlineProg}
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - outlineProg}
          />

          {/* Northern Ireland base */}
          <path
            d={NORTHERN_IRELAND_PATH}
            fill={highlightRegion === "uk" ? "transparent" : landFill}
            stroke={coastStroke}
            strokeWidth={1.4}
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity={outlineProg}
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - outlineProg}
          />

          {/* TARGET REGION — accent fill at 0.18 opacity + 2px accent stroke */}
          {(() => {
            const targetPaths =
              highlightRegion === "england"  ? [ENGLAND_PATH] :
              highlightRegion === "scotland" ? [SCOTLAND_PATH] :
              highlightRegion === "wales"    ? [WALES_PATH] :
              highlightRegion === "ireland"  ? [IRELAND_PATH] :
              UK_PATHS;
            return (
              <g style={{
                transformOrigin: "center",
                opacity: targetFillProg,
              }}>
                {targetPaths.map((d, i) => (
                  <path
                    key={`target-${i}`}
                    d={d}
                    fill={accentColor}
                    fillOpacity={0.18 * targetFillProg}
                    stroke={accentColor}
                    strokeWidth={2}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    opacity={outlineProg}
                  />
                ))}
              </g>
            );
          })()}

          {/* Pins (rendered in map-space, scaled with the SVG viewBox) */}
          {pins.map((pin, i) => {
            const cityKey = pin.city.toLowerCase().trim();
            const xy      = CITY_COORDS[cityKey];
            if (!xy) return null;

            const isHighlighted = pin.highlighted || cityKey === calloutKey;
            // Highlighted pin lands first; secondaries stagger
            const pinFrameLocal = isHighlighted ? PIN_F : PIN_F + (i + 1) * PIN_STAGGER;
            const pinProg = skipIntro ? 1 : Math.max(0, Math.min(1, spring({
              fps, frame: Math.max(0, frame - pinFrameLocal),
              config: { damping: 12, stiffness: 180 },
            })));

            const [px, py] = xy;
            const pinColor = isHighlighted ? accentColor
                           : (darkMode ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.40)");
            // Outer ring for highlighted pin
            return (
              <g key={pin.city + i} style={{ opacity: pinProg }}>
                {isHighlighted && (
                  <circle
                    cx={px} cy={py}
                    r={20 * pinProg}
                    fill="none"
                    stroke={accentColor}
                    strokeWidth={1.2}
                    opacity={0.55}
                  />
                )}
                <circle
                  cx={px} cy={py}
                  r={isHighlighted ? 10 * pinProg : 6 * pinProg}
                  fill={pinColor}
                />
                {/* Inactive pin labels — small caps, muted */}
                {!isHighlighted && pin.label && pinProg > 0.5 && (
                  <text
                    x={px + 14}
                    y={py + 6}
                    fontSize="18"
                    fontWeight="700"
                    fontFamily={fontFamily}
                    letterSpacing="2"
                    fill={mutedColor}
                    opacity={interpolate(pinProg, [0.5, 1], [0, 0.85], { extrapolateRight: "clamp" })}
                    style={{ textTransform: "uppercase" }}
                  >
                    {pin.label.toUpperCase()}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* ── CALLOUT LINE — drawn in screen-space on top of the map ────── */}
        {calloutScreenXY && calloutPathFull && (
          <svg
            style={{
              position: "absolute",
              left:     0,
              top:      0,
              width:    FRAME_W,
              height:   FRAME_H,
              pointerEvents: "none",
              overflow: "visible",
            }}
            width={FRAME_W}
            height={FRAME_H}
          >
            <path
              d={calloutPathFull}
              fill="none"
              stroke={accentColor}
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={calloutLineLen}
              strokeDashoffset={calloutLineLen * (1 - lineProg)}
            />
            {/* Tiny accent dot at the label end */}
            {lineProg > 0.85 && (
              <circle
                cx={labelEndX}
                cy={labelEndY}
                r={interpolate(lineProg, [0.85, 1], [0, 4], { extrapolateRight: "clamp" })}
                fill={accentColor}
              />
            )}
          </svg>
        )}

        {/* ── CALLOUT LABEL (sits in safe space, near labelEnd) ──────────── */}
        {calloutScreenXY && (
          <div style={{
            position:  "absolute",
            // Label aligns to the right, so its right edge meets the line endpoint
            right:     FRAME_W - labelEndX + 14,
            top:       labelEndY - 16,
            opacity:   interpolate(lineProg, [0.6, 1], [0, 1], { extrapolateRight: "clamp" }),
            textAlign: "right" as const,
            maxWidth:  340,
            pointerEvents: "none",
          }}>
            <div style={{
              fontFamily,
              fontSize:      11,
              fontWeight:    700,
              letterSpacing: 3,
              textTransform: "uppercase" as const,
              color:         accentColor,
              marginBottom:  6,
            }}>
              The Subject
            </div>
            <div style={{
              fontFamily:    serifFontFamily,
              fontStyle:     "italic",
              fontSize:      26,
              fontWeight:    500,
              letterSpacing: -0.5,
              color:         textColor,
              lineHeight:    1.1,
            }}>
              {labelPrimary}
            </div>
          </div>
        )}

        {/* ── FOLIO TOP-LEFT (subject + accent tab + dateline) ───────────── */}
        <div style={{
          position:  "absolute",
          left:      FOLIO_LEFT,
          top:       220,
          maxWidth:  FOLIO_RIGHT_LIMIT - FOLIO_LEFT,
          opacity:   interpolate(labelProg, [0, 0.6], [0, 1], { extrapolateRight: "clamp" }),
          transform: `translateY(${interpolate(labelProg, [0, 1], [10, 0], { extrapolateRight: "clamp" })}px)`,
        }}>
          {/* Subject — serif italic byline */}
          <div style={{
            fontFamily:    serifFontFamily,
            fontStyle:     "italic",
            fontWeight:    500,
            fontSize:      titleSize >= 56 ? 56 : Math.max(40, titleSize),
            letterSpacing: -1,
            lineHeight:    1.0,
            color:         textColor,
          }}>
            {title}
          </div>
          {/* Tiny accent tab */}
          <div style={{
            width:        interpolate(labelProg, [0, 1], [0, 36], { extrapolateRight: "clamp" }),
            height:       3,
            background:   accentColor,
            marginTop:    18,
            marginBottom: 14,
          }} />
          {/* Dateline */}
          {dateline && (
            <div style={{
              fontFamily,
              fontSize:      12,
              fontWeight:    700,
              letterSpacing: 3.5,
              textTransform: "uppercase" as const,
              color:         mutedColor,
              lineHeight:    1.0,
            }}>
              {dateline}
            </div>
          )}
        </div>

        {/* ── DESCRIPTION (serif italic narrative) ───────────────────────── */}
        {description && (
          <div style={{
            position:      "absolute",
            left:          FOLIO_LEFT,
            top:           430,
            maxWidth:      FOLIO_RIGHT_LIMIT - FOLIO_LEFT,
            fontFamily:    serifFontFamily,
            fontStyle:     "italic",
            fontWeight:    400,
            fontSize:      28,
            lineHeight:    1.32,
            letterSpacing: -0.2,
            color:         textColor,
            opacity:       interpolate(descProg, [0, 0.6], [0, 0.9], { extrapolateRight: "clamp" }),
            transform:     `translateY(${interpolate(descProg, [0, 1], [10, 0], { extrapolateRight: "clamp" })}px)`,
          }}>
            {description}
          </div>
        )}

        {/* ── SOURCE BOTTOM-RIGHT ─────────────────────────────────────────── */}
        {source && (
          <div style={{
            position:      "absolute",
            right:         140,
            bottom:        80,
            fontFamily,
            fontSize:      12,
            fontWeight:    700,
            letterSpacing: 3.5,
            textTransform: "uppercase" as const,
            color:         mutedColor,
            opacity:       interpolate(sourceProg, [0, 0.6], [0, 1], { extrapolateRight: "clamp" }),
          }}>
            {source}
          </div>
        )}
      </div>

      {/* Z-2  Grain — LAST in JSX per §2 */}
      <div style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none" }}>
        <Grain />
      </div>
    </AbsoluteFill>
  );
};
