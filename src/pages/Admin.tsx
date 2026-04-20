import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { govDb } from "@/lib/supabase-governance";
import { PageGate } from "@/components/ui/PageGate";
import {
  getCustomGPUs, saveCustomGPUs,
  getCustomRegions, saveCustomRegions,
  exportGPUSnippet, exportRegionSnippet,
} from "@/lib/carbonCustomData";
import { GPU_PRESETS, REGION_ZONES, STATIC_INTENSITY } from "@/data/carbonDepthData";
import type { CustomGPU, CustomRegion } from "@/lib/carbonCustomData";

interface Visit {
  id: string;
  page: string;
  referrer: string | null;
  user_agent: string | null;
  visited_at: string;
  city: string | null;
  country: string | null;
}

function parseSource(referrer: string | null): string {
  if (!referrer) return "Direct";
  if (referrer.startsWith("utm:")) {
    const src = referrer.slice(4);
    const labels: Record<string, string> = {
      linkedin: "LinkedIn", google: "Google", github: "GitHub",
      twitter: "Twitter / X", x: "Twitter / X", email: "Email",
      whatsapp: "WhatsApp", instagram: "Instagram",
    };
    return labels[src] ?? src.charAt(0).toUpperCase() + src.slice(1);
  }
  if (referrer.includes("linkedin")) return "LinkedIn";
  if (referrer.includes("google")) return "Google";
  if (referrer.includes("github")) return "GitHub";
  if (referrer.includes("twitter") || referrer.includes("x.com")) return "Twitter / X";
  try { return new URL(referrer).hostname; } catch { return referrer; }
}

function parseDevice(ua: string | null): string {
  if (!ua) return "Unknown";
  if (/mobile|android|iphone|ipad/i.test(ua)) return "Mobile";
  return "Desktop";
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const PAGE_LABELS: Record<string, string> = {
  "/": "Landing",
  "/ai-governance": "AI Governance",
  "/ai-readiness": "AI Readiness",
  "/client-discovery": "AI Risk Assessment",
  "/product-intelligence": "Product Intelligence",
  "/gtm-techstack": "GTM Tech Stack",
  "/melodic-framework": "Melodic Framework",
  "/algorithmic-fairness": "Algorithmic Fairness Auditor",
  "/medlog": "MedLog",
  "/research": "Research",
};

const LAST_SEEN_KEY = "admin_last_seen_count";

// ── Carbon Depth Data Manager ─────────────────────────────────────────────────
function CarbonDataManager() {
  const [open, setOpen] = useState(false);

  // ── GPU state ──────────────────────────────────────────────────────────────
  const [customGPUs, setCustomGPUs]   = useState<CustomGPU[]>(() => getCustomGPUs());
  const [gpuName, setGpuName]         = useState("");
  const [gpuTdp, setGpuTdp]           = useState("");
  const [gpuSource, setGpuSource]     = useState("");
  const [gpuError, setGpuError]       = useState("");
  const [gpuCopied, setGpuCopied]     = useState(false);

  // ── Region state ───────────────────────────────────────────────────────────
  const [customRegions, setCustomRegions] = useState<CustomRegion[]>(() => getCustomRegions());
  const [rLabel, setRLabel]               = useState("");
  const [rZone, setRZone]                 = useState("");
  const [rIntensity, setRIntensity]       = useState("");
  const [rSource, setRSource]             = useState("");
  const [rError, setRError]               = useState("");
  const [rCopied, setRCopied]             = useState(false);

  // ── GPU actions ────────────────────────────────────────────────────────────
  function addGPU() {
    setGpuError("");
    const name = gpuName.trim();
    const tdp  = Number(gpuTdp);
    if (!name)              return setGpuError("GPU name is required.");
    if (isNaN(tdp) || tdp <= 0) return setGpuError("TDP must be a positive number (watts).");
    if (GPU_PRESETS[name])  return setGpuError(`"${name}" already exists in the built-in list.`);
    if (customGPUs.find(g => g.name === name)) return setGpuError(`"${name}" already added.`);
    const updated = [...customGPUs, { name, tdpWatts: tdp, source: gpuSource.trim() || "manual entry" }];
    setCustomGPUs(updated);
    saveCustomGPUs(updated);
    setGpuName(""); setGpuTdp(""); setGpuSource("");
  }

  function deleteGPU(name: string) {
    const updated = customGPUs.filter(g => g.name !== name);
    setCustomGPUs(updated);
    saveCustomGPUs(updated);
  }

  function copyGPUSnippet() {
    navigator.clipboard.writeText(exportGPUSnippet()).then(() => {
      setGpuCopied(true);
      setTimeout(() => setGpuCopied(false), 2000);
    });
  }

  // ── Region actions ─────────────────────────────────────────────────────────
  function addRegion() {
    setRError("");
    const label     = rLabel.trim();
    const zone      = rZone.trim().toUpperCase();
    const intensity = Number(rIntensity);
    if (!label)                    return setRError("Region label is required (e.g. me-south-1 (Bahrain)).");
    if (!zone)                     return setRError("Zone ID is required (e.g. BH).");
    if (isNaN(intensity) || intensity <= 0) return setRError("Intensity must be a positive number (gCO₂/kWh).");
    if (REGION_ZONES[label])       return setRError(`"${label}" already exists in the built-in list.`);
    if (customRegions.find(r => r.label === label)) return setRError(`"${label}" already added.`);
    const updated = [...customRegions, { label, zoneId: zone, intensityGCO2: intensity, source: rSource.trim() || "manual entry" }];
    setCustomRegions(updated);
    saveCustomRegions(updated);
    setRLabel(""); setRZone(""); setRIntensity(""); setRSource("");
  }

  function deleteRegion(label: string) {
    const updated = customRegions.filter(r => r.label !== label);
    setCustomRegions(updated);
    saveCustomRegions(updated);
  }

  function copyRegionSnippet() {
    navigator.clipboard.writeText(exportRegionSnippet()).then(() => {
      setRCopied(true);
      setTimeout(() => setRCopied(false), 2000);
    });
  }

  const inputCls = "w-full bg-muted/30 border border-border/40 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-violet-500/60 text-foreground placeholder:text-muted-foreground/40";
  const btnCls   = "px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors";

  return (
    <div className="mt-8 rounded-2xl border border-border/40 bg-card/50 overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/10 transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <div>
          <span className="text-sm font-bold">Carbon Depth — Data Manager</span>
          <span className="text-xs text-muted-foreground ml-3">
            Add GPUs · regions · export code snippet
          </span>
        </div>
        <span className="text-muted-foreground">{open ? "▾" : "▸"}</span>
      </button>

      {open && (
        <div className="px-5 pb-6 space-y-8">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Entries added here are saved in your browser (localStorage) and appear immediately in the
            Carbon Depth calculator dropdowns. They do not modify the source file.
            Use the <span className="font-semibold text-foreground/60">Export snippet</span> button
            to get the updated TypeScript constant — paste it into{" "}
            <span className="font-mono text-violet-400/70">src/data/carbonDepthData.ts</span> to make it permanent.
          </p>

          {/* ── GPU section ──────────────────────────────────────────────── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">GPU Presets</h3>
              <button
                onClick={copyGPUSnippet}
                className={`${btnCls} border-violet-500/30 bg-violet-500/10 text-violet-400 hover:bg-violet-500/20`}
              >
                {gpuCopied ? "✓ Copied!" : "Export snippet"}
              </button>
            </div>

            {/* Table — static + custom */}
            <div className="rounded-xl border border-border/30 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/30 bg-muted/20">
                    <th className="text-left px-3 py-2 font-semibold text-muted-foreground">GPU</th>
                    <th className="text-right px-3 py-2 font-semibold text-muted-foreground">TDP (W)</th>
                    <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Source</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(GPU_PRESETS).map(([name, tdp]) => (
                    <tr key={name} className="border-b border-border/20">
                      <td className="px-3 py-1.5 font-mono font-semibold">{name}</td>
                      <td className="px-3 py-1.5 text-right font-mono">{tdp}</td>
                      <td className="px-3 py-1.5 text-muted-foreground/60 italic text-[10px]">built-in</td>
                      <td className="px-3 py-1.5" />
                    </tr>
                  ))}
                  {customGPUs.map(g => (
                    <tr key={g.name} className="border-b border-border/20 bg-violet-500/5">
                      <td className="px-3 py-1.5 font-mono font-semibold text-violet-400">{g.name}</td>
                      <td className="px-3 py-1.5 text-right font-mono">{g.tdpWatts}</td>
                      <td className="px-3 py-1.5 text-muted-foreground/60 text-[10px]">{g.source}</td>
                      <td className="px-3 py-1.5 text-right">
                        <button
                          onClick={() => deleteGPU(g.name)}
                          className="text-[10px] text-rose-400/60 hover:text-rose-400 transition-colors"
                        >
                          remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add GPU form */}
            <div className="rounded-xl border border-border/30 bg-muted/5 p-4 space-y-3">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Add GPU</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  placeholder="GPU name  e.g. H200"
                  value={gpuName} onChange={e => setGpuName(e.target.value)}
                  className={inputCls}
                />
                <input
                  placeholder="TDP in watts  e.g. 700"
                  type="number" min={1}
                  value={gpuTdp} onChange={e => setGpuTdp(e.target.value)}
                  className={inputCls}
                />
                <input
                  placeholder="Source  e.g. NVIDIA datasheet 2024"
                  value={gpuSource} onChange={e => setGpuSource(e.target.value)}
                  className={inputCls}
                />
              </div>
              {gpuError && <p className="text-[10px] text-rose-400">{gpuError}</p>}
              <button
                onClick={addGPU}
                className={`${btnCls} border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20`}
              >
                + Add GPU
              </button>
            </div>
          </div>

          {/* ── Region section ────────────────────────────────────────────── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cloud Regions</h3>
              <button
                onClick={copyRegionSnippet}
                className={`${btnCls} border-violet-500/30 bg-violet-500/10 text-violet-400 hover:bg-violet-500/20`}
              >
                {rCopied ? "✓ Copied!" : "Export snippet"}
              </button>
            </div>

            {/* Table — static + custom */}
            <div className="rounded-xl border border-border/30 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/30 bg-muted/20">
                    <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Region</th>
                    <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Zone ID</th>
                    <th className="text-right px-3 py-2 font-semibold text-muted-foreground">gCO₂/kWh</th>
                    <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Source</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(REGION_ZONES).map(([label, zone]) => (
                    <tr key={label} className="border-b border-border/20">
                      <td className="px-3 py-1.5">{label}</td>
                      <td className="px-3 py-1.5 font-mono text-[10px]">{zone}</td>
                      <td className="px-3 py-1.5 text-right font-mono">{STATIC_INTENSITY[zone] ?? "—"}</td>
                      <td className="px-3 py-1.5 text-muted-foreground/60 italic text-[10px]">built-in</td>
                      <td className="px-3 py-1.5" />
                    </tr>
                  ))}
                  {customRegions.map(r => (
                    <tr key={r.label} className="border-b border-border/20 bg-violet-500/5">
                      <td className="px-3 py-1.5 text-violet-400">{r.label}</td>
                      <td className="px-3 py-1.5 font-mono text-[10px] text-violet-400/70">{r.zoneId}</td>
                      <td className="px-3 py-1.5 text-right font-mono">{r.intensityGCO2}</td>
                      <td className="px-3 py-1.5 text-muted-foreground/60 text-[10px]">{r.source}</td>
                      <td className="px-3 py-1.5 text-right">
                        <button
                          onClick={() => deleteRegion(r.label)}
                          className="text-[10px] text-rose-400/60 hover:text-rose-400 transition-colors"
                        >
                          remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add region form */}
            <div className="rounded-xl border border-border/30 bg-muted/5 p-4 space-y-3">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Add Region</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  placeholder="Region label  e.g. me-south-1 (Bahrain)"
                  value={rLabel} onChange={e => setRLabel(e.target.value)}
                  className={inputCls}
                />
                <input
                  placeholder="Electricity Maps zone ID  e.g. BH"
                  value={rZone} onChange={e => setRZone(e.target.value)}
                  className={inputCls}
                />
                <input
                  placeholder="Grid intensity  e.g. 504  (gCO₂/kWh)"
                  type="number" min={1}
                  value={rIntensity} onChange={e => setRIntensity(e.target.value)}
                  className={inputCls}
                />
                <input
                  placeholder="Source  e.g. Electricity Maps 2024"
                  value={rSource} onChange={e => setRSource(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div className="text-[10px] text-muted-foreground/50 leading-relaxed">
                Zone ID = the Electricity Maps identifier for this region (used for live API lookups).
                Find it at <span className="font-mono">electricitymaps.com/map</span> — hover a region to see its zone code.
              </div>
              {rError && <p className="text-[10px] text-rose-400">{rError}</p>}
              <button
                onClick={addRegion}
                className={`${btnCls} border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20`}
              >
                + Add Region
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

export default function Admin() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [newCount, setNewCount] = useState(0);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [hideSelfReferrals, setHideSelfReferrals] = useState(false);

  // Owner flag is set by PageGate on unlock — no auto-set here

  useEffect(() => {
    govDb
      .from("visit_logs")
      .select("*")
      .order("visited_at", { ascending: false })
      .limit(200)
      .then(({ data }) => {
        if (data) {
          setVisits(data as Visit[]);
          try {
            const last = parseInt(localStorage.getItem(LAST_SEEN_KEY) ?? "0", 10);
            const diff = data.length - last;
            const count = diff > 0 ? diff : 0;
            setNewCount(count);
            // Browser notification when new visitors detected
            if (count > 0 && "Notification" in window) {
              Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                  new Notification("preetibuilds", {
                    body: `${count} new visitor${count > 1 ? "s" : ""} since you last checked.`,
                    icon: "/favicon.ico",
                  });
                }
              });
            }
          } catch {}
        }
        setLoading(false);
      });
  }, []);

  function markSeen() {
    try { localStorage.setItem(LAST_SEEN_KEY, String(visits.length)); } catch {}
    setNewCount(0);
  }

  async function deleteVisit(id: string) {
    setDeleteError(null);
    const { error } = await govDb.from("visit_logs").delete().eq("id", id);
    if (error) {
      setDeleteError(`Delete failed: ${error.message} — check Supabase RLS policy for visit_logs DELETE.`);
      return;
    }
    setVisits(v => v.filter(x => x.id !== id));
  }

  async function deleteSelected(ids: string[]) {
    setDeleteError(null);
    const { error } = await govDb.from("visit_logs").delete().in("id", ids);
    if (error) {
      setDeleteError(`Delete failed: ${error.message} — check Supabase RLS policy for visit_logs DELETE.`);
      return;
    }
    setVisits(v => v.filter(x => !ids.includes(x.id)));
  }

  const SELF_DOMAINS = ["preetibuilds-33d6f6da.vercel.app", "preetibuilds.vercel.app"];
  const isSelfReferral = (v: Visit) =>
    SELF_DOMAINS.some(d => v.referrer?.includes(d));

  const pages = ["all", ...Array.from(new Set(visits.map(v => v.page))).sort()];
  const filtered = visits
    .filter(v => filter === "all" || v.page === filter)
    .filter(v => !hideSelfReferrals || !isSelfReferral(v));

  const sourceCounts = visits.reduce<Record<string, number>>((acc, v) => {
    const s = parseSource(v.referrer);
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  const preview = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12, opacity: 0.5 }}>
      <span style={{ fontSize: 32 }}>🔒</span>
      <span style={{ fontSize: 13, fontFamily: "monospace", color: "hsl(var(--muted-foreground))" }}>Admin · Restricted</span>
    </div>
  );

  return (
    <PageGate pageId="admin" backTo="/" previewContent={preview}>
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border/40">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">← Back to Portfolio</Link>
          <div className="flex items-center gap-3">
            {newCount > 0 && (
              <button
                onClick={markSeen}
                className="flex items-center gap-1.5 text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors"
              >
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-bold">{newCount}</span>
                new · mark seen
              </button>
            )}
            <span className="text-[10px] font-mono text-primary/50">Admin · Visitor Log</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-lg border border-border/60 bg-muted/10 px-4 py-3">
            <p className="text-[10px] text-muted-foreground mb-1">Total visits</p>
            <p className="text-2xl font-bold">{visits.length}</p>
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/10 px-4 py-3">
            <p className="text-[10px] text-muted-foreground mb-1">Top source</p>
            <p className="text-sm font-bold">{Object.entries(sourceCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—"}</p>
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/10 px-4 py-3">
            <p className="text-[10px] text-muted-foreground mb-1">Mobile visits</p>
            <p className="text-2xl font-bold">{visits.filter(v => parseDevice(v.user_agent) === "Mobile").length}</p>
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/10 px-4 py-3">
            <p className="text-[10px] text-muted-foreground mb-1">Pages visited</p>
            <p className="text-2xl font-bold">{new Set(visits.map(v => v.page)).size}</p>
          </div>
        </div>

        {/* Delete error */}
        {deleteError && (
          <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs text-rose-500 flex items-start justify-between gap-3">
            <span>{deleteError}</span>
            <button onClick={() => setDeleteError(null)} className="shrink-0 text-rose-400 hover:text-rose-200">✕</button>
          </div>
        )}

        {/* Source breakdown */}
        {Object.keys(sourceCounts).length > 0 && (
          <div className="rounded-xl border border-border/60 bg-muted/10 p-5">
            <p className="text-xs font-semibold mb-3">Traffic sources</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(sourceCounts).sort((a, b) => b[1] - a[1]).map(([src, n]) => (
                <span key={src} className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-300 border border-blue-500/20">
                  {src} · {n}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Main two-column: visit log + access codes sidebar */}
        <div className="flex gap-5 items-start">

          {/* Visit log — main column */}
          <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
            <p className="text-xs font-semibold">Recent visits</p>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setHideSelfReferrals(v => !v)}
                className={`text-[11px] px-2 py-1 rounded border transition-colors ${hideSelfReferrals ? "border-blue-500/40 text-blue-500" : "border-border/60 text-muted-foreground hover:text-blue-500 hover:border-blue-500/40"}`}
              >
                {hideSelfReferrals ? "Showing filtered" : "Hide self-referrals"}
              </button>
              <button
                onClick={() => {
                  const directIds = visits.filter(v => !v.referrer).map(v => v.id);
                  if (directIds.length && confirm(`Delete ${directIds.length} direct/local visits?`)) deleteSelected(directIds);
                }}
                className="text-[11px] px-2 py-1 rounded border border-border/60 text-muted-foreground hover:text-rose-500 hover:border-rose-500/40 transition-colors"
              >
                Clear direct visits
              </button>
              <select
                value={filter}
                onChange={e => setFilter(e.target.value)}
                className="text-[11px] px-2 py-1 rounded border border-border bg-background outline-none"
              >
                {pages.map(p => (
                  <option key={p} value={p}>{p === "all" ? "All pages" : (PAGE_LABELS[p] ?? p)}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <p className="text-xs text-muted-foreground py-8 text-center">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground py-8 text-center">No visits yet.</p>
          ) : (
            <div className="rounded-xl border border-border/60 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/20">
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">When</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Page</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Location</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Source</th>
                    <th className="text-left px-2 py-2 font-medium text-muted-foreground">Dev</th>
                    <th className="px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((v, i) => {
                    const src = parseSource(v.referrer);
                    const srcColor = src === "Direct" ? "text-muted-foreground/50" :
                      src === "LinkedIn" ? "text-blue-500" :
                      src === "GitHub" ? "text-foreground" :
                      src === "Google" ? "text-emerald-500" : "text-violet-400";
                    const isSelf = isSelfReferral(v);
                    return (
                    <tr key={v.id} className={`border-b border-border/40 last:border-0 ${isSelf ? "opacity-40" : ""} ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                      <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                        <span className="block font-medium text-foreground">{timeAgo(v.visited_at)}</span>
                        <span className="block text-[10px] opacity-50">{formatDateTime(v.visited_at)}</span>
                      </td>
                      <td className="px-3 py-2 font-medium">{PAGE_LABELS[v.page] ?? v.page}</td>
                      <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                        {v.city || v.country
                          ? <span>{[v.city, v.country].filter(Boolean).join(", ")}</span>
                          : <span className="opacity-40">—</span>}
                      </td>
                      <td className={`px-3 py-2 font-medium ${srcColor}`}>
                        <span className="block">{src}</span>
                        {v.referrer && !v.referrer.startsWith("utm:") && (
                          <span className="block text-[10px] text-muted-foreground/40 font-normal truncate max-w-[120px]">{v.referrer}</span>
                        )}
                      </td>
                      <td className="px-2 py-2">
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${parseDevice(v.user_agent) === "Mobile" ? "border-violet-500/30 text-violet-400 bg-violet-500/10" : "border-border/40 text-muted-foreground bg-muted/20"}`}>
                          {parseDevice(v.user_agent) === "Mobile" ? "M" : "D"}
                        </span>
                      </td>
                      <td className="px-2 py-2">
                        <button
                          onClick={() => deleteVisit(v.id)}
                          className="text-muted-foreground/30 hover:text-rose-500 transition-colors text-[11px]"
                          title="Delete this visit"
                        >✕</button>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          </div>{/* end visit log column */}

          {/* Access codes — sidebar */}
          <div className="w-40 shrink-0">
            <div className="rounded-xl border border-border/60 bg-muted/10 p-4">
              <p className="text-[11px] font-semibold mb-3 text-muted-foreground">Access codes</p>
              <div className="space-y-1">
                {[
                  { page: "Master (all pages)", code: "PRL2026", master: true },
                  { page: "Research",           code: "RSC2026" },
                  { page: "Carbon Depth",       code: "CDX2026" },
                  { page: "AI Readiness",       code: "ARD2026" },
                  { page: "Fairness Auditor",   code: "FAR2026" },
                  { page: "Carbon-Fairness",    code: "CFR2026" },
                  { page: "Client Discovery",   code: "CLN2026" },
                  { page: "Sustainability Fwk", code: "SFW2026" },
                  { page: "AI Webinar",         code: "WBN2026" },
                  { page: "Privacy Auditor",    code: "PRI2026" },
                  { page: "Melodic",            code: "MEL2026" },
                  { page: "Admin",              code: "ADM2026" },
                ].map(({ page, code, master }) => (
                  <div key={code} className="flex items-center justify-between gap-2">
                    <span className={`text-[11px] truncate ${master ? "text-blue-500 dark:text-blue-400 font-medium" : "text-muted-foreground"}`}>{page}</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(code)}
                      className={`font-mono text-[10px] px-1.5 py-0.5 rounded border transition-colors shrink-0 ${master ? "border-blue-500/30 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20" : "border-border/40 bg-muted/30 text-foreground hover:border-blue-500/30 hover:text-blue-500"}`}
                      title="Copy"
                    >{code}</button>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground/40 mt-3">Click to copy</p>
            </div>
          </div>

        </div>{/* end two-column row */}

        {/* ── Carbon Depth Data Manager ─────────────────────────────────── */}
        <CarbonDataManager />

      </div>
    </div>
    </PageGate>
  );
}
