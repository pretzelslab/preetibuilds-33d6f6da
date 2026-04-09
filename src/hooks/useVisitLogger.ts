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

export function useVisitLogger(page: string) {
  useEffect(() => {
    const isOwner = !!localStorage.getItem(OWNER_KEY);
    const sessionKey = `vl_${page}`;
    const alreadyLogged = !!sessionStorage.getItem(sessionKey);
    if (isOwner || alreadyLogged) return;

    getLocation().then(({ city, country }) => {
      govDb.from("visit_logs").insert({
        page,
        referrer: document.referrer || null,
        user_agent: navigator.userAgent || null,
        city,
        country,
      }).then(() => {
        sessionStorage.setItem(sessionKey, "1");
      });
    });
  }, [page]);
}
