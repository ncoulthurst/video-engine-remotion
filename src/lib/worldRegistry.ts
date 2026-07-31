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
  TimelineScroll:         "paper",
  HeroOutro:           "paper",

  // Dark world — high-contrast data + tactical compositions
  HeroIntro:           "dark",
  HeroStatBars:        "dark",
  HeroBigStat:         "dark",
  HeroTactical:        "dark",
  HeroFormRun:         "dark",
  HeroTransferRecord:  "dark",
  HeroChapterWord:     "dark",
  HeroShotMap:         "dark",
  HeroComparisonRadar: "dark",
  HeroMatchTimeline:   "dark",
  HeroDualPanel:       "dark",
  HeroNewsFeed:        "dark",
  HeroHeadlineStack:   "dark",
  HeroGoalRush:        "dark",
  HeroPhotoReel:       "dark",
  HeroContactSheet:    "dark",
  HeroPlayerRevealTrio:"dark",
  HeroTransferProfit:  "dark",
  HeroClipSingle:      "dark",
  HeroClipCompare:     "dark",
  AttackingRadar:         "dark",
  PlayerTrio:             "dark",
  CountdownReveal:        "dark",
  TeamLineup:             "dark",
  StatPulse:              "dark",
  ValueCurve:             "dark",
  TournamentBracket:      "dark",

  // Neutral — works in either world (no forced background)
  CareerTimeline:         "neutral",
  HeroSeasonTimeline:  "neutral",
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
};

export const worldFor = (compositionId: string): TemplateWorld =>
  TEMPLATE_WORLD[compositionId] ?? "neutral";
