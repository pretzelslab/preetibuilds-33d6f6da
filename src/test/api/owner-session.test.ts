import { describe, it, expect, vi, afterEach } from "vitest";
import handler from "../../../api/owner-session";
import { verifyOwnerCookieValue } from "../../../api/_lib/ownerCookie";

function getRequest(query: string) {
  return new Request(`http://localhost/api/owner-session${query}`, { method: "GET" });
}

describe("api/owner-session — private, pre-load owner entry link", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("sets the owner cookie and redirects to a clean homepage URL for the correct token", async () => {
    vi.stubEnv("PORTFOLIO_OWNER_TOKEN", "SUPERSECRETTOKEN");

    const res = await handler(getRequest("?token=SUPERSECRETTOKEN"));

    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toBe("/");
    // The secret never appears in the redirected-to URL.
    expect(res.headers.get("Location")).not.toContain("SUPERSECRETTOKEN");

    const setCookie = res.headers.get("Set-Cookie");
    expect(setCookie).toBeTruthy();
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("Secure");
    const cookieValue = decodeURIComponent(setCookie!.split(";")[0].split("=")[1]);
    expect(await verifyOwnerCookieValue(cookieValue, "SUPERSECRETTOKEN")).toBe(true);
  });

  it("rejects an incorrect token and sets no cookie", async () => {
    vi.stubEnv("PORTFOLIO_OWNER_TOKEN", "SUPERSECRETTOKEN");

    const res = await handler(getRequest("?token=wrong"));

    expect(res.status).toBe(401);
    expect(res.headers.get("Set-Cookie")).toBeNull();
  });

  it("rejects a missing token and sets no cookie", async () => {
    vi.stubEnv("PORTFOLIO_OWNER_TOKEN", "SUPERSECRETTOKEN");

    const res = await handler(getRequest(""));

    expect(res.status).toBe(401);
    expect(res.headers.get("Set-Cookie")).toBeNull();
  });

  it("fails closed when PORTFOLIO_OWNER_TOKEN isn't configured, even for a plausible-looking token", async () => {
    vi.stubEnv("PORTFOLIO_OWNER_TOKEN", "");

    const res = await handler(getRequest("?token=anything"));

    expect(res.status).toBe(401);
    expect(res.headers.get("Set-Cookie")).toBeNull();
  });

  it("rejects non-GET methods", async () => {
    vi.stubEnv("PORTFOLIO_OWNER_TOKEN", "SUPERSECRETTOKEN");
    const res = await handler(new Request("http://localhost/api/owner-session", { method: "POST" }));
    expect(res.status).toBe(405);
  });
});
