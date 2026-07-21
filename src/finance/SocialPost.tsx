/**
 * SocialPost (H4) — a tweet / post as a designed card. The "the tweet that…" beat.
 *
 * Clean post card on Paper (or Ink for a damning one): avatar, author + mono handle,
 * body text that reveals, date, engagement metrics. If pivotal, an accent underline
 * + "this post moved markets" tag. Deleted variant → struck through.
 *
 * SBF: CZ's "we're selling FTT" tweet triggering the bank run; an SBF apology thread.
 * Generalizes: Musk/Tesla — every modern finance story turns on posts.
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { SmartImg } from "../shared";
import {
  Ground,
  Kicker,
  Pill,
  SourceTag,
  resolveTheme,
  useOutro,
  fadeUp,
  wipe,
  rgbaOf,
  TYPE,
  SPACE,
  RADIUS,
  cardShadow,
  baseTemplateSchema,
  type BaseTemplateProps,
} from "./kit";

export const SocialPostPropsSchema = z.object({
  ...baseTemplateSchema,
  author: z.string().optional().default("Changpeng Zhao"),
  handle: z.string().optional().default("@cz_binance"),
  avatar: z.string().optional().default(""),
  text: z.string().optional().default(
    "As part of Binance's exit from FTX equity last year, we received ~$2.1B USD equivalent in cash. Due to recent revelations, we have decided to liquidate any remaining FTT on our books.",
  ),
  date: z.string().optional().default("Nov 6, 2022"),
  likes: z.string().optional().default("212K"),
  reposts: z.string().optional().default("64K"),
  verdict: z.enum(["ignited", "deleted", "none"]).optional().default("ignited"),
  ground: z.enum(["paper", "ink", "structure"]).optional().default("paper"),
});
export type SocialPostProps = z.input<typeof SocialPostPropsSchema> & BaseTemplateProps;

export const SocialPost: React.FC<SocialPostProps> = ({
  author = "",
  handle = "",
  avatar = "",
  text = "",
  date = "",
  likes = "",
  reposts = "",
  verdict = "ignited",
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
  const deleted = verdict === "deleted";
  const cardP = skipIntro ? 1 : wipe(frame, { delay: d + 2, dur: 22 });
  // A real social post is WHITE — dark ink on white, floating on the grainy ground.
  const CARD_BG = "#FFFFFF";
  const CARD_INK = "#15202B";
  const CARD_MUTED = "#536471";
  const CARD_LINE = "rgba(0,0,0,0.10)";

  return (
    <Ground ground={ground} accentColor={accentColor} skipIntro={skipIntro}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: SPACE.page }}>
        <div style={{ width: "100%", maxWidth: 1200, ...outro }}>
          <div style={{ marginBottom: SPACE[8] }}>
            <Kicker label={kicker ?? (verdict === "ignited" ? "The Post That Lit the Fuse" : "On the Record")} theme={t} frame={frame} delay={d} />
          </div>

          <div
            style={{
              background: CARD_BG,
              borderRadius: RADIUS.lg,
              border: `1px solid ${verdict === "ignited" ? t.accent : CARD_LINE}`,
              boxShadow: cardShadow(t),
              padding: SPACE[12],
              opacity: cardP,
              transform: `translateY(${(1 - cardP) * 16}px)`,
            }}
          >
            {/* header */}
            <div style={{ display: "flex", alignItems: "center", gap: SPACE[5] }}>
              <div style={{ width: 76, height: 76, borderRadius: "50%", overflow: "hidden", background: "#EFF3F4", border: `1px solid ${CARD_LINE}`, flexShrink: 0 }}>
                {avatar ? <SmartImg src={avatar} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontFamily: TYPE.sans, fontSize: TYPE.cardTitle, fontWeight: TYPE.weight.bold, color: CARD_INK, letterSpacing: -0.5 }}>{author}</span>
                <span style={{ fontFamily: TYPE.mono, fontSize: TYPE.label, color: CARD_MUTED, letterSpacing: 0.6 }}>{handle}</span>
              </div>
              <div style={{ marginLeft: "auto", fontFamily: TYPE.sans, fontSize: 40, fontWeight: TYPE.weight.black, color: rgbaOf(CARD_INK, 0.85) }}>𝕏</div>
            </div>

            {/* body */}
            <div
              style={{
                fontFamily: TYPE.sans,
                fontSize: 38,
                fontWeight: TYPE.weight.medium,
                lineHeight: 1.4,
                color: CARD_INK,
                marginTop: SPACE[8],
                textDecoration: deleted ? "line-through" : "none",
                opacity: deleted ? 0.55 : 1,
                ...fadeUp(frame, { delay: d + 12, dur: 26 }),
              }}
            >
              {text}
            </div>

            {/* footer */}
            <div style={{ display: "flex", alignItems: "center", gap: SPACE[8], marginTop: SPACE[10], paddingTop: SPACE[6], borderTop: `1px solid ${CARD_LINE}`, ...fadeUp(frame, { delay: d + 22, dur: 20 }) }}>
              <span style={{ fontFamily: TYPE.mono, fontSize: TYPE.label, color: CARD_MUTED, letterSpacing: 0.8 }}>{date}</span>
              <span style={{ fontFamily: TYPE.mono, fontSize: TYPE.label, color: CARD_MUTED }}>
                <b style={{ color: CARD_INK }}>{reposts}</b> Reposts
              </span>
              <span style={{ fontFamily: TYPE.mono, fontSize: TYPE.label, color: CARD_MUTED }}>
                <b style={{ color: CARD_INK }}>{likes}</b> Likes
              </span>
            </div>
          </div>

          {verdict !== "none" && (
            <div style={{ marginTop: SPACE[6], display: "flex", justifyContent: "flex-end", opacity: wipe(frame, { delay: d + 30, dur: 16 }) }}>
              <Pill theme={t} filled>{verdict === "ignited" ? "This post moved markets" : "Later deleted"}</Pill>
            </div>
          )}
        </div>
      </AbsoluteFill>
      <SourceTag source={source} theme={t} frame={frame} delay={d + 34} />
    </Ground>
  );
};
