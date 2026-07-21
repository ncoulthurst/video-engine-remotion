/**
 * HeroClipCompare — Two large side-by-side clip frames for comparison.
 *
 * This is strictly a TWO-item comparison template (before/after, player A vs
 * player B, tactic A vs tactic B). Do NOT use for single-topic illustrations.
 * Each side must be a discrete, comparable item with its own clip + label.
 *
 * Formerly named HeroConceptCard (renamed 2026-04-24 — the old name caused
 * the storyboard LLM to misroute single-concept topics here).
 *
 * F3: composed from the shared kit — the old travelling white BorderGlow is
 * replaced by the reference's static 1px edge-light border (no glow, ever).
 * Clip frames land on the "entity" beat (H1).
 */
import React from "react";
import {
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Video,
} from "remotion";
import { z } from "zod";
import { fontFamily, SmartImg, WorldStateSchema } from "./shared";
import { Ground, TYPE, EASE, prog, beatDelay, resolveTheme } from "./lib/kit";

export const HeroClipComparePropsSchema = z.object({
  labelLeft:  z.string().optional().default("First Touch"),
  labelRight: z.string().optional().default("Final Ball"),
  clipLeft:   z.string().optional().default(""),
  clipRight:  z.string().optional().default(""),
  title:      z.string().optional().default(""),
  bgColor:    z.string().optional().default("#f0ece4"),
  /** Ground texture domain — "football" adds pitch markings; keep "generic"
   *  elsewhere (was hardcoded football, which leaked pitch lines into
   *  finance docs). */
  domain:     z.string().optional().default("generic"),
  worldState: WorldStateSchema.optional(),
  skipIntro: z.boolean().optional().default(false),
  beats:     z.record(z.string(), z.number()).optional(),
});
export type HeroClipCompareProps = z.infer<typeof HeroClipComparePropsSchema>;

const CLIP_W = 876;
const CLIP_H = 493; // 16:9

const ClipFrame: React.FC<{
  clipSrc:       string;
  label:         string;
  frameProgress: number;
  translateX:    number;
  labelIn:       number;
  ink:           string;
}> = ({ clipSrc, label, frameProgress, translateX, labelIn, ink }) => {
  const isVideo = /\.(mp4|webm|mov)$/i.test(clipSrc);
  const isImage = /\.(jpe?g|png|webp|gif)$/i.test(clipSrc);

  return (
    <div style={{
      display:       "flex",
      flexDirection: "column",
      alignItems:    "center",
      gap:           24,
      opacity:       frameProgress,
      transform:     `translateX(${translateX}px)`,
    }}>
      {/* Clip frame — hard geometric crop + 1px edge light (§1.4), no glow */}
      <div style={{ position: "relative" }}>
        <div style={{
          width:        CLIP_W,
          height:       CLIP_H,
          borderRadius: 6,
          overflow:     "hidden",
          background:   "#0d0d0d",
          border:       "1px solid rgba(255,255,255,0.14)",
          boxShadow:    [
            "0 24px 80px rgba(0,0,0,0.45)",
            "0 8px 24px rgba(0,0,0,0.3)",
          ].join(", "),
        }}>
          {isVideo && clipSrc ? (
            <Video
              src={staticFile(clipSrc)}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              muted
            />
          ) : isImage && clipSrc ? (
            <SmartImg src={clipSrc} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{
              width: "100%", height: "100%",
              background: "linear-gradient(160deg, #191919 0%, #0d0d0d 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{
                fontFamily,
                fontSize: 13,
                letterSpacing: 4,
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.12)",
              }}>clip</div>
            </div>
          )}
        </div>
      </div>

      {label ? (
        <div style={{
          fontFamily:    TYPE.serif,
          fontSize:      20,
          fontWeight:    400,
          fontStyle:     "italic",
          color:         ink,
          letterSpacing: 0.3,
          opacity:       labelIn * 0.75,
        }}>
          {label}
        </div>
      ) : null}
    </div>
  );
};

export const HeroClipCompare: React.FC<HeroClipCompareProps> = ({
  labelLeft, labelRight, clipLeft, clipRight, title, bgColor,
  domain = "generic", skipIntro = false, beats,
}) => {
  const frame      = useCurrentFrame();
  const { fps }    = useVideoConfig();
  const t = resolveTheme("paper", undefined, bgColor);

  const clipsAt  = beatDelay(beats, "entity", fps, 8);
  const titleIn  = skipIntro ? 1 : prog(frame, 0, 20, EASE.snap);
  const leftIn   = skipIntro ? 1 : prog(frame, clipsAt, 22, EASE.soft);
  const rightIn  = skipIntro ? 1 : prog(frame, clipsAt + 8, 22, EASE.soft);
  const labelInL = skipIntro ? 1 : prog(frame, clipsAt + 20, 18, EASE.quad);
  const labelInR = skipIntro ? 1 : prog(frame, clipsAt + 28, 18, EASE.quad);

  return (
    <Ground ground="paper" bgColor={bgColor} domain={domain as any} texture skipIntro={skipIntro} pad={0}>
      <div style={{
        position:       "absolute",
        inset:          0,
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        justifyContent: "center",
        gap:            40,
        paddingInline:  60,
      }}>
        {title ? (
          <div style={{
            fontFamily:    TYPE.serif,
            fontSize:      28,
            fontWeight:    700,
            fontStyle:     "italic",
            color:         t.ink,
            letterSpacing: -0.5,
            opacity:       titleIn,
            transform:     `translateY(${interpolate(titleIn, [0, 1], [12, 0])}px)`,
          }}>
            {title}
          </div>
        ) : null}

        <div style={{ display: "flex", gap: 48 }}>
          <ClipFrame
            clipSrc={clipLeft}
            label={labelLeft}
            frameProgress={leftIn}
            translateX={interpolate(leftIn, [0, 1], [-24, 0])}
            labelIn={labelInL}
            ink={t.ink}
          />
          <ClipFrame
            clipSrc={clipRight}
            label={labelRight}
            frameProgress={rightIn}
            translateX={interpolate(rightIn, [0, 1], [24, 0])}
            labelIn={labelInR}
            ink={t.ink}
          />
        </div>
      </div>
    </Ground>
  );
};
