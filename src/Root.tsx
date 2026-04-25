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
import { IntrcptIntro, IntrcptIntroPropsSchema } from "./IntrcptIntro";
import { IntrcptStatBars, IntrcptStatBarsPropsSchema } from "./IntrcptStatBars";
import { IntrcptFormRun, IntrcptFormRunPropsSchema } from "./IntrcptFormRun";
import { IntrcptTactical, IntrcptTacticalPropsSchema } from "./IntrcptTactical";
import { IntrcptLeagueGraph, IntrcptLeagueGraphPropsSchema } from "./IntrcptLeagueGraph";
import { IntrcptTransferRecord, IntrcptTransferRecordPropsSchema } from "./IntrcptTransferRecord";
import { IntrcptChapterWord, IntrcptChapterWordPropsSchema } from "./IntrcptChapterWord";
import { IntrcptClipCompare, IntrcptClipComparePropsSchema } from "./IntrcptClipCompare";
import { IntrcptClipSingle, IntrcptClipSinglePropsSchema } from "./IntrcptClipSingle";
import { IntrcptScatterPlot, IntrcptScatterPlotPropsSchema } from "./IntrcptScatterPlot";
import { AttackingRadar, AttackingRadarPropsSchema } from "./AttackingRadar";
import { PlayerTrio, PlayerTrioPropsSchema } from "./PlayerTrio";
import { TrioFeature, TrioFeaturePropsSchema } from "./TrioFeature";
import { MapCallout, MapCalloutPropsSchema } from "./MapCallout";
import { AnnotatedImage, AnnotatedImagePropsSchema } from "./AnnotatedImage";
import { TimelineScroll, TimelineScrollPropsSchema } from "./TimelineScroll";
import { CountdownReveal, CountdownRevealPropsSchema, calculateMetadata as countdownCalculateMetadata } from "./CountdownReveal";
import { StatPulse, StatPulsePropsSchema } from "./StatPulse";
import { ScoutReport, ScoutReportPropsSchema } from "./ScoutReport";
import { ValueCurve, ValueCurvePropsSchema } from "./ValueCurve";
import { IntrcptTransferProfit, IntrcptTransferProfitPropsSchema, calculateMetadata as transferProfitV2CalculateMetadata } from "./IntrcptTransferProfit";
import { IntrcptPlayerRevealTrio, IntrcptPlayerRevealTrioPropsSchema, calculateMetadata as playerRevealTrioCalculateMetadata } from "./IntrcptPlayerRevealTrio";
import {
  VideoSequence,
  VideoSequencePropsSchema,
  calculateMetadata as videoSequenceCalculateMetadata,
} from "./VideoSequence";
import { Thumbnail, ThumbnailPropsSchema } from "./Thumbnail";
import { IntrcptShotMap, IntrcptShotMapPropsSchema } from "./IntrcptShotMap";
import { IntrcptAwardsList, IntrcptAwardsListPropsSchema } from "./IntrcptAwardsList";
import { IntrcptBigStat, IntrcptBigStatPropsSchema } from "./IntrcptBigStat";
import { IntrcptComparisonRadar, IntrcptComparisonRadarPropsSchema } from "./IntrcptComparisonRadar";
import { IntrcptNewsFeed, IntrcptNewsFeedPropsSchema, calculateMetadata as calcNewsFeed } from "./IntrcptNewsFeed";
import { IntrcptSeasonTimeline, IntrcptSeasonTimelinePropsSchema } from "./IntrcptSeasonTimeline";
import { TournamentBracket, TournamentBracketPropsSchema } from "./TournamentBracket";
// Track E — register IntrcptQuote (was missing) + new hybrid templates
import { IntrcptQuote, IntrcptQuotePropsSchema } from "./IntrcptQuote";
import { PortraitStatHero, PortraitStatHeroPropsSchema } from "./PortraitStatHero";
import { PortraitWithBars, PortraitWithBarsPropsSchema } from "./PortraitWithBars";

import type { CareerTimelineProps } from "./CareerTimeline";
import type { IntrcptTransferRecordProps } from "./IntrcptTransferRecord";

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

const DEFAULT_INTRCPT_TRANSFER_RECORD: IntrcptTransferRecordProps = {
  title: "world record transfer fees",
  subtitle: "the escalation of the market over two decades",
  sideImage: "neymar.png",
  accentColor: "#C9A84C",
  transfers: [
    { year: "2001", player: "Zinedine Zidane",  fromClub: "Juventus",  toClub: "Real Madrid", fee: "£46.5m", feeValue: 46.5, highlight: false },
    { year: "2009", player: "Cristiano Ronaldo",fromClub: "Man Utd",   toClub: "Real Madrid", fee: "£80m",   feeValue: 80,   highlight: false },
    { year: "2013", player: "Gareth Bale",       fromClub: "Spurs",    toClub: "Real Madrid", fee: "£85m",   feeValue: 85,   highlight: false },
    { year: "2016", player: "Paul Pogba",         fromClub: "Juventus", toClub: "Man Utd",     fee: "£89m",   feeValue: 89,   highlight: false },
    { year: "2017", player: "Neymar",             fromClub: "Barcelona",toClub: "PSG",         fee: "£198m",  feeValue: 198,  highlight: true  },
    { year: "2023", player: "Enzo Fernández",     fromClub: "Benfica",  toClub: "Chelsea",     fee: "£107m",  feeValue: 107,  highlight: false },
  ],
  bgColor: "#f0ece4",
  skipIntro: false,
};

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="IntrcptIntro"
        component={IntrcptIntro}
        schema={IntrcptIntroPropsSchema}
        durationInFrames={240}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          subtitle: "the greatest league season ever told",
          bgColor: "#f0ece4",
          skipIntro: false,
        }}
      />
      <Composition
        id="IntrcptStatBars"
        component={IntrcptStatBars}
        schema={IntrcptStatBarsPropsSchema}
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
          skipIntro: false,
        }}
      />
      <Composition
        id="IntrcptFormRun"
        component={IntrcptFormRun}
        schema={IntrcptFormRunPropsSchema}
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
          skipIntro: false,
        }}
      />
      <Composition
        id="IntrcptTactical"
        component={IntrcptTactical}
        schema={IntrcptTacticalPropsSchema}
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
          skipIntro: false,
        }}
      />
      <Composition
        id="IntrcptLeagueGraph"
        component={IntrcptLeagueGraph}
        schema={IntrcptLeagueGraphPropsSchema}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          season:      "2013–14",
          title:       "Title Race",
          competition: "Premier League",
          source:      "Source · FBref",
          maxPosition: 6,
          bgColor:     "",
          accentColor: "",
          skipIntro: false,
          teamA: {
            name:      "Liverpool",
            color:     "#C8102E",
            badgeSlug: "",
            data:  [
              { matchday: 1,  position: 4 }, { matchday: 5,  position: 3 },
              { matchday: 10, position: 2 }, { matchday: 20, position: 1 },
              { matchday: 30, position: 1 }, { matchday: 36, position: 2 },
              { matchday: 38, position: 2 },
            ],
          },
          teamB: {
            name:      "Manchester City",
            color:     "#6CABDD",
            badgeSlug: "",
            data:  [
              { matchday: 1,  position: 2 }, { matchday: 5,  position: 1 },
              { matchday: 10, position: 3 }, { matchday: 20, position: 2 },
              { matchday: 30, position: 2 }, { matchday: 36, position: 1 },
              { matchday: 38, position: 1 },
            ],
          },
        }}
      />
      <Composition
        id="IntrcptTransferRecord"
        component={IntrcptTransferRecord}
        schema={IntrcptTransferRecordPropsSchema}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={DEFAULT_INTRCPT_TRANSFER_RECORD}
      />
      <Composition
        id="IntrcptChapterWord"
        component={IntrcptChapterWord}
        schema={IntrcptChapterWordPropsSchema}
        durationInFrames={180}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          word: "aesthetics.",
          player1Image: "suarez.jpg",
          player2Image: "aguero.png",
          blob1Color: "#7C5CBF",
          blob2Color: "#D94F4F",
          bgColor: "#f0ece4",
          skipIntro: false,
        }}
      />
      <Composition
        id="IntrcptClipCompare"
        component={IntrcptClipCompare}
        schema={IntrcptClipComparePropsSchema}
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
          skipIntro:  false,
        }}
      />
      <Composition
        id="IntrcptClipSingle"
        component={IntrcptClipSingle}
        schema={IntrcptClipSinglePropsSchema}
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
        }}
      />
      <Composition
        id="IntrcptScatterPlot"
        component={IntrcptScatterPlot}
        schema={IntrcptScatterPlotPropsSchema}
        durationInFrames={270}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          axisXLabel: "speed",
          axisYLabel: "efficiency",
          q1Label: "Wizard Zone",
          q2Label: "maestros",
          q3Label: "stiff",
          q4Label: "robotic",
          showWizardArrow: true,
          players: [{ name: "Player A", image: "suarez.jpg", ringColor: "#C8102E", x: 72, y: 75 }],
          bgColor: "#111111"
        }}
      />
      <Composition
        id="TrioFeature"
        component={TrioFeature}
        schema={TrioFeaturePropsSchema}
        durationInFrames={270}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          bgColor: "#f0ece4",
          players: [
            { name: "Sergio Agüero",    image: "aguero.jpg",  nationality: "Argentina",    clubColor: "#6CABDD" },
            { name: "Wayne Rooney",     image: "rooney.jpg",  nationality: "England",      clubColor: "#DA291C" },
            { name: "Luis Suárez",      image: "suarez.jpg",  nationality: "Uruguay",      clubColor: "#C8102E" },
          ],
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
          players: [
            {
              name:      "Sergio Agüero",
              image:     "aguero.jpg",
              club:      "Manchester City",
              clubColor: "#6CABDD",
              stat:      "17",
              statLabel: "goals",
            },
            {
              name:      "Wayne Rooney",
              image:     "rooney.jpg",
              club:      "Manchester United",
              clubColor: "#DA291C",
              stat:      "17",
              statLabel: "goals",
            },
            {
              name:      "Luis Suárez",
              image:     "suarez.jpg",
              club:      "Liverpool",
              clubColor: "#C8102E",
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
          ]
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
          bgColor: "#f0ece4",
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
            { label: "Assists",     value: 12 },
            { label: "Apps",        value: 33 },
            { label: "Mins / Goal", value: 90 },
          ]
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
          ]
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
          ]
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
        }}
      />

      {/* ── Motion Design Components ──────────────────────────────────────── */}
      <Composition
        id="MapCallout"
        component={MapCallout}
        schema={MapCalloutPropsSchema}
        durationInFrames={270}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          title:           "Manchester",
          titleSize:       64,
          dateline:        "England · North West",
          description:     "The industrial heart of the north — a city whose football clubs have shaped the modern English game.",
          source:          "MAP · NATURAL EARTH",
          calloutCity:     "manchester",
          calloutText:     "",
          highlightRegion: "england" as const,
          accentColor:     "#C8102E",
          bgColor:         "#f0ece4",
          darkMode:        false,
          skipIntro:       false,
          pins: [
            { city: "manchester",  label: "Manchester",  highlighted: true  },
            { city: "london",      label: "London",      highlighted: false },
            { city: "edinburgh",   label: "Edinburgh",   highlighted: false },
            { city: "cardiff",     label: "Cardiff",     highlighted: false },
          ],
        }}
      />
      <Composition
        id="AnnotatedImage"
        component={AnnotatedImage}
        schema={AnnotatedImagePropsSchema}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          imageSrc:     "",
          title:        "Anfield — Capacity 61,276",
          subtitle:     "The Kop end holds 12,390 standing supporters",
          accentColor:  "#C8102E",
          bgColor:      "#f0ece4",
          kenBurns:     true,
          annotations: [
            { x: 50, y: 35, label: "The Pitch",     direction: "up",   color: "#ffffff" },
            { x: 15, y: 55, label: "The Kop",       direction: "right", color: "#C8102E" },
            { x: 82, y: 55, label: "Anfield Road",  direction: "left",  color: "#ffffff" },
          ],
        }}
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
            { year: "1992", title: "Premier League founded",    description: "22 clubs breakaway from the Football League.",         highlight: true  },
            { year: "1995", title: "Bosman ruling",             description: "Freedom of movement transforms the transfer market.",  highlight: false },
            { year: "2003", title: "Roman Abramovich",          description: "Chelsea's transformation begins.",                     highlight: false },
            { year: "2012", title: "Financial Fair Play",       description: "UEFA introduces new spending regulations.",           highlight: false },
            { year: "2017", title: "£5bn TV deal",              description: "Record broadcast rights reshape the game.",           highlight: true  },
          ],
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
            { name: "Alan Shearer",      detail: "1994/95 · Blackburn",      value: "34 goals" },
            { name: "Andrew Cole",       detail: "1993/94 · Newcastle",      value: "34 goals" },
            { name: "Erling Haaland",    detail: "2022/23 · Man City",       value: "36 goals" },
            { name: "Mohamed Salah",     detail: "2017/18 · Liverpool",      value: "32 goals" },
            { name: "Luis Suárez",       detail: "2013/14 · Liverpool",      value: "31 goals" },
            { name: "Cristiano Ronaldo", detail: "2007/08 · Man Utd",        value: "31 goals" },
            { name: "Alan Shearer",      detail: "1995/96 · Newcastle",      value: "31 goals" },
            { name: "Kevin Phillips",    detail: "1999/00 · Sunderland",     value: "30 goals" },
            { name: "Harry Kane",        detail: "2016/17 · Spurs",          value: "29 goals" },
            { name: "Thierry Henry",     detail: "2004/05 · Arsenal",        value: "25 goals" },
          ],
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
            { label: "07/08", value: 23  },
            { label: "08/09", value: 28  },
            { label: "09/10", value: 35, annotation: "Ajax peak" },
            { label: "10/11", value: 49  },
            { label: "11/12", value: 17  },
            { label: "12/13", value: 23  },
            { label: "13/14", value: 31, annotation: "Golden Boot" },
            { label: "14/15", value: 25  },
            { label: "15/16", value: 59, annotation: "All-time record" },
            { label: "16/17", value: 37  },
          ],
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
            { label: "Sign",    value: 1.8  },
            { label: "2017/18", value: 3.5  },
            { label: "2018/19", value: 8.0  },
            { label: "2019/20", value: 18.0, annotation: "25 Championship goals" },
            { label: "Sale",    value: 28.0 },
          ],
        }}
      />

      {/* ── IntrcptTransferProfit ─────────────────────────────────────────── */}
      <Composition
        id="IntrcptTransferProfit"
        component={IntrcptTransferProfit}
        schema={IntrcptTransferProfitPropsSchema}
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
        }}
      />

      {/* ── IntrcptPlayerRevealTrio — full-height player images, no text ─────── */}
      <Composition
        id="IntrcptPlayerRevealTrio"
        component={IntrcptPlayerRevealTrio}
        schema={IntrcptPlayerRevealTrioPropsSchema}
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
          stagger:      20,
          holdDuration: 90,
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
              compositionId:   "IntrcptIntro",
              durationInFrames: 240,
              transition:       "push",
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
              compositionId:   "IntrcptChapterWord",
              durationInFrames: 180,
              transition:       "grain",
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

      {/* ── IntrcptShotMap — xG shot location map ────────────────────────── */}
      <Composition
        id="IntrcptShotMap"
        component={IntrcptShotMap}
        schema={IntrcptShotMapPropsSchema}
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
        }}
      />

      {/* ── IntrcptBigStat — single large stat with player image ────────── */}
      <Composition
        id="IntrcptBigStat"
        component={IntrcptBigStat}
        schema={IntrcptBigStatPropsSchema}
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

      {/* ── IntrcptAwardsList — year-by-year award podium ────────────────── */}
      <Composition
        id="IntrcptAwardsList"
        component={IntrcptAwardsList}
        schema={IntrcptAwardsListPropsSchema}
        durationInFrames={240}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          award: "Ballon d'Or",
          entityName: "Lionel Messi",
          accentColor: "#C9A84C",
          bgColor: "#f0ece4",
          stagger: 18,
          holdDuration: 40,
          years: [
            { year: "2009", winner: "Lionel Messi",      entity: "Lionel Messi", position: 1, detail: "Barcelona" },
            { year: "2010", winner: "Lionel Messi",      entity: "Lionel Messi", position: 1, detail: "Barcelona" },
            { year: "2011", winner: "Lionel Messi",      entity: "Lionel Messi", position: 1, detail: "Barcelona" },
            { year: "2012", winner: "Lionel Messi",      entity: "Lionel Messi", position: 1, detail: "Barcelona" },
            { year: "2013", winner: "Cristiano Ronaldo", entity: "Lionel Messi", position: 2, detail: "Real Madrid" },
            { year: "2014", winner: "Cristiano Ronaldo", entity: "Lionel Messi", position: 3, detail: "Real Madrid" },
            { year: "2015", winner: "Lionel Messi",      entity: "Lionel Messi", position: 1, detail: "Barcelona" },
          ],
        }}
      />

      {/* ── IntrcptComparisonRadar — dual player radar overlay ───────────── */}
      <Composition
        id="IntrcptComparisonRadar"
        component={IntrcptComparisonRadar}
        schema={IntrcptComparisonRadarPropsSchema}
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
        }}
      />

      {/* ── IntrcptNewsFeed — rolling news headlines with world-pan ─────── */}
      <Composition
        id="IntrcptNewsFeed"
        component={IntrcptNewsFeed}
        schema={IntrcptNewsFeedPropsSchema}
        calculateMetadata={calcNewsFeed}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          headlines: [
            { source: "The Athletic",  headline: "Suárez handed 10-match ban following shocking bite on Chiellini", body: "Uruguay forward faces one of the longest suspensions in World Cup history after incident in Group D.", image: "suarez.png" },
            { source: "BBC Sport",     headline: "Luis Suárez: reaction to ban from Uruguay forward's bite", body: "The BBC Sport team reacts to the 10-match suspension handed to Luis Suárez.", image: "suarez.png" },
            { source: "The Guardian",  headline: "Suárez ban: how Twitter and the football world reacted", body: "Social media and the football community responded with shock and dark humour.", image: "suarez.png" },
          ],
          bgColor:     "#111111",
          accentColor: "#ffffff",
          dotColor:    "#ffffff",
          textColor:   "#f0f0f0",
          dwellFrames: 110,
          panFrames:   22,
        }}
      />

      {/* ── IntrcptSeasonTimeline — red-grain opening sequence ──────────── */}
      <Composition
        id="IntrcptSeasonTimeline"
        component={IntrcptSeasonTimeline}
        schema={IntrcptSeasonTimelinePropsSchema}
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
        }}
      />

      {/* ── Track E — IntrcptQuote (was missing from registry) ── */}
      <Composition
        id="IntrcptQuote"
        component={IntrcptQuote}
        schema={IntrcptQuotePropsSchema}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          quote:       '"I am not a diver."',
          attribution: "Luis Suárez",
          context:     "",
          playerImage: "suarez.jpg",
          accentColor: "#C8102E",
          bgColor:     "#f0ece4",
          skipIntro:   false,
        }}
      />

      {/* ── Track E — PortraitStatHero (hybrid portrait + big stat) ── */}
      <Composition
        id="PortraitStatHero"
        component={PortraitStatHero}
        schema={PortraitStatHeroPropsSchema}
        durationInFrames={180}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          playerName:  "Luis Suárez",
          playerImage: "suarez",
          stat:        "31",
          unit:        "goals",
          caption:     "in a single Premier League season",
          context:     "2013/14 — Liverpool",
          accentColor: "#C8102E",
          bgColor:     "#f0ece4",
          skipIntro:   false,
        }}
      />

      {/* ── Track E — PortraitWithBars (masked portrait + 3 stat bars) ── */}
      <Composition
        id="PortraitWithBars"
        component={PortraitWithBars}
        schema={PortraitWithBarsPropsSchema}
        durationInFrames={210}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          playerName:  "Luis Suárez",
          playerImage: "suarez",
          title:       "2013/14 SEASON",
          bars:        [
            { label: "Goals",    value: 31,   unit: "", max: 40 },
            { label: "Assists",  value: 12,   unit: "", max: 40 },
            { label: "G+A / 90", value: 1.27, unit: "", max: 2  },
          ],
          accentColor: "#C8102E",
          bgColor:     "#f0ece4",
          skipIntro:   false,
        }}
      />
    </>
  );
};