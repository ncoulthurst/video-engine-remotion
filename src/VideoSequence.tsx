/**
 * VideoSequence — master composition that stitches scenes together with transitions.
 *
 * Usage: define a `scenes` array, each entry specifying a compositionId, its props,
 * duration, and the transition to use AFTER that scene. The total duration is
 * computed dynamically via calculateMetadata.
 *
 * Supported transitions: push | flash | letterbox | paper | dataLine | grain | worldPan | none
 */
import React from "react";
import { AbsoluteFill } from "remotion";
import { WorldStateRoot } from "./shared";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { z } from "zod";

// ── Scene components ───────────────────────────────────────────────────────────
import { HeroIntro } from "./HeroIntro";
import { HeroStatBars } from "./HeroStatBars";
import { HeroFormRun } from "./HeroFormRun";
import { HeroTactical } from "./HeroTactical";
import { HeroBigStat } from "./HeroBigStat";
import { HeroLeagueGraph } from "./HeroLeagueGraph";
import { HeroTransferRecord } from "./HeroTransferRecord";
import { HeroQuote } from "./HeroQuote";
import { HeroChapterWord } from "./HeroChapterWord";
import { HeroClipCompare } from "./HeroClipCompare";
import { HeroScatterPlot } from "./HeroScatterPlot";
import { TrioFeature } from "./TrioFeature";
import { PlayerTrio } from "./PlayerTrio";
import { CareerTimeline } from "./CareerTimeline";
import { PremierLeagueTable } from "./PremierLeagueTable";
import { TopScorersTable } from "./TopScorersTable";
import { PlayerStats } from "./PlayerStats";
import { MatchResult } from "./MatchResult";
import { SeasonComparison } from "./SeasonComparison";
import { TeamLineup } from "./TeamLineup";
import { TrophyGraphic } from "./TrophyGraphic";
import { DisciplinaryRecord } from "./DisciplinaryRecord";
import { QuoteCard } from "./QuoteCard";
import { ArticleHeadline } from "./ArticleHeadline";
import { AttackingRadar } from "./AttackingRadar";
import { MapCallout } from "./MapCallout";
import { AnimatedFactCard } from "./AnimatedFactCard";
import { TitleCard } from "./TitleCard";
import { AnnotatedImage } from "./AnnotatedImage";
import { SplitComparison } from "./SplitComparison";
import { TimelineScroll } from "./TimelineScroll";
import { CountdownReveal } from "./CountdownReveal";
import { StatPulse } from "./StatPulse";
import { MatchMoment } from "./MatchMoment";
import { TransferProfit } from "./TransferProfit";
import { ScoutReport } from "./ScoutReport";
import { ValueCurve } from "./ValueCurve";
import { HeroTransferProfit } from "./HeroTransferProfit";
import { HeroPhotoReel } from "./HeroPhotoReel";
import { HeroContactSheet } from "./HeroContactSheet";
import { HeroPlayerRevealTrio } from "./HeroPlayerRevealTrio";
import { HeroGoalRush } from "./HeroGoalRush";
import { HeroHeadlineStack } from "./HeroHeadlineStack";
import { HeroShotMap } from "./HeroShotMap";
import { HeroMatchTimeline } from "./HeroMatchTimeline";
import { HeroAwardsList } from "./HeroAwardsList";
import { HeroComparisonRadar } from "./HeroComparisonRadar";
import { HeroDualPanel } from "./HeroDualPanel";
import { HeroNewsFeed } from "./HeroNewsFeed";
import { HeroSeasonTimeline } from "./HeroSeasonTimeline";
import { TournamentBracket } from "./TournamentBracket";
// Track E — new hybrid templates + world classification
import { PortraitStatHero } from "./PortraitStatHero";
import { PortraitWithBars } from "./PortraitWithBars";
import { HeroOutro } from "./HeroOutro";
import { worldFor, type TemplateWorld } from "./lib/worldRegistry";

// ── Generated components (motion_agent.py) ────────────────────────────────────
import { GEN_REGISTRY } from "./gen/index";

// ── Transitions ────────────────────────────────────────────────────────────────
import {
  pushTransition, pushTiming,
  flashTransition, flashTiming,
  letterboxTransition, letterboxTiming,
  paperFadeTransition, paperFadeTiming,
  dataLineTransition, dataLineTiming,
  grainBurstTransition, grainBurstTiming,
  worldPanTransition, worldPanTiming,
  evolveTransition, evolveTiming,
  TRANSITION_DURATIONS,
} from "./ChapterTransition";

// ─────────────────────────────────────────────────────────────────────────────
// Scene registry — maps compositionId strings to React components
// ─────────────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SCENE_REGISTRY: Record<string, React.ComponentType<any>> = {
  HeroIntro,
  HeroOutro,
  HeroStatBars,
  HeroFormRun,
  HeroTactical,
  HeroBigStat,
  HeroLeagueGraph,
  HeroTransferRecord,
  HeroQuote,
  HeroChapterWord,
  HeroClipCompare,
  HeroScatterPlot,
  TrioFeature,
  PlayerTrio,
  CareerTimeline,
  PremierLeagueTable,
  TopScorersTable,
  PlayerStats,
  MatchResult,
  SeasonComparison,
  TeamLineup,
  TrophyGraphic,
  DisciplinaryRecord,
  QuoteCard,
  ArticleHeadline,
  AttackingRadar,
  MapCallout,
  AnimatedFactCard,
  TitleCard,
  AnnotatedImage,
  SplitComparison,
  TimelineScroll,
  CountdownReveal,
  StatPulse,
  MatchMoment,
  TransferProfit,
  ScoutReport,
  ValueCurve,
  HeroTransferProfit,
  HeroPhotoReel,
  HeroContactSheet,
  HeroPlayerRevealTrio,
  HeroGoalRush,
  HeroHeadlineStack,
  HeroShotMap,
  HeroMatchTimeline,
  HeroAwardsList,
  HeroComparisonRadar,
  HeroDualPanel,
  HeroNewsFeed,
  HeroSeasonTimeline,
  TournamentBracket,
  // Track E hybrids
  PortraitStatHero,
  PortraitWithBars,
  // Merge generated components last — they can override defaults during dev
  ...GEN_REGISTRY,
};

// ─────────────────────────────────────────────────────────────────────────────
// Track E — World-aware transition resolver
//
// Forces a `paper` transition between paper-world and dark-world cuts; same-
// world cuts respect the per-scene flow_hint. Neutral templates inherit the
// other side's world — they don't force a paper transition.
// ─────────────────────────────────────────────────────────────────────────────

type _SceneLike = { compositionId?: string; transition?: string };

export const resolveTransitionForCut = (
  prev: _SceneLike,
  next: _SceneLike,
): string => {
  const prevWorld: TemplateWorld = worldFor(prev.compositionId ?? "");
  const nextWorld: TemplateWorld = worldFor(next.compositionId ?? "");
  // Neutral inherits the other side's world; so only paper↔dark forces paper
  const conflicting =
    (prevWorld === "paper" && nextWorld === "dark") ||
    (prevWorld === "dark"  && nextWorld === "paper");
  if (conflicting) return "paper";
  // Same-world or neutral-adjacent cuts honour the explicit flow_hint
  return next.transition ?? prev.transition ?? "none";
};

// ─────────────────────────────────────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────────────────────────────────────

export const TransitionTypeSchema = z.enum([
  "push",
  "flash",
  "letterbox",
  "paper",
  "dataLine",
  "grain",
  "worldPan",
  "evolve",
  "none",
]);

export type TransitionType = z.infer<typeof TransitionTypeSchema>;

export const SceneDefSchema = z.object({
  /** Must match a key in SCENE_REGISTRY */
  compositionId: z.string().optional().default(""),
  /** Props forwarded verbatim to the scene component */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: z.any(),
  /** Scene duration in frames (before transition overlap) */
  durationInFrames: z.number().int().min(1),
  /**
   * Transition to apply AFTER this scene.
   * 'none' means a hard cut (default).
   */
  transition: TransitionTypeSchema.default("none"),
  /**
   * Override the transition duration in frames.
   * Defaults to the duration computed by the transition's timing function.
   */
  transitionDuration: z.number().int().optional(),
  /**
   * Accent colour for transitions that use it (dataLine, flash tint, etc).
   * Falls back to the VideoSequence-level accentColor.
   */
  accentColor: z.string().optional().default(""),
  /**
   * Directional hint for push / worldPan transitions.
   * "right" = forward in time (default), "left" = backward/retrospective.
   * "forward" is treated as "right". Ignored by non-directional transitions.
   */
  transitionDirection: z.enum(["left", "right", "forward"]).optional(),
});

export type SceneDef = z.infer<typeof SceneDefSchema>;

export const VideoSequencePropsSchema = z.object({
  scenes: z.array(SceneDefSchema).min(1),
  /** Fallback accent colour for transitions that need one */
  accentColor: z.string().optional().default("").default("#C8102E"),
});

export type VideoSequenceProps = z.infer<typeof VideoSequencePropsSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// getTransitionFrames — computes actual overlap by calling the timing function.
// Spring-based timings (push, letterbox) are fps-dependent; linear ones aren't.
// ─────────────────────────────────────────────────────────────────────────────

function getTransitionFrames(
  type: TransitionType,
  fps: number,
  override?: number
): number {
  if (override !== undefined) return override;
  switch (type) {
    case "push":      return pushTiming().getDurationInFrames({ fps });
    case "flash":     return flashTiming().getDurationInFrames({ fps });
    case "letterbox": return letterboxTiming().getDurationInFrames({ fps });
    case "paper":     return paperFadeTiming().getDurationInFrames({ fps });
    case "dataLine":  return dataLineTiming().getDurationInFrames({ fps });
    case "grain":     return grainBurstTiming().getDurationInFrames({ fps });
    case "worldPan":  return worldPanTiming().getDurationInFrames({ fps });
    case "evolve":    return evolveTiming().getDurationInFrames({ fps });
    default:          return 0;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// calculateMetadata — dynamic total duration
//
// Total frames = Σ(scene.durationInFrames) − Σ(transitionDuration)
// because each transition overlaps the tail of the exiting scene and the
// head of the entering scene simultaneously.
// ─────────────────────────────────────────────────────────────────────────────

export const calculateMetadata = ({
  props,
  defaultProps: _defaultProps,
}: {
  props: VideoSequenceProps;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaultProps: any;
  abortSignal?: AbortSignal;
}) => {
  const fps = 30;
  const { scenes } = props;
  let total = 0;

  for (let i = 0; i < scenes.length; i++) {
    total += scenes[i].durationInFrames;

    // Subtract overlap for the transition that follows this scene
    if (i < scenes.length - 1) {
      const t = (scenes[i].transition ?? "none") as TransitionType;
      if (t !== "none") {
        total -= getTransitionFrames(t, fps, scenes[i].transitionDuration);
      }
    }
  }

  return { durationInFrames: Math.max(1, total) };
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers — map transition type → presentation + timing
// ─────────────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getPresentation(type: TransitionType, accentColor: string, direction?: "left" | "right" | "forward"): any {
  // Normalise "forward" → "right" (default push direction)
  const pushDir: "left" | "right" = direction === "left" ? "left" : "right";
  switch (type) {
    case "push":      return pushTransition({ direction: pushDir });
    case "flash":     return flashTransition();
    case "letterbox": return letterboxTransition();
    case "paper":     return paperFadeTransition();
    case "dataLine":  return dataLineTransition({ accentColor });
    case "grain":     return grainBurstTransition();
    case "worldPan":  return worldPanTransition({ direction: pushDir });
    case "evolve":    return evolveTransition();
    default:          return null;
  }
}

function getTiming(type: TransitionType, durationOverride?: number) {
  switch (type) {
    case "push":
      return pushTiming();
    case "flash":
      return durationOverride
        ? linearTiming({ durationInFrames: durationOverride })
        : flashTiming();
    case "letterbox":
      return durationOverride
        ? linearTiming({ durationInFrames: durationOverride })
        : letterboxTiming();
    case "paper":
      return durationOverride
        ? linearTiming({ durationInFrames: durationOverride })
        : paperFadeTiming();
    case "dataLine":
      return durationOverride
        ? linearTiming({ durationInFrames: durationOverride })
        : dataLineTiming();
    case "grain":
      return durationOverride
        ? linearTiming({ durationInFrames: durationOverride })
        : grainBurstTiming();
    case "worldPan":
      return worldPanTiming();
    case "evolve":
      return durationOverride
        ? linearTiming({ durationInFrames: durationOverride })
        : evolveTiming();
    default:
      return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// VideoSequence component
// ─────────────────────────────────────────────────────────────────────────────

export const VideoSequence: React.FC<VideoSequenceProps> = ({
  scenes,
  accentColor = "#C8102E",
}) => {
  // Build a flat array of TransitionSeries.Sequence + TransitionSeries.Transition
  // alternating elements — required by @remotion/transitions.
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const Component = SCENE_REGISTRY[scene.compositionId];

    // Render scene (or a fallback if the compositionId is unknown)
    if (Component) {
      elements.push(
        <TransitionSeries.Sequence
          key={`scene-${i}`}
          durationInFrames={scene.durationInFrames}
        >
          <WorldStateRoot worldState={(scene.props as { worldState?: unknown })?.worldState as never}>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <Component {...(scene.props as any)} />
          </WorldStateRoot>
        </TransitionSeries.Sequence>
      );
    } else {
      elements.push(
        <TransitionSeries.Sequence
          key={`scene-${i}`}
          durationInFrames={scene.durationInFrames}
        >
          <AbsoluteFill
            style={{
              background: "#111",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontFamily: "monospace",
              fontSize: 32,
            }}
          >
            Unknown scene: {scene.compositionId}
          </AbsoluteFill>
        </TransitionSeries.Sequence>
      );
    }

    // Add transition after this scene (not after the last scene)
    if (i < scenes.length - 1) {
      const t = (scene.transition ?? "none") as TransitionType;
      if (t !== "none") {
        const accent = scene.accentColor ?? accentColor;
        const presentation = getPresentation(t, accent, scene.transitionDirection);
        const timing = getTiming(t, scene.transitionDuration);

        if (presentation && timing) {
          elements.push(
            <TransitionSeries.Transition
              key={`transition-${i}`}
              presentation={presentation}
              timing={timing}
            />
          );
        }
      }
    }
  }

  return (
    <AbsoluteFill>
      <TransitionSeries>{elements}</TransitionSeries>
    </AbsoluteFill>
  );
};
