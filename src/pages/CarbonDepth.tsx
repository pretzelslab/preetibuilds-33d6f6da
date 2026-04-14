import { useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { PageGate } from "@/components/ui/PageGate";
import { useVisitLogger } from "@/hooks/useVisitLogger";
import {
  GPU_PRESETS, PUE_BY_TYPE, WUE_BY_TYPE, REGION_ZONES,
  STATIC_INTENSITY, DEFAULT_MODEL_A, DEFAULT_MODEL_B,
  calculateFootprint, getRegFlags, fetchGridIntensity,
} from "@/data/carbonDepthData";
import type { ModelConfig, FootprintResult, RegFlag } from "@/data/carbonDepthData";

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

function ComparisonTable({ a, b, labelA, labelB }: {
  a: FootprintResult; b: FootprintResult; labelA: string; labelB: string;
}) {
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
          </tr>
        </thead>
        <tbody>
          {TABLE_ROWS.map((row, i) => {
            const vA    = a[row.key] as number;
            const vB    = b[row.key] as number;
            const ratio = vA > 0 ? vB / vA : 0;
            const ratioStr   = isFinite(ratio) ? `${ratio.toFixed(1)}×` : "—";
            const ratioColor = ratio > 5 ? "text-red-400" : ratio > 2 ? "text-amber-400" : "text-emerald-400";
            return (
              <tr key={row.label} className={`border-b border-border/20 ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                <td className="px-3 py-2 text-foreground/90">{row.label}</td>
                <td className="px-3 py-2 text-muted-foreground font-mono hidden lg:table-cell">{row.formula}</td>
                <td className="px-3 py-2 text-right font-mono">{row.fmt(vA)}{row.unit}</td>
                <td className="px-3 py-2 text-right font-mono">{row.fmt(vB)}{row.unit}</td>
                <td className={`px-3 py-2 text-right font-mono font-bold ${ratioColor}`}>{ratioStr}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
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
function ModelForm({ model, onChange, label, pue, wue, gridIntensity }: {
  model: ModelConfig; onChange: (m: ModelConfig) => void; label: string;
  pue: number; wue: number; gridIntensity: number;
}) {
  const [showFlow, setShowFlow] = useState(false);
  const set = (key: keyof ModelConfig, value: string | number) =>
    onChange({ ...model, [key]: value });

  const tdp = model.gpuType === "Custom" ? model.customTdpWatts : (GPU_PRESETS[model.gpuType] ?? model.customTdpWatts);

  return (
    <div className="rounded-xl border border-border/40 p-4 space-y-3">
      <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</div>

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
            {Object.keys(GPU_PRESETS).map(g => (
              <option key={g} value={g}>{g} ({GPU_PRESETS[g]}W)</option>
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

        {/* Blurred tease — interactive inputs + reg flags */}
        <div style={{ filter: "blur(4px)", opacity: 0.38, pointerEvents: "none", userSelect: "none" }} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border/40 bg-muted/10 p-4 space-y-2">
              {[20, 16, 24, 16, 20, 16].map((w, i) => (
                <div key={i} className={`h-${i % 2 === 0 ? "8" : "2"} w-${i % 2 === 0 ? "full" : w} rounded bg-muted/${i % 2 === 0 ? "40" : "60"}`} />
              ))}
            </div>
            <div className="rounded-xl border border-border/40 bg-muted/10 p-4 space-y-2">
              {[20, 16, 24, 16, 20, 16].map((w, i) => (
                <div key={i} className={`h-${i % 2 === 0 ? "8" : "2"} w-${i % 2 === 0 ? "full" : w} rounded bg-muted/${i % 2 === 0 ? "40" : "60"}`} />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {["EU GPAI Act", "CSRD / ESRS E1", "GRI 305"].map(label => (
              <div key={label} className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3">
                <div className="text-[10px] font-mono text-violet-400 mb-1">{label}</div>
                <div className="h-2 rounded-full bg-muted/40 mb-1.5" />
                <div className="h-2 w-2/3 rounded bg-muted/30" />
              </div>
            ))}
          </div>
        </div>
      </div>
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

  const pue = PUE_BY_TYPE[dcType] ?? 1.1;
  const wue = WUE_BY_TYPE[dcType] ?? 0.35;

  const resultA = useMemo(() => calculateFootprint(modelA, pue, wue, gridIntensity), [modelA, pue, wue, gridIntensity]);
  const resultB = useMemo(() => calculateFootprint(modelB, pue, wue, gridIntensity), [modelB, pue, wue, gridIntensity]);
  const flagsA  = useMemo(() => getRegFlags(resultA), [resultA]);
  const flagsB  = useMemo(() => getRegFlags(resultB), [resultB]);

  const handleFetchGrid = useCallback(async () => {
    if (!apiKey) {
      const zone = REGION_ZONES[region];
      const fb   = STATIC_INTENSITY[zone] ?? 450;
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
    const zone = REGION_ZONES[r];
    setGrid(STATIC_INTENSITY[zone] ?? 450);
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
                {Object.keys(REGION_ZONES).map(r => <option key={r} value={r}>{r}</option>)}
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

        {/* ── Main two-column layout: inputs (left) + results (right) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6 items-start">

          {/* LEFT — inputs, sticky so they stay visible while results scroll */}
          <div className="lg:sticky lg:top-20 space-y-4">
            <ModelForm model={modelA} onChange={setModelA} label="Model A" pue={pue} wue={wue} gridIntensity={gridIntensity} />
            <ModelForm model={modelB} onChange={setModelB} label="Model B" pue={pue} wue={wue} gridIntensity={gridIntensity} />
          </div>

          {/* RIGHT — results */}
          <div className="space-y-6">
            {/* Metric cards */}
            <div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Results</div>
              {/* Training row — A and B side by side */}
              <div className="text-xs text-muted-foreground mb-1">Training (one-time)</div>
              <div className="grid grid-cols-2 gap-3 mb-3 items-stretch">
                <MetricCard label={modelA.name} value={`${fmt1(resultA.trainCarbonKg)} kgCO₂e`} sub={`${fmt1(resultA.trainTotalEnergyKwh)} kWh · ${fmt1(resultA.trainWaterLitres)}L`} />
                <MetricCard label={modelB.name} value={`${fmt1(resultB.trainCarbonKg)} kgCO₂e`} sub={`${fmt1(resultB.trainTotalEnergyKwh)} kWh · ${fmt1(resultB.trainWaterLitres)}L`} />
              </div>
              {/* Inference row — A and B side by side */}
              <div className="text-xs text-muted-foreground mb-1">Inference carbon / year</div>
              <div className="grid grid-cols-2 gap-3 items-stretch">
                <MetricCard label={modelA.name} value={`${fmt1(resultA.infCarbonKgYear)} kgCO₂e`} sub={`crossover: ${fmtInt(resultA.crossoverDays)}d`} />
                <MetricCard label={modelB.name} value={`${fmt1(resultB.infCarbonKgYear)} kgCO₂e`} sub={`crossover: ${fmtInt(resultB.crossoverDays)}d`} />
              </div>
            </div>

            {/* Comparison table */}
            <div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Full Comparison</div>
              <ComparisonTable a={resultA} b={resultB} labelA={modelA.name} labelB={modelB.name} />
            </div>

            {/* Inference summary */}
            <InferenceSummary
              a={resultA} b={resultB}
              configA={modelA} configB={modelB}
            />

            {/* Regulatory flags with thresholds */}
            <div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Regulatory Flags — training + 1yr inference combined
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground font-semibold mb-1">{modelA.name}</div>
                  <RegBadge {...flagsA.euGpai} currentValue={resultA.trainTotalEnergyKwh}   threshold={100000} unit="kWh" />
                  <RegBadge {...flagsA.csrd}   currentValue={resultA.trainTotalEnergyKwh + resultA.infEnergyKwhYear} threshold={10000} unit="kWh" />
                  <RegBadge {...flagsA.gri305} currentValue={resultA.trainCarbonKg + resultA.infCarbonKgYear}         threshold={1000}  unit="kgCO₂e" />
                </div>
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground font-semibold mb-1">{modelB.name}</div>
                  <RegBadge {...flagsB.euGpai} currentValue={resultB.trainTotalEnergyKwh}   threshold={100000} unit="kWh" />
                  <RegBadge {...flagsB.csrd}   currentValue={resultB.trainTotalEnergyKwh + resultB.infEnergyKwhYear} threshold={10000} unit="kWh" />
                  <RegBadge {...flagsB.gri305} currentValue={resultB.trainCarbonKg + resultB.infCarbonKgYear}         threshold={1000}  unit="kgCO₂e" />
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
    </div>
  );
}

// ── Route export ──────────────────────────────────────────────────────────────
const CarbonDepth = () => (
  <PageGate backTo="/#projects" previewContent={<CarbonDepthPreview />}>
    <CarbonDepthPage />
  </PageGate>
);

export default CarbonDepth;
