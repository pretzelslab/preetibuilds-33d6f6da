import { motion } from "framer-motion";

const CREDENTIALS = [
  "Responsible AI toolkit — full enforcement cycle across criminal justice (COMPAS recidivism) and financial services (HMDA mortgage lending): statistical fairness audits, safety evaluation runbooks, and remediation simulators. AI governance policy tracking (EU AI Act, NIST AI RMF, ISO 42001), readiness diagnostics, and client risk assessment.",
  "18+ years across B2B SaaS — HR tech, CRM, BI, and AI-driven platforms",
  "Product management, GTM, and technical program delivery across enterprise systems and cloud",
];

const Hero = () => (
  <section className="flex items-start justify-center px-6 pt-20 pb-6">
    <div className="max-w-5xl w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <p className="font-mono text-xs text-muted-foreground mb-3 tracking-widest uppercase">
          Responsible AI · Product · GTM
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
          <span className="text-gradient">Preethi Raghuveeran</span>
        </h1>
        <p className="text-base text-muted-foreground mb-5 leading-relaxed">
          Building end-to-end Responsible AI tools and governance frameworks — from audit to regulatory verdict to remediation.
        </p>
        <ul className="space-y-2 mb-8">
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
