import { ExternalLink } from "lucide-react";
import { CONFIDENCE_META, DOMAINS, SOURCES, SYNTHESIS_SOURCE_NOTE } from "@/data/humanEvolution";
import type { DomainId } from "@/data/humanEvolution";
import { DOMAIN_TITLES } from "./shared";

/**
 * Per-tab source footer (S9, Preeti's citation decision 2026-06-11): a compact
 * numbered list of the live-verified sources behind the claims on a tab,
 * grouped by life area. Content comes from SOURCES in the data file — never
 * hardcoded here. Caveated sources (retracted / preprint / contested) keep
 * their warnings visible: the honesty layer is part of the citation.
 */
export function SourceFooter({ domains, synthesis = false }: {
  /** Which life areas this tab draws on (order preserved). */
  domains: DomainId[];
  /** True on tabs that render corpus synthesis (Futures/People/Heatmap/Dashboard). */
  synthesis?: boolean;
}) {
  let n = 0;
  return (
    <div className="mt-8 rounded-xl border border-border/50 bg-muted/5 px-5 py-4">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
        Sources behind this tab
      </p>
      {synthesis && (
        <p className="text-[11px] text-muted-foreground/90 leading-relaxed mb-3">
          {SYNTHESIS_SOURCE_NOTE}
        </p>
      )}
      <div className="md:columns-2 gap-8 [&>div]:break-inside-avoid">
        {domains.map(domainId => {
          const domain = DOMAINS.find(d => d.id === domainId)!;
          return (
            <div key={domainId} className="mb-3">
              <p className="text-[11px] font-semibold text-foreground/80 mb-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: domain.color }} />
                {DOMAIN_TITLES[domainId]}
              </p>
              <ol className="space-y-1">
                {SOURCES[domainId].map(s => {
                  n += 1;
                  return (
                    <li key={s.id} className="text-[11px] text-muted-foreground leading-relaxed flex gap-1.5">
                      <span className="text-muted-foreground/60 flex-shrink-0 tabular-nums">{n}.</span>
                      <span>
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-foreground/80 hover:text-foreground underline decoration-border underline-offset-2 transition-colors"
                        >
                          {s.citation}
                          <ExternalLink className="w-2.5 h-2.5 inline ml-1 mb-0.5 opacity-60" />
                        </a>{" "}
                        <span title={CONFIDENCE_META[s.confidence].label}>{CONFIDENCE_META[s.confidence].emoji}</span>{" "}
                        — {s.finding}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-muted-foreground/70 leading-relaxed mt-1">
        {CONFIDENCE_META.high.emoji} verified published research · {CONFIDENCE_META.medium.emoji} solid
        but with stated caveats · {CONFIDENCE_META.low.emoji} preprint, contested, or cited only as a
        caution. The full research corpus (10 documents) takes precedence over this page.
      </p>
    </div>
  );
}
