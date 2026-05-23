import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { SAFETY_ENGINEERING, RESPONSIBLE_AI, SUSTAINABLE_AI, USE_CASES } from "@/data/projects";

const CREDENTIALS = [
  "6 agentic safety systems built — LLM jailbreak evaluation (40 cases, 5 dimensions), goal drift detection, adversarial goal hijacking, blast radius analysis. OWASP LLM Top 10 · MITRE ATLAS · NIST AI RMF.",
  "Empirical fairness research — 1.92× Disparate Impact on COMPAS recidivism, proxy discrimination under INT4 quantization. 2 preprints on Zenodo: CAIR · ZIDR.",
  "18+ years enterprise product — B2B SaaS, CRM, GTM, technical program delivery across regulated sectors",
];

const DOMAIN_INDEX = [
  {
    label: "Safety Engineering",
    count: SAFETY_ENGINEERING.length,
    anchor: "#safety-engineering",
    desc: "Adversarial LLM evaluation, red-teaming, pre-deployment safety assurance, failure mode testing",
    cls: "text-violet-400 border-violet-500/25 hover:bg-violet-500/5",
  },
  {
    label: "Responsible AI",
    count: RESPONSIBLE_AI.length,
    anchor: "#responsible-ai",
    desc: "Fairness audits, privacy impact assessments, governance workflows, compliance-by-design systems",
    cls: "text-blue-400 border-blue-500/25 hover:bg-blue-500/5",
  },
  {
    label: "Sustainable AI",
    count: SUSTAINABLE_AI.length,
    anchor: "#sustainable-ai",
    desc: "Carbon accounting, disclosure frameworks, inference efficiency strategy, carbon–fairness tradeoff analysis",
    cls: "text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/5",
  },
  {
    label: "GTM & Product",
    count: USE_CASES.length,
    anchor: "#gtm-product",
    desc: "CRM architecture, GTM operating models, decision workflows, program leadership, AI governance implementation",
    cls: "text-amber-400 border-amber-500/25 hover:bg-amber-500/5",
  },
];

const Hero = () => {
  const [showCats, setShowCats] = useState(false);

  return (
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
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1">
            <span className="text-gradient text-name-soft">Preethi Raghuveeran</span>
          </h1>

          {/* Expertise chips — Product · Program · GTM */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {["Product", "Program Management", "GTM"].map(tag => (
              <span key={tag} className="text-[10px] font-mono px-2 py-0.5 rounded border border-amber-500/25 text-amber-500/80 bg-amber-500/5 tracking-wide">
                {tag}
              </span>
            ))}
          </div>

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

            {/* Browse Projects — category dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowCats(s => !s)}
                className="text-xs font-mono px-4 py-1.5 rounded-full border border-border text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
              >
                Browse Projects
                <span className="text-[10px]">{showCats ? "▲" : "▼"}</span>
              </button>
              <AnimatePresence>
                {showCats && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 mt-2 z-50 bg-background border border-border rounded-xl shadow-xl overflow-hidden min-w-52"
                  >
                    {DOMAIN_INDEX.map(d => (
                      <a
                        key={d.label}
                        href={d.anchor}
                        onClick={() => setShowCats(false)}
                        className={`flex items-center justify-between px-4 py-2.5 text-xs font-semibold no-underline border-b border-border/40 last:border-0 hover:bg-muted/40 transition-colors ${d.cls}`}
                      >
                        <span>{d.label}</span>
                        <span className="text-[10px] font-mono text-muted-foreground">{d.count} →</span>
                      </a>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Right — domain index with hover descriptions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="flex flex-col justify-center"
        >
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-3">
            Portfolio Focus
          </p>
          <div className="space-y-2">
            {DOMAIN_INDEX.map(d => (
              <motion.a
                key={d.label}
                href={d.anchor}
                initial="rest"
                whileHover="hover"
                animate="rest"
                className={`block rounded-lg border px-3 py-2.5 no-underline transition-colors ${d.cls}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{d.label}</span>
                  <span className="text-[10px] font-mono text-muted-foreground tabular-nums">{d.count} →</span>
                </div>
                <motion.div
                  variants={{
                    rest: { height: 0, opacity: 0, marginTop: 0 },
                    hover: { height: "auto", opacity: 1, marginTop: 4 },
                  }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <p className="text-xs text-muted-foreground leading-relaxed">{d.desc}</p>
                </motion.div>
              </motion.a>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  </section>
  );
};

export default Hero;
