# Remotion Template Issues & Redesign Log

Captured 2026-04-24 from a storyboard review pass. Each entry lists the current problem, why it matters, and a direction for the fix. Work items are grouped by severity.

---

## 1. IntrcptConceptCard — **rename** ✅ DONE 2026-04-24

**File was:** `src/IntrcptConceptCard.tsx` → **now:** `src/IntrcptClipCompare.tsx`

**Problem.** Misnamed. It is a **side-by-side comparison window for two footage frames**. The name "ConceptCard" was ambiguous, so the storyboard LLM kept routing single-concept topics to it — e.g. _"the globalization of football tactics and its impact on traditional styles"_ — which is one abstract concept, not a two-item comparison. The template renders empty placeholder frames when given a single topic.

**Resolution.**
- Renamed component: `IntrcptConceptCard` → `IntrcptClipCompare` (pairs with existing `IntrcptClipSingle`).
- Schema + type + exports renamed to match.
- Updated `Root.tsx`, `VideoSequence.tsx`, `IntrcptSeasonTimeline.tsx` (comment), `docs/motion-design-principles.md`, `STYLE_GUIDE.md` (gold-standard table).
- Engine side: `youtube/engine/utils/remotion_renderer.py`, `server.py` (composition schemas, `_COMP_META`, tag-key routing, frontend starterProps), `motion_signature.json`, `agents/graphics_agent.py`, `agents/motion_agent.py`, `bugs.md`.
- **`[INTRCPT CONCEPT]` tag deprecated** in `visual_grammar.md` — marked do-not-use, LLM directed to `[CLIP COMPARE: ...]` or narration for single concepts. `INTRCPT CONCEPT` still aliased to `IntrcptClipCompare` in the router as a safety net for any legacy scripts.

**Not done (future work):** the zod schema could be tightened so both `clipLeft` and `clipRight` are required strings (currently `.default("")`) — would hard-fail rather than silently render the "clip" placeholder when the LLM provides only labels.

---

## 2. IntrcptTactical — arrows are not broadcast quality

**File:** `src/IntrcptTactical.tsx`

**Problems.**
- Arrows are geometrically "all over the place" — straight lines drawn between blunt endpoints, with only a `strokeDashoffset` draw-on. No curvature, no tapering, no sense of runs.
- Clearance math (`DOT_R + 10` for solid, `DOT_R + 6` for dashed) is a hack that still leaves visible overlap/gap inconsistencies.
- Player dots pop in with a basic spring and then sit static. No sense of coordinated movement / press — everything is frozen while arrows draw.
- The `arrow-glow` feGaussianBlur over a white line reads as fuzz, not a broadcast graphic.

**Fix direction.**
- Replace straight `<line>` arrows with **curved `<path>` arrows** (quadratic or cubic Bézier). Natural "run" curvature — off-ball runs are never straight.
- Draw-on via `stroke-dasharray` + `pathLength` for a single normalized timeline rather than per-arrow segLen math.
- Taper the stroke: thicker near the origin, thinner into the arrowhead (either via a `<linearGradient>` along the path, or an SVG marker that visually continues the stroke).
- Give the **players** subtle directional drift toward their arrow's origin during the arrow phase — so the pitch feels like a coordinated press, not a static diagram.
- Replace the Gaussian blur "glow" with a soft drop-shadow filter (cleaner on white-on-grass).
- Stagger: arrows should feel conducted (musical), not mechanical. Ease-out with slight overshoot on the arrowhead.
- Consider an "aftertrail" — a dim ghost of the arrow that lingers briefly after the arrowhead arrives.

---

## 3. TeamLineup — readability pass only

**File:** `src/TeamLineup.tsx`

**Status.** Composition is fundamentally OK.

**Issues.**
- Surname labels on pitch use a heavy `textShadow` stack — still hard to read against bright grass stripes for lighter surnames.
- Player-list rows are cramped (`padding: "6px 10px"`, `gap: 2`). Names truncate too aggressively at 16px.
- The left panel's "vs {opposition}" and date block competes visually with the team name.
- Position labels on the list at 20px are **larger** than the player name at 16px — hierarchy is inverted.

**Fix direction.**
- Add a darker scrim / blur pill behind each on-pitch name label so it doesn't depend on a raw textShadow hack.
- Bump row padding, bring name up to 18–20px, drop position label to 14px, align with muted color.
- Tighten the left-panel info rhythm: clearer type scale (team name → fixture → formation pill → roster).

---

## 4. IntrcptBigStat — **full redesign**

**File:** `src/IntrcptBigStat.tsx`

**Verdict.** "Rubbish" per user. Needs to be redesigned entirely.

**What a broadcast big-stat looks like.** One hero number, contextualized by a tiny sparkline / scale / comparator, with a single-clause caption. Currently this template reads like a slide, not a motion graphic.

**Fix direction.**
- Hero number should **count up** (similar to TournamentBracket's `getDisplayScore`) with ease-out cubic.
- Behind the number: a faint oversized "ghost" of the same digits, offset, for depth.
- Below / beside the number: one small comparator (league average, previous season, peer) rendered as a short bar or dot-scale — don't leave the number unanchored.
- Strong hierarchy: stat → unit → caption → source. Currently it's muddy.
- Use **accent color driven by worldState** rather than a hardcoded red.

---

## 5. IntrcptPlayerReveal — **rename** ✅ DONE 2026-04-24

**File was:** `src/IntrcptPlayerReveal.tsx` → **now:** `src/IntrcptPlayerRevealTrio.tsx`

**Problem.** Template reveals multiple overlapping player portraits (canonical = three) but the name implied a single-player reveal, causing the storyboard LLM to route single-player reveals here.

**Resolution.**
- Renamed component + schema + type + `calculateMetadata` export.
- Updated doc header to explicitly call out "canonical 3-player, accepts 1–4, do NOT use for single-player reveals".
- Updated `Root.tsx`, `VideoSequence.tsx`, `IntrcptSeasonTimeline.tsx` comments, `STYLE_GUIDE.md` gold-standard table, `docs/motion-design-principles.md` (two references).
- Engine side: `motion_signature.json`, `agents/motion_agent.py` (description rewritten with "NOT single-player" guard), `templates/design_system.md`.
- **Note:** the engine only references this as a description string for `motion_agent.py` (no `_render_player_reveal` in `remotion_renderer.py`, no tag-key routing) — so rendering is driven by direct composition calls, which now use the new ID.

**Not done (future work):** schema still accepts 1–4 players. User suggested tightening to exactly three (tuple). Not changed — callers may rely on the 1–4 range; needs confirmation before narrowing.

---

## 6. ScoutReport — theme, image slot, motion design

**File:** `src/ScoutReport.tsx`

**Problems.**
- Dark theme is visually heavy and doesn't fit the rest of the (mostly paper-light) design language.
- **No space for a player image.** A scout report without a face is just a list.
- No exciting motion — static rows fading in.

**Fix direction.**
- Switch to the shared paper / light background by default, with a dark variant available via prop.
- Left column: large **player portrait** (SmartImg with badge), club badge overlay, name block.
- Right column: scout attributes — but animated with **per-attribute bar-fill** springs, a "radar print" sweep, or flip-in numbers.
- Consider a subtle "stamp" or "classified"-style treatment on header to give it character without being try-hard.

---

## 7. CountdownReveal — layout collision + hardcoded red

**File:** `src/CountdownReveal.tsx`

**Problems.**
- **Top-left text overlaps the centre animation.** Likely a hardcoded absolute position that doesn't account for the central number/badge at full scale.
- **Red accents for everything.** Countdown is used for per-club player reveals — red on an Everton player is wrong. On a Liverpool player it's fine by coincidence.

**Fix direction.**
- Move top-left header block into a proper safe area (or make it top-left ONLY during idle frames, and slide it off before the hero animation peaks).
- Accept a `teamColor` prop (or read it from worldState) and drive every accent — ring, underline, glow, stroke — from it. Fall back to a neutral gold/amber rather than red.

---

## 8. MapCallout — **complete overhaul**

**File:** `src/MapCallout.tsx`

**Problems.**
- The UK silhouette "looks nothing like" the UK. Likely a hand-coded SVG path approximation that's too rough.
- Location text is weirdly placed on the center (probably anchored to map centroid, but lands on top of the graphic).
- No real map features — no coastline detail, no regions, no roads/rivers, just a blob.

**Fix direction.**
- Replace the hand-drawn path with a proper GeoJSON outline of the UK (or target country), projected via a small helper (d3-geo is overkill but the math is trivial — Mercator for a static frame).
- Drop a **pin / marker** at the target lat/lng, with a callout **line to a label** placed in safe space (not on the map body).
- Animate: map fades in, pin drops with spring + bounce, callout line draws, label types in.
- Add regional shading or a graticule for texture — don't rely on a flat silhouette.
- Use shared `Grain` + paper bg for consistency.

---

## 9. ArticleHeadline — too text-heavy

**File:** `src/ArticleHeadline.tsx`

**Problem.** Reads as a slide of text. No newspaper feel, no visual device, no movement of interest.

**Fix direction.**
- Add a real newsprint aesthetic: column rules, a masthead, a dateline, a cropped lede paragraph with justified text.
- Headline: large serif with a controlled **letter-by-letter or word-by-word reveal**, not a single opacity fade.
- Add supporting visual — either a cropped image slot (SmartImg) or a pull-quote + author byline.
- Optional: subtle paper jitter / rotation to sell the newsprint.
- Vary layout between "splash headline" and "tabloid screamer" depending on worldState tone.

---

## 10. PlayerStats — "AI slop" — audited 2026-04-24

**File:** `src/PlayerStats.tsx` (233 lines)

**Concrete style-guide violations (read against STYLE_GUIDE.md + motion-design-principles.md).**

1. **No camera movement.** Template is a static 2×2 card grid that fades in once and sits still. Violates §1 "Every template has camera movement … static full-screen cards are forbidden" and §10 checklist item 1.
2. **No portrait / hero image slot.** A player stats card with no face is a slide. Violates §5 portrait requirement — a player-subject template must have the 680px masked portrait with mandatory vignettes.
3. **Box-shadows on content cards.** `boxShadow: "0 6px 28px rgba(0,0,0,0.07)"` on every card (line 176) violates §4 "No box shadows on content."
4. **Accent colour used as decorative chrome.** Top "accent bar" gradient on every card (lines 183–188) uses `clubColor` as a flat decorative strip, and the ambient blur circle top-right (lines 53–63) is a radial colour wash behind data. Both violate §4 "Accent colour belongs on data only … no radial colour washes behind data."
5. **Blur filter behind content.** `filter: "blur(60px)"` on the top-right ambient circle violates §4 "No glow effects."
6. **Card borders + large radius.** `borderRadius: 20` + `1px solid COLORS.cardBorder` pushes the aesthetic toward UI-card / Figma-template, not editorial / documentary. No gold-standard template uses bordered rounded cards.
7. **No active-state pattern.** Stats reveal once and stay at opacity 1 forever. Violates §6 "Active-state pattern (mandatory for lists, rows, timelines)" — there's no spring-accumulation transition between a focused stat and the next.
8. **Stagger is weak.** 12-frame gap between cards (line 141) is under the §6 "14–20 frame" minimum.
9. **Hierarchy is flat.** All four stats rendered identically (same number size, same label treatment). Violates §3 Typography intent and the general "hero stat" rule — nothing reads as the focal number.
10. **No count-up easing curve.** `countProgress` is a linear interpolate (line 45), no `Easing.out`. Numbers tick at constant rate — reads mechanical, matches the TournamentBracket count-up feedback to use eased curves.

**Redesign direction (ranked).**
1. **Add portrait.** Left 680px masked portrait (use `IntrcptPlayerRevealTrio` mask + top/bottom vignettes — exact §5 implementation). Player face anchors the frame.
2. **Camera.** Open zoomed in on the hero number, pull back to reveal supporting stats. Or slow horizontal pan across the card row.
3. **Pick a hero.** Largest card / leftmost card = one stat at 160–180px (per §3 "Big stat number" scale) with a count-up on ease-out-cubic. Supporting stats at 60–80px.
4. **Strip decorative chrome.** Remove the accent bar, the ambient blur, the card borders, the box-shadows. Paper bg + Grain + typographic hierarchy carries the design.
5. **Category grouping.** If 4+ stats, group by attacking / creating / defending with small serif section labels in uppercase tracking; inside each group a single hero stat.
6. **Active-state reveal.** Each stat reveals via the `activeState` spring-subtraction pattern (§6), then dims to 0.22–0.35 as the next becomes active — lets the camera / narration advance focus through the card.
7. **Comparator or scale per stat.** Beside each number: a tiny dot-scale / sparkline / league-average tick mark so the number has context. "32 goals" means nothing without "(#1 in league)" or similar.
8. **Eased count-up.** `interpolate(frame, [40, 95], [0, 1], { easing: Easing.out(Easing.cubic) })` — matches the TournamentBracket odometer feel.

---

## 11. CareerTimeline — colors and motion

**File:** `src/CareerTimeline.tsx`

**Problems.**
- "Weird colors throughout" — probably a palette that doesn't match shared.tsx `COLORS`.
- No motion design — static timeline that just appears.

**Fix direction.**
- Audit every color against `shared.ts` `COLORS` + the incoming `teamColor`. Remove any ad-hoc hex values.
- Each career node (club) should enter with a spring scale+fade, ideally sequenced along the timeline (left-to-right draw-on).
- The connecting timeline rail should **draw-on** (stroke-dashoffset from tail to head) as the story advances.
- Consider a horizontal scrolling / camera-pan effect if there are many clubs.
- Club badges should scale up + sync to the node's entry.

---

## 12. PlayerTrio & TrioFeature — masking/blending

**Files:** `src/PlayerTrio.tsx`, `src/TrioFeature.tsx`

**Problem.** Masking and blending between the three player cutouts looks rough — hard edges, or over-soft feathering, or the cutouts fight each other where they overlap.

**Fix direction.**
- Standardize a single **SVG mask / feather** used by both templates so they share a look.
- Use a radial gradient alpha mask (soft-edged ellipse) per cutout rather than a hard rect.
- Blend overlap regions with a mix-blend-mode or a shared vignette so adjacent cutouts fade into each other rather than clashing.
- Background gradient should be driven by `worldState.accentColor` — not a static palette.
- Add a subtle parallax: each of the three cutouts drifts at a slightly different rate on camera.

---

## 13. IntrcptChapterWord — image blending

**File:** `src/IntrcptChapterWord.tsx`

**Problem.** Images behind/alongside the chapter word need better blending and effects — currently they read as raw photos dropped in.

**Fix direction.**
- Apply a consistent **duotone / tritone** treatment to all chapter images (filter: grayscale + tinted overlay) for visual cohesion.
- Feathered / vignetted edges so images don't terminate with a hard rectangle.
- Optional Ken Burns (slow scale + pan) for each image.
- The chapter word should sit **integrated** with the image (e.g., clipped or multiply-blended against it), not floating on top.

---

## 14. IntrcptLeagueGraph — "really poor"

**File:** `src/IntrcptLeagueGraph.tsx`

**Problems.**
- Rendered in black — inconsistent with the paper-light design language used elsewhere.
- **No grain background** — missing the shared texture.
- "Strange way to present the data" — presentation choice itself is off.

**Fix direction.**
- Switch to shared `PaperBackground` + `Grain` for visual consistency.
- If the current presentation is e.g. a scatter of dots, reconsider: a ranked bar chart, a small-multiples grid, or a sparkline-per-team layout may read more clearly.
- Lines / bars should **draw-on** with a staggered spring — no static chart.
- Axes and gridlines should be whisper-light (`rgba(0,0,0,0.08)`), labels in `fontFamily` uppercase tracking.
- Highlight the subject team in `teamColor`; render peers in muted gray. Don't treat everything equally.

---

# Cross-cutting fixes

Patterns that show up across multiple templates and should be addressed once, in shared code:

1. **Hardcoded red accents.** Multiple templates default to `#C8102E` or similar. Replace with `worldState.accentColor` / `teamColor` with a neutral fallback.
2. **No `Grain` + paper bg.** At least IntrcptLeagueGraph and ScoutReport skip the shared texture; makes them look like a different product.
3. **Static entry animations.** Many templates fade in then sit still for the duration. Every hero element should have either a continuous micro-motion (breathing, drift, parallax) or a clear exit animation — not both-ends-static.
4. **Naming honesty.** Rename anything whose name doesn't match what it does (ConceptCard → Comparison, PlayerReveal → PlayerRevealTrio). The storyboard LLM is routing based on names, so ambiguous names cause misuse.

---

# Suggested work order

1. **Renames first** (ConceptCard, PlayerReveal) — cheap, but unblocks storyboard accuracy immediately.
2. **Full redesigns** (IntrcptBigStat, MapCallout, PlayerStats) — each is its own focused session.
3. **Motion/arrows pass** (IntrcptTactical) — single heavy redesign.
4. **Visual cohesion sweep** (IntrcptLeagueGraph, IntrcptChapterWord, CareerTimeline, ScoutReport, ArticleHeadline) — bring all into shared design language.
5. **Polish** (TeamLineup readability, CountdownReveal layout + teamColor, PlayerTrio/TrioFeature blending).
