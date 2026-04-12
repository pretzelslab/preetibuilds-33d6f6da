import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { govDb } from "@/lib/supabase-governance";

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

export default function Admin() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [newCount, setNewCount] = useState(0);

  useEffect(() => {
    try { localStorage.setItem("pl_session_access", "1"); } catch {}
  }, []);

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
            setNewCount(diff > 0 ? diff : 0);
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
    await govDb.from("visit_logs").delete().eq("id", id);
    setVisits(v => v.filter(x => x.id !== id));
  }

  async function deleteSelected(ids: string[]) {
    await govDb.from("visit_logs").delete().in("id", ids);
    setVisits(v => v.filter(x => !ids.includes(x.id)));
  }

  const pages = ["all", ...Array.from(new Set(visits.map(v => v.page))).sort()];
  const filtered = filter === "all" ? visits : visits.filter(v => v.page === filter);

  const sourceCounts = visits.reduce<Record<string, number>>((acc, v) => {
    const s = parseSource(v.referrer);
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border/40">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
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

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">

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

        {/* Visit log table */}
        <div>
          <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
            <p className="text-xs font-semibold">Recent visits</p>
            <div className="flex items-center gap-2 flex-wrap">
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
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Device</th>
                    <th className="px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((v, i) => (
                    <tr key={v.id} className={`border-b border-border/40 last:border-0 ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                      <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                        <span className="block">{timeAgo(v.visited_at)}</span>
                        <span className="block text-[10px] opacity-50">{formatDateTime(v.visited_at)}</span>
                      </td>
                      <td className="px-3 py-2 font-medium">{PAGE_LABELS[v.page] ?? v.page}</td>
                      <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                        {v.city || v.country
                          ? <span>{[v.city, v.country].filter(Boolean).join(", ")}</span>
                          : <span className="opacity-40">—</span>}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{parseSource(v.referrer)}</td>
                      <td className="px-3 py-2 text-muted-foreground">{parseDevice(v.user_agent)}</td>
                      <td className="px-2 py-2">
                        <button
                          onClick={() => deleteVisit(v.id)}
                          className="text-muted-foreground/30 hover:text-rose-500 transition-colors text-[11px]"
                          title="Delete this visit"
                        >✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
