import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { verifyMasterCode } from "./masterCode";
import verifyMasterCodeHandler from "../../api/verify-master-code";
import { OWNER_COOKIE_NAME, verifyOwnerCookieValue } from "../../api/_lib/ownerCookie";

describe("api/verify-master-code handler — the only place the real code is compared", () => {
  afterEach(() => vi.unstubAllEnvs());

  function postRequest(body: unknown) {
    return new Request("http://localhost/api/verify-master-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  it("returns valid:true for the correct code", async () => {
    vi.stubEnv("PORTFOLIO_MASTER_CODE", "TESTCODE");
    const res = await verifyMasterCodeHandler(postRequest({ code: "TESTCODE" }));
    expect(await res.json()).toEqual({ valid: true });
  });

  it("returns valid:false for an incorrect code", async () => {
    vi.stubEnv("PORTFOLIO_MASTER_CODE", "TESTCODE");
    const res = await verifyMasterCodeHandler(postRequest({ code: "WRONG" }));
    expect(await res.json()).toEqual({ valid: false });
  });

  it("returns valid:false when the env var isn't configured", async () => {
    vi.stubEnv("PORTFOLIO_MASTER_CODE", "");
    const res = await verifyMasterCodeHandler(postRequest({ code: "TESTCODE" }));
    expect(await res.json()).toEqual({ valid: false });
  });

  it("rejects non-POST methods", async () => {
    vi.stubEnv("PORTFOLIO_MASTER_CODE", "TESTCODE");
    const res = await verifyMasterCodeHandler(new Request("http://localhost/api/verify-master-code", { method: "GET" }));
    expect(res.status).toBe(405);
    expect(await res.json()).toEqual({ valid: false });
  });

  it("returns valid:false for a malformed body instead of throwing", async () => {
    vi.stubEnv("PORTFOLIO_MASTER_CODE", "TESTCODE");
    const res = await verifyMasterCodeHandler(
      new Request("http://localhost/api/verify-master-code", { method: "POST", body: "not json" })
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ valid: false });
  });

  // A successful master-code verification is now also the mechanism that
  // establishes the authoritative server owner session — every UI entry
  // point (PageGate, Tracker, Comments, MelodicFramework) shares this one
  // endpoint, so this is the single place that needs to prove the cookie
  // gets set correctly for all four to inherit it.
  describe("owner cookie establishment", () => {
    it("sets a valid, verifiable owner cookie when the code is correct and the owner token is configured", async () => {
      vi.stubEnv("PORTFOLIO_MASTER_CODE", "TESTCODE");
      vi.stubEnv("PORTFOLIO_OWNER_TOKEN", "OWNERTOKEN123");

      const res = await verifyMasterCodeHandler(postRequest({ code: "TESTCODE" }));

      expect(await res.json()).toEqual({ valid: true });
      const setCookie = res.headers.get("Set-Cookie");
      expect(setCookie).toBeTruthy();
      expect(setCookie).toContain(`${OWNER_COOKIE_NAME}=`);
      expect(setCookie).toContain("HttpOnly");
      expect(setCookie).toContain("Secure");
      expect(setCookie).toContain("SameSite=Strict");

      const cookieValue = decodeURIComponent(setCookie!.split(";")[0].split("=")[1]);
      expect(await verifyOwnerCookieValue(cookieValue, "OWNERTOKEN123")).toBe(true);
      // Signed with the wrong secret must not verify — proves the cookie is
      // actually bound to PORTFOLIO_OWNER_TOKEN, not just any fixed string.
      expect(await verifyOwnerCookieValue(cookieValue, "WRONG")).toBe(false);
    });

    it("does not set a cookie when the code is incorrect", async () => {
      vi.stubEnv("PORTFOLIO_MASTER_CODE", "TESTCODE");
      vi.stubEnv("PORTFOLIO_OWNER_TOKEN", "OWNERTOKEN123");

      const res = await verifyMasterCodeHandler(postRequest({ code: "WRONG" }));

      expect(await res.json()).toEqual({ valid: false });
      expect(res.headers.get("Set-Cookie")).toBeNull();
    });

    it("does not set a cookie (and does not throw) when PORTFOLIO_OWNER_TOKEN isn't configured, even for a correct code", async () => {
      vi.stubEnv("PORTFOLIO_MASTER_CODE", "TESTCODE");
      vi.stubEnv("PORTFOLIO_OWNER_TOKEN", "");

      const res = await verifyMasterCodeHandler(postRequest({ code: "TESTCODE" }));

      expect(await res.json()).toEqual({ valid: true });
      expect(res.headers.get("Set-Cookie")).toBeNull();
    });
  });
});

describe("verifyMasterCode — client helper", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("resolves true when the server confirms the code is valid", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ valid: true }) });
    await expect(verifyMasterCode("TESTCODE")).resolves.toBe(true);
  });

  it("resolves false when the server rejects the code", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ valid: false }) });
    await expect(verifyMasterCode("WRONG")).resolves.toBe(false);
  });

  it("fails closed (false) on a non-ok response", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, json: () => Promise.resolve({ valid: true }) });
    await expect(verifyMasterCode("TESTCODE")).resolves.toBe(false);
  });

  it("fails closed (false) on a network error", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("network down"));
    await expect(verifyMasterCode("TESTCODE")).resolves.toBe(false);
  });
});
