// Home (professional) page content. Edit here; items with `visible: false` are
// hidden from Home but nothing is deleted. Lab-only items live in projects.ts.

// Path of the Lab landing page (switches to "/lab" in P3).
export const LAB_PATH = "/research-lab";

// Show the Lab link in the navbar and footer. The Lab route stays reachable by URL either way.
export const LAB_VISIBLE = false;

export const HERO = {
  name: "Preethi Raghuveeran",
  role: "Program & GTM leader. Applied AI governance. Vancouver.",
  sub: "18+ years running enterprise products, transformation programs and RevOps platforms. I build working governance tools so risk and compliance teams can see what AI controls look like in practice.",
  // Right-column stat card.
  statCard: { value: "18+ years", label: "enterprise product, program and RevOps delivery" },

};

// The "Open to" card is not rendered while this is false.
export const OPEN_TO_VISIBLE = false;

export const CORE_STRENGTHS = [
  "Program delivery",
  "GTM & RevOps",
  "Cross-functional leadership",
  "Salesforce / CRM",
  "AI risk & compliance (EU AI Act, NIST, ISO 42001)",
];

export const OPEN_TO = {
  heading: "Open to",
  roles: ["Program Manager", "GTM / RevOps Lead", "AI Governance Program Lead"],
  location: "Vancouver · hybrid or remote",
  availability: "Immediately",
  linkedin: "https://www.linkedin.com/in/preetiraghuveer/",
};

// Resume PDF: drop the file at public/resume.pdf, then set RESUME_AVAILABLE = true.
export const RESUME_URL = "/resume.pdf";
export const RESUME_AVAILABLE = false;

export type HomeTile = {
  title: string;
  who: string;
  does: string;
  link: string;
  tags?: string[]; // max 3; regulation/framework/domain first, tech last
  visible?: boolean;
};

export type CaseCard = {
  title: string;
  kind: "career" | "built";
  problem?: string;
  action?: string;
  result?: string;
  does?: string;
  link?: string;
  tags?: string[]; // max 3; regulation/framework/domain first, tech last
  visible: boolean;
};

export const OUTCOMES: CaseCard[] = [
  // TODO: fill in the two career cases, then set visible: true
  { title: "[Employer / industry]", kind: "career", problem: "[problem]", action: "[what I did]", result: "[result]", visible: false },
  { title: "[Employer / industry]", kind: "career", problem: "[problem]", action: "[what I did]", result: "[result]", visible: false },
  {
    title: "Product Intelligence Pipeline", kind: "built", link: "/product-intelligence", visible: true, tags: ["RevOps", "Salesforce", "Claude API"],
    does: "Connects Salesforce Cases to Claude to surface product signals, customer pain points, feature demand trends and escalation patterns. Built for Fintech and Healthtech.",
  },
  {
    title: "Win/Loss Intelligence", kind: "built", link: "/win-loss-intelligence", visible: true, tags: ["RevOps", "Win/loss", "Claude API"],
    does: "Groups deal outcomes into patterns (legal delays, implementation friction, champion instability, competitive displacement) and runs a root-cause analysis per deal. Demo uses 25 synthetic deals.",
  },
  {
    title: "AI Opportunity Sizer", kind: "built", link: "/ai-value-lab", visible: true, tags: ["AI value", "Decision support", "Streamlit"],
    does: "Decision-support framework for where AI can create business value in a workflow, how much scope is feasible today, what should stay human, and what evidence is still missing.",
  },
  {
    title: "GTM Intelligence Pipeline", kind: "built", link: "/gtm-techstack", visible: true, tags: ["RevOps", "HubSpot", "Python"],
    does: "Python GTM system covering lead capture, enrichment, scoring, nurture, CRM sync and reporting.",
  },
  {
    title: "CRM Data Readiness Scan", kind: "built", link: "/gtm-ai-readiness", visible: true, tags: ["RevOps", "Salesforce", "AI readiness"],
    does: "Scores a sales team's CRM data hygiene across 7 dimensions and flags which AI use cases the data is ready for. Runs locally and read-only.",
  },
];

export const GOVERNANCE_TILES: HomeTile[] = [
  {
    title: "Regulation Tracker (18)", link: "/ai-governance", tags: ["EU AI Act", "NIST AI RMF", "ISO 42001"],
    who: "AI governance, legal and compliance leads",
    does: "Clause-level tracking of the EU AI Act, NIST AI RMF, ISO 42001 and more in one place.",
  },
  {
    title: "AI DPIA Builder", link: "/privacy-auditor", tags: ["GDPR", "EU AI Act", "NYC LL144"],
    who: "Privacy and legal teams",
    does: "Maps a 12-question AI system profile to 13 regulations, with combinatorial risk scoring.",
  },
  {
    title: "AI Readiness Check", link: "/ai-readiness", tags: ["NIST AI RMF", "EU AI Act", "ISO 42001"],
    who: "Leadership teams and consultants",
    does: "25 questions across Strategy, Data, Technology, People and Governance, scored into a report with prioritised gaps.",
  },
  {
    title: "Client Risk Workbook", link: "/client-discovery", tags: ["NIST AI RMF", "Risk register", "React"],
    who: "Consultants running AI risk engagements",
    does: "Five phases (Govern, Map, Measure, Report, Monitor) with a risk register, compliance deadlines and audit fields.",
  },
  {
    title: "Weekly Compliance Monitor", link: "/compliance-agent", tags: ["EU AI Act", "NIST AI RMF", "LangGraph"],
    who: "Compliance teams in regulated sectors",
    does: "LangGraph agent that computes fairness metrics against EU AI Act and NIST thresholds weekly and drafts the compliance report.",
  },
];

export const ASSURANCE_TILES: HomeTile[] = [
  {
    title: "Pre-Launch AI Safety Test", link: "/safety-eval", tags: ["FCA", "MiFID II", "GDPR"],
    who: "Teams deploying LLMs in regulated finance",
    does: "40 adversarial test cases across 5 risk categories, scored by Claude as judge.",
  },
  {
    title: "Agent Drift Monitor", link: "/agent-drift", tags: ["EU AI Act", "GDPR", "DORA"],
    who: "Teams running LLM agents",
    does: "Flags SAFE / DRIFTING / ROGUE by comparing each tool call's intent to the original task.",
  },
  {
    title: "Prompt-Injection Red-Team Test", link: "/agent-hijacking", tags: ["OWASP LLM Top 10", "EU AI Act", "DORA"],
    who: "Security and AI risk reviewers",
    does: "Simulates OWASP LLM Top 10 #1 (indirect prompt injection) against a finance agent, with two-layer detection and a human approval step.",
  },
  {
    title: "Fairness Audit: COMPAS case study", link: "/algorithmic-fairness", tags: ["4/5ths rule", "Disparate impact", "COMPAS"],
    who: "Model risk and fairness reviewers",
    does: "Disparate impact, FPR/FNR parity and chi-square testing applied to the COMPAS recidivism data. Full notebook in the Lab.",
  },
];

export const HOW_I_WORK: { title: string; text: string }[] = [
  { title: "Start from the outcome.", text: "Define the business result and how it's measured, then work backward to scope, owners and tooling." },
  { title: "Align people before platforms.", text: "Sales, product, legal and engineering agree on owners and success metrics up front." },
  { title: "Make governance tangible.", text: "Controls mapped to named rules (EU AI Act, GDPR, NIST AI RMF, ISO 42001), built as working tools reviewers can test." },
  { title: "Humans approve, agents assist.", text: "Every agent workflow has approval gates; nothing autonomous ships without human review." },
];

// TODO: add roles ({ role, org, years, summary }). Section stays hidden while empty.
export const EXPERIENCE: { role: string; org: string; years: string; summary?: string }[] = [];
