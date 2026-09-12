import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, renderHook, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { useVisitLogger, logVisit } from "@/hooks/useVisitLogger";
import { verifyMasterCode } from "@/lib/masterCode";
import { PageGate } from "./PageGate";

// Confirms the pl_owner_exclusion / pl_session_access split (approved
// architecture, session 2026-09-11) at the PageGate layer: a page-specific
// visitor code (shared with a specific external visitor) must never grant
// analytics owner exclusion, only the master code may. No live network
// calls — fetch is mocked.
// The master code is now verified server-side (src/lib/masterCode.ts calls
// api/verify-master-code.ts) — mocked directly rather than via fetch so
// these tests don't need to know about that network call's shape.
vi.mock("@/lib/masterCode", () => ({ verifyMasterCode: vi.fn() }));

const MASTER_KEY = "pl_session_access";
const OWNER_EXCLUSION_KEY = "pl_owner_exclusion";

// useVisitLogger no longer talks to Supabase directly — it posts to
// api/portfolio-analytics.ts. Mocked here via fetch.
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

function renderGate() {
  return render(
    <MemoryRouter>
      <PageGate pageId="research">
        <div>Secret content</div>
      </PageGate>
    </MemoryRouter>
  );
}

describe("PageGate — owner exclusion vs. page-specific visitor codes", () => {
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

  it("unlocking with a page-specific code grants access but never sets owner exclusion or the master key, and never calls the server", async () => {
    renderGate();

    fireEvent.click(screen.getByText("Enter code"));
    fireEvent.change(screen.getByPlaceholderText("Access code"), { target: { value: "RSC2026" } });
    fireEvent.click(screen.getByText("Unlock"));

    await waitFor(() => expect(screen.getByText("Secret content")).toBeInTheDocument());
    expect(localStorage.getItem("pl_access_research")).toBe("1");
    expect(localStorage.getItem(OWNER_EXCLUSION_KEY)).toBeNull();
    expect(localStorage.getItem(MASTER_KEY)).toBeNull();
    expect(verifyMasterCode).not.toHaveBeenCalled();
  });

  it("a visitor who only has a page-specific code still gets their visit logged normally", async () => {
    localStorage.setItem("pl_access_research", "1"); // as if unlocked via the code above
    const fetchMock = mockAnalyticsFetch(true);

    renderHook(() => useVisitLogger("page-specific-code-visitor"));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  });

  it("contrast: a server-verified master code DOES establish owner exclusion", async () => {
    (verifyMasterCode as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    renderGate();

    fireEvent.click(screen.getByText("Enter code"));
    fireEvent.change(screen.getByPlaceholderText("Access code"), { target: { value: "TESTCODE" } });
    fireEvent.click(screen.getByText("Unlock"));

    await waitFor(() => expect(localStorage.getItem(MASTER_KEY)).toBe("1"));
    expect(localStorage.getItem(OWNER_EXCLUSION_KEY)).toBe("1");
    expect(verifyMasterCode).toHaveBeenCalledWith("TESTCODE");
  });

  it("a server rejection of the entered code grants nothing", async () => {
    (verifyMasterCode as ReturnType<typeof vi.fn>).mockResolvedValue(false);
    renderGate();

    fireEvent.click(screen.getByText("Enter code"));
    fireEvent.change(screen.getByPlaceholderText("Access code"), { target: { value: "WRONGCODE" } });
    fireEvent.click(screen.getByText("Unlock"));

    await waitFor(() => expect(verifyMasterCode).toHaveBeenCalledWith("WRONGCODE"));
    expect(localStorage.getItem(MASTER_KEY)).toBeNull();
    expect(localStorage.getItem(OWNER_EXCLUSION_KEY)).toBeNull();
    // PageGate's locked state still renders children (blurred via CSS, not
    // removed from the DOM) — the reliable "still locked" signal is the
    // sticky locked-state banner text, present throughout the whole locked
    // state regardless of whether the code input is expanded.
    expect(screen.getByText("Preview · Enter code for full access")).toBeInTheDocument();
  });

  // Covers the gap found 2026-09-12: this exact page's useVisitLogger call
  // always runs on mount, before the visitor can possibly have entered the
  // master code (PageGate only controls what JSX renders, not which hooks
  // already fired earlier in the same render) — so a brand-new browser's
  // very first visit to a protected page can be recorded before ownership
  // is provable. A successful unlock must retract that one row.
  it("a successful master-code unlock retracts a visit already logged for this exact page", async () => {
    (verifyMasterCode as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ recorded: true, id: "row-x" }),
    });
    global.fetch = fetchMock;

    // Simulate what useVisitLogger already did on mount, before the visitor
    // touched anything: this exact page got logged and its id remembered.
    await logVisit(window.location.pathname);

    renderGate();
    fireEvent.click(screen.getByText("Enter code"));
    fireEvent.change(screen.getByPlaceholderText("Access code"), { target: { value: "TESTCODE" } });
    fireEvent.click(screen.getByText("Unlock"));

    await waitFor(() => {
      const retractCall = fetchMock.mock.calls.find(
        ([, init]) => JSON.parse((init as RequestInit).body as string).kind === "retract"
      );
      expect(retractCall).toBeTruthy();
    });
    const [, retractInit] = fetchMock.mock.calls.find(
      ([, init]) => JSON.parse((init as RequestInit).body as string).kind === "retract"
    )!;
    expect(JSON.parse((retractInit as RequestInit).body as string)).toEqual({ kind: "retract", id: "row-x" });
  });

  it("the master code is never accepted via URL hash", () => {
    restoreLocation(); // drop the empty-hash stub from beforeEach
    const original = window.location;
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...original, hostname: "preetibuilds-33d6f6da.vercel.app", hash: "#TESTCODE", search: "" },
    });

    renderGate();

    expect(screen.getByText("Enter code")).toBeInTheDocument(); // still locked
    expect(localStorage.getItem(MASTER_KEY)).toBeNull();
    expect(verifyMasterCode).not.toHaveBeenCalled();

    Object.defineProperty(window, "location", { configurable: true, value: original });
  });
});
