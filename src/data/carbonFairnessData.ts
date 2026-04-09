// Carbon-Fairness Efficiency Frontier — data layer
// Generated from Google Colab notebook (2026-04-08)
// Source: Our World in Data 2023 carbon intensity · NVIDIA hardware benchmarks

export type Precision = "FP32" | "FP16" | "INT8" | "INT4";
export type ScenarioId = "loan" | "bail" | "hiring" | "content";

export interface Configuration {
  precision: Precision;
  label: string;
  color: string;
  carbonUg: number;       // µg CO₂e per inference
  dir: number;            // Disparate Impact Ratio
  euCompliant: boolean;   // DIR <= 1.25 (EU AI Act threshold)
  dailyKgCo2: number;
  annualTonnesCo2: number;
  carbonSavingPct: number; // % saving vs FP32
}

export interface Scenario {
  label: string;
  icon: string;
  dailyInferences: number;
  configurations: Configuration[];
}

export const CARBON_DATA: Record<ScenarioId, Scenario> = {
  loan: {
    label: "Loan Approval",
    icon: "🏦",
    dailyInferences: 500_000,
    configurations: [
      { precision: "FP32", label: "FP32 — Full precision",     color: "#6366f1", carbonUg: 908.0, dir: 1.00, euCompliant: true,  dailyKgCo2: 0.45,  annualTonnesCo2: 0.17,   carbonSavingPct: 0.0  },
      { precision: "FP16", label: "FP16 — Half precision",     color: "#22c55e", carbonUg: 500.0, dir: 1.15, euCompliant: true,  dailyKgCo2: 0.25,  annualTonnesCo2: 0.09,   carbonSavingPct: 44.9 },
      { precision: "INT8", label: "INT8 — Compressed",         color: "#f59e0b", carbonUg: 227.0, dir: 1.52, euCompliant: false, dailyKgCo2: 0.11,  annualTonnesCo2: 0.04,   carbonSavingPct: 75.0 },
      { precision: "INT4", label: "INT4 — Ultra-compressed",   color: "#ef4444", carbonUg: 136.0, dir: 1.89, euCompliant: false, dailyKgCo2: 0.07,  annualTonnesCo2: 0.02,   carbonSavingPct: 85.0 },
    ],
  },
  bail: {
    label: "Bail Risk Assessment",
    icon: "⚖️",
    dailyInferences: 1_000_000,
    configurations: [
      { precision: "FP32", label: "FP32 — Full precision",     color: "#6366f1", carbonUg: 908.0, dir: 1.00, euCompliant: true,  dailyKgCo2: 0.91,  annualTonnesCo2: 0.33,   carbonSavingPct: 0.0  },
      { precision: "FP16", label: "FP16 — Half precision",     color: "#22c55e", carbonUg: 500.0, dir: 1.18, euCompliant: true,  dailyKgCo2: 0.50,  annualTonnesCo2: 0.18,   carbonSavingPct: 44.9 },
      { precision: "INT8", label: "INT8 — Compressed",         color: "#f59e0b", carbonUg: 227.0, dir: 1.68, euCompliant: false, dailyKgCo2: 0.23,  annualTonnesCo2: 0.08,   carbonSavingPct: 75.0 },
      { precision: "INT4", label: "INT4 — Ultra-compressed",   color: "#ef4444", carbonUg: 136.0, dir: 2.12, euCompliant: false, dailyKgCo2: 0.14,  annualTonnesCo2: 0.05,   carbonSavingPct: 85.0 },
    ],
  },
  hiring: {
    label: "Hiring Screen",
    icon: "📋",
    dailyInferences: 200_000,
    configurations: [
      { precision: "FP32", label: "FP32 — Full precision",     color: "#6366f1", carbonUg: 908.0, dir: 1.00, euCompliant: true,  dailyKgCo2: 0.18,  annualTonnesCo2: 0.07,   carbonSavingPct: 0.0  },
      { precision: "FP16", label: "FP16 — Half precision",     color: "#22c55e", carbonUg: 500.0, dir: 1.22, euCompliant: true,  dailyKgCo2: 0.10,  annualTonnesCo2: 0.04,   carbonSavingPct: 44.9 },
      { precision: "INT8", label: "INT8 — Compressed",         color: "#f59e0b", carbonUg: 227.0, dir: 1.81, euCompliant: false, dailyKgCo2: 0.05,  annualTonnesCo2: 0.02,   carbonSavingPct: 75.0 },
      { precision: "INT4", label: "INT4 — Ultra-compressed",   color: "#ef4444", carbonUg: 136.0, dir: 2.41, euCompliant: false, dailyKgCo2: 0.03,  annualTonnesCo2: 0.01,   carbonSavingPct: 85.0 },
    ],
  },
  content: {
    label: "Content Recommendation",
    icon: "📱",
    dailyInferences: 1_000_000_000,
    configurations: [
      { precision: "FP32", label: "FP32 — Full precision",     color: "#6366f1", carbonUg: 908.0, dir: 1.00, euCompliant: true,  dailyKgCo2: 908.0,  annualTonnesCo2: 331.42, carbonSavingPct: 0.0  },
      { precision: "FP16", label: "FP16 — Half precision",     color: "#22c55e", carbonUg: 500.0, dir: 1.12, euCompliant: true,  dailyKgCo2: 500.0,  annualTonnesCo2: 182.5,  carbonSavingPct: 44.9 },
      { precision: "INT8", label: "INT8 — Compressed",         color: "#f59e0b", carbonUg: 227.0, dir: 1.38, euCompliant: false, dailyKgCo2: 227.0,  annualTonnesCo2: 82.86,  carbonSavingPct: 75.0 },
      { precision: "INT4", label: "INT4 — Ultra-compressed",   color: "#ef4444", carbonUg: 136.0, dir: 1.71, euCompliant: false, dailyKgCo2: 136.0,  annualTonnesCo2: 49.64,  carbonSavingPct: 85.0 },
    ],
  },
};

export const CARBON_INTENSITY_BY_REGION = [
  { region: "Norway (hydro)", intensityPerKwh: 29,   context: "Almost entirely hydroelectric — cleanest grid in the world" },
  { region: "EU average",     intensityPerKwh: 276,  context: "Improving with renewables push — solar and wind growing fast" },
  { region: "US average",     intensityPerKwh: 387,  context: "Mixed grid — coal, gas, nuclear, wind. Varies widely by state" },
  { region: "India",          intensityPerKwh: 713,  context: "Heavily coal-dependent. Hosts cheap data centres for Global North AI" },
  { region: "Global average", intensityPerKwh: 436,  context: "Baseline for region-agnostic estimates" },
];

export const EU_AI_ACT_THRESHOLD = 1.25;
export const DEFAULT_CARBON_TARGET_UG = 500;

export const MODEL_IMPL: Record<string, { short: string; detail: string }> = {
  FP32: {
    short: "Standard PyTorch / TensorFlow",
    detail: "Default training precision. Use when accuracy is non-negotiable and carbon budget is unconstrained. No special tooling needed.",
  },
  FP16: {
    short: "Half-precision GPU inference",
    detail: "Use torch.autocast() or ONNX FP16 export. Default on AWS, GCP, Azure hosted endpoints. Recommended starting point for production.",
  },
  INT8: {
    short: "Post-training quantisation",
    detail: "Via NVIDIA TensorRT, ONNX Runtime, or PyTorch Dynamic Quantisation. Best for high-volume CPU or edge deployments. Validate accuracy on full dataset first.",
  },
  INT4: {
    short: "GPTQ / AWQ quantisation",
    detail: "Currently recommended for large language models only. Experimental for classification — validate carefully before deploying in high-stakes contexts.",
  },
};
