import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { FilmGrade, Grain, PALETTES, SmartImg, fontFamily, geistMonoFamily, rgbaFromHex } from "./shared";

// ── Colours: pinned to the light paper-orange palette (warm-white + burnt orange) ──
const P = PALETTES.paperOrange;

// Outlet names / body copy get the mono newswire register.
const SOURCE_FONT = geistMonoFamily;
// Headline highlights sit on a translucent accent wash (text stays ink).
const HIGHLIGHT_BG = P.accentSoft;

const DEFAULT_BG = P.bg;
const DEFAULT_ACCENT = P.accent;
const DEFAULT_DOT = P.accent;
const DEFAULT_TEXT = P.ink;
const DEFAULT_LINE = rgbaFromHex(P.ink, 0.2);

const PORTRAIT_W = 680;
const PORTRAIT_MASK = "linear-gradient(to right, transparent, black 350px, black 85%, transparent)";

const LEFT_X = 32;
const LOWER_Y = 792;
const RISE_X = 730;
const LINE_Y = 525;
const TURN_R = 38;
const NODE_X = 1810;
const REPEAT_OFFSET_X = -240;
const DOT_RADIUS = 28;
const INNER_DOT_R = 8;
const SCENE_W = 1920;
const CHARS_PER_FRAME = 0.7;

const ARC_LEN = (Math.PI * TURN_R) / 2;
const SEG1 = 1080 - (LOWER_Y + TURN_R);
const SEG2 = (RISE_X - TURN_R) - (LEFT_X + TURN_R);
const SEG3 = (LOWER_Y - TURN_R) - (LINE_Y + TURN_R);
const SEG4 = NODE_X - (RISE_X + TURN_R);
const FIRST_SCENE_LEN = SEG1 + ARC_LEN + SEG2 + ARC_LEN + SEG3 + ARC_LEN + SEG4;
const TOP_LEAD = SCENE_W + REPEAT_OFFSET_X + LEFT_X - NODE_X;
const DOWN_SEG = LOWER_Y + TURN_R - LINE_Y;
const REPEATED_SCENE_LEN = TOP_LEAD + DOWN_SEG + ARC_LEN + SEG2 + ARC_LEN + SEG3 + ARC_LEN + SEG4;

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function sceneOffset(index: number): number {
  return index * SCENE_W;
}

function nodeWorldX(index: number): number {
  return sceneOffset(index) + NODE_X;
}

function sceneCameraX(index: number): number {
  return sceneOffset(index);
}

function makeSingleScenePathD(offsetX: number): string {
  const lx = offsetX + LEFT_X;
  const rx = offsetX + RISE_X;
  const nx = offsetX + NODE_X;
  return [
    `M ${lx} 1080`,
    `L ${lx} ${LOWER_Y + TURN_R}`,
    `Q ${lx} ${LOWER_Y} ${lx + TURN_R} ${LOWER_Y}`,
    `L ${rx - TURN_R} ${LOWER_Y}`,
    `Q ${rx} ${LOWER_Y} ${rx} ${LOWER_Y - TURN_R}`,
    `L ${rx} ${LINE_Y + TURN_R}`,
    `Q ${rx} ${LINE_Y} ${rx + TURN_R} ${LINE_Y}`,
    `L ${nx} ${LINE_Y}`,
  ].join(" ");
}

function nodeDistance(index: number): number {
  return index === 0 ? FIRST_SCENE_LEN : FIRST_SCENE_LEN + index * REPEATED_SCENE_LEN;
}

function pointAtDistance(distanceInput: number): { x: number; y: number } {
  let distance = Math.max(0, distanceInput);

  if (distance <= SEG1) {
    return { x: LEFT_X, y: 1080 - distance };
  }
  distance -= SEG1;

  if (distance <= ARC_LEN) {
    const angle = (distance / ARC_LEN) * (Math.PI / 2);
    return {
      x: LEFT_X + TURN_R * (1 - Math.cos(angle)),
      y: LOWER_Y + TURN_R * Math.cos(angle),
    };
  }
  distance -= ARC_LEN;

  if (distance <= SEG2) {
    return { x: LEFT_X + TURN_R + distance, y: LOWER_Y };
  }
  distance -= SEG2;

  if (distance <= ARC_LEN) {
    const angle = (distance / ARC_LEN) * (Math.PI / 2);
    return {
      x: RISE_X - TURN_R * Math.cos(angle),
      y: LOWER_Y - TURN_R * Math.sin(angle),
    };
  }
  distance -= ARC_LEN;

  if (distance <= SEG3) {
    return { x: RISE_X, y: LOWER_Y - TURN_R - distance };
  }
  distance -= SEG3;

  if (distance <= ARC_LEN) {
    const angle = (distance / ARC_LEN) * (Math.PI / 2);
    return {
      x: RISE_X + TURN_R * Math.sin(angle),
      y: LINE_Y + TURN_R * Math.cos(angle),
    };
  }
  distance -= ARC_LEN;

  if (distance <= SEG4) {
    return { x: RISE_X + TURN_R + distance, y: LINE_Y };
  }
  distance -= SEG4;

  const sceneIndex = Math.floor(distance / REPEATED_SCENE_LEN) + 1;
  const within = distance % REPEATED_SCENE_LEN;
  const offset = sceneOffset(sceneIndex) + REPEAT_OFFSET_X;
  const startX = offset + LEFT_X;
  const riseX = offset + RISE_X;

  let segment = within;

  if (segment <= TOP_LEAD) {
    return { x: nodeWorldX(sceneIndex - 1) - segment, y: LINE_Y };
  }
  segment -= TOP_LEAD;

  if (segment <= DOWN_SEG) {
    return { x: startX, y: LINE_Y + segment };
  }
  segment -= DOWN_SEG;

  if (segment <= ARC_LEN) {
    const angle = (segment / ARC_LEN) * (Math.PI / 2);
    return {
      x: startX + TURN_R * (1 - Math.cos(angle)),
      y: LOWER_Y + TURN_R * Math.cos(angle),
    };
  }
  segment -= ARC_LEN;

  if (segment <= SEG2) {
    return { x: startX + TURN_R + segment, y: LOWER_Y };
  }
  segment -= SEG2;

  if (segment <= ARC_LEN) {
    const angle = (segment / ARC_LEN) * (Math.PI / 2);
    return {
      x: riseX - TURN_R * Math.cos(angle),
      y: LOWER_Y - TURN_R * Math.sin(angle),
    };
  }
  segment -= ARC_LEN;

  if (segment <= SEG3) {
    return { x: riseX, y: LOWER_Y - TURN_R - segment };
  }
  segment -= SEG3;

  if (segment <= ARC_LEN) {
    const angle = (segment / ARC_LEN) * (Math.PI / 2);
    return {
      x: riseX + TURN_R * Math.sin(angle),
      y: LINE_Y + TURN_R * Math.cos(angle),
    };
  }
  segment -= ARC_LEN;

  return { x: riseX + TURN_R + Math.min(segment, SEG4), y: LINE_Y };
}

/**
 * Layout-stable typewriter: the FULL headline is laid out from frame 0 (so
 * multi-line wrap points never move) and words flip from hidden to visible as
 * the typing head passes them. The old `headline.slice(0, visibleChars)`
 * approach re-wrapped the paragraph on every appended character — on two-line
 * headlines, words visibly jumped between lines mid-animation (WeWork 6:56).
 * The cursor rides the currently-typing word as an absolute overlay so it
 * never participates in layout either.
 */
function renderTypedWords(
  text: string,
  highlights: string[],
  textColor: string,
  visibleChars: number,
  showCursor: boolean,
  cursorOn: boolean,
): React.ReactNode {
  const escaped = highlights.map(escapeRegex);
  const parts = highlights.length
    ? text.split(new RegExp(`(${escaped.join("|")})`, "gi"))
    : [text];

  let acc = 0;
  let lastVisibleKey: string | null = null;
  const tokenMeta: Array<{ key: string; tok: string; isHighlight: boolean; start: number; end: number }> = [];
  parts.forEach((part, pi) => {
    const isHighlight = highlights.some((item) => item.toLowerCase() === part.toLowerCase());
    part.split(/(\s+)/).forEach((tok, ti) => {
      if (!tok) return;
      const start = acc;
      acc += tok.length;
      const key = `${pi}-${ti}`;
      tokenMeta.push({ key, tok, isHighlight, start, end: acc });
      if (start < visibleChars) lastVisibleKey = key;
    });
  });

  return tokenMeta.map(({ key, tok, isHighlight, start }) => {
    const visible = start < visibleChars;
    const isActive = key === lastVisibleKey && showCursor;
    return (
      <span
        key={key}
        style={{
          position: "relative",
          visibility: visible ? ("visible" as const) : ("hidden" as const),
          ...(isHighlight && visible
            ? {
                backgroundColor: HIGHLIGHT_BG,
                color: textColor,
                padding: "0.02em 0.06em 0.08em",
                boxDecorationBreak: "clone" as const,
                WebkitBoxDecorationBreak: "clone" as const,
                borderRadius: 2,
              }
            : {}),
        }}
      >
        {tok}
        {isActive ? (
          <span style={{ position: "absolute", right: "-0.55em", opacity: cursorOn ? 0.55 : 0 }}>▍</span>
        ) : null}
      </span>
    );
  });
}

const HeadlineItemSchema = z.object({
  source: z.string().optional().default("The Guardian"),
  headline: z.string().optional().default(""),
  headlineHighlights: z.array(z.string()).optional().default([]),
  body: z.string().optional().default(""),
  image: z.string().optional(),
});

export const HeroNewsFeedPropsSchema = z.object({
  headlines: z.array(HeadlineItemSchema).min(1),
  bgColor: z.string().optional().default(DEFAULT_BG),
  accentColor: z.string().optional().default(DEFAULT_ACCENT),
  dotColor: z.string().optional().default(DEFAULT_DOT),
  lineColor: z.string().optional().default(DEFAULT_LINE),
  textColor: z.string().optional().default(DEFAULT_TEXT),
  dwellFrames: z.number().int().optional().default(120),
  panFrames: z.number().int().optional().default(20),
  skipIntro: z.boolean().optional().default(false),
  // Cinematic grade — toggle in the studio props panel for instant before/after.
  filmGrade: z.boolean().optional().default(true),
  gradeIntensity: z.number().optional().default(1),
});

export type HeroNewsFeedProps = z.input<typeof HeroNewsFeedPropsSchema>;
type HeadlineItem = z.input<typeof HeadlineItemSchema>;

type TimelineEntry = {
  item: HeadlineItem;
  index: number;
  start: number;
  dwellEnd: number;
  transitionEnd: number;
};

function dwellFor(headline: string, minDwell: number): number {
  return Math.max(minDwell, 10 + Math.ceil(headline.length * 1.2) + 50);
}

export function calculateMetadata({ props }: { props: HeroNewsFeedProps }) {
  const minDwell = props.dwellFrames ?? 120;
  const pan = props.panFrames ?? 20;
  const total = (props.headlines ?? []).reduce(
    (sum, item) => sum + dwellFor(item.headline ?? "", minDwell),
    0
  );
  return {
    durationInFrames: Math.max(1, total + Math.max(0, (props.headlines?.length ?? 1) - 1) * pan),
  };
}

function buildTimeline(headlines: HeadlineItem[], dwellFrames: number, panFrames: number): TimelineEntry[] {
  let cursor = 0;
  return headlines.map((item, index) => {
    const dwell = dwellFor(item.headline ?? "", dwellFrames);
    const entry: TimelineEntry = {
      item,
      index,
      start: cursor,
      dwellEnd: cursor + dwell,
      transitionEnd: cursor + dwell + (index === headlines.length - 1 ? 0 : panFrames),
    };
    cursor = entry.transitionEnd;
    return entry;
  });
}

const ReferenceBackdrop: React.FC<{ bgColor: string }> = ({ bgColor }) => (
  <>
    <AbsoluteFill style={{ background: bgColor }} />
    {/* Faint warm edge vignette for depth — never a heavy black vignette or white glow. */}
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(125% 125% at 50% 42%, transparent 62%, rgba(28,26,21,0.06) 100%)",
      }}
    />
  </>
);

type StoryBlockProps = {
  entry: TimelineEntry;
  phase: "active" | "entering" | "exiting";
  progress: number;
  textColor: string;
  accentColor: string;
  bgColor: string;
  height: number;
  typewriterFrame: number;
};

const StoryBlock: React.FC<StoryBlockProps> = ({ entry, phase, progress, textColor, accentColor, bgColor, height, typewriterFrame }) => {
  const frame = useCurrentFrame();
  const source = entry.item.source ?? "The Guardian";
  const headline = entry.item.headline ?? "";
  const highlights = entry.item.headlineHighlights ?? [];
  const body = entry.item.body ?? "";
  const image = entry.item.image;
  const worldLeft = sceneOffset(entry.index);
  const hasImage = Boolean(image);
  const textLeft = hasImage ? worldLeft + 748 : worldLeft + 528;
  const textWidth = hasImage ? 1040 : 1240;
  const active = phase !== "exiting";
  const entering = phase === "entering";
  const exiting = phase === "exiting";
  const visibleChars = active ? Math.min(headline.length, Math.ceil(typewriterFrame * CHARS_PER_FRAME)) : 0;
  const cursorOn = Math.floor(frame / 9) % 2 === 0;
  const showCursor = active && visibleChars < headline.length;
  const imageOpacity = !image
    ? 0
    : entering
      ? interpolate(progress, [0, 0.55, 1], [0, 0, 0.88])
      : exiting
        ? interpolate(progress, [0, 0.35, 1], [0.88, 0.2, 0])
        : 0.88;

  return (
    <>
      {image ? (
        <div
          style={{
            position: "absolute",
            left: worldLeft,
            top: 0,
            width: PORTRAIT_W,
            height,
            overflow: "hidden",
            opacity: imageOpacity,
            WebkitMaskImage: PORTRAIT_MASK,
            maskImage: PORTRAIT_MASK,
            zIndex: 1,
          }}
        >
          <SmartImg
            src={image}
            style={{
              width: "100%",
              height: "110%",
              objectFit: "cover",
              objectPosition: "top center",
              display: "block",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 380,
              background: `linear-gradient(to top, ${bgColor} 0%, ${bgColor} 16%, transparent 100%)`,
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 70,
              background: `linear-gradient(to bottom, ${bgColor} 0%, transparent 100%)`,
              pointerEvents: "none",
            }}
          />
        </div>
      ) : null}

      <div
        style={{
          position: "absolute",
          top: 162,
          left: textLeft,
          fontFamily: SOURCE_FONT,
          fontSize: 29,
          lineHeight: 1,
          fontWeight: 700,
          color: accentColor,
          letterSpacing: -0.5,
          opacity: active ? (entering ? interpolate(progress, [0, 1], [0.2, 0.98]) : 0.98) : 0,
        }}
      >
        {source}
      </div>

      <div
        style={{
          position: "absolute",
          top: 232,
          left: textLeft,
          width: textWidth,
          fontFamily,
          fontSize: 80,
          fontWeight: 900,
          lineHeight: 0.98,
          letterSpacing: -4.2,
          color: textColor,
          whiteSpace: "pre-wrap",
          textRendering: "geometricPrecision",
          opacity: active ? (entering ? interpolate(progress, [0, 1], [0.12, 1]) : 1) : 0,
        }}
      >
        {renderTypedWords(headline, highlights, textColor, visibleChars, showCursor, cursorOn)}
      </div>

      {body ? (
        <div
          style={{
            position: "absolute",
            top: 565,
            left: textLeft,
            width: textWidth,
            color: P.muted,
            opacity: active ? (entering ? interpolate(progress, [0, 1], [0.12, 1]) : 1) : 0,
            fontFamily: SOURCE_FONT,
            fontSize: 28,
            lineHeight: 1.28,
            letterSpacing: 0.1,
            whiteSpace: "pre-wrap",
          }}
        >
          {body}
        </div>
      ) : null}
    </>
  );
};

type VisibleEntry = {
  entry: TimelineEntry;
  phase: "active" | "entering" | "exiting";
  progress: number;
};

type WorldLayerProps = {
  timeline: TimelineEntry[];
  visibleEntries: VisibleEntry[];
  activeIndex: number;
  cameraX: number;
  localDotDistance: number;
  dotSceneIndex: number;
  dotOpacity: number;
  dotColor: string;
  innerDotColor: string;
  lineColor: string;
  textColor: string;
  accentColor: string;
  bgColor: string;
  height: number;
  typewriterMap: Record<number, number>;
};

const WorldLayer: React.FC<WorldLayerProps> = ({
  timeline,
  visibleEntries,
  activeIndex,
  cameraX,
  localDotDistance,
  dotSceneIndex,
  dotOpacity,
  dotColor,
  innerDotColor,
  lineColor,
  textColor,
  accentColor,
  bgColor,
  height,
  typewriterMap,
}) => {
  const worldWidth = Math.max(1, timeline.length) * SCENE_W;
  const localDotPoint = pointAtDistance(localDotDistance);
  const dotX = sceneOffset(dotSceneIndex) + localDotPoint.x;
  const dotY = localDotPoint.y;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: worldWidth,
        height,
        transform: `translateX(${-Math.round(cameraX)}px)`,
      }}
    >
      {visibleEntries.map(({ entry, phase, progress }) => (
        <StoryBlock
          key={entry.index}
          entry={entry}
          phase={phase}
          progress={progress}
          textColor={textColor}
          accentColor={accentColor}
          bgColor={bgColor}
          height={height}
          typewriterFrame={typewriterMap[entry.index] ?? 0}
        />
      ))}

      <svg style={{ position: "absolute", top: 0, left: 0 }} width={worldWidth} height={height}>
        {timeline.map((entry) => {
          const ve = visibleEntries.find((v) => v.entry.index === entry.index);
          let pathOp = 0;
          if (ve) {
            if (ve.phase === "active") pathOp = 1;
            else if (ve.phase === "exiting") pathOp = Math.max(0, 1 - ve.progress * 2);
          }
          return (
            <path
              key={entry.index}
              d={makeSingleScenePathD(sceneOffset(entry.index))}
              fill="none"
              stroke={lineColor}
              strokeWidth={4}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={pathOp}
            />
          );
        })}

        <circle cx={dotX} cy={dotY} r={DOT_RADIUS} fill={dotColor} opacity={dotOpacity} />
        <circle cx={dotX} cy={dotY} r={INNER_DOT_R} fill={innerDotColor} opacity={dotOpacity} />
      </svg>
    </div>
  );
};

export const HeroNewsFeed: React.FC<HeroNewsFeedProps> = ({
  headlines,
  bgColor = DEFAULT_BG,
  accentColor = DEFAULT_ACCENT,
  dotColor = DEFAULT_DOT,
  lineColor = DEFAULT_LINE,
  textColor = DEFAULT_TEXT,
  dwellFrames = 120,
  panFrames = 20,
  skipIntro = false,
  filmGrade = true,
  gradeIntensity = 1,
}) => {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();

  const safeBgColor = bgColor || DEFAULT_BG;
  const safeAccentColor = accentColor || DEFAULT_ACCENT;
  const safeDotColor = dotColor || DEFAULT_DOT;
  const safeTextColor = textColor || DEFAULT_TEXT;

  const timeline = buildTimeline(headlines, dwellFrames, panFrames);
  let current = timeline[0];
  let next: TimelineEntry | null = null;
  let transitionProgress = 0;

  for (let index = 0; index < timeline.length; index += 1) {
    const entry = timeline[index];
    if (frame < entry.dwellEnd) {
      current = entry;
      break;
    }
    if (frame < entry.transitionEnd && index < timeline.length - 1) {
      current = entry;
      next = timeline[index + 1];
      transitionProgress = Math.min(1, Math.max(0, (frame - entry.dwellEnd) / Math.max(1, panFrames - 1)));
      break;
    }
    current = entry;
  }

  const localFrame = Math.max(0, frame - current.start);
  const transitionSpring = next
    ? (spring({
        fps,
        frame: Math.round(transitionProgress * Math.max(1, panFrames)),
        config: { damping: 30, stiffness: 180, mass: 1 },
      }) as number)
    : 0;

  const cameraX = next
    ? interpolate(transitionSpring, [0, 1], [sceneCameraX(current.index), sceneCameraX(next.index)], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : sceneCameraX(current.index);

  const dotSceneIndex = current.index;
  let localDotDistance: number;
  if (skipIntro) {
    localDotDistance = FIRST_SCENE_LEN;
  } else if (!next) {
    const introSpring = spring({
      fps,
      frame: Math.min(localFrame, 90),
      config: { damping: 22, stiffness: 14, mass: 1.8 },
    }) as number;
    localDotDistance = interpolate(introSpring, [0, 1], [0, FIRST_SCENE_LEN]);
  } else {
    localDotDistance = FIRST_SCENE_LEN;
  }
  const dotOpacity = next ? Math.max(0, 1 - transitionSpring * 2) : 1;

  const typewriterMap: Record<number, number> = {};
  if (!next) {
    typewriterMap[current.index] = skipIntro && current.index === 0 ? current.item.headline?.length ?? 999 : localFrame;
  } else {
    typewriterMap[current.index] = (current.item.headline ?? "").length / CHARS_PER_FRAME + 2;
    typewriterMap[next.index] = 0;
  }

  const visibleEntries: VisibleEntry[] = next
    ? [
        { entry: current, phase: "exiting", progress: transitionSpring },
        { entry: next, phase: "entering", progress: transitionSpring },
      ]
    : [{ entry: current, phase: "active", progress: 1 }];
  const activeIndex = next ? next.index : current.index;

  const scene = (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <ReferenceBackdrop bgColor={safeBgColor} />
      <WorldLayer
        timeline={timeline}
        visibleEntries={visibleEntries}
        activeIndex={activeIndex}
        cameraX={cameraX}
        localDotDistance={localDotDistance}
        dotSceneIndex={dotSceneIndex}
        dotOpacity={dotOpacity}
        dotColor={safeDotColor}
        innerDotColor={safeBgColor}
        lineColor={lineColor || DEFAULT_LINE}
        textColor={safeTextColor}
        accentColor={safeAccentColor}
        bgColor={safeBgColor}
        height={height}
        typewriterMap={typewriterMap}
      />
      {!filmGrade && (
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.35 }}>
          <Grain />
        </div>
      )}
    </AbsoluteFill>
  );

  // Light newsprint register: near-neutral grade, fine low-opacity grain and a
  // faint warm vignette — paper stock, not a dark broadcast wash.
  return filmGrade ? (
    <FilmGrade
      intensity={gradeIntensity}
      contrast={1.03}
      saturation={1.02}
      brightness={1}
      tint={P.ink}
      tintOpacity={0.04}
      grain={0.08}
      vignette={0.08}
    >
      {scene}
    </FilmGrade>
  ) : (
    scene
  );
};


