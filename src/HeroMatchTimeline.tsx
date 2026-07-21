/**
 * HeroMatchTimeline — minute-by-minute key match events on a horizontal timeline.
 *
 * Events reveal left-to-right as if the match is being replayed.
 * Goals get a gold pulse. Red cards get a red flash.
 * 90th-minute winner (or injury-time goal) gets a special enlarged treatment.
 */
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { fontFamily, serifFontFamily, COLORS, SmartImg, WorldStateSchema } from "./shared";
import { Ground, EASE, prog, beatDelay, resolveTheme, Kicker } from "./lib/kit";

const EventSchema = z.object({
  minute:  z.number(),
  /** goal | assist | yellowCard | redCard | sub | var | penalty | ownGoal */
  type:    z.string().default("goal"),
  player:  z.string().default(""),
  detail:  z.string().default(""),
  /** home | away */
  team:    z.string().default("home"),
});

export const HeroMatchTimelinePropsSchema = z.object({
  homeTeam:    z.string().default("Liverpool"),
  awayTeam:    z.string().default("Arsenal"),
  homeScore:   z.number().default(2),
  awayScore:   z.number().default(1),
  competition: z.string().default("Premier League"),
  date:        z.string().default("09 Feb 2014"),
  /** Player/badge image for home team — filename inside /public */
  homeImage:   z.string().optional(),
  /** Player/badge image for away team — filename inside /public */
  awayImage:   z.string().optional(),
  accentColor: z.string().default("#C8102E"),
  bgColor:     z.string().default("#f0ece4"),
  stagger:     z.number().default(16),
  events: z.array(EventSchema).optional(),
  worldState: WorldStateSchema.optional(),
  skipIntro: z.boolean().optional().default(false),
  beats:     z.record(z.string(), z.number()).optional(),
});
export type HeroMatchTimelineProps = z.infer<typeof HeroMatchTimelinePropsSchema>;

const EVENT_ICONS: Record<string, string> = {
  goal:       "⚽",
  ownGoal:    "⚽",
  penalty:    "⚽",
  assist:     "🅰",
  yellowCard: "🟨",
  redCard:    "🟥",
  sub:        "↕",
  var:        "📺",
};

const EVENT_COLORS: Record<string, string> = {
  goal:       "#C9A84C",
  ownGoal:    "#ef4444",
  penalty:    "#C9A84C",
  assist:     "#60a5fa",
  yellowCard: "#f59e0b",
  redCard:    "#ef4444",
  sub:        "#888",
  var:        "#60a5fa",
};

export const HeroMatchTimeline: React.FC<HeroMatchTimelineProps> = ({
  homeTeam, awayTeam, homeScore, awayScore, competition, date,
  homeImage, awayImage, accentColor, bgColor, stagger, events, skipIntro = false, beats,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = resolveTheme("paper", accentColor, bgColor);

  const INTRO_F  = 20;
  const TITLE_F  = INTRO_F;

  const titleProg = skipIntro ? 1 : prog(frame, TITLE_F, 22, EASE.snap);

  // Sort events by minute
  const sorted = [...(events ?? [])].sort((a, b) => a.minute - b.minute);
  const lastMinute = Math.max(90, ...sorted.map(e => e.minute));

  // Timeline line-draw — starts on the "stat" beat when the narrator names the score (H1)
  const EVENTS_START = beatDelay(beats, "stat", fps, INTRO_F + 30);
  const lineProg = skipIntro ? 1 : prog(frame, EVENTS_START, 40, EASE.out);

  // Layout
  const TIMELINE_LEFT  = 120;
  const TIMELINE_RIGHT = 1800;
  const TIMELINE_W     = TIMELINE_RIGHT - TIMELINE_LEFT;
  const TIMELINE_Y     = 580;
  const LINE_H         = 4;

  const minuteToX = (min: number) => TIMELINE_LEFT + (min / lastMinute) * TIMELINE_W * lineProg;

  return (
    <Ground ground="paper" bgColor={bgColor} accentColor={accentColor} domain="football" texture skipIntro={skipIntro} pad={0}>

      {/* Home player image — left, masked */}
      {homeImage && (
        <div style={{
          position: "absolute", left: 0, bottom: 0,
          width: 540, height: "100%",
          zIndex: 5, pointerEvents: "none",
          opacity: interpolate(titleProg, [0, 1], [0, 0.9]),
          WebkitMaskImage: "linear-gradient(to right, black 25%, transparent 78%), linear-gradient(to top, black 55%, transparent 100%)",
          maskImage:       "linear-gradient(to right, black 25%, transparent 78%), linear-gradient(to top, black 55%, transparent 100%)",
          WebkitMaskComposite: "destination-in",
          maskComposite: "intersect",
        }}>
          <SmartImg
            src={homeImage}
            style={{
              width: "100%", height: "100%",
              objectFit: "contain", objectPosition: "bottom center",
              filter: "contrast(1.05) brightness(1.02)",
            }}
          />
        </div>
      )}

      {/* Away player image — right, masked */}
      {awayImage && (
        <div style={{
          position: "absolute", right: 0, bottom: 0,
          width: 540, height: "100%",
          zIndex: 5, pointerEvents: "none",
          opacity: interpolate(titleProg, [0, 1], [0, 0.9]),
          WebkitMaskImage: "linear-gradient(to left, black 25%, transparent 78%), linear-gradient(to top, black 55%, transparent 100%)",
          maskImage:       "linear-gradient(to left, black 25%, transparent 78%), linear-gradient(to top, black 55%, transparent 100%)",
          WebkitMaskComposite: "destination-in",
          maskComposite: "intersect",
        }}>
          <SmartImg
            src={awayImage}
            style={{
              width: "100%", height: "100%",
              objectFit: "contain", objectPosition: "bottom center",
              filter: "contrast(1.05) brightness(1.02)",
            }}
          />
        </div>
      )}

      <AbsoluteFill style={{ zIndex: 10 }}>
        {/* Title row */}
        <div style={{
          position: "absolute",
          left: 120, top: 80,
          opacity: interpolate(titleProg, [0, 0.6], [0, 1], { extrapolateRight: "clamp" }),
          transform: `translateY(${interpolate(titleProg, [0, 1], [14, 0])}px)`,
        }}>
          <div style={{ marginBottom: 10 }}>
            <Kicker label={`${competition} · ${date}`} theme={t} frame={frame} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
            <div style={{ fontFamily: serifFontFamily, fontSize: 72, fontWeight: 900,
              color: accentColor, letterSpacing: -2 }}>{homeTeam}</div>
            <div style={{ fontFamily: serifFontFamily, fontSize: 96, fontWeight: 900,
              color: COLORS.primary, letterSpacing: -3 }}>{homeScore}–{awayScore}</div>
            <div style={{ fontFamily: serifFontFamily, fontSize: 72, fontWeight: 900,
              color: COLORS.secondary, letterSpacing: -2 }}>{awayTeam}</div>
          </div>
        </div>

        {/* Timeline bar */}
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}>
          {/* Base line (full, dim) */}
          <rect x={TIMELINE_LEFT} y={TIMELINE_Y - LINE_H / 2}
            width={TIMELINE_W} height={LINE_H}
            rx={2} fill={accentColor} fillOpacity={0.12} />
          {/* Progress line */}
          <rect x={TIMELINE_LEFT} y={TIMELINE_Y - LINE_H / 2}
            width={TIMELINE_W * lineProg} height={LINE_H}
            rx={2} fill={accentColor} fillOpacity={0.5} />

          {/* Minute markers: 15, 30, 45, 60, 75, 90 */}
          {[15, 30, 45, 60, 75, 90].map(min => (
            <g key={min}>
              <line
                x1={TIMELINE_LEFT + (min / lastMinute) * TIMELINE_W}
                y1={TIMELINE_Y - 8}
                x2={TIMELINE_LEFT + (min / lastMinute) * TIMELINE_W}
                y2={TIMELINE_Y + 8}
                stroke={accentColor} strokeWidth={1} strokeOpacity={0.2} />
              <text
                x={TIMELINE_LEFT + (min / lastMinute) * TIMELINE_W}
                y={TIMELINE_Y + 26}
                textAnchor="middle"
                fontSize={13}
                fontFamily={fontFamily}
                fill={COLORS.muted}
                opacity={0.5}>{min}'</text>
            </g>
          ))}

          {/* Events */}
          {sorted.map((ev, i) => {
            const revealF = EVENTS_START + i * stagger;
            const evP     = skipIntro ? 1 : prog(frame, revealF, 14, EASE.snap);
            const cx      = minuteToX(ev.minute);
            const isHome  = (ev.team || "home") !== "away";
            const col     = EVENT_COLORS[ev.type] || "#888";
            const isGoal  = ev.type === "goal" || ev.type === "penalty" || ev.type === "ownGoal";
            const nodeR   = isGoal ? 18 : 12;
            const textY   = isHome ? TIMELINE_Y - 36 : TIMELINE_Y + 52;
            const labelY  = isHome ? TIMELINE_Y - 60 : TIMELINE_Y + 72;

            return (
              <g key={i} opacity={evP}>
                {/* Stem */}
                <line
                  x1={cx} y1={TIMELINE_Y}
                  x2={cx} y2={isHome ? TIMELINE_Y - 28 : TIMELINE_Y + 28}
                  stroke={col} strokeWidth={1.5} strokeOpacity={0.6} />
                {/* Node */}
                <circle cx={cx} cy={TIMELINE_Y} r={nodeR * evP}
                  fill={isGoal ? col : "none"}
                  stroke={col} strokeWidth={2}
                  opacity={evP} />
                {/* Icon */}
                <text x={cx} y={TIMELINE_Y + 6}
                  textAnchor="middle" fontSize={isGoal ? 16 : 12}
                  opacity={evP}>{EVENT_ICONS[ev.type] || "•"}</text>
                {/* Player name */}
                <text x={cx} y={textY}
                  textAnchor="middle" fontSize={15}
                  fontWeight={700} fontFamily={fontFamily}
                  fill={isGoal ? col : COLORS.muted}
                  opacity={evP}>{ev.player}</text>
                {/* Minute label */}
                <text x={cx} y={labelY}
                  textAnchor="middle" fontSize={12}
                  fontFamily={fontFamily}
                  fill={COLORS.muted}
                  opacity={evP * 0.7}>{ev.minute}'{ev.detail ? ` ${ev.detail}` : ""}</text>
              </g>
            );
          })}
        </svg>
      </AbsoluteFill>
    </Ground>
  );
};
