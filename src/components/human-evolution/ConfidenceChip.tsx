import { CONFIDENCE_META } from "@/data/humanEvolution";
import type { Confidence } from "@/data/humanEvolution";

export function ConfidenceChip({ confidence, showLabel = false }: {
  confidence: Confidence;
  showLabel?: boolean;
}) {
  const meta = CONFIDENCE_META[confidence];
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border whitespace-nowrap"
      style={{ borderColor: `${meta.color}40`, color: meta.color, background: `${meta.color}14` }}
      title={meta.label}
    >
      <span aria-hidden>{meta.emoji}</span>
      {showLabel && meta.label}
    </span>
  );
}
