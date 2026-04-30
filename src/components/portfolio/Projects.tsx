import { motion } from "framer-motion";
import { Link } from "react-router-dom";

type Project = {
  title: string;
  description: string;
  tags: string[];
  industries?: string[];
  status?: "live" | "preview" | "building" | "upcoming";
  link?: string;
  externalLink?: string;
};

const RESPONSIBLE_AI: Project[] = [
  {
    title: "Algorithmic Fairness Auditor",
    description: "Audits AI systems for hidden bias — from quantization-induced disparate impact to real-world criminal justice (COMPAS recidivism). Applies disparate impact ratio, Cohen's d, false positive/negative rate parity, and chi-square testing.",
    tags: ["Python", "PyTorch", "scikit-learn", "pandas", "matplotlib", "Google Colab"],
    industries: ["Financial Services", "Criminal Justice", "HR & Talent"],
    status: "preview",
    link: "/algorithmic-fairness",
  },
  {
    title: "Privacy Impact Auditor",
    description: "AI-specific DPIA tool with dynamic combinatorial risk scoring — risks multiply, not add. Maps 12-question profile to 13 regulations (GDPR, EU AI Act Annex III, NYC LL144, CCPA, Illinois BIPA, Colorado AI Act). Includes differential privacy cost curve and proxy discrimination detection.",
    tags: ["React", "TypeScript", "GDPR", "EU AI Act", "NYC LL144", "Recharts"],
    industries: ["Financial Services", "Healthcare", "HR & Talent"],
    status: "preview",
    link: "/privacy-auditor",
  },
  {
    title: "AI Compliance Monitoring Agent",
    description: "LangGraph multi-node agent + Python data pipeline + GitHub Actions CI/CD. Computes fairness metrics (DIR, FPR, FNR) against EU AI Act and NIST thresholds, routes on severity, and auto-generates compliance reports and escalation memos — on a weekly schedule.",
    tags: ["LangGraph", "Python", "GitHub Actions", "Claude Haiku", "Pandas"],
    industries: ["Financial Services", "Enterprise AI", "Regulated Sectors"],
    status: "preview",
    link: "/compliance-agent",
  },
  {
    title: "AI Readiness Assessment",
    description: "25-question self-service diagnostic across Strategy, Data, Technology, People, and Governance — scored report with ROI signal and prioritised gaps.",
    tags: ["React", "TypeScript", "Recharts"],
    industries: ["Enterprise", "SME", "Consulting"],
    status: "preview",
    link: "/ai-readiness",
  },
  {
    title: "AI Ethics & Governance Tracker",
    description: "On-demand policy tracker — EU AI Act, NIST AI RMF, ISO 42001, FAIR, AAIA — with clause-level detail, four-pillar framework, and client risk workbook. Private.",
    tags: ["React", "TypeScript", "Supabase"],
    industries: ["Enterprise", "Consulting", "All Sectors"],
    status: "preview",
    link: "/ai-governance",
  },
  {
    title: "AI Risk Assessment",
    description: "5-phase client engagement tool — Govern, Map, Measure, Report, Monitor — with risk register, compliance deadlines, audit fields, and backup/restore. Private.",
    tags: ["React", "TypeScript", "Supabase"],
    industries: ["Enterprise", "Financial Services", "Consulting"],
    status: "preview",
    link: "/client-discovery",
  },
];

const SUSTAINABLE_AI: Project[] = [
  {
    title: "AI Sustainability Disclosure Framework",
    description: "5-step practitioner framework for measuring, benchmarking, optimising, and disclosing the environmental footprint of AI systems. Maps to CSRD (2024), EU GPAI Art.53 (Aug 2025), and ISSB S2. Includes business case intake form with personalised obligation mapping and penalty exposure.",
    tags: ["Sustainable AI", "CSRD", "EU GPAI Art.53", "ISSB S2", "GRI 305", "TypeScript"],
    industries: ["Financial Services", "Enterprise ESG", "Tech"],
    status: "preview",
    link: "/sustainability-framework",
  },
  {
    title: "AI Carbon Footprint Calculator",
    description: "Interactive calculator for AI training and inference energy, carbon, and water footprint. Compare two model configurations side by side with regulatory flags (EU GPAI, CSRD, GRI 305). Formulas validated against Strubell 2019, Patterson 2021, BLOOM 2022.",
    tags: ["Sustainable AI", "TypeScript", "Electricity Maps API", "CSRD", "EU GPAI"],
    industries: ["Tech", "Enterprise ESG", "Data Centres"],
    status: "preview",
    link: "/carbon-depth",
  },
  {
    title: "Carbon Time Travel",
    description: "Training an AI model emits carbon once. Deploying it emits carbon every day. This animated tool shows the exact crossover point where cumulative inference carbon overtakes total training carbon — and how model size compounds that gap. BLOOM 176B at 1B tokens/day crosses on Day 108. Llama 2 70B emits 9× more per inference call than 7B, compounding daily.",
    tags: ["Sustainable AI", "CSRD Scope 2", "EU GPAI Art.53", "Recharts", "React", "TypeScript"],
    industries: ["Tech", "Enterprise ESG", "Data Centres"],
    status: "preview",
    link: "/carbon-time-travel",
  },
  {
    title: "Carbon-Fairness Efficiency Frontier",
    description: "The only tool that plots carbon cost against algorithmic fairness simultaneously. As you compress an AI model to save energy, minority groups are harmed more — this tool quantifies the tradeoff and recommends the optimal configuration under EU AI Act thresholds.",
    tags: ["Python", "Recharts", "Sustainable AI", "EU AI Act"],
    industries: ["Financial Services", "Enterprise ESG", "Regulated AI"],
    status: "preview",
    link: "/carbon-fairness",
  },
  {
    title: "Carbon-Aware LLM Inference Router",
    description: "Routes each LLM prompt to the right model size based on task complexity, live grid carbon intensity, latency budget, and accuracy floor — simultaneously. Back-of-envelope: ~62% carbon reduction on a 1M prompt/day system by routing 65% of prompts to a 7B model. The only open tool combining per-prompt routing + real-time grid data + production serving integration. EU AI Act Art.53 · CSRD Scope 2.",
    tags: ["Python", "FastAPI", "Electricity Maps API", "vLLM", "MLflow", "EU AI Act Art.53", "CSRD"],
    industries: ["Tech", "Enterprise ESG", "Data Centres"],
    status: "preview",
    link: "/carbon-router",
  },
  {
    title: "AI Sustainability Standards Tracker",
    description: "Live reference across 11 disclosure frameworks — CSRD/ESRS E1, EU AI Act GPAI, ISSB S2, GRI 305, TCFD, SEC Climate Rule, and more. Each framework: AI-specific obligations, enforcement status, penalty exposure, and jurisdiction scope. Includes tool directory and industry adoption map.",
    tags: ["Sustainable AI", "CSRD", "ISSB S2", "EU AI Act", "GRI 305", "TypeScript"],
    industries: ["Enterprise ESG", "Financial Services", "Consulting"],
    status: "preview",
    link: "/sustainability-standards",
  },
];

const USE_CASES: Project[] = [
  {
    title: "Product Intelligence Pipeline",
    description: "AI-powered pipeline integrating Salesforce Cases with Claude to surface product insights at scale. Fintech and Healthtech verticals.",
    tags: ["Python", "Claude API", "Salesforce", "React"],
    status: "live",
    link: "/product-intelligence",
  },
  {
    title: "GTM Tech Stack",
    description: "Lean Python-powered GTM system replacing expensive enterprise tooling — lead capture, enrichment, scoring, nurture, CRM sync, and reporting.",
    tags: ["Python", "Pandas", "Streamlit", "HubSpot"],
    status: "live",
    link: "/gtm-techstack",
  },
];

const SAFETY_ENGINEERING: Project[] = [
  {
    title: "Agent Goal Hijacking Demo",
    description: "Live simulation of OWASP LLM Top 10 2025 #1 — Indirect Prompt Injection. A finance LLM agent is hijacked via a malicious PDF: its goal is silently overwritten, then it exfiltrates 10 customer records using only its own legitimate tools. Includes two-layer detection (rule-based + Claude Haiku judge), HITL approval flow, and blast radius risk model. EU AI Act Art.9 · DORA · GDPR Art.33.",
    tags: ["LangGraph", "Claude Haiku", "Python", "React", "TypeScript", "OWASP", "EU AI Act", "DORA"],
    industries: ["Financial Services", "Regulated AI", "Safety Engineering"],
    status: "preview",
    link: "/agent-hijacking",
  },
  {
    title: "Rogue Agent & Goal Drift Detector",
    description: "Detects when a finance LLM agent silently drifts from its original goal. After each tool call, cosine similarity between the agent's current intent and original task embedding flags SAFE / DRIFTING / ROGUE. A KPI-pressure memo nudges the agent to omit loss-making product lines — drift is caught at Step 2 before the fabricated report is written. HITL gate + MLflow audit trail. EU AI Act Art.9 · GDPR Art.5 · DORA.",
    tags: ["Python", "sentence-transformers", "MLflow", "LangGraph", "EU AI Act", "GDPR", "DORA"],
    industries: ["Financial Services", "Regulated AI", "Safety Engineering"],
    status: "preview",
    link: "/agent-drift",
  },
  {
    title: "LLM Safety Eval Framework",
    description: "Production-grade safety evaluation pipeline for LLMs in regulated financial services. 40 adversarial test cases across 5 risk categories — prompt injection, regulatory hallucination, suitability failures, data leakage, RAG poisoning. Claude-as-judge scoring with Streamlit compliance matrix, run comparison, and multi-model support. Built for pre-deployment assurance against FCA Consumer Duty, MiFID II, GDPR, and MITRE ATLAS.",
    tags: ["Python", "Claude API", "Streamlit", "YAML", "GitHub Actions", "Cursor", "FCA", "MiFID II", "GDPR", "MITRE ATLAS"],
    industries: ["Financial Services", "Regulated AI", "Safety Engineering"],
    status: "preview",
    link: "/safety-eval",
  },
];

const PET_PROJECTS: Project[] = [
  {
    title: "MedLog",
    description: "Family health journal — per-member profiles, medical events, symptom tracking, yearly analysis, and cloud sync via Supabase. Private.",
    tags: ["Vanilla JS", "Supabase", "Chart.js"],
    status: "preview",
    link: "/medlog",
  },
  {
    title: "Melodic Framework (Raaga)",
    description: "Hindustani & film raaga library — one canonical song per raaga, embedded player, singer/composer/movie metadata, and AI-generated lyrics.",
    tags: ["React", "Supabase", "Claude API"],
    status: "building",
    link: "/melodic-framework",
  },
];

const STATUS_BADGE: Record<string, { label: string; classes: string }> = {
  live:     { label: "Live",     classes: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  preview:  { label: "Preview",  classes: "bg-amber-500/10  text-amber-600  dark:text-amber-400  border-amber-500/20"  },
  building: { label: "Building", classes: "bg-blue-500/10   text-blue-600   dark:text-blue-400   border-blue-500/20"   },
  upcoming: { label: "Upcoming", classes: "bg-muted text-muted-foreground border-border"                                },
};

const ProjectRow = ({ project, index }: { project: Project; index: number }) => {
  const badge = project.status ? STATUS_BADGE[project.status] : null;

  const inner = (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06 }}
      className="group py-4 border-b border-border/50 last:border-0"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-1">
            <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
              {project.title}
            </span>
            {badge && (
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${badge.classes}`}>
                {badge.label}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed mb-2">
            {project.description}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {project.tags.map((tag) => (
              <span key={tag} className="text-[10px] font-mono text-slate-500 dark:text-blue-300/60 bg-slate-500/8 dark:bg-blue-500/8 border border-slate-400/15 dark:border-blue-400/20 px-2 py-0.5 rounded">
                {tag}
              </span>
            ))}
            {project.industries?.map((ind) => (
              <span key={ind} className="text-[10px] font-mono text-amber-600/80 dark:text-amber-400/75 bg-amber-500/8 border border-amber-500/20 px-2 py-0.5 rounded">
                {ind}
              </span>
            ))}
          </div>
        </div>
        {(project.link || project.externalLink) && (
          <span className="text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-0.5">
            {project.status === "preview" ? "Preview →" : "View →"}
          </span>
        )}
      </div>
    </motion.div>
  );

  if (project.link) {
    return <Link to={project.link} className="block no-underline">{inner}</Link>;
  }
  if (project.externalLink) {
    return <a href={project.externalLink} target="_blank" rel="noopener noreferrer" className="block no-underline">{inner}</a>;
  }
  return inner;
};

const SectionHeader = ({ label, subtitle }: { label: string; subtitle?: string }) => (
  <div className="mb-2 pt-2">
    <span className="inline-block font-mono text-[10px] tracking-widest uppercase px-2.5 py-1 rounded bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-500/40 font-semibold">
      {label}
    </span>
    {subtitle && (
      <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed max-w-2xl">{subtitle}</p>
    )}
  </div>
);

const Projects = () => (
  <section id="projects" className="py-6 px-6">
    <div className="max-w-7xl mx-auto">
      <SectionHeader
        label="Safety Engineering"
        subtitle="LLM red-teaming, adversarial evaluation, and pre-deployment safety assurance — 40-case test suite across prompt injection, regulatory hallucination, suitability failures, data leakage, and RAG poisoning."
      />
      <div className="mb-10">
        {SAFETY_ENGINEERING.map((p, i) => <ProjectRow key={p.title} project={p} index={i} />)}
      </div>

      <SectionHeader
        label="Responsible AI"
        subtitle="Statistical fairness audits, privacy impact assessment, agentic compliance pipelines, and governance tooling — built for EU AI Act, GDPR, MiFID II, and NIST AI RMF enforcement."
      />
      <div className="mb-10">
        {RESPONSIBLE_AI.map((p, i) => <ProjectRow key={p.title} project={p} index={i} />)}
      </div>

      <SectionHeader label="Sustainable AI" subtitle="Carbon footprint measurement, disclosure frameworks, and the carbon-fairness tradeoff — mapped to CSRD, EU GPAI Art.53, and ISSB S2." />
      <div className="mb-10">
        {SUSTAINABLE_AI.map((p, i) => <ProjectRow key={p.title} project={p} index={i} />)}
      </div>

      <SectionHeader label="GTM & Product Ops" />
      <div className="mb-10">
        {USE_CASES.map((p, i) => <ProjectRow key={p.title} project={p} index={i} />)}
      </div>

      <SectionHeader label="Pet Projects" />
      <div>
        {PET_PROJECTS.map((p, i) => <ProjectRow key={p.title} project={p} index={i} />)}
      </div>
    </div>
  </section>
);

export default Projects;
