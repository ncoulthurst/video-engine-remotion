/**
 * MetricGrid / KPIRow (C7) — 3–4 KPI tiles at once: a company's vitals.
 *
 * A row/grid of StatCard tiles that stagger in and count up; the featured tile
 * takes the accent. The "company at a glance" beat.
 *
 * SBF: FTX at peak — valuation / users / net worth / raised. Generalizes: every
 * "entity at a glance".
 */
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  Ground,
  SectionTitle,
  StatCard,
  SourceTag,
  resolveTheme,
  useOutro,
  stagger,
  SPACE,
  baseTemplateSchema,
  type BaseTemplateProps,
} from "./kit";

const TileSchema = z.object({ value: z.string(), label: z.string(), sub: z.string().optional(), featured: z.boolean().optional() });

export const MetricGridPropsSchema = z.object({
  ...baseTemplateSchema,
  title: z.string().optional().default("FTX at Its Peak"),
  tiles: z.array(TileSchema).optional().default([
    { value: "$32B", label: "Valuation", sub: "Jan 2022 round", featured: true },
    { value: "1.2M", label: "Active users", sub: "Nov 2022" },
    { value: "$26B", label: "SBF net worth", sub: "peak, on paper" },
    { value: "$1.8B", label: "Total raised", sub: "across rounds" },
  ]),
  ground: z.enum(["paper", "ink", "structure"]).optional().default("paper"),
});
export type MetricGridProps = z.input<typeof MetricGridPropsSchema> & BaseTemplateProps;

export const MetricGrid: React.FC<MetricGridProps> = ({
  title = "",
  tiles = [],
  ground = "paper",
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
  const cols = Math.min(tiles.length, 4);

  return (
    <Ground ground={ground} accentColor={accentColor} skipIntro={skipIntro}>
      <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", gap: SPACE[12], ...outro }}>
        <SectionTitle title={title} kicker={kicker ?? "At a Glance"} theme={t} frame={frame} delay={d} />

        <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: SPACE[6] }}>
          {tiles.map((tile, i) => (
            <StatCard
              key={i}
              value={tile.value}
              label={tile.label}
              sub={tile.sub}
              featured={tile.featured}
              theme={t}
              frame={frame}
              delay={d + 12 + stagger(i, 8)}
              skip={skipIntro}
            />
          ))}
        </div>
      </div>
      <SourceTag source={source} theme={t} frame={frame} delay={d + 40} />
    </Ground>
  );
};
