import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { govDb } from "@/lib/supabase-governance";
import { verifyMasterCode } from "@/lib/masterCode";
import { adminCall } from "@/lib/adminApi";
import { markOwnerExcluded } from "@/lib/ownerExclusion";
import MelodicFramework from "./MelodicFramework";

// Melodic's admin-mode PIN used to be a hardcoded secret literal, checked
// entirely client-side. It now defers to the same server-verified master
// code as every other owner-unlock path (src/lib/masterCode.ts) — this file
// covers only that swap, not song browsing/request moderation itself.
vi.mock("@/lib/supabase-governance", () => ({ govDb: { from: vi.fn() } }));
vi.mock("@/lib/masterCode", () => ({ verifyMasterCode: vi.fn() }));
vi.mock("@/lib/ownerExclusion", () => ({ markOwnerExcluded: vi.fn() }));
vi.mock("@/lib/adminApi", () => ({ adminCall: vi.fn() }));
vi.mock("@/components/portfolio/Comments", () => ({ default: () => null }));
vi.mock("@/components/portfolio/VisitorCounter", () => ({ default: () => null }));

// A single object that answers every Supabase query-builder method Melodic
// calls (select/eq/order/update) by returning itself, and is directly
// awaitable/then-able so it resolves whichever link in the chain is last.
function makeQueryBuilder(result: { data: unknown[] } = { data: [] }) {
  const builder: Record<string, unknown> = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    order: vi.fn(() => Promise.resolve(result)),
    update: vi.fn(() => builder),
    then: (resolve: (v: typeof result) => void) => resolve(result),
  };
  return builder;
}

function renderMelodic() {
  return render(
    <MemoryRouter>
      <MelodicFramework />
    </MemoryRouter>
  );
}

describe("MelodicFramework — admin PIN now verified server-side", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    // Page-specific access only — deliberately NOT the master key, so this
    // stays isolated from the (unrelated) master owner-unlock path.
    localStorage.setItem("pl_access_melodic", "1");
    (govDb.from as ReturnType<typeof vi.fn>).mockReturnValue(makeQueryBuilder());
    (adminCall as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, data: [] });
    // jsdom has no IntersectionObserver; the raaga grid's motion.div cards
    // use framer-motion's viewport feature, which needs one to mount at all —
    // unrelated to what this file actually tests.
    (global as unknown as { IntersectionObserver: unknown }).IntersectionObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  });

  afterEach(() => cleanup());

  it("invalid master code shows an error and does not enter admin mode", async () => {
    (verifyMasterCode as ReturnType<typeof vi.fn>).mockResolvedValue(false);
    renderMelodic();

    fireEvent.change(screen.getByPlaceholderText("Admin PIN"), { target: { value: "wrong" } });
    fireEvent.click(screen.getByText("→"));

    await waitFor(() => expect(verifyMasterCode).toHaveBeenCalledWith("wrong"));
    expect(screen.queryByText("Admin mode")).not.toBeInTheDocument();
    expect(markOwnerExcluded).not.toHaveBeenCalled();
  });

  it("valid master code enters admin mode and marks owner-exclusion UI state", async () => {
    (verifyMasterCode as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    renderMelodic();

    fireEvent.change(screen.getByPlaceholderText("Admin PIN"), { target: { value: "correct" } });
    fireEvent.click(screen.getByText("→"));

    await waitFor(() => expect(screen.getByText("Admin mode")).toBeInTheDocument());
    // Audit-flagged gap: this path used to enter admin mode without ever
    // calling markOwnerExcluded(). Server-side owner-cookie establishment
    // (via verifyMasterCode's own call) is authoritative regardless, but
    // the UI-state flag should stay consistent with the other three
    // master-code entry points.
    expect(markOwnerExcluded).toHaveBeenCalledTimes(1);
  });

  // Melodic never normalized the input, so this is a pin rather than a fix —
  // it locks in the behavior that Owner/PageGate/Tracker were corrected to
  // match on 2026-09-13. See src/lib/masterCodeCasing.test.ts for why the
  // server requires the secret byte-for-byte.
  it("sends a mixed-case master code unchanged", async () => {
    const MIXED_CASE_SECRET = "Tz7Kq4Mx9Rb2Wv"; // throwaway fixture, never a real code
    (verifyMasterCode as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    renderMelodic();

    fireEvent.change(screen.getByPlaceholderText("Admin PIN"), { target: { value: MIXED_CASE_SECRET } });
    fireEvent.click(screen.getByText("→"));

    await waitFor(() => expect(verifyMasterCode).toHaveBeenCalled());
    expect(verifyMasterCode).toHaveBeenCalledWith(MIXED_CASE_SECRET);
    expect(verifyMasterCode).not.toHaveBeenCalledWith(MIXED_CASE_SECRET.toUpperCase());
  });
});

// Anon RLS can no longer update melodic_song_requests (or read pending ones)
// — the admin panel goes through /api/admin via adminCall.
describe("MelodicFramework — song moderation via /api/admin", () => {
  const REQ = {
    id: "3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b", raaga_id: "bhairav", title: "Test Song", singer: "Test Singer",
    movie: null, composer: null, genre: "Film", youtube_id: null, youtube_query: null, status: "pending",
    created_at: new Date().toISOString(),
  };
  const adminCallMock = () => adminCall as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem("pl_access_melodic", "1");
    (govDb.from as ReturnType<typeof vi.fn>).mockReturnValue(makeQueryBuilder());
    (verifyMasterCode as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    adminCallMock().mockImplementation(async (body: { action: string }) =>
      body.action === "songs.pending" ? { ok: true, data: [REQ] } : { ok: true, data: undefined }
    );
    (global as unknown as { IntersectionObserver: unknown }).IntersectionObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  });

  afterEach(() => cleanup());

  async function enterAdmin() {
    renderMelodic();
    fireEvent.change(screen.getByPlaceholderText("Admin PIN"), { target: { value: "correct" } });
    fireEvent.click(screen.getByText("→"));
    await waitFor(() => expect(screen.getByText("Test Song")).toBeInTheDocument());
  }

  it("loads pending requests through adminCall", async () => {
    await enterAdmin();
    expect(adminCallMock()).toHaveBeenCalledWith({ action: "songs.pending" });
  });

  it("approve sends songs.approve with the selected raaga", async () => {
    await enterAdmin();
    fireEvent.click(screen.getByText("✓ Approve"));
    await waitFor(() =>
      expect(adminCallMock()).toHaveBeenCalledWith({ action: "songs.approve", id: REQ.id, raagaId: "bhairav" })
    );
  });

  it("reject sends songs.reject", async () => {
    await enterAdmin();
    fireEvent.click(screen.getByText("✗ Reject"));
    await waitFor(() => expect(adminCallMock()).toHaveBeenCalledWith({ action: "songs.reject", id: REQ.id }));
  });

  it("never updates melodic_song_requests through the anon client", async () => {
    await enterAdmin();
    fireEvent.click(screen.getByText("✗ Reject"));
    await waitFor(() => expect(adminCallMock()).toHaveBeenCalledWith({ action: "songs.reject", id: REQ.id }));
    const builders = (govDb.from as ReturnType<typeof vi.fn>).mock.results.map((r) => r.value as { update: ReturnType<typeof vi.fn> });
    expect(builders.every((b) => b.update.mock.calls.length === 0)).toBe(true);
  });

  it("a 401 shows 'Master code required.' instead of an empty queue", async () => {
    adminCallMock().mockResolvedValue({ ok: false, error: "master-code-required" });
    renderMelodic();
    fireEvent.change(screen.getByPlaceholderText("Admin PIN"), { target: { value: "correct" } });
    fireEvent.click(screen.getByText("→"));
    await waitFor(() => expect(screen.getByText("Master code required.")).toBeInTheDocument());
    expect(screen.queryByText("No pending requests.")).not.toBeInTheDocument();
  });
});
