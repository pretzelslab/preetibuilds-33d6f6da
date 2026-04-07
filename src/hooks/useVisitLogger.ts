import { useEffect } from "react";
import { govDb } from "@/lib/supabase-governance";

const OWNER_KEY = "pl_session_access";

export function useVisitLogger(page: string) {
  useEffect(() => {
    const isOwner = !!localStorage.getItem(OWNER_KEY);
    const sessionKey = `vl_${page}`;
    const alreadyLogged = !!sessionStorage.getItem(sessionKey);
    if (isOwner || alreadyLogged) return;

    govDb.from("visit_logs").insert({
      page,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent || null,
    }).then(() => {
      sessionStorage.setItem(sessionKey, "1");
    });
  }, [page]);
}
