import type { Tier } from "@/data/humanEvolution";

const TIER_STYLES: Record<Tier, string> = {
  know: "bg-foreground text-background border-foreground",
  suspect: "border-foreground/50 text-foreground",
  imagine: "border-dashed border-muted-foreground/60 text-muted-foreground",
};

const TIER_LABELS: Record<Tier, string> = {
  know: "Tier 1 · What we know",
  suspect: "Tier 2 · What we suspect",
  imagine: "Tier 3 · What we imagine",
};

export function TierBadge({ tier, label }: { tier: Tier; label?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border whitespace-nowrap ${TIER_STYLES[tier]}`}>
      {tier === "imagine" && <span aria-hidden>⚪</span>}
      {label ?? TIER_LABELS[tier]}
    </span>
  );
}
