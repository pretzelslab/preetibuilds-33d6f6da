import { useEffect } from "react";
import { shouldLoadGA, loadGA } from "@/lib/ga";

// Mounted once, near the app root (see src/App.tsx). Renders nothing —
// purely decides, on a server-verified basis, whether to load Google
// Analytics at all for this browser. See src/lib/ga.ts for the fail-closed
// (never track the owner) reasoning.
export default function GoogleAnalyticsLoader() {
  useEffect(() => {
    // /owner must never trigger GA, before or after authentication — reading
    // this directly (rather than depending on react-router) also means a
    // real navigation to "/" after a successful /owner verification (see
    // src/pages/Owner.tsx) re-mounts this component fresh, so the
    // post-auth case is covered by the owner-status check below, not by
    // this path check having "expired".
    if (window.location.pathname === "/owner") return;

    let cancelled = false;
    shouldLoadGA().then((load) => {
      if (load && !cancelled) loadGA();
    });
    return () => { cancelled = true; };
  }, []);

  return null;
}
