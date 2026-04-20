import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { PageGate } from "@/components/ui/PageGate";
import { DiagonalWatermark } from "@/components/ui/DiagonalWatermark";
import { useVisitLogger } from "@/hooks/useVisitLogger";

// ─── Types ─────────────────────────────────────────────────────────────────────

type ModelType = "classifier" | "scoring" | "generative" | "ranking" | "recommendation";
type UseCase = "hiring" | "credit" | "healthcare" | "general";
type OutputType = "binary" | "score" | "recommendation" | "ranking";
type DeploymentType = "automated" | "human-reviews" | "human-approves";
type PopulationSize = "small" | "medium" | "large";
type DataSource = "proprietary" | "third-party" | "public" | "synthetic";

type Jurisdiction = "eu" | "uk" | "us-ca" | "us-ny" | "us-co" | "us-il" | "canada" | "other";

interface IntakeData {
  modelType: ModelType | "";
  useCase: UseCase | "";
  outputType: OutputType | "";
  deployment: DeploymentType | "";
  populationSize: PopulationSize | "";
  dataTypes: string[];
  specialCategoryData: boolean;
  specialCategories: string[];
  dataSource: DataSource | "";
  dataMinimisationDone: boolean;
  humanReview: boolean;
  humanReviewDesc: string;
  appealsExist: boolean;
  jurisdictions: Jurisdiction[];
}

interface RegulationFlag {
  id: string;
  name: string;
  article: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  category: "data" | "process" | "regulatory" | "proxy";
}

interface RiskResult {
  score: number;
  level: "low" | "medium" | "high" | "critical";
  flags: RegulationFlag[];
  breakdown: { data: number; process: number; regulatory: number; proxy: number };
  remediations: RemediationItem[];
}

interface RemediationItem {
  id: string;
  what: string;
  law: string;
  effort: string;
  owner: "legal" | "engineering" | "product";
  priority: number;
  done: boolean;
}

// ─── Regulation Trigger Definitions ───────────────────────────────────────────

const REGULATION_TRIGGERS: Array<{
  id: string;
  name: string;
  article: string;
  description: string;
  severity: RegulationFlag["severity"];
  category: RegulationFlag["category"];
  test: (d: IntakeData) => boolean;
}> = [
  {
    id: "gdpr-art35",
    name: "GDPR Art.35",
    article: "Art.35 — Mandatory DPIA",
    description: "Processing likely to result in high risk (large-scale automated decisions on individuals) requires a DPIA before deployment.",
    severity: "high",
    category: "regulatory",
    test: d => d.jurisdictions.some(j => j === "eu" || j === "uk") && (d.deployment === "automated" || d.populationSize === "large"),
  },
  {
    id: "gdpr-art22",
    name: "GDPR Art.22",
    article: "Art.22 — Automated Decision-Making",
    description: "Automated decisions with legal or similarly significant effects must allow human review, explanation, and contest.",
    severity: "critical",
    category: "process",
    test: d => (d.jurisdictions.includes("eu") || d.jurisdictions.includes("uk")) && d.deployment === "automated" && (d.useCase === "hiring" || d.useCase === "credit"),
  },
  {
    id: "gdpr-art5c",
    name: "GDPR Art.5(1)(c)",
    article: "Art.5(1)(c) — Data Minimisation",
    description: "Personal data must be adequate, relevant, and limited to what is necessary for the specified purpose.",
    severity: "medium",
    category: "data",
    test: d => (d.jurisdictions.includes("eu") || d.jurisdictions.includes("uk")) && !d.dataMinimisationDone,
  },
  {
    id: "gdpr-art9",
    name: "GDPR Art.9",
    article: "Art.9 — Special Category Data",
    description: "Processing special category data (health, biometric, racial/ethnic origin, religion, etc.) requires explicit consent or specific legal basis.",
    severity: "critical",
    category: "data",
    test: d => (d.jurisdictions.includes("eu") || d.jurisdictions.includes("uk")) && d.specialCategoryData,
  },
  {
    id: "euaia-annex3",
    name: "EU AI Act Annex III",
    article: "Annex III — High-Risk AI System",
    description: "Employment, credit, and biometric AI systems are explicitly listed as high-risk under EU AI Act Annex III, requiring conformity assessment.",
    severity: "critical",
    category: "regulatory",
    test: d => d.jurisdictions.includes("eu") && (d.useCase === "hiring" || d.useCase === "credit" || d.dataTypes.includes("biometric")),
  },
  {
    id: "euaia-art10",
    name: "EU AI Act Art.10",
    article: "Art.10 — Training Data Governance",
    description: "High-risk AI training data must be bias-tested and documented. Third-party purchased data with no bias testing is a hard fail.",
    severity: "high",
    category: "data",
    test: d => d.jurisdictions.includes("eu") && d.dataSource === "third-party" && !d.dataMinimisationDone,
  },
  {
    id: "euaia-art13",
    name: "EU AI Act Art.13",
    article: "Art.13 — Transparency & Model Card",
    description: "High-risk AI systems must provide a model card documenting purpose, performance, limitations, and oversight mechanisms.",
    severity: "high",
    category: "regulatory",
    test: d => d.jurisdictions.includes("eu") && (d.useCase === "hiring" || d.useCase === "credit"),
  },
  {
    id: "nyc-ll144",
    name: "NYC Local Law 144",
    article: "NYC LL144 — Mandatory Annual Bias Audit",
    description: "Automated employment decision tools used in NYC require an annual bias audit by an independent auditor before use.",
    severity: "critical",
    category: "regulatory",
    test: d => d.jurisdictions.includes("us-ny") && d.useCase === "hiring",
  },
  {
    id: "colorado-ai",
    name: "Colorado AI Act",
    article: "Colorado SB24-205 — Consequential Decisions",
    description: "AI systems making consequential decisions (employment, credit, housing, insurance) must exercise reasonable care to prevent algorithmic discrimination.",
    severity: "high",
    category: "regulatory",
    test: d => d.jurisdictions.includes("us-co") && (d.useCase === "hiring" || d.useCase === "credit"),
  },
  {
    id: "ccpa",
    name: "CCPA / CPRA",
    article: "CCPA §1798.185 — Automated Profiling",
    description: "California residents have opt-out rights for profiling used in consequential decisions. Sensitive personal information requires explicit consent.",
    severity: "high",
    category: "regulatory",
    test: d => d.jurisdictions.includes("us-ca") && (d.useCase === "hiring" || d.useCase === "credit"),
  },
  {
    id: "illinois-bipa",
    name: "Illinois BIPA",
    article: "740 ILCS 14 — Biometric Data",
    description: "Collecting or using biometric data in Illinois requires written consent, retention policy, and destruction schedule. Statutory damages of $1,000–$5,000 per violation.",
    severity: "critical",
    category: "data",
    test: d => d.jurisdictions.includes("us-il") && d.dataTypes.includes("biometric"),
  },
  {
    id: "canada-pipeda",
    name: "Canada PIPEDA / Bill C-27",
    article: "PIPEDA + AIDA — AI Governance",
    description: "Automated decision systems must be transparent, and high-impact AI systems require risk assessments and human oversight.",
    severity: "medium",
    category: "regulatory",
    test: d => d.jurisdictions.includes("canada"),
  },
  {
    id: "no-appeals",
    name: "Right to Explanation",
    article: "GDPR Art.22 + Colorado AI Act",
    description: "No appeals or correction mechanism exists. Affected individuals have no way to contest automated decisions — a requirement under multiple regulations.",
    severity: "high",
    category: "process",
    test: d => !d.appealsExist && d.deployment === "automated",
  },
];

// ─── Risk Engine ───────────────────────────────────────────────────────────────

function computeBaseScore(d: IntakeData): { data: number; process: number; regulatory: number; proxy: number } {
  let data = 0;
  let process = 0;
  let regulatory = 0;
  let proxy = 0;

  if (d.specialCategoryData) data += 25;
  if (d.dataSource === "third-party") data += 12;
  if (!d.dataMinimisationDone) data += 10;
  if (d.dataTypes.includes("biometric")) data += 18;
  if (d.dataTypes.includes("health")) data += 15;
  if (d.dataTypes.length > 6) data += 8;

  if (d.deployment === "automated") process += 30;
  else if (d.deployment === "human-reviews") process += 12;
  if (!d.appealsExist) process += 20;
  if (!d.humanReview) process += 10;

  if (d.jurisdictions.includes("eu")) regulatory += 15;
  if (d.jurisdictions.includes("us-ny") && d.useCase === "hiring") regulatory += 20;
  if (d.jurisdictions.includes("us-il") && d.dataTypes.includes("biometric")) regulatory += 25;
  if (d.useCase === "hiring" || d.useCase === "credit") regulatory += 10;
  if (d.populationSize === "large") regulatory += 8;

  const PROXY_FEATURES = ["postcode", "employment-history", "browser-device", "income", "social-media"];
  const proxyCount = d.dataTypes.filter(f => PROXY_FEATURES.includes(f)).length;
  if (proxyCount >= 2) proxy += proxyCount * 8;
  else if (proxyCount === 1) proxy += 6;

  return { data, process, regulatory, proxy };
}

function applyMultipliers(base: { data: number; process: number; regulatory: number; proxy: number }, d: IntakeData): number {
  let score = base.data + base.process + base.regulatory + base.proxy;

  // Rule: automated × special category → ×2.5
  if (d.deployment === "automated" && d.specialCategoryData) {
    score = score * 2.5;
  }

  // Rule: large population × no appeals → escalate to Critical floor
  if (d.populationSize === "large" && !d.appealsExist && d.deployment === "automated") {
    score = Math.max(score, 82);
  }

  // Rule: EU AI Act Annex III high-risk use case × automated = ×1.8
  if ((d.useCase === "hiring" || d.useCase === "credit") && d.deployment === "automated" && d.jurisdictions.includes("eu")) {
    score = score * 1.8;
  }

  // Rule: BIPA trigger (Illinois + biometric) → always Critical
  if (d.jurisdictions.includes("us-il") && d.dataTypes.includes("biometric")) {
    score = Math.max(score, 85);
  }

  return Math.min(Math.round(score), 100);
}

function computeRiskScore(d: IntakeData): RiskResult {
  const base = computeBaseScore(d);
  const score = applyMultipliers(base, d);

  const level: RiskResult["level"] =
    score >= 81 ? "critical" :
    score >= 61 ? "high" :
    score >= 31 ? "medium" : "low";

  const flags: RegulationFlag[] = REGULATION_TRIGGERS
    .filter(r => r.test(d))
    .map(r => ({ id: r.id, name: r.name, article: r.article, description: r.description, severity: r.severity, category: r.category }));

  const remediations: RemediationItem[] = buildRemediations(flags, d);

  const breakdown = {
    data: Math.min(base.data, 100),
    process: Math.min(base.process, 100),
    regulatory: Math.min(base.regulatory, 100),
    proxy: Math.min(base.proxy, 100),
  };

  return { score, level, flags, breakdown, remediations };
}

function buildRemediations(flags: RegulationFlag[], d: IntakeData): RemediationItem[] {
  const items: RemediationItem[] = [];

  if (flags.find(f => f.id === "gdpr-art22")) {
    items.push({
      id: "r1", done: false, priority: 1,
      what: "Implement mandatory human review step before any automated decision affects an individual",
      law: "GDPR Art.22(3) — right to human review for significant automated decisions",
      effort: "3–5 days (engineering + product)",
      owner: "engineering",
    });
  }
  if (flags.find(f => f.id === "no-appeals")) {
    items.push({
      id: "r2", done: false, priority: 2,
      what: "Build and document an appeals and correction mechanism for affected individuals",
      law: "GDPR Art.22 + Colorado AI Act — right to explanation and contest",
      effort: "5–8 days (product + legal)",
      owner: "product",
    });
  }
  if (flags.find(f => f.id === "euaia-annex3")) {
    items.push({
      id: "r3", done: false, priority: 1,
      what: "Register as High-Risk AI system under EU AI Act — begin conformity assessment",
      law: "EU AI Act Annex III + Art.43 — mandatory conformity assessment before market placement",
      effort: "4–8 weeks (legal + compliance)",
      owner: "legal",
    });
  }
  if (flags.find(f => f.id === "nyc-ll144")) {
    items.push({
      id: "r4", done: false, priority: 1,
      what: "Commission independent annual bias audit before using tool for NYC-based hiring decisions",
      law: "NYC Local Law 144 — mandatory annual bias audit, public summary required",
      effort: "3–6 weeks + £8–15k audit cost",
      owner: "legal",
    });
  }
  if (flags.find(f => f.id === "euaia-art10")) {
    items.push({
      id: "r5", done: false, priority: 2,
      what: "Document training data provenance, run bias testing across demographic groups",
      law: "EU AI Act Art.10 — training data governance and bias testing requirements",
      effort: "2–3 weeks (engineering)",
      owner: "engineering",
    });
  }
  if (flags.find(f => f.id === "gdpr-art5c")) {
    items.push({
      id: "r6", done: false, priority: 3,
      what: "Conduct data minimisation review — document why each feature is necessary and proportionate",
      law: "GDPR Art.5(1)(c) — data minimisation principle",
      effort: "1–2 days (legal + engineering)",
      owner: "legal",
    });
  }
  if (flags.find(f => f.id === "gdpr-art9")) {
    items.push({
      id: "r7", done: false, priority: 1,
      what: "Identify legal basis for special category data processing — consider removing if no explicit basis",
      law: "GDPR Art.9 — explicit consent or Schedule 1 conditions required",
      effort: "1–2 weeks (legal)",
      owner: "legal",
    });
  }
  if (flags.find(f => f.id === "euaia-art13")) {
    items.push({
      id: "r8", done: false, priority: 3,
      what: "Produce model card documenting system purpose, performance metrics, limitations, and human oversight",
      law: "EU AI Act Art.13 — transparency and model documentation for high-risk AI",
      effort: "3–5 days (engineering + product)",
      owner: "product",
    });
  }
  if (flags.find(f => f.id === "illinois-bipa")) {
    items.push({
      id: "r9", done: false, priority: 1,
      what: "Obtain written biometric data collection consent, establish retention and destruction schedule",
      law: "Illinois BIPA 740 ILCS 14 — statutory damages $1,000–$5,000 per negligent/intentional violation",
      effort: "1–2 weeks (legal + engineering)",
      owner: "legal",
    });
  }
  if (flags.find(f => f.id === "colorado-ai")) {
    items.push({
      id: "r10", done: false, priority: 2,
      what: "Document reasonable care measures to prevent algorithmic discrimination for CO users",
      law: "Colorado AI Act SB24-205 — consequential decisions require discrimination prevention policy",
      effort: "2–3 days (legal)",
      owner: "legal",
    });
  }

  return items.sort((a, b) => a.priority - b.priority);
}

// ─── Proxy Discrimination Logic ───────────────────────────────────────────────

const FEATURE_RISK_MAP: Record<string, {
  risk: "direct" | "known-proxy" | "correlated" | "neutral";
  proxiesFor?: string[];
  regulation?: string;
  explanation: string;
}> = {
  "race-ethnicity": { risk: "direct", explanation: "Direct protected characteristic under GDPR Art.9, ECOA, and EU AI Act. Cannot be used in employment or credit models without explicit legal justification." },
  "gender": { risk: "direct", explanation: "Direct protected characteristic — heightened scrutiny for employment and credit decisions under EU AI Act, Equality Act 2010, and ECOA." },
  "age": { risk: "correlated", proxiesFor: ["Disability", "Pregnancy"], explanation: "Correlated with disability and pregnancy. Age-based scoring in employment models is documented disparate impact under ADEA and Equality Act 2010 (Sch.9)." },
  "postcode": { risk: "known-proxy", proxiesFor: ["Race", "Income class"], regulation: "EU AI Act Art.10 · ECOA · Colorado AI Act", explanation: "Classic redlining proxy. Encodes residential segregation patterns. Cited in multiple CFPB fair lending enforcement actions — postcode correlates with race more strongly than credit score in many US metro areas." },
  "employment-history": { risk: "known-proxy", proxiesFor: ["Gender", "Pregnancy"], regulation: "EU AI Act Art.10 · EEOC AI Guidance (2023)", explanation: "Employment gaps correlate strongly with pregnancy and primary caregiving (predominantly female). EEOC 2023 guidance flags employment gap analysis in automated hiring as a documented gender discrimination vector." },
  "browser-device": { risk: "correlated", proxiesFor: ["Income class"], explanation: "Device type and browser version correlate with household income. Models trained on digital engagement data systematically disadvantage lower-income users operating older hardware." },
  "income": { risk: "correlated", proxiesFor: ["Race", "Gender"], explanation: "Income reflects historical labour market discrimination. Models using income as a feature can perpetuate race and gender pay gaps already embedded in the training distribution." },
  "social-media": { risk: "known-proxy", proxiesFor: ["Political views", "Religion", "Ethnicity"], regulation: "GDPR Art.9 · EU AI Act Art.10", explanation: "Social media activity can expose political opinions, religious beliefs, and ethnic community affiliations — all special category data under GDPR Art.9. Inference from social graphs is extremely hard to audit for disparate impact." },
  "credit-history": { risk: "known-proxy", proxiesFor: ["Race", "Income class"], regulation: "ECOA · EU AI Act Art.10 · Fair Housing Act", explanation: "Credit scores encode historical lending discrimination. Obermeyer et al. 2019 and ProPublica COMPAS analysis both document systematic underscoring of minority groups even after controlling for objective risk factors." },
  "name": { risk: "correlated", proxiesFor: ["Ethnicity", "Gender"], explanation: "Names encode ethnic origin and gender. NLP-based name analysis is a documented CV screening discrimination vector — Bertrand & Mullainathan (2004) showed identical CVs with 'Black-sounding' names received 50% fewer callbacks." },
  "health": { risk: "direct", explanation: "Special category under GDPR Art.9. Direct protected characteristic (disability) under ADA and Equality Act 2010. Requires explicit consent or Schedule 1 legal basis." },
  "biometric": { risk: "direct", explanation: "Special category under GDPR Art.9. Triggers Illinois BIPA mandatory written consent, retention policy, and statutory damages ($1k–$5k per violation)." },
  "other": { risk: "neutral", explanation: "Risk profile depends on specific data type. Review individually for correlation with protected characteristics before including in a high-risk AI model." },
};

interface CombinationRisk {
  features: string[];
  combinedProxy: string;
  regulation: string;
  risk: "critical" | "high" | "medium";
  explanation: string;
}

const COMBINATION_RULES: CombinationRisk[] = [
  { features: ["postcode", "employment-history", "browser-device"], combinedProxy: "Race + Income + Gender", regulation: "EU AI Act Art.10 · ECOA · NYC LL144", risk: "critical", explanation: "Triple-proxy cluster. Each feature looks innocent individually; combined they create a high-confidence discriminatory signal for race, income class, and gender without using any protected characteristic directly. Cited pattern in multiple CFPB fair lending examinations." },
  { features: ["postcode", "credit-history"], combinedProxy: "Race + Socioeconomic Status", regulation: "ECOA · EU AI Act Art.10 · Colorado AI Act", risk: "high", explanation: "The archetypal redlining proxy. Postcode × credit history compounds residential segregation with historical lending discrimination. Multiple CFPB enforcement actions cite this exact combination as evidence of disparate impact." },
  { features: ["postcode", "income"], combinedProxy: "Race + Socioeconomic Status", regulation: "ECOA · EU AI Act Art.10", risk: "high", explanation: "Location + income amplifies socioeconomic disparities that correlate strongly with race in US and UK contexts — creating a geography-based discrimination signal without using race data." },
  { features: ["employment-history", "income"], combinedProxy: "Gender + Socioeconomic Status", regulation: "EU AI Act Art.10 · Equality Act 2010 · EEOC", risk: "high", explanation: "Employment gaps × income creates a compound penalty for women who took maternity or caregiving breaks — lower income and higher gap frequency compounding from the same underlying protected characteristic." },
  { features: ["social-media", "postcode"], combinedProxy: "Ethnicity + Religion + Residential Location", regulation: "GDPR Art.9 · EU AI Act Art.10", risk: "critical", explanation: "Social media + location enables fine-grained ethnic and religious community inference that neither feature alone would expose. The combination constitutes de facto processing of special category data under GDPR Art.9." },
  { features: ["age", "employment-history"], combinedProxy: "Disability + Gender", regulation: "Equality Act 2010 · ADA · EU AI Act Art.10", risk: "medium", explanation: "Age × employment gaps compounds disability-related work interruptions with pregnancy-related career breaks — a double penalty for older women and disabled workers that neither feature alone would create." },
  { features: ["name", "postcode"], combinedProxy: "Ethnicity + Residential Segregation", regulation: "ECOA · EU AI Act Art.10", risk: "high", explanation: "Name-based ethnicity inference combined with residential location creates a high-confidence proxy for ethnic origin — a direct protected characteristic — without touching ethnic data." },
];

function detectProxyCombinations(dataTypes: string[]): CombinationRisk[] {
  return COMBINATION_RULES.filter(rule => rule.features.every(f => dataTypes.includes(f)));
}

// ─── Nutrition Label Scoring ──────────────────────────────────────────────────

function computeNutritionScores(d: IntakeData): Record<string, "green" | "amber" | "red"> {
  return {
    "Data Collection":        (d.specialCategoryData || d.dataTypes.includes("biometric")) ? "red" : d.dataTypes.length > 6 ? "amber" : "green",
    "Purpose Limitation":     (d.useCase && d.modelType) ? "green" : "amber",
    "Automated Decisions":    d.deployment === "automated" ? "red" : d.deployment === "human-reviews" ? "amber" : "green",
    "Human Oversight":        (!d.humanReview && d.deployment === "automated") ? "red" : d.humanReview ? "green" : "amber",
    "Right to Explanation":   !d.appealsExist ? "red" : "green",
    "Bias Testing":           (d.dataSource === "third-party" && !d.dataMinimisationDone) ? "red" : !d.dataMinimisationDone ? "amber" : "green",
    "Data Minimisation":      !d.dataMinimisationDone ? (d.dataTypes.length > 6 ? "red" : "amber") : "green",
    "Cross-border Transfers": d.jurisdictions.length > 3 ? "red" : d.jurisdictions.length > 1 ? "amber" : "green",
  };
}

// ─── Differential Privacy Math ─────────────────────────────────────────────────

function buildDPCurve(baseAccuracy: number) {
  const epsilons = [0.01, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100];
  return epsilons.map(eps => {
    // Laplace mechanism: noise variance = (sensitivity/ε)²
    // Accuracy degradation approximation: accuracy_loss ≈ 1/(1 + ε * n_factor)
    const nFactor = 0.4; // calibrated for illustrative credit scoring model
    const accuracyLoss = 1 / (1 + eps * nFactor);
    const accuracy = Math.max(baseAccuracy - accuracyLoss * (baseAccuracy - 0.5) * 1.1, 50);
    return {
      epsilon: eps,
      epsilonLabel: eps < 1 ? eps.toString() : eps >= 10 ? eps.toString() : eps.toString(),
      accuracy: Math.round(accuracy * 10) / 10,
      privacyProtection: Math.round((1 - Math.log(eps + 1) / Math.log(101)) * 100),
    };
  });
}

// ─── Seed Scenario (Preview Mode) ─────────────────────────────────────────────

const SEED_HR: IntakeData = {
  modelType: "classifier",
  useCase: "hiring",
  outputType: "binary",
  deployment: "automated",
  populationSize: "medium",
  dataTypes: ["age", "postcode", "employment-history", "browser-device", "social-media"],
  specialCategoryData: false,
  specialCategories: [],
  dataSource: "third-party",
  dataMinimisationDone: false,
  humanReview: false,
  humanReviewDesc: "",
  appealsExist: false,
  jurisdictions: ["eu", "uk", "us-ny"],
};

const SEED_RESULT = computeRiskScore(SEED_HR);

// ─── Colour helpers ─────────────────────────────────────────────────────────────

const LEVEL_COLORS = {
  critical: { bg: "#fef2f2", border: "#fecaca", text: "#dc2626", badge: "#dc2626" },
  high:     { bg: "#fff7ed", border: "#fed7aa", text: "#c2410c", badge: "#ea580c" },
  medium:   { bg: "#fffbeb", border: "#fde68a", text: "#92400e", badge: "#d97706" },
  low:      { bg: "#f0fdf4", border: "#bbf7d0", text: "#15803d", badge: "#16a34a" },
};

const SEV_COLORS: Record<RegulationFlag["severity"], string> = {
  critical: "#dc2626",
  high: "#ea580c",
  medium: "#d97706",
  low: "#16a34a",
};

const OWNER_COLORS: Record<RemediationItem["owner"], string> = {
  legal: "#6366f1",
  engineering: "#0891b2",
  product: "#059669",
};

// ─── Preview Mode Content ──────────────────────────────────────────────────────

function PreviewRiskDashboard() {
  const r = SEED_RESULT;
  const c = LEVEL_COLORS[r.level];
  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <p style={{ fontSize: 12, color: "#64748b", marginBottom: 20 }}>
        Sample: EU financial services hiring classifier — automated shortlist, no human review, offices in EU + UK + NYC.
      </p>

      {/* Risk level badge */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <div style={{ background: c.bg, border: `2px solid ${c.border}`, borderRadius: 12, padding: "12px 24px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: c.badge, boxShadow: `0 0 8px ${c.badge}` }} />
          <span style={{ fontSize: 18, fontWeight: 800, color: c.text, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            {r.level} risk
          </span>
          <span style={{ fontSize: 28, fontWeight: 900, color: c.text }}>{r.score}</span>
          <span style={{ fontSize: 12, color: c.text }}>/100</span>
        </div>
      </div>

      {/* Risk breakdown */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 24 }}>
        {(["data", "process", "regulatory", "proxy"] as const).map(cat => (
          <div key={cat} style={{ background: "hsl(var(--card,#f8fafc))", border: "1px solid hsl(var(--border,#e2e8f0))", borderRadius: 8, padding: "10px 14px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{cat}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: r.breakdown[cat] >= 30 ? "#dc2626" : r.breakdown[cat] >= 15 ? "#d97706" : "#16a34a" }}>
              {r.breakdown[cat]}
            </div>
            <div style={{ marginTop: 4, height: 4, borderRadius: 2, background: "#e2e8f0" }}>
              <div style={{ height: "100%", borderRadius: 2, width: `${Math.min(r.breakdown[cat], 100)}%`, background: r.breakdown[cat] >= 30 ? "#dc2626" : r.breakdown[cat] >= 15 ? "#d97706" : "#16a34a" }} />
            </div>
          </div>
        ))}
      </div>

      {/* Regulation flags */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Regulations Triggered ({r.flags.length})
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {r.flags.slice(0, 5).map(f => (
            <div key={f.id} style={{ background: "hsl(var(--card,#f8fafc))", border: `1px solid ${SEV_COLORS[f.severity]}40`, borderLeft: `3px solid ${SEV_COLORS[f.severity]}`, borderRadius: 6, padding: "8px 12px", display: "flex", alignItems: "flex-start", gap: 10 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: SEV_COLORS[f.severity], textTransform: "uppercase", minWidth: 48, paddingTop: 1 }}>{f.severity}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "hsl(var(--foreground))" }}>{f.article}</div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{f.description.slice(0, 100)}…</div>
              </div>
            </div>
          ))}
          {r.flags.length > 5 && (
            <div style={{ fontSize: 11, color: "#64748b", padding: "4px 12px" }}>+ {r.flags.length - 5} more flags — unlock to view full report</div>
          )}
        </div>
      </div>
    </div>
  );
}

function PreviewPrivacyNutritionLabel({ compact }: { compact?: boolean }) {
  const categories = [
    { label: "Data Collection", score: "red", icon: "🗂️" },
    { label: "Purpose Limitation", score: "amber", icon: "🎯" },
    { label: "Automated Decisions", score: "red", icon: "🤖" },
    { label: "Human Oversight", score: "red", icon: "👤" },
    { label: "Right to Explanation", score: "red", icon: "📋" },
    { label: "Bias Testing", score: "red", icon: "⚖️" },
    { label: "Data Minimisation", score: "amber", icon: "🔬" },
    { label: "Cross-border Transfers", score: "amber", icon: "🌍" },
  ];
  const colors = { red: "#dc2626", amber: "#d97706", green: "#16a34a" };
  const bgs = { red: "#fef2f2", amber: "#fffbeb", green: "#f0fdf4" };
  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif", marginTop: 28 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Privacy Nutrition Label — preview
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
        {categories.map(cat => (
          <div key={cat.label} style={{ background: bgs[cat.score as keyof typeof bgs], border: `1px solid ${colors[cat.score as keyof typeof colors]}40`, borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
            <div style={{ fontSize: 18, marginBottom: 4 }}>{cat.icon}</div>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: colors[cat.score as keyof typeof colors], margin: "0 auto 6px" }} />
            <div style={{ fontSize: 10, fontWeight: 600, color: "#374151", lineHeight: 1.3 }}>{cat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PreviewDPChart() {
  const curve = buildDPCurve(0.82);
  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <p style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>
        Pre-loaded: credit scoring model (baseline accuracy 82%). Lower ε = stronger privacy guarantee but lower accuracy. Unlock to interact.
      </p>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Differential Privacy Tradeoff — Credit Scoring Model (baseline 82%)
      </div>
      <div style={{ height: 160 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={curve} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="epsilonLabel" tick={{ fontSize: 10, fill: "#64748b" }} label={{ value: "ε (epsilon)", position: "insideBottom", offset: -2, fontSize: 10, fill: "#94a3b8" }} />
            <YAxis tick={{ fontSize: 10, fill: "#64748b" }} domain={[50, 90]} unit="%" />
            <Tooltip formatter={(v: number) => [`${v}%`, "Accuracy"]} labelFormatter={(l: string) => `ε = ${l}`} />
            <ReferenceLine x="1" stroke="#6366f1" strokeDasharray="4 2" label={{ value: "ε=1", fontSize: 9, fill: "#6366f1" }} />
            <Line type="monotone" dataKey="accuracy" stroke="#dc2626" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div style={{ fontSize: 10, color: "#64748b", marginTop: 6 }}>
        At ε=1 (commonly accepted balance), model loses ~12pp of accuracy to prevent membership inference attacks.
      </div>
    </div>
  );
}

function PrivacyAuditorPreview() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "dpsim">("dashboard");

  const PREVIEW_TABS = [
    { id: "dashboard" as const, label: "Risk Dashboard" },
    { id: "dpsim"     as const, label: "DP Simulator" },
    { id: "report",             label: "DPIA Report",      locked: true },
    { id: "checklist",          label: "Remediation",      locked: true },
    { id: "nutrition",          label: "Nutrition Label",  locked: true },
    { id: "modelcard",          label: "Model Card",       locked: true },
    { id: "methodology",        label: "Methodology Eval", locked: true },
  ];

  return (
    <div style={{ position: "relative", fontFamily: "'Inter','Segoe UI',sans-serif", minHeight: "100vh", background: "hsl(var(--background))" }}>
      <DiagonalWatermark />

      {/* Page header */}
      <div style={{ borderBottom: "1px solid hsl(var(--border,#e2e8f0))", padding: "14px 24px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 900, margin: 0, color: "hsl(var(--foreground))" }}>Privacy Impact Auditor</h1>
            <p style={{ fontSize: 11, color: "#64748b", margin: "3px 0 0" }}>
              AI-specific DPIA · Dynamic combinatorial risk scoring · GDPR + EU AI Act + NYC LL144 + 10 more regulations
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: LEVEL_COLORS.critical.badge }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: LEVEL_COLORS.critical.text, textTransform: "uppercase" }}>
              Example · Critical — {SEED_RESULT.score}/100
            </span>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ borderBottom: "1px solid hsl(var(--border,#e2e8f0))", padding: "0 24px", overflowX: "auto" }}>
        <div style={{ display: "flex", gap: 0 }}>
          {PREVIEW_TABS.map(t => (
            <button
              key={t.id}
              onClick={() => !t.locked && setActiveTab(t.id as "dashboard" | "dpsim")}
              style={{
                padding: "9px 14px", fontSize: 11, fontWeight: 700, border: "none",
                background: "transparent", cursor: t.locked ? "default" : "pointer", whiteSpace: "nowrap",
                borderBottom: activeTab === t.id ? "2px solid #6366f1" : "2px solid transparent",
                color: t.locked ? "#cbd5e1" : activeTab === t.id ? "#6366f1" : "#94a3b8",
              }}
            >
              {t.label}
              {t.locked && <span style={{ marginLeft: 4, fontSize: 9, color: "#cbd5e1" }}>🔒</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ padding: "24px", maxWidth: 900, margin: "0 auto", paddingBottom: 80 }}>
        {activeTab === "dashboard" && <PreviewRiskDashboard />}
        {activeTab === "dpsim" && (
          <>
            <PreviewDPChart />
            <PreviewPrivacyNutritionLabel />
          </>
        )}
      </div>

      {/* Gradient fade overlay */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 140, pointerEvents: "none",
        background: "linear-gradient(to bottom, transparent 0%, hsl(var(--background)) 100%)",
        zIndex: 10,
      }} />
    </div>
  );
}

const previewContent = <PrivacyAuditorPreview />;

// ─── Intake Form ───────────────────────────────────────────────────────────────

const DATA_TYPE_OPTIONS = [
  { value: "name",              label: "Name" },
  { value: "age",               label: "Age" },
  { value: "gender",            label: "Gender" },
  { value: "race-ethnicity",    label: "Race / Ethnicity" },
  { value: "postcode",          label: "Postcode / Zip code" },
  { value: "employment-history",label: "Employment history" },
  { value: "credit-history",    label: "Credit history" },
  { value: "biometric",         label: "Biometric data" },
  { value: "health",            label: "Health / Medical" },
  { value: "income",            label: "Income" },
  { value: "browser-device",    label: "Browser / Device data" },
  { value: "social-media",      label: "Social media activity" },
  { value: "other",             label: "Other" },
];

const SPECIAL_CATEGORIES = [
  "Racial or ethnic origin", "Political opinions", "Religious beliefs",
  "Trade union membership", "Genetic data", "Biometric data",
  "Health data", "Sex life / sexual orientation",
];

const JURISDICTION_OPTIONS: { value: Jurisdiction; label: string }[] = [
  { value: "eu",     label: "European Union (GDPR + EU AI Act)" },
  { value: "uk",     label: "United Kingdom (UK GDPR)" },
  { value: "us-ca",  label: "US — California (CCPA / CPRA)" },
  { value: "us-ny",  label: "US — New York City (NYC LL144)" },
  { value: "us-co",  label: "US — Colorado (AI Act)" },
  { value: "us-il",  label: "US — Illinois (BIPA)" },
  { value: "canada", label: "Canada (PIPEDA / Bill C-27)" },
  { value: "other",  label: "Other jurisdiction" },
];

const EMPTY_INTAKE: IntakeData = {
  modelType: "", useCase: "", outputType: "", deployment: "", populationSize: "",
  dataTypes: [], specialCategoryData: false, specialCategories: [],
  dataSource: "", dataMinimisationDone: false,
  humanReview: false, humanReviewDesc: "", appealsExist: false, jurisdictions: [],
};

// ─── Info Panels — shown next to model type and output type selects ────────────

const MODEL_TYPE_INFO: Record<ModelType, { what: string; examples: string; note: string }> = {
  classifier: {
    what: "Outputs a discrete category — approve/reject, shortlist/pass, high/medium/low risk.",
    examples: "CV screener, loan approval, fraud detector, content moderation.",
    note: "Binary classifiers making consequential decisions are the primary target of GDPR Art.22, NYC LL144, and EU AI Act Annex III.",
  },
  scoring: {
    what: "Outputs a continuous numeric score; decisions are made by applying thresholds to that score.",
    examples: "Credit score (300–850), candidate fit score (0–100), insurance risk score.",
    note: "Threshold placement is a policy decision with disparate impact risk — shifting the cut-off by 10 points can alter approval rates by 15–30% for minority groups.",
  },
  generative: {
    what: "Produces new content — text, images, code, audio — rather than classifying or scoring.",
    examples: "GPT-based chatbot, image generator, code copilot, synthetic data generator.",
    note: "Generative models used in employment or credit contexts still trigger EU AI Act Annex III if the output informs a consequential decision.",
  },
  ranking: {
    what: "Orders a set of candidates or items by estimated relevance, quality, or fit. Position determines priority.",
    examples: "Candidate ranking for hiring, search result ordering, risk-ranked caseload.",
    note: "Position bias is a documented disparate impact vector. The truncation rule ('top 10 candidates') creates a de facto binary cut-off that must be documented under EU AI Act Art.10.",
  },
  recommendation: {
    what: "Suggests items, actions, or people based on learned preferences — without strict ordering.",
    examples: "Job matching, financial product recommendation, next-best-action engine.",
    note: "Recommendations reliably acted on by humans may be treated as automated decisions under GDPR Art.22. Key test: are humans genuinely reviewing, or rubber-stamping?",
  },
};

const OUTPUT_TYPE_INFO: Record<OutputType, { what: string; compliance: string; risk: string }> = {
  binary: {
    what: "The model outputs one of two outcomes — approve/reject, shortlist/pass, flagged/clean.",
    compliance: "Clearest trigger for GDPR Art.22 'solely automated decision-making'. Most jurisdictions require a human review path and right-to-explanation before any binary decision affects someone.",
    risk: "The classification boundary is learned during training, making bias hard to audit without access to the full training dataset and feature weights.",
  },
  score: {
    what: "The model outputs a numeric value; downstream logic applies thresholds to convert it into a decision.",
    compliance: "NYC LL144 mandates annual bias audits for scoring tools used in employment. ECOA prohibits using scores as proxies for protected characteristics. Colorado AI Act requires transparency on how scores drive consequential decisions.",
    risk: "Threshold placement creates disparate impact risk independently of the model. Shifting a cut-off by 10 points can change minority group approval rates by 15–30% without touching the model at all.",
  },
  recommendation: {
    what: "The model suggests items, people, or actions. Presentation and selection logic shapes behaviour without a single threshold.",
    compliance: "If recommendations are reliably acted upon, regulators treat them as de facto automated decisions under GDPR Art.22. CCPA gives California residents opt-out rights from profiling used for recommendations.",
    risk: "Disparate impact is indirect — groups under-represented in training data will be systematically under-recommended. Hard to audit without diversity statistics on recommended outputs.",
  },
  ranking: {
    what: "The model outputs an ordered list. Top positions receive disproportionate attention — position bias amplifies any underlying model bias.",
    compliance: "EU AI Act Art.10 requires bias testing for ranked outputs in employment contexts. The truncation point ('top N candidates forwarded to interview') must be documented as a deliberate policy decision.",
    risk: "Small ranking score differences compound into large selection disparities at scale. The first 3 results dominate regardless of whether downstream score gaps are meaningful.",
  },
};

function IntakeForm({ onSubmit, onStartFresh, isExample }: { onSubmit: (d: IntakeData) => void; onStartFresh: () => void; isExample: boolean }) {
  const [form, setForm] = useState<IntakeData>(SEED_HR);
  const [section, setSection] = useState<1 | 2 | 3>(1);

  const set = <K extends keyof IntakeData>(k: K, v: IntakeData[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const toggleArr = (field: "dataTypes" | "specialCategories" | "jurisdictions", val: string) => {
    setForm(f => {
      const arr = f[field] as string[];
      return { ...f, [field]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] };
    });
  };

  const sectionValid = () => {
    if (section === 1) return form.modelType && form.useCase && form.outputType && form.deployment && form.populationSize;
    if (section === 2) return form.dataTypes.length > 0 && form.dataSource;
    if (section === 3) return form.jurisdictions.length > 0;
    return false;
  };

  const selectStyle: React.CSSProperties = {
    width: "100%", padding: "8px 12px", borderRadius: 8, fontSize: 13,
    border: "1.5px solid hsl(var(--border,#e2e8f0))",
    background: "hsl(var(--background))", color: "hsl(var(--foreground))",
    outline: "none",
  };
  const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: "hsl(var(--foreground))", marginBottom: 6, display: "block" };
  const hintStyle: React.CSSProperties = { fontSize: 11, color: "#64748b", marginTop: 2 };

  const infoCallout = (content: React.ReactNode) => (
    <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 8, padding: "10px 14px", marginTop: 8, fontSize: 12, color: "#0c4a6e", lineHeight: 1.6 }}>
      {content}
    </div>
  );

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      {/* Seed banner */}
      {isExample && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 14px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, marginBottom: 20, flexWrap: "wrap" }}>
          <div style={{ fontSize: 12, color: "#92400e" }}>
            <strong>Pre-loaded example:</strong> EU financial services hiring classifier — submit as-is to see a Critical result, or edit any values.
          </div>
          <button onClick={() => { onStartFresh(); }} style={{ padding: "5px 14px", borderRadius: 6, border: "1px solid #d97706", background: "transparent", color: "#92400e", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
            Start fresh →
          </button>
        </div>
      )}
      {/* Section tabs */}
      <div style={{ display: "flex", gap: 0, marginBottom: 28, borderBottom: "2px solid hsl(var(--border,#e2e8f0))" }}>
        {([1, 2, 3] as const).map(s => (
          <button key={s} onClick={() => setSection(s)} style={{
            padding: "8px 20px", fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer",
            background: "transparent", borderBottom: section === s ? "2px solid #6366f1" : "2px solid transparent",
            marginBottom: -2, color: section === s ? "#6366f1" : "#94a3b8",
          }}>
            {s === 1 ? "1. Model Profile" : s === 2 ? "2. Data Profile" : "3. Process & Jurisdiction"}
          </button>
        ))}
      </div>

      {/* Section 1: Model Profile */}
      {section === 1 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <label style={labelStyle}>1. What type of AI model is this?</label>
            <select value={form.modelType} onChange={e => set("modelType", e.target.value as ModelType)} style={selectStyle}>
              <option value="">Select…</option>
              <option value="classifier">Classifier (binary or multi-class)</option>
              <option value="scoring">Scoring model (output is a numeric score)</option>
              <option value="generative">Generative model (LLM, image generation)</option>
              <option value="ranking">Ranking model (orders candidates/items)</option>
              <option value="recommendation">Recommendation system</option>
            </select>
            {form.modelType && MODEL_TYPE_INFO[form.modelType] && infoCallout(<>
              <strong>{form.modelType.charAt(0).toUpperCase() + form.modelType.slice(1)}:</strong> {MODEL_TYPE_INFO[form.modelType].what}
              <br /><strong>Examples:</strong> {MODEL_TYPE_INFO[form.modelType].examples}
              <br /><strong>Regulatory note:</strong> {MODEL_TYPE_INFO[form.modelType].note}
            </>)}
          </div>
          <div>
            <label style={labelStyle}>2. Primary use case</label>
            <select value={form.useCase} onChange={e => set("useCase", e.target.value as UseCase)} style={selectStyle}>
              <option value="">Select…</option>
              <option value="hiring">Hiring / employment decisions</option>
              <option value="credit">Credit scoring / lending</option>
              <option value="healthcare">Healthcare / clinical decisions</option>
              <option value="general">General AI (other use case)</option>
            </select>
            <p style={hintStyle}>Hiring and credit are explicitly listed as high-risk under EU AI Act Annex III.</p>
          </div>
          <div>
            <label style={labelStyle}>3. What does the model output?</label>
            <select value={form.outputType} onChange={e => set("outputType", e.target.value as OutputType)} style={selectStyle}>
              <option value="">Select…</option>
              <option value="binary">Binary decision (approve / reject, shortlist / pass)</option>
              <option value="score">Numeric score (e.g. 300–850 credit score, 0–100 risk score)</option>
              <option value="recommendation">Recommendation (suggested content, next action)</option>
              <option value="ranking">Ranking (ordered list of candidates or items)</option>
            </select>
            {form.outputType && OUTPUT_TYPE_INFO[form.outputType] && infoCallout(<>
              {OUTPUT_TYPE_INFO[form.outputType].what}
              <br /><strong>Compliance implications:</strong> {OUTPUT_TYPE_INFO[form.outputType].compliance}
              <br /><strong>Bias risk:</strong> {OUTPUT_TYPE_INFO[form.outputType].risk}
            </>)}
          </div>
          <div>
            <label style={labelStyle}>4. How is the model deployed?</label>
            <select value={form.deployment} onChange={e => set("deployment", e.target.value as DeploymentType)} style={selectStyle}>
              <option value="">Select…</option>
              <option value="automated">Fully automated — decision executed without human review</option>
              <option value="human-reviews">Human reviews the model's output before acting</option>
              <option value="human-approves">Human must actively approve before any decision is made</option>
            </select>
            <p style={hintStyle}>Fully automated decisions trigger GDPR Art.22 obligations.</p>
          </div>
          <div>
            <label style={labelStyle}>5. How many people does this model affect?</label>
            <select value={form.populationSize} onChange={e => set("populationSize", e.target.value as PopulationSize)} style={selectStyle}>
              <option value="">Select…</option>
              <option value="small">Fewer than 1,000 individuals</option>
              <option value="medium">1,000 – 100,000 individuals</option>
              <option value="large">More than 100,000 individuals</option>
            </select>
          </div>
        </div>
      )}

      {/* Section 2: Data Profile */}
      {section === 2 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <label style={labelStyle}>6. What data types does the model use? (select all that apply)</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {DATA_TYPE_OPTIONS.map(opt => (
                <label key={opt.value} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer", padding: "6px 10px", borderRadius: 6, border: `1.5px solid ${form.dataTypes.includes(opt.value) ? "#6366f1" : "hsl(var(--border,#e2e8f0))"}`, background: form.dataTypes.includes(opt.value) ? "#eef2ff" : "transparent" }}>
                  <input type="checkbox" checked={form.dataTypes.includes(opt.value)} onChange={() => toggleArr("dataTypes", opt.value)} style={{ accentColor: "#6366f1" }} />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label style={labelStyle}>7. Does the model process special category data? (GDPR Art.9)</label>
            <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
              {[{ v: true, l: "Yes" }, { v: false, l: "No" }].map(opt => (
                <label key={String(opt.v)} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                  <input type="radio" checked={form.specialCategoryData === opt.v} onChange={() => set("specialCategoryData", opt.v)} />
                  {opt.l}
                </label>
              ))}
            </div>
            {form.specialCategoryData && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {SPECIAL_CATEGORIES.map(cat => (
                  <label key={cat} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, cursor: "pointer", padding: "5px 10px", borderRadius: 6, border: `1.5px solid ${form.specialCategories.includes(cat) ? "#dc2626" : "hsl(var(--border,#e2e8f0))"}`, background: form.specialCategories.includes(cat) ? "#fef2f2" : "transparent" }}>
                    <input type="checkbox" checked={form.specialCategories.includes(cat)} onChange={() => toggleArr("specialCategories", cat)} style={{ accentColor: "#dc2626" }} />
                    {cat}
                  </label>
                ))}
              </div>
            )}
          </div>
          <div>
            <label style={labelStyle}>8. Where does the training data come from?</label>
            <select value={form.dataSource} onChange={e => set("dataSource", e.target.value as DataSource)} style={selectStyle}>
              <option value="">Select…</option>
              <option value="proprietary">Proprietary — collected directly from users / employees</option>
              <option value="third-party">Third-party purchased dataset</option>
              <option value="public">Public dataset (e.g. open government data, Kaggle)</option>
              <option value="synthetic">Synthetic data generated for training</option>
            </select>
            <p style={hintStyle}>Third-party data without documented bias testing is a hard fail under EU AI Act Art.10.</p>
          </div>
          <div>
            <label style={labelStyle}>9. Has a data minimisation review been completed?</label>
            <p style={{ fontSize: 11, color: "#64748b", marginBottom: 8 }}>Have you documented why each feature is necessary and proportionate for the stated purpose?</p>
            <div style={{ display: "flex", gap: 12 }}>
              {[{ v: true, l: "Yes — documented" }, { v: false, l: "No / not yet" }].map(opt => (
                <label key={String(opt.v)} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                  <input type="radio" checked={form.dataMinimisationDone === opt.v} onChange={() => set("dataMinimisationDone", opt.v)} />
                  {opt.l}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Section 3: Process & Jurisdiction */}
      {section === 3 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <label style={labelStyle}>10. Is there a human review step before a decision affects someone?</label>
            <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
              {[{ v: true, l: "Yes" }, { v: false, l: "No" }].map(opt => (
                <label key={String(opt.v)} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                  <input type="radio" checked={form.humanReview === opt.v} onChange={() => set("humanReview", opt.v)} />
                  {opt.l}
                </label>
              ))}
            </div>
            {form.humanReview && (
              <input
                type="text"
                placeholder="Brief description of review step…"
                value={form.humanReviewDesc}
                onChange={e => set("humanReviewDesc", e.target.value)}
                style={{ ...selectStyle, marginTop: 4 }}
              />
            )}
          </div>
          <div>
            <label style={labelStyle}>11. Is there an appeals or correction mechanism?</label>
            <p style={{ fontSize: 11, color: "#64748b", marginBottom: 8 }}>Can an affected individual contest a decision or have their data corrected?</p>
            <div style={{ display: "flex", gap: 12 }}>
              {[{ v: true, l: "Yes" }, { v: false, l: "No" }].map(opt => (
                <label key={String(opt.v)} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                  <input type="radio" checked={form.appealsExist === opt.v} onChange={() => set("appealsExist", opt.v)} />
                  {opt.l}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label style={labelStyle}>12. Where is this model deployed? (select all that apply)</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {JURISDICTION_OPTIONS.map(opt => (
                <label key={opt.value} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer", padding: "7px 12px", borderRadius: 6, border: `1.5px solid ${form.jurisdictions.includes(opt.value) ? "#6366f1" : "hsl(var(--border,#e2e8f0))"}`, background: form.jurisdictions.includes(opt.value) ? "#eef2ff" : "transparent" }}>
                  <input type="checkbox" checked={form.jurisdictions.includes(opt.value)} onChange={() => toggleArr("jurisdictions", opt.value)} style={{ accentColor: "#6366f1" }} />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32 }}>
        <button
          onClick={() => setSection(s => Math.max(1, s - 1) as 1 | 2 | 3)}
          disabled={section === 1}
          style={{ padding: "8px 20px", borderRadius: 8, border: "1.5px solid hsl(var(--border,#e2e8f0))", background: "transparent", color: section === 1 ? "#94a3b8" : "hsl(var(--foreground))", cursor: section === 1 ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600 }}
        >
          ← Back
        </button>
        {section < 3 ? (
          <button
            onClick={() => setSection(s => (s + 1) as 1 | 2 | 3)}
            disabled={!sectionValid()}
            style={{ padding: "8px 24px", borderRadius: 8, border: "none", background: sectionValid() ? "#6366f1" : "#e2e8f0", color: sectionValid() ? "#fff" : "#94a3b8", cursor: sectionValid() ? "pointer" : "not-allowed", fontSize: 13, fontWeight: 700 }}
          >
            Next →
          </button>
        ) : (
          <button
            onClick={() => sectionValid() && onSubmit(form)}
            disabled={!sectionValid()}
            style={{ padding: "10px 28px", borderRadius: 8, border: "none", background: sectionValid() ? "#6366f1" : "#e2e8f0", color: sectionValid() ? "#fff" : "#94a3b8", cursor: sectionValid() ? "pointer" : "not-allowed", fontSize: 14, fontWeight: 700 }}
          >
            Run Assessment →
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Tab 1: Risk Dashboard ─────────────────────────────────────────────────────

function RiskDashboard({ result, intake }: { result: RiskResult; intake: IntakeData }) {
  const c = LEVEL_COLORS[result.level];

  return (
    <div>
      {/* Hero: overall risk */}
      <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 28, padding: "20px 24px", background: c.bg, border: `2px solid ${c.border}`, borderRadius: 12 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: c.text, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>Overall Risk Level</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 40, fontWeight: 900, color: c.text }}>{result.score}</span>
            <span style={{ fontSize: 16, color: c.text, fontWeight: 700 }}>/100</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: c.text, textTransform: "uppercase", marginLeft: 8 }}>{result.level}</span>
          </div>
          <div style={{ fontSize: 12, color: c.text, marginTop: 4, maxWidth: 480 }}>
            {result.level === "critical" && "Halt deployment — specific legal obligations are triggered. Immediate remediation required."}
            {result.level === "high" && "DPIA mandatory. A remediation plan is required before deployment."}
            {result.level === "medium" && "DPIA recommended. Document mitigations before proceeding."}
            {result.level === "low" && "Monitoring recommended. Continue to review as the model evolves."}
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div style={{ width: 14, height: 14, borderRadius: "50%", background: c.badge, boxShadow: `0 0 12px ${c.badge}` }} />
          <div style={{ fontSize: 10, fontWeight: 700, color: c.text, textTransform: "uppercase" }}>
            {result.flags.length} flag{result.flags.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* Risk breakdown by category */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Risk Breakdown</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {(["data", "process", "regulatory", "proxy"] as const).map(cat => {
            const v = result.breakdown[cat];
            const color = v >= 30 ? "#dc2626" : v >= 15 ? "#d97706" : "#16a34a";
            const titles: Record<string, string> = { data: "Data Risk", process: "Process Risk", regulatory: "Regulatory Risk", proxy: "Proxy Discrimination" };
            return (
              <div key={cat} style={{ background: "hsl(var(--card,#f8fafc))", border: "1px solid hsl(var(--border,#e2e8f0))", borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>{titles[cat]}</div>
                <div style={{ fontSize: 28, fontWeight: 900, color }}>{v}</div>
                <div style={{ height: 5, borderRadius: 3, background: "#e2e8f0", marginTop: 8 }}>
                  <div style={{ height: "100%", borderRadius: 3, width: `${Math.min(v, 100)}%`, background: color, transition: "width 0.5s ease" }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Regulations triggered */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>
          Applicable Regulations ({result.flags.length} triggered)
        </div>
        {result.flags.length === 0 ? (
          <div style={{ padding: "16px", background: "#f0fdf4", borderRadius: 8, fontSize: 13, color: "#15803d" }}>No regulation triggers detected for this profile.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {result.flags.map(f => (
              <div key={f.id} style={{ background: "hsl(var(--card,#f8fafc))", border: `1px solid ${SEV_COLORS[f.severity]}30`, borderLeft: `4px solid ${SEV_COLORS[f.severity]}`, borderRadius: 8, padding: "12px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: SEV_COLORS[f.severity], textTransform: "uppercase", letterSpacing: "0.05em", background: `${SEV_COLORS[f.severity]}15`, padding: "2px 8px", borderRadius: 4 }}>
                    {f.severity}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "hsl(var(--foreground))" }}>{f.article}</span>
                  <span style={{ fontSize: 10, color: "#94a3b8", marginLeft: "auto", textTransform: "uppercase", letterSpacing: "0.04em" }}>{f.category}</span>
                </div>
                <p style={{ fontSize: 12, color: "#64748b", margin: 0, lineHeight: 1.5 }}>{f.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Profile summary */}
      <div style={{ background: "hsl(var(--card,#f8fafc))", border: "1px solid hsl(var(--border,#e2e8f0))", borderRadius: 10, padding: "16px 20px" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Assessment Profile</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, fontSize: 12 }}>
          <div><span style={{ color: "#64748b" }}>Use case:</span> <span style={{ fontWeight: 600 }}>{intake.useCase}</span></div>
          <div><span style={{ color: "#64748b" }}>Deployment:</span> <span style={{ fontWeight: 600 }}>{intake.deployment}</span></div>
          <div><span style={{ color: "#64748b" }}>Population:</span> <span style={{ fontWeight: 600 }}>{intake.populationSize}</span></div>
          <div><span style={{ color: "#64748b" }}>Data types:</span> <span style={{ fontWeight: 600 }}>{intake.dataTypes.length}</span></div>
          <div><span style={{ color: "#64748b" }}>Jurisdictions:</span> <span style={{ fontWeight: 600 }}>{intake.jurisdictions.join(", ")}</span></div>
          <div><span style={{ color: "#64748b" }}>Appeals:</span> <span style={{ fontWeight: 600 }}>{intake.appealsExist ? "Yes" : "No"}</span></div>
        </div>
      </div>

      <ProxyDetectorSection dataTypes={intake.dataTypes} />

      <div style={{ marginTop: 16, padding: "10px 14px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, fontSize: 11, color: "#92400e" }}>
        This tool is for educational and preliminary assessment purposes. It does not constitute legal advice. Consult a qualified DPO or privacy counsel before deployment.
      </div>
    </div>
  );
}

// ─── Tab 3: Remediation Checklist ─────────────────────────────────────────────

function RemediationChecklist({ result, onToggle }: { result: RiskResult; onToggle: (id: string) => void }) {
  const ownerLabels: Record<RemediationItem["owner"], string> = {
    legal: "Legal / DPO",
    engineering: "Engineering",
    product: "Product",
  };

  if (result.remediations.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "48px 24px", color: "#64748b" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>No remediation items for this profile.</div>
      </div>
    );
  }

  const done = result.remediations.filter(r => r.done).length;
  const total = result.remediations.length;

  return (
    <div>
      {/* Progress */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24, padding: "12px 16px", background: "hsl(var(--card,#f8fafc))", borderRadius: 10, border: "1px solid hsl(var(--border,#e2e8f0))" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>Remediation Progress</div>
          <div style={{ height: 6, borderRadius: 3, background: "#e2e8f0" }}>
            <div style={{ height: "100%", borderRadius: 3, width: `${total > 0 ? (done / total) * 100 : 0}%`, background: "#16a34a", transition: "width 0.3s ease" }} />
          </div>
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: done === total ? "#16a34a" : "#374151" }}>{done}/{total}</div>
      </div>

      {/* Items */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {result.remediations.map((item, i) => (
          <div key={item.id} onClick={() => onToggle(item.id)} style={{
            background: item.done ? "#f0fdf4" : "hsl(var(--card,#f8fafc))",
            border: `1.5px solid ${item.done ? "#bbf7d0" : "hsl(var(--border,#e2e8f0))"}`,
            borderRadius: 10, padding: "14px 16px", cursor: "pointer",
            opacity: item.done ? 0.75 : 1,
            transition: "all 0.2s ease",
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{
                width: 20, height: 20, borderRadius: 4, border: `2px solid ${item.done ? "#16a34a" : "#94a3b8"}`,
                background: item.done ? "#16a34a" : "transparent", flexShrink: 0, marginTop: 1,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff",
              }}>
                {item.done ? "✓" : ""}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8" }}>#{i + 1}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: OWNER_COLORS[item.owner], background: `${OWNER_COLORS[item.owner]}15`, padding: "2px 8px", borderRadius: 4 }}>
                    {ownerLabels[item.owner]}
                  </span>
                  <span style={{ fontSize: 10, color: "#94a3b8", marginLeft: "auto" }}>⏱ {item.effort}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: item.done ? "#15803d" : "hsl(var(--foreground))", textDecoration: item.done ? "line-through" : "none", marginBottom: 4 }}>
                  {item.what}
                </div>
                <div style={{ fontSize: 11, color: "#64748b" }}>↳ {item.law}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Your Model DP (Phase 2 personalised simulation) ─────────────────────────

function YourModelDP() {
  const [baseAcc, setBaseAcc] = useState(80);
  const [minAcc, setMinAcc]   = useState(70);
  const [open, setOpen]       = useState(false);

  const curve = useMemo(() => buildDPCurve(baseAcc / 100).map(p => ({ ...p, accuracy: Math.round(p.accuracy * 10) / 10 })), [baseAcc]);

  const crossover = useMemo(() => {
    const found = [...curve].reverse().find(p => p.accuracy >= minAcc);
    return found ?? null;
  }, [curve, minAcc]);

  return (
    <div style={{ border: "1px solid hsl(var(--border,#e2e8f0))", borderRadius: 10, overflow: "hidden" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "hsl(var(--card,#f8fafc))", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "hsl(var(--foreground))" }}
      >
        <span>Your Model — Personalised DP Simulation</span>
        <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>{open ? "▲ collapse" : "▼ expand"}</span>
      </button>
      {open && (
        <div style={{ padding: "20px 20px 24px" }}>
          <p style={{ fontSize: 12, color: "#64748b", marginBottom: 20, lineHeight: 1.6 }}>
            Enter your model's baseline accuracy and the minimum accuracy you can accept. The tool will calculate the tightest privacy budget (lowest ε) your model can sustain while staying above your accuracy floor.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 8 }}>
                Baseline accuracy (no privacy): <span style={{ color: "#6366f1" }}>{baseAcc}%</span>
              </label>
              <input type="range" min={55} max={99} step={1} value={baseAcc} onChange={e => setBaseAcc(Number(e.target.value))} style={{ width: "100%", accentColor: "#6366f1" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#94a3b8", marginTop: 2 }}>
                <span>55%</span><span>99%</span>
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 8 }}>
                Minimum acceptable accuracy: <span style={{ color: "#dc2626" }}>{minAcc}%</span>
              </label>
              <input type="range" min={50} max={baseAcc - 2} step={1} value={Math.min(minAcc, baseAcc - 2)} onChange={e => setMinAcc(Number(e.target.value))} style={{ width: "100%", accentColor: "#dc2626" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#94a3b8", marginTop: 2 }}>
                <span>50%</span><span>{baseAcc - 2}%</span>
              </div>
            </div>
          </div>

          {crossover && (
            <div style={{ padding: "14px 18px", background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 8, marginBottom: 20, fontSize: 12, color: "#0c4a6e", lineHeight: 1.6 }}>
              <strong>Result:</strong> With a baseline of {baseAcc}% and a floor of {minAcc}%, your model can sustain a privacy budget of <strong>ε = {crossover.epsilon}</strong> — {crossover.epsilon <= 0.1 ? "strong privacy" : crossover.epsilon <= 1 ? "commonly accepted balance" : crossover.epsilon <= 10 ? "weak privacy" : "minimal privacy protection"}.
              {crossover.epsilon > 1 && <span style={{ color: "#d97706" }}> Consider whether stronger privacy (ε ≤ 1) is achievable by improving baseline accuracy first.</span>}
            </div>
          )}

          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={curve} margin={{ top: 8, right: 20, left: 0, bottom: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="epsilonLabel" tick={{ fontSize: 10, fill: "#94a3b8" }} label={{ value: "ε (epsilon)", position: "insideBottom", offset: -10, fontSize: 10, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} domain={[50, Math.ceil(baseAcc / 10) * 10]} unit="%" />
                <Tooltip formatter={(v: number) => [`${v}%`, "Accuracy"]} labelFormatter={(l: string) => `ε = ${l}`} contentStyle={{ fontSize: 12 }} />
                <ReferenceLine y={minAcc} stroke="#dc2626" strokeDasharray="4 3" label={{ value: `floor ${minAcc}%`, fontSize: 9, fill: "#dc2626", position: "right" }} />
                {crossover && <ReferenceLine x={String(crossover.epsilon)} stroke="#6366f1" strokeDasharray="4 3" label={{ value: `ε=${crossover.epsilon}`, fontSize: 9, fill: "#6366f1", position: "top" }} />}
                <Line type="monotone" dataKey="accuracy" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3, fill: "#6366f1" }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Differential Privacy Simulator ───────────────────────────────────────────

function DiffPrivacySimulator() {
  const [epsilon, setEpsilon] = useState(1);
  const curve = useMemo(() => buildDPCurve(0.82), []);

  const currentPoint = useMemo(() => {
    const sorted = [...curve].sort((a, b) => Math.abs(a.epsilon - epsilon) - Math.abs(b.epsilon - epsilon));
    return sorted[0];
  }, [epsilon, curve]);

  const epsilonValues = [0.01, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100];
  const epsilonIndex = epsilonValues.findIndex(v => v >= epsilon) ?? 5;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>Differential Privacy Cost Curve</h3>
        <p style={{ fontSize: 12, color: "#64748b", marginBottom: 0 }}>
          Pre-loaded: credit scoring model (baseline accuracy 82%). Drag the slider to see how privacy budget ε affects model accuracy.
          <br />Lower ε = stronger privacy guarantee, but more noise = lower accuracy.
        </p>
      </div>

      {/* Current epsilon status */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1, background: "hsl(var(--card,#f8fafc))", border: "1px solid hsl(var(--border,#e2e8f0))", borderRadius: 10, padding: "12px 16px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 4 }}>Current ε</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#6366f1" }}>{epsilon}</div>
        </div>
        <div style={{ flex: 1, background: "hsl(var(--card,#f8fafc))", border: "1px solid hsl(var(--border,#e2e8f0))", borderRadius: 10, padding: "12px 16px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 4 }}>Model Accuracy</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: currentPoint.accuracy >= 75 ? "#16a34a" : currentPoint.accuracy >= 65 ? "#d97706" : "#dc2626" }}>
            {currentPoint.accuracy.toFixed(1)}%
          </div>
        </div>
        <div style={{ flex: 2, background: "hsl(var(--card,#f8fafc))", border: "1px solid hsl(var(--border,#e2e8f0))", borderRadius: 10, padding: "12px 16px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 6 }}>Privacy Regime</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: epsilon <= 0.1 ? "#6366f1" : epsilon <= 1 ? "#16a34a" : epsilon <= 10 ? "#d97706" : "#dc2626" }}>
            {epsilon <= 0.1 ? "🔒 Strong privacy (accuracy may be unusable)" :
             epsilon <= 1  ? "✓ Commonly accepted balance (ε ≤ 1)" :
             epsilon <= 10 ? "⚠ Weak privacy — meaningful re-identification risk" :
             "✗ No meaningful privacy protection"}
          </div>
        </div>
      </div>

      {/* Epsilon slider */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8, display: "block" }}>
          Privacy budget ε = {epsilon} (log scale: 0.01 → 100)
        </label>
        <input
          type="range"
          min={0}
          max={epsilonValues.length - 1}
          step={1}
          value={epsilonIndex}
          onChange={e => setEpsilon(epsilonValues[parseInt(e.target.value)])}
          style={{ width: "100%", accentColor: "#6366f1" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#94a3b8", marginTop: 2 }}>
          <span>ε = 0.01 (strongest privacy)</span>
          <span>ε = 100 (no privacy)</span>
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: 240, marginBottom: 16 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={curve} margin={{ top: 8, right: 20, left: 0, bottom: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="epsilonLabel" tick={{ fontSize: 10, fill: "#94a3b8" }} label={{ value: "ε (epsilon) — privacy budget", position: "insideBottom", offset: -10, fontSize: 10, fill: "#94a3b8" }} />
            <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} domain={[50, 90]} unit="%" label={{ value: "Accuracy", angle: -90, position: "insideLeft", fontSize: 10, fill: "#94a3b8" }} />
            <Tooltip formatter={(v: number) => [`${v}%`, "Accuracy"]} labelFormatter={(l: string) => `ε = ${l}`} contentStyle={{ fontSize: 12 }} />
            <ReferenceLine x="1" stroke="#6366f1" strokeDasharray="4 3" label={{ value: "ε=1 (standard)", fontSize: 9, fill: "#6366f1", position: "top" }} />
            <ReferenceLine x="0.1" stroke="#16a34a" strokeDasharray="4 3" label={{ value: "ε=0.1 (strong)", fontSize: 9, fill: "#16a34a", position: "top" }} />
            <ReferenceLine x={String(epsilon)} stroke="#f59e0b" strokeWidth={2} />
            <Line type="monotone" dataKey="accuracy" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3, fill: "#6366f1" }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Explanation callout */}
      <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 8, padding: "12px 16px", fontSize: 12, color: "#0c4a6e", lineHeight: 1.6, marginBottom: 28 }}>
        <strong>How this works:</strong> Differential privacy adds calibrated noise (Laplace mechanism, sensitivity=1) to model outputs.
        The privacy budget ε controls how much noise: smaller ε = more noise = stronger privacy guarantee.
        At ε=1 (the commonly accepted standard), this credit scoring model loses ~{Math.round(82 - currentPoint.accuracy)}pp of accuracy
        compared to the no-privacy baseline of 82%.
        <br /><br />
        <strong>Why it matters:</strong> EU AI Act technical standards and NIST AI RMF reference differential privacy as a privacy-preserving technique.
        This tradeoff curve shows practitioners exactly what accuracy they're giving up for each level of privacy protection.
      </div>

      {/* Your Model — personalised simulation */}
      <YourModelDP />
    </div>
  );
}

// ─── Phase 2 Stub ──────────────────────────────────────────────────────────────

function Phase2Stub({ title, description }: { title: string; description: string }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 24px", color: "#64748b" }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>🔬</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: "hsl(var(--foreground))", marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 13, maxWidth: 400, margin: "0 auto", lineHeight: 1.6 }}>{description}</div>
      <div style={{ marginTop: 16, display: "inline-block", fontSize: 11, fontWeight: 700, color: "#6366f1", background: "#eef2ff", padding: "4px 12px", borderRadius: 20, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        Phase 2 — Coming next session
      </div>
    </div>
  );
}

// ─── Proxy Discrimination Detector (section within RiskDashboard) ────────────

function ProxyDetectorSection({ dataTypes }: { dataTypes: string[] }) {
  const relevant = dataTypes.filter(d => d in FEATURE_RISK_MAP);
  if (relevant.length === 0) return null;
  const combinations = detectProxyCombinations(dataTypes);

  const RISK_COLORS = {
    direct:        { border: "#fecaca", bg: "#fef2f2", badge: "#dc2626", text: "#dc2626" },
    "known-proxy": { border: "#fed7aa", bg: "#fff7ed", badge: "#ea580c", text: "#c2410c" },
    correlated:    { border: "#fde68a", bg: "#fffbeb", badge: "#d97706", text: "#92400e" },
    neutral:       { border: "#e2e8f0", bg: "#f8fafc", badge: "#94a3b8", text: "#475569" },
  };
  const RISK_LABELS = { direct: "Direct protected", "known-proxy": "Known proxy", correlated: "Correlated", neutral: "Neutral" };
  const COMBO_COLORS = { critical: { border: "#fecaca", bg: "#fef2f2", text: "#dc2626" }, high: { border: "#fed7aa", bg: "#fff7ed", text: "#c2410c" }, medium: { border: "#fde68a", bg: "#fffbeb", text: "#92400e" } };

  return (
    <div style={{ marginTop: 28 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 16 }}>
        Proxy Discrimination Analysis
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 8, marginBottom: 20 }}>
        {relevant.map(feat => {
          const info = FEATURE_RISK_MAP[feat];
          const c = RISK_COLORS[info.risk];
          const label = DATA_TYPE_OPTIONS.find(o => o.value === feat)?.label ?? feat;
          return (
            <div key={feat} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 8, padding: "10px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: c.badge, background: `${c.badge}18`, padding: "2px 8px", borderRadius: 4, textTransform: "uppercase" }}>{RISK_LABELS[info.risk]}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: c.text }}>{label}</span>
              </div>
              <p style={{ fontSize: 11, color: "#64748b", margin: 0, lineHeight: 1.5 }}>{info.explanation}</p>
              {info.proxiesFor && (
                <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {info.proxiesFor.map(p => (
                    <span key={p} style={{ fontSize: 10, color: c.text, background: `${c.badge}12`, border: `1px solid ${c.badge}30`, padding: "1px 6px", borderRadius: 3 }}>Proxy for: {p}</span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {combinations.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
            Dangerous Feature Combinations ({combinations.length} detected)
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {combinations.map((combo, i) => {
              const c = COMBO_COLORS[combo.risk];
              return (
                <div key={i} style={{ background: c.bg, border: `1px solid ${c.border}`, borderLeft: `4px solid ${c.text}`, borderRadius: 8, padding: "12px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: c.text, textTransform: "uppercase" }}>{combo.risk} risk</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: c.text }}>→ {combo.combinedProxy}</span>
                    <span style={{ fontSize: 10, color: "#94a3b8", marginLeft: "auto" }}>{combo.regulation}</span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
                    {combo.features.map(f => (
                      <span key={f} style={{ fontSize: 10, fontWeight: 700, color: c.text, background: `${c.text}15`, border: `1px solid ${c.text}30`, padding: "2px 8px", borderRadius: 4 }}>
                        {DATA_TYPE_OPTIONS.find(o => o.value === f)?.label ?? f}
                      </span>
                    ))}
                  </div>
                  <p style={{ fontSize: 12, color: "#64748b", margin: 0, lineHeight: 1.5 }}>{combo.explanation}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {combinations.length === 0 && (
        <div style={{ padding: "12px 16px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, fontSize: 12, color: "#15803d" }}>
          No dangerous feature combinations detected for the current data profile. Continue to monitor as features change.
        </div>
      )}
      <div style={{ marginTop: 12, fontSize: 10, color: "#94a3b8", lineHeight: 1.5 }}>
        Sources: Bertrand & Mullainathan (2004) · Obermeyer et al. (2019) · Angwin/ProPublica COMPAS (2016) · CFPB fair lending guidance · EEOC AI/ML guidance (2023) · EU AI Act Art.10 recitals
      </div>
    </div>
  );
}

// ─── Tab 2: Full DPIA Report ───────────────────────────────────────────────────

function DPIAReport({ result, intake }: { result: RiskResult; intake: IntakeData }) {
  const [copied, setCopied] = useState(false);

  const report = {
    generated: new Date().toISOString(),
    tool: "Privacy Impact Auditor",
    disclaimer: "Educational and preliminary assessment only. Does not constitute legal advice.",
    section1_system: { modelType: intake.modelType, useCase: intake.useCase, outputType: intake.outputType, deployment: intake.deployment, populationSize: intake.populationSize, jurisdictions: intake.jurisdictions },
    section2_necessity: { dataTypes: intake.dataTypes, specialCategoryData: intake.specialCategoryData, specialCategories: intake.specialCategories, dataSource: intake.dataSource, dataMinimisationReviewed: intake.dataMinimisationDone },
    section3_dataFlows: { collectionMethod: intake.dataSource, processingPurpose: intake.useCase, automatedDecision: intake.deployment === "automated", humanReview: intake.humanReview, appealsMechanism: intake.appealsExist },
    section4_risk: { overallScore: result.score, riskLevel: result.level, breakdown: result.breakdown, triggers: result.flags.map(f => ({ article: f.article, severity: f.severity, description: f.description })) },
    section5_mitigations: result.remediations.slice(0, 5).map(r => ({ action: r.what, regulation: r.law, effort: r.effort, owner: r.owner })),
    section6_dpoSignoff: { dpoName: "[DPO Name]", reviewDate: "[Date]", nextReview: "[Next Review Date]", status: "[Pending / Approved / Rejected]", comments: "[Comments]" },
  };

  const handleCopy = () => { navigator.clipboard.writeText(JSON.stringify(report, null, 2)); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const c = LEVEL_COLORS[result.level];
  const sectionTitle = (n: string) => (
    <div style={{ fontSize: 14, fontWeight: 800, color: "hsl(var(--foreground))", marginBottom: 12, paddingBottom: 6, borderBottom: "1px solid hsl(var(--border,#e2e8f0))" }}>{n}</div>
  );
  const field = (label: string, value: string | boolean | string[]) => {
    const v = typeof value === "boolean" ? (value ? "Yes" : "No") : Array.isArray(value) ? (value.join(", ") || "None") : (value || "—");
    return (
      <div style={{ display: "flex", gap: 12, fontSize: 12, marginBottom: 6 }}>
        <span style={{ color: "#94a3b8", fontWeight: 600, minWidth: 200, flexShrink: 0 }}>{label}</span>
        <span style={{ color: "hsl(var(--foreground))", fontWeight: 500 }}>{v}</span>
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 8 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Data Protection Impact Assessment</h2>
          <p style={{ fontSize: 12, color: "#64748b", margin: "4px 0 0" }}>Generated {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: c.text, background: c.bg, border: `1px solid ${c.border}`, padding: "4px 12px", borderRadius: 6, textTransform: "uppercase" }}>
            {result.level} — {result.score}/100
          </div>
          <button onClick={handleCopy} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid hsl(var(--border,#e2e8f0))", background: copied ? "#f0fdf4" : "hsl(var(--card,#f8fafc))", color: copied ? "#15803d" : "hsl(var(--foreground))", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
            {copied ? "✓ Copied" : "Copy JSON"}
          </button>
        </div>
      </div>

      <div style={{ marginBottom: 28 }}>
        {sectionTitle("1 — System Description")}
        {field("Model type", intake.modelType)}
        {field("Primary use case", intake.useCase)}
        {field("Output type", intake.outputType)}
        {field("Deployment context", intake.deployment)}
        {field("Affected population", intake.populationSize)}
        {field("Jurisdictions", intake.jurisdictions)}
      </div>

      <div style={{ marginBottom: 28 }}>
        {sectionTitle("2 — Necessity & Proportionality")}
        {field("Data types processed", intake.dataTypes)}
        {field("Special category data", intake.specialCategoryData ? `Yes — ${intake.specialCategories.join(", ") || "categories not specified"}` : "No")}
        {field("Training data source", intake.dataSource)}
        {field("Data minimisation review", intake.dataMinimisationDone)}
        <div style={{ marginTop: 8, padding: "10px 14px", background: intake.dataMinimisationDone ? "#f0fdf4" : "#fffbeb", border: `1px solid ${intake.dataMinimisationDone ? "#bbf7d0" : "#fde68a"}`, borderRadius: 6, fontSize: 11, color: intake.dataMinimisationDone ? "#15803d" : "#92400e" }}>
          {intake.dataMinimisationDone ? "Data minimisation review completed. Each feature documented as necessary and proportionate." : "Data minimisation review not completed. GDPR Art.5(1)(c) requires documenting why each data type is necessary. Required before deployment."}
        </div>
      </div>

      <div style={{ marginBottom: 28 }}>
        {sectionTitle("3 — Processing Activities & Data Flows")}
        {field("Data collection method", intake.dataSource)}
        {field("Processing purpose", `${intake.useCase} — ${intake.outputType}`)}
        {field("Decision automation level", intake.deployment)}
        {field("Human review step", intake.humanReview ? (intake.humanReviewDesc ? `Yes — ${intake.humanReviewDesc}` : "Yes") : "No")}
        {field("Appeals & correction mechanism", intake.appealsExist)}
      </div>

      <div style={{ marginBottom: 28 }}>
        {sectionTitle("4 — Risk Assessment")}
        <div style={{ padding: "14px 20px", background: c.bg, border: `1px solid ${c.border}`, borderRadius: 8, marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: c.text, textTransform: "uppercase", marginBottom: 4 }}>Overall Risk Level</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: c.text }}>{result.score}/100 — {result.level.toUpperCase()}</div>
        </div>
        {result.flags.map(f => (
          <div key={f.id} style={{ display: "flex", gap: 12, fontSize: 12, marginBottom: 6 }}>
            <span style={{ color: SEV_COLORS[f.severity], fontWeight: 700, minWidth: 200, flexShrink: 0 }}>{f.article}</span>
            <span style={{ color: "#64748b", fontSize: 11 }}>{f.description}</span>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 28 }}>
        {sectionTitle(`5 — Proposed Mitigations (${Math.min(5, result.remediations.length)})`)}
        {result.remediations.slice(0, 5).map((r, i) => (
          <div key={r.id} style={{ display: "flex", gap: 12, marginBottom: 10, padding: "10px 14px", background: "hsl(var(--card,#f8fafc))", border: "1px solid hsl(var(--border,#e2e8f0))", borderRadius: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#94a3b8", minWidth: 20 }}>{i + 1}.</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "hsl(var(--foreground))", marginBottom: 2 }}>{r.what}</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>↳ {r.law} · {r.effort}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 20 }}>
        {sectionTitle("6 — DPO Sign-off")}
        <div style={{ background: "hsl(var(--card,#f8fafc))", border: "1px solid hsl(var(--border,#e2e8f0))", borderRadius: 8, padding: "16px 20px" }}>
          {["DPO Name", "Review Date", "Next Review Date", "Approval Status", "Comments"].map(f => (
            <div key={f} style={{ display: "flex", gap: 12, fontSize: 12, marginBottom: 6 }}>
              <span style={{ color: "#94a3b8", fontWeight: 600, minWidth: 200, flexShrink: 0 }}>{f}</span>
              <span style={{ color: "#94a3b8", fontStyle: "italic" }}>[Complete manually]</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: "#94a3b8", fontStyle: "italic" }}>
          For preliminary assessment only. Does not constitute legal advice. Consult a qualified DPO or privacy counsel before regulatory submission.
        </div>
      </div>
    </div>
  );
}

// ─── Tab 4: Privacy Nutrition Label ───────────────────────────────────────────

function PrivacyNutritionLabelFull({ intake }: { intake: IntakeData }) {
  const scores = computeNutritionScores(intake);
  const colors  = { red: "#dc2626", amber: "#d97706", green: "#16a34a" };
  const bgs     = { red: "#fef2f2", amber: "#fffbeb", green: "#f0fdf4" };
  const borders = { red: "#fecaca", amber: "#fde68a", green: "#bbf7d0" };
  const ICONS: Record<string, string> = { "Data Collection": "🗂️", "Purpose Limitation": "🎯", "Automated Decisions": "🤖", "Human Oversight": "👤", "Right to Explanation": "📋", "Bias Testing": "⚖️", "Data Minimisation": "🔬", "Cross-border Transfers": "🌍" };
  const EXPLANATIONS: Record<string, Record<string, string>> = {
    "Data Collection":        { red: "Special category or biometric data present — heightened obligations apply.", amber: "More than 6 data types — review whether all are necessary (GDPR Art.5(1)(c)).", green: "Data collection appears proportionate for the stated purpose." },
    "Purpose Limitation":     { red: "Use case or model type not clearly defined.", amber: "Processing purpose could be better bounded.", green: "Processing purpose clearly defined." },
    "Automated Decisions":    { red: "Fully automated — triggers GDPR Art.22, NYC LL144, and EU AI Act obligations.", amber: "Human reviews but may not actively approve — review GDPR Art.22 scope.", green: "Human must approve before decisions are enacted." },
    "Human Oversight":        { red: "No human review step — automated decision without oversight.", amber: "Human involvement not confirmed — clarify review process.", green: "Human review step documented." },
    "Right to Explanation":   { red: "No appeals mechanism — GDPR Art.22, Colorado AI Act, and CCPA all require contestability.", amber: "Contestability mechanism partially defined.", green: "Appeals and correction mechanism in place." },
    "Bias Testing":           { red: "Third-party data with no bias testing — EU AI Act Art.10 hard fail.", amber: "Bias testing or data minimisation review incomplete.", green: "Data minimisation and bias testing documented." },
    "Data Minimisation":      { red: "Large dataset with no minimisation review — GDPR Art.5(1)(c) non-compliant.", amber: "Minimisation review not yet completed.", green: "Data minimisation review completed." },
    "Cross-border Transfers": { red: "High jurisdictional complexity — multiple transfer mechanisms required.", amber: "Multi-jurisdiction deployment — verify transfer safeguards are in place.", green: "Jurisdiction profile manageable." },
  };

  const vals = Object.values(scores);
  const counts = { red: vals.filter(s => s === "red").length, amber: vals.filter(s => s === "amber").length, green: vals.filter(s => s === "green").length };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Privacy Nutrition Label</h2>
          <p style={{ fontSize: 12, color: "#64748b", margin: "4px 0 0" }}>8-category privacy profile scored from your intake answers.</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {[{ label: `${counts.red} Action required`, color: "#dc2626", bg: "#fef2f2" }, { label: `${counts.amber} Review`, color: "#d97706", bg: "#fffbeb" }, { label: `${counts.green} Pass`, color: "#16a34a", bg: "#f0fdf4" }].map(b => (
            <div key={b.label} style={{ background: b.bg, color: b.color, fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 6 }}>{b.label}</div>
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        {Object.entries(scores).map(([cat, score]) => (
          <div key={cat} style={{ background: bgs[score], border: `2px solid ${borders[score]}`, borderRadius: 12, padding: "16px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>{ICONS[cat]}</div>
            <div style={{ width: 14, height: 14, borderRadius: "50%", background: colors[score], margin: "0 auto 8px", boxShadow: `0 0 8px ${colors[score]}50` }} />
            <div style={{ fontSize: 11, fontWeight: 700, color: "#374151", lineHeight: 1.3, marginBottom: 4 }}>{cat}</div>
            <div style={{ fontSize: 10, color: colors[score], fontWeight: 700, textTransform: "uppercase" }}>{score === "red" ? "Action required" : score === "amber" ? "Review" : "Pass"}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {Object.entries(scores).map(([cat, score]) => (
          <div key={cat} style={{ display: "flex", gap: 12, padding: "10px 14px", background: bgs[score], border: `1px solid ${borders[score]}`, borderRadius: 8 }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>{ICONS[cat]}</span>
            <div>
              <span style={{ fontSize: 12, fontWeight: 700, color: "hsl(var(--foreground))" }}>{cat}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: colors[score], textTransform: "uppercase", marginLeft: 8 }}>{score === "red" ? "⚠ Action required" : score === "amber" ? "▲ Review" : "✓ Pass"}</span>
              <p style={{ fontSize: 11, color: "#64748b", margin: "3px 0 0", lineHeight: 1.5 }}>{EXPLANATIONS[cat]?.[score] ?? ""}</p>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12, fontSize: 10, color: "#94a3b8" }}>Scores are derived from your intake form answers using the same combinatorial risk engine. Preliminary assessment only.</div>
    </div>
  );
}

// ─── Tab 5: Model Card ────────────────────────────────────────────────────────

function ModelCard({ result, intake }: { result: RiskResult; intake: IntakeData }) {
  const [copied, setCopied] = useState(false);

  const md = `# Model Card — ${intake.useCase || "AI System"} (${intake.modelType || "model"})
> Generated by Privacy Impact Auditor · ${new Date().toLocaleDateString("en-GB")}
> Maps to EU AI Act Art.13 transparency obligations · Mitchell et al. (2019) format

---

## 1. Model Details
- **Model type:** ${intake.modelType || "—"}
- **Output type:** ${intake.outputType || "—"}
- **Deployment context:** ${intake.deployment || "—"}
- **Affected population:** ${intake.populationSize || "—"}
- **Jurisdictions:** ${intake.jurisdictions.join(", ") || "—"}

## 2. Intended Use
- **Primary use case:** ${intake.useCase || "—"}
- **Primary users:** [Describe who operates or is affected by this system]
- **Out-of-scope uses:** [Explicitly state uses this system was NOT designed for]

## 3. Training Data
- **Data source:** ${intake.dataSource || "—"}
- **Data types used:** ${intake.dataTypes.join(", ") || "—"}
- **Special category data:** ${intake.specialCategoryData ? "Yes — " + (intake.specialCategories.join(", ") || "categories not specified") : "No"}
- **Data minimisation review:** ${intake.dataMinimisationDone ? "Completed" : "Not completed — required before deployment"}

## 4. Evaluation Results
- **Privacy risk score:** ${result.score}/100 (${result.level.toUpperCase()})
- **Regulation triggers:** ${result.flags.length} (${result.flags.map(f => f.name).join(", ") || "none"})
- **Risk breakdown:** Data ${result.breakdown.data} · Process ${result.breakdown.process} · Regulatory ${result.breakdown.regulatory} · Proxy ${result.breakdown.proxy}

## 5. Ethical Considerations
${result.flags.length > 0 ? result.flags.slice(0, 5).map(f => `- **${f.article}:** ${f.description}`).join("\n") : "- No high-risk regulation triggers detected for this profile."}

## 6. Caveats & Recommendations
${result.remediations.slice(0, 3).map(r => `- ${r.what} (${r.law})`).join("\n") || "- No critical remediations identified."}

## 7. Privacy Assessment Summary
- **DPIA required:** ${(result.level === "critical" || result.level === "high") ? "Yes — mandatory" : "Recommended"}
- **Human review step:** ${intake.humanReview ? "Yes" : "No — required for GDPR Art.22 compliance"}
- **Appeals mechanism:** ${intake.appealsExist ? "Yes" : "No — required by multiple regulations"}
- **Assessment date:** ${new Date().toLocaleDateString("en-GB")}
- **DPO sign-off:** [Pending]
`;

  const handleCopy = () => { navigator.clipboard.writeText(md); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const lines = md.split("\n");
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 8 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Model Card</h2>
          <p style={{ fontSize: 12, color: "#64748b", margin: "4px 0 0" }}>EU AI Act Art.13 format · Mitchell et al. (2019) · Pre-filled from your intake answers</p>
        </div>
        <button onClick={handleCopy} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid hsl(var(--border,#e2e8f0))", background: copied ? "#f0fdf4" : "hsl(var(--card,#f8fafc))", color: copied ? "#15803d" : "hsl(var(--foreground))", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
          {copied ? "✓ Copied Markdown" : "Copy as Markdown"}
        </button>
      </div>
      <div style={{ background: "hsl(var(--card,#f8fafc))", border: "1px solid hsl(var(--border,#e2e8f0))", borderRadius: 10, padding: "20px 24px", lineHeight: 1.7 }}>
        {lines.map((line, i) => {
          if (line.startsWith("# ")) return <div key={i} style={{ fontSize: 15, fontWeight: 900, color: "hsl(var(--foreground))", marginBottom: 4 }}>{line.replace("# ", "")}</div>;
          if (line.startsWith("## ")) return <div key={i} style={{ fontSize: 13, fontWeight: 800, color: "#6366f1", marginTop: i > 0 ? 16 : 0, marginBottom: 6 }}>{line.replace("## ", "")}</div>;
          if (line.startsWith("> ")) return <div key={i} style={{ fontSize: 11, color: "#64748b", fontStyle: "italic", marginBottom: 8, paddingLeft: 8, borderLeft: "3px solid #e2e8f0" }}>{line.replace("> ", "")}</div>;
          if (line === "---") return <hr key={i} style={{ border: "none", borderTop: "1px solid hsl(var(--border,#e2e8f0))", margin: "10px 0" }} />;
          if (line === "") return <div key={i} style={{ height: 4 }} />;
          const boldMatch = line.match(/^- \*\*(.+?):\*\* (.+)$/);
          if (boldMatch) return (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 4, fontSize: 12 }}>
              <span style={{ color: "#94a3b8", flexShrink: 0 }}>·</span>
              <span><span style={{ fontWeight: 700, color: "hsl(var(--foreground))" }}>{boldMatch[1]}:</span>{" "}<span style={{ color: "#64748b" }}>{boldMatch[2]}</span></span>
            </div>
          );
          return <div key={i} style={{ fontSize: 12, color: "#64748b" }}>{line}</div>;
        })}
      </div>
      <div style={{ marginTop: 12, padding: "10px 14px", background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 8, fontSize: 11, color: "#0c4a6e" }}>
        <strong>EU AI Act Art.13:</strong> Fields marked [Complete manually] must be filled before deployment. The card must be updated after each significant model change.
      </div>
    </div>
  );
}

// ─── Tab 6: Methodology Eval ──────────────────────────────────────────────────

function MethodologyEval() {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Methodology Evaluation</h2>
        <p style={{ fontSize: 12, color: "#64748b", margin: "4px 0 0" }}>This tool audits its own scoring methodology — a meta-DPIA. Documenting methodology is itself an EU AI Act Art.13 transparency obligation.</p>
      </div>

      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12, paddingBottom: 6, borderBottom: "1px solid hsl(var(--border,#e2e8f0))" }}>Scoring Methodology</div>
        <p style={{ fontSize: 12, color: "#64748b", marginBottom: 12, lineHeight: 1.6 }}>
          The risk score uses two phases: (1) a base score across four risk categories, then (2) multiplicative amplifiers for high-risk combinations. Standard checklist tools add risks linearly — this tool multiplies them, which more accurately reflects how legal risk compounds in practice.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            { rule: "Data Risk base", detail: "Special category: +25 · Biometric: +18 · Health: +15 · Third-party data: +12 · No minimisation review: +10 · >6 features: +8", source: "GDPR Art.9 · EU AI Act Art.10" },
            { rule: "Process Risk base", detail: "Fully automated: +30 · No appeals: +20 · No human review: +10 · Human reviews (not approves): +12", source: "GDPR Art.22 · Colorado AI Act" },
            { rule: "Regulatory Risk base", detail: "EU/UK jurisdiction: +15 · NYC hiring: +20 · Illinois biometric: +25 · High-risk use case: +10 · Large population: +8", source: "NYC LL144 · Illinois BIPA · GDPR" },
            { rule: "Proxy Discrimination base", detail: "1 proxy feature: +6 · Each additional proxy: +8/feature", source: "EU AI Act Art.10 · ECOA" },
            { rule: "Multiplier: automated × special category", detail: "Total score ×2.5", source: "GDPR Art.22 + Art.9 combined" },
            { rule: "Multiplier: large population × no appeals × automated", detail: "Escalated to Critical floor (score ≥ 82)", source: "GDPR Art.35 · Colorado AI Act" },
            { rule: "Multiplier: EU high-risk AI × automated", detail: "Total score ×1.8", source: "EU AI Act Annex III + Art.22 interaction" },
            { rule: "Hard floor: Illinois + biometric", detail: "Always Critical (score ≥ 85)", source: "Illinois BIPA statutory damages rule" },
          ].map((r, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "180px 1fr 200px", gap: 12, padding: "8px 12px", background: "hsl(var(--card,#f8fafc))", border: "1px solid hsl(var(--border,#e2e8f0))", borderRadius: 6, fontSize: 11 }}>
              <span style={{ fontWeight: 700, color: "hsl(var(--foreground))" }}>{r.rule}</span>
              <span style={{ color: "#64748b" }}>{r.detail}</span>
              <span style={{ color: "#6366f1", fontWeight: 600 }}>{r.source}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12, paddingBottom: 6, borderBottom: "1px solid hsl(var(--border,#e2e8f0))" }}>Regulation Coverage — 13 triggers across 8 jurisdictions</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {["GDPR Art.35", "GDPR Art.22", "GDPR Art.5(1)(c)", "GDPR Art.9", "EU AI Act Annex III", "EU AI Act Art.10", "EU AI Act Art.13", "NYC Local Law 144", "Colorado AI Act", "CCPA / CPRA", "Illinois BIPA", "Canada PIPEDA / C-27", "UK GDPR"].map(r => (
            <span key={r} style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", background: "#eef2ff", border: "1px solid #c7d2fe", padding: "3px 10px", borderRadius: 6 }}>{r}</span>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12, paddingBottom: 6, borderBottom: "1px solid hsl(var(--border,#e2e8f0))" }}>Comparison to Standard DPIA Templates</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            { aspect: "Scoring model", ico: "Checkbox (yes/no)", cnil: "Checkbox", tool: "Combinatorial multipliers — risks compound, not add" },
            { aspect: "AI-specific triggers", ico: "Partial (large-scale automated)", cnil: "Partial", tool: "13 AI triggers (EU AI Act Annex III, NYC LL144, Illinois BIPA)" },
            { aspect: "Proxy discrimination", ico: "Not covered", cnil: "Not covered", tool: "Feature classifier + combination graph (7 combination rules)" },
            { aspect: "Differential privacy", ico: "Not covered", cnil: "Not covered", tool: "Laplace mechanism epsilon cost curve + personalised simulation" },
            { aspect: "Output artefacts", ico: "Word template", cnil: "PDF template", tool: "Risk dashboard + nutrition label + model card + DPIA report + checklist" },
          ].map((r, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "160px 1fr 1fr 1fr", gap: 12, padding: "8px 12px", background: "hsl(var(--card,#f8fafc))", border: "1px solid hsl(var(--border,#e2e8f0))", borderRadius: 6, fontSize: 11 }}>
              <span style={{ fontWeight: 700, color: "hsl(var(--foreground))" }}>{r.aspect}</span>
              <span style={{ color: "#94a3b8" }}>ICO: {r.ico}</span>
              <span style={{ color: "#94a3b8" }}>CNIL: {r.cnil}</span>
              <span style={{ color: "#16a34a", fontWeight: 600 }}>This tool: {r.tool}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12, paddingBottom: 6, borderBottom: "1px solid hsl(var(--border,#e2e8f0))" }}>Known Limitations</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            "DP model uses standard Laplace mechanism (sensitivity=1, global DP). Local DP and other mechanisms not modelled.",
            "Regulation triggers rely on jurisdiction self-report — the tool cannot verify actual deployment geography.",
            "Proxy rules are based on published research and case law. Novel proxy relationships not yet in the literature are not detected.",
            "Risk multipliers are calibrated for regulatory consistency but are not legally validated thresholds.",
            "Output must be reviewed by a qualified DPO or privacy counsel before any regulatory submission.",
            "Regulation data accurate as of April 2026. EU AI Act enforcement timeline, CCPA amendments, and US state AI laws change frequently.",
          ].map((l, i) => (
            <div key={i} style={{ display: "flex", gap: 10, padding: "8px 12px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 6 }}>
              <span style={{ color: "#d97706", fontWeight: 700, flexShrink: 0 }}>!</span>
              <span style={{ fontSize: 11, color: "#92400e", lineHeight: 1.5 }}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12, paddingBottom: 6, borderBottom: "1px solid hsl(var(--border,#e2e8f0))" }}>Primary Sources</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {[
            "Angwin, J. et al. (2016). Machine Bias. ProPublica — COMPAS recidivism disparate impact analysis.",
            "Obermeyer, Z. et al. (2019). Dissecting racial bias in an algorithm used to manage health populations. Science.",
            "Bertrand, M. & Mullainathan, S. (2004). Are Emily and Greg more employable than Lakisha and Jamal? AER.",
            "Mitchell, M. et al. (2019). Model Cards for Model Reporting. FAccT — model card format used in Tab 5.",
            "EU AI Act (Regulation 2024/1689) — Articles 9, 10, 13, Annex III. Official Journal of the EU.",
            "GDPR (Regulation 2016/679) — Articles 5, 9, 22, 35. Official Journal of the EU.",
            "NYC Local Law 144 of 2021 — Automated employment decision tools.",
            "Illinois BIPA (740 ILCS 14) — Biometric Information Privacy Act.",
            "Colorado AI Act (SB24-205) — Consequential decisions algorithmic discrimination.",
            "NIST AI RMF (2023) — AI Risk Management Framework.",
          ].map((c, i) => (
            <div key={i} style={{ fontSize: 11, color: "#64748b", padding: "4px 0", borderBottom: "1px solid hsl(var(--border,#e2e8f0)/40)", lineHeight: 1.5 }}>
              <span style={{ color: "#94a3b8", marginRight: 8 }}>[{i + 1}]</span>{c}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

type Tab = "form" | "dashboard" | "report" | "checklist" | "nutrition" | "modelcard" | "methodology" | "dpsim";

const SAMPLE_CHECKLIST = SEED_RESULT.remediations.map(item => ({ ...item }));

export default function PrivacyAuditor() {
  useVisitLogger("privacy-auditor");
  const [tab, setTab] = useState<Tab>("form");
  const [userResult, setUserResult] = useState<RiskResult | null>(null);
  const [userIntake, setUserIntake] = useState<IntakeData | null>(null);
  const [userChecklist, setUserChecklist] = useState<RemediationItem[]>([]);
  const [viewMode, setViewMode] = useState<"example" | "mine">("example");
  const [formIsExample, setFormIsExample] = useState(true);

  const result = viewMode === "example" ? SEED_RESULT : userResult;
  const intake = viewMode === "example" ? SEED_HR : userIntake;
  const checklist = viewMode === "example" ? SAMPLE_CHECKLIST : userChecklist;

  const handleSubmit = (data: IntakeData) => {
    const r = computeRiskScore(data);
    setUserResult(r);
    setUserIntake(data);
    setUserChecklist(r.remediations.map(item => ({ ...item })));
    setViewMode("mine");
    setTab("dashboard");
  };

  const handleStartFresh = () => {
    setFormIsExample(false);
  };

  const toggleItem = (id: string) => {
    if (viewMode === "example") return;
    setUserChecklist(prev => prev.map(item => item.id === id ? { ...item, done: !item.done } : item));
  };

  const TABS: { id: Tab; label: string }[] = [
    { id: "form",        label: "Intake Form"      },
    { id: "dashboard",   label: "Risk Dashboard"   },
    { id: "checklist",   label: "Remediation"      },
    { id: "dpsim",       label: "DP Simulator"     },
    { id: "report",      label: "DPIA Report"      },
    { id: "nutrition",   label: "Nutrition Label"  },
    { id: "modelcard",   label: "Model Card"       },
    { id: "methodology", label: "Methodology Eval" },
  ];

  const resultForChecklist = result ? { ...result, remediations: checklist } : null;

  return (
    <PageGate pageId="privacy-auditor" previewContent={previewContent}>
      <div style={{ minHeight: "100vh", fontFamily: "'Inter','Segoe UI',sans-serif" }}>
        {/* Header */}
        <div style={{ background: "hsl(var(--background))", borderBottom: "1px solid hsl(var(--border,#e2e8f0))", padding: "16px 28px" }}>
          <Link to="/" style={{ fontSize: 11, color: "#94a3b8", textDecoration: "none", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            ← Back to Portfolio
          </Link>
          <div style={{ marginTop: 10, display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0, color: "hsl(var(--foreground))" }}>Privacy Impact Auditor</h1>
              <p style={{ fontSize: 12, color: "#64748b", margin: "4px 0 0" }}>
                AI-specific DPIA · Dynamic combinatorial risk scoring · GDPR + EU AI Act + NYC LL144 + 10 more regulations
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: LEVEL_COLORS[SEED_RESULT.level].badge }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: LEVEL_COLORS[(userResult && viewMode === "mine" ? userResult : SEED_RESULT).level].text, textTransform: "uppercase" }}>
                {viewMode === "example" ? "Example · " : ""}{(userResult && viewMode === "mine" ? userResult : SEED_RESULT).level} — {(userResult && viewMode === "mine" ? userResult : SEED_RESULT).score}/100
              </span>
              {userResult && (
                <div style={{ display: "flex", gap: 4, marginLeft: 8, border: "1px solid hsl(var(--border,#e2e8f0))", borderRadius: 6, overflow: "hidden" }}>
                  {(["example", "mine"] as const).map(m => (
                    <button key={m} onClick={() => setViewMode(m)} style={{
                      padding: "3px 10px", fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer",
                      background: viewMode === m ? "#6366f1" : "transparent",
                      color: viewMode === m ? "#fff" : "#94a3b8",
                    }}>
                      {m === "example" ? "Example" : "Mine"}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab nav */}
        <div style={{ background: "hsl(var(--background))", borderBottom: "1px solid hsl(var(--border,#e2e8f0))", padding: "0 28px", overflowX: "auto" }}>
          <div style={{ display: "flex", gap: 0 }}>
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  padding: "10px 16px", fontSize: 12, fontWeight: 700, border: "none",
                  background: "transparent", cursor: "pointer", whiteSpace: "nowrap",
                  borderBottom: tab === t.id ? "2px solid #6366f1" : "2px solid transparent",
                  color: tab === t.id ? "#6366f1" : "#94a3b8",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div style={{ padding: "32px 28px", maxWidth: 900, margin: "0 auto" }}>
          {tab === "form" && (
            <div>
              <div style={{ marginBottom: 20, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>AI System Profile</h2>
                  <p style={{ fontSize: 12, color: "#64748b" }}>
                    12-question intake (~3 minutes). The risk engine applies combinatorial scoring — risks multiply, not add.
                  </p>
                </div>
                <button onClick={() => { setViewMode("example"); setTab("dashboard"); }} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #6366f1", background: "#eef2ff", color: "#6366f1", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                  View example result →
                </button>
              </div>
              <IntakeForm onSubmit={handleSubmit} onStartFresh={handleStartFresh} isExample={formIsExample} />
            </div>
          )}

          {tab === "dashboard" && (
            result && intake ? (
              <>
                {userResult && (
                  <div style={{ display: "flex", gap: 8, marginBottom: 16, padding: "8px 12px", background: "hsl(var(--card,#f8fafc))", border: "1px solid hsl(var(--border,#e2e8f0))", borderRadius: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Viewing:</span>
                    {(["example", "mine"] as const).map(m => (
                      <button key={m} onClick={() => setViewMode(m)} style={{
                        padding: "4px 12px", borderRadius: 6, border: `1px solid ${viewMode === m ? "#6366f1" : "hsl(var(--border,#e2e8f0))"}`,
                        background: viewMode === m ? "#6366f1" : "transparent", color: viewMode === m ? "#fff" : "#64748b",
                        fontSize: 11, fontWeight: 700, cursor: "pointer",
                      }}>
                        {m === "example" ? "Example (EU Hiring)" : "My Assessment"}
                      </button>
                    ))}
                    {viewMode === "example" && <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: 4 }}>— read-only</span>}
                  </div>
                )}
                <RiskDashboard result={result} intake={intake} />
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "48px", color: "#64748b" }}>
                <RiskDashboard result={SEED_RESULT} intake={SEED_HR} />
              </div>
            )
          )}

          {tab === "checklist" && (
            resultForChecklist && intake ? (
              <>
                {viewMode === "example" && (
                  <div style={{ padding: "8px 14px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, fontSize: 11, color: "#92400e", marginBottom: 16 }}>
                    Viewing example checklist — items cannot be checked off. Run your own assessment to track progress.
                  </div>
                )}
                <RemediationChecklist result={resultForChecklist} onToggle={toggleItem} />
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "48px", color: "#64748b" }}>Complete the intake form first. <button onClick={() => setTab("form")} style={{ color: "#6366f1", cursor: "pointer", border: "none", background: "transparent", fontWeight: 700, fontSize: 13 }}>Go to form →</button></div>
            )
          )}

          {tab === "dpsim" && <DiffPrivacySimulator />}

          {tab === "report" && (
            result && intake
              ? <DPIAReport result={result} intake={intake} />
              : <div style={{ textAlign: "center", padding: "48px", color: "#64748b" }}>Complete the intake form first. <button onClick={() => setTab("form")} style={{ color: "#6366f1", cursor: "pointer", border: "none", background: "transparent", fontWeight: 700, fontSize: 13 }}>Go to form →</button></div>
          )}
          {tab === "nutrition" && (
            intake
              ? <PrivacyNutritionLabelFull intake={intake} />
              : <div style={{ textAlign: "center", padding: "48px", color: "#64748b" }}>Complete the intake form first. <button onClick={() => setTab("form")} style={{ color: "#6366f1", cursor: "pointer", border: "none", background: "transparent", fontWeight: 700, fontSize: 13 }}>Go to form →</button></div>
          )}
          {tab === "modelcard" && (
            result && intake
              ? <ModelCard result={result} intake={intake} />
              : <div style={{ textAlign: "center", padding: "48px", color: "#64748b" }}>Complete the intake form first. <button onClick={() => setTab("form")} style={{ color: "#6366f1", cursor: "pointer", border: "none", background: "transparent", fontWeight: 700, fontSize: 13 }}>Go to form →</button></div>
          )}
          {tab === "methodology" && <MethodologyEval />}
        </div>
      </div>
    </PageGate>
  );
}
