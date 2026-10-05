import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Admin from "./Admin";

// Audit-flagged bug: Admin's owner-marking effect used to key off
// useGateUnlocked("admin"), which is ALSO true for a collaborator who only
// has the page-specific admin code — silently opting their browser out of
// analytics too. This file verifies the fix: only a master-code unlock
// (the site-wide pl_session_access key) may set that flag; a page-specific
// code unlock must not.
//
// Heavy, irrelevant-to-this-bug rendering surfaces (charts, resizable
// panels, mobile detection) are stubbed out; govDb is a generic
// auto-resolving chain so any remaining direct query resolves safely, and
// fetch (for /api/admin) is stubbed per test.
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

const VISIT_ID = "3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b";

function stubAdminApi(status: number, body: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } })
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function adminCalls(fetchMock: ReturnType<typeof vi.fn>) {
  return fetchMock.mock.calls
    .filter(([url]) => url === "/api/admin")
    .map(([, init]) => JSON.parse((init as RequestInit).body as string));
}

describe("Admin — owner identity must come only from the master code, never a page-specific code", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    // Valid owner session: these tests are about owner-marking, not 401 handling.
    stubAdminApi(200, { ok: true, data: [] });
  });

  afterEach(() => cleanup());

  it("a page-specific admin-code unlock does not establish (or preserve) owner identity", async () => {
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

  it("an already-master-unlocked browser does not lose owner identity merely because the admin page code is also present", async () => {
    localStorage.setItem(MASTER_KEY, "1");
    localStorage.setItem(PAGE_KEY, "1");
    renderAdmin();

    await new Promise((r) => setTimeout(r, 20));

    expect(localStorage.getItem(MASTER_KEY)).toBe("1");
  });
});

// visit_logs is no longer readable with the anon key — the visitor log is
// served by /api/admin, which only accepts the server-minted owner cookie.
describe("Admin — visitor log via /api/admin", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("reads visits through /api/admin, not the anon Supabase client", async () => {
    localStorage.setItem(MASTER_KEY, "1");
    const fetchMock = stubAdminApi(200, { ok: true, data: [] });
    renderAdmin();
    await waitFor(() => expect(adminCalls(fetchMock)).toContainEqual({ action: "visits.list", offset: 0 }));
  });

  it("page-code-only unlock: server says master code required → stale flag cleared, gate re-shown", async () => {
    localStorage.setItem(PAGE_KEY, "1");
    stubAdminApi(401, { ok: false, error: "master-code-required" });
    const { findByText, queryByText } = renderAdmin();
    expect(await findByText("Enter code")).toBeInTheDocument();
    expect(localStorage.getItem(PAGE_KEY)).toBeNull();
    expect(queryByText(/failed to load/i)).toBeNull();
  });

  it("stale master unlock (401, no owner cookie): both unlock flags cleared and the code prompt returns", async () => {
    localStorage.setItem(MASTER_KEY, "1");
    localStorage.setItem(PAGE_KEY, "1");
    const fetchMock = stubAdminApi(401, { ok: false, error: "master-code-required" });
    const { findByText } = renderAdmin();
    expect(await findByText("Enter code")).toBeInTheDocument();
    expect(localStorage.getItem(MASTER_KEY)).toBeNull();
    expect(localStorage.getItem(PAGE_KEY)).toBeNull();
    // Only one failed call: the page does not keep retrying once locked.
    expect(adminCalls(fetchMock).length).toBe(1);
  });

  it("a non-401 failure (server error) leaves the unlock flags alone", async () => {
    localStorage.setItem(MASTER_KEY, "1");
    stubAdminApi(502, { ok: false, error: "db-error" });
    renderAdmin();
    await new Promise((r) => setTimeout(r, 30));
    expect(localStorage.getItem(MASTER_KEY)).toBe("1");
  });

  it("master unlock with a valid owner session: no master-code note", async () => {
    localStorage.setItem(MASTER_KEY, "1");
    const fetchMock = stubAdminApi(200, {
      ok: true,
      data: [{ id: VISIT_ID, page: "/", referrer: null, user_agent: null, visited_at: new Date().toISOString(), city: null, region: null, country: null }],
    });
    const { queryByTestId } = renderAdmin();
    await waitFor(() => expect(adminCalls(fetchMock).length).toBeGreaterThan(0));
    await new Promise((r) => setTimeout(r, 20));
    expect(queryByTestId("visits-master-required")).toBeNull();
  });

  it("locked page: never calls /api/admin", async () => {
    const fetchMock = stubAdminApi(200, { ok: true, data: [] });
    renderAdmin();
    await new Promise((r) => setTimeout(r, 20));
    expect(adminCalls(fetchMock)).toEqual([]);
  });
});
