import { describe, it, expect, beforeEach } from "vitest";
import { OWNER_EXCLUSION_KEY, isOwnerExcluded, markOwnerExcluded } from "./ownerExclusion";

// Legacy dual-purpose key this module is migrating away from — hardcoded
// here (not imported) so these tests stay a black-box check of the public
// contract, matching the style of the other storage-key tests in this repo.
const LEGACY_MASTER_KEY = "pl_session_access";

describe("ownerExclusion", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns true when the new owner-exclusion key is already set", () => {
    localStorage.setItem(OWNER_EXCLUSION_KEY, "1");

    expect(isOwnerExcluded()).toBe(true);
  });

  it("returns true and backfills the new key when only the legacy master key is set", () => {
    localStorage.setItem(LEGACY_MASTER_KEY, "1");
    expect(localStorage.getItem(OWNER_EXCLUSION_KEY)).toBeNull();

    expect(isOwnerExcluded()).toBe(true);

    expect(localStorage.getItem(OWNER_EXCLUSION_KEY)).toBe("1");
  });

  it("returns false when neither key is set", () => {
    expect(isOwnerExcluded()).toBe(false);
    expect(localStorage.getItem(OWNER_EXCLUSION_KEY)).toBeNull();
  });

  it("markOwnerExcluded sets the new key directly, independent of the legacy key", () => {
    markOwnerExcluded();

    expect(localStorage.getItem(OWNER_EXCLUSION_KEY)).toBe("1");
    expect(localStorage.getItem(LEGACY_MASTER_KEY)).toBeNull();
  });

  it("stays excluded after pl_session_access is later removed, as long as pl_owner_exclusion remains — the actual architectural goal of the split", () => {
    markOwnerExcluded();
    localStorage.setItem(LEGACY_MASTER_KEY, "1");

    // Simulates a lock/relock action clearing only the legacy master-unlock
    // key (its real, legitimate job) via direct storage manipulation — not
    // a reintroduction of the old doLock() bug into production code, just
    // proof that the new key no longer depends on the old one surviving.
    localStorage.removeItem(LEGACY_MASTER_KEY);

    expect(isOwnerExcluded()).toBe(true);
  });
});
