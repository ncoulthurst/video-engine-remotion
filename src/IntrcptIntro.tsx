/**
 * IntrcptIntro — Channel intro card.
 * Style: full-bleed warm paper, large bold serif channel name, light subtitle.
 * Animation: typewriter character-by-character reveal with blinking cursor.
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { fontFamily, serifFontFamily, Grain, PaperBackground } from "./shared";

const CHANNEL_NAME = "the 90th";

export const IntrcptIntroPropsSchema = z.object({
  subtitle: z.string().optional().default("the science of football"),
  bgColor: z.string().optional().default("#f0ece4"),
});
export type IntrcptIntroProps = z.infer<typeof IntrcptIntroPropsSchema>;

const TITLE_FPC   = 3;
const SUB_FPC     = 2;
const TITLE_START = 12;
const PAUSE_AFTER_TITLE = 20;

export const IntrcptIntro: React.FC<IntrcptIntroProps> = ({
  subtitle,
  bgColor,
}) => {
  const frame = useCurrentFrame();
  const titleCharsVisible = Math.max(0, Math.floor((frame - TITLE_START) / TITLE_FPC));
  const titleDone         = titleCharsVisible >= CHANNEL_NAME.length;
  const titleDoneFrame    = TITLE_START + CHANNEL_NAME.length * TITLE_FPC;
  const visibleTitle      = CHANNEL_NAME.slice(0, titleCharsVisible);
  const SUBTITLE_START     = titleDoneFrame + PAUSE_AFTER_TITLE;
  const subCharsVisible    = Math.max(0, Math.floor((frame - SUBTITLE_START) / SUB_FPC));
  const subtitleDone       = subCharsVisible >= subtitle.length;
  const visibleSubtitle    = subtitle.slice(0, subCharsVisible);
  const cursorBlink    = Math.floor(frame / 14) % 2 === 0;
  const cursorOnTitle  = !titleDone;
  const cursorOnSub    = titleDone;
  const titleCursorOn  = cursorOnTitle;
  const subCursorOn    = cursorOnSub && (!subtitleDone || cursorBlink);

  return (
    <AbsoluteFill>
      <PaperBackground color={bgColor} />
      <Grain />
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
        <div style={{ fontFamily: serifFontFamily, fontSize: 108, fontWeight: 900, color: "#111", letterSpacing: -3, lineHeight: 1, minHeight: "1.1em" }}>
          {visibleTitle}
          {titleCursorOn && <span style={{ display: "inline-block", width: "0.06em", backgroundColor: "#111", marginLeft: "0.04em", verticalAlign: "middle", height: "0.88em", position: "relative", top: "-0.04em" }} />}
        </div>
        {titleDone && (
          <div style={{ fontFamily, fontSize: 20, fontWeight: 400, color: "#666", letterSpacing: 0.3, minHeight: "1.5em" }}>
            {visibleSubtitle}
            {subCursorOn && <span style={{ display: "inline-block", width: "1px", backgroundColor: "#666", marginLeft: 2, verticalAlign: "middle", height: "1.1em", position: "relative", top: "-0.05em" }} />}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
