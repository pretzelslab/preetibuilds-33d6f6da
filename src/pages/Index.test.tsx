import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup, waitFor } from "@testing-library/react";
import { govDb } from "@/lib/supabase-governance";
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

vi.mock("@/lib/supabase-governance", () => ({
  govDb: { from: vi.fn() },
}));

const OWNER_KEY = "pl_session_access";
const OWNER_EXCLUSION_KEY = "pl_owner_exclusion";

function mockInsert(result: { error: { message: string } | null }) {
  const insert = vi.fn().mockResolvedValue(result);
  (govDb.from as ReturnType<typeof vi.fn>).mockReturnValue({ insert });
  return insert;
}

function mockGeoFetch() {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ city: "Austin", region: "TX", country: "US" }),
  });
}

function stubLocation(hostname: string, hash: string) {
  const original = window.location;
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { ...original, hostname, hash, pathname: "/", search: "" },
  });
  return () => Object.defineProperty(window, "location", { configurable: true, value: original });
}

describe("Index — owner re-activation timing", () => {
  let restoreLocation: () => void;

  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    mockGeoFetch();
  });

  afterEach(() => {
    cleanup();
    restoreLocation();
  });

  it("sets the owner flag before useVisitLogger checks it, so visiting /#PRL2026 on a fresh browser does NOT log that visit", async () => {
    restoreLocation = stubLocation("preetibuilds-33d6f6da.vercel.app", "#PRL2026");
    const insert = mockInsert({ error: null });

    render(<Index />);

    // Give the async logVisit chain a chance to run if it were (incorrectly) triggered.
    await new Promise((r) => setTimeout(r, 20));

    expect(localStorage.getItem(OWNER_KEY)).toBe("1");
    expect(localStorage.getItem(OWNER_EXCLUSION_KEY)).toBe("1");
    expect(insert).not.toHaveBeenCalled();
  });

  it("still logs an ordinary homepage visit (no hash, no owner flag)", async () => {
    restoreLocation = stubLocation("preetibuilds-33d6f6da.vercel.app", "");
    const insert = mockInsert({ error: null });

    render(<Index />);
    await waitFor(() => expect(insert).toHaveBeenCalledTimes(1));

    expect(localStorage.getItem(OWNER_KEY)).toBeNull();
    expect(localStorage.getItem(OWNER_EXCLUSION_KEY)).toBeNull();
  });
});
