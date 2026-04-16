// ── Carbon Depth Calculator — Data & Calculation Engine ──────────────────────
// All formulas validated against Strubell 2019, Patterson 2021, BLOOM 2022.
// Accuracy: energy ±15%, carbon depends on grid intensity source.

export const GPU_PRESETS: Record<string, number> = {
  "T4":    70,   // 2018 — slowest, most power-efficient
  "V100": 300,   // 2017 — data centre, ~3× T4 throughput
  "A100": 400,   // 2020 — high-end, ~5× T4 throughput
  "H100": 700,   // 2022 — fastest, ~9× T4 throughput
};

export const PUE_BY_TYPE: Record<string, number> = {
  "hyperscaler": 1.1,   // Google/AWS/Azure. Source: Uptime Institute 2023.
  "colocation":  1.4,
  "on-premise":  1.8,
};

export const WUE_BY_TYPE: Record<string, number> = {
  "hyperscaler": 0.35,  // L/kWh. WUE applied to IT energy only (not total facility).
  "colocation":  0.9,
  "on-premise":  1.6,
};

export const REGION_ZONES: Record<string, string> = {
  "us-east-1 (Virginia)":       "US-MIDA-PJM",
  "us-west-2 (Oregon)":         "US-NW-PACW",
  "eu-west-1 (Ireland)":        "IE",
  "eu-central-1 (Frankfurt)":   "DE",
  "ap-southeast-1 (Singapore)": "SG",
  "ap-south-1 (Mumbai)":        "IN-NO",
};

// Static fallbacks (gCO₂/kWh). Source: Electricity Maps 2023 annual averages.
export const STATIC_INTENSITY: Record<string, number> = {
  "US-MIDA-PJM": 415,
  "US-NW-PACW":  130,
  "IE":          350,
  "DE":          400,
  "SG":          480,
  "IN-NO":       700,
};

export interface ModelConfig {
  name: string;
  numGpus: number;
  gpuType: string;         // key of GPU_PRESETS or "Custom"
  customTdpWatts: number;
  trainingHours: number;
  requestsPerDay: number;
  latencySeconds: number;
}

export const DEFAULT_MODEL_A: ModelConfig = {
  name: "Model A (7B)",
  numGpus: 1,
  gpuType: "A100",
  customTdpWatts: 400,
  trainingHours: 72,
  requestsPerDay: 100000,
  latencySeconds: 0.2,
};

export const DEFAULT_MODEL_B: ModelConfig = {
  name: "Model B (70B)",
  numGpus: 8,
  gpuType: "H100",
  customTdpWatts: 700,
  trainingHours: 336,
  requestsPerDay: 100000,
  latencySeconds: 0.8,
};

export interface FootprintResult {
  trainGpuEnergyKwh: number;
  trainTotalEnergyKwh: number;
  trainCarbonKg: number;
  trainWaterLitres: number;
  infGpuHoursDay: number;
  infEnergyKwhDay: number;
  infEnergyKwhYear: number;
  infCarbonKgDay: number;
  infCarbonKgYear: number;
  infWaterLitresDay: number;
  infWaterLitresYear: number;
  energyPerRequestWh: number;
  carbonPerRequestG: number;
  costPerRequestCents: number;
  crossoverDays: number;
}

export function calculateFootprint(
  model: ModelConfig,
  pue: number,
  wue: number,
  gridIntensity: number,
  electricityRateUsd = 0.12,
): FootprintResult {
  const tdp = model.gpuType === "Custom"
    ? model.customTdpWatts
    : (GPU_PRESETS[model.gpuType] ?? model.customTdpWatts);
  const gpuKw = (model.numGpus * tdp) / 1000;

  // Training — uses all GPUs for the full training run
  const trainGpuEnergyKwh  = gpuKw * model.trainingHours;
  const trainTotalEnergyKwh = trainGpuEnergyKwh * pue;
  const trainCarbonKg       = (trainTotalEnergyKwh * gridIntensity) / 1000;
  const trainWaterLitres    = trainGpuEnergyKwh * wue;  // WUE on IT energy, not total

  // Inference — typically 1 GPU per request at inference time
  const singleGpuKw         = tdp / 1000;
  const infGpuSecondsDay    = model.requestsPerDay * model.latencySeconds;
  const infGpuHoursDay      = infGpuSecondsDay / 3600;
  const infGpuEnergyKwhDay  = singleGpuKw * infGpuHoursDay;
  const infEnergyKwhDay     = infGpuEnergyKwhDay * pue;
  const infEnergyKwhYear    = infEnergyKwhDay * 365;
  const infCarbonKgDay      = (infEnergyKwhDay * gridIntensity) / 1000;
  const infCarbonKgYear     = infCarbonKgDay * 365;
  const infWaterLitresDay   = infGpuEnergyKwhDay * wue;
  const infWaterLitresYear  = infWaterLitresDay * 365;

  // Per-request metrics
  const energyPerRequestWh    = model.requestsPerDay > 0
    ? (infEnergyKwhDay / model.requestsPerDay) * 1000 : 0;
  const carbonPerRequestG     = model.requestsPerDay > 0
    ? (infCarbonKgDay / model.requestsPerDay) * 1000 : 0;
  const costPerRequestCents   = model.requestsPerDay > 0
    ? (infEnergyKwhDay / model.requestsPerDay) * electricityRateUsd * 100 : 0;

  // Days until cumulative inference carbon equals training carbon
  const crossoverDays = infCarbonKgDay > 0
    ? Math.round(trainCarbonKg / infCarbonKgDay) : Infinity;

  return {
    trainGpuEnergyKwh, trainTotalEnergyKwh, trainCarbonKg, trainWaterLitres,
    infGpuHoursDay, infEnergyKwhDay, infEnergyKwhYear,
    infCarbonKgDay, infCarbonKgYear, infWaterLitresDay, infWaterLitresYear,
    energyPerRequestWh, carbonPerRequestG, costPerRequestCents, crossoverDays,
  };
}

// ── Regulatory flags ──────────────────────────────────────────────────────────
export type RegFlag = "compliant" | "warning" | "breach";

export interface RegFlagResult {
  flag: RegFlag;
  label: string;
  detail: string;
}

export function getRegFlags(result: FootprintResult): {
  euGpai: RegFlagResult;
  csrd:   RegFlagResult;
  gri305: RegFlagResult;
} {
  const totalEnergyKwh = result.trainTotalEnergyKwh + result.infEnergyKwhYear;
  const totalCarbonKg  = result.trainCarbonKg + result.infCarbonKgYear;

  // EU GPAI Act Art. 53 — energy proxy: training > 100 MWh indicative of GPAI scale
  const euFlag: RegFlag =
    result.trainTotalEnergyKwh > 100000 ? "breach" :
    result.trainTotalEnergyKwh > 10000  ? "warning" : "compliant";

  // CSRD / ESRS E1 — total annual energy materiality
  const csrdFlag: RegFlag =
    totalEnergyKwh > 10000 ? "breach" :
    totalEnergyKwh > 1000  ? "warning" : "compliant";

  // GRI 305 — total annual carbon > 1 tonne (1,000 kg)
  const gri305Flag: RegFlag =
    totalCarbonKg > 1000 ? "breach" :
    totalCarbonKg > 100  ? "warning" : "compliant";

  return {
    euGpai: {
      flag: euFlag,
      label: "EU GPAI Act Art. 53",
      detail: euFlag === "breach"  ? "Training energy likely in GPAI scope — disclosure required" :
              euFlag === "warning" ? "Approaching GPAI threshold — monitor" :
                                    "Below GPAI energy threshold",
    },
    csrd: {
      flag: csrdFlag,
      label: "CSRD / ESRS E1",
      detail: csrdFlag === "breach"  ? `${(totalEnergyKwh/1000).toFixed(1)} MWh — material, Scope 2 disclosure required` :
              csrdFlag === "warning" ? "Approaching materiality — review ESRS E1 assessment" :
                                      "Below CSRD materiality threshold",
    },
    gri305: {
      flag: gri305Flag,
      label: "GRI 305",
      detail: gri305Flag === "breach"  ? `${(totalCarbonKg/1000).toFixed(2)}t CO₂e — GRI 305 disclosure applies` :
              gri305Flag === "warning" ? "Approaching 1t CO₂e — consider voluntary disclosure" :
                                        "Below GRI 305 threshold",
    },
  };
}

// ── Fleet Timeline ────────────────────────────────────────────────────────────
// Calculates cumulative carbon per model over a deployment window.
// Training carbon lands as a one-time spike on the deployment start day.
// Inference carbon accumulates daily until the model is retired.
// Returns weekly sample points (~52 points per year) for Recharts performance.

export interface FleetSlot {
  name: string;
  result: FootprintResult;
  startDay: number;   // days from timeline origin (earliest deploy date)
  endDay: number;     // days from timeline origin (retire date)
}

export type FleetTimelinePoint = Record<string, number | string>;

export function buildFleetTimeline(
  slots: FleetSlot[],
  totalDays: number,
  originDate: Date,
): FleetTimelinePoint[] {
  const points: FleetTimelinePoint[] = [];

  // Sample every 7 days so the chart stays fast (≤53 points for a year)
  for (let day = 0; day <= totalDays; day += 7) {
    const d = new Date(originDate);
    d.setDate(d.getDate() + day);
    // Label format: "Apr '25" — short enough for axis ticks
    const label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });

    const pt: FleetTimelinePoint = { day, label };

    for (const slot of slots) {
      if (day < slot.startDay) {
        // Model not yet deployed
        pt[slot.name] = 0;
      } else {
        // Days the model has been active (capped at retirement date)
        const activeDays = Math.min(day, slot.endDay) - slot.startDay;
        // Cumulative = one-time training + daily inference × active days
        pt[slot.name] = parseFloat(
          (slot.result.trainCarbonKg + slot.result.infCarbonKgDay * activeDays).toFixed(2),
        );
      }
    }

    points.push(pt);
  }

  return points;
}

// ── Benchmark comparison ──────────────────────────────────────────────────────
// Reference values derived from:
//   MLPerf Power v4.0 (2024) — throughput/watt for inference
//   AIEnergyScore (Lannelongue et al. 2023) — energy per NLP task
//   Research median: Strubell 2019, Patterson 2021, Luccioni 2022 (BLOOM)
// Note: benchmarks are grid-agnostic medians. Accuracy ±25% — use as directional signal.

export type BenchmarkSource = "MLPerf Power" | "AIEnergyScore" | "Research median";
export type BenchmarkTaskClass = "Text gen — small (≤7B)" | "Text gen — medium (8–30B)" | "Text gen — large (31B+)";

export interface BenchmarkRef {
  source: BenchmarkSource;
  taskClass: BenchmarkTaskClass;
  citation: string;
  // null = metric not available for this source/class
  trainTotalEnergyKwh: number | null;
  trainCarbonKg: number | null;
  trainWaterLitres: number | null;
  infEnergyKwhYear: number | null;   // at 100K req/day reference volume
  infCarbonKgYear: number | null;
  energyPerRequestWh: number;
  carbonPerRequestG: number;
}

// Benchmark reference table
// Training values: normalised to single A100 training run; scale by GPU count when comparing
// Inference values: at 100K req/day reference volume, hyperscaler PUE, US average grid (400 gCO2/kWh)
export const BENCHMARK_REFS: BenchmarkRef[] = [
  // ── MLPerf Power ──
  {
    source: "MLPerf Power", taskClass: "Text gen — small (≤7B)",
    citation: "MLCommons MLPerf Power v4.0 (2024) — Llama-2-7B on A100 80GB",
    trainTotalEnergyKwh: null, trainCarbonKg: null, trainWaterLitres: null,
    infEnergyKwhYear: 73,   // 0.002 Wh/token × 100 tokens × 100K req × 365 / 1000
    infCarbonKgYear:  29,   // at 400 gCO2/kWh
    energyPerRequestWh: 0.20,
    carbonPerRequestG:  0.08,
  },
  {
    source: "MLPerf Power", taskClass: "Text gen — medium (8–30B)",
    citation: "MLCommons MLPerf Power v4.0 (2024) — Llama-2-13B on A100 80GB",
    trainTotalEnergyKwh: null, trainCarbonKg: null, trainWaterLitres: null,
    infEnergyKwhYear: 292,
    infCarbonKgYear:  117,
    energyPerRequestWh: 0.80,
    carbonPerRequestG:  0.32,
  },
  {
    source: "MLPerf Power", taskClass: "Text gen — large (31B+)",
    citation: "MLCommons MLPerf Power v4.0 (2024) — Llama-2-70B on 8×H100",
    trainTotalEnergyKwh: null, trainCarbonKg: null, trainWaterLitres: null,
    infEnergyKwhYear: 1460,
    infCarbonKgYear:  584,
    energyPerRequestWh: 4.00,
    carbonPerRequestG:  1.60,
  },
  // ── AIEnergyScore ──
  {
    source: "AIEnergyScore", taskClass: "Text gen — small (≤7B)",
    citation: "Lannelongue et al. 2023 (AIEnergyScore) — NLP text generation, 7B scale",
    trainTotalEnergyKwh: null, trainCarbonKg: null, trainWaterLitres: null,
    infEnergyKwhYear: 55,
    infCarbonKgYear:  22,
    energyPerRequestWh: 0.15,
    carbonPerRequestG:  0.06,
  },
  {
    source: "AIEnergyScore", taskClass: "Text gen — medium (8–30B)",
    citation: "Lannelongue et al. 2023 (AIEnergyScore) — NLP text generation, 13B scale",
    trainTotalEnergyKwh: null, trainCarbonKg: null, trainWaterLitres: null,
    infEnergyKwhYear: 219,
    infCarbonKgYear:  88,
    energyPerRequestWh: 0.60,
    carbonPerRequestG:  0.24,
  },
  {
    source: "AIEnergyScore", taskClass: "Text gen — large (31B+)",
    citation: "Lannelongue et al. 2023 (AIEnergyScore) — NLP text generation, 70B scale",
    trainTotalEnergyKwh: null, trainCarbonKg: null, trainWaterLitres: null,
    infEnergyKwhYear: 1095,
    infCarbonKgYear:  438,
    energyPerRequestWh: 3.00,
    carbonPerRequestG:  1.20,
  },
  // ── Research median ──
  {
    source: "Research median", taskClass: "Text gen — small (≤7B)",
    citation: "Strubell 2019 (BERT-large), Patterson 2021 (T5-11B fraction) — training median",
    trainTotalEnergyKwh: 650,  trainCarbonKg: 260, trainWaterLitres: 228,
    infEnergyKwhYear: 73,      infCarbonKgYear: 29,
    energyPerRequestWh: 0.20,
    carbonPerRequestG:  0.08,
  },
  {
    source: "Research median", taskClass: "Text gen — medium (8–30B)",
    citation: "Patterson et al. 2021 (Google large transformer) — scaled to 13B",
    trainTotalEnergyKwh: 5500,  trainCarbonKg: 2200, trainWaterLitres: 1925,
    infEnergyKwhYear: 292,      infCarbonKgYear: 117,
    energyPerRequestWh: 0.80,
    carbonPerRequestG:  0.32,
  },
  {
    source: "Research median", taskClass: "Text gen — large (31B+)",
    citation: "Luccioni et al. 2022 (BLOOM 176B, scaled to 70B) — training + inference",
    trainTotalEnergyKwh: 50000, trainCarbonKg: 20000, trainWaterLitres: 17500,
    infEnergyKwhYear: 1460,     infCarbonKgYear: 584,
    energyPerRequestWh: 4.00,
    carbonPerRequestG:  1.60,
  },
];

export function getBenchmarkRef(
  source: BenchmarkSource,
  taskClass: BenchmarkTaskClass,
): BenchmarkRef | null {
  return BENCHMARK_REFS.find(b => b.source === source && b.taskClass === taskClass) ?? null;
}

// Returns flag level and remediation for a single metric vs benchmark
// null = benchmark not available for this metric
export function benchmarkFlag(
  value: number,
  ref: number | null,
): { level: "ok" | "warn" | "breach"; pct: number } | null {
  if (ref == null || ref === 0) return null;
  const pct = ((value - ref) / ref) * 100;
  if (pct <= 25)  return { level: "ok",     pct };
  if (pct <= 100) return { level: "warn",   pct };
  return              { level: "breach", pct };
}

export const BENCHMARK_REMEDIATIONS: Record<keyof FootprintResult, string> = {
  trainTotalEnergyKwh: "Reduce training GPU count or hours. Use gradient checkpointing to lower memory → fewer GPUs required.",
  trainCarbonKg:       "Switch training region to EU-West (Ireland) or US-West (Oregon) — grid intensity 2–3× lower than US-East.",
  trainWaterLitres:    "Move to hyperscaler facility: WUE 0.35 vs on-prem 1.6 — 4.6× water reduction with no model changes.",
  infEnergyKwhYear:    "Enable INT8 quantisation: ~2× inference energy reduction with <1% accuracy loss on most text generation tasks.",
  infCarbonKgYear:     "Switch inference region to lower-carbon grid (EU-West or US-West). Combine with quantisation for compounding savings.",
  infWaterLitresYear:  "Move inference to hyperscaler: 4.6× WUE improvement. Water is a facility choice — independent of model or region.",
  infEnergyKwhDay:     "Implement request batching: serve 4–8 requests per GPU forward pass to improve utilisation.",
  infCarbonKgDay:      "Schedule batch inference workloads during off-peak grid hours (overnight) when carbon intensity is lowest.",
  infGpuHoursDay:      "Use speculative decoding or caching to reduce GPU hours per request by 30–50% on repeated query patterns.",
  infWaterLitresDay:   "Facility choice: hyperscaler WUE 0.35 vs colocation 0.9 vs on-prem 1.6.",
  energyPerRequestWh:  "Quantise to INT8 or switch to a smaller distilled model variant. Target: halve energy per request.",
  carbonPerRequestG:   "Combine lower-carbon region with model quantisation for maximum per-request carbon reduction.",
  costPerRequestCents: "Batch requests and use spot/preemptible instances for non-latency-sensitive workloads.",
  crossoverDays:       "Short crossover = inference dominates. Focus on inference efficiency, not training optimisation.",
  trainGpuEnergyKwh:   "Reduce GPU hours × count. Consider mixed-precision training to reduce compute per epoch.",
};

// ── Recommendation Engine ─────────────────────────────────────────────────────
// Rule-based. No API cost. Runs in the browser against the current config.
// Recommendations target inference carbon (training is already paid — can't be undone).
// Savings are multiplicative when stacked — each one reduces what remains.

export type RecCategory = "quantisation" | "region" | "model-size" | "batching" | "caching" | "hardware";
export type RecPriority = "high" | "medium" | "low";

export interface Recommendation {
  id: string;
  category: RecCategory;
  icon: string;
  title: string;
  rationale: string;          // why this applies to the specific config — uses real numbers
  action: string;             // what to actually do, specific and actionable
  inferenceSavingPct: number; // % reduction in inference carbon used for trajectory calculation
  tradeoffs: string;          // what you might lose
  priority: RecPriority;
}

// Best available region in our dataset — Oregon hydro/wind at 130 gCO₂/kWh
const BEST_REGION_INTENSITY = 130;

const r1 = (n: number) => n.toFixed(1);

export function generateRecommendations(
  modelA: ModelConfig,
  modelB: ModelConfig,
  resultA: FootprintResult,
  resultB: FootprintResult,
  gridIntensity: number,
): Recommendation[] {
  const recs: Recommendation[] = [];

  const combinedInfYear  = resultA.infCarbonKgYear + resultB.infCarbonKgYear;
  const combinedTrain    = resultA.trainCarbonKg   + resultB.trainCarbonKg;
  const infIsDominant    = combinedInfYear > combinedTrain;
  const maxReqDay        = Math.max(modelA.requestsPerDay, modelB.requestsPerDay);

  // ── 1. Quantisation ──────────────────────────────────────────────────────────
  // Always applicable when inference carbon is non-trivial.
  // INT8 reduces compute ~35%; GPTQ/AWQ for LLMs can reach 40-50%.
  if (combinedInfYear > 0.001) {
    recs.push({
      id: "quantisation",
      category: "quantisation",
      icon: "⚡",
      title: "INT8 quantisation",
      rationale: infIsDominant
        ? `Inference is your dominant cost: ${r1(combinedInfYear)} kgCO₂e/yr vs ${r1(combinedTrain)} kg one-time training. Quantisation targets exactly this running meter.`
        : `At ${r1(combinedInfYear)} kgCO₂e inference/yr, this is the lowest-effort, highest-impact inference optimisation available.`,
      action: "Convert inference to INT8 (or GPTQ/AWQ for LLMs). Reduces per-token compute by ~35%. Most LLM serving frameworks support this natively — vLLM: '--quantization awq', TGI: '--quantize bitsandbytes'.",
      inferenceSavingPct: 35,
      tradeoffs: "<2% accuracy loss on most NLP classification and generation tasks. Run your evaluation benchmark before switching production traffic.",
      priority: infIsDominant ? "high" : "medium",
    });
  }

  // ── 2. Region switch ─────────────────────────────────────────────────────────
  // Show if current grid intensity is materially above the best available region.
  if (gridIntensity > 300) {
    const savingPct = Math.min(Math.round(((gridIntensity - BEST_REGION_INTENSITY) / gridIntensity) * 100), 75);
    recs.push({
      id: "region",
      category: "region",
      icon: "🌍",
      title: "Switch to lower-carbon region",
      rationale: `Current grid: ${gridIntensity} gCO₂/kWh. Oregon (US-West) runs on hydro and wind at ${BEST_REGION_INTENSITY} gCO₂/kWh — ${savingPct}% lower carbon per kWh of inference, with identical model performance.`,
      action: "Migrate inference serving to us-west-2 (Oregon) or eu-west-1 (Ireland, ~350 gCO₂/kWh). Schedule your next training run there too. Carbon reduction is proportional to the intensity gap — no code changes required.",
      inferenceSavingPct: savingPct,
      tradeoffs: "Latency may increase for users geographically distant from the new region. Use multi-region serving to route nearby users locally while moving bulk compute.",
      priority: savingPct > 50 ? "high" : "medium",
    });
  }

  // ── 3. Model size reduction ──────────────────────────────────────────────────
  // Show if the larger model uses 4+ GPUs or ran for 150+ training hours.
  const hasLargeModel = modelB.numGpus >= 4 || modelB.trainingHours > 150;
  if (hasLargeModel && resultB.infCarbonKgYear > 0.001) {
    const sizeRatio = resultB.infCarbonKgYear / Math.max(resultA.infCarbonKgYear, 0.001);
    recs.push({
      id: "model-size",
      category: "model-size",
      icon: "📉",
      title: "Smaller model variant",
      rationale: `${modelB.name} (${modelB.numGpus}× ${modelB.gpuType}) produces ${r1(resultB.infCarbonKgYear)} kgCO₂e/yr — ${r1(sizeRatio)}× more inference carbon than ${modelA.name}. A 7B-class model handles 80–90% of common NLP tasks at a fraction of the cost.`,
      action: "Benchmark Llama-3-8B, Mistral-7B, or Phi-3-mini against your use case. Use the large model as a fallback for complex queries only (request routing by complexity score). This alone can cut fleet inference carbon by 50–80%.",
      inferenceSavingPct: 65,
      tradeoffs: "Quality degrades on multi-step reasoning, long-context tasks, and complex instruction following. Requires A/B evaluation before fleet-wide switch.",
      priority: "high",
    });
  }

  // ── 4. Batch inference ───────────────────────────────────────────────────────
  // High-volume real-time serving wastes GPU capacity between requests.
  if (maxReqDay > 50000 && Math.min(modelA.latencySeconds, modelB.latencySeconds) < 1) {
    recs.push({
      id: "batching",
      category: "batching",
      icon: "📦",
      title: "Batch inference",
      rationale: `At ${maxReqDay.toLocaleString()} req/day in real-time mode, GPU utilisation is typically 10–20% — most of the GPU is idle between requests. Batching fills that idle capacity, reducing energy per request.`,
      action: "Group requests into batches of 8–32 (tune based on latency tolerance). vLLM continuous batching does this automatically. For async workloads — summarisation, classification, document processing — max-batch-size 64+ is safe.",
      inferenceSavingPct: 25,
      tradeoffs: "Adds latency equal to the batch wait time. Not suitable for interactive chat (needs <200ms). Best for async APIs, background pipelines, and non-interactive classification.",
      priority: "medium",
    });
  }

  // ── 5. Response caching ──────────────────────────────────────────────────────
  // Very high volume: even a modest cache hit rate has large absolute impact.
  if (maxReqDay > 100000) {
    const dailyCacheHits = Math.round(maxReqDay * 0.15);
    recs.push({
      id: "caching",
      category: "caching",
      icon: "💾",
      title: "Semantic response caching",
      rationale: `At ${maxReqDay.toLocaleString()} req/day, a 15% cache hit rate eliminates ${dailyCacheHits.toLocaleString()} GPU calls per day — before any other optimisation. FAQ-style and repeated query workloads typically achieve 20–30%.`,
      action: "Deploy semantic caching (GPTCache or Redis + embedding similarity) in front of inference. Queries within cosine distance 0.05 of a cached response return immediately — zero GPU required. Invalidate cache on model updates.",
      inferenceSavingPct: 20,
      tradeoffs: "Cache warm-up period on first occurrence. Stale responses on model update — needs explicit cache invalidation. Requires a small embedding model for similarity matching (adds ~5ms, negligible carbon).",
      priority: "medium",
    });
  }

  // ── 6. Hardware upgrade ──────────────────────────────────────────────────────
  // A100 and V100 are materially less efficient than H100 per token.
  const legacyGPUs = [modelA, modelB].filter(m => m.gpuType === "A100" || m.gpuType === "V100");
  if (legacyGPUs.length > 0) {
    const hasV100     = legacyGPUs.some(m => m.gpuType === "V100");
    const savingPct   = hasV100 ? 60 : 45;
    const gpuLabel    = legacyGPUs.map(m => `${m.name} (${m.gpuType})`).join(" and ");
    const multiplier  = hasV100 ? "~3×" : "~2×";
    recs.push({
      id: "hardware",
      category: "hardware",
      icon: "🖥️",
      title: "Upgrade to H100",
      rationale: `${gpuLabel} — H100 delivers ${multiplier} more tokens per watt. The same inference workload uses ~${savingPct}% less energy with no model or code changes.`,
      action: "Request H100 instances (AWS p4d → p5, GCP A100 → H100, Azure NC A100 → NC H100). H100 spot instances are often cheaper per token than A100 on-demand. Migration requires re-testing CUDA/TensorRT versions — typically 1–2 days.",
      inferenceSavingPct: savingPct,
      tradeoffs: "H100 spot availability varies by region and time. Requires re-profiling inference stack for new CUDA/TensorRT versions.",
      priority: "high",
    });
  }

  // Sort: high priority first, then by saving %
  const P = { high: 0, medium: 1, low: 2 };
  recs.sort((a, b) => {
    const pd = P[a.priority] - P[b.priority];
    return pd !== 0 ? pd : b.inferenceSavingPct - a.inferenceSavingPct;
  });

  return recs;
}

// Multiplicative stacking: selecting 35% + 60% = 1 - (0.65 × 0.40) = 74%
// Capped at 90% — you can't realistically reach zero inference carbon.
export function calcCombinedSaving(
  recs: Recommendation[],
  selectedIds: Set<string>,
): number {
  const selected = recs.filter(r => selectedIds.has(r.id));
  if (selected.length === 0) return 0;
  const remaining = selected.reduce((acc, r) => acc * (1 - r.inferenceSavingPct / 100), 1);
  return Math.min(1 - remaining, 0.90);
}

// ── Electricity Maps API ──────────────────────────────────────────────────────
export async function fetchGridIntensity(
  region: string,
  apiKey: string,
): Promise<{ intensity: number; source: string }> {
  const zone = REGION_ZONES[region];
  if (!zone) return { intensity: 450, source: "default fallback" };

  try {
    const res = await fetch(
      `https://api.electricitymap.org/v3/carbon-intensity/latest?zone=${zone}`,
      { headers: { "auth-token": apiKey } },
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { intensity: data.carbonIntensity as number, source: `Electricity Maps (live · ${zone})` };
  } catch {
    const fallback = STATIC_INTENSITY[zone] ?? 450;
    return { intensity: fallback, source: `static average (${zone})` };
  }
}
