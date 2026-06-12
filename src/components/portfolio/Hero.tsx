import { motion } from "framer-motion";
import { SAFETY_ENGINEERING, PRODUCT_SYSTEMS, RESPONSIBLE_AI_GOVERNANCE } from "@/data/projects";

const CREDENTIALS = [
  "Enterprise products, platforms, and transformation programs — 18+ years across B2B SaaS, CRM, and RevOps stacks.",
  "AI-native revenue systems: win/loss intelligence, signal-based GTM automation, and decision intelligence platforms.",
  "AI safety & evaluation: 40-case adversarial test suite, agent drift detection — OWASP LLM Top 10 and MITRE ATLAS aligned.",
  "Published research: 2 citable Zenodo preprints — adversarial robustness (ZIDR) and carbon-aware inference (CAIR).",
];

const DOMAIN_INDEX = [
  {
    label: "Product & GTM Systems",
    count: PRODUCT_SYSTEMS.length,
    anchor: "#product-gtm",
    desc: "Founder-led product development, revenue intelligence, GTM automation, and operating systems",
    bullets: ["Win/Loss Intelligence — live Claude root-cause analysis", "GTM Intelligence Pipeline — CRM + pipeline automation", "Larkline — decision intelligence and agency operations"],
    cls: "text-amber-400 border-amber-500/25 hover:bg-amber-500/5",
  },
  {
    label: "AI Safety & Evaluation",
    count: SAFETY_ENGINEERING.length,
    anchor: "#ai-safety-evaluation",
    desc: "Adversarial testing, red-teaming, agent evaluation, and pre-deployment safety assurance",
    bullets: ["OWASP LLM Top 10 — indirect prompt injection", "Goal drift detection — SAFE/DRIFTING/ROGUE", "40-case safety eval suite, 5 risk categories"],
    cls: "text-violet-400 border-violet-500/25 hover:bg-violet-500/5",
  },
  {
    label: "Responsible AI & Governance",
    count: RESPONSIBLE_AI_GOVERNANCE.length,
    anchor: "#responsible-ai-governance",
    desc: "Privacy impact assessment, agentic compliance pipelines, and policy governance tooling",
    bullets: ["Privacy Impact Auditor — DPIA + 13 regulations", "Compliance Monitoring Agent — weekly LangGraph pipeline", "Ethics & Governance Tracker — EU AI Act · NIST · ISO 42001"],
    cls: "text-blue-400 border-blue-500/25 hover:bg-blue-500/5",
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
            Product Strategy · Program Leadership · GTM · AI Governance
          </p>

          <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
            18+ years building enterprise products, programs, and CRM/GTM systems — now applying
            that operating discipline to AI: governance, safety, and evaluation. One trajectory,
            not two careers.
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
                  <ul className="mt-2 space-y-0.5">
                    {d.bullets.map(b => (
                      <li key={b} className="flex items-center gap-1.5 text-[10px] text-muted-foreground/70 font-mono">
                        <span className="opacity-40">·</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
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
