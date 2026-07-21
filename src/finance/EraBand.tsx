/**
 * EraBand / PhaseTimeline (D4) — label distinct periods.
 *
 * A horizontal segmented band; each segment wipes in with its era label + date
 * range; the featured era takes the accent. Framing multi-year phases ("The Rise
 * 2017–21 / The Fall 2022").
 *
 * SBF: Rise (2017–21) → Fall (2022) → Reckoning (2023–24). Generalizes: market
 * cycles (Dot-Com, 2008), company eras.
 */
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  Ground,
  SectionTitle,
  SourceTag,
  resolveTheme,
  useOutro,
  fadeUp,
  wipe,
  stagger,
  rgbaOf,
  TYPE,
  SPACE,
  RADIUS,
  baseTemplateSchema,
  type BaseTemplateProps,
} from "./kit";

const PhaseSchema = z.object({ label: z.string(), range: z.string(), note: z.string().optional(), featured: z.boolean().optional() });

export const EraBandPropsSchema = z.object({
  ...baseTemplateSchema,
  title: z.string().optional().default("Three Acts"),
  phases: z.array(PhaseSchema).optional().default([
    { label: "The Rise", range: "2017–2021", note: "Alameda founded; FTX scales; SOL & Anthropic bets" },
    { label: "The Fall", range: "2022", note: "Bank run; bankruptcy; the hole revealed", featured: true },
    { label: "The Reckoning", range: "2023–2024", note: "Guilty on all counts; 25 years" },
  ]),
  ground: z.enum(["paper", "ink", "structure"]).optional().default("structure"),
});
export type EraBandProps = z.input<typeof EraBandPropsSchema> & BaseTemplateProps;

export const EraBand: React.FC<EraBandProps> = ({
  title = "",
  phases = [],
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
  const shades = [0.3, 0.2, 0.12];

  return (
    <Ground ground={ground} accentColor={accentColor} skipIntro={skipIntro}>
      <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", gap: SPACE[12], ...outro }}>
        <SectionTitle title={title} kicker={kicker ?? "The Arc"} theme={t} frame={frame} delay={d} />

        {/* the band */}
        <div style={{ display: "flex", width: "100%", height: 180, borderRadius: RADIUS.lg, overflow: "hidden", gap: 6 }}>
          {phases.map((ph, i) => {
            const delay = d + 12 + stagger(i, 10);
            const p = skipIntro ? 1 : wipe(frame, { delay, dur: 24 });
            const feat = !!ph.featured;
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  background: feat ? t.accent : rgbaOf(t.ink, shades[Math.min(shades.length - 1, i)]),
                  transformOrigin: "left",
                  transform: `scaleX(${p})`,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  padding: SPACE[8],
                  borderRadius: RADIUS.md,
                }}
              >
                <span style={{ fontFamily: TYPE.mono, fontSize: TYPE.label, letterSpacing: 2, textTransform: "uppercase", color: feat ? (t.isInk ? t.ink : "#fff") : rgbaOf("#ffffff", 0.85), opacity: p }}>{ph.range}</span>
                <span style={{ fontFamily: TYPE.sans, fontSize: 46, fontWeight: TYPE.weight.black, letterSpacing: -1, color: feat ? (t.isInk ? t.ink : "#fff") : "#fff", opacity: p }}>{ph.label}</span>
              </div>
            );
          })}
        </div>

        {/* notes */}
        <div style={{ display: "flex", gap: 6 }}>
          {phases.map((ph, i) => (
            <div key={i} style={{ flex: 1, padding: `0 ${SPACE[8]}px`, ...fadeUp(frame, { delay: d + 26 + stagger(i, 8), dur: 18 }) }}>
              {ph.note && <span style={{ fontFamily: TYPE.sans, fontSize: TYPE.body, color: t.muted, lineHeight: 1.35 }}>{ph.note}</span>}
            </div>
          ))}
        </div>
      </div>
      <SourceTag source={source} theme={t} frame={frame} delay={d + 40} />
    </Ground>
  );
};
