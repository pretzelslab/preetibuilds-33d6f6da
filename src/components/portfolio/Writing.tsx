import { motion } from "framer-motion";

const PLACEHOLDER_ESSAYS = [
  {
    domain: "AI Safety",
    domainCls: "text-violet-400 bg-violet-500/10 border-violet-500/30",
    title: "Why Safety Benchmarks Miss Women",
    abstract: "Safety evaluation assumes an anonymous digital attacker. It does not model a colleague, an authority figure, or a stranger with local knowledge who is physically present. A proximity-based adversary can suppress AI threat detection before it fires — using no digital exploit. Five attack methods. Four target layers. No existing governance framework covers any of them.",
  },
  {
    domain: "Responsible AI",
    domainCls: "text-blue-400 bg-blue-500/10 border-blue-500/30",
    title: "The Fairness Trade-off Nobody Tells You About",
    abstract: "You cannot simultaneously equalise all fairness metrics when base rates differ. Every AI deployment in lending, justice, or hiring is implicitly choosing which group absorbs more false positives. Chouldechova's impossibility theorem proved this in 2017. Almost no production system documents the choice it made.",
  },
  {
    domain: "Sustainable AI",
    domainCls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    title: "Your Model's Carbon Bill Is in the Wrong Line Item",
    abstract: "Teams obsess over training carbon — a one-time cost. BLOOM's training used 433 MWh. Running a 7B model at 1M prompts/day accumulates that footprint in under two months. Inference routing, not training efficiency, is the highest-leverage sustainability intervention available right now.",
  },
];

const Writing = () => (
  <section className="px-6 py-14 border-t border-border/40">
    <div className="max-w-7xl mx-auto">
      <div className="flex items-end justify-between mb-6">
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
          Writing & Notes
        </p>
        <p className="text-[10px] text-muted-foreground/50 font-mono">Essays</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLACEHOLDER_ESSAYS.map((essay, i) => (
          <motion.div
            key={essay.domain + essay.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.4, ease: "easeOut" }}
            className="group flex flex-col rounded-xl border border-border/50 bg-card/40 px-4 py-3 cursor-default hover:border-border/80 transition-colors"
          >
            <span className={`self-start text-[10px] font-medium px-2.5 py-0.5 rounded-full border mb-3 ${essay.domainCls}`}>
              {essay.domain}
            </span>
            <h3 className="font-semibold text-sm text-foreground leading-snug">
              {essay.title}
            </h3>
            <div className="overflow-hidden max-h-0 group-hover:max-h-48 transition-all duration-300 ease-out">
              <p className="text-xs text-muted-foreground leading-relaxed mt-3">
                {essay.abstract}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default Writing;
