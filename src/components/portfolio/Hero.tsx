import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const CREDENTIALS = [
  "Adversarial LLM evaluation — OWASP LLM Top 10, MITRE ATLAS, goal drift detection, blast radius analysis",
  "Empirical fairness research — 1.92× Disparate Impact on COMPAS recidivism, proxy discrimination under INT4 quantization. CAIR · ZIDR preprints on Zenodo.",
  "18+ years enterprise product — B2B SaaS, CRM, GTM, technical program delivery across regulated sectors",
];

const FOCUS_AREAS = [
  {
    label: "Safety Engineering",
    desc:  "Adversarial LLM evaluation, red-teaming, pre-deployment safety assurance, failure mode testing",
    cls:   "text-violet-400 border-violet-500/30 bg-violet-500/8",
  },
  {
    label: "Responsible AI",
    desc:  "Fairness audits, privacy impact assessments, governance workflows, compliance-by-design systems",
    cls:   "text-blue-400 border-blue-500/30 bg-blue-500/8",
  },
  {
    label: "Sustainable AI",
    desc:  "Carbon accounting, disclosure frameworks, inference efficiency strategy, carbon–fairness tradeoff analysis",
    cls:   "text-emerald-400 border-emerald-500/30 bg-emerald-500/8",
  },
  {
    label: "Enterprise Systems & AI Operations",
    desc:  "CRM architecture, GTM operating models, decision workflows, program leadership, AI governance implementation",
    cls:   "text-amber-400 border-amber-500/30 bg-amber-500/8",
  },
];

const Hero = () => (
  <section className="flex items-start justify-center px-6 pt-20 pb-2">
    <div className="max-w-7xl w-full">
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-8 items-stretch">

        {/* Left — name, tagline, credentials */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col"
        >
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
            <span className="text-gradient text-name-soft">Preethi Raghuveeran</span>
          </h1>
          <p className="text-base font-semibold text-foreground mb-1 tracking-tight">
            AI Systems Researcher · Safety & Governance
          </p>
          <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
            Designing responsible AI infrastructure — adversarial evaluation, fairness audits, carbon-aware routing, governance tooling.
          </p>
          <ul className="space-y-2 mb-5">
            {CREDENTIALS.map((c) => (
              <li key={c} className="flex gap-2.5 text-sm text-muted-foreground/80 leading-relaxed">
                <span className="text-primary shrink-0 mt-0.5">✦</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-3 mb-5">
            <Link
              to="/research"
              className="text-xs font-mono px-4 py-1.5 rounded-full border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              View Research →
            </Link>
            <a
              href="#projects"
              className="text-xs font-mono px-4 py-1.5 rounded-full border border-border text-muted-foreground hover:text-foreground transition-colors"
            >
              Browse Systems →
            </a>
          </div>
        </motion.div>

        {/* Right — portfolio focus panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-3">
            Portfolio Focus
          </p>
          <div className="space-y-3">
            {FOCUS_AREAS.map(f => (
              <div key={f.label} className={`rounded-lg border px-4 py-3 ${f.cls}`}>
                <p className="text-sm font-semibold mb-0.5">{f.label}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  </section>
);

export default Hero;
