/**
 * GlobalReach / FootprintMap (J2) — multiple locations on a map.
 *
 * Pins drop, staggered, over a faint graticule (the geographic register of the
 * structure ground); the featured location takes the accent; optional connection
 * arcs link them. Global footprint / jurisdictions / contagion spread.
 *
 * SBF: FTX's global entities (Bahamas HQ, US, Hong Kong…). Generalizes: 2008
 * contagion, BlackRock's reach.
 */
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  Ground,
  SectionTitle,
  Pill,
  SourceTag,
  FlowEdge,
  resolveTheme,
  useOutro,
  wipe,
  scaleSettle,
  stagger,
  rgbaOf,
  TYPE,
  SPACE,
  type Theme,
  baseTemplateSchema,
  type BaseTemplateProps,
} from "./kit";

const PointSchema = z.object({ region: z.string(), label: z.string().optional(), x: z.number(), y: z.number(), featured: z.boolean().optional() });

export const GlobalReachPropsSchema = z.object({
  ...baseTemplateSchema,
  title: z.string().optional().default("FTX's Global Footprint"),
  points: z.array(PointSchema).optional().default([
    { region: "Bahamas", label: "HQ", x: 0.28, y: 0.46, featured: true },
    { region: "United States", label: "FTX US", x: 0.2, y: 0.38 },
    { region: "Hong Kong", label: "Former base", x: 0.78, y: 0.5 },
    { region: "Cyprus", label: "Licensing", x: 0.55, y: 0.4 },
    { region: "Japan", label: "FTX JP", x: 0.83, y: 0.42 },
  ]),
  connect: z.boolean().optional().default(true),
  ground: z.enum(["paper", "ink", "structure"]).optional().default("structure"),
});
export type GlobalReachProps = z.input<typeof GlobalReachPropsSchema> & BaseTemplateProps;

// A flat dotted world map (the classic "global reach" register) — organic continent
// ellipses sampled onto a lon/lat dot grid. Uses the SAME equirectangular mapping the
// pins use (x = (lon+180)/360, y = (78-lat)/134) so continents sit under the pins.
const LAND_ELLIPSES: [number, number, number, number][] = [
  [-100, 48, 42, 22], // North America
  [-88, 16, 15, 9], // Central America
  [-40, 72, 17, 9], // Greenland
  [-60, -22, 22, 30], // South America
  [16, 52, 30, 16], // Europe
  [20, 2, 26, 34], // Africa
  [95, 48, 55, 27], // Asia
  [78, 22, 12, 13], // India
  [116, 6, 20, 13], // SE Asia
  [134, -25, 22, 12], // Australia
];
const isLand = (lon: number, lat: number) =>
  LAND_ELLIPSES.some(([cx, cy, rx, ry]) => ((lon - cx) / rx) ** 2 + ((lat - cy) / ry) ** 2 <= 1);

const DottedWorld: React.FC<{ theme: Theme; frame: number; delay: number }> = ({ theme, frame, delay }) => {
  const p = wipe(frame, { delay, dur: 34 });
  const cols = 70;
  const rows = 26;
  const dots: { x: number; y: number }[] = [];
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const lon = -180 + (c / (cols - 1)) * 360;
      const lat = 78 - (r / (rows - 1)) * 134;
      if (isLand(lon, lat)) dots.push({ x: (lon + 180) / 360, y: (78 - lat) / 134 });
    }
  }
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: p }}>
      {dots.map((dt, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${dt.x * 100}%`,
            top: `${dt.y * 100}%`,
            width: 7,
            height: 7,
            marginLeft: -3.5,
            marginTop: -3.5,
            borderRadius: "50%",
            background: rgbaOf(theme.ink, 0.2),
          }}
        />
      ))}
    </div>
  );
};

export const GlobalReach: React.FC<GlobalReachProps> = ({
  title = "",
  points = [],
  connect = true,
  ground = "structure",
  accentColor,
  kicker,
  source,
  skipIntro,
  animateOut,
}) => {
  const frame = useCurrentFrame();
  const t = resolveTheme(ground, accentColor);
  const outro = useOutro(animateOut);
  const d = skipIntro ? -999 : 0;

  const W = 1000;
  const H = 560;
  const featured = points.find((p) => p.featured) ?? points[0];

  return (
    <Ground ground={ground} accentColor={accentColor} skipIntro={skipIntro}>
      <div style={{ height: "100%", display: "flex", flexDirection: "column", gap: SPACE[8], ...outro }}>
        <SectionTitle title={title} kicker={kicker ?? "Where It Operated"} theme={t} frame={frame} delay={d} />

        <div style={{ flex: 1, position: "relative" }}>
          <DottedWorld theme={t} frame={frame} delay={d + 6} />

          {connect && featured && (
            <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
              {points.filter((p) => p !== featured).map((p, i) => (
                <FlowEdge
                  key={i}
                  from={{ x: featured.x * W, y: featured.y * H }}
                  to={{ x: p.x * W, y: p.y * H }}
                  frame={frame}
                  delay={d + 26 + stagger(i, 6)}
                  dur={22}
                  theme={t}
                  accent
                  curve
                  width={1.5}
                  skip={skipIntro}
                />
              ))}
            </svg>
          )}

          {points.map((p, i) => {
            const s = skipIntro ? 1 : scaleSettle(frame, { delay: d + 16 + stagger(i, 8), dur: 16, from: 0.2 });
            const op = skipIntro ? 1 : wipe(frame, { delay: d + 16 + stagger(i, 8), dur: 14 });
            return (
              <div key={i} style={{ position: "absolute", left: `${p.x * 100}%`, top: `${p.y * 100}%`, transform: "translate(-50%, -50%)" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: SPACE[2], transform: `scale(${s})`, opacity: op }}>
                  <div style={{ width: p.featured ? 22 : 14, height: p.featured ? 22 : 14, borderRadius: "50%", background: p.featured ? t.accent : t.surface, border: `3px solid ${p.featured ? t.accent : t.muted}`, boxShadow: p.featured ? `0 0 0 8px ${rgbaOf(t.accent, 0.12)}` : "none" }} />
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <span style={{ fontFamily: TYPE.sans, fontSize: TYPE.body + 2, fontWeight: TYPE.weight.bold, color: p.featured ? "#FFFFFF" : t.ink }}>{p.region}</span>
                    {p.label && <span style={{ fontFamily: TYPE.mono, fontSize: TYPE.source, letterSpacing: 1, textTransform: "uppercase", color: t.muted }}>{p.label}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", opacity: wipe(frame, { delay: d + 40, dur: 14 }) }}>
          <Pill theme={t} filled>{points.length} jurisdictions</Pill>
        </div>
      </div>
      <SourceTag source={source} theme={t} frame={frame} delay={d + 44} />
    </Ground>
  );
};
