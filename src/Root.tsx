import React from "react";
import { Composition } from "remotion";

import { PremierLeagueTable, TablePropsSchema } from "./PremierLeagueTable";
import { TopScorersTable, TopScorersPropsSchema } from "./TopScorersTable";
import { PlayerStats, PlayerStatsPropsSchema } from "./PlayerStats";
import { MatchResult, MatchResultPropsSchema } from "./MatchResult";
import { CareerTimeline, CareerTimelinePropsSchema } from "./CareerTimeline";
import { SeasonComparison, SeasonComparisonPropsSchema } from "./SeasonComparison";
import { TeamLineup, TeamLineupPropsSchema } from "./TeamLineup";
import { ArticleHeadline, ArticleHeadlinePropsSchema } from "./ArticleHeadline";
import { HeroIntro, HeroIntroPropsSchema } from "./HeroIntro";
import { HeroOutro, HeroOutroPropsSchema } from "./HeroOutro";
import { HeroStatBars, HeroStatBarsPropsSchema } from "./HeroStatBars";
import { HeroFormRun, HeroFormRunPropsSchema } from "./HeroFormRun";
import { HeroTactical, HeroTacticalPropsSchema } from "./HeroTactical";
import { HeroTransferRecord, HeroTransferRecordPropsSchema } from "./HeroTransferRecord";
import { HeroTransferRecordVault, HeroTransferRecordVaultPropsSchema } from "./HeroTransferRecordVault";
import { HeroValueChart, HeroValueChartPropsSchema, calculateMetadata as heroValueChartCalc } from "./HeroValueChart";
import { HeroStatComparison, HeroStatComparisonPropsSchema, calculateMetadata as heroStatComparisonCalc } from "./HeroStatComparison";
import { HeroChapterWord, HeroChapterWordPropsSchema } from "./HeroChapterWord";
import { HeroClipCompare, HeroClipComparePropsSchema } from "./HeroClipCompare";
import { HeroClipSingle, HeroClipSinglePropsSchema } from "./HeroClipSingle";
import { AttackingRadar, AttackingRadarPropsSchema } from "./AttackingRadar";
import { PlayerTrio, PlayerTrioPropsSchema } from "./PlayerTrio";
import { HeroTravelMap, HeroTravelMapPropsSchema, HERO_TRAVEL_MAP_DURATION } from "./HeroTravelMap";
import { TimelineScroll, TimelineScrollPropsSchema } from "./TimelineScroll";
import { CountdownReveal, CountdownRevealPropsSchema, calculateMetadata as countdownCalculateMetadata } from "./CountdownReveal";
import { StatPulse, StatPulsePropsSchema } from "./StatPulse";
import { ScoutReport, ScoutReportPropsSchema } from "./ScoutReport";
import { ValueCurve, ValueCurvePropsSchema } from "./ValueCurve";
import { HeroTransferProfit, HeroTransferProfitPropsSchema, calculateMetadata as transferProfitV2CalculateMetadata } from "./HeroTransferProfit";
import { HeroPlayerRevealTrio, HeroPlayerRevealTrioPropsSchema, calculateMetadata as playerRevealTrioCalculateMetadata } from "./HeroPlayerRevealTrio";
import {
  VideoSequence,
  VideoSequencePropsSchema,
  calculateMetadata as videoSequenceCalculateMetadata,
} from "./VideoSequence";
import { Thumbnail, ThumbnailPropsSchema } from "./Thumbnail";
import { HeroShotMap, HeroShotMapPropsSchema } from "./HeroShotMap";
import { HeroBigStat, HeroBigStatPropsSchema } from "./HeroBigStat";
import { HeroComparisonRadar, HeroComparisonRadarPropsSchema } from "./HeroComparisonRadar";
import { HeroNewsFeed, HeroNewsFeedPropsSchema, calculateMetadata as calcNewsFeed } from "./HeroNewsFeed";
import { HeroSeasonTimeline, HeroSeasonTimelinePropsSchema } from "./HeroSeasonTimeline";
import { TournamentBracket, TournamentBracketPropsSchema } from "./TournamentBracket";
// Track E — register HeroQuote (was missing) + new hybrid templates

// Domain-agnostic compositions (Phase 10 — for non-football documentaries)
import { TimelineGeneric, TimelineGenericPropsSchema, calculateMetadata as timelineGenericCalc } from "./TimelineGeneric";
// Finance (paperOrange) variants + CreditsRoll
import { HeroIntroFinance, HeroIntroFinancePropsSchema } from "./HeroIntroFinance";
import { HeroOutroFinance, HeroOutroFinancePropsSchema } from "./HeroOutroFinance";
import { BulletBreakdownFinance, BulletBreakdownFinancePropsSchema } from "./BulletBreakdownFinance";
import { CreditsRoll, CreditsRollPropsSchema, calculateMetadata as creditsRollCalc } from "./CreditsRoll";
// ── Finance & Business documentary graphics package (finance/kit.tsx system) ──
import { ChapterCard, ChapterCardPropsSchema } from "./finance/ChapterCard";
import { DateStamp, DateStampPropsSchema } from "./finance/DateStamp";
import { PersonIntro, PersonIntroPropsSchema } from "./finance/PersonIntro";
import { LowerThirdCard, LowerThirdCardPropsSchema } from "./finance/LowerThirdCard";
import { MoneyFlow, MoneyFlowPropsSchema } from "./finance/MoneyFlow";
import { BalanceSheet, BalanceSheetPropsSchema } from "./finance/BalanceSheet";
import { CourtVerdict, CourtVerdictPropsSchema } from "./finance/CourtVerdict";
import { SocialPost, SocialPostPropsSchema } from "./finance/SocialPost";
import { MultiplierCard, MultiplierCardPropsSchema } from "./finance/MultiplierCard";
import { EntityCard, EntityCardPropsSchema } from "./finance/EntityCard";
import { FundingRounds, FundingRoundsPropsSchema } from "./finance/FundingRounds";
import { StakeCard, StakeCardPropsSchema } from "./finance/StakeCard";
import { DrawdownChart, DrawdownChartPropsSchema } from "./finance/DrawdownChart";
import { SystemDiagram, SystemDiagramPropsSchema } from "./finance/SystemDiagram";
import { ComparisonTable, ComparisonTablePropsSchema } from "./finance/ComparisonTable";
import { SentenceCard, SentenceCardPropsSchema } from "./finance/SentenceCard";
import { ThesisCard, ThesisCardPropsSchema } from "./finance/ThesisCard";
import { DocumentReveal, DocumentRevealPropsSchema } from "./finance/DocumentReveal";
import { TokenWeb, TokenWebPropsSchema } from "./finance/TokenWeb";
// Tier 3 + deferred Tier-2
import { OrgChart, OrgChartPropsSchema } from "./finance/OrgChart";
import { SankeyFlow, SankeyFlowPropsSchema } from "./finance/SankeyFlow";
import { MarketPanel, MarketPanelPropsSchema } from "./finance/MarketPanel";
import { AcquisitionTree, AcquisitionTreePropsSchema } from "./finance/AcquisitionTree";
import { PercentBreakdown, PercentBreakdownPropsSchema } from "./finance/PercentBreakdown";
import { DonutShare, DonutSharePropsSchema } from "./finance/DonutShare";
import { MetricGrid, MetricGridPropsSchema } from "./finance/MetricGrid";
import { ScaleCompare, ScaleComparePropsSchema } from "./finance/ScaleCompare";
import { SplitScreen, SplitScreenPropsSchema } from "./finance/SplitScreen";
import { CastGrid, CastGridPropsSchema } from "./finance/CastGrid";
import { EraBand, EraBandPropsSchema } from "./finance/EraBand";
import { LegalTimeline, LegalTimelinePropsSchema } from "./finance/LegalTimeline";
// ── video-shotcraft ports (2026-07-23) — motion-design techniques ported from
// the Vincentwei1021/video-shotcraft template pack, reskinned onto lib/kit.tsx ──
import { AxisRescaleShock, AxisRescaleShockPropsSchema } from "./AxisRescaleShock";
import { UnitDotSwarmRegroup, UnitDotSwarmRegroupPropsSchema } from "./UnitDotSwarmRegroup";
import { OscilloscopeStream, OscilloscopeStreamPropsSchema } from "./OscilloscopeStream";
import { TimelineTravel, TimelineTravelPropsSchema } from "./TimelineTravel";
import { GrazeFaceTour, GrazeFaceTourPropsSchema } from "./GrazeFaceTour";
import { ChangelogScrollBrake, ChangelogScrollBrakePropsSchema } from "./ChangelogScrollBrake";
import { OdometerDigitRoll, OdometerDigitRollPropsSchema } from "./OdometerDigitRoll";
import { ParticleSandFill, ParticleSandFillPropsSchema } from "./ParticleSandFill";
import { PillSlotCycle, PillSlotCyclePropsSchema } from "./PillSlotCycle";
import { ListStackPress, ListStackPressPropsSchema } from "./ListStackPress";
import { SpeedRampReveal, SpeedRampRevealPropsSchema } from "./SpeedRampReveal";
import { FreezeAnnotate, FreezeAnnotatePropsSchema } from "./FreezeAnnotate";
import { BarRowsAxis, BarRowsAxisPropsSchema } from "./BarRowsAxis";
import { RingStatReveal, RingStatRevealPropsSchema } from "./RingStatReveal";
import { LineTrendChart, LineTrendChartPropsSchema } from "./LineTrendChart";
import { PieShareChart, PieShareChartPropsSchema } from "./PieShareChart";
import { GaugeShareArc, GaugeShareArcPropsSchema } from "./GaugeShareArc";
import { BarColumnsChart, BarColumnsChartPropsSchema } from "./BarColumnsChart";
import { TextColumnConverge, TextColumnConvergePropsSchema } from "./TextColumnConverge";
import { TitleDemoteToLabel, TitleDemoteToLabelPropsSchema } from "./TitleDemoteToLabel";
import { VoiceWaveformLive, VoiceWaveformLivePropsSchema } from "./VoiceWaveformLive";

import type { CareerTimelineProps } from "./CareerTimeline";
import type { HeroTransferRecordProps } from "./HeroTransferRecord";

const DEFAULT_TIMELINE: CareerTimelineProps = {
  playerName: "Luis Suárez",
  activeIndex: 3,
  startFrame: 90,
  skipIntro: false,
  accentColor: "#C8102E",
  bgColor: "#f0ece4",
  darkMode: false,
  subjectImage: "",
  source: "stats · transfermarkt",
  dateline: "CAREER · 2005–2022",
  events: [
    { year: "2005–06", club: "Nacional",  badgeSlug: "premier-league.svg", clubColor: "#003580", detail: "12 goals",              isHighlight: false },
    { year: "2006–07", club: "Groningen", badgeSlug: "premier-league.svg", clubColor: "#007D33", detail: "15 goals",              isHighlight: false },
    { year: "2007–11", club: "Ajax",      badgeSlug: "premier-league.svg", clubColor: "#D2122E", detail: "111 goals",             isHighlight: false },
    { year: "2011–14", club: "Liverpool", badgeSlug: "liverpool.svg",      clubColor: "#C8102E", detail: "82 goals",              isHighlight: true  },
    { year: "2014–20", club: "Barcelona", badgeSlug: "barcelona.svg",      clubColor: "#004D98", detail: "198 goals",             isHighlight: false },
    { year: "2020–22", club: "Atlético",  badgeSlug: "atletico-madrid.svg", clubColor: "#CB3524", detail: "34 goals",              isHighlight: false },
  ],
};

const DEFAULT_HERO_TRANSFER_RECORD: HeroTransferRecordProps = {
  title: "Sam Bankman Fried's Investments",
  titleSize: 74,
  subtitle: "the escalation of the market over the years",
  sideImage: "sbf.png",
  // No bgColor / accentColor / per-row accentColor → colours come from the active
  // PALETTE (shared.tsx). Add any of them back to override per-render.
  transfers: [
    { year: "2017", player: "Solana",           fromClub: "", toClub: "", fee: "£46.5b", feeValue: 46.5, highlight: false },
    { year: "2020", player: "Anthropic",         fromClub: "", toClub: "", fee: "£80b",   feeValue: 80,   highlight: false },
    { year: "2013", player: "SpaceX",            fromClub: "", toClub: "", fee: "£85b",   feeValue: 85,   highlight: false },
    { year: "2016", player: "OpenAI",            fromClub: "", toClub: "", fee: "£123b",  feeValue: 123,  highlight: false },
    { year: "2017", player: "Alameda Research",  fromClub: "", toClub: "", fee: "£198b",  feeValue: 198,  highlight: true  },
    { year: "2023", player: "Eskens",            fromClub: "", toClub: "", fee: "£107b",  feeValue: 107,  highlight: false },
  ],
  skipIntro: false,
};

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="HeroIntro"
        component={HeroIntro}
        schema={HeroIntroPropsSchema}
        durationInFrames={240}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          subtitle: "the greatest league season ever told",
          bgColor: "#f0ece4",
          sideImage: "",
          sideImageX: 0,
          sideImageY: 0,
          sideImageScale: 1,
          skipIntro: false,
        }}
      />
      <Composition
        id="HeroOutro"
        component={HeroOutro}
        schema={HeroOutroPropsSchema}
        durationInFrames={240}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          leadIn:          "If this story stayed with you, there's more where it came from.",
          subscribeAsk:    "Subscribe for a new story every week.",
          videoLeftTitle:  "The Genius & Madness of Luis Suárez",
          videoRightTitle: "Why Brazil Stopped Producing Playmakers",
          videoLeftSrc:    "",
          videoRightSrc:   "",
          videoLeftImage:  "",
          videoRightImage: "",
          bgColor:         "#f0ece4",
          accentColor:     "#0a0a0a",
          skipIntro:       false,
        }}
      />
      <Composition
        id="HeroStatBars"
        component={HeroStatBars}
        schema={HeroStatBarsPropsSchema}
        durationInFrames={270}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          title: "head to head",
          subtitle: "Liverpool vs Arsenal",
          teamA: { name: "Liverpool", color: "#C8102E" },
          teamB: { name: "Arsenal", color: "#EF0107" },
          stats: [
            { label: "Possession", valueA: 58, valueB: 42, maxValue: 100, suffix: "%" },
            { label: "Shots", valueA: 14, valueB: 9, suffix: "" },
          ],
          bgColor: "#f0ece4",
          sideImage: "",
          skipIntro: false,
        }}
      />
      <Composition
        id="HeroFormRun"
        component={HeroFormRun}
        schema={HeroFormRunPropsSchema}
        durationInFrames={270}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          teamName: "Liverpool",
          teamColor: "#C8102E",
          label: "last 10 matches",
          results: [
            { result: "W", opponent: "Arsenal", score: "4-0" }
          ],
          bgColor: "#f0ece4",
          sideImage: "",
          darkMode: false,
          skipIntro: false,
        }}
      />
      <Composition
        id="HeroTactical"
        component={HeroTactical}
        schema={HeroTacticalPropsSchema}
        durationInFrames={420}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          title: "the press",
          description: "Coordinated high press from the front three traps the build-up at source, forcing turnovers in the final third.",
          dateline: "",
          source: "",
          players: [
            // Resting (4-3-3) → press (front three squeeze, midfield steps up)
            { label: "GK", x: 50, y: 88 },
            { label: "RB", x: 80, y: 72 },
            { label: "CB", x: 62, y: 72 },
            { label: "CB", x: 38, y: 72 },
            { label: "LB", x: 20, y: 72 },
            { label: "CM", x: 65, y: 55, pressX: 60, pressY: 48 },
            { label: "DM", x: 50, y: 58, pressX: 50, pressY: 50 },
            { label: "CM", x: 35, y: 55, pressX: 40, pressY: 48 },
            { label: "RW", x: 78, y: 36, pressX: 76, pressY: 28 },
            { label: "ST", x: 50, y: 30, pressX: 56, pressY: 26 },
            { label: "LW", x: 22, y: 36, pressX: 24, pressY: 28 },
          ],
          oppositionPlayers: [
            { label: "GK", x: 50, y: 10 },
            { label: "RB", x: 78, y: 22 },
            { label: "CB", x: 60, y: 22 },
            { label: "CB", x: 40, y: 22 },
            { label: "LB", x: 22, y: 22 },
            { label: "DM", x: 55, y: 40 },
            { label: "DM", x: 45, y: 40 },
            { label: "RW", x: 72, y: 58 },
            { label: "AM", x: 50, y: 58 },
            { label: "LW", x: 28, y: 58 },
            { label: "ST", x: 50, y: 72 },
          ],
          arrows: [
            { fromX: 78, fromY: 36, toX: 0, toY: 0, targetIndex: 1, style: "solid" }, // RW → opp RB
            { fromX: 50, fromY: 30, toX: 0, toY: 0, targetIndex: 2, style: "solid" }, // ST → opp CB
            { fromX: 22, fromY: 36, toX: 0, toY: 0, targetIndex: 4, style: "solid" }, // LW → opp LB
          ],
          teamColor: "#C8102E",
          oppositionColor: "#1F4E8C",
          accentColor: "#C8102E",
          textColor: "#f5f0e8",
          bgColor: "#141414",
          playerImage: "",
          skipIntro: false,
        }}
      />
      <Composition
        id="HeroTransferRecord"
        component={HeroTransferRecord}
        schema={HeroTransferRecordPropsSchema}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={DEFAULT_HERO_TRANSFER_RECORD}
      />
      <Composition
        id="HeroTransferRecordVault"
        component={HeroTransferRecordVault}
        schema={HeroTransferRecordVaultPropsSchema}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={DEFAULT_HERO_TRANSFER_RECORD}
      />
      <Composition
        id="HeroValueChart"
        component={HeroValueChart}
        schema={HeroValueChartPropsSchema}
        calculateMetadata={heroValueChartCalc}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          title: "The Solana Bet",
          subtitle: "SOL price per coin",
          source: "Source: CoinGecko · Alameda entry price per company filings",
          unit: "$",
          logScale: true,
          points: [
            { label: "2020",     value: 0.10 },
            { label: "",         value: 0.9 },
            { label: "2021",     value: 2.5 },
            { label: "",         value: 35 },
            { label: "Sep '21",  value: 190 },
            { label: "Nov '21",  value: 260 },
            { label: "2022",     value: 95 },
            { label: "",         value: 38 },
            { label: "Nov '22",  value: 13 },
          ],
          events: [
            { index: 0, title: "Alameda enters", sub: "~$0.10 · early 2020" },
            { index: 5, title: "Peak",           sub: "$260 · Nov 2021" },
            { index: 8, title: "FTX collapse",   sub: "$13 · Nov 2022" },
          ],
        }}
      />
      {/* ── Finance (paperOrange) variants + CreditsRoll ─────────────── */}
      <Composition
        id="HeroIntroFinance"
        component={HeroIntroFinance}
        schema={HeroIntroFinancePropsSchema}
        durationInFrames={240}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          subtitle: "the science of football",
          bgColor: "#0A4AA0",
          sideImageX: 72,
          sideImageY: 100,
          sideImageScale: 1,
          skipIntro: false,
        }}
      />
      <Composition
        id="HeroOutroFinance"
        component={HeroOutroFinance}
        schema={HeroOutroFinancePropsSchema}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          leadIn: "If this story stayed with you, there's more where it came from.",
          subscribeAsk: "Subscribe for a new story every week.",
          videoLeftTitle: "Watch next",
          videoRightTitle: "Or this one",
          videoLeftSrc: "",
          videoRightSrc: "",
          videoLeftImage: "",
          videoRightImage: "",
          bgColor: "#F7F4EE",
          accentColor: "#E8623A",
          skipIntro: false,
        }}
      />
      <Composition
        id="BulletBreakdownFinance"
        component={BulletBreakdownFinance}
        schema={BulletBreakdownFinancePropsSchema}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          title: "The case against",
          subtitle: "",
          points: [
            { heading: "Unlimited risk appetite", detail: "A normal fund protects the downside. Alameda had billions it never had to answer for." },
            { heading: "Survivorship bias", detail: "We remember Solana and Anthropic. We forget the dead tokens and bad bets." },
            { heading: "Paper vs realised", detail: "A valuation is not a cheque. Most of it could never be cashed." },
          ],
          accent: "",
          palette: "ink" as const,
        }}
      />
      <Composition
        id="CreditsRoll"
        component={CreditsRoll}
        schema={CreditsRollPropsSchema}
        calculateMetadata={creditsRollCalc}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          title: "Sources & Credits",
          subtitle: "",
          sections: [
            { heading: "Footage", items: ["Getty Images — archival", "AP Archive — news footage", "Bloomberg Television — broadcast"] },
            { heading: "Data", items: ["FBref", "CoinGecko", "Company filings — SEC EDGAR"] },
            { heading: "Music", items: ["Epidemic Sound — licensed score", "Artlist — additional cues"] },
          ],
          footer: "Friction — thanks for watching",
          skipIntro: false,
        }}
      />
      {/* ── Finance & Business documentary graphics package ──────────────
          20 reusable templates composed from finance/kit.tsx (grounds,
          typography, spacing, shadows, motion helpers, shared primitives).
          All 1920×1080 @ 30fps; every prop is optional (Zod defaults). */}
      <Composition id="ChapterCard" component={ChapterCard} schema={ChapterCardPropsSchema} durationInFrames={80} fps={30} width={1920} height={1080} defaultProps={ChapterCardPropsSchema.parse({})} />
      <Composition id="DateStamp" component={DateStamp} schema={DateStampPropsSchema} durationInFrames={95} fps={30} width={1920} height={1080} defaultProps={DateStampPropsSchema.parse({})} />
      <Composition id="PersonIntro" component={PersonIntro} schema={PersonIntroPropsSchema} durationInFrames={130} fps={30} width={1920} height={1080} defaultProps={PersonIntroPropsSchema.parse({})} />
      <Composition id="LowerThirdCard" component={LowerThirdCard} schema={LowerThirdCardPropsSchema} durationInFrames={150} fps={30} width={1920} height={1080} defaultProps={LowerThirdCardPropsSchema.parse({})} />
      <Composition id="MoneyFlow" component={MoneyFlow} schema={MoneyFlowPropsSchema} durationInFrames={210} fps={30} width={1920} height={1080} defaultProps={MoneyFlowPropsSchema.parse({})} />
      <Composition id="BalanceSheet" component={BalanceSheet} schema={BalanceSheetPropsSchema} durationInFrames={235} fps={30} width={1920} height={1080} defaultProps={BalanceSheetPropsSchema.parse({})} />
      <Composition id="CourtVerdict" component={CourtVerdict} schema={CourtVerdictPropsSchema} durationInFrames={225} fps={30} width={1920} height={1080} defaultProps={CourtVerdictPropsSchema.parse({})} />
      <Composition id="SocialPost" component={SocialPost} schema={SocialPostPropsSchema} durationInFrames={155} fps={30} width={1920} height={1080} defaultProps={SocialPostPropsSchema.parse({})} />
      <Composition id="MultiplierCard" component={MultiplierCard} schema={MultiplierCardPropsSchema} durationInFrames={155} fps={30} width={1920} height={1080} defaultProps={MultiplierCardPropsSchema.parse({})} />
      <Composition id="EntityCard" component={EntityCard} schema={EntityCardPropsSchema} durationInFrames={150} fps={30} width={1920} height={1080} defaultProps={EntityCardPropsSchema.parse({})} />
      <Composition id="FundingRounds" component={FundingRounds} schema={FundingRoundsPropsSchema} durationInFrames={170} fps={30} width={1920} height={1080} defaultProps={FundingRoundsPropsSchema.parse({})} />
      <Composition id="StakeCard" component={StakeCard} schema={StakeCardPropsSchema} durationInFrames={155} fps={30} width={1920} height={1080} defaultProps={StakeCardPropsSchema.parse({})} />
      <Composition id="DrawdownChart" component={DrawdownChart} schema={DrawdownChartPropsSchema} durationInFrames={195} fps={30} width={1920} height={1080} defaultProps={DrawdownChartPropsSchema.parse({})} />
      <Composition id="SystemDiagram" component={SystemDiagram} schema={SystemDiagramPropsSchema} durationInFrames={220} fps={30} width={1920} height={1080} defaultProps={SystemDiagramPropsSchema.parse({})} />
      <Composition id="ComparisonTable" component={ComparisonTable} schema={ComparisonTablePropsSchema} durationInFrames={170} fps={30} width={1920} height={1080} defaultProps={ComparisonTablePropsSchema.parse({})} />
      <Composition id="SentenceCard" component={SentenceCard} schema={SentenceCardPropsSchema} durationInFrames={110} fps={30} width={1920} height={1080} defaultProps={SentenceCardPropsSchema.parse({})} />
      <Composition id="ThesisCard" component={ThesisCard} schema={ThesisCardPropsSchema} durationInFrames={180} fps={30} width={1920} height={1080} defaultProps={ThesisCardPropsSchema.parse({})} />
      <Composition id="DocumentReveal" component={DocumentReveal} schema={DocumentRevealPropsSchema} durationInFrames={175} fps={30} width={1920} height={1080} defaultProps={DocumentRevealPropsSchema.parse({})} />
      <Composition id="TokenWeb" component={TokenWeb} schema={TokenWebPropsSchema} durationInFrames={170} fps={30} width={1920} height={1080} defaultProps={TokenWebPropsSchema.parse({})} />
      {/* ── Tier 3 + deferred Tier-2 ─────────────────────────────────── */}
      <Composition id="OrgChart" component={OrgChart} schema={OrgChartPropsSchema} durationInFrames={185} fps={30} width={1920} height={1080} defaultProps={OrgChartPropsSchema.parse({})} />
      <Composition id="SankeyFlow" component={SankeyFlow} schema={SankeyFlowPropsSchema} durationInFrames={200} fps={30} width={1920} height={1080} defaultProps={SankeyFlowPropsSchema.parse({})} />
      <Composition id="MarketPanel" component={MarketPanel} schema={MarketPanelPropsSchema} durationInFrames={175} fps={30} width={1920} height={1080} defaultProps={MarketPanelPropsSchema.parse({})} />
      <Composition id="AcquisitionTree" component={AcquisitionTree} schema={AcquisitionTreePropsSchema} durationInFrames={185} fps={30} width={1920} height={1080} defaultProps={AcquisitionTreePropsSchema.parse({})} />
      <Composition id="PercentBreakdown" component={PercentBreakdown} schema={PercentBreakdownPropsSchema} durationInFrames={180} fps={30} width={1920} height={1080} defaultProps={PercentBreakdownPropsSchema.parse({})} />
      <Composition id="DonutShare" component={DonutShare} schema={DonutSharePropsSchema} durationInFrames={180} fps={30} width={1920} height={1080} defaultProps={DonutSharePropsSchema.parse({})} />
      <Composition id="MetricGrid" component={MetricGrid} schema={MetricGridPropsSchema} durationInFrames={160} fps={30} width={1920} height={1080} defaultProps={MetricGridPropsSchema.parse({})} />
      <Composition id="ScaleCompare" component={ScaleCompare} schema={ScaleComparePropsSchema} durationInFrames={195} fps={30} width={1920} height={1080} defaultProps={ScaleComparePropsSchema.parse({})} />
      <Composition id="SplitScreen" component={SplitScreen} schema={SplitScreenPropsSchema} durationInFrames={165} fps={30} width={1920} height={1080} defaultProps={SplitScreenPropsSchema.parse({})} />
      <Composition id="CastGrid" component={CastGrid} schema={CastGridPropsSchema} durationInFrames={165} fps={30} width={1920} height={1080} defaultProps={CastGridPropsSchema.parse({})} />
      <Composition id="EraBand" component={EraBand} schema={EraBandPropsSchema} durationInFrames={165} fps={30} width={1920} height={1080} defaultProps={EraBandPropsSchema.parse({})} />
      <Composition id="LegalTimeline" component={LegalTimeline} schema={LegalTimelinePropsSchema} durationInFrames={175} fps={30} width={1920} height={1080} defaultProps={LegalTimelinePropsSchema.parse({})} />

      <Composition
        id="HeroStatComparison"
        component={HeroStatComparison}
        schema={HeroStatComparisonPropsSchema}
        calculateMetadata={heroStatComparisonCalc}
        durationInFrames={170}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          title: "The Anthropic Bet",
          subtitle: "FTX / Alameda investment vs. estate sale",
          left:  { label: "Invested · 2022", value: 500_000_000,  prefix: "$", suffix: "", context: "FTX/Alameda into Anthropic, pre-AI boom" },
          right: { label: "Estate sale · 2024", value: 1_300_000_000, prefix: "$", suffix: "", context: "Bankruptcy estate sold the stake" },
          highlight: "right",
        }}
      />
      <Composition
        id="HeroChapterWord"
        component={HeroChapterWord}
        schema={HeroChapterWordPropsSchema}
        durationInFrames={180}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          word: "aesthetics.",
          chapterLabel: "",
          player1Image: "suarez.jpg",
          player2Image: "aguero.png",
          blob1Color: "#7C5CBF",
          blob2Color: "#D94F4F",
          bgColor: "#f0ece4",
          skipIntro: false,
        }}
      />
      <Composition
        id="HeroClipCompare"
        component={HeroClipCompare}
        schema={HeroClipComparePropsSchema}
        durationInFrames={210}
        fps={30}
        width={1920}
        height={1080}
        calculateMetadata={({props}) => ({
          durationInFrames: (props as any).durationInFrames ?? 210,
        })}
        defaultProps={{
          labelLeft:  "First Touch",
          labelRight: "Final Ball",
          clipLeft:   "",
          clipRight:  "",
          title:      "",
          bgColor:    "#f0ece4",
          domain:     "generic",
          skipIntro:  false,
        }}
      />
      <Composition
        id="HeroClipSingle"
        component={HeroClipSingle}
        schema={HeroClipSinglePropsSchema}
        durationInFrames={270}
        fps={30}
        width={1920}
        height={1080}
        calculateMetadata={({props}) => ({
          durationInFrames: (props as any).durationInFrames ?? 270,
        })}
        defaultProps={{
          label:   "",
          clip:    "",
          title:   "",
          bgColor: "#f0ece4",
          soundOn: false,
          playerImage: "",
          skipIntro: false,
          archivalTreatment: false,
          boxed: false,
        }}
      />
      <Composition
        id="AttackingRadar"
        component={AttackingRadar}
        schema={AttackingRadarPropsSchema}
        durationInFrames={540}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          entityName:     "Florian Wirtz",
          competition:    "Premier League",
          season:         "2025/2026",
          matchType:      "All Matches",
          nineties:       26,
          accentColor:    "#D4001A",
          bgColor:        "#f0ece4",
          lightMode:      true,
          introFrames:    40,
          revealInterval: 50,
          metrics: [
            { label: "Non-Penalty\nGoals",     value: 0.42, percentile: 86, unit: "", highlight: true  },
            { label: "Expected\nGoals (xG)",   value: 0.38, percentile: 89, unit: "", highlight: true  },
            { label: "Expected\nAssists (xA)", value: 0.41, percentile: 94, unit: "", highlight: true  },
            { label: "Shot-Creating\nActions", value: 6.2,  percentile: 96, unit: "", highlight: true  },
            { label: "Key Passes",             value: 3.4,  percentile: 93, unit: "", highlight: true  },
            { label: "Dribbles\nCompleted",    value: 3.8,  percentile: 88, unit: "", highlight: false },
            { label: "Progressive\nCarries",   value: 7.9,  percentile: 91, unit: "", highlight: false },
            { label: "Progressive\nPasses",    value: 6.8,  percentile: 82, unit: "", highlight: false },
            { label: "Touches in\nPenalty Box",value: 7.1,  percentile: 85, unit: "", highlight: false },
          ],
          sideImage: "",
          skipIntro: false,
        }}
      />
      <Composition
        id="PlayerTrio"
        component={PlayerTrio}
        schema={PlayerTrioPropsSchema}
        durationInFrames={270}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          title:    "the contenders",
          subtitle: "2013–14 Premier League Golden Boot race",
          bgColor:  "#f0ece4",
          skipIntro: false,
          players: [
            {
              name:      "Sergio Agüero",
              image:     "aguero.jpg",
              club:      "Manchester City",
              clubColor: "#6CABDD",
              badgeSlug: "manchester-city.svg",
              stat:      "17",
              statLabel: "goals",
            },
            {
              name:      "Wayne Rooney",
              image:     "rooney.jpg",
              club:      "Manchester United",
              clubColor: "#DA291C",
              badgeSlug: "manchester-united.svg",
              stat:      "17",
              statLabel: "goals",
            },
            {
              name:      "Luis Suárez",
              image:     "suarez.jpg",
              club:      "Liverpool",
              clubColor: "#C8102E",
              badgeSlug: "liverpool.svg",
              stat:      "31",
              statLabel: "goals",
            },
          ],
        }}
      />
      <Composition
        id="CareerTimeline"
        component={CareerTimeline}
        schema={CareerTimelinePropsSchema}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={DEFAULT_TIMELINE}
      />
      <Composition
        id="PremierLeagueTable"
        component={PremierLeagueTable}
        schema={TablePropsSchema}
        durationInFrames={270}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          season: "2013–14",
          bgColor: "#f0ece4",
          teams: [
            { pos: 1, name: "Manchester City",    badgeSlug: "manchester-city.svg",    color: "#6CABDD", p: 38, w: 27, d: 5,  l: 6,  gd: 65,  pts: 86 },
            { pos: 2, name: "Liverpool",           badgeSlug: "liverpool.svg",          color: "#C8102E", p: 38, w: 26, d: 6,  l: 6,  gd: 51,  pts: 84 },
            { pos: 3, name: "Chelsea",             badgeSlug: "chelsea.svg",            color: "#034694", p: 38, w: 25, d: 7,  l: 6,  gd: 45,  pts: 82 },
            { pos: 4, name: "Arsenal",             badgeSlug: "arsenal.svg",            color: "#EF0107", p: 38, w: 24, d: 7,  l: 7,  gd: 27,  pts: 79 },
            { pos: 5, name: "Everton",             badgeSlug: "everton.svg",            color: "#003399", p: 38, w: 21, d: 9,  l: 8,  gd: 28,  pts: 72 },
            { pos: 6, name: "Tottenham Hotspur",   badgeSlug: "tottenham.png",          color: "#132257", p: 38, w: 21, d: 6,  l: 11, gd: 17,  pts: 69 },
          ],
          skipIntro: false,
        }}
      />
      <Composition
        id="TopScorersTable"
        component={TopScorersTable}
        schema={TopScorersPropsSchema}
        durationInFrames={270}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          season: "2013–14",
          competition: "Premier League",
          statLabel: "Goals",
          statKey: "goals",
          bgColor: "#f0ece4",
          skipIntro: false,
          players: [
            { pos: 1, name: "Luis Suárez",       club: "Liverpool",         badgeSlug: "liverpool.svg",       clubColor: "#C8102E", goals: 31, assists: 12, apps: 33 },
            { pos: 2, name: "Daniel Sturridge",   club: "Liverpool",         badgeSlug: "liverpool.svg",       clubColor: "#C8102E", goals: 21, assists: 5,  apps: 29 },
            { pos: 3, name: "Yaya Touré",          club: "Manchester City",   badgeSlug: "manchester-city.svg", clubColor: "#6CABDD", goals: 20, assists: 6,  apps: 35 },
            { pos: 4, name: "Wayne Rooney",        club: "Manchester United", badgeSlug: "manchester-united.svg",clubColor: "#DA291C",goals: 17, assists: 10, apps: 29 },
            { pos: 5, name: "Frank Lampard",       club: "Chelsea",           badgeSlug: "chelsea.svg",         clubColor: "#034694", goals: 17, assists: 4,  apps: 35 },
            { pos: 6, name: "Olivier Giroud",      club: "Arsenal",           badgeSlug: "arsenal.svg",         clubColor: "#EF0107", goals: 16, assists: 9,  apps: 36 },
          ]
        }}
      />
      <Composition
        id="PlayerStats"
        component={PlayerStats}
        schema={PlayerStatsPropsSchema}
        durationInFrames={270}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          playerName:      "Luis Suárez",
          club:            "Liverpool",
          season:          "2013–14",
          competition:     "Premier League",
          badgeSlug:       "liverpool.svg",
          clubColor:       "#C8102E",
          playerImageSlug: "luis.png",
          bgColor:         "#f0ece4",
          stats: [
            { label: "Goals",       value: 31, sub: "in 33 appearances" },
            { label: "Assists",     value: 12, sub: "" },
            { label: "Apps",        value: 33, sub: "" },
            { label: "Mins / Goal", value: 90, sub: "" },
          ],
          skipIntro: false,
        }}
      />
      <Composition
        id="MatchResult"
        component={MatchResult}
        schema={MatchResultPropsSchema}
        durationInFrames={240}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          homeTeam:      "Liverpool",
          awayTeam:      "Arsenal",
          homeBadgeSlug: "liverpool.svg",
          awayBadgeSlug: "arsenal.svg",
          homeColor:     "#C8102E",
          awayColor:     "#EF0107",
          homeScore:     5,
          awayScore:     1,
          competition:   "Premier League",
          date:          "09 Feb 2014",
          venue:         "Anfield",
          bgColor:       "#f0ece4",
          scorers: [
            { name: "Skrtel",   minute: "6",  team: "home" },
            { name: "Sturridge",minute: "17", team: "home" },
            { name: "Suárez",   minute: "31", team: "home" },
            { name: "Suárez",   minute: "37", team: "home" },
            { name: "Suárez",   minute: "43", team: "home" },
            { name: "Giroud",   minute: "9",  team: "away" },
          ],
          playerImage: "",
          skipIntro: false,
        }}
      />
      <Composition
        id="SeasonComparison"
        component={SeasonComparison}
        schema={SeasonComparisonPropsSchema}
        durationInFrames={270}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          playerA: { name: "Luis Suarez",  club: "Barcelona", badgeSlug: "barcelona.svg", image: "players/suarez.png",  color: "#A50044" },
          playerB: { name: "Lionel Messi", club: "Barcelona", badgeSlug: "barcelona.svg", image: "players/messi.png",   color: "#004D98" },
          season:      "2015/16",
          competition: "La Liga",
          bgColor:     "#f0ece4",
          stats: [
            { label: "Goals",         valueA: 40, valueB: 26 },
            { label: "Assists",       valueA: 16, valueB: 18 },
            { label: "Key Passes",    valueA: 54, valueB: 62 },
            { label: "Shots",         valueA: 148, valueB: 115 },
            { label: "Dribbles",      valueA: 38, valueB: 97 },
          ],
          skipIntro: false,
        }}
      />
      <Composition
        id="TeamLineup"
        component={TeamLineup}
        schema={TeamLineupPropsSchema}
        durationInFrames={270}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          teamName:   "Liverpool",
          formation:  "4-3-3",
          badgeSlug:  "liverpool.svg",
          teamColor:  "#C8102E",
          opposition: "Arsenal",
          date:       "09 Feb 2014",
          bgColor:    "#f0ece4",
          managerName:        "Brendan Rodgers",
          managerTitle:       "Manager",
          managerNationality: "Northern Irish",
          infoAppearFrame: 0,
          players: [
            { name: "Mignolet",  number: 22, x: 50, y: 8,  positionLabel: "GK", isCaptain: false, appearFrame: 20  },
            { name: "Johnson",   number: 2,  x: 82, y: 24, positionLabel: "RB", isCaptain: false, appearFrame: 50  },
            { name: "Skrtel",    number: 37, x: 62, y: 24, positionLabel: "CB", isCaptain: false, appearFrame: 65  },
            { name: "Agger",     number: 5,  x: 38, y: 24, positionLabel: "CB", isCaptain: false, appearFrame: 80  },
            { name: "Flanagan",  number: 38, x: 18, y: 24, positionLabel: "LB", isCaptain: false, appearFrame: 95  },
            { name: "Gerrard",   number: 8,  x: 50, y: 48, positionLabel: "DM", isCaptain: true,  appearFrame: 120 },
            { name: "Henderson", number: 14, x: 68, y: 58, positionLabel: "CM", isCaptain: false, appearFrame: 140 },
            { name: "Coutinho",  number: 10, x: 32, y: 58, positionLabel: "CM", isCaptain: false, appearFrame: 155 },
            { name: "Sturridge", number: 15, x: 75, y: 76, positionLabel: "RW", isCaptain: false, appearFrame: 185 },
            { name: "Suárez",    number: 7,  x: 50, y: 82, positionLabel: "ST", isCaptain: false, appearFrame: 200 },
            { name: "Sterling",  number: 31, x: 25, y: 76, positionLabel: "LW", isCaptain: false, appearFrame: 215 },
          ],
          managerImageSlug: "",
          skipIntro: false,
        }}
      />
      <Composition
        id="ArticleHeadline"
        component={ArticleHeadline}
        schema={ArticleHeadlinePropsSchema}
        durationInFrames={240}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          headline:       "The man who almost won the league on his own",
          category:       "Analysis",
          byline:         "Luis Suárez · 2013–14",
          highlightColor: "#f5d020",
          bgColor:        "#f0ece4",
          publication:    "",
          author:         "",
          date:           "",
          edition:        "",
          lede:           "",
          imageSrc:       "",
          imageCaption:   "",
          accentColor:    "#C8102E",
          skipIntro:      false,
        }}
      />

      <Composition
        id="HeroTravelMap"
        component={HeroTravelMap}
        schema={HeroTravelMapPropsSchema}
        durationInFrames={HERO_TRAVEL_MAP_DURATION}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={HeroTravelMapPropsSchema.parse({})}
      />
      <Composition
        id="TimelineScroll"
        component={TimelineScroll}
        schema={TimelineScrollPropsSchema}
        durationInFrames={830}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          title:       "The Premier League Era",
          subtitle:    "How English football was transformed",
          dwellFrames: 120,
          accentColor: "#3D0099",
          bgColor:     "#f0ece4",
          darkMode:    false,
          events: [
            { year: "1992", title: "Premier League founded",    description: "22 clubs breakaway from the Football League.",         highlight: true,  color: "#3D0099" },
            { year: "1995", title: "Bosman ruling",             description: "Freedom of movement transforms the transfer market.",  highlight: false, color: "#3D0099" },
            { year: "2003", title: "Roman Abramovich",          description: "Chelsea's transformation begins.",                     highlight: false, color: "#3D0099" },
            { year: "2012", title: "Financial Fair Play",       description: "UEFA introduces new spending regulations.",           highlight: false, color: "#3D0099" },
            { year: "2017", title: "£5bn TV deal",              description: "Record broadcast rights reshape the game.",           highlight: true,  color: "#3D0099" },
          ],
          skipIntro: false,
        }}
      />

      <Composition
        id="CountdownReveal"
        component={CountdownReveal}
        schema={CountdownRevealPropsSchema}
        calculateMetadata={countdownCalculateMetadata}
        durationInFrames={1200}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          title:       "The Top 10",
          subtitle:    "Premier League goals in a single season",
          dwellFrames: 90,
          accentColor: "#C8102E",
          bgColor:     "#f0ece4",
          darkMode:    false,
          items: [
            { name: "Alan Shearer",      detail: "1994/95 · Blackburn",      value: "34 goals", color: "#C8102E" },
            { name: "Andrew Cole",       detail: "1993/94 · Newcastle",      value: "34 goals", color: "#C8102E" },
            { name: "Erling Haaland",    detail: "2022/23 · Man City",       value: "36 goals", color: "#C8102E" },
            { name: "Mohamed Salah",     detail: "2017/18 · Liverpool",      value: "32 goals", color: "#C8102E" },
            { name: "Luis Suárez",       detail: "2013/14 · Liverpool",      value: "31 goals", color: "#C8102E" },
            { name: "Cristiano Ronaldo", detail: "2007/08 · Man Utd",        value: "31 goals", color: "#C8102E" },
            { name: "Alan Shearer",      detail: "1995/96 · Newcastle",      value: "31 goals", color: "#C8102E" },
            { name: "Kevin Phillips",    detail: "1999/00 · Sunderland",     value: "30 goals", color: "#C8102E" },
            { name: "Harry Kane",        detail: "2016/17 · Spurs",          value: "29 goals", color: "#C8102E" },
            { name: "Thierry Henry",     detail: "2004/05 · Arsenal",        value: "25 goals", color: "#C8102E" },
          ],
          teamColor: "#C8102E",
          skipIntro: false,
        }}
      />
      <Composition
        id="StatPulse"
        component={StatPulse}
        schema={StatPulsePropsSchema}
        durationInFrames={600}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          title:       "Goals Per Season",
          subtitle:    "Luis Suárez · career trajectory",
          unit:        "goals",
          accentColor: "#C8102E",
          bgColor:     "#f0ece4",
          darkMode:    false,
          showArea:    true,
          dwellFrames: 55,
          dataPoints: [
            { label: "07/08", value: 23, annotation: "" },
            { label: "08/09", value: 28, annotation: "" },
            { label: "09/10", value: 35, annotation: "Ajax peak" },
            { label: "10/11", value: 49, annotation: "" },
            { label: "11/12", value: 17, annotation: "" },
            { label: "12/13", value: 23, annotation: "" },
            { label: "13/14", value: 31, annotation: "Golden Boot" },
            { label: "14/15", value: 25, annotation: "" },
            { label: "15/16", value: 59, annotation: "All-time record" },
            { label: "16/17", value: 37, annotation: "" },
          ],
          skipIntro: false,
        }}
      />

      {/* ── Brentford / Transfer Model Components ───────────────────────────── */}
      <Composition
        id="ScoutReport"
        component={ScoutReport}
        schema={ScoutReportPropsSchema}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          playerName:      "Ronaldinho",
          playerImageSlug: "dinho.png",
          origin:          "Barcelona",
          league:          "La Liga",
          signingFee:      "—",
          signingYear:     "2003",
          playerAge:       23,
          headline:        "32 goals in 81 appearances during a peak La Liga spell",
          headlineStat:    "32",
          headlineUnit:    "La Liga goals",
          source:          "scouting · sample report",
          clubColor:       "#FFD500",
          accentColor:     "#FFD500",
          bgColor:         "#009C3B",
          lightMode:       false,
          metrics: [
            { label: "Goals",       value: "32",  detail: "across 81 La Liga apps", bar: 88 },
            { label: "Assists",     value: "24",  detail: "primary creator",        bar: 94 },
            { label: "Dribbles/90", value: "5.6", detail: "elite 1v1 threat",       bar: 97 },
            { label: "Key passes",  value: "3.1", detail: "vision through traffic", bar: 90 },
            { label: "Free kicks",  value: "9",   detail: "set-piece specialist",   bar: 82 },
            { label: "Flair",       value: "99",  detail: "samba in the box",       bar: 99 },
          ],
          competition: "",
          dateline:    "",
          badgeSlug:   "",
          portraitSrc: "",
          skipIntro:   false,
        }}
      />
      <Composition
        id="ValueCurve"
        component={ValueCurve}
        schema={ValueCurvePropsSchema}
        durationInFrames={360}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          playerName:  "Ollie Watkins",
          buyFee:      1.8,
          sellFee:     28.0,
          buySeason:   "2017",
          sellSeason:  "2020",
          currency:    "£",
          accentColor: "#E30613",
          bgColor:     "#f0ece4",
          darkMode:    false,
          dataPoints: [
            { label: "Sign",    value: 1.8,  annotation: "" },
            { label: "2017/18", value: 3.5,  annotation: "" },
            { label: "2018/19", value: 8.0,  annotation: "" },
            { label: "2019/20", value: 18.0, annotation: "25 Championship goals" },
            { label: "Sale",    value: 28.0, annotation: "" },
          ],
          skipIntro: false,
        }}
      />

      {/* ── HeroTransferProfit ─────────────────────────────────────────── */}
      <Composition
        id="HeroTransferProfit"
        component={HeroTransferProfit}
        schema={HeroTransferProfitPropsSchema}
        calculateMetadata={transferProfitV2CalculateMetadata}
        durationInFrames={900}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          title:       "the brentford model",
          subtitle:    "buy cheap. develop. sell big.",
          accentColor: "#E30613",
          buyColor:    "#4a6fa5",
          profitColor: "#C9A84C",
          bgColor:     "#f0ece4",
          dwellFrames: 150,
          transfers: [
            { year: "2017", player: "Ollie Watkins",   fromClub: "Exeter City",   toClub: "Aston Villa",  buyFee: "£1.8m", buyValue: 1.8, sellFee: "£28m",  sellValue: 28,  highlight: false, sideImage: "watkins.jpg"  },
            { year: "2018", player: "Neal Maupay",     fromClub: "Saint-Étienne", toClub: "Brighton",     buyFee: "£1.6m", buyValue: 1.6, sellFee: "£20m",  sellValue: 20,  highlight: false, sideImage: "maupay.jpg"   },
            { year: "2020", player: "Saïd Benrahma",   fromClub: "Nice",          toClub: "West Ham",     buyFee: "£1.5m", buyValue: 1.5, sellFee: "£25m",  sellValue: 25,  highlight: false, sideImage: "benrahma.jpg" },
            { year: "2021", player: "Bryan Mbeumo",    fromClub: "Troyes",        toClub: "Man Utd",      buyFee: "£1.5m", buyValue: 1.5, sellFee: "£85m",  sellValue: 85,  highlight: true,  sideImage: "mbeumo.jpg"   },
            { year: "2020", player: "Ivan Toney",      fromClub: "Peterborough",  toClub: "Nottm Forest", buyFee: "£5m",   buyValue: 5,   sellFee: "£40m",  sellValue: 40,  highlight: true,  sideImage: "toney.jpg"    },
          ],
          sideImage: "",
          skipIntro: false,
        }}
      />

      {/* ── HeroPlayerRevealTrio — full-height player images, no text ─────── */}
      <Composition
        id="HeroPlayerRevealTrio"
        component={HeroPlayerRevealTrio}
        schema={HeroPlayerRevealTrioPropsSchema}
        calculateMetadata={playerRevealTrioCalculateMetadata}
        durationInFrames={162}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          players: [
            { src: "aguero.png", zIndex: 1 },  // left-facing
            { src: "rooney.png", zIndex: 3 },  // forward-facing, hero
            { src: "suarez.png", zIndex: 2 },  // right-facing
          ],
          bgColor:      "#f0ece4",
          darkMode:     false,
          stagger:      20,
          holdDuration: 90,
          skipIntro:    false,
        }}
      />

      {/* ── VideoSequence — master composition with transitions ────────────── */}
      <Composition
        id="VideoSequence"
        component={VideoSequence}
        schema={VideoSequencePropsSchema}
        calculateMetadata={videoSequenceCalculateMetadata}
        durationInFrames={1800}  // overridden by calculateMetadata at runtime
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          accentColor: "#C8102E",
          scenes: [
            // ── Scene 1 — intro title ──────────────────────────────────────
            {
              compositionId:   "HeroIntro",
              durationInFrames: 240,
              transition:       "push",
              accentColor:      "",
              props: {
                subtitle: "the greatest league season ever told",
                bgColor:  "#f0ece4",
              },
            },
            // ── Scene 3 — attacking radar ──────────────────────────────────
            {
              compositionId:   "AttackingRadar",
              durationInFrames: 540,
              transition:       "letterbox",
              accentColor:      "",
              props: {
                entityName:     "Florian Wirtz",
                competition:    "Premier League",
                season:         "2025/2026",
                matchType:      "All Matches",
                nineties:       26,
                accentColor:    "#D4001A",
                bgColor:        "#f0ece4",
                lightMode:      true,
                introFrames:    40,
                revealInterval: 50,
                metrics: [
                  { label: "Non-Penalty\nGoals",     value: 0.42, percentile: 86, unit: "" },
                  { label: "Expected\nGoals (xG)",   value: 0.38, percentile: 89, unit: "" },
                  { label: "Expected\nAssists (xA)", value: 0.41, percentile: 94, unit: "" },
                  { label: "Shot-Creating\nActions", value: 6.2,  percentile: 96, unit: "" },
                  { label: "Key Passes",             value: 3.4,  percentile: 93, unit: "" },
                  { label: "Dribbles\nCompleted",    value: 3.8,  percentile: 88, unit: "" },
                  { label: "Progressive\nCarries",   value: 7.9,  percentile: 91, unit: "" },
                  { label: "Progressive\nPasses",    value: 6.8,  percentile: 82, unit: "" },
                  { label: "Touches in\nPenalty Box",value: 7.1,  percentile: 85, unit: "" },
                ],
              },
            },
            // ── Scene 4 — league table ─────────────────────────────────────
            {
              compositionId:   "PremierLeagueTable",
              durationInFrames: 270,
              transition:       "flash",
              accentColor:      "",
              props: {
                season:  "2013–14",
                bgColor: "#f0ece4",
                teams: [
                  { pos: 1, name: "Manchester City",  badgeSlug: "manchester-city.svg",  color: "#6CABDD", p: 38, w: 27, d: 5, l: 6, gd: 65, pts: 86 },
                  { pos: 2, name: "Liverpool",         badgeSlug: "liverpool.svg",        color: "#C8102E", p: 38, w: 26, d: 6, l: 6, gd: 51, pts: 84 },
                  { pos: 3, name: "Chelsea",           badgeSlug: "chelsea.svg",          color: "#034694", p: 38, w: 25, d: 7, l: 6, gd: 45, pts: 82 },
                  { pos: 4, name: "Arsenal",           badgeSlug: "arsenal.svg",          color: "#EF0107", p: 38, w: 24, d: 7, l: 7, gd: 27, pts: 79 },
                ],
              },
            },
            // ── Scene 6 — chapter word ─────────────────────────────────────
            {
              compositionId:   "HeroChapterWord",
              durationInFrames: 180,
              transition:       "grain",
              accentColor:      "",
              props: {
                word:        "aesthetics.",
                player1Image: "suarez.jpg",
                player2Image: "aguero.png",
                blob1Color:   "#7C5CBF",
                blob2Color:   "#D94F4F",
                bgColor:     "#f0ece4",
              },
            },
            // ── Scene 7 — top scorers table (final scene — no transition) ──
            {
              compositionId:   "TopScorersTable",
              durationInFrames: 270,
              transition:       "none",
              accentColor:      "",
              props: {
                season:      "2013–14",
                competition: "Premier League",
                statLabel:   "Goals",
                bgColor:     "#f0ece4",
                players: [
                  { pos: 1, name: "Luis Suárez",      club: "Liverpool",       badgeSlug: "liverpool.svg",        clubColor: "#C8102E", goals: 31, assists: 12, apps: 33 },
                  { pos: 2, name: "Daniel Sturridge",  club: "Liverpool",       badgeSlug: "liverpool.svg",        clubColor: "#C8102E", goals: 21, assists: 5,  apps: 29 },
                  { pos: 3, name: "Yaya Touré",         club: "Manchester City", badgeSlug: "manchester-city.svg",  clubColor: "#6CABDD", goals: 20, assists: 6,  apps: 35 },
                ],
              },
            },
          ],
        }}
      />

      {/* ── HeroShotMap — xG shot location map ────────────────────────── */}
      <Composition
        id="HeroShotMap"
        component={HeroShotMap}
        schema={HeroShotMapPropsSchema}
        durationInFrames={240}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          playerName: "Luis Suárez",
          competition: "Premier League 2013/14",
          accentColor: "#C8102E",
          bgColor: "#f0ece4",
          stagger: 6,
          shots: [
            { x: 48, y: 12, xg: 0.72, goal: true,  saved: false, minute: 14, label: "" },
            { x: 30, y: 20, xg: 0.18, goal: false, saved: false, minute: 32, label: "" },
            { x: 55, y: 8,  xg: 0.82, goal: true,  saved: false, minute: 45, label: "" },
            { x: 70, y: 25, xg: 0.06, goal: false, saved: false, minute: 58, label: "" },
            { x: 42, y: 15, xg: 0.45, goal: true,  saved: false, minute: 67, label: "" },
            { x: 50, y: 28, xg: 0.09, goal: false, saved: false, minute: 74, label: "" },
            { x: 38, y: 10, xg: 0.61, goal: false, saved: true,  minute: 81, label: "" },
            { x: 52, y: 6,  xg: 0.88, goal: true,  saved: false, minute: 90, label: "" },
          ],
          playerImage: "",
          totalXg:     0,
          totalGoals:  0,
          skipIntro:   false,
        }}
      />

      {/* ── HeroBigStat — single large stat with player image ────────── */}
      <Composition
        id="HeroBigStat"
        component={HeroBigStat}
        schema={HeroBigStatPropsSchema}
        durationInFrames={240}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          stat:        "31",
          unit:        "goals",
          label:       "The most in a single Premier League season — and he still finished second in the title race.",
          stat2:       "",
          unit2:       "",
          label2:      "",
          context:     "Luis Suárez · Liverpool · 2013/14",
          badgeSlug:   "liverpool.svg",
          source:      "stats · fbref",
          playerImage: "",
          accentColor: "#C8102E",
          darkMode:    false,
          bgColor:     "#f0ece4",
          skipIntro:   false,
          comparator:  {
            kind:  "line" as const,
            label: "league average per season",
            value: 11,
          },
        }}
      />

      {/* ── HeroComparisonRadar — dual player radar overlay ───────────── */}
      <Composition
        id="HeroComparisonRadar"
        component={HeroComparisonRadar}
        schema={HeroComparisonRadarPropsSchema}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          playerA: "Lionel Messi",
          playerB: "Cristiano Ronaldo",
          seasonA: "2011/12",
          seasonB: "2011/12",
          competition: "La Liga",
          accentColorA: "#C8102E",
          accentColorB: "#003087",
          bgColor: "#f0ece4",
          stagger: 14,
          introFrames: 30,
          metrics: [
            { label: "Goals",         percentileA: 99, percentileB: 97, valueA: 50,   valueB: 60,   unit: "" },
            { label: "Assists",       percentileA: 92, percentileB: 71, valueA: 16,   valueB: 13,   unit: "" },
            { label: "xG",            percentileA: 98, percentileB: 96, valueA: 42.3, valueB: 52.1, unit: "" },
            { label: "Dribbles",      percentileA: 97, percentileB: 61, valueA: 0,    valueB: 0,    unit: "" },
            { label: "Chances\nCreated", percentileA: 94, percentileB: 72, valueA: 0, valueB: 0,   unit: "" },
            { label: "Aerial\nWins",  percentileA: 32, percentileB: 88, valueA: 0,    valueB: 0,    unit: "" },
          ],
          imageA:    "",
          imageB:    "",
          skipIntro: false,
        }}
      />

      {/* ── HeroNewsFeed — rolling news headlines with world-pan ─────── */}
      <Composition
        id="HeroNewsFeed"
        component={HeroNewsFeed}
        schema={HeroNewsFeedPropsSchema}
        calculateMetadata={calcNewsFeed}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          headlines: [
            { source: "Reuters",   headline: "FTX customers sue Bankman-Fried over alleged $11 billion fraud", body: "November 15, 2022" },
            { source: "Bloomberg", headline: "Alameda Research lied to lenders about FTX's financial health", body: "November 14, 2022" },
            { source: "The Wall Street Journal", headline: "Bankruptcy estate uncovers billions in venture stakes", body: "January 2023" },
          ],
          dwellFrames: 110,
          panFrames:   22,
        }}
      />

      {/* ── HeroSeasonTimeline — red-grain opening sequence ──────────── */}
      <Composition
        id="HeroSeasonTimeline"
        component={HeroSeasonTimeline}
        schema={HeroSeasonTimelinePropsSchema}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          subjectName: "Mikel Arteta",
          subjectImage: "arteta.png",
          headline: "quadruple?",
          bgColor: "#5E1212",
          lineColor: "#C41E3A",
          accentColor: "#E8E0D0",
          seasons: [
            { season: "19/20", positionLabel: "8th",  position: 8  },
            { season: "20/21", positionLabel: "8th",  position: 8  },
            { season: "21/22", positionLabel: "5th",  position: 5  },
            { season: "22/23", positionLabel: "2nd",  position: 2  },
            { season: "23/24", positionLabel: "2nd",  position: 2  },
            { season: "24/25", positionLabel: "2nd",  position: 2  },
            { season: "25/26", positionLabel: "1st?", position: 1, trophies: ["PL"] },
          ],
        }}
      />

      {/* TournamentBracket preview */}
      <Composition
        id="TournamentBracket"
        component={TournamentBracket}
        schema={TournamentBracketPropsSchema}
        durationInFrames={540}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          focusTeam: "Brazil",
          title:    "",
          subtitle: "",
          accentColor: "#1E8A5A",
          highlightLineColor: "#D62828",
          bgColor: "#f0ece4",
          skipIntro: false,
          matches: [
            { round: "R16", teamA: "Brazil", teamB: "South Korea", scoreA: 4, scoreB: 1, winner: "Brazil" },
            { round: "R16", teamA: "Croatia", teamB: "Japan", scoreA: 1, scoreB: 1, winner: "Croatia" },
            { round: "R16", teamA: "Argentina", teamB: "Australia", scoreA: 2, scoreB: 1, winner: "Argentina" },
            { round: "R16", teamA: "Netherlands", teamB: "USA", scoreA: 3, scoreB: 1, winner: "Netherlands" },
            { round: "R16", teamA: "England", teamB: "Senegal", scoreA: 3, scoreB: 0, winner: "England" },
            { round: "R16", teamA: "France", teamB: "Poland", scoreA: 3, scoreB: 1, winner: "France" },
            { round: "R16", teamA: "Morocco", teamB: "Spain", scoreA: 0, scoreB: 0, winner: "Morocco" },
            { round: "R16", teamA: "Portugal", teamB: "Switzerland", scoreA: 6, scoreB: 1, winner: "Portugal" },
            { round: "QF", teamA: "Brazil", teamB: "Croatia", scoreA: 2, scoreB: 0, winner: "Brazil" },
            { round: "QF", teamA: "Argentina", teamB: "Netherlands", scoreA: 2, scoreB: 1, winner: "Argentina" },
            { round: "QF", teamA: "England", teamB: "France", scoreA: 1, scoreB: 2, winner: "France" },
            { round: "QF", teamA: "Morocco", teamB: "Portugal", scoreA: 1, scoreB: 0, winner: "Morocco" },
            { round: "SF", teamA: "Brazil", teamB: "Argentina", scoreA: 2, scoreB: 1, winner: "Brazil" },
            { round: "SF", teamA: "France", teamB: "Morocco", scoreA: 2, scoreB: 0, winner: "France" },
            { round: "Final", teamA: "Brazil", teamB: "France", scoreA: 2, scoreB: 1, winner: "Brazil" },
          ],
        }}
      />

      {/* ── Thumbnail — 1280×720 still frame for YouTube ─────────────────── */}
      <Composition
        id="Thumbnail"
        component={Thumbnail}
        schema={ThumbnailPropsSchema}
        durationInFrames={1}
        fps={30}
        width={1280}
        height={720}
        defaultProps={{
          hookLine:    "the **genius**\nof Suárez",
          subNote:     "",
          statLine:    "31 goals · 1 season",
          imageA:      "suarez",
          imageAX:     68,
          imageAY:     100,
          imageAScale: 1,
          imageB:      "",
          imageBX:     22,
          imageBY:     100,
          imageBScale: 0.85,
          calloutText: "",
          calloutX:    72,
          calloutY:    55,
          bgStyle:     "light" as const,
          bgColor:     "#ffffff",
          boldColor:   "#C8102E",
          showArrow:   false,
          arrowColor:  "#D0021B",
          arrowX1:     560,
          arrowY1:     350,
          arrowX2:     720,
          arrowY2:     500,
          layout:         "top-text" as const,
          textX:          -1,
          textY:          -1,
          textScale:      1,
          textWidth:      -1,
          imageAEffect:   "none" as const,
          imageBEffect:   "none" as const,
          statBadge:      "",
          statBadgeLabel: "",
          statBadgeX:     14,
          statBadgeY:     50,
          gradient:          "none",
          gradientAngle:     135,
          showWatermark:     true,
          watermarkPosition: "bottom-right" as const,
          skipIntro:         false,
        }}
      />

      {/* ── Phase 10 — Domain-agnostic compositions ─────────────────────── */}

      {/* TimelineGeneric — pure event timeline, no club badges or team colours */}
      <Composition
        id="TimelineGeneric"
        component={TimelineGeneric}
        schema={TimelineGenericPropsSchema}
        calculateMetadata={timelineGenericCalc}
        durationInFrames={240}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          title:    "OpenAI — A Decade of AGI Ambition",
          events:   [
            { year: "2015", label: "Founded",          sub: "Sam Altman, Elon Musk + others" },
            { year: "2019", label: "Microsoft $1B",    sub: "First major strategic backer" },
            { year: "2022", label: "ChatGPT launch",   sub: "1M users in five days" },
            { year: "2023", label: "$13B raise",       sub: "Largest private AI round to date" },
            { year: "2024", label: "Sora + reasoning", sub: "Multimodal expansion" },
          ],
          palette:   "paper" as const,
          accent:    "#C9A84C",
          source:    "",
          dateline:  "",
          skipIntro: false,
        }}
      />

      {/* ── video-shotcraft ports (2026-07-23) ─────────────────────────────
          Motion-design techniques ported from Vincentwei1021/video-shotcraft,
          reskinned onto lib/kit.tsx (Ground/Theme/EASE/primitives). Compositions
          only — not yet wired into storyboard tags / graphics_agent dispatch. */}
      <Composition id="AxisRescaleShock" component={AxisRescaleShock} schema={AxisRescaleShockPropsSchema} durationInFrames={170} fps={30} width={1920} height={1080} defaultProps={AxisRescaleShockPropsSchema.parse({})} />
      <Composition id="UnitDotSwarmRegroup" component={UnitDotSwarmRegroup} schema={UnitDotSwarmRegroupPropsSchema} durationInFrames={400} fps={30} width={1920} height={1080} defaultProps={UnitDotSwarmRegroupPropsSchema.parse({})} />
      <Composition id="OscilloscopeStream" component={OscilloscopeStream} schema={OscilloscopeStreamPropsSchema} durationInFrames={170} fps={30} width={1920} height={1080} defaultProps={OscilloscopeStreamPropsSchema.parse({})} />
      <Composition id="TimelineTravel" component={TimelineTravel} schema={TimelineTravelPropsSchema} durationInFrames={470} fps={30} width={1920} height={1080} defaultProps={TimelineTravelPropsSchema.parse({})} />
      <Composition id="GrazeFaceTour" component={GrazeFaceTour} schema={GrazeFaceTourPropsSchema} durationInFrames={150} fps={30} width={1920} height={1080} defaultProps={GrazeFaceTourPropsSchema.parse({})} />
      <Composition id="ChangelogScrollBrake" component={ChangelogScrollBrake} schema={ChangelogScrollBrakePropsSchema} durationInFrames={140} fps={30} width={1920} height={1080} defaultProps={ChangelogScrollBrakePropsSchema.parse({})} />
      <Composition id="OdometerDigitRoll" component={OdometerDigitRoll} schema={OdometerDigitRollPropsSchema} durationInFrames={150} fps={30} width={1920} height={1080} defaultProps={OdometerDigitRollPropsSchema.parse({})} />
      <Composition id="ParticleSandFill" component={ParticleSandFill} schema={ParticleSandFillPropsSchema} durationInFrames={150} fps={30} width={1920} height={1080} defaultProps={ParticleSandFillPropsSchema.parse({})} />
      <Composition id="PillSlotCycle" component={PillSlotCycle} schema={PillSlotCyclePropsSchema} durationInFrames={222} fps={30} width={1920} height={1080} defaultProps={PillSlotCyclePropsSchema.parse({})} />
      <Composition id="ListStackPress" component={ListStackPress} schema={ListStackPressPropsSchema} durationInFrames={190} fps={30} width={1920} height={1080} defaultProps={ListStackPressPropsSchema.parse({})} />
      <Composition id="SpeedRampReveal" component={SpeedRampReveal} schema={SpeedRampRevealPropsSchema} durationInFrames={230} fps={30} width={1920} height={1080} defaultProps={SpeedRampRevealPropsSchema.parse({})} />
      <Composition id="FreezeAnnotate" component={FreezeAnnotate} schema={FreezeAnnotatePropsSchema} durationInFrames={230} fps={30} width={1920} height={1080} defaultProps={FreezeAnnotatePropsSchema.parse({})} />
      <Composition id="BarRowsAxis" component={BarRowsAxis} schema={BarRowsAxisPropsSchema} durationInFrames={160} fps={30} width={1920} height={1080} defaultProps={BarRowsAxisPropsSchema.parse({})} />
      <Composition id="RingStatReveal" component={RingStatReveal} schema={RingStatRevealPropsSchema} durationInFrames={130} fps={30} width={1920} height={1080} defaultProps={RingStatRevealPropsSchema.parse({})} />
      <Composition id="LineTrendChart" component={LineTrendChart} schema={LineTrendChartPropsSchema} durationInFrames={210} fps={30} width={1920} height={1080} defaultProps={LineTrendChartPropsSchema.parse({})} />
      <Composition id="PieShareChart" component={PieShareChart} schema={PieShareChartPropsSchema} durationInFrames={150} fps={30} width={1920} height={1080} defaultProps={PieShareChartPropsSchema.parse({})} />
      <Composition id="GaugeShareArc" component={GaugeShareArc} schema={GaugeShareArcPropsSchema} durationInFrames={150} fps={30} width={1920} height={1080} defaultProps={GaugeShareArcPropsSchema.parse({})} />
      <Composition id="BarColumnsChart" component={BarColumnsChart} schema={BarColumnsChartPropsSchema} durationInFrames={210} fps={30} width={1920} height={1080} defaultProps={BarColumnsChartPropsSchema.parse({})} />
      <Composition id="TextColumnConverge" component={TextColumnConverge} schema={TextColumnConvergePropsSchema} durationInFrames={160} fps={30} width={1920} height={1080} defaultProps={TextColumnConvergePropsSchema.parse({})} />
      <Composition id="TitleDemoteToLabel" component={TitleDemoteToLabel} schema={TitleDemoteToLabelPropsSchema} durationInFrames={110} fps={30} width={1920} height={1080} defaultProps={TitleDemoteToLabelPropsSchema.parse({})} />
      <Composition id="VoiceWaveformLive" component={VoiceWaveformLive} schema={VoiceWaveformLivePropsSchema} durationInFrames={150} fps={30} width={1920} height={1080} defaultProps={VoiceWaveformLivePropsSchema.parse({})} />
    </>
  );
};