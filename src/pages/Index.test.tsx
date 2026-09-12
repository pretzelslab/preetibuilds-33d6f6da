import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup, waitFor } from "@testing-library/react";
import Index from "./Index";

// Heavy/animated children aren't relevant to the owner-reactivation timing
// fix under test — stub them so this test only exercises Index's own hooks.
vi.mock("@/components/portfolio/Navbar", () => ({ default: () => null }));
vi.mock("@/components/portfolio/Hero", () => ({ default: () => null }));
vi.mock("@/components/portfolio/CredibilityStrip", () => ({ default: () => null }));
vi.mock("@/components/portfolio/FeaturedWork", () => ({ default: () => null }));
vi.mock("@/components/portfolio/Projects", () => ({ default: () => null }));
vi.mock("@/components/portfolio/Writing", () => ({ default: () => null }));
vi.mock("@/components/portfolio/About", () => ({ default: () => null }));
vi.mock("@/components/portfolio/Contact", () => ({ default: () => null }));
vi.mock("@/components/portfolio/Footer", () => ({ default: () => null }));

const OWNER_KEY = "pl_session_access";
const OWNER_EXCLUSION_KEY = "pl_owner_exclusion";

// useVisitLogger no longer talks to Supabase directly — it posts to
// api/portfolio-analytics.ts. Mock fetch instead of govDb.
function mockFetch() {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ recorded: true }) });
  global.fetch = fetchMock;
  return fetchMock;
}

function stubLocation(hostname: string, hash: string) {
  const original = window.location;
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { ...original, hostname, hash, pathname: "/", search: "" },
  });
  return () => Object.defineProperty(window, "location", { configurable: true, value: original });
}

describe("Index — homepage visit logging (owner-reactivation hash removed)", () => {
  let restoreLocation: () => void;

  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
    restoreLocation();
  });

  it("a master-code-shaped hash on the homepage is inert — no owner flag is set, and the visit still logs normally", async () => {
    // The master code must never appear in a URL — Index.tsx no longer has
    // any hash-reading effect at all, so this hash is just an ordinary
    // (ignored) URL fragment now.
    restoreLocation = stubLocation("preetibuilds-33d6f6da.vercel.app", "#TESTCODE");
    const fetchMock = mockFetch();

    render(<Index />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith("/api/portfolio-analytics", expect.anything());

    expect(localStorage.getItem(OWNER_KEY)).toBeNull();
    expect(localStorage.getItem(OWNER_EXCLUSION_KEY)).toBeNull();
  });

  it("still logs an ordinary homepage visit (no hash, no owner flag)", async () => {
    restoreLocation = stubLocation("preetibuilds-33d6f6da.vercel.app", "");
    const fetchMock = mockFetch();

    render(<Index />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    expect(localStorage.getItem(OWNER_KEY)).toBeNull();
    expect(localStorage.getItem(OWNER_EXCLUSION_KEY)).toBeNull();
  });

  it("first ever homepage load on a browser with a valid owner cookie is skipped server-side — this test documents that the client sends the request either way and the server is what decides", async () => {
    // Regression guard for the exact gap the audit found: the client has no
    // way to know in advance whether this browser has a valid owner cookie
    // (HttpOnly — invisible to JS), so it must always ask. This test
    // exists to keep that "always ask" behavior from silently regressing
    // back into a client-side pre-check.
    restoreLocation = stubLocation("preetibuilds-33d6f6da.vercel.app", "");
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ recorded: false, reason: "owner" }) });
    global.fetch = fetchMock;

    render(<Index />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  });
});
