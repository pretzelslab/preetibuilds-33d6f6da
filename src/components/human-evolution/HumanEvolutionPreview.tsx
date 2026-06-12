import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  ReferenceLine, ResponsiveContainer,
} from "recharts";
import { DiagonalWatermark } from "@/components/ui/DiagonalWatermark";
import { COHORTS, DOMAINS, SCENARIOS, THESIS, TRAJECTORIES } from "@/data/humanEvolution";
import { ConfidenceChip } from "./ConfidenceChip";
import { COHORT_COLORS, usePrefersReducedMotion } from "./shared";

const YEARS = [2026, 2031, 2036, 2041, 2046];
const CYCLE_MS = 4000;
const HEADLINE_DOMAINS = ["mentalHealth", "discernment", "labor"] as const;

export function HumanEvolutionPreview() {
  const reducedMotion = usePrefersReducedMotion();
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (reducedMotion) return;
    const t = setInterval(() => setIdx(i => (i + 1) % SCENARIOS.length), CYCLE_MS);
    return () => clearInterval(t);
  }, [reducedMotion]);

  // Reduced motion: hold on B (the expected scenario), no cycling.
  const scenario = reducedMotion ? SCENARIOS[1] : SCENARIOS[idx];

  const rows = useMemo(() => YEARS.map(year => {
    const row: Record<string, number> = { year };
    for (const t of TRAJECTORIES.filter(t => t.scenario === scenario.id)) {
      row[t.cohort] = t.points.find(p => p.year === year)!.index;
    }
    return row;
  }), [scenario.id]);

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-10 z-40 bg-background/95 backdrop-blur border-b border-border/40">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link to="/#projects" className="text-xs text-muted-foreground hover:text-foreground transition-colors">← Back to Portfolio</Link>
          <span className="text-xs font-mono text-emerald-600">Preview</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">

        {/* Title */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <h1 className="text-2xl font-bold">Human Evolution in the Age of AI</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Preview</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">{THESIS.oneLine}</p>
        </div>

        {/* Auto-playing trajectory chart */}
        <div className="relative rounded-xl border border-border/60 overflow-hidden mb-6">
          <div className="bg-muted/10 px-5 py-4">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <p className="text-xs font-semibold">Four generations · three futures · same technology</p>
              {!reducedMotion && <span className="ml-auto text-[10px] text-muted-foreground">auto-playing</span>}
            </div>

            <div key={scenario.id} className="flex items-center gap-2 mb-3 animate-in fade-in duration-500">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: scenario.color }} />
              <span className="text-sm font-bold">{scenario.id} · {scenario.name}</span>
              <span className="text-[10px] text-muted-foreground">{scenario.kind}</span>
              <ConfidenceChip confidence={scenario.confidence} />
            </div>

            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rows} margin={{ top: 12, right: 20, bottom: 4, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" />
                  <XAxis dataKey="year" type="number" domain={[2026, 2046]} ticks={YEARS} tick={{ fontSize: 10, fill: "rgba(148,163,184,0.7)" }} />
                  <YAxis domain={[30, 80]} tick={{ fontSize: 10, fill: "rgba(148,163,184,0.7)" }} width={28} />
                  <ReferenceLine y={50} stroke="rgba(148,163,184,0.4)" strokeDasharray="4 2" label={{ value: "2026 baseline", position: "insideBottomRight", fill: "rgba(148,163,184,0.6)", fontSize: 9 }} />
                  {COHORTS.map(c => (
                    <Line
                      key={c.id}
                      dataKey={c.id}
                      type="monotone"
                      stroke={COHORT_COLORS[c.id]}
                      strokeWidth={2.5}
                      dot={false}
                      isAnimationActive={!reducedMotion}
                      animationDuration={900}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="flex flex-wrap gap-3 mt-2">
              {COHORTS.map(c => (
                <span key={c.id} className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COHORT_COLORS[c.id] }} />
                  {c.label} ({c.ages2026})
                </span>
              ))}
            </div>

            <p className="text-[10px] text-muted-foreground/70 mt-3">
              ⚪ Illustrative capability index (Tier 3) — the divergence is the claim, never the numbers.
            </p>
          </div>
          <DiagonalWatermark />
        </div>

        {/* Headline stats — verified Tier-1 anchors */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {HEADLINE_DOMAINS.map(id => {
            const d = DOMAINS.find(dm => dm.id === id)!;
            return (
              <div key={d.id} className="rounded-xl border border-border/60 bg-muted/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{d.shortLabel}</span>
                  <span className="ml-auto"><ConfidenceChip confidence={d.keyStat.confidence} /></span>
                </div>
                <p className="text-xs leading-relaxed">{d.keyStat.stat}</p>
                <p className="text-[10px] text-muted-foreground mt-2">{d.keyStat.source}</p>
              </div>
            );
          })}
        </div>

        <div className="rounded-xl border border-border/60 bg-muted/10 p-4 text-xs text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Inside:</strong> the full Time Travel Simulator, four persona life-arcs across the three
          futures, a 15-impact Pareto, a 6-region risk heatmap, and the 18-indicator dashboard that will show which future we're in.
          Built on a 10-document research corpus with 30 live-verified source sets.
        </div>

      </div>
    </div>
  );
}
