import React from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { z } from "zod";
import {
  Grain, PaperBackground,
  COLORS, SPRINGS, fontFamily, serifFontFamily, SmartImg, WorldStateSchema
} from "./shared";

const IncidentSchema = z.object({
  date:      z.string().optional().default(""),
  incident:  z.string().optional().default(""),
  ban:       z.string().optional().default(""),
  club:      z.string().optional().default(""),
  badgeSlug: z.string().optional().default(""),
  clubColor: z.string().optional().default(""),
  severity:  z.enum(["serious", "warning", "minor"]).optional(),
});

export const DisciplinaryRecordPropsSchema = z.object({
  playerName: z.string().optional().default("Player Name"),
  badgeSlug:  z.string().optional().default(""),
  incidents:  z.array(IncidentSchema).optional(),
  bgColor:    z.string().optional().default("#f0ece4"),
  // Track E — portrait backfill via shared.SmartImg
  playerImage: z.string().optional().default(""),
  worldState: WorldStateSchema.optional(),
  skipIntro: z.boolean().optional().default(false),
});

export const DisciplinaryPropsSchema = DisciplinaryRecordPropsSchema;
export type DisciplinaryRecordProps = z.infer<typeof DisciplinaryRecordPropsSchema>;

const SEVERITY_COLORS = {
  serious: { bg: "rgba(200,30,30,0.10)", border: "rgba(200,30,30,0.35)", pill: "#c81e1e", label: "Serious" },
  warning: { bg: "rgba(220,140,0,0.10)", border: "rgba(220,140,0,0.35)", pill: "#dc8c00", label: "Warning" },
  minor:   { bg: "rgba(80,80,80,0.06)",  border: "rgba(0,0,0,0.10)",     pill: "#666",    label: "Minor"   },
};

const CardIcon: React.FC<{ severity: "serious" | "warning" | "minor" }> = ({ severity }) => {
  const color = severity === "serious" ? "#c81e1e" : severity === "warning" ? "#dc8c00" : "#999";
  return (
    <svg width={22} height={30} viewBox="0 0 22 30" fill="none">
      <rect x="1" y="1" width="20" height="28" rx="3" fill={color} stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
    </svg>
  );
};

export const DisciplinaryRecord: React.FC<DisciplinaryRecordProps> = ({
  playerName, badgeSlug, incidents: incidentsProp, bgColor = "#f0ece4", skipIntro = false,
}) => {
  const incidents = incidentsProp ?? [];
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerScale = skipIntro ? 1 : spring({ frame, fps, from: 0.88, to: 1, config: SPRINGS.header });
  const headerOp    = skipIntro ? 1 : interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const dividerW    = skipIntro ? 1 : spring({ frame, fps, from: 0, to: 1, config: SPRINGS.cols, delay: 12 });

  const STAGGER = 14;
  const LIST_START = 28;

  return (
    <AbsoluteFill>
      <PaperBackground color={bgColor} />
      <Grain />

      {/* Content area */}
      <div style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        padding: "52px 140px 48px",
      }}>
        {/* Header */}
        <div style={{
          transform: `scale(${headerScale})`,
          transformOrigin: "left center",
          opacity: headerOp,
          display: "flex",
          alignItems: "center",
          gap: 20,
          marginBottom: 10,
        }}>
          {badgeSlug ? (
            <SmartImg src={badgeSlug} style={{ width: 56, height: 56, objectFit: "contain" }} />
          ) : null}
          <div>
            <div style={{
              fontFamily,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 3,
              color: COLORS.muted,
              textTransform: "uppercase",
              marginBottom: 4,
            }}>
              Disciplinary Record
            </div>
            <div style={{
              fontFamily: serifFontFamily,
              fontSize: 46,
              fontWeight: 900,
              color: COLORS.primary,
              letterSpacing: -1.5,
              lineHeight: 1,
            }}>
              {playerName}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{
          height: 2,
          background: `linear-gradient(90deg, #c81e1e ${dividerW * 100}%, transparent ${dividerW * 100}%)`,
          marginBottom: 28,
          opacity: 0.6,
        }} />

        {/* Incidents list */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, overflow: "hidden" }}>
          {incidents.map((inc, i) => {
            const delay = LIST_START + i * STAGGER;
            const rowX  = skipIntro ? 0 : spring({ frame, fps, from: -40, to: 0, config: SPRINGS.row, delay });
            const rowOp = skipIntro ? 1 : interpolate(frame, [delay, delay + 16], [0, 1], { extrapolateRight: "clamp" });
            const sev = SEVERITY_COLORS[inc.severity ?? "warning"];

            return (
              <div
                key={i}
                style={{
                  transform: `translateX(${rowX}px)`,
                  opacity: rowOp,
                  display: "flex",
                  alignItems: "center",
                  gap: 18,
                  backgroundColor: sev.bg,
                  border: `1px solid ${sev.border}`,
                  borderRadius: 12,
                  padding: "14px 20px",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Left severity stripe */}
                <div style={{
                  position: "absolute",
                  left: 0, top: 0, bottom: 0,
                  width: 4,
                  borderRadius: "12px 0 0 12px",
                  backgroundColor: sev.pill,
                }} />

                {/* Card icon */}
                <div style={{ paddingLeft: 8, flexShrink: 0 }}>
                  <CardIcon severity={inc.severity} />
                </div>

                {/* Date */}
                <div style={{
                  fontFamily,
                  fontSize: 13,
                  fontWeight: 600,
                  color: COLORS.muted,
                  width: 90,
                  flexShrink: 0,
                }}>
                  {inc.date}
                </div>

                {/* Incident description */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontFamily,
                    fontSize: 17,
                    fontWeight: 700,
                    color: COLORS.primary,
                    lineHeight: 1.3,
                  }}>
                    {inc.incident}
                  </div>
                  {inc.club ? (
                    <div style={{
                      fontFamily,
                      fontSize: 13,
                      color: COLORS.secondary,
                      marginTop: 2,
                    }}>
                      {inc.club}
                    </div>
                  ) : null}
                </div>

                {/* Ban pill */}
                {inc.ban ? (
                  <div style={{
                    fontFamily,
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#fff",
                    backgroundColor: sev.pill,
                    borderRadius: 20,
                    padding: "4px 12px",
                    letterSpacing: 0.5,
                    flexShrink: 0,
                  }}>
                    {inc.ban}
                  </div>
                ) : null}

                {/* Club badge */}
                {inc.badgeSlug ? (
                  <SmartImg
                    src={inc.badgeSlug}
                    style={{ width: 32, height: 32, objectFit: "contain", flexShrink: 0 }}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
