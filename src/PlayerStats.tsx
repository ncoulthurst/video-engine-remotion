/**
 * PlayerStats — Editorial, documentary-feel player statline.
 *
 * Left: 680px masked portrait (canonical §5 mask) with top/bottom vignettes.
 * Right: eyebrow → name → club → spring-driven divider → one HERO stat
 *        (serif 150px, odometer count-up) → inline row of 3 supporting stats.
 *
 * Active-state spring-accumulation per §6 — each stat reveals, then dims
 * to 0.28 when the next one becomes active. Slow zoom on the whole plane
 * (0.97 → 1.0) provides the required camera movement.
 *
 * Back-compat: when `playerImageSlug` is empty, the portrait-less fallback
 * layout centres the content block at left:130px (§5 collision rules).
 */
import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";
import {
  Grain, PaperBackground,
  COLORS, fontFamily, serifFontFamily, SmartImg, WorldStateSchema,
} from "./shared";

// ── Schema ─────────────────────────────────────────────────────────────────────

const StatSchema = z.object({
  label: z.string().optional().default(""),
  value: z.union([z.string(), z.number()]).optional(),
  sub:   z.string().optional().default(""),
});

export const PlayerStatsPropsSchema = z.object({
  playerName:      z.string().optional().default("Player Name"),
  club:            z.string().optional().default(""),
  season:          z.string().optional().default(""),
  competition:     z.string().optional().default(""),
  badgeSlug:       z.string().optional().default(""),
  clubColor:       z.string().optional().default(""),
  playerImageSlug: z.string().optional().default(""),
  stats:           z.array(StatSchema),
  bgColor:         z.string().optional().default("#f0ece4"),
  worldState:      WorldStateSchema.optional(),
  skipIntro:       z.boolean().optional().default(false),
});

export type PlayerStatsProps = z.infer<typeof PlayerStatsPropsSchema>;

// ── Layout constants ───────────────────────────────────────────────────────────

const PORTRAIT_W   = 680;
const PORTRAIT_MASK =
  "linear-gradient(to right, transparent, black 350px, black 85%, transparent)";

// Content zone
const CONTENT_X_WITH_PORTRAIT    = 748;
const CONTENT_X_WITHOUT_PORTRAIT = 140;
const CONTENT_MAX_W              = 580;   // ~520–600 per spec

// Animation timing (frames)
const HEADER_IN_F    = 4;
const DIVIDER_IN_F   = 22;
const HERO_IN_F      = 36;
const STAGGER        = 17;   // §6 stagger: 14–20 frames

// Active-state spring configs
const ON_CFG  = { damping: 22, stiffness: 52 };
const OFF_CFG = { damping: 22, stiffness: 52 };

function clamp01(v: number) { return Math.max(0, Math.min(1, v)); }

// ── Component ──────────────────────────────────────────────────────────────────

export const PlayerStats: React.FC<PlayerStatsProps> = ({
  playerName,
  club,
  season,
  competition,
  badgeSlug,
  clubColor = COLORS.gold,
  playerImageSlug = "",
  stats,
  bgColor = "#f0ece4",
  skipIntro = false,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const hasPortrait = !!playerImageSlug;
  const safeStats   = (stats ?? []).slice(0, 4);
  const heroStat    = safeStats[0];
  const supporting  = safeStats.slice(1);

  const effectiveClubColor = clubColor || COLORS.gold;

  // ── Portrait entrance (slides in from left, spring) ─────────────────────────
  const portraitProg = skipIntro ? 1 : clamp01(spring({
    fps,
    frame: frame - HEADER_IN_F,
    config: { damping: 28, stiffness: 55 },
  }));
  const portraitX  = interpolate(portraitProg, [0, 1], [-PORTRAIT_W * 0.55, 0]);
  const portraitOp = interpolate(portraitProg, [0, 0.25], [0, 1], { extrapolateRight: "clamp" });

  // ── Camera: slow zoom on the portrait+content plane (§6 "slow zoom") ────────
  // 0.97 → 1.0 across the whole composition, settled with clamped interpolate.
  const cameraProg = skipIntro ? 1 : clamp01(spring({
    fps,
    frame,
    config: { damping: 26, stiffness: 38 },
  }));
  // Drive the long, continuous zoom off a linear time-based progress so the
  // movement doesn't fully settle at frame ~30 like a pure spring would.
  const timeProg = clamp01(frame / Math.max(1, durationInFrames - 1));
  const cameraScale = skipIntro
    ? 1
    : interpolate(
        timeProg,
        [0, 1],
        [0.97, 1.0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
      ) * interpolate(cameraProg, [0, 1], [1.0, 1.0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // ── Header fade-in ──────────────────────────────────────────────────────────
  const headerProg = skipIntro ? 1 : clamp01(spring({
    fps,
    frame: frame - HEADER_IN_F,
    config: { damping: 22, stiffness: 60 },
  }));
  const headerOp = headerProg;
  const headerY  = interpolate(headerProg, [0, 1], [18, 0]);

  // ── Accent divider driven by spring (not decorative) ────────────────────────
  const dividerProg = skipIntro ? 1 : clamp01(spring({
    fps,
    frame: frame - DIVIDER_IN_F,
    config: { damping: 22, stiffness: 52 },
  }));

  // ── Active-state helper: item i is active from its reveal to next reveal ────
  const revealFrame = (i: number) => HERO_IN_F + i * STAGGER;
  const activeState = (i: number): number => {
    if (skipIntro) {
      // In skipIntro mode everything sits revealed; treat last stat as active.
      return i === safeStats.length - 1 ? 1 : 0.35;
    }
    const onProg  = clamp01(spring({ fps, frame: frame - revealFrame(i),     config: ON_CFG }));
    const offProg = i < safeStats.length - 1
      ? clamp01(spring({ fps, frame: frame - revealFrame(i + 1), config: OFF_CFG }))
      : 0;
    const pureActive = Math.max(0, onProg - offProg);
    // Keep a floor of 0.28–0.35 once revealed so items remain legible when
    // the next one takes focus (§4 inactive 0.22–0.35).
    const revealedFloor = onProg * 0.30;
    return Math.max(pureActive, revealedFloor);
  };

  // ── Hero count-up (odometer, ease-out cubic — TournamentBracket pattern) ────
  const heroNumVal = heroStat && typeof heroStat.value === "number"
    ? heroStat.value
    : heroStat ? parseFloat(String(heroStat.value)) : NaN;
  const heroIsNum  = !isNaN(heroNumVal);
  // 24 frame baseline, +2 per unit, capped at 66 frames — same feel as the bracket odometer.
  const heroDur = heroIsNum
    ? Math.max(24, Math.min(66, 24 + Math.abs(heroNumVal) * 2))
    : 24;
  const heroCountProg = skipIntro
    ? 1
    : interpolate(frame, [HERO_IN_F, HERO_IN_F + heroDur], [0, 1], {
        extrapolateLeft:  "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.cubic),
      });

  const heroDisplay = heroStat
    ? formatStatValue(heroStat.value, heroCountProg)
    : "";

  // Hero scale/opacity respond to active-state
  const heroAS      = activeState(0);
  const heroOpacity = skipIntro
    ? 1
    : interpolate(heroAS, [0, 0.35, 1], [0.0, 0.55, 1.0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // ── Portrait filter ─────────────────────────────────────────────────────────
  const portraitFilter = "contrast(1.05) brightness(1.02)";

  // ── Content x origin ────────────────────────────────────────────────────────
  const contentX   = hasPortrait ? CONTENT_X_WITH_PORTRAIT : CONTENT_X_WITHOUT_PORTRAIT;
  const contentMaxW = hasPortrait ? CONTENT_MAX_W : 900;

  // ── Hero number font size: scale down for long values ──────────────────────
  // 2-digit is nudged smaller than 3-digit so wide digits ("31", "88") don't
  // crowd the caption beneath. Single digits can go big for hero impact.
  const heroStrLen  = heroStat ? String(heroDisplay).replace(/,/g, "").length : 0;
  const heroFontPx  = heroStrLen >= 6 ? 112
                    : heroStrLen >= 5 ? 124
                    : heroStrLen === 4 ? 138
                    : heroStrLen === 3 ? 156
                    : heroStrLen === 2 ? 144
                    :                    168;

  return (
    <AbsoluteFill style={{ fontFamily, overflow: "hidden" }}>
      {/* z:0  paper */}
      <PaperBackground color={bgColor} />

      {/* z:1–10  camera layer (portrait + content scale together for slow zoom) */}
      <AbsoluteFill style={{
        transform:       `scale(${cameraScale})`,
        transformOrigin: hasPortrait ? "30% 50%" : "center center",
      }}>
        {/* ── Portrait (masked, vignettes — canonical §5) ──────────────── */}
        {hasPortrait && (
          <div style={{
            position:        "absolute",
            left:            portraitX,
            top:             0,
            width:           PORTRAIT_W,
            height:          "100%",
            overflow:        "hidden",
            opacity:         portraitOp * 0.88,
            WebkitMaskImage: PORTRAIT_MASK,
            maskImage:       PORTRAIT_MASK,
            zIndex:          1,
          }}>
            <SmartImg
              src={playerImageSlug}
              style={{
                width:          "100%",
                height:         "110%",
                objectFit:      "cover",
                objectPosition: "top center",
                filter:         portraitFilter,
                display:        "block",
              }}
            />
            {/* Bottom vignette */}
            <div style={{
              position:      "absolute",
              bottom:        0, left: 0, right: 0,
              height:        380,
              background:    `linear-gradient(to top, ${bgColor} 0%, ${bgColor} 16%, transparent 100%)`,
              pointerEvents: "none",
            }} />
            {/* Top vignette */}
            <div style={{
              position:      "absolute",
              top:           0, left: 0, right: 0,
              height:        70,
              background:    `linear-gradient(to bottom, ${bgColor} 0%, transparent 100%)`,
              pointerEvents: "none",
            }} />
          </div>
        )}

        {/* ── Content column ───────────────────────────────────────────── */}
        <div style={{
          position: "absolute",
          left:     contentX,
          top:      0,
          bottom:   0,
          width:    contentMaxW,
          zIndex:   10,
          display:  "flex",
          flexDirection: "column",
          justifyContent: "center",
          paddingRight: 40,
        }}>
          {/* Eyebrow + name + club */}
          <div style={{
            opacity:   headerOp,
            transform: `translateY(${headerY}px)`,
          }}>
            {/* Eyebrow: COMPETITION · SEASON */}
            {(competition || season) && (
              <div style={{
                display:       "flex",
                alignItems:    "center",
                gap:           14,
                fontFamily,
                fontSize:      13,
                fontWeight:    700,
                letterSpacing: 3.5,
                color:         "rgba(0,0,0,0.45)",
                textTransform: "uppercase",
                marginBottom:  18,
              }}>
                {badgeSlug && (
                  <SmartImg
                    src={`badges/${badgeSlug}`}
                    style={{ width: 26, height: 26, objectFit: "contain", opacity: 0.85 }}
                  />
                )}
                <span>{[competition, season].filter(Boolean).join(" · ")}</span>
              </div>
            )}

            {/* Player name — serif, huge, tight */}
            <div style={{
              fontFamily:    serifFontFamily,
              fontSize:      88,
              fontWeight:    900,
              color:         COLORS.primary,
              letterSpacing: -3,
              lineHeight:    1,
            }}>
              {playerName}
            </div>

            {/* Club */}
            {club && (
              <div style={{
                fontFamily,
                fontSize:      24,
                fontWeight:    700,
                color:         effectiveClubColor,
                marginTop:     10,
                letterSpacing: 0.3,
              }}>
                {club}
              </div>
            )}
          </div>

          {/* Accent divider — spring-driven width, not decorative chrome */}
          <div style={{
            height:       2,
            width:        `${dividerProg * 88}px`,
            background:   effectiveClubColor,
            marginTop:    30,
            marginBottom: 34,
            opacity:      0.9,
          }} />

          {/* HERO stat */}
          {heroStat && (
            <div style={{
              opacity: heroOpacity,
              marginBottom: 36,
            }}>
              {/* Hero label */}
              {heroStat.label && (
                <div style={{
                  fontFamily,
                  fontSize:      14,
                  fontWeight:    700,
                  letterSpacing: 2.5,
                  color:         "rgba(0,0,0,0.55)",
                  textTransform: "uppercase",
                  marginBottom:  6,
                }}>
                  {heroStat.label}
                </div>
              )}
              {/* Hero number */}
              <div style={{
                fontFamily:    serifFontFamily,
                fontSize:      heroFontPx,
                fontWeight:    900,
                color:         COLORS.primary,
                letterSpacing: -5,
                lineHeight:    1.0,
              }}>
                {heroDisplay}
              </div>
              {/* Sub line — newspaper caption */}
              {heroStat.sub && (
                <div style={{
                  fontFamily,
                  fontSize:     18,
                  fontWeight:   500,
                  color:        "rgba(0,0,0,0.55)",
                  marginTop:    20,
                  letterSpacing: 0.2,
                }}>
                  {heroStat.sub}
                </div>
              )}
            </div>
          )}

          {/* Supporting stats — inline row */}
          {supporting.length > 0 && (
            <div style={{
              display:    "flex",
              alignItems: "flex-start",
              gap:        36,
              flexWrap:   "wrap",
            }}>
              {supporting.map((stat, idx) => {
                const i = idx + 1;           // real index in safeStats
                const as = activeState(i);
                // Count-up for this stat too — shorter, matches the narration beat
                const supNumVal = typeof stat.value === "number"
                  ? stat.value
                  : parseFloat(String(stat.value));
                const supIsNum  = !isNaN(supNumVal);
                const supDur    = supIsNum
                  ? Math.max(18, Math.min(50, 18 + Math.abs(supNumVal) * 1.5))
                  : 18;
                const supStart  = revealFrame(i);
                const supProg   = skipIntro
                  ? 1
                  : interpolate(frame, [supStart, supStart + supDur], [0, 1], {
                      extrapolateLeft:  "clamp",
                      extrapolateRight: "clamp",
                      easing: Easing.out(Easing.cubic),
                    });
                const display   = formatStatValue(stat.value, supProg);

                const opacity = skipIntro
                  ? 1
                  : interpolate(as, [0, 0.35, 1], [0.0, 0.55, 1.0], {
                      extrapolateLeft:  "clamp",
                      extrapolateRight: "clamp",
                    });
                const translateY = skipIntro
                  ? 0
                  : interpolate(
                      clamp01(spring({ fps, frame: frame - supStart, config: { damping: 22, stiffness: 60 } })),
                      [0, 1],
                      [14, 0],
                    );

                // Muted-when-inactive colour mix
                const isLead     = as > 0.55;
                const numberColor = isLead ? COLORS.primary : "rgba(0,0,0,0.55)";
                const subColor    = isLead ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0.40)";

                // Supporting number size: scale with string length
                const strLen  = String(display).replace(/,/g, "").length;
                const fontPx  = strLen >= 5 ? 54 : strLen === 4 ? 62 : 72;

                return (
                  <div
                    key={i}
                    style={{
                      opacity,
                      transform: `translateY(${translateY}px)`,
                      minWidth:  110,
                    }}
                  >
                    {stat.label && (
                      <div style={{
                        fontFamily,
                        fontSize:      11,
                        fontWeight:    700,
                        letterSpacing: 2,
                        color:         subColor,
                        textTransform: "uppercase",
                        marginBottom:  4,
                      }}>
                        {stat.label}
                      </div>
                    )}
                    <div style={{
                      fontFamily:    serifFontFamily,
                      fontSize:      fontPx,
                      fontWeight:    900,
                      color:         numberColor,
                      letterSpacing: -3,
                      lineHeight:    1,
                    }}>
                      {display}
                    </div>
                    {stat.sub && (
                      <div style={{
                        fontFamily,
                        fontSize:     13,
                        fontWeight:   500,
                        color:        subColor,
                        marginTop:    6,
                        letterSpacing: 0.2,
                      }}>
                        {stat.sub}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </AbsoluteFill>

      {/* z:2  Grain — always last, pointerEvents:none per §2 */}
      <Grain />
    </AbsoluteFill>
  );
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatStatValue(value: string | number | undefined, progress: number): string {
  if (value === undefined || value === null) return "";
  const num = typeof value === "number" ? value : parseFloat(String(value));
  if (isNaN(num)) return String(value);

  if (Number.isInteger(num)) {
    return Math.round(num * progress).toLocaleString();
  }
  return (num * progress).toFixed(1);
}
