/**
 * EditorialPortrait — H-2 (ROADMAP_TO_REFERENCE / PREMIUM_POLISH_SPEC §2.7).
 *
 * The "never show a raw photo" wrapper. Every subject image rendered through
 * this component gets the editorial treatment in one place:
 *   - grade: desaturate + contrast lift + slight warmth (heavier grayscale on
 *     ink grounds — the cheap duotone read)
 *   - offset silhouette stroke: a hard accent-coloured drop-shadow behind the
 *     cutout (the vintage offset-print look; needs a transparent PNG to read)
 *   - soft directional shadow beneath (kit SHADOW.node register)
 *
 * Scene images (full-bleed b-roll stills) should use ArchivalFrame instead —
 * this wrapper is for CUTOUT SUBJECTS placed over a textured canvas.
 */
import React from "react";
import { SmartImg, rgbaFromHex } from "../shared";

export const EditorialPortrait: React.FC<{
  src: string;
  /** ONE accent per frame — the offset stroke colour. */
  accent?: string;
  /** Dark/ink ground → heavier grayscale grade (duotone approximation). */
  onInk?: boolean;
  /** Disable the offset stroke (e.g. when several portraits share a frame —
   * PLAYER TRIO-style groups keep ONE accent per frame by dropping strokes). */
  offsetStroke?: boolean;
  /** Extra CSS filter appended after the treatment (masks stay caller-side). */
  extraFilter?: string;
  style?: React.CSSProperties;
  imgStyle?: React.CSSProperties;
}> = ({ src, accent = "#C25A3F", onInk = false, offsetStroke = true, extraFilter = "", style, imgStyle }) => {
  const grade = onInk
    ? "grayscale(0.85) contrast(1.15) sepia(0.10)"
    : "saturate(0.65) contrast(1.12) sepia(0.05)";
  const stroke = offsetStroke ? ` drop-shadow(8px 8px 0 ${rgbaFromHex(accent, 0.9)})` : "";
  const soft = " drop-shadow(0 24px 46px rgba(28,26,21,0.28))";
  return (
    <div style={{ position: "relative", ...style }}>
      <SmartImg
        src={src}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: `${grade}${stroke}${soft}${extraFilter ? ` ${extraFilter}` : ""}`,
          ...imgStyle,
        }}
      />
    </div>
  );
};
