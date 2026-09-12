// ── NOT the analytics-exclusion authority anymore ──────────────────────────────
// This localStorage flag is kept ONLY for UI purposes (e.g. showing an
// "owner mode" affordance instantly, without waiting on a network round
// trip). It has NO bearing on whether a visit/pageview is actually recorded
// — that decision is made server-side in api/portfolio-analytics.ts, from
// the signed, HttpOnly `pl_owner` cookie (see api/_lib/ownerCookie.ts),
// which a browser cannot set or forge on its own. A browser with this key
// present but no valid owner cookie (e.g. cleared cookies, a different
// device that copied localStorage some other way) is still fully tracked;
// a browser with a valid owner cookie is excluded regardless of this key.
//
// Persistent, standalone signal for "this browser belongs to the portfolio
// owner" — deliberately a SEPARATE key from "pl_session_access" (the
// portfolio master-unlock flag). The two used to be the same key, which
// meant any code that legitimately locks/relocks the master-unlock flag
// (e.g. the AI Governance page's "Lock page" preview button) was also
// capable of silently turning off analytics exclusion. See Tracker.tsx's
// doLock() for the incident this was split out to prevent from recurring.
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
