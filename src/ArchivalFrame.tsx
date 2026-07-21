/**
 * ArchivalFrame — the archival-footage treatment wrapper (roadmap H4,
 * PRODUCTION_GAP_ANALYSIS §3 row 14).
 *
 * NOT a registered composition — a wrapper that any clip-bearing template
 * mounts around its <Video>/<Img> so every piece of archival footage gets the
 * same treatment the reference applies: letterbox crush, desaturation +
 * temperature grade matched to the canvas, a 1px edge-light separation border,
 * and the recurring `/YEAR` archive tag top-left.
 *
 * Deviation note: finance/kit's SourceTag only supports bottom/top-right
 * corners and themes itself via context (dark-on-dark over footage), so the
 * tag here is a local composition of the SAME kit tokens (TYPE + theme
 * highlight) — identical visual language, video-safe colours, top-left corner.
 */
import React from "react";
import { useCurrentFrame } from "remotion";
import { TYPE, resolveTheme, wipe } from "./finance/kit";

const ArchiveTag: React.FC<{
  label: string;
  corner: "top-left" | "bottom-right";
  delay?: number;
}> = ({ label, corner, delay = 10 }) => {
  const frame = useCurrentFrame();
  const t = resolveTheme("ink");
  const p = wipe(frame, { delay, dur: 16 });
  const cornerStyle: React.CSSProperties =
    corner === "top-left" ? { top: 28, left: 32 } : { bottom: 28, right: 32 };
  return (
    <div
      style={{
        position: "absolute",
        ...cornerStyle,
        display: "flex",
        alignItems: "center",
        gap: 6,
        opacity: p * 0.92,
        fontFamily: TYPE.mono,
        fontSize: TYPE.source,
        fontWeight: TYPE.weight.semibold,
        letterSpacing: 1.6,
        textTransform: "uppercase",
        color: "rgba(236,231,219,0.85)",
        textShadow: "0 1px 2px rgba(0,0,0,0.55)",
        zIndex: 4,
        pointerEvents: "none",
      }}
    >
      <span style={{ color: t.highlight, fontWeight: TYPE.weight.bold }}>/</span>
      {label}
    </div>
  );
};

export const ArchivalFrame: React.FC<{
  /** Archive year — renders the `/1966`-style tag top-left. */
  year?: string;
  /** Secondary source citation — bottom-right, same treatment. */
  source?: string;
  /** Letterbox crush bars (default on). */
  letterbox?: boolean;
  children: React.ReactNode;
}> = ({ year, source, letterbox = true, children }) => {
  const BAR = "11%";
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
      {/* Graded footage — desaturated + slightly warmed toward the canvas */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          filter: "saturate(0.82) contrast(1.04) sepia(0.06)",
        }}
      >
        {children}
      </div>

      {/* Letterbox crush */}
      {letterbox && (
        <>
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: BAR,
              background: "#0b0b0b",
              zIndex: 2,
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: BAR,
              background: "#0b0b0b",
              zIndex: 2,
            }}
          />
        </>
      )}

      {/* 1px edge-light separation border */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          border: "1px solid rgba(255,255,255,0.10)",
          zIndex: 3,
          pointerEvents: "none",
        }}
      />

      {year ? <ArchiveTag label={year} corner="top-left" /> : null}
      {source ? <ArchiveTag label={source} corner="bottom-right" delay={16} /> : null}
    </div>
  );
};
