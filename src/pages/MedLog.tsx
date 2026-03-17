import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, BarChart3, Calendar, ClipboardList, Heart, Plus, Shield, Stethoscope, Users } from "lucide-react";
import { supabase, USER_KEY } from "@/lib/supabase";

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
interface InsightItem {
  text: string;
  records: Array<{ id: string; label: string; date: string; kind: "event" | "symptom" }>;
}
interface ActivityLog {
  id: string; actor: string; action: string; detail: string; created_at: string;
}

interface FamilyMember {
  id: string; name: string; relationship: string;
  email: string; phone: string; otp: string;
}

function generateOTP(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

// ── Persistence ───────────────────────────────────────────────────────────────
const EVENTS_KEY  = "pl_medlog_events";
const SYMPTOMS_KEY = "pl_medlog_symptoms";
const FAMILY_KEY  = "pl_medlog_family";

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

// Demo IDs that were seeded before Supabase — strip them on load
const DEMO_IDS = new Set(["d1","d2","d3","d4","d5","s1","s2","s3","s4","s5"]);

function loadItems<T extends { id: string }>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const items: T[] = JSON.parse(raw);
    const clean = items.filter(item => !DEMO_IDS.has(item.id));
    if (clean.length !== items.length) localStorage.setItem(key, JSON.stringify(clean));
    return clean;
  } catch { return []; }
}
function saveItems<T>(key: string, items: T[]) {
  try { localStorage.setItem(key, JSON.stringify(items)); } catch {}
}

// ── Config ────────────────────────────────────────────────────────────────────
const navItems = [
  { id: "dashboard", label: "Dashboard", icon: ClipboardList, ownerOnly: false },
  { id: "log",       label: "Log Event", icon: Plus,          ownerOnly: false },
  { id: "symptoms",  label: "Symptoms",  icon: Stethoscope,   ownerOnly: false },
  { id: "history",   label: "History",   icon: Calendar,      ownerOnly: false },
  { id: "analysis",  label: "Analysis",  icon: BarChart3,     ownerOnly: false },
  { id: "family",    label: "Family",    icon: Users,         ownerOnly: true  },
  { id: "admin",     label: "Admin",     icon: Shield,        ownerOnly: true  },
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

function generateInsights(events: MedEvent[], symptoms: SymptomEntry[], year: string): InsightItem[] {
  const yEvts = events.filter(e => e.date.startsWith(year));
  const ySyms = symptoms.filter(s => s.date.startsWith(year));
  const insights: InsightItem[] = [];

  const symCounts: Record<string, number> = {};
  ySyms.forEach(s => { symCounts[s.name] = (symCounts[s.name] || 0) + 1; });
  const topSym = Object.entries(symCounts).sort((a, b) => b[1] - a[1])[0];
  if (topSym) insights.push({
    text: `🔁 ${topSym[0]} most frequent — ${topSym[1]}×`,
    records: ySyms.filter(s => s.name === topSym[0]).map(s => ({ id: s.id, label: `${s.name} (${s.severity})`, date: s.date, kind: "symptom" as const })),
  });

  const trigCounts: Record<string, number> = {};
  ySyms.forEach(s => { if (s.trigger && s.trigger !== "Unknown") trigCounts[s.trigger] = (trigCounts[s.trigger] || 0) + 1; });
  const topTrig = Object.entries(trigCounts).sort((a, b) => b[1] - a[1])[0];
  if (topTrig) insights.push({
    text: `⚡ "${topTrig[0]}" top trigger — ${topTrig[1]} episode${topTrig[1] > 1 ? "s" : ""}`,
    records: ySyms.filter(s => s.trigger === topTrig[0]).map(s => ({ id: s.id, label: `${s.name} · ${s.severity}`, date: s.date, kind: "symptom" as const })),
  });

  const severe = ySyms.filter(s => s.severity === "Severe");
  if (severe.length > 0) insights.push({
    text: `⚠️ ${severe.length} severe episode${severe.length > 1 ? "s" : ""} — discuss with doctor`,
    records: severe.map(s => ({ id: s.id, label: s.name, date: s.date, kind: "symptom" as const })),
  });
  else if (ySyms.length > 0) insights.push({ text: `✅ No severe episodes in ${year}`, records: [] });

  const headScreen = ySyms.filter(s => s.name === "Headache" && s.trigger === "Screen time");
  if (headScreen.length >= 2) insights.push({
    text: `💡 ${headScreen.length} headaches linked to screen time`,
    records: headScreen.map(s => ({ id: s.id, label: `Headache · ${s.trigger}`, date: s.date, kind: "symptom" as const })),
  });

  const monthCounts: Record<string, number> = {};
  [...yEvts.map(e => e.date), ...ySyms.map(s => s.date)].forEach(d => {
    const k = d.slice(0, 7); monthCounts[k] = (monthCounts[k] || 0) + 1;
  });
  const topMonth = Object.entries(monthCounts).sort((a, b) => b[1] - a[1])[0];
  if (topMonth) {
    const [y, m] = topMonth[0].split("-");
    const mName = new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString("en-US", { month: "long" });
    insights.push({
      text: `📅 ${mName} busiest — ${topMonth[1]} entries`,
      records: [
        ...yEvts.filter(e => e.date.startsWith(topMonth[0])).map(e => ({ id: e.id, label: e.title, date: e.date, kind: "event" as const })),
        ...ySyms.filter(s => s.date.startsWith(topMonth[0])).map(s => ({ id: s.id, label: s.name, date: s.date, kind: "symptom" as const })),
      ],
    });
  }

  if (insights.length === 0) insights.push({ text: "📝 Start logging to see insights", records: [] });
  return insights;
}

function generateSummaryParagraph(events: MedEvent[], symptoms: SymptomEntry[], year: string): string {
  const yEvts = events.filter(e => e.date.startsWith(year));
  const ySyms = symptoms.filter(s => s.date.startsWith(year));
  if (yEvts.length === 0 && ySyms.length === 0)
    return `No health data recorded for ${year} yet. Start logging events and symptoms to build your health picture.`;

  const symCounts: Record<string, number> = {};
  ySyms.forEach(s => { symCounts[s.name] = (symCounts[s.name] || 0) + 1; });
  const topSym = Object.entries(symCounts).sort((a, b) => b[1] - a[1])[0];

  const trigCounts: Record<string, number> = {};
  ySyms.forEach(s => { if (s.trigger && s.trigger !== "Unknown") trigCounts[s.trigger] = (trigCounts[s.trigger] || 0) + 1; });
  const topTrig = Object.entries(trigCounts).sort((a, b) => b[1] - a[1])[0];

  const severeCount   = ySyms.filter(s => s.severity === "Severe").length;
  const moderateCount = ySyms.filter(s => s.severity === "Moderate").length;

  const sentences: string[] = [];
  sentences.push(`In ${year} you logged ${yEvts.length} medical event${yEvts.length !== 1 ? "s" : ""} and ${ySyms.length} symptom episode${ySyms.length !== 1 ? "s" : ""}.`);
  if (topSym) {
    const sevLabel = severeCount > 0 ? `including ${severeCount} severe episode${severeCount > 1 ? "s"  : ""}` :
                     moderateCount > 0 ? "generally mild to moderate in intensity" : "all mild";
    sentences.push(`${topSym[0]} is your most frequent complaint (${topSym[1]}×), ${sevLabel}.`);
  }
  if (topTrig) sentences.push(`The most commonly identified trigger is ${topTrig[0].toLowerCase()}, linked to ${topTrig[1]} episode${topTrig[1] > 1 ? "s" : ""}.`);
  if (severeCount > 0)
    sentences.push(`The presence of severe episodes suggests a proactive conversation with your healthcare provider would be worthwhile.`);
  else if (ySyms.length > 0)
    sentences.push(`No severe episodes have been recorded — your health profile this year looks stable. Continued regular logging will help spot any emerging patterns early.`);
  return sentences.join(" ");
}

function loadFamily(): FamilyMember[] {
  try { const r = localStorage.getItem(FAMILY_KEY); return r ? JSON.parse(r) : []; } catch { return []; }
}
function saveFamily(f: FamilyMember[]) {
  try { localStorage.setItem(FAMILY_KEY, JSON.stringify(f)); } catch {}
}

// ── MedLog (main) ─────────────────────────────────────────────────────────────
const MedLog = () => {
  const [activeView, setActiveView] = useState("dashboard");
  const [unlocked, setUnlocked] = useState(mlUnlocked);
  const [showLockModal, setShowLockModal] = useState(false);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState(false);
  const [events, setEvents] = useState<MedEvent[]>(() => loadItems<MedEvent>(EVENTS_KEY));
  const [symptoms, setSymptoms] = useState<SymptomEntry[]>(() => loadItems<SymptomEntry>(SYMPTOMS_KEY));
  const [family, setFamily] = useState<FamilyMember[]>(loadFamily);
  const [syncStatus, setSyncStatus] = useState<"syncing" | "synced" | "offline">("syncing");
  const [memberName, setMemberName] = useState<string | null>(() => {
    try { return localStorage.getItem("pl_medlog_member"); } catch { return null; }
  });
  const [memberId, setMemberId] = useState<string>(() => {
    try { return localStorage.getItem("pl_medlog_member_id") || "owner"; } catch { return "owner"; }
  });
  const tabFirstRender = useRef(true);

  const logActivity = useCallback((actor: string, action: string, detail = "") => {
    supabase.from("medlog_activity_log").insert({ user_key: USER_KEY, actor, action, detail })
      .then(({ error }) => { if (error) console.warn("Activity log:", error.message); });
  }, []);

  const reloadMemberData = useCallback(async (mId: string) => {
    setEvents([]); setSymptoms([]); // clear immediately so old data never bleeds through
    setSyncStatus("syncing");
    try {
      const [evtRes, symRes] = await Promise.all([
        supabase.from("medlog_events").select("*").eq("user_key", USER_KEY).eq("member_id", mId).order("date", { ascending: false }),
        supabase.from("medlog_symptoms").select("*").eq("user_key", USER_KEY).eq("member_id", mId).order("date", { ascending: false }),
      ]);
      if (evtRes.error || symRes.error) { setSyncStatus("offline"); return; }
      const evts: MedEvent[] = (evtRes.data || []).map(r => ({
        id: r.id, type: r.type as EventType, title: r.title, doctor: r.doctor || "",
        date: r.date, ...(r.date_to ? { dateTo: r.date_to } : {}), notes: r.notes || "",
      }));
      const syms: SymptomEntry[] = (symRes.data || []).map(r => ({
        id: r.id, name: r.name, severity: r.severity as Severity,
        date: r.date, ...(r.date_to ? { dateTo: r.date_to } : {}),
        trigger: r.trigger || "", notes: r.notes || "",
      }));
      setEvents(evts); saveItems(EVENTS_KEY, evts);
      setSymptoms(syms); saveItems(SYMPTOMS_KEY, syms);
      setSyncStatus("synced");
    } catch { setSyncStatus("offline"); }
  }, []);

  // ── Supabase sync ──────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function syncFromSupabase() {
      try {
        const [evtRes, symRes, famRes] = await Promise.all([
          supabase.from("medlog_events").select("*").eq("user_key", USER_KEY).eq("member_id", memberId).order("date", { ascending: false }),
          supabase.from("medlog_symptoms").select("*").eq("user_key", USER_KEY).eq("member_id", memberId).order("date", { ascending: false }),
          supabase.from("medlog_family").select("*").eq("user_key", USER_KEY),
        ]);
        if (cancelled) return;
        if (evtRes.error || symRes.error || famRes.error) { setSyncStatus("offline"); return; }

        const remoteEvents: MedEvent[] = (evtRes.data || []).map(r => ({
          id: r.id, type: r.type as EventType, title: r.title, doctor: r.doctor || "",
          date: r.date, ...(r.date_to ? { dateTo: r.date_to } : {}), notes: r.notes || "",
        }));
        const remoteSymptoms: SymptomEntry[] = (symRes.data || []).map(r => ({
          id: r.id, name: r.name, severity: r.severity as Severity,
          date: r.date, ...(r.date_to ? { dateTo: r.date_to } : {}),
          trigger: r.trigger || "", notes: r.notes || "",
        }));
        const remoteFamily: FamilyMember[] = (famRes.data || []).map(r => ({
          id: r.id, name: r.name, relationship: r.relationship,
          email: r.email || "", phone: r.phone || "", otp: r.otp || "",
        }));

        // Each collection is synced independently — avoids one empty collection wiping local data
        if (remoteEvents.length > 0) {
          setEvents(remoteEvents); saveItems(EVENTS_KEY, remoteEvents);
        } else {
          const local = loadItems<MedEvent>(EVENTS_KEY).filter(e => e.id.startsWith("evt_"));
          if (local.length > 0)
            await supabase.from("medlog_events").insert(local.map(e => ({
              id: e.id, user_key: USER_KEY, type: e.type, title: e.title,
              doctor: e.doctor, date: e.date, date_to: e.dateTo || null, notes: e.notes,
            })));
        }

        if (remoteSymptoms.length > 0) {
          setSymptoms(remoteSymptoms); saveItems(SYMPTOMS_KEY, remoteSymptoms);
        } else {
          const local = loadItems<SymptomEntry>(SYMPTOMS_KEY).filter(s => s.id.startsWith("sym_"));
          if (local.length > 0)
            await supabase.from("medlog_symptoms").insert(local.map(s => ({
              id: s.id, user_key: USER_KEY, name: s.name, severity: s.severity,
              date: s.date, date_to: s.dateTo || null, trigger: s.trigger, notes: s.notes,
            })));
        }

        if (remoteFamily.length > 0) {
          setFamily(remoteFamily); saveFamily(remoteFamily);
        } else {
          const local = loadFamily();
          if (local.length > 0)
            await supabase.from("medlog_family").insert(local.map(m => ({
              id: m.id, user_key: USER_KEY, name: m.name, relationship: m.relationship,
              email: m.email || "", phone: m.phone || "", otp: m.otp || "",
            })));
        }
        if (!cancelled) setSyncStatus("synced");
      } catch { if (!cancelled) setSyncStatus("offline"); }
    }
    syncFromSupabase();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const labels: Record<string, string> = {
      dashboard: "Dashboard", log: "Log Event", symptoms: "Symptoms",
      history: "History", analysis: "Analysis", family: "Family",
    };
    document.title = `${labels[activeView] ?? activeView} · MedLog | Preeti Builds`;
  }, [activeView]);

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
    supabase.from("medlog_events").insert({
      id: e.id, user_key: USER_KEY, member_id: memberId, type: e.type, title: e.title,
      doctor: e.doctor, date: e.date, date_to: e.dateTo || null, notes: e.notes,
    }).then(({ error }) => { if (error) console.warn("Supabase insert event:", error.message); });
    logActivity(memberName || "Preeti", "add_event", e.title);
  }, [memberName, memberId, logActivity]);

  const addSymptom = useCallback((s: SymptomEntry) => {
    setSymptoms(prev => { const u = [s, ...prev]; saveItems(SYMPTOMS_KEY, u); return u; });
    supabase.from("medlog_symptoms").insert({
      id: s.id, user_key: USER_KEY, member_id: memberId, name: s.name, severity: s.severity,
      date: s.date, date_to: s.dateTo || null, trigger: s.trigger, notes: s.notes,
    }).then(({ error }) => { if (error) console.warn("Supabase insert symptom:", error.message); });
    logActivity(memberName || "Preeti", "add_symptom", `${s.name} (${s.severity})`);
  }, [memberName, memberId, logActivity]);

  const deleteEvent = useCallback((id: string) => {
    setEvents(prev => { const u = prev.filter(e => e.id !== id); saveItems(EVENTS_KEY, u); return u; });
    supabase.from("medlog_events").delete().eq("id", id).eq("user_key", USER_KEY)
      .then(({ error }) => { if (error) console.warn("Supabase delete event:", error.message); });
    logActivity(memberName || "Preeti", "delete_event", id);
  }, [memberName, logActivity]);

  const deleteSymptom = useCallback((id: string) => {
    setSymptoms(prev => { const u = prev.filter(s => s.id !== id); saveItems(SYMPTOMS_KEY, u); return u; });
    supabase.from("medlog_symptoms").delete().eq("id", id).eq("user_key", USER_KEY)
      .then(({ error }) => { if (error) console.warn("Supabase delete symptom:", error.message); });
    logActivity(memberName || "Preeti", "delete_symptom", id);
  }, [memberName, logActivity]);

  const addFamilyMember = useCallback((m: FamilyMember) => {
    setFamily(prev => { const u = [...prev, m]; saveFamily(u); return u; });
    supabase.from("medlog_family").insert({
      id: m.id, user_key: USER_KEY, name: m.name, relationship: m.relationship,
      email: m.email || "", phone: m.phone || "", otp: m.otp || "",
    }).then(({ error }) => { if (error) console.warn("Supabase insert family:", error.message); });
  }, []);

  const deleteFamilyMember = useCallback((id: string) => {
    setFamily(prev => { const u = prev.filter(m => m.id !== id); saveFamily(u); return u; });
    supabase.from("medlog_family").delete().eq("id", id).eq("user_key", USER_KEY)
      .then(({ error }) => { if (error) console.warn("Supabase delete family:", error.message); });
  }, []);

  const tryUnlock = async () => {
    const raw = code.trim();
    const upper = raw.toUpperCase();
    if (upper === ML_ACCESS_CODE) {
      try {
        localStorage.setItem(ML_ACCESS_KEY, "1");
        localStorage.removeItem("pl_medlog_member");
        localStorage.removeItem("pl_medlog_member_id");
      } catch {}
      setUnlocked(true); setMemberName(null); setMemberId("owner");
      setShowLockModal(false); setCode("");
      logActivity("Preeti (owner)", "login", "Owner login");
      reloadMemberData("owner");
    } else {
      const { data } = await supabase.from("medlog_family").select("id, name, otp, email").eq("user_key", USER_KEY);
      // Match by OTP (case-insensitive) OR by email address
      const found = (data || []).find(m =>
        (m.otp && m.otp.toUpperCase() === upper) ||
        (m.email && m.email.toLowerCase() === raw.toLowerCase())
      );
      if (found) {
        try {
          localStorage.setItem(ML_ACCESS_KEY, "1");
          localStorage.setItem("pl_medlog_member", found.name);
          localStorage.setItem("pl_medlog_member_id", found.id);
        } catch {}
        setUnlocked(true); setMemberName(found.name); setMemberId(found.id);
        setShowLockModal(false); setCode("");
        logActivity(found.name, "login", `Family member login`);
        reloadMemberData(found.id);
      } else {
        setCodeError(true); setTimeout(() => setCodeError(false), 800); setCode("");
      }
    }
  };

  const lock = () => {
    try {
      localStorage.removeItem(ML_ACCESS_KEY);
      localStorage.removeItem("pl_medlog_member");
      localStorage.removeItem("pl_medlog_member_id");
    } catch {}
    setUnlocked(false); setMemberName(null); setMemberId("owner"); setActiveView("dashboard");
  };

  return (
    <div className="min-h-screen" style={{ background: "#f7f4ef", color: "#1a1a2e", fontFamily: "'DM Sans', sans-serif" }}>
      {showLockModal && !unlocked && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(26,26,46,0.8)", backdropFilter: "blur(4px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: "40px 44px", maxWidth: 400, width: "100%", textAlign: "center", boxShadow: "0 25px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ fontSize: 44, marginBottom: 14 }}>🔒</div>
            <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 800, color: "#1a1a2e" }}>MedLog Access</h2>
            <p style={{ margin: "0 0 6px", fontSize: 13, color: "#6b6b80", lineHeight: 1.6 }}>Enter your access OTP or email address.</p>
            <p style={{ margin: "0 0 20px", fontSize: 11, color: "#b0b0c0" }}>Family members: use the OTP or email shared with you.</p>
            <input type="text" placeholder="OTP or email address" value={code} autoFocus autoComplete="off"
              onChange={e => setCode(e.target.value)} onKeyDown={e => e.key === "Enter" && tryUnlock()}
              style={{ width: "100%", padding: "12px 14px", border: `2px solid ${codeError ? "#dc2626" : "#e2e8f0"}`, borderRadius: 10, fontSize: 14, outline: "none", marginBottom: 12, boxSizing: "border-box", textAlign: "center", background: codeError ? "#fef2f2" : "#fff" }} />
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
          {navItems.filter(item => !item.ownerOnly || (unlocked && !memberName)).map((item) => (
            <button key={item.id} onClick={() => setActiveView(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeView === item.id ? "bg-white/10 text-[#74c69d]" : "text-white/60 hover:bg-white/5 hover:text-white"}`}>
              <item.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-2 ml-2">
          <span title={syncStatus === "syncing" ? "Syncing with cloud…" : syncStatus === "synced" ? "Synced with cloud" : "Offline — data saved locally"}
            style={{ fontSize: 12, color: syncStatus === "synced" ? "#74c69d" : syncStatus === "offline" ? "#f59e0b" : "rgba(255,255,255,0.45)", letterSpacing: "0.02em" }}>
            {syncStatus === "syncing" ? "⟳ syncing" : syncStatus === "synced" ? "☁ synced" : "⚠ offline"}
          </span>
          {unlocked ? (
            <button onClick={lock} title="Log out" style={{ background: "rgba(220,38,38,0.15)", border: "1px solid rgba(220,38,38,0.4)", borderRadius: 8, padding: "4px 10px", fontSize: 12, cursor: "pointer", color: "#fca5a5", fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
              ⏏ <span style={{ fontSize: 11 }}>Log out</span>
            </button>
          ) : (
            <button onClick={() => setShowLockModal(true)} style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 8, padding: "4px 10px", fontSize: 13, cursor: "pointer", color: "#fff", fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
              🔒 <span style={{ fontSize: 11 }}>Login</span>
            </button>
          )}
          {unlocked && (
            <div className="flex items-center gap-2 bg-white/10 rounded-full py-1 px-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: memberName ? "#7c3aed" : "#2d6a4f" }}>
                {(memberName || "Preeti").slice(0, 1).toUpperCase()}
              </div>
              <span className="text-xs font-semibold text-white/90 hidden sm:inline">{memberName || "Preeti"}</span>
            </div>
          )}
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
              <span className="text-white font-semibold text-sm">Your personal medical log · Private &amp; Confidential</span>
            </div>
            <p className="mt-3 text-sm" style={{ color: "#6b6b80" }}>Log in to access your health records and insights.</p>
          </div>
        </>)}

        {activeView === "dashboard" && <DashboardView events={events} symptoms={symptoms} />}
        {activeView === "log"       && <LogEventView onSave={addEvent} />}
        {activeView === "symptoms"  && <SymptomsView symptoms={symptoms} onSave={addSymptom} onDelete={deleteSymptom} />}
        {activeView === "history"   && <HistoryView events={events} symptoms={symptoms} onDelete={deleteEvent} onDeleteSymptom={deleteSymptom} />}
        {activeView === "analysis"  && <AnalysisView events={events} symptoms={symptoms} />}
        {activeView === "family"    && <FamilyView family={family} onAdd={addFamilyMember} onDelete={deleteFamilyMember} />}
        {activeView === "admin"     && <AdminView />}
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

const EventItem = ({ event, onDelete }: { event: MedEvent; onDelete?: (id: string) => void }) => (
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
    {onDelete && (
      <button onClick={() => onDelete(event.id)} title="Delete record"
        style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", fontSize: 15, padding: "2px 4px", lineHeight: 1, flexShrink: 0, opacity: 0.5 }}
        onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
        onMouseLeave={e => (e.currentTarget.style.opacity = "0.5")}>
        ✕
      </button>
    )}
  </div>
);

// ── Views ─────────────────────────────────────────────────────────────────────
const DashboardView = ({ events, symptoms }: { events: MedEvent[]; symptoms: SymptomEntry[] }) => {
  const thisYear = new Date().getFullYear();
  const yearEvents   = events.filter(e => e.date.startsWith(String(thisYear)));
  const yearSymptoms = symptoms.filter(s => s.date.startsWith(String(thisYear)));
  const doctors = new Set(events.filter(e => e.doctor).map(e => e.doctor)).size;

  // Unified chronological feed — latest 6 entries from both events + symptoms
  type FeedItem = { id: string; date: string; kind: "event" | "symptom"; title: string; badge: string; badgeCls: string; sub: string };
  const feed: FeedItem[] = [
    ...events.map(e => ({ id: e.id, date: e.date, kind: "event" as const, title: e.title, badge: e.type, badgeCls: typeColors[e.type] ?? "", sub: [e.dateTo ? `→ ${e.dateTo}` : "", e.doctor].filter(Boolean).join(" · ") })),
    ...symptoms.map(s => ({ id: s.id, date: s.date, kind: "symptom" as const, title: s.name, badge: s.severity, badgeCls: sevColors[s.severity] ?? "", sub: [s.dateTo ? `→ ${s.dateTo}` : "", s.trigger].filter(Boolean).join(" · ") })),
  ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <StatCard label="Total Events"   value={String(events.length)}        sub="All time" />
        <StatCard label="This Year"      value={String(yearEvents.length)}     sub={String(thisYear)} />
        <StatCard label="Doctors"        value={String(doctors)} />
        <StatCard label="Symptoms"       value={String(yearSymptoms.length)}   sub={String(thisYear)} />
        <StatCard label="All Symptoms"   value={String(symptoms.length)}       sub="All time" />
      </div>
      <div className="rounded-2xl border p-5 shadow-sm" style={{ background: "#fff", borderColor: "#e2ddd6" }}>
        <div className="font-serif font-bold mb-4">🕐 Recent Activity</div>
        {feed.length === 0
          ? <p className="text-sm" style={{ color: "#6b6b80" }}>No activity logged yet.</p>
          : <div className="flex flex-col gap-2">
              {feed.map(item => (
                <div key={item.id} className="flex items-start gap-3 p-3 rounded-xl border" style={{ background: "#f7f4ef", borderColor: "#e2ddd6" }}>
                  <span style={{ fontSize: 14, marginTop: 1, flexShrink: 0 }}>{item.kind === "symptom" ? "🤒" : "📋"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{item.title}</span>
                      <span className={`text-[0.68rem] font-bold uppercase px-2 py-0.5 rounded-full ${item.badgeCls}`}>{item.badge}</span>
                    </div>
                    {item.sub && <div className="text-xs mt-0.5" style={{ color: "#6b6b80" }}>{item.date} · {item.sub}</div>}
                    {!item.sub && <div className="text-xs mt-0.5" style={{ color: "#6b6b80" }}>{item.date}</div>}
                  </div>
                </div>
              ))}
            </div>}
      </div>
    </div>
  );
};

const LogEventView = ({ onSave }: { onSave: (e: MedEvent) => void }) => {
  const [type, setType] = useState<EventType>("visit");
  const [date, setDate] = useState(today());
  const [dateTo, setDateTo] = useState(today());
  const [title, setTitle] = useState("");
  const [doctor, setDoctor] = useState("");
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({ id: `evt_${Date.now()}`, type, date, ...(dateTo ? { dateTo } : {}), title: title.trim(), doctor: doctor.trim(), notes: notes.trim() });
    setTitle(""); setDoctor(""); setNotes(""); setDate(today()); setDateTo(today());
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
          <div className="col-span-2 flex flex-col gap-1.5">
            <label className={labelCls} style={{ color: "#6b6b80" }}>Date Range</label>
            <div className="flex items-center gap-2">
              <div className="flex-1"><DateInput value={date} onChange={setDate} /></div>
              <span style={{ color: "#6b6b80", fontWeight: 600, fontSize: 14, flexShrink: 0 }}>→</span>
              <div className="flex-1"><DateInput value={dateTo} onChange={setDateTo} /></div>
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

const SymptomsView = ({ symptoms, onSave, onDelete }: { symptoms: SymptomEntry[]; onSave: (s: SymptomEntry) => void; onDelete: (id: string) => void }) => {
  const [name, setName] = useState("Headache");
  const [customName, setCustomName] = useState("");
  const [severity, setSeverity] = useState<Severity>("Mild");
  const [date, setDate] = useState(today());
  const [dateTo, setDateTo] = useState(today());
  const [trigger, setTrigger] = useState("Unknown");
  const [customTrigger, setCustomTrigger] = useState("");
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    const finalName = name === "Other" ? (customName.trim() || "Other") : name;
    const finalTrigger = trigger === "Other" ? (customTrigger.trim() || "Other") : trigger;
    onSave({ id: `sym_${Date.now()}`, name: finalName, severity, date, ...(dateTo ? { dateTo } : {}), trigger: finalTrigger, notes: notes.trim() });
    setCustomName(""); setNotes(""); setDate(today()); setDateTo(today()); setCustomTrigger("");
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
          <div className="col-span-2 flex flex-col gap-1.5">
            <label className={labelCls} style={{ color: "#6b6b80" }}>Date Range</label>
            <div className="flex items-center gap-2">
              <div className="flex-1"><DateInput value={date} onChange={setDate} /></div>
              <span style={{ color: "#6b6b80", fontWeight: 600, fontSize: 14, flexShrink: 0 }}>→</span>
              <div className="flex-1"><DateInput value={dateTo} onChange={setDateTo} /></div>
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
        <div className="flex items-center justify-between mb-4">
          <div className="font-serif font-bold">📋 Symptom History</div>
          <span className="text-xs" style={{ color: "#6b6b80" }}>{symptoms.length} record{symptoms.length !== 1 ? "s" : ""} · click ✕ to delete</span>
        </div>
        <div className="flex flex-col gap-2">
          {symptoms.slice(0, 10).map(s => (
            <div key={s.id} className="flex items-start gap-3 p-3 rounded-xl border" style={{ background: "#f7f4ef", borderColor: "#e2ddd6" }}>
              <div className="w-2 h-2 rounded-full bg-pink-300 mt-1.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{s.name}</span>
                  <span className={`text-[0.68rem] font-bold px-2 py-0.5 rounded-full ${sevColors[s.severity]}`}>{s.severity}</span>
                </div>
                <div className="text-xs mt-0.5" style={{ color: "#6b6b80" }}>{s.date}{s.dateTo ? ` → ${s.dateTo}` : ""}{s.trigger ? ` · Trigger: ${s.trigger}` : ""}</div>
              </div>
              <button onClick={() => onDelete(s.id)} title="Delete record"
                style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", fontSize: 15, padding: "2px 4px", lineHeight: 1, flexShrink: 0, opacity: 0.5 }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "0.5")}>
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const HistoryView = ({ events, symptoms, onDelete, onDeleteSymptom }: {
  events: MedEvent[]; symptoms: SymptomEntry[];
  onDelete: (id: string) => void; onDeleteSymptom: (id: string) => void;
}) => {
  const [filter, setFilter] = useState("All");
  // Unified feed: merge events + symptoms, sort by date desc
  type HistItem = { id: string; date: string; kind: "event" | "symptom"; eventData?: MedEvent; symData?: SymptomEntry };
  const allItems: HistItem[] = [
    ...events.map(e => ({ id: e.id, date: e.date, kind: "event" as const, eventData: e })),
    ...symptoms.map(s => ({ id: s.id, date: s.date, kind: "symptom" as const, symData: s })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  const filtered = filter === "All" ? allItems
    : filter === "symptoms" ? allItems.filter(i => i.kind === "symptom")
    : allItems.filter(i => i.kind === "event" && (filter === "events" || i.eventData?.type === filter));

  const total = allItems.length;

  return (
    <div className="rounded-2xl border p-5 shadow-sm" style={{ background: "#fff", borderColor: "#e2ddd6" }}>
      <div className="flex items-center justify-between mb-4">
        <div className="font-serif font-bold">📅 Health History</div>
        <span className="text-xs" style={{ color: "#6b6b80" }}>{total} record{total !== 1 ? "s" : ""} · click ✕ to delete</span>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { key: "All",       label: "All" },
          { key: "events",    label: "Events" },
          { key: "symptoms",  label: "Symptoms" },
          { key: "visit",     label: "Doctor's Visit" },
          { key: "checkup",   label: "Check-up" },
          { key: "surgery",   label: "Surgery" },
          { key: "medication",label: "Medication" },
          { key: "other",     label: "Other" },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`px-3 py-1 rounded-full text-xs font-semibold border cursor-pointer transition-all ${filter === key ? "bg-emerald-50 border-emerald-300 text-emerald-700" : ""}`}
            style={filter !== key ? { borderColor: "#e2ddd6", color: "#6b6b80" } : {}}>
            {label}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        {filtered.length === 0
          ? <p className="text-sm" style={{ color: "#6b6b80" }}>No records found.</p>
          : filtered.map(item => item.kind === "event" && item.eventData
              ? <EventItem key={item.id} event={item.eventData} onDelete={onDelete} />
              : item.symData ? (
                  <div key={item.id} className="flex items-start gap-3 p-3 rounded-xl border" style={{ background: "#f7f4ef", borderColor: "#e2ddd6" }}>
                    <div className="w-2 h-2 rounded-full bg-pink-300 mt-1.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: "#6b6b80" }}>🤒</span>
                        <span className="font-semibold text-sm">{item.symData.name}</span>
                        <span className={`text-[0.68rem] font-bold px-2 py-0.5 rounded-full ${sevColors[item.symData.severity]}`}>{item.symData.severity}</span>
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: "#6b6b80" }}>{item.symData.date}{item.symData.dateTo ? ` → ${item.symData.dateTo}` : ""}{item.symData.trigger ? ` · Trigger: ${item.symData.trigger}` : ""}</div>
                    </div>
                    <button onClick={() => onDeleteSymptom(item.id)} title="Delete record"
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", fontSize: 15, padding: "2px 4px", lineHeight: 1, flexShrink: 0, opacity: 0.5 }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                      onMouseLeave={e => (e.currentTarget.style.opacity = "0.5")}>✕</button>
                  </div>
                ) : null
          )}
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
  const [expandedInsight, setExpandedInsight] = useState<number | null>(null);
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
      {/* Header row */}
      <div className="flex items-center gap-3 mb-4">
        <h2 className="font-serif text-xl font-bold">Health Analysis</h2>
        <select value={year} onChange={e => { setYear(parseInt(e.target.value)); setExpandedInsight(null); }}
          className="rounded-lg border px-3 py-1.5 text-sm" style={{ background: "#f7f4ef", borderColor: "#e2ddd6" }}>
          {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* ── Compact AI Insights strip ── */}
      <div className="rounded-2xl border p-4 mb-5" style={{ background: "#fff", borderColor: "#e2ddd6" }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#6b6b80" }}>🧠 Health Summary</span>
          <span className="text-[0.68rem] italic" style={{ color: "#6b6b80" }}>Not medical advice</span>
        </div>
        <p className="text-sm leading-relaxed mb-3" style={{ color: "#1a1a2e" }}>
          {generateSummaryParagraph(events, symptoms, yStr)}
        </p>
        <div className="text-[0.68rem] font-bold uppercase tracking-wider mb-2" style={{ color: "#6b6b80" }}>
          Key patterns — tap to see linked records
        </div>
        <div className="flex flex-wrap gap-2">
          {insights.map((ins, i) => (
            <button key={i}
              onClick={() => setExpandedInsight(expandedInsight === i ? null : i)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
              style={expandedInsight === i
                ? { background: "#1a1a2e", color: "#fff", borderColor: "#1a1a2e" }
                : { background: "#f8fafc", color: "#1a1a2e", borderColor: "#e2ddd6" }}>
              {ins.text}
              {ins.records.length > 0 && (
                <span style={{
                  background: expandedInsight === i ? "rgba(255,255,255,0.2)" : "#e2ddd6",
                  color: expandedInsight === i ? "#fff" : "#6b6b80",
                  borderRadius: 9999, padding: "1px 6px", fontSize: "0.65rem", fontWeight: 700,
                }}>
                  {ins.records.length}
                </span>
              )}
            </button>
          ))}
        </div>
        {expandedInsight !== null && insights[expandedInsight]?.records.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3" style={{ borderTop: "1px solid #e2ddd6" }}>
            {insights[expandedInsight].records.map(r => (
              <span key={r.id} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border"
                style={{
                  background: r.kind === "symptom" ? "#fdf2f8" : "#f0fdf4",
                  borderColor: r.kind === "symptom" ? "#fbcfe8" : "#bbf7d0",
                  color: "#1a1a2e",
                }}>
                {r.kind === "symptom" ? "🤒" : "📋"} <strong>{r.label}</strong> · {r.date}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total Events"  value={String(yEvts.length)}        sub={yStr} />
        <StatCard label="Symptoms"      value={String(ySyms.length)}        sub="Logged" />
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
      <div className="grid md:grid-cols-2 gap-6">
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
    </div>
  );
};

// ── Admin View ────────────────────────────────────────────────────────────────
const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  login:          { label: "Login",          color: "#2d6a4f" },
  view_tab:       { label: "Tab View",       color: "#1e40af" },
  add_event:      { label: "Added Event",    color: "#065f46" },
  add_symptom:    { label: "Added Symptom",  color: "#9d174d" },
  delete_event:   { label: "Deleted Event",  color: "#b91c1c" },
  delete_symptom: { label: "Deleted Symptom",color: "#b91c1c" },
};

const AdminView = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterActor, setFilterActor] = useState("All");
  const [filterAction, setFilterAction] = useState("All");
  const [clearing, setClearing] = useState(false);

  const fetchLogs = () => {
    setLoading(true);
    supabase.from("medlog_activity_log").select("*").eq("user_key", USER_KEY)
      .order("created_at", { ascending: false }).limit(300)
      .then(({ data }) => { setLogs(data || []); setLoading(false); });
  };

  useEffect(() => { fetchLogs(); }, []);

  const clearLog = async () => {
    if (!confirm("Clear all activity log entries? This cannot be undone.")) return;
    setClearing(true);
    await supabase.from("medlog_activity_log").delete().eq("user_key", USER_KEY);
    setLogs([]); setClearing(false);
  };

  const actors  = ["All", ...Array.from(new Set(logs.map(l => l.actor)))];
  const actions = ["All", ...Array.from(new Set(logs.map(l => l.action)))];
  const filtered = logs.filter(l =>
    (filterActor  === "All" || l.actor  === filterActor) &&
    (filterAction === "All" || l.action === filterAction)
  );

  const logins     = logs.filter(l => l.action === "login");
  const uniqueUsers = new Set(logs.map(l => l.actor)).size;
  const additions  = logs.filter(l => l.action.startsWith("add_")).length;

  const fmt = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
      + " " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  };

  const selStyle = { background: "#f7f4ef", borderColor: "#e2ddd6", padding: "7px 12px", borderRadius: 8, fontSize: 12, border: "1px solid #e2ddd6", color: "#1a1a2e" };

  return (
    <div className="flex flex-col gap-5">
      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border p-4 shadow-sm" style={{ background: "#fff", borderColor: "#e2ddd6" }}>
          <div className="text-[0.72rem] font-semibold uppercase tracking-wider" style={{ color: "#6b6b80" }}>Total Logins</div>
          <div className="text-2xl font-serif font-bold mt-1">{logins.length}</div>
        </div>
        <div className="rounded-2xl border p-4 shadow-sm" style={{ background: "#fff", borderColor: "#e2ddd6" }}>
          <div className="text-[0.72rem] font-semibold uppercase tracking-wider" style={{ color: "#6b6b80" }}>Unique Users</div>
          <div className="text-2xl font-serif font-bold mt-1">{uniqueUsers}</div>
        </div>
        <div className="rounded-2xl border p-4 shadow-sm" style={{ background: "#fff", borderColor: "#e2ddd6" }}>
          <div className="text-[0.72rem] font-semibold uppercase tracking-wider" style={{ color: "#6b6b80" }}>Records Added</div>
          <div className="text-2xl font-serif font-bold mt-1">{additions}</div>
        </div>
      </div>

      {/* Activity log table */}
      <div className="rounded-2xl border shadow-sm overflow-hidden" style={{ background: "#fff", borderColor: "#e2ddd6" }}>
        <div className="px-5 py-4 border-b flex items-center justify-between flex-wrap gap-3" style={{ borderColor: "#e2ddd6" }}>
          <span className="font-serif font-bold">🛡 Activity Log</span>
          <div className="flex gap-2 flex-wrap">
            <select value={filterActor} onChange={e => setFilterActor(e.target.value)} style={selStyle}>
              {actors.map(a => <option key={a}>{a}</option>)}
            </select>
            <select value={filterAction} onChange={e => setFilterAction(e.target.value)} style={selStyle}>
              {actions.map(a => <option key={a} value={a}>{a === "All" ? "All actions" : (ACTION_LABELS[a]?.label ?? a)}</option>)}
            </select>
            <span className="text-xs self-center" style={{ color: "#6b6b80" }}>{filtered.length} entries</span>
            <button onClick={clearLog} disabled={clearing}
              style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #fca5a5", background: "#fef2f2", color: "#dc2626", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              {clearing ? "Clearing…" : "🗑 Clear log"}
            </button>
          </div>
        </div>

        {loading ? (
          <p className="p-5 text-sm" style={{ color: "#6b6b80" }}>Loading activity…</p>
        ) : filtered.length === 0 ? (
          <p className="p-5 text-sm" style={{ color: "#6b6b80" }}>No activity recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f7f4ef", borderBottom: "1px solid #e2ddd6" }}>
                  {["Timestamp", "User", "Action", "Detail"].map(h => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#6b6b80", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(log => {
                  const meta = ACTION_LABELS[log.action];
                  return (
                    <tr key={log.id} style={{ borderBottom: "1px solid #f0ece6" }}>
                      <td style={{ padding: "10px 16px", color: "#6b6b80", whiteSpace: "nowrap", fontSize: 12 }}>{fmt(log.created_at)}</td>
                      <td style={{ padding: "10px 16px", fontWeight: 600 }}>{log.actor}</td>
                      <td style={{ padding: "10px 16px" }}>
                        <span style={{ background: meta ? meta.color + "18" : "#f0f0f0", color: meta?.color ?? "#6b6b80", fontWeight: 700, fontSize: 11, padding: "2px 8px", borderRadius: 6 }}>
                          {meta?.label ?? log.action}
                        </span>
                      </td>
                      <td style={{ padding: "10px 16px", color: "#6b6b80", maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{log.detail || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const MEMBER_COLORS = ["#2d6a4f", "#b7791f", "#9d174d", "#1e40af", "#7c3aed", "#065f46", "#92400e"];

const FamilyView = ({ family, onAdd, onDelete }: { family: FamilyMember[]; onAdd: (m: FamilyMember) => void; onDelete: (id: string) => void }) => {
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("Spouse / Partner");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(() => generateOTP());
  const [saved, setSaved] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const inputStyle = { background: "#f7f4ef", borderColor: "#e2ddd6" };
  const labelCls = "text-[0.78rem] font-semibold uppercase tracking-wider";

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd({ id: `fm_${Date.now()}`, name: name.trim(), relationship, email: email.trim(), phone: phone.trim(), otp });
    setName(""); setEmail(""); setPhone(""); setOtp(generateOTP());
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const copyOTP = (code: string, id: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedId(id); setTimeout(() => setCopiedId(null), 1500);
    });
  };

  const whatsappLink = (phone: string, name: string, otp: string) => {
    const msg = encodeURIComponent(`Hi ${name}, your MedLog access code is: ${otp}`);
    return `https://wa.me/${phone.replace(/\D/g, "")}?text=${msg}`;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Add member form */}
      <div className="rounded-2xl border p-5 shadow-sm" style={{ background: "#fff", borderColor: "#e2ddd6" }}>
        <div className="font-serif font-bold mb-4">➕ Add Family Member</div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} style={{ color: "#6b6b80" }}>Full Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. Sarah Johnson"
              className="rounded-lg border px-3 py-2.5 text-sm" style={inputStyle} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} style={{ color: "#6b6b80" }}>Relationship</label>
            <select value={relationship} onChange={e => setRelationship(e.target.value)}
              className="rounded-lg border px-3 py-2.5 text-sm" style={inputStyle}>
              <option>Spouse / Partner</option><option>Child</option><option>Parent</option>
              <option>Sibling</option><option>Other</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} style={{ color: "#6b6b80" }}>Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="member@example.com"
              className="rounded-lg border px-3 py-2.5 text-sm" style={inputStyle} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} style={{ color: "#6b6b80" }}>WhatsApp / Phone</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="+44 7700 900000"
              className="rounded-lg border px-3 py-2.5 text-sm" style={inputStyle} />
          </div>
          <div className="col-span-2 flex flex-col gap-1.5">
            <label className={labelCls} style={{ color: "#6b6b80" }}>Access Code (OTP) — share with member</label>
            <div className="flex items-center gap-2">
              <input type="text" value={otp} readOnly
                className="rounded-lg border px-3 py-2.5 text-sm font-mono tracking-widest flex-1"
                style={{ ...inputStyle, letterSpacing: "0.2em", color: "#1a1a2e" }} />
              <button type="button" onClick={() => setOtp(generateOTP())}
                className="px-3 py-2.5 rounded-lg border text-xs font-semibold"
                style={{ borderColor: "#e2ddd6", background: "#f7f4ef", color: "#6b6b80" }}>
                ↺ New
              </button>
            </div>
            <p className="text-[0.72rem]" style={{ color: "#6b6b80" }}>Auto-generated. Share this code with the member so they can log in.</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button onClick={handleAdd} className="px-6 py-2.5 rounded-lg text-white text-sm font-semibold" style={{ background: "#2d6a4f" }}>Add Member</button>
          {saved && <span className="text-sm font-medium" style={{ color: "#2d6a4f" }}>✓ Added!</span>}
        </div>
      </div>

      {/* Members grid */}
      <div className="rounded-2xl border shadow-sm overflow-hidden" style={{ background: "#fff", borderColor: "#e2ddd6" }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: "#e2ddd6" }}>
          <span className="font-serif font-bold">👨‍👩‍👧 Family Members</span>
          <span className="ml-2 text-xs" style={{ color: "#6b6b80" }}>{family.length} member{family.length !== 1 ? "s" : ""}</span>
        </div>
        {family.length === 0 ? (
          <p className="text-sm p-5" style={{ color: "#6b6b80" }}>No family members added yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f7f4ef", borderBottom: "1px solid #e2ddd6" }}>
                  {["Member", "Relationship", "Email", "WhatsApp", "Access Code", ""].map(h => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#6b6b80", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {family.map((m, i) => (
                  <tr key={m.id} style={{ borderBottom: "1px solid #f0ece6" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ background: MEMBER_COLORS[i % MEMBER_COLORS.length] }}>
                          {m.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-semibold">{m.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", color: "#6b6b80" }}>{m.relationship}</td>
                    <td style={{ padding: "12px 16px" }}>
                      {m.email
                        ? <a href={`mailto:${m.email}`} style={{ color: "#1e40af", textDecoration: "none" }}>{m.email}</a>
                        : <span style={{ color: "#c0bdb8" }}>—</span>}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {m.phone
                        ? <a href={whatsappLink(m.phone, m.name, m.otp)} target="_blank" rel="noopener noreferrer"
                            style={{ color: "#2d6a4f", textDecoration: "none", fontWeight: 600 }}>
                            📱 {m.phone}
                          </a>
                        : <span style={{ color: "#c0bdb8" }}>—</span>}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {m.otp ? (
                        <div className="flex items-center gap-1.5">
                          <code style={{ fontFamily: "monospace", letterSpacing: "0.12em", fontSize: 13, background: "#f0fdf4", padding: "2px 8px", borderRadius: 6, color: "#2d6a4f", fontWeight: 700 }}>{m.otp}</code>
                          <button onClick={() => copyOTP(m.otp, m.id)} title="Copy code"
                            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: copiedId === m.id ? "#2d6a4f" : "#6b6b80", padding: "2px 4px" }}>
                            {copiedId === m.id ? "✓" : "⎘"}
                          </button>
                        </div>
                      ) : <span style={{ color: "#c0bdb8" }}>—</span>}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <button onClick={() => onDelete(m.id)} title="Remove member"
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", fontSize: 14, opacity: 0.5, padding: "2px 4px" }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                        onMouseLeave={e => (e.currentTarget.style.opacity = "0.5")}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MedLog;
