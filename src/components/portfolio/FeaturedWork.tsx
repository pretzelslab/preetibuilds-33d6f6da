import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { FEATURED_CARDS } from "@/data/projects";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

const FeaturedWork = () => (
  <section className="px-6 py-14">
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <span className="inline-block font-mono text-[10px] tracking-widest uppercase px-2.5 py-1 rounded bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-500/40 font-semibold">
          Applied Research & Engineering
        </span>
      </div>
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
      >
        {FEATURED_CARDS.map((card) => (
          <motion.div
            key={card.domain}
            variants={item}
            className="flex flex-col rounded-xl border border-border bg-card/60 backdrop-blur-sm p-6 hover:border-border/80 transition-colors"
          >
            {/* Domain pill */}
            <span
              className={`self-start text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border mb-3 ${card.domainCls}`}
            >
              {card.domain}
            </span>

            {/* Title */}
            <h3 className="font-semibold text-sm leading-snug mb-1.5">
              {card.title}
            </h3>

            {/* Problem sentence */}
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              {card.problem}
            </p>

            {/* Stats */}
            <ul className="space-y-1.5 mb-5 flex-1">
              {card.stats.map((s) => (
                <li key={s.value + s.label} className="flex items-baseline gap-1.5 text-xs">
                  <span className="font-bold text-foreground whitespace-nowrap">
                    {s.value}
                  </span>
                  <span className="text-muted-foreground">{s.label}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <Link
              to={card.href}
              className="inline-flex items-center gap-1 text-xs font-medium text-foreground/80 hover:text-foreground transition-colors group"
            >
              {card.cta}
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
);

export default FeaturedWork;
