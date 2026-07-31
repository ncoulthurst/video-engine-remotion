/**
 * GaugeShareArc — a half-donut "speedometer" breakdown: wedges sweep left→
 * right across the top semicircle, each one pointed at by an external
 * label + thin leader line instead of an inline legend. The "how is this
 * body/seat count/vote split" chart — parliaments, board seats, any
 * three-or-so-way share where the labels want room to breathe outside the
 * shape itself.
 *
 * Recreated from a reference reel (recreate.mp4, segment 5: "The current
 * balance of power in the UK Parliament") onto this kit's own visual
 * language — kit tokens only, no local hex/font/spacing. Wedges are real
 * filled annular-sector paths (shares its wedge-path math with
 * PieShareChart.tsx, constrained to a 180° span) rather than stacked stroked
 * arcs — the earlier stroke-per-wedge technique left visible seams at wedge
 * boundaries. Labels are angle-computed external leader lines (the same
 * technique used in FreezeAnnotate.tsx's callout arrow) rather than an
 * inline legend.
 */
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  Ground,
  Kicker,
  SourceTag,
  resolveTheme,
  useOutro,
  wipe,
  fadeUp,
  stagger,
  rgbaOf,
  TYPE,
  SPACE,
  baseTemplateSchema,
  type BaseTemplateProps,
} from "./lib/kit";

// ── Title emphasis — "...*balance of power*..." renders the marked span in
// the serif italic register; everything else stays in the sans display face.
function EmphasisTitle({ text, color }: { text: string; color: string }) {
  const parts = text.split(/\*([^*]+)\*/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} style={{ fontFamily: TYPE.serif, fontStyle: "italic", fontWeight: TYPE.weight.bold, color }}>
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

// ── Schema ──────────────────────────────────────────────────────────────────

const WedgeSchema = z.object({ label: z.string(), value: z.number(), featured: z.boolean().optional() });

export const GaugeShareArcPropsSchema = z.object({
  ...baseTemplateSchema,
  title: z.string().optional().default("The current *balance of power* in the UK Parliament"),
  dek: z.string().optional().default(
    "Data from the 2024 general election: Labour holds about 63% of seats, Conservatives around 19%, with the remainder shared among smaller parties and independents. Source: UK Parliament & Commons Library.",
  ),
  wedges: z.array(WedgeSchema).optional().default([
    { label: "Labour", value: 411, featured: true },
    { label: "Others", value: 118 },
    { label: "Conservative", value: 121 },
  ]),
  ground: z.enum(["paper", "ink", "structure"]).optional().default("structure"),
});
export type GaugeShareArcProps = z.input<typeof GaugeShareArcPropsSchema> & BaseTemplateProps;

export const GAUGESHAREARC_DUR = 150;

function ptAt(cx: number, cy: number, r: number, thetaDeg: number) {
  const rad = (thetaDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
}

export const GaugeShareArc: React.FC<GaugeShareArcProps> = ({
  title = "",
  dek = "",
  wedges = [],
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

  const OUTER_R = 230;
  const INNER_R = 130;

  const CX = 0;
  const CY = 0;
  const VB_W = (OUTER_R + 220) * 2;
  const VB_H = OUTER_R + 220;

  const total = wedges.reduce((s, w) => s + w.value, 0) || 1;
  // featured gets the hero accent; the FIRST non-featured wedge gets the
  // editorial highlight (a genuinely different hue) so two adjacent
  // non-featured wedges never read as "the same colour, one fainter" — the
  // rest fall back to ink-tint shades.
  const inkShades = [0.85, 0.55, 0.34];
  let plainSeen = 0;
  let acc = 0;
  const arcs = wedges.map((w) => {
    const frac = w.value / total;
    const start = acc;
    acc += frac;
    let col: string;
    if (w.featured) {
      col = t.accent;
    } else {
      col = plainSeen === 0 ? t.highlight : rgbaOf(t.ink, inkShades[Math.min(inkShades.length - 1, plainSeen - 1)]);
      plainSeen += 1;
    }
    return { w, frac, start, mid: start + frac / 2, col };
  });

  return (
    <Ground ground={ground} accentColor={accentColor} skipIntro={skipIntro} texture domain="generic" focus={{ x: 0.5, y: 0.28 }}>
      <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: SPACE[10], ...outro }}>
        <div style={{ display: "flex", flexDirection: "column", gap: SPACE[3], alignItems: "center", textAlign: "center", maxWidth: 1300 }}>
          <Kicker label={kicker} theme={t} frame={frame} delay={d} align="center" />
          <div style={{ overflow: "hidden", paddingBottom: 6 }}>
            <div
              style={{
                fontFamily: TYPE.sans,
                fontSize: TYPE.cardTitle + 12,
                fontWeight: TYPE.weight.bold,
                letterSpacing: -0.8,
                lineHeight: 1.1,
                color: t.ink,
                transform: `translateY(${(1 - wipe(frame, { delay: d + 4, dur: 26 })) * (TYPE.cardTitle + 12) * 1.05}px)`,
              }}
            >
              <EmphasisTitle text={title} color={t.accent} />
            </div>
          </div>
          {dek && (
            <div style={{ fontFamily: TYPE.sans, fontSize: TYPE.source, color: t.muted, lineHeight: 1.5, ...fadeUp(frame, { delay: d + 12, dur: 22 }) }}>
              {dek}
            </div>
          )}
        </div>

        <div style={{ position: "relative", width: VB_W, height: VB_H }}>
          <svg width={VB_W} height={VB_H} viewBox={`${-VB_W / 2} ${-VB_H} ${VB_W} ${VB_H}`} style={{ overflow: "visible" }}>
            {arcs.map((a, i) => {
              const p = skipIntro ? 1 : wipe(frame, { delay: d + 10 + stagger(i, 10), dur: 30 });
              const end = a.start + a.frac * p;
              return <path key={i} d={gaugeWedgePath(CX, CY, OUTER_R, INNER_R, a.start, end)} fill={a.col} />;
            })}

            {arcs.map((a, i) => {
              const labelP = wipe(frame, { delay: d + 24 + stagger(i, 10), dur: 20 });
              if (labelP <= 0) return null;
              const thetaMid = 180 - a.mid * 180;
              const isLeft = thetaMid > 100;
              const isRight = thetaMid < 80;
              const anchor = ptAt(CX, CY, (INNER_R + OUTER_R) / 2, thetaMid);
              const labelPt = ptAt(CX, CY, OUTER_R + 90, thetaMid);
              const textAnchor = isLeft ? "end" : isRight ? "start" : "middle";
              const dx = isLeft ? -8 : isRight ? 8 : 0;
              return (
                <g key={i} opacity={labelP}>
                  <line x1={anchor.x} y1={anchor.y} x2={labelPt.x} y2={labelPt.y} stroke={t.muted} strokeWidth={1.5} />
                  <circle cx={anchor.x} cy={anchor.y} r={4} fill={a.col} />
                  <text
                    x={labelPt.x + dx}
                    y={labelPt.y - 10}
                    textAnchor={textAnchor}
                    fontFamily={TYPE.sans}
                    fontSize={22}
                    fontWeight={a.w.featured ? TYPE.weight.bold : TYPE.weight.medium}
                    fill={t.ink}
                  >
                    {a.w.label}
                  </text>
                  <text
                    x={labelPt.x + dx}
                    y={labelPt.y + 16}
                    textAnchor={textAnchor}
                    fontFamily={TYPE.mono}
                    fontSize={20}
                    fontWeight={TYPE.weight.semibold}
                    fill={t.muted}
                  >
                    {a.w.value}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      <SourceTag source={source} theme={t} frame={frame} delay={d + 40} />
    </Ground>
  );
};

// filled annular-sector path for a wedge spanning fracStart→fracEnd of the
// 180° track (0 = left/9 o'clock, 1 = right/3 o'clock, sweeping over the
// top). sweep-flag 1 on the outer arc: left→right across the TOP, a dome —
// confirmed by render (0 produced an upside-down "U" bulging downward).
function gaugeWedgePath(cx: number, cy: number, outerR: number, innerR: number, fracStart: number, fracEnd: number) {
  const thetaStart = 180 * (1 - fracStart);
  const thetaEnd = 180 * (1 - fracEnd);
  const oStart = ptAt(cx, cy, outerR, thetaStart);
  const oEnd = ptAt(cx, cy, outerR, thetaEnd);
  if (innerR <= 0) {
    return `M ${cx} ${cy} L ${oStart.x} ${oStart.y} A ${outerR} ${outerR} 0 0 1 ${oEnd.x} ${oEnd.y} Z`;
  }
  const iStart = ptAt(cx, cy, innerR, thetaStart);
  const iEnd = ptAt(cx, cy, innerR, thetaEnd);
  return (
    `M ${iStart.x} ${iStart.y} L ${oStart.x} ${oStart.y} ` +
    `A ${outerR} ${outerR} 0 0 1 ${oEnd.x} ${oEnd.y} L ${iEnd.x} ${iEnd.y} ` +
    `A ${innerR} ${innerR} 0 0 0 ${iStart.x} ${iStart.y} Z`
  );
}
