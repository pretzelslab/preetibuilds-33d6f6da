import { useState, useCallback, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import { IMPLEMENTATION_GUIDES as STATIC_GUIDES } from "./guides";
import { usePolicyGuides } from "../../hooks/usePolicyGuides";
import { seedDemoClient, DEMO_CLIENT_ID, seedMediScanClient } from "./demoData";

// Live policy data from Supabase — falls back to static guides while loading or on error
// Updated synchronously during each render so all sub-components see current data
let IMPLEMENTATION_GUIDES: Record<string, any> = STATIC_GUIDES;

// ─── INDUSTRY → TAG SLUG MAPPING ─────────────────────────────────────────────
// Maps a client's free-text industry to the tag slugs used in question_tags table
const INDUSTRY_SLUG_MAP: { match: string[]; slugs: string[] }[] = [
  { match: ["fintech", "financial tech", "lending", "credit", "payments", "neo bank", "neobank"], slugs: ["fintech", "banking"] },
  { match: ["bank", "financial services", "finance", "wealth", "asset management", "capital markets"], slugs: ["banking", "fintech", "insurance"] },
  { match: ["insur"], slugs: ["insurance"] },
  { match: ["health", "med", "pharma", "biotech", "clinic", "hospital"], slugs: ["healthcare"] },
  { match: ["hr tech", "hr-tech", "hrtech", "human resource", "recruitment", "talent", "hiring", "workforce"], slugs: ["hr-tech"] },
  { match: ["edtech", "ed tech", "education", "learning", "school", "university", "academic"], slugs: ["edtech"] },
  { match: ["public sector", "government", "gov tech", "govtech", "council", "agency", "ministry"], slugs: ["public-sector", "government"] },
];

function industryToSlugs(industry: string): string[] {
  if (!industry) return [];
  const lower = industry.toLowerCase();
  for (const entry of INDUSTRY_SLUG_MAP) {
    if (entry.match.some(m => lower.includes(m))) return entry.slugs;
  }
  return [];
}

function getQuestionRelevance(
  industryTags: { industry: string; relevance: string }[],
  clientSlugs: string[]
): "critical" | "high" | null {
  if (!clientSlugs.length || !industryTags.length) return null;
  const matches = industryTags.filter(t => clientSlugs.includes(t.industry));
  if (matches.some(t => t.relevance === "critical")) return "critical";
  if (matches.some(t => t.relevance === "high")) return "high";
  return null;
}

// ─── TYPES ────────────────────────────────────────────────────────────────────
type EngagementType = "" | "AI Risk Assessment" | "Readiness Assessment" | "Gap Analysis" | "Implementation Support" | "Audit Preparation";
type SignOffStatus = "Pending" | "In Review" | "Signed Off";
type QStatus = "Not Started" | "In Progress" | "Complete" | "Not Applicable" | "On Hold";
type DocExists = "" | "Yes" | "No" | "Partial";

type ClientStatus = "active" | "archived" | "hidden";

// ─── RISK REGISTER TYPES ──────────────────────────────────────────────────────
type RiskLevel = "Critical" | "High" | "Medium" | "Low";
type RiskStatus = "Open" | "In Progress" | "Resolved" | "Accepted";
type RiskTreatment = "" | "Treat" | "Transfer" | "Tolerate" | "Terminate";
type ControlType = "Preventive" | "Detective" | "Corrective";
type ControlStatus = "Not Implemented" | "Partially Implemented" | "Implemented" | "N/A";
type ControlEffectiveness = "" | "Effective" | "Partially Effective" | "Ineffective" | "Not Tested";
type AuditLogEntry = { ts: string; note: string };

type RiskControl = {
  type: ControlType;
  description: string;
  owner: string;
  status: ControlStatus;
  effectiveness: ControlEffectiveness;
};

type RiskEntry = {
  id: string;
  riskId: string;
  sourceArea: string;
  affectedSystem: string;
  riskCategory: string;
  description: string;
  likelihoodAtScale: string;
  inherentLikelihood: number;
  inherentImpact: number;
  residualLikelihood: number;
  residualImpact: number;
  controls: RiskControl[];
  condition: string;
  criteria: string;
  cause: string;
  effect: string;
  recommendation: string;
  owner: string;
  dueDate: string;
  status: RiskStatus;
  escalationNotes: string;
  // ── Audit fields ────────────────────────────────────────────────────────────
  treatmentDecision: RiskTreatment;
  clauseRef: string;               // e.g. "EU AI Act Art. 9(2)(b)"
  residualAcceptedBy: string;
  residualAcceptedDate: string;
  controlTestDate: string;
  nextReviewDate: string;
  auditLog: AuditLogEntry[];
};

type PendingGap = {
  id: string;
  policyId: string;
  policyName: string;
  area: string;
  areaPriority: string;
  gap: string;
  proposedAction: string;
  owner: string;
  dueDate: string;
  questionStatus: string;
  evidenceStatus: string;
  recommended: boolean;
  recommendReason: string;
  alreadyImported: boolean;
};

function isOverdue(risk: RiskEntry): boolean {
  if (!risk.dueDate || risk.status === "Resolved" || risk.status === "Accepted") return false;
  const [y, m, d] = risk.dueDate.split("-").map(Number);
  return new Date(y, m - 1, d) < new Date(new Date().setHours(0, 0, 0, 0));
}

type StakeholderEntry = {
  id: string;
  name: string;
  role: string;
  organisation: string;
  consulted: boolean;
  consultationDate: string;
  notes: string;
};

type AIType = "Machine Learning" | "Natural Language Processing" | "Computer Vision" | "Generative AI" | "Robotic Process Automation" | "Automation / Rules-Based" | "Other";
type DecisionAuthority = "" | "Fully Autonomous" | "Human-in-the-Loop" | "Human-on-the-Loop" | "Advisory Only";
type DeploymentStatus = "" | "Planning" | "Development" | "Pilot / Testing" | "Production" | "Decommissioning";
type ModelOwnership = "" | "Built In-House" | "Third-Party Vendor" | "Open Source" | "Hybrid";

type Client = {
  id: string;
  name: string;
  countries: string[];
  industry: string;
  geography: string;
  primaryAiUseCase: string;
  contactName: string;
  engagementType: EngagementType;
  signOffStatus: SignOffStatus;
  createdAt: string;
  activePolicies: string[];
  status: ClientStatus;
  aboutClient: string;          // free-text narrative about the client / engagement context
  // AI System Profile (Phase 1 — Govern & Scope)
  aiSystemName: string;
  aiTypes: AIType[];
  systemDescription: string;
  vendor: string;
  modelOwnership: ModelOwnership;
  decisionAuthority: DecisionAuthority;
  deploymentStatus: DeploymentStatus;
  timeInProduction: string;
  decisionsPerPeriod: string;
  internalUsersAffected: string;
  externalUsersAffected: string;
  trainingDataSource: string;
  trainingDataPeriod: string;
  lastRetrainingDate: string;
  // AIIA — Performance & Evaluation (ISO 42001 Cl. 8)
  modelAccuracy: string;
  falsePositiveRate: string;
  lastEvaluationDate: string;
  evaluationMethod: string;
  knownLimitations: string;
  stakeholders: StakeholderEntry[];
};

type QuestionState = {
  status: QStatus;
  currentState: string;      // what exists today
  gap: string;               // what is missing / insufficient
  proposedAction: string;    // what needs to be done
  evidenceStatus: DocExists; // Yes / Partial / No
  evidenceRef: string;       // link or filename to supporting evidence
  dueDate: string;
  owner: string;
};

type AreaState = {
  questions: Record<number, QuestionState>;
  lastUpdated: string;
  summary: string;
};

// ─── POLICY STUBS ─────────────────────────────────────────────────────────────
const POLICY_STUBS = [
  { id: "eu-ai-act",   name: "EU AI Act",    emoji: "🇪🇺", hasGuide: true,  color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
  { id: "nist-ai-rmf", name: "NIST AI RMF",  emoji: "🇺🇸", hasGuide: true,  color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe" },
  { id: "nist-csf",    name: "NIST CSF 2.0", emoji: "🛡️",  hasGuide: true,  color: "#0369a1", bg: "#f0f9ff", border: "#bae6fd" },
  { id: "iso-42001",   name: "ISO 42001",    emoji: "🌐",  hasGuide: true,  color: "#0891b2", bg: "#ecfeff", border: "#a5f3fc" },
  { id: "fair",        name: "FAIR",         emoji: "⚖️",  hasGuide: true,  color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  { id: "aaia",        name: "AAIA",         emoji: "🔍",  hasGuide: true,  color: "#be185d", bg: "#fdf2f8", border: "#fbcfe8" },
];

// ─── INDUSTRIES ───────────────────────────────────────────────────────────────
const INDUSTRY_OPTIONS = [
  "Financial Services / Fintech", "Banking & Lending", "Insurtech / Insurance",
  "Asset Management / Wealth Management", "Payments & Digital Wallets",
  "Healthtech / MedTech / Pharma", "Hospitals & Clinical Services",
  "Technology & SaaS", "Cybersecurity", "HR Technology / People Analytics",
  "Legal Technology", "Retail & E-commerce", "Supply Chain & Logistics",
  "Manufacturing & Industrial", "Energy & Utilities", "Telecommunications",
  "Media & Publishing", "Education & EdTech", "Public Sector / Government",
  "Defence & National Security", "Nonprofit / NGO", "Other (specify below)",
];

const ENGAGEMENT_TYPES: EngagementType[] = [
  "", "AI Risk Assessment", "Readiness Assessment", "Gap Analysis", "Implementation Support", "Audit Preparation",
];

// ─── COUNTRY OPTIONS & SUGGESTIONS ───────────────────────────────────────────
const COUNTRY_OPTIONS = [
  "European Union (EU / EEA)",
  "United Kingdom",
  "United States",
  "Canada",
  "Australia / New Zealand",
  "India",
  "Singapore / APAC",
  "Middle East & Africa",
  "Latin America",
  "Global / Multi-jurisdictional",
];

const COUNTRY_SUGGESTIONS: Record<string, Suggestion[]> = {
  "European Union (EU / EEA)": [
    { id: "eu-ai-act",   level: "Required",    reason: "Mandatory for all AI systems placed on the EU market" },
    { id: "iso-42001",   level: "Recommended", reason: "Certifiable AI management system, preferred by EU regulators" },
    { id: "fair",        level: "Consider",    reason: "Quantitative risk model aligns with EU AI Act risk requirements" },
    { id: "nist-ai-rmf", level: "Consider",    reason: "Useful if also operating in the US market" },
  ],
  "United Kingdom": [
    { id: "iso-42001",   level: "Required",    reason: "UK ICO and FCA guidance aligns with ISO 42001" },
    { id: "eu-ai-act",   level: "Recommended", reason: "Required if your AI products are sold or used in the EU" },
    { id: "nist-ai-rmf", level: "Consider",    reason: "Cross-border alignment with US partners" },
    { id: "fair",        level: "Consider",    reason: "Risk quantification for FCA-regulated AI" },
  ],
  "United States": [
    { id: "nist-ai-rmf", level: "Required",    reason: "Federal AI guidance; mandatory for government contractors" },
    { id: "nist-csf",    level: "Required",    reason: "Cybersecurity baseline covering AI/ML systems" },
    { id: "iso-42001",   level: "Recommended", reason: "International standard for globally operating companies" },
    { id: "eu-ai-act",   level: "Consider",    reason: "Required if selling AI products to EU customers" },
    { id: "fair",        level: "Consider",    reason: "Quantitative risk measurement aligned with SEC expectations" },
  ],
  "Canada": [
    { id: "iso-42001",   level: "Required",    reason: "ISED Canada AI code aligns with ISO 42001 principles" },
    { id: "nist-ai-rmf", level: "Recommended", reason: "Close regulatory alignment with US frameworks" },
    { id: "eu-ai-act",   level: "Consider",    reason: "Required for EU-facing products or data transfers" },
    { id: "fair",        level: "Consider",    reason: "Risk quantification framework" },
  ],
  "Australia / New Zealand": [
    { id: "iso-42001",   level: "Required",    reason: "Australian government AI ethics framework aligns with ISO 42001" },
    { id: "nist-ai-rmf", level: "Recommended", reason: "Five Eyes alignment with US AI governance approach" },
    { id: "aaia",        level: "Consider",    reason: "AI audit certification increasingly valued in APAC" },
    { id: "fair",        level: "Consider",    reason: "Risk quantification for APRA-regulated entities" },
  ],
  "India": [
    { id: "iso-42001",   level: "Required",    reason: "India AI governance framework mirrors ISO 42001 structure" },
    { id: "nist-ai-rmf", level: "Recommended", reason: "MEITY AI framework references the NIST approach" },
    { id: "fair",        level: "Consider",    reason: "Risk quantification for SEBI and RBI regulated entities" },
    { id: "aaia",        level: "Consider",    reason: "AI audit certification for financial sector" },
  ],
  "Singapore / APAC": [
    { id: "iso-42001",   level: "Required",    reason: "MAS and IMDA frameworks align with ISO 42001" },
    { id: "nist-ai-rmf", level: "Recommended", reason: "MAS FEAT and AI ethics principles align with NIST" },
    { id: "aaia",        level: "Recommended", reason: "PDPC Singapore AI governance framework certification" },
    { id: "fair",        level: "Consider",    reason: "MAS expects quantitative risk assessment for financial AI" },
  ],
  "Middle East & Africa": [
    { id: "iso-42001",   level: "Required",    reason: "UAE National AI Strategy and DIFC regulation align with ISO 42001" },
    { id: "nist-ai-rmf", level: "Consider",    reason: "Referenced by ADGM and DIFC AI frameworks" },
    { id: "fair",        level: "Consider",    reason: "Risk quantification valued in financial services regulation" },
    { id: "aaia",        level: "Consider",    reason: "AI audit capability building requirement" },
  ],
  "Latin America": [
    { id: "iso-42001",   level: "Required",    reason: "Brazil LGPD and regional AI frameworks align with ISO 42001" },
    { id: "nist-ai-rmf", level: "Recommended", reason: "Referenced by several national AI strategies in the region" },
    { id: "eu-ai-act",   level: "Consider",    reason: "Required if exporting AI products to the EU market" },
    { id: "fair",        level: "Consider",    reason: "Risk quantification for financial sector compliance" },
  ],
  "Global / Multi-jurisdictional": [
    { id: "iso-42001",   level: "Required",    reason: "International standard recognised across all jurisdictions" },
    { id: "nist-ai-rmf", level: "Required",    reason: "De facto global AI risk management reference framework" },
    { id: "eu-ai-act",   level: "Recommended", reason: "Highest-bar regulation; compliance provides a global baseline" },
    { id: "fair",        level: "Recommended", reason: "Consistent quantitative risk measurement across jurisdictions" },
    { id: "aaia",        level: "Consider",    reason: "AI audit certification valued across major markets" },
  ],
};

// ─── FRAMEWORK SUGGESTIONS BY INDUSTRY ───────────────────────────────────────
type SuggestionLevel = "Required" | "Recommended" | "Consider";
type Suggestion = { id: string; level: SuggestionLevel; reason: string };

const INDUSTRY_SUGGESTIONS: Record<string, Suggestion[]> = {
  "Financial Services / Fintech": [
    { id: "eu-ai-act",   level: "Required",    reason: "High-risk AI (credit scoring, fraud detection)" },
    { id: "nist-ai-rmf", level: "Recommended", reason: "Risk management for US-facing operations" },
    { id: "iso-42001",   level: "Recommended", reason: "Certifiable AI management system" },
    { id: "fair",        level: "Consider",    reason: "Quantify AI risk in financial exposure" },
  ],
  "Banking & Lending": [
    { id: "eu-ai-act",   level: "Required",    reason: "Credit scoring explicitly high-risk (Annex III)" },
    { id: "iso-42001",   level: "Required",    reason: "Regulator preference for certified AI management" },
    { id: "nist-ai-rmf", level: "Recommended", reason: "US operations or Federal framework alignment" },
    { id: "fair",        level: "Recommended", reason: "Quantify AI credit risk in financial exposure terms" },
    { id: "nist-csf",    level: "Consider",    reason: "Cybersecurity for AI platform protection" },
    { id: "aaia",        level: "Consider",    reason: "Independent AI audit increasingly expected by regulators" },
  ],
  "Insurtech / Insurance": [
    { id: "eu-ai-act",   level: "Required",    reason: "Underwriting and risk classification AI is high-risk" },
    { id: "iso-42001",   level: "Recommended", reason: "Insurance regulators align to ISO standards" },
    { id: "fair",        level: "Recommended", reason: "Actuarial mindset aligns naturally with FAIR quantification" },
    { id: "nist-ai-rmf", level: "Consider",    reason: "US market alignment" },
  ],
  "Asset Management / Wealth Management": [
    { id: "eu-ai-act",   level: "Recommended", reason: "Investment recommendation GPAI tools in scope" },
    { id: "nist-ai-rmf", level: "Recommended", reason: "AI risk management for advisory tools" },
    { id: "fair",        level: "Recommended", reason: "Risk quantification for investment AI and SEC expectations" },
    { id: "iso-42001",   level: "Consider",    reason: "Governance signal to institutional investors" },
  ],
  "Payments & Digital Wallets": [
    { id: "eu-ai-act",   level: "Recommended", reason: "AI in fraud detection is regulated" },
    { id: "nist-csf",    level: "Recommended", reason: "Cybersecurity baseline for payment infrastructure" },
    { id: "iso-42001",   level: "Consider",    reason: "Alignment with PCI DSS and AI governance" },
  ],
  "Healthtech / MedTech / Pharma": [
    { id: "eu-ai-act",   level: "Required",    reason: "Medical device and clinical AI is high-risk (Annex III)" },
    { id: "nist-ai-rmf", level: "Required",    reason: "US FDA AI/ML SaMD framework aligned to NIST RMF" },
    { id: "iso-42001",   level: "Recommended", reason: "CE marking and MDR governance alignment" },
    { id: "fair",        level: "Consider",    reason: "Quantifying AI risk in clinical settings" },
  ],
  "Hospitals & Clinical Services": [
    { id: "eu-ai-act",   level: "Required",    reason: "Clinical decision support AI is high-risk" },
    { id: "nist-ai-rmf", level: "Recommended", reason: "Risk governance for AI-assisted diagnosis" },
    { id: "iso-42001",   level: "Consider",    reason: "Alignment with hospital accreditation bodies" },
    { id: "fair",        level: "Consider",    reason: "Quantifying AI risk in clinical and patient safety settings" },
    { id: "aaia",        level: "Consider",    reason: "Independent AI audit for clinical AI systems" },
  ],
  "Technology & SaaS": [
    { id: "iso-42001",   level: "Recommended", reason: "AI management certification for enterprise procurement" },
    { id: "nist-csf",    level: "Recommended", reason: "Cybersecurity baseline for AI platform providers" },
    { id: "eu-ai-act",   level: "Consider",    reason: "Applies if deploying AI to EU customers" },
    { id: "nist-ai-rmf", level: "Consider",    reason: "US government procurement alignment" },
    { id: "fair",        level: "Consider",    reason: "Risk quantification for mature AI risk programmes" },
    { id: "aaia",        level: "Consider",    reason: "AI audit certification valued in enterprise procurement" },
  ],
  "Cybersecurity": [
    { id: "nist-csf",    level: "Required",    reason: "Core framework for cybersecurity posture" },
    { id: "nist-ai-rmf", level: "Recommended", reason: "AI-specific risk management layer" },
    { id: "iso-42001",   level: "Consider",    reason: "Governance for AI-driven security tooling" },
    { id: "fair",        level: "Consider",    reason: "FAIR originated in cybersecurity — natural fit for AI risk quantification" },
  ],
  "HR Technology / People Analytics": [
    { id: "eu-ai-act",   level: "Required",    reason: "Recruitment and performance AI explicitly high-risk (Annex III)" },
    { id: "iso-42001",   level: "Recommended", reason: "Governance for sensitive people data" },
    { id: "fair",        level: "Consider",    reason: "Risk quantification for bias in hiring AI" },
    { id: "aaia",        level: "Consider",    reason: "Bias auditing in hiring AI is a core AAIA domain" },
  ],
  "Legal Technology": [
    { id: "eu-ai-act",   level: "Recommended", reason: "AI in legal advice and justice is high-risk" },
    { id: "iso-42001",   level: "Recommended", reason: "Client trust and governance signal" },
    { id: "nist-ai-rmf", level: "Consider",    reason: "Risk framework for US legal AI products" },
  ],
  "Retail & E-commerce": [
    { id: "eu-ai-act",   level: "Recommended", reason: "Recommendation engines, pricing AI, biometrics in scope" },
    { id: "iso-42001",   level: "Consider",    reason: "Governance baseline for customer-facing AI" },
  ],
  "Supply Chain & Logistics": [
    { id: "iso-42001",   level: "Recommended", reason: "Operational AI governance for logistics optimisation" },
    { id: "nist-ai-rmf", level: "Consider",    reason: "Risk framework for autonomous supply chain decisions" },
  ],
  "Manufacturing & Industrial": [
    { id: "iso-42001",   level: "Recommended", reason: "ISO standards familiar to manufacturing sector" },
    { id: "nist-csf",    level: "Recommended", reason: "OT/IT convergence and AI in industrial systems" },
    { id: "eu-ai-act",   level: "Consider",    reason: "Safety-critical AI may be high-risk" },
  ],
  "Energy & Utilities": [
    { id: "nist-csf",    level: "Required",    reason: "Critical infrastructure cybersecurity baseline" },
    { id: "iso-42001",   level: "Recommended", reason: "AI governance for grid and energy management" },
    { id: "eu-ai-act",   level: "Consider",    reason: "Critical infrastructure AI may be high-risk" },
  ],
  "Telecommunications": [
    { id: "eu-ai-act",   level: "Recommended", reason: "Network management AI and content moderation in scope" },
    { id: "nist-csf",    level: "Recommended", reason: "Critical infrastructure protection baseline" },
    { id: "iso-42001",   level: "Consider",    reason: "Enterprise governance for AI services" },
  ],
  "Media & Publishing": [
    { id: "eu-ai-act",   level: "Consider",    reason: "Deepfake labelling and GPAI content rules apply" },
    { id: "iso-42001",   level: "Consider",    reason: "Editorial AI governance baseline" },
  ],
  "Education & EdTech": [
    { id: "eu-ai-act",   level: "Recommended", reason: "AI in educational assessment is high-risk (Annex III)" },
    { id: "nist-ai-rmf", level: "Consider",    reason: "Risk framework for adaptive learning AI" },
    { id: "iso-42001",   level: "Consider",    reason: "Governance for student data and AI use" },
  ],
  "Public Sector / Government": [
    { id: "eu-ai-act",   level: "Required",    reason: "Public admin AI is high-risk; prohibited use rules apply" },
    { id: "nist-ai-rmf", level: "Required",    reason: "US Federal AI mandates align to NIST RMF" },
    { id: "iso-42001",   level: "Recommended", reason: "International procurement and governance standard" },
    { id: "aaia",        level: "Consider",    reason: "Algorithmic accountability frameworks" },
  ],
  "Defence & National Security": [
    { id: "nist-ai-rmf", level: "Required",    reason: "US DoD AI ethics and risk framework alignment" },
    { id: "nist-csf",    level: "Required",    reason: "Critical systems cybersecurity baseline" },
    { id: "iso-42001",   level: "Consider",    reason: "International procurement alignment" },
  ],
  "Nonprofit / NGO": [
    { id: "iso-42001",   level: "Consider",    reason: "Governance baseline for responsible AI use" },
    { id: "eu-ai-act",   level: "Consider",    reason: "If operating in EU or processing EU citizen data" },
  ],
};

const SUGGESTION_CONFIG: Record<SuggestionLevel, { bg: string; text: string; border: string }> = {
  "Required":    { bg: "#fef2f2", text: "#dc2626", border: "#fecaca" },
  "Recommended": { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
  "Consider":    { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0" },
};

const STATUS_CONFIG: Record<QStatus, { bg: string; text: string; border: string }> = {
  "Not Started":    { bg: "#f8fafc", text: "#64748b", border: "#e2e8f0" },
  "In Progress":    { bg: "#fefce8", text: "#a16207", border: "#fde047" },
  "Complete":       { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0" },
  "Not Applicable": { bg: "#f1f5f9", text: "#94a3b8", border: "#cbd5e1" },
  "On Hold":        { bg: "#fff7ed", text: "#c2410c", border: "#fed7aa" },
};

const SIGN_OFF_CONFIG: Record<SignOffStatus, { bg: string; text: string; border: string; icon: string }> = {
  "Pending":    { bg: "#f8fafc", text: "#64748b", border: "#e2e8f0", icon: "📝" },
  "In Review":  { bg: "#fefce8", text: "#a16207", border: "#fde047", icon: "🔍" },
  "Signed Off": { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0", icon: "✅" },
};

// ─── CLAUSE TOOLTIPS ──────────────────────────────────────────────────────────
const CLAUSE_SUMMARIES: Record<string, string> = {
  "Art. 5":    "Prohibited Practices — Bans social scoring, real-time biometric ID in public, subliminal manipulation, and emotion recognition in workplace/education. Penalty: up to €35M or 7% global turnover.",
  "Art. 6":    "High-Risk Classification Criteria — An AI system is high-risk if it is a safety component of a product under Annex II legislation, or falls within one of the 8 use-case areas in Annex III.",
  "Art. 9":    "Risk Management System — Requires a documented, iterative process throughout the AI lifecycle to identify, analyse, estimate, evaluate, and mitigate foreseeable risks.",
  "Art. 10":   "Data Governance — Training, validation, and test data must meet quality criteria: relevant, representative, free of errors as far as possible, and have appropriate statistical properties.",
  "Art. 13":   "Transparency — High-risk AI must provide instructions allowing operators to understand the system's purpose, capabilities, limitations, and performance levels.",
  "Art. 14":   "Human Oversight — High-risk AI systems must be designed to allow effective human oversight. Operators must be able to monitor, understand, and intervene or halt the system.",
  "Art. 17":   "Quality Management System — Providers must implement a written QMS covering the entire AI lifecycle, documented policies, testing protocols, and post-market obligations.",
  "Art. 43":   "Conformity Assessment — High-risk AI must undergo conformity assessment (self-assessment or third-party) before being placed on the EU market.",
  "Annex III": "8 High-Risk Use Cases — Biometrics · Critical Infrastructure · Education & Vocational Training · Employment · Essential Private/Public Services · Law Enforcement · Migration & Border Control · Justice.",
  "Annex IV":  "Technical Documentation — Must include: system description, design specs, training data, testing methodology, performance metrics, risk management records, and post-market monitoring plan.",
};

// Extracts clause keys from a regulatoryRef string and returns matching summaries
function getClauseSummaries(ref: string): Array<{ key: string; summary: string }> {
  return Object.entries(CLAUSE_SUMMARIES)
    .filter(([key]) => ref.includes(key))
    .map(([key, summary]) => ({ key, summary }));
}

const RISK_CLASSIFICATION_HINT = `EU AI Act Risk Levels:\n• Unacceptable — Prohibited (Art. 5). No use permitted.\n• High — Regulated under Annex III (e.g. recruitment AI, credit scoring, biometrics, medical devices). Requires conformity assessment, technical documentation, and human oversight.\n• Limited — Transparency obligations only (e.g. chatbots must disclose AI interaction).\n• Minimal — No specific obligations. Most AI systems fall here (e.g. spam filters, recommendation engines).`;

// ─── STORAGE HELPERS ──────────────────────────────────────────────────────────
const CL_KEY = "pl_clients";
function migrateClient(c: any): Client {
  return {
    geography: "",
    primaryAiUseCase: "",
    contactName: "",
    engagementType: "" as EngagementType,
    signOffStatus: "Pending" as SignOffStatus,
    countries: Array.isArray(c.countries) && c.countries.length > 0 ? c.countries : (c.country ? [c.country] : []),
    status: "active" as ClientStatus,
    aboutClient: "",
    aiSystemName: "",
    aiTypes: [],
    systemDescription: "",
    vendor: "",
    modelOwnership: "" as ModelOwnership,
    decisionAuthority: "" as DecisionAuthority,
    deploymentStatus: "" as DeploymentStatus,
    timeInProduction: "",
    decisionsPerPeriod: "",
    internalUsersAffected: "",
    externalUsersAffected: "",
    trainingDataSource: "",
    trainingDataPeriod: "",
    lastRetrainingDate: "",
    modelAccuracy: "",
    falsePositiveRate: "",
    lastEvaluationDate: "",
    evaluationMethod: "",
    knownLimitations: "",
    stakeholders: [],
    ...c,
  };
}
function loadClients(): Client[] {
  try { return (JSON.parse(localStorage.getItem(CL_KEY) || "[]") as any[]).map(migrateClient); } catch { return []; }
}
function saveClients(clients: Client[]) {
  try { localStorage.setItem(CL_KEY, JSON.stringify(clients)); } catch {}
}
function areaKey(clientId: string, policyId: string, areaIdx: number) {
  return `pl_disc_${clientId}_${policyId}_${areaIdx}`;
}
function loadArea(clientId: string, policyId: string, areaIdx: number): AreaState {
  try {
    const raw = JSON.parse(localStorage.getItem(areaKey(clientId, policyId, areaIdx)) || "null");
    return raw ? { summary: "", ...raw } : { questions: {}, lastUpdated: "", summary: "" };
  } catch { return { questions: {}, lastUpdated: "", summary: "" }; }
}
function reportSummaryKey(clientId: string, policyId: string) {
  return `pl_rpt_sum_${clientId}_${policyId}`;
}
function loadReportSummary(clientId: string, policyId: string): string {
  return localStorage.getItem(reportSummaryKey(clientId, policyId)) || "";
}
function saveReportSummary(clientId: string, policyId: string, text: string) {
  try { localStorage.setItem(reportSummaryKey(clientId, policyId), text); } catch {}
}
function saveArea(clientId: string, policyId: string, areaIdx: number, state: AreaState) {
  try { localStorage.setItem(areaKey(clientId, policyId, areaIdx), JSON.stringify({ ...state, lastUpdated: new Date().toISOString() })); } catch {}
}
function riskKey(clientId: string) { return `pl_risks_${clientId}`; }
function riskSummaryKey(clientId: string) { return `pl_risk_sum_${clientId}`; }
function loadRisks(clientId: string): RiskEntry[] {
  try { return JSON.parse(localStorage.getItem(riskKey(clientId)) || "[]"); } catch { return []; }
}
function saveRisks(clientId: string, risks: RiskEntry[]) {
  try { localStorage.setItem(riskKey(clientId), JSON.stringify(risks)); } catch {}
}
function riskLevel(l: number, i: number): RiskLevel {
  const s = l * i;
  return s >= 16 ? "Critical" : s >= 9 ? "High" : s >= 4 ? "Medium" : "Low";
}
const RISK_LEVEL_CONFIG: Record<RiskLevel, { bg: string; text: string; border: string }> = {
  Critical: { bg: "#fef2f2", text: "#b91c1c", border: "#fecaca" },
  High:     { bg: "#fff7ed", text: "#c2410c", border: "#fed7aa" },
  Medium:   { bg: "#fefce8", text: "#a16207", border: "#fde068" },
  Low:      { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0" },
};
const RISK_CATEGORIES = ["Data Bias & Fairness", "Transparency & Explainability", "Governance & Accountability", "Security & Adversarial Risk", "Privacy & Data Protection", "Regulatory Non-Compliance", "Human Oversight Failure", "Third-Party / Vendor Risk", "Model Performance & Drift", "Fundamental Rights Violation", "Other"];

// ─── BACKUP EXPORT / IMPORT ───────────────────────────────────────────────────
function exportBackupJSON() {
  const clients = loadClients();
  const backup: Record<string, any> = {
    version: 2, exportedAt: new Date().toISOString(), clients,
    discoveryData: {}, clientData: {},
  };
  clients.forEach(client => {
    // Phase 2 questionnaire area data
    client.activePolicies.forEach(policyId => {
      const guide = IMPLEMENTATION_GUIDES[policyId];
      if (!guide) return;
      guide.areas.forEach((_a: any, i: number) => {
        const key = areaKey(client.id, policyId, i);
        const raw = localStorage.getItem(key);
        if (raw) backup.discoveryData[key] = JSON.parse(raw);
      });
      // Per-policy report summary
      const rptRaw = localStorage.getItem(reportSummaryKey(client.id, policyId));
      if (rptRaw !== null) {
        backup.clientData[client.id] = backup.clientData[client.id] || {};
        backup.clientData[client.id].reportSummaries = backup.clientData[client.id].reportSummaries || {};
        backup.clientData[client.id].reportSummaries[policyId] = rptRaw;
      }
    });
    // Risk register + summaries
    const risksRaw = localStorage.getItem(riskKey(client.id));
    const riskSumRaw = localStorage.getItem(riskSummaryKey(client.id));
    // Phase 4 sign-off fields
    const p4exec  = localStorage.getItem(`pl_p4_exec_${client.id}`);
    const p4prep  = localStorage.getItem(`pl_p4_prep_${client.id}`);
    const p4rev   = localStorage.getItem(`pl_p4_rev_${client.id}`);
    const p4date  = localStorage.getItem(`pl_p4_date_${client.id}`);
    // Phase 5
    const p5raw   = localStorage.getItem(`pl_p5_${client.id}`);
    backup.clientData[client.id] = {
      ...(backup.clientData[client.id] || {}),
      ...(risksRaw  ? { risks: JSON.parse(risksRaw) }   : {}),
      ...(riskSumRaw ? { riskSummary: riskSumRaw }       : {}),
      ...(p4exec  !== null ? { p4exec }  : {}),
      ...(p4prep  !== null ? { p4prep }  : {}),
      ...(p4rev   !== null ? { p4rev }   : {}),
      ...(p4date  !== null ? { p4date }  : {}),
      ...(p5raw   ? { p5: JSON.parse(p5raw) } : {}),
    };
  });
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url;
  a.download = `ClientWorkbook_Backup_${new Date().toISOString().slice(0, 10)}.json`;
  a.click(); URL.revokeObjectURL(url);
}

function importBackupJSON(file: File, onDone: () => void) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const backup = JSON.parse(e.target?.result as string);
      if (backup.clients) saveClients(backup.clients);
      // Phase 2 questionnaire data (v1 + v2)
      if (backup.discoveryData) {
        Object.entries(backup.discoveryData).forEach(([key, value]) => {
          try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
        });
      }
      // v2: risk register, Phase 4/5 per client
      if (backup.clientData) {
        Object.entries(backup.clientData).forEach(([clientId, data]: [string, any]) => {
          if (data.risks)       saveRisks(clientId, data.risks);
          if (data.riskSummary !== undefined) try { localStorage.setItem(riskSummaryKey(clientId), data.riskSummary); } catch {}
          if (data.p4exec  !== undefined) try { localStorage.setItem(`pl_p4_exec_${clientId}`,  data.p4exec);  } catch {}
          if (data.p4prep  !== undefined) try { localStorage.setItem(`pl_p4_prep_${clientId}`,  data.p4prep);  } catch {}
          if (data.p4rev   !== undefined) try { localStorage.setItem(`pl_p4_rev_${clientId}`,   data.p4rev);   } catch {}
          if (data.p4date  !== undefined) try { localStorage.setItem(`pl_p4_date_${clientId}`,  data.p4date);  } catch {}
          if (data.p5)    try { localStorage.setItem(`pl_p5_${clientId}`, JSON.stringify(data.p5)); } catch {}
          if (data.reportSummaries) {
            Object.entries(data.reportSummaries).forEach(([pid, summary]) => {
              try { localStorage.setItem(reportSummaryKey(clientId, pid), summary as string); } catch {}
            });
          }
        });
      }
      onDone();
    } catch { alert("Could not restore — invalid backup file."); }
  };
  reader.readAsText(file);
}

// ─── EXCEL EXPORT (per workbook) ──────────────────────────────────────────────
function exportWorkbookExcel(client: Client, policyId: string, areaStates: AreaState[]) {
  const stub = POLICY_STUBS.find(p => p.id === policyId)!;
  const guide = IMPLEMENTATION_GUIDES[policyId];
  if (!guide) return;
  const wb = XLSX.utils.book_new();

  // Sheet 1: Client Overview
  const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const sof = SIGN_OFF_CONFIG[client.signOffStatus];
  const overviewRows = [
    [`${stub.name} — Discovery Workbook`],
    [],
    ["Client Name",       client.name],
    ["Country / Jurisdiction", (client.countries || []).join(", ") || "—"],
    ["Industry",          client.industry],
    ["Geography",         client.geography || "—"],
    ["Primary AI Use Case", client.primaryAiUseCase || "—"],
    ["Client Contact",    client.contactName || "—"],
    ["Engagement Type",   client.engagementType || "—"],
    ["Frameworks in Scope", client.activePolicies.map(id => POLICY_STUBS.find(p => p.id === id)?.name || id).join(", ")],
    ["Sign-off Status",   `${sof.icon} ${client.signOffStatus}`],
    ["Export Date",       today],
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(overviewRows);
  ws1["!cols"] = [{ wch: 24 }, { wch: 48 }];
  XLSX.utils.book_append_sheet(wb, ws1, "Client Overview");

  // Sheet 2: Discovery Log
  const discRows: any[][] = [
    ["Ref", "Area", "Pillar", "Stakeholder", "Priority", "Question", "Status", "Owner", "Due Date", "Evidence?", "Evidence Ref", "Current State", "Gap / Finding", "Proposed Action"],
  ];
  guide.areas.forEach((area, ai) => {
    const st = areaStates[ai];
    area.questions.forEach((q, qi) => {
      const qs = st.questions[qi] || { status: "Not Started", currentState: "", gap: "", proposedAction: "", evidenceStatus: "", evidenceRef: "", owner: "", dueDate: "" };
      discRows.push([`${ai + 1}.${qi + 1}`, area.area, area.pillar, area.stakeholder, area.priority, q, qs.status, qs.owner || "—", qs.dueDate || "—", qs.evidenceStatus || "—", qs.evidenceRef || "—", qs.currentState || "", qs.gap || "", qs.proposedAction || ""]);
    });
  });
  const ws2 = XLSX.utils.aoa_to_sheet(discRows);
  ws2["!cols"] = [{ wch: 6 }, { wch: 28 }, { wch: 12 }, { wch: 20 }, { wch: 10 }, { wch: 48 }, { wch: 14 }, { wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 36 }, { wch: 40 }, { wch: 40 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, ws2, "Discovery Log");

  // Sheet 3: Readiness Summary
  const sumRows: any[][] = [["Area", "Priority", "Effort", "Total Q", "Complete", "In Progress", "On Hold", "N/A", "Not Started", "% Complete"]];
  guide.areas.forEach((area, ai) => {
    const st = areaStates[ai];
    let total = 0, complete = 0, inProg = 0, onHold = 0, na = 0, notStarted = 0;
    area.questions.forEach((_q, qi) => {
      const s = st.questions[qi]?.status || "Not Started";
      if (s === "Not Applicable") { na++; return; }
      total++;
      if (s === "Complete") complete++;
      else if (s === "In Progress") inProg++;
      else if (s === "On Hold") onHold++;
      else notStarted++;
    });
    sumRows.push([area.area, area.priority, area.effort, total, complete, inProg, onHold, na, notStarted, total ? `${Math.round((complete / total) * 100)}%` : "0%"]);
  });
  const ws3 = XLSX.utils.aoa_to_sheet(sumRows);
  ws3["!cols"] = [{ wch: 32 }, { wch: 10 }, { wch: 10 }, { wch: 8 }, { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 8 }, { wch: 12 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, ws3, "Readiness Summary");

  const fname = `${stub.name.replace(/\s/g, "")}${client.name.replace(/\s/g, "")}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fname);
}

// ─── FULL REPORT EXCEL EXPORT (Phase 4) ───────────────────────────────────────
function exportFullReportExcel(client: Client) {
  const wb = XLSX.utils.book_new();
  const risks = loadRisks(client.id);
  const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  // Sheet 1: Overview
  const ws1 = XLSX.utils.aoa_to_sheet([
    ["AI Governance Risk Assessment Report"], [],
    ["Client",             client.name],
    ["Country",            (client.countries || []).join(", ") || "—"],
    ["Industry",           client.industry],
    ["AI System",          client.aiSystemName || "—"],
    ["Decision Authority", client.decisionAuthority || "—"],
    ["Frameworks",         client.activePolicies.map(id => POLICY_STUBS.find(p => p.id === id)?.name || id).join(", ")],
    ["Export Date",        today],
    [], ["Total Risks", risks.length],
    ["Critical (Residual)", risks.filter(r => riskLevel(r.residualLikelihood, r.residualImpact) === "Critical").length],
    ["High (Residual)",     risks.filter(r => riskLevel(r.residualLikelihood, r.residualImpact) === "High").length],
    ["Medium (Residual)",   risks.filter(r => riskLevel(r.residualLikelihood, r.residualImpact) === "Medium").length],
    ["Low (Residual)",      risks.filter(r => riskLevel(r.residualLikelihood, r.residualImpact) === "Low").length],
  ]);
  ws1["!cols"] = [{ wch: 24 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, ws1, "Overview");

  // Sheet 2: Risk Register
  const rrRows: any[][] = [["Risk ID", "Source Area", "Affected System", "Category", "Description", "Likelihood at Scale", "Inherent L", "Inherent I", "Inherent Score", "Inherent Level", "Residual L", "Residual I", "Residual Score", "Residual Level", "Status", "Owner", "Due Date"]];
  risks.forEach(r => rrRows.push([r.riskId, r.sourceArea, r.affectedSystem, r.riskCategory, r.description, r.likelihoodAtScale, r.inherentLikelihood, r.inherentImpact, r.inherentLikelihood * r.inherentImpact, riskLevel(r.inherentLikelihood, r.inherentImpact), r.residualLikelihood, r.residualImpact, r.residualLikelihood * r.residualImpact, riskLevel(r.residualLikelihood, r.residualImpact), r.status, r.owner, r.dueDate]));
  const ws2 = XLSX.utils.aoa_to_sheet(rrRows);
  ws2["!cols"] = [{ wch: 10 }, { wch: 28 }, { wch: 24 }, { wch: 28 }, { wch: 50 }, { wch: 40 }, { wch: 8 }, { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 8 }, { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 20 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, ws2, "Risk Register");

  // Sheet 3: Formal Findings (Critical + High only)
  const ffRows: any[][] = [["Risk ID", "Level", "Condition", "Criteria", "Cause", "Effect", "Recommendation", "Owner", "Due Date"]];
  [...risks].filter(r => { const l = riskLevel(r.residualLikelihood, r.residualImpact); return l === "Critical" || l === "High"; })
    .sort((a, b) => b.residualLikelihood * b.residualImpact - a.residualLikelihood * a.residualImpact)
    .forEach(r => ffRows.push([r.riskId, riskLevel(r.residualLikelihood, r.residualImpact), r.condition, r.criteria, r.cause, r.effect, r.recommendation, r.owner, r.dueDate]));
  const ws3 = XLSX.utils.aoa_to_sheet(ffRows);
  ws3["!cols"] = [{ wch: 10 }, { wch: 12 }, { wch: 50 }, { wch: 50 }, { wch: 50 }, { wch: 50 }, { wch: 60 }, { wch: 20 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, ws3, "Formal Findings");

  // Sheet 4: Remediation Roadmap
  const rmRows: any[][] = [["Priority", "Risk ID", "Description", "Residual Level", "Recommendation", "Owner", "Due Date", "Status"]];
  [...risks].filter(r => r.status !== "Resolved" && r.status !== "Accepted")
    .sort((a, b) => b.residualLikelihood * b.residualImpact - a.residualLikelihood * a.residualImpact)
    .forEach((r, i) => rmRows.push([i + 1, r.riskId, r.description, riskLevel(r.residualLikelihood, r.residualImpact), r.recommendation, r.owner, r.dueDate, r.status]));
  const ws4 = XLSX.utils.aoa_to_sheet(rmRows);
  ws4["!cols"] = [{ wch: 8 }, { wch: 10 }, { wch: 50 }, { wch: 14 }, { wch: 60 }, { wch: 20 }, { wch: 12 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, ws4, "Remediation Roadmap");

  XLSX.writeFile(wb, `${client.name.replace(/\s/g, "")}_AIGovernanceReport_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// ─── AIIA EXPORT (ISO 42001 Clause 8 format) ─────────────────────────────────
function exportAIIA(client: Client) {
  const wb = XLSX.utils.book_new();
  const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const risks = loadRisks(client.id);

  // Sheet 1: AIIA Header & System Profile
  const ws1 = XLSX.utils.aoa_to_sheet([
    ["AI SYSTEM IMPACT ASSESSMENT (AIIA)"],
    ["ISO 42001:2023 — Clause 8 Compliant Format"],
    [],
    ["SECTION 1 — DOCUMENT INFORMATION"],
    ["AI System Name",     client.aiSystemName || "—"],
    ["Organisation",       client.name],
    ["Assessment Date",    today],
    ["Prepared by",        localStorage.getItem(`pl_p4_prep_${client.id}`) || "—"],
    ["Reviewed by",        localStorage.getItem(`pl_p4_rev_${client.id}`) || "—"],
    ["Version",            "1.0"],
    [],
    ["SECTION 2 — SYSTEM DESCRIPTION (Cl. 8.2)"],
    ["Intended Purpose",       client.systemDescription || "—"],
    ["AI Types",               (client.aiTypes || []).join(", ") || "—"],
    ["Model Ownership",        client.modelOwnership || "—"],
    ["Vendor / Builder",       client.vendor || "—"],
    ["Deployment Status",      client.deploymentStatus || "—"],
    ["Time in Production",     client.timeInProduction || "—"],
    [],
    ["SECTION 3 — DECISION AUTHORITY & SCALE (Cl. 8.2)"],
    ["Decision Authority",     client.decisionAuthority || "—"],
    ["Decisions per Period",   client.decisionsPerPeriod || "—"],
    ["Internal Users Affected",client.internalUsersAffected || "—"],
    ["External Users Affected",client.externalUsersAffected || "—"],
    [],
    ["SECTION 4 — TRAINING DATA (Cl. 8.4 / Annex A.4)"],
    ["Training Data Source",   client.trainingDataSource || "—"],
    ["Training Data Period",   client.trainingDataPeriod || "—"],
    ["Last Retraining Date",   client.lastRetrainingDate || "—"],
    [],
    ["SECTION 5 — PERFORMANCE METRICS (Cl. 8.2 / Annex A.8.2)"],
    ["Model Accuracy / Performance", client.modelAccuracy || "—"],
    ["False Positive / Rejection Rate", client.falsePositiveRate || "—"],
    ["Last Evaluation Date",   client.lastEvaluationDate || "—"],
    ["Evaluation Method",      client.evaluationMethod || "—"],
    [],
    ["SECTION 6 — KNOWN LIMITATIONS (Cl. 8.2)"],
    [client.knownLimitations || "—"],
  ]);
  ws1["!cols"] = [{ wch: 32 }, { wch: 80 }];
  XLSX.utils.book_append_sheet(wb, ws1, "AIIA — System Profile");

  // Sheet 2: Stakeholder Consultation (Cl. 8.2)
  const stakeholders: StakeholderEntry[] = client.stakeholders || [];
  const ws2 = XLSX.utils.aoa_to_sheet([
    ["SECTION 7 — STAKEHOLDER CONSULTATION LOG (Cl. 8.2)"],
    [],
    ["Name", "Role", "Organisation", "Consulted", "Consultation Date", "Notes"],
    ...stakeholders.map(s => [s.name, s.role, s.organisation, s.consulted ? "Yes" : "Pending", s.consultationDate || "—", s.notes]),
    ...(stakeholders.length === 0 ? [["No stakeholders recorded"]] : []),
  ]);
  ws2["!cols"] = [{ wch: 24 }, { wch: 24 }, { wch: 28 }, { wch: 10 }, { wch: 18 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, ws2, "Stakeholder Consultation");

  // Sheet 3: Impact Assessment (Phase 2 FRIA + societal impact)
  const friaAreaIdx = 5; // Area 6 in EU AI Act = index 5
  const friaGuide = (IMPLEMENTATION_GUIDES as Record<string, any>)["eu-ai-act"];
  const friaState = friaGuide ? loadArea(client.id, "eu-ai-act", friaAreaIdx) : null;
  const impactRows: any[][] = [
    ["SECTION 8 — IMPACT ASSESSMENT (Cl. 6.1 / Cl. 8.2 / Art. 27)"],
    [],
    ["Frameworks in Scope", client.activePolicies.map(id => POLICY_STUBS.find(p => p.id === id)?.name || id).join(", ")],
    [],
    ["Fundamental Rights Impact Assessment (FRIA) — EU AI Act Art. 27"],
    [],
  ];
  if (friaGuide && friaState) {
    friaGuide.areas[friaAreaIdx]?.questions?.forEach((q: string, qi: number) => {
      const qs = friaState.questions[qi];
      impactRows.push([`Q${qi + 1}: ${q}`, ""]);
      impactRows.push(["Status", qs?.status || "Not Started"]);
      impactRows.push(["Current State", qs?.currentState || "—"]);
      impactRows.push(["Gap / Finding", qs?.gap || "—"]);
      impactRows.push(["Proposed Action", qs?.proposedAction || "—"]);
      impactRows.push([]);
    });
  } else {
    impactRows.push(["No EU AI Act FRIA area data found. Complete Phase 2 questionnaire first."]);
  }
  const ws3 = XLSX.utils.aoa_to_sheet(impactRows);
  ws3["!cols"] = [{ wch: 40 }, { wch: 80 }];
  XLSX.utils.book_append_sheet(wb, ws3, "Impact Assessment");

  // Sheet 4: Risk Register (Phase 3)
  const rrRows: any[][] = [
    ["SECTION 9 — RISK REGISTER (Cl. 6.1 / Cl. 8)"],
    [],
    ["Risk ID", "Category", "Description", "Inherent Level", "Residual Level", "Controls", "Recommendation", "Owner", "Due Date", "Status"],
  ];
  risks.forEach(r => rrRows.push([
    r.riskId,
    r.riskCategory,
    r.description,
    riskLevel(r.inherentLikelihood, r.inherentImpact),
    riskLevel(r.residualLikelihood, r.residualImpact),
    r.controls.map(c => `[${c.type}] ${c.description} (${c.status})`).join(" | ") || "None",
    r.recommendation,
    r.owner,
    r.dueDate,
    r.status,
  ]));
  if (risks.length === 0) rrRows.push(["No risks recorded. Complete Phase 3 Risk Register first."]);
  const ws4 = XLSX.utils.aoa_to_sheet(rrRows);
  ws4["!cols"] = [{ wch: 10 }, { wch: 28 }, { wch: 50 }, { wch: 14 }, { wch: 14 }, { wch: 60 }, { wch: 60 }, { wch: 20 }, { wch: 12 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, ws4, "Risk Register");

  // Sheet 5: Controls & Mitigations
  const ctrlRows: any[][] = [["SECTION 10 — CONTROLS & MITIGATIONS (Cl. 8 / Annex A)"], [], ["Risk ID", "Control Type", "Description", "Owner", "Status", "Effectiveness"]];
  risks.forEach(r => r.controls.forEach(c => ctrlRows.push([r.riskId, c.type, c.description, c.owner, c.status, c.effectiveness || "Not Assessed"])));
  if (ctrlRows.length === 3) ctrlRows.push(["No controls recorded."]);
  const ws5 = XLSX.utils.aoa_to_sheet(ctrlRows);
  ws5["!cols"] = [{ wch: 10 }, { wch: 14 }, { wch: 60 }, { wch: 24 }, { wch: 22 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, ws5, "Controls");

  XLSX.writeFile(wb, `AIIA_${client.aiSystemName || client.name}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// ─── PROGRESS HELPERS ─────────────────────────────────────────────────────────
function getPolicyProgress(clientId: string, policyId: string) {
  const guide = IMPLEMENTATION_GUIDES[policyId];
  if (!guide) return { pct: 0, done: 0, total: 0 };
  let total = 0, done = 0;
  guide.areas.forEach((area, ai) => {
    const st = loadArea(clientId, policyId, ai);
    area.questions.forEach((_q, qi) => {
      const s = st.questions[qi]?.status;
      if (s === "Not Applicable") return;
      total++;
      if (s === "Complete") done++;
    });
  });
  return { pct: total ? Math.round((done / total) * 100) : 0, done, total };
}

function getAreaProgress(clientId: string, policyId: string, areaIdx: number, questions: string[]) {
  const st = loadArea(clientId, policyId, areaIdx);
  let total = 0, done = 0, touched = 0;
  questions.forEach((_q, qi) => {
    const qs = st.questions[qi];
    const s = qs?.status;
    if (s === "Not Applicable") return;
    total++;
    if (s === "Complete") done++;
    else if (s === "In Progress" || s === "On Hold" || qs?.currentState || qs?.gap || qs?.proposedAction) touched++;
  });
  return { pct: total ? Math.round((done / total) * 100) : 0, done, touched, total };
}

// ─── SHARED UI ────────────────────────────────────────────────────────────────
function ProgressBar({ pct, color = "#6366f1" }: { pct: number; color?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: "#e2e8f0", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: pct === 100 ? "#15803d" : color, borderRadius: 99, transition: "width 0.3s" }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color: pct === 100 ? "#15803d" : "#64748b", minWidth: 32 }}>{pct}%</span>
    </div>
  );
}

function SignOffBadge({ status }: { status: SignOffStatus }) {
  const cfg = SIGN_OFF_CONFIG[status] || SIGN_OFF_CONFIG["Pending"];
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}`, whiteSpace: "nowrap" }}>
      {cfg.icon} {status}
    </span>
  );
}

function Breadcrumb({ items }: { items: { label: string; onClick?: () => void }[] }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#64748b", flexWrap: "wrap" }}>
      {items.map((item, i) => (
        <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {i > 0 && <span style={{ color: "#cbd5e1" }}>›</span>}
          {item.onClick
            ? <button onClick={item.onClick} style={{ background: "none", border: "none", cursor: "pointer", color: "#6366f1", fontWeight: 600, fontSize: 13, padding: 0 }}>{item.label}</button>
            : <span style={{ color: "#0f172a", fontWeight: 600 }}>{item.label}</span>}
        </span>
      ))}
    </div>
  );
}

// Merge country + industry suggestions, taking highest level when both reference same policy
const LEVEL_RANK: Record<SuggestionLevel, number> = { Required: 3, Recommended: 2, Consider: 1 };
function mergeSuggestions(countrySugs: Suggestion[], industrySugs: Suggestion[]): Suggestion[] {
  const map = new Map<string, Suggestion>();
  [...countrySugs, ...industrySugs].forEach(s => {
    const existing = map.get(s.id);
    if (!existing || LEVEL_RANK[s.level] > LEVEL_RANK[existing.level]) map.set(s.id, s);
  });
  return [...map.values()];
}

// ─── NEW CLIENT FORM ──────────────────────────────────────────────────────────
function NewClientForm({ onAdd, onCancel }: { onAdd: (c: Client) => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [countries, setCountries] = useState<string[]>([]);
  const [industry, setIndustry] = useState("");
  const [customIndustry, setCustomIndustry] = useState("");
  const [geography, setGeography] = useState("");
  const [primaryAiUseCase, setPrimaryAiUseCase] = useState("");
  const [contactName, setContactName] = useState("");
  const [engagementType, setEngagementType] = useState<EngagementType>("");
  const [aboutClient, setAboutClient] = useState("");
  const [selectedPolicies, setSelectedPolicies] = useState<Set<string>>(new Set());
  const [showScope, setShowScope] = useState(false);

  const isOther = industry === "Other (specify below)";
  const effectiveIndustry = isOther ? customIndustry.trim() : industry;

  // Merge suggestions across all selected countries, then merge with industry
  let countrySugs: Suggestion[] = [];
  countries.forEach(c => { countrySugs = mergeSuggestions(countrySugs, COUNTRY_SUGGESTIONS[c] || []); });
  const industrySugs = (!isOther && INDUSTRY_SUGGESTIONS[industry]) ? INDUSTRY_SUGGESTIONS[industry] : [];
  const suggestions = mergeSuggestions(countrySugs, industrySugs);
  const suggestedIds = new Set(suggestions.map(s => s.id));
  const otherPolicies = POLICY_STUBS.filter(p => !suggestedIds.has(p.id));

  useEffect(() => {
    if (countries.length === 0 && (!industry || isOther)) { setSelectedPolicies(new Set()); return; }
    let cSugs: Suggestion[] = [];
    countries.forEach(c => { cSugs = mergeSuggestions(cSugs, COUNTRY_SUGGESTIONS[c] || []); });
    const iSugs = (!isOther && INDUSTRY_SUGGESTIONS[industry]) ? INDUSTRY_SUGGESTIONS[industry] : [];
    const merged = mergeSuggestions(cSugs, iSugs);
    setSelectedPolicies(new Set(merged.filter(s => s.level === "Required").map(s => s.id)));
  }, [countries.join(","), industry]);

  const toggleCountry = (c: string) =>
    setCountries(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);

  const togglePolicy = (id: string) =>
    setSelectedPolicies(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const submit = () => {
    if (!name.trim() || countries.length === 0) return;
    onAdd({
      id: crypto.randomUUID(),
      name: name.trim(), countries, industry: effectiveIndustry || "(not specified)",
      geography, primaryAiUseCase, contactName, engagementType, aboutClient,
      signOffStatus: "Pending",
      status: "active",
      createdAt: new Date().toISOString().slice(0, 10),
      activePolicies: [...selectedPolicies],
    });
  };

  const canSubmit = !!name.trim() && countries.length > 0;

  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 28, marginBottom: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.07)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={onCancel} style={{ background: "none", border: "1px solid #e2e8f0", borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#64748b", display: "flex", alignItems: "center", gap: 5 }}>
          ← Back to Clients
        </button>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#0f172a" }}>New Client</h3>
      </div>

      {/* Step 1: Name + Countries (required) */}
      <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "16px 18px", marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Step 1 — Client details</div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 6 }}>Client / Organisation Name *</label>
          <input autoFocus value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()}
            placeholder="e.g. Apex Capital"
            style={{ width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 8 }}>
            Country / Jurisdiction * <span style={{ fontSize: 11, fontWeight: 400, color: "#94a3b8" }}>— select all that apply</span>
            {countries.length > 0 && <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, color: "#6366f1" }}>{countries.length} selected</span>}
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 6 }}>
            {COUNTRY_OPTIONS.map(opt => {
              const checked = countries.includes(opt);
              return (
                <label key={opt} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", border: `1px solid ${checked ? "#a5b4fc" : "#e2e8f0"}`, borderRadius: 8, cursor: "pointer", background: checked ? "#eef2ff" : "#fff", fontSize: 12, fontWeight: checked ? 600 : 400, color: checked ? "#4f46e5" : "#334155", transition: "all 0.12s" }}>
                  <input type="checkbox" checked={checked} onChange={() => toggleCountry(opt)} style={{ accentColor: "#6366f1", width: 13, height: 13, cursor: "pointer", flexShrink: 0 }} />
                  {opt}
                </label>
              );
            })}
          </div>
        </div>
      </div>

      {/* Step 2: Industry (optional refinement) */}
      {countries.length > 0 && (
        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "16px 18px", marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Step 2 — Industry <span style={{ fontSize: 10, fontWeight: 500, color: "#94a3b8", textTransform: "none" }}>(optional — refines framework suggestions)</span></div>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <div style={{ flex: 1.5, minWidth: 200 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 6 }}>Industry</label>

              <select value={industry} onChange={e => setIndustry(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, background: "#fff", boxSizing: "border-box" }}>
                <option value="">Select industry…</option>
                {INDUSTRY_OPTIONS.map(i => <option key={i}>{i}</option>)}
              </select>
            </div>
          </div>
          {isOther && (
            <div style={{ marginTop: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 6 }}>Specify Industry</label>
              <input value={customIndustry} onChange={e => setCustomIndustry(e.target.value)} placeholder="Enter your industry…"
                style={{ width: "100%", maxWidth: 400, padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
            </div>
          )}
        </div>
      )}

      {/* Optional scope fields */}
      {countries.length > 0 && (
        <details open={showScope} onToggle={e => setShowScope((e.target as HTMLDetailsElement).open)} style={{ marginBottom: 16 }}>
          <summary style={{ fontSize: 12, fontWeight: 600, color: "#6366f1", cursor: "pointer", listStyle: "none", display: "flex", alignItems: "center", gap: 6, marginBottom: showScope ? 14 : 0 }}>
            <span>{showScope ? "▾" : "▸"}</span> Add scope details (optional — geography, AI use case, contact)
          </summary>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 14 }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 6 }}>Geography / Region</label>
              <input value={geography} onChange={e => setGeography(e.target.value)} placeholder="e.g. EU, UK, US, APAC"
                style={{ width: "100%", padding: "8px 11px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ flex: 2, minWidth: 220 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 6 }}>Primary AI Use Case</label>
              <input value={primaryAiUseCase} onChange={e => setPrimaryAiUseCase(e.target.value)} placeholder="e.g. Credit scoring, clinical decision support…"
                style={{ width: "100%", padding: "8px 11px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 6 }}>Client Contact</label>
              <input value={contactName} onChange={e => setContactName(e.target.value)} placeholder="Name / role"
                style={{ width: "100%", padding: "8px 11px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 6 }}>Engagement Type</label>
              <select value={engagementType} onChange={e => setEngagementType(e.target.value as EngagementType)}
                style={{ width: "100%", padding: "8px 11px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, background: "#fff", boxSizing: "border-box" }}>
                {ENGAGEMENT_TYPES.map(t => <option key={t} value={t}>{t || "Select…"}</option>)}
              </select>
            </div>
            <div style={{ flex: "0 0 100%", minWidth: 0 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 6 }}>About this Client</label>
              <textarea value={aboutClient} onChange={e => setAboutClient(e.target.value)} rows={3}
                placeholder="Brief context about the organisation, their AI maturity, scope of engagement, key stakeholders…"
                style={{ width: "100%", padding: "8px 11px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }} />
            </div>
          </div>
        </details>
      )}

      {/* Step 3: Framework suggestions */}
      {countries.length > 0 && suggestions.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
            Step 3 — Applicable frameworks
            <span style={{ fontSize: 10, fontWeight: 500, color: "#94a3b8", textTransform: "none", marginLeft: 8 }}>based on {countries.join(", ")}{industry && !isOther ? ` · ${industry}` : ""} — tick or untick to adjust</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 10 }}>
            {suggestions.map(s => {
              const stub = POLICY_STUBS.find(p => p.id === s.id)!;
              const scfg = SUGGESTION_CONFIG[s.level];
              const checked = selectedPolicies.has(s.id);
              return (
                <label key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 14px", border: `1px solid ${checked ? stub.border : "#e2e8f0"}`, borderRadius: 10, cursor: "pointer", background: checked ? stub.bg : "#fff", transition: "all 0.15s" }}>
                  <input type="checkbox" checked={checked} onChange={() => togglePolicy(s.id)} style={{ width: 15, height: 15, accentColor: stub.color, cursor: "pointer" }} />
                  <span style={{ fontSize: 17 }}>{stub.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{stub.name}</span>
                    <span style={{ fontSize: 11, color: "#64748b", marginLeft: 8 }}>{s.reason}</span>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: scfg.bg, color: scfg.text, border: `1px solid ${scfg.border}`, whiteSpace: "nowrap" }}>{s.level}</span>
                </label>
              );
            })}
          </div>
          {otherPolicies.length > 0 && (
            <details>
              <summary style={{ fontSize: 12, fontWeight: 600, color: "#64748b", cursor: "pointer", listStyle: "none", display: "flex", alignItems: "center", gap: 5 }}>
                <span>▸</span> Add other frameworks
              </summary>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                {otherPolicies.map(stub => {
                  const checked = selectedPolicies.has(stub.id);
                  return (
                    <label key={stub.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", border: `1px solid ${checked ? stub.border : "#e2e8f0"}`, borderRadius: 8, cursor: "pointer", background: checked ? stub.bg : "#f8fafc", fontSize: 12 }}>
                      <input type="checkbox" checked={checked} onChange={() => togglePolicy(stub.id)} style={{ accentColor: stub.color }} />
                      <span>{stub.emoji}</span>
                      <span style={{ fontWeight: 600, color: stub.color }}>{stub.name}</span>
                    </label>
                  );
                })}
              </div>
            </details>
          )}
        </div>
      )}

      {countries.length > 0 && suggestions.length === 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>Select applicable frameworks</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {POLICY_STUBS.map(stub => {
              const checked = selectedPolicies.has(stub.id);
              return (
                <label key={stub.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", border: `1px solid ${checked ? stub.border : "#e2e8f0"}`, borderRadius: 8, cursor: "pointer", background: checked ? stub.bg : "#f8fafc", fontSize: 12 }}>
                  <input type="checkbox" checked={checked} onChange={() => togglePolicy(stub.id)} style={{ accentColor: stub.color }} />
                  <span>{stub.emoji}</span>
                  <span style={{ fontWeight: 600, color: stub.color }}>{stub.name}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, borderTop: "1px solid #f1f5f9", paddingTop: 16 }}>
        <button onClick={submit} disabled={!canSubmit}
          style={{ background: canSubmit ? "#0f172a" : "#e2e8f0", color: canSubmit ? "#fff" : "#94a3b8", border: "none", borderRadius: 8, padding: "9px 20px", cursor: canSubmit ? "pointer" : "default", fontSize: 13, fontWeight: 700 }}>
          Create Client →
        </button>
        <button onClick={onCancel} style={{ background: "#f1f5f9", color: "#64748b", border: "none", borderRadius: 8, padding: "9px 14px", cursor: "pointer", fontSize: 13 }}>Cancel</button>
      </div>
    </div>
  );
}

// ─── VIEW 1: CLIENT LIST (grouped by industry) ────────────────────────────────
function ClientListView({ onSelectClient, onOpenWorkbook }: {
  onSelectClient: (c: Client) => void;
  onOpenWorkbook: (c: Client, policyId: string) => void;
}) {
  const [clients, setClients] = useState<Client[]>(loadClients);
  const [showAddForm, setShowAddForm] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<ClientStatus | "all">("active");
  const importRef = useRef<HTMLInputElement>(null);

  const addClient = (client: Client) => {
    const updated = [...clients, client];
    saveClients(updated); setClients(updated); setShowAddForm(false);
  };
  const removeClient = (id: string) => {
    if (!confirm("Permanently delete this client and all their discovery data?")) return;
    const updated = clients.filter(c => c.id !== id);
    saveClients(updated); setClients(updated);
  };
  const setClientStatus = (id: string, status: ClientStatus) => {
    const updated = clients.map(c => c.id === id ? { ...c, status } : c);
    saveClients(updated); setClients(updated);
  };
  const toggleIndustry = (ind: string) =>
    setCollapsed(prev => { const n = new Set(prev); n.has(ind) ? n.delete(ind) : n.add(ind); return n; });

  // Filter and group by industry
  const visibleClients = statusFilter === "all" ? clients : clients.filter(c => (c.status || "active") === statusFilter);
  const byIndustry: Record<string, Client[]> = {};
  visibleClients.forEach(c => { (byIndustry[c.industry] = byIndustry[c.industry] || []).push(c); });

  const statusCounts = {
    active: clients.filter(c => (c.status || "active") === "active").length,
    archived: clients.filter(c => c.status === "archived").length,
    hidden: clients.filter(c => c.status === "hidden").length,
  };

  return (
    <div style={{ maxWidth: 940, margin: "0 auto", padding: "32px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#0f172a" }}>AI Risk Assessment</h2>
          <p style={{ margin: "6px 0 0", fontSize: 14, color: "#64748b" }}>Discovery workbooks, progress, and notes saved locally. Export JSON to back up.</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {clients.length > 0 && (
            <>
              <button onClick={() => { seedDemoClient(); seedMediScanClient(); setClients(loadClients()); }}
                style={{ background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                🎯 Load Demos
              </button>
              <button onClick={exportBackupJSON}
                style={{ background: "#f1f5f9", color: "#0f172a", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                ⬇ Export Backup
              </button>
              <input ref={importRef} type="file" accept=".json" style={{ display: "none" }}
                onChange={e => { const f = e.target.files?.[0]; if (f) importBackupJSON(f, () => setClients(loadClients())); e.target.value = ""; }} />
              <button onClick={() => importRef.current?.click()}
                style={{ background: "#f1f5f9", color: "#0f172a", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                ⬆ Restore Backup
              </button>
            </>
          )}
          {!showAddForm && (
            <button onClick={() => setShowAddForm(true)}
              style={{ background: "#0f172a", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
              + New Client
            </button>
          )}
        </div>
      </div>

      {showAddForm && <NewClientForm onAdd={addClient} onCancel={() => setShowAddForm(false)} />}

      {/* Status filter tabs */}
      {clients.length > 0 && (
        <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
          {([["active", "Active", statusCounts.active], ["archived", "Archived", statusCounts.archived], ["hidden", "Hidden", statusCounts.hidden]] as [ClientStatus, string, number][]).map(([val, label, count]) => (
            <button key={val} onClick={() => setStatusFilter(val)}
              style={{ padding: "6px 14px", border: `1px solid ${statusFilter === val ? "#6366f1" : "#e2e8f0"}`, borderRadius: 20, fontSize: 12, fontWeight: statusFilter === val ? 700 : 500, background: statusFilter === val ? "#eef2ff" : "#fff", color: statusFilter === val ? "#4f46e5" : "#64748b", cursor: "pointer" }}>
              {label} {count > 0 && <span style={{ fontSize: 10, background: statusFilter === val ? "#c7d2fe" : "#f1f5f9", borderRadius: 10, padding: "1px 6px", marginLeft: 4 }}>{count}</span>}
            </button>
          ))}
        </div>
      )}

      {clients.length === 0 && !showAddForm ? (
        <div style={{ textAlign: "center", padding: "64px 0", color: "#94a3b8" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No clients yet</div>
          <div style={{ fontSize: 14, marginBottom: 24 }}>Add your first client to start a discovery workbook.</div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <button onClick={() => { seedDemoClient(); seedMediScanClient(); setClients(loadClients()); }}
              style={{ background: "#eef2ff", color: "#4f46e5", border: "1px solid #a5b4fc", borderRadius: 10, padding: "12px 28px", cursor: "pointer", fontSize: 14, fontWeight: 700 }}>
              🎯 Load Demo Clients
            </button>
            <div style={{ fontSize: 12, color: "#94a3b8", maxWidth: 360 }}>
              Loads two pre-populated demo clients: Apex Lending Group (EU AI Act · Fintech) and MediScan Diagnostics Group (NIST AI RMF · Healthcare), so you can explore all workbook phases immediately.
            </div>
          </div>
        </div>
      ) : visibleClients.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: "#94a3b8", background: "#f8fafc", borderRadius: 12, border: "1px dashed #e2e8f0" }}>
          <div style={{ fontSize: 14 }}>No {statusFilter} clients.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {Object.entries(byIndustry).map(([industry, industryClients]) => {
            const isCollapsed = collapsed.has(industry);
            return (
              <div key={industry}>
                {/* Industry group header */}
                <button onClick={() => toggleIndustry(industry)}
                  style={{ width: "100%", background: "none", border: "none", padding: "8px 0", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", borderBottom: "2px solid #e2e8f0", marginBottom: 12 }}>
                  <span style={{ fontSize: 13, color: "#94a3b8" }}>{isCollapsed ? "▸" : "▾"}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em" }}>{industry}</span>
                  <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>({industryClients.length} client{industryClients.length !== 1 ? "s" : ""})</span>
                  {(INDUSTRY_SUGGESTIONS[industry] || []).filter(s => s.level === "Required" || s.level === "Recommended").map(s => {
                    const stub = POLICY_STUBS.find(p => p.id === s.id);
                    if (!stub) return null;
                    return (
                      <span key={s.id} style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 5, background: stub.bg, color: stub.color, border: `1px solid ${stub.border}` }}>
                        {stub.emoji} {stub.name}
                      </span>
                    );
                  })}
                </button>

                {!isCollapsed && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {industryClients.map(client => {
                      const totalPct = client.activePolicies.length
                        ? Math.round(client.activePolicies.reduce((sum, pid) => sum + getPolicyProgress(client.id, pid).pct, 0) / client.activePolicies.length)
                        : 0;
                      const isArchived = client.status === "archived";
                      const isHidden = client.status === "hidden";
                      return (
                        <div key={client.id} style={{ background: "#fff", border: `1px solid ${isArchived ? "#fed7aa" : isHidden ? "#e9d5ff" : "#e2e8f0"}`, borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.04)", opacity: isArchived || isHidden ? 0.85 : 1 }}>
                          <div style={{ background: isArchived ? "#7c3aed" : isHidden ? "#475569" : "#0f172a", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                              <div>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <span style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>{client.name}</span>
                                  {isArchived && <span style={{ fontSize: 10, background: "#ddd6fe", color: "#5b21b6", borderRadius: 4, padding: "1px 6px", fontWeight: 700 }}>ARCHIVED</span>}
                                  {isHidden && <span style={{ fontSize: 10, background: "#e2e8f0", color: "#475569", borderRadius: 4, padding: "1px 6px", fontWeight: 700 }}>HIDDEN</span>}
                                </div>
                                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                                  {[(client.countries || []).join(", "), client.geography, client.engagementType, `Added ${client.createdAt}`].filter(Boolean).join(" · ")}
                                </div>
                              </div>
                            </div>
                            {/* Framework progress pills + sign-off badge */}
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                              <SignOffBadge status={client.signOffStatus} />
                              {client.activePolicies.map(pid => {
                                const stub = POLICY_STUBS.find(p => p.id === pid);
                                const { pct } = getPolicyProgress(client.id, pid);
                                return stub ? (
                                  <span key={pid} style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: stub.bg, color: stub.color, border: `1px solid ${stub.border}` }}>
                                    {stub.emoji} {pct}%
                                  </span>
                                ) : null;
                              })}
                              {client.activePolicies.length === 0 && <span style={{ fontSize: 11, color: "#64748b", fontStyle: "italic" }}>No frameworks</span>}
                            </div>
                            <div style={{ display: "flex", gap: 6 }}>
                              {(isArchived || isHidden) ? (
                                <button onClick={() => setClientStatus(client.id, "active")} title="Restore to active"
                                  style={{ background: "#fff", color: "#15803d", border: "1px solid #bbf7d0", borderRadius: 7, padding: "6px 12px", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>↩ Restore</button>
                              ) : (
                                <>
                                  <button onClick={() => {
                                    const guideEnabled = client.activePolicies.filter(pid => POLICY_STUBS.find(p => p.id === pid)?.hasGuide);
                                    if (guideEnabled.length === 1) onOpenWorkbook(client, guideEnabled[0]);
                                    else onSelectClient(client);
                                  }} style={{ background: "#fff", color: "#0f172a", border: "none", borderRadius: 7, padding: "6px 14px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Open →</button>
                                  <button onClick={() => setClientStatus(client.id, "archived")} title="Archive client"
                                    style={{ background: "transparent", color: "#a78bfa", border: "1px solid #334155", borderRadius: 7, padding: "6px 9px", cursor: "pointer", fontSize: 11 }}>🗄</button>
                                  <button onClick={() => setClientStatus(client.id, "hidden")} title="Hide client"
                                    style={{ background: "transparent", color: "#94a3b8", border: "1px solid #334155", borderRadius: 7, padding: "6px 9px", cursor: "pointer", fontSize: 11 }}>👁</button>
                                </>
                              )}
                              <button onClick={() => removeClient(client.id)} title="Delete permanently" style={{ background: "transparent", color: "#f87171", border: "1px solid #334155", borderRadius: 7, padding: "6px 9px", cursor: "pointer", fontSize: 12 }}>✕</button>
                            </div>
                          </div>
                          {/* Overall progress bar */}
                          {client.activePolicies.length > 0 && (
                            <div style={{ padding: "10px 20px" }}>
                              <ProgressBar pct={totalPct} color="#6366f1" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── TOOLTIP ─────────────────────────────────────────────────────────────────
function Tip({ text, children, width = 240 }: { text: string; children: React.ReactNode; width?: number }) {
  const [show, setShow] = useState(false);
  return (
    <span style={{ position: "relative", display: "inline-flex", alignItems: "center" }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <span style={{
          position: "absolute", bottom: "calc(100% + 8px)", left: "50%",
          transform: "translateX(-50%)", background: "#0f172a", color: "#e2e8f0",
          padding: "9px 13px", borderRadius: 8, fontSize: 11, lineHeight: 1.65,
          width, zIndex: 9999, boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          pointerEvents: "none", whiteSpace: "normal",
        }}>
          {text}
          <span style={{ position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)", borderWidth: 5, borderStyle: "solid", borderColor: "#0f172a transparent transparent transparent" }} />
        </span>
      )}
    </span>
  );
}

// ─── PHASE NAVIGATION ────────────────────────────────────────────────────────
const PHASES = [
  { num: 1, label: "Govern & Scope",       sub: "System info · Frameworks",        built: true  },
  { num: 2, label: "Map & Discover",       sub: "Gap assessment · Questionnaire",  built: true  },
  { num: 3, label: "Measure & Assess",     sub: "Risk register · Scoring",         built: true  },
  { num: 4, label: "Report & Recommend",   sub: "Findings · Exec summary",         built: true  },
  { num: 5, label: "Monitor",              sub: "Ongoing review · Drift tracking", built: true  },
];

function PhaseNav({ activePhase, onPhaseClick }: { activePhase: number | null; onPhaseClick: (n: number) => void }) {
  return (
    <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px 20px", marginBottom: 24, overflowX: "auto" }}>
      <div style={{ display: "flex", gap: 0, minWidth: 560 }}>
        {PHASES.map((ph, idx) => {
          const isActive = ph.num === activePhase;
          const isDone = activePhase !== null && ph.num < activePhase;
          const isLocked = !ph.built;
          return (
            <div key={ph.num} style={{ display: "flex", alignItems: "center", flex: 1 }}>
              <button onClick={() => ph.built && onPhaseClick(ph.num)}
                style={{ flex: 1, background: isActive ? "#0f172a" : isDone ? "#f0fdf4" : "#fff", border: `1px solid ${isActive ? "#0f172a" : isDone ? "#bbf7d0" : "#e2e8f0"}`, borderRadius: 10, padding: "10px 12px", cursor: ph.built ? "pointer" : "default", textAlign: "left", opacity: isLocked && !isActive ? 0.6 : 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                  <span style={{ width: 20, height: 20, borderRadius: "50%", background: isActive ? "#6366f1" : isDone ? "#15803d" : "#e2e8f0", color: isActive || isDone ? "#fff" : "#94a3b8", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {isDone ? "✓" : ph.num}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: isActive ? "#fff" : isDone ? "#15803d" : "#475569" }}>{ph.label}</span>
                  {isLocked && <span style={{ fontSize: 9, background: "#e2e8f0", color: "#94a3b8", borderRadius: 4, padding: "1px 5px", fontWeight: 700 }}>SOON</span>}
                </div>
                <div style={{ fontSize: 10, color: isActive ? "#a5b4fc" : "#94a3b8", paddingLeft: 27 }}>{ph.sub}</div>
              </button>
              {idx < PHASES.length - 1 && (
                <div style={{ width: 20, height: 1, background: "#e2e8f0", flexShrink: 0 }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── AI SYSTEM PROFILE FORM ───────────────────────────────────────────────────
const AI_TYPES: AIType[] = ["Machine Learning", "Natural Language Processing", "Computer Vision", "Generative AI", "Robotic Process Automation", "Automation / Rules-Based", "Other"];
const DECISION_AUTHORITY_OPTIONS: { value: DecisionAuthority; label: string; desc: string }[] = [
  { value: "",                    label: "Select…",              desc: "" },
  { value: "Fully Autonomous",    label: "Fully Autonomous",     desc: "AI makes decisions and takes action without any human review." },
  { value: "Human-in-the-Loop",   label: "Human-in-the-Loop",   desc: "A human reviews and approves every AI decision before it is actioned." },
  { value: "Human-on-the-Loop",   label: "Human-on-the-Loop",   desc: "AI acts autonomously but a human monitors and can intervene or override." },
  { value: "Advisory Only",       label: "Advisory Only",       desc: "AI provides recommendations only. A human always makes the final decision." },
];
const DEPLOYMENT_STATUS_OPTIONS: DeploymentStatus[] = ["", "Planning", "Development", "Pilot / Testing", "Production", "Decommissioning"];
const MODEL_OWNERSHIP_OPTIONS: ModelOwnership[] = ["", "Built In-House", "Third-Party Vendor", "Open Source", "Hybrid"];

function FieldLabel({ label, tip, required }: { label: string; tip?: string; required?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>{label}{required && <span style={{ color: "#dc2626", marginLeft: 2 }}>*</span>}</span>
      {tip && (
        <Tip text={tip} width={260}>
          <span style={{ fontSize: 12, color: "#94a3b8", cursor: "help" }}>ⓘ</span>
        </Tip>
      )}
    </div>
  );
}

function FieldHelper({ text }: { text: string }) {
  return <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4, lineHeight: 1.5 }}>{text}</div>;
}

function AISystemProfileForm({ client, onSave }: { client: Client; onSave: (patch: Partial<Client>) => void }) {
  const [form, setForm] = useState({
    aiSystemName:           client.aiSystemName || "",
    aiTypes:                client.aiTypes || [] as AIType[],
    systemDescription:      client.systemDescription || "",
    vendor:                 client.vendor || "",
    modelOwnership:         client.modelOwnership || "" as ModelOwnership,
    decisionAuthority:      client.decisionAuthority || "" as DecisionAuthority,
    deploymentStatus:       client.deploymentStatus || "" as DeploymentStatus,
    timeInProduction:       client.timeInProduction || "",
    decisionsPerPeriod:     client.decisionsPerPeriod || "",
    internalUsersAffected:  client.internalUsersAffected || "",
    externalUsersAffected:  client.externalUsersAffected || "",
    trainingDataSource:     client.trainingDataSource || "",
    trainingDataPeriod:     client.trainingDataPeriod || "",
    lastRetrainingDate:     client.lastRetrainingDate || "",
    modelAccuracy:          client.modelAccuracy || "",
    falsePositiveRate:      client.falsePositiveRate || "",
    lastEvaluationDate:     client.lastEvaluationDate || "",
    evaluationMethod:       client.evaluationMethod || "",
    knownLimitations:       client.knownLimitations || "",
  });
  const [stakeholders, setStakeholders] = useState<StakeholderEntry[]>(client.stakeholders || []);
  const [saved, setSaved] = useState(false);

  const set = (k: string, v: any) => { setForm(f => ({ ...f, [k]: v })); setSaved(false); };
  const toggleAiType = (t: AIType) => set("aiTypes", form.aiTypes.includes(t) ? form.aiTypes.filter(x => x !== t) : [...form.aiTypes, t]);

  const addStakeholder = () => setStakeholders(prev => [...prev, { id: crypto.randomUUID(), name: "", role: "", organisation: client.name, consulted: false, consultationDate: "", notes: "" }]);
  const updateStakeholder = (id: string, patch: Partial<StakeholderEntry>) => setStakeholders(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
  const removeStakeholder = (id: string) => setStakeholders(prev => prev.filter(s => s.id !== id));

  const save = () => { onSave({ ...form, stakeholders }); setSaved(true); setTimeout(() => setSaved(false), 3000); };

  const inp = (style?: any) => ({ width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" as const, background: "#fff", ...style });
  const sel = { ...inp(), appearance: "auto" as const };

  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 24, marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>Phase 1 — AI System Profile</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Document the AI system being assessed. Complete as much as possible — every field helps ensure your compliance analysis is accurate.</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {saved && <span style={{ fontSize: 11, color: "#15803d", fontWeight: 600 }}>✓ Saved</span>}
          <button onClick={save} style={{ background: "#0f172a", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>Save Profile</button>
        </div>
      </div>

      {/* System Identity */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14, paddingBottom: 6, borderBottom: "1px solid #e2e8f0" }}>System Identity</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <FieldLabel label="AI System Name" required tip="The commercial or internal name of the AI system being assessed. If third-party, use the vendor's product name." />
            <input value={form.aiSystemName} onChange={e => set("aiSystemName", e.target.value)} placeholder="e.g. HireRight AI, CreditSense v3, ChatBot Pro" style={inp()} />
          </div>
          <div>
            <FieldLabel label="Vendor / Supplier" tip="Name of the company that built or supplies this AI system. Leave blank if built entirely in-house." />
            <input value={form.vendor} onChange={e => set("vendor", e.target.value)} placeholder="e.g. HireRight Inc. — leave blank if in-house" style={inp()} />
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <FieldLabel label="AI Type" required tip="Select all that apply. This determines which regulatory obligations and risk categories are relevant." />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
            {AI_TYPES.map(t => {
              const checked = form.aiTypes.includes(t);
              return (
                <label key={t} style={{ display: "flex", alignItems: "center", gap: 7, padding: "6px 12px", border: `1px solid ${checked ? "#6366f1" : "#e2e8f0"}`, borderRadius: 8, cursor: "pointer", background: checked ? "#eef2ff" : "#f8fafc", fontSize: 12, fontWeight: checked ? 700 : 500, color: checked ? "#4f46e5" : "#475569" }}>
                  <input type="checkbox" checked={checked} onChange={() => toggleAiType(t)} style={{ accentColor: "#6366f1" }} />
                  {t}
                </label>
              );
            })}
          </div>
          <FieldHelper text="Generative AI = LLMs, image/text generators. Machine Learning = predictive models, classifiers. Rules-Based = decision trees, scoring engines." />
        </div>
        <div style={{ marginTop: 16 }}>
          <FieldLabel label="System Description" required tip="Describe what the system does, how it works at a high level, and what business problem it solves. Be specific — vague descriptions lead to incomplete risk assessments." />
          <textarea value={form.systemDescription} onChange={e => set("systemDescription", e.target.value)}
            placeholder="What does it do? (e.g. Automatically screens job applications and ranks candidates) — How does it work? (e.g. ML model trained on 5 years of hiring data, scores applications 0–100) — Business problem it solves? (e.g. Reduces manual screening time for 15,000 applications per quarter)"
            rows={4} style={{ ...inp(), resize: "vertical", lineHeight: 1.65 }} />
        </div>
      </div>

      {/* Governance & Control */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14, paddingBottom: 6, borderBottom: "1px solid #e2e8f0" }}>Governance & Control</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <FieldLabel label="Model Ownership" required tip="Who built or owns this AI model? This determines whether you are a Provider (built it) or Deployer (using it) under regulations like the EU AI Act — which carry different obligations." />
            <select value={form.modelOwnership} onChange={e => set("modelOwnership", e.target.value)} style={sel}>
              {MODEL_OWNERSHIP_OPTIONS.map(o => <option key={o} value={o}>{o || "Select…"}</option>)}
            </select>
            <FieldHelper text="Provider obligations (EU AI Act) apply if you built the model. Deployer obligations apply if you use a third-party system." />
          </div>
          <div>
            <FieldLabel label="Decision Authority" required tip="How much autonomy does the AI have? This is critical for EU AI Act human oversight obligations and NIST AI RMF accountability requirements." />
            <select value={form.decisionAuthority} onChange={e => set("decisionAuthority", e.target.value as DecisionAuthority)} style={sel}>
              {DECISION_AUTHORITY_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            {form.decisionAuthority && (
              <FieldHelper text={DECISION_AUTHORITY_OPTIONS.find(o => o.value === form.decisionAuthority)?.desc || ""} />
            )}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
          <div>
            <FieldLabel label="Deployment Status" tip="Current lifecycle stage of this AI system. Systems in Production carry the highest compliance urgency." />
            <select value={form.deploymentStatus} onChange={e => set("deploymentStatus", e.target.value as DeploymentStatus)} style={sel}>
              {DEPLOYMENT_STATUS_OPTIONS.map(o => <option key={o} value={o}>{o || "Select…"}</option>)}
            </select>
          </div>
          <div>
            <FieldLabel label="Time in Production" tip="How long has this system been running in a live environment? Longer deployment periods may indicate accumulated risk that has not been assessed." />
            <input value={form.timeInProduction} onChange={e => set("timeInProduction", e.target.value)} placeholder="e.g. 14 months — or 'Not yet deployed'" style={inp()} />
          </div>
        </div>
      </div>

      {/* Scale of Impact */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14, paddingBottom: 6, borderBottom: "1px solid #e2e8f0" }}>Scale of Impact</div>
        <div style={{ background: "#fef9c3", border: "1px solid #fde047", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: "#713f12" }}>
          ⚠ Scale matters for risk rating. A 5% bias rate sounds low — but at 15,000 decisions per quarter that is 750 biased decisions. Always think in totals, not percentages.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          <div>
            <FieldLabel label="Decisions per Period" required tip="How many AI-driven decisions does this system make per day, month, or quarter? Include the period (e.g. '15,000 per quarter')." />
            <input value={form.decisionsPerPeriod} onChange={e => set("decisionsPerPeriod", e.target.value)} placeholder="e.g. 15,000 per quarter" style={inp()} />
          </div>
          <div>
            <FieldLabel label="Internal Users Affected" tip="How many employees or internal staff interact with or are affected by this system's decisions?" />
            <input value={form.internalUsersAffected} onChange={e => set("internalUsersAffected", e.target.value)} placeholder="e.g. 12 HR staff, 200 managers" style={inp()} />
          </div>
          <div>
            <FieldLabel label="External / Public Affected" tip="How many external individuals (customers, applicants, patients, citizens) are subject to decisions made by this system? This is the most important number for regulatory assessment." />
            <input value={form.externalUsersAffected} onChange={e => set("externalUsersAffected", e.target.value)} placeholder="e.g. 15,000 job applicants per quarter" style={inp()} />
          </div>
        </div>
      </div>

      {/* Training Data */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14, paddingBottom: 6, borderBottom: "1px solid #e2e8f0" }}>Training Data</div>
        <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: "#0369a1" }}>
          ℹ If this is a third-party system, request this information from your vendor. Under EU AI Act Article 10, providers must disclose data governance practices. Deployers have a right to this information.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          <div>
            <FieldLabel label="Training Data Source" tip="Where did the training data come from? e.g. historical internal records, public datasets, synthetic data, licensed third-party data." />
            <input value={form.trainingDataSource} onChange={e => set("trainingDataSource", e.target.value)} placeholder="e.g. 5 years of internal hiring records" style={inp()} />
          </div>
          <div>
            <FieldLabel label="Training Data Period" tip="The date range of data used to train the model. Older training data may encode historical biases or outdated patterns." />
            <input value={form.trainingDataPeriod} onChange={e => set("trainingDataPeriod", e.target.value)} placeholder="e.g. 2019–2024" style={inp()} />
          </div>
          <div>
            <FieldLabel label="Last Model Retraining Date" tip="When was the model last retrained or updated? Models not retrained regularly may drift — producing increasingly inaccurate or biased outputs over time." />
            <input value={form.lastRetrainingDate} onChange={e => set("lastRetrainingDate", e.target.value)} placeholder="e.g. March 2025 — or 'Never / Unknown'" style={inp()} />
          </div>
        </div>
      </div>

      {/* Performance & Evaluation — AIIA (ISO 42001 Cl. 8) */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4, paddingBottom: 6, borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>Performance & Evaluation <span style={{ fontSize: 9, fontWeight: 700, background: "#ecfeff", color: "#0891b2", border: "1px solid #a5f3fc", borderRadius: 4, padding: "1px 6px", marginLeft: 6, letterSpacing: "0.04em" }}>AIIA — ISO 42001 Cl. 8</span></span>
        </div>
        <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 14 }}>Required for AI System Impact Assessment (AIIA) under ISO 42001 Clause 8. Enables AIIA export.</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 14 }}>
          <div>
            <FieldLabel label="Model Accuracy / Performance Metrics" tip="Key performance indicators: accuracy, AUC, F1 score, Gini coefficient, KS statistic. Include the metric names and values." />
            <input value={form.modelAccuracy} onChange={e => set("modelAccuracy", e.target.value)} placeholder="e.g. AUC 0.91 · Accuracy 94.2% · Gini 0.81" style={inp()} />
          </div>
          <div>
            <FieldLabel label="False Positive / False Rejection Rate" tip="Critical for fairness assessment. The rate at which the model incorrectly approves or rejects. Include both directions where known." />
            <input value={form.falsePositiveRate} onChange={e => set("falsePositiveRate", e.target.value)} placeholder="e.g. 3.1% false approvals · 4.7% false rejections" style={inp()} />
          </div>
          <div>
            <FieldLabel label="Last Evaluation Date" tip="When was the model last formally evaluated against its performance metrics? Infrequent evaluation is a drift risk." />
            <input type="date" value={form.lastEvaluationDate} onChange={e => set("lastEvaluationDate", e.target.value)} style={inp()} />
          </div>
          <div>
            <FieldLabel label="Evaluation Method" tip="How was the model evaluated? e.g. hold-out test set, k-fold cross-validation, third-party audit. Note any limitations." />
            <input value={form.evaluationMethod} onChange={e => set("evaluationMethod", e.target.value)} placeholder="e.g. Hold-out test set (20%), internal model risk team" style={inp()} />
          </div>
        </div>
        <div>
          <FieldLabel label="Known Limitations" tip="Document any known limitations, edge cases, or failure modes. Required by ISO 42001 Cl. 8.2 and EU AI Act Annex IV." />
          <textarea value={form.knownLimitations} onChange={e => set("knownLimitations", e.target.value)} rows={4} placeholder="e.g. Model not evaluated for fairness across protected groups. Training data pre-dates open banking era. No adversarial testing conducted." style={{ ...inp(), resize: "vertical" as const }} />
        </div>
      </div>

      {/* Stakeholder Consultation Log — AIIA (ISO 42001 Cl. 8) */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4, paddingBottom: 6, borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>Stakeholder Consultation Log <span style={{ fontSize: 9, fontWeight: 700, background: "#ecfeff", color: "#0891b2", border: "1px solid #a5f3fc", borderRadius: 4, padding: "1px 6px", marginLeft: 6 }}>AIIA — ISO 42001 Cl. 8.2</span></span>
          <button onClick={addStakeholder} style={{ background: "#f0f9ff", color: "#0369a1", border: "1px solid #bae6fd", borderRadius: 7, padding: "4px 12px", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>+ Add</button>
        </div>
        <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 12 }}>Record everyone consulted as part of this AI system assessment — internal and external.</div>
        {stakeholders.length === 0
          ? <div style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic", marginBottom: 10 }}>No stakeholders added yet.</div>
          : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
              {stakeholders.map(s => (
                <div key={s.id} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto 1fr auto", gap: 8, alignItems: "end", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 12px" }}>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 3 }}>Name</label>
                    <input value={s.name} onChange={e => updateStakeholder(s.id, { name: e.target.value })} placeholder="Full name" style={{ ...inp(), fontSize: 12 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 3 }}>Role</label>
                    <input value={s.role} onChange={e => updateStakeholder(s.id, { role: e.target.value })} placeholder="e.g. CRO, DPO" style={{ ...inp(), fontSize: 12 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 3 }}>Organisation</label>
                    <input value={s.organisation} onChange={e => updateStakeholder(s.id, { organisation: e.target.value })} style={{ ...inp(), fontSize: 12 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 3 }}>Consulted</label>
                    <select value={s.consulted ? "yes" : "no"} onChange={e => updateStakeholder(s.id, { consulted: e.target.value === "yes" })} style={{ ...inp(), fontSize: 12 }}>
                      <option value="no">Pending</option>
                      <option value="yes">Yes</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 3 }}>Consultation Date</label>
                    <input type="date" value={s.consultationDate} onChange={e => updateStakeholder(s.id, { consultationDate: e.target.value })} style={{ ...inp(), fontSize: 12 }} />
                  </div>
                  <button onClick={() => removeStakeholder(s.id)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 14, paddingBottom: 2 }}>✕</button>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ fontSize: 10, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 3 }}>Notes</label>
                    <input value={s.notes} onChange={e => updateStakeholder(s.id, { notes: e.target.value })} placeholder="Key points from this consultation…" style={{ ...inp(), fontSize: 12 }} />
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>

      {/* AIIA Export */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 14, borderTop: "1px solid #e2e8f0", marginTop: 4 }}>
        <div style={{ fontSize: 11, color: "#94a3b8" }}>Save the profile first, then export the AIIA.</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => exportAIIA(client)} style={{ background: "#ecfeff", color: "#0891b2", border: "1px solid #a5f3fc", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
            🌐 Export AIIA (ISO 42001 Cl. 8)
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── CLIENT PROFILE PANEL ─────────────────────────────────────────────────────
function ClientProfilePanel({ client, onUpdate }: { client: Client; onUpdate: (patch: Partial<Client>) => void }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<Client>>({});

  const openEdit = () => { setForm({ name: client.name, countries: [...(client.countries || [])], industry: client.industry, geography: client.geography, primaryAiUseCase: client.primaryAiUseCase, contactName: client.contactName, engagementType: client.engagementType, aboutClient: client.aboutClient || "" }); setEditing(true); };
  const save = () => { onUpdate(form); setEditing(false); };
  const set = (k: keyof Client, v: any) => setForm(prev => ({ ...prev, [k]: v }));
  const toggleC = (c: string) => setForm(prev => { const arr = prev.countries || []; return { ...prev, countries: arr.includes(c) ? arr.filter(x => x !== c) : [...arr, c] }; });

  const inp = () => ({ width: "100%", padding: "7px 10px", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 13, outline: "none", boxSizing: "border-box" as const, fontFamily: "inherit" });

  if (!editing) {
    return (
      <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 11, padding: "14px 18px", marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>Client Profile</div>
          <button onClick={openEdit} style={{ background: "none", border: "1px solid #e2e8f0", borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 600, color: "#6366f1", cursor: "pointer" }}>✎ Edit</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "8px 20px" }}>
          {[
            { label: "Organisation",   value: client.name },
            { label: "Country / Jurisdiction", value: (client.countries || []).join(", ") || "—" },
            { label: "Industry",       value: client.industry || "—" },
            { label: "Geography",      value: client.geography || "—" },
            { label: "AI Use Case",    value: client.primaryAiUseCase || "—" },
            { label: "Contact",        value: client.contactName || "—" },
            { label: "Engagement",     value: client.engagementType || "—" },
          ].map(f => (
            <div key={f.label}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>{f.label}</div>
              <div style={{ fontSize: 13, color: "#0f172a", fontWeight: f.value === "—" ? 400 : 500 }}>{f.value}</div>
            </div>
          ))}
        </div>
        {client.aboutClient && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 5 }}>About this Client</div>
            <p style={{ margin: 0, fontSize: 13, color: "#334155", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{client.aboutClient}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ background: "#fff", border: "1px solid #c7d2fe", borderRadius: 11, padding: "18px 20px", marginBottom: 16, boxShadow: "0 4px 16px rgba(99,102,241,0.08)" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>Edit Client Profile</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 5 }}>Organisation Name *</label>
          <input value={form.name || ""} onChange={e => set("name", e.target.value)} style={inp()} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 5 }}>Industry</label>
          <select value={form.industry || ""} onChange={e => set("industry", e.target.value)} style={{ ...inp(), background: "#fff", cursor: "pointer" }}>
            <option value="">Select…</option>
            {INDUSTRY_OPTIONS.map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 5 }}>Geography / Region</label>
          <input value={form.geography || ""} onChange={e => set("geography", e.target.value)} placeholder="e.g. EMEA, UK, US" style={inp()} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 5 }}>Primary AI Use Case</label>
          <input value={form.primaryAiUseCase || ""} onChange={e => set("primaryAiUseCase", e.target.value)} placeholder="e.g. Credit scoring, fraud detection" style={inp()} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 5 }}>Client Contact</label>
          <input value={form.contactName || ""} onChange={e => set("contactName", e.target.value)} placeholder="Name / role" style={inp()} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 5 }}>Engagement Type</label>
          <select value={form.engagementType || ""} onChange={e => set("engagementType", e.target.value as EngagementType)} style={{ ...inp(), background: "#fff", cursor: "pointer" }}>
            {ENGAGEMENT_TYPES.map(t => <option key={t} value={t}>{t || "Select…"}</option>)}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 8 }}>Country / Jurisdiction <span style={{ fontSize: 11, fontWeight: 400, color: "#94a3b8" }}>— select all that apply</span></label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 5 }}>
          {COUNTRY_OPTIONS.map(opt => {
            const checked = (form.countries || []).includes(opt);
            return (
              <label key={opt} style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 9px", border: `1px solid ${checked ? "#a5b4fc" : "#e2e8f0"}`, borderRadius: 7, cursor: "pointer", background: checked ? "#eef2ff" : "#fff", fontSize: 12, color: checked ? "#4f46e5" : "#334155" }}>
                <input type="checkbox" checked={checked} onChange={() => toggleC(opt)} style={{ accentColor: "#6366f1", flexShrink: 0 }} />
                {opt}
              </label>
            );
          })}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 5 }}>About this Client</label>
        <textarea value={form.aboutClient || ""} onChange={e => set("aboutClient", e.target.value)}
          placeholder="Describe the client's background, engagement context, scope of work, key stakeholders, and any relevant notes that aren't captured in the structured fields above…"
          rows={5}
          style={{ ...inp(), resize: "vertical" }} />
      </div>

      <div style={{ display: "flex", gap: 8, borderTop: "1px solid #e2e8f0", paddingTop: 14 }}>
        <button onClick={save} style={{ background: "#0f172a", color: "#fff", border: "none", borderRadius: 8, padding: "8px 20px", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>Save Profile</button>
        <button onClick={() => setEditing(false)} style={{ background: "#f1f5f9", color: "#64748b", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 13 }}>Cancel</button>
      </div>
    </div>
  );
}

// ─── VIEW 2: CLIENT DETAIL ────────────────────────────────────────────────────
function ClientDetailView({ client, onBack, onSelectPolicy, onOpenRiskRegister, defaultPhase }: {
  client: Client; onBack: () => void; onSelectPolicy: (pid: string) => void; onOpenRiskRegister: () => void; defaultPhase?: number;
}) {
  const [clients, setClients] = useState<Client[]>(loadClients);
  const [activePhase, setActivePhase] = useState<number | null>(defaultPhase ?? null);
  const [showAddPolicy, setShowAddPolicy] = useState(false);
  const [showEditFrameworks, setShowEditFrameworks] = useState(false);
  const [editFrameworkSet, setEditFrameworkSet] = useState<Set<string>>(new Set());
  const thisClient = clients.find(c => c.id === client.id) || client;
  let countrySugsDetail: Suggestion[] = [];
  (thisClient.countries || []).forEach(c => { countrySugsDetail = mergeSuggestions(countrySugsDetail, COUNTRY_SUGGESTIONS[c] || []); });
  const suggestions = mergeSuggestions(countrySugsDetail, INDUSTRY_SUGGESTIONS[thisClient.industry] || []);

  const updateClient = (patch: Partial<Client>) => {
    const updated = clients.map(c => c.id === client.id ? { ...c, ...patch } : c);
    saveClients(updated); setClients(updated);
  };
  const addPolicy = (pid: string) => {
    updateClient({ activePolicies: [...thisClient.activePolicies, pid] });
    setShowAddPolicy(false);
  };
  const removePolicy = (pid: string) => {
    if (!confirm(`Remove ${POLICY_STUBS.find(p => p.id === pid)?.name}? Discovery data will be cleared.`)) return;
    const guide = IMPLEMENTATION_GUIDES[pid];
    if (guide) guide.areas.forEach((_a, i) => { try { localStorage.removeItem(areaKey(client.id, pid, i)); } catch {} });
    updateClient({ activePolicies: thisClient.activePolicies.filter(p => p !== pid) });
  };
  const openEditFrameworks = () => {
    setEditFrameworkSet(new Set(thisClient.activePolicies));
    setShowEditFrameworks(true);
  };
  const saveEditFrameworks = () => {
    // Clear data for removed policies
    const removed = thisClient.activePolicies.filter(pid => !editFrameworkSet.has(pid));
    removed.forEach(pid => {
      const guide = IMPLEMENTATION_GUIDES[pid];
      if (guide) guide.areas.forEach((_a, i) => { try { localStorage.removeItem(areaKey(client.id, pid, i)); } catch {} });
    });
    updateClient({ activePolicies: [...editFrameworkSet] });
    setShowEditFrameworks(false);
  };

  const availableToAdd = POLICY_STUBS.filter(p => !thisClient.activePolicies.includes(p.id));
  const sof = SIGN_OFF_CONFIG[thisClient.signOffStatus];

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 32px" }}>
      <Breadcrumb items={[{ label: "All Clients", onClick: onBack }, { label: thisClient.name }]} />

      <div style={{ margin: "20px 0 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
          <div>
            <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 800, color: "#0f172a" }}>{thisClient.name}</h2>
            <div style={{ fontSize: 13, color: "#64748b" }}>
              {[(thisClient.countries || []).join(", "), thisClient.industry, thisClient.geography].filter(Boolean).join(" · ")}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {/* Sign-off selector */}
            <select value={thisClient.signOffStatus} onChange={e => updateClient({ signOffStatus: e.target.value as SignOffStatus })}
              style={{ padding: "6px 10px", border: `1px solid ${sof.border}`, borderRadius: 8, fontSize: 12, fontWeight: 700, background: sof.bg, color: sof.text, cursor: "pointer" }}>
              {(["Pending", "In Review", "Signed Off"] as SignOffStatus[]).map(s => <option key={s}>{s}</option>)}
            </select>
            {activePhase === 2 && (
              <button onClick={openEditFrameworks}
                style={{ background: "#f0f9ff", color: "#0369a1", border: "1px solid #bae6fd", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                ✎ Edit Frameworks
              </button>
            )}
            {activePhase === 2 && availableToAdd.length > 0 && !showEditFrameworks && (
              <button onClick={() => setShowAddPolicy(v => !v)} style={{ background: "#0f172a", color: "#fff", border: "none", borderRadius: 8, padding: "7px 16px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                + Add Framework
              </button>
            )}
          </div>
        </div>

        {/* Edit Frameworks panel */}
        {activePhase === 2 && showEditFrameworks && (
          <div style={{ background: "#fff", border: "1px solid #bae6fd", borderRadius: 12, padding: 18, marginBottom: 18, boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Select frameworks for {thisClient.name}</div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14 }}>Tick or untick any framework. Removing an existing one will clear its discovery data.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 16 }}>
              {POLICY_STUBS.map(stub => {
                const checked = editFrameworkSet.has(stub.id);
                const sug = suggestions.find(s => s.id === stub.id);
                const scfg = sug ? SUGGESTION_CONFIG[sug.level] : null;
                return (
                  <label key={stub.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 14px", border: `1px solid ${checked ? stub.border : "#e2e8f0"}`, borderRadius: 10, cursor: "pointer", background: checked ? stub.bg : "#fff" }}>
                    <input type="checkbox" checked={checked} onChange={() => setEditFrameworkSet(prev => { const n = new Set(prev); n.has(stub.id) ? n.delete(stub.id) : n.add(stub.id); return n; })}
                      style={{ width: 15, height: 15, accentColor: stub.color, cursor: "pointer" }} />
                    <span style={{ fontSize: 18 }}>{stub.emoji}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", flex: 1 }}>{stub.name}{!stub.hasGuide && <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 400, marginLeft: 6 }}>guide coming soon</span>}</span>
                    {sug && scfg && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5, background: scfg.bg, color: scfg.text, border: `1px solid ${scfg.border}` }}>{sug.level}</span>}
                  </label>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={saveEditFrameworks} style={{ background: "#0f172a", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>Save Changes</button>
              <button onClick={() => setShowEditFrameworks(false)} style={{ background: "#f1f5f9", color: "#64748b", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 13 }}>Cancel</button>
            </div>
          </div>
        )}

      </div>

      {/* Client Profile Panel — always visible, editable */}
      <ClientProfilePanel client={thisClient} onUpdate={updateClient} />

      {/* ── Phase Navigation ── */}
      <PhaseNav activePhase={activePhase} onPhaseClick={n => setActivePhase(prev => prev === n ? null : n)} />

      {/* ── Phase 1: Govern & Scope — AI System Profile ── */}
      {activePhase === 1 && (
        <AISystemProfileForm client={thisClient} onSave={updateClient} />
      )}

      {/* ── Phase 2: Map & Discover — Frameworks + Questionnaire ── */}
      {activePhase === 2 && showAddPolicy && availableToAdd.length > 0 && (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 18, marginBottom: 18, boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>Add frameworks for {thisClient.name}:</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {availableToAdd.map(stub => {
              const sug = suggestions.find(s => s.id === stub.id);
              const scfg = sug ? SUGGESTION_CONFIG[sug.level] : null;
              return (
                <button key={stub.id} onClick={() => addPolicy(stub.id)} style={{ display: "flex", alignItems: "center", gap: 10, background: stub.bg, border: `1px solid ${stub.border}`, borderRadius: 10, padding: "10px 14px", cursor: "pointer", textAlign: "left" }}>
                  <span style={{ fontSize: 18 }}>{stub.emoji}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", flex: 1 }}>{stub.name}{!stub.hasGuide && <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 400, marginLeft: 6 }}>guide coming soon</span>}</span>
                  {sug && scfg && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5, background: scfg.bg, color: scfg.text, border: `1px solid ${scfg.border}` }}>{sug.level}</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {activePhase === 2 && (thisClient.activePolicies.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8", background: "#f8fafc", borderRadius: 12, border: "1px dashed #e2e8f0" }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>➕</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>No frameworks added yet</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {thisClient.activePolicies.map(pid => {
            const stub = POLICY_STUBS.find(p => p.id === pid)!;
            const guide = IMPLEMENTATION_GUIDES[pid];
            const { pct, done, total } = getPolicyProgress(client.id, pid);
            const sug = suggestions.find(s => s.id === pid);
            return (
              <div key={pid} style={{ background: "#fff", border: `1px solid ${stub.border}`, borderTop: `3px solid ${stub.color}`, borderRadius: 12, overflow: "hidden" }}>
                <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 24 }}>{stub.emoji}</span>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{stub.name}</span>
                      {sug && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5, background: SUGGESTION_CONFIG[sug.level].bg, color: SUGGESTION_CONFIG[sug.level].text, border: `1px solid ${SUGGESTION_CONFIG[sug.level].border}` }}>{sug.level}</span>}
                    </div>
                    <ProgressBar pct={pct} color={stub.color} />
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{done}/{total} applicable questions · {guide?.areas.length || 0} areas</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {stub.hasGuide
                      ? <button onClick={() => onSelectPolicy(pid)} style={{ background: "#0f172a", color: "#fff", border: "none", borderRadius: 7, padding: "7px 16px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Open Workbook →</button>
                      : <span style={{ fontSize: 11, color: "#94a3b8", fontStyle: "italic" }}>Guide coming soon</span>}
                    <button onClick={() => removePolicy(pid)} title="Remove" style={{ background: "#f8fafc", color: "#94a3b8", border: "1px solid #e2e8f0", borderRadius: 7, padding: "7px 9px", cursor: "pointer", fontSize: 11 }}>✕</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {/* ── Phase 3: Measure & Assess ── */}
      {activePhase === 3 && (() => {
        const risks = loadRisks(thisClient.id);
        const counts: Record<RiskLevel, number> = { Critical: 0, High: 0, Medium: 0, Low: 0 };
        risks.forEach(r => counts[riskLevel(r.residualLikelihood, r.residualImpact)]++);
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Risk summary card */}
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "20px 24px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 14 }}>Risk Register Summary</div>
              {risks.length === 0 ? (
                <div style={{ fontSize: 13, color: "#94a3b8", fontStyle: "italic", marginBottom: 16 }}>
                  No risks identified yet. Open the Risk Register to start assessing.
                </div>
              ) : (
                <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                  {(["Critical", "High", "Medium", "Low"] as RiskLevel[]).map(lvl => {
                    const cfg = RISK_LEVEL_CONFIG[lvl];
                    return (
                      <div key={lvl} style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 10, padding: "10px 18px", display: "flex", flexDirection: "column", alignItems: "center", minWidth: 70 }}>
                        <span style={{ fontSize: 20, fontWeight: 800, color: cfg.text }}>{counts[lvl]}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: cfg.text }}>{lvl}</span>
                      </div>
                    );
                  })}
                  <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 18px", display: "flex", flexDirection: "column", alignItems: "center", minWidth: 70 }}>
                    <span style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>{risks.length}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#64748b" }}>Total</span>
                  </div>
                </div>
              )}
              <button onClick={onOpenRiskRegister} style={{ background: "#0f172a", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
                ⚠️ Open Risk Register →
              </button>
            </div>
          </div>
        );
      })()}

      {/* ── Phase 4: Report & Recommend ── */}
      {activePhase === 4 && (
        <Phase4Report client={thisClient} onExportFull={() => exportFullReportExcel(thisClient)} />
      )}

      {/* ── Phase 5: Monitor ── */}
      {activePhase === 5 && (
        <Phase5Monitor client={thisClient} />
      )}
    </div>
  );
}

// ─── READINESS REPORT ─────────────────────────────────────────────────────────
function ReadinessReport({ client, policyId, areaStates, reportSummary, onSummaryChange }: {
  client: Client; policyId: string; areaStates: AreaState[];
  reportSummary: string; onSummaryChange: (v: string) => void;
}) {
  const stub = POLICY_STUBS.find(p => p.id === policyId)!;
  const guide = IMPLEMENTATION_GUIDES[policyId];
  if (!guide) return null;

  let totalQ = 0, completeQ = 0, inProgressQ = 0, naQ = 0, onHoldQ = 0, notStartedQ = 0;
  const gapAreas: { area: string; count: number; priority: string }[] = [];

  guide.areas.forEach((area, ai) => {
    const st = areaStates[ai]; let gaps = 0;
    area.questions.forEach((_q, qi) => {
      const s = st.questions[qi]?.status || "Not Started";
      if (s === "Not Applicable") { naQ++; return; }
      totalQ++;
      if (s === "Complete") completeQ++;
      else if (s === "In Progress") inProgressQ++;
      else if (s === "On Hold") onHoldQ++;
      else { notStartedQ++; gaps++; }
    });
    if (gaps > 0) gapAreas.push({ area: area.area, count: gaps, priority: area.priority });
  });

  const pct = totalQ ? Math.round((completeQ / totalQ) * 100) : 0;
  const level = pct >= 80 ? "Advanced" : pct >= 50 ? "Developing" : pct >= 25 ? "Initial" : "Not Started";
  const levelColor = pct >= 80 ? "#15803d" : pct >= 50 ? "#a16207" : pct >= 25 ? "#c2410c" : "#dc2626";
  const sof = SIGN_OFF_CONFIG[client.signOffStatus] || SIGN_OFF_CONFIG["Pending"];

  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, overflow: "hidden", marginBottom: 24 }}>
      {/* Client overview section */}
      <div style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", padding: "18px 24px" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Assessment Overview</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
          {[
            { label: "Client", value: client.name },
            { label: "Industry", value: client.industry },
            { label: "Geography", value: client.geography || "—" },
            { label: "AI Use Case", value: client.primaryAiUseCase || "—" },
            { label: "Engagement", value: client.engagementType || "—" },
            { label: "Contact", value: client.contactName || "—" },
            { label: "Framework", value: `${stub.emoji} ${stub.name}` },
            { label: "Frameworks in Scope", value: client.activePolicies.map(id => POLICY_STUBS.find(p => p.id === id)?.name || id).join(", ") || "—" },
          ].map(f => (
            <div key={f.label}>
              <div style={{ fontSize: 10, fontWeight: 600, color: "#64748b", marginBottom: 3 }}>{f.label}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{f.value}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 6, background: sof.bg, color: sof.text, border: `1px solid ${sof.border}` }}>
            {sof.icon} Sign-off: {client.signOffStatus}
          </span>
          <span style={{ fontSize: 11, color: "#64748b" }}>Assessed: {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span>
        </div>
        {/* Assessment summary */}
        <div style={{ marginTop: 16 }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Overall Assessment Summary
          </label>
          <textarea
            value={reportSummary}
            onChange={e => onSummaryChange(e.target.value)}
            placeholder="Provide an executive summary of the assessment: key strengths, critical gaps, recommended priorities, and agreed next steps…"
            rows={3}
            style={{ width: "100%", padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 12, outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit", color: "#0f172a", background: "#fff" }}
          />
        </div>
      </div>

      {/* Readiness result */}
      <div style={{ padding: "20px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#334155" }}>📊 Readiness Score — {stub.name}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: levelColor }}>{pct}%</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: levelColor, padding: "4px 10px", background: pct >= 80 ? "#f0fdf4" : pct >= 50 ? "#fefce8" : pct >= 25 ? "#fff7ed" : "#fef2f2", borderRadius: 8 }}>{level}</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 8, marginBottom: 18 }}>
          {[
            { label: "Complete",       count: completeQ,   bg: "#f0fdf4", text: "#15803d" },
            { label: "In Progress",    count: inProgressQ, bg: "#fefce8", text: "#a16207" },
            { label: "On Hold",        count: onHoldQ,     bg: "#fff7ed", text: "#c2410c" },
            { label: "Not Started",    count: notStartedQ, bg: "#fef2f2", text: "#dc2626" },
            { label: "Not Applicable", count: naQ,         bg: "#f1f5f9", text: "#64748b" },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, borderRadius: 8, padding: "10px 10px", textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.text }}>{s.count}</div>
              <div style={{ fontSize: 10, color: s.text, fontWeight: 600, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {gapAreas.length > 0 && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#dc2626", marginBottom: 8 }}>🔴 Priority Gaps — Not Started</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {gapAreas.sort((a, b) => (a.priority === "High" ? -1 : b.priority === "High" ? 1 : 0)).map((g, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 7 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 5px", borderRadius: 4, background: g.priority === "High" ? "#dc2626" : g.priority === "Medium" ? "#f59e0b" : "#64748b", color: "#fff" }}>{g.priority}</span>
                  <span style={{ fontSize: 12, color: "#0f172a", flex: 1 }}>{g.area}</span>
                  <span style={{ fontSize: 11, color: "#dc2626", fontWeight: 700 }}>{g.count} open</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {pct === 100 && (
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: 14, textAlign: "center", marginTop: 12 }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>🎉</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#15803d" }}>Discovery complete — all applicable areas assessed</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PHASE 5: MONITOR ─────────────────────────────────────────────────────────

type KpiTrend = "↑ Improving" | "→ Stable" | "↓ Degrading" | "—";
type ReviewDecision = "" | "Continue Monitoring" | "Targeted Review" | "Full Re-assessment" | "Escalate";

type MonitorKpi = {
  id: string; name: string; unit: string;
  currentValue: string; threshold: string; direction: "higher_better" | "lower_better";
  trend: KpiTrend; notes: string;
};
type DriftTrigger = { id: string; name: string; active: boolean; lastOccurred: string; notes: string };
type ChangeEntry = { id: string; date: string; changeType: string; description: string; impact: string; approvedBy: string };
type Phase5Data = {
  reviewFrequency: string; nextReviewDate: string; reviewType: string;
  kpis: MonitorKpi[]; triggers: DriftTrigger[]; changes: ChangeEntry[];
  decision: ReviewDecision; decisionRationale: string; decisionOwner: string; decisionDate: string;
};

const DEFAULT_KPIS: MonitorKpi[] = [
  { id: "kpi-1", name: "Model Accuracy",              unit: "%", currentValue: "", threshold: "≥ 85", direction: "higher_better", trend: "—", notes: "" },
  { id: "kpi-2", name: "False Positive Rate",          unit: "%", currentValue: "", threshold: "≤ 15", direction: "lower_better", trend: "—", notes: "" },
  { id: "kpi-3", name: "Demographic Parity Gap",       unit: "%", currentValue: "", threshold: "≤ 5",  direction: "lower_better", trend: "—", notes: "" },
  { id: "kpi-4", name: "Human Override Rate",          unit: "%", currentValue: "", threshold: "≤ 10", direction: "lower_better", trend: "—", notes: "" },
  { id: "kpi-5", name: "AI Incident Count (period)",   unit: "#", currentValue: "", threshold: "0",    direction: "lower_better", trend: "—", notes: "" },
];

const DEFAULT_TRIGGERS: DriftTrigger[] = [
  { id: "t-1", name: "Model retrained or updated",                   active: false, lastOccurred: "", notes: "" },
  { id: "t-2", name: "New training data source added",               active: false, lastOccurred: "", notes: "" },
  { id: "t-3", name: "Regulatory change affecting this system",      active: false, lastOccurred: "", notes: "" },
  { id: "t-4", name: "Bias metric threshold breached",               active: false, lastOccurred: "", notes: "" },
  { id: "t-5", name: "Decision volume change >20%",                  active: false, lastOccurred: "", notes: "" },
  { id: "t-6", name: "Adverse customer or regulatory incident",      active: false, lastOccurred: "", notes: "" },
  { id: "t-7", name: "Deployment context change",                    active: false, lastOccurred: "", notes: "" },
];

function computeKpiStatus(kpi: MonitorKpi): { label: string; bg: string; text: string } {
  const val = parseFloat(kpi.currentValue);
  const raw = kpi.threshold.replace(/[≥≤<>]/g, "").trim();
  const thresh = parseFloat(raw);
  if (isNaN(val) || isNaN(thresh)) return { label: "—", bg: "#f1f5f9", text: "#64748b" };
  const isHigherBetter = kpi.direction === "higher_better";
  const breached = isHigherBetter ? val < thresh : val > thresh;
  const approaching = isHigherBetter ? (val >= thresh * 0.9 && val < thresh) : (val <= thresh * 1.1 && val > thresh);
  if (breached)    return { label: "Breached",    bg: "#fef2f2", text: "#dc2626" };
  if (approaching) return { label: "Approaching", bg: "#fff7ed", text: "#c2410c" };
  return { label: "Within", bg: "#f0fdf4", text: "#15803d" };
}

function loadPhase5(clientId: string): Phase5Data {
  try {
    const raw = localStorage.getItem(`pl_p5_${clientId}`);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {
    reviewFrequency: "", nextReviewDate: "", reviewType: "",
    kpis: DEFAULT_KPIS, triggers: DEFAULT_TRIGGERS, changes: [],
    decision: "", decisionRationale: "", decisionOwner: "", decisionDate: "",
  };
}
function savePhase5(clientId: string, data: Phase5Data) {
  localStorage.setItem(`pl_p5_${clientId}`, JSON.stringify(data));
}

function Phase5Monitor({ client }: { client: Client }) {
  const [data, setData] = useState<Phase5Data>(() => loadPhase5(client.id));
  const [lastSaved, setLastSaved] = useState("");

  const persist = (next: Phase5Data) => {
    savePhase5(client.id, next);
    setLastSaved(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
  };
  const update = (patch: Partial<Phase5Data>) => {
    const next = { ...data, ...patch };
    setData(next); persist(next);
  };
  const updateKpi = (id: string, patch: Partial<MonitorKpi>) => {
    const next = { ...data, kpis: data.kpis.map(k => k.id === id ? { ...k, ...patch } : k) };
    setData(next); persist(next);
  };
  const addKpi = () => {
    const next = { ...data, kpis: [...data.kpis, { id: crypto.randomUUID(), name: "", unit: "%", currentValue: "", threshold: "", direction: "lower_better" as const, trend: "—" as KpiTrend, notes: "" }] };
    setData(next); persist(next);
  };
  const removeKpi = (id: string) => {
    const next = { ...data, kpis: data.kpis.filter(k => k.id !== id) };
    setData(next); persist(next);
  };
  const updateTrigger = (id: string, patch: Partial<DriftTrigger>) => {
    const next = { ...data, triggers: data.triggers.map(t => t.id === id ? { ...t, ...patch } : t) };
    setData(next); persist(next);
  };
  const addChange = () => {
    const next = { ...data, changes: [...data.changes, { id: crypto.randomUUID(), date: "", changeType: "Model", description: "", impact: "", approvedBy: "" }] };
    setData(next); persist(next);
  };
  const updateChange = (id: string, patch: Partial<ChangeEntry>) => {
    const next = { ...data, changes: data.changes.map(c => c.id === id ? { ...c, ...patch } : c) };
    setData(next); persist(next);
  };
  const removeChange = (id: string) => {
    const next = { ...data, changes: data.changes.filter(c => c.id !== id) };
    setData(next); persist(next);
  };

  const activeTriggers = data.triggers.filter(t => t.active).length;
  const breachedKpis = data.kpis.filter(k => computeKpiStatus(k).label === "Breached").length;

  const inp: React.CSSProperties = { width: "100%", padding: "6px 9px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12, outline: "none", boxSizing: "border-box", fontFamily: "inherit" };
  const sel: React.CSSProperties = { ...inp, background: "#fff", cursor: "pointer" };

  const DECISION_COLORS: Record<string, { bg: string; border: string; text: string }> = {
    "Continue Monitoring": { bg: "#f0fdf4", border: "#bbf7d0", text: "#15803d" },
    "Targeted Review":      { bg: "#fefce8", border: "#fde68a", text: "#a16207" },
    "Full Re-assessment":   { bg: "#fff7ed", border: "#fed7aa", text: "#c2410c" },
    "Escalate":             { bg: "#fef2f2", border: "#fecaca", text: "#dc2626" },
  };
  const dc = data.decision ? (DECISION_COLORS[data.decision] || {}) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Auto-save */}
      {lastSaved && <div style={{ textAlign: "right", fontSize: 11, color: "#64748b" }}>✓ Saved · {lastSaved}</div>}

      {/* Status chips */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <div style={{ background: breachedKpis > 0 ? "#fef2f2" : "#f0fdf4", border: `1px solid ${breachedKpis > 0 ? "#fecaca" : "#bbf7d0"}`, borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: breachedKpis > 0 ? "#dc2626" : "#15803d" }}>{breachedKpis}</div>
          <div style={{ fontSize: 10, fontWeight: 600, color: breachedKpis > 0 ? "#dc2626" : "#15803d" }}>KPI{breachedKpis !== 1 ? "s" : ""} Breached</div>
        </div>
        <div style={{ background: activeTriggers > 0 ? "#fff7ed" : "#f0fdf4", border: `1px solid ${activeTriggers > 0 ? "#fed7aa" : "#bbf7d0"}`, borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: activeTriggers > 0 ? "#c2410c" : "#15803d" }}>{activeTriggers}</div>
          <div style={{ fontSize: 10, fontWeight: 600, color: activeTriggers > 0 ? "#c2410c" : "#15803d" }}>Drift Trigger{activeTriggers !== 1 ? "s" : ""} Active</div>
        </div>
        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>{data.changes.length}</div>
          <div style={{ fontSize: 10, fontWeight: 600, color: "#64748b" }}>Change{data.changes.length !== 1 ? "s" : ""} Logged</div>
        </div>
        {data.decision && dc && (
          <div style={{ background: dc.bg, border: `1px solid ${dc.border}`, borderRadius: 8, padding: "8px 14px", display: "flex", alignItems: "center" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: dc.text }}>Decision: {data.decision}</div>
          </div>
        )}
      </div>

      {/* Section 1: Review Schedule */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 11, padding: "16px 20px" }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: "#0f172a", marginBottom: 12 }}>📅 Review Schedule</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 150 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4, textTransform: "uppercase" }}>Frequency</label>
            <select value={data.reviewFrequency} onChange={e => update({ reviewFrequency: e.target.value })} style={sel}>
              <option value="">— Select —</option>
              {["Monthly", "Quarterly", "Bi-annual", "Annual"].map(f => <option key={f}>{f}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 150 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4, textTransform: "uppercase" }}>Next Review Date</label>
            <input type="date" value={data.nextReviewDate} onChange={e => update({ nextReviewDate: e.target.value })} style={inp} />
          </div>
          <div style={{ flex: 1, minWidth: 150 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4, textTransform: "uppercase" }}>Review Type</label>
            <select value={data.reviewType} onChange={e => update({ reviewType: e.target.value })} style={sel}>
              <option value="">— Select —</option>
              {["Full Re-assessment", "Targeted Review", "Desk-based Check"].map(f => <option key={f}>{f}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Section 2: Monitoring KPIs */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 11, padding: "16px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#0f172a" }}>📊 Monitoring KPIs</div>
          <button onClick={addKpi} style={{ fontSize: 11, fontWeight: 600, color: "#6366f1", background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}>+ Add KPI</button>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["Metric", "Unit", "Current Value", "Threshold", "Status", "Trend", "Notes", ""].map(h => (
                  <th key={h} style={{ padding: "6px 10px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.kpis.map(kpi => {
                const status = computeKpiStatus(kpi);
                return (
                  <tr key={kpi.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "6px 8px" }}>
                      <input value={kpi.name} onChange={e => updateKpi(kpi.id, { name: e.target.value })} style={{ ...inp, minWidth: 160 }} />
                    </td>
                    <td style={{ padding: "6px 8px" }}>
                      <input value={kpi.unit} onChange={e => updateKpi(kpi.id, { unit: e.target.value })} style={{ ...inp, width: 50 }} />
                    </td>
                    <td style={{ padding: "6px 8px" }}>
                      <input type="number" min="0" step="any" value={kpi.currentValue} onChange={e => updateKpi(kpi.id, { currentValue: e.target.value })} placeholder="0" style={{ ...inp, width: 70 }} />
                    </td>
                    <td style={{ padding: "6px 8px" }}>
                      <input value={kpi.threshold} onChange={e => updateKpi(kpi.id, { threshold: e.target.value })} style={{ ...inp, width: 70 }} />
                    </td>
                    <td style={{ padding: "6px 8px" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5, background: status.bg, color: status.text, whiteSpace: "nowrap" }}>{status.label}</span>
                    </td>
                    <td style={{ padding: "6px 8px" }}>
                      <select value={kpi.trend} onChange={e => updateKpi(kpi.id, { trend: e.target.value as KpiTrend })} style={{ ...sel, width: 120 }}>
                        {(["—", "↑ Improving", "→ Stable", "↓ Degrading"] as KpiTrend[]).map(t => <option key={t}>{t}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: "6px 8px" }}>
                      <input value={kpi.notes} onChange={e => updateKpi(kpi.id, { notes: e.target.value })} placeholder="Notes…" style={{ ...inp, minWidth: 140 }} />
                    </td>
                    <td style={{ padding: "6px 8px" }}>
                      <button onClick={() => removeKpi(kpi.id)} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: 13, padding: "0 4px" }}>✕</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 3: Drift Triggers */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 11, padding: "16px 20px" }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>⚡ Drift Triggers</div>
        <div style={{ fontSize: 11, color: "#64748b", marginBottom: 12 }}>Check any condition that has occurred since the last review — this drives the re-assessment decision below.</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {data.triggers.map(trigger => (
            <div key={trigger.id} style={{ background: trigger.active ? "#fff7ed" : "#f8fafc", border: `1px solid ${trigger.active ? "#fed7aa" : "#e2e8f0"}`, borderRadius: 8, padding: "10px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <input type="checkbox" checked={trigger.active} onChange={e => updateTrigger(trigger.id, { active: e.target.checked })}
                  style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#c2410c", flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: trigger.active ? 700 : 500, color: trigger.active ? "#c2410c" : "#334155", flex: 1 }}>{trigger.name}</span>
                {trigger.active && (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <label style={{ fontSize: 10, fontWeight: 700, color: "#64748b", whiteSpace: "nowrap" }}>Date:</label>
                      <input type="date" value={trigger.lastOccurred} onChange={e => updateTrigger(trigger.id, { lastOccurred: e.target.value })}
                        style={{ padding: "3px 7px", border: "1px solid #e2e8f0", borderRadius: 5, fontSize: 11, outline: "none", cursor: "pointer" }} />
                    </div>
                    <input value={trigger.notes} onChange={e => updateTrigger(trigger.id, { notes: e.target.value })}
                      placeholder="Notes…" style={{ padding: "3px 8px", border: "1px solid #e2e8f0", borderRadius: 5, fontSize: 11, outline: "none", minWidth: 160 }} />
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 4: Change Log */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 11, padding: "16px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#0f172a" }}>📋 Change Log</div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Record material changes to the AI system since the last review.</div>
          </div>
          <button onClick={addChange} style={{ fontSize: 11, fontWeight: 600, color: "#6366f1", background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}>+ Add Entry</button>
        </div>
        {data.changes.length === 0 ? (
          <div style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", padding: "18px 0" }}>No changes recorded yet</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {data.changes.map(c => (
              <div key={c.id} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 14px" }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 6 }}>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 3, textTransform: "uppercase" }}>Date</label>
                    <input type="date" value={c.date} onChange={e => updateChange(c.id, { date: e.target.value })} style={{ ...inp, width: 140 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 3, textTransform: "uppercase" }}>Type</label>
                    <select value={c.changeType} onChange={e => updateChange(c.id, { changeType: e.target.value })} style={{ ...sel, width: 130 }}>
                      {["Model", "Data", "Deployment", "Policy", "Governance"].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 3, textTransform: "uppercase" }}>Approved By</label>
                    <input value={c.approvedBy} onChange={e => updateChange(c.id, { approvedBy: e.target.value })} placeholder="Name / Role" style={{ ...inp, width: 150 }} />
                  </div>
                  <button onClick={() => removeChange(c.id)} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: 13, marginBottom: 2 }}>✕</button>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ flex: 2 }}>
                    <label style={{ fontSize: 10, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 3, textTransform: "uppercase" }}>Description</label>
                    <input value={c.description} onChange={e => updateChange(c.id, { description: e.target.value })} placeholder="What changed?" style={inp} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 10, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 3, textTransform: "uppercase" }}>Impact Assessment</label>
                    <input value={c.impact} onChange={e => updateChange(c.id, { impact: e.target.value })} placeholder="Risk / compliance impact" style={inp} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 5: Re-assessment Decision */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 11, padding: "16px 20px" }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: "#0f172a", marginBottom: 12 }}>✅ Re-assessment Decision</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
          {(["Continue Monitoring", "Targeted Review", "Full Re-assessment", "Escalate"] as ReviewDecision[]).map(d => {
            const c = DECISION_COLORS[d];
            const isSelected = data.decision === d;
            return (
              <button key={d} onClick={() => update({ decision: isSelected ? "" : d })}
                style={{ padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", border: `2px solid ${isSelected ? c.border : "#e2e8f0"}`, background: isSelected ? c.bg : "#fff", color: isSelected ? c.text : "#64748b" }}>
                {d}
              </button>
            );
          })}
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4, textTransform: "uppercase" }}>Rationale</label>
          <textarea value={data.decisionRationale} onChange={e => update({ decisionRationale: e.target.value })}
            placeholder="Summarise the basis for this decision — KPI trends, active triggers, regulatory context, and agreed next steps…"
            rows={3} style={{ ...inp, resize: "vertical" }} />
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4, textTransform: "uppercase" }}>Decision Owner</label>
            <input value={data.decisionOwner} onChange={e => update({ decisionOwner: e.target.value })} placeholder="Name / Role" style={inp} />
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4, textTransform: "uppercase" }}>Decision Date</label>
            <input type="date" value={data.decisionDate} onChange={e => update({ decisionDate: e.target.value })} style={inp} />
          </div>
        </div>
      </div>

    </div>
  );
}

// ─── VIEW 3: DISCOVERY WORKBOOK ───────────────────────────────────────────────
function DiscoveryWorkbook({ client, policyId, onBack, onBackToClient, onPhaseSelect }: {
  client: Client; policyId: string; onBack: () => void; onBackToClient: () => void; onPhaseSelect: (n: number) => void;
}) {
  const stub = POLICY_STUBS.find(p => p.id === policyId) || POLICY_STUBS[0];
  const guide = (IMPLEMENTATION_GUIDES as Record<string, any>)[policyId];
  // All hooks must be declared before any early return
  const [openArea, setOpenArea] = useState<number | null>(null);
  const [openQuestions, setOpenQuestions] = useState<Record<number, number | null>>({});
  const [showReport, setShowReport] = useState(false);
  const [lastSaved, setLastSaved] = useState("");
  const [reportSummary, setReportSummary] = useState(() => loadReportSummary(client.id, policyId));
  const [areaStates, setAreaStates] = useState<AreaState[]>(() =>
    guide ? guide.areas.map((_a: any, i: number) => loadArea(client.id, policyId, i)) : []
  );
  const areaRefs = useRef<(HTMLDivElement | null)[]>([]);

  // When Supabase data loads after mount and adds more areas, extend areaStates
  useEffect(() => {
    if (!guide) return;
    setAreaStates(prev => {
      if (guide.areas.length <= prev.length) return prev;
      const extended = [...prev];
      for (let i = prev.length; i < guide.areas.length; i++) {
        extended.push(loadArea(client.id, policyId, i));
      }
      return extended;
    });
  }, [guide?.areas?.length, client.id, policyId]);

  useEffect(() => {
    if (openArea !== null && areaRefs.current[openArea]) {
      setTimeout(() => areaRefs.current[openArea!]?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    }
  }, [openArea]);

  const updateQuestion = useCallback((areaIdx: number, qIdx: number, field: keyof QuestionState, value: string) => {
    setAreaStates(prev => {
      const updated = prev.map((a, i) => {
        if (i !== areaIdx) return a;
        return { ...a, questions: { ...a.questions, [qIdx]: { ...(a.questions[qIdx] || { status: "Not Started", currentState: "", gap: "", proposedAction: "", evidenceStatus: "" as DocExists, evidenceRef: "", dueDate: "", owner: "" }), [field]: value } } };
      });
      saveArea(client.id, policyId, areaIdx, updated[areaIdx]);
      setLastSaved(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      return updated;
    });
  }, [client.id, policyId]);

  const updateAreaSummary = useCallback((areaIdx: number, text: string) => {
    setAreaStates(prev => {
      const updated = prev.map((a, i) => i !== areaIdx ? a : { ...a, summary: text });
      saveArea(client.id, policyId, areaIdx, updated[areaIdx]);
      setLastSaved(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      return updated;
    });
  }, [client.id, policyId]);

  // Safe early return after all hooks
  if (!guide) return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "28px 32px" }}>
      <Breadcrumb items={[{ label: "All Clients", onClick: onBackToClient }, { label: client.name, onClick: onBack }]} />
      <div style={{ marginTop: 32, textAlign: "center", color: "#94a3b8" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Guide not yet available</div>
        <div style={{ fontSize: 13 }}>The full discovery workbook for this framework is coming soon.</div>
      </div>
    </div>
  );

  const overallPct = (() => {
    let total = 0, done = 0;
    areaStates.forEach((a, i) => {
      guide.areas[i].questions.forEach((_q: string, qi: number) => {
        const s = a.questions[qi]?.status;
        if (s === "Not Applicable") return;
        total++; if (s === "Complete") done++;
      });
    });
    return total ? Math.round((done / total) * 100) : 0;
  })();

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "28px 32px" }}>
      <Breadcrumb items={[{ label: "All Clients", onClick: onBackToClient }, { label: client.name, onClick: onBack }, { label: stub.name }]} />

      {/* Compact phase strip — navigate between phases from within the workbook */}
      <div style={{ display: "flex", gap: 6, margin: "16px 0 4px", overflowX: "auto", paddingBottom: 2 }}>
        {PHASES.map(ph => {
          const isCurrent = ph.num === 2;
          return (
            <button key={ph.num} onClick={() => !isCurrent && ph.built && onPhaseSelect(ph.num)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 20, border: `1px solid ${isCurrent ? "#6366f1" : ph.built ? "#e2e8f0" : "#f1f5f9"}`, background: isCurrent ? "#eef2ff" : ph.built ? "#fff" : "#f8fafc", color: isCurrent ? "#4f46e5" : ph.built ? "#475569" : "#94a3b8", fontWeight: isCurrent ? 700 : 500, fontSize: 12, cursor: isCurrent ? "default" : ph.built ? "pointer" : "default", whiteSpace: "nowrap", flexShrink: 0 }}>
              <span style={{ width: 18, height: 18, borderRadius: "50%", background: isCurrent ? "#6366f1" : ph.built ? "#e2e8f0" : "#f1f5f9", color: isCurrent ? "#fff" : ph.built ? "#475569" : "#94a3b8", fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {ph.num}
              </span>
              {ph.label}
              {!ph.built && <span style={{ fontSize: 9, background: "#e2e8f0", color: "#94a3b8", borderRadius: 3, padding: "1px 4px", fontWeight: 700 }}>SOON</span>}
            </button>
          );
        })}
      </div>

      <div style={{ margin: "20px 0 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 26 }}>{stub.emoji}</span>
            <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: "#0f172a" }}>{stub.name} — AI Risk Assessment</h2>
          </div>
          <div style={{ fontSize: 13, color: "#64748b" }}>{client.name} · {client.industry}{client.geography ? ` · ${client.geography}` : ""}</div>
          {client.primaryAiUseCase && <div style={{ fontSize: 12, color: "#6366f1", marginTop: 3, fontWeight: 600 }}>AI Use Case: {client.primaryAiUseCase}</div>}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
          <div style={{ minWidth: 180 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>Overall Progress</div>
            <ProgressBar pct={overallPct} color={stub.color} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
            {lastSaved && <span style={{ fontSize: 11, color: "#15803d", fontWeight: 600 }}>✓ Saved · {lastSaved}</span>}
            <button onClick={() => exportWorkbookExcel(client, policyId, areaStates)}
              style={{ background: "#f1f5f9", color: "#0f172a", border: "1px solid #e2e8f0", borderRadius: 7, padding: "5px 12px", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>
              ⬇ Export Excel
            </button>
            <button onClick={() => setShowReport(v => !v)}
              style={{ background: showReport ? "#0f172a" : "#f1f5f9", color: showReport ? "#fff" : "#0f172a", border: "none", borderRadius: 7, padding: "5px 12px", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>
              📊 {showReport ? "Hide Report" : "Readiness Report"}
            </button>
          </div>
        </div>
      </div>

      {showReport && <ReadinessReport client={client} policyId={policyId} areaStates={areaStates}
        reportSummary={reportSummary}
        onSummaryChange={v => { setReportSummary(v); saveReportSummary(client.id, policyId, v); setLastSaved(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })); }}
      />}

      <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "11px 16px", marginBottom: 18, fontSize: 13, color: "#475569", lineHeight: 1.6 }}>
        {guide.intro}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {guide.areas.map((area, areaIdx) => {
          const { pct, done, touched, total } = getAreaProgress(client.id, policyId, areaIdx, area.questions);
          const isOpen = openArea === areaIdx;
          const aState = areaStates[areaIdx];
          const prevPhase = areaIdx > 0 ? guide.areas[areaIdx - 1].phaseGroup : null;
          const showPhaseHeader = area.phaseGroup && area.phaseGroup !== prevPhase;

          const clauseHints = getClauseSummaries(area.regulatoryRef || "");
          const isRiskClass = (area.area || "").toLowerCase().includes("risk classification");

          const PHASE_COLORS: Record<string, { bg: string; text: string; border: string; icon: string; sub: string }> = {
            "Govern & Scope":   { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0", icon: "🏛", sub: "Establish accountability, AI inventory, and prohibited use boundaries" },
            "Map & Discover":   { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe", icon: "🗺", sub: "Assess deployment context, affected groups, and supply chain risks" },
            "Measure & Assess": { bg: "#fefce8", text: "#a16207", border: "#fde068", icon: "📏", sub: "Define and measure fairness metrics, test performance, evaluate bias" },
            "Manage & Respond": { bg: "#fdf4ff", text: "#7e22ce", border: "#e9d5ff", icon: "🛡", sub: "Treat AI risks, respond to incidents, monitor drift and override rates" },
          };
          const phaseColor = area.phaseGroup ? (PHASE_COLORS[area.phaseGroup] || { bg: "#f8fafc", text: "#475569", border: "#e2e8f0", icon: "📋" }) : null;

          return (
            <div key={areaIdx}>
              {showPhaseHeader && phaseColor && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: phaseColor.bg, border: `1px solid ${phaseColor.border}`, borderRadius: 9, marginBottom: 6, marginTop: areaIdx > 0 ? 8 : 0 }}>
                  <span style={{ fontSize: 16 }}>{phaseColor.icon}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: phaseColor.text, textTransform: "uppercase", letterSpacing: "0.06em" }}>{area.phaseGroup}</div>
                    <div style={{ fontSize: 11, color: phaseColor.text, opacity: 0.75, marginTop: 1 }}>
                      {phaseColor.sub}
                    </div>
                  </div>
                </div>
              )}
            <div ref={el => { areaRefs.current[areaIdx] = el; }} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 11, overflow: "hidden" }}>
              <button onClick={() => setOpenArea(isOpen ? null : areaIdx)}
                style={{ width: "100%", background: isOpen ? "#f0f4ff" : "#fff", border: "none", padding: "13px 18px", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 12, borderBottom: isOpen ? "1px solid #c7d2fe" : "none" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#6366f1", minWidth: 26 }}>{String(areaIdx + 1).padStart(2, "0")}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{area.area}</div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{area.stakeholder} · {area.regulatoryRef}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: area.priority === "High" ? "#dc2626" : area.priority === "Medium" ? "#a16207" : "#15803d", background: area.priority === "High" ? "#fef2f2" : area.priority === "Medium" ? "#fefce8" : "#f0fdf4", borderRadius: 5, padding: "2px 7px" }}>{area.priority}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 90 }}>
                    <div style={{ width: 55, height: 4, background: isOpen ? "#334155" : "#e2e8f0", borderRadius: 99, overflow: "hidden", display: "flex" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: pct === 100 ? "#15803d" : stub.color, borderRadius: 99, flexShrink: 0 }} />
                      {touched > 0 && <div style={{ width: `${Math.round((touched / total) * 100)}%`, height: "100%", background: "#f59e0b", flexShrink: 0 }} />}
                    </div>
                    <span style={{ fontSize: 10, color: isOpen ? "#94a3b8" : "#64748b", fontWeight: 600 }}>{done}/{total}{touched > 0 && <span style={{ color: "#f59e0b" }}> +{touched}</span>}</span>
                  </div>
                  <span style={{ fontSize: 13, color: isOpen ? "#94a3b8" : "#64748b" }}>{isOpen ? "▾" : "▸"}</span>
                </div>
              </button>

              {isOpen && (
                <div style={{ padding: "18px 22px", background: "#fafafa" }}>
                  {/* Meta badges row */}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: clauseHints.length > 0 || isRiskClass ? 10 : 16 }}>
                    {[{ label: "Effort", value: area.effort }, { label: "Pillar", value: area.pillar }].map(m => (
                      <span key={m.label} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 6, padding: "3px 10px", fontSize: 11 }}>
                        <strong style={{ color: "#64748b" }}>{m.label}:</strong> <span style={{ color: "#0f172a" }}>{m.value}</span>
                      </span>
                    ))}
                    <span title={area.riskIfNotAddressed} style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, padding: "3px 10px", fontSize: 11, color: "#dc2626", cursor: "help" }}>
                      ⚠ Risk if not addressed
                    </span>
                    {area.isoMapping?.map((clause: string) => (
                      <span key={clause} style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6, padding: "3px 10px", fontSize: 11, color: "#15803d" }}>
                        🌐 ISO 42001 {clause}
                      </span>
                    ))}
                  </div>

                  {/* Clause tooltips */}
                  {clauseHints.length > 0 && (
                    <div style={{ marginBottom: 14, display: "flex", flexDirection: "column", gap: 6 }}>
                      {clauseHints.map(({ key, summary }) => (
                        <div key={key} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderLeft: "3px solid #6366f1", borderRadius: 7, padding: "8px 12px", fontSize: 12, color: "#334155", lineHeight: 1.6 }}>
                          <span style={{ fontWeight: 700, color: "#6366f1", marginRight: 6 }}>{key}</span>{summary}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Risk classification inline guide */}
                  {isRiskClass && (
                    <div style={{ marginBottom: 14, background: "#fffbeb", border: "1px solid #fde68a", borderLeft: "3px solid #f59e0b", borderRadius: 7, padding: "10px 12px" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#92400e", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>How Risk Classification Works</div>
                      {RISK_CLASSIFICATION_HINT.split("\n").map((line, i) => (
                        <div key={i} style={{ fontSize: 12, color: "#78350f", lineHeight: 1.65 }}>{line}</div>
                      ))}
                    </div>
                  )}

                  {/* Question rows — accordion: one open at a time per area */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {(() => {
                      const clientSlugs = industryToSlugs(client.industry || "");
                      return area.questions.map((question: string, qIdx: number) => {
                      const clauseRef: string | null = (area as any).clauseRefs?.[qIdx] ?? null;
                      const clauseGuidance: string | null = (area as any).guidance?.[qIdx] ?? null;
                      const industryTags: { industry: string; relevance: string }[] = (area as any).industryTags?.[qIdx] ?? [];
                      const relevance = getQuestionRelevance(industryTags, clientSlugs);
                      const qState = aState.questions[qIdx] || { status: "Not Started", currentState: "", gap: "", proposedAction: "", evidenceStatus: "" as DocExists, evidenceRef: "", dueDate: "", owner: "" };
                      const scfg = STATUS_CONFIG[qState.status as QStatus];
                      const isNA = qState.status === "Not Applicable";
                      const isQOpen = openQuestions[areaIdx] === qIdx;
                      const depIdx: number | undefined = (area as any).questionDeps?.[qIdx];
                      const depState = depIdx !== undefined ? (aState.questions[depIdx] || { status: "Not Started", currentState: "" }) : undefined;
                      const isBlocked = depState !== undefined && !depState.currentState?.trim() && depState.status === "Not Started";
                      const hasContent = !!(qState.currentState || qState.gap || qState.proposedAction || qState.owner);

                      return (
                        <div key={qIdx} style={{ border: `1px solid ${isQOpen ? scfg.border : "#e2e8f0"}`, borderLeft: `4px solid ${isQOpen ? scfg.border : (hasContent ? "#94a3b8" : "#e2e8f0")}`, borderRadius: 9, overflow: "hidden", opacity: isNA ? 0.55 : isBlocked && !isQOpen ? 0.65 : 1 }}>

                          {/* Collapsed header — always visible, click to expand */}
                          <button onClick={() => setOpenQuestions(prev => ({ ...prev, [areaIdx]: prev[areaIdx] === qIdx ? null : qIdx }))}
                            style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: isQOpen ? scfg.bg : "#fff", border: "none", cursor: "pointer", textAlign: "left" }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", minWidth: 20, flexShrink: 0 }}>{qIdx + 1}.</span>
                            <div style={{ flex: 1 }}>
                              <p style={{ margin: 0, fontSize: 13, color: isNA ? "#94a3b8" : "#0f172a", lineHeight: 1.5, fontWeight: 500, textDecoration: isNA ? "line-through" : "none", textAlign: "left" }}>{question}</p>
                              {clauseRef && <span style={{ fontSize: 10, fontWeight: 700, color: "#6366f1", background: "#eef2ff", borderRadius: 4, padding: "1px 6px", marginTop: 3, display: "inline-block" }}>{clauseRef}</span>}
                              {relevance === "critical" && <span style={{ fontSize: 10, fontWeight: 700, color: "#b45309", background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 4, padding: "1px 6px", marginTop: 3, display: "inline-block", marginLeft: clauseRef ? 4 : 0 }}>⚡ Critical for your sector</span>}
                              {relevance === "high" && <span style={{ fontSize: 10, fontWeight: 600, color: "#a16207", background: "#fefce8", border: "1px solid #fde68a", borderRadius: 4, padding: "1px 6px", marginTop: 3, display: "inline-block", marginLeft: clauseRef ? 4 : 0 }}>↑ High relevance for your sector</span>}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                              {qState.owner && !isQOpen && <span style={{ fontSize: 10, color: "#64748b", background: "#f1f5f9", borderRadius: 4, padding: "1px 6px" }}>{qState.owner}</span>}
                              {qState.evidenceStatus && !isQOpen && <span style={{ fontSize: 10, fontWeight: 700, color: qState.evidenceStatus === "Yes" ? "#15803d" : qState.evidenceStatus === "Partial" ? "#a16207" : "#dc2626", background: qState.evidenceStatus === "Yes" ? "#f0fdf4" : qState.evidenceStatus === "Partial" ? "#fefce8" : "#fef2f2", borderRadius: 4, padding: "1px 6px" }}>{qState.evidenceStatus}</span>}
                              {!isQOpen && !isNA && (() => {
                                const filled = [qState.currentState, qState.gap, qState.proposedAction].filter(s => s?.trim()).length;
                                return <span style={{ fontSize: 10, color: filled === 3 ? "#15803d" : filled > 0 ? "#a16207" : "#cbd5e1", fontWeight: 600, minWidth: 22, textAlign: "right" }}>{filled}/3</span>;
                              })()}
                              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5, background: scfg.bg, color: scfg.text, border: `1px solid ${scfg.border}`, whiteSpace: "nowrap" }}>{qState.status}</span>
                              <span style={{ fontSize: 11, color: "#94a3b8" }}>{isQOpen ? "▾" : "▸"}</span>
                            </div>
                          </button>

                          {/* Expanded body */}
                          {isQOpen && (
                            <div style={{ padding: "12px 14px 14px", background: "#fafafa", borderTop: `1px solid ${scfg.border}` }}>
                              {/* Dependency hint */}
                              {isBlocked && (
                                <div style={{ marginBottom: 10, fontSize: 11, color: "#a16207", background: "#fefce8", border: "1px solid #fde047", borderRadius: 6, padding: "5px 10px", display: "inline-flex", alignItems: "center", gap: 6 }}>
                                  ↑ Complete Q{(depIdx! + 1)} above first — this question builds on that answer
                                </div>
                              )}

                              {/* Clause reference + guidance panel */}
                              {clauseGuidance && (
                                <div style={{ marginBottom: 10, background: "#f5f3ff", border: "1px solid #ddd6fe", borderLeft: "3px solid #6366f1", borderRadius: 7, padding: "8px 12px" }}>
                                  {clauseRef && <div style={{ fontSize: 10, fontWeight: 800, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{clauseRef}</div>}
                                  <div style={{ fontSize: 12, color: "#4c1d95", lineHeight: 1.65 }}>{clauseGuidance}</div>
                                </div>
                              )}

                              {/* Status / Owner / Due row */}
                              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end", marginBottom: isNA ? 0 : 10 }}>
                                <div>
                                  <label style={{ fontSize: 10, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>Status</label>
                                  <select value={qState.status} onChange={e => updateQuestion(areaIdx, qIdx, "status", e.target.value)}
                                    style={{ padding: "5px 9px", border: `1px solid ${scfg.border}`, borderRadius: 6, fontSize: 12, fontWeight: 600, background: scfg.bg, color: scfg.text, cursor: "pointer" }}>
                                    {(["Not Started", "In Progress", "Complete", "On Hold", "Not Applicable"] as QStatus[]).map(s => <option key={s}>{s}</option>)}
                                  </select>
                                </div>
                                {!isNA && (<>
                                  <div>
                                    <label style={{ fontSize: 10, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>Owner / Role</label>
                                    <input value={qState.owner || ""} onChange={e => updateQuestion(areaIdx, qIdx, "owner", e.target.value)}
                                      placeholder="e.g. Legal, CTO, DPO"
                                      style={{ padding: "5px 9px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12, outline: "none", width: 130 }} />
                                  </div>
                                  <div>
                                    <label style={{ fontSize: 10, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>Due Date</label>
                                    <input type="date" value={qState.dueDate || ""} onChange={e => updateQuestion(areaIdx, qIdx, "dueDate", e.target.value)}
                                      style={{ padding: "5px 9px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12, outline: "none", cursor: "pointer" }} />
                                  </div>
                                </>)}
                              </div>

                              {/* Gap analysis fields */}
                              {!isNA && (
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                  <div>
                                    <label style={{ fontSize: 10, fontWeight: 700, color: "#0369a1", display: "block", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>Current State</label>
                                    <textarea value={qState.currentState || ""} onChange={e => updateQuestion(areaIdx, qIdx, "currentState", e.target.value)}
                                      placeholder="Describe what currently exists in the organisation for this control area…"
                                      rows={2} style={{ width: "100%", padding: "6px 9px", border: "1px solid #bae6fd", borderRadius: 6, fontSize: 12, outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit", background: "#f0f9ff" }} />
                                  </div>
                                  <div>
                                    <label style={{ fontSize: 10, fontWeight: 700, color: "#b45309", display: "block", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>Gap / Finding</label>
                                    <textarea value={qState.gap || ""} onChange={e => updateQuestion(areaIdx, qIdx, "gap", e.target.value)}
                                      placeholder="What is missing or insufficient relative to what this requirement demands?"
                                      rows={2} style={{ width: "100%", padding: "6px 9px", border: "1px solid #fde68a", borderRadius: 6, fontSize: 12, outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit", background: "#fffbeb" }} />
                                  </div>
                                  <div>
                                    <label style={{ fontSize: 10, fontWeight: 700, color: "#15803d", display: "block", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>Proposed Action</label>
                                    <textarea value={qState.proposedAction || ""} onChange={e => updateQuestion(areaIdx, qIdx, "proposedAction", e.target.value)}
                                      placeholder="What needs to be built, documented, or assigned to close this gap?"
                                      rows={2} style={{ width: "100%", padding: "6px 9px", border: "1px solid #bbf7d0", borderRadius: 6, fontSize: 12, outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit", background: "#f0fdf4" }} />
                                  </div>
                                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
                                    <div>
                                      <label style={{ fontSize: 10, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>Evidence?</label>
                                      <select value={qState.evidenceStatus || ""} onChange={e => updateQuestion(areaIdx, qIdx, "evidenceStatus", e.target.value)}
                                        style={{ padding: "5px 9px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12, background: "#fff", cursor: "pointer" }}>
                                        <option value="">—</option>
                                        <option>Yes</option><option>Partial</option><option>No</option>
                                      </select>
                                    </div>
                                    <div style={{ flex: 1, minWidth: 220 }}>
                                      <label style={{ fontSize: 10, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>Evidence Reference</label>
                                      <input value={qState.evidenceRef || ""} onChange={e => updateQuestion(areaIdx, qIdx, "evidenceRef", e.target.value)}
                                        placeholder="Link, filename, or location of supporting documentation…"
                                        style={{ width: "100%", padding: "5px 9px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12, outline: "none", boxSizing: "border-box" }} />
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    }); })()}
                  </div>

                  {/* Evidence to collect */}
                  {area.evidenceToCollect?.length > 0 && (
                    <div style={{ marginTop: 14, background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 9, padding: "11px 14px" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#3b82f6", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 7 }}>Evidence to Collect</div>
                      {area.evidenceToCollect.map((e: string, i: number) => <div key={i} style={{ fontSize: 12, color: "#334155", marginBottom: 3 }}>→ {e}</div>)}
                    </div>
                  )}

                  {/* Maturity indicators */}
                  {area.maturityIndicators && (
                    <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 7 }}>
                      {[
                        { key: "notStarted", label: "Not Started", bg: "#fef2f2", text: "#b91c1c" },
                        { key: "developing",  label: "Developing",  bg: "#fff7ed", text: "#c2410c" },
                        { key: "defined",     label: "Defined",     bg: "#fefce8", text: "#92400e" },
                        { key: "optimised",   label: "Optimised",   bg: "#f0fdf4", text: "#166534" },
                      ].map(m => (
                        <div key={m.key} style={{ background: m.bg, borderRadius: 7, padding: "7px 10px" }}>
                          <div style={{ fontSize: 9, fontWeight: 700, color: m.text, marginBottom: 3, textTransform: "uppercase" }}>{m.label}</div>
                          <p style={{ margin: 0, fontSize: 11, color: "#475569", lineHeight: 1.5 }}>{(area.maturityIndicators as any)[m.key]}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Section summary */}
                  <div style={{ marginTop: 16, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 9, padding: "12px 14px" }}>
                    <label style={{ fontSize: 10, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Section Summary &amp; Findings
                    </label>
                    <textarea
                      value={(aState?.summary) || ""}
                      onChange={e => updateAreaSummary(areaIdx, e.target.value)}
                      placeholder="Summarise the key findings, agreed actions, or overall assessment for this section…"
                      rows={3}
                      style={{ width: "100%", padding: "7px 10px", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 12, outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit", color: "#0f172a", background: "#fff" }}
                    />
                  </div>
                </div>
              )}
            </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── RISK SCORING CONSTANTS & HELPERS ────────────────────────────────────────
const LIKELIHOOD_LABELS = ["", "1 – Rare", "2 – Unlikely", "3 – Possible", "4 – Likely", "5 – Almost Certain"];
const IMPACT_LABELS      = ["", "1 – Negligible", "2 – Minor", "3 – Moderate", "4 – Major", "5 – Catastrophic"];

const STATUS_COLORS: Record<RiskStatus, { bg: string; text: string; border: string }> = {
  "Open":        { bg: "#fef2f2", text: "#b91c1c", border: "#fecaca" },
  "In Progress": { bg: "#fefce8", text: "#a16207", border: "#fde047" },
  "Resolved":    { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0" },
  "Accepted":    { bg: "#f5f3ff", text: "#7c3aed", border: "#ddd6fe" },
};

function AuditLogInput({ onAdd }: { onAdd: (note: string) => void }) {
  const [note, setNote] = useState("");
  return (
    <div style={{ display: "flex", gap: 6 }}>
      <input value={note} onChange={e => setNote(e.target.value)} placeholder="Add audit note…"
        style={{ flex: 1, padding: "5px 8px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 11, outline: "none", fontFamily: "inherit" }}
        onKeyDown={e => { if (e.key === "Enter" && note.trim()) { onAdd(note.trim()); setNote(""); } }}
      />
      <button onClick={() => { if (note.trim()) { onAdd(note.trim()); setNote(""); } }}
        style={{ fontSize: 11, fontWeight: 700, background: "#0f172a", color: "#fff", border: "none", borderRadius: 6, padding: "5px 12px", cursor: "pointer", whiteSpace: "nowrap" }}>
        + Add
      </button>
    </div>
  );
}

function RiskLevelBadge({ l, i }: { l: number; i: number }) {
  const lvl = riskLevel(l, i);
  const cfg = RISK_LEVEL_CONFIG[lvl];
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 5, background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}`, whiteSpace: "nowrap" }}>
      {lvl} ({l * i})
    </span>
  );
}

const FINDING_FIELDS: Array<{ key: "condition" | "criteria" | "cause" | "effect" | "recommendation"; label: string; hint: string }> = [
  { key: "condition",      label: "Condition",      hint: "What is the current situation? (the what)" },
  { key: "criteria",       label: "Criteria",       hint: "What standard or requirement applies? (the should)" },
  { key: "cause",          label: "Cause",          hint: "Why does the gap exist? (the root cause)" },
  { key: "effect",         label: "Effect",         hint: "What is the consequence if unaddressed? (the risk impact)" },
  { key: "recommendation", label: "Recommendation", hint: "What action is recommended? (the fix)" },
];

// ─── VIEW 4: RISK REGISTER ────────────────────────────────────────────────────
function inferRiskCategory(areaName: string): string {
  const a = areaName.toLowerCase();
  if (a.includes("bias") || a.includes("fairness") || a.includes("discriminat")) return "Data Bias & Fairness";
  if (a.includes("transparency") || a.includes("explainab") || a.includes("interpret")) return "Transparency & Explainability";
  if (a.includes("security") || a.includes("adversarial") || a.includes("cybersec") || a.includes("robustness")) return "Security & Adversarial Risk";
  if (a.includes("privacy") || a.includes("data protection") || a.includes("personal data")) return "Privacy & Data Protection";
  if (a.includes("compliance") || a.includes("regulatory") || a.includes("legal") || a.includes("regulation")) return "Regulatory Non-Compliance";
  if (a.includes("oversight") || a.includes("human-in") || a.includes("human in")) return "Human Oversight Failure";
  if (a.includes("vendor") || a.includes("third") || a.includes("supply chain") || a.includes("procurement")) return "Third-Party / Vendor Risk";
  if (a.includes("performance") || a.includes("drift") || a.includes("monitor") || a.includes("accuracy") || a.includes("evaluat")) return "Model Performance & Drift";
  if (a.includes("rights") || a.includes("fundamental") || a.includes("impact assess")) return "Fundamental Rights Violation";
  if (a.includes("governance") || a.includes("accountability") || a.includes("responsibility") || a.includes("risk manag")) return "Governance & Accountability";
  return "";
}

function RiskRegisterView({ client, onBack, onBackToClients, onNextPhase }: {
  client: Client; onBack: () => void; onBackToClients: () => void; onNextPhase?: () => void;
}) {
  const [risks, setRisks] = useState<RiskEntry[]>(() => loadRisks(client.id));
  const [openRisk, setOpenRisk] = useState<string | null>(null);
  const [riskSummaryText, setRiskSummaryText] = useState(() => localStorage.getItem(riskSummaryKey(client.id)) || "");
  const [lastSaved, setLastSaved] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);
  const [pendingGaps, setPendingGaps] = useState<PendingGap[]>([]);
  const [selectedGapIds, setSelectedGapIds] = useState<Set<string>>(new Set());
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [riskLevelFilter, setRiskLevelFilter] = useState<RiskLevel | null>(null);
  const [sortBy, setSortBy] = useState<"default" | "score-desc" | "due-asc" | "status">("default");

  const persist = (updated: RiskEntry[]) => {
    saveRisks(client.id, updated);
    setLastSaved(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
  };

  const addRisk = () => {
    const num = risks.length + 1;
    const r: RiskEntry = {
      id: crypto.randomUUID(), riskId: `R-${String(num).padStart(3, "0")}`,
      sourceArea: "", affectedSystem: client.aiSystemName || "", riskCategory: "",
      description: "", likelihoodAtScale: "",
      inherentLikelihood: 3, inherentImpact: 3, residualLikelihood: 2, residualImpact: 2,
      controls: [], condition: "", criteria: "", cause: "", effect: "", recommendation: "",
      owner: "", dueDate: "", status: "Open", escalationNotes: "",
      treatmentDecision: "", clauseRef: "", residualAcceptedBy: "", residualAcceptedDate: "",
      controlTestDate: "", nextReviewDate: "", auditLog: [],
    };
    const updated = [...risks, r];
    setRisks(updated); persist(updated); setOpenRisk(r.id);
  };

  const openImportModal = () => {
    const existingDescs = new Set(risks.map(r => r.description.trim().toLowerCase()));
    const gaps: PendingGap[] = [];
    client.activePolicies.forEach(policyId => {
      const guide = (IMPLEMENTATION_GUIDES as Record<string, any>)[policyId];
      if (!guide) return;
      const policyName = POLICY_STUBS.find(p => p.id === policyId)?.shortName || policyId;
      guide.areas.forEach((area: any, ai: number) => {
        const st = loadArea(client.id, policyId, ai);
        area.questions.forEach((_q: string, qi: number) => {
          const qs = st.questions[qi];
          if (!qs?.gap?.trim()) return;
          const gapText = qs.gap.trim();
          const alreadyImported = existingDescs.has(gapText.toLowerCase());
          // Recommendation logic
          const isWellManaged = (qs.status === "In Progress" || qs.status === "Complete")
            && qs.proposedAction?.trim() && qs.owner?.trim() && qs.dueDate?.trim();
          const isHighPriority = area.priority === "High";
          const noEvidence = qs.evidenceStatus === "No";
          const notActioned = !qs.status || qs.status === "Not Started";
          const onHold = qs.status === "On Hold";
          const recommended = !alreadyImported && !isWellManaged && (isHighPriority || noEvidence || notActioned || onHold);
          let recommendReason = "";
          if (recommended) {
            if (isHighPriority && notActioned) recommendReason = "High priority · not started";
            else if (isHighPriority && onHold) recommendReason = "High priority · on hold";
            else if (isHighPriority) recommendReason = "High priority area";
            else if (onHold) recommendReason = "On hold — needs escalation";
            else if (noEvidence) recommendReason = "No mitigation evidence";
            else if (notActioned) recommendReason = "Gap not yet actioned";
          }
          gaps.push({
            id: crypto.randomUUID(), policyId, policyName,
            area: area.area, areaPriority: area.priority || "Medium",
            gap: gapText, proposedAction: qs.proposedAction?.trim() || "",
            owner: qs.owner || "", dueDate: qs.dueDate || "",
            questionStatus: qs.status || "Not Started",
            evidenceStatus: qs.evidenceStatus || "",
            recommended, recommendReason, alreadyImported,
          });
        });
      });
    });
    if (gaps.length === 0) { alert("No Phase 2 gap fields found. Fill in Gap / Finding fields in the questionnaire first."); return; }
    // Sort: recommended first, then not-recommended, then already imported at bottom
    gaps.sort((a, b) => {
      if (a.alreadyImported !== b.alreadyImported) return a.alreadyImported ? 1 : -1;
      if (a.recommended !== b.recommended) return a.recommended ? -1 : 1;
      return 0;
    });
    setPendingGaps(gaps);
    setSelectedGapIds(new Set(gaps.filter(g => g.recommended).map(g => g.id)));
    setShowImportModal(true);
  };

  const confirmImport = () => {
    const toImport = pendingGaps.filter(g => selectedGapIds.has(g.id));
    const seeds: RiskEntry[] = toImport.map((g, idx) => ({
      id: crypto.randomUUID(), riskId: `R-${String(risks.length + idx + 1).padStart(3, "0")}`,
      sourceArea: g.area, affectedSystem: client.aiSystemName || "", riskCategory: inferRiskCategory(g.area),
      description: g.gap, likelihoodAtScale: "",
      inherentLikelihood: 3, inherentImpact: 3, residualLikelihood: 2, residualImpact: 2,
      controls: [], condition: g.gap, criteria: g.area, cause: "",
      effect: "", recommendation: g.proposedAction,
      owner: g.owner, dueDate: g.dueDate, status: "Open" as RiskStatus, escalationNotes: "",
      treatmentDecision: "" as RiskTreatment, clauseRef: "", residualAcceptedBy: "", residualAcceptedDate: "",
      controlTestDate: "", nextReviewDate: "", auditLog: [],
    }));
    const updated = [...risks, ...seeds];
    setRisks(updated); persist(updated);
    setShowImportModal(false); setPendingGaps([]); setSelectedGapIds(new Set());
  };

  const updateRisk = (id: string, patch: Partial<RiskEntry>) => {
    setRisks(prev => { const updated = prev.map(r => r.id === id ? { ...r, ...patch } : r); persist(updated); return updated; });
  };

  const deleteRisk = (id: string) => {
    if (!confirm("Delete this risk entry? The associated gap will re-appear as importable in Phase 2 next time you open the import modal.")) return;
    setRisks(prev => { const updated = prev.filter(r => r.id !== id); persist(updated); return updated; });
  };

  const addControl = (riskId: string) => {
    const risk = risks.find(r => r.id === riskId);
    if (!risk) return;
    updateRisk(riskId, { controls: [...risk.controls, { type: "Preventive", description: "", owner: "", status: "Not Implemented", effectiveness: "" }] });
  };

  const updateControl = (riskId: string, idx: number, patch: Partial<RiskControl>) => {
    const risk = risks.find(r => r.id === riskId);
    if (!risk) return;
    updateRisk(riskId, { controls: risk.controls.map((c, i) => i === idx ? { ...c, ...patch } : c) });
  };

  const removeControl = (riskId: string, idx: number) => {
    const risk = risks.find(r => r.id === riskId);
    if (!risk) return;
    updateRisk(riskId, { controls: risk.controls.filter((_, i) => i !== idx) });
  };

  const counts: Record<RiskLevel, number> = { Critical: 0, High: 0, Medium: 0, Low: 0 };
  risks.forEach(r => counts[riskLevel(r.residualLikelihood, r.residualImpact)]++);
  const overdueCount = risks.filter(isOverdue).length;
  let visibleRisks = overdueOnly ? risks.filter(isOverdue) : [...risks];
  if (riskLevelFilter) visibleRisks = visibleRisks.filter(r => riskLevel(r.residualLikelihood, r.residualImpact) === riskLevelFilter);
  if (sortBy === "score-desc") visibleRisks = [...visibleRisks].sort((a, b) => b.residualLikelihood * b.residualImpact - a.residualLikelihood * a.residualImpact);
  else if (sortBy === "due-asc") visibleRisks = [...visibleRisks].sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999"));
  else if (sortBy === "status") { const order = ["Open", "In Progress", "On Hold", "Accepted", "Resolved"]; visibleRisks = [...visibleRisks].sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status)); }

  const ipt: React.CSSProperties = { width: "100%", padding: "7px 10px", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 12, outline: "none", boxSizing: "border-box", fontFamily: "inherit" };
  const ta: React.CSSProperties  = { ...ipt, resize: "vertical" };
  const sel: React.CSSProperties = { ...ipt, background: "#fff", cursor: "pointer" };

  return (
    <div style={{ maxWidth: 1040, margin: "0 auto", padding: "28px 32px" }}>
      <Breadcrumb items={[
        { label: "All Clients", onClick: onBackToClients },
        { label: client.name, onClick: onBack },
        { label: "Risk Register" },
      ]} />

      {/* Header */}
      <div style={{ margin: "20px 0 20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ margin: "0 0 6px", fontSize: 19, fontWeight: 800, color: "#0f172a" }}>⚠️ Phase 3 — Measure & Assess · Risk Register</h2>
          <div style={{ fontSize: 13, color: "#64748b" }}>{client.name} · {client.industry}{client.geography ? ` · ${client.geography}` : ""}</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {lastSaved && <span style={{ fontSize: 11, color: "#15803d", fontWeight: 600 }}>✓ Saved · {lastSaved}</span>}
          <button onClick={openImportModal} style={{ background: "#f0f9ff", color: "#0369a1", border: "1px solid #bae6fd", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
            ⬇ Import from Phase 2
          </button>
          <button onClick={addRisk} style={{ background: "#0f172a", color: "#fff", border: "none", borderRadius: 8, padding: "7px 16px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
            + Add Risk
          </button>
        </div>
      </div>

      {/* Risk summary bar */}
      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 10, background: "#f8fafc", borderRadius: 8, padding: "7px 12px", border: "1px solid #e2e8f0" }}>
        <strong>Risk scoring:</strong> Likelihood × Impact (1–5 each). Score ≥16 = Critical · ≥9 = High · ≥4 = Medium · &lt;4 = Low. <span style={{ color: "#6366f1" }}>Click a level to filter.</span>
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
        {(["Critical", "High", "Medium", "Low"] as RiskLevel[]).map(lvl => {
          const cfg = RISK_LEVEL_CONFIG[lvl];
          const isActive = riskLevelFilter === lvl;
          return (
            <button key={lvl} onClick={() => setRiskLevelFilter(isActive ? null : lvl)}
              style={{ background: isActive ? cfg.text : cfg.bg, border: `2px solid ${isActive ? cfg.text : cfg.border}`, borderRadius: 10, padding: "10px 18px", display: "flex", flexDirection: "column", alignItems: "center", minWidth: 80, cursor: "pointer" }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: isActive ? "#fff" : cfg.text }}>{counts[lvl]}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: isActive ? "#fff" : cfg.text }}>{lvl}</span>
            </button>
          );
        })}
        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 18px", display: "flex", flexDirection: "column", alignItems: "center", minWidth: 80 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>{risks.length}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>Total</span>
        </div>
        {overdueCount > 0 && (
          <button onClick={() => setOverdueOnly(v => !v)}
            style={{ background: overdueOnly ? "#fef2f2" : "#fff", border: `1px solid ${overdueOnly ? "#fca5a5" : "#fecaca"}`, borderRadius: 10, padding: "10px 18px", display: "flex", flexDirection: "column", alignItems: "center", minWidth: 80, cursor: "pointer" }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: "#dc2626" }}>{overdueCount}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#dc2626" }}>Overdue</span>
          </button>
        )}
      </div>
      {/* Active filter + sort */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
        {riskLevelFilter && (
          <div style={{ fontSize: 12, color: "#6366f1", fontWeight: 600, background: "#eef2ff", padding: "4px 10px", borderRadius: 6, border: "1px solid #c7d2fe", display: "flex", alignItems: "center", gap: 6 }}>
            Showing: {riskLevelFilter} only
            <button onClick={() => setRiskLevelFilter(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6366f1", fontSize: 13, fontWeight: 700, lineHeight: 1, padding: 0 }}>✕</button>
          </div>
        )}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
          <label style={{ fontSize: 11, color: "#64748b", fontWeight: 600, whiteSpace: "nowrap" }}>Sort by:</label>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}
            style={{ fontSize: 12, padding: "4px 8px", border: "1px solid #e2e8f0", borderRadius: 6, background: "#fff", cursor: "pointer", outline: "none" }}>
            <option value="default">Added order</option>
            <option value="score-desc">Highest risk first</option>
            <option value="due-asc">Due date (soonest first)</option>
            <option value="status">Status</option>
          </select>
        </div>
      </div>

      {/* Risk register */}
      {risks.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8", background: "#f8fafc", borderRadius: 12, border: "1px dashed #e2e8f0", marginBottom: 24 }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>⚠️</div>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>No risks identified yet</div>
          <div style={{ fontSize: 12, marginBottom: 18 }}>Import gaps from Phase 2 or add a risk manually.</div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button onClick={openImportModal} style={{ background: "#f0f9ff", color: "#0369a1", border: "1px solid #bae6fd", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
              ⬇ Import from Phase 2
            </button>
            <button onClick={addRisk} style={{ background: "#0f172a", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
              + Add Risk
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
          {overdueOnly && <div style={{ fontSize: 12, color: "#dc2626", fontWeight: 600, padding: "6px 10px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8 }}>Showing {overdueCount} overdue risk{overdueCount !== 1 ? "s" : ""} — <button onClick={() => setOverdueOnly(false)} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontWeight: 700, textDecoration: "underline", fontSize: 12 }}>Show all</button></div>}
          {visibleRisks.map(risk => {
            const isOpen = openRisk === risk.id;
            const sCfg = STATUS_COLORS[risk.status];
            const overdue = isOverdue(risk);
            return (
              <div key={risk.id} style={{ background: "#fff", border: `1px solid ${isOpen ? "#a5b4fc" : "#e2e8f0"}`, borderRadius: 12, overflow: "hidden", boxShadow: isOpen ? "0 4px 16px rgba(99,102,241,0.1)" : "0 1px 4px rgba(0,0,0,0.04)" }}>

                {/* Collapsed row */}
                <div onClick={() => setOpenRisk(isOpen ? null : risk.id)}
                  style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", background: isOpen ? "#f5f3ff" : "#fff" }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#6366f1", minWidth: 50, flexShrink: 0 }}>{risk.riskId || "—"}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#334155", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {risk.description || <span style={{ color: "#94a3b8", fontStyle: "italic" }}>No description</span>}
                  </span>
                  <span style={{ fontSize: 10, color: "#64748b", minWidth: 110, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{risk.sourceArea || "—"}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: "#64748b", flexShrink: 0 }}>I:</span>
                  <RiskLevelBadge l={risk.inherentLikelihood} i={risk.inherentImpact} />
                  <span style={{ fontSize: 10, fontWeight: 600, color: "#64748b", flexShrink: 0 }}>R:</span>
                  <RiskLevelBadge l={risk.residualLikelihood} i={risk.residualImpact} />
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 5, background: sCfg.bg, color: sCfg.text, border: `1px solid ${sCfg.border}`, whiteSpace: "nowrap", flexShrink: 0 }}>{risk.status}</span>
                  {overdue && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 5, background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", whiteSpace: "nowrap", flexShrink: 0 }}>⚠ Overdue</span>}
                  <span style={{ fontSize: 12, color: "#94a3b8", flexShrink: 0 }}>{isOpen ? "▲" : "▼"}</span>
                </div>

                {/* Expanded form */}
                {isOpen && (
                  <div style={{ padding: "20px 20px 24px", borderTop: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: 24 }}>

                    {/* A: Risk Identification */}
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>A — Risk Identification</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 2fr", gap: 12, marginBottom: 12 }}>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Risk ID</label>
                          <input value={risk.riskId} onChange={e => updateRisk(risk.id, { riskId: e.target.value })} style={ipt} />
                        </div>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Source Area / Framework Section</label>
                          <input value={risk.sourceArea} onChange={e => updateRisk(risk.id, { sourceArea: e.target.value })} placeholder="e.g. Risk Management" style={ipt} />
                        </div>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Affected AI System</label>
                          <input value={risk.affectedSystem} onChange={e => updateRisk(risk.id, { affectedSystem: e.target.value })} style={ipt} />
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Risk Category</label>
                          <select value={risk.riskCategory} onChange={e => updateRisk(risk.id, { riskCategory: e.target.value })} style={sel}>
                            <option value="">Select…</option>
                            {RISK_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Treatment Decision (4T)</label>
                          <select value={risk.treatmentDecision} onChange={e => updateRisk(risk.id, { treatmentDecision: e.target.value as RiskTreatment })} style={sel}>
                            <option value="">Select…</option>
                            <option value="Treat">Treat — implement controls</option>
                            <option value="Transfer">Transfer — insurance / vendor liability</option>
                            <option value="Tolerate">Tolerate — accept within appetite</option>
                            <option value="Terminate">Terminate — decommission / stop use</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Regulatory Clause Ref</label>
                          <input value={risk.clauseRef} onChange={e => updateRisk(risk.id, { clauseRef: e.target.value })} placeholder="e.g. EU AI Act Art. 9(2)(b)" style={ipt} />
                        </div>
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Likelihood at Scale (qualitative)</label>
                        <input value={risk.likelihoodAtScale} onChange={e => updateRisk(risk.id, { likelihoodAtScale: e.target.value })} placeholder="e.g. High volume automated decisions → systemic impact" style={ipt} />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Risk Description</label>
                        <textarea value={risk.description} onChange={e => updateRisk(risk.id, { description: e.target.value })} rows={3} placeholder="Describe the risk clearly…" style={ta} />
                      </div>
                    </div>

                    {/* B: Risk Scoring */}
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>B — Risk Scoring (L × I)</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                        {/* Inherent */}
                        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: 16 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#b91c1c", marginBottom: 12 }}>Inherent Risk (before controls)</div>
                          <div style={{ marginBottom: 10 }}>
                            <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                              <span>Likelihood</span><span style={{ color: "#0f172a" }}>{LIKELIHOOD_LABELS[risk.inherentLikelihood]}</span>
                            </label>
                            <input type="range" min={1} max={5} value={risk.inherentLikelihood} onChange={e => updateRisk(risk.id, { inherentLikelihood: Number(e.target.value) })} style={{ width: "100%" }} />
                          </div>
                          <div style={{ marginBottom: 14 }}>
                            <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                              <span>Impact</span><span style={{ color: "#0f172a" }}>{IMPACT_LABELS[risk.inherentImpact]}</span>
                            </label>
                            <input type="range" min={1} max={5} value={risk.inherentImpact} onChange={e => updateRisk(risk.id, { inherentImpact: Number(e.target.value) })} style={{ width: "100%" }} />
                          </div>
                          <div style={{ textAlign: "center" }}><RiskLevelBadge l={risk.inherentLikelihood} i={risk.inherentImpact} /></div>
                        </div>
                        {/* Residual */}
                        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: 16 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#15803d", marginBottom: 12 }}>Residual Risk (after controls)</div>
                          <div style={{ marginBottom: 10 }}>
                            <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                              <span>Likelihood</span><span style={{ color: "#0f172a" }}>{LIKELIHOOD_LABELS[risk.residualLikelihood]}</span>
                            </label>
                            <input type="range" min={1} max={5} value={risk.residualLikelihood} onChange={e => updateRisk(risk.id, { residualLikelihood: Number(e.target.value) })} style={{ width: "100%" }} />
                          </div>
                          <div style={{ marginBottom: 14 }}>
                            <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                              <span>Impact</span><span style={{ color: "#0f172a" }}>{IMPACT_LABELS[risk.residualImpact]}</span>
                            </label>
                            <input type="range" min={1} max={5} value={risk.residualImpact} onChange={e => updateRisk(risk.id, { residualImpact: Number(e.target.value) })} style={{ width: "100%" }} />
                          </div>
                          <div style={{ textAlign: "center" }}><RiskLevelBadge l={risk.residualLikelihood} i={risk.residualImpact} /></div>
                        </div>
                      </div>
                    </div>

                    {/* C: Controls */}
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>C — Controls</div>
                      {risk.controls.length === 0
                        ? <div style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic", marginBottom: 10 }}>No controls added yet.</div>
                        : (
                          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
                            {risk.controls.map((ctrl, ci) => (
                              <div key={ci} style={{ display: "grid", gridTemplateColumns: "1fr 3fr 1fr 1fr 1fr auto", gap: 8, alignItems: "end", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 12px" }}>
                                <div>
                                  <label style={{ fontSize: 10, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 3 }}>Type</label>
                                  <select value={ctrl.type} onChange={e => updateControl(risk.id, ci, { type: e.target.value as ControlType })} style={{ ...sel, fontSize: 11 }}>
                                    {(["Preventive", "Detective", "Corrective"] as ControlType[]).map(t => <option key={t}>{t}</option>)}
                                  </select>
                                </div>
                                <div>
                                  <label style={{ fontSize: 10, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 3 }}>Description</label>
                                  <input value={ctrl.description} onChange={e => updateControl(risk.id, ci, { description: e.target.value })} placeholder="Describe the control…" style={{ ...ipt, fontSize: 11 }} />
                                </div>
                                <div>
                                  <label style={{ fontSize: 10, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 3 }}>Owner</label>
                                  <input value={ctrl.owner} onChange={e => updateControl(risk.id, ci, { owner: e.target.value })} style={{ ...ipt, fontSize: 11 }} />
                                </div>
                                <div>
                                  <label style={{ fontSize: 10, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 3 }}>Status</label>
                                  <select value={ctrl.status} onChange={e => updateControl(risk.id, ci, { status: e.target.value as ControlStatus })} style={{ ...sel, fontSize: 11 }}>
                                    {(["Not Implemented", "Partially Implemented", "Implemented", "N/A"] as ControlStatus[]).map(s => <option key={s}>{s}</option>)}
                                  </select>
                                </div>
                                <div>
                                  <label style={{ fontSize: 10, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 3 }}>Effectiveness</label>
                                  <select value={ctrl.effectiveness} onChange={e => updateControl(risk.id, ci, { effectiveness: e.target.value as ControlEffectiveness })} style={{ ...sel, fontSize: 11 }}>
                                    {(["", "Effective", "Partially Effective", "Ineffective", "Not Tested"] as ControlEffectiveness[]).map(s => <option key={s} value={s}>{s || "Not Assessed"}</option>)}
                                  </select>
                                </div>
                                <button onClick={() => removeControl(risk.id, ci)} title="Remove" style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 14, paddingBottom: 2 }}>✕</button>
                              </div>
                            ))}
                          </div>
                        )}
                      <button onClick={() => addControl(risk.id)} style={{ background: "#f0f9ff", color: "#0369a1", border: "1px solid #bae6fd", borderRadius: 7, padding: "6px 14px", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>
                        + Add Control
                      </button>
                    </div>

                    {/* D: Formal Finding */}
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>D — Formal Finding</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {FINDING_FIELDS.map(({ key, label, hint }) => (
                          <div key={key}>
                            <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>
                              {label} <span style={{ fontWeight: 400, color: "#94a3b8" }}>— {hint}</span>
                            </label>
                            <textarea value={risk[key]} onChange={e => updateRisk(risk.id, { [key]: e.target.value } as Partial<RiskEntry>)} rows={2} style={ta} />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* E: Tracking */}
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>E — Tracking</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 12, alignItems: "end" }}>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Risk Owner</label>
                          <input value={risk.owner} onChange={e => updateRisk(risk.id, { owner: e.target.value })} style={ipt} />
                        </div>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Due Date</label>
                          <input type="date" value={risk.dueDate} onChange={e => updateRisk(risk.id, { dueDate: e.target.value })} style={ipt} />
                        </div>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Status</label>
                          <select value={risk.status} onChange={e => updateRisk(risk.id, { status: e.target.value as RiskStatus })} style={sel}>
                            {(["Open", "In Progress", "Resolved", "Accepted"] as RiskStatus[]).map(s => <option key={s}>{s}</option>)}
                          </select>
                        </div>
                        <button onClick={() => deleteRisk(risk.id)} style={{ background: "#fff", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 7, padding: "7px 12px", cursor: "pointer", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
                          🗑 Delete
                        </button>
                      </div>

                      {/* Overdue escalation panel */}
                      {overdue && (
                        <div style={{ marginTop: 14, background: "#fef2f2", border: "1px solid #fecaca", borderLeft: "4px solid #dc2626", borderRadius: 8, padding: "12px 16px" }}>
                          <div style={{ fontSize: 11, fontWeight: 800, color: "#dc2626", marginBottom: 6 }}>⚠ Deadline missed — action required</div>
                          <div style={{ fontSize: 11, color: "#7f1d1d", marginBottom: 10, lineHeight: 1.6 }}>
                            This risk was due <strong>{risk.dueDate}</strong> and is still {risk.status.toLowerCase()}. Choose one of the following steps:
                          </div>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                            <button onClick={() => updateRisk(risk.id, { dueDate: "" })}
                              style={{ fontSize: 11, fontWeight: 600, background: "#fff", border: "1px solid #fca5a5", color: "#dc2626", borderRadius: 6, padding: "4px 12px", cursor: "pointer" }}>
                              📅 Extend due date
                            </button>
                            <button onClick={() => updateRisk(risk.id, { status: "Accepted" })}
                              style={{ fontSize: 11, fontWeight: 600, background: "#fff", border: "1px solid #fca5a5", color: "#dc2626", borderRadius: 6, padding: "4px 12px", cursor: "pointer" }}>
                              ✓ Accept risk formally
                            </button>
                            <button onClick={() => updateRisk(risk.id, { status: "In Progress" })}
                              style={{ fontSize: 11, fontWeight: 600, background: "#fff", border: "1px solid #fca5a5", color: "#dc2626", borderRadius: 6, padding: "4px 12px", cursor: "pointer" }}>
                              ↑ Escalate — mark In Progress
                            </button>
                          </div>
                          <label style={{ fontSize: 11, fontWeight: 600, color: "#7f1d1d", display: "block", marginBottom: 4 }}>Escalation notes / action taken</label>
                          <textarea value={risk.escalationNotes} onChange={e => updateRisk(risk.id, { escalationNotes: e.target.value })}
                            rows={2} placeholder="Record reason for delay, who was notified, new timeline, or formal risk acceptance rationale…"
                            style={{ ...ta, borderColor: "#fca5a5", background: "#fff" }} />
                        </div>
                      )}

                      {/* Escalation notes (non-overdue) */}
                      {!overdue && (
                        <div style={{ marginTop: 10 }}>
                          <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Escalation / Follow-up Notes</label>
                          <textarea value={risk.escalationNotes} onChange={e => updateRisk(risk.id, { escalationNotes: e.target.value })}
                            rows={2} placeholder="Record any escalations, owner changes, or follow-up actions taken…"
                            style={ta} />
                        </div>
                      )}
                    </div>

                    {/* F: Audit & Review */}
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>F — Audit & Review</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Residual Risk Accepted By</label>
                          <input value={risk.residualAcceptedBy} onChange={e => updateRisk(risk.id, { residualAcceptedBy: e.target.value })} placeholder="Name / Role" style={ipt} />
                        </div>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Acceptance Date</label>
                          <input type="date" value={risk.residualAcceptedDate} onChange={e => updateRisk(risk.id, { residualAcceptedDate: e.target.value })} style={ipt} />
                        </div>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Controls Last Tested</label>
                          <input type="date" value={risk.controlTestDate} onChange={e => updateRisk(risk.id, { controlTestDate: e.target.value })} style={ipt} />
                        </div>
                      </div>
                      <div style={{ marginBottom: 14 }}>
                        <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>Next Scheduled Review Date</label>
                        <input type="date" value={risk.nextReviewDate} onChange={e => updateRisk(risk.id, { nextReviewDate: e.target.value })} style={{ ...ipt, width: "calc(33% - 6px)" }} />
                      </div>
                      {/* Audit log */}
                      <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 14px" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 8 }}>Audit Log</div>
                        {(risk.auditLog || []).length === 0 ? (
                          <div style={{ fontSize: 11, color: "#94a3b8", fontStyle: "italic", marginBottom: 8 }}>No entries yet.</div>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 8 }}>
                            {(risk.auditLog || []).map((entry, ei) => (
                              <div key={ei} style={{ fontSize: 11, color: "#334155", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 6, padding: "5px 10px" }}>
                                <span style={{ fontWeight: 700, color: "#94a3b8", marginRight: 8 }}>{entry.ts}</span>{entry.note}
                              </div>
                            ))}
                          </div>
                        )}
                        <AuditLogInput onAdd={note => {
                          const entry: AuditLogEntry = { ts: new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }), note };
                          updateRisk(risk.id, { auditLog: [...(risk.auditLog || []), entry] });
                        }} />
                      </div>
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Phase 3 Summary */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "20px 24px" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Phase 3 — Assessment Summary</div>
        <textarea
          value={riskSummaryText}
          onChange={e => {
            setRiskSummaryText(e.target.value);
            try { localStorage.setItem(riskSummaryKey(client.id), e.target.value); } catch {}
            setLastSaved(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
          }}
          rows={4}
          placeholder="Summarise the key risk findings, overall risk posture, and priorities for Phase 4 reporting…"
          style={{ ...ta, width: "100%", boxSizing: "border-box" }}
        />
        {lastSaved && <div style={{ fontSize: 11, color: "#15803d", fontWeight: 600, marginTop: 6 }}>✓ Saved · {lastSaved}</div>}
      </div>

      {/* ── Phase 4 CTA ── */}
      <div style={{ marginTop: 8, marginBottom: 24, padding: "16px 20px", background: "#f0f4ff", border: "1px solid #c7d2fe", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 3 }}>Ready to report?</div>
          <div style={{ fontSize: 12, color: "#64748b" }}>Proceed to Phase 4 — Report & Recommend to finalise findings and generate the client report.</div>
        </div>
        {onNextPhase && (
          <button onClick={onNextPhase} style={{ background: "#4f46e5", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", cursor: "pointer", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>
            Phase 4: Report & Recommend →
          </button>
        )}
      </div>

      {/* ── Import Modal ── */}
      {showImportModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 700, maxHeight: "80vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 80px rgba(0,0,0,0.25)" }}>
            {/* Modal header */}
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>Select gaps to import as risks</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>
                    {pendingGaps.filter(g => !g.alreadyImported).length} new gaps · {pendingGaps.filter(g => g.recommended).length} recommended · {pendingGaps.filter(g => g.alreadyImported).length} already in register
                  </div>
                </div>
                <button onClick={() => setShowImportModal(false)} style={{ background: "none", border: "none", fontSize: 18, color: "#94a3b8", cursor: "pointer", lineHeight: 1 }}>✕</button>
              </div>
              <div style={{ marginTop: 10, padding: "8px 12px", background: "#f0f4ff", borderRadius: 8, fontSize: 11, color: "#3730a3", lineHeight: 1.6 }}>
                💡 <strong>Recommended</strong> gaps are pre-selected — these are high priority, unactioned, or have no mitigation evidence. Gaps already being actively managed are not pre-selected.
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                <button onClick={() => setSelectedGapIds(new Set(pendingGaps.filter(g => !g.alreadyImported).map(g => g.id)))}
                  style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: 6, padding: "4px 12px", cursor: "pointer" }}>Select all new</button>
                <button onClick={() => setSelectedGapIds(new Set(pendingGaps.filter(g => g.recommended).map(g => g.id)))}
                  style={{ fontSize: 11, fontWeight: 700, color: "#15803d", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6, padding: "4px 12px", cursor: "pointer" }}>Recommended only</button>
                <button onClick={() => setSelectedGapIds(new Set())}
                  style={{ fontSize: 11, fontWeight: 700, color: "#64748b", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 6, padding: "4px 12px", cursor: "pointer" }}>Deselect all</button>
                <span style={{ fontSize: 11, color: "#64748b", alignSelf: "center" }}>{selectedGapIds.size} selected</span>
              </div>
            </div>
            {/* Gap list */}
            <div style={{ overflowY: "auto", flex: 1, padding: "12px 24px" }}>
              {pendingGaps.map(g => {
                const isSelected = selectedGapIds.has(g.id);
                const disabled = g.alreadyImported;
                return (
                  <div key={g.id}
                    onClick={() => { if (disabled) return; setSelectedGapIds(prev => { const n = new Set(prev); n.has(g.id) ? n.delete(g.id) : n.add(g.id); return n; }); }}
                    style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 12px", marginBottom: 6, borderRadius: 8,
                      cursor: disabled ? "default" : "pointer",
                      border: `1px solid ${disabled ? "#f1f5f9" : isSelected ? "#c7d2fe" : "#e2e8f0"}`,
                      background: disabled ? "#f8fafc" : isSelected ? "#f5f3ff" : "#fff",
                      opacity: disabled ? 0.6 : 1 }}>
                    <input type="checkbox" checked={isSelected} disabled={disabled} onChange={() => {}} style={{ marginTop: 2, flexShrink: 0, accentColor: "#6366f1" }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
                        {g.recommended && <span style={{ fontSize: 10, fontWeight: 700, color: "#15803d", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 4, padding: "1px 7px" }}>★ {g.recommendReason}</span>}
                        {g.alreadyImported && <span style={{ fontSize: 10, fontWeight: 700, color: "#64748b", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 4, padding: "1px 7px" }}>✓ Already in register</span>}
                        {!g.recommended && !g.alreadyImported && <span style={{ fontSize: 10, color: "#94a3b8", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 4, padding: "1px 7px" }}>Being managed — optional</span>}
                      </div>
                      <div style={{ fontSize: 12, color: disabled ? "#94a3b8" : "#334155", lineHeight: 1.5, marginBottom: 5 }}>{g.gap}</div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: "#6366f1", background: "#eef2ff", borderRadius: 4, padding: "1px 6px" }}>{g.policyName}</span>
                        <span style={{ fontSize: 10, color: "#64748b", background: "#f1f5f9", borderRadius: 4, padding: "1px 6px" }}>{g.area}</span>
                        <span style={{ fontSize: 10, color: "#64748b", background: "#f1f5f9", borderRadius: 4, padding: "1px 6px" }}>Status: {g.questionStatus}</span>
                        {g.evidenceStatus && <span style={{ fontSize: 10, color: g.evidenceStatus === "Yes" ? "#15803d" : g.evidenceStatus === "Partial" ? "#a16207" : "#dc2626", background: g.evidenceStatus === "Yes" ? "#f0fdf4" : g.evidenceStatus === "Partial" ? "#fefce8" : "#fef2f2", borderRadius: 4, padding: "1px 6px" }}>Evidence: {g.evidenceStatus}</span>}
                        {g.proposedAction && <span style={{ fontSize: 10, color: "#15803d", background: "#f0fdf4", borderRadius: 4, padding: "1px 6px" }}>Action: {g.proposedAction.slice(0, 50)}{g.proposedAction.length > 50 ? "…" : ""}</span>}
                        {g.dueDate && <span style={{ fontSize: 10, color: "#92400e", background: "#fef3c7", borderRadius: 4, padding: "1px 6px" }}>Due: {g.dueDate}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Modal footer */}
            <div style={{ padding: "16px 24px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button onClick={() => setShowImportModal(false)}
                style={{ background: "#f8fafc", color: "#64748b", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 20px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Cancel</button>
              <button onClick={confirmImport} disabled={selectedGapIds.size === 0}
                style={{ background: selectedGapIds.size === 0 ? "#e2e8f0" : "#0f172a", color: selectedGapIds.size === 0 ? "#94a3b8" : "#fff", border: "none", borderRadius: 8, padding: "8px 22px", cursor: selectedGapIds.size === 0 ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 700 }}>
                Import {selectedGapIds.size} risk{selectedGapIds.size !== 1 ? "s" : ""}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PHASE 4: REPORT & RECOMMEND ─────────────────────────────────────────────
const POLICY_BRIEF: Record<string, { headline: string; keyObligation: string }> = {
  "eu-ai-act": {
    headline: "Binding EU regulation for AI placed on the EU/EEA market",
    keyObligation: "High-risk AI systems require conformity assessment, technical documentation, human oversight, and registration in the EU AI database before deployment. Prohibited practices (Art. 5) must be confirmed absent. GPAI models face transparency and copyright compliance obligations.",
  },
  "nist-ai-rmf": {
    headline: "US voluntary AI risk management framework (NIST)",
    keyObligation: "Govern, Map, Measure, and Manage AI risks across four core functions. Prioritise trustworthiness dimensions: reliability, explainability, privacy, security, and bias mitigation throughout the AI lifecycle.",
  },
  "nist-csf": {
    headline: "US cybersecurity framework applicable to AI systems (NIST CSF 2.0)",
    keyObligation: "Govern, Identify, Protect, Detect, Respond, and Recover. Secure AI system supply chain, third-party model integrity, and incident response capabilities. Align AI security controls to broader organisational cybersecurity posture.",
  },
  "iso-42001": {
    headline: "International AI management system standard (ISO/IEC 42001:2023)",
    keyObligation: "Establish a certified AI management system covering context, leadership commitment, planning, support, operations, performance evaluation, and continual improvement (PDCA cycle). Requires documented AI policy and risk assessment processes.",
  },
  "fair": {
    headline: "Factor Analysis of Information Risk — quantitative AI risk model",
    keyObligation: "Quantify AI-related risk in financial terms using Loss Event Frequency and Loss Magnitude. Prioritise controls by expected financial impact and justify risk investment decisions with defensible, data-driven figures.",
  },
  "aaia": {
    headline: "Australia's AI Ethics Framework / Interim Guidance",
    keyObligation: "Align AI systems with 8 voluntary ethics principles: human & societal wellbeing; human-centred values; fairness; privacy protection; reliability & safety; transparency & explainability; contestability; and accountability.",
  },
};

function Phase4Report({ client, onExportFull }: { client: Client; onExportFull: () => void }) {
  const risks = loadRisks(client.id);
  const [execSummary, setExecSummary] = useState(() => localStorage.getItem(`pl_p4_exec_${client.id}`) || "");
  const [preparedBy, setPreparedBy] = useState(() => localStorage.getItem(`pl_p4_prep_${client.id}`) || "");
  const [reviewedBy, setReviewedBy] = useState(() => localStorage.getItem(`pl_p4_rev_${client.id}`) || "");
  const [signOffDate, setSignOffDate] = useState(() => localStorage.getItem(`pl_p4_date_${client.id}`) || "");
  const save = (key: string, val: string) => { try { localStorage.setItem(key, val); } catch {} };

  const counts: Record<RiskLevel, number> = { Critical: 0, High: 0, Medium: 0, Low: 0 };
  risks.forEach(r => counts[riskLevel(r.residualLikelihood, r.residualImpact)]++);

  const critHighRisks = [...risks]
    .filter(r => { const l = riskLevel(r.residualLikelihood, r.residualImpact); return l === "Critical" || l === "High"; })
    .sort((a, b) => b.residualLikelihood * b.residualImpact - a.residualLikelihood * a.residualImpact);

  const roadmap = [...risks]
    .filter(r => r.status !== "Resolved" && r.status !== "Accepted")
    .sort((a, b) => b.residualLikelihood * b.residualImpact - a.residualLikelihood * a.residualImpact);

  const autoSummary = risks.length === 0
    ? "No risks identified. Complete Phase 3 (Risk Register) before generating this report."
    : `Risk assessment identified ${risks.length} risk(s) across ${client.activePolicies.length} framework(s). Residual profile: ${counts.Critical} Critical, ${counts.High} High, ${counts.Medium} Medium, ${counts.Low} Low. ${roadmap.length} risk(s) require remediation action.`;

  const ipt: React.CSSProperties = { width: "100%", padding: "7px 10px", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 12, outline: "none", boxSizing: "border-box", fontFamily: "inherit" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Risk Summary */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "20px 24px" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 14 }}>Risk Summary (Residual)</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {(["Critical", "High", "Medium", "Low"] as RiskLevel[]).map(lvl => {
            const cfg = RISK_LEVEL_CONFIG[lvl];
            return (
              <div key={lvl} style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 10, padding: "10px 18px", display: "flex", flexDirection: "column", alignItems: "center", minWidth: 70 }}>
                <span style={{ fontSize: 20, fontWeight: 800, color: cfg.text }}>{counts[lvl]}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: cfg.text }}>{lvl}</span>
              </div>
            );
          })}
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 18px", display: "flex", flexDirection: "column", alignItems: "center", minWidth: 70 }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>{risks.length}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#64748b" }}>Total</span>
          </div>
        </div>
        {risks.length === 0 && (
          <div style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic", marginTop: 14 }}>
            Complete Phase 3 — Risk Register first.
          </div>
        )}
      </div>

      {/* Applicable Frameworks & Key Obligations */}
      {client.activePolicies.length > 0 && (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "20px 24px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 14 }}>
            Applicable Frameworks & Key Obligations
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {client.activePolicies.map(pid => {
              const stub = POLICY_STUBS.find(p => p.id === pid);
              const brief = POLICY_BRIEF[pid];
              if (!stub) return null;
              const policyRisks = risks.filter(r => {
                const guide = (IMPLEMENTATION_GUIDES as Record<string, any>)[pid];
                if (!guide) return false;
                return guide.areas.some((a: any) => a.area === r.sourceArea);
              });
              const guide = (IMPLEMENTATION_GUIDES as Record<string, any>)[pid];
              const deadlines: { date: string; requirement: string }[] = guide?.complianceDeadlines ?? [];
              return (
                <div key={pid} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "14px 18px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{stub.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{stub.name}</div>
                      {brief && <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{brief.headline}</div>}
                    </div>
                    {policyRisks.length > 0 && (
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20, background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca", whiteSpace: "nowrap" }}>
                        {policyRisks.length} risk{policyRisks.length !== 1 ? "s" : ""} identified
                      </span>
                    )}
                  </div>
                  {brief && <div style={{ fontSize: 12, color: "#334155", lineHeight: 1.6, marginBottom: deadlines.length ? 10 : 0 }}>{brief.keyObligation}</div>}
                  {deadlines.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {deadlines.map((d, i) => (
                        <span key={i} style={{ fontSize: 10, padding: "2px 8px", background: "#fff7ed", color: "#c2410c", borderRadius: 5, border: "1px solid #fed7aa", fontWeight: 600 }}>
                          📅 {d.date}: {d.requirement}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Executive Summary */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "20px 24px" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Executive Summary</div>
        <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 10, fontStyle: "italic", lineHeight: 1.5, background: "#f8fafc", padding: "8px 12px", borderRadius: 7, border: "1px solid #e2e8f0" }}>
          Auto-generated: {autoSummary}
        </div>
        <textarea
          value={execSummary}
          onChange={e => { setExecSummary(e.target.value); save(`pl_p4_exec_${client.id}`, e.target.value); }}
          rows={5}
          placeholder="Override or expand the auto-generated summary with your narrative…"
          style={{ ...ipt, resize: "vertical" }}
        />
      </div>

      {/* Top Findings */}
      {critHighRisks.length > 0 && (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "20px 24px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 14 }}>
            Top Findings — Critical & High Risks
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {critHighRisks.map((r, idx) => {
              const lvl = riskLevel(r.residualLikelihood, r.residualImpact);
              const cfg = RISK_LEVEL_CONFIG[lvl];
              const sCfg = STATUS_COLORS[r.status];
              return (
                <div key={r.id} style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 10, padding: "14px 18px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#64748b" }}>#{idx + 1}</span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#6366f1" }}>{r.riskId}</span>
                    <RiskLevelBadge l={r.residualLikelihood} i={r.residualImpact} />
                    {r.sourceArea && <span style={{ fontSize: 11, color: "#64748b" }}>{r.sourceArea}</span>}
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 5, background: sCfg.bg, color: sCfg.text, border: `1px solid ${sCfg.border}`, marginLeft: "auto" }}>{r.status}</span>
                  </div>
                  {r.description && <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 8 }}>{r.description}</div>}
                  {(r.condition || r.effect || r.recommendation) && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {r.condition && <div style={{ fontSize: 11 }}><span style={{ fontWeight: 700, color: "#64748b" }}>CONDITION: </span>{r.condition}</div>}
                      {r.effect && <div style={{ fontSize: 11 }}><span style={{ fontWeight: 700, color: "#64748b" }}>EFFECT: </span>{r.effect}</div>}
                      {r.recommendation && <div style={{ fontSize: 11 }}><span style={{ fontWeight: 700, color: "#64748b" }}>RECOMMENDATION: </span>{r.recommendation}</div>}
                    </div>
                  )}
                  {(r.owner || r.dueDate) && (
                    <div style={{ marginTop: 8, fontSize: 11, color: "#64748b" }}>
                      {r.owner && <span>Owner: <strong>{r.owner}</strong></span>}
                      {r.owner && r.dueDate && <span style={{ margin: "0 8px" }}>·</span>}
                      {r.dueDate && <span>Due: <strong>{r.dueDate}</strong></span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Remediation Roadmap */}
      {roadmap.length > 0 && (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "20px 24px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 14 }}>
            Remediation Roadmap
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["#", "Risk ID", "Description", "Residual Level", "Owner", "Due Date", "Status", "Recommendation"].map(h => (
                    <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#64748b", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {roadmap.map((r, i) => {
                  const lvl = riskLevel(r.residualLikelihood, r.residualImpact);
                  const cfg = RISK_LEVEL_CONFIG[lvl];
                  return (
                    <tr key={r.id} style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc" }}>
                      <td style={{ padding: "8px 10px", color: "#94a3b8", borderBottom: "1px solid #f1f5f9" }}>{i + 1}</td>
                      <td style={{ padding: "8px 10px", fontWeight: 700, color: "#6366f1", borderBottom: "1px solid #f1f5f9", whiteSpace: "nowrap" }}>{r.riskId}</td>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #f1f5f9", maxWidth: 200 }}>{r.description || "—"}</td>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #f1f5f9" }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5, background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}>{lvl}</span>
                      </td>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #f1f5f9" }}>{r.owner || "—"}</td>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #f1f5f9", whiteSpace: "nowrap" }}>{r.dueDate || "—"}</td>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #f1f5f9" }}>{r.status}</td>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #f1f5f9", maxWidth: 240 }}>{r.recommendation || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sign-off */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "20px 24px" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 14 }}>Sign-off</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 5 }}>Prepared by</label>
            <input value={preparedBy} onChange={e => { setPreparedBy(e.target.value); save(`pl_p4_prep_${client.id}`, e.target.value); }} placeholder="Name / Role" style={ipt} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 5 }}>Reviewed by</label>
            <input value={reviewedBy} onChange={e => { setReviewedBy(e.target.value); save(`pl_p4_rev_${client.id}`, e.target.value); }} placeholder="Name / Role" style={ipt} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 5 }}>Sign-off Date</label>
            <input type="date" value={signOffDate} onChange={e => { setSignOffDate(e.target.value); save(`pl_p4_date_${client.id}`, e.target.value); }} style={ipt} />
          </div>
        </div>
      </div>

      {/* Export */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={onExportFull} style={{ background: "#0f172a", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
          ⬇ Export Full Report (Excel)
        </button>
      </div>
    </div>
  );
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────
type View = "clients" | "detail" | "workbook" | "risk-register";

export default function ClientDiscovery() {
  const { guides: liveGuides, loading: guidesLoading, lastFetched, refresh: refreshGuides } = usePolicyGuides();

  // Synchronously update the module-level reference so all child components
  // see live Supabase data on every re-render triggered by the hook
  if (Object.keys(liveGuides).length > 0) IMPLEMENTATION_GUIDES = liveGuides;

  const [view, setView] = useState<View>("clients");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedPolicy, setSelectedPolicy] = useState<string | null>(null);
  const [workbookFrom, setWorkbookFrom] = useState<"detail" | "list">("detail");
  const [pendingPhase, setPendingPhase] = useState<number | undefined>(undefined);

  if (view === "risk-register" && selectedClient) {
    return <RiskRegisterView client={selectedClient}
      onBack={() => { setPendingPhase(undefined); setView("detail"); }}
      onBackToClients={() => { setView("clients"); setSelectedClient(null); }}
      onNextPhase={() => { setPendingPhase(4); setView("detail"); }} />;
  }
  if (view === "workbook" && selectedClient && selectedPolicy) {
    return (
      <>
        {guidesLoading && (
          <div style={{ background: "#eef2ff", borderBottom: "1px solid #c7d2fe", padding: "6px 20px", fontSize: 11, color: "#4f46e5", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span>
            Loading latest policy data from database…
          </div>
        )}
        {!guidesLoading && lastFetched && (
          <div style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", padding: "5px 20px", fontSize: 11, color: "#64748b", display: "flex", alignItems: "center", gap: 8 }}>
            Policy data verified {lastFetched.toLocaleTimeString()} ·
            <button onClick={refreshGuides} style={{ background: "none", border: "none", color: "#6366f1", cursor: "pointer", fontSize: 11, fontWeight: 600, padding: 0 }}>🔄 Refresh</button>
          </div>
        )}
        <DiscoveryWorkbook client={selectedClient} policyId={selectedPolicy}
          onBack={() => workbookFrom === "list" ? (setView("clients"), setSelectedClient(null)) : setView("detail")}
          onBackToClient={() => { setView("clients"); setSelectedClient(null); }}
          onPhaseSelect={n => {
            if (n === 3) setView("risk-register");
            else setView("detail");
          }} />
      </>
    );
  }
  if (view === "detail" && selectedClient) {
    return <ClientDetailView client={selectedClient}
      onBack={() => { setView("clients"); setSelectedClient(null); }}
      onSelectPolicy={pid => { setSelectedPolicy(pid); setWorkbookFrom("detail"); setView("workbook"); }}
      onOpenRiskRegister={() => setView("risk-register")}
      defaultPhase={pendingPhase} />;
  }
  return <ClientListView
    onSelectClient={c => { setSelectedClient(c); setView("detail"); }}
    onOpenWorkbook={(c, pid) => { setSelectedClient(c); setSelectedPolicy(pid); setWorkbookFrom("list"); setView("workbook"); }}
  />;
}
