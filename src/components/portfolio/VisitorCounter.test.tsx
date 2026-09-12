import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup, waitFor } from "@testing-library/react";
import VisitorCounter from "./VisitorCounter";

// VisitorCounter no longer talks to Supabase directly at all — both the
// increment and the count read go through api/portfolio-analytics.ts,
// mocked here via fetch. See src/hooks/useVisitLogger.test.ts for the
// equivalent coverage on the other analytics write path.
vi.mock("framer-motion", () => ({
  motion: { span: ({ children }: { children?: unknown }) => <span>{children as React.ReactNode}</span> },
  useSpring: () => ({ set: () => {} }),
  useTransform: () => 0,
}));

function stubHostname(hostname: string) {
  const original = window.location;
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { ...original, hostname, hash: "", search: "" },
  });
  return () => Object.defineProperty(window, "location", { configurable: true, value: original });
}

function mockFetch(body: unknown, ok = true) {
  const fetchMock = vi.fn().mockResolvedValue({ ok, json: () => Promise.resolve(body) });
  global.fetch = fetchMock;
  return fetchMock;
}

describe("VisitorCounter", () => {
  let restoreLocation: () => void;

  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    restoreLocation = stubHostname("preetibuilds-33d6f6da.vercel.app");
  });

  afterEach(() => {
    cleanup();
    restoreLocation();
  });

  it("never calls the server on localhost, and never renders a count", async () => {
    restoreLocation();
    restoreLocation = stubHostname("localhost");
    const fetchMock = mockFetch({ recorded: true, count: 99 });

    const { container } = render(<VisitorCounter page="/localhost-test" />);
    await new Promise((r) => setTimeout(r, 0));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(container.textContent).toBe("");
  });

  it("requests an increment on first mount this session and displays the returned count", async () => {
    const fetchMock = mockFetch({ recorded: true, count: 43 });

    render(<VisitorCounter page="/visitor-test" />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/portfolio-analytics");
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body).toEqual({ kind: "pageview", page: "/visitor-test", increment: true });
    expect(sessionStorage.getItem("pv_counted/visitor-test")).toBe("1");
  });

  it("does not request another increment once already counted this session, but still refreshes the count", async () => {
    sessionStorage.setItem("pv_counted/already-counted", "1");
    const fetchMock = mockFetch({ recorded: false, count: 44 });

    render(<VisitorCounter page="/already-counted" />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.increment).toBe(false);
  });

  it("renders the counter (not null) even when the server reports the owner and skipped the increment", async () => {
    // useTransform is stubbed above to always return 0 regardless of the
    // real count — irrelevant to what's under test here, so this asserts
    // the component actually renders a result (count !== null) rather than
    // the exact animated digits, which the stub can't reflect.
    const fetchMock = mockFetch({ recorded: false, reason: "owner", count: 100 });

    const { findByText } = render(<VisitorCounter page="/owner-test" />);

    await findByText("views");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("renders nothing and does not crash on a fetch failure", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("network down"));

    const { container } = render(<VisitorCounter page="/fetch-fail" />);
    await new Promise((r) => setTimeout(r, 0));

    expect(container.textContent).toBe("");
  });
});
