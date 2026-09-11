// Persistent, standalone signal for "this browser belongs to the portfolio
// owner and should never be written into visit_logs / page_views" —
// deliberately a SEPARATE key from "pl_session_access" (the portfolio
// master-unlock flag). The two used to be the same key, which meant any
// code that legitimately locks/relocks the master-unlock flag (e.g. the AI
// Governance page's "Lock page" preview button) was also capable of
// silently turning off analytics exclusion. See Tracker.tsx's doLock() for
// the incident this was split out to prevent from recurring.
export const OWNER_EXCLUSION_KEY = "pl_owner_exclusion";

// Legacy key, kept only as a one-release migration fallback for browsers
// that were master-unlocked before this split existed. Not a permanent
// second source of truth — isOwnerExcluded() backfills OWNER_EXCLUSION_KEY
// from it and, going forward, this key is never consulted again on that
// browser once the backfill has happened.
const LEGACY_MASTER_KEY = "pl_session_access";

export function markOwnerExcluded(): void {
  try {
    localStorage.setItem(OWNER_EXCLUSION_KEY, "1");
  } catch {
    // Storage disabled/unavailable (e.g. Safari private mode) — exclusion
    // simply won't persist on this browser, same failure mode as today.
  }
}

export function isOwnerExcluded(): boolean {
  try {
    if (localStorage.getItem(OWNER_EXCLUSION_KEY) === "1") return true;
    if (localStorage.getItem(LEGACY_MASTER_KEY) === "1") {
      markOwnerExcluded(); // one-time migration backfill
      return true;
    }
  } catch {
    // Storage disabled/unavailable — fail open to "not excluded", matching
    // the previous behavior of the single-key check.
  }
  return false;
}
