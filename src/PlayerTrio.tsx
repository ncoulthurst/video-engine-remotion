/**
 * PlayerTrio — Editorial three-player layout.
 * Three equal columns, each with a full-height player image dissolving
 * into the parchment, serif name, club, and optional stat.
 */
import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { COLORS, SmartImg, TRIO_PORTRAIT_MASK, WorldStateSchema } from "./shared";
import { Ground, TYPE, EASE, prog, beatDelay, stagger, resolveTheme, Kicker } from "./lib/kit";

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
  players:  z.array(PlayerSlotSchema).length(3),
  bgColor:    z.string().optional().default("#f0ece4"),
  skipIntro:  z.boolean().optional().default(false),
  beats:      z.record(z.string(), z.number()).optional(),
  worldState: WorldStateSchema.optional(),
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

export const PlayerTrio: React.FC<PlayerTrioProps> = ({ title, subtitle, players, bgColor, skipIntro = false, beats, worldState }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const wsAccent = (worldState as { accentColor?: string } | undefined)?.accentColor;
  const t = resolveTheme("paper", wsAccent || COLORS.gold, bgColor);

  const headerProg = skipIntro ? 1 : prog(frame, 0, 20, EASE.snap);
  const headerOp   = headerProg;
  const headerY    = interpolate(headerProg, [0, 1], [-20, 0], { extrapolateRight: "clamp" });

  const ruleProg = skipIntro ? 1 : prog(frame, 10, 20, EASE.out);
  const ruleW    = ruleProg * 100;
  const ruleOp   = ruleProg;

  // H1: the first column lands on the "entity" beat when the narrator names the trio.
  const colStart = beatDelay(beats, "entity", fps, COL_DELAYS[0]);

  return (
    <Ground ground="paper" bgColor={bgColor} accentColor={wsAccent || COLORS.gold} domain="football" texture skipIntro={skipIntro} pad={0}>

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
            fontFamily: TYPE.serif,
            fontSize: 68,
            fontWeight: 900,
            color: t.ink,
            letterSpacing: -3,
            lineHeight: 1,
          }}>
            {title}
          </div>
          {subtitle && (
            <div style={{
              fontFamily: TYPE.sans,
              fontSize: 20,
              fontWeight: 500,
              color: t.muted,
              letterSpacing: 0.5,
              marginTop: 10,
            }}>
              {subtitle}
            </div>
          )}
        </div>

        {/* Accent rule — uses worldState accent if present, else gold */}
        <div style={{
          height: 2,
          width: `${ruleW}%`,
          background: `linear-gradient(90deg, ${t.accent}, transparent)`,
          borderRadius: 2,
          opacity: ruleOp,
        }} />
      </div>

      {/* ── Three player columns ──────────────────────────────────────── */}
      <div style={{ position: "absolute", inset: 0, display: "flex" }}>
        {(players as Array<z.infer<typeof PlayerSlotSchema>>).map((player, i) => {
          const delay    = colStart + stagger(i, 12);
          const colProg  = skipIntro ? 1 : prog(frame, delay, 26, EASE.soft);
          const colOp    = interpolate(colProg, [0, 0.5], [0, 1],  { extrapolateRight: "clamp" });
          const colY     = interpolate(colProg, [0, 1],   [60, 0], { extrapolateRight: "clamp" });

          const nameProg = skipIntro ? 1 : prog(frame, delay + NAME_OFFSET, 22, EASE.snap);
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
              {/* Player image — radial mask softens both side AND bottom edges
                  so adjacent cutouts blend into each other instead of meeting
                  at hard column boundaries. Subtle parallax drift per column
                  keeps the figures feeling alive on camera. */}
              {player.image && (() => {
                const drift = Math.sin((frame + i * 24) * 0.01) * (1.5 + i * 0.5);
                return (
                  <div style={{
                    position: "absolute",
                    top: TITLE_CLEARANCE,
                    left: 0,
                    right: 0,
                    bottom: `${(1 - PLAYER_BASELINE) * 100}%`,
                    opacity: colOp,
                    transform: `translateY(${colY + drift}px)`,
                    WebkitMaskImage: TRIO_PORTRAIT_MASK,
                    maskImage:       TRIO_PORTRAIT_MASK,
                    mixBlendMode:    "multiply",
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
                );
              })()}

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
                  fontFamily: TYPE.serif,
                  fontSize: 54,
                  fontWeight: 900,
                  color: t.ink,
                  letterSpacing: -2,
                  lineHeight: 1,
                  marginBottom: 12,
                }}>
                  {player.name}
                </div>

                {/* Club */}
                {player.club && (
                  <div style={{ marginBottom: player.stat ? 10 : 0 }}>
                    <Kicker label={player.club} theme={t} frame={frame} />
                  </div>
                )}

                {/* Stat */}
                {player.stat && (
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
                    <span style={{
                      fontFamily: TYPE.serif,
                      fontSize: 32,
                      fontWeight: 900,
                      color: player.clubColor,
                      letterSpacing: -1,
                    }}>
                      {player.stat}
                    </span>
                    {player.statLabel && (
                      <span style={{
                        fontFamily: TYPE.mono,
                        fontSize: 13,
                        fontWeight: 500,
                        color: t.muted,
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
    </Ground>
  );
};
