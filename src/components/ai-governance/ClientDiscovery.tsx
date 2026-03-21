import { useState, useCallback, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import { IMPLEMENTATION_GUIDES } from "./guides";

// ─── TYPES ────────────────────────────────────────────────────────────────────
type EngagementType = "" | "Readiness Assessment" | "Gap Analysis" | "Implementation Support" | "Audit Preparation";
type SignOffStatus = "Pending" | "In Review" | "Signed Off";
type QStatus = "Not Started" | "In Progress" | "Complete" | "Not Applicable" | "On Hold";
type DocExists = "" | "Yes" | "No" | "Partial";

type ClientStatus = "active" | "archived" | "hidden";

type Client = {
  id: string;
  name: string;
  country: string;
  industry: string;
  geography: string;
  primaryAiUseCase: string;
  contactName: string;
  engagementType: EngagementType;
  signOffStatus: SignOffStatus;
  createdAt: string;
  activePolicies: string[];
  status: ClientStatus;
};

type QuestionState = {
  status: QStatus;
  notes: string;
  docExists: DocExists;
  dueDate: string;
  owner: string;
  comment: string;
  commentAnswer: string;
};

type AreaState = {
  questions: Record<number, QuestionState>;
  lastUpdated: string;
  summary: string;
};

// ─── POLICY STUBS ─────────────────────────────────────────────────────────────
const POLICY_STUBS = [
  { id: "eu-ai-act",   name: "EU AI Act",    emoji: "🇪🇺", hasGuide: true,  color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
  { id: "nist-ai-rmf", name: "NIST AI RMF",  emoji: "🇺🇸", hasGuide: false, color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe" },
  { id: "nist-csf",    name: "NIST CSF 2.0", emoji: "🛡️",  hasGuide: false, color: "#0369a1", bg: "#f0f9ff", border: "#bae6fd" },
  { id: "iso-42001",   name: "ISO 42001",    emoji: "🌐",  hasGuide: false, color: "#0891b2", bg: "#ecfeff", border: "#a5f3fc" },
  { id: "fair",        name: "FAIR",         emoji: "⚖️",  hasGuide: false, color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  { id: "aaia",        name: "AAIA",         emoji: "🔍",  hasGuide: false, color: "#be185d", bg: "#fdf2f8", border: "#fbcfe8" },
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
  "", "Readiness Assessment", "Gap Analysis", "Implementation Support", "Audit Preparation",
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
    { id: "nist-csf",    level: "Consider",    reason: "Cybersecurity for AI platform protection" },
  ],
  "Insurtech / Insurance": [
    { id: "eu-ai-act",   level: "Required",    reason: "Underwriting and risk classification AI is high-risk" },
    { id: "iso-42001",   level: "Recommended", reason: "Insurance regulators align to ISO standards" },
    { id: "nist-ai-rmf", level: "Consider",    reason: "US market alignment" },
  ],
  "Asset Management / Wealth Management": [
    { id: "eu-ai-act",   level: "Recommended", reason: "Investment recommendation GPAI tools in scope" },
    { id: "nist-ai-rmf", level: "Recommended", reason: "AI risk management for advisory tools" },
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
  ],
  "Technology & SaaS": [
    { id: "iso-42001",   level: "Recommended", reason: "AI management certification for enterprise procurement" },
    { id: "nist-csf",    level: "Recommended", reason: "Cybersecurity baseline for AI platform providers" },
    { id: "eu-ai-act",   level: "Consider",    reason: "Applies if deploying AI to EU customers" },
    { id: "nist-ai-rmf", level: "Consider",    reason: "US government procurement alignment" },
  ],
  "Cybersecurity": [
    { id: "nist-csf",    level: "Required",    reason: "Core framework for cybersecurity posture" },
    { id: "nist-ai-rmf", level: "Recommended", reason: "AI-specific risk management layer" },
    { id: "iso-42001",   level: "Consider",    reason: "Governance for AI-driven security tooling" },
  ],
  "HR Technology / People Analytics": [
    { id: "eu-ai-act",   level: "Required",    reason: "Recruitment and performance AI explicitly high-risk (Annex III)" },
    { id: "iso-42001",   level: "Recommended", reason: "Governance for sensitive people data" },
    { id: "fair",        level: "Consider",    reason: "Risk quantification for bias in hiring AI" },
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
    country: "",
    status: "active" as ClientStatus,
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

// ─── BACKUP EXPORT / IMPORT ───────────────────────────────────────────────────
function exportBackupJSON() {
  const clients = loadClients();
  const backup: Record<string, any> = { version: 1, exportedAt: new Date().toISOString(), clients, discoveryData: {} };
  clients.forEach(client => {
    client.activePolicies.forEach(policyId => {
      const guide = IMPLEMENTATION_GUIDES[policyId];
      if (!guide) return;
      guide.areas.forEach((_a, i) => {
        const key = areaKey(client.id, policyId, i);
        const raw = localStorage.getItem(key);
        if (raw) backup.discoveryData[key] = JSON.parse(raw);
      });
    });
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
      if (backup.discoveryData) {
        Object.entries(backup.discoveryData).forEach(([key, value]) => {
          try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
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
    ["Ref", "Area", "Pillar", "Stakeholder", "Priority", "Question", "Status", "Documentation?", "Notes"],
  ];
  guide.areas.forEach((area, ai) => {
    const st = areaStates[ai];
    area.questions.forEach((q, qi) => {
      const qs = st.questions[qi] || { status: "Not Started", notes: "", docExists: "" };
      discRows.push([`${ai + 1}.${qi + 1}`, area.area, area.pillar, area.stakeholder, area.priority, q, qs.status, qs.docExists || "—", qs.notes || ""]);
    });
  });
  const ws2 = XLSX.utils.aoa_to_sheet(discRows);
  ws2["!cols"] = [{ wch: 6 }, { wch: 28 }, { wch: 14 }, { wch: 22 }, { wch: 10 }, { wch: 52 }, { wch: 16 }, { wch: 16 }, { wch: 40 }];
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
  let total = 0, done = 0;
  questions.forEach((_q, qi) => {
    const s = st.questions[qi]?.status;
    if (s === "Not Applicable") return;
    total++;
    if (s === "Complete") done++;
  });
  return { pct: total ? Math.round((done / total) * 100) : 0, done, total };
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
  const [country, setCountry] = useState("");
  const [industry, setIndustry] = useState("");
  const [customIndustry, setCustomIndustry] = useState("");
  const [geography, setGeography] = useState("");
  const [primaryAiUseCase, setPrimaryAiUseCase] = useState("");
  const [contactName, setContactName] = useState("");
  const [engagementType, setEngagementType] = useState<EngagementType>("");
  const [selectedPolicies, setSelectedPolicies] = useState<Set<string>>(new Set());
  const [showScope, setShowScope] = useState(false);

  const isOther = industry === "Other (specify below)";
  const effectiveIndustry = isOther ? customIndustry.trim() : industry;

  const countrySugs = COUNTRY_SUGGESTIONS[country] || [];
  const industrySugs = (!isOther && INDUSTRY_SUGGESTIONS[industry]) ? INDUSTRY_SUGGESTIONS[industry] : [];
  const suggestions = mergeSuggestions(countrySugs, industrySugs);
  const suggestedIds = new Set(suggestions.map(s => s.id));
  const otherPolicies = POLICY_STUBS.filter(p => !suggestedIds.has(p.id));

  useEffect(() => {
    if (!country && (!industry || isOther)) { setSelectedPolicies(new Set()); return; }
    setSelectedPolicies(new Set(suggestions.filter(s => s.level === "Required").map(s => s.id)));
  }, [country, industry]);

  const togglePolicy = (id: string) =>
    setSelectedPolicies(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const submit = () => {
    if (!name.trim() || !country) return;
    onAdd({
      id: crypto.randomUUID(),
      name: name.trim(), country, industry: effectiveIndustry || "(not specified)",
      geography, primaryAiUseCase, contactName, engagementType,
      signOffStatus: "Pending",
      status: "active",
      createdAt: new Date().toISOString().slice(0, 10),
      activePolicies: [...selectedPolicies],
    });
  };

  const canSubmit = !!name.trim() && !!country;

  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 28, marginBottom: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.07)" }}>
      <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 800, color: "#0f172a" }}>New Client</h3>

      {/* Step 1: Name + Country (required) */}
      <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "16px 18px", marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Step 1 — Client details</div>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <div style={{ flex: 2, minWidth: 200 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 6 }}>Client / Organisation Name *</label>
            <input autoFocus value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()}
              placeholder="e.g. Apex Capital"
              style={{ width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
          </div>
          <div style={{ flex: 1.5, minWidth: 200 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 6 }}>Client Country / Region *</label>
            <select value={country} onChange={e => setCountry(e.target.value)}
              style={{ width: "100%", padding: "9px 12px", border: `1px solid ${country ? "#6366f1" : "#e2e8f0"}`, borderRadius: 8, fontSize: 13, background: "#fff", boxSizing: "border-box" }}>
              <option value="">Select country / region…</option>
              {COUNTRY_OPTIONS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Step 2: Industry (optional refinement) */}
      {country && (
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
      {country && (
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
          </div>
        </details>
      )}

      {/* Step 3: Framework suggestions */}
      {country && suggestions.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
            Step 3 — Applicable frameworks
            <span style={{ fontSize: 10, fontWeight: 500, color: "#94a3b8", textTransform: "none", marginLeft: 8 }}>based on {country}{industry && !isOther ? ` · ${industry}` : ""} — tick or untick to adjust</span>
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

      {country && suggestions.length === 0 && (
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
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#0f172a" }}>Client Workbook</h2>
          <p style={{ margin: "6px 0 0", fontSize: 14, color: "#64748b" }}>Discovery workbooks, progress, and notes saved locally. Export JSON to back up.</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {clients.length > 0 && (
            <>
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
          <div style={{ fontSize: 14 }}>Add your first client to start a discovery workbook.</div>
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
                  style={{ width: "100%", background: "none", border: "none", padding: "8px 0", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 10, borderBottom: "2px solid #e2e8f0", marginBottom: 12 }}>
                  <span style={{ fontSize: 13, color: "#94a3b8" }}>{isCollapsed ? "▸" : "▾"}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em" }}>{industry}</span>
                  <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>({industryClients.length} client{industryClients.length !== 1 ? "s" : ""})</span>
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
                            <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, flexWrap: "wrap" }}>
                              <div>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <span style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>{client.name}</span>
                                  {isArchived && <span style={{ fontSize: 10, background: "#ddd6fe", color: "#5b21b6", borderRadius: 4, padding: "1px 6px", fontWeight: 700 }}>ARCHIVED</span>}
                                  {isHidden && <span style={{ fontSize: 10, background: "#e2e8f0", color: "#475569", borderRadius: 4, padding: "1px 6px", fontWeight: 700 }}>HIDDEN</span>}
                                </div>
                                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                                  {[client.country, client.geography, client.engagementType, `Added ${client.createdAt}`].filter(Boolean).join(" · ")}
                                </div>
                              </div>
                              <SignOffBadge status={client.signOffStatus} />
                            </div>
                            {/* Framework progress pills */}
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
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

// ─── VIEW 2: CLIENT DETAIL ────────────────────────────────────────────────────
function ClientDetailView({ client, onBack, onSelectPolicy }: {
  client: Client; onBack: () => void; onSelectPolicy: (pid: string) => void;
}) {
  const [clients, setClients] = useState<Client[]>(loadClients);
  const [showAddPolicy, setShowAddPolicy] = useState(false);
  const [showEditFrameworks, setShowEditFrameworks] = useState(false);
  const [editFrameworkSet, setEditFrameworkSet] = useState<Set<string>>(new Set());
  const thisClient = clients.find(c => c.id === client.id) || client;
  const suggestions = INDUSTRY_SUGGESTIONS[thisClient.industry] || [];

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
              {[thisClient.country, thisClient.industry, thisClient.geography].filter(Boolean).join(" · ")}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {/* Sign-off selector */}
            <select value={thisClient.signOffStatus} onChange={e => updateClient({ signOffStatus: e.target.value as SignOffStatus })}
              style={{ padding: "6px 10px", border: `1px solid ${sof.border}`, borderRadius: 8, fontSize: 12, fontWeight: 700, background: sof.bg, color: sof.text, cursor: "pointer" }}>
              {(["Pending", "In Review", "Signed Off"] as SignOffStatus[]).map(s => <option key={s}>{s}</option>)}
            </select>
            <button onClick={openEditFrameworks}
              style={{ background: "#f0f9ff", color: "#0369a1", border: "1px solid #bae6fd", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
              ✎ Edit Frameworks
            </button>
            {availableToAdd.length > 0 && !showEditFrameworks && (
              <button onClick={() => setShowAddPolicy(v => !v)} style={{ background: "#0f172a", color: "#fff", border: "none", borderRadius: 8, padding: "7px 16px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                + Add Framework
              </button>
            )}
          </div>
        </div>

        {/* Edit Frameworks panel */}
        {showEditFrameworks && (
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

        {/* Scope summary */}
        {(thisClient.primaryAiUseCase || thisClient.contactName || thisClient.engagementType) && (
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", gap: 20, flexWrap: "wrap" }}>
            {thisClient.primaryAiUseCase && <div><span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>AI Use Case</span><div style={{ fontSize: 13, color: "#0f172a", marginTop: 2 }}>{thisClient.primaryAiUseCase}</div></div>}
            {thisClient.engagementType && <div><span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Engagement</span><div style={{ fontSize: 13, color: "#0f172a", marginTop: 2 }}>{thisClient.engagementType}</div></div>}
            {thisClient.contactName && <div><span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Contact</span><div style={{ fontSize: 13, color: "#0f172a", marginTop: 2 }}>{thisClient.contactName}</div></div>}
          </div>
        )}
      </div>

      {showAddPolicy && availableToAdd.length > 0 && (
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

      {thisClient.activePolicies.length === 0 ? (
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

// ─── VIEW 3: DISCOVERY WORKBOOK ───────────────────────────────────────────────
function DiscoveryWorkbook({ client, policyId, onBack, onBackToClient }: {
  client: Client; policyId: string; onBack: () => void; onBackToClient: () => void;
}) {
  const stub = POLICY_STUBS.find(p => p.id === policyId) || POLICY_STUBS[0];
  const guide = (IMPLEMENTATION_GUIDES as Record<string, any>)[policyId];
  // All hooks must be declared before any early return
  const [openArea, setOpenArea] = useState<number | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [lastSaved, setLastSaved] = useState("");
  const [reportSummary, setReportSummary] = useState(() => loadReportSummary(client.id, policyId));
  const [openComments, setOpenComments] = useState<Set<string>>(new Set());
  const [areaStates, setAreaStates] = useState<AreaState[]>(() =>
    guide ? guide.areas.map((_a: any, i: number) => loadArea(client.id, policyId, i)) : []
  );
  const areaRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (openArea !== null && areaRefs.current[openArea]) {
      setTimeout(() => areaRefs.current[openArea!]?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    }
  }, [openArea]);

  const updateQuestion = useCallback((areaIdx: number, qIdx: number, field: keyof QuestionState, value: string) => {
    setAreaStates(prev => {
      const updated = prev.map((a, i) => {
        if (i !== areaIdx) return a;
        return { ...a, questions: { ...a.questions, [qIdx]: { ...(a.questions[qIdx] || { status: "Not Started", notes: "", docExists: "" }), [field]: value } } };
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

  const toggleComment = useCallback((key: string) => {
    setOpenComments(prev => { const s = new Set(prev); s.has(key) ? s.delete(key) : s.add(key); return s; });
  }, []);

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

      <div style={{ margin: "20px 0 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 26 }}>{stub.emoji}</span>
            <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: "#0f172a" }}>{stub.name} — Discovery Workbook</h2>
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
          const { pct, done, total } = getAreaProgress(client.id, policyId, areaIdx, area.questions);
          const isOpen = openArea === areaIdx;
          const aState = areaStates[areaIdx];

          const clauseHints = getClauseSummaries(area.regulatoryRef || "");
          const isRiskClass = (area.area || "").toLowerCase().includes("risk classification");

          return (
            <div key={areaIdx} ref={el => { areaRefs.current[areaIdx] = el; }} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 11, overflow: "hidden" }}>
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
                    <div style={{ width: 55, height: 4, background: isOpen ? "#334155" : "#e2e8f0", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: pct === 100 ? "#15803d" : stub.color, borderRadius: 99 }} />
                    </div>
                    <span style={{ fontSize: 10, color: isOpen ? "#94a3b8" : "#64748b", fontWeight: 600 }}>{done}/{total}</span>
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

                  {/* Question rows */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {area.questions.map((question: string, qIdx: number) => {
                      const qState = aState.questions[qIdx] || { status: "Not Started", notes: "", docExists: "", dueDate: "", owner: "", comment: "", commentAnswer: "" };
                      const scfg = STATUS_CONFIG[qState.status as QStatus];
                      const isNA = qState.status === "Not Applicable";
                      const commentKey = `${areaIdx}-${qIdx}`;
                      const showComment = openComments.has(commentKey);
                      return (
                        <div key={qIdx} style={{ background: "#fff", border: `1px solid ${scfg.border}`, borderLeft: `4px solid ${scfg.border}`, borderRadius: 9, padding: "12px 14px", opacity: isNA ? 0.55 : 1 }}>
                          {/* Question text + comment toggle */}
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", minWidth: 18, marginTop: 2 }}>{qIdx + 1}.</span>
                            <p style={{ margin: 0, fontSize: 13, color: "#0f172a", lineHeight: 1.65, flex: 1, fontWeight: 500, textDecoration: isNA ? "line-through" : "none" }}>{question}</p>
                            <button onClick={() => toggleComment(commentKey)}
                              title={showComment ? "Hide comment" : "Add comment / question"}
                              style={{ flexShrink: 0, background: showComment ? "#ede9fe" : "#f8fafc", color: showComment ? "#7c3aed" : "#94a3b8", border: `1px solid ${showComment ? "#c4b5fd" : "#e2e8f0"}`, borderRadius: 6, padding: "3px 7px", fontSize: 11, cursor: "pointer", marginTop: 1 }}>
                              💬
                            </button>
                          </div>

                          {/* Status / Doc / Notes / Due / Owner row */}
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
                            <div>
                              <label style={{ fontSize: 10, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>Status</label>
                              <select value={qState.status} onChange={e => updateQuestion(areaIdx, qIdx, "status", e.target.value)}
                                style={{ padding: "5px 9px", border: `1px solid ${scfg.border}`, borderRadius: 6, fontSize: 12, fontWeight: 600, background: scfg.bg, color: scfg.text, cursor: "pointer" }}>
                                {(["Not Started", "In Progress", "Complete", "On Hold", "Not Applicable"] as QStatus[]).map(s => <option key={s}>{s}</option>)}
                              </select>
                            </div>
                            {!isNA && (<>
                              <div>
                                <label style={{ fontSize: 10, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>Documentation?</label>
                                <select value={qState.docExists} onChange={e => updateQuestion(areaIdx, qIdx, "docExists", e.target.value)}
                                  style={{ padding: "5px 9px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12, background: "#fff", cursor: "pointer" }}>
                                  <option value="">—</option>
                                  <option>Yes</option><option>Partial</option><option>No</option>
                                </select>
                              </div>
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
                              <div style={{ flex: 1, minWidth: 180 }}>
                                <label style={{ fontSize: 10, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>Notes / Evidence</label>
                                <input value={qState.notes} onChange={e => updateQuestion(areaIdx, qIdx, "notes", e.target.value)}
                                  placeholder="Evidence, observations, follow-up actions…"
                                  style={{ width: "100%", padding: "5px 9px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12, outline: "none", boxSizing: "border-box" }} />
                              </div>
                            </>)}
                          </div>

                          {/* Comment / Answer panel */}
                          {showComment && (
                            <div style={{ marginTop: 10, background: "#f5f3ff", border: "1px solid #ddd6fe", borderRadius: 8, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
                              <div>
                                <label style={{ fontSize: 10, fontWeight: 700, color: "#7c3aed", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Comment / Question</label>
                                <textarea value={qState.comment || ""} onChange={e => updateQuestion(areaIdx, qIdx, "comment", e.target.value)}
                                  placeholder="Leave a comment, flag an issue, or ask a clarifying question…"
                                  rows={2}
                                  style={{ width: "100%", padding: "6px 9px", border: "1px solid #c4b5fd", borderRadius: 6, fontSize: 12, outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }} />
                              </div>
                              <div>
                                <label style={{ fontSize: 10, fontWeight: 700, color: "#5b21b6", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Answer / Response</label>
                                <textarea value={qState.commentAnswer || ""} onChange={e => updateQuestion(areaIdx, qIdx, "commentAnswer", e.target.value)}
                                  placeholder="Response, resolution, or agreed action…"
                                  rows={2}
                                  style={{ width: "100%", padding: "6px 9px", border: "1px solid #c4b5fd", borderRadius: 6, fontSize: 12, outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit", background: "#ede9fe" }} />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
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
          );
        })}
      </div>
    </div>
  );
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────
type View = "clients" | "detail" | "workbook";

export default function ClientDiscovery() {
  const [view, setView] = useState<View>("clients");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedPolicy, setSelectedPolicy] = useState<string | null>(null);
  const [workbookFrom, setWorkbookFrom] = useState<"detail" | "list">("detail");

  if (view === "workbook" && selectedClient && selectedPolicy) {
    return <DiscoveryWorkbook client={selectedClient} policyId={selectedPolicy}
      onBack={() => workbookFrom === "list" ? (setView("clients"), setSelectedClient(null)) : setView("detail")}
      onBackToClient={() => { setView("clients"); setSelectedClient(null); }} />;
  }
  if (view === "detail" && selectedClient) {
    return <ClientDetailView client={selectedClient}
      onBack={() => { setView("clients"); setSelectedClient(null); }}
      onSelectPolicy={pid => { setSelectedPolicy(pid); setWorkbookFrom("detail"); setView("workbook"); }} />;
  }
  return <ClientListView
    onSelectClient={c => { setSelectedClient(c); setView("detail"); }}
    onOpenWorkbook={(c, pid) => { setSelectedClient(c); setSelectedPolicy(pid); setWorkbookFrom("list"); setView("workbook"); }}
  />;
}
