/**
 * TitleDemoteToLabel — a large title reveals centered, holds, then "demotes"
 * into a small top-left corner label while real content grows in below: a
 * mix of text lines and/or images, each item declared in `items`, not
 * meaningless gray skeleton bars. A domain-agnostic, heavily reusable open.
 *
 * Ported from an OSS product-demo two-scene stitch into ONE reusable scene:
 * the blur+fade reveal, the scale+position demote tween, the staggered
 * content grow-in, and the optional fake text-selection sweep are all
 * preserved; the placeholder blocks are replaced with actual text/image
 * content on GlassCard/theme tokens so it reads as real content in any ground.
 */
import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  Ground,
  GlassCard,
  resolveTheme,
  useOutro,
  prog,
  EASE,
  TITLE_FONT,
  TYPE,
  SPACE,
  RADIUS,
  baseTemplateSchema,
  type BaseTemplateProps,
  type Theme,
} from "./lib/kit";
import { SmartImg } from "./shared";

// each content item below the label is either a plain text line, an explicit
// {text} line, or an {image} card — mix and match in one list.
const DemoteItemSchema = z.union([
  z.string(),
  z.object({ text: z.string() }),
  z.object({ image: z.string() }),
]);
type DemoteItem = z.infer<typeof DemoteItemSchema>;

function isImageItem(item: DemoteItem): item is { image: string } {
  return typeof item === "object" && "image" in item;
}
function itemText(item: DemoteItem): string {
  if (typeof item === "string") return item;
  return "text" in item ? item.text : "";
}

export const TitleDemoteToLabelPropsSchema = z.object({
  ...baseTemplateSchema,
  title: z.string().optional().default("Running Subagents"),
  /** a fake text-selection highlight sweeps across the title just before it demotes. */
  withSelection: z.boolean().optional().default(false),
  /** content that grows in below as the title demotes — text lines and/or
   *  image cards, in any mix and order. */
  items: z
    .array(DemoteItemSchema)
    .optional()
    .default([
      "Reads the task list and picks up where it left off",
      "Spins up a fresh, isolated context window per run",
      "Runs tools in parallel wherever it's safe to do so",
      "Reports back a clean summary without polluting the parent thread",
    ]),
  ground: z.enum(["paper", "ink", "structure"]).optional().default("paper"),
});
export type TitleDemoteToLabelProps = z.input<typeof TitleDemoteToLabelPropsSchema> & BaseTemplateProps;

const MAX_W = 1500;

const ItemStack: React.FC<{ theme: Theme; t: number; items: DemoteItem[] }> = ({ theme, t, items }) => {
  const n = Math.max(1, items.length);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: SPACE[8] }}>
      {items.map((item, i) => {
        // normalised stagger window so the stack grows in cleanly regardless of count.
        const startFrac = n > 1 ? (i / n) * 0.7 : 0;
        const bt = interpolate(t, [startFrac, startFrac + 0.3], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: EASE.out,
        });
        const common: React.CSSProperties = {
          opacity: bt,
          transform: `translateY(${(1 - bt) * 28}px)`,
          boxSizing: "border-box",
        };
        if (isImageItem(item)) {
          return (
            <GlassCard key={i} theme={theme} style={{ ...common, width: MAX_W, height: 300, overflow: "hidden" }}>
              <SmartImg src={item.image} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </GlassCard>
          );
        }
        return (
          <div
            key={i}
            style={{
              ...common,
              maxWidth: MAX_W,
              fontFamily: TYPE.sans,
              fontSize: 32,
              fontWeight: TYPE.weight.medium,
              color: theme.ink,
              lineHeight: 1.35,
              letterSpacing: -0.2,
            }}
          >
            {itemText(item)}
          </div>
        );
      })}
    </div>
  );
};

export const TitleDemoteToLabel: React.FC<TitleDemoteToLabelProps> = ({
  title = "",
  withSelection = false,
  items = [],
  ground = "paper",
  accentColor,
  skipIntro,
  animateOut,
}) => {
  const frame = useCurrentFrame();
  const t = resolveTheme(ground, accentColor);
  const outro = useOutro(animateOut);

  const SEL_ON = 14;
  const SEL_OFF = 32;
  const DEMOTE = withSelection ? 44 : 32;
  const DEMOTE_END = DEMOTE + 20;
  const GROW = DEMOTE + 12;

  const rev = skipIntro ? 1 : prog(frame, 0, 12, EASE.out);
  const dem = skipIntro ? 1 : prog(frame, DEMOTE, DEMOTE_END - DEMOTE, EASE.inOut);
  const scale = interpolate(dem, [0, 1], [1, 0.3]);
  const x = interpolate(dem, [0, 1], [960, 150]);
  const y = interpolate(dem, [0, 1], [480, 110]);
  const growT = skipIntro ? 1 : prog(frame, GROW, 40, EASE.out);

  let selLeft = 0;
  let selWidth = 0;
  if (withSelection && !skipIntro) {
    const on = prog(frame, SEL_ON, 10, Easing.out(Easing.quad));
    const off = prog(frame, SEL_OFF, 8, Easing.in(Easing.quad));
    selLeft = off * 100;
    selWidth = Math.max(0, on * 100 - selLeft);
  }

  return (
    <Ground ground={ground} accentColor={accentColor} skipIntro={skipIntro} texture={false} pad={0}>
      <div style={{ position: "absolute", inset: 0, ...outro }}>
        <div style={{ position: "absolute", left: 150, top: 210 }}>
          <ItemStack theme={t} t={growT} items={items} />
        </div>

        <div
          style={{
            position: "absolute",
            left: x,
            top: y,
            transform: `translate(${-(1 - dem) * 50}%, -50%) scale(${scale})`,
            transformOrigin: "left center",
            opacity: rev,
            filter: `blur(${(1 - rev) * 12}px)`,
          }}
        >
          <div
            style={{
              position: "relative",
              ...TITLE_FONT,
              fontSize: 128,
              color: t.ink,
              letterSpacing: -2,
              whiteSpace: "nowrap",
              padding: "10px 18px",
            }}
          >
            {withSelection && selWidth > 0 && (
              <div
                style={{
                  position: "absolute",
                  left: `${selLeft}%`,
                  top: 8,
                  width: `${selWidth}%`,
                  height: "calc(100% - 16px)",
                  background: t.highlightSoft,
                  borderRadius: RADIUS.sm,
                }}
              />
            )}
            <span style={{ position: "relative" }}>{title}</span>
          </div>
        </div>
      </div>
    </Ground>
  );
};
