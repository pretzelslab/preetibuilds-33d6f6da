import { motion } from "framer-motion";

const FOCUS_ITEMS = [
  "Pre-deployment safety assurance for regulated AI",
  "Agentic systems governance and drift detection",
  "AI-native product architecture and systems design",
  "Gendered adversarial robustness benchmarking",
];

const About = () => (
  <section id="about" className="py-8 px-6 border-t border-border/40">
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="group rounded-xl border border-border/50 bg-card/40 px-4 py-3 cursor-default hover:border-border/80 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">About</span>
          </div>
          <div className="overflow-hidden max-h-0 group-hover:max-h-64 transition-all duration-300 ease-out">
            <p className="text-xs text-foreground/80 leading-relaxed mt-3 mb-2">
              Works at the intersection of AI governance, product systems, and enterprise decisioning.
              Builds empirical AI safety tools — adversarial evaluation frameworks, fairness audits,
              carbon-aware routing infrastructure — and the governance pipelines that make responsible
              AI actionable at scale.
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Eighteen years designing operating models across B2B SaaS, GTM, CRM, and regulatory
              compliance environments. Currently focused on pre-deployment safety assurance, governance
              tooling for regulated sectors, and AI-native product architecture.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.07 }}
          className="group rounded-xl border border-border/50 bg-card/40 px-4 py-3 cursor-default hover:border-border/80 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Currently exploring</span>
            <span className="text-[10px] font-mono text-muted-foreground/50 tabular-nums">{FOCUS_ITEMS.length} →</span>
          </div>
          <div className="overflow-hidden max-h-0 group-hover:max-h-48 transition-all duration-300 ease-out">
            <ul className="mt-3 space-y-2.5">
              {FOCUS_ITEMS.map((item) => (
                <li key={item} className="flex gap-2.5 text-xs text-muted-foreground/80 leading-relaxed">
                  <span className="text-primary/50 shrink-0 mt-0.5">✦</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

      </div>
    </div>
  </section>
);

export default About;
