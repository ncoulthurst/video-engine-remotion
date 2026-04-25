/**
 * TransferProfit — Full-width transfer showcase, motion design quality.
 *
 * Each row spans 1920px. Camera pans vertically — no horizontal zoom.
 * Active player is spotlit with a warm accent band. Inactive rows are very
 * dim (0.18). Total profit springs in while still on last player, then
 * camera pulls back to the overview.
 *
 * Photo treatment: tall portrait panel (not a small circle) — 190px wide,
 * full row height, gradient-blended right edge. No blur from small circles.
 *
 * Sequence: intro title → player 1 (dwell) → pan → player 2 … → player n
 *           → total profit (close-up) → camera pulls back to overview.
 */
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { CalculateMetadataFunction } from "remotion";
import { z } from "zod";
import {
  fontFamily, serifFontFamily, Grain, PaperBackground, DarkBackground,
  COLORS, SPRINGS, SmartImg, rgbaFromHex, WorldStateSchema
} from "./shared";

// ══════════════════════════════════════════════════════════════════════════════
// SCHEMA
// ══════════════════════════════════════════════════════════════════════════════

const PlayerSchema = z.object({
  name:     z.string().optional().default(""),
  imageSrc: z.string().optional().default(""),
  origin:   z.string().optional().default(""),
  buyFee:   z.number(),
  sellFee:  z.number().default(0),
  buyYear:  z.number().optional(),
  sellYear: z.number().optional(),
  toClub:   z.string().optional().default(""),
  sold:     z.boolean().default(true),
  estValue: z.number().default(0),
});

export const TransferProfitPropsSchema = z.object({
  title:       z.string().optional().default("The Brentford Model"),
  subtitle:    z.string().optional().default(""),
  currency:    z.string().optional().default("£"),
  accentColor: z.string().optional().default("#E30613"),
  profitColor: z.string().optional().default("#C9A84C"),
  bgColor:     z.string().optional().default("#f0ece4"),
  darkMode:    z.boolean().default(false),
  showTotal:   z.boolean().default(true),
  dwellFrames: z.number().default(300),
  players:     z.array(PlayerSchema).default([]),
  worldState: WorldStateSchema.optional(),
  skipIntro: z.boolean().optional().default(false),
});

export type TransferProfitProps = z.infer<typeof TransferProfitPropsSchema>;

// ══════════════════════════════════════════════════════════════════════════════
// LAYOUT
// ══════════════════════════════════════════════════════════════════════════════

const W         = 1920;
const H         = 1080;
const HEADER_H  = 128;
const FOOTER_H  = 0;          // total profit is inside camera layer now
const PHOTO_W   = 190;        // portrait panel width
const COL1_L    = PHOTO_W + 50;   // 240
const COL1_R    = 820;
const COL2_L    = 870;
const COL2_R    = 1390;
const COL3_L    = 1440;
const COL3_R    = 1880;

// ══════════════════════════════════════════════════════════════════════════════
// CAMERA / TIMING
// ══════════════════════════════════════════════════════════════════════════════

const INTRO_DUR   = 32;
const PAN_DUR     = 40;        // longer pan lead-time = more cinematic drift
const TOTAL_HOLD  = 78;        // frames to show total profit before pulling back
const OUTRO_DUR   = 180;       // 6s overview at the end

export const calculateMetadata: CalculateMetadataFunction<TransferProfitProps> = ({ props }) => {
  const n         = props.players.length;
  const phase     = props.dwellFrames + PAN_DUR;
  const lastDwell = INTRO_DUR + (n - 1) * phase + props.dwellFrames;
  const outroStart = lastDwell + TOTAL_HOLD;
  return { durationInFrames: outroStart + OUTRO_DUR };
};

// ══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════════════════

function clamp01(v: number) { return Math.max(0, Math.min(1, v)); }

function fmtFee(currency: string, m: number): string {
  if (m <= 0) return "—";
  return `${currency}${m % 1 === 0 ? m : m.toFixed(1)}m`;
}

function roiStr(buy: number, sell: number): string {
  if (buy <= 0 || sell <= 0) return "";
  const r = sell / buy;
  return r >= 10 ? `${Math.round(r)}×` : `${r.toFixed(1)}×`;
}

// Pan spring — soft and cinematic (settles in ~60 frames)
const PAN_SPRING  = { damping: 30, stiffness: 30 } as const;
// Active state spring — responsive but smooth
const AS_SPRING   = { damping: 24, stiffness: 46 } as const;
// Zoom-out spring
const ZOOM_SPRING = { damping: 26, stiffness: 36 } as const;

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

export const TransferProfit: React.FC<TransferProfitProps> = ({
  title,
  subtitle,
  currency,
  accentColor,
  profitColor,
  bgColor,
  darkMode,
  showTotal,
  dwellFrames,
  players,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const n = players.length;

  const textColor  = darkMode ? "#f5f0e8" : COLORS.primary;
  const subColor   = darkMode ? "rgba(255,255,255,0.55)" : COLORS.secondary;
  const mutedColor = darkMode ? "rgba(255,255,255,0.32)" : COLORS.muted;
  const divColor   = darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
  const paperBg    = bgColor ?? "#f0ece4";

  // ── Row geometry ─────────────────────────────────────────────────────���───
  const availH    = H - HEADER_H - FOOTER_H;
  const ITEM_H    = Math.min(185, Math.floor(availH / Math.max(n, 1)));
  const topOffset = HEADER_H + Math.round((availH - n * ITEM_H) / 2);

  const nY = (i: number) => topOffset + i * ITEM_H + ITEM_H / 2;

  // ── Overview scale for payoff shot ──────────────────────────────────────
  const totalContentH = topOffset + n * ITEM_H + 120; // +120 for profit footer
  const overviewScale = Math.min(1.0, H / (totalContentH + 20));

  // ── Timing ───────────────────────────────────────────────────────────────
  const PHASE       = dwellFrames + PAN_DUR;
  const revealF     = (i: number) => INTRO_DUR + i * PHASE;
  const panF        = (i: number) => INTRO_DUR + i * PHASE - PAN_DUR;
  const lastDwellEnd  = INTRO_DUR + (n - 1) * PHASE + dwellFrames;
  const totalRevealF  = lastDwellEnd;          // profit springs in when last dwell ends
  const outroStart    = lastDwellEnd + TOTAL_HOLD;

  // ── Zoom-out ─────────────────────────────────────────────────────────────
  const zoomOutProg = clamp01(spring({ frame: frame - outroStart, fps, config: ZOOM_SPRING }));
  const allActive   = zoomOutProg > 0.5;

  // ── Active state per player — spring accumulation (same as TimelineScroll)
  const itemActive = (i: number): number => {
    if (allActive) return 1;
    const on  = clamp01(spring({ frame: frame - revealF(i),     fps, config: AS_SPRING }));
    const off = i < n - 1
      ? clamp01(spring({ frame: frame - revealF(i + 1), fps, config: AS_SPRING }))
      : 0;
    return Math.max(0, on - off);
  };

  // ── Camera vertical pan ───────────────────────────────────────────────────
  let panY = nY(0);
  for (let i = 1; i < n; i++) {
    const prog = clamp01(spring({ frame: frame - panF(i), fps, config: PAN_SPRING }));
    panY += (nY(i) - nY(i - 1)) * prog;
  }
  const centerAllY = n > 1 ? (nY(0) + nY(n - 1)) / 2 : nY(0);
  const finalPanY  = panY + (centerAllY - panY) * zoomOutProg;

  // Zoom: 1.0 during narration, springs to overviewScale during payoff
  const zoom = 1.0 - (1.0 - overviewScale) * zoomOutProg;
  const tx   = W / 2 * (1 - zoom);
  const ty   = H / 2 - finalPanY * zoom;

  // ── Header opacity — stays through intro, fades as first player appears ──
  // Delayed fade: header stays 60 frames past first reveal before fading
  const headerIn   = clamp01(spring({ frame, fps, config: SPRINGS.header }));
  const headerOut  = clamp01(spring({ frame: frame - revealF(0) - 60, fps, config: { damping: 26, stiffness: 28 } }));
  const headerOpacity = headerIn * (1 - headerOut);

  // ── Totals ────────────────────────────────────────────────────────────────
  const soldPlayers  = players.filter((p) => p.sold && p.sellFee > 0);
  const TOTAL_PROFIT = Math.round(soldPlayers.reduce((a, p) => a + (p.sellFee - p.buyFee), 0));

  return (
    <AbsoluteFill>
      {darkMode ? <DarkBackground /> : <PaperBackground color={bgColor} />}
      <Grain />

      {/* ── Fixed header — fades out as players appear ─────────────────────── */}
      <div style={{
        position:  "absolute",
        top:       40,
        left:      COL1_L,
        zIndex:    30,
        opacity:   headerOpacity,
        transform: `translateY(${interpolate(headerIn, [0, 1], [-10, 0])}px)`,
        pointerEvents: "none",
      }}>
        <div style={{
          fontFamily: serifFontFamily,
          fontSize:   52,
          fontWeight: 900,
          color:      textColor,
          letterSpacing: -2,
          lineHeight: 1,
        }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontFamily, fontSize: 17, fontWeight: 400, color: subColor, marginTop: 6 }}>
            {subtitle}
          </div>
        )}
        <div style={{
          width:        `${interpolate(headerIn, [0, 1], [0, 52])}px`,
          height:       4,
          background:   accentColor,
          borderRadius: 2,
          marginTop:    12,
        }} />
      </div>

      {/* ── Camera layer ────────────────────────────────────────────��──────── */}
      <div style={{
        position:        "absolute",
        left:            0, top: 0,
        width:           W, height: H,
        transformOrigin: "0 0",
        transform:       `translate(${tx}px, ${ty}px) scale(${zoom})`,
        overflow:        "visible",
        zIndex:          10,
        willChange:      "transform",
      }}>

        {players.map((player, i) => {
          const rf       = revealF(i);
          const rowProg  = clamp01(spring({ frame: frame - rf,     fps, config: { damping: 22, stiffness: 55 } }));
          const textProg = clamp01(spring({ frame: frame - rf - 10, fps, config: SPRINGS.feature }));
          if (rowProg < 0.01) return null;

          const as        = itemActive(i);
          // More decisive: 0.18 inactive (was 0.28) — inactive rows are clearly subordinate
          const mutedMult = 0.18 + 0.82 * as;

          const rowTop = topOffset + i * ITEM_H;
          const rowCY  = rowTop + ITEM_H / 2;

          const profit = player.sold && player.sellFee > 0 ? Math.round(player.sellFee - player.buyFee) : 0;
          const roi    = player.sold ? roiStr(player.buyFee, player.sellFee) : "";

          return (
            <React.Fragment key={i}>

              {/* ── Active row spotlight band (full width) ────────────────
                   Subtle accent tint behind the active row — the "spotlight"
                   effect. Opacity tracks activeState smoothly. */}
              <div style={{
                position:   "absolute",
                left:       0,
                right:      0,
                top:        rowTop,
                height:     ITEM_H,
                background: `linear-gradient(to right,
                  transparent 0%,
                  ${rgbaFromHex(accentColor, 0.06 * as)} 8%,
                  ${rgbaFromHex(accentColor, 0.08 * as)} 50%,
                  ${rgbaFromHex(accentColor, 0.06 * as)} 92%,
                  transparent 100%)`,
                pointerEvents: "none",
              }} />

              {/* ── Row divider ───────────────────────────────────────────── */}
              {i < n - 1 && (
                <div style={{
                  position:   "absolute",
                  left:       COL1_L,
                  right:      40,
                  top:        rowTop + ITEM_H - 1,
                  height:     1,
                  background: divColor,
                  opacity:    rowProg * 0.8,
                }} />
              )}

              {/* ── Portrait photo panel ──────────────────────────────────
                   Full-height rectangle, fixed size (no per-frame resize),
                   gradient blend on right edge into background color.
                   Scale-in on first reveal — image always at full resolution. */}
              <div style={{
                position:        "absolute",
                left:            0,
                top:             rowTop,
                width:           PHOTO_W,
                height:          ITEM_H,
                overflow:        "hidden",
                opacity:         0.20 + 0.80 * as,
                transform:       `translateX(${interpolate(rowProg, [0, 1], [-PHOTO_W, 0])}px)`,
                willChange:      "transform",
              }}>
                {/* Image */}
                {player.imageSrc ? (
                  <SmartImg
                    src={player.imageSrc}
                    style={{
                      position:       "absolute",
                      inset:          0,
                      width:          "100%",
                      height:         "100%",
                      objectFit:      "cover",
                      objectPosition: "center top",
                    }}
                  />
                ) : (
                  /* Initials fallback — only when no image */
                  <div style={{
                    position:   "absolute",
                    inset:      0,
                    display:    "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: darkMode ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
                    fontFamily: serifFontFamily,
                    fontSize:   PHOTO_W * 0.42,
                    fontWeight: 900,
                    color:      accentColor,
                    opacity:    0.28,
                    userSelect: "none",
                  }}>
                    {player.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                  </div>
                )}

                {/* Gradient blend — right edge fades photo into background */}
                <div style={{
                  position:   "absolute",
                  inset:      0,
                  background: `linear-gradient(to right,
                    transparent 0%,
                    transparent 55%,
                    ${darkMode ? "rgba(17,17,17," : `rgba(${
                      (() => {
                        const hex = (paperBg || "#f0ece4").replace("#","");
                        const r = parseInt(hex.slice(0,2),16);
                        const g = parseInt(hex.slice(2,4),16);
                        const b = parseInt(hex.slice(4,6),16);
                        return `${r},${g},${b},`;
                      })()
                    }`}0.92) 85%,
                    ${darkMode ? "rgba(17,17,17,1)" : paperBg} 100%)`,
                  pointerEvents: "none",
                }} />
              </div>

              {/* ── COL 1: name + origin + signed info ────────────────────── */}
              <div style={{
                position:  "absolute",
                left:      COL1_L,
                top:       rowCY - ITEM_H * 0.38,
                width:     COL1_R - COL1_L,
                height:    ITEM_H * 0.76,
                display:   "flex",
                flexDirection: "column",
                justifyContent: "center",
                opacity:   textProg * mutedMult,
                transform: `translateX(${interpolate(textProg, [0, 1], [-16, 0])}px)`,
              }}>
                <div style={{
                  fontFamily:    serifFontFamily,
                  fontSize:      38,
                  fontWeight:    900,
                  color:         textColor,
                  letterSpacing: -1.5,
                  lineHeight:    1,
                }}>
                  {player.name}
                </div>
                <div style={{
                  fontFamily, fontSize: 16, fontWeight: 400,
                  color: mutedColor, marginTop: 7,
                }}>
                  from {player.origin}
                </div>

                {/* Signed info + buy fee — pill highlights when active */}
                <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    fontFamily, fontSize: 12, fontWeight: 700,
                    color: mutedColor, letterSpacing: 1.8, textTransform: "uppercase",
                  }}>
                    Signed{player.buyYear ? ` ${player.buyYear}` : ""}
                  </div>

                  {/* Fee pill — two overlaid backgrounds, no layout change */}
                  <div style={{ position: "relative", display: "inline-block", borderRadius: 8, padding: "6px 14px" }}>
                    <div style={{
                      position: "absolute", inset: 0, borderRadius: 8,
                      background: darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)",
                      opacity: 1 - as,
                    }} />
                    <div style={{
                      position: "absolute", inset: 0, borderRadius: 8,
                      background: accentColor,
                      opacity: as,
                      boxShadow: `0 2px 18px ${rgbaFromHex(accentColor, 0.28 * as)}`,
                    }} />
                    <div style={{
                      position:   "relative",
                      fontFamily: serifFontFamily,
                      fontSize:   21,
                      fontWeight: 900,
                      color:      as > 0.5 ? "#ffffff" : textColor,
                      letterSpacing: -0.5,
                      lineHeight: 1,
                    }}>
                      {fmtFee(currency, player.buyFee)}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── COL 2: sell fee + destination ─────────────────────────── */}
              <div style={{
                position:  "absolute",
                left:      COL2_L,
                top:       rowCY - ITEM_H * 0.38,
                width:     COL2_R - COL2_L,
                height:    ITEM_H * 0.76,
                display:   "flex",
                flexDirection: "column",
                justifyContent: "center",
                opacity:   textProg * mutedMult,
                transform: `translateX(${interpolate(textProg, [0, 1], [12, 0])}px)`,
              }}>
                {player.sold && player.sellFee > 0 ? (
                  <>
                    <div style={{
                      fontFamily, fontSize: 12, fontWeight: 700,
                      color: mutedColor, letterSpacing: 1.8, textTransform: "uppercase",
                      marginBottom: 8,
                    }}>
                      Sold{player.sellYear ? ` ${player.sellYear}` : ""}
                    </div>
                    <div style={{
                      fontFamily: serifFontFamily, fontSize: 34, fontWeight: 900,
                      color: textColor, letterSpacing: -1.5, lineHeight: 1,
                    }}>
                      {fmtFee(currency, player.sellFee)}
                    </div>
                    <div style={{
                      fontFamily, fontSize: 16, fontWeight: 400,
                      color: mutedColor, marginTop: 7,
                    }}>
                      {player.toClub}
                    </div>
                  </>
                ) : (
                  <div style={{
                    fontFamily, fontSize: 14, fontWeight: 600,
                    color: mutedColor, letterSpacing: 1, textTransform: "uppercase",
                  }}>
                    {player.estValue > 0 ? `~${fmtFee(currency, player.estValue)}` : "Still at club"}
                  </div>
                )}
              </div>

              {/* ── COL 3: profit + ROI ────────────────────────────────────── */}
              {player.sold && profit > 0 && (
                <div style={{
                  position:  "absolute",
                  left:      COL3_L,
                  top:       rowCY - ITEM_H * 0.38,
                  width:     COL3_R - COL3_L,
                  height:    ITEM_H * 0.76,
                  display:   "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  opacity:   textProg * mutedMult,
                  transform: `translateX(${interpolate(textProg, [0, 1], [16, 0])}px)`,
                }}>
                  <div style={{
                    fontFamily:    serifFontFamily,
                    fontSize:      42,
                    fontWeight:    900,
                    color:         profitColor,
                    letterSpacing: -2,
                    lineHeight:    1,
                  }}>
                    +{fmtFee(currency, profit)}
                  </div>
                  {roi && (
                    <div style={{
                      fontFamily, fontSize: 15, fontWeight: 700,
                      color: profitColor, opacity: 0.70,
                      marginTop: 7, letterSpacing: 0.3,
                    }}>
                      {roi} return
                    </div>
                  )}
                </div>
              )}

            </React.Fragment>
          );
        })}

        {/* ── Total profit — inside camera, below last row ───────────────────
             Appears at end of last player's dwell (BEFORE zoom-out).
             Stays visible through the entire overview. */}
        {showTotal && (() => {
          const tp = clamp01(spring({ frame: frame - totalRevealF, fps, config: { damping: 20, stiffness: 40 } }));
          if (tp < 0.01) return null;
          const footerTop = topOffset + n * ITEM_H + 22;
          return (
            <div style={{
              position:   "absolute",
              left:       COL1_L,
              right:      40,
              top:        footerTop,
              display:    "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              opacity:    tp,
              transform:  `translateY(${interpolate(tp, [0, 1], [18, 0])}px)`,
              borderTop:  `1px solid ${divColor}`,
              paddingTop: 18,
            }}>
              <div style={{
                fontFamily, fontSize: 14, fontWeight: 700,
                color: mutedColor, letterSpacing: 2, textTransform: "uppercase",
              }}>
                Total profit · {soldPlayers.length} players sold
              </div>
              <div style={{
                fontFamily:    serifFontFamily,
                fontSize:      56,
                fontWeight:    900,
                color:         profitColor,
                letterSpacing: -3,
                lineHeight:    1,
              }}>
                +{currency}{TOTAL_PROFIT}m
              </div>
            </div>
          );
        })()}

        {/* Spine line — only visible during payoff overview */}
        {n > 1 && (
          <svg style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }} width={W} height={H}>
            <line
              x1={PHOTO_W / 2} y1={topOffset}
              x2={PHOTO_W / 2} y2={topOffset + n * ITEM_H}
              stroke={darkMode ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.09)"}
              strokeWidth={2}
              opacity={zoomOutProg}
            />
          </svg>
        )}
      </div>
    </AbsoluteFill>
  );
};
