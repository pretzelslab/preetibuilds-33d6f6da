import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Legend,
} from "recharts";
import { PageGate } from "@/components/ui/PageGate";
import { DiagonalWatermark } from "@/components/ui/DiagonalWatermark";

// ── Audit math ────────────────────────────────────────────────────

function quantize(scores: number[]): number[] {
  const max = Math.max(...scores.map(Math.abs));
  const scale = 127 / max;
  return scores.map(s => Math.round(s * scale) / scale);
}

interface AuditResult {
  rateA: number; rateB: number;
  flipsA: number; flipsB: number;
  dir: number; cohensD: number;
  nA: number; nB: number;
  labelA: string; labelB: string;
}

function runAudit(
  groupA: number[], groupB: number[],
  threshold: number,
  labelA = "Majority", labelB = "Minority"
): AuditResult {
  const qA = quantize(groupA);
  const qB = quantize(groupB);
  const flipsA = groupA.filter((v, i) => (v >= threshold) !== (qA[i] >= threshold)).length;
  const flipsB = groupB.filter((v, i) => (v >= threshold) !== (qB[i] >= threshold)).length;
  const rateA = flipsA / groupA.length;
  const rateB = flipsB / groupB.length;
  const dir = rateB / Math.max(rateA, 0.001);
  const errA = groupA.map((v, i) => Math.abs(v - qA[i]));
  const errB = groupB.map((v, i) => Math.abs(v - qB[i]));
  const meanA = errA.reduce((a, b) => a + b, 0) / errA.length;
  const meanB = errB.reduce((a, b) => a + b, 0) / errB.length;
  const stdA = Math.sqrt(errA.reduce((a, b) => a + (b - meanA) ** 2, 0) / errA.length);
  const stdB = Math.sqrt(errB.reduce((a, b) => a + (b - meanB) ** 2, 0) / errB.length);
  const pooledStd = Math.sqrt((stdA ** 2 + stdB ** 2) / 2) + 1e-9;
  const cohensD = (meanB - meanA) / pooledStd;
  return { rateA, rateB, flipsA, flipsB, dir, cohensD, nA: groupA.length, nB: groupB.length, labelA, labelB };
}

function seededRandom(seed: number) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
}
function uniform(lo: number, hi: number, n: number, seed: number): number[] {
  const rand = seededRandom(seed);
  return Array.from({ length: n }, () => lo + rand() * (hi - lo));
}

function buildHistogram(groupA: number[], groupB: number[]) {
  const buckets = Array.from({ length: 10 }, (_, i) => ({
    range: `${(i / 10).toFixed(1)}–${((i + 1) / 10).toFixed(1)}`,
    majority: 0,
    minority: 0,
  }));
  groupA.forEach(v => { const b = Math.min(Math.floor(v * 10), 9); buckets[b].majority++; });
  groupB.forEach(v => { const b = Math.min(Math.floor(v * 10), 9); buckets[b].minority++; });
  return buckets;
}

function parseScores(text: string): number[] {
  return text
    .split(/[\n,\s]+/)
    .map(s => parseFloat(s.trim()))
    .filter(n => !isNaN(n) && n >= 0 && n <= 1);
}

function parseCSV(text: string): { groupA: number[]; groupB: number[]; labelA: string; labelB: string } | null {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return null;
  const header = lines[0].split(",").map(h => h.trim().toLowerCase());
  const scoreIdx = header.findIndex(h => h === "score");
  const groupIdx = header.findIndex(h => h === "group" || h === "label" || h === "category");
  if (scoreIdx === -1 || groupIdx === -1) return null;

  const rows = lines.slice(1).map(l => l.split(","));
  const groupNames = Array.from(new Set(rows.map(r => r[groupIdx]?.trim()).filter(Boolean)));
  if (groupNames.length < 2) return null;

  const [labelA, labelB] = groupNames;
  const groupA = rows.filter(r => r[groupIdx]?.trim() === labelA).map(r => parseFloat(r[scoreIdx])).filter(n => !isNaN(n));
  const groupB = rows.filter(r => r[groupIdx]?.trim() === labelB).map(r => parseFloat(r[scoreIdx])).filter(n => !isNaN(n));
  if (groupA.length < 5 || groupB.length < 5) return null;
  return { groupA, groupB, labelA, labelB };
}

// ── Scenarios ─────────────────────────────────────────────────────

const SCENARIOS = [
  {
    id: "loan", label: "Loan Approval", icon: "🏦",
    description: "Creditworthiness scoring. Majority group has strong historical signal; minority group is underrepresented in training data.",
    context: "A bank uses a compressed AI model to pre-screen loan applicants. The model was fair in testing — but after INT8 compression for faster deployment, decisions start shifting for the minority group.",
    majorityRange: [0.68, 0.95] as [number, number],
    minorityRange: [0.40, 0.62] as [number, number],
    n: 400, threshold: 0.5,
  },
  {
    id: "bail", label: "Bail Risk Assessment", icon: "⚖️",
    description: "Recidivism risk scoring. Mirrors the COMPAS dataset pattern where compression amplifies existing signal gaps.",
    context: "A court system uses a compressed risk model to assist bail decisions. This mirrors the real COMPAS finding — model compression silently widened disparities that weren't visible in the original model.",
    majorityRange: [0.65, 0.92] as [number, number],
    minorityRange: [0.42, 0.60] as [number, number],
    n: 500, threshold: 0.5,
  },
  {
    id: "hiring", label: "Hiring Screen", icon: "📋",
    description: "Resume-matching score. Near-threshold candidates from underrepresented groups are most vulnerable to quantization flips.",
    context: "An HR platform compresses its resume-scoring model to handle higher volume. Candidates near the shortlist threshold from underrepresented groups are disproportionately affected.",
    majorityRange: [0.70, 0.95] as [number, number],
    minorityRange: [0.38, 0.58] as [number, number],
    n: 300, threshold: 0.5,
  },
];

// ── Tool explanation panel ────────────────────────────────────────

function ToolPanel() {
  return (
    <div className="space-y-4">
      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50">What the tools measure</p>

      <div className="rounded-lg border border-border/60 bg-muted/10 p-4 space-y-2">
        <p className="text-xs font-semibold">Disparate Impact Ratio (DIR)</p>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          How many times more likely is Group B to have a decision flipped vs Group A?
        </p>
        <div className="space-y-1 mt-2">
          {[
            { range: "< 0.80", label: "Group A harmed more", color: "text-amber-600" },
            { range: "0.80 – 1.25", label: "Fair — no disparity", color: "text-emerald-600" },
            { range: "> 1.25", label: "Group B harmed more", color: "text-rose-500" },
          ].map(r => (
            <div key={r.range} className="flex items-center gap-2">
              <span className="font-mono text-[10px] w-20 shrink-0 text-muted-foreground">{r.range}</span>
              <span className={`text-[10px] ${r.color}`}>{r.label}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground/60 mt-2 leading-relaxed">
          The US 4/5ths rule flags anything above 1.25× as potential discrimination.
        </p>
      </div>

      <div className="rounded-lg border border-border/60 bg-muted/10 p-4 space-y-2">
        <p className="text-xs font-semibold">Cohen{"'"}s d</p>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          How far apart are the two groups{"'"} rounding error distributions, in standard deviations?
        </p>
        <div className="space-y-1 mt-2">
          {[
            { range: "< 0.2", label: "Negligible gap" },
            { range: "0.2 – 0.5", label: "Small gap" },
            { range: "0.5 – 0.8", label: "Medium gap" },
            { range: "> 0.8", label: "Large gap" },
          ].map(r => (
            <div key={r.range} className="flex items-center gap-2">
              <span className="font-mono text-[10px] w-20 shrink-0 text-muted-foreground">{r.range}</span>
              <span className="text-[10px] text-muted-foreground">{r.label}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground/60 mt-2 leading-relaxed">
          ⚠ A negative d (Group A worse absolute error) does NOT mean Group A is harmed more — the group with scores near the threshold suffers more flips regardless of error size.
        </p>
      </div>

      <div className="rounded-lg border border-border/60 bg-muted/10 p-4 space-y-2">
        <p className="text-xs font-semibold">Score Distribution Chart</p>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          The histogram shows where each group{"'"}s scores sit. Groups with scores clustered near the 0.5 threshold (the red line) are most at risk — even a tiny rounding error can flip their decision.
        </p>
        <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
          If the minority bars are taller near the centre and the majority bars are taller at the edges, disparate impact is almost certain.
        </p>
      </div>
    </div>
  );
}

// ── Score distribution chart ──────────────────────────────────────

function ScoreChart({ groupA, groupB, labelA, labelB }: {
  groupA: number[]; groupB: number[]; labelA: string; labelB: string;
}) {
  const data = buildHistogram(groupA, groupB);
  return (
    <div className="rounded-xl border border-border/60 bg-muted/10 p-4">
      <p className="text-xs font-semibold mb-1">Score distribution</p>
      <p className="text-[10px] text-muted-foreground mb-3">
        Red line = decision threshold (0.5). Groups with bars near the centre are most vulnerable.
      </p>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} />
          <XAxis dataKey="range" tick={{ fontSize: 9 }} interval={1} />
          <YAxis tick={{ fontSize: 9 }} />
          <Tooltip contentStyle={{ fontSize: 11 }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <ReferenceLine x="0.4–0.5" stroke="#ef4444" strokeWidth={2} strokeDasharray="4 2" label={{ value: "threshold", position: "top", fontSize: 9, fill: "#ef4444" }} />
          <Bar dataKey="majority" name={labelA} fill="#3b82f6" opacity={0.75} radius={[2, 2, 0, 0]} />
          <Bar dataKey="minority" name={labelB} fill="#f43f5e" opacity={0.75} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Metric cards ──────────────────────────────────────────────────

function MetricCards({ result }: { result: AuditResult }) {
  const dirFlagged = result.dir > 1.25;
  const dMag = Math.abs(result.cohensD);
  const dSize = dMag < 0.2 ? "Negligible" : dMag < 0.5 ? "Small" : dMag < 0.8 ? "Medium" : "Large";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div className={`rounded-xl border px-4 py-3 ${dirFlagged ? "border-rose-500/30 bg-rose-500/5" : "border-emerald-500/30 bg-emerald-500/5"}`}>
        <p className="text-[10px] text-muted-foreground mb-1">Disparate Impact Ratio</p>
        <p className={`text-2xl font-bold ${dirFlagged ? "text-rose-500" : "text-emerald-600"}`}>{result.dir.toFixed(2)}×</p>
        <p className={`text-[10px] font-semibold mt-0.5 ${dirFlagged ? "text-rose-500" : "text-emerald-600"}`}>
          {dirFlagged ? `FLAGGED — ${result.labelB} harmed ${result.dir.toFixed(1)}× more` : "OK — fair across groups"}
        </p>
      </div>
      <div className="rounded-xl border border-border/60 bg-muted/10 px-4 py-3">
        <p className="text-[10px] text-muted-foreground mb-1">Cohen{"'"}s d</p>
        <p className="text-2xl font-bold">{(result.cohensD >= 0 ? "+" : "") + result.cohensD.toFixed(3)}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{dSize} error gap · {result.cohensD > 0 ? result.labelB : result.labelA} larger absolute errors</p>
      </div>
      <div className="rounded-xl border border-border/60 bg-muted/10 px-4 py-3">
        <p className="text-[10px] text-muted-foreground mb-1">Decision flips</p>
        <p className="text-2xl font-bold">{result.flipsB}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {result.labelB}: {(result.rateB * 100).toFixed(1)}% flipped · {result.labelA}: {(result.rateA * 100).toFixed(1)}%
        </p>
      </div>
    </div>
  );
}

// ── Verdict ───────────────────────────────────────────────────────

function Verdict({ result, context }: { result: AuditResult; context?: string }) {
  const dirFlagged = result.dir > 1.25;
  return (
    <div className={`rounded-xl border p-4 ${dirFlagged ? "border-rose-500/20 bg-rose-500/5" : "border-emerald-500/20 bg-emerald-500/5"}`}>
      <p className="text-xs font-semibold mb-2">{dirFlagged ? "⚠ Disparate impact detected" : "✓ No disparate impact detected"}</p>
      <p className="text-xs text-muted-foreground leading-relaxed">
        {context
          ? (dirFlagged
            ? `${context} The minority group is ${result.dir.toFixed(1)}× more likely to have their decision flipped by quantization. The model itself was not changed — only compressed. This is quantization-induced disparate impact.`
            : `${context} Both groups experience similar flip rates. Compression is roughly fair across demographic groups in this scenario.`)
          : (dirFlagged
            ? `The ${result.labelB} group is ${result.dir.toFixed(1)}× more likely to have their decision flipped by quantization than the ${result.labelA} group. The model was not changed — only compressed.`
            : `Both groups experience similar flip rates. No disparate impact detected from quantization.`)}
      </p>
      {dirFlagged && (
        <p className="text-[10px] text-rose-600/80 mt-2 leading-relaxed">
          Recommended: quantization-aware training, mixed precision (keep boundary layers in FP32), or post-deployment monitoring with demographic breakdowns.
        </p>
      )}
    </div>
  );
}

// ── Preview ───────────────────────────────────────────────────────

function AuditPreview() {
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-10 z-40 bg-background/95 backdrop-blur border-b border-border/40">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link to="/#projects" className="text-xs text-muted-foreground hover:text-foreground transition-colors">← Back to Portfolio</Link>
          <span className="text-xs font-mono text-amber-600">Preview</span>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <h1 className="text-2xl font-bold">Quantization Fairness Auditor</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border bg-amber-500/10 text-amber-600 border-amber-500/20">Preview</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
            Detects hidden bias introduced when AI models are compressed for deployment. Upload your own data or try a built-in scenario.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: "Disparate Impact Ratio", value: "15×", sub: "minority harmed more" },
            { label: "Cohen's d", value: "−0.76", sub: "medium error gap" },
            { label: "Decision flips", value: "6", sub: "minority group only" },
          ].map(c => (
            <div key={c.label} className="rounded-lg border border-border/60 bg-muted/20 px-4 py-3">
              <p className="text-[10px] text-muted-foreground mb-1">{c.label}</p>
              <p className="text-xl font-bold">{c.value}</p>
              <p className="text-[10px] text-muted-foreground">{c.sub}</p>
            </div>
          ))}
        </div>
        <div className="relative rounded-xl border border-border/60 overflow-hidden mb-6">
          <div className="bg-muted/10 px-5 py-4 space-y-2 select-none">
            <div className="flex gap-2 mb-4">
              {["Try a Scenario", "Upload CSV", "Live Entry"].map(t => (
                <span key={t} className={`text-[10px] px-3 py-1 rounded-full border ${t === "Try a Scenario" ? "bg-primary/10 border-primary/40 text-primary" : "border-border/40 text-muted-foreground"}`}>{t}</span>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {["🏦 Loan Approval", "⚖️ Bail Risk", "📋 Hiring Screen"].map(s => (
                <div key={s} className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-[10px] text-muted-foreground">{s}</div>
              ))}
            </div>
            <div className="blur-sm space-y-2">
              <div className="h-32 rounded bg-muted/30" />
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map(i => <div key={i} className="h-16 rounded bg-muted/30" />)}
              </div>
            </div>
          </div>
          <DiagonalWatermark />
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Enter access code to run the auditor with your own data or built-in scenarios.
        </p>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────

type Tab = "scenarios" | "upload" | "live";

export default function QuantizationAuditor() {
  const [tab, setTab] = useState<Tab>("scenarios");

  // Scenario tab
  const [selected, setSelected] = useState<string | null>(null);
  const [scenarioResult, setScenarioResult] = useState<AuditResult | null>(null);
  const [scenarioScores, setScenarioScores] = useState<{ a: number[]; b: number[] } | null>(null);

  // Upload tab
  const [uploadResult, setUploadResult] = useState<AuditResult | null>(null);
  const [uploadScores, setUploadScores] = useState<{ a: number[]; b: number[] } | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [uploadInfo, setUploadInfo] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Live entry tab — pre-seeded with sample data so chart shows immediately
  const [textA, setTextA] = useState(
    "0.82, 0.91, 0.74, 0.88, 0.65, 0.93, 0.78, 0.85, 0.69, 0.90,\n0.77, 0.84, 0.72, 0.89, 0.67, 0.95, 0.80, 0.86, 0.71, 0.92"
  );
  const [textB, setTextB] = useState(
    "0.48, 0.52, 0.45, 0.51, 0.49, 0.53, 0.47, 0.55, 0.44, 0.50,\n0.46, 0.54, 0.43, 0.56, 0.42, 0.57, 0.48, 0.51, 0.44, 0.53"
  );
  const [liveResult, setLiveResult] = useState<AuditResult | null>(null);
  const [liveScores, setLiveScores] = useState<{ a: number[]; b: number[] } | null>(null);
  const [liveInfo, setLiveInfo] = useState("");

  function runScenario(id: string) {
    const sc = SCENARIOS.find(s => s.id === id)!;
    const a = uniform(sc.majorityRange[0], sc.majorityRange[1], sc.n, 42);
    const b = uniform(sc.minorityRange[0], sc.minorityRange[1], sc.n, 99);
    setSelected(id);
    setScenarioResult(runAudit(a, b, sc.threshold));
    setScenarioScores({ a, b });
  }

  function handleFile(file: File) {
    setUploadError(""); setUploadInfo(""); setUploadResult(null); setUploadScores(null);
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      if (!parsed) {
        setUploadError("Could not parse file. Make sure it has 'score' and 'group' columns.");
        return;
      }
      const { groupA, groupB, labelA, labelB } = parsed;
      setUploadInfo(`Found ${groupA.length} ${labelA} · ${groupB.length} ${labelB}`);
      setUploadResult(runAudit(groupA, groupB, 0.5, labelA, labelB));
      setUploadScores({ a: groupA, b: groupB });
    };
    reader.readAsText(file);
  }

  const recomputeLive = useCallback(() => {
    const a = parseScores(textA);
    const b = parseScores(textB);
    if (a.length >= 5 && b.length >= 5) {
      setLiveResult(runAudit(a, b, 0.5, "Group A", "Group B"));
      setLiveScores({ a, b });
      setLiveInfo(`${a.length} Group A · ${b.length} Group B scores parsed`);
    } else {
      setLiveResult(null); setLiveScores(null);
      if (a.length > 0 || b.length > 0) setLiveInfo("Need at least 5 scores per group");
      else setLiveInfo("");
    }
  }, [textA, textB]);

  useEffect(() => {
    const t = setTimeout(recomputeLive, 400);
    return () => clearTimeout(t);
  }, [textA, textB, recomputeLive]);

  const activeSc = SCENARIOS.find(s => s.id === selected);
  const TABS: { id: Tab; label: string }[] = [
    { id: "scenarios", label: "Try a Scenario" },
    { id: "live",      label: "Live Entry" },
    { id: "upload",    label: "Upload CSV" },
  ];

  return (
    <PageGate backTo="/#projects" previewContent={<AuditPreview />}>
      <div className="min-h-screen bg-background">
        <div className="sticky top-10 z-40 bg-background/95 backdrop-blur border-b border-border/40">
          <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
            <Link to="/#projects" className="text-xs text-muted-foreground hover:text-foreground transition-colors">← Back to Portfolio</Link>
            <span className="text-[10px] font-mono text-muted-foreground/50">Quantization Fairness Auditor</span>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-10">

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-2xl font-bold">Quantization Fairness Auditor</h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border bg-amber-500/10 text-amber-600 border-amber-500/20">Preview</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
              When AI models are compressed from FP32 to INT8, tiny rounding errors are introduced.
              Those errors don{"'"}t land equally — groups with scores near the decision boundary are
              disproportionately vulnerable to flipped outcomes. Upload your own data or try a built-in scenario.
            </p>
          </div>

          {/* Two-column layout */}
          <div className="flex flex-col lg:flex-row gap-8">

            {/* Left: tabs + interactive */}
            <div className="flex-1 min-w-0 space-y-6">

              {/* How it works */}
              <div className="rounded-xl border border-border/60 bg-muted/10 p-4">
                <div className="grid grid-cols-3 gap-4 text-xs text-muted-foreground">
                  {[
                    { step: "01 · Compress", text: "FP32 scores (32-bit) are quantized to INT8 (256 slots), introducing rounding errors." },
                    { step: "02 · Compare", text: "Decisions before and after compression are compared per demographic group." },
                    { step: "03 · Measure", text: "DIR, Cohen's d and flip rates quantify whether one group is disproportionately affected." },
                  ].map(s => (
                    <div key={s.step}>
                      <p className="font-mono text-[10px] text-primary/60 mb-1">{s.step}</p>
                      <p className="leading-relaxed">{s.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tab bar */}
              <div className="flex gap-2 border-b border-border/40 pb-0">
                {TABS.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`text-xs px-4 py-2 rounded-t-lg border-b-2 transition-all ${
                      tab === t.id
                        ? "border-primary text-primary font-semibold"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">

                {/* Tab 1: Scenarios */}
                {tab === "scenarios" && (
                  <motion.div key="scenarios" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {SCENARIOS.map(sc => (
                        <button
                          key={sc.id}
                          onClick={() => runScenario(sc.id)}
                          className={`text-left rounded-lg border px-4 py-3 transition-all text-xs ${
                            selected === sc.id ? "border-primary bg-primary/5" : "border-border/60 hover:border-primary/40 bg-muted/10"
                          }`}
                        >
                          <p className="text-base mb-1">{sc.icon}</p>
                          <p className="font-semibold mb-1">{sc.label}</p>
                          <p className="text-muted-foreground leading-relaxed text-[11px]">{sc.description}</p>
                        </button>
                      ))}
                    </div>

                    {scenarioResult && activeSc && scenarioScores && (
                      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                        <div className="rounded-xl border border-border/40 bg-muted/5 px-4 py-3">
                          <p className="text-[11px] text-muted-foreground leading-relaxed">{activeSc.context}</p>
                        </div>
                        <ScoreChart groupA={scenarioScores.a} groupB={scenarioScores.b} labelA="Majority" labelB="Minority" />
                        <MetricCards result={scenarioResult} />
                        <Verdict result={scenarioResult} context={activeSc.context} />
                      </motion.div>
                    )}

                    {!scenarioResult && (
                      <div className="rounded-xl border border-dashed border-border/40 py-10 text-center">
                        <p className="text-xs text-muted-foreground">Select a scenario above to run the audit</p>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Tab 2: Upload CSV */}
                {tab === "upload" && (
                  <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">

                    {/* File format guide */}
                    <div className="rounded-xl border border-border/60 bg-muted/10 p-4 space-y-3">
                      <p className="text-xs font-semibold">Expected file format</p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Your CSV needs two columns: <code className="font-mono bg-muted/40 px-1 rounded">score</code> (a number between 0–1 representing model confidence) and <code className="font-mono bg-muted/40 px-1 rounded">group</code> (a label identifying the demographic group). Any two group names work.
                      </p>
                      <div className="rounded-lg bg-background border border-border/40 overflow-hidden">
                        <div className="px-3 py-1.5 bg-muted/30 border-b border-border/40">
                          <span className="text-[10px] font-mono text-muted-foreground">sample_scores.csv</span>
                        </div>
                        <pre className="text-[11px] font-mono px-3 py-2.5 text-muted-foreground leading-relaxed overflow-x-auto">{`score,group\n0.82,majority\n0.91,majority\n0.74,majority\n0.47,minority\n0.51,minority\n0.44,minority\n0.88,majority\n0.49,minority`}</pre>
                      </div>
                      <p className="text-[10px] text-muted-foreground/60">
                        Minimum 5 rows per group · Scores must be 0–1 · Column names are case-insensitive · Group column can also be named <code className="font-mono">label</code> or <code className="font-mono">category</code>
                      </p>
                    </div>

                    <div
                      onClick={() => fileRef.current?.click()}
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                      className="rounded-xl border-2 border-dashed border-border/60 hover:border-primary/40 bg-muted/10 hover:bg-muted/20 transition-all py-8 text-center cursor-pointer"
                    >
                      <p className="text-xs font-semibold mb-1">Drop your CSV here or click to upload</p>
                      <p className="text-[11px] text-muted-foreground">Drag and drop · or click to browse files</p>
                      <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
                    </div>

                    {uploadError && <p className="text-xs text-rose-500">{uploadError}</p>}
                    {uploadInfo && <p className="text-[11px] text-emerald-600 font-medium">{uploadInfo}</p>}

                    {uploadResult && uploadScores && (
                      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                        <ScoreChart groupA={uploadScores.a} groupB={uploadScores.b} labelA={uploadResult.labelA} labelB={uploadResult.labelB} />
                        <MetricCards result={uploadResult} />
                        <Verdict result={uploadResult} />
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {/* Tab 3: Live Entry */}
                {tab === "live" && (
                  <motion.div key="live" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">

                    {/* Score guide */}
                    <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 space-y-2">
                      <p className="text-xs font-semibold">What are scores?</p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        A <strong>score</strong> is the model{"'"}s confidence that someone should receive a positive outcome (loan approved, bail granted, candidate shortlisted). Scores run from <strong>0 to 1</strong>.
                      </p>
                      <div className="grid grid-cols-3 gap-2 mt-1">
                        {[
                          { range: "0.0 – 0.4", label: "Likely rejected", color: "text-rose-500" },
                          { range: "0.4 – 0.6", label: "Near the boundary ⚠", color: "text-amber-600" },
                          { range: "0.6 – 1.0", label: "Likely approved", color: "text-emerald-600" },
                        ].map(r => (
                          <div key={r.range} className="rounded-lg bg-background border border-border/40 px-2.5 py-2">
                            <p className="font-mono text-[10px] text-muted-foreground">{r.range}</p>
                            <p className={`text-[10px] font-semibold mt-0.5 ${r.color}`}>{r.label}</p>
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-muted-foreground/70 leading-relaxed">
                        The decision threshold is <strong>0.5</strong>. Scores above 0.5 = positive outcome. Below 0.5 = negative. Scores close to 0.5 are most vulnerable — a tiny rounding error from compression can push them either way.
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                        Enter scores separated by commas, spaces, or new lines. Minimum 5 per group to run the audit.
                      </p>
                    </div>

                    {/* Textareas + live chart side by side */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Left: inputs */}
                      <div className="space-y-3">
                        <div>
                          <label className="text-[11px] font-semibold block mb-0.5">Group A scores</label>
                          <p className="text-[10px] text-muted-foreground mb-1.5">Stronger / majority group — scores typically 0.65–0.95</p>
                          <textarea
                            value={textA}
                            onChange={e => setTextA(e.target.value)}
                            rows={5}
                            className="w-full px-3 py-2 rounded-lg border border-blue-500/30 bg-background text-xs font-mono outline-none focus:border-blue-500/60 resize-none"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold block mb-0.5">Group B scores</label>
                          <p className="text-[10px] text-muted-foreground mb-1.5">Weaker / minority group — scores typically 0.40–0.60</p>
                          <textarea
                            value={textB}
                            onChange={e => setTextB(e.target.value)}
                            rows={5}
                            className="w-full px-3 py-2 rounded-lg border border-rose-500/30 bg-background text-xs font-mono outline-none focus:border-rose-500/60 resize-none"
                          />
                        </div>
                        {liveInfo && (
                          <p className={`text-[11px] font-medium ${liveResult ? "text-emerald-600" : "text-amber-600"}`}>{liveInfo}</p>
                        )}
                      </div>

                      {/* Right: live chart */}
                      <div>
                        {liveScores ? (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full">
                            <ScoreChart groupA={liveScores.a} groupB={liveScores.b} labelA="Group A" labelB="Group B" />
                          </motion.div>
                        ) : (
                          <div className="rounded-xl border border-dashed border-border/40 h-full min-h-[200px] flex items-center justify-center">
                            <p className="text-xs text-muted-foreground text-center px-4">Chart appears here as you enter scores</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Metrics + verdict below */}
                    {liveResult ? (
                      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                        <MetricCards result={liveResult} />
                        <Verdict result={liveResult} />
                        <div className="pt-2 border-t border-border/40">
                          <ToolPanel />
                        </div>
                      </motion.div>
                    ) : null}
                  </motion.div>
                )}

              </AnimatePresence>

              {/* Footer */}
              {tab !== "live" && (
                <div className="rounded-xl border border-border/60 bg-muted/10 p-4">
                  <p className="text-xs font-semibold mb-1">Built in Python · Google Colab</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Core tool built bottom-up across 7 steps — from binary arithmetic through neural network
                    weights to statistical auditing. The interactive demo above runs the same math ported to TypeScript.
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {["Python", "NumPy", "SciPy", "Pandas", "Google Colab"].map(t => (
                      <span key={t} className="text-[10px] font-mono text-muted-foreground/60 bg-muted/40 px-2 py-0.5 rounded">{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: tool explanations — hidden on live entry tab (shown inline there) */}
            {tab !== "live" && (
              <div className="lg:w-72 shrink-0">
                <div className="lg:sticky lg:top-24">
                  <ToolPanel />
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </PageGate>
  );
}
