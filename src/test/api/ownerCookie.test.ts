import { describe, it, expect } from "vitest";
import {
  OWNER_COOKIE_NAME,
  constantTimeEqual,
  signOwnerCookieValue,
  verifyOwnerCookieValue,
  isOwnerRequest,
  buildOwnerSetCookie,
} from "../../../api/_lib/ownerCookie";

describe("constantTimeEqual", () => {
  it("returns true for identical strings", () => {
    expect(constantTimeEqual("abc123", "abc123")).toBe(true);
  });
  it("returns false for different strings of the same length", () => {
    expect(constantTimeEqual("abc123", "abc124")).toBe(false);
  });
  it("returns false for different-length strings", () => {
    expect(constantTimeEqual("abc", "abcd")).toBe(false);
  });
  it("returns false comparing against an empty string", () => {
    expect(constantTimeEqual("abc", "")).toBe(false);
  });
});

describe("signOwnerCookieValue / verifyOwnerCookieValue", () => {
  it("a freshly signed value verifies against the same secret", async () => {
    const value = await signOwnerCookieValue("secret-1");
    expect(await verifyOwnerCookieValue(value, "secret-1")).toBe(true);
  });

  it("does not verify against a different secret", async () => {
    const value = await signOwnerCookieValue("secret-1");
    expect(await verifyOwnerCookieValue(value, "secret-2")).toBe(false);
  });

  it("rejects a tampered payload", async () => {
    const value = await signOwnerCookieValue("secret-1");
    const [issuedAt, mac] = value.split(".");
    const tampered = `${Number(issuedAt) + 1}.${mac}`;
    expect(await verifyOwnerCookieValue(tampered, "secret-1")).toBe(false);
  });

  it("rejects a tampered signature", async () => {
    const value = await signOwnerCookieValue("secret-1");
    const [issuedAt, mac] = value.split(".");
    const flippedChar = mac[0] === "a" ? "b" : "a";
    const tampered = `${issuedAt}.${flippedChar}${mac.slice(1)}`;
    expect(await verifyOwnerCookieValue(tampered, "secret-1")).toBe(false);
  });

  it("rejects a malformed value with no separator", async () => {
    expect(await verifyOwnerCookieValue("not-a-valid-cookie-value", "secret-1")).toBe(false);
  });

  it("rejects a non-numeric issued-at segment", async () => {
    expect(await verifyOwnerCookieValue("abc.deadbeef", "secret-1")).toBe(false);
  });
});

describe("isOwnerRequest", () => {
  function requestWithCookie(cookieHeader: string | null): Request {
    const headers = new Headers();
    if (cookieHeader) headers.set("Cookie", cookieHeader);
    return new Request("http://localhost/", { headers });
  }

  it("returns true for a request carrying a validly signed owner cookie", async () => {
    const value = await signOwnerCookieValue("secret-1");
    const req = requestWithCookie(`${OWNER_COOKIE_NAME}=${encodeURIComponent(value)}`);
    expect(await isOwnerRequest(req, "secret-1")).toBe(true);
  });

  it("returns false when no cookie header is present", async () => {
    const req = requestWithCookie(null);
    expect(await isOwnerRequest(req, "secret-1")).toBe(false);
  });

  it("returns false when the owner cookie is absent but other cookies are present", async () => {
    const req = requestWithCookie("some_other_cookie=1; another=2");
    expect(await isOwnerRequest(req, "secret-1")).toBe(false);
  });

  it("returns false for a tampered cookie value", async () => {
    const value = await signOwnerCookieValue("secret-1");
    const req = requestWithCookie(`${OWNER_COOKIE_NAME}=${encodeURIComponent(value)}x`);
    expect(await isOwnerRequest(req, "secret-1")).toBe(false);
  });

  it("fails closed to false when the signing secret is not configured", async () => {
    const value = await signOwnerCookieValue("secret-1");
    const req = requestWithCookie(`${OWNER_COOKIE_NAME}=${encodeURIComponent(value)}`);
    expect(await isOwnerRequest(req, undefined)).toBe(false);
  });
});

describe("buildOwnerSetCookie", () => {
  it("includes the security attributes required by the target architecture", () => {
    const header = buildOwnerSetCookie("some-value");
    expect(header).toContain(`${OWNER_COOKIE_NAME}=some-value`);
    expect(header).toContain("HttpOnly");
    expect(header).toContain("Secure");
    expect(header).toContain("SameSite=Strict");
    expect(header).toContain("Path=/");
    expect(header).toMatch(/Max-Age=\d+/);
  });
});
