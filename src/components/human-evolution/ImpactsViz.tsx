import { LineChart, Line, XAxis, YAxis, ReferenceLine, ResponsiveContainer } from "recharts";
import { DOMAINS, SCENARIOS } from "@/data/humanEvolution";
import type { DomainId, ScenarioId } from "@/data/humanEvolution";
import { useScenario } from "./ScenarioContext";
import { ConfidenceChip } from "./ConfidenceChip";
import { pathValueAt, usePrefersReducedMotion } from "./shared";

/**
 * Domain-first display layer (S7b/S7c redesign): surfaces Preeti's seven
 * impact areas in the labels, leads each row with a plain-English line, and
 * explains every key stat in plain terms. Presentation only — the thesis,
 * stat, and outcome text come straight from the data file; no new claims.
 */
const DOMAIN_DISPLAY: Record<DomainId, { title: string; covers: string; plain: string; statPlain: string }> = {
  cognition: {
    title: "Cognition & Learning",
    covers: "cognitive development · educational outcomes",
    plain:
      "How you use AI matters more than how much. Used as a tutor, it builds thinking; used as an answer machine, it slowly replaces it — and the answer machine is the default.",
    statPlain:
      "When Google adds an AI summary to a results page, people click through to a real source about half as often. We're reading the AI's digest instead of checking sources ourselves — a habit shift visible today, years before any effect on thinking ability could show up in test data.",
  },
  creativity: {
    title: "Creativity & Culture",
    covers: "creativity · cultural diversity",
    plain:
      "The same tools make each person more creative and culture as a whole more same-y. Human taste and original ideas become the scarce skills.",
    statPlain:
      "After generative AI arrived on a major freelance platform, writers' earnings fell about 5% — and being one of the best offered no protection. Quality alone no longer shields creative work from AI price pressure.",
  },
  discernment: {
    title: "Discernment",
    covers: "critical thinking · telling real from fake",
    plain:
      "Fakes are now too good for the human eye, so telling truth from fiction has to move from gut feel to tools and provenance — and right now the money is on the fakers' side.",
    statPlain:
      "Shown a deepfake, people spot it about as often as a coin flip comes up heads. The human eye alone can no longer police what's real — verification has to come from tools, not instinct.",
  },
  mentalHealth: {
    title: "Mental Health & Social Behaviour",
    covers: "mental health · social behaviour · relationships",
    plain:
      "AI built to treat you could close the global therapy gap. AI built to keep you talking puts attention-economy incentives inside your closest relationships — and teens are using it most.",
    statPlain:
      "Nearly three in four US teens have tried an AI companion, and almost a third say talking to AI is as satisfying as talking to a person. An entire generation is running this experiment before any long-term study exists.",
  },
  labor: {
    title: "Work & Livelihoods",
    covers: "labor economics · jobs and careers",
    plain:
      "AI helps beginners most at work — and removes beginner jobs first. What's at risk isn't employment overall; it's the bottom rung of the career ladder.",
    statPlain:
      "AI made junior workers 34% more productive — while hiring of young people in AI-exposed jobs fell 13%. Both happen for the same reason: AI substitutes for the experience juniors used to be hired to build.",
  },
};

// Illustrative 20-year paths now live in shared.ts (PATH_END / pathValueAt) —
// the moving time travel in TimeTravelViz renders the same data.
const PATH_YEARS = [2026, 2031, 2036, 2041, 2046];

function pathRows(domainId: DomainId) {
  return PATH_YEARS.map(year => {
    const row: Record<string, number> = { year };
    for (const s of SCENARIOS) {
      row[s.id] = Math.round(pathValueAt(domainId, s.id, year));
    }
    return row;
  });
}

/** Short outcome name, e.g. "Tutor Era" from "Tutor Era — AI tutors…". */
function outcomeName(text: string) {
  return text.split(" — ")[0];
}

// ── Summary matrix: 5 life areas × 3 futures, the at-a-glance answer ─────────
function SummaryMatrix() {
  const { scenario, setScenario } = useScenario();

  const jumpTo = (domainId: DomainId, scenarioId: ScenarioId) => {
    setScenario(scenarioId);
    document.getElementById(`impact-${domainId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="rounded-xl border border-border/60 bg-muted/5 p-5 mb-6 overflow-x-auto">
      <h3 className="font-semibold text-sm mb-1">The answer at a glance</h3>
      <p className="text-xs text-muted-foreground mb-4">
        Five parts of life × three futures. The middle column is the path present data supports.
        Click any cell to jump to that area with that future selected.
      </p>
      <div className="min-w-[560px]">
        <div className="grid grid-cols-[180px_1fr_1fr_1fr] gap-1.5 items-stretch">
          <div />
          {SCENARIOS.map(s => (
            <div key={s.id} className="text-center px-2 py-1.5">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center justify-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
                {s.id} · {s.id === "B" ? "current path" : s.kind.toLowerCase()}
              </p>
            </div>
          ))}
          {DOMAINS.map(domain => {
            const display = DOMAIN_DISPLAY[domain.id];
            return [
              <div key={`${domain.id}-label`} className="flex items-center gap-2 pr-2 py-2">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: domain.color }} />
                <span className="text-xs font-medium leading-tight">{display.title}</span>
              </div>,
              ...SCENARIOS.map(s => {
                const active = s.id === scenario;
                return (
                  <button
                    key={`${domain.id}-${s.id}`}
                    onClick={() => jumpTo(domain.id, s.id)}
                    className={`rounded-lg border px-2 py-2 text-center transition-all focus-visible:ring-2 focus-visible:ring-ring hover:scale-[1.02] ${
                      active ? "border-foreground/40" : "border-transparent"
                    }`}
                    style={{ background: `${s.color}1f` }}
                    title={s.domainOutcomes[domain.id]}
                  >
                    <span className="text-[11px] font-medium leading-tight" style={{ color: s.color }}>
                      {outcomeName(s.domainOutcomes[domain.id])}
                    </span>
                  </button>
                );
              }),
            ];
          })}
        </div>
      </div>
    </div>
  );
}

// ── Mini trajectory chart: one domain, three futures, twenty years ────────────
function MiniTrajectory({ domainId }: { domainId: DomainId }) {
  const { scenario } = useScenario();
  const reducedMotion = usePrefersReducedMotion();
  const rows = pathRows(domainId);

  return (
    <div className="h-[140px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 8, right: 26, bottom: 0, left: -28 }}>
          <XAxis
            dataKey="year" type="number"
            domain={[2026, 2046]} ticks={[2026, 2036, 2046]}
            tick={{ fontSize: 9, fill: "rgba(148,163,184,0.6)" }}
          />
          <YAxis domain={[25, 75]} tick={false} axisLine={false} />
          <ReferenceLine y={50} stroke="rgba(148,163,184,0.35)" strokeDasharray="4 2" />
          {SCENARIOS.map(s => {
            const active = s.id === scenario;
            return (
              <Line
                key={s.id}
                dataKey={s.id}
                type="monotone"
                stroke={s.color}
                strokeWidth={active ? 2.5 : 1.5}
                strokeOpacity={active ? 1 : 0.35}
                dot={false}
                isAnimationActive={!reducedMotion}
                animationDuration={300}
                label={({ index, x, y }: { index?: number; x?: number; y?: number }) =>
                  index === rows.length - 1 && x != null && y != null ? (
                    <text x={x + 5} y={y + 3} fontSize={10} fontWeight={active ? 700 : 400} fill={s.color} fillOpacity={active ? 1 : 0.5}>
                      {s.id}
                    </text>
                  ) : <text />
                }
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Viz 0 — The Impacts (domain-first answer view) ────────────────────────────
export function ImpactsViz() {
  const { scenario, setScenario } = useScenario();

  return (
    <div>
      <div className="mb-5">
        <h2 className="font-semibold text-sm mb-1">What AI does to five parts of human life over 20 years</h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          How to read this: start with the matrix for the whole answer at a glance, then read each life
          area below it. The small charts show the three possible 20-year paths (50 = where we are in
          2026); the bold line is the future selected above. Chart paths are illustrative ⚪ — the
          direction is the claim, never the numbers.
        </p>
      </div>

      <SummaryMatrix />

      <div className="space-y-4">
        {DOMAINS.map(domain => {
          const display = DOMAIN_DISPLAY[domain.id];
          return (
            <div key={domain.id} id={`impact-${domain.id}`} className="rounded-xl border border-border/60 bg-muted/5 p-5 scroll-mt-32">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-3">
                <h3 className="flex items-center gap-2 font-semibold text-base">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: domain.color }} />
                  {display.title}
                </h3>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{display.covers}</span>
              </div>

              {/* Spread out: story on the left, futures + chart on the right */}
              <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-5">
                <div>
                  <p className="text-sm leading-relaxed mb-2">{display.plain}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                    <span className="font-semibold text-foreground/80">The research finding: </span>
                    {domain.thesis}
                  </p>
                  <div className="rounded-lg bg-muted/20 border border-border/40 p-3">
                    <p className="text-xs leading-relaxed">
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground mr-2">Key number</span>
                      {domain.keyStat.stat}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-1.5">
                      <span className="font-semibold text-foreground/70">In plain terms: </span>
                      {display.statPlain}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1.5">
                      Source: {domain.keyStat.source} <ConfidenceChip confidence={domain.keyStat.confidence} />
                    </p>
                  </div>
                </div>

                <div>
                  <MiniTrajectory domainId={domain.id} />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                    {SCENARIOS.map(s => {
                      const active = s.id === scenario;
                      return (
                        <button
                          key={s.id}
                          onClick={() => setScenario(s.id)}
                          aria-pressed={active}
                          className={`text-left rounded-lg border p-3 transition-all focus-visible:ring-2 focus-visible:ring-ring ${
                            active
                              ? "border-foreground/40 bg-muted/25"
                              : "border-border/40 bg-muted/10 opacity-70 hover:opacity-100 hover:border-foreground/25"
                          }`}
                        >
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
                            {s.id} · {s.id === "B" ? "current path" : s.kind.toLowerCase()}{active && " · viewing"}
                          </p>
                          <p className="text-[11px] leading-relaxed">{s.domainOutcomes[domain.id]}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
