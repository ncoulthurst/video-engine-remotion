import React from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { z } from "zod";
import {
  Grain, PaperBackground,
  COLORS, SPRINGS, fontFamily, serifFontFamily,
} from "./shared";

export const QuoteCardPropsSchema = z.object({
  quote:       z.string().optional().default('"Quote text here."'),
  attribution: z.string().optional().default("Attribution"),
  context:     z.string().optional().default(""),
  accentColor: z.string().optional().default(""),
  bgColor:     z.string().optional().default("#f0ece4"),
});

export type QuoteCardProps = z.infer<typeof QuoteCardPropsSchema>;

export const QuoteCard: React.FC<QuoteCardProps> = ({
  quote, attribution, context, accentColor = COLORS.gold, bgColor = "#f0ece4",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const markScale = spring({ frame, fps, from: 0, to: 1, config: SPRINGS.brand, delay: 0 });
  const markOp    = interpolate(frame, [0, 25], [0, 1], { extrapolateRight: "clamp" });

  const quoteOp   = interpolate(frame, [18, 48], [0, 1], { extrapolateRight: "clamp" });
  const quoteY    = spring({ frame, fps, from: 40, to: 0, config: SPRINGS.header, delay: 18 });

  const lineW     = spring({ frame, fps, from: 0, to: 1, config: SPRINGS.cols, delay: 38 });

  const attrOp    = interpolate(frame, [44, 64], [0, 1], { extrapolateRight: "clamp" });
  const attrY     = spring({ frame, fps, from: 20, to: 0, config: SPRINGS.row, delay: 44 });

  return (
    <AbsoluteFill>
      <PaperBackground color={bgColor} />
      <Grain />

      <div style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 140px",
      }}>
        {/* Large decorative open-quote */}
        <div style={{
          transform: `scale(${markScale})`,
          transformOrigin: "center bottom",
          opacity: markOp,
          fontFamily: serifFontFamily,
          fontSize: 160,
          fontWeight: 900,
          color: accentColor,
          lineHeight: 0.8,
          marginBottom: 20,
          alignSelf: "flex-start",
        }}>
          &ldquo;
        </div>

        {/* Quote text */}
        <div style={{
          opacity: quoteOp,
          transform: `translateY(${quoteY}px)`,
          fontFamily: serifFontFamily,
          fontSize: 56,
          fontWeight: 700,
          fontStyle: "italic",
          color: COLORS.primary,
          lineHeight: 1.25,
          letterSpacing: -0.5,
          textAlign: "center",
          maxWidth: 900,
        }}>
          {quote}
        </div>

        {/* Accent rule */}
        <div style={{
          width: `${lineW * 80}px`,
          height: 2,
          background: accentColor,
          borderRadius: 2,
          margin: "32px auto 24px",
          opacity: 0.8,
        }} />

        {/* Attribution */}
        <div style={{
          opacity: attrOp,
          transform: `translateY(${attrY}px)`,
          textAlign: "center",
        }}>
          <div style={{
            fontFamily,
            fontSize: 22,
            fontWeight: 700,
            color: COLORS.primary,
            letterSpacing: 0.5,
          }}>
            {attribution}
          </div>
          {context ? (
            <div style={{
              fontFamily,
              fontSize: 15,
              fontWeight: 400,
              color: COLORS.muted,
              marginTop: 6,
              letterSpacing: 0.3,
            }}>
              {context}
            </div>
          ) : null}
        </div>

        {/* Large decorative close-quote, bottom right */}
        <div style={{
          position: "absolute",
          right: 80,
          bottom: 40,
          fontFamily: serifFontFamily,
          fontSize: 160,
          fontWeight: 900,
          color: accentColor,
          opacity: markOp * 0.35,
          lineHeight: 0.8,
          pointerEvents: "none",
          userSelect: "none",
        }}>
          &rdquo;
        </div>
      </div>
    </AbsoluteFill>
  );
};
