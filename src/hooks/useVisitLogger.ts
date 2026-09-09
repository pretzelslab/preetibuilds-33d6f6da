import { useEffect } from "react";
import { govDb } from "@/lib/supabase-governance";

const OWNER_KEY = "pl_session_access";

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

export function useVisitLogger(page: string) {
  useEffect(() => {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") return;

    const isOwner = !!localStorage.getItem(OWNER_KEY);
    const sessionKey = `vl_${page}`;
    const alreadyLogged = !!sessionStorage.getItem(sessionKey);
    if (isOwner || alreadyLogged) return;

    // Skip self-referrals (Preeti navigating between own pages in a new session)
    const referrer = document.referrer;
    if (referrer && OWNED_DOMAINS.some(d => referrer.includes(d))) {
      sessionStorage.setItem(sessionKey, "1"); // mark as seen so future navigation doesn't log either
      return;
    }

    getLocation().then(({ city, region, country }) => {
      govDb.from("visit_logs").insert({
        page,
        referrer: getSource(),
        user_agent: navigator.userAgent || null,
        city,
        region,
        country,
      }).then(() => {
        sessionStorage.setItem(sessionKey, "1");
      });
    });
  }, [page]);
}
