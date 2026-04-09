import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_GOV_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_GOV_SUPABASE_ANON_KEY as string;

export const govDb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Types ─────────────────────────────────────────────────────────────────────

export type DbPolicy = {
  id: string;
  name: string;
  short_name: string;
  regulating_body: string;
  jurisdiction: string[];
  status: string;
  enforcement_date: string;
  penalty_regime: string;
  intro: string;
  sort_order: number;
};

export type DbArea = {
  id: string;
  policy_id: string;
  slug: string;
  area_name: string;
  phase_group: string | null;
  regulatory_ref: string;
  priority: string;
  effort: string;
  pillar: string;
  stakeholder: string;
  risk_if_not_addressed: string;
  iso_mapping: string[];
  dependencies: string[];
  evidence_to_collect: string[];
  question_deps: Record<string, number>;
  maturity_not_started: string;
  maturity_developing: string;
  maturity_defined: string;
  maturity_optimised: string;
  sort_order: number;
};

export type DbQuestion = {
  id: string;
  area_id: string;
  policy_id: string;
  question_text: string;
  clause_ref: string | null;
  guidance: string | null;
  risk_tier: string[];
  sort_order: number;
  last_verified: string;
};

export type DbQuestionTag = {
  question_id: string;
  industry: string;
  relevance: string;
};

export type DbComplianceDeadline = {
  policy_id: string;
  deadline_date: string;
  requirement: string;
  sort_order: number;
};
