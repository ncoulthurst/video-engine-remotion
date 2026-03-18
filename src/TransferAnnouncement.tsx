import React from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { z } from "zod";
import {
  Grain, PaperBackground,
  COLORS, SPRINGS, fontFamily, serifFontFamily, SmartImg, hexToRgb,
} from "./shared";

export const TransferAnnouncementPropsSchema = z.object({
  playerName:   z.string().default("Player Name"),
  fromClub:     z.string().default("From Club"),
  toClub:       z.string().default("To Club"),
  fromBadgeSlug: z.string().optional().default(""),
  toBadgeSlug:   z.string().optional().default(""),
  fromColor:    z.string().optional().default("#555"),
  toColor:      z.string().optional().default("#555"),
  fee:          z.string().default("£0m"),
  year:         z.string().optional().default(""),
  nationality:  z.string().optional().default(""),
  bgColor:      z.string().default("#f0ece4"),
});

export type TransferAnnouncementProps = z.infer<typeof TransferAnnouncementPropsSchema>;

export const TransferAnnouncement: React.FC<TransferAnnouncementProps> = ({
  playerName, fromClub, toClub, fromBadgeSlug, toBadgeSlug,
  fromColor = "#555", toColor = "#555", fee, year, nationality, bgColor = "#f0ece4",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fromOp    = interpolate(frame, [0, 22], [0, 1], { extrapolateRight: "clamp" });
  const fromX     = spring({ frame, fps, from: -60, to: 0, config: SPRINGS.feature, delay: 0 });

  const arrowOp   = interpolate(frame, [16, 36], [0, 1], { extrapolateRight: "clamp" });
  const arrowScale = spring({ frame, fps, from: 0, to: 1, config: SPRINGS.bounce, delay: 16 });

  const toOp      = interpolate(frame, [22, 44], [0, 1], { extrapolateRight: "clamp" });
  const toX       = spring({ frame, fps, from: 60, to: 0, config: SPRINGS.feature, delay: 22 });

  const nameOp    = interpolate(frame, [32, 58], [0, 1], { extrapolateRight: "clamp" });
  const nameY     = spring({ frame, fps, from: 40, to: 0, config: SPRINGS.header, delay: 32 });

  const feeOp     = interpolate(frame, [50, 72], [0, 1], { extrapolateRight: "clamp" });
  const feeScale  = spring({ frame, fps, from: 0.6, to: 1, config: SPRINGS.bounce, delay: 50 });

  const metaOp    = interpolate(frame, [68, 88], [0, 1], { extrapolateRight: "clamp" });

  const [tr, tg, tb] = hexToRgb(toColor);

  return (
    <AbsoluteFill>
      <PaperBackground color={bgColor} />
      <Grain />

      {/* Destination club colour glow */}
      <div style={{
        position: "absolute",
        right: -100,
        top: "50%",
        transform: "translateY(-50%)",
        width: 600,
        height: 600,
        borderRadius: "50%",
        background: `radial-gradient(circle, rgba(${tr},${tg},${tb},0.14) 0%, transparent 65%)`,
        filter: "blur(60px)",
        pointerEvents: "none",
      }} />

      <div style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 0,
      }}>
        {/* Clubs row */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 48,
          marginBottom: 40,
        }}>
          {/* From club */}
          <div style={{
            opacity: fromOp,
            transform: `translateX(${fromX}px)`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}>
            <div style={{
              width: 110,
              height: 110,
              borderRadius: "50%",
              background: `rgba(${hexToRgb(fromColor).join(",")},0.08)`,
              border: `2px solid rgba(${hexToRgb(fromColor).join(",")},0.25)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              {fromBadgeSlug ? (
                <SmartImg src={fromBadgeSlug} style={{ width: 80, height: 80, objectFit: "contain" }} />
              ) : (
                <div style={{ fontFamily, fontSize: 32, fontWeight: 900, color: fromColor }}>{fromClub[0]}</div>
              )}
            </div>
            <div style={{
              fontFamily,
              fontSize: 16,
              fontWeight: 600,
              color: COLORS.secondary,
              letterSpacing: 0.5,
              textAlign: "center",
            }}>
              {fromClub}
            </div>
          </div>

          {/* Arrow */}
          <div style={{
            opacity: arrowOp,
            transform: `scale(${arrowScale})`,
            display: "flex",
            alignItems: "center",
          }}>
            <svg width={64} height={32} viewBox="0 0 64 32" fill="none">
              <defs>
                <linearGradient id="arrowGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={fromColor} />
                  <stop offset="100%" stopColor={toColor} />
                </linearGradient>
              </defs>
              <line x1="4" y1="16" x2="52" y2="16" stroke="url(#arrowGrad)" strokeWidth="3" strokeLinecap="round" />
              <polyline points="44,6 58,16 44,26" stroke={toColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>

          {/* To club */}
          <div style={{
            opacity: toOp,
            transform: `translateX(${toX}px)`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}>
            <div style={{
              width: 110,
              height: 110,
              borderRadius: "50%",
              background: `rgba(${hexToRgb(toColor).join(",")},0.12)`,
              border: `2px solid rgba(${hexToRgb(toColor).join(",")},0.4)`,
              boxShadow: `0 0 30px rgba(${hexToRgb(toColor).join(",")},0.2)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              {toBadgeSlug ? (
                <SmartImg src={toBadgeSlug} style={{ width: 80, height: 80, objectFit: "contain" }} />
              ) : (
                <div style={{ fontFamily, fontSize: 32, fontWeight: 900, color: toColor }}>{toClub[0]}</div>
              )}
            </div>
            <div style={{
              fontFamily,
              fontSize: 16,
              fontWeight: 600,
              color: COLORS.secondary,
              letterSpacing: 0.5,
              textAlign: "center",
            }}>
              {toClub}
            </div>
          </div>
        </div>

        {/* Player name */}
        <div style={{
          opacity: nameOp,
          transform: `translateY(${nameY}px)`,
          fontFamily: serifFontFamily,
          fontSize: 72,
          fontWeight: 900,
          color: COLORS.primary,
          letterSpacing: -2,
          textAlign: "center",
          lineHeight: 1,
          marginBottom: 28,
        }}>
          {playerName}
        </div>

        {/* Fee */}
        <div style={{
          opacity: feeOp,
          transform: `scale(${feeScale})`,
          transformOrigin: "center center",
          backgroundColor: toColor,
          borderRadius: 16,
          padding: "14px 44px",
          marginBottom: 16,
          boxShadow: `0 8px 32px rgba(${hexToRgb(toColor).join(",")},0.35)`,
        }}>
          <div style={{
            fontFamily,
            fontSize: 42,
            fontWeight: 900,
            color: "#fff",
            letterSpacing: -1,
            textAlign: "center",
          }}>
            {fee}
          </div>
        </div>

        {/* Meta: year + nationality */}
        {(year || nationality) ? (
          <div style={{
            opacity: metaOp,
            display: "flex",
            gap: 20,
            alignItems: "center",
          }}>
            {year ? (
              <div style={{
                fontFamily,
                fontSize: 16,
                fontWeight: 600,
                color: COLORS.muted,
                letterSpacing: 1,
              }}>
                {year}
              </div>
            ) : null}
            {year && nationality ? (
              <div style={{ width: 4, height: 4, borderRadius: "50%", background: COLORS.muted }} />
            ) : null}
            {nationality ? (
              <div style={{
                fontFamily,
                fontSize: 16,
                fontWeight: 400,
                color: COLORS.muted,
              }}>
                {nationality}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
