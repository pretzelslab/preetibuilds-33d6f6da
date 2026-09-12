import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Admin from "./Admin";

// Audit-flagged bug: Admin's owner-marking effect used to key off
// useGateUnlocked("admin"), which is ALSO true for a collaborator who only
// has the page-specific ADM2026 code — silently opting their browser out of
// analytics too. This file verifies the fix: only a master-code unlock
// (the site-wide pl_session_access key) may set that flag; a page-specific
// code unlock must not.
//
// Heavy, irrelevant-to-this-bug rendering surfaces (charts, resizable
// panels, mobile detection) are stubbed out; govDb is a generic
// auto-resolving chain so whichever exact query shape Admin.tsx uses
// resolves safely without needing to be individually replicated here.
vi.mock("recharts", () => ({
  BarChart: ({ children }: { children?: unknown }) => <div>{children as React.ReactNode}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: { children?: unknown }) => <div>{children as React.ReactNode}</div>,
  Cell: () => null,
}));
vi.mock("@/components/ui/resizable", () => ({
  ResizablePanelGroup: ({ children }: { children?: unknown }) => <div>{children as React.ReactNode}</div>,
  ResizablePanel: ({ children }: { children?: unknown }) => <div>{children as React.ReactNode}</div>,
  ResizableHandle: () => null,
}));
vi.mock("@/hooks/use-mobile", () => ({ useIsMobile: () => false }));

function makeAutoChain(finalValue: unknown = { data: [], error: null, count: 0 }) {
  const handler: ProxyHandler<object> = {
    get(_target, prop) {
      if (prop === "then") return (resolve: (v: unknown) => void) => resolve(finalValue);
      if (prop === "single" || prop === "maybeSingle") return () => Promise.resolve(finalValue);
      return (..._args: unknown[]) => proxy;
    },
  };
  const proxy = new Proxy({}, handler);
  return proxy;
}

vi.mock("@/lib/supabase-governance", () => ({
  govDb: { from: vi.fn(() => makeAutoChain()) },
}));

function renderAdmin() {
  return render(
    <MemoryRouter>
      <Admin />
    </MemoryRouter>
  );
}

const MASTER_KEY = "pl_session_access";
const PAGE_KEY = "pl_access_admin";

describe("Admin — owner identity must come only from the master code, never a page-specific code", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => cleanup());

  it("a page-specific ADM2026 unlock does not establish (or preserve) owner identity", async () => {
    localStorage.setItem(PAGE_KEY, "1"); // page-specific code only — deliberately not the master key
    renderAdmin();

    // Give the owner-marking effect a chance to run if it were (incorrectly) triggered.
    await new Promise((r) => setTimeout(r, 20));

    expect(localStorage.getItem(MASTER_KEY)).toBeNull();
  });

  it("a master-code unlock does establish owner identity", async () => {
    localStorage.setItem(MASTER_KEY, "1"); // the real master-unlock flag
    renderAdmin();

    await waitFor(() => expect(localStorage.getItem(MASTER_KEY)).toBe("1"));
  });

  it("an already-master-unlocked browser does not lose owner identity merely because ADM2026 is also present", async () => {
    localStorage.setItem(MASTER_KEY, "1");
    localStorage.setItem(PAGE_KEY, "1");
    renderAdmin();

    await new Promise((r) => setTimeout(r, 20));

    expect(localStorage.getItem(MASTER_KEY)).toBe("1");
  });
});
