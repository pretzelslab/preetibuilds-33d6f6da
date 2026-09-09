import { describe, it, expect, vi, beforeEach } from "vitest";
import { govDb } from "@/lib/supabase-governance";
import { logVisit } from "./useVisitLogger";

vi.mock("@/lib/supabase-governance", () => ({
  govDb: { from: vi.fn() },
}));

// Each test uses its own page id (== its own sessionKey) so the module-level
// inFlight guard in useVisitLogger.ts can't leak state between tests.
function mockInsert(result: { error: { message: string } | null }) {
  const insert = vi.fn().mockResolvedValue(result);
  (govDb.from as ReturnType<typeof vi.fn>).mockReturnValue({ insert });
  return insert;
}

function mockGeoFetch(ok: boolean, body?: Record<string, unknown>) {
  global.fetch = vi.fn().mockImplementation(() =>
    ok
      ? Promise.resolve({ ok: true, json: () => Promise.resolve(body) })
      : Promise.reject(new DOMException("The operation was aborted.", "AbortError"))
  );
}

// Unlike mockGeoFetch(false), which rejects immediately, this never resolves
// on its own — it only rejects once the request's AbortSignal actually fires,
// so the timeout test below exercises the real 4000ms bound via fake timers
// instead of assuming the abort happens.
function mockGeoFetchHangsUntilAborted() {
  global.fetch = vi.fn().mockImplementation((_url: string, opts: { signal: AbortSignal }) =>
    new Promise((_resolve, reject) => {
      opts.signal.addEventListener("abort", () =>
        reject(new DOMException("The operation was aborted.", "AbortError"))
      );
    })
  );
}

function mockInsertSequence(results: Array<{ error: { message: string } | null }>) {
  const insert = vi.fn();
  for (const r of results) insert.mockResolvedValueOnce(r);
  (govDb.from as ReturnType<typeof vi.fn>).mockReturnValue({ insert });
  return insert;
}

describe("logVisit", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("records a successful visit with geolocation and returns true", async () => {
    mockGeoFetch(true, { city: "Austin", region: "TX", country: "US" });
    const insert = mockInsert({ error: null });

    const result = await logVisit("page-success");

    expect(result).toBe(true);
    expect(insert).toHaveBeenCalledTimes(1);
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ page: "page-success", city: "Austin", region: "TX", country: "US" })
    );
  });

  it("leaves a failed insert eligible for a later attempt instead of marking it done", async () => {
    mockGeoFetch(true, { city: "Austin", region: "TX", country: "US" });
    const insert = mockInsert({ error: { message: "column visit_logs.region does not exist" } });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await logVisit("page-fail");

    expect(result).toBe(false); // caller must NOT write sessionStorage on this outcome
    expect(insert).toHaveBeenCalledTimes(1); // failure isn't retried automatically — no loop
    expect(errorSpy).toHaveBeenCalledWith(
      "[visit_logs insert failed]",
      "column visit_logs.region does not exist"
    );
  });

  it("does not double-insert when called again while the first attempt is still in flight", async () => {
    mockGeoFetch(true, { city: "Austin", region: "TX", country: "US" });
    const insert = mockInsert({ error: null });

    const first = logVisit("page-dup");
    const second = logVisit("page-dup"); // fired before `first` has resolved

    const [firstResult, secondResult] = await Promise.all([first, second]);

    expect(firstResult).toBe(true);
    expect(secondResult).toBe(false); // rejected purely for being concurrent, not a real failure
    expect(insert).toHaveBeenCalledTimes(1);
  });

  it("still records the visit (with null location) when the geolocation lookup fails", async () => {
    // Simulates api/geo.ts being unreachable or aborting via the 4000ms
    // AbortSignal.timeout in getLocation() — that bound is fixed in source
    // and isn't re-tested here with a real 4s wait; this checks the fallback
    // path it triggers, which is what determines whether the visit is lost.
    mockGeoFetch(false);
    const insert = mockInsert({ error: null });

    const result = await logVisit("page-geo-fail");

    expect(result).toBe(true);
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ page: "page-geo-fail", city: null, region: null, country: null })
    );
  });

  it("still records the visit once the geolocation request actually hits its 4000ms timeout", async () => {
    vi.useFakeTimers();
    mockGeoFetchHangsUntilAborted();
    const insert = mockInsert({ error: null });

    const resultPromise = logVisit("page-real-timeout");
    await vi.advanceTimersByTimeAsync(4000);
    const result = await resultPromise;

    expect(result).toBe(true);
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ page: "page-real-timeout", city: null, region: null, country: null })
    );
    vi.useRealTimers();
  });

  it("succeeds on a later attempt after an earlier attempt for the same page failed", async () => {
    mockGeoFetch(true, { city: "Austin", region: "TX", country: "US" });
    const insert = mockInsertSequence([
      { error: { message: "temporary failure" } },
      { error: null },
    ]);
    vi.spyOn(console, "error").mockImplementation(() => {});

    const first = await logVisit("page-retry-later");
    expect(first).toBe(false); // not marked done — caller leaves it eligible to retry

    const second = await logVisit("page-retry-later");
    expect(second).toBe(true); // the earlier failure didn't leave inFlight stuck

    expect(insert).toHaveBeenCalledTimes(2);
  });
});
