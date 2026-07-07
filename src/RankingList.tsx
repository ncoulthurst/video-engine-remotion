/**
 * RankingList — Generic ranked-rows chart.
 *
 * A title + N ranked rows, each: rank, label, a horizontal bar sized to its
 * value (proportional to the max in the set), and the value read-out. Rows
 * cascade in and bars grow on a spring. Domain-agnostic — league tables,
 * top holdings, biggest losses, largest funding rounds.
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

const RowSchema = z.object({
  label:     z.string(),
  value:     z.number(),
  unit:      z.string().optional().default(""),
  secondary: z.string().optional().default(""),
  highlight: z.boolean().optional().default(false),
});

export const RankingListPropsSchema = z.object({
  title:      z.string().optional().default("FTX estate — largest recovered stakes"),
  subtitle:   z.string().optional().default(""),
  rows:       z.array(RowSchema).min(1).optional().default([
    { label: "Anthropic", value: 1.3, unit: "$B", secondary: "AI",         highlight: true },
    { label: "Solana",    value: 1.1, unit: "$B", secondary: "crypto" },
    { label: "SpaceX",    value: 0.5, unit: "$B", secondary: "aerospace" },
  ]),
  accent:     z.string().optional().default(""),
  palette:    z.enum(["ink", "dark", "paper"]).optional().default("ink"),
  worldState: WorldStateSchema,
});
export type RankingListProps = z.infer<typeof RankingListPropsSchema>;

const PADDING_X   = 180;
const DEFAULT_ACCENT = "#3b82c4";
const INK_ACCENT = "#FFD23F";

const fmtValue = (n: number, unit: string): string => {
  const num = Number.isInteger(n) ? n.toLocaleString() : n.toFixed(1);
  if (!unit) return num;
  if (unit.trim().startsWith("$")) {
    const tail = unit.trim().slice(1).trim();
    return `$${num}${tail ? " " + tail : ""}`;
  }
  return `${num} ${unit}`;
};

export const RankingList: React.FC<RankingListProps> = ({
  title,
  subtitle,
  rows,
  accent,
  palette,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const isInk   = palette === "ink";
  const isDark  = palette === "dark";
  const fg      = (isInk || isDark) ? "#ffffff" : COLORS.primary;
  const muted   = isInk ? "rgba(255,255,255,0.60)" : isDark ? "rgba(245,240,232,0.55)" : COLORS.muted;
  const trackBg = isInk ? "rgba(255,255,255,0.10)" : isDark ? "rgba(245,240,232,0.06)" : "rgba(0,0,0,0.05)";
  const ac      = accent || (isInk ? INK_ACCENT : DEFAULT_ACCENT);

  const data = (rows || []).slice(0, 6);
  const n = data.length;
  const maxVal = Math.max(...data.map((r) => Math.abs(r.value)), 0.0001);

  const titleP = spring({ frame, fps, config: SPRINGS.header });
  const titleY = interpolate(titleP, [0, 1], [40, 0]);

  const ROW_H  = n <= 4 ? 118 : 96;
  const startY = Math.max(300, 560 - (n * ROW_H) / 2 + 40);
  const BAR_MAX = 1180;

  return (
    <AbsoluteFill style={{ fontFamily }}>
      {isInk ? <InkBackground /> : isDark ? <DarkBackground /> : <PaperBackground />}

      <AbsoluteFill style={{ zIndex: 10, padding: `120px ${PADDING_X}px` }}>
        <div style={{ opacity: titleP, transform: `translateY(${titleY}px)` }}>
          <div style={{ width: 64, height: 5, background: ac, borderRadius: 3, marginBottom: 24 }} />
          <div style={{
            fontFamily: serifFontFamily, fontWeight: 900, fontSize: 66,
            lineHeight: 1.0, letterSpacing: -1.5, color: fg, maxWidth: 1300,
          }}>
            {title}
          </div>
          {subtitle ? (
            <div style={{ fontSize: 23, color: muted, marginTop: 14 }}>{subtitle}</div>
          ) : null}
        </div>

        <div style={{ position: "absolute", left: PADDING_X, right: PADDING_X, top: startY }}>
          {data.map((r, i) => {
            const delay = 16 + i * 10;
            const rp = spring({ frame: frame - delay, fps, config: SPRINGS.row });
            const barP = spring({ frame: frame - delay - 4, fps, config: SPRINGS.cols });
            const w = interpolate(barP, [0, 1], [0, (Math.abs(r.value) / maxVal) * BAR_MAX]);
            const rowFg = r.highlight ? ac : fg;
            return (
              <div key={i} style={{ height: ROW_H, opacity: rp, transform: `translateY(${interpolate(rp,[0,1],[24,0])}px)` }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 22, marginBottom: 12 }}>
                  <div style={{ fontFamily: serifFontFamily, fontWeight: 900, fontSize: 34, color: ac, width: 46, flexShrink: 0 }}>
                    {i + 1}
                  </div>
                  <div style={{ fontSize: 34, fontWeight: 800, color: rowFg, letterSpacing: -0.4 }}>
                    {r.label}
                  </div>
                  {r.secondary ? (
                    <div style={{ fontSize: 20, fontWeight: 500, color: muted, textTransform: "uppercase", letterSpacing: 1 }}>
                      {r.secondary}
                    </div>
                  ) : null}
                  <div style={{ marginLeft: "auto", fontSize: 34, fontWeight: 800, color: rowFg }}>
                    {fmtValue(r.value, r.unit)}
                  </div>
                </div>
                <div style={{ height: 16, background: trackBg, borderRadius: 8, overflow: "hidden", marginLeft: 68 }}>
                  <div style={{
                    height: "100%", width: w, borderRadius: 8,
                    background: r.highlight ? ac : rgbaFromHex(ac, 0.55),
                  }} />
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

export default RankingList;
