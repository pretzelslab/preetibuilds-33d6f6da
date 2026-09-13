import { describe, it, expect, vi, afterEach } from "vitest";
import verifyMasterCodeHandler from "../../api/verify-master-code";
import { OWNER_COOKIE_NAME, verifyOwnerCookieValue } from "../../api/_lib/ownerCookie";

// Regression cover for the production owner-login failure of 2026-09-13.
//
// api/verify-master-code.ts compares the submitted code to
// PORTFOLIO_MASTER_CODE with constantTimeEqual() — exact bytes, no trim, no
// case folding. Three of the five UI entry points (Owner, PageGate, Tracker)
// used to uppercase and trim the input before sending it, which is correct
// for human-friendly PAGE codes but silently made any mixed-case master code
// impossible to authenticate with. These tests pin the server contract that
// the client must respect: the secret travels exactly as entered.
//
// THROWAWAY fixture value — generated for this test only, has never been a
// real PORTFOLIO_MASTER_CODE. Deliberately contains uppercase, lowercase and
// digits so that uppercasing AND lowercasing both mutate it.
const MIXED_CASE_SECRET = "Tz7Kq4Mx9Rb2Wv";
const OWNER_TOKEN = "throwaway-owner-token";

describe("master code is compared byte-for-byte (case- and whitespace-sensitive)", () => {
  afterEach(() => vi.unstubAllEnvs());

  function post(code: unknown) {
    return new Request("http://localhost/api/verify-master-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
  }

  function withSecret() {
    vi.stubEnv("PORTFOLIO_MASTER_CODE", MIXED_CASE_SECRET);
    vi.stubEnv("PORTFOLIO_OWNER_TOKEN", OWNER_TOKEN);
  }

  // Guards the fixture itself: if this ever stopped holding, the mutation
  // tests below would be comparing a value against itself and pass vacuously.
  it("fixture sanity: the test secret is genuinely mixed case", () => {
    expect(MIXED_CASE_SECRET.toUpperCase()).not.toBe(MIXED_CASE_SECRET);
    expect(MIXED_CASE_SECRET.toLowerCase()).not.toBe(MIXED_CASE_SECRET);
  });

  it("(a) accepts the exact mixed-case master code", async () => {
    withSecret();
    const res = await verifyMasterCodeHandler(post(MIXED_CASE_SECRET));
    expect(await res.json()).toEqual({ valid: true });
  });

  it("(b) rejects the same characters uppercased — the old client mutation", async () => {
    withSecret();
    const res = await verifyMasterCodeHandler(post(MIXED_CASE_SECRET.toUpperCase()));
    expect(await res.json()).toEqual({ valid: false });
  });

  it("(c) rejects the same characters lowercased", async () => {
    withSecret();
    const res = await verifyMasterCodeHandler(post(MIXED_CASE_SECRET.toLowerCase()));
    expect(await res.json()).toEqual({ valid: false });
  });

  it("(d) rejects an incorrect code", async () => {
    withSecret();
    const res = await verifyMasterCodeHandler(post("nOtTheCode42"));
    expect(await res.json()).toEqual({ valid: false });
  });

  // Not a demand that the server start trimming — the opposite. This documents
  // that surrounding whitespace is significant on BOTH sides, which is why the
  // env var must be stored without a stray space or trailing newline.
  it("rejects the correct code with surrounding whitespace", async () => {
    withSecret();
    const res = await verifyMasterCodeHandler(post(` ${MIXED_CASE_SECRET} `));
    expect(await res.json()).toEqual({ valid: false });
  });

  it("(e) a failed verification mints no owner cookie", async () => {
    withSecret();
    for (const attempt of [
      MIXED_CASE_SECRET.toUpperCase(),
      MIXED_CASE_SECRET.toLowerCase(),
      "nOtTheCode42",
    ]) {
      const res = await verifyMasterCodeHandler(post(attempt));
      expect(await res.json()).toEqual({ valid: false });
      expect(res.headers.get("Set-Cookie")).toBeNull();
    }
  });

  it("(f) a successful verification mints a verifiable owner session", async () => {
    withSecret();
    const res = await verifyMasterCodeHandler(post(MIXED_CASE_SECRET));

    expect(await res.json()).toEqual({ valid: true });
    const setCookie = res.headers.get("Set-Cookie");
    expect(setCookie).toContain(`${OWNER_COOKIE_NAME}=`);
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("Secure");
    expect(setCookie).toContain("SameSite=Strict");

    const cookieValue = decodeURIComponent(setCookie!.split(";")[0].split("=")[1]);
    expect(await verifyOwnerCookieValue(cookieValue, OWNER_TOKEN)).toBe(true);
    expect(await verifyOwnerCookieValue(cookieValue, "wrong-token")).toBe(false);
  });
});
