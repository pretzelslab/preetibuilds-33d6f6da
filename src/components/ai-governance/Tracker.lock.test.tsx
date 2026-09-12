import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, renderHook, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { useVisitLogger } from "@/hooks/useVisitLogger";
import { useGateUnlocked } from "@/components/ui/PageGate";
import { verifyMasterCode } from "@/lib/masterCode";
import AIGovernanceTracker from "./Tracker";

// Focused local verification of the 4caada4 fix, using the REAL Tracker
// component and its actual "Lock page" button — not a reimplementation of
// doLock() in isolation. No live network calls anywhere: fetch is mocked.
// The master code is now verified server-side (src/lib/masterCode.ts calls
// api/verify-master-code.ts) — mocked directly so these tests don't need to
// know about that network call's shape.
vi.mock("@/lib/masterCode", () => ({ verifyMasterCode: vi.fn() }));

const OWNER_KEY = "pl_session_access";
const OWNER_EXCLUSION_KEY = "pl_owner_exclusion";

// useVisitLogger no longer talks to Supabase directly — it posts to
// api/portfolio-analytics.ts. Mocked here via fetch, matching
// src/hooks/useVisitLogger.test.ts's own coverage of that endpoint call.
function mockAnalyticsFetch(recorded = true) {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ recorded }) });
  global.fetch = fetchMock;
  return fetchMock;
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
    mockAnalyticsFetch();
  });

  afterEach(() => {
    cleanup();
    restoreLocation();
  });

  it("1. visibly locks the page, and can unlock again with a server-verified master code", async () => {
    (verifyMasterCode as ReturnType<typeof vi.fn>).mockResolvedValue(true);
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

    // Re-unlock via the gate's "Owner login" link + master code, now
    // verified server-side rather than compared to a client-side literal.
    fireEvent.click(screen.getByText("Owner login"));
    fireEvent.change(screen.getByPlaceholderText("Access code"), { target: { value: "TESTCODE" } });
    fireEvent.click(screen.getByText("Unlock →"));

    await waitFor(() => expect(screen.getByTitle("Lock page")).toBeInTheDocument()); // back to the unlocked main view
    expect(verifyMasterCode).toHaveBeenCalledWith("TESTCODE");
    // Re-entering the master code through Tracker's own unlock UI must also
    // (re-)establish the standalone analytics exclusion key, not just the
    // portfolio master-unlock key. This is UI-state only now — the actual
    // analytics decision is server/cookie-driven (see
    // api/portfolio-analytics.ts) — but it should still stay consistent.
    expect(localStorage.getItem(OWNER_EXCLUSION_KEY)).toBe("1");
  });

  it("1b. a server rejection of the entered code keeps the page locked", async () => {
    (verifyMasterCode as ReturnType<typeof vi.fn>).mockResolvedValue(false);
    localStorage.setItem(OWNER_KEY, "1");
    renderTracker();

    fireEvent.click(screen.getByTitle("Lock page"));
    fireEvent.click(screen.getByText("Owner login"));
    fireEvent.change(screen.getByPlaceholderText("Access code"), { target: { value: "WRONGCODE" } });
    fireEvent.click(screen.getByText("Unlock →"));

    await waitFor(() => expect(verifyMasterCode).toHaveBeenCalledWith("WRONGCODE"));
    expect(screen.queryByTitle("Lock page")).not.toBeInTheDocument();
    expect(localStorage.getItem(OWNER_EXCLUSION_KEY)).toBeNull();
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

  it("4. subsequent navigation as owner still calls the server — the server, not this browser, decides whether it's recorded", async () => {
    localStorage.setItem(OWNER_KEY, "1");
    const fetchMock = mockAnalyticsFetch(false); // server would respond {recorded:false, reason:"owner"} for a real owner cookie
    renderTracker();

    fireEvent.click(screen.getByTitle("Lock page"));

    renderHook(() => useVisitLogger("page-after-tracker-lock")); // simulates navigating elsewhere as owner
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith("/api/portfolio-analytics", expect.anything());
  });

  it("5. an ordinary visitor (no owner flag ever set) still logs normally — regression check", async () => {
    const fetchMock = mockAnalyticsFetch(true);

    renderHook(() => useVisitLogger("page-ordinary-visitor-check"));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
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
    mockAnalyticsFetch();
  });

  afterEach(() => {
    cleanup();
    restoreLocation();
  });

  it("full app remount (same JS process, storage retained): stays unlocked, and a subsequent visit-log call still goes through the server", async () => {
    localStorage.setItem(OWNER_KEY, "1");
    const fetchMock = mockAnalyticsFetch(false);

    const first = renderTracker();
    expect(screen.getByTitle("Lock page")).toBeInTheDocument(); // unlocked immediately from storage alone
    first.unmount(); // full app teardown

    renderTracker(); // fresh mount, no code re-entered anywhere
    expect(screen.getByTitle("Lock page")).toBeInTheDocument();

    renderHook(() => useVisitLogger("page-after-full-remount"));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  });

  it("module-level reset (closest achievable proxy to an actual browser restart): still posts to the server analytics endpoint, no in-memory carryover needed since owner status is never held in memory", async () => {
    // Forces the module registry to drop its cached instance of
    // useVisitLogger.ts and re-evaluate it from scratch on next import —
    // the closest thing to the fresh JS heap of a real restart/hard reload
    // that's reachable inside one test process.
    vi.resetModules();
    const fetchMock = mockAnalyticsFetch(false);
    const { useVisitLogger: freshUseVisitLogger } = await import("@/hooks/useVisitLogger");

    renderHook(() => freshUseVisitLogger("page-after-module-reset"));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  });
});
