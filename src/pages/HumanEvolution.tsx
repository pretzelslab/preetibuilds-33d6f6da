import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, BookOpen, ChevronDown, ChevronUp, Hourglass, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PageGate } from "@/components/ui/PageGate";
import { DiagonalWatermark } from "@/components/ui/DiagonalWatermark";
import { useVisitLogger } from "@/hooks/useVisitLogger";
import { CONFIDENCE_META, EVIDENCE_NOTE, SCENARIOS } from "@/data/humanEvolution";
import type { Confidence } from "@/data/humanEvolution";
import { ScenarioProvider, ScenarioToggle } from "@/components/human-evolution/ScenarioContext";
import { ShortAnswer } from "@/components/human-evolution/ShortAnswer";
import { ImpactsViz } from "@/components/human-evolution/ImpactsViz";
import { TimeTravelViz } from "@/components/human-evolution/TimeTravelViz";
import { PersonasViz } from "@/components/human-evolution/PersonasViz";
import { HumanEvolutionPreview } from "@/components/human-evolution/HumanEvolutionPreview";
import { TierBadge } from "@/components/human-evolution/TierBadge";
import { ConfidenceChip } from "@/components/human-evolution/ConfidenceChip";

const CONFIDENCE_ORDER: Confidence[] = ["high", "medium", "low", "speculative"];

function ReadingGuide() {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-xl border border-border/60 bg-muted/10 mb-8">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-5 py-3 text-sm font-semibold"
        aria-expanded={open}
      >
        <BookOpen className="w-4 h-4 text-muted-foreground" />
        How to read this report
        {open ? <ChevronUp className="w-4 h-4 ml-auto text-muted-foreground" /> : <ChevronDown className="w-4 h-4 ml-auto text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-5 pb-4 grid grid-cols-1 md:grid-cols-3 gap-5 text-xs text-muted-foreground leading-relaxed">
          <div>
            <p className="font-semibold text-foreground mb-1">Three futures, one control</p>
            <p className="mb-1.5">
              Everything on this page is told through three futures — but they are not three equal
              guesses. B is the forecast; A and C mark how far deliberate steering or compounding
              failure could move it. The toggle at the top sets which one every chart and story shows.
            </p>
            {SCENARIOS.map(s => (
              <p key={s.id} className="flex items-start gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1" style={{ background: s.color }} />
                <span><strong className="text-foreground/80">{s.id} · {s.name}</strong> — {s.id === "A" ? "everything that could go right, does." : s.id === "B" ? "where present data says we're heading." : "every safeguard fails at once."}</span>
              </p>
            ))}
          </div>
          <div>
            <p className="font-semibold text-foreground mb-1">Why B is the forecast, not a hedge</p>
            <p>
              Not because it's the safe middle. The optimistic future requires beating attention-economy
              incentives in four areas at once — no past technology managed that. The pessimistic one
              requires every safeguard to fail while countermeasures are already in motion. B requires
              nothing but business as usual: every company, school and government following today's
              incentives. Five separate research areas each landed on this same shape independently —
              and its early indicators are already measurable today.
            </p>
          </div>
          <div>
            <p className="font-semibold text-foreground mb-1">Evidence labels</p>
            <p className="mb-1"><TierBadge tier="know" /> — verified published research. The fact stands on its own.</p>
            <p className="mb-1"><TierBadge tier="suspect" /> — grounded inference: the evidence supports it but doesn't yet prove it.</p>
            <p className="mb-1"><TierBadge tier="imagine" /> — illustrative: scenarios, personas and chart paths. The direction is the claim, never the numbers.</p>
            <p>Every number names its source. Full methodology at the bottom of the page.</p>
          </div>
        </div>
      )}
    </div>
  );
}

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border/60 bg-muted/5 p-10 text-center">
      <p className="text-sm font-semibold mb-1">{title}</p>
      <p className="text-xs text-muted-foreground">In build — arriving in the next session.</p>
    </div>
  );
}

export default function HumanEvolution() {
  useVisitLogger("/human-evolution");

  return (
    <PageGate pageId="human-evolution" backTo="/#projects" previewContent={<HumanEvolutionPreview />}>
      <div className="min-h-screen bg-background relative">
        <DiagonalWatermark />

        {/* Nav */}
        <nav className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur-md border-border/50">
          <div className="w-full px-6 lg:px-12 py-4">
            <Link to="/#projects" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Portfolio
            </Link>
          </div>
        </nav>

        <div className="w-full px-6 lg:px-12 py-10">

          {/* Hero — three columns spanning the full width: title · stakes · verdict */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-10 gap-y-6 items-start mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 text-xs font-medium mb-3">
                <Users className="w-3 h-3" /> Research · Five domains · Three futures
              </div>
              <h1 className="text-3xl font-bold">Human Evolution in the Age of AI</h1>
            </div>

            <div>
              <p className="text-lg text-foreground/90 leading-relaxed mb-3">
                The real AI question isn't whether machines surpass humans — it's which humans get
                stronger with AI and which get hollowed out by it.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                The evidence says that split is already underway — across thinking, creativity, judgment,
                mental health and work. And four institutional choices, not model capability, decide who
                lands on which side.
              </p>
            </div>

            {/* The verdict: what present data actually says, in short sentences */}
            <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/[0.04] p-5">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                Where the data points
              </p>
              <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full flex-shrink-0 bg-yellow-500" />
                Future B — The Great Split. We are already on this path.
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                The signs are measurable now: we check sources half as often when AI answers first ·
                junior hiring down 13% even as juniors get 34% more productive · deepfakes spotted no
                better than a coin flip · 72% of teens talking to AI companions · creative pay falling
                no matter how good you are.
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The good future needs everyone to steer at once — that has never happened. The bad one
                needs every safeguard to fail — protections are already coming. The split needs nothing.
                That is why it's winning.
              </p>
            </div>
          </div>

          {/* One home for the legend: futures, why-B, evidence labels */}
          <ReadingGuide />

          {/* Tabs in narrative order, with the single scenario toggle pinned below the tab bar */}
          <ScenarioProvider>
            <Tabs defaultValue="plain">
              <TabsList className="flex flex-wrap h-auto justify-start gap-1">
                <TabsTrigger value="plain" className="text-xs"><BookOpen className="w-3 h-3 mr-1.5" />The Short Answer</TabsTrigger>
                <TabsTrigger value="impacts" className="text-xs"><Users className="w-3 h-3 mr-1.5" />The Impacts</TabsTrigger>
                <TabsTrigger value="futures" className="text-xs"><Hourglass className="w-3 h-3 mr-1.5" />The Futures</TabsTrigger>
                <TabsTrigger value="people" className="text-xs">The People</TabsTrigger>
                <TabsTrigger value="pareto" className="text-xs">What Matters Most</TabsTrigger>
                <TabsTrigger value="heatmap" className="text-xs">Where It Lands</TabsTrigger>
                <TabsTrigger value="dashboard" className="text-xs">How We'll Know</TabsTrigger>
              </TabsList>

              <ScenarioToggle />

              <TabsContent value="plain"><ShortAnswer /></TabsContent>
              <TabsContent value="impacts"><ImpactsViz /></TabsContent>
              <TabsContent value="futures"><TimeTravelViz /></TabsContent>
              <TabsContent value="people"><PersonasViz /></TabsContent>
              <TabsContent value="pareto"><ComingSoon title="What Matters Most — AI Impact Pareto" /></TabsContent>
              <TabsContent value="heatmap"><ComingSoon title="Where It Lands — Global Risk Heatmap" /></TabsContent>
              <TabsContent value="dashboard"><ComingSoon title="How We'll Know — Human Capability Dashboard" /></TabsContent>
            </Tabs>
          </ScenarioProvider>

          {/* Footer: methodology */}
          <div className="mt-12">
            <Accordion type="single" collapsible>
              <AccordionItem value="methodology">
                <AccordionTrigger className="text-sm">Methodology — how to read this page honestly</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 text-xs text-muted-foreground leading-relaxed">
                    <div>
                      <p className="font-semibold text-foreground mb-1.5">Three evidence tiers</p>
                      <div className="space-y-1.5">
                        <p><TierBadge tier="know" /> — live-verified, peer-reviewed or equivalent sources (RCTs, meta-analyses, national statistics).</p>
                        <p><TierBadge tier="suspect" /> — grounded inference: patterns the evidence supports but doesn't yet prove.</p>
                        <p><TierBadge tier="imagine" /> — scenarios, personas, and trajectory curves: illustrative renderings of the qualitative analysis. Direction is the claim, never the numbers.</p>
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground mb-1.5">Confidence labels</p>
                      <div className="flex flex-wrap gap-2">
                        {CONFIDENCE_ORDER.map(c => (
                          <span key={c} className="inline-flex items-center gap-1.5">
                            <ConfidenceChip confidence={c} showLabel />
                          </span>
                        ))}
                      </div>
                      <p className="mt-1.5">{CONFIDENCE_META.speculative.label} marks values constructed for illustration, not measured.</p>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground mb-1.5">Evidence note</p>
                      <p>{EVIDENCE_NOTE}</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

        </div>
      </div>
    </PageGate>
  );
}
