import { useEffect, useState } from "react";
import { Pause, Play } from "lucide-react";
import { DOMAINS } from "@/data/humanEvolution";
import type { DomainId } from "@/data/humanEvolution";
import { PATH_END } from "./shared";

/**
 * The thought process (S9b, Preeti's ask 2026-06-11): one succinct writeup +
 * one simple interactive time travel that depicts the flow WITHOUT neutrality.
 * This is not the three-scenario movie — it shows only the path present data
 * supports (B): within every life area, the deliberate users pull up while the
 * substituted are hollowed out, and the gap widens as the years run. Bar
 * lengths are illustrative (⚪) — the direction and the widening are the claim,
 * never the pixel counts. All copy restates DOMAINS theses/keyStats.
 */

const PLAIN_TITLES: Record<DomainId, string> = {
  cognition: "Thinking & learning",
  creativity: "Creativity",
  discernment: "Telling real from fake",
  mentalHealth: "Mental health & relationships",
  labor: "Work & careers",
};

/** What each side of the split looks like at journey's end, per area. */
const SPLIT_ENDS: Record<DomainId, { gains: string; loses: string }> = {
  cognition: { gains: "tutored thinkers", loses: "answer-takers" },
  creativity: { gains: "taste-makers", loses: "prompt-and-post" },
  discernment: { gains: "tool-verified", loses: "feed-trusting" },
  mentalHealth: { gains: "care that reaches", loses: "companion-dependent" },
  labor: { gains: "frontier judgment", loses: "rungless climbers" },
};

const ERAS = [
  {
    until: 2030,
    label: "2026–2030 · What is already measured",
    text: "Every number on this page is real today. Novices +34% with AI — junior hiring −13%. Tutoring lifts learning — auto-answers halve checking. The split isn't coming; it's in the data now.",
  },
  {
    until: 2038,
    label: "2031–2038 · The compounding decade",
    text: "Nothing new needs to happen. The same incentives keep paying — engagement over outcomes, substitution over apprenticeship — and small habit gaps compound into capability gaps.",
  },
  {
    until: 2046,
    label: "2039–2046 · The generational split",
    text: "The first generation that never knew life before AI reaches adulthood. Whether AI thought for them or with them has become their ceiling — and the two groups barely overlap.",
  },
];

function eraAt(year: number) {
  return ERAS.find(e => year <= e.until) ?? ERAS[ERAS.length - 1];
}

export function ThoughtProcess() {
  const [year, setYear] = useState(2026);
  const [playing, setPlaying] = useState(false);

  // Play advances one year per tick and stops itself at 2046 (no loop).
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setYear(y => Math.min(y + 1, 2046)), 600);
    return () => clearInterval(id);
  }, [playing]);

  useEffect(() => {
    if (playing && year >= 2046) setPlaying(false);
  }, [playing, year]);

  const togglePlay = () => {
    if (!playing && year >= 2046) setYear(2026); // pressing play at the end replays
    setPlaying(p => !p);
  };

  const t = (year - 2026) / 20;
  const eased = t * t * (3 - 2 * t); // same smoothstep as the trajectory paths
  const era = eraAt(year);

  return (
    <div className="rounded-xl border border-border/60 bg-muted/5 p-6 mb-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-10 gap-y-6">

        {/* The writeup: the argument, no hedging */}
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            The thought process
          </p>
          <div className="space-y-2.5 text-xs text-muted-foreground leading-relaxed">
            <p>
              <strong className="text-foreground/90">Start with what's measured, not imagined.</strong>{" "}
              AI makes beginners dramatically better — and gets them hired less. It lifts learning
              when it tutors, erodes it when it answers. It beats our eyes on fakes, and it sits
              inside teenagers' emotional lives.
            </p>
            <p>
              <strong className="text-foreground/90">Notice what every fact shares.</strong>{" "}
              The benefit goes to whoever uses AI deliberately. The cost lands on whoever lets it
              substitute. Same tool, opposite outcomes.
            </p>
            <p>
              <strong className="text-foreground/90">Now run the years.</strong>{" "}
              Deliberate users compound — better thinking, better work, better pay. The substituted
              compound too, in the other direction. No villain required; incentives doing what
              incentives do.
            </p>
            <p className="text-foreground/90 font-semibold">
              We are not predicting a split. We are reporting one that has started. Drag the years
              and watch it widen. →
            </p>
          </div>
        </div>

        {/* The time travel: one slider, five areas splitting */}
        <div className="lg:col-span-2">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-1">
            <button
              onClick={togglePlay}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/60 text-xs font-medium hover:border-border hover:bg-muted/10 transition-colors"
              aria-label={playing ? "Pause the time travel" : "Play the time travel"}
            >
              {playing
                ? <><Pause className="w-3.5 h-3.5" /> Pause</>
                : <><Play className="w-3.5 h-3.5" /> {year >= 2046 ? "Replay" : "Play"}</>}
            </button>
            <span className="text-3xl font-bold tabular-nums tracking-tight">{year}</span>
            <input
              type="range"
              min={2026}
              max={2046}
              step={1}
              value={year}
              onChange={e => { setPlaying(false); setYear(Number(e.target.value)); }}
              className="flex-1 min-w-[160px] accent-foreground"
              aria-label="Travel through the years 2026 to 2046"
            />
          </div>
          <p className="text-xs font-semibold mb-0.5">{era.label}</p>
          <p className="text-xs text-muted-foreground leading-relaxed mb-4">{era.text}</p>

          {/* Per-area diverging bars around a center line */}
          <div className="flex justify-between text-[10px] uppercase tracking-widest text-muted-foreground/70 mb-1.5">
            <span className="text-red-500/80">← Hollowed out by it</span>
            <span className="text-green-600/80">Made stronger by it →</span>
          </div>
          <div className="space-y-2.5">
            {DOMAINS.map(d => {
              const up = (PATH_END[d.id].A - 50) * eased; // the augmented stratum
              const down = (50 - PATH_END[d.id].C) * eased; // the hollowed stratum
              const show = eased > 0.65;
              return (
                <div key={d.id}>
                  <p className="text-[11px] text-muted-foreground mb-0.5 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                    {PLAIN_TITLES[d.id]}
                  </p>
                  <div className="flex items-center h-5">
                    <div className="flex-1 flex justify-end items-center gap-1.5">
                      <span
                        className={`text-[10px] text-red-500/90 whitespace-nowrap transition-opacity duration-500 ${show ? "opacity-100" : "opacity-0"}`}
                      >
                        {SPLIT_ENDS[d.id].loses}
                      </span>
                      <div
                        className="h-3 rounded-l-full bg-red-500/70 transition-all duration-300"
                        style={{ width: `${down * 2.6}%` }}
                      />
                    </div>
                    <div className="w-px h-5 bg-border flex-shrink-0" />
                    <div className="flex-1 flex items-center gap-1.5">
                      <div
                        className="h-3 rounded-r-full bg-green-600/70 transition-all duration-300"
                        style={{ width: `${up * 2.6}%` }}
                      />
                      <span
                        className={`text-[10px] text-green-600/90 whitespace-nowrap transition-opacity duration-500 ${show ? "opacity-100" : "opacity-0"}`}
                      >
                        {SPLIT_ENDS[d.id].gains}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-muted-foreground/70 leading-relaxed mt-3">
            ⚪ One path — the one present data supports. Both sides are real at once: the same tool,
            in the same year, strengthening one group while hollowing the other. Bar lengths are
            illustrative; the widening is the claim, never the numbers.
          </p>
        </div>
      </div>
    </div>
  );
}
