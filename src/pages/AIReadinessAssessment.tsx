import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, CheckCircle2, ChevronRight,
  TrendingUp, Database, Cpu, Users, ShieldCheck, BarChart3, Trash2
} from "lucide-react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  ResponsiveContainer, Tooltip
} from "recharts";

// ── Preview mode ───────────────────────────────────────────────────────────────
const IS_PREVIEW = typeof window !== "undefined" &&
  window.location.hostname !== "localhost" &&
  window.location.hostname !== "127.0.0.1";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Option { label: string; score: number; hint?: string }
interface Question { id: string; text: string; options: Option[] }
interface Section { id: string; label: string; shortLabel: string; icon: React.ElementType; color: string; questions: Question[] }
interface OrgProfile { name: string; industry: string; size: string; revenue: string; goal: string; region: string }

interface ARClient {
  id: string;
  name: string;
  industry: string;
  size: string;
  region?: string;
  createdAt: string;
  completedAt?: string;
  overallScore?: number;
  tier?: string;
}

// ── Client-wise localStorage helpers ─────────────────────────────────────────
const CLIENTS_KEY = "ar_clients";
const answersKey  = (id: string) => `ar_answers_${id}`;

function loadClients(): ARClient[] {
  try { return JSON.parse(localStorage.getItem(CLIENTS_KEY) ?? "[]"); } catch { return []; }
}
function saveClients(clients: ARClient[]) {
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
}
function loadAnswers(id: string): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(answersKey(id)) ?? "{}"); } catch { return {}; }
}
function saveAnswers(id: string, answers: Record<string, number>) {
  localStorage.setItem(answersKey(id), JSON.stringify(answers));
}

// ── Demo client seed ──────────────────────────────────────────────────────────
const DEMO_AR_ID = "ar-demo-apex-001";
const DEMO_AR_ANSWERS: Record<string, number> = {
  s1q1: 50, s1q2: 50, s1q3: 60, s1q4: 0,  s1q5: 50,  // Strategy avg 42
  s2q1: 50, s2q2: 25, s2q3: 0,  s2q4: 50, s2q5: 25,  // Data avg 30
  s3q1: 50, s3q2: 25, s3q3: 50, s3q4: 0,  s3q5: 50,  // Technology avg 35
  s4q1: 50, s4q2: 25, s4q3: 25, s4q4: 0,  s4q5: 50,  // People avg 30
  s5q1: 50, s5q2: 25, s5q3: 25, s5q4: 0,  s5q5: 25,  // Governance avg 25
};
function seedARDemoClient() {
  const existing: ARClient[] = loadClients();
  if (existing.some(c => c.id === DEMO_AR_ID)) return;
  const demo: ARClient = {
    id: DEMO_AR_ID,
    name: "Apex Lending Group",
    industry: "Financial Services / Fintech",
    size: "500–1,000",
    region: "Europe",
    createdAt: "2026-03-01T10:00:00.000Z",
    completedAt: "2026-03-01T10:45:00.000Z",
    overallScore: 32,
    tier: "Building",
  };
  saveClients([demo, ...existing]);
  saveAnswers(DEMO_AR_ID, DEMO_AR_ANSWERS);
}

// ── Industry list (matches Governance Tracker) ─────────────────────────────
const INDUSTRIES = [
  "Financial Services / Fintech", "Banking & Lending", "Insurtech / Insurance",
  "Wealth Management", "Healthtech / EHR", "Digital Health / Telehealth",
  "Medical Devices", "Technology & SaaS", "Public Sector / Government",
  "Retail & E-commerce", "HR Technology", "Manufacturing", "Other",
];

const COMPANY_SIZES = ["1–50", "51–200", "201–1,000", "1,001–5,000", "5,000+"];
const REVENUE_RANGES = ["<$1M", "$1M–$10M", "$10M–$50M", "$50M–$250M", "$250M+"];
const AI_GOALS = [
  "Automate repetitive processes",
  "Improve decision-making with data",
  "Enhance customer experience",
  "Reduce operational costs",
  "Drive new revenue streams",
  "Manage risk and compliance",
];

// ── Questions ─────────────────────────────────────────────────────────────────
const SECTIONS: Section[] = [
  {
    id: "strategy",
    label: "Strategy & Business Case",
    shortLabel: "Strategy",
    icon: TrendingUp,
    color: "violet",
    questions: [
      {
        id: "s1q1",
        text: "Does your organisation have a documented AI strategy or roadmap?",
        options: [
          { label: "Yes — formal strategy with milestones", score: 100 },
          { label: "Partial — informal plans discussed at leadership level", score: 55 },
          { label: "No — AI is not yet formally planned", score: 0 },
        ],
      },
      {
        id: "s1q2",
        text: "Have you identified specific business problems where AI could create measurable value?",
        options: [
          { label: "Yes — multiple use cases prioritised with expected value", score: 100 },
          { label: "Some — a few ideas but not formally evaluated", score: 50 },
          { label: "No — we haven't mapped business problems to AI yet", score: 0 },
        ],
      },
      {
        id: "s1q3",
        text: "How strong is executive sponsorship for AI initiatives?",
        options: [
          { label: "Strong — C-suite champion actively driving AI agenda", score: 100 },
          { label: "Moderate — supportive but not actively sponsoring", score: 60 },
          { label: "Low — leadership is cautious or not engaged", score: 20 },
          { label: "None — no executive visibility on AI", score: 0 },
        ],
      },
      {
        id: "s1q4",
        text: "Have you estimated the potential ROI or value from AI initiatives?",
        options: [
          { label: "Yes — quantified estimates per use case", score: 100 },
          { label: "Rough estimates — directional value understood", score: 55 },
          { label: "No — value not yet assessed", score: 0 },
        ],
      },
      {
        id: "s1q5",
        text: "What is your AI investment budget for the next 12 months?",
        options: [
          { label: ">$500K allocated", score: 100 },
          { label: "$100K–$500K allocated", score: 75 },
          { label: "<$100K allocated", score: 45 },
          { label: "No budget allocated yet", score: 0 },
        ],
      },
    ],
  },
  {
    id: "data",
    label: "Data Readiness",
    shortLabel: "Data",
    icon: Database,
    color: "blue",
    questions: [
      {
        id: "s2q1",
        text: "How would you rate the quality and completeness of your core business data?",
        options: [
          { label: "Excellent — clean, consistent, well-documented", score: 100 },
          { label: "Good — mostly reliable with known gaps", score: 72 },
          { label: "Fair — significant quality issues exist", score: 35 },
          { label: "Poor — data is fragmented or unreliable", score: 0 },
        ],
      },
      {
        id: "s2q2",
        text: "Do you have a data governance framework (ownership, cataloguing, access policies)?",
        options: [
          { label: "Yes — formal governance with data stewards", score: 100 },
          { label: "Partial — some policies but not consistently applied", score: 50 },
          { label: "No — data governance is informal or absent", score: 0 },
        ],
      },
      {
        id: "s2q3",
        text: "How accessible is data to teams who need it for analysis and AI?",
        options: [
          { label: "Mostly accessible — centralised or federated with clear access", score: 100 },
          { label: "Some silos — cross-team access requires effort", score: 50 },
          { label: "Mostly siloed — data locked in systems or departments", score: 10 },
        ],
      },
      {
        id: "s2q4",
        text: "Do you have sufficient historical data volume to train or fine-tune AI models?",
        options: [
          { label: "Yes — years of structured data across key processes", score: 100 },
          { label: "Partial — some data available, gaps in key areas", score: 50 },
          { label: "No — limited or sparse historical data", score: 0 },
        ],
      },
      {
        id: "s2q5",
        text: "Is your data stored in structured, queryable formats (databases, data warehouses)?",
        options: [
          { label: "Mostly structured — warehouses or lakehouses in place", score: 100 },
          { label: "Mixed — combination of structured and unstructured", score: 55 },
          { label: "Mostly unstructured — PDFs, emails, spreadsheets", score: 10 },
        ],
      },
    ],
  },
  {
    id: "technology",
    label: "Technology & Infrastructure",
    shortLabel: "Technology",
    icon: Cpu,
    color: "cyan",
    questions: [
      {
        id: "s3q1",
        text: "What is your organisation's current cloud adoption posture?",
        options: [
          { label: "Cloud-first — majority of workloads on cloud", score: 100 },
          { label: "Hybrid — cloud + on-prem mix", score: 70 },
          { label: "On-prem primary — moving toward cloud", score: 30 },
          { label: "Minimal cloud — mostly on-prem or legacy", score: 0 },
        ],
      },
      {
        id: "s3q2",
        text: "Do you have MLOps or AI deployment infrastructure (CI/CD for models, monitoring)?",
        options: [
          { label: "Yes — mature MLOps pipeline with monitoring", score: 100 },
          { label: "Basic — CI/CD exists but no model-specific tooling", score: 50 },
          { label: "No — manual or ad hoc deployment only", score: 0 },
        ],
      },
      {
        id: "s3q3",
        text: "Can your existing systems integrate with AI outputs via APIs or data feeds?",
        options: [
          { label: "Yes — API-first architecture with modern integrations", score: 100 },
          { label: "Some — key systems can integrate, others cannot", score: 55 },
          { label: "Limited — mostly legacy systems with minimal API support", score: 10 },
        ],
      },
      {
        id: "s3q4",
        text: "What is the maturity of your data pipeline infrastructure?",
        options: [
          { label: "Real-time pipelines — streaming and batch both supported", score: 100 },
          { label: "Batch pipelines — scheduled ETL/ELT processes", score: 70 },
          { label: "Manual — data movement is largely manual", score: 20 },
          { label: "None — no formal pipelines in place", score: 0 },
        ],
      },
      {
        id: "s3q5",
        text: "How would you rate your cybersecurity posture for AI systems and data?",
        options: [
          { label: "Strong — security-by-design, regular audits, AI-specific controls", score: 100 },
          { label: "Adequate — standard security in place, some AI-specific gaps", score: 60 },
          { label: "Developing — security frameworks in progress", score: 25 },
          { label: "Weak — significant security gaps exist", score: 0 },
        ],
      },
    ],
  },
  {
    id: "people",
    label: "People & Culture",
    shortLabel: "People",
    icon: Users,
    color: "amber",
    questions: [
      {
        id: "s4q1",
        text: "What percentage of your workforce has basic AI or data literacy?",
        options: [
          { label: ">50% — majority understand AI fundamentals", score: 100 },
          { label: "25–50% — growing awareness across teams", score: 70 },
          { label: "10–25% — pockets of capability in tech teams", score: 35 },
          { label: "<10% — AI literacy is very limited", score: 0 },
        ],
      },
      {
        id: "s4q2",
        text: "Do you have dedicated AI, data science, or ML engineering talent?",
        options: [
          { label: "Full team — data scientists, ML engineers, AI PMs", score: 100 },
          { label: "Some roles — a few data analysts or engineers with ML skills", score: 60 },
          { label: "One person — individual contributor only", score: 25 },
          { label: "None — no dedicated AI/data talent", score: 0 },
        ],
      },
      {
        id: "s4q3",
        text: "How would you describe your leadership's attitude toward AI adoption?",
        options: [
          { label: "Champion — actively investing and communicating AI vision", score: 100 },
          { label: "Supportive — open to AI but not driving it", score: 70 },
          { label: "Cautious — interested but concerned about risk/cost", score: 30 },
          { label: "Resistant — sceptical or opposed to AI adoption", score: 0 },
        ],
      },
      {
        id: "s4q4",
        text: "Do you have a plan for AI upskilling and change management?",
        options: [
          { label: "Yes — structured programme with training and comms", score: 100 },
          { label: "Partial — some training planned but no formal programme", score: 50 },
          { label: "No — no upskilling or change management planned", score: 0 },
        ],
      },
      {
        id: "s4q5",
        text: "Are business units actively requesting or experimenting with AI tools?",
        options: [
          { label: "Many — multiple teams running AI pilots or requesting tools", score: 100 },
          { label: "Some — a few teams exploring AI use cases", score: 60 },
          { label: "Few — interest is limited to one team", score: 25 },
          { label: "None — business units not engaged with AI yet", score: 0 },
        ],
      },
    ],
  },
  {
    id: "governance",
    label: "Governance & Ethics",
    shortLabel: "Governance",
    icon: ShieldCheck,
    color: "emerald",
    questions: [
      {
        id: "s5q1",
        text: "Does your organisation have a documented AI policy, principles, or code of conduct?",
        options: [
          { label: "Yes — formal AI policy approved and communicated", score: 100 },
          { label: "Drafting — policy under development", score: 45 },
          { label: "No — no formal AI policy exists", score: 0 },
        ],
      },
      {
        id: "s5q2",
        text: "Do you have a process for assessing AI risks before deployment?",
        options: [
          { label: "Yes — structured risk assessment for all AI deployments", score: 100 },
          { label: "Informal — ad hoc risk reviews on a case-by-case basis", score: 45 },
          { label: "No — no AI risk assessment process in place", score: 0 },
        ],
      },
      {
        id: "s5q3",
        text: "Are you subject to AI-specific regulation (EU AI Act, sector rules)?",
        options: [
          { label: "Yes — fully mapped and compliance programme underway", score: 100 },
          { label: "Yes — aware of obligations, compliance work in progress", score: 60 },
          { label: "Unsure — haven't assessed regulatory exposure", score: 20 },
          { label: "Not applicable to our industry/geography", score: 75 },
        ],
      },
      {
        id: "s5q4",
        text: "Do you have accountability mechanisms for AI-driven decisions (audit trails, human oversight)?",
        options: [
          { label: "Yes — logging, human review, and explainability in place", score: 100 },
          { label: "Partial — some oversight but not systematically applied", score: 50 },
          { label: "No — AI decisions are not auditable or overseen", score: 0 },
        ],
      },
      {
        id: "s5q5",
        text: "Do you have an AI incident response or audit process?",
        options: [
          { label: "Yes — incident register, escalation, and review process", score: 100 },
          { label: "Partial — informal process, no documentation", score: 40 },
          { label: "No — no AI incident process in place", score: 0 },
        ],
      },
    ],
  },
];

// ── Scoring helpers ───────────────────────────────────────────────────────────
const TIER_CONFIG = [
  { min: 76, label: "Leading",   color: "emerald", desc: "AI-native organisation — sustained competitive advantage from AI at scale." },
  { min: 51, label: "Scaling",   color: "blue",    desc: "Strong foundation — ready to scale AI across multiple business areas." },
  { min: 26, label: "Building",  color: "amber",   desc: "Progress underway — targeted investments will unlock significant value." },
  { min: 0,  label: "Exploring", color: "rose",    desc: "Early stage — foundational work needed before scaling AI initiatives." },
];

function getTier(score: number) {
  return TIER_CONFIG.find(t => score >= t.min)!;
}

function sectionScore(sectionId: string, answers: Record<string, number>): number {
  const section = SECTIONS.find(s => s.id === sectionId)!;
  const scores = section.questions.map(q => answers[q.id] ?? -1).filter(s => s >= 0);
  if (!scores.length) return 0;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

function overallScore(answers: Record<string, number>): number {
  const sectionScores = SECTIONS.map(s => sectionScore(s.id, answers));
  return Math.round(sectionScores.reduce((a, b) => a + b, 0) / SECTIONS.length);
}

// ── Gap recommendations ───────────────────────────────────────────────────────
const GAP_ADVICE: Record<string, { title: string; investment: string; timeline: string; roi: string }> = {
  strategy: {
    title: "Define your AI strategy and quantify business case",
    investment: "$20K–$60K (strategy workshop + consulting)",
    timeline: "2–3 months",
    roi: "Unlocks executive buy-in and prevents misaligned AI spend",
  },
  data: {
    title: "Invest in data quality, governance, and accessibility",
    investment: "$50K–$250K (data engineering + governance tooling)",
    timeline: "3–6 months",
    roi: "Data readiness is the single biggest predictor of AI success",
  },
  technology: {
    title: "Modernise infrastructure and build AI deployment capability",
    investment: "$100K–$500K+ (cloud migration + MLOps tooling)",
    timeline: "6–12 months",
    roi: "Reduces time-to-value for every subsequent AI use case",
  },
  people: {
    title: "Build AI literacy and hire or develop data talent",
    investment: "$30K–$120K/year (training programmes + talent)",
    timeline: "6–12 months",
    roi: "Human capability multiplies return on every AI investment",
  },
  governance: {
    title: "Establish AI governance, policy, and risk framework",
    investment: "$15K–$50K (policy development + tooling)",
    timeline: "1–3 months",
    roi: "Reduces regulatory and reputational risk; enables confident deployment",
  },
};

// ── Policy badges per gap ─────────────────────────────────────────────────────
const GAP_POLICIES: Record<string, { policy: string; clause: string; risk: "High" | "Medium" }[]> = {
  strategy: [
    { policy: "NIST AI RMF", clause: "GOVERN 1.1", risk: "Medium" },
    { policy: "ISO 42001",   clause: "Cl. 4.1",    risk: "Medium" },
  ],
  data: [
    { policy: "NIST AI RMF", clause: "MAP 1.5",  risk: "High" },
    { policy: "EU AI Act",   clause: "Art. 10",  risk: "High" },
    { policy: "ISO 42001",   clause: "Cl. 8.4",  risk: "High" },
  ],
  technology: [
    { policy: "NIST AI RMF", clause: "MANAGE 2.2", risk: "Medium" },
    { policy: "EU AI Act",   clause: "Art. 17",    risk: "Medium" },
    { policy: "ISO 42001",   clause: "Cl. 8.6",    risk: "Medium" },
  ],
  people: [
    { policy: "NIST AI RMF", clause: "GOVERN 6.1", risk: "Medium" },
    { policy: "ISO 42001",   clause: "Cl. 7.2",    risk: "Medium" },
  ],
  governance: [
    { policy: "EU AI Act",   clause: "Art. 9",     risk: "High" },
    { policy: "NIST AI RMF", clause: "GOVERN 1.2", risk: "High" },
    { policy: "ISO 42001",   clause: "Cl. 6.1",    risk: "High" },
  ],
};

const REGIONS = [
  "European Union",
  "United Kingdom",
  "United States & Canada",
  "Asia-Pacific",
  "Middle East & Africa",
  "Latin America",
  "Global / Not sure",
];

// Policies relevant per region — filters which badges show on results
const REGION_POLICIES: Record<string, string[]> = {
  "European Union":         ["EU AI Act", "NIST AI RMF", "ISO 42001"],
  "United Kingdom":         ["NIST AI RMF", "ISO 42001"],
  "United States & Canada": ["NIST AI RMF", "ISO 42001"],
  "Asia-Pacific":           ["ISO 42001", "NIST AI RMF"],
  "Middle East & Africa":   ["ISO 42001"],
  "Latin America":          ["ISO 42001", "NIST AI RMF"],
  "Global / Not sure":      ["EU AI Act", "NIST AI RMF", "ISO 42001"],
};

// ── ROI signal by overall tier ─────────────────────────────────────────────
const ROI_SIGNAL = [
  {
    tier: "Leading",
    headline: "$5M+ annual value at stake",
    detail: "Your organisation is positioned to generate transformational value from AI. Focus on scaling AI-native products, AI-assisted R&D, and autonomous process orchestration.",
  },
  {
    tier: "Scaling",
    headline: "$1M–$5M annual value within 12 months",
    detail: "2–3 high-impact use cases are within reach. Prioritise use cases with clear ROI and existing data. Expect 30–60% cost reduction in targeted processes.",
  },
  {
    tier: "Building",
    headline: "$200K–$1M annual value in 12–18 months",
    detail: "Focus on one or two quick-win use cases: process automation, intelligent document processing, or customer-facing AI. Build the data and governance foundation in parallel.",
  },
  {
    tier: "Exploring",
    headline: "Foundational investment required before ROI materialises",
    detail: "The priority is readiness, not deployment. Invest in strategy, data, and skills first. Early proof-of-concept work can demonstrate value at low cost while the foundation is built.",
  },
];

// ── Example radar data for intro page ─────────────────────────────────────────
const EXAMPLE_RADAR = [
  { subject: "Strategy",   score: 65, fullMark: 100 },
  { subject: "Data",       score: 38, fullMark: 100 },
  { subject: "Technology", score: 52, fullMark: 100 },
  { subject: "People",     score: 44, fullMark: 100 },
  { subject: "Governance", score: 28, fullMark: 100 },
];

// ── Color classes ─────────────────────────────────────────────────────────────
// Hex values for SVG fills in recharts custom ticks
const SECTION_HEX: Record<string, string> = {
  violet:  "#7c3aed",
  blue:    "#2563eb",
  cyan:    "#0891b2",
  amber:   "#d97706",
  emerald: "#059669",
};

// Custom colored tick for radar charts — shows dimension name in section color
const CustomRadarTick = ({ x, y, payload }: any) => {
  const section = SECTIONS.find(s => s.shortLabel === payload?.value);
  const hex = section ? (SECTION_HEX[section.color] ?? "#94a3b8") : "#94a3b8";
  return (
    <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight={700} fill={hex}>
      {payload?.value}
    </text>
  );
};

const COLOR_MAP: Record<string, { bg: string; text: string; border: string; fill: string }> = {
  violet:  { bg: "bg-violet-500/10",  text: "text-violet-600 dark:text-violet-400",  border: "border-violet-500/30",  fill: "fill-violet-500"  },
  blue:    { bg: "bg-blue-500/10",    text: "text-blue-600 dark:text-blue-400",      border: "border-blue-500/30",    fill: "fill-blue-500"    },
  cyan:    { bg: "bg-cyan-500/10",    text: "text-cyan-600 dark:text-cyan-400",      border: "border-cyan-500/30",    fill: "fill-cyan-500"    },
  amber:   { bg: "bg-amber-500/10",   text: "text-amber-600 dark:text-amber-400",    border: "border-amber-500/30",   fill: "fill-amber-500"   },
  emerald: { bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400",border: "border-emerald-500/30", fill: "fill-emerald-500" },
  rose:    { bg: "bg-rose-500/10",    text: "text-rose-600 dark:text-rose-400",      border: "border-rose-500/30",    fill: "fill-rose-500"    },
};

const TIER_COLOR: Record<string, string> = {
  Leading:   "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  Scaling:   "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
  Building:  "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
  Exploring: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30",
};

// ── Score bar ─────────────────────────────────────────────────────────────────
function ScoreBar({ score, color }: { score: number; color: string }) {
  const c = COLOR_MAP[color];
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-muted/50 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full rounded-full ${c.fill.replace("fill-", "bg-")}`}
        />
      </div>
      <span className="text-xs font-mono text-muted-foreground w-7 text-right">{score}</span>
    </div>
  );
}

// ── Results page ──────────────────────────────────────────────────────────────
function ResultsPage({ profile, answers, onRetake, isPreview }: {
  profile: OrgProfile;
  answers: Record<string, number>;
  onRetake: () => void;
  isPreview?: boolean;
}) {
  const overall = overallScore(answers);
  const tier = getTier(overall);
  const sectionScores = SECTIONS.map(s => ({ ...s, score: sectionScore(s.id, answers) }));
  const gaps = sectionScores.filter(s => s.score < 55).sort((a, b) => a.score - b.score);
  const roiSignal = ROI_SIGNAL.find(r => r.tier === tier.label)!;

  const radarData = sectionScores.map(s => ({
    subject: s.shortLabel,
    score: s.score,
    fullMark: 100,
  }));
  const allowedPolicies = profile.region ? (REGION_POLICIES[profile.region] ?? []) : ["EU AI Act", "NIST AI RMF", "ISO 42001"];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">AI Readiness Report</h2>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {profile.name && <span className="text-xs px-2.5 py-1 rounded-full bg-muted font-medium">{profile.name}</span>}
          {profile.industry && <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">{profile.industry}</span>}
          {profile.region && <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 font-medium">{profile.region}</span>}
          {profile.size && <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-medium">{profile.size} employees</span>}
        </div>
        {/* Preview banner */}
        {isPreview && (
          <div className="mt-3 border border-amber-400/40 bg-amber-50/50 dark:bg-amber-900/10 rounded-xl px-4 py-3 flex items-start gap-3">
            <span className="text-amber-600 text-sm font-semibold shrink-0">Preview Report</span>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This is an automated assessment. For a customised analysis with tailored recommendations,
              {" "}<a href="/#contact" className="text-primary underline font-medium">contact us</a>.
            </p>
          </div>
        )}
      </motion.div>

      {/* Overall score + tier */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="border border-border/60 rounded-2xl p-6 bg-card"
      >
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div>
            <p className="text-xs font-mono text-muted-foreground/60 uppercase tracking-widest mb-1">Overall Readiness</p>
            <div className="flex items-end gap-3 mb-2">
              <span className="text-5xl font-bold">{overall}</span>
              <span className="text-lg text-muted-foreground mb-1">/100</span>
            </div>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${TIER_COLOR[tier.label]}`}>
              {tier.label}
            </span>
            <p className="text-sm text-muted-foreground mt-3 max-w-sm">{tier.desc}</p>
          </div>

          {/* Radar chart + icon legend */}
          <div className="flex items-center gap-4">
            <div className="w-64 h-60">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} margin={{ top: 16, right: 40, bottom: 16, left: 40 }}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="subject" tick={<CustomRadarTick />} />
                  <Tooltip
                    formatter={(v: number) => [`${v}/100`, "Score"]}
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Radar
                    dataKey="score"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            {/* Icon legend — vertical */}
            <div className="flex flex-col gap-2">
              {sectionScores.map(s => {
                const c = COLOR_MAP[s.color];
                const Icon = s.icon;
                return (
                  <div key={s.id} className={`flex items-center gap-1.5 text-[11px] font-semibold ${c.text}`}>
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{s.shortLabel}</span>
                    <span className="ml-auto pl-2 font-mono">{s.score}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Section scores */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground/50 mb-3">Scores by Dimension</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sectionScores.map(s => {
            const c = COLOR_MAP[s.color];
            const Icon = s.icon;
            return (
              <div key={s.id} className="border border-border/50 rounded-xl p-4 bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-7 h-7 rounded-lg ${c.bg} flex items-center justify-center`}>
                    <Icon className={`w-3.5 h-3.5 ${c.text}`} />
                  </div>
                  <span className="text-sm font-semibold">{s.shortLabel}</span>
                  <span className={`ml-auto text-xs font-mono font-bold ${c.text}`}>{s.score}</span>
                </div>
                <ScoreBar score={s.score} color={s.color} />
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* ROI Signal */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground/50 mb-3">Value & ROI Signal</p>
        <div className="border border-border/50 rounded-2xl p-5 bg-card">
          <p className="text-base font-bold mb-1">{roiSignal.headline}</p>
          <p className="text-sm text-muted-foreground leading-relaxed">{roiSignal.detail}</p>
        </div>
      </motion.div>

      {/* Priority gaps */}
      {gaps.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground/50 mb-3">Priority Gaps to Close</p>
          <div className="space-y-3">
            {gaps.slice(0, 3).map((g, i) => {
              const advice = GAP_ADVICE[g.id];
              const c = COLOR_MAP[g.color];
              const Icon = g.icon;
              return (
                <div key={g.id} className="border border-border/50 rounded-xl p-4 bg-card">
                  <div className="flex items-start gap-3">
                    <div className={`w-7 h-7 rounded-lg ${c.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                      <Icon className={`w-3.5 h-3.5 ${c.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-muted-foreground/50">#{i + 1} Priority</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${TIER_COLOR["Exploring"]}`}>
                          Score: {g.score}
                        </span>
                      </div>
                      <p className="text-sm font-semibold mb-2">{advice.title}</p>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wide mb-0.5">Investment</p>
                          <p className="text-xs text-muted-foreground">{advice.investment}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wide mb-0.5">Timeline</p>
                          <p className="text-xs text-muted-foreground">{advice.timeline}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wide mb-0.5">Why it matters</p>
                          <p className="text-xs text-muted-foreground">{advice.roi}</p>
                        </div>
                      </div>
                      {/* Policy badges — filtered by region */}
                      {GAP_POLICIES[g.id]?.filter(p => allowedPolicies.includes(p.policy)).length > 0 && (
                        <div className="mt-2.5 pt-2.5 border-t border-border/30 flex flex-wrap gap-1.5">
                          {GAP_POLICIES[g.id].filter(p => allowedPolicies.includes(p.policy)).map(p => (
                            <span key={p.clause} className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${
                              p.risk === "High"
                                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                            }`}>
                              {p.risk === "High" ? "⚠ " : ""}{p.policy} · {p.clause}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex flex-wrap gap-3 pt-2"
      >
        <button
          onClick={onRetake}
          className="text-sm px-5 py-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
        >
          Retake Assessment
        </button>
        <Link
          to="/client-discovery"
          className="text-sm px-5 py-2.5 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium"
        >
          Start AI Risk Assessment →
        </Link>
      </motion.div>
    </div>
  );
}

// ── Question step ─────────────────────────────────────────────────────────────
function QuestionStep({
  section, question, answer, onAnswer,
}: {
  section: Section;
  question: Question;
  answer: number | undefined;
  onAnswer: (score: number) => void;
}) {
  const c = COLOR_MAP[section.color];
  const Icon = section.icon;
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <div className={`w-7 h-7 rounded-lg ${c.bg} flex items-center justify-center`}>
          <Icon className={`w-3.5 h-3.5 ${c.text}`} />
        </div>
        <span className={`text-xs font-semibold ${c.text}`}>{section.label}</span>
      </div>
      <p className="text-sm font-semibold leading-relaxed">{question.text}</p>
      <div className="space-y-2">
        {question.options.map((opt) => (
          <button
            key={opt.label}
            onClick={() => onAnswer(opt.score)}
            className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
              answer === opt.score
                ? `${c.border} ${c.bg} ${c.text} font-medium`
                : "border-border hover:border-muted-foreground/40 text-foreground hover:bg-muted/30"
            }`}
          >
            <div className="flex items-center gap-2">
              {answer === opt.score ? (
                <CheckCircle2 className={`w-4 h-4 shrink-0 ${c.text}`} />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />
              )}
              {opt.label}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AIReadinessAssessment() {
  const [stage, setStage] = useState<"intro" | "questions" | "results">("intro");
  const [profile, setProfile] = useState<OrgProfile>({ name: "", industry: "", size: "", revenue: "", goal: "", region: "" });
  const [sectionIdx, setSectionIdx] = useState(0);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});

  // Client-wise state
  const [clients, setClients] = useState<ARClient[]>(() => { seedARDemoClient(); return loadClients(); });
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [pastOpen, setPastOpen] = useState(false);

  const currentSection = SECTIONS[sectionIdx];
  const currentQuestion = currentSection?.questions[questionIdx];
  const currentAnswer = answers[currentQuestion?.id];

  const totalQuestions = SECTIONS.reduce((acc, s) => acc + s.questions.length, 0);
  const answeredCount = SECTIONS.slice(0, sectionIdx).reduce((acc, s) => acc + s.questions.length, 0) + questionIdx;
  const progress = Math.round((answeredCount / totalQuestions) * 100);

  // Save results when stage transitions to "results"
  useEffect(() => {
    if (stage === "results" && activeClientId) {
      saveAnswers(activeClientId, answers);
      const overall = overallScore(answers);
      const tier = getTier(overall);
      const updated = clients.map(c =>
        c.id === activeClientId
          ? { ...c, completedAt: new Date().toISOString(), overallScore: overall, tier: tier.label }
          : c
      );
      setClients(updated);
      saveClients(updated);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  function handleAnswer(score: number) {
    const next = { ...answers, [currentQuestion.id]: score };
    setAnswers(next);
    if (activeClientId) saveAnswers(activeClientId, next);
  }

  function handleNext() {
    if (questionIdx < currentSection.questions.length - 1) {
      setQuestionIdx(q => q + 1);
    } else if (sectionIdx < SECTIONS.length - 1) {
      setSectionIdx(s => s + 1);
      setQuestionIdx(0);
    } else {
      setStage("results");
    }
  }

  function handleBack() {
    if (questionIdx > 0) {
      setQuestionIdx(q => q - 1);
    } else if (sectionIdx > 0) {
      setSectionIdx(s => s - 1);
      setQuestionIdx(SECTIONS[sectionIdx - 1].questions.length - 1);
    } else {
      setStage("intro");
    }
  }

  function handleRetake() {
    setStage("intro");
    setSectionIdx(0);
    setQuestionIdx(0);
    setAnswers({});
    setProfile({ name: "", industry: "", size: "", revenue: "", goal: "", region: "" });
    setActiveClientId(null);
  }

  function handleStartAssessment() {
    const id = Date.now().toString();
    const newClient: ARClient = {
      id,
      name: profile.name || "Unnamed",
      industry: profile.industry,
      size: profile.size,
      region: profile.region,
      createdAt: new Date().toISOString(),
    };
    const updated = [newClient, ...clients];
    setClients(updated);
    saveClients(updated);
    setActiveClientId(id);
    // Load any existing answers for this id (will be empty for new, but safe)
    const existing = loadAnswers(id);
    if (Object.keys(existing).length > 0) {
      setAnswers(existing);
    }
    setStage("questions");
  }

  function handleViewResults(client: ARClient) {
    const savedAnswers = loadAnswers(client.id);
    setAnswers(savedAnswers);
    setProfile({
      name: client.name === "Unnamed" ? "" : client.name,
      industry: client.industry,
      size: client.size,
      region: client.region ?? "",
      revenue: "",
      goal: "",
    });
    setActiveClientId(client.id);
    setStage("results");
  }

  function handleRetakeClient(client: ARClient) {
    setProfile({
      name: client.name === "Unnamed" ? "" : client.name,
      industry: client.industry,
      size: client.size,
      region: client.region ?? "",
      revenue: "",
      goal: "",
    });
    const saved = loadAnswers(client.id);
    const hasSaved = Object.keys(saved).length > 0;
    setAnswers(hasSaved ? saved : {});
    setActiveClientId(client.id);
    if (hasSaved) {
      // Resume at first unanswered question
      let resumeSi = 0, resumeQi = 0;
      outer: for (let si = 0; si < SECTIONS.length; si++) {
        for (let qi = 0; qi < SECTIONS[si].questions.length; qi++) {
          if (saved[SECTIONS[si].questions[qi].id] === undefined) {
            resumeSi = si; resumeQi = qi;
            break outer;
          }
        }
        // All answered in this section — try next
        resumeSi = si; resumeQi = SECTIONS[si].questions.length - 1;
      }
      setSectionIdx(resumeSi);
      setQuestionIdx(resumeQi);
      setStage("questions");
    } else {
      setSectionIdx(0);
      setQuestionIdx(0);
      setStage("intro");
    }
  }

  function handleDeleteClient(id: string) {
    const updated = clients.filter(c => c.id !== id);
    setClients(updated);
    saveClients(updated);
    localStorage.removeItem(answersKey(id));
  }

  const profileComplete = profile.industry && profile.size && profile.region;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-background/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          {stage === "intro" ? (
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Portfolio
            </Link>
          ) : (
            <button onClick={() => setStage("intro")} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          )}
          {stage === "questions" && (
            <div className="flex items-center gap-3">
              <div className="w-32 h-1.5 rounded-full bg-muted/50 overflow-hidden">
                <motion.div
                  animate={{ width: `${progress}%` }}
                  className="h-full rounded-full bg-primary"
                />
              </div>
              <span className="text-xs font-mono text-muted-foreground">{progress}%</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <AnimatePresence mode="wait">

          {/* ── Intro / Profile ── */}
          {stage === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="space-y-8"
            >
              <div>
                <p className="font-mono text-xs text-muted-foreground/60 uppercase tracking-widest mb-3">Diagnostic Tool</p>
                <h1 className="text-2xl font-bold mb-2">AI Readiness Assessment</h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  25 questions · 5 dimensions · Scored readiness report with ROI signal and prioritised gaps.
                </p>
              </div>

              {/* Sample radar + output card */}
              <div className="border border-border/50 rounded-2xl p-5 bg-card">
                <p className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest mb-4">
                  Sample output — Building tier
                </p>
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  {/* Chart + icon legend */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="w-48 h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={EXAMPLE_RADAR} margin={{ top: 12, right: 32, bottom: 12, left: 32 }}>
                          <PolarGrid stroke="hsl(var(--border))" />
                          <PolarAngleAxis dataKey="subject" tick={<CustomRadarTick />} />
                          <Radar dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} strokeWidth={2} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {SECTIONS.map(s => {
                        const c = COLOR_MAP[s.color];
                        const Icon = s.icon;
                        return (
                          <div key={s.id} className={`flex items-center gap-1.5 text-[10px] font-semibold ${c.text}`}>
                            <Icon className="w-3 h-3 shrink-0" />
                            <span>{s.shortLabel}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {/* Output highlights */}
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    {[
                      { label: "Overall score", value: "45 / 100", highlight: true },
                      { label: "Readiness tier", value: "Building", highlight: true },
                      { label: "Top gaps", value: "3 identified" },
                      { label: "ROI signal", value: "Per tier" },
                      { label: "Investment guide", value: "Per gap" },
                      { label: "Policy obligations", value: "NIST · EU AI · ISO" },
                    ].map(item => (
                      <div key={item.label} className={`rounded-xl px-3 py-2.5 border ${item.highlight ? "border-primary/20 bg-primary/5" : "border-border/40 bg-muted/30"}`}>
                        <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wide mb-0.5">{item.label}</p>
                        <p className={`text-sm font-semibold ${item.highlight ? "text-primary" : ""}`}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Past assessments */}
              {clients.length > 0 && (
                <div className="border border-border/50 rounded-2xl bg-card overflow-hidden">
                  <button
                    onClick={() => setPastOpen(o => !o)}
                    className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-semibold hover:bg-muted/30 transition-colors"
                  >
                    <span>Past Assessments <span className="ml-1.5 text-xs font-mono text-muted-foreground/60">({clients.length})</span></span>
                    <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${pastOpen ? "rotate-90" : ""}`} />
                  </button>
                  {pastOpen && (
                    <div className="border-t border-border/40 divide-y divide-border/30">
                      {clients.map(client => {
                        const savedAns = loadAnswers(client.id);
                        const answeredCount = Object.keys(savedAns).length;
                        const pct = Math.round(answeredCount / totalQuestions * 100);
                        return (
                        <div key={client.id} className="px-5 py-3 flex items-center gap-3 flex-wrap">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{client.name}</p>
                            <p className="text-xs text-muted-foreground">{client.industry} · {client.size}</p>
                            {!client.completedAt && answeredCount > 0 && (
                              <div className="flex items-center gap-2 mt-1">
                                <div className="w-24 h-1 rounded-full bg-muted/60 overflow-hidden">
                                  <div className="h-full rounded-full bg-primary/60" style={{ width: `${pct}%` }} />
                                </div>
                                <span className="text-[10px] font-mono text-muted-foreground/60">{pct}% · {answeredCount}/{totalQuestions}q</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {client.overallScore !== undefined && (
                              <span className="text-xs font-mono font-bold text-muted-foreground">{client.overallScore}/100</span>
                            )}
                            {client.tier && (
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${TIER_COLOR[client.tier] ?? ""}`}>
                                {client.tier}
                              </span>
                            )}
                            {client.completedAt && (
                              <span className="text-[10px] text-muted-foreground/50">
                                {new Date(client.completedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {client.completedAt && (
                              <button
                                onClick={() => handleViewResults(client)}
                                className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                              >
                                View Results
                              </button>
                            )}
                            <button
                              onClick={() => handleRetakeClient(client)}
                              className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                            >
                              {client.completedAt ? "Retake" : "Resume"}
                            </button>
                            <button
                              onClick={() => handleDeleteClient(client.id)}
                              className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Profile form */}
              <div className="border border-border/60 rounded-2xl p-6 bg-card space-y-4">
                <p className="text-sm font-semibold">Tell us about your organisation</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-mono text-muted-foreground/60 uppercase tracking-wide block mb-1">Organisation name (optional)</label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                      placeholder="Acme Corp"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-mono text-muted-foreground/60 uppercase tracking-wide block mb-1">Industry *</label>
                    <select
                      value={profile.industry}
                      onChange={e => setProfile(p => ({ ...p, industry: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:border-primary transition-colors"
                    >
                      <option value="">Select industry…</option>
                      {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-mono text-muted-foreground/60 uppercase tracking-wide block mb-1">Company size *</label>
                    <select
                      value={profile.size}
                      onChange={e => setProfile(p => ({ ...p, size: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:border-primary transition-colors"
                    >
                      <option value="">Select size…</option>
                      {COMPANY_SIZES.map(s => <option key={s} value={s}>{s} employees</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-mono text-muted-foreground/60 uppercase tracking-wide block mb-1">Region / Geography *</label>
                    <select
                      value={profile.region}
                      onChange={e => setProfile(p => ({ ...p, region: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:border-primary transition-colors"
                    >
                      <option value="">Select region…</option>
                      {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-mono text-muted-foreground/60 uppercase tracking-wide block mb-1">Annual revenue (optional)</label>
                    <select
                      value={profile.revenue}
                      onChange={e => setProfile(p => ({ ...p, revenue: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:border-primary transition-colors"
                    >
                      <option value="">Select range…</option>
                      {REVENUE_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-mono text-muted-foreground/60 uppercase tracking-wide block mb-1">Primary AI objective (optional)</label>
                    <select
                      value={profile.goal}
                      onChange={e => setProfile(p => ({ ...p, goal: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:border-primary transition-colors"
                    >
                      <option value="">Select goal…</option>
                      {AI_GOALS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <button
                onClick={handleStartAssessment}
                disabled={!profileComplete}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Start Assessment <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* ── Questions ── */}
          {stage === "questions" && currentQuestion && (
            <motion.div
              key={`${sectionIdx}-${questionIdx}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {/* Org info strip — always visible, name editable */}
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-muted/40 border border-border/40 flex-wrap">
                <input
                  type="text"
                  value={profile.name}
                  onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                  placeholder="Organisation name…"
                  className="flex-1 min-w-[140px] bg-transparent text-sm font-semibold outline-none placeholder:text-muted-foreground/40"
                />
                {profile.industry && <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium shrink-0">{profile.industry}</span>}
                {profile.region && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 font-medium shrink-0">{profile.region}</span>}
              </div>

              {/* Section stepper */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1">
                {SECTIONS.map((s, i) => {
                  const c = COLOR_MAP[s.color];
                  const done = i < sectionIdx;
                  const active = i === sectionIdx;
                  return (
                    <div key={s.id} className="flex items-center gap-1 shrink-0">
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                        done ? "bg-muted text-muted-foreground" :
                        active ? `${c.bg} ${c.text} border ${c.border}` :
                        "text-muted-foreground/40"
                      }`}>
                        {done && <CheckCircle2 className="w-3 h-3" />}
                        {s.shortLabel}
                      </div>
                      {i < SECTIONS.length - 1 && (
                        <ChevronRight className="w-3 h-3 text-muted-foreground/30 shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Question */}
              <div className="border border-border/60 rounded-2xl p-6 bg-card">
                <div className="flex items-center justify-between mb-5">
                  <span className="text-xs font-mono text-muted-foreground/50">
                    Question {questionIdx + 1} of {currentSection.questions.length}
                  </span>
                </div>
                <QuestionStep
                  section={currentSection}
                  question={currentQuestion}
                  answer={currentAnswer}
                  onAnswer={handleAnswer}
                />
              </div>

              {/* Nav buttons */}
              <div className="flex justify-between">
                <button
                  onClick={handleBack}
                  className="text-sm px-4 py-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={currentAnswer === undefined}
                  className="flex items-center gap-2 text-sm px-5 py-2.5 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                >
                  {sectionIdx === SECTIONS.length - 1 && questionIdx === currentSection.questions.length - 1
                    ? "See Results"
                    : "Next"
                  }
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Results ── */}
          {stage === "results" && (
            <motion.div key="results" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <ResultsPage profile={profile} answers={answers} onRetake={handleRetake} isPreview={IS_PREVIEW} />
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
