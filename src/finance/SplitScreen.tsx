/**
 * SplitScreen / VersusPanel (K1) — two worlds side by side.
 *
 * Two halves wipe in from opposite edges with a center divider + "VS" chip. Each
 * side carries a label, optional image, and optional stat. The legit-vs-fraud
 * variant tints the right half to the Ink ground. The film's central duality.
 *
 * SBF: an AI lab vs a chaotic crypto trading floor — "Worlds Apart". Generalizes:
 * before/after, promise/reality, hero/villain.
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { SmartImg } from "../shared";
import {
  Ground,
  resolveTheme,
  useOutro,
  fadeUp,
  wipe,
  scaleSettle,
  TYPE,
  SPACE,
  RADIUS,
  INK_GROUND,
  rgbaOf,
  type Theme,
  baseTemplateSchema,
  type BaseTemplateProps,
} from "./kit";

const SideSchema = z.object({ label: z.string(), sub: z.string().optional(), stat: z.string().optional(), image: z.string().optional() });

export const SplitScreenPropsSchema = z.object({
  ...baseTemplateSchema,
  left: z.object({ label: z.string(), sub: z.string().optional(), stat: z.string().optional(), image: z.string().optional() }).optional().default({ label: "The AI Lab", sub: "Anthropic — the case for foresight", stat: "$1.3B" }),
  right: z.object({ label: z.string(), sub: z.string().optional(), stat: z.string().optional(), image: z.string().optional() }).optional().default({ label: "The Trading Floor", sub: "Alameda — the case for fraud", stat: "$8B hole" }),
  divider: z.enum(["vs", "arrow"]).optional().default("vs"),
  /** tint the right half to ink (legit vs fraud). */
  darkRight: z.boolean().optional().default(true),
  ground: z.enum(["paper", "ink", "structure"]).optional().default("paper"),
});
export type SplitScreenProps = z.input<typeof SplitScreenPropsSchema> & BaseTemplateProps;

const Half: React.FC<{
  data: z.infer<typeof SideSchema>;
  theme: Theme;
  frame: number;
  delay: number;
  from: "left" | "right";
  skip?: boolean;
}> = ({ data, theme, frame, delay, from, skip }) => {
  const p = skip ? 1 : wipe(frame, { delay, dur: 24, ease: undefined });
  const dir = from === "left" ? -1 : 1;
  return (
    <div style={{ flex: 1, position: "relative", overflow: "hidden", background: theme.bg }}>
      {data.image && (
        <AbsoluteFill style={{ opacity: p, transform: `scale(${scaleSettle(frame, { delay, dur: 30, from: 1.08 })})` }}>
          <SmartImg src={data.image} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(0.3) contrast(1.05)" }} />
          <AbsoluteFill style={{ background: `linear-gradient(0deg, ${rgbaOf(theme.bg, 0.92)} 0%, ${rgbaOf(theme.bg, 0.35)} 60%, transparent 100%)` }} />
        </AbsoluteFill>
      )}
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: SPACE[16], transform: `translateX(${(1 - p) * dir * 60}px)`, opacity: p }}>
        {data.stat && (
          <div style={{ fontFamily: TYPE.sans, fontSize: 96, fontWeight: TYPE.weight.black, letterSpacing: -3, color: theme.accent, lineHeight: 0.95 }}>{data.stat}</div>
        )}
        <div style={{ fontFamily: TYPE.sans, fontSize: 52, fontWeight: TYPE.weight.bold, color: theme.ink, marginTop: SPACE[3] }}>{data.label}</div>
        {data.sub && <div style={{ fontFamily: TYPE.mono, fontSize: TYPE.label, letterSpacing: 1.4, textTransform: "uppercase", color: theme.muted, marginTop: SPACE[2] }}>{data.sub}</div>}
      </div>
    </div>
  );
};

export const SplitScreen: React.FC<SplitScreenProps> = ({
  left = { label: "" },
  right = { label: "" },
  divider = "vs",
  darkRight = true,
  ground = "paper",
  accentColor,
  kicker,
  source,
  skipIntro,
  animateOut,
}) => {
  const frame = useCurrentFrame();
  const t = resolveTheme(ground, accentColor);
  const rightTheme: Theme = darkRight ? resolveTheme("ink", accentColor) : resolveTheme(ground, accentColor);
  const outro = useOutro(animateOut);
  const d = skipIntro ? -999 : 0;
  const chipS = skipIntro ? 1 : scaleSettle(frame, { delay: d + 18, dur: 14, from: 0.5 });

  return (
    <Ground ground={ground} accentColor={accentColor} skipIntro={skipIntro} texture={false} vignette={false} pad={0}>
      <AbsoluteFill style={{ flexDirection: "row", ...outro }}>
        <Half data={left as any} theme={t} frame={frame} delay={d + 2} from="left" skip={skipIntro} />
        <Half data={right as any} theme={rightTheme} frame={frame} delay={d + 8} from="right" skip={skipIntro} />
      </AbsoluteFill>

      {/* center divider + chip */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: 0, bottom: 0, width: 2, background: t.accent, opacity: wipe(frame, { delay: d + 6, dur: 20 }) }} />
        <div
          style={{
            transform: `scale(${chipS})`,
            width: 96,
            height: 96,
            borderRadius: "50%",
            background: t.accent,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: TYPE.mono,
            fontSize: divider === "vs" ? 30 : 40,
            fontWeight: TYPE.weight.bold,
            letterSpacing: 1,
            boxShadow: "0 20px 50px rgba(0,0,0,0.4)",
          }}
        >
          {divider === "vs" ? "VS" : "→"}
        </div>
      </AbsoluteFill>

      {kicker && (
        <div style={{ position: "absolute", top: SPACE[10], left: 0, right: 0, display: "flex", justifyContent: "center", ...fadeUp(frame, { delay: d, dur: 18 }) }}>
          <span style={{ fontFamily: TYPE.mono, fontSize: TYPE.label, letterSpacing: TYPE.track, textTransform: "uppercase", color: "#FFFFFF", background: rgbaOf(t.bg, 0.7), padding: `${SPACE[2]}px ${SPACE[5]}px`, borderRadius: RADIUS.pill }}>{kicker}</span>
        </div>
      )}
      {/* Note: SplitScreen manages its own grounds per half, so no shared SourceTag. */}
      {source && (
        <div style={{ position: "absolute", bottom: SPACE[6], left: 0, right: 0, textAlign: "center", fontFamily: TYPE.mono, fontSize: TYPE.source, letterSpacing: 1.4, textTransform: "uppercase", color: t.muted, opacity: wipe(frame, { delay: d + 24, dur: 16 }) }}>
          <span style={{ color: "#FFFFFF" }}>/ </span>{source}
        </div>
      )}
    </Ground>
  );
};
