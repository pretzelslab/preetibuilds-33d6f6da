import { useState, useEffect, useRef, useCallback } from "react";
import { useVisitLogger } from "@/hooks/useVisitLogger";
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
  const [activeTab, setActiveTab] = useState<0 | 1 | 2 | 3 | 4>(0);

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-10 z-40 bg-background/95 backdrop-blur border-b border-border/40">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link to="/#projects" className="text-xs text-muted-foreground hover:text-foreground transition-colors">← Back to Portfolio</Link>
          <span className="text-xs font-mono text-amber-600">Preview</span>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-6 py-12">

        {/* Title */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <h1 className="text-2xl font-bold">Algorithmic Fairness Auditor</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border bg-amber-500/10 text-amber-600 border-amber-500/20">Preview</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
            Four modules: quantization bias auditor, COMPAS criminal justice replication, remediation simulator, and a real mortgage lending fairness audit using CFPB HMDA 2022 data.
          </p>
        </div>

        {/* Tab switcher — interactive */}
        <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-muted/30 border border-border/40 w-fit mb-8">
          {["Tab 1 · Quantization Auditor", "Tab 2 · COMPAS Recidivism", "Tab 3 · COMPAS Remediation", "Tab 4 · Credit Scoring Audit", "Tab 5 · Credit Remediation"].map((t, i) => (
            <button
              key={t}
              onClick={() => setActiveTab(i as 0 | 1 | 2 | 3 | 4)}
              className={`text-xs px-4 py-2 rounded-lg font-medium transition-all ${activeTab === i ? "bg-background text-foreground shadow-sm border border-border/60" : "text-muted-foreground hover:text-foreground"}`}
            >{t}</button>
          ))}
        </div>

        {/* Tab 1 — Quantization Auditor */}
        {activeTab === 0 && (
          <>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { label: "Disparate Impact Ratio", value: "1.52×", sub: "minority harmed more" },
                { label: "Cohen's d", value: "+0.76", sub: "medium error gap" },
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
          </>
        )}

        {/* Tab 2 — COMPAS Recidivism */}
        {activeTab === 1 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { group: "African-American", fpr: "42.3%", fnr: "28.5%", dir: "1.92×", flagged: true },
                { group: "Caucasian", fpr: "22.0%", fnr: "49.6%", dir: "1.00×", flagged: false },
                { group: "Hispanic", fpr: "19.4%", fnr: "58.2%", dir: "0.88×", flagged: false },
                { group: "Other", fpr: "12.8%", fnr: "66.1%", dir: "0.58×", flagged: false },
              ].map(c => (
                <div key={c.group} className={`rounded-lg border px-4 py-3 ${c.flagged ? "border-rose-500/30 bg-rose-500/5" : "border-border/60 bg-muted/20"}`}>
                  <p className={`text-[10px] font-semibold mb-2 ${c.flagged ? "text-rose-600" : "text-muted-foreground"}`}>{c.group}</p>
                  <p className="text-[10px] text-muted-foreground">FPR</p>
                  <p className={`text-lg font-bold ${c.flagged ? "text-rose-500" : ""}`}>{c.fpr}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">FNR</p>
                  <p className="text-sm font-semibold">{c.fnr}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">DIR</p>
                  <p className={`text-sm font-bold ${c.flagged ? "text-rose-500" : ""}`}>{c.dir}</p>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-xs text-muted-foreground mb-6">
              <strong className="text-foreground">Verdict: Deployment blocked.</strong> DIR 1.92× exceeds EU AI Act 1.25× threshold.
              FPR gap of 29.5pp and FNR gap of 37.6pp both exceed critical thresholds.
              Dual-direction bias: African-Americans overflaged, Hispanic and Other groups underflaged.
            </div>
            <div className="relative rounded-xl border border-border/60 overflow-hidden mb-6">
              <div className="bg-muted/10 px-5 py-4 select-none">
                <p className="text-[10px] font-semibold mb-3">Independent replication · ProPublica 2016 · n=6,172 Broward County defendants</p>
                <div className="blur-sm pointer-events-none">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border/60 bg-muted/20">
                        {["Group","n","Base rate","FPR","FNR","DIR"].map(h => (
                          <th key={h} className="text-left px-3 py-2 font-medium text-muted-foreground">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["African-American","3,175","52.3%","42.3%","28.5%","1.92×"],
                        ["Caucasian","2,103","39.1%","22.0%","49.6%","1.00×"],
                        ["Hispanic","509","37.1%","19.4%","58.2%","0.88×"],
                        ["Other","343","36.2%","12.8%","66.1%","0.58×"],
                      ].map((row, i) => (
                        <tr key={i} className="border-b border-border/40 last:border-0">
                          {row.map((cell, j) => (
                            <td key={j} className="px-3 py-2 font-medium">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <DiagonalWatermark />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Enter access code to explore the full audit, intersectional breakdowns, and remediation simulator.
            </p>
          </>
        )}

        {/* Tab 3 — Remediation Simulator */}
        {activeTab === 2 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { label: "AA threshold", value: "5 → ?", sub: "adjust to reduce FPR" },
                { label: "Max DIR", value: "1.92×", sub: "target ≤ 1.25×" },
                { label: "FPR gap", value: "29.5 pp", sub: "target ≤ 15 pp" },
                { label: "FNR gap", value: "37.6 pp", sub: "Chouldechova limit" },
              ].map(c => (
                <div key={c.label} className="rounded-lg border border-border/60 bg-muted/20 px-4 py-3">
                  <p className="text-[10px] text-muted-foreground mb-1">{c.label}</p>
                  <p className="text-xl font-bold">{c.value}</p>
                  <p className="text-[10px] text-muted-foreground">{c.sub}</p>
                </div>
              ))}
            </div>
            <div className="relative rounded-xl border border-border/60 overflow-hidden mb-6">
              <div className="bg-muted/10 px-5 py-4 select-none">
                <p className="text-[10px] font-semibold mb-3">Group-specific threshold recalibration · before → after</p>
                <div className="blur-sm pointer-events-none space-y-3">
                  {["African-American", "Caucasian", "Hispanic", "Other"].map(g => (
                    <div key={g} className="flex items-center gap-3">
                      <span className="text-xs w-36">{g}</span>
                      <div className="flex-1 h-2 rounded bg-muted/40" />
                      <span className="text-xs w-8 text-right">5</span>
                    </div>
                  ))}
                  <div className="h-24 rounded bg-muted/30 mt-2" />
                </div>
              </div>
              <DiagonalWatermark />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Enter access code to run the simulator and explore the Chouldechova impossibility theorem interactively.
            </p>
          </>
        )}

        {/* Tab 4 — Credit Scoring Audit */}
        {activeTab === 3 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { label: "Black DIR", value: "1.81×", sub: "EU threshold 1.25×", flagged: true },
                { label: "Hispanic DIR", value: "1.71×", sub: "EU threshold 1.25×", flagged: true },
                { label: "Asian DIR", value: "1.11×", sub: "within threshold", flagged: false },
                { label: "Dataset", value: "138k", sub: "HMDA 2022 NY", flagged: false },
              ].map(c => (
                <div key={c.label} className={`rounded-lg border px-4 py-3 ${c.flagged ? "border-rose-500/30 bg-rose-500/5" : "border-border/60 bg-muted/20"}`}>
                  <p className="text-[10px] text-muted-foreground mb-1">{c.label}</p>
                  <p className={`text-xl font-bold ${c.flagged ? "text-rose-500" : ""}`}>{c.value}</p>
                  <p className="text-[10px] text-muted-foreground">{c.sub}</p>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-muted-foreground mb-6">
              <strong className="text-foreground">Key finding: income doesn{"'"}t explain the gap.</strong> Black applicants in the highest income quartile face a DIR of 1.94× — higher than the lowest income quartile (1.55×). Proxy discrimination via zip code and credit history.
            </div>
            <div className="relative rounded-xl border border-border/60 overflow-hidden mb-6">
              <div className="bg-muted/10 px-5 py-4 select-none">
                <p className="text-[10px] font-semibold mb-3">Income-controlled DIR · CFPB HMDA 2022 · New York State</p>
                <div className="blur-sm pointer-events-none">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border/60 bg-muted/20">
                        {["Group","Denial rate","DIR","Q1","Q2","Q3","Q4"].map(h => (
                          <th key={h} className="text-left px-3 py-2 font-medium text-muted-foreground">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["Black","18.9%","1.81×","1.55×","1.83×","1.95×","1.94×"],
                        ["Hispanic","17.9%","1.71×","1.59×","1.56×","1.90×","1.87×"],
                        ["Asian","11.6%","1.11×","1.20×","1.16×","1.44×","1.30×"],
                        ["White","10.4%","1.00×","—","—","—","—"],
                      ].map((row, i) => (
                        <tr key={i} className="border-b border-border/40 last:border-0">
                          {row.map((cell, j) => (
                            <td key={j} className="px-3 py-2 font-medium">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <DiagonalWatermark />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Enter access code to explore the full audit, regulatory verdict, and income-controlled analysis.
            </p>
          </>
        )}

        {/* Tab 5 — Credit Remediation */}
        {activeTab === 4 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { label: "Black baseline DIR", value: "1.81×", sub: "target ≤ 1.25×" },
                { label: "Hispanic baseline DIR", value: "1.71×", sub: "target ≤ 1.25×" },
                { label: "Risk tradeoff", value: "Fairness", sub: "vs default rate" },
                { label: "Groups modelled", value: "5", sub: "White · Black · Hispanic · Asian · Native Am." },
              ].map(c => (
                <div key={c.label} className="rounded-lg border border-border/60 bg-muted/20 px-4 py-3">
                  <p className="text-[10px] text-muted-foreground mb-1">{c.label}</p>
                  <p className="text-xl font-bold">{c.value}</p>
                  <p className="text-[10px] text-muted-foreground">{c.sub}</p>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-xs text-muted-foreground mb-6">
              <strong className="text-foreground">Unlike COMPAS, the cost here is financial.</strong> Raising leniency approves more borderline applicants — lowering DIR but increasing estimated default risk. The simulator makes this tradeoff explicit.
            </div>
            <div className="relative rounded-xl border border-border/60 overflow-hidden mb-6">
              <div className="bg-muted/10 px-5 py-4 select-none">
                <p className="text-[10px] font-semibold mb-3">Approval leniency per group · denial rate before → after · default risk impact</p>
                <div className="blur-sm pointer-events-none space-y-3">
                  {["White", "Black", "Hispanic", "Asian", "Native American"].map(g => (
                    <div key={g} className="flex items-center gap-3">
                      <span className="text-xs w-36">{g}</span>
                      <div className="flex-1 h-2 rounded bg-muted/40" />
                      <span className="text-xs w-8 text-right">5</span>
                      <span className="text-xs w-16 text-right text-muted-foreground">DIR: —</span>
                    </div>
                  ))}
                  <div className="h-20 rounded bg-muted/30 mt-2" />
                </div>
              </div>
              <DiagonalWatermark />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Enter access code to run the simulator and explore the fairness/risk tradeoff interactively.
            </p>
          </>
        )}

      </div>
    </div>
  );
}

// ── COMPAS data (generated from ProPublica dataset in Google Colab) ──
// Filtered sample: 6,172 defendants · Broward County, Florida · 2013–2014
// Threshold: Medium OR High = flagged as risk (mirrors real sentencing impact)

const COMPAS_DATA = {
  sampleSize: 6172,
  source: "ProPublica COMPAS Analysis, 2016",
  region: "Broward County, Florida, 2013–2014",
  byRace: [
    { race: "African-American", n: 3175, recidRate: 52.3, fpr: 42.3, fnr: 28.5, dir: 1.92 },
    { race: "Caucasian",        n: 2103, recidRate: 39.1, fpr: 22.0, fnr: 49.6, dir: 1.0  },
    { race: "Hispanic",         n:  509, recidRate: 37.1, fpr: 19.4, fnr: 58.2, dir: 0.88 },
    { race: "Other",            n:  343, recidRate: 36.2, fpr: 12.8, fnr: 66.1, dir: 0.58 },
  ],
  bySex: [
    { sex: "Male",   n: 4997, recidRate: 47.9, fpr: 30.3, fnr: 37.9 },
    { sex: "Female", n: 1175, recidRate: 35.1, fpr: 30.2, fnr: 40.4 },
  ],
  propublicaPublished: {
    blackFpr: 44.9, whiteFpr: 23.5, dir: 1.91,
    blackFnr: 28.0, whiteFnr: 47.7,
  },
} as const;

// ── HMDA Credit Scoring data (CFPB HMDA 2022, New York State) ────
// Conventional home purchase loans. n=138,665 after filtering.
// Hispanic captured via derived_ethnicity (HMDA race/ethnicity split).

const HMDA_METRICS = [
  { race: "White",           n: 93900, denialRate: 10.4, approvalRate: 89.6, dir: 1.00, approvalRatio: 1.00, lowN: false },
  { race: "Black",           n:  7931, denialRate: 18.9, approvalRate: 81.1, dir: 1.81, approvalRatio: 0.91, lowN: false },
  { race: "Hispanic",        n: 11770, denialRate: 17.9, approvalRate: 82.1, dir: 1.71, approvalRatio: 0.92, lowN: false },
  { race: "Asian",           n: 24608, denialRate: 11.6, approvalRate: 88.4, dir: 1.11, approvalRatio: 0.99, lowN: false },
  { race: "Native American", n:   456, denialRate: 27.4, approvalRate: 72.6, dir: 2.63, approvalRatio: 0.81, lowN: true  },
] as const;

const HMDA_INCOME_CONTROLLED = [
  { race: "Black",           quartiles: [{ q: "Q1 (lowest)", denialRate: 25.7, dir: 1.55 }, { q: "Q2", denialRate: 16.8, dir: 1.83 }, { q: "Q3", denialRate: 14.0, dir: 1.95 }, { q: "Q4 (highest)", denialRate: 14.1, dir: 1.94 }] },
  { race: "Hispanic",        quartiles: [{ q: "Q1 (lowest)", denialRate: 26.2, dir: 1.59 }, { q: "Q2", denialRate: 14.3, dir: 1.56 }, { q: "Q3", denialRate: 13.7, dir: 1.90 }, { q: "Q4 (highest)", denialRate: 13.6, dir: 1.87 }] },
  { race: "Asian",           quartiles: [{ q: "Q1 (lowest)", denialRate: 19.9, dir: 1.20 }, { q: "Q2", denialRate: 10.6, dir: 1.16 }, { q: "Q3", denialRate: 10.4, dir: 1.44 }, { q: "Q4 (highest)", denialRate:  9.4, dir: 1.30 }] },
  { race: "Native American", quartiles: [{ q: "Q1 (lowest)", denialRate: 35.2, dir: 2.13 }, { q: "Q2", denialRate: 23.5, dir: 2.56 }, { q: "Q3", denialRate: 13.9, dir: 1.93 }, { q: "Q4 (highest)", denialRate: 16.7, dir: 2.29 }] },
] as const;

// ── Main page ─────────────────────────────────────────────────────

type Tab = "scenarios" | "upload" | "live";
type PageTab = "quant" | "compas" | "remediate" | "credit" | "credit-remediate";

// ── Credit remediation math ───────────────────────────────────────
// Approval leniency slider: 1 = very strict, 10 = very lenient, 5 = baseline
function denialAt(baseDenial: number, t: number): number {
  const minDenial = Math.max(2, baseDenial * 0.25);
  const maxDenial = Math.min(70, baseDenial * 2.2);
  if (t <= 5) return Math.round((baseDenial + (maxDenial - baseDenial) * (5 - t) / 4) * 10) / 10;
  return Math.round(Math.max(minDenial, baseDenial - (baseDenial - minDenial) * (t - 5) / 5) * 10) / 10;
}
// Estimated default risk increase: denied-but-now-approved applicants default at ~35%
function defaultRiskIncrease(baseDenial: number, newDenial: number): number {
  return Math.round(Math.max(0, (baseDenial - newDenial) * 0.35) * 10) / 10;
}

// ── Remediation simulator math ────────────────────────────────────
function fprAt(baseFpr: number, t: number): number {
  if (t <= 5) return 95 - (95 - baseFpr) * (t - 1) / 4;
  return Math.max(2, baseFpr - (baseFpr - 2) * (t - 5) / 5);
}
function fnrAt(baseFnr: number, t: number): number {
  if (t <= 5) return Math.max(2, 5 + (baseFnr - 5) * (t - 1) / 4);
  return Math.min(98, baseFnr + (98 - baseFnr) * (t - 5) / 5);
}
function flagRate(fpr: number, fnr: number, recidRate: number): number {
  return (fpr / 100) * (1 - recidRate / 100) + (1 - fnr / 100) * (recidRate / 100);
}
function calcDir(groupFlag: number, caucFlag: number): number {
  return caucFlag > 0 ? groupFlag / caucFlag : 1;
}

export default function AlgorithmicFairnessAuditor() {
  useVisitLogger("/algorithmic-fairness");
  const [pageTab, setPageTab] = useState<PageTab>("quant");
  const [tab, setTab] = useState<Tab>("scenarios");

  // COMPAS remediation thresholds — default 5
  const [thresholds, setThresholds] = useState({ aa: 5, cauc: 5, hisp: 5, other: 5 });
  const setT = (key: keyof typeof thresholds, val: number) =>
    setThresholds(prev => ({ ...prev, [key]: val }));

  // Credit remediation leniency — default 5
  const [creditLeniency, setCreditLeniency] = useState({ white: 5, black: 5, hispanic: 5, asian: 5, native: 5 });
  const setCL = (key: keyof typeof creditLeniency, val: number) =>
    setCreditLeniency(prev => ({ ...prev, [key]: val }));

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
            <span className="text-[10px] font-mono text-muted-foreground/50">Algorithmic Fairness Auditor</span>
          </div>
        </div>

        {/* Page-level tab switcher */}
        <div className="max-w-5xl mx-auto px-6 pt-6 pb-0">
          <div className="flex gap-1 p-1 rounded-xl bg-muted/30 border border-border/40 w-fit">
            {([
              { id: "quant" as PageTab,            label: "Tab 1 · Quantization Auditor" },
              { id: "compas" as PageTab,           label: "Tab 2 · COMPAS Recidivism" },
              { id: "remediate" as PageTab,        label: "Tab 3 · COMPAS Remediation" },
              { id: "credit" as PageTab,           label: "Tab 4 · Credit Scoring Audit" },
              { id: "credit-remediate" as PageTab, label: "Tab 5 · Credit Remediation" },
            ] as { id: PageTab; label: string }[]).map(pt => (
              <button
                key={pt.id}
                onClick={() => setPageTab(pt.id)}
                className={`text-xs px-4 py-2 rounded-lg font-medium transition-all ${
                  pageTab === pt.id
                    ? "bg-background text-foreground shadow-sm border border-border/60"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {pt.label}
              </button>
            ))}
          </div>
        </div>

        {/* COMPAS tab */}
        {pageTab === "compas" && (
          <div className="max-w-5xl mx-auto px-6 py-10">

            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-2xl font-bold">COMPAS Recidivism Audit</h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border bg-amber-500/10 text-amber-600 border-amber-500/20">Preview</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                COMPAS scored over 1 million US defendants on recidivism risk, directly influencing bail and sentencing.
                In 2016, ProPublica found Black defendants were falsely labelled dangerous at nearly twice the rate of white defendants.
                We independently replicated their analysis using the same dataset.
              </p>
            </div>

            {/* Two-column layout */}
            <div className="flex flex-col lg:flex-row gap-8">

              {/* Left: main content */}
              <div className="flex-1 min-w-0 space-y-6">

                {/* How it works */}
                <div className="rounded-xl border border-border/60 bg-muted/10 p-4">
                  <div className="grid grid-cols-3 gap-4 text-xs text-muted-foreground">
                    {[
                      { step: "01 · The Algorithm", text: "COMPAS assigned defendants a score of 1–10 (Low/Medium/High) predicting reoffending within 2 years." },
                      { step: "02 · The Investigation", text: "ProPublica (2016) obtained 7,000 Broward County records and found systematic racial disparity in error rates." },
                      { step: "03 · This Audit", text: "We replicate their methodology — same dataset, same filters, same metrics — to verify and extend the findings." },
                    ].map(s => (
                      <div key={s.step}>
                        <p className="font-mono text-[10px] text-primary/60 mb-1">{s.step}</p>
                        <p className="leading-relaxed">{s.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Headline finding */}
                <div className="space-y-3">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50">Headline finding — False Positive Rate by race</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 px-4 py-3">
                      <p className="text-[10px] text-muted-foreground mb-1">Black defendants — FPR</p>
                      <p className="text-3xl font-bold text-rose-500">{COMPAS_DATA.byRace[0].fpr}%</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">of innocents wrongly flagged dangerous</p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-muted/10 px-4 py-3">
                      <p className="text-[10px] text-muted-foreground mb-1">White defendants — FPR</p>
                      <p className="text-3xl font-bold">{COMPAS_DATA.byRace[1].fpr}%</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">of innocents wrongly flagged dangerous</p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-0.5">Disparate Impact Ratio</p>
                      <p className="text-2xl font-bold text-rose-500">{COMPAS_DATA.byRace[0].dir}×</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-rose-600 font-semibold leading-relaxed">
                        A Black defendant who did not reoffend was {COMPAS_DATA.byRace[0].dir}× more likely to be labelled dangerous.
                      </p>
                      <p className="text-[10px] text-rose-600/60 mt-1">Legal threshold: 1.25× · This result: {COMPAS_DATA.byRace[0].dir}×</p>
                    </div>
                  </div>
                </div>

                {/* Race breakdown table */}
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50 mb-3">All groups (n ≥ 50) · DIR baseline = Caucasian</p>
                  <div className="rounded-xl border border-border/60 overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border/40 bg-muted/20">
                          <th className="text-left px-4 py-2 font-semibold">Group</th>
                          <th className="text-right px-3 py-2 font-semibold">n</th>
                          <th className="text-right px-3 py-2 font-semibold">Base rate</th>
                          <th className="text-right px-3 py-2 font-semibold">FPR</th>
                          <th className="text-right px-3 py-2 font-semibold">FNR</th>
                          <th className="text-right px-3 py-2 font-semibold">DIR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {COMPAS_DATA.byRace.map((row) => (
                          <tr key={row.race} className="border-b border-border/30 last:border-0">
                            <td className="px-4 py-2 font-medium">{row.race}</td>
                            <td className="px-3 py-2 text-right text-muted-foreground">{row.n.toLocaleString()}</td>
                            <td className="px-3 py-2 text-right text-muted-foreground">{row.recidRate}%</td>
                            <td className={`px-3 py-2 text-right font-semibold ${row.dir > 1.25 ? "text-rose-500" : "text-foreground"}`}>{row.fpr}%</td>
                            <td className="px-3 py-2 text-right text-muted-foreground">{row.fnr}%</td>
                            <td className={`px-3 py-2 text-right font-semibold ${row.dir > 1.25 ? "text-rose-500" : row.dir < 0.8 ? "text-amber-600" : "text-emerald-600"}`}>
                              {row.dir.toFixed(2)}×
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-[10px] text-muted-foreground/50 mt-1.5">DIR &gt; 1.25× = over-flagged · DIR &lt; 0.80× = under-flagged (high FNR)</p>
                </div>

                {/* Key insight */}
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                  <p className="text-xs font-semibold mb-1.5">The errors go in opposite directions</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Black defendants were over-flagged — wrongly labelled dangerous at 42.3% vs 22.0% for white defendants.
                    But Hispanic and Other defendants were under-flagged — lower false positive rates, but false negative rates of 58–66%,
                    meaning most who actually reoffended were told they were low risk.
                    The algorithm does not fail uniformly: it fails different groups in different directions.
                  </p>
                </div>

                {/* Validation */}
                <div className="rounded-xl border border-border/60 bg-muted/10 p-4">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50 mb-3">Validation — this audit vs ProPublica published (2016)</p>
                  <div className="space-y-2">
                    {([
                      { metric: "Black FPR", ours: `${COMPAS_DATA.byRace[0].fpr}%`, pub: `${COMPAS_DATA.propublicaPublished.blackFpr}%` },
                      { metric: "White FPR", ours: `${COMPAS_DATA.byRace[1].fpr}%`, pub: `${COMPAS_DATA.propublicaPublished.whiteFpr}%` },
                      { metric: "DIR",       ours: `${COMPAS_DATA.byRace[0].dir}×`, pub: `${COMPAS_DATA.propublicaPublished.dir}×`      },
                      { metric: "Black FNR", ours: `${COMPAS_DATA.byRace[0].fnr}%`, pub: `${COMPAS_DATA.propublicaPublished.blackFnr}%` },
                      { metric: "White FNR", ours: `${COMPAS_DATA.byRace[1].fnr}%`, pub: `${COMPAS_DATA.propublicaPublished.whiteFnr}%` },
                    ] as const).map(r => (
                      <div key={r.metric} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground w-24">{r.metric}</span>
                        <span className="font-semibold">{r.ours}</span>
                        <span className="text-muted-foreground/60">ProPublica: {r.pub}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-emerald-600 mt-3">✓ Within 2–3% on all metrics — independent replication confirmed</p>
                </div>

                {/* Deployment verdict */}
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4">
                  <p className="text-xs font-bold text-rose-600 mb-3">Deployment Verdict — 4 Critical Threshold Breaches</p>
                  <div className="space-y-2 mb-3">
                    {[
                      { check: "DIR — African-American/Caucasian", value: "1.92×", threshold: "≤ 1.25× (EU AI Act)", fail: true },
                      { check: "FPR gap — AA vs Other", value: "29.5 pp", threshold: "≤ 15 pp (internal)", fail: true },
                      { check: "FNR gap — Other vs AA", value: "37.6 pp", threshold: "≤ 15 pp (internal)", fail: true },
                      { check: "US 4/5ths — African-American", value: "0.52", threshold: "≥ 0.80 (EEOC)", fail: true },
                      { check: "Minimum group coverage", value: "343 (Other)", threshold: "≥ 100 records", fail: false },
                    ].map(r => (
                      <div key={r.check} className="flex items-start justify-between gap-2 text-[11px]">
                        <span className="text-muted-foreground flex-1">{r.check}</span>
                        <span className={`font-bold shrink-0 ${r.fail ? "text-rose-500" : "text-emerald-600"}`}>{r.value}</span>
                        <span className={`shrink-0 ${r.fail ? "text-rose-400" : "text-emerald-500"}`}>{r.fail ? "❌" : "✅"}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-rose-600/80 leading-relaxed">
                    COMPAS is blocked under EU AI Act, US 4/5ths Rule, and internal thresholds.
                    See the <a href="https://github.com/pretzelslab/ai-safety-research/blob/main/COMPAS_Safety_Eval_Runbook.md" target="_blank" rel="noopener noreferrer" className="underline">Safety Eval Runbook</a> for escalation path and remediation options.
                  </p>
                </div>

                {/* Footer */}
                <div className="rounded-xl border border-border/60 bg-muted/10 p-4">
                  <p className="text-xs font-semibold mb-1">Built in Python · Google Colab</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Analysis built step by step in Colab — data load, filtering, metric functions, full audit table, validation.
                    Data: {COMPAS_DATA.source} · {COMPAS_DATA.region} · {COMPAS_DATA.sampleSize.toLocaleString()} defendants.
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {["Python", "Pandas", "Google Colab", "ProPublica Dataset"].map(t => (
                      <span key={t} className="text-[10px] font-mono text-muted-foreground/60 bg-muted/40 px-2 py-0.5 rounded">{t}</span>
                    ))}
                  </div>
                </div>

              </div>

              {/* Right: explanation panel */}
              <div className="lg:w-72 shrink-0">
                <div className="lg:sticky lg:top-24 space-y-4">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50">What the metrics mean</p>

                  <div className="rounded-lg border border-border/60 bg-muted/10 p-4 space-y-2">
                    <p className="text-xs font-semibold">False Positive Rate (FPR)</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Of defendants who did <em>not</em> reoffend, what % were scored Medium or High risk?
                      A high FPR means innocent people are labelled dangerous — facing denied bail and longer sentences.
                    </p>
                  </div>

                  <div className="rounded-lg border border-border/60 bg-muted/10 p-4 space-y-2">
                    <p className="text-xs font-semibold">False Negative Rate (FNR)</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Of defendants who <em>did</em> reoffend, what % were scored Low risk?
                      A high FNR means people who went on to reoffend were given the all-clear by the algorithm.
                    </p>
                  </div>

                  <div className="rounded-lg border border-border/60 bg-muted/10 p-4 space-y-2">
                    <p className="text-xs font-semibold">Disparate Impact Ratio (DIR)</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      How many times more likely is one group to be falsely flagged vs the Caucasian baseline?
                    </p>
                    <div className="space-y-1 mt-1">
                      {[
                        { range: "< 0.80×", label: "Under-flagged vs baseline", color: "text-amber-600" },
                        { range: "0.80–1.25×", label: "Within fair threshold", color: "text-emerald-600" },
                        { range: "> 1.25×", label: "Discrimination flag (US 4/5ths)", color: "text-rose-500" },
                      ].map(r => (
                        <div key={r.range} className="flex items-start gap-2">
                          <span className="font-mono text-[10px] w-20 shrink-0 text-muted-foreground">{r.range}</span>
                          <span className={`text-[10px] ${r.color}`}>{r.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-lg border border-border/60 bg-muted/10 p-4 space-y-2">
                    <p className="text-xs font-semibold">The Northpointe rebuttal</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      COMPAS{"'"} makers argued the scores are calibrated — a score of 7 predicts the same reoffending
                      probability regardless of race. They{"'"}re technically right.
                      But calibration and equal FPR are mathematically incompatible when base rates differ.
                      Both sides were correct. That{"'"}s the point.
                    </p>
                  </div>

                </div>
              </div>

            </div>
          </div>
        )}

        {/* Remediation Simulator tab */}
        {pageTab === "remediate" && (() => {
          const groups = [
            { key: "aa" as const,    label: "African-American", ...COMPAS_DATA.byRace[0] },
            { key: "cauc" as const,  label: "Caucasian",        ...COMPAS_DATA.byRace[1] },
            { key: "hisp" as const,  label: "Hispanic",         ...COMPAS_DATA.byRace[2] },
            { key: "other" as const, label: "Other",            ...COMPAS_DATA.byRace[3] },
          ];
          const results = groups.map(g => {
            const t = thresholds[g.key];
            const newFpr = Math.round(fprAt(g.fpr, t) * 10) / 10;
            const newFnr = Math.round(fnrAt(g.fnr, t) * 10) / 10;
            const newFlag = flagRate(newFpr, newFnr, g.recidRate);
            return { ...g, t, newFpr, newFnr, newFlag };
          });
          const caucFlag = results.find(r => r.key === "cauc")!.newFlag;
          const withDir = results.map(r => ({
            ...r,
            newDir: Math.round(calcDir(r.newFlag, caucFlag) * 100) / 100,
          }));
          const maxFpr = Math.max(...withDir.map(r => r.newFpr));
          const minFpr = Math.min(...withDir.map(r => r.newFpr));
          const maxFnr = Math.max(...withDir.map(r => r.newFnr));
          const minFnr = Math.min(...withDir.map(r => r.newFnr));
          const maxDir = Math.max(...withDir.map(r => r.newDir));
          const fprGap = Math.round((maxFpr - minFpr) * 10) / 10;
          const fnrGap = Math.round((maxFnr - minFnr) * 10) / 10;
          const dirPass = maxDir <= 1.25;
          const fprPass = fprGap <= 15;
          const fnrPass = fnrGap <= 15;
          const usPass = withDir.every(r => r.key === "cauc" || r.newDir >= 0.8 || r.newDir <= 1.25);
          const allPass = dirPass && fprPass && fnrPass;

          return (
            <div className="max-w-5xl mx-auto px-6 py-10">
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-3">
                  <h1 className="text-2xl font-bold">COMPAS Remediation Simulator</h1>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${allPass ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-rose-500/10 text-rose-600 border-rose-500/20"}`}>
                    {allPass ? "✓ Passes thresholds" : "✗ Still blocked"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                  Adjust the decision threshold per demographic group. A higher threshold means fewer defendants
                  are flagged high-risk — lowering FPR but raising FNR. The simulator shows whether threshold
                  recalibration alone can bring COMPAS within legal limits.
                </p>
              </div>

              {/* Top: sliders + table side by side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

                {/* Sliders */}
                <div className="rounded-xl border border-border/60 bg-muted/10 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold">Decision threshold per group</p>
                    <button
                      onClick={() => setThresholds({ aa: 5, cauc: 5, hisp: 5, other: 5 })}
                      className="text-[11px] text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
                    >Reset</button>
                  </div>
                  <p className="text-[10px] text-muted-foreground -mt-2">1 = flag everyone · 10 = flag nobody · baseline = 5</p>
                  {withDir.map(g => (
                    <div key={g.key}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium">{g.label}</span>
                        <span className="text-xs font-mono text-muted-foreground">{g.t}</span>
                      </div>
                      <input
                        type="range" min={1} max={10} step={1} value={g.t}
                        onChange={e => setT(g.key, +e.target.value)}
                        className="w-full accent-primary"
                      />
                    </div>
                  ))}
                </div>

                {/* Before / After table */}
                <div className="flex flex-col gap-4">
                  <div className="rounded-xl border border-border/60 overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border/40 bg-muted/20">
                          <th className="text-left px-3 py-2 font-medium text-muted-foreground">Group</th>
                          <th className="text-center px-2 py-2 font-medium text-muted-foreground">FPR →</th>
                          <th className="text-center px-2 py-2 font-medium text-muted-foreground">FNR →</th>
                          <th className="text-center px-2 py-2 font-medium text-muted-foreground">DIR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {withDir.map(g => (
                          <tr key={g.key} className="border-b border-border/30 last:border-0">
                            <td className="px-3 py-2 font-medium text-[11px]">{g.label}</td>
                            <td className="px-2 py-2 text-center text-[11px]">
                              <span className="text-muted-foreground/60">{g.fpr}→</span>
                              <span className={g.newFpr < g.fpr ? "text-emerald-600 font-bold" : g.newFpr > g.fpr ? "text-rose-500 font-bold" : "font-semibold"}>{g.newFpr}%</span>
                            </td>
                            <td className="px-2 py-2 text-center text-[11px]">
                              <span className="text-muted-foreground/60">{g.fnr}→</span>
                              <span className={g.newFnr > g.fnr ? "text-amber-600 font-bold" : g.newFnr < g.fnr ? "text-emerald-600 font-bold" : "font-semibold"}>{g.newFnr}%</span>
                            </td>
                            <td className={`px-2 py-2 text-center font-bold text-[11px] ${g.newDir > 1.25 ? "text-rose-500" : g.newDir < 0.8 ? "text-amber-600" : "text-emerald-600"}`}>
                              {g.newDir.toFixed(2)}×
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Verdict */}
                  <div className={`rounded-xl border p-4 ${allPass ? "border-emerald-500/30 bg-emerald-500/5" : "border-rose-500/30 bg-rose-500/5"}`}>
                    <p className={`text-xs font-bold mb-2 ${allPass ? "text-emerald-600" : "text-rose-600"}`}>
                      {allPass ? "✓ Passes — hold can be lifted" : "✗ Deployment still blocked"}
                    </p>
                    <div className="space-y-1">
                      {[
                        { label: "DIR max", value: `${maxDir.toFixed(2)}×`, threshold: "≤ 1.25×", pass: dirPass },
                        { label: "FPR gap", value: `${fprGap} pp`, threshold: "≤ 15 pp", pass: fprPass },
                        { label: "FNR gap", value: `${fnrGap} pp`, threshold: "≤ 15 pp", pass: fnrPass },
                      ].map(r => (
                        <div key={r.label} className="flex items-center gap-2 text-[11px]">
                          <span>{r.pass ? "✅" : "❌"}</span>
                          <span className="text-muted-foreground w-16">{r.label}</span>
                          <span className={`font-bold ${r.pass ? "text-emerald-600" : "text-rose-500"}`}>{r.value}</span>
                          <span className="text-muted-foreground/50">{r.threshold}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom: explanation cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { title: "Threshold recalibration", body: "A different cutoff score per group. Raising it flags fewer as high-risk — lowering FPR but raising FNR." },
                  { title: "The tradeoff", body: "When base recidivism rates differ across groups, you cannot simultaneously equalise FPR, FNR, and calibration — Chouldechova impossibility theorem." },
                  { title: "What actually fixes it", body: "Retraining with fairness constraints or structured human review. Threshold recalibration is an interim measure only." },
                  { title: "Simulation note", body: "FPR/FNR at non-baseline thresholds use linear interpolation from known anchor points. Actual values need full score distributions.", amber: true },
                ].map(c => (
                  <div key={c.title} className={`rounded-lg border p-3 text-[11px] space-y-1 ${(c as {amber?: boolean}).amber ? "border-amber-500/20 bg-amber-500/5" : "border-border/60 bg-muted/10"}`}>
                    <p className={`font-semibold text-xs ${(c as {amber?: boolean}).amber ? "text-amber-700 dark:text-amber-400" : ""}`}>{c.title}</p>
                    <p className="text-muted-foreground leading-relaxed">{c.body}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Credit Remediation tab */}
        {pageTab === "credit-remediate" && (() => {
          const groups = [
            { key: "white" as const,    label: "White",           baseDenial: 10.4 },
            { key: "black" as const,    label: "Black",           baseDenial: 18.9 },
            { key: "hispanic" as const, label: "Hispanic",        baseDenial: 17.9 },
            { key: "asian" as const,    label: "Asian",           baseDenial: 11.6 },
            { key: "native" as const,   label: "Native American", baseDenial: 27.4 },
          ];
          const results = groups.map(g => {
            const t = creditLeniency[g.key];
            const newDenial = denialAt(g.baseDenial, t);
            const riskIncrease = defaultRiskIncrease(g.baseDenial, newDenial);
            return { ...g, t, newDenial, riskIncrease };
          });
          const whiteDenial = results.find(r => r.key === "white")!.newDenial;
          const withDir = results.map(r => ({
            ...r,
            newDir: r.key === "white" ? 1.00 : Math.round((r.newDenial / whiteDenial) * 100) / 100,
          }));
          const nonWhite = withDir.filter(r => r.key !== "white");
          const maxDir = Math.max(...nonWhite.map(r => r.newDir));
          const totalRisk = Math.round(withDir.reduce((sum, r) => sum + r.riskIncrease, 0) * 10) / 10;
          const dirPass = nonWhite.filter(r => r.newDir > 1.25 && r.key !== "native").length === 0;
          const allPass = dirPass;

          return (
            <div className="max-w-5xl mx-auto px-6 py-10">
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-3">
                  <h1 className="text-2xl font-bold">Credit Scoring Remediation Simulator</h1>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${allPass ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-rose-500/10 text-rose-600 border-rose-500/20"}`}>
                    {allPass ? "✓ Within threshold" : "✗ Still blocked"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                  Adjust approval leniency per demographic group. Higher leniency approves more applicants —
                  reducing denial rate and DIR, but increasing estimated default risk.
                  The simulator shows whether threshold recalibration alone can bring the model within
                  EU AI Act limits, and at what financial cost.
                </p>
              </div>

              {/* Top: sliders + table */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

                {/* Sliders */}
                <div className="rounded-xl border border-border/60 bg-muted/10 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold">Approval leniency per group</p>
                    <button
                      onClick={() => setCreditLeniency({ white: 5, black: 5, hispanic: 5, asian: 5, native: 5 })}
                      className="text-[11px] text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
                    >Reset</button>
                  </div>
                  <p className="text-[10px] text-muted-foreground -mt-2">1 = very strict (more denials) · 10 = very lenient (fewer denials) · baseline = 5</p>
                  {withDir.map(g => (
                    <div key={g.key}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium">{g.label}</span>
                        <span className="text-xs font-mono text-muted-foreground">{g.t}</span>
                      </div>
                      <input
                        type="range" min={1} max={10} step={1} value={g.t}
                        onChange={e => setCL(g.key, +e.target.value)}
                        className="w-full accent-primary"
                      />
                    </div>
                  ))}
                </div>

                {/* Before / After table + verdict */}
                <div className="flex flex-col gap-4">
                  <div className="rounded-xl border border-border/60 overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border/40 bg-muted/20">
                          <th className="text-left px-3 py-2 font-medium text-muted-foreground">Group</th>
                          <th className="text-center px-2 py-2 font-medium text-muted-foreground">Denial →</th>
                          <th className="text-center px-2 py-2 font-medium text-muted-foreground">DIR</th>
                          <th className="text-center px-2 py-2 font-medium text-muted-foreground">Risk +</th>
                        </tr>
                      </thead>
                      <tbody>
                        {withDir.map(g => (
                          <tr key={g.key} className="border-b border-border/30 last:border-0">
                            <td className="px-3 py-2 font-medium text-[11px]">
                              {g.label}
                              {g.key === "native" && <span className="ml-1 text-[10px] text-amber-600">⚠</span>}
                            </td>
                            <td className="px-2 py-2 text-center text-[11px]">
                              <span className="text-muted-foreground/60">{g.baseDenial}→</span>
                              <span className={g.newDenial < g.baseDenial ? "text-emerald-600 font-bold" : g.newDenial > g.baseDenial ? "text-rose-500 font-bold" : "font-semibold"}>{g.newDenial}%</span>
                            </td>
                            <td className={`px-2 py-2 text-center font-bold text-[11px] ${g.newDir > 1.25 ? "text-rose-500" : g.newDir < 0.8 ? "text-amber-600" : "text-emerald-600"}`}>
                              {g.key === "white" ? "1.00×" : `${g.newDir.toFixed(2)}×`}
                            </td>
                            <td className={`px-2 py-2 text-center text-[11px] ${g.riskIncrease > 2 ? "text-rose-500 font-semibold" : g.riskIncrease > 0 ? "text-amber-600" : "text-muted-foreground"}`}>
                              {g.riskIncrease > 0 ? `+${g.riskIncrease} pp` : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Verdict */}
                  <div className={`rounded-xl border p-4 ${allPass ? "border-emerald-500/30 bg-emerald-500/5" : "border-rose-500/30 bg-rose-500/5"}`}>
                    <p className={`text-xs font-bold mb-2 ${allPass ? "text-emerald-600" : "text-rose-600"}`}>
                      {allPass ? "✓ Within EU AI Act threshold" : "✗ Deployment still blocked"}
                    </p>
                    <div className="space-y-1">
                      {[
                        { label: "Max DIR (ex. Native Am.)", value: `${maxDir.toFixed(2)}×`, threshold: "≤ 1.25×", pass: maxDir <= 1.25 },
                        { label: "Black DIR", value: `${withDir.find(r => r.key === "black")!.newDir.toFixed(2)}×`, threshold: "≤ 1.25×", pass: withDir.find(r => r.key === "black")!.newDir <= 1.25 },
                        { label: "Hispanic DIR", value: `${withDir.find(r => r.key === "hispanic")!.newDir.toFixed(2)}×`, threshold: "≤ 1.25×", pass: withDir.find(r => r.key === "hispanic")!.newDir <= 1.25 },
                        { label: "Est. total default risk", value: `+${totalRisk} pp`, threshold: "monitor", pass: totalRisk < 3 },
                      ].map(r => (
                        <div key={r.label} className="flex items-center gap-2 text-[11px]">
                          <span>{r.pass ? "✅" : "❌"}</span>
                          <span className="text-muted-foreground w-40">{r.label}</span>
                          <span className={`font-bold ${r.pass ? "text-emerald-600" : "text-rose-500"}`}>{r.value}</span>
                          <span className="text-muted-foreground/50">{r.threshold}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom: explanation cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { title: "Approval leniency", body: "Raising leniency for a group approves more borderline applicants — lowering their denial rate and DIR vs White. The bank accepts more credit risk in exchange for fairer outcomes." },
                  { title: "The fairness/risk tradeoff", body: "Unlike COMPAS (where the cost is liberty), the tradeoff in lending is financial. Approving riskier applicants increases expected defaults. This is the measurable cost of remediation." },
                  { title: "Why this is interim only", body: "Threshold recalibration treats the symptom, not the cause. Proxy variables (zip code, credit history) still carry racial signal. Real fix: feature audit and fairness-constrained retraining." },
                  { title: "Simulation note", body: "Denial rates at non-baseline leniency use linear interpolation between anchor points. Actual default risk depends on the full score distribution — real values need the model's output probabilities.", amber: true },
                ].map(c => (
                  <div key={c.title} className={`rounded-lg border p-3 text-[11px] space-y-1 ${(c as { amber?: boolean }).amber ? "border-amber-500/20 bg-amber-500/5" : "border-border/60 bg-muted/10"}`}>
                    <p className={`font-semibold text-xs ${(c as { amber?: boolean }).amber ? "text-amber-700 dark:text-amber-400" : ""}`}>{c.title}</p>
                    <p className="text-muted-foreground leading-relaxed">{c.body}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Credit Scoring tab */}
        {pageTab === "credit" && (
          <div className="max-w-5xl mx-auto px-6 py-10">

            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-2xl font-bold">Credit Scoring Fairness Audit</h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border bg-blue-500/10 text-blue-600 border-blue-500/20">Real Data</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                Credit models don{"'"}t use race directly — but they use zip code, employment type, and credit history length.
                These proxy variables correlate so strongly with race that the bias transfers anyway.
                We analyse 138,665 real mortgage applications from New York State (CFPB HMDA 2022) to measure denial rate disparities across demographic groups.
              </p>
            </div>

            {/* Two-column layout */}
            <div className="flex flex-col lg:flex-row gap-8">

              {/* Left: main content */}
              <div className="flex-1 min-w-0 space-y-6">

                {/* How it works */}
                <div className="rounded-xl border border-border/60 bg-muted/10 p-4">
                  <div className="grid grid-cols-3 gap-4 text-xs text-muted-foreground">
                    {[
                      { step: "01 · The Data", text: "CFPB HMDA 2022 — all conventional home purchase loan applications in New York State, n=138,665 after filtering." },
                      { step: "02 · The Metric", text: "Denial rate per demographic group. Disparate Impact Ratio = group denial rate ÷ White denial rate. Threshold: 1.25× (EU AI Act)." },
                      { step: "03 · The Test", text: "Income-controlled DIR: does the disparity persist even within the same income bracket? If yes, income doesn't explain the gap." },
                    ].map(s => (
                      <div key={s.step}>
                        <p className="font-mono text-[10px] text-primary/60 mb-1">{s.step}</p>
                        <p className="leading-relaxed">{s.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Headline finding */}
                <div className="space-y-3">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50">Headline finding — Denial rate by race</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 px-4 py-3">
                      <p className="text-[10px] text-muted-foreground mb-1">Black applicants — denial rate</p>
                      <p className="text-3xl font-bold text-rose-500">18.9%</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">of mortgage applications denied</p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-muted/10 px-4 py-3">
                      <p className="text-[10px] text-muted-foreground mb-1">White applicants — denial rate</p>
                      <p className="text-3xl font-bold">10.4%</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">of mortgage applications denied</p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-0.5">Disparate Impact Ratio — Black</p>
                      <p className="text-2xl font-bold text-rose-500">1.81×</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-rose-600 font-semibold leading-relaxed">
                        A Black applicant is 1.81× more likely to be denied a mortgage than an equivalent White applicant.
                      </p>
                      <p className="text-[10px] text-rose-600/60 mt-1">EU AI Act threshold: 1.25× · This result: 1.81×</p>
                    </div>
                  </div>
                </div>

                {/* Full denial rate table */}
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50 mb-3">All groups · DIR baseline = White · CFPB HMDA 2022 NY</p>
                  <div className="rounded-xl border border-border/60 overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border/40 bg-muted/20">
                          <th className="text-left px-4 py-2 font-semibold">Group</th>
                          <th className="text-right px-3 py-2 font-semibold">n</th>
                          <th className="text-right px-3 py-2 font-semibold">Denial rate</th>
                          <th className="text-right px-3 py-2 font-semibold">DIR</th>
                          <th className="text-right px-3 py-2 font-semibold">4/5ths ratio</th>
                        </tr>
                      </thead>
                      <tbody>
                        {HMDA_METRICS.map(row => (
                          <tr key={row.race} className="border-b border-border/30 last:border-0">
                            <td className="px-4 py-2 font-medium">
                              {row.race}
                              {row.lowN && <span className="ml-1.5 text-[10px] text-amber-600">⚠ low n</span>}
                            </td>
                            <td className="px-3 py-2 text-right text-muted-foreground">{row.n.toLocaleString()}</td>
                            <td className={`px-3 py-2 text-right font-semibold ${row.dir > 1.25 ? "text-rose-500" : "text-foreground"}`}>{row.denialRate}%</td>
                            <td className={`px-3 py-2 text-right font-bold ${row.dir > 1.25 ? "text-rose-500" : row.dir < 0.8 ? "text-amber-600" : "text-emerald-600"}`}>
                              {row.dir.toFixed(2)}×
                            </td>
                            <td className={`px-3 py-2 text-right ${row.approvalRatio < 0.8 ? "text-rose-500 font-semibold" : "text-muted-foreground"}`}>{row.approvalRatio.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-[10px] text-muted-foreground/50 mt-1.5">DIR &gt; 1.25× = over-denied · 4/5ths ratio &lt; 0.80 = US EEOC adverse impact threshold</p>
                </div>

                {/* Income-controlled section */}
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50 mb-3">Income-controlled DIR — does the gap persist within the same income bracket?</p>
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 mb-4">
                    <p className="text-xs font-semibold mb-1.5">The income argument doesn{"'"}t hold</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      If the denial disparity were explained by income differences, controlling for income should reduce the DIR toward 1.0×.
                      Instead, for Black applicants the DIR <em>increases</em> as income rises — reaching 1.94× in the highest income quartile.
                      High-earning Black applicants face greater relative disadvantage than low-earning ones. Income is not the explanation.
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/60 overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border/40 bg-muted/20">
                          <th className="text-left px-4 py-2 font-semibold">Group</th>
                          <th className="text-center px-3 py-2 font-semibold">Q1 (lowest)</th>
                          <th className="text-center px-3 py-2 font-semibold">Q2</th>
                          <th className="text-center px-3 py-2 font-semibold">Q3</th>
                          <th className="text-center px-3 py-2 font-semibold">Q4 (highest)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {HMDA_INCOME_CONTROLLED.map(row => (
                          <tr key={row.race} className="border-b border-border/30 last:border-0">
                            <td className="px-4 py-2 font-medium">{row.race}</td>
                            {row.quartiles.map(q => (
                              <td key={q.q} className="px-3 py-2 text-center">
                                <span className="block text-[10px] text-muted-foreground">{q.denialRate}%</span>
                                <span className={`font-bold text-[11px] ${q.dir > 1.25 ? "text-rose-500" : "text-emerald-600"}`}>{q.dir.toFixed(2)}×</span>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-[10px] text-muted-foreground/50 mt-1.5">Each cell: denial rate (top) · DIR vs White in same income quartile (bottom)</p>
                </div>

                {/* Regulatory verdict */}
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4">
                  <p className="text-xs font-bold text-rose-600 mb-3">Regulatory Verdict — Mortgage Lending Model</p>
                  <div className="space-y-2 mb-3">
                    {[
                      { check: "DIR — Black/White",          value: "1.81×",  threshold: "≤ 1.25× (EU AI Act Annex III)", fail: true },
                      { check: "DIR — Hispanic/White",       value: "1.71×",  threshold: "≤ 1.25× (EU AI Act Annex III)", fail: true },
                      { check: "DIR — Native American",      value: "2.63×",  threshold: "≤ 1.25× — ⚠ low n (n=456)",    fail: true },
                      { check: "US 4/5ths — Black",          value: "0.91",   threshold: "≥ 0.80 (EEOC)",                 fail: false },
                      { check: "ECOA adverse impact — Black", value: "FLAGGED", threshold: "DIR > 1.25×",                  fail: true },
                      { check: "ECOA adverse impact — Hispanic", value: "FLAGGED", threshold: "DIR > 1.25×",               fail: true },
                      { check: "Reg B adverse action notice", value: "Required", threshold: "Must explain all denials",    fail: false },
                    ].map(r => (
                      <div key={r.check} className="flex items-start justify-between gap-2 text-[11px]">
                        <span className="text-muted-foreground flex-1">{r.check}</span>
                        <span className={`font-bold shrink-0 ${r.fail ? "text-rose-500" : "text-emerald-600"}`}>{r.value}</span>
                        <span className={`shrink-0 ${r.fail ? "text-rose-400" : "text-emerald-500"}`}>{r.fail ? "❌" : "✅"}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-rose-600/80 leading-relaxed">
                    Black and Hispanic applicants face statistically significant denial rate disparities that persist after controlling for income.
                    EU AI Act Annex III classifies credit scoring as high-risk — this finding triggers a mandatory conformity assessment before deployment.
                  </p>
                </div>

                {/* Footer */}
                <div className="rounded-xl border border-border/60 bg-muted/10 p-4">
                  <p className="text-xs font-semibold mb-1">Built in Python · Google Colab · CFPB HMDA 2022</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Analysis uses the CFPB Home Mortgage Disclosure Act dataset — all conventional home purchase loan applications in New York State, 2022.
                    Hispanic applicants extracted via derived_ethnicity field (HMDA follows US Census race/ethnicity split).
                    n=138,665 after filtering to decided applications (originated, approved not accepted, denied).
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {["Python", "Pandas", "Google Colab", "CFPB HMDA 2022", "New York State"].map(t => (
                      <span key={t} className="text-[10px] font-mono text-muted-foreground/60 bg-muted/40 px-2 py-0.5 rounded">{t}</span>
                    ))}
                  </div>
                </div>

              </div>

              {/* Right: explanation panel */}
              <div className="lg:w-72 shrink-0">
                <div className="lg:sticky lg:top-24 space-y-4">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50">What the metrics mean</p>

                  <div className="rounded-lg border border-border/60 bg-muted/10 p-4 space-y-2">
                    <p className="text-xs font-semibold">Denial Rate</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      What percentage of applications from this group were denied? A denied mortgage doesn{"'"}t just mean no loan —
                      it can block a family from building wealth through home ownership for years.
                    </p>
                  </div>

                  <div className="rounded-lg border border-border/60 bg-muted/10 p-4 space-y-2">
                    <p className="text-xs font-semibold">Disparate Impact Ratio (DIR)</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Group denial rate ÷ White denial rate. A DIR of 1.81× means Black applicants are denied at 1.81 times the rate of White applicants.
                    </p>
                    <div className="space-y-1 mt-1">
                      {[
                        { range: "< 0.80×", label: "Fewer denials than White baseline", color: "text-emerald-600" },
                        { range: "0.80–1.25×", label: "Within fair threshold", color: "text-emerald-600" },
                        { range: "> 1.25×", label: "EU AI Act adverse impact flag", color: "text-rose-500" },
                      ].map(r => (
                        <div key={r.range} className="flex items-start gap-2">
                          <span className="font-mono text-[10px] w-20 shrink-0 text-muted-foreground">{r.range}</span>
                          <span className={`text-[10px] ${r.color}`}>{r.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-lg border border-border/60 bg-muted/10 p-4 space-y-2">
                    <p className="text-xs font-semibold">Proxy variables</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Credit models can{"'"}t legally use race. But zip code, credit history length, and employment type all correlate
                      with race due to decades of discriminatory policy (redlining, lending exclusions).
                      The model learns from history — and reproduces it.
                    </p>
                  </div>

                  <div className="rounded-lg border border-border/60 bg-muted/10 p-4 space-y-2">
                    <p className="text-xs font-semibold">ECOA + Reg B</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      The Equal Credit Opportunity Act prohibits disparate impact on protected classes. Regulation B requires
                      lenders to send adverse action notices explaining every denial — a black-box AI that can{"'"}t explain its
                      output may violate this regardless of intent.
                    </p>
                  </div>

                </div>
              </div>

            </div>
          </div>
        )}

        {/* Quant Auditor tab */}
        {pageTab === "quant" && <div className="max-w-5xl mx-auto px-6 py-10">

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
        </div>}
      </div>
    </PageGate>
  );
}
