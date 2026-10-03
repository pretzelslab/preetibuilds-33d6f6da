import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createClient } from "@supabase/supabase-js";
import handler from "../../../api/workbook-comments";
import { OWNER_COOKIE_NAME, signOwnerCookieValue } from "../../../api/_lib/ownerCookie";
import { hashEditToken, generateEditToken } from "../../../api/_lib/editToken";

vi.mock("@supabase/supabase-js", () => ({ createClient: vi.fn() }));

const CLIENT = "0d9c8b7a-6f5e-4d3c-2b1a-0f9e8d7c6b5a";
const PAGE = "phase1-govern-system-identity";
const ID = "3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b";
const ROW = { id: ID, body: "hello", created_at: "2026-10-01T00:00:00Z", updated_at: "2026-10-01T00:00:00Z" };

type Result = { data?: unknown; error: { message: string } | null };

// Chainable builder; each terminal (await / single / maybeSingle) consumes the
// next queued result, so a lookup-then-write flow can return different data
// per step. Every builder call is recorded.
function mockDb(...results: Result[]) {
  const queue = [...results];
  const next = () => Promise.resolve(queue.shift() ?? { data: null, error: null });
  const calls: Array<[string, unknown[]]> = [];
  const builder: Record<string, unknown> = {};
  for (const m of ["select", "eq", "order", "insert", "update", "delete"]) {
    builder[m] = vi.fn((...args: unknown[]) => { calls.push([m, args]); return builder; });
  }
  builder.single = vi.fn(() => { calls.push(["single", []]); return next(); });
  builder.maybeSingle = vi.fn(() => { calls.push(["maybeSingle", []]); return next(); });
  builder.then = (resolve: (v: unknown) => unknown) => next().then(resolve);
  const from = vi.fn((table: string) => { calls.push(["from", [table]]); return builder; });
  (createClient as ReturnType<typeof vi.fn>).mockReturnValue({ from });
  return { calls };
}

async function ownerCookie() {
  return `${OWNER_COOKIE_NAME}=${encodeURIComponent(await signOwnerCookieValue("OWNERTOKEN"))}`;
}

function post(body: unknown, cookie?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (cookie) headers.Cookie = cookie;
  return new Request("http://localhost/api/workbook-comments", {
    method: "POST",
    headers,
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const thread = { clientId: CLIENT, pageId: PAGE };
const wasWritten = (calls: Array<[string, unknown[]]>) => calls.some(([m]) => m === "update" || m === "delete");

describe("api/workbook-comments", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_GOV_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("GOV_SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
    vi.stubEnv("PORTFOLIO_OWNER_TOKEN", "OWNERTOKEN");
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    (createClient as ReturnType<typeof vi.fn>).mockReset();
  });

  describe("request validation + configuration", () => {
    it("rejects non-POST", async () => {
      const res = await handler(new Request("http://localhost/api/workbook-comments", { method: "GET" }));
      expect(res.status).toBe(405);
    });

    const bad: Array<[string, unknown]> = [
      ["malformed JSON", "{nope"],
      ["missing clientId", { action: "list", pageId: PAGE }],
      ["bad clientId chars", { action: "list", clientId: "a b;drop", pageId: PAGE }],
      ["bad pageId chars", { action: "list", clientId: CLIENT, pageId: "x/../y" }],
      ["unknown action", { action: "purge", ...thread }],
      ["add blank body", { action: "add", ...thread, body: "   " }],
      ["add body too long", { action: "add", ...thread, body: "x".repeat(4001) }],
      ["edit non-uuid id", { action: "edit", ...thread, id: "1", body: "x" }],
      ["edit blank body", { action: "edit", ...thread, id: ID, body: "" }],
      ["delete non-uuid id", { action: "delete", ...thread, id: "abc" }],
    ];
    for (const [label, body] of bad) {
      it(`${label} → 400`, async () => {
        const { calls } = mockDb();
        const res = await handler(post(body));
        expect(res.status).toBe(400);
        expect(wasWritten(calls)).toBe(false);
      });
    }

    it("service-role key missing → 503, never falls back to anon", async () => {
      vi.stubEnv("GOV_SUPABASE_SERVICE_ROLE_KEY", "");
      mockDb();
      const res = await handler(post({ action: "list", ...thread }));
      expect(res.status).toBe(503);
      expect(createClient).not.toHaveBeenCalled();
    });

    it("uses the service-role key and never caches responses", async () => {
      mockDb({ data: [], error: null });
      const res = await handler(post({ action: "list", ...thread }));
      expect(createClient).toHaveBeenCalledWith("https://example.supabase.co", "service-role-key", expect.anything());
      expect(res.headers.get("Cache-Control")).toBe("no-store");
    });
  });

  describe("list", () => {
    it("scopes to the thread and selects only public columns", async () => {
      const { calls } = mockDb({ data: [ROW], error: null });
      const res = await handler(post({ action: "list", ...thread }));
      expect(calls).toContainEqual(["select", ["id, body, created_at, updated_at"]]);
      expect(calls).toContainEqual(["eq", ["client_id", CLIENT]]);
      expect(calls).toContainEqual(["eq", ["page_id", PAGE]]);
      expect(await res.json()).toEqual({
        ok: true,
        isOwner: false,
        comments: [{ id: ID, text: "hello", createdAt: ROW.created_at, updatedAt: ROW.updated_at }],
      });
    });

    it("never returns client_id, page_id or token fields even if the row had them", async () => {
      mockDb({ data: [{ ...ROW, client_id: CLIENT, page_id: PAGE, edit_token_hash: "abc" }], error: null });
      const text = await (await handler(post({ action: "list", ...thread }))).text();
      expect(text).not.toContain(CLIENT);
      expect(text).not.toMatch(/client_id|clientId|page_id|edit_token|editToken/);
    });

    it("reports isOwner:true with a valid owner cookie", async () => {
      mockDb({ data: [], error: null });
      const res = await handler(post({ action: "list", ...thread }, await ownerCookie()));
      expect((await res.json()).isOwner).toBe(true);
    });
  });

  describe("add", () => {
    it("stores only the SHA-256 of the edit token and returns the raw token once", async () => {
      const { calls } = mockDb({ data: ROW, error: null });
      const res = await handler(post({ action: "add", ...thread, body: "  hello  " }));
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.editToken).toMatch(/^[0-9a-f]{64}$/);
      expect(json.comment).toEqual({ id: ID, text: "hello", createdAt: ROW.created_at, updatedAt: ROW.updated_at });
      const inserted = calls.find(([m]) => m === "insert")![1][0] as Record<string, string>;
      expect(inserted).toMatchObject({ client_id: CLIENT, page_id: PAGE, body: "hello" });
      expect(inserted.edit_token_hash).toBe(await hashEditToken(json.editToken));
      expect(inserted.edit_token_hash).not.toBe(json.editToken);
      expect(JSON.stringify(json)).not.toContain(CLIENT);
    });
  });

  describe("edit / delete authorization", () => {
    let token: string;
    let hash: string;
    beforeEach(async () => {
      token = generateEditToken();
      hash = await hashEditToken(token);
    });

    it("edit with the matching token updates and returns only public fields", async () => {
      const { calls } = mockDb(
        { data: { id: ID, edit_token_hash: hash }, error: null },
        { data: { ...ROW, body: "new" }, error: null }
      );
      const res = await handler(post({ action: "edit", ...thread, id: ID, body: "new", editToken: token }));
      expect(res.status).toBe(200);
      expect((await res.json()).comment.text).toBe("new");
      expect(calls).toContainEqual(["update", [expect.objectContaining({ body: "new" })]]);
    });

    it("edit with a wrong token → 403, nothing written", async () => {
      const { calls } = mockDb({ data: { id: ID, edit_token_hash: hash }, error: null });
      const res = await handler(post({ action: "edit", ...thread, id: ID, body: "x", editToken: generateEditToken() }));
      expect(res.status).toBe(403);
      expect(wasWritten(calls)).toBe(false);
    });

    it("edit with no token → 403", async () => {
      const { calls } = mockDb({ data: { id: ID, edit_token_hash: hash }, error: null });
      const res = await handler(post({ action: "edit", ...thread, id: ID, body: "x" }));
      expect(res.status).toBe(403);
      expect(wasWritten(calls)).toBe(false);
    });

    it("presenting the stored hash itself as the token → 403", async () => {
      mockDb({ data: { id: ID, edit_token_hash: hash }, error: null });
      const res = await handler(post({ action: "delete", ...thread, id: ID, editToken: hash }));
      expect(res.status).toBe(403);
    });

    it("legacy comment (no hash): any token → 403", async () => {
      const { calls } = mockDb({ data: { id: ID, edit_token_hash: null }, error: null });
      const res = await handler(post({ action: "delete", ...thread, id: ID, editToken: token }));
      expect(res.status).toBe(403);
      expect(wasWritten(calls)).toBe(false);
    });

    it("legacy comment: owner can edit", async () => {
      mockDb({ data: { id: ID, edit_token_hash: null }, error: null }, { data: { ...ROW, body: "fixed" }, error: null });
      const res = await handler(post({ action: "edit", ...thread, id: ID, body: "fixed" }, await ownerCookie()));
      expect(res.status).toBe(200);
    });

    it("legacy comment: owner can delete", async () => {
      const { calls } = mockDb({ data: { id: ID, edit_token_hash: null }, error: null }, { error: null });
      const res = await handler(post({ action: "delete", ...thread, id: ID }, await ownerCookie()));
      expect(res.status).toBe(200);
      expect(calls).toContainEqual(["delete", []]);
    });

    it("delete with the matching token deletes, scoped to the thread", async () => {
      const { calls } = mockDb({ data: { id: ID, edit_token_hash: hash }, error: null }, { error: null });
      const res = await handler(post({ action: "delete", ...thread, id: ID, editToken: token }));
      expect(res.status).toBe(200);
      const afterDelete = calls.slice(calls.findIndex(([m]) => m === "delete"));
      expect(afterDelete).toContainEqual(["eq", ["id", ID]]);
      expect(afterDelete).toContainEqual(["eq", ["client_id", CLIENT]]);
    });

    it("id not in the caller's thread → 404 (lookup is thread-scoped), nothing written", async () => {
      const { calls } = mockDb({ data: null, error: null });
      const res = await handler(post({ action: "delete", ...thread, id: ID, editToken: token }, await ownerCookie()));
      expect(res.status).toBe(404);
      expect(calls).toContainEqual(["eq", ["client_id", CLIENT]]);
      expect(calls).toContainEqual(["eq", ["page_id", PAGE]]);
      expect(wasWritten(calls)).toBe(false);
    });

    it("lookup never selects more than id + hash, and the hash is not echoed", async () => {
      const { calls } = mockDb({ data: { id: ID, edit_token_hash: hash }, error: null }, { data: ROW, error: null });
      const res = await handler(post({ action: "edit", ...thread, id: ID, body: "x", editToken: token }));
      expect(calls).toContainEqual(["select", ["id, edit_token_hash"]]);
      expect(await res.text()).not.toContain(hash);
    });
  });
});
