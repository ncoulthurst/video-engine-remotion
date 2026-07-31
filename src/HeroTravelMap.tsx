/**
 * HeroTravelMap — Minimal flat political-map travel transition.
 *
 * The "here to there" beat: camera opens tight on the origin, pulls back to
 * reveal a great-circle route across a clean world map, then pushes in on
 * the destination. Built for use as a scene-to-scene transition (a move,
 * a transfer, a tournament abroad) — not a literal atlas.
 *
 * Map data: real country outlines from Natural Earth (public domain, via the
 * `world-atlas` package), projected with d3-geo (`geoEqualEarth`). No terrain,
 * roads, relief or place labels — just land / ocean / border, so any two
 * lat/lng points on Earth work, not just a pre-drawn region.
 *
 * Palette: routed through the shared kit PALETTE (bgGeo = ocean, ink = land/
 * text, line = borders, accent = route/pins) so it reskins with the rest of
 * the project instead of carrying its own fixed colours.
 *
 * Camera: three fitExtent() framings (close on A, wide enough for both
 * points, close on B) with scale/translate interpolated between them —
 * no globe rotation, so this assumes a route that doesn't cross the
 * antimeridian (fine for real-world city-to-city travel).
 *
 * Stack: Bg (0) → Map+Content (10) → Grain (2, LAST in JSX).
 */

import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";
import * as d3geo from "d3-geo";
import { interpolateZoom } from "d3-interpolate";
import { feature } from "topojson-client";
// @ts-ignore — JSON import, no bundled types
import worldTopo from "world-atlas/countries-110m.json";
import { fontFamily, PALETTE } from "./shared";

// ══════════════════════════════════════════════════════════════════════════════
// SCHEMA
// ══════════════════════════════════════════════════════════════════════════════

export const HeroTravelMapPropsSchema = z.object({
  fromLabel: z.string().optional().default("Montevideo"),
  fromLat:   z.number().default(-34.9011),
  fromLng:   z.number().default(-56.1645),
  toLabel:   z.string().optional().default("Liverpool"),
  toLat:     z.number().default(53.4084),
  toLng:     z.number().default(-2.9916),
  /** Small caption above the distance stat, e.g. "TRANSFER · 2011" */
  caption:   z.string().optional().default(""),
  /** Shows the auto-computed great-circle distance in the corner. */
  showDistance: z.boolean().optional().default(true),
  /** Colour overrides — same override convention as the kit's `resolveTheme`
   *  (Ground's bgColor/inkColor/mutedColor/accentColor), so this template
   *  plugs into the engine's palette wiring with no further changes once
   *  that wiring exists. Falls back to the shared PALETTE (vault) untouched. */
  bgColor: z.string().optional(),
  inkColor: z.string().optional(),
  mutedColor: z.string().optional(),
  accentColor: z.string().optional(),
  lineColor: z.string().optional(),
  skipIntro: z.boolean().optional().default(false),
});

export type HeroTravelMapProps = z.infer<typeof HeroTravelMapPropsSchema>;

// ══════════════════════════════════════════════════════════════════════════════
// WORLD GEOMETRY (Natural Earth 110m, public domain — parsed once at module load)
// ══════════════════════════════════════════════════════════════════════════════

const WORLD_FEATURES = (feature(
  worldTopo as any,
  (worldTopo as any).objects.countries
) as any).features as GeoJSON.Feature[];

const FRAME_W = 1920;
const FRAME_H = 1080;
const MAP_PAD = 90; // px inset from frame edge the camera frames within

// ══════════════════════════════════════════════════════════════════════════════
// CAMERA — fitExtent-derived framings
// ══════════════════════════════════════════════════════════════════════════════

type Framing = { scale: number; translate: [number, number] };

// NOTE ON WINDING: d3-geo treats Polygons as spherical regions, and the
// "inside" is determined by ring orientation (right-hand rule), not by
// planar even-odd fill rules. A ring built in the naive planar-CCW order
// (BL → BR → TR → TL) is read as the *exterior* of the box — i.e. "the
// whole world except this box" — which silently breaks fitExtent (it
// measures a near-full-sphere bound instead of the small box). The correct
// winding for a small "this box is the region of interest" polygon is
// TL → TR → BR → BL.

/** A small lng/lat bbox polygon around a point, used purely to derive a "close" framing. */
function pointBox(lng: number, lat: number, radiusDeg: number): GeoJSON.Polygon {
  const latPad = radiusDeg;
  const lngPad = radiusDeg / Math.max(0.15, Math.cos((lat * Math.PI) / 180));
  return {
    type: "Polygon",
    coordinates: [[
      [lng - lngPad, lat + latPad],
      [lng + lngPad, lat + latPad],
      [lng + lngPad, lat - latPad],
      [lng - lngPad, lat - latPad],
      [lng - lngPad, lat + latPad],
    ]],
  };
}

function bothBox(
  a: [number, number], b: [number, number], padDeg: number
): GeoJSON.Polygon {
  const minLng = Math.min(a[0], b[0]) - padDeg;
  const maxLng = Math.max(a[0], b[0]) + padDeg;
  const minLat = Math.min(a[1], b[1]) - padDeg;
  const maxLat = Math.max(a[1], b[1]) + padDeg;
  return {
    type: "Polygon",
    coordinates: [[
      [minLng, maxLat], [maxLng, maxLat], [maxLng, minLat], [minLng, minLat], [minLng, maxLat],
    ]],
  };
}

function fitFraming(
  projection: d3geo.GeoProjection, geom: GeoJSON.Polygon
): Framing {
  projection.fitExtent([[MAP_PAD, MAP_PAD], [FRAME_W - MAP_PAD, FRAME_H - MAP_PAD]], geom);
  return { scale: projection.scale(), translate: projection.translate() as [number, number] };
}

// ── Framing ↔ "view" conversion, so camera moves use d3's interpolateZoom
// (the van Wijk/Nuij smooth zoom-pan curve — the standard technique for a
// camera that pulls back, glides, and pushes in without ever feeling like two
// independently-lerped properties fighting each other) instead of a naive
// linear/log lerp of scale+translate. A "view" is [cx, cy, w]: the centre of
// the visible window in the projection's raw (pre-scale/translate) plane,
// plus its width in that same plane. ──
function framingToView(fr: Framing): [number, number, number] {
  const [tx, ty] = fr.translate;
  const cx = (FRAME_W / 2 - tx) / fr.scale;
  const cy = (FRAME_H / 2 - ty) / fr.scale;
  return [cx, cy, FRAME_W / fr.scale];
}
function viewToFraming(view: [number, number, number]): Framing {
  const [cx, cy, w] = view;
  const scale = FRAME_W / w;
  return { scale, translate: [FRAME_W / 2 - cx * scale, FRAME_H / 2 - cy * scale] };
}

// ══════════════════════════════════════════════════════════════════════════════
// TIMING
// ══════════════════════════════════════════════════════════════════════════════

const HOLD_A_END      = 26;
const ZOOM_OUT_END     = 66;
const ARC_DRAW_START   = 40;
const ARC_DRAW_END     = 96;
const ZOOM_IN_B_START  = 100;
const ZOOM_IN_B_END    = 138;
const LABEL_B_F        = 142;
export const HERO_TRAVEL_MAP_DURATION = 165;

const EASE = Easing.inOut(Easing.cubic);

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

export const HeroTravelMap: React.FC<HeroTravelMapProps> = ({
  fromLabel, fromLat, fromLng,
  toLabel, toLat, toLng,
  caption, showDistance,
  bgColor, inkColor, mutedColor, accentColor, lineColor,
  skipIntro = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const from: [number, number] = [fromLng, fromLat];
  const to: [number, number] = [toLng, toLat];

  // Fixed rotation centred on the route's midpoint meridian — kept constant
  // for the whole scene so panning is a pure scale/translate tween.
  const projection = useMemo(() => {
    const midLng = (fromLng + toLng) / 2;
    return d3geo.geoEqualEarth().rotate([-midLng, 0]);
  }, [fromLng, toLng]);

  const pathGen = useMemo(() => d3geo.geoPath(projection), [projection]);

  const { framingA, framingWide, framingB } = useMemo(() => {
    const a = fitFraming(projection, pointBox(fromLng, fromLat, 9));
    const wide = fitFraming(projection, bothBox(from, to, 10));
    const b = fitFraming(projection, pointBox(toLng, toLat, 9));
    return { framingA: a, framingWide: wide, framingB: b };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projection, fromLng, fromLat, toLng, toLat]);

  const toWide = skipIntro ? 1 : interpolate(frame, [HOLD_A_END, ZOOM_OUT_END], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE,
  });
  const toB = skipIntro ? 1 : interpolate(frame, [ZOOM_IN_B_START, ZOOM_IN_B_END], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE,
  });

  // one smooth van Wijk/Nuij zoom-pan curve per leg (A→wide, wide→B) instead
  // of independently lerping scale (log) and translate (linear) — the couple
  // between pan speed and zoom level is what reads as "a camera move" rather
  // than "two properties tweening at once".
  const camera = useMemo(() => {
    const viewA = framingToView(framingA);
    const viewWide = framingToView(framingWide);
    const viewB = framingToView(framingB);
    const outInterp = interpolateZoom(viewA, viewWide);
    const inInterp = interpolateZoom(viewWide, viewB);
    const view = toB > 0 ? inInterp(toB) : outInterp(toWide);
    return viewToFraming(view as [number, number, number]);
  }, [framingA, framingWide, framingB, toWide, toB]);

  // Apply the current frame's camera to the (shared, mutable) projection.
  projection.scale(camera.scale).translate(camera.translate);

  const project = (lngLat: [number, number]) => projection(lngLat) as [number, number] | null;

  // ── Great-circle route ──────────────────────────────────────────────────
  const interpolateRoute = useMemo(() => d3geo.geoInterpolate(from, to), [
    fromLng, fromLat, toLng, toLat,
  ]);
  const distanceKm = useMemo(() => Math.round(d3geo.geoDistance(from, to) * 6371), [
    fromLng, fromLat, toLng, toLat,
  ]);

  const arcProg = skipIntro ? 1 : Math.max(0, Math.min(1, interpolate(
    frame, [ARC_DRAW_START, ARC_DRAW_END], [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE }
  )));

  const ROUTE_SAMPLES = 48;
  const routePoints: [number, number][] = [];
  for (let i = 0; i <= ROUTE_SAMPLES; i++) {
    const t = (i / ROUTE_SAMPLES) * arcProg;
    const p = project(interpolateRoute(t));
    if (p) routePoints.push(p);
  }
  const routeD = routePoints.length > 1
    ? "M " + routePoints.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" L ")
    : "";

  const dotXY = arcProg > 0 ? project(interpolateRoute(arcProg)) : null;

  const fromXY = project(from);
  const toXY = project(to);

  // ── Fades ────────────────────────────────────────────────────────────────
  const fromLabelOpacity = skipIntro ? 1 : interpolate(frame, [8, 20], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const toLabelOpacity = skipIntro ? 1 : interpolate(frame, [LABEL_B_F, LABEL_B_F + 14], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const captionOpacity = skipIntro ? 1 : interpolate(frame, [10, 24], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const mapOpacity = skipIntro ? 1 : interpolate(frame, [0, 14], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // colour overrides — same convention as the kit's resolveTheme, falls back
  // to the shared PALETTE untouched.
  const bg = bgColor ?? PALETTE.bgGeo;
  const ink = inkColor ?? PALETTE.ink;
  const muted = mutedColor ?? PALETTE.muted;
  const accent = accentColor ?? PALETTE.accent;
  const line = lineColor ?? PALETTE.line;
  const landFill = `${ink}12`;
  const borderStroke = line;

  return (
    <AbsoluteFill style={{ fontFamily, overflow: "hidden", background: bg }}>
      {/* Z-10 map + content */}
      <div style={{ position: "absolute", inset: 0, zIndex: 10, opacity: mapOpacity }}>
        <svg width={FRAME_W} height={FRAME_H} style={{ position: "absolute", inset: 0 }}>
          <g fill={landFill} stroke={borderStroke} strokeWidth={0.75} strokeLinejoin="round">
            {WORLD_FEATURES.map((f, i) => (
              <path key={i} d={pathGen(f as any) || undefined} />
            ))}
          </g>

          {/* Route arc */}
          {routeD && (
            <path
              d={routeD}
              fill="none"
              stroke={accent}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeDasharray="1 7"
            />
          )}
          {routeD && (
            <path d={routeD} fill="none" stroke={accent} strokeWidth={0.75} opacity={0.5} />
          )}

          {/* Travel dot */}
          {dotXY && (
            <circle cx={dotXY[0]} cy={dotXY[1]} r={5} fill={accent} />
          )}

          {/* Origin pin */}
          {fromXY && (
            <g opacity={fromLabelOpacity}>
              <circle cx={fromXY[0]} cy={fromXY[1]} r={12} fill="none" stroke={accent} strokeWidth={1.2} opacity={0.5} />
              <circle cx={fromXY[0]} cy={fromXY[1]} r={5.5} fill={accent} />
            </g>
          )}

          {/* Destination pin */}
          {toXY && (
            <g opacity={toLabelOpacity}>
              <circle cx={toXY[0]} cy={toXY[1]} r={12} fill="none" stroke={accent} strokeWidth={1.2} opacity={0.5} />
              <circle cx={toXY[0]} cy={toXY[1]} r={5.5} fill={accent} />
            </g>
          )}
        </svg>

        {/* Origin label */}
        {fromXY && (
          <div style={{
            position: "absolute",
            left: fromXY[0] + 18,
            top: fromXY[1] - 14,
            opacity: fromLabelOpacity,
            fontFamily, fontSize: 20, fontWeight: 700, letterSpacing: 2,
            textTransform: "uppercase" as const,
            color: ink,
            whiteSpace: "nowrap" as const,
          }}>
            {fromLabel}
          </div>
        )}

        {/* Destination label */}
        {toXY && (
          <div style={{
            position: "absolute",
            left: toXY[0] + 18,
            top: toXY[1] - 14,
            opacity: toLabelOpacity,
            fontFamily, fontSize: 20, fontWeight: 700, letterSpacing: 2,
            textTransform: "uppercase" as const,
            color: ink,
            whiteSpace: "nowrap" as const,
          }}>
            {toLabel}
          </div>
        )}

        {/* Caption + distance (bottom-left folio) */}
        {(caption || showDistance) && (
          <div style={{
            position: "absolute", left: 90, bottom: 70, opacity: captionOpacity,
          }}>
            {caption && (
              <div style={{
                fontFamily, fontSize: 13, fontWeight: 700, letterSpacing: 3.5,
                textTransform: "uppercase" as const, color: muted, marginBottom: 6,
              }}>
                {caption}
              </div>
            )}
            {showDistance && (
              <div style={{
                fontFamily, fontSize: 34, fontWeight: 700, letterSpacing: -0.5,
                color: ink,
              }}>
                {distanceKm.toLocaleString()} <span style={{ fontSize: 18, color: muted, fontWeight: 700 }}>KM</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* soften the top/bottom frame edges so the map reads as fading into
          the ground rather than an abrupt hard-cropped cutoff */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 160, zIndex: 11, pointerEvents: "none", background: `linear-gradient(to bottom, ${bg}, transparent)` }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 160, zIndex: 11, pointerEvents: "none", background: `linear-gradient(to top, ${bg}, transparent)` }} />
    </AbsoluteFill>
  );
};
