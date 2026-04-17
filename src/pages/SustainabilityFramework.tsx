import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useVisitLogger } from "@/hooks/useVisitLogger";
import { DiagonalWatermark } from "@/components/ui/DiagonalWatermark";
import { PageGate } from "@/components/ui/PageGate";

// ── Types ──────────────────────────────────────────────────────────────────────

type CompanySize = "small" | "medium" | "enterprise" | "large" | "listed" | "gpai";
type Industry =
  | "tech" | "finance" | "healthcare" | "manufacturing" | "energy"
  | "retail" | "logistics" | "media" | "pharma" | "government"
  | "professional" | "other";
type Jurisdiction = "eu" | "us" | "uk" | "apac" | "global";
type DisclosureStatus = "none" | "voluntary" | "prep" | "reporting";

interface IntakeAnswers {
  size: CompanySize | "";
  industry: Industry | "";
  jurisdiction: Jurisdiction | "";
  disclosure: DisclosureStatus | "";
}

interface ObligationResult {
  mandatory: string[];
  upcoming: string[];
  voluntary: string[];
  penaltyExposure: string;
  recommendedStep: number;
  recommendedStepReason: string;
  urgency: "high" | "medium" | "low";
}

interface Step {
  number: number;
  title: string;
  description: string;
  regulatoryHook: string;
  regulatoryBadge: string;
  methodology: string;
  toolLink: string;
  toolLabel: string;
  outputExample: string;
  citations: string[];
}

// ── Acronym tooltips ──────────────────────────────────────────────────────────

const ACRONYMS: Record<string, string> = {
  CSRD:    "Corporate Sustainability Reporting Directive (EU) — mandatory climate and sustainability disclosure for large companies from FY2024",
  GPAI:    "General Purpose AI — foundation models trained on large datasets capable of diverse tasks; subject to EU AI Act Art.53 disclosure obligations from Aug 2025",
  ISSB:    "International Sustainability Standards Board — sets the global baseline for sustainability-related financial disclosures (IFRS Foundation)",
  "ISSB S2": "ISSB Climate Standard — climate-related risks, opportunities, and metrics disclosure (IFRS Foundation, in force Jan 2024)",
  GRI:     "Global Reporting Initiative — widely-used voluntary sustainability reporting standards adopted by 10,000+ organisations globally",
  "GRI 305": "GRI Emissions Standard — Scope 1, 2, and 3 greenhouse gas emissions disclosure",
  TCFD:    "Task Force on Climate-related Financial Disclosures — framework for climate risk reporting; basis for ISSB S2 and many national mandates",
  ESRS:    "European Sustainability Reporting Standards — technical standards underpinning CSRD; ESRS E1 covers climate",
  "ESRS E1": "ESRS Climate Change Standard — energy consumption, GHG emissions, water, and biodiversity disclosure under CSRD",
  SCI:     "Software Carbon Intensity — Green Software Foundation formula for measuring carbon per unit of software output (C = E × I + M)",
  PUE:     "Power Usage Effectiveness — ratio of total data centre energy to IT equipment energy (1.0 = perfect; hyperscaler typical = 1.1)",
  WUE:     "Water Usage Effectiveness — litres of water consumed per kWh of IT equipment energy",
  SEC:     "U.S. Securities and Exchange Commission — regulates public company financial and climate disclosure in the United States",
  SGX:     "Singapore Exchange — requires phased climate reporting from Singapore-listed companies (2023–2025)",
  ASRS:    "Australian Sustainability Reporting Standards — mandatory from 2025 for large Australian entities; aligned with ISSB S2",
  SSBJ:    "Sustainability Standards Board of Japan — Japan's ISSB-aligned climate disclosure standard (large listed companies, in force 2025)",
  "kgCO₂e": "Kilograms of CO₂ equivalent — standard unit for GHG emissions, covering all gas types converted to CO₂ warming potential",
  kWh:     "Kilowatt-hour — unit of energy: one kilowatt of power consumed for one hour",
  PIE:     "Public Interest Entity — large EU companies required to comply earliest under CSRD (listed companies, banks, insurers with >500 employees)",
  BLOOM:   "BigScience Large Open-science Open-access Multilingual Language Model — 176B parameter model with full published carbon disclosure (Luccioni et al., 2022)",
  MLPerf:  "Machine Learning Performance — industry-standard benchmark suite for AI training and inference energy (MLCommons)",
  AIGP:    "AI Governance Professional — IAPP certification covering AI risk, governance, and regulatory compliance",
  DIR:     "Disparate Impact Ratio — fairness metric: ratio of positive outcome rates across demographic groups (regulatory threshold ≥ 0.8)",
  "GHG Protocol": "Greenhouse Gas Protocol — the most widely used international accounting standard for corporate GHG emissions (Scope 1, 2, 3)",
  "Scope 2": "GHG Protocol Scope 2 — indirect emissions from purchased electricity, heat, or steam; primary category for AI training/inference",
  "Scope 3": "GHG Protocol Scope 3 — all other indirect emissions in the value chain; includes AI hardware manufacturing (Cat.1) and downstream inference (Cat.11)",
};

function AcronymTip({ term, children }: { term: string; children?: React.ReactNode }) {
  const def = ACRONYMS[term];
  if (!def) return <span>{children ?? term}</span>;
  return (
    <span className="group/tip relative inline-block cursor-help">
      <span className="border-b border-dashed border-current/50">{children ?? term}</span>
      <span className="pointer-events-none absolute left-0 bottom-full mb-2 z-50 w-72 rounded-lg border border-border bg-popover px-3 py-2.5 text-xs text-muted-foreground shadow-xl opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150 leading-relaxed">
        <span className="font-semibold text-foreground block mb-1">{term}</span>
        {def}
      </span>
    </span>
  );
}

// ── Dynamic next-deadline ──────────────────────────────────────────────────────
// Add new rows here as regulations are enacted — stat strip auto-advances

// ── Scalability note ──────────────────────────────────────────────────────────
// Add new rows to KEY_DEADLINES as regulations are enacted.
// The stat strip and timeline both derive from this single array — no other changes needed.
// Format: { label: short name, shortLabel: stat strip text, date, display: "Mon YYYY", note: detail }

const KEY_DEADLINES = [
  { label: "EU GPAI Art.53 in force",      shortLabel: "EU GPAI Art.53",     date: new Date("2025-08-01"), display: "Aug 2025", past: true,  note: "GPAI providers must document training energy consumption" },
  { label: "ASRS Australia mandatory",     shortLabel: "ASRS Australia",      date: new Date("2026-01-01"), display: "Jan 2026", past: true,  note: "Large Australian entities — ISSB S2-aligned climate disclosure" },
  { label: "SSBJ Japan in force",          shortLabel: "SSBJ Japan",          date: new Date("2026-03-31"), display: "Mar 2026", past: true,  note: "Large Japanese listed companies — FY ending Mar 2026" },
  { label: "CSRD 2026 filing deadline",    shortLabel: "CSRD filing due",      date: new Date("2026-06-30"), display: "Jun 2026", past: false, note: "Large EU companies file their first mandatory sustainability report (covering FY2025 data)" },
  { label: "China Anthropomorphic AI",     shortLabel: "China AI Measures",   date: new Date("2026-07-15"), display: "Jul 2026", past: false, note: "World's first companion/anthropomorphic AI regulation" },
  { label: "CSRD FY2026 (mid-cap)",        shortLabel: "CSRD mid-cap",        date: new Date("2027-06-30"), display: "Jun 2027", past: false, note: "Mid-size EU companies enter mandatory CSRD reporting" },
];

function getNextDeadline() {
  const now = new Date();
  // Mark past status dynamically rather than relying on the static `past` field
  const future = KEY_DEADLINES.filter(d => d.date > now).sort((a, b) => a.date.getTime() - b.date.getTime());
  return future[0] ?? KEY_DEADLINES[KEY_DEADLINES.length - 1];
}

// ── Step data ──────────────────────────────────────────────────────────────────

const STEPS: Step[] = [
  {
    number: 1,
    title: "Measure",
    description: "Calculate training and inference carbon, energy (kWh), and water (litres) using real grid data and GPU benchmarks.",
    regulatoryHook: "EU GPAI Art.53 · CSRD ESRS E1-5",
    regulatoryBadge: "EU GPAI Art.53",
    methodology: "Apply the Green Software Foundation SCI formula: energy (kWh) = GPU TDP × training hours × GPU count × PUE. Carbon (kgCO₂e) = energy × live grid intensity (gCO₂/kWh from Electricity Maps). Water (litres) = energy × WUE coefficient. Formula validated ±0.1% against Strubell 2019 (BERT-base), Patterson 2021 (T5-11B), and Luccioni 2022 (BLOOM 176B) using matching grid intensity inputs. Static annual averages overestimate by up to 2.4× vs live data — live grid measurement is the correct approach.",
    toolLink: "/carbon-depth",
    toolLabel: "Open Carbon Depth Calculator",
    outputExample: "A100 × 8 GPUs · 168 hrs · Oregon grid (68 gCO₂/kWh) → 847 kWh · 127 kgCO₂e · 254L water",
    citations: [
      "GHG Protocol Scope 2 (2015) — market-based and location-based methods",
      "Green Software Foundation SCI formula (2022)",
      "Strubell et al. (2019) — Energy and Policy Considerations for Deep Learning in NLP",
      "Patterson et al. (2021) — Carbon emissions and large neural network training (Google)",
      "Luccioni et al. (2022) — Estimating the Carbon Footprint of BLOOM (BigScience)",
    ],
  },
  {
    number: 2,
    title: "Benchmark",
    description: "Compare your numbers against MLPerf medians, AIEnergyScore, and published research baselines to assess materiality.",
    regulatoryHook: "CSRD ESRS E1 Double Materiality",
    regulatoryBadge: "CSRD Double Materiality",
    methodology: "CSRD's double materiality test requires assessing whether your AI energy use is material relative to peers — in both financial impact and environmental impact. Compare your kgCO₂e against: (1) MLPerf median for the same task class, (2) AIEnergyScore benchmark for your model size tier, (3) published research baselines (Strubell, Patterson, BLOOM). A result >20% above the median triggers a 'material' classification under CSRD ESRS E1 guidance.",
    toolLink: "/carbon-depth",
    toolLabel: "Open Benchmark Tab",
    outputExample: "Your model: 127 kgCO₂e · MLPerf median (NLP/large): 89 kgCO₂e · 43% above benchmark → Material under CSRD double materiality",
    citations: [
      "MLPerf Training v3.0 benchmarks (MLCommons, 2023)",
      "AIEnergyScore — Lannelongue et al., Green Algorithms (2023)",
      "CSRD ESRS E1 — Double materiality assessment guidance (EFRAG, 2023)",
      "Strubell 2019 · Patterson 2021 · Luccioni 2022 — validated baselines ±0.1%",
    ],
  },
  {
    number: 3,
    title: "Optimise",
    description: "Apply 6 rule-based optimisation strategies and model the carbon trajectory under re-training frequency and data residency constraints.",
    regulatoryHook: "GRI 305-4 · ISSB S2 Transition Plan",
    regulatoryBadge: "ISSB S2 Transition",
    methodology: "Six optimisation levers with quantified reductions: (1) INT8 quantisation −35%, (2) region switch to low-carbon grid −89% (Oregon → Stockholm), (3) H100 upgrade from A100 −45% (tokens/watt from MLPerf Power), (4) reduce re-training frequency −60% per dropped cycle, (5) batch inference scheduling −20%, (6) model distillation −50–70%. ISSB S2 para. 13 requires a climate transition plan showing planned reductions — this step produces the quantified roadmap for that plan.",
    toolLink: "/carbon-depth",
    toolLabel: "Open Recommendations Tab",
    outputExample: "INT8 quantisation: −35% · Region switch (Oregon → Stockholm): −89% · H100 upgrade: −45% · Combined trajectory: 127 → 19 kgCO₂e by Q3 2026",
    citations: [
      "MLPerf Power benchmarks — tokens/watt ratios by GPU generation (MLCommons, 2023)",
      "Electricity Maps — live grid carbon intensity by region (Tomorrow.io)",
      "GRI 305-4 — GHG emissions intensity reduction standard",
      "ISSB S2 para. 13 — climate transition plan disclosure requirements",
    ],
  },
  {
    number: 4,
    title: "Disclose",
    description: "Identify which disclosure obligations apply by company size, industry, and jurisdiction. Map to specific framework clauses.",
    regulatoryHook: "CSRD ESRS E1-6 · EU GPAI Art.53 · ISSB S2 · GRI 305",
    regulatoryBadge: "Multi-framework",
    methodology: "Disclosure obligations depend on three variables: company size, industry, and jurisdiction. Large EU companies: CSRD mandatory from FY2024. GPAI providers: EU AI Act Art.53 mandatory August 2025 (in force). US public companies: SEC Climate Rule (legal challenge pending). ISSB S2 adopted in UK, Canada, Australia, and Singapore. For each applicable framework, map to the specific clause requiring AI energy disclosure — not all CSRD clauses apply to AI workloads; the AI-specific obligations are under ESRS E1-5 (energy consumption) and Art.53 (GPAI technical documentation).",
    toolLink: "/sustainability-standards",
    toolLabel: "Open Standards Tracker",
    outputExample: "Large EU Tech company: CSRD mandatory (FY2025, filed 2026) · EU GPAI Art.53 in force (Aug 2025) · ISSB S2 aligned (voluntary, recommended) · GRI 305 recommended",
    citations: [
      "CSRD Directive (EU) 2022/2464 — ESRS E1 Climate disclosure standard",
      "EU AI Act Art.53 — GPAI general-purpose AI model obligations (in force Aug 2025)",
      "ISSB S2 — Climate-related Disclosures standard (IFRS Foundation, 2023)",
      "GRI 305 — Emissions standard (GRI, 2016, updated 2022)",
      "SEC Climate Disclosure Rule (2024) — legal status pending resolution",
    ],
  },
  {
    number: 5,
    title: "Report",
    description: "Generate disclosure-ready narrative: Technical section (numbers + methodology) and Regulatory section (obligations + sign-off path).",
    regulatoryHook: "CSRD ESRS E1 · ISSB S2 Governance",
    regulatoryBadge: "CSRD ESRS E1",
    methodology: "A complete AI sustainability disclosure requires two sections: (1) Technical — methodology (GHG Protocol Scope 2, SCI formula), measurement period, GPU/region configuration, energy and carbon figures, water usage, benchmark comparison, and optimisation roadmap. (2) Regulatory — which standards apply, disclosure timeline, board-level sign-off (CSRD requires board approval), and auditor requirements (CSRD limited assurance from 2026, reasonable assurance from 2028). Output: a CSRD/ISSB-ready paragraph suitable for a sustainability report or EU GPAI compliance file.",
    toolLink: "/carbon-depth",
    toolLabel: "Open Report Narrative Tab",
    outputExample: "\"During FY2025, our primary AI training workload consumed 847 kWh, producing 127 kgCO₂e (Scope 2, market-based). Methodology: GHG Protocol Scope 2 + Green Software Foundation SCI formula, validated ±0.1% against Strubell 2019, Patterson 2021, and Luccioni 2022 using matching grid intensity. Grid sourced from Electricity Maps (live, Oregon region). This represents 43% above the MLPerf NLP/large median, triggering CSRD ESRS E1 double materiality disclosure. Transition plan: INT8 quantisation + region migration targets 85% reduction by Q3 2026.\"",
    citations: [
      "CSRD ESRS E1-6 — Scope 1, 2, 3 GHG emissions disclosure requirements",
      "CSRD ESRS E1 para. 44–49 — Double materiality statement requirements",
      "ISSB S2 para. 6–9 — Governance and metrics disclosure requirements",
      "EU AI Act Art.53(1)(d) — GPAI energy consumption documentation obligation",
      "GHG Protocol Scope 2 Guidance — market-based vs location-based accounting",
    ],
  },
];

// ── Label maps ────────────────────────────────────────────────────────────────

const SIZE_LABELS: Record<string, string> = {
  small:      "Small / Emerging (< 1,000 employees)",
  medium:     "Medium (1,000–3,000)",
  enterprise: "Enterprise (3,000–10,000)",
  large:      "Large Enterprise (10,000+)",
  listed:     "Public / Listed Company",
  gpai:       "GPAI / Foundation Model Provider",
};
const INDUSTRY_LABELS: Record<string, string> = {
  tech:         "Tech / AI",
  finance:      "Financial Services",
  healthcare:   "Healthcare",
  pharma:       "Pharma / Life Sciences",
  manufacturing:"Manufacturing / Industrial",
  energy:       "Energy & Utilities",
  retail:       "Retail / E-commerce",
  logistics:    "Logistics & Supply Chain",
  media:        "Media & Entertainment",
  government:   "Government / Public Sector",
  professional: "Professional Services",
  other:        "Other",
};
const JURISDICTION_LABELS: Record<string, string> = {
  eu:     "EU",
  us:     "US",
  uk:     "UK",
  apac:   "APAC",
  global: "Global / Multi-jurisdiction",
};
const DISCLOSURE_LABELS: Record<string, string> = {
  none:      "None",
  voluntary: "Voluntary only",
  prep:      "Preparing for mandatory",
  reporting: "Already reporting",
};

// ── Industry → disclosure status hint ────────────────────────────────────────
// Shown below the disclosure status dropdown to help users self-identify

const INDUSTRY_DISCLOSURE_HINTS: Record<string, string> = {
  finance:       "Financial services firms face TCFD expectations from banking regulators (FCA, ECB, Fed) regardless of company size — most large finance firms are already reporting or preparing.",
  healthcare:    "Healthcare AI is classified as high-risk under EU AI Act Annex III — additional conformity assessment obligations apply on top of sustainability disclosure.",
  energy:        "Energy & utilities companies typically have the highest mandatory disclosure expectations due to material Scope 1 direct emissions — most large players are already reporting.",
  manufacturing: "Manufacturing supply chains have material Scope 3 Cat.1 (hardware) and Cat.11 (use-of-sold-products) emissions — buyers increasingly require Scope 3 disclosure from suppliers.",
  pharma:        "Pharma/life sciences companies face growing investor pressure for Scope 3 Cat.11 (patient use of products) disclosure — ISSB S2 adoption is accelerating in this sector.",
  retail:        "Large retailers face Scope 3 Cat.11 (use of sold products) and Cat.1 (purchased goods) pressure — CSRD and ISSB S2 are both material for large EU/UK retailers.",
  logistics:     "Logistics companies face material Scope 1 (fleet) and Scope 3 Cat.4 (upstream transport) obligations — most large logistics firms are already in mandatory reporting cycles.",
  tech:          "Tech and AI companies face EU GPAI Art.53 (training energy) and CSRD ESRS E1-5 (energy consumption) — the sector most directly impacted by AI-specific sustainability obligations.",
  media:         "Media and entertainment companies have growing data centre footprints — CSRD and ISSB S2 are increasingly material for streaming and cloud-heavy media firms.",
  government:    "Public sector organisations are often exempt from CSRD but face voluntary sustainability commitments — many national governments require their agencies to report under national frameworks.",
  professional:  "Professional services firms are often Scope 2-intensive (offices + compute) — CSRD mandatory for large EU firms; ISSB S2 and GRI 305 are widely adopted voluntarily.",
};

// ── Obligation lookup ─────────────────────────────────────────────────────────

function getObligations(answers: IntakeAnswers): ObligationResult | null {
  if (!answers.size || !answers.industry || !answers.jurisdiction || !answers.disclosure) return null;

  const mandatory: string[] = [];
  const upcoming: string[] = [];
  const voluntary: string[] = [];

  const isEU     = answers.jurisdiction === "eu" || answers.jurisdiction === "global";
  const isUS     = answers.jurisdiction === "us" || answers.jurisdiction === "global";
  const isUK     = answers.jurisdiction === "uk" || answers.jurisdiction === "global";
  const isAPAC   = answers.jurisdiction === "apac" || answers.jurisdiction === "global";
  // CSRD "large company" threshold: >250 employees — medium/enterprise/large/listed all qualify
  const isLarge  = ["medium", "enterprise", "large", "listed"].includes(answers.size);
  const isListed = answers.size === "listed";
  const isGPAI   = answers.size === "gpai";

  if (isEU) {
    if (isLarge || isGPAI) mandatory.push("CSRD / ESRS E1 — Scope 1, 2, 3 GHG disclosure incl. AI workloads (FY2025 data, filed 2026)");
    if (answers.size === "small") upcoming.push("CSRD VSME — Voluntary SME sustainability standard (from 2026, mandatory phased in for smaller companies)");
    if (isGPAI) mandatory.push("EU AI Act Art.53 — GPAI training energy documentation (in force Aug 2025)");
    voluntary.push("EU Taxonomy Regulation — AI data centre energy alignment (voluntary narrative disclosure)");
  }

  if (isUS) {
    if (isListed) upcoming.push("SEC Climate Disclosure Rule — Scope 1/2 for large accelerated filers (legal challenge pending — monitor closely)");
    voluntary.push("GRI 305 — Voluntary GHG emissions standard (widely adopted by US large caps)");
    voluntary.push("TCFD — Voluntary climate risk disclosure (basis for many investor requirements)");
  }

  if (isUK) {
    if (isLarge || isListed) mandatory.push("UK TCFD-aligned rules — Scope 1/2/3 for large UK companies and listed entities (in force 2022+)");
  }

  if (isAPAC) {
    if (isListed) {
      upcoming.push("SGX Climate Reporting — Singapore listed companies (phased 2023–2025, now mandatory for large caps)");
      upcoming.push("ASRS / AASB S2 — Australian large entities (mandatory from Jan 2026)");
      upcoming.push("SSBJ S2 — Japan large listed companies (in force FY ending Mar 2026)");
    }
  }

  // Universal recommendations for large/listed
  if (isLarge || isGPAI || isListed) {
    if (!voluntary.some(v => v.startsWith("ISSB S2")))
      voluntary.push("ISSB S2 — Climate financial disclosure (adopted in 20+ jurisdictions, rapidly becoming global baseline)");
    if (!voluntary.some(v => v.startsWith("GRI 305")))
      voluntary.push("GRI 305 — GHG emissions standard (complementary to ISSB S2, widely expected by investors)");
  }

  // Penalty
  let penaltyExposure = "Low — no current mandatory obligations for this profile. Voluntary frameworks recommended to future-proof.";
  if (mandatory.length > 0) {
    if (isEU) penaltyExposure = "High — CSRD non-compliance: statutory audit failure + member-state penalties (varies by country). EU AI Act GPAI systemic risk violations: up to €35M OR 7% of global annual turnover — whichever is higher. In practice: a company with €500M revenue faces up to €35M; a company with €5B revenue faces up to €350M. The 7% provision is deliberately designed to scale with company size.";
    else if (isUK) penaltyExposure = "Medium-High — UK TCFD non-compliance: FCA enforcement action and potential delisting risk for listed entities.";
    else penaltyExposure = "Medium — mandatory obligations identified. Review jurisdiction-specific enforcement mechanisms.";
  } else if (upcoming.length > 0) {
    penaltyExposure = "Medium — no current mandatory obligations, but upcoming requirements need preparation now. Companies without measurement tooling in place will miss the first filing cycle.";
  }

  // Recommended step
  let recommendedStep = 1;
  let recommendedStepReason = "Start by measuring — you cannot disclose what you have not measured.";
  let urgency: "high" | "medium" | "low" = "low";

  if (answers.disclosure === "none") {
    recommendedStep = 1; urgency = mandatory.length > 0 ? "high" : "medium";
    recommendedStepReason = "No measurement in place. Step 1 (Measure) is your immediate priority — without a baseline, every subsequent step is blocked.";
  } else if (answers.disclosure === "voluntary") {
    recommendedStep = 2; urgency = mandatory.length > 0 ? "high" : "low";
    recommendedStepReason = "Voluntary disclosure is in place. Step 2 (Benchmark) is your next lever — comparing against peers reveals whether your footprint is material and strengthens your narrative.";
  } else if (answers.disclosure === "prep") {
    recommendedStep = 4; urgency = "high";
    recommendedStepReason = "Preparing for mandatory disclosure. Step 4 (Disclose) maps your specific obligations to clauses — use it to confirm your regulatory checklist before filing.";
  } else {
    recommendedStep = 3; urgency = "low";
    recommendedStepReason = "Already reporting. Step 3 (Optimise) is your next focus — turn disclosure into a reduction roadmap that satisfies ISSB S2 transition plan requirements.";
  }

  return { mandatory, upcoming, voluntary, penaltyExposure, recommendedStep, recommendedStepReason, urgency };
}

// ── Profile note per step ─────────────────────────────────────────────────────

function getStepProfileNote(stepNum: number, answers: IntakeAnswers, result: ObligationResult | null): string | null {
  if (!result || !answers.size || !answers.jurisdiction) return null;
  const isEU    = answers.jurisdiction === "eu" || answers.jurisdiction === "global";
  const isLarge = ["large", "enterprise", "listed"].includes(answers.size);
  const isGPAI  = answers.size === "gpai";

  switch (stepNum) {
    case 1:
      if (isGPAI && isEU) return "EU AI Act Art.53 requires GPAI providers to document training energy consumption in technical documentation. This step produces the numbers required for that filing.";
      if (isEU && isLarge) return "CSRD ESRS E1-5 requires you to disclose AI energy consumption as part of Scope 2. Documented methodology (GHG Protocol Scope 2 + SCI formula) is required — not estimates.";
      return "Establishing a documented measurement baseline is required by all major frameworks. Without it, no downstream step is defensible.";
    case 2:
      if (isEU) return "CSRD double materiality: you must assess whether your AI footprint is material relative to peers. A result >20% above the MLPerf median typically triggers a material classification requiring full ESRS E1 disclosure.";
      return "Benchmarking reveals whether your footprint is an outlier. This step provides the evidence layer for any materiality assessment required by your applicable framework.";
    case 3:
      if (isEU && (isLarge || isGPAI)) return "ISSB S2 para. 13 and CSRD ESRS E1-7 both require a climate transition plan with quantified targets. This step produces the documented reduction roadmap those plans demand.";
      return "Optimisation reduces both cost and carbon simultaneously. The Recommendation Agent quantifies impact per lever so you can prioritise by ROI and regulatory benefit.";
    case 4:
      if (result.mandatory.length > 0) return `Your profile carries ${result.mandatory.length} mandatory obligation${result.mandatory.length > 1 ? "s" : ""}. This step maps the exact clauses you must comply with — use the Standards Tracker to review deadline and penalty detail.`;
      if (result.upcoming.length > 0) return "You have upcoming obligations that require preparation now. Use this step and the Standards Tracker to confirm your readiness checklist before deadlines hit.";
      return "Use this step to identify voluntary frameworks that strengthen your ESG rating and procurement qualification — even without mandatory obligations.";
    case 5:
      if (isEU && isLarge) return "CSRD requires board approval of the sustainability report and limited assurance from an external auditor from FY2026 onwards. This step produces ESRS E1-ready disclosure language that meets those requirements.";
      if (isGPAI) return "EU AI Act Art.53 technical documentation must include training energy figures with methodology. This step generates the disclosure-ready text for that filing.";
      return "This step produces the disclosure-ready narrative section — structured for direct inclusion in your sustainability report or regulatory compliance file.";
    default: return null;
  }
}

// ── BusinessCaseIntake ────────────────────────────────────────────────────────

function BusinessCaseIntake({
  answers, onChange, onSubmit, onReset, submitted,
}: {
  answers: IntakeAnswers;
  onChange: (f: keyof IntakeAnswers, v: string) => void;
  onSubmit: () => void;
  onReset: () => void;
  submitted: boolean;
}) {
  const allAnswered = answers.size && answers.industry && answers.jurisdiction && answers.disclosure;
  const sel = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-violet-500/50";
  const lbl = "block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider";

  return (
    <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">🎯</span>
        <div>
          <h3 className="text-sm font-bold text-foreground">Find your obligations</h3>
          <p className="text-xs text-muted-foreground">Answer 4 questions for a personalised regulatory map</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <div>
          <label className={lbl}>Company size</label>
          <select className={sel} value={answers.size} onChange={e => onChange("size", e.target.value)} disabled={submitted}>
            <option value="">Select…</option>
            <option value="small">Small / Emerging (&lt; 1,000 employees)</option>
            <option value="medium">Medium (1,000–3,000)</option>
            <option value="enterprise">Enterprise (3,000–10,000)</option>
            <option value="large">Large Enterprise (10,000+)</option>
            <option value="listed">Public / Listed Company</option>
            <option value="gpai">GPAI / Foundation Model Provider</option>
          </select>
        </div>

        <div>
          <label className={lbl}>Industry</label>
          <select className={sel} value={answers.industry} onChange={e => onChange("industry", e.target.value)} disabled={submitted}>
            <option value="">Select…</option>
            <option value="tech">Tech / AI</option>
            <option value="finance">Financial Services</option>
            <option value="healthcare">Healthcare</option>
            <option value="pharma">Pharma / Life Sciences</option>
            <option value="manufacturing">Manufacturing / Industrial</option>
            <option value="energy">Energy & Utilities</option>
            <option value="retail">Retail / E-commerce</option>
            <option value="logistics">Logistics & Supply Chain</option>
            <option value="media">Media & Entertainment</option>
            <option value="government">Government / Public Sector</option>
            <option value="professional">Professional Services</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className={lbl}>Primary jurisdiction</label>
          <select className={sel} value={answers.jurisdiction} onChange={e => onChange("jurisdiction", e.target.value)} disabled={submitted}>
            <option value="">Select…</option>
            <option value="eu">EU</option>
            <option value="us">US</option>
            <option value="uk">UK</option>
            <option value="apac">APAC</option>
            <option value="global">Global / Multi-jurisdiction</option>
          </select>
        </div>

        <div>
          <label className={lbl}>Current disclosure status</label>
          <select className={sel} value={answers.disclosure} onChange={e => onChange("disclosure", e.target.value)} disabled={submitted}>
            <option value="">Select…</option>
            <option value="none">None</option>
            <option value="voluntary">Voluntary only</option>
            <option value="prep">Preparing for mandatory</option>
            <option value="reporting">Already reporting</option>
          </select>
          {answers.industry && INDUSTRY_DISCLOSURE_HINTS[answers.industry] && (
            <p className="mt-1.5 text-[10px] text-violet-400/80 leading-relaxed">
              {INDUSTRY_DISCLOSURE_HINTS[answers.industry]}
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        {!submitted ? (
          <button
            onClick={onSubmit}
            disabled={!allAnswered}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Show my obligations →
          </button>
        ) : (
          <button
            onClick={onReset}
            className="px-4 py-2 rounded-lg text-xs font-semibold border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
          >
            ↩ Start over
          </button>
        )}
      </div>
    </div>
  );
}

// ── Obligation summary ────────────────────────────────────────────────────────

function ObligationColumn({ label, color, items }: { label: string; color: "red" | "amber" | "emerald"; items: string[] }) {
  const c = {
    red:     { border: "border-red-500/30",     bg: "bg-red-500/5",     text: "text-red-400",     dot: "bg-red-400" },
    amber:   { border: "border-amber-500/30",   bg: "bg-amber-500/5",   text: "text-amber-400",   dot: "bg-amber-400" },
    emerald: { border: "border-emerald-500/30", bg: "bg-emerald-500/5", text: "text-emerald-400", dot: "bg-emerald-400" },
  }[color];
  return (
    <div className={`rounded-xl border p-4 ${c.border} ${c.bg}`}>
      <p className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${c.text}`}>{label}</p>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 items-start">
            <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${c.dot}`} />
            <span className="text-xs text-muted-foreground leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BusinessCaseSummary({ result, onGoToStep }: { result: ObligationResult; onGoToStep: (n: number) => void }) {
  const urgencyStyle = {
    high:   "border-red-500/40 bg-red-500/5",
    medium: "border-amber-500/40 bg-amber-500/5",
    low:    "border-emerald-500/40 bg-emerald-500/5",
  }[result.urgency];
  const urgencyLabel = { high: "🔴 High urgency", medium: "🟡 Medium urgency", low: "🟢 Low urgency" }[result.urgency];

  return (
    <div className="space-y-4 mt-4">
      <div className={`rounded-xl border p-4 ${urgencyStyle}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-foreground">{urgencyLabel}</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{result.penaltyExposure}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {result.mandatory.length > 0 && <ObligationColumn label="Mandatory" color="red" items={result.mandatory} />}
        {result.upcoming.length > 0  && <ObligationColumn label="Upcoming"  color="amber" items={result.upcoming} />}
        {result.voluntary.length > 0 && <ObligationColumn label="Voluntary / Recommended" color="emerald" items={result.voluntary} />}
      </div>

      <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4">
        <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1.5">
          Recommended starting point → Step {result.recommendedStep}
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed mb-3">{result.recommendedStepReason}</p>
        <button onClick={() => onGoToStep(result.recommendedStep)} className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors">
          Jump to Step {result.recommendedStep} ↓
        </button>
      </div>
    </div>
  );
}

// ── Business case pillars ─────────────────────────────────────────────────────

function BusinessCasePillars() {
  const pillars = [
    {
      icon: "⚠️",
      label: "Cost of non-compliance",
      body: "CSRD: statutory audit failure + member-state penalties (Germany: up to €10M; France: €375K per violation). EU AI Act GPAI systemic risk: up to €35M or 7% of global turnover — whichever is higher. A company with €1B revenue faces up to €70M exposure.",
      roi: null,
    },
    {
      icon: "📈",
      label: "Value of disclosure",
      body: "ESG rating uplift opens green bond markets at 15–50bps lower cost of capital (Climate Bonds Initiative 2023). Top-quartile ESG scores correlate with 10–15% lower WACC. 67% of Fortune 500 companies now require Scope 3 from AI vendors (CDP Supply Chain 2023).",
      roi: "15–50bps lower cost of capital",
    },
    {
      icon: "💡",
      label: "Efficiency ROI",
      body: "Carbon Depth Recommendation Agent quantifies per lever: region switch (Oregon → Stockholm) −89% carbon AND −60% compute cost. INT8 quantisation −35% carbon, −20–30% inference cost. H100 upgrade from A100: −45% carbon, 2.5× throughput per watt.",
      roi: "−89% carbon · −60% compute cost",
    },
    {
      icon: "⏱️",
      label: "Timeline pressure",
      body: "CSRD FY2025 data → filed June 2026 (large EU companies). EU GPAI Art.53 mandatory since August 2025. Average readiness timeline: 6–12 months. Companies starting compliance work now are already behind the first filing cycle.",
      roi: null,
    },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
      {pillars.map(p => (
        <div key={p.label} className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-base">{p.icon}</span>
              <span className="text-xs font-bold text-foreground">{p.label}</span>
            </div>
            {p.roi && (
              <span className="text-[10px] font-mono text-emerald-400 border border-emerald-500/25 bg-emerald-500/5 px-2 py-0.5 rounded-full shrink-0">{p.roi}</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{p.body}</p>
        </div>
      ))}
    </div>
  );
}

// ── Regulatory Timeline ───────────────────────────────────────────────────────

function RegulatoryTimeline() {
  const now = new Date();
  return (
    <div className="rounded-xl border border-border bg-card p-5 mb-8">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Regulatory timeline</p>
      <div className="relative">
        {/* Track line */}
        <div className="absolute top-3 left-0 right-0 h-px bg-border" />
        <div className="flex justify-between gap-2 relative">
          {KEY_DEADLINES.map((d) => {
            const isPast = d.date <= now;
            const isNext = !isPast && KEY_DEADLINES.filter(x => x.date > now)[0]?.label === d.label;
            return (
              <div key={d.label} className="flex flex-col items-center flex-1 min-w-0">
                {/* Dot */}
                <div className={`w-3 h-3 rounded-full border-2 z-10 mb-2 shrink-0 ${
                  isPast  ? "bg-muted border-border" :
                  isNext  ? "bg-amber-400 border-amber-300 ring-2 ring-amber-400/30" :
                            "bg-violet-500/40 border-violet-500/60"
                }`} />
                {/* Date */}
                <span className={`text-[9px] font-mono leading-tight text-center ${
                  isPast ? "text-muted-foreground/40" : isNext ? "text-amber-400 font-bold" : "text-muted-foreground"
                }`}>{d.display}</span>
                {/* Label */}
                <span className={`text-[9px] leading-tight text-center mt-0.5 ${
                  isPast ? "text-muted-foreground/30" : isNext ? "text-amber-400/80" : "text-muted-foreground/60"
                }`}>{d.shortLabel}</span>
                {isNext && <span className="text-[8px] text-amber-400 font-bold mt-0.5">← next</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── StepCard ──────────────────────────────────────────────────────────────────

function StepCard({
  step, isOpen, onToggle, highlight, profileNote,
}: {
  step: Step;
  isOpen: boolean;
  onToggle: () => void;
  highlight: boolean;
  profileNote: string | null;
}) {
  return (
    <div
      id={`step-${step.number}`}
      className={`rounded-xl border transition-colors ${
        highlight ? "border-blue-500/50 ring-1 ring-blue-500/30" :
        isOpen    ? "border-violet-500/40" : "border-border hover:border-border/70"
      } bg-card`}
    >
      <button className="w-full text-left px-5 py-4" onClick={onToggle}>
        <div className="flex items-center gap-4">
          <span className="shrink-0 w-8 h-8 rounded-full bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-xs font-bold text-violet-400">
            {step.number}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-foreground">{step.title}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-violet-500/25 bg-violet-500/10 text-violet-400">
                {step.regulatoryBadge}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{step.description}</p>
          </div>
          <span className="shrink-0 text-xs text-muted-foreground ml-2">{isOpen ? "▾" : "▸"}</span>
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-border/50 px-5 py-5 space-y-5">
          {/* Profile-aware callout */}
          {profileNote && (
            <div className="rounded-lg border border-blue-500/25 bg-blue-500/5 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-1">For your profile</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{profileNote}</p>
            </div>
          )}

          {/* Regulatory hook */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Regulatory hook</p>
            <p className="text-xs text-violet-400 font-mono">{step.regulatoryHook}</p>
          </div>

          {/* Methodology */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Methodology</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{step.methodology}</p>
          </div>

          {/* Output example */}
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-1">Example output</p>
            <p className="text-xs text-muted-foreground leading-relaxed font-mono">{step.outputExample}</p>
          </div>

          {/* Citations */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Sources</p>
            <ul className="space-y-1">
              {step.citations.map((c, i) => (
                <li key={i} className="text-xs text-muted-foreground/70 leading-relaxed before:content-['›'] before:mr-2 before:text-muted-foreground/40">{c}</li>
              ))}
            </ul>
          </div>

          {/* Tool link — passes referrer state so Carbon Depth shows "← Back to Framework" */}
          <Link
            to={step.toolLink}
            state={{ from: "/sustainability-framework", fromLabel: "Sustainability Framework" }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors"
          >
            {step.toolLabel} →
          </Link>
        </div>
      )}
    </div>
  );
}

// ── StepAccordion ─────────────────────────────────────────────────────────────

function StepAccordion({
  jumpToStep, onClearJump, answers, result,
}: {
  jumpToStep: number | null;
  onClearJump: () => void;
  answers: IntakeAnswers;
  result: ObligationResult | null;
}) {
  const [openStep, setOpenStep] = useState<number | null>(null);
  const effectiveOpen = jumpToStep ?? openStep;

  function toggle(n: number) {
    if (jumpToStep !== null) onClearJump();
    setOpenStep(prev => prev === n ? null : n);
  }

  return (
    <div className="space-y-3">
      {STEPS.map(step => (
        <StepCard
          key={step.number}
          step={step}
          isOpen={effectiveOpen === step.number}
          onToggle={() => toggle(step.number)}
          highlight={jumpToStep === step.number}
          profileNote={getStepProfileNote(step.number, answers, result)}
        />
      ))}
    </div>
  );
}

// ── Consolidated summary ──────────────────────────────────────────────────────

function ConsolidatedSummary({ answers, result }: { answers: IntakeAnswers; result: ObligationResult }) {
  const [copied, setCopied] = useState(false);

  const profileDesc = [
    SIZE_LABELS[answers.size] ?? answers.size,
    INDUSTRY_LABELS[answers.industry] ?? answers.industry,
    JURISDICTION_LABELS[answers.jurisdiction] ?? answers.jurisdiction,
    DISCLOSURE_LABELS[answers.disclosure] ?? answers.disclosure,
  ].join(" · ");

  const actionPlan = STEPS.map(s => {
    const note = getStepProfileNote(s.number, answers, result);
    return `Step ${s.number} — ${s.title}: ${note ?? s.description}`;
  });

  const summaryText = [
    "AI SUSTAINABILITY DISCLOSURE — BUSINESS CASE SUMMARY",
    "=".repeat(54),
    "",
    `Profile: ${profileDesc}`,
    `Urgency: ${result.urgency.toUpperCase()}`,
    "",
    "PENALTY EXPOSURE",
    result.penaltyExposure,
    "",
    result.mandatory.length > 0 ? ["MANDATORY OBLIGATIONS", ...result.mandatory.map(i => `  • ${i}`)].join("\n") : "",
    result.upcoming.length > 0  ? ["UPCOMING OBLIGATIONS", ...result.upcoming.map(i => `  • ${i}`)].join("\n") : "",
    result.voluntary.length > 0 ? ["VOLUNTARY / RECOMMENDED", ...result.voluntary.map(i => `  • ${i}`)].join("\n") : "",
    "",
    "5-STEP ACTION PLAN",
    ...actionPlan.map((a, i) => `${i + 1}. ${a}`),
    "",
    "Generated by AI Sustainability Disclosure Framework — preetibuilds",
  ].filter(Boolean).join("\n");

  function handleCopy() {
    navigator.clipboard.writeText(summaryText).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 mt-8">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h2 className="text-sm font-bold text-foreground mb-1">Your disclosure roadmap</h2>
          <p className="text-xs text-muted-foreground">{profileDesc}</p>
        </div>
        <button
          onClick={handleCopy}
          className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
        >
          {copied ? "Copied ✓" : "Copy summary"}
        </button>
      </div>

      {/* Why this matters + timeline — inside roadmap */}
      <div className="mb-6 pb-6 border-b border-border/50">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Business case</p>
        <BusinessCasePillars />
        <RegulatoryTimeline />
      </div>

      {/* Urgency + penalty */}
      <div className={`rounded-lg border p-4 mb-5 ${
        result.urgency === "high" ? "border-red-500/30 bg-red-500/5" :
        result.urgency === "medium" ? "border-amber-500/30 bg-amber-500/5" :
        "border-emerald-500/30 bg-emerald-500/5"
      }`}>
        <p className="text-xs font-bold text-foreground mb-1">
          {{ high: "🔴 High urgency", medium: "🟡 Medium urgency", low: "🟢 Low urgency" }[result.urgency]}
          {" · "}Penalty exposure
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">{result.penaltyExposure}</p>
      </div>

      {/* Obligations recap */}
      {(result.mandatory.length > 0 || result.upcoming.length > 0) && (
        <div className="mb-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Your obligations</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {result.mandatory.length > 0 && <ObligationColumn label="Mandatory" color="red" items={result.mandatory} />}
            {result.upcoming.length > 0 && <ObligationColumn label="Upcoming" color="amber" items={result.upcoming} />}
          </div>
        </div>
      )}

      {/* 5-step action plan */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Your 5-step action plan</p>
        <div className="space-y-2">
          {STEPS.map(step => {
            const note = getStepProfileNote(step.number, answers, result);
            const isRecommended = step.number === result.recommendedStep;
            return (
              <div key={step.number} className={`flex gap-3 items-start rounded-lg px-4 py-3 border ${
                isRecommended ? "border-blue-500/30 bg-blue-500/5" : "border-border/50 bg-background/30"
              }`}>
                <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isRecommended ? "bg-blue-500/20 border border-blue-500/40 text-blue-400" : "bg-muted/40 text-muted-foreground"
                }`}>
                  {step.number}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">{step.title}</span>
                    {isRecommended && <span className="text-[10px] font-mono text-blue-400 border border-blue-500/30 rounded-full px-1.5 py-0.5">Start here</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{note ?? step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Voluntary recommendations */}
      {result.voluntary.length > 0 && (
        <div className="mt-5 pt-5 border-t border-border/50">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Also recommended</p>
          <ul className="space-y-1">
            {result.voluntary.map((v, i) => (
              <li key={i} className="text-xs text-muted-foreground leading-relaxed before:content-['›'] before:mr-2 before:text-muted-foreground/40">{v}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Preview ───────────────────────────────────────────────────────────────────

function SustainabilityFrameworkPreview() {
  const nextDeadline = getNextDeadline();
  return (
    <div className="relative">
      <DiagonalWatermark />
      <div className="max-w-[900px] mx-auto px-6 py-14">
        <Link to="/#projects" className="text-xs text-muted-foreground hover:text-foreground transition-colors mb-6 inline-block">
          ← Back to Portfolio
        </Link>
        <div className="flex flex-wrap gap-2 mb-4">
          {["Sustainable AI", "CSRD", "EU GPAI Art.53", "ISSB S2", "GRI 305"].map(t => (
            <span key={t} className="text-[10px] font-mono px-2.5 py-1 rounded-full border border-violet-500/30 bg-violet-500/5 text-violet-400">{t}</span>
          ))}
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">AI Sustainability Disclosure Framework</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          A 5-step practitioner framework for measuring, benchmarking, optimising, and disclosing
          the environmental footprint of AI systems — mapped to CSRD, EU GPAI Art.53, and ISSB S2.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-8">
          {[
            { value: "5", label: "Framework Steps" },
            { value: "6+", label: "Regulations Mapped" },
            { value: "±0.1%", label: "Formula Accuracy" },
            { value: nextDeadline.display, label: `Next: ${nextDeadline.shortLabel}` },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4 text-center">
              <div className="text-xl font-bold text-foreground">{s.value}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="space-y-3 blur-sm pointer-events-none select-none">
          {STEPS.map(step => (
            <div key={step.number} className="rounded-xl border border-border bg-card px-5 py-4">
              <div className="flex items-center gap-4">
                <span className="w-8 h-8 rounded-full bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-xs font-bold text-violet-400 shrink-0">{step.number}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">{step.title}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-violet-500/25 bg-violet-500/10 text-violet-400">{step.regulatoryBadge}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const SESSION_KEY = "sf_intake";

export default function SustainabilityFramework() {
  useVisitLogger("sustainability-framework");

  const [answers, setAnswers]     = useState<IntakeAnswers>({ size: "", industry: "", jurisdiction: "", disclosure: "" });
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult]       = useState<ObligationResult | null>(null);
  const [jumpToStep, setJumpToStep] = useState<number | null>(null);

  // Restore state from sessionStorage on mount (survives navigation to/from tool pages)
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        const { answers: a, submitted: s } = JSON.parse(saved) as { answers: IntakeAnswers; submitted: boolean };
        setAnswers(a);
        if (s) { setSubmitted(true); setResult(getObligations(a)); }
      }
    } catch {}
  }, []);

  // Persist state whenever it changes
  useEffect(() => {
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify({ answers, submitted })); } catch {}
  }, [answers, submitted]);

  function handleChange(field: keyof IntakeAnswers, value: string) {
    setAnswers(prev => ({ ...prev, [field]: value as IntakeAnswers[typeof field] }));
  }

  function handleSubmit() {
    const r = getObligations(answers);
    setResult(r);
    setSubmitted(true);
  }

  function handleReset() {
    setAnswers({ size: "", industry: "", jurisdiction: "", disclosure: "" });
    setSubmitted(false);
    setResult(null);
    setJumpToStep(null);
    try { sessionStorage.removeItem(SESSION_KEY); } catch {}
  }

  function handleGoToStep(n: number) {
    setJumpToStep(n);
    setTimeout(() => {
      document.getElementById(`step-${n}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }

  const nextDeadline = getNextDeadline();

  return (
    <PageGate pageId="sustainability-framework" backTo="/#projects" previewContent={<SustainabilityFrameworkPreview />}>
      <div className="max-w-[900px] mx-auto px-6 py-14">
        <DiagonalWatermark />

        <Link to="/#projects" className="text-xs text-muted-foreground hover:text-foreground transition-colors mb-6 inline-block">
          ← Back to Portfolio
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 mb-4">
            {["Sustainable AI", "CSRD", "EU GPAI Art.53", "ISSB S2", "GRI 305", "TCFD"].map(t => (
              <span key={t} className="text-[10px] font-mono px-2.5 py-1 rounded-full border border-violet-500/30 bg-violet-500/5 text-violet-400">{t}</span>
            ))}
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">AI Sustainability Disclosure Framework</h1>
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
            A 5-step end-to-end practitioner workflow for measuring, benchmarking, optimising, and disclosing
            the environmental footprint of AI systems — mapped to{" "}
            <AcronymTip term="CSRD">CSRD</AcronymTip> (2024),{" "}
            <AcronymTip term="GPAI">EU GPAI</AcronymTip> Art.53 (Aug 2025), and{" "}
            <AcronymTip term="ISSB S2">ISSB S2</AcronymTip> (2024) compliance cycles.
          </p>
        </div>

        {/* Stat strip — Next Deadline is dynamic */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          {[
            { value: "5",                    label: "Framework Steps" },
            { value: "6+",                   label: "Regulations Mapped" },
            { value: "±0.1%",                label: "Formula Accuracy" },
            { value: nextDeadline.display,   label: `Next: ${nextDeadline.shortLabel}` },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4 text-center">
              <div className="text-xl font-bold text-foreground">{s.value}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Business case intake */}
        <div className="mb-6">
          <h2 className="text-sm font-bold text-foreground mb-3">Find your obligations</h2>
          <BusinessCaseIntake
            answers={answers}
            onChange={handleChange}
            onSubmit={handleSubmit}
            onReset={handleReset}
            submitted={submitted}
          />
          {submitted && result && (
            <BusinessCaseSummary result={result} onGoToStep={handleGoToStep} />
          )}
        </div>

        {/* 5-step accordion */}
        <div className="mb-8">
          <h2 className="text-sm font-bold text-foreground mb-1">The 5-step framework</h2>
          <p className="text-xs text-muted-foreground mb-5">
            Click any step to expand methodology, tool links, output examples, and cited sources.{" "}
            Tool links navigate within the same window — your obligation answers are saved and restored automatically when you return.
          </p>
          <StepAccordion
            jumpToStep={jumpToStep}
            onClearJump={() => setJumpToStep(null)}
            answers={answers}
            result={result}
          />
        </div>

        {/* Consolidated summary — only shown when intake is filled */}
        {submitted && result && (
          <ConsolidatedSummary answers={answers} result={result} />
        )}
      </div>
    </PageGate>
  );
}
