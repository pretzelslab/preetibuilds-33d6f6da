export const config = { runtime: "edge" };

import { isOwnerRequest } from "./_lib/ownerCookie.js";
import { getAdminDb } from "./_lib/adminDb.js";
import { editTokenMatches, generateEditToken, hashEditToken } from "./_lib/editToken.js";

// Client Workbook comment threads. The workbook is used by clients and
// collaborators (page-code holders), not only the owner, so this is NOT behind
// the owner-only /api/admin.
//
// Access model:
// - Read/add: anyone holding the thread's client_id + page_id. client_id is an
//   unguessable crypto.randomUUID() kept in the workbook user's browser — the
//   same capability-token model the workbook has always used.
// - Edit/delete: the browser that created the comment (it holds that
//   comment's edit token; only the token's SHA-256 is stored), or the owner
//   (signed pl_owner cookie). Comments created before edit tokens existed
//   have no hash and are owner-only.
//
// The table is reached only with the service-role key (api/_lib/adminDb.ts);
// anon has no grants once supabase/workbook-comments-lockdown.sql is applied.
// Responses never include client_id, page_id or edit_token_hash.

const CLIENT_ID_RE = /^[A-Za-z0-9_-]{1,100}$/;
const PAGE_ID_RE = /^[A-Za-z0-9_.-]{1,160}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_BODY_LENGTH = 4000;
// Only these columns are ever selected for return to a client.
const PUBLIC_COLUMNS = "id, body, created_at, updated_at";

type Thread = { clientId: string; pageId: string };
type WorkbookBody =
  | ({ action: "list" } & Thread)
  | ({ action: "add"; body: string } & Thread)
  | ({ action: "edit"; id: string; body: string; editToken?: string } & Thread)
  | ({ action: "delete"; id: string; editToken?: string } & Thread);

type Row = { id: string; body: string; created_at: string; updated_at: string };

function toPublic(r: Row) {
  return { id: r.id, text: r.body, createdAt: r.created_at, updatedAt: r.updated_at };
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

const badRequest = () => json({ ok: false, error: "bad-request" }, 400);

function dbError(action: string, message: string): Response {
  console.error(`[workbook-comments ${action} failed]`, message);
  return json({ ok: false, error: "db-error" }, 502);
}

function cleanBody(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t && t.length <= MAX_BODY_LENGTH ? t : null;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") return json({ ok: false, error: "method-not-allowed" }, 405);

  let body: WorkbookBody;
  try {
    body = await req.json();
  } catch {
    return badRequest();
  }
  if (
    !body ||
    typeof body !== "object" ||
    typeof body.clientId !== "string" ||
    !CLIENT_ID_RE.test(body.clientId) ||
    typeof body.pageId !== "string" ||
    !PAGE_ID_RE.test(body.pageId)
  ) {
    return badRequest();
  }
  const { clientId, pageId } = body;

  const db = getAdminDb();
  if (!db) {
    console.error("[workbook-comments] GOV_SUPABASE_SERVICE_ROLE_KEY or VITE_GOV_SUPABASE_URL not configured");
    return json({ ok: false, error: "not-configured" }, 503);
  }

  const isOwner = await isOwnerRequest(req, process.env.PORTFOLIO_OWNER_TOKEN);

  switch (body.action) {
    case "list": {
      const { data, error } = await db
        .from("workbook_comments")
        .select(PUBLIC_COLUMNS)
        .eq("client_id", clientId)
        .eq("page_id", pageId)
        .order("created_at", { ascending: true });
      if (error) return dbError(body.action, error.message);
      // isOwner lets the UI offer edit/delete on every comment (including
      // legacy ones); the server re-checks on every write regardless.
      return json({ ok: true, comments: ((data ?? []) as Row[]).map(toPublic), isOwner });
    }

    case "add": {
      const text = cleanBody(body.body);
      if (!text) return badRequest();
      const editToken = generateEditToken();
      const { data, error } = await db
        .from("workbook_comments")
        .insert({ client_id: clientId, page_id: pageId, body: text, edit_token_hash: await hashEditToken(editToken) })
        .select(PUBLIC_COLUMNS)
        .single();
      if (error) return dbError(body.action, error.message);
      // The only time the raw token ever leaves the server.
      return json({ ok: true, comment: toPublic(data as Row), editToken });
    }

    case "edit":
    case "delete": {
      if (typeof body.id !== "string" || !UUID_RE.test(body.id)) return badRequest();
      const text = body.action === "edit" ? cleanBody(body.body) : null;
      if (body.action === "edit" && !text) return badRequest();

      // Scope the lookup to the caller's thread so an id from another thread
      // is indistinguishable from a missing one.
      const { data: existing, error: lookupError } = await db
        .from("workbook_comments")
        .select("id, edit_token_hash")
        .eq("id", body.id)
        .eq("client_id", clientId)
        .eq("page_id", pageId)
        .maybeSingle();
      if (lookupError) return dbError(body.action, lookupError.message);
      if (!existing) return json({ ok: false, error: "not-found" }, 404);

      const allowed =
        isOwner || (await editTokenMatches(body.editToken, (existing as { edit_token_hash: string | null }).edit_token_hash));
      if (!allowed) return json({ ok: false, error: "forbidden" }, 403);

      if (body.action === "delete") {
        const { error } = await db
          .from("workbook_comments")
          .delete()
          .eq("id", body.id)
          .eq("client_id", clientId)
          .eq("page_id", pageId);
        if (error) return dbError(body.action, error.message);
        return json({ ok: true });
      }

      const { data, error } = await db
        .from("workbook_comments")
        .update({ body: text, updated_at: new Date().toISOString() })
        .eq("id", body.id)
        .eq("client_id", clientId)
        .eq("page_id", pageId)
        .select(PUBLIC_COLUMNS)
        .single();
      if (error) return dbError(body.action, error.message);
      return json({ ok: true, comment: toPublic(data as Row) });
    }

    default:
      return badRequest();
  }
}
