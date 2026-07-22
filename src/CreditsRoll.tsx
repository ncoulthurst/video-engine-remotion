/**
 * CreditsRoll — end-of-video attribution / credits card in the paperOrange system.
 *
 * Source tag is bare `[CREDITS ROLL]`, so the defaults must stand on their own:
 * a serif ink title under a short accent rule, then centred credit sections
 * (accent mono-caps headings, ink sans items, muted roles). Short credit lists
 * render as a staggered fade-in, vertically centred; long lists gently roll
 * upward (classic credits scroll) inside a soft-masked window and settle with
 * the final section resting in view.
 *
 * Style rules (see HeroValueChart): orange is the single signal — headings,
 * title rule, nothing else. Body text is ink, roles are muted. Depth is a
 * faint warm vignette + low grain, never heavy black or white glow.
 */
import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import { fontFamily, geistMonoFamily, serifFontFamily, Grain, PALETTES, rgbaFromHex } from "./shared";

// ── Colours: pinned to the light paper-orange palette ────────────────────────
const P = PALETTES.paperOrange;
// Light background → depth must be a faint warm tint, never heavy black.
const VIGNETTE = "radial-gradient(125% 125% at 50% 42%, transparent 62%, rgba(28,26,21,0.06) 100%)";

// ── Canvas + layout geometry (1920×1080) ─────────────────────────────────────
const W = 1920, H = 1080;
const HEADER_TOP = 104;          // header block top
const MASK_TOP = 316;            // credits window top
const MASK_H = 640;              // credits window height
const FADE_PX = 56;              // soft mask fade at window edges (scroll mode)

// Deterministic content metrics (items are short source names — no wrapping)
const HEAD_H = 46;               // section heading row height (incl. margin)
const ITEM_H = 46;               // one credit line
const SECTION_GAP = 58;          // gap between sections
const PX_PER_FRAME = 2;          // scroll speed ≈ 60px/s @ 30fps — gentle

// ── Timing ───────────────────────────────────────────────────────────────────
const TITLE_IN = 8;
const SECTIONS_IN = 26;          // first section starts fading here
const SECTION_STAGGER = 12;
const READ_PAUSE = 46;           // dwell on the opening sections before rolling
const HOLD_TAIL = 110;           // hold after the roll settles

// ── Schema ───────────────────────────────────────────────────────────────────
const CreditSectionSchema = z.object({
  heading: z.string(),
  items: z.array(z.string()).optional().default([]),
});

const DEFAULT_SECTIONS: z.infer<typeof CreditSectionSchema>[] = [
  { heading: "Footage", items: ["Getty Images — archival", "AP Archive — news footage", "Bloomberg Television — broadcast"] },
  { heading: "Data", items: ["FBref", "CoinGecko", "Company filings — SEC EDGAR"] },
  { heading: "Music", items: ["Epidemic Sound — licensed score", "Artlist — additional cues"] },
];

export const CreditsRollPropsSchema = z.object({
  title: z.string().optional().default("Sources & Credits"),
  subtitle: z.string().optional().default(""),
  sections: z.array(CreditSectionSchema).optional().default(DEFAULT_SECTIONS),
  footer: z.string().optional().default("Friction — thanks for watching"),
  accentColor: z.string().optional(),
  bgColor: z.string().optional(),
  skipIntro: z.boolean().optional().default(false),
});
export type CreditsRollProps = z.input<typeof CreditsRollPropsSchema>;

// ── Shared layout arithmetic (component + calculateMetadata) ─────────────────
type SectionIn = { heading: string; items?: string[] };
function measure(sections: SectionIn[]) {
  const n = sections.length;
  const contentH =
    sections.reduce((acc, s) => acc + HEAD_H + (s.items?.length ?? 0) * ITEM_H, 0) +
    Math.max(0, n - 1) * SECTION_GAP;
  const travel = Math.max(0, contentH - (MASK_H - FADE_PX)); // keep the settled end clear of the fade
  const scrollStart = SECTIONS_IN + n * SECTION_STAGGER + READ_PAUSE;
  const scrollFrames = Math.ceil(travel / PX_PER_FRAME);
  return { contentH, travel, scrollStart, scrollFrames };
}

export function calculateMetadata({ props }: { props: CreditsRollProps }) {
  const sections = (props.sections && props.sections.length ? props.sections : DEFAULT_SECTIONS) as SectionIn[];
  const { scrollStart, scrollFrames } = measure(sections);
  return { durationInFrames: Math.max(300, scrollStart + scrollFrames + HOLD_TAIL) };
}

// ── Credit line: "Name — role" renders the role in muted ─────────────────────
const CreditLine: React.FC<{ text: string }> = ({ text }) => {
  const split = text.split(" — ");
  const name = split[0];
  const role = split.slice(1).join(" — ");
  return (
    <div style={{ height: ITEM_H, lineHeight: `${ITEM_H}px`, whiteSpace: "nowrap" }}>
      <span style={{ fontFamily, fontSize: 25, fontWeight: 600, color: P.ink, letterSpacing: 0.1 }}>{name}</span>
      {role && (
        <span style={{ fontFamily, fontSize: 21, fontWeight: 500, color: P.muted, letterSpacing: 0.2 }}>
          {" — "}{role}
        </span>
      )}
    </div>
  );
};

// ── Component ────────────────────────────────────────────────────────────────
export const CreditsRoll: React.FC<CreditsRollProps> = ({
  title = "Sources & Credits",
  subtitle = "",
  sections = DEFAULT_SECTIONS,
  footer = "Friction — thanks for watching",
  accentColor,
  bgColor,
  skipIntro = false,
}) => {
  const frame = useCurrentFrame();

  const accent = accentColor && accentColor !== "#000000" ? accentColor : P.accent;
  const bg = bgColor || P.bg;

  const secs = (sections.length ? sections : DEFAULT_SECTIONS) as SectionIn[];
  const { contentH, travel, scrollStart, scrollFrames } = measure(secs);
  const isScroll = travel > 0;

  // Header entry — soft fade-and-rise
  const titleProg = skipIntro ? 1 : interpolate(frame, [TITLE_IN, TITLE_IN + 24], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic),
  });

  // Roll: dwell on the opening sections, then glide up and settle on the end
  const scrollProg = !isScroll ? 0 : skipIntro ? 1 : interpolate(
    frame, [scrollStart, scrollStart + scrollFrames], [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.sin) },
  );
  const offsetY = isScroll
    ? -travel * scrollProg                 // roll mode: start at window top, settle at the end
    : (MASK_H - contentH) / 2;             // static mode: vertically centre in the window

  const footerProg = skipIntro ? 1 : interpolate(frame, [SECTIONS_IN + 22, SECTIONS_IN + 46], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: bg }}>
      {/* faint warm edge vignette for depth (never heavy black, never a glow) */}
      <AbsoluteFill style={{ background: VIGNETTE, pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none", opacity: 0.35 }}><Grain /></div>

      {/* ── Header: accent rule + serif ink title + mono subtitle ── */}
      <div style={{
        position: "absolute", top: HEADER_TOP, left: 0, right: 0, zIndex: 5,
        display: "flex", flexDirection: "column", alignItems: "center",
        opacity: titleProg, transform: `translateY(${interpolate(titleProg, [0, 1], [-14, 0])}px)`,
      }}>
        <div style={{ width: 64, height: 5, background: accent, borderRadius: 2.5 }} />
        <div style={{
          marginTop: 26, fontFamily: serifFontFamily, fontSize: 62, fontWeight: 900,
          color: P.ink, letterSpacing: -1.5, lineHeight: 1,
        }}>{title}</div>
        {subtitle && (
          <div style={{
            marginTop: 16, fontFamily: geistMonoFamily, fontSize: 17, fontWeight: 500,
            color: P.muted, letterSpacing: 2.5, textTransform: "uppercase",
          }}>{subtitle}</div>
        )}
      </div>

      {/* ── Credits window ── */}
      <div style={{
        position: "absolute", top: MASK_TOP, left: 0, right: 0, height: MASK_H, zIndex: 3,
        overflow: "hidden",
        ...(isScroll ? {
          WebkitMaskImage: `linear-gradient(to bottom, transparent 0, black ${FADE_PX}px, black calc(100% - ${FADE_PX}px), transparent 100%)`,
          maskImage: `linear-gradient(to bottom, transparent 0, black ${FADE_PX}px, black calc(100% - ${FADE_PX}px), transparent 100%)`,
        } : {}),
      }}>
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          gap: SECTION_GAP, transform: `translateY(${offsetY}px)`,
        }}>
          {secs.map((sec, i) => {
            const d = SECTIONS_IN + i * SECTION_STAGGER;
            const op = skipIntro ? 1 : interpolate(frame, [d, d + 22], [0, 1], {
              extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic),
            });
            return (
              <div key={i} style={{
                display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
                opacity: op, transform: `translateY(${interpolate(op, [0, 1], [14, 0])}px)`,
              }}>
                {/* accent mono-caps heading flanked by hairlines */}
                <div style={{ height: HEAD_H, display: "flex", alignItems: "center", gap: 20 }}>
                  <div style={{ width: 48, height: 1, background: P.line }} />
                  <div style={{
                    fontFamily: geistMonoFamily, fontSize: 16, fontWeight: 700,
                    color: accent, letterSpacing: 3.5, textTransform: "uppercase",
                  }}>{sec.heading}</div>
                  <div style={{ width: 48, height: 1, background: P.line }} />
                </div>
                {(sec.items ?? []).map((item, j) => <CreditLine key={j} text={item} />)}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Footer meta line ── */}
      {footer && (
        <div style={{
          position: "absolute", bottom: 54, left: 0, right: 0, zIndex: 5, textAlign: "center",
          fontFamily: geistMonoFamily, fontSize: 13, fontWeight: 500,
          color: rgbaFromHex(P.ink, 0.4), letterSpacing: 3, textTransform: "uppercase",
          opacity: footerProg,
        }}>{footer}</div>
      )}
    </AbsoluteFill>
  );
};
