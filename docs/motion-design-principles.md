# Motion Design Principles
## Rules for building graphics that feel like a professional motion designer built them

Derived from: TimelineScroll, HeroDualPanel, reference video analysis (Search Party / MOON).
Maintained as living rules — correct them when they prove wrong in practice.

---

### 1. Movement Builds Continuity. Cuts Reset Context.

Movement is not inherently better than cuts. Each does something different.

**Use movement (pan, zoom) when:**
- events are spatially or temporally related
- you want the viewer to feel they're still inside the same world
- the relationship between scenes is the point (before/after, meanwhile, escalation)

**Use cuts when:**
- switching topics entirely (attack → defence, player story → team story)
- changing scale (individual stat → team comparison)
- jumping time non-linearly — a cut signals "we are now somewhere else"
- an information reset serves the narrative

The original rule ("A cut is lazy") was too absolute. An unmotivated cut is lazy. A deliberate cut that resets context is a tool.

**Rule:** Movement says "we're still here." A cut says "we're somewhere new." Choose based on what you're trying to communicate.

---

### 2. Springs for Mass. Easing for Readability.

Not everything should feel physical. The choice of animation curve depends on what the element *is*.

**Use springs for:**
- objects with perceived mass (panels sliding in, camera panning, nodes popping)
- elements that represent physical things entering or leaving the scene
- any reveal where a small amount of overshoot makes it feel alive

Key spring configs:
- Camera pan: `{ damping: 26, stiffness: 40 }` — medium weight, smooth
- Zoom in: `{ damping: 28, stiffness: 42 }` — slightly snappier
- Node entrance: `{ damping: 24, stiffness: 80 }` — quick pop
- Active state: `{ damping: 22, stiffness: 52 }` — responsive but not jarring

**Use linear or simple easing for:**
- numbers ticking up/counting — linear reads as precision, not wobble
- subtle opacity fades — no overshoot needed, just a clean dissolve
- UI-style elements (chips, labels, progress bars) — these are readability aids, not physical objects

**Rule:** Springs for objects with mass. Linear/ease for UI and readability.

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

### 6. *(TimelineScroll-specific)* The Timeline Line Grows

> **Note:** This rule applies specifically to `TimelineScroll.tsx`, not globally.

The horizontal timeline bar draws itself left to right as events are revealed. It stops at the last revealed node and interpolates toward the next — "history being written."

**Rule:** Progress is earned, not assumed.

---

### 7. *(TimelineScroll-specific)* End Wide

> **Note:** This rule applies specifically to camera-zoom templates (`TimelineScroll`), not globally. The general version is Rule 13.

After dwelling on every event, the camera springs back out to show the complete timeline in full colour. Every node fully lit. The viewer has visited every moment individually and now sees the whole story at once.

`allActive = zoomOutProg > 0.5` — flips all items to full brightness mid-zoom-out.

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

### 10. Dwell Time is Tied to Load, Not a Fixed Number

The old rule ("4 seconds minimum") was too rigid. Dwell time depends on two things: **reading load** (how much text is on screen) and **narration density** (how many words is the narrator delivering).

Calibration:
- Simple stat card with one number: 2–3s is enough
- Complex graphic with multiple rows, labels, columns: 4–5s minimum
- A graphic that requires the viewer to *read* before they can understand: 5s+

The right test: can a viewer read the key information AND track the narration simultaneously? If they have to choose, the dwell is too short.

**Rule:** Dwell is tied to reading + narration load. Calibrate per graphic, not per rule.

---

### 11. Typewriter Cursor — Opacity Blink, Never Character Swap

A common mistake: implement the blinking cursor by alternating `"|"` and `" "` in the returned string. In a proportional font these have different widths — the text element reflows every blink, jittering every sibling in the same flex container.

Fix: render the cursor as a separate fixed-width element and toggle `opacity` only.

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

**Rule:** Cursor blink is an opacity toggle on a fixed-width element. Never change text content to simulate it.

---

### 12. Ghost Rows Are a Retention Hook

For list-reveal templates, unrevealed rows must not be invisible — show them as dim placeholder shapes at `opacity: 0.18`. The viewer sees there is more to come and stays watching.

Ghost shapes: rough rectangles sized to suggest a name bar + two data bars. No actual data, just enough geometry to imply the row's shape.

**Rule:** Show the silhouette before the reveal. Invisible future rows lose the audience.

---

### 13. Outro Payoff — Everything Lights Up Together

After every item in a list or timeline has been individually spotlit, the final shot lights everything up simultaneously. The "here's the full picture" beat.

Implementation: `outroActiveProg = spring(frame − totalRevealF)`. In `activeState(i)`, return `Math.max(normalActive, outroActiveProg)`.

**Rule:** Every reveal sequence needs a payoff shot. End fully lit.

---

### 14. Prefer Static Labels Over Crossfaded Alternatives

Crossfading a label ("running total" → "total profit") adds cognitive load — the viewer has to re-read and re-parse. A label that reads the same thing throughout requires no re-reading.

The ticking number carries all the drama. The label is just a title — keep it stable.

**Rule:** If a label describes the same value throughout, don't change it. Simpler is always clearer.

---

### 15. The Shared World Canvas

The best documentary motion designers treat all compositions as existing on a single continuous horizontal canvas. The camera moves through this world — it doesn't cut between isolated slides.

**Practical implications:**
- When the camera exits right, the next scene enters from the right — they share the same velocity vector
- At the peak of a pan transition, both scenes are simultaneously visible (outgoing left, incoming right) — proof they share one world
- Use `worldPanTransition` for consecutive graphics in the same act

**When NOT to use it:** topic switches, scale changes, and non-linear time jumps still call for a cut (see Rule 1).

Use `HeroDualPanel` when you want to make the shared world explicit: two parallel events living side by side on one canvas.

**Rule:** Build a world, not a slideshow. Move the camera — don't replace the stage.

---

### 16. Every Scene Must Be Instantly Understandable Without Narration

The viewer should be able to pause on any frame and know immediately: what am I looking at, and why does it matter?

This is the goal. The context chip is one tool to achieve it — not the rule itself.

**For football content, "instant understanding" means:**
- Match: `ARS vs CHE / 2023` or `90+2'`
- Competition: `Premier League / 2013–14`
- Situation: `Counter Attack` / `Debut Season` / `Title Race — Week 32`
- Record: `Most Goals — Single Season`

**When you don't need a chip:**
- Context is already established and obvious (e.g. a simple ranking list following narration that set it up)
- The entire video is one continuous context with no jumps

**Context chip design** (when used):
- Pill shape, dark bg (#111 for formal, accent for action/sport)
- `/ LABEL` format — the slash signals "context marker", not a title
- Inter 700, 13–14px, top-left position always
- Color guide: `#111` = formal/diplomatic · `#1a5c1a` = sport/action · `#8B0000` = scandal · `#C9A84C` = trophies

**Rule:** Every scene must be instantly readable when paused. The chip is one way to achieve this, not the only way.

---

### 19. Same-Canvas Evolution — Scenes Must Not Reset

The most important principle for multi-graphic sequences: **scenes should not end and restart**. Each animation must continue from the previous frame's visual state. Elements persist, move, or transform into the next scene. The timeline should feel like one continuous story progressing, not separate clips switching.

This is what separates documentary motion design from a slideshow.

**The reference pattern** (from "The Psychology Behind A Title Race"):
- The red line persists → becomes the anchor for the next beat
- The timeline extends → it is not replaced
- New elements (formation, players, clips) EMERGE from the same red canvas
- Nothing "cuts away" — it evolves

**Why cuts fail:** A cut resets the visual state. The viewer re-orients — "where am I now?" Every reorientation costs engagement. Within a single act and subject, the viewer should never need to re-orient.

**How to implement it:**

1. **Use the `evolve` transition** between consecutive infographic scenes within the same act that share the same `bgColor`. The transition holds the outgoing scene fully visible, then lets it drop while the incoming scene's content emerges in the same space.

2. **The matching background contract**: `evolve` works because identical backgrounds are visually indistinguishable during a cross-dissolve. The viewer sees only the foreground elements changing — which looks like the SAME scene evolving. **Both scenes must have identical `bgColor` values.** If backgrounds don't match, use `worldPan` instead.

3. **The `skipIntro` prop**: When a composition follows another in an `evolve` sequence, set `skipIntro: true` in its props. This skips all entrance animations for persistent elements (background, portrait, decorative lines) so they are already settled from frame 0. Only the PRIMARY NEW CONTENT animates in. The viewer never sees the background "start up" — it was already there.

4. **What NOT to do**: Never insert `letterbox`, `push`, or any cut-style transition between two consecutive HERO-style scenes in the same act with the same background. That signals "we are now somewhere new" — which is false if the subject and background are the same.

**Transition selection cheat-sheet:**
| Situation | Transition |
|---|---|
| Two infographics, same act, same bg, same subject | `evolve` |
| Two infographics, same act, different bg or topic | `worldPan` |
| Act break (e.g. ORIGINS → RISE) | `letterbox` |
| High-energy stat reveal or goal | `flash` |
| Controversy, bite, chaos | `grain` |
| Reflection, legacy, tribute | `paper` |
| Camera move forward in time | `push` |

**Rule:** Within an act, scenes that share a subject and background must evolve, not cut. Use `evolve` + `skipIntro`. The background is a world — not a slide.

---

### 18. Portrait Blending — CSS Mask, Not Gradient Overlay Divs

Cutout portraits (player or manager photos placed against a coloured background) must blend into the background using CSS `WebkitMaskImage` + `maskImage` on the container — **not** a sibling `<div>` with a `background: linear-gradient(...)` overlay.

**The wrong way (produces a visible coloured box):**
```tsx
<div style={{ width: PORTRAIT_W, height: H }}>
  <SmartImg ... />
  {/* ❌ This div has a bg colour and clips to the container bounds — visible as a rectangle */}
  <div style={{ position: "absolute", right: 0, width: 120, background: `linear-gradient(to right, transparent, ${bgColor})` }} />
</div>
```

**The right way (HeroPlayerRevealTrio method):**
```tsx
<div style={{
  width: PORTRAIT_W,
  height: H,
  opacity: 0.88,                    // max opacity; never 1.0 (looks too hard)
  WebkitMaskImage: PORTRAIT_MASK,   // CSS gradient — fades the image itself, no bg needed
  maskImage:       PORTRAIT_MASK,
  // NO background colour on this container
}}>
  <SmartImg ... />
  {/* Bottom vignette — inside the container, absolutely positioned */}
  <div style={{
    position: "absolute", bottom: 0, left: 0, right: 0, height: 360,
    background: `linear-gradient(to top, ${bgColor} 0%, ${bgColor} 16%, transparent 100%)`,
    pointerEvents: "none",
  }} />
</div>
```

**Mask gradient guide:**
- Portrait on left, fading right: `"linear-gradient(to right, black 50%, transparent 92%)"`
- Portrait on right, fading left: `"linear-gradient(to left, black 50%, transparent 92%)"`
- Portrait in centre (blends both sides): `"linear-gradient(to right, transparent, black 240px, black 85%, transparent)"` ← exact HeroPlayerRevealTrio mask

**Rule:** Always use CSS `maskImage` for portrait blending. A background-colour gradient div always produces a visible rectangle box artifact.

---

### 17. Information Hierarchy Comes Before Animation

No amount of motion compensates for a layout where the viewer doesn't know what to look at first.

Every graphic should pass the **1-second freeze test**: pause on any frame and the hierarchy should be clear in under one second.

That means:
- **One primary element** — the thing that carries the meaning. Usually the biggest number, the boldest text, or the most visually distinct element.
- **Secondary supporting info** — stats, labels, context. Present but clearly subordinate.
- **Everything else muted** — at `opacity: 0.28–0.45`. Visible, but not competing.

If you have to animate something to make the hierarchy clear, the layout has already failed. Animation reveals and emphasises — it doesn't create hierarchy from nothing.

**The test:** Cover the frame. Ask: "what's this graphic about?" If the answer requires reading three things before it makes sense, simplify the layout first, then animate.

**Rule:** The viewer should understand the hierarchy in under 1 second, even if paused. Animation reveals — it doesn't create.

---
