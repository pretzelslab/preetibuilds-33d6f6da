import { COHORTS, CONFIDENCE_META, DOMAINS, SCENARIOS } from "@/data/humanEvolution";
import { COHORT_COLORS, DOMAIN_TITLES } from "./shared";

/**
 * Shared legend strip (S9 explanation layer, spec §7): one component, four
 * standard blocks — domain colors · generation colors · the three futures ·
 * confidence labels. Each tab renders only the blocks its visuals use, in its
 * header area. Compact one-row-that-wraps layout; all content from the data
 * file, nothing hardcoded.
 */

type LegendBlock = "domains" | "cohorts" | "scenarios" | "confidence";

const SCENARIO_HINT: Record<string, string> = {
  A: "best case",
  B: "current path",
  C: "worst case",
};

function BlockLabel({ children }: { children: string }) {
  return (
    <span className="text-[10px] uppercase tracking-widest text-muted-foreground/70 mr-1">
      {children}
    </span>
  );
}

export function VizLegend({ blocks }: { blocks: LegendBlock[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border border-border/40 bg-muted/5 px-4 py-2.5 mb-5">
      {blocks.includes("domains") && (
        <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
          <BlockLabel>Life areas</BlockLabel>
          {DOMAINS.map(d => (
            <span key={d.id} className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
              {DOMAIN_TITLES[d.id]}
            </span>
          ))}
        </span>
      )}
      {blocks.includes("cohorts") && (
        <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
          <BlockLabel>Generations</BlockLabel>
          {COHORTS.map(c => (
            <span key={c.id} className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COHORT_COLORS[c.id] }} />
              {c.label} ({c.ages2026} in 2026)
            </span>
          ))}
        </span>
      )}
      {blocks.includes("scenarios") && (
        <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
          <BlockLabel>The three futures</BlockLabel>
          {SCENARIOS.map(s => (
            <span key={s.id} className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
              {s.id} · {s.name} <span className="text-muted-foreground/60">({SCENARIO_HINT[s.id]})</span>
            </span>
          ))}
        </span>
      )}
      {blocks.includes("confidence") && (
        <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
          <BlockLabel>Evidence</BlockLabel>
          {(["high", "medium", "low", "speculative"] as const).map(c => (
            <span key={c} className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              {CONFIDENCE_META[c].emoji} {CONFIDENCE_META[c].label}
            </span>
          ))}
        </span>
      )}
    </div>
  );
}
