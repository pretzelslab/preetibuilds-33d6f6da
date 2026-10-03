export const config = { runtime: "edge" };

import { isOwnerRequest } from "./_lib/ownerCookie.js";
import { getAdminDb } from "./_lib/adminDb.js";

// Owner-only admin actions that RLS no longer allows from the browser's anon
// key: reading/deleting visit_logs, moderating portfolio_comments, and
// moderating melodic_song_requests.
//
// Gate: the signed pl_owner cookie, which only api/verify-master-code.ts ever
// mints, and only after a successful server-side master-code check. A
// page-specific code (e.g. the admin share code) never produces that cookie,
// so a collaborator holding only a page code gets 401 here by design.
//
// Database access uses the service-role key (api/_lib/adminDb.ts); missing
// configuration fails closed with 503.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const RAAGA_ID_RE = /^[a-z0-9-]{1,64}$/i;
const VISITS_CHUNK = 1000;
const MAX_DELETE_IDS = 1000;
const MAX_REPLY_LENGTH = 1000;

type AdminBody =
  | { action: "visits.list"; offset?: number }
  | { action: "visits.delete"; ids: string[] }
  | { action: "comments.pending" }
  | { action: "comments.approve"; id: string }
  | { action: "comments.reply"; id: string; reply: string }
  | { action: "comments.delete"; id: string }
  | { action: "songs.pending" }
  | { action: "songs.approve"; id: string; raagaId: string }
  | { action: "songs.reject"; id: string };

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

const badRequest = () => json({ ok: false, error: "bad-request" }, 400);

function isUuid(v: unknown): v is string {
  return typeof v === "string" && UUID_RE.test(v);
}

function dbError(action: string, message: string): Response {
  console.error(`[admin ${action} failed]`, message);
  return json({ ok: false, error: "db-error" }, 502);
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") return json({ ok: false, error: "method-not-allowed" }, 405);

  // Authorize before even parsing the body — nothing below is reachable
  // without a valid owner session.
  const isOwner = await isOwnerRequest(req, process.env.PORTFOLIO_OWNER_TOKEN);
  if (!isOwner) return json({ ok: false, error: "master-code-required" }, 401);

  let body: AdminBody;
  try {
    body = await req.json();
  } catch {
    return badRequest();
  }
  if (!body || typeof body !== "object" || typeof (body as { action?: unknown }).action !== "string") {
    return badRequest();
  }

  const db = getAdminDb();
  if (!db) {
    console.error("[admin] GOV_SUPABASE_SERVICE_ROLE_KEY or VITE_GOV_SUPABASE_URL not configured");
    return json({ ok: false, error: "not-configured" }, 503);
  }

  switch (body.action) {
    case "visits.list": {
      const offset = body.offset ?? 0;
      if (!Number.isInteger(offset) || offset < 0) return badRequest();
      // Same ordering and chunk size the Admin page always used, so its
      // client-side paging loop keeps stable page boundaries.
      const { data, error } = await db
        .from("visit_logs")
        .select("*")
        .order("visited_at", { ascending: false })
        .order("id", { ascending: false })
        .range(offset, offset + VISITS_CHUNK - 1);
      if (error) return dbError(body.action, error.message);
      return json({ ok: true, data: data ?? [] });
    }

    case "visits.delete": {
      const ids = body.ids;
      if (!Array.isArray(ids) || ids.length === 0 || ids.length > MAX_DELETE_IDS || !ids.every(isUuid)) {
        return badRequest();
      }
      const { error } = await db.from("visit_logs").delete().in("id", ids);
      if (error) return dbError(body.action, error.message);
      return json({ ok: true });
    }

    case "comments.pending": {
      const { data, error } = await db
        .from("portfolio_comments")
        .select("id, name, message, reply, created_at")
        .eq("approved", false)
        .order("created_at", { ascending: false });
      if (error) return dbError(body.action, error.message);
      return json({ ok: true, data: data ?? [] });
    }

    case "comments.approve": {
      if (!isUuid(body.id)) return badRequest();
      const { error } = await db.from("portfolio_comments").update({ approved: true }).eq("id", body.id);
      if (error) return dbError(body.action, error.message);
      return json({ ok: true });
    }

    case "comments.reply": {
      if (!isUuid(body.id) || typeof body.reply !== "string") return badRequest();
      const reply = body.reply.trim();
      if (!reply || reply.length > MAX_REPLY_LENGTH) return badRequest();
      const { error } = await db.from("portfolio_comments").update({ reply }).eq("id", body.id);
      if (error) return dbError(body.action, error.message);
      return json({ ok: true });
    }

    case "comments.delete": {
      if (!isUuid(body.id)) return badRequest();
      const { error } = await db.from("portfolio_comments").delete().eq("id", body.id);
      if (error) return dbError(body.action, error.message);
      return json({ ok: true });
    }

    case "songs.pending": {
      const { data, error } = await db
        .from("melodic_song_requests")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) return dbError(body.action, error.message);
      return json({ ok: true, data: data ?? [] });
    }

    case "songs.approve": {
      if (!isUuid(body.id) || typeof body.raagaId !== "string" || !RAAGA_ID_RE.test(body.raagaId)) {
        return badRequest();
      }
      const { error } = await db
        .from("melodic_song_requests")
        .update({ status: "approved", raaga_id: body.raagaId })
        .eq("id", body.id);
      if (error) return dbError(body.action, error.message);
      return json({ ok: true });
    }

    case "songs.reject": {
      if (!isUuid(body.id)) return badRequest();
      const { error } = await db.from("melodic_song_requests").update({ status: "rejected" }).eq("id", body.id);
      if (error) return dbError(body.action, error.message);
      return json({ ok: true });
    }

    default:
      return badRequest();
  }
}
