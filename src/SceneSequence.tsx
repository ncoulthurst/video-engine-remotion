/**
 * SceneSequence — sequence-as-composition (roadmap H3, PRODUCTION_GAP_ANALYSIS §4.4 Layer 2).
 *
 * An act segment rendered as ONE composition: existing templates become PANELS
 * laid out on a wide logical canvas, a keyframed orthographic CameraRig travels
 * between them, and the sequence owns the single shared ground (bg + thematic
 * texture + atmosphere + grain) — which is what delivers the reference's
 * "one document being explored" feel. Templates need zero changes: their kit
 * <Ground> collapses to a transparent Theme provider via SequenceCtx.
 *
 * v1 scope: the engine groups runs of evolve-linked graphics (same act, same
 * world bg) into one SceneSequence scene inside VideoSequence. TransitionSeries
 * remains only BETWEEN sequences — chapter cards stay the only hard resets.
 */
import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { SmartImg, WorldStateSchema } from "./shared";
import {
  Ground, SequenceCtx, TYPE, EASE, prog, useTheme, countUp, formatNum,
} from "./lib/kit";
import { CameraRig, CameraPathSchema, settleOn } from "./lib/cameraRig";
import { SCENE_REGISTRY } from "./VideoSequence";

// ── Schema ────────────────────────────────────────────────────────────────────

export const SequenceBeatSchema = z.object({
  /** Stable scene id from the storyboard/timeline (diagnostics only). */
  id: z.string().optional().default(""),
  /** Existing template compositionId — rendered as a panel, not a screen. */
  template: z.string(),
  props: z.record(z.string(), z.any()).optional().default({}),
  /** World-space position of the panel's top-left corner on the canvas. */
  anchor: z.object({ x: z.number(), y: z.number().optional().default(0) }),
  /** Seconds (from sequence start) the camera must have ARRIVED on this beat. */
  atSec: z.number(),
  /** Optional camera zoom while resting on this beat. */
  scale: z.number().optional().default(1),
});
export type SequenceBeat = z.infer<typeof SequenceBeatSchema>;

// ── Persistent elements (roadmap H5, §4.4 Layer 3) ───────────────────────────
// An element that SURVIVES across beats: one identity, N per-beat states. The
// layer renders above the panels in WORLD coordinates (it rides the same
// CameraRig) and FLIP-interpolates rect + value between states over the same
// window the camera travels — object permanence instead of the evolve illusion.

const RectSchema = z.object({
  x: z.number(), y: z.number(), w: z.number(), h: z.number(),
});

export const PersistentStateSchema = z.object({
  /** Beat this state belongs to — matches SequenceBeat.id, else by order. */
  beatId: z.string().optional().default(""),
  rect: RectSchema,
  /** Numeric value while resting on this beat (kind "stat"). */
  value: z.number().optional(),
  /** Opacity while resting on this beat (1 default; 0 = element has exited). */
  opacity: z.number().optional().default(1),
});

export const PersistentElementSchema = z.object({
  id: z.string(),
  kind: z.enum(["stat", "label", "image"]),
  /** stat: {unit?, decimals?} · label: {text} · image: {src} */
  data: z.record(z.string(), z.any()).optional().default({}),
  states: z.array(PersistentStateSchema).min(1),
});
export type PersistentElement = z.infer<typeof PersistentElementSchema>;

export const SceneSequencePropsSchema = z.object({
  /** Ground register for the WHOLE sequence. */
  ground: z.enum(["paper", "ink", "structure"]).optional().default("paper"),
  bgColor: z.string().optional().default(""),
  accentColor: z.string().optional().default(""),
  domain: z.enum(["finance", "football", "generic"]).optional().default("football"),
  beats: z.array(SequenceBeatSchema).default([]),
  /** Explicit camera path; generated from beat anchors when omitted. */
  camera: CameraPathSchema.optional(),
  /** Elements that persist across beats (H5). */
  persistent: z.array(PersistentElementSchema).optional().default([]),
  /** Seconds the camera spends travelling between beats. */
  travelSec: z.number().optional().default(1.2),
  skipIntro: z.boolean().optional().default(false),
  worldState: WorldStateSchema.optional(),
});
export type SceneSequenceProps = z.infer<typeof SceneSequencePropsSchema>;

// Panels mount this many frames before their camera-arrival cue so their
// entry animation is already in motion as the camera settles (the reference's
// temporal-anticipation rule at the panel level).
const PANEL_LEAD_FRAMES = 10;

// ── PersistentLayer ───────────────────────────────────────────────────────────

const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

/** Resolve an element's interpolated state at `sec`, given the beat cues. */
function samplePersistent(
  el: PersistentElement,
  beatCues: Array<{ id: string; atSec: number }>,
  sec: number,
  travelSec: number,
): { rect: { x: number; y: number; w: number; h: number }; value?: number; opacity: number } | null {
  // Map each state to its beat cue time (by beatId, else by order).
  const states = el.states.map((st, i) => {
    const byId = st.beatId ? beatCues.find((b) => b.id === st.beatId) : undefined;
    const cue = byId ?? beatCues[Math.min(i, beatCues.length - 1)];
    return { ...st, atSec: cue ? cue.atSec : 0 };
  }).sort((a, b) => a.atSec - b.atSec);

  const first = states[0];
  if (sec < first.atSec - travelSec) return null; // not yet introduced
  if (sec <= first.atSec || states.length === 1) {
    return { rect: first.rect, value: first.value, opacity: first.opacity ?? 1 };
  }
  const last = states[states.length - 1];
  if (sec >= last.atSec) {
    return { rect: last.rect, value: last.value, opacity: last.opacity ?? 1 };
  }
  // Find segment: state k holds until state k+1's travel window opens.
  let k = 0;
  while (k < states.length - 1 && states[k + 1].atSec <= sec) k++;
  const a = states[k];
  const b = states[k + 1];
  const winStart = b.atSec - Math.min(travelSec, Math.max(0.01, b.atSec - a.atSec) * 0.6);
  if (sec <= winStart) {
    return { rect: a.rect, value: a.value, opacity: a.opacity ?? 1 };
  }
  const p = EASE.soft(Math.min(1, (sec - winStart) / Math.max(1e-6, b.atSec - winStart)));
  return {
    rect: {
      x: lerp(a.rect.x, b.rect.x, p),
      y: lerp(a.rect.y, b.rect.y, p),
      w: lerp(a.rect.w, b.rect.w, p),
      h: lerp(a.rect.h, b.rect.h, p),
    },
    value:
      a.value !== undefined && b.value !== undefined
        ? lerp(a.value, b.value, p)
        : b.value ?? a.value,
    opacity: lerp(a.opacity ?? 1, b.opacity ?? 1, p),
  };
}

const PersistentLayer: React.FC<{
  elements: PersistentElement[];
  beatCues: Array<{ id: string; atSec: number }>;
  travelSec: number;
}> = ({ elements, beatCues, travelSec }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = useTheme();
  const sec = frame / fps;

  return (
    <>
      {elements.map((el) => {
        const s = samplePersistent(el, beatCues, sec, travelSec);
        if (!s || s.opacity <= 0.001) return null;
        const { rect } = s;
        const base: React.CSSProperties = {
          position: "absolute",
          left: rect.x,
          top: rect.y,
          width: rect.w,
          height: rect.h,
          opacity: s.opacity,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        };
        if (el.kind === "stat") {
          const decimals = Number(el.data?.decimals ?? 0);
          const unit = String(el.data?.unit ?? "");
          const val = s.value ?? 0;
          return (
            <div key={el.id} style={{ ...base, gap: rect.h * 0.12 }}>
              <span style={{
                fontFamily: TYPE.serif,
                fontWeight: 900,
                fontSize: rect.h * 0.72,
                lineHeight: 1,
                color: t.accent,
                fontVariantNumeric: "tabular-nums",
                letterSpacing: -rect.h * 0.02,
              }}>
                {formatNum(val, decimals)}
              </span>
              {unit && (
                <span style={{
                  fontFamily: TYPE.mono,
                  fontSize: rect.h * 0.2,
                  fontWeight: 600,
                  color: t.muted,
                  textTransform: "uppercase",
                  letterSpacing: TYPE.track,
                  alignSelf: "flex-end",
                  paddingBottom: rect.h * 0.08,
                }}>
                  {unit}
                </span>
              )}
            </div>
          );
        }
        if (el.kind === "label") {
          return (
            <div key={el.id} style={{
              ...base,
              fontFamily: TYPE.mono,
              fontSize: Math.max(11, rect.h * 0.5),
              fontWeight: 600,
              color: t.muted,
              textTransform: "uppercase",
              letterSpacing: TYPE.track,
            }}>
              {String(el.data?.text ?? "")}
            </div>
          );
        }
        // image — hard geometric crop + 1px edge light (§1.4)
        return (
          <div key={el.id} style={{
            ...base,
            overflow: "hidden",
            borderRadius: 6,
            border: "1px solid rgba(255,255,255,0.14)",
          }}>
            <SmartImg
              src={String(el.data?.src ?? "")}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        );
      })}
    </>
  );
};

export const SceneSequence: React.FC<SceneSequenceProps> = ({
  ground = "paper",
  bgColor,
  accentColor,
  domain = "football",
  beats = [],
  camera,
  travelSec = 1.2,
  persistent = [],
  skipIntro = false,
}) => {
  const { fps, width, height, durationInFrames } = useVideoConfig();

  // Camera path: settle on each beat's anchor at its cue. Anchors are the
  // panel top-left; the camera offset IS the anchor because panels are
  // screen-sized (translate(-x) brings panel x into view).
  const path =
    camera && camera.length > 0
      ? camera
      : settleOn(
          beats.map((b) => ({
            x: b.anchor.x,
            y: b.anchor.y ?? 0,
            scale: b.scale ?? 1,
            atSec: b.atSec,
          })),
          travelSec,
        );

  return (
    <AbsoluteFill>
      {/* ONE ground for the whole sequence — the continuity glue. */}
      {/* Football paper worlds are warm cream; without an explicit bgColor,
          resolveTheme's fallback is the finance BRAND blue (F2, observed). */}
      <Ground
        ground={ground}
        bgColor={
          bgColor ||
          (domain === "football" && ground === "paper" ? "#f0ece4" : undefined)
        }
        accentColor={accentColor || undefined}
        domain={domain}
        texture
        skipIntro={skipIntro}
        pad={0}
        drift={false /* the CameraRig provides the breathing */}
      >
        <CameraRig path={path}>
          <SequenceCtx.Provider value={true}>
            {beats.map((b, i) => {
              const Comp = SCENE_REGISTRY[b.template];
              if (!Comp) return null;
              const from = Math.max(
                0,
                Math.round(b.atSec * fps) - PANEL_LEAD_FRAMES,
              );
              const until =
                i + 1 < beats.length
                  ? Math.round(beats[i + 1].atSec * fps) + Math.round(travelSec * fps)
                  : durationInFrames;
              return (
                <Sequence
                  key={b.id || i}
                  from={from}
                  durationInFrames={Math.max(1, until - from)}
                  layout="none"
                >
                  <div
                    style={{
                      position: "absolute",
                      left: b.anchor.x,
                      top: b.anchor.y ?? 0,
                      width,
                      height,
                    }}
                  >
                    <Comp {...(b.props as object)} />
                  </div>
                </Sequence>
              );
            })}
            {/* H5 — persistent elements ride the same camera, above the panels */}
            {persistent.length > 0 && (
              <PersistentLayer
                elements={persistent}
                beatCues={beats.map((b, i) => ({ id: b.id || String(i), atSec: b.atSec }))}
                travelSec={travelSec}
              />
            )}
          </SequenceCtx.Provider>
        </CameraRig>
      </Ground>
    </AbsoluteFill>
  );
};
