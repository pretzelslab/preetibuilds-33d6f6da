import { useEffect } from "react";
import { govDb } from "@/lib/supabase-governance";

const OWNER_KEY = "pl_session_access";

async function getLocation(): Promise<{ city: string | null; country: string | null }> {
  try {
    const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(4000) });
    const data = await res.json();
    return {
      city: data.city || null,
      country: data.country_name || null,
    };
  } catch {
    return { city: null, country: null };
  }
}

function getSource(): string | null {
  const params = new URLSearchParams(window.location.search);
  const utm = params.get("utm_source");
  if (utm) return `utm:${utm.toLowerCase()}`;
  return document.referrer || null;
}

export function useVisitLogger(page: string) {
  useEffect(() => {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") return;

    const isOwner = !!localStorage.getItem(OWNER_KEY);
    const sessionKey = `vl_${page}`;
    const alreadyLogged = !!sessionStorage.getItem(sessionKey);
    if (isOwner || alreadyLogged) return;

    getLocation().then(({ city, country }) => {
      govDb.from("visit_logs").insert({
        page,
        referrer: getSource(),
        user_agent: navigator.userAgent || null,
        city,
        country,
      }).then(() => {
        sessionStorage.setItem(sessionKey, "1");
      });
    });
  }, [page]);
}
