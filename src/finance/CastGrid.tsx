/**
 * CastGrid / DramatisPersonae (B4) — the players involved.
 *
 * 3–8 masked portraits with mono role labels; portraits stagger-reveal and the
 * featured person gets an accent ring. Introducing a group — the "inner circle".
 *
 * SBF: Alameda / FTX leadership (SBF, Ellison, Wang, Singh). Generalizes: boards,
 * co-founders, defendants (Enron execs, Lehman board).
 */
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { SmartImg, TRIO_PORTRAIT_MASK_FULL } from "../shared";
import {
  Ground,
  SectionTitle,
  SourceTag,
  resolveTheme,
  useOutro,
  wipe,
  scaleSettle,
  stagger,
  rgbaOf,
  TYPE,
  SPACE,
  RADIUS,
  cardShadow,
  baseTemplateSchema,
  type BaseTemplateProps,
} from "./kit";

const PersonSchema = z.object({ name: z.string(), role: z.string(), portrait: z.string().optional(), featured: z.boolean().optional() });

export const CastGridPropsSchema = z.object({
  ...baseTemplateSchema,
  title: z.string().optional().default("The Inner Circle"),
  people: z.array(PersonSchema).optional().default([
    { name: "Sam Bankman-Fried", role: "Founder & CEO", featured: true },
    { name: "Caroline Ellison", role: "CEO, Alameda" },
    { name: "Gary Wang", role: "Co-founder & CTO" },
    { name: "Nishad Singh", role: "Head of Engineering" },
  ]),
  ground: z.enum(["paper", "ink", "structure"]).optional().default("paper"),
});
export type CastGridProps = z.input<typeof CastGridPropsSchema> & BaseTemplateProps;

export const CastGrid: React.FC<CastGridProps> = ({
  title = "",
  people = [],
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
  const cols = Math.min(people.length, 4);

  return (
    <Ground ground={ground} accentColor={accentColor} skipIntro={skipIntro}>
      <div style={{ height: "100%", display: "flex", flexDirection: "column", gap: SPACE[12], ...outro }}>
        <SectionTitle title={title} kicker={kicker ?? "The Players"} theme={t} frame={frame} delay={d} />

        <div style={{ flex: 1, display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: SPACE[6], alignContent: "center" }}>
          {people.map((p, i) => {
            const delay = d + 12 + stagger(i, 8);
            const pr = skipIntro ? 1 : wipe(frame, { delay, dur: 22 });
            const feat = !!p.featured;
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  opacity: pr,
                  transform: `translateY(${(1 - pr) * 20}px) scale(${skipIntro ? 1 : scaleSettle(frame, { delay, dur: 20, from: 0.94 })})`,
                }}
              >
                <div
                  style={{
                    position: "relative",
                    aspectRatio: "1 / 1.15",
                    borderRadius: RADIUS.lg,
                    overflow: "hidden",
                    background: t.surface,
                    border: `2px solid ${feat ? t.accent : t.line}`,
                    boxShadow: feat ? `0 0 0 6px ${rgbaOf(t.accent, 0.12)}, ${cardShadow(t)}` : cardShadow(t),
                  }}
                >
                  {p.portrait ? (
                    <SmartImg src={p.portrait} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(0.35) contrast(1.05)", WebkitMaskImage: TRIO_PORTRAIT_MASK_FULL, maskImage: TRIO_PORTRAIT_MASK_FULL }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: TYPE.sans, fontSize: 88, fontWeight: TYPE.weight.black, color: rgbaOf(t.ink, 0.14) }}>
                      {p.name.slice(0, 1)}
                    </div>
                  )}
                </div>
                <div style={{ marginTop: SPACE[4] }}>
                  <div style={{ fontFamily: TYPE.sans, fontSize: 28, fontWeight: TYPE.weight.bold, color: feat ? "#FFFFFF" : t.ink, letterSpacing: -0.5, lineHeight: 1.1 }}>{p.name}</div>
                  <div style={{ fontFamily: TYPE.mono, fontSize: TYPE.label, letterSpacing: 1.2, textTransform: "uppercase", color: t.muted, marginTop: SPACE[1] }}>{p.role}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <SourceTag source={source} theme={t} frame={frame} delay={d + 40} />
    </Ground>
  );
};
