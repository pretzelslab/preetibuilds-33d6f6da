import { motion } from "framer-motion";
import { ReactNode } from "react";

interface SlideCardProps {
  children: ReactNode;
  slideNumber: number;
  className?: string;
}

const SlideCard = ({ children, slideNumber, className = "" }: SlideCardProps) => (
  <motion.section
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.5 }}
    className={`relative rounded-2xl border border-[hsl(210,20%,87%)] bg-white p-8 sm:p-12 overflow-hidden shadow-sm ${className}`}
  >
    <span className="absolute top-4 right-5 text-[11px] font-mono text-[hsl(210,15%,70%)]">
      {String(slideNumber).padStart(2, "0")} / 16
    </span>
    {children}
  </motion.section>
);

export default SlideCard;
