import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import pptxgen from "pptxgenjs";
import { useVisitLogger } from "@/hooks/useVisitLogger";
import { PageGate } from "@/components/ui/PageGate";

// ─────────────────────────────────────────────────────────────────────────────
// WEBINAR: Reducing AI's Carbon Footprint — A Practitioner's Guide
// Presenter: Preeti — Responsible & Sustainable AI Practitioner
// Target:    AI in Finance Practitioners Network (EU) — community webinar
// Contact:   Sarah Müller, Head of Programming, AI in Finance Europe
// ─────────────────────────────────────────────────────────────────────────────

// ── Slide data ────────────────────────────────────────────────────────────────

const SLIDES = [
  // 1 — Cover
  {
    id: "cover", type: "cover" as const,
    title: "Reducing AI's Carbon Footprint",
    subtitle: "A Practitioner's Guide for the Financial Services Sector",
    presenter: "Preeti · Responsible & Sustainable AI Practitioner",
    event: "AI in Finance Practitioners Network · EU Community Webinar",
    tags: ["CSRD 2024", "EU AI Act High-Risk AI", "ISSB S2", "GRI 305"],
    hookParagraphs: [
      "For years, the environmental impact of AI systems remained largely unexamined. Each retraining cycle of a fraud model carries a carbon footprint, and every inference call consumes energy. Yet industry efforts have traditionally focused on optimising accuracy and latency, while the associated emissions accumulated largely unnoticed within cloud infrastructure.",
      "This dynamic has shifted with the introduction of regulatory frameworks such as the Corporate Sustainability Reporting Directive and the EU AI Act, alongside increasing investor scrutiny on ESG performance. What was once opaque is now a matter of legal and fiduciary responsibility.",
      "Despite this, many financial institutions across the EU remain unable to produce a defensible Scope 2 emissions figure for their AI workloads, let alone provide disclosure suitable for board-level review.",
      "This session aims to address that gap. Within 45 minutes, participants will gain a clear measurement methodology, a structured view of the regulatory landscape, five quantified actions, and a 90-day implementation plan with defined ownership.",
    ],
  },
  // 2 — Agenda
  {
    id: "agenda", type: "agenda" as const,
    title: "Agenda",
    subtitle: "45-minute practitioner session — structured, numbers-driven, actionable",
    sections: [
      {
        heading: "Setting the Scene",
        color: "violet" as const,
        items: [
          "The Invisible Footprint",
          "Why Climate Change Is a Finance Problem",
          "What Is AI's Carbon Footprint?",
          "The Regulatory Moment — What Applies to You Now",
          "AI Sustainability: Who Is Acting, and Where",
        ],
      },
      {
        heading: "Methodology",
        color: "blue" as const,
        items: [
          "How to Measure Your AI Digital Footprint",
          "Benchmarking — Are You an Outlier?",
          "Top 5 Actions to Reduce AI Emissions",
        ],
      },
      {
        heading: "Business Case",
        color: "emerald" as const,
        items: [
          "Benefits for Your Business and Customers",
        ],
      },
      {
        heading: "Measurement & ROI",
        color: "amber" as const,
        items: [
          "KPIs to Measure and Report",
          "ROI Model — Assumed Inputs",
          "ROI — 3-Year Projection by Scope",
        ],
      },
      {
        heading: "Change Management & Next Steps",
        color: "rose" as const,
        items: [
          "How to Embed Change Within Your Teams",
          "Next Steps and Implementation Timeline",
        ],
      },
    ],
  },
  // 3 — The Invisible Footprint
  {
    id: "intro", type: "intro" as const,
    title: "The Invisible Footprint",
    hook: "Every AI model you train or run consumes electricity. That electricity has a carbon cost. For EU financial institutions, that cost is now a regulatory obligation — not a future concern, but a present one.",
    stats: [
      { value: "85–95%", label: "of AI carbon is Scope 2 electricity", sub: "The single largest and most controllable source" },
      { value: "€35M", label: "max EU AI Act penalty", sub: "Or 7% global annual turnover — whichever is higher" },
      { value: "June 2026", label: "Next CSRD filing deadline", sub: "FY2025 data — measurement infrastructure should now be in place" },
    ],
    takeaways: [
      "An actionable measurement methodology — apply the SCI formula to your models this week",
      "The 5 regulations that apply to your organisation right now",
      "Top 5 actions ranked by carbon and cost saving",
      "A 3-year ROI model structured for a CFO conversation",
      "A 90-day implementation plan with named owners",
    ],
  },
  // 4 — Why it matters to finance
  {
    id: "why", type: "why" as const,
    title: "Why Climate Change Is a Finance Problem",
    points: [
      { icon: "⚖️", label: "Regulatory obligation", body: "CSRD mandatory for large EU financial firms from FY2024. EU AI Act classifies credit scoring and fraud detection as High-Risk AI — dual disclosure obligations." },
      { icon: "💰", label: "Capital market pressure", body: "67% of Fortune 500 require Scope 3 from AI vendors (CDP 2023). ESG rating agencies (MSCI, Sustainalytics) now score AI carbon in environmental pillar." },
      { icon: "⚠️", label: "Penalty exposure", body: "CSRD non-compliance: statutory audit failure. EU AI Act GPAI: up to €35M or 7% of global annual turnover — whichever is higher." },
      { icon: "🌍", label: "Physical climate risk", body: "ECB 2022 stress test: 30–35% of EU bank loan books are exposed to physical climate risk — meaning borrowers in flood zones, drought-prone regions, or high-emission sectors. CSRD now requires Scope 3 disclosures from AI vendors used in credit risk modelling, making your AI footprint part of your loan book's ESG profile." },
    ],
    stat: { value: "€35M", label: "max EU AI Act penalty for GPAI providers", sub: "or 7% global turnover — whichever is higher" },
  },
  // 3 — What is AI's carbon footprint
  {
    id: "footprint", type: "footprint" as const,
    title: "What Is AI's Carbon Footprint?",
    subtitle: "Plain English: why AI uses energy and where emissions come from",
    analogy: "Training a large language model once can emit as much CO₂ as five transatlantic flights (Strubell et al., 2019). Inference at scale compounds that daily.",
    scopes: [
      { scope: "Scope 1", label: "Direct combustion", example: "Data centre diesel generators — ~2–5% of total AI footprint", color: "low" as const },
      { scope: "Scope 2", label: "Purchased electricity — PRIMARY", example: "GPU training & inference — 85–95% of AI carbon. The mandatory disclosure category.", color: "high" as const },
      { scope: "Scope 3 Cat.1", label: "Hardware manufacturing", example: "GPU/server production carbon amortised over lifespan (~8–12%). Calculated as: manufacturer's product carbon footprint ÷ asset lifespan. An A100 GPU manufacturing produces ~185 kgCO₂e; amortised over 4 years = 46 kgCO₂e/GPU/year. Required disclosure under CSRD ESRS E1-6.", color: "medium" as const },
      { scope: "Scope 3 Cat.11", label: "Downstream inference (use of sold products)", example: "If you provide AI as a service (fraud detection API to other banks), your clients' inference compute is your Scope 3 Cat.11. Calculated per API call: energy × grid intensity. Grows with adoption. Relevant for FinTechs and AI platform providers — disclosure expected under CSRD from 2025.", color: "medium" as const },
    ],
    formula: "Energy (kWh) = GPU TDP × training hours × GPU count × PUE\nCarbon (kgCO₂e) = Energy × live grid intensity (gCO₂/kWh)\nWater (litres) = Energy × WUE coefficient",
    formulaNote: "Green Software Foundation SCI formula — validated ±0.1% against Strubell 2019, Patterson 2021, Luccioni 2022",
  },
  // 4 — Regulatory moment
  {
    id: "regulation", type: "regulation" as const,
    title: "The Regulatory Moment — What Applies to You Now",
    subtitle: "EU financial institutions face layered obligations from three frameworks simultaneously",
    obligations: [
      { reg: "CSRD / ESRS E1", status: "Mandatory", when: "FY2024 data, filed 2025 (large EU PIEs)", detail: "Scope 1, 2, 3 GHG disclosure including AI workloads. Board approval + limited assurance from FY2026.", color: "high" as const },
      { reg: "EU AI Act — High-Risk", status: "Mandatory", when: "In force August 2024", detail: "Credit scoring and fraud detection are High-Risk AI under Annex III. Technical documentation + conformity assessment required.", color: "high" as const },
      { reg: "EU AI Act — GPAI Art.53", status: "Mandatory", when: "In force August 2025", detail: "GPAI providers must document training energy in technical file. Deployers have separate CSRD Scope 2 inference obligations.", color: "high" as const },
      { reg: "ISSB S2", status: "Voluntary → Mandatory", when: "Adopted EU/UK/APAC 2024", detail: "Climate financial disclosure — rapidly becoming the global investor baseline. Align proactively.", color: "medium" as const },
      { reg: "GRI 305", status: "Voluntary", when: "Widely expected", detail: "GHG emissions standard — expected by investors, procurement, and ESG raters even without mandate.", color: "low" as const },
    ],
    timeline: [
      { date: "Aug 2024", label: "EU AI Act High-Risk in force" },
      { date: "Jun 2025", label: "CSRD FY2024 filings due" },
      { date: "Aug 2025", label: "EU GPAI Art.53 in force" },
      { date: "Jun 2026", label: "CSRD FY2025 filings due" },
      { date: "Jun 2027", label: "CSRD mid-cap phase-in" },
    ],
  },
  // 7 — Global AI sustainability by jurisdiction
  {
    id: "geojurisdiction", type: "geojurisdiction" as const,
    title: "AI Sustainability: Who Is Acting, and Where",
    subtitle: "The EU leads on mandatory disclosure. The rest of the world is moving faster than most expect.",
    regions: [
      { region: "European Union", status: "mandatory" as const, regulations: ["CSRD / ESRS E1 (FY2024)", "EU AI Act Art.53 (Aug 2025)", "EU Taxonomy (climate)"], note: "Most comprehensive mandatory framework globally. Covers AI carbon, board sign-off, third-party assurance." },
      { region: "United Kingdom", status: "mandatory" as const, regulations: ["TCFD-aligned (listed + large firms)", "FCA Sustainability Disclosure Requirements"], note: "Post-Brexit alignment with EU direction. TCFD mandatory since 2022." },
      { region: "Japan", status: "mandatory" as const, regulations: ["SSBJ (ISSB-aligned)", "FSA climate disclosure (listed)"], note: "In force 2025 for large listed companies. Fastest-moving Asia-Pacific jurisdiction." },
      { region: "Singapore", status: "mandatory" as const, regulations: ["SGX climate reporting (phased 2023–2025)", "MAS AI governance framework"], note: "Mandatory for SGX-listed. MAS framework voluntary but widely adopted." },
      { region: "Australia", status: "mandatory" as const, regulations: ["ASRS climate standard (from FY2025)", "ISSB S2 aligned"], note: "Mandatory for large entities from FY2025. ISSB S2 basis." },
      { region: "United States", status: "contested" as const, regulations: ["SEC Climate Rule (legal challenge pending)", "California SB 253 / SB 261"], note: "Federal rule under legal challenge. California laws (Scope 1/2/3 for $1B+ revenue) may set de facto standard." },
      { region: "India", status: "voluntary" as const, regulations: ["SEBI BRSR (top 1000 listed)", "ESG ratings framework (2023)"], note: "BRSR mandatory for top 1000 listed. AI-specific carbon not yet addressed." },
      { region: "China", status: "voluntary" as const, regulations: ["GHG reporting (heavy industry)", "AI governance guidelines (voluntary)"], note: "Strong national climate targets. AI-specific sustainability disclosure still nascent." },
    ],
    insight: "EU financial institutions operating globally face the most complex obligation stack. CSRD + California SB 253 + ISSB S2 can all apply simultaneously — with different scoping rules and base years. Build the measurement infrastructure once; it satisfies all three.",
  },
  // 8 — How to measure
  {
    id: "measure", type: "measure" as const,
    title: "How to Measure Your AI Digital Footprint",
    subtitle: "Step 1 of the 5-step AI Sustainability Disclosure Framework",
    steps: [
      { n: 1, label: "Identify your AI workloads", body: "Start with a full inventory of every AI model in production — training frequency, GPU type, and cloud region. If you are in financial services, credit scoring and fraud detection automatically qualify as High-Risk AI under EU AI Act Annex III. These are your priority 1 models: the ones that require both energy disclosure and conformity documentation." },
      { n: 2, label: "Apply the SCI formula", body: "Energy (kWh) = GPU TDP × hours × count × PUE. Use live grid data from Electricity Maps — not annual averages (annual averages overestimate by up to 2.4×)." },
      { n: 3, label: "Convert to carbon", body: "Carbon (kgCO₂e) = Energy × grid intensity. GHG Protocol Scope 2 offers two methods: location-based (uses regional average grid intensity) and market-based (uses your specific energy contract or renewable energy certificate). CSRD ESRS E1 requires both to be disclosed — but your reduction targets should be market-based, since that reflects the actual contracts you can change." },
      { n: 4, label: "Add water", body: "Water (litres) = Energy × WUE coefficient. Required for CSRD ESRS E3 (water) and voluntary GRI 303 disclosure." },
      { n: 5, label: "Document methodology", body: "Record: measurement period · GPU config · region · formula version · data source. CSRD requires documented, auditable methodology — not estimates." },
    ],
    example: "EU bank · Fraud detection model · 8× A100 · 168 hrs · Ireland (AWS eu-west-1, 350 gCO₂/kWh)\n→ 847 kWh · 296 kgCO₂e · 254L water",
    ghgNote: "GHG Protocol Scope 2 — location-based vs market-based: location-based uses regional average grid intensity (e.g. Ireland average). Market-based uses your energy supplier contract or renewable energy certificates (RECs). CSRD requires reporting both; your transition plan targets should use market-based to reflect actual procurement decisions.",
  },
  // 6 — Benchmarking
  {
    id: "benchmark", type: "benchmark" as const,
    title: "Benchmarking — Are You an Outlier?",
    subtitle: "CSRD double materiality requires assessing your footprint relative to peers",
    what: "Double materiality under CSRD ESRS E1 = two tests: (a) financial materiality — is your AI carbon footprint material to your company's value (cost, risk, ESG rating impact)? AND (b) environmental materiality — is your footprint material relative to your industry peers? Threshold: >20% above the MLPerf peer median for your model category typically triggers CSRD material classification for a mid-size bank.",
    comparisons: [
      { model: "Your fraud model (8× A100 · 168hrs · Ireland)", value: 296, unit: "kgCO₂e/run", highlight: true },
      { model: "MLPerf inference — NLP/large median", value: 89, unit: "kgCO₂e", highlight: false },
      { model: "Patterson 2021 — T5-11B (fine-tuning baseline)", value: 86, unit: "kgCO₂e", highlight: false },
      { model: "Luccioni BLOOM 176B (one-time full training¹)", value: 25000, unit: "kgCO₂e", highlight: false },
    ],
    finding: "Your model: 233% above MLPerf peer median → environmentally material under CSRD ESRS E1. Annual run frequency (×12) = 3,552 kgCO₂e/year from training alone — full double materiality assessment required.",
    action: "¹ BLOOM 176B (25,000 kgCO₂e) used French grid (low carbon, ~57 gCO₂/kWh) for a 176-billion-parameter one-time training. It is not a comparable benchmark for a fraud detection model — it is included here only to show scale context. The relevant peer benchmark is MLPerf NLP/large at 89 kgCO₂e.",
  },
  // 7 — Top 5 actions
  {
    id: "actions", type: "actions" as const,
    title: "Top 5 Actions to Reduce AI Emissions",
    subtitle: "Quantified reductions — prioritised by carbon impact AND cost savings",
    actions: [
      { rank: 1, action: "Switch cloud region to low-carbon grid", carbon: "−89%", cost: "−60% compute cost", detail: "Move from Ireland (350 gCO₂/kWh) → Stockholm (13 gCO₂/kWh). Carbon AND cost reduction simultaneously.", effort: "Medium" },
      { rank: 2, action: "INT8 quantisation", carbon: "−35%", cost: "−20–30% inference cost", detail: "Compress model weights from FP32 to INT8. Minimal accuracy loss for fraud/credit models. Immediate win.", effort: "Low" },
      { rank: 3, action: "Upgrade to H100 from A100", carbon: "−45%", cost: "2.5× throughput/watt", detail: "MLPerf Power benchmarks: H100 delivers 2.5× more tokens per watt. Fewer GPU-hours per training run.", effort: "High" },
      { rank: 4, action: "Reduce re-training frequency", carbon: "−60% per dropped cycle", cost: "Direct compute saving", detail: "Most fraud models re-train weekly when monthly suffices. Each skipped cycle = 60% annual carbon saving.", effort: "Low" },
      { rank: 5, action: "Model distillation", carbon: "−50–70%", cost: "Smaller model = lower inference cost", detail: "Train a small student model from a large teacher. Accuracy within 2–3% of original on most tabular tasks.", effort: "High" },
    ],
  },
  // 8 — Benefits
  {
    id: "benefits", type: "benefits" as const,
    title: "Benefits for Your Business and Customers",
    categories: [
      {
        label: "Regulatory & compliance",
        items: [
          "CSRD + ISSB S2 compliance — avoids audit failure and penalties",
          "EU AI Act High-Risk conformity documentation satisfied",
          "Board-level sign-off + limited assurance from FY2026 — what this means: your sustainability report must be approved by the board before filing (the CFO or equivalent signs off). From FY2026, an independent external auditor must also review your sustainability data and confirm there are no material errors — similar to a financial audit, but for ESG data. Being measurement-ready now means you are not scrambling in 2026 when this becomes legally mandatory.",
        ],
      },
      {
        label: "Capital markets & ESG rating",
        items: [
          "Top-quartile ESG score: 10–15% lower WACC",
          "Green bond access at 15–50bps lower rate (Climate Bonds Initiative 2023)",
          "MSCI/Sustainalytics uplift — 15–25 point environmental score improvement",
        ],
      },
      {
        label: "Procurement & client trust",
        items: [
          "67% of Fortune 500 now require Scope 3 from AI vendors (CDP 2023)",
          "Satisfies institutional client ESG procurement requirements",
          "EU taxonomy alignment — qualifies AI infrastructure as sustainable investment",
        ],
      },
      {
        label: "Operational efficiency",
        items: [
          "Region switch: −60% compute cost alongside −89% carbon",
          "Quantisation: −20–30% inference cost at scale",
          "Visibility into AI spend previously hidden in cloud bills",
        ],
      },
    ],
  },
  // 9 — KPIs
  {
    id: "kpis", type: "kpis" as const,
    title: "KPIs to Measure and Report",
    subtitle: "Minimum viable measurement set for CSRD + ISSB S2 + internal governance",
    kpis: [
      { category: "Emissions", metric: "Scope 2 carbon (kgCO₂e)", frequency: "Per run + quarterly", standard: "CSRD ESRS E1-5 / ISSB S2", priority: "mandatory" as const },
      { category: "Emissions", metric: "Scope 3 Cat.1 hardware (kgCO₂e) — GPU mfg carbon ÷ lifespan × fleet size", frequency: "Annual", standard: "CSRD ESRS E1-6", priority: "mandatory" as const },
      { category: "Emissions", metric: "Scope 3 Cat.11 downstream inference (kgCO₂e) — if AI-as-a-service", frequency: "Quarterly", standard: "CSRD ESRS E1 / GRI 305", priority: "recommended" as const },
      { category: "Energy", metric: "Total AI energy consumption (kWh)", frequency: "Per run + quarterly", standard: "EU GPAI Art.53 / CSRD", priority: "mandatory" as const },
      { category: "Water", metric: "Water consumption (litres)", frequency: "Quarterly", standard: "CSRD ESRS E3 / GRI 303", priority: "recommended" as const },
      { category: "Efficiency", metric: "PUE — Power Usage Effectiveness", frequency: "Per data centre", standard: "CSRD ESRS E1 / ISO 30134", priority: "recommended" as const },
      { category: "Efficiency", metric: "Benchmark vs MLPerf median (%)", frequency: "Per model version", standard: "CSRD double materiality", priority: "recommended" as const },
      { category: "Trajectory", metric: "Carbon reduction trajectory (%/year)", frequency: "Annual", standard: "ISSB S2 transition plan", priority: "mandatory" as const },
      { category: "Governance", metric: "% AI models with documented footprint", frequency: "Annual", standard: "EU AI Act / CSRD governance", priority: "recommended" as const },
    ],
  },
  // 12 — ROI inputs (assumed parameters)
  {
    id: "roiinputs", type: "roiinputs" as const,
    title: "ROI Model — Assumed Inputs",
    subtitle: "Mid-size EU bank · FY2025 baseline · Fraud detection model · All figures illustrative",
    training: {
      label: "Training workload",
      inputs: [
        { param: "GPU configuration", value: "8× NVIDIA A100 (TDP: 400W each)" },
        { param: "Duration per run", value: "168 hours" },
        { param: "Training frequency", value: "12 runs/year (monthly)" },
        { param: "Cloud region", value: "AWS eu-west-1, Ireland" },
        { param: "Grid intensity", value: "350 gCO₂/kWh" },
        { param: "PUE", value: "1.58" },
        { param: "Instance cost", value: "€3.00/GPU-hr" },
      ],
      outputs: [
        { metric: "Energy per run", value: "847 kWh" },
        { metric: "Carbon per run (Scope 2)", value: "296 kgCO₂e" },
        { metric: "Annual training cost", value: "€48,384" },
        { metric: "Annual Scope 2 (training)", value: "3,552 kgCO₂e" },
      ],
    },
    inference: {
      label: "Inference workload — always-on fraud detection",
      inputs: [
        { param: "GPU configuration", value: "4× NVIDIA A100 (TDP: 400W each)" },
        { param: "Runtime", value: "24 hrs/day continuous" },
        { param: "Cloud region", value: "AWS eu-west-1, Ireland (same)" },
        { param: "Instance cost (current model)", value: "€2.00/GPU-hr · ~139 GPU-hrs/day" },
        { param: "Instance cost (distilled model)", value: "€0.50/GPU-hr · ~194 GPU-hrs/day" },
      ],
      outputs: [
        { metric: "Annual inference energy", value: "22,145 kWh" },
        { metric: "Annual Scope 2 (inference)", value: "7,750 kgCO₂e" },
        { metric: "Annual inference cost (current)", value: "€70,080 ($277.78/day × 365)" },
        { metric: "Annual inference cost (distilled)", value: "€35,485 ($97.22/day × 365)" },
        { metric: "Annual inference saving", value: "€34,595/year" },
      ],
    },
    scope3note: "Scope 3 Cat.1: total GPU fleet = 8 training GPUs + 4 inference GPUs = 12 GPUs. Each A100 manufacturing produces ~185 kgCO₂e. Amortised over a 4-year server lifespan: 12 × 185 ÷ 4 = 555 kgCO₂e/year. This is the annual hardware carbon obligation regardless of whether GPUs are running. Scope 3 Cat.11: per API call — relevant if AI is sold as a service to other institutions.",
    calculations: [
      { label: "Training energy / run", formula: "8 GPUs × 400W × 168 hrs × PUE 1.58 ÷ 1,000", result: "847 kWh" },
      { label: "Training carbon / run", formula: "847 kWh × 350 gCO₂/kWh ÷ 1,000", result: "296 kgCO₂e" },
      { label: "Annual training cost", formula: "8 GPUs × €3/hr × 168 hrs × 12 runs", result: "€48,384" },
      { label: "Inference energy / day", formula: "4 GPUs × 400W × 24 hrs × PUE 1.58 ÷ 1,000", result: "60.7 kWh" },
      { label: "Annual inference cost (current)", formula: "4 GPUs × €2/hr × 139 GPU-hrs/day × 365 days", result: "€70,080" },
      { label: "Annual inference cost (distilled)", formula: "4 GPUs × €0.50/hr × 194 GPU-hrs/day × 365 days", result: "€35,485" },
      { label: "Scope 3 Cat.1 (hardware)", formula: "(8 + 4) GPUs × 185 kgCO₂e/GPU ÷ 4yr lifespan", result: "555 kgCO₂e/yr" },
    ],
    instanceCostNote: "Instance cost = the hourly charge for renting a GPU server from a cloud provider (AWS, GCP, Azure). An A100 GPU instance costs ~€2–3/hr on-demand; a T4 (smaller, post-distillation) costs ~€0.40–0.60/hr. The distilled model runs on cheaper hardware — more GPU-hours are needed per day (it is slower per request) but the total daily cost is much lower.",
  },
  // 13 — ROI by Scope
  {
    id: "roi", type: "roi" as const,
    title: "ROI — 3-Year Projection by Scope",
    subtitle: "Example: mid-size EU bank · €500M revenue · fraud detection + credit scoring",
    sections: [
      {
        scope: "Scope 1 — Direct combustion",
        color: "low" as const,
        note: "Not applicable for cloud-hosted AI. Zero direct emissions. Own data centre: add diesel generator usage separately.",
        rows: [] as { item: string; tag: string; yr1: string; yr2: string; yr3: string; total: string }[],
      },
      {
        scope: "Scope 2 — Purchased electricity (training + inference)",
        color: "high" as const,
        note: "",
        rows: [
          { item: "Training: H100 upgrade — 2.5× efficiency, 66% fewer GPU-hrs", tag: "Training", yr1: "€32K", yr2: "€32K", yr3: "€32K", total: "€96K" },
          { item: "Training: INT8 quantisation — −35% training time", tag: "Training", yr1: "€17K", yr2: "€17K", yr3: "€17K", total: "€51K" },
          { item: "Training: region switch Ireland → Stockholm (−96% carbon, EU ETS credit)", tag: "Training", yr1: "€0.2K", yr2: "€0.2K", yr3: "€0.2K", total: "3,425 kgCO₂e/yr" },
          { item: "Inference: model distillation A100→T4 (−75% instance cost)", tag: "Inference", yr1: "€35K", yr2: "€35K", yr3: "€35K", total: "€104K" },
          { item: "Inference: INT8 quantisation — −30% per-request compute", tag: "Inference", yr1: "€21K", yr2: "€21K", yr3: "€21K", total: "€63K" },
        ],
      },
      {
        scope: "Scope 3 Cat.1 — Hardware (amortised)",
        color: "medium" as const,
        note: "Fleet reduction 12→8 GPUs via distillation + H100 efficiency.",
        rows: [
          { item: "GPU fleet reduction — hardware carbon amortisation saved", tag: "Hardware", yr1: "−185 kgCO₂e", yr2: "−185 kgCO₂e", yr3: "−185 kgCO₂e", total: "−555 kgCO₂e" },
        ],
      },
    ],
    strategic: [
      { item: "Green bond financing saving (€100M issuance, 30bps ESG premium)", yr1: "€300K", yr2: "€300K", yr3: "€300K", total: "€900K" },
      { item: "ESG rating uplift — WACC improvement on €50M equity (from Yr2)", yr1: "—", yr2: "€500K", yr3: "€500K", total: "€1M+" },
      { item: "Carbon credit revenue — EU ETS ~€65/t on avoided emissions", yr1: "€18K", yr2: "€20K", yr3: "€22K", total: "€60K" },
      { item: "Penalty avoidance — CSRD + GPAI Art.53 (worst-case)", yr1: "Up to €35M", yr2: "—", yr3: "—", total: "Up to €35M" },
    ],
    actionChart: [
      { label: "Region switch", carbonPct: 96, costPct: 0, scope: "S2 Training" },
      { label: "Distillation", carbonPct: 65, costPct: 75, scope: "S2 Inference" },
      { label: "H100 upgrade", carbonPct: 55, costPct: 66, scope: "S2 Training" },
      { label: "Retrain freq↓", carbonPct: 60, costPct: 60, scope: "S2 Training" },
      { label: "INT8 quant", carbonPct: 35, costPct: 30, scope: "S2 Both" },
    ],
    total3yr: "Scope 2 savings: ~€315K · Strategic: €2M+ · Penalty avoidance: up to €35M",
    note: "Compute savings: SCI formula + MLPerf Power benchmarks. Green bond: Climate Bonds Initiative 2023. Carbon credits: EU ETS spot price. ESG WACC: MSCI 2023.",
    savingsNote: "How these savings occur: (1) H100 upgrade — delivers 2.5× more throughput per watt, reducing GPU-hours per training run by 66%; (2) Region switch to Stockholm — cuts grid intensity from 350 → 13 gCO₂/kWh (−96%), eliminating nearly all Scope 2 training carbon and generating EU ETS avoided-emissions credits; (3) INT8 quantisation — reduces model weight precision, cutting compute time and inference cost by 20–35% with minimal accuracy loss; (4) Distillation — student model runs on cheaper T4 hardware at €0.50/hr vs €2.00/hr for A100, saving €35K/yr on inference alone.",
    scope3cat11: [
      { year: "Year 1", action: "Instrument your API layer: log model ID, request count, and GPU-hrs consumed per endpoint per day. This is your Cat.11 proxy dataset.", owner: "ML Engineering" },
      { year: "Year 2", action: "Calculate Cat.11 emissions: API calls × average energy per call × live grid intensity. Disclose as Scope 3 Cat.11 in your CSRD ESRS E1 filing.", owner: "ESG + ML Eng" },
      { year: "Year 3", action: "Set a per-call efficiency reduction target (−20% via request batching or model distillation). Include in transition plan and investor disclosure.", owner: "ESG Lead" },
    ],
    scope3cat11Note: "Only relevant if you provide AI as a service to other institutions (e.g. fraud detection API sold to other banks). If your AI is internal-only, Cat.11 does not apply — Scope 3 Cat.1 hardware amortisation is your primary non-electricity Scope 3 obligation.",
    conformanceTimeline: [
      {
        year: "Baseline",
        label: "Current — unmeasured",
        scope2Carbon: "11,302 kgCO₂e/yr",
        scope2Cost: "€118K/yr",
        compliancePct: 5,
        actions: ["No Scope 2 measurement", "Regulatory exposure unquantified", "No CSRD-ready disclosure"],
        color: "rose" as const,
      },
      {
        year: "Year 1",
        label: "Measure + Quick wins",
        scope2Carbon: "~7,800 kgCO₂e/yr",
        scope2Cost: "€85K/yr",
        compliancePct: 45,
        actions: ["SCI formula applied to top 3 models", "INT8 quantisation deployed (−35%)", "CSRD baseline disclosure filed"],
        color: "amber" as const,
      },
      {
        year: "Year 2",
        label: "Optimise + Full disclosure",
        scope2Carbon: "~3,200 kgCO₂e/yr",
        scope2Cost: "€40K/yr",
        compliancePct: 80,
        actions: ["Region switch: Ireland → Stockholm (−96%)", "H100 upgrade complete", "Full CSRD ESRS E1 + AI Act conformity"],
        color: "violet" as const,
      },
      {
        year: "Year 3",
        label: "Sustain + Scale + Strategic",
        scope2Carbon: "~800 kgCO₂e/yr",
        scope2Cost: "€22K/yr",
        compliancePct: 100,
        actions: ["Distillation live on inference fleet", "Board assurance — third-party audit ready", "Green bond issued · ESG uplift realised"],
        color: "emerald" as const,
      },
    ],
  },
  // 11 — Embed change
  {
    id: "embed", type: "embed" as const,
    title: "How to Embed Change Within Your Teams",
    subtitle: "Governance, incentives, ceremonies, and training — the change management layer",
    pillars: [
      {
        label: "Governance",
        icon: "🏛️",
        items: [
          "Appoint a Sustainable AI Lead (or embed in existing ESG function)",
          "Add AI carbon KPIs to board sustainability reporting pack",
          "Include energy footprint in AI model approval gate (existing MLOps governance)",
          "Quarterly carbon review aligned to CSRD reporting cycle",
        ],
      },
      {
        label: "Incentives",
        icon: "🎯",
        items: [
          "Include carbon KPI in ML engineer performance reviews (% reduction target)",
          "Team-level compute budget tied to carbon efficiency (not just cost)",
          "Recognition: 'Green AI Award' for highest efficiency improvement per quarter",
          "Share compute cost savings with the team that delivered them",
        ],
      },
      {
        label: "Ceremonies",
        icon: "📅",
        items: [
          "Monthly: carbon review in ML team sprint retro (10 min, standing agenda item)",
          "Quarterly: exec-level AI sustainability report (links to CSRD cycle)",
          "Annual: update transition plan and publish in sustainability report",
          "Pre-deployment checklist: carbon estimate required before any model ships",
        ],
      },
      {
        label: "Training",
        icon: "📚",
        items: [
          "All ML engineers: Green Software Foundation training (free, 4 hours)",
          "Product leads: CSRD & EU AI Act obligations awareness (half-day)",
          "ESG team: AI carbon measurement methodology (1-day workshop)",
          "Board / C-suite: AI sustainability risk briefing (1 hour, annual)",
        ],
      },
    ],
  },
  // 12 — Next steps + timeline
  {
    id: "nextsteps", type: "nextsteps" as const,
    title: "Next Steps and Implementation Timeline",
    subtitle: "90-day action plan with ownership — start before the next CSRD filing cycle",
    phases: [
      {
        phase: "Month 1 — Measure",
        color: "violet" as const,
        steps: [
          { action: "Identify all AI models in production (training + inference)", owner: "ML Engineering Lead", week: "Week 1" },
          { action: "Apply SCI formula to top 3 highest-compute models — record kWh, kgCO₂e, water", owner: "ML Engineering Lead", week: "Week 2" },
          { action: "Establish baseline: kWh, kgCO₂e, water per model", owner: "ESG Analyst", week: "Week 2–3" },
          { action: "Document methodology (GHG Protocol Scope 2 + SCI formula)", owner: "ESG Analyst", week: "Week 4" },
        ],
      },
      {
        phase: "Month 2 — Benchmark & Optimise",
        color: "amber" as const,
        steps: [
          { action: "Compare against MLPerf medians — identify material models", owner: "ML Engineering Lead", week: "Week 5" },
          { action: "Implement INT8 quantisation on top inference workload", owner: "ML Engineer", week: "Week 5–6" },
          { action: "Evaluate region switch to Stockholm/low-carbon grid", owner: "Infrastructure Lead", week: "Week 6–7" },
          { action: "Model distillation assessment for credit scoring model", owner: "ML Lead", week: "Week 7–8" },
        ],
      },
      {
        phase: "Month 3 — Disclose & Report",
        color: "emerald" as const,
        steps: [
          { action: "Map obligations: CSRD ESRS E1 + EU AI Act High-Risk documentation", owner: "ESG / Legal", week: "Week 9" },
          { action: "Draft CSRD ESRS E1-S2 disclosure section (Scope 2 AI workloads)", owner: "ESG Analyst", week: "Week 10–11" },
          { action: "Board review of AI carbon disclosure section", owner: "CFO / Board", week: "Week 11–12" },
          { action: "Publish in sustainability report / EU AI Act technical file", owner: "ESG Lead", week: "Week 12" },
        ],
      },
    ],
    cta: "The measurement methodology, regulatory mapping, and ROI model are all in this session. Begin this week: identify your highest-compute AI workload, apply the SCI formula with your cloud region's live grid intensity, and you will have a CSRD-ready Scope 2 figure before your next team meeting.",
    timeline: [
      { label: "AI model inventory — all production models", owner: "ML Engineering Lead", start: 1, end: 1, phase: 0 },
      { label: "SCI formula — top 3 highest-compute models", owner: "ML Engineering Lead", start: 2, end: 2, phase: 0 },
      { label: "Establish Scope 2 baseline (kWh, kgCO₂e, water)", owner: "ESG Analyst", start: 2, end: 3, phase: 0 },
      { label: "Document GHG Protocol + SCI methodology", owner: "ESG Analyst", start: 4, end: 4, phase: 0 },
      { label: "MLPerf comparison — identify material models", owner: "ML Engineering Lead", start: 5, end: 5, phase: 1 },
      { label: "INT8 quantisation — top inference workload", owner: "ML Engineer", start: 5, end: 6, phase: 1 },
      { label: "Region switch evaluation (Stockholm)", owner: "Infrastructure Lead", start: 6, end: 7, phase: 1 },
      { label: "Distillation assessment — credit scoring model", owner: "ML Lead", start: 7, end: 8, phase: 1 },
      { label: "CSRD + EU AI Act obligation mapping", owner: "ESG / Legal", start: 9, end: 9, phase: 2 },
      { label: "Draft CSRD ESRS E1-S2 Scope 2 disclosure", owner: "ESG Analyst", start: 10, end: 11, phase: 2 },
      { label: "Board review of AI carbon disclosure", owner: "CFO / Board", start: 11, end: 12, phase: 2 },
      { label: "Publish in sustainability report", owner: "ESG Lead", start: 12, end: 12, phase: 2 },
    ],
  },
  // 13 — Closing + resources
  {
    id: "close", type: "close" as const,
    title: "Thank You · Resources & Next Steps",
    presenter: "Preeti · Responsible & Sustainable AI Practitioner",
    resources: [
      { label: "Carbon Depth Calculator", url: "/carbon-depth", note: "Free tool — measure any model's Scope 2 carbon in 5 minutes" },
      { label: "AI Sustainability Disclosure Framework", url: "/sustainability-framework", note: "5-step end-to-end framework — CSRD to GRI 305 mapped" },
      { label: "AI Sustainability Standards Tracker", url: "/sustainability-standards", note: "13 players · 11 frameworks · live status" },
      { label: "Strubell et al. (2019)", url: "https://arxiv.org/abs/1906.02629", note: "Energy and Policy Considerations for NLP (foundational paper)" },
      { label: "Green Software Foundation SCI", url: "https://sci-guide.greensoftware.foundation/", note: "Software Carbon Intensity formula and guide" },
      { label: "CSRD ESRS E1", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32022L2464", note: "Full directive text" },
    ],
    closing: "AI is not inherently unsustainable — it is unmeasured. The tools, methodology, and regulatory framework are all here. The only thing missing is the decision to start.",
  },
];

// ── ROI Calculator ────────────────────────────────────────────────────────────

function ROICalculator() {
  const [step, setStep]         = useState<1 | 2 | 3>(1);
  // Training inputs
  const [gpuCount, setGpuCount] = useState("8");
  const [tdpW, setTdpW]         = useState("400");
  const [hours, setHours]       = useState("168");
  const [runsPerYear, setRunsPerYear] = useState("12");
  const [costPerKwh, setCostPerKwh]   = useState("0.12");
  const [region, setRegion]     = useState("ie");
  // Inference inputs
  const [infGpus, setInfGpus]         = useState("4");
  const [infHrsPerDay, setInfHrsPerDay] = useState("139");
  const [infCostPerHr, setInfCostPerHr] = useState("2.00");
  const [distCostPerHr, setDistCostPerHr] = useState("0.50");
  const [distHrsPerDay, setDistHrsPerDay] = useState("194");

  const [result, setResult]     = useState<null | {
    kwhPerRun: number; co2PerRun: number; annualKwh: number; annualCo2: number;
    annualCost: number; savingRegion: number; savingQuant: number; saving3yr: number;
    infAnnualCost: number; distAnnualCost: number; infSaving: number; infSaving3yr: number;
  }>(null);

  const GRID: Record<string, { label: string; gco2: number }> = {
    ie: { label: "Ireland (AWS eu-west-1)", gco2: 350 },
    de: { label: "Germany (AWS eu-central-1)", gco2: 410 },
    fr: { label: "France (AWS eu-west-3)", gco2: 56 },
    se: { label: "Stockholm (AWS eu-north-1)", gco2: 13 },
    us: { label: "US East (AWS us-east-1)", gco2: 400 },
    or: { label: "Oregon (AWS us-west-2)", gco2: 68 },
  };

  function calculate() {
    const gpus = parseFloat(gpuCount) || 8;
    const tdp  = parseFloat(tdpW) || 400;
    const hrs  = parseFloat(hours) || 168;
    const runs = parseFloat(runsPerYear) || 12;
    const rate = parseFloat(costPerKwh) || 0.12;
    const pue  = 1.2;
    const gco2 = GRID[region]?.gco2 ?? 350;
    const se   = GRID["se"].gco2;

    const kwhPerRun  = (gpus * tdp * hrs * pue) / 1000;
    const co2PerRun  = (kwhPerRun * gco2) / 1000;
    const annualKwh  = kwhPerRun * runs;
    const annualCo2  = co2PerRun * runs;
    const annualCost = annualKwh * rate;

    const savingRegionCo2Pct = (gco2 - se) / gco2;
    const savingRegion = annualCost * savingRegionCo2Pct * 0.6;
    const savingQuant  = annualCost * 0.25;
    const saving3yr    = (savingRegion + savingQuant) * 3;

    // Inference calculation
    const iGpus = parseFloat(infGpus) || 4;
    const iHrs  = parseFloat(infHrsPerDay) || 139;
    const iCost = parseFloat(infCostPerHr) || 2.0;
    const dCost = parseFloat(distCostPerHr) || 0.5;
    const dHrs  = parseFloat(distHrsPerDay) || 194;
    const infAnnualCost  = iGpus * iHrs * iCost * 365;
    const distAnnualCost = iGpus * dHrs * dCost * 365;
    const infSaving      = infAnnualCost - distAnnualCost;
    const infSaving3yr   = infSaving * 3;

    setResult({ kwhPerRun, co2PerRun, annualKwh, annualCo2, annualCost, savingRegion, savingQuant, saving3yr, infAnnualCost, distAnnualCost, infSaving, infSaving3yr });
    setStep(3);
  }

  const inp = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-violet-500/50";
  const lbl = "block text-[11px] font-semibold text-muted-foreground mb-1 uppercase tracking-wider";

  return (
    <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-6 mt-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-bold text-foreground">ROI Calculator</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Two-step: technical inputs → financial estimate</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${step === 1 ? "border-violet-500/40 bg-violet-500/10 text-violet-400" : "border-border/40 text-muted-foreground"}`}>1 Training</span>
          <span className="text-muted-foreground/30 text-xs">→</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${step === 2 ? "border-blue-500/40 bg-blue-500/10 text-blue-400" : "border-border/40 text-muted-foreground"}`}>2 Inference</span>
          <span className="text-muted-foreground/30 text-xs">→</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${step === 3 ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400" : "border-border/40 text-muted-foreground"}`}>3 Results</span>
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className={lbl}>GPU count</label>
              <input type="number" min={1} value={gpuCount} onChange={e => setGpuCount(e.target.value)} className={inp} placeholder="e.g. 8" />
            </div>
            <div>
              <label className={lbl}>GPU TDP (watts)</label>
              <input type="number" min={1} value={tdpW} onChange={e => setTdpW(e.target.value)} className={inp} placeholder="e.g. 400" />
            </div>
            <div>
              <label className={lbl}>Training hours</label>
              <input type="number" min={1} value={hours} onChange={e => setHours(e.target.value)} className={inp} placeholder="e.g. 168" />
            </div>
            <div>
              <label className={lbl}>Runs per year</label>
              <input type="number" min={1} value={runsPerYear} onChange={e => setRunsPerYear(e.target.value)} className={inp} placeholder="e.g. 12" />
            </div>
            <div>
              <label className={lbl}>Cloud region</label>
              <select value={region} onChange={e => setRegion(e.target.value)} className={inp}>
                {Object.entries(GRID).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={lbl}>Cost per kWh (€)</label>
              <input type="number" min={0.01} step={0.01} value={costPerKwh} onChange={e => setCostPerKwh(e.target.value)} className={inp} placeholder="e.g. 0.12" />
            </div>
          </div>
          <button
            onClick={() => setStep(2)}
            className="px-5 py-2 rounded-lg text-xs font-bold bg-violet-600 text-white hover:bg-violet-500 transition-colors"
          >
            Next: Inference →
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <p className="text-[11px] text-muted-foreground">Inference inputs — daily cost of running the model in production vs after distillation</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className={lbl}>Inference GPU count</label>
              <input type="number" min={1} value={infGpus} onChange={e => setInfGpus(e.target.value)} className={inp} placeholder="e.g. 4" />
            </div>
            <div>
              <label className={lbl}>Current GPU-hrs/day</label>
              <input type="number" min={1} value={infHrsPerDay} onChange={e => setInfHrsPerDay(e.target.value)} className={inp} placeholder="e.g. 139" />
            </div>
            <div>
              <label className={lbl}>Current cost/GPU-hr (€)</label>
              <input type="number" min={0.01} step={0.01} value={infCostPerHr} onChange={e => setInfCostPerHr(e.target.value)} className={inp} placeholder="e.g. 2.00" />
            </div>
            <div>
              <label className={lbl}>Distilled GPU-hrs/day</label>
              <input type="number" min={1} value={distHrsPerDay} onChange={e => setDistHrsPerDay(e.target.value)} className={inp} placeholder="e.g. 194" />
            </div>
            <div>
              <label className={lbl}>Distilled cost/GPU-hr (€)</label>
              <input type="number" min={0.01} step={0.01} value={distCostPerHr} onChange={e => setDistCostPerHr(e.target.value)} className={inp} placeholder="e.g. 0.50" />
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground/60">Note: distilled model may run more GPU-hrs/day (smaller GPU = more requests needed) but at a much lower cost/hr.</p>
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">← Back</button>
            <button onClick={calculate} className="px-5 py-2 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors">
              Calculate ROI →
            </button>
          </div>
        </div>
      )}

      {step === 3 && result && (
        <div className="space-y-4">
          {/* Training baseline */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-violet-400 mb-2">Scope 2 — Training baseline</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: "Energy per run", value: `${result.kwhPerRun.toFixed(0)} kWh` },
                { label: "Carbon per run", value: `${result.co2PerRun.toFixed(1)} kgCO₂e` },
                { label: "Annual energy", value: `${result.annualKwh.toFixed(0)} kWh` },
                { label: "Annual training cost", value: `€${result.annualCost.toFixed(0)}` },
              ].map(s => (
                <div key={s.label} className="rounded-lg border border-border bg-card p-3 text-center">
                  <div className="text-sm font-bold text-foreground">{s.value}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Inference baseline */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-2">Scope 2 — Inference baseline vs distilled</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Current annual cost", value: `€${result.infAnnualCost.toFixed(0)}` },
                { label: "Distilled annual cost", value: `€${result.distAnnualCost.toFixed(0)}` },
                { label: "Annual saving", value: `€${result.infSaving.toFixed(0)}` },
              ].map(s => (
                <div key={s.label} className={`rounded-lg border p-3 text-center ${s.label === "Annual saving" ? "border-emerald-500/30 bg-emerald-500/5" : "border-border bg-card"}`}>
                  <div className={`text-sm font-bold ${s.label === "Annual saving" ? "text-emerald-400" : "text-foreground"}`}>{s.value}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Combined savings */}
          <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-3">3-Year Financial Savings — Compute Only</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Training: region switch to Stockholm (−96% carbon)</span>
                <span className="font-bold text-emerald-400">€{(result.savingRegion * 3).toFixed(0)}/3yr</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Training: INT8 quantisation (−35% training time)</span>
                <span className="font-bold text-emerald-400">€{(result.savingQuant * 3).toFixed(0)}/3yr</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Inference: model distillation (A100 → T4)</span>
                <span className="font-bold text-emerald-400">€{result.infSaving3yr.toFixed(0)}/3yr</span>
              </div>
              <div className="border-t border-emerald-500/20 pt-2 flex items-center justify-between text-sm">
                <span className="font-bold text-foreground">Total compute savings (3 years)</span>
                <span className="font-bold text-emerald-400">€{(result.saving3yr + result.infSaving3yr).toFixed(0)}</span>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-2.5">
            <p className="text-xs text-amber-400/80">
              Annual CO₂ (training): <strong className="text-amber-400">{result.annualCo2.toFixed(1)} kgCO₂e</strong>
              {" · "}EU ETS credits: <strong className="text-amber-400">€{(result.annualCo2 * 0.065).toFixed(0)}/yr</strong>
              {" · "}Add green bond, ESG uplift, and penalty avoidance for full strategic ROI.
            </p>
          </div>
          <button
            onClick={() => { setStep(1); setResult(null); }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ↩ Recalculate
          </button>
        </div>
      )}
    </div>
  );
}

// ── Email draft ────────────────────────────────────────────────────────────────

function EmailDraft() {
  const [copied, setCopied] = useState(false);
  const email = `To: sarah.muller@aif-europe.eu
Subject: Webinar proposal — Reducing AI's Carbon Footprint for Financial Institutions

Dear Sarah,

I hope this message finds you well. I am writing to propose a webinar session for the AI in Finance Practitioners Network community on a topic I believe is both timely and directly relevant to your members: the environmental footprint of AI in financial services, and the regulatory and commercial case for acting now.

The proposed session, "Reducing AI's Carbon Footprint: A Practitioner's Guide," would cover:

• Why EU financial institutions face mandatory AI sustainability disclosure under CSRD, the EU AI Act (High-Risk AI provisions), and ISSB S2 — and what that means in practice
• How to measure AI carbon footprints using the GHG Protocol Scope 2 methodology and the Green Software Foundation SCI formula (validated ±0.1% against published research)
• The top 5 quantified actions to reduce AI emissions, with costs and carbon savings for each
• A 3-year ROI model showing compute savings, green bond access, ESG rating uplift, and penalty avoidance
• A 90-day implementation roadmap your members can take back to their teams immediately

I have built and validated the underlying tools — the Carbon Depth Calculator and AI Sustainability Disclosure Framework — as part of my work at the intersection of responsible AI and sustainable technology. The session would be practical, numbers-driven, and designed to give your members concrete next steps, not just awareness.

I would welcome the opportunity to discuss this further at your convenience. Please let me know if you would like a one-pager, a slide preview, or a 30-minute exploratory call.

With warm regards,
Preeti
Responsible & Sustainable AI Practitioner`;

  function copyEmail() {
    navigator.clipboard.writeText(email).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      const el = document.createElement("textarea");
      el.value = email; el.style.position = "fixed"; el.style.opacity = "0";
      document.body.appendChild(el); el.select();
      try { document.execCommand("copy"); } catch {}
      document.body.removeChild(el);
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 mt-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-foreground">Written email — approval request</h3>
          <p className="text-xs text-muted-foreground mt-0.5">To: Sarah Müller · Head of Programming, AI in Finance Europe</p>
        </div>
        <button
          onClick={copyEmail}
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${copied ? "border-emerald-500/40 text-emerald-400" : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40"}`}
        >
          {copied ? "Copied ✓" : "Copy email"}
        </button>
      </div>
      <pre className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap font-sans bg-muted/10 rounded-lg p-4 border border-border/40 max-h-[400px] overflow-y-auto">
        {email}
      </pre>
    </div>
  );
}

// ── Tooltip helper ────────────────────────────────────────────────────────────

function Tip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="relative group inline-block">
      <span className="border-b border-dashed border-violet-400/50 text-violet-300 cursor-help">{children}</span>
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 rounded-lg border border-slate-600/80 bg-slate-900 px-3 py-2.5 text-[10px] leading-relaxed text-slate-200 shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50 whitespace-normal font-normal not-italic">
        {label}
      </span>
    </span>
  );
}

// ── Slide card renderer ───────────────────────────────────────────────────────

function SlideCard({ slide, index }: { slide: typeof SLIDES[number]; index: number }) {
  const base = "rounded-xl border border-border bg-card p-7";
  const header = (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-[10px] font-mono text-muted-foreground/50">{index + 1} / {SLIDES.length}</span>
      <div className="w-px h-4 bg-border" />
      <h2 className="text-xl font-bold text-foreground">{slide.title}</h2>
    </div>
  );

  if (slide.type === "cover") {
    const s = slide;
    return (
      <div className={`${base} bg-gradient-to-br from-violet-500/5 to-card`}>
        <div className="flex flex-wrap gap-2 mb-5">
          {s.tags.map(t => <span key={t} className="text-[10px] font-mono px-2.5 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-400">{t}</span>)}
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-1">{s.title}</h2>
        <p className="text-sm text-violet-400 font-semibold mb-1">{s.subtitle}</p>
        <p className="text-xs text-muted-foreground mb-2">{s.event} · {new Date().getFullYear()}</p>
        <p className="text-[11px] font-semibold text-foreground/70 mb-6">{s.presenter}</p>
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-3">Why this session matters</p>
          <div className="space-y-2">
            {s.hookParagraphs.map((para, i) => (
              <p key={i} className={`text-xs leading-relaxed ${i === s.hookParagraphs.length - 1 ? "text-foreground/80 font-medium border-t border-amber-500/20 pt-2 mt-2" : "text-muted-foreground"}`}>{para}</p>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (slide.type === "why") {
    const s = slide;
    return (
      <div className={base}>
        {header}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          {s.points.map(p => (
            <div key={p.label} className="rounded-lg border border-border bg-background/40 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">{p.icon}</span>
                <span className="text-xs font-bold text-foreground">{p.label}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 px-5 py-4 text-center">
          <div className="text-3xl font-bold text-rose-400 mb-1">{s.stat.value}</div>
          <p className="text-xs font-semibold text-foreground mb-0.5">{s.stat.label}</p>
          <p className="text-[10px] text-muted-foreground">{s.stat.sub}</p>
        </div>
      </div>
    );
  }

  if (slide.type === "footprint") {
    const s = slide;
    const colors = { high: "border-rose-500/30 bg-rose-500/5", medium: "border-amber-500/25 bg-amber-500/5", low: "border-border bg-background/40" };
    return (
      <div className={base}>
        {header}
        <p className="text-xs text-muted-foreground mb-1">{s.subtitle}</p>
        <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 px-4 py-3 mb-5 italic">
          <p className="text-xs text-muted-foreground">{s.analogy}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          {s.scopes.map(sc => (
            <div key={sc.scope} className={`rounded-xl border p-4 ${colors[sc.color]}`}>
              <p className="text-xs font-bold text-foreground mb-1">{sc.scope} — {sc.label}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{sc.example}</p>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-border/40 bg-muted/5 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Formula — hover terms for definitions</p>
          <div className="text-xs font-mono text-foreground/80 space-y-1.5 leading-relaxed">
            <div>Energy (kWh) = GPU <Tip label="Thermal Design Power — the maximum sustained power a GPU draws, in watts. A100 = 400W · H100 = 700W · V100 = 300W · T4 = 70W. Higher TDP = more energy per training hour.">TDP</Tip> × training hours × GPU count × <Tip label="Power Usage Effectiveness — ratio of total facility power to IT equipment power. A PUE of 1.2 means for every 100W of GPU use, 120W is drawn from the grid (20% overhead for cooling, lighting, etc.). Hyperscale data centres average 1.1; colocation ~1.4; on-premises ~1.6–1.8.">PUE</Tip></div>
            <div>Carbon (kgCO₂e) = Energy × live <Tip label="Grid carbon intensity — grams of CO₂ equivalent per kilowatt-hour of electricity generated. Ireland (AWS eu-west-1): 350 gCO₂/kWh · Stockholm (AWS eu-north-1): 13 gCO₂/kWh · Germany: 410 gCO₂/kWh. Using live data (not annual averages) is required for CSRD ESRS E1 accuracy — annual averages can overestimate by up to 2.4×.">grid intensity (gCO₂/kWh)</Tip></div>
            <div>Water (litres) = Energy × <Tip label="Water Usage Effectiveness — litres of water consumed per kWh of energy used, primarily for cooling. Hyperscale data centres: 0.3L/kWh · Colocation: 0.8L/kWh · On-premises: ~1.5L/kWh. Required for CSRD ESRS E3 (water) and GRI 303 voluntary disclosure.">WUE coefficient</Tip></div>
          </div>
          <p className="text-[10px] text-muted-foreground/50 mt-2 italic">{s.formulaNote}</p>
        </div>
      </div>
    );
  }

  if (slide.type === "regulation") {
    const s = slide;
    const colors = { high: "border-rose-500/30 bg-rose-500/5", medium: "border-amber-500/25 bg-amber-500/5", low: "border-border bg-background/30" };
    const statusColors = { high: "text-rose-400", medium: "text-amber-400", low: "text-muted-foreground" };
    return (
      <div className={base}>
        {header}
        <p className="text-xs text-muted-foreground mb-4">{s.subtitle}</p>
        <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1">
          {[
            ["CSRD", "Corporate Sustainability Reporting Directive — EU law requiring large companies to disclose detailed sustainability data including GHG emissions, climate risk, and governance."],
            ["ESRS E1", "European Sustainability Reporting Standard E1 — Climate Change. The technical standard under CSRD specifying exactly what GHG data to report, how to calculate it, and what assurance is required."],
            ["PIEs", "Public Interest Entities — large listed companies, banks, credit institutions, and insurance firms with >500 employees. These are the first wave required to comply with CSRD (FY2024 data, filed June 2025)."],
            ["GPAI", "General Purpose AI — AI models that can perform a wide range of tasks (e.g. GPT-4, Claude, Gemini). Under EU AI Act Art.53, GPAI providers must document training energy consumption in their technical file."],
            ["ISSB S2", "International Sustainability Standards Board Standard S2 — Climate-related Disclosures. A global baseline for climate financial disclosure, rapidly being adopted or mandated by EU, UK, Japan, Australia, and Singapore."],
            ["GRI 305", "Global Reporting Initiative Standard 305 — Emissions. Voluntary global standard for GHG disclosure. Expected by investors, procurement teams, and ESG raters even without a legal mandate."],
          ].map(([term, def]) => (
            <Tip key={term} label={def}><span className="text-[10px] font-semibold text-violet-400/80 cursor-help">{term} ⓘ</span></Tip>
          ))}
        </div>
        <div className="space-y-2 mb-5">
          {s.obligations.map(o => (
            <div key={o.reg} className={`rounded-lg border p-3 ${colors[o.color]}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground">{o.reg}</span>
                  <span className={`text-[10px] font-semibold ${statusColors[o.color]}`}>{o.status}</span>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground/60 whitespace-nowrap shrink-0">{o.when}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{o.detail}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-0 overflow-x-auto">
          {s.timeline.map((t, i) => (
            <div key={t.date} className="flex items-center gap-0 shrink-0">
              <div className="flex flex-col items-center">
                <div className="w-2.5 h-2.5 rounded-full bg-violet-500/60 border border-violet-500" />
                <span className="text-[9px] font-mono text-violet-400 mt-1 whitespace-nowrap">{t.date}</span>
                <span className="text-[8px] text-muted-foreground/60 max-w-[80px] text-center leading-tight">{t.label}</span>
              </div>
              {i < s.timeline.length - 1 && <div className="w-12 h-px bg-border mx-1 mb-6" />}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (slide.type === "measure") {
    const s = slide;
    return (
      <div className={base}>
        {header}
        <p className="text-xs text-muted-foreground mb-4">{s.subtitle}</p>
        <div className="space-y-2 mb-5">
          {s.steps.map(st => (
            <div key={st.n} className="flex gap-3 items-start rounded-lg border border-border/50 px-4 py-3 bg-background/30">
              <span className="shrink-0 w-6 h-6 rounded-full bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-[10px] font-bold text-violet-400">{st.n}</span>
              <div>
                <p className="text-xs font-semibold text-foreground">{st.label}</p>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{st.body}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 mb-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-1">Example output</p>
          <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap">{s.example}</pre>
        </div>
        {"ghgNote" in s && s.ghgNote && (
          <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 px-4 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-violet-400 mb-1">GHG Protocol — Location-based vs Market-based</p>
            <p className="text-[10px] text-muted-foreground leading-relaxed">{s.ghgNote}</p>
          </div>
        )}
      </div>
    );
  }

  if (slide.type === "benchmark") {
    const s = slide;
    const maxVal = Math.max(...s.comparisons.map(c => c.value));
    return (
      <div className={base}>
        {header}
        <p className="text-xs text-muted-foreground mb-3">{s.subtitle}</p>
        <div className="rounded-lg border border-border/40 bg-muted/5 px-4 py-3 mb-4">
          <p className="text-xs text-muted-foreground leading-relaxed">{s.what}</p>
        </div>
        <div className="space-y-2 mb-4">
          {s.comparisons.map(c => (
            <div key={c.model} className="flex items-center gap-3">
              <span className={`text-[11px] w-48 shrink-0 ${c.highlight ? "font-bold text-foreground" : "text-muted-foreground"}`}>{c.model}</span>
              <div className="flex-1 bg-muted/20 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${c.highlight ? "bg-rose-500" : "bg-violet-500/40"}`}
                  style={{ width: `${Math.max(3, (c.value / maxVal) * 100)}%` }}
                />
              </div>
              <span className={`text-[11px] font-mono w-24 text-right ${c.highlight ? "font-bold text-rose-400" : "text-muted-foreground"}`}>{c.value.toLocaleString()} {c.unit}</span>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-rose-500/25 bg-rose-500/5 px-4 py-2.5">
          <p className="text-xs text-rose-400 font-medium">{s.finding}</p>
        </div>
        <p className="text-[10px] text-amber-400/80 mt-2">{s.action}</p>
      </div>
    );
  }

  if (slide.type === "actions") {
    const s = slide;
    const effortColor = { Low: "text-emerald-400 border-emerald-500/30 bg-emerald-500/5", Medium: "text-amber-400 border-amber-500/30 bg-amber-500/5", High: "text-rose-400 border-rose-500/30 bg-rose-500/5" };
    return (
      <div className={base}>
        {header}
        <p className="text-xs text-muted-foreground mb-4">{s.subtitle}</p>
        <div className="space-y-2">
          {s.actions.map(a => (
            <div key={a.rank} className="flex gap-3 items-start rounded-lg border border-border/50 px-4 py-3 bg-background/30">
              <span className="shrink-0 w-6 h-6 rounded-full bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-[10px] font-bold text-violet-400">{a.rank}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-foreground">{a.action}</span>
                  <span className="text-[10px] font-mono text-emerald-400 border border-emerald-500/25 bg-emerald-500/5 px-1.5 py-0.5 rounded">{a.carbon}</span>
                  <span className="text-[10px] font-mono text-blue-400 border border-blue-500/25 bg-blue-500/5 px-1.5 py-0.5 rounded">{a.cost}</span>
                  <span className={`text-[10px] font-semibold border px-1.5 py-0.5 rounded ${effortColor[a.effort]}`}>{a.effort} effort</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{a.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (slide.type === "benefits") {
    const s = slide;
    return (
      <div className={base}>
        {header}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {s.categories.map(cat => (
            <div key={cat.label} className="rounded-lg border border-border bg-background/40 p-4">
              <p className="text-xs font-bold text-foreground mb-2">{cat.label}</p>
              <ul className="space-y-1.5">
                {cat.items.map((item, i) => (
                  <li key={i} className="flex gap-2 items-start text-xs text-muted-foreground">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-violet-400/50 shrink-0" />
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (slide.type === "kpis") {
    const s = slide;
    const priorityStyle = { mandatory: "text-rose-400 border-rose-500/30 bg-rose-500/5", recommended: "text-amber-400 border-amber-500/30 bg-amber-500/5" };
    return (
      <div className={base}>
        {header}
        <p className="text-xs text-muted-foreground mb-4">{s.subtitle}</p>
        <div className="rounded-xl border border-border/60 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/60 bg-muted/20">
                <th className="text-left px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase">Category</th>
                <th className="text-left px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase">Metric</th>
                <th className="text-left px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase">Frequency</th>
                <th className="text-left px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase">Standard</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {s.kpis.map((k, i) => (
                <tr key={k.metric} className={`border-b border-border/30 last:border-0 ${i % 2 === 0 ? "" : "bg-muted/5"}`}>
                  <td className="px-3 py-1.5 text-muted-foreground/70">{k.category}</td>
                  <td className="px-3 py-1.5 font-medium text-foreground">{k.metric}</td>
                  <td className="px-3 py-1.5 text-muted-foreground font-mono text-[10px]">{k.frequency}</td>
                  <td className="px-3 py-1.5 text-violet-400/80 font-mono text-[10px]">{k.standard}</td>
                  <td className="px-3 py-1.5">
                    <span className={`text-[9px] font-semibold border px-1.5 py-0.5 rounded ${priorityStyle[k.priority]}`}>{k.priority}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (slide.type === "roiinputs") {
    const s = slide;
    const ioRow = (label: string, val: string) => (
      <div key={label} className="flex items-start justify-between gap-2 text-xs border-b border-border/20 py-1 last:border-0">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-medium text-foreground/90 text-right shrink-0">{val}</span>
      </div>
    );
    return (
      <div className={base}>
        {header}
        <p className="text-xs text-muted-foreground mb-4">{s.subtitle}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {[s.training, s.inference].map(wl => (
            <div key={wl.label} className="rounded-xl border border-border bg-background/40 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-violet-400 mb-3">{wl.label}</p>
              <div className="mb-3">
                <p className="text-[9px] font-semibold text-muted-foreground/60 uppercase mb-1.5">Inputs</p>
                {wl.inputs.map(inp => ioRow(inp.param, inp.value))}
              </div>
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2.5">
                <p className="text-[9px] font-semibold text-emerald-400 uppercase mb-1.5">Outputs</p>
                {wl.outputs.map(out => (
                  <div key={out.metric} className="flex items-center justify-between text-xs py-0.5">
                    <span className="text-muted-foreground">{out.metric}</span>
                    <span className="font-mono font-bold text-emerald-400">{out.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        {/* Instance cost explainer */}
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-2.5 mb-3">
          <p className="text-[10px] font-bold text-blue-400 mb-1">What is instance cost?</p>
          <p className="text-[10px] text-muted-foreground leading-relaxed">{s.instanceCostNote}</p>
        </div>
        {/* Calculations */}
        <div className="rounded-xl border border-border/50 bg-background/30 p-3 mb-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Step-by-step calculations</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-border/40">
                <th className="text-left px-2 py-1 text-[9px] font-semibold text-muted-foreground uppercase">Metric</th>
                <th className="text-left px-2 py-1 text-[9px] font-semibold text-muted-foreground uppercase">Formula</th>
                <th className="text-right px-2 py-1 text-[9px] font-semibold text-emerald-400 uppercase">Result</th>
              </tr></thead>
              <tbody>
                {s.calculations.map((c, i) => (
                  <tr key={c.label} className={`border-b border-border/20 last:border-0 ${i % 2 === 0 ? "" : "bg-muted/5"}`}>
                    <td className="px-2 py-1 text-muted-foreground font-medium whitespace-nowrap">{c.label}</td>
                    <td className="px-2 py-1 font-mono text-[10px] text-muted-foreground/70">{c.formula}</td>
                    <td className="px-2 py-1 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">{c.result}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {/* Scope 3 note */}
        <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 px-4 py-2.5">
          <p className="text-[10px] font-bold text-violet-400 mb-1">Scope 3 — hardware amortisation + downstream</p>
          <p className="text-[10px] text-muted-foreground leading-relaxed">{s.scope3note}</p>
        </div>
      </div>
    );
  }

  if (slide.type === "roi") {
    const s = slide;
    const scopeStyle = {
      high: "border-rose-500/30 bg-rose-500/5",
      medium: "border-amber-500/25 bg-amber-500/5",
      low: "border-border/40 bg-background/30",
    };
    const tagStyle: Record<string, string> = {
      Training: "text-violet-400 border-violet-500/30 bg-violet-500/5",
      Inference: "text-blue-400 border-blue-500/30 bg-blue-500/5",
      Hardware: "text-amber-400 border-amber-500/30 bg-amber-500/5",
    };
    return (
      <div className={base}>
        {header}
        <p className="text-xs text-muted-foreground mb-4">{s.subtitle}</p>
        {/* 3-Year Conformance Timeline */}
        {(() => {
          const cmap = {
            rose:    { node: "border-rose-500 bg-rose-500/10",    bar: "bg-rose-500/70",    text: "text-rose-400",    card: "border-rose-500/25 bg-rose-500/5",    dot: "bg-rose-500/70" },
            amber:   { node: "border-amber-500 bg-amber-500/10",  bar: "bg-amber-500/70",   text: "text-amber-400",   card: "border-amber-500/25 bg-amber-500/5",   dot: "bg-amber-500/70" },
            violet:  { node: "border-violet-500 bg-violet-500/10",bar: "bg-violet-500/70",  text: "text-violet-400",  card: "border-violet-500/25 bg-violet-500/5",  dot: "bg-violet-500/70" },
            emerald: { node: "border-emerald-500 bg-emerald-500/10",bar:"bg-emerald-500/70",text: "text-emerald-400", card: "border-emerald-500/25 bg-emerald-500/5",dot: "bg-emerald-500/70" },
          };
          return (
            <div className="rounded-xl border border-border/50 bg-background/30 p-4 mb-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">3-Year Conformance Trajectory</p>
              {/* Track */}
              <div className="relative mb-4">
                <div className="absolute top-[14px] left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-rose-500/40 via-amber-400/40 via-violet-500/40 to-emerald-500/40" />
                <div className="grid grid-cols-4 gap-3 relative">
                  {s.conformanceTimeline.map((m) => {
                    const c = cmap[m.color];
                    return (
                      <div key={m.year} className={`rounded-xl border ${c.card} p-3 flex flex-col items-center text-center`}>
                        <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center mb-1.5 ${c.node}`}>
                          <div className={`w-2 h-2 rounded-full ${c.dot}`} />
                        </div>
                        <p className={`text-[11px] font-bold ${c.text}`}>{m.year}</p>
                        <p className="text-[9px] text-muted-foreground mb-2 leading-tight">{m.label}</p>
                        {/* Compliance bar */}
                        <div className="w-full bg-muted/20 rounded-full h-1.5 mb-0.5">
                          <div className={`h-1.5 rounded-full ${c.bar}`} style={{ width: `${m.compliancePct}%` }} />
                        </div>
                        <p className={`text-[10px] font-bold ${c.text} mb-2`}>{m.compliancePct}% compliant</p>
                        {/* Metrics */}
                        <div className="w-full space-y-0.5 mb-2 text-left">
                          <div className="flex justify-between text-[9px]"><span className="text-muted-foreground/60">Carbon</span><span className="font-mono font-semibold text-foreground/80">{m.scope2Carbon}</span></div>
                          <div className="flex justify-between text-[9px]"><span className="text-muted-foreground/60">Cost</span><span className="font-mono font-semibold text-foreground/80">{m.scope2Cost}</span></div>
                        </div>
                        {/* Actions */}
                        <div className="w-full space-y-0.5 text-left">
                          {m.actions.map((a, ai) => (
                            <div key={ai} className="flex gap-1 items-start">
                              <span className={`w-1 h-1 rounded-full shrink-0 mt-1.5 ${c.dot}`} />
                              <span className="text-[9px] text-muted-foreground leading-tight">{a}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}
        {/* Scope sections */}
        <div className="space-y-3 mb-4">
          {s.sections.map(sec => (
            <div key={sec.scope} className={`rounded-xl border p-3 ${scopeStyle[sec.color]}`}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">{sec.scope}</p>
              {sec.rows.length === 0 ? (
                <p className="text-[10px] text-muted-foreground italic">{sec.note}</p>
              ) : (
                <>
                  <div className="rounded-lg border border-border/30 overflow-hidden mb-1.5">
                    <table className="w-full text-xs">
                      <thead><tr className="border-b border-border/30 bg-muted/10">
                        <th className="text-left px-2 py-1 text-[9px] font-semibold text-muted-foreground uppercase">Action</th>
                        <th className="text-right px-2 py-1 text-[9px] font-semibold text-muted-foreground uppercase">Yr1</th>
                        <th className="text-right px-2 py-1 text-[9px] font-semibold text-muted-foreground uppercase">Yr2</th>
                        <th className="text-right px-2 py-1 text-[9px] font-semibold text-muted-foreground uppercase">Yr3</th>
                        <th className="text-right px-2 py-1 text-[9px] font-semibold text-emerald-400 uppercase">Total</th>
                      </tr></thead>
                      <tbody>
                        {sec.rows.map((r) => (
                          <tr key={r.item} className="border-b border-border/20 last:border-0">
                            <td className="px-2 py-1 text-muted-foreground leading-tight">
                              <span className={`text-[9px] font-semibold border px-1.5 rounded mr-1.5 ${tagStyle[r.tag] ?? ""}`}>{r.tag}</span>
                              {r.item}
                            </td>
                            <td className="px-2 py-1 text-right font-mono text-foreground/80 whitespace-nowrap">{r.yr1}</td>
                            <td className="px-2 py-1 text-right font-mono text-foreground/80 whitespace-nowrap">{r.yr2}</td>
                            <td className="px-2 py-1 text-right font-mono text-foreground/80 whitespace-nowrap">{r.yr3}</td>
                            <td className="px-2 py-1 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">{r.total}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {sec.note && <p className="text-[10px] text-muted-foreground/60 italic">{sec.note}</p>}
                </>
              )}
            </div>
          ))}
        </div>
        {/* Action savings chart */}
        <div className="rounded-xl border border-border/50 bg-background/30 p-3 mb-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Carbon savings by action (%)</p>
          <div className="space-y-1.5">
            {s.actionChart.map(a => (
              <div key={a.label} className="flex items-center gap-2">
                <span className="text-[10px] w-28 shrink-0 text-muted-foreground">{a.label}</span>
                <div className="flex-1 bg-muted/20 rounded-full h-3 relative">
                  <div className="h-3 rounded-full bg-violet-500/60" style={{ width: `${a.carbonPct}%` }} />
                  {a.costPct > 0 && <div className="absolute top-0 h-3 rounded-full bg-emerald-500/40" style={{ width: `${a.costPct}%` }} />}
                </div>
                <span className="text-[10px] font-mono text-violet-400 w-12 text-right">−{a.carbonPct}% C</span>
                {a.costPct > 0 && <span className="text-[10px] font-mono text-emerald-400 w-12 text-right">−{a.costPct}% €</span>}
              </div>
            ))}
          </div>
          <p className="text-[9px] text-muted-foreground/50 mt-2">Purple = carbon reduction · Green = cost reduction</p>
        </div>
        {/* Strategic */}
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-3 mb-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-2">Strategic value (beyond Scope 2 compute)</p>
          <div className="space-y-1">
            {s.strategic.map(r => (
              <div key={r.item} className="flex items-center justify-between gap-2 text-xs">
                <span className="text-muted-foreground leading-tight">{r.item}</span>
                <span className="font-mono font-bold text-emerald-400 shrink-0">{r.total}</span>
              </div>
            ))}
          </div>
        </div>
        {/* How savings occur */}
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-2.5 mb-2">
          <p className="text-[10px] font-bold text-blue-400 mb-1">How these savings occur</p>
          <p className="text-[10px] text-muted-foreground leading-relaxed">{s.savingsNote}</p>
        </div>
        {/* Scope 3 Cat.11 monitoring */}
        <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3 mb-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-violet-400 mb-2">Scope 3 Cat.11 — 3-Year Monitoring Plan (if AI-as-a-service)</p>
          <div className="space-y-1.5 mb-2">
            {s.scope3cat11.map(row => (
              <div key={row.year} className="flex gap-3 items-start text-xs">
                <span className="shrink-0 font-mono font-bold text-violet-400 w-14">{row.year}</span>
                <span className="text-muted-foreground leading-relaxed flex-1">{row.action}</span>
                <span className="shrink-0 text-[10px] text-muted-foreground/60 whitespace-nowrap">{row.owner}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-amber-400/80 italic">{s.scope3cat11Note}</p>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-foreground">{s.total3yr}</p>
        </div>
        <p className="text-[9px] text-muted-foreground/50 italic mt-1">{s.note}</p>
      </div>
    );
  }

  if (slide.type === "embed") {
    const s = slide;
    return (
      <div className={base}>
        {header}
        <p className="text-xs text-muted-foreground mb-4">{s.subtitle}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {s.pillars.map(p => (
            <div key={p.label} className="rounded-lg border border-border bg-background/40 p-4">
              <div className="flex items-center gap-2 mb-2.5">
                <span className="text-base">{p.icon}</span>
                <span className="text-xs font-bold text-foreground">{p.label}</span>
              </div>
              <ul className="space-y-1.5">
                {p.items.map((item, i) => (
                  <li key={i} className="flex gap-2 items-start text-xs text-muted-foreground">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-violet-400/40 shrink-0" />
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (slide.type === "nextsteps") {
    const s = slide;
    const WEEK_COUNT = 12;
    const weekNums = Array.from({ length: WEEK_COUNT }, (_, i) => i + 1);
    const phaseBar  = ["bg-violet-500/75", "bg-amber-500/75", "bg-emerald-500/75"];
    const phaseText = ["text-violet-400", "text-amber-400", "text-emerald-400"];
    const phaseBand = ["bg-violet-500/5", "bg-amber-500/5", "bg-emerald-500/5"];
    const phaseLabel = ["Month 1 — Measure", "Month 2 — Benchmark & Optimise", "Month 3 — Disclose & Report"];
    const phaseBadge = [
      "border-violet-500/30 bg-violet-500/10 text-violet-400",
      "border-amber-500/30 bg-amber-500/10 text-amber-400",
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    ];
    return (
      <div className={base}>
        {header}
        <p className="text-xs text-muted-foreground mb-3">{s.subtitle}</p>
        {/* Legend */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[0, 1, 2].map(p => (
            <div key={p} className={`flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-md border ${phaseBadge[p]}`}>
              <span className={`w-2.5 h-2 rounded-sm inline-block ${phaseBar[p]}`} />
              {phaseLabel[p]}
            </div>
          ))}
        </div>
        {/* Gantt grid */}
        <div className="rounded-xl border border-border/50 overflow-hidden text-[10px]">
          {/* Month band header */}
          <div className="flex border-b border-border/40">
            <div className="shrink-0 border-r border-border/30 bg-muted/10" style={{ width: "210px" }} />
            <div className="flex-1 grid grid-cols-3">
              {[0, 1, 2].map(p => (
                <div key={p} className={`py-1.5 text-center font-bold ${phaseText[p]} ${phaseBand[p]} ${p > 0 ? "border-l border-border/30" : ""}`}>
                  {phaseLabel[p]}
                </div>
              ))}
            </div>
          </div>
          {/* Week numbers header */}
          <div className="flex border-b border-border/30 bg-muted/5">
            <div className="shrink-0 px-3 py-1.5 text-[9px] font-semibold text-muted-foreground uppercase tracking-wider border-r border-border/30" style={{ width: "210px" }}>
              Action · Owner
            </div>
            <div className="flex-1 grid" style={{ gridTemplateColumns: "repeat(12, 1fr)" }}>
              {weekNums.map(w => (
                <div key={w} className={`py-1.5 text-center font-mono text-muted-foreground/50 ${[1,5,9].includes(w) ? "border-l border-border/30" : "border-l border-border/10"}`}>
                  W{w}
                </div>
              ))}
            </div>
          </div>
          {/* Rows */}
          {s.timeline.map((item, idx) => (
            <div key={idx} className={`flex items-stretch border-b border-border/15 last:border-0 hover:bg-muted/5 transition-colors ${idx % 2 === 1 ? "bg-muted/3" : ""}`}>
              <div className="shrink-0 px-3 py-2 border-r border-border/20 flex flex-col justify-center" style={{ width: "210px" }}>
                <p className="font-medium text-foreground/80 leading-tight line-clamp-2">{item.label}</p>
                <p className="text-[9px] text-muted-foreground/60 mt-0.5 truncate">{item.owner}</p>
              </div>
              <div className="flex-1 grid" style={{ gridTemplateColumns: "repeat(12, 1fr)" }}>
                {weekNums.map(w => (
                  <div key={w} className={`relative ${[1,5,9].includes(w) ? "border-l border-border/25" : "border-l border-border/8"}`}>
                    {w >= item.start && w <= item.end && (
                      <div className={`absolute inset-x-0.5 inset-y-1.5 rounded-sm ${phaseBar[item.phase as 0|1|2]} opacity-90`} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-violet-500/25 bg-violet-500/5 px-4 py-2.5 mt-4">
          <p className="text-xs font-semibold text-violet-300">{s.cta}</p>
        </div>
      </div>
    );
  }

  if (slide.type === "close") {
    const s = slide;
    return (
      <div className={`${base} bg-gradient-to-br from-violet-500/5 to-card`}>
        {header}
        <p className="text-xs font-semibold text-muted-foreground mb-5">{s.presenter}</p>
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 px-5 py-4 mb-5">
          <p className="text-sm text-muted-foreground leading-relaxed italic">"{s.closing}"</p>
        </div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Resources</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {s.resources.map(r => (
            <div key={r.label} className="rounded-lg border border-border/40 bg-background/30 px-3 py-2.5">
              <p className="text-xs font-semibold text-violet-400 mb-0.5">{r.label}</p>
              <p className="text-[10px] text-muted-foreground">{r.note}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (slide.type === "intro") {
    const s = slide;
    return (
      <div className={`${base} bg-gradient-to-br from-violet-500/5 to-card`}>
        {header}
        <div className="rounded-xl border border-violet-500/25 bg-violet-500/5 px-5 py-4 mb-5 italic">
          <p className="text-sm text-foreground/80 leading-relaxed">"{s.hook}"</p>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-5">
          {s.stats.map(st => (
            <div key={st.label} className="rounded-lg border border-border bg-background/40 p-3 text-center">
              <div className="text-xl font-bold text-violet-400 mb-1">{st.value}</div>
              <div className="text-[10px] font-semibold text-foreground mb-0.5">{st.label}</div>
              <div className="text-[10px] text-muted-foreground leading-tight">{st.sub}</div>
            </div>
          ))}
        </div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Takeaways</p>
        <ul className="space-y-1.5">
          {s.takeaways.map((t, i) => (
            <li key={i} className="flex gap-2 items-start text-xs text-muted-foreground">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400/60 shrink-0" />
              <span className="leading-relaxed">{t}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (slide.type === "agenda") {
    const s = slide;
    const sectionColors: Record<string, { border: string; bg: string; text: string; dot: string }> = {
      violet:  { border: "border-violet-500/25",  bg: "bg-violet-500/5",  text: "text-violet-400",  dot: "bg-violet-400/60" },
      blue:    { border: "border-blue-500/25",     bg: "bg-blue-500/5",    text: "text-blue-400",    dot: "bg-blue-400/60" },
      emerald: { border: "border-emerald-500/25",  bg: "bg-emerald-500/5", text: "text-emerald-400", dot: "bg-emerald-400/60" },
      amber:   { border: "border-amber-500/25",    bg: "bg-amber-500/5",   text: "text-amber-400",   dot: "bg-amber-400/60" },
      rose:    { border: "border-rose-500/25",     bg: "bg-rose-500/5",    text: "text-rose-400",    dot: "bg-rose-400/60" },
    };
    return (
      <div className={base}>
        {header}
        <p className="text-xs text-muted-foreground mb-4">{s.subtitle}</p>
        <div className="space-y-3">
          {s.sections.map(sec => {
            const c = sectionColors[sec.color] ?? sectionColors.violet;
            return (
              <div key={sec.heading} className={`rounded-lg border ${c.border} ${c.bg} px-4 py-3`}>
                <p className={`text-[10px] font-bold uppercase tracking-widest ${c.text} mb-2`}>{sec.heading}</p>
                <div className="space-y-1">
                  {sec.items.map((item, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${c.dot}`} />
                      <span className="text-xs text-foreground/80 leading-relaxed">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (slide.type === "geojurisdiction") {
    const s = slide;
    const statusStyle = {
      mandatory: "text-emerald-400 border-emerald-500/30 bg-emerald-500/5",
      contested: "text-amber-400 border-amber-500/30 bg-amber-500/5",
      voluntary: "text-muted-foreground border-border/40 bg-background/30",
    };
    const statusLabel = { mandatory: "Mandatory", contested: "Contested", voluntary: "Voluntary" };
    return (
      <div className={base}>
        {header}
        <p className="text-xs text-muted-foreground mb-4">{s.subtitle}</p>
        <div className="space-y-1.5 mb-4">
          {s.regions.map(r => (
            <div key={r.region} className="grid grid-cols-[140px_auto_1fr] gap-3 items-start rounded-lg border border-border/30 px-3 py-2 bg-background/30">
              <span className="text-xs font-semibold text-foreground">{r.region}</span>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded border whitespace-nowrap ${statusStyle[r.status]}`}>{statusLabel[r.status]}</span>
              <div>
                <div className="flex flex-wrap gap-1 mb-0.5">
                  {r.regulations.map(reg => (
                    <span key={reg} className="text-[9px] font-mono text-violet-400/70 border border-violet-500/20 px-1.5 rounded">{reg}</span>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">{r.note}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 px-4 py-2.5">
          <p className="text-[10px] font-semibold text-amber-400 mb-0.5">Key insight</p>
          <p className="text-[10px] text-muted-foreground leading-relaxed">{s.insight}</p>
        </div>
      </div>
    );
  }

  return null;
}

// ── Slideshow (fullscreen) ─────────────────────────────────────────────────────

function SlideshowMode({ onClose }: { onClose: () => void }) {
  const [current, setCurrent] = useState(0);
  const total = SLIDES.length;
  const prev = useCallback(() => setCurrent(c => Math.max(0, c - 1)), []);
  const next = useCallback(() => setCurrent(c => Math.min(total - 1, c + 1)), [total]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); next(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <div className="flex items-center justify-between px-6 py-3 border-b border-border/40 shrink-0">
        <span className="text-xs font-mono text-muted-foreground">{current + 1} / {total}</span>
        <div className="flex items-center gap-1">
          {SLIDES.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${i === current ? "bg-violet-400" : "bg-border hover:bg-muted-foreground/40"}`}
            />
          ))}
        </div>
        <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">✕ Esc</button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[900px] mx-auto px-6 py-8">
          <SlideCard slide={SLIDES[current]} index={current} />
        </div>
      </div>
      <div className="flex items-center justify-between px-6 py-4 border-t border-border/40 shrink-0">
        <button onClick={prev} disabled={current === 0} className="text-xs font-semibold text-muted-foreground hover:text-foreground disabled:opacity-30">← Previous</button>
        <span className="text-xs font-bold text-muted-foreground">{SLIDES[current].title}</span>
        <button onClick={next} disabled={current === total - 1} className="text-xs font-semibold text-muted-foreground hover:text-foreground disabled:opacity-30">Next →</button>
      </div>
    </div>
  );
}

// ── PPTX export ───────────────────────────────────────────────────────────────

async function exportPPTX() {
  const prs = new pptxgen();
  prs.layout = "LAYOUT_WIDE";

  const BG = "F8FAFC"; const FG = "0F172A"; const MUTED = "475569";
  const VIOLET = "6D28D9"; const VIOLET2 = "5B21B6"; const EMERALD = "059669";
  const AMBER = "B45309"; const ROSE = "B91C1C";

  function base(prs: pptxgen, title: string, sub: string, n: number) {
    const sl = prs.addSlide();
    sl.background = { color: BG };
    sl.addText(`${n} / ${SLIDES.length}`, { x: 0.3, y: 0.12, w: 1, h: 0.2, fontSize: 8, color: MUTED, fontFace: "Courier New" });
    sl.addText(title, { x: 0.5, y: 0.45, w: 12.3, h: 0.65, fontSize: 24, bold: true, color: FG, fontFace: "Calibri" });
    if (sub) sl.addText(sub, { x: 0.5, y: 1.15, w: 12.3, h: 0.38, fontSize: 11, color: MUTED, italic: true, fontFace: "Calibri" });
    return sl;
  }

  function bullets(sl: ReturnType<pptxgen["addSlide"]>, label: string, items: string[], x: number, y: number, w: number, color = VIOLET2) {
    sl.addText(label, { x, y, w, h: 0.22, fontSize: 8.5, bold: true, color, fontFace: "Calibri", charSpacing: 0.5 });
    const b = items.map(t => ({ text: t, options: { bullet: { type: "bullet" as const }, fontSize: 9.5, color: MUTED, fontFace: "Calibri", paraSpaceAfter: 3 } }));
    sl.addText(b, { x, y: y + 0.25, w, h: items.length * 0.3 });
  }

  SLIDES.forEach((slide, i) => {
    const n = i + 1;

    if (slide.type === "intro") {
      const sl = base(prs, slide.title, "", n);
      sl.addText(`"${slide.hook}"`, { x: 0.5, y: 1.55, w: 12.3, h: 0.65, fontSize: 11, color: VIOLET2, italic: true, fontFace: "Calibri", wrap: true });
      slide.stats.forEach((st, si) => {
        const sx = 0.5 + si * 4.1;
        sl.addShape(prs.ShapeType.roundRect, { x: sx, y: 2.35, w: 3.9, h: 1.2, fill: { color: "EFF6FF" }, line: { color: "CBD5E1", width: 0.75 } });
        sl.addText(st.value, { x: sx + 0.1, y: 2.45, w: 3.7, h: 0.45, fontSize: 18, bold: true, color: VIOLET2, align: "center", fontFace: "Calibri" });
        sl.addText(st.label, { x: sx + 0.1, y: 2.95, w: 3.7, h: 0.3, fontSize: 8.5, color: FG, align: "center", fontFace: "Calibri" });
        sl.addText(st.sub, { x: sx + 0.1, y: 3.28, w: 3.7, h: 0.22, fontSize: 7.5, color: MUTED, align: "center", fontFace: "Calibri" });
      });
      sl.addText("TAKEAWAYS", { x: 0.5, y: 3.75, w: 12.3, h: 0.22, fontSize: 8.5, bold: true, color: MUTED, fontFace: "Calibri", charSpacing: 0.5 });
      bullets(sl, "", slide.takeaways, 0.5, 4.05, 12.3);
    } else if (slide.type === "agenda") {
      const sl = base(prs, slide.title, slide.subtitle, n);
      const agendaLineColors: Record<string, string> = { violet: VIOLET, blue: "1D4ED8", emerald: EMERALD, amber: AMBER, rose: ROSE };
      slide.sections.forEach((sec, si) => {
        const sy = 1.55 + si * 1.05;
        const lc = agendaLineColors[sec.color] ?? VIOLET;
        sl.addShape(prs.ShapeType.roundRect, { x: 0.5, y: sy, w: 12.3, h: 0.9, fill: { color: "EFF6FF" }, line: { color: lc, width: 0.75 } });
        sl.addText(sec.heading.toUpperCase(), { x: 0.65, y: sy + 0.07, w: 3.5, h: 0.2, fontSize: 8.5, bold: true, color: lc, fontFace: "Calibri", charSpacing: 0.5 });
        sl.addText(sec.items.join("  ·  "), { x: 0.65, y: sy + 0.32, w: 11.9, h: 0.48, fontSize: 9, color: MUTED, fontFace: "Calibri", wrap: true });
      });
    } else if (slide.type === "geojurisdiction") {
      const sl = base(prs, slide.title, slide.subtitle, n);
      slide.regions.forEach((r, ri) => {
        const ry = 1.55 + ri * 0.63;
        const lc = r.status === "mandatory" ? EMERALD : r.status === "contested" ? AMBER : "94A3B8";
        sl.addShape(prs.ShapeType.roundRect, { x: 0.5, y: ry, w: 12.3, h: 0.55, fill: { color: "EFF6FF" }, line: { color: lc, width: 0.75 } });
        sl.addText(`${r.region}  ·  ${r.status.toUpperCase()}`, { x: 0.62, y: ry + 0.06, w: 4.0, h: 0.2, fontSize: 8.5, bold: true, color: FG, fontFace: "Calibri" });
        sl.addText(r.regulations.join("  ·  "), { x: 4.8, y: ry + 0.06, w: 7.8, h: 0.2, fontSize: 8, color: VIOLET2, fontFace: "Calibri" });
        sl.addText(r.note, { x: 0.62, y: ry + 0.31, w: 12.0, h: 0.18, fontSize: 7.5, color: MUTED, fontFace: "Calibri", wrap: true });
      });
    } else if (slide.type === "roiinputs") {
      const sl = base(prs, slide.title, slide.subtitle, n);
      sl.addShape(prs.ShapeType.roundRect, { x: 0.5, y: 1.55, w: 6.0, h: 2.8, fill: { color: "EFF6FF" }, line: { color: VIOLET, width: 0.75 } });
      sl.addText("TRAINING WORKLOAD", { x: 0.65, y: 1.65, w: 5.7, h: 0.22, fontSize: 8.5, bold: true, color: VIOLET2, fontFace: "Calibri" });
      slide.training.inputs.forEach((inp, i) => {
        sl.addText(`${inp.param}: ${inp.value}`, { x: 0.65, y: 1.95 + i * 0.28, w: 5.7, h: 0.25, fontSize: 8.5, color: MUTED, fontFace: "Calibri" });
      });
      sl.addShape(prs.ShapeType.roundRect, { x: 6.8, y: 1.55, w: 6.0, h: 2.8, fill: { color: "EFF6FF" }, line: { color: "1D4ED8", width: 0.75 } });
      sl.addText("INFERENCE WORKLOAD", { x: 6.95, y: 1.65, w: 5.7, h: 0.22, fontSize: 8.5, bold: true, color: "1D4ED8", fontFace: "Calibri" });
      slide.inference.inputs.forEach((inp, i) => {
        sl.addText(`${inp.param}: ${inp.value}`, { x: 6.95, y: 1.95 + i * 0.28, w: 5.7, h: 0.25, fontSize: 8.5, color: MUTED, fontFace: "Calibri" });
      });
      sl.addText("STEP-BY-STEP CALCULATIONS", { x: 0.5, y: 4.48, w: 12.3, h: 0.22, fontSize: 8, bold: true, color: MUTED, fontFace: "Calibri", charSpacing: 0.5 });
      const calcData = [
        [{ text: "Metric", options: { bold: true, color: FG, fill: { color: "EFF6FF" } } },
         { text: "Formula", options: { bold: true, color: FG, fill: { color: "EFF6FF" } } },
         { text: "Result", options: { bold: true, color: EMERALD, fill: { color: "EFF6FF" } } }],
        ...slide.calculations.map(c => [
          { text: c.label, options: { color: MUTED, fill: { color: "F1F5F9" } } },
          { text: c.formula, options: { color: "64748B", fill: { color: "F1F5F9" } } },
          { text: c.result, options: { bold: true, color: EMERALD, fill: { color: "F1F5F9" } } },
        ])
      ];
      sl.addTable(calcData as Parameters<typeof sl.addTable>[0], {
        x: 0.5, y: 4.72, w: 12.3, fontSize: 8, fontFace: "Calibri",
        border: { type: "solid", color: "CBD5E1", pt: 0.5 }, rowH: 0.35,
      });
    } else if (slide.type === "cover") {
      const sl = prs.addSlide(); sl.background = { color: BG };
      // Tags row at very top — no overlap with hook text
      slide.tags.forEach((tag, ti) => {
        sl.addText(tag, { x: 0.5 + ti * 3.1, y: 0.18, w: 2.85, h: 0.32, fontSize: 8.5, color: VIOLET2, align: "center", fontFace: "Courier New",
          shape: prs.ShapeType.roundRect, fill: { color: "EDE9FE" }, line: { color: VIOLET, width: 0.5 } });
      });
      // Title block
      sl.addText(slide.title, { x: 0.5, y: 0.65, w: 12.3, h: 0.72, fontSize: 30, bold: true, color: FG, fontFace: "Calibri" });
      sl.addText(slide.subtitle, { x: 0.5, y: 1.47, w: 12.3, h: 0.35, fontSize: 13, color: VIOLET2, fontFace: "Calibri", italic: true });
      sl.addText(`${slide.event}  ·  ${new Date().getFullYear()}`, { x: 0.5, y: 1.9, w: 12.3, h: 0.26, fontSize: 10, color: MUTED, fontFace: "Calibri" });
      sl.addText(slide.presenter, { x: 0.5, y: 2.22, w: 12.3, h: 0.25, fontSize: 10, bold: true, color: FG, fontFace: "Calibri" });
      // Hook amber box — fills remaining slide area, well clear of any tag overlap
      sl.addShape(prs.ShapeType.roundRect, { x: 0.5, y: 2.62, w: 12.3, h: 4.55, fill: { color: "FFFBEB" }, line: { color: AMBER, width: 0.75 } });
      sl.addText("WHY THIS SESSION MATTERS", { x: 0.65, y: 2.76, w: 12.0, h: 0.22, fontSize: 8.5, bold: true, color: AMBER, fontFace: "Calibri", charSpacing: 0.5 });
      // Each paragraph in its own text box — reliable layout regardless of line wrapping
      slide.hookParagraphs.forEach((para, pi) => {
        sl.addText(para, { x: 0.65, y: 3.06 + pi * 0.88, w: 12.0, h: 0.82, fontSize: 9.5, color: MUTED, fontFace: "Calibri", wrap: true, valign: "top" });
      });
    } else if (slide.type === "why") {
      const sl = base(prs, slide.title, "", n);
      slide.points.forEach((p, pi) => {
        const px = pi < 2 ? 0.5 : 6.9; const py = 1.6 + (pi % 2) * 1.6;
        sl.addShape(prs.ShapeType.roundRect, { x: px, y: py, w: 6.1, h: 1.4, fill: { color: "EFF6FF" }, line: { color: "CBD5E1", width: 0.75 } });
        sl.addText(`${p.icon} ${p.label}`, { x: px + 0.15, y: py + 0.1, w: 5.8, h: 0.28, fontSize: 10, bold: true, color: FG, fontFace: "Calibri" });
        sl.addText(p.body, { x: px + 0.15, y: py + 0.42, w: 5.8, h: 0.85, fontSize: 9, color: MUTED, fontFace: "Calibri", wrap: true });
      });
      sl.addShape(prs.ShapeType.roundRect, { x: 3.5, y: 4.85, w: 6.3, h: 1.1, fill: { color: "FEF2F2" }, line: { color: ROSE, width: 1 } });
      sl.addText(slide.stat.value, { x: 3.5, y: 4.9, w: 6.3, h: 0.55, fontSize: 28, bold: true, color: ROSE, align: "center", fontFace: "Calibri" });
      sl.addText(`${slide.stat.label} · ${slide.stat.sub}`, { x: 3.5, y: 5.5, w: 6.3, h: 0.3, fontSize: 8.5, color: MUTED, align: "center", fontFace: "Calibri" });
    } else if (slide.type === "footprint") {
      const sl = base(prs, slide.title, slide.subtitle, n);
      sl.addText(slide.analogy, { x: 0.5, y: 1.55, w: 12.3, h: 0.4, fontSize: 10, color: VIOLET2, italic: true, fontFace: "Calibri", wrap: true });
      const scopeColors: Record<string, string> = { high: ROSE, medium: AMBER, low: EMERALD };
      slide.scopes.forEach((sc, si) => {
        const cx = 0.5 + (si % 2) * 6.4; const cy = 2.1 + Math.floor(si / 2) * 1.5;
        sl.addShape(prs.ShapeType.roundRect, { x: cx, y: cy, w: 6.1, h: 1.3, fill: { color: "EFF6FF" }, line: { color: scopeColors[sc.color] ?? "334155", width: 0.75 } });
        sl.addText(`${sc.scope} — ${sc.label}`, { x: cx + 0.1, y: cy + 0.08, w: 5.9, h: 0.28, fontSize: 10, bold: true, color: FG, fontFace: "Calibri" });
        sl.addText(sc.example, { x: cx + 0.1, y: cy + 0.4, w: 5.9, h: 0.75, fontSize: 8.5, color: MUTED, fontFace: "Calibri", wrap: true });
      });
      sl.addText(slide.formula, { x: 0.5, y: 5.05, w: 12.3, h: 0.8, fontSize: 9, color: FG, fontFace: "Courier New", wrap: true });
    } else if (slide.type === "regulation") {
      const sl = base(prs, slide.title, slide.subtitle, n);
      slide.obligations.forEach((o, oi) => {
        const oy = 1.55 + oi * 0.85;
        const lineColor = o.color === "high" ? ROSE : o.color === "medium" ? AMBER : "334155";
        sl.addShape(prs.ShapeType.roundRect, { x: 0.5, y: oy, w: 12.3, h: 0.72, fill: { color: "EFF6FF" }, line: { color: lineColor, width: 0.75 } });
        sl.addText(`${o.reg}  ·  ${o.status}  ·  ${o.when}`, { x: 0.6, y: oy + 0.07, w: 11.9, h: 0.24, fontSize: 10, bold: true, color: FG, fontFace: "Calibri" });
        sl.addText(o.detail, { x: 0.6, y: oy + 0.35, w: 11.9, h: 0.3, fontSize: 8.5, color: MUTED, fontFace: "Calibri", wrap: true });
      });
    } else if (slide.type === "measure") {
      const sl = base(prs, slide.title, slide.subtitle, n);
      slide.steps.forEach((st, si) => {
        const sy = 1.55 + si * 0.85;
        sl.addShape(prs.ShapeType.roundRect, { x: 0.5, y: sy, w: 12.3, h: 0.72, fill: { color: "EFF6FF" }, line: { color: "CBD5E1", width: 0.5 } });
        sl.addText(`${st.n}  ${st.label}`, { x: 0.65, y: sy + 0.07, w: 11.9, h: 0.24, fontSize: 10, bold: true, color: FG, fontFace: "Calibri" });
        sl.addText(st.body, { x: 0.65, y: sy + 0.35, w: 11.9, h: 0.3, fontSize: 8.5, color: MUTED, fontFace: "Calibri", wrap: true });
      });
      sl.addText(slide.example, { x: 0.5, y: 5.85, w: 12.3, h: 0.4, fontSize: 9, color: EMERALD, fontFace: "Courier New", wrap: true });
    } else if (slide.type === "actions") {
      const sl = base(prs, slide.title, slide.subtitle, n);
      slide.actions.forEach((a, ai) => {
        const ay = 1.55 + ai * 0.93;
        sl.addShape(prs.ShapeType.roundRect, { x: 0.5, y: ay, w: 12.3, h: 0.8, fill: { color: "EFF6FF" }, line: { color: "CBD5E1", width: 0.5 } });
        sl.addText(`${a.rank}  ${a.action}   ${a.carbon}   ${a.cost}   ${a.effort} effort`, { x: 0.65, y: ay + 0.07, w: 11.9, h: 0.25, fontSize: 10, bold: true, color: FG, fontFace: "Calibri" });
        sl.addText(a.detail, { x: 0.65, y: ay + 0.38, w: 11.9, h: 0.35, fontSize: 8.5, color: MUTED, fontFace: "Calibri", wrap: true });
      });
    } else if (slide.type === "benefits") {
      const sl = base(prs, slide.title, "", n);
      slide.categories.forEach((cat, ci) => {
        const cx = 0.5 + (ci % 2) * 6.4; const cy = 1.55 + Math.floor(ci / 2) * 2.4;
        sl.addShape(prs.ShapeType.roundRect, { x: cx, y: cy, w: 6.1, h: 2.2, fill: { color: "EFF6FF" }, line: { color: "CBD5E1", width: 0.5 } });
        sl.addText(cat.label, { x: cx + 0.1, y: cy + 0.1, w: 5.9, h: 0.28, fontSize: 10, bold: true, color: FG, fontFace: "Calibri" });
        bullets(sl, "", cat.items, cx + 0.1, cy + 0.4, 5.9);
      });
    } else if (slide.type === "kpis") {
      const sl = base(prs, slide.title, slide.subtitle, n);
      const tableData = [
        [{ text: "Category", options: { bold: true, color: FG, fill: { color: "EFF6FF" } } },
         { text: "Metric", options: { bold: true, color: FG, fill: { color: "EFF6FF" } } },
         { text: "Frequency", options: { bold: true, color: FG, fill: { color: "EFF6FF" } } },
         { text: "Standard", options: { bold: true, color: FG, fill: { color: "EFF6FF" } } },
         { text: "Priority", options: { bold: true, color: FG, fill: { color: "EFF6FF" } } }],
        ...slide.kpis.map(k => [
          { text: k.category, options: { color: MUTED, fill: { color: "F1F5F9" } } },
          { text: k.metric, options: { bold: true, color: FG, fill: { color: "F1F5F9" } } },
          { text: k.frequency, options: { color: MUTED, fill: { color: "F1F5F9" } } },
          { text: k.standard, options: { color: VIOLET2, fill: { color: "F1F5F9" } } },
          { text: k.priority, options: { color: k.priority === "mandatory" ? ROSE : AMBER, fill: { color: "F1F5F9" } } },
        ])
      ];
      sl.addTable(tableData as Parameters<typeof sl.addTable>[0], {
        x: 0.5, y: 1.55, w: 12.3, fontSize: 8.5, fontFace: "Calibri",
        border: { type: "solid", color: "CBD5E1", pt: 0.5 }, rowH: 0.42,
      });
    } else if (slide.type === "roi") {
      const sl = base(prs, slide.title, slide.subtitle, n);
      // Collect all Scope 2 rows from sections
      const allRows: { item: string; tag: string; yr1: string; yr2: string; yr3: string; total: string }[] = [];
      slide.sections.forEach(sec => { allRows.push(...sec.rows); });
      const tableData = [
        [{ text: "Action", options: { bold: true, color: FG, fill: { color: "EFF6FF" } } },
         { text: "Yr 1", options: { bold: true, color: FG, fill: { color: "EFF6FF" } } },
         { text: "Yr 2", options: { bold: true, color: FG, fill: { color: "EFF6FF" } } },
         { text: "Yr 3", options: { bold: true, color: FG, fill: { color: "EFF6FF" } } },
         { text: "3-Yr Total", options: { bold: true, color: EMERALD, fill: { color: "EFF6FF" } } }],
        ...allRows.map(r => [
          { text: `[${r.tag}] ${r.item}`, options: { color: MUTED, fill: { color: "F1F5F9" }, fontSize: 8 } },
          { text: r.yr1, options: { color: FG, fill: { color: "F1F5F9" } } },
          { text: r.yr2, options: { color: FG, fill: { color: "F1F5F9" } } },
          { text: r.yr3, options: { color: FG, fill: { color: "F1F5F9" } } },
          { text: r.total, options: { bold: true, color: EMERALD, fill: { color: "F1F5F9" } } },
        ]),
        ...slide.strategic.map(r => [
          { text: r.item, options: { color: MUTED, fill: { color: "EDE9FE" }, fontSize: 8 } },
          { text: r.yr1, options: { color: FG, fill: { color: "EDE9FE" } } },
          { text: r.yr2, options: { color: FG, fill: { color: "EDE9FE" } } },
          { text: r.yr3, options: { color: FG, fill: { color: "EDE9FE" } } },
          { text: r.total, options: { bold: true, color: EMERALD, fill: { color: "EDE9FE" } } },
        ]),
      ];
      sl.addTable(tableData as Parameters<typeof sl.addTable>[0], {
        x: 0.5, y: 1.55, w: 12.3, fontSize: 8.5, fontFace: "Calibri",
        border: { type: "solid", color: "CBD5E1", pt: 0.5 }, rowH: 0.42,
      });
      sl.addText(slide.total3yr, { x: 0.5, y: 6.45, w: 12.3, h: 0.22, fontSize: 10, bold: true, color: EMERALD, fontFace: "Calibri" });
      sl.addText(slide.note, { x: 0.5, y: 6.70, w: 12.3, h: 0.22, fontSize: 7, italic: true, color: MUTED, fontFace: "Calibri", wrap: true });

      // ── PPTX Slide B: Action Savings by Lever ────────────────────────────────
      const abSl = prs.addSlide(); abSl.background = { color: BG };
      abSl.addText("ROI — Action Savings by Lever", { x: 0.5, y: 0.25, w: 12.3, h: 0.46, fontSize: 20, bold: true, color: FG, fontFace: "Calibri" });
      abSl.addText("Estimated carbon reduction % and cost savings % per action — Scope 2 electricity workloads", { x: 0.5, y: 0.76, w: 12.3, h: 0.26, fontSize: 9, italic: true, color: MUTED, fontFace: "Calibri" });
      // Legend
      abSl.addShape(prs.ShapeType.rect, { x: 0.5, y: 1.14, w: 0.22, h: 0.15, fill: { color: "C4B5FD" }, line: { color: VIOLET, width: 0 } });
      abSl.addText("Carbon reduction %", { x: 0.76, y: 1.11, w: 2.2, h: 0.2, fontSize: 8, color: FG, fontFace: "Calibri" });
      abSl.addShape(prs.ShapeType.rect, { x: 3.1, y: 1.14, w: 0.22, h: 0.15, fill: { color: "6EE7B7" }, line: { color: EMERALD, width: 0 } });
      abSl.addText("Cost savings %", { x: 3.36, y: 1.11, w: 2.0, h: 0.2, fontSize: 8, color: FG, fontFace: "Calibri" });
      // Action bar rows
      const AB_BAR_X = 5.5; const AB_BAR_W = 7.2; const AB_ROW_H = 0.45; const AB_Y0 = 1.44;
      slide.actionChart.forEach((a, ai) => {
        const ry = AB_Y0 + ai * AB_ROW_H;
        // Scope badge
        abSl.addShape(prs.ShapeType.roundRect, { x: 0.5, y: ry + 0.07, w: 1.1, h: 0.24, fill: { color: "EDE9FE" }, line: { color: VIOLET, width: 0.5 } });
        abSl.addText(a.scope, { x: 0.5, y: ry + 0.08, w: 1.1, h: 0.22, fontSize: 6.5, color: VIOLET, align: "center", fontFace: "Calibri" });
        // Action label
        abSl.addText(a.label, { x: 1.72, y: ry + 0.06, w: 3.6, h: 0.26, fontSize: 9.5, bold: true, color: FG, fontFace: "Calibri" });
        // Carbon bar background
        abSl.addShape(prs.ShapeType.roundRect, { x: AB_BAR_X, y: ry + 0.04, w: AB_BAR_W, h: 0.16, fill: { color: "E2E8F0" }, line: { color: "CBD5E1", width: 0 } });
        // Carbon bar fill
        const cbw = Math.max(0.05, AB_BAR_W * a.carbonPct / 100);
        abSl.addShape(prs.ShapeType.roundRect, { x: AB_BAR_X, y: ry + 0.04, w: cbw, h: 0.16, fill: { color: "C4B5FD" }, line: { color: VIOLET, width: 0 } });
        abSl.addText(`\u2212${a.carbonPct}%`, { x: AB_BAR_X + cbw + 0.05, y: ry + 0.03, w: 0.65, h: 0.18, fontSize: 7.5, bold: true, color: VIOLET, fontFace: "Calibri" });
        // Cost bar background
        abSl.addShape(prs.ShapeType.roundRect, { x: AB_BAR_X, y: ry + 0.24, w: AB_BAR_W, h: 0.16, fill: { color: "E2E8F0" }, line: { color: "CBD5E1", width: 0 } });
        // Cost bar fill
        if (a.costPct > 0) {
          const costBw = Math.max(0.05, AB_BAR_W * a.costPct / 100);
          abSl.addShape(prs.ShapeType.roundRect, { x: AB_BAR_X, y: ry + 0.24, w: costBw, h: 0.16, fill: { color: "6EE7B7" }, line: { color: EMERALD, width: 0 } });
          abSl.addText(`\u2212${a.costPct}%`, { x: AB_BAR_X + costBw + 0.05, y: ry + 0.23, w: 0.65, h: 0.18, fontSize: 7.5, bold: true, color: EMERALD, fontFace: "Calibri" });
        } else {
          abSl.addText("n/a", { x: AB_BAR_X + 0.05, y: ry + 0.23, w: 0.65, h: 0.18, fontSize: 7.5, color: MUTED, fontFace: "Calibri" });
        }
      });
      // Savings callout box
      const savingsY = AB_Y0 + 5 * AB_ROW_H + 0.10;
      abSl.addShape(prs.ShapeType.roundRect, { x: 0.5, y: savingsY, w: 12.3, h: 1.0, fill: { color: "EFF6FF" }, line: { color: "1D4ED8", width: 0.75 } });
      abSl.addText("How these savings occur:", { x: 0.65, y: savingsY + 0.08, w: 12.0, h: 0.22, fontSize: 8.5, bold: true, color: "1D4ED8", fontFace: "Calibri" });
      abSl.addText(slide.savingsNote.replace("How these savings occur: ", ""), { x: 0.65, y: savingsY + 0.32, w: 12.0, h: 0.62, fontSize: 7.5, color: FG, fontFace: "Calibri", wrap: true });
      // Scope 3 Cat.11 section
      const s3Y = savingsY + 1.0 + 0.10;
      abSl.addText("Scope 3 Category 11 — 3-Year Monitoring Plan", { x: 0.5, y: s3Y, w: 12.3, h: 0.24, fontSize: 9, bold: true, color: AMBER, fontFace: "Calibri" });
      const s3TableData = [
        [
          { text: "Year", options: { bold: true, color: FG, fill: { color: "FFFBEB" } } },
          { text: "Action", options: { bold: true, color: FG, fill: { color: "FFFBEB" } } },
          { text: "Owner", options: { bold: true, color: FG, fill: { color: "FFFBEB" } } },
        ],
        ...slide.scope3cat11.map(r => [
          { text: r.year, options: { bold: true, color: AMBER, fill: { color: "F8FAFC" } } },
          { text: r.action, options: { color: MUTED, fill: { color: "F8FAFC" }, fontSize: 7.5 } },
          { text: r.owner, options: { color: FG, fill: { color: "F8FAFC" }, fontSize: 8 } },
        ]),
      ];
      abSl.addTable(s3TableData as Parameters<typeof abSl.addTable>[0], {
        x: 0.5, y: s3Y + 0.28, w: 12.3, colW: [1.2, 8.9, 2.2],
        fontSize: 8, fontFace: "Calibri",
        border: { type: "solid", color: "CBD5E1", pt: 0.5 }, rowH: 0.35,
      });
      abSl.addText(slide.scope3cat11Note, { x: 0.5, y: s3Y + 0.28 + 4 * 0.35 + 0.04, w: 12.3, h: 0.24, fontSize: 7, italic: true, color: MUTED, fontFace: "Calibri", wrap: true });

      // ── PPTX Slide C: 3-Year Conformance Trajectory chart
      const ctSl = prs.addSlide(); ctSl.background = { color: BG };
      ctSl.addText("3-Year Conformance Trajectory", { x: 0.5, y: 0.3, w: 12.3, h: 0.58, fontSize: 22, bold: true, color: FG, fontFace: "Calibri" });
      ctSl.addText("Compliance progression from unmanaged baseline to full board assurance and ESG strategic value", { x: 0.5, y: 0.95, w: 12.3, h: 0.28, fontSize: 9.5, color: MUTED, italic: true, fontFace: "Calibri" });
      const COL_W = 2.85; const COL_GAP = 0.2;
      const ctStartX = 0.65;
      const ctConformColors: Record<string, string> = { rose: ROSE, amber: AMBER, violet: VIOLET, emerald: EMERALD };
      const ctConformFill: Record<string, string>   = { rose: "FEF2F2", amber: "FFFBEB", violet: "EDE9FE", emerald: "ECFDF5" };
      // Track line connecting nodes
      const nodeY = 2.18;
      ctSl.addShape(prs.ShapeType.rect, {
        x: ctStartX + COL_W / 2,
        y: nodeY + 0.14,
        w: 3 * (COL_W + COL_GAP),
        h: 0.04,
        fill: { color: "CBD5E1" },
        line: { color: "CBD5E1", width: 0 },
      });
      slide.conformanceTimeline.forEach((m, mi) => {
        const cx = ctStartX + mi * (COL_W + COL_GAP);
        const lc = ctConformColors[m.color] ?? VIOLET;
        const fc = ctConformFill[m.color] ?? "EFF6FF";
        // Node circle
        const nodeCx = cx + COL_W / 2 - 0.18;
        ctSl.addShape(prs.ShapeType.ellipse, { x: nodeCx, y: nodeY, w: 0.36, h: 0.36, fill: { color: fc }, line: { color: lc, width: 1.5 } });
        ctSl.addShape(prs.ShapeType.ellipse, { x: nodeCx + 0.09, y: nodeY + 0.09, w: 0.18, h: 0.18, fill: { color: lc }, line: { color: lc, width: 0 } });
        // Card background
        ctSl.addShape(prs.ShapeType.roundRect, { x: cx, y: 2.68, w: COL_W, h: 4.4, fill: { color: fc }, line: { color: lc, width: 0.75 } });
        // Year heading
        ctSl.addText(m.year, { x: cx + 0.1, y: 2.78, w: COL_W - 0.2, h: 0.38, fontSize: 15, bold: true, color: lc, align: "center", fontFace: "Calibri" });
        ctSl.addText(m.label, { x: cx + 0.1, y: 3.2, w: COL_W - 0.2, h: 0.3, fontSize: 8, color: MUTED, align: "center", fontFace: "Calibri", wrap: true });
        // Compliance bar background
        ctSl.addShape(prs.ShapeType.roundRect, { x: cx + 0.2, y: 3.62, w: COL_W - 0.4, h: 0.18, fill: { color: "E2E8F0" }, line: { color: "CBD5E1", width: 0 } });
        // Compliance bar fill
        const bw = Math.max(0.05, (COL_W - 0.4) * m.compliancePct / 100);
        ctSl.addShape(prs.ShapeType.roundRect, { x: cx + 0.2, y: 3.62, w: bw, h: 0.18, fill: { color: lc }, line: { color: lc, width: 0 } });
        ctSl.addText(`${m.compliancePct}% compliant`, { x: cx + 0.1, y: 3.86, w: COL_W - 0.2, h: 0.24, fontSize: 9, bold: true, color: lc, align: "center", fontFace: "Calibri" });
        // Metrics
        ctSl.addText(`Carbon: ${m.scope2Carbon}`, { x: cx + 0.15, y: 4.18, w: COL_W - 0.3, h: 0.22, fontSize: 8, color: FG, fontFace: "Calibri" });
        ctSl.addText(`Cost: ${m.scope2Cost}`, { x: cx + 0.15, y: 4.42, w: COL_W - 0.3, h: 0.22, fontSize: 8, color: FG, fontFace: "Calibri" });
        // Actions
        ctSl.addText("Key actions:", { x: cx + 0.15, y: 4.72, w: COL_W - 0.3, h: 0.2, fontSize: 7.5, bold: true, color: MUTED, fontFace: "Calibri" });
        m.actions.forEach((a, ai) => {
          ctSl.addText(`· ${a}`, { x: cx + 0.15, y: 4.95 + ai * 0.38, w: COL_W - 0.3, h: 0.34, fontSize: 7.5, color: MUTED, fontFace: "Calibri", wrap: true });
        });
      });
    } else if (slide.type === "embed") {
      const sl = base(prs, slide.title, slide.subtitle, n);
      slide.pillars.forEach((p, pi) => {
        const px = 0.5 + (pi % 2) * 6.4; const py = 1.55 + Math.floor(pi / 2) * 2.5;
        sl.addShape(prs.ShapeType.roundRect, { x: px, y: py, w: 6.1, h: 2.3, fill: { color: "EFF6FF" }, line: { color: "CBD5E1", width: 0.5 } });
        sl.addText(`${p.icon} ${p.label}`, { x: px + 0.1, y: py + 0.08, w: 5.9, h: 0.28, fontSize: 10, bold: true, color: FG, fontFace: "Calibri" });
        bullets(sl, "", p.items, px + 0.1, py + 0.38, 5.9);
      });
    } else if (slide.type === "nextsteps") {
      const sl = base(prs, slide.title, slide.subtitle, n);
      // ── Gantt chart layout ────────────────────────────────────────────────
      const G_LBL = 3.85;        // label column width (inches)
      const G_GANTT = 8.45;      // total Gantt area width
      const G_WW = G_GANTT / 12; // width per week column
      const G_X = 0.5;           // left margin
      const G_Y = 1.55;          // top of Gantt (below base title/subtitle)
      const G_ROW = 0.35;        // row height
      const pBarFill   = ["C4B5FD", "FCD34D", "6EE7B7"]; // violet/amber/emerald bar fill
      const pBarLine   = [VIOLET,   AMBER,    EMERALD];   // border
      const pBandFill  = ["EDE9FE", "FFFBEB", "ECFDF5"]; // month band bg
      const pBandText  = [VIOLET,   AMBER,    EMERALD];   // month band label

      // Month band header (3 equal groups of 4 weeks)
      const monthLabels = ["Month 1 — Measure", "Month 2 — Benchmark & Optimise", "Month 3 — Disclose & Report"];
      monthLabels.forEach((lbl, mi) => {
        const mx = G_X + G_LBL + mi * 4 * G_WW;
        sl.addShape(prs.ShapeType.rect, { x: mx, y: G_Y, w: 4 * G_WW, h: 0.26, fill: { color: pBandFill[mi] }, line: { color: pBarLine[mi], width: 0.5 } });
        sl.addText(lbl, { x: mx + 0.05, y: G_Y + 0.04, w: 4 * G_WW - 0.1, h: 0.2, fontSize: 7.5, bold: true, color: pBandText[mi], align: "center", fontFace: "Calibri" });
      });
      // Column header row
      sl.addText("Action  ·  Owner", { x: G_X + 0.05, y: G_Y + 0.28, w: G_LBL - 0.1, h: 0.22, fontSize: 7.5, bold: true, color: MUTED, fontFace: "Calibri" });
      for (let wk = 1; wk <= 12; wk++) {
        sl.addText(`W${wk}`, { x: G_X + G_LBL + (wk - 1) * G_WW, y: G_Y + 0.28, w: G_WW, h: 0.22, fontSize: 7, color: MUTED, align: "center", fontFace: "Courier New" });
      }
      // Divider
      sl.addShape(prs.ShapeType.rect, { x: G_X, y: G_Y + 0.52, w: G_LBL + G_GANTT, h: 0.02, fill: { color: "CBD5E1" }, line: { color: "CBD5E1", width: 0 } });

      // Activity rows
      slide.timeline.forEach((item, idx) => {
        const ry = G_Y + 0.55 + idx * G_ROW;
        const rowBg = idx % 2 === 0 ? "FFFFFF" : "F8FAFC";
        // Row background
        sl.addShape(prs.ShapeType.rect, { x: G_X, y: ry, w: G_LBL + G_GANTT, h: G_ROW - 0.02, fill: { color: rowBg }, line: { color: "E2E8F0", width: 0.25 } });
        // Action label
        sl.addText(item.label, { x: G_X + 0.05, y: ry + 0.03, w: G_LBL - 0.1, h: 0.18, fontSize: 7.5, color: FG, fontFace: "Calibri" });
        sl.addText(item.owner, { x: G_X + 0.05, y: ry + 0.19, w: G_LBL - 0.1, h: 0.14, fontSize: 6.5, color: "94A3B8", fontFace: "Calibri" });
        // Gantt bar
        const barX = G_X + G_LBL + (item.start - 1) * G_WW + 0.02;
        const barW = (item.end - item.start + 1) * G_WW - 0.04;
        const ph = item.phase as 0 | 1 | 2;
        sl.addShape(prs.ShapeType.roundRect, { x: barX, y: ry + 0.055, w: barW, h: G_ROW - 0.13, fill: { color: pBarFill[ph] }, line: { color: pBarLine[ph], width: 0.5 } });
      });
      // Vertical week separator lines
      for (let wk = 1; wk <= 13; wk++) {
        const lx = G_X + G_LBL + (wk - 1) * G_WW;
        const totalH = 0.55 + slide.timeline.length * G_ROW;
        const lineColor = wk === 1 || wk === 5 || wk === 9 || wk === 13 ? "CBD5E1" : "E2E8F0";
        sl.addShape(prs.ShapeType.rect, { x: lx, y: G_Y + 0.52, w: 0.01, h: totalH, fill: { color: lineColor }, line: { color: lineColor, width: 0 } });
      }
      sl.addText(slide.cta, { x: 0.5, y: 6.85, w: 12.3, h: 0.35, fontSize: 8.5, color: VIOLET2, italic: true, fontFace: "Calibri", wrap: true });
    } else if (slide.type === "close") {
      const sl = base(prs, slide.title, slide.presenter, n);
      sl.addText(`"${slide.closing}"`, { x: 0.5, y: 1.55, w: 12.3, h: 0.85, fontSize: 12, color: AMBER, italic: true, fontFace: "Calibri", wrap: true });
      sl.addText("RESOURCES", { x: 0.5, y: 2.55, w: 12.3, h: 0.22, fontSize: 8.5, bold: true, color: MUTED, fontFace: "Calibri", charSpacing: 0.5 });
      slide.resources.forEach((r, ri) => {
        const rx = 0.5 + (ri % 2) * 6.4; const ry = 2.85 + Math.floor(ri / 2) * 0.9;
        sl.addShape(prs.ShapeType.roundRect, { x: rx, y: ry, w: 6.1, h: 0.75, fill: { color: "EFF6FF" }, line: { color: "CBD5E1", width: 0.5 } });
        sl.addText(r.label, { x: rx + 0.1, y: ry + 0.07, w: 5.9, h: 0.25, fontSize: 9.5, bold: true, color: VIOLET2, fontFace: "Calibri" });
        sl.addText(r.note, { x: rx + 0.1, y: ry + 0.36, w: 5.9, h: 0.28, fontSize: 8, color: MUTED, fontFace: "Calibri" });
      });
    }
  });

  // ── Bonus slide: ROI Calculator (static reference slide with example output)
  const roiCalcSl = prs.addSlide();
  roiCalcSl.background = { color: BG };
  roiCalcSl.addText("Interactive ROI Calculator — Example Output", { x: 0.5, y: 0.4, w: 12.3, h: 0.6, fontSize: 22, bold: true, color: FG, fontFace: "Calibri" });
  roiCalcSl.addText("Based on: 8× A100 · 168 hrs/run · 12 runs/yr · Ireland grid · €3/GPU-hr training · 4× A100 inference · €2→€0.50/hr post-distillation", { x: 0.5, y: 1.1, w: 12.3, h: 0.35, fontSize: 9, color: MUTED, italic: true, fontFace: "Calibri", wrap: true });
  const calcRows = [
    ["Metric", "Training", "Inference (current)", "Inference (distilled)", "Annual saving"],
    ["Energy", "847 kWh/run · 10,164/yr", "60.7 kWh/day · 22,145/yr", "Lower (T4 GPU)", "−20,605 kWh/yr"],
    ["Carbon (Scope 2)", "296 kgCO₂e/run · 3,552/yr", "21.2 kgCO₂e/day · 7,750/yr", "−7,212 kgCO₂e/yr", ""],
    ["Annual cost", "€48,384/yr", "€70,080/yr", "€35,485/yr", "€34,595/yr"],
    ["3-yr compute savings", "H100 upgrade: €96K · INT8: €51K", "Distillation: €104K · INT8: €63K", "", "~€315K total"],
  ];
  roiCalcSl.addTable(calcRows.map((row, ri) => row.map(cell => ({
    text: cell,
    options: {
      bold: ri === 0,
      fontSize: ri === 0 ? 9 : 8.5,
      color: ri === 0 ? FG : MUTED,
      fill: { color: ri === 0 ? "E2E8F0" : ri % 2 === 0 ? "F8FAFC" : "FFFFFF" },
      fontFace: "Calibri",
    }
  }))), { x: 0.5, y: 1.55, w: 12.3, h: 3.5, border: { type: "solid", color: "CBD5E1", pt: 0.5 }, rowH: 0.6 });
  roiCalcSl.addText("Add strategic value: green bond financing (€900K/3yr) · ESG rating uplift (€1M+) · penalty avoidance (up to €35M) · carbon credits (€60K/3yr)", { x: 0.5, y: 5.25, w: 12.3, h: 0.4, fontSize: 9, color: EMERALD, fontFace: "Calibri", wrap: true });

  // ── Bonus slide: Email to leadership
  const emailSl = prs.addSlide();
  emailSl.background = { color: BG };
  emailSl.addText("Written Approval Request — AI in Finance Europe", { x: 0.5, y: 0.4, w: 12.3, h: 0.6, fontSize: 22, bold: true, color: FG, fontFace: "Calibri" });
  emailSl.addText("To: Sarah Müller · Head of Programming, AI in Finance Europe  |  sarah.muller@aif-europe.eu", { x: 0.5, y: 1.05, w: 12.3, h: 0.3, fontSize: 9.5, bold: true, color: VIOLET2, fontFace: "Calibri" });
  const emailBody = `Subject: Webinar proposal — Reducing AI's Carbon Footprint for Financial Institutions

Dear Sarah,

I am writing to propose a webinar session for the AI in Finance Practitioners Network on the environmental footprint of AI in financial services, and the regulatory and commercial case for acting now.

The proposed session, "Reducing AI's Carbon Footprint: A Practitioner's Guide," would cover:
• Why EU financial institutions face mandatory AI sustainability disclosure under CSRD, the EU AI Act, and ISSB S2
• How to measure AI carbon footprints using GHG Protocol Scope 2 and the Green Software Foundation SCI formula
• The top 5 quantified actions to reduce AI emissions, with costs and carbon savings for each
• A 3-year ROI model showing compute savings, green bond access, ESG rating uplift, and penalty avoidance
• A 90-day implementation roadmap your members can take back to their teams immediately

The session would be practical, numbers-driven, and designed to give your members concrete next steps, not just awareness. I would welcome the opportunity to discuss further.

With warm regards,
Preeti · Responsible & Sustainable AI Practitioner`;
  emailSl.addText(emailBody, { x: 0.5, y: 1.45, w: 12.3, h: 5.8, fontSize: 8.5, color: MUTED, fontFace: "Calibri", wrap: true, valign: "top" });

  await prs.writeFile({ fileName: "ai-sustainability-webinar-eu-finance.pptx" });
}

// ── Main page ─────────────────────────────────────────────────────────────────

const preview = (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12, opacity: 0.5 }}>
    <span style={{ fontSize: 32 }}>📊</span>
    <span style={{ fontSize: 13, fontFamily: "monospace", color: "hsl(var(--muted-foreground))" }}>AI Sustainability Webinar · Restricted</span>
  </div>
);

export default function AIWebinar() {
  useVisitLogger("ai-sustainability-webinar");
  const [slideshow, setSlideshow] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  async function handleExport() {
    setDownloading(true);
    try { await exportPPTX(); setDownloaded(true); setTimeout(() => setDownloaded(false), 3000); }
    finally { setDownloading(false); }
  }

  return (
    <PageGate pageId="ai-sustainability-webinar" backTo="/#projects" previewContent={preview}>
      <div className="max-w-[900px] mx-auto px-6 py-14">
        {slideshow && <SlideshowMode onClose={() => setSlideshow(false)} />}

        <Link to="/#projects" className="text-xs text-muted-foreground hover:text-foreground transition-colors mb-6 inline-block print:hidden">
          ← Back to Portfolio
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 mb-4">
            {["EU Financial Services", "CSRD 2024", "EU AI Act", "Community Webinar", "Track 2"].map(t => (
              <span key={t} className="text-[10px] font-mono px-2.5 py-1 rounded-full border border-violet-500/30 bg-violet-500/5 text-violet-400">{t}</span>
            ))}
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Reducing AI's Carbon Footprint</h1>
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed mb-1">
            A practitioner's guide for the AI in Finance Practitioners Network (EU) — 17-slide community webinar with ROI calculator and written email.
          </p>
          <p className="text-xs text-muted-foreground/60">
            Presenter: <span className="text-foreground/70 font-medium">Preeti · Responsible & Sustainable AI Practitioner</span>
            {" · "}Contact: <span className="text-foreground/70">Sarah Müller, Head of Programming, AI in Finance Europe</span>
          </p>
        </div>

        {/* Stat strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { value: "17", label: "Slides" },
            { value: "3", label: "Regulatory frameworks" },
            { value: "€35M", label: "Max penalty mapped" },
            { value: "90-day", label: "Action plan included" },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4 text-center">
              <div className="text-xl font-bold text-foreground">{s.value}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 mb-8 flex-wrap print:hidden">
          <button onClick={() => setSlideshow(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-violet-600 text-white hover:bg-violet-500 transition-colors">
            <span>▶</span> Present
          </button>
          <button onClick={handleExport} disabled={downloading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border transition-colors ${downloaded ? "border-emerald-500/40 text-emerald-400" : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40"} disabled:opacity-50`}>
            <span>⬇</span>
            {downloading ? "Generating…" : downloaded ? "Saved ✓" : "Export .pptx"}
          </button>
          <a href="#roi-calc" className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-violet-400 transition-colors border border-border/50 hover:border-violet-500/40 rounded-lg px-3 py-1.5">
            ▼ ROI Calculator
          </a>
          <a href="#email-draft" className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-violet-400 transition-colors border border-border/50 hover:border-violet-500/40 rounded-lg px-3 py-1.5">
            ▼ Email Draft
          </a>
        </div>

        {/* Slides */}
        <div className="space-y-4 mb-12">
          {SLIDES.map((slide, i) => (
            <SlideCard key={slide.id} slide={slide} index={i} />
          ))}
        </div>

        {/* ROI Calculator */}
        <div id="roi-calc">
          <h2 className="text-sm font-bold text-foreground mb-1">Interactive ROI Calculator</h2>
          <p className="text-xs text-muted-foreground mb-0">Enter your organisation's AI workload details for a personalised 3-year savings estimate.</p>
          <ROICalculator />
        </div>

        {/* Email draft */}
        <div id="email-draft" className="mt-10">
          <h2 className="text-sm font-bold text-foreground mb-1">Written Email — Approval Request</h2>
          <p className="text-xs text-muted-foreground mb-0">Addressed to Sarah Müller, Head of Programming, AI in Finance Europe.</p>
          <EmailDraft />
        </div>

        {/* Go to top */}
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
        >↑</button>
      </div>
    </PageGate>
  );
}
