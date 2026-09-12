// ── Layer 3: Admin-side owner analytics exclusion ─────────────────────────────
//
// The single source of truth for "should this stored visit row count towards
// analytics". Layers 1 (client short-circuit in useVisitLogger) and 2 (signed
// pl_owner cookie checked in api/portfolio-analytics.ts) stop owner visits
// being WRITTEN. This layer stops any that already exist — or that slip past
// both — from being COUNTED or DISPLAYED.
//
// Nothing here deletes or mutates a database row. Every visit_logs row stays
// exactly as recorded; this is a read-side filter only. There is deliberately
// no Supabase schema change and no RLS change behind it.
//
// IMPORTANT: every analytics surface in Admin must derive from the same
// filtered array. Filtering Recent Visits but not the totals (or vice versa)
// is the specific bug this module exists to make impossible — see
// src/pages/Admin.tsx, which filters ONCE and derives everything downstream.

export interface AnalyticsVisit {
  id: string;
  page: string;
  referrer: string | null;
  user_agent: string | null;
  visited_at: string;
  city: string | null;
  region: string | null;
  country: string | null;
}

// ── Signature matching ────────────────────────────────────────────────────────
//
// visit_logs has NO stable visitor id, session id, or client id — the columns
// are id, page, referrer, user_agent, visited_at, city, region, country. A
// per-row uuid identifies the visit, not the visitor, so it cannot recognise a
// future visit. With nothing stronger available, the narrowest reliable
// signature is an exact composite: city + country (+ region where captured) +
// the complete user-agent string.
//
// Deliberately NOT used, and must never be:
//   • city alone      — would exclude every Vancouver visitor
//   • country alone   — would exclude every Canadian visitor
//   • IP address      — not stored, and not to be introduced for this
//   • UA family/prefix — would exclude any visitor on the same browser+city
//
// Each device/browser gets its OWN entry. When a new owner device appears, add
// another entry — never widen an existing one.
//
// MAINTENANCE NOTE: Chrome auto-updates change the version inside the UA
// string, which mints a new signature every few weeks (the 147 → 148 → 152
// progression below is one machine updating over time). That is the accepted
// cost of an exact match: it can go stale, but it can never over-match. When
// owner visits reappear in analytics, add the new UA here — Layers 1 and 2
// should normally prevent the row existing at all.
export interface OwnerSignature {
  city: string;
  country: string;
  /** Only compared when set — production's ipapi.co path never captured region. */
  region?: string;
  userAgent: string;
  note: string;
}

export const OWNER_SIGNATURES: OwnerSignature[] = [
  {
    // Current desktop. Geo shape "Vancouver / Canada" (country as full name,
    // region null) is production's ipapi.co path in src/hooks/useVisitLogger.ts.
    city: "Vancouver",
    country: "Canada",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36",
    note: "Owner desktop — Windows/Chrome 152, geo via ipapi.co (production build)",
  },
  {
    // Same machine, different geo shape: "Burnaby / BC / CA" (ISO country code,
    // region present) is the server-side Vercel header path in
    // api/portfolio-analytics.ts. Vercel resolves this ISP to Burnaby.
    city: "Burnaby",
    country: "CA",
    region: "BC",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36",
    note: "Owner desktop — Windows/Chrome 152, geo via Vercel headers (preview build)",
  },
  {
    city: "Vancouver",
    country: "Canada",
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 26_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.6099.119 Mobile/15E148 Safari/604.1",
    note: "Owner iPhone — Chrome on iOS (CriOS 120)",
  },
  {
    // Historical: same desktop before Chrome auto-updated to 152.
    city: "Vancouver",
    country: "Canada",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
    note: "Owner desktop — Windows/Chrome 148 (pre-update)",
  },
  {
    city: "Vancouver",
    country: "Canada",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36",
    note: "Owner desktop — Windows/Chrome 147 (pre-update)",
  },
];

// Confirmed diagnostic/test rows from the 2026-09-08/09 geo-access verification
// work. Excluded by exact row id — not by an `is_test` column, because the live
// schema has none and no migration is being applied for this work. The rows
// stay in the database; they simply stop reaching any analytics surface.
export const EXCLUDED_VISIT_IDS: string[] = [
  "3bd1759f-d5bc-4e24-8ebf-8349f8a67bcf",
  "bcefab34-ed23-49d9-af04-0abb2be74deb",
];

function matchesSignature(visit: AnalyticsVisit, sig: OwnerSignature): boolean {
  if (visit.city !== sig.city) return false;
  if (visit.country !== sig.country) return false;
  if (sig.region !== undefined && visit.region !== sig.region) return false;
  // Exact, whole-string comparison — never a prefix or substring test, so a
  // different browser build on the same machine/city does not match.
  return visit.user_agent === sig.userAgent;
}

/**
 * True when this stored visit must be kept out of every analytics surface:
 * Recent Visits, Total Visits, unique-page and device counts, location and
 * referrer breakdowns, the 7-day chart, summary cards, and the pagination
 * arithmetic derived from them.
 *
 * This is the ONLY place that decision is made. Do not add a second filter
 * anywhere else — call this instead.
 */
export function isExcludedAnalyticsVisit(visit: AnalyticsVisit): boolean {
  if (EXCLUDED_VISIT_IDS.includes(visit.id)) return true;
  return OWNER_SIGNATURES.some(sig => matchesSignature(visit, sig));
}

/** Convenience wrapper — the one filter every Admin analytics surface uses. */
export function excludeOwnerVisits<T extends AnalyticsVisit>(visits: T[]): T[] {
  return visits.filter(v => !isExcludedAnalyticsVisit(v));
}
