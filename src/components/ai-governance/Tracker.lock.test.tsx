import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, renderHook, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { govDb } from "@/lib/supabase-governance";
import { useVisitLogger } from "@/hooks/useVisitLogger";
import { useGateUnlocked } from "@/components/ui/PageGate";
import AIGovernanceTracker from "./Tracker";

// Focused local verification of the 4caada4 fix, using the REAL Tracker
// component and its actual "Lock page" button — not a reimplementation of
// doLock() in isolation. No live DB writes anywhere: govDb.from is mocked.
vi.mock("@/lib/supabase-governance", () => ({ govDb: { from: vi.fn() } }));

const OWNER_KEY = "pl_session_access";

function mockInsert(result: { error: { message: string } | null } = { error: null }) {
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

// jsdom's default test hostname is "localhost", which useVisitLogger skips
// unconditionally regardless of owner status — stubbed to a real-looking
// deployed host so the isOwner branch is actually exercised.
function stubHostname(hostname: string) {
  const original = window.location;
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { ...original, hostname, hash: "", search: "" },
  });
  return () => Object.defineProperty(window, "location", { configurable: true, value: original });
}

function renderTracker() {
  return render(
    <MemoryRouter>
      <AIGovernanceTracker />
    </MemoryRouter>
  );
}

describe("AI Governance Tracker — real Lock page button (4caada4 verification)", () => {
  let restoreLocation: () => void;

  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    restoreLocation = stubHostname("preetibuilds-33d6f6da.vercel.app");
    mockGeoFetch();
  });

  afterEach(() => {
    cleanup();
    restoreLocation();
  });

  it("1. visibly locks the page, and can unlock again with the master code", () => {
    localStorage.setItem(OWNER_KEY, "1");
    renderTracker();

    // Owner starts unlocked — floating button reads "Lock page".
    fireEvent.click(screen.getByTitle("Lock page"));

    // Locking is pre-existing, unmodified behavior (unrelated to this fix):
    // it also resets this page's own visitorAccess, which reverts all the
    // way to the pre-access landing gate — a real, visible change, not a
    // no-op. Confirms the button still does its own job correctly.
    expect(screen.getByText("Explore Policy Grid →")).toBeInTheDocument();
    expect(screen.queryByTitle("Lock page")).not.toBeInTheDocument();

    // Re-unlock via the gate's "Owner login" link + master code.
    fireEvent.click(screen.getByText("Owner login"));
    fireEvent.change(screen.getByPlaceholderText("Access code"), { target: { value: "PRL2026" } });
    fireEvent.click(screen.getByText("Unlock →"));

    expect(screen.getByTitle("Lock page")).toBeInTheDocument(); // back to the unlocked main view
  });

  it("2. owner-exclusion flag remains intact after clicking Lock page (the actual bug)", () => {
    localStorage.setItem(OWNER_KEY, "1");
    renderTracker();

    fireEvent.click(screen.getByTitle("Lock page"));

    expect(localStorage.getItem(OWNER_KEY)).toBe("1"); // previously wiped by doLock(); now untouched
  });

  it("3. other master-unlocked pages remain unlocked after clicking Lock page here", () => {
    localStorage.setItem(OWNER_KEY, "1");
    renderTracker();

    fireEvent.click(screen.getByTitle("Lock page"));

    // Real PageGate hook, a page that was never given its own page-specific
    // code — its only path to "unlocked" is the shared master key.
    const { result } = renderHook(() => useGateUnlocked("melodic"));
    expect(result.current).toBe(true);
  });

  it("4. subsequent owner navigation to another page makes zero mocked visit inserts", async () => {
    localStorage.setItem(OWNER_KEY, "1");
    const insert = mockInsert();
    renderTracker();

    fireEvent.click(screen.getByTitle("Lock page"));

    renderHook(() => useVisitLogger("page-after-tracker-lock")); // simulates navigating elsewhere as owner
    await new Promise((r) => setTimeout(r, 20));

    expect(insert).not.toHaveBeenCalled();
  });

  it("5. an ordinary visitor (no owner flag ever set) still logs normally — regression check", async () => {
    const insert = mockInsert();

    renderHook(() => useVisitLogger("page-ordinary-visitor-check"));
    await waitFor(() => expect(insert).toHaveBeenCalledTimes(1));
  });
});

// "Full app remount" here means: React unmounts the entire tree and mounts
// a fresh one in the SAME running JS process (e.g. an SPA route change that
// tears down every component) — module-level state such as
// useVisitLogger.ts's `inFlight` Set is untouched, because it's the same JS
// heap. This is deliberately NOT the same claim as a real browser restart
// or hard page reload, which discards that in-memory module state entirely
// and, if it's a genuinely new browser session rather than a same-tab
// reload, clears sessionStorage too — only localStorage is guaranteed to
// survive that. The two tests below check each boundary explicitly instead
// of treating them as interchangeable.
describe("Owner exclusion across remounts — same-process vs. a real restart", () => {
  let restoreLocation: () => void;

  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    restoreLocation = stubHostname("preetibuilds-33d6f6da.vercel.app");
    mockGeoFetch();
  });

  afterEach(() => {
    cleanup();
    restoreLocation();
  });

  it("full app remount (same JS process, storage retained): stays unlocked and excluded with zero re-entry of any code", async () => {
    localStorage.setItem(OWNER_KEY, "1");
    const insert = mockInsert();

    const first = renderTracker();
    expect(screen.getByTitle("Lock page")).toBeInTheDocument(); // unlocked immediately from storage alone
    first.unmount(); // full app teardown

    renderTracker(); // fresh mount, no code re-entered anywhere
    expect(screen.getByTitle("Lock page")).toBeInTheDocument();

    renderHook(() => useVisitLogger("page-after-full-remount"));
    await new Promise((r) => setTimeout(r, 20));
    expect(insert).not.toHaveBeenCalled();
  });

  it("module-level reset (closest achievable proxy to an actual browser restart), storage retained: exclusion still holds without any in-memory carryover", async () => {
    localStorage.setItem(OWNER_KEY, "1");

    // Forces the module registry to drop its cached instances of these two
    // modules and re-evaluate them from scratch on next import — the
    // closest thing to the fresh JS heap of a real restart/hard reload
    // that's reachable inside one test process. jsdom's localStorage is a
    // real Storage implementation, untouched by this, exactly as a real
    // browser restart leaves localStorage on disk untouched.
    vi.resetModules();
    const freshGovDb = (await import("@/lib/supabase-governance")).govDb;
    const insert = vi.fn().mockResolvedValue({ error: null });
    (freshGovDb.from as ReturnType<typeof vi.fn>).mockReturnValue({ insert });
    const { useVisitLogger: freshUseVisitLogger } = await import("@/hooks/useVisitLogger");

    renderHook(() => freshUseVisitLogger("page-after-module-reset"));
    await new Promise((r) => setTimeout(r, 20));

    expect(insert).not.toHaveBeenCalled();
  });
});
