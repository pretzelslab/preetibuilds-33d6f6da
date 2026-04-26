import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { useVisitLogger } from "@/hooks/useVisitLogger";
import { PageGate } from "@/components/ui/PageGate";
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer,
} from "recharts";

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_DAYS = 365;

const MODELS = {
  bloom: {
    label:            "BLOOM 176B",
    trainingKg:       433_000,
    inferPerMTokenKg: 4.0,
    source:           "Luccioni et al. 2022",
  },
  llama7b: {
    label:            "Llama 2 7B",
    trainingKg:       13_500,
    inferPerMTokenKg: 0.8,
    source:           "Touvron et al. 2023",
  },
  llama70b: {
    label:            "Llama 2 70B",
    trainingKg:       169_000,
    inferPerMTokenKg: 7.2,
    source:           "Touvron et al. 2023 + inference scaling estimates",
  },
} as const;

const PRESETS = [
  { label: "Research Team",  mTokensPerDay: 10,    desc: "10M/day" },
  { label: "Enterprise App", mTokensPerDay: 100,   desc: "100M/day" },
  { label: "Major Platform", mTokensPerDay: 1_000, desc: "1B/day" },
  { label: "Hyperscale",     mTokensPerDay: 10_000,desc: "10B/day" },
];

const SPEEDS = [1, 5, 10] as const;
type Speed = typeof SPEEDS[number];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtKg(kg: number): string {
  if (kg >= 1_000_000) return `${(kg / 1_000_000).toFixed(2)}M kg CO₂e`;
  if (kg >= 1_000)     return `${(kg / 1_000).toFixed(1)}k kg CO₂e`;
  return `${Math.round(kg)} kg CO₂e`;
}

function fmtY(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `${Math.round(v / 1_000)}k`;
  return `${v}`;
}

function crossDay(trainingKg: number, dailyMTokens: number, perMTokenKg: number): number {
  const dailyKg = dailyMTokens * perMTokenKg;
  if (dailyKg <= 0) return Infinity;
  return Math.ceil(trainingKg / dailyKg);
}

function fmtTokens(mTokens: number): string {
  if (mTokens >= 1_000) return `${(mTokens / 1_000).toFixed(mTokens % 1_000 === 0 ? 0 : 1)}B`;
  return `${mTokens}M`;
}

// ─── Data generators ──────────────────────────────────────────────────────────

function genPart1(upToDay: number, dailyMTokens: number) {
  const dailyKg = dailyMTokens * MODELS.bloom.inferPerMTokenKg;
  return Array.from({ length: upToDay + 1 }, (_, d) => ({
    day: d,
    training: MODELS.bloom.trainingKg,
    inference: Math.round(dailyKg * d),
  }));
}

function genPart2(upToDay: number, dailyMTokens: number) {
  const daily7b  = dailyMTokens * MODELS.llama7b.inferPerMTokenKg;
  const daily70b = dailyMTokens * MODELS.llama70b.inferPerMTokenKg;
  return Array.from({ length: upToDay + 1 }, (_, d) => ({
    day: d,
    inf7b:   Math.round(daily7b  * d),
    inf70b:  Math.round(daily70b * d),
    train7b:  MODELS.llama7b.trainingKg,
    train70b: MODELS.llama70b.trainingKg,
  }));
}

// ─── Animation hook ───────────────────────────────────────────────────────────

function useAnimation(speed: number) {
  const [currentDay, setCurrentDay] = useState(0);
  const [isPlaying, setIsPlaying]   = useState(false);
  const dayRef = useRef(0);
  dayRef.current = currentDay;

  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      setCurrentDay(d => {
        const next = Math.min(d + speed, MAX_DAYS);
        return next;
      });
    }, 50);
    return () => clearInterval(id);
  }, [isPlaying, speed]);

  // Auto-stop when reaching max
  useEffect(() => {
    if (currentDay >= MAX_DAYS && isPlaying) setIsPlaying(false);
  }, [currentDay, isPlaying]);

  const reset = useCallback(() => {
    setCurrentDay(0);
    setIsPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    if (dayRef.current >= MAX_DAYS) {
      setCurrentDay(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(p => !p);
    }
  }, []);

  return { currentDay, isPlaying, reset, toggle };
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#1e293b", border: "1px solid #334155",
      borderRadius: 8, padding: "10px 14px", fontSize: 11,
    }}>
      <p style={{ color: "#94a3b8", marginBottom: 6, fontFamily: "monospace" }}>Day {label}</p>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color, margin: "2px 0" }}>
          {p.name}: {fmtKg(p.value)}
        </p>
      ))}
    </div>
  );
};

// ─── Controls ─────────────────────────────────────────────────────────────────

interface ControlsProps {
  currentDay:    number;
  isPlaying:     boolean;
  speed:         Speed;
  dailyMTokens?: number;
  showPresets?:  boolean;
  onToggle:      () => void;
  onReset:       () => void;
  onSpeed:       (s: Speed) => void;
  onPreset?:     (m: number) => void;
}

const Controls = ({
  currentDay, isPlaying, speed, dailyMTokens,
  showPresets = true,
  onToggle, onReset, onSpeed, onPreset,
}: ControlsProps) => (
  <div className="rounded-xl border border-border/50 bg-muted/20 p-4 mb-6">
    <div className="flex flex-wrap items-center gap-4 mb-4">
      {/* Day counter */}
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold font-mono text-foreground">{currentDay}</span>
        <span className="text-sm text-muted-foreground">/ 365 days</span>
      </div>

      {/* Progress bar */}
      <div className="flex-1 min-w-32 h-1.5 bg-border/50 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full"
          style={{ width: `${(currentDay / MAX_DAYS) * 100}%`, transition: "width 50ms linear" }}
        />
      </div>

      {/* Play / Pause / Reset */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggle}
          className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors"
        >
          {isPlaying ? "⏸ Pause" : currentDay >= MAX_DAYS ? "↺ Replay" : "▶ Play"}
        </button>
        <button
          onClick={onReset}
          className="px-3 py-1.5 rounded-lg text-sm border border-border/50 text-muted-foreground hover:text-foreground transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Speed */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground mr-1">Speed:</span>
        {SPEEDS.map(s => (
          <button
            key={s}
            onClick={() => onSpeed(s)}
            className={`px-2.5 py-1 text-xs rounded border transition-colors ${
              speed === s
                ? "bg-blue-500/20 text-blue-300 border-blue-500/40"
                : "text-muted-foreground border-border/50 hover:border-blue-500/30"
            }`}
          >
            {s}×
          </button>
        ))}
      </div>
    </div>

    {/* Traffic presets — Part 1 only */}
    {showPresets && onPreset && (
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Daily traffic:</span>
        {PRESETS.map(p => (
          <button
            key={p.label}
            onClick={() => onPreset(p.mTokensPerDay)}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
              dailyMTokens === p.mTokensPerDay
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                : "text-muted-foreground border-border/50 hover:border-emerald-500/30"
            }`}
          >
            {p.label} <span className="opacity-60">({p.desc})</span>
          </button>
        ))}
      </div>
    )}
  </div>
);

// ─── Part 1: Training vs Inference ────────────────────────────────────────────

const Part1 = ({ currentDay, dailyMTokens }: { currentDay: number; dailyMTokens: number }) => {
  const data         = genPart1(currentDay, dailyMTokens);
  const xDay         = crossDay(MODELS.bloom.trainingKg, dailyMTokens, MODELS.bloom.inferPerMTokenKg);
  const hasCrossed   = currentDay >= xDay && xDay <= MAX_DAYS;
  const inferToday   = Math.round(dailyMTokens * MODELS.bloom.inferPerMTokenKg * currentDay);
  const inferYearEnd = Math.round(dailyMTokens * MODELS.bloom.inferPerMTokenKg * MAX_DAYS);
  const maxY         = Math.max(MODELS.bloom.trainingKg, inferYearEnd) * 1.15;

  return (
    <div className="mb-10">
      {/* Section header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-bold mb-1">Part 1 — Training vs Inference: The Crossover</h2>
          <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
            BLOOM 176B training emitted <strong className="text-foreground">{fmtKg(MODELS.bloom.trainingKg)}</strong> — once, never repeated.
            Inference carbon accumulates daily, like a meter that never stops.
            Watch the lines cross.
          </p>
        </div>
        {hasCrossed && (
          <div className="shrink-0 px-4 py-2.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-center">
            <div className="text-[10px] font-mono text-amber-400 uppercase tracking-widest mb-0.5">Crossover reached</div>
            <div className="text-2xl font-bold text-amber-300">Day {xDay}</div>
            <div className="text-[10px] text-amber-400/70">inference exceeded training</div>
          </div>
        )}
        {!hasCrossed && xDay <= MAX_DAYS && (
          <div className="shrink-0 px-4 py-2.5 rounded-lg bg-muted/20 border border-border/50 text-center">
            <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-0.5">Crossover in</div>
            <div className="text-2xl font-bold text-muted-foreground">{xDay - currentDay}</div>
            <div className="text-[10px] text-muted-foreground/70">days (Day {xDay})</div>
          </div>
        )}
        {xDay > MAX_DAYS && (
          <div className="shrink-0 px-4 py-2.5 rounded-lg bg-muted/20 border border-border/50 text-center">
            <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-0.5">Crossover</div>
            <div className="text-lg font-bold text-muted-foreground">&gt;365 days</div>
            <div className="text-[10px] text-muted-foreground/70">increase traffic volume</div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { label: "BLOOM Training (sunk cost)",     value: fmtKg(MODELS.bloom.trainingKg), color: "text-amber-400" },
          { label: "Cumulative Inference (Day " + currentDay + ")", value: currentDay > 0 ? fmtKg(inferToday) : "—", color: "text-blue-400" },
          { label: "Crossover Point",               value: xDay <= MAX_DAYS ? `Day ${xDay}` : `>${MAX_DAYS} days`, color: "text-amber-300" },
          { label: "Year-End Inference Total",       value: fmtKg(inferYearEnd), color: "text-foreground" },
        ].map(s => (
          <div key={s.label} className="rounded-lg border border-border/50 bg-muted/20 p-3 text-center">
            <div className={`text-sm font-bold ${s.color}`}>{s.value}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="rounded-xl border border-border/50 bg-muted/10 p-4">
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="day"
              type="number"
              domain={[0, MAX_DAYS]}
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              label={{ value: "Days since deployment", position: "insideBottom", offset: -8, fill: "#64748b", fontSize: 10 }}
            />
            <YAxis
              tickFormatter={fmtY}
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              width={52}
              domain={[0, maxY]}
            />
            <Tooltip content={<ChartTooltip />} />
            <Line
              dataKey="training"
              name="Training carbon (sunk)"
              stroke="#f59e0b"
              strokeWidth={2}
              strokeDasharray="6 3"
              dot={false}
              isAnimationActive={false}
              type="monotone"
            />
            <Line
              dataKey="inference"
              name="Cumulative inference"
              stroke="#60a5fa"
              strokeWidth={2.5}
              dot={false}
              isAnimationActive={false}
              type="monotone"
            />
            {xDay <= MAX_DAYS && (
              <ReferenceLine
                x={xDay}
                stroke="#f59e0b"
                strokeDasharray="4 2"
                strokeOpacity={0.6}
                label={{ value: `Day ${xDay}`, fill: "#f59e0b", fontSize: 9, position: "insideTopRight" }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex flex-wrap gap-5 mt-1 px-1">
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <svg width="24" height="10"><line x1="0" y1="5" x2="24" y2="5" stroke="#f59e0b" strokeWidth="2" strokeDasharray="5 3" /></svg>
            Training carbon — paid once, flat forever
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <svg width="24" height="10"><line x1="0" y1="5" x2="24" y2="5" stroke="#60a5fa" strokeWidth="2.5" /></svg>
            Cumulative inference — grows daily
          </div>
        </div>
      </div>

      {/* Explanation */}
      <div className="mt-4 rounded-lg border border-border/30 bg-muted/10 p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">What you're seeing</p>
        <ul className="space-y-1.5 text-xs text-muted-foreground">
          <li className="flex gap-2">
            <span className="text-amber-400 shrink-0 mt-0.5">●</span>
            The flat amber line is BLOOM's training carbon: 433,000 kg CO₂e, emitted once during a 3.5-month training run. It never grows. Think of it like building a factory — the construction cost is fixed.
          </li>
          <li className="flex gap-2">
            <span className="text-blue-400 shrink-0 mt-0.5">●</span>
            The rising blue line is inference carbon — every query burns electricity. At {fmtTokens(dailyMTokens)} tokens/day, that's {fmtKg(dailyMTokens * MODELS.bloom.inferPerMTokenKg)} added per day, compounding like a meter left running.
          </li>
          <li className="flex gap-2">
            <span className="text-foreground shrink-0 mt-0.5">●</span>
            {xDay <= MAX_DAYS
              ? `At this traffic volume, the crossover hits Day ${xDay}. After that, every carbon-reduction decision is an inference decision — which hardware, which cloud, which grid.`
              : `At ${fmtTokens(dailyMTokens)} tokens/day, the crossover takes longer than a year. Try "Major Platform" or "Hyperscale" to see the crossover happen within a year.`}
          </li>
          <li className="flex gap-2">
            <span className="text-emerald-400 shrink-0 mt-0.5">●</span>
            Regulatory context: CSRD Scope 2 and EU GPAI Art.53 both target <em>operational</em> carbon — the exact emissions shown by the rising inference line, not the one-time training cost.
          </li>
        </ul>
      </div>
    </div>
  );
};

// ─── Part 2: Two-Model Comparison ─────────────────────────────────────────────

interface Part2Props {
  currentDay:   number;
  isPlaying:    boolean;
  speed:        Speed;
  onToggle:     () => void;
  onReset:      () => void;
  onSpeed:      (s: Speed) => void;
  dailyMTokens: number;
}

const Part2 = ({ currentDay, isPlaying, speed, onToggle, onReset, onSpeed, dailyMTokens }: Part2Props) => {
  const data       = genPart2(currentDay, dailyMTokens);
  const inf7b      = Math.round(dailyMTokens * MODELS.llama7b.inferPerMTokenKg  * currentDay);
  const inf70b     = Math.round(dailyMTokens * MODELS.llama70b.inferPerMTokenKg * currentDay);
  const ratio      = inf7b > 0 ? (inf70b / inf7b).toFixed(1) : "9.0";
  const inf70bYear = Math.round(dailyMTokens * MODELS.llama70b.inferPerMTokenKg * MAX_DAYS);
  const inf7bYear  = Math.round(dailyMTokens * MODELS.llama7b.inferPerMTokenKg  * MAX_DAYS);
  const maxY       = Math.max(MODELS.llama70b.trainingKg, inf70bYear) * 1.15;

  const x7b  = crossDay(MODELS.llama7b.trainingKg,  dailyMTokens, MODELS.llama7b.inferPerMTokenKg);
  const x70b = crossDay(MODELS.llama70b.trainingKg, dailyMTokens, MODELS.llama70b.inferPerMTokenKg);

  return (
    <div className="mb-10">
      <div className="mb-4">
        <h2 className="text-lg font-bold mb-1">Part 2 — Llama 2 7B vs 70B: Does Model Size Matter?</h2>
        <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
          Same architecture, 10× more parameters. Watch how the inference carbon gap between Llama 2 7B and 70B
          compounds over a year — and why efficient model selection is a carbon decision, not just a performance one.
        </p>
      </div>

      <Controls
        currentDay={currentDay}
        isPlaying={isPlaying}
        speed={speed}
        showPresets={false}
        onToggle={onToggle}
        onReset={onReset}
        onSpeed={onSpeed}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { label: "7B Training (one-time)",    value: fmtKg(MODELS.llama7b.trainingKg),  color: "text-emerald-400" },
          { label: "70B Training (one-time)",   value: fmtKg(MODELS.llama70b.trainingKg), color: "text-red-400"     },
          { label: "70B ÷ 7B Inference Ratio",  value: `${ratio}×`,                       color: "text-red-400"     },
          { label: "Year-End Gap (70B − 7B)",   value: fmtKg(inf70bYear - inf7bYear),     color: "text-foreground"  },
        ].map(s => (
          <div key={s.label} className="rounded-lg border border-border/50 bg-muted/20 p-3 text-center">
            <div className={`text-sm font-bold ${s.color}`}>{s.value}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="rounded-xl border border-border/50 bg-muted/10 p-4">
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="day"
              type="number"
              domain={[0, MAX_DAYS]}
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              label={{ value: "Days since deployment", position: "insideBottom", offset: -8, fill: "#64748b", fontSize: 10 }}
            />
            <YAxis
              tickFormatter={fmtY}
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              width={52}
              domain={[0, maxY]}
            />
            <Tooltip content={<ChartTooltip />} />

            {/* Training reference lines */}
            <ReferenceLine
              y={MODELS.llama7b.trainingKg}
              stroke="#4ade80"
              strokeDasharray="5 3"
              strokeOpacity={0.45}
            />
            <ReferenceLine
              y={MODELS.llama70b.trainingKg}
              stroke="#f87171"
              strokeDasharray="5 3"
              strokeOpacity={0.45}
            />

            {/* Crossover markers */}
            {x7b <= MAX_DAYS && (
              <ReferenceLine x={x7b}  stroke="#4ade80" strokeDasharray="3 2" strokeOpacity={0.4}
                label={{ value: `7B x-over: Day ${x7b}`, fill: "#4ade80", fontSize: 8, position: "insideTopRight" }} />
            )}
            {x70b <= MAX_DAYS && (
              <ReferenceLine x={x70b} stroke="#f87171" strokeDasharray="3 2" strokeOpacity={0.4}
                label={{ value: `70B x-over: Day ${x70b}`, fill: "#f87171", fontSize: 8, position: "insideTopLeft" }} />
            )}

            {/* Inference lines */}
            <Line
              dataKey="inf7b"
              name="Llama 2 7B inference"
              stroke="#4ade80"
              strokeWidth={2.5}
              dot={false}
              isAnimationActive={false}
              type="monotone"
            />
            <Line
              dataKey="inf70b"
              name="Llama 2 70B inference"
              stroke="#f87171"
              strokeWidth={2.5}
              dot={false}
              isAnimationActive={false}
              type="monotone"
            />
          </ComposedChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex flex-wrap gap-5 mt-1 px-1">
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <svg width="24" height="10"><line x1="0" y1="5" x2="24" y2="5" stroke="#4ade80" strokeWidth="2.5" /></svg>
            Llama 2 7B — inference
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <svg width="24" height="10"><line x1="0" y1="5" x2="24" y2="5" stroke="#f87171" strokeWidth="2.5" /></svg>
            Llama 2 70B — inference
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <svg width="24" height="10"><line x1="0" y1="5" x2="24" y2="5" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="5 3" /></svg>
            Training thresholds (reference)
          </div>
        </div>
      </div>

      {/* Explanation */}
      <div className="mt-4 rounded-lg border border-border/30 bg-muted/10 p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">What you're seeing</p>
        <ul className="space-y-1.5 text-xs text-muted-foreground">
          <li className="flex gap-2">
            <span className="text-emerald-400 shrink-0 mt-0.5">●</span>
            Llama 2 7B trained on 13,500 kg CO₂e — cheap to train. Each token costs 0.8 kg per million tokens in inference. Small, fast, efficient.
          </li>
          <li className="flex gap-2">
            <span className="text-red-400 shrink-0 mt-0.5">●</span>
            Llama 2 70B trained on 169,000 kg CO₂e — 12× more. And each token costs 7.2 kg per million tokens — 9× more per inference call.
          </li>
          <li className="flex gap-2">
            <span className="text-foreground shrink-0 mt-0.5">●</span>
            The inference ratio is always 9× (7.2 ÷ 0.8), regardless of how many tokens you process. But the absolute gap compounds — by Year 1 at {fmtTokens(dailyMTokens)} tokens/day, 70B has emitted {fmtKg(inf70bYear - inf7bYear)} more than 7B just from serving queries.
          </li>
          <li className="flex gap-2">
            <span className="text-amber-400 shrink-0 mt-0.5">●</span>
            This is the carbon argument for efficient model selection and QLoRA fine-tuning: if a smaller fine-tuned model can match 70B performance for your use case, choosing it cuts inference carbon by ~9× — compounding every single day.
          </li>
        </ul>
      </div>
    </div>
  );
};

// ─── Citations ─────────────────────────────────────────────────────────────────

const Citations = () => {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-8">
      <button
        onClick={() => setOpen(o => !o)}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
      >
        <span>{open ? "▾" : "▸"}</span> Data sources &amp; methodology
      </button>
      {open && (
        <div className="mt-3 rounded-lg border border-border/30 bg-muted/10 p-4 text-xs text-muted-foreground space-y-2.5">
          <p>
            <strong className="text-foreground">Training carbon:</strong> Published peer-reviewed figures.
            BLOOM 176B (433,000 kg CO₂e): Luccioni et al. 2022, "Estimating the Carbon Footprint of BLOOM, a 176B Parameter Language Model," arXiv:2211.02001.
            Llama 2 (13,500 kg for 7B · 169,000 kg for 70B): Touvron et al. 2023, "Llama 2: Open Foundation and Fine-Tuned Chat Models," arXiv:2307.09288.
          </p>
          <p>
            <strong className="text-foreground">Inference carbon estimates:</strong> Derived from hardware efficiency baselines (A100 GPU) and US average grid intensity (0.386 kgCO₂/kWh, EPA 2022).
            Per-token figures are order-of-magnitude estimates calibrated to Luccioni et al. 2023 ("Power Hungry Processing," arXiv:2311.16863).
            Real-world values vary by hardware generation, batch size, quantization, and regional grid mix.
          </p>
          <p>
            <strong className="text-foreground">Regulatory context:</strong> CSRD Article 29a requires Scope 2 emissions reporting (purchased electricity — directly applicable to inference at cloud data centres).
            EU AI Act GPAI Article 53 requires energy transparency for general-purpose AI models above 10²³ FLOPs.
          </p>
          <p>
            <strong className="text-foreground">Methodology note:</strong> This model assumes linear scaling of inference carbon with token volume.
            In practice, batching, caching, and hardware optimisations reduce marginal per-token cost at scale.
            This tool shows direction and order of magnitude — not a precision carbon audit.
          </p>
        </div>
      )}
    </div>
  );
};

// ─── Preview (shown to visitors without access code) ─────────────────────────

const preview = (
  <div style={{ padding: "32px 24px 0", fontFamily: "inherit" }}>
    {/* Header */}
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#f1f5f9", margin: 0 }}>Carbon Time Travel</h2>
        <span style={{
          fontSize: 10, fontFamily: "monospace", padding: "2px 10px",
          borderRadius: 99, border: "1px solid rgba(52,211,153,0.3)",
          background: "rgba(52,211,153,0.1)", color: "#34d399",
        }}>Sustainable AI</span>
      </div>
      <p style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6, maxWidth: 560, margin: 0 }}>
        Training an AI model emits carbon once. Deployment emits carbon every day, compounding silently.
        Watch the exact day inference carbon overtakes all training carbon — and why model size matters more than you think.
      </p>
    </div>

    {/* Stat cards */}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
      {[
        { label: "BLOOM Training", value: "433k kg", color: "#fbbf24" },
        { label: "Crossover (1B/day)", value: "Day 108", color: "#60a5fa" },
        { label: "70B vs 7B ratio", value: "9×", color: "#f87171" },
        { label: "Models shown", value: "3", color: "#94a3b8" },
      ].map(s => (
        <div key={s.label} style={{
          borderRadius: 8, border: "1px solid rgba(100,116,139,0.25)",
          background: "rgba(30,41,59,0.6)", padding: 12, textAlign: "center",
        }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
          <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 4 }}>{s.label}</div>
        </div>
      ))}
    </div>

    {/* Fake animated chart */}
    <div style={{
      borderRadius: 8, border: "1px solid rgba(100,116,139,0.2)",
      background: "rgba(30,41,59,0.4)", padding: 16, marginBottom: 16,
    }}>
      <p style={{ fontSize: 10, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
        Training vs Inference — BLOOM 176B at 1B tokens/day
      </p>
      <svg viewBox="0 0 400 160" style={{ width: "100%", height: 140 }}>
        {/* Grid lines */}
        {[40, 80, 120].map(y => (
          <line key={y} x1="40" y1={y} x2="390" y2={y} stroke="rgba(100,116,139,0.12)" strokeWidth="1" />
        ))}
        {/* Training line (flat, amber dashed) */}
        <line x1="40" y1="88" x2="390" y2="88" stroke="#f59e0b" strokeWidth="2" strokeDasharray="6 3" opacity="0.85" />
        <text x="44" y="82" fontSize="8" fill="#f59e0b" opacity="0.85">Training: 433k kg (sunk)</text>
        {/* Inference line (rising, blue) */}
        <polyline points="40,155 143,88 240,46 340,18 390,10" stroke="#60a5fa" strokeWidth="2.5" fill="none" />
        {/* Crossover vertical marker */}
        <line x1="143" y1="20" x2="143" y2="158" stroke="#f59e0b" strokeWidth="1" strokeDasharray="4 2" opacity="0.5" />
        <text x="146" y="32" fontSize="8" fill="#f59e0b">Day 108: Crossover</text>
        {/* Inference label */}
        <text x="300" y="17" fontSize="8" fill="#60a5fa">Inference (rising daily)</text>
        {/* Axes */}
        <line x1="40" y1="155" x2="390" y2="155" stroke="rgba(100,116,139,0.3)" strokeWidth="1" />
        <line x1="40" y1="20" x2="40" y2="155" stroke="rgba(100,116,139,0.3)" strokeWidth="1" />
        <text x="195" y="152" fontSize="8" fill="#64748b" textAnchor="middle">→ Days since deployment (0–365)</text>
      </svg>
      <div style={{ display: "flex", gap: 20, marginTop: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: "#94a3b8" }}>
          <svg width="20" height="8"><line x1="0" y1="4" x2="20" y2="4" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="5 3" /></svg>
          Training (flat)
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: "#94a3b8" }}>
          <svg width="20" height="8"><line x1="0" y1="4" x2="20" y2="4" stroke="#60a5fa" strokeWidth="1.5" /></svg>
          Cumulative inference
        </div>
      </div>
    </div>
  </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

const CarbonTimeTravelInner = () => {
  const [speed,  setSpeed]              = useState<Speed>(1);
  const [speed2, setSpeed2]             = useState<Speed>(1);
  const [dailyMTokens, setDailyMTokens] = useState(1_000); // default: 1B tokens/day
  const anim1 = useAnimation(speed);
  const anim2 = useAnimation(speed2);

  const handlePreset = useCallback((m: number) => {
    setDailyMTokens(m);
    anim1.reset();
    anim2.reset();
  }, [anim1, anim2]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <Link
          to="/"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors mb-6 inline-block"
        >
          ← Back to portfolio
        </Link>

        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">Carbon Time Travel</h1>
            <span className="text-[10px] font-mono px-2.5 py-1 rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
              Sustainable AI
            </span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
            Training an AI model emits carbon once — a sunk cost, like building a factory.
            Deploying it emits carbon every day, silently compounding. This tool shows exactly when inference
            carbon overtakes total training carbon, and why model size is a carbon decision, not just a performance one.
          </p>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {["Sustainable AI", "Carbon Accounting", "CSRD Scope 2", "EU GPAI Art.53", "Recharts", "React", "TypeScript"].map(t => (
              <span
                key={t}
                className="text-[10px] font-mono text-slate-400 bg-slate-500/8 border border-slate-400/15 px-2 py-0.5 rounded"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Shared controls */}
        <Controls
          currentDay={anim1.currentDay}
          isPlaying={anim1.isPlaying}
          speed={speed}
          dailyMTokens={dailyMTokens}
          onToggle={anim1.toggle}
          onReset={anim1.reset}
          onSpeed={setSpeed}
          onPreset={handlePreset}
        />

        {/* Charts */}
        <Part1 currentDay={anim1.currentDay} dailyMTokens={dailyMTokens} />
        <Part2
          currentDay={anim2.currentDay}
          isPlaying={anim2.isPlaying}
          speed={speed2}
          onToggle={anim2.toggle}
          onReset={anim2.reset}
          onSpeed={setSpeed2}
          dailyMTokens={dailyMTokens}
        />

        {/* Data citations */}
        <Citations />
      </div>
    </div>
  );
};

const CarbonTimeTravel = () => {
  useVisitLogger();
  return (
    <PageGate pageId="carbon-time-travel" previewContent={preview}>
      <CarbonTimeTravelInner />
    </PageGate>
  );
};

export default CarbonTimeTravel;
