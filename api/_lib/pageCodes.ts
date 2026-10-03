// Page-specific share codes (selective access, shared one at a time with
// specific visitors). These are checked client-side in PageGate and therefore
// ship in the public JS bundle — they are NOT secrets.
//
// Lives under api/_lib (not a route — "_" prefix) so both the frontend
// (PageGate) and the server (api/verify-master-code.ts, which must refuse any
// master code equal to one of these) read the same single list.
export const PAGE_CODES: Record<string, string> = {
  "research":                  "RSC2026",
  "carbon-depth":              "CDX2026",
  "ai-readiness":              "ARD2026",
  "fairness":                  "FAR2026",
  "carbon-fairness":           "CFR2026",
  "client-discovery":          "CLN2026",
  "melodic":                   "MEL2026",
  "admin":                     "ADM2026",
  "sustainability-framework":  "SFW2026",
  "ai-sustainability-webinar": "WBN2026",
  "privacy-auditor":           "PRI2026",
  "safety-eval":               "SE1",
  "carbon-time-travel":        "CTT2026",
  "agent-hijacking":           "AC42026",
  "win-loss":                  "WLI2026",
  "human-evolution":           "HEV2026",
  "geo-pipeline":              "GEO2026",
  "gtm-ai-readiness":          "GTM2026",
  "ai-value-lab":              "AVL2026",
};

// Case-insensitive on purpose: PageGate upper-cases/trims page-code input, so
// a master code that differs from a page code only by case or whitespace would
// still collide with it from a visitor's point of view.
export function isPageCode(code: string): boolean {
  const normalized = code.trim().toUpperCase();
  return Object.values(PAGE_CODES).some((c) => c.toUpperCase() === normalized);
}
