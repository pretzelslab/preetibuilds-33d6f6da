// ── Carbon Depth — Custom Data Manager ───────────────────────────────────────
// Stores user-added GPUs and regions in localStorage on top of the static
// defaults in carbonDepthData.ts. The calculator reads from the merged set.
// Nothing here requires a backend — all client-side, persists per browser.

import {
  GPU_PRESETS,
  REGION_ZONES,
  STATIC_INTENSITY,
} from "@/data/carbonDepthData";

const LS_KEY_GPUS    = "carbon_custom_gpus";
const LS_KEY_REGIONS = "carbon_custom_regions";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CustomGPU {
  name: string;       // display name, e.g. "H200"
  tdpWatts: number;   // thermal design power in watts
  source: string;     // where the number came from, e.g. "NVIDIA datasheet 2024"
}

export interface CustomRegion {
  label: string;        // dropdown label, e.g. "me-south-1 (Bahrain)"
  zoneId: string;       // Electricity Maps zone code, e.g. "BH"
  intensityGCO2: number; // gCO₂/kWh annual average
  source: string;       // e.g. "Electricity Maps 2024" or "IEA Gulf states"
}

// ── Read / write localStorage ─────────────────────────────────────────────────

function safeRead<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeWrite(key: string, value: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

export function getCustomGPUs(): CustomGPU[] {
  return safeRead<CustomGPU[]>(LS_KEY_GPUS, []);
}

export function saveCustomGPUs(gpus: CustomGPU[]): void {
  safeWrite(LS_KEY_GPUS, gpus);
}

export function getCustomRegions(): CustomRegion[] {
  return safeRead<CustomRegion[]>(LS_KEY_REGIONS, []);
}

export function saveCustomRegions(regions: CustomRegion[]): void {
  safeWrite(LS_KEY_REGIONS, regions);
}

// ── Merged getters — used by the calculator ───────────────────────────────────

/** GPU name → TDP watts. Static presets + any user-added entries. */
export function getEffectiveGPUPresets(): Record<string, number> {
  const custom = getCustomGPUs();
  const extras = Object.fromEntries(custom.map(g => [g.name, g.tdpWatts]));
  return { ...GPU_PRESETS, ...extras };
}

/** Region label → zone ID. Static + user-added. */
export function getEffectiveRegionZones(): Record<string, string> {
  const custom = getCustomRegions();
  const extras = Object.fromEntries(custom.map(r => [r.label, r.zoneId]));
  return { ...REGION_ZONES, ...extras };
}

/** Zone ID → gCO₂/kWh. Static + user-added. */
export function getEffectiveStaticIntensity(): Record<string, number> {
  const custom = getCustomRegions();
  const extras = Object.fromEntries(custom.map(r => [r.zoneId, r.intensityGCO2]));
  return { ...STATIC_INTENSITY, ...extras };
}

// ── Export helpers — generate code snippets for permanent addition ─────────────

export function exportGPUSnippet(): string {
  const all = getEffectiveGPUPresets();
  const lines = Object.entries(all)
    .map(([name, tdp]) => `  "${name}": ${tdp},`)
    .join("\n");
  return `export const GPU_PRESETS: Record<string, number> = {\n${lines}\n};`;
}

export function exportRegionSnippet(): string {
  const zones = getEffectiveRegionZones();
  const intensity = getEffectiveStaticIntensity();

  const zoneLines = Object.entries(zones)
    .map(([label, zone]) => `  "${label}": "${zone}",`)
    .join("\n");

  const intensityLines = Object.entries(intensity)
    .map(([zone, val]) => `  "${zone}": ${val},`)
    .join("\n");

  return (
    `export const REGION_ZONES: Record<string, string> = {\n${zoneLines}\n};\n\n` +
    `export const STATIC_INTENSITY: Record<string, number> = {\n${intensityLines}\n};`
  );
}
