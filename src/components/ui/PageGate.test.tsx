import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, renderHook, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { govDb } from "@/lib/supabase-governance";
import { useVisitLogger } from "@/hooks/useVisitLogger";
import { PageGate } from "./PageGate";

// Confirms the pl_owner_exclusion / pl_session_access split (approved
// architecture, session 2026-09-11) at the PageGate layer: a page-specific
// visitor code (shared with a specific external visitor) must never grant
// analytics owner exclusion, only the master code may. No live DB writes —
// govDb.from is mocked.
vi.mock("@/lib/supabase-governance", () => ({ govDb: { from: vi.fn() } }));

const MASTER_KEY = "pl_session_access";
const OWNER_EXCLUSION_KEY = "pl_owner_exclusion";

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
    mockGeoFetch();
  });

  afterEach(() => {
    cleanup();
    restoreLocation();
  });

  it("unlocking with a page-specific code grants access but never sets owner exclusion or the master key", () => {
    renderGate();

    fireEvent.click(screen.getByText("Enter code"));
    fireEvent.change(screen.getByPlaceholderText("Access code"), { target: { value: "RSC2026" } });
    fireEvent.click(screen.getByText("Unlock"));

    expect(screen.getByText("Secret content")).toBeInTheDocument();
    expect(localStorage.getItem("pl_access_research")).toBe("1");
    expect(localStorage.getItem(OWNER_EXCLUSION_KEY)).toBeNull();
    expect(localStorage.getItem(MASTER_KEY)).toBeNull();
  });

  it("a visitor who only has a page-specific code still gets their visit logged normally", async () => {
    localStorage.setItem("pl_access_research", "1"); // as if unlocked via the code above
    const insert = mockInsert();

    renderHook(() => useVisitLogger("page-specific-code-visitor"));
    await waitFor(() => expect(insert).toHaveBeenCalledTimes(1));
  });

  it("contrast: unlocking with the master code DOES establish owner exclusion", () => {
    renderGate();

    fireEvent.click(screen.getByText("Enter code"));
    fireEvent.change(screen.getByPlaceholderText("Access code"), { target: { value: "PRL2026" } });
    fireEvent.click(screen.getByText("Unlock"));

    expect(localStorage.getItem(MASTER_KEY)).toBe("1");
    expect(localStorage.getItem(OWNER_EXCLUSION_KEY)).toBe("1");
  });
});
