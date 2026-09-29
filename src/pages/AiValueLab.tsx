import { Link } from "react-router-dom";
import { ArrowLeft, Scale, Check } from "lucide-react";
import { PageGate } from "@/components/ui/PageGate";
import { DiagonalWatermark } from "@/components/ui/DiagonalWatermark";
import { useVisitLogger } from "@/hooks/useVisitLogger";

const TAGS = ["Python", "Streamlit", "pytest", "AI value", "Decision support"];

const DESCRIPTION =
  "A decision support framework that estimates where AI creates business value, how much workflow scope is feasible today, what should remain human, and what additional value could become reachable when missing evidence is validated.";

const STACK = "Python · Streamlit · pytest · synthetic planning scenarios";

const GITHUB_URL = "https://github.com/pretzelslab/ai-value-lab";

// Mirrors STATUS_BADGE.live in src/components/portfolio/Projects.tsx (card badge,
// driven by the `status` field on this project in src/data/projects.ts) — kept in sync
// by hand, same as TAGS/DESCRIPTION/HIGHLIGHTS on the other gated pages.
const STATUS_LABEL = "Live";
const STATUS_CLASSES = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";

const HIGHLIGHTS = [
  "Answers 'how much of this workflow can move to AI', not a yes/no automation call",
  "Splits every workflow into feasible today, needs validation, and recommended human",
  "Turns feasible scope into an estimated gross monthly value",
  "Simulates which evidence would unlock more scope, without changing the current decision",
  "Three worked profiles: Payroll, IT service desk, Contract review",
  "Synthetic planning inputs only, not a production readiness claim",
];

// Validated example figures from the ai-value-lab repository. Percentages are shares of the
// workflow. `unlock` = incremental scope reachable once the simulated evidence exists.
type Profile = {
  name: string;
  today: number;
  unlock: number;
  human: number;
  valueToday: string;
  valuePotential: string;
  valueGain: string;
};

const PROFILES: Profile[] = [
  { name: "Payroll", today: 59.5, unlock: 26, human: 14.5, valueToday: "$18,114.38", valuePotential: "$26,466.88", valueGain: "+$8,352.50" },
  { name: "IT service desk", today: 70, unlock: 15, human: 15, valueToday: "$10,833.33", valuePotential: "$13,583.33", valueGain: "+$2,750.00" },
  { name: "Contract review", today: 65, unlock: 20, human: 15, valueToday: "$14,062.50", valuePotential: "$19,312.50", valueGain: "+$5,250.00" },
];

const SECTIONS: { label: string; items: string[] }[] = [
  {
    label: "02 · What this is",
    items: [
      "A framework that looks at one business workflow and says how much of it is realistically suited to AI today.",
      "It also says what is worth validating first, what should stay with people, and what that is worth in monthly terms.",
      "Its main story is AI value: how much, under what conditions, and what would have to become true to do more.",
    ],
  },
  {
    label: "03 · Why it exists",
    items: [
      "AI opportunities are often judged as a binary: automate the workflow or don't.",
      "Real workflows are mixed. Some steps are safe to hand over, some need proof first, and some should stay human.",
      "Breaking the workflow apart gives a more honest number than a single yes or no.",
    ],
  },
  {
    label: "04 · How it works",
    items: [
      "Use case: pick a workflow profile and break it into steps.",
      "Value: estimate the gross monthly value of the work involved.",
      "Feasibility: use risk rules, safeguards and evidence requirements to sort each step into feasible today, needs validation, or recommended human.",
      "Decision: the default stays HOLD FOR EVIDENCE until real evidence exists.",
      "Evidence simulation: pick evidence conditions that could exist, and see how much extra scope they would unlock.",
    ],
  },
  {
    label: "06 · The tradeoff",
    items: [
      "More AI scope is not automatically better.",
      "Extra scope is unlocked only when evidence and safeguards meet the framework's conditions.",
      "Some scope stays human even after the simulated evidence is in place.",
    ],
  },
  {
    label: "07 · What was built",
    items: [
      "Profile driven use case framework",
      "Workflow decomposition",
      "Economic value model",
      "Risk and evidence based routing",
      "Evidence simulation and decision progression",
      "Synthetic planning scenarios",
    ],
  },
  {
    label: "08 · Limitations",
    items: [
      "Inputs are synthetic planning assumptions, not measurements from a real deployment.",
      "There is no live production evidence behind any figure.",
      "The value figures exclude new implementation, evaluation and ongoing assurance costs required to unlock additional scope.",
      "Nothing here claims deployment readiness.",
    ],
  },
];

// ── Section label ───────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50 mb-2">
      {children}
    </p>
  );
}

// ── Shared header (title, description, tags) ─────────────────────────────────
function Header({ preview = false }: { preview?: boolean }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 text-xs font-medium">
          <Scale className="w-3 h-3" /> Enterprise Assessment · AI Value
        </div>
        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${STATUS_CLASSES}`}>
          {STATUS_LABEL}
        </span>
        {preview && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border bg-blue-500/10 text-blue-600 border-blue-500/20">
            Locked
          </span>
        )}
      </div>
      <h1 className="text-3xl font-bold mb-2">AI Value Lab</h1>
      <p className="text-muted-foreground max-w-2xl leading-relaxed">{DESCRIPTION}</p>
      <p className="text-xs font-mono text-muted-foreground/80 mt-2">
        <span className="text-muted-foreground/50 uppercase tracking-widest text-[10px] mr-2">Stack</span>
        {STACK}
      </p>
      <div className="flex flex-wrap items-center gap-1.5 mt-3">
        <span className="text-muted-foreground/50 uppercase tracking-widest text-[10px] font-mono mr-0.5">Topics</span>
        {TAGS.map(t => (
          <span key={t} className="text-[10px] font-mono text-slate-500 dark:text-blue-300/60 bg-slate-500/8 dark:bg-blue-500/8 border border-slate-400/15 dark:border-blue-400/20 px-2 py-0.5 rounded">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Highlights (compact list under header) ────────────────────────────────────
function Highlights() {
  return (
    <div className="mb-9">
      <SectionLabel>Highlights</SectionLabel>
      <ul className="space-y-2">
        {HIGHLIGHTS.map(h => (
          <li key={h} className="flex gap-2 items-start text-sm text-muted-foreground">
            <Check className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
            <span>{h}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Decision chart (inline SVG, same technique as GeoPipeline's chart) ─────────
// One bar per profile: feasible today | scope an evidence simulation could unlock |
// scope that stays human. Bar ends at simulated potential = today + unlock.
function DecisionChart() {
  const X0 = 150;          // bar start (after labels)
  const W = 440;           // width of a 100% bar
  const px = (pct: number) => (pct / 100) * W;
  return (
    <div className="rounded-xl border border-border/60 bg-muted/10 p-4">
      <svg viewBox="0 0 640 210" role="img" aria-labelledby="avlChartTitle" className="w-full h-auto">
        <title id="avlChartTitle">
          Share of workflow scope by AI Value Lab profile. Payroll: feasible today 59.5%, unlockable 26%, stays human 14.5%.
          IT service desk: 70%, 15%, 15%. Contract review: 65%, 20%, 15%.
        </title>
        {PROFILES.map((p, i) => {
          const y = 18 + i * 58;
          const potential = p.today + p.unlock;
          return (
            <g key={p.name}>
              <text x={X0 - 12} y={y + 17} textAnchor="end" fontSize={12} fontFamily="'JetBrains Mono', monospace" fill="hsl(var(--foreground))">
                {p.name}
              </text>
              <rect x={X0} y={y} width={px(p.today)} height={26} rx={3} fill="hsl(var(--primary))" />
              <rect x={X0 + px(p.today)} y={y} width={px(p.unlock)} height={26} fill="hsl(var(--primary))" opacity={0.4} />
              <rect x={X0 + px(potential)} y={y} width={px(p.human)} height={26} rx={3} fill="hsl(var(--muted-foreground))" opacity={0.25} />
              <text x={X0 + px(p.today) / 2} y={y + 17} textAnchor="middle" fontSize={11} fontFamily="'JetBrains Mono', monospace" fill="hsl(var(--primary-foreground))">
                {p.today}%
              </text>
              <text x={X0 + px(p.today) + px(p.unlock) / 2} y={y + 17} textAnchor="middle" fontSize={11} fontFamily="'JetBrains Mono', monospace" fill="hsl(var(--foreground))">
                +{p.unlock}%
              </text>
              <text x={X0} y={y + 40} fontSize={10} fontFamily="'JetBrains Mono', monospace" fill="hsl(var(--muted-foreground))">
                simulated potential {potential}%
              </text>
            </g>
          );
        })}
      </svg>
      <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 mt-3 text-[11px] font-mono text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-primary" /> Feasible today</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-primary/40" /> Unlockable with evidence</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-muted-foreground/25" /> Stays human</span>
      </div>
      <p className="text-center text-[11px] font-mono text-muted-foreground mt-2">
        Simulated planning counterfactual on synthetic inputs. The current decision stays HOLD FOR EVIDENCE.
      </p>
    </div>
  );
}

// ── Static preview (shown behind PageGate) ───────────────────────────────────
function AiValueLabPreview() {
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border/40">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link to="/#projects" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            ← Back to Portfolio
          </Link>
          <span className="text-xs font-mono text-blue-500">Preview</span>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-6 py-10 md:py-24">
        <Header preview />
        <DecisionChart />
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AiValueLab() {
  useVisitLogger("/ai-value-lab");

  return (
    <PageGate pageId="ai-value-lab" backTo="/#projects" previewContent={<AiValueLabPreview />}>
      <div className="min-h-screen bg-background relative">
        <DiagonalWatermark />

        <nav className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur-md border-border/50">
          <div className="max-w-5xl mx-auto px-6 py-4">
            <Link to="/#projects" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Portfolio
            </Link>
          </div>
        </nav>

        <div className="max-w-5xl mx-auto px-6 py-10">

          <Header />
          <Highlights />

          <div className="mb-9">
            <SectionLabel>01 · Decision view</SectionLabel>
            <DecisionChart />
          </div>

          {SECTIONS.slice(0, 3).map(section => (
            <div className="mb-9" key={section.label}>
              <SectionLabel>{section.label}</SectionLabel>
              <div className="rounded-xl border border-border/60 bg-muted/10 p-5">
                <ul className="space-y-3">
                  {section.items.map((item, i) => (
                    <li key={i} className="flex gap-2.5 items-baseline text-sm leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}

          <div className="mb-9">
            <SectionLabel>05 · Worked examples</SectionLabel>
            <div className="rounded-xl border border-border/60 bg-muted/10 p-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {PROFILES.map(p => (
                  <div key={p.name} className="text-sm">
                    <p className="font-semibold mb-2">{p.name}</p>
                    <dl className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex justify-between gap-2"><dt>Estimated gross monthly value today</dt><dd className="font-mono text-foreground shrink-0">{p.valueToday}</dd></div>
                      <div className="flex justify-between gap-2"><dt>Gross monthly value at simulated potential</dt><dd className="font-mono text-foreground shrink-0">{p.valuePotential}</dd></div>
                      <div className="flex justify-between gap-2"><dt>Incremental gross monthly value</dt><dd className="font-mono text-foreground shrink-0">{p.valueGain}</dd></div>
                    </dl>
                  </div>
                ))}
              </div>
              <p className="text-[11px] font-mono text-muted-foreground mt-4">
                Excludes new implementation, evaluation and ongoing assurance costs required to unlock additional scope.
                Gross value, not net ROI.
              </p>
            </div>
          </div>

          {SECTIONS.slice(3).map(section => (
            <div className="mb-9" key={section.label}>
              <SectionLabel>{section.label}</SectionLabel>
              <div className="rounded-xl border border-border/60 bg-muted/10 p-5">
                <ul className="space-y-3">
                  {section.items.map((item, i) => (
                    <li key={i} className="flex gap-2.5 items-baseline text-sm leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}

          <div>
            <SectionLabel>Source</SectionLabel>
            <div className="rounded-xl border border-border/60 bg-muted/10 p-5">
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors no-underline"
              >
                View on GitHub →
              </a>
            </div>
          </div>

        </div>
      </div>
    </PageGate>
  );
}
