import { useEffect } from "react";

function getSource(): string | null {
  const params = new URLSearchParams(window.location.search);
  const utm = params.get("utm_source");
  if (utm) return `utm:${utm.toLowerCase()}`;
  return document.referrer || null;
}

const OWNED_DOMAINS = ["preetibuilds-33d6f6da.vercel.app", "preetibuilds.vercel.app"];

// Tracks pages currently mid-request in this tab (not persisted — sessionStorage
// is only written once the server has given a definitive answer, so without this
// a second effect firing for the same page while the first request is still in
// flight — e.g. a fast remount — would pass the sessionStorage check twice and
// double-request).
const inFlight = new Set<string>();

// A protected page's useVisitLogger call always runs on mount, before the
// visitor has had any chance to enter the master code — PageGate only
// controls what JSX is *displayed*, it has no power over a hook that already
// fired earlier in the same render. So the very first visit on a brand-new
// browser's very first protected page can be inserted before ownership is
// provable. This map remembers that inserted row's id (keyed by the actual
// browser path, not the caller-supplied `page` string, since that string is
// inconsistently formatted with/without a leading slash across pages) so it
// can be retracted a moment later if this same tab turns out to be the
// owner. Not persisted — a real new visitor's row is meant to stay recorded.
const pendingVisitIds = new Map<string, string>();

// Exported standalone so it can be unit-tested without mounting a component.
// Posts to the one authoritative server analytics endpoint
// (api/portfolio-analytics.ts) — the browser never talks to Supabase
// directly for this. The server alone decides, from its own signed owner
// cookie, whether the visit is actually recorded; this function has no
// owner-exclusion logic of its own that could drift or be forgotten.
//
// `handled` is true whenever the server gave a definitive answer at all
// (recorded, or intentionally skipped because this is the owner) — that's
// the signal the caller should use to mark sessionStorage "seen", since
// asking again in the same tab session is pointless either way. `recorded`
// is true only when a row was actually written, for callers that care.
export async function logVisit(page: string): Promise<{ handled: boolean; recorded: boolean }> {
  const sessionKey = `vl_${page}`;
  if (inFlight.has(sessionKey)) return { handled: false, recorded: false };
  inFlight.add(sessionKey);
  try {
    const res = await fetch("/api/portfolio-analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "visit",
        page,
        referrer: getSource(),
        userAgent: navigator.userAgent || null,
      }),
    });
    if (!res.ok) {
      console.error("[portfolio-analytics] visit request failed", res.status);
      return { handled: false, recorded: false };
    }
    const data = await res.json();
    if (data?.recorded === true && typeof data?.id === "string") {
      pendingVisitIds.set(window.location.pathname, data.id);
    }
    return { handled: true, recorded: data?.recorded === true };
  } catch (err) {
    console.error("[portfolio-analytics] visit request errored", err);
    return { handled: false, recorded: false };
  } finally {
    inFlight.delete(sessionKey);
  }
}

// Called from every master-code entry point (PageGate, Tracker, Comments)
// right after a successful verifyMasterCode() — i.e. right after this
// browser becomes provably the owner. If the page currently on screen
// already logged a visit moments ago (necessarily while still unproven),
// this deletes that exact row. No-ops if there's nothing pending, or if the
// server disagrees that this browser is the owner (it always re-checks the
// cookie itself — this function cannot delete anything on its own say-so).
export async function retractPendingVisit(): Promise<void> {
  const path = window.location.pathname;
  const id = pendingVisitIds.get(path);
  if (!id) return;
  pendingVisitIds.delete(path);
  try {
    await fetch("/api/portfolio-analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "retract", id }),
    });
  } catch {
    // Best-effort — same failure mode as any other network hiccup in this
    // file; nothing more to retry against.
  }
}

export function useVisitLogger(page: string) {
  useEffect(() => {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") return;

    const sessionKey = `vl_${page}`;
    const alreadyLogged = !!sessionStorage.getItem(sessionKey);
    if (alreadyLogged) return;

    // Skip self-referrals (navigating between own portfolio pages within a
    // session) — an existing visitor-analytics heuristic unrelated to owner
    // exclusion: avoid counting internal multi-page browsing as repeated
    // fresh visits, for any visitor.
    const referrer = document.referrer;
    if (referrer && OWNED_DOMAINS.some(d => referrer.includes(d))) {
      sessionStorage.setItem(sessionKey, "1");
      return;
    }

    // No client-side owner check here by design — server owner
    // verification (the signed pl_owner cookie, checked in
    // api/portfolio-analytics.ts) is authoritative. This always asks.
    logVisit(page).then(({ handled }) => {
      if (handled) sessionStorage.setItem(sessionKey, "1");
    });
  }, [page]);
}
