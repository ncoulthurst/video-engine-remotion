/**
 * LegalTimeline / CaseProcess (I3) — the legal process as steps.
 *
 * A horizontal track of stages (charged → trial → verdict → sentence → appeal);
 * completed steps fill along the track, each carries a date + a shared Stamp
 * status, and the current/featured step takes the accent. Recapping legal
 * chronology on the structure ground.
 *
 * SBF: charged (Dec '22) → trial (Oct '23) → guilty (Nov '23) → sentenced (Mar '24).
 * Generalizes: any legal saga (Theranos, Enron).
 */
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  Ground,
  SectionTitle,
  Stamp,
  SourceTag,
  resolveTheme,
  useOutro,
  fadeUp,
  wipe,
  scaleSettle,
  stagger,
  rgbaOf,
  TYPE,
  SPACE,
  baseTemplateSchema,
  type BaseTemplateProps,
} from "./kit";

const StepSchema = z.object({ label: z.string(), date: z.string(), status: z.enum(["done", "pending"]).optional(), featured: z.boolean().optional() });

export const LegalTimelinePropsSchema = z.object({
  ...baseTemplateSchema,
  title: z.string().optional().default("The Case Against SBF"),
  steps: z.array(StepSchema).optional().default([
    { label: "Arrested & charged", date: "Dec 2022", status: "done" },
    { label: "Trial begins", date: "Oct 2023", status: "done" },
    { label: "Guilty — all 7 counts", date: "Nov 2023", status: "done", featured: true },
    { label: "Sentenced — 25 years", date: "Mar 2024", status: "done" },
    { label: "Appeal", date: "Pending", status: "pending" },
  ]),
  ground: z.enum(["paper", "ink", "structure"]).optional().default("structure"),
});
export type LegalTimelineProps = z.input<typeof LegalTimelinePropsSchema> & BaseTemplateProps;

export const LegalTimeline: React.FC<LegalTimelineProps> = ({
  title = "",
  steps = [],
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
  const n = steps.length;
  const trackP = skipIntro ? 1 : wipe(frame, { delay: d + 10, dur: 40 });

  return (
    <Ground ground={ground} accentColor={accentColor} skipIntro={skipIntro}>
      <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", gap: SPACE[16], ...outro }}>
        <SectionTitle title={title} kicker={kicker ?? "Case Process"} theme={t} frame={frame} delay={d} />

        <div style={{ position: "relative", paddingTop: SPACE[10] }}>
          {/* base track */}
          <div style={{ position: "absolute", left: `${100 / n / 2}%`, right: `${100 / n / 2}%`, top: SPACE[10] + 21, height: 4, background: t.line, borderRadius: 2 }} />
          {/* filled track */}
          <div style={{ position: "absolute", left: `${100 / n / 2}%`, top: SPACE[10] + 21, height: 4, background: t.accent, borderRadius: 2, width: `${(1 - 1 / n) * 100 * trackP}%` }} />

          <div style={{ display: "grid", gridTemplateColumns: `repeat(${n}, 1fr)` }}>
            {steps.map((s, i) => {
              const delay = d + 14 + stagger(i, 8);
              const p = skipIntro ? 1 : wipe(frame, { delay, dur: 18 });
              const done = s.status !== "pending";
              const feat = !!s.featured;
              const nodeCol = feat ? t.accent : done ? t.accent : t.surface;
              return (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: SPACE[4] }}>
                  <div
                    style={{
                      width: feat ? 44 : 32,
                      height: feat ? 44 : 32,
                      borderRadius: "50%",
                      background: done || feat ? nodeCol : t.surface,
                      border: `3px solid ${done || feat ? t.accent : t.muted}`,
                      boxShadow: feat ? `0 0 0 8px ${rgbaOf(t.accent, 0.14)}` : "none",
                      transform: `scale(${skipIntro ? 1 : scaleSettle(frame, { delay, dur: 14, from: 0.2 })})`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: TYPE.mono,
                      fontSize: 15,
                      fontWeight: TYPE.weight.bold,
                      color: t.isInk ? t.bg : "#fff",
                    }}
                  >
                    {done ? "✓" : i + 1}
                  </div>
                  <div style={{ textAlign: "center", opacity: p, transform: `translateY(${(1 - p) * 10}px)`, padding: `0 ${SPACE[3]}px` }}>
                    <div style={{ fontFamily: TYPE.mono, fontSize: TYPE.source, letterSpacing: 1, textTransform: "uppercase", color: feat ? "#FFFFFF" : t.muted }}>{s.date}</div>
                    <div style={{ fontFamily: TYPE.sans, fontSize: TYPE.body + 2, fontWeight: feat ? TYPE.weight.bold : TYPE.weight.medium, color: t.ink, marginTop: SPACE[1], lineHeight: 1.2 }}>{s.label}</div>
                  </div>
                  {feat && (
                    <div style={{ ...fadeUp(frame, { delay: delay + 8, dur: 16 }) }}>
                      <Stamp label="Verdict" size="sm" theme={t} frame={frame} delay={delay + 8} skip={skipIntro} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <SourceTag source={source} theme={t} frame={frame} delay={d + 44} />
    </Ground>
  );
};
