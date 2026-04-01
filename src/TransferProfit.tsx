/**
 * TransferProfit — "The Brentford Model" player transfer showcase.
 *
 * Each row: player photo → name + origin → buy/sell price journey → profit + ROI.
 * No bar charts. The numbers ARE the visual — big, clean, legible on YouTube.
 *
 * Profit figures are shown in gold (money). The accentColor is used for
 * Brentford brand elements only. Each sold player has a destination badge row.
 *
 * The ROI multiplier (e.g. "65×") is the hook — shown large next to profit.
 */
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import {
  fontFamily, serifFontFamily, Grain, PaperBackground, DarkBackground,
  COLORS, SPRINGS, SmartImg, rgbaFromHex,
} from "./shared";

// ══════════════════════════════════════════════════════════════════════════════
// SCHEMA
// ══════════════════════════════════════════════════════════════════════════════

const PlayerSchema = z.object({
  name:       z.string(),
  imageSrc:   z.string().default(""),      // e.g. "ollie-watkins.png"
  origin:     z.string().default(""),      // "Exeter City"
  buyFee:     z.number(),                  // £m
  sellFee:    z.number().default(0),       // £m (0 = still at club)
  buyYear:    z.number().optional(),
  sellYear:   z.number().optional(),
  toClub:     z.string().default(""),      // "Aston Villa"
  sold:       z.boolean().default(true),
  estValue:   z.number().default(0),       // current estimate if not sold
});

export const TransferProfitPropsSchema = z.object({
  title:       z.string().default("The Brentford Model"),
  subtitle:    z.string().optional(),
  currency:    z.string().default("£"),
  accentColor: z.string().default("#E30613"),
  profitColor: z.string().default("#C9A84C"),   // gold for money figures
  bgColor:     z.string().default("#f0ece4"),
  darkMode:    z.boolean().default(false),
  showTotal:   z.boolean().default(true),
  players:     z.array(PlayerSchema).default([]),
});

export type TransferProfitProps = z.infer<typeof TransferProfitPropsSchema>;

// ══════════════════════════════════════════════════════════════════════════════
// LAYOUT
// ══════════════════════════════════════════════════════════════════════════════

const SCREEN_W = 1920;
const SCREEN_H = 1080;
const ROW_L    = 80;
const ROW_R    = SCREEN_W - 80;
const ROW_W    = ROW_R - ROW_L;

// Column widths (within ROW_W = 1760)
const PHOTO_W     = 110;
const PHOTO_GAP   = 28;
const NAME_W      = 310;
const JOURNEY_L   = ROW_L + PHOTO_W + PHOTO_GAP + NAME_W + 32;
const JOURNEY_W   = 680;
const PROFIT_L    = JOURNEY_L + JOURNEY_W + 24;
const PROFIT_W    = ROW_R - PROFIT_L;

const HEADER_H    = 148;
const FOOTER_H    = 100;
const INTRO_DUR   = 28;
const ROW_STAGGER = 22;

// ══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════════════════

function clamp01(v: number) { return Math.max(0, Math.min(1, v)); }

function fmtFee(currency: string, m: number): string {
  if (m <= 0) return "—";
  if (m >= 1000) return `${currency}${(m / 1000).toFixed(1)}bn`;
  return `${currency}${m}m`;
}

function fmtProfit(currency: string, m: number): string {
  return `+${fmtFee(currency, m)}`;
}

function roiLabel(buyFee: number, sellFee: number): string {
  if (buyFee <= 0 || sellFee <= 0) return "";
  const r = sellFee / buyFee;
  return r >= 10 ? `${Math.round(r)}×` : `${r.toFixed(1)}×`;
}

// ══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ══════════════════════════════════════════════════════════════════════════════

/** Photo circle with fallback initials */
const PhotoCircle: React.FC<{
  src: string; name: string; size: number; prog: number; accentColor: string; darkMode: boolean;
}> = ({ src, name, size, prog, accentColor, darkMode }) => {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const scale    = interpolate(prog, [0, 1], [0.7, 1]);
  return (
    <div style={{
      width:        size,
      height:       size,
      borderRadius: "50%",
      overflow:     "hidden",
      flexShrink:   0,
      background:   darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
      border:       `2px solid ${darkMode ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.07)"}`,
      position:     "relative",
      transform:    `scale(${scale})`,
      opacity:      prog,
      display:      "flex",
      alignItems:   "center",
      justifyContent: "center",
    }}>
      {/* Fallback initials */}
      <div style={{
        fontFamily:    serifFontFamily,
        fontSize:      size * 0.34,
        fontWeight:    900,
        color:         accentColor,
        opacity:       0.40,
        position:      "absolute",
        userSelect:    "none",
      }}>
        {initials}
      </div>
      {src && (
        <SmartImg
          src={src}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
      )}
    </div>
  );
};

/** Arrow path between buy and sell prices */
const JourneyArrow: React.FC<{
  prog: number; accentColor: string; darkMode: boolean;
}> = ({ prog, accentColor, darkMode }) => {
  const lineColor = darkMode ? "rgba(255,255,255,0.20)" : "rgba(0,0,0,0.15)";
  const lineW     = Math.round(280 * prog);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, height: 2, marginTop: 4, marginBottom: 4 }}>
      <div style={{ width: lineW, height: 2, background: lineColor, borderRadius: 1 }} />
      {prog > 0.5 && (
        <svg width={14} height={10} viewBox="0 0 14 10" style={{ flexShrink: 0, opacity: prog }}>
          <path d="M0 5 L10 5 M6 1 L10 5 L6 9" stroke={accentColor} strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
};

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
  players,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const textColor  = darkMode ? "#f5f0e8" : COLORS.primary;
  const subColor   = darkMode ? "rgba(255,255,255,0.50)" : COLORS.secondary;
  const mutedColor = darkMode ? "rgba(255,255,255,0.35)" : COLORS.muted;
  const divColor   = darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)";

  const n = players.length;

  // Compute row heights dynamically so all n players fit between header and footer
  const availH = SCREEN_H - HEADER_H - FOOTER_H - 24;
  const ITEM_H = Math.min(156, Math.floor(availH / n));
  const ITEM_STRIDE = ITEM_H;
  const topOffset = HEADER_H + Math.round((availH - n * ITEM_H) / 2);

  const soldPlayers    = players.filter((p) => p.sold && p.sellFee > 0);
  const TOTAL_PROFIT   = Math.round(soldPlayers.reduce((acc, p) => acc + (p.sellFee - p.buyFee), 0));
  const LAST_ROW_F     = INTRO_DUR + (n - 1) * ROW_STAGGER + 30;
  const TOTAL_REVEAL_F = LAST_ROW_F + 55;

  const headerProg = clamp01(spring({ frame, fps, config: SPRINGS.header }));

  return (
    <AbsoluteFill>
      {darkMode ? <DarkBackground /> : <PaperBackground color={bgColor} />}
      <Grain />

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div style={{
        position:  "absolute",
        top:       44,
        left:      ROW_L,
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

      {/* ── Column labels ─────────────────────────────────────────────────── */}
      <div style={{
        position:  "absolute",
        top:       topOffset - 30,
        left:      JOURNEY_L,
        opacity:   headerProg * 0.50,
        display:   "flex",
        width:     JOURNEY_W,
      }}>
        <div style={{ flex: 1, fontFamily, fontSize: 11, fontWeight: 700, color: mutedColor, letterSpacing: 2.5, textTransform: "uppercase" }}>
          Signed
        </div>
        <div style={{ fontFamily, fontSize: 11, fontWeight: 700, color: mutedColor, letterSpacing: 2.5, textTransform: "uppercase" }}>
          Sold
        </div>
      </div>
      <div style={{
        position:  "absolute",
        top:       topOffset - 30,
        left:      PROFIT_L,
        opacity:   headerProg * 0.50,
        fontFamily, fontSize: 11, fontWeight: 700, color: mutedColor, letterSpacing: 2.5, textTransform: "uppercase",
      }}>
        Profit · ROI
      </div>

      {/* ── Player rows ───────────────────────────────────────────────────── */}
      {players.map((player, i) => {
        const rowF    = INTRO_DUR + i * ROW_STAGGER;
        const rowProg = clamp01(spring({ frame: frame - rowF,     fps, config: { damping: 20, stiffness: 50 } }));
        const detProg = clamp01(spring({ frame: frame - rowF - 8, fps, config: { damping: 20, stiffness: 55 } }));
        const arrProg = clamp01(spring({ frame: frame - rowF - 14,fps, config: { damping: 22, stiffness: 50 } }));
        const prfProg = clamp01(spring({ frame: frame - rowF - 22,fps, config: { damping: 18, stiffness: 50 } }));
        if (rowProg < 0.01) return null;

        const itemY  = topOffset + i * ITEM_STRIDE;
        const halfH  = ITEM_H / 2;
        const profit = player.sold ? Math.round(player.sellFee - player.buyFee) : 0;
        const roi    = player.sold ? roiLabel(player.buyFee, player.sellFee) : "";

        return (
          <div key={i} style={{ position: "absolute", left: 0, top: itemY, width: SCREEN_W, height: ITEM_H }}>

            {/* Row divider */}
            {i < n - 1 && (
              <div style={{
                position:   "absolute",
                bottom:     0,
                left:       ROW_L + PHOTO_W + PHOTO_GAP,
                right:      80,
                height:     1,
                background: divColor,
              }} />
            )}

            {/* Photo */}
            <div style={{ position: "absolute", left: ROW_L, top: halfH - PHOTO_W / 2 }}>
              <PhotoCircle
                src={player.imageSrc}
                name={player.name}
                size={PHOTO_W}
                prog={rowProg}
                accentColor={accentColor}
                darkMode={darkMode}
              />
            </div>

            {/* Name + origin */}
            <div style={{
              position:  "absolute",
              left:      ROW_L + PHOTO_W + PHOTO_GAP,
              top:       halfH - 30,
              width:     NAME_W,
              opacity:   rowProg,
              transform: `translateX(${interpolate(rowProg, [0, 1], [-10, 0])}px)`,
            }}>
              <div style={{ fontFamily: serifFontFamily, fontSize: 22, fontWeight: 700, color: textColor, letterSpacing: -0.3, lineHeight: 1.1 }}>
                {player.name}
              </div>
              <div style={{ fontFamily, fontSize: 13, fontWeight: 400, color: mutedColor, marginTop: 4, lineHeight: 1 }}>
                {player.origin}
              </div>
            </div>

            {/* Price journey: buy ──► sell */}
            <div style={{
              position:   "absolute",
              left:       JOURNEY_L,
              top:        halfH - 36,
              width:      JOURNEY_W,
              opacity:    detProg,
            }}>
              {/* Price row */}
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                {/* Buy side */}
                <div>
                  <div style={{ fontFamily: serifFontFamily, fontSize: 28, fontWeight: 900, color: mutedColor, letterSpacing: -1, lineHeight: 1 }}>
                    {fmtFee(currency, player.buyFee)}
                  </div>
                  <div style={{ fontFamily, fontSize: 12, fontWeight: 400, color: mutedColor, marginTop: 3 }}>
                    {player.origin}{player.buyYear ? ` · ${player.buyYear}` : ""}
                  </div>
                </div>

                {/* Arrow */}
                <div style={{ flex: 1, padding: "0 20px", paddingTop: 6 }}>
                  <JourneyArrow prog={arrProg} accentColor={accentColor} darkMode={darkMode} />
                </div>

                {/* Sell side */}
                <div style={{ textAlign: "right" }}>
                  {player.sold ? (
                    <>
                      <div style={{ fontFamily: serifFontFamily, fontSize: 28, fontWeight: 900, color: textColor, letterSpacing: -1, lineHeight: 1 }}>
                        {fmtFee(currency, player.sellFee)}
                      </div>
                      <div style={{ fontFamily, fontSize: 12, fontWeight: 400, color: mutedColor, marginTop: 3 }}>
                        {player.toClub}{player.sellYear ? ` · ${player.sellYear}` : ""}
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontFamily: serifFontFamily, fontSize: 22, fontWeight: 700, color: subColor, letterSpacing: -0.5 }}>
                        {player.estValue > 0 ? `~${fmtFee(currency, player.estValue)}` : "Still at club"}
                      </div>
                      <div style={{ fontFamily, fontSize: 12, fontWeight: 400, color: mutedColor, marginTop: 3 }}>
                        estimated value
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Profit + ROI */}
            {player.sold && profit > 0 && (
              <div style={{
                position:   "absolute",
                left:       PROFIT_L,
                top:        halfH - 30,
                width:      PROFIT_W,
                opacity:    prfProg,
                transform:  `translateX(${interpolate(prfProg, [0, 1], [16, 0])}px)`,
              }}>
                <div style={{ fontFamily: serifFontFamily, fontSize: 30, fontWeight: 900, color: profitColor, letterSpacing: -1, lineHeight: 1 }}>
                  {fmtProfit(currency, profit)}
                </div>
                {roi && (
                  <div style={{ fontFamily, fontSize: 14, fontWeight: 700, color: profitColor, opacity: 0.70, marginTop: 4, letterSpacing: 0.5 }}>
                    {roi} return
                  </div>
                )}
              </div>
            )}

            {/* "Still at club" or unsold tag */}
            {!player.sold && (
              <div style={{
                position:   "absolute",
                left:       PROFIT_L,
                top:        halfH - 10,
                opacity:    prfProg * 0.55,
                fontFamily, fontSize: 13, fontWeight: 600, color: mutedColor, letterSpacing: 1.5, textTransform: "uppercase",
              }}>
                Still at club
              </div>
            )}
          </div>
        );
      })}

      {/* ── Total profit footer ───────────────────────────────────────────── */}
      {showTotal && (() => {
        const tp = clamp01(spring({ frame: frame - TOTAL_REVEAL_F, fps, config: SPRINGS.feature }));
        if (tp < 0.01) return null;
        return (
          <div style={{
            position:   "absolute",
            bottom:     36,
            left:       ROW_L,
            right:      80,
            display:    "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            borderTop:  `1px solid ${divColor}`,
            paddingTop: 18,
            opacity:    tp,
            transform:  `translateY(${interpolate(tp, [0, 1], [12, 0])}px)`,
          }}>
            <div style={{ fontFamily, fontSize: 14, fontWeight: 700, color: mutedColor, letterSpacing: 2, textTransform: "uppercase" }}>
              Total profit from {soldPlayers.length} sales
            </div>
            <div style={{ fontFamily: serifFontFamily, fontSize: 52, fontWeight: 900, color: profitColor, letterSpacing: -2.5, lineHeight: 1 }}>
              {fmtProfit(currency, TOTAL_PROFIT)}
            </div>
          </div>
        );
      })()}
    </AbsoluteFill>
  );
};
