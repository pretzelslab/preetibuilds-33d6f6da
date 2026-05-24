import { motion } from "framer-motion";
import { SAFETY_ENGINEERING, APPLIED_RESEARCH, PRODUCT_SYSTEMS } from "@/data/projects";

const CREDENTIALS = [
  "Built 6 AI safety prototypes exploring jailbreak resistance, goal drift, adversarial misuse, and risk containment.",
  "Empirical fairness research identifying measurable bias in recidivism prediction and compressed AI models. Published 2 research preprints.",
  "18+ years delivering enterprise products, CRM platforms, GTM initiatives, and large-scale programs across regulated industries.",
];

const DOMAIN_INDEX = [
  {
    label: "Product & GTM Systems",
    count: PRODUCT_SYSTEMS.length,
    anchor: "#product-gtm",
    desc: "Founder-led product development, revenue intelligence, GTM automation, and operating systems",
    bullets: ["Larkline — agency OS, customer discovery", "Win/Loss Intelligence — live Claude analysis", "GTM Tech Stack — CRM + pipeline automation"],
    cls: "text-amber-400 border-amber-500/25 hover:bg-amber-500/5",
  },
  {
    label: "Applied Research & Engineering",
    count: APPLIED_RESEARCH.length,
    anchor: "#applied-research",
    desc: "Original research and production systems — adversarial robustness, fairness audits, carbon routing",
    bullets: ["ZIDR preprint — physical-proximity attack taxonomy", "CAIR preprint — 45.5% carbon reduction", "1.92× disparate impact finding, COMPAS"],
    cls: "text-blue-400 border-blue-500/25 hover:bg-blue-500/5",
  },
  {
    label: "Safety Engineering",
    count: SAFETY_ENGINEERING.length,
    anchor: "#safety-engineering",
    desc: "Adversarial LLM evaluation, red-teaming, pre-deployment safety assurance, failure mode testing",
    bullets: ["OWASP LLM Top 10 — indirect prompt injection", "Goal drift detection — SAFE/DRIFTING/ROGUE", "40-case safety eval suite, 5 risk categories"],
    cls: "text-violet-400 border-violet-500/25 hover:bg-violet-500/5",
  },
];

const Hero = () => (
  <section className="flex items-start justify-center px-6 pt-20 pb-2">
    <div className="max-w-7xl w-full">
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-8 items-stretch">

        {/* Left — name, specializations, tagline, credentials */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col"
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
                  {"bullets" in d && d.bullets && (
                    <ul className="mt-2 space-y-0.5">
                      {d.bullets.map(b => (
                        <li key={b} className="flex items-center gap-1.5 text-[10px] text-muted-foreground/70 font-mono">
                          <span className="opacity-40">·</span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </motion.div>
              </motion.a>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  </section>
);

export default Hero;
