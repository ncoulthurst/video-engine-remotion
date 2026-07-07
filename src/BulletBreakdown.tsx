/**
 * BulletBreakdown — Generic titled argument / breakdown card.
 *
 * A section title + 2–4 points, each with a bold heading and a supporting
 * detail line, revealed in a staggered spring cascade with an accent marker.
 * Domain-agnostic (finance/tech/history/etc.) — the "here are the three reasons"
 * / "the case rests on" beat. Folds in the HERO BULLET POINTS tag.
 *
 * Stack: Bg (0) → Content (10) → Grain (last).
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
  DarkBackground,
  InkBackground,
  COLORS,
  SPRINGS,
  rgbaFromHex,
  WorldStateSchema,
} from "./shared";

const PointSchema = z.object({
  heading: z.string(),
  detail:  z.string().optional().default(""),
});

export const BulletBreakdownPropsSchema = z.object({
  title:      z.string().optional().default("The case against"),
  subtitle:   z.string().optional().default(""),
  points:     z.array(PointSchema).min(1).optional().default([
    { heading: "Unlimited risk appetite", detail: "A normal fund protects the downside. Alameda had billions it never had to answer for." },
    { heading: "Survivorship bias",        detail: "We remember Solana and Anthropic. We forget the dead tokens and bad bets." },
    { heading: "Paper vs realised",        detail: "A valuation is not a cheque. Most of it could never be cashed." },
  ]),
  accent:     z.string().optional().default(""),
  palette:    z.enum(["ink", "dark", "paper"]).optional().default("ink"),
  worldState: WorldStateSchema,
});
export type BulletBreakdownProps = z.infer<typeof BulletBreakdownPropsSchema>;

const PADDING_X = 200;
const DEFAULT_ACCENT = "#d97a3e";
const INK_ACCENT = "#FFD23F";

export const BulletBreakdown: React.FC<BulletBreakdownProps> = ({
  title,
  subtitle,
  points,
  accent,
  palette,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const isInk   = palette === "ink";
  const isDark  = palette === "dark";
  const fg      = (isInk || isDark) ? "#ffffff" : COLORS.primary;
  const muted   = isInk ? "rgba(255,255,255,0.68)" : isDark ? "rgba(245,240,232,0.60)" : COLORS.secondary;
  const divider = isInk ? "rgba(255,255,255,0.16)" : isDark ? "rgba(245,240,232,0.14)" : "rgba(0,0,0,0.10)";
  const ac      = accent || (isInk ? INK_ACCENT : DEFAULT_ACCENT);

  const rows = (points || []).slice(0, 4);
  const n = rows.length;

  const titleP = spring({ frame, fps, config: SPRINGS.header });
  const titleY = interpolate(titleP, [0, 1], [40, 0]);

  // Vertically centre the block of rows.
  const ROW_GAP = n <= 3 ? 150 : 118;
  const blockH  = n * ROW_GAP;
  const startY  = Math.max(300, 540 - blockH / 2 + 60);

  return (
    <AbsoluteFill style={{ fontFamily }}>
      {isInk ? <InkBackground /> : isDark ? <DarkBackground /> : <PaperBackground />}

      <AbsoluteFill style={{ zIndex: 10, padding: `120px ${PADDING_X}px` }}>
        {/* Overline / accent kicker */}
        <div style={{ opacity: titleP, transform: `translateY(${titleY}px)` }}>
          <div style={{
            width: 64, height: 5, background: ac, borderRadius: 3, marginBottom: 26,
          }} />
          <div style={{
            fontFamily: serifFontFamily, fontWeight: 900, fontSize: 72,
            lineHeight: 1.0, letterSpacing: -1.5, color: fg, maxWidth: 1300,
          }}>
            {title}
          </div>
          {subtitle ? (
            <div style={{ fontSize: 24, color: muted, marginTop: 16, letterSpacing: 0.2 }}>
              {subtitle}
            </div>
          ) : null}
        </div>

        {/* Points */}
        <div style={{ position: "absolute", left: PADDING_X, right: PADDING_X, top: startY }}>
          {rows.map((p, i) => {
            const delay = 14 + i * 12;
            const pp = spring({ frame: frame - delay, fps, config: SPRINGS.row });
            const x  = interpolate(pp, [0, 1], [46, 0]);
            return (
              <div
                key={i}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 30,
                  paddingBottom: ROW_GAP - (n <= 3 ? 46 : 34),
                  marginBottom: 0,
                  borderBottom: i < n - 1 ? `1px solid ${divider}` : "none",
                  paddingTop: i === 0 ? 0 : 26,
                  opacity: pp, transform: `translateX(${x}px)`,
                }}
              >
                <div style={{
                  flexShrink: 0, fontFamily: serifFontFamily, fontWeight: 900,
                  fontSize: 46, lineHeight: 1, color: ac, width: 58,
                }}>
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 40, fontWeight: 800, color: fg, letterSpacing: -0.5, lineHeight: 1.05 }}>
                    {p.heading}
                  </div>
                  {p.detail ? (
                    <div style={{ fontSize: 25, fontWeight: 400, color: muted, marginTop: 12, lineHeight: 1.4, maxWidth: 1180 }}>
                      {p.detail}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>

      {!isInk ? <Grain /> : null}
    </AbsoluteFill>
  );
};

export default BulletBreakdown;
