import { motion } from "framer-motion";

const CAPABILITIES = [
  {
    area: "Safety Engineering",
    cls: "text-violet-400 border-violet-500/30 bg-violet-500/5",
    labelCls: "text-violet-500/70",
    desc: "Adversarial LLM evaluation, pre-deployment safety assurance, and agentic threat modeling — red-teaming, failure mode analysis, goal drift detection, blast radius quantification.",
    competencies: ["OWASP LLM Top 10", "MITRE ATLAS", "NIST AI RMF", "Agentic Safety", "HITL Design", "Prompt Injection"],
  },
  {
    area: "AI Governance",
    cls: "text-blue-400 border-blue-500/30 bg-blue-500/5",
    labelCls: "text-blue-500/70",
    desc: "Translating regulatory obligations into operational workflows — fairness audits, privacy impact assessment, compliance pipeline design, and policy interpretation across jurisdictions.",
    competencies: ["EU AI Act", "GDPR", "ECOA", "ISO 42001", "LangGraph Pipelines", "NYC LL144"],
  },
  {
    area: "Enterprise Systems",
    cls: "text-amber-400 border-amber-500/30 bg-amber-500/5",
    labelCls: "text-amber-500/70",
    desc: "18+ years designing operating models for regulated enterprises — CRM architecture, GTM execution, technical program delivery, and stakeholder governance at scale.",
    competencies: ["B2B SaaS", "CRM Architecture", "GTM Operating Models", "Technical Program Mgmt", "PMP", "Salesforce"],
  },
  {
    area: "Product Systems",
    cls: "text-slate-400 border-slate-500/30 bg-slate-500/5",
    labelCls: "text-slate-500/70",
    desc: "Full-stack product delivery from research prototype to production — AI-powered pipelines, lean internal tooling, agency platform architecture, and cross-functional delivery.",
    competencies: ["React · TypeScript", "Python · FastAPI", "LangGraph", "Claude API", "HubSpot", "Supabase"],
  },
  {
    area: "Research & Evaluation",
    cls: "text-rose-400 border-rose-500/30 bg-rose-500/5",
    labelCls: "text-rose-500/70",
    desc: "Empirical AI safety research — benchmark design, statistical fairness measurement, reproducible methodology, and published preprints on Zenodo.",
    competencies: ["ZIDR Metric", "Disparate Impact Ratio", "PyTorch · scikit-learn", "Zenodo Preprints", "Colab Notebooks", "ProPublica Validation"],
  },
  {
    area: "Sustainable AI",
    cls: "text-emerald-400 border-emerald-500/30 bg-emerald-500/5",
    labelCls: "text-emerald-500/70",
    desc: "Carbon accounting, inference efficiency strategy, and sustainability disclosure — from GPU-level formula validation to CSRD-compliant enterprise reporting.",
    competencies: ["CSRD · ESRS E1", "EU GPAI Art.53", "GHG Protocol Scope 2", "Electricity Maps API", "ISSB S2", "GRI 305"],
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const Skills = () => (
  <section id="skills" className="px-6 py-14 border-t border-border/40">
    <div className="max-w-7xl mx-auto">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-8">
        Capabilities
      </h2>
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
      >
        {CAPABILITIES.map((cap) => (
          <motion.div
            key={cap.area}
            variants={item}
            className={`rounded-xl border px-5 py-4 flex flex-col ${cap.cls}`}
          >
            <p className={`text-[10px] font-mono font-semibold uppercase tracking-widest mb-2 ${cap.labelCls}`}>
              {cap.area}
            </p>
            <p className="text-sm text-foreground/80 leading-relaxed mb-4 flex-1">
              {cap.desc}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {cap.competencies.map((c) => (
                <span
                  key={c}
                  className="text-[10px] font-mono text-muted-foreground/70 bg-background/40 border border-border/40 px-2 py-0.5 rounded"
                >
                  {c}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
);

export default Skills;
