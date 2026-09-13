import { useState } from "react";
import { Link } from "react-router-dom";
import { verifyMasterCode } from "@/lib/masterCode";
import { markOwnerExcluded } from "@/lib/ownerExclusion";

// Dedicated entry point for establishing owner status on a new browser or
// device. Deliberately does NOT call useVisitLogger or render
// VisitorCounter/GoogleAnalyticsLoader-affecting content — this page must
// never log a visit or increment page_views, and GA4 must never initialize
// here, before or after authentication (see src/components/GoogleAnalyticsLoader.tsx's
// own /owner check for the "before" half of that guarantee).
//
// Server verification (api/verify-master-code.ts) is what actually
// establishes the authoritative pl_owner cookie on success. The localStorage
// writes here are UI-state only, kept in sync with the other three
// master-code entry points (PageGate, Tracker, Comments, MelodicFramework)
// so the rest of the site reads as already-unlocked afterward.
const MASTER_KEY = "pl_session_access";

export default function Owner() {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || submitting) return;
    setSubmitting(true);
    setError(false);

    // Sent exactly as entered. The master code is a server-side secret
    // compared byte-for-byte in api/verify-master-code.ts — it is NOT a
    // human-friendly page code. The .toUpperCase().trim() that used to be
    // here was page-code normalization (see PageGate's PAGE_CODES) copied
    // onto this path, and it made any mixed-case PORTFOLIO_MASTER_CODE
    // impossible to authenticate with from this page.
    const valid = await verifyMasterCode(code);
    if (valid) {
      try { localStorage.setItem(MASTER_KEY, "1"); } catch { /* storage unavailable — cookie is still authoritative */ }
      markOwnerExcluded();
      // A real navigation, not client-side routing — so every root-mounted
      // piece of the app (GoogleAnalyticsLoader in particular) re-evaluates
      // owner status fresh against the cookie the server just set.
      window.location.href = "/";
      return;
    }

    setSubmitting(false);
    setError(true);
    setCode("");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background text-foreground px-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-lg font-semibold">Owner Access</h1>
          <p className="text-xs text-muted-foreground">
            Enter the portfolio master code to mark this browser as trusted.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Master code"
            aria-label="Master code"
            className={`w-full px-3 py-2 rounded-lg border bg-background text-sm outline-none text-center font-mono tracking-widest transition-colors ${
              error ? "border-rose-500" : "border-border focus:border-primary"
            }`}
          />
          {error && <p className="text-xs text-rose-500 text-center">Incorrect code.</p>}
          <button
            type="submit"
            disabled={submitting || !code.trim()}
            className="w-full py-2 rounded-lg bg-foreground text-background text-sm font-semibold hover:opacity-80 disabled:opacity-40 transition-opacity"
          >
            {submitting ? "Verifying…" : "Continue"}
          </button>
        </form>
        <p className="text-center">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            ← Back to portfolio
          </Link>
        </p>
      </div>
    </main>
  );
}
