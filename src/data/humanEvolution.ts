// Human Evolution in the Age of AI — data layer
// Compiled 2026-06-11 from the research corpus at Human-Evolution-AI/research/ (00–08).
// Source of truth is the markdown corpus; this file is a hand-compiled snapshot.
// Compile targets: 06 §1 cohort matrix · 06 §3 region×domain grid · 07 §6 L1–L18 dashboard.
//
// HONESTY RULES (00_methodology.md):
// - Every datum carries a confidence label: high 🟢 / medium 🟡 / low 🟠 / speculative ⚪
// - tier: "know" = live-verified Tier-1 evidence · "suspect" = grounded inference (Tier 2)
//   · "imagine" = scenario/illustrative (Tier 3). Numeric trajectory values are Tier 3
//   ILLUSTRATIVE quantifications of qualitative ratings — never present them as measurements.

export type Confidence = "high" | "medium" | "low" | "speculative";
export type Tier = "know" | "suspect" | "imagine";
export type ScenarioId = "A" | "B" | "C";
export type DomainId = "cognition" | "creativity" | "discernment" | "mentalHealth" | "labor";
export type CohortId = "adolescents" | "emergingAdults" | "primeWorkforce" | "experiencedWorkforce";
export type RegionId = "northAmerica" | "europe" | "asiaPacific" | "latinAmerica" | "africa" | "middleEast";
export type VariableId =
  | "learning"
  | "adaptability"
  | "cognitiveDev"
  | "creativity"
  | "mentalHealth"
  | "careerResilience"
  | "dependencyRisk";

/** ▲▲ strong net gain · ▲ net gain · ◆ mixed/hinge · ▼ net risk · ▼▼ high net risk */
export type Rating = "strong-gain" | "gain" | "mixed" | "risk" | "high-risk";

/** ++ strong opportunity · + opportunity · = balanced · − risk · −− strong risk · ± split (both extremes) */
export type GridScore =
  | "strong-opportunity"
  | "opportunity"
  | "balanced"
  | "risk"
  | "strong-risk"
  | "split";

export const CONFIDENCE_META: Record<Confidence, { label: string; emoji: string; color: string }> = {
  high: { label: "High confidence", emoji: "🟢", color: "#22c55e" },
  medium: { label: "Medium confidence", emoji: "🟡", color: "#eab308" },
  low: { label: "Low confidence", emoji: "🟠", color: "#f97316" },
  speculative: { label: "Speculative", emoji: "⚪", color: "#9ca3af" },
};

export const RATING_META: Record<Rating, { symbol: string; label: string; value: number; color: string }> = {
  "strong-gain": { symbol: "▲▲", label: "Strong net gain", value: 2, color: "#16a34a" },
  gain: { symbol: "▲", label: "Net gain", value: 1, color: "#4ade80" },
  mixed: { symbol: "◆", label: "Mixed / hinge variable", value: 0, color: "#eab308" },
  risk: { symbol: "▼", label: "Net risk", value: -1, color: "#fb923c" },
  "high-risk": { symbol: "▼▼", label: "High net risk", value: -2, color: "#ef4444" },
};

export const GRID_SCORE_META: Record<GridScore, { symbol: string; label: string; value: number; color: string }> = {
  "strong-opportunity": { symbol: "++", label: "Strong opportunity", value: 2, color: "#16a34a" },
  opportunity: { symbol: "+", label: "Opportunity", value: 1, color: "#4ade80" },
  balanced: { symbol: "=", label: "Balanced", value: 0, color: "#eab308" },
  risk: { symbol: "−", label: "Risk", value: -1, color: "#fb923c" },
  "strong-risk": { symbol: "−−", label: "Strong risk", value: -2, color: "#ef4444" },
  split: { symbol: "±", label: "Both extremes", value: 0, color: "#8b5cf6" },
};

// ---------------------------------------------------------------------------
// Domains
// ---------------------------------------------------------------------------

export interface Domain {
  id: DomainId;
  doc: string; // corpus source document
  title: string;
  shortLabel: string;
  color: string;
  /** One-line domain thesis (from each domain doc's synthesis) */
  thesis: string;
  /** Headline verified statistic for quote cards / tooltips */
  keyStat: { stat: string; source: string; confidence: Confidence };
}

export const DOMAINS: Domain[] = [
  {
    id: "cognition",
    doc: "01_cognitive_offloading.md",
    title: "Cognitive Offloading & Learning",
    shortLabel: "Cognition",
    color: "#6366f1",
    thesis:
      "Mode of use beats amount of use: tutor/scaffold mode shows measurable gains, answer-engine/delegation mode shows decline. The hinge is product defaults and school policy, not the technology.",
    keyStat: {
      stat: "AI summaries roughly halve source click-through (8% vs 15%, Pew 2025) — self-directed inquiry is contracting before any cognitive change is measurable.",
      source: "D1 K3 (Pew 2025)",
      confidence: "high",
    },
  },
  {
    id: "creativity",
    doc: "02_creativity.md",
    title: "Creativity & Cultural Production",
    shortLabel: "Creativity",
    color: "#8b5cf6",
    thesis:
      "Democratize-and-homogenize is one phenomenon: the same tool raises individual creative floors and lowers collective diversity. Value migrates to taste, problem-finding, and authenticity.",
    keyStat: {
      stat: "Freelancer earnings fell −5.2% after generative AI arrived, with top performers hit hardest — quality was no shield.",
      source: "D2 K4 (Hui, Reshef & Zhou 2024)",
      confidence: "high",
    },
  },
  {
    id: "discernment",
    doc: "03_critical_thinking.md",
    title: "Critical Thinking & Discernment",
    shortLabel: "Discernment",
    color: "#f59e0b",
    thesis:
      "Offense/defense capability is symmetric (same models); incentives are not — persuasion is funded per impression, verification is a public good. The likeliest failure is the liar's dividend, not mass deception.",
    keyStat: {
      stat: "Humans detect deepfakes at chance level (55.5%, meta-analysis n≈86k) — discernment must move from perception to provenance and tooling.",
      source: "D3 (Diel 2024)",
      confidence: "high",
    },
  },
  {
    id: "mentalHealth",
    doc: "04_mental_health.md",
    title: "Mental Health & Relationships",
    shortLabel: "Mental Health",
    color: "#f43f5e",
    thesis:
      "Impact splits by design objective: outcome-optimized therapy AI is the first scalable attack on the global treatment gap; engagement-optimized companions put attention-economy incentives inside the attachment system.",
    keyStat: {
      stat: "72% of US teens have used AI companions; 31% find AI conversation as satisfying or more satisfying than human conversation — with zero longitudinal data.",
      source: "D4 K5 (Common Sense Media 2025)",
      confidence: "high",
    },
  },
  {
    id: "labor",
    doc: "05_labor_economics.md",
    title: "Labor & Economics",
    shortLabel: "Labor",
    color: "#10b981",
    thesis:
      "The ladder paradox: AI is a task-level leveler (novices gain most), a market-level ladder-remover (entry jobs decline first), and macro-level modest (<1% TFP). Any single-level narrative is wrong by construction.",
    keyStat: {
      stat: "Novices gained +34% productivity from AI assistance, while 22–25-year-olds in AI-exposed occupations saw −13% relative employment since late 2022 — the same mechanism drives both.",
      source: "D5 K1 (Brynjolfsson et al. QJE 2025) + K4 (Canaries 2025, working paper)",
      confidence: "medium",
    },
  },
];

// ---------------------------------------------------------------------------
// The 7 variables (cohort matrix axes)
// ---------------------------------------------------------------------------

export interface Variable {
  id: VariableId;
  label: string;
  definition: string;
}

export const VARIABLES: Variable[] = [
  { id: "learning", label: "Learning capacity", definition: "Ability to acquire new knowledge and skills, with or without AI assistance." },
  { id: "adaptability", label: "Adaptability", definition: "Capacity to adjust to changing tools, roles, and environments over the forecast period." },
  { id: "cognitiveDev", label: "Cognitive development", definition: "Formation and maintenance of unassisted reasoning, memory, and inference." },
  { id: "creativity", label: "Creativity", definition: "Ideation, originality, and creative production capacity — individual and collective." },
  { id: "mentalHealth", label: "Mental health", definition: "Psychological wellbeing, relationship formation, and exposure to AI-mediated support or harm." },
  { id: "careerResilience", label: "Career resilience", definition: "Ability to enter, sustain, and progress in a labor market being reshaped by AI." },
  { id: "dependencyRisk", label: "AI-dependency risk", definition: "Risk that capability becomes contingent on AI assistance (note: for 41–60 the salient risk is manipulation, not dependency)." },
];

// ---------------------------------------------------------------------------
// Cohort matrix — 06_cohorts_regions.md §1 (H1 2026→2036)
// ---------------------------------------------------------------------------

export interface CohortRating {
  rating: Rating;
  confidence: Confidence;
  driver: string; // corpus citation kept inline, e.g. "(D1 K4)"
}

export interface Cohort {
  id: CohortId;
  label: string;
  ages2026: string;
  ages2036: string;
  ages2046: string;
  summary: string;
  ratings: Record<VariableId, CohortRating>;
}

export const COHORTS: Cohort[] = [
  {
    id: "adolescents",
    label: "Adolescents",
    ages2026: "13–18",
    ages2036: "23–28",
    ages2046: "33–38",
    summary:
      "The structural risk case of the whole study: every faculty still forming (reasoning, attachment, taste, career foundation) forms inside whichever AI mode wins. Rated highest dependency risk in all five domains independently.",
    ratings: {
      learning: {
        rating: "mixed",
        confidence: "medium",
        driver:
          "Largest upside of any cohort (AI tutors double learning gains, D1 K4) AND largest downside (delegation-mode use during the formative window, D1 K6/S3). The hinge is school policy and product defaults.",
      },
      adaptability: {
        rating: "gain",
        confidence: "medium",
        driver:
          "Most plastic cohort; first fully AI-native workforce by 2036 (D5) — if fluency is anchored to unassisted foundations.",
      },
      cognitiveDev: {
        rating: "high-risk",
        confidence: "low",
        driver:
          "Reasoning forms inside whichever mode wins (D1 S3); epistemic toolkit forms in a synthetic-media environment with no 'seeing is believing' baseline (D3); the offloading age gradient runs against them (D1 K6).",
      },
      creativity: {
        rating: "mixed",
        confidence: "low",
        driver:
          "Floor-raising gains are largest for weakest creators (D2 K1) — but ideation habits form with generation free (atrophy-of-beginning risk, D2 S4) and taste forms inside AI's output distribution.",
      },
      mentalHealth: {
        rating: "risk",
        confidence: "medium",
        driver:
          "72% companion exposure, 13% daily, a third route serious disclosures to AI (D4 K5 🟢) — during attachment formation, with zero longitudinal data. Exposure is Tier-1 fact; harm is Tier-2 inference.",
      },
      careerResilience: {
        rating: "risk",
        confidence: "medium",
        driver:
          "Enter a labor market whose bottom rung is partially gone (D5 K4) while education optimizes for credentials with eroding entry payoff. Offset: greatest runway to learn judgment-at-the-frontier skills.",
      },
      dependencyRisk: {
        rating: "high-risk",
        confidence: "high",
        driver:
          "Rated highest in all five domains independently — the single most consistent cross-domain pattern in this corpus.",
      },
    },
  },
  {
    id: "emergingAdults",
    label: "Emerging Adults",
    ages2026: "19–25",
    ages2036: "29–35",
    ages2046: "39–45",
    summary:
      "The canaries: strongest AI fluency, weakest incentive to internalize, hit by the entry-level employment decline in the exact window careers compound. Partially pre-AI foundation distinguishes them from adolescents.",
    ratings: {
      learning: {
        rating: "mixed",
        confidence: "medium",
        driver:
          "Strongest prompt/retrieval skills of any cohort; weakest incentive to internalize knowledge AI appears to cover (D1). Gain most at task level — +34% novice productivity (D5 K1).",
      },
      adaptability: {
        rating: "gain",
        confidence: "medium",
        driver: "AI-native habits + early-career flexibility; retraining math is favorable (decades to amortize).",
      },
      cognitiveDev: {
        rating: "risk",
        confidence: "medium",
        driver:
          "Tail end of the 13–25 formative window (D1 S3); highest offloading dependence on the Gerlich age gradient (D1 K6). Foundation partially pre-AI — better anchored than adolescents.",
      },
      creativity: {
        rating: "risk",
        confidence: "medium",
        driver:
          "Enter creative careers exactly as generation-stage pricing collapses; the apprenticeship rungs (junior copywriter/designer) are the first automated (D2 K4). Must leapfrog directly to taste/direction.",
      },
      mentalHealth: {
        rating: "risk",
        confidence: "medium",
        driver:
          "Loneliest cohort in most surveys; heaviest companion use (D4 K4 sample); substitution risk peaks in the decade adult relationship patterns consolidate (D4 S1).",
      },
      careerResilience: {
        rating: "high-risk",
        confidence: "medium",
        driver:
          "The canaries: −13% relative employment in AI-exposed occupations since 2022 (D5 K4), hit in the exact window careers compound. Scarred-cohort risk — delayed starts permanently lower lifetime trajectories.",
      },
      dependencyRisk: {
        rating: "risk",
        confidence: "medium",
        driver:
          "High in every domain; distinguished from adolescents by having a partially pre-AI foundation to fall back on.",
      },
    },
  },
  {
    id: "primeWorkforce",
    label: "Prime Workforce",
    ages2026: "26–40",
    ages2036: "36–50",
    ages2046: "46–60",
    summary:
      "The consistent winner — by timing luck: pre-AI cognitive foundations they did not choose, plus AI leverage they did not build. Every domain rates this cohort medium-or-better.",
    ratings: {
      learning: {
        rating: "strong-gain",
        confidence: "medium",
        driver:
          "The symbiosis sweet spot: pre-AI cognitive foundation + AI leverage (D1); self-confidence buffers critical-thinking erosion (D1 K5).",
      },
      adaptability: {
        rating: "gain",
        confidence: "medium",
        driver:
          "Enough accumulated judgment to ride augmentation (D5 K3 inside-frontier gains) with decades left to amortize retraining (D5).",
      },
      cognitiveDev: {
        rating: "mixed",
        confidence: "medium",
        driver:
          "Foundation formed pre-AI; the risk is slow verification atrophy (D1 S4) and miscalibrated trust at the jagged frontier (D5 K3), not foundational deficit.",
      },
      creativity: {
        rating: "gain",
        confidence: "medium",
        driver:
          "Best positioned to become the curator-director class (D2 S2). Risk: generation-stage skills deflate mid-career — top freelancers were hit hardest (D2 K4).",
      },
      mentalHealth: {
        rating: "gain",
        confidence: "medium",
        driver:
          "Main beneficiaries of clinical AI: treatment-gap demographics, time-poor, lower stigma barrier with a bot (D4 K1/K2). Companion risk concentrated in already-isolated members.",
      },
      careerResilience: {
        rating: "gain",
        confidence: "medium",
        driver:
          "Captures the widening judgment premium (D5 S2) — conditional on avoiding the deskilling-by-overtrust loop (D5 K3 + D1 S4).",
      },
      dependencyRisk: {
        rating: "mixed",
        confidence: "medium",
        driver: "Medium across domains; the failure mode is gradual (verification atrophy), not structural.",
      },
    },
  },
  {
    id: "experiencedWorkforce",
    label: "Experienced Workforce",
    ages2026: "41–60",
    ages2036: "51–70",
    ages2046: "61–80",
    summary:
      "Lowest cognitive-dependency risk (deep internalized expertise anchors verification) but a distinct exposure: manipulation, not dependency — primary targets of voice-clone and synthetic-media fraud.",
    ratings: {
      learning: {
        rating: "mixed",
        confidence: "medium",
        driver:
          "Deep internalized expertise means AI mostly augments (D1) — but IMF flags this cohort as least able to adapt to AI-era retraining (D5 K6).",
      },
      adaptability: {
        rating: "risk",
        confidence: "high",
        driver:
          "Lowest of any cohort (D5 K6); shortest payback window on retraining. H2 risk: retirement-age extension collides with frontier churn.",
      },
      cognitiveDev: {
        rating: "gain",
        confidence: "high",
        driver:
          "Lowest offloading risk — the age gradient runs in their favor (D1 K6); decades of internalized knowledge to anchor verification.",
      },
      creativity: {
        rating: "gain",
        confidence: "medium",
        driver:
          "Established taste, networks, and provenance — the 'scarcity by biography' advantage (D2 I4). AI removes production bottlenecks without threatening their differentiator.",
      },
      mentalHealth: {
        rating: "mixed",
        confidence: "medium",
        driver:
          "Lowest companion adoption (D4); clinical AI as adjunct. Distinct exposure: manipulation, not dependency — primary targets of voice-clone and romance/investment fraud (D3).",
      },
      careerResilience: {
        rating: "mixed",
        confidence: "medium",
        driver:
          "Bifurcated (D5): judgment-amplified members finish careers strong; role-absorbed members face the worst retraining math. Experience moat holds in H1 (D5 K4 shows older workers stable).",
      },
      dependencyRisk: {
        rating: "gain",
        confidence: "high",
        driver:
          "Lowest cognitive-dependency risk — but medium-high manipulation risk (D3 cohort table). The two risks are different and shouldn't be summed.",
      },
    },
  },
];

/** Cross-cohort patterns — 06 §1 "Reading the matrix" (all 🟡 medium) */
export const COHORT_PATTERNS: { title: string; text: string; confidence: Confidence }[] = [
  {
    title: "Risk tracks developmental stage, not familiarity",
    text: "The cohort most fluent with AI (13–18) carries the highest risk, and the least fluent (41–60) the lowest cognitive risk — risk concentrates where faculties are still forming, not where tool skill is weakest. Familiarity is not protection; foundation is.",
    confidence: "medium",
  },
  {
    title: "The gain-loss inversion hits the young twice",
    text: "Novices gain most at task level and lose first at market level (the ladder paradox); the same shape recurs in creativity. The two youngest cohorts experience AI as simultaneously their best tool and their structural competitor.",
    confidence: "medium",
  },
  {
    title: "Prime Workforce wins by timing luck",
    text: "Every domain rates 26–40 medium-or-better: pre-AI foundations they did not choose, plus AI leverage they did not build. The AI dividend is currently being paid disproportionately to one accidental birth cohort.",
    confidence: "medium",
  },
];

// ---------------------------------------------------------------------------
// Regions — 06_cohorts_regions.md §2 (all Tier 2 by construction: WEIRD-bias demotion)
// ---------------------------------------------------------------------------

export interface Region {
  id: RegionId;
  label: string;
  epithet: string; // "the world's test market", etc.
  netRead: string;
  hingeVariable: string;
  dimensions: { adoption: string; education: string; labor: string; economy: string; culture: string };
}

export const REGIONS: Region[] = [
  {
    id: "northAmerica",
    label: "North America",
    epithet: "The world's test market",
    netRead:
      "Highest variance of any region: best-resourced institutions beside the most engagement-optimized defaults. Outcomes arrive here first, in both directions.",
    hingeVariable: "Product defaults",
    dimensions: {
      adoption: "Highest consumer AI penetration; first market for every product category in this corpus — tutors, companions, persuasion tech, provenance tools.",
      education: "Fragmented school policy → the widest within-region variance in mode-of-use outcomes. No national inoculation curriculum despite being the persuasion-tech frontier.",
      labor: "The canary signal is US data: flexible labor markets adjust fastest and most brutally — first to show the ladder paradox, first to price the judgment premium.",
      economy: "Captures the largest share of AI productivity gains; also internalizes the first harms ledger — companion litigation, therapy-AI restrictions.",
      culture: "Polarized trust landscape amplifies the liar's dividend; epicenter of both the creator economy and its repricing.",
    },
  },
  {
    id: "europe",
    label: "Europe",
    epithet: "The control group",
    netRead:
      "Running the world's only at-scale test of whether deliberate friction produces better human outcomes than market defaults.",
    hingeVariable: "Whether regulation outpaces capability drift",
    dimensions: {
      adoption: "Deliberately dragged by regulation (AI Act) — slower consumer defaults may accidentally preserve engagement-mode use and constrain engagement-optimized companion design.",
      education: "Strongest public education systems — the documented buffer against offloading harms — but PIAAC shows adult literacy declining in most member states.",
      labor: "Employment protection slows displacement but may slow complementary adoption too; best-placed social insurance for retraining; risk of preserving roles while the work inside them hollows.",
      economy: "The regulatory experiment the rest of the world will cite: AI Act labeling is the major test of mandated provenance.",
      culture: "Likely home of the verified-human economy — strongest legal push on AI-content labeling and author rights.",
    },
  },
  {
    id: "asiaPacific",
    label: "Asia Pacific",
    epithet: "Bimodal in every domain",
    netRead:
      "Likely to contain both the best and worst cohort outcomes globally. Watch advanced APAC for what steered adoption produces; watch BPO economies for whether the development ladder forecloses.",
    hingeVariable: "State capacity",
    dimensions: {
      adoption: "State-led AI tutoring at scale (China, Korea, Singapore) beside exam-culture answer-engine use; highest cultural normalization of virtual companionship — the leading-indicator societies for companion adoption.",
      education: "Singapore/Korea/Japan pair high literacy with state media-literacy programs; elsewhere, closed messaging ecosystems carry unlabeled synthetic content with no inoculation surface.",
      labor: "The sharpest split on earth: advanced APAC automates against demographic shrinkage (augmentation by necessity), while India/Philippines hold the most AI-exposed development model — the BPO/IT-services export ladder.",
      economy: "Largest AI-generated entertainment industries (webtoons, short video, game assets) — homogenization pressure strongest where content velocity is the business model.",
      culture: "Strong craft-preservation traditions as a counterweight to homogenization; virtual-relationship normalization a decade ahead of the West.",
    },
  },
  {
    id: "latinAmerica",
    label: "Latin America",
    epithet: "Leapfrog vs bypass",
    netRead:
      "Biggest upside per dollar in tutoring and mental-health access; biggest blind spot in closed-channel epistemics.",
    hingeVariable: "Delivery infrastructure",
    dimensions: {
      adoption: "High smartphone penetration, WhatsApp-first information diets — closed channels where provenance labels and pre-roll inoculation cannot reach; voice-note deepfakes a distinctive regional vector.",
      education: "AI tutoring is the leapfrog opportunity where teacher supply is the binding constraint; device/connectivity gaps stratify who gets it.",
      labor: "Moderate exposure; the large informal sector buffers displacement but also caps the gains; nearshoring + AI could build a new service-export rung or skip it entirely.",
      economy: "Spanish/Portuguese model quality now near parity — the old language barrier to clinical and educational AI has fallen.",
      culture: "Strong regional creative identity faces the export-homogenization squeeze; AI also drops the cost of producing for global markets — direction genuinely unclear.",
    },
  },
  {
    id: "africa",
    label: "Africa",
    epithet: "The highest-stakes asymmetry",
    netRead:
      "Largest potential gains, weakest infrastructure to steer them, and near-zero local evidence — what is known about Africa's AI future is mostly inference from populations least like it.",
    hingeVariable: "Whether tools are designed for the region or merely arrive in it",
    dimensions: {
      adoption: "Youngest population on earth meets the cheapest-ever tutoring, therapy, and production tools — the largest potential relative gain of any region in three separate domains.",
      education: "The tutoring upside at maximum leverage where teacher supply binds — IF delivery infrastructure holds; risk that delegation-mode mobile products designed elsewhere become the default.",
      labor: "Lowest direct exposure — least disrupted in H1. The deeper risk is foreclosure: the cheap-cognitive-labor entry ramp that industrialized other regions may no longer exist when the world's youngest workforce arrives at it.",
      economy: "Thinnest mental-health workforce on earth (often <1 psychiatrist per 100k) — the region where chatbot-grade care changes access most; weakest verification infrastructure meets greatest relative synthetic-media exposure.",
      culture: "Training-data underrepresentation makes AI tools systematically worse at local aesthetics, pushing creators toward global-default styles — democratization and homogenization arriving in the same package.",
    },
  },
  {
    id: "middleEast",
    label: "Middle East",
    epithet: "The state-direction extreme",
    netRead:
      "Demonstrates what AI adoption looks like when government, not market defaults, sets the mode.",
    hingeVariable: "Whether state-led adoption serves capability-building or control",
    dimensions: {
      adoption: "Bimodal Gulf vs non-Gulf: heavy sovereign AI investment (education hubs, media production, post-oil diversification) beside low-capacity systems.",
      education: "Gulf state investment in AI education at scale; outcomes track the existing education-quality split.",
      labor: "Capital-rich, labor-importing Gulf economies can automate without domestic displacement politics; non-Gulf ME faces youth-unemployment pressure compounding churn.",
      economy: "Sovereign-wealth-funded AI infrastructure as deliberate economic strategy — the most state-directed adoption path of any region.",
      culture: "High stigma around help-seeking makes anonymous AI support disproportionately valuable; state-dominated information environments mean synthetic media changes the cost of existing information control more than the trust structure.",
    },
  },
];

// ---------------------------------------------------------------------------
// Region × domain grid — 06_cohorts_regions.md §3 (compile target: Risk Heatmap)
// All Tier 2, 🟡 medium unless noted.
// ---------------------------------------------------------------------------

export interface GridCell {
  region: RegionId;
  domain: DomainId;
  score: GridScore;
  note: string;
  confidence: Confidence;
}

export const REGION_DOMAIN_GRID: GridCell[] = [
  // North America
  { region: "northAmerica", domain: "cognition", score: "balanced", note: "Defaults decide", confidence: "medium" },
  { region: "northAmerica", domain: "creativity", score: "balanced", note: "Repricing epicenter", confidence: "medium" },
  { region: "northAmerica", domain: "discernment", score: "risk", note: "Persuasion frontier, polarized trust", confidence: "medium" },
  { region: "northAmerica", domain: "mentalHealth", score: "balanced", note: "Best care + worst harms ledger", confidence: "medium" },
  { region: "northAmerica", domain: "labor", score: "risk", note: "Ladder paradox arrives first", confidence: "medium" },
  // Europe
  { region: "europe", domain: "cognition", score: "opportunity", note: "Regulation + education buffer", confidence: "medium" },
  { region: "europe", domain: "creativity", score: "opportunity", note: "Provenance home", confidence: "medium" },
  { region: "europe", domain: "discernment", score: "balanced", note: "Regulation vs literacy decline", confidence: "medium" },
  { region: "europe", domain: "mentalHealth", score: "opportunity", note: "Constrained companion design", confidence: "medium" },
  { region: "europe", domain: "labor", score: "balanced", note: "Protected but hollowing", confidence: "low" },
  // Asia Pacific
  { region: "asiaPacific", domain: "cognition", score: "split", note: "Both extremes — steered tutoring and exam-culture answer engines", confidence: "medium" },
  { region: "asiaPacific", domain: "creativity", score: "risk", note: "Velocity homogenization", confidence: "medium" },
  { region: "asiaPacific", domain: "discernment", score: "balanced", note: "Bimodal", confidence: "medium" },
  { region: "asiaPacific", domain: "mentalHealth", score: "balanced", note: "Normalization frontier", confidence: "medium" },
  { region: "asiaPacific", domain: "labor", score: "split", note: "Augmentation by necessity vs BPO foreclosure", confidence: "medium" },
  // Latin America
  { region: "latinAmerica", domain: "cognition", score: "opportunity", note: "Tutoring leapfrog", confidence: "medium" },
  { region: "latinAmerica", domain: "creativity", score: "balanced", note: "Direction unclear", confidence: "low" },
  { region: "latinAmerica", domain: "discernment", score: "strong-risk", note: "Closed-channel epistemics", confidence: "medium" },
  { region: "latinAmerica", domain: "mentalHealth", score: "opportunity", note: "Treatment-gap upside", confidence: "medium" },
  { region: "latinAmerica", domain: "labor", score: "balanced", note: "Informal buffer", confidence: "medium" },
  // Africa
  { region: "africa", domain: "cognition", score: "strong-opportunity", note: "Largest relative gain", confidence: "medium" },
  { region: "africa", domain: "creativity", score: "opportunity", note: "Democratization, with aesthetic-default risk", confidence: "medium" },
  { region: "africa", domain: "discernment", score: "risk", note: "Weakest verification infrastructure", confidence: "medium" },
  { region: "africa", domain: "mentalHealth", score: "strong-opportunity", note: "Largest access gain", confidence: "medium" },
  { region: "africa", domain: "labor", score: "risk", note: "Foreclosure risk", confidence: "low" },
  // Middle East
  { region: "middleEast", domain: "cognition", score: "balanced", note: "Split by state capacity", confidence: "medium" },
  { region: "middleEast", domain: "creativity", score: "balanced", note: "Policy-shaped", confidence: "medium" },
  { region: "middleEast", domain: "discernment", score: "risk", note: "Control-cost collapse", confidence: "medium" },
  { region: "middleEast", domain: "mentalHealth", score: "opportunity", note: "Stigma bypass", confidence: "medium" },
  { region: "middleEast", domain: "labor", score: "balanced", note: "Gulf / non-Gulf split", confidence: "medium" },
];

/** Mandatory caveat for the heatmap (06 §4.2 — evidence-exposure inversion, 🟢 that the gap exists) */
export const HEATMAP_CAVEAT =
  "The cohort with the most at stake (adolescents) and the regions with the most at stake (Africa, Latin America, South Asia) have the least research coverage. Confidence is highest exactly where the subject matter is least decisive. All regional cells are Tier-2 inference from predominantly US/EU-sampled studies.";

// ---------------------------------------------------------------------------
// Master variables — 07_scenarios.md §2
// ---------------------------------------------------------------------------

export interface MasterVariable {
  id: "M1" | "M2" | "M3" | "M4";
  label: string;
  question: string;
  sets: string;
}

export const MASTER_VARIABLES: MasterVariable[] = [
  {
    id: "M1",
    label: "Default design objective",
    question: "Are mass-market AI products optimized for user outcomes (tutor, treat, diversify) or user retention (answer, engage, agree)?",
    sets: "Mode of use at population scale",
  },
  {
    id: "M2",
    label: "Incentive asymmetry",
    question: "Does anyone fund the public-good side (verification, inoculation, treatment, training) at the scale the private side funds itself?",
    sets: "Whether defense deploys",
  },
  {
    id: "M3",
    label: "Institutional adaptation speed",
    question: "Do education, regulation, and professional norms adapt within the formative window (≈ one cohort, ~10 years) or after it?",
    sets: "Whether the 13–25 cohort is protected during formation",
  },
  {
    id: "M4",
    label: "Where capability formation moves",
    question: "When AI absorbs apprenticeship-grade work, does a deliberate replacement for learning-by-doing emerge, or not?",
    sets: "The 2030s supply of judgment",
  },
];

// ---------------------------------------------------------------------------
// Scenarios — 07_scenarios.md §3–§5 (Tier 3 by definition; drivers cite Tier 1/2)
// ---------------------------------------------------------------------------

export interface Scenario {
  id: ScenarioId;
  name: string;
  kind: "Optimistic" | "Expected" | "Pessimistic";
  confidence: Confidence;
  confidenceNote: string;
  color: string;
  masterVariableSetting: string;
  mechanism: string;
  outcome2036: string;
  outcome2046: string;
  domainOutcomes: Record<DomainId, string>;
}

export const SCENARIOS: Scenario[] = [
  {
    id: "A",
    name: "The Steered Decade",
    kind: "Optimistic",
    confidence: "low",
    confidenceNote:
      "Capped low–medium: A requires winning against attention-economy incentives in four domains simultaneously — something no precedent technology achieved. Its plausibility rests on AI being the first technology whose beneficial mode is also its cheapest mode at scale.",
    color: "#16a34a",
    masterVariableSetting:
      "Outcome-optimized defaults win key categories (M1); public-good funding arrives via regulation, liability, and procurement (M2); institutions adapt inside the window (M3); simulated apprenticeship and judgment curricula rebuild the ladder (M4).",
    mechanism:
      "The economics of the good versions (tutoring RCT gains, inoculation at $0.05/view, chatbot therapy at near-zero marginal cost) win procurement and policy before engagement-optimized incumbents lock in. At least one major jurisdiction demonstrates the steered model works — likeliest: Europe by regulation, advanced APAC by state capacity.",
    outcome2036:
      "Measurable net human-capability gains in steered populations; offloading is strategic; trust infrastructure boring and ambient; entry-level work redesigned rather than deleted.",
    outcome2046:
      "Baseline human+AI capability exceeds the 2026 human baseline across cohorts; the 2026–2036 adolescent cohort is the best-educated in history rather than the most dependent.",
    domainOutcomes: {
      cognition: "Tutor Era — AI tutors mainstream with unassisted-reasoning assessment intact.",
      creativity: "Curation Renaissance — divergence-aware tools + provenance norms sustain creative diversity.",
      discernment: "Provenance Wins — provenance + inoculation + DebunkBot-grade civic tools contain manipulation the way spam was contained.",
      mentalHealth: "Treatment-Gap Collapse — stepped-care AI collapses the treatment gap while companion platforms compete on pro-social design.",
      labor: "Augmentation Dividend — roles redesigned around augmentation; juniors enter as AI-directors on day one.",
    },
  },
  {
    id: "B",
    name: "The Great Split",
    kind: "Expected",
    confidence: "medium",
    confidenceNote:
      "The modal scenario: it assumes no heroic coordination and no catastrophic failure — just every actor following existing incentives. All five domain B-scenarios independently converged on this shape (flat means, rising variance) without coordination.",
    color: "#eab308",
    masterVariableSetting:
      "Both default types persist by market segment (M1); public-good funding arrives patchily — strong institutions, wealthy districts, regulated jurisdictions (M2); institutions adapt only where capacity already exists (M3); judgment formation privatizes (M4).",
    mechanism:
      "In every domain, the gains and the harms are real simultaneously, distributed by mode of use and institutional cover, and invisible in averages. Population means stay reassuring while distributions stretch — variance hides in means becomes the defining social fact of the AI decade.",
    outcome2036:
      "AI-era inequality is recognized as a capability inequality (cognition, discernment, judgment, intimacy), not just income — but recognized late, because every dashboard tracked averages. Scarred-cohort and formative-window effects surface in the first AI-native cohort's adult data.",
    outcome2046:
      "Capability stratification is a standing policy domain alongside economic inequality; 'which defaults did you grow up inside' is a recognized life-outcome variable, like childhood zip code today.",
    domainOutcomes: {
      cognition: "The Split — reasoning means flat, variance up: an engaged minority gains while a delegating majority slowly loses unassisted capability.",
      creativity: "Abundant and Uniform — culture more productive and more similar; a small taste elite above a large prompt-operating class.",
      discernment: "Trust Recession — chronic low-trust equilibrium; verification available, costly, unevenly used.",
      mentalHealth: "Split Ledger — clinical AI helps the treatable middle while engagement companions deepen dependency in a vulnerable minority.",
      labor: "Split Ladder — two-track labor market; net employment fine, net mobility worse.",
    },
  },
  {
    id: "C",
    name: "The Dependency Compound",
    kind: "Pessimistic",
    confidence: "low",
    confidenceNote:
      "Low confidence: C requires every hinge variable to fail simultaneously and ignores documented countervailing forces already in motion (EU AI Act labeling, therapy-AI regulation, provenance standards, the post-litigation safety turn in companions). Its value is as a coupling map: it shows which failures buy which other failures.",
    color: "#ef4444",
    masterVariableSetting:
      "Engagement-optimized defaults win everywhere (M1); the public-good side stays unfunded (M2); institutions adapt after the formative window closes (M3); no replacement for learning-by-doing emerges (M4).",
    mechanism:
      "The domain C-scenarios amplify each other: people who offload reasoning audit their AI less (cognition→discernment); the ladder paradox removes the work where judgment formed while miscalibrated trust erodes the judgment that remained (labor↔cognition); a cohort attached to always-agreeable companions is a softer target for personalized persuasion (mental health→everything); homogenized, provenance-free culture is the substrate the liar's dividend grows on (creativity→epistemics).",
    outcome2036:
      "The first AI-native cohort enters adulthood with measurable deficits across multiple capability axes at once, and institutions redesign around the deficits rather than repairing them.",
    outcome2046:
      "Human capability without AI assistance is a minority, class-stratified trait; the dependency question is answered in the affirmative — not by any single failure, but by compounding defaults.",
    domainOutcomes: {
      cognition: "Cognitive Debt Compounds — formative-window deficits at scale; unassisted reasoning becomes class-stratified.",
      creativity: "The Closed Loop — culture narrows through model-retraining feedback loops; original work economically irrational.",
      discernment: "Liar's Dividend Compounds — shared evidentiary standards collapse; truth claims settled by network allegiance.",
      mentalHealth: "Intimacy Economy — a cohort calibrated to frictionless intimacy; paid human attention a luxury good.",
      labor: "Hollowed Pipeline — the path upward through work collapses even as work persists.",
    },
  },
];

export const SCENARIO_LOGIC_ONE_LINE =
  "A = all four master variables set well · B = variables set well for some populations · C = all four set by default market dynamics. The technology is identical in all three.";

// ---------------------------------------------------------------------------
// Leading-indicator dashboard — 07_scenarios.md §6 (compile target: Viz 4/5)
// ---------------------------------------------------------------------------

export interface Indicator {
  id: string; // L1–L18
  indicator: string;
  domains: DomainId[];
  watch: string; // who/what to watch
  by: number; // watch-by year
  signal: string; // what movement means
  /** Which cluster the indicator belongs to for the reading rule */
  cluster: "A" | "C" | "context";
}

export const INDICATORS: Indicator[] = [
  { id: "L1", indicator: "Unassisted-reasoning assessment added to national curricula / PISA-type instruments", domains: ["cognition"], watch: "OECD, major education ministries", by: 2029, signal: "Adoption = A (steering working)", cluster: "A" },
  { id: "L2", indicator: "Variance (not mean) of reasoning scores in high-AI-adoption cohorts", domains: ["cognition"], watch: "PISA/PIAAC waves", by: 2030, signal: "Widening = B confirmed — the most direct test of the central thesis", cluster: "context" },
  { id: "L3", indicator: "Tutor-mode vs answer-mode product growth in education AI", domains: ["cognition"], watch: "Edtech market data", by: 2028, signal: "Tutor-mode growth = A; answer-mode dominance = C", cluster: "A" },
  { id: "L4", indicator: "Source click-through rates from AI search interfaces (baseline: 8% vs 15%, Pew)", domains: ["cognition", "discernment"], watch: "Pew-type tracking", by: 2028, signal: "Further decline = C", cluster: "C" },
  { id: "L5", indicator: "Embedding-space diversity of published fiction/music/design", domains: ["creativity"], watch: "Computational culture studies", by: 2030, signal: "Narrowing = C", cluster: "C" },
  { id: "L6", indicator: "Verified-human / provenance-labeled work commanding a measurable price premium", domains: ["creativity", "discernment"], watch: "Publishing, art, freelance markets", by: 2029, signal: "Premium emerging = A", cluster: "A" },
  { id: "L7", indicator: "Entry-level creative + cognitive hiring (the apprenticeship rungs)", domains: ["creativity", "labor"], watch: "Payroll & platform data", by: 2028, signal: "Continued decline = B/C", cluster: "C" },
  { id: "L8", indicator: "% of consumer media carrying content credentials (C2PA-type)", domains: ["discernment"], watch: "Platform/camera adoption stats", by: 2030, signal: "Rising = A; stall = B/C", cluster: "A" },
  { id: "L9", indicator: "Inoculation modules in national school curricula", domains: ["discernment"], watch: "Education policy tracking", by: 2029, signal: "Adoption = A", cluster: "A" },
  { id: "L10", indicator: "Authentic evidence dismissed as synthetic in courts/elections (liar's dividend)", domains: ["discernment"], watch: "Legal & election monitoring", by: 2028, signal: "Rising = C", cluster: "C" },
  { id: "L11", indicator: "Payer reimbursement codes for AI-delivered therapy", domains: ["mentalHealth"], watch: "Health systems (US/EU first)", by: 2029, signal: "Adoption = A", cluster: "A" },
  { id: "L12", indicator: "Share of teens preferring AI conversation over human (baseline: 31%, Common Sense)", domains: ["mentalHealth"], watch: "Repeat surveys", by: 2028, signal: "Climbing = C", cluster: "C" },
  { id: "L13", indicator: "Companion-platform safety/escalation metrics published voluntarily or by mandate", domains: ["mentalHealth"], watch: "Platform reporting", by: 2028, signal: "Publication = A", cluster: "A" },
  { id: "L14", indicator: "Companion revenue vs digital-therapeutic revenue growth rates", domains: ["mentalHealth"], watch: "Market data", by: 2029, signal: "Companion ≫ therapeutic = C", cluster: "C" },
  { id: "L15", indicator: "Youth (22–25) employment in AI-exposed occupations vs older same-occupation workers (baseline: −13% relative)", domains: ["labor"], watch: "ADP-type payroll data", by: 2028, signal: "Spread widening or moving up-curve = C", cluster: "C" },
  { id: "L16", indicator: "Paid 'verification / AI-output ownership' job titles & certification markets", domains: ["labor"], watch: "Job-posting data", by: 2029, signal: "Emerging = A (M4 forming)", cluster: "A" },
  { id: "L17", indicator: "TFP growth vs the ~0.5–0.7%/decade floor (Acemoglu)", domains: ["labor"], watch: "National statistics", by: 2031, signal: "Well above floor = A's economic engine", cluster: "context" },
  { id: "L18", indicator: "BPO/IT-services export growth in India/Philippines", domains: ["labor"], watch: "Trade statistics", by: 2029, signal: "Contraction = ladder foreclosure", cluster: "context" },
];

export const DASHBOARD_READING_RULE =
  "No single indicator decides a scenario; the scenarios predict clusters. A is confirmed by L1+L3+L6+L8+L9+L11+L16 moving together; C by L4+L5+L10+L12+L14+L15 moving together; B is confirmed by the A-cluster moving in strong-institution jurisdictions while the C-cluster moves everywhere else — divergence between jurisdictions IS the B signal.";

// ---------------------------------------------------------------------------
// Impact Pareto — Viz 3. Curated from the five domains' Top-5 sections.
// magnitude = ILLUSTRATIVE 0–100 analytic weighting (evidence strength × breadth
// of population affected), NOT a measured quantity. Tier 3 by definition.
// ---------------------------------------------------------------------------

export interface ParetoImpact {
  id: string;
  label: string;
  domain: DomainId;
  type: "risk" | "opportunity";
  magnitude: number; // illustrative analytic weight, 0–100
  evidence: Confidence;
  tier: Tier;
  basis: string;
}

export const PARETO_IMPACTS: ParetoImpact[] = [
  { id: "P1", label: "Formative-window cognitive deficits (13–25 delegation-mode default)", domain: "cognition", type: "risk", magnitude: 92, evidence: "low", tier: "suspect", basis: "D1 R1 + S3 — reasoning forms inside whichever mode wins; age gradient of offloading harm (D1 K6)." },
  { id: "P2", label: "AI tutoring at near-zero marginal cost — largest scalable learning-gain instrument measured", domain: "cognition", type: "opportunity", magnitude: 90, evidence: "high", tier: "know", basis: "D1 O1 (K4) — strongest where teacher supply binds (Africa, LatAm)." },
  { id: "P3", label: "Capability inequality invisible in averages (variance hides in means)", domain: "labor", type: "risk", magnitude: 88, evidence: "medium", tier: "suspect", basis: "All five domain B-scenarios independently converged on flat-means-rising-variance (07 §1)." },
  { id: "P4", label: "Global mental-health treatment gap closes from the bottom", domain: "mentalHealth", type: "opportunity", magnitude: 85, evidence: "high", tier: "know", basis: "D4 K1/K2 — modest per-person effects (g≈0.3) at near-zero marginal cost, aimed at the majority who get no care." },
  { id: "P5", label: "Apprenticeship-layer collapse (the ladder paradox)", domain: "labor", type: "risk", magnitude: 84, evidence: "medium", tier: "suspect", basis: "D5 R1 (K1+K4) — rational firm-level hiring destroys the economy-wide skill pipeline; surfaces as a senior-talent crisis in the 2030s." },
  { id: "P6", label: "The liar's dividend — real evidence becomes deniable", domain: "discernment", type: "risk", magnitude: 80, evidence: "medium", tier: "suspect", basis: "D3 R1 — courts, journalism, and elections lose a shared evidentiary floor; humans already detect deepfakes at chance (Diel 2024)." },
  { id: "P7", label: "Tacit-knowledge broadcast — decade-long learning curves compressed to years", domain: "labor", type: "opportunity", magnitude: 76, evidence: "high", tier: "know", basis: "D5 O1 (K1 mechanism) — AI bottles top-performer judgment; the cheapest training technology ever built." },
  { id: "P8", label: "Attachment-formation interference in the 13–25 window", domain: "mentalHealth", type: "risk", magnitude: 74, evidence: "low", tier: "suspect", basis: "D4 R1 — 72% teen exposure (Tier-1 fact) during attachment formation, zero longitudinal data; harm is Tier-2 inference." },
  { id: "P9", label: "Inoculation + AI debunking — discernment teachable for pennies", domain: "discernment", type: "opportunity", magnitude: 72, evidence: "high", tier: "know", basis: "D3 O1/O2 — inoculation works at field scale ($0.05/view, 5.4M users); personalized AI dialogue durably reduces conspiracy belief (DebunkBot)." },
  { id: "P10", label: "Cultural homogenization at civilizational scale", domain: "creativity", type: "risk", magnitude: 70, evidence: "medium", tier: "suspect", basis: "D2 R1 (S1/S5) — more content, narrower distribution, compounding through model-retraining feedback loops." },
  { id: "P11", label: "True creative democratization for populations priced out of creative industries", domain: "creativity", type: "opportunity", magnitude: 68, evidence: "high", tier: "know", basis: "D2 O1 (K1) — the same tool raises individual floors; largest effect for Africa and LatAm youth." },
  { id: "P12", label: "A scarred cohort — today's 19–25s absorb permanent lifetime-earnings damage", domain: "labor", type: "risk", magnitude: 66, evidence: "medium", tier: "suspect", basis: "D5 R2 (K4) — −13% relative employment in AI-exposed occupations, hit in the window careers compound." },
  { id: "P13", label: "Verification atrophy in professions — judgment erodes from overtrust", domain: "cognition", type: "risk", magnitude: 62, evidence: "medium", tier: "suspect", basis: "D1 R2 + D5 K3 — checking decays faster than error rates; miscalibrated trust at the jagged frontier is measured and costly." },
  { id: "P14", label: "The curation economy — taste and editorial judgment as the new mass creative profession", domain: "creativity", type: "opportunity", magnitude: 58, evidence: "medium", tier: "suspect", basis: "D2 O2 (K3+S2) — generation is no longer the scarce step; value migrates to problem-finding and taste." },
  { id: "P15", label: "Frontier-judgment education — teaching when NOT to use AI", domain: "labor", type: "opportunity", magnitude: 55, evidence: "medium", tier: "suspect", basis: "D5 O3 — a definable, certifiable, high-demand skill; first-mover space for education systems and employers." },
];

// ---------------------------------------------------------------------------
// Future personas — Viz 2. Tier 3 ILLUSTRATIVE narratives, each grounded in the
// cohort matrix (06 §1); per-scenario arcs read off 07 §3–§5.
// ---------------------------------------------------------------------------

export interface Persona {
  id: string;
  name: string;
  cohort: CohortId;
  age2026: number;
  role: string;
  region: RegionId;
  tagline: string;
  tier: Tier; // always "imagine"
  arcs: Record<ScenarioId, string>;
  groundedIn: string;
}

export const PERSONAS: Persona[] = [
  {
    id: "maya",
    name: "Maya",
    cohort: "adolescents",
    age2026: 15,
    role: "Secondary-school student",
    region: "northAmerica",
    tagline: "Every faculty she'll rely on at 35 is forming right now, inside whichever AI mode wins her school district.",
    tier: "imagine",
    arcs: {
      A: "Her district adopted tutor-mode AI with unassisted-reasoning assessments. At 25 (2036) she's part of the best-educated cohort in history — AI-fluent and anchored to foundations she built herself.",
      B: "Her outcomes depend on her zip code: a well-funded district gives her steered defaults; the district one town over runs answer-engine homework apps. By 2036 the gap between her and her cousin is a capability gap, not a grade gap.",
      C: "Engagement-optimized apps won her formative decade. At 25 she's highly productive with AI and measurably weaker without it — unassisted reasoning has become something her generation's elite kept and most lost.",
    },
    groundedIn: "Cohort matrix: cognitive development ▼▼ 🟠, dependency risk ▼▼ 🟢 (highest in all five domains); 72% companion exposure (D4 K5).",
  },
  {
    id: "dev",
    name: "Dev",
    cohort: "emergingAdults",
    age2026: 23,
    role: "Junior software & content freelancer",
    region: "asiaPacific",
    tagline: "The canary: AI makes him 34% more productive at the exact moment the entry-level rung he's standing on is being removed.",
    tier: "imagine",
    arcs: {
      A: "Firms redesigned junior roles around AI-direction rather than deleting them. He enters as an AI-director on day one; simulated apprenticeship rebuilds what learning-by-doing used to teach.",
      B: "He leapfrogs the missing junior rung through unpaid portfolio-building his family could afford to support. Peers without that cushion drift into the prompt-operating class — same talent, different cover.",
      C: "The BPO/services ladder his economy industrialized on contracts before he can climb it. His career start is delayed years; the data will show his cohort's scar a decade later.",
    },
    groundedIn: "Cohort matrix: career resilience ▼▼ 🟡 (the canaries, D5 K4 −13%); creativity ▼ (apprenticeship rungs first automated, D2 K4); APAC BPO foreclosure risk (D5 S5).",
  },
  {
    id: "amara",
    name: "Amara",
    cohort: "primeWorkforce",
    age2026: 34,
    role: "Marketing team lead, mid-size firm",
    region: "europe",
    tagline: "The accidental winner: pre-AI foundations she didn't choose, plus AI leverage she didn't build.",
    tier: "imagine",
    arcs: {
      A: "She becomes the curator-director the optimistic economy rewards: judgment formed before AI, output multiplied by it. Her verification habits stay sharp because her tools were designed to keep her in the loop.",
      B: "She captures the widening judgment premium while quietly losing the generation-stage skills she came up on. Comfortable — as long as she never has to work without the tools again.",
      C: "Years of frictionless delegation erode the verification capacity that justified her seniority. When the rare high-cost AI failure lands on her desk, she no longer catches it.",
    },
    groundedIn: "Cohort matrix: learning ▲▲, career resilience ▲ (judgment premium, D5 S2), risk = verification atrophy (D1 S4) and miscalibrated trust (D5 K3).",
  },
  {
    id: "carlos",
    name: "Carlos",
    cohort: "experiencedWorkforce",
    age2026: 52,
    role: "Small-business owner",
    region: "latinAmerica",
    tagline: "Lowest dependency risk on the chart — and the primary target of the manipulation economy.",
    tier: "imagine",
    arcs: {
      A: "Provenance labels and verified-channel norms reach his WhatsApp-first information world. AI removes production bottlenecks in his business without threatening the experience that differentiates him.",
      B: "His business benefits from near-parity Spanish-language AI; meanwhile voice-clone fraud professionalizes faster than verification reaches closed channels. He's fine — his less-connected peers increasingly are not.",
      C: "The trust heuristics he calibrated on institutional media fail against synthetic voices of people he knows. He stops believing real evidence too — the liar's dividend, paid by the people with the least tooling.",
    },
    groundedIn: "Cohort matrix: cognitive development ▲ 🟢, dependency risk lowest — but medium-high manipulation risk (D3); LatAm closed-channel epistemics −− (06 §3).",
  },
];

// ---------------------------------------------------------------------------
// Time Travel Simulator — Viz 1. Composite capability index per cohort × scenario.
// THESE NUMBERS ARE TIER-3 ILLUSTRATIVE: a qualitative-to-quantitative rendering of
// the cohort matrix (real, Tier 2) shaped by the scenario narratives (Tier 3).
// Index: 2026 = 50 baseline for every cohort. The CURVES communicate direction and
// divergence, not measured magnitudes. The viz must say so on its face.
// ---------------------------------------------------------------------------

export interface TrajectoryPoint {
  year: 2026 | 2031 | 2036 | 2041 | 2046;
  index: number;
}

export interface CohortTrajectory {
  cohort: CohortId;
  scenario: ScenarioId;
  points: TrajectoryPoint[];
  note: string;
}

export const TRAJECTORY_DISCLAIMER =
  "Illustrative (Tier 3 — What We Imagine). These curves render the qualitative cohort matrix and scenario narratives as directions, not measurements. 2026 = 50 by construction. No study produces a composite human-capability index; treat shape and divergence as the claim, never the numbers.";

export const TRAJECTORIES: CohortTrajectory[] = [
  // Scenario A — The Steered Decade: gains across cohorts, largest for the young (steered formation)
  { cohort: "adolescents", scenario: "A", note: "Best-educated cohort in history under steered defaults (07 §3).", points: [ { year: 2026, index: 50 }, { year: 2031, index: 55 }, { year: 2036, index: 63 }, { year: 2041, index: 69 }, { year: 2046, index: 74 } ] },
  { cohort: "emergingAdults", scenario: "A", note: "Junior roles redesigned as AI-direction; ladder rebuilt via simulated apprenticeship.", points: [ { year: 2026, index: 50 }, { year: 2031, index: 54 }, { year: 2036, index: 60 }, { year: 2041, index: 65 }, { year: 2046, index: 68 } ] },
  { cohort: "primeWorkforce", scenario: "A", note: "Symbiosis sweet spot compounds: judgment premium + tools that keep humans in the loop.", points: [ { year: 2026, index: 50 }, { year: 2031, index: 56 }, { year: 2036, index: 62 }, { year: 2041, index: 66 }, { year: 2046, index: 68 } ] },
  { cohort: "experiencedWorkforce", scenario: "A", note: "Augmented finish; provenance norms blunt the manipulation exposure.", points: [ { year: 2026, index: 50 }, { year: 2031, index: 53 }, { year: 2036, index: 56 }, { year: 2041, index: 57 }, { year: 2046, index: 57 } ] },
  // Scenario B — The Great Split: flat-ish means; the INDEX SHOWN IS THE MEAN — band notes carry the variance story
  { cohort: "adolescents", scenario: "B", note: "Mean flat, variance wide: steered minority gains, delegating majority declines — the defining B pattern.", points: [ { year: 2026, index: 50 }, { year: 2031, index: 50 }, { year: 2036, index: 51 }, { year: 2041, index: 51 }, { year: 2046, index: 52 } ] },
  { cohort: "emergingAdults", scenario: "B", note: "Task-level gains offset by the missing first rung; mobility worse, employment fine.", points: [ { year: 2026, index: 50 }, { year: 2031, index: 49 }, { year: 2036, index: 50 }, { year: 2041, index: 51 }, { year: 2046, index: 52 } ] },
  { cohort: "primeWorkforce", scenario: "B", note: "Captures the judgment premium even in the split — the cohort B treats best.", points: [ { year: 2026, index: 50 }, { year: 2031, index: 53 }, { year: 2036, index: 56 }, { year: 2041, index: 58 }, { year: 2046, index: 59 } ] },
  { cohort: "experiencedWorkforce", scenario: "B", note: "Bifurcates: judgment-amplified members finish strong, role-absorbed members face the worst retraining math.", points: [ { year: 2026, index: 50 }, { year: 2031, index: 50 }, { year: 2036, index: 50 }, { year: 2041, index: 49 }, { year: 2046, index: 49 } ] },
  // Scenario C — The Dependency Compound: declines led by the young (formative-window deficits)
  { cohort: "adolescents", scenario: "C", note: "Formative-window deficits at scale; unassisted capability becomes class-stratified (07 §5).", points: [ { year: 2026, index: 50 }, { year: 2031, index: 46 }, { year: 2036, index: 41 }, { year: 2041, index: 38 }, { year: 2046, index: 36 } ] },
  { cohort: "emergingAdults", scenario: "C", note: "Scarred cohort: delayed starts compound; judgment never forms because the work that taught it is gone.", points: [ { year: 2026, index: 50 }, { year: 2031, index: 46 }, { year: 2036, index: 43 }, { year: 2041, index: 41 }, { year: 2046, index: 40 } ] },
  { cohort: "primeWorkforce", scenario: "C", note: "Slow verification atrophy: capability erodes from overtrust, visible only when rare failures land.", points: [ { year: 2026, index: 50 }, { year: 2031, index: 49 }, { year: 2036, index: 47 }, { year: 2041, index: 45 }, { year: 2046, index: 43 } ] },
  { cohort: "experiencedWorkforce", scenario: "C", note: "Cognitive foundation holds; manipulation exposure compounds as the liar's dividend grows.", points: [ { year: 2026, index: 50 }, { year: 2031, index: 49 }, { year: 2036, index: 48 }, { year: 2041, index: 46 }, { year: 2046, index: 45 } ] },
];

// ---------------------------------------------------------------------------
// Thesis — 08_thesis.md (Tier 2 🟡 by the demotion rule)
// ---------------------------------------------------------------------------

export const THESIS = {
  oneLine:
    "Augmentation, dependency, and coexistence is a false trichotomy as forecast — all three are true now, of different populations, using the same technology; the distribution is set by four institutional variables (M1–M4), not by model capability.",
  confidence: "medium" as Confidence,
  corollaries: [
    "Design objective decides direction: the same model tuned for outcomes augments and tuned for retention breeds dependency.",
    "Distribution follows institutional cover and developmental stage: strong institutions + formed faculties → augmentation; weak institutions + forming faculties → dependency.",
    "Coexistence stratifies rather than equilibrates: without intervention, the augmented and dependent populations diverge — capability inequality becomes a standing policy domain.",
  ],
  source: "08_thesis.md",
};

export const EVIDENCE_NOTE =
  "Compiled from a 10-document research corpus (2026-06-11) with 30 live-verified Tier-1 source sets across 5 domains. The corpus markdown (Human-Evolution-AI/research/) always takes precedence over any cell, score, or curve in this file.";
