/**
 * PlayerTrio — Editorial three-player layout.
 * Three equal columns, each with a full-height player image dissolving
 * into the parchment, serif name, club, and optional stat.
 */
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { fontFamily, serifFontFamily, Grain, PaperBackground, COLORS, SmartImg } from "./shared";

// ── Schema ────────────────────────────────────────────────────────────────────

const PlayerSlotSchema = z.object({
  name:       z.string().optional().default(""),
  image:      z.string().optional().default(""),
  club:       z.string().optional().default(""),
  clubColor:  z.string().optional().default(COLORS.gold),
  badgeSlug:  z.string().optional().default(""),
  stat:       z.string().optional().default(""),
  statLabel:  z.string().optional().default(""),
});

export const PlayerTrioPropsSchema = z.object({
  title:    z.string().optional().default("the contenders"),
  subtitle: z.string().optional().default(""),
  players:  z.tuple([PlayerSlotSchema, PlayerSlotSchema, PlayerSlotSchema]),
  bgColor:  z.string().optional().default("#f0ece4"),
});

export type PlayerTrioProps = z.infer<typeof PlayerTrioPropsSchema>;

// ── Layout constants ──────────────────────────────────────────────────────────

// Baseline grid: every player's feet snap to this % of frame height.
// Changing this one value keeps all three columns consistent.
const PLAYER_BASELINE = 0.72; // 72% of 1080px = ~778px from top

const TITLE_CLEARANCE = 190; // px — image starts below the title bar

// ── Timing ────────────────────────────────────────────────────────────────────

const COL_DELAYS   = [22, 34, 46] as const;
const NAME_OFFSET  = 16;

// ── Component ─────────────────────────────────────────────────────────────────

export const PlayerTrio: React.FC<PlayerTrioProps> = ({ title, subtitle, players, bgColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerProg = spring({ frame, fps, config: { damping: 28, stiffness: 55 } });
  const headerOp   = interpolate(headerProg, [0, 1], [0, 1],   { extrapolateRight: "clamp" });
  const headerY    = interpolate(headerProg, [0, 1], [-20, 0], { extrapolateRight: "clamp" });

  const ruleProg = spring({ frame: frame - 10, fps, config: { damping: 20, stiffness: 80 } });
  const ruleW    = interpolate(ruleProg, [0, 1], [0, 100], { extrapolateRight: "clamp" });
  const ruleOp   = interpolate(ruleProg, [0, 1], [0, 1],   { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      <PaperBackground color={bgColor} />
      <Grain />

      {/* ── Title strip ───────────────────────────────────────────────── */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, right: 0,
        padding: "64px 140px 0",
        zIndex: 20,
        pointerEvents: "none",
      }}>
        <div style={{ opacity: headerOp, transform: `translateY(${headerY}px)`, marginBottom: 18 }}>
          <div style={{
            fontFamily: serifFontFamily,
            fontSize: 68,
            fontWeight: 900,
            color: COLORS.primary,
            letterSpacing: -3,
            lineHeight: 1,
          }}>
            {title}
          </div>
          {subtitle && (
            <div style={{
              fontFamily,
              fontSize: 20,
              fontWeight: 500,
              color: COLORS.muted,
              letterSpacing: 0.5,
              marginTop: 10,
            }}>
              {subtitle}
            </div>
          )}
        </div>

        {/* Gold rule */}
        <div style={{
          height: 2,
          width: `${ruleW}%`,
          background: `linear-gradient(90deg, ${COLORS.gold}, rgba(201,168,76,0.12))`,
          borderRadius: 2,
          opacity: ruleOp,
        }} />
      </div>

      {/* ── Three player columns ──────────────────────────────────────── */}
      <div style={{ position: "absolute", inset: 0, display: "flex" }}>
        {(players as Array<z.infer<typeof PlayerSlotSchema>>).map((player, i) => {
          const delay    = COL_DELAYS[i];
          const colProg  = spring({ frame: frame - delay, fps, config: { damping: 22, stiffness: 52 } });
          const colOp    = interpolate(colProg, [0, 0.5], [0, 1],  { extrapolateRight: "clamp" });
          const colY     = interpolate(colProg, [0, 1],   [60, 0], { extrapolateRight: "clamp" });

          const nameProg = spring({ frame: frame - (delay + NAME_OFFSET), fps, config: { damping: 26, stiffness: 58 } });
          const nameOp   = interpolate(nameProg, [0, 0.6], [0, 1],  { extrapolateRight: "clamp" });
          const nameY    = interpolate(nameProg, [0, 1],   [24, 0], { extrapolateRight: "clamp" });

          return (
            <div
              key={i}
              style={{
                flex: 1,
                position: "relative",
                borderRight: i < 2 ? "1px solid rgba(0,0,0,0.07)" : "none",
                overflow: "hidden",
              }}
            >
              {/* Player image — snapped to baseline grid, fades into parchment at feet */}
              {player.image && (
                <div style={{
                  position: "absolute",
                  top: TITLE_CLEARANCE,
                  left: 0,
                  right: 0,
                  // Bottom edge = 1 - PLAYER_BASELINE so the image ends exactly at the baseline
                  bottom: `${(1 - PLAYER_BASELINE) * 100}%`,
                  opacity: colOp,
                  transform: `translateY(${colY}px)`,
                  // Fade out at feet level so the cutout dissolves cleanly into parchment
                  WebkitMaskImage: "linear-gradient(to bottom, black 52%, transparent 94%)",
                  maskImage:       "linear-gradient(to bottom, black 52%, transparent 94%)",
                }}>
                  <SmartImg
                    src={player.image}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      objectPosition: "top center",
                      filter: "contrast(1.04) brightness(1.02)",
                    }}
                  />
                </div>
              )}

              {/* Ground shadow — blurred ellipse at baseline anchoring each figure */}
              <div style={{
                position: "absolute",
                top: `${PLAYER_BASELINE * 100 - 4}%`,
                left: "5%",
                right: "5%",
                height: 60,
                opacity: colOp,
                background: "radial-gradient(ellipse 80% 100% at 50% 30%, rgba(0,0,0,0.03) 0%, transparent 100%)",
                filter: "blur(14px)",
                pointerEvents: "none",
              }} />

              {/* Name + info block — sits in the bottom third over the dissolved image */}
              <div style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                padding: "0 44px 60px",
                opacity: nameOp,
                transform: `translateY(${nameY}px)`,
              }}>
                {/* Club colour accent pip */}
                <div style={{
                  width: 36,
                  height: 3,
                  borderRadius: 2,
                  backgroundColor: player.clubColor,
                  marginBottom: 18,
                  boxShadow: `0 0 10px ${player.clubColor}66`,
                }} />

                {/* Player name */}
                <div style={{
                  fontFamily: serifFontFamily,
                  fontSize: 54,
                  fontWeight: 900,
                  color: COLORS.primary,
                  letterSpacing: -2,
                  lineHeight: 1,
                  marginBottom: 12,
                }}>
                  {player.name}
                </div>

                {/* Club */}
                {player.club && (
                  <div style={{
                    fontFamily,
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: 2.5,
                    color: COLORS.muted,
                    textTransform: "uppercase" as const,
                    marginBottom: player.stat ? 10 : 0,
                  }}>
                    {player.club}
                  </div>
                )}

                {/* Stat */}
                {player.stat && (
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
                    <span style={{
                      fontFamily: serifFontFamily,
                      fontSize: 32,
                      fontWeight: 900,
                      color: player.clubColor,
                      letterSpacing: -1,
                    }}>
                      {player.stat}
                    </span>
                    {player.statLabel && (
                      <span style={{
                        fontFamily,
                        fontSize: 13,
                        fontWeight: 500,
                        color: COLORS.muted,
                        letterSpacing: 0.3,
                      }}>
                        {player.statLabel}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
