/**
 * DrawdownChart (E5) — the collapse. A line that rises then falls off a cliff.
 *
 * On the Ink ground the accent line draws up to a peak marker, then plunges to a
 * trough, and the wipeout percentage slams in. The bust beat.
 *
 * SBF: SOL $260 → $13; FTT's collapse; "an empire built on quicksand".
 * Generalizes: Lehman, Enron, 2008 — every crash.
 */
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  Ground,
  SectionTitle,
  Pill,
  SourceTag,
  AxisFrame,
  ACCENTS,
  resolveTheme,
  useOutro,
  wipe,
  scaleSettle,
  TYPE,
  SPACE,
  baseTemplateSchema,
  type BaseTemplateProps,
} from "./kit";

export const DrawdownChartPropsSchema = z.object({
  ...baseTemplateSchema,
  title: z.string().optional().default("The SOL Collapse"),
  unit: z.string().optional().default("USD per coin"),
  points: z.array(z.number()).optional().default([12, 30, 65, 120, 210, 260, 180, 90, 40, 22, 13]),
  peakLabel: z.string().optional().default("$260 · Nov 2021"),
  troughLabel: z.string().optional().default("$13 · Nov 2022"),
  dropPct: z.string().optional().default("−95%"),
  // Paper ground: the crash reads as an editorial chart page, not a dark panel.
  ground: z.enum(["paper", "ink", "structure"]).optional().default("paper"),
  // "Red ink" — oxblood is the fitting accent for a collapse, not brand orange.
  accentColor: z.string().optional().default(ACCENTS.loss),
  // Optional background hex override (defaults to the warm paper ground).
  bgColor: z.string().optional(),
  // Optional text-colour overrides.
  inkColor: z.string().optional(),
  mutedColor: z.string().optional(),
});
export type DrawdownChartProps = z.input<typeof DrawdownChartPropsSchema> & BaseTemplateProps;

export const DrawdownChart: React.FC<DrawdownChartProps> = ({
  title = "",
  unit = "",
  points = [],
  peakLabel = "",
  troughLabel = "",
  dropPct = "",
  ground = "paper",
  accentColor = ACCENTS.loss,
  bgColor,
  inkColor,
  mutedColor,
  kicker,
  source,
  skipIntro,
  animateOut,
}) => {
  const frame = useCurrentFrame();
  const t = resolveTheme(ground, accentColor, bgColor, inkColor, mutedColor);
  const outro = useOutro(animateOut);
  const d = skipIntro ? -999 : 0;

  const W = 1680;
  const H = 560;
  const max = Math.max(...points, 1);
  const peakIdx = points.indexOf(Math.max(...points));
  const coords = points.map((v, i) => ({
    x: (i / (points.length - 1)) * W,
    y: H - (v / max) * H * 0.86 - H * 0.07,
  }));
  const drawP = skipIntro ? 1 : wipe(frame, { delay: d + 8, dur: 60 });
  const shown = Math.max(1, Math.floor(drawP * (coords.length - 1)) + 1);
  const visible = coords.slice(0, shown);
  const linePath = visible.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
  const areaPath = visible.length > 1 ? `${linePath} L ${visible[visible.length - 1].x} ${H} L ${visible[0].x} ${H} Z` : "";
  const head = visible[visible.length - 1];
  const dropS = skipIntro ? 1 : scaleSettle(frame, { delay: d + 60, dur: 14, from: 1.5 });

  return (
    <Ground ground={ground} accentColor={accentColor} skipIntro={skipIntro} bgColor={bgColor} inkColor={inkColor} mutedColor={mutedColor} focus={{ x: 0.5, y: 0.34 }}>
      <div style={{ height: "100%", display: "flex", flexDirection: "column", gap: SPACE[10], ...outro }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <SectionTitle title={title} kicker={kicker ?? "Drawdown"} theme={t} frame={frame} delay={d} />
          <span style={{ fontFamily: TYPE.mono, fontSize: TYPE.label, letterSpacing: 1.6, textTransform: "uppercase", color: t.muted }}>{unit}</span>
        </div>

        <div style={{ flex: 1, position: "relative" }}>
          {/* shared chart grid (HTML overlay — no SVG distortion) */}
          <AxisFrame theme={t} frame={frame} delay={d + 8} rows={4} baseline={false} />
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" preserveAspectRatio="none" style={{ position: "relative", overflow: "visible" }}>
            <defs>
              <linearGradient id="dd-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={t.accent} stopOpacity={0.28} />
                <stop offset="100%" stopColor={t.accent} stopOpacity={0} />
              </linearGradient>
            </defs>
            {areaPath && <path d={areaPath} fill="url(#dd-area)" />}
            <path d={linePath} fill="none" stroke={t.accent} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
            {/* peak marker */}
            {drawP > peakIdx / (points.length - 1) && (
              <circle cx={coords[peakIdx].x} cy={coords[peakIdx].y} r={9} fill={t.bg} stroke={t.accent} strokeWidth={4} />
            )}
            {head && <circle cx={head.x} cy={head.y} r={10} fill={t.accent} />}
          </svg>

          {/* peak / trough labels */}
          <div style={{ position: "absolute", left: `${(peakIdx / (points.length - 1)) * 100}%`, top: 0, transform: "translateX(-50%)", opacity: wipe(frame, { delay: d + 34, dur: 14 }) }}>
            <Pill theme={t} filled style={{ fontSize: 24, padding: `${SPACE[3]}px ${SPACE[6]}px`, letterSpacing: 1.6 }}>{peakLabel}</Pill>
          </div>
          <div style={{ position: "absolute", right: 0, bottom: 40, opacity: wipe(frame, { delay: d + 58, dur: 14 }) }}>
            <Pill theme={t}>{troughLabel}</Pill>
          </div>

          {/* drop % — the thud, set into the open upper-right above the collapse */}
          <div style={{ position: "absolute", right: 8, top: "18%", textAlign: "right", opacity: wipe(frame, { delay: d + 60, dur: 10 }) }}>
            <div style={{ fontFamily: TYPE.mono, fontSize: TYPE.label, letterSpacing: 2.5, textTransform: "uppercase", color: t.muted, marginBottom: SPACE[2], marginRight: 8 }}>Peak to trough</div>
            <span style={{ display: "inline-block", fontFamily: TYPE.sans, fontSize: 172, fontWeight: TYPE.weight.black, letterSpacing: -7, lineHeight: 0.86, color: "#FFFFFF", transform: `scale(${dropS})`, transformOrigin: "right center" }}>
              {dropPct}
            </span>
          </div>
        </div>
      </div>
      <SourceTag source={source} theme={t} frame={frame} delay={d + 66} />
    </Ground>
  );
};
