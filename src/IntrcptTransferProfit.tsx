/**
 * IntrcptTransferProfit — Brentford buy-low / sell-high transfer record.
 *
 * Narration-paced: each row reveals on its own frame window so the presenter
 * can talk through each player before the next appears. Inactive rows dim.
 *
 * Layout per row (2-line):
 *   Line 1: year | player name + clubs  ·····  profit chip (right-aligned)
 *   Line 2: sell bar ████████ £Xm
 *            buy  bar ████ £Xm
 *
 * Keeping bars on their own line means they never compete with the profit chip.
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
// Layout
// ─────────────────────────────────────────────────────────────────────────────

const ROW_H          = 124;
const BAR_H_SELL     = 14;
const BAR_H_BUY      = 9;
const BAR_GAP        = 7;
const ACCENT_STRIPE  = 3;
const CONTENT_MAX_W  = 1060; // hasSide — leaves room for image panel

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

  // Bar max width: full content minus year col + player col + padding
  // Content ~(CONTENT_MAX_W - 280px padding) = 780px
  // Year(72) + player(280) + paddingRight(20) = 372 used → bars get ~400px
  const BAR_MAX_W = hasSide ? 400 : 740;

  const headerProg = spring({ frame, fps, config: { damping: 28, stiffness: 55 } });
  const revealF    = (i: number) => INTRO_F + i * dwellFrames;

  // ── Typewriter helper — slices text based on elapsed frames ──────────────
  const TYPER_SPEED   = 0.7; // chars per frame
  const titleStartF   = 4;
  const subtitleStartF = titleStartF + Math.ceil(title.length / TYPER_SPEED) + 3;
  const typewriter = (text: string, startF: number, speed = TYPER_SPEED): string => {
    const chars = Math.floor(
      interpolate(frame, [startF, startF + text.length / speed], [0, text.length], {
        extrapolateLeft: "clamp", extrapolateRight: "clamp",
      })
    );
    return text.slice(0, chars);
  };

  // ── Side image opacity: rowSpring_i × (1 − rowSpring_{i+1})
  // This gives a clean crossfade with zero overlap between adjacent images.
  const imgOpacity = (i: number): number => {
    const rise = spring({ frame: frame - revealF(i),     fps, config: { damping: 24, stiffness: 50 } });
    const fall = i < n - 1
      ? spring({ frame: frame - revealF(i + 1), fps, config: { damping: 24, stiffness: 50 } })
      : 0;
    return rise * (1 - fall) * 0.85;
  };

  // Pre-reveal: show first image quietly before any row appears
  const preProg = spring({ frame, fps, config: { damping: 24, stiffness: 50 }, delay: 6 });
  const preOpacity = preProg * 0.30 * (1 - spring({ frame: frame - revealF(0), fps, config: { damping: 24, stiffness: 50 } }));

  // ── Active state (for dimming/stripe) — same rise−fall logic, separate spring config
  const activeState = (i: number): number => {
    const rise = spring({ frame: frame - revealF(i),     fps, config: { damping: 26, stiffness: 40 } });
    const fall = i < n - 1
      ? spring({ frame: frame - revealF(i + 1), fps, config: { damping: 26, stiffness: 40 } })
      : 0;
    return Math.max(0, rise - fall);
  };

  // ── Total profit — reveals at start of outro
  const totalRevealF  = INTRO_F + n * dwellFrames;
  const totalProg     = spring({ frame: frame - totalRevealF, fps, config: { damping: 20, stiffness: 45 } });
  const totalProfit   = Math.round(transfers.reduce((sum, t) => sum + (t.sellValue - t.buyValue), 0));

  // Counter: number counts up 0 → totalProfit over 28 frames, then pops
  const COUNT_DUR     = 28;
  const displayProfit = Math.round(
    interpolate(frame, [totalRevealF, totalRevealF + COUNT_DUR], [0, totalProfit], {
      extrapolateLeft: "clamp", extrapolateRight: "clamp",
    })
  );
  // Damping:16 gives one clean overshoot then settles — no repeated bouncing
  const popSpring  = spring({ frame: frame - (totalRevealF + COUNT_DUR), fps, config: { damping: 16, stiffness: 220 } });
  const popScale   = 1 + Math.max(0, popSpring - 1) * 0.15;
  const glowRadius = Math.max(0, popSpring - 1) * 40;

  return (
    <AbsoluteFill>
      <PaperBackground color={bgColor} />

      {/* ── Side images — one layer per player, clean crossfade ─────────────── */}
      {hasSide && transfers.map((t, i) => {
        const src = t.sideImage || globalImage || "";
        if (!src) return null;
        const op = Math.max(imgOpacity(i), i === 0 ? preOpacity : 0);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              right:    0,
              top:      0,
              bottom:   0,
              width:    860,
              opacity:  op,
              WebkitMaskImage: "linear-gradient(to right, transparent, black 280px, black 88%, transparent)",
              maskImage:       "linear-gradient(to right, transparent, black 280px, black 88%, transparent)",
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
          <div style={{ display: "flex", alignItems: "center", gap: 24, marginTop: 14 }}>
            <LegendDot color={accentColor} label="sold for" />
            <LegendDot color={buyColor}    label="bought for" />
            <LegendDot color={profitColor} label="profit" diamond />
          </div>
        </div>

        {/* ── Rows ──────────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {transfers.map((t, i) => {
            const rowProg = spring({ frame: frame - revealF(i), fps, config: { damping: 24, stiffness: 60 } });
            if (rowProg < 0.01) return <div key={i} style={{ height: ROW_H }} />;

            const as          = activeState(i);
            const rowOpacity  = interpolate(as, [0, 1], [0.22, 1]);
            const entryOp     = interpolate(rowProg, [0, 0.35], [0, 1], { extrapolateRight: "clamp" });
            const opacity     = rowOpacity * entryOp;

            const sellBarW = interpolate(rowProg, [0, 1], [0, (t.sellValue / maxSell) * BAR_MAX_W], { extrapolateRight: "clamp" });
            const buyBarW  = interpolate(rowProg, [0, 1], [0, (t.buyValue  / maxSell) * BAR_MAX_W], { extrapolateRight: "clamp" });

            const profitProg    = spring({ frame: frame - revealF(i) - 22, fps, config: { damping: 22, stiffness: 70 } });
            const profitOpacity = interpolate(profitProg, [0, 0.5], [0, 1], { extrapolateRight: "clamp" });
            const profitShift   = interpolate(profitProg, [0, 1], [8, 0]);

            const profit    = t.sellValue - t.buyValue;
            const profitStr = `+£${Number.isInteger(profit) ? profit : profit.toFixed(1)}m`;

            return (
              <div
                key={i}
                style={{
                  opacity,
                  height:       ROW_H,
                  borderBottom: i < n - 1 ? "1px solid rgba(0,0,0,0.06)" : "none",
                  position:     "relative",
                  paddingLeft:  ACCENT_STRIPE + 12,
                  display:      "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                {/* Active left stripe */}
                <div style={{
                  position:     "absolute",
                  left:         0,
                  top:          "18%",
                  bottom:       "18%",
                  width:        ACCENT_STRIPE,
                  borderRadius: 2,
                  background:   accentColor,
                  opacity:      as,
                }} />

                {/* ── Line 1: year + name + profit chip ─────────────────── */}
                <div style={{ display: "flex", alignItems: "baseline", gap: 0 }}>
                  {/* Year */}
                  <div style={{ width: 72, fontFamily, fontSize: 15, fontWeight: 800, color: COLORS.muted, letterSpacing: 0.5, flexShrink: 0 }}>
                    {t.year}
                  </div>

                  {/* Player + clubs */}
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

                  {/* Profit chip — right of name, never near bars */}
                  <div style={{ flexShrink: 0, opacity: profitOpacity, transform: `translateX(${profitShift}px)` }}>
                    <div style={{
                      background:   `${profitColor}1a`,
                      border:       `1px solid ${profitColor}50`,
                      borderRadius: 6,
                      padding:      "3px 12px",
                    }}>
                      <span style={{ fontFamily, fontSize: t.highlight ? 20 : 17, fontWeight: 800, color: profitColor, letterSpacing: -0.3, whiteSpace: "nowrap" }}>
                        {profitStr}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ── Line 2: bars ──────────────────────────────────────── */}
                <div style={{ paddingLeft: 72, display: "flex", flexDirection: "column", gap: BAR_GAP }}>
                  {/* Sell bar */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: sellBarW, height: BAR_H_SELL, borderRadius: 4, backgroundColor: accentColor, flexShrink: 0 }} />
                    <span style={{ fontFamily, fontSize: t.highlight ? 22 : 18, fontWeight: 900, color: accentColor, letterSpacing: -0.4, whiteSpace: "nowrap" }}>
                      {t.sellFee}
                    </span>
                  </div>
                  {/* Buy bar */}
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

      {/* ── Total profit — appears at start of outro, bottom of screen ──────── */}
      {totalProg > 0.01 && (
        <div
          style={{
            position:  "absolute",
            bottom:    52,
            left:      140,
            zIndex:    12,
            opacity:   interpolate(totalProg, [0, 0.5], [0, 1], { extrapolateRight: "clamp" }),
            transform: `translateY(${interpolate(totalProg, [0, 1], [16, 0])}px)`,
            display:   "flex",
            alignItems: "baseline",
            gap:       16,
            borderTop: "1px solid rgba(0,0,0,0.10)",
            paddingTop: 16,
            width:     hasSide ? CONTENT_MAX_W - 280 : 1640,
          }}
        >
          <div style={{ fontFamily, fontSize: 13, fontWeight: 700, color: COLORS.muted, letterSpacing: 2, textTransform: "uppercase" }}>
            {typewriter("Total profit", totalRevealF, 0.9)}
          </div>
          <div style={{
            fontFamily:    serifFontFamily,
            fontSize:      52,
            fontWeight:    900,
            color:         profitColor,
            letterSpacing: -2,
            lineHeight:    1,
            transform:     `scale(${popScale})`,
            transformOrigin: "left bottom",
            textShadow:    glowRadius > 0.5 ? `0 0 ${glowRadius}px ${profitColor}` : "none",
            display:       "inline-block",
          }}>
            +£{displayProfit}m
          </div>
          <div style={{ fontFamily, fontSize: 15, fontWeight: 500, color: COLORS.muted, paddingBottom: 6 }}>
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
    <div style={{
      width: 10, height: 10, borderRadius: 2,
      backgroundColor: color,
      transform: diamond ? "rotate(45deg)" : "none",
    }} />
    <span style={{ fontFamily, fontSize: 13, fontWeight: 600, color: COLORS.muted, letterSpacing: 0.4 }}>
      {label}
    </span>
  </div>
);
