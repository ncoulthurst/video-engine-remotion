/**
 * DocumentReveal (H5) — a filing / indictment / memo as evidence.
 *
 * A paper document slides onto the Ink ground; a highlight sweeps a key line in the
 * accent; an "EXHIBIT" / "SEALED" stamp thuds. Citing a document or exhibit.
 *
 * SBF: the indictment; internal Alameda books; the leaked balance sheet.
 * Generalizes: SEC filings, court exhibits, leaked memos (Enron, Theranos).
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
  scaleSettle,
  rgbaOf,
  TYPE,
  SPACE,
  RADIUS,
  PALETTES_PAPER,
  baseTemplateSchema,
  type BaseTemplateProps,
} from "./kit";

export const DocumentRevealPropsSchema = z.object({
  ...baseTemplateSchema,
  title: z.string().optional().default("United States v. Bankman-Fried"),
  docType: z.enum(["filing", "indictment", "memo", "email"]).optional().default("indictment"),
  excerpt: z.string().optional().default(
    "The defendant misappropriated and embezzled FTX customer deposits, and used billions of dollars in stolen funds for his own purposes, including to make investments.",
  ),
  highlight: z.string().optional().default("used billions of dollars in stolen funds"),
  stamp: z.enum(["exhibit", "sealed", "filed", "none"]).optional().default("exhibit"),
  ground: z.enum(["paper", "ink", "structure"]).optional().default("ink"),
});
export type DocumentRevealProps = z.input<typeof DocumentRevealPropsSchema> & BaseTemplateProps;

export const DocumentReveal: React.FC<DocumentRevealProps> = ({
  title = "",
  docType = "indictment",
  excerpt = "",
  highlight = "",
  stamp = "exhibit",
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
  const docP = skipIntro ? 1 : scaleSettle(frame, { delay: d + 4, dur: 24, from: 0.94 });

  // Split excerpt around the highlighted phrase; the highlight sweeps in.
  const idx = highlight ? excerpt.toLowerCase().indexOf(highlight.toLowerCase()) : -1;
  const before = idx >= 0 ? excerpt.slice(0, idx) : excerpt;
  const mid = idx >= 0 ? excerpt.slice(idx, idx + highlight.length) : "";
  const after = idx >= 0 ? excerpt.slice(idx + highlight.length) : "";
  const hlP = skipIntro ? 1 : wipe(frame, { delay: d + 30, dur: 22 });

  const paper = PALETTES_PAPER;

  return (
    <Ground ground={ground} accentColor={accentColor} skipIntro={skipIntro}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: SPACE.page }}>
        <div style={{ width: "100%", maxWidth: 1200, ...outro }}>
          <div style={{ marginBottom: SPACE[6] }}>
            <Kicker label={kicker ?? "Exhibit"} theme={t} frame={frame} delay={d} />
          </div>

          {/* the document — a warm paper inset on the ink ground */}
          <div
            style={{
              position: "relative",
              background: paper.bg,
              borderRadius: RADIUS.md,
              boxShadow: "0 40px 100px rgba(0,0,0,0.5)",
              padding: `${SPACE[16]}px ${SPACE[16]}px`,
              transform: `scale(${docP}) rotate(${(1 - docP) * -1.2}deg)`,
              opacity: docP,
            }}
          >
            {/* doc header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `2px solid ${paper.line}`, paddingBottom: SPACE[5], marginBottom: SPACE[8] }}>
              <span style={{ fontFamily: TYPE.mono, fontSize: TYPE.label, letterSpacing: 2, textTransform: "uppercase", color: paper.muted }}>{docType}</span>
              <span style={{ fontFamily: TYPE.serif, fontSize: TYPE.cardTitle, fontWeight: TYPE.weight.bold, color: paper.ink }}>{title}</span>
            </div>

            {/* excerpt with highlight sweep */}
            <div style={{ fontFamily: TYPE.serif, fontSize: 40, lineHeight: 1.5, color: paper.ink, ...fadeUp(frame, { delay: d + 14, dur: 24 }) }}>
              {before}
              {mid && (
                <span style={{ position: "relative", color: paper.ink, fontWeight: TYPE.weight.bold, whiteSpace: "pre-wrap" }}>
                  <span
                    style={{
                      position: "absolute",
                      left: -4,
                      right: -4,
                      top: 2,
                      bottom: 2,
                      background: rgbaOf(t.accent, 0.32),
                      transformOrigin: "left",
                      transform: `scaleX(${hlP})`,
                      borderRadius: 3,
                      zIndex: 0,
                    }}
                  />
                  <span style={{ position: "relative", zIndex: 1 }}>{mid}</span>
                </span>
              )}
              {after}
            </div>
          </div>
        </div>
      </AbsoluteFill>
      <SourceTag source={source} theme={t} frame={frame} delay={d + 48} />
    </Ground>
  );
};
