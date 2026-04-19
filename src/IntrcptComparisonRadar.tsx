/**
 * IntrcptComparisonRadar — two overlapping radar polygons for player vs player comparison.
 *
 * Player A polygon uses accentColorA (default red), Player B uses accentColorB (default blue).
 * Both polygons reveal simultaneously, metric by metric with stagger.
 * Outro: split stat table slides in from the right.
 *
 * Use for: peak season comparisons, GOAT debates, positional peer battles.
 */
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { fontFamily, serifFontFamily, PaperBackground, Grain, COLORS, SmartImg } from "./shared";

const MetricSchema = z.object({
  label:        z.string(),
  percentileA:  z.number(),
  percentileB:  z.number(),
  valueA:       z.number().default(0),
  valueB:       z.number().default(0),
  unit:         z.string().default(""),
});

export const IntrcptComparisonRadarPropsSchema = z.object({
  playerA:       z.string().default("Lionel Messi"),
  playerB:       z.string().default("Cristiano Ronaldo"),
  imageA:        z.string().optional(),
  imageB:        z.string().optional(),
  seasonA:       z.string().default("2011/12"),
  seasonB:       z.string().default("2011/12"),
  competition:   z.string().default("La Liga"),
  accentColorA:  z.string().default("#C8102E"),
  accentColorB:  z.string().default("#003087"),
  bgColor:       z.string().default("#f0ece4"),
  stagger:       z.number().default(14),
  introFrames:   z.number().default(30),
  metrics: z.array(MetricSchema).optional(),
});

export type IntrcptComparisonRadarProps = z.infer<typeof IntrcptComparisonRadarPropsSchema>;

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export const IntrcptComparisonRadar: React.FC<IntrcptComparisonRadarProps> = ({
  playerA, playerB, imageA, imageB, seasonA, seasonB, competition,
  accentColorA, accentColorB, bgColor, stagger, introFrames, metrics: metricsProp,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const metrics = metricsProp ?? [];
  const N  = metrics.length;
  const R  = 300;
  const cx = 520;
  const cy = 560;

  // Title + grid springs
  const titleIn = spring({ frame, fps, config: { damping: 22, stiffness: 60 } });
  const gridIn  = spring({ frame: frame - 10, fps, config: { damping: 28, stiffness: 50 } });

  // Per-metric springs (both players reveal together)
  const metricSprings = metrics.map((_, i) =>
    spring({ frame: frame - (introFrames + i * stagger), fps, config: { damping: 16, stiffness: 52 } })
  );
  const labelSprings = metrics.map((_, i) =>
    spring({ frame: frame - (introFrames + i * stagger + 8), fps, config: { damping: 22, stiffness: 80 } })
  );

  // Outro — table slides in after all metrics are revealed
  const OUTRO_F = introFrames + N * stagger + 30;
  const tableIn = spring({ frame: frame - OUTRO_F, fps, config: { damping: 22, stiffness: 55 } });

  // Geometry
  const angleOf = (i: number) => -Math.PI / 2 + (2 * Math.PI * i) / N;
  const ptX = (i: number, pct: number, s: number) => cx + (pct / 100) * R * s * Math.cos(angleOf(i));
  const ptY = (i: number, pct: number, s: number) => cy + (pct / 100) * R * s * Math.sin(angleOf(i));

  const polyA = metrics.map((m, i) => `${ptX(i, m.percentileA, metricSprings[i])},${ptY(i, m.percentileA, metricSprings[i])}`).join(" ");
  const polyB = metrics.map((m, i) => `${ptX(i, m.percentileB, metricSprings[i])},${ptY(i, m.percentileB, metricSprings[i])}`).join(" ");

  const labelAnchor = (a: number) => Math.cos(a) > 0.25 ? "start" : Math.cos(a) < -0.25 ? "end" : "middle";
  const labelDy = (a: number, n: number) => {
    const h = n * 17;
    if (Math.sin(a) > 0.25) return 0;
    if (Math.sin(a) < -0.25) return -h + 16;
    return -(h / 2) + 8;
  };

  const LABEL_GAP = 38;

  // Table layout
  const TABLE_X = 1020;
  const TABLE_W = 820;

  return (
    <AbsoluteFill>
      <PaperBackground color={bgColor} />
      <Grain />

      {/* Player A image — left edge, masked */}
      {imageA && (
        <div style={{
          position: "absolute", left: 0, bottom: 0,
          width: 500, height: "100%",
          zIndex: 5, pointerEvents: "none",
          opacity: interpolate(titleIn, [0, 1], [0, 0.9]),
          WebkitMaskImage: "linear-gradient(to right, black 25%, transparent 78%), linear-gradient(to top, black 55%, transparent 100%)",
          maskImage:       "linear-gradient(to right, black 25%, transparent 78%), linear-gradient(to top, black 55%, transparent 100%)",
          WebkitMaskComposite: "destination-in",
          maskComposite: "intersect",
        }}>
          <SmartImg
            src={imageA}
            style={{
              width: "100%", height: "100%",
              objectFit: "contain", objectPosition: "bottom center",
              filter: "contrast(1.05) brightness(1.02)",
            }}
          />
        </div>
      )}

      {/* Player B image — right edge (behind table), masked */}
      {imageB && (
        <div style={{
          position: "absolute", right: 0, bottom: 0,
          width: 500, height: "100%",
          zIndex: 5, pointerEvents: "none",
          opacity: interpolate(titleIn, [0, 1], [0, 0.9]),
          WebkitMaskImage: "linear-gradient(to left, black 25%, transparent 78%), linear-gradient(to top, black 55%, transparent 100%)",
          maskImage:       "linear-gradient(to left, black 25%, transparent 78%), linear-gradient(to top, black 55%, transparent 100%)",
          WebkitMaskComposite: "destination-in",
          maskComposite: "intersect",
        }}>
          <SmartImg
            src={imageB}
            style={{
              width: "100%", height: "100%",
              objectFit: "contain", objectPosition: "bottom center",
              filter: "contrast(1.05) brightness(1.02)",
            }}
          />
        </div>
      )}

      <AbsoluteFill style={{ zIndex: 10 }}>

        {/* Header */}
        <div style={{
          position: "absolute", top: 52, left: 72,
          opacity: titleIn,
          transform: `translateY(${interpolate(titleIn, [0, 1], [-16, 0])}px)`,
        }}>
          <div style={{ fontFamily, fontSize: 13, fontWeight: 700, textTransform: "uppercase",
            letterSpacing: "0.18em", color: COLORS.muted, marginBottom: 8 }}>
            {competition} · Head-to-Head
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 20 }}>
            <div style={{ fontFamily: serifFontFamily, fontSize: 48, fontWeight: 900,
              color: accentColorA, letterSpacing: -1.5 }}>{playerA}</div>
            <div style={{ fontFamily: serifFontFamily, fontSize: 28, fontWeight: 900,
              color: COLORS.muted }}>vs</div>
            <div style={{ fontFamily: serifFontFamily, fontSize: 48, fontWeight: 900,
              color: accentColorB, letterSpacing: -1.5 }}>{playerB}</div>
          </div>
          <div style={{ fontFamily, fontSize: 14, color: COLORS.muted, marginTop: 4 }}>
            {seasonA}{seasonA !== seasonB ? ` · ${seasonB}` : ""}
          </div>
        </div>

        {/* Legend */}
        <div style={{
          position: "absolute", top: 52, right: 72,
          opacity: titleIn,
          display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8,
        }}>
          {[
            { color: accentColorA, name: playerA.split(" ").pop()! },
            { color: accentColorB, name: playerB.split(" ").pop()! },
          ].map(({ color, name }) => (
            <div key={name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ fontFamily, fontSize: 13, fontWeight: 700, color: COLORS.muted }}>{name}</div>
              <div style={{ width: 28, height: 3, background: color, borderRadius: 2 }} />
            </div>
          ))}
        </div>

        {/* Radar SVG */}
        <svg viewBox="0 0 1920 1080"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>

          {/* Rings */}
          {[20, 40, 60, 80, 100].map((pct, ri) => (
            <circle key={ri} cx={cx} cy={cy} r={(pct / 100) * R * gridIn}
              fill="none"
              stroke={ri === 4 ? "rgba(0,0,0,0.14)" : "rgba(0,0,0,0.07)"}
              strokeWidth={ri === 4 ? 1.5 : 1} />
          ))}

          {/* Ring labels */}
          {[20, 40, 60, 80].map((pct) => (
            <text key={pct} x={cx + 6} y={cy - (pct / 100) * R * gridIn + 13}
              fill="rgba(0,0,0,0.3)" fontSize={10} fontFamily={fontFamily}
              fontWeight={600} opacity={gridIn}>{pct}</text>
          ))}

          {/* Axis lines */}
          {metrics.map((_, i) => {
            const a = angleOf(i);
            return (
              <line key={i} x1={cx} y1={cy}
                x2={cx + R * Math.cos(a) * gridIn} y2={cy + R * Math.sin(a) * gridIn}
                stroke="rgba(0,0,0,0.1)" strokeWidth={1} />
            );
          })}

          {/* Player B polygon (behind) */}
          <polygon points={polyB}
            fill={hexToRgba(accentColorB, 0.14)}
            stroke={accentColorB} strokeWidth={2.5} strokeLinejoin="round" strokeOpacity={0.85} />

          {/* Player A polygon (front) */}
          <polygon points={polyA}
            fill={hexToRgba(accentColorA, 0.18)}
            stroke={accentColorA} strokeWidth={2.5} strokeLinejoin="round" strokeOpacity={0.9} />

          {/* Vertex dots — A */}
          {metrics.map((m, i) => {
            const s = metricSprings[i]; if (s < 0.01) return null;
            return (
              <circle key={i}
                cx={ptX(i, m.percentileA, s)} cy={ptY(i, m.percentileA, s)}
                r={5 * s} fill={accentColorA} opacity={s} />
            );
          })}

          {/* Vertex dots — B */}
          {metrics.map((m, i) => {
            const s = metricSprings[i]; if (s < 0.01) return null;
            return (
              <circle key={i}
                cx={ptX(i, m.percentileB, s)} cy={ptY(i, m.percentileB, s)}
                r={4 * s} fill={accentColorB} opacity={s * 0.9} />
            );
          })}

          {/* Axis labels */}
          {metrics.map((m, i) => {
            const a = angleOf(i);
            const lx = cx + (R + LABEL_GAP) * Math.cos(a);
            const ly = cy + (R + LABEL_GAP) * Math.sin(a);
            const anchor = labelAnchor(a) as "start" | "middle" | "end";
            const lines = m.label.split("\n");
            const dy0 = labelDy(a, lines.length);
            return (
              <text key={i} x={lx} y={ly} textAnchor={anchor}
                fill="rgba(0,0,0,0.6)"
                fontSize={13} fontWeight={600} fontFamily={fontFamily}
                letterSpacing={0.2} opacity={labelSprings[i]}>
                {lines.map((line, li) => (
                  <tspan key={li} x={lx} dy={li === 0 ? dy0 : 17}>{line}</tspan>
                ))}
              </text>
            );
          })}
        </svg>

        {/* Comparison table — slides in on outro */}
        <div style={{
          position: "absolute",
          left: TABLE_X, top: 140, width: TABLE_W,
          opacity: interpolate(tableIn, [0, 0.6], [0, 1], { extrapolateRight: "clamp" }),
          transform: `translateX(${interpolate(tableIn, [0, 1], [40, 0])}px)`,
        }}>

          {/* Table header */}
          <div style={{
            display: "flex", alignItems: "center",
            paddingBottom: 10, borderBottom: "1px solid rgba(0,0,0,0.1)",
            marginBottom: 4,
          }}>
            <div style={{ flex: 1, fontFamily, fontSize: 11, fontWeight: 700,
              textTransform: "uppercase", letterSpacing: "0.2em", color: COLORS.muted }}>Metric (per 90)</div>
            <div style={{ width: 110, textAlign: "center", fontFamily, fontSize: 11,
              fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em",
              color: accentColorA }}>{playerA.split(" ").pop()}</div>
            <div style={{ width: 110, textAlign: "center", fontFamily, fontSize: 11,
              fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em",
              color: accentColorB }}>{playerB.split(" ").pop()}</div>
          </div>

          {/* Rows */}
          {metrics.map((m, i) => {
            const aWins = m.percentileA > m.percentileB;
            const bWins = m.percentileB > m.percentileA;
            const label = m.label.replace("\n", " ");
            return (
              <div key={i} style={{
                display: "flex", alignItems: "center",
                height: 68, borderBottom: "1px solid rgba(0,0,0,0.06)",
                paddingRight: 8,
              }}>
                {/* Label */}
                <div style={{ flex: 1, fontFamily, fontSize: 15, fontWeight: 600,
                  color: COLORS.muted }}>{label}</div>

                {/* Player A percentile */}
                <div style={{ width: 110, textAlign: "center" }}>
                  <div style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    minWidth: 52, padding: "5px 12px", borderRadius: 8,
                    background: aWins ? hexToRgba(accentColorA, 0.12) : "transparent",
                    border: aWins ? `1.5px solid ${hexToRgba(accentColorA, 0.5)}` : "1.5px solid transparent",
                    fontFamily: serifFontFamily, fontSize: aWins ? 22 : 18, fontWeight: 900,
                    color: aWins ? accentColorA : COLORS.muted,
                  }}>
                    {m.valueA > 0 ? (m.valueA % 1 === 0 ? m.valueA : m.valueA.toFixed(2)) : m.percentileA}
                    {m.unit && <span style={{ fontSize: 11, marginLeft: 2 }}>{m.unit}</span>}
                  </div>
                </div>

                {/* Player B percentile */}
                <div style={{ width: 110, textAlign: "center" }}>
                  <div style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    minWidth: 52, padding: "5px 12px", borderRadius: 8,
                    background: bWins ? hexToRgba(accentColorB, 0.12) : "transparent",
                    border: bWins ? `1.5px solid ${hexToRgba(accentColorB, 0.5)}` : "1.5px solid transparent",
                    fontFamily: serifFontFamily, fontSize: bWins ? 22 : 18, fontWeight: 900,
                    color: bWins ? accentColorB : COLORS.muted,
                  }}>
                    {m.valueB > 0 ? (m.valueB % 1 === 0 ? m.valueB : m.valueB.toFixed(2)) : m.percentileB}
                    {m.unit && <span style={{ fontSize: 11, marginLeft: 2 }}>{m.unit}</span>}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Wins tally */}
          {(() => {
            const winsA = metrics.filter(m => m.percentileA > m.percentileB).length;
            const winsB = metrics.filter(m => m.percentileB > m.percentileA).length;
            return (
              <div style={{
                display: "flex", marginTop: 16, paddingTop: 12,
                borderTop: "2px solid rgba(0,0,0,0.1)",
                alignItems: "center",
              }}>
                <div style={{ flex: 1, fontFamily, fontSize: 13, fontWeight: 700,
                  textTransform: "uppercase", letterSpacing: "0.15em", color: COLORS.muted }}>
                  Edge in metrics
                </div>
                <div style={{ width: 110, textAlign: "center" }}>
                  <span style={{ fontFamily: serifFontFamily, fontSize: 36, fontWeight: 900,
                    color: winsA >= winsB ? accentColorA : COLORS.muted }}>{winsA}</span>
                </div>
                <div style={{ width: 110, textAlign: "center" }}>
                  <span style={{ fontFamily: serifFontFamily, fontSize: 36, fontWeight: 900,
                    color: winsB > winsA ? accentColorB : COLORS.muted }}>{winsB}</span>
                </div>
              </div>
            );
          })()}
        </div>

      </AbsoluteFill>
    </AbsoluteFill>
  );
};
