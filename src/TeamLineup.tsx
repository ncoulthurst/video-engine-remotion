import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { z } from "zod";
import {
  serifFontFamily,
  COLORS, fontFamily, SmartImg, hexToRgb, WorldStateSchema
} from "./shared";
import { Ground, EASE, prog } from "./lib/kit";

// ── Schema ─────────────────────────────────────────────────────────────────────

const PlayerSchema = z.object({
  name:          z.string().optional().default(""),
  number:        z.number(),
  x:             z.number(),  // 0–100 left→right
  y:             z.number(),  // 0=keeper end (bottom), 100=attacker end (top)
  isCaptain:     z.boolean().optional(),
  positionLabel: z.string().optional().default(""), // e.g. "GK", "RB", "CB", "LB", "DM", "CM", "RW", "ST", "LW"
  appearFrame:   z.number().default(0), // frame at which this player animates in (narration-driven)
});

export const TeamLineupPropsSchema = z.object({
  teamName:           z.string().optional().default("Team Name"),
  formation:          z.string().optional().default("4-3-3"),
  badgeSlug:          z.string().optional().default(""),
  teamColor:          z.string().optional().default(""),
  opposition:         z.string().optional().default(""),
  date:               z.string().optional().default(""),
  players:            z.array(PlayerSchema),
  managerName:        z.string().optional().default(""),
  managerTitle:       z.string().optional().default(""),
  managerNationality: z.string().optional().default(""),
  managerImageSlug:   z.string().optional().default(""),
  infoAppearFrame:    z.number().default(0), // frame at which the left panel animates in
  bgColor:            z.string().optional().default("#f0ece4"),
  skipIntro:          z.boolean().optional().default(false),
  worldState:         WorldStateSchema.optional(),
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
  opposition, date, players = [],
  managerName, managerTitle = "Manager", managerNationality, managerImageSlug,
  infoAppearFrame = 0,
  bgColor = "#f0ece4",
  skipIntro = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const [cr, cg, cb] = hexToRgb(teamColor);

  // ── Info panel animation ──────────────────────────────────────────────────
  const infoOp = skipIntro ? 1 : interpolate(frame, [infoAppearFrame, infoAppearFrame + 22], [0, 1], { extrapolateRight: "clamp" });
  const infoX  = skipIntro ? 0 : interpolate(prog(frame, infoAppearFrame, 22, EASE.snap), [0, 1], [-50, 0]);

  // ── Pitch SaaS Float-In entry ────────────────────────────────────────────
  // Same cinematic plane drop used in HeroTactical: drops down + comes
  // forward + un-tilts, all driven off one eased progress with the iOS
  // easeOutExpo curve. The pitch is the dominant subject plane here, so it
  // earns the hero entry.
  const ENTRY_DUR    = 52;
  const RESTING_TILT = 6;
  const entryProg = skipIntro ? 1 : prog(frame, 0, ENTRY_DUR, EASE.soft);
  const pitchOp        = skipIntro ? 1 : interpolate(entryProg, [0, 0.55], [0, 1], { extrapolateRight: "clamp" });
  const entryTranslateY = interpolate(entryProg, [0, 1], [-140, 0]);
  const entryTranslateZ = interpolate(entryProg, [0, 1], [-220, 0]);
  const entryRotateX   = interpolate(entryProg, [0, 1], [32, RESTING_TILT]);
  const entryScale     = interpolate(entryProg, [0, 1], [0.92, 1.0]);
  // Players + labels enter only after the plane has substantially settled
  const PLAYER_GATE = 50;

  // List order follows narration order (appearFrame) — always correct regardless of y coordinates.
  // Pitch positions are still driven by x/y coordinates independently.
  const sortedPlayers = [...players].sort((a, b) => a.appearFrame - b.appearFrame);

  return (
    <Ground ground="paper" bgColor={bgColor} accentColor={teamColor} domain="football" texture skipIntro={skipIntro} pad={0}>

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
            const delay = typeof p.appearFrame === 'number' ? p.appearFrame : i * 8;
            const rowOp = skipIntro ? 1 : interpolate(frame, [delay, delay + 14], [0, 1], { extrapolateRight: "clamp" });
            const rowX  = skipIntro ? 0 : interpolate(prog(frame, delay, 16, EASE.snap), [0, 1], [-28, 0]);

            return (
              <div
                key={i}
                style={{
                  opacity: rowOp,
                  transform: `translateX(${rowX}px)`,
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "10px 14px",
                  borderRadius: 8,
                  backgroundColor: "rgba(0,0,0,0.03)",
                }}
              >
                {/* Number badge */}
                <div style={{
                  width: 36, height: 36,
                  borderRadius: "50%",
                  background: `rgba(${cr},${cg},${cb},0.15)`,
                  border: `2px solid rgba(${cr},${cg},${cb},0.4)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily, fontSize: 14, fontWeight: 800, color: teamColor,
                  flexShrink: 0,
                }}>
                  {p.number}
                </div>

                {/* Name — primary hierarchy on this row */}
                <div style={{
                  flex: 1,
                  fontFamily,
                  fontSize: 19,
                  fontWeight: 600,
                  color: COLORS.primary,
                  letterSpacing: -0.2,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const,
                }}>
                  {p.name}
                </div>

                {/* Position label — small caps, muted, never larger than name */}
                {p.positionLabel && (
                  <div style={{
                    fontFamily, fontSize: 12, fontWeight: 700,
                    letterSpacing: 2,
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

      {/* ── Pitch — SaaS float-in plane ─────────────────────────────────── */}
      {/* Perspective parent: required for rotateX to render in 3D space */}
      <div style={{
        position: "absolute",
        left: PITCH_X,
        top: PITCH_Y,
        width: PITCH_W,
        height: PITCH_H,
        perspective: "2400px",
        perspectiveOrigin: "50% 50%",
      }}>
        <div style={{
          position: "absolute",
          inset: 0,
          borderRadius: 10,
          overflow: "hidden",
          opacity: pitchOp,
          transform: `translateY(${entryTranslateY}px) translateZ(${entryTranslateZ}px) rotateX(${entryRotateX}deg) scale(${entryScale})`,
          transformOrigin: "50% 100%",
          transformStyle: "preserve-3d",
          boxShadow: "0 12px 60px rgba(0,0,0,0.45)",
        }}>
          <GrassStripes w={PITCH_W} h={PITCH_H} />
          <PitchMarkings w={PITCH_W} h={PITCH_H} />

          {/* Edge vignette */}
          <div style={{
            position: "absolute", inset: 0,
            background: "radial-gradient(ellipse 90% 90% at center, transparent 55%, rgba(0,0,0,0.22) 100%)",
            pointerEvents: "none",
          }} />

          {/* Players on pitch — gated until plane substantially settles */}
          {players.map((p, i) => {
            const baseDelay = typeof p.appearFrame === 'number' ? p.appearFrame : i * 8;
            const delay     = skipIntro ? baseDelay : Math.max(baseDelay, PLAYER_GATE + i * 3);
            const sc    = skipIntro ? 1 : prog(frame, delay, 16, EASE.snap);
            const pOp   = skipIntro ? 1 : interpolate(frame, [delay, delay + 16], [0, 1], { extrapolateRight: "clamp" });

            // Counter-rotate the current plane tilt so labels billboard the
            // camera throughout the entry instead of lying flat on the pitch.
            const counterRotate = `rotateX(${-entryRotateX}deg)`;

            const surname = p.name.split(" ").pop() || p.name;

            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: (p.x / 100) * PITCH_W - DOT_R,
                  top:  (1 - p.y / 100) * PITCH_H - DOT_R,
                  opacity: pOp,
                  transform: `scale(${sc}) ${counterRotate}`,
                  transformOrigin: "center center",
                  transformStyle: "preserve-3d",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  width: DOT_R * 2,
                }}
              >
                {/* Layered node — outer ring, inner club-colour disc, number on top */}
                <div style={{
                  position: "relative",
                  width: DOT_R * 2,
                  height: DOT_R * 2,
                  filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.55))",
                }}>
                  {/* Outer ring — translucent white halo for depth on grass */}
                  <div style={{
                    position: "absolute",
                    inset: -3,
                    borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.55)",
                  }} />
                  {/* Inner disc — solid team colour with subtle radial sheen */}
                  <div style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "50%",
                    background: `radial-gradient(circle at 35% 28%, rgba(255,255,255,0.18), rgba(255,255,255,0) 55%), ${teamColor}`,
                    border: `3px solid #fff`,
                    boxShadow: `inset 0 -3px 6px rgba(0,0,0,0.22), 0 0 0 1px rgba(${cr},${cg},${cb},0.45)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily,
                    fontSize: 22,
                    fontWeight: 900,
                    color: "#fff",
                    letterSpacing: -0.5,
                    fontFeatureSettings: '"tnum" 1, "lnum" 1',
                  }}>
                    {p.number}
                  </div>

                  {/* Captain badge — top-right, gold ring */}
                  {p.isCaptain && (
                    <div style={{
                      position: "absolute",
                      top: -6, right: -6,
                      width: 22, height: 22,
                      borderRadius: "50%",
                      background: COLORS.gold,
                      border: "2px solid #111",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily, fontSize: 11, fontWeight: 900, color: "#111",
                      letterSpacing: 0.3,
                      boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
                    }}>
                      C
                    </div>
                  )}
                </div>

                {/* Surname label — solid scrim pill, uppercase, tracked */}
                <div style={{
                  marginTop: 8,
                  padding: "4px 10px",
                  borderRadius: 3,
                  background: "rgba(15,15,15,0.85)",
                  border: `1px solid rgba(${cr},${cg},${cb},0.5)`,
                  maxWidth: 160,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.45)",
                }}>
                  <div style={{
                    fontFamily,
                    fontSize: 14,
                    fontWeight: 800,
                    color: "#fff",
                    letterSpacing: 1.5,
                    textAlign: "center" as const,
                    lineHeight: 1.05,
                    textTransform: "uppercase" as const,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap" as const,
                  }}>
                    {surname}
                  </div>
                  {p.positionLabel && (
                    <div style={{
                      fontFamily,
                      fontSize: 9,
                      fontWeight: 700,
                      color: `rgba(${cr},${cg},${cb},0.95)`,
                      letterSpacing: 2,
                      textAlign: "center" as const,
                      lineHeight: 1,
                      marginTop: 2,
                      textTransform: "uppercase" as const,
                    }}>
                      {p.positionLabel}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Ground>
  );
};
