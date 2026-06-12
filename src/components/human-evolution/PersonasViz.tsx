import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { COHORTS, PERSONAS, RATING_META, REGIONS, SCENARIOS, VARIABLES } from "@/data/humanEvolution";
import type { Persona } from "@/data/humanEvolution";
import { useScenario } from "./ScenarioContext";
import { TierBadge } from "./TierBadge";
import { COHORT_COLORS } from "./shared";

function PersonaCard({ persona, onOpen }: { persona: Persona; onOpen: () => void }) {
  const { scenario } = useScenario();
  const region = REGIONS.find(r => r.id === persona.region)!;
  const cohort = COHORTS.find(c => c.id === persona.cohort)!;
  const activeScenario = SCENARIOS.find(s => s.id === scenario)!;

  return (
    <button
      onClick={onOpen}
      className="text-left rounded-xl border border-border/60 bg-muted/5 p-5 transition-all hover:border-foreground/30 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <h3 className="font-semibold text-base">{persona.name}</h3>
          <p className="text-xs text-muted-foreground">Age {persona.age2026} in 2026 · {persona.role}</p>
        </div>
        <TierBadge tier="imagine" label="Illustrative persona (Tier 3)" />
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className="inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full border border-border/60 text-muted-foreground">
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: COHORT_COLORS[persona.cohort] }} />
          {cohort.label}
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full border border-border/60 text-muted-foreground">{region.label}</span>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed mb-3 italic">{persona.tagline}</p>

      <div
        key={scenario}
        className="rounded-lg bg-muted/20 border border-border/40 p-3 animate-in fade-in duration-300"
      >
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: activeScenario.color }} />
          In {activeScenario.id} · {activeScenario.name}
        </p>
        <p className="text-xs leading-relaxed">{persona.arcs[scenario]}</p>
      </div>

      <p className="text-[10px] text-muted-foreground mt-3">Click for the evidence behind this story →</p>
    </button>
  );
}

function PersonaDetail({ persona }: { persona: Persona }) {
  const { scenario } = useScenario();
  const cohort = COHORTS.find(c => c.id === persona.cohort)!;
  const region = REGIONS.find(r => r.id === persona.region)!;

  return (
    <div className="space-y-5">
      {/* Grounding — the narrative's tether to real data */}
      <div className="rounded-lg bg-muted/20 border border-border/40 p-3">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Grounded in</p>
        <p className="text-xs leading-relaxed">{persona.groundedIn}</p>
      </div>

      {/* Cohort matrix row — real Tier-2 data */}
      <div>
        <p className="text-xs font-semibold mb-2">{cohort.label} ({cohort.ages2026} in 2026) — how this generation is rated across seven risk areas <span className="font-normal text-muted-foreground">(evidence-based)</span></p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {VARIABLES.map(v => {
            const r = cohort.ratings[v.id];
            const meta = RATING_META[r.rating];
            return (
              <div key={v.id} className="flex items-center justify-between gap-2 rounded-lg bg-muted/15 border border-border/30 px-3 py-2" title={`${meta.label} · ${r.driver}`}>
                <span className="text-[11px] text-muted-foreground">{v.label}</span>
                <span className="text-xs font-bold" style={{ color: meta.color }}>{meta.symbol}</span>
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5">Hover a row for the evidence driver behind each rating.</p>
      </div>

      {/* All three arcs side by side */}
      <div>
        <p className="text-xs font-semibold mb-2">{persona.name} in all three futures</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {SCENARIOS.map(s => (
            <div
              key={s.id}
              className={`rounded-lg border p-3 ${s.id === scenario ? "border-foreground/40 bg-muted/25" : "border-border/40 bg-muted/10"}`}
            >
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
                {s.id} · {s.name}{s.id === scenario && " · viewing"}
              </p>
              <p className="text-[11px] leading-relaxed">{persona.arcs[s.id]}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground leading-relaxed">
        Region context: {region.label} — {region.epithet.toLowerCase()}. Hinge: {region.hingeVariable.toLowerCase()}.
      </p>
    </div>
  );
}

// ── Viz 2 — Future Personas ───────────────────────────────────────────────────
export function PersonasViz() {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = PERSONAS.find(p => p.id === openId) ?? null;

  return (
    <div>
      <div className="mb-4">
        <h2 className="font-semibold text-sm mb-1">Four people, three futures</h2>
        <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
          How to read this: four fictional people, each grounded in real evidence about their generation.
          Switch the future above and watch the same life land differently. Click a card for the evidence
          behind the story.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {PERSONAS.map(p => (
          <PersonaCard key={p.id} persona={p} onOpen={() => setOpenId(p.id)} />
        ))}
      </div>

      <Dialog open={!!open} onOpenChange={v => { if (!v) setOpenId(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {open && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 flex-wrap">
                  {open.name}
                  <TierBadge tier="imagine" label="Illustrative persona (Tier 3)" />
                </DialogTitle>
                <DialogDescription>
                  Age {open.age2026} in 2026 · {open.role} · {REGIONS.find(r => r.id === open.region)!.label}
                </DialogDescription>
              </DialogHeader>
              <PersonaDetail persona={open} />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
