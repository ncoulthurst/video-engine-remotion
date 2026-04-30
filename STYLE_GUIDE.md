# Hero Motion Design System — Remotion Templates

**The canonical reference for all template design, layout, animation, and code patterns.**
All new templates must conform exactly. The approved templates are the source of truth.

---

## 0. Approved Templates (Do Not Touch)

| Template | File | Notes |
|---|---|---|
| HeroSeasonTimeline | `HeroSeasonTimeline.tsx` | Gold standard for portraits + timeline |
| HeroNewsFeed | `HeroNewsFeed.tsx` | Gold standard for world-pan + typewriter |
| HeroTransferProfit | `HeroTransferProfit.tsx` | Gold standard for narrated row reveals |
| CountdownReveal | `CountdownReveal.tsx` | Gold standard for ranked list + camera |
| TimelineScroll | `TimelineScroll.tsx` | Gold standard for horizontal camera scroll |
| HeroPlayerRevealTrio | `HeroPlayerRevealTrio.tsx` | Gold standard for portrait masking method (renamed 2026-04-24 from HeroPlayerReveal) |

**Mediocre (concept valid, needs rework):** HeroLeagueGraph, HeroChapterWord, HeroScatterPlot, MapCallout, ScoutReport, HeroAwardsList

---

## 1. The Aesthetic

**One sentence:** Cinematic, editorial, documentary — like BBC Sport or ESPN 30-for-30, not social media cards.

**What this means in practice:**
- Every template has camera movement (pan, zoom, or scroll). Static full-screen cards are forbidden.
- Depth comes from three visual planes: background → portrait image → foreground content.
- Data and hierarchy are revealed progressively in sync with narration timing, never dumped on screen at once.
- Grain texture is mandatory. It is what separates film from digital.
- Serif type for everything important. Sans-serif for small labels only.

---

## 2. Backgrounds & Layering

### Background Modes
- **Paper (default):** `<PaperBackground />` — warm off-white `#f0ece4`
- **Dark:** `<DarkBackground />` — near-black `#111111`

### The Sandwich Stack (Mandatory Z-Order)

```
Z-Index  0  →  Background component (Paper or Dark)
Z-Index  1  →  Portrait / side image (masked)
Z-Index  2  →  <Grain /> (must sit on top of image, below content)
Z-Index 10  →  Foreground content (text, bars, SVG, data)
Z-Index 30  →  Fixed headers (visible during camera pans)
```

**Rules:**
- `<Grain />` is ALWAYS the last element rendered in JSX so it stacks correctly.
- `<Grain />` ALWAYS has `pointerEvents: "none"`.
- No exceptions to this order. Layers out of order produce flat, cheap-looking output.

---

## 3. Typography

### Font Families
- **Serif (Display):** `serifFontFamily` — Playfair Display, weight **900**, used for all anchors
- **Sans (Body/Data):** `fontFamily` — Inter, weights 400–900, used for labels only

### Mandatory Size Scale

| Element | Size | Family | Weight | Letter-spacing |
|---|---|---|---|---|
| Main title / composition name | 58–72px | Serif | 900 | -2 to -3 |
| Player name / hero name | 64–90px | Serif | 900 | -3 to -4 |
| Big stat number | 120–180px | Serif | 900 | -4 to -6 |
| Year / rank label | 20–38px | Serif | 900 | -0.5 to -1 |
| Row headline | 22–30px | Serif | 900 | -0.5 |
| Body / description text | 12–16px | Sans | 400–500 | 0.1–0.5 |
| Small meta / badge label | 11–13px | Sans | 600–700 | 1–4 (uppercase) |
| Source / publication label | 26–32px | Sans mono | 700 | -0.5 |

**Rules:**
- Serif for EVERYTHING with visual weight: titles, names, numbers, years, ranks.
- Sans for SMALL supporting text only: dates, clubs, sub-labels, descriptions.
- Never use sans-serif for a headline. Never use serif for a label.
- Negative letter-spacing on serif numbers is mandatory — it gives mass and authority.

---

## 4. Colour System

### Core Palette

| Role | Value | Usage |
|---|---|---|
| Paper background | `#f0ece4` | Default bg |
| Dark background | `#111111` | Dark mode bg |
| Text on paper | `#111` | All body text on paper |
| Text on dark | `#f5f0e8` | All body text on dark |
| Accent red | `#C8102E` / `#E30613` | Data highlights, active nodes |
| Gold | `#C9A84C` | Awards, trophies only — never used decoratively |
| Muted (paper) | `rgba(0,0,0,0.32–0.45)` | Inactive items on paper |
| Muted (dark) | `rgba(255,255,255,0.35–0.50)` | Inactive items on dark |
| Cream accent text | `#E8E0D0` | Secondary text on dark backgrounds |

### Result Colours (Mandatory for Form / Match Data)

| Result | Colour |
|---|---|
| Win (W) | `#22c55e` |
| Loss (L) | `#ef4444` |
| Draw (D) | `#f59e0b` |

### Colour Rules
- Accent colour belongs on **data only**: numbers, active nodes, highlighted names. Never on decorative chrome.
- Gradients must be purposeful (vignettes, masks). Decorative gradients on text or backgrounds are forbidden.
- Inactive items dim to `0.22–0.35` opacity — they are present but subordinate, not hidden.
- No glow effects. No box shadows on content. No radial colour washes behind data.

---

## 5. Portrait Images (Side Images)

This is the defining visual technique of the hero aesthetic. Get it exactly right.

### Container

```tsx
<div style={{
  position:        "absolute",
  left:            0,          // or right: 0 for right-side portraits
  top:             0,
  width:           680,        // always 680px — never percentage
  height:          "100%",     // full frame height
  overflow:        "hidden",
  opacity:         portraitOp * 0.88,   // max opacity 0.88 — never 1.0
  WebkitMaskImage: PORTRAIT_MASK,
  maskImage:       PORTRAIT_MASK,
  zIndex:          1,
  // NO background colour — the mask handles all blending
}}>
```

### The Mask (Mandatory)

```tsx
const PORTRAIT_MASK = "linear-gradient(to right, transparent, black 350px, black 85%, transparent)";
```

- Left edge fades in over 350px (soft portrait entrance)
- Solid black (fully visible) from 350px to 85% of container width
- Right edge fades out from 85% to 100% (blend into background)
- **Never** use a hard left or right edge. Both edges must fade.

### Image Element

```tsx
<SmartImg
  src={src}
  style={{
    width:          "100%",
    height:         "110%",        // taller than container — bottom overflow clips into vignette
    objectFit:      "cover",
    objectPosition: "top center",  // always top — don't cut off the face
    display:        "block",
  }}
/>
```

Note: **no `position: absolute`** on the image itself.

### Vignettes (Mandatory, both always present)

```tsx
{/* Bottom vignette — dissolves feet into background */}
<div style={{
  position:      "absolute",
  bottom:        0, left: 0, right: 0,
  height:        380,
  background:    `linear-gradient(to top, ${bgColor} 0%, ${bgColor} 16%, transparent 100%)`,
  pointerEvents: "none",
}} />

{/* Top vignette — softens the crown */}
<div style={{
  position:      "absolute",
  top:           0, left: 0, right: 0,
  height:        70,
  background:    `linear-gradient(to bottom, ${bgColor} 0%, transparent 100%)`,
  pointerEvents: "none",
}} />
```

### Portrait Entry Animation

```tsx
const portraitOp = spring({ fps, frame: frame - PORTRAIT_IN_F, config: { damping: 28, stiffness: 55 } });
const portraitX  = interpolate(portraitOp, [0, 1], [-PORTRAIT_W * 0.55, 0]);
```

Portrait always slides in from the left (`translateX` or `left` interpolation). Never fades in from full opacity. Always enters slightly underscreen and rises to position.

### Collision Prevention

When a portrait is present, the foreground content area **must** be narrowed to avoid overlapping the subject's face:
- Without portrait: content starts at `x = 130–140px`
- With portrait: content starts at `x = 748–780px` (portrait width + gap)
- Bar chart max width reduces from `~1000px → ~520px`

---

## 6. Animation & Motion

### Motion Design Quality Bar

This is what we mean by "broadcast-quality motion." Read this first; the
specific recipes below are catalog entries that satisfy this bar — pick from
them, recombine them, or invent new ones that pass the same test. Never
animate by reflex.

#### The Three-Reason Test (mandatory)

Every animation must do at least ONE of:

1. **Reveal** — bringing new information into view (entry, draw-on, count-up)
2. **Focus** — directing attention to what matters NOW (active-state, pulse, camera move)
3. **Continuity** — connecting this moment to the next (worldPan, settle-into-rest pose)

If a motion does none of those, delete it. Motion for decoration is forbidden.
"Looks cool" is not a reason. "It's been static too long" is not a reason.
Restraint reads as confidence; over-animation reads as panic.

#### Easing — Approved Curves

| Curve | When to use |
|---|---|
| `Easing.bezier(0.16, 1, 0.3, 1)` | iOS easeOutExpo — heavy deceleration, soft landing. Hero plane entries (SaaS float-in), dramatic settle moments. |
| `Easing.out(Easing.cubic)` | Default for: count-ups, camera moves, draw-on lines, position shifts, arrow body draws. The workhorse curve. |
| `Easing.inOut(Easing.cubic)` | Drift envelopes (start at rest, peak in middle, return to rest). Player drift toward arrow direction; pulse rings. |
| `Easing.out(Easing.quad)` | Faster than cubic for short (< 18 frame) reveals — caption fades, secondary text. |
| Spring `{damping: 28, stiffness: 55}` | Cinematic panel/portrait arrival — deliberate, weighty. |
| Spring `{damping: 22, stiffness: 52}` | Row reveals, list items, narrated reveals. The medium-tempo workhorse. |
| Spring `{damping: 14, stiffness: 200}` | Snappy small elements — badges, pins, single-glyph pops. Has visible bounce. |
| Spring `{damping: 26, stiffness: 38}` | Slow zoom (camera in/out). |
| Spring `{damping: 30, stiffness: 180, mass: 1}` | Camera pan between scenes — must settle within `panFrames`. |

Default to ease-out-cubic when unsure. Use the SaaS bezier for hero entries.
Use springs for elements that should feel like they have weight (panels,
portraits, dots). Never combine a spring AND a custom easing on the same
element — pick one motion language per element.

#### Approved Entry Patterns (catalog — pick the right one)

1. **SaaS Float-In** (see dedicated section below) — major plane drops down
   from above the camera, comes forward, settles into resting tilt. Hero
   compositions: tactical pitches, dashboards, hero data boards.

2. **Cinematic Cold Open** — start hyper-zoomed on a focal element (scale
   2.4–2.6) with `transformOrigin` pinned to that element, pull back to scale
   1.0 with `Easing.out(Easing.cubic)` over 36–50 frames. Single-subject
   reveals: hero stat number, lone portrait, focal map region. Reference:
   `HeroBigStat.tsx`, `HeroSeasonTimeline.tsx`.

3. **Side-Slide Reveal** — element enters from off-frame on one side via
   `translateX` interpolation (or absolute `left`) with ease-out. Used for
   portrait + content panel splits. Reference: `HeroSeasonTimeline.tsx`,
   `TeamLineup.tsx`.

4. **Stagger Reveal** — list items / rows / timeline nodes enter one at a
   time with 14–20 frame gaps. Each item composes opacity (0→1) + small
   translateY (12→0) with a medium spring. Reference: `HeroTransferProfit.tsx`,
   `CountdownReveal.tsx`.

5. **Draw-On Line/Path** — SVG `stroke-dasharray` + `stroke-dashoffset`
   animated from `pathLength` to 0. Used for accent rules, callout lines,
   timeline rails, arrows. Always use `pathLength={1}` for normalised draw
   so clearance math doesn't break with chord length.

6. **Count-Up Odometer** — numbers tick from 0 to target with
   `Easing.out(Easing.cubic)`. Duration scales to the value, never linear.
   Reference: `TournamentBracket.tsx` `getDisplayScore`, `HeroBigStat.tsx`,
   `PlayerStats.tsx`.

7. **Word-by-Word Typewriter** — `~0.7` chars/frame with persistent (always-
   in-DOM) cursor. Used for headlines, narrative quotes. Reference:
   `HeroNewsFeed.tsx`.

8. **Fade-and-Rise** — opacity 0→1 with `translateY` 10–14px → 0. The
   bread-and-butter for caption text, secondary lines, supporting elements
   that don't need their own personality.

#### Approved Focus/Transition Patterns (within a composition)

1. **Active-State Spring Accumulation** (mandatory for lists/timelines) —
   `onSpring - offSpring` — see dedicated section below.

2. **Camera WorldPan** — `transform: translateX(-cameraX)` driven by spring,
   for cross-canvas moves and same-act continuity.

3. **Camera Zoom** — `transform: scale()` spring-driven, for emphasis pulls.
   Always use clamped interpolate.

4. **Target Pulse** — brief scale `1.0 → 1.2 → 1.0` + accent ring expanding
   outward. Used to highlight "this is the target/the answer/the hit."
   Reference: `HeroTactical.tsx` opposition pulse on arrow arrival.

5. **Position Morph** — element interpolates from one (x,y) to another with
   the same easing language as the entry curve (visual cohesion).
   Reference: `HeroTactical.tsx` `pressX/pressY`.

#### Approved Micro-Motions (continuous, low-energy)

- **Aftertrail** — element dims to 0.30 ghost opacity after its primary
  action completes. Reference: arrow body after head lands.
- **Settled rest** — once revealed, an element sits STILL. The exception:
  the breathing glow ring on a single timeline node (sin-driven, 1.5px
  amplitude). Anywhere else, `Math.sin` is forbidden.

#### Forbidden Motion (will fail review)

| Forbidden | Why |
|---|---|
| Spring overshoot on hero entries | SaaS-quality entries are pure deceleration; overshoots break the feel |
| Linear interpolation on anything visible | Mechanical, robotic — never seen in broadcast |
| `Math.sin()` for opacity, layout, or text effects | Looks cheap and artificial. (Allowed only on timeline-node breathing rings.) |
| Continuous spinning, pulsing, glowing chrome | Decoration without narrative purpose |
| Independent per-element springs with no shared rhythm | Reads as chaos, not choreography |
| Hard cuts between active/inactive states | Always use spring-accumulation pattern |
| Animation duration < 8 frames | Too fast to perceive; reads as a glitch |
| Single-element entry > 90 frames | Drags; viewer disengages |
| Multiple bounces (oscillating springs that overshoot 2+ times) | One settle is editorial; multiple bounces is cartoon |
| Counter-clock animation | Frame regression looks uncanny |
| Decorative rotation that doesn't serve depth | Rotating things "because it looks dynamic" |
| Per-template motion language drift | If two templates do entries differently for the same task, the engine looks like a pile of templates, not a film |

#### Layered Timing — How Motions Compose

Motion across multiple elements must follow a clear hierarchy:

1. **The plane lands first.** Camera, background, container — settle fully
   before content on top starts entering.
2. **Hero element next.** The dominant visual focus enters once the plane
   has substantially settled (~50f after entry start for SaaS-style entries).
3. **Supporting elements stagger after the hero**, with 14–20 frame gaps.
4. **Overlay layers** (folios, datelines, source attributions) that float
   ABOVE the plane can start a few frames earlier than on-plane content
   (~40f) so the layout feels alive while the plane is still landing.
5. **Continuous loops or aftertrails** start LAST, only after their
   triggering element has completed its primary action.

#### Density — How Many Things Can Move at Once?

Maximum 3 distinct motion EVENTS happening simultaneously. One element
composing multiple channels (translateY + opacity + rotateX) counts as ONE
event. When in doubt, stagger rather than overlap. The viewer's eye can
track three things at once; four reads as chaos.

#### Frame-Rate Sanity Checks

- All durations expressed in frames at 30fps unless explicitly noted
- Anything < 8 frames is invisible to the viewer
- Anything > 90 frames for a single entry feels slow
- Count-up duration formula: `Math.max(24, Math.min(66, 24 + |value| * factor))` — scales with the value, capped to 2.2s
- Stagger gap minimum: 14 frames (slower than that and items blur together)
- Stagger gap maximum: 28 frames (slower than that and rhythm breaks)

#### When You Invent a New Pattern

If none of the catalog entries fits, that's fine — invent. But the new
pattern must pass:

1. The Three-Reason Test (reveal / focus / continuity)
2. Use an approved easing curve (or document why a new one is necessary)
3. Stay within the timing/density rules above
4. Be reusable — if you'd hand-build it for one template, redesign it so
   another template could call the same pattern
5. Add it to this catalog as a numbered entry with a reference template

The bar: a viewer with no narration should recognise the engine's motion
language after 20 seconds. Each pattern is part of that vocabulary.

---

### Spring Configurations

```tsx
// Panel / portrait arrivals — deliberate, cinematic
{ damping: 28, stiffness: 55 }

// Row reveals — medium tempo
{ damping: 22, stiffness: 52 }

// Snappy small elements (nodes, icons)
{ damping: 14, stiffness: 200 }

// Slow zoom (camera in/out)
{ damping: 26, stiffness: 38 }

// Camera pan between scenes — must settle fully within panFrames
{ damping: 30, stiffness: 180, mass: 1 }
```

### The Active-State Pattern (Mandatory for lists, rows, timelines)

This is how items transition from muted background into active foreground focus.

```tsx
function activeState(i: number, frame: number, fps: number): number {
  const cfg = { damping: 22, stiffness: 52 };
  const onProg  = spring({ fps, frame: frame - revealFrame(i),     config: cfg });
  const offProg = i < total - 1
    ? spring({ fps, frame: frame - revealFrame(i + 1), config: cfg })
    : 0;
  return Math.max(0, onProg - offProg); // 0 → 1 when active, 1 → 0 when next activates
}
```

Apply to: opacity, scale, font size, colour interpolation.
- Active item: `opacity: 1.0`, full colour
- Inactive item: `opacity: 0.22–0.35`, muted colour
- **Never** use hard cuts between active states. Always use this spring subtraction pattern.

### Stagger Timing

| Pattern | Frame gap | Notes |
|---|---|---|
| Data rows | 14–20 frames | One beat per row |
| Words / title chars | 8 frames | Fast but perceptible |
| Timeline nodes | 14 frames | Node-per-beat |
| Rank items | 20 frames | Slower, more weight |

### Typewriter Text

```tsx
const CHARS_PER_FRAME = 0.7;   // ~21 chars/sec at 30fps — readable, not frantic
const visibleChars = Math.ceil(localFrame * CHARS_PER_FRAME);
const showCursor = active && visibleChars < headline.length;
const cursorOn = Math.floor(frame / 9) % 2 === 0;

// ALWAYS keep cursor span in DOM — conditional rendering causes reflow
<span style={{ opacity: showCursor && cursorOn ? 0.55 : 0, marginLeft: 2 }}>▍</span>
```

### Camera Movement

Every template must have at least one of:
- **World-space pan:** `transform: translateX(-cameraX)` with spring-driven `cameraX`
- **Zoom:** `transform: scale()` spring-driven in/out
- **Scroll:** SVG viewport or container scroll position animated

Camera transitions must use clamped interpolation to prevent snapping:

```tsx
interpolate(transitionSpring, [0, 1], [fromX, toX], {
  extrapolateLeft:  "clamp",
  extrapolateRight: "clamp",
})
```

### SaaS Float-In Entry (Hero Compositions)

For compositions where a major plane (pitch, dashboard, hero card, board)
enters dramatically, use the SaaS-style float-in. Reference implementation:
`HeroTactical.tsx`. Visual reference: Linear / Stripe / Vercel hero
graphics — element drops down from above the camera, comes forward in 3D
space, and settles into its resting tilt with a heavy-deceleration curve.

Composite **four motion channels off a single eased progress** — never use
springs for this entry (springs overshoot; SaaS-quality is pure deceleration):

```tsx
const ENTRY_DUR    = 52;          // ~1.7s @ 30fps
const RESTING_TILT = 8;           // resting rotateX (deg) — 8° for tactical pitch, 0° for flat

const entryProg = interpolate(frame, [0, ENTRY_DUR], [0, 1], {
  extrapolateLeft:  "clamp",
  extrapolateRight: "clamp",
  easing: Easing.bezier(0.16, 1, 0.3, 1),  // iOS easeOutExpo — THE SaaS curve
});

// Composite transform: drops down + comes forward + un-tilts + zooms in
const transform = `
  translateY(${interpolate(entryProg, [0, 1], [-140, 0])}px)
  translateZ(${interpolate(entryProg, [0, 1], [-220, 0])}px)
  rotateX(${interpolate(entryProg, [0, 1], [32, RESTING_TILT])}deg)
  scale(${interpolate(entryProg, [0, 1], [0.92, 1.0])})
`;

// Opacity rises faster than position settles — visible during the bulk of the float-in
const opacity = interpolate(entryProg, [0, 0.55], [0, 1], { extrapolateRight: "clamp" });
```

**Required ingredients:**
- `perspective: 2400px` on a parent wrapper (without it, `rotateX` renders flat)
- `transformOrigin: "50% 100%"` on the entering plane (rotates around its bottom edge so the top recedes during entry)
- `Easing.bezier(0.16, 1, 0.3, 1)` — the iOS easeOutExpo curve. Never spring, never linear, never quadratic.
- ~52 frames duration — long enough to read as "settling," short enough not to feel slow
- Opacity rises in the FIRST half of the entry (typically [0, 0.55] of `entryProg`), not in lockstep with position
- Children inside the plane (dot labels, etc.) must counter-rotate the *current* tilt — `rotateX(-${entryRotateX}deg)` — so they billboard the camera throughout the entry, not just at rest

**Default knobs (start here, tune by feel):**
| Channel | From | To |
|---|---|---|
| `translateY` | `-140px` | `0` |
| `translateZ` | `-220px` | `0` |
| `rotateX` | `32°` | resting tilt (8° / 0°) |
| `scale` | `0.92` | `1.0` |
| `opacity` | `0` | `1` over [0, 0.55] |

**Forbidden in this pattern:**
- Spring physics (overshoots break the SaaS feel)
- Linear or quadratic easing (too mechanical)
- Rotating around any origin other than the bottom edge (anchoring elsewhere makes it pivot, not float in)
- Skipping `perspective` on the parent

**Downstream timing rule:** elements that live ON the entering plane (dots,
data, content) should not start their own entrance until the plane has
substantially settled (~50f after entry start). Elements floating ABOVE
the plane (overlay text, folio dateline) can start a few frames earlier
(~40f) so the layout feels alive while the plane is still landing.

**When to use it:** any template that has a single dominant subject plane
that benefits from cinematic arrival — tactical pitches, dashboards, hero
data boards, large-format charts. Do NOT use for templates whose subject
is text-led (use a serif italic byline + accent tab pattern instead — see
`HeroBigStat.tsx`).

### Timing Conventions

| Phase | Duration |
|---|---|
| Intro / portrait entrance | 16–30 frames |
| Per-item dwell minimum | 90–120 frames |
| Camera pan between scenes | 20–28 frames |
| Outro / zoom out | 40–60 frames |
| Typewriter per character | ~1.4 frames (0.7 chars/frame) |

---

## 7. SVG & Graphics

### Connector Lines

Use SVG for all connector paths. Paths must:
- Use `strokeLinecap: "round"`, `strokeLinejoin: "round"`
- Have width **1.5–4px** (4px for headline paths, 1.5–2.5px for secondary)
- Animate draw progress or node position via spring
- Be opacity-controlled (inactive paths dimmed, not hidden)

### Travelling Dot / Node

```tsx
<circle cx={dotX} cy={dotY} r={DOT_RADIUS}    fill={dotColor}      opacity={dotOpacity} />
<circle cx={dotX} cy={dotY} r={INNER_DOT_R}   fill={innerDotColor} opacity={dotOpacity} />
```

- Outer circle: `r = 28`, filled with `dotColor` (user-configurable)
- Inner circle: `r = 8`, filled with `bgColor` (creates radio-button appearance)
- Both opacity-driven together (never animate separately)

### Active Node Glow (Timeline nodes only)

```tsx
// Breathing glow ring — subtle sine oscillation is acceptable for nodes only
<circle
  cx={x} cy={y}
  r={(nodeR + 6 + Math.sin(frame * 0.12) * 1.5) * nodeProg}
  fill="none"
  stroke={accentColor}
  strokeWidth={1.5}
  opacity={0.28 * activeState}
/>
```

Sine oscillation is **only** permitted on timeline node glow rings. Never use `Math.sin` for layout, opacity, or text effects.

---

## 8. What Is Forbidden

These patterns appear in deleted templates. Do not recreate them.

| Forbidden | Why |
|---|---|
| Static full-screen card with no camera movement | Flat, no depth, looks like a slide |
| Decorative oversized quote marks (`160px +`) | Overwhelm hierarchy, no data value |
| Centred layout with single stat or quote | No editorial context, generic |
| `Math.sin()` for opacity or layout oscillation | Looks cheap and artificial |
| Independent spring delays with no accumulation | Disconnected, chaotic rhythm |
| `filter: grayscale(100%)` on portrait images | Loses identity and warmth |
| Gradient fills on SVG shapes (trophy, arrows) | Over-detailed, looks illustrative |
| `width: percentage` on portrait containers | Breaks masking; must be `680px` fixed |
| `position: absolute` on `<SmartImg>` inside masked container | Causes mask/overflow interaction bugs |
| Separate `opacity: 0.22` backdrop on images with no mask | Creates hard rectangular edge artefact |
| Hard-stop gradient bands in backgrounds | Create visible vertical seam artefacts in PNG renderer |
| Conditional rendering of cursor span | Causes layout reflow jump when cursor disappears |
| `zIndex` out of order (content below Grain) | Grain loses texture function |
| No `<Grain />` at all | Template looks digital and flat |
| Overlapping portraits and text (no collision check) | Text illegible over player face |

---

## 9. Props Schema Conventions

All templates must expose these props where applicable:

```tsx
bgColor:     z.string().optional().default("#111111")  // background
accentColor: z.string().optional().default("#ffffff")  // accent / highlight colour
dotColor:    z.string().optional().default("#ffffff")  // dot / node colour
lineColor:   z.string().optional().default("rgba(255,255,255,0.34)") // connector line
textColor:   z.string().optional().default("#f0f0f0")  // body text
skipIntro:   z.boolean().optional().default(false)     // skip entrance animation (engine use)
dwellFrames: z.number().int().optional().default(120)  // minimum dwell per item
```

`skipIntro: true` means the template starts in its fully-revealed state — no entrance animations play. The engine sets this when rendering mid-sequence or compositing into longer pieces.

**Always use null-coalescing for numeric props:**
```tsx
const safeFrame = frame - (startFrame ?? 40);
```

---

## 10. Component Checklist

Before considering a template done:

- [ ] Camera movement present (pan / zoom / scroll)
- [ ] Portrait image masked with `PORTRAIT_MASK` pattern and both vignettes
- [ ] Correct Z-order: Bg (0) → Image (1) → Grain (2) → Content (10)
- [ ] `<Grain />` last in JSX, `pointerEvents: "none"`
- [ ] All active-state dimming uses spring accumulation (`onSpring - offSpring`)
- [ ] All stagger gaps 14–20 frames minimum
- [ ] Serif for all headline/number elements
- [ ] `skipIntro` prop wired correctly
- [ ] Typewriter cursor always in DOM (opacity-only control)
- [ ] Camera transitions use clamped interpolation
- [ ] Portrait container `680px` wide, `overflow: hidden`, no `position: absolute` on `SmartImg`
- [ ] No hard-stop gradient bands in any background
- [ ] TypeScript `tsc --noEmit` passes clean
