import { Link } from "react-router-dom";
import { useVisitLogger } from "@/hooks/useVisitLogger";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Cell } from "recharts";
import { DiagonalWatermark } from "@/components/ui/DiagonalWatermark";
import { PageGate } from "@/components/ui/PageGate";

const DIR_DATA = [
  { group: "African-American", dir: 1.74, fill: "#ef4444" },
  { group: "Hispanic",         dir: 1.32, fill: "#f59e0b" },
  { group: "Asian",            dir: 0.98, fill: "#22c55e" },
  { group: "Caucasian",        dir: 1.00, fill: "#22c55e" },
];

const PHASES = [
  {
    num: "01",
    title: "Python Data Pipeline",
    subtitle: "pandas · DuckDB · COMPAS dataset",
    body: "Reads the raw COMPAS recidivism audit dataset. Computes three fairness metrics per demographic group: Disparate Impact Ratio (DIR), False Positive Rate, and False Negative Rate. Checks each metric against EU AI Act, ECOA, and NIST thresholds. Outputs a structured audit_report.json.",
    code: `# Key Pandas pattern — groupby + apply
metrics = (
  df.groupby("race")
    .apply(lambda g: pd.Series({
        "fpr":  (g["score_high"] & ~g["recid"]).sum() / (~g["recid"]).sum(),
        "dir":  (g["score_high"].mean()) / baseline_rate
    }))
)`,
    color: "border-violet-500/30 bg-violet-500/5",
    label: "text-violet-400",
  },
  {
    num: "02",
    title: "LangGraph Agent",
    subtitle: "3-node stateful workflow · Claude Haiku",
    body: "Reads audit_report.json. Node 1 assesses each metric against thresholds. Node 2 classifies severity: WARNING · CRITICAL · DOUBLE-CRITICAL. Node 3 routes: warning → monitoring report · critical → compliance report + remediation plan · double-critical → all of above + deployment block memo addressed to Chief Risk Officer.",
    code: `# LangGraph routing — conditional edges
graph.add_conditional_edges(
  "classify",
  lambda state: state["severity"],
  {
    "WARNING":         "generate_monitoring_report",
    "CRITICAL":        "generate_compliance_report",
    "DOUBLE-CRITICAL": "generate_escalation_memo",
  }
)`,
    color: "border-indigo-500/30 bg-indigo-500/5",
    label: "text-indigo-400",
  },
  {
    num: "03",
    title: "GitHub Actions CI/CD",
    subtitle: "Scheduled weekly · auto-commits outputs",
    body: "A GitHub Actions workflow triggers every Monday at 09:00 UTC. It runs the full pipeline and agent automatically, then commits compliance_report.md and escalation_memo.md back to the repository. No human intervention. The outputs become a permanent audit trail — each weekly run is a timestamped, signed record of what the model's fairness metrics were and what action the agent took.",
    code: `# .github/workflows/compliance_monitor.yml
on:
  schedule:
    - cron: "0 9 * * 1"  # Every Monday 09:00 UTC
jobs:
  audit:
    steps:
      - run: python pipeline.py
      - run: python agent.py
      - uses: actions/commit@v3
        with: { message: "Weekly compliance audit" }`,
    color: "border-emerald-500/30 bg-emerald-500/5",
    label: "text-emerald-400",
  },
];

const LANGGRAPH_VS_LANGCHAIN = [
  {
    aspect: "What it is",
    langchain: "A toolkit for connecting LLM calls to tools, retrievers, and chains. Good for linear sequences: retrieve → prompt → respond.",
    langgraph: "A graph-based orchestration layer for multi-step, stateful workflows. Each node is a function; edges define routing logic including conditional branches.",
  },
  {
    aspect: "When to use",
    langchain: "Simple RAG pipelines, single-turn Q&A with tool use, document summarisation.",
    langgraph: "Multi-step processes where the next step depends on the output of the previous one — like a compliance agent that routes differently based on severity.",
  },
  {
    aspect: "State",
    langchain: "Stateless by default — each call is independent unless you explicitly manage memory.",
    langgraph: "Stateful by design — a shared state dict flows through every node, accumulating results at each step.",
  },
  {
    aspect: "Branching",
    langchain: "Hard to branch conditionally — requires custom logic outside the framework.",
    langgraph: "First-class conditional edges — add_conditional_edges() routes to different nodes based on any state value.",
  },
  {
    aspect: "This project uses",
    langchain: "—",
    langgraph: "✓ Assess → Classify → Route (3 conditional paths) — the branching logic is exactly why LangGraph was chosen over LangChain.",
  },
];

// ── Static preview (shown behind PageGate) ─────────────────────────────────────
function ComplianceAgentPreview() {
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-10 z-40 bg-background/95 backdrop-blur border-b border-border/40">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link to="/#projects" className="text-xs text-muted-foreground hover:text-foreground transition-colors">← Back to Portfolio</Link>
          <span className="text-xs font-mono text-violet-400">Preview</span>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-8">

        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[10px] font-mono px-2.5 py-1 rounded-full border border-violet-500/30 text-violet-400 bg-violet-500/10 uppercase tracking-wider">
              Agentic AI · CI/CD · Governance
            </span>
            <span className="text-[10px] font-mono px-2.5 py-1 rounded-full border border-emerald-500/30 text-emerald-400 bg-emerald-500/10 uppercase tracking-wider">
              Preview
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">AI Compliance Monitoring Agent</h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
            An end-to-end agentic pipeline that audits AI model fairness metrics automatically, routes findings by severity,
            and produces compliance-ready reports — without a human in the loop. Runs every week on a schedule.
          </p>
        </div>

        {/* Metric cards — visible */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { value: "3", label: "LangGraph routing paths" },
            { value: "Weekly", label: "Automated run cadence" },
            { value: "0", label: "Human interventions needed" },
          ].map(m => (
            <div key={m.label} className="text-center p-4 rounded-xl border border-border/40 bg-muted/10">
              <div className="text-2xl font-bold text-violet-400">{m.value}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{m.label}</div>
            </div>
          ))}
        </div>

        {/* Pipeline output chart — blurred */}
        <div className="relative rounded-xl border border-border/60 overflow-hidden">
          <div className="bg-muted/10 px-5 py-4">
            <p className="text-xs font-semibold mb-1">Pipeline output — Disparate Impact Ratio by group</p>
            <p className="text-[10px] text-muted-foreground mb-4">African-American DIR 1.74× exceeds EU AI Act 1.25× threshold → DOUBLE-CRITICAL routing</p>
            <div className="blur-sm">
              <div className="h-52 rounded bg-muted/20 flex items-end gap-3 px-6 pb-4">
                <div className="flex-1 bg-rose-500/40 rounded-t" style={{ height: "85%" }} />
                <div className="flex-1 bg-amber-500/40 rounded-t" style={{ height: "65%" }} />
                <div className="flex-1 bg-emerald-500/40 rounded-t" style={{ height: "48%" }} />
                <div className="flex-1 bg-emerald-500/40 rounded-t" style={{ height: "50%" }} />
              </div>
            </div>
          </div>
          <DiagonalWatermark />
        </div>

        {/* Phase titles — visible, bodies blurred */}
        <div className="space-y-3">
          <p className="text-sm font-semibold">How it works — 3 phases</p>
          {PHASES.map(p => (
            <div key={p.num} className={`border rounded-xl p-4 ${p.color}`}>
              <div className="flex items-center gap-3 mb-2">
                <span className={`text-xs font-mono font-bold ${p.label}`}>{p.num}</span>
                <div>
                  <div className="font-semibold text-sm text-foreground">{p.title}</div>
                  <div className={`text-[11px] font-mono ${p.label}`}>{p.subtitle}</div>
                </div>
              </div>
              <div className="blur-sm pl-6">
                <div className="h-3 bg-muted-foreground/20 rounded w-4/5 mb-1.5" />
                <div className="h-3 bg-muted-foreground/20 rounded w-3/5 mb-1.5" />
                <div className="h-3 bg-muted-foreground/20 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function ComplianceAgent() {
  useVisitLogger("/compliance-agent");

  return (
    <PageGate pageId="compliance-agent" backTo="/#projects" previewContent={<ComplianceAgentPreview />}>
      <div className="min-h-screen bg-background text-foreground relative">
        <DiagonalWatermark />

        {/* Nav */}
        <nav className="sticky top-10 z-40 border-b bg-background/95 backdrop-blur border-border/40">
          <div className="max-w-5xl mx-auto px-6 py-3">
            <Link to="/#projects" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              ← Back to Portfolio
            </Link>
          </div>
        </nav>

        <div className="max-w-5xl mx-auto px-6 py-12 space-y-16">

          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full border border-violet-500/30 text-violet-400 bg-violet-500/10 uppercase tracking-wider">
                Agentic AI · CI/CD · Governance
              </span>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full border border-emerald-500/30 text-emerald-400 bg-emerald-500/10 uppercase tracking-wider">
                GitHub: pretzelslab/ai-compliance-agent
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">AI Compliance Monitoring Agent</h1>
            <p className="text-muted-foreground text-base leading-relaxed max-w-3xl">
              An end-to-end agentic pipeline that audits AI model fairness metrics automatically, routes findings by severity,
              and produces compliance-ready reports — without a human in the loop. Runs every week on a schedule.
            </p>
            <div className="flex gap-3 flex-wrap pt-1">
              {["LangGraph", "Python", "GitHub Actions", "Claude Haiku", "Pandas", "COMPAS dataset"].map(t => (
                <span key={t} className="text-[11px] font-mono px-2 py-0.5 rounded border border-border/50 text-muted-foreground bg-muted/20">{t}</span>
              ))}
            </div>
          </div>

          {/* The problem */}
          <div className="border border-border/40 rounded-xl p-6 bg-muted/10 space-y-3">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">The problem this solves</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              AI governance teams need to audit model fairness on a regular cadence — not just once at deployment.
              But running a full audit (pull data → compute metrics → check thresholds → write report → escalate) manually is slow and inconsistent.
              This agent automates the entire cycle. Every Monday it runs the audit, checks EU AI Act and NIST thresholds,
              and commits a signed-off compliance report to the repository. If a metric breaches a threshold, an escalation memo is auto-generated
              and addressed to the Chief Risk Officer.
            </p>
            <div className="grid grid-cols-3 gap-4 pt-2">
              {[
                { value: "3", label: "LangGraph routing paths" },
                { value: "Weekly", label: "Automated run cadence" },
                { value: "0", label: "Human interventions needed" },
              ].map(m => (
                <div key={m.label} className="text-center p-3 rounded-lg border border-border/30 bg-background">
                  <div className="text-xl font-bold text-violet-400">{m.value}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{m.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Live output chart */}
          <div className="space-y-3">
            <h2 className="text-base font-semibold">Pipeline output — Disparate Impact Ratio by group</h2>
            <p className="text-xs text-muted-foreground">
              African-American DIR 1.74× exceeds the EU AI Act 1.25× threshold → agent routes to DOUBLE-CRITICAL → deployment block issued.
            </p>
            <div className="h-52 w-full border border-border/30 rounded-xl p-4 bg-muted/5">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={DIR_DATA} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="group" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <YAxis domain={[0, 2.2]} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <Tooltip
                    contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 12 }}
                    formatter={(v: number) => [`${v.toFixed(2)}×`, "DIR"]}
                  />
                  <ReferenceLine y={1.25} stroke="#f59e0b" strokeDasharray="4 2" label={{ value: "EU AI Act 1.25×", position: "insideTopRight", fontSize: 10, fill: "#f59e0b" }} />
                  <Bar dataKey="dir" radius={[4, 4, 0, 0]}>
                    {DIR_DATA.map((entry, i) => <Cell key={i} fill={entry.fill} fillOpacity={0.85} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Architecture phases */}
          <div className="space-y-4">
            <h2 className="text-base font-semibold">How it works — 3 phases</h2>
            <div className="space-y-4">
              {PHASES.map(p => (
                <div key={p.num} className={`border rounded-xl p-5 space-y-3 ${p.color}`}>
                  <div className="flex items-start gap-3">
                    <span className={`text-xs font-mono font-bold ${p.label} mt-0.5`}>{p.num}</span>
                    <div>
                      <div className="font-semibold text-sm text-foreground">{p.title}</div>
                      <div className={`text-[11px] font-mono ${p.label}`}>{p.subtitle}</div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed pl-6">{p.body}</p>
                  <pre className="text-[11px] font-mono text-muted-foreground bg-background/60 rounded-lg p-3 overflow-x-auto leading-relaxed border border-border/20 pl-6">
                    {p.code}
                  </pre>
                </div>
              ))}
            </div>
          </div>

          {/* LangChain vs LangGraph */}
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-base font-semibold">LangChain vs LangGraph — what's the difference?</h2>
              <p className="text-xs text-muted-foreground">
                Both are from the same team (LangChain Inc). LangChain is the toolkit; LangGraph is the graph orchestration layer built on top of it.
              </p>
            </div>
            <div className="overflow-x-auto rounded-xl border border-border/30">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/30 bg-muted/20">
                    <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground w-32">Aspect</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-blue-400">LangChain</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-violet-400">LangGraph</th>
                  </tr>
                </thead>
                <tbody>
                  {LANGGRAPH_VS_LANGCHAIN.map((row, i) => (
                    <tr key={i} className={`border-b border-border/20 ${i === LANGGRAPH_VS_LANGCHAIN.length - 1 ? "bg-violet-500/5" : ""}`}>
                      <td className="px-4 py-2.5 font-mono text-muted-foreground/70 font-medium">{row.aspect}</td>
                      <td className="px-4 py-2.5 text-muted-foreground leading-relaxed">{row.langchain}</td>
                      <td className="px-4 py-2.5 text-muted-foreground leading-relaxed">{row.langgraph}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* CI/CD explainer */}
          <div className="border border-emerald-500/20 bg-emerald-500/5 rounded-xl p-6 space-y-3">
            <h2 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">What CI/CD means here</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              CI/CD usually means "deploy code when it passes tests." Here it means something different: <strong className="text-foreground">deploy a compliance decision when the data passes audit.</strong>
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The GitHub Actions trigger is <code className="text-xs bg-muted/40 px-1 py-0.5 rounded font-mono">cron: "0 9 * * 1"</code> — every Monday at 09:00 UTC. When it fires, it treats fresh audit data
              the same way a CI/CD pipeline treats fresh code: run the checks, make a decision, commit the result.
              The git history becomes the audit trail — every weekly run is a timestamped, signed record of what the model's fairness metrics were
              and what action the agent took.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-1 text-xs text-muted-foreground">
              <div className="bg-background/60 rounded-lg p-3 border border-border/20">
                <div className="font-semibold text-foreground mb-1">Standard CI/CD</div>
                Code pushed → tests run → deploy if green
              </div>
              <div className="bg-background/60 rounded-lg p-3 border border-emerald-500/20">
                <div className="font-semibold text-emerald-400 mb-1">This agent's CI/CD</div>
                Monday trigger → audit runs → report committed if below threshold · escalation memo if above
              </div>
            </div>
          </div>

          {/* Key Pandas patterns */}
          <div className="space-y-4">
            <h2 className="text-base font-semibold">Key Pandas patterns used</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  title: "groupby + apply",
                  desc: "Groups the dataset by race/gender, then applies a metric function to each group independently. The output is a DataFrame of per-group fairness metrics.",
                  code: "df.groupby('race').apply(compute_metrics)",
                },
                {
                  title: "Threshold comparison",
                  desc: "Vectorised comparison against regulatory thresholds. Returns a boolean Series — True where the metric breaches the threshold — which feeds the severity classifier.",
                  code: "metrics['breach'] = metrics['dir'] > 1.25",
                },
                {
                  title: "to_dict / from_dict",
                  desc: "Serialises the metrics DataFrame to JSON (audit_report.json) for the LangGraph agent to consume, and deserialises the agent's structured output back into a DataFrame for archival.",
                  code: "metrics.to_dict(orient='records')",
                },
              ].map(p => (
                <div key={p.title} className="border border-border/30 rounded-xl p-4 space-y-2 bg-muted/5">
                  <div className="text-xs font-semibold font-mono text-violet-400">{p.title}</div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{p.desc}</p>
                  <code className="text-[10px] font-mono bg-background/80 border border-border/20 rounded px-2 py-1 block text-muted-foreground/80">{p.code}</code>
                </div>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="flex gap-4 flex-wrap pt-2 border-t border-border/30">
            <Link
              to="/research"
              className="text-xs font-medium px-4 py-2 rounded-lg border border-border/40 text-muted-foreground hover:text-foreground hover:border-border transition-colors"
            >
              → Safety Eval Runbooks on Research page
            </Link>
            <Link
              to="/#projects"
              className="text-xs font-medium px-4 py-2 rounded-lg border border-border/40 text-muted-foreground hover:text-foreground hover:border-border transition-colors"
            >
              ← Back to Portfolio
            </Link>
          </div>

        </div>
      </div>
    </PageGate>
  );
}
