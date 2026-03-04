import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, BarChart3, Calendar, ClipboardList, Heart, Plus, Stethoscope, Users } from "lucide-react";

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

  return (
    <div className="min-h-screen" style={{ background: "#f7f4ef", color: "#1a1a2e", fontFamily: "'DM Sans', sans-serif" }}>
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
        <div className="flex items-center gap-2 bg-white/10 rounded-full py-1 px-3 ml-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "#2d6a4f" }}>
            JS
          </div>
          <span className="text-xs font-semibold text-white/90 hidden sm:inline">Jane</span>
        </div>
      </header>

      {/* Main Content with Coming Soon Overlay */}
      <main className="max-w-[1100px] mx-auto px-6 py-8 relative">
        {/* Semi-transparent overlay for bottom half */}
        <div className="pointer-events-none absolute inset-0 z-40" style={{
          background: "linear-gradient(to bottom, transparent 40%, rgba(247,244,239,0.7) 55%, rgba(247,244,239,0.95) 75%, #f7f4ef 100%)",
        }} />
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-50 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl shadow-lg" style={{ background: "#1a1a2e" }}>
            <Heart className="w-5 h-5 text-[#74c69d]" />
            <span className="text-white font-semibold text-sm">Full app coming soon — stay tuned!</span>
          </div>
          <p className="mt-3 text-sm" style={{ color: "#6b6b80" }}>
            This is a preview of MedLog. Backend & interactivity launching shortly.
          </p>
        </div>

        {activeView === "dashboard" && <DashboardView />}
        {activeView === "log" && <LogEventView />}
        {activeView === "symptoms" && <SymptomsView />}
        {activeView === "history" && <HistoryView />}
        {activeView === "analysis" && <AnalysisView />}
        {activeView === "family" && <FamilyView />}
      </main>
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
