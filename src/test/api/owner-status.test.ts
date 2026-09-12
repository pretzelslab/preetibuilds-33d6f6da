import { describe, it, expect, vi, afterEach } from "vitest";
import handler from "../../../api/owner-status";
import { OWNER_COOKIE_NAME, signOwnerCookieValue } from "../../../api/_lib/ownerCookie";

function requestWithCookie(cookieHeader: string | null): Request {
  const headers = new Headers();
  if (cookieHeader) headers.set("Cookie", cookieHeader);
  return new Request("http://localhost/api/owner-status", { headers });
}

describe("api/owner-status — exposes owner status without exposing the credential", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("returns isOwner:true for a request with a valid owner cookie", async () => {
    vi.stubEnv("PORTFOLIO_OWNER_TOKEN", "OWNERTOKEN");
    const value = await signOwnerCookieValue("OWNERTOKEN");

    const res = await handler(requestWithCookie(`${OWNER_COOKIE_NAME}=${encodeURIComponent(value)}`));

    expect(await res.json()).toEqual({ isOwner: true });
  });

  it("returns isOwner:false for a request with no cookie", async () => {
    vi.stubEnv("PORTFOLIO_OWNER_TOKEN", "OWNERTOKEN");

    const res = await handler(requestWithCookie(null));

    expect(await res.json()).toEqual({ isOwner: false });
  });

  it("returns isOwner:false for a tampered cookie", async () => {
    vi.stubEnv("PORTFOLIO_OWNER_TOKEN", "OWNERTOKEN");
    const value = await signOwnerCookieValue("OWNERTOKEN");

    const res = await handler(requestWithCookie(`${OWNER_COOKIE_NAME}=${encodeURIComponent(value)}TAMPERED`));

    expect(await res.json()).toEqual({ isOwner: false });
  });

  it("never echoes the cookie value or the secret in the response body", async () => {
    vi.stubEnv("PORTFOLIO_OWNER_TOKEN", "OWNERTOKEN");
    const value = await signOwnerCookieValue("OWNERTOKEN");

    const res = await handler(requestWithCookie(`${OWNER_COOKIE_NAME}=${encodeURIComponent(value)}`));
    const text = await res.text();

    expect(text).not.toContain("OWNERTOKEN");
    expect(text).not.toContain(value);
  });

  it("fails closed to isOwner:false when the signing secret isn't configured", async () => {
    vi.stubEnv("PORTFOLIO_OWNER_TOKEN", "");
    const value = await signOwnerCookieValue("OWNERTOKEN");

    const res = await handler(requestWithCookie(`${OWNER_COOKIE_NAME}=${encodeURIComponent(value)}`));

    expect(await res.json()).toEqual({ isOwner: false });
  });
});
