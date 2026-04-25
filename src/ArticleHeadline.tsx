/**
 * ArticleHeadline — Editorial newsprint headline.
 *
 * Real newsprint feel: masthead + dateline, single accent rule, large serif
 * headline with word-by-word reveal, justified lede paragraph, byline at
 * bottom. Paper bg + Grain LAST. Optional cropped image (right side) when
 * imageSrc is supplied.
 */
import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import {
  PaperBackground, Grain, SmartImg,
  fontFamily, serifFontFamily, WorldStateSchema,
} from "./shared";

export const ArticleHeadlinePropsSchema = z.object({
  headline:       z.string().optional().default("Headline"),
  publication:    z.string().optional().default("The Athletic"),
  category:       z.string().optional().default("Football"),
  author:         z.string().optional().default(""),
  byline:         z.string().optional().default(""),
  date:           z.string().optional().default(""),
  edition:        z.string().optional().default(""),
  lede:           z.string().optional().default(""),
  imageSrc:       z.string().optional().default(""),
  imageCaption:   z.string().optional().default(""),
  highlightColor: z.string().optional().default("#C8102E"),
  accentColor:    z.string().optional().default(""),
  bgColor:        z.string().optional().default("#f0ece4"),
  worldState:     WorldStateSchema.optional(),
  skipIntro:      z.boolean().optional().default(false),
});

export type ArticleHeadlineProps = z.infer<typeof ArticleHeadlinePropsSchema>;

export const ArticleHeadline: React.FC<ArticleHeadlineProps> = ({
  headline, publication, category, author, byline, date, edition, lede, imageSrc, imageCaption,
  highlightColor, accentColor, bgColor, skipIntro = false, worldState,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const wsAccent = (worldState as { accentColor?: string } | undefined)?.accentColor;
  const accent = (accentColor && accentColor !== "")
    ? accentColor
    : (wsAccent && wsAccent !== "")
      ? wsAccent
      : highlightColor;

  const inkColor   = "#111";
  const mutedInk   = "rgba(17,17,17,0.45)";

  const displayByline = author ? `By ${author}` : byline;
  const words = headline.split(" ");
  const lastWordEnd = 24 + words.length * 10 + 16;

  // Subtle slow zoom — every template needs camera movement (§1)
  const camProg = skipIntro ? 1 : interpolate(frame, [0, 90], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const camScale = interpolate(camProg, [0, 1], [1.018, 1.0]);

  // Folio dateline — fades in first
  const folioProg = skipIntro ? 1 : interpolate(frame, [4, 24], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // Image (when present) — slides in from right
  const imageProg = skipIntro ? 1 : (imageSrc ? spring({ frame: frame - 14, fps, config: { damping: 28, stiffness: 55 } }) : 0);
  // Accent rule — draws from left
  const ruleProg  = skipIntro ? 1 : interpolate(frame, [16, 36], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  // Lede + byline — after headline completes
  const ledeProg  = skipIntro ? 1 : interpolate(frame, [lastWordEnd, lastWordEnd + 24], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const editionLine = [edition, date].filter(Boolean).join("  ·  ").toUpperCase();
  const hasImage = Boolean(imageSrc);

  return (
    <AbsoluteFill>
      <PaperBackground color={bgColor} />

      {/* Plane settles via subtle slow zoom */}
      <AbsoluteFill style={{
        transform: `scale(${camScale})`,
        transformOrigin: "50% 40%",
      }}>
        {/* Masthead — top, full width with column rule */}
        <div style={{
          position: "absolute",
          left: 140,
          right: 140,
          top: 96,
          opacity: folioProg,
          transform: `translateY(${interpolate(folioProg, [0, 1], [-12, 0])}px)`,
        }}>
          <div style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            paddingBottom: 14,
            borderBottom: `1px solid rgba(17,17,17,0.18)`,
          }}>
            {/* Publication wordmark — serif italic */}
            <div style={{
              fontFamily: serifFontFamily,
              fontStyle: "italic",
              fontSize: 38,
              fontWeight: 900,
              color: inkColor,
              letterSpacing: -1.5,
              lineHeight: 1,
            }}>
              {publication}
            </div>
            {/* Edition / date dateline */}
            {editionLine && (
              <div style={{
                fontFamily,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 4,
                color: mutedInk,
                textTransform: "uppercase" as const,
              }}>
                {editionLine}
              </div>
            )}
          </div>
        </div>

        {/* Category overline + accent tab — sits below masthead */}
        <div style={{
          position: "absolute",
          left: 140,
          top: 200,
          opacity: folioProg,
          transform: `translateY(${interpolate(folioProg, [0, 1], [8, 0])}px)`,
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}>
          <div style={{ width: 36, height: 3, background: accent }} />
          <div style={{
            fontFamily,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 3.5,
            color: mutedInk,
            textTransform: "uppercase" as const,
          }}>
            {category}
          </div>
        </div>

        {/* Cropped image (optional) — right column, with caption */}
        {hasImage && (
          <div style={{
            position: "absolute",
            right: 140,
            top: 250,
            width: 540,
            height: 620,
            opacity: imageProg,
            transform: `translateX(${interpolate(imageProg, [0, 1], [40, 0])}px)`,
            overflow: "hidden",
          }}>
            <SmartImg
              src={imageSrc}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "top center",
                display: "block",
                filter: "grayscale(0.4) contrast(1.05)",
              }}
            />
            {imageCaption && (
              <div style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                padding: "16px 18px",
                background: "linear-gradient(to top, rgba(0,0,0,0.65), transparent)",
                fontFamily,
                fontSize: 13,
                fontWeight: 500,
                color: "#fff",
                letterSpacing: 0.3,
                lineHeight: 1.3,
              }}>
                {imageCaption}
              </div>
            )}
          </div>
        )}

        {/* Headline — large serif BLACK ink, word-by-word reveal */}
        <div style={{
          position: "absolute",
          left: 140,
          right: hasImage ? 720 : 140,
          top: 280,
          fontFamily: serifFontFamily,
          fontSize: hasImage ? 76 : 96,
          fontWeight: 900,
          color: inkColor,
          letterSpacing: -3,
          lineHeight: 1.05,
        }}>
          {words.map((word, i) => {
            const delay = 24 + i * 10;
            const op = skipIntro ? 1 : interpolate(frame, [delay, delay + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            const ty = skipIntro ? 0 : interpolate(frame, [delay, delay + 14], [16, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            return (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  opacity: op,
                  transform: `translateY(${ty}px)`,
                  marginRight: "0.30em",
                }}
              >
                {word}
              </span>
            );
          })}
        </div>

        {/* Single accent rule — the editorial decorative device, beneath headline */}
        <div style={{
          position: "absolute",
          left: 140,
          bottom: 280,
          width: interpolate(ruleProg, [0, 1], [0, hasImage ? 360 : 460]),
          height: 2,
          background: accent,
        }} />

        {/* Lede paragraph — justified body text */}
        {lede && (
          <div style={{
            position: "absolute",
            left: 140,
            right: hasImage ? 720 : 800,
            bottom: 168,
            fontFamily: serifFontFamily,
            fontSize: 22,
            fontWeight: 400,
            color: inkColor,
            lineHeight: 1.5,
            letterSpacing: 0.1,
            textAlign: "justify" as const,
            opacity: ledeProg,
            transform: `translateY(${interpolate(ledeProg, [0, 1], [8, 0])}px)`,
          }}>
            {lede}
          </div>
        )}

        {/* Byline — bottom-left small caps */}
        {(displayByline || date) && (
          <div style={{
            position: "absolute",
            left: 140,
            bottom: 100,
            opacity: ledeProg,
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}>
            {displayByline && (
              <div style={{
                fontFamily,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 3,
                textTransform: "uppercase" as const,
                color: inkColor,
              }}>
                {displayByline}
              </div>
            )}
            {displayByline && date && (
              <div style={{ width: 3, height: 3, borderRadius: "50%", background: mutedInk }} />
            )}
            {date && (
              <div style={{
                fontFamily,
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: 2,
                textTransform: "uppercase" as const,
                color: mutedInk,
              }}>
                {date}
              </div>
            )}
          </div>
        )}

        {/* Source attribution — bottom-right small caps mono */}
        <div style={{
          position: "absolute",
          right: 140,
          bottom: 100,
          fontFamily,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 4,
          textTransform: "uppercase" as const,
          color: mutedInk,
          opacity: ledeProg,
        }}>
          {publication}
        </div>
      </AbsoluteFill>

      <Grain />
    </AbsoluteFill>
  );
};
