import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup, waitFor } from "@testing-library/react";
import { govDb } from "@/lib/supabase-governance";
import VisitorCounter from "./VisitorCounter";

// VisitorCounter shares the exact same owner-exclusion bug surface as
// useVisitLogger (it independently read the old dual-purpose
// pl_session_access key) so it gets the same coverage here, now via the
// shared src/lib/ownerExclusion.ts helper. No live DB calls — govDb is
// mocked.
vi.mock("@/lib/supabase-governance", () => ({
  govDb: { from: vi.fn(), rpc: vi.fn() },
}));

// Framer Motion's real spring/transform machinery isn't relevant to the
// owner-exclusion logic under test and doesn't matter here — stubbed to
// plain passthroughs so this test only exercises VisitorCounter's own hook.
vi.mock("framer-motion", () => ({
  motion: { span: ({ children }: { children?: unknown }) => <span>{children as React.ReactNode}</span> },
  useSpring: () => ({ set: () => {} }),
  useTransform: () => 0,
}));

const OWNER_EXCLUSION_KEY = "pl_owner_exclusion";
const LEGACY_MASTER_KEY = "pl_session_access";

function mockGovDb(count = 42) {
  const rpc = vi.fn().mockResolvedValue({ error: null });
  const single = vi.fn().mockResolvedValue({ data: { count } });
  const eq = vi.fn().mockReturnValue({ single });
  const select = vi.fn().mockReturnValue({ eq });
  (govDb.from as ReturnType<typeof vi.fn>).mockReturnValue({ select });
  (govDb.rpc as ReturnType<typeof vi.fn>).mockImplementation(rpc);
  return { rpc };
}

describe("VisitorCounter — owner exclusion", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("does not increment the view count when pl_owner_exclusion is set", async () => {
    localStorage.setItem(OWNER_EXCLUSION_KEY, "1");
    const { rpc } = mockGovDb();

    render(<VisitorCounter page="/owner-test" />);
    await waitFor(() => expect(govDb.from).toHaveBeenCalledWith("page_views"));

    expect(rpc).not.toHaveBeenCalled();
  });

  it("does not increment when only the legacy pl_session_access key is set, and backfills the new key", async () => {
    localStorage.setItem(LEGACY_MASTER_KEY, "1");
    const { rpc } = mockGovDb();

    render(<VisitorCounter page="/legacy-test" />);
    await waitFor(() => expect(govDb.from).toHaveBeenCalledWith("page_views"));

    expect(rpc).not.toHaveBeenCalled();
    expect(localStorage.getItem(OWNER_EXCLUSION_KEY)).toBe("1");
  });

  it("increments the view count for an ordinary visitor with neither key set", async () => {
    const { rpc } = mockGovDb();

    render(<VisitorCounter page="/visitor-test" />);

    await waitFor(() =>
      expect(rpc).toHaveBeenCalledWith("increment_page_view", { p_page: "/visitor-test" })
    );
  });
});
