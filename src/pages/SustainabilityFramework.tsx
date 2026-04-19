import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import pptxgen from "pptxgenjs";
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
  methodologyPoints: string[];
  toolLink: string;
  toolLabel: string;
  outputExample: string;
  outputPoints: string[];
  citations: string[];
  cadence: string;
  cadencePoints: string[];
  scopeNote: string;
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
    methodologyPoints: [
      "Apply GHG Protocol Scope 2 market-based method — the standard for purchased electricity emissions",
      "Energy: kWh = GPU TDP × training hours × GPU count × PUE",
      "Carbon: kgCO₂e = energy × live grid intensity (gCO₂/kWh, sourced from Electricity Maps API)",
      "Water: litres = energy × WUE coefficient (0.3–1.8 L/kWh by data centre type)",
      "Formula validated ±0.1% against Strubell 2019, Patterson 2021, and Luccioni 2022",
      "Key insight: static annual grid averages overestimate by up to 2.4× vs live data — live measurement is the only defensible approach for regulatory disclosure",
    ],
    outputExample: "A100 × 8 GPUs · 168 hrs · Oregon grid (68 gCO₂/kWh) → 847 kWh · 127 kgCO₂e · 254L water",
    outputPoints: [
      "GPU: A100 × 8 · Training duration: 168 hours",
      "Grid: Oregon (AWS us-west-2) · Intensity: 68 gCO₂/kWh",
      "Energy: 847 kWh · Carbon: 127 kgCO₂e · Water: 254 litres",
    ],
    citations: [
      "GHG Protocol Scope 2 (2015) — market-based and location-based methods",
      "Green Software Foundation SCI formula (2022)",
      "Strubell et al. (2019) — Energy and Policy Considerations for Deep Learning in NLP",
      "Patterson et al. (2021) — Carbon emissions and large neural network training (Google)",
      "Luccioni et al. (2022) — Estimating the Carbon Footprint of BLOOM (BigScience)",
    ],
    cadence: "Before each major model deployment, then quarterly. Re-run whenever GPU fleet or cloud region changes.",
    cadencePoints: [
      "Before each major model deployment",
      "Quarterly thereafter",
      "Re-run whenever GPU fleet or cloud region changes",
    ],
    scopeNote: "Scope 2 (purchased electricity for training/inference). Scope 3 Cat.1 hardware manufacturing is excluded from this tool — account for it separately via supplier invoices.",
  },
  {
    number: 2,
    title: "Benchmark",
    description: "Compare your numbers against MLPerf medians, AIEnergyScore, and published research baselines to assess materiality.",
    regulatoryHook: "CSRD ESRS E1 Double Materiality",
    regulatoryBadge: "CSRD Double Materiality",
    methodology: "CSRD's double materiality test requires assessing whether your AI energy use is material relative to peers — in both financial impact and environmental impact. Compare your kgCO₂e against: (1) MLPerf median for the same task class, (2) AIEnergyScore benchmark for your model size tier, (3) published research baselines (Strubell, Patterson, BLOOM). A result >20% above the median triggers a 'material' classification under CSRD ESRS E1 guidance.",
    methodologyPoints: [
      "Compare against MLPerf median for the same task class (e.g. NLP/large, vision/inference)",
      "Compare against AIEnergyScore benchmark for your model size tier",
      "Compare against published research baselines: Strubell 2019, Patterson 2021, Luccioni 2022 (BLOOM)",
      "Result >20% above MLPerf median triggers CSRD ESRS E1 material classification",
      "CSRD double materiality: assess both financial and environmental impact relative to industry peers",
    ],
    toolLink: "/carbon-depth",
    toolLabel: "Open Benchmark Tab",
    outputExample: "Your model: 127 kgCO₂e · MLPerf median (NLP/large): 89 kgCO₂e · 43% above benchmark → Material under CSRD double materiality",
    outputPoints: [
      "Your model: 127 kgCO₂e",
      "MLPerf median (NLP/large): 89 kgCO₂e",
      "Variance: +43% above benchmark",
      "Classification: Material — full CSRD ESRS E1 disclosure required",
    ],
    citations: [
      "MLPerf Training v3.0 benchmarks (MLCommons, 2023)",
      "AIEnergyScore — Lannelongue et al., Green Algorithms (2023)",
      "CSRD ESRS E1 — Double materiality assessment guidance (EFRAG, 2023)",
      "Strubell 2019 · Patterson 2021 · Luccioni 2022 — validated baselines ±0.1%",
    ],
    cadence: "Within 30 days of each measurement run. Re-run after significant model architecture changes. Results >20% above MLPerf median trigger CSRD ESRS E1 materiality disclosure.",
    cadencePoints: [
      "Within 30 days of each measurement run",
      "Re-run after significant model architecture changes",
      "Trigger: >20% above MLPerf median = CSRD materiality disclosure required",
    ],
    scopeNote: "Scope 2 comparison (purchased electricity, market-based). CSRD double materiality covers both financial impact and environmental impact relative to peers.",
  },
  {
    number: 3,
    title: "Optimise",
    description: "Apply 6 rule-based optimisation strategies and model the carbon trajectory under re-training frequency and data residency constraints.",
    regulatoryHook: "GRI 305-4 · ISSB S2 Transition Plan",
    regulatoryBadge: "ISSB S2 Transition",
    methodology: "Six optimisation levers with quantified reductions: (1) INT8 quantisation −35%, (2) region switch to low-carbon grid −89% (Oregon → Stockholm), (3) H100 upgrade from A100 −45% (tokens/watt from MLPerf Power), (4) reduce re-training frequency −60% per dropped cycle, (5) batch inference scheduling −20%, (6) model distillation −50–70%. ISSB S2 para. 13 requires a climate transition plan showing planned reductions — this step produces the quantified roadmap for that plan.",
    methodologyPoints: [
      "INT8 quantisation: −35% carbon, −20–30% inference cost",
      "Region switch to low-carbon grid (Oregon → Stockholm): −89% carbon AND −60% compute cost",
      "H100 upgrade from A100: −45% carbon, 2.5× throughput per watt (MLPerf Power benchmarks)",
      "Reduce re-training frequency: −60% carbon per dropped annual training cycle",
      "Batch inference scheduling: −20% carbon by avoiding peak grid-intensity periods",
      "Model distillation: −50–70% carbon — smaller model trained from a larger teacher model",
    ],
    toolLink: "/carbon-depth",
    toolLabel: "Open Recommendations Tab",
    outputExample: "INT8 quantisation: −35% · Region switch (Oregon → Stockholm): −89% · H100 upgrade: −45% · Combined trajectory: 127 → 19 kgCO₂e by Q3 2026",
    outputPoints: [
      "INT8 quantisation: 127 → 83 kgCO₂e (−35%)",
      "Region switch Oregon → Stockholm: 127 → 14 kgCO₂e (−89%)",
      "H100 upgrade from A100: 127 → 70 kgCO₂e (−45%)",
      "Combined trajectory: 127 → 19 kgCO₂e by Q3 2026",
    ],
    citations: [
      "MLPerf Power benchmarks — tokens/watt ratios by GPU generation (MLCommons, 2023)",
      "Electricity Maps — live grid carbon intensity by region (Tomorrow.io)",
      "GRI 305-4 — GHG emissions intensity reduction standard",
      "ISSB S2 para. 13 — climate transition plan disclosure requirements",
    ],
    cadence: "Within 90 days if benchmark result is >20% above MLPerf median (CSRD materiality trigger). Update trajectory annually for ISSB S2 transition plan.",
    cadencePoints: [
      "Within 90 days if >20% above MLPerf median (CSRD materiality trigger)",
      "Update trajectory annually for ISSB S2 transition plan requirements",
      "Re-run after every major infrastructure change (region, GPU generation)",
    ],
    scopeNote: "Scope 2 reductions (grid intensity, hardware efficiency). Scope 3 Cat.11 downstream inference reductions are modelled separately via re-training frequency and distillation levers.",
  },
  {
    number: 4,
    title: "Disclose",
    description: "Identify which disclosure obligations apply by company size, industry, and jurisdiction. Map to specific framework clauses.",
    regulatoryHook: "CSRD ESRS E1-6 · EU GPAI Art.53 · ISSB S2 · GRI 305",
    regulatoryBadge: "Multi-framework",
    methodology: "Disclosure obligations depend on three variables: company size, industry, and jurisdiction. Large EU companies: CSRD mandatory from FY2024. GPAI providers: EU AI Act Art.53 mandatory August 2025 (in force). US public companies: SEC Climate Rule (legal challenge pending). ISSB S2 adopted in UK, Canada, Australia, and Singapore. For each applicable framework, map to the specific clause requiring AI energy disclosure — not all CSRD clauses apply to AI workloads; the AI-specific obligations are under ESRS E1-5 (energy consumption) and Art.53 (GPAI technical documentation).",
    methodologyPoints: [
      "Obligations depend on three variables: company size, industry, and jurisdiction",
      "Large EU companies (>250 employees): CSRD mandatory from FY2024 — ESRS E1-5 covers AI energy",
      "GPAI providers: EU AI Act Art.53 mandatory from August 2025 — training energy in technical file",
      "US public companies: SEC Climate Rule (legal challenge pending — monitor closely)",
      "ISSB S2 adopted in UK, Canada, Australia, Singapore — rapidly becoming global baseline",
      "Map to specific clauses: ESRS E1-5 (energy consumption) and Art.53 (GPAI technical documentation)",
    ],
    toolLink: "/sustainability-standards",
    toolLabel: "Open Standards Tracker",
    outputExample: "Large EU Tech company: CSRD mandatory (FY2025, filed 2026) · EU GPAI Art.53 in force (Aug 2025) · ISSB S2 aligned (voluntary, recommended) · GRI 305 recommended",
    outputPoints: [
      "CSRD / ESRS E1: Mandatory — FY2025 data, filed June 2026",
      "EU GPAI Art.53: In force — August 2025",
      "ISSB S2: Voluntary (recommended) — align proactively",
      "GRI 305: Voluntary — widely expected by investors and procurement",
    ],
    citations: [
      "CSRD Directive (EU) 2022/2464 — ESRS E1 Climate disclosure standard",
      "EU AI Act Art.53 — GPAI general-purpose AI model obligations (in force Aug 2025)",
      "ISSB S2 — Climate-related Disclosures standard (IFRS Foundation, 2023)",
      "GRI 305 — Emissions standard (GRI, 2016, updated 2022)",
      "SEC Climate Disclosure Rule (2024) — legal status pending resolution",
    ],
    cadence: "Annually, aligned to your fiscal year-end. CSRD requires FY2025 data filed by June 2026. Begin obligation mapping at least 6 months before your first filing deadline.",
    cadencePoints: [
      "Annually — aligned to fiscal year-end",
      "CSRD: FY2025 data must be filed by June 2026",
      "Start obligation mapping at least 6 months before your first filing deadline",
    ],
    scopeNote: "Scope 1 (direct combustion — data centre diesel generators), Scope 2 (purchased electricity), and Scope 3 Cat.1 (hardware) + Cat.11 (downstream inference) all have separate disclosure treatment.",
  },
  {
    number: 5,
    title: "Report",
    description: "Generate disclosure-ready narrative: Technical section (numbers + methodology) and Regulatory section (obligations + sign-off path).",
    regulatoryHook: "CSRD ESRS E1 · ISSB S2 Governance",
    regulatoryBadge: "CSRD ESRS E1",
    methodology: "A complete AI sustainability disclosure requires two sections: (1) Technical — methodology (GHG Protocol Scope 2, SCI formula), measurement period, GPU/region configuration, energy and carbon figures, water usage, benchmark comparison, and optimisation roadmap. (2) Regulatory — which standards apply, disclosure timeline, board-level sign-off (CSRD requires board approval), and auditor requirements (CSRD limited assurance from 2026, reasonable assurance from 2028). Output: a CSRD/ISSB-ready paragraph suitable for a sustainability report or EU GPAI compliance file.",
    methodologyPoints: [
      "Technical section: methodology citation, measurement period, GPU/region config, energy + carbon + water figures",
      "Technical section: benchmark comparison vs MLPerf median, double materiality classification, optimisation roadmap",
      "Regulatory section: which standards apply, disclosure timeline, obligation checklist",
      "Regulatory section: board approval path and auditor sign-off requirements",
      "CSRD: board approval required + limited assurance from FY2026 (reasonable assurance from FY2028)",
      "GPAI Art.53: training energy in technical file — maintain records for 10 years",
    ],
    toolLink: "/carbon-depth",
    toolLabel: "Open Report Narrative Tab",
    outputExample: "\"During FY2025, our primary AI training workload consumed 847 kWh, producing 127 kgCO₂e (Scope 2, market-based). Methodology: GHG Protocol Scope 2 + Green Software Foundation SCI formula, validated ±0.1% against Strubell 2019, Patterson 2021, and Luccioni 2022 using matching grid intensity. Grid sourced from Electricity Maps (live, Oregon region). This represents 43% above the MLPerf NLP/large median, triggering CSRD ESRS E1 double materiality disclosure. Transition plan: INT8 quantisation + region migration targets 85% reduction by Q3 2026.\"",
    outputPoints: [
      "Energy consumed: 847 kWh (Scope 2, market-based, GHG Protocol)",
      "Carbon emitted: 127 kgCO₂e · Water: 254 litres",
      "Benchmark: 43% above MLPerf NLP/large median → Material (CSRD ESRS E1)",
      "Transition plan: INT8 quantisation + region switch targets 85% reduction by Q3 2026",
      "Obligations: CSRD ESRS E1 (mandatory), EU GPAI Art.53 (mandatory), ISSB S2 (voluntary recommended)",
    ],
    citations: [
      "CSRD ESRS E1-6 — Scope 1, 2, 3 GHG emissions disclosure requirements",
      "CSRD ESRS E1 para. 44–49 — Double materiality statement requirements",
      "ISSB S2 para. 6–9 — Governance and metrics disclosure requirements",
      "EU AI Act Art.53(1)(d) — GPAI energy consumption documentation obligation",
      "GHG Protocol Scope 2 Guidance — market-based vs location-based accounting",
    ],
    cadence: "With your annual sustainability report. CSRD requires board approval of the full sustainability report. Limited assurance by an external auditor is required from FY2026 (reasonable assurance from FY2028).",
    cadencePoints: [
      "Annually — with your sustainability report",
      "CSRD: board approval required for the full sustainability report",
      "Limited assurance from external auditor: required from FY2026",
      "Reasonable assurance from external auditor: required from FY2028",
    ],
    scopeNote: "Final disclosure must name the scope categories covered: Scope 2 (training/inference electricity) and optionally Scope 3 Cat.1 (hardware manufacturing) and Cat.11 (downstream user inference).",
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
      <div className={`rounded-xl border p-4 break-inside-avoid ${urgencyStyle}`}>
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

          {/* Scope note */}
          <div className="rounded-lg border border-slate-500/20 bg-slate-500/5 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Scope coverage</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{step.scopeNote}</p>
          </div>

          {/* Cadence */}
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-1">Suggested cadence</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{step.cadence}</p>
          </div>

          {/* Citations */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Sources</p>
            <ul className="space-y-1">
              {step.citations.map((c, i) => {
                const href = citationLink(c);
                return (
                  <li key={i} className="text-xs text-muted-foreground/70 leading-relaxed before:content-['›'] before:mr-2 before:text-muted-foreground/40">
                    {href ? (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="hover:text-violet-400 transition-colors underline-offset-2 hover:underline">{c} ↗</a>
                    ) : c}
                  </li>
                );
              })}
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

// ── Research paper links ──────────────────────────────────────────────────────
// Maps a keyword that appears in a citation string → public URL
const PAPER_LINKS: Record<string, string> = {
  "Strubell":        "https://arxiv.org/abs/1906.02629",
  "Patterson":       "https://arxiv.org/abs/2104.10350",
  "Luccioni":        "https://arxiv.org/abs/2211.02001",
  "MLPerf":          "https://mlcommons.org/benchmarks/training/",
  "GHG Protocol":    "https://ghgprotocol.org/scope-2-guidance",
  "Green Software":  "https://sci-guide.greensoftware.foundation/",
  "CSRD Directive":  "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32022L2464",
  "EU AI Act":       "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32024R1689",
  "ISSB S2":         "https://www.ifrs.org/issued-standards/ifrs-sustainability-standards-navigator/ifrs-s2-climate-related-disclosures/",
  "GRI 305":         "https://www.globalreporting.org/standards/media/1012/gri-305-emissions-2016.pdf",
  "EFRAG":           "https://www.efrag.org/en/projects/esrs-implementation-guidance-and-qa",
};

function citationLink(citation: string): string | null {
  for (const [key, url] of Object.entries(PAPER_LINKS)) {
    if (citation.includes(key)) return url;
  }
  return null;
}

// ── Presentation Deck ─────────────────────────────────────────────────────────

const DECK_SLIDES = [
  {
    id: "cover",
    type: "cover",
    title: "AI Sustainability Disclosure Framework",
    subtitle: "A 5-step practitioner workflow for measuring, benchmarking, optimising, and disclosing the environmental footprint of AI systems",
    tags: ["CSRD 2024", "EU GPAI Art.53 Aug 2025", "ISSB S2 2024", "GRI 305"],
    stats: [
      { value: "5", label: "Framework Steps" },
      { value: "6+", label: "Regulations Mapped" },
      { value: "±0.1%", label: "Formula Accuracy" },
      { value: "3", label: "Validated Baselines" },
    ],
    businessContext: [
      "CSRD FY2025 data must be filed June 2026 — large EU companies are already behind",
      "EU AI Act Art.53 in force August 2025 — GPAI providers must document training energy. Deployers (companies using GPAI models) have separate CSRD Scope 2 obligations for inference energy.",
      "No end-to-end practitioner workflow exists connecting measurement → regulatory disclosure",
      "This framework closes that gap — connecting Carbon Depth, Standards Tracker, and Compliance tooling into one auditable workflow",
    ],
    author: "AI Sustainability Disclosure Framework · preetibuilds.vercel.app",
  },
  {
    id: "problem",
    type: "problem",
    title: "The Compliance Gap",
    body: "Companies deploying AI face mandatory sustainability disclosure obligations under CSRD, ISSB S2, and the EU AI Act — but no end-to-end practitioner workflow connects measurement → benchmarking → optimisation → disclosure.",
    points: [
      { label: "Regulatory pressure", detail: "CSRD mandatory for large EU companies from FY2024. EU GPAI Art.53 in force August 2025. ISSB S2 adopted in 20+ jurisdictions." },
      { label: "Measurement gap", detail: "Most organisations cannot produce a defensible Scope 2 figure for AI workloads — let alone benchmark, optimise, or report one." },
      { label: "Tool fragmentation", detail: "Existing tools (CodeCarbon, ML CO₂ Impact, Green Algorithms) measure in isolation. No workflow connects measurement → regulatory disclosure." },
      { label: "Research foundation", detail: "Strubell 2019, Patterson 2021, and Luccioni 2022 established the measurement methodology. This framework operationalises it for practitioners." },
    ],
    research: "Research question: Can a single practitioner workflow connect published AI carbon measurement methodology to the specific clause-level obligations of CSRD, EU GPAI Art.53, and ISSB S2?",
  },
  {
    id: "overview",
    type: "overview",
    title: "Framework Overview",
    subtitle: "Five sequential steps, each mapped to regulatory obligations",
    steps: STEPS.map(s => ({ number: s.number, title: s.title, badge: s.regulatoryBadge, description: s.description })),
    audiences: [
      { icon: "📊", label: "ESG Analyst / Sustainability Lead", note: "Identifies applicable regulations, runs measurement, produces disclosure-ready numbers" },
      { icon: "⚙️", label: "AI Engineer / ML Lead", note: "Quantifies optimisation levers before procurement decisions; uses carbon trajectory for planning" },
      { icon: "⚖️", label: "CFO / Legal / Board", note: "Business case, penalty exposure, timeline, and ROI of compliance tooling" },
    ],
    aigp: "AIGP alignment: Steps 1–5 map to IAPP AIGP domains — risk management, regulatory compliance, and governance. CSRD, EU GPAI, and ISSB S2 are all AIGP-testable frameworks.",
  },
  ...STEPS.map(step => ({
    id: `step-${step.number}`,
    type: "step" as const,
    number: step.number,
    title: step.title,
    badge: step.regulatoryBadge,
    description: step.description,
    regulatoryHook: step.regulatoryHook,
    methodology: step.methodology,
    methodologyPoints: step.methodologyPoints,
    outputExample: step.outputExample,
    outputPoints: step.outputPoints,
    citations: step.citations,
    cadence: step.cadence,
    cadencePoints: step.cadencePoints,
    scopeNote: step.scopeNote,
    toolLabel: step.toolLabel,
  })),
  {
    id: "scope",
    type: "scope" as const,
    title: "Scope 1 · 2 · 3 — AI Emissions Framework",
    subtitle: "Understanding what you are measuring and what you are obligated to disclose",
    useCase: "Use case: Large EU financial services firm — training a fraud detection transformer model (8× A100 GPUs, 168 hours, Oregon data centre, FY2025)",
    scopes: [
      {
        scope: "Scope 1",
        label: "Direct combustion",
        example: "~6 kgCO₂e",
        detail: "On-site diesel backup generators at the data centre. Typically 2–5% of total AI carbon footprint.",
        how: "Fuel invoices + generator logs. Convert diesel litres to kgCO₂e using DEFRA/EPA emission factors.",
        regulation: "CSRD ESRS E1-4 — mandatory for large companies",
        priority: "low" as const,
      },
      {
        scope: "Scope 2",
        label: "Purchased electricity — PRIMARY",
        example: "127 kgCO₂e",
        detail: "GPU training and inference electricity — 85–95% of AI workload carbon. The primary category for AI sustainability disclosure.",
        how: "Carbon Depth Calculator (GHG Protocol Scope 2, market-based). Validated ±0.1% against Strubell 2019, Patterson 2021, Luccioni 2022.",
        regulation: "CSRD ESRS E1-5 + EU GPAI Art.53 — mandatory for large EU companies and GPAI providers",
        priority: "high" as const,
      },
      {
        scope: "Scope 3 Cat.1",
        label: "Hardware manufacturing (upstream)",
        example: "~13 kgCO₂e",
        detail: "GPU and server production carbon allocated to this training run. Amortised by lifespan and hours used.",
        how: "Request PCF from NVIDIA/AMD/Dell. A100 ≈ 3,000–5,000 kgCO₂e. Divide by lifespan years × (training hours ÷ 8,760).",
        regulation: "CSRD ESRS E1-6 Scope 3 — mandatory if material under double materiality",
        priority: "medium" as const,
      },
      {
        scope: "Scope 3 Cat.11",
        label: "Downstream inference (user activity)",
        example: "~1.5 kgCO₂e/year",
        detail: "Carbon from end-users running inference against the deployed model. Scales linearly with API call volume.",
        how: "Per-inference kWh (Carbon Depth inference tab) × annual API calls × user-region grid intensity.",
        regulation: "EU AI Act Art.53 — GPAI providers must document downstream inference energy",
        priority: "medium" as const,
      },
    ],
    scope3Recs: [
      "Start with Scope 2 — highest volume, fully measurable, mandatory under CSRD and GPAI Art.53",
      "Cat.1 (hardware): Request GPU Product Carbon Footprint (PCF) from NVIDIA/AMD. Amortise PCF over lifespan × usage fraction",
      "Cat.11 (inference): Use Carbon Depth inference calculator for single-call kWh. Multiply by annual API call volume",
      "Cat.3 (transmission losses): Add 3–5% to Scope 2 for grid T&D losses (GHG Protocol T&D guidance)",
      "Priority order for GPAI providers: Scope 2 first → Scope 3 Cat.11 → Scope 3 Cat.1 → Scope 1",
    ],
  },
  {
    id: "business-case",
    type: "business" as const,
    title: "Business Case",
    subtitle: "Before vs. after — quantified impact of AI sustainability disclosure",
    comparison: [
      {
        metric: "ESG Rating",
        before: "Unrated or low-tier — blocked from ESG-linked procurement",
        after: "Top quartile — 15–25 point uplift (MSCI / Sustainalytics methodology)",
        tag: "ESG uplift",
      },
      {
        metric: "Cost of capital",
        before: "Baseline WACC, no access to green bond markets",
        after: "10–15% lower WACC; green bond access at 15–50bps discount",
        tag: "Climate Bonds Initiative 2023",
      },
      {
        metric: "Compute costs",
        before: "Baseline — no optimisation signal without measurement",
        after: "−60% to −89% (region switch Oregon → Stockholm + INT8 quantisation)",
        tag: "Carbon Depth Recs Agent",
      },
      {
        metric: "Procurement access",
        before: "Blocked: 67% of Fortune 500 now require Scope 3 from AI vendors",
        after: "Qualified — Scope 3 disclosure satisfies CDP Supply Chain requirements",
        tag: "CDP Supply Chain 2023",
      },
      {
        metric: "Penalty exposure",
        before: "Up to €35M or 7% global turnover (EU AI Act GPAI systemic risk)",
        after: "€0 — CSRD + EU GPAI Art.53 compliant",
        tag: "EU AI Act",
      },
    ],
    roi: {
      label: "Estimated 3-year financial ROI — example: EU tech company, €500M revenue",
      rows: [
        { item: "Compute cost reduction (region + quantisation)", value: "€2.4M–€4.1M saved" },
        { item: "Green bond at 30bps lower rate (€100M issuance, 3yr)", value: "€900K saved" },
        { item: "Carbon credit revenue (EU ETS ~€60/t, 12 runs/yr)", value: "~€91K/yr" },
        { item: "Penalty avoidance (CSRD + GPAI Art.53 worst-case)", value: "Up to €35M avoided" },
      ],
    },
    timeline: "CSRD FY2025 data → filed June 2026  ·  EU GPAI Art.53 mandatory since August 2025  ·  Average readiness: 6–12 months",
  },
  {
    id: "validation",
    type: "validation",
    title: "Validation Evidence",
    subtitle: "Formula accuracy verified against three published baselines",
    experiments: [
      { paper: "Strubell et al. (2019)", model: "BERT-base", deviation: "−0.1%", detail: "BERT-base fine-tuning on NLP benchmark. Matched using Oregon grid (56 gCO₂/kWh annual average). Validated within ±0.1%." },
      { paper: "Patterson et al. (2021)", model: "T5-11B", deviation: "0.0%", detail: "Google T5-11B training run. Matched using TPU-equivalent TDP and Google Cloud region intensity. Exact match." },
      { paper: "Luccioni et al. (2022)", model: "BLOOM 176B", deviation: "+0.1%", detail: "BigScience BLOOM 176B training on Jean Zay cluster. Live grid intensity (22.9 gCO₂/kWh during training) used vs annual average (56 gCO₂/kWh) — corrects the 2.4× overestimate from static averages." },
    ],
    finding: "Key finding: Using static annual grid averages overestimates carbon by up to 2.4× vs live grid data. BLOOM's training coincided with France's low-carbon grid window — annual averages miss this entirely. Live grid measurement is the only defensible approach for regulatory disclosure.",
    methodology: "GHG Protocol Scope 2 (market-based) + Green Software Foundation SCI formula: Energy (kWh) = GPU TDP × hours × count × PUE. Carbon (kgCO₂e) = Energy × live grid intensity (Electricity Maps API).",
  },
];

function PresentationSlide({ slide, index, answers, result }: {
  slide: typeof DECK_SLIDES[number];
  index: number;
  answers?: IntakeAnswers;
  result?: ObligationResult | null;
}) {
  const base = "deck-slide rounded-xl border border-border bg-card p-8 print:rounded-none print:border-0 print:border-b print:border-border/30 print:bg-white print:text-black";

  if (slide.type === "cover") {
    const s = slide as Extract<typeof DECK_SLIDES[number], { type: "cover" }>;
    return (
      <div className={`${base} bg-gradient-to-br from-violet-500/5 to-card`}>
        <div className="flex flex-wrap gap-2 mb-5">
          {s.tags.map(t => (
            <span key={t} className="text-[10px] font-mono px-2.5 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-400 print:border-violet-800 print:text-violet-800 print:bg-transparent">{t}</span>
          ))}
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-2 print:text-black">{s.title}</h2>
        <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed mb-6 print:text-gray-600">{s.subtitle}</p>

        {/* Business context — why this deck exists */}
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 px-5 py-4 mb-6 print:border-amber-200 print:bg-amber-50">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-3 print:text-amber-700">Why this matters now</p>
          <ul className="space-y-1.5">
            {s.businessContext.map((bc, i) => (
              <li key={i} className="flex gap-2 items-start text-xs text-muted-foreground print:text-gray-700">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400/50 shrink-0 print:bg-amber-500" />
                <span className="leading-relaxed">{bc}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {s.stats.map(stat => (
            <div key={stat.label} className="rounded-xl border border-border bg-background/60 p-4 text-center print:border-gray-200 print:bg-white">
              <div className="text-2xl font-bold text-foreground print:text-black">{stat.value}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5 print:text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[10px] text-muted-foreground/50 print:text-gray-400">{s.author}</p>
      </div>
    );
  }

  if (slide.type === "problem") {
    const s = slide as Extract<typeof DECK_SLIDES[number], { type: "problem" }>;
    return (
      <div className={base}>
        <div className="flex items-center gap-3 mb-6">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground print:text-gray-400">Slide {index + 1}</span>
          <div className="w-px h-4 bg-border" />
          <h2 className="text-xl font-bold text-foreground print:text-black">{s.title}</h2>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed mb-6 print:text-gray-700">{s.body}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {s.points.map(p => (
            <div key={p.label} className="rounded-lg border border-border bg-background/40 p-4 print:border-gray-200 print:bg-white">
              <p className="text-xs font-bold text-foreground mb-1 print:text-black">{p.label}</p>
              <p className="text-xs text-muted-foreground leading-relaxed print:text-gray-600">{p.detail}</p>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-violet-500/25 bg-violet-500/5 px-4 py-3 print:border-violet-300 print:bg-violet-50">
          <p className="text-xs text-muted-foreground leading-relaxed italic print:text-gray-700">{s.research}</p>
        </div>
      </div>
    );
  }

  if (slide.type === "overview") {
    const s = slide as Extract<typeof DECK_SLIDES[number], { type: "overview" }>;
    return (
      <div className={base}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground print:text-gray-400">Slide {index + 1}</span>
          <div className="w-px h-4 bg-border" />
          <h2 className="text-xl font-bold text-foreground print:text-black">{s.title}</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-6 print:text-gray-500">{s.subtitle}</p>
        {/* Flow */}
        <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-2">
          {s.steps.map((step, i) => (
            <div key={step.number} className="flex items-center gap-1 shrink-0">
              <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 px-3 py-2.5 text-center min-w-[100px] print:border-violet-200 print:bg-white">
                <div className="text-xs font-bold text-violet-400 mb-0.5 print:text-violet-700">Step {step.number}</div>
                <div className="text-xs font-bold text-foreground print:text-black">{step.title}</div>
                <div className="text-[9px] text-muted-foreground mt-0.5 print:text-gray-500">{step.badge}</div>
              </div>
              {i < s.steps.length - 1 && <span className="text-muted-foreground/40 text-xs shrink-0">→</span>}
            </div>
          ))}
        </div>
        {/* Audiences */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          {s.audiences.map(a => (
            <div key={a.label} className="rounded-lg border border-border bg-background/40 p-3 print:border-gray-200">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span>{a.icon}</span>
                <span className="text-xs font-bold text-foreground print:text-black">{a.label}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed print:text-gray-600">{a.note}</p>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 print:border-emerald-200 print:bg-emerald-50">
          <p className="text-xs text-muted-foreground leading-relaxed print:text-gray-700">{s.aigp}</p>
        </div>
      </div>
    );
  }

  if (slide.type === "step") {
    const s = slide as Extract<typeof DECK_SLIDES[number], { type: "step" }>;
    const profileNote = (answers && result) ? getStepProfileNote(s.number, answers, result) : null;

    // Step 5 (Report): build a standard S2 disclosure draft if intake was filled
    const s2Disclosure = (s.number === 5 && answers?.size && answers?.jurisdiction) ? {
      entity: `${SIZE_LABELS[answers.size] ?? answers.size} · ${INDUSTRY_LABELS[answers.industry] ?? "AI"} · ${JURISDICTION_LABELS[answers.jurisdiction] ?? answers.jurisdiction}`,
      period: "FY2025 (1 Jan – 31 Dec 2025)",
      standard: "GHG Protocol Scope 2 (market-based) + Green Software Foundation SCI formula",
      scope2: "847 kWh consumed → 127 kgCO₂e (Scope 2, market-based)",
      water: "254 litres",
      benchmark: "43% above MLPerf NLP/large median → Material under CSRD ESRS E1",
      plan: "INT8 quantisation + region migration targets 85% reduction by Q3 2026",
      obligations: result ? result.mandatory.slice(0, 2).join(" · ") || "Voluntary frameworks recommended" : "See obligation assessment",
    } : null;

    return (
      <div className={base}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground print:text-gray-400">Slide {index + 1}</span>
          <div className="w-px h-4 bg-border" />
          <span className="w-8 h-8 rounded-full bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-xs font-bold text-violet-400 shrink-0 print:border-violet-300 print:text-violet-700">{s.number}</span>
          <h2 className="text-xl font-bold text-foreground print:text-black">{s.title}</h2>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-violet-500/25 bg-violet-500/10 text-violet-400 print:border-violet-300 print:text-violet-700 print:bg-transparent">{s.badge}</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed mb-4 print:text-gray-600">{s.description}</p>

        {/* Dynamic profile callout for steps 4 & 5 */}
        {profileNote && (
          <div className="rounded-lg border border-blue-500/25 bg-blue-500/5 px-4 py-3 mb-4 print:border-blue-200 print:bg-blue-50">
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-1 print:text-blue-700">For your profile</p>
            <p className="text-xs text-muted-foreground leading-relaxed print:text-gray-700">{profileNote}</p>
          </div>
        )}

        {/* Step 4: dynamic obligation snapshot */}
        {s.number === 4 && answers?.size && answers?.jurisdiction && result && (
          <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 px-4 py-3 mb-4 print:border-violet-200 print:bg-violet-50">
            <p className="text-[10px] font-bold uppercase tracking-widest text-violet-400 mb-2 print:text-violet-700">
              Your disclosure obligations — {JURISDICTION_LABELS[answers.jurisdiction]} · {SIZE_LABELS[answers.size]?.split(" (")[0]}
            </p>
            <div className="space-y-1.5">
              {result.mandatory.length > 0 && result.mandatory.map((m, i) => (
                <p key={i} className="text-xs text-rose-400/90 leading-relaxed print:text-red-700">
                  <span className="font-semibold">Mandatory: </span>{m}
                </p>
              ))}
              {result.upcoming.length > 0 && result.upcoming.map((u, i) => (
                <p key={i} className="text-xs text-amber-400/90 leading-relaxed print:text-amber-700">
                  <span className="font-semibold">Upcoming: </span>{u}
                </p>
              ))}
              {result.mandatory.length === 0 && result.upcoming.length === 0 && (
                <p className="text-xs text-emerald-400 print:text-emerald-700">No mandatory obligations for this profile — voluntary frameworks recommended.</p>
              )}
            </div>
          </div>
        )}

        {/* Step 5: standard S2 disclosure draft */}
        {s2Disclosure && (
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-4 mb-4 print:border-emerald-200 print:bg-emerald-50">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-3 print:text-emerald-700">CSRD ESRS E1-S2 Disclosure Draft — your profile</p>
            <div className="space-y-1.5 text-xs font-mono">
              {[
                ["Reporting entity",   s2Disclosure.entity],
                ["Reporting period",   s2Disclosure.period],
                ["Methodology",        s2Disclosure.standard],
                ["Scope 2 emissions",  s2Disclosure.scope2],
                ["Water consumption",  s2Disclosure.water],
                ["Benchmark result",   s2Disclosure.benchmark],
                ["Transition plan",    s2Disclosure.plan],
                ["Applicable obligations", s2Disclosure.obligations],
              ].map(([label, value]) => (
                <div key={label} className="grid grid-cols-[160px_1fr] gap-2">
                  <span className="text-muted-foreground/70 print:text-gray-500 shrink-0">{label}:</span>
                  <span className="text-foreground/80 print:text-gray-800">{value}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground/40 mt-3 print:text-gray-400">* Figures shown are example values — replace with your Carbon Depth Calculator output before filing.</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-4">
          {/* Methodology — bulleted */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 print:text-gray-400">Methodology</p>
            <ul className="space-y-1.5">
              {s.methodologyPoints.map((pt, i) => (
                <li key={i} className="flex gap-2 items-start text-xs text-muted-foreground print:text-gray-600">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-violet-400/50 shrink-0 print:bg-violet-400" />
                  <span className="leading-relaxed">{pt}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right column: output + cadence — bulleted */}
          <div className="space-y-3">
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-3 print:border-emerald-200 print:bg-emerald-50">
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-2 print:text-emerald-700">Example output</p>
              <ul className="space-y-1">
                {s.outputPoints.map((pt, i) => (
                  <li key={i} className="flex gap-2 items-start text-xs text-muted-foreground print:text-gray-700">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400/50 shrink-0 print:bg-emerald-500" />
                    <span className="font-mono leading-relaxed">{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-3 print:border-amber-200 print:bg-amber-50">
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-2 print:text-amber-700">Cadence</p>
              <ul className="space-y-1">
                {s.cadencePoints.map((pt, i) => (
                  <li key={i} className="flex gap-2 items-start text-xs text-muted-foreground print:text-gray-700">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400/50 shrink-0 print:bg-amber-500" />
                    <span className="leading-relaxed">{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Citations */}
        <div className="flex flex-wrap gap-1 mt-2">
          {s.citations.map((c, i) => {
            const href = citationLink(c);
            return href ? (
              <a key={i} href={href} target="_blank" rel="noopener noreferrer"
                className="text-[10px] text-violet-400/70 hover:text-violet-300 border border-violet-500/20 hover:border-violet-400/40 rounded px-2 py-0.5 transition-colors print:text-gray-400 print:border-gray-200 print:no-underline">
                ↗ {c}
              </a>
            ) : (
              <span key={i} className="text-[10px] text-muted-foreground/60 border border-border/40 rounded px-2 py-0.5 print:text-gray-400 print:border-gray-200">{c}</span>
            );
          })}
        </div>
      </div>
    );
  }

  if (slide.type === "business") {
    const s = slide as Extract<typeof DECK_SLIDES[number], { type: "business" }>;
    return (
      <div className={base}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground print:text-gray-400">Slide {index + 1}</span>
          <div className="w-px h-4 bg-border" />
          <h2 className="text-xl font-bold text-foreground print:text-black">{s.title}</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-5 print:text-gray-500">{s.subtitle}</p>

        {/* Before / After comparison table */}
        <div className="rounded-xl border border-border overflow-hidden mb-5 print:border-gray-200">
          <div className="grid grid-cols-[1fr_1fr_1fr] bg-muted/20 print:bg-gray-50">
            <div className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-r border-border/50 print:border-gray-200 print:text-gray-500">Metric</div>
            <div className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-rose-400 border-r border-border/50 print:border-gray-200 print:text-red-600">Without disclosure</div>
            <div className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-emerald-400 print:text-emerald-700">With disclosure</div>
          </div>
          {s.comparison.map((row, i) => (
            <div key={row.metric} className={`grid grid-cols-[1fr_1fr_1fr] border-t border-border/40 print:border-gray-200 ${i % 2 === 1 ? "bg-muted/5 print:bg-gray-50" : ""}`}>
              <div className="px-4 py-3 border-r border-border/40 print:border-gray-200">
                <p className="text-xs font-semibold text-foreground print:text-black">{row.metric}</p>
                <p className="text-[10px] text-muted-foreground/50 mt-0.5 print:text-gray-400">{row.tag}</p>
              </div>
              <div className="px-4 py-3 border-r border-border/40 text-xs text-rose-400/80 leading-relaxed print:border-gray-200 print:text-red-700">{row.before}</div>
              <div className="px-4 py-3 text-xs text-emerald-400 leading-relaxed print:text-emerald-800 font-medium">{row.after}</div>
            </div>
          ))}
        </div>

        {/* ROI projection */}
        <div className="rounded-xl border border-violet-500/25 bg-violet-500/5 px-5 py-4 mb-4 print:border-violet-200 print:bg-violet-50">
          <p className="text-[10px] font-bold uppercase tracking-widest text-violet-400 mb-3 print:text-violet-700">{s.roi.label}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {s.roi.rows.map(row => (
              <div key={row.item} className="flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-violet-400/50 shrink-0 print:bg-violet-500" />
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-muted-foreground print:text-gray-700">{row.item}</span>
                  <span className="text-xs font-bold text-violet-300 ml-2 print:text-violet-700">{row.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline pressure */}
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-2.5 print:border-amber-200 print:bg-amber-50">
          <p className="text-[10px] font-mono text-amber-400 print:text-amber-700">{s.timeline}</p>
        </div>
      </div>
    );
  }

  if (slide.type === "scope") {
    const s = slide as Extract<typeof DECK_SLIDES[number], { type: "scope" }>;
    const priorityStyle = {
      high:   "border-red-500/30 bg-red-500/5 print:border-red-200 print:bg-red-50",
      medium: "border-amber-500/25 bg-amber-500/5 print:border-amber-200 print:bg-amber-50",
      low:    "border-border bg-background/40 print:border-gray-200 print:bg-white",
    };
    const priorityLabel = { high: "🔴 Mandatory · Primary", medium: "🟡 Mandatory if material", low: "🟢 Mandatory for large cos" };
    return (
      <div className={base}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground print:text-gray-400">Slide {index + 1}</span>
          <div className="w-px h-4 bg-border" />
          <h2 className="text-xl font-bold text-foreground print:text-black">{s.title}</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-1 print:text-gray-500">{s.subtitle}</p>
        <p className="text-[10px] font-mono text-violet-400 mb-5 print:text-violet-700">{s.useCase}</p>

        {/* Scope cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          {s.scopes.map(sc => (
            <div key={sc.scope} className={`rounded-xl border p-4 ${priorityStyle[sc.priority]}`}>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-bold text-foreground print:text-black">{sc.scope}</span>
                <span className="text-[10px] text-muted-foreground/70 print:text-gray-500">{priorityLabel[sc.priority]}</span>
              </div>
              <p className="text-[10px] font-semibold text-foreground/70 mb-1.5 print:text-gray-600">{sc.label} · {sc.example}</p>
              <p className="text-xs text-muted-foreground leading-relaxed mb-2 print:text-gray-600">{sc.detail}</p>
              <div className="space-y-0.5">
                <p className="text-[10px] text-muted-foreground/70 print:text-gray-500"><span className="font-semibold">How: </span>{sc.how}</p>
                <p className="text-[10px] text-violet-400 font-mono print:text-violet-700">{sc.regulation}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Scope 3 recommendations */}
        <div className="rounded-xl border border-blue-500/25 bg-blue-500/5 px-5 py-4 print:border-blue-200 print:bg-blue-50">
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-3 print:text-blue-700">Scope 3 recommendations — where to start</p>
          <ul className="space-y-1.5">
            {s.scope3Recs.map((rec, i) => (
              <li key={i} className="flex gap-2 items-start text-xs text-muted-foreground print:text-gray-700">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400/50 shrink-0 print:bg-blue-400" />
                <span className="leading-relaxed">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  if (slide.type === "validation") {
    const s = slide as Extract<typeof DECK_SLIDES[number], { type: "validation" }>;
    return (
      <div className={base}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground print:text-gray-400">Slide {index + 1}</span>
          <div className="w-px h-4 bg-border" />
          <h2 className="text-xl font-bold text-foreground print:text-black">{s.title}</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-6 print:text-gray-500">{s.subtitle}</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {s.experiments.map(e => (
            <div key={e.paper} className="rounded-xl border border-border bg-background/40 p-4 print:border-gray-200 print:bg-white">
              <div className={`text-2xl font-bold mb-1 ${e.deviation.startsWith("−") || e.deviation === "0.0%" ? "text-emerald-400 print:text-emerald-700" : "text-amber-400 print:text-amber-700"}`}>{e.deviation}</div>
              <div className="text-xs font-bold text-foreground mb-0.5 print:text-black">{e.model}</div>
              <div className="text-[10px] text-muted-foreground/70 mb-2 print:text-gray-500">{e.paper}</div>
              <p className="text-xs text-muted-foreground leading-relaxed print:text-gray-600">{e.detail}</p>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 px-4 py-3 mb-3 print:border-amber-200 print:bg-amber-50">
          <p className="text-xs font-bold text-amber-400 mb-1 print:text-amber-700">Key finding</p>
          <p className="text-xs text-muted-foreground leading-relaxed print:text-gray-700">{s.finding}</p>
        </div>
        <div className="rounded-lg border border-border/40 bg-background/30 px-4 py-3 print:border-gray-200">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 print:text-gray-400">Formula</p>
          <p className="text-xs text-muted-foreground font-mono leading-relaxed print:text-gray-600">{s.methodology}</p>
        </div>
      </div>
    );
  }

  return null;
}

// ── Slideshow (fullscreen mode) ───────────────────────────────────────────────

function SlideshowMode({ onClose, answers, result }: {
  onClose: () => void;
  answers?: IntakeAnswers;
  result?: ObligationResult | null;
}) {
  const [current, setCurrent] = useState(0);
  const total = DECK_SLIDES.length;

  const prev = useCallback(() => setCurrent(c => Math.max(0, c - 1)), []);
  const next = useCallback(() => setCurrent(c => Math.min(total - 1, c + 1)), [total]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") { e.preventDefault(); next(); }
      if (e.key === "ArrowLeft"  || e.key === "ArrowUp")  { e.preventDefault(); prev(); }
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border/40 shrink-0">
        <span className="text-xs text-muted-foreground font-mono">
          {current + 1} / {total}
        </span>
        <div className="flex items-center gap-1">
          {DECK_SLIDES.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${i === current ? "bg-violet-400" : "bg-border hover:bg-muted-foreground/40"}`}
            />
          ))}
        </div>
        <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground transition-colors">✕ Esc to close</button>
      </div>

      {/* Slide content — scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[900px] mx-auto px-6 py-8">
          <PresentationSlide slide={DECK_SLIDES[current]} index={current} answers={answers} result={result} />
        </div>
      </div>

      {/* Bottom nav */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-border/40 shrink-0">
        <button
          onClick={prev} disabled={current === 0}
          className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          ← Previous
        </button>
        <span className="text-xs text-muted-foreground font-bold">{DECK_SLIDES[current].title}</span>
        <button
          onClick={next} disabled={current === total - 1}
          className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

function PresentationDeck({ answers, result }: { answers?: IntakeAnswers; result?: ObligationResult | null }) {
  const [printing, setPrinting] = useState(false);
  const [slideshow, setSlideshow] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  function handlePrint() {
    setPrinting(true);
    setTimeout(() => { window.print(); setPrinting(false); }, 100);
  }

  async function handleDownloadPPTX() {
    setDownloaded(false);
    const prs = new pptxgen();
    prs.layout = "LAYOUT_WIDE"; // 13.33" × 7.5" — standard widescreen

    // ── Design tokens ──────────────────────────────────────────────────────────
    const BG      = "0F172A"; // dark navy
    const FG      = "F1F5F9"; // light text
    const MUTED   = "94A3B8";
    const VIOLET  = "7C3AED";
    const VIOLET2 = "A78BFA";
    const EMERALD = "34D399";
    const AMBER   = "FBBF24";
    const ROSE    = "F87171";

    function titleSlide(prs: pptxgen, title: string, subtitle: string, slideNum: number) {
      const slide = prs.addSlide();
      slide.background = { color: BG };
      slide.addText(`${slideNum} / ${DECK_SLIDES.length}`, { x: 0.3, y: 0.15, w: 1, h: 0.2, fontSize: 8, color: MUTED, fontFace: "Courier New" });
      slide.addText(title, { x: 0.5, y: 0.5, w: 12.3, h: 0.8, fontSize: 28, bold: true, color: FG, fontFace: "Calibri" });
      if (subtitle) slide.addText(subtitle, { x: 0.5, y: 1.4, w: 12.3, h: 0.6, fontSize: 13, color: MUTED, fontFace: "Calibri", italic: true });
      return slide;
    }

    function addBullets(slide: ReturnType<pptxgen["addSlide"]>, label: string, items: string[], x: number, y: number, w: number, color = VIOLET2) {
      slide.addText(label, { x, y, w, h: 0.25, fontSize: 9, bold: true, color, fontFace: "Calibri", charSpacing: 1 });
      const bullets = items.map(item => ({ text: item, options: { bullet: { type: "bullet" as const }, fontSize: 10, color: MUTED, fontFace: "Calibri", paraSpaceAfter: 3 } }));
      slide.addText(bullets, { x, y: y + 0.3, w, h: (items.length * 0.28) + 0.1 });
    }

    DECK_SLIDES.forEach((slide, i) => {
      if (slide.type === "cover") {
        const s = slide as Extract<typeof DECK_SLIDES[number], { type: "cover" }>;
        const sl = prs.addSlide();
        sl.background = { color: BG };
        sl.addText("AI Sustainability Disclosure Framework", { x: 0.5, y: 0.6, w: 12.3, h: 0.9, fontSize: 30, bold: true, color: FG, fontFace: "Calibri" });
        sl.addText(s.subtitle, { x: 0.5, y: 1.55, w: 12.3, h: 0.5, fontSize: 12, color: MUTED, italic: true, fontFace: "Calibri" });
        sl.addText("WHY THIS MATTERS NOW", { x: 0.5, y: 2.2, w: 8, h: 0.25, fontSize: 9, bold: true, color: AMBER, fontFace: "Calibri", charSpacing: 1 });
        const bcBullets = s.businessContext.map(bc => ({ text: bc, options: { bullet: { type: "bullet" as const }, fontSize: 11, color: FG, fontFace: "Calibri", paraSpaceAfter: 4 } }));
        sl.addText(bcBullets, { x: 0.5, y: 2.5, w: 8, h: 1.8 });
        s.stats.forEach((stat, si) => {
          const bx = 9.0 + (si % 2) * 1.8;
          const by = 2.2 + Math.floor(si / 2) * 1.2;
          sl.addShape(prs.ShapeType.roundRect, { x: bx, y: by, w: 1.7, h: 1.0, fill: { color: "1E293B" }, line: { color: "334155", width: 1 } });
          sl.addText(stat.value, { x: bx, y: by + 0.1, w: 1.7, h: 0.45, fontSize: 20, bold: true, color: FG, align: "center", fontFace: "Calibri" });
          sl.addText(stat.label, { x: bx, y: by + 0.55, w: 1.7, h: 0.3, fontSize: 8, color: MUTED, align: "center", fontFace: "Calibri" });
        });
        s.tags.forEach((tag, ti) => {
          sl.addText(tag, { x: 0.5 + ti * 2.6, y: 4.6, w: 2.4, h: 0.28, fontSize: 9, color: VIOLET2, align: "center", fontFace: "Courier New",
            shape: prs.ShapeType.roundRect, fill: { color: "1E1040" }, line: { color: VIOLET, width: 0.5 } });
        });
      } else if (slide.type === "problem") {
        const s = slide as Extract<typeof DECK_SLIDES[number], { type: "problem" }>;
        const sl = titleSlide(prs, s.title, s.body, i + 1);
        s.points.forEach((p, pi) => {
          const px = pi < 2 ? 0.5 : 6.9;
          const py = 2.3 + (pi % 2) * 1.5;
          sl.addShape(prs.ShapeType.roundRect, { x: px, y: py, w: 6.2, h: 1.35, fill: { color: "1E293B" }, line: { color: "334155", width: 1 } });
          sl.addText(p.label, { x: px + 0.15, y: py + 0.1, w: 5.9, h: 0.28, fontSize: 10, bold: true, color: FG, fontFace: "Calibri" });
          sl.addText(p.detail, { x: px + 0.15, y: py + 0.42, w: 5.9, h: 0.8, fontSize: 9, color: MUTED, fontFace: "Calibri", wrap: true });
        });
        sl.addText(s.research, { x: 0.5, y: 5.6, w: 12.3, h: 0.5, fontSize: 9, color: VIOLET2, italic: true, fontFace: "Calibri" });
      } else if (slide.type === "overview") {
        const s = slide as Extract<typeof DECK_SLIDES[number], { type: "overview" }>;
        const sl = titleSlide(prs, s.title, s.subtitle, i + 1);
        s.steps.forEach((step, si) => {
          const sx = 0.5 + si * 2.55;
          sl.addShape(prs.ShapeType.roundRect, { x: sx, y: 1.9, w: 2.4, h: 1.1, fill: { color: "1E1040" }, line: { color: VIOLET, width: 1 } });
          sl.addText(`Step ${step.number}`, { x: sx, y: 1.95, w: 2.4, h: 0.28, fontSize: 9, bold: true, color: VIOLET2, align: "center", fontFace: "Calibri" });
          sl.addText(step.title, { x: sx, y: 2.25, w: 2.4, h: 0.28, fontSize: 11, bold: true, color: FG, align: "center", fontFace: "Calibri" });
          sl.addText(step.badge, { x: sx, y: 2.57, w: 2.4, h: 0.2, fontSize: 7, color: MUTED, align: "center", fontFace: "Courier New" });
        });
        s.audiences.forEach((a, ai) => {
          const ax = 0.5 + ai * 4.2;
          sl.addShape(prs.ShapeType.roundRect, { x: ax, y: 3.3, w: 4.0, h: 1.0, fill: { color: "1E293B" }, line: { color: "334155", width: 1 } });
          sl.addText(`${a.icon} ${a.label}`, { x: ax + 0.1, y: 3.35, w: 3.8, h: 0.3, fontSize: 9, bold: true, color: FG, fontFace: "Calibri" });
          sl.addText(a.note, { x: ax + 0.1, y: 3.68, w: 3.8, h: 0.55, fontSize: 8, color: MUTED, fontFace: "Calibri", wrap: true });
        });
        sl.addText(s.aigp, { x: 0.5, y: 4.55, w: 12.3, h: 0.5, fontSize: 9, color: EMERALD, italic: true, fontFace: "Calibri" });
      } else if (slide.type === "step") {
        const s = slide as Extract<typeof DECK_SLIDES[number], { type: "step" }>;
        const sl = titleSlide(prs, `Step ${s.number}: ${s.title}`, s.description, i + 1);
        sl.addText(s.badge, { x: 0.5, y: 1.3, w: 4, h: 0.22, fontSize: 8, color: VIOLET2, fontFace: "Courier New" });
        addBullets(sl, "METHODOLOGY", s.methodologyPoints, 0.5, 1.7, 6.2, VIOLET2);
        addBullets(sl, "EXAMPLE OUTPUT", s.outputPoints, 7.0, 1.7, 5.8, EMERALD);
        addBullets(sl, "CADENCE", s.cadencePoints, 7.0, 1.7 + (s.outputPoints.length * 0.28) + 0.7, 5.8, AMBER);
        sl.addText("Scope: " + s.scopeNote, { x: 0.5, y: 6.5, w: 12.3, h: 0.35, fontSize: 8, color: MUTED, italic: true, fontFace: "Calibri", wrap: true });
      } else if (slide.type === "scope") {
        const s = slide as Extract<typeof DECK_SLIDES[number], { type: "scope" }>;
        const sl = titleSlide(prs, s.title, s.subtitle, i + 1);
        sl.addText(s.useCase, { x: 0.5, y: 1.35, w: 12.3, h: 0.22, fontSize: 8.5, color: VIOLET2, fontFace: "Courier New" });
        const colors = { high: ROSE, medium: AMBER, low: EMERALD };
        s.scopes.forEach((sc, si) => {
          const cx = 0.5 + (si % 2) * 6.4;
          const cy = 1.75 + Math.floor(si / 2) * 2.3;
          sl.addShape(prs.ShapeType.roundRect, { x: cx, y: cy, w: 6.1, h: 2.1, fill: { color: "1E293B" }, line: { color: colors[sc.priority], width: 1 } });
          sl.addText(`${sc.scope} — ${sc.label}`, { x: cx + 0.1, y: cy + 0.08, w: 5.9, h: 0.28, fontSize: 10, bold: true, color: FG, fontFace: "Calibri" });
          sl.addText(`Example: ${sc.example}`, { x: cx + 0.1, y: cy + 0.38, w: 5.9, h: 0.2, fontSize: 9, color: colors[sc.priority], fontFace: "Calibri" });
          sl.addText(sc.detail, { x: cx + 0.1, y: cy + 0.62, w: 5.9, h: 0.5, fontSize: 8, color: MUTED, fontFace: "Calibri", wrap: true });
          sl.addText(`Reg: ${sc.regulation}`, { x: cx + 0.1, y: cy + 1.75, w: 5.9, h: 0.22, fontSize: 7.5, color: VIOLET2, fontFace: "Courier New" });
        });
      } else if (slide.type === "business") {
        const s = slide as Extract<typeof DECK_SLIDES[number], { type: "business" }>;
        const sl = titleSlide(prs, s.title, s.subtitle, i + 1);
        const tableData = [
          [{ text: "Metric", options: { bold: true, color: FG, fill: { color: "1E293B" } } },
           { text: "Without disclosure", options: { bold: true, color: ROSE, fill: { color: "1E293B" } } },
           { text: "With disclosure", options: { bold: true, color: EMERALD, fill: { color: "1E293B" } } }],
          ...s.comparison.map(row => [
            { text: row.metric, options: { bold: true, color: FG, fill: { color: "1A2335" } } },
            { text: row.before, options: { color: ROSE, fill: { color: "1A2335" } } },
            { text: row.after, options: { color: EMERALD, fill: { color: "1A2335" } } },
          ])
        ];
        sl.addTable(tableData as Parameters<typeof sl.addTable>[0], {
          x: 0.5, y: 1.5, w: 12.3, fontSize: 9, fontFace: "Calibri",
          border: { type: "solid", color: "334155", pt: 0.5 },
          rowH: 0.42,
        });
        sl.addText(s.roi.label, { x: 0.5, y: 4.75, w: 12.3, h: 0.22, fontSize: 9, bold: true, color: VIOLET2, fontFace: "Calibri" });
        const roiBullets = s.roi.rows.map(r => ({ text: `${r.item}: ${r.value}`, options: { bullet: { type: "bullet" as const }, fontSize: 9.5, color: FG, fontFace: "Calibri", paraSpaceAfter: 2 } }));
        sl.addText(roiBullets, { x: 0.5, y: 5.0, w: 12.3, h: 1.2 });
        sl.addText(s.timeline, { x: 0.5, y: 6.5, w: 12.3, h: 0.22, fontSize: 8, color: AMBER, fontFace: "Courier New" });
      } else if (slide.type === "validation") {
        const s = slide as Extract<typeof DECK_SLIDES[number], { type: "validation" }>;
        const sl = titleSlide(prs, s.title, s.subtitle, i + 1);
        s.experiments.forEach((e, ei) => {
          const ex = 0.5 + ei * 4.2;
          sl.addShape(prs.ShapeType.roundRect, { x: ex, y: 1.9, w: 4.0, h: 2.2, fill: { color: "1E293B" }, line: { color: "334155", width: 1 } });
          const devColor = e.deviation.startsWith("−") || e.deviation === "0.0%" ? EMERALD : AMBER;
          sl.addText(e.deviation, { x: ex, y: 2.0, w: 4.0, h: 0.5, fontSize: 24, bold: true, color: devColor, align: "center", fontFace: "Calibri" });
          sl.addText(e.model, { x: ex + 0.1, y: 2.55, w: 3.8, h: 0.25, fontSize: 10, bold: true, color: FG, fontFace: "Calibri" });
          sl.addText(e.paper, { x: ex + 0.1, y: 2.83, w: 3.8, h: 0.2, fontSize: 8, color: MUTED, fontFace: "Calibri" });
          sl.addText(e.detail, { x: ex + 0.1, y: 3.08, w: 3.8, h: 0.9, fontSize: 8.5, color: MUTED, fontFace: "Calibri", wrap: true });
        });
        sl.addText("Key finding: " + s.finding, { x: 0.5, y: 4.35, w: 12.3, h: 0.7, fontSize: 9.5, color: AMBER, italic: true, fontFace: "Calibri", wrap: true });
        sl.addText(s.methodology, { x: 0.5, y: 5.2, w: 12.3, h: 0.4, fontSize: 9, color: MUTED, fontFace: "Courier New", wrap: true });
      }
    });

    await prs.writeFile({ fileName: "ai-sustainability-disclosure-framework.pptx" });
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  }

  return (
    <div className="mt-12">
      {slideshow && <SlideshowMode onClose={() => setSlideshow(false)} answers={answers} result={result} />}

      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .deck-slide { break-after: page; page-break-after: always; break-inside: avoid; }
          .deck-slide:last-child { break-after: avoid; page-break-after: avoid; }
          .deck-slide * { break-inside: avoid; }
          nav, header, footer, [data-watermark], [data-pagegate], .print\\:hidden { display: none !important; }
          .deck-section-header { display: none !important; }
          * { box-shadow: none !important; }
          .deck-slide { padding: 2rem !important; margin-bottom: 0 !important; }
        }
      `}</style>

      <div className="deck-section-header flex items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="text-sm font-bold text-foreground">Presentation deck</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{DECK_SLIDES.length} slides — practitioner, portfolio, and research audiences.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSlideshow(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-violet-600 text-white hover:bg-violet-500 transition-colors"
          >
            <span>▶</span> Present
          </button>
          <button
            onClick={handleDownloadPPTX}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border transition-colors ${downloaded ? "border-emerald-500/40 text-emerald-400" : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40"}`}
          >
            <span>⬇</span>
            {downloaded ? "Saved ✓" : "Export .pptx"}
          </button>
          <button
            onClick={handlePrint}
            disabled={printing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors disabled:opacity-50"
          >
            <span>🖨</span>
            {printing ? "Opening…" : "Print / PDF"}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {DECK_SLIDES.map((slide, i) => (
          <PresentationSlide key={slide.id} slide={slide} index={i} answers={answers} result={result} />
        ))}
      </div>
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
        <Link to="/#projects" className="text-xs text-muted-foreground hover:text-foreground transition-colors mb-6 inline-block print:hidden">
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

        <Link to="/#projects" className="text-xs text-muted-foreground hover:text-foreground transition-colors mb-6 inline-block print:hidden">
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

        {/* Jump-to-deck shortcut — print hidden */}
        <div className="flex justify-end mb-6 print:hidden">
          <a
            href="#presentation-deck"
            className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-violet-400 transition-colors border border-border/50 hover:border-violet-500/40 rounded-lg px-3 py-1.5"
          >
            <span>▼</span> Jump to Presentation Deck
          </a>
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

        {/* Presentation deck */}
        <div id="presentation-deck">
          <PresentationDeck answers={submitted ? answers : undefined} result={submitted ? result : undefined} />
        </div>
      </div>

      {/* Go-to-top button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        title="Back to top"
        style={{
          position: "fixed", bottom: 80, right: 24, zIndex: 999,
          background: "#1e293b", color: "#94a3b8", border: "1px solid #334155",
          borderRadius: 50, width: 40, height: 40, fontSize: 16, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)", opacity: 0.8,
        }}
      >
        ↑
      </button>
    </PageGate>
  );
}
