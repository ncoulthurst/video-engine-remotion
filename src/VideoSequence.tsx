/**
 * VideoSequence — master composition that stitches scenes together with transitions.
 *
 * Usage: define a `scenes` array, each entry specifying a compositionId, its props,
 * duration, and the transition to use AFTER that scene. The total duration is
 * computed dynamically via calculateMetadata.
 *
 * Supported transitions: push | flash | letterbox | paper | dataLine | grain | none
 */
import React from "react";
import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { z } from "zod";

// ── Scene components ───────────────────────────────────────────────────────────
import { IntrcptIntro } from "./IntrcptIntro";
import { IntrcptStatBars } from "./IntrcptStatBars";
import { IntrcptFormRun } from "./IntrcptFormRun";
import { IntrcptTactical } from "./IntrcptTactical";
import { IntrcptBigStat } from "./IntrcptBigStat";
import { IntrcptLeagueGraph } from "./IntrcptLeagueGraph";
import { IntrcptTransferRecord } from "./IntrcptTransferRecord";
import { IntrcptQuote } from "./IntrcptQuote";
import { IntrcptChapterWord } from "./IntrcptChapterWord";
import { IntrcptConceptCard } from "./IntrcptConceptCard";
import { IntrcptScatterPlot } from "./IntrcptScatterPlot";
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
import { IntrcptTransferProfit } from "./IntrcptTransferProfit";
import { IntrcptPhotoReel } from "./IntrcptPhotoReel";
import { IntrcptContactSheet } from "./IntrcptContactSheet";
import { IntrcptPlayerReveal } from "./IntrcptPlayerReveal";
import { IntrcptGoalRush } from "./IntrcptGoalRush";
import { IntrcptHeadlineStack } from "./IntrcptHeadlineStack";

// ── Transitions ────────────────────────────────────────────────────────────────
import {
  pushTransition, pushTiming,
  flashTransition, flashTiming,
  letterboxTransition, letterboxTiming,
  paperFadeTransition, paperFadeTiming,
  dataLineTransition, dataLineTiming,
  grainBurstTransition, grainBurstTiming,
  TRANSITION_DURATIONS,
} from "./ChapterTransition";

// ─────────────────────────────────────────────────────────────────────────────
// Scene registry — maps compositionId strings to React components
// ─────────────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SCENE_REGISTRY: Record<string, React.ComponentType<any>> = {
  IntrcptIntro,
  IntrcptStatBars,
  IntrcptFormRun,
  IntrcptTactical,
  IntrcptBigStat,
  IntrcptLeagueGraph,
  IntrcptTransferRecord,
  IntrcptQuote,
  IntrcptChapterWord,
  IntrcptConceptCard,
  IntrcptScatterPlot,
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
  IntrcptTransferProfit,
  IntrcptPhotoReel,
  IntrcptContactSheet,
  IntrcptPlayerReveal,
  IntrcptGoalRush,
  IntrcptHeadlineStack,
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
function getPresentation(type: TransitionType, accentColor: string): any {
  switch (type) {
    case "push":      return pushTransition();
    case "flash":     return flashTransition();
    case "letterbox": return letterboxTransition();
    case "paper":     return paperFadeTransition();
    case "dataLine":  return dataLineTransition({ accentColor });
    case "grain":     return grainBurstTransition();
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
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <Component {...(scene.props as any)} />
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
        const presentation = getPresentation(t, accent);
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
