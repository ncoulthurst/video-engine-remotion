/**
 * Thumbnail — CTR-optimised YouTube thumbnail. 1280×720 still.
 *
 * In Remotion Studio:
 * - Drag player images to reposition (imageAX/Y, imageBX/Y)
 * - Scroll on an image to resize (imageAScale / imageBScale)
 * - Drag the text block to reposition (textX/textY)
 * - Scroll on the text block to resize (textScale)
 * - Drag arrow endpoints when showArrow is true
 * All changes sync back to the Studio props panel.
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { AbsoluteFill, getRemotionEnvironment } from "remotion";
import { z } from "zod";
import { fontFamily, serifFontFamily, PaperBackground, Grain, SmartImg } from "./shared";

const W = 1280;
const H = 720;

// ── Schema ───────────────────────────────────────────────────────────────────

export const ThumbnailPropsSchema = z.object({
  hookLine:    z.string().default("the **genius**\nof Suárez"),
  subNote:     z.string().default(""),
  statLine:    z.string().default(""),

  imageA:      z.string().default("suarez"),
  imageAX:     z.number().default(68),
  imageAY:     z.number().default(100),
  imageAScale: z.number().default(1),

  imageB:      z.string().default(""),
  imageBX:     z.number().default(22),
  imageBY:     z.number().default(100),
  imageBScale: z.number().default(0.85),

  calloutText: z.string().default(""),
  calloutX:    z.number().default(72),
  calloutY:    z.number().default(55),

  bgStyle:     z.enum(["light", "dark", "paper"]).default("light"),
  bgColor:     z.string().default("#ffffff"),
  boldColor:   z.string().default("#C8102E"),

  showArrow:   z.boolean().default(false),
  arrowColor:  z.string().default("#D0021B"),
  arrowX1:     z.number().default(560),
  arrowY1:     z.number().default(350),
  arrowX2:     z.number().default(720),
  arrowY2:     z.number().default(500),

  /**
   * Layout preset.
   * top-text    — hook text top-left, image right
   * split-right — text left half, image right half
   * split-left  — text right half, image left half
   * center      — text centered, images flanking left + right
   */
  layout:      z.enum(["top-text", "split-right", "split-left", "center"]).default("top-text"),

  /**
   * Visual effect per player image.
   * "none"   — no effect
   * "speed"  — blue motion-blur trail (left offset ghosts)
   * "glow"   — warm colour aura / halo
   * "chrome" — chromatic aberration (red/cyan RGB split)
   * "heat"   — red/orange ember trail (right offset)
   * NOTE: images need transparent backgrounds (cutout PNGs) for best results.
   */
  imageAEffect: z.enum(["none", "speed", "glow", "chrome", "heat"]).default("none"),
  imageBEffect: z.enum(["none", "speed", "glow", "chrome", "heat"]).default("none"),

  /**
   * Floating stat badge — big number with a label (e.g. "31 / Goals").
   * Leave statBadge empty to hide it. Drag in Studio to reposition.
   */
  statBadge:      z.string().default(""),
  statBadgeLabel: z.string().default(""),
  statBadgeX:     z.number().default(14),
  statBadgeY:     z.number().default(50),

  /**
   * Manual text position overrides (% of frame).
   * -1 = use the layout preset default.
   * Drag the text block in Studio to set these.
   */
  textX:       z.number().default(-1),
  textY:       z.number().default(-1),
  /** Text scale multiplier. Scroll the text block in Studio to adjust. */
  textScale:   z.number().default(1),
  /**
   * Text block width as % of frame (e.g. 40 = 512px).
   * -1 = use the layout preset default.
   */
  textWidth:   z.number().default(-1),
});

export type ThumbnailProps = z.infer<typeof ThumbnailPropsSchema>;

// ── Studio prop updater ───────────────────────────────────────────────────────
function pushStudioProps(updates: Partial<ThumbnailProps>) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (import("remotion") as Promise<any>).then(({ Internals }) => {
      const store = Internals?.editorPropsProviderRef?.current;
      if (!store) return;
      store.setProps((prev: Record<string, Record<string, unknown>>) => ({
        ...prev,
        Thumbnail: { ...(prev["Thumbnail"] ?? {}), ...updates },
      }));
      window.dispatchEvent(
        new CustomEvent(Internals.PROPS_UPDATED_EXTERNALLY ?? "remotion.propsUpdatedExternally", {
          detail: { resetUnsaved: null },
        }),
      );
    });
  } catch (_) { /* not in studio */ }
}

// ── Hook parser ───────────────────────────────────────────────────────────────
function parseHook(raw: string): Array<{ text: string; bold: boolean }> {
  const parts: Array<{ text: string; bold: boolean }> = [];
  const re = /\*\*(.*?)\*\*/g;
  let last = 0, m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    if (m.index > last) parts.push({ text: raw.slice(last, m.index), bold: false });
    parts.push({ text: m[1], bold: true });
    last = m.index + m[0].length;
  }
  if (last < raw.length) parts.push({ text: raw.slice(last), bold: false });
  return parts;
}

// ── Arrow ─────────────────────────────────────────────────────────────────────
function Arrow({ x1, y1, x2, y2, color }: {
  x1: number; y1: number; x2: number; y2: number; color: string;
}) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;

  const curve = Math.min(len * 0.28, 100);
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const qx = mx - (dy / len) * curve;
  const qy = my + (dx / len) * curve;

  const tx = x2 - qx, ty = y2 - qy;
  const tl = Math.sqrt(tx * tx + ty * ty) || 1;
  const ux = tx / tl, uy = ty / tl;
  const hl = 30, hw = 13;

  const pathEndX = x2 - ux * (hl * 0.6);
  const pathEndY = y2 - uy * (hl * 0.6);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{
      position: "absolute", inset: 0,
      width: "100%", height: "100%",
      pointerEvents: "none", zIndex: 30, overflow: "hidden",
    }}>
      <path
        d={`M ${x1} ${y1} Q ${qx} ${qy} ${pathEndX} ${pathEndY}`}
        fill="none" stroke={color} strokeWidth={5} strokeLinecap="round"
      />
      <polygon
        points={[
          `${x2},${y2}`,
          `${x2 - ux * hl - uy * hw},${y2 - uy * hl + ux * hw}`,
          `${x2 - ux * hl + uy * hw},${y2 - uy * hl - ux * hw}`,
        ].join(" ")}
        fill={color}
      />
    </svg>
  );
}

// ── Effect ghost layers ───────────────────────────────────────────────────────
type PlayerEffect = "none" | "speed" | "glow" | "chrome" | "heat";

type GhostLayer = {
  dx: number; dy?: number;
  scaleX?: number; scaleY?: number;
  opacity: number;
  blur: number;
  filter: string;
  blend?: React.CSSProperties["mixBlendMode"];
  // left-edge fade start % (0 = full left fade, 100 = no left fade)
  leftFade?: number;
};

// leftFade: % of container width at which the image becomes fully opaque from left edge.
// 0 = no left fade. 60 = fades from transparent at 0% to opaque at 60%.
function ghostMask(leftFade = 0) {
  const bottomGrad = "linear-gradient(to top, transparent 0%, rgba(0,0,0,0.55) 8%, black 18%, black 100%)";
  if (leftFade <= 0) {
    return { WebkitMaskImage: bottomGrad, maskImage: bottomGrad };
  }
  const leftGrad = `linear-gradient(to right, transparent 0%, black ${leftFade}%, black 100%)`;
  return {
    WebkitMaskImage: `${leftGrad}, ${bottomGrad}`,
    maskImage:       `${leftGrad}, ${bottomGrad}`,
    WebkitMaskComposite: "destination-in" as const,
    maskComposite:       "intersect" as const,
  };
}

function EffectLayers({ src, cx, cy, scale, zIndex = 10, effect, bgStyle }: {
  src: string; cx: number; cy: number; scale: number;
  zIndex?: number; effect: PlayerEffect; bgStyle: string;
}) {
  const baseH = H * 0.68;
  const imgH  = baseH * scale;
  const imgW  = imgH * 1.1;

  const isDark = bgStyle === "dark";

  const layers: GhostLayer[] = (() => {
    switch (effect) {
      case "speed": {
        // screen blend: on light bg the white areas of non-transparent images disappear;
        // on dark bg the blue glows brightly. Best with transparent-bg (cutout) PNGs.
        const f = "brightness(0.65) saturate(0) sepia(1) saturate(7) hue-rotate(215deg)";
        return [
          { dx: -80, opacity: 0.16, blur: 20, filter: f, blend: "screen" as const, leftFade: 65 },
          { dx: -45, opacity: 0.28, blur: 11, filter: f, blend: "screen" as const, leftFade: 40 },
          { dx: -18, opacity: 0.42, blur:  5, filter: f, blend: "screen" as const, leftFade: 18 },
        ];
      }
      case "glow": {
        const color = isDark ? "hue-rotate(35deg)" : "hue-rotate(15deg)";
        return [
          { dx: 0, opacity: 0.55, blur: 55, filter: `brightness(1.8) saturate(2.5) ${color}`,
            blend: "screen", scaleX: 1.18, scaleY: 1.12 },
          { dx: 0, opacity: 0.30, blur: 25, filter: `brightness(1.4) saturate(3) ${color}`,
            blend: "screen", scaleX: 1.06, scaleY: 1.03 },
        ];
      }
      case "chrome": {
        // Red channel right, cyan channel left — classic chromatic aberration
        const red  = "saturate(0) sepia(1) saturate(7) hue-rotate(-10deg) brightness(0.85)";
        const cyan = "saturate(0) sepia(1) saturate(7) hue-rotate(175deg) brightness(0.85)";
        return [
          { dx:  10, dy: -4, opacity: 0.50, blur: 0, filter: red,  blend: "screen" },
          { dx: -10, dy:  4, opacity: 0.50, blur: 0, filter: cyan, blend: "screen" },
        ];
      }
      case "heat": {
        // Warm ember glow — red/orange aura, offset right (mirror of speed)
        const f = "brightness(0.75) saturate(0) sepia(1) saturate(8) hue-rotate(-15deg)";
        // rightFade via scaleX trick: mirror leftFade by inverting the gradient direction
        return [
          { dx:  20, opacity: 0.16, blur: 22, filter: f, blend: "screen" as const },
          { dx:   5, opacity: 0.28, blur: 13, filter: f, blend: "screen" as const },
          { dx:  -5, opacity: 0.40, blur:  6, filter: f, blend: "screen" as const },
        ];
      }
      default: return [];
    }
  })();

  return (
    <>
      {layers.map(({ dx, dy = 0, scaleX = 1, scaleY = 1, opacity, blur, filter, blend, leftFade = 100 }, i) => (
        <div key={i} style={{
          position: "absolute",
          left: `${cx}%`, top: `${cy}%`,
          transform: `translate(calc(-50% + ${dx}px), calc(-100% + ${dy}px))`,
          width: imgW * scaleX, height: imgH * scaleY,
          zIndex: zIndex - 1,
          opacity,
          pointerEvents: "none",
          mixBlendMode: blend,
          ...ghostMask(leftFade),
        }}>
          <SmartImg src={src} style={{
            width: "100%", height: "100%",
            objectFit: "contain", objectPosition: "bottom center",
            filter: blur > 0 ? `${filter} blur(${blur}px)` : filter,
          }} />
        </div>
      ))}
    </>
  );
}

// ── Player image — pure layout, no hooks ─────────────────────────────────────
function PlayerImg({ src, cx, cy, scale, zIndex = 10, grabbing = false, effect = "none" }: {
  src: string; cx: number; cy: number; scale: number;
  zIndex?: number; grabbing?: boolean; effect?: PlayerEffect;
}) {
  const baseH = H * 0.68;
  const imgH  = baseH * scale;
  const imgW  = imgH * 1.1;

  // No drop-shadow here — it creates a visible rectangle on non-transparent images.
  // Glow effect comes entirely from the EffectLayers ghost behind the main image.
  const mainFilter = {
    speed:  "contrast(1.08) brightness(1.04)",
    glow:   "contrast(1.05) brightness(1.08)",
    chrome: "contrast(1.10) brightness(1.02)",
    heat:   "contrast(1.08) brightness(1.04)",
    none:   "contrast(1.06) brightness(1.02)",
  }[effect] ?? "contrast(1.06) brightness(1.02)";

  return (
    <div style={{
      position: "absolute",
      left: `${cx}%`, top: `${cy}%`,
      transform: "translate(-50%, -100%)",
      width: imgW, height: imgH, zIndex,
      cursor: grabbing ? "grabbing" : "grab",
      WebkitMaskImage: "linear-gradient(to top, transparent 0%, rgba(0,0,0,0.6) 7%, black 16%, black 100%)",
      maskImage:       "linear-gradient(to top, transparent 0%, rgba(0,0,0,0.6) 7%, black 16%, black 100%)",
    }}>
      <SmartImg src={src} style={{
        width: "100%", height: "100%",
        objectFit: "contain", objectPosition: "bottom center",
        filter: mainFilter,
      }} />
    </div>
  );
}

// ── Background ────────────────────────────────────────────────────────────────
function Background({ bgStyle, bgColor }: { bgStyle: string; bgColor: string }) {
  if (bgStyle === "paper") return <><PaperBackground color={bgColor || "#f0ece4"} /><Grain /></>;
  if (bgStyle === "dark") {
    const c = bgColor !== "#ffffff" ? bgColor : "#0d0d0d";
    return <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 40% 50%, ${c}ee 0%, #050505 100%)` }} />;
  }
  const c = bgColor !== "#ffffff" ? bgColor : "#ffffff";
  return <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 48% 40%, ${c} 0%, #d8d4ce 100%)` }} />;
}

// ── Drag targets ─────────────────────────────────────────────────────────────
type DragTarget = {
  kind: "imgA" | "imgB" | "text" | "stat";
  startMX: number; startMY: number;
  startCX: number; startCY: number;
};

// ── Component ─────────────────────────────────────────────────────────────────

export const Thumbnail: React.FC<ThumbnailProps> = (props) => {
  const {
    hookLine, subNote, statLine,
    imageA, imageAX, imageAY, imageAScale,
    imageB, imageBX, imageBY, imageBScale,
    calloutText, calloutX, calloutY,
    bgStyle, bgColor, boldColor,
    showArrow, arrowColor, arrowX1, arrowY1, arrowX2, arrowY2,
    layout, textX, textY, textScale, textWidth,
    imageAEffect, imageBEffect,
    statBadge, statBadgeLabel, statBadgeX, statBadgeY,
  } = props;

  const { isStudio } = getRemotionEnvironment();

  const frameRef = useRef<HTMLDivElement>(null);
  const [drag,     setDrag]    = useState<DragTarget | null>(null);
  const [liveA,    setLiveA]   = useState<{ cx: number; cy: number } | null>(null);
  const [liveB,    setLiveB]   = useState<{ cx: number; cy: number } | null>(null);
  const [liveTxt,  setLiveTxt] = useState<{ cx: number; cy: number } | null>(null);
  const [liveStat, setLiveStat] = useState<{ cx: number; cy: number } | null>(null);

  // ── Image drag ───────────────────────────────────────────────────────────
  const startImgDrag = useCallback(
    (which: "imgA" | "imgB") => (e: React.MouseEvent) => {
      if (!isStudio) return;
      e.preventDefault(); e.stopPropagation();
      const cx = which === "imgA" ? imageAX : imageBX;
      const cy = which === "imgA" ? imageAY : imageBY;
      setDrag({ kind: which, startMX: e.clientX, startMY: e.clientY, startCX: cx, startCY: cy });
    },
    [isStudio, imageAX, imageAY, imageBX, imageBY],
  );

  const onImgScroll = useCallback(
    (which: "imgA" | "imgB") => (e: React.WheelEvent) => {
      if (!isStudio) return;
      e.stopPropagation();
      const scale = which === "imgA" ? imageAScale : imageBScale;
      const key   = which === "imgA" ? "imageAScale" : "imageBScale";
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      pushStudioProps({ ...props, [key]: Math.round(Math.max(0.3, Math.min(3.0, scale + delta)) * 100) / 100 });
    },
    [isStudio, imageAScale, imageBScale, props],
  );

  // ── Text drag ────────────────────────────────────────────────────────────
  // Resolved text centre for live preview during drag
  const isDark     = bgStyle === "dark";
  const isTop      = layout === "top-text";
  const isSplitR   = layout === "split-right";
  const isCenter   = layout === "center";

  // Default text centre in % (used when textX/textY are -1)
  const defaultTX = isTop ? 50 : isSplitR ? 23 : isCenter ? 50 : 77;
  const defaultTY = isTop ? 10 : 50;
  const resolvedTX = textX >= 0 ? textX : defaultTX;
  const resolvedTY = textY >= 0 ? textY : defaultTY;

  const startTextDrag = useCallback(
    (e: React.MouseEvent) => {
      if (!isStudio) return;
      e.preventDefault(); e.stopPropagation();
      setDrag({ kind: "text", startMX: e.clientX, startMY: e.clientY, startCX: resolvedTX, startCY: resolvedTY });
    },
    [isStudio, resolvedTX, resolvedTY],
  );

  const onTextScroll = useCallback(
    (e: React.WheelEvent) => {
      if (!isStudio) return;
      e.stopPropagation();
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      pushStudioProps({ ...props, textScale: Math.round(Math.max(0.4, Math.min(2.5, textScale + delta)) * 100) / 100 });
    },
    [isStudio, textScale, props],
  );

  const startStatDrag = useCallback(
    (e: React.MouseEvent) => {
      if (!isStudio) return;
      e.preventDefault(); e.stopPropagation();
      setDrag({ kind: "stat", startMX: e.clientX, startMY: e.clientY, startCX: statBadgeX, startCY: statBadgeY });
    },
    [isStudio, statBadgeX, statBadgeY],
  );

  // ── Document-level drag tracking ─────────────────────────────────────────
  useEffect(() => {
    if (!drag) return;
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect) return;

    const { startMX, startMY, startCX, startCY, kind } = drag;

    const toPercent = (e: MouseEvent) => ({
      nx: Math.round(Math.max(0, Math.min(100, startCX + ((e.clientX - startMX) / rect.width)  * 100))),
      ny: Math.round(Math.max(0, Math.min(100, startCY + ((e.clientY - startMY) / rect.height) * 100))),
    });

    const onMove = (e: MouseEvent) => {
      const { nx, ny } = toPercent(e);
      if      (kind === "imgA") setLiveA({ cx: nx, cy: ny });
      else if (kind === "imgB") setLiveB({ cx: nx, cy: ny });
      else if (kind === "text") setLiveTxt({ cx: nx, cy: ny });
      else if (kind === "stat") setLiveStat({ cx: nx, cy: ny });
    };

    const onUp = (e: MouseEvent) => {
      const { nx, ny } = toPercent(e);
      if      (kind === "imgA") pushStudioProps({ ...props, imageAX: nx, imageAY: ny });
      else if (kind === "imgB") pushStudioProps({ ...props, imageBX: nx, imageBY: ny });
      else if (kind === "text") pushStudioProps({ ...props, textX: nx, textY: ny });
      else if (kind === "stat") pushStudioProps({ ...props, statBadgeX: nx, statBadgeY: ny });
      setLiveA(null); setLiveB(null); setLiveTxt(null); setLiveStat(null);
      setDrag(null);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [drag, props]);

  // ── Arrow endpoint drag ───────────────────────────────────────────────────
  const startArrowDrag = useCallback(
    (which: "arrowTail" | "arrowTip") => (e: React.MouseEvent) => {
      if (!isStudio) return;
      e.preventDefault();
      const rect = frameRef.current?.getBoundingClientRect();
      if (!rect) return;
      const scaleX = W / rect.width, scaleY = H / rect.height;
      const onMove = (ev: MouseEvent) => {
        const nx = Math.round(Math.max(0, Math.min(W, (ev.clientX - rect.left) * scaleX)));
        const ny = Math.round(Math.max(0, Math.min(H, (ev.clientY - rect.top)  * scaleY)));
        pushStudioProps(which === "arrowTail"
          ? { ...props, arrowX1: nx, arrowY1: ny }
          : { ...props, arrowX2: nx, arrowY2: ny });
      };
      const onUp = (ev: MouseEvent) => {
        onMove(ev);
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [isStudio, props],
  );

  // ── Typography ────────────────────────────────────────────────────────────
  const textColor  = isDark ? "#f0ece4" : "#111111";
  const mutedColor = isDark ? "rgba(240,236,228,0.6)" : "#555555";

  const lines = hookLine.replace(/\|/g, "\n").split("\n").filter(Boolean);
  const totalChars = lines.join(" ").replace(/\*\*/g, "").length;

  const topSizes:    [number, number][] = [[12,148],[20,132],[28,114],[38,96],[50,82],[65,70],[Infinity,58]];
  const splitSizes:  [number, number][] = [[10,128],[16,110],[24,92], [34,78],[46,66],[60,56],[Infinity,46]];
  const centerSizes: [number, number][] = [[8,140], [14,118],[22,100],[30,84],[42,70],[55,60],[Infinity,50]];

  const sizeTable = isTop ? topSizes : isCenter ? centerSizes : splitSizes;
  const baseFontSize = (sizeTable.find(([max]) => totalChars <= max) ?? [0, 58])[1];
  const fontSize     = Math.round(baseFontSize * textScale);
  const subFontSize  = Math.max(22, Math.round(fontSize * 0.22));
  const statFontSize = Math.max(26, Math.round(fontSize * 0.25));

  // ── Text block position ───────────────────────────────────────────────────
  const liveTX = liveTxt?.cx ?? resolvedTX;
  const liveTY = liveTxt?.cy ?? resolvedTY;
  const hasManualPos = textX >= 0 || textY >= 0 || liveTxt !== null;

  // Width cap differs per layout/position
  const textMaxW = isCenter || hasManualPos ? W * 0.52 : W * 0.46;
  const textAlign: React.CSSProperties["textAlign"] = isCenter || hasManualPos ? "center" : "left";
  // When textWidth > 0 it represents % of frame width; override the layout default.
  const resolvedTW = textWidth > 0 ? W * (textWidth / 100) : undefined;

  const textBlockStyle: React.CSSProperties = hasManualPos || isCenter
    ? {
        position: "absolute",
        left: `${liveTX}%`, top: `${liveTY}%`,
        transform: "translate(-50%, -50%)",
        ...(resolvedTW ? { width: resolvedTW } : { maxWidth: textMaxW }),
        textAlign,
        zIndex: 20,
      }
    : isTop
    ? { position: "absolute", top: 36, left: 60, right: 60, zIndex: 20, ...(resolvedTW ? { width: resolvedTW, right: "auto" } : {}) }
    : isSplitR
    ? { position: "absolute", top: "50%", transform: "translateY(-50%)", left: 64, width: resolvedTW ?? W * 0.46, zIndex: 20 }
    : { position: "absolute", top: "50%", transform: "translateY(-50%)", right: 64, width: resolvedTW ?? W * 0.46, zIndex: 20 };

  const cxA = liveA?.cx ?? imageAX;
  const cyA = liveA?.cy ?? imageAY;
  const cxB = liveB?.cx ?? imageBX;
  const cyB = liveB?.cy ?? imageBY;

  // Studio outline so the text block is visible/grabbable even when short
  const textStudioOutline: React.CSSProperties = isStudio
    ? { cursor: drag?.kind === "text" ? "grabbing" : "grab" }
    : {};

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <div ref={frameRef} style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />

      <Background bgStyle={bgStyle} bgColor={bgColor} />

      {/* ── Images ─────────────────────────────────────────────────────── */}
      {imageA && imageAEffect !== "none" && (
        <EffectLayers src={imageA} cx={cxA} cy={cyA} scale={imageAScale} zIndex={10} effect={imageAEffect} bgStyle={bgStyle} />
      )}
      {imageB && imageBEffect !== "none" && (
        <EffectLayers src={imageB} cx={cxB} cy={cyB} scale={imageBScale} zIndex={11} effect={imageBEffect} bgStyle={bgStyle} />
      )}
      {imageA && (
        <div
          style={{ position: "absolute", inset: 0, zIndex: 10, pointerEvents: isStudio ? "auto" : "none" }}
          onMouseDown={startImgDrag("imgA")}
          onWheel={onImgScroll("imgA")}
        >
          <PlayerImg src={imageA} cx={cxA} cy={cyA} scale={imageAScale} grabbing={drag?.kind === "imgA"} effect={imageAEffect} />
        </div>
      )}
      {imageB && (
        <div
          style={{ position: "absolute", inset: 0, zIndex: 11, pointerEvents: isStudio ? "auto" : "none" }}
          onMouseDown={startImgDrag("imgB")}
          onWheel={onImgScroll("imgB")}
        >
          <PlayerImg src={imageB} cx={cxB} cy={cyB} scale={imageBScale} zIndex={11} grabbing={drag?.kind === "imgB"} effect={imageBEffect} />
        </div>
      )}

      {/* ── Hook text ──────────────────────────────────────────────────── */}
      <div
        style={{ ...textBlockStyle, ...textStudioOutline }}
        onMouseDown={isStudio ? startTextDrag : undefined}
        onWheel={isStudio ? onTextScroll : undefined}
      >
        <div style={{ fontFamily: serifFontFamily, fontSize, lineHeight: 0.93, letterSpacing: -3, color: textColor }}>
          {lines.map((line, i) => (
            <div key={i}>
              {parseHook(line).map((p, j) => (
                <span key={j} style={{ fontWeight: p.bold ? 900 : 400, color: p.bold ? boldColor : textColor }}>
                  {p.text}
                </span>
              ))}
            </div>
          ))}
        </div>

        {subNote && (
          <div style={{
            fontFamily, fontSize: subFontSize, fontWeight: 400,
            fontStyle: "italic", color: mutedColor, marginTop: 14, lineHeight: 1.35,
          }}>{subNote}</div>
        )}

        {statLine && (
          <div style={{
            fontFamily, fontSize: statFontSize, fontWeight: 700,
            color: mutedColor, letterSpacing: "0.04em",
            marginTop: subNote ? 8 : 16, lineHeight: 1.2,
          }}>{statLine}</div>
        )}
      </div>

      {/* ── Floating callout ───────────────────────────────────────────── */}
      {calloutText && (
        <div style={{
          position: "absolute",
          left: `${calloutX}%`, top: `${calloutY}%`,
          transform: "translate(-50%, -50%)",
          zIndex: 25, textAlign: "center", maxWidth: 300,
        }}>
          <div style={{
            display: "inline-block",
            background: isDark ? "rgba(240,236,228,0.12)" : "rgba(0,0,0,0.06)",
            borderRadius: 8, padding: "8px 18px",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.10)"}`,
          }}>
            {parseHook(calloutText).map((p, j) => (
              <span key={j} style={{
                fontFamily: serifFontFamily, fontSize: 36,
                fontWeight: p.bold ? 900 : 400,
                color: p.bold ? boldColor : textColor,
                letterSpacing: -0.5, lineHeight: 1.15,
              }}>{p.text}</span>
            ))}
          </div>
        </div>
      )}

      {/* ── Arrow ──────────────────────────────────────────────────────── */}
      {showArrow && (
        <>
          <Arrow x1={arrowX1} y1={arrowY1} x2={arrowX2} y2={arrowY2} color={arrowColor} />
          {isStudio && (
            <svg viewBox={`0 0 ${W} ${H}`} style={{
              position: "absolute", inset: 0, width: "100%", height: "100%",
              pointerEvents: "none", zIndex: 31, overflow: "hidden",
            }}>
              <circle cx={arrowX1} cy={arrowY1} r={28}
                fill="transparent" stroke="transparent"
                style={{ pointerEvents: "all", cursor: "crosshair" }}
                onMouseDown={startArrowDrag("arrowTail") as unknown as React.MouseEventHandler<SVGCircleElement>}
              />
              <circle cx={arrowX2} cy={arrowY2} r={28}
                fill="transparent" stroke="transparent"
                style={{ pointerEvents: "all", cursor: "crosshair" }}
                onMouseDown={startArrowDrag("arrowTip") as unknown as React.MouseEventHandler<SVGCircleElement>}
              />
            </svg>
          )}
        </>
      )}

      {/* ── Stat badge ─────────────────────────────────────────────────── */}
      {statBadge && (() => {
        const lx = liveStat?.cx ?? statBadgeX;
        const ly = liveStat?.cy ?? statBadgeY;
        return (
          <div
            style={{
              position: "absolute",
              left: `${lx}%`, top: `${ly}%`,
              transform: "translate(-50%, -50%)",
              zIndex: 22, textAlign: "center", lineHeight: 1,
              cursor: isStudio ? (drag?.kind === "stat" ? "grabbing" : "grab") : "default",
              pointerEvents: isStudio ? "auto" : "none",
            }}
            onMouseDown={isStudio ? startStatDrag : undefined}
          >
            <div style={{
              fontFamily: serifFontFamily, fontWeight: 900,
              fontSize: 128, letterSpacing: -6, color: boldColor,
              lineHeight: 0.88,
              textShadow: isDark ? "0 2px 20px rgba(0,0,0,0.6)" : "none",
            }}>{statBadge}</div>
            {statBadgeLabel && (
              <div style={{
                fontFamily, fontWeight: 700, fontSize: 26,
                letterSpacing: "0.08em", textTransform: "uppercase" as const,
                color: isDark ? "rgba(240,236,228,0.55)" : "rgba(0,0,0,0.40)",
                marginTop: 4,
              }}>{statBadgeLabel}</div>
            )}
          </div>
        );
      })()}

      {/* ── Watermark ──────────────────────────────────────────────────── */}
      <div style={{
        position: "absolute", bottom: 22, right: 32, zIndex: 30,
        fontFamily: serifFontFamily, fontSize: 26, fontWeight: 900,
        letterSpacing: -0.5, color: textColor, opacity: 0.18,
      }}>the 90th</div>

    </AbsoluteFill>
  );
};
