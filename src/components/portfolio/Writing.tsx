import { motion } from "framer-motion";

const PLACEHOLDER_ESSAYS = [
  {
    domain: "AI Safety",
    domainCls: "text-violet-400 bg-violet-500/10 border-violet-500/30",
    title: "Essay title coming soon",
    abstract: "Abstract coming soon — this card will hold a short-form essay or note on AI safety, adversarial robustness, or pre-deployment evaluation.",
  },
  {
    domain: "Responsible AI",
    domainCls: "text-blue-400 bg-blue-500/10 border-blue-500/30",
    title: "Essay title coming soon",
    abstract: "Abstract coming soon — this card will hold a short-form essay or note on fairness, governance, or bias in production AI systems.",
  },
  {
    domain: "Sustainable AI",
    domainCls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    title: "Essay title coming soon",
    abstract: "Abstract coming soon — this card will hold a short-form essay or note on carbon accounting, disclosure, or the energy cost of AI inference.",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

const Writing = () => (
  <section className="px-6 py-14 border-t border-border/40">
    <div className="max-w-7xl mx-auto">
      <div className="flex items-end justify-between mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Writing & Notes
        </h2>
        <p className="text-xs text-muted-foreground/50 font-mono">Essays in progress</p>
      </div>
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
      >
        {PLACEHOLDER_ESSAYS.map((essay) => (
          <motion.div
            key={essay.domain + essay.title}
            variants={item}
            className="flex flex-col rounded-xl border border-border/50 border-dashed bg-muted/20 p-6"
          >
            <span className={`self-start text-xs font-medium px-2.5 py-0.5 rounded-full border mb-4 ${essay.domainCls}`}>
              {essay.domain}
            </span>
            <h3 className="font-semibold text-base text-muted-foreground/50 leading-snug mb-3">
              {essay.title}
            </h3>
            <p className="text-sm text-muted-foreground/40 leading-relaxed flex-1">
              {essay.abstract}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
);

export default Writing;
