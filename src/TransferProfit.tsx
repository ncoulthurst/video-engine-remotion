/**
 * TransferProfit — "The Brentford Model" transfer profit bar chart.
 *
 * Each player is a row with two stacked bars:
 *   - Buy fee (muted, small)
 *   - Profit on top (accent color, large)
 *
 * Bars spring in from left, staggered row by row. After all rows reveal,
 * a total profit readout springs up at the bottom. The contrast between
 * the tiny buy bar and the huge profit bar IS the story.
 */
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { fontFamily, serifFontFamily, Grain, PaperBackground, DarkBackground, COLORS, SPRINGS, rgbaFromHex } from "./shared";

// ══════════════════════════════════════════════════════════════════════════════
// SCHEMA
// ══════════════════════════════════════════════════════════════════════════════

const PlayerSchema = z.object({
  name:       z.string(),
  buyFee:     z.number(),            // in millions
  sellFee:    z.number(),            // in millions (0 = not yet sold)
  buyYear:    z.number().optional(),
  sellYear:   z.number().optional(),
  toClub:     z.string().optional(), // "Aston Villa"
  origin:     z.string().optional(), // "Exeter City"
  sold:       z.boolean().default(true),
});

export const TransferProfitPropsSchema = z.object({
  title:       z.string().default("The Brentford Model"),
  subtitle:    z.string().optional(),
  currency:    z.string().default("£"),
  accentColor: z.string().default("#E30613"),  // Brentford red
  bgColor:     z.string().default("#f0ece4"),
  darkMode:    z.boolean().default(false),
  showTotal:   z.boolean().default(true),
  players:     z.array(PlayerSchema).default([
    { name: "Neal Maupay",      buyFee: 1.6,  sellFee: 20,  buyYear: 2017, sellYear: 2019, toClub: "Brighton",      origin: "St Étienne",   sold: true  },
    { name: "Ollie Watkins",    buyFee: 1.8,  sellFee: 28,  buyYear: 2017, sellYear: 2020, toClub: "Aston Villa",   origin: "Exeter City",   sold: true  },
    { name: "Said Benrahma",    buyFee: 1.2,  sellFee: 25,  buyYear: 2018, sellYear: 2021, toClub: "West Ham",      origin: "OGC Nice",      sold: true  },
    { name: "Ivan Toney",       buyFee: 10,   sellFee: 40,  buyYear: 2020, sellYear: 2024, toClub: "Al-Ahli",       origin: "Peterborough",  sold: true  },
    { name: "Bryan Mbeumo",     buyFee: 1.0,  sellFee: 0,   buyYear: 2019, sellYear: 0,    toClub: "",              origin: "Troyes",        sold: false },
    { name: "Yoane Wissa",      buyFee: 9.0,  sellFee: 0,   buyYear: 2021, sellYear: 0,    toClub: "",              origin: "Lorient",       sold: false },
  ]),
});

export type TransferProfitProps = z.infer<typeof TransferProfitPropsSchema>;

// ══════════════════════════════════════════════════════════════════════════════
// LAYOUT
// ══════════════════════════════════════════════════════════════════════════════

const SCREEN_W    = 1920;
const SCREEN_H    = 1080;
const NAME_W      = 300;   // px for player name column
const BAR_L       = 480;   // left edge of bar area (after name + fee label)
const BAR_R       = 1780;  // right edge
const BAR_AREA_W  = BAR_R - BAR_L;
const ITEM_H      = 78;
const GAP         = 18;
const ITEM_STRIDE = ITEM_H + GAP;
const INTRO_DUR   = 30;
const ROW_STAGGER = 18;    // frames between each row reveal

// ══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════════════════

function clamp01(v: number) { return Math.max(0, Math.min(1, v)); }

function fmt(currency: string, m: number): string {
  if (m === 0) return "—";
  if (m >= 1000) return `${currency}${(m / 1000).toFixed(1)}bn`;
  return `${currency}${m}m`;
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

export const TransferProfit: React.FC<TransferProfitProps> = ({
  title,
  subtitle,
  currency,
  accentColor,
  bgColor,
  darkMode,
  showTotal,
  players,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const textColor = darkMode ? "#f5f0e8" : COLORS.primary;
  const mutedText = darkMode ? "rgba(255,255,255,0.45)" : COLORS.muted;
  const buyColor  = darkMode ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.10)";

  const n = players.length;
  const totalH    = n * ITEM_H + (n - 1) * GAP;
  const topOffset = Math.round((SCREEN_H - totalH) / 2) + 20;

  // Max sell fee (or current value for unsold) — scales bar widths
  const maxValue = Math.max(...players.map((p) => p.sold ? p.sellFee : p.buyFee * 4));

  const TOTAL_PROFIT = players
    .filter((p) => p.sold)
    .reduce((acc, p) => acc + (p.sellFee - p.buyFee), 0);

  const LAST_ROW_F   = INTRO_DUR + (n - 1) * ROW_STAGGER + 30;
  const TOTAL_REVEAL = LAST_ROW_F + 60;

  // ── Header ────────────────────────────────────────────────────────────────
  const headerProg = clamp01(spring({ frame, fps, config: SPRINGS.header }));

  return (
    <AbsoluteFill>
      {darkMode ? <DarkBackground /> : <PaperBackground color={bgColor} />}
      <Grain />

      {/* Fixed header */}
      <div style={{
        position:  "absolute",
        top:       46,
        left:      120,
        zIndex:    30,
        opacity:   headerProg,
        transform: `translateY(${interpolate(headerProg, [0, 1], [-10, 0])}px)`,
      }}>
        <div style={{
          fontFamily:    serifFontFamily,
          fontSize:      58,
          fontWeight:    900,
          color:         textColor,
          letterSpacing: -2,
          lineHeight:    1,
        }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontFamily, fontSize: 19, fontWeight: 400, color: mutedText, marginTop: 7 }}>
            {subtitle}
          </div>
        )}
        <div style={{
          width:        `${interpolate(headerProg, [0, 1], [0, 52])}px`,
          height:       4,
          background:   accentColor,
          borderRadius: 2,
          marginTop:    14,
        }} />
      </div>

      {/* Column headers — animate in with header */}
      <div style={{
        position:  "absolute",
        left:      BAR_L,
        top:       topOffset - 38,
        right:     SCREEN_W - BAR_R,
        display:   "flex",
        opacity:   headerProg * 0.55,
      }}>
        <div style={{ flex: 1, fontFamily, fontSize: 12, fontWeight: 700, color: mutedText, letterSpacing: 2, textTransform: "uppercase" }}>
          Buy price → Sell price
        </div>
        <div style={{ fontFamily, fontSize: 12, fontWeight: 700, color: mutedText, letterSpacing: 2, textTransform: "uppercase" }}>
          Profit
        </div>
      </div>

      {/* Player rows */}
      {players.map((player, i) => {
        const rowF    = INTRO_DUR + i * ROW_STAGGER;
        const rowProg = clamp01(spring({ frame: frame - rowF, fps, config: { damping: 20, stiffness: 55 } }));
        if (rowProg < 0.01) return null;

        const itemY    = topOffset + i * ITEM_STRIDE;
        const profit   = player.sold ? player.sellFee - player.buyFee : 0;
        const buyW     = (player.buyFee / maxValue) * BAR_AREA_W;
        const profitW  = (profit / maxValue) * BAR_AREA_W;
        const currentW = player.sold ? buyW + profitW : buyW;

        // Buy bar springs in first, then profit bar extends from its right edge
        const buyBarProg    = clamp01(spring({ frame: frame - rowF,     fps, config: { damping: 22, stiffness: 60 } }));
        const profitBarProg = clamp01(spring({ frame: frame - rowF - 8, fps, config: { damping: 20, stiffness: 48 } }));

        return (
          <div
            key={i}
            style={{
              position:  "absolute",
              left:      0,
              top:       itemY,
              width:     SCREEN_W,
              height:    ITEM_H,
              opacity:   rowProg,
              transform: `translateY(${interpolate(rowProg, [0, 1], [8, 0])}px)`,
            }}
          >
            {/* Divider */}
            {i < n - 1 && (
              <div style={{
                position:   "absolute",
                bottom:     0,
                left:       120,
                right:      140,
                height:     1,
                background: darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
              }} />
            )}

            {/* Player name + origin */}
            <div style={{
              position:   "absolute",
              left:       120,
              top:        0,
              width:      NAME_W,
              height:     ITEM_H,
              display:    "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}>
              <div style={{
                fontFamily:    serifFontFamily,
                fontSize:      20,
                fontWeight:    700,
                color:         textColor,
                letterSpacing: -0.3,
                lineHeight:    1.1,
              }}>
                {player.name}
              </div>
              {player.origin && (
                <div style={{ fontFamily, fontSize: 12, fontWeight: 400, color: mutedText, marginTop: 3 }}>
                  from {player.origin}
                  {player.buyYear ? ` · ${player.buyYear}` : ""}
                </div>
              )}
            </div>

            {/* Buy fee label */}
            <div style={{
              position:   "absolute",
              left:       NAME_W + 130,
              top:        "50%",
              transform:  "translateY(-50%)",
              fontFamily,
              fontSize:   13,
              fontWeight: 600,
              color:      mutedText,
              textAlign:  "right",
              width:      60,
            }}>
              {fmt(currency, player.buyFee)}
            </div>

            {/* Bars */}
            <div style={{
              position: "absolute",
              left:     BAR_L,
              top:      "50%",
              transform: "translateY(-50%)",
              height:   28,
              display:  "flex",
            }}>
              {/* Buy bar */}
              <div style={{
                width:        buyBarProg * buyW,
                height:       28,
                background:   buyColor,
                borderRadius: "4px 0 0 4px",
                flexShrink:   0,
                overflow:     "hidden",
              }} />

              {/* Profit bar */}
              {player.sold && (
                <div style={{
                  width:        profitBarProg * profitW,
                  height:       28,
                  background:   accentColor,
                  borderRadius: buyW < 2 ? 4 : "0 4px 4px 0",
                  flexShrink:   0,
                  overflow:     "hidden",
                  boxShadow:    `0 2px 12px ${rgbaFromHex(accentColor, 0.30)}`,
                }} />
              )}

              {/* "Still at club" tag for unsold players */}
              {!player.sold && (
                <div style={{
                  display:       "flex",
                  alignItems:    "center",
                  paddingLeft:   10,
                  fontFamily,
                  fontSize:      12,
                  fontWeight:    700,
                  color:         mutedText,
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                  opacity:       buyBarProg,
                }}>
                  Still at club
                </div>
              )}
            </div>

            {/* Sell fee + profit readout (right side) */}
            {player.sold && (
              <div style={{
                position:   "absolute",
                right:      140,
                top:        "50%",
                transform:  "translateY(-50%)",
                textAlign:  "right",
                opacity:    profitBarProg,
              }}>
                <div style={{
                  fontFamily,
                  fontSize:   13,
                  fontWeight: 600,
                  color:      mutedText,
                  lineHeight: 1,
                }}>
                  sold {player.sellYear ? `· ${player.sellYear}` : ""}
                  {player.toClub ? ` · ${player.toClub}` : ""}
                </div>
                <div style={{
                  fontFamily:    serifFontFamily,
                  fontSize:      22,
                  fontWeight:    900,
                  color:         accentColor,
                  letterSpacing: -0.5,
                  lineHeight:    1.2,
                  marginTop:     3,
                }}>
                  +{fmt(currency, profit)}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Total profit readout */}
      {showTotal && (() => {
        const totalProg = clamp01(spring({ frame: frame - TOTAL_REVEAL, fps, config: SPRINGS.feature }));
        if (totalProg < 0.01) return null;
        return (
          <div style={{
            position:   "absolute",
            bottom:     72,
            right:      140,
            textAlign:  "right",
            opacity:    totalProg,
            transform:  `translateY(${interpolate(totalProg, [0, 1], [14, 0])}px)`,
          }}>
            <div style={{
              fontFamily,
              fontSize:   13,
              fontWeight: 700,
              color:      mutedText,
              letterSpacing: 2,
              textTransform: "uppercase",
              marginBottom: 4,
            }}>
              Total profit
            </div>
            <div style={{
              fontFamily:    serifFontFamily,
              fontSize:      64,
              fontWeight:    900,
              color:         accentColor,
              letterSpacing: -3,
              lineHeight:    1,
            }}>
              +{fmt(currency, TOTAL_PROFIT)}
            </div>
          </div>
        );
      })()}
    </AbsoluteFill>
  );
};
