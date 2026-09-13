import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { govDb } from "@/lib/supabase-governance";
import { verifyMasterCode } from "@/lib/masterCode";
import { markOwnerExcluded } from "@/lib/ownerExclusion";
import Comments from "./Comments";

// Comments' admin-mode PIN used to be a hardcoded secret literal, checked
// entirely client-side. It now defers to the same server-verified master
// code as every other owner-unlock path (src/lib/masterCode.ts) — this file
// covers that swap without re-litigating comment loading/moderation itself.
vi.mock("@/lib/supabase-governance", () => ({ govDb: { from: vi.fn() } }));
vi.mock("@/lib/masterCode", () => ({ verifyMasterCode: vi.fn() }));
vi.mock("@/lib/ownerExclusion", () => ({ markOwnerExcluded: vi.fn() }));

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
