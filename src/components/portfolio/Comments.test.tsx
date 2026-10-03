import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { govDb } from "@/lib/supabase-governance";
import { verifyMasterCode } from "@/lib/masterCode";
import { markOwnerExcluded } from "@/lib/ownerExclusion";
import { adminCall } from "@/lib/adminApi";
import Comments from "./Comments";

// Comments' admin-mode PIN used to be a hardcoded secret literal, checked
// entirely client-side. It now defers to the same server-verified master
// code as every other owner-unlock path (src/lib/masterCode.ts) — this file
// covers that swap without re-litigating comment loading/moderation itself.
vi.mock("@/lib/supabase-governance", () => ({ govDb: { from: vi.fn() } }));
vi.mock("@/lib/masterCode", () => ({ verifyMasterCode: vi.fn() }));
vi.mock("@/lib/ownerExclusion", () => ({ markOwnerExcluded: vi.fn() }));
vi.mock("@/lib/adminApi", () => ({ adminCall: vi.fn() }));

function makeAwaitableChain(result: { data: unknown[] }) {
  const promise = Promise.resolve(result) as Promise<typeof result> & { limit: ReturnType<typeof vi.fn> };
  promise.limit = vi.fn().mockResolvedValue(result);
  return promise;
}

function mockLoads() {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockImplementation(() => makeAwaitableChain({ data: [] })),
  };
  (govDb.from as ReturnType<typeof vi.fn>).mockReturnValue(chain);
  return chain;
}

describe("Comments — admin PIN now verified server-side", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockLoads();
    (adminCall as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, data: [] });
  });

  afterEach(() => cleanup());

  it("invalid master code shows an error and does not enter admin mode", async () => {
    (verifyMasterCode as ReturnType<typeof vi.fn>).mockResolvedValue(false);
    render(<Comments />);

    fireEvent.change(screen.getByPlaceholderText("Admin PIN"), { target: { value: "wrong" } });
    fireEvent.click(screen.getByText("→"));

    await waitFor(() => expect(screen.getByText("Wrong PIN")).toBeInTheDocument());
    expect(verifyMasterCode).toHaveBeenCalledWith("wrong");
    expect(screen.queryByText("Admin mode active")).not.toBeInTheDocument();
    expect(markOwnerExcluded).not.toHaveBeenCalled();
  });

  it("valid master code enters admin mode and marks owner-exclusion UI state", async () => {
    (verifyMasterCode as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    render(<Comments />);

    fireEvent.change(screen.getByPlaceholderText("Admin PIN"), { target: { value: "correct" } });
    fireEvent.click(screen.getByText("→"));

    await waitFor(() => expect(screen.getByText("Admin mode active")).toBeInTheDocument());
    // Audit-flagged gap: this path used to enter admin mode without ever
    // calling markOwnerExcluded() — the actual analytics-exclusion decision
    // is server/cookie-driven now regardless, but the UI-state flag should
    // still stay consistent with the other three master-code entry points.
    expect(markOwnerExcluded).toHaveBeenCalledTimes(1);
  });

  // Comments never normalized the input, so this is a pin rather than a fix —
  // it locks in the behavior that Owner/PageGate/Tracker were corrected to
  // match on 2026-09-13. See src/lib/masterCodeCasing.test.ts for why the
  // server requires the secret byte-for-byte.
  it("sends a mixed-case master code unchanged", async () => {
    const MIXED_CASE_SECRET = "Tz7Kq4Mx9Rb2Wv"; // throwaway fixture, never a real code
    (verifyMasterCode as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    render(<Comments />);

    fireEvent.change(screen.getByPlaceholderText("Admin PIN"), { target: { value: MIXED_CASE_SECRET } });
    fireEvent.click(screen.getByText("→"));

    await waitFor(() => expect(verifyMasterCode).toHaveBeenCalled());
    expect(verifyMasterCode).toHaveBeenCalledWith(MIXED_CASE_SECRET);
    expect(verifyMasterCode).not.toHaveBeenCalledWith(MIXED_CASE_SECRET.toUpperCase());
  });
});

// Anon RLS can no longer update/delete portfolio_comments (or read the
// pending queue) — moderation goes through /api/admin via adminCall.
describe("Comments — moderation via /api/admin", () => {
  const PENDING = { id: "3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b", name: "Asha", message: "Lovely work", reply: null, created_at: new Date().toISOString() };
  const adminCallMock = () => adminCall as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.restoreAllMocks();
    mockLoads();
    (verifyMasterCode as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    adminCallMock().mockImplementation(async (body: { action: string }) =>
      body.action === "comments.pending" ? { ok: true, data: [PENDING] } : { ok: true, data: undefined }
    );
  });

  afterEach(() => cleanup());

  async function enterAdmin() {
    render(<Comments />);
    fireEvent.change(screen.getByPlaceholderText("Admin PIN"), { target: { value: "correct" } });
    fireEvent.click(screen.getByText("→"));
    await waitFor(() => expect(screen.getByText("Lovely work")).toBeInTheDocument());
  }

  it("loads the pending queue through adminCall, not the anon client", async () => {
    await enterAdmin();
    expect(adminCallMock()).toHaveBeenCalledWith({ action: "comments.pending" });
  });

  it("approve goes through adminCall and never through govDb.update", async () => {
    await enterAdmin();
    fireEvent.click(screen.getByText("✓ Approve"));
    await waitFor(() => expect(adminCallMock()).toHaveBeenCalledWith({ action: "comments.approve", id: PENDING.id }));
    const chain = (govDb.from as ReturnType<typeof vi.fn>).mock.results.map((r) => r.value);
    expect(chain.some((c) => c && "update" in c)).toBe(false);
  });

  it("delete goes through adminCall", async () => {
    await enterAdmin();
    fireEvent.click(screen.getByText("✗ Delete"));
    await waitFor(() => expect(adminCallMock()).toHaveBeenCalledWith({ action: "comments.delete", id: PENDING.id }));
  });

  it("a 401 from the server surfaces 'Master code required.'", async () => {
    adminCallMock().mockResolvedValue({ ok: false, error: "master-code-required" });
    render(<Comments />);
    fireEvent.change(screen.getByPlaceholderText("Admin PIN"), { target: { value: "correct" } });
    fireEvent.click(screen.getByText("→"));
    await waitFor(() => expect(screen.getByText("Master code required.")).toBeInTheDocument());
  });
});
