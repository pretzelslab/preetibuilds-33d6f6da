import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup, waitFor } from "@testing-library/react";
import GoogleAnalyticsLoader from "./GoogleAnalyticsLoader";
import { shouldLoadGA, loadGA } from "@/lib/ga";
import { stubWindowLocation, restoreWindowLocation } from "@/test/locationStub";

vi.mock("@/lib/ga", () => ({
  shouldLoadGA: vi.fn(),
  loadGA: vi.fn(),
}));

describe("GoogleAnalyticsLoader — GA initialization is gated on server-verified owner status", () => {
  beforeEach(() => vi.restoreAllMocks());
  afterEach(() => cleanup());

  it("loads GA for a regular visitor (server says not the owner)", async () => {
    (shouldLoadGA as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    render(<GoogleAnalyticsLoader />);

    await waitFor(() => expect(loadGA).toHaveBeenCalledTimes(1));
  });

  it("skips GA initialization for the owner (server says isOwner:true)", async () => {
    (shouldLoadGA as ReturnType<typeof vi.fn>).mockResolvedValue(false);
    render(<GoogleAnalyticsLoader />);

    await waitFor(() => expect(shouldLoadGA).toHaveBeenCalledTimes(1));
    expect(loadGA).not.toHaveBeenCalled();
  });

  it("renders nothing", () => {
    (shouldLoadGA as ReturnType<typeof vi.fn>).mockResolvedValue(false);
    const { container } = render(<GoogleAnalyticsLoader />);
    expect(container.textContent).toBe("");
  });

  it("never even asks the server on /owner, before or after authentication", async () => {
    (shouldLoadGA as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    const originalLocation = stubWindowLocation({ pathname: "/owner" });

    render(<GoogleAnalyticsLoader />);
    await new Promise((r) => setTimeout(r, 0));

    expect(shouldLoadGA).not.toHaveBeenCalled();
    expect(loadGA).not.toHaveBeenCalled();

    restoreWindowLocation(originalLocation);
  });
});
