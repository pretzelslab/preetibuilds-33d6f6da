import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, BarChart3, Calendar, ClipboardList, Heart, Plus, Stethoscope, Users } from "lucide-react";

// MedLog has its own independent access key — completely separate from AI Governance
const ML_ACCESS_KEY = "pl_medlog_access";
const ML_ACCESS_CODE = "PRL2026";
function mlUnlocked(): boolean {
  try { return localStorage.getItem(ML_ACCESS_KEY) === "1"; } catch { return false; }
}

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: ClipboardList },
  { id: "log", label: "Log Event", icon: Plus },
  { id: "symptoms", label: "Symptoms", icon: Stethoscope },
  { id: "history", label: "History", icon: Calendar },
  { id: "analysis", label: "Analysis", icon: BarChart3 },
  { id: "family", label: "Family", icon: Users },
];

const demoEvents = [
  { type: "visit", title: "Annual Physical Exam", doctor: "Dr. Smith", date: "2026-02-15", notes: "All vitals normal" },
  { type: "medication", title: "Ibuprofen 200mg", doctor: "", date: "2026-02-10", notes: "For headache, twice daily" },
  { type: "checkup", title: "Dental Cleaning", doctor: "Dr. Park", date: "2026-01-28", notes: "No cavities" },
  { type: "visit", title: "Follow-up - Blood Work", doctor: "Dr. Smith", date: "2026-01-15", notes: "Cholesterol slightly elevated" },
  { type: "surgery", title: "Mole Removal", doctor: "Dr. Lee", date: "2025-12-20", notes: "Minor procedure, healed well" },
];

const demoSymptoms = [
  { name: "Headache", severity: "Mild", date: "2026-02-18", trigger: "Screen time" },
  { name: "Back Pain", severity: "Moderate", date: "2026-02-12", trigger: "Physical activity" },
  { name: "Fatigue", severity: "Mild", date: "2026-02-05", trigger: "Lack of sleep" },
];

const typeColors: Record<string, string> = {
  visit: "bg-emerald-100 text-emerald-700",
  medication: "bg-amber-100 text-amber-700",
  checkup: "bg-sky-100 text-sky-700",
  surgery: "bg-red-100 text-red-700",
  other: "bg-purple-100 text-purple-700",
};

const sevColors: Record<string, string> = {
  Mild: "bg-emerald-100 text-emerald-700",
  Moderate: "bg-amber-100 text-amber-700",
  Severe: "bg-red-100 text-red-700",
};

const MedLog = () => {
  const [activeView, setActiveView] = useState("dashboard");
  const [unlocked, setUnlocked] = useState(mlUnlocked);
  const [showLockModal, setShowLockModal] = useState(false);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState(false);

  // Auto-unlock from URL hash — bookmark /medlog#PRL2026
  useEffect(() => {
    const hash = window.location.hash.replace("#", "").toUpperCase().trim();
    if (hash === ML_ACCESS_CODE) {
      try { localStorage.setItem(ML_ACCESS_KEY, "1"); } catch {}
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
      setUnlocked(true);
    }
  }, []);

  const tryUnlock = () => {
    if (code.toUpperCase().trim() === ML_ACCESS_CODE) {
      try { localStorage.setItem(ML_ACCESS_KEY, "1"); } catch {}
      setUnlocked(true);
      setShowLockModal(false);
      setCode("");
    } else {
      setCodeError(true);
      setTimeout(() => setCodeError(false), 800);
      setCode("");
    }
  };

  const lock = () => {
    try { localStorage.removeItem(ML_ACCESS_KEY); } catch {}
    setUnlocked(false);
  };

  return (
    <div className="min-h-screen" style={{ background: "#f7f4ef", color: "#1a1a2e", fontFamily: "'DM Sans', sans-serif" }}>
      {/* Unlock modal */}
      {showLockModal && !unlocked && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(26,26,46,0.8)", backdropFilter: "blur(4px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: "40px 44px", maxWidth: 400, width: "100%", textAlign: "center", boxShadow: "0 25px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ fontSize: 44, marginBottom: 14 }}>🔒</div>
            <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 800, color: "#1a1a2e" }}>MedLog Access</h2>
            <p style={{ margin: "0 0 24px", fontSize: 13, color: "#6b6b80", lineHeight: 1.6 }}>Enter your access code to view the full application.</p>
            <input
              type="password"
              placeholder="Access code"
              value={code}
              autoFocus
              onChange={e => setCode(e.target.value)}
              onKeyDown={e => e.key === "Enter" && tryUnlock()}
              style={{ width: "100%", padding: "12px 14px", border: `2px solid ${codeError ? "#dc2626" : "#e2e8f0"}`, borderRadius: 10, fontSize: 15, outline: "none", marginBottom: 12, boxSizing: "border-box", fontFamily: "monospace", letterSpacing: "0.15em", textAlign: "center", background: codeError ? "#fef2f2" : "#fff" }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setShowLockModal(false); setCode(""); }} style={{ flex: 1, padding: "11px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#f7f4ef", color: "#6b6b80", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
              <button onClick={tryUnlock} style={{ flex: 2, padding: "11px", borderRadius: 10, border: "none", background: "#1a1a2e", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Unlock →</button>
            </div>
            {codeError && <p style={{ color: "#dc2626", fontSize: 12, marginTop: 10 }}>Incorrect code — try again.</p>}
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 h-16" style={{ background: "#1a1a2e" }}>
        <div className="flex items-center gap-3">
          <Link to="/" className="text-white/50 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <span className="text-xl font-serif tracking-tight text-white">
            Med<span style={{ color: "#74c69d" }}>Log</span> ✦
          </span>
        </div>
        <nav className="flex gap-1 flex-wrap justify-end">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeView === item.id
                  ? "bg-white/10 text-[#74c69d]"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              <item.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-2 ml-2">
          {unlocked ? (
            <button onClick={lock} title="Lock MedLog"
              style={{ background: "rgba(116,198,157,0.15)", border: "1px solid rgba(116,198,157,0.4)", borderRadius: 8, padding: "4px 10px", fontSize: 13, cursor: "pointer", color: "#74c69d" }}>
              🔓
            </button>
          ) : (
            <button onClick={() => setShowLockModal(true)}
              style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 8, padding: "4px 10px", fontSize: 13, cursor: "pointer", color: "#fff", fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
              🔒 <span style={{ fontSize: 11 }}>Owner</span>
            </button>
          )}
          <div className="flex items-center gap-2 bg-white/10 rounded-full py-1 px-3">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "#2d6a4f" }}>
              JS
            </div>
            <span className="text-xs font-semibold text-white/90 hidden sm:inline">Jane</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1100px] mx-auto px-6 py-8 relative overflow-hidden">
        {/* Visitor overlays — hidden when unlocked */}
        {!unlocked && (<>
          {/* Diagonal watermark */}
          <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
            <div className="absolute inset-0 flex flex-col justify-center items-center gap-24" style={{ transform: "rotate(-35deg)", transformOrigin: "center center" }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex gap-16 whitespace-nowrap">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <span key={j} className="text-lg font-bold uppercase tracking-[0.3em] select-none" style={{ color: "rgba(26,26,46,0.06)" }}>
                      © MedLog · Copyrighted
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
          {/* Gradient fade */}
          <div className="pointer-events-none absolute inset-0 z-40" style={{
            background: "linear-gradient(to bottom, transparent 40%, rgba(247,244,239,0.7) 55%, rgba(247,244,239,0.95) 75%, #f7f4ef 100%)",
          }} />
          {/* Coming soon badge */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-50 text-center">
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl shadow-lg" style={{ background: "#1a1a2e" }}>
              <Heart className="w-5 h-5 text-[#74c69d]" />
              <span className="text-white font-semibold text-sm">Full app coming soon — stay tuned!</span>
            </div>
            <p className="mt-3 text-sm" style={{ color: "#6b6b80" }}>
              This is a preview of MedLog. Backend &amp; interactivity launching shortly.
            </p>
          </div>
        </>)}

        {activeView === "dashboard" && <DashboardView />}
        {activeView === "log" && <LogEventView />}
        {activeView === "symptoms" && <SymptomsView />}
        {activeView === "history" && <HistoryView />}
        {activeView === "analysis" && <AnalysisView />}
        {activeView === "family" && <FamilyView />}
      </main>

      {/* Footer — copyright always visible */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 text-center py-2 text-[0.7rem] tracking-wide" style={{ background: "#1a1a2e", color: "rgba(255,255,255,0.35)" }}>
        © 2026 MedLog · All rights reserved · Private &amp; Confidential · Unauthorised reproduction prohibited
      </footer>
    </div>
  );
};

const StatCard = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
  <div className="rounded-2xl border p-4 shadow-sm" style={{ background: "#fff", borderColor: "#e2ddd6" }}>
    <div className="text-[0.72rem] font-semibold uppercase tracking-wider" style={{ color: "#6b6b80" }}>{label}</div>
    <div className="text-2xl font-serif font-bold mt-1">{value}</div>
    {sub && <div className="text-xs mt-0.5" style={{ color: "#6b6b80" }}>{sub}</div>}
  </div>
);

const EventItem = ({ event }: { event: typeof demoEvents[0] }) => (
  <div className="flex items-start gap-3 p-3 rounded-xl border" style={{ background: "#f7f4ef", borderColor: "#e2ddd6" }}>
    <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${typeColors[event.type]?.split(" ")[0] || "bg-gray-300"}`} />
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-sm">{event.title}</span>
        <span className={`text-[0.68rem] font-bold uppercase px-2 py-0.5 rounded-full ${typeColors[event.type]}`}>{event.type}</span>
      </div>
      <div className="text-xs mt-0.5" style={{ color: "#6b6b80" }}>
        {event.date}{event.doctor && ` · ${event.doctor}`}
      </div>
      {event.notes && <div className="text-xs mt-1 italic" style={{ color: "#6b6b80" }}>{event.notes}</div>}
    </div>
  </div>
);

const DashboardView = () => (
  <div>
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
      <StatCard label="Total Events" value="12" sub="All time" />
      <StatCard label="This Year" value="8" sub="2026" />
      <StatCard label="Doctors" value="3" />
      <StatCard label="Symptoms" value="15" sub="Logged" />
      <StatCard label="Streak" value="4w" sub="Active logging" />
    </div>
    <div className="grid md:grid-cols-2 gap-6">
      <div className="rounded-2xl border p-5 shadow-sm" style={{ background: "#fff", borderColor: "#e2ddd6" }}>
        <div className="font-serif font-bold mb-4 flex items-center gap-2">🕐 Recent Activity</div>
        <div className="flex flex-col gap-2">
          {demoEvents.slice(0, 4).map((e, i) => <EventItem key={i} event={e} />)}
        </div>
      </div>
      <div className="rounded-2xl border p-5 shadow-sm" style={{ background: "#fff", borderColor: "#e2ddd6" }}>
        <div className="font-serif font-bold mb-4 flex items-center gap-2">📊 This Year at a Glance</div>
        <div className="h-[250px] flex items-center justify-center" style={{ color: "#6b6b80" }}>
          <div className="text-center">
            <div className="text-4xl mb-2">📈</div>
            <div className="text-sm">Chart visualization</div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const LogEventView = () => (
  <div className="max-w-[640px] mx-auto">
    <div className="rounded-2xl border p-6 shadow-sm" style={{ background: "#fff", borderColor: "#e2ddd6" }}>
      <div className="font-serif font-bold mb-5 flex items-center gap-2">➕ Log a Medical Event</div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.78rem] font-semibold uppercase tracking-wider" style={{ color: "#6b6b80" }}>Event Type</label>
          <select className="rounded-lg border px-3 py-2.5 text-sm" style={{ background: "#f7f4ef", borderColor: "#e2ddd6" }}>
            <option>Doctor's Visit</option><option>Check-up</option><option>Surgery</option><option>Medication</option><option>Other</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.78rem] font-semibold uppercase tracking-wider" style={{ color: "#6b6b80" }}>Date</label>
          <input type="date" className="rounded-lg border px-3 py-2.5 text-sm" style={{ background: "#f7f4ef", borderColor: "#e2ddd6" }} defaultValue="2026-03-04" />
        </div>
        <div className="col-span-2 flex flex-col gap-1.5">
          <label className="text-[0.78rem] font-semibold uppercase tracking-wider" style={{ color: "#6b6b80" }}>Title / Description</label>
          <input type="text" placeholder="e.g. Annual physical, Ibuprofen 200mg…" className="rounded-lg border px-3 py-2.5 text-sm" style={{ background: "#f7f4ef", borderColor: "#e2ddd6" }} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.78rem] font-semibold uppercase tracking-wider" style={{ color: "#6b6b80" }}>Doctor / Clinic</label>
          <input type="text" placeholder="Dr. Smith / City Clinic" className="rounded-lg border px-3 py-2.5 text-sm" style={{ background: "#f7f4ef", borderColor: "#e2ddd6" }} />
        </div>
        <div className="col-span-2 flex flex-col gap-1.5">
          <label className="text-[0.78rem] font-semibold uppercase tracking-wider" style={{ color: "#6b6b80" }}>Notes</label>
          <textarea placeholder="Additional details…" className="rounded-lg border px-3 py-2.5 text-sm min-h-[72px]" style={{ background: "#f7f4ef", borderColor: "#e2ddd6" }} />
        </div>
      </div>
      <button className="mt-4 px-6 py-2.5 rounded-lg text-white text-sm font-semibold" style={{ background: "#2d6a4f" }}>💾 Save Event</button>
    </div>
  </div>
);

const SymptomsView = () => (
  <div className="grid md:grid-cols-2 gap-6">
    <div className="rounded-2xl border p-5 shadow-sm" style={{ background: "#fff", borderColor: "#e2ddd6" }}>
      <div className="font-serif font-bold mb-4">🤒 Log a Symptom</div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.78rem] font-semibold uppercase tracking-wider" style={{ color: "#6b6b80" }}>Symptom</label>
          <select className="rounded-lg border px-3 py-2.5 text-sm" style={{ background: "#f7f4ef", borderColor: "#e2ddd6" }}>
            <option>Headache</option><option>Back Pain</option><option>Fatigue</option><option>Nausea</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.78rem] font-semibold uppercase tracking-wider" style={{ color: "#6b6b80" }}>Date</label>
          <input type="date" className="rounded-lg border px-3 py-2.5 text-sm" style={{ background: "#f7f4ef", borderColor: "#e2ddd6" }} />
        </div>
        <div className="col-span-2 flex flex-col gap-1.5">
          <label className="text-[0.78rem] font-semibold uppercase tracking-wider" style={{ color: "#6b6b80" }}>Severity</label>
          <div className="flex gap-2">
            <span className="px-3 py-1.5 rounded-lg border text-xs font-semibold bg-emerald-50 border-emerald-300 text-emerald-700">😌 Mild</span>
            <span className="px-3 py-1.5 rounded-lg border text-xs font-semibold" style={{ borderColor: "#e2ddd6", color: "#6b6b80" }}>😟 Moderate</span>
            <span className="px-3 py-1.5 rounded-lg border text-xs font-semibold" style={{ borderColor: "#e2ddd6", color: "#6b6b80" }}>😰 Severe</span>
          </div>
        </div>
      </div>
      <button className="mt-4 px-6 py-2.5 rounded-lg text-white text-sm font-semibold" style={{ background: "#9d174d" }}>💾 Save Symptom</button>
    </div>
    <div className="rounded-2xl border p-5 shadow-sm" style={{ background: "#fff", borderColor: "#e2ddd6" }}>
      <div className="font-serif font-bold mb-4">📋 Symptom History</div>
      <div className="flex flex-col gap-2">
        {demoSymptoms.map((s, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-xl border" style={{ background: "#f7f4ef", borderColor: "#e2ddd6" }}>
            <div className="w-2 h-2 rounded-full bg-pink-300 mt-1.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{s.name}</span>
                <span className={`text-[0.68rem] font-bold px-2 py-0.5 rounded-full ${sevColors[s.severity]}`}>{s.severity}</span>
              </div>
              <div className="text-xs mt-0.5" style={{ color: "#6b6b80" }}>{s.date} · Trigger: {s.trigger}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const HistoryView = () => (
  <div className="rounded-2xl border p-5 shadow-sm" style={{ background: "#fff", borderColor: "#e2ddd6" }}>
    <div className="font-serif font-bold mb-4">📅 Medical Event History</div>
    <div className="flex flex-wrap gap-2 mb-4">
      {["All", "Visits", "Check-ups", "Surgeries", "Medications"].map((c, i) => (
        <span key={c} className={`px-3 py-1 rounded-full text-xs font-semibold border cursor-pointer ${i === 0 ? "bg-emerald-50 border-emerald-300 text-emerald-700" : ""}`} style={i !== 0 ? { borderColor: "#e2ddd6", color: "#6b6b80" } : {}}>
          {c}
        </span>
      ))}
    </div>
    <div className="flex flex-col gap-2">
      {demoEvents.map((e, i) => <EventItem key={i} event={e} />)}
    </div>
  </div>
);

const AnalysisView = () => (
  <div>
    <div className="flex items-center gap-3 mb-6">
      <h2 className="font-serif text-xl font-bold">Yearly Health Report</h2>
      <select className="rounded-lg border px-3 py-1.5 text-sm" style={{ background: "#f7f4ef", borderColor: "#e2ddd6" }}>
        <option>2026</option><option>2025</option>
      </select>
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      <StatCard label="Total Records" value="12" />
      <StatCard label="Symptoms" value="15" />
      <StatCard label="Doctors Seen" value="3" />
      <StatCard label="Top Symptom" value="Headache" />
    </div>
    <div className="grid md:grid-cols-2 gap-6">
      {["📈 Events by Month", "🥧 Record Types", "🤒 Top Symptoms", "😰 Severity Split"].map((title) => (
        <div key={title} className="rounded-2xl border p-5 shadow-sm" style={{ background: "#fff", borderColor: "#e2ddd6" }}>
          <div className="font-serif font-bold mb-4">{title}</div>
          <div className="h-[200px] flex items-center justify-center" style={{ color: "#6b6b80" }}>
            <span className="text-sm">Chart placeholder</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const FamilyView = () => (
  <div className="grid md:grid-cols-2 gap-6">
    <div className="rounded-2xl border p-5 shadow-sm" style={{ background: "#fff", borderColor: "#e2ddd6" }}>
      <div className="font-serif font-bold mb-4">👨‍👩‍👧 Family Members</div>
      {[
        { name: "Jane Smith", rel: "Self", color: "#2d6a4f", events: 12 },
        { name: "John Smith", rel: "Spouse", color: "#b7791f", events: 5 },
        { name: "Lily Smith", rel: "Child", color: "#9d174d", events: 3 },
      ].map((p) => (
        <div key={p.name} className="flex items-center gap-3 p-3 rounded-xl border mb-2" style={{ background: "#f7f4ef", borderColor: "#e2ddd6" }}>
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: p.color }}>
            {p.name.split(" ").map(n => n[0]).join("")}
          </div>
          <div className="flex-1">
            <div className="font-semibold text-sm">{p.name}</div>
            <div className="text-xs" style={{ color: "#6b6b80" }}>{p.rel} · {p.events} events</div>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-lg" style={p.rel === "Self" ? { background: "#e8f5ee", color: "#2d6a4f" } : { background: "#2d6a4f", color: "#fff" }}>
            {p.rel === "Self" ? "Current" : "Switch"}
          </span>
        </div>
      ))}
    </div>
    <div className="rounded-2xl border p-5 shadow-sm" style={{ background: "#fff", borderColor: "#e2ddd6" }}>
      <div className="font-serif font-bold mb-4">➕ Add Family Member</div>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.78rem] font-semibold uppercase tracking-wider" style={{ color: "#6b6b80" }}>Full Name</label>
          <input type="text" placeholder="e.g. Sarah Johnson" className="rounded-lg border px-3 py-2.5 text-sm" style={{ background: "#f7f4ef", borderColor: "#e2ddd6" }} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.78rem] font-semibold uppercase tracking-wider" style={{ color: "#6b6b80" }}>Relationship</label>
          <select className="rounded-lg border px-3 py-2.5 text-sm" style={{ background: "#f7f4ef", borderColor: "#e2ddd6" }}>
            <option>Spouse / Partner</option><option>Child</option><option>Parent</option><option>Sibling</option><option>Other</option>
          </select>
        </div>
        <button className="px-6 py-2.5 rounded-lg text-white text-sm font-semibold" style={{ background: "#2d6a4f" }}>Add Family Member</button>
      </div>
    </div>
  </div>
);

export default MedLog;
