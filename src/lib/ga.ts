// Conditional Google Analytics loading. GA must never load at all for the
// portfolio owner's own browser — index.html no longer loads it
// unconditionally; this module decides, based on a server-side owner check
// (never anything client-state-based), whether to load it.

export const GA_MEASUREMENT_ID = "G-V7H8XFTNE8";

// Asks the server whether this browser is the owner, via its signed
// pl_owner cookie — the response is a bare boolean, never the cookie value
// or the underlying secret. Fails CLOSED on the side of privacy: any
// network error, non-OK response, or unexpected shape is treated as "don't
// load GA", not "assume visitor". This trades a little visitor-analytics
// completeness (a failed check means even real visitors miss a beacon) for
// the stated priority of never risking the owner being tracked.
export async function shouldLoadGA(): Promise<boolean> {
  try {
    const res = await fetch("/api/owner-status");
    if (!res.ok) return false;
    const data = await res.json();
    return data?.isOwner === false;
  } catch {
    return false;
  }
}

let loaded = false;

export function loadGA(measurementId: string = GA_MEASUREMENT_ID): void {
  if (loaded) return;
  loaded = true;

  const w = window as typeof window & { dataLayer?: unknown[] };
  w.dataLayer = w.dataLayer || [];
  function gtag(...args: unknown[]) {
    w.dataLayer!.push(args);
  }
  gtag("js", new Date());
  gtag("config", measurementId);

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);
}
