import { useRef } from "react";
import { useVisitLogger } from "@/hooks/useVisitLogger";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from "recharts";

const nationalTrend = [
  { year: "2013", cases: 33707 },
  { year: "2014", cases: 36735 },
  { year: "2015", cases: 34651 },
  { year: "2016", cases: 38947 },
  { year: "2017", cases: 32559 },
  { year: "2018", cases: 33356 },
  { year: "2019", cases: 32033 },
  { year: "2020", cases: 28046 },
  { year: "2021", cases: 31677 },
  { year: "2022", cases: 31516 },
];

const backlogData = [
  { year: "2013", pending: 100788 },
  { year: "2016", pending: 138792 },
  { year: "2019", pending: 167170 },
  { year: "2022", pending: 198285 },
];

const stateData = [
  { state: "Rajasthan", cases: 5399 },
  { state: "Uttar Pradesh", cases: 3690 },
  { state: "Madhya Pradesh", cases: 3029 },
  { state: "Maharashtra", cases: 2904 },
  { state: "Haryana", cases: 1787 },
  { state: "Odisha", cases: 1464 },
  { state: "Jharkhand", cases: 1298 },
  { state: "Chhattisgarh", cases: 1246 },
  { state: "Delhi", cases: 1212 },
  { state: "Assam", cases: 1113 },
];

const statTiles = [
  { value: "38,947", label: "Peak reported cases (2016)", scrollTo: "chart-trend" },
  { value: "88.7%", label: "Rapes by a known person (2021)", scrollTo: "chart-trend" },
  { value: "12.38%", label: "Max trial completion rate (any year 2013–2022)", scrollTo: "chart-backlog" },
  { value: "198,285", label: "Pending trial backlog (end of 2022)", scrollTo: "chart-backlog" },
];

const Research = () => {
  useVisitLogger("/research");
  const chartRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const scrollTo = (id: string) => {
    chartRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-6 py-16 space-y-12">

        {/* Evaluation Philosophy */}
        <div className="space-y-6">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50 mb-3">Evaluation Philosophy</p>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-4">
              How I think about AI safety evaluation
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
              Most AI fairness work stops at measurement — compute a metric, compare to a threshold, move on.
              That misses the point. A number without a decision framework is not an evaluation. It is a statistic.
              Evaluation means taking a model all the way from measurement to a defensible, documented deployment decision —
              and being able to show your work at every step.
            </p>
          </div>

          {/* The four-stage cycle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                step: "01",
                title: "Audit",
                body: "Measure what the model actually does across demographic groups. Reproduce the numbers independently. Validate against published findings where they exist.",
                color: "border-blue-500/20 bg-blue-500/5",
                label: "text-blue-600 dark:text-blue-400",
              },
              {
                step: "02",
                title: "Safety Eval",
                body: "Apply regulatory thresholds — EU AI Act, ECOA, NIST AI RMF. Document findings formally. Classify severity. Define escalation paths and monitoring cadence.",
                color: "border-amber-500/20 bg-amber-500/5",
                label: "text-amber-600 dark:text-amber-400",
              },
              {
                step: "03",
                title: "Remediation",
                body: "Show what is fixable and at what cost. Threshold recalibration reduces disparity — but surfaces the Chouldechova impossibility: you cannot simultaneously equalise all error rates when base rates differ.",
                color: "border-rose-500/20 bg-rose-500/5",
                label: "text-rose-600 dark:text-rose-400",
              },
              {
                step: "04",
                title: "Cross-domain",
                body: "The same methodology applied to criminal justice (COMPAS, n=6,172) and mortgage lending (HMDA 2022, n=138,665) produces comparable findings. Methodology that only works on one dataset is not a methodology.",
                color: "border-emerald-500/20 bg-emerald-500/5",
                label: "text-emerald-600 dark:text-emerald-400",
              },
            ].map(s => (
              <div key={s.step} className={`rounded-xl border p-4 ${s.color}`}>
                <p className={`text-[10px] font-mono font-bold mb-1 ${s.label}`}>{s.step} · {s.title}</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>

          {/* Key principles */}
          <div className="rounded-xl border border-border/60 bg-muted/10 p-6 space-y-4">
            <p className="text-xs font-semibold">Three principles that guide this work</p>
            <div className="space-y-3">
              {[
                {
                  title: "Fairness is not a single number.",
                  body: "DIR, FPR, and FNR measure different things and can point in opposite directions. A model can pass the US 4/5ths rule and fail the EU AI Act simultaneously. Evaluation requires choosing which constraint binds — and documenting why.",
                },
                {
                  title: "The goal is a defensible decision, not a clean result.",
                  body: "COMPAS was blocked. HMDA showed two groups exceeding the EU AI Act threshold after controlling for income. Those are the right outputs — not evidence of failure, but of a framework that does what it is supposed to do: make the tradeoffs explicit so the organisation can decide with open eyes.",
                },
                {
                  title: "Reproducibility is the floor, not the ceiling.",
                  body: "Every metric in this portfolio can be recomputed from primary sources. COMPAS numbers are validated against ProPublica's published findings within 2–3%. HMDA numbers are derived directly from the CFPB dataset. If you cannot reproduce the result, you cannot trust the evaluation.",
                },
              ].map(p => (
                <div key={p.title} className="flex gap-3 text-xs">
                  <span className="text-primary/40 mt-0.5 shrink-0">→</span>
                  <div>
                    <span className="font-semibold text-foreground">{p.title}</span>
                    <span className="text-muted-foreground leading-relaxed"> {p.body}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tool map */}
          <div className="rounded-xl border border-border/60 bg-muted/10 p-6">
            <p className="text-xs font-semibold mb-4">How the portfolio tools connect</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-muted-foreground">
              <div className="space-y-2">
                <p className="font-semibold text-foreground text-[11px]">Criminal justice</p>
                <div className="space-y-1">
                  {[
                    "Tab 2 · COMPAS Recidivism Audit — n=6,172, 4 demographic groups, DIR 1.92×",
                    "COMPAS Safety Eval Runbook — thresholds, escalation, monitoring cadence",
                    "Tab 3 · COMPAS Remediation — threshold recalibration, Chouldechova limit",
                  ].map(t => (
                    <div key={t} className="flex gap-2">
                      <span className="text-primary/40 shrink-0">·</span>
                      <span className="leading-relaxed">{t}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-foreground text-[11px]">Financial services</p>
                <div className="space-y-1">
                  {[
                    "Tab 4 · Credit Scoring Audit — HMDA 2022, n=138,665, Black DIR 1.81×",
                    "Credit Scoring Safety Eval Runbook — ECOA, Reg B, EU AI Act Annex III",
                    "Tab 5 · Credit Remediation — leniency sliders, fairness/default risk tradeoff",
                  ].map(t => (
                    <div key={t} className="flex gap-2">
                      <span className="text-primary/40 shrink-0">·</span>
                      <span className="leading-relaxed">{t}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-foreground text-[11px]">Foundations</p>
                <div className="space-y-1">
                  {[
                    "Tab 1 · Quantization Auditor — how model compression introduces disparate impact",
                    "Carbon-Fairness Frontier — accuracy, energy, and fairness as a three-way tradeoff",
                    "GitHub: pretzelslab/ai-safety-research — all runbooks and methodology",
                  ].map(t => (
                    <div key={t} className="flex gap-2">
                      <span className="text-primary/40 shrink-0">·</span>
                      <span className="leading-relaxed">{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border/40" />

        {/* Header */}
        <div className="rounded-xl border border-border bg-card p-8 shadow-card">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            India Rape Statistics: NCRB Dataset 2013–2022
          </h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            Empirical research on rape case incidence and justice outcomes in India, built from primary NCRB annual{" "}
            <em>Crime in India</em> reports, cross-verified against CHRI independent analysis (October 2024).
          </p>
          <p className="mt-3 text-xs text-muted-foreground/70">
            Data source: National Crime Records Bureau. Research context: AI safety and real-time threat detection.
          </p>
        </div>

        {/* Stat Tiles */}
        <div className="grid grid-cols-2 gap-4">
          {statTiles.map((tile) => (
            <button
              key={tile.value}
              onClick={() => scrollTo(tile.scrollTo)}
              className="rounded-xl border border-border bg-card p-6 text-left shadow-card transition-colors hover:border-primary/30 hover:shadow-elegant cursor-pointer"
            >
              <p className="text-2xl font-semibold font-mono text-foreground">{tile.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{tile.label}</p>
            </button>
          ))}
        </div>

        {/* Chart 1 */}
        <section ref={(el: HTMLDivElement | null) => { chartRefs.current["chart-trend"] = el; }} className="scroll-mt-8 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">National Trend 2013–2022</h2>
            <p className="text-sm text-muted-foreground">Reported rape cases per year across India.</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 shadow-card">
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={nationalTrend} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 88%)" />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} stroke="hsl(220 10% 50%)" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(220 10% 50%)" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [v.toLocaleString(), "Cases"]} />
                <Line type="monotone" dataKey="cases" stroke="hsl(250 30% 40%)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
            <p className="mt-4 text-xs text-muted-foreground/70 leading-relaxed">
              2017 drop reflects NCRB methodology change, not a real decline. 2020 drop coincides with COVID lockdowns.
            </p>
          </div>
        </section>

        {/* Chart 2 */}
        <section ref={(el: HTMLDivElement | null) => { chartRefs.current["chart-backlog"] = el; }} className="scroll-mt-8 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Justice Pipeline: Trial Backlog Growth</h2>
            <p className="text-sm text-muted-foreground">Cumulative pending rape trials at end of year.</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 shadow-card">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={backlogData} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 88%)" />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} stroke="hsl(220 10% 50%)" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(220 10% 50%)" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [v.toLocaleString(), "Pending"]} />
                <Bar dataKey="pending" fill="hsl(250 30% 40%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <p className="mt-4 text-xs text-muted-foreground/70 leading-relaxed">
              Trial completion rate never exceeded 13% in any year across this period.
            </p>
          </div>
        </section>

        {/* Chart 3 */}
        <section ref={(el: HTMLDivElement | null) => { chartRefs.current["chart-states"] = el; }} className="scroll-mt-8 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Top States by Reported Cases (2022)</h2>
            <p className="text-sm text-muted-foreground">Ten highest-reporting states/UTs.</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 shadow-card">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={stateData} layout="vertical" margin={{ top: 8, right: 16, bottom: 8, left: 100 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 88%)" />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(220 10% 50%)" tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`} />
                <YAxis type="category" dataKey="state" tick={{ fontSize: 12 }} stroke="hsl(220 10% 50%)" width={95} />
                <Tooltip formatter={(v: number) => [v.toLocaleString(), "Cases"]} />
                <Bar dataKey="cases" fill="hsl(165 25% 36%)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Footer note */}
        <footer className="border-t border-border pt-8 pb-4">
          <p className="text-xs text-muted-foreground/60 leading-relaxed">
            All figures sourced from NCRB <em>Crime in India</em> annual reports and cross-verified against CHRI (October 2024).
            Dataset and pipeline code:{" "}
            <a
              href="https://github.com/pretzelslab/india-rape-statistics-ncrb"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground transition-colors"
            >
              github.com/pretzelslab/india-rape-statistics-ncrb
            </a>{" "}
            (available upon request).
          </p>
        </footer>
      </div>

      {/* COMPAS Safety Eval Runbook */}
      <div className="max-w-4xl mx-auto px-6 pb-16 space-y-8">
        <div className="rounded-xl border border-border bg-card p-8 shadow-card">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-600 text-[11px] font-medium mb-3">
                AI Safety · Criminal Justice
              </div>
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                COMPAS Safety Evaluation Runbook
              </h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                A structured deployment evaluation framework for the COMPAS recidivism risk scoring tool.
                Defines fairness metrics, pass/fail thresholds, escalation paths, and monitoring cadence
                against EU AI Act, NIST AI RMF, and US 4/5ths rule standards.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { value: "1.92×", label: "Disparate Impact Ratio", flagged: true },
              { value: "29.5 pp", label: "FPR gap (AA vs Other)", flagged: true },
              { value: "37.6 pp", label: "FNR gap (Other vs AA)", flagged: true },
              { value: "4 Critical", label: "Threshold breaches", flagged: true },
            ].map(t => (
              <div key={t.label} className="rounded-lg border border-rose-500/20 bg-rose-500/5 px-4 py-3">
                <p className="text-lg font-bold text-rose-600">{t.value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{t.label}</p>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-border/60 bg-muted/10 p-4 text-xs text-muted-foreground mb-5">
            <strong className="text-foreground">Verdict: Deployment blocked.</strong> COMPAS fails EU AI Act (DIR 1.92× vs 1.25× threshold),
            US 4/5ths rule (0.52 vs 0.80 required), and internal FPR/FNR gap thresholds — simultaneously overflaging
            African-Americans and underflaging Hispanic and Other defendants.
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://github.com/pretzelslab/ai-safety-research/blob/main/COMPAS_Safety_Eval_Runbook.md"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border/60 bg-background text-xs font-medium text-foreground hover:border-foreground/40 transition-colors"
            >
              View full runbook on GitHub →
            </a>
            <span className="text-[10px] text-muted-foreground">EU AI Act · NIST RMF · n=6,172 records</span>
          </div>
        </div>

        {/* Credit Scoring Safety Eval Runbook */}
        <div className="rounded-xl border border-border bg-card p-8 shadow-card">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 text-[11px] font-medium mb-3">
                AI Safety · Financial Services
              </div>
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                Credit Scoring Fairness Evaluation Runbook
              </h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Fairness evaluation framework for AI-assisted mortgage lending decisions,
                built from real CFPB HMDA 2022 data. Covers denial rate disparities,
                income-controlled analysis, and obligations under EU AI Act Annex III, ECOA, and Regulation B.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { value: "1.81×", label: "Black DIR (EU limit 1.25×)", flagged: true },
              { value: "1.71×", label: "Hispanic DIR", flagged: true },
              { value: "1.94×", label: "Income-controlled DIR (Q4)", flagged: true },
              { value: "3 Groups", label: "Exceed EU AI Act threshold", flagged: true },
            ].map(t => (
              <div key={t.label} className="rounded-lg border border-rose-500/20 bg-rose-500/5 px-4 py-3">
                <p className="text-lg font-bold text-rose-600">{t.value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{t.label}</p>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-muted-foreground mb-5">
            <strong className="text-foreground">Key finding: income doesn't explain the gap.</strong> Black applicants
            in the highest income quartile face a DIR of 1.94× — higher than the lowest quartile (1.55×).
            Proxy discrimination via zip code and credit history length is the likely mechanism.
            EU AI Act conformity assessment triggered. ECOA adverse impact flagged for Black and Hispanic applicants.
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://github.com/pretzelslab/ai-safety-research/blob/main/Credit_Scoring_Safety_Eval_Runbook.md"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border/60 bg-background text-xs font-medium text-foreground hover:border-foreground/40 transition-colors"
            >
              View full runbook on GitHub →
            </a>
            <span className="text-[10px] text-muted-foreground">EU AI Act Annex III · ECOA · Reg B · n=138,665 records</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Research;
