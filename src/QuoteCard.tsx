/**
 * QuoteCard — centered editorial pull-quote.
 * F3: composed from the shared kit (Ground/TYPE/prog) — no per-comp springs or
 * grain. The quote lands on the "subject" beat, attribution on "entity" (H1).
 */
import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { WorldStateSchema } from "./shared";
import { Ground, TYPE, EASE, prog, wipe, beatDelay, resolveTheme } from "./lib/kit";

export const QuoteCardPropsSchema = z.object({
  quote:       z.string().optional().default('"Quote text here."'),
  attribution: z.string().optional().default("Attribution"),
  context:     z.string().optional().default(""),
  accentColor: z.string().optional().default(""),
  bgColor:     z.string().optional().default("#f0ece4"),
  // Track E — portrait backfill (resolver in graphics_agent fills via SmartImg)
  playerImage: z.string().optional().default(""),
  worldState: WorldStateSchema.optional(),
  skipIntro: z.boolean().optional().default(false),
  beats:     z.record(z.string(), z.number()).optional(),
});

export type QuoteCardProps = z.infer<typeof QuoteCardPropsSchema>;

export const QuoteCard: React.FC<QuoteCardProps> = ({
  quote, attribution, context, accentColor, bgColor = "#f0ece4", skipIntro = false, beats,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = resolveTheme("paper", accentColor || undefined, bgColor);

  const quoteDelay = beatDelay(beats, "subject", fps, 18);
  const attrDelay  = beatDelay(beats, "entity", fps, Math.max(44, quoteDelay + 26));

  const markIn  = skipIntro ? 1 : prog(frame, 0, 22, EASE.snap);
  const quoteIn = skipIntro ? 1 : prog(frame, quoteDelay, 24, EASE.snap);
  const lineW   = skipIntro ? 1 : wipe(frame, { delay: quoteDelay + 20, dur: 20 });
  const attrIn  = skipIntro ? 1 : prog(frame, attrDelay, 20, EASE.snap);

  return (
    <Ground ground="paper" bgColor={bgColor} accentColor={accentColor || undefined} domain="football" texture skipIntro={skipIntro} pad={0}>
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
          transform: `scale(${markIn})`,
          transformOrigin: "center bottom",
          opacity: markIn,
          fontFamily: TYPE.serif,
          fontSize: 160,
          fontWeight: 900,
          color: t.accent,
          lineHeight: 0.8,
          marginBottom: 20,
          alignSelf: "flex-start",
        }}>
          &ldquo;
        </div>

        {/* Quote text */}
        <div style={{
          opacity: quoteIn,
          transform: `translateY(${(1 - quoteIn) * 40}px)`,
          fontFamily: TYPE.serif,
          fontSize: 56,
          fontWeight: 700,
          fontStyle: "italic",
          color: t.ink,
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
          background: t.accent,
          borderRadius: 2,
          margin: "32px auto 24px",
          opacity: 0.8,
        }} />

        {/* Attribution */}
        <div style={{
          opacity: attrIn,
          transform: `translateY(${(1 - attrIn) * 20}px)`,
          textAlign: "center",
        }}>
          <div style={{
            fontFamily: TYPE.sans,
            fontSize: 22,
            fontWeight: 700,
            color: t.ink,
            letterSpacing: 0.5,
          }}>
            {attribution}
          </div>
          {context ? (
            <div style={{
              fontFamily: TYPE.mono,
              fontSize: 15,
              fontWeight: 400,
              color: t.muted,
              marginTop: 6,
              letterSpacing: TYPE.track,
              textTransform: "uppercase",
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
          fontFamily: TYPE.serif,
          fontSize: 160,
          fontWeight: 900,
          color: t.accent,
          opacity: markIn * 0.35,
          lineHeight: 0.8,
          pointerEvents: "none",
          userSelect: "none",
        }}>
          &rdquo;
        </div>
      </div>
    </Ground>
  );
};
