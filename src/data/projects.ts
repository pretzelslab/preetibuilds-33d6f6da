import type { Project, FeaturedCard } from "@/types/project";

// ── Safety Engineering — Homepage flagship (3) ────────────────────────────────

export const SAFETY_ENGINEERING: Project[] = [
  {
    title: "Agent Goal Hijacking Demo",
    description: "Live simulation of OWASP LLM Top 10 2025 #1 — Indirect Prompt Injection. A finance LLM agent is hijacked via a malicious PDF: its goal is silently overwritten, then it exfiltrates 10 customer records using only its own legitimate tools. Includes two-layer detection (rule-based + Claude Haiku judge), HITL approval flow, and blast radius risk model. EU AI Act Art.9 · DORA · GDPR Art.33.",
    tags: ["LangGraph", "Claude Haiku", "Python", "React", "TypeScript", "OWASP", "EU AI Act", "DORA"],
    industries: ["Financial Services", "Regulated AI", "Safety Engineering"],
    status: "live",
    locked: true,
    link: "/agent-hijacking",
  },
  {
    title: "Rogue Agent & Goal Drift Detector",
    description: "Detects when a finance LLM agent silently drifts from its original goal. After each tool call, cosine similarity between the agent's current intent and original task embedding flags SAFE / DRIFTING / ROGUE. A KPI-pressure memo nudges the agent to omit loss-making product lines — drift is caught at Step 2 before the fabricated report is written. HITL gate + MLflow audit trail. EU AI Act Art.9 · GDPR Art.5 · DORA.",
    tags: ["Python", "sentence-transformers", "MLflow", "LangGraph", "EU AI Act", "GDPR", "DORA"],
    industries: ["Financial Services", "Regulated AI", "Safety Engineering"],
    status: "live",
    locked: true,
    link: "/agent-drift",
  },
  {
    title: "LLM Safety Eval Framework",
    description: "Production-grade safety evaluation pipeline for LLMs in regulated financial services. 40 adversarial test cases across 5 risk categories — prompt injection, regulatory hallucination, suitability failures, data leakage, RAG poisoning. Claude-as-judge scoring with Streamlit compliance matrix, run comparison, and multi-model support. Built for pre-deployment assurance against FCA Consumer Duty, MiFID II, GDPR, and MITRE ATLAS.",
    tags: ["Python", "Claude API", "Streamlit", "YAML", "GitHub Actions", "Cursor", "FCA", "MiFID II", "GDPR", "MITRE ATLAS"],
    industries: ["Financial Services", "Regulated AI", "Safety Engineering"],
    status: "live",
    locked: true,
    link: "/safety-eval",
  },
];

// ── Responsible AI & Governance — Homepage flagship (3) ──────────────────────

export const RESPONSIBLE_AI_GOVERNANCE: Project[] = [
  {
    title: "Privacy Impact Auditor",
    description: "AI-specific DPIA tool with dynamic combinatorial risk scoring — risks multiply, not add. Maps 12-question profile to 13 regulations (GDPR, EU AI Act Annex III, NYC LL144, CCPA, Illinois BIPA, Colorado AI Act). Includes differential privacy cost curve and proxy discrimination detection.",
    tags: ["React", "TypeScript", "GDPR", "EU AI Act", "NYC LL144", "Recharts"],
    industries: ["Financial Services", "Healthcare", "HR & Talent"],
    status: "live",
    locked: true,
    link: "/privacy-auditor",
  },
  {
    title: "AI Compliance Monitoring Agent",
    description: "LangGraph multi-node agent + Python data pipeline + GitHub Actions CI/CD. Computes fairness metrics (DIR, FPR, FNR) against EU AI Act and NIST thresholds, routes on severity, and auto-generates compliance reports and escalation memos — on a weekly schedule.",
    tags: ["LangGraph", "Python", "GitHub Actions", "Claude Haiku", "Pandas"],
    industries: ["Financial Services", "Enterprise AI", "Regulated Sectors"],
    status: "live",
    locked: true,
    link: "/compliance-agent",
  },
  {
    title: "AI Ethics & Governance Tracker",
    description: "On-demand policy tracker — EU AI Act, NIST AI RMF, ISO 42001, FAIR, AAIA — with clause-level detail, four-pillar framework, and client risk workbook. Private.",
    tags: ["React", "TypeScript", "Supabase"],
    industries: ["Enterprise", "Consulting", "All Sectors"],
    status: "live",
    locked: true,
    link: "/ai-governance",
  },
];

// ── Product & GTM Systems — Homepage flagship (3) ────────────────────────────

export const PRODUCT_SYSTEMS: Project[] = [
  {
    title: "Larkline",
    description: "End-to-end agency operating system — architected from schema design to product surface. Multi-tenant data isolation with row-level security policies, role-based access control, and scoped auth flows. Edge-deployed API routing, real-time event-driven pipelines, async job queues, transactional email delivery, and full audit logging on every write path. Observability instrumented throughout; stateless API layer built for horizontal scale. Covers intake, talent matching, pipeline management, follow-up automation, and revenue reporting.",
    tags: ["AI Systems Design", "Product Strategy", "Customer Discovery", "Next.js", "TypeScript", "Supabase", "Claude API"],
    industries: ["Creator Economy", "Agency Ops", "SaaS"],
    status: "discovery",
    externalLink: "https://larkline.app",
  },
  {
    title: "Win/Loss Intelligence",
    description: "AI system for organizational revenue intelligence — surfaces systemic deal outcome patterns across legal delays, implementation friction, champion instability, and competitive displacement. Live Claude Sonnet root cause analysis per deal: grounded evidence chain, inference risk flags, data lineage panel, and human evaluation loop. 25 synthetic deals · 5-dimension filter bar.",
    tags: ["React", "TypeScript", "Claude API", "Recharts"],
    industries: ["GTM", "RevOps", "Sales Intelligence"],
    status: "live",
    link: "/win-loss-intelligence",
  },
  {
    title: "GTM Tech Stack",
    description: "Lean Python-powered GTM system replacing expensive enterprise tooling — lead capture, enrichment, scoring, nurture, CRM sync, and reporting.",
    tags: ["Python", "Pandas", "Streamlit", "HubSpot"],
    status: "live",
    link: "/gtm-techstack",
  },
];

// ── Research Lab — Responsible AI (4) ────────────────────────────────────────

export const RESEARCH_LAB_RESPONSIBLE_AI: Project[] = [
  {
    title: "Gendered Adversarial Robustness — ZIDR Benchmark",
    description: "First benchmark taxonomy for physical-proximity attacks on AI safety systems. A physically proximate adversary — colleague, authority figure, stranger with local knowledge — can suppress AI-based threat detection before a safety system fires, using no digital exploit. ZIDR (Zero-Interaction Danger Rate) quantifies pre-trigger harm activation absent from all existing safety eval frameworks. 5 attack methods · 4 target layers · zero-interaction probe design.",
    tags: ["AI Safety", "Adversarial Robustness", "Benchmark Taxonomy", "Python", "Zenodo Preprint"],
    industries: ["AI Safety Research", "Women's Safety", "Safety Engineering"],
    status: "live",
    externalLink: "https://zenodo.org/records/20208521",
  },
  {
    title: "Algorithmic Fairness Auditor",
    description: "Audits AI systems for hidden bias — from quantization-induced disparate impact to real-world criminal justice (COMPAS recidivism). Applies disparate impact ratio, Cohen's d, false positive/negative rate parity, and chi-square testing.",
    tags: ["Python", "PyTorch", "scikit-learn", "pandas", "matplotlib", "Google Colab"],
    industries: ["Financial Services", "Criminal Justice", "HR & Talent"],
    status: "live",
    locked: true,
    link: "/algorithmic-fairness",
  },
  {
    title: "AI Readiness Assessment",
    description: "25-question self-service diagnostic across Strategy, Data, Technology, People, and Governance — scored report with ROI signal and prioritised gaps.",
    tags: ["React", "TypeScript", "Recharts"],
    industries: ["Enterprise", "SME", "Consulting"],
    status: "live",
    locked: true,
    link: "/ai-readiness",
  },
  {
    title: "AI Risk Assessment",
    description: "5-phase client engagement tool — Govern, Map, Measure, Report, Monitor — with risk register, compliance deadlines, audit fields, and backup/restore. Private.",
    tags: ["React", "TypeScript", "Supabase"],
    industries: ["Enterprise", "Financial Services", "Consulting"],
    status: "live",
    locked: true,
    link: "/client-discovery",
  },
];

// ── Research Lab — Sustainable AI (5) ────────────────────────────────────────

export const RESEARCH_LAB_SUSTAINABLE_AI: Project[] = [
  {
    title: "AI Sustainability Disclosure Framework",
    description: "5-step practitioner framework for measuring, benchmarking, optimising, and disclosing the environmental footprint of AI systems. Maps to CSRD (2024), EU GPAI Art.53 (Aug 2025), and ISSB S2. Includes business case intake form with personalised obligation mapping and penalty exposure.",
    tags: ["Sustainable AI", "CSRD", "EU GPAI Art.53", "ISSB S2", "GRI 305", "TypeScript"],
    industries: ["Financial Services", "Enterprise ESG", "Tech"],
    status: "live",
    locked: true,
    link: "/sustainability-framework",
  },
  {
    title: "AI Carbon Footprint Calculator",
    description: "Interactive calculator for AI training and inference energy, carbon, and water footprint. Compare two model configurations side by side with regulatory flags (EU GPAI, CSRD, GRI 305). Formulas validated against Strubell 2019, Patterson 2021, BLOOM 2022.",
    tags: ["Sustainable AI", "TypeScript", "Electricity Maps API", "CSRD", "EU GPAI"],
    industries: ["Tech", "Enterprise ESG", "Data Centres"],
    status: "live",
    locked: true,
    link: "/carbon-depth",
  },
  {
    title: "Carbon Time Travel",
    description: "Training an AI model emits carbon once. Deploying it emits carbon every day. This animated tool shows the exact crossover point where cumulative inference carbon overtakes total training carbon — and how model size compounds that gap. BLOOM 176B at 1B tokens/day crosses on Day 108. Llama 2 70B emits 9× more per inference call than 7B, compounding daily.",
    tags: ["Sustainable AI", "CSRD Scope 2", "EU GPAI Art.53", "Recharts", "React", "TypeScript"],
    industries: ["Tech", "Enterprise ESG", "Data Centres"],
    status: "live",
    locked: true,
    link: "/carbon-time-travel",
  },
  {
    title: "Carbon-Fairness Efficiency Frontier",
    description: "The only tool that plots carbon cost against algorithmic fairness simultaneously. As you compress an AI model to save energy, minority groups are harmed more — this tool quantifies the tradeoff and recommends the optimal configuration under EU AI Act thresholds.",
    tags: ["Python", "Recharts", "Sustainable AI", "EU AI Act"],
    industries: ["Financial Services", "Enterprise ESG", "Regulated AI"],
    status: "live",
    locked: true,
    link: "/carbon-fairness",
  },
  {
    title: "AI Sustainability Standards Tracker",
    description: "Live reference across 11 disclosure frameworks — CSRD/ESRS E1, EU AI Act GPAI, ISSB S2, GRI 305, TCFD, SEC Climate Rule, and more. Each framework: AI-specific obligations, enforcement status, penalty exposure, and jurisdiction scope. Includes tool directory and industry adoption map.",
    tags: ["Sustainable AI", "CSRD", "ISSB S2", "EU AI Act", "GRI 305", "TypeScript"],
    industries: ["Enterprise ESG", "Financial Services", "Consulting"],
    status: "live",
    locked: true,
    link: "/sustainability-standards",
  },
  {
    title: "Carbon-Aware LLM Inference Router",
    description: "Routes each LLM prompt to the right model size based on task complexity, live grid carbon intensity, latency budget, and accuracy floor — simultaneously. Preliminary analysis: ~62% carbon reduction on a 1M prompt/day system by routing 65% of prompts to a 7B model. The only open tool combining per-prompt routing + real-time grid data + production serving integration. EU AI Act Art.53 · CSRD Scope 2.",
    tags: ["Python", "FastAPI", "Electricity Maps API", "vLLM", "MLflow", "EU AI Act Art.53", "CSRD"],
    industries: ["Tech", "Enterprise ESG", "Data Centres"],
    status: "live",
    locked: true,
    link: "/carbon-router",
    externalLink: "https://doi.org/10.5281/zenodo.19934621",
  },
];

// ── Research Lab — Product & GTM (1) ─────────────────────────────────────────

export const RESEARCH_LAB_PRODUCT: Project[] = [
  {
    title: "Product Intelligence Pipeline",
    description: "AI-powered pipeline integrating Salesforce Cases with Claude to surface product insights at scale. Fintech and Healthtech verticals.",
    tags: ["Python", "Claude API", "Salesforce", "React"],
    status: "live",
    link: "/product-intelligence",
  },
];

// ── Research Lab — Personal (2) ───────────────────────────────────────────────

export const RESEARCH_LAB_PERSONAL: Project[] = [
  {
    title: "MedLog",
    description: "Family health journal — per-member profiles, medical events, symptom tracking, yearly analysis, and cloud sync via Supabase. Private.",
    tags: ["Vanilla JS", "Supabase", "Chart.js"],
    status: "live",
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

// ── Featured Research Cards ───────────────────────────────────────────────────

export const FEATURED_CARDS: FeaturedCard[] = [
  {
    domain: "Adversarial Robustness",
    domainCls: "text-violet-400 bg-violet-500/10 border-violet-500/30",
    title: "Gendered Adversarial Robustness — ZIDR Benchmark",
    problem: "Safety benchmarks assume anonymous digital attackers. A physically proximate adversary with environmental familiarity can suppress AI threat detection before it fires — using no digital exploit.",
    stats: [
      { value: "ZIDR",  label: "new metric — Zero-Interaction Danger Rate" },
      { value: "5",     label: "attack methods: suppression to interception" },
      { value: "4",     label: "target layers: sensing · processing · comms · response" },
    ],
    href: "/research#publications",
    cta: "View preprint",
  },
  {
    domain: "Responsible AI",
    domainCls: "text-blue-400 bg-blue-500/10 border-blue-500/30",
    title: "Proxy Discrimination Under Quantization",
    problem: "INT4 quantization widens race-based false positive gaps in recidivism scoring.",
    stats: [
      { value: "14.4%",  label: "FPR gap at FP32 baseline" },
      { value: "Widens", label: "under INT4 — not a model-neutral transform" },
      { value: "6",      label: "reproducible notebooks, public dataset" },
    ],
    href: "/algorithmic-fairness",
    cta: "View research",
  },
  {
    domain: "Sustainable AI",
    domainCls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    title: "Carbon-Aware Inference Router",
    problem: "LLM API traffic routed to the lowest-carbon model — zero accuracy sacrifice.",
    stats: [
      { value: "45.5%", label: "carbon savings vs single-model baseline" },
      { value: "0.09ms", label: "P95 routing latency overhead" },
      { value: "100%",  label: "routing precision, 0% fallback failures" },
    ],
    href: "/carbon-router",
    cta: "View preprint",
  },
];
