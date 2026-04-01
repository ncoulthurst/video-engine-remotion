/**
 * TransferProfit — TimelineScroll-style camera treatment for transfer stories.
 *
 * Players are revealed one at a time. Camera zooms in on each, dwells for
 * narration (default 300 frames = 10s), springs down to next player.
 * Final zoom-out shows the complete list at full brightness.
 *
 * Layout: [identity LEFT] | photo circle on vertical SPINE | [value stats RIGHT]
 * Same visual grammar as TimelineScroll — vertical spine line draws downward,
 * photo circles as nodes, horizontal stubs, spring-accumulated active state,
 * opacity-only muting (0.28 dim → 1.0 active). No reflow on state change.
 *
 * At zoom 1.5× centered on SPINE_X=960, visible x range = 320→1600.
 * Left column: 320–870. Right column: 1050–1600. All content visible.
 *
 * dwellFrames: 300 (10s) default — enough for narrator to cover one player.
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
  name:      z.string(),
  imageSrc:  z.string().default(""),
  origin:    z.string().default(""),
  buyFee:    z.number(),
  sellFee:   z.number().default(0),
  buyYear:   z.number().optional(),
  sellYear:  z.number().optional(),
  toClub:    z.string().default(""),
  sold:      z.boolean().default(true),
  estValue:  z.number().default(0),
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
// CAMERA + TIMING CONSTANTS
// ══════════════════════════════════════════════════════════════════════════════

const SCREEN_W     = 1920;
const SCREEN_H     = 1080;
const SPINE_X      = SCREEN_W / 2;  // 960 — spine centered, so tx = 960*(1-zoom) = constant
const ZOOM_IN_VAL  = 1.5;           // at 1.5× centered on SPINE_X, visible x = 320–1600
const INTRO_DUR    = 30;
const PAN_DUR      = 24;
const OUTRO_DUR    = 70;

// Columns — both fit within visible x=320–1600 at max zoom
const LEFT_L    = 310;   // left edge of name column
const LEFT_R    = 870;   // right edge of name column (right-aligned text)
const RIGHT_L   = 1050;  // left edge of stats column
const RIGHT_R   = 1610;  // right edge of stats column

const PHOTO_R_BASE   = 58;  // circle radius when inactive
const PHOTO_R_ACTIVE = 74;  // circle radius when fully active
const STUB_GAP       = 8;   // gap between photo circle edge and stub start

// ── Dynamic duration ─────────────────────────────────────────────────────────
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

function roiStr(buyFee: number, sellFee: number): string {
  if (buyFee <= 0 || sellFee <= 0) return "";
  const r = sellFee / buyFee;
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
  const mutedColor = darkMode ? "rgba(255,255,255,0.35)" : COLORS.muted;
  const lineColor  = darkMode ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.09)";
  const nodeBgFill = darkMode ? "#1a1a1a" : (bgColor ?? "#f0ece4");
  const accRgba    = (a: number) => rgbaFromHex(accentColor, a);

  // ── Row layout ─────────────────────────────────────────────────────────────
  const HEADER_H = 148;
  const FOOTER_H = showTotal ? 88 : 20;
  const availH   = SCREEN_H - HEADER_H - FOOTER_H;
  const ITEM_H   = Math.min(175, Math.floor(availH / Math.max(n, 1)));
  const topOffset = HEADER_H + Math.round((availH - n * ITEM_H) / 2);

  const nY = (i: number) => topOffset + i * ITEM_H + ITEM_H / 2;

  // ── Timing ─────────────────────────────────────────────────────────────────
  const PHASE      = dwellFrames + PAN_DUR;
  const revealFrame = (i: number) => INTRO_DUR + i * PHASE;
  const panFrame    = (i: number) => INTRO_DUR + i * PHASE - PAN_DUR;
  const outroStart  = INTRO_DUR + (n - 1) * PHASE + dwellFrames;

  // ── Zoom-out ───────────────────────────────────────────────────────────────
  const zoomOutProg = clamp01(spring({ frame: frame - outroStart, fps, config: { damping: 26, stiffness: 38 } }));
  const allActive   = zoomOutProg > 0.5;

  // ── Active state per player (spring-accumulated, same algorithm as TimelineScroll)
  const itemActive = (i: number): number => {
    if (allActive) return 1;
    const onProg  = clamp01(spring({ frame: frame - revealFrame(i),     fps, config: { damping: 22, stiffness: 52 } }));
    const offProg = i < n - 1
      ? clamp01(spring({ frame: frame - revealFrame(i + 1), fps, config: { damping: 22, stiffness: 52 } }))
      : 0;
    return Math.max(0, onProg - offProg);
  };

  // ── Camera pan (vertical, top → bottom) ────────────────────────────────────
  let panY = nY(0);
  for (let i = 1; i < n; i++) {
    const prog = clamp01(spring({ frame: frame - panFrame(i), fps, config: { damping: 26, stiffness: 40 } }));
    panY += (nY(i) - nY(i - 1)) * prog;
  }
  const centerAllY = n > 1 ? (nY(0) + nY(n - 1)) / 2 : nY(0);
  const finalPanY  = panY + (centerAllY - panY) * zoomOutProg;

  // ── Camera zoom ────────────────────────────────────────────────────────────
  const zoomInProg  = clamp01(spring({ frame, fps, config: { damping: 28, stiffness: 42 } }));
  const zoom        = 1 + (ZOOM_IN_VAL - 1) * zoomInProg - (ZOOM_IN_VAL - 1) * zoomOutProg;
  const clampedZoom = Math.max(1.0, Math.min(ZOOM_IN_VAL, zoom));

  // tx is always SCREEN_W/2 * (1 - zoom) because SPINE_X = SCREEN_W/2
  const tx = SCREEN_W / 2 * (1 - clampedZoom);
  const ty = SCREEN_H / 2 - finalPanY * clampedZoom;

  // ── Header ─────────────────────────────────────────────────────────────────
  const headerProg = clamp01(spring({ frame, fps, config: SPRINGS.header }));

  // ── Spine line: draws downward as rows are revealed ─────────────────────────
  const lastRevealed = players.reduce((acc, _, i) => (frame >= revealFrame(i) - 4 ? i : acc), -1);
  const spineEndY = lastRevealed < 0
    ? nY(0)
    : lastRevealed < n - 1
    ? interpolate(frame, [revealFrame(lastRevealed), revealFrame(lastRevealed + 1)], [nY(lastRevealed), nY(lastRevealed + 1)], { extrapolateRight: "clamp" })
    : nY(n - 1);

  // ── Total profit ────────────────────────────────────────────────────────────
  const soldPlayers  = players.filter((p) => p.sold && p.sellFee > 0);
  const TOTAL_PROFIT = Math.round(soldPlayers.reduce((acc, p) => acc + (p.sellFee - p.buyFee), 0));
  const totalRevealF = outroStart + 20;

  return (
    <AbsoluteFill>
      {darkMode ? <DarkBackground /> : <PaperBackground color={bgColor} />}
      <Grain />

      {/* ── Fixed header (outside camera, never zooms) ────────────────────── */}
      <div style={{
        position:  "absolute",
        top:       44,
        left:      LEFT_L,
        zIndex:    30,
        opacity:   headerProg,
        transform: `translateY(${interpolate(headerProg, [0, 1], [-10, 0])}px)`,
      }}>
        <div style={{ fontFamily: serifFontFamily, fontSize: 54, fontWeight: 900, color: textColor, letterSpacing: -2, lineHeight: 1 }}>
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
        left:            0,
        top:             0,
        width:           SCREEN_W,
        height:          SCREEN_H,
        transformOrigin: "0 0",
        transform:       `translate(${tx}px, ${ty}px) scale(${clampedZoom})`,
        overflow:        "visible",
        zIndex:          10,
      }}>

        {/* ── SVG: spine line + photo circles + stubs ───────────────────── */}
        <svg style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }} width={SCREEN_W} height={SCREEN_H}>

          {/* Vertical spine line — draws downward as rows are revealed */}
          {lastRevealed >= 0 && (
            <line
              x1={SPINE_X} y1={nY(0)}
              x2={SPINE_X} y2={spineEndY}
              stroke={lineColor}
              strokeWidth={2}
            />
          )}

          {/* Per-player nodes */}
          {players.map((player, i) => {
            const rf       = revealFrame(i);
            const nodeProg = clamp01(spring({ frame: frame - rf, fps, config: { damping: 24, stiffness: 80 } }));
            if (nodeProg < 0.01) return null;

            const as  = itemActive(i);
            const r   = PHOTO_R_BASE + (PHOTO_R_ACTIVE - PHOTO_R_BASE) * as;
            const cy  = nY(i);
            const stubOpacity = interpolate(nodeProg, [0.2, 0.9], [0, 1], { extrapolateRight: "clamp" });

            return (
              <g key={i}>
                {/* Horizontal stub — left side (to name column) */}
                <line
                  x1={SPINE_X - r - STUB_GAP} y1={cy}
                  x2={LEFT_R}                  y2={cy}
                  stroke={accentColor}
                  strokeWidth={1 + 0.5 * as}
                  opacity={stubOpacity * (0.25 + 0.28 * as)}
                />
                {/* Horizontal stub — right side (to stats column) */}
                <line
                  x1={SPINE_X + r + STUB_GAP} y1={cy}
                  x2={RIGHT_L}                 y2={cy}
                  stroke={accentColor}
                  strokeWidth={1 + 0.5 * as}
                  opacity={stubOpacity * (0.25 + 0.28 * as)}
                />

                {/* Glow ring when active */}
                <circle
                  cx={SPINE_X} cy={cy}
                  r={(r + 8 + Math.sin(frame * 0.10) * 1.5) * nodeProg}
                  fill="none"
                  stroke={accentColor}
                  strokeWidth={1.5}
                  opacity={0.25 * as}
                />

                {/* Opaque bg circle — covers spine line (same trick as TimelineScroll) */}
                <circle
                  cx={SPINE_X} cy={cy}
                  r={r * nodeProg}
                  fill={nodeBgFill}
                  stroke={lineColor}
                  strokeWidth={1.5}
                />

                {/* Photo image clipped to circle — requires foreignObject */}
                {player.imageSrc && nodeProg > 0.5 && (
                  <clipPath id={`clip-${i}`}>
                    <circle cx={SPINE_X} cy={cy} r={r * nodeProg - 1} />
                  </clipPath>
                )}

                {/* Accent color overlay — opacity = activeState */}
                {!player.imageSrc && (
                  <circle
                    cx={SPINE_X} cy={cy}
                    r={r * nodeProg}
                    fill={accentColor}
                    opacity={0.22 * as}
                  />
                )}

                {/* Active ring */}
                <circle
                  cx={SPINE_X} cy={cy}
                  r={r * nodeProg}
                  fill="none"
                  stroke={accentColor}
                  strokeWidth={2.5 * as}
                  opacity={as}
                />
              </g>
            );
          })}
        </svg>

        {/* ── Photo images (HTML over SVG, inside camera layer) ──────────── */}
        {players.map((player, i) => {
          if (!player.imageSrc) return null;
          const rf       = revealFrame(i);
          const nodeProg = clamp01(spring({ frame: frame - rf, fps, config: { damping: 24, stiffness: 80 } }));
          if (nodeProg < 0.5) return null;

          const as = itemActive(i);
          const r  = (PHOTO_R_BASE + (PHOTO_R_ACTIVE - PHOTO_R_BASE) * as) * nodeProg;
          const cy = nY(i);

          return (
            <div
              key={i}
              style={{
                position:     "absolute",
                left:         SPINE_X - r,
                top:          cy - r,
                width:        r * 2,
                height:       r * 2,
                borderRadius: "50%",
                overflow:     "hidden",
                pointerEvents: "none",
              }}
            >
              <SmartImg
                src={player.imageSrc}
                style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
              />
            </div>
          );
        })}

        {/* ── Initials fallback for players without images ─────────────────── */}
        {players.map((player, i) => {
          if (player.imageSrc) return null;
          const rf       = revealFrame(i);
          const nodeProg = clamp01(spring({ frame: frame - rf, fps, config: { damping: 24, stiffness: 80 } }));
          if (nodeProg < 0.3) return null;

          const as       = itemActive(i);
          const r        = (PHOTO_R_BASE + (PHOTO_R_ACTIVE - PHOTO_R_BASE) * as) * nodeProg;
          const cy       = nY(i);
          const initials = player.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

          return (
            <div key={i} style={{
              position:   "absolute",
              left:       SPINE_X,
              top:        cy,
              transform:  "translate(-50%, -50%)",
              fontFamily: serifFontFamily,
              fontSize:   r * 0.65,
              fontWeight: 900,
              color:      accentColor,
              opacity:    0.35 * nodeProg,
              userSelect: "none",
              pointerEvents: "none",
            }}>
              {initials}
            </div>
          );
        })}

        {/* ── Text labels (left + right columns) ───────────────────────────── */}
        {players.map((player, i) => {
          const rf       = revealFrame(i);
          const textProg = clamp01(spring({ frame: frame - rf - 6, fps, config: SPRINGS.feature }));
          if (textProg < 0.01) return null;

          const as         = itemActive(i);
          const mutedMult  = 0.28 + 0.72 * as;
          const cy         = nY(i);

          const profit = player.sold && player.sellFee > 0
            ? Math.round(player.sellFee - player.buyFee)
            : 0;
          const roi = player.sold ? roiStr(player.buyFee, player.sellFee) : "";

          // Text slides in from sides on first reveal
          const leftSlide  = interpolate(textProg, [0, 1], [-16, 0]);
          const rightSlide = interpolate(textProg, [0, 1], [16, 0]);
          const textOpacity = interpolate(textProg, [0, 0.5], [0, 1], { extrapolateRight: "clamp" });

          return (
            <React.Fragment key={i}>

              {/* ── LEFT: player identity ────────────────────────────── */}
              <div style={{
                position:  "absolute",
                left:      LEFT_L,
                top:       cy - ITEM_H * 0.38,
                width:     LEFT_R - LEFT_L,
                height:    ITEM_H * 0.76,
                display:   "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "flex-end",
                textAlign: "right",
                opacity:   textOpacity * mutedMult,
                transform: `translateX(${leftSlide}px)`,
              }}>
                {/* Player name */}
                <div style={{
                  fontFamily:    serifFontFamily,
                  fontSize:      26,
                  fontWeight:    900,
                  color:         textColor,
                  letterSpacing: -0.5,
                  lineHeight:    1.1,
                }}>
                  {player.name}
                </div>

                {/* Origin club */}
                <div style={{
                  fontFamily, fontSize: 14, fontWeight: 400, color: mutedColor,
                  marginTop: 4, lineHeight: 1,
                }}>
                  {player.origin}
                </div>

                {/* Buy fee — highlighted pill when active */}
                <div style={{
                  marginTop:    10,
                  display:      "inline-flex",
                  alignSelf:    "flex-end",
                  alignItems:   "center",
                  gap:          8,
                }}>
                  {/* Signed label */}
                  <div style={{
                    fontFamily, fontSize: 12, fontWeight: 700, color: mutedColor,
                    letterSpacing: 1.5, textTransform: "uppercase",
                    opacity: 0.6 + 0.4 * as,
                  }}>
                    Signed{player.buyYear ? ` ${player.buyYear}` : ""}
                  </div>
                  {/* Fee pill — fills with accentColor when active */}
                  <div style={{
                    background:   `rgba(${
                      darkMode ? "255,255,255" : "0,0,0"
                    },${interpolate(as, [0, 1], [0.06, 0])})`,
                    backgroundColor: interpolate(as, [0, 1], [0, 1]) > 0.5
                      ? accentColor
                      : undefined,
                    borderRadius: 6,
                    padding:      "4px 10px",
                    fontFamily:   serifFontFamily,
                    fontSize:     20,
                    fontWeight:   900,
                    color:        as > 0.5 ? "#ffffff" : textColor,
                    letterSpacing: -0.5,
                    lineHeight:   1,
                    transition:   "none",
                    // Smooth colour transition via opacity overlay approach:
                    position:     "relative",
                    overflow:     "hidden",
                  }}>
                    {/* Muted background state */}
                    <span style={{
                      position: "absolute",
                      inset: 0,
                      background: darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
                      borderRadius: 6,
                      opacity: 1 - as,
                    }} />
                    {/* Active background state */}
                    <span style={{
                      position: "absolute",
                      inset: 0,
                      background: accentColor,
                      borderRadius: 6,
                      opacity: as,
                      boxShadow: `0 2px 14px ${accRgba(0.35 * as)}`,
                    }} />
                    <span style={{ position: "relative", color: as > 0.5 ? "#fff" : textColor }}>
                      {fmtFee(currency, player.buyFee)}
                    </span>
                  </div>
                </div>
              </div>

              {/* ── RIGHT: transfer value ─────────────────────────────── */}
              <div style={{
                position:  "absolute",
                left:      RIGHT_L,
                top:       cy - ITEM_H * 0.38,
                width:     RIGHT_R - RIGHT_L,
                height:    ITEM_H * 0.76,
                display:   "flex",
                flexDirection: "column",
                justifyContent: "center",
                opacity:   textOpacity * mutedMult,
                transform: `translateX(${rightSlide}px)`,
              }}>
                {player.sold && player.sellFee > 0 ? (
                  <>
                    {/* Sell price */}
                    <div style={{
                      fontFamily: serifFontFamily, fontSize: 26, fontWeight: 900,
                      color: textColor, letterSpacing: -0.5, lineHeight: 1.1,
                    }}>
                      {fmtFee(currency, player.sellFee)}
                    </div>
                    {/* Destination */}
                    <div style={{
                      fontFamily, fontSize: 14, fontWeight: 400, color: mutedColor,
                      marginTop: 4, lineHeight: 1,
                    }}>
                      {player.toClub}{player.sellYear ? ` · ${player.sellYear}` : ""}
                    </div>
                    {/* Profit + ROI */}
                    <div style={{ marginTop: 10, display: "flex", alignItems: "baseline", gap: 10 }}>
                      <div style={{
                        fontFamily: serifFontFamily, fontSize: 28, fontWeight: 900,
                        color: profitColor, letterSpacing: -1, lineHeight: 1,
                      }}>
                        +{fmtFee(currency, profit)}
                      </div>
                      {roi && (
                        <div style={{
                          fontFamily, fontSize: 14, fontWeight: 700,
                          color: profitColor, opacity: 0.75, letterSpacing: 0.5,
                        }}>
                          {roi} return
                        </div>
                      )}
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

            </React.Fragment>
          );
        })}
      </div>

      {/* ── Total profit (fixed, outside camera — appears after zoom-out) ──── */}
      {showTotal && (() => {
        const tp = clamp01(spring({ frame: frame - totalRevealF, fps, config: SPRINGS.feature }));
        if (tp < 0.01) return null;
        return (
          <div style={{
            position:   "absolute",
            bottom:     28,
            left:       LEFT_L,
            right:      SCREEN_W - RIGHT_R,
            display:    "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            opacity:    tp,
            transform:  `translateY(${interpolate(tp, [0, 1], [12, 0])}px)`,
            zIndex:     30,
          }}>
            <div style={{
              fontFamily, fontSize: 13, fontWeight: 700,
              color: mutedColor, letterSpacing: 2, textTransform: "uppercase",
            }}>
              Total profit · {soldPlayers.length} sales
            </div>
            <div style={{
              fontFamily: serifFontFamily, fontSize: 52, fontWeight: 900,
              color: profitColor, letterSpacing: -2.5, lineHeight: 1,
            }}>
              +{currency}{TOTAL_PROFIT}m
            </div>
          </div>
        );
      })()}
    </AbsoluteFill>
  );
};
