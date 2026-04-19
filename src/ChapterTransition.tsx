/**
 * ChapterTransition — all scene transition presenters for the 90th series.
 *
 * Available transitions:
 *   pushTransition      — motion-blur horizontal slide (primary, ~80% usage)
 *   flashTransition     — cream/white film-burn cut (stats reveals, goals)
 *   letterboxTransition — cinematic black-bar crush (chapter breaks)
 *   paperFadeTransition — dissolve through paper texture (quotes, slow moments)
 *   dataLineTransition  — accent-coloured wipe line (signature move)
 *   grainBurstTransition— noise overexposure cut (controversy, high-energy)
 *
 * Each function returns a TransitionPresentation + a recommended timing.
 * Use with TransitionSeries from @remotion/transitions.
 */
import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { linearTiming, springTiming } from "@remotion/transitions";
import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from "@remotion/transitions";

// ── Recommended default durations (frames @ 30fps) ───────────────────────────

export const TRANSITION_DURATIONS = {
  push:      22,   // ~0.73s
  flash:     8,    // ~0.27s — short & punchy
  letterbox: 32,   // ~1.07s
  paper:     26,   // ~0.87s
  dataLine:  28,   // ~0.93s
  grain:     12,   // ~0.40s
  worldPan:  42,   // ~1.40s — "same container" shared world pan
  evolve:    50,   // ~1.67s — same-world evolution: outgoing holds then drops, incoming emerges
} as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function hexToRgba(hex: string, a: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. THE PUSH — horizontal slide with horizontal motion blur
//    Current scene exits left, new scene enters from the right.
//    Direction can be reversed for retrospective cuts.
// ─────────────────────────────────────────────────────────────────────────────

type PushProps = { direction?: "right" | "left"; maxBlur?: number };

const PushPresenter: React.FC<TransitionPresentationComponentProps<PushProps>> = ({
  children,
  presentationProgress: p,
  presentationDirection,
  passedProps,
}) => {
  const { width, height } = useVideoConfig();
  const dir = passedProps?.direction ?? "right";
  const maxBlur = passedProps?.maxBlur ?? 28;

  // Exiting: 0 → -100% (right push) or 0 → +100% (left push)
  // Entering: +100% → 0 (right push) or -100% → 0 (left push)
  const sign = dir === "right" ? 1 : -1;
  const translateX =
    presentationDirection === "exiting"
      ? -easeInOut(p) * 100 * sign
      : (1 - easeInOut(p)) * 100 * sign;

  // Horizontal blur peaks at the midpoint (sin curve)
  const blurAmount = Math.sin(p * Math.PI) * maxBlur;
  const filterId = `push-hblur-${Math.round(blurAmount)}`;

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {/* Inline SVG filter for true horizontal-only blur */}
      {blurAmount > 0.5 && (
        <svg
          style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
        >
          <defs>
            <filter id={filterId} x="-20%" y="0%" width="140%" height="100%">
              <feGaussianBlur stdDeviation={`${blurAmount} 0`} />
            </filter>
          </defs>
        </svg>
      )}
      <AbsoluteFill
        style={{
          transform: `translateX(${translateX}%)`,
          filter: blurAmount > 0.5 ? `url(#${filterId})` : "none",
          willChange: "transform, filter",
        }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export function pushTransition(
  props: PushProps = {}
): TransitionPresentation<PushProps> {
  return { component: PushPresenter, props };
}

export const pushTiming = () =>
  springTiming({
    config: { damping: 220, stiffness: 900, mass: 1 },
    durationRestThreshold: 0.001,
  });

// ─────────────────────────────────────────────────────────────────────────────
// 2. THE FLASH CUT — brief film-burn overexposure between scenes
//    A near-white or cream flash covers the frame at the cut point.
//    Extremely short — punchy and energetic.
// ─────────────────────────────────────────────────────────────────────────────

type FlashProps = { color?: string };

const FlashPresenter: React.FC<TransitionPresentationComponentProps<FlashProps>> = ({
  children,
  presentationProgress: p,
  presentationDirection,
  passedProps,
}) => {
  const color = passedProps?.color ?? "#f5f0e8";

  // Exiting: scene fades toward flash (0 → 1)
  // Entering: flash fades toward scene (1 → 0)
  const flashOpacity =
    presentationDirection === "exiting"
      ? easeInOut(p)
      : 1 - easeInOut(p);

  // Slight scale-up as it exits (like the film burning)
  const scale =
    presentationDirection === "exiting" ? 1 + p * 0.04 : 1 + (1 - p) * 0.04;

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        {children}
      </AbsoluteFill>
      {/* Flash overlay */}
      <AbsoluteFill
        style={{
          background: color,
          opacity: flashOpacity,
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};

export function flashTransition(
  props: FlashProps = {}
): TransitionPresentation<FlashProps> {
  return { component: FlashPresenter, props };
}

export const flashTiming = () => linearTiming({ durationInFrames: TRANSITION_DURATIONS.flash });

// ─────────────────────────────────────────────────────────────────────────────
// 3. THE LETTERBOX — cinematic black bars crush the scene then reveal
//    Bars sweep in from top and bottom, compressing the scene to a strip,
//    then expand back to reveal the new scene.
//    Best for chapter breaks and major section changes.
// ─────────────────────────────────────────────────────────────────────────────

type LetterboxProps = { barColor?: string; crush?: number };

const LetterboxPresenter: React.FC<TransitionPresentationComponentProps<LetterboxProps>> = ({
  children,
  presentationProgress: p,
  presentationDirection,
  passedProps,
}) => {
  const { height } = useVideoConfig();
  const barColor = passedProps?.barColor ?? "#000000";
  const crush = passedProps?.crush ?? 0.46; // how far bars travel (0–0.5)

  // Exiting: bars grow in (0 → crush)
  // Entering: bars shrink out (crush → 0)
  const barH =
    presentationDirection === "exiting"
      ? easeInOut(p) * crush * height
      : (1 - easeInOut(p)) * crush * height;

  // Scene squishes between the bars
  const scaleY =
    presentationDirection === "exiting"
      ? 1 - easeInOut(p) * crush * 2
      : 1 - (1 - easeInOut(p)) * crush * 2;

  const sceneOpacity =
    presentationDirection === "exiting"
      ? p > 0.75 ? 1 - (p - 0.75) * 4 : 1
      : p < 0.25 ? p * 4 : 1;

  return (
    <AbsoluteFill style={{ overflow: "hidden", background: barColor }}>
      {/* Scene, squished vertically */}
      <AbsoluteFill
        style={{
          transform: `scaleY(${Math.max(0.01, scaleY)})`,
          transformOrigin: "center center",
          opacity: sceneOpacity,
        }}
      >
        {children}
      </AbsoluteFill>
      {/* Top bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: barH,
          background: barColor,
        }}
      />
      {/* Bottom bar */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: barH,
          background: barColor,
        }}
      />
    </AbsoluteFill>
  );
};

export function letterboxTransition(
  props: LetterboxProps = {}
): TransitionPresentation<LetterboxProps> {
  return { component: LetterboxPresenter, props };
}

export const letterboxTiming = () =>
  springTiming({
    config: { damping: 28, stiffness: 160, mass: 1 },
    durationRestThreshold: 0.001,
  });

// ─────────────────────────────────────────────────────────────────────────────
// 4. THE PAPER FADE — dissolve through the warm cream texture
//    The outgoing scene fades to paper colour, the incoming scene fades in
//    from paper colour. Feels like turning a page.
//    Best for quotes, tributes, reflective moments.
// ─────────────────────────────────────────────────────────────────────────────

type PaperFadeProps = { paperColor?: string };

const PaperFadePresenter: React.FC<TransitionPresentationComponentProps<PaperFadeProps>> = ({
  children,
  presentationProgress: p,
  presentationDirection,
  passedProps,
}) => {
  const paperColor = passedProps?.paperColor ?? "#f0ece4";

  // Exiting: scene opacity 1 → 0, paper overlay opacity 0 → 1
  // Entering: scene opacity 0 → 1, paper overlay opacity 1 → 0
  const sceneOpacity =
    presentationDirection === "exiting" ? 1 - easeInOut(p) : easeInOut(p);
  const overlayOpacity =
    presentationDirection === "exiting" ? easeInOut(p) : 1 - easeInOut(p);

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: sceneOpacity }}>{children}</AbsoluteFill>
      <AbsoluteFill
        style={{ background: paperColor, opacity: overlayOpacity, pointerEvents: "none" }}
      />
      {/* Grain on the paper for texture */}
      <AbsoluteFill style={{ opacity: overlayOpacity * 0.08, pointerEvents: "none" }}>
        <svg
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
        >
          <defs>
            <filter id="paper-grain-t">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.42"
                numOctaves="6"
                seed={5}
                stitchTiles="stitch"
              />
              <feColorMatrix
                type="matrix"
                values="0.3 0.4 0.3 0 0 0.3 0.4 0.3 0 0 0.3 0.4 0.3 0 0 0 0 0 0 1"
              />
            </filter>
          </defs>
          <rect width="100%" height="100%" filter="url(#paper-grain-t)" />
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export function paperFadeTransition(
  props: PaperFadeProps = {}
): TransitionPresentation<PaperFadeProps> {
  return { component: PaperFadePresenter, props };
}

export const paperFadeTiming = () =>
  linearTiming({ durationInFrames: TRANSITION_DURATIONS.paper });

// ─────────────────────────────────────────────────────────────────────────────
// 5. THE DATA LINE — accent-coloured wipe line, signature transition
//    A thin glowing line in the team/accent colour draws across the screen.
//    Before the line: outgoing scene. After the line: incoming scene.
//    The line has a soft glow and trails slightly.
// ─────────────────────────────────────────────────────────────────────────────

type DataLineProps = { accentColor?: string; lineWidth?: number };

const DataLinePresenter: React.FC<TransitionPresentationComponentProps<DataLineProps>> = ({
  children,
  presentationProgress: p,
  presentationDirection,
  passedProps,
}) => {
  const { width, height } = useVideoConfig();
  const accentColor = passedProps?.accentColor ?? "#C8102E";
  const lineWidth = passedProps?.lineWidth ?? 3;

  // The line position sweeps left to right for the whole transition
  // Exiting: outgoing scene is clipped to the right of the line
  // Entering: incoming scene is clipped to the left of the line
  const lineX = easeInOut(p) * width;

  // Clip paths
  const clipExiting = `inset(0 ${Math.max(0, width - lineX)}px 0 0)`;
  const clipEntering = `inset(0 0 0 ${lineX}px)`;

  const clip =
    presentationDirection === "exiting" ? clipExiting : clipEntering;

  // Glow fades in/out with line presence
  const glowOpacity = Math.sin(p * Math.PI);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {/* Scene clipped to its side of the line */}
      <AbsoluteFill style={{ clipPath: clip }}>{children}</AbsoluteFill>

      {/* The line — only render once (from entering presenter to avoid double-draw) */}
      {presentationDirection === "entering" && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: lineX - lineWidth / 2,
            width: lineWidth,
            height: "100%",
            background: accentColor,
            opacity: glowOpacity,
            boxShadow: `0 0 ${14 * glowOpacity}px ${6 * glowOpacity}px ${hexToRgba(accentColor, 0.6 * glowOpacity)}`,
            pointerEvents: "none",
          }}
        />
      )}
    </AbsoluteFill>
  );
};

export function dataLineTransition(
  props: DataLineProps = {}
): TransitionPresentation<DataLineProps> {
  return { component: DataLinePresenter, props };
}

export const dataLineTiming = () =>
  linearTiming({ durationInFrames: TRANSITION_DURATIONS.dataLine });

// ─────────────────────────────────────────────────────────────────────────────
// 6. THE GRAIN BURST — noise overexposure, raw film cut
//    Grain rapidly overwhelms the frame then cuts to the new scene.
//    Best for high-energy moments, controversy, aggressive cuts.
// ─────────────────────────────────────────────────────────────────────────────

type GrainBurstProps = { color?: string };

const GrainBurstPresenter: React.FC<TransitionPresentationComponentProps<GrainBurstProps>> = ({
  children,
  presentationProgress: p,
  presentationDirection,
  passedProps,
}) => {
  const { width, height } = useVideoConfig();
  const color = passedProps?.color ?? "#000000";

  // Grain opacity arc — exiting: ramp up, entering: ramp down
  const grainOpacity =
    presentationDirection === "exiting"
      ? Math.pow(p, 0.5) * 0.85         // fast ramp up
      : Math.pow(1 - p, 0.5) * 0.85;   // fast ramp down

  // Scene gets darker/lighter as grain overwhelms
  const sceneOpacity =
    presentationDirection === "exiting" ? 1 - p * 0.6 : p * 0.6 + 0.4;

  // Seed changes every 2 frames for animated grain
  const seed = Math.floor(p * 24) % 30;

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: sceneOpacity }}>{children}</AbsoluteFill>
      {/* Dark overlay */}
      <AbsoluteFill
        style={{
          background: color,
          opacity: grainOpacity * 0.5,
          pointerEvents: "none",
        }}
      />
      {/* Animated grain layer */}
      <AbsoluteFill style={{ opacity: grainOpacity, pointerEvents: "none" }}>
        <svg
          width={width}
          height={height}
          style={{ position: "absolute", top: 0, left: 0 }}
        >
          <defs>
            <filter id={`grain-burst-${seed}`} x="0" y="0" width="100%" height="100%">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.80"
                numOctaves="4"
                seed={seed}
                stitchTiles="stitch"
              />
              <feColorMatrix
                type="matrix"
                values="0 0 0 0 0.9  0 0 0 0 0.9  0 0 0 0 0.9  0 0 0 0 1"
              />
            </filter>
          </defs>
          <rect width={width} height={height} filter={`url(#grain-burst-${seed})`} />
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export function grainBurstTransition(
  props: GrainBurstProps = {}
): TransitionPresentation<GrainBurstProps> {
  return { component: GrainBurstPresenter, props };
}

export const grainBurstTiming = () =>
  linearTiming({ durationInFrames: TRANSITION_DURATIONS.grain });

// ─────────────────────────────────────────────────────────────────────────────
// 7. THE WORLD PAN — "same container" shared spatial transition
//
//    Both scenes exist on a wide horizontal canvas. The camera pans through them.
//    At the transition midpoint, BOTH scenes are visible: outgoing on the left,
//    incoming on the right — with a hairline divider between them.
//    This communicates that all content shares one continuous world.
//
//    Derived from analysis of Search Party / MOON documentary channels.
//    See Rule 15 in motion-design-principles.md.
//
//    Best used between: consecutive graphics in the same act, "before/after"
//    sequences, and any time the narrative has spatial continuity.
// ─────────────────────────────────────────────────────────────────────────────

type WorldPanProps = { direction?: "right" | "left"; maxBlur?: number; dividerColor?: string };

const WorldPanPresenter: React.FC<TransitionPresentationComponentProps<WorldPanProps>> = ({
  children,
  presentationProgress: p,
  presentationDirection,
  passedProps,
}) => {
  const { width } = useVideoConfig();
  const dir         = passedProps?.direction ?? "right";
  const maxBlur     = passedProps?.maxBlur ?? 18;
  const dividerColor = passedProps?.dividerColor ?? "rgba(17,17,17,0.22)";

  // Same pan mechanics as push but at FULL width, no overflow:hidden.
  // At p=0.5 (easeInOut(0.5)=0.5), exiting is at -width/2 and entering is
  // at +width/2, so each occupies exactly one half of the canvas.
  const sign = dir === "right" ? 1 : -1;
  const progress = easeInOut(p);

  const translateX =
    presentationDirection === "exiting"
      ? -progress * width * sign
      : (1 - progress) * width * sign;

  // Horizontal motion blur peaks at midpoint — same as push
  const blurAmount = Math.sin(p * Math.PI) * maxBlur;
  const filterId   = `wpan-hblur-${Math.round(blurAmount)}`;

  // Divider is drawn only once — by the entering presenter — at the seam.
  // Seam position: for entering, left edge is at (1-progress)*width
  const seamX = (1 - progress) * width * sign;
  // Divider opacity arcs — peaks at midpoint
  const divOpacity = Math.sin(p * Math.PI) * 0.8;

  return (
    // NO overflow:hidden here — lets both scenes be visible across the canvas.
    // The viewport clips naturally at 0 and width.
    <AbsoluteFill>
      {blurAmount > 0.5 && (
        <svg style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}>
          <defs>
            <filter id={filterId} x="-20%" y="0%" width="140%" height="100%">
              <feGaussianBlur stdDeviation={`${blurAmount} 0`} />
            </filter>
          </defs>
        </svg>
      )}
      <AbsoluteFill
        style={{
          transform:  `translateX(${translateX}px)`,
          filter:     blurAmount > 0.5 ? `url(#${filterId})` : "none",
          willChange: "transform, filter",
        }}
      >
        {children}
      </AbsoluteFill>

      {/* Hairline seam — drawn once by the entering presenter */}
      {presentationDirection === "entering" && divOpacity > 0.02 && (
        <div
          style={{
            position:        "absolute",
            top:             0,
            // Place divider at the seam between the two scenes
            left:            dir === "right" ? seamX - 1 : undefined,
            right:           dir === "left"  ? seamX - 1 : undefined,
            width:           2,
            height:          "100%",
            backgroundColor: dividerColor,
            opacity:         divOpacity,
            pointerEvents:   "none",
            // Soft glow to make the seam feel intentional, not like a render artifact
            boxShadow: `0 0 8px 2px ${dividerColor}`,
          }}
        />
      )}
    </AbsoluteFill>
  );
};

export function worldPanTransition(
  props: WorldPanProps = {}
): TransitionPresentation<WorldPanProps> {
  return { component: WorldPanPresenter, props };
}

export const worldPanTiming = () =>
  springTiming({
    // Heavier damping, lower stiffness than push — smoother, more deliberate pan.
    config: { damping: 200, stiffness: 500, mass: 1.2 },
    durationRestThreshold: 0.001,
  });

// ─────────────────────────────────────────────────────────────────────────────
// 8. THE EVOLVE — same-world scene evolution
//
//    The outgoing scene holds at full opacity, then drops away in the final
//    20% of the transition. The incoming scene's content emerges in the same
//    visual space with a gentle scale-in (1.015 → 1.0).
//
//    The KEY contract: both scenes must share the SAME bgColor. Because the
//    backgrounds are identical, the cross between them is seamless — the
//    viewer sees only foreground elements changing. This is what makes it feel
//    like ONE evolving scene rather than two separate compositions.
//
//    Combined with skipIntro=true on the incoming composition (so its
//    background and persistent elements are already settled from frame 0),
//    this creates true visual continuity: nothing "cuts away" — it evolves.
//
//    Use between: consecutive infographic scenes within the same act that
//    share the same background. The canonical case is opening sequences where
//    the red grain background and portrait persist while new content arrives.
//
//    See Rule 19 in motion-design-principles.md.
// ─────────────────────────────────────────────────────────────────────────────

const EvolvePresenter: React.FC<TransitionPresentationComponentProps<Record<string, never>>> = ({
  children,
  presentationProgress: p,
  presentationDirection,
}) => {
  if (presentationDirection === "exiting") {
    // Hold at full opacity until 80%, then drop to 0 over the final 20%.
    // This keeps the outgoing scene "present" while incoming content emerges.
    const holdFrac = 0.80;
    const exitOpacity = p < holdFrac ? 1 : 1 - easeInOut((p - holdFrac) / (1 - holdFrac));
    return (
      <AbsoluteFill style={{ opacity: exitOpacity }}>
        {children}
      </AbsoluteFill>
    );
  } else {
    // Entering: content fades in with a very subtle scale-down (1.015 → 1.0)
    // — makes it feel like it's emerging into the scene rather than replacing it.
    const enterOpacity = easeInOut(p);
    const scale = 1 + (1 - easeInOut(p)) * 0.015;
    return (
      <AbsoluteFill style={{
        opacity: enterOpacity,
        transform: `scale(${scale.toFixed(4)})`,
        transformOrigin: "center center",
      }}>
        {children}
      </AbsoluteFill>
    );
  }
};

export function evolveTransition(): TransitionPresentation<Record<string, never>> {
  return { component: EvolvePresenter, props: {} };
}

export const evolveTiming = () =>
  linearTiming({ durationInFrames: TRANSITION_DURATIONS.evolve });
