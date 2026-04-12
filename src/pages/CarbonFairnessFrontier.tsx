import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Leaf, AlertTriangle, CheckCircle2, Globe, Zap } from "lucide-react";
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  ReferenceLine, ReferenceArea, ResponsiveContainer, Tooltip,
} from "recharts";
import { PageGate } from "@/components/ui/PageGate";
import { DiagonalWatermark } from "@/components/ui/DiagonalWatermark";
import { useVisitLogger } from "@/hooks/useVisitLogger";
import {
  CARBON_DATA, CARBON_INTENSITY_BY_REGION, EU_AI_ACT_THRESHOLD,
  DEFAULT_CARBON_TARGET_UG, MODEL_IMPL,
} from "@/data/carbonFairnessData";
import type { ScenarioId, Configuration } from "@/data/carbonFairnessData";

// ── Dot shape ─────────────────────────────────────────────────────────────────
const PrecisionDot = (props: Record<string, unknown>) => {
  const { cx, cy, payload } = props as {
    cx: number; cy: number;
    payload: Configuration & { x: number; y: number };
  };
  if (!cx || !cy || !payload?.precision) return <g />;
  return (
    <g style={{ cursor: "default" }}>
      <circle cx={cx} cy={cy} r={20} fill={payload.color} opacity={0.12} />
      <circle
        cx={cx} cy={cy} r={13}
        fill={payload.color}
        stroke={payload.euCompliant ? "rgba(255,255,255,0.6)" : "#ef4444"}
        strokeWidth={payload.euCompliant ? 1.5 : 2.5}
      />
      <text x={cx} y={cy + 4} textAnchor="middle" fill="white" fontSize={8} fontWeight={700}>
        {payload.precision}
      </text>
    </g>
  );
};

// ── Tooltip ───────────────────────────────────────────────────────────────────
const DotTooltip = ({ active, payload }: {
  active?: boolean;
  payload?: Array<{ payload: Configuration & { x: number; y: number } }>;
}) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  if (!d.precision) return null; // frontier line — skip
  const rows = [
    { label: "Carbon / inference",     value: `${d.carbonUg.toLocaleString()} µg CO₂e` },
    { label: "Carbon saving vs FP32",  value: `${d.carbonSavingPct}%` },
    { label: "Annual CO₂ at scale",    value: `${d.annualTonnesCo2.toLocaleString()} t` },
    { label: "Disparate Impact Ratio", value: `${d.dir.toFixed(2)}×`, warn: d.dir > EU_AI_ACT_THRESHOLD },
    { label: "EU AI Act",              value: d.euCompliant ? "✓ Compliant" : "✗ Breach", warn: !d.euCompliant, good: d.euCompliant },
  ];
  return (
    <div className="bg-background border border-border rounded-xl p-3 shadow-xl text-xs w-58">
      <div className="flex items-center gap-2 mb-2.5">
        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: d.color }} />
        <span className="font-bold">{d.label}</span>
      </div>
      <div className="space-y-1.5">
        {rows.map(r => (
          <div key={r.label} className="flex justify-between gap-4">
            <span className="text-muted-foreground">{r.label}</span>
            <span className={r.warn ? "text-rose-500 font-semibold" : r.good ? "text-emerald-600 font-semibold" : "font-medium"}>
              {r.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Frontier chart ────────────────────────────────────────────────────────────
function FrontierChart({ configs, carbonTarget }: {
  configs: Configuration[];
  carbonTarget: number;
}) {
  const dots = configs.map(c => ({ x: c.carbonUg, y: c.dir, ...c }));
  const frontierLine = [...dots].sort((a, b) => a.x - b.x);

  return (
    <ResponsiveContainer width="100%" height={340}>
      <ScatterChart margin={{ top: 24, right: 24, bottom: 44, left: 16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" />

        {/* Safe zone — low carbon AND fair */}
        <ReferenceArea
          x1={0} x2={carbonTarget}
          y1={0.75} y2={EU_AI_ACT_THRESHOLD}
          fill="#22c55e" fillOpacity={0.07}
          stroke="none"
        />

        {/* EU AI Act fairness threshold */}
        <ReferenceLine
          y={EU_AI_ACT_THRESHOLD}
          stroke="#ef4444" strokeDasharray="6 3" strokeWidth={1.5}
          label={{ value: "EU AI Act limit (1.25×)", position: "insideTopRight", fill: "#ef4444", fontSize: 10 }}
        />

        {/* User's carbon target */}
        <ReferenceLine
          x={carbonTarget}
          stroke="#22c55e" strokeDasharray="6 3" strokeWidth={1.5}
          label={{ value: `Target: ${carbonTarget}µg`, position: "top", fill: "#22c55e", fontSize: 10 }}
        />

        {/* Pareto frontier line — invisible dots, just the line */}
        <Scatter
          data={frontierLine}
          line={{ stroke: "#64748b", strokeDasharray: "4 2", strokeWidth: 1.5 }}
          shape={(p: Record<string, unknown>) => {
            const { cx, cy } = p as { cx: number; cy: number };
            return <circle cx={cx} cy={cy} r={0} fill="none" />;
          }}
          legendType="none"
          isAnimationActive={false}
        />

        {/* Precision dots */}
        <Scatter data={dots} shape={PrecisionDot} isAnimationActive={false} />

        <XAxis
          dataKey="x" type="number"
          domain={[50, 1050]}
          tick={{ fontSize: 10, fill: "rgba(148,163,184,0.7)" }}
          label={{ value: "Carbon per inference (µg CO₂e)  →  lower is greener", position: "insideBottom", offset: -12, style: { fontSize: 10, fill: "rgba(148,163,184,0.6)" } }}
        />
        <YAxis
          dataKey="y" type="number"
          domain={[0.75, 2.75]}
          tickFormatter={(v) => `${v.toFixed(1)}×`}
          tick={{ fontSize: 10, fill: "rgba(148,163,184,0.7)" }}
          label={{ value: "Disparate Impact Ratio  →  lower is fairer", angle: -90, position: "insideLeft", offset: 14, style: { fontSize: 10, fill: "rgba(148,163,184,0.6)" } }}
        />
        <Tooltip content={<DotTooltip />} cursor={false} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

// ── Verdict panel ─────────────────────────────────────────────────────────────
function VerdictPanel({ configs, carbonTarget, dailyInferences }: {
  configs: Configuration[];
  carbonTarget: number;
  dailyInferences: number;
}) {
  const fp32 = configs.find(c => c.precision === "FP32")!;
  const recommended = configs
    .filter(c => c.euCompliant && c.carbonUg <= carbonTarget)
    .sort((a, b) => a.carbonUg - b.carbonUg)[0] ?? null;

  if (!recommended) {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-5 h-full flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
          <span className="font-semibold text-rose-500 text-sm">No compliant configuration found</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          At your current carbon target of <strong>{carbonTarget} µg/inference</strong>, no
          configuration passes the EU AI Act fairness threshold (1.25× DIR) and stays within budget.
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Raise your carbon target to at least <strong>500 µg/inference</strong> to unlock FP16 — the
          only configuration that is both green and legally compliant.
        </p>
        <div className="mt-auto rounded-lg bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground">
          This is the core tradeoff: below this threshold, fairness cannot be guaranteed.
        </div>
      </div>
    );
  }

  const annualSaved = fp32.annualTonnesCo2 - recommended.annualTonnesCo2;
  const impl = MODEL_IMPL[recommended.precision];
  const scaleLabel = dailyInferences >= 1_000_000_000
    ? `${(dailyInferences / 1_000_000_000).toFixed(0)}B inferences/day`
    : dailyInferences >= 1_000_000
    ? `${(dailyInferences / 1_000_000).toFixed(0)}M inferences/day`
    : `${(dailyInferences / 1_000).toFixed(0)}K inferences/day`;

  return (
    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
        <span className="font-semibold text-emerald-500 text-sm">Recommended configuration</span>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold" style={{ color: recommended.color }}>
          {recommended.precision}
        </span>
        <span className="text-sm text-muted-foreground">{recommended.label.split("—")[1]?.trim()}</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Carbon saving", value: `${recommended.carbonSavingPct}%`, sub: "vs FP32 (uncompressed)", color: "text-emerald-500" },
          { label: "Annual CO₂", value: `${recommended.annualTonnesCo2} t`, sub: `at ${scaleLabel}`, color: "" },
          { label: "CO₂ saved / year", value: `${annualSaved.toFixed(1)} t`, sub: "vs keeping FP32", color: "text-emerald-500" },
          { label: "Fairness (DIR)", value: `${recommended.dir.toFixed(2)}×`, sub: "below 1.25× threshold", color: "text-emerald-500" },
        ].map(m => (
          <div key={m.label} className="rounded-lg bg-muted/30 px-3 py-2.5">
            <p className="text-[10px] text-muted-foreground mb-0.5">{m.label}</p>
            <p className={`text-lg font-bold ${m.color}`}>{m.value}</p>
            <p className="text-[10px] text-muted-foreground">{m.sub}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">How to implement</p>
        <p className="text-xs font-semibold mb-1">{impl.short}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{impl.detail}</p>
      </div>

      <div className="rounded-lg bg-muted/20 px-3 py-2.5 text-xs text-muted-foreground leading-relaxed">
        <strong className="text-foreground">EU AI Act check:</strong> DIR of {recommended.dir.toFixed(2)}× is below the 1.25× legal
        threshold. This configuration is compliant for high-risk AI use cases under Title III of the EU AI Act.
      </div>
    </div>
  );
}

// ── Who Pays panel ────────────────────────────────────────────────────────────
function WhoPaysPanel({ configs }: { configs: Configuration[] }) {
  const fp16 = configs.find(c => c.precision === "FP16")!;
  const fp32 = configs.find(c => c.precision === "FP32")!;

  return (
    <div className="rounded-xl border border-border/60 bg-muted/10 p-6 mt-6">
      <div className="flex items-center gap-2 mb-1">
        <Globe className="w-4 h-4 text-muted-foreground" />
        <h3 className="font-semibold text-sm">Who pays the climate cost?</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-5 leading-relaxed max-w-2xl">
        AI inference serving Global North users is often run in lower-cost data centres in regions
        with coal-heavy grids. The carbon cost falls on communities that did not generate the demand.
      </p>

      <div className="grid grid-cols-5 gap-3 mb-5">
        {CARBON_INTENSITY_BY_REGION.map(r => {
          const max = 713;
          const pct = Math.round((r.intensityPerKwh / max) * 100);
          const isHigh = r.intensityPerKwh > 400;
          return (
            <div key={r.region} className={`rounded-lg border p-3 ${isHigh ? "border-rose-500/30 bg-rose-500/5" : "border-border/50 bg-muted/20"}`}>
              <p className="text-[10px] text-muted-foreground mb-1 leading-tight">{r.region}</p>
              <p className={`text-xl font-bold mb-1 ${isHigh ? "text-rose-500" : "text-foreground"}`}>
                {r.intensityPerKwh}
              </p>
              <p className="text-[9px] text-muted-foreground">gCO₂e/kWh</p>
              <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full ${isHigh ? "bg-rose-500" : "bg-emerald-500"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-[9px] text-muted-foreground mt-1.5 leading-tight">{r.context}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg bg-muted/20 border border-border/40 p-4 text-xs leading-relaxed text-muted-foreground">
          <p className="font-semibold text-foreground mb-1.5">The equity gap</p>
          A US streaming platform running {fp32.dailyKgCo2 > 100 ? `${fp32.annualTonnesCo2.toFixed(0)} tonnes/year` : "daily inference"} of
          FP32 recommendations in an Indian data centre (713 gCO₂e/kWh) burns{" "}
          <strong>{Math.round(fp32.annualTonnesCo2 * (713 / 436))} tonnes CO₂</strong> annually —
          24× more than if run in Norway. The platform's users are in the US. The climate burden is in India.
        </div>
        <div className="rounded-lg bg-muted/20 border border-border/40 p-4 text-xs leading-relaxed text-muted-foreground">
          <p className="font-semibold text-foreground mb-1.5">The FP16 case</p>
          Switching to FP16 cuts inference carbon by 44.9% and stays EU AI Act compliant.
          At the same Indian data centre, that is{" "}
          <strong>{Math.round(fp16.annualTonnesCo2 * (713 / 436))} tonnes/year</strong> instead of{" "}
          {Math.round(fp32.annualTonnesCo2 * (713 / 436))} — without crossing the legal fairness
          threshold. Green and fair is achievable at FP16.
        </div>
      </div>
    </div>
  );
}

// ── Static preview (shown behind PageGate) ────────────────────────────────────
function CarbonPreview() {
  const configs = CARBON_DATA.content.configurations;
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-10 z-40 bg-background/95 backdrop-blur border-b border-border/40">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link to="/#projects" className="text-xs text-muted-foreground hover:text-foreground transition-colors">← Back to Portfolio</Link>
          <span className="text-xs font-mono text-emerald-600">Preview</span>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-6 py-12">

        {/* Title */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <h1 className="text-2xl font-bold">Carbon-Fairness Efficiency Frontier</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Preview</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
            When you compress an AI model to save energy, minority groups are harmed more.
            This tool makes the tradeoff visible — carbon cost vs. fairness impact, on the same chart.
          </p>
        </div>

        {/* Scenario tabs — static */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {[
            { label: "🏦 Loan Approval", active: false },
            { label: "⚖️ Bail Risk Assessment", active: false },
            { label: "📋 Hiring Screen", active: false },
            { label: "📱 Content Recommendation", active: true },
          ].map(s => (
            <span key={s.label} className={`text-xs px-4 py-2 rounded-xl border font-medium ${s.active ? "bg-foreground text-background border-foreground" : "border-border/60 text-muted-foreground"}`}>
              {s.label}
            </span>
          ))}
        </div>

        {/* Precision cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {configs.map(c => (
            <div key={c.precision} className={`rounded-xl border p-4 ${!c.euCompliant ? "border-rose-500/30 bg-rose-500/5" : "border-emerald-500/30 bg-emerald-500/5"}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full" style={{ background: c.color }} />
                <span className="text-xs font-bold">{c.precision}</span>
              </div>
              <p className="text-lg font-bold">{c.carbonUg} µg</p>
              <p className="text-[10px] text-muted-foreground">CO₂e / inference</p>
              <p className={`text-sm font-bold mt-2 ${c.dir > EU_AI_ACT_THRESHOLD ? "text-rose-500" : "text-emerald-600"}`}>
                DIR {c.dir.toFixed(2)}×
              </p>
              <p className={`text-[10px] ${c.euCompliant ? "text-emerald-600" : "text-rose-500"}`}>
                {c.euCompliant ? "✓ EU compliant" : "✗ Breach"}
              </p>
            </div>
          ))}
        </div>

        {/* Blurred chart mock */}
        <div className="relative rounded-xl border border-border/60 overflow-hidden mb-6">
          <div className="bg-muted/10 px-5 py-4">
            <p className="text-xs font-semibold mb-1">Carbon vs. Fairness — Efficiency Frontier</p>
            <p className="text-[10px] text-muted-foreground mb-4">Each dot = one precision level. Red border = EU AI Act breach.</p>
            <div className="blur-sm space-y-3">
              <div className="h-52 rounded bg-muted/30 flex items-center justify-center">
                <div className="w-full h-full relative p-4">
                  <div className="absolute top-8 left-16 w-10 h-10 rounded-full bg-emerald-500/40" />
                  <div className="absolute top-16 left-28 w-10 h-10 rounded-full bg-blue-500/40" />
                  <div className="absolute bottom-12 right-20 w-10 h-10 rounded-full bg-amber-500/40" />
                  <div className="absolute bottom-8 right-8 w-10 h-10 rounded-full bg-rose-500/40" />
                  <div className="absolute inset-0 border-b border-l border-border/40 m-4" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="h-12 rounded bg-muted/30" />
                <div className="h-12 rounded bg-muted/30" />
              </div>
            </div>
          </div>
          <DiagonalWatermark />
        </div>

        {/* Key finding */}
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs text-muted-foreground">
          <strong className="text-foreground">Key finding:</strong> FP16 is the only configuration that saves significant carbon
          (44.9%) while staying below the EU AI Act 1.25× fairness threshold — across all 4 scenarios.
          INT8 saves 75% carbon but is legally non-compliant everywhere.
        </div>

      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function CarbonFairnessFrontier() {
  useVisitLogger("/carbon-fairness");
  const [scenario, setScenario] = useState<ScenarioId>("content");
  const [carbonTarget, setCarbonTarget] = useState(DEFAULT_CARBON_TARGET_UG);

  const sc = CARBON_DATA[scenario];
  const configs = sc.configurations;

  const SCENARIOS: Array<{ id: ScenarioId; label: string; icon: string }> = [
    { id: "loan",    label: "Loan Approval",          icon: "🏦" },
    { id: "bail",    label: "Bail Risk Assessment",    icon: "⚖️" },
    { id: "hiring",  label: "Hiring Screen",           icon: "📋" },
    { id: "content", label: "Content Recommendation", icon: "📱" },
  ];

  return (
    <PageGate backTo="/#projects" previewContent={<CarbonPreview />}>
      <div className="min-h-screen bg-background relative">
        <DiagonalWatermark />

        {/* Nav */}
        <nav className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur-md border-border/50">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <Link to="/#projects" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Portfolio
            </Link>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-6 py-10">

          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-medium mb-3">
              <Leaf className="w-3 h-3" /> Sustainable AI · Novel research tool
            </div>
            <h1 className="text-3xl font-bold mb-2">Carbon-Fairness Efficiency Frontier</h1>
            <p className="text-muted-foreground max-w-2xl leading-relaxed">
              Every AI model compression decision is a hidden fairness tradeoff. This tool makes it visible:
              as you shrink a model to reduce its carbon footprint, minority groups are systematically
              harmed more. No existing tool plots both dimensions simultaneously.
            </p>
          </div>

          {/* Scenario selector */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {SCENARIOS.map(s => (
              <button
                key={s.id}
                onClick={() => setScenario(s.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                  scenario === s.id
                    ? "bg-foreground text-background border-foreground"
                    : "border-border/60 text-muted-foreground hover:text-foreground hover:border-foreground/40"
                }`}
              >
                {s.icon} {s.label}
              </button>
            ))}
            <div className="ml-auto text-xs text-muted-foreground self-center">
              {(sc.dailyInferences / 1_000_000).toFixed(0)}M inferences / day
            </div>
          </div>

          {/* Chart + Verdict */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 mb-2">

            {/* Left: chart + slider */}
            <div className="rounded-xl border border-border/60 bg-muted/5 p-5">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-muted-foreground" />
                <h2 className="font-semibold text-sm">Efficiency Frontier</h2>
                <span className="ml-auto text-[10px] text-muted-foreground">
                  Green zone = low carbon AND fair · Hover dots for detail
                </span>
              </div>

              <FrontierChart configs={configs} carbonTarget={carbonTarget} />

              {/* Carbon target slider */}
              <div className="mt-4 px-2">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs text-muted-foreground">
                    Carbon target: <strong className="text-foreground">{carbonTarget} µg CO₂e / inference</strong>
                  </label>
                  <span className="text-[10px] text-muted-foreground">drag to move the green line</span>
                </div>
                <input
                  type="range"
                  min={100} max={1000} step={10}
                  value={carbonTarget}
                  onChange={e => setCarbonTarget(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>100 µg (INT4)</span>
                  <span>500 µg (FP16)</span>
                  <span>1000 µg (FP32)</span>
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-border/40">
                {configs.map(c => (
                  <div key={c.precision} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ background: c.color }} />
                    <span className="text-[10px] text-muted-foreground">{c.precision}</span>
                    {!c.euCompliant && <span className="text-[10px] text-rose-500">✗</span>}
                  </div>
                ))}
                <div className="flex items-center gap-1.5 ml-2">
                  <div className="w-6 border-t border-dashed border-slate-500" />
                  <span className="text-[10px] text-muted-foreground">Pareto frontier</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/40" />
                  <span className="text-[10px] text-muted-foreground">Safe zone</span>
                </div>
              </div>
            </div>

            {/* Right: verdict */}
            <VerdictPanel
              configs={configs}
              carbonTarget={carbonTarget}
              dailyInferences={sc.dailyInferences}
            />
          </div>

          {/* Methodology note */}
          <p className="text-[11px] text-muted-foreground/60 mt-3 mb-0 leading-relaxed">
            Carbon values: baseline 150W FP32 inference on A100 GPU slice × 50ms × regional grid intensity (Our World in Data 2023).
            Energy scaling: FP16 = 55%, INT8 = 25%, INT4 = 15% of FP32 (NVIDIA hardware benchmarks).
            DIR values: calibrated from Quantization Fairness Auditor simulation distributions (see{" "}
            <Link to="/algorithmic-fairness" className="underline hover:text-muted-foreground">Algorithmic Fairness Auditor</Link>).
          </p>

          {/* Who Pays */}
          <WhoPaysPanel configs={configs} />
        </div>
      </div>
    </PageGate>
  );
}
