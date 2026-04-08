import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, BarChart3, Calendar, Heart, Shield, Stethoscope, Users, ExternalLink } from "lucide-react";

const LIVE_URL = "https://pretzelslab.github.io/medlog";

const FEATURES = [
  { icon: Users,       title: "Per-member profiles",     desc: "Log health records for every family member under one account. Switch profiles in one tap." },
  { icon: Stethoscope, title: "Medical event log",       desc: "Track visits, check-ups, surgeries, medications, and procedures with doctor and dosage fields." },
  { icon: Heart,       title: "Symptom tracker",         desc: "Log non-critical symptoms with severity, duration, trigger, and notes. Spot patterns over time." },
  { icon: BarChart3,   title: "Yearly analysis",         desc: "Charts, severity splits, top symptoms, busiest months, and health insights — all in one view." },
  { icon: Calendar,    title: "Timeline grouping",       desc: "Events grouped by Today / This Week / This Month / This Year / Older for easy scanning." },
  { icon: Shield,      title: "Cloud sync",              desc: "Data stored securely in Supabase. Access from any device. Row-level security — only you see your data." },
];

const DEMO_EVENTS = [
  { type: "checkup",    label: "Check-up",    title: "Annual Physical Exam",     date: "15 Jan 2026", doctor: "Dr. Chen / Family Health" },
  { type: "medication", label: "Medication",  title: "Ibuprofen 200mg",          date: "03 Feb 2026", doctor: "200mg as needed" },
  { type: "visit",      label: "Visit",       title: "Dermatology Consultation", date: "20 Mar 2026", doctor: "Dr. Patel / SkinCare" },
  { type: "surgery",    label: "Surgery",     title: "Wisdom Tooth Extraction",  date: "14 Jul 2026", doctor: "Dr. Adams / City Dental" },
];

const TYPE_COLORS: Record<string, string> = {
  checkup:    "bg-sky-100 text-sky-700",
  medication: "bg-amber-100 text-amber-700",
  visit:      "bg-emerald-100 text-emerald-700",
  surgery:    "bg-rose-100 text-rose-700",
};

export default function MedLog() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-background/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/#projects" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Portfolio
          </Link>
          <a
            href={LIVE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
          >
            View Live App <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">

        {/* Title */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">🩺</span>
            <h1 className="text-3xl font-bold">MedLog</h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full border bg-amber-500/10 text-amber-600 border-amber-500/20">Preview</span>
          </div>
          <p className="text-muted-foreground text-base leading-relaxed max-w-xl">
            A private family health journal. Log medical events and symptoms for every family member, track trends over time, and export yearly health reports — all secured in the cloud.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            {["Vanilla JS", "Supabase", "Chart.js", "CSS"].map(t => (
              <span key={t} className="text-[11px] font-mono bg-muted/50 text-muted-foreground px-2.5 py-1 rounded">{t}</span>
            ))}
          </div>
        </motion.div>

        {/* Features */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-12">
          <p className="text-xs font-mono tracking-widest uppercase text-muted-foreground/50 mb-4">Features</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-3 p-4 rounded-xl border border-border/60 bg-card">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold mb-0.5">{title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Dashboard preview — locked */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-12">
          <p className="text-xs font-mono tracking-widest uppercase text-muted-foreground/50 mb-4">Dashboard preview</p>

          <div className="rounded-2xl border border-border/60 overflow-hidden shadow-sm">
            {/* Mock header */}
            <div className="bg-[#1a1a2e] px-5 py-3 flex items-center justify-between">
              <span className="font-serif text-[#74c69d] text-lg font-bold tracking-tight">MedLog ✦</span>
              <div className="flex gap-3">
                {["Dashboard", "Log Event", "History", "Analysis"].map(n => (
                  <span key={n} className="text-[11px] text-white/40">{n}</span>
                ))}
              </div>
            </div>

            {/* Mock stat cards */}
            <div className="bg-muted/20 px-5 py-4 grid grid-cols-4 gap-3">
              {[["Total Records", "18"], ["This Year", "12"], ["Medications", "4"], ["Symptoms", "10"]].map(([label, val]) => (
                <div key={label} className="bg-card rounded-xl p-3 border border-border/50">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">{label}</p>
                  <p className="text-2xl font-bold font-serif mt-1">{val}</p>
                </div>
              ))}
            </div>

            {/* Mock event list — first 2 visible, rest blurred */}
            <div className="px-5 py-4 bg-muted/10">
              <p className="text-[11px] font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Recent Activity</p>
              <div className="space-y-2">
                {DEMO_EVENTS.map((ev, i) => (
                  <div
                    key={ev.title}
                    className="flex items-start gap-3 p-3 rounded-xl border border-border/50 bg-card transition-all"
                    style={i >= 2 ? { filter: "blur(4px)", userSelect: "none", pointerEvents: "none" } : {}}
                  >
                    <div className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                      style={{ background: ev.type === "checkup" ? "#5090a8" : ev.type === "medication" ? "#b8904a" : ev.type === "visit" ? "#6b9e82" : "#b86868" }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{ev.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-full mr-1.5 ${TYPE_COLORS[ev.type]}`}>{ev.label}</span>
                        {ev.date}{ev.doctor ? ` · ${ev.doctor}` : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Lock overlay */}
              <div className="mt-3 flex items-center justify-center gap-2 py-3 rounded-xl border border-border/50 bg-card/60">
                <Shield className="w-3.5 h-3.5 text-muted-foreground/50" />
                <span className="text-xs text-muted-foreground/60">Private — login required to view full data</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex items-center gap-4">
          <a
            href={LIVE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold transition-colors"
          >
            View Live App <ExternalLink className="w-4 h-4" />
          </a>
          <p className="text-xs text-muted-foreground">Private — family access only</p>
        </motion.div>

      </div>
    </div>
  );
}
