import { describe, it, expect } from "vitest";
import {
  isExcludedAnalyticsVisit,
  excludeOwnerVisits,
  OWNER_SIGNATURES,
  EXCLUDED_VISIT_IDS,
  type AnalyticsVisit,
} from "./analyticsExclusion";

const OWNER_DESKTOP_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36";
const OWNER_IPHONE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 26_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.6099.119 Mobile/15E148 Safari/604.1";
// A real, different browser build — same city, same country, same platform.
const OTHER_VANCOUVER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36";

let seq = 0;
function visit(over: Partial<AnalyticsVisit> = {}): AnalyticsVisit {
  return {
    id: `row-${++seq}`,
    page: "/",
    referrer: null,
    user_agent: OTHER_VANCOUVER_UA,
    visited_at: "2026-09-12T20:00:00.000Z",
    city: "Toronto",
    region: null,
    country: "Canada",
    ...over,
  };
}

describe("isExcludedAnalyticsVisit — owner rows", () => {
  it("excludes the owner desktop visit (Vancouver/Canada, ipapi.co geo shape)", () => {
    expect(
      isExcludedAnalyticsVisit(
        visit({ city: "Vancouver", country: "Canada", region: null, user_agent: OWNER_DESKTOP_UA })
      )
    ).toBe(true);
  });

  it("excludes the same desktop under the Vercel geo shape (Burnaby/BC/CA)", () => {
    expect(
      isExcludedAnalyticsVisit(
        visit({ city: "Burnaby", country: "CA", region: "BC", user_agent: OWNER_DESKTOP_UA })
      )
    ).toBe(true);
  });

  it("excludes the owner iPhone as its own signature, not a widened rule", () => {
    expect(
      isExcludedAnalyticsVisit(
        visit({ city: "Vancouver", country: "Canada", user_agent: OWNER_IPHONE_UA })
      )
    ).toBe(true);
  });

  it("excludes the known diagnostic rows by exact id", () => {
    expect(isExcludedAnalyticsVisit(visit({ id: EXCLUDED_VISIT_IDS[0] }))).toBe(true);
    expect(isExcludedAnalyticsVisit(visit({ id: EXCLUDED_VISIT_IDS[1] }))).toBe(true);
  });

  it("supports multiple owner signatures rather than one broad rule", () => {
    expect(OWNER_SIGNATURES.length).toBeGreaterThan(1);
    // No signature may be satisfiable without a full user-agent string.
    for (const sig of OWNER_SIGNATURES) {
      expect(sig.userAgent.length).toBeGreaterThan(40);
      expect(sig.city).toBeTruthy();
      expect(sig.country).toBeTruthy();
    }
  });
});

describe("isExcludedAnalyticsVisit — visitors who must NOT be excluded", () => {
  it("keeps a different Vancouver visitor (same city+country, different user agent)", () => {
    expect(
      isExcludedAnalyticsVisit(
        visit({ city: "Vancouver", country: "Canada", user_agent: OTHER_VANCOUVER_UA })
      )
    ).toBe(false);
  });

  it("keeps a different Canadian visitor on the owner's exact browser build", () => {
    expect(
      isExcludedAnalyticsVisit(
        visit({ city: "Toronto", country: "Canada", user_agent: OWNER_DESKTOP_UA })
      )
    ).toBe(false);
  });

  it("keeps a Vancouver visitor whose user agent merely starts the same way", () => {
    expect(
      isExcludedAnalyticsVisit(
        visit({
          city: "Vancouver",
          country: "Canada",
          user_agent: OWNER_DESKTOP_UA + " Edg/152.0.0.0",
        })
      )
    ).toBe(false);
  });

  it("keeps an ordinary visit with no geo captured", () => {
    expect(isExcludedAnalyticsVisit(visit({ city: null, country: null, user_agent: null }))).toBe(false);
  });

  it("does not exclude on city alone, or country alone", () => {
    expect(isExcludedAnalyticsVisit(visit({ city: "Vancouver", country: "Canada", user_agent: null }))).toBe(false);
    expect(isExcludedAnalyticsVisit(visit({ city: null, country: "Canada", user_agent: OWNER_DESKTOP_UA }))).toBe(false);
  });

  it("respects region when the signature specifies one", () => {
    // Burnaby signature requires region BC — a Burnaby row without it is a
    // different shape and must not match.
    expect(
      isExcludedAnalyticsVisit(
        visit({ city: "Burnaby", country: "CA", region: "ON", user_agent: OWNER_DESKTOP_UA })
      )
    ).toBe(false);
  });
});

describe("aggregate analytics use the same exclusion as Recent Visits", () => {
  const dataset: AnalyticsVisit[] = [
    visit({ city: "Vancouver", country: "Canada", user_agent: OWNER_DESKTOP_UA, page: "/" }),
    visit({ city: "Burnaby", country: "CA", region: "BC", user_agent: OWNER_DESKTOP_UA, page: "/research" }),
    visit({ city: "Vancouver", country: "Canada", user_agent: OWNER_IPHONE_UA, page: "/" }),
    visit({ city: "Vancouver", country: "Canada", user_agent: OTHER_VANCOUVER_UA, page: "/" }),
    visit({ city: "Toronto", country: "Canada", user_agent: OTHER_VANCOUVER_UA, page: "/melodic-framework" }),
    visit({ city: "Berlin", country: "Germany", user_agent: OTHER_VANCOUVER_UA, page: "/" }),
  ];

  const filtered = excludeOwnerVisits(dataset);

  it("drops exactly the three owner rows", () => {
    expect(dataset).toHaveLength(6);
    expect(filtered).toHaveLength(3);
  });

  it("total visits reflects the filtered set, not the raw set", () => {
    expect(filtered.length).toBe(3);
    expect(filtered.length).not.toBe(dataset.length);
  });

  it("location analytics exclude owner rows", () => {
    const cities = filtered.map(v => v.city);
    expect(cities).toEqual(expect.arrayContaining(["Vancouver", "Toronto", "Berlin"]));
    expect(cities.filter(c => c === "Burnaby")).toHaveLength(0);
    // The non-owner Vancouver visitor survives — Vancouver is not blanket-excluded.
    expect(cities.filter(c => c === "Vancouver")).toHaveLength(1);
  });

  it("device analytics exclude the owner's mobile visit", () => {
    const mobile = filtered.filter(v => /iPhone|Mobile/i.test(v.user_agent ?? ""));
    expect(mobile).toHaveLength(0);
  });

  it("unique-page analytics exclude owner-only pages", () => {
    const pages = new Set(filtered.map(v => v.page));
    expect(pages.has("/research")).toBe(false); // owner-only page in this dataset
    expect(pages.has("/melodic-framework")).toBe(true);
  });

  it("Recent Visits slice and Total Visits derive from one array, so they agree", () => {
    const PAGE_SIZE = 2;
    const total = filtered.length;
    const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const allPaged = Array.from({ length: pageCount }, (_, i) =>
      filtered.slice(i * PAGE_SIZE, (i + 1) * PAGE_SIZE)
    ).flat();

    // Every row reachable through pagination is counted in the total, and
    // every counted row is reachable — no row can vanish from the list while
    // still inflating the total.
    expect(allPaged).toHaveLength(total);
    expect(allPaged.map(v => v.id)).toEqual(filtered.map(v => v.id));
    for (const v of allPaged) expect(isExcludedAnalyticsVisit(v)).toBe(false);
  });
});
