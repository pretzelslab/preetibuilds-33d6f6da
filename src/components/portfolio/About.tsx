import { motion } from "framer-motion";

const FOCUS_ITEMS = [
  "Pre-deployment safety assurance for regulated AI",
  "Agentic systems governance and drift detection",
  "Carbon-fairness tradeoffs in production inference",
  "Gendered adversarial robustness benchmarking",
];

const About = () => (
  <section id="about" className="py-12 px-6 border-t border-border/40">
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-10">

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-4">
            About
          </p>
          <p className="text-xs text-foreground/80 leading-relaxed mb-3">
            Works at the intersection of AI governance, product systems, and enterprise decisioning.
            Builds empirical AI safety tools — adversarial evaluation frameworks, fairness audits,
            carbon-aware routing infrastructure — and the governance pipelines that make responsible
            AI actionable at scale.
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Eighteen years designing operating models across B2B SaaS, GTM, CRM, and regulatory
            compliance environments. Currently focused on pre-deployment safety assurance, governance
            tooling for regulated sectors, and the carbon-fairness tradeoff in production AI systems.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-4">
            Currently exploring
          </p>
          <ul className="space-y-2.5">
            {FOCUS_ITEMS.map((item) => (
              <li key={item} className="flex gap-2.5 text-xs text-muted-foreground/80 leading-relaxed">
                <span className="text-primary/50 shrink-0 mt-0.5">✦</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </motion.div>

      </div>
    </div>
  </section>
);

export default About;
