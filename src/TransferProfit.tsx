/**
 * TransferProfit — Full-width, large-format transfer showcase.
 *
 * Each row spans the full 1920px. No horizontal zoom — rows are already
 * as wide as the frame. Camera pans vertically to the active player and
 * dwells for narration. Inactive rows muted to 0.28 opacity (same as
 * TimelineScroll). Final payoff springs out to show all players at once.
 *
 * Row layout (full 1920px):
 *   [PHOTO 170px] [name + origin + signed info] [sell fee + destination] [profit + ROI]
 *
 * Text sizes are YouTube-scale: 40px names, 34px fees, 44px profit.
 * Buy fee highlights with an accent-colour pill when the row is active.
 */
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { CalculateMetadataFunction } from "remotion";
import { z } from "zod";
import {
  fontFamily, serifFontFamily, Grain, PaperBackground, DarkBackground,
  COLORS, SPRINGS, SmartImg, rgbaFromHex,
} from "./shared";

// ══════════════════════════════════════════════════════════════════════════════
// SCHEMA
// ══════════════════════════════════════════════════════════════════════════════

const PlayerSchema = z.object({
  name:     z.string(),
  imageSrc: z.string().default(""),
  origin:   z.string().default(""),
  buyFee:   z.number(),
  sellFee:  z.number().default(0),
  buyYear:  z.number().optional(),
  sellYear: z.number().optional(),
  toClub:   z.string().default(""),
  sold:     z.boolean().default(true),
  estValue: z.number().default(0),
});

export const TransferProfitPropsSchema = z.object({
  title:       z.string().default("The Brentford Model"),
  subtitle:    z.string().optional(),
  currency:    z.string().default("£"),
  accentColor: z.string().default("#E30613"),
  profitColor: z.string().default("#C9A84C"),
  bgColor:     z.string().default("#f0ece4"),
  darkMode:    z.boolean().default(false),
  showTotal:   z.boolean().default(true),
  dwellFrames: z.number().default(300),
  players:     z.array(PlayerSchema).default([]),
});

export type TransferProfitProps = z.infer<typeof TransferProfitPropsSchema>;

// ══════════════════════════════════════════════════════════════════════════════
// LAYOUT — full 1920px, no zoom constraint
// ══════════════════════════════════════════════════════════════════════════════

const W          = 1920;
const H          = 1080;
const HEADER_H   = 130;
const FOOTER_H   = 90;
const ROW_PAD_L  = 40;    // left edge padding
const ROW_PAD_R  = 40;

const PHOTO_R    = 85;    // radius — 170px diameter
const PHOTO_CX   = ROW_PAD_L + PHOTO_R;   // 125

const COL1_L     = PHOTO_CX * 2 + 32;     // name column left
const COL1_R     = 860;                    // name column right
const COL2_L     = 900;                    // sell column left
const COL2_R     = 1380;                   // sell column right
const COL3_L     = 1420;                   // profit column left
const COL3_R     = W - ROW_PAD_R;          // 1880

// ══════════════════════════════════════════════════════════════════════════════
// CAMERA
// ══════════════════════════════════════════════════════════════════════════════

const INTRO_DUR  = 30;
const PAN_DUR    = 24;
const OUTRO_DUR  = 180;   // 6s — enough for viewer to read the total profit

export const calculateMetadata: CalculateMetadataFunction<TransferProfitProps> = ({ props }) => {
  const n     = props.players.length;
  const phase = props.dwellFrames + PAN_DUR;
  const outroStart = INTRO_DUR + (n - 1) * phase + props.dwellFrames;
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
  const divColor   = darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const nodeBgFill = darkMode ? "#1a1a1a" : (bgColor ?? "#f0ece4");

  // ── Row geometry ─────────────────────────────────────────────────────────
  const availH    = H - HEADER_H - FOOTER_H;
  const ITEM_H    = Math.min(190, Math.floor(availH / Math.max(n, 1)));
  const topOffset = HEADER_H + Math.round((availH - n * ITEM_H) / 2);

  const nY = (i: number) => topOffset + i * ITEM_H + ITEM_H / 2;

  // ── Overview scale — zoom out to show all rows in payoff shot ────────────
  const totalContentH = topOffset + n * ITEM_H + FOOTER_H;
  const overviewScale = Math.min(1.0, H / (totalContentH + 20));

  // ── Timing ───────────────────────────────────────────────────────────────
  const PHASE       = dwellFrames + PAN_DUR;
  const revealF     = (i: number) => INTRO_DUR + i * PHASE;
  const panF        = (i: number) => INTRO_DUR + i * PHASE - PAN_DUR;
  const outroStart  = INTRO_DUR + (n - 1) * PHASE + dwellFrames;
  const totalRevealF = outroStart + 20;

  // ── Zoom-out progress ────────────────────────────────────────────────────
  const zoomOutProg = clamp01(spring({ frame: frame - outroStart, fps, config: { damping: 26, stiffness: 38 } }));
  const allActive   = zoomOutProg > 0.5;

  // ── Active state per player (spring accumulation — same as TimelineScroll)
  const itemActive = (i: number): number => {
    if (allActive) return 1;
    const on  = clamp01(spring({ frame: frame - revealF(i),     fps, config: { damping: 22, stiffness: 52 } }));
    const off = i < n - 1
      ? clamp01(spring({ frame: frame - revealF(i + 1), fps, config: { damping: 22, stiffness: 52 } }))
      : 0;
    return Math.max(0, on - off);
  };

  // ── Camera pan (vertical) ────────────────────────────────────────────────
  let panY = nY(0);
  for (let i = 1; i < n; i++) {
    const prog = clamp01(spring({ frame: frame - panF(i), fps, config: { damping: 26, stiffness: 40 } }));
    panY += (nY(i) - nY(i - 1)) * prog;
  }
  const centerAllY = n > 1 ? (nY(0) + nY(n - 1)) / 2 : nY(0);
  const finalPanY  = panY + (centerAllY - panY) * zoomOutProg;

  // Zoom: 1.0 during narration (full width visible), springs to overviewScale
  const zoom = 1.0 - (1.0 - overviewScale) * zoomOutProg;

  // No horizontal shift (content is already full-width, centered at W/2)
  const tx = W / 2 * (1 - zoom);
  const ty = H / 2 - finalPanY * zoom;

  // ── Header — fades in on load, then fades out once first player appears ──
  const headerProg  = clamp01(spring({ frame, fps, config: SPRINGS.header }));
  const firstReveal = clamp01(spring({ frame: frame - revealF(0), fps, config: { damping: 22, stiffness: 50 } }));
  const headerOpacity = headerProg * (1 - firstReveal);

  // ── Spine line (vertical, left edge, draws downward) ─────────────────────
  const lastRevealed = players.reduce((acc, _, i) => (frame >= revealF(i) - 4 ? i : acc), -1);
  const spineEndY = lastRevealed < 0
    ? nY(0)
    : lastRevealed < n - 1
    ? interpolate(frame, [revealF(lastRevealed), revealF(lastRevealed + 1)], [nY(lastRevealed), nY(lastRevealed + 1)], { extrapolateRight: "clamp" })
    : nY(n - 1);

  // ── Totals ────────────────────────────────────────────────────────────────
  const soldPlayers  = players.filter((p) => p.sold && p.sellFee > 0);
  const TOTAL_PROFIT = Math.round(soldPlayers.reduce((a, p) => a + (p.sellFee - p.buyFee), 0));

  return (
    <AbsoluteFill>
      {darkMode ? <DarkBackground /> : <PaperBackground color={bgColor} />}
      <Grain />

      {/* ── Fixed header (outside camera) ─────────────────────────────────── */}
      <div style={{
        position:  "absolute",
        top:       40,
        left:      COL1_L,
        zIndex:    30,
        opacity:   headerOpacity,
        transform: `translateY(${interpolate(headerProg, [0, 1], [-10, 0])}px)`,
      }}>
        <div style={{ fontFamily: serifFontFamily, fontSize: 52, fontWeight: 900, color: textColor, letterSpacing: -2, lineHeight: 1 }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontFamily, fontSize: 17, fontWeight: 400, color: subColor, marginTop: 6 }}>
            {subtitle}
          </div>
        )}
        <div style={{ width: `${interpolate(headerProg, [0, 1], [0, 52])}px`, height: 4, background: accentColor, borderRadius: 2, marginTop: 12 }} />
      </div>

      {/* ── Camera layer ──────────────────────────────────────────────────── */}
      <div style={{
        position:        "absolute",
        left:            0, top: 0,
        width:           W, height: H,
        transformOrigin: "0 0",
        transform:       `translate(${tx}px, ${ty}px) scale(${zoom})`,
        overflow:        "visible",
        zIndex:          10,
      }}>

        {/* Spine line — only visible during payoff overview, not during narration close-ups */}
        <svg style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }} width={W} height={H}>
          {lastRevealed >= 0 && (
            <line
              x1={PHOTO_CX} y1={nY(0) - PHOTO_R}
              x2={PHOTO_CX} y2={nY(n - 1) + PHOTO_R}
              stroke={darkMode ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.10)"}
              strokeWidth={2}
              opacity={zoomOutProg}
            />
          )}
        </svg>

        {/* ── Player rows ───────────────────────────────────────────────── */}
        {players.map((player, i) => {
          const rf       = revealF(i);
          const rowProg  = clamp01(spring({ frame: frame - rf,     fps, config: { damping: 20, stiffness: 52 } }));
          const textProg = clamp01(spring({ frame: frame - rf - 8, fps, config: SPRINGS.feature }));
          if (rowProg < 0.01) return null;

          const as        = itemActive(i);
          const mutedMult = 0.28 + 0.72 * as;
          const cy        = nY(i);

          const profit = player.sold && player.sellFee > 0 ? Math.round(player.sellFee - player.buyFee) : 0;
          const roi    = player.sold ? roiStr(player.buyFee, player.sellFee) : "";

          return (
            <React.Fragment key={i}>

              {/* Row divider */}
              {i < n - 1 && (
                <div style={{
                  position:   "absolute",
                  left:       COL1_L,
                  right:      ROW_PAD_R,
                  top:        topOffset + (i + 1) * ITEM_H - 1,
                  height:     1,
                  background: divColor,
                  opacity:    rowProg,
                }} />
              )}

              {/* ── Photo circle ─────────────────────────────────────────
                   Fixed size (PHOTO_R always) — entrance via scale transform
                   so image is always rendered at full resolution. Never resized
                   per-frame (that was causing blur). Initials only if no image. */}
              <div style={{
                position:        "absolute",
                left:            PHOTO_CX - PHOTO_R,
                top:             cy - PHOTO_R,
                width:           PHOTO_R * 2,
                height:          PHOTO_R * 2,
                borderRadius:    "50%",
                overflow:        "hidden",
                opacity:         mutedMult,
                transform:       `scale(${rowProg})`,
                transformOrigin: "center center",
                border:          `${2 + 1.5 * as}px solid ${as > 0.5 ? accentColor : (darkMode ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)")}`,
                boxShadow:       as > 0.3 ? `0 0 0 ${4 * as}px ${rgbaFromHex(accentColor, 0.15 * as)}` : "none",
                background:      nodeBgFill,
              }}>
                {/* Initials — only rendered when there is no image src */}
                {!player.imageSrc && (
                  <div style={{
                    position:   "absolute",
                    inset:      0,
                    display:    "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: serifFontFamily,
                    fontSize:   PHOTO_R * 0.60,
                    fontWeight: 900,
                    color:      accentColor,
                    opacity:    0.35,
                    userSelect: "none",
                  }}>
                    {player.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                  </div>
                )}
                {player.imageSrc && (
                  <SmartImg
                    src={player.imageSrc}
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
                  />
                )}
              </div>

              {/* ── COL 1: name + origin + signed info ──────────────────── */}
              <div style={{
                position:  "absolute",
                left:      COL1_L,
                top:       cy - ITEM_H * 0.40,
                width:     COL1_R - COL1_L,
                height:    ITEM_H * 0.80,
                display:   "flex",
                flexDirection: "column",
                justifyContent: "center",
                opacity:   textProg * mutedMult,
                transform: `translateX(${interpolate(textProg, [0, 1], [-14, 0])}px)`,
              }}>
                {/* Player name — large */}
                <div style={{
                  fontFamily: serifFontFamily,
                  fontSize:   40,
                  fontWeight: 900,
                  color:      textColor,
                  letterSpacing: -1.5,
                  lineHeight: 1,
                }}>
                  {player.name}
                </div>

                {/* Origin */}
                <div style={{
                  fontFamily, fontSize: 17, fontWeight: 400,
                  color: mutedColor, marginTop: 7, lineHeight: 1,
                }}>
                  from {player.origin}
                </div>

                {/* Signed info + fee pill */}
                <div style={{
                  marginTop:  14,
                  display:    "flex",
                  alignItems: "center",
                  gap:        10,
                }}>
                  <div style={{
                    fontFamily, fontSize: 13, fontWeight: 700,
                    color: mutedColor, letterSpacing: 1.5, textTransform: "uppercase",
                  }}>
                    Signed{player.buyYear ? ` ${player.buyYear}` : ""}
                  </div>

                  {/* Highlighted buy fee pill */}
                  <div style={{ position: "relative", display: "inline-block", borderRadius: 8, padding: "6px 14px" }}>
                    {/* Muted bg layer */}
                    <div style={{
                      position: "absolute", inset: 0, borderRadius: 8,
                      background: darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)",
                      opacity: 1 - as,
                    }} />
                    {/* Accent bg layer */}
                    <div style={{
                      position: "absolute", inset: 0, borderRadius: 8,
                      background: accentColor,
                      opacity: as,
                      boxShadow: `0 2px 16px ${rgbaFromHex(accentColor, 0.30 * as)}`,
                    }} />
                    <div style={{
                      position:   "relative",
                      fontFamily: serifFontFamily,
                      fontSize:   22,
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

              {/* ── COL 2: sell info ────────────────────────────────────── */}
              <div style={{
                position:  "absolute",
                left:      COL2_L,
                top:       cy - ITEM_H * 0.40,
                width:     COL2_R - COL2_L,
                height:    ITEM_H * 0.80,
                display:   "flex",
                flexDirection: "column",
                justifyContent: "center",
                opacity:   textProg * mutedMult,
                transform: `translateX(${interpolate(textProg, [0, 1], [10, 0])}px)`,
              }}>
                {player.sold && player.sellFee > 0 ? (
                  <>
                    <div style={{
                      fontFamily, fontSize: 13, fontWeight: 700,
                      color: mutedColor, letterSpacing: 1.5, textTransform: "uppercase",
                      marginBottom: 8,
                    }}>
                      Sold{player.sellYear ? ` ${player.sellYear}` : ""}
                    </div>
                    <div style={{
                      fontFamily: serifFontFamily, fontSize: 34, fontWeight: 900,
                      color: textColor, letterSpacing: -1, lineHeight: 1,
                    }}>
                      {fmtFee(currency, player.sellFee)}
                    </div>
                    <div style={{
                      fontFamily, fontSize: 17, fontWeight: 400,
                      color: mutedColor, marginTop: 6, lineHeight: 1,
                    }}>
                      {player.toClub}
                    </div>
                  </>
                ) : (
                  <div style={{
                    fontFamily, fontSize: 15, fontWeight: 600,
                    color: mutedColor, letterSpacing: 1, textTransform: "uppercase",
                  }}>
                    {player.estValue > 0 ? `~${fmtFee(currency, player.estValue)} est. value` : "Still at club"}
                  </div>
                )}
              </div>

              {/* ── COL 3: profit + ROI ─────────────────────────────────── */}
              {player.sold && profit > 0 && (
                <div style={{
                  position:  "absolute",
                  left:      COL3_L,
                  top:       cy - ITEM_H * 0.40,
                  width:     COL3_R - COL3_L,
                  height:    ITEM_H * 0.80,
                  display:   "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  opacity:   textProg * mutedMult,
                  transform: `translateX(${interpolate(textProg, [0, 1], [14, 0])}px)`,
                }}>
                  {/* Profit — the hero number */}
                  <div style={{
                    fontFamily: serifFontFamily,
                    fontSize:   44,
                    fontWeight: 900,
                    color:      profitColor,
                    letterSpacing: -2,
                    lineHeight: 1,
                  }}>
                    +{fmtFee(currency, profit)}
                  </div>
                  {roi && (
                    <div style={{
                      fontFamily, fontSize: 16, fontWeight: 700,
                      color: profitColor, opacity: 0.72,
                      marginTop: 7, letterSpacing: 0.5,
                    }}>
                      {roi} return on investment
                    </div>
                  )}
                </div>
              )}

            </React.Fragment>
          );
        })}

        {/* ── Total profit — inside camera so it aligns with the rows ──── */}
        {showTotal && (() => {
          const tp = clamp01(spring({ frame: frame - totalRevealF, fps, config: SPRINGS.feature }));
          if (tp < 0.01) return null;
          const footerY = topOffset + n * ITEM_H + 20;
          return (
            <div style={{
              position:   "absolute",
              left:       COL1_L,
              right:      ROW_PAD_R,
              top:        footerY,
              display:    "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              opacity:    tp,
              transform:  `translateY(${interpolate(tp, [0, 1], [14, 0])}px)`,
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
                fontFamily: serifFontFamily, fontSize: 58, fontWeight: 900,
                color: profitColor, letterSpacing: -3, lineHeight: 1,
              }}>
                +{currency}{TOTAL_PROFIT}m
              </div>
            </div>
          );
        })()}
      </div>
    </AbsoluteFill>
  );
};
