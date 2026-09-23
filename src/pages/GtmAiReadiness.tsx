import { Link } from "react-router-dom";
import { ArrowLeft, Gauge, Check } from "lucide-react";
import { PageGate } from "@/components/ui/PageGate";
import { DiagonalWatermark } from "@/components/ui/DiagonalWatermark";
import { useVisitLogger } from "@/hooks/useVisitLogger";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";

const TAGS = ["AI readiness", "CRM data quality", "RevOps"];

const DESCRIPTION =
  "Scores a sales team's CRM data hygiene and flags which common AI use cases that data is ready for, and what to fix first.";

// From gtm-trust-kernel/packages/readiness/package.json + root package.json + src/report/cli.ts.
const STACK = "TypeScript · Node.js (tsx CLI) · Vitest · self-contained HTML reports";

const PLAIN_IMAGE_SRC = "/images/projects/gtm-ai-readiness/readiness-report-healthy.png";
const DETAIL_IMAGE_SRC = "/images/projects/gtm-ai-readiness/readiness-report-healthy-detail.png";

// Mirrors STATUS_BADGE.building in src/components/portfolio/Projects.tsx (card badge,
// driven by the `status` field on this project in src/data/projects.ts) — kept in sync
// by hand here since this page hardcodes its own copy of the card's content, same as
// TAGS/DESCRIPTION/HIGHLIGHTS above.
const STATUS_LABEL = "Building";
const STATUS_CLASSES = "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";

const HIGHLIGHTS = [
  "Privacy-first: runs locally, read-only, no CRM data leaves the machine",
  "Deterministic scoring across 7 data dimensions, 316 tests",
  "Measures cross-system joinability instead of consolidating data",
  "Fail-safe: autonomous CRM writes never rated ready without human review",
  "Dual output: plain-English summary for leaders, detail table for RevOps",
  "CRM-agnostic adapter layer; Salesforce read-only connector in progress",
];

const SECTIONS: { label: string; items: string[] }[] = [
  {
    label: "02 · What this is",
    items: [
      "A free check a sales team runs on their own CRM before buying AI sales tools.",
      "It says, use case by use case: ready, use with caution, or not ready. It also says why and what to fix.",
      "It runs on your laptop, only reads data, and nothing leaves your machine.",
    ],
  },
  {
    label: "03 · Why it exists",
    items: [
      "Companies buy AI sales tools and they quietly underperform. The usual cause is messy data, not the AI.",
      "Common problems: close dates already in the past, deals with no logged activity, and a CRM and email tool that don't agree on who's who.",
      "No vendor tells you upfront which share of your pipeline lacks the data AI needs. This does.",
    ],
  },
  {
    label: "04 · How it works",
    items: [
      "It reads samples from the CRM and connected tools, but never merges them.",
      "It scores 7 areas (coverage, freshness, hygiene, history, cross-system match, and more) with plain math. No AI is used in scoring, so results are repeatable.",
      "Leaders get a plain-English summary. Ops teams get the detailed table.",
      "Built-in safety rule: AI writing into the CRM is never marked ready unless a person checks every change.",
    ],
  },
  {
    label: "05 · Real-world use case",
    items: [
      "A VP of Sales is about to sign for an AI forecasting tool. The check takes minutes.",
      "It shows a big chunk of open deals have stale close dates, so forecasting AI would just be guessing.",
      "They fix the data first, or buy a tool that fits what they actually have. That saves the money and the awkward QBR.",
    ],
  },
  {
    label: "06 · Bigger picture",
    items: [
      "This is the front door to the Deal Review Copilot, a trust layer where AI suggestions to the CRM are checked, logged, and reversible.",
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
          <Gauge className="w-3 h-3" /> Product Intelligence · CRM Data Readiness
        </div>
        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${STATUS_CLASSES}`}>
          {STATUS_LABEL}
        </span>
        {preview && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border bg-blue-500/10 text-blue-600 border-blue-500/20">
            Preview
          </span>
        )}
      </div>
      <h1 className="text-3xl font-bold mb-2">CRM Data Readiness Scan</h1>
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
      {/* Preview-only: desktop has ~199px of headroom above the fade start here
          (verified live), enough for 3 compact lines. Mobile has only ~21px —
          doesn't fit without pushing the header into the fade zone, so hidden there. */}
      {preview && (
        <ul className="hidden md:block space-y-1 mt-4">
          {HIGHLIGHTS.slice(0, 3).map(h => (
            <li key={h} className="flex gap-2 items-start text-xs text-muted-foreground">
              <Check className="w-3 h-3 text-blue-500 shrink-0 mt-0.5" />
              <span>{h}</span>
            </li>
          ))}
        </ul>
      )}
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

const REPORT_IMAGES: { src: string; alt: string; label: string }[] = [
  { src: PLAIN_IMAGE_SRC, alt: "GTM AI Readiness plain-English report, healthy fixture", label: "Leader summary" },
  { src: DETAIL_IMAGE_SRC, alt: "GTM AI Readiness detailed tabular report, healthy fixture", label: "RevOps detail" },
];

// ── Two report images, side by side on desktop, stacked on mobile ────────────
// Shared by the locked preview and the unlocked page's "Sample output" section
// — identical markup both places. Fade (locked preview only) comes entirely
// from PageGate's mask on its outer container, not from anything here, so the
// unlocked page renders this with no fade automatically. Each image opens
// full-size in a shadcn Dialog lightbox (click outside / Esc / the Dialog's
// own close button all close it — all built into src/components/ui/dialog.tsx
// already, untouched here).
function ReportImages({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {REPORT_IMAGES.map(img => (
          <div key={img.label}>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50 mb-1.5">
              {img.label}
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="block w-full rounded-xl border border-border/60 bg-muted/10 p-3 hover:border-border transition-colors"
                >
                  <img
                    src={img.src}
                    alt={img.alt}
                    className="w-full aspect-[1488/580] object-cover object-top rounded-lg border border-border/40"
                  />
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] sm:max-w-[90vw] lg:max-w-4xl max-h-[90vh] overflow-auto p-2">
                <DialogTitle className="sr-only">{img.label} — full size</DialogTitle>
                <img src={img.src} alt={img.alt} className="w-full h-auto max-h-[85vh] object-contain rounded-md" />
              </DialogContent>
            </Dialog>
          </div>
        ))}
      </div>
      <p className="text-center text-[11px] font-mono text-muted-foreground mt-3">
        Sample output from a synthetic test fixture.
      </p>
    </div>
  );
}

// ── Static preview (shown behind PageGate) ───────────────────────────────────
function GtmAiReadinessPreview() {
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
        <ReportImages className="mt-4 md:mt-10" />
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function GtmAiReadiness() {
  useVisitLogger("/gtm-ai-readiness");

  return (
    <PageGate pageId="gtm-ai-readiness" backTo="/#projects" previewContent={<GtmAiReadinessPreview />}>
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
            <SectionLabel>01 · Sample output</SectionLabel>
            <ReportImages />
          </div>

          {SECTIONS.map(section => (
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

        </div>
      </div>
    </PageGate>
  );
}
