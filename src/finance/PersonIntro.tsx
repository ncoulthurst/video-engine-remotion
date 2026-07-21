/**
 * PersonIntro (B1) — introduce a key person. The recurring "meet X" beat.
 *
 * A masked portrait dissolving into the ground on the left, a name-stack with an
 * accent tick on the right, mono role + one credential line. The highest-reuse
 * people template. Antagonist variant → ink ground.
 *
 * SBF: SBF himself. Generalizes: Ellison, Wang, prosecutors — Buffett, Musk,
 * Holmes, Neumann, Dalio, Fuld.
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import { SmartImg } from "../shared";
import {
  Ground,
  Kicker,
  RuleSweep,
  SourceTag,
  resolveTheme,
  useOutro,
  fadeUp,
  wipe,
  scaleSettle,
  TITLE_FONT,
  TYPE,
  SPACE,
  RADIUS,
  baseTemplateSchema,
  type BaseTemplateProps,
} from "./kit";

export const PersonIntroPropsSchema = z.object({
  ...baseTemplateSchema,
  name: z.string().optional().default("Sam Bankman-Fried"),
  role: z.string().optional().default("Founder & CEO"),
  credential: z.string().optional().default("Once worth $26B — now serving 25 years for fraud."),
  org: z.string().optional().default("FTX · Alameda Research"),
  portrait: z.string().optional().default(""),
  ground: z.enum(["paper", "ink", "structure"]).optional().default("paper"),
});
export type PersonIntroProps = z.input<typeof PersonIntroPropsSchema> & BaseTemplateProps;

export const PersonIntro: React.FC<PersonIntroProps> = ({
  name = "",
  role = "",
  credential = "",
  org = "",
  portrait = "",
  ground = "paper",
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

  const portraitP = skipIntro ? 1 : wipe(frame, { delay: d, dur: 26, ease: undefined });
  const grayscale = interpolate(portraitP, [0, 1], [0.9, 0]);

  return (
    <Ground ground={ground} accentColor={accentColor} skipIntro={skipIntro}>
      <AbsoluteFill style={{ flexDirection: "row", alignItems: "stretch" }}>
        {/* Portrait column — the ENTIRE group (photo + hue-tint + settle + vignettes) lives
            inside ONE right-fade masked container, exactly like CourtVerdict's GroundImage,
            so the whole thing dissolves into the ground together — no hard edge / colour line. */}
        <div style={{ position: "relative", width: "44%", overflow: "hidden" }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              transform: `scale(${scaleSettle(frame, { delay: d, dur: 30, from: 1.08 })})`,
              opacity: portraitP,
              WebkitMaskImage: "linear-gradient(to right, #000 0%, #000 50%, transparent 100%)",
              maskImage: "linear-gradient(to right, #000 0%, #000 50%, transparent 100%)",
              pointerEvents: "none",
            }}
          >
            {portrait ? (
              <>
                <SmartImg src={portrait} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", filter: `grayscale(${grayscale}) contrast(1.04)` }} />
                {/* recolour the photo to the ground hue so it joins the world */}
                <AbsoluteFill style={{ background: t.bg, opacity: 0.5, mixBlendMode: "color" }} />
                {/* settle it back so overlaid text stays readable */}
                <AbsoluteFill style={{ background: t.bg, opacity: 0.32 }} />
                {/* top + bottom vignettes melt those frame edges into the ground */}
                <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 200, background: `linear-gradient(to bottom, ${t.bg}, transparent)` }} />
                <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 260, background: `linear-gradient(to top, ${t.bg}, transparent)` }} />
              </>
            ) : (
              <div style={{ width: "100%", height: "100%", background: t.surface }} />
            )}
          </div>
        </div>

        {/* Name-stack column */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: `${SPACE.page}px ${SPACE.page}px ${SPACE.page}px ${SPACE[10]}px`, ...outro }}>
          <Kicker label={kicker ?? "Key Player"} theme={t} frame={frame} delay={d + 6} />

          <div style={{ display: "flex", alignItems: "center", gap: SPACE[5], marginTop: SPACE[6] }}>
            <div
              style={{
                width: 8,
                height: 88,
                background: t.highlight,
                borderRadius: RADIUS.sm,
                transform: `scaleY(${wipe(frame, { delay: d + 10, dur: 16 })})`,
                transformOrigin: "top",
              }}
            />
            <div style={{ overflow: "hidden" }}>
              <div
                style={{
                  ...TITLE_FONT,
                  fontSize: 86,
                  letterSpacing: -2.5,
                  lineHeight: 0.98,
                  color: t.ink,
                  transform: `translateY(${(1 - wipe(frame, { delay: d + 10, dur: 24 })) * 96}px)`,
                }}
              >
                {name}
              </div>
            </div>
          </div>

          <div
            style={{
              fontFamily: TYPE.mono,
              fontSize: TYPE.sub,
              fontWeight: TYPE.weight.medium,
              letterSpacing: 1.6,
              textTransform: "uppercase",
              color: "#FFFFFF",
              marginTop: SPACE[6],
              marginLeft: SPACE[8],
              ...fadeUp(frame, { delay: d + 20, dur: 20 }),
            }}
          >
            {role}
            {org && <span style={{ color: t.muted }}>{"  ·  " + org}</span>}
          </div>

          <div style={{ width: 340, marginTop: SPACE[8], marginLeft: SPACE[8] }}>
            <RuleSweep theme={t} frame={frame} delay={d + 26} />
          </div>

          {credential && (
            <div
              style={{
                fontFamily: TYPE.sans,
                fontSize: TYPE.body + 3,
                fontWeight: TYPE.weight.medium,
                lineHeight: 1.4,
                color: t.muted,
                maxWidth: 620,
                marginTop: SPACE[6],
                marginLeft: SPACE[8],
                ...fadeUp(frame, { delay: d + 32, dur: 22 }),
              }}
            >
              {credential}
            </div>
          )}
        </div>
      </AbsoluteFill>
      <SourceTag source={source} theme={t} frame={frame} delay={d + 38} />
    </Ground>
  );
};
