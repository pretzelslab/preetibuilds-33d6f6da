import { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { Eye } from "lucide-react";

const BASE_COUNT = 1247;

const AnimatedNumber = ({ value }: { value: number }) => {
  const spring = useSpring(0, { stiffness: 50, damping: 20 });
  const display = useTransform(spring, (v) => Math.round(v).toLocaleString());

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  return <motion.span>{display}</motion.span>;
};

const VisitorCounter = () => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem("visitor_count");
    const current = stored ? parseInt(stored, 10) + 1 : BASE_COUNT;
    localStorage.setItem("visitor_count", String(current));
    setCount(current);
  }, []);

  return (
    <div className="inline-flex items-center gap-2 text-muted-foreground font-mono text-xs">
      <Eye className="w-3.5 h-3.5" />
      <AnimatedNumber value={count} />
      <span>views</span>
    </div>
  );
};

export default VisitorCounter;
