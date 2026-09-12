import { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { Eye } from "lucide-react";

const SESSION_KEY = "pv_counted";

const AnimatedNumber = ({ value }: { value: number }) => {
  const spring  = useSpring(0, { stiffness: 50, damping: 20 });
  const display = useTransform(spring, (v) => Math.round(v).toLocaleString());
  useEffect(() => { spring.set(value); }, [value, spring]);
  return <motion.span>{display}</motion.span>;
};

const VisitorCounter = ({ page = "/" }: { page?: string }) => {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    // Never touch production page_views from a local dev checkout — matches
    // the same guard useVisitLogger uses. Without this, `npm run dev` would
    // increment the real deployed counter, since .env.local points at the
    // same Supabase project as Preview/Production.
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") return;

    // Increment at most once per tab session per page — but always ask the
    // server for the current count so the displayed number stays fresh on
    // every mount. The server alone decides (via its signed owner cookie)
    // whether an increment we ask for actually happens; this component has
    // no owner-exclusion logic of its own.
    const alreadyIncremented = !!sessionStorage.getItem(SESSION_KEY + page);

    async function track() {
      try {
        const res = await fetch("/api/portfolio-analytics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind: "pageview", page, increment: !alreadyIncremented }),
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!alreadyIncremented) sessionStorage.setItem(SESSION_KEY + page, "1");
        if (typeof data?.count === "number") setCount(data.count);
      } catch {
        // Silent — the counter just won't render this mount, nothing to retry.
      }
    }

    track();
  }, [page]);

  if (count === null) return null;

  return (
    <div className="inline-flex items-center gap-2 text-muted-foreground font-mono text-xs">
      <Eye className="w-3.5 h-3.5" />
      <AnimatedNumber value={count} />
      <span>views</span>
    </div>
  );
};

export default VisitorCounter;
