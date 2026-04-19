/**
 * IntrcptAwardsList — year-by-year award podium revealing row by row.
 * Entity's wins are highlighted in gold. Others are dimmed.
 * Outro: entity's total wins pop with underdamped spring.
 *
 * Use for: Ballon d'Or, Golden Boot, PFA Player of the Year, etc.
 */
import React from "react";
import { AbsoluteFill, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { fontFamily, serifFontFamily, PaperBackground, Grain, COLORS, SmartImg } from "./shared";

const AwardYearSchema = z.object({
  year:     z.string(),
  winner:   z.string(),
  /** The entity being documented — highlighted if they won */
  entity:   z.string().default(""),
  /** Ranking of the entity that year (1 = winner) */
  position: z.number().default(0),
  /** Extra context (club, votes, goals) */
  detail:   z.string().default(""),
});

export const IntrcptAwardsListPropsSchema = z.object({
  award:        z.string().default("Ballon d'Or"),
  entityName:   z.string().default("Lionel Messi"),
  /** Player/entity image — filename inside /public. Large render on the right. */
  entityImage:  z.string().optional(),
  /** Award trophy image — filename inside /public. Shown in each winning row. */
  awardImage:   z.string().optional(),
  accentColor:  z.string().default("#C9A84C"),
  bgColor:      z.string().default("#f0ece4"),
  stagger:      z.number().default(18),
  holdDuration: z.number().default(40),
  years: z.array(AwardYearSchema).optional(),
});
export type IntrcptAwardsListProps = z.infer<typeof IntrcptAwardsListPropsSchema>;

const ROW_H    = 88;
const LIST_TOP = 180;
const LEFT_PAD = 120;

export const IntrcptAwardsList: React.FC<IntrcptAwardsListProps> = ({
  award, entityName, entityImage, awardImage, accentColor, bgColor, stagger, holdDuration, years: yearsProp,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const years = yearsProp ?? [];

  const INTRO_F = 20;

  const titleProg = spring({ frame: frame - INTRO_F, fps, config: { damping: 24, stiffness: 55 } });

  const wins = years.filter(y => y.winner === entityName || y.entity === entityName).length;
  const OUTRO_F = INTRO_F + years.length * stagger + holdDuration;
  const outroWinsPop = spring({ frame: frame - OUTRO_F, fps,
    config: { damping: 7, stiffness: 260, mass: 0.75 } });

  return (
    <AbsoluteFill>
      <PaperBackground color={bgColor} />
      <Grain />
      {/* Entity image — right side, masked to blend into background */}
      {entityImage && (
        <div style={{
          position: "absolute", right: 0, bottom: 0,
          width: 760, height: "100%",
          zIndex: 5, pointerEvents: "none",
          opacity: interpolate(titleProg, [0, 0.8], [0, 1], { extrapolateRight: "clamp" }),
          WebkitMaskImage: "linear-gradient(to left, black 30%, transparent 80%), linear-gradient(to top, black 60%, transparent 100%)",
          maskImage:       "linear-gradient(to left, black 30%, transparent 80%), linear-gradient(to top, black 60%, transparent 100%)",
          WebkitMaskComposite: "destination-in",
          maskComposite: "intersect",
        }}>
          <SmartImg
            src={entityImage}
            style={{
              width: "100%", height: "100%",
              objectFit: "contain", objectPosition: "bottom right",
              filter: "contrast(1.05) brightness(1.02)",
              opacity: 0.28,
            }}
          />
        </div>
      )}

      <AbsoluteFill style={{ zIndex: 10 }}>
        {/* Title */}
        <div style={{
          position: "absolute",
          left: LEFT_PAD, top: 60,
          opacity: interpolate(titleProg, [0, 0.6], [0, 1], { extrapolateRight: "clamp" }),
          transform: `translateY(${interpolate(titleProg, [0, 1], [14, 0])}px)`,
        }}>
          <div style={{ fontFamily, fontSize: 13, fontWeight: 700, textTransform: "uppercase",
            letterSpacing: "0.18em", color: COLORS.muted, marginBottom: 6 }}>
            Award History
          </div>
          <div style={{ fontFamily: serifFontFamily, fontSize: 52, fontWeight: 900,
            color: COLORS.primary, letterSpacing: -2 }}>{award}</div>
          {/* Gold accent rule */}
          <div style={{ width: 60, height: 3, background: accentColor, marginTop: 12 }} />
        </div>

        {/* Rows */}
        {years.map((y, i) => {
          const revealF = INTRO_F + i * stagger;
          const rowProg = spring({ frame: frame - revealF, fps, config: { damping: 20, stiffness: 120 } });
          const isWin   = y.winner === entityName || (y.entity === entityName && y.position === 1);
          const isEntity= y.entity === entityName || y.winner === entityName;
          const top     = LIST_TOP + i * ROW_H;

          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: LEFT_PAD,
                top,
                right: 120,
                height: ROW_H - 8,
                opacity: rowProg,
                transform: `translateX(${interpolate(rowProg, [0, 1], [-20, 0])}px)`,
                display: "flex",
                alignItems: "center",
                gap: 20,
                background: isWin ? `${accentColor}18` : "transparent",
                borderRadius: 6,
                padding: "0 16px",
                borderLeft: isWin ? `3px solid ${accentColor}` : "3px solid transparent",
              }}
            >
              {/* Year */}
              <div style={{
                fontFamily, fontSize: 15, fontWeight: 700,
                color: isWin ? accentColor : COLORS.muted,
                width: 60, flexShrink: 0,
                letterSpacing: "0.02em",
              }}>{y.year}</div>

              {/* Position medal */}
              {y.position && (
                <div style={{
                  fontFamily: serifFontFamily,
                  fontSize: isWin ? 32 : 22,
                  fontWeight: 900,
                  color: y.position === 1 ? accentColor : y.position === 2 ? "#aaa" : "#888",
                  width: 40, flexShrink: 0, textAlign: "center",
                }}>
                  {y.position === 1 ? "1st" : y.position === 2 ? "2nd" : `${y.position}th`}
                </div>
              )}

              {/* Winner name */}
              <div style={{
                fontFamily: serifFontFamily,
                fontSize: isWin ? 34 : 28,
                fontWeight: 900,
                color: isWin ? COLORS.primary : COLORS.muted,
                flex: 1,
                letterSpacing: -0.5,
              }}>{y.winner}</div>

              {/* Detail */}
              {y.detail && (
                <div style={{
                  fontFamily, fontSize: 13, color: COLORS.muted,
                  opacity: isEntity ? 0.8 : 0.4,
                }}>{y.detail}</div>
              )}

              {/* Trophy icon for wins */}
              {isWin && (
                awardImage
                  ? <SmartImg
                      src={awardImage}
                      style={{ width: 44, height: 44, objectFit: "contain", flexShrink: 0 }}
                    />
                  : <div style={{ fontSize: 24, flexShrink: 0 }}>🏆</div>
              )}
            </div>
          );
        })}

        {/* Outro — total wins pop */}
        <div style={{
          position: "absolute",
          right: 120, bottom: 60,
          textAlign: "right",
          opacity: interpolate(outroWinsPop, [0, 0.4], [0, 1], { extrapolateRight: "clamp" }),
          transform: `scale(${interpolate(outroWinsPop, [0, 1], [0.6, 1])})`,
          transformOrigin: "right bottom",
        }}>
          <div style={{
            fontFamily: serifFontFamily, fontSize: 100, fontWeight: 900,
            color: accentColor, lineHeight: 0.9, letterSpacing: -4,
          }}>{wins}</div>
          <div style={{
            fontFamily, fontSize: 15, fontWeight: 700, textTransform: "uppercase",
            letterSpacing: "0.12em", color: COLORS.muted, marginTop: 8,
          }}>{award}{wins !== 1 ? "s" : ""}</div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
