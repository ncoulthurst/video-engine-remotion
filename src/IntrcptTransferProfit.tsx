/**
 * IntrcptTransferProfit — Brentford buy-low / sell-high transfer record.
 *
 * Identical layout feel to IntrcptTransferRecord but each row shows
 * TWO bars: buy price (muted) + sell price (accent), stacked, so the
 * viewer instantly sees the spread.  Profit chip animates in after the
 * bars settle.
 */
import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
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
  buyFee:    z.string(),          // e.g. "£1.8m"
  buyValue:  z.number(),          // numeric, same unit as sellValue
  sellFee:   z.string(),          // e.g. "£28m"
  sellValue: z.number(),
  highlight: z.boolean().default(false),
  sideImage: z.string().optional(), // per-player image (overrides global)
});

export const IntrcptTransferProfitPropsSchema = z.object({
  title:      z.string().default("the brentford model"),
  subtitle:   z.string().default("buy cheap. develop. sell big."),
  sideImage:  z.string().optional(),   // global fallback image
  accentColor: z.string().default("#E30613"),  // sell bar / profit chip
  buyColor:   z.string().default("#4a6fa5"),   // buy bar colour
  bgColor:    z.string().default("#f0ece4"),
  transfers:  z.array(TransferSchema).default([
    { year: "2017", player: "Ollie Watkins",  fromClub: "Exeter City",   toClub: "Aston Villa",    buyFee: "£1.8m",  buyValue: 1.8,  sellFee: "£28m",  sellValue: 28,  highlight: true  },
    { year: "2015", player: "Andre Gray",     fromClub: "Luton Town",    toClub: "Burnley",         buyFee: "£0.9m",  buyValue: 0.9,  sellFee: "£18m",  sellValue: 18,  highlight: false },
    { year: "2018", player: "Neal Maupay",    fromClub: "Saint-Étienne", toClub: "Brighton",        buyFee: "£1.6m",  buyValue: 1.6,  sellFee: "£20m",  sellValue: 20,  highlight: false },
    { year: "2020", player: "Saïd Benrahma",  fromClub: "Nice",          toClub: "West Ham",        buyFee: "£1.5m",  buyValue: 1.5,  sellFee: "£25m",  sellValue: 25,  highlight: false },
    { year: "2018", player: "Ivan Toney",     fromClub: "Peterborough",  toClub: "Nottm Forest",    buyFee: "£5m",    buyValue: 5,    sellFee: "£40m",  sellValue: 40,  highlight: true  },
  ]),
});

export type IntrcptTransferProfitProps = z.infer<typeof IntrcptTransferProfitPropsSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const ROW_START   = 18;
const ROW_STAGGER = 12;
const BAR_H_SELL  = 14;
const BAR_H_BUY   = 8;
const BAR_GAP     = 7;

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export const IntrcptTransferProfit: React.FC<IntrcptTransferProfitProps> = ({
  title,
  subtitle,
  sideImage: globalImage,
  accentColor,
  buyColor,
  bgColor,
  transfers,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const maxSell  = Math.max(...transfers.map(t => t.sellValue));
  const hasSide  = transfers.some(t => t.sideImage) || !!globalImage;
  const BAR_MAX_W = hasSide ? 500 : 900;

  const headerProg = spring({ frame, fps, config: { damping: 28, stiffness: 55 } });
  const imageProg  = spring({ frame, fps, config: { damping: 24, stiffness: 50 }, delay: 6 });

  // Which image to show in the side panel — use the most recently revealed
  // player's image if available, else the global sideImage.
  const activeIdx = (() => {
    let last = -1;
    for (let i = 0; i < transfers.length; i++) {
      const p = spring({ frame: frame - (ROW_START + i * ROW_STAGGER), fps, config: { damping: 24, stiffness: 60 } });
      if (p > 0.05) last = i;
    }
    return last;
  })();

  const activeSideImage =
    (activeIdx >= 0 && transfers[activeIdx].sideImage) || globalImage;

  return (
    <AbsoluteFill>
      <PaperBackground color={bgColor} />

      {/* ── Side image ─────────────────────────────────────────────────────── */}
      {hasSide && activeSideImage && (
        <div
          style={{
            position: "absolute",
            right:    0,
            top:      0,
            bottom:   0,
            width:    860,
            opacity:  interpolate(imageProg, [0, 1], [0, 0.80]),
            transform: `translateX(${interpolate(imageProg, [0, 1], [80, 0])}px)`,
            WebkitMaskImage:
              "linear-gradient(to right, transparent, black 300px, black 85%, transparent)",
            maskImage:
              "linear-gradient(to right, transparent, black 300px, black 85%, transparent)",
            zIndex: 1,
          }}
        >
          <SmartImg
            src={activeSideImage}
            style={{
              width:          "100%",
              height:         "100%",
              objectFit:      "cover",
              objectPosition: "top center",
              filter:         "contrast(1.05) brightness(1.02)",
            }}
          />
        </div>
      )}

      {/* ── Grain overlay ──────────────────────────────────────────────────── */}
      <div style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none" }}>
        <Grain />
      </div>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <div
        style={{
          position:   "absolute",
          inset:      0,
          display:    "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding:    "0 140px",
          maxWidth:   hasSide ? 1080 : 1920,
          zIndex:     10,
        }}
      >
        {/* Header */}
        <div
          style={{
            opacity:   headerProg,
            transform: `translateY(${interpolate(headerProg, [0, 1], [-20, 0])}px)`,
            marginBottom: 48,
          }}
        >
          <div
            style={{
              fontFamily:    serifFontFamily,
              fontSize:      68,
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
                fontSize:      20,
                fontWeight:    500,
                color:         COLORS.muted,
                letterSpacing: 0.5,
                marginTop:     12,
              }}
            >
              {subtitle}
            </div>
          )}

          {/* Buy / sell legend */}
          <div
            style={{
              display:    "flex",
              alignItems: "center",
              gap:        28,
              marginTop:  18,
            }}
          >
            <LegendDot color={accentColor} label="sold for" />
            <LegendDot color={buyColor}    label="bought for" />
          </div>
        </div>

        {/* Rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {transfers.map((t, i) => {
            const prog = spring({
              frame: frame - (ROW_START + i * ROW_STAGGER),
              fps,
              config: { damping: 24, stiffness: 60 },
            });
            const opacity  = interpolate(prog, [0, 0.4], [0, 1], { extrapolateRight: "clamp" });
            const sellBarW = interpolate(prog, [0, 1], [0, (t.sellValue / maxSell) * BAR_MAX_W], { extrapolateRight: "clamp" });
            const buyBarW  = interpolate(prog, [0, 1], [0, (t.buyValue  / maxSell) * BAR_MAX_W], { extrapolateRight: "clamp" });

            // Profit chip appears once bars are mostly drawn
            const profitProg = spring({
              frame: frame - (ROW_START + i * ROW_STAGGER + 18),
              fps,
              config: { damping: 22, stiffness: 70 },
            });
            const profitOpacity   = interpolate(profitProg, [0, 0.5], [0, 1], { extrapolateRight: "clamp" });
            const profitTranslate = interpolate(profitProg, [0, 1], [6, 0]);

            const profit    = t.sellValue - t.buyValue;
            const profitStr = `+£${profit % 1 === 0 ? profit : profit.toFixed(1)}m`;

            const nameColor = t.highlight ? COLORS.primary : COLORS.primary;

            return (
              <div
                key={i}
                style={{
                  opacity,
                  display:      "flex",
                  alignItems:   "center",
                  minHeight:    96,
                  borderBottom: i < transfers.length - 1
                    ? "1px solid rgba(0,0,0,0.06)"
                    : "none",
                  paddingTop:   8,
                  paddingBottom: 8,
                }}
              >
                {/* Year */}
                <div
                  style={{
                    width:         80,
                    fontFamily,
                    fontSize:      17,
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
                    width:      hasSide ? 320 : 380,
                    flexShrink: 0,
                    paddingRight: 24,
                  }}
                >
                  <div
                    style={{
                      fontFamily:    serifFontFamily,
                      fontSize:      t.highlight ? 32 : 27,
                      fontWeight:    900,
                      color:         nameColor,
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
                        fontSize:   15,
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

                {/* Bars + fees */}
                <div style={{ display: "flex", flexDirection: "column", gap: BAR_GAP, flex: 1 }}>
                  {/* Sell bar */}
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
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
                        fontSize:      t.highlight ? 26 : 22,
                        fontWeight:    900,
                        color:         accentColor,
                        letterSpacing: -0.5,
                        whiteSpace:    "nowrap",
                      }}
                    >
                      {t.sellFee}
                    </span>
                  </div>

                  {/* Buy bar */}
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div
                      style={{
                        width:        buyBarW,
                        height:       BAR_H_BUY,
                        borderRadius: 4,
                        backgroundColor: buyColor,
                        opacity:      0.55,
                        flexShrink:   0,
                      }}
                    />
                    <span
                      style={{
                        fontFamily,
                        fontSize:      17,
                        fontWeight:    700,
                        color:         COLORS.muted,
                        letterSpacing: -0.3,
                        whiteSpace:    "nowrap",
                      }}
                    >
                      {t.buyFee}
                    </span>
                  </div>
                </div>

                {/* Profit chip */}
                <div
                  style={{
                    opacity:   profitOpacity,
                    transform: `translateX(${profitTranslate}px)`,
                    marginLeft: 24,
                    flexShrink: 0,
                    background: `${accentColor}18`,
                    border:     `1px solid ${accentColor}40`,
                    borderRadius: 6,
                    padding:    "4px 12px",
                  }}
                >
                  <span
                    style={{
                      fontFamily,
                      fontSize:      t.highlight ? 22 : 18,
                      fontWeight:    800,
                      color:         accentColor,
                      letterSpacing: -0.3,
                      whiteSpace:    "nowrap",
                    }}
                  >
                    {profitStr}
                  </span>
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

const LegendDot: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
    <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: color }} />
    <span style={{ fontFamily, fontSize: 14, fontWeight: 600, color: COLORS.muted, letterSpacing: 0.5 }}>
      {label}
    </span>
  </div>
);
