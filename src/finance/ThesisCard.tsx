/**
 * ThesisCard (A4) — the film's central question / thesis as a full-bleed statement.
 *
 * A large serif statement reveals clause-by-clause on the Ink ground; the
 * emphasisWords flip to accent on a beat. The recurring "the question is…" beat.
 *
 * SBF: "How could a celebrated investor operate within the same ecosystem as a
 * massive fraud?" · closing questions. Generalizes: "genius or luck?" (Buffett,
 * Theranos, Dalio).
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  Ground,
  Kicker,
  SourceTag,
  resolveTheme,
  useOutro,
  fadeUp,
  wipe,
  TYPE,
  SPACE,
  baseTemplateSchema,
  type BaseTemplateProps,
} from "./kit";

export const ThesisCardPropsSchema = z.object({
  ...baseTemplateSchema,
  statement: z.string().optional().default(
    "How could a celebrated investor operate within the same ecosystem as a massive fraud?",
  ),
  emphasisWords: z.array(z.string()).optional().default(["fraud"]),
  attributionLabel: z.string().optional().default("The Central Question"),
  ground: z.enum(["paper", "ink", "structure"]).optional().default("ink"),
});
export type ThesisCardProps = z.input<typeof ThesisCardPropsSchema> & BaseTemplateProps;

export const ThesisCard: React.FC<ThesisCardProps> = ({
  statement = "",
  emphasisWords = [],
  attributionLabel = "",
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

  // Word-by-word clause reveal; emphasis words flip to accent slightly after entry.
  const words = statement.split(" ");
  const emphSet = new Set(emphasisWords.map((w) => w.toLowerCase().replace(/[^a-z0-9]/gi, "")));
  const per = 2.4; // frames per word
  const emphOn = skipIntro ? 1 : wipe(frame, { delay: d + words.length * per + 10, dur: 16 });

  return (
    <Ground ground={ground} accentColor={accentColor} skipIntro={skipIntro}>
      <AbsoluteFill style={{ justifyContent: "center", padding: `${SPACE.page}px ${SPACE[20]}px` }}>
        <div style={{ ...outro, display: "flex", flexDirection: "column", gap: SPACE[10], maxWidth: 1500 }}>
          <Kicker label={kicker ?? attributionLabel} theme={t} frame={frame} delay={d} />

          <div style={{ fontFamily: TYPE.serif, fontSize: 92, fontWeight: TYPE.weight.bold, lineHeight: 1.12, letterSpacing: -0.5, color: t.ink }}>
            {words.map((w, i) => {
              const clean = w.toLowerCase().replace(/[^a-z0-9]/gi, "");
              const isEmph = emphSet.has(clean);
              const p = skipIntro ? 1 : wipe(frame, { delay: d + 6 + i * per, dur: 12 });
              const col = isEmph ? `rgba(0,0,0,0)` : t.ink; // placeholder; real color below
              return (
                <span
                  key={i}
                  style={{
                    opacity: p,
                    color: isEmph ? blend(t.ink, t.accent, emphOn) : t.ink,
                    transition: "none",
                  }}
                >
                  {w}
                  {i < words.length - 1 ? " " : ""}
                </span>
              );
            })}
          </div>

          {attributionLabel && (
            <div style={{ fontFamily: TYPE.mono, fontSize: TYPE.label, letterSpacing: 2, textTransform: "uppercase", color: t.muted, ...fadeUp(frame, { delay: d + words.length * per + 14, dur: 20 }) }}>
              — {attributionLabel}
            </div>
          )}
        </div>
      </AbsoluteFill>
      <SourceTag source={source} theme={t} frame={frame} delay={d + 40} />
    </Ground>
  );
};

/** Blend two hex colours by t∈[0,1] — used to flip emphasis words to accent. */
function blend(from: string, to: string, tt: number): string {
  const p = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const [r1, g1, b1] = p(from);
  const [r2, g2, b2] = p(to);
  const m = (a: number, b: number) => Math.round(a + (b - a) * Math.max(0, Math.min(1, tt)));
  return `rgb(${m(r1, r2)}, ${m(g1, g2)}, ${m(b1, b2)})`;
}
