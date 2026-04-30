# video-engine-remotion

> Companion Remotion render project for **[The Documentary Engine](https://github.com/ncoulthurst/documentary-engine)** — the animated graphic compositions used to render AI-generated football documentaries.

[REPLACE: hero screenshot or short GIF showing 3–4 compositions stitched together]

## What this is

This repo contains the React/Remotion side of a two-repo system:

- **The engine** ([documentary-engine](https://github.com/ncoulthurst/documentary-engine)) decides *what* to make. It runs LLM agents that produce a full 5-act script with embedded `[TAG: content]` markers describing every graphic the documentary needs.
- **This project** decides *how it looks*. Each tag maps to a Remotion composition here (`HeroBigStat.tsx`, `CareerTimeline.tsx`, `TournamentBracket.tsx`, …). The engine shells out to `npx remotion render <CompositionId>` for every tag, then stitches the resulting `.mp4` clips into a final cut via `VideoSequence.tsx`.

You can also use this repo on its own as a Remotion Studio project to design and preview compositions interactively.

## Compositions

There are ~45 compositions in `src/`. They fall into three families:

**Hero series** — cinematic, full-bleed, paper/dark backgrounds with film grain. The dominant visual language for the channel.

| Composition | Purpose |
|---|---|
| `HeroIntro` | Title card, always scene 1 |
| `HeroOutro` | Closing card with subscribe ask |
| `HeroBigStat` | Single huge stat with context |
| `HeroStatBars` | Side-by-side bar comparison |
| `HeroFormRun` | W/D/L sequence for title-race form |
| `HeroTactical` | Pitch diagram with players + arrows |
| `HeroLeagueGraph` | Line chart of league position over a season |
| `HeroTransferRecord` | Transfer-fee timeline bars |
| `HeroQuote` | Pull quote with player image |
| `HeroChapterWord` | One-word act break |
| `HeroClipCompare` / `HeroClipSingle` | Footage frames |
| `HeroScatterPlot` | XY stat scatter |
| `HeroShotMap` | xG shot location map |
| `HeroMatchTimeline` | Single-match goals/cards timeline |
| `HeroAwardsList` | Year-by-year award podium |
| `HeroComparisonRadar` | Two-player overlaid radar |
| `HeroSeasonTimeline` | Cold-open / manager career arc |
| `HeroNewsFeed` | Rolling typewriter headlines with world-pan |
| `HeroTransferProfit` | Buy-low / sell-high analysis bars |
| `HeroPlayerRevealTrio` | Three full-height masked portraits |
| `HeroPhotoReel` / `HeroContactSheet` | Polaroid / archival sequences |
| `HeroDualPanel` | Side-by-side parallel-event canvas |
| `HeroGoalRush` | Season-by-season tally rows counting up |
| `HeroHeadlineStack` | Editorial headline reveals |

**Data templates** (driven by structured stats from the engine):

`AttackingRadar`, `CareerTimeline`, `MatchResult`, `PlayerStats`, `PlayerTrio`, `TeamLineup`, `PremierLeagueTable`, `TopScorersTable`, `TournamentBracket`, `SeasonComparison`, `DisciplinaryRecord`, `QuoteCard`, `ScoutReport`, `TimelineScroll`, `CountdownReveal`, `ValueCurve`, `ArticleHeadline`, `MapCallout`, `AnnotatedImage`, `StatPulse`, `PortraitStatHero`, `PortraitWithBars`, `TrioFeature`.

**Stitching layer:**

| File | Role |
|---|---|
| `VideoSequence.tsx` | Master composition — takes `scenes[]` array, handles all transitions, hosts the world-state camera |
| `ChapterTransition.tsx` | Six transition types: `push`, `flash`, `letterbox`, `paper`, `dataLine`, `grain` |
| `shared.tsx` | Design tokens — `COLORS`, `SPRINGS`, `PaperBackground`, `DarkBackground`, `SmartImg`, `Grain` |
| `lib/worldRegistry.ts` | Per-composition background-world classification (used by VideoSequence to coordinate cross-scene cameras) |
| `lib/stockFormations.ts` | Canonical pitch layouts for tactical templates |
| `lib/motionKit.ts` | Shared motion primitives — easings, frame-count constants |

## Design system

See **[STYLE_GUIDE.md](STYLE_GUIDE.md)** for the full design rules: typography, colour palette, framing constants, the Hero series visual language, and what makes a "gold standard" template.

See **[docs/motion-design-principles.md](docs/motion-design-principles.md)** for the motion philosophy — when to use `worldPan` vs `push` vs `evolve`, how to layer image / grain / content, and the portrait masking technique.

## Setup

```bash
git clone https://github.com/ncoulthurst/video-engine-remotion.git
cd video-engine-remotion
npm install
npm run start          # opens Remotion Studio at http://localhost:3000
```

Render a single composition to disk:

```bash
npx remotion render HeroBigStat out/test.mp4 --props='{"stat":"31","unit":"goals","label":"Premier League 2013/14","context":"Luis Suárez"}'
```

## Using with The Documentary Engine

Point the engine at this project via the `REMOTION_PROJECT_PATH` env var:

```bash
# In the engine's .env
REMOTION_PROJECT_PATH=/absolute/path/to/video-engine-remotion
```

The engine's `graphics_agent.py` then dispatches `npx remotion render <CompositionId>` calls into this project for every `[TAG: ...]` it parses out of the script.

## Status

Personal project, not production-ready. Treat this as a portfolio piece. Some templates are gold-standard (see STYLE_GUIDE.md §0); others are flagged for redesign in their own files. There is no test suite — visual verification is via Remotion Studio.

## Author

Nathan Coulthurst — [REPLACE: portfolio URL]

## License

MIT — see [LICENSE](LICENSE).
