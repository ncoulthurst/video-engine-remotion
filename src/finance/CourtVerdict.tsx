/**
 * CourtVerdict (I1) — the charges and the verdict.
 *
 * The counts stagger in on the Ink ground; each verdict stamps (GUILTY → accent-red),
 * then the overall thuds in. Court + date footer. The legal-outcome beat of every
 * fraud doc.
 *
 * SBF: "found guilty on all seven counts of fraud and conspiracy".
 * Generalizes: Theranos, Enron — any verdict / charges beat.
 */
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  Ground,
  SectionTitle,
  SourceTag,
  Stamp,
  resolveTheme,
  useOutro,
  fadeUp,
  wipe,
  scaleSettle,
  stagger,
  rgbaOf,
  TYPE,
  SPACE,
  RADIUS,
  baseTemplateSchema,
  type BaseTemplateProps,
} from "./kit";

const CountSchema = z.object({ label: z.string(), verdict: z.enum(["guilty", "not_guilty"]) });

export const CourtVerdictPropsSchema = z.object({
  ...baseTemplateSchema,
  defendant: z.string().optional().default("Sam Bankman-Fried"),
  counts: z.array(CountSchema).optional().default([
    { label: "Wire fraud on customers", verdict: "guilty" },
    { label: "Wire fraud on lenders", verdict: "guilty" },
    { label: "Conspiracy — wire fraud (customers)", verdict: "guilty" },
    { label: "Conspiracy — wire fraud (lenders)", verdict: "guilty" },
    { label: "Conspiracy — securities fraud", verdict: "guilty" },
    { label: "Conspiracy — commodities fraud", verdict: "guilty" },
    { label: "Conspiracy — money laundering", verdict: "guilty" },
  ]),
  overall: z.string().optional().default("Guilty on all 7 counts"),
  court: z.string().optional().default("U.S. District Court, S.D.N.Y."),
  date: z.string().optional().default("November 2, 2023"),
  ground: z.enum(["paper", "ink", "structure"]).optional().default("ink"),
  // optional photo bled into the right of the frame, blended into the ground.
  image: z.string().optional().default(""),
});
export type CourtVerdictProps = z.input<typeof CourtVerdictPropsSchema> & BaseTemplateProps;

export const CourtVerdict: React.FC<CourtVerdictProps> = ({
  defendant = "",
  counts = [],
  overall = "",
  court = "",
  date = "",
  ground = "ink",
  image = "",
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
  const overallDelay = d + 16 + stagger(counts.length, 7) + 8;

  return (
    <Ground ground={ground} accentColor={accentColor} skipIntro={skipIntro} bgImage={image}>
      <div style={{ height: "100%", display: "flex", flexDirection: "column", gap: SPACE[10], ...outro }}>
        <SectionTitle title={defendant} kicker={kicker ?? "The Verdict"} theme={t} frame={frame} delay={d} />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: SPACE[3] }}>
          {counts.map((c, i) => {
            const delay = d + 16 + stagger(i, 7);
            const rowP = skipIntro ? 1 : wipe(frame, { delay, dur: 16 });
            const guilty = c.verdict === "guilty";
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: SPACE[6],
                  padding: `${SPACE[3]}px ${SPACE[6]}px`,
                  borderBottom: `1px solid ${t.line}`,
                  opacity: rowP,
                  transform: `translateX(${(1 - rowP) * -16}px)`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: SPACE[5] }}>
                  <span style={{ fontFamily: TYPE.mono, fontSize: TYPE.label, color: t.muted, width: 40 }}>{String(i + 1).padStart(2, "0")}</span>
                  <span style={{ fontFamily: TYPE.sans, fontSize: TYPE.sub, fontWeight: TYPE.weight.medium, color: t.ink }}>{c.label}</span>
                </div>
                <Stamp
                  label={guilty ? "Guilty" : "Not Guilty"}
                  active={guilty}
                  filled={guilty}
                  size="sm"
                  theme={t}
                  frame={frame}
                  delay={delay + 4}
                  skip={skipIntro}
                />
              </div>
            );
          })}
        </div>

        {/* Overall */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", ...fadeUp(frame, { delay: overallDelay, dur: 18 }) }}>
          <div style={{ fontFamily: TYPE.sans, fontSize: 60, fontWeight: TYPE.weight.black, letterSpacing: -1.5, color: "#FFFFFF" }}>{overall}</div>
          <div style={{ textAlign: "right", fontFamily: TYPE.mono, fontSize: TYPE.label, letterSpacing: 1.2, textTransform: "uppercase", color: "rgba(255,255,255,0.9)", lineHeight: 1.5 }}>
            <div>{court}</div>
            <div>{date}</div>
          </div>
        </div>
      </div>
      <SourceTag source={source} theme={t} frame={frame} delay={overallDelay + 6} />
    </Ground>
  );
};
