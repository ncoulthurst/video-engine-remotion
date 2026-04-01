/**
 * IntrcptTransferProfit — Brentford buy-low / sell-high transfer record.
 *
 * Narration-paced: each row reveals on its own frame window so the presenter
 * can talk through each player before the next appears. Inactive rows dim.
 * Two bars per row (sell = accent red, buy = muted blue) + fixed-width gold
 * profit chip on the right. Side image crossfades as active player changes.
 */
import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  CalculateMetadataFunction,
} from "remotion";
import { z } from "zod";
import {
  fontFamily,
  serifFontFamily,
  Grain,
  PaperBackground,
  COLORS,
  SmartImg,
} from "./shared";

// ─────────────────────────────────────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────────────────────────────────────

const TransferSchema = z.object({
  year:      z.string(),
  player:    z.string(),
  fromClub:  z.string().default(""),
  toClub:    z.string().default(""),
  buyFee:    z.string(),
  buyValue:  z.number(),
  sellFee:   z.string(),
  sellValue: z.number(),
  highlight: z.boolean().default(false),
  sideImage: z.string().optional(),
});

export const IntrcptTransferProfitPropsSchema = z.object({
  title:       z.string().default("the brentford model"),
  subtitle:    z.string().default("buy cheap. develop. sell big."),
  sideImage:   z.string().optional(),
  accentColor: z.string().default("#E30613"),
  buyColor:    z.string().default("#4a6fa5"),
  profitColor: z.string().default("#C9A84C"),
  bgColor:     z.string().default("#f0ece4"),
  dwellFrames: z.number().int().default(150),
  transfers:   z.array(TransferSchema).default([]),
});

export type IntrcptTransferProfitProps = z.infer<typeof IntrcptTransferProfitPropsSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// calculateMetadata — total duration driven by dwellFrames × n players
// ─────────────────────────────────────────────────────────────────────────────

const INTRO_F  = 60;
const OUTRO_F  = 90;

export const calculateMetadata: CalculateMetadataFunction<IntrcptTransferProfitProps> = ({
  props,
}) => {
  const n = props.transfers.length || 1;
  return { durationInFrames: INTRO_F + n * props.dwellFrames + OUTRO_F };
};

// ─────────────────────────────────────────────────────────────────────────────
// Layout constants
// ─────────────────────────────────────────────────────────────────────────────

const ROW_H       = 108;
const BAR_H_SELL  = 14;
const BAR_H_BUY   = 8;
const BAR_GAP     = 8;
const PROFIT_W    = 130;  // fixed-width right column for profit chip
const ACCENT_STRIPE_W = 3;

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export const IntrcptTransferProfit: React.FC<IntrcptTransferProfitProps> = ({
  title,
  subtitle,
  sideImage: globalImage,
  accentColor,
  buyColor,
  profitColor,
  bgColor,
  dwellFrames,
  transfers,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const n       = transfers.length;
  const maxSell = Math.max(...transfers.map(t => t.sellValue), 1);
  const hasSide = transfers.some(t => t.sideImage) || !!globalImage;
  const BAR_MAX_W = hasSide ? 480 : 860;

  // ── Header ────────────────────────────────────────────────────────────────
  const headerProg = spring({ frame, fps, config: { damping: 28, stiffness: 55 } });

  // ── Per-row reveal frame ──────────────────────────────────────────────────
  const revealF = (i: number) => INTRO_F + i * dwellFrames;

  // Active state: spring that rises when row i reveals and falls when row i+1 reveals.
  // Gives a smooth 0→1→0 arc for each row while it's "active".
  const activeState = (i: number) => {
    const rise = spring({ frame: frame - revealF(i),     fps, config: { damping: 26, stiffness: 40 } });
    const fall = i < n - 1
      ? spring({ frame: frame - revealF(i + 1), fps, config: { damping: 26, stiffness: 40 } })
      : 0;
    return Math.max(0, rise - fall);
  };

  // ── Side image: crossfade by blending each player's image at their active weight
  // We stack them in z-order and opacity-blend.
  const allImages: { src: string; opacity: number }[] = transfers.map((t, i) => {
    const src = t.sideImage || globalImage || "";
    const as  = activeState(i);
    return { src, opacity: as };
  });

  // Ensure something is visible even before first reveal — use first image at low opacity
  const imageProg = spring({ frame, fps, config: { damping: 24, stiffness: 50 }, delay: 6 });

  return (
    <AbsoluteFill>
      <PaperBackground color={bgColor} />

      {/* ── Side image layers (one per player, opacity driven by active state) */}
      {hasSide && allImages.map(({ src, opacity }, i) => {
        if (!src) return null;
        // Before any row reveals, show first image at imageProg opacity
        const resolvedOpacity = i === 0
          ? Math.max(opacity * 0.85, imageProg * 0.35 * (1 - activeState(0 < n - 1 ? 1 : 0)))
          : opacity * 0.85;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              right:    0,
              top:      0,
              bottom:   0,
              width:    860,
              opacity:  resolvedOpacity,
              WebkitMaskImage:
                "linear-gradient(to right, transparent, black 280px, black 88%, transparent)",
              maskImage:
                "linear-gradient(to right, transparent, black 280px, black 88%, transparent)",
              zIndex: 1,
            }}
          >
            <SmartImg
              src={src}
              style={{
                width:          "100%",
                height:         "100%",
                objectFit:      "cover",
                objectPosition: "top center",
                filter:         "contrast(1.05) brightness(1.02)",
              }}
            />
          </div>
        );
      })}

      {/* ── Grain ─────────────────────────────────────────────────────────── */}
      <div style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none" }}>
        <Grain />
      </div>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <div
        style={{
          position:       "absolute",
          inset:          0,
          display:        "flex",
          flexDirection:  "column",
          justifyContent: "center",
          padding:        "0 140px",
          maxWidth:       hasSide ? 1080 : 1920,
          zIndex:         10,
        }}
      >
        {/* Header */}
        <div
          style={{
            opacity:      headerProg,
            transform:    `translateY(${interpolate(headerProg, [0, 1], [-18, 0])}px)`,
            marginBottom: 44,
          }}
        >
          <div
            style={{
              fontFamily:    serifFontFamily,
              fontSize:      66,
              fontWeight:    900,
              color:         COLORS.primary,
              letterSpacing: -3,
              lineHeight:    1,
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div
              style={{
                fontFamily,
                fontSize:   19,
                fontWeight: 500,
                color:      COLORS.muted,
                marginTop:  10,
              }}
            >
              {subtitle}
            </div>
          )}

          {/* Legend */}
          <div style={{ display: "flex", alignItems: "center", gap: 24, marginTop: 16 }}>
            <LegendDot color={accentColor} label="sold for" />
            <LegendDot color={buyColor}    label="bought for" />
            <LegendDot color={profitColor} label="profit" diamond />
          </div>
        </div>

        {/* Rows */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {transfers.map((t, i) => {
            const rowProg = spring({
              frame:  frame - revealF(i),
              fps,
              config: { damping: 24, stiffness: 60 },
            });

            // Has this row been revealed yet?
            const revealed = rowProg > 0.01;
            if (!revealed) return <div key={i} style={{ height: ROW_H }} />;

            const as      = activeState(i);
            const rowOpacity = interpolate(as, [0, 1], [0.22, 1]);
            const entryOpacity = interpolate(rowProg, [0, 0.35], [0, 1], { extrapolateRight: "clamp" });
            const opacity = rowOpacity * entryOpacity;

            const sellBarW = interpolate(rowProg, [0, 1], [0, (t.sellValue / maxSell) * BAR_MAX_W], { extrapolateRight: "clamp" });
            const buyBarW  = interpolate(rowProg, [0, 1], [0, (t.buyValue  / maxSell) * BAR_MAX_W], { extrapolateRight: "clamp" });

            const profitProg = spring({
              frame:  frame - revealF(i) - 22,
              fps,
              config: { damping: 22, stiffness: 70 },
            });
            const profitOpacity   = interpolate(profitProg, [0, 0.5], [0, 1], { extrapolateRight: "clamp" });
            const profitTranslate = interpolate(profitProg, [0, 1], [8, 0]);

            const profit    = t.sellValue - t.buyValue;
            const profitStr = `+£${Number.isInteger(profit) ? profit : profit.toFixed(1)}m`;

            const nameSize = t.highlight ? 32 : 27;

            return (
              <div
                key={i}
                style={{
                  opacity,
                  display:       "flex",
                  alignItems:    "center",
                  height:        ROW_H,
                  borderBottom:  i < n - 1 ? "1px solid rgba(0,0,0,0.06)" : "none",
                  position:      "relative",
                  paddingLeft:   ACCENT_STRIPE_W + 12,
                }}
              >
                {/* Active left stripe */}
                <div
                  style={{
                    position:     "absolute",
                    left:         0,
                    top:          "20%",
                    bottom:       "20%",
                    width:        ACCENT_STRIPE_W,
                    borderRadius: 2,
                    background:   accentColor,
                    opacity:      as,
                  }}
                />

                {/* Year */}
                <div
                  style={{
                    width:         72,
                    fontFamily,
                    fontSize:      16,
                    fontWeight:    800,
                    color:         COLORS.muted,
                    letterSpacing: 0.5,
                    flexShrink:    0,
                  }}
                >
                  {t.year}
                </div>

                {/* Player + clubs */}
                <div
                  style={{
                    width:       hasSide ? 310 : 370,
                    flexShrink:  0,
                    paddingRight: 20,
                  }}
                >
                  <div
                    style={{
                      fontFamily:    serifFontFamily,
                      fontSize:      nameSize,
                      fontWeight:    900,
                      color:         COLORS.primary,
                      letterSpacing: -0.5,
                      lineHeight:    1.1,
                    }}
                  >
                    {t.player}
                  </div>
                  {(t.fromClub || t.toClub) && (
                    <div
                      style={{
                        fontFamily,
                        fontSize:   14,
                        fontWeight: 600,
                        color:      COLORS.muted,
                        marginTop:  4,
                      }}
                    >
                      {t.fromClub && t.toClub
                        ? `${t.fromClub} → ${t.toClub}`
                        : t.fromClub || t.toClub}
                    </div>
                  )}
                </div>

                {/* Bars */}
                <div style={{ display: "flex", flexDirection: "column", gap: BAR_GAP, flex: 1, minWidth: 0 }}>
                  {/* Sell row */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        width:        sellBarW,
                        height:       BAR_H_SELL,
                        borderRadius: 4,
                        backgroundColor: accentColor,
                        flexShrink:   0,
                      }}
                    />
                    <span
                      style={{
                        fontFamily,
                        fontSize:      t.highlight ? 24 : 20,
                        fontWeight:    900,
                        color:         accentColor,
                        letterSpacing: -0.5,
                        whiteSpace:    "nowrap",
                      }}
                    >
                      {t.sellFee}
                    </span>
                  </div>

                  {/* Buy row */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        width:        buyBarW,
                        height:       BAR_H_BUY,
                        borderRadius: 4,
                        backgroundColor: buyColor,
                        opacity:      0.5,
                        flexShrink:   0,
                      }}
                    />
                    <span
                      style={{
                        fontFamily,
                        fontSize:      15,
                        fontWeight:    700,
                        color:         COLORS.muted,
                        letterSpacing: -0.2,
                        whiteSpace:    "nowrap",
                      }}
                    >
                      {t.buyFee}
                    </span>
                  </div>
                </div>

                {/* Profit chip — fixed width, right-aligned column */}
                <div
                  style={{
                    width:       PROFIT_W,
                    flexShrink:  0,
                    display:     "flex",
                    justifyContent: "flex-end",
                    opacity:     profitOpacity,
                    transform:   `translateX(${profitTranslate}px)`,
                  }}
                >
                  <div
                    style={{
                      background:   `${profitColor}1a`,
                      border:       `1px solid ${profitColor}50`,
                      borderRadius: 6,
                      padding:      "5px 14px",
                    }}
                  >
                    <span
                      style={{
                        fontFamily,
                        fontSize:      t.highlight ? 22 : 18,
                        fontWeight:    800,
                        color:         profitColor,
                        letterSpacing: -0.3,
                        whiteSpace:    "nowrap",
                      }}
                    >
                      {profitStr}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Legend dot
// ─────────────────────────────────────────────────────────────────────────────

const LegendDot: React.FC<{ color: string; label: string; diamond?: boolean }> = ({
  color,
  label,
  diamond,
}) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
    <div
      style={{
        width:           10,
        height:          10,
        borderRadius:    diamond ? 2 : 2,
        backgroundColor: color,
        transform:       diamond ? "rotate(45deg)" : "none",
        opacity:         diamond ? 0.9 : 1,
      }}
    />
    <span
      style={{
        fontFamily,
        fontSize:   13,
        fontWeight: 600,
        color:      COLORS.muted,
        letterSpacing: 0.4,
      }}
    >
      {label}
    </span>
  </div>
);
