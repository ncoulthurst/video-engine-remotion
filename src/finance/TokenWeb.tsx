/**
 * TokenWeb (F5) — a network with one unstable central node.
 *
 * A web draws from a central accent node out to radiating neutral satellites; the
 * center pulses (concentration risk). On "unstable", the whole web trembles — an
 * ecosystem that depends on one asset. On the Ink ground.
 *
 * SBF: "FTT as a central, unstable node in a complex web" — the FTT Anchor.
 * Generalizes: ecosystem / dependency graphs, contagion (2008).
 */
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  Ground,
  SectionTitle,
  Pill,
  SourceTag,
  resolveTheme,
  useOutro,
  wipe,
  scaleSettle,
  stagger,
  rgbaOf,
  TYPE,
  SPACE,
  baseTemplateSchema,
  type BaseTemplateProps,
} from "./kit";

const SatelliteSchema = z.object({ label: z.string(), weight: z.number().optional() });

export const TokenWebPropsSchema = z.object({
  ...baseTemplateSchema,
  centerLabel: z.string().optional().default("FTT"),
  satellites: z.array(SatelliteSchema).optional().default([
    { label: "Alameda balance sheet", weight: 1 },
    { label: "FTX collateral" },
    { label: "Lender loans" },
    { label: "Serum" },
    { label: "Market confidence" },
    { label: "Customer trust" },
  ]),
  unstable: z.boolean().optional().default(true),
  caption: z.string().optional().default("One token propped up the entire empire."),
  ground: z.enum(["paper", "ink", "structure"]).optional().default("ink"),
});
export type TokenWebProps = z.input<typeof TokenWebPropsSchema> & BaseTemplateProps;

export const TokenWeb: React.FC<TokenWebProps> = ({
  centerLabel = "",
  satellites = [],
  unstable = true,
  caption = "",
  ground = "ink",
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

  const W = 1200;
  const H = 620;
  const cx = W / 2;
  const cy = H / 2;
  const R = 250;
  const n = satellites.length;
  // gentle tremor once the web is drawn — the "unstable" signal
  const settled = wipe(frame, { delay: d + 8, dur: 40 });
  // gentle, slow sway once drawn — the "unstable" signal, not a harsh jitter
  const tremor = unstable && settled > 0.95 && !skipIntro ? Math.sin(frame * 0.22) * 1.1 : 0;
  const centerPulse = 1 + (unstable ? Math.sin(frame * 0.18) * 0.03 : 0);

  return (
    <Ground ground={ground} accentColor={accentColor} skipIntro={skipIntro}>
      <div style={{ height: "100%", display: "flex", flexDirection: "column", gap: SPACE[8], ...outro }}>
        <SectionTitle title="The FTT Anchor" kicker={kicker ?? "Concentration Risk"} theme={t} frame={frame} delay={d} />

        <div style={{ flex: 1, position: "relative" }}>
          <div style={{ position: "absolute", left: "50%", top: "50%", width: W, height: H, transform: `translate(-50%, -50%) translateX(${tremor}px)` }}>
            <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
              {satellites.map((s, i) => {
                const ang = (i / n) * Math.PI * 2 - Math.PI / 2;
                const sx = cx + Math.cos(ang) * R;
                const sy = cy + Math.sin(ang) * R * 0.82;
                const delay = d + 14 + stagger(i, 8);
                const p = skipIntro ? 1 : wipe(frame, { delay, dur: 20 });
                // Start the spoke at the token's OUTER EDGE (not its centre), so no line
                // runs through the token — it just touches the border and radiates out.
                const dx = sx - cx, dy = sy - cy;
                const dist = Math.hypot(dx, dy) || 1;
                const rEdge = 92; // token radius (90) + border
                const startX = cx + (dx / dist) * rEdge;
                const startY = cy + (dy / dist) * rEdge;
                const ex = startX + (sx - startX) * p;
                const ey = startY + (sy - startY) * p;
                return <line key={i} x1={startX} y1={startY} x2={ex} y2={ey} stroke={t.accent} strokeOpacity={0.5} strokeWidth={2} />;
              })}
            </svg>

            {/* satellites */}
            {satellites.map((s, i) => {
              const ang = (i / n) * Math.PI * 2 - Math.PI / 2;
              const sx = cx + Math.cos(ang) * R;
              const sy = cy + Math.sin(ang) * R * 0.82;
              const p = skipIntro ? 1 : scaleSettle(frame, { delay: d + 18 + stagger(i, 8), dur: 16, from: 0.4 });
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: sx,
                    top: sy,
                    transform: `translate(-50%, -50%) scale(${p})`,
                    opacity: p,
                    padding: `${SPACE[2]}px ${SPACE[4]}px`,
                    borderRadius: 999,
                    background: t.surface,
                    border: `1px solid ${t.line}`,
                    fontFamily: TYPE.sans,
                    fontSize: TYPE.body,
                    fontWeight: TYPE.weight.medium,
                    color: t.muted,
                    whiteSpace: "nowrap",
                  }}
                >
                  {s.label}
                </div>
              );
            })}

            {/* center node */}
            <div
              style={{
                position: "absolute",
                left: cx,
                top: cy,
                transform: `translate(-50%, -50%) scale(${(skipIntro ? 1 : scaleSettle(frame, { delay: d + 4, dur: 18, from: 0.4 })) * centerPulse})`,
                width: 180,
                height: 180,
                borderRadius: "50%",
                background: t.accent,
                border: `3px solid ${t.accent}`,
                boxShadow: `0 0 0 ${unstable ? 16 : 8}px ${rgbaOf(t.accent, 0.10)}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: TYPE.sans,
                fontSize: 56,
                fontWeight: TYPE.weight.black,
                letterSpacing: -1,
                color: "#FFFFFF",
              }}
            >
              {centerLabel}
            </div>
          </div>
        </div>

        {caption && (
          <div style={{ display: "flex", justifyContent: "center", opacity: wipe(frame, { delay: d + 44, dur: 16 }) }}>
            <Pill theme={t} filled>{caption}</Pill>
          </div>
        )}
      </div>
      <SourceTag source={source} theme={t} frame={frame} delay={d + 48} />
    </Ground>
  );
};
