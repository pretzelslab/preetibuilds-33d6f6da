export const config = { runtime: "edge" };

import { createClient } from "@supabase/supabase-js";
import { isOwnerRequest } from "./_lib/ownerCookie";

// The one authoritative gate for every portfolio analytics write
// (visit_logs inserts, page_views increments). The browser no longer talks
// to Supabase directly for either — see src/hooks/useVisitLogger.ts and
// src/components/portfolio/VisitorCounter.tsx. Owner status is decided here,
// server-side, from the signed pl_owner cookie — never from anything the
// client claims about itself.
//
// RLS on visit_logs/page_views is UNCHANGED in this step (still anon
// insert/update) — this endpoint uses the same public anon key the client
// used to use directly. Removing that RLS grant is a separate, explicitly
// deferred migration; this step only removes the client-side code paths
// that could reach it.

function getGovDb() {
  const url = process.env.VITE_GOV_SUPABASE_URL as string;
  const anonKey = process.env.VITE_GOV_SUPABASE_ANON_KEY as string;
  return createClient(url, anonKey);
}

function readGeo(req: Request): { city: string | null; region: string | null; country: string | null } {
  const country = req.headers.get("x-vercel-ip-country");
  const region = req.headers.get("x-vercel-ip-country-region");
  const rawCity = req.headers.get("x-vercel-ip-city");
  let city: string | null = null;
  if (rawCity) {
    try { city = decodeURIComponent(rawCity); } catch { city = rawCity; }
  }
  return { city, region: region || null, country: country || null };
}

type VisitBody = { kind: "visit"; page: string; referrer?: string | null; userAgent?: string | null };
// `increment` lets the client preserve its existing once-per-tab-session
// dedup (sessionStorage) while still asking for a fresh display count on
// every mount — false means "just tell me the current count, don't bump it".
type PageviewBody = { kind: "pageview"; page: string; increment?: boolean };
// Lets a browser that just became owner undo the one visit_logs row that
// necessarily had to be inserted before it could prove ownership (see
// src/hooks/useVisitLogger.ts's retractPendingVisit — the gap this closes:
// a protected page's useVisitLogger call always runs on mount, before the
// visitor has had any chance to enter the master code, since PageGate only
// controls what JSX is *displayed*, not which hooks already fired earlier
// in the same render). Only ever deletes the exact row id the server itself
// handed back from that earlier insert — never a client-supplied page/time
// guess — and only when the caller's pl_owner cookie is valid right now.
type RetractBody = { kind: "retract"; id: string };
type AnalyticsBody = VisitBody | PageviewBody | RetractBody;

async function currentPageViewCount(govDb: ReturnType<typeof getGovDb>, page: string): Promise<number | null> {
  const { data } = await govDb.from("page_views").select("count").eq("page", page).single();
  return data ? (data as { count: number }).count : null;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ recorded: false, reason: "error" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: AnalyticsBody;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ recorded: false, reason: "error" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (body?.kind === "retract") {
    if (typeof body.id !== "string" || !body.id) {
      return new Response(JSON.stringify({ retracted: false, reason: "error" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const isOwnerForRetract = await isOwnerRequest(req, process.env.PORTFOLIO_OWNER_TOKEN);
    if (!isOwnerForRetract) {
      // Not authorized to delete anything — silently refuse rather than
      // error, since a normal visitor's browser can also call this endpoint
      // shape and there is nothing wrong with that request, just nothing to do.
      return new Response(JSON.stringify({ retracted: false, reason: "not-owner" }), {
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      });
    }
    const { error } = await getGovDb().from("visit_logs").delete().eq("id", body.id);
    if (error) {
      console.error("[visit_logs retract failed]", error.message);
      return new Response(JSON.stringify({ retracted: false, reason: "error" }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ retracted: true }), {
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }

  if (!body || typeof body.page !== "string" || !body.page || (body.kind !== "visit" && body.kind !== "pageview")) {
    return new Response(JSON.stringify({ recorded: false, reason: "error" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const isOwner = await isOwnerRequest(req, process.env.PORTFOLIO_OWNER_TOKEN);
  const govDb = getGovDb();

  if (body.kind === "visit") {
    if (isOwner) {
      return new Response(JSON.stringify({ recorded: false, reason: "owner" }), {
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      });
    }
    const { city, region, country } = readGeo(req);
    const { data, error } = await govDb.from("visit_logs").insert({
      page: body.page,
      referrer: typeof body.referrer === "string" ? body.referrer : null,
      user_agent: typeof body.userAgent === "string" ? body.userAgent : null,
      city, region, country,
    }).select("id").single();
    if (error) {
      console.error("[visit_logs insert failed]", error.message);
      return new Response(JSON.stringify({ recorded: false, reason: "error" }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ recorded: true, id: (data as { id: string } | null)?.id ?? null }), {
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }

  // kind === "pageview"
  if (isOwner) {
    const count = await currentPageViewCount(govDb, body.page);
    return new Response(JSON.stringify({ recorded: false, reason: "owner", count }), {
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }
  if (body.increment !== true) {
    const count = await currentPageViewCount(govDb, body.page);
    return new Response(JSON.stringify({ recorded: false, count }), {
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }
  const { error: rpcError } = await govDb.rpc("increment_page_view", { p_page: body.page });
  if (rpcError) {
    console.error("[increment_page_view rpc failed]", rpcError.message);
    const count = await currentPageViewCount(govDb, body.page);
    return new Response(JSON.stringify({ recorded: false, reason: "error", count }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
  const count = await currentPageViewCount(govDb, body.page);
  return new Response(JSON.stringify({ recorded: true, count }), {
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
