import { useEffect, useState } from "react";
import { govDb, DbPolicy, DbArea, DbQuestion, DbComplianceDeadline, DbQuestionTag } from "../lib/supabase-governance";

// ── Shape that ClientDiscovery.tsx already consumes ───────────────────────────

export type GuideArea = {
  area: string;
  phaseGroup?: string;
  isoMapping: string[];
  regulatoryRef: string;
  dependencies: string[];
  priority: string;
  effort: string;
  riskIfNotAddressed: string;
  pillar: string;
  stakeholder: string;
  questions: string[];
  questionDeps: Record<number, number>;
  evidenceToCollect: string[];
  maturityIndicators: {
    notStarted: string;
    developing: string;
    defined: string;
    optimised: string;
  };
  // enrichment fields
  clauseRefs: (string | null)[];   // one per question, same index
  guidance: (string | null)[];     // one per question, same index
  industryTags: { industry: string; relevance: string }[][];  // one array per question
};

export type PolicyGuide = {
  intro: string;
  complianceDeadlines: { date: string; requirement: string }[];
  areas: GuideArea[];
};

export type GuidesMap = Record<string, PolicyGuide>;

// ── Cache ─────────────────────────────────────────────────────────────────────

const CACHE_KEY = "pl_guides_cache_v2"; // bumped to force re-fetch after sort_order fix
const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours

function readCache(): { data: GuidesMap; ts: number } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeCache(data: GuidesMap) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
  } catch {
    // storage full — ignore
  }
}

// ── Transform ─────────────────────────────────────────────────────────────────

function buildGuidesMap(
  policies: DbPolicy[],
  areas: DbArea[],
  questions: DbQuestion[],
  deadlines: DbComplianceDeadline[],
  tags: DbQuestionTag[]
): GuidesMap {
  // Build a quick lookup: question_id → tags[]
  const tagsByQuestion: Record<string, { industry: string; relevance: string }[]> = {};
  for (const tag of tags) {
    if (!tagsByQuestion[tag.question_id]) tagsByQuestion[tag.question_id] = [];
    tagsByQuestion[tag.question_id].push({ industry: tag.industry, relevance: tag.relevance });
  }
  const map: GuidesMap = {};

  for (const policy of policies) {
    const policyAreas = areas
      .filter(a => a.policy_id === policy.id)
      .sort((a, b) => a.sort_order - b.sort_order);

    const policyDeadlines = deadlines
      .filter(d => d.policy_id === policy.id)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(d => ({ date: d.deadline_date, requirement: d.requirement }));

    const guideAreas: GuideArea[] = policyAreas.map(area => {
      const areaQuestions = questions
        .filter(q => q.area_id === area.id)
        .sort((a, b) => a.sort_order - b.sort_order);

      return {
        area: area.area_name,
        phaseGroup: area.phase_group ?? undefined,
        isoMapping: area.iso_mapping ?? [],
        regulatoryRef: area.regulatory_ref ?? "",
        dependencies: area.dependencies ?? [],
        priority: area.priority ?? "Medium",
        effort: area.effort ?? "Medium",
        riskIfNotAddressed: area.risk_if_not_addressed ?? "",
        pillar: area.pillar ?? "governance",
        stakeholder: area.stakeholder ?? "",
        questions: areaQuestions.map(q => q.question_text),
        questionDeps: (area.question_deps ?? {}) as Record<number, number>,
        evidenceToCollect: area.evidence_to_collect ?? [],
        maturityIndicators: {
          notStarted: area.maturity_not_started ?? "",
          developing: area.maturity_developing ?? "",
          defined: area.maturity_defined ?? "",
          optimised: area.maturity_optimised ?? "",
        },
        clauseRefs: areaQuestions.map(q => q.clause_ref),
        guidance: areaQuestions.map(q => q.guidance),
        industryTags: areaQuestions.map(q => tagsByQuestion[q.id] ?? []),
      };
    });

    map[policy.id] = {
      intro: policy.intro ?? "",
      complianceDeadlines: policyDeadlines,
      areas: guideAreas,
    };
  }

  return map;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function usePolicyGuides() {
  const [guides, setGuides] = useState<GuidesMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const fetchGuides = async (forceRefresh = false) => {
    // Try cache first (unless forced refresh)
    if (!forceRefresh) {
      const cached = readCache();
      if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
        setGuides(cached.data);
        setLastFetched(new Date(cached.ts));
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const [
        { data: policies, error: pErr },
        { data: areas, error: aErr },
        { data: questions, error: qErr },
        { data: deadlines, error: dErr },
        { data: tags, error: tErr },
      ] = await Promise.all([
        govDb.from("policies").select("*").order("sort_order"),
        govDb.from("areas").select("*").order("sort_order"),
        govDb.from("questions").select("*").order("sort_order"),
        govDb.from("compliance_deadlines").select("*").order("sort_order"),
        govDb.from("question_tags").select("*"),
      ]);

      if (pErr || aErr || qErr || dErr || tErr) {
        throw new Error(pErr?.message || aErr?.message || qErr?.message || dErr?.message || tErr?.message);
      }

      const result = buildGuidesMap(
        policies as DbPolicy[],
        areas as DbArea[],
        questions as DbQuestion[],
        deadlines as DbComplianceDeadline[],
        (tags ?? []) as DbQuestionTag[]
      );

      writeCache(result);
      setGuides(result);
      setLastFetched(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load policy data");
      // Fall back to cache even if stale
      const staleCache = readCache();
      if (staleCache) setGuides(staleCache.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuides();
  }, []);

  return { guides, loading, error, lastFetched, refresh: () => fetchGuides(true) };
}
