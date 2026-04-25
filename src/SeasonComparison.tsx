import React from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { z } from "zod";
import {
  Grain, PaperBackground,
  COLORS, fontFamily, serifFontFamily, SmartImg, hexToRgb, WorldStateSchema
} from "./shared";

const PlayerSlotSchema = z.object({
  name:      z.string().optional().default(""),
  club:      z.string().optional().default(""),
  badgeSlug: z.string().optional().default(""),
  image:     z.string().optional().default(""),
  color:     z.string().optional().default(COLORS.gold),
});

const StatRowSchema = z.object({
  label:  z.string().optional().default(""),
  valueA: z.number(),
  valueB: z.number(),
});

export const SeasonComparisonPropsSchema = z.object({
  playerA:     PlayerSlotSchema,
  playerB:     PlayerSlotSchema,
  season:      z.string().optional().default("2024/25"),
  competition: z.string().optional().default(""),
  stats:       z.array(StatRowSchema),
  bgColor:     z.string().optional().default("#f0ece4"),
  worldState: WorldStateSchema.optional(),
  skipIntro: z.boolean().optional().default(false),
});

export type SeasonComparisonProps = z.infer<typeof SeasonComparisonPropsSchema>;

const LABEL_W   = 200;
const BAR_MAX_W = 420;
const ROW_H     = 110;
const ROW_START = 40;
const STAGGER   = 11;
const IMG_W     = 680;

export const SeasonComparison: React.FC<SeasonComparisonProps> = ({
  playerA, playerB, season, competition, stats, bgColor, skipIntro = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ── Auto-rank: put the player who leads more stats on the left ──────────
  const winsA = stats.filter(s => s.valueA >= s.valueB).length;
  const winsB = stats.filter(s => s.valueB > s.valueA).length;
  const swap  = winsB > winsA;

  const left  = swap ? playerB : playerA;
  const right = swap ? playerA : playerB;
  const rows  = stats.map(s =>
    swap ? { ...s, valueA: s.valueB, valueB: s.valueA } : s
  );

  // ── Colour ambience ─────────────────────────────────────────────────────
  const [lR, lG, lB] = hexToRgb(left.color);
  const [rR, rG, rB] = hexToRgb(right.color);

  // ── Entrance animations ─────────────────────────────────────────────────
  const headerProg = skipIntro ? 1 : spring({ frame, fps, config: { damping: 28, stiffness: 55 } });
  const headerOp   = interpolate(headerProg, [0, 1], [0, 1], { extrapolateRight: "clamp" });
  const headerY    = interpolate(headerProg, [0, 1], [-20, 0], { extrapolateRight: "clamp" });

  const leftNameX  = skipIntro ? 0 : spring({ frame, fps, from: -60, to: 0, config: { damping: 22, stiffness: 60 }, delay: 8 });
  const rightNameX = skipIntro ? 0 : spring({ frame, fps, from:  60, to: 0, config: { damping: 22, stiffness: 60 }, delay: 8 });
  const nameOp     = skipIntro ? 1 : interpolate(frame, [8, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const ruleW  = skipIntro ? 1 : spring({ frame, fps, from: 0, to: 1, config: { damping: 22, stiffness: 70 }, delay: 26 });
  const colsOp = skipIntro ? 1 : interpolate(frame, [26, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // ── Player image animations ─────────────────────────────────────────────
  const imgProg  = spring({ frame, fps, config: { damping: 26, stiffness: 50 }, delay: 4 });
  const imgOp    = interpolate(imgProg, [0, 1], [0, 0.82], { extrapolateRight: "clamp" });
  const leftImgX = interpolate(imgProg, [0, 1], [-60, 0], { extrapolateRight: "clamp" });
  const rightImgX= interpolate(imgProg, [0, 1], [ 60, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      <PaperBackground color={bgColor} />

      {/* ── Flanking player images ──────────────────────────────────── */}
      {left.image && (
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0,
          width: IMG_W,
          opacity: imgOp,
          transform: `translateX(${leftImgX}px)`,
          WebkitMaskImage: "linear-gradient(to right, black 30%, transparent 82%)",
          maskImage:        "linear-gradient(to right, black 30%, transparent 82%)",
          zIndex: 1,
        }}>
          <SmartImg
            src={left.image}
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center" }}
          />
        </div>
      )}

      {right.image && (
        <div style={{
          position: "absolute", right: 0, top: 0, bottom: 0,
          width: IMG_W,
          opacity: imgOp,
          transform: `translateX(${rightImgX}px)`,
          WebkitMaskImage: "linear-gradient(to left, black 30%, transparent 82%)",
          maskImage:        "linear-gradient(to left, black 30%, transparent 82%)",
          zIndex: 1,
        }}>
          <SmartImg
            src={right.image}
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center" }}
          />
        </div>
      )}

      {/* Subtle left/right colour wash (sits above images) */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", zIndex: 2,
        background: `linear-gradient(90deg, rgba(${lR},${lG},${lB},0.08) 0%, transparent 38%, transparent 62%, rgba(${rR},${rG},${rB},0.08) 100%)`,
      }} />

      <div style={{ position: "absolute", inset: 0, zIndex: 3, pointerEvents: "none" }}>
        <Grain />
      </div>

      {/* ── Content ─────────────────────────────────────────────────── */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 10,
        display: "flex", flexDirection: "column",
        padding: "52px 130px 48px",
      }}>

        {/* Top meta: season + competition */}
        <div style={{
          opacity: headerOp,
          transform: `translateY(${headerY}px)`,
          textAlign: "center",
          marginBottom: 28,
        }}>
          <div style={{
            fontFamily, fontSize: 13, fontWeight: 700, letterSpacing: 3.5,
            color: COLORS.muted, textTransform: "uppercase" as const,
          }}>
            {competition ? `${competition} · ` : ""}{season}
          </div>
          <div style={{
            fontFamily, fontSize: 13, fontWeight: 600, letterSpacing: 2,
            color: COLORS.colHeader, textTransform: "uppercase" as const, marginTop: 4,
          }}>
            player comparison
          </div>
        </div>

        {/* Stat rows */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 0 }}>
          {rows.map((stat, i) => {
            const delay  = ROW_START + i * STAGGER;
            const prog   = skipIntro ? 1 : spring({ frame: frame - delay, fps, config: { damping: 26, stiffness: 60 } });
            const rowOp  = interpolate(prog, [0, 0.5], [0, 1], { extrapolateRight: "clamp" });

            const maxV   = Math.max(stat.valueA, stat.valueB, 1);
            const barWA  = interpolate(prog, [0, 1], [0, (stat.valueA / maxV) * BAR_MAX_W], { extrapolateRight: "clamp" });
            const barWB  = interpolate(prog, [0, 1], [0, (stat.valueB / maxV) * BAR_MAX_W], { extrapolateRight: "clamp" });

            const leadsA = stat.valueA > stat.valueB;
            const leadsB = stat.valueB > stat.valueA;

            const fmtVal = (v: number) =>
              Number.isInteger(v) ? v.toLocaleString() : v.toFixed(1);

            return (
              <div key={i} style={{
                opacity: rowOp,
                display: "flex", alignItems: "center",
                height: ROW_H,
                borderBottom: i < rows.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none",
              }}>
                {/* Left: value then bar */}
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{
                      fontFamily: serifFontFamily,
                      fontSize: leadsA ? 80 : 48, fontWeight: 900,
                      color: leadsA ? COLORS.primary : COLORS.colHeader,
                      letterSpacing: -2, minWidth: 100, textAlign: "right" as const,
                      lineHeight: 1,
                    }}>
                      {fmtVal(stat.valueA)}
                    </span>
                  </div>
                  <div style={{
                    width: barWA, height: leadsA ? 14 : 8, borderRadius: "6px 0 0 6px",
                    background: leadsA
                      ? `linear-gradient(90deg, rgba(${lR},${lG},${lB},0.2), ${left.color})`
                      : `rgba(${lR},${lG},${lB},0.18)`,
                    flexShrink: 0,
                  }} />
                </div>

                {/* Centre label */}
                <div style={{
                  width: LABEL_W, flexShrink: 0,
                  textAlign: "center" as const,
                  fontFamily, fontSize: 13, fontWeight: 800,
                  letterSpacing: 2.5, color: COLORS.colHeader,
                  textTransform: "uppercase" as const,
                }}>
                  {stat.label}
                </div>

                {/* Right: bar then value */}
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{
                    width: barWB, height: leadsB ? 14 : 8, borderRadius: "0 6px 6px 0",
                    background: leadsB
                      ? `linear-gradient(90deg, ${right.color}, rgba(${rR},${rG},${rB},0.2))`
                      : `rgba(${rR},${rG},${rB},0.18)`,
                    flexShrink: 0,
                  }} />
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{
                      fontFamily: serifFontFamily,
                      fontSize: leadsB ? 80 : 48, fontWeight: 900,
                      color: leadsB ? COLORS.primary : COLORS.colHeader,
                      letterSpacing: -2, minWidth: 100,
                      lineHeight: 1,
                    }}>
                      {fmtVal(stat.valueB)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* ── Bottom player cards ──────────────────────────────────────── */}

      {/* Left card */}
      <div style={{
        position: "absolute", bottom: 48, left: 48, zIndex: 20,
        opacity: nameOp,
        transform: `translateX(${leftNameX}px)`,
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 18,
          background: "rgba(240,236,228,0.92)",
          borderRadius: 16,
          padding: "16px 24px 16px 18px",
          boxShadow: "0 6px 28px rgba(0,0,0,0.18)",
          borderLeft: `5px solid ${left.color}`,
        }}>
          {left.badgeSlug ? (
            <SmartImg src={`badges/${left.badgeSlug}`} style={{ width: 56, height: 56, objectFit: "contain" as const, flexShrink: 0 }} />
          ) : (
            <div style={{
              width: 56, height: 56, borderRadius: "50%", flexShrink: 0,
              background: `rgba(${lR},${lG},${lB},0.15)`,
              border: `2px solid ${left.color}`,
            }} />
          )}
          <div>
            <div style={{
              fontFamily: serifFontFamily, fontSize: 40, fontWeight: 900,
              color: COLORS.primary, letterSpacing: -1.5, lineHeight: 1,
            }}>
              {left.name}
            </div>
            {left.club && (
              <div style={{
                fontFamily, fontSize: 15, fontWeight: 700,
                color: left.color, letterSpacing: 0.5, marginTop: 5,
              }}>
                {left.club}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right card */}
      <div style={{
        position: "absolute", bottom: 48, right: 48, zIndex: 20,
        opacity: nameOp,
        transform: `translateX(${rightNameX}px)`,
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 18,
          background: "rgba(240,236,228,0.92)",
          borderRadius: 16,
          padding: "16px 18px 16px 24px",
          boxShadow: "0 6px 28px rgba(0,0,0,0.18)",
          borderRight: `5px solid ${right.color}`,
        }}>
          <div style={{ textAlign: "right" as const }}>
            <div style={{
              fontFamily: serifFontFamily, fontSize: 40, fontWeight: 900,
              color: COLORS.primary, letterSpacing: -1.5, lineHeight: 1,
            }}>
              {right.name}
            </div>
            {right.club && (
              <div style={{
                fontFamily, fontSize: 15, fontWeight: 700,
                color: right.color, letterSpacing: 0.5, marginTop: 5,
              }}>
                {right.club}
              </div>
            )}
          </div>
          {right.badgeSlug ? (
            <SmartImg src={`badges/${right.badgeSlug}`} style={{ width: 56, height: 56, objectFit: "contain" as const, flexShrink: 0 }} />
          ) : (
            <div style={{
              width: 56, height: 56, borderRadius: "50%", flexShrink: 0,
              background: `rgba(${rR},${rG},${rB},0.15)`,
              border: `2px solid ${right.color}`,
            }} />
          )}
        </div>
      </div>

    </AbsoluteFill>
  );
};
