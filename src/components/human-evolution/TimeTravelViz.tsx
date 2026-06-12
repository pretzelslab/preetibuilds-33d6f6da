import { useEffect, useMemo, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  ReferenceLine, ResponsiveContainer, Tooltip,
} from "recharts";
import { ChevronDown, ChevronUp, Pause, Play, RotateCcw } from "lucide-react";
import { COHORTS, DOMAINS, SCENARIOS, TRAJECTORIES } from "@/data/humanEvolution";
import type { CohortId, DomainId, ScenarioId } from "@/data/humanEvolution";
import { useScenario } from "./ScenarioContext";
import { COHORT_COLORS, DOMAIN_TITLES, agesAt, indexAt, pathValueAt, usePrefersReducedMotion } from "./shared";

const START_YEAR = 2026;
const END_YEAR = 2046;
const YEARS = [2026, 2031, 2036, 2041, 2046];
const TICK_MS = 700; // one year per tick — full loop ≈ 15s, gif-length
const HOLD_END_MS = 3200; // linger on 2046 so the ending lands before the loop restarts

const GENERATION_DISPLAY: Record<CohortId, string> = {
  adolescents: "Teens today",
  emergingAdults: "Young workers",
  primeWorkforce: "Mid-career",
  experiencedWorkforce: "Late career",
};

// ── The three eras the movie passes through ───────────────────────────────────
type Stage = "now" | "mid" | "far";

function stageFor(year: number): Stage {
  if (year <= 2030) return "now";
  if (year <= 2038) return "mid";
  return "far";
}

const ERA_META: Record<Stage, { label: string; sub: string }> = {
  now: { label: "What we can already see", sub: "2026–2030 · backed by today's studies" },
  mid: { label: "The forecast window", sub: "2031–2038 · where the evidence points" },
  far: { label: "Deep uncertainty", sub: "2039–2046 · best and worst case diverge most" },
};

/**
 * Layman callout layer (S7e): one gain (+, green) and one loss (−, red) per
 * life area per era, shown simultaneously as the years run. Presentation
 * only — every line restates the domain key stats, theses and scenario
 * outcomes already in the data file; no new claims.
 */
const CALLOUTS: Record<DomainId, Record<Stage, { plus: string; minus: string }>> = {
  cognition: {
    now: {
      plus: "Used as a tutor, AI already lifts learning.",
      minus: "AI summaries already halve how often people check a real source.",
    },
    mid: {
      plus: "Students taught with AI pull ahead.",
      minus: "Where AI just gives answers, thinking quietly thins — report cards don't catch it.",
    },
    far: {
      plus: "Best case: the best-educated generation in history — strong with AI and without it.",
      minus: "Worst case: reasoning without AI becomes something mostly richer families keep.",
    },
  },
  creativity: {
    now: {
      plus: "Anyone can now make music, art and writing that once took years of training.",
      minus: "Creative pay is already falling — being among the best is no shield.",
    },
    mid: {
      plus: "More people creating than ever; taste and original ideas become the prized skills.",
      minus: "Culture gets more same-y as everyone draws from the same machines.",
    },
    far: {
      plus: "Best case: tools tuned for originality keep culture diverse.",
      minus: "Worst case: culture narrows into a loop of AI remixing AI.",
    },
  },
  discernment: {
    now: {
      plus: "AI fact-checking can already talk people out of conspiracy beliefs.",
      minus: "People already spot deepfakes no better than a coin flip.",
    },
    mid: {
      plus: "Content labels and verification tools spread — where someone pays for them.",
      minus: "Fakes keep getting cheaper; doubt becomes the default.",
    },
    far: {
      plus: "Best case: proving what's real becomes routine, like spam filters.",
      minus: "Worst case: anything can be denied as fake — truth splits along tribal lines.",
    },
  },
  mentalHealth: {
    now: {
      plus: "Therapy-grade AI already eases depression and anxiety in clinical trials.",
      minus: "Nearly 3 in 4 teens have tried AI companions built to keep them talking.",
    },
    mid: {
      plus: "AI therapy reaches millions who could never afford a human therapist.",
      minus: "A generation gets used to friendship that never pushes back.",
    },
    far: {
      plus: "Best case: the global therapy shortage effectively ends.",
      minus: "Worst case: paid human attention becomes a luxury good.",
    },
  },
  labor: {
    now: {
      plus: "AI makes beginners about a third more productive at work.",
      minus: "Hiring of young people in AI-exposed jobs is already down 13%.",
    },
    mid: {
      plus: "Experienced people who direct AI become more valuable.",
      minus: "The bottom rung of the career ladder keeps disappearing.",
    },
    far: {
      plus: "Best case: juniors start as AI-directors from day one.",
      minus: "Worst case: work survives, but the path upward through it collapses.",
    },
  },
};

/**
 * Generation story layer (restored from S7d per Preeti): plain-words stories
 * per generation × era × future, shown in the collapsible below the movie and
 * auto-advancing with the movie's year. Presentation only — every story
 * restates the trajectory notes, scenario outcomes and persona arcs already
 * in the data file; no new claims.
 */
const STORY_NOW: Record<CohortId, string> = {
  adolescents:
    "Their thinking, habits and confidence are forming right now — inside whichever kind of AI their school and home happen to use. Nothing is decided yet, but this generation's clock runs fastest.",
  emergingAdults:
    "AI makes them noticeably better at their jobs — and is quietly removing the junior jobs they would normally start in. They feel both at once.",
  primeWorkforce:
    "The luckiest seat in the room: they learned their craft before AI, and now AI multiplies it. Their judgment is the thing AI can't replace — yet.",
  experiencedWorkforce:
    "Their skills are fully formed, so AI can't hollow them out — but the scams aimed at them are getting better, fast.",
};

const STORY: Record<CohortId, Record<ScenarioId, { mid: string; far: string }>> = {
  adolescents: {
    A: {
      mid: "Schools moved early: AI that teaches, plus exams that still check what you can do on your own. These teens are learning faster than any generation before them.",
      far: "They are now the best-educated adults in history — fluent with AI and strong without it.",
    },
    B: {
      mid: "It depends on the school they happened to get. Some are using AI to learn; most are using it to finish homework faster. Both groups look fine on report cards.",
      far: "Now grown up, the difference shows: those who learned with AI pull ahead; those who let it do the work struggle whenever the AI isn't there.",
    },
    C: {
      mid: "Apps built to keep them hooked won. Grades look okay — the AI does the work — but the thinking underneath is getting thinner.",
      far: "As adults, many can't reason, write or decide confidently without AI. Thinking unaided has become something mostly richer families kept.",
    },
  },
  emergingAdults: {
    A: {
      mid: "Companies redesigned starter jobs instead of deleting them: juniors now direct AI from day one and still learn the craft.",
      far: "The ladder held. They climb it faster than their parents did, with AI doing the grunt work.",
    },
    B: {
      mid: "Employment is fine; getting started is not. Those who can afford unpaid portfolio-building leapfrog the missing first rung; the rest stay stuck operating AI for others.",
      far: "Two careers exist now: people who direct AI, and people AI directs. Which one you got mostly depended on the cushion you started with.",
    },
    C: {
      mid: "The starter jobs went first, faster than anyone retrained. Careers begin years late — and the skills those jobs used to teach never form.",
      far: "A scarred generation: working, but never given the chance to become the experts the economy now misses.",
    },
  },
  primeWorkforce: {
    A: {
      mid: "Their tools are built to keep them sharp — AI drafts, they decide. Their experience gets more valuable, not less.",
      far: "They finish their careers as the directors of the AI economy — judgment formed the old way, output multiplied the new way.",
    },
    B: {
      mid: "They're winning — promoted for judgment, paid for experience. The quiet cost: skills they no longer use are fading.",
      far: "Still comfortable, as long as the tools are there. Working without AI is now something they would rather not try.",
    },
    C: {
      mid: "Years of trusting the AI's answers without checking them has dulled the very judgment that made them valuable.",
      far: "When a serious AI mistake finally lands on their desk, they no longer catch it. The expertise everyone assumed was there had quietly leaked away.",
    },
  },
  experiencedWorkforce: {
    A: {
      mid: "Labels on synthetic content and verified channels reach them in time. AI removes drudgery without touching what they know.",
      far: "They finish strong: augmented, not replaced, and still able to trust what they see.",
    },
    B: {
      mid: "They're personally fine — but fake voices and videos move faster than protections reach them. Their less-connected friends are the first victims.",
      far: "Experience kept them safe at work; staying safe online has become the new daily skill nobody taught them.",
    },
    C: {
      mid: "The scams now sound exactly like their grandchildren. A lifetime of instincts for judging real from fake stops working.",
      far: "Many stop believing real things too — when anything can be faked, everything can be denied. They pay the bill for the trust collapse.",
    },
  },
};

function storyFor(cohort: CohortId, scenario: ScenarioId, year: number) {
  const stage = stageFor(year);
  return stage === "now" ? STORY_NOW[cohort] : STORY[cohort][scenario][stage];
}

/** Plain-words read of the illustrative index vs the 2026 baseline of 50. */
function directionFor(index: number): { word: string; arrow: string } {
  if (index >= 53) return { word: "Better off than 2026", arrow: "↑" };
  if (index <= 47) return { word: "Worse off than 2026", arrow: "↓" };
  return { word: "About the same as 2026", arrow: "→" };
}

/** Gauge scale: index 25–75 mapped to 0–100% of track height (50 = baseline = 50%). */
function pct(v: number): number {
  return (v - 25) * 2;
}

// ── One life area: a gauge that grows green up / red down as the years run ────
function DomainColumn({ domainId, year }: { domainId: DomainId; year: number }) {
  const domain = DOMAINS.find(d => d.id === domainId)!;
  const era = stageFor(year);
  const a = pct(pathValueAt(domainId, "A", year));
  const b = pct(pathValueAt(domainId, "B", year));
  const c = pct(pathValueAt(domainId, "C", year));

  return (
    <div className="rounded-xl border border-border/60 bg-muted/5 p-4 flex flex-col">
      <p className="text-xs font-semibold flex items-center gap-2 mb-3 leading-tight">
        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: domain.color }} />
        {DOMAIN_TITLES[domainId]}
      </p>

      {/* The gauge: best case grows green above the line, worst case grows red below */}
      <div className="relative h-40 mb-3" aria-hidden>
        {/* 2026 baseline */}
        <div className="absolute left-0 right-0 border-t border-dashed border-muted-foreground/40" style={{ bottom: "50%" }} />
        <span className="absolute right-0 text-[9px] text-muted-foreground/60" style={{ bottom: "calc(50% + 2px)" }}>2026 level</span>
        {/* best case (A) — green, rising */}
        <div
          className="absolute left-1/2 -translate-x-1/2 w-8 rounded-t-md bg-emerald-500/25 border border-b-0 border-emerald-500/50 transition-all duration-700 ease-linear"
          style={{ bottom: "50%", height: `${Math.max(a - 50, 0)}%` }}
        />
        {/* worst case (C) — red, falling */}
        <div
          className="absolute left-1/2 -translate-x-1/2 w-8 rounded-b-md bg-red-500/25 border border-t-0 border-red-500/50 transition-all duration-700 ease-linear"
          style={{ bottom: `${Math.min(c, 50)}%`, height: `${Math.max(50 - c, 0)}%` }}
        />
        {/* the path we're on (B) — yellow line */}
        <div
          className="absolute left-1/2 -translate-x-1/2 w-12 transition-all duration-700 ease-linear"
          style={{ bottom: `calc(${b}% - 1px)` }}
        >
          <div className="h-[3px] rounded-full bg-yellow-500 shadow-[0_0_6px_rgba(234,179,8,0.6)]" />
        </div>
      </div>

      {/* Plain-word gain + loss, both at once, crossfading as eras pass */}
      <div key={era} className="space-y-1.5 animate-in fade-in duration-700 mt-auto">
        <p className="text-[11px] leading-snug text-emerald-600 dark:text-emerald-500">
          <span className="font-bold mr-1">+</span>{CALLOUTS[domainId][era].plus}
        </p>
        <p className="text-[11px] leading-snug text-red-600 dark:text-red-500">
          <span className="font-bold mr-1">−</span>{CALLOUTS[domainId][era].minus}
        </p>
      </div>
    </div>
  );
}

// ── Tooltip (no-controls trajectory chart) ───────────────────────────────────
const NoControlsTooltip = ({ active, payload, label }: {
  active?: boolean;
  label?: number;
  payload?: Array<{ dataKey: string; value: number; stroke: string }>;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-background border border-border rounded-xl p-3 shadow-xl text-xs w-64">
      <p className="font-bold mb-2">{label}</p>
      <div className="space-y-1.5">
        {payload.map(entry => {
          const domain = DOMAINS.find(d => d.id === entry.dataKey);
          if (!domain) return null;
          return (
            <div key={entry.dataKey} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: entry.stroke }} />
                {DOMAIN_TITLES[domain.id]}
              </span>
              <span className="font-semibold">{Math.round(entry.value)}</span>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-muted-foreground mt-2 pt-2 border-t border-border/40">
        ⚪ Illustrative index — the direction is the claim, not the numbers
      </p>
    </div>
  );
};

// ── The no-controls chart itself — shared by the page view and the square
//    recording view (compact drops the axis label and long annotations) ───────
function NoControlsChart({ rows, compact, visible, hovered }: {
  rows: Record<string, number>[];
  compact?: boolean;
  visible: Record<DomainId, boolean>;
  hovered: DomainId | null;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={rows} margin={compact ? { top: 8, right: 12, bottom: 0, left: -16 } : { top: 16, right: 24, bottom: 8, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" />
        <XAxis
          dataKey="year" type="number"
          domain={[2026, 2046]} ticks={YEARS}
          tick={{ fontSize: 10, fill: "rgba(148,163,184,0.7)" }}
        />
        <YAxis
          domain={[25, 55]}
          tick={{ fontSize: 10, fill: "rgba(148,163,184,0.7)" }}
          label={compact ? undefined : { value: "Illustrative capability index", angle: -90, position: "insideLeft", offset: 12, style: { fontSize: 10, fill: "rgba(148,163,184,0.6)" } }}
        />
        <ReferenceLine
          y={50} stroke="rgba(148,163,184,0.4)" strokeDasharray="4 2"
          label={{ value: "2026 baseline", position: "insideTopRight", fill: "rgba(148,163,184,0.6)", fontSize: 9 }}
        />
        <ReferenceLine
          x={2036} stroke="rgba(148,163,184,0.35)" strokeDasharray="6 3"
          label={compact ? undefined : { value: "after 2036 forecasts get less certain", position: "insideTopLeft", fill: "rgba(148,163,184,0.6)", fontSize: 9 }}
        />
        {DOMAINS.map(d => (
          <Line
            key={d.id}
            dataKey={d.id}
            type="monotone"
            stroke={d.color}
            strokeWidth={2.5}
            strokeOpacity={hovered && hovered !== d.id ? 0.25 : 1}
            dot={false}
            activeDot={{ r: 5 }}
            hide={!visible[d.id]}
            isAnimationActive={false}
          />
        ))}
        <Tooltip content={<NoControlsTooltip />} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── Viz 1 — Time travel movie: auto-plays 2026→2046 across the five life areas ─
export function TimeTravelViz() {
  const { scenario } = useScenario();
  const reducedMotion = usePrefersReducedMotion();
  const [year, setYear] = useState(START_YEAR);
  const [playing, setPlaying] = useState(true);
  const [storiesOpen, setStoriesOpen] = useState(false);
  const [squareView, setSquareView] = useState(false);
  const [visible, setVisible] = useState<Record<DomainId, boolean>>({
    cognition: true, creativity: true, discernment: true, mentalHealth: true, labor: true,
  });
  const [hovered, setHovered] = useState<DomainId | null>(null);

  // Reduced motion: no animation — hold the full 2046 picture, scrub by hand.
  useEffect(() => {
    if (reducedMotion) {
      setPlaying(false);
      setYear(END_YEAR);
    }
  }, [reducedMotion]);

  // The movie: one year per tick, linger at 2046, then loop.
  useEffect(() => {
    if (!playing || reducedMotion) return;
    const delay = year >= END_YEAR ? HOLD_END_MS : TICK_MS;
    const t = setTimeout(() => setYear(y => (y >= END_YEAR ? START_YEAR : y + 1)), delay);
    return () => clearTimeout(t);
  }, [playing, year, reducedMotion]);

  const era = stageFor(year);

  const scenarioTrajectories = useMemo(
    () => TRAJECTORIES.filter(t => t.scenario === scenario),
    [scenario],
  );

  // The no-controls trajectory: one row per elapsed year, so the five curves
  // draw themselves left → right as the movie runs. Values extrapolate today's
  // measured direction on the assumption that none of the four levers (How
  // We'll Know tab) get pulled — by definition the all-levers-unpulled path.
  const noControlsRows = useMemo(() => {
    const rows: Record<string, number>[] = [];
    for (let yr = START_YEAR; yr <= year; yr++) {
      const row: Record<string, number> = { year: yr };
      for (const d of DOMAINS) row[d.id] = pathValueAt(d.id, "C", yr);
      rows.push(row);
    }
    return rows;
  }, [year]);

  return (
    <div className="space-y-5">

      {/* The movie header: year counter, era, legend, controls */}
      <div className="rounded-xl border border-border/60 bg-muted/5 p-5">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <span className="text-5xl font-bold tabular-nums leading-none w-32 flex-shrink-0">{year}</span>
          <div key={era} className="animate-in fade-in duration-500">
            <p className="text-sm font-semibold">{ERA_META[era].label}</p>
            <p className="text-xs text-muted-foreground">{ERA_META[era].sub}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 lg:ml-8">
            <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="w-3 h-2 rounded-sm bg-emerald-500/40 border border-emerald-500/60 flex-shrink-0" /> best case grows up
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="w-3 h-[3px] rounded-full bg-yellow-500 flex-shrink-0" /> the path we're on
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="w-3 h-2 rounded-sm bg-red-500/40 border border-red-500/60 flex-shrink-0" /> worst case grows down
            </span>
          </div>
          {!reducedMotion && (
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => setPlaying(p => !p)}
                className="inline-flex items-center gap-1.5 rounded-full border border-border/60 px-3 py-1.5 text-xs hover:border-foreground/40 transition-colors"
                aria-label={playing ? "Pause" : "Play"}
              >
                {playing ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                {playing ? "Pause" : "Play"}
              </button>
              <button
                onClick={() => { setYear(START_YEAR); setPlaying(true); }}
                className="inline-flex items-center gap-1.5 rounded-full border border-border/60 px-3 py-1.5 text-xs hover:border-foreground/40 transition-colors"
                aria-label="Restart from 2026"
              >
                <RotateCcw className="w-3 h-3" /> Restart
              </button>
            </div>
          )}
        </div>

        {/* Time progress */}
        <div className="mt-4">
          {reducedMotion ? (
            <>
              <input
                type="range"
                min={START_YEAR} max={END_YEAR} step={1}
                value={year}
                onChange={e => setYear(Number(e.target.value))}
                className="w-full accent-foreground"
                aria-label="Travel year"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Animation is off because your device prefers reduced motion — drag to travel through the years.
              </p>
            </>
          ) : (
            <div className="h-1 rounded-full bg-muted/40 overflow-hidden">
              <div
                className="h-full bg-foreground/50 transition-all duration-700 ease-linear"
                style={{ width: `${((year - START_YEAR) / (END_YEAR - START_YEAR)) * 100}%` }}
              />
            </div>
          )}
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5">
            <span>2026 · today</span>
            <span>2036 · ten years out</span>
            <span>2046 · twenty years out</span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed mt-3">
          Press nothing — the years run by themselves. For each part of life, the green band is how far
          the best case rises, the red band is how far the worst case falls, and the yellow line is the
          path today's data says we're on. Watch how wide the stakes get by 2046.
        </p>
      </div>

      {/* The five life areas, left to right across the full width */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {DOMAINS.map(d => <DomainColumn key={d.id} domainId={d.id} year={year} />)}
      </div>

      <p className="text-[11px] text-muted-foreground/70 leading-relaxed">
        ⚪ The rising and falling bands are illustrative renderings of the three research futures —
        the direction is the claim, never a measurement. The studies behind every line are in
        The Impacts tab; the futures themselves are explained in the guide above.
      </p>

      {/* The no-controls trajectory — all five life areas on one chart (S10) */}
      <div className="rounded-xl border border-border/60 bg-muted/5 p-5">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 mb-1">
          <p className="text-sm font-semibold">All five parts of life, one chart — the path if no controls deploy</p>
          <button
            onClick={() => setSquareView(s => !s)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border/60 px-3 py-1 text-[10px] hover:border-foreground/40 transition-colors flex-shrink-0"
            aria-pressed={squareView}
          >
            {squareView ? "Exit square view" : "Square view · for recording"}
          </button>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed mb-4">
          Each curve is one part of life, drawn as the years run — today's direction extrapolated
          if none of the four levers get pulled. 50 = the 2026 baseline; higher means more human
          capability.
        </p>

        {squareView ? (
          <>
            {/* 1:1 card sized for LinkedIn screen recording */}
            <div className="mx-auto w-full max-w-[560px]">
              <div className="aspect-square rounded-2xl border border-border/60 bg-background p-5 flex flex-col">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div>
                    <p className="text-xs font-semibold leading-tight">If no controls deploy</p>
                    <p className="text-[10px] text-muted-foreground">five parts of human life · 2026–2046</p>
                  </div>
                  <span className="text-3xl font-bold tabular-nums leading-none">{year}</span>
                </div>
                <div className="flex-1 min-h-0">
                  <NoControlsChart rows={noControlsRows} compact visible={visible} hovered={hovered} />
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                  {DOMAINS.map(d => (
                    <span key={d.id} className="inline-flex items-center gap-1 text-[9px] text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                      {d.shortLabel}
                    </span>
                  ))}
                </div>
                <p className="text-[9px] text-muted-foreground/70 mt-1.5">
                  50 = 2026 baseline · illustrative — the direction is the claim, not the numbers · preetibuilds
                </p>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-3 text-center">
              Press Restart at the top, then screen-record just the square — one full loop is ≈ 15 seconds.
            </p>
          </>
        ) : (
          <>
            <div className="h-[280px] sm:h-[340px]">
              <NoControlsChart rows={noControlsRows} visible={visible} hovered={hovered} />
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              {DOMAINS.map(d => (
                <button
                  key={d.id}
                  onClick={() => setVisible(v => ({ ...v, [d.id]: !v[d.id] }))}
                  onMouseEnter={() => setHovered(d.id)}
                  onMouseLeave={() => setHovered(null)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] transition-all ${
                    visible[d.id]
                      ? "border-border/60 text-foreground"
                      : "border-border/40 text-muted-foreground/50 line-through"
                  }`}
                  aria-pressed={visible[d.id]}
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color, opacity: visible[d.id] ? 1 : 0.4 }} />
                  {DOMAIN_TITLES[d.id]}
                </button>
              ))}
            </div>
          </>
        )}

        <p className="text-[11px] text-muted-foreground/70 leading-relaxed mt-4 pt-3 border-t border-border/40">
          ⚪ Illustrative (Tier 3 — What We Imagine). These curves extrapolate today's measured
          directions assuming the levers stay unpulled; 2026 = 50 by construction. No study produces
          a composite human-capability index — treat shape and direction as the claim, never the
          numbers. The matrix of who can pull each lever is in the How We'll Know tab.
        </p>
      </div>

      {/* The generation stories — secondary layer, auto-advances with the movie */}
      <div className="rounded-xl border border-border/60 bg-muted/5">
        <button
          onClick={() => setStoriesOpen(o => !o)}
          className="w-full flex items-center gap-2 px-5 py-3 text-sm font-semibold"
          aria-expanded={storiesOpen}
        >
          The story for each generation — as the years run
          {storiesOpen ? <ChevronUp className="w-4 h-4 ml-auto text-muted-foreground" /> : <ChevronDown className="w-4 h-4 ml-auto text-muted-foreground" />}
        </button>
        {storiesOpen && (
          <div className="px-5 pb-5">
            <p className="text-xs text-muted-foreground mb-4">
              These stories follow the movie's year on{" "}
              <strong className="text-foreground">{scenario} · {SCENARIOS.find(s => s.id === scenario)!.name}</strong>{" "}
              (the future selected at the top of the page) — they change by themselves as time passes.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {COHORTS.map(c => {
                const traj = scenarioTrajectories.find(t => t.cohort === c.id)!;
                const direction = directionFor(indexAt(traj.points, year));
                return (
                  <div key={c.id} className="rounded-xl border border-border/60 bg-muted/10 p-4 flex flex-col">
                    <p className="text-sm font-semibold flex items-center gap-2 mb-0.5">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COHORT_COLORS[c.id] }} />
                      {GENERATION_DISPLAY[c.id]}
                    </p>
                    <p className="text-[10px] text-muted-foreground mb-2">
                      {c.ages2026} in 2026 → {agesAt(c, year)} in {year}
                    </p>
                    <p className="text-[11px] font-medium mb-2 inline-flex items-center gap-1 rounded-full border border-border/40 bg-muted/20 px-2 py-0.5 self-start">
                      {direction.arrow} {direction.word}
                    </p>
                    <p key={`${stageFor(year)}-${scenario}`} className="text-xs text-muted-foreground leading-relaxed animate-in fade-in duration-700">
                      {storyFor(c.id, scenario, year)}
                    </p>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-muted-foreground/70 leading-relaxed mt-4">
              ⚪ The stories and the "better/worse off" reads are illustrative renderings of the
              research — the direction is the claim, never a measurement.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
