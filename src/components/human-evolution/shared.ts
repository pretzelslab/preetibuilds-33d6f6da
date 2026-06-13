import { useEffect, useState } from "react";
import type { Cohort, CohortId, DomainId, ScenarioId, TrajectoryPoint } from "@/data/humanEvolution";

/** Presentation colors for the 4 cohorts (distinct from scenario + domain colors). */
export const COHORT_COLORS: Record<CohortId, string> = {
  adolescents: "#f43f5e",
  emergingAdults: "#f59e0b",
  primeWorkforce: "#6366f1",
  experiencedWorkforce: "#10b981",
};

/** Plain-words domain titles shared by the Impacts and Futures views. */
export const DOMAIN_TITLES: Record<DomainId, string> = {
  cognition: "Cognition & Learning",
  creativity: "Creativity & Culture",
  discernment: "Discernment",
  mentalHealth: "Mental Health & Wellbeing",
  labor: "Work & Livelihoods",
};

/**
 * Illustrative 20-year paths per domain × future (⚪ Tier 3, same standard as
 * TRAJECTORIES): 50 = the 2026 baseline; the direction is the claim, never
 * the numbers. End values render each domain's scenario outcome qualitatively.
 */
export const PATH_END: Record<DomainId, Record<ScenarioId, number>> = {
  cognition: { A: 68, B: 50, C: 34 },
  creativity: { A: 64, B: 52, C: 38 },
  discernment: { A: 66, B: 46, C: 30 },
  mentalHealth: { A: 70, B: 50, C: 33 },
  labor: { A: 67, B: 49, C: 36 },
};

/**
 * Per-domain pace of change (S11): identical easing on every curve reads as
 * false certainty — a scenario model should show different velocities. These
 * shapes render relative-pace claims from the research: discernment moves
 * fastest (deepfake/verification findings), cognition slowest (erosion lags
 * adoption), creativity flattens then drops, mental health drifts steadily,
 * work sits in the middle. Monotonic 0→1; endpoints (PATH_END) unchanged.
 * ⚪ Same Tier 3 standard — the shape is the claim, never the numbers.
 */
const DOMAIN_PACE: Record<DomainId, (t: number) => number> = {
  discernment: t => 1 - (1 - t) * (1 - t),
  labor: t => t * t * (3 - 2 * t),
  mentalHealth: t => t,
  creativity: t => t * t * t,
  cognition: t => t * t,
};

/** Pace-eased path value for a domain × future at any year. */
export function pathValueAt(domainId: DomainId, scenarioId: ScenarioId, year: number): number {
  const t = Math.min(Math.max((year - 2026) / 20, 0), 1);
  return 50 + (PATH_END[domainId][scenarioId] - 50) * DOMAIN_PACE[domainId](t);
}

/** Age range of a cohort at any year, offset from its 2026 baseline (en-dash format, e.g. "13–18"). */
export function agesAt(cohort: Cohort, year: number): string {
  const [lo, hi] = cohort.ages2026.split("–").map(Number);
  const offset = year - 2026;
  return `${lo + offset}–${hi + offset}`;
}

/** Linear interpolation of the illustrative index between trajectory points. */
export function indexAt(points: TrajectoryPoint[], year: number): number {
  const exact = points.find(p => p.year === year);
  if (exact) return exact.index;
  const before = [...points].reverse().find(p => p.year < year);
  const after = points.find(p => p.year > year);
  if (!before || !after) return points[0].index;
  const t = (year - before.year) / (after.year - before.year);
  return before.index + t * (after.index - before.index);
}

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}
