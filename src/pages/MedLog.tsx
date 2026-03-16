import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, BarChart3, Calendar, ClipboardList, Heart, Plus, Stethoscope, Users } from "lucide-react";

// ── Access gate (independent from AI Governance) ──────────────────────────────
const ML_ACCESS_KEY = "pl_medlog_access";
const ML_ACCESS_CODE = "PRL2026";
function mlUnlocked(): boolean {
  try { return localStorage.getItem(ML_ACCESS_KEY) === "1"; } catch { return false; }
}

// ── Types ─────────────────────────────────────────────────────────────────────
type EventType = "visit" | "medication" | "checkup" | "surgery" | "other";
type Severity = "Mild" | "Moderate" | "Severe";

interface MedEvent {
  id: string; type: EventType; title: string; doctor: string; date: string; dateTo?: string; notes: string;
}
interface SymptomEntry {
  id: string; name: string; severity: Severity; date: string; dateTo?: string; trigger: string; notes: string;
}

// ── Persistence ───────────────────────────────────────────────────────────────
const EVENTS_KEY = "pl_medlog_events";
const SYMPTOMS_KEY = "pl_medlog_symptoms";

const DEFAULT_EVENTS: MedEvent[] = [
  { id: "d1", type: "visit",      title: "Annual Physical Exam",        doctor: "Dr. Smith", date: "2026-02-15", notes: "All vitals normal" },
  { id: "d2", type: "medication", title: "Ibuprofen 200mg",             doctor: "",          date: "2026-02-10", notes: "For headache, twice daily" },
  { id: "d3", type: "checkup",    title: "Dental Cleaning",             doctor: "Dr. Park",  date: "2026-01-28", notes: "No cavities" },
  { id: "d4", type: "visit",      title: "Follow-up - Blood Work",      doctor: "Dr. Smith", date: "2026-01-15", notes: "Cholesterol slightly elevated" },
  { id: "d5", type: "surgery",    title: "Mole Removal",                doctor: "Dr. Lee",   date: "2025-12-20", notes: "Minor procedure, healed well" },
];

const DEFAULT_SYMPTOMS: SymptomEntry[] = [
  { id: "s1", name: "Headache",  severity: "Mild",     date: "2026-02-18", trigger: "Screen time",      notes: "" },
  { id: "s2", name: "Back Pain", severity: "Moderate", date: "2026-02-12", trigger: "Physical activity", notes: "" },
  { id: "s3", name: "Fatigue",   severity: "Mild",     date: "2026-02-05", trigger: "Lack of sleep",    notes: "" },
  { id: "s4", name: "Headache",  severity: "Mild",     date: "2026-01-22", trigger: "Screen time",      notes: "" },
  { id: "s5", name: "Fatigue",   severity: "Moderate", date: "2026-01-10", trigger: "Stress",           notes: "" },
];

function loadItems<T>(key: string, defaults: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
    localStorage.setItem(key, JSON.stringify(defaults));
    return defaults;
  } catch { return defaults; }
}
function saveItems<T>(key: string, items: T[]) {
  try { localStorage.setItem(key, JSON.stringify(items)); } catch {}
}

// ── Config ────────────────────────────────────────────────────────────────────
const navItems = [
  { id: "dashboard", label: "Dashboard", icon: ClipboardList },
  { id: "log",       label: "Log Event", icon: Plus },
  { id: "symptoms",  label: "Symptoms",  icon: Stethoscope },
  { id: "history",   label: "History",   icon: Calendar },
  { id: "analysis",  label: "Analysis",  icon: BarChart3 },
  { id: "family",    label: "Family",    icon: Users },
];

const TYPE_LABELS: Record<EventType, string> = {
  visit: "Doctor's Visit", medication: "Medication",
  checkup: "Check-up", surgery: "Surgery", other: "Other",
};

const typeColors: Record<string, string> = {
  visit: "bg-emerald-100 text-emerald-700", medication: "bg-amber-100 text-amber-700",
  checkup: "bg-sky-100 text-sky-700", surgery: "bg-red-100 text-red-700", other: "bg-purple-100 text-purple-700",
};

const sevColors: Record<string, string> = {
  Mild: "bg-emerald-100 text-emerald-700",
  Moderate: "bg-amber-100 text-amber-700",
  Severe: "bg-red-100 text-red-700",
};

const SYMPTOM_OPTIONS = ["Headache", "Back Pain", "Fatigue", "Nausea", "Dizziness",
  "Chest Pain", "Shortness of Breath", "Fever", "Cough", "Other"];
const TRIGGER_OPTIONS = ["Screen time", "Physical activity", "Lack of sleep",
  "Stress", "Diet / Food", "Weather", "Alcohol", "Unknown", "Other"];

const today = () => new Date().toISOString().slice(0, 10);

// ── DateInput ─────────────────────────────────────────────────────────────────
const DateInput = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
  const ref = useRef<HTMLInputElement>(null);
  const open = () => {
    if (!ref.current) return;
    if (typeof ref.current.showPicker === "function") ref.current.showPicker();
    else ref.current.focus();
  };
  const handleBlur = () => {
    if (!value) return;
    const parts = value.split("-");
    if (parts.length === 3) {
      let year = parseInt(parts[0], 10);
      if (isNaN(year) || year < 1900) year = 1900;
      if (year > 2099) year = 2099;
      const corrected = `${year}-${parts[1]}-${parts[2]}`;
      if (corrected !== value) onChange(corrected);
    }
  };
  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
      <input ref={ref} type="date" value={value} min="1900-01-01" max="2099-12-31"
        onChange={e => onChange(e.target.value)} onBlur={handleBlur}
        className="rounded-lg border px-3 py-2.5 text-sm w-full"
        style={{ background: "#f7f4ef", borderColor: "#e2ddd6", paddingRight: "2.5rem" }} />
      <button type="button" onClick={open} tabIndex={-1}
        style={{ position: "absolute", right: 8, background: "none", border: "none", cursor: "pointer", fontSize: 16, lineHeight: 1, padding: 2, color: "#6b6b80" }}>
        📅
      </button>
    </div>
  );
};

// ── Analysis helpers ──────────────────────────────────────────────────────────
function getMonthlyData(events: MedEvent[], symptoms: SymptomEntry[], year: number) {
  return Array.from({ length: 12 }, (_, i) => {
    const m = String(i + 1).padStart(2, "0");
    const prefix = `${year}-${m}`;
    return {
      label: new Date(year, i, 1).toLocaleDateString("en-US", { month: "short" }),
      events: events.filter(e => e.date.startsWith(prefix)).length,
      symptoms: symptoms.filter(s => s.date.startsWith(prefix)).length,
    };
  });
}

function topN(map: Record<string, number>, n = 5): Array<{ name: string; count: number }> {
  return Object.entries(map).map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count).slice(0, n);
}

function generateInsights(events: MedEvent[], symptoms: SymptomEntry[], year: string): string[] {
  const yEvts = events.filter(e => e.date.startsWith(year));
  const ySyms = symptoms.filter(s => s.date.startsWith(year));
  const insights: string[] = [];

  const symCounts: Record<string, number> = {};
  ySyms.forEach(s => { symCounts[s.name] = (symCounts[s.name] || 0) + 1; });
  const topSym = Object.entries(symCounts).sort((a, b) => b[1] - a[1])[0];
  if (topSym) insights.push(`🔁 ${topSym[0]} is your most frequent symptom, logged ${topSym[1]}× in ${year}.`);

  const trigCounts: Record<string, number> = {};
  ySyms.forEach(s => { if (s.trigger && s.trigger !== "Unknown") trigCounts[s.trigger] = (trigCounts[s.trigger] || 0) + 1; });
  const topTrig = Object.entries(trigCounts).sort((a, b) => b[1] - a[1])[0];
  if (topTrig) insights.push(`⚡ "${topTrig[0]}" is your most common trigger — linked to ${topTrig[1]} episode${topTrig[1] > 1 ? "s" : ""}.`);

  const severeCount = ySyms.filter(s => s.severity === "Severe").length;
  if (severeCount > 0) insights.push(`⚠️ ${severeCount} severe episode${severeCount > 1 ? "s" : ""} logged — consider discussing patterns with your doctor.`);
  else if (ySyms.length > 0) insights.push(`✅ No severe episodes logged in ${year} — great sign!`);

  const headScreen = ySyms.filter(s => s.name === "Headache" && s.trigger === "Screen time").length;
  if (headScreen >= 2) insights.push(`💡 ${headScreen} of your headaches are linked to screen time — consider regular eye breaks.`);

  const monthCounts: Record<string, number> = {};
  [...yEvts.map(e => e.date), ...ySyms.map(s => s.date)].forEach(d => {
    const k = d.slice(0, 7); monthCounts[k] = (monthCounts[k] || 0) + 1;
  });
  const topMonth = Object.entries(monthCounts).sort((a, b) => b[1] - a[1])[0];
  if (topMonth) {
    const [y, m] = topMonth[0].split("-");
    const mName = new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString("en-US", { month: "long" });
    insights.push(`📅 ${mName} was your most active health month with ${topMonth[1]} entries.`);
  }

  if (insights.length === 0) insights.push("📝 Start logging events and symptoms to see personalised insights here.");
  return insights;
}

// ── MedLog (main) ─────────────────────────────────────────────────────────────
const MedLog = () => {
  const [activeView, setActiveView] = useState("dashboard");
  const [unlocked, setUnlocked] = useState(mlUnlocked);
  const [showLockModal, setShowLockModal] = useState(false);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState(false);
  const [events, setEvents] = useState<MedEvent[]>(() => loadItems(EVENTS_KEY, DEFAULT_EVENTS));
  const [symptoms, setSymptoms] = useState<SymptomEntry[]>(() => loadItems(SYMPTOMS_KEY, DEFAULT_SYMPTOMS));

  useEffect(() => {
    const hash = window.location.hash.replace("#", "").toUpperCase().trim();
    if (hash === ML_ACCESS_CODE) {
      try { localStorage.setItem(ML_ACCESS_KEY, "1"); } catch {}
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
      setUnlocked(true);
    }
  }, []);

  const addEvent = useCallback((e: MedEvent) => {
    setEvents(prev => { const u = [e, ...prev]; saveItems(EVENTS_KEY, u); return u; });
  }, []);

  const addSymptom = useCallback((s: SymptomEntry) => {
    setSymptoms(prev => { const u = [s, ...prev]; saveItems(SYMPTOMS_KEY, u); return u; });
  }, []);

  const tryUnlock = () => {
    if (code.toUpperCase().trim() === ML_ACCESS_CODE) {
      try { localStorage.setItem(ML_ACCESS_KEY, "1"); } catch {}
      setUnlocked(true); setShowLockModal(false); setCode("");
    } else {
      setCodeError(true); setTimeout(() => setCodeError(false), 800); setCode("");
    }
  };

  const lock = () => {
    try { localStorage.removeItem(ML_ACCESS_KEY); } catch {}
    setUnlocked(false);
  };

  return (
    <div className="min-h-screen" style={{ background: "#f7f4ef", color: "#1a1a2e", fontFamily: "'DM Sans', sans-serif" }}>
      {showLockModal && !unlocked && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(26,26,46,0.8)", backdropFilter: "blur(4px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: "40px 44px", maxWidth: 400, width: "100%", textAlign: "center", boxShadow: "0 25px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ fontSize: 44, marginBottom: 14 }}>🔒</div>
            <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 800, color: "#1a1a2e" }}>MedLog Access</h2>
            <p style={{ margin: "0 0 24px", fontSize: 13, color: "#6b6b80", lineHeight: 1.6 }}>Enter your access code to view the full application.</p>
            <input type="password" placeholder="Access code" value={code} autoFocus
              onChange={e => setCode(e.target.value)} onKeyDown={e => e.key === "Enter" && tryUnlock()}
              style={{ width: "100%", padding: "12px 14px", border: `2px solid ${codeError ? "#dc2626" : "#e2e8f0"}`, borderRadius: 10, fontSize: 15, outline: "none", marginBottom: 12, boxSizing: "border-box", fontFamily: "monospace", letterSpacing: "0.15em", textAlign: "center", background: codeError ? "#fef2f2" : "#fff" }} />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setShowLockModal(false); setCode(""); }} style={{ flex: 1, padding: "11px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#f7f4ef", color: "#6b6b80", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
              <button onClick={tryUnlock} style={{ flex: 2, padding: "11px", borderRadius: 10, border: "none", background: "#1a1a2e", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Unlock →</button>
            </div>
            {codeError && <p style={{ color: "#dc2626", fontSize: 12, marginTop: 10 }}>Incorrect code — try again.</p>}
          </div>
        </div>
      )}

      <header className="sticky top-0 z-50 flex items-center justify-between px-4 h-16" style={{ background: "#1a1a2e" }}>
        <div className="flex items-center gap-3">
          <Link to="/" className="text-white/50 hover:text-white transition-colors"><ArrowLeft className="w-4 h-4" /></Link>
          <span className="text-xl font-serif tracking-tight text-white">Med<span style={{ color: "#74c69d" }}>Log</span> ✦</span>
        </div>
        <nav className="flex gap-1 flex-wrap justify-end">
          {navItems.map((item) => (
            <button key={item.id} onClick={() => setActiveView(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeView === item.id ? "bg-white/10 text-[#74c69d]" : "text-white/60 hover:bg-white/5 hover:text-white"}`}>
              <item.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-2 ml-2">
          {unlocked ? (
            <button onClick={lock} title="Lock MedLog" style={{ background: "rgba(116,198,157,0.15)", border: "1px solid rgba(116,198,157,0.4)", borderRadius: 8, padding: "4px 10px", fontSize: 13, cursor: "pointer", color: "#74c69d" }}>🔓</button>
          ) : (
            <button onClick={() => setShowLockModal(true)} style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 8, padding: "4px 10px", fontSize: 13, cursor: "pointer", color: "#fff", fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
              🔒 <span style={{ fontSize: 11 }}>Owner</span>
            </button>
          )}
          <div className="flex items-center gap-2 bg-white/10 rounded-full py-1 px-3">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "#2d6a4f" }}>JS</div>
            <span className="text-xs font-semibold text-white/90 hidden sm:inline">Jane</span>
          </div>
        </div>
      </header>

      <main className="max-w-[1100px] mx-auto px-6 py-8 relative overflow-hidden">
        {!unlocked && (<>
          <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
            <div className="absolute inset-0 flex flex-col justify-center items-center gap-24" style={{ transform: "rotate(-35deg)", transformOrigin: "center center" }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex gap-16 whitespace-nowrap">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <span key={j} className="text-lg font-bold uppercase tracking-[0.3em] select-none" style={{ color: "rgba(26,26,46,0.06)" }}>© MedLog · Copyrighted</span>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="pointer-events-none absolute inset-0 z-40" style={{ background: "linear-gradient(to bottom, transparent 40%, rgba(247,244,239,0.7) 55%, rgba(247,244,239,0.95) 75%, #f7f4ef 100%)" }} />
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-50 text-center">
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl shadow-lg" style={{ background: "#1a1a2e" }}>
              <Heart className="w-5 h-5 text-[#74c69d]" />
              <span className="text-white font-semibold text-sm">Full app coming soon — stay tuned!</span>
            </div>
            <p className="mt-3 text-sm" style={{ color: "#6b6b80" }}>This is a preview of MedLog. Backend &amp; interactivity launching shortly.</p>
          </div>
        </>)}

        {activeView === "dashboard" && <DashboardView events={events} symptoms={symptoms} />}
        {activeView === "log"       && <LogEventView onSave={addEvent} />}
        {activeView === "symptoms"  && <SymptomsView symptoms={symptoms} onSave={addSymptom} />}
        {activeView === "history"   && <HistoryView events={events} />}
        {activeView === "analysis"  && <AnalysisView events={events} symptoms={symptoms} />}
        {activeView === "family"    && <FamilyView />}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-30 text-center py-2 text-[0.7rem] tracking-wide" style={{ background: "#1a1a2e", color: "rgba(255,255,255,0.35)" }}>
        © 2026 MedLog · All rights reserved · Private &amp; Confidential · Unauthorised reproduction prohibited
      </footer>
    </div>
  );
};

// ── Shared components ─────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
  <div className="rounded-2xl border p-4 shadow-sm" style={{ background: "#fff", borderColor: "#e2ddd6" }}>
    <div className="text-[0.72rem] font-semibold uppercase tracking-wider" style={{ color: "#6b6b80" }}>{label}</div>
    <div className="text-2xl font-serif font-bold mt-1">{value}</div>
    {sub && <div className="text-xs mt-0.5" style={{ color: "#6b6b80" }}>{sub}</div>}
  </div>
);

const EventItem = ({ event }: { event: MedEvent }) => (
  <div className="flex items-start gap-3 p-3 rounded-xl border" style={{ background: "#f7f4ef", borderColor: "#e2ddd6" }}>
    <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${(typeColors[event.type] || "").split(" ")[0] || "bg-gray-300"}`} />
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-sm">{event.title}</span>
        <span className={`text-[0.68rem] font-bold uppercase px-2 py-0.5 rounded-full ${typeColors[event.type]}`}>{event.type}</span>
      </div>
      <div className="text-xs mt-0.5" style={{ color: "#6b6b80" }}>{event.date}{event.dateTo ? ` → ${event.dateTo}` : ""}{event.doctor && ` · ${event.doctor}`}</div>
      {event.notes && <div className="text-xs mt-1 italic" style={{ color: "#6b6b80" }}>{event.notes}</div>}
    </div>
  </div>
);

// ── Views ─────────────────────────────────────────────────────────────────────
const DashboardView = ({ events, symptoms }: { events: MedEvent[]; symptoms: SymptomEntry[] }) => {
  const thisYear = new Date().getFullYear();
  const yearEvents = events.filter(e => e.date.startsWith(String(thisYear)));
  const doctors = new Set(events.filter(e => e.doctor).map(e => e.doctor)).size;
  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <StatCard label="Total Events"  value={String(events.length)}      sub="All time" />
        <StatCard label="This Year"     value={String(yearEvents.length)}   sub={String(thisYear)} />
        <StatCard label="Doctors"       value={String(doctors)} />
        <StatCard label="Symptoms"      value={String(symptoms.length)}     sub="Logged" />
        <StatCard label="Streak"        value="4w" sub="Active logging" />
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl border p-5 shadow-sm" style={{ background: "#fff", borderColor: "#e2ddd6" }}>
          <div className="font-serif font-bold mb-4">🕐 Recent Activity</div>
          <div className="flex flex-col gap-2">{events.slice(0, 4).map(e => <EventItem key={e.id} event={e} />)}</div>
        </div>
        <div className="rounded-2xl border p-5 shadow-sm" style={{ background: "#fff", borderColor: "#e2ddd6" }}>
          <div className="font-serif font-bold mb-4">🤒 Recent Symptoms</div>
          <div className="flex flex-col gap-2">
            {symptoms.slice(0, 4).map(s => (
              <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl border" style={{ background: "#f7f4ef", borderColor: "#e2ddd6" }}>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{s.name}</span>
                    <span className={`text-[0.68rem] font-bold px-2 py-0.5 rounded-full ${sevColors[s.severity]}`}>{s.severity}</span>
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "#6b6b80" }}>{s.date}{s.trigger && ` · ${s.trigger}`}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const LogEventView = ({ onSave }: { onSave: (e: MedEvent) => void }) => {
  const [type, setType] = useState<EventType>("visit");
  const [date, setDate] = useState(today());
  const [dateTo, setDateTo] = useState("");
  const [title, setTitle] = useState("");
  const [doctor, setDoctor] = useState("");
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({ id: `evt_${Date.now()}`, type, date, ...(dateTo ? { dateTo } : {}), title: title.trim(), doctor: doctor.trim(), notes: notes.trim() });
    setTitle(""); setDoctor(""); setNotes(""); setDate(today()); setDateTo("");
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const inputStyle = { background: "#f7f4ef", borderColor: "#e2ddd6" };
  const labelCls = "text-[0.78rem] font-semibold uppercase tracking-wider";

  return (
    <div className="max-w-[640px] mx-auto">
      <div className="rounded-2xl border p-6 shadow-sm" style={{ background: "#fff", borderColor: "#e2ddd6" }}>
        <div className="font-serif font-bold mb-5 flex items-center gap-2">➕ Log a Medical Event</div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} style={{ color: "#6b6b80" }}>Event Type</label>
            <select value={type} onChange={e => setType(e.target.value as EventType)}
              className="rounded-lg border px-3 py-2.5 text-sm" style={inputStyle}>
              {(Object.entries(TYPE_LABELS) as [EventType, string][]).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} style={{ color: "#6b6b80" }}>From Date</label>
            <DateInput value={date} onChange={setDate} />
          </div>
          <div className="col-span-2 flex flex-col gap-1.5">
            <label className={labelCls} style={{ color: "#6b6b80" }}>To Date <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional — leave blank for single-day events)</span></label>
            <div className="flex items-center gap-2">
              <div className="flex-1"><DateInput value={dateTo} onChange={setDateTo} /></div>
              {dateTo && <button type="button" onClick={() => setDateTo("")} style={{ fontSize: 18, lineHeight: 1, background: "none", border: "none", cursor: "pointer", color: "#6b6b80" }}>✕</button>}
            </div>
          </div>
          <div className="col-span-2 flex flex-col gap-1.5">
            <label className={labelCls} style={{ color: "#6b6b80" }}>Title / Description</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Annual physical, Ibuprofen 200mg…"
              className="rounded-lg border px-3 py-2.5 text-sm" style={inputStyle} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} style={{ color: "#6b6b80" }}>Doctor / Clinic</label>
            <input type="text" value={doctor} onChange={e => setDoctor(e.target.value)}
              placeholder="Dr. Smith / City Clinic"
              className="rounded-lg border px-3 py-2.5 text-sm" style={inputStyle} />
          </div>
          <div className="col-span-2 flex flex-col gap-1.5">
            <label className={labelCls} style={{ color: "#6b6b80" }}>Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Additional details…" className="rounded-lg border px-3 py-2.5 text-sm min-h-[72px]" style={inputStyle} />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button onClick={handleSave} className="px-6 py-2.5 rounded-lg text-white text-sm font-semibold" style={{ background: "#2d6a4f" }}>💾 Save Event</button>
          {saved && <span className="text-sm font-medium" style={{ color: "#2d6a4f" }}>✓ Saved!</span>}
        </div>
      </div>
    </div>
  );
};

const SymptomsView = ({ symptoms, onSave }: { symptoms: SymptomEntry[]; onSave: (s: SymptomEntry) => void }) => {
  const [name, setName] = useState("Headache");
  const [customName, setCustomName] = useState("");
  const [severity, setSeverity] = useState<Severity>("Mild");
  const [date, setDate] = useState(today());
  const [dateTo, setDateTo] = useState("");
  const [trigger, setTrigger] = useState("Unknown");
  const [customTrigger, setCustomTrigger] = useState("");
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    const finalName = name === "Other" ? (customName.trim() || "Other") : name;
    const finalTrigger = trigger === "Other" ? (customTrigger.trim() || "Other") : trigger;
    onSave({ id: `sym_${Date.now()}`, name: finalName, severity, date, ...(dateTo ? { dateTo } : {}), trigger: finalTrigger, notes: notes.trim() });
    setCustomName(""); setNotes(""); setDate(today()); setDateTo(""); setCustomTrigger("");
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const inputStyle = { background: "#f7f4ef", borderColor: "#e2ddd6" };
  const labelCls = "text-[0.78rem] font-semibold uppercase tracking-wider";

  const sevConfig: { value: Severity; emoji: string }[] = [
    { value: "Mild", emoji: "😌" }, { value: "Moderate", emoji: "😟" }, { value: "Severe", emoji: "😰" },
  ];

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="rounded-2xl border p-5 shadow-sm" style={{ background: "#fff", borderColor: "#e2ddd6" }}>
        <div className="font-serif font-bold mb-4">🤒 Log a Symptom</div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} style={{ color: "#6b6b80" }}>Symptom</label>
            <select value={name} onChange={e => setName(e.target.value)}
              className="rounded-lg border px-3 py-2.5 text-sm" style={inputStyle}>
              {SYMPTOM_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          {name === "Other" && (
            <div className="flex flex-col gap-1.5">
              <label className={labelCls} style={{ color: "#6b6b80" }}>Specify</label>
              <input type="text" value={customName} onChange={e => setCustomName(e.target.value)}
                placeholder="Describe symptom" className="rounded-lg border px-3 py-2.5 text-sm" style={inputStyle} />
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} style={{ color: "#6b6b80" }}>From Date</label>
            <DateInput value={date} onChange={setDate} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} style={{ color: "#6b6b80" }}>To Date <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
            <div className="flex items-center gap-1">
              <div className="flex-1"><DateInput value={dateTo} onChange={setDateTo} /></div>
              {dateTo && <button type="button" onClick={() => setDateTo("")} style={{ fontSize: 18, lineHeight: 1, background: "none", border: "none", cursor: "pointer", color: "#6b6b80" }}>✕</button>}
            </div>
          </div>
          <div className="col-span-2 flex flex-col gap-1.5">
            <label className={labelCls} style={{ color: "#6b6b80" }}>Severity</label>
            <div className="flex gap-2">
              {sevConfig.map(({ value, emoji }) => (
                <button key={value} type="button" onClick={() => setSeverity(value)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${severity === value ? sevColors[value] + " ring-2 ring-offset-1" : ""}`}
                  style={severity !== value ? { borderColor: "#e2ddd6", color: "#6b6b80", background: "#f7f4ef" } : {}}>
                  {emoji} {value}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} style={{ color: "#6b6b80" }}>Trigger</label>
            <select value={trigger} onChange={e => setTrigger(e.target.value)}
              className="rounded-lg border px-3 py-2.5 text-sm" style={inputStyle}>
              {TRIGGER_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          {trigger === "Other" && (
            <div className="flex flex-col gap-1.5">
              <label className={labelCls} style={{ color: "#6b6b80" }}>Specify trigger</label>
              <input type="text" value={customTrigger} onChange={e => setCustomTrigger(e.target.value)}
                placeholder="Describe trigger" className="rounded-lg border px-3 py-2.5 text-sm" style={inputStyle} />
            </div>
          )}
          <div className="col-span-2 flex flex-col gap-1.5">
            <label className={labelCls} style={{ color: "#6b6b80" }}>Notes (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Any additional context…" className="rounded-lg border px-3 py-2.5 text-sm min-h-[60px]" style={inputStyle} />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button onClick={handleSave} className="px-6 py-2.5 rounded-lg text-white text-sm font-semibold" style={{ background: "#9d174d" }}>💾 Save Symptom</button>
          {saved && <span className="text-sm font-medium" style={{ color: "#9d174d" }}>✓ Saved!</span>}
        </div>
      </div>

      <div className="rounded-2xl border p-5 shadow-sm" style={{ background: "#fff", borderColor: "#e2ddd6" }}>
        <div className="font-serif font-bold mb-4">📋 Symptom History</div>
        <div className="flex flex-col gap-2">
          {symptoms.slice(0, 8).map(s => (
            <div key={s.id} className="flex items-start gap-3 p-3 rounded-xl border" style={{ background: "#f7f4ef", borderColor: "#e2ddd6" }}>
              <div className="w-2 h-2 rounded-full bg-pink-300 mt-1.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{s.name}</span>
                  <span className={`text-[0.68rem] font-bold px-2 py-0.5 rounded-full ${sevColors[s.severity]}`}>{s.severity}</span>
                </div>
                <div className="text-xs mt-0.5" style={{ color: "#6b6b80" }}>{s.date}{s.dateTo ? ` → ${s.dateTo}` : ""}{s.trigger ? ` · Trigger: ${s.trigger}` : ""}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const HistoryView = ({ events }: { events: MedEvent[] }) => {
  const [filter, setFilter] = useState("All");
  const filters = ["All", "visit", "checkup", "surgery", "medication", "other"];
  const filtered = filter === "All" ? events : events.filter(e => e.type === filter);
  return (
    <div className="rounded-2xl border p-5 shadow-sm" style={{ background: "#fff", borderColor: "#e2ddd6" }}>
      <div className="font-serif font-bold mb-4">📅 Medical Event History</div>
      <div className="flex flex-wrap gap-2 mb-4">
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-semibold border cursor-pointer transition-all ${filter === f ? "bg-emerald-50 border-emerald-300 text-emerald-700" : ""}`}
            style={filter !== f ? { borderColor: "#e2ddd6", color: "#6b6b80" } : {}}>
            {f === "All" ? "All" : TYPE_LABELS[f as EventType]}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        {filtered.length === 0
          ? <p className="text-sm" style={{ color: "#6b6b80" }}>No events found.</p>
          : filtered.map(e => <EventItem key={e.id} event={e} />)}
      </div>
    </div>
  );
};

const AnalysisView = ({ events, symptoms }: { events: MedEvent[]; symptoms: SymptomEntry[] }) => {
  const currentYear = new Date().getFullYear();
  const availableYears = [...new Set([
    ...events.map(e => parseInt(e.date.slice(0, 4))),
    ...symptoms.map(s => parseInt(s.date.slice(0, 4))),
    currentYear,
  ])].sort((a, b) => b - a);

  const [year, setYear] = useState(currentYear);
  const yStr = String(year);
  const yEvts = events.filter(e => e.date.startsWith(yStr));
  const ySyms = symptoms.filter(s => s.date.startsWith(yStr));

  const monthlyData = getMonthlyData(events, symptoms, year);
  const maxMonthly = Math.max(...monthlyData.map(m => m.events + m.symptoms), 1);

  const symFreq: Record<string, number> = {};
  ySyms.forEach(s => { symFreq[s.name] = (symFreq[s.name] || 0) + 1; });
  const topSymptoms = topN(symFreq);
  const maxSymCount = Math.max(...topSymptoms.map(s => s.count), 1);

  const trigFreq: Record<string, number> = {};
  ySyms.forEach(s => { if (s.trigger) trigFreq[s.trigger] = (trigFreq[s.trigger] || 0) + 1; });
  const topTriggers = topN(trigFreq);
  const maxTrigCount = Math.max(...topTriggers.map(t => t.count), 1);

  const sevBreakdown = {
    Mild:     ySyms.filter(s => s.severity === "Mild").length,
    Moderate: ySyms.filter(s => s.severity === "Moderate").length,
    Severe:   ySyms.filter(s => s.severity === "Severe").length,
  };

  const insights = generateInsights(events, symptoms, yStr);
  const doctors = new Set(yEvts.filter(e => e.doctor).map(e => e.doctor)).size;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h2 className="font-serif text-xl font-bold">Health Analysis</h2>
        <select value={year} onChange={e => setYear(parseInt(e.target.value))}
          className="rounded-lg border px-3 py-1.5 text-sm" style={{ background: "#f7f4ef", borderColor: "#e2ddd6" }}>
          {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total Events"  value={String(yEvts.length)}       sub={yStr} />
        <StatCard label="Symptoms"      value={String(ySyms.length)}       sub="Logged" />
        <StatCard label="Doctors Seen"  value={String(doctors)} />
        <StatCard label="Top Symptom"   value={topSymptoms[0]?.name || "—"} sub={topSymptoms[0] ? `×${topSymptoms[0].count}` : ""} />
      </div>

      {/* Monthly chart + severity */}
      <div className="grid md:grid-cols-3 gap-6 mb-6">
        <div className="md:col-span-2 rounded-2xl border p-5 shadow-sm" style={{ background: "#fff", borderColor: "#e2ddd6" }}>
          <div className="font-serif font-bold mb-1">📈 Monthly Activity — {year}</div>
          <div className="flex items-center gap-4 mb-3 text-xs" style={{ color: "#6b6b80" }}>
            <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-sm inline-block" style={{ background: "#6ee7b7" }} /> Events</span>
            <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-sm inline-block" style={{ background: "#fca5a5" }} /> Symptoms</span>
          </div>
          <div style={{ height: 160, display: "flex", alignItems: "flex-end", gap: 4 }}>
            {monthlyData.map((m, i) => {
              const total = m.events + m.symptoms;
              const barH = total > 0 ? Math.max((total / maxMonthly) * 140, 4) : 0;
              return (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: "100%", height: 140, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                    {total > 0 && (
                      <div style={{ width: "100%", height: barH, display: "flex", flexDirection: "column", borderRadius: "3px 3px 0 0", overflow: "hidden" }}>
                        {m.symptoms > 0 && <div style={{ height: `${(m.symptoms / total) * 100}%`, background: "#fca5a5", flexShrink: 0 }} />}
                        {m.events > 0   && <div style={{ height: `${(m.events   / total) * 100}%`, background: "#6ee7b7", flexShrink: 0 }} />}
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: 9, color: "#6b6b80", marginTop: 3 }}>{m.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border p-5 shadow-sm" style={{ background: "#fff", borderColor: "#e2ddd6" }}>
          <div className="font-serif font-bold mb-4">🩺 Severity Split</div>
          {(Object.entries(sevBreakdown) as [string, number][]).map(([sev, count]) => (
            <div key={sev} className="flex items-center gap-3 mb-3">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${sevColors[sev]}`} style={{ minWidth: 64, textAlign: "center" }}>{sev}</span>
              <div className="flex-1 h-2 rounded-full" style={{ background: "#f0f0f0" }}>
                <div className="h-2 rounded-full transition-all" style={{
                  width: ySyms.length > 0 ? `${(count / ySyms.length) * 100}%` : "0%",
                  background: sev === "Mild" ? "#6ee7b7" : sev === "Moderate" ? "#fbbf24" : "#f87171",
                }} />
              </div>
              <span className="text-sm font-semibold" style={{ minWidth: 16 }}>{count}</span>
            </div>
          ))}
          {ySyms.length === 0 && <p className="text-xs" style={{ color: "#6b6b80" }}>No symptoms logged for {year}.</p>}
        </div>
      </div>

      {/* Top symptoms + top triggers */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="rounded-2xl border p-5 shadow-sm" style={{ background: "#fff", borderColor: "#e2ddd6" }}>
          <div className="font-serif font-bold mb-4">🤒 Top Symptoms</div>
          {topSymptoms.length === 0
            ? <p className="text-xs" style={{ color: "#6b6b80" }}>No symptoms logged for {year}.</p>
            : topSymptoms.map((s, i) => (
              <div key={s.name} className="flex items-center gap-3 mb-3">
                <span className="text-xs font-semibold" style={{ color: "#6b6b80", minWidth: 16 }}>#{i + 1}</span>
                <span className="text-sm font-medium flex-1">{s.name}</span>
                <div className="w-24 h-2 rounded-full" style={{ background: "#f0f0f0" }}>
                  <div className="h-2 rounded-full" style={{ width: `${(s.count / maxSymCount) * 100}%`, background: "#818cf8" }} />
                </div>
                <span className="text-sm font-semibold" style={{ minWidth: 20, textAlign: "right" }}>{s.count}×</span>
              </div>
            ))}
        </div>
        <div className="rounded-2xl border p-5 shadow-sm" style={{ background: "#fff", borderColor: "#e2ddd6" }}>
          <div className="font-serif font-bold mb-4">⚡ Top Triggers</div>
          {topTriggers.length === 0
            ? <p className="text-xs" style={{ color: "#6b6b80" }}>No triggers logged for {year}.</p>
            : topTriggers.map((t, i) => (
              <div key={t.name} className="flex items-center gap-3 mb-3">
                <span className="text-xs font-semibold" style={{ color: "#6b6b80", minWidth: 16 }}>#{i + 1}</span>
                <span className="text-sm font-medium flex-1">{t.name}</span>
                <div className="w-24 h-2 rounded-full" style={{ background: "#f0f0f0" }}>
                  <div className="h-2 rounded-full" style={{ width: `${(t.count / maxTrigCount) * 100}%`, background: "#fb923c" }} />
                </div>
                <span className="text-sm font-semibold" style={{ minWidth: 20, textAlign: "right" }}>{t.count}×</span>
              </div>
            ))}
        </div>
      </div>

      {/* AI Insights */}
      <div className="rounded-2xl border p-5 shadow-sm" style={{ background: "#fff", borderColor: "#e2ddd6" }}>
        <div className="font-serif font-bold mb-1">🧠 AI Health Insights — {year}</div>
        <p className="text-xs italic mb-4" style={{ color: "#6b6b80" }}>Pattern analysis based on your logged data. Not a medical diagnosis.</p>
        <div className="flex flex-col gap-3">
          {insights.map((insight, i) => (
            <div key={i} className="p-3 rounded-xl text-sm leading-relaxed" style={{ background: "#f8fafc", border: "1px solid #e2ddd6" }}>
              {insight}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const FamilyView = () => (
  <div className="grid md:grid-cols-2 gap-6">
    <div className="rounded-2xl border p-5 shadow-sm" style={{ background: "#fff", borderColor: "#e2ddd6" }}>
      <div className="font-serif font-bold mb-4">👨‍👩‍👧 Family Members</div>
      {[
        { name: "Jane Smith", rel: "Self",   color: "#2d6a4f", events: 12 },
        { name: "John Smith", rel: "Spouse", color: "#b7791f", events: 5 },
        { name: "Lily Smith", rel: "Child",  color: "#9d174d", events: 3 },
      ].map(p => (
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
