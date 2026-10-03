import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createClient } from "@supabase/supabase-js";
import handler from "../../../api/admin";
import { OWNER_COOKIE_NAME, signOwnerCookieValue } from "../../../api/_lib/ownerCookie";

vi.mock("@supabase/supabase-js", () => ({ createClient: vi.fn() }));

const ID = "3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b";
const ID2 = "7a6b5c4d-3e2f-4a1b-9c8d-7e6f5a4b3c2d";

// Chainable query-builder stub: every builder method returns the same object,
// and awaiting it resolves to `result`. Records each call for assertions.
function mockDb(result: { data?: unknown; error: { message: string } | null } = { data: [], error: null }) {
  const calls: Array<[string, unknown[]]> = [];
  const builder: Record<string, unknown> = {};
  for (const m of ["select", "eq", "in", "order", "range", "update", "delete"]) {
    builder[m] = vi.fn((...args: unknown[]) => { calls.push([m, args]); return builder; });
  }
  builder.then = (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve);
  const from = vi.fn((table: string) => { calls.push(["from", [table]]); return builder; });
  (createClient as ReturnType<typeof vi.fn>).mockReturnValue({ from });
  return { from, calls, builder };
}

async function ownerCookie(secret = "OWNERTOKEN") {
  const value = await signOwnerCookieValue(secret);
  return `${OWNER_COOKIE_NAME}=${encodeURIComponent(value)}`;
}

function post(body: unknown, cookie?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (cookie) headers.Cookie = cookie;
  return new Request("http://localhost/api/admin", {
    method: "POST",
    headers,
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("api/admin — owner-only admin actions", () => {
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

  describe("authorization", () => {
    it("rejects non-POST methods", async () => {
      const res = await handler(new Request("http://localhost/api/admin", { method: "GET" }));
      expect(res.status).toBe(405);
    });

    it("no cookie → 401 master-code-required, never touches the database", async () => {
      mockDb();
      const res = await handler(post({ action: "visits.list" }));
      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ ok: false, error: "master-code-required" });
      expect(createClient).not.toHaveBeenCalled();
    });

    it("cookie signed with the wrong secret → 401", async () => {
      mockDb();
      const res = await handler(post({ action: "visits.list" }, await ownerCookie("SOMEONE-ELSE")));
      expect(res.status).toBe(401);
      expect(createClient).not.toHaveBeenCalled();
    });

    it("tampered cookie → 401", async () => {
      mockDb();
      const res = await handler(post({ action: "visits.list" }, `${OWNER_COOKIE_NAME}=123.deadbeef`));
      expect(res.status).toBe(401);
    });

    it("owner token not configured → 401 even with a cookie (fails closed)", async () => {
      const cookie = await ownerCookie();
      vi.stubEnv("PORTFOLIO_OWNER_TOKEN", "");
      mockDb();
      const res = await handler(post({ action: "visits.list" }, cookie));
      expect(res.status).toBe(401);
    });

    it("service-role key missing → 503, no anon-key fallback", async () => {
      vi.stubEnv("GOV_SUPABASE_SERVICE_ROLE_KEY", "");
      mockDb();
      const res = await handler(post({ action: "visits.list" }, await ownerCookie()));
      expect(res.status).toBe(503);
      expect(createClient).not.toHaveBeenCalled();
    });

    it("uses the service-role key for its client", async () => {
      mockDb();
      await handler(post({ action: "visits.list" }, await ownerCookie()));
      expect(createClient).toHaveBeenCalledWith("https://example.supabase.co", "service-role-key", expect.anything());
    });

    it("responses are never cached", async () => {
      mockDb();
      const res = await handler(post({ action: "visits.list" }, await ownerCookie()));
      expect(res.headers.get("Cache-Control")).toBe("no-store");
    });
  });

  describe("input validation (owner session present)", () => {
    const bad: Array<[string, unknown]> = [
      ["malformed JSON", "{not json"],
      ["missing action", { foo: 1 }],
      ["unknown action", { action: "visits.truncate" }],
      ["negative offset", { action: "visits.list", offset: -1 }],
      ["fractional offset", { action: "visits.list", offset: 1.5 }],
      ["empty ids", { action: "visits.delete", ids: [] }],
      ["non-uuid id in ids", { action: "visits.delete", ids: [ID, "1 or 1=1"] }],
      ["too many ids", { action: "visits.delete", ids: Array(1001).fill(ID) }],
      ["approve non-uuid", { action: "comments.approve", id: "abc" }],
      ["reply blank", { action: "comments.reply", id: ID, reply: "   " }],
      ["reply too long", { action: "comments.reply", id: ID, reply: "x".repeat(1001) }],
      ["reply not a string", { action: "comments.reply", id: ID, reply: 5 }],
      ["delete comment non-uuid", { action: "comments.delete", id: 42 }],
      ["song approve bad raaga id", { action: "songs.approve", id: ID, raagaId: "../etc" }],
      ["song reject non-uuid", { action: "songs.reject", id: "" }],
    ];
    for (const [label, body] of bad) {
      it(`${label} → 400, no write`, async () => {
        const { calls } = mockDb();
        const res = await handler(post(body, await ownerCookie()));
        expect(res.status).toBe(400);
        expect(calls.some(([m]) => m === "update" || m === "delete")).toBe(false);
      });
    }
  });

  describe("visits", () => {
    it("visits.list returns one ordered chunk starting at the given offset", async () => {
      const rows = [{ id: ID, page: "/" }];
      const { calls } = mockDb({ data: rows, error: null });
      const res = await handler(post({ action: "visits.list", offset: 1000 }, await ownerCookie()));
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ ok: true, data: rows });
      expect(calls).toContainEqual(["from", ["visit_logs"]]);
      expect(calls).toContainEqual(["order", ["visited_at", { ascending: false }]]);
      expect(calls).toContainEqual(["range", [1000, 1999]]);
    });

    it("visits.delete deletes exactly the given ids", async () => {
      const { calls } = mockDb({ error: null });
      const res = await handler(post({ action: "visits.delete", ids: [ID, ID2] }, await ownerCookie()));
      expect(res.status).toBe(200);
      expect(calls).toContainEqual(["delete", []]);
      expect(calls).toContainEqual(["in", ["id", [ID, ID2]]]);
    });

    it("database error → 502 without leaking the message", async () => {
      mockDb({ data: null, error: { message: "secret internals" } });
      const res = await handler(post({ action: "visits.list" }, await ownerCookie()));
      expect(res.status).toBe(502);
      expect(await res.json()).toEqual({ ok: false, error: "db-error" });
    });
  });

  describe("portfolio comments", () => {
    it("comments.pending reads only unapproved rows", async () => {
      const { calls } = mockDb({ data: [], error: null });
      await handler(post({ action: "comments.pending" }, await ownerCookie()));
      expect(calls).toContainEqual(["from", ["portfolio_comments"]]);
      expect(calls).toContainEqual(["eq", ["approved", false]]);
    });

    it("comments.approve sets approved:true on that id", async () => {
      const { calls } = mockDb({ error: null });
      const res = await handler(post({ action: "comments.approve", id: ID }, await ownerCookie()));
      expect(res.status).toBe(200);
      expect(calls).toContainEqual(["update", [{ approved: true }]]);
      expect(calls).toContainEqual(["eq", ["id", ID]]);
    });

    it("comments.reply stores the trimmed reply", async () => {
      const { calls } = mockDb({ error: null });
      await handler(post({ action: "comments.reply", id: ID, reply: "  thanks!  " }, await ownerCookie()));
      expect(calls).toContainEqual(["update", [{ reply: "thanks!" }]]);
    });

    it("comments.delete deletes that id", async () => {
      const { calls } = mockDb({ error: null });
      await handler(post({ action: "comments.delete", id: ID }, await ownerCookie()));
      expect(calls).toContainEqual(["delete", []]);
      expect(calls).toContainEqual(["eq", ["id", ID]]);
    });
  });

  describe("melodic song requests", () => {
    it("songs.pending reads only pending rows", async () => {
      const { calls } = mockDb({ data: [], error: null });
      await handler(post({ action: "songs.pending" }, await ownerCookie()));
      expect(calls).toContainEqual(["from", ["melodic_song_requests"]]);
      expect(calls).toContainEqual(["eq", ["status", "pending"]]);
    });

    it("songs.approve sets status + raaga_id", async () => {
      const { calls } = mockDb({ error: null });
      await handler(post({ action: "songs.approve", id: ID, raagaId: "ahir-bhairav" }, await ownerCookie()));
      expect(calls).toContainEqual(["update", [{ status: "approved", raaga_id: "ahir-bhairav" }]]);
      expect(calls).toContainEqual(["eq", ["id", ID]]);
    });

    it("songs.reject sets status rejected", async () => {
      const { calls } = mockDb({ error: null });
      await handler(post({ action: "songs.reject", id: ID }, await ownerCookie()));
      expect(calls).toContainEqual(["update", [{ status: "rejected" }]]);
    });
  });
});
