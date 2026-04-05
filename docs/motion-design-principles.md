# Motion Design Principles
## What makes the TimelineScroll feel like a professional motion designer built it

These rules were derived from building TimelineScroll and should govern every template in the engine.

---

### 1. The Camera Does the Work

The most important insight: instead of cutting between items, the **camera pans and zooms**. The viewer never loses their place. They always know where they are on the timeline because they can see where they've been.

- Zoom in on each event (1.85×) so it fills the frame — forces focus
- Dwell at full zoom for narration time (`dwellFrames`, default 120 = 4 seconds)
- Spring-driven pan begins slightly before the dwell ends (`PAN_DUR = 22 frames`) — the pan and the new item's reveal overlap, making it feel continuous
- Zoom back out at the end to reveal the full picture — the "establishing shot" at the end

**Rule:** A cut is lazy. Movement with purpose tells the story.

---

### 2. Spring Physics, Not Easing Curves

Every transition uses `spring()` not `interpolate()` with a cubic-bezier. Springs have physical parameters (damping, stiffness) that feel alive. They overshoot slightly, settle naturally. They look like something that has weight.

Key spring configs used:
- Camera pan: `{ damping: 26, stiffness: 40 }` — medium weight, smooth
- Zoom in: `{ damping: 28, stiffness: 42 }` — slightly snappier
- Zoom out: `{ damping: 26, stiffness: 38 }` — slower, more cinematic
- Node entrance: `{ damping: 24, stiffness: 80 }` — quick pop
- Active state: `{ damping: 22, stiffness: 52 }` — responsive but not jarring

**Rule:** If it moves, it should feel like it has mass.

---

### 3. Active State is a Value, Not a Boolean

The worst thing a timeline can do is *snap* the highlight from one item to the next. Instead, each item's "active" state is a continuous `0→1` value computed from spring accumulation:

```
activeState(i) = clamp(springAtReveal(i) − springAtReveal(i+1))
```

This means:
- Items fade *into* focus as the camera arrives
- Items fade *out* as the next item activates
- The transition is a smooth crossfade, not a switch

**Rule:** Active state is a number between 0 and 1, never a boolean.

---

### 4. Opacity as the Mute, Not Colour Switching

Inactive items are not hidden — they are **dimmed** (`opacity: 0.28`). The viewer can see the whole timeline's shape. Only the active item is at full brightness.

Critically: don't swap colours when activating. Render everything at its final colour and use opacity to control visibility. This eliminates layout reflow and the "flicker on load" bug caused by font-size or colour changes mid-animation.

```
mutedMult = 0.28 + 0.72 * activeState   // 0.28 (dim) → 1.0 (full)
```

**Rule:** Mute with opacity. Never reflow text. Fixed font sizes, fixed positions.

---

### 5. Layered Entrance Choreography

Items don't all appear at once. Each has a staggered reveal sequence:

1. **Node** pops in with a fast spring (stiffness: 80) — the dot appears first
2. **Stubs** (vertical lines connecting node to text) fade in slightly after
3. **Year label** slides up and fades in
4. **Title + description** follows slightly behind

This mimics how a professional motion designer would sequence elements: establish the anchor point, then reveal the details.

**Rule:** Sequence your reveals. Lead with shape, follow with text.

---

### 6. The Timeline Line Grows, It Doesn't Appear

The horizontal timeline bar is not static — it draws itself from left to right as events are revealed. It stops at the last revealed node and interpolates toward the next.

This gives the timeline a sense of *history being written*, not just displayed.

**Rule:** Progress is earned, not assumed. Make the viewer watch it unfold.

---

### 7. The Final Overview is the Payoff

After dwelling on every item, the camera springs back out to show the complete timeline in full colour. Every node is fully bright. This is the emotional beat — the viewer has visited every moment individually and now sees the whole story at once.

`allActive = zoomOutProg > 0.5` — flips all items to full brightness mid-zoom-out, so by the time the camera settles, everything is already lit.

**Rule:** Every timeline needs a payoff shot. End wide.

---

### 8. The Node Covers the Line

A subtle but important detail: the circular node at each point must **cover** the horizontal line passing through it. If the node fill is semi-transparent, the line shows through — it looks like a bug.

Fix: two overlaid circles.
1. Opaque fill matching the background — erases the line beneath
2. Accent colour overlay with `opacity = activeState` — adds colour on top

**Rule:** Background-matched opaque fills erase artifacts. Never use `rgba` node fills over SVG lines.

---

### 9. The Header is Fixed, the Camera is Not

The title in the top-left is positioned *outside* the camera layer. It doesn't zoom or pan. It's the narrator's anchor — always there, always readable, regardless of where the camera is pointing.

Two z-index layers:
- `zIndex: 30` — fixed header (title, subtitle, accent bar)
- `zIndex: 10` — camera layer (everything that moves)

**Rule:** The title is the broadcaster's identity. It never moves.

---

### 10. Respect the Viewer's Reading Time

`dwellFrames = 120` = 4 seconds per item at 30fps. This feels slow in an editor but is the minimum for a narrator to deliver a line while the viewer also reads the label. Don't rush it.

**Rule:** If a viewer can't read it and listen at the same time, the dwell is too short.

---

### 11. Typewriter Cursor — Opacity Blink, Never Character Swap

A common mistake: implement the blinking cursor by alternating `"|"` and `" "` in the returned string. In a proportional font these have different widths — the text element reflows every blink, jittering every sibling in the same flex container (including legends, strip labels, anything downstream in the layout).

Fix: render the cursor as a separate fixed-width element and toggle `opacity` only. The text string changes only when a new character appears — never on a blink. Use `verticalAlign: text-bottom` so the bar sits on the baseline without pulling it up.

```tsx
// BAD — character swap causes layout reflow every 9 frames
return text.slice(0, chars) + (blink ? "|" : " ");

// GOOD — opacity only, zero reflow, zero layout shift
<>
  {text.slice(0, chars)}
  <span style={{ display: "inline-block", width: 2, height: "0.75em",
                 background: "currentColor", verticalAlign: "text-bottom",
                 marginLeft: 2, opacity: done ? 0 : (blink ? 1 : 0) }} />
</>
```

Also: make `Typewriter` a proper React component (not a helper function returning a string) so it can call `useCurrentFrame()` itself, keeping it self-contained and reusable across templates.

**Rule:** Cursor blink is an opacity toggle on a fixed-width element. Never change text content to simulate it.

---

### 12. Ghost Rows Are a Retention Hook

For list-reveal templates, unrevealed rows must not be invisible — show them as dim placeholder shapes at `opacity: 0.18`. The viewer sees there is more to come and stays watching.

Ghost shapes: rough rectangles sized to suggest a name bar + two data bars. No actual data, just enough geometry to imply the row's shape. This mirrors the reveal technique used in broadcast sports graphics.

**Rule:** Show the silhouette before the reveal. Invisible future rows lose the audience.

---

### 13. Outro Payoff — All Rows Light Up Together

After every item in a list has been individually spotlit, the final shot should light everything up simultaneously. This is the visual "here's the full picture" beat that mirrors Rule 7 (End Wide).

Implementation: `outroActiveProg = spring(frame − totalRevealF)`. In `activeState(i)`, return `Math.max(normalActive, outroActiveProg)`. Once `outroActiveProg` reaches 1, every row overrides its own dimming and the whole list blazes at full opacity in one sweep.

**Rule:** Every list reveal needs a payoff shot. End fully lit.

---

### 14. Prefer Static Labels Over Crossfaded Alternatives

It is tempting to crossfade a label ("running total" → "total profit") to add variety. In practice this adds cognitive load — the viewer has to re-read and re-parse what the number means. A label that reads the same thing from first appearance to last requires no re-reading at all.

The ticking number itself carries all the drama. The label is just a title — keep it stable.

**Rule:** If a label describes the same value throughout, don't change it. Simpler is always clearer.
