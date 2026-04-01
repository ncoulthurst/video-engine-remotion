import React from "react";
import { Composition } from "remotion";

import { TransferAnnouncement, TransferAnnouncementPropsSchema } from "./TransferAnnouncement";
import { PremierLeagueTable, TablePropsSchema } from "./PremierLeagueTable";
import { TopScorersTable, TopScorersPropsSchema } from "./TopScorersTable";
import { PlayerStats, PlayerStatsPropsSchema } from "./PlayerStats";
import { MatchResult, MatchResultPropsSchema } from "./MatchResult";
import { CareerTimeline, CareerTimelinePropsSchema } from "./CareerTimeline";
import { SeasonComparison, SeasonComparisonPropsSchema } from "./SeasonComparison";
import { TeamLineup, TeamLineupPropsSchema } from "./TeamLineup";
import { TrophyGraphic, TrophyPropsSchema } from "./TrophyGraphic";
import { DisciplinaryRecord, DisciplinaryPropsSchema } from "./DisciplinaryRecord";
import { QuoteCard, QuoteCardPropsSchema } from "./QuoteCard";
import { ArticleHeadline, ArticleHeadlinePropsSchema } from "./ArticleHeadline";
import { IntrcptIntro, IntrcptIntroPropsSchema } from "./IntrcptIntro";
import { IntrcptStatBars, IntrcptStatBarsPropsSchema } from "./IntrcptStatBars";
import { IntrcptFormRun, IntrcptFormRunPropsSchema } from "./IntrcptFormRun";
import { IntrcptTactical, IntrcptTacticalPropsSchema } from "./IntrcptTactical";
import { IntrcptBigStat, IntrcptBigStatPropsSchema } from "./IntrcptBigStat";
import { IntrcptLeagueGraph, IntrcptLeagueGraphPropsSchema } from "./IntrcptLeagueGraph";
import { IntrcptTransferRecord, IntrcptTransferRecordPropsSchema } from "./IntrcptTransferRecord";
import { IntrcptQuote, IntrcptQuotePropsSchema } from "./IntrcptQuote";
import { IntrcptChapterWord, IntrcptChapterWordPropsSchema } from "./IntrcptChapterWord";
import { IntrcptConceptCard, IntrcptConceptCardPropsSchema } from "./IntrcptConceptCard";
import { IntrcptClipSingle, IntrcptClipSinglePropsSchema } from "./IntrcptClipSingle";
import { IntrcptScatterPlot, IntrcptScatterPlotPropsSchema } from "./IntrcptScatterPlot";
import { AttackingRadar, AttackingRadarPropsSchema } from "./AttackingRadar";
import { PlayerTrio, PlayerTrioPropsSchema } from "./PlayerTrio";
import { TrioFeature, TrioFeaturePropsSchema } from "./TrioFeature";
import { MapCallout, MapCalloutPropsSchema } from "./MapCallout";
import { AnimatedFactCard, AnimatedFactCardPropsSchema } from "./AnimatedFactCard";
import { TitleCard, TitleCardPropsSchema } from "./TitleCard";
import { AnnotatedImage, AnnotatedImagePropsSchema } from "./AnnotatedImage";
import { SplitComparison, SplitComparisonPropsSchema } from "./SplitComparison";
import { TimelineScroll, TimelineScrollPropsSchema } from "./TimelineScroll";
import { CountdownReveal, CountdownRevealPropsSchema, calculateMetadata as countdownCalculateMetadata } from "./CountdownReveal";
import { StatPulse, StatPulsePropsSchema } from "./StatPulse";
import { MatchMoment, MatchMomentPropsSchema } from "./MatchMoment";
import { TransferProfit, TransferProfitPropsSchema, calculateMetadata as transferProfitCalculateMetadata } from "./TransferProfit";
import { ScoutReport, ScoutReportPropsSchema } from "./ScoutReport";
import { ValueCurve, ValueCurvePropsSchema } from "./ValueCurve";
import { IntrcptTransferProfit, IntrcptTransferProfitPropsSchema, calculateMetadata as transferProfitV2CalculateMetadata } from "./IntrcptTransferProfit";
import {
  VideoSequence,
  VideoSequencePropsSchema,
  calculateMetadata as videoSequenceCalculateMetadata,
} from "./VideoSequence";

import type { CareerTimelineProps } from "./CareerTimeline";
import type { IntrcptTransferRecordProps } from "./IntrcptTransferRecord";

const DEFAULT_TIMELINE: CareerTimelineProps = {
  playerName: "Luis Suárez",
  activeIndex: 0,
  startFrame: 45,
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
          bgColor: "#f0ece4"
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
          bgColor: "#f0ece4"
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
          bgColor: "#f0ece4"
        }}
      />
      <Composition
        id="IntrcptTactical"
        component={IntrcptTactical}
        schema={IntrcptTacticalPropsSchema}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          title: "the press",
          description: "coordinated high press from the front three",
          players: [
            { label: "GK", x: 50, y: 88 },
            { label: "RB", x: 80, y: 72 },
            { label: "CB", x: 62, y: 72 },
            { label: "CB", x: 38, y: 72 },
            { label: "LB", x: 20, y: 72 },
            { label: "CM", x: 65, y: 55 },
            { label: "DM", x: 50, y: 58 },
            { label: "CM", x: 35, y: 55 },
            { label: "RW", x: 78, y: 36 },
            { label: "ST", x: 50, y: 30 },
            { label: "LW", x: 22, y: 36 },
          ],
          arrows: [
            { fromX: 78, fromY: 36, toX: 85, toY: 20, style: "solid"  },
            { fromX: 50, fromY: 30, toX: 50, toY: 15, style: "solid"  },
            { fromX: 22, fromY: 36, toX: 15, toY: 20, style: "solid"  },
            { fromX: 65, fromY: 55, toX: 70, toY: 42, style: "dashed" },
            { fromX: 35, fromY: 55, toX: 30, toY: 42, style: "dashed" },
          ],
          teamColor: "#C8102E",
          bgColor: "#1a1a1a"
        }}
      />
      <Composition
        id="IntrcptBigStat"
        component={IntrcptBigStat}
        schema={IntrcptBigStatPropsSchema}
        durationInFrames={210}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          stat: "31",
          unit: "goals",
          label: "single season record",
          context: "Luis Suarez",
          playerImage: "",
          accentColor: "#C8102E",
          darkMode: false,
          bgColor: "#f0ece4"
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
          maxPosition: 6,
          bgColor:     "#111111",
          teamA: {
            name:  "Liverpool",
            color: "#C8102E",
            data:  [
              { matchday: 1,  position: 4 }, { matchday: 5,  position: 3 },
              { matchday: 10, position: 2 }, { matchday: 20, position: 1 },
              { matchday: 30, position: 1 }, { matchday: 36, position: 2 },
              { matchday: 38, position: 2 },
            ],
          },
          teamB: {
            name:  "Manchester City",
            color: "#6CABDD",
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
        id="IntrcptQuote"
        component={IntrcptQuote}
        schema={IntrcptQuotePropsSchema}
        durationInFrames={240}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          quote: "I am not a diver.",
          attribution: "Luis Suarez",
          playerImage: "suarez.jpg",
          accentColor: "#C8102E",
          bgColor: "#f0ece4"
        }}
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
          bgColor: "#f0ece4"
        }}
      />
      <Composition
        id="IntrcptConceptCard"
        component={IntrcptConceptCard}
        schema={IntrcptConceptCardPropsSchema}
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
          bgColor:    "#f0ece4"
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
          playerName:  "Luis Suárez",
          club:        "Liverpool",
          season:      "2013–14",
          competition: "Premier League",
          badgeSlug:   "liverpool.svg",
          clubColor:   "#C8102E",
          bgColor:     "#f0ece4",
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
        id="TransferAnnouncement"
        component={TransferAnnouncement}
        schema={TransferAnnouncementPropsSchema}
        durationInFrames={270}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          playerName:    "Luis Suárez",
          fromClub:      "Liverpool",
          toClub:        "Barcelona",
          fromBadgeSlug: "liverpool.svg",
          toBadgeSlug:   "barcelona.svg",
          fromColor:     "#C8102E",
          toColor:       "#004D98",
          fee:           "£75m",
          year:          "2014",
          nationality:   "Uruguayan",
          bgColor:       "#f0ece4",
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
        id="TrophyGraphic"
        component={TrophyGraphic}
        schema={TrophyPropsSchema}
        durationInFrames={240}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          trophyName: "Premier League",
          trophyYear: "2013-14",
          clubName:   "Man City",
          bgColor:    "#f0ece4",
        }}
      />
      <Composition
        id="DisciplinaryRecord"
        component={DisciplinaryRecord}
        schema={DisciplinaryPropsSchema}
        durationInFrames={240}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          playerName: "Suarez",
          bgColor:    "#f0ece4",
        }}
      />
      <Composition
        id="QuoteCard"
        component={QuoteCard}
        schema={QuoteCardPropsSchema}
        durationInFrames={240}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          quote:       "I apologize.",
          attribution: "Suarez",
          bgColor:     "#f0ece4",
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
          title:            "Where it all began",
          titleSize:        64,
          calloutCity:      "bournemouth",
          calloutText:      "Bournemouth",
          calloutDirection: "left",
          accentColor:      "#DA291C",
          bgColor:          "#f0ece4",
          darkMode:         false,
          pins: [
            { city: "manchester",  label: "Manchester",  highlighted: false },
            { city: "liverpool",   label: "Liverpool",   highlighted: false },
            { city: "london",      label: "London",      highlighted: false },
            { city: "bournemouth", label: "Bournemouth", highlighted: true  },
          ],
        }}
      />
      <Composition
        id="AnimatedFactCard"
        component={AnimatedFactCard}
        schema={AnimatedFactCardPropsSchema}
        durationInFrames={240}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          fact:            "31 goals in a single Premier League season.",
          highlightPhrase: "31 goals",
          subtext:         "A record that stood for over a decade.",
          source:          "Premier League · 2013–14",
          accentColor:     "#C8102E",
          bgColor:         "#f0ece4",
          darkMode:        false,
        }}
      />
      <Composition
        id="TitleCard"
        component={TitleCard}
        schema={TitleCardPropsSchema}
        durationInFrames={180}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          chapter:     "Act II",
          title:       "The Rise",
          subtitle:    "From relegation battlers to title contenders",
          accentColor: "#C8102E",
          style:       "bold",
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
        id="SplitComparison"
        component={SplitComparison}
        schema={SplitComparisonPropsSchema}
        durationInFrames={270}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          label:        "THEN vs NOW",
          leftLabel:    "1992",
          rightLabel:   "2024",
          leftValue:    "22 Clubs",
          rightValue:   "20 Clubs",
          leftSubtext:  "Original Premier League with 22 founding members",
          rightSubtext: "Reduced to 20 clubs from 1995 onwards",
          leftColor:    "#C8102E",
          rightColor:   "#034694",
          bgColor:      "#f0ece4",
          stats:        [],
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
      <Composition
        id="MatchMoment"
        component={MatchMoment}
        schema={MatchMomentPropsSchema}
        durationInFrames={270}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          homeTeam:    "Liverpool",
          awayTeam:    "Barcelona",
          homeScore:   4,
          awayScore:   0,
          competition: "UEFA Champions League",
          date:        "7 May 2019",
          context:     "Semi-Final · Second Leg",
          accentColor: "#C8102E",
          bgColor:     "#0a0a0a",
          homeColor:   "#C8102E",
          awayColor:   "#004D98",
        }}
      />

      {/* ── Brentford / Transfer Model Components ───────────────────────────── */}
      <Composition
        id="TransferProfit"
        component={TransferProfit}
        schema={TransferProfitPropsSchema}
        calculateMetadata={transferProfitCalculateMetadata}
        durationInFrames={1900}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          title:       "The Brentford Model",
          subtitle:    "buy smart · develop · sell for profit",
          currency:    "£",
          accentColor: "#E30613",
          profitColor: "#C9A84C",
          bgColor:     "#f0ece4",
          darkMode:    false,
          showTotal:   true,
          dwellFrames: 300,
          players: [
            { name: "Neal Maupay",   imageSrc: "maupay.png",   origin: "St Étienne",   buyFee: 1.6,  sellFee: 20,  buyYear: 2017, sellYear: 2019, toClub: "Brighton",    sold: true,  estValue: 0 },
            { name: "Ollie Watkins", imageSrc: "watkins.png",  origin: "Exeter City",  buyFee: 1.8,  sellFee: 28,  buyYear: 2017, sellYear: 2020, toClub: "Aston Villa", sold: true,  estValue: 0 },
            { name: "Said Benrahma", imageSrc: "benrahma.png", origin: "OGC Nice",     buyFee: 1.2,  sellFee: 25,  buyYear: 2018, sellYear: 2021, toClub: "West Ham",    sold: true,  estValue: 0 },
            { name: "Ivan Toney",    imageSrc: "toney.png",    origin: "Peterborough", buyFee: 10,   sellFee: 40,  buyYear: 2020, sellYear: 2024, toClub: "Al-Ahli",     sold: true,  estValue: 0 },
            { name: "Bryan Mbeumo",  imageSrc: "mbeumo.png",   origin: "Troyes",       buyFee: 1.0,  sellFee: 65,  buyYear: 2019, sellYear: 2025, toClub: "Man Utd",     sold: true,  estValue: 0 },
          ],
        }}
      />
      <Composition
        id="ScoutReport"
        component={ScoutReport}
        schema={ScoutReportPropsSchema}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          playerName:   "Ollie Watkins",
          origin:       "Exeter City",
          league:       "EFL League Two",
          signingFee:   "£1.8m",
          signingYear:  "2017",
          playerAge:    21,
          headline:     "25 goals in 35 Championship appearances",
          headlineStat: "25",
          headlineUnit: "Championship goals",
          accentColor:  "#E30613",
          bgColor:      "#0f0f0f",
          lightMode:    false,
          metrics: [
            { label: "Goals",       value: "25",    detail: "Championship 19/20",  bar: 92 },
            { label: "Assists",     value: "7",     detail: "same season",         bar: 78 },
            { label: "Shots/90",    value: "3.4",   detail: "top 5% in league",    bar: 96 },
            { label: "Dribbles/90", value: "2.1",   detail: "direct runner",       bar: 85 },
            { label: "Age signed",  value: "21",    detail: "high sell-on value",  bar: 70 },
            { label: "Fee paid",    value: "£1.8m", detail: "below market value",  bar: 12 },
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
            // ── Scene 2 — big stat card ────────────────────────────────────
            {
              compositionId:   "IntrcptBigStat",
              durationInFrames: 210,
              transition:       "dataLine",
              accentColor:      "#C8102E",
              props: {
                stat:       "31",
                unit:       "goals",
                label:      "single season record",
                context:    "Luis Suárez · 2013–14",
                playerImage: "",
                accentColor: "#C8102E",
                darkMode:    false,
                bgColor:    "#f0ece4",
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
            // ── Scene 5 — quote card ───────────────────────────────────────
            {
              compositionId:   "IntrcptQuote",
              durationInFrames: 240,
              transition:       "paper",
              props: {
                quote:        "I am not a diver.",
                attribution:  "Luis Suarez",
                playerImage:  "suarez.jpg",
                accentColor:  "#C8102E",
                bgColor:      "#f0ece4",
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
    </>
  );
};