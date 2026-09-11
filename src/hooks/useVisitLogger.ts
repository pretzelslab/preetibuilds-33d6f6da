import { useEffect } from "react";
import { govDb } from "@/lib/supabase-governance";
import { isOwnerExcluded } from "@/lib/ownerExclusion";

// Approximate city/region/country from Vercel's own edge geolocation headers
// (read server-side in api/geo.ts) — no browser location permission, no
// third-party lookup, no IP address stored. Resolves to nulls wherever the
// headers aren't present (local dev, non-Vercel hosting, or a lookup failure).
async function getLocation(): Promise<{ city: string | null; region: string | null; country: string | null }> {
  try {
    const res = await fetch("/api/geo", { signal: AbortSignal.timeout(4000) });
    if (!res.ok) throw new Error("geo lookup failed");
    const data = await res.json();
    return {
      city: data.city || null,
      region: data.region || null,
      country: data.country || null,
    };
  } catch {
    return { city: null, region: null, country: null };
  }
}

function getSource(): string | null {
  const params = new URLSearchParams(window.location.search);
  const utm = params.get("utm_source");
  if (utm) return `utm:${utm.toLowerCase()}`;
  return document.referrer || null;
}

const OWNED_DOMAINS = ["preetibuilds-33d6f6da.vercel.app", "preetibuilds.vercel.app"];

// Tracks pages currently mid-submission in this tab (not persisted — sessionStorage
// is only written on confirmed success, so without this a second effect firing for
// the same page while the first insert is still in flight — e.g. a fast remount —
// would pass the sessionStorage check twice and double-insert).
const inFlight = new Set<string>();

// Exported standalone so it can be unit-tested without mounting a component.
// Returns true if a row was actually written (i.e. sessionStorage should be marked).
export async function logVisit(page: string): Promise<boolean> {
  const sessionKey = `vl_${page}`;
  if (inFlight.has(sessionKey)) return false;
  inFlight.add(sessionKey);
  try {
    const { city, region, country } = await getLocation();
    const { error } = await govDb.from("visit_logs").insert({
      page,
      referrer: getSource(),
      user_agent: navigator.userAgent || null,
      city,
      region,
      country,
    });
    if (error) {
      // Not marked as logged — eligible for a later attempt (e.g. the next
      // time this page mounts in this tab). Nothing here retries on its own,
      // so this can't turn into a retry loop.
      console.error("[visit_logs insert failed]", error.message);
      return false;
    }
    return true;
  } finally {
    inFlight.delete(sessionKey);
  }
}

export function useVisitLogger(page: string) {
  useEffect(() => {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") return;

    const isOwner = isOwnerExcluded();
    const sessionKey = `vl_${page}`;
    const alreadyLogged = !!sessionStorage.getItem(sessionKey);
    if (isOwner || alreadyLogged) return;

    // Skip self-referrals (Preeti navigating between own pages in a new session)
    const referrer = document.referrer;
    if (referrer && OWNED_DOMAINS.some(d => referrer.includes(d))) {
      sessionStorage.setItem(sessionKey, "1"); // mark as seen so future navigation doesn't log either
      return;
    }

    logVisit(page).then((success) => {
      if (success) sessionStorage.setItem(sessionKey, "1");
    });
  }, [page]);
}
