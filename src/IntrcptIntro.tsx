/**
 * IntrcptIntro — Channel intro card.
 * Style: full-bleed warm paper, large bold serif channel name, light subtitle.
 * Animation: typewriter character-by-character reveal with blinking cursor.
 *
 * In Remotion Studio (when sideImage is set):
 * - Drag the image to reposition (sideImageX / sideImageY)
 * - Scroll on the image to resize (sideImageScale)
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { AbsoluteFill, getRemotionEnvironment, useCurrentFrame } from "remotion";
import { z } from "zod";
import { fontFamily, serifFontFamily, Grain, PaperBackground, SmartImg } from "./shared";

const CHANNEL_NAME = "Frequency";
const H = 720;

export const IntrcptIntroPropsSchema = z.object({
  subtitle:       z.string().optional().default("the science of football"),
  bgColor:        z.string().optional().default("#f0ece4"),
  sideImage:      z.string().optional(),
  /** Horizontal anchor % — drag in Studio to reposition. */
  sideImageX:     z.number().optional().default(72),
  /** Vertical anchor % — 100 = bottom of frame. */
  sideImageY:     z.number().optional().default(100),
  /** Scale multiplier — scroll in Studio to resize. */
  sideImageScale: z.number().optional().default(1),
});
export type IntrcptIntroProps = z.infer<typeof IntrcptIntroPropsSchema>;

const TITLE_FPC         = 3;
const SUB_FPC           = 2;
const TITLE_START       = 12;
const PAUSE_AFTER_TITLE = 20;

// ── Studio prop pusher ────────────────────────────────────────────────────────
function pushStudioProps(updates: Partial<IntrcptIntroProps>) {
  try {
    (import("remotion") as Promise<any>).then(({ Internals }) => {
      const store = Internals?.editorPropsProviderRef?.current;
      if (!store) return;
      store.setProps((prev: Record<string, Record<string, unknown>>) => ({
        ...prev,
        IntrcptIntro: { ...(prev["IntrcptIntro"] ?? {}), ...updates },
      }));
      window.dispatchEvent(
        new CustomEvent(
          Internals.PROPS_UPDATED_EXTERNALLY ?? "remotion.propsUpdatedExternally",
          { detail: { resetUnsaved: null } },
        ),
      );
    });
  } catch (_) { /* not in studio */ }
}

// ── Mask helpers (same pattern as Thumbnail) ──────────────────────────────────
const BOTTOM_FADE = "linear-gradient(to top, transparent 0%, rgba(0,0,0,0.55) 7%, black 16%, black 100%)";

function sideMask(leftFade = 0) {
  if (leftFade <= 0) {
    return { WebkitMaskImage: BOTTOM_FADE, maskImage: BOTTOM_FADE };
  }
  const leftGrad = `linear-gradient(to right, transparent 0%, black ${leftFade}%, black 100%)`;
  return {
    WebkitMaskImage:     `${leftGrad}, ${BOTTOM_FADE}`,
    maskImage:           `${leftGrad}, ${BOTTOM_FADE}`,
    WebkitMaskComposite: "destination-in" as const,
    maskComposite:       "intersect"      as const,
  };
}

// ── Side image layers ─────────────────────────────────────────────────────────
function SideImageLayers({ src, cx, cy, scale, grabbing }: {
  src: string; cx: number; cy: number; scale: number; grabbing: boolean;
}) {
  const imgH = H * 0.86 * scale;
  const imgW = imgH * 0.85;

  const smearFilter = "brightness(0.75) saturate(0.5)";
  const smearLayers = [
    { dx: -70, opacity: 0.18, blur: 22, leftFade: 62 },
    { dx: -38, opacity: 0.30, blur: 12, leftFade: 38 },
    { dx: -16, opacity: 0.42, blur:  5, leftFade: 18 },
  ];

  return (
    <>
      {/* Smear ghost layers behind the sharp image */}
      {smearLayers.map(({ dx, opacity, blur, leftFade }, i) => (
        <div key={i} style={{
          position: "absolute",
          left: `${cx}%`, top: `${cy}%`,
          transform: `translate(calc(-50% + ${dx}px), -100%)`,
          width: imgW, height: imgH,
          opacity,
          pointerEvents: "none",
          ...sideMask(leftFade),
        }}>
          <SmartImg src={src} style={{
            width: "100%", height: "100%",
            objectFit: "contain", objectPosition: "bottom center",
            filter: `${smearFilter} blur(${blur}px)`,
          }} />
        </div>
      ))}

      {/* Sharp image — same anchor pattern as Thumbnail's PlayerImg */}
      <div style={{
        position: "absolute",
        left: `${cx}%`, top: `${cy}%`,
        transform: "translate(-50%, -100%)",
        width: imgW, height: imgH,
        cursor: grabbing ? "grabbing" : "grab",
        ...sideMask(0),
      }}>
        <SmartImg src={src} style={{
          width: "100%", height: "100%",
          objectFit: "contain", objectPosition: "bottom center",
        }} />
      </div>
    </>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export const IntrcptIntro: React.FC<IntrcptIntroProps> = ({
  subtitle,
  bgColor,
  sideImage,
  sideImageX     = 72,
  sideImageY     = 100,
  sideImageScale = 1,
}) => {
  const frame = useCurrentFrame();
  const { isStudio } = getRemotionEnvironment();
  const frameRef = useRef<HTMLDivElement>(null);

  const titleCharsVisible = Math.max(0, Math.floor((frame - TITLE_START) / TITLE_FPC));
  const titleDone         = titleCharsVisible >= CHANNEL_NAME.length;
  const titleDoneFrame    = TITLE_START + CHANNEL_NAME.length * TITLE_FPC;
  const visibleTitle      = CHANNEL_NAME.slice(0, titleCharsVisible);
  const SUBTITLE_START    = titleDoneFrame + PAUSE_AFTER_TITLE;
  const subCharsVisible   = Math.max(0, Math.floor((frame - SUBTITLE_START) / SUB_FPC));
  const subtitleDone      = subCharsVisible >= subtitle.length;
  const visibleSubtitle   = subtitle.slice(0, subCharsVisible);
  const cursorBlink       = Math.floor(frame / 14) % 2 === 0;
  const titleCursorOn     = !titleDone;
  const subCursorOn       = titleDone && (!subtitleDone || cursorBlink);

  // ── Drag ─────────────────────────────────────────────────────────────────
  type DragState = { startMX: number; startMY: number; startCX: number; startCY: number } | null;
  const [drag, setDrag] = useState<DragState>(null);
  const [live, setLive] = useState<{ cx: number; cy: number } | null>(null);

  const startDrag = useCallback(
    (e: React.MouseEvent) => {
      if (!isStudio) return;
      e.preventDefault(); e.stopPropagation();
      setDrag({ startMX: e.clientX, startMY: e.clientY, startCX: sideImageX, startCY: sideImageY });
    },
    [isStudio, sideImageX, sideImageY],
  );

  const onScroll = useCallback(
    (e: React.WheelEvent) => {
      if (!isStudio) return;
      e.stopPropagation();
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      pushStudioProps({ sideImageScale: Math.round(Math.max(0.3, Math.min(3.0, sideImageScale + delta)) * 100) / 100 });
    },
    [isStudio, sideImageScale],
  );

  useEffect(() => {
    if (!drag) return;
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect) return;
    const { startMX, startMY, startCX, startCY } = drag;
    const toPercent = (e: MouseEvent) => ({
      nx: Math.round(Math.max(0, Math.min(100, startCX + ((e.clientX - startMX) / rect.width)  * 100))),
      ny: Math.round(Math.max(0, Math.min(100, startCY + ((e.clientY - startMY) / rect.height) * 100))),
    });
    const onMove = (e: MouseEvent) => { const { nx, ny } = toPercent(e); setLive({ cx: nx, cy: ny }); };
    const onUp   = (e: MouseEvent) => {
      const { nx, ny } = toPercent(e);
      pushStudioProps({ sideImageX: nx, sideImageY: ny });
      setLive(null); setDrag(null);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup",   onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup",   onUp);
    };
  }, [drag]);

  const cx = live?.cx ?? sideImageX;
  const cy = live?.cy ?? sideImageY;

  return (
    <AbsoluteFill>
      <div ref={frameRef} style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />
      <PaperBackground color={bgColor} />
      <Grain />

      {sideImage && (
        <div
          style={{ position: "absolute", inset: 0, pointerEvents: isStudio ? "auto" : "none" }}
          onMouseDown={isStudio ? startDrag : undefined}
          onWheel={isStudio ? onScroll : undefined}
        >
          <SideImageLayers
            src={sideImage} cx={cx} cy={cy}
            scale={sideImageScale} grabbing={!!drag}
          />
        </div>
      )}

      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, pointerEvents: "none" }}>
        <div style={{ fontFamily: serifFontFamily, fontSize: 108, fontWeight: 900, color: "#1660FF", letterSpacing: -3, lineHeight: 1, minHeight: "1.1em" }}>
          {visibleTitle}
          {titleCursorOn && <span style={{ display: "inline-block", width: "0.06em", backgroundColor: "#1660FF", marginLeft: "0.04em", verticalAlign: "middle", height: "0.88em", position: "relative", top: "-0.04em" }} />}
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
