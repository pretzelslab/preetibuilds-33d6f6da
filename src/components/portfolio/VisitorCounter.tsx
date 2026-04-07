import { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { Eye } from "lucide-react";
import { govDb } from "@/lib/supabase-governance";

const SESSION_KEY = "pv_counted";
const OWNER_KEY   = "pl_session_access";

const AnimatedNumber = ({ value }: { value: number }) => {
  const spring  = useSpring(0, { stiffness: 50, damping: 20 });
  const display = useTransform(spring, (v) => Math.round(v).toLocaleString());
  useEffect(() => { spring.set(value); }, [value, spring]);
  return <motion.span>{display}</motion.span>;
};

const VisitorCounter = ({ page = "/" }: { page?: string }) => {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const isOwner   = !!localStorage.getItem(OWNER_KEY);
    const counted   = !!sessionStorage.getItem(SESSION_KEY + page);

    async function track() {
      // Increment only if not owner and not already counted this session
      if (!isOwner && !counted) {
        await govDb.rpc("increment_page_view", { p_page: page });
        sessionStorage.setItem(SESSION_KEY + page, "1");
      }
      // Always fetch and display the current count
      const { data } = await govDb
        .from("page_views")
        .select("count")
        .eq("page", page)
        .single();
      if (data) setCount(data.count);
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
