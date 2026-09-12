import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createClient } from "@supabase/supabase-js";
import handler from "../../../api/portfolio-analytics";
import { OWNER_COOKIE_NAME, signOwnerCookieValue } from "../../../api/_lib/ownerCookie";

vi.mock("@supabase/supabase-js", () => ({ createClient: vi.fn() }));

function mockGovDb() {
  const insertSingle = vi.fn().mockResolvedValue({ data: { id: "new-row-id" }, error: null });
  const insertSelect = vi.fn().mockReturnValue({ single: insertSingle });
  const insert = vi.fn().mockReturnValue({ select: insertSelect });
  const deleteEq = vi.fn().mockResolvedValue({ error: null });
  const del = vi.fn().mockReturnValue({ eq: deleteEq });
  const rpc = vi.fn().mockResolvedValue({ error: null });
  const single = vi.fn().mockResolvedValue({ data: { count: 7 } });
  const eq = vi.fn().mockReturnValue({ single });
  const select = vi.fn().mockReturnValue({ eq });
  const from = vi.fn((table: string) => {
    if (table === "visit_logs") return { insert, delete: del };
    if (table === "page_views") return { select };
    throw new Error(`unexpected table: ${table}`);
  });
  (createClient as ReturnType<typeof vi.fn>).mockReturnValue({ from, rpc });
  return { insert, insertSelect, insertSingle, del, deleteEq, rpc, select, eq, single };
}

function postRequest(body: unknown, cookie?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (cookie) headers["Cookie"] = cookie;
  return new Request("http://localhost/api/portfolio-analytics", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    // Attach real geo headers too, to prove they're read and attached.
  });
}

async function ownerCookieHeader(secret = "OWNERTOKEN") {
  const value = await signOwnerCookieValue(secret);
  return `${OWNER_COOKIE_NAME}=${encodeURIComponent(value)}`;
}

describe("api/portfolio-analytics — the one authoritative analytics write gate", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_GOV_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("VITE_GOV_SUPABASE_ANON_KEY", "anon-key");
    vi.stubEnv("PORTFOLIO_OWNER_TOKEN", "OWNERTOKEN");
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("rejects non-POST methods", async () => {
    const res = await handler(new Request("http://localhost/api/portfolio-analytics", { method: "GET" }));
    expect(res.status).toBe(405);
    expect(await res.json()).toEqual({ recorded: false, reason: "error" });
  });

  it("rejects a malformed JSON body", async () => {
    const res = await handler(
      new Request("http://localhost/api/portfolio-analytics", { method: "POST", body: "not json" })
    );
    expect(res.status).toBe(400);
  });

  it("rejects a body missing page/kind", async () => {
    const res = await handler(postRequest({ kind: "visit" }));
    expect(res.status).toBe(400);
  });

  it("rejects an unrecognized kind", async () => {
    const res = await handler(postRequest({ kind: "something-else", page: "/x" }));
    expect(res.status).toBe(400);
  });

  describe("kind: visit", () => {
    it("owner cookie present — does NOT insert, returns recorded:false reason:owner", async () => {
      const { insert } = mockGovDb();
      const cookie = await ownerCookieHeader();

      const res = await handler(postRequest({ kind: "visit", page: "/carbon-fairness" }, cookie));

      expect(await res.json()).toEqual({ recorded: false, reason: "owner" });
      expect(insert).not.toHaveBeenCalled();
    });

    it("no cookie — inserts into visit_logs and returns recorded:true with the new row's id", async () => {
      const { insert } = mockGovDb();

      const res = await handler(
        postRequest({ kind: "visit", page: "/carbon-fairness", referrer: "https://google.com", userAgent: "TestAgent/1.0" })
      );

      expect(await res.json()).toEqual({ recorded: true, id: "new-row-id" });
      expect(insert).toHaveBeenCalledWith(
        expect.objectContaining({ page: "/carbon-fairness", referrer: "https://google.com", user_agent: "TestAgent/1.0" })
      );
    });

    it("tampered cookie — treated as a normal visitor, insert happens", async () => {
      const { insert } = mockGovDb();

      const res = await handler(
        postRequest({ kind: "visit", page: "/x" }, `${OWNER_COOKIE_NAME}=not-a-valid-signed-value`)
      );

      expect(await res.json()).toEqual({ recorded: true, id: "new-row-id" });
      expect(insert).toHaveBeenCalledTimes(1);
    });

    it("reads geo from the request's own Vercel headers and attaches them to the insert", async () => {
      const { insert } = mockGovDb();
      const headers = new Headers({ "Content-Type": "application/json" });
      headers.set("x-vercel-ip-country", "US");
      headers.set("x-vercel-ip-country-region", "TX");
      headers.set("x-vercel-ip-city", "Austin");

      await handler(
        new Request("http://localhost/api/portfolio-analytics", {
          method: "POST",
          headers,
          body: JSON.stringify({ kind: "visit", page: "/x" }),
        })
      );

      expect(insert).toHaveBeenCalledWith(
        expect.objectContaining({ city: "Austin", region: "TX", country: "US" })
      );
    });

    it("insert failure returns recorded:false reason:error, 502", async () => {
      const { insertSingle } = mockGovDb();
      insertSingle.mockResolvedValue({ data: null, error: { message: "boom" } });

      const res = await handler(postRequest({ kind: "visit", page: "/x" }));

      expect(res.status).toBe(502);
      expect(await res.json()).toEqual({ recorded: false, reason: "error" });
    });
  });

  // Covers the gap found 2026-09-12: a protected page's useVisitLogger call
  // always runs on mount, before the visitor can possibly have entered the
  // master code (PageGate only controls what JSX renders, not which hooks
  // already fired earlier in the same render). retractPendingVisit() (see
  // src/hooks/useVisitLogger.ts) calls this endpoint right after the browser
  // becomes provably the owner, to delete exactly that one row.
  describe("kind: retract", () => {
    it("rejects a missing/empty id", async () => {
      const { del } = mockGovDb();
      const cookie = await ownerCookieHeader();

      const res = await handler(postRequest({ kind: "retract" }, cookie));

      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ retracted: false, reason: "error" });
      expect(del).not.toHaveBeenCalled();
    });

    it("no owner cookie — refuses, deletes nothing", async () => {
      const { del } = mockGovDb();

      const res = await handler(postRequest({ kind: "retract", id: "row-1" }));

      expect(await res.json()).toEqual({ retracted: false, reason: "not-owner" });
      expect(del).not.toHaveBeenCalled();
    });

    it("tampered cookie — refuses, deletes nothing", async () => {
      const { del } = mockGovDb();

      const res = await handler(
        postRequest({ kind: "retract", id: "row-1" }, `${OWNER_COOKIE_NAME}=not-a-valid-signed-value`)
      );

      expect(await res.json()).toEqual({ retracted: false, reason: "not-owner" });
      expect(del).not.toHaveBeenCalled();
    });

    it("valid owner cookie — deletes exactly the given id, returns retracted:true", async () => {
      const { del, deleteEq } = mockGovDb();
      const cookie = await ownerCookieHeader();

      const res = await handler(postRequest({ kind: "retract", id: "row-1" }, cookie));

      expect(await res.json()).toEqual({ retracted: true });
      expect(del).toHaveBeenCalledTimes(1);
      expect(deleteEq).toHaveBeenCalledWith("id", "row-1");
    });

    it("delete failure returns retracted:false reason:error, 502", async () => {
      const { deleteEq } = mockGovDb();
      deleteEq.mockResolvedValue({ error: { message: "boom" } });
      const cookie = await ownerCookieHeader();

      const res = await handler(postRequest({ kind: "retract", id: "row-1" }, cookie));

      expect(res.status).toBe(502);
      expect(await res.json()).toEqual({ retracted: false, reason: "error" });
    });
  });

  describe("kind: pageview", () => {
    it("owner cookie present — does NOT call the RPC, still returns the current count", async () => {
      const { rpc, single } = mockGovDb();
      const cookie = await ownerCookieHeader();

      const res = await handler(postRequest({ kind: "pageview", page: "/melodic-framework", increment: true }, cookie));

      expect(await res.json()).toEqual({ recorded: false, reason: "owner", count: 7 });
      expect(rpc).not.toHaveBeenCalled();
      expect(single).toHaveBeenCalled();
    });

    it("visitor, increment:true — calls the RPC and returns recorded:true with the fresh count", async () => {
      const { rpc } = mockGovDb();

      const res = await handler(postRequest({ kind: "pageview", page: "/melodic-framework", increment: true }));

      expect(rpc).toHaveBeenCalledWith("increment_page_view", { p_page: "/melodic-framework" });
      expect(await res.json()).toEqual({ recorded: true, count: 7 });
    });

    it("visitor, increment:false — does NOT call the RPC, still returns the current count", async () => {
      const { rpc } = mockGovDb();

      const res = await handler(postRequest({ kind: "pageview", page: "/melodic-framework", increment: false }));

      expect(rpc).not.toHaveBeenCalled();
      expect(await res.json()).toEqual({ recorded: false, count: 7 });
    });

    it("RPC failure returns recorded:false reason:error, 502, but still attempts to return a count", async () => {
      const { rpc } = mockGovDb();
      rpc.mockResolvedValue({ error: { message: "boom" } });

      const res = await handler(postRequest({ kind: "pageview", page: "/x", increment: true }));

      expect(res.status).toBe(502);
      expect(await res.json()).toEqual({ recorded: false, reason: "error", count: 7 });
    });
  });
});
