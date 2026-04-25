/**
 * AnimatedFactCard — Full-screen bold statement card.
 * Style: paper background, centred serif text, words build word-by-word,
 * accent underline sweeps under the highlight phrase.
 */
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { fontFamily, serifFontFamily, Grain, PaperBackground, DarkBackground, COLORS, SPRINGS, WorldStateSchema} from "./shared";

// ══════════════════════════════════════════════════════════════════════════════
// SCHEMA
// ══════════════════════════════════════════════════════════════════════════════

export const AnimatedFactCardPropsSchema = z.object({
  fact:            z.string().optional().default("31 goals in a single Premier League season."),
  highlightPhrase: z.string().optional().default(""),
  subtext:         z.string().optional().default(""),
  source:          z.string().optional().default(""),
  accentColor:     z.string().optional().default("#C8102E"),
  bgColor:         z.string().optional().default("#f0ece4"),
  darkMode:        z.boolean().default(false),
  worldState: WorldStateSchema.optional(),
  skipIntro: z.boolean().optional().default(false),
});

export type AnimatedFactCardProps = z.infer<typeof AnimatedFactCardPropsSchema>;

// ══════════════════════════════════════════════════════════════════════════════
// TIMING
// ══════════════════════════════════════════════════════════════════════════════

const WORDS_START    = 18;
const WORD_STAGGER   = 8;
const HIGHLIGHT_DELAY = 14;

// ══════════════════════════════════════════════════════════════════════════════
// WORD BUILDER
// ══════════════════════════════════════════════════════════════════════════════

type WordItem = { word: string; isHighlight: boolean; startFrame: number };

function buildWordItems(fact: string, highlightPhrase: string | undefined): WordItem[] {
  const words = fact.split(" ");
  const hlWords = highlightPhrase?.toLowerCase().split(" ") ?? [];
  let frame = WORDS_START;
  return words.map((word) => {
    const isHighlight = hlWords.length > 0 &&
      hlWords.some(hw => word.toLowerCase().replace(/[^a-z0-9]/g, "").includes(hw.replace(/[^a-z0-9]/g, "")));
    const item: WordItem = { word, isHighlight, startFrame: frame };
    frame += WORD_STAGGER;
    return item;
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// ANIMATED WORD
// ══════════════════════════════════════════════════════════════════════════════

const AnimatedWord: React.FC<{
  item:        WordItem;
  frame:       number;
  fps:         number;
  accentColor: string;
  textColor:   string;
  fontSize:    number;
}> = ({ item, frame, fps, accentColor, textColor, fontSize }) => {
  const prog      = spring({ frame: frame - item.startFrame, fps, config: { damping: 22, stiffness: 120 } });
  const opacity   = interpolate(prog, [0, 0.4], [0, 1], { extrapolateRight: "clamp" });
  const translateY = interpolate(prog, [0, 1], [20, 0],  { extrapolateRight: "clamp" });

  const sweepStart = item.startFrame + HIGHLIGHT_DELAY;
  const sweepProg  = item.isHighlight
    ? Math.max(0, Math.min(1, interpolate(frame, [sweepStart, sweepStart + 20], [0, 1], { extrapolateRight: "clamp" })))
    : 0;

  return (
    <span style={{ position: "relative", display: "inline-block", marginRight: fontSize * 0.27 }}>
      {item.isHighlight && (
        <span style={{
          position:        "absolute",
          bottom:          fontSize * 0.04,
          left:            -2,
          right:           -2,
          height:          fontSize * 0.2,
          background:      accentColor,
          borderRadius:    2,
          transformOrigin: "left center",
          transform:       `scaleX(${sweepProg})`,
          opacity:         0.8,
          zIndex:          0,
        }} />
      )}
      <span style={{
        opacity,
        transform:  `translateY(${translateY}px)`,
        display:    "inline-block",
        color:      item.isHighlight && sweepProg > 0.6 ? "#fff" : textColor,
        position:   "relative",
        zIndex:     1,
      }}>
        {item.word}
      </span>
    </span>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

export const AnimatedFactCard: React.FC<AnimatedFactCardProps> = ({
  fact,
  highlightPhrase,
  subtext,
  source,
  accentColor,
  bgColor,
  darkMode,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const textColor  = darkMode ? "#f5f0e8" : COLORS.primary;
  const mutedColor = darkMode ? "rgba(255,255,255,0.45)" : COLORS.muted;
  const wordItems  = buildWordItems(fact, highlightPhrase);
  const lastWordEnd = wordItems.length > 0 ? wordItems[wordItems.length - 1].startFrame + 20 : WORDS_START;

  // Overline slides in
  const overlineProg = spring({ frame: frame - 5, fps, config: SPRINGS.row });

  // Accent rule grows
  const ruleProg = interpolate(frame, [10, 30], [0, 1], { extrapolateRight: "clamp" });

  // Subtext + source
  const subtextProg = spring({ frame: frame - (lastWordEnd + 8), fps, config: SPRINGS.feature });
  const sourceProg  = interpolate(frame, [lastWordEnd + 22, lastWordEnd + 40], [0, 1], { extrapolateRight: "clamp" });

  // Font size: larger, centred, fits ecosystem
  const fontSize = fact.length > 80 ? 58 : fact.length > 50 ? 70 : fact.length > 30 ? 86 : 100;

  return (
    <AbsoluteFill>
      {darkMode ? <DarkBackground /> : <PaperBackground color={bgColor} />}
      <Grain />

      <div style={{
        position:       "absolute",
        inset:          0,
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        justifyContent: "center",
        padding:        "80px 160px",
        textAlign:      "center",
        zIndex:         10,
      }}>
        {/* Overline */}
        <div style={{
          fontFamily,
          fontSize:      13,
          fontWeight:    700,
          letterSpacing: 3.5,
          color:         accentColor,
          textTransform: "uppercase",
          marginBottom:  20,
          opacity:       Math.max(0, Math.min(1, overlineProg)),
        }}>
          Key Fact
        </div>

        {/* Accent rule */}
        <div style={{
          width:        `${ruleProg * 48}px`,
          height:       3,
          background:   accentColor,
          borderRadius: 2,
          marginBottom: 32,
        }} />

        {/* Fact text — centred, large */}
        <div style={{
          fontFamily:    serifFontFamily,
          fontSize,
          fontWeight:    900,
          lineHeight:    1.2,
          letterSpacing: -1.5,
          maxWidth:      1200,
          textAlign:     "center",
        }}>
          {wordItems.map((item, i) => (
            <AnimatedWord
              key={i}
              item={item}
              frame={frame}
              fps={fps}
              accentColor={accentColor}
              textColor={textColor}
              fontSize={fontSize}
            />
          ))}
        </div>

        {/* Subtext */}
        {subtext && (
          <div style={{
            fontFamily,
            fontSize:   22,
            fontWeight: 400,
            color:      mutedColor,
            marginTop:  36,
            maxWidth:   840,
            lineHeight: 1.55,
            opacity:    Math.max(0, Math.min(1, subtextProg)),
            transform:  `translateY(${interpolate(Math.max(0, Math.min(1, subtextProg)), [0, 1], [10, 0])}px)`,
          }}>
            {subtext}
          </div>
        )}

        {/* Source */}
        {source && (
          <div style={{
            fontFamily,
            fontSize:      13,
            fontWeight:    600,
            letterSpacing: 2,
            color:         mutedColor,
            textTransform: "uppercase",
            marginTop:     22,
            opacity:       Math.max(0, Math.min(1, sourceProg)) * 0.5,
          }}>
            {source}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
