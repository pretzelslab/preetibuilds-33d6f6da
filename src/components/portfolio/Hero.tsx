import { motion } from "framer-motion";

const CREDENTIALS = [
  "Safety engineering across agentic LLM systems — adversarial evaluation (OWASP LLM Top 10, MITRE ATLAS), goal drift detection, and blast radius analysis. Empirical fairness research: 1.92× Disparate Impact Ratio on COMPAS recidivism, proxy discrimination under INT4 quantization. Carbon-aware inference routing: CAIR preprint published on Zenodo.",
  "18+ years across B2B SaaS — HR tech, CRM, BI, and AI-driven platforms",
  "Product management, GTM, and technical program delivery across enterprise systems and cloud",
];

const FOCUS_AREAS = [
  {
    label: "Safety Engineering",
    desc:  "Adversarial LLM evaluation, red-teaming, pre-deployment safety assurance",
    cls:   "text-violet-400 border-violet-500/30 bg-violet-500/8",
  },
  {
    label: "Responsible AI",
    desc:  "Fairness audits, privacy impact assessment, governance pipelines, compliance tooling",
    cls:   "text-blue-400 border-blue-500/30 bg-blue-500/8",
  },
  {
    label: "Sustainable AI",
    desc:  "Carbon accounting, disclosure frameworks, the carbon-fairness efficiency tradeoff",
    cls:   "text-emerald-400 border-emerald-500/30 bg-emerald-500/8",
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
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
            <span className="text-gradient text-name-soft">Preethi Raghuveeran</span>
          </h1>
          <p className="text-base text-muted-foreground mb-5 leading-relaxed">
            Building end-to-end Responsible AI tools and governance frameworks — from audit to regulatory verdict to remediation.
          </p>
          <ul className="space-y-2 mb-5">
            {CREDENTIALS.map((c) => (
              <li key={c} className="flex gap-2.5 text-sm text-muted-foreground/80 leading-relaxed">
                <span className="text-primary shrink-0 mt-0.5">✦</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
          <div className="flex-1" />
          <div className="pt-4 border-t border-border/30">
            <p className="text-[11px] text-muted-foreground/50 leading-relaxed">
              OWASP LLM · MITRE ATLAS · NIST AI RMF · EU AI Act · GDPR · ISO 42001 · CSRD · GRI 305
            </p>
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
          <div className="space-y-3 mb-6">
            {FOCUS_AREAS.map(f => (
              <div key={f.label} className={`rounded-lg border px-4 py-3 ${f.cls}`}>
                <p className="text-sm font-semibold mb-0.5">{f.label}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
          <div className="pt-4 border-t border-border/40">
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground/70">
              <span>18+ years product</span>
              <span>adversarial eval</span>
              <span>agentic safety</span>
              <span>sustainability mechanisms</span>
              <span>1 preprint</span>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  </section>
);

export default Hero;
