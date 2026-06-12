import { useMemo } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  DOMAINS, INDICATORS, MASTER_VARIABLES, DASHBOARD_READING_RULE, SCENARIOS,
} from "@/data/humanEvolution";
import type { DomainId, Indicator } from "@/data/humanEvolution";
import { DOMAIN_TITLES } from "./shared";
import { useScenario } from "./ScenarioContext";

/**
 * Viz 5 — Human Capability Dashboard ("How We'll Know"). The falsifiability
 * layer: 18 observable indicators, grouped by life area in an accordion
 * (Preeti's §9.1 decision — grouped read beats pagination). Layman-first:
 * plain-words answer leads, the indicator table sits underneath. The active
 * scenario from the global toggle highlights its confirming cluster rows.
 */

const CLUSTER_META = {
  A: { color: "#16a34a", label: "Good-path sign", plain: "moving = we're steering well" },
  C: { color: "#ef4444", label: "Warning sign", plain: "moving = safeguards are failing" },
  context: { color: "#9ca3af", label: "Context", plain: "tells us which reading is right" },
} as const;

const TIMELINE_YEARS = [2027, 2028, 2029, 2030, 2031];

function scenarioColor(id: "A" | "B" | "C") {
  return SCENARIOS.find(s => s.id === id)!.color;
}

function IndicatorRow({ indicator, highlighted }: { indicator: Indicator; highlighted: boolean }) {
  const meta = CLUSTER_META[indicator.cluster];
  return (
    <div
      className={`rounded-lg border-l-2 pl-3 pr-3 py-2.5 transition-colors ${
        highlighted ? "bg-muted/30" : "bg-muted/5"
      }`}
      style={{ borderLeftColor: meta.color }}
    >
      <div className="flex flex-wrap items-start gap-x-3 gap-y-1">
        <span className="text-[10px] font-mono font-semibold text-muted-foreground mt-0.5 w-7 flex-shrink-0">
          {indicator.id}{indicator.id === "L2" ? " ★" : ""}
        </span>
        <div className="flex-1 min-w-[240px]">
          <p className="text-xs leading-snug">
            {indicator.indicator}
            {indicator.id === "L2" && (
              <span className="text-[10px] text-muted-foreground"> — the most direct test of this report's central claim</span>
            )}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
            <strong className="text-foreground/70">What movement means:</strong> {indicator.signal}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">watch by</p>
          <p className="text-xs font-semibold">{indicator.by}</p>
          <p className="text-[10px] text-muted-foreground max-w-[140px] leading-tight mt-0.5">{indicator.watch}</p>
        </div>
      </div>
    </div>
  );
}

export function DashboardViz() {
  const { scenario } = useScenario();

  const byDomain = useMemo(() => {
    const groups = new Map<DomainId, Indicator[]>();
    DOMAINS.forEach(d => groups.set(d.id, []));
    // Each indicator files under its primary (first-listed) life area.
    INDICATORS.forEach(ind => groups.get(ind.domains[0])!.push(ind));
    return groups;
  }, []);

  // A and C have confirming clusters; B is confirmed by divergence between them.
  const highlightCluster = scenario === "B" ? null : scenario;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-semibold text-sm mb-1">How we'll know</h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          How to read this: we don't have to wait twenty years to find out which future we're in.
          The 18 signs below are all publicly measurable, and most show movement by 2028–2029. This
          tab is the report's promise to be provably wrong — if the signs move against us, the
          forecast fails in the open.
        </p>
      </div>

      {/* Plain-words layer: the answer before the table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-xl border border-green-500/25 bg-green-500/[0.04] p-5">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Signs we're steering well</p>
          <p className="text-sm leading-relaxed">
            Schools start testing thinking without AI in the room. Fact-checking gets taught like a
            subject. "Verified human" becomes a label worth paying for. Therapy bots get covered by
            health insurance.
          </p>
        </div>
        <div className="rounded-xl border border-red-500/25 bg-red-500/[0.04] p-5">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Warning signs</p>
          <p className="text-sm leading-relaxed">
            Even fewer people click through to real sources. Junior hiring keeps shrinking. More
            teens prefer AI conversation to human. Real evidence gets dismissed as fake in courts
            and elections.
          </p>
        </div>
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/[0.04] p-5">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">The rule</p>
          <p className="text-sm leading-relaxed">
            No single sign decides it — clusters do. And if the good signs show up only in rich,
            well-run places while the warning signs show up everywhere, that's not a draw: that
            <em> is</em> the Great Split confirming itself.
          </p>
        </div>
      </div>

      {/* The four levers (master variables) */}
      <div>
        <p className="text-xs font-semibold mb-2">The four levers that decide which future wins</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {MASTER_VARIABLES.map(mv => (
            <div key={mv.id} className="rounded-xl border border-border/60 bg-muted/5 p-4">
              <p className="text-xs font-semibold mb-1.5">
                <span className="font-mono text-muted-foreground mr-1.5">{mv.id}</span>
                {mv.label}
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed mb-1.5">{mv.question}</p>
              <p className="text-[10px] text-muted-foreground/80">
                <strong className="text-foreground/70">Sets:</strong> {mv.sets}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Cluster reading rule — scenario-aware */}
      <div className="rounded-xl border border-border/60 bg-muted/10 p-5">
        <p className="text-xs font-semibold mb-2">No single indicator decides a scenario — clusters do.</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-2">
          {(Object.keys(CLUSTER_META) as (keyof typeof CLUSTER_META)[]).map(key => (
            <span key={key} className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: CLUSTER_META[key].color }} />
              <strong className="text-foreground/80">{CLUSTER_META[key].label}</strong> — {CLUSTER_META[key].plain}
            </span>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">{DASHBOARD_READING_RULE}</p>
        <p className="text-[11px] mt-2 inline-flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: scenarioColor(scenario) }} />
          {scenario === "B" ? (
            <span className="text-muted-foreground">
              Future B (selected) has no cluster of its own — <strong className="text-foreground/80">divergence between the two clusters is the B signal.</strong>
            </span>
          ) : (
            <span className="text-muted-foreground">
              Future {scenario} (selected) — its confirming rows are highlighted below.
            </span>
          )}
        </p>
      </div>

      {/* Research layer: 18 indicators grouped by life area (accordion per §9.1) */}
      <Accordion type="multiple" defaultValue={DOMAINS.map(d => d.id)} className="rounded-xl border border-border/60 bg-muted/5 px-4">
        {DOMAINS.map(domain => {
          const indicators = byDomain.get(domain.id) ?? [];
          if (!indicators.length) return null;
          return (
            <AccordionItem key={domain.id} value={domain.id}>
              <AccordionTrigger className="text-xs hover:no-underline">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: domain.color }} />
                  <span className="font-semibold">{DOMAIN_TITLES[domain.id]}</span>
                  <span className="text-muted-foreground font-normal">{indicators.length} signs to watch</span>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {indicators.map(ind => (
                    <IndicatorRow
                      key={ind.id}
                      indicator={ind}
                      highlighted={highlightCluster !== null && ind.cluster === highlightCluster}
                    />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {/* Timeline strip: when the evidence arrives */}
      <div className="rounded-xl border border-border/60 bg-muted/5 p-5">
        <p className="text-xs font-semibold mb-3">When the evidence arrives</p>
        <div className="grid grid-cols-5 gap-2">
          {TIMELINE_YEARS.map(year => (
            <div key={year} className="text-center">
              <p className="text-xs font-semibold mb-2">{year}</p>
              <div className="flex flex-wrap justify-center gap-1.5 min-h-[24px]">
                {INDICATORS.filter(i => i.by === year).map(i => (
                  <span
                    key={i.id}
                    title={i.indicator}
                    className="inline-flex items-center justify-center text-[9px] font-mono font-semibold text-white rounded-full w-7 h-5"
                    style={{ background: CLUSTER_META[i.cluster].color }}
                  >
                    {i.id}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground/80 mt-3">
          Most of the evidence lands in 2028–2029 — this report's claims face their test inside three years, not twenty.
        </p>
      </div>

      <p className="text-[10px] text-muted-foreground/80 leading-relaxed border-l-2 border-border/60 pl-3">
        Every row is observable public data — surveys, payroll records, education statistics, market
        reports. ★ L2 (variance, not average, of reasoning scores) is the single most direct test of
        the Great Split thesis.
      </p>
    </div>
  );
}
