# intrcpt Motion Design System — Remotion Templates

**The canonical reference for all template design, layout, animation, and code patterns.**
All new templates must conform exactly. The approved templates are the source of truth.

---

## 0. Approved Templates (Do Not Touch)

| Template | File | Notes |
|---|---|---|
| IntrcptSeasonTimeline | `IntrcptSeasonTimeline.tsx` | Gold standard for portraits + timeline |
| IntrcptNewsFeed | `IntrcptNewsFeed.tsx` | Gold standard for world-pan + typewriter |
| IntrcptTransferProfit | `IntrcptTransferProfit.tsx` | Gold standard for narrated row reveals |
| CountdownReveal | `CountdownReveal.tsx` | Gold standard for ranked list + camera |
| TimelineScroll | `TimelineScroll.tsx` | Gold standard for horizontal camera scroll |
| IntrcptPlayerReveal | `IntrcptPlayerReveal.tsx` | Gold standard for portrait masking method |

**Mediocre (concept valid, needs rework):** IntrcptLeagueGraph, IntrcptChapterWord, IntrcptScatterPlot, MapCallout, ScoutReport, IntrcptAwardsList

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

This is the defining visual technique of the intrcpt aesthetic. Get it exactly right.

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
