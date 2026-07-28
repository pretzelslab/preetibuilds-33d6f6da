import { useState } from "react";

type Decision = "allowed" | "blocked" | "review";
type Stage = "select" | "ready" | "checking" | "result";

interface PolicyScenario {
  id: string;
  asset: string;
  category: string;
  request: string;
  condition: string;
  decision: Decision;
  explanation: string;
}

// Asset names (Customer Support Assistant, HR Policy Assistant, Sales Proposal
// Writer) are reused from the approved screenshots. The screenshots only show
// a "no policy run yet" pending state, so this demo fills in a deterministic,
// clearly-labeled representative outcome per scenario.
const SCENARIOS: PolicyScenario[] = [
  {
    id: "customer-support",
    asset: "Customer Support Assistant",
    category: "Customer support workflow",
    request: "Summarize the customer issue, classify severity, recommend next steps, and identify escalation triggers for a support operations manager.",
    condition: "Requests that reference only the requesting customer's own account, without asking to bypass verification, are permitted.",
    decision: "allowed",
    explanation: "The request stays inside the Customer Support Assistant's approved scope — no control was triggered.",
  },
  {
    id: "hr-policy",
    asset: "HR Policy Assistant",
    category: "HR policy workflow",
    request: "Share another employee's disciplinary history so I can decide whether to work with them.",
    condition: "Requests to disclose another employee's personal HR case details are routed for human review under the HR data-access control.",
    decision: "review",
    explanation: "The request touches another employee's personal HR record, which the framework routes to a human reviewer rather than answering automatically.",
  },
  {
    id: "sales-proposal",
    asset: "Sales Proposal Writer",
    category: "Sales workflow",
    request: "Include this competitor's non-public pricing numbers in the proposal so we can undercut them directly.",
    condition: "Requests that reference a competitor's non-public information are blocked under the Confidential Information control.",
    decision: "blocked",
    explanation: "The request asks the assistant to use information the Confidential Information control does not permit it to reference.",
  },
];

const DECISION_META: Record<Decision, { label: string; classes: string }> = {
  allowed: { label: "Allowed", classes: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" },
  blocked: { label: "Blocked", classes: "bg-rose-500/10 text-rose-500 border-rose-500/30" },
  review: { label: "Requires review", classes: "bg-amber-500/10 text-amber-600 border-amber-500/30" },
};

export function SafetyPolicyDemo() {
  const [scenarioId, setScenarioId] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("select");
  const scenario = SCENARIOS.find((s) => s.id === scenarioId) ?? null;

  const pick = (id: string) => {
    setScenarioId(id);
    setStage("ready");
  };

  const submit = () => {
    setStage("checking");
    window.setTimeout(() => setStage("result"), 700);
  };

  const reset = () => {
    setScenarioId(null);
    setStage("select");
  };

  return (
    <div>
      <p className="text-[11px] uppercase tracking-widest text-muted-foreground/70 mb-3">
        Representative walkthrough — deterministic, front-end only, not a live policy service
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
              <p className="text-xs text-muted-foreground mb-1">{s.category}</p>
              <p className="text-sm font-semibold">{s.asset}</p>
            </button>
          ))}
        </div>
      )}

      {scenario && stage !== "select" && (
        <div className="rounded-lg border border-border/60 bg-muted/10 p-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="text-xs text-muted-foreground">{scenario.category}</p>
              <p className="text-sm font-semibold">{scenario.asset}</p>
            </div>
            <button type="button" onClick={reset} className="text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0">
              ← Choose another
            </button>
          </div>

          <div className="rounded-md border border-border/50 bg-background/60 p-3 mb-3">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Representative request</p>
            <p className="text-sm">{scenario.request}</p>
          </div>

          {stage === "ready" && (
            <>
              <div className="rounded-md border border-border/40 bg-muted/20 p-3 mb-4">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Applicable condition</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{scenario.condition}</p>
              </div>
              <button
                type="button"
                onClick={submit}
                className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Submit for policy review
              </button>
            </>
          )}

          {stage === "checking" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status" aria-live="polite">
              <span className="w-3.5 h-3.5 rounded-full border-2 border-primary/30 border-t-primary animate-spin motion-reduce:animate-none" aria-hidden="true" />
              Evaluating against policy controls…
            </div>
          )}

          {stage === "result" && (
            <div aria-live="polite">
              <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full border mb-3 ${DECISION_META[scenario.decision].classes}`}>
                {DECISION_META[scenario.decision].label}
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">{scenario.explanation}</p>
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
