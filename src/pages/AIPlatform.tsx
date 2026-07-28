import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { DiagonalWatermark } from "@/components/ui/DiagonalWatermark";
import { useVisitLogger } from "@/hooks/useVisitLogger";

const TECH_STACK = ["TypeScript", "React", "Next.js", "Tailwind CSS", "Node test runner", "Playwright"];

const KEY_CAPABILITIES = [
  "Explore registered AI workspaces and the relationships between them.",
  "Compare deterministic evaluation and red-team findings before a decision.",
  "Review policy mappings, approvals, evidence, and accountable ownership separately but in context.",
  "Trace runtime signals and incidents to recommended follow-up work.",
  "Connect portfolio health, value, transformation, and executive decisions to their supporting context.",
];

const SCREENSHOT_NOTE = "Screens shown here are from a deterministic portfolio demonstration, not live enterprise activity.";

function Screenshot({
  src, alt, caption, width, height,
}: { src: string; alt: string; caption: string; width: number; height: number }) {
  return (
    <figure className="my-4">
      <div className="rounded-xl border border-border/60 overflow-hidden bg-muted/10">
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading="lazy"
          className="w-full h-auto block"
        />
      </div>
      <figcaption className="mt-2 text-xs text-muted-foreground leading-relaxed">{caption}</figcaption>
    </figure>
  );
}

function SectionHeading({ children }: { children: ReactNode }) {
  return <h2 className="text-xl font-semibold mb-3 mt-10">{children}</h2>;
}

export default function AIPlatform() {
  useVisitLogger("/ai-platform");

  return (
    <div className="min-h-screen bg-background relative">
      <DiagonalWatermark />

      <nav className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur-md border-border/50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link to="/#projects" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Portfolio
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* Hero */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-xs font-medium mb-3">
            Portfolio Case Study · Enterprise AI Platform
          </div>
          <h1 className="text-3xl font-bold mb-3">AI Platform Engineering Lab</h1>
          <p className="text-lg text-foreground/90 leading-relaxed mb-3">
            A deterministic interactive demonstration connecting AI design, evaluation, governance,
            operations, evidence, and executive decision workflows.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            An enterprise AI platform concept made tangible through connected, inspectable workflows
            for design, testing, governance, runtime review, and decision-making.
          </p>
        </div>

        <Screenshot
          src="/images/projects/ai-platform/platform-overview.png"
          alt="AI Platform Engineering Lab overview showing a sidebar and a grid of connected workspace modules."
          caption="A connected map of specialist AI platform workspaces."
          width={1440}
          height={1000}
        />
        <p className="text-xs text-muted-foreground/70 italic -mt-2 mb-8">{SCREENSHOT_NOTE}</p>

        {/* Overview */}
        <SectionHeading>Overview</SectionHeading>
        <p className="text-muted-foreground leading-relaxed">
          AI Platform Engineering Lab turns a broad enterprise AI operating model into an interactive,
          reviewable product demonstration. It shows how specialist AI workspaces can stay distinct
          while sharing the context needed to evaluate assets, apply policy, review evidence, respond
          to incidents, and support accountable decisions. It is intended for recruiters, product and
          program leaders, AI governance practitioners, platform engineers, transformation leaders, and
          technical reviewers.
        </p>

        {/* Problem */}
        <SectionHeading>The problem</SectionHeading>
        <p className="text-muted-foreground leading-relaxed">
          Enterprise AI initiatives are often presented as disconnected tools or abstract diagrams.
          Teams need a clearer way to see how a prompt, an evaluation result, a policy decision, an
          operational signal, and an executive choice relate to one another without losing the
          ownership of each workflow.
        </p>

        {/* Platform scope */}
        <SectionHeading>Platform scope</SectionHeading>
        <p className="text-muted-foreground leading-relaxed">
          The demonstration covers discovery, prompt design, experimentation, evaluation, red teaming,
          policy, approvals, lifecycle, observability, incidents, evidence, audit, value, transformation,
          and decision trace. It demonstrates the operating model around AI work; it does not claim live
          integrations, deployed controls, or production usage.
        </p>

        {/* Key workflows */}
        <SectionHeading>Key workflows</SectionHeading>
        <p className="text-muted-foreground leading-relaxed mb-4">
          The platform organizes those relationships into connected workspaces with deterministic
          records, explicit navigation context, and visible evidence trails. It is designed to help
          reviewers explore how platform engineering, governance, operations, and leadership decisions
          can fit together.
        </p>
        <ul className="space-y-2 mb-2">
          {KEY_CAPABILITIES.map((c) => (
            <li key={c} className="flex items-start gap-2 text-sm text-muted-foreground leading-relaxed">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500/60 shrink-0 mt-1.5" />
              {c}
            </li>
          ))}
        </ul>
        <Screenshot
          src="/images/projects/ai-platform/command-center.png"
          alt="Command Center dashboard showing platform health, active incidents, approval decisions, and operational risks."
          caption="A command-center view connects platform operations and decision context."
          width={1440}
          height={1100}
        />

        {/* Architecture (expandable) */}
        <div className="mt-10">
          <Accordion type="single" collapsible>
            <AccordionItem value="architecture">
              <AccordionTrigger className="text-sm font-semibold">Architecture &amp; system design</AccordionTrigger>
              <AccordionContent>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  The application uses a shared shell and validated registries to compose specialist
                  workspaces. Domain-specific records preserve the meaning of evaluations, policies,
                  evidence, approvals, incidents, and decisions, while explicit URLs and metadata make
                  cross-workspace context inspectable.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Selected workspace highlights */}
        <SectionHeading>Selected workspace highlights</SectionHeading>
        <p className="text-muted-foreground leading-relaxed mb-2">
          Deterministic evaluation and policy workspaces give reviewers concrete evidence of product
          depth beyond the platform map.
        </p>
        <Screenshot
          src="/images/projects/ai-platform/evaluations-workbench.png"
          alt="Evaluation workbench showing a prompt under test, enterprise test cases, risk labels, and scorecard criteria."
          caption="Deterministic evaluation cases make review criteria visible before deployment decisions."
          width={1440}
          height={1000}
        />
        <Screenshot
          src="/images/projects/ai-platform/safety-policy-engine.png"
          alt="Safety and Policy Engine showing a selected AI asset, policy rules, control mapping, and remediation guidance."
          caption="Policy review stays connected to assets, controls, and remediation guidance."
          width={1440}
          height={1000}
        />

        {/* Interactive demonstration */}
        <SectionHeading>Interactive demonstration</SectionHeading>
        <p className="text-muted-foreground leading-relaxed">
          Use the platform overview to orient visitors, then follow one path through evaluation, policy,
          runtime observation, and executive review. Guided walkthrough and demonstration modes provide
          optional structure for visitors who want a deeper tour.
        </p>

        {/* Implementation notes (expandable) */}
        <div className="mt-10">
          <Accordion type="single" collapsible>
            <AccordionItem value="implementation">
              <AccordionTrigger className="text-sm font-semibold">Implementation notes</AccordionTrigger>
              <AccordionContent>
                <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                  The experience is built as a local TypeScript, React, and Next.js application with
                  deterministic fixtures and browser-based presentation state. This approach makes
                  walkthroughs repeatable and lets reviewers inspect relationships without representing
                  simulated values as live operational data.
                </p>
                <Screenshot
                  src="/images/projects/ai-platform/runtime-observability.png"
                  alt="Runtime observability view showing deterministic traces, health indicators, safety interventions, drift signals, and active incidents."
                  caption="Runtime review brings trace signals, safety interventions, and incident context into one view."
                  width={1440}
                  height={1200}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Validation evidence */}
        <SectionHeading>Validation evidence</SectionHeading>
        <p className="text-muted-foreground leading-relaxed mb-4">
          At the frozen source baseline, TypeScript validation, linting, four deterministic unit checks,
          the production build, and all 17 Playwright tests completed successfully. The route sweep
          passed its 47 registered routes, 9 deep links, and expected 404 check.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
          <div className="rounded-lg border border-border/60 p-4">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Browser tests</p>
            <p className="text-sm font-semibold">17 tests passed in 7 files</p>
          </div>
          <div className="rounded-lg border border-border/60 p-4">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Production build</p>
            <p className="text-sm font-semibold">Next.js 15.5.20 production build generated 55 static pages without warnings</p>
          </div>
          <div className="rounded-lg border border-border/60 p-4 sm:col-span-2">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Route validation</p>
            <p className="text-sm font-semibold">47 routes and 9 deep links returned HTTP 200, with one intentional missing route returning HTTP 404</p>
          </div>
          <div className="rounded-lg border border-border/60 p-4 sm:col-span-2">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Frozen application baseline</p>
            <p className="text-sm font-semibold font-mono">25fc287f</p>
          </div>
        </div>

        {/* Limitations and disclosures */}
        <SectionHeading>Limitations &amp; disclosures</SectionHeading>
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.04] p-5">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            Scope &amp; data disclosure
          </p>
          <p className="text-sm text-foreground/90 leading-relaxed">
            This project is a portfolio demonstration built with deterministic, simulated data. Its
            workflows demonstrate enterprise AI platform concepts across design, evaluation, governance,
            operations, evidence, and decisions. It is not connected to live enterprise systems and is
            not presented as a deployed production SaaS platform. Validation evidence applies to frozen
            source baseline <code className="font-mono text-xs">25fc287f</code>, and the screenshots
            represent the validated demonstration state. The demonstration should not be interpreted as
            evidence of live customer usage.
          </p>
        </div>

        {/* Technology */}
        <SectionHeading>Technology</SectionHeading>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {TECH_STACK.map((t) => (
            <span key={t} className="text-[10px] font-mono text-slate-500 dark:text-blue-300/60 bg-slate-500/8 dark:bg-blue-500/8 border border-slate-400/15 dark:border-blue-400/20 px-2 py-0.5 rounded">
              {t}
            </span>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 rounded-xl border border-border/60 bg-muted/10 p-6 text-center">
          <p className="text-sm text-foreground/90 leading-relaxed mb-4">
            Explore the workflows to see how a deterministic platform demonstration can make AI delivery,
            governance, and operational context more concrete.
          </p>
          <Link
            to="/#projects"
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-500 hover:text-blue-400 transition-colors no-underline"
          >
            ← Back to Portfolio
          </Link>
        </div>

      </div>
    </div>
  );
}
