/**
 * PillSlotCycle — a fixed sentence stem stays anchored on the left while a
 * "slot" to its right cycles rapidly through a sequence of pill-shaped chips:
 * the outgoing pill flies up + blurs + fades in the first beats of the swap,
 * the incoming pill flies in from below with motion blur that clears as it
 * settles, each chip holds for one beat (~0.7s). After the last chip, the
 * slot's final pill flies out and is replaced by a plain finishing phrase
 * that settles into place (back-ease), completing the sentence.
 *
 * Ported from an external OSS Remotion template pack ("video-shotcraft") into
 * this project's own visual language — kit tokens only, no local hex/font/
 * spacing. Chips are built on the kit's `Pill` primitive (theme-correct pill
 * shape/shadow/border) with an icon slot + the fly/blur choreography added
 * around it, since the kit's `Pill` itself is static.
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { z } from "zod";
import {
  Ground,
  Pill,
  SourceTag,
  resolveTheme,
  useOutro,
  scaleSettle,
  pillShadow,
  TITLE_FONT,
  TYPE,
  SPACE,
  RADIUS,
  baseTemplateSchema,
  type BaseTemplateProps,
} from "./lib/kit";

const PillItemSchema = z.object({ label: z.string(), icon: z.string().optional() });

export const PillSlotCyclePropsSchema = z.object({
  ...baseTemplateSchema,
  stem: z.string().optional().default("One AI tool to"),
  pills: z
    .array(PillItemSchema)
    .optional()
    .default([
      { label: "Ask a question", icon: "?" },
      { label: "Find in Drive", icon: "▲" },
      { label: "Find in Slack", icon: "#" },
      { label: "Summarize", icon: "≡" },
      { label: "Improve writing", icon: "✎" },
      { label: "Draft an agenda", icon: "☰" },
    ]),
  finish: z.string().optional().default("do it all."),
  ground: z.enum(["paper", "ink", "structure"]).optional().default("structure"),
});
export type PillSlotCycleProps = z.input<typeof PillSlotCyclePropsSchema> & BaseTemplateProps;

// Headline size (stem + finish) sits at the kit's display scale; the pill
// chip text is proportioned off it, same ratio as the reference pack.
const HEAD_FS = TYPE.display;
const PILL_FS = Math.round(HEAD_FS * 0.68);
const ICON_SIZE = Math.round(PILL_FS * 0.9);
const INTRO = 12; // stem entrance, frames
const SWAP = 8; // per-beat swap duration, frames

const IconChip: React.FC<{ label: string; icon?: string; theme: ReturnType<typeof resolveTheme> }> = ({
  label,
  icon,
  theme: t,
}) => (
  <Pill
    theme={t}
    style={{
      padding: `${SPACE[4]}px ${SPACE[8]}px ${SPACE[4]}px ${icon ? SPACE[4] : SPACE[8]}px`,
      gap: SPACE[4],
      borderRadius: RADIUS.pill,
      background: t.surface,
      border: `2px solid ${t.line}`,
      boxShadow: pillShadow(t),
      fontFamily: TYPE.sans,
      fontSize: PILL_FS,
      fontWeight: TYPE.weight.bold,
      letterSpacing: -0.5,
      textTransform: "none",
      color: t.ink,
      whiteSpace: "nowrap",
    }}
  >
    {icon && (
      <span
        style={{
          width: ICON_SIZE,
          height: ICON_SIZE,
          borderRadius: RADIUS.md,
          background: t.bg,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: TYPE.mono,
          fontSize: Math.round(ICON_SIZE * 0.56),
          color: t.muted,
          flexShrink: 0,
        }}
      >
        {icon}
      </span>
    )}
    {label}
  </Pill>
);

export const PillSlotCycle: React.FC<PillSlotCycleProps> = ({
  stem = "",
  pills = [],
  finish = "",
  ground = "structure",
  accentColor,
  source,
  skipIntro,
  animateOut,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = resolveTheme(ground, accentColor);
  const outro = useOutro(animateOut);
  const BEAT = Math.round(fps * 0.7);
  const CYCLES = pills.length;

  const stemT = skipIntro ? 1 : interpolate(frame, [0, INTRO], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });

  const cycleStart = skipIntro ? 0 : INTRO;
  const cycleEnd = cycleStart + CYCLES * BEAT;
  const rel = frame - cycleStart;
  const idx = CYCLES > 0 ? Math.min(Math.floor(Math.max(rel, 0) / BEAT), CYCLES - 1) : 0;
  const beatFrame = rel - idx * BEAT;
  const isFinale = frame >= cycleEnd;

  const finT = interpolate(frame, [cycleEnd, cycleEnd + 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(1.4)),
  });

  let slot: React.ReactNode = null;

  if (!isFinale && CYCLES > 0 && rel >= 0) {
    const incoming = pills[idx];
    const outgoing = idx > 0 ? pills[idx - 1] : null;
    const inT = interpolate(beatFrame, [0, SWAP], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
    const inY = interpolate(inT, [0, 1], [120, 0]);
    const inBlur = interpolate(inT, [0, 0.7, 1], [14, 4, 0]);
    const outT = interpolate(beatFrame, [0, SWAP - 1], [0, 1], { extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) });
    const outY = interpolate(outT, [0, 1], [0, -130]);
    slot = (
      <div style={{ position: "relative", display: "inline-block" }}>
        <IconChip label={incoming.label} icon={incoming.icon} theme={t} />
        {outgoing && outT < 1 && (
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              transform: `translateY(${outY}px)`,
              opacity: 1 - outT,
              filter: `blur(${outT * 10}px)`,
              visibility: "visible",
            }}
          >
            <IconChip label={outgoing.label} icon={outgoing.icon} theme={t} />
          </div>
        )}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            transform: `translateY(${inY}px)`,
            opacity: idx === 0 ? inT : Math.min(1, inT * 1.6),
            filter: `blur(${inBlur}px)`,
          }}
        >
          <IconChip label={incoming.label} icon={incoming.icon} theme={t} />
        </div>
      </div>
    );
  } else if (isFinale) {
    const lastOutT = interpolate(frame, [cycleEnd, cycleEnd + 7], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.in(Easing.cubic),
    });
    const finScale = scaleSettle(frame, { delay: cycleEnd, dur: 14, from: 0.9, ease: Easing.out(Easing.back(1.4)) });
    slot = (
      <div style={{ position: "relative", display: "inline-block" }}>
        <span
          style={{
            ...TITLE_FONT,
            fontSize: HEAD_FS,
            color: t.ink,
            letterSpacing: -1,
            display: "inline-block",
            opacity: finT,
            transform: `translateY(${(1 - finT) * 90}px) scale(${finScale})`,
            filter: `blur(${(1 - finT) * 8}px)`,
            whiteSpace: "nowrap",
          }}
        >
          {finish}
        </span>
        {CYCLES > 0 && lastOutT < 1 && (
          <div
            style={{
              position: "absolute",
              left: 0,
              top: -8,
              transform: `translateY(${-130 * lastOutT}px)`,
              opacity: 1 - lastOutT,
              filter: `blur(${lastOutT * 10}px)`,
            }}
          >
            <IconChip label={pills[CYCLES - 1].label} icon={pills[CYCLES - 1].icon} theme={t} />
          </div>
        )}
      </div>
    );
  }

  return (
    <Ground ground={ground} accentColor={accentColor} skipIntro={skipIntro} focus={{ x: 0.42, y: 0.5 }} pad={0}>
      <AbsoluteFill style={{ ...outro }}>
        <div
          style={{
            position: "absolute",
            left: SPACE.page,
            top: "50%",
            transform: `translateY(calc(-50% + ${(1 - stemT) * 50}px))`,
            display: "flex",
            alignItems: "center",
            gap: SPACE[10],
            opacity: stemT,
          }}
        >
          <span style={{ ...TITLE_FONT, fontSize: HEAD_FS, color: t.ink, letterSpacing: -1, whiteSpace: "nowrap" }}>{stem}</span>
          {slot}
        </div>
      </AbsoluteFill>
      <SourceTag source={source} theme={t} frame={frame} delay={cycleEnd + 20} />
    </Ground>
  );
};
