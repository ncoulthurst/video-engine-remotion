/**
 * OscilloscopeStream — a live line chart scrolling a continuous multi-sine
 * waveform right-to-left with a glowing write-head, a live numeric readout
 * that reacts to a scripted spike event, then eases to a hard brake and
 * freezes.
 *
 * Ported from video-shotcraft's OscilloscopeStreamV2 (chart-live-moves demo
 * pack) — the world-space scrolling math (`effTime`), the composited sine
 * waveform, the spike envelope, the brake easing, and the afterglow tail are
 * all preserved exactly. Colour / type / spacing now resolve from the kit;
 * the readout centre value, spike toggle, and labels are data-driven.
 */
import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { z } from "zod";
import {
  Ground,
  SectionTitle,
  SourceTag,
  GlassCard,
  resolveTheme,
  useOutro,
  formatNum,
  rgbaOf,
  TYPE,
  SPACE,
  baseTemplateSchema,
  type BaseTemplateProps,
} from "./lib/kit";

export const OscilloscopeStreamPropsSchema = z.object({
  ...baseTemplateSchema,
  title: z.string().optional().default("Requests Per Second"),
  subtitle: z.string().optional().default("api-gateway · production · last 60 s"),
  unitLabel: z.string().optional().default("req/s"),
  centerValue: z.number().optional().default(1000),
  spike: z.boolean().optional().default(true),
  ground: z.enum(["paper", "ink", "structure"]).optional().default("structure"),
});
export type OscilloscopeStreamProps = z.input<typeof OscilloscopeStreamPropsSchema> & BaseTemplateProps;

// ── timing / geometry (preserved verbatim from the source) ─────────────────
const CARD_W = 1080;
const CARD_H = 520;
const PAD = 46;
const AXIS_W = 64;
const PLOT_X = PAD + AXIS_W;
const PLOT_W = CARD_W - PAD * 2 - AXIS_W;
const PLOT_H = 280;
const PLOT_Y = 118;
const HOLD = 12;
const FREEZE_START = 100;
const FREEZE_END = 112;
const SPEED = 5.2; // ~35% slower scroll than source
const READOUT_STEP = 5; // readout refreshes every 5 frames (~6/s) instead of every frame — legible
const AMP = 0.72;
const SPIKE_X0 = 288;
const SPIKE_W = 160;

const wave = (x: number) =>
  0.34 * Math.sin(x * 0.021) + 0.27 * Math.sin(x * 0.052 + 1.7) + 0.18 * Math.sin(x * 0.013 + 4.2) + 0.12 * Math.sin(x * 0.087 + 2.3);

function formatCompact(n: number): string {
  if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return `${Math.round(n)}`;
}

export const OscilloscopeStream: React.FC<OscilloscopeStreamProps> = ({
  title = "",
  subtitle = "",
  unitLabel = "req/s",
  centerValue = 1000,
  spike = true,
  ground = "structure",
  accentColor,
  kicker,
  source,
  skipIntro,
  animateOut,
}) => {
  const frame = useCurrentFrame();
  const t = resolveTheme(ground, accentColor);
  const outro = useOutro(animateOut);
  const holdF = skipIntro ? 0 : HOLD;
  const spikeGain = spike ? 1.2 : 0;

  const env = (x: number) => {
    if (x <= SPIKE_X0 || x >= SPIKE_X0 + SPIKE_W) return 1;
    const p = (x - SPIKE_X0) / SPIKE_W;
    return 1 + spikeGain * (0.5 - 0.5 * Math.cos(p * Math.PI * 2));
  };
  const signal = (x: number) => wave(x) * env(x) * AMP;
  const yOf = (x: number) => PLOT_H / 2 - signal(x) * (PLOT_H / 2);
  const valueOf = (x: number) => Math.round(centerValue + signal(x) * centerValue);

  const effTime = (f: number) => {
    const raw = (v: number) => Math.max(v - holdF, 0) * SPEED;
    if (f <= FREEZE_START) return raw(f);
    const brakeDist = (raw(FREEZE_END) - raw(FREEZE_START)) * 0.45;
    return (
      raw(FREEZE_START) +
      interpolate(f, [FREEZE_START, FREEZE_END], [0, brakeDist], { easing: Easing.out(Easing.cubic), extrapolateRight: "clamp" })
    );
  };

  const T = effTime(frame);
  const N = 270;
  const pts: string[] = [];
  for (let i = 0; i <= N; i++) {
    const px = (i / N) * PLOT_W;
    const worldX = T - (PLOT_W - px);
    pts.push(`${px.toFixed(2)},${yOf(worldX).toFixed(2)}`);
  }
  const headY = yOf(T);
  const frozen = frame >= FREEZE_END;
  const glowOp = interpolate(frame, [FREEZE_START, FREEZE_END], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const TAIL = 160;
  const tailPts: string[] = [];
  if (!frozen) {
    for (let i = 0; i <= 40; i++) {
      const px = PLOT_W - TAIL + (i / 40) * TAIL;
      const worldX = T - (PLOT_W - px);
      tailPts.push(`${px.toFixed(2)},${yOf(worldX).toFixed(2)}`);
    }
  }

  const spikeK = spikeGain > 0 ? Math.min(Math.max((env(T) - 1) / spikeGain, 0), 1) : 0;
  const hot = spikeK > 0.22;
  // the digits update on a stepped cadence (not every frame) so the number
  // can actually be read, while the waveform/glow keep moving continuously
  const Tread = effTime(Math.floor(frame / READOUT_STEP) * READOUT_STEP);
  const readout = formatNum(valueOf(Tread), 0);
  const readScale = 1 + 0.32 * spikeK;
  const dotColor = spikeK > 0.15 ? t.accent : t.ink;

  const Y_TICKS = [4, 3, 2, 1, 0].map((i) => formatCompact(centerValue * 2 * (i / 4)));
  const X_TICKS = Array.from({ length: 7 }, (_, i) => (i === 6 ? "now" : `-${(6 - i) * 10}s`));

  return (
    <Ground ground={ground} accentColor={accentColor} skipIntro={skipIntro} focus={{ x: 0.5, y: 0.4 }}>
      <div style={{ height: "100%", display: "flex", flexDirection: "column", gap: SPACE[10], ...outro }}>
        <SectionTitle title={title} kicker={kicker ?? "Live Stream"} dek={subtitle} theme={t} frame={frame} delay={0} align="center" />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <GlassCard theme={t} style={{ width: CARD_W, height: CARD_H, overflow: "visible" }}>
            {/* live numeric readout — top-right, reacts to the spike */}
            <div
              style={{
                position: "absolute",
                right: PAD,
                top: PAD - 8,
                textAlign: "right",
                fontFamily: TYPE.sans,
                transform: `scale(${readScale.toFixed(4)})`,
                transformOrigin: "right top",
              }}
            >
              <div style={{ fontSize: 46, fontWeight: TYPE.weight.heavy, color: hot ? t.accent : t.ink, fontVariantNumeric: "tabular-nums", letterSpacing: -1 }}>
                {readout}
              </div>
              <div style={{ fontFamily: TYPE.mono, fontSize: TYPE.label, fontWeight: TYPE.weight.semibold, color: hot ? t.accent : t.muted, marginTop: SPACE[1], letterSpacing: 1 }}>
                {unitLabel} · live
              </div>
            </div>

            {Y_TICKS.map((tk, i) => (
              <div
                key={`yt${i}`}
                style={{
                  position: "absolute",
                  left: 0,
                  top: PLOT_Y + (PLOT_H / 4) * i - 11,
                  width: AXIS_W - 8,
                  textAlign: "right",
                  fontFamily: TYPE.mono,
                  fontSize: 20,
                  fontWeight: TYPE.weight.semibold,
                  color: t.muted,
                }}
              >
                {tk}
              </div>
            ))}

            <div style={{ position: "absolute", left: PLOT_X, top: PLOT_Y, width: PLOT_W, height: PLOT_H }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={`h${i}`} style={{ position: "absolute", left: 0, right: 0, top: (PLOT_H / 4) * i, height: 2, background: t.line, opacity: 0.7 }} />
              ))}
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <div key={`v${i}`} style={{ position: "absolute", top: 0, bottom: 0, left: (PLOT_W / 6) * i, width: 2, background: t.line, opacity: 0.45 }} />
              ))}
              <svg width={PLOT_W} height={PLOT_H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
                <polyline points={pts.join(" ")} fill="none" stroke={t.ink} strokeWidth={5} strokeLinejoin="round" strokeLinecap="round" />
                {!frozen && glowOp > 0 && (
                  <polyline
                    points={tailPts.join(" ")}
                    fill="none"
                    stroke={rgbaOf(t.muted, 1)}
                    strokeWidth={9}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={0.55 * glowOp}
                    style={{ filter: "blur(2px)" }}
                  />
                )}
                {!frozen && glowOp > 0 && (
                  <>
                    <circle cx={PLOT_W} cy={headY} r={24} fill={spikeK > 0.15 ? t.accent : t.muted} opacity={0.35 * glowOp} style={{ filter: "blur(5px)" }} />
                    <circle cx={PLOT_W} cy={headY} r={10.5} fill={dotColor} opacity={glowOp} />
                  </>
                )}
              </svg>
            </div>

            <div style={{ position: "absolute", left: PLOT_X, top: PLOT_Y + PLOT_H + 14, width: PLOT_W }}>
              {X_TICKS.map((tx, i) => (
                <div
                  key={`xt${i}`}
                  style={{
                    position: "absolute",
                    left: (PLOT_W / 6) * i - 40,
                    width: 80,
                    textAlign: "center",
                    fontFamily: TYPE.mono,
                    fontSize: 19,
                    fontWeight: TYPE.weight.semibold,
                    color: t.muted,
                  }}
                >
                  {tx}
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
      <SourceTag source={source} theme={t} frame={frame} delay={20} />
    </Ground>
  );
};
