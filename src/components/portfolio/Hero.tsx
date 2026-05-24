import { motion } from "framer-motion";

const CREDENTIALS = [
  "Built 6 AI safety prototypes exploring jailbreak resistance, goal drift, adversarial misuse, and risk containment.",
  "Empirical fairness research identifying measurable bias in recidivism prediction and compressed AI models. Published 2 research preprints.",
  "18+ years delivering enterprise products, CRM platforms, GTM initiatives, and large-scale programs across regulated industries.",
];

const Hero = () => (
  <section className="flex items-start justify-center px-6 pt-20 pb-2">
    <div className="max-w-7xl w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl"
      >
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
          <span className="text-gradient text-name-soft">Preethi Raghuveeran</span>
        </h1>

        <p className="text-sm text-foreground/60 mb-4 tracking-tight">
          AI Safety · Governance · Product · Program Leadership
        </p>

        <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
          Designing responsible AI systems and governance capabilities through safety evaluation, fairness research, and enterprise product delivery.
        </p>
        <ul className="space-y-2 mb-5">
          {CREDENTIALS.map((c) => (
            <li key={c} className="flex gap-2.5 text-sm text-muted-foreground/80 leading-relaxed">
              <span className="text-primary shrink-0 mt-0.5">✦</span>
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  </section>
);

export default Hero;
