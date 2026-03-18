# intrcpt Style Guide — Remotion Templates

Reference channel: intrcpt (YouTube). All templates must follow these rules exactly.

---

## 1. Backgrounds & Layering

### Background Modes
- **Paper**: `<PaperBackground />` (default `#f0ece4`)
- **Dark**: `<DarkBackground />` (default `#111111`)

### The "Sandwich" Layering (Mandatory)
1. **Z-Index 0**: Background component
2. **Z-Index 1**: Player Hero / Side Image (if present)
3. **Z-Index 2**: `<Grain />` overlay (must sit on top of the image for texture)
4. **Z-Index 10**: Foreground Infographic Content (Text, Bars, Tables)

---

## 2. Typography & Scaling

### Fonts
- **Display / Titles**: `serifFontFamily` (Playfair Display, weight 900)
- **Body / Data**: `fontFamily` (Inter, weights 400–900)

### Mandatory Scales (Impact Mode)
To maintain readability and "prestige" feel, use these exact sizes for core elements:

| Element | Font Size | Font Family |
|---------|-----------|-------------|
| Main Composition Title | **72px** | Serif |
| Player Name (Hero) | **90px** | Serif |
| Big Stat Number | **240px** | Serif |
| Stat Row Player Name | **28px** | Serif |
| Highlighted Row Name | **34px** | Serif |
| Result Letter (W/D/L) | **60px** | Serif |
| Summary Large Number | **72px** | Serif |
| Year Labels (Timeline) | **20px** | Sans |
| Data Sub-labels (Score/Club) | **16px–20px** | Sans |

---

## 3. Player Hero Images (Side Images)

- **Opacity**: Standard is **0.75**.
- **Masking**: Left edge must fade out over **350px**.
  - `WebkitMaskImage: 'linear-gradient(to right, transparent, black 350px, black 85%, transparent)'`
- **Collision Prevention**: If a side image is present, the chart area width must be reduced (e.g., `BAR_MAX_W` from 1000 -> 520) to prevent overlap with the player's torso.

---

## 4. Colors

### Result Colors (Mandatory for Form Run)
- **Win (W)**: Bright Green (**#22c55e**)
- **Loss (L)**: Vibrant Red (**#ef4444**)
- **Draw (D)**: Orangey Yellow (**#f59e0b**)

### Brand Colors
- **Gold**: `#C9A84C` (Reserved for trophies and highlights)
- **Primary**: `#111` (Black for text on paper)
- **Muted**: `#888` (Grey for labels)

---

## 5. Components & Animation

- **Badges**: Career Timeline badges must be large (**176px**) with **3px** borders.
- **Timeline Stems**: Use 90-degree vertical stems to connect timeline nodes to text blocks below.
- **Springs**: All entrances must use `spring()`.
  - Panel arrivals: `{ damping: 28, stiffness: 55 }`
  - Snappy pops: `{ damping: 14, stiffness: 200 }`
- **Defensive Coding**: Always use null-coalescing for numeric props to avoid "NaN" errors.
  - `frame - (startFrame ?? 40)`

---

## 6. Dos and Don'ts

| Do | Don't |
|----|-------|
| Full-bleed paper or near-black bg | DocumentaryFrame inner box |
| Serif for all important names | Sans-serif for titles |
| Grain on top of every image | Clean flat background |
| Reduce chart width for hero photos | Overlap text on player faces |
| Large result squares (120px) | Tiny illegible icons |
