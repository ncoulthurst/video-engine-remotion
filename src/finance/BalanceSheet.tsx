/**
 * BalanceSheet / LedgerCard (F4) — claimed vs real, solvent vs insolvent.
 *
 * Not a static ledger — a scene that PROVES insolvency over six beats (§0, §1A
 * Claim → Proof → Consequence):
 *   1. Establish   — the books, on ink, a ghosted verdict looming behind.
 *   2. Build       — the "claimed" assets stack up (one dominant, illiquid token).
 *   3. Turn        — what's OWED reveals, towering over the assets.
 *   4. Push-in     — the camera settles on the shortfall; everything else recedes.
 *   5. Annotate    — the gap is named: THE HOLE.
 *   6. Verdict     — INSOLVENT stamps; the scene rests.
 *
 * SBF: "a facade of stability masking deep insolvency." Generalizes: Enron, Lehman,
 * Theranos — any solvency story.
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  Ground,
  Kicker,
  SourceTag,
  AnimatedCounter,
  resolveTheme,
  useOutro,
  fadeUp,
  wipe,
  scaleSettle,
  focusPush,
  dimAt,
  pulseAt,
  stagger,
  parseStat,
  rgbaOf,
  lift,
  ACCENTS,
  TITLE_FONT,
  TYPE,
  SPACE,
  RADIUS,
  type Theme,
  baseTemplateSchema,
  type BaseTemplateProps,
} from "./kit";

const LineSchema = z.object({ label: z.string(), value: z.string(), featured: z.boolean().optional() });

export const BalanceSheetPropsSchema = z.object({
  ...baseTemplateSchema,
  title: z.string().optional().default("Alameda's Books"),
  assets: z.array(LineSchema).optional().default([
    { label: "FTT (own token, illiquid)", value: "$5.8B", featured: true },
    { label: "Venture positions", value: "$2.1B" },
    { label: "Cash & liquid", value: "$0.9B" },
  ]),
  liabilities: z.array(LineSchema).optional().default([
    { label: "Customer deposits owed", value: "$11.3B", featured: true },
    { label: "Lender obligations", value: "$1.4B" },
  ]),
  verdict: z.enum(["solvent", "insolvent", "none"]).optional().default("insolvent"),
  // Paper ground: the books read as a real ledger page, not a dark drama card.
  ground: z.enum(["paper", "ink", "structure"]).optional().default("paper"),
  // "Red ink" — oxblood is the fitting accent for insolvency, not brand orange.
  accentColor: z.string().optional().default(ACCENTS.loss),
  // Optional background hex override (defaults to the warm paper ground).
  bgColor: z.string().optional(),
  // Optional text-colour overrides.
  inkColor: z.string().optional(),
  mutedColor: z.string().optional(),
});
export type BalanceSheetProps = z.input<typeof BalanceSheetPropsSchema> & BaseTemplateProps;

const parseVal = (s: string) => parseStat(s).num ?? 0;
// Lighter cream shades so each segment reads as a clearly-lit block (the old
// values were too translucent → pale-blue bars that swallowed the dark labels).
const shades = [0.5, 0.4, 0.3, 0.22];

// A stacked, bottom-anchored bar that builds segment-by-segment.
const StackBar: React.FC<{
  rows: { label: string; value: string; featured?: boolean }[];
  scale: (v: number) => number;
  theme: Theme;
  frame: number;
  baseDelay: number;
  skip?: boolean;
  width: number;
  /** allow the featured segment to take the accent (only ONE tower should — §0 law 2). */
  accentFeatured?: boolean;
}> = ({ rows, scale, theme, frame, baseDelay, skip, width, accentFeatured = true }) => {
  return (
    <div style={{ width, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 4 }}>
      {rows.map((r, i) => {
        const delay = baseDelay + stagger(i, 10);
        const grow = skip ? 1 : wipe(frame, { delay, dur: 24 });
        const h = scale(parseVal(r.value));
        const isAccent = r.featured && accentFeatured;
        const shadeIdx = r.featured ? 0 : Math.min(shades.length - 1, i);
        const col = isAccent ? theme.accent : rgbaOf(theme.ink, shades[shadeIdx]);
        // Accent bar → cream text. Cream bars → a strong DARK ink (a deep shade of the
        // ground hue), not the mid-tone bg — so the value pops on the light segment.
        const labelColor = isAccent ? "#ffffff" : lift(theme.bg, -0.62, 0.95);
        return (
          <div
            key={i}
            style={{
              height: h * grow,
              background: col,
              borderRadius: i === 0 ? `${RADIUS.sm}px ${RADIUS.sm}px 0 0` : 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {grow > 0.7 && h > 60 && (
              <span style={{ fontFamily: TYPE.sans, fontSize: 46, fontWeight: TYPE.weight.black, color: labelColor, opacity: (grow - 0.7) / 0.3 }}>
                {r.value}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export const BalanceSheet: React.FC<BalanceSheetProps> = ({
  title = "",
  assets = [],
  liabilities = [],
  verdict = "insolvent",
  ground = "paper",
  accentColor = ACCENTS.loss,
  bgColor,
  inkColor,
  mutedColor,
  kicker,
  source,
  skipIntro,
  animateOut,
}) => {
  const frame = useCurrentFrame();
  const t = resolveTheme(ground, accentColor, bgColor, inkColor, mutedColor);
  const outro = useOutro(animateOut);
  const d = skipIntro ? -999 : 0;

  const assetsTotal = assets.reduce((s, a) => s + parseVal(a.value), 0);
  const liabTotal = liabilities.reduce((s, a) => s + parseVal(a.value), 0);
  const maxT = Math.max(assetsTotal, liabTotal, 1);
  const Hbar = 760;
  const scale = (v: number) => (v / maxT) * Hbar * 0.82;
  const hole = Math.max(0, liabTotal - assetsTotal);
  const holePx = scale(liabTotal) - scale(assetsTotal);

  // Beats
  const bAssets = d + 34;
  const bLiab = d + 78;
  const bPush = d + 128;
  const bHole = d + 140;
  const bStamp = d + 176;

  // Beat 4: camera settles on the shortfall (right side), everything else recedes.
  // Gentle push (title stays framed, never clipped mid-glyph) + a deep recede so the
  // left column reads as an intentional ghost, not half-cut text.
  const push = skipIntro ? {} : focusPush(frame, { delay: bPush, dur: 40, to: 1.03, ox: 50, oy: 50 });
  const recede = skipIntro ? 1 : dimAt(frame, bPush + 6, 0.12, 20);

  return (
    <Ground ground={ground} accentColor={accentColor} skipIntro={skipIntro} bgColor={bgColor} inkColor={inkColor} mutedColor={mutedColor} focus={{ x: 0.62, y: 0.42 }}>
      <AbsoluteFill style={{ padding: SPACE.page, ...outro }}>
        <div style={{ display: "flex", height: "100%", gap: SPACE[16], alignItems: "stretch", ...push }}>
          {/* Left — context column */}
          <div style={{ flex: "0 0 33%", display: "flex", flexDirection: "column", justifyContent: "center", opacity: recede }}>
            <Kicker label={kicker ?? "Reported vs Real"} theme={t} frame={frame} delay={d} />
            <div style={{ overflow: "hidden", paddingBottom: 8, marginTop: SPACE[6] }}>
              <div style={{ ...TITLE_FONT, fontSize: 116, lineHeight: 0.96, letterSpacing: -1.5, color: t.ink, transform: `translateY(${(1 - wipe(frame, { delay: d + 4, dur: 26 })) * 120}px)` }}>
                {title}
              </div>
            </div>
            <div style={{ fontFamily: TYPE.sans, fontSize: 28, fontWeight: TYPE.weight.regular, lineHeight: 1.4, color: t.muted, maxWidth: 520, marginTop: SPACE[8], ...fadeUp(frame, { delay: d + 14, dur: 22 }) }}>
              A facade of stability — until you weigh what was owned against what was owed.
            </div>
          </div>

          {/* Right — the two towers + the hole. Towers pushed left so the hole
              callout has guaranteed room in the gutter and never clips the frame. */}
          <div style={{ flex: 1, display: "flex", alignItems: "flex-end", justifyContent: "flex-start", gap: SPACE[20], paddingLeft: SPACE[10], paddingBottom: SPACE[10], position: "relative" }}>
            {/* Assets tower */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: SPACE[5], opacity: recede }}>
              <StackBar rows={assets} scale={scale} theme={t} frame={frame} baseDelay={bAssets} skip={skipIntro} width={264} accentFeatured={false} />
              <div style={{ fontFamily: TYPE.mono, fontSize: TYPE.label, letterSpacing: TYPE.track, textTransform: "uppercase", color: t.muted, ...fadeUp(frame, { delay: bAssets, dur: 16 }) }}>
                Assets — claimed
              </div>
            </div>

            {/* Liabilities tower (position:relative so the hole anchors to it, not the frame) */}
            <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: SPACE[5], transform: `scale(${skipIntro ? 1 : pulseAt(frame, bLiab + 24, 0.03, 26)})` }}>
              <StackBar rows={liabilities} scale={scale} theme={t} frame={frame} baseDelay={bLiab} skip={skipIntro} width={264} />
              <div style={{ fontFamily: TYPE.mono, fontSize: TYPE.label, letterSpacing: TYPE.track, textTransform: "uppercase", color: "#FFFFFF", fontWeight: TYPE.weight.bold, ...fadeUp(frame, { delay: bLiab, dur: 16 }) }}>
                Owed
              </div>

              {/* THE HOLE — bracket + label spanning the uncovered top of the OWED tower */}
              {hole > 0 && verdict === "insolvent" && (
                <div
                  style={{
                    position: "absolute",
                    left: "100%",
                    top: 0,
                    marginLeft: SPACE[6],
                    height: holePx,
                    display: "flex",
                    alignItems: "center",
                    gap: SPACE[4],
                    opacity: wipe(frame, { delay: bHole, dur: 20 }),
                  }}
                >
                  <div style={{ width: 4, height: holePx * wipe(frame, { delay: bHole, dur: 22 }), background: t.accent, borderRadius: 2 }} />
                  <div style={{ transform: `translateX(${(1 - wipe(frame, { delay: bHole + 8, dur: 16 })) * -10}px)`, whiteSpace: "nowrap" }}>
                    <div style={{ fontFamily: TYPE.mono, fontSize: 18, letterSpacing: 2.5, textTransform: "uppercase", color: "#FFFFFF" }}>The hole</div>
                    <div style={{ fontFamily: TYPE.sans, fontSize: 88, fontWeight: TYPE.weight.black, letterSpacing: -2.5, color: t.accent, lineHeight: 1 }}>
                      <AnimatedCounter value={`$${hole.toFixed(1)}B`} delay={bHole + 6} skip={skipIntro} frame={frame} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </AbsoluteFill>

      <SourceTag source={source} theme={t} frame={frame} delay={bStamp + 8} />
    </Ground>
  );
};
