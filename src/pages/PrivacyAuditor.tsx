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
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif", padding: "32px 24px", maxWidth: 860, margin: "0 auto" }}>
      <div style={{ marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Privacy Impact Auditor — Preview
        </span>
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4, color: "hsl(var(--foreground))" }}>
        AI-Specific DPIA Tool
      </h2>
      <p style={{ fontSize: 13, color: "#64748b", marginBottom: 24 }}>
        Sample: EU financial services hiring classifier — automated shortlist, no human review, 3 jurisdictions.
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

function PreviewPrivacyNutritionLabel() {
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
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif", padding: "24px 24px 32px", maxWidth: 860, margin: "0 auto" }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Privacy Nutrition Label
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
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif", padding: "0 24px 32px", maxWidth: 860, margin: "0 auto" }}>
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

const previewContent = (
  <div style={{ position: "relative" }}>
    <DiagonalWatermark />
    <PreviewRiskDashboard />
    <PreviewPrivacyNutritionLabel />
    <PreviewDPChart />
  </div>
);

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
      <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 8, padding: "12px 16px", fontSize: 12, color: "#0c4a6e", lineHeight: 1.6 }}>
        <strong>How this works:</strong> Differential privacy adds calibrated noise (Laplace mechanism, sensitivity=1) to model outputs.
        The privacy budget ε controls how much noise: smaller ε = more noise = stronger privacy guarantee.
        At ε=1 (the commonly accepted standard), this credit scoring model loses ~{Math.round(82 - currentPoint.accuracy)}pp of accuracy
        compared to the no-privacy baseline of 82%.
        <br /><br />
        <strong>Why it matters:</strong> EU AI Act technical standards and NIST AI RMF reference differential privacy as a privacy-preserving technique.
        This tradeoff curve shows practitioners exactly what accuracy they're giving up for each level of privacy protection.
      </div>
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

  const TABS: { id: Tab; label: string; phase: 1 | 2 }[] = [
    { id: "form",        label: "Intake Form",      phase: 1 },
    { id: "dashboard",   label: "Risk Dashboard",   phase: 1 },
    { id: "checklist",   label: "Remediation",      phase: 1 },
    { id: "dpsim",       label: "DP Simulator",     phase: 1 },
    { id: "report",      label: "DPIA Report",      phase: 2 },
    { id: "nutrition",   label: "Nutrition Label",  phase: 2 },
    { id: "modelcard",   label: "Model Card",       phase: 2 },
    { id: "methodology", label: "Methodology Eval", phase: 2 },
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
                  opacity: t.phase === 2 && t.id !== "form" ? 0.6 : 1,
                }}
              >
                {t.label}
                {t.phase === 2 && <span style={{ marginLeft: 4, fontSize: 9, fontWeight: 700, color: "#6366f1", background: "#eef2ff", padding: "1px 5px", borderRadius: 3 }}>P2</span>}
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

          {tab === "report" && <Phase2Stub title="Full DPIA Report" description="Structured report with necessity & proportionality analysis, data flows, risk assessment, and DPO sign-off section. Downloadable as JSON." />}
          {tab === "nutrition" && <Phase2Stub title="Privacy Nutrition Label" description="One-page visual — 8 categories each scored green/amber/red. Screenshot-able and shareable." />}
          {tab === "modelcard" && <Phase2Stub title="Model Card" description="Mitchell et al. 2019 template pre-filled from intake form. Maps to EU AI Act Art.13 transparency obligations." />}
          {tab === "methodology" && <Phase2Stub title="Methodology Eval" description="Meta-DPIA: the tool audits its own scoring methodology. Shows scoring rubric, known gaps, and citations to source regulations." />}
        </div>
      </div>
    </PageGate>
  );
}
