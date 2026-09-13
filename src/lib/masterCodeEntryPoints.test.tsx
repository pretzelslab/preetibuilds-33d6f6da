import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { verifyMasterCode } from "@/lib/masterCode";
import { stubWindowLocation, restoreWindowLocation } from "@/test/locationStub";
import { PageGate } from "@/components/ui/PageGate";
import Owner from "@/pages/Owner";
import AIGovernanceTracker from "@/components/ai-governance/Tracker";

// Companion to masterCodeCasing.test.ts. That file pins the SERVER contract
// (exact bytes); this one pins the CLIENT side of the same contract for the
// three entry points that used to mutate the input: whatever the user types
// must reach verifyMasterCode() unchanged.
//
// Page codes are deliberately excluded from that rule and are re-verified
// here as still case-insensitive — they are human-friendly strings compared
// in the browser, not server-side secrets.
vi.mock("@/lib/masterCode", () => ({ verifyMasterCode: vi.fn() }));
vi.mock("@/lib/ownerExclusion", () => ({
  markOwnerExcluded: vi.fn(),
  isOwnerExcluded: vi.fn(() => false),
  excludeOwnerVisits: vi.fn((v: unknown[]) => v),
}));

// THROWAWAY fixture — same shape as a real rotated secret (upper + lower +
// digits), never a real PORTFOLIO_MASTER_CODE.
const MIXED_CASE_SECRET = "Tz7Kq4Mx9Rb2Wv";

const asMock = (fn: unknown) => fn as ReturnType<typeof vi.fn>;

// useVisitLogger posts to api/portfolio-analytics.ts — mocked so nothing
// touches the network.
function mockAnalyticsFetch() {
  global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ recorded: true }) });
}

describe("master code reaches verifyMasterCode exactly as entered", () => {
  let originalLocation: Location;

  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    mockAnalyticsFetch();
    asMock(verifyMasterCode).mockResolvedValue(true);
  });

  afterEach(() => cleanup());

  // ── (g) /owner ─────────────────────────────────────────────────────────────
  describe("(g) Owner page", () => {
    beforeEach(() => {
      originalLocation = stubWindowLocation({ href: "http://localhost/owner" });
    });
    afterEach(() => restoreWindowLocation(originalLocation));

    it("sends the master code unchanged", async () => {
      render(<MemoryRouter><Owner /></MemoryRouter>);

      fireEvent.change(screen.getByLabelText("Master code"), { target: { value: MIXED_CASE_SECRET } });
      fireEvent.click(screen.getByRole("button", { name: /continue/i }));

      await waitFor(() => expect(verifyMasterCode).toHaveBeenCalled());
      expect(verifyMasterCode).toHaveBeenCalledWith(MIXED_CASE_SECRET);
      expect(verifyMasterCode).not.toHaveBeenCalledWith(MIXED_CASE_SECRET.toUpperCase());
    });
  });

  // ── (h) PageGate master override ───────────────────────────────────────────
  describe("(h) PageGate", () => {
    function renderGate() {
      return render(
        <MemoryRouter>
          <PageGate pageId="research" previewContent={<div>Preview</div>}>
            <div>Secret content</div>
          </PageGate>
        </MemoryRouter>
      );
    }

    it("sends the master code unchanged", async () => {
      renderGate();

      fireEvent.click(screen.getByText("Enter code"));
      fireEvent.change(screen.getByPlaceholderText("Access code"), { target: { value: MIXED_CASE_SECRET } });
      fireEvent.click(screen.getByText("Unlock"));

      await waitFor(() => expect(screen.getByText("Secret content")).toBeInTheDocument());
      expect(verifyMasterCode).toHaveBeenCalledWith(MIXED_CASE_SECRET);
      expect(verifyMasterCode).not.toHaveBeenCalledWith(MIXED_CASE_SECRET.toUpperCase());
    });

    // The reason the normalization existed at all. Page codes must keep
    // working case-insensitively — this is the behavior the fix preserves.
    it("still accepts a page code in the wrong case, without calling the server", async () => {
      renderGate();

      fireEvent.click(screen.getByText("Enter code"));
      fireEvent.change(screen.getByPlaceholderText("Access code"), { target: { value: "  rsc2026  " } });
      fireEvent.click(screen.getByText("Unlock"));

      await waitFor(() => expect(screen.getByText("Secret content")).toBeInTheDocument());
      expect(localStorage.getItem("pl_access_research")).toBe("1");
      // Matched locally as a page code — the master-code endpoint is not consulted,
      // and the site-wide master key is not granted.
      expect(verifyMasterCode).not.toHaveBeenCalled();
      expect(localStorage.getItem("pl_session_access")).toBeNull();
    });
  });

  // ── (i) Tracker master override ────────────────────────────────────────────
  describe("(i) AI Governance Tracker", () => {
    let restoreHostname: () => void;

    beforeEach(() => {
      const original = window.location;
      Object.defineProperty(window, "location", {
        configurable: true,
        value: { ...original, hostname: "preetibuilds-33d6f6da.vercel.app", hash: "", search: "" },
      });
      restoreHostname = () =>
        Object.defineProperty(window, "location", { configurable: true, value: original });
    });
    afterEach(() => restoreHostname());

    it("sends the master code unchanged", async () => {
      render(<MemoryRouter><AIGovernanceTracker /></MemoryRouter>);

      fireEvent.click(screen.getByText("Owner login"));
      fireEvent.change(screen.getByPlaceholderText("Access code"), { target: { value: MIXED_CASE_SECRET } });
      fireEvent.click(screen.getByText("Unlock →"));

      await waitFor(() => expect(verifyMasterCode).toHaveBeenCalled());
      expect(verifyMasterCode).toHaveBeenCalledWith(MIXED_CASE_SECRET);
      expect(verifyMasterCode).not.toHaveBeenCalledWith(MIXED_CASE_SECRET.toUpperCase());
    });
  });
});
