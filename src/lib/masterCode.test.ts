import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { verifyMasterCode } from "./masterCode";
import verifyMasterCodeHandler from "../../api/verify-master-code";

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
