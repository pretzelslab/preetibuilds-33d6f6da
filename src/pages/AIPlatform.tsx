import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { DiagonalWatermark } from "@/components/ui/DiagonalWatermark";
import { useVisitLogger } from "@/hooks/useVisitLogger";
import { AIPlatformWalkthrough } from "@/components/ai-platform/Walkthrough";

const TECH_STACK = ["TypeScript", "React", "Vite", "Tailwind CSS", "Vitest"];

const KEY_CAPABILITIES = [
  "Explore registered AI workspaces and the relationships between them.",
  "Compare deterministic evaluation and red-team findings before a decision.",
  "Review policy mappings, approvals, evidence, and accountable ownership separately but in context.",
  "Trace runtime signals and incidents to recommended follow-up work.",
  "Connect portfolio health, value, transformation, and executive decisions to their supporting context.",
];

const SCREENSHOT_NOTE = "Screens shown here are from a deterministic portfolio demonstration, not live enterprise activity.";

function SectionHeading({ children }: { children: ReactNode }) {
  return <h2 className="text-xl font-semibold tracking-tight mb-3 mt-10">{children}</h2>;
}

function Prose({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`text-sm text-muted-foreground leading-relaxed ${className}`}>{children}</p>;
}

export default function AIPlatform() {
  useVisitLogger("/ai-platform");

  return (
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

        {/* Hero */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-xs font-medium mb-3">
            Portfolio Case Study · Enterprise AI Platform
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-3">AI Platform Engineering Lab</h1>
          <p className="text-lg text-foreground/90 leading-relaxed mb-3 max-w-3xl">
            A deterministic interactive demonstration connecting AI design, evaluation, governance,
            operations, evidence, and executive decision workflows.
          </p>
          <Prose className="max-w-3xl">
            An enterprise AI platform concept made tangible through connected, inspectable workflows
            for design, testing, governance, runtime review, and decision-making.
          </Prose>
        </div>

        {/* Overview */}
        <SectionHeading>Overview</SectionHeading>
        <Prose>
          AI Platform Engineering Lab turns a broad enterprise AI operating model into an interactive,
          reviewable product demonstration. It shows how specialist AI workspaces can stay distinct
          while sharing the context needed to evaluate assets, apply policy, review evidence, respond
          to incidents, and support accountable decisions. It is intended for recruiters, product and
          program leaders, AI governance practitioners, platform engineers, transformation leaders, and
          technical reviewers.
        </Prose>

        {/* Problem */}
        <SectionHeading>The problem</SectionHeading>
        <Prose>
          Enterprise AI initiatives are often presented as disconnected tools or abstract diagrams.
          Teams need a clearer way to see how a prompt, an evaluation result, a policy decision, an
          operational signal, and an executive choice relate to one another without losing the
          ownership of each workflow.
        </Prose>

        {/* Platform scope */}
        <SectionHeading>Platform scope</SectionHeading>
        <Prose>
          The demonstration covers discovery, prompt design, experimentation, evaluation, red teaming,
          policy, approvals, lifecycle, observability, incidents, evidence, audit, value, transformation,
          and decision trace. It demonstrates the operating model around AI work; it does not claim live
          integrations, deployed controls, or production usage.
        </Prose>

        {/* Key workflows */}
        <SectionHeading>Key workflows</SectionHeading>
        <Prose className="mb-4">
          The platform organizes those relationships into connected workspaces with deterministic
          records, explicit navigation context, and visible evidence trails. It is designed to help
          reviewers explore how platform engineering, governance, operations, and leadership decisions
          can fit together.
        </Prose>
        <ul className="space-y-2 mb-2">
          {KEY_CAPABILITIES.map((c) => (
            <li key={c} className="flex items-start gap-2 text-sm text-muted-foreground leading-relaxed">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500/60 shrink-0 mt-1.5" />
              {c}
            </li>
          ))}
        </ul>

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

        {/* Interactive demonstration — full canvas width, not constrained to the prose column */}
        <SectionHeading>Interactive demonstration</SectionHeading>
        <Prose className="mb-2">
          Use the platform overview to orient yourself, then step through evaluation, policy, and
          runtime review in order. Each stage unlocks the next once you've seen it — a guided tour
          rather than an all-at-once dump of screens.
        </Prose>
        <p className="text-xs text-muted-foreground/70 italic mb-5">{SCREENSHOT_NOTE}</p>
        <AIPlatformWalkthrough />

        {/* Limitations and disclosures */}
        <SectionHeading>Limitations &amp; disclosures</SectionHeading>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
          Scope &amp; data disclosure
        </p>
        <Prose>
          This project is a portfolio demonstration built with deterministic, simulated data. Its
          workflows demonstrate enterprise AI platform concepts across design, evaluation, governance,
          operations, evidence, and decisions. It is not connected to live enterprise systems and is
          not presented as a deployed production SaaS platform. Validation evidence applies to frozen
          source baseline <code className="font-mono text-xs">25fc287f</code>, and the screenshots
          represent the validated demonstration state. The demonstration should not be interpreted as
          evidence of live customer usage.
        </Prose>

        {/* Technology */}
        <SectionHeading>Technology</SectionHeading>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {TECH_STACK.map((t) => (
            <span key={t} className="text-[11px] font-mono px-2 py-0.5 rounded border border-border/50 text-muted-foreground bg-muted/20">
              {t}
            </span>
          ))}
        </div>

      </div>
    </div>
  );
}
