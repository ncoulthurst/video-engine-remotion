/**
 * CareerTimeline — Horizontal timeline of a player's career clubs/events.
 * Updated: Larger badges, text below line, 90-degree stems, focus support.
 */
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { fontFamily, serifFontFamily, COLORS, Grain, PaperBackground, hexToRgb, SmartImg } from "./shared";

export const TimelineEventSchema = z.object({ year: z.string().optional().default(""), club: z.string().optional().default(""), badgeSlug: z.string().optional().default(""), clubColor: z.string().optional().default(""), detail: z.string().optional().default(""), isHighlight: z.boolean().default(false) });
export const CareerTimelinePropsSchema = z.object({ playerName: z.string(), events: z.array(TimelineEventSchema), activeIndex: z.number().default(-1), startFrame: z.number().default(40) });
export type TimelineEvent = z.infer<typeof TimelineEventSchema>;
export type CareerTimelineProps = z.infer<typeof CareerTimelinePropsSchema>;

const NODE_START = 28; const NODE_STAGGER = 14;

const TimelineNode: React.FC<{ event: TimelineEvent; index: number; frame: number; fps: number; isActive: boolean; anyActive: boolean; focusProg: number; }> = ({ event, index, frame, fps, isActive, anyActive, focusProg }) => {
  const delay = NODE_START + index * NODE_STAGGER;
  const introProg = spring({ frame: frame - (delay ?? 0), fps, config: { damping: 14, stiffness: 120, mass: 1 } });
  const targetScale = isActive ? 1.08 : (anyActive ? 0.88 : 1);
  const targetOpacity = isActive ? 1 : (anyActive ? 0.45 : 1);
  const currentScale = interpolate(focusProg, [0, 1], [interpolate(introProg, [0, 1], [0.8, 1]), targetScale * interpolate(introProg, [0, 1], [0.8, 1])]);
  const currentOpacity = interpolate(focusProg, [0, 1], [interpolate(introProg, [0, 0.4], [0, 1]), targetOpacity * interpolate(introProg, [0, 0.4], [0, 1])]);
  const [r, g, b] = hexToRgb(event.clubColor);
  const BADGE_SIZE = 176;

  return (
    <div style={{ opacity: currentOpacity, transform: `translateY(${interpolate(introProg, [0, 1], [40, 0])}px) scale(${currentScale})`, display: "flex", flexDirection: "column", alignItems: "center", flex: 1, minWidth: 0, position: "relative", filter: (anyActive && !isActive) ? "grayscale(0.3)" : "none" }}>
      <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: 2, color: isActive ? COLORS.gold : COLORS.muted, textTransform: "uppercase", fontFamily, marginBottom: 20 }}>{event.year}</div>
      <div style={{ width: BADGE_SIZE, height: BADGE_SIZE, borderRadius: "50%", backgroundColor: "#fff", border: `3px solid rgba(${r},${g},${b},${isActive ? 1.0 : 0.35})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: isActive ? `0 12px 48px rgba(${r},${g},${b},0.5), 0 0 0 6px rgba(201,168,76,0.6)` : `0 4px 16px rgba(${r},${g},${b},0.15)`, position: "relative", zIndex: 3 }}>
        <SmartImg src={`badges/${event.badgeSlug}`} width={BADGE_SIZE * 0.7} height={BADGE_SIZE * 0.7} style={{ objectFit: "contain" }} />
      </div>
      <div style={{ width: 2, height: 80, backgroundColor: `rgba(${r},${g},${b},${isActive ? 0.6 : 0.2})`, zIndex: 1 }} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 12 }}>
        <div style={{ fontSize: isActive ? 28 : 24, fontWeight: 900, color: isActive ? COLORS.primary : COLORS.muted, fontFamily: serifFontFamily, textAlign: "center", letterSpacing: -0.5, lineHeight: 1.1 }}>{event.club}</div>
        {event.detail && <div style={{ fontSize: isActive ? 18 : 16, fontWeight: isActive ? 600 : 500, color: COLORS.muted, fontFamily, textAlign: "center", marginTop: 10, maxWidth: 240, lineHeight: 1.4, padding: "4px 12px", borderTop: `1px solid rgba(${r},${g},${b},${isActive ? 0.4 : 0.1})`, opacity: isActive ? 1 : 0.7 }}>{event.detail}</div>}
      </div>
    </div>
  );
};

export const CareerTimeline: React.FC<CareerTimelineProps> = ({ playerName, events, activeIndex, startFrame }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  const hProg = spring({ frame, fps, config: { damping: 18, stiffness: 55 } });
  const lineProg = spring({ frame: frame - 18, fps, config: { damping: 20, stiffness: 80 } });
  const focusProg = spring({ frame: frame - (startFrame ?? 40), fps, config: { damping: 22, stiffness: 80 } });

  return (
    <AbsoluteFill>
      <PaperBackground /><Grain />
      <AbsoluteFill style={{ display: "flex", flexDirection: "column", justifyContent: "flex-start", paddingLeft: 100, paddingRight: 100, paddingTop: 80 }}>
        <div style={{ opacity: hProg, transform: `translateY(${interpolate(hProg, [0, 1], [-20, 0])}px)`, marginBottom: 80 }}>
          <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: 3, color: COLORS.muted, textTransform: "uppercase", marginBottom: 12, fontFamily }}>Career Timeline</div>
          <div style={{ fontSize: 90, fontWeight: 900, color: COLORS.primary, lineHeight: 0.95, letterSpacing: -3, fontFamily: serifFontFamily }}>{playerName}</div>
        </div>
        <div style={{ position: "relative", width: "100%", marginTop: 40 }}>
          <div style={{ position: "absolute", top: 132, left: "5%", width: `${interpolate(lineProg, [0, 1], [0, 90])}%`, height: 4, backgroundColor: "rgba(0,0,0,0.08)", borderRadius: 2, transform: "translateY(-50%)", zIndex: 1 }} />
          <div style={{ display: "flex", alignItems: "flex-start", gap: 0, position: "relative", zIndex: 2 }}>
            {events.map((event, i) => ( <TimelineNode key={i} event={event} index={i} frame={frame} fps={fps} isActive={(activeIndex ?? -1) === i} anyActive={(activeIndex ?? -1) >= 0} focusProg={focusProg} /> ))}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
