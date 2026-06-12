import { useMemo, useState } from "react";
import {
  ComposedChart, Bar, Line, Cell, XAxis, YAxis,
  ResponsiveContainer, Tooltip, CartesianGrid,
} from "recharts";
import { DOMAINS, PARETO_IMPACTS, CONFIDENCE_META } from "@/data/humanEvolution";
import type { DomainId, ParetoImpact } from "@/data/humanEvolution";
import { DOMAIN_TITLES } from "./shared";
import { TierBadge } from "./TierBadge";
import { ConfidenceChip } from "./ConfidenceChip";

/**
 * Viz 3 — AI Impact Pareto ("What Matters Most"). Layman-first per standing
 * rule: plain-words answer leads, the research chart sits underneath. All
 * plain copy is a presentation-layer restatement of PARETO_IMPACTS — no new
 * claims. Magnitudes are illustrative analytic weights (Tier 3), never
 * measurements; the axis label and caption say so persistently.
 */

type TypeFilter = "all" | "risk" | "opportunity";

const TYPE_OPTIONS: { id: TypeFilter; label: string }[] = [
  { id: "all", label: "All 15" },
  { id: "risk", label: "Risks" },
  { id: "opportunity", label: "Opportunities" },
];

const EVIDENCE_OPACITY: Record<string, number> = { high: 1, medium: 0.75, low: 0.5, speculative: 0.4 };

function domainOf(id: DomainId) {
  return DOMAINS.find(d => d.id === id)!;
}

function truncate(text: string, max = 48) {
  return text.length <= max ? text : text.slice(0, max - 1).trimEnd() + "…";
}

interface ParetoRow extends ParetoImpact {
  shortLabel: string;
  cumulative: number; // running share of total weight, % of the visible set
}

const ParetoTooltip = ({ active, payload }: {
  active?: boolean;
  payload?: { payload: ParetoRow }[];
}) => {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  const domain = domainOf(row.domain);
  return (
    <div className="rounded-lg border border-border/60 bg-background/95 backdrop-blur px-3 py-2.5 max-w-xs shadow-md">
      <p className="text-xs font-semibold mb-1.5 leading-snug">{row.label}</p>
      <p className="text-[11px] text-muted-foreground mb-0.5 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: domain.color }} />
        {DOMAIN_TITLES[row.domain]} · {row.type === "risk" ? "Risk" : "Opportunity"}
      </p>
      <p className="text-[11px] text-muted-foreground mb-0.5">
        Illustrative weight: <strong className="text-foreground/80">{row.magnitude}</strong> / 100 ·
        running total {row.cumulative}%
      </p>
      <p className="text-[11px] text-muted-foreground mb-1.5">
        {CONFIDENCE_META[row.evidence].emoji} {CONFIDENCE_META[row.evidence].label} evidence
      </p>
      <p className="text-[10px] text-muted-foreground/80 leading-relaxed border-t border-border/40 pt-1.5">
        {row.basis}
      </p>
    </div>
  );
};

export function ParetoViz() {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [activeDomains, setActiveDomains] = useState<Set<DomainId>>(
    () => new Set(DOMAINS.map(d => d.id))
  );

  const rows = useMemo<ParetoRow[]>(() => {
    const visible = PARETO_IMPACTS
      .filter(p => (typeFilter === "all" || p.type === typeFilter) && activeDomains.has(p.domain))
      .sort((a, b) => b.magnitude - a.magnitude);
    const total = visible.reduce((sum, p) => sum + p.magnitude, 0);
    let running = 0;
    return visible.map(p => {
      running += p.magnitude;
      return { ...p, shortLabel: truncate(p.label), cumulative: total ? Math.round((running / total) * 100) : 0 };
    });
  }, [typeFilter, activeDomains]);

  // The Pareto read for the plain layer: share of total weight carried by the top 5 of all 15.
  const topFiveShare = useMemo(() => {
    const sorted = [...PARETO_IMPACTS].sort((a, b) => b.magnitude - a.magnitude);
    const total = sorted.reduce((s, p) => s + p.magnitude, 0);
    const top5 = sorted.slice(0, 5).reduce((s, p) => s + p.magnitude, 0);
    return Math.round((top5 / total) * 100);
  }, []);

  const toggleDomain = (id: DomainId) => {
    setActiveDomains(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size === 1) return new Set(DOMAINS.map(d => d.id)); // never filter to nothing
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-semibold text-sm mb-1">What matters most</h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          How to read this: we mapped the 15 biggest ways AI could change human life — good and bad —
          and weighed how much each one matters. The list isn't even: a few impacts carry most of the
          weight. This ranking doesn't change with the future toggle — it's about what matters, not
          which path we take.
        </p>
      </div>

      {/* Plain-words layer: the answer before the chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-xl border border-red-500/25 bg-red-500/[0.04] p-5">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">The biggest worry</p>
          <p className="text-sm leading-relaxed">
            Young people aged 13–25 growing up letting AI do their thinking — during the exact years
            thinking skills are supposed to form. It tops the list because the harm would be hardest
            to undo.
          </p>
        </div>
        <div className="rounded-xl border border-green-500/25 bg-green-500/[0.04] p-5">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">The biggest hope</p>
          <p className="text-sm leading-relaxed">
            AI tutors that cost almost nothing. They're the biggest measured boost to learning we
            have — and they help most exactly where teachers are scarcest.
          </p>
        </div>
        <div className="rounded-xl border border-border/60 bg-muted/5 p-5">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">The pattern</p>
          <p className="text-sm leading-relaxed">
            The top 5 impacts carry about <strong>{topFiveShare}%</strong> of the total weight — and
            they keep pointing at the same two things: the young, and whatever is cheap at scale.
            The biggest dangers and the biggest fixes both cost almost nothing per person.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border border-border/60 overflow-hidden">
          {TYPE_OPTIONS.map(opt => (
            <button
              key={opt.id}
              onClick={() => setTypeFilter(opt.id)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                typeFilter === opt.id
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-pressed={typeFilter === opt.id}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground ml-2">Life areas:</span>
        {DOMAINS.map(d => {
          const active = activeDomains.has(d.id);
          return (
            <button
              key={d.id}
              onClick={() => toggleDomain(d.id)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border transition-all ${
                active
                  ? "border-border text-foreground"
                  : "border-border/40 text-muted-foreground/50"
              }`}
              aria-pressed={active}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: d.color, opacity: active ? 1 : 0.35 }}
              />
              {DOMAIN_TITLES[d.id]}
            </button>
          );
        })}
      </div>

      {/* Research layer: the Pareto chart */}
      <div className="rounded-xl border border-border/60 bg-muted/5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <p className="text-xs font-semibold">
            The 15 impacts, ranked — bar length = weight · solid = strong evidence, faded = weaker ·
            dotted line = running total
          </p>
          <TierBadge tier="imagine" />
        </div>
        <ResponsiveContainer width="100%" height={Math.max(rows.length * 36 + 60, 180)}>
          <ComposedChart layout="vertical" data={rows} margin={{ top: 10, right: 40, bottom: 4, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: "rgba(148,163,184,0.7)" }}
              label={{
                value: "Illustrative analytic weight (evidence strength × population breadth) — not a measured quantity",
                position: "insideBottom",
                offset: -2,
                fontSize: 10,
                fill: "rgba(148,163,184,0.7)",
              }}
              height={40}
            />
            <XAxis
              type="number"
              xAxisId="cum"
              orientation="top"
              domain={[0, 100]}
              tickFormatter={(v: number) => `${v}%`}
              tick={{ fontSize: 10, fill: "rgba(148,163,184,0.5)" }}
            />
            <YAxis
              type="category"
              dataKey="shortLabel"
              width={300}
              tick={{ fontSize: 10, fill: "rgba(148,163,184,0.85)" }}
              interval={0}
            />
            <Tooltip content={<ParetoTooltip />} cursor={{ fill: "rgba(148,163,184,0.06)" }} />
            <Bar dataKey="magnitude" barSize={18} radius={[0, 4, 4, 0]} isAnimationActive={false}>
              {rows.map(row => (
                <Cell
                  key={row.id}
                  fill={domainOf(row.domain).color}
                  fillOpacity={EVIDENCE_OPACITY[row.evidence] ?? 0.5}
                />
              ))}
            </Bar>
            <Line
              dataKey="cumulative"
              xAxisId="cum"
              stroke="rgba(148,163,184,0.7)"
              strokeWidth={1.5}
              strokeDasharray="5 4"
              dot={{ r: 2, fill: "rgba(148,163,184,0.7)", strokeWidth: 0 }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
        <p className="text-[10px] text-muted-foreground/80 leading-relaxed mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span>⚪ The weights are our analytic judgment, not measurements — the order is the claim, never the numbers.</span>
          <span className="inline-flex items-center gap-1.5">
            Evidence behind each row: <ConfidenceChip confidence="high" showLabel /> <ConfidenceChip confidence="medium" showLabel /> <ConfidenceChip confidence="low" showLabel />
          </span>
        </p>
      </div>
    </div>
  );
}
