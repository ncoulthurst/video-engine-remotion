/**
 * CameraRig — keyframed orthographic camera (roadmap H2, PRODUCTION_GAP_ANALYSIS §4.4 Layer 1).
 *
 * Replaces the old static WorldStateRoot offset semantics with a real camera:
 * a path of time-anchored keyframes (seconds, narration-anchored) interpolated
 * with house easing. Strictly orthographic — translate + scale only, matching
 * the reference's rostrum-camera constraint. No 3D, no rotation, no DOF.
 *
 * At rest (before the first keyframe, after the last, or during a hold) the rig
 * adds a perpetual sub-pixel drift so a "locked-off" frame still breathes like
 * film — same recipe as finance/kit's useSignatureCamera.
 *
 * Consumers: the sequence-as-composition work (H3) travels a wide canvas with
 * this rig; templates may also use it for board-level moves.
 */
import React from "react";
import { Easing, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";

// ── Schema ────────────────────────────────────────────────────────────────────

export const CameraKeyframeSchema = z.object({
  /** Seconds from the start of the composition this keyframe is reached. */
  t: z.number(),
  /** World-space offset (px) the camera has travelled at this keyframe. */
  x: z.number(),
  y: z.number(),
  /** Orthographic zoom. 1 = rest. */
  scale: z.number().default(1),
  /** Easing used while travelling INTO this keyframe. */
  ease: z.enum(["settle", "drift", "linear"]).default("settle"),
});
export type CameraKeyframe = z.infer<typeof CameraKeyframeSchema>;

export const CameraPathSchema = z.array(CameraKeyframeSchema);
export type CameraPath = z.infer<typeof CameraPathSchema>;

// ── Easing map ────────────────────────────────────────────────────────────────

const EASE_FN: Record<"settle" | "drift" | "linear", (t: number) => number> = {
  /** Burst-decel soft landing — the house camera ease. */
  settle: Easing.bezier(0.16, 1, 0.3, 1),
  /** Symmetric glide — start and end at rest. */
  drift: Easing.inOut(Easing.cubic),
  linear: (t) => t,
};

// ── Sampler ───────────────────────────────────────────────────────────────────

export function sampleCamera(
  path: CameraKeyframe[],
  frame: number,
  fps: number,
): { x: number; y: number; scale: number } {
  if (!path || path.length === 0) return { x: 0, y: 0, scale: 1 };
  const kfs = [...path].sort((a, b) => a.t - b.t);
  const sec = frame / fps;

  const first = kfs[0];
  if (sec <= first.t) return { x: first.x, y: first.y, scale: first.scale ?? 1 };

  const last = kfs[kfs.length - 1];
  if (sec >= last.t) return { x: last.x, y: last.y, scale: last.scale ?? 1 };

  // Find the segment containing `sec`
  let i = 0;
  while (i < kfs.length - 1 && kfs[i + 1].t <= sec) i++;
  const a = kfs[i];
  const b = kfs[i + 1];
  const span = Math.max(1e-6, b.t - a.t);
  const p = EASE_FN[b.ease ?? "settle"]((sec - a.t) / span);

  return {
    x: a.x + (b.x - a.x) * p,
    y: a.y + (b.y - a.y) * p,
    scale: (a.scale ?? 1) + ((b.scale ?? 1) - (a.scale ?? 1)) * p,
  };
}

// ── Rig component ─────────────────────────────────────────────────────────────

export const CameraRig: React.FC<{
  path?: CameraPath;
  /** Perpetual sub-pixel breathing. Default on. */
  drift?: boolean;
  children: React.ReactNode;
}> = ({ path, drift = true, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cam = sampleCamera(path ?? [], frame, fps);

  // Sub-pixel drift so a resting camera still breathes (never a static export).
  const dx = drift ? Math.sin(frame * 0.018) * 1.1 : 0;
  const dy = drift ? Math.cos(frame * 0.014) * 0.8 : 0;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        transform: `translate(${-cam.x + dx}px, ${-cam.y + dy}px) scale(${cam.scale})`,
        transformOrigin: "50% 50%",
        willChange: "transform",
      }}
    >
      {children}
    </div>
  );
};

// ── Path builder ──────────────────────────────────────────────────────────────

/**
 * settleOn — build a CameraPath that HOLDS on each anchor, then travels to the
 * next one over `travelSec` (clamped to 60% of the gap), settling with the
 * house ease. Anchors are world offsets + the second the camera must have
 * arrived by (typically the narration cue for that beat).
 */
export function settleOn(
  anchors: Array<{ x: number; y: number; scale?: number; atSec: number }>,
  travelSec = 1.4,
): CameraPath {
  const sorted = [...anchors].sort((a, b) => a.atSec - b.atSec);
  const path: CameraPath = [];
  sorted.forEach((a, i) => {
    if (i > 0) {
      const prev = sorted[i - 1];
      const gap = a.atSec - prev.atSec;
      const travel = Math.max(0.01, Math.min(travelSec, gap * 0.6));
      // Hold on the previous anchor until the travel window opens.
      path.push({
        t: a.atSec - travel,
        x: prev.x,
        y: prev.y,
        scale: prev.scale ?? 1,
        ease: "linear",
      });
    }
    path.push({ t: a.atSec, x: a.x, y: a.y, scale: a.scale ?? 1, ease: "settle" });
  });
  return path;
}
