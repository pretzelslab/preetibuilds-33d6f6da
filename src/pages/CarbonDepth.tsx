import { useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  ReferenceLine, ResponsiveContainer,
} from "recharts";
import { PageGate } from "@/components/ui/PageGate";
import { useVisitLogger } from "@/hooks/useVisitLogger";
import {
  GPU_PRESETS, PUE_BY_TYPE, WUE_BY_TYPE,
  DEFAULT_MODEL_A, DEFAULT_MODEL_B,
  calculateFootprint, getRegFlags, fetchGridIntensity,
  getBenchmarkRef, benchmarkFlag, BENCHMARK_REMEDIATIONS,
  BENCHMARK_REFS, buildFleetTimeline,
  generateRecommendations, calcCombinedSaving,
} from "@/data/carbonDepthData";
import {
  getEffectiveGPUPresets, getEffectiveRegionZones, getEffectiveStaticIntensity,
} from "@/lib/carbonCustomData";
import type {
  ModelConfig, FootprintResult, RegFlag, BenchmarkSource, BenchmarkTaskClass,
  FleetSlot, Recommendation,
} from "@/data/carbonDepthData";

// ── Why this tool ─────────────────────────────────────────────────────────────
function WhyItMatters() {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 mb-6">
      <button
        className="w-full flex items-center justify-between text-left"
        onClick={() => setOpen(v => !v)}
      >
        <span className="text-xs font-bold text-violet-400 uppercase tracking-wider">
          Why this calculator exists
        </span>
        <span className="text-xs text-muted-foreground">{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <div className="mt-4 space-y-4 text-xs text-muted-foreground leading-relaxed">
          <div>
            <span className="font-semibold text-foreground">The problem.</span>{" "}
            Most AI teams cannot answer "how much carbon does this model produce today — and how much
            will it produce over its deployment lifetime?" Energy and water use are invisible in the
            development workflow — estimated after the fact, if at all.
            There is no standard tool that combines real grid data, GPU benchmarks, water usage,
            and regulatory thresholds in a single practitioner-facing calculator.
          </div>
          <div>
            <span className="font-semibold text-foreground">The regulatory moment.</span>{" "}
            CSRD (EU, 2024) mandates Scope 1/2/3 disclosure including AI workloads — applicable to
            ~50,000 companies. EU GPAI Act Article 53 requires energy disclosure for foundation model
            providers. ISSB S2 covers AI data centre climate risk for financial disclosures.
            Enforcement begins 2025–2026. Most companies do not yet have the numbers to comply.
          </div>
          <div>
            <span className="font-semibold text-foreground">The training vs inference insight.</span>{" "}
            Training is a one-time carbon cost. Inference is a running meter — accumulating every day
            the model serves requests. At production scale (1M req/day), a model repays its training
            carbon footprint in as few as 8 days. After that, every efficiency decision at inference
            time — smaller model, lower-carbon region, quantisation — has compounding impact.
            This tool makes that crossover point visible so teams can prioritise the right intervention.
          </div>
          <div>
            <span className="font-semibold text-foreground">Validation.</span>{" "}
            Formulas validated against Strubell et al. 2019 (BERT-base), Patterson et al. 2021
            (Google large transformer), and Luccioni et al. 2022 (BLOOM 176B). Energy accuracy ±15%.
            Carbon accuracy depends on grid intensity source — live API reduces error vs static averages.
          </div>
        </div>
      )}
    </div>
  );
}

// ── Inference summary ─────────────────────────────────────────────────────────
function InferenceSummary({ a, b, configA, configB }: {
  a: FootprintResult; b: FootprintResult;
  configA: ModelConfig; configB: ModelConfig;
}) {
  const pctDay = (hrs: number) => ((hrs / 24) * 100).toFixed(1);
  const row = (label: string, tip: string, vA: string, vB: string, header = false) => (
    <tr className={`border-b border-border/20 ${header ? "bg-muted/10" : ""}`}>
      <td className="px-3 py-1.5 text-muted-foreground" title={tip}>
        {label} <span className="text-violet-400/50 text-[10px]">ⓘ</span>
      </td>
      <td className="px-3 py-1.5 text-right font-mono">{vA}</td>
      <td className="px-3 py-1.5 text-right font-mono">{vB}</td>
    </tr>
  );

  const crossoverInterpret = (days: number) => {
    if (!isFinite(days)) return "No inference configured.";
    if (days < 30)  return "Inference carbon overtakes training almost immediately. Focus optimisation efforts on inference efficiency — smaller model, lower-carbon region, or quantisation.";
    if (days < 365) return "Inference overtakes training within the year. Start tracking inference carbon now — it will dominate the lifetime footprint.";
    return "Training cost dominates for over a year at this inference volume. Optimising training choices (GPU, region, experiment count) has the most impact.";
  };

  return (
    <div className="space-y-3">
      <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Inference Daily Breakdown</div>
      <div className="overflow-x-auto rounded-xl border border-border/40">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border/40 bg-muted/20">
              <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Metric</th>
              <th className="text-right px-3 py-2 font-semibold">{configA.name}</th>
              <th className="text-right px-3 py-2 font-semibold">{configB.name}</th>
            </tr>
          </thead>
          <tbody>
            {/* ── Inputs — shown first so the derivation is clear ── */}
            <tr className="border-b border-border/20 bg-muted/10">
              <td colSpan={3} className="px-3 py-1 text-xs font-semibold text-muted-foreground">Inputs driving inference calculation</td>
            </tr>
            {row("Latency / request",
              "How long the GPU is busy per request. This is the single biggest lever for inference carbon — a 4× slower model uses 4× more GPU-seconds per request.",
              `${configA.latencySeconds}s`, `${configB.latencySeconds}s`)}
            {row("Requests / day",
              "Total inference calls served daily. Multiplied by latency to get total GPU-seconds consumed.",
              configA.requestsPerDay.toLocaleString(), configB.requestsPerDay.toLocaleString())}
            {row("GPU-seconds / day",
              "Latency × requests/day. Total seconds the GPU is actively computing across all requests.",
              `${(configA.latencySeconds * configA.requestsPerDay).toLocaleString()}s`,
              `${(configB.latencySeconds * configB.requestsPerDay).toLocaleString()}s`)}
            {/* ── Derived outputs ── */}
            <tr className="border-b border-border/20 bg-muted/10">
              <td colSpan={3} className="px-3 py-1 text-xs font-semibold text-muted-foreground">Daily outputs</td>
            </tr>
            {row("GPU active time",
              "GPU-seconds ÷ 3600 = GPU-hours. As a % of 24h this shows how heavily the GPU is utilised.",
              `${fmt1(a.infGpuHoursDay)}h (${pctDay(a.infGpuHoursDay)}% of day)`,
              `${fmt1(b.infGpuHoursDay)}h (${pctDay(b.infGpuHoursDay)}% of day)`)}
            {row("Energy (kWh/day)",
              "GPU kW × active hours × PUE. PUE adds data centre overhead — cooling, networking, lighting on top of raw GPU draw.",
              `${fmt1(a.infEnergyKwhDay)} kWh`, `${fmt1(b.infEnergyKwhDay)} kWh`)}
            {row("Carbon (kgCO₂e/day)",
              "Daily energy × grid carbon intensity ÷ 1000. Varies by region and time of day — live API gives the most accurate reading.",
              `${a.infCarbonKgDay.toFixed(4)} kg`, `${b.infCarbonKgDay.toFixed(4)} kg`)}
            {row("Water (L/day)",
              "GPU energy (before PUE) × WUE. Water cools the servers. WUE is a facility choice — the same model in a hyperscaler uses 4.6× less water than on-premise.",
              `${a.infWaterLitresDay.toFixed(4)} L`, `${b.infWaterLitresDay.toFixed(4)} L`)}
            {/* ── Per request ── */}
            <tr className="border-b border-border/20 bg-muted/10">
              <td colSpan={3} className="px-3 py-1 text-xs font-semibold text-muted-foreground">Per request</td>
            </tr>
            {row("Energy", "Daily energy ÷ requests × 1000 (kWh → Wh). Tiny individually — meaningful at scale.",
              `${fmt4(a.energyPerRequestWh)} Wh`, `${fmt4(b.energyPerRequestWh)} Wh`)}
            {row("Carbon", "Daily carbon ÷ requests × 1000 (kg → g).",
              `${fmt4(a.carbonPerRequestG)} gCO₂`, `${fmt4(b.carbonPerRequestG)} gCO₂`)}
            {row("Cost", "Energy/request × $0.12/kWh × 100 (USD → cents).",
              `${fmt4(a.costPerRequestCents)}¢`, `${fmt4(b.costPerRequestCents)}¢`)}
          </tbody>
        </table>
      </div>

      {/* Crossover cards — equal height via grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-stretch">
        {([
          { cfg: configA, r: a },
          { cfg: configB, r: b },
        ] as { cfg: ModelConfig; r: FootprintResult }[]).map(({ cfg, r }) => (
          <div key={cfg.name} className="rounded-xl border border-border/40 bg-muted/10 p-4 text-xs flex flex-col gap-1">
            <div className="font-semibold text-foreground">{cfg.name} — crossover</div>
            <div className="font-mono text-violet-400 text-base font-bold">{fmtInt(r.crossoverDays)} days</div>
            <div className="text-muted-foreground text-[11px] leading-relaxed flex-1">
              {crossoverInterpret(r.crossoverDays)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt1  = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 1 });
const fmt4  = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 4 });
const fmtInt = (n: number) => (isFinite(n) ? Math.round(n).toLocaleString() : "∞");
const pct   = (val: number, max: number) => Math.min((val / max) * 100, 100);

// ── Regulatory flag badge ─────────────────────────────────────────────────────
const FLAG_STYLE: Record<RegFlag, string> = {
  compliant: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30",
  warning:   "bg-amber-500/10  text-amber-400  border border-amber-500/30",
  breach:    "bg-red-500/10    text-red-400    border border-red-500/30",
};
const FLAG_BAR: Record<RegFlag, string> = {
  compliant: "bg-emerald-400",
  warning:   "bg-amber-400",
  breach:    "bg-red-400",
};
const FLAG_LABEL: Record<RegFlag, string> = {
  compliant: "Compliant",
  warning:   "Monitor",
  breach:    "Disclose",
};

const REG_PLAIN_ENGLISH: Record<string, string> = {
  "EU GPAI Act Art. 53":
    "Plain English: EU law (2024) that requires companies building large AI models — like GPT-4, Claude, or Gemini — to publicly disclose how much energy was used to train them. Think of it as a nutrition label for AI. Applies to 'general-purpose AI' models above a compute threshold.",
  "CSRD / ESRS E1":
    "Plain English: EU Corporate Sustainability Reporting Directive (2024). About 50,000 large companies must publish their full carbon footprint — including Scope 2 (electricity used by their AI systems). If your company operates in or sells to the EU and employs 250+ people, you likely fall in scope.",
  "GRI 305":
    "Plain English: A voluntary global standard used in annual sustainability and ESG reports by thousands of companies worldwide. Not legally required, but expected by investors and large customers. If your AI workloads exceed 1 tonne of CO₂ per year, GRI 305 provides the framework for disclosing it.",
};

function RegBadge({
  flag, label, detail, currentValue, threshold, unit,
}: {
  flag: RegFlag; label: string; detail: string;
  currentValue: number; threshold: number; unit: string;
}) {
  const [showPlain, setShowPlain] = useState(false);
  const barPct = pct(currentValue, threshold * 1.2);
  const plainText = REG_PLAIN_ENGLISH[label];
  return (
    <div className={`rounded-xl p-4 ${FLAG_STYLE[flag]}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-bold">{label}</span>
        {plainText && (
          <button
            className="text-[10px] opacity-50 hover:opacity-100 transition-opacity"
            onClick={() => setShowPlain(v => !v)}
            title="What is this law?"
          >
            {showPlain ? "▾ less" : "▸ what is this?"}
          </button>
        )}
        <span className={`ml-auto text-xs font-mono px-1.5 py-0.5 rounded ${FLAG_STYLE[flag]}`}>
          {FLAG_LABEL[flag]}
        </span>
      </div>
      {showPlain && plainText && (
        <p className="text-[11px] opacity-80 leading-relaxed mb-2 italic border-b border-white/10 pb-2">
          {plainText}
        </p>
      )}
      {/* Threshold bar */}
      <div className="relative h-1.5 bg-white/10 rounded-full mb-2">
        <div
          className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${FLAG_BAR[flag]}`}
          style={{ width: `${barPct}%` }}
        />
        {/* Threshold marker line */}
        <div className="absolute top-[-3px] h-[9px] w-px bg-white/40" style={{ left: `${pct(threshold, threshold * 1.2)}%` }} />
      </div>
      <div className="flex justify-between text-xs opacity-70 mb-1">
        <span>Current: {currentValue >= 1000 ? `${(currentValue/1000).toFixed(1)}k` : fmt1(currentValue)} {unit}</span>
        <span>Threshold: {threshold >= 1000 ? `${(threshold/1000).toFixed(0)}k` : threshold} {unit}</span>
      </div>
      <p className="text-xs opacity-80 leading-relaxed">{detail}</p>
    </div>
  );
}

// ── Metric card ───────────────────────────────────────────────────────────────
function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-muted/30 rounded-lg p-3 border border-border/40">
      <div className="text-xs text-muted-foreground mb-1 leading-tight">{label}</div>
      <div className="text-sm font-mono font-bold">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

// ── Comparison table ──────────────────────────────────────────────────────────
const TABLE_ROWS: {
  label: string; formula: string;
  key: keyof FootprintResult; unit: string;
  fmt: (n: number) => string;
}[] = [
  { label: "Training energy (kWh)",    formula: "gpu_kW × hours × PUE",       key: "trainTotalEnergyKwh", unit: "",  fmt: fmt1    },
  { label: "Training carbon (kgCO₂e)", formula: "energy × grid / 1000",        key: "trainCarbonKg",       unit: "",  fmt: fmt1    },
  { label: "Training water (L)",       formula: "gpu_kWh × WUE",               key: "trainWaterLitres",    unit: "",  fmt: fmt1    },
  { label: "Inference energy/yr (kWh)",formula: "daily_kWh × 365",             key: "infEnergyKwhYear",    unit: "",  fmt: fmt1    },
  { label: "Inference carbon/yr",      formula: "daily_carbon × 365",          key: "infCarbonKgYear",     unit: "",  fmt: fmt1    },
  { label: "Inference water/yr (L)",   formula: "daily_water × 365",           key: "infWaterLitresYear",  unit: "",  fmt: fmt1    },
  { label: "Cost / request (¢)",       formula: "kWh/req × rate × 100",        key: "costPerRequestCents", unit: "",  fmt: fmt4    },
  { label: "Crossover (days)",         formula: "train_carbon / daily_carbon", key: "crossoverDays",       unit: "d", fmt: fmtInt  },
];

function ComparisonTable({ a, b, labelA, labelB, benchmark }: {
  a: FootprintResult; b: FootprintResult; labelA: string; labelB: string;
  benchmark?: ReturnType<typeof getBenchmarkRef>;
}) {
  const FLAG_STYLE = {
    ok:     "text-emerald-500 bg-emerald-500/10 border border-emerald-500/20",
    warn:   "text-amber-400  bg-amber-400/10  border border-amber-400/20",
    breach: "text-red-400    bg-red-400/10    border border-red-400/20",
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-border/40">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border/40 bg-muted/20">
            <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Metric</th>
            <th className="text-left px-3 py-2 font-semibold text-muted-foreground hidden lg:table-cell">Formula</th>
            <th className="text-right px-3 py-2 font-semibold">{labelA}</th>
            <th className="text-right px-3 py-2 font-semibold">{labelB}</th>
            <th className="text-right px-3 py-2 font-semibold text-violet-400">Ratio</th>
            {benchmark && (
              <th className="text-right px-3 py-2 font-semibold text-blue-400/80 whitespace-nowrap">Benchmark</th>
            )}
          </tr>
        </thead>
        <tbody>
          {TABLE_ROWS.map((row, i) => {
            const vA    = a[row.key] as number;
            const vB    = b[row.key] as number;
            const ratio = vA > 0 ? vB / vA : 0;
            const ratioStr   = isFinite(ratio) ? `${ratio.toFixed(1)}×` : "—";
            const ratioColor = ratio > 5 ? "text-red-400" : ratio > 2 ? "text-amber-400" : "text-emerald-400";

            const bmRef  = benchmark ? (benchmark[row.key] as number | null) : null;
            const flagA  = benchmark ? benchmarkFlag(vA, bmRef) : null;
            const flagB  = benchmark ? benchmarkFlag(vB, bmRef) : null;
            const worstFlag = flagA?.level === "breach" || flagB?.level === "breach" ? "breach"
                            : flagA?.level === "warn"   || flagB?.level === "warn"   ? "warn" : null;

            return (
              <tr key={row.label} className={`border-b border-border/20 ${i % 2 === 0 ? "" : "bg-muted/10"} ${worstFlag === "breach" ? "bg-red-500/5" : worstFlag === "warn" ? "bg-amber-500/5" : ""}`}>
                <td className="px-3 py-2 text-foreground/90 whitespace-nowrap">
                  {row.label}
                  {worstFlag && (
                    <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded font-semibold ${FLAG_STYLE[worstFlag]}`}>
                      {worstFlag === "breach" ? "▲ over" : "~ near"}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-muted-foreground font-mono hidden lg:table-cell">{row.formula}</td>
                <td className={`px-3 py-2 text-right font-mono ${flagA?.level === "breach" ? "text-red-400" : flagA?.level === "warn" ? "text-amber-400" : ""}`}>
                  {row.fmt(vA)}{row.unit}
                </td>
                <td className={`px-3 py-2 text-right font-mono ${flagB?.level === "breach" ? "text-red-400" : flagB?.level === "warn" ? "text-amber-400" : ""}`}>
                  {row.fmt(vB)}{row.unit}
                </td>
                <td className={`px-3 py-2 text-right font-mono font-bold ${ratioColor}`}>{ratioStr}</td>
                {benchmark && (
                  <td className="px-3 py-2 text-right font-mono text-blue-400/70">
                    {bmRef != null ? `${row.fmt(bmRef)}${row.unit}` : <span className="text-muted-foreground/30">—</span>}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Benchmark flags panel ─────────────────────────────────────────────────────
function BenchmarkPanel({ a, b, labelA, labelB, benchmark }: {
  a: FootprintResult; b: FootprintResult; labelA: string; labelB: string;
  benchmark: ReturnType<typeof getBenchmarkRef>;
}) {
  if (!benchmark) return null;

  const breaches: { label: string; model: string; pct: number; remediation: string }[] = [];

  TABLE_ROWS.forEach(row => {
    const bmRef = benchmark[row.key] as number | null;
    if (bmRef == null) return;
    const fA = benchmarkFlag(a[row.key] as number, bmRef);
    const fB = benchmarkFlag(b[row.key] as number, bmRef);
    if (fA && fA.level !== "ok") breaches.push({ label: row.label, model: labelA, pct: fA.pct, remediation: BENCHMARK_REMEDIATIONS[row.key] ?? "" });
    if (fB && fB.level !== "ok") breaches.push({ label: row.label, model: labelB, pct: fB.pct, remediation: BENCHMARK_REMEDIATIONS[row.key] ?? "" });
  });

  if (breaches.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-xs text-emerald-400 flex items-center gap-2 mt-3">
        <span>✓</span>
        <span>Both models within benchmark range for all available metrics ({benchmark.source} · {benchmark.taskClass})</span>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-amber-400">
          {breaches.filter(b => b.pct > 100).length > 0 ? "⚠ " : ""}
          {breaches.length} metric{breaches.length > 1 ? "s" : ""} above benchmark
          <span className="text-muted-foreground font-normal ml-2">({benchmark.source} · {benchmark.taskClass})</span>
        </p>
        <span className="text-[10px] text-muted-foreground/50">{benchmark.citation}</span>
      </div>
      <div className="space-y-2">
        {breaches.map((b, i) => (
          <div key={i} className={`rounded-lg border px-3 py-2.5 text-xs ${b.pct > 100 ? "border-red-500/30 bg-red-500/5" : "border-amber-500/20 bg-amber-500/5"}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className={`font-semibold ${b.pct > 100 ? "text-red-400" : "text-amber-400"}`}>{b.label}</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">{b.model}</span>
              <span className={`ml-auto text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${b.pct > 100 ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"}`}>
                +{Math.round(b.pct)}% above ref
              </span>
            </div>
            <p className="text-muted-foreground/80 leading-relaxed">{b.remediation}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Formula flow strip — shows how inputs trickle into each calculation ───────
function FormulaFlow({ model, pue, wue, gridIntensity }: {
  model: ModelConfig; pue: number; wue: number; gridIntensity: number;
}) {
  const tdp    = model.gpuType === "Custom" ? model.customTdpWatts : (GPU_PRESETS[model.gpuType] ?? model.customTdpWatts);
  const gpuKw  = (model.numGpus * tdp) / 1000;
  const trainGpuKwh   = gpuKw * model.trainingHours;
  const trainTotalKwh = trainGpuKwh * pue;
  const trainCarbon   = (trainTotalKwh * gridIntensity) / 1000;
  const infGpuSec     = model.requestsPerDay * model.latencySeconds;
  const infGpuHrs     = infGpuSec / 3600;
  const infGpuKwh     = (tdp / 1000) * infGpuHrs;
  const infTotalKwh   = infGpuKwh * pue;
  const infCarbonDay  = (infTotalKwh * gridIntensity) / 1000;

  const row = (step: string, formula: string, result: string) => (
    <div className="flex items-start gap-2 text-xs">
      <span className="text-violet-400 font-mono w-4 flex-shrink-0 pt-0.5">→</span>
      <div className="flex-1 min-w-0">
        <span className="text-muted-foreground">{step}: </span>
        <span className="font-mono text-foreground/70">{formula}</span>
        <span className="font-mono text-violet-300 font-bold ml-1">= {result}</span>
      </div>
    </div>
  );

  return (
    <div className="mt-3 pt-3 border-t border-border/30 space-y-1">
      <div className="text-xs font-semibold text-muted-foreground mb-2">Training calculation path</div>
      {row("GPU power",     `${model.numGpus} × ${tdp}W ÷ 1000`,              `${gpuKw.toFixed(3)} kW`)}
      {row("GPU energy",    `${gpuKw.toFixed(3)} × ${model.trainingHours}h`,   `${fmt1(trainGpuKwh)} kWh`)}
      {row("+ PUE overhead",`${fmt1(trainGpuKwh)} × ${pue}`,                   `${fmt1(trainTotalKwh)} kWh`)}
      {row("Training carbon", `${fmt1(trainTotalKwh)} × ${gridIntensity} ÷ 1000`,            `${fmt1(trainCarbon)} kgCO₂e`)}
      {row("Training water",  `${fmt1(trainGpuKwh)} kWh × WUE ${wue} L/kWh`,                `${fmt1(trainGpuKwh * wue)} L`)}
      <div className="text-xs font-semibold text-muted-foreground mt-3 mb-2">Inference calculation path</div>
      {row("Latency × req",   `${model.latencySeconds}s × ${model.requestsPerDay.toLocaleString()} req`, `${infGpuSec.toLocaleString()} GPU-sec`)}
      {row("GPU-hrs/day",     `${infGpuSec.toLocaleString()}s ÷ 3600`,                       `${infGpuHrs.toFixed(3)} hrs`)}
      {row("Inf energy/day",  `${(tdp/1000).toFixed(3)} kW × ${infGpuHrs.toFixed(3)}h × PUE ${pue}`, `${fmt1(infTotalKwh)} kWh`)}
      {row("Inf carbon/day",  `${fmt1(infTotalKwh)} × ${gridIntensity} ÷ 1000`,              `${infCarbonDay.toFixed(4)} kgCO₂e`)}
      {row("Inf water/day",   `${fmt1(infGpuKwh)} kWh × WUE ${wue} L/kWh`,                  `${(infGpuKwh * wue).toFixed(4)} L`)}
    </div>
  );
}

// ── Model input form ──────────────────────────────────────────────────────────
function ModelForm({ model, onChange, onReset, label, pue, wue, gridIntensity }: {
  model: ModelConfig; onChange: (m: ModelConfig) => void; onReset?: () => void; label: string;
  pue: number; wue: number; gridIntensity: number;
}) {
  const [showFlow, setShowFlow] = useState(false);
  const set = (key: keyof ModelConfig, value: string | number) =>
    onChange({ ...model, [key]: value });

  const tdp = model.gpuType === "Custom" ? model.customTdpWatts : (GPU_PRESETS[model.gpuType] ?? model.customTdpWatts);

  return (
    <div className="rounded-xl border border-border/40 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</div>
        {onReset && (
          <button
            onClick={onReset}
            className="text-[10px] text-muted-foreground/50 hover:text-muted-foreground border border-border/30 hover:border-border/60 px-2 py-0.5 rounded transition-colors"
            title="Reset to default values"
          >
            ↺ Reset
          </button>
        )}
      </div>

      <div>
        <label className="text-xs text-muted-foreground block mb-1">Model name</label>
        <input
          className="w-full bg-muted/30 border border-border/40 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-violet-500/60"
          value={model.name}
          onChange={e => set("name", e.target.value)}
        />
      </div>

      {/* GPU type + # GPUs always side by side */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-muted-foreground block mb-1" title="GPU model. TDP (Thermal Design Power) is the maximum rated wattage under full load. Source: NVIDIA specs + MLCommons MLPerf benchmarks.">GPU type</label>
          <select
            className="w-full bg-muted/30 border border-border/40 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-violet-500/60"
            value={model.gpuType}
            onChange={e => set("gpuType", e.target.value)}
          >
            {Object.entries(getEffectiveGPUPresets()).map(([g, tdp]) => (
              <option key={g} value={g}>{g} ({tdp}W)</option>
            ))}
            <option value="Custom">Custom TDP</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1" title="Number of GPUs used in parallel. For training: total GPUs in the job. For inference: typically 1 GPU per request (or per replica)."># GPUs</label>
          <input
            type="number" min={1}
            className="w-full bg-muted/30 border border-border/40 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-violet-500/60"
            value={model.numGpus}
            onChange={e => set("numGpus", Number(e.target.value))}
          />
        </div>
      </div>

      {/* Custom TDP — only shown when Custom selected */}
      {model.gpuType === "Custom" && (
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Custom TDP (watts)</label>
          <input
            type="number" min={1}
            className="w-full bg-muted/30 border border-border/40 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-violet-500/60"
            value={model.customTdpWatts}
            onChange={e => set("customTdpWatts", Number(e.target.value))}
          />
        </div>
      )}

      {/* Training hrs + Requests/day + Latency — all three in one row */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-xs text-muted-foreground block mb-1" title="Total wall-clock hours for the full training run. Multiply days × 24 if you think in days. E.g. 3 days = 72 hrs.">Training hrs</label>
          <input
            type="number" min={0}
            className="w-full bg-muted/30 border border-border/40 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-violet-500/60"
            value={model.trainingHours}
            onChange={e => set("trainingHours", Number(e.target.value))}
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1" title="Average number of API calls or inference requests served per day. Dev/test: ~10,000. Production chatbot: 100k–1M. High-scale: 10M+.">Req / day</label>
          <input
            type="number" min={0}
            className="w-full bg-muted/30 border border-border/40 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-violet-500/60"
            value={model.requestsPerDay}
            onChange={e => set("requestsPerDay", Number(e.target.value))}
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1" title="Average time in seconds to generate one response. This determines how many GPU-seconds are consumed per request. 7B model ≈ 0.2s. 70B model ≈ 0.8s. Longer latency = more GPU time = more energy per request.">Latency (s)</label>
          <input
            type="number" min={0} step={0.05}
            className="w-full bg-muted/30 border border-border/40 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-violet-500/60"
            value={model.latencySeconds}
            onChange={e => set("latencySeconds", Number(e.target.value))}
          />
        </div>
      </div>

      {/* TDP chip */}
      <div className="text-xs text-muted-foreground font-mono">
        {model.numGpus} × {tdp}W = <span className="text-violet-400 font-bold">{((model.numGpus * tdp)/1000).toFixed(3)} kW</span> total GPU draw
      </div>

      {/* Formula flow toggle */}
      <button
        className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
        onClick={() => setShowFlow(v => !v)}
      >
        {showFlow ? "▾ Hide" : "▸ Show"} calculation path
      </button>
      {showFlow && <FormulaFlow model={model} pue={pue} wue={wue} gridIntensity={gridIntensity} />}
    </div>
  );
}

// ── Preview (locked state) ─────────────────────────────────────────────────────
const PREVIEW_A = calculateFootprint(DEFAULT_MODEL_A, 1.1, 0.35, 380);
const PREVIEW_B = calculateFootprint(DEFAULT_MODEL_B, 1.1, 0.35, 380);

function CarbonDepthPreview() {
  const fmt = (n: number, d = 1) => n.toFixed(d);
  const metrics = [
    { label: "Training energy",     a: `${fmt(PREVIEW_A.trainTotalEnergyKwh)} kWh`,   b: `${fmt(PREVIEW_B.trainTotalEnergyKwh)} kWh`,   ratio: PREVIEW_B.trainTotalEnergyKwh / PREVIEW_A.trainTotalEnergyKwh,   hot: true },
    { label: "Training carbon",     a: `${fmt(PREVIEW_A.trainCarbonKg)} kg`,           b: `${fmt(PREVIEW_B.trainCarbonKg)} kg`,           ratio: PREVIEW_B.trainCarbonKg / PREVIEW_A.trainCarbonKg,               hot: true },
    { label: "Training water",      a: `${fmt(PREVIEW_A.trainWaterLitres)} L`,         b: `${fmt(PREVIEW_B.trainWaterLitres)} L`,         ratio: PREVIEW_B.trainWaterLitres / PREVIEW_A.trainWaterLitres,         hot: false },
    { label: "Inf energy / day",    a: `${fmt(PREVIEW_A.infEnergyKwhDay, 3)} kWh`,     b: `${fmt(PREVIEW_B.infEnergyKwhDay, 3)} kWh`,     ratio: PREVIEW_B.infEnergyKwhDay / PREVIEW_A.infEnergyKwhDay,           hot: false },
    { label: "Inf carbon / day",    a: `${fmt(PREVIEW_A.infCarbonKgDay, 4)} kg`,       b: `${fmt(PREVIEW_B.infCarbonKgDay, 4)} kg`,       ratio: PREVIEW_B.infCarbonKgDay / PREVIEW_A.infCarbonKgDay,             hot: false },
    { label: "Inf water / day",     a: `${fmt(PREVIEW_A.infWaterLitresDay, 3)} L`,     b: `${fmt(PREVIEW_B.infWaterLitresDay, 3)} L`,     ratio: PREVIEW_B.infWaterLitresDay / PREVIEW_A.infWaterLitresDay,       hot: false },
    { label: "Cost / inference",    a: `$${(PREVIEW_A.costPerRequestCents / 100).toExponential(2)}`, b: `$${(PREVIEW_B.costPerRequestCents / 100).toExponential(2)}`, ratio: PREVIEW_B.costPerRequestCents / PREVIEW_A.costPerRequestCents, hot: false },
  ];

  const crossA = fmt(PREVIEW_A.crossoverDays, 0);
  const crossB = fmt(PREVIEW_B.crossoverDays, 0);

  return (
    <div>
      {/* Nav */}
      <div className="bg-background/95 backdrop-blur border-b border-border/40">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link to="/#projects" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            ← Back to Portfolio
          </Link>
          <span className="text-xs font-mono text-violet-500">Preview</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 pt-5 pb-4 space-y-4">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-mono text-violet-500 bg-violet-500/10 px-2 py-0.5 rounded">Sustainable AI</span>
            <span className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">Phase 1 · Live</span>
          </div>
          <h1 className="text-xl font-bold mb-1">AI Carbon Footprint Calculator</h1>
          <p className="text-xs text-muted-foreground">
            Energy, carbon, and water footprint for AI training and inference — with EU GPAI Act and CSRD regulatory flags.
            Validated against Strubell 2019, Patterson 2021, BLOOM 2022 (±15%).
          </p>
        </div>

        {/* Full 7-metric comparison */}
        <div>
          <p className="text-[10px] text-muted-foreground mb-1.5">Sample — 7B vs 70B model · 100k req/day · US-East hyperscaler · 380 gCO₂/kWh</p>
          <div className="rounded-xl border border-border/60 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/60 bg-muted/20">
                  <th className="text-left px-3 py-1.5 text-muted-foreground font-medium">Metric</th>
                  <th className="text-right px-3 py-1.5 text-muted-foreground font-medium">7B Model</th>
                  <th className="text-right px-3 py-1.5 text-muted-foreground font-medium">70B Model</th>
                  <th className="text-right px-3 py-1.5 text-muted-foreground font-medium">Ratio</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map((m, i) => (
                  <tr key={m.label} className={`border-b border-border/40 last:border-0 ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                    <td className="px-3 py-1.5 font-medium">{m.label}</td>
                    <td className="px-3 py-1.5 text-right text-muted-foreground font-mono">{m.a}</td>
                    <td className="px-3 py-1.5 text-right text-muted-foreground font-mono">{m.b}</td>
                    <td className={`px-3 py-1.5 text-right font-mono font-bold ${m.ratio > 5 ? "text-rose-500" : m.ratio > 2 ? "text-amber-500" : "text-muted-foreground"}`}>
                      {fmt(m.ratio)}×
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Crossover insight cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
            <p className="text-[10px] font-mono text-emerald-500 uppercase tracking-wider mb-1">7B — inference crossover</p>
            <p className="text-lg font-bold">{crossA} days</p>
            <p className="text-[10px] text-muted-foreground">until daily inference carbon exceeds training</p>
          </div>
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-3">
            <p className="text-[10px] font-mono text-rose-500 uppercase tracking-wider mb-1">70B — inference crossover</p>
            <p className="text-lg font-bold">{crossB} days</p>
            <p className="text-[10px] text-muted-foreground">training carbon is the dominant cost for longer</p>
          </div>
        </div>

        {/* What you can do — 3 capability pills */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: "⚙️", label: "Configure", desc: "GPU type, region, training hours, inference volume" },
            { icon: "📊", label: "Compare", desc: "Side-by-side any two model configs with live recalculation" },
            { icon: "📋", label: "Benchmark", desc: "Your model vs MLPerf, AIEnergyScore, and research medians" },
          ].map(c => (
            <div key={c.label} className="rounded-xl border border-border/40 bg-muted/10 p-3">
              <div className="text-base mb-1">{c.icon}</div>
              <div className="text-xs font-semibold mb-0.5">{c.label}</div>
              <div className="text-[10px] text-muted-foreground leading-relaxed">{c.desc}</div>
            </div>
          ))}
        </div>

        {/* Blurred tease — interactive inputs + reg flags */}
        <div style={{ filter: "blur(5px)", opacity: 0.5, pointerEvents: "none", userSelect: "none" }} className="space-y-3">
          {/* Fake model config panels */}
          <div className="grid grid-cols-2 gap-3">
            {["Model A (7B)", "Model B (70B)"].map(label => (
              <div key={label} className="rounded-xl border border-border/40 bg-muted/10 p-4 space-y-2">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</div>
                <div className="h-8 w-full rounded-lg bg-muted/40" />
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-8 rounded-lg bg-muted/30" />
                  <div className="h-8 rounded-lg bg-muted/30" />
                </div>
                <div className="h-8 w-full rounded-lg bg-muted/40" />
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-8 rounded-lg bg-muted/30" />
                  <div className="h-8 rounded-lg bg-muted/30" />
                </div>
              </div>
            ))}
          </div>
          {/* Fake reg flags */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "EU GPAI Act Art. 53", color: "text-amber-400 border-amber-500/30 bg-amber-500/5" },
              { label: "CSRD / ESRS E1",      color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/5" },
              { label: "GRI 305",             color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/5" },
            ].map(f => (
              <div key={f.label} className={`rounded-xl border p-3 ${f.color}`}>
                <div className="text-[10px] font-mono mb-1.5">{f.label}</div>
                <div className="h-2 rounded-full bg-current opacity-20 mb-1.5" />
                <div className="h-2 w-2/3 rounded bg-current opacity-10" />
              </div>
            ))}
          </div>
          {/* Fake benchmark panel */}
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 space-y-2">
            <div className="text-[10px] font-mono text-blue-400 uppercase tracking-wider">Benchmark comparison — MLPerf Power · Text gen small</div>
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map(i => <div key={i} className="h-14 rounded-lg bg-blue-500/10 border border-blue-500/20" />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Recommendation Agent ──────────────────────────────────────────────────────
// Rule-based, zero API cost. Reads the current model config + results and generates
// ranked recommendations. User multi-selects; savings stack multiplicatively.
// Trajectory chart: current vs optimised carbon path over 12 months.
const REC_PRIORITY_STYLE: Record<Recommendation["priority"], string> = {
  high:   "bg-red-500/10 text-red-400 border border-red-500/20",
  medium: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  low:    "bg-muted/20 text-muted-foreground border border-border/30",
};

// ── Threshold status chip ─────────────────────────────────────────────────────
function ThresholdChip({
  label, sublabel, threshold, current, optimised, infPerDay, trainBaseline, color, tooltip,
}: {
  label: string; sublabel: string; threshold: number;
  current: number; optimised: number;
  infPerDay: number; trainBaseline: number;
  color: "amber" | "rose"; tooltip: string;
}) {
  // Estimate the day the current path crosses the threshold (linear approximation)
  const daysToThreshold = infPerDay > 0
    ? Math.max(0, (threshold - trainBaseline) / infPerDay)
    : Infinity;
  const monthsToThreshold = daysToThreshold / 30;

  const isAbove    = current >= threshold;
  const isOptAbove = optimised >= threshold;

  const colorMap = {
    amber: {
      above:    "border-amber-500/40 bg-amber-500/10 text-amber-400",
      below:    "border-border/30 bg-muted/10 text-muted-foreground",
      dot:      "bg-amber-400",
      dotBelow: "bg-muted-foreground/30",
    },
    rose: {
      above:    "border-rose-500/40 bg-rose-500/10 text-rose-400",
      below:    "border-border/30 bg-muted/10 text-muted-foreground",
      dot:      "bg-rose-400",
      dotBelow: "bg-muted-foreground/30",
    },
  };
  const c = colorMap[color];

  const statusText = isAbove
    ? `⚑ above threshold (${fmt1(current)} kg / ${(threshold / 1000).toFixed(0)}t)`
    : isFinite(monthsToThreshold) && monthsToThreshold <= 18
    ? `→ crosses in ~${monthsToThreshold < 1 ? "<1" : Math.round(monthsToThreshold)} mo (${fmt1(current)} kg now)`
    : `✓ below (${fmt1(current)} kg / ${(threshold / 1000).toFixed(0)}t threshold)`;

  const optimisedText = isOptAbove
    ? `optimised still above`
    : isAbove && !isOptAbove
    ? `optimised drops below ✓`
    : null;

  return (
    <div
      className={`flex items-center justify-between rounded-lg border px-3 py-1.5 gap-3 cursor-help ${isAbove ? c.above : c.below}`}
      title={tooltip}
    >
      <div className="flex items-center gap-2 min-w-0">
        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isAbove ? c.dot : c.dotBelow}`} />
        <span className="text-[10px] font-semibold">{label}</span>
        <span className="text-[9px] opacity-60 hidden sm:inline">{sublabel}</span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-[10px] font-mono">{statusText}</span>
        {optimisedText && (
          <span className="text-[9px] text-emerald-400 font-medium">{optimisedText}</span>
        )}
      </div>
    </div>
  );
}

// ── Carbon credits / offsets explainer ───────────────────────────────────────
function CreditsInfo() {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-border/30 bg-muted/5 overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-3.5 py-2.5 text-left hover:bg-muted/10 transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <span className="text-[11px] font-semibold text-muted-foreground">
          Carbon credits, offsets &amp; RECs — what counts?
        </span>
        <span className="text-[10px] text-muted-foreground">{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <div className="px-3.5 pb-3.5 space-y-3 text-[11px] text-muted-foreground leading-relaxed">
          <div>
            <span className="font-semibold text-foreground/70">Carbon credit</span>{" "}
            = 1 tonne CO₂e avoided or removed, issued by a recognised body (Verra/VCS, Gold Standard, CDM).
            You buy credits to "cancel" emissions on paper. This is called <span className="italic">offsetting</span>.
          </div>
          <div>
            <span className="font-semibold text-foreground/70">REC (Renewable Energy Certificate)</span>{" "}
            ≠ carbon offset. A REC proves that 1 MWh of renewable electricity was generated somewhere on the grid.
            Buying RECs changes your <span className="italic">reported</span> Scope 2 from location-based to market-based
            — but does not change the physical electrons or reduce actual grid emissions.
            GRI 305-2 requires you to disclose <span className="font-semibold">both</span> methods.
          </div>
          <div>
            <span className="font-semibold text-foreground/70">Why offsets are controversial</span>{" "}
            — An offset that "avoids" deforestation in one place while emissions continue elsewhere is not a
            removal. The IPCC AR6 (2022) found that most offset project categories have high uncertainty or
            impermanence. The EU Greenwashing Directive (2024/825) restricts "carbon neutral" claims based on offsets.
          </div>
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2.5 space-y-1.5">
            <p className="font-semibold text-amber-400 text-[10px] uppercase tracking-wider">SBTi position — when offsetting stops being acceptable</p>
            <ul className="space-y-1 text-[10px]">
              <li>· <span className="font-semibold text-foreground/70">Near-term targets (by 2030):</span> Companies must reduce Scope 1+2 by 30–50% (sector-dependent). Offsets do NOT count toward near-term targets. Reductions only.</li>
              <li>· <span className="font-semibold text-foreground/70">Net-zero target (by 2050):</span> 90–95% absolute reduction in Scope 1+2. Remaining 5–10% can be "neutralised" — but only with permanent removals (BECCS, DACCS, biochar), not avoided-emission offsets.</li>
              <li>· <span className="font-semibold text-foreground/70">Beyond value chain mitigation:</span> Voluntary offsetting beyond your targets is encouraged but must be disclosed separately from reduction claims.</li>
            </ul>
          </div>
          <div>
            <span className="font-semibold text-foreground/70">For AI workloads specifically:</span>{" "}
            The highest-impact actions are the ones in this tool — switching region, quantising models, upgrading hardware.
            These create real, permanent, verifiable reductions in actual emissions.
            Buying RECs for your data centre electricity is a valid market-based Scope 2 accounting step,
            but it is not a substitute for reducing the underlying kWh consumed.
          </div>
          <p className="text-[9px] text-muted-foreground/40">
            Sources: SBTi Corporate Net-Zero Standard v1.2 (2023) · IPCC AR6 WG3 (2022) · EU Directive 2024/825 · GRI 305-2 methodology.
          </p>
        </div>
      )}
    </div>
  );
}

// ── How this model scales ─────────────────────────────────────────────────────
function ScalabilityNote() {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-border/30 bg-muted/5 overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-3.5 py-2.5 text-left hover:bg-muted/10 transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <span className="text-[11px] font-semibold text-muted-foreground">
          How this tool scales with new GPUs, regions &amp; policies
        </span>
        <span className="text-[10px] text-muted-foreground">{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <div className="px-3.5 pb-3.5 space-y-3 text-[11px] text-muted-foreground leading-relaxed">
          <p>
            The tool is built as a declarative data + rules model. All lookup tables and thresholds live in
            one file (<span className="font-mono text-violet-400/70">src/data/carbonDepthData.ts</span>) and
            can be updated independently of the UI.
          </p>
          <div className="space-y-2">
            <div className="rounded-lg bg-muted/20 border border-border/20 px-3 py-2">
              <p className="font-semibold text-foreground/60 text-[10px] mb-1">New GPU model (e.g. H200, B200)</p>
              <p>Add one entry to <span className="font-mono text-violet-400/70">GPU_PRESETS</span>: GPU name → TDP in watts. Source: MLPerf Power or vendor datasheet. The full calculator picks it up instantly.</p>
            </div>
            <div className="rounded-lg bg-muted/20 border border-border/20 px-3 py-2">
              <p className="font-semibold text-foreground/60 text-[10px] mb-1">New cloud region (e.g. AWS Middle East, GCP Africa)</p>
              <p>Add to <span className="font-mono text-violet-400/70">REGION_ZONES</span> (region name → Electricity Maps zone ID) and to <span className="font-mono text-violet-400/70">STATIC_INTENSITY</span> (zone ID → gCO₂/kWh annual average). Source: Electricity Maps API or IEA country data.</p>
            </div>
            <div className="rounded-lg bg-muted/20 border border-border/20 px-3 py-2">
              <p className="font-semibold text-foreground/60 text-[10px] mb-1">New regulation or updated threshold</p>
              <p>Thresholds live in <span className="font-mono text-violet-400/70">getRegFlags()</span>. Compliance tab obligations live in <span className="font-mono text-violet-400/70">buildObligations()</span>. Both are plain TypeScript — no framework to learn. Flag values update immediately across all views.</p>
            </div>
            <div className="rounded-lg bg-muted/20 border border-border/20 px-3 py-2">
              <p className="font-semibold text-foreground/60 text-[10px] mb-1">New recommendation type</p>
              <p>Add a new conditional block in <span className="font-mono text-violet-400/70">generateRecommendations()</span> with an id, saving %, rationale, and action. The UI renders it automatically with the existing card and chart logic.</p>
            </div>
            <div className="rounded-lg bg-muted/20 border border-border/20 px-3 py-2">
              <p className="font-semibold text-foreground/60 text-[10px] mb-1">When to revisit</p>
              <p>GPU TDP values: annually (new MLPerf Power release, usually November). Grid intensity: live via Electricity Maps API or update static table annually (IEA Electricity 2024). Regulatory thresholds: on any major regulatory update (EU AI Act delegated acts, CSRD ESRS review 2026, SBTi sector pathways).</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type RetrainingFreq = 1 | 4 | 12;
type DataResidency  = "none" | "eu-gdpr" | "us-gov" | "india-dpdp" | "china-pipl" | "apac" | "me-gov" | "latency";

const RESIDENCY_INFO: Record<DataResidency, { label: string; tip: string }> = {
  none:          { label: "No constraints",                       tip: "Any region can be recommended based on carbon intensity alone." },
  "eu-gdpr":     { label: "EU data residency (GDPR Art. 44+)",    tip: "EU personal data cannot leave the EEA without an adequacy decision or SCCs. US regions (Oregon, Virginia) are typically blocked. Ireland (eu-west-1), Frankfurt, Stockholm, Paris remain valid." },
  "us-gov":      { label: "US federal / GovCloud",                tip: "FedRAMP High / GovCloud requirement. Workloads must stay on US government-authorised infrastructure. Non-US regions (Ireland, APAC) are blocked." },
  "india-dpdp":  { label: "India — DPDP Act 2023",               tip: "Digital Personal Data Protection Act 2023. Personal data of Indian residents must be processed in India or countries explicitly notified by the Indian government as trusted. Cross-border transfers to US/EU require contractual safeguards; China is blocked." },
  "china-pipl":  { label: "China — PIPL / DSL",                  tip: "Personal Information Protection Law + Data Security Law. 'Important data' and sensitive personal data must stay within China. Cross-border transfer requires a security assessment by CAC. US and EU regions blocked for regulated data." },
  apac:          { label: "APAC general (SG / JP / KR)",          tip: "Singapore PDPA, Japan APPI, South Korea PIPA — all allow cross-border transfer with adequate protection. US and EU regions are generally permitted with DPAs in place. China is blocked (separate PIPL regime)." },
  "me-gov":      { label: "Middle East — KSA / UAE gov data",     tip: "Saudi NDMO regulations and UAE PDPL require government and sensitive data to remain in-country. Commercial AI workloads can use regional AWS/Azure (Riyadh, Dubai), which are lower carbon than US East." },
  latency:       { label: "Latency SLA <100ms",                   tip: "Cross-ocean routing adds ~150ms RTT. Can only recommend same-continent alternatives. In-continent low-carbon regions still apply (Oregon for US, Stockholm/Ireland for EU)." },
};

interface ResidencyBlock {
  blocksOregon: boolean;
  blocksIreland: boolean;
  note: string;
  alternativeRegion?: string;
  alternativeIntensity?: number;
}

const RESIDENCY_REGION_BLOCKS: Record<DataResidency, ResidencyBlock> = {
  none:         { blocksOregon: false, blocksIreland: false, note: "" },
  "eu-gdpr":    { blocksOregon: true,  blocksIreland: false,
    note: "us-west-2 (Oregon) blocked — GDPR Art. 44+ prohibits transferring EU personal data to US infrastructure without an adequacy decision (US has none for general transfers post-Schrems II). Compliant alternative: eu-west-1 (Ireland, ~350 gCO₂/kWh) or eu-north-1 (Stockholm, ~8 gCO₂/kWh) stays within EEA.",
    alternativeRegion: "eu-north-1 (Stockholm)", alternativeIntensity: 8 },
  "us-gov":     { blocksOregon: false, blocksIreland: true,
    note: "eu-west-1 (Ireland) blocked — FedRAMP High / IL4+ requires US government infrastructure. Alternative: us-gov-west-1 (GovCloud West, Oregon-based hydro+wind, ~50 gCO₂/kWh) achieves comparable or better savings within authorised infrastructure.",
    alternativeRegion: "us-gov-west-1 (GovCloud West)", alternativeIntensity: 50 },
  "india-dpdp": { blocksOregon: true, blocksIreland: true,
    note: "Cross-border transfer to US/EU requires SCCs and may not be permitted for sensitive data under DPDP 2023 before the government notifies trusted countries. Compliant alternative: ap-south-1 (Mumbai, ~700 gCO₂/kWh, Indian coal-heavy grid) — carbon saving is limited. Consider green energy procurement in Mumbai to reduce intensity.",
    alternativeRegion: "ap-south-1 (Mumbai)", alternativeIntensity: 700 },
  "china-pipl": { blocksOregon: true, blocksIreland: true,
    note: "PIPL/DSL require a CAC security assessment for any cross-border transfer of 'important data'. US and EU regions are blocked for regulated workloads. Alternative: cn-north-1 (Beijing, ~600 gCO₂/kWh, coal-heavy) or cn-northwest-1 (Ningxia, ~400 gCO₂/kWh, some renewables). Carbon saving through region switch is limited within China — hardware efficiency and quantisation are higher-impact levers.",
    alternativeRegion: "cn-northwest-1 (Ningxia)", alternativeIntensity: 400 },
  apac:         { blocksOregon: false, blocksIreland: false,
    note: "APAC general regime allows US/EU transfers with appropriate DPAs. Oregon and Ireland are valid. For lowest carbon: ap-southeast-1 (Singapore, ~380 gCO₂/kWh) or us-west-2 (Oregon, 130 gCO₂/kWh) are both compliant options.",
    alternativeRegion: "us-west-2 (Oregon)", alternativeIntensity: 130 },
  "me-gov":     { blocksOregon: true, blocksIreland: true,
    note: "Government and sensitive data must remain in-country under NDMO (Saudi) and PDPL (UAE). Commercial workloads can use me-south-1 (Bahrain, ~500 gCO₂/kWh) or me-central-1 (UAE, ~400 gCO₂/kWh). Carbon savings vs US East are modest — hardware efficiency gains are more impactful in this regulatory context.",
    alternativeRegion: "me-central-1 (UAE)", alternativeIntensity: 400 },
  latency:      { blocksOregon: false, blocksIreland: false,
    note: "Cross-ocean moves blocked by latency SLA. Same-continent alternatives: us-west-2 (Oregon, 130 gCO₂/kWh) for US workloads, eu-north-1 (Stockholm, 8 gCO₂/kWh) for EU workloads. Multi-region active-active routing preserves SLA while shifting bulk compute to lower-carbon zones.",
    alternativeRegion: "eu-north-1 (Stockholm)", alternativeIntensity: 8 },
};

function RecommendationAgent({
  modelA, modelB, resultA, resultB, gridIntensity,
}: {
  modelA: ModelConfig; modelB: ModelConfig;
  resultA: FootprintResult; resultB: FootprintResult;
  gridIntensity: number;
}) {
  const [open, setOpen]               = useState(false);
  const [selected, setSelected]       = useState<Set<string>>(new Set());
  const [retrainingFreq, setRetrain]  = useState<RetrainingFreq>(1);
  const [dataResidency, setResidency] = useState<DataResidency>("none");

  const recs = useMemo(
    () => generateRecommendations(modelA, modelB, resultA, resultB, gridIntensity),
    [modelA, modelB, resultA, resultB, gridIntensity],
  );

  const toggle = (id: string) =>
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const combinedSaving   = useMemo(() => calcCombinedSaving(recs, selected), [recs, selected]);
  const combinedInfDay   = resultA.infCarbonKgDay + resultB.infCarbonKgDay;
  const combinedTrain    = resultA.trainCarbonKg  + resultB.trainCarbonKg;
  const combinedInfYear  = resultA.infCarbonKgYear + resultB.infCarbonKgYear;

  // Trajectory: training may spike multiple times if re-training is scheduled
  const trajectoryData = useMemo(() => {
    const pts = [];
    const retrainInterval = retrainingFreq > 1 ? 365 / retrainingFreq : null;
    for (let day = 0; day <= 365; day += 7) {
      const d = new Date();
      d.setDate(d.getDate() + day);
      const label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      // Count how many training runs have been paid by this day
      const runsPaid = retrainInterval == null
        ? 1
        : 1 + Math.floor(day / retrainInterval);
      const cumulativeTrain = combinedTrain * runsPaid;
      pts.push({
        day, label,
        current:   parseFloat((cumulativeTrain + combinedInfDay * day).toFixed(2)),
        optimised: parseFloat((cumulativeTrain + combinedInfDay * (1 - combinedSaving) * day).toFixed(2)),
        trainBaseline: parseFloat(cumulativeTrain.toFixed(2)),
      });
    }
    return pts;
  }, [combinedTrain, combinedInfDay, combinedSaving, retrainingFreq]);

  const lastPt         = trajectoryData[trajectoryData.length - 1] ?? { current: 0, optimised: 0 };
  const annualInfTotal = combinedInfDay * 365;
  const annualSaved    = annualInfTotal * combinedSaving;
  const residencyBlock = RESIDENCY_REGION_BLOCKS[dataResidency];

  // Per-recommendation absolute saving (for materiality label)
  const absKgSaved = (pct: number) => (combinedInfYear * pct) / 100;
  const materialityLabel = (kg: number) =>
    kg > 1000 ? { label: "highly material", color: "text-rose-400" }
    : kg > 100 ? { label: "material",        color: "text-amber-400" }
    : kg > 10  ? { label: "moderate",         color: "text-blue-400" }
    :            { label: "minor",             color: "text-muted-foreground/50" };

  return (
    <div className="rounded-xl border border-border/40">
      {/* Collapsible header */}
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/10 transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Recommendations</span>
          <span className="text-xs text-muted-foreground hidden sm:inline">— rule-based, no API cost</span>
          {selected.size > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 font-semibold border border-violet-500/20">
              {selected.size} selected · −{Math.round(combinedSaving * 100)}% inference
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground">{open ? "▾" : "▸"}</span>
      </button>

      {open && (
        <div className="px-4 pb-5 space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {recs.length} recommendations from your config. Select any combination — savings stack
            multiplicatively. Chart updates live on the right.
          </p>

          {/* ── Context controls ───────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Re-training frequency */}
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Re-training frequency
                <span
                  className="ml-1 text-muted-foreground/50 cursor-help"
                  title="How often is the model re-trained? Each re-training run adds another training carbon spike. Once = initial training only. Quarterly = 4 runs/yr (common for fine-tuning cycles). Monthly = 12 runs/yr (continuous learning). This changes the chart's training baseline significantly."
                >ⓘ</span>
              </label>
              <select
                value={retrainingFreq}
                onChange={e => setRetrain(Number(e.target.value) as RetrainingFreq)}
                className="w-full bg-muted/30 border border-border/40 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-violet-500/60"
              >
                <option value={1}>Once (initial training only)</option>
                <option value={4}>Quarterly (×4 / year)</option>
                <option value={12}>Monthly (×12 / year)</option>
              </select>
              {retrainingFreq > 1 && (
                <p className="text-[10px] text-amber-400/70 mt-1 leading-snug">
                  Training carbon adds {fmt1(combinedTrain)} kgCO₂e per run ×{retrainingFreq} = {fmt1(combinedTrain * retrainingFreq)} kg/yr — watch the chart baseline.
                </p>
              )}
            </div>

            {/* Data residency constraint */}
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Data residency constraint
                <span
                  className="ml-1 text-muted-foreground/50 cursor-help"
                  title="Data sovereignty laws or operational requirements may block certain region switches. Set this to see which recommendations are constrained and what compliant alternatives exist."
                >ⓘ</span>
              </label>
              <select
                value={dataResidency}
                onChange={e => setResidency(e.target.value as DataResidency)}
                className="w-full bg-muted/30 border border-border/40 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-violet-500/60"
              >
                {(Object.keys(RESIDENCY_INFO) as DataResidency[]).map(k => (
                  <option key={k} value={k}>{RESIDENCY_INFO[k].label}</option>
                ))}
              </select>
              <p className="text-[10px] text-muted-foreground mt-1 leading-snug">
                {RESIDENCY_INFO[dataResidency].tip}
              </p>
            </div>
          </div>

          {/* ── Main split: cards LEFT (fixed), chart RIGHT (expands) ─────── */}
          <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-5 items-start">

            {/* LEFT — recommendation cards + saving summary */}
            <div className="space-y-2.5">
              {recs.map(rec => {
                const absKg = absKgSaved(rec.inferenceSavingPct);
                const mat   = materialityLabel(absKg);
                const isConstrained = rec.id === "region" && dataResidency !== "none" &&
                  ((residencyBlock.blocksOregon && rec.action.includes("us-west-2")) ||
                   (residencyBlock.blocksIreland && rec.action.includes("eu-west-1")));

                return (
                  <label
                    key={rec.id}
                    className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${
                      isConstrained
                        ? "border-amber-500/30 bg-amber-500/5 opacity-80"
                        : selected.has(rec.id)
                        ? "border-violet-500/40 bg-violet-500/5"
                        : "border-border/40 hover:border-border/60 bg-transparent"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(rec.id)}
                      onChange={() => toggle(rec.id)}
                      className="mt-0.5 flex-shrink-0 accent-violet-500"
                      disabled={isConstrained}
                    />
                    <div className="flex-1 min-w-0 space-y-1.5">
                      {/* Title row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm leading-none">{rec.icon}</span>
                        <span className="text-xs font-semibold">{rec.title}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${REC_PRIORITY_STYLE[rec.priority]}`}>
                          {rec.priority}
                        </span>
                        {isConstrained && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase bg-amber-500/15 text-amber-400 border border-amber-500/20">
                            constrained
                          </span>
                        )}
                        {/* Saving — % with proxy tooltip + absolute kg with materiality */}
                        <div className="ml-auto flex items-center gap-1.5 flex-shrink-0">
                          <span
                            className="text-xs font-mono font-bold text-emerald-400 cursor-help"
                            title={`Proxy estimate based on published benchmarks (MLCommons MLPerf, Google ML Carbon research). Actual saving depends on your specific model, batch size, and hardware. Test on your workload before committing.`}
                          >
                            −{rec.inferenceSavingPct}%
                          </span>
                          <span
                            className={`text-[10px] font-mono cursor-help ${mat.color}`}
                            title={`Absolute saving: ~${fmt1(absKg)} kgCO₂e/yr on inference.\n\nMateriality: a saving is 'material' for CSRD/GRI purposes when it exceeds ~100 kgCO₂e/yr for most companies (equivalent to ~1/10th of the GRI 305 1t reporting threshold). Below that it is still worth implementing but may not require separate disclosure.\n\nThis is an inference-only saving — training carbon is already paid and unchanged by this action.`}
                          >
                            (~{fmt1(absKg)} kg · {mat.label})
                          </span>
                        </div>
                      </div>
                      {/* Why this applies */}
                      <p className="text-[10px] text-muted-foreground leading-relaxed">{rec.rationale}</p>
                      {/* What to do */}
                      <p className="text-[10px] text-foreground/70 leading-relaxed">
                        <span className="font-semibold text-foreground/50">Action: </span>
                        {rec.action}
                      </p>
                      {/* Constraint override — shown only on region card when blocked */}
                      {isConstrained && residencyBlock.note && (
                        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-2.5 py-2 mt-1">
                          <p className="text-[10px] text-amber-400/80 leading-relaxed">
                            <span className="font-semibold text-amber-400">⚠ Constraint: </span>
                            {residencyBlock.note}
                          </p>
                        </div>
                      )}
                      {/* Tradeoffs */}
                      <p className="text-[10px] text-amber-400/70 leading-relaxed">
                        <span className="font-semibold text-amber-400/90">Tradeoff: </span>
                        {rec.tradeoffs}
                      </p>
                    </div>
                  </label>
                );
              })}

              {/* Combined saving summary */}
              {selected.size > 0 && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 space-y-1">
                  <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                    <span className="font-semibold text-emerald-400">
                      Combined saving — {selected.size} optimisation{selected.size > 1 ? "s" : ""}
                    </span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      −{Math.round(combinedSaving * 100)}% inference carbon
                    </span>
                  </div>
                  <div className="text-[10px] text-muted-foreground leading-relaxed">
                    Saves <span className="font-semibold text-foreground/70">{fmt1(annualSaved)} kgCO₂e/yr</span> on inference.
                    Fleet total at 12 months:{" "}
                    <span className="font-mono">{fmt1(lastPt.current)} kg</span>{" → "}
                    <span className="font-mono text-emerald-400">{fmt1(lastPt.optimised)} kg</span>.
                  </div>
                  <p className="text-[9px] text-muted-foreground/40">
                    Multiplicative stacking: each optimisation reduces what remains after the previous.
                    Training carbon is unchanged — already paid.
                    {retrainingFreq > 1 && ` Re-training ×${retrainingFreq}/yr adds ${fmt1(combinedTrain * retrainingFreq)} kgCO₂e/yr to the training baseline.`}
                  </p>
                </div>
              )}

            </div>

            {/* RIGHT — trajectory chart (sticky, expands to fill space) */}
            <div className="xl:sticky xl:top-20 space-y-2">
              {/* Header */}
              <div className="flex items-center justify-between flex-wrap gap-x-4 gap-y-1">
                <span className="text-xs font-semibold text-muted-foreground">
                  12-month carbon trajectory
                  <span
                    className="ml-1 text-muted-foreground/40 cursor-help text-[10px]"
                    title={`Y-intercept = training carbon (paid once${retrainingFreq > 1 ? `, then every ~${Math.round(365 / retrainingFreq)} days` : ""}). Slope = daily inference accumulation. Savings reduce the slope — training carbon is already paid and unchanged.`}
                  >ⓘ</span>
                </span>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1"><span className="inline-block w-4 h-0.5 rounded" style={{ background: "#6366f1", opacity: 0.6 }} /> Training</span>
                  <span className="flex items-center gap-1"><span className="inline-block w-4 h-0.5 bg-rose-400 rounded" /> Current</span>
                  <span className="flex items-center gap-1"><span className="inline-block w-4 h-0.5 bg-emerald-400 rounded" /> Optimised</span>
                  <span className="flex items-center gap-1"><span className="inline-block w-4 h-0.5 rounded" style={{ background: "#f59e0b", opacity: 0.7 }} /> GRI 305</span>
                  <span className="flex items-center gap-1"><span className="inline-block w-4 h-0.5 rounded" style={{ background: "#f87171", opacity: 0.5 }} /> CSRD advisory</span>
                </div>
              </div>

              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trajectoryData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#94a3b8" }} interval={3} />
                    <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} tickFormatter={v => `${v}kg`} width={60} />
                    <Tooltip
                      contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, fontSize: 11 }}
                      labelStyle={{ color: "#94a3b8", marginBottom: 4 }}
                      formatter={(val: number, name: string) => [
                        `${fmt1(val)} kgCO₂e`,
                        name === "current" ? "Current path" : name === "optimised" ? "Optimised path" : "Training baseline",
                      ]}
                    />
                    {/* Compliance threshold lines — only render when within chart Y range */}
                    {lastPt.current >= 400 && (
                      <ReferenceLine y={1000} stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="5 3" strokeOpacity={0.85} />
                    )}
                    {lastPt.current >= 4000 && (
                      <ReferenceLine y={10000} stroke="#ef4444" strokeWidth={1.5} strokeDasharray="5 3" strokeOpacity={0.7} />
                    )}
                    {/* Training baseline (step — spikes on re-training) */}
                    <Line type="stepAfter" dataKey="trainBaseline" stroke="#6366f1" strokeWidth={1.5} dot={false} strokeDasharray="3 3" opacity={0.6} />
                    <Line type="monotone" dataKey="current"    stroke="#f87171" strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
                    <Line type="monotone" dataKey="optimised"  stroke="#34d399" strokeWidth={2} dot={false} activeDot={{ r: 3 }}
                      strokeDasharray={selected.size > 0 ? undefined : "4 2"} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Threshold status — always visible regardless of Y-axis range */}
              <div className="space-y-1.5 pt-1">
                <ThresholdChip
                  label="GRI 305-2"
                  sublabel="Scope 2 disclosure"
                  threshold={1000}
                  current={lastPt.current}
                  optimised={lastPt.optimised}
                  infPerDay={combinedInfDay}
                  trainBaseline={combinedTrain * (retrainingFreq > 1 ? retrainingFreq : 1)}
                  color="amber"
                  tooltip="GRI 305-2 requires Scope 2 (electricity) disclosure when cumulative annual AI workload carbon exceeds ~1t CO₂e (1,000 kg). Both location-based and market-based methods must be reported."
                />
                <ThresholdChip
                  label="CSRD ESRS E1"
                  sublabel="Climate disclosure"
                  threshold={10000}
                  current={lastPt.current}
                  optimised={lastPt.optimised}
                  infPerDay={combinedInfDay}
                  trainBaseline={combinedTrain * (retrainingFreq > 1 ? retrainingFreq : 1)}
                  color="rose"
                  tooltip="CSRD ESRS E1 advisory: at 10t CO₂e/yr (10,000 kg), this AI workload becomes a material Scope 2 line item in a CSRD climate statement. Mandatory for large EU companies regardless of this threshold — this line shows when AI workloads become a primary disclosure item rather than a footnote."
                />
                {selected.size === 0 && (
                  <p className="text-[10px] text-muted-foreground/40 italic pt-0.5">
                    Tick recommendations on the left to see the optimised trajectory
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Full-width below the grid */}
          <CreditsInfo />
          <ScalabilityNote />
        </div>
      )}
    </div>
  );
}

// ── Fleet Timeline ────────────────────────────────────────────────────────────
// Shows cumulative carbon per model over the full deployment window.
// Training carbon = one-time spike at deploy start.
// Inference carbon = running meter, ticks up every day until retirement.
const FLEET_COLORS = ["#8b5cf6", "#10b981"] as const;

// Utility: ISO date string for today / N days from today
function isoDate(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function FleetTimeline({
  modelA, modelB, resultA, resultB,
}: {
  modelA: ModelConfig; modelB: ModelConfig;
  resultA: FootprintResult; resultB: FootprintResult;
}) {
  const [open, setOpen]       = useState(false);
  const [startA, setStartA]   = useState(isoDate(0));
  const [endA,   setEndA]     = useState(isoDate(365));
  const [startB, setStartB]   = useState(isoDate(0));
  const [endB,   setEndB]     = useState(isoDate(365));

  // Origin = earliest deploy date across both models
  const originDate = useMemo(() => {
    const a = new Date(startA).getTime();
    const b = new Date(startB).getTime();
    return new Date(Math.min(a, b));
  }, [startA, startB]);

  // Total timeline span in days (from origin to latest retirement)
  const totalDays = useMemo(() => {
    const latest = Math.max(
      new Date(endA).getTime(),
      new Date(endB).getTime(),
    );
    return Math.max(7, Math.round((latest - originDate.getTime()) / 86400000));
  }, [originDate, endA, endB]);

  // Build FleetSlot for each model (startDay/endDay relative to origin)
  const slots = useMemo((): FleetSlot[] => {
    const dayFrom = (iso: string) =>
      Math.max(0, Math.round((new Date(iso).getTime() - originDate.getTime()) / 86400000));
    return [
      { name: modelA.name, result: resultA, startDay: dayFrom(startA), endDay: dayFrom(endA) },
      { name: modelB.name, result: resultB, startDay: dayFrom(startB), endDay: dayFrom(endB) },
    ];
  }, [modelA.name, modelB.name, resultA, resultB, startA, endA, startB, endB, originDate]);

  // Calculate weekly timeline data for Recharts
  const data = useMemo(
    () => buildFleetTimeline(slots, totalDays, originDate),
    [slots, totalDays, originDate],
  );

  // Detect crossover points — where the two lines swap which is higher
  const crossovers = useMemo(() => {
    const out: string[] = [];
    for (let i = 1; i < data.length; i++) {
      const prevDiff = (data[i - 1][modelA.name] as number) - (data[i - 1][modelB.name] as number);
      const currDiff = (data[i][modelA.name]     as number) - (data[i][modelB.name]     as number);
      // Sign change = lines crossed
      if (prevDiff !== 0 && Math.sign(prevDiff) !== Math.sign(currDiff)) {
        out.push(data[i].label as string);
      }
    }
    return out;
  }, [data, modelA.name, modelB.name]);

  // Final cumulative carbon at the last data point
  const last = data[data.length - 1] ?? {};
  const finalA = (last[modelA.name] as number) ?? 0;
  const finalB = (last[modelB.name] as number) ?? 0;

  const dateInputClass =
    "w-full text-xs bg-muted/30 border border-border/40 rounded px-2 py-1.5 focus:outline-none focus:border-violet-500/60";

  return (
    <div className="rounded-xl border border-border/40">
      {/* Collapsible header */}
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-left"
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Fleet Timeline
          </span>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            — cumulative carbon over deployment lifetime
          </span>
        </div>
        <span className="text-xs text-muted-foreground">{open ? "▾" : "▸"}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4">
          {/* Plain-English explainer */}
          <p className="text-xs text-muted-foreground leading-relaxed">
            Training carbon is paid once, on deploy day. Inference carbon accumulates every day
            the model is live. Set deployment windows to see the total carbon commitment of each
            model over its actual lifetime — useful for ESG annual reporting and fleet rotation decisions.
          </p>

          {/* Date pickers per model */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: modelA.name, color: FLEET_COLORS[0], start: startA, end: endA, setStart: setStartA, setEnd: setEndA },
              { label: modelB.name, color: FLEET_COLORS[1], start: startB, end: endB, setStart: setStartB, setEnd: setEndB },
            ].map(m => (
              <div key={m.label} className="rounded-lg border border-border/30 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  {/* Colour swatch matching chart line */}
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: m.color }} />
                  <span className="text-xs font-semibold">{m.label}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-0.5">Deploy start</label>
                    <input type="date" value={m.start} onChange={e => m.setStart(e.target.value)} className={dateInputClass} />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-0.5">Retire date</label>
                    <input type="date" value={m.end} onChange={e => m.setEnd(e.target.value)} className={dateInputClass} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Line chart — cumulative carbon over time */}
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  // Show every 4th tick to avoid crowding (~monthly labels)
                  interval={3}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  tickFormatter={v => `${v}kg`}
                  width={58}
                />
                <Tooltip
                  contentStyle={{
                    background: "#0f172a", border: "1px solid #1e293b",
                    borderRadius: 8, fontSize: 11,
                  }}
                  labelStyle={{ color: "#94a3b8", marginBottom: 4 }}
                  formatter={(val: number, name: string) => [`${fmt1(val)} kgCO₂e`, name]}
                />
                {/* Dashed vertical line at each crossover point */}
                {crossovers.map(label => (
                  <ReferenceLine
                    key={label} x={label}
                    stroke="#f59e0b" strokeDasharray="4 2"
                    label={{ value: "↕ swap", position: "insideTopRight", fill: "#f59e0b", fontSize: 9 }}
                  />
                ))}
                <Line
                  type="monotone" dataKey={modelA.name}
                  stroke={FLEET_COLORS[0]} strokeWidth={2} dot={false} activeDot={{ r: 3 }}
                />
                <Line
                  type="monotone" dataKey={modelB.name}
                  stroke={FLEET_COLORS[1]} strokeWidth={2} dot={false} activeDot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Summary cards — total carbon at retirement */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: modelA.name, total: finalA, color: FLEET_COLORS[0] },
              { label: modelB.name, total: finalB, color: FLEET_COLORS[1] },
            ].map(m => (
              <div key={m.label} className="rounded-lg border border-border/30 bg-muted/10 p-3 text-xs">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: m.color }} />
                  <span className="font-semibold">{m.label}</span>
                </div>
                <div className="font-mono text-base font-bold">{fmt1(m.total)} kgCO₂e</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">total at retirement</div>
              </div>
            ))}
          </div>

          {/* Crossover insight */}
          {crossovers.length > 0 && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-400 leading-relaxed">
              ↕ Carbon leadership swaps at <span className="font-semibold">{crossovers.join(", ")}</span>.{" "}
              Retiring the higher-carbon model at this point minimises total fleet carbon.
            </div>
          )}

          {/* No-crossover insight */}
          {crossovers.length === 0 && data.length > 1 && (
            <div className="text-[10px] text-muted-foreground">
              {finalA < finalB
                ? `${modelA.name} has lower total carbon across this window — no crossover.`
                : finalB < finalA
                ? `${modelB.name} has lower total carbon across this window — no crossover.`
                : "Both models have equal total carbon across this window."}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Report Narrative ───────────────────────────────────────────────────────────
// Always-visible split panel below results.
// Left = Technical (model specs + numbers + crossover analysis) — for the engineer.
// Right = Regulatory (which obligations are triggered, with clauses) — for the ESG analyst.
// Each panel has a copy-to-clipboard button for plain-text export.
function ReportNarrative({
  modelA, modelB, resultA, resultB, flagsA, flagsB,
}: {
  modelA: ModelConfig; modelB: ModelConfig;
  resultA: FootprintResult; resultB: FootprintResult;
  flagsA: ReturnType<typeof getRegFlags>; flagsB: ReturnType<typeof getRegFlags>;
}) {
  const [copied, setCopied] = useState<"tech" | "reg" | null>(null);
  // Track which framework's clause detail is expanded
  const [expandedClause, setExpandedClause] = useState<string | null>(null);

  // Resolve GPU TDP for display (Custom uses customTdpWatts, others look up from presets)
  const tdp = (cfg: ModelConfig) =>
    cfg.gpuType === "Custom" ? cfg.customTdpWatts : (GPU_PRESETS[cfg.gpuType] ?? cfg.customTdpWatts);

  // Training days = trainingHours / 24, rounded to 1 decimal
  const trainingDays = (cfg: ModelConfig) => (cfg.trainingHours / 24).toFixed(1);

  // Plain-English crossover regime interpretation
  const crossoverSentence = (cfg: ModelConfig, result: FootprintResult): string => {
    const days = result.crossoverDays;
    if (!isFinite(days)) return "No inference configured — training carbon is the entire cost.";
    if (days < 30)
      return `${fmtInt(days)} days — at ${cfg.requestsPerDay.toLocaleString()} req/day, inference overtakes training almost immediately. Optimise inference: model size, region, or quantisation.`;
    if (days < 365)
      return `${fmtInt(days)} days — inference overtakes training within the year. Tracking inference carbon now avoids a disclosure surprise.`;
    return `${fmtInt(days)} days — training cost dominates for over a year at this scale. GPU choice, region, and number of training runs have the biggest impact.`;
  };

  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  // ── Clipboard text ────────────────────────────────────────────────────────────
  const techText = [
    `AI Carbon Footprint Report — ${today}`,
    "",
    "MODEL CONFIGURATION",
    `  ${modelA.name}: ${modelA.numGpus}× ${modelA.gpuType} (${tdp(modelA)}W)  |  Training: ${modelA.trainingHours}h (${trainingDays(modelA)} days)  |  Inference: ${modelA.requestsPerDay.toLocaleString()} req/day · ${modelA.latencySeconds}s latency`,
    `  ${modelB.name}: ${modelB.numGpus}× ${modelB.gpuType} (${tdp(modelB)}W)  |  Training: ${modelB.trainingHours}h (${trainingDays(modelB)} days)  |  Inference: ${modelB.requestsPerDay.toLocaleString()} req/day · ${modelB.latencySeconds}s latency`,
    "",
    "TRAINING (one-time cost)",
    `  ${modelA.name}: ${fmt1(resultA.trainCarbonKg)} kgCO₂e  |  ${fmt1(resultA.trainTotalEnergyKwh)} kWh  |  ${fmt1(resultA.trainWaterLitres)} L water`,
    `  ${modelB.name}: ${fmt1(resultB.trainCarbonKg)} kgCO₂e  |  ${fmt1(resultB.trainTotalEnergyKwh)} kWh  |  ${fmt1(resultB.trainWaterLitres)} L water`,
    "",
    "INFERENCE (annual running cost)",
    `  ${modelA.name}: ${fmt1(resultA.infCarbonKgYear)} kgCO₂e/yr  |  ${fmt1(resultA.infEnergyKwhYear)} kWh/yr`,
    `  ${modelB.name}: ${fmt1(resultB.infCarbonKgYear)} kgCO₂e/yr  |  ${fmt1(resultB.infEnergyKwhYear)} kWh/yr`,
    "",
    "CROSSOVER ANALYSIS",
    `  ${modelA.name}: ${crossoverSentence(modelA, resultA)}`,
    `  ${modelB.name}: ${crossoverSentence(modelB, resultB)}`,
    "",
    "WATER",
    "  Water footprint is a facility choice, not a model choice.",
    "  Switching from on-premise to hyperscaler cuts water 4.6× with zero model changes.",
    "  Relevant disclosure: CSRD ESRS E3-4 (water withdrawal/consumption at data centres).",
    "",
    "Generated by preetibuilds.com/carbon-depth · Accuracy ±15%",
  ].join("\n");

  const regText = [
    `Regulatory Flags — ${today}`,
    "",
    "EU GPAI ACT ART. 53",
    "Threshold: training energy >100 MWh (proxy for >10²⁵ FLOP compute threshold in Art. 51).",
    "Why 'proxy': the law sets a FLOP threshold, not an energy threshold. FLOPs are not directly",
    "measurable from GPU hours, so we use energy as an approximation. This is directional only —",
    "not a legal determination. Consult legal counsel if training energy is near 100 MWh.",
    `  ${modelA.name}: ${flagsA.euGpai.flag.toUpperCase()} — ${flagsA.euGpai.detail}`,
    `  ${modelB.name}: ${flagsB.euGpai.flag.toUpperCase()} — ${flagsB.euGpai.detail}`,
    "",
    "CSRD / ESRS E1 — DOUBLE MATERIALITY",
    "Threshold: annual energy >10 MWh (10,000 kWh) is considered material for Scope 2 disclosure.",
    "CSRD requires assessment from BOTH directions:",
    "  Impact materiality (inside-out) — harm your AI workloads cause:",
    "    · ESRS E1-5: Energy consumption and mix (what % is renewable?)",
    "    · ESRS E1-6: Scope 1, 2 and 3 GHG emissions (AI electricity = Scope 2)",
    "    · ESRS E3-4: Water consumption at data centres",
    "  Financial materiality (outside-in) — how climate affects your business:",
    "    · ESRS E1-9: Financial effects of material climate-related risks on infrastructure costs",
    "    · ESRS 2 IRO-1: Process for identifying material Impacts, Risks and Opportunities",
    `  ${modelA.name}: ${flagsA.csrd.flag.toUpperCase()} — ${flagsA.csrd.detail}`,
    `  ${modelB.name}: ${flagsB.csrd.flag.toUpperCase()} — ${flagsB.csrd.detail}`,
    "",
    "GRI 305",
    "Threshold: >1t CO₂e (1,000 kg of greenhouse gases expressed as CO₂ equivalent).",
    "CO₂e explained: CO₂, methane (CH₄), nitrous oxide (N₂O) and other GHGs have different",
    "warming impacts. Each is converted to its CO₂-equivalent weight using IPCC Global Warming",
    "Potentials. For AI workloads (Scope 2 = electricity), almost all emissions are CO₂ directly.",
    "Applies as GRI 305-2 (Scope 2) — both location-based and market-based methods.",
    `  ${modelA.name}: ${flagsA.gri305.flag.toUpperCase()} — ${flagsA.gri305.detail}`,
    `  ${modelB.name}: ${flagsB.gri305.flag.toUpperCase()} — ${flagsB.gri305.detail}`,
    "",
    "Accuracy: energy ±15% vs published benchmarks. Carbon error depends on grid intensity source.",
    "Generated by preetibuilds.com/carbon-depth",
  ].join("\n");

  const copy = (text: string, which: "tech" | "reg") => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(which);
      setTimeout(() => setCopied(null), 2000);
    }).catch(() => {});
  };

  // ── Shared sub-components ────────────────────────────────────────────────────

  // Single model flag row — coloured dot + badge + detail
  const FlagRow = ({
    modelName, flagResult,
  }: {
    modelName: string;
    flagResult: { flag: RegFlag; label: string; detail: string };
  }) => {
    const dotColor  = flagResult.flag === "breach" ? "bg-red-400" : flagResult.flag === "warning" ? "bg-amber-400" : "bg-emerald-500";
    const badgeClass = flagResult.flag === "breach" ? "bg-red-500/15 text-red-400" : flagResult.flag === "warning" ? "bg-amber-500/15 text-amber-400" : "bg-emerald-500/15 text-emerald-400";
    const badgeLabel = flagResult.flag === "breach" ? "Disclose" : flagResult.flag === "warning" ? "Monitor" : "Compliant";
    return (
      <div className="flex items-start gap-2 text-xs">
        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${dotColor}`} />
        <div className="min-w-0">
          <span className="font-medium">{modelName}</span>
          <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded font-semibold ${badgeClass}`}>{badgeLabel}</span>
          <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5">{flagResult.detail}</p>
        </div>
      </div>
    );
  };

  // Framework section with threshold pill + expandable clause detail
  const FrameworkSection = ({
    id, title, threshold, clauseDetail, children,
  }: {
    id: string; title: string; threshold: string;
    clauseDetail: React.ReactNode; children: React.ReactNode;
  }) => (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{title}</span>
        {/* Threshold pill — always visible */}
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-muted/30 text-muted-foreground border border-border/30">
          {threshold}
        </span>
        {/* Expandable clause toggle */}
        <button
          className="text-[9px] text-muted-foreground/50 hover:text-muted-foreground transition-colors ml-auto"
          onClick={() => setExpandedClause(v => v === id ? null : id)}
        >
          {expandedClause === id ? "▾ clauses" : "▸ clauses"}
        </button>
      </div>
      {/* Clause detail — collapsible */}
      {expandedClause === id && (
        <div className="rounded-lg bg-muted/10 border border-border/20 px-3 py-2 text-[10px] text-muted-foreground leading-relaxed space-y-1">
          {clauseDetail}
        </div>
      )}
      {children}
    </div>
  );

  const copyBtnClass = "text-[10px] px-2 py-0.5 rounded border border-border/40 text-muted-foreground hover:text-foreground transition-colors";

  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-xl border border-border/40">
      <button
        className="w-full px-4 pt-3 pb-3 flex items-center justify-between hover:bg-muted/10 transition-colors text-left"
        onClick={() => setOpen(v => !v)}
      >
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Report Narrative</span>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-muted-foreground hidden sm:inline">Updates live with your inputs</span>
          <span className="text-muted-foreground text-xs">{open ? "▾" : "▸"}</span>
        </div>
      </button>

      {open && <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* ── Left: Technical panel ── */}
        <div className="rounded-lg border border-border/30 bg-muted/5 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">Technical</span>
            <button onClick={() => copy(techText, "tech")} className={copyBtnClass}>
              {copied === "tech" ? "✓ Copied" : "Copy"}
            </button>
          </div>

          <div className="space-y-2.5 text-xs">

            {/* Model configuration — new section */}
            <div>
              <div className="font-semibold text-foreground/70 mb-1.5">Model configuration</div>
              {[
                { cfg: modelA },
                { cfg: modelB },
              ].map(({ cfg }) => (
                <div key={cfg.name} className="rounded-lg bg-muted/20 border border-border/20 px-2.5 py-2 mb-1.5 text-[10px]">
                  <div className="font-semibold text-foreground/80 mb-1">{cfg.name}</div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-muted-foreground">
                    <span><span className="text-foreground/50">GPU</span> {cfg.numGpus}× {cfg.gpuType} ({tdp(cfg)}W each)</span>
                    <span><span className="text-foreground/50">Training</span> {cfg.trainingHours}h = {trainingDays(cfg)} days</span>
                    <span><span className="text-foreground/50">Requests</span> {cfg.requestsPerDay.toLocaleString()}/day</span>
                    <span><span className="text-foreground/50">Latency</span> {cfg.latencySeconds}s / request</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Training */}
            <div>
              <div className="font-semibold text-foreground/70 mb-1">Training — one-time</div>
              {[{ cfg: modelA, r: resultA }, { cfg: modelB, r: resultB }].map(({ cfg, r }) => (
                <div key={cfg.name} className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 mb-0.5">
                  <span className="text-muted-foreground text-[11px] w-20 flex-shrink-0">{cfg.name}</span>
                  <span className="font-mono font-bold">{fmt1(r.trainCarbonKg)} kgCO₂e</span>
                  <span className="text-[10px] text-muted-foreground">{fmt1(r.trainTotalEnergyKwh)} kWh · {fmt1(r.trainWaterLitres)} L</span>
                </div>
              ))}
            </div>

            {/* Inference */}
            <div>
              <div className="font-semibold text-foreground/70 mb-1">Inference — annual</div>
              {[{ cfg: modelA, r: resultA }, { cfg: modelB, r: resultB }].map(({ cfg, r }) => (
                <div key={cfg.name} className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 mb-0.5">
                  <span className="text-muted-foreground text-[11px] w-20 flex-shrink-0">{cfg.name}</span>
                  <span className="font-mono font-bold">{fmt1(r.infCarbonKgYear)} kgCO₂e/yr</span>
                  <span className="text-[10px] text-muted-foreground">{fmt1(r.infEnergyKwhYear)} kWh/yr</span>
                </div>
              ))}
            </div>

            {/* Crossover */}
            <div className="pt-1.5 border-t border-border/20 space-y-1.5">
              <div className="font-semibold text-foreground/70">Crossover analysis</div>
              {[{ cfg: modelA, r: resultA }, { cfg: modelB, r: resultB }].map(({ cfg, r }) => (
                <div key={cfg.name}>
                  <span className="font-medium text-[11px]">{cfg.name} — </span>
                  <span className="text-[10px] text-muted-foreground leading-relaxed">{crossoverSentence(cfg, r)}</span>
                </div>
              ))}
            </div>

            {/* Water note */}
            <div className="pt-1.5 border-t border-border/20 text-[10px] text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground/50">Water:</span>{" "}
              Facility choice, not model choice. Hyperscaler vs on-premise = 4.6× less water, same carbon.
              Disclosure: CSRD ESRS E3-4.
            </div>
          </div>
        </div>

        {/* ── Right: Regulatory panel ── */}
        <div className="rounded-lg border border-border/30 bg-muted/5 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Regulatory</span>
            <button onClick={() => copy(regText, "reg")} className={copyBtnClass}>
              {copied === "reg" ? "✓ Copied" : "Copy"}
            </button>
          </div>

          <div className="space-y-3.5 text-xs">

            {/* EU GPAI */}
            <FrameworkSection
              id="gpai"
              title="EU GPAI Act Art. 53"
              threshold=">100 MWh training (energy proxy)"
              clauseDetail={
                <>
                  <p><span className="text-foreground/60 font-semibold">Why proxy?</span> The law (Art. 51) sets a compute threshold of &gt;10²⁵ FLOPs — not an energy number. FLOPs can't be calculated from GPU hours alone without knowing the model architecture. We use 100 MWh as an energy proxy: that's roughly the scale of training run that hits 10²⁵ FLOPs on modern hardware. Directional only — not a legal determination.</p>
                  <p className="mt-1"><span className="text-foreground/60 font-semibold">Obligation:</span> Disclose training energy consumption, data sources, compute, and water use in technical documentation. Art. 53(1)(d).</p>
                </>
              }
            >
              <FlagRow modelName={modelA.name} flagResult={flagsA.euGpai} />
              <FlagRow modelName={modelB.name} flagResult={flagsB.euGpai} />
            </FrameworkSection>

            {/* CSRD */}
            <FrameworkSection
              id="csrd"
              title="CSRD / ESRS E1 — Double Materiality"
              threshold=">10 MWh annual energy (Scope 2)"
              clauseDetail={
                <>
                  <p><span className="text-foreground/60 font-semibold">Double materiality</span> means assessing from both directions — not just one:</p>
                  <p className="mt-1"><span className="text-foreground/60 font-semibold">Impact side (inside-out)</span> — harm your AI workloads cause:</p>
                  <ul className="ml-2 mt-0.5 space-y-0.5">
                    <li>· ESRS E1-5: Energy consumption and mix (renewable % matters)</li>
                    <li>· ESRS E1-6: Scope 1, 2, 3 GHG emissions — AI electricity = Scope 2</li>
                    <li>· ESRS E3-4: Water consumption at data centres</li>
                  </ul>
                  <p className="mt-1"><span className="text-foreground/60 font-semibold">Financial side (outside-in)</span> — how climate affects your business:</p>
                  <ul className="ml-2 mt-0.5 space-y-0.5">
                    <li>· ESRS E1-9: Financial effects of climate-related risks on infrastructure</li>
                    <li>· ESRS 2 IRO-1: Process for identifying material Impacts, Risks, Opportunities</li>
                  </ul>
                </>
              }
            >
              <FlagRow modelName={modelA.name} flagResult={flagsA.csrd} />
              <FlagRow modelName={modelB.name} flagResult={flagsB.csrd} />
            </FrameworkSection>

            {/* GRI 305 */}
            <FrameworkSection
              id="gri305"
              title="GRI 305"
              threshold=">1t CO₂e (1,000 kg greenhouse gases)"
              clauseDetail={
                <>
                  <p><span className="text-foreground/60 font-semibold">What is CO₂e?</span> Different greenhouse gases have different warming impacts. CO₂, methane (CH₄), and nitrous oxide (N₂O) are each converted to their CO₂-equivalent weight using IPCC Global Warming Potentials (GWP100). For AI workloads — Scope 2 electricity — almost all emissions are CO₂ directly, so CO₂e ≈ CO₂.</p>
                  <p className="mt-1"><span className="text-foreground/60 font-semibold">Applies as:</span> GRI 305-2 (Scope 2 indirect emissions) — both location-based and market-based methods. Market-based allows credit for renewable energy certificates (RECs) and PPAs.</p>
                </>
              }
            >
              <FlagRow modelName={modelA.name} flagResult={flagsA.gri305} />
              <FlagRow modelName={modelB.name} flagResult={flagsB.gri305} />
            </FrameworkSection>
          </div>

          <p className="text-[9px] text-muted-foreground/40 pt-1.5 border-t border-border/20 leading-relaxed">
            Accuracy ±15%. Not legal advice. Consult counsel for formal materiality assessments.
          </p>
        </div>
      </div>}
    </div>
  );
}

// ── Dynamic Regulation Flagging ───────────────────────────────────────────────
type CompanySize =
  | "SME (<250 employees)"
  | "Large EU-listed (<500 employees)"
  | "Large EU (>500 employees)"
  | "GPAI Provider"
  | "Global / non-EU";

type IndustryType =
  | "Finance / Banking"
  | "Healthcare / Life Sciences"
  | "Tech / Software / AI"
  | "Energy / Utilities"
  | "Manufacturing"
  | "Other";

type ObligationStatus = "MANDATORY" | "LIKELY" | "MONITOR" | "EXEMPT";

interface RegObligation {
  id: string;
  framework: string;
  clause: string;
  status: ObligationStatus;
  reason: string;
  action: string;
  owner: string;
  threshold?: string;
}

function buildObligations(
  size: CompanySize,
  industry: IndustryType,
  resultA: FootprintResult,
  resultB: FootprintResult,
): RegObligation[] {
  const obs: RegObligation[] = [];

  const trainEnergyMax = Math.max(resultA.trainTotalEnergyKwh, resultB.trainTotalEnergyKwh);
  const totalCarbonKg  = Math.max(
    resultA.trainCarbonKg + resultA.infCarbonKgYear,
    resultB.trainCarbonKg + resultB.infCarbonKgYear,
  );
  const waterLitresMax = Math.max(
    resultA.trainWaterLitres + resultA.infWaterLitresDay * 365,
    resultB.trainWaterLitres + resultB.infWaterLitresDay * 365,
  );

  const isLargeEU = size === "Large EU (>500 employees)" || size === "Large EU-listed (<500 employees)";
  const isGPAI    = size === "GPAI Provider";
  const isSME     = size === "SME (<250 employees)";
  const isGlobal  = size === "Global / non-EU";

  // ── CSRD / ESRS E1 ────────────────────────────────────────────────────────
  if (size === "Large EU (>500 employees)") {
    obs.push({
      id: "csrd-full",
      framework: "CSRD / ESRS E1",
      clause: "ESRS E1-5 · E1-6 · E1-9 · ESRS 2 IRO-1",
      status: "MANDATORY",
      reason: "Companies with >500 EU employees face full CSRD disclosure obligations from FY 2024. AI training and inference electricity appears as Scope 2 (ESRS E1-6). Data centre water use appears under ESRS E3-4.",
      action: "Disclose Scope 2 emissions (location-based + market-based) in your annual CSRD climate statement. Document GPU model, cloud region, grid intensity source, and annual inference volume for AI workloads specifically.",
      owner: "ESG / Sustainability team",
      threshold: "Full disclosure — no minimum energy threshold. Double materiality assessment required.",
    });
  } else if (size === "Large EU-listed (<500 employees)") {
    obs.push({
      id: "csrd-phase1",
      framework: "CSRD / ESRS E1 (Phase 1)",
      clause: "ESRS E1-5 · E1-6",
      status: "MANDATORY",
      reason: "EU-listed companies (former NFRD entities) face Phase 1 CSRD from FY 2024. AI infrastructure electricity is Scope 2 — it must appear in the climate section of the CSRD report.",
      action: "Begin Scope 2 tracking now using location-based method as a minimum. Implement market-based method (RECs / PPAs) if making net zero claims. Engage your data centre provider for annual energy data.",
      owner: "ESG / Sustainability team",
    });
  } else if (isGPAI) {
    obs.push({
      id: "csrd-gpai",
      framework: "CSRD / ESRS E1",
      clause: "ESRS E1-5 · E1-6",
      status: "LIKELY",
      reason: "GPAI providers are often large tech companies that also fall within CSRD scope. If you have >500 employees or are EU-listed, full CSRD applies in addition to GPAI Act obligations.",
      action: "Confirm whether CSRD size thresholds are met alongside GPAI Act obligations. If yes, treat AI training energy as a primary Scope 2 line item in the CSRD report.",
      owner: "Legal / ESG team",
    });
  } else if (isGlobal) {
    obs.push({
      id: "csrd-global",
      framework: "CSRD / ESRS E1",
      clause: "ESRS E1-5 · E1-6 (Art. 2 scope extension)",
      status: "MONITOR",
      reason: "CSRD scope expands from FY 2028 to non-EU companies with >€150M EU revenue and at least one EU subsidiary or branch. If your company meets these criteria, CSRD applies from FY 2028 reports.",
      action: "Monitor CSRD Art. 2 scope expansion timeline. Begin voluntary GRI 305 disclosure now — the methodology is identical and creates the data infrastructure needed for mandatory CSRD later.",
      owner: "Legal / Compliance team",
    });
  } else if (isSME) {
    obs.push({
      id: "csrd-sme",
      framework: "CSRD / ESRS E1",
      clause: "ESRS VSME (voluntary SME standard)",
      status: "EXEMPT",
      reason: "SMEs (<250 employees) are currently exempt from mandatory CSRD disclosure. The ESRS VSME standard provides a lighter voluntary framework if ESG credentials are commercially valuable.",
      action: "No mandatory action required. Consider ESRS VSME voluntary disclosure if needed for procurement qualification, investor requirements, or supply chain due diligence from large CSRD-obligated customers.",
      owner: "Finance / Management",
    });
  } else {
    obs.push({
      id: "csrd-other",
      framework: "CSRD / ESRS E1",
      clause: "ESRS E1-5 · E1-6",
      status: "MONITOR",
      reason: "Your company profile does not immediately trigger CSRD. Monitor for any EU nexus (subsidiaries, revenue) that could bring you within scope.",
      action: "Confirm EU presence and revenue thresholds with legal counsel. Begin voluntary GRI 305 baseline now to reduce compliance cost if CSRD scope expands.",
      owner: "Legal / Compliance team",
    });
  }

  // ── EU AI Act — GPAI Art. 51/53 ───────────────────────────────────────────
  if (isGPAI) {
    obs.push({
      id: "gpai-53",
      framework: "EU AI Act — GPAI",
      clause: "Art. 51 (threshold) · Art. 53 (obligations)",
      status: "MANDATORY",
      reason: `You are a GPAI provider. Art. 53 requires mandatory disclosure of training energy consumption. The compliance threshold is 10²⁵ FLOPs (proxy: 100 MWh training energy). Your largest model's estimated training energy: ${fmt1(trainEnergyMax)} kWh.`,
      action: "Register your model with the EU AI Office. Disclose: (1) total training energy in kWh, (2) grid carbon intensity of training region (gCO₂/kWh), (3) estimated Scope 2 CO₂e. Obligations apply from August 2025.",
      owner: "AI/ML team + Legal",
      threshold: `Your training energy: ${fmt1(trainEnergyMax)} kWh · GPAI threshold: 100,000 kWh proxy${trainEnergyMax > 100000 ? " — EXCEEDS threshold" : " — below threshold (still applies as GPAI Provider)"}`,
    });
  } else if (industry === "Tech / Software / AI") {
    const gpaiStatus: ObligationStatus = trainEnergyMax > 100000 ? "LIKELY" : "MONITOR";
    obs.push({
      id: "gpai-tech",
      framework: "EU AI Act — GPAI",
      clause: "Art. 51 / Art. 3(63)",
      status: gpaiStatus,
      reason: trainEnergyMax > 100000
        ? `Your model's estimated training energy (${fmt1(trainEnergyMax)} kWh) exceeds the GPAI 100 MWh proxy threshold. If you offer this model as a general-purpose service to third parties, you are likely a 'GPAI provider' under Art. 3(63) and Art. 53 obligations apply.`
        : `Your current training energy (${fmt1(trainEnergyMax)} kWh) is below the GPAI 100 MWh proxy. If you scale training or serve the model externally, re-assess. GPAI definition under Art. 3(63) depends on use — not just energy.`,
      action: "Determine whether your model meets the 'GPAI' definition: trained on broad data, general-purpose outputs, usable for many tasks, offered to third parties. If yes, register with EU AI Office before August 2025.",
      owner: "Legal / AI governance team",
      threshold: `Training energy: ${fmt1(trainEnergyMax)} kWh · GPAI proxy threshold: 100,000 kWh`,
    });
  }

  // ── EU AI Act — High-risk (Healthcare) ────────────────────────────────────
  if (industry === "Healthcare / Life Sciences") {
    obs.push({
      id: "euai-highrisk",
      framework: "EU AI Act — High-risk",
      clause: "Art. 10 · Art. 14 · Art. 17 · Annex III(5)",
      status: "LIKELY",
      reason: "Healthcare AI systems are classified as high-risk under EU AI Act Annex III point 5 (medical devices, diagnosis, clinical decision support, triage). If your model is used in any of these contexts, high-risk obligations apply regardless of company size.",
      action: "Conduct a conformity assessment. Register in EU AI database. Document training data governance (Art. 10). Establish human oversight procedures (Art. 14). Perform a fundamental rights impact assessment. Implement a risk management system (Art. 9).",
      owner: "AI governance / Clinical informatics / Legal",
    });
  }

  // ── ISSB S2 / TCFD (Finance) ──────────────────────────────────────────────
  if (industry === "Finance / Banking") {
    obs.push({
      id: "issb-s2",
      framework: "ISSB S2 / TCFD",
      clause: "IFRS S2 para. 6 · 10 · 29",
      status: isLargeEU || isGlobal ? "LIKELY" : "MONITOR",
      reason: "Financial institutions face climate-related financial disclosure under ISSB S2 (IFRS S2). AI infrastructure is a transition risk: rising carbon prices and energy costs on compute-intensive workloads are a quantifiable financial exposure that must be disclosed in climate scenario analysis.",
      action: "Include AI data centre energy costs in IFRS S2 Scope 2 disclosure. Quantify carbon price sensitivity (e.g. what does a €50/t CO₂ carbon price do to your AI infrastructure costs?). Disclose in the climate-related risk section of your annual report.",
      owner: "Risk management / CFO office / Investor relations",
      threshold: "No energy floor — materiality-based. AI compute is material if it represents >1% of total opex or is a significant and growing cost line.",
    });
  }

  // ── GRI 305 ───────────────────────────────────────────────────────────────
  obs.push({
    id: "gri305",
    framework: "GRI 305",
    clause: "GRI 305-2 (Scope 2 indirect emissions)",
    status: totalCarbonKg > 1000 ? "LIKELY" : "MONITOR",
    reason: totalCarbonKg > 1000
      ? `Your combined AI workload carbon (training + 1yr inference: ${fmt1(totalCarbonKg)} kgCO₂e = ${(totalCarbonKg / 1000).toFixed(2)}t CO₂e) exceeds the 1t CO₂e GRI 305 reporting threshold. GRI 305-2 Scope 2 disclosure applies if you publish a GRI-aligned sustainability report.`
      : `Current workload carbon (${fmt1(totalCarbonKg)} kgCO₂e) is below the 1t CO₂e GRI 305 threshold. Still best practice to track for future reporting as inference volume grows.`,
    action: "Disclose Scope 2 emissions using both location-based (grid intensity × kWh) and market-based methods (subtract any RECs/PPAs). Document the methodology and intensity source. GRI 305-2 is the most widely cited standard for AI carbon disclosure.",
    owner: "ESG / Sustainability team",
    threshold: `Current: ${(totalCarbonKg / 1000).toFixed(3)}t CO₂e · GRI 305 threshold: 1t CO₂e`,
  });

  // ── ESRS E3 — Water ───────────────────────────────────────────────────────
  if (isLargeEU || isGPAI) {
    obs.push({
      id: "csrd-e3",
      framework: "CSRD / ESRS E3",
      clause: "ESRS E3-4 (Water consumption)",
      status: "MONITOR",
      reason: `ESRS E3 covers water and marine resources. AI data centres are significant water consumers. Estimated annual AI water use: ${fmt1(waterLitresMax)}L. Enhanced obligations apply if your facility is in a water-stressed region (ESRS E3-4).`,
      action: "Check whether your cloud regions are water-stressed (EU JRC Water Exploitation Index or WWF Water Risk Filter). If yes, disclose water withdrawal (m³) and consumption in CSRD ESRS E3. Hyperscaler contracts sometimes include WUE data in annual sustainability reports.",
      owner: "Infrastructure / ESG team",
      threshold: `Estimated AI water use: ${fmt1(waterLitresMax)}L / year · ESRS E3-4 triggered if facility is in water-stressed area`,
    });
  }

  return obs;
}

const STATUS_STYLE: Record<ObligationStatus, { pill: string; border: string; bg: string }> = {
  MANDATORY: { pill: "bg-rose-500/20 text-rose-400 border-rose-500/30",   border: "border-rose-500/20",  bg: "bg-rose-500/5"   },
  LIKELY:    { pill: "bg-amber-500/20 text-amber-400 border-amber-500/30", border: "border-amber-500/20", bg: "bg-amber-500/5"  },
  MONITOR:   { pill: "bg-blue-500/20 text-blue-400 border-blue-500/30",    border: "border-blue-500/20",  bg: "bg-blue-500/5"   },
  EXEMPT:    { pill: "bg-muted/40 text-muted-foreground border-border/30", border: "border-border/20",    bg: "bg-muted/5"      },
};

const STATUS_LABEL: Record<ObligationStatus, string> = {
  MANDATORY: "Mandatory",
  LIKELY:    "Likely applies",
  MONITOR:   "Monitor",
  EXEMPT:    "Likely exempt",
};

function DynamicRegFlags({
  resultA, resultB,
}: {
  resultA: FootprintResult;
  resultB: FootprintResult;
}) {
  const [open, setOpen]         = useState(true);
  const [size, setSize]         = useState<CompanySize>("Large EU (>500 employees)");
  const [industry, setIndustry] = useState<IndustryType>("Tech / Software / AI");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const obligations = useMemo(
    () => buildObligations(size, industry, resultA, resultB),
    [size, industry, resultA, resultB],
  );

  const toggle = (id: string) =>
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const order: ObligationStatus[] = ["MANDATORY", "LIKELY", "MONITOR", "EXEMPT"];
  const grouped = order
    .map(status => ({ status, items: obligations.filter(o => o.status === status) }))
    .filter(g => g.items.length > 0);

  const mandatoryCount = obligations.filter(o => o.status === "MANDATORY").length;
  const likelyCount    = obligations.filter(o => o.status === "LIKELY").length;

  return (
    <div className="rounded-2xl border border-border/40 bg-card/60 overflow-hidden">
      {/* Header */}
      <button
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/10 transition-colors text-left"
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-foreground">Dynamic Regulation Flagging</span>
          <div className="flex items-center gap-1.5">
            {mandatoryCount > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/20 font-semibold">
                {mandatoryCount} mandatory
              </span>
            )}
            {likelyCount > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20 font-semibold">
                {likelyCount} likely
              </span>
            )}
          </div>
        </div>
        <span className="text-muted-foreground text-xs">{open ? "▾" : "▸"}</span>
      </button>

      {open && (
        <div className="px-5 pb-6 space-y-5">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Tell us about your organisation — we'll map your actual AI workload numbers to specific regulatory obligations and explain exactly why each one applies.
          </p>

          {/* Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Company size / type
              </label>
              <select
                value={size}
                onChange={e => setSize(e.target.value as CompanySize)}
                className="w-full bg-muted/30 border border-border/40 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-violet-500/60 text-foreground"
              >
                <option>SME (&lt;250 employees)</option>
                <option>Large EU-listed (&lt;500 employees)</option>
                <option>Large EU (&gt;500 employees)</option>
                <option>GPAI Provider</option>
                <option>Global / non-EU</option>
              </select>
              <p className="text-[10px] text-muted-foreground mt-1 leading-snug">
                {size === "GPAI Provider" && "A company that trains and offers a general-purpose AI model (e.g. foundation model, LLM) to third parties."}
                {size === "Large EU-listed (<500 employees)" && "Listed on an EU regulated market. Former NFRD entities — Phase 1 CSRD from FY 2024."}
                {size === "Large EU (>500 employees)" && "Any company with >500 employees in the EU regardless of listing status — full CSRD from FY 2024."}
                {size === "Global / non-EU" && "No EU listing but may have EU revenue or subsidiaries. CSRD Art. 2 scope extension from FY 2028."}
                {size === "SME (<250 employees)" && "Under 250 employees and under €50M turnover. Currently exempt from mandatory CSRD."}
              </p>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Industry type
              </label>
              <select
                value={industry}
                onChange={e => setIndustry(e.target.value as IndustryType)}
                className="w-full bg-muted/30 border border-border/40 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-violet-500/60 text-foreground"
              >
                <option>Finance / Banking</option>
                <option>Healthcare / Life Sciences</option>
                <option>Tech / Software / AI</option>
                <option>Energy / Utilities</option>
                <option>Manufacturing</option>
                <option>Other</option>
              </select>
              <p className="text-[10px] text-muted-foreground mt-1 leading-snug">
                {industry === "Finance / Banking" && "Triggers ISSB S2 / TCFD climate financial risk disclosures in addition to CSRD."}
                {industry === "Healthcare / Life Sciences" && "EU AI Act Annex III classifies medical AI as high-risk — conformity assessment required."}
                {industry === "Tech / Software / AI" && "EU GPAI Act Art. 53 applies if you train and offer general-purpose models to third parties."}
                {industry === "Energy / Utilities" && "ESRS E1 mandatory thresholds are lower — energy sector faces stricter Scope 1/2/3 standards."}
                {industry === "Manufacturing" && "GHG Protocol Scope 3 (Category 11: use of sold products) likely applies if AI is embedded in products."}
                {industry === "Other" && "General CSRD obligations apply if size threshold is met. No industry-specific AI regulation triggers."}
              </p>
            </div>
          </div>

          {/* Obligation cards */}
          <div className="space-y-4">
            {grouped.map(({ status, items }) => (
              <div key={status}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${STATUS_STYLE[status].pill}`}>
                    {STATUS_LABEL[status].toUpperCase()}
                  </span>
                  <span className="text-[10px] text-muted-foreground/60">{items.length} obligation{items.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="space-y-2">
                  {items.map(ob => (
                    <div
                      key={ob.id}
                      className={`rounded-xl border ${STATUS_STYLE[status].border} ${STATUS_STYLE[status].bg} overflow-hidden`}
                    >
                      {/* Card header — always visible */}
                      <button
                        className="w-full flex items-start justify-between px-4 py-3 text-left hover:bg-white/[0.02] transition-colors gap-3"
                        onClick={() => toggle(ob.id)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-foreground">{ob.framework}</span>
                            <span className="text-[10px] text-muted-foreground font-mono bg-muted/40 px-1.5 py-0.5 rounded">{ob.clause}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-1 leading-snug line-clamp-2">
                            {ob.reason}
                          </p>
                        </div>
                        <span className="text-[10px] text-muted-foreground flex-shrink-0 mt-0.5">
                          {expanded.has(ob.id) ? "▾" : "▸"}
                        </span>
                      </button>

                      {/* Expanded detail */}
                      {expanded.has(ob.id) && (
                        <div className="px-4 pb-4 space-y-3 border-t border-border/20 pt-3">
                          <div>
                            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Why it applies</div>
                            <p className="text-xs text-foreground/80 leading-relaxed">{ob.reason}</p>
                          </div>
                          {ob.threshold && (
                            <div>
                              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Threshold</div>
                              <p className="text-xs font-mono text-violet-400/80 leading-relaxed">{ob.threshold}</p>
                            </div>
                          )}
                          <div>
                            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Action required</div>
                            <p className="text-xs text-foreground/80 leading-relaxed">{ob.action}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Owner</div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400/80 border border-violet-500/20">
                              {ob.owner}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className="text-[9px] text-muted-foreground/40 pt-1.5 border-t border-border/20 leading-relaxed">
            Not legal advice. Regulatory thresholds and scope are based on published texts as of 2025. Consult legal counsel for formal compliance assessment.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Main page (unlocked) ──────────────────────────────────────────────────────
function CarbonDepthPage() {
  useVisitLogger("/carbon-depth");

  const [modelA, setModelA]         = useState<ModelConfig>(DEFAULT_MODEL_A);
  const [modelB, setModelB]         = useState<ModelConfig>(DEFAULT_MODEL_B);
  const [region, setRegion]         = useState("us-east-1 (Virginia)");
  const [dcType, setDcType]         = useState("hyperscaler");
  const [gridIntensity, setGrid]    = useState(415);
  const [gridSource, setGridSource] = useState("static average (US-MIDA-PJM)");
  const [apiKey, setApiKey]         = useState("");
  const [fetching, setFetching]     = useState(false);
  const [activeTab, setActiveTab]   = useState<"calculator" | "analysis" | "compliance">("calculator");

  // Benchmark comparison state
  const [showBenchmark, setShowBenchmark]       = useState(false);
  const [bmSource, setBmSource]                 = useState<BenchmarkSource>("MLPerf Power");
  const [bmTaskClass, setBmTaskClass]           = useState<BenchmarkTaskClass>("Text gen — small (≤7B)");
  const benchmarkRef = useMemo(
    () => showBenchmark ? getBenchmarkRef(bmSource, bmTaskClass) : null,
    [showBenchmark, bmSource, bmTaskClass],
  );
  const bmSources    = [...new Set(BENCHMARK_REFS.map(b => b.source))] as BenchmarkSource[];
  const bmTaskClasses = [...new Set(BENCHMARK_REFS.map(b => b.taskClass))] as BenchmarkTaskClass[];

  const BM_SOURCE_TIPS: Record<BenchmarkSource, string> = {
    "MLPerf Power":     "Industry standard — measures actual watts per query on real hardware. Published by MLCommons (the same group that benchmarks AI speed). Best for inference comparisons. No training data.",
    "AIEnergyScore":    "Academic benchmark (Lannelongue 2023). Measures full task energy including memory and system overhead — more conservative than MLPerf. Good for real-world NLP workloads.",
    "Research median":  "Derived from landmark papers: Strubell 2019 (BERT), Patterson 2021 (Google), BLOOM 2022 (176B). The only source with training energy estimates. Rougher estimates — ±30%.",
  };
  const BM_TASKCLASS_TIPS: Record<BenchmarkTaskClass, string> = {
    "Text gen — small (≤7B)":   "Models like Llama-2-7B or Mistral-7B. Runs on a single GPU. Lowest carbon per request — roughly 0.08g CO₂ per query at US grid intensity.",
    "Text gen — medium (8–30B)": "Models like Llama-2-13B or Mistral-22B. Needs a large single GPU or 2 GPUs. ~4× more energy per request than a 7B model.",
    "Text gen — large (31B+)":   "Models like Llama-2-70B or GPT-4 class. Requires multiple GPUs. Highest carbon — roughly 20× more per request than a 7B model.",
  };

  const pue = PUE_BY_TYPE[dcType] ?? 1.1;
  const wue = WUE_BY_TYPE[dcType] ?? 0.35;

  const resultA = useMemo(() => calculateFootprint(modelA, pue, wue, gridIntensity), [modelA, pue, wue, gridIntensity]);
  const resultB = useMemo(() => calculateFootprint(modelB, pue, wue, gridIntensity), [modelB, pue, wue, gridIntensity]);
  const flagsA  = useMemo(() => getRegFlags(resultA), [resultA]);
  const flagsB  = useMemo(() => getRegFlags(resultB), [resultB]);

  const handleFetchGrid = useCallback(async () => {
    if (!apiKey) {
      const zone = getEffectiveRegionZones()[region];
      const fb   = getEffectiveStaticIntensity()[zone] ?? 450;
      setGrid(fb); setGridSource(`static average (${zone})`);
      return;
    }
    setFetching(true);
    const { intensity, source } = await fetchGridIntensity(region, apiKey);
    setGrid(intensity); setGridSource(source);
    setFetching(false);
  }, [region, apiKey]);

  const handleRegionChange = (r: string) => {
    setRegion(r);
    const zone = getEffectiveRegionZones()[r];
    setGrid(getEffectiveStaticIntensity()[zone] ?? 450);
    setGridSource(`static average (${zone})`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sticky nav */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border/40">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link to="/#projects" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            ← Back to Portfolio
          </Link>
          <span className="text-xs text-muted-foreground font-mono hidden sm:block">
            Energy ±15% · validated vs Strubell 2019 · Patterson 2021 · BLOOM 2022
          </span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-violet-500 bg-violet-500/10 px-2 py-0.5 rounded">Sustainable AI</span>
            <span className="text-xs font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">Phase 1</span>
          </div>
          <h1 className="text-2xl font-bold">AI Carbon Footprint Calculator</h1>
          <p className="text-sm text-muted-foreground">
            Compare two AI model configurations across energy, carbon, water, and cost — with live grid intensity and regulatory threshold flags.
          </p>
        </div>

        <WhyItMatters />

        {/* Shared settings row */}
        <div className="rounded-xl border border-border/40 p-4 mb-6">
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Shared Settings — apply to both models</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Cloud region</label>
              <select
                className="w-full bg-muted/30 border border-border/40 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-violet-500/60"
                value={region}
                onChange={e => handleRegionChange(e.target.value)}
              >
                {Object.keys(getEffectiveRegionZones()).map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">
                Data centre — PUE {pue} · WUE {wue} L/kWh
              </label>
              <select
                className="w-full bg-muted/30 border border-border/40 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-violet-500/60"
                value={dcType}
                onChange={e => setDcType(e.target.value)}
              >
                {Object.entries(PUE_BY_TYPE).map(([k, v]) => (
                  <option key={k} value={k}>{k} (PUE {v} · WUE {WUE_BY_TYPE[k]})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">
                Grid intensity — <span className="text-violet-400 font-mono">{gridIntensity} gCO₂/kWh</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="Electricity Maps key (optional)"
                  className="flex-1 bg-muted/30 border border-border/40 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-violet-500/60"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                />
                <button
                  className="px-3 py-2 bg-violet-500/10 border border-violet-500/30 rounded-lg text-xs text-violet-400 hover:bg-violet-500/20 transition-colors disabled:opacity-40"
                  onClick={handleFetchGrid}
                  disabled={fetching}
                >
                  {fetching ? "…" : "↻"}
                </button>
              </div>
              <div className="text-xs text-muted-foreground mt-1 truncate">{gridSource}</div>
            </div>
          </div>
          {/* Data sources */}
          <div className="mt-3 pt-3 border-t border-border/20 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-muted-foreground">
            <div title="Power Usage Effectiveness — measures how much extra energy the data centre uses beyond the IT equipment itself. PUE 1.0 = perfect efficiency (impossible). Source: Uptime Institute Annual Global Data Centre Survey 2023.">
              <span className="font-semibold text-foreground/70">PUE</span> — Power Usage Effectiveness.
              Hyperscaler 1.1 · Colo 1.4 · On-premise 1.8.{" "}
              <span className="italic">Source: Uptime Institute 2023.</span>
            </div>
            <div title="Water Usage Effectiveness — litres of water consumed per kWh of IT equipment energy. Used for cooling towers, liquid cooling loops, evaporative systems. Applied to GPU energy only (not total facility). Source: Uptime Institute + hyperscaler sustainability reports (Google, Microsoft, AWS).">
              <span className="font-semibold text-foreground/70">WUE</span> — Water Usage Effectiveness (L/kWh).
              Hyperscaler 0.35 · Colo 0.9 · On-premise 1.6.{" "}
              <span className="italic">Source: Uptime Institute + Google/AWS/Azure sustainability reports.</span>
            </div>
            <div title="Grid carbon intensity — grams of CO₂ emitted per kWh of electricity generated. Varies by region, time of day, and energy mix. Static values are 2023 annual averages. Live values from Electricity Maps API. Source: Electricity Maps / IEA.">
              <span className="font-semibold text-foreground/70">Grid intensity</span> — gCO₂/kWh.
              Static = 2023 annual averages. Live = Electricity Maps real-time API.{" "}
              <span className="italic">Source: Electricity Maps / IEA.</span>
            </div>
          </div>
        </div>

        {/* ── Tab bar ──────────────────────────────────────────────────────────── */}
        <div className="flex items-center border-b border-border/40 mb-6 -mx-1">
          {([
            { id: "calculator"  as const, label: "Calculator",  sub: "configure + compare"  },
            { id: "analysis"    as const, label: "Analysis",    sub: "optimise + report"    },
            { id: "compliance"  as const, label: "Compliance",  sub: "regulation mapping"   },
          ]).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 -mb-px transition-colors flex items-center gap-2 ${
                activeTab === tab.id
                  ? "border-violet-500 text-violet-400"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              <span className={`text-[10px] font-normal hidden sm:inline ${
                activeTab === tab.id ? "text-violet-400/60" : "text-muted-foreground/40"
              }`}>
                {tab.sub}
              </span>
            </button>
          ))}
        </div>

        {/* ── Tab 1: Calculator ─────────────────────────────────────────────── */}
        {/* Both tabs are always rendered — just hidden — so internal component   */}
        {/* state (Fleet Timeline dates, selected recommendations) persists.      */}
        <div className={activeTab === "calculator" ? "" : "hidden"}>
          <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6 items-start">

            {/* LEFT — model inputs, sticky while results scroll */}
            <div className="lg:sticky lg:top-20 space-y-4">
              <ModelForm model={modelA} onChange={setModelA} onReset={() => setModelA(DEFAULT_MODEL_A)} label="Model A" pue={pue} wue={wue} gridIntensity={gridIntensity} />
              <ModelForm model={modelB} onChange={setModelB} onReset={() => setModelB(DEFAULT_MODEL_B)} label="Model B" pue={pue} wue={wue} gridIntensity={gridIntensity} />
              {/* Nudge to Analysis / Compliance tabs */}
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab("analysis")}
                  className="flex-1 text-[11px] px-3 py-2 rounded-lg border border-violet-500/20 bg-violet-500/5 text-violet-400/70 hover:text-violet-400 hover:border-violet-500/40 transition-colors text-left"
                >
                  Recommendations + report →
                </button>
                <button
                  onClick={() => setActiveTab("compliance")}
                  className="flex-1 text-[11px] px-3 py-2 rounded-lg border border-violet-500/20 bg-violet-500/5 text-violet-400/70 hover:text-violet-400 hover:border-violet-500/40 transition-colors text-left"
                >
                  Compliance mapping →
                </button>
              </div>
            </div>

            {/* RIGHT — results */}
            <div className="space-y-6">
              {/* Metric cards */}
              <div>
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Results</div>
                <div className="text-xs text-muted-foreground mb-1">Training (one-time)</div>
                <div className="grid grid-cols-2 gap-3 mb-3 items-stretch">
                  <MetricCard label={modelA.name} value={`${fmt1(resultA.trainCarbonKg)} kgCO₂e`} sub={`${fmt1(resultA.trainTotalEnergyKwh)} kWh · ${fmt1(resultA.trainWaterLitres)}L`} />
                  <MetricCard label={modelB.name} value={`${fmt1(resultB.trainCarbonKg)} kgCO₂e`} sub={`${fmt1(resultB.trainTotalEnergyKwh)} kWh · ${fmt1(resultB.trainWaterLitres)}L`} />
                </div>
                <div className="text-xs text-muted-foreground mb-1">Inference carbon / year</div>
                <div className="grid grid-cols-2 gap-3 items-stretch">
                  <MetricCard label={modelA.name} value={`${fmt1(resultA.infCarbonKgYear)} kgCO₂e`} sub={`crossover: ${fmtInt(resultA.crossoverDays)}d`} />
                  <MetricCard label={modelB.name} value={`${fmt1(resultB.infCarbonKgYear)} kgCO₂e`} sub={`crossover: ${fmtInt(resultB.crossoverDays)}d`} />
                </div>
              </div>

              {/* Comparison table */}
              <div>
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Full Comparison</div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => setShowBenchmark(v => !v)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-colors ${showBenchmark ? "border-blue-500/50 bg-blue-500/10 text-blue-400" : "border-border/50 text-muted-foreground hover:border-blue-500/30 hover:text-blue-400"}`}
                    >
                      {showBenchmark ? "◉ Benchmark on" : "◎ Compare vs benchmark"}
                    </button>
                    {showBenchmark && (
                      <>
                        <select value={bmSource} onChange={e => setBmSource(e.target.value as BenchmarkSource)} className="text-[11px] px-2 py-1 rounded-lg border border-border/50 bg-background outline-none text-muted-foreground">
                          {bmSources.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <select value={bmTaskClass} onChange={e => setBmTaskClass(e.target.value as BenchmarkTaskClass)} className="text-[11px] px-2 py-1 rounded-lg border border-border/50 bg-background outline-none text-muted-foreground">
                          {bmTaskClasses.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </>
                    )}
                  </div>
                </div>
                {showBenchmark && (
                  <div className="rounded-lg border border-blue-500/15 bg-blue-500/5 px-3 py-2 mb-2 space-y-1">
                    <p className="text-[10px] text-blue-400/80 leading-relaxed"><span className="font-semibold">{bmSource}:</span> {BM_SOURCE_TIPS[bmSource]}</p>
                    <p className="text-[10px] text-blue-400/60 leading-relaxed"><span className="font-semibold">Task class:</span> {BM_TASKCLASS_TIPS[bmTaskClass]}</p>
                  </div>
                )}
                <ComparisonTable a={resultA} b={resultB} labelA={modelA.name} labelB={modelB.name} benchmark={benchmarkRef} />
                {showBenchmark && benchmarkRef && (
                  <BenchmarkPanel a={resultA} b={resultB} labelA={modelA.name} labelB={modelB.name} benchmark={benchmarkRef} />
                )}
              </div>

              {/* Inference summary */}
              <InferenceSummary a={resultA} b={resultB} configA={modelA} configB={modelB} />

              {/* Regulatory flags */}
              <div>
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Regulatory Flags — training + 1yr inference combined
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground font-semibold mb-1">{modelA.name}</div>
                    <RegBadge {...flagsA.euGpai} currentValue={resultA.trainTotalEnergyKwh}                              threshold={100000} unit="kWh" />
                    <RegBadge {...flagsA.csrd}   currentValue={resultA.trainTotalEnergyKwh + resultA.infEnergyKwhYear}   threshold={10000}  unit="kWh" />
                    <RegBadge {...flagsA.gri305} currentValue={resultA.trainCarbonKg + resultA.infCarbonKgYear}          threshold={1000}   unit="kgCO₂e" />
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground font-semibold mb-1">{modelB.name}</div>
                    <RegBadge {...flagsB.euGpai} currentValue={resultB.trainTotalEnergyKwh}                              threshold={100000} unit="kWh" />
                    <RegBadge {...flagsB.csrd}   currentValue={resultB.trainTotalEnergyKwh + resultB.infEnergyKwhYear}   threshold={10000}  unit="kWh" />
                    <RegBadge {...flagsB.gri305} currentValue={resultB.trainCarbonKg + resultB.infCarbonKgYear}          threshold={1000}   unit="kgCO₂e" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Thresholds: EU GPAI Art. 53 proxy &gt;100 MWh training · CSRD ESRS E1 annual energy &gt;10 MWh · GRI 305 &gt;1t CO₂e.
                  Accuracy: energy ±15% vs published benchmarks. Carbon error depends on grid intensity source.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Tab 2: Analysis ───────────────────────────────────────────────── */}
        <div className={activeTab === "analysis" ? "" : "hidden"}>
          {/* Config context banner — shows what config is being analysed */}
          <div className="rounded-xl border border-border/30 bg-muted/10 px-4 py-2.5 mb-6 flex items-center justify-between flex-wrap gap-2">
            <div className="text-[10px] text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground/60">Analysing:</span>{" "}
              {modelA.name} vs {modelB.name}
              <span className="mx-1.5 text-border">·</span>
              {region}
              <span className="mx-1.5 text-border">·</span>
              <span className="font-mono text-violet-400/80">{gridIntensity} gCO₂/kWh</span>
              <span className="mx-1.5 text-border">·</span>
              {dcType}
            </div>
            <button
              onClick={() => setActiveTab("calculator")}
              className="text-[10px] text-violet-400/60 hover:text-violet-400 transition-colors flex-shrink-0"
            >
              ← Edit config
            </button>
          </div>

          <div className="space-y-6">
            <RecommendationAgent
              modelA={modelA} modelB={modelB}
              resultA={resultA} resultB={resultB}
              gridIntensity={gridIntensity}
            />
            <FleetTimeline
              modelA={modelA} modelB={modelB}
              resultA={resultA} resultB={resultB}
            />
            <ReportNarrative
              modelA={modelA} modelB={modelB}
              resultA={resultA} resultB={resultB}
              flagsA={flagsA} flagsB={flagsB}
            />
          </div>
        </div>

        {/* ── Tab 3: Compliance ─────────────────────────────────────────────── */}
        <div className={activeTab === "compliance" ? "" : "hidden"}>
          {/* Config context banner */}
          <div className="rounded-xl border border-border/30 bg-muted/10 px-4 py-2.5 mb-6 flex items-center justify-between flex-wrap gap-2">
            <div className="text-[10px] text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground/60">Based on:</span>{" "}
              {modelA.name} vs {modelB.name}
              <span className="mx-1.5 text-border">·</span>
              <span className="font-mono text-violet-400/80">{gridIntensity} gCO₂/kWh</span>
              <span className="mx-1.5 text-border">·</span>
              Training energy up to{" "}
              <span className="font-mono text-violet-400/80">
                {fmt1(Math.max(resultA.trainTotalEnergyKwh, resultB.trainTotalEnergyKwh))} kWh
              </span>
            </div>
            <button
              onClick={() => setActiveTab("calculator")}
              className="text-[10px] text-violet-400/60 hover:text-violet-400 transition-colors flex-shrink-0"
            >
              ← Edit config
            </button>
          </div>

          <DynamicRegFlags
            resultA={resultA} resultB={resultB}
          />
        </div>

      </div>
    </div>
  );
}

// ── Route export ──────────────────────────────────────────────────────────────
const CarbonDepth = () => (
  <PageGate pageId="carbon-depth" backTo="/#projects" previewContent={<CarbonDepthPreview />}>
    <CarbonDepthPage />
  </PageGate>
);

export default CarbonDepth;
