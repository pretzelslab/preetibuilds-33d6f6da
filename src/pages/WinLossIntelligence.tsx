import { useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { useVisitLogger } from "@/hooks/useVisitLogger";

// ─── Types ────────────────────────────────────────────────────────────────────

type Outcome = "won" | "lost" | "stalled";
type Sector = "Enterprise" | "Mid-Market" | "SMB";
type Region = "North America" | "EMEA" | "APAC";
type BlockerCategory = "pricing" | "legal" | "implementation" | "competitive" | "champion" | "product";
type Severity = "critical" | "high" | "medium" | "low";
type Segment = "Emerging" | "Commercial" | "Majors" | "Enterprise";
type EECountBand = "1–100" | "101–500" | "501–2K" | "2K–10K" | "10K+";
type DealType = "Net New" | "Add-on" | "Expansion";

interface Deal {
  id: string;
  company: string;
  sector: Sector;
  region: Region;
  segment: Segment;
  eeCountBand: EECountBand;
  dealType: DealType;
  outcome: Outcome;
  dealSizeK: number;
  dealCycleDays: number;
  stage: string;
  blockers: BlockerCategory[];
  transcriptExcerpt: string;
  aiConclusion: string;
  confidence: number;
  grounded: boolean;
  inferenceRisk: boolean;
}

interface SystemicPattern {
  id: BlockerCategory;
  label: string;
  description: string;
  orgBottleneck: string;
  affectedDeals: number;
  pctDeals: number;
  avgCycleImpactDays: number;
  severity: Severity;
  exampleDeals: string[];
}

interface InferenceFlag {
  id: string;
  deals: string[];
  type: string;
  description: string;
  action: string;
  suppressed: boolean;
}

interface EvidenceItem {
  claim: string;
  sourceQuote: string;
  type: "direct" | "inferred";
  claimConfidence: number;
}

interface LiveInferenceFlag {
  signal: string;
  inference: string;
  riskLevel: "low" | "medium" | "high";
}

interface AnalysisMeta {
  model: string;
  promptVersion: string;
  inputTokens: number | null;
  outputTokens: number | null;
  processingMs: number;
  timestamp: string;
  dealId: string;
}

interface AnalysisResult {
  primaryBlocker: BlockerCategory | "none";
  secondaryBlockers: string[];
  conclusion: string;
  confidence: number;
  grounded: boolean;
  inferenceRisk: boolean;
  evidenceChain: EvidenceItem[];
  inferenceFlags: LiveInferenceFlag[];
  processingNote: string;
  meta: AnalysisMeta;
  error?: string;
}

type EvalRating = "agree" | "partial" | "disagree" | null;

interface EvalState {
  rating: EvalRating;
  claimGrounded: Record<number, boolean | null>;
  note: string;
  submitted: boolean;
}

interface FilterState {
  segment: Segment | "All";
  region: Region | "All";
  outcome: Outcome | "All";
  eeCountBand: EECountBand | "All";
  dealType: DealType | "All";
}

const DEFAULT_FILTERS: FilterState = {
  segment: "All", region: "All", outcome: "All", eeCountBand: "All", dealType: "All",
};

// ─── Constants ────────────────────────────────────────────────────────────────

const OUTCOME_COLORS: Record<Outcome, string> = {
  won: "#10b981", lost: "#ef4444", stalled: "#f59e0b",
};

const BLOCKER_COLORS: Record<BlockerCategory, string> = {
  pricing: "#3b82f6", legal: "#8b5cf6", implementation: "#f97316",
  competitive: "#14b8a6", champion: "#ec4899", product: "#6366f1",
};

const BLOCKER_LABELS: Record<BlockerCategory, string> = {
  pricing: "Pricing", legal: "Legal", implementation: "Implementation",
  competitive: "Competitive", champion: "Champion Loss", product: "Product Gap",
};

const SEVERITY_COLORS: Record<Severity, string> = {
  critical: "#dc2626", high: "#ea580c", medium: "#ca8a04", low: "#16a34a",
};

// ─── Synthetic Deal Data (v0.1 — no real PII) ─────────────────────────────────

const DEALS: Deal[] = [
  { id: "D-001", company: "Nexora Systems", sector: "Enterprise", region: "North America", segment: "Majors", eeCountBand: "501–2K", dealType: "Net New", outcome: "lost", dealSizeK: 280, dealCycleDays: 94, stage: "Contract Negotiation", blockers: ["pricing", "legal"], transcriptExcerpt: "Legal pushed back on liability clauses in Section 12. We've been waiting 6 weeks for internal sign-off. Pricing was also flagged — they benchmarked us 18% above a competitor.", aiConclusion: "Deal lost due to compounding legal delay and late-stage pricing gap.", confidence: 0.88, grounded: true, inferenceRisk: false },
  { id: "D-002", company: "BlueShift Analytics", sector: "Mid-Market", region: "EMEA", segment: "Commercial", eeCountBand: "101–500", dealType: "Net New", outcome: "lost", dealSizeK: 85, dealCycleDays: 67, stage: "Technical Evaluation", blockers: ["implementation", "competitive"], transcriptExcerpt: "Their IT team said they don't have bandwidth to run the integration this quarter. Competitor sent them a demo of their native data connector — much faster to deploy.", aiConclusion: "Technical readiness gap accelerated competitive displacement.", confidence: 0.82, grounded: true, inferenceRisk: false },
  { id: "D-003", company: "Vertis Health", sector: "Enterprise", region: "North America", segment: "Enterprise", eeCountBand: "2K–10K", dealType: "Expansion", outcome: "stalled", dealSizeK: 340, dealCycleDays: 142, stage: "Legal Review", blockers: ["legal", "champion"], transcriptExcerpt: "Our champion left the company. The new VP hasn't prioritized this at all. Legal review has been open 11 weeks with no movement.", aiConclusion: "Champion departure combined with legal stall — no escalation path established.", confidence: 0.91, grounded: true, inferenceRisk: false },
  { id: "D-004", company: "Praxis Software", sector: "SMB", region: "APAC", segment: "Emerging", eeCountBand: "1–100", dealType: "Net New", outcome: "won", dealSizeK: 42, dealCycleDays: 38, stage: "Closed Won", blockers: [], transcriptExcerpt: "Simple procurement process. IT was ready. Decision maker had authority to sign without committee review.", aiConclusion: "Clean win. Fast procurement cycle, clear internal champion with budget authority.", confidence: 0.95, grounded: true, inferenceRisk: false },
  { id: "D-005", company: "Cedera Group", sector: "Enterprise", region: "EMEA", segment: "Enterprise", eeCountBand: "10K+", dealType: "Net New", outcome: "lost", dealSizeK: 520, dealCycleDays: 112, stage: "Procurement", blockers: ["implementation", "product"], transcriptExcerpt: "They need multi-tenant SSO and we don't support it yet. Their IT roadmap is locked for 18 months.", aiConclusion: "Loss attributable to product roadmap gap (multi-tenant SSO) combined with buyer-side IT freeze.", confidence: 0.93, grounded: true, inferenceRisk: false },
  { id: "D-006", company: "Lumen Financial", sector: "Mid-Market", region: "North America", segment: "Commercial", eeCountBand: "101–500", dealType: "Add-on", outcome: "won", dealSizeK: 95, dealCycleDays: 55, stage: "Closed Won", blockers: ["pricing"], transcriptExcerpt: "Initial pricing concern resolved when we restructured to usage-based model. Annual commit was too risky given their budget cycle.", aiConclusion: "Won after pricing model adjustment. Usage-based pricing as default may improve conversion.", confidence: 0.87, grounded: true, inferenceRisk: false },
  { id: "D-007", company: "Ardent Logistics", sector: "SMB", region: "North America", segment: "Emerging", eeCountBand: "1–100", dealType: "Net New", outcome: "lost", dealSizeK: 28, dealCycleDays: 45, stage: "Demo / Evaluation", blockers: ["competitive"], transcriptExcerpt: "They went with a smaller tool that integrates with their TMS out of the box. Cost wasn't the issue — native integration was.", aiConclusion: "Lost to integration-native competitor. SMB segment shows high sensitivity to out-of-box compatibility.", confidence: 0.84, grounded: true, inferenceRisk: false },
  { id: "D-008", company: "Solis Energy", sector: "Enterprise", region: "APAC", segment: "Enterprise", eeCountBand: "2K–10K", dealType: "Net New", outcome: "stalled", dealSizeK: 410, dealCycleDays: 98, stage: "Executive Review", blockers: ["champion", "legal"], transcriptExcerpt: "Our exec sponsor is on sabbatical. The legal team in Singapore has different contract requirements than what we scoped for.", aiConclusion: "Sponsor absence plus regional legal divergence. APAC legal requirements not factored into initial scoping.", confidence: 0.79, grounded: true, inferenceRisk: false },
  { id: "D-009", company: "Marginal AI", sector: "Mid-Market", region: "North America", segment: "Majors", eeCountBand: "101–500", dealType: "Net New", outcome: "won", dealSizeK: 115, dealCycleDays: 48, stage: "Closed Won", blockers: [], transcriptExcerpt: "CTO was both the buyer and technical evaluator. Fast evaluation, clear ROI narrative. No committee sign-off required.", aiConclusion: "Clean win. Technical buyer with budget authority significantly reduces cycle length.", confidence: 0.92, grounded: true, inferenceRisk: false },
  { id: "D-010", company: "Vantara Retail", sector: "Enterprise", region: "EMEA", segment: "Enterprise", eeCountBand: "10K+", dealType: "Expansion", outcome: "lost", dealSizeK: 290, dealCycleDays: 88, stage: "Commercial Review", blockers: ["implementation", "pricing"], transcriptExcerpt: "They need a phased rollout across 12 regions but our implementation model is all-or-nothing. Pricing didn't account for phased value delivery either.", aiConclusion: "Implementation model rigidity created compounding pricing friction.", confidence: 0.86, grounded: true, inferenceRisk: false },
  { id: "D-011", company: "Kelion Health", sector: "Mid-Market", region: "North America", segment: "Commercial", eeCountBand: "101–500", dealType: "Net New", outcome: "lost", dealSizeK: 78, dealCycleDays: 72, stage: "Technical Review", blockers: ["product"], transcriptExcerpt: "HIPAA audit logging at the field level isn't supported. Their compliance team said it's non-negotiable for any PHI-touching system.", aiConclusion: "Healthcare compliance gap (HIPAA field-level audit logging). Recurring product gap across healthcare deals.", confidence: 0.94, grounded: true, inferenceRisk: false },
  { id: "D-012", company: "Frontier Ops", sector: "SMB", region: "EMEA", segment: "Emerging", eeCountBand: "1–100", dealType: "Net New", outcome: "won", dealSizeK: 31, dealCycleDays: 29, stage: "Closed Won", blockers: [], transcriptExcerpt: "Quick pilot to close. Single decision maker, self-serve onboarding worked smoothly.", aiConclusion: "SMB self-serve model effective. Short cycle, low friction.", confidence: 0.91, grounded: true, inferenceRisk: false },
  { id: "D-013", company: "Tessera Capital", sector: "Enterprise", region: "North America", segment: "Enterprise", eeCountBand: "2K–10K", dealType: "Net New", outcome: "lost", dealSizeK: 680, dealCycleDays: 165, stage: "Contract Negotiation", blockers: ["legal", "champion"], transcriptExcerpt: "Six months in. Legal redlined 23 clauses. Our champion VP left the company in month 4. New CPO doesn't know us.", aiConclusion: "Longest cycle in dataset. Simultaneous legal stall and champion departure.", confidence: 0.96, grounded: true, inferenceRisk: false },
  { id: "D-014", company: "Auren Pharma", sector: "Enterprise", region: "APAC", segment: "Majors", eeCountBand: "501–2K", dealType: "Net New", outcome: "won", dealSizeK: 185, dealCycleDays: 62, stage: "Closed Won", blockers: [], transcriptExcerpt: "Strong IT team. They ran a structured evaluation; we scored highest on security and compliance posture. Budget was pre-approved by the CFO.", aiConclusion: "Enterprise win driven by security and compliance positioning.", confidence: 0.89, grounded: true, inferenceRisk: false },
  { id: "D-015", company: "Corvus Digital", sector: "Mid-Market", region: "EMEA", segment: "Commercial", eeCountBand: "101–500", dealType: "Net New", outcome: "lost", dealSizeK: 92, dealCycleDays: 84, stage: "Evaluation", blockers: ["competitive", "pricing"], transcriptExcerpt: "Competitor came in 22% cheaper at the end. We couldn't match on price and couldn't articulate enough differentiation to justify the gap late in the cycle.", aiConclusion: "Late-stage price competition without differentiation narrative.", confidence: 0.83, grounded: true, inferenceRisk: false },
  { id: "D-016", company: "Helix Solutions", sector: "SMB", region: "North America", segment: "Emerging", eeCountBand: "1–100", dealType: "Add-on", outcome: "won", dealSizeK: 38, dealCycleDays: 33, stage: "Closed Won", blockers: [], transcriptExcerpt: "Referred by an existing customer. No competitive evaluation. Decision was made before the first call.", aiConclusion: "Referral-driven win. Customer reference program driving highest-quality SMB inbound.", confidence: 0.97, grounded: true, inferenceRisk: false },
  { id: "D-017", company: "Orion Dynamics", sector: "Enterprise", region: "North America", segment: "Enterprise", eeCountBand: "2K–10K", dealType: "Expansion", outcome: "stalled", dealSizeK: 450, dealCycleDays: 127, stage: "Security Review", blockers: ["implementation", "legal"], transcriptExcerpt: "Security review has 47 open questions. Their IT team is understaffed following a reorg. Legal hasn't reviewed the DPA yet — they have a 3-person legal team now.", aiConclusion: "Post-reorg IT capacity constraint driving both security review delay and implementation risk.", confidence: 0.88, grounded: true, inferenceRisk: true },
  { id: "D-018", company: "Quanta Ventures", sector: "Mid-Market", region: "APAC", segment: "Commercial", eeCountBand: "101–500", dealType: "Add-on", outcome: "lost", dealSizeK: 67, dealCycleDays: 59, stage: "Executive Review", blockers: ["champion"], transcriptExcerpt: "Our main contact was promoted to a different division. The new contact didn't understand the use case and quietly deprioritized the evaluation.", aiConclusion: "Champion promotion (not departure) caused deal loss — often overlooked risk.", confidence: 0.81, grounded: true, inferenceRisk: false },
  { id: "D-019", company: "Stratum Analytics", sector: "Enterprise", region: "EMEA", segment: "Enterprise", eeCountBand: "10K+", dealType: "Net New", outcome: "lost", dealSizeK: 395, dealCycleDays: 103, stage: "Procurement", blockers: ["implementation", "product"], transcriptExcerpt: "They need a German-language UI and EMEA data residency. Both are 6 months out on our roadmap. Implementation team couldn't start until next fiscal year regardless.", aiConclusion: "Localization and data residency gap. EMEA enterprise segment requires local infrastructure commitments.", confidence: 0.90, grounded: true, inferenceRisk: false },
  { id: "D-020", company: "Nexpoint Group", sector: "SMB", region: "North America", segment: "Emerging", eeCountBand: "1–100", dealType: "Net New", outcome: "won", dealSizeK: 22, dealCycleDays: 25, stage: "Closed Won", blockers: [], transcriptExcerpt: "Inbound demo request, self-serve trial, fast close. No negotiation.", aiConclusion: "Inbound-driven win. Shortest cycle in dataset. Product-led growth motion working for SMB.", confidence: 0.94, grounded: true, inferenceRisk: false },
  { id: "D-021", company: "Verity Insurance", sector: "Enterprise", region: "North America", segment: "Majors", eeCountBand: "2K–10K", dealType: "Expansion", outcome: "lost", dealSizeK: 315, dealCycleDays: 91, stage: "Contract Negotiation", blockers: ["legal", "pricing"], transcriptExcerpt: "Their legal team wants unlimited liability terms. We can't agree on that. Pricing was also flagged — they expected a multi-year volume discount that required exec approval we couldn't get in time.", aiConclusion: "Legal terms (liability cap) non-negotiable on both sides. Internal approval bottleneck cost the deal.", confidence: 0.87, grounded: true, inferenceRisk: false },
  { id: "D-022", company: "Cynet Manufacturing", sector: "Mid-Market", region: "EMEA", segment: "Majors", eeCountBand: "501–2K", dealType: "Net New", outcome: "won", dealSizeK: 88, dealCycleDays: 51, stage: "Closed Won", blockers: [], transcriptExcerpt: "Strong product-market fit in manufacturing ops. Procurement was straightforward and champion had full budget authority.", aiConclusion: "Clean mid-market win. High PMF in manufacturing vertical reduces evaluation friction.", confidence: 0.92, grounded: true, inferenceRisk: false },
  { id: "D-023", company: "Parallax Systems", sector: "Enterprise", region: "APAC", segment: "Enterprise", eeCountBand: "10K+", dealType: "Net New", outcome: "lost", dealSizeK: 510, dealCycleDays: 138, stage: "Technical Evaluation", blockers: ["implementation", "competitive"], transcriptExcerpt: "Their CTO benchmarked us on a 5-node distributed test. We failed on latency at scale. Competitor passed. Their implementation timeline was also 3 months shorter than ours.", aiConclusion: "Technical performance gap at scale plus implementation speed disadvantage.", confidence: 0.91, grounded: true, inferenceRisk: false },
  { id: "D-024", company: "Opal Consulting", sector: "Mid-Market", region: "North America", segment: "Majors", eeCountBand: "101–500", dealType: "Net New", outcome: "won", dealSizeK: 104, dealCycleDays: 44, stage: "Closed Won", blockers: [], transcriptExcerpt: "Champion had used us at a prior company. Accelerated evaluation — they skipped two stages of procurement.", aiConclusion: "Prior user experience is a significant deal accelerator.", confidence: 0.93, grounded: true, inferenceRisk: false },
  { id: "D-025", company: "Delphi Biotech", sector: "Enterprise", region: "EMEA", segment: "Enterprise", eeCountBand: "501–2K", dealType: "Net New", outcome: "stalled", dealSizeK: 620, dealCycleDays: 175, stage: "Executive Review", blockers: ["champion", "legal", "product"], transcriptExcerpt: "The CTO who initiated this is now focused on an acquisition. Legal has been silent for 3 months. They also need a validated audit trail for FDA 21 CFR Part 11 — not in our current product.", aiConclusion: "Largest deal in dataset. Triple blocker: champion distraction, legal silence, critical product compliance gap.", confidence: 0.85, grounded: true, inferenceRisk: true },
];

const PATTERNS: SystemicPattern[] = [
  { id: "legal", label: "Legal Review Delays", description: "Legal sign-off is the single largest deal cycle extender. Contract redlining stalls average 52 additional days with no internal SLA or dedicated GTM legal support.", orgBottleneck: "Shared legal team with no GTM SLA. No escalation path for commercial deadlines. Standard templates incompatible with APAC/EMEA regional requirements.", affectedDeals: 7, pctDeals: 28, avgCycleImpactDays: 52, severity: "high", exampleDeals: ["D-001", "D-003", "D-008", "D-013", "D-017", "D-021", "D-025"] },
  { id: "implementation", label: "Implementation Readiness Gap", description: "Buyer-side IT bandwidth and internal capacity to absorb onboarding is the second most frequent blocker. All-or-nothing implementation model is incompatible with phased enterprise rollouts.", orgBottleneck: "No phased implementation tier. No light-touch enterprise onboarding. Buyers with post-reorg IT teams or frozen roadmaps cannot self-qualify out.", affectedDeals: 6, pctDeals: 24, avgCycleImpactDays: 38, severity: "high", exampleDeals: ["D-002", "D-005", "D-010", "D-017", "D-019", "D-023"] },
  { id: "champion", label: "Champion Instability", description: "Internal champion loss — through departure, promotion, or distraction — results in a 0% win rate in this dataset when single-threaded. The most preventable systemic failure.", orgBottleneck: "No multi-threading strategy. Over-reliance on single internal advocate. No exec-level relationship redundancy protocol.", affectedDeals: 5, pctDeals: 20, avgCycleImpactDays: 35, severity: "critical", exampleDeals: ["D-003", "D-008", "D-013", "D-018", "D-025"] },
  { id: "pricing", label: "Pricing Structure Mismatch", description: "Annual commit pricing creates systematic friction in mid-market budget cycles. Late-stage competitive price displacement signals insufficient differentiation anchoring.", orgBottleneck: "Rigid annual commit with no usage-based alternative. Discount authority requires slow exec escalation. No pricing playbook for competitive defense.", affectedDeals: 5, pctDeals: 20, avgCycleImpactDays: 22, severity: "medium", exampleDeals: ["D-001", "D-006", "D-010", "D-015", "D-021"] },
  { id: "competitive", label: "Competitive Feature Gap", description: "Integration-native competitors winning in SMB logistics. Distributed performance gaps losing APAC enterprise technical evaluations. No consistent late-stage differentiation playbook.", orgBottleneck: "No competitive-to-product feedback loop. Value differentiation narrative breaks down at technical evaluation stage.", affectedDeals: 4, pctDeals: 16, avgCycleImpactDays: 18, severity: "medium", exampleDeals: ["D-002", "D-007", "D-015", "D-023"] },
  { id: "product", label: "Product Capability Gap", description: "Recurring compliance and localization gaps: multi-tenant SSO, HIPAA field-level audit logging, FDA 21 CFR Part 11, EMEA data residency. Enterprise regulated verticals are being systematically lost.", orgBottleneck: "Product roadmap not aligned to compliance requirements of healthcare, biotech, or EMEA enterprise segments.", affectedDeals: 4, pctDeals: 16, avgCycleImpactDays: 24, severity: "medium", exampleDeals: ["D-005", "D-011", "D-019", "D-025"] },
];

const INFERENCE_FLAGS: InferenceFlag[] = [
  { id: "INF-001", deals: ["D-017"], type: "Organizational Capacity Inference", description: "AI conclusion references post-reorg staffing levels inferred from transcript context ('3-person legal team'). Conclusion contains inference about buyer organizational health — not directly stated by the buyer.", action: "Human review required before sharing with executive leadership or customer-facing teams.", suppressed: false },
  { id: "INF-002", deals: ["D-025"], type: "Strategic Priority Inference", description: "AI conclusion infers that champion distraction is linked to acquisition activity. Acquisition was mentioned indirectly — AI extrapolated strategic implication not explicitly confirmed by buyer.", action: "Suppressed from default team-level view. Available to RevOps and leadership only.", suppressed: true },
  { id: "INF-003", deals: ["D-001", "D-015", "D-021"], type: "Budget Sensitivity Inference", description: "Three deals contain AI-generated conclusions that imply buyer financial constraints from pricing friction signals. These are inferences — buyers did not disclose budget status directly.", action: "Conclusions marked inference-sensitive. Not included in customer-shared analysis. Human validation required before actioning.", suppressed: false },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ConfidenceBadge({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 90 ? "#10b981" : pct >= 80 ? "#6366f1" : "#f59e0b";
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color, background: color + "18", padding: "2px 8px", borderRadius: 12 }}>
      {pct}% confidence
    </span>
  );
}

function SeverityBadge({ s }: { s: Severity }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#fff", background: SEVERITY_COLORS[s], padding: "2px 8px", borderRadius: 10 }}>
      {s}
    </span>
  );
}

function OutcomeBadge({ outcome }: { outcome: Outcome }) {
  const labels: Record<Outcome, string> = { won: "Won", lost: "Lost", stalled: "Stalled" };
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color: OUTCOME_COLORS[outcome], background: OUTCOME_COLORS[outcome] + "18", padding: "2px 10px", borderRadius: 12 }}>
      {labels[outcome]}
    </span>
  );
}

function InfoTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
      <span
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        style={{ cursor: "help", fontSize: 13, color: "#64748b", lineHeight: 1, userSelect: "none" }}
      >
        ⓘ
      </span>
      {show && (
        <span style={{
          position: "absolute", bottom: "calc(100% + 8px)", right: 0,
          background: "#1e293b", border: "1px solid #334155", borderRadius: 8,
          padding: "10px 14px", fontSize: 11, color: "#94a3b8", width: 260,
          zIndex: 200, lineHeight: 1.6, whiteSpace: "normal", pointerEvents: "none",
        }}>
          {text}
        </span>
      )}
    </span>
  );
}

// ─── Filter Bar ───────────────────────────────────────────────────────────────

const SELECT_STYLE = (active: boolean): React.CSSProperties => ({
  padding: "5px 10px", borderRadius: 8,
  border: `1px solid ${active ? "#6366f160" : "#334155"}`,
  background: active ? "#6366f115" : "#0f172a",
  color: active ? "#a5b4fc" : "#94a3b8",
  fontSize: 12, cursor: "pointer", outline: "none",
});

function FilterBar({
  filterState,
  setFilterState,
  filteredCount,
  totalCount,
}: {
  filterState: FilterState;
  setFilterState: (s: FilterState) => void;
  filteredCount: number;
  totalCount: number;
}) {
  const isFiltered = Object.values(filterState).some(v => v !== "All");

  function sel<K extends keyof FilterState>(key: K, options: string[], label: string) {
    const active = filterState[key] !== "All";
    return (
      <select
        value={filterState[key]}
        onChange={e => setFilterState({ ...filterState, [key]: e.target.value })}
        style={SELECT_STYLE(active)}
        title={label}
      >
        <option value="All">All {label}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }

  return (
    <div style={{ borderBottom: "1px solid hsl(var(--border,#e2e8f0))", background: "#0a0f1a" }}>
      <div style={{
        maxWidth: 1160, margin: "0 auto",
        padding: "10px 24px",
        display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
      }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginRight: 4 }}>Filter</span>
        {sel("segment",     ["Emerging", "Commercial", "Majors", "Enterprise"],              "Segment")}
        {sel("region",      ["North America", "EMEA", "APAC"],                               "Region")}
        {sel("outcome",     ["won", "lost", "stalled"],                                      "Outcome")}
        {sel("eeCountBand", ["1–100", "101–500", "501–2K", "2K–10K", "10K+"],               "EE Count")}
        {sel("dealType",    ["Net New", "Add-on", "Expansion"],                              "Deal Type")}
        {isFiltered && (
          <button
            onClick={() => setFilterState(DEFAULT_FILTERS)}
            style={{ padding: "5px 12px", borderRadius: 8, border: "1px solid #ef444440", background: "transparent", color: "#ef4444", fontSize: 11, cursor: "pointer" }}
          >
            Clear
          </button>
        )}
        <span style={{ marginLeft: "auto", fontSize: 11, color: isFiltered ? "#a5b4fc" : "#64748b", fontWeight: isFiltered ? 700 : 400 }}>
          {filteredCount}/{totalCount} deals
        </span>
      </div>
    </div>
  );
}

// ─── Tab 1: Deal Overview ─────────────────────────────────────────────────────

function Tab1Overview({ deals }: { deals: Deal[] }) {
  const won     = deals.filter(d => d.outcome === "won").length;
  const lost    = deals.filter(d => d.outcome === "lost").length;
  const stalled = deals.filter(d => d.outcome === "stalled").length;
  const avgCycle = deals.length
    ? Math.round(deals.reduce((s, d) => s + d.dealCycleDays, 0) / deals.length)
    : 0;

  const blockerCounts = (["legal","implementation","champion","pricing","competitive","product"] as BlockerCategory[])
    .map(b => ({ b, count: deals.filter(d => d.blockers.includes(b)).length }))
    .sort((a, z) => z.count - a.count);
  const topBlocker = blockerCounts[0]?.count > 0 ? blockerCounts[0].b : null;

  const sectorData = (["Enterprise", "Mid-Market", "SMB"] as Sector[])
    .map(sector => ({
      sector,
      won:     deals.filter(d => d.sector === sector && d.outcome === "won").length,
      lost:    deals.filter(d => d.sector === sector && d.outcome === "lost").length,
      stalled: deals.filter(d => d.sector === sector && d.outcome === "stalled").length,
    }))
    .filter(s => s.won + s.lost + s.stalled > 0);

  const blockerPieData = PATTERNS
    .map(p => ({ name: p.label.split(" ")[0], value: deals.filter(d => d.blockers.includes(p.id)).length, color: BLOCKER_COLORS[p.id] }))
    .filter(p => p.value > 0);

  const KPI = ({ label, value, sub, color }: { label: string; value: string; sub: string; color?: string }) => (
    <div style={{ flex: 1, minWidth: 140, background: "hsl(var(--card,#1e293b))", border: "1px solid hsl(var(--border,#e2e8f0))", borderRadius: 12, padding: "18px 20px" }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: color ?? "hsl(var(--foreground))", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>{sub}</div>
    </div>
  );

  if (deals.length === 0) {
    return <div style={{ textAlign: "center", padding: 60, color: "#64748b", fontSize: 13 }}>No deals match the current filters.</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <KPI label="Deals Analyzed" value={String(deals.length)} sub={`of 25 total · v0.1`} />
        <KPI label="Win Rate" value={deals.length ? `${Math.round((won / deals.length) * 100)}%` : "—"} sub={`${won} won · ${lost} lost · ${stalled} stalled`} color="#10b981" />
        <KPI label="Avg Deal Cycle" value={deals.length ? `${avgCycle}d` : "—"} sub="Across filtered outcomes" color="#6366f1" />
        <KPI label="Top Blocker" value={topBlocker ? BLOCKER_LABELS[topBlocker] : "—"} sub={topBlocker ? `${blockerCounts[0].count} deals affected` : "No blockers in selection"} color="#8b5cf6" />
      </div>

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        <div style={{ flex: 2, minWidth: 300, background: "hsl(var(--card,#1e293b))", border: "1px solid hsl(var(--border,#e2e8f0))", borderRadius: 12, padding: "18px 20px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>Outcomes by Segment</div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sectorData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="sector" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="won"     name="Won"     fill={OUTCOME_COLORS.won}     radius={[3,3,0,0]} />
                <Bar dataKey="lost"    name="Lost"    fill={OUTCOME_COLORS.lost}    radius={[3,3,0,0]} />
                <Bar dataKey="stalled" name="Stalled" fill={OUTCOME_COLORS.stalled} radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 240, background: "hsl(var(--card,#1e293b))", border: "1px solid hsl(var(--border,#e2e8f0))", borderRadius: 12, padding: "18px 20px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>Blocker Distribution</div>
          {blockerPieData.length > 0 ? (
            <>
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={blockerPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" nameKey="name">
                      {blockerPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, fontSize: 12 }} formatter={(v: number, name: string) => [`${v} deals`, name]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", marginTop: 8 }}>
                {blockerPieData.map(d => (
                  <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: d.color }} />
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>{d.name}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontSize: 12 }}>No blockers in selection</div>
          )}
        </div>
      </div>

      <div style={{ background: "hsl(var(--card,#1e293b))", border: "1px solid hsl(var(--border,#e2e8f0))", borderRadius: 12, padding: "18px 20px" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>Win Pattern Signals</div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {[
            { label: "Single decision-maker with budget authority", impact: "Avg cycle 42d vs 93d otherwise" },
            { label: "Referral or prior user experience", impact: "100% win rate in dataset (3 deals)" },
            { label: "Pre-approved budget at first meeting", impact: "Skips 2+ procurement stages" },
            { label: "SMB self-serve onboarding", impact: "Fastest cycles, lowest friction" },
          ].map((s, i) => (
            <div key={i} style={{ flex: "1 1 220px", background: "#10b98110", border: "1px solid #10b98130", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#10b981", marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>{s.impact}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Tab 2: Systemic Patterns ─────────────────────────────────────────────────

function Tab2Patterns({ deals }: { deals: Deal[] }) {
  const [expanded, setExpanded] = useState<BlockerCategory | null>(null);

  const dealIds = new Set(deals.map(d => d.id));

  if (deals.length === 0) {
    return <div style={{ textAlign: "center", padding: 60, color: "#64748b", fontSize: 13 }}>No deals match the current filters.</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>
        AI-identified recurring themes. Counts update to reflect filtered deals. Click any pattern to see the organizational bottleneck and supporting deals.
      </div>
      {PATTERNS.map(p => {
        const visibleDeals = p.exampleDeals.filter(id => dealIds.has(id));
        const dimmed = visibleDeals.length === 0;
        return (
          <div key={p.id} style={{ background: "hsl(var(--card,#1e293b))", border: `1px solid ${expanded === p.id ? BLOCKER_COLORS[p.id] + "80" : "hsl(var(--border,#e2e8f0))"}`, borderRadius: 12, overflow: "hidden", opacity: dimmed ? 0.4 : 1, transition: "opacity 0.2s, border-color 0.2s" }}>
            <button
              onClick={() => !dimmed && setExpanded(expanded === p.id ? null : p.id)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", background: "transparent", border: "none", cursor: dimmed ? "default" : "pointer", textAlign: "left" }}
            >
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: BLOCKER_COLORS[p.id], flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "hsl(var(--foreground))" }}>{p.label}</span>
                  <SeverityBadge s={p.severity} />
                </div>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>{p.description}</div>
              </div>
              <div style={{ display: "flex", gap: 20, flexShrink: 0, alignItems: "center" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: BLOCKER_COLORS[p.id] }}>{visibleDeals.length}</div>
                  <div style={{ fontSize: 10, color: "#64748b" }}>of {p.affectedDeals} deals</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#94a3b8" }}>+{p.avgCycleImpactDays}d</div>
                  <div style={{ fontSize: 10, color: "#64748b" }}>avg delay</div>
                </div>
                <span style={{ color: "#64748b", fontSize: 16 }}>{expanded === p.id ? "▲" : "▼"}</span>
              </div>
            </button>

            {expanded === p.id && !dimmed && (
              <div style={{ borderTop: "1px solid hsl(var(--border,#e2e8f0))", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Organizational Bottleneck</div>
                  <div style={{ fontSize: 13, color: "#f1f5f9", background: SEVERITY_COLORS[p.severity] + "12", border: `1px solid ${SEVERITY_COLORS[p.severity]}30`, borderRadius: 8, padding: "10px 14px" }}>
                    {p.orgBottleneck}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Affected Deals in Selection ({visibleDeals.length})</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {visibleDeals.map(did => {
                      const deal = DEALS.find(d => d.id === did);
                      if (!deal) return null;
                      return (
                        <div key={did} style={{ display: "flex", alignItems: "center", gap: 8, background: "#0f172a", border: "1px solid #334155", borderRadius: 8, padding: "6px 12px" }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: OUTCOME_COLORS[deal.outcome] }} />
                          <span style={{ fontSize: 12, color: "#f1f5f9", fontWeight: 600 }}>{deal.company}</span>
                          <span style={{ fontSize: 11, color: "#64748b" }}>{deal.dealCycleDays}d · ${deal.dealSizeK}K</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Lineage Panel ────────────────────────────────────────────────────────────

function LineagePanel({ deal, result }: { deal: Deal; result: AnalysisResult }) {
  const RISK_COLORS: Record<string, string> = { low: "#16a34a", medium: "#ca8a04", high: "#dc2626" };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 4 }}>
      <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, padding: "12px 16px" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Input — Data Sent to AI</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 20px" }}>
          {([
            ["Deal", deal.id],
            ["Company", deal.company],
            ["Segment", deal.segment],
            ["Sector", deal.sector],
            ["Region", deal.region],
            ["EE Count", deal.eeCountBand],
            ["Deal Type", deal.dealType],
            ["Outcome", deal.outcome],
            ["Stage", deal.stage],
            ["Cycle", `${deal.dealCycleDays}d`],
            ["CRM Tags", deal.blockers.join(", ") || "none"],
          ] as [string, string][]).map(([k, v]) => (
            <div key={k} style={{ fontSize: 11, color: "#94a3b8" }}>
              <span style={{ color: "#64748b" }}>{k}: </span>{v}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: "#64748b" }}>
          <span>Transcript chars sent: </span>
          <span style={{ color: "#94a3b8" }}>{deal.transcriptExcerpt.length}</span>
        </div>
      </div>

      <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, padding: "12px 16px" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Processing</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 24px" }}>
          {([
            ["Model", result.meta.model],
            ["Prompt", result.meta.promptVersion],
            ["Input tokens", result.meta.inputTokens?.toString() ?? "—"],
            ["Output tokens", result.meta.outputTokens?.toString() ?? "—"],
            ["Time", `${result.meta.processingMs}ms`],
            ["Timestamp", new Date(result.meta.timestamp).toLocaleTimeString()],
          ] as [string, string][]).map(([k, v]) => (
            <div key={k} style={{ fontSize: 11, color: "#94a3b8" }}>
              <span style={{ color: "#64748b" }}>{k}: </span>{v}
            </div>
          ))}
        </div>
        {result.processingNote && (
          <div style={{ marginTop: 8, fontSize: 11, color: "#f59e0b", fontStyle: "italic" }}>Note: {result.processingNote}</div>
        )}
      </div>

      {result.evidenceChain.length > 0 && (
        <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, padding: "12px 16px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Evidence Chain — {result.evidenceChain.length} claim{result.evidenceChain.length !== 1 ? "s" : ""}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {result.evidenceChain.map((e, i) => (
              <div key={i} style={{ borderLeft: `3px solid ${e.type === "direct" ? "#10b981" : "#f59e0b"}`, paddingLeft: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: e.type === "direct" ? "#10b981" : "#f59e0b", textTransform: "uppercase" }}>{e.type}</span>
                  <span style={{ fontSize: 10, color: "#64748b" }}>{Math.round(e.claimConfidence * 100)}% confidence</span>
                </div>
                <div style={{ fontSize: 12, color: "#e2e8f0", marginBottom: 4 }}>{e.claim}</div>
                <div style={{ fontSize: 11, color: "#64748b", fontStyle: "italic" }}>"{e.sourceQuote}"</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {result.inferenceFlags.length > 0 && (
        <div style={{ background: "#0f172a", border: "1px solid #f59e0b40", borderRadius: 10, padding: "12px 16px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Inference Flags — {result.inferenceFlags.length} detected</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {result.inferenceFlags.map((f, i) => (
              <div key={i} style={{ borderLeft: "3px solid #f59e0b", paddingLeft: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: RISK_COLORS[f.riskLevel] ?? "#f59e0b", textTransform: "uppercase" }}>{f.riskLevel} risk</span>
                </div>
                <div style={{ fontSize: 11, color: "#64748b" }}>Signal: <span style={{ color: "#e2e8f0", fontStyle: "italic" }}>"{f.signal}"</span></div>
                <div style={{ fontSize: 11, color: "#64748b" }}>Extrapolated to: <span style={{ color: "#f1f5f9" }}>{f.inference}</span></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Eval Panel ───────────────────────────────────────────────────────────────

function EvalPanel({
  result, evalState, onRate, onClaimRate, onNoteChange, onSubmit, sessionStats,
}: {
  result: AnalysisResult;
  evalState: EvalState;
  onRate: (r: EvalRating) => void;
  onClaimRate: (i: number, v: boolean) => void;
  onNoteChange: (s: string) => void;
  onSubmit: () => void;
  sessionStats: { total: number; agreed: number; partial: number; disputed: number };
}) {
  const ratingButtons: { id: EvalRating; label: string; color: string }[] = [
    { id: "agree",    label: "✓ Agree",    color: "#10b981" },
    { id: "partial",  label: "~ Partial",  color: "#f59e0b" },
    { id: "disagree", label: "✗ Disagree", color: "#ef4444" },
  ];

  return (
    <div style={{ background: "hsl(var(--card,#1e293b))", border: "1px solid hsl(var(--border,#e2e8f0))", borderRadius: 12, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>Human Evaluation</div>
        {sessionStats.total > 0 && (
          <div style={{ fontSize: 11, color: "#64748b" }}>
            Session: {sessionStats.total} reviewed · {sessionStats.agreed} agreed · {sessionStats.disputed} disputed
          </div>
        )}
      </div>

      {evalState.submitted ? (
        <div style={{ fontSize: 13, color: "#10b981", background: "#10b98110", border: "1px solid #10b98130", borderRadius: 8, padding: "10px 14px" }}>
          ✓ Evaluation recorded. {sessionStats.total > 0 && `Session accuracy: ${Math.round((sessionStats.agreed / sessionStats.total) * 100)}% agreement rate.`}
        </div>
      ) : (
        <>
          <div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8 }}>Does this conclusion accurately reflect the deal outcome?</div>
            <div style={{ display: "flex", gap: 8 }}>
              {ratingButtons.map(b => (
                <button
                  key={b.id}
                  onClick={() => onRate(b.id)}
                  style={{
                    flex: 1, padding: "8px 12px", borderRadius: 8, border: `1px solid ${evalState.rating === b.id ? b.color : "#334155"}`,
                    background: evalState.rating === b.id ? b.color + "20" : "transparent",
                    color: evalState.rating === b.id ? b.color : "#94a3b8", fontSize: 12, fontWeight: 700, cursor: "pointer",
                  }}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {result.evidenceChain.length > 0 && (
            <div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8 }}>Claim-level groundedness check:</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {result.evidenceChain.map((e, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11, color: "#94a3b8", flex: 1 }}>{e.claim}</span>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      {[true, false].map(v => (
                        <button
                          key={String(v)}
                          onClick={() => onClaimRate(i, v)}
                          style={{
                            padding: "3px 10px", borderRadius: 6, border: `1px solid ${evalState.claimGrounded[i] === v ? (v ? "#10b981" : "#ef4444") : "#334155"}`,
                            background: evalState.claimGrounded[i] === v ? (v ? "#10b98120" : "#ef444420") : "transparent",
                            color: evalState.claimGrounded[i] === v ? (v ? "#10b981" : "#ef4444") : "#64748b",
                            fontSize: 11, fontWeight: 600, cursor: "pointer",
                          }}
                        >
                          {v ? "Grounded" : "Not grounded"}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <input
              type="text"
              placeholder="Optional note (e.g. 'Missed the procurement bottleneck')"
              value={evalState.note}
              onChange={e => onNoteChange(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #334155", background: "#0f172a", color: "#f1f5f9", fontSize: 12, outline: "none" }}
            />
            <button
              onClick={onSubmit}
              disabled={!evalState.rating}
              style={{
                padding: "9px 16px", borderRadius: 8, border: "none",
                background: evalState.rating ? "#6366f1" : "#334155",
                color: evalState.rating ? "#fff" : "#64748b",
                fontSize: 12, fontWeight: 700, cursor: evalState.rating ? "pointer" : "not-allowed",
              }}
            >
              Submit Evaluation
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Tab 3: Root Cause Evidence ───────────────────────────────────────────────

function Tab3Evidence({ deals }: { deals: Deal[] }) {
  const firstDealId = deals[0]?.id ?? "";
  const [selectedId, setSelectedId] = useState(firstDealId);
  const [analysisResult, setAnalysisResult] = useState<Record<string, AnalysisResult>>({});
  const [analyzing, setAnalyzing] = useState(false);
  const [showLineage, setShowLineage] = useState(false);
  const [evalStates, setEvalStates] = useState<Record<string, EvalState>>({});
  const [sessionStats, setSessionStats] = useState({ total: 0, agreed: 0, partial: 0, disputed: 0 });

  const effectiveId = deals.find(d => d.id === selectedId) ? selectedId : firstDealId;
  const deal = deals.find(d => d.id === effectiveId);
  const liveResult = deal ? analysisResult[deal.id] : undefined;
  const currentEval: EvalState = evalStates[effectiveId] ?? { rating: null, claimGrounded: {}, note: "", submitted: false };

  function updateEval(patch: Partial<EvalState>) {
    setEvalStates(s => ({ ...s, [effectiveId]: { ...currentEval, ...patch } }));
  }

  async function runAnalysis() {
    if (!deal || analyzing) return;
    setAnalyzing(true);
    setShowLineage(false);
    setEvalStates(s => ({ ...s, [effectiveId]: { rating: null, claimGrounded: {}, note: "", submitted: false } }));
    try {
      const res = await fetch("/api/analyze-deal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deal }),
      });
      const data: AnalysisResult = await res.json();
      setAnalysisResult(s => ({ ...s, [deal.id]: data }));
      setShowLineage(true);
    } catch {
      setAnalysisResult(s => ({ ...s, [deal.id]: { error: "Network error — is the API available?" } as AnalysisResult }));
    } finally {
      setAnalyzing(false);
    }
  }

  function submitEval() {
    if (!currentEval.rating) return;
    updateEval({ submitted: true });
    setSessionStats(s => ({
      total: s.total + 1,
      agreed:   s.agreed   + (currentEval.rating === "agree"    ? 1 : 0),
      partial:  s.partial  + (currentEval.rating === "partial"  ? 1 : 0),
      disputed: s.disputed + (currentEval.rating === "disagree" ? 1 : 0),
    }));
  }

  if (deals.length === 0) {
    return <div style={{ textAlign: "center", padding: 60, color: "#64748b", fontSize: 13 }}>No deals match the current filters.</div>;
  }

  return (
    <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
      {/* Deal list */}
      <div style={{ width: 220, flexShrink: 0, display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
          Select Deal <span style={{ fontWeight: 400, color: "#475569" }}>({deals.length})</span>
        </div>
        {deals.map(d => (
          <button
            key={d.id}
            onClick={() => { setSelectedId(d.id); setShowLineage(!!analysisResult[d.id]); }}
            style={{ width: "100%", textAlign: "left", padding: "9px 12px", borderRadius: 8, border: `1px solid ${effectiveId === d.id ? "#6366f1" : "hsl(var(--border,#e2e8f0))"}`, background: effectiveId === d.id ? "#6366f110" : "transparent", cursor: "pointer" }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "hsl(var(--foreground))" }}>{d.company}</span>
              {analysisResult[d.id] && <span style={{ fontSize: 9, color: "#6366f1", fontWeight: 700 }}>ANALYZED</span>}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: OUTCOME_COLORS[d.outcome], flexShrink: 0 }} />
              <span style={{ fontSize: 10, color: "#64748b" }}>{d.outcome} · {d.dealCycleDays}d</span>
              <span style={{ fontSize: 10, color: "#475569" }}>{d.segment}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Right panel */}
      {deal && (
        <div style={{ flex: 1, minWidth: 280, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: "hsl(var(--card,#1e293b))", border: "1px solid hsl(var(--border,#e2e8f0))", borderRadius: 12, padding: "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "hsl(var(--foreground))", marginBottom: 4 }}>{deal.company}</div>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>
                  {deal.segment} · {deal.sector} · {deal.region} · {deal.eeCountBand} EE · {deal.dealType} · ${deal.dealSizeK}K · {deal.dealCycleDays}d · {deal.stage}
                </div>
              </div>
              <OutcomeBadge outcome={deal.outcome} />
            </div>
            {deal.blockers.length > 0 && (
              <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
                {deal.blockers.map(b => (
                  <span key={b} style={{ fontSize: 11, fontWeight: 600, color: BLOCKER_COLORS[b], background: BLOCKER_COLORS[b] + "18", padding: "2px 10px", borderRadius: 10 }}>
                    {BLOCKER_LABELS[b]}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div style={{ background: "hsl(var(--card,#1e293b))", border: "1px solid hsl(var(--border,#e2e8f0))", borderRadius: 12, padding: "16px 20px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Source — Call Transcript</div>
            <div style={{ fontSize: 13, color: "#e2e8f0", fontStyle: "italic", lineHeight: 1.7, padding: "12px 16px", background: "#0f172a", borderRadius: 8, borderLeft: "3px solid #6366f1" }}>
              "{deal.transcriptExcerpt}"
            </div>
          </div>

          {!liveResult && (
            <button
              onClick={runAnalysis}
              disabled={analyzing}
              style={{
                padding: "12px 20px", borderRadius: 10, border: "none",
                background: analyzing ? "#334155" : "#6366f1",
                color: "#fff", fontSize: 13, fontWeight: 700, cursor: analyzing ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              }}
            >
              {analyzing ? (
                <>
                  <span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid #ffffff40", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                  Claude is analyzing...
                </>
              ) : "Run Live Analysis →"}
            </button>
          )}

          {liveResult && !liveResult.error && (
            <>
              <div style={{ background: "hsl(var(--card,#1e293b))", border: "1px solid #6366f140", borderRadius: 12, padding: "16px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.06em" }}>Live AI Analysis</div>
                    <span style={{ fontSize: 10, color: "#64748b" }}>claude-sonnet-4-6 · {liveResult.meta?.processingMs}ms</span>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <ConfidenceBadge value={liveResult.confidence} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: liveResult.grounded ? "#10b981" : "#f59e0b", background: liveResult.grounded ? "#10b98118" : "#f59e0b18", padding: "2px 10px", borderRadius: 12 }}>
                      {liveResult.grounded ? "✓ Grounded" : "⚠ Inferred"}
                    </span>
                    {liveResult.inferenceRisk && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b", background: "#f59e0b18", padding: "2px 10px", borderRadius: 12 }}>⚠ Inference Risk</span>
                    )}
                  </div>
                </div>
                <div style={{ fontSize: 13, color: "#f1f5f9", lineHeight: 1.7, marginBottom: 12 }}>{liveResult.conclusion}</div>
                {liveResult.inferenceRisk && (
                  <div style={{ fontSize: 12, color: "#f59e0b", background: "#f59e0b10", border: "1px solid #f59e0b30", borderRadius: 8, padding: "10px 14px", marginBottom: 10 }}>
                    ⚠ Conclusion contains AI inference beyond what was directly stated. Human review required before sharing with leadership.
                  </div>
                )}
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <button
                    onClick={() => setShowLineage(s => !s)}
                    style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #334155", background: showLineage ? "#6366f110" : "transparent", color: showLineage ? "#6366f1" : "#94a3b8", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                  >
                    {showLineage ? "▲ Hide Lineage" : "▼ Show Data Lineage"}
                  </button>
                  <button
                    onClick={() => { setAnalysisResult(s => { const n = { ...s }; delete n[deal.id]; return n; }); setShowLineage(false); }}
                    style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #334155", background: "transparent", color: "#64748b", fontSize: 11, cursor: "pointer" }}
                  >
                    Re-analyze
                  </button>
                </div>
              </div>

              {showLineage && (
                <div style={{ background: "hsl(var(--card,#1e293b))", border: "1px solid hsl(var(--border,#e2e8f0))", borderRadius: 12, padding: "16px 20px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Data Lineage — Full Provenance Chain</div>
                  <LineagePanel deal={deal} result={liveResult} />
                </div>
              )}

              <EvalPanel
                result={liveResult}
                evalState={currentEval}
                onRate={r => updateEval({ rating: r })}
                onClaimRate={(i, v) => updateEval({ claimGrounded: { ...currentEval.claimGrounded, [i]: v } })}
                onNoteChange={note => updateEval({ note })}
                onSubmit={submitEval}
                sessionStats={sessionStats}
              />
            </>
          )}

          {liveResult?.error && (
            <div style={{ fontSize: 13, color: "#ef4444", background: "#ef444410", border: "1px solid #ef444430", borderRadius: 10, padding: "12px 16px" }}>
              ⚠ {liveResult.error}
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Tab 4: Governance & Inference Control ────────────────────────────────────

const SUPPRESS_TOOLTIP = "Removes this flag from standard team dashboards and deal views. RevOps and Leadership can still see it. The flag is always retained in the audit log. Use when a finding is too speculative, politically sensitive, or not ready for general distribution.";
const UNSUPPRESS_TOOLTIP = "Restores this flag to all team-level views and standard dashboards.";

function Tab4Governance() {
  const [suppressed, setSuppressed] = useState<Record<string, boolean>>(
    Object.fromEntries(INFERENCE_FLAGS.map(f => [f.id, f.suppressed]))
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ background: "#6366f110", border: "1px solid #6366f130", borderRadius: 12, padding: "16px 20px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#a5b4fc", marginBottom: 6 }}>Responsible AI Notice</div>
        <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.7 }}>
          This system generates organizational-level patterns from deal data. It is designed to improve process accountability — not evaluate individual seller performance. All AI conclusions cite source evidence and include confidence scores. Inference-sensitive outputs are flagged and require human review before distribution. Users may dispute, suppress, or request correction of any AI conclusion.
        </div>
      </div>

      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>Inference Risk Flags — {INFERENCE_FLAGS.length} Active</div>
        </div>
        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14, lineHeight: 1.6 }}>
          When Claude infers something beyond what was directly stated in a transcript, the conclusion is flagged for human review.
          {" "}<strong style={{ color: "#94a3b8" }}>Suppress</strong> hides a flag from team dashboards while keeping it in the audit log.
          {" "}<strong style={{ color: "#94a3b8" }}>Unsuppress</strong> restores it to all views. Suppressed flags remain visible to RevOps and Leadership.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {INFERENCE_FLAGS.map(flag => (
            <div key={flag.id} style={{ background: "hsl(var(--card,#1e293b))", border: `1px solid ${suppressed[flag.id] ? "#334155" : "#f59e0b40"}`, borderRadius: 12, padding: "16px 20px", opacity: suppressed[flag.id] ? 0.55 : 1 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b" }}>⚠ {flag.id}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "hsl(var(--foreground))" }}>{flag.type}</span>
                    <span style={{ fontSize: 10, color: "#64748b" }}>Deals: {flag.deals.join(", ")}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6, marginBottom: 8 }}>{flag.description}</div>
                  <div style={{ fontSize: 11, color: "#f59e0b", fontStyle: "italic" }}>Action: {flag.action}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <InfoTooltip text={suppressed[flag.id] ? UNSUPPRESS_TOOLTIP : SUPPRESS_TOOLTIP} />
                  <button
                    onClick={() => setSuppressed(s => ({ ...s, [flag.id]: !s[flag.id] }))}
                    style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #334155", background: "transparent", color: suppressed[flag.id] ? "#10b981" : "#94a3b8", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
                  >
                    {suppressed[flag.id] ? "Unsuppress" : "Suppress"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>Audit Log — AI Conclusions Generated</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid hsl(var(--border,#e2e8f0))" }}>
                {["Deal ID", "Company", "Segment", "Deal Type", "Outcome", "Primary Theme", "Confidence", "Grounded", "Inference Risk"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 14px", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DEALS.map((d, i) => (
                <tr key={d.id} style={{ borderBottom: "1px solid hsl(var(--border,#e2e8f0))", background: i % 2 === 0 ? "transparent" : "#0f172a30" }}>
                  <td style={{ padding: "9px 14px", color: "#64748b", fontFamily: "monospace" }}>{d.id}</td>
                  <td style={{ padding: "9px 14px", fontWeight: 600, color: "hsl(var(--foreground))" }}>{d.company}</td>
                  <td style={{ padding: "9px 14px", color: "#94a3b8" }}>{d.segment}</td>
                  <td style={{ padding: "9px 14px", color: "#94a3b8" }}>{d.dealType}</td>
                  <td style={{ padding: "9px 14px" }}><OutcomeBadge outcome={d.outcome} /></td>
                  <td style={{ padding: "9px 14px", color: "#94a3b8" }}>{d.blockers.length > 0 ? BLOCKER_LABELS[d.blockers[0]] : "—"}</td>
                  <td style={{ padding: "9px 14px" }}><ConfidenceBadge value={d.confidence} /></td>
                  <td style={{ padding: "9px 14px" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: d.grounded ? "#10b981" : "#f59e0b" }}>{d.grounded ? "✓ Yes" : "⚠ No"}</span>
                  </td>
                  <td style={{ padding: "9px 14px" }}>
                    {d.inferenceRisk
                      ? <span style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b" }}>⚠ Flagged</span>
                      : <span style={{ fontSize: 11, color: "#64748b" }}>None</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const TABS = [
  { id: "overview",    label: "Deal Overview" },
  { id: "patterns",   label: "Systemic Patterns" },
  { id: "evidence",   label: "Root Cause Evidence" },
  { id: "governance", label: "Governance" },
];

export default function WinLossIntelligence() {
  useVisitLogger("win-loss-intelligence");
  const [activeTab, setActiveTab] = useState("overview");
  const [filterState, setFilterState] = useState<FilterState>(DEFAULT_FILTERS);

  const filteredDeals = DEALS.filter(d =>
    (filterState.segment    === "All" || d.segment    === filterState.segment)    &&
    (filterState.region     === "All" || d.region     === filterState.region)     &&
    (filterState.outcome    === "All" || d.outcome    === filterState.outcome)    &&
    (filterState.eeCountBand === "All" || d.eeCountBand === filterState.eeCountBand) &&
    (filterState.dealType   === "All" || d.dealType   === filterState.dealType)
  );

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif", minHeight: "100vh", background: "hsl(var(--background))", color: "hsl(var(--foreground))" }}>

      {/* Sticky header */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, borderBottom: "1px solid hsl(var(--border,#e2e8f0))", background: "hsl(var(--background))", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "14px 24px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <div>
              <Link to="/#projects" style={{ fontSize: 11, color: "#64748b", textDecoration: "none", fontWeight: 600, letterSpacing: "0.03em", display: "block", marginBottom: 6 }}>← Back to Portfolio</Link>
              <div style={{ fontSize: 22, fontWeight: 700, color: "hsl(var(--foreground))", marginBottom: 2 }}>Win/Loss Intelligence</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>AI system for organizational revenue intelligence — systemic deal outcome analysis across 25 synthetic deals</div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", background: "#1e293b", border: "1px solid #334155", padding: "4px 12px", borderRadius: 20 }}>v0.1 · Prototype</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#6366f1", background: "#6366f118", border: "1px solid #6366f130", padding: "4px 12px", borderRadius: 20 }}>Claude Sonnet</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#10b981", background: "#10b98118", border: "1px solid #10b98130", padding: "4px 12px", borderRadius: 20 }}>Synthetic Data</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ borderBottom: "1px solid hsl(var(--border,#e2e8f0))" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px", display: "flex", gap: 0 }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "12px 20px", background: "transparent", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
                color: activeTab === tab.id ? "#6366f1" : "#64748b",
                borderBottom: `2px solid ${activeTab === tab.id ? "#6366f1" : "transparent"}`,
                transition: "all 0.15s",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab !== "governance" && (
        <FilterBar
          filterState={filterState}
          setFilterState={setFilterState}
          filteredCount={filteredDeals.length}
          totalCount={DEALS.length}
        />
      )}

      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "28px 24px" }}>
        {activeTab === "overview"    && <Tab1Overview deals={filteredDeals} />}
        {activeTab === "patterns"   && <Tab2Patterns deals={filteredDeals} />}
        {activeTab === "evidence"   && <Tab3Evidence deals={filteredDeals} />}
        {activeTab === "governance" && <Tab4Governance />}
      </div>
    </div>
  );
}
