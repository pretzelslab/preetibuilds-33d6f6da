import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  DOMAINS, REGIONS, REGION_DOMAIN_GRID, GRID_SCORE_META, HEATMAP_CAVEAT,
} from "@/data/humanEvolution";
import type { DomainId, GridCell, GridScore, Region, RegionId } from "@/data/humanEvolution";
import { DOMAIN_TITLES } from "./shared";
import { ConfidenceChip } from "./ConfidenceChip";

/**
 * Viz 4 — Global Risk Heatmap ("Where It Lands"). Layman-first: plain-words
 * answer leads, the research grid sits underneath. Two layouts behind a
 * toggle (grid vs by-region accordion) — Preeti picks the survivor on
 * localhost (spec §9.2). All cells are Tier-2 inference; the
 * evidence-exposure inversion caveat renders persistently, never collapsed.
 */

type ViewMode = "grid" | "regions";

type Selection =
  | { kind: "cell"; cell: GridCell }
  | { kind: "region"; region: Region }
  | { kind: "domain"; domainId: DomainId }
  | null;

const GRID_SCORE_ORDER: GridScore[] = [
  "strong-opportunity", "opportunity", "balanced", "risk", "strong-risk", "split",
];

function cellFor(region: RegionId, domain: DomainId): GridCell {
  return REGION_DOMAIN_GRID.find(c => c.region === region && c.domain === domain)!;
}

function cellBackground(score: GridScore): string {
  if (score === "split") {
    // APAC's "both extremes" is a finding, not noise — diagonal two-tone.
    return `linear-gradient(135deg, ${GRID_SCORE_META.opportunity.color}30 50%, ${GRID_SCORE_META.risk.color}30 50%)`;
  }
  return `${GRID_SCORE_META[score].color}26`;
}

function ScoreSymbol({ score }: { score: GridScore }) {
  return (
    <span className="text-base font-bold leading-none" style={{ color: GRID_SCORE_META[score].color }}>
      {GRID_SCORE_META[score].symbol}
    </span>
  );
}

function ScoreLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {GRID_SCORE_ORDER.map(score => (
        <span key={score} className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <ScoreSymbol score={score} /> {GRID_SCORE_META[score].label}
        </span>
      ))}
      <span className="text-[10px] text-muted-foreground/80">
        All cells are grounded inference (Tier 2), 🟡 medium confidence unless marked.
      </span>
    </div>
  );
}

function DetailPanel({ selection, onClose }: { selection: Selection; onClose: () => void }) {
  if (!selection) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 bg-muted/5 p-5 text-xs text-muted-foreground leading-relaxed">
        Click any tile for the full read on that region × life area. Click a region name for its
        profile, or a column header for that life area's research finding.
      </div>
    );
  }

  const close = (
    <button onClick={onClose} className="text-[11px] text-muted-foreground hover:text-foreground ml-auto">
      ✕ close
    </button>
  );

  if (selection.kind === "cell") {
    const { cell } = selection;
    const region = REGIONS.find(r => r.id === cell.region)!;
    const domain = DOMAINS.find(d => d.id === cell.domain)!;
    return (
      <div className="rounded-xl border border-border/60 bg-muted/5 p-5 space-y-3">
        <div className="flex items-start gap-2">
          <div>
            <p className="text-xs font-semibold">{region.label} · {DOMAIN_TITLES[cell.domain]}</p>
            <p className="text-[11px] mt-1 inline-flex items-center gap-1.5">
              <ScoreSymbol score={cell.score} />
              <span style={{ color: GRID_SCORE_META[cell.score].color }} className="font-medium">
                {GRID_SCORE_META[cell.score].label}
              </span>
              <ConfidenceChip confidence={cell.confidence} />
            </p>
          </div>
          {close}
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{cell.note}.</p>
        <div className="border-t border-border/40 pt-3">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">This region overall</p>
          <p className="text-xs text-muted-foreground leading-relaxed mb-1.5">{region.netRead}</p>
          <p className="text-[11px] text-muted-foreground">
            <strong className="text-foreground/80">What it hinges on:</strong> {region.hingeVariable}
          </p>
        </div>
        <p className="text-[10px] text-muted-foreground/70">Source: {domain.doc} + 06_cohorts_regions.md §3</p>
      </div>
    );
  }

  if (selection.kind === "region") {
    const { region } = selection;
    return (
      <div className="rounded-xl border border-border/60 bg-muted/5 p-5 space-y-3">
        <div className="flex items-start gap-2">
          <div>
            <p className="text-xs font-semibold">{region.label}</p>
            <p className="text-[11px] text-muted-foreground italic">{region.epithet}</p>
          </div>
          {close}
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{region.netRead}</p>
        <p className="text-[11px] text-muted-foreground">
          <strong className="text-foreground/80">What it hinges on:</strong> {region.hingeVariable}
        </p>
        <div className="border-t border-border/40 pt-3 space-y-2">
          {(Object.entries(region.dimensions) as [string, string][]).map(([key, text]) => (
            <p key={key} className="text-[11px] text-muted-foreground leading-relaxed">
              <strong className="text-foreground/80 capitalize">{key}:</strong> {text}
            </p>
          ))}
        </div>
      </div>
    );
  }

  const domain = DOMAINS.find(d => d.id === selection.domainId)!;
  return (
    <div className="rounded-xl border border-border/60 bg-muted/5 p-5 space-y-3">
      <div className="flex items-start gap-2">
        <p className="text-xs font-semibold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: domain.color }} />
          {DOMAIN_TITLES[selection.domainId]}
        </p>
        {close}
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{domain.thesis}</p>
      <div className="border-t border-border/40 pt-3">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Key number</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{domain.keyStat.stat}</p>
        <p className="text-[10px] text-muted-foreground/70 mt-1 inline-flex items-center gap-1.5">
          {domain.keyStat.source} <ConfidenceChip confidence={domain.keyStat.confidence} />
        </p>
      </div>
    </div>
  );
}

export function HeatmapViz() {
  const [view, setView] = useState<ViewMode>("grid");
  const [selection, setSelection] = useState<Selection>(null);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-semibold text-sm mb-1">Where it lands</h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          How to read this: the same AI lands very differently depending on where you live. Each tile
          scores one region on one life area — green is opportunity, orange-red is risk, the split
          tile means both extremes at once. This map doesn't change with the future toggle — it shows
          where the stakes sit, whichever path we take.
        </p>
      </div>

      {/* Plain-words layer: the answer before the grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-xl border border-green-500/25 bg-green-500/[0.04] p-5">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Where the biggest gains land</p>
          <p className="text-sm leading-relaxed">
            Africa — the world's youngest population meets near-free tutoring and mental-health
            support, in the places with the fewest teachers and therapists. Latin America has the
            same upside in learning and care.
          </p>
        </div>
        <div className="rounded-xl border border-red-500/25 bg-red-500/[0.04] p-5">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Where the biggest risks land</p>
          <p className="text-sm leading-relaxed">
            The darkest tile on the map is Latin America's information problem: fakes spread inside
            closed chat apps where labels and fact-checks can't reach. North America gets hit first
            on jobs — and Asia Pacific holds both extremes at once.
          </p>
        </div>
        <div className="rounded-xl border border-border/60 bg-muted/5 p-5">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">The catch</p>
          <p className="text-sm leading-relaxed">
            The places with the most at stake have the least research about them. Almost everything
            we know comes from studies of the US and Europe — so trust this map least exactly where
            it matters most.
          </p>
        </div>
      </div>

      {/* View toggle — both layouts built per spec §9.2; Preeti picks on localhost */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-lg border border-border/60 overflow-hidden">
          {([["grid", "Map view"], ["regions", "By region"]] as [ViewMode, string][]).map(([mode, label]) => (
            <button
              key={mode}
              onClick={() => setView(mode)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                view === mode ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
              }`}
              aria-pressed={view === mode}
            >
              {label}
            </button>
          ))}
        </div>
        <ScoreLegend />
      </div>

      {view === "grid" ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">
          {/* Research layer: the grid */}
          <div className="xl:col-span-2 rounded-xl border border-border/60 bg-muted/5 p-4 overflow-x-auto">
            <div className="min-w-[640px] grid grid-cols-[150px_repeat(5,1fr)] gap-1.5">
              <div />
              {DOMAINS.map(d => (
                <button
                  key={d.id}
                  onClick={() => setSelection({ kind: "domain", domainId: d.id })}
                  className="text-[11px] font-semibold text-center px-1 py-1.5 rounded hover:bg-muted/40 transition-colors flex items-center justify-center gap-1.5"
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                  {DOMAIN_TITLES[d.id]}
                </button>
              ))}
              {REGIONS.map(region => (
                <RegionRow
                  key={region.id}
                  region={region}
                  selection={selection}
                  onSelect={setSelection}
                />
              ))}
            </div>
          </div>
          <DetailPanel selection={selection} onClose={() => setSelection(null)} />
        </div>
      ) : (
        /* By-region accordion: the alternative read, also the mobile pattern */
        <Accordion type="single" collapsible className="rounded-xl border border-border/60 bg-muted/5 px-4">
          {REGIONS.map(region => (
            <AccordionItem key={region.id} value={region.id}>
              <AccordionTrigger className="text-xs hover:no-underline">
                <span className="flex flex-wrap items-center gap-2 text-left">
                  <span className="font-semibold">{region.label}</span>
                  <span className="text-muted-foreground italic font-normal">{region.epithet}</span>
                  <span className="inline-flex items-center gap-1.5 ml-1">
                    {DOMAINS.map(d => (
                      <ScoreSymbol key={d.id} score={cellFor(region.id, d.id).score} />
                    ))}
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-xs text-muted-foreground leading-relaxed mb-1.5">{region.netRead}</p>
                <p className="text-[11px] text-muted-foreground mb-3">
                  <strong className="text-foreground/80">What it hinges on:</strong> {region.hingeVariable}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-2">
                  {DOMAINS.map(d => {
                    const cell = cellFor(region.id, d.id);
                    return (
                      <div
                        key={d.id}
                        className="rounded-lg border border-border/40 p-2.5"
                        style={{ background: cellBackground(cell.score) }}
                      >
                        <p className="text-[11px] font-semibold mb-1 flex items-center gap-1.5">
                          <ScoreSymbol score={cell.score} /> {DOMAIN_TITLES[d.id]}
                        </p>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">{cell.note}.</p>
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {/* Honesty furniture — persistent, never collapsed (06 §4.2 mandate) */}
      <p className="text-[10px] text-muted-foreground/80 leading-relaxed border-l-2 border-border/60 pl-3">
        {HEATMAP_CAVEAT}
      </p>
    </div>
  );
}

function RegionRow({ region, selection, onSelect }: {
  region: Region;
  selection: Selection;
  onSelect: (s: Selection) => void;
}) {
  return (
    <>
      <button
        onClick={() => onSelect({ kind: "region", region })}
        className="text-[11px] font-semibold text-left px-2 py-1.5 rounded hover:bg-muted/40 transition-colors"
      >
        {region.label}
        <span className="block text-[10px] text-muted-foreground font-normal italic">{region.epithet}</span>
      </button>
      {DOMAINS.map(d => {
        const cell = cellFor(region.id, d.id);
        const active =
          selection?.kind === "cell" &&
          selection.cell.region === region.id &&
          selection.cell.domain === d.id;
        return (
          <button
            key={d.id}
            onClick={() => onSelect({ kind: "cell", cell })}
            className={`rounded-lg p-2 text-center transition-all border ${
              active ? "border-foreground/50" : "border-transparent hover:border-border"
            }`}
            style={{ background: cellBackground(cell.score) }}
            aria-label={`${region.label}, ${DOMAIN_TITLES[d.id]}: ${GRID_SCORE_META[cell.score].label} — ${cell.note}`}
          >
            <ScoreSymbol score={cell.score} />
            <span className="hidden lg:block text-[10px] text-muted-foreground leading-tight mt-1">{cell.note}</span>
          </button>
        );
      })}
    </>
  );
}
