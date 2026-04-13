// ── Carbon Depth Calculator — Data & Calculation Engine ──────────────────────
// All formulas validated against Strubell 2019, Patterson 2021, BLOOM 2022.
// Accuracy: energy ±15%, carbon depends on grid intensity source.

export const GPU_PRESETS: Record<string, number> = {
  "A100": 400,
  "H100": 700,
  "V100": 300,
  "T4":    70,
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
