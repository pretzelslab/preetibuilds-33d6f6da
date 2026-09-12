import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, cleanup } from "@testing-library/react";
import { logVisit, useVisitLogger } from "./useVisitLogger";

// The browser no longer talks to Supabase directly for this at all — every
// write goes through api/portfolio-analytics.ts, mocked here via fetch.
// Owner-exclusion is no longer decided client-side (see
// src/lib/ownerExclusion.ts) — these tests reflect that: there is no
// "owner flag" to pre-seed anymore, only server-response shapes to mock.

function mockFetch(response: { ok: boolean; status?: number; body?: unknown }) {
  const fetchMock = vi.fn().mockImplementation(() =>
    response.ok
      ? Promise.resolve({ ok: true, json: () => Promise.resolve(response.body) })
      : Promise.resolve({ ok: false, status: response.status ?? 500, json: () => Promise.resolve(response.body) })
  );
  global.fetch = fetchMock;
  return fetchMock;
}

function mockFetchRejects() {
  const fetchMock = vi.fn().mockRejectedValue(new Error("network down"));
  global.fetch = fetchMock;
  return fetchMock;
}

describe("logVisit", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("posts to the portfolio-analytics endpoint and returns handled+recorded on success", async () => {
    const fetchMock = mockFetch({ ok: true, body: { recorded: true } });

    const result = await logVisit("page-success");

    expect(result).toEqual({ handled: true, recorded: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/portfolio-analytics");
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body).toMatchObject({ kind: "visit", page: "page-success" });
  });

  it("treats an owner-skip response as handled but not recorded", async () => {
    mockFetch({ ok: true, body: { recorded: false, reason: "owner" } });

    const result = await logVisit("page-owner");

    expect(result).toEqual({ handled: true, recorded: false });
  });

  it("treats a non-ok response as unhandled, eligible for a later retry", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFetch({ ok: false, status: 502, body: { recorded: false, reason: "error" } });

    const result = await logVisit("page-fail");

    expect(result).toEqual({ handled: false, recorded: false });
    expect(errorSpy).toHaveBeenCalled();
  });

  it("treats a network error as unhandled, eligible for a later retry", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFetchRejects();

    const result = await logVisit("page-network-fail");

    expect(result).toEqual({ handled: false, recorded: false });
    expect(errorSpy).toHaveBeenCalled();
  });

  it("does not double-post when called again while the first attempt is still in flight", async () => {
    let resolveFetch: (v: unknown) => void;
    const fetchMock = vi.fn().mockImplementation(
      () => new Promise((resolve) => { resolveFetch = resolve; })
    );
    global.fetch = fetchMock;

    const first = logVisit("page-dup");
    const second = logVisit("page-dup"); // fired before `first` has resolved

    expect(await second).toEqual({ handled: false, recorded: false }); // rejected purely for being concurrent

    resolveFetch!({ ok: true, json: () => Promise.resolve({ recorded: true }) });
    expect(await first).toEqual({ handled: true, recorded: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

function stubHostname(hostname: string) {
  const original = window.location;
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { ...original, hostname, hash: "", search: "" },
  });
  return () => Object.defineProperty(window, "location", { configurable: true, value: original });
}

describe("useVisitLogger", () => {
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

  it("never calls the server on localhost", async () => {
    restoreLocation();
    restoreLocation = stubHostname("localhost");
    const fetchMock = mockFetch({ ok: true, body: { recorded: true } });

    renderHook(() => useVisitLogger("page-localhost"));
    await new Promise((r) => setTimeout(r, 0));

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("calls the server for an ordinary page load — there is no client-side owner gate anymore", async () => {
    const fetchMock = mockFetch({ ok: true, body: { recorded: true } });

    renderHook(() => useVisitLogger("page-visitor"));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  });

  it("still calls the server even when the legacy pl_owner_exclusion flag is set — that flag no longer gates anything client-side", async () => {
    localStorage.setItem("pl_owner_exclusion", "1");
    const fetchMock = mockFetch({ ok: true, body: { recorded: false, reason: "owner" } });

    renderHook(() => useVisitLogger("page-legacy-flag-present"));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  });

  it("marks sessionStorage as seen once the server gives a definitive answer, even when it was an owner-skip", async () => {
    const fetchMock = mockFetch({ ok: true, body: { recorded: false, reason: "owner" } });

    const first = renderHook(() => useVisitLogger("page-owner-session-dedup"));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    first.unmount();

    renderHook(() => useVisitLogger("page-owner-session-dedup"));
    await new Promise((r) => setTimeout(r, 0));

    expect(fetchMock).toHaveBeenCalledTimes(1); // not called again this tab session
  });

  it("does NOT mark sessionStorage as seen on a failed request, so a later mount retries", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const fetchMock = mockFetch({ ok: false, status: 502, body: {} });

    const first = renderHook(() => useVisitLogger("page-retry-eligible"));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    first.unmount();

    renderHook(() => useVisitLogger("page-retry-eligible"));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });

  it("skips self-referrals from other portfolio pages without calling the server", async () => {
    restoreLocation();
    const original = window.location;
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...original, hostname: "preetibuilds-33d6f6da.vercel.app", hash: "", search: "" },
    });
    Object.defineProperty(document, "referrer", {
      configurable: true,
      value: "https://preetibuilds-33d6f6da.vercel.app/some-other-page",
    });
    const fetchMock = mockFetch({ ok: true, body: { recorded: true } });

    renderHook(() => useVisitLogger("page-self-referral"));
    await new Promise((r) => setTimeout(r, 0));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(sessionStorage.getItem("vl_page-self-referral")).toBe("1");

    Object.defineProperty(document, "referrer", { configurable: true, value: "" });
    restoreLocation = () => Object.defineProperty(window, "location", { configurable: true, value: original });
  });
});
