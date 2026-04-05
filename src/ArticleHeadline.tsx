import React from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { z } from "zod";
import { PaperBackground, Grain, COLORS, SPRINGS, fontFamily, serifFontFamily } from "./shared";

export const ArticleHeadlinePropsSchema = z.object({
  headline:       z.string().optional().default("Headline"),
  category:       z.string().optional().default("Football"),
  author:         z.string().optional().default(""),
  byline:         z.string().optional().default(""),
  date:           z.string().optional().default(""),
  highlightColor: z.string().optional().default("#f5d020"),
  bgColor:        z.string().optional().default("#f0ece4"),
});

export type ArticleHeadlineProps = z.infer<typeof ArticleHeadlinePropsSchema>;

const WORD_START   = 24;
const WORD_STAGGER = 10;

export const ArticleHeadline: React.FC<ArticleHeadlineProps> = ({
  headline, category = "Football", author, byline, date, highlightColor, bgColor,
}) => {
  const displayByline = author ? `By ${author}` : byline;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const words = headline.split(" ");

  const catOp  = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: "clamp" });
  const catY   = spring({ frame, fps, from: -16, to: 0, config: SPRINGS.row, delay: 0 });
  const metaOp = interpolate(frame, [WORD_START + words.length * WORD_STAGGER, WORD_START + words.length * WORD_STAGGER + 20], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      <PaperBackground color={bgColor} />
      <Grain />

      {/* Huge decorative serif mark — background layer */}
      <div style={{
        position: "absolute",
        right: 100,
        top: "50%",
        transform: "translateY(-50%)",
        fontFamily: serifFontFamily,
        fontSize: 500,
        fontWeight: 900,
        color: highlightColor,
        opacity: 0.06,
        lineHeight: 1,
        pointerEvents: "none",
        userSelect: "none" as const,
      }}>
        &ldquo;
      </div>

      <div style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "0 140px",
      }}>

        {/* Category overline */}
        {category && (
          <div style={{
            opacity: catOp,
            transform: `translateY(${catY}px)`,
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginBottom: 28,
          }}>
            <div style={{ width: 28, height: 3, borderRadius: 2, background: highlightColor }} />
            <div style={{ fontFamily, fontSize: 13, fontWeight: 700, letterSpacing: 3.5, color: COLORS.muted, textTransform: "uppercase" as const }}>
              {category}
            </div>
          </div>
        )}

        {/* Headline with word-by-word highlight sweep */}
        <div style={{
          fontFamily: serifFontFamily,
          fontSize: 82,
          fontWeight: 900,
          color: COLORS.primary,
          lineHeight: 1.12,
          letterSpacing: -2,
          maxWidth: "88%",
          marginBottom: 36,
        }}>
          {words.map((word, i) => {
            const delay  = WORD_START + i * WORD_STAGGER;
            const prog   = spring({ frame: frame - delay, fps, config: { damping: 22, stiffness: 70 } });
            const scaleX = interpolate(prog, [0, 1], [0, 1], { extrapolateRight: "clamp" });
            const isLast = i === words.length - 1;

            return (
              <span
                key={i}
                style={{
                  position: "relative",
                  display: "inline-block",
                  paddingLeft: 3,
                  paddingRight: 3,
                }}
              >
                {/* Highlight bar — extends into the trailing space so it connects to the next word */}
                <span style={{
                  position: "absolute",
                  inset: "8px -2px 2px -2px",
                  // Extra right extension to bridge the inter-word gap
                  right: isLast ? -2 : "-0.28em",
                  background: highlightColor,
                  transformOrigin: "left center",
                  transform: `scaleX(${scaleX})`,
                  borderRadius: isLast ? 2 : 0,
                  zIndex: 0,
                  opacity: 0.72,
                }} />
                {/* Word + trailing space (space is inside the span so highlight covers it) */}
                <span style={{ position: "relative", zIndex: 1 }}>
                  {word}{isLast ? "" : "\u00a0"}
                </span>
              </span>
            );
          })}
        </div>

        {/* Byline / date */}
        {(displayByline || date) && (
          <div style={{
            opacity: metaOp,
            display: "flex",
            gap: 20,
            alignItems: "center",
          }}>
            {displayByline && (
              <div style={{ fontFamily, fontSize: 16, fontWeight: 600, color: COLORS.secondary, letterSpacing: 0.3 }}>
                {displayByline}
              </div>
            )}
            {displayByline && date && (
              <div style={{ width: 4, height: 4, borderRadius: "50%", background: COLORS.muted }} />
            )}
            {date && (
              <div style={{ fontFamily, fontSize: 15, fontWeight: 400, color: COLORS.muted, letterSpacing: 0.3 }}>
                {date}
              </div>
            )}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
