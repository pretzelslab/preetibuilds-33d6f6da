import { useState, useCallback, useEffect } from "react";
import { IMPLEMENTATION_GUIDES } from "./guides";

// ─── TYPES ────────────────────────────────────────────────────────────────────
type Client = {
  id: string;
  name: string;
  industry: string;
  createdAt: string;
  activePolicies: string[];
};

type QStatus = "Not Started" | "In Progress" | "Complete" | "Not Applicable" | "On Hold";
type DocExists = "" | "Yes" | "No" | "Partial";

type QuestionState = {
  status: QStatus;
  notes: string;
  docExists: DocExists;
};

type AreaState = {
  questions: Record<number, QuestionState>;
  lastUpdated: string;
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

// ─── INDUSTRIES (expanded + custom support) ───────────────────────────────────
const INDUSTRY_OPTIONS = [
  "Financial Services / Fintech",
  "Banking & Lending",
  "Insurtech / Insurance",
  "Asset Management / Wealth Management",
  "Payments & Digital Wallets",
  "Healthtech / MedTech / Pharma",
  "Hospitals & Clinical Services",
  "Technology & SaaS",
  "Cybersecurity",
  "HR Technology / People Analytics",
  "Legal Technology",
  "Retail & E-commerce",
  "Supply Chain & Logistics",
  "Manufacturing & Industrial",
  "Energy & Utilities",
  "Telecommunications",
  "Media & Publishing",
  "Education & EdTech",
  "Public Sector / Government",
  "Defence & National Security",
  "Nonprofit / NGO",
  "Other (specify below)",
];

// ─── FRAMEWORK SUGGESTIONS BY INDUSTRY ───────────────────────────────────────
type SuggestionLevel = "Required" | "Recommended" | "Consider";
type Suggestion = { id: string; level: SuggestionLevel; reason: string };

const INDUSTRY_SUGGESTIONS: Record<string, Suggestion[]> = {
  "Financial Services / Fintech": [
    { id: "eu-ai-act",   level: "Required",    reason: "High-risk AI use cases (credit scoring, fraud detection)" },
    { id: "nist-ai-rmf", level: "Recommended", reason: "Risk management alignment for US-facing operations" },
    { id: "iso-42001",   level: "Recommended", reason: "Certifiable AI management system standard" },
    { id: "fair",        level: "Consider",    reason: "AI risk quantification for financial exposure" },
  ],
  "Banking & Lending": [
    { id: "eu-ai-act",   level: "Required",    reason: "Credit scoring is explicitly high-risk under Annex III" },
    { id: "iso-42001",   level: "Required",    reason: "Regulator preference for certified AI management" },
    { id: "nist-ai-rmf", level: "Recommended", reason: "US operations or Federal framework alignment" },
    { id: "nist-csf",    level: "Consider",    reason: "Cybersecurity for AI platform protection" },
  ],
  "Insurtech / Insurance": [
    { id: "eu-ai-act",   level: "Required",    reason: "Risk classification and underwriting AI is high-risk" },
    { id: "iso-42001",   level: "Recommended", reason: "Insurance regulators align to ISO standards" },
    { id: "nist-ai-rmf", level: "Consider",    reason: "Useful for US market alignment" },
  ],
  "Asset Management / Wealth Management": [
    { id: "eu-ai-act",   level: "Recommended", reason: "GPAI and investment recommendation tools in scope" },
    { id: "nist-ai-rmf", level: "Recommended", reason: "AI risk management for advisory tools" },
    { id: "iso-42001",   level: "Consider",    reason: "Governance signal to institutional investors" },
  ],
  "Payments & Digital Wallets": [
    { id: "eu-ai-act",   level: "Recommended", reason: "AI in fraud detection is regulated" },
    { id: "nist-csf",    level: "Recommended", reason: "Cybersecurity baseline for payment infrastructure" },
    { id: "iso-42001",   level: "Consider",    reason: "Alignment with PCI DSS and AI governance" },
  ],
  "Healthtech / MedTech / Pharma": [
    { id: "eu-ai-act",   level: "Required",    reason: "Medical device and clinical AI is high-risk under Annex III" },
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
    { id: "eu-ai-act",   level: "Required",    reason: "Recruitment and performance AI is explicitly high-risk (Annex III)" },
    { id: "iso-42001",   level: "Recommended", reason: "Governance for sensitive people data" },
    { id: "fair",        level: "Consider",    reason: "Risk quantification for bias in hiring algorithms" },
  ],
  "Legal Technology": [
    { id: "eu-ai-act",   level: "Recommended", reason: "AI in legal advice and justice systems is high-risk" },
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
    { id: "eu-ai-act",   level: "Consider",    reason: "Safety-critical AI systems may be high-risk" },
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

// ─── STORAGE HELPERS ──────────────────────────────────────────────────────────
const CL_KEY = "pl_clients";
function loadClients(): Client[] {
  try { return JSON.parse(localStorage.getItem(CL_KEY) || "[]"); } catch { return []; }
}
function saveClients(clients: Client[]) {
  try { localStorage.setItem(CL_KEY, JSON.stringify(clients)); } catch {}
}
function areaKey(clientId: string, policyId: string, areaIdx: number) {
  return `pl_disc_${clientId}_${policyId}_${areaIdx}`;
}
function loadArea(clientId: string, policyId: string, areaIdx: number): AreaState {
  try {
    return JSON.parse(localStorage.getItem(areaKey(clientId, policyId, areaIdx)) || "null") || { questions: {}, lastUpdated: "" };
  } catch { return { questions: {}, lastUpdated: "" }; }
}
function saveArea(clientId: string, policyId: string, areaIdx: number, state: AreaState) {
  try { localStorage.setItem(areaKey(clientId, policyId, areaIdx), JSON.stringify({ ...state, lastUpdated: new Date().toISOString() })); } catch {}
}

// ─── PROGRESS HELPERS ─────────────────────────────────────────────────────────
// "Not Applicable" is excluded from total — doesn't count against progress
function getPolicyProgress(clientId: string, policyId: string) {
  const guide = IMPLEMENTATION_GUIDES[policyId];
  if (!guide) return { pct: 0, done: 0, total: 0 };
  let total = 0, done = 0;
  guide.areas.forEach((area, areaIdx) => {
    const st = loadArea(clientId, policyId, areaIdx);
    area.questions.forEach((_q, qi) => {
      const status = st.questions[qi]?.status;
      if (status === "Not Applicable") return;
      total++;
      if (status === "Complete") done++;
    });
  });
  return { pct: total ? Math.round((done / total) * 100) : 0, done, total };
}

function getAreaProgress(clientId: string, policyId: string, areaIdx: number, questions: string[]) {
  const st = loadArea(clientId, policyId, areaIdx);
  let total = 0, done = 0;
  questions.forEach((_q, qi) => {
    const status = st.questions[qi]?.status;
    if (status === "Not Applicable") return;
    total++;
    if (status === "Complete") done++;
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

// ─── NEW CLIENT FORM (industry + framework suggestions on one page) ────────────
function NewClientForm({ onAdd, onCancel }: { onAdd: (client: Client) => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [customIndustry, setCustomIndustry] = useState("");
  const [selectedPolicies, setSelectedPolicies] = useState<Set<string>>(new Set());

  const isOther = industry === "Other (specify below)";
  const effectiveIndustry = isOther ? customIndustry.trim() : industry;
  const suggestions = INDUSTRY_SUGGESTIONS[industry] || [];
  const suggestedIds = new Set(suggestions.map(s => s.id));
  const otherPolicies = POLICY_STUBS.filter(p => !suggestedIds.has(p.id));

  // Auto-tick "Required" frameworks when industry changes
  useEffect(() => {
    if (!industry || isOther) { setSelectedPolicies(new Set()); return; }
    const required = new Set(suggestions.filter(s => s.level === "Required").map(s => s.id));
    setSelectedPolicies(required);
  }, [industry]);

  const togglePolicy = (id: string) => {
    setSelectedPolicies(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const submit = () => {
    if (!name.trim() || !effectiveIndustry) return;
    const client: Client = {
      id: crypto.randomUUID(),
      name: name.trim(),
      industry: effectiveIndustry,
      createdAt: new Date().toISOString().slice(0, 10),
      activePolicies: [...selectedPolicies],
    };
    onAdd(client);
  };

  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 28, marginBottom: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.07)" }}>
      <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 800, color: "#0f172a" }}>New Client</h3>

      {/* Name + Industry row */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 20 }}>
        <div style={{ flex: 2, minWidth: 200 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 6 }}>Client / Organisation Name</label>
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && submit()}
            placeholder="e.g. Apex Capital"
            style={{ width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" }}
          />
        </div>
        <div style={{ flex: 1.5, minWidth: 200 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 6 }}>Industry</label>
          <select
            value={industry}
            onChange={e => setIndustry(e.target.value)}
            style={{ width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, background: "#fff", boxSizing: "border-box" }}
          >
            <option value="">Select industry…</option>
            {INDUSTRY_OPTIONS.map(i => <option key={i}>{i}</option>)}
          </select>
        </div>
      </div>

      {/* Custom industry input */}
      {isOther && (
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 6 }}>Specify Industry</label>
          <input
            autoFocus
            value={customIndustry}
            onChange={e => setCustomIndustry(e.target.value)}
            placeholder="Enter your industry…"
            style={{ width: "100%", maxWidth: 400, padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" }}
          />
        </div>
      )}

      {/* Framework suggestions — appear once industry is selected */}
      {industry && !isOther && suggestions.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>
            Suggested frameworks for <span style={{ color: "#6366f1" }}>{industry}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
            {suggestions.map(s => {
              const stub = POLICY_STUBS.find(p => p.id === s.id)!;
              const scfg = SUGGESTION_CONFIG[s.level];
              const checked = selectedPolicies.has(s.id);
              return (
                <label key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", border: `1px solid ${checked ? stub.border : "#e2e8f0"}`, borderRadius: 10, cursor: "pointer", background: checked ? stub.bg : "#fff", transition: "all 0.15s" }}>
                  <input type="checkbox" checked={checked} onChange={() => togglePolicy(s.id)} style={{ width: 16, height: 16, accentColor: stub.color, cursor: "pointer" }} />
                  <span style={{ fontSize: 18 }}>{stub.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{stub.name}</span>
                    <span style={{ fontSize: 11, color: "#64748b", marginLeft: 8 }}>{s.reason}</span>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: scfg.bg, color: scfg.text, border: `1px solid ${scfg.border}`, whiteSpace: "nowrap" }}>
                    {s.level}
                  </span>
                </label>
              );
            })}
          </div>

          {/* Other available frameworks */}
          {otherPolicies.length > 0 && (
            <details style={{ marginTop: 4 }}>
              <summary style={{ fontSize: 12, fontWeight: 600, color: "#64748b", cursor: "pointer", listStyle: "none", display: "flex", alignItems: "center", gap: 6 }}>
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

      {/* Custom industry — show all frameworks as flat checkboxes */}
      {(isOther || (industry && suggestions.length === 0)) && (
        <div style={{ marginBottom: 20 }}>
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

      <div style={{ display: "flex", gap: 8, borderTop: "1px solid #f1f5f9", paddingTop: 18 }}>
        <button
          onClick={submit}
          disabled={!name.trim() || !effectiveIndustry}
          style={{ background: !name.trim() || !effectiveIndustry ? "#e2e8f0" : "#0f172a", color: !name.trim() || !effectiveIndustry ? "#94a3b8" : "#fff", border: "none", borderRadius: 8, padding: "9px 20px", cursor: !name.trim() || !effectiveIndustry ? "default" : "pointer", fontSize: 13, fontWeight: 700 }}
        >
          Create Client →
        </button>
        <button onClick={onCancel} style={{ background: "#f1f5f9", color: "#64748b", border: "none", borderRadius: 8, padding: "9px 14px", cursor: "pointer", fontSize: 13 }}>Cancel</button>
      </div>
    </div>
  );
}

// ─── VIEW 1: CLIENT LIST ──────────────────────────────────────────────────────
function ClientListView({ onSelectClient }: { onSelectClient: (c: Client) => void }) {
  const [clients, setClients] = useState<Client[]>(loadClients);
  const [showAddForm, setShowAddForm] = useState(false);

  const addClient = (client: Client) => {
    const updated = [...clients, client];
    saveClients(updated);
    setClients(updated);
    setShowAddForm(false);
  };

  const removeClient = (id: string) => {
    if (!confirm("Remove this client and all their discovery data?")) return;
    const updated = clients.filter(c => c.id !== id);
    saveClients(updated);
    setClients(updated);
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#0f172a" }}>Client Workbook</h2>
          <p style={{ margin: "6px 0 0", fontSize: 14, color: "#64748b" }}>
            Online discovery workbook — frameworks, progress, and notes saved locally in your browser.
          </p>
        </div>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            style={{ background: "#0f172a", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", cursor: "pointer", fontSize: 14, fontWeight: 700 }}
          >
            + New Client
          </button>
        )}
      </div>

      {showAddForm && <NewClientForm onAdd={addClient} onCancel={() => setShowAddForm(false)} />}

      {clients.length === 0 && !showAddForm ? (
        <div style={{ textAlign: "center", padding: "64px 0", color: "#94a3b8" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No clients yet</div>
          <div style={{ fontSize: 14 }}>Add your first client to start a discovery workbook.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {clients.map(client => (
            <div key={client.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <div style={{ background: "#0f172a", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>{client.name}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{client.industry} · Added {client.createdAt}</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => onSelectClient(client)} style={{ background: "#fff", color: "#0f172a", border: "none", borderRadius: 8, padding: "7px 16px", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
                    Open →
                  </button>
                  <button onClick={() => removeClient(client.id)} title="Remove client" style={{ background: "transparent", color: "#94a3b8", border: "1px solid #334155", borderRadius: 8, padding: "7px 10px", cursor: "pointer", fontSize: 13 }}>
                    ✕
                  </button>
                </div>
              </div>
              <div style={{ padding: "16px 24px" }}>
                {client.activePolicies.length === 0 ? (
                  <div style={{ fontSize: 13, color: "#94a3b8", fontStyle: "italic" }}>No frameworks assigned — open to configure</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {client.activePolicies.map(policyId => {
                      const stub = POLICY_STUBS.find(p => p.id === policyId);
                      if (!stub) return null;
                      const { pct, done, total } = getPolicyProgress(client.id, policyId);
                      return (
                        <div key={policyId} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                          <span style={{ fontSize: 18, flexShrink: 0 }}>{stub.emoji}</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", minWidth: 140 }}>{stub.name}</span>
                          <div style={{ flex: 1 }}><ProgressBar pct={pct} color={stub.color} /></div>
                          <span style={{ fontSize: 11, color: "#94a3b8", minWidth: 60, textAlign: "right" }}>{done}/{total}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── VIEW 2: CLIENT DETAIL ────────────────────────────────────────────────────
function ClientDetailView({ client, onBack, onSelectPolicy }: {
  client: Client;
  onBack: () => void;
  onSelectPolicy: (policyId: string) => void;
}) {
  const [clients, setClients] = useState<Client[]>(loadClients);
  const [showAddPolicy, setShowAddPolicy] = useState(false);
  const thisClient = clients.find(c => c.id === client.id) || client;
  const availableToAdd = POLICY_STUBS.filter(p => !thisClient.activePolicies.includes(p.id));
  const industry = thisClient.industry;
  const suggestions = INDUSTRY_SUGGESTIONS[industry] || [];

  const addPolicy = (policyId: string) => {
    const updated = clients.map(c =>
      c.id === client.id && !c.activePolicies.includes(policyId)
        ? { ...c, activePolicies: [...c.activePolicies, policyId] }
        : c
    );
    saveClients(updated);
    setClients(updated);
    setShowAddPolicy(false);
  };

  const removePolicy = (policyId: string) => {
    if (!confirm(`Remove ${POLICY_STUBS.find(p => p.id === policyId)?.name} from ${client.name}? Discovery data will be cleared.`)) return;
    const guide = IMPLEMENTATION_GUIDES[policyId];
    if (guide) guide.areas.forEach((_a, i) => { try { localStorage.removeItem(areaKey(client.id, policyId, i)); } catch {} });
    const updated = clients.map(c =>
      c.id === client.id ? { ...c, activePolicies: c.activePolicies.filter(p => p !== policyId) } : c
    );
    saveClients(updated);
    setClients(updated);
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 32px" }}>
      <Breadcrumb items={[{ label: "All Clients", onClick: onBack }, { label: thisClient.name }]} />

      <div style={{ margin: "20px 0 24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#0f172a" }}>{thisClient.name}</h2>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>{thisClient.industry} · Added {thisClient.createdAt}</div>
        </div>
        {availableToAdd.length > 0 && (
          <button onClick={() => setShowAddPolicy(v => !v)} style={{ background: "#0f172a", color: "#fff", border: "none", borderRadius: 10, padding: "9px 18px", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
            + Add Framework
          </button>
        )}
      </div>

      {showAddPolicy && (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 20, marginBottom: 20, boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 14 }}>Add frameworks for {thisClient.name}:</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {availableToAdd.map(stub => {
              const suggestion = suggestions.find(s => s.id === stub.id);
              const scfg = suggestion ? SUGGESTION_CONFIG[suggestion.level] : null;
              return (
                <button key={stub.id} onClick={() => addPolicy(stub.id)} style={{ display: "flex", alignItems: "center", gap: 10, background: stub.bg, border: `1px solid ${stub.border}`, borderRadius: 10, padding: "10px 16px", cursor: "pointer", textAlign: "left" }}>
                  <span style={{ fontSize: 18 }}>{stub.emoji}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", flex: 1 }}>{stub.name}</span>
                  {suggestion && (
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: scfg!.bg, color: scfg!.text, border: `1px solid ${scfg!.border}` }}>
                      {suggestion.level}
                    </span>
                  )}
                  {!stub.hasGuide && <span style={{ fontSize: 10, color: "#94a3b8" }}>guide coming soon</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {thisClient.activePolicies.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: "#94a3b8", background: "#f8fafc", borderRadius: 14, border: "1px dashed #e2e8f0" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>➕</div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>No frameworks added</div>
          <div style={{ fontSize: 13 }}>Click "Add Framework" above to start a discovery workbook.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {thisClient.activePolicies.map(policyId => {
            const stub = POLICY_STUBS.find(p => p.id === policyId)!;
            const guide = IMPLEMENTATION_GUIDES[policyId];
            const { pct, done, total } = getPolicyProgress(client.id, policyId);
            const suggestion = suggestions.find(s => s.id === policyId);
            return (
              <div key={policyId} style={{ background: "#fff", border: `1px solid ${stub.border}`, borderTop: `3px solid ${stub.color}`, borderRadius: 14, overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 26 }}>{stub.emoji}</span>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{stub.name}</span>
                      {suggestion && (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5, background: SUGGESTION_CONFIG[suggestion.level].bg, color: SUGGESTION_CONFIG[suggestion.level].text, border: `1px solid ${SUGGESTION_CONFIG[suggestion.level].border}` }}>
                          {suggestion.level}
                        </span>
                      )}
                    </div>
                    <ProgressBar pct={pct} color={stub.color} />
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{done} of {total} applicable questions complete · {guide?.areas.length || 0} areas</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {stub.hasGuide
                      ? <button onClick={() => onSelectPolicy(policyId)} style={{ background: "#0f172a", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>Open Workbook →</button>
                      : <span style={{ fontSize: 12, color: "#94a3b8", padding: "8px 0", fontStyle: "italic" }}>Guide coming soon</span>
                    }
                    <button onClick={() => removePolicy(policyId)} title="Remove" style={{ background: "#f8fafc", color: "#94a3b8", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 10px", cursor: "pointer", fontSize: 12 }}>✕</button>
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

// ─── READINESS REPORT PANEL ───────────────────────────────────────────────────
function ReadinessReport({ client, policyId, areaStates }: {
  client: Client;
  policyId: string;
  areaStates: AreaState[];
}) {
  const stub = POLICY_STUBS.find(p => p.id === policyId)!;
  const guide = IMPLEMENTATION_GUIDES[policyId];
  if (!guide) return null;

  let totalQ = 0, completeQ = 0, inProgressQ = 0, naQ = 0, onHoldQ = 0, notStartedQ = 0;
  const gapAreas: { area: string; count: number; priority: string }[] = [];

  guide.areas.forEach((area, ai) => {
    const st = areaStates[ai];
    let areaGaps = 0;
    area.questions.forEach((_q, qi) => {
      const status = st.questions[qi]?.status || "Not Started";
      if (status === "Not Applicable") { naQ++; return; }
      totalQ++;
      if (status === "Complete") completeQ++;
      else if (status === "In Progress") inProgressQ++;
      else if (status === "On Hold") onHoldQ++;
      else { notStartedQ++; areaGaps++; }
    });
    if (areaGaps > 0) gapAreas.push({ area: area.area, count: areaGaps, priority: area.priority });
  });

  const pct = totalQ ? Math.round((completeQ / totalQ) * 100) : 0;
  const readinessLabel = pct >= 80 ? "Advanced" : pct >= 50 ? "Developing" : pct >= 25 ? "Initial" : "Not Started";
  const readinessColor = pct >= 80 ? "#15803d" : pct >= 50 ? "#a16207" : pct >= 25 ? "#c2410c" : "#dc2626";

  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 24, marginBottom: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>📊 Readiness Assessment — {stub.name}</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>{client.name} · {client.industry}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: readinessColor }}>{pct}%</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: readinessColor }}>{readinessLabel}</div>
        </div>
      </div>

      {/* Status breakdown */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 8, marginBottom: 20 }}>
        {[
          { label: "Complete",       count: completeQ,   bg: "#f0fdf4", text: "#15803d" },
          { label: "In Progress",    count: inProgressQ, bg: "#fefce8", text: "#a16207" },
          { label: "On Hold",        count: onHoldQ,     bg: "#fff7ed", text: "#c2410c" },
          { label: "Not Started",    count: notStartedQ, bg: "#fef2f2", text: "#dc2626" },
          { label: "Not Applicable", count: naQ,         bg: "#f1f5f9", text: "#64748b" },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.text }}>{s.count}</div>
            <div style={{ fontSize: 10, color: s.text, fontWeight: 600, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Gap list */}
      {gapAreas.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#dc2626", marginBottom: 10 }}>🔴 Priority Gaps — Not Started</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {gapAreas.sort((a, b) => (a.priority === "High" ? -1 : b.priority === "High" ? 1 : 0)).map((g, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: g.priority === "High" ? "#dc2626" : g.priority === "Medium" ? "#f59e0b" : "#64748b", color: "#fff" }}>{g.priority}</span>
                <span style={{ fontSize: 12, color: "#0f172a", flex: 1 }}>{g.area}</span>
                <span style={{ fontSize: 11, color: "#dc2626", fontWeight: 700 }}>{g.count} open</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {pct === 100 && (
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: 14, textAlign: "center" }}>
          <div style={{ fontSize: 24, marginBottom: 4 }}>🎉</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#15803d" }}>Discovery complete — all applicable areas assessed</div>
        </div>
      )}
    </div>
  );
}

// ─── VIEW 3: DISCOVERY WORKBOOK ───────────────────────────────────────────────
function DiscoveryWorkbook({ client, policyId, onBack, onBackToClient }: {
  client: Client;
  policyId: string;
  onBack: () => void;
  onBackToClient: () => void;
}) {
  const stub = POLICY_STUBS.find(p => p.id === policyId)!;
  const guide = IMPLEMENTATION_GUIDES[policyId];
  const [openArea, setOpenArea] = useState<number | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [lastSaved, setLastSaved] = useState<string>("");
  const [areaStates, setAreaStates] = useState<AreaState[]>(() =>
    guide.areas.map((_a, i) => loadArea(client.id, policyId, i))
  );

  const updateQuestion = useCallback((areaIdx: number, qIdx: number, field: keyof QuestionState, value: string) => {
    setAreaStates(prev => {
      const updated = prev.map((a, i) => {
        if (i !== areaIdx) return a;
        return {
          ...a,
          questions: {
            ...a.questions,
            [qIdx]: { ...(a.questions[qIdx] || { status: "Not Started", notes: "", docExists: "" }), [field]: value },
          },
        };
      });
      saveArea(client.id, policyId, areaIdx, updated[areaIdx]);
      setLastSaved(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      return updated;
    });
  }, [client.id, policyId]);

  const overallPct = (() => {
    let total = 0, done = 0;
    areaStates.forEach((a, i) => {
      guide.areas[i].questions.forEach((_q, qi) => {
        const status = a.questions[qi]?.status;
        if (status === "Not Applicable") return;
        total++;
        if (status === "Complete") done++;
      });
    });
    return total ? Math.round((done / total) * 100) : 0;
  })();

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "28px 32px" }}>
      <Breadcrumb items={[
        { label: "All Clients", onClick: onBackToClient },
        { label: client.name, onClick: onBack },
        { label: stub.name },
      ]} />

      <div style={{ margin: "20px 0 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 28 }}>{stub.emoji}</span>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#0f172a" }}>{stub.name} — Discovery Workbook</h2>
          </div>
          <div style={{ fontSize: 13, color: "#64748b" }}>{client.name} · {client.industry}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
          <div style={{ minWidth: 180 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>Overall Progress</div>
            <ProgressBar pct={overallPct} color={stub.color} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {lastSaved && (
              <span style={{ fontSize: 11, color: "#15803d", fontWeight: 600 }}>✓ Saved · {lastSaved}</span>
            )}
            <button
              onClick={() => setShowReport(v => !v)}
              style={{ background: showReport ? "#0f172a" : "#f1f5f9", color: showReport ? "#fff" : "#0f172a", border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}
            >
              📊 {showReport ? "Hide Report" : "View Readiness Report"}
            </button>
          </div>
        </div>
      </div>

      {showReport && <ReadinessReport client={client} policyId={policyId} areaStates={areaStates} />}

      {/* Guide intro */}
      <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "#475569", lineHeight: 1.6 }}>
        {guide.intro}
      </div>

      {/* Area list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {guide.areas.map((area, areaIdx) => {
          const { pct, done, total } = getAreaProgress(client.id, policyId, areaIdx, area.questions);
          const isOpen = openArea === areaIdx;
          const aState = areaStates[areaIdx];

          return (
            <div key={areaIdx} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
              <button
                onClick={() => setOpenArea(isOpen ? null : areaIdx)}
                style={{ width: "100%", background: isOpen ? "#0f172a" : "#fff", border: "none", padding: "14px 20px", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 14 }}
              >
                <span style={{ fontSize: 13, fontWeight: 700, color: isOpen ? "#818cf8" : "#6366f1", minWidth: 28 }}>{String(areaIdx + 1).padStart(2, "0")}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: isOpen ? "#fff" : "#0f172a" }}>{area.area}</div>
                  <div style={{ fontSize: 11, color: isOpen ? "#94a3b8" : "#64748b", marginTop: 2 }}>{area.stakeholder} · {area.regulatoryRef}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: area.priority === "High" ? "#dc2626" : area.priority === "Medium" ? "#a16207" : "#15803d", background: area.priority === "High" ? "#fef2f2" : area.priority === "Medium" ? "#fefce8" : "#f0fdf4", borderRadius: 6, padding: "2px 8px" }}>
                    {area.priority}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 100 }}>
                    <div style={{ width: 60, height: 5, background: isOpen ? "#334155" : "#e2e8f0", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: pct === 100 ? "#15803d" : stub.color, borderRadius: 99 }} />
                    </div>
                    <span style={{ fontSize: 11, color: isOpen ? "#94a3b8" : "#64748b", fontWeight: 600 }}>{done}/{total}</span>
                  </div>
                  <span style={{ fontSize: 14, color: isOpen ? "#94a3b8" : "#64748b" }}>{isOpen ? "▾" : "▸"}</span>
                </div>
              </button>

              {isOpen && (
                <div style={{ padding: "20px 24px", borderTop: "1px solid #1e293b", background: "#fafafa" }}>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
                    {[{ label: "Effort", value: area.effort }, { label: "Pillar", value: area.pillar }].map(m => (
                      <span key={m.label} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 6, padding: "3px 10px", fontSize: 11 }}>
                        <strong style={{ color: "#64748b" }}>{m.label}:</strong> <span style={{ color: "#0f172a" }}>{m.value}</span>
                      </span>
                    ))}
                    <span title={area.riskIfNotAddressed} style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, padding: "3px 10px", fontSize: 11, color: "#dc2626", cursor: "help" }}>
                      ⚠ Risk if not addressed
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {area.questions.map((question, qIdx) => {
                      const qState = aState.questions[qIdx] || { status: "Not Started", notes: "", docExists: "" };
                      const scfg = STATUS_CONFIG[qState.status as QStatus];
                      const isNA = qState.status === "Not Applicable";
                      return (
                        <div key={qIdx} style={{ background: "#fff", border: `1px solid ${scfg.border}`, borderLeft: `4px solid ${scfg.border}`, borderRadius: 10, padding: "14px 16px", opacity: isNA ? 0.55 : 1 }}>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", minWidth: 20, marginTop: 2 }}>{qIdx + 1}.</span>
                            <p style={{ margin: 0, fontSize: 13, color: "#0f172a", lineHeight: 1.65, flex: 1, fontWeight: 500, textDecoration: isNA ? "line-through" : "none" }}>{question}</p>
                          </div>
                          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                            <div>
                              <label style={{ fontSize: 10, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Status</label>
                              <select
                                value={qState.status}
                                onChange={e => updateQuestion(areaIdx, qIdx, "status", e.target.value)}
                                style={{ padding: "6px 10px", border: `1px solid ${scfg.border}`, borderRadius: 7, fontSize: 12, fontWeight: 600, background: scfg.bg, color: scfg.text, cursor: "pointer" }}
                              >
                                {(["Not Started", "In Progress", "Complete", "On Hold", "Not Applicable"] as QStatus[]).map(s => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                            </div>
                            {!isNA && (
                              <div>
                                <label style={{ fontSize: 10, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Documentation Exists?</label>
                                <select
                                  value={qState.docExists}
                                  onChange={e => updateQuestion(areaIdx, qIdx, "docExists", e.target.value)}
                                  style={{ padding: "6px 10px", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 12, background: "#fff", cursor: "pointer" }}
                                >
                                  <option value="">—</option>
                                  <option value="Yes">Yes</option>
                                  <option value="Partial">Partial</option>
                                  <option value="No">No</option>
                                </select>
                              </div>
                            )}
                            {!isNA && (
                              <div style={{ flex: 1, minWidth: 200 }}>
                                <label style={{ fontSize: 10, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Notes</label>
                                <input
                                  value={qState.notes}
                                  onChange={e => updateQuestion(areaIdx, qIdx, "notes", e.target.value)}
                                  placeholder="Evidence, observations, follow-up actions…"
                                  style={{ width: "100%", padding: "6px 10px", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 12, outline: "none", boxSizing: "border-box" }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {area.evidenceToCollect?.length > 0 && (
                    <div style={{ marginTop: 16, background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "12px 16px" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#1d4ed8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Evidence to Collect</div>
                      {area.evidenceToCollect.map((e, i) => (
                        <div key={i} style={{ fontSize: 12, color: "#334155", marginBottom: 3 }}>→ {e}</div>
                      ))}
                    </div>
                  )}

                  {area.maturityIndicators && (
                    <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 }}>
                      {[
                        { key: "notStarted", label: "Not Started", bg: "#fef2f2", text: "#dc2626" },
                        { key: "developing",  label: "Developing",  bg: "#fff7ed", text: "#c2410c" },
                        { key: "defined",     label: "Defined",     bg: "#fefce8", text: "#a16207" },
                        { key: "optimised",   label: "Optimised",   bg: "#f0fdf4", text: "#15803d" },
                      ].map(m => (
                        <div key={m.key} style={{ background: m.bg, borderRadius: 8, padding: "8px 12px" }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: m.text, marginBottom: 3, textTransform: "uppercase" }}>{m.label}</div>
                          <p style={{ margin: 0, fontSize: 11, color: "#475569", lineHeight: 1.5 }}>{(area.maturityIndicators as any)[m.key]}</p>
                        </div>
                      ))}
                    </div>
                  )}
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

  if (view === "workbook" && selectedClient && selectedPolicy) {
    return (
      <DiscoveryWorkbook
        client={selectedClient}
        policyId={selectedPolicy}
        onBack={() => setView("detail")}
        onBackToClient={() => { setView("clients"); setSelectedClient(null); }}
      />
    );
  }

  if (view === "detail" && selectedClient) {
    return (
      <ClientDetailView
        client={selectedClient}
        onBack={() => { setView("clients"); setSelectedClient(null); }}
        onSelectPolicy={policyId => { setSelectedPolicy(policyId); setView("workbook"); }}
      />
    );
  }

  return (
    <ClientListView
      onSelectClient={client => { setSelectedClient(client); setView("detail"); }}
    />
  );
}
