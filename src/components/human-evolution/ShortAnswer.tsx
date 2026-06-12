import { DOMAINS, SCENARIOS } from "@/data/humanEvolution";
import type { DomainId, ScenarioId } from "@/data/humanEvolution";

/**
 * "The Short Answer" — the whole report in plain words. Presentation layer
 * only: every fact restates a verified keyStat or scenario from the data
 * file in simpler language; no new claims. Laid out as horizontal card rows
 * so the full page width carries the story.
 */

const SIGNS: { id: DomainId; title: string; line: string }[] = [
  {
    id: "cognition",
    title: "Thinking",
    line: "When AI gives a summary, half of us stop clicking through to the real source. We read the AI's answer and move on.",
  },
  {
    id: "creativity",
    title: "Creating",
    line: "Since AI arrived, freelance writers earn about 5% less — and being one of the best is no protection.",
  },
  {
    id: "discernment",
    title: "Judging what's real",
    line: "Shown a deepfake, people spot it about as often as a coin flip lands heads. Our eyes alone can't tell anymore.",
  },
  {
    id: "mentalHealth",
    title: "Feeling",
    line: "Nearly 3 in 4 teens have talked to an AI companion — and almost a third say it's as satisfying as talking to a person.",
  },
  {
    id: "labor",
    title: "Working",
    line: "AI makes junior workers 34% more productive — and companies hire 13% fewer of them. The bottom rung of the ladder is going.",
  },
];

const PATHS: { id: ScenarioId; title: string; line: string }[] = [
  {
    id: "A",
    title: "The good path",
    line: "Everyone gets the helpful version of AI — tutors that teach, tools that keep you in the loop. It needs governments, schools and companies all pushing the same way at once. Possible — but no technology has ever managed it.",
  },
  {
    id: "B",
    title: "The middle path — we are on it",
    line: "No disaster, no rescue. People who use AI to learn pull ahead. People who let AI do everything fall behind. The average looks fine the whole time — while the gap quietly grows.",
  },
  {
    id: "C",
    title: "The bad path",
    line: "Every safeguard fails. A generation grows up unable to think, work or judge what's true without AI. Unlikely — protections are already being built — but this is what's at stake.",
  },
];

const DO_LIST = [
  "Use AI like a tutor, not a vending machine — ask it to explain, not just to answer.",
  "Keep some skills AI-free: mental maths, first drafts, reading whole sources.",
  "Before you believe or share something, check where it came from.",
  "If a free AI app badly wants your attention, ask who is paying for it.",
];

function domainColor(id: DomainId) {
  return DOMAINS.find(d => d.id === id)?.color ?? "#94a3b8";
}

function scenarioColor(id: ScenarioId) {
  return SCENARIOS.find(s => s.id === id)?.color ?? "#94a3b8";
}

export function ShortAnswer() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-semibold text-sm mb-1">The whole report in plain words</h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Simple words, same facts — every number here comes from the published research cited in the
          other tabs.
        </p>
      </div>

      {/* Row 1: question → answer → direction */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border/60 bg-muted/5 p-5">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">The question</p>
          <p className="text-sm leading-relaxed">
            AI is getting smarter. Are we? This report looks at what AI is doing to five parts of being
            human: how we think, create, judge what's true, feel, and work.
          </p>
        </div>
        <div className="rounded-xl border border-border/60 bg-muted/5 p-5">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">The answer</p>
          <p className="text-sm leading-relaxed">
            Both things are happening at once: the same AI is making some people stronger and others
            weaker. What decides isn't the AI — it's how you use it, and the rules around you at school,
            at work and in your country.
          </p>
        </div>
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/[0.04] p-5">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Where we're heading</p>
          <p className="text-sm leading-relaxed">
            Down the middle path — <strong>"The Great Split"</strong> — and it has already started.
            Most averages will keep looking fine. The gap between people will not.
          </p>
        </div>
      </div>

      {/* Row 2: the five signs you can see today */}
      <div>
        <p className="text-xs font-semibold mb-2">Five signs you can already see today</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          {SIGNS.map(sign => (
            <div key={sign.id} className="rounded-xl border border-border/60 bg-muted/5 p-4">
              <p className="text-xs font-semibold mb-1.5 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: domainColor(sign.id) }} />
                {sign.title}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">{sign.line}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Row 3: three paths + what you can do */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {PATHS.map(path => (
          <div
            key={path.id}
            className={`rounded-xl border p-4 ${path.id === "B" ? "border-yellow-500/30 bg-yellow-500/[0.04]" : "border-border/60 bg-muted/5"}`}
          >
            <p className="text-xs font-semibold mb-1.5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: scenarioColor(path.id) }} />
              {path.id} · {path.title}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">{path.line}</p>
          </div>
        ))}
        <div className="rounded-xl border border-border/60 bg-muted/5 p-4">
          <p className="text-xs font-semibold mb-1.5">What you can do</p>
          <ul className="space-y-1.5">
            {DO_LIST.map(item => (
              <li key={item} className="text-xs text-muted-foreground leading-relaxed flex gap-1.5">
                <span className="text-foreground/50 flex-shrink-0">·</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
