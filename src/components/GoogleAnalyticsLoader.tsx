import { useEffect } from "react";
import { shouldLoadGA, loadGA } from "@/lib/ga";

// Mounted once, near the app root (see src/App.tsx). Renders nothing —
// purely decides, on a server-verified basis, whether to load Google
// Analytics at all for this browser. See src/lib/ga.ts for the fail-closed
// (never track the owner) reasoning.
export default function GoogleAnalyticsLoader() {
  useEffect(() => {
    let cancelled = false;
    shouldLoadGA().then((load) => {
      if (load && !cancelled) loadGA();
    });
    return () => { cancelled = true; };
  }, []);

  return null;
}
