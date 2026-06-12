import { ArrowRight } from "lucide-react";
import { DOMAINS } from "@/data/humanEvolution";
import type { DomainId } from "@/data/humanEvolution";

/**
 * The 5-area simple view (S9, Preeti's decision 2026-06-11): the landing
 * layer of the page — one plain card per life area, before any tabs, charts
 * or scenario machinery. Every line is a presentation-layer restatement of
 * DOMAINS.thesis / DOMAINS.keyStat — no new claims. Clicking a card opens
 * The Impacts tab at that area's full evidence row.
 */

interface AreaCopy {
  plainTitle: string;
  verdict: string;
  body: string;
  number: string;
}

const AREA_COPY: Record<DomainId, AreaCopy> = {
  cognition: {
    plainTitle: "Thinking & learning",
    verdict: "Depends on how it's used",
    body: "AI tutors measurably boost learning. AI that just hands over answers makes us check less and think less — and the habit forms fastest in the young.",
    number: "We click through to sources half as often when AI answers first.",
  },
  creativity: {
    plainTitle: "Creativity",
    verdict: "More creators, narrower culture",
    body: "Almost anyone can now make good work. But collective output is starting to look alike, and creative pay is falling even for the best.",
    number: "Freelance creative earnings −5.2% — top performers hit hardest.",
  },
  discernment: {
    plainTitle: "Telling real from fake",
    verdict: "Already lost by eye alone",
    body: "People spot deepfakes no better than a coin flip. The defense that works isn't sharper eyes — it's tools and training, and both are cheap.",
    number: "55.5% deepfake detection accuracy — chance level.",
  },
  mentalHealth: {
    plainTitle: "Mental health & relationships",
    verdict: "Real help, untested risks",
    body: "AI therapy measurably helps people who would otherwise get no care at all. Meanwhile AI companions sit inside teenagers' emotional lives with no long-term data.",
    number: "72% of US teens have used AI companions.",
  },
  labor: {
    plainTitle: "Work & careers",
    verdict: "Easier to start, harder to climb",
    body: "AI makes beginners much better at the job — and makes companies need fewer beginners. The career ladder is losing its bottom rungs.",
    number: "Novices +34% productivity · junior hiring −13%.",
  },
};

export function FiveAreas({ onOpenArea }: { onOpenArea: (domain: DomainId) => void }) {
  return (
    <div className="mb-8">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-4">
        <h2 className="font-semibold text-sm">Five areas of life — the simple version</h2>
        <p className="text-xs text-muted-foreground">
          What twenty years of AI likely does to each. Click a card for the full evidence.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {DOMAINS.map(d => {
          const copy = AREA_COPY[d.id];
          return (
            <button
              key={d.id}
              onClick={() => onOpenArea(d.id)}
              className="group text-left rounded-xl border border-border/60 bg-muted/5 p-5 transition-all hover:border-border hover:bg-muted/10 flex flex-col"
            >
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                {copy.plainTitle}
              </p>
              <p className="text-sm font-semibold mb-2">{copy.verdict}</p>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3 flex-1">{copy.body}</p>
              <p
                className="text-[11px] leading-relaxed border-l-2 pl-2.5 mb-3"
                style={{ borderColor: d.color }}
              >
                {copy.number}
              </p>
              <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1 group-hover:text-foreground transition-colors">
                The full picture <ArrowRight className="w-3 h-3" />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
