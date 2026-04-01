/**
 * IntrcptTransferProfit — Brentford buy-low / sell-high transfer record.
 *
 * Narration-paced: each row reveals on its own frame window. Inactive rows dim.
 *
 * Row layout (2-line):
 *   Line 1: year | player name + clubs  ·····  profit chip (right-aligned)
 *   Line 2: sell bar ████████ £Xm
 *            buy  bar ████ £Xm
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
  buyColor:    z.string().default("#3B82F6"),
  profitColor: z.string().default("#C9A84C"),
  bgColor:     z.string().default("#f0ece4"),
  dwellFrames: z.number().int().default(150),
  transfers:   z.array(TransferSchema).default([]),
});

export type IntrcptTransferProfitProps = z.infer<typeof IntrcptTransferProfitPropsSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// calculateMetadata
// ─────────────────────────────────────────────────────────────────────────────

const INTRO_F = 60;
const OUTRO_F = 120;

export const calculateMetadata: CalculateMetadataFunction<IntrcptTransferProfitProps> = ({
  props,
}) => {
  const n = props.transfers.length || 1;
  return { durationInFrames: INTRO_F + n * props.dwellFrames + OUTRO_F };
};

// ─────────────────────────────────────────────────────────────────────────────
// Layout constants
// ─────────────────────────────────────────────────────────────────────────────

const ROW_H         = 124;
const BAR_H_SELL    = 14;
const BAR_H_BUY     = 12;   // bumped from 9 — survives YouTube compression
const BAR_GAP       = 7;
const MIN_BAR_W     = 24;   // floor so tiny fees never vanish
const ACCENT_STRIPE = 3;
const CONTENT_MAX_W = 1060;
const CHIP_COUNT_DUR = 10;  // frames for per-row profit counter

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
  const BAR_MAX_W = hasSide ? 400 : 740;

  const headerProg = spring({ frame, fps, config: { damping: 28, stiffness: 55 } });
  const revealF    = (i: number) => INTRO_F + i * dwellFrames;

  // ── Typewriter with blinking cursor ───────────────────────────────────────
  const TYPER_SPEED    = 0.7; // chars per frame
  const titleStartF    = 4;
  const subtitleStartF = titleStartF + Math.ceil(title.length / TYPER_SPEED) + 3;

  const typewriter = (text: string, startF: number, speed = TYPER_SPEED): string => {
    const chars = Math.floor(
      interpolate(frame, [startF, startF + text.length / speed], [0, text.length], {
        extrapolateLeft: "clamp", extrapolateRight: "clamp",
      })
    );
    const done  = chars >= text.length;
    const blink = Math.floor(frame / 9) % 2 === 0;
    return text.slice(0, chars) + (done ? "" : (blink ? "|" : " "));
  };

  // ── Side image crossfade: rowSpring_i × (1 − rowSpring_{i+1}) ─────────────
  const imgOpacity = (i: number): number => {
    const rise = spring({ frame: frame - revealF(i),     fps, config: { damping: 24, stiffness: 50 } });
    const fall = i < n - 1
      ? spring({ frame: frame - revealF(i + 1), fps, config: { damping: 24, stiffness: 50 } })
      : 0;
    return rise * (1 - fall) * 0.85;
  };

  const preProg    = spring({ frame, fps, config: { damping: 24, stiffness: 50 }, delay: 6 });
  const preOpacity = preProg * 0.30 * (1 - spring({ frame: frame - revealF(0), fps, config: { damping: 24, stiffness: 50 } }));

  // ── Active state (row dimming + stripe) ───────────────────────────────────
  const activeState = (i: number): number => {
    const rise = spring({ frame: frame - revealF(i),     fps, config: { damping: 26, stiffness: 40 } });
    const fall = i < n - 1
      ? spring({ frame: frame - revealF(i + 1), fps, config: { damping: 26, stiffness: 40 } })
      : 0;
    return Math.max(0, rise - fall);
  };

  // ── Running total — ticks upward as rows reveal ───────────────────────────
  const runningProfit = Math.round(
    transfers.reduce((sum, t, i) => {
      const rp = Math.min(1, spring({ frame: frame - revealF(i), fps, config: { damping: 24, stiffness: 60 } }));
      return sum + (t.sellValue - t.buyValue) * rp;
    }, 0)
  );
  // ── Total profit (needed early for label timing) ─────────────────────────
  const totalRevealF = INTRO_F + n * dwellFrames;
  const totalProfit  = Math.round(transfers.reduce((sum, t) => sum + (t.sellValue - t.buyValue), 0));

  // Strip slides in just before first row, stays visible throughout
  const stripRevealF   = revealF(0) - 10;
  const stripProg      = spring({ frame: frame - stripRevealF, fps, config: { damping: 22, stiffness: 55 } });
  const stripOpacity   = interpolate(stripProg, [0, 0.5], [0, 1], { extrapolateRight: "clamp" });
  // Label crossfades "running total" → "Total profit" at outro
  const labelTransProg = spring({ frame: frame - totalRevealF, fps, config: { damping: 22, stiffness: 60 } });

  // ── Legend fade-out once rows start appearing ─────────────────────────────
  const legendFadeOut = spring({ frame: frame - revealF(0) + 8, fps, config: { damping: 24, stiffness: 50 } });
  const legendOpacity = headerProg * Math.max(0, 1 - legendFadeOut);
  // Pop fires when outro starts — number is already at full value via runningProfit
  const popSpring  = spring({ frame: frame - totalRevealF, fps, config: { damping: 16, stiffness: 220 } });
  const popScale   = 1 + Math.max(0, popSpring - 1) * 0.15;
  const glowRadius = Math.max(0, popSpring - 1) * 40;
  // Number scales up from 36 → 52px at outro to emphasise the reveal
  const numberSize = interpolate(labelTransProg, [0, 1], [36, 52], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      <PaperBackground color={bgColor} />

      {/* ── Side images ──────────────────────────────────────────────────────── */}
      {hasSide && transfers.map((t, i) => {
        const src = t.sideImage || globalImage || "";
        if (!src) return null;
        const op = Math.max(imgOpacity(i), i === 0 ? preOpacity : 0);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              right: 0, top: 0, bottom: 0,
              width:   860,
              opacity: op,
              WebkitMaskImage: "linear-gradient(to right, transparent, black 280px, black 88%, transparent)",
              maskImage:       "linear-gradient(to right, transparent, black 280px, black 88%, transparent)",
              zIndex: 1,
            }}
          >
            <SmartImg
              src={src}
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center", filter: "contrast(1.05) brightness(1.02)" }}
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
          maxWidth:       hasSide ? CONTENT_MAX_W : 1920,
          zIndex:         10,
        }}
      >
        {/* Header */}
        <div
          style={{
            opacity:      headerProg,
            transform:    `translateY(${interpolate(headerProg, [0, 1], [-18, 0])}px)`,
            marginBottom: 36,
          }}
        >
          <div style={{ fontFamily: serifFontFamily, fontSize: 64, fontWeight: 900, color: COLORS.primary, letterSpacing: -3, lineHeight: 1 }}>
            {typewriter(title, titleStartF)}
          </div>
          {subtitle && (
            <div style={{ fontFamily, fontSize: 18, fontWeight: 500, color: COLORS.muted, marginTop: 8 }}>
              {typewriter(subtitle, subtitleStartF)}
            </div>
          )}
          {/* Legend fades out once rows start — no longer needed once colour-coding is visible */}
          <div style={{ display: "flex", alignItems: "center", gap: 24, marginTop: 14, opacity: legendOpacity }}>
            <LegendDot color={accentColor} label="sold for" />
            <LegendDot color={buyColor}    label="bought for" />
            <LegendDot color={profitColor} label="profit" diamond />
          </div>
        </div>

        {/* ── Rows ──────────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {transfers.map((t, i) => {
            const rowProg = spring({ frame: frame - revealF(i), fps, config: { damping: 24, stiffness: 60 } });

            // Ghost row for unrevealed players — teases upcoming content
            if (rowProg < 0.01) {
              return (
                <div
                  key={i}
                  style={{
                    height:       ROW_H,
                    borderBottom: i < n - 1 ? "1px solid rgba(0,0,0,0.04)" : "none",
                    paddingLeft:  ACCENT_STRIPE + 12,
                    display:      "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    gap: 10,
                    opacity: 0.18,
                  }}
                >
                  {/* Ghost name placeholder */}
                  <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
                    <div style={{ width: 72, flexShrink: 0 }} />
                    <div style={{ width: 100 + (i * 28) % 80, height: 10, borderRadius: 5, background: COLORS.primary }} />
                  </div>
                  {/* Ghost bar placeholders */}
                  <div style={{ paddingLeft: 72, display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ width: 60 + (i * 40) % 120, height: BAR_H_SELL, borderRadius: 4, background: COLORS.muted, opacity: 0.4 }} />
                    <div style={{ width: 20 + (i * 15) % 40,  height: BAR_H_BUY,  borderRadius: 4, background: COLORS.muted, opacity: 0.25 }} />
                  </div>
                </div>
              );
            }

            const as         = activeState(i);
            const rowOpacity = interpolate(as, [0, 1], [0.22, 1]);
            const entryOp    = interpolate(rowProg, [0, 0.35], [0, 1], { extrapolateRight: "clamp" });
            const opacity    = rowOpacity * entryOp;

            // Bar widths — with minimum floor so tiny fees are always visible
            const sellTarget = Math.max(MIN_BAR_W, (t.sellValue / maxSell) * BAR_MAX_W);
            const buyTarget  = Math.max(MIN_BAR_W, (t.buyValue  / maxSell) * BAR_MAX_W);
            const sellBarW   = interpolate(rowProg, [0, 1], [0, sellTarget], { extrapolateRight: "clamp" });
            const buyBarW    = interpolate(rowProg, [0, 1], [0, buyTarget],  { extrapolateRight: "clamp" });

            // Per-row profit chip counter
            const chipCountStart   = revealF(i) + 22;
            const profit           = t.sellValue - t.buyValue;
            const displayRowProfit = Math.round(
              interpolate(frame, [chipCountStart, chipCountStart + CHIP_COUNT_DUR], [0, profit], {
                extrapolateLeft: "clamp", extrapolateRight: "clamp",
              })
            );
            const rowProfitStr = `+£${Number.isInteger(displayRowProfit) ? displayRowProfit : displayRowProfit.toFixed(1)}m`;

            const profitProg    = spring({ frame: frame - revealF(i) - 22, fps, config: { damping: 22, stiffness: 70 } });
            const profitOpacity = interpolate(profitProg, [0, 0.5], [0, 1], { extrapolateRight: "clamp" });
            const profitShift   = interpolate(profitProg, [0, 1], [8, 0]);

            return (
              <div
                key={i}
                style={{
                  opacity,
                  height:        ROW_H,
                  borderBottom:  i < n - 1 ? "1px solid rgba(0,0,0,0.06)" : "none",
                  position:      "relative",
                  paddingLeft:   ACCENT_STRIPE + 12,
                  display:       "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                {/* Active left stripe */}
                <div style={{
                  position: "absolute", left: 0, top: "18%", bottom: "18%",
                  width: ACCENT_STRIPE, borderRadius: 2,
                  background: accentColor, opacity: as,
                }} />

                {/* Line 1: year + name + profit chip */}
                <div style={{ display: "flex", alignItems: "baseline" }}>
                  <div style={{ width: 72, fontFamily, fontSize: 15, fontWeight: 800, color: COLORS.muted, letterSpacing: 0.5, flexShrink: 0 }}>
                    {t.year}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontFamily: serifFontFamily, fontSize: t.highlight ? 30 : 26, fontWeight: 900, color: COLORS.primary, letterSpacing: -0.5 }}>
                      {t.player}
                    </span>
                    {(t.fromClub || t.toClub) && (
                      <span style={{ fontFamily, fontSize: 13, fontWeight: 600, color: COLORS.muted, marginLeft: 12 }}>
                        {t.fromClub && t.toClub ? `${t.fromClub} → ${t.toClub}` : t.fromClub || t.toClub}
                      </span>
                    )}
                  </div>
                  {/* Profit chip with counter */}
                  <div style={{ flexShrink: 0, opacity: profitOpacity, transform: `translateX(${profitShift}px)` }}>
                    <div style={{
                      background: `${profitColor}1a`, border: `1px solid ${profitColor}50`,
                      borderRadius: 6, padding: "3px 12px",
                    }}>
                      <span style={{ fontFamily, fontSize: t.highlight ? 20 : 17, fontWeight: 800, color: profitColor, letterSpacing: -0.3, whiteSpace: "nowrap" }}>
                        {rowProfitStr}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Line 2: bars */}
                <div style={{ paddingLeft: 72, display: "flex", flexDirection: "column", gap: BAR_GAP }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: sellBarW, height: BAR_H_SELL, borderRadius: 4, backgroundColor: accentColor, flexShrink: 0 }} />
                    <span style={{ fontFamily, fontSize: t.highlight ? 22 : 18, fontWeight: 900, color: accentColor, letterSpacing: -0.4, whiteSpace: "nowrap" }}>
                      {t.sellFee}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: buyBarW, height: BAR_H_BUY, borderRadius: 4, backgroundColor: buyColor, flexShrink: 0 }} />
                    <span style={{ fontFamily, fontSize: 14, fontWeight: 700, color: buyColor, letterSpacing: -0.2, whiteSpace: "nowrap", opacity: 0.85 }}>
                      {t.buyFee}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Bottom strip — running total during narration, final reveal at outro ── */}
      {stripProg > 0.01 && (
        <div
          style={{
            position:   "absolute",
            bottom:     52,
            left:       140,
            zIndex:     12,
            opacity:    stripOpacity,
            transform:  `translateY(${interpolate(stripProg, [0, 1], [12, 0])}px)`,
            display:    "flex",
            alignItems: "flex-end",
            gap:        16,
            borderTop:  "1px solid rgba(0,0,0,0.10)",
            paddingTop: 16,
            width:      hasSide ? CONTENT_MAX_W - 280 : 1640,
          }}
        >
          {/* Label: "running total" fades out, "Total profit" types in */}
          <div style={{ position: "relative", minWidth: 120 }}>
            <div style={{
              fontFamily, fontSize: 13, fontWeight: 700, color: COLORS.muted,
              letterSpacing: 2, textTransform: "uppercase",
              opacity: Math.max(0, 1 - labelTransProg),
              position: "absolute", whiteSpace: "nowrap",
            }}>
              running total
            </div>
            <div style={{
              fontFamily, fontSize: 13, fontWeight: 700, color: COLORS.muted,
              letterSpacing: 2, textTransform: "uppercase",
              opacity: labelTransProg,
              whiteSpace: "nowrap",
            }}>
              {typewriter("Total profit", totalRevealF, 0.9)}
            </div>
          </div>

          {/* Number — always runningProfit, grows + pops at outro */}
          <div style={{
            fontFamily:      serifFontFamily,
            fontSize:        numberSize,
            fontWeight:      900,
            color:           profitColor,
            letterSpacing:   -2,
            lineHeight:      1,
            display:         "inline-block",
            transform:       `scale(${popScale})`,
            transformOrigin: "left bottom",
            textShadow:      glowRadius > 0.5 ? `0 0 ${glowRadius}px ${profitColor}` : "none",
          }}>
            +£{runningProfit}m
          </div>

          {/* "across N signings" types in at outro */}
          <div style={{ fontFamily, fontSize: 15, fontWeight: 500, color: COLORS.muted, paddingBottom: 6, opacity: labelTransProg }}>
            {typewriter(`across ${n} signings`, totalRevealF + 12, 0.9)}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Legend dot
// ─────────────────────────────────────────────────────────────────────────────

const LegendDot: React.FC<{ color: string; label: string; diamond?: boolean }> = ({ color, label, diamond }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
    <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: color, transform: diamond ? "rotate(45deg)" : "none" }} />
    <span style={{ fontFamily, fontSize: 13, fontWeight: 600, color: COLORS.muted, letterSpacing: 0.4 }}>
      {label}
    </span>
  </div>
);
