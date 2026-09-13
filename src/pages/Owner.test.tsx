import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { verifyMasterCode } from "@/lib/masterCode";
import { markOwnerExcluded } from "@/lib/ownerExclusion";
import { stubWindowLocation, restoreWindowLocation } from "@/test/locationStub";
import Owner from "./Owner";

// Master code verification is server-side (api/verify-master-code.ts) —
// mocked directly, same pattern as PageGate.test.tsx, so these tests don't
// need to know about that network call's shape.
vi.mock("@/lib/masterCode", () => ({ verifyMasterCode: vi.fn() }));
vi.mock("@/lib/ownerExclusion", () => ({ markOwnerExcluded: vi.fn() }));

const MASTER_KEY = "pl_session_access";

function renderOwner() {
  return render(
    <MemoryRouter>
      <Owner />
    </MemoryRouter>
  );
}

describe("Owner page — dedicated /owner entry point", () => {
  let originalLocation: Location;

  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    originalLocation = stubWindowLocation({ href: "http://localhost/owner" });
  });

  afterEach(() => {
    cleanup();
    restoreWindowLocation(originalLocation);
  });

  it("on a correct master code: sets the local unlock flag, marks owner-excluded, and navigates to /", async () => {
    (verifyMasterCode as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    renderOwner();

    fireEvent.change(screen.getByLabelText("Master code"), { target: { value: "correctcode" } });
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => expect(window.location.href).toBe("/"));
    // Was asserting "CORRECTCODE" — i.e. it pinned the uppercasing that broke
    // production owner login on 2026-09-13 for any mixed-case master code.
    // The secret is compared byte-for-byte server-side, so it must arrive
    // exactly as typed. See src/lib/masterCodeCasing.test.ts.
    expect(verifyMasterCode).toHaveBeenCalledWith("correctcode");
    expect(localStorage.getItem(MASTER_KEY)).toBe("1");
    expect(markOwnerExcluded).toHaveBeenCalledTimes(1);
  });

  it("on an incorrect master code: shows an error, establishes nothing, and does not navigate", async () => {
    (verifyMasterCode as ReturnType<typeof vi.fn>).mockResolvedValue(false);
    renderOwner();

    fireEvent.change(screen.getByLabelText("Master code"), { target: { value: "wrong" } });
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => expect(screen.getByText("Incorrect code.")).toBeInTheDocument());
    expect(localStorage.getItem(MASTER_KEY)).toBeNull();
    expect(markOwnerExcluded).not.toHaveBeenCalled();
    expect(window.location.href).toBe("http://localhost/owner");
  });

  it("makes no network call at all on mount — no visit log, no pageview, until the form is submitted", async () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock;
    renderOwner();

    await new Promise((r) => setTimeout(r, 0));

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
