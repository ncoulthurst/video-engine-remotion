/**
 * Reference: STYLE_GUIDE.md §6
 *
 * Canonical registry of named motion primitives for Remotion templates.
 * Hand-rolled spring/easing configs in templates should be migrated here
 * over time to avoid drift from the style guide.
 */

import { Easing } from "remotion";

/**
 * Named spring configurations. See STYLE_GUIDE.md §6 "Spring Configurations".
 */
export const MOTION = Object.freeze({
  /** Panel / portrait arrivals — deliberate, cinematic. */
  panelArrival: { damping: 28, stiffness: 55 } as const,
  /** Row reveals, list items, narrated reveals — medium-tempo workhorse. */
  rowReveal: { damping: 22, stiffness: 52 } as const,
  /** Snappy small elements — badges, pins, single-glyph pops. Visible bounce. */
  snappyPop: { damping: 14, stiffness: 200 } as const,
  /** Slow zoom (camera in/out). */
  slowZoom: { damping: 26, stiffness: 38 } as const,
  /** Camera pan between scenes — must settle within panFrames. */
  cameraPan: { damping: 30, stiffness: 180, mass: 1 } as const,
});

/**
 * Approved easing curves. See STYLE_GUIDE.md §6 "Easing — Approved Curves".
 */
export const EASING = Object.freeze({
  /** iOS easeOutExpo — heavy deceleration, soft landing. SaaS hero entries. */
  saasFloatIn: Easing.bezier(0.16, 1, 0.3, 1),
  /** Default workhorse: count-ups, camera moves, draw-on lines, position shifts. */
  outCubic: Easing.out(Easing.cubic),
  /** Drift envelopes — start at rest, peak in middle, return to rest. */
  inOutCubic: Easing.inOut(Easing.cubic),
  /** Faster than cubic for short (< 18 frame) reveals — caption fades, secondary text. */
  outQuad: Easing.out(Easing.quad),
});

/**
 * Stagger frame gaps. See STYLE_GUIDE.md §6 "Stagger Timing".
 */
export const STAGGER = Object.freeze({
  /** Data rows — one beat per row (14–20 range, canonical: 16). */
  dataRow: 16,
  /** Words / title chars — fast but perceptible. */
  wordChar: 8,
  /** Timeline nodes — node-per-beat. */
  timelineNode: 14,
  /** Rank items — slower, more weight. */
  rankItem: 20,
});

/**
 * Frame counts. See STYLE_GUIDE.md §6 "Timing Conventions".
 * `previewStillFrame` mirrors PREVIEW_STILL_FRAME on the engine side
 * (see utils/remotion_renderer.py in the companion engine repo).
 */
export const TIMING = Object.freeze({
  /** Intro entry duration. */
  introEntry: 24,
  /** Minimum item dwell time. */
  itemDwellMin: 90,
  /** Maximum item dwell time. */
  itemDwellMax: 120,
  /** Camera pan duration. */
  cameraPan: 24,
  /** Outro zoom duration. */
  outroZoom: 50,
  /** Frame used for preview still capture (see remotion_renderer.py). */
  previewStillFrame: 30,
});
