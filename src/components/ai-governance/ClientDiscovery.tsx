import { useState, useCallback } from "react";
import { IMPLEMENTATION_GUIDES } from "./guides";

// ─── TYPES ────────────────────────────────────────────────────────────────────
type Client = {
  id: string;
  name: string;
  industry: string;
  createdAt: string;
  activePolicies: string[];
};

type QStatus = "Not Started" | "In Progress" | "Complete";
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

// ─── POLICY STUBS (display info only) ────────────────────────────────────────
const POLICY_STUBS = [
  { id: "eu-ai-act",   name: "EU AI Act",      emoji: "🇪🇺", hasGuide: true,  color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
  { id: "nist-ai-rmf", name: "NIST AI RMF",    emoji: "🇺🇸", hasGuide: false, color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe" },
  { id: "nist-csf",    name: "NIST CSF 2.0",   emoji: "🛡️",  hasGuide: false, color: "#0369a1", bg: "#f0f9ff", border: "#bae6fd" },
  { id: "iso-42001",   name: "ISO 42001",       emoji: "🌐",  hasGuide: false, color: "#0891b2", bg: "#ecfeff", border: "#a5f3fc" },
  { id: "fair",        name: "FAIR",            emoji: "⚖️",  hasGuide: false, color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  { id: "aaia",        name: "AAIA",            emoji: "🔍",  hasGuide: false, color: "#be185d", bg: "#fdf2f8", border: "#fbcfe8" },
];

const INDUSTRIES = [
  "Financial Services / Fintech", "Banking & Lending", "Insurtech / Insurance",
  "Healthtech / MedTech", "Technology & SaaS", "HR Technology",
  "Public Sector / Government", "Retail & E-commerce", "Manufacturing", "Other",
];

const STATUS_CONFIG: Record<QStatus, { bg: string; text: string; border: string }> = {
  "Not Started": { bg: "#f8fafc", text: "#64748b", border: "#e2e8f0" },
  "In Progress":  { bg: "#fefce8", text: "#a16207", border: "#fde047" },
  "Complete":     { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0" },
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
function getPolicyProgress(clientId: string, policyId: string) {
  const guide = IMPLEMENTATION_GUIDES[policyId];
  if (!guide) return { pct: 0, done: 0, total: 0 };
  let total = 0, done = 0;
  guide.areas.forEach((area, areaIdx) => {
    const areaState = loadArea(clientId, policyId, areaIdx);
    area.questions.forEach((_q, qi) => {
      total++;
      if (areaState.questions[qi]?.status === "Complete") done++;
    });
  });
  return { pct: total ? Math.round((done / total) * 100) : 0, done, total };
}

function getAreaProgress(clientId: string, policyId: string, areaIdx: number, qCount: number) {
  const areaState = loadArea(clientId, policyId, areaIdx);
  const done = Array.from({ length: qCount }, (_, i) => areaState.questions[i]?.status === "Complete").filter(Boolean).length;
  return { pct: qCount ? Math.round((done / qCount) * 100) : 0, done, total: qCount };
}

// ─── PROGRESS BAR ─────────────────────────────────────────────────────────────
function ProgressBar({ pct, color = "#0f172a" }: { pct: number; color?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: "#e2e8f0", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: pct === 100 ? "#15803d" : color, borderRadius: 99, transition: "width 0.3s" }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color: pct === 100 ? "#15803d" : "#64748b", minWidth: 32 }}>{pct}%</span>
    </div>
  );
}

// ─── BREADCRUMB ───────────────────────────────────────────────────────────────
function Breadcrumb({ items }: { items: { label: string; onClick?: () => void }[] }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#64748b", flexWrap: "wrap" }}>
      {items.map((item, i) => (
        <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {i > 0 && <span style={{ color: "#cbd5e1" }}>›</span>}
          {item.onClick ? (
            <button onClick={item.onClick} style={{ background: "none", border: "none", cursor: "pointer", color: "#6366f1", fontWeight: 600, fontSize: 13, padding: 0 }}>
              {item.label}
            </button>
          ) : (
            <span style={{ color: "#0f172a", fontWeight: 600 }}>{item.label}</span>
          )}
        </span>
      ))}
    </div>
  );
}

// ─── VIEW 1: CLIENT LIST ──────────────────────────────────────────────────────
function ClientListView({
  onSelectClient,
}: {
  onSelectClient: (c: Client) => void;
}) {
  const [clients, setClients] = useState<Client[]>(loadClients);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIndustry, setNewIndustry] = useState("");

  const addClient = () => {
    if (!newName.trim()) return;
    const client: Client = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      industry: newIndustry || "Other",
      createdAt: new Date().toISOString().slice(0, 10),
      activePolicies: [],
    };
    const updated = [...clients, client];
    saveClients(updated);
    setClients(updated);
    setNewName(""); setNewIndustry(""); setShowAddForm(false);
  };

  const removeClient = (id: string) => {
    if (!confirm("Remove this client and all their discovery data?")) return;
    const updated = clients.filter(c => c.id !== id);
    saveClients(updated);
    setClients(updated);
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 32px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#0f172a" }}>Client Workbook</h2>
          <p style={{ margin: "6px 0 0", fontSize: 14, color: "#64748b" }}>
            Online discovery workbook — one client, one or more frameworks, all progress saved locally.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          style={{ background: "#0f172a", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", cursor: "pointer", fontSize: 14, fontWeight: 700 }}
        >
          + New Client
        </button>
      </div>

      {/* Add client form */}
      {showAddForm && (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 24, marginBottom: 24, boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#0f172a" }}>New Client</h3>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
            <div style={{ flex: 2, minWidth: 200 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 6 }}>Client / Organisation Name</label>
              <input
                autoFocus
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addClient()}
                placeholder="e.g. Apex Capital"
                style={{ width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 6 }}>Industry</label>
              <select value={newIndustry} onChange={e => setNewIndustry(e.target.value)} style={{ width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, background: "#fff" }}>
                <option value="">Select…</option>
                {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={addClient} style={{ background: "#0f172a", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>Add</button>
              <button onClick={() => setShowAddForm(false)} style={{ background: "#f1f5f9", color: "#64748b", border: "none", borderRadius: 8, padding: "9px 14px", cursor: "pointer", fontSize: 13 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Client cards */}
      {clients.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 0", color: "#94a3b8" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No clients yet</div>
          <div style={{ fontSize: 14 }}>Add your first client to start a discovery workbook.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {clients.map(client => (
            <div key={client.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              {/* Client header */}
              <div style={{ background: "#0f172a", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>{client.name}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{client.industry} · Added {client.createdAt}</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => onSelectClient(client)}
                    style={{ background: "#fff", color: "#0f172a", border: "none", borderRadius: 8, padding: "7px 16px", cursor: "pointer", fontSize: 13, fontWeight: 700 }}
                  >
                    Open →
                  </button>
                  <button
                    onClick={() => removeClient(client.id)}
                    title="Remove client"
                    style={{ background: "transparent", color: "#64748b", border: "1px solid #334155", borderRadius: 8, padding: "7px 10px", cursor: "pointer", fontSize: 13 }}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Policy progress rows */}
              <div style={{ padding: "16px 24px" }}>
                {client.activePolicies.length === 0 ? (
                  <div style={{ fontSize: 13, color: "#94a3b8", fontStyle: "italic" }}>No frameworks assigned yet — open to add frameworks</div>
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
                          <div style={{ flex: 1 }}>
                            <ProgressBar pct={pct} color={stub.color} />
                          </div>
                          <span style={{ fontSize: 11, color: "#94a3b8", minWidth: 60, textAlign: "right" }}>{done}/{total} done</span>
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
function ClientDetailView({
  client,
  onBack,
  onSelectPolicy,
}: {
  client: Client;
  onBack: () => void;
  onSelectPolicy: (policyId: string) => void;
}) {
  const [clients, setClients] = useState<Client[]>(loadClients);
  const [showAddPolicy, setShowAddPolicy] = useState(false);
  const thisClient = clients.find(c => c.id === client.id) || client;

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
    if (!confirm(`Remove ${POLICY_STUBS.find(p => p.id === policyId)?.name} from ${client.name}? Discovery data for this framework will be cleared.`)) return;
    // Clear area data
    const guide = IMPLEMENTATION_GUIDES[policyId];
    if (guide) guide.areas.forEach((_a, i) => { try { localStorage.removeItem(areaKey(client.id, policyId, i)); } catch {} });
    const updated = clients.map(c =>
      c.id === client.id ? { ...c, activePolicies: c.activePolicies.filter(p => p !== policyId) } : c
    );
    saveClients(updated);
    setClients(updated);
  };

  const availableToAdd = POLICY_STUBS.filter(p => !thisClient.activePolicies.includes(p.id));

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 32px" }}>
      <Breadcrumb items={[{ label: "All Clients", onClick: onBack }, { label: thisClient.name }]} />

      <div style={{ margin: "20px 0 24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#0f172a" }}>{thisClient.name}</h2>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>{thisClient.industry} · Added {thisClient.createdAt}</div>
        </div>
        {availableToAdd.length > 0 && (
          <button
            onClick={() => setShowAddPolicy(v => !v)}
            style={{ background: "#0f172a", color: "#fff", border: "none", borderRadius: 10, padding: "9px 18px", cursor: "pointer", fontSize: 13, fontWeight: 700 }}
          >
            + Add Framework
          </button>
        )}
      </div>

      {/* Add framework picker */}
      {showAddPolicy && (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 20, marginBottom: 20, boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 14 }}>Select frameworks to add:</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {availableToAdd.map(stub => (
              <button
                key={stub.id}
                onClick={() => addPolicy(stub.id)}
                style={{ display: "flex", alignItems: "center", gap: 8, background: stub.bg, border: `1px solid ${stub.border}`, borderRadius: 10, padding: "9px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600, color: stub.color }}
              >
                <span>{stub.emoji}</span> {stub.name}
                {!stub.hasGuide && <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 400 }}> (coming soon)</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Framework cards */}
      {thisClient.activePolicies.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: "#94a3b8", background: "#f8fafc", borderRadius: 14, border: "1px dashed #e2e8f0" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>➕</div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>No frameworks added yet</div>
          <div style={{ fontSize: 13 }}>Click "Add Framework" to start a discovery workbook for {thisClient.name}.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {thisClient.activePolicies.map(policyId => {
            const stub = POLICY_STUBS.find(p => p.id === policyId)!;
            const guide = IMPLEMENTATION_GUIDES[policyId];
            const { pct, done, total } = getPolicyProgress(client.id, policyId);

            return (
              <div key={policyId} style={{ background: "#fff", border: `1px solid ${stub.border}`, borderTop: `3px solid ${stub.color}`, borderRadius: 14, overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 26 }}>{stub.emoji}</span>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>{stub.name}</div>
                    <ProgressBar pct={pct} color={stub.color} />
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{done} of {total} questions complete · {guide?.areas.length || 0} areas</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {stub.hasGuide ? (
                      <button
                        onClick={() => onSelectPolicy(policyId)}
                        style={{ background: "#0f172a", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", cursor: "pointer", fontSize: 13, fontWeight: 700 }}
                      >
                        Open Workbook →
                      </button>
                    ) : (
                      <span style={{ fontSize: 12, color: "#94a3b8", padding: "8px 0", fontStyle: "italic" }}>Guide coming soon</span>
                    )}
                    <button
                      onClick={() => removePolicy(policyId)}
                      title="Remove framework"
                      style={{ background: "#f8fafc", color: "#94a3b8", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 10px", cursor: "pointer", fontSize: 12 }}
                    >
                      ✕
                    </button>
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

// ─── VIEW 3: DISCOVERY WORKBOOK (area list + form) ────────────────────────────
function DiscoveryWorkbook({
  client,
  policyId,
  onBack,
  onBackToClient,
}: {
  client: Client;
  policyId: string;
  onBack: () => void;
  onBackToClient: () => void;
}) {
  const stub = POLICY_STUBS.find(p => p.id === policyId)!;
  const guide = IMPLEMENTATION_GUIDES[policyId];
  const [openArea, setOpenArea] = useState<number | null>(null);
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
      return updated;
    });
  }, [client.id, policyId]);

  const overallPct = (() => {
    let total = 0, done = 0;
    areaStates.forEach((a, i) => {
      const qCount = guide.areas[i].questions.length;
      for (let q = 0; q < qCount; q++) {
        total++;
        if (a.questions[q]?.status === "Complete") done++;
      }
    });
    return total ? Math.round((done / total) * 100) : 0;
  })();

  return (
    <div style={{ maxWidth: 940, margin: "0 auto", padding: "28px 32px" }}>
      <Breadcrumb items={[
        { label: "All Clients", onClick: onBackToClient },
        { label: client.name, onClick: onBack },
        { label: stub.name },
      ]} />

      <div style={{ margin: "20px 0 24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 28 }}>{stub.emoji}</span>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#0f172a" }}>{stub.name} — Discovery Workbook</h2>
          </div>
          <div style={{ fontSize: 13, color: "#64748b" }}>{client.name} · {client.industry}</div>
        </div>
        <div style={{ minWidth: 200 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 6 }}>Overall Progress</div>
          <ProgressBar pct={overallPct} color={stub.color} />
        </div>
      </div>

      {/* Area list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {guide.areas.map((area, areaIdx) => {
          const qCount = area.questions.length;
          const { pct, done } = getAreaProgress(client.id, policyId, areaIdx, qCount);
          const isOpen = openArea === areaIdx;
          const aState = areaStates[areaIdx];

          return (
            <div key={areaIdx} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
              {/* Area header — clickable to expand */}
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
                  {/* Priority badge */}
                  <span style={{ fontSize: 10, fontWeight: 700, color: area.priority === "High" ? "#dc2626" : area.priority === "Medium" ? "#a16207" : "#15803d", background: area.priority === "High" ? "#fef2f2" : area.priority === "Medium" ? "#fefce8" : "#f0fdf4", borderRadius: 6, padding: "2px 8px" }}>
                    {area.priority}
                  </span>
                  {/* Progress */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 100 }}>
                    <div style={{ width: 60, height: 5, background: isOpen ? "#334155" : "#e2e8f0", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: pct === 100 ? "#15803d" : stub.color, borderRadius: 99 }} />
                    </div>
                    <span style={{ fontSize: 11, color: isOpen ? "#94a3b8" : "#64748b", fontWeight: 600 }}>{done}/{qCount}</span>
                  </div>
                  <span style={{ fontSize: 14, color: isOpen ? "#94a3b8" : "#64748b" }}>{isOpen ? "▾" : "▸"}</span>
                </div>
              </button>

              {/* Area detail — expanded */}
              {isOpen && (
                <div style={{ padding: "20px 24px", borderTop: "1px solid #1e293b", background: "#fafafa" }}>
                  {/* Area metadata */}
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
                    {[
                      { label: "Effort", value: area.effort },
                      { label: "Pillar", value: area.pillar },
                    ].map(m => (
                      <span key={m.label} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 6, padding: "3px 10px", fontSize: 11 }}>
                        <strong style={{ color: "#64748b" }}>{m.label}:</strong> <span style={{ color: "#0f172a" }}>{m.value}</span>
                      </span>
                    ))}
                    <span title={area.riskIfNotAddressed} style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, padding: "3px 10px", fontSize: 11, color: "#dc2626", cursor: "help" }}>
                      ⚠ Risk if not addressed
                    </span>
                  </div>

                  {/* Questions */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {area.questions.map((question, qIdx) => {
                      const qState = aState.questions[qIdx] || { status: "Not Started", notes: "", docExists: "" };
                      const scfg = STATUS_CONFIG[qState.status];
                      return (
                        <div key={qIdx} style={{ background: "#fff", border: `1px solid ${scfg.border}`, borderLeft: `4px solid ${scfg.border}`, borderRadius: 10, padding: "14px 16px" }}>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", minWidth: 20, marginTop: 2 }}>{qIdx + 1}.</span>
                            <p style={{ margin: 0, fontSize: 13, color: "#0f172a", lineHeight: 1.65, flex: 1, fontWeight: 500 }}>{question}</p>
                          </div>
                          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                            {/* Status */}
                            <div>
                              <label style={{ fontSize: 10, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Status</label>
                              <select
                                value={qState.status}
                                onChange={e => updateQuestion(areaIdx, qIdx, "status", e.target.value)}
                                style={{ padding: "6px 10px", border: `1px solid ${scfg.border}`, borderRadius: 7, fontSize: 12, fontWeight: 600, background: scfg.bg, color: scfg.text, cursor: "pointer" }}
                              >
                                {(["Not Started", "In Progress", "Complete"] as QStatus[]).map(s => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                            </div>
                            {/* Doc exists */}
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
                            {/* Notes */}
                            <div style={{ flex: 1, minWidth: 200 }}>
                              <label style={{ fontSize: 10, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Notes</label>
                              <input
                                value={qState.notes}
                                onChange={e => updateQuestion(areaIdx, qIdx, "notes", e.target.value)}
                                placeholder="Evidence, observations, follow-up actions…"
                                style={{ width: "100%", padding: "6px 10px", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 12, outline: "none", boxSizing: "border-box" }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Evidence to collect */}
                  {area.evidenceToCollect?.length > 0 && (
                    <div style={{ marginTop: 16, background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "12px 16px" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#1d4ed8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Evidence to Collect</div>
                      {area.evidenceToCollect.map((e, i) => (
                        <div key={i} style={{ fontSize: 12, color: "#334155", marginBottom: 3 }}>→ {e}</div>
                      ))}
                    </div>
                  )}

                  {/* Maturity indicators */}
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
                          <p style={{ margin: 0, fontSize: 11, color: "#475569", lineHeight: 1.5 }}>{area.maturityIndicators[m.key]}</p>
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

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
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
