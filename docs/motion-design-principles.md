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
