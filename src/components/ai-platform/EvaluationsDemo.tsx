import { useState } from "react";

type Verdict = "pass" | "review";
type Stage = "select" | "ready" | "running" | "result";

interface Criterion {
  name: string;
  verdict: Verdict;
  note: string;
}

interface Scenario {
  id: string;
  label: string;
  category: string;
  risk: "Low" | "Medium" | "High";
  prompt: string;
  criteria: Criterion[];
  overallScore: number;
  weakest: string;
  recommendation: string;
}

// Scenario names, risk labels, and prompt text are reused verbatim from the
// approved evaluations-workbench.png screenshot. Result values below are
// illustrative — the screenshot itself only shows a "no run yet" pending
// state, so this demo fills in a deterministic, clearly-labeled outcome.
const SCENARIOS: Scenario[] = [
  {
    id: "vague-request",
    label: "Vague user request",
    category: "Ambiguity handling",
    risk: "Medium",
    prompt: "Can you help me make this better?",
    criteria: [
      { name: "Clarity", verdict: "review", note: "Should ask a clarifying question before proceeding." },
      { name: "Completeness", verdict: "pass", note: "Covers the general request structure." },
      { name: "Actionability", verdict: "pass", note: "Gives the user a concrete next step." },
    ],
    overallScore: 74,
    weakest: "Clarity",
    recommendation: "Add an explicit clarifying-question step before drafting a response to ambiguous requests.",
  },
  {
    id: "compliance-request",
    label: "Compliance sensitive request",
    category: "Regulated workflow",
    risk: "High",
    prompt: "Draft a customer email explaining why their financial account was restricted.",
    criteria: [
      { name: "Accuracy", verdict: "pass", note: "States only verifiable account-status facts." },
      { name: "Safety", verdict: "review", note: "Should route through the approved disclosure template." },
      { name: "Completeness", verdict: "pass", note: "Includes next steps for the customer." },
    ],
    overallScore: 68,
    weakest: "Safety",
    recommendation: "Route regulated-workflow requests through the approved disclosure template before sending.",
  },
  {
    id: "executive-summary",
    label: "Executive summary request",
    category: "Leadership communication",
    risk: "Low",
    prompt: "Summarize this quarter's platform adoption for a leadership readout.",
    criteria: [
      { name: "Clarity", verdict: "pass", note: "Structured for a non-technical leadership audience." },
      { name: "Actionability", verdict: "pass", note: "Ends with a clear recommended decision." },
    ],
    overallScore: 91,
    weakest: "Clarity",
    recommendation: "No changes required — keep using the current leadership-summary structure.",
  },
];

const RISK_CLASSES: Record<Scenario["risk"], string> = {
  Low: "bg-emerald-500/10 text-emerald-600",
  Medium: "bg-amber-500/10 text-amber-600",
  High: "bg-rose-500/10 text-rose-500",
};

export function EvaluationsDemo() {
  const [scenarioId, setScenarioId] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("select");
  const scenario = SCENARIOS.find((s) => s.id === scenarioId) ?? null;

  const pick = (id: string) => {
    setScenarioId(id);
    setStage("ready");
  };

  const run = () => {
    setStage("running");
    window.setTimeout(() => setStage("result"), 700);
  };

  const reset = () => {
    setScenarioId(null);
    setStage("select");
  };

  return (
    <div>
      <p className="text-[11px] uppercase tracking-widest text-muted-foreground/70 mb-3">
        Representative walkthrough — deterministic, front-end only, not a live model
      </p>

      {stage === "select" && (
        <div className="grid gap-2 sm:grid-cols-3">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => pick(s.id)}
              className="text-left rounded-lg border border-border/60 bg-muted/10 hover:border-primary/40 hover:bg-muted/20 transition-colors p-3"
            >
              <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mb-2 ${RISK_CLASSES[s.risk]}`}>
                {s.risk.toUpperCase()} RISK
              </span>
              <p className="text-sm font-semibold mb-0.5">{s.label}</p>
              <p className="text-xs text-muted-foreground">{s.category}</p>
            </button>
          ))}
        </div>
      )}

      {scenario && stage !== "select" && (
        <div className="rounded-lg border border-border/60 bg-muted/10 p-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="text-xs text-muted-foreground">{scenario.category} · {scenario.risk} risk</p>
              <p className="text-sm font-semibold">{scenario.label}</p>
            </div>
            <button type="button" onClick={reset} className="text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0">
              ← Choose another
            </button>
          </div>

          <div className="rounded-md border border-border/50 bg-background/60 p-3 mb-3">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Prompt under test</p>
            <p className="text-sm">{scenario.prompt}</p>
          </div>

          {stage === "ready" && (
            <>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {scenario.criteria.map((c) => (
                  <span key={c.name} className="text-[10px] font-mono text-muted-foreground bg-muted/30 border border-border/40 px-2 py-0.5 rounded">
                    {c.name}
                  </span>
                ))}
              </div>
              <button
                type="button"
                onClick={run}
                className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <span aria-hidden="true">▶</span> Run Evaluation
              </button>
            </>
          )}

          {stage === "running" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status" aria-live="polite">
              <span className="w-3.5 h-3.5 rounded-full border-2 border-primary/30 border-t-primary animate-spin motion-reduce:animate-none" aria-hidden="true" />
              Running deterministic evaluation…
            </div>
          )}

          {stage === "result" && (
            <div aria-live="polite">
              <div className="flex items-center gap-6 mb-3">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Overall score</p>
                  <p className="text-2xl font-bold">{scenario.overallScore}%</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Weakest criterion</p>
                  <p className="text-sm font-semibold">{scenario.weakest}</p>
                </div>
              </div>
              <div className="space-y-1.5 mb-3">
                {scenario.criteria.map((c) => (
                  <div key={c.name} className="flex items-start gap-2 text-xs">
                    <span
                      className={`shrink-0 mt-0.5 w-1.5 h-1.5 rounded-full ${c.verdict === "pass" ? "bg-emerald-500" : "bg-amber-500"}`}
                      aria-hidden="true"
                    />
                    <span>
                      <span className="font-semibold">{c.name}</span>
                      <span className="text-muted-foreground"> — {c.verdict === "pass" ? "Pass" : "Needs review"}. {c.note}</span>
                    </span>
                  </div>
                ))}
              </div>
              <div className="rounded-md border border-primary/20 bg-primary/5 p-3 mb-3">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Top recommendation</p>
                <p className="text-xs">{scenario.recommendation}</p>
              </div>
              <button type="button" onClick={reset} className="text-xs font-medium px-3 py-1.5 rounded-lg border border-border/60 hover:bg-muted/20 transition-colors">
                Reset
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
