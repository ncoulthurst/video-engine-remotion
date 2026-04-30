/**
 * HeroPlayerRevealTrio — Full-height multi-player portrait reveal, 1–4 players.
 *
 * Visual-only montage: stacked overlapping portraits with staggered entry.
 * Named "Trio" because the canonical use is three players (left-facing, hero,
 * right-facing). Accepts 1–4, but the design is tuned for three.
 *
 * Portrait treatment mirrors HeroTransferRecord's sideImage: masked with
 * `transparent → black 300px → black 85% → transparent`, max opacity 0.88.
 * Portraits overlap rather than dividing into columns. Central 1520px zone,
 * 200px breathing room each side.
 *
 * Formerly named HeroPlayerReveal (renamed 2026-04-24 — the old name
 * implied single-player reveal and caused storyboard misrouting).
 */
import React from "react";
import {
  AbsoluteFill,
  CalculateMetadataFunction,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";
import { Grain, PaperBackground, DarkBackground, SmartImg, WorldStateSchema} from "./shared";

// ─── Schema ───────────────────────────────────────────────────────────────────

export const HeroPlayerRevealTrioPropsSchema = z.object({
  players: z.array(z.object({
    src: z.string(),
    /**
     * Explicit stacking order. Higher = in front.
     * Defaults to position index (leftmost = back, rightmost = front).
     * Designed for 3-player use: left-facing | forward | right-facing,
     * with the centre player as the hero (highest zIndex).
     */
    zIndex: z.number().int().optional(),
  })).min(1).max(4).default([
    { src: "aguero.png", zIndex: 1 },  // left-facing — sits behind centre
    { src: "rooney.png", zIndex: 3 },  // forward-facing — hero, in front
    { src: "suarez.png", zIndex: 2 },  // right-facing — between the two
  ]),
  bgColor:      z.string().optional().default("#f0ece4"),
  darkMode:     z.boolean().optional().default(false),
  /** Frames between each player's reveal. */
  stagger:      z.number().int().min(4).default(18),
  /** Frames all players are held together after the last one appears. */
  holdDuration: z.number().int().min(20).default(90),
  worldState: WorldStateSchema.optional(),
  skipIntro: z.boolean().optional().default(false),
});
export type HeroPlayerRevealTrioProps = z.infer<typeof HeroPlayerRevealTrioPropsSchema>;

// ─── Layout constants ─────────────────────────────────────────────────────────

/** Each player container width */
const PLAYER_W = 620;

/**
 * Total zone width for all players (symmetric — 50px breathing room each side).
 * step = (ZONE_W - PLAYER_W) / (n-1) = (1820 - 620) / 3 = 400px for n=4
 * overlap = PLAYER_W - step = 620 - 400 = 220px
 *
 * Zone:  |←50px→|←————1820px————→|←50px→|
 * Frame: |←——————————1920px——————————————→|
 */
const ZONE_LEFT  = 50;
const ZONE_W     = 1820;

// ─── Timing ───────────────────────────────────────────────────────────────────

const INTRO_F = 10;

export const calculateMetadata: CalculateMetadataFunction<HeroPlayerRevealTrioProps> = async ({ props }) => {
  const n = Math.max(1, Math.min(4, props.players.length));
  return {
    durationInFrames: INTRO_F + (n - 1) * props.stagger + props.holdDuration,
  };
};

// ─── Spring config — same as HeroTransferRecord ────────────────────────────
const REVEAL_CFG = { damping: 24, stiffness: 50 } as const;

// ─── Gradient mask — identical to HeroTransferRecord sideImage ─────────────
const MASK = "linear-gradient(to right, transparent, black 240px, black 85%, transparent)";

// ─── Main component ───────────────────────────────────────────────────────────

export const HeroPlayerRevealTrio: React.FC<HeroPlayerRevealTrioProps> = ({
  players, bgColor, darkMode, stagger, holdDuration, skipIntro = false,
}) => {
  const frame   = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bg      = darkMode ? (bgColor === "#f0ece4" ? "#111111" : (bgColor ?? "#111111")) : (bgColor ?? "#f0ece4");

  const n = Math.min(4, Math.max(1, players.length));

  /**
   * Compute left position for player i.
   * n=1: centred in zone.
   * n>1: evenly stepped across zone width so last player's right edge = ZONE_LEFT + ZONE_W.
   *
   * step = (ZONE_W - PLAYER_W) / (n - 1)
   * left(i) = ZONE_LEFT + i * step
   */
  const step   = n === 1 ? 0 : (ZONE_W - PLAYER_W) / (n - 1);
  const leftOf = (i: number) => n === 1
    ? ZONE_LEFT + (ZONE_W - PLAYER_W) / 2  // single player: centred
    : ZONE_LEFT + i * step;

  // Frame at which player i begins its reveal
  const revealF = (i: number) => INTRO_F + i * stagger;

  return (
    <AbsoluteFill>

      {/* Brand-matched surface */}
      {darkMode ? <DarkBackground color={bg} /> : <PaperBackground color={bg} />}

      {/* ── Players — rendered back-to-front (leftmost = behind) ── */}
      {players.slice(0, 4).map((player, i) => {
        const revealSp = skipIntro ? 1 : spring({
          frame:  frame - revealF(i),
          fps,
          config: REVEAL_CFG,
        });

        // Opacity: 0 → 0.88 — same quality blend as TransferRecord (0.75),
        // slightly higher since players ARE the content here, not a backdrop.
        const opacity = interpolate(revealSp, [0, 1], [0, 0.88], {
          extrapolateLeft:  "clamp",
          extrapolateRight: "clamp",
        });

        // Rise entry — player climbs 22px into position, like TransferRecord's
        // translateX slide but vertical to suit portrait orientation.
        const translateY = interpolate(revealSp, [0, 1], [22, 0], {
          extrapolateLeft:  "clamp",
          extrapolateRight: "clamp",
        });

        return (
          <div
            key={i}
            style={{
              position:        "absolute",
              top:             0,
              bottom:          0,
              left:            leftOf(i),
              width:           PLAYER_W,
              opacity,
              transform:       `translateY(${translateY.toFixed(2)}px)`,
              WebkitMaskImage: MASK,
              maskImage:       MASK,
              // Custom zIndex if provided, otherwise left=back → right=front
              zIndex:          player.zIndex ?? (i + 1),
              overflow:        "hidden",
            }}
          >
            {/* Image — extra height so bottom vignette has content to fade into */}
            <SmartImg
              src={player.src}
              style={{
                width:          "100%",
                height:         "110%",
                objectFit:      "cover",
                objectPosition: "top center",
                filter:         "contrast(1.05) brightness(1.05)",
                display:        "block",
              }}
            />

            {/* Bottom vignette — dissolves feet into paper.
                Solid bg for bottom 18%, then gradients out over 260px. */}
            <div style={{
              position:      "absolute",
              bottom:        0,
              left:          0,
              right:         0,
              height:        360,
              background:    `linear-gradient(to top, ${bg} 0%, ${bg} 18%, transparent 100%)`,
              pointerEvents: "none",
            }} />

            {/* Top vignette — keeps top edge soft against the paper */}
            <div style={{
              position:      "absolute",
              top:           0,
              left:          0,
              right:         0,
              height:        60,
              background:    `linear-gradient(to bottom, ${bg} 0%, transparent 100%)`,
              pointerEvents: "none",
            }} />

          </div>
        );
      })}

      {/* Grain on top — same z-index pattern as HeroTransferRecord */}
      <div style={{ position: "absolute", inset: 0, zIndex: 10, pointerEvents: "none" }}>
        <Grain />
      </div>

    </AbsoluteFill>
  );
};
