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
});
