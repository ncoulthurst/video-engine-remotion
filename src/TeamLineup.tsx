import React from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { z } from "zod";
import {
  Grain, PaperBackground, serifFontFamily,
  COLORS, fontFamily, SmartImg, hexToRgb,
} from "./shared";

// ── Schema ─────────────────────────────────────────────────────────────────────

const PlayerSchema = z.object({
  name:          z.string(),
  number:        z.number(),
  x:             z.number(),  // 0–100 left→right
  y:             z.number(),  // 0=keeper end (bottom), 100=attacker end (top)
  isCaptain:     z.boolean().optional(),
  positionLabel: z.string().optional(), // e.g. "GK", "RB", "CB", "LB", "DM", "CM", "RW", "ST", "LW"
  appearFrame:   z.number().default(0), // frame at which this player animates in (narration-driven)
});

export const TeamLineupPropsSchema = z.object({
  teamName:           z.string(),
  formation:          z.string(),
  badgeSlug:          z.string().optional(),
  teamColor:          z.string().optional(),
  opposition:         z.string().optional(),
  date:               z.string().optional(),
  players:            z.array(PlayerSchema),
  managerName:        z.string().optional(),
  managerTitle:       z.string().optional(),
  managerNationality: z.string().optional(),
  managerImageSlug:   z.string().optional(),
  infoAppearFrame:    z.number().default(0), // frame at which the left panel animates in
  bgColor:            z.string().default("#f0ece4"),
});

export type TeamLineupProps = z.infer<typeof TeamLineupPropsSchema>;

// ── Layout ─────────────────────────────────────────────────────────────────────

const PANEL_W  = 720;               // 40% info panel (left)
const PITCH_X  = PANEL_W + 24;      // 24px gap between panel and pitch
const PITCH_Y  = 50;
const PITCH_W  = 1920 - PITCH_X - 24; // ~60% of screen width
const PITCH_H  = 1080 - PITCH_Y * 2;

const DOT_R    = 38; // player circle radius — much larger for readability

// ── Position grouping ─────────────────────────────────────────────────────────

function positionGroup(y: number): number {
  if (y < 20) return 0;  // GK
  if (y < 45) return 1;  // DEF
  if (y < 68) return 2;  // MID
  return 3;               // ATK
}

// ── Pitch markings ────────────────────────────────────────────────────────────

const PitchMarkings: React.FC<{ w: number; h: number }> = ({ w, h }) => {
  const sw  = 1.8;
  const col = "rgba(255,255,255,0.75)";
  const cx  = w / 2;
  const cy  = h / 2;
  const pbW = w * 0.63;  const pbH = h * 0.165;
  const gbW = w * 0.35;  const gbH = h * 0.055;
  const pSpotDist = h * 0.123;
  const circleR   = Math.min(w, h) * 0.094;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" style={{ position: "absolute", top: 0, left: 0 }}>
      <rect x={sw/2} y={sw/2} width={w-sw} height={h-sw} stroke={col} strokeWidth={sw} rx={4} />
      <line x1={0} y1={cy} x2={w} y2={cy} stroke={col} strokeWidth={sw} />
      <circle cx={cx} cy={cy} r={circleR} stroke={col} strokeWidth={sw} />
      <circle cx={cx} cy={cy} r={3} fill={col} />
      <rect x={(w-pbW)/2} y={0}      width={pbW} height={pbH}  stroke={col} strokeWidth={sw} />
      <rect x={(w-gbW)/2} y={0}      width={gbW} height={gbH}  stroke={col} strokeWidth={sw} />
      <circle cx={cx} cy={pSpotDist} r={3} fill={col} />
      <path d={`M ${cx-circleR*0.78},${pbH} A ${circleR},${circleR} 0 0 0 ${cx+circleR*0.78},${pbH}`} stroke={col} strokeWidth={sw} fill="none" />
      <rect x={(w-pbW)/2} y={h-pbH}  width={pbW} height={pbH}  stroke={col} strokeWidth={sw} />
      <rect x={(w-gbW)/2} y={h-gbH}  width={gbW} height={gbH}  stroke={col} strokeWidth={sw} />
      <circle cx={cx} cy={h-pSpotDist} r={3} fill={col} />
      <path d={`M ${cx-circleR*0.78},${h-pbH} A ${circleR},${circleR} 0 0 1 ${cx+circleR*0.78},${h-pbH}`} stroke={col} strokeWidth={sw} fill="none" />
      <path d={`M 0,12 A 12,12 0 0 1 12,0`}             stroke={col} strokeWidth={sw} fill="none" />
      <path d={`M ${w-12},0 A 12,12 0 0 1 ${w},12`}     stroke={col} strokeWidth={sw} fill="none" />
      <path d={`M 0,${h-12} A 12,12 0 0 0 12,${h}`}     stroke={col} strokeWidth={sw} fill="none" />
      <path d={`M ${w-12},${h} A 12,12 0 0 0 ${w},${h-12}`} stroke={col} strokeWidth={sw} fill="none" />
    </svg>
  );
};

const GrassStripes: React.FC<{ w: number; h: number; count?: number }> = ({ w, h, count = 16 }) => {
  const stripeH = h / count;
  const colors  = ["#297a3e", "#2f8f48"];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", top: 0, left: 0, borderRadius: 10 }}>
      {Array.from({ length: count }).map((_, i) => (
        <rect key={i} x={0} y={i * stripeH} width={w} height={stripeH} fill={colors[i % 2]} />
      ))}
    </svg>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

export const TeamLineup: React.FC<TeamLineupProps> = ({
  teamName, formation, badgeSlug, teamColor = "#C8102E",
  opposition, date, players,
  managerName, managerTitle = "Manager", managerNationality, managerImageSlug,
  infoAppearFrame = 0,
  bgColor = "#f0ece4",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const [cr, cg, cb] = hexToRgb(teamColor);

  // ── Info panel animation ──────────────────────────────────────────────────
  const infoOp = interpolate(frame, [infoAppearFrame, infoAppearFrame + 22], [0, 1], { extrapolateRight: "clamp" });
  const infoX  = spring({ frame: frame - infoAppearFrame, fps, from: -50, to: 0, config: { damping: 22, stiffness: 70 } });

  // ── Pitch animation ───────────────────────────────────────────────────────
  const pitchOp    = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const pitchScale = spring({ frame, fps, from: 0.97, to: 1, config: { damping: 22, stiffness: 60 } });

  // List order follows narration order (appearFrame) — always correct regardless of y coordinates.
  // Pitch positions are still driven by x/y coordinates independently.
  const sortedPlayers = [...players].sort((a, b) => a.appearFrame - b.appearFrame);

  return (
    <AbsoluteFill>
      <PaperBackground color={bgColor} />
      <Grain />

      {/* ── Left info panel ─────────────────────────────────────────────── */}
      <div style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: PANEL_W,
        bottom: 0,
        padding: "52px 52px",
        opacity: infoOp,
        transform: `translateX(${infoX}px)`,
        display: "flex",
        flexDirection: "column",
      }}>

        {/* Badge */}
        {badgeSlug && (
          <SmartImg
            src={`badges/${badgeSlug}`}
            style={{ width: 96, height: 96, objectFit: "contain", marginBottom: 20 }}
          />
        )}

        {/* Team name */}
        <div style={{
          fontFamily: serifFontFamily,
          fontSize: 52,
          fontWeight: 900,
          color: COLORS.primary,
          letterSpacing: -2,
          lineHeight: 1,
          marginBottom: 14,
        }}>
          {teamName}
        </div>

        {/* Formation pill */}
        <div style={{
          display: "inline-flex",
          alignSelf: "flex-start",
          backgroundColor: teamColor,
          borderRadius: 24,
          padding: "6px 18px",
          fontFamily,
          fontSize: 18,
          fontWeight: 800,
          color: "#fff",
          letterSpacing: 1,
          marginBottom: 16,
        }}>
          {formation}
        </div>

        {/* Date / opposition */}
        {(date || opposition) && (
          <div style={{ marginBottom: 20 }}>
            {opposition && (
              <div style={{
                fontFamily,
                fontSize: 22,
                fontWeight: 700,
                color: COLORS.secondary,
                letterSpacing: -0.3,
                lineHeight: 1.2,
              }}>
                vs {opposition}
              </div>
            )}
            {date && (
              <div style={{
                fontFamily,
                fontSize: 17,
                fontWeight: 500,
                color: COLORS.muted,
                letterSpacing: 0.3,
                marginTop: 4,
              }}>
                {date}
              </div>
            )}
          </div>
        )}

        {/* Accent divider */}
        <div style={{
          height: 2,
          background: `linear-gradient(90deg, ${teamColor}, transparent)`,
          marginBottom: 24,
          opacity: 0.7,
        }} />

        {/* Player list — each row uses the player's appearFrame */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, overflow: "hidden" }}>
          {sortedPlayers.map((p, i) => {
            const delay = p.appearFrame;
            const rowOp = interpolate(frame, [delay, delay + 14], [0, 1], { extrapolateRight: "clamp" });
            const rowX  = spring({ frame: frame - delay, fps, from: -28, to: 0, config: { damping: 17, stiffness: 145 } });

            return (
              <div
                key={i}
                style={{
                  opacity: rowOp,
                  transform: `translateX(${rowX}px)`,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "6px 10px",
                  borderRadius: 8,
                  backgroundColor: "rgba(0,0,0,0.03)",
                }}
              >
                {/* Number badge */}
                <div style={{
                  width: 32, height: 32,
                  borderRadius: "50%",
                  background: `rgba(${cr},${cg},${cb},0.15)`,
                  border: `2px solid rgba(${cr},${cg},${cb},0.4)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily, fontSize: 13, fontWeight: 800, color: teamColor,
                  flexShrink: 0,
                }}>
                  {p.number}
                </div>

                {/* Name */}
                <div style={{
                  flex: 1,
                  fontFamily,
                  fontSize: 16,
                  fontWeight: 600,
                  color: COLORS.primary,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const,
                }}>
                  {p.name}
                </div>

                {/* Position label */}
                {p.positionLabel && (
                  <div style={{
                    fontFamily, fontSize: 20, fontWeight: 700,
                    letterSpacing: 0.5,
                    color: COLORS.muted,
                    textTransform: "uppercase" as const,
                    flexShrink: 0,
                  }}>
                    {p.positionLabel}
                  </div>
                )}

                {/* Captain badge */}
                {p.isCaptain && (
                  <div style={{
                    fontFamily, fontSize: 11, fontWeight: 800,
                    color: COLORS.gold,
                    border: `1.5px solid ${COLORS.gold}`,
                    borderRadius: 4,
                    padding: "2px 6px",
                    flexShrink: 0,
                  }}>
                    C
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Coach section */}
        {managerName && (
          <div style={{ marginTop: 20, paddingTop: 18, borderTop: `1px solid rgba(0,0,0,0.08)` }}>
            {/* Label */}
            <div style={{
              fontFamily,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 2.5,
              color: COLORS.muted,
              textTransform: "uppercase" as const,
              marginBottom: 12,
            }}>
              {managerTitle}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {/* Avatar */}
              <div style={{
                width: 72, height: 72,
                borderRadius: "50%",
                overflow: "hidden",
                flexShrink: 0,
                background: `rgba(${cr},${cg},${cb},0.12)`,
                border: `3px solid rgba(${cr},${cg},${cb},0.35)`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {managerImageSlug
                  ? <SmartImg src={`badges/${managerImageSlug}`} style={{ width: 72, height: 72, objectFit: "cover" as const }} />
                  : <span style={{ fontFamily: serifFontFamily, fontSize: 26, fontWeight: 900, color: teamColor }}>
                      {managerName.split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
                    </span>
                }
              </div>

              {/* Name + nationality */}
              <div style={{ overflow: "hidden" }}>
                <div style={{
                  fontFamily: serifFontFamily,
                  fontSize: 28,
                  fontWeight: 900,
                  color: COLORS.primary,
                  letterSpacing: -1,
                  lineHeight: 1,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const,
                }}>
                  {managerName}
                </div>
                {managerNationality && (
                  <div style={{
                    fontFamily,
                    fontSize: 14,
                    fontWeight: 500,
                    color: COLORS.muted,
                    marginTop: 5,
                    letterSpacing: 0.3,
                  }}>
                    {managerNationality}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Pitch ──────────────────────────────────────────────────────── */}
      <div style={{
        position: "absolute",
        left: PITCH_X,
        top: PITCH_Y,
        width: PITCH_W,
        height: PITCH_H,
        borderRadius: 10,
        overflow: "hidden",
        opacity: pitchOp,
        transform: `scale(${pitchScale})`,
        transformOrigin: "center center",
        boxShadow: "0 8px 40px rgba(0,0,0,0.35)",
      }}>
        <GrassStripes w={PITCH_W} h={PITCH_H} />
        <PitchMarkings w={PITCH_W} h={PITCH_H} />

        {/* Edge vignette */}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse 90% 90% at center, transparent 55%, rgba(0,0,0,0.22) 100%)",
          pointerEvents: "none",
        }} />

        {/* Players on pitch — each fades in at their appearFrame */}
        {players.map((p, i) => {
          const delay = p.appearFrame;
          const sc    = spring({ frame: frame - delay, fps, from: 0, to: 1, config: { damping: 18, stiffness: 140 } });
          const pOp   = interpolate(frame, [delay, delay + 16], [0, 1], { extrapolateRight: "clamp" });

          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: (p.x / 100) * PITCH_W - DOT_R,
                top:  (1 - p.y / 100) * PITCH_H - DOT_R,
                opacity: pOp,
                transform: `scale(${sc})`,
                transformOrigin: "center center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              {/* Club colour circle */}
              <div style={{
                width: DOT_R * 2,
                height: DOT_R * 2,
                borderRadius: "50%",
                background: teamColor,
                border: "3px solid #fff",
                boxShadow: `0 2px 10px rgba(0,0,0,0.45), 0 0 0 1px rgba(${cr},${cg},${cb},0.3)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily,
                fontSize: 20,
                fontWeight: 900,
                color: "#fff",
              }}>
                {p.number}
              </div>

              {/* Surname label */}
              <div style={{
                fontFamily,
                fontSize: 17,
                fontWeight: 700,
                color: "#fff",
                letterSpacing: 0.3,
                textShadow: "0 1px 5px rgba(0,0,0,0.98), 0 0 10px rgba(0,0,0,0.9)",
                marginTop: 6,
                maxWidth: 120,
                textAlign: "center" as const,
                lineHeight: 1.1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap" as const,
              }}>
                {p.name.split(" ").pop()}
              </div>

              {/* Captain dot */}
              {p.isCaptain && (
                <div style={{
                  position: "absolute",
                  top: -4, right: -4,
                  width: 14, height: 14,
                  borderRadius: "50%",
                  background: COLORS.gold,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily, fontSize: 8, fontWeight: 900, color: "#fff",
                }}>
                  C
                </div>
              )}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
