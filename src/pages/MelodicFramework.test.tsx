import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { govDb } from "@/lib/supabase-governance";
import { verifyMasterCode } from "@/lib/masterCode";
import MelodicFramework from "./MelodicFramework";

// Melodic's admin-mode PIN used to be a hardcoded secret literal, checked
// entirely client-side. It now defers to the same server-verified master
// code as every other owner-unlock path (src/lib/masterCode.ts) — this file
// covers only that swap, not song browsing/request moderation itself.
vi.mock("@/lib/supabase-governance", () => ({ govDb: { from: vi.fn() } }));
vi.mock("@/lib/masterCode", () => ({ verifyMasterCode: vi.fn() }));
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
  });

  it("valid master code enters admin mode", async () => {
    (verifyMasterCode as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    renderMelodic();

    fireEvent.change(screen.getByPlaceholderText("Admin PIN"), { target: { value: "correct" } });
    fireEvent.click(screen.getByText("→"));

    await waitFor(() => expect(screen.getByText("Admin mode")).toBeInTheDocument());
  });
});
