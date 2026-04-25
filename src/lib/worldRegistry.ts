/**
 * Track E — World classification registry.
 *
 * Single source of truth for the paper / dark / neutral world each
 * composition lives in. Consumed by VideoSequence.resolveTransitionForCut
 * to enforce world-aware transitions (paper→dark cuts route through the
 * `paper` transition; same-world cuts respect the per-scene flow_hint).
 */

export type TemplateWorld = "paper" | "dark" | "neutral";

export const TEMPLATE_WORLD: Record<string, TemplateWorld> = {
  // Paper world — light backgrounds, editorial typography, archival feel
  ArticleHeadline:        "paper",
  ScoutReport:            "paper",
  QuoteCard:              "paper",
  AnnotatedImage:         "paper",
  TimelineScroll:         "paper",
  PortraitStatHero:       "paper",
  PortraitWithBars:       "paper",

  // Dark world — high-contrast data + tactical compositions
  IntrcptIntro:           "dark",
  IntrcptStatBars:        "dark",
  IntrcptBigStat:         "dark",
  IntrcptTactical:        "dark",
  IntrcptLeagueGraph:     "dark",
  IntrcptFormRun:         "dark",
  IntrcptTransferRecord:  "dark",
  IntrcptQuote:           "dark",
  IntrcptChapterWord:     "dark",
  IntrcptScatterPlot:     "dark",
  IntrcptShotMap:         "dark",
  IntrcptComparisonRadar: "dark",
  IntrcptMatchTimeline:   "dark",
  IntrcptDualPanel:       "dark",
  IntrcptNewsFeed:        "dark",
  IntrcptHeadlineStack:   "dark",
  IntrcptGoalRush:        "dark",
  IntrcptPhotoReel:       "dark",
  IntrcptContactSheet:    "dark",
  IntrcptPlayerRevealTrio:"dark",
  IntrcptTransferProfit:  "dark",
  IntrcptClipSingle:      "dark",
  IntrcptClipCompare:     "dark",
  AttackingRadar:         "dark",
  PlayerTrio:             "dark",
  TrioFeature:            "dark",
  CountdownReveal:        "dark",
  TeamLineup:             "dark",
  StatPulse:              "dark",
  ValueCurve:             "dark",
  TournamentBracket:      "dark",

  // Neutral — works in either world (no forced background)
  CareerTimeline:         "neutral",
  IntrcptAwardsList:      "neutral",
  IntrcptSeasonTimeline:  "neutral",
  PremierLeagueTable:     "neutral",
  TopScorersTable:        "neutral",
  PlayerStats:            "neutral",
  MatchResult:            "neutral",
  SeasonComparison:       "neutral",
  DisciplinaryRecord:     "neutral",
  AnimatedFactCard:       "neutral",
  TitleCard:              "neutral",
  SplitComparison:        "neutral",
  MatchMoment:            "neutral",
  TransferProfit:         "neutral",
  TrophyGraphic:          "neutral",
  MapCallout:             "neutral",
};

export const worldFor = (compositionId: string): TemplateWorld =>
  TEMPLATE_WORLD[compositionId] ?? "neutral";
