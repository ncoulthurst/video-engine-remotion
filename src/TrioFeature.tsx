/**
 * TrioFeature — Full-height editorial three-player layout.
 * No header. Players span the entire frame height.
 * Name + nationality only — no stats or title copy.
 */
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { fontFamily, serifFontFamily, Grain, PaperBackground, COLORS, SmartImg } from "./shared";

// ── Schema ────────────────────────────────────────────────────────────────────

const PlayerSlotSchema = z.object({
  name:        z.string().optional().default(""),
  image:       z.string().optional().default(""),
  nationality: z.string().optional().default(""),
  clubColor:   z.string().optional().default(COLORS.gold),
  badgeSlug:   z.string().optional().default(""),
});

export const TrioFeaturePropsSchema = z.object({
  players: z.tuple([PlayerSlotSchema, PlayerSlotSchema, PlayerSlotSchema]),
  bgColor: z.string().optional().default("#f0ece4"),
});

export type TrioFeatureProps = z.infer<typeof TrioFeaturePropsSchema>;

// ── Layout constants ──────────────────────────────────────────────────────────

const PLAYER_BASELINE = 0.86; // 86% of frame height — sits just above the text block

// ── Timing ────────────────────────────────────────────────────────────────────

const COL_DELAYS  = [10, 22, 34] as const;
const NAME_OFFSET = 16;

// ── Component ─────────────────────────────────────────────────────────────────

export const TrioFeature: React.FC<TrioFeatureProps> = ({ players, bgColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill>
      <PaperBackground color={bgColor} />
      <Grain />

      {/* ── Three player columns ──────────────────────────────────────── */}
      <div style={{ position: "absolute", inset: 0, display: "flex" }}>
        {(players as Array<z.infer<typeof PlayerSlotSchema>>).map((player, i) => {
          const delay    = COL_DELAYS[i];
          const colProg  = spring({ frame: frame - delay, fps, config: { damping: 22, stiffness: 52 } });
          const colOp    = interpolate(colProg, [0, 0.5], [0, 1],  { extrapolateRight: "clamp" });
          const colY     = interpolate(colProg, [0, 1],   [50, 0], { extrapolateRight: "clamp" });

          const nameProg = spring({ frame: frame - (delay + NAME_OFFSET), fps, config: { damping: 26, stiffness: 58 } });
          const nameOp   = interpolate(nameProg, [0, 0.6], [0, 1],  { extrapolateRight: "clamp" });
          const nameY    = interpolate(nameProg, [0, 1],   [20, 0], { extrapolateRight: "clamp" });

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
              {/* Player image — full height, top edge softened, feet dissolve at baseline */}
              {player.image && (
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: `${(1 - PLAYER_BASELINE) * 100}%`,
                  opacity: colOp,
                  transform: `translateY(${colY}px)`,
                  // Soft top edge so the image doesn't hard-clip at the frame boundary.
                  // Clean dissolve at feet into the parchment below.
                  WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 5%, black 52%, transparent 93%)",
                  maskImage:       "linear-gradient(to bottom, transparent 0%, black 5%, black 52%, transparent 93%)",
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

              {/* Ground shadow — blurred ellipse anchoring figure at baseline */}
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

              {/* Name + nationality */}
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
                  boxShadow: `0 0 10px ${player.clubColor}55`,
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

                {/* Nationality */}
                {player.nationality && (
                  <div style={{
                    fontFamily,
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: 2.5,
                    color: COLORS.muted,
                    textTransform: "uppercase" as const,
                  }}>
                    {player.nationality}
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
