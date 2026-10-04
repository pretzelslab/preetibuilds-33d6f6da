import { Link } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVisitLogger } from "@/hooks/useVisitLogger";

// The sample reports are static copies of gtm-trust-kernel's docs/demo files, served as-is from
// public/demos/crm-readiness-scan/. Re-copy them whenever the demo samples are regenerated
// (for example at the next release): the files are byte-identical to the source, never edited here.
const REPORTS_DIR = "/demos/crm-readiness-scan";
const PLAIN_REPORT = `${REPORTS_DIR}/scan-plain.html`;
const FULL_REPORT = `${REPORTS_DIR}/scan.html`;
const CANT_TELL_REPORT = `${REPORTS_DIR}/scan-notes-not-measured-plain.html`;

// The reports carry stable section ids (data-health, verdict-counts, fix-first, use-cases, heatmap,
// details), so each button lands on its section with a plain URL fragment. The reports' own :target
// style outlines the section; keep these ids in step with gtm-trust-kernel's decision view.
const toSection = (file: string, id: string) => `${file}#${id}`;

const QUESTIONS: { label: string; href: string }[] = [
  { label: "Which data needs cleaning first?", href: toSection(PLAIN_REPORT, "data-health") },
  { label: "What should we fix first?", href: toSection(PLAIN_REPORT, "fix-first") },
  { label: "Which AI use cases are ready?", href: toSection(PLAIN_REPORT, "use-cases") },
  { label: "See a ‘Can’t tell yet’ case", href: toSection(CANT_TELL_REPORT, "uc-grounded_account_brief") },
];
const GLANCE_IMAGE = `${REPORTS_DIR}/scan-plain-glance.png`;

// Flip to true once the repository and the npm package are public; the two chips then become links.
const REPO_PUBLIC = false;
const GITHUB_URL = "https://github.com/pretzelslab/gtm-trust-kernel";
const NPM_URL = "https://www.npmjs.com/package/gtm-trust-kernel";

const HEADLINE = "Faster, cleaner deals start with CRM data your sellers can trust.";

const LINES = [
  "Scores your CRM data hygiene against each AI use case, so you know what's ready before you roll AI out.",
  "It reads your CRM, never writes to it, and your CRM records stay on your machine.",
  "Built for RevOps, sales ops and enablement: every use case gets a plain verdict (ready, use with caution, not ready yet) and a short list of what to fix first.",
];

const STACK = "TypeScript · Salesforce adapter · approval-gated AI changes with audit log · MIT";

const STATUS_LABEL = "Building";
// Mirrors STATUS_BADGE.building in src/components/portfolio/Projects.tsx.
const STATUS_CLASSES = "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";

const CHIP = "inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-md border";

function ExternalChip({ label, href }: { label: string; href: string }) {
  if (REPO_PUBLIC) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${CHIP} border-border/60 text-foreground hover:border-border transition-colors`}
      >
        {label} <ArrowUpRight className="w-3 h-3" />
      </a>
    );
  }
  return (
    <span
      aria-disabled="true"
      className={`${CHIP} border-dashed border-border/50 text-muted-foreground/60 cursor-not-allowed select-none`}
    >
      {label} · coming soon
    </span>
  );
}

export default function GtmAiReadiness() {
  useVisitLogger("/gtm-ai-readiness");

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur-md border-border/50">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <Link
            to="/#projects"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Portfolio
          </Link>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-10 md:py-16">
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 text-xs font-medium">
            <Gauge className="w-3 h-3" /> CRM Data Readiness Scan
          </div>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${STATUS_CLASSES}`}>
            {STATUS_LABEL}
          </span>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold mb-4 max-w-3xl leading-tight">{HEADLINE}</h1>
        <div className="space-y-2 max-w-2xl">
          {LINES.map(line => (
            <p key={line} className="text-muted-foreground leading-relaxed">
              {line}
            </p>
          ))}
        </div>

        <div className="mt-8">
          <a
            href={PLAIN_REPORT}
            target="_blank"
            rel="noopener"
            aria-label="Open the plain report for the sample CRM in a new tab"
            className="block max-w-3xl rounded-xl border border-border/60 bg-muted/10 p-3 hover:border-border transition-colors"
          >
            <img
              src={GLANCE_IMAGE}
              alt="The top of the plain-English readiness report for a sample CRM: data health by CRM object, counts of AI use cases that are ready, usable with caution or not ready yet, and a ranked Fix this first list."
              className="w-full h-auto rounded-lg border border-border/40"
              width={1000}
              height={1696}
            />
          </a>
          <p className="text-[11px] font-mono text-muted-foreground mt-2">
            Sample output from synthetic test data. Click to open the report.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-3xl">
          {QUESTIONS.map((q, i) => (
            <Button key={q.label} asChild variant={i === 0 ? "default" : "outline"} className="justify-start h-auto py-3 whitespace-normal text-left">
              <a href={q.href} target="_blank" rel="noopener">
                {q.label}
              </a>
            </Button>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          <a href={FULL_REPORT} target="_blank" rel="noopener" className="underline underline-offset-4 hover:text-foreground transition-colors">
            Full technical report
          </a>
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <ExternalChip label="GitHub" href={GITHUB_URL} />
          <ExternalChip label="npm" href={NPM_URL} />
        </div>

        <p className="text-xs font-mono text-muted-foreground/80 mt-8">
          <span className="text-muted-foreground/50 uppercase tracking-widest text-[10px] mr-2">Stack</span>
          {STACK}
        </p>
      </main>
    </div>
  );
}
