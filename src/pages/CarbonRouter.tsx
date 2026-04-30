import { Link } from "react-router-dom";
import { useVisitLogger } from "@/hooks/useVisitLogger";
import { PageGate } from "@/components/ui/PageGate";

// ─── Static data ──────────────────────────────────────────────────────────────

const GAP_TABLE = [
  { tool: "Clover (SC'23)",        what: "Carbon-aware ML inference, accuracy/latency tradeoffs", missing: "Research prototype only. Not integrated into production serving. No real-time grid data." },
  { tool: "Green-LLM",             what: "Geographic workload shifting to low-carbon regions",    missing: "Infrastructure-level (which datacenter), not prompt-level (which model per request)." },
  { tool: "FrugalGPT / LLM-Blender", what: "Route by accuracy and cost",                         missing: "No carbon signal. No live grid data. Accuracy-only optimisation." },
  { tool: "Electricity Maps / WattTime", what: "Live grid carbon intensity data",                  missing: "Data provider only. No routing logic. No LLM integration." },
];

const COMPONENTS = [
  { name: "Complexity Scorer",  desc: "Classifies each prompt as simple / moderate / complex / expert. Features: token count, sentence depth, domain keywords, instruction count.", color: "text-sky-400 border-sky-500/30 bg-sky-500/5" },
  { name: "Carbon Feed",        desc: "Pulls live gCO2eq/kWh for the serving zone. 5-min cache. Falls back to 24hr rolling average if API unavailable.", color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/5" },
  { name: "Routing Engine",     desc: "Multi-objective decision: minimise carbon cost while meeting accuracy floor and staying within latency SLA.", color: "text-violet-400 border-violet-500/30 bg-violet-500/5" },
  { name: "Model Registry",     desc: "YAML config: model name, parameter count, TDP profile, tokens/sec, accuracy benchmarks, cost per 1K tokens.", color: "text-amber-400 border-amber-500/30 bg-amber-500/5" },
  { name: "Audit Logger",       desc: "Per-request structured log: prompt hash (no raw text), routed model, carbon saved, latency, accuracy proxy, routing reason.", color: "text-slate-400 border-slate-500/30 bg-slate-500/5" },
];

const PHASES = [
  {
    phase: "Phase 1",
    label: "Working Router",
    status: "Building",
    items: ["complexity_scorer.py — rule-based prompt classifier", "carbon_feed.py — Electricity Maps API + fallback", "routing_engine.py — multi-objective optimisation", "model_registry.yaml — 3 model configs (7B · 13B · 70B)", "router_api.py — FastAPI POST /route endpoint", "eval_sa1.py — accuracy proxy evaluation"],
  },
  {
    phase: "Phase 2",
    label: "Evaluation",
    status: "Upcoming",
    items: ["50-prompt benchmark dataset (5 complexity tiers, 3 domains)", "Accuracy comparison: routed vs always-large baseline", "Carbon savings report: gCO2eq saved per 1,000 prompts", "Latency overhead measurement (routing layer p50/p95)"],
  },
  {
    phase: "Phase 3",
    label: "Portfolio Page",
    status: "Upcoming",
    items: ["Live routing demo (pre-recorded)", "Benchmark chart + carbon savings calculator", "Full preetibuilds page with interactive visuals"],
  },
];

// ─── Preview content ──────────────────────────────────────────────────────────

const previewContent = (
  <div className="dark max-w-4xl mx-auto px-6 pt-10 pb-4 space-y-6 font-sans" style={{ background: '#0f172a', minHeight: '100%' }}>
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/30 rounded px-2 py-0.5">Building</span>
        <span className="text-xs text-slate-500 bg-slate-800/50 border border-slate-700/50 rounded px-2 py-0.5">EU AI Act Art.53</span>
        <span className="text-xs text-slate-500 bg-slate-800/50 border border-slate-700/50 rounded px-2 py-0.5">CSRD Scope 2</span>
        <span className="text-xs text-slate-500 bg-slate-800/50 border border-slate-700/50 rounded px-2 py-0.5">FastAPI · Electricity Maps · vLLM</span>
      </div>
      <h1 className="text-3xl font-bold text-white">Carbon-Aware LLM Inference Router</h1>
      <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">
        Route every LLM prompt to the right model size based on task complexity, live grid carbon intensity,
        latency budget, and accuracy floor — simultaneously. 65% of production prompts can run on a 7B model
        without measurable accuracy loss. This tool makes that allocation automatic.
      </p>
    </div>

    <div className="grid grid-cols-3 gap-4">
      {[
        { label: "Estimated carbon saving", value: "~62% reduction" },
        { label: "Routable prompt fraction", value: "65% of typical workloads" },
        { label: "Routing overhead target", value: "<10ms p99" },
      ].map(m => (
        <div key={m.label} className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4">
          <p className="text-xs text-slate-500 mb-1">{m.label}</p>
          <p className="text-sm font-semibold text-white">{m.value}</p>
        </div>
      ))}
    </div>

    {/* Gap table */}
    <div className="rounded-2xl border border-slate-700/50 bg-slate-800/20 p-5 space-y-3">
      <h2 className="text-sm font-semibold text-white">The Unowned Gap</h2>
      <p className="text-xs text-slate-400">What exists — and what none of them do.</p>
      <div className="space-y-2">
        {GAP_TABLE.map(r => (
          <div key={r.tool} className="grid grid-cols-[160px_1fr] gap-3 rounded-lg bg-slate-900/40 p-3">
            <div>
              <p className="text-xs font-mono font-semibold text-slate-300">{r.tool}</p>
              <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{r.what}</p>
            </div>
            <div className="border-l border-slate-700/40 pl-3">
              <p className="text-[10px] text-amber-400/80 leading-snug">{r.missing}</p>
            </div>
          </div>
        ))}
        <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-3">
          <p className="text-xs font-semibold text-blue-400">SA1 — the missing combination</p>
          <p className="text-[10px] text-slate-300 mt-1 leading-snug">Per-prompt complexity scoring + real-time grid carbon intensity + production serving integration + multi-objective routing (carbon × accuracy × latency) — in one open tool.</p>
        </div>
      </div>
    </div>
  </div>
);

// ─── Main page content ────────────────────────────────────────────────────────

function CarbonRouterContent() {
  useVisitLogger("/carbon-router");

  return (
    <div className="dark min-h-screen font-sans" style={{ background: '#0f172a', color: '#f1f5f9' }}>
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">

        <Link to="/#projects" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors font-medium">
          ← Back to Portfolio
        </Link>

        {/* Header */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/30 rounded px-2 py-0.5">Building — Phase 1</span>
            <span className="text-xs text-slate-500 bg-slate-800/50 border border-slate-700/50 rounded px-2 py-0.5">EU AI Act Art.53</span>
            <span className="text-xs text-slate-500 bg-slate-800/50 border border-slate-700/50 rounded px-2 py-0.5">CSRD Scope 2</span>
            <span className="text-xs text-slate-500 bg-slate-800/50 border border-slate-700/50 rounded px-2 py-0.5">FastAPI · Electricity Maps · vLLM · MLflow</span>
          </div>
          <h1 className="text-4xl font-bold text-white">Carbon-Aware LLM Inference Router</h1>
          <p className="text-slate-400 max-w-2xl text-base leading-relaxed">
            Route every LLM prompt to the right model size based on task complexity, live grid carbon intensity,
            latency budget, and accuracy floor — simultaneously. Inference now accounts for 60–90% of LLM lifecycle
            energy. Routing is the only intervention that reduces it without retraining or replacing models.
          </p>
        </div>

        {/* Key numbers */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Estimated carbon reduction", value: "~62%", note: "On a 1M prompt/day system routing 65% to 7B" },
            { label: "Routing overhead target", value: "<10ms p99", note: "Complexity scoring + carbon feed, locally cached" },
            { label: "Routable prompt fraction", value: "~65%", note: "Simple/moderate tasks — no measurable accuracy loss" },
          ].map(m => (
            <div key={m.label} className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4 space-y-1">
              <p className="text-xs text-slate-500">{m.label}</p>
              <p className="text-2xl font-bold text-white">{m.value}</p>
              <p className="text-[10px] text-slate-500">{m.note}</p>
            </div>
          ))}
        </div>

        {/* The gap */}
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/20 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white">The Unowned Gap</h2>
          <p className="text-xs text-slate-400 max-w-2xl">No existing tool combines per-prompt routing + real-time grid data + production serving integration. This is what's missing:</p>
          <div className="space-y-2">
            {GAP_TABLE.map(r => (
              <div key={r.tool} className="grid md:grid-cols-[180px_1fr_1fr] gap-3 rounded-lg bg-slate-900/40 p-3">
                <p className="text-xs font-mono font-semibold text-slate-300 self-center">{r.tool}</p>
                <p className="text-xs text-slate-400 leading-snug">{r.what}</p>
                <p className="text-xs text-amber-400/80 leading-snug border-l border-slate-700/40 pl-3">{r.missing}</p>
              </div>
            ))}
            <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-3">
              <p className="text-xs font-semibold text-blue-400 mb-1">SA1 — the missing combination</p>
              <p className="text-xs text-slate-300 leading-relaxed">Per-prompt complexity scoring + real-time grid carbon intensity + production serving integration (vLLM/Ollama) + multi-objective routing (carbon × accuracy × latency) in one open tool. Concept date: 2026-04-30.</p>
            </div>
          </div>
        </div>

        {/* Architecture */}
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/20 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white">Architecture — 5 Components</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {COMPONENTS.map(c => (
              <div key={c.name} className={`rounded-xl border p-4 space-y-1.5 ${c.color}`}>
                <p className="text-sm font-semibold">{c.name}</p>
                <p className="text-xs text-slate-400 leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
          <div className="rounded-lg bg-slate-900/60 p-4 font-mono text-xs text-slate-400 leading-relaxed space-y-1">
            <p>incoming prompt</p>
            <p className="pl-4">→ Complexity Scorer  <span className="text-slate-500">(&lt;5ms, local)</span></p>
            <p className="pl-4">→ Carbon Feed        <span className="text-slate-500">(cached, &lt;1ms)</span></p>
            <p className="pl-4">→ Routing Engine     <span className="text-slate-500">(&lt;2ms)</span></p>
            <p className="pl-4">→ model endpoint     <span className="text-slate-500">(7B / 13B / 70B)</span></p>
            <p className="pl-4">→ Audit Logger       <span className="text-slate-500">(per-request JSON)</span></p>
            <p className="text-blue-400/70 mt-1">Total routing overhead target: &lt;10ms p99</p>
          </div>
        </div>

        {/* Routing logic */}
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/20 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-white">Routing Logic — Plain English</h2>
          <ol className="space-y-3 text-xs text-slate-400 leading-relaxed list-none">
            {[
              ["Score the prompt's complexity.", "A one-sentence summarisation scores ~0.2. A multi-hop legal reasoning task scores ~0.85."],
              ["Read the current grid carbon intensity.", "If the grid is dirty (high gCO2eq/kWh), prefer a smaller model even at marginal accuracy cost."],
              ["Check the latency SLA.", "If a response is needed in <500ms, that caps the model size regardless of carbon signal."],
              ["Check the accuracy floor.", "If the task requires >95% accuracy, the router cannot route below that benchmark."],
              ["Route to the model that satisfies all constraints with the lowest carbon cost.", ""],
            ].map(([bold, rest], i) => (
              <li key={i} className="flex gap-3">
                <span className="text-slate-600 font-mono shrink-0">{i + 1}.</span>
                <span><span className="text-white font-medium">{bold}</span>{rest ? ` ${rest}` : ""}</span>
              </li>
            ))}
          </ol>
          <div className="rounded-lg bg-slate-900/40 p-3 mt-2">
            <p className="text-xs text-slate-400 italic">Routing is not degradation. 60–70% of real production prompts are structurally simple. Routing them to a 7B model is correct allocation, not a quality compromise.</p>
          </div>
        </div>

        {/* Phases */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-white">Build Roadmap</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {PHASES.map(p => (
              <div key={p.phase} className={`rounded-xl border p-4 space-y-3 ${p.status === "Building" ? "border-blue-500/40 bg-blue-500/5" : "border-slate-700/50 bg-slate-800/20"}`}>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-mono text-slate-500">{p.phase}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${p.status === "Building" ? "text-blue-400 bg-blue-500/10 border-blue-500/30" : "text-slate-500 bg-slate-800/50 border-slate-700/50"}`}>
                    {p.status}
                  </span>
                </div>
                <p className="text-sm font-semibold text-white">{p.label}</p>
                <ul className="space-y-1">
                  {p.items.map(item => (
                    <li key={item} className="text-[10px] text-slate-400 flex gap-2">
                      <span className="text-slate-600 shrink-0">{p.status === "Building" ? "○" : "—"}</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Governance angle */}
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/20 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-white">Why This Matters Beyond Carbon</h2>
          <div className="grid md:grid-cols-3 gap-4 text-xs text-slate-400">
            <div className="space-y-1">
              <p className="text-white font-medium">Regulatory angle</p>
              <p>EU AI Act Art.53 requires GPAI providers to report energy consumption. CSRD Scope 2 emissions include server energy. SA1 provides both the routing mechanism and the audit trail to report on it.</p>
            </div>
            <div className="space-y-1">
              <p className="text-white font-medium">Cost angle</p>
              <p>The same routing layer that reduces carbon also reduces cost. A system routing 65% of prompts to a 7B model saves ~10× on those API calls. Carbon-awareness and cost-awareness align exactly.</p>
            </div>
            <div className="space-y-1">
              <p className="text-white font-medium">Safety angle</p>
              <p>Connects to AC1 (agent drift detector) — a carbon-aware agent runtime would use this router as a tool call. Sustainability and safety share the same infrastructure layer in agentic systems.</p>
            </div>
          </div>
        </div>

        <div className="pt-2 pb-8">
          <a
            href="https://github.com/pretzelslab/sa1-carbon-inference-router"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors border border-slate-700 hover:border-slate-500 rounded-lg px-4 py-2"
          >
            View design doc on GitHub →
          </a>
        </div>

      </div>
    </div>
  );
}

// ─── Export with PageGate ─────────────────────────────────────────────────────

export default function CarbonRouter() {
  return (
    <PageGate code="SAR2026" previewContent={previewContent}>
      <CarbonRouterContent />
    </PageGate>
  );
}
