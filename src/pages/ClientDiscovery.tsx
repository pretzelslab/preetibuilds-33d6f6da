import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import ClientDiscovery from "@/components/ai-governance/ClientDiscovery";
import { PageGate } from "@/components/ui/PageGate";
import { DiagonalWatermark } from "@/components/ui/DiagonalWatermark";

// ── Static preview shown to visitors ─────────────────────────────────────────
const PHASES = [
  { icon: "🏛", label: "Phase 1: Govern & Scope",   active: true  },
  { icon: "🗺", label: "Phase 2: Map & Discover",   active: false },
  { icon: "📊", label: "Phase 3: Measure & Assess", active: false },
  { icon: "📄", label: "Phase 4: Report",           active: false },
  { icon: "📡", label: "Phase 5: Monitor",          active: false },
];

const QUESTIONS = [
  { q: "Does the organisation have a documented AI governance policy?",       status: "In Progress", priority: "High"     },
  { q: "Is there a named AI risk owner at executive or board level?",         status: "Not Started", priority: "Critical" },
  { q: "Has an AI system inventory been created and maintained?",             status: "Complete",    priority: "High"     },
];

const RISKS = [
  { risk: "Biased training data in credit scoring model",           level: "High",     treatment: "Mitigate" },
  { risk: "No documented AI incident response playbook",            level: "Critical", treatment: "Treat"    },
  { risk: "Third-party model vendor contract lacks AI obligations", level: "Medium",   treatment: "Transfer" },
];

const statusStyle = (s: string) => ({
  fontSize: 10, fontWeight: 700, padding: "2px 9px", borderRadius: 20, whiteSpace: "nowrap" as const,
  background: s === "Complete" ? "#dcfce7" : s === "In Progress" ? "#fef9c3" : "#f1f5f9",
  color:      s === "Complete" ? "#166534" : s === "In Progress" ? "#713f12" : "#64748b",
});

const priorityStyle = (p: string) => ({
  fontSize: 10, fontWeight: 700, padding: "2px 9px", borderRadius: 20, whiteSpace: "nowrap" as const,
  background: p === "Critical" ? "#fee2e2" : p === "High" ? "#fef3c7" : "#f1f5f9",
  color:      p === "Critical" ? "#991b1b" : p === "High" ? "#92400e" : "#64748b",
});

const levelStyle = (l: string) => ({
  fontSize: 10, fontWeight: 700, padding: "2px 9px", borderRadius: 20, whiteSpace: "nowrap" as const,
  background: l === "Critical" ? "#fee2e2" : l === "High" ? "#fef3c7" : "#f1f5f9",
  color:      l === "Critical" ? "#991b1b" : l === "High" ? "#92400e" : "#64748b",
});

const WorkbookPreview = () => (
  <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif", background: "#f8fafc", minHeight: "100vh" }}>
    <DiagonalWatermark />

    {/* Header — sticky below the PageGate banner (~40px) */}
    <div style={{ background: "#0f172a", color: "#fff", padding: "24px 32px", position: "sticky", top: 40, zIndex: 90 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, color: "#94a3b8", textDecoration: "none", marginBottom: 12, fontWeight: 400 }}>
          ← Back to Portfolio
        </Link>
        <div style={{ fontSize: 10, color: "#64748b", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          AI Governance · Client Engagement Tool
        </div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>AI Risk Assessment Matrix</h1>
        <p style={{ margin: "6px 0 0", color: "#94a3b8", fontSize: 13 }}>
          5-phase AI governance workbook · Risk register · Compliance deadlines · Audit trail
        </p>
      </div>
    </div>

    {/* Client row */}
    <div style={{ borderBottom: "1px solid #e2e8f0", background: "#fff", padding: "10px 32px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Client:</span>
        <span style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 8, padding: "4px 12px", fontSize: 13, fontWeight: 600, color: "#0f172a" }}>
          Apex Lending Group
        </span>
        <span style={{ fontSize: 11, color: "#94a3b8" }}>Demo · Fintech · NIST AI RMF</span>
        <span style={{ marginLeft: "auto", fontSize: 11, color: "#94a3b8", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 20, padding: "3px 10px" }}>
          🔒 Multiple clients
        </span>
      </div>
    </div>

    {/* Phase tabs */}
    <div style={{ background: "#0f172a", padding: "0 32px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", gap: 2, overflowX: "auto" }}>
        {PHASES.map(tab => (
          <div key={tab.label} style={{
            padding: "10px 16px", fontSize: 12, fontWeight: tab.active ? 700 : 500,
            color: tab.active ? "#0f172a" : "#64748b",
            background: tab.active ? "#fff" : "transparent",
            borderRadius: "8px 8px 0 0",
            display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
          }}>
            {tab.icon} {tab.label}
          </div>
        ))}
      </div>
    </div>

    <div style={{ maxWidth: 1100, margin: "24px auto", padding: "0 32px" }}>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Primary Framework", value: "NIST AI RMF" },
          { label: "Questions Assessed", value: "14 / 56"    },
          { label: "Risks Identified",   value: "12"         },
          { label: "Phase Completion",   value: "42%"        },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 20px" }}>
            <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Governance questions */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", marginBottom: 20 }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>🏛 GOVERN · AI Policy &amp; Accountability</span>
          <span style={{ fontSize: 11, color: "#94a3b8" }}>6 questions</span>
        </div>
        {QUESTIONS.map((item, i) => (
          <div key={i} style={{ padding: "12px 20px", borderBottom: "1px solid #f8fafc", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1, fontSize: 13, color: "#334155", lineHeight: 1.5 }}>{item.q}</div>
            <span style={statusStyle(item.status)}>{item.status}</span>
            <span style={priorityStyle(item.priority)}>{item.priority}</span>
          </div>
        ))}
        {/* Blurred remaining rows */}
        <div style={{ filter: "blur(3px)", userSelect: "none", pointerEvents: "none" }}>
          {["Are regular AI ethics reviews conducted with cross-functional representation?",
            "Is there a formal process to escalate AI-related risks to leadership?",
            "Does the organisation conduct third-party AI audits annually?"].map((q, i) => (
            <div key={i} style={{ padding: "12px 20px", borderBottom: "1px solid #f8fafc", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, fontSize: 13, color: "#334155" }}>{q}</div>
              <span style={statusStyle("Not Started")}>Not Started</span>
              <span style={priorityStyle("High")}>High</span>
            </div>
          ))}
        </div>
      </div>

      {/* Risk register preview */}
      <div style={{ position: "relative", marginBottom: 32 }}>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>⚠ Risk Register</span>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>Phase 3 output · 12 items</span>
          </div>
          <div style={{ padding: "8px 20px 0", display: "flex", gap: 8, borderBottom: "1px solid #f1f5f9", paddingBottom: 8 }}>
            {["All", "Critical", "High", "Medium"].map(l => (
              <span key={l} style={{ fontSize: 11, padding: "2px 10px", borderRadius: 20, border: "1px solid #e2e8f0", color: "#64748b", background: l === "All" ? "#f1f5f9" : "transparent" }}>{l}</span>
            ))}
          </div>
          {RISKS.map((r, i) => (
            <div key={i} style={{ padding: "12px 20px", borderBottom: "1px solid #f8fafc", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, fontSize: 13, color: "#334155" }}>{r.risk}</div>
              <span style={levelStyle(r.level)}>{r.level}</span>
              <span style={{ fontSize: 11, color: "#64748b", fontWeight: 500 }}>{r.treatment}</span>
            </div>
          ))}
          {/* Blurred remaining risks */}
          <div style={{ filter: "blur(4px)", userSelect: "none", pointerEvents: "none", maxHeight: 100, overflow: "hidden" }}>
            {["Lack of model explainability for regulated decisions", "No fairness metrics baseline established", "AI training data retention exceeds policy"].map((r, i) => (
              <div key={i} style={{ padding: "12px 20px", borderBottom: "1px solid #f8fafc", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1, fontSize: 13, color: "#334155" }}>{r}</div>
                <span style={levelStyle("High")}>High</span>
                <span style={{ fontSize: 11, color: "#64748b" }}>Mitigate</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 70, background: "linear-gradient(to bottom, transparent, rgba(248,250,252,0.97))", borderRadius: "0 0 12px 12px" }} />
      </div>

      {/* Phase summary strip */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 24px", display: "flex", gap: 0 }}>
        {[
          { phase: "Phase 1", label: "Govern & Scope",   pct: 42, color: "#6366f1" },
          { phase: "Phase 2", label: "Map & Discover",   pct: 25, color: "#0ea5e9" },
          { phase: "Phase 3", label: "Measure & Assess", pct: 18, color: "#f59e0b" },
          { phase: "Phase 4", label: "Report",           pct: 0,  color: "#94a3b8" },
          { phase: "Phase 5", label: "Monitor",          pct: 0,  color: "#94a3b8" },
        ].map((p, i, arr) => (
          <div key={p.phase} style={{ flex: 1, padding: "0 16px", borderRight: i < arr.length - 1 ? "1px solid #f1f5f9" : "none" }}>
            <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{p.phase}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", marginBottom: 6 }}>{p.label}</div>
            <div style={{ height: 4, background: "#f1f5f9", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${p.pct}%`, background: p.color, borderRadius: 2, transition: "width 0.6s ease" }} />
            </div>
            <div style={{ fontSize: 10, color: p.color, fontWeight: 600, marginTop: 4 }}>{p.pct}%</div>
          </div>
        ))}
      </div>

      <p style={{ textAlign: "center", fontSize: 11, color: "#94a3b8", marginTop: 24 }}>
        © 2026 Preethi Raghuveeran · AI Risk Assessment Matrix · Private &amp; Confidential
      </p>
    </div>
  </div>
);

// ── Page ──────────────────────────────────────────────────────────────────────
const ClientDiscoveryPage = () => (
  <PageGate previewContent={<WorkbookPreview />}>
    <div className="min-h-screen bg-white">
      <nav className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur-md border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Portfolio
          </Link>
        </div>
      </nav>
      <ClientDiscovery />
    </div>
  </PageGate>
);

export default ClientDiscoveryPage;
