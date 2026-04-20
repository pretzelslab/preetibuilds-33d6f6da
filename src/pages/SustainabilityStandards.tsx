import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useVisitLogger } from "@/hooks/useVisitLogger";
import { DiagonalWatermark } from "@/components/ui/DiagonalWatermark";
import { PageGate } from "@/components/ui/PageGate";

// ── Types ──────────────────────────────────────────────────────────────────────
type FrameworkStatus = "In Force" | "Upcoming" | "Voluntary" | "Proposed";

interface Standard {
  id: string;
  acronym: string;
  fullName: string;
  emoji: string;
  jurisdiction: string;
  jurisdictionFull: string;
  scope: string;
  aiRelevance: string;
  keyObligation: string;
  status: FrameworkStatus;
  enforcementDate: string;
  nextDeadline?: string;
  nextDeadlineNote?: string;
  industries: string[];
  type: "Regulation" | "Standard" | "Framework" | "Guideline";
  aiSpecific: boolean;
  keyArticles?: { ref: string; text: string }[];
  source: string;
  penalty?: string;
}

interface Tool {
  name: string;
  org: string;
  what: string;
  type: "SDK" | "Calculator" | "API" | "Benchmark" | "Template";
  link: string;
  tags: string[];
}

interface Player {
  org: string;
  type: "BigTech" | "Startup" | "OpenSource" | "NonProfit" | "Enterprise";
  what: string;
  why: string;
  tags: string[];
  jobProfiles: string[];
}

// ── Data — Frameworks (Session 1: 5 of 10) ────────────────────────────────────
const STANDARDS: Standard[] = [
  {
    id: "csrd-esrs-e1",
    acronym: "CSRD / ESRS E1",
    fullName: "Corporate Sustainability Reporting Directive / European Sustainability Reporting Standard E1 — Climate",
    emoji: "🇪🇺",
    jurisdiction: "EU",
    jurisdictionFull: "European Union — applies to companies with EU market presence above size thresholds",
    scope: "Large EU companies (>500 employees, or >€40M turnover, or >€20M balance sheet) and listed SMEs from 2026.",
    aiRelevance: "AI training and inference workloads = Scope 2 electricity consumption and must be reported. GPU manufacturing = Scope 3 upstream emissions. Cloud AI spend maps to Scope 3 Category 1 (purchased goods) or Category 11 (use of sold products). Double materiality requires assessing both financial impact of climate on the company AND the company's impact on climate — AI energy use feeds both directions.",
    keyObligation: "Report Scope 1, 2, and 3 GHG emissions under double materiality. Disclose climate-related transition and physical risks. Publish decarbonisation targets aligned to Paris Agreement. ESRS E1-5 covers energy consumption — AI workloads are explicitly in scope.",
    status: "In Force",
    enforcementDate: "2024-01-01",
    nextDeadline: "2026-01-01",
    nextDeadlineNote: "Listed SMEs reporting from Jan 2026. Large non-PIEs from Jan 2025.",
    industries: ["All"],
    type: "Regulation",
    aiSpecific: false,
    keyArticles: [
      { ref: "ESRS E1-4", text: "Physical climate risks — data centre location, cooling water stress, flood exposure." },
      { ref: "ESRS E1-5", text: "Energy consumption and mix — AI compute is a significant energy category." },
      { ref: "ESRS E1-6", text: "Gross Scope 1, 2, and 3 GHG emissions — AI workloads are Scope 2 (electricity) and Scope 3 (upstream hardware, downstream inference)." },
      { ref: "Double Materiality", text: "Both financial materiality (climate risk to company) AND impact materiality (company's emissions impact) must be assessed. AI-intensive companies face both." },
    ],
    source: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022L2464",
    penalty: "Statutory audit required. Failure to report = non-compliance with EU corporate law. Member state penalties vary — fines and reputational enforcement.",
  },
  {
    id: "eu-gpai",
    acronym: "EU AI Act — GPAI Art. 51–53",
    fullName: "European Union Artificial Intelligence Act — General Purpose AI Articles 51 to 53 (Systemic Risk / Energy Disclosure)",
    emoji: "🇪🇺",
    jurisdiction: "EU",
    jurisdictionFull: "European Union — applies globally to providers placing GPAI models on the EU market",
    scope: "Providers of General Purpose AI models trained above 10²⁵ FLOPs (systemic risk threshold). Smaller GPAI models have lighter obligations under Art. 53.",
    aiRelevance: "The first regulation anywhere in the world to mandate AI training energy disclosure. Art. 53 requires GPAI providers to publish training compute (FLOPs) and energy use in technical documentation. Art. 51 creates the systemic risk classification that triggers the highest obligations.",
    keyObligation: "Disclose training energy consumption and compute (FLOPs) in technical documentation. Register in EU AI database. Conduct adversarial testing (red-teaming). Report serious incidents to the AI Office. Implement cybersecurity measures proportionate to systemic risk.",
    status: "In Force",
    enforcementDate: "2025-08-01",
    industries: ["Tech", "AI"],
    type: "Regulation",
    aiSpecific: true,
    keyArticles: [
      { ref: "Article 51", text: "Systemic risk classification: GPAI models trained above 10²⁵ FLOPs presumed to carry systemic risk." },
      { ref: "Article 52", text: "Transparency obligations for GPAI models — disclosure requirements for providers." },
      { ref: "Article 53", text: "Obligations for GPAI providers with systemic risk: adversarial testing, incident reporting, cybersecurity, energy disclosure." },
      { ref: "Article 55", text: "Cooperation with AI Office — share technical documentation on request, including training methodology and compute." },
    ],
    source: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=OJ:L_202401689",
    penalty: "Fines up to €35M or 7% global annual turnover for systemic risk violations. Fines up to €15M or 3% for other obligations.",
  },
  {
    id: "issb-s2",
    acronym: "ISSB S2",
    fullName: "International Sustainability Standards Board — IFRS S2 Climate-related Disclosures",
    emoji: "🌍",
    jurisdiction: "Global",
    jurisdictionFull: "Global — adopted as mandatory in UK, Australia, Singapore, Japan, Canada; voluntary IFRS baseline for all others",
    scope: "Companies reporting under IFRS in jurisdictions that have adopted S2. Particularly relevant for financial sector and large listed companies globally.",
    aiRelevance: "AI data centres are a material Scope 2 electricity risk for tech and financial companies. AI-driven financial models introduce climate transition risk exposure. Scenario analysis must account for AI infrastructure energy demand under different climate pathways (1.5°C, 2°C, 3°C+).",
    keyObligation: "Disclose climate-related risks and opportunities across four pillars: Governance (board oversight of climate risk) · Strategy (climate scenarios, transition plans) · Risk Management (identification and mitigation) · Metrics & Targets (Scope 1/2/3 emissions, targets). Cross-industry metrics include Scope 2 electricity which captures AI compute.",
    status: "In Force",
    enforcementDate: "2024-01-01",
    nextDeadline: "2025-01-01",
    nextDeadlineNote: "Several jurisdictions mandating from Jan 2025 onwards — Australia, Singapore phasing in.",
    industries: ["Finance", "All listed companies"],
    type: "Standard",
    aiSpecific: false,
    keyArticles: [
      { ref: "IFRS S2 para. 13", text: "Climate-related financial risk disclosure — AI infrastructure energy consumption is a material transition risk for tech companies." },
      { ref: "Appendix B — Industry guidance", text: "Sector-specific metrics. Technology sector: data centre energy use, PUE (Power Usage Effectiveness), water consumption." },
      { ref: "Cross-industry metric 6", text: "Gross Scope 1, 2, and 3 GHG emissions — same methodology as GHG Protocol, aligns with CSRD." },
      { ref: "Climate scenario analysis", text: "Physical risk (floods, heat stress on data centres) and transition risk (carbon pricing affecting compute costs) must both be modelled." },
    ],
    source: "https://www.ifrs.org/issued-standards/ifrs-sustainability-standards-navigator/ifrs-s2-climate-related-disclosures/",
    penalty: "Non-financial: loss of investor confidence, proxy voting opposition. In mandatory jurisdictions: regulatory enforcement by securities regulators (FCA, ASIC, MAS etc).",
  },
  {
    id: "gri-305",
    acronym: "GRI 305",
    fullName: "Global Reporting Initiative Universal Standard 305 — Emissions",
    emoji: "🌐",
    jurisdiction: "Global",
    jurisdictionFull: "Global — voluntary standard, widely required by investors, lenders, and supply chain partners as a reporting condition",
    scope: "Any organisation choosing to report against GRI Standards. Widely used as the reference methodology for CSRD and ISSB S2 Scope 3 calculations.",
    aiRelevance: "GRI 305-1/2/3 covers Scope 1, 2, and 3 emissions using the GHG Protocol methodology — the same framework used by Carbon Depth's calculation engine. AI compute appears as Scope 2 (purchased electricity for training and inference). For cloud AI: Scope 3 Category 1 (purchased goods/services from cloud providers). GRI 305 is referenced by both CSRD ESRS E1 and ISSB S2 as an acceptable methodology.",
    keyObligation: "Disclose: Scope 1 direct emissions (gCO₂e) · Scope 2 market-based and location-based emissions · Scope 3 upstream and downstream emissions (15 categories) · Emission reduction initiatives · Targets and progress. Methodology must be disclosed (GHG Protocol Corporate Standard recommended).",
    status: "Voluntary",
    enforcementDate: "2016-10-01",
    industries: ["All"],
    type: "Standard",
    aiSpecific: false,
    keyArticles: [
      { ref: "GRI 305-1", text: "Scope 1 direct GHG emissions — not typically relevant for cloud AI (no on-site combustion) but relevant for on-premise data centres." },
      { ref: "GRI 305-2", text: "Scope 2 energy indirect emissions — AI training and inference electricity consumption goes here. Market-based (RECs/PPAs) and location-based (grid average) methods both required." },
      { ref: "GRI 305-3", text: "Scope 3 other indirect emissions — AI hardware manufacturing (upstream), cloud provider emissions (Category 1), and end-user inference (downstream, Category 11)." },
      { ref: "GRI 305-4", text: "GHG emissions intensity — kgCO₂e per unit of output. For AI: kgCO₂e per 1,000 API calls or per parameter. Enables benchmarking." },
    ],
    source: "https://www.globalreporting.org/standards/media/1012/gri-305-emissions-2016.pdf",
  },
  {
    id: "tcfd",
    acronym: "TCFD",
    fullName: "Task Force on Climate-related Financial Disclosures",
    emoji: "🌐",
    jurisdiction: "Global",
    jurisdictionFull: "Global — mandatory in UK (2022), New Zealand (2023), Switzerland (2024); basis for ISSB S2 globally; widely adopted voluntarily",
    scope: "Financial sector companies and large corporates in jurisdictions that have mandated TCFD. The framework was absorbed into ISSB S2 (2023) — new reporters are encouraged to adopt ISSB S2 directly.",
    aiRelevance: "Data centre physical risk (heat stress, flooding, water scarcity) affects AI infrastructure reliability and cost. Carbon pricing as a transition risk increases compute costs for energy-intensive AI training. TCFD scenario analysis is the precursor to ISSB S2 scenarios — companies with existing TCFD disclosures have a head start on ISSB S2.",
    keyObligation: "Four pillars: Governance (board and management oversight of climate risk) · Strategy (climate risks and opportunities across short/medium/long term; scenario analysis) · Risk Management (identification, assessment, and management of climate risks) · Metrics & Targets (Scope 1/2/3 emissions; climate-related targets).",
    status: "In Force",
    enforcementDate: "2022-01-01",
    nextDeadline: "2025-01-01",
    nextDeadlineNote: "ISSB S2 is now the successor framework. Jurisdictions not yet on ISSB S2 continue using TCFD.",
    industries: ["Finance", "All large corporates"],
    type: "Framework",
    aiSpecific: false,
    keyArticles: [
      { ref: "Governance pillar", text: "Board must oversee climate risk management — includes energy and carbon risk from AI infrastructure for tech companies." },
      { ref: "Strategy pillar — Scenario analysis", text: "Physical risk scenarios (data centre flooding, heat stress) and transition risk scenarios (carbon pricing, energy cost increases) must be modelled." },
      { ref: "Metrics pillar", text: "Scope 1, 2, and 3 emissions using GHG Protocol — same methodology as GRI 305, CSRD, and ISSB S2. Enables cross-standard comparison." },
      { ref: "ISSB S2 relationship", text: "TCFD is the conceptual precursor to ISSB S2. Companies with TCFD disclosures have ~80% of the work done for ISSB S2 compliance." },
    ],
    source: "https://www.fsb-tcfd.org/recommendations/",
    penalty: "UK: FCA enforcement for listed companies. NZ: Financial Markets Authority. Other jurisdictions: reputational and investor pressure.",
  },

  // ── Session 2 — 6 additional frameworks ──────────────────────────────────────
  {
    id: "ghg-protocol",
    acronym: "GHG Protocol",
    fullName: "Greenhouse Gas Protocol Corporate Accounting and Reporting Standard",
    emoji: "🌐",
    jurisdiction: "Global",
    jurisdictionFull: "Global — voluntary methodology standard adopted by every major climate disclosure framework: CSRD ESRS E1, ISSB S2, GRI 305, TCFD, and the SEC Climate Rule all require GHG Protocol methodology",
    scope: "Any organisation measuring and reporting GHG emissions. Not a regulation — the universal accounting methodology that all disclosure frameworks reference. Scope 1/2/3 categories, GHG Protocol Scope 2 Guidance (2015), and Scope 3 Standard (2011) are the definitive calculation standards.",
    aiRelevance: "GHG Protocol defines the Scope 1/2/3 categories that all AI carbon accounting uses. Scope 2 (purchased electricity) = AI training and inference energy. Scope 3 Category 1 = GPU hardware manufacturing. Category 11 = downstream inference by customers. Carbon Depth's calculation engine implements GHG Protocol Scope 2. The market-based vs location-based Scope 2 distinction (renewable energy certificates vs grid average) is a GHG Protocol concept directly relevant to AI cloud decisions.",
    keyObligation: "Voluntary — no legal penalty. However: CSRD, ISSB S2, GRI 305, and virtually every national framework mandate GHG Protocol as the accepted methodology. Companies must set organisational boundary (equity share vs operational control), choose Scope 2 method (location-based or market-based), and account for all 15 Scope 3 categories where material.",
    status: "Voluntary",
    enforcementDate: "2004-03-01",
    industries: ["All"],
    type: "Standard",
    aiSpecific: false,
    keyArticles: [
      { ref: "Scope 1", text: "Direct emissions from owned/controlled sources — on-premise data centre generators, refrigerant leaks from cooling. Near-zero for cloud AI workloads." },
      { ref: "Scope 2", text: "Indirect emissions from purchased electricity — AI training and inference compute. Market-based (RECs/PPAs count) vs location-based (grid average) methods both required by CSRD and GRI 305." },
      { ref: "Scope 3 Cat. 1", text: "Purchased goods and services — GPU hardware manufacturing carbon, amortised over hardware lifetime. Typically 10–20% of total AI carbon lifecycle." },
      { ref: "Scope 3 Cat. 11", text: "Use of sold products — downstream inference carbon from customers using an AI model or API. Frontier model providers must account for this." },
    ],
    source: "https://ghgprotocol.org/corporate-standard",
  },
  {
    id: "sec-climate",
    acronym: "SEC Climate Rule",
    fullName: "U.S. Securities and Exchange Commission — Climate-Related Disclosures Rule (Regulation S-K and S-X amendments)",
    emoji: "🇺🇸",
    jurisdiction: "US",
    jurisdictionFull: "United States — applies to all SEC-registered public companies (domestic issuers and foreign private issuers filing with the SEC)",
    scope: "All SEC registrants. Large accelerated filers: Scope 1 and 2 disclosure from FY2026. Accelerated filers from FY2027. Scope 3 requirement was removed in the March 2024 amendment after industry pressure. Rule subject to ongoing legal challenges but remains in effect pending court resolution.",
    aiRelevance: "All major US AI companies (Microsoft, Google, Amazon, Meta, Salesforce) are SEC registrants. Data centre electricity = material Scope 2 for tech companies. Even without mandatory Scope 3, investors are pressing for GPU supply chain and downstream inference disclosure. Companies facing CSRD from EU operations will disclose Scope 3 anyway — the US rule creates a floor, not a ceiling.",
    keyObligation: "Disclose material climate-related risks in annual filings (10-K). Report Scope 1 and 2 GHG emissions (phased by filer size). Disclose climate governance (board oversight, risk management integration). Report climate-related targets and transition plans where material. Financial impact of severe weather events must be quantified above a materiality threshold.",
    status: "Upcoming",
    enforcementDate: "2026-01-01",
    nextDeadline: "2026-01-01",
    nextDeadlineNote: "Large accelerated filers begin FY2026 disclosure. Legal challenges may delay enforcement.",
    industries: ["All public companies", "Finance", "Tech"],
    type: "Regulation",
    aiSpecific: false,
    keyArticles: [
      { ref: "Regulation S-K Item 1500–1507", text: "Climate risk disclosure requirements: material climate risks, governance, strategy, risk management, and metrics & targets." },
      { ref: "Scope 1 & 2 emissions", text: "Required for large accelerated filers from FY2026. GHG Protocol Corporate Standard methodology mandated." },
      { ref: "Scope 3 — removed", text: "Originally proposed; removed in March 2024 final rule after industry pushback. Companies still face investor and CSRD pressure to disclose voluntarily." },
      { ref: "Financial statement footnotes", text: "Severe weather financial impacts above $1M materiality threshold must be disclosed in financial statements — creates audit trail for climate costs." },
    ],
    source: "https://www.sec.gov/rules/final/2024/33-11275.pdf",
    penalty: "SEC enforcement for material misstatements in climate disclosures. Potential shareholder litigation. Reputational risk from inconsistency with CSRD disclosures for dual-listed companies.",
  },
  {
    id: "uk-tcfd",
    acronym: "UK TCFD Mandate",
    fullName: "UK Mandatory Climate-related Financial Disclosures (TCFD-aligned)",
    emoji: "🇬🇧",
    jurisdiction: "UK",
    jurisdictionFull: "United Kingdom — applies to UK-listed companies (premium and standard), large UK-registered private companies (>500 employees, >£500M turnover), LLPs, banks, and FCA-regulated insurers",
    scope: "Premium and standard listed companies on UK stock exchanges (mandatory from April 2022). Large private companies and LLPs above size thresholds from April 2022. UK banks and insurers regulated by PRA/FCA. Aligned to TCFD; expected to migrate to UK-adopted ISSB S2 equivalent.",
    aiRelevance: "UK financial sector is one of the heaviest enterprise AI buyers globally — LLMs for trading, compliance, fraud detection, and risk assessment. Data centre Scope 2 electricity is material for UK tech and financial companies. UK AI companies that are listed or large private firms have faced mandatory TCFD since 2022 — ahead of EU CSRD timeline.",
    keyObligation: "Disclose climate risks across four TCFD pillars in annual reports: Governance (board oversight), Strategy (climate scenarios, physical and transition risks, 2°C and below-2°C scenarios), Risk Management (identification and mitigation), Metrics & Targets (Scope 1/2/3 emissions, targets). FCA-regulated firms must comply via listing rules.",
    status: "In Force",
    enforcementDate: "2022-04-06",
    industries: ["Finance", "All listed companies", "Large private companies"],
    type: "Regulation",
    aiSpecific: false,
    keyArticles: [
      { ref: "FCA Listing Rules — LR 9.8 / DTR 7", text: "Premium and standard listed companies must include TCFD-aligned disclosures in annual report. Non-compliance = non-compliance with listing rules." },
      { ref: "Companies Act 2006 (amended)", text: "Large UK-registered companies and LLPs must disclose climate-related financial information — extends TCFD beyond listed companies." },
      { ref: "Scenario analysis", text: "At least two climate scenarios required — one consistent with limiting warming to 1.5°C or 2°C. Physical risk (flooding, heat stress for data centres) and transition risk (carbon pricing) must both be modelled." },
      { ref: "ISSB S2 transition", text: "UK expected to endorse IFRS S2 as the successor framework — companies with TCFD disclosures will have ~80% of the work done." },
    ],
    source: "https://www.fca.org.uk/publications/policy-statements/ps21-23-enhancing-climate-related-disclosures",
    penalty: "FCA enforcement for listed companies (listing suspension, public censure). FRC (Financial Reporting Council) oversight for large private companies. Reputational enforcement via investor voting.",
  },
  {
    id: "sgx-climate",
    acronym: "SGX Climate Reporting",
    fullName: "Singapore Exchange — Mandatory Climate Reporting (ISSB S2 / TCFD-aligned)",
    emoji: "🇸🇬",
    jurisdiction: "Singapore",
    jurisdictionFull: "Singapore — applies to all SGX Mainboard listed companies; phased by market capitalisation from FY2023. MAS (Monetary Authority of Singapore) applying parallel climate disclosure requirements to financial institutions.",
    scope: "Large-cap SGX Mainboard issuers: mandatory from FY2023. Mid-cap: FY2024. All Mainboard issuers including small-cap: FY2025. Catalist (SME board): voluntary for now. Closely aligned to ISSB S2 — Singapore is the most advanced ASEAN market on climate disclosure.",
    aiRelevance: "Singapore is positioning as the ASEAN AI hub. AWS, Google, and Microsoft all have major Singapore data centres (Singapore grid: ~400 gCO₂/kWh, among the highest in developed Asia). AI compute disclosure is material for tech companies listed on SGX. MAS Taxonomy also classifies AI-for-climate tools as 'green' activities eligible for green finance.",
    keyObligation: "TCFD-aligned climate disclosures in annual reports. Scope 1 and 2 GHG emissions (Scope 3 encouraged but not mandated in first phase). Board governance of climate risk. Scenario analysis for physical and transition risks. External assurance of Scope 1/2 from FY2025 for large-cap issuers.",
    status: "In Force",
    enforcementDate: "2023-01-01",
    nextDeadline: "2025-01-01",
    nextDeadlineNote: "All Mainboard issuers (including small-cap) mandatory from FY2025. External assurance required for large-cap.",
    industries: ["All listed", "Finance", "Tech"],
    type: "Standard",
    aiSpecific: false,
    keyArticles: [
      { ref: "SGX Listing Rules — Rule 711A/B", text: "Climate reporting mandatory for all Mainboard issuers. TCFD framework adopted as the reporting template." },
      { ref: "Scope 1 & 2 mandatory", text: "GHG emissions using GHG Protocol methodology. Location-based and market-based Scope 2 both required from FY2024 for large-cap." },
      { ref: "MAS parallel requirements", text: "Monetary Authority of Singapore applies climate disclosure requirements to banks, insurers, and asset managers — covering AI-for-finance use cases separately from SGX listing rules." },
      { ref: "ISSB S2 alignment", text: "Singapore confirmed ISSB S2 adoption as the successor framework. SGX disclosures will transition to full ISSB S2 alignment from FY2025 onwards." },
    ],
    source: "https://www.sgx.com/sustainable-finance/sustainability-reporting",
    penalty: "SGX regulatory action for non-compliance with listing rules. MAS enforcement for regulated financial institutions.",
  },
  {
    id: "australia-asrs",
    acronym: "ASRS / AASB S2",
    fullName: "Australian Sustainability Reporting Standards — AASB S2 Climate-related Disclosures",
    emoji: "🇦🇺",
    jurisdiction: "Australia",
    jurisdictionFull: "Australia — applies to large Australian entities above size thresholds; phased from FY2025 (Group 1) through FY2027 (Group 3). Administered by ASIC (Australian Securities and Investments Commission).",
    scope: "Group 1 (large entities: >$500M revenue or >$1B assets or >500 employees): mandatory from FY2025. Group 2 (mid-size: >$200M revenue or >$500M assets): FY2026. Group 3 (others above reporting threshold): FY2027. Closely mirrors ISSB S2 — among the most rigorous climate disclosure regimes globally.",
    aiRelevance: "Australia's electricity grid is among the most carbon-intensive in developed markets (~500–700 gCO₂/kWh in coal-heavy states; cleaner in SA and TAS). AI companies operating Australian compute face high Scope 2 carbon numbers. The ASRS includes Scope 3 requirements — cloud AI spend (AWS Sydney, Google Sydney) appears in Scope 3 Category 1 for companies using hyperscaler AI services.",
    keyObligation: "Climate-related risk governance, strategy, and risk management disclosures in annual financial reports. Scope 1, 2, and 3 GHG emissions using GHG Protocol Corporate Standard. Climate scenario analysis (including 1.5°C pathway). Transition plan disclosures where material. ASIC has stated it will prioritise enforcement of greenwashing over technical non-compliance in initial years.",
    status: "In Force",
    enforcementDate: "2025-01-01",
    nextDeadline: "2026-01-01",
    nextDeadlineNote: "Group 2 entities mandatory from FY2026. Group 3 from FY2027.",
    industries: ["All large entities", "Finance", "Mining", "Tech"],
    type: "Standard",
    aiSpecific: false,
    keyArticles: [
      { ref: "AASB S2 — Climate risks and opportunities", text: "Mirrors IFRS S2 structure: Governance, Strategy, Risk Management, Metrics & Targets. Scope 1/2/3 all required." },
      { ref: "Corporations Act 2001 (amended)", text: "ASRS requirements embedded in Corporations Act via ASIC — makes non-compliance a breach of corporations law, not just a reporting standard." },
      { ref: "Greenwashing enforcement", text: "ASIC has already commenced greenwashing proceedings against several Australian companies — climate disclosure accuracy is actively policed." },
      { ref: "Scope 3 requirement", text: "All 15 Scope 3 categories required where material — stricter than SEC Climate Rule (which dropped Scope 3). AI cloud spend, hardware procurement, and downstream product use all potentially material." },
    ],
    source: "https://www.aasb.gov.au/news/aasb-sustainability-reporting-standards/",
    penalty: "ASIC enforcement under Corporations Act. Civil penalties for material misstatements. Director liability. Greenwashing enforcement is active — ASIC has commenced proceedings against multiple Australian entities.",
  },
  {
    id: "japan-ssbj",
    acronym: "SSBJ S2",
    fullName: "Sustainability Standards Board of Japan — Climate-related Disclosures Standard (IFRS S2 aligned)",
    emoji: "🇯🇵",
    jurisdiction: "Japan",
    jurisdictionFull: "Japan — voluntary adoption from FY2025 for listed companies; FSA (Financial Services Agency) expected to mandate for all Prime Market listed companies from FY2027",
    scope: "Tokyo Stock Exchange Prime Market listed companies encouraged to adopt from FY2025. FSA mandating from FY2027 for large listed companies. Standard closely mirrors IFRS S2 — Japan is the second-largest economy to adopt ISSB-aligned climate standards after the UK and Australia.",
    aiRelevance: "Japan is a major AI market — Sony, Fujitsu, NTT Data, NEC, and SoftBank are all active AI deployers. Major US hyperscaler data centres operate in Japan (Tokyo and Osaka). Post-Fukushima, Japan's grid is ~440–500 gCO₂/kWh — AI compute Scope 2 disclosure is materially significant for tech companies reporting under SSBJ.",
    keyObligation: "Climate governance and strategy disclosures. Scope 1, 2, and 3 GHG emissions using GHG Protocol. Climate scenario analysis. Cross-industry metrics aligned to IFRS S2 (including data centre energy use for tech sector). Voluntary from FY2025; mandatory from FY2027 under FSA roadmap.",
    status: "Upcoming",
    enforcementDate: "2025-04-01",
    nextDeadline: "2027-04-01",
    nextDeadlineNote: "FSA mandatory enforcement expected from FY2027 for Prime Market listed companies.",
    industries: ["All listed", "Finance", "Manufacturing", "Tech"],
    type: "Standard",
    aiSpecific: false,
    keyArticles: [
      { ref: "SSBJ Exposure Draft S2", text: "Closely mirrors IFRS S2 structure and requirements. Scope 1/2/3 emissions under GHG Protocol. Four-pillar TCFD structure retained." },
      { ref: "FSA roadmap", text: "Japan's Financial Services Agency roadmap: voluntary FY2025 → phased mandatory FY2027. Aligns with G7 commitment to ISSB S2 adoption." },
      { ref: "Scope 3 inclusion", text: "Scope 3 required under SSBJ S2 — stricter than SEC Climate Rule. AI hardware supply chain (Samsung, TSMC, ASML) appears as Scope 3 upstream for Japanese tech companies." },
      { ref: "Cross-industry metrics", text: "Technology sector metrics include data centre PUE, energy consumption, and water use — directly applicable to AI infrastructure disclosure." },
    ],
    source: "https://www.ssbj.jp/en/",
    penalty: "Currently voluntary — no penalty for FY2025. From FY2027: FSA enforcement under Financial Instruments and Exchange Act. Director liability for material misstatements in securities filings.",
  },
];

// ── Data — Tools Directory ─────────────────────────────────────────────────────
const TOOLS: Tool[] = [
  {
    name: "CodeCarbon",
    org: "Hugging Face / MLOps Community",
    what: "Python SDK that measures actual energy consumption and carbon emissions during ML model training. Wraps around your training loop and logs kWh and kgCO₂e in real time.",
    type: "SDK",
    link: "https://codecarbon.io",
    tags: ["Python", "Training", "Real-time measurement"],
  },
  {
    name: "ML CO₂ Impact",
    org: "Lacoste et al. / Mila",
    what: "Simple web calculator — enter hardware type, training hours, and cloud region to get a carbon estimate. No code required. Good for quick estimates before running an experiment.",
    type: "Calculator",
    link: "https://mlco2.github.io/impact",
    tags: ["Web", "No-code", "Quick estimate"],
  },
  {
    name: "Green Algorithms",
    org: "Lannelongue et al. / Cambridge",
    what: "Web calculator covering a broader range of scientific computing workloads — not just ML. Accounts for CPU, GPU, memory, runtime, and location. Produced AIEnergyScore benchmark.",
    type: "Calculator",
    link: "https://www.green-algorithms.org",
    tags: ["Web", "HPC", "Scientific computing"],
  },
  {
    name: "Electricity Maps",
    org: "Tomorrow.io",
    what: "Real-time and historical carbon intensity data by grid region — gCO₂/kWh. Powers the live grid intensity feature in Carbon Depth. Free tier: 250 calls/month.",
    type: "API",
    link: "https://electricitymaps.com",
    tags: ["API", "Real-time", "Grid intensity"],
  },
  {
    name: "MLPerf Power",
    org: "MLCommons",
    what: "Industry benchmark suite that measures energy efficiency of ML inference workloads on specific hardware. Produces tokens/watt ratios used to compare GPUs. The source for Carbon Depth's hardware efficiency recommendations.",
    type: "Benchmark",
    link: "https://mlcommons.org/benchmarks/inference",
    tags: ["Benchmark", "Inference", "Hardware comparison"],
  },
  {
    name: "Carbontracker",
    org: "DTU (Technical University of Denmark)",
    what: "Python tool that tracks and predicts energy and carbon footprint of deep learning training. Generates per-epoch carbon estimates and a final report. More granular than CodeCarbon for research workloads.",
    type: "SDK",
    link: "https://github.com/lfwa/carbontracker",
    tags: ["Python", "Training", "Research"],
  },
  {
    name: "BLOOM Carbon Report",
    org: "Luccioni et al. / BigScience",
    what: "The most rigorous published carbon accounting for a large language model. Covers full lifecycle: hardware manufacturing, training, deployment, and inference. The template for model card carbon disclosure.",
    type: "Template",
    link: "https://arxiv.org/abs/2211.02001",
    tags: ["Template", "Research", "Model cards"],
  },
];

// ── Data — Who's Moving ────────────────────────────────────────────────────────
const PLAYERS: Player[] = [
  // ── Big Tech ────────────────────────────────────────────────────────────────
  {
    org: "Google DeepMind",
    type: "BigTech",
    what: "TPU efficiency R&D, AlphaFold energy optimisation, net-zero data centres pledge by 2030, hourly carbon-free energy matching.",
    why: "Google's data centres run on ~90% carbon-free energy (hourly matched). TPU v4 is ~2× more energy-efficient per FLOP than equivalent GPU. Published carbon accounting methodology for Gemini training.",
    tags: ["Hardware efficiency", "Renewable energy", "Carbon accounting"],
    jobProfiles: ["Data Centre Energy Lead", "Technical Program Manager — Infrastructure Efficiency", "Research Scientist (Sustainable AI)", "ML Systems Engineer (TPU/Energy)"],
  },
  {
    org: "Microsoft",
    type: "BigTech",
    what: "Carbon negative pledge by 2030, Azure Sustainability Dashboard, AI for Earth programme, partnership with LLNL on fusion energy for data centres.",
    why: "Azure Carbon Dashboard gives enterprise customers Scope 2 and 3 emissions from cloud AI workloads — directly useful for CSRD and ISSB S2 reporting.",
    tags: ["Cloud tools", "Carbon negative", "Enterprise disclosure"],
    jobProfiles: ["Sustainability Program Manager (AI)", "Azure Carbon Engineer", "AI Governance Lead", "Responsible AI Research Engineer", "Climate Tech Strategy Lead"],
  },
  {
    org: "Meta AI",
    type: "BigTech",
    what: "LLaMA quantisation efficiency research, data centre renewable energy commitments, open publication of training compute for LLaMA series.",
    why: "LLaMA 2 training card includes total GPU-hours and estimated carbon — sets a benchmark for what frontier model carbon disclosure should look like.",
    tags: ["Efficiency", "Renewable energy", "Open research"],
    jobProfiles: ["ML Infrastructure Engineer (Green AI)", "Research Scientist (Efficiency)", "Responsible AI Program Manager", "Sustainability Reporting Analyst"],
  },
  // ── Frontier AI Labs ────────────────────────────────────────────────────────
  {
    org: "Anthropic",
    type: "Startup",
    what: "Responsible Scaling Policy (RSP) with compute thresholds, Constitutional AI for alignment, model cards with training compute disclosure, internal carbon tracking for Claude model series.",
    why: "Anthropic's RSP is one of the only public commitments by a frontier lab to pause scaling if safety thresholds are crossed — directly tied to compute (and therefore energy) limits. Sets the standard for what responsible GPAI governance looks like under EU AI Act Art. 53.",
    tags: ["Responsible Scaling", "Safety + Sustainability", "GPAI compliance"],
    jobProfiles: ["Policy & Safety Research Scientist", "Technical Program Manager (Responsible Scaling)", "AI Governance Analyst", "Carbon & Compute Reporting Lead"],
  },
  {
    org: "Cohere",
    type: "Startup",
    what: "Command R series optimised for enterprise efficiency, retrieval-augmented generation (RAG) as an energy-efficient alternative to full model calls, on-premise deployment options for data-residency compliance.",
    why: "Cohere positions efficiency as a selling point to enterprise customers under CSRD/ISSB S2 pressure — 'smaller models, same results' is both a carbon and cost argument. One of few AI companies actively selling to sustainability-conscious procurement teams.",
    tags: ["Enterprise AI", "Efficiency-first", "RAG"],
    jobProfiles: ["Enterprise Sustainability Solutions Architect", "AI Compliance Program Manager", "ML Infrastructure Engineer (Efficient Inference)", "Responsible AI Lead"],
  },
  {
    org: "Mistral AI",
    type: "Startup",
    what: "Efficiency-first open-weight models (Mistral 7B, Mixtral MoE), minimal training compute relative to capability, European HQ aligned to EU AI Act from inception.",
    why: "Mistral 7B outperforms models 5× its size on benchmarks — the efficiency gap means lower energy per task. As a French company, Mistral faces CSRD obligations and is building compliance-aware model releases from the start.",
    tags: ["Efficiency", "Open weights", "EU-native"],
    jobProfiles: ["ML Research Engineer (Efficiency)", "EU AI Act Compliance Lead", "Open Source Community Manager", "Energy Efficiency Researcher"],
  },
  // ── Infrastructure & Tooling ─────────────────────────────────────────────────
  {
    org: "Together AI",
    type: "Startup",
    what: "Green cloud inference platform, open-source model hosting with published energy per token metrics, FlashAttention integration for inference efficiency.",
    why: "Together AI publishes energy-per-token benchmarks across hosted models — one of the only inference providers giving customers the data they need for CSRD Scope 3 Category 1 reporting from cloud AI spend.",
    tags: ["Green cloud", "Inference efficiency", "Open metrics"],
    jobProfiles: ["Infrastructure Efficiency Engineer", "Sustainability Data Engineer", "ML Systems Researcher (Energy)", "Developer Relations (Responsible AI)"],
  },
  {
    org: "Databricks / MosaicML",
    type: "Enterprise",
    what: "MPT open models with full training compute disclosure, LLM training efficiency research, enterprise MLOps platform with cost and carbon optimisation tooling.",
    why: "MosaicML's training infrastructure includes real-time energy monitoring. Post-acquisition, Databricks integrates carbon tracking into enterprise ML pipelines — directly relevant for companies needing to disclose Scope 2 AI compute emissions under CSRD.",
    tags: ["Enterprise MLOps", "Training efficiency", "Carbon monitoring"],
    jobProfiles: ["ML Platform Engineer (Sustainability)", "Responsible AI Program Manager", "Data & AI Governance Lead", "Carbon Footprint Analyst (ML)"],
  },
  {
    org: "IBM",
    type: "Enterprise",
    what: "watsonx.governance for AI risk and compliance, Environmental Intelligence Suite for Scope 1/2/3 emissions reporting, sustainability consulting for CSRD/ISSB S2 readiness.",
    why: "IBM is the only major AI vendor with an end-to-end governance product that connects AI compliance (fairness, bias) with sustainability disclosure — directly aligned to AIGP governance requirements and CSRD double materiality.",
    tags: ["Governance platform", "CSRD tooling", "Enterprise compliance"],
    jobProfiles: ["AI Governance Consultant", "Sustainability Program Manager (CSRD)", "watsonx Implementation Lead", "ESG Data Analyst (AI)", "Responsible AI Solutions Architect"],
  },
  // ── Open Source & Research ───────────────────────────────────────────────────
  {
    org: "Hugging Face",
    type: "OpenSource",
    what: "Model cards with mandatory energy disclosure fields, CodeCarbon integration into training pipelines, open carbon data on model hub.",
    why: "First major AI platform to require carbon estimates on model cards. The BLOOM carbon report (2022) was published by Hugging Face researchers and became the industry template.",
    tags: ["Model cards", "Open data", "Community standards"],
    jobProfiles: ["ML Research Engineer (Efficiency & Carbon)", "Developer Advocate (Responsible AI)", "Open Source Community Lead", "Policy Researcher (AI Transparency)"],
  },
  {
    org: "Allen AI (AI2)",
    type: "OpenSource",
    what: "Open models with carbon reporting, OLMo series published with full training energy disclosure.",
    why: "Every OLMo model release includes training carbon data — making it the leading example of voluntary transparency in open-weight models.",
    tags: ["Open models", "Transparency", "Research"],
    jobProfiles: ["Research Scientist (Sustainable NLP)", "ML Engineer (Training Efficiency)", "AI Policy Researcher", "Open Science Program Manager"],
  },
  {
    org: "EleutherAI",
    type: "OpenSource",
    what: "Open research, carbon-transparent model releases, Pythia training suite with full compute documentation.",
    why: "Pythia suite is the most systematically documented training series in open AI — every checkpoint has associated compute and carbon estimates. Used as a reference in BLOOM methodology.",
    tags: ["Open source", "Carbon transparency", "Research"],
    jobProfiles: ["Open Source ML Researcher", "Compute & Carbon Analyst", "AI Safety + Sustainability Researcher"],
  },
  // ── Non-Profit & Policy ──────────────────────────────────────────────────────
  {
    org: "Climate Change AI (CCAI)",
    type: "NonProfit",
    what: "Non-profit funding AI-for-climate research, publishing policy briefs, running grants programme, convening industry and government.",
    why: "Published the definitive taxonomy of AI's role in climate — both as a tool for mitigation and as an emitter. Key reference for sustainability capstone research applications.",
    tags: ["Policy", "Research", "Non-profit"],
    jobProfiles: ["AI Climate Research Scientist", "Policy & Advocacy Lead", "Grants Programme Manager", "AI + Climate Communications Specialist"],
  },
];

// ── Helper components ──────────────────────────────────────────────────────────

// Acronym with hover tooltip showing full name — dashed underline signals "hover for definition"
function AcronymTip({ short, full }: { short: string; full: string }) {
  return (
    <span className="relative group/tip inline-block">
      <span className="border-b border-dashed border-foreground/50 cursor-help font-semibold">{short}</span>
      <span className="absolute bottom-full left-0 mb-2 w-72 bg-popover text-popover-foreground text-[11px] leading-relaxed px-3 py-2 rounded-lg shadow-lg border border-border/60 opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150 z-50 pointer-events-none">
        <span className="font-semibold text-foreground/80 block mb-0.5">Full name</span>
        {full}
      </span>
    </span>
  );
}

// Jurisdiction badge with tooltip
function JurisdictionTip({ short, full }: { short: string; full: string }) {
  return (
    <span className="relative group/jur inline-flex items-center gap-1">
      <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-border/40 bg-muted/30 text-muted-foreground cursor-help hover:border-border/70 transition-colors">{short}</span>
      <span className="absolute bottom-full left-0 mb-2 w-72 bg-popover text-popover-foreground text-[11px] leading-relaxed px-3 py-2 rounded-lg shadow-lg border border-border/60 opacity-0 group-hover/jur:opacity-100 transition-opacity duration-150 z-50 pointer-events-none">
        {full}
      </span>
    </span>
  );
}

const STATUS_CFG: Record<FrameworkStatus, { label: string; classes: string; dot: string }> = {
  "In Force":  { label: "In Force",  classes: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20", dot: "bg-emerald-500" },
  "Upcoming":  { label: "Upcoming",  classes: "bg-amber-500/10  text-amber-600  dark:text-amber-400  border-amber-500/20",  dot: "bg-amber-500"  },
  "Voluntary": { label: "Voluntary", classes: "bg-blue-500/10   text-blue-600   dark:text-blue-400   border-blue-500/20",   dot: "bg-blue-400"   },
  "Proposed":  { label: "Proposed",  classes: "bg-muted text-muted-foreground border-border",                                dot: "bg-muted-foreground" },
};

const TYPE_CFG: Record<string, string> = {
  "Regulation": "text-rose-400 border-rose-500/20 bg-rose-500/5",
  "Standard":   "text-violet-400 border-violet-500/20 bg-violet-500/5",
  "Framework":  "text-blue-400 border-blue-500/20 bg-blue-500/5",
  "Guideline":  "text-muted-foreground border-border/40 bg-muted/10",
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

// ── Detail panel (right side of master-detail) ────────────────────────────────
function DetailPanel({ s, onClose }: { s: Standard | null; onClose?: () => void }) {
  if (!s) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-dashed border-border/40 bg-muted/5 min-h-[400px]">
        <div className="text-center space-y-2 px-8">
          <div className="text-4xl opacity-15">📋</div>
          <p className="text-xs text-muted-foreground/50">Click any row to view framework details</p>
          <p className="text-[10px] text-muted-foreground/30">Click outside to dismiss</p>
        </div>
      </div>
    );
  }

  const sc = STATUS_CFG[s.status];
  const tc = TYPE_CFG[s.type] ?? TYPE_CFG["Guideline"];

  return (
    <div className="rounded-xl border border-border/50 bg-background shadow-lg overflow-auto max-h-[calc(100vh-160px)]">
      {/* Header */}
      <div className="p-5 border-b border-border/30 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <span className="text-2xl shrink-0 mt-0.5">{s.emoji}</span>
            <div className="min-w-0">
              <div className="font-bold text-base text-foreground leading-snug">{s.acronym}</div>
              <p className="text-[11px] text-muted-foreground/70 leading-relaxed mt-1">{s.fullName}</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-muted-foreground/40 hover:text-foreground transition-colors shrink-0 text-lg leading-none mt-0.5"
              aria-label="Close"
            >
              ×
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className={`inline-flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded-full border ${sc.classes}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
            {sc.label}
          </span>
          <JurisdictionTip short={s.jurisdiction} full={s.jurisdictionFull} />
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${tc}`}>{s.type}</span>
          {s.aiSpecific && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20">AI-specific</span>
          )}
          <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-border/30 text-muted-foreground/60">
            Since {fmtDate(s.enforcementDate)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{s.scope}</p>
      </div>

      {/* Body */}
      <div className="p-5 space-y-5">
        {/* AI Relevance */}
        <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-4 space-y-2">
          <div className="text-[10px] font-semibold text-violet-400 uppercase tracking-wider">Why this matters for AI workloads</div>
          <p className="text-xs text-muted-foreground leading-relaxed">{s.aiRelevance}</p>
        </div>

        {/* Key obligation */}
        <div className="space-y-2">
          <div className="text-[10px] font-semibold text-foreground/60 uppercase tracking-wider">Key obligation</div>
          <p className="text-xs text-muted-foreground leading-relaxed">{s.keyObligation}</p>
        </div>

        {/* Key articles */}
        {s.keyArticles && s.keyArticles.length > 0 && (
          <div className="space-y-2">
            <div className="text-[10px] font-semibold text-foreground/60 uppercase tracking-wider">Specific clauses</div>
            <div className="divide-y divide-border/20 rounded-lg border border-border/30 overflow-hidden">
              {s.keyArticles.map(a => (
                <div key={a.ref} className="flex gap-4 px-4 py-3 bg-muted/5 hover:bg-muted/10 transition-colors">
                  <span className="font-mono text-[11px] text-foreground/70 shrink-0 min-w-[120px] pt-px">{a.ref}</span>
                  <span className="text-xs text-muted-foreground leading-relaxed">{a.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="space-y-2 pt-1 border-t border-border/20">
          {s.nextDeadline && (
            <div className="text-xs text-muted-foreground/60">
              Next deadline: <span className="text-amber-500 font-mono">{fmtDate(s.nextDeadline)}</span>
              {s.nextDeadlineNote && <span className="ml-1 text-[10px]">— {s.nextDeadlineNote}</span>}
            </div>
          )}
          {s.penalty && (
            <p className="text-[11px] text-muted-foreground/60">⚠ {s.penalty}</p>
          )}
          <a
            href={s.source}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-[11px] font-medium text-primary hover:underline"
          >
            Official source →
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Tool card ──────────────────────────────────────────────────────────────────
function ToolCard({ t }: { t: Tool }) {
  const TYPE_COLOR: Record<string, string> = {
    SDK:        "text-violet-400 border-violet-500/20 bg-violet-500/5",
    Calculator: "text-blue-400 border-blue-500/20 bg-blue-500/5",
    API:        "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
    Benchmark:  "text-amber-400 border-amber-500/20 bg-amber-500/5",
    Template:   "text-rose-400 border-rose-500/20 bg-rose-500/5",
  };
  return (
    <div className="border border-border/40 rounded-xl p-5 bg-background space-y-3 flex flex-col">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-semibold text-sm text-foreground">{t.name}</div>
          <div className="text-[11px] text-muted-foreground/70">{t.org}</div>
        </div>
        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border shrink-0 ${TYPE_COLOR[t.type] ?? ""}`}>{t.type}</span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed flex-1">{t.what}</p>
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1">
          {t.tags.map(tag => (
            <span key={tag} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted/30 text-muted-foreground/60 border border-border/30">{tag}</span>
          ))}
        </div>
        <a href={t.link} target="_blank" rel="noopener noreferrer"
          className="text-[11px] font-medium text-primary hover:underline shrink-0">
          Visit →
        </a>
      </div>
    </div>
  );
}

// ── Player card ────────────────────────────────────────────────────────────────
const PLAYER_TYPE_CFG: Record<Player["type"], { label: string; classes: string }> = {
  BigTech:    { label: "Big Tech",    classes: "text-blue-400 border-blue-500/20 bg-blue-500/5" },
  Startup:    { label: "Frontier Lab / Startup", classes: "text-violet-400 border-violet-500/20 bg-violet-500/5" },
  OpenSource: { label: "Open Source", classes: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" },
  NonProfit:  { label: "Non-Profit",  classes: "text-amber-400 border-amber-500/20 bg-amber-500/5" },
  Enterprise: { label: "Enterprise",  classes: "text-rose-400 border-rose-500/20 bg-rose-500/5" },
};

function PlayerCard({ p }: { p: Player }) {
  const tc = PLAYER_TYPE_CFG[p.type];
  return (
    <div className="border border-border/40 rounded-xl p-5 bg-background space-y-3 flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="font-semibold text-sm text-foreground">{p.org}</div>
        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border shrink-0 ${tc.classes}`}>{tc.label}</span>
      </div>

      {/* What they're doing */}
      <p className="text-xs text-muted-foreground leading-relaxed">{p.what}</p>

      {/* Why it matters */}
      <div className="rounded-lg bg-muted/10 border border-border/30 p-3">
        <div className="text-[10px] font-semibold text-foreground/50 uppercase tracking-wider mb-1">Why it matters</div>
        <p className="text-xs text-muted-foreground leading-relaxed">{p.why}</p>
      </div>

      {/* Job profiles */}
      <div className="space-y-1.5">
        <div className="text-[10px] font-semibold text-foreground/50 uppercase tracking-wider">Roles they hire for</div>
        <div className="flex flex-col gap-1">
          {p.jobProfiles.map(role => (
            <div key={role} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
              <span className="text-primary/60 shrink-0 mt-px">›</span>
              {role}
            </div>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1 pt-1">
        {p.tags.map(tag => (
          <span key={tag} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted/30 text-muted-foreground/60 border border-border/30">{tag}</span>
        ))}
      </div>
    </div>
  );
}

// ── Standards tab — master-detail grid ────────────────────────────────────────
function StandardsTab() {
  const [filterJurisdiction, setFilterJurisdiction] = useState("All");
  const [filterType,         setFilterType]         = useState("All");
  const [filterStatus,       setFilterStatus]       = useState("All");
  const [filterIndustry,     setFilterIndustry]     = useState("All");
  const [selected,           setSelected]           = useState<Standard | null>(null);
  const detailPanelRef = useRef<HTMLDivElement>(null);

  // Scroll detail panel to top whenever selection changes
  useEffect(() => {
    if (selected && detailPanelRef.current) {
      detailPanelRef.current.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [selected]);

  const jurisdictions = ["All", ...Array.from(new Set(STANDARDS.map(s => s.jurisdiction)))];
  const types         = ["All", ...Array.from(new Set(STANDARDS.map(s => s.type)))];
  const statuses      = ["All", ...Array.from(new Set(STANDARDS.map(s => s.status)))];
  const industries    = ["All", ...Array.from(new Set(STANDARDS.flatMap(s => s.industries)))];

  const filtered = STANDARDS.filter(s =>
    (filterJurisdiction === "All" || s.jurisdiction === filterJurisdiction) &&
    (filterType         === "All" || s.type         === filterType)         &&
    (filterStatus       === "All" || s.status       === filterStatus)       &&
    (filterIndustry     === "All" || s.industries.includes(filterIndustry))
  );

  const selClass = "text-xs px-3 py-1.5 rounded-lg border border-border/40 bg-background text-foreground focus:outline-none focus:border-primary/50 cursor-pointer";

  return (
    <div className="space-y-4">
      {/* Stats strip */}
      <div className="flex flex-wrap gap-3">
        {[
          { value: STANDARDS.length.toString(),                                                  label: "Frameworks" },
          { value: STANDARDS.filter(s => s.status === "In Force").length.toString(),             label: "In Force" },
          { value: STANDARDS.filter(s => s.aiSpecific).length.toString(),                        label: "AI-specific" },
          { value: Array.from(new Set(STANDARDS.map(s => s.jurisdiction))).length.toString(),    label: "Jurisdictions" },
        ].map(m => (
          <div key={m.label} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border/30 bg-muted/10">
            <span className="text-base font-bold text-primary">{m.value}</span>
            <span className="text-[11px] text-muted-foreground">{m.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-amber-500/20 bg-amber-500/5 ml-auto">
          <span className="text-[10px] text-amber-500/80">Hover acronyms · hover jurisdiction · click row for details</span>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mr-1">Filter</span>
        <select value={filterJurisdiction} onChange={e => { setFilterJurisdiction(e.target.value); setSelected(null); }} className={selClass}>
          {jurisdictions.map(j => <option key={j}>{j === "All" ? "All jurisdictions" : j}</option>)}
        </select>
        <select value={filterType} onChange={e => { setFilterType(e.target.value); setSelected(null); }} className={selClass}>
          {types.map(t => <option key={t}>{t === "All" ? "All types" : t}</option>)}
        </select>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setSelected(null); }} className={selClass}>
          {statuses.map(s => <option key={s}>{s === "All" ? "All statuses" : s}</option>)}
        </select>
        <select value={filterIndustry} onChange={e => { setFilterIndustry(e.target.value); setSelected(null); }} className={selClass}>
          {industries.map(i => <option key={i}>{i === "All" ? "All industries" : i}</option>)}
        </select>
        {(filterJurisdiction !== "All" || filterType !== "All" || filterStatus !== "All" || filterIndustry !== "All") && (
          <button
            onClick={() => { setFilterJurisdiction("All"); setFilterType("All"); setFilterStatus("All"); setFilterIndustry("All"); setSelected(null); }}
            className="text-xs text-muted-foreground/60 hover:text-foreground transition-colors px-2"
          >
            ✕ Clear
          </button>
        )}
        <span className="text-[11px] text-muted-foreground/50 ml-auto">{filtered.length} of {STANDARDS.length} frameworks</span>
      </div>

      {/* Master-detail layout */}
      <div className="flex gap-4 items-start">

        {/* LEFT — table grid */}
        <div
          className="flex-1 min-w-0 rounded-xl border border-border/40 overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground/50">No frameworks match these filters.</div>
          ) : (
            <table className="w-full table-fixed">
              <colgroup>
                <col className="w-[220px]" />
                <col className="w-[130px]" />
                <col className="w-[110px]" />
                <col className="hidden lg:table-column" />
                <col className="w-[100px]" />
              </colgroup>
              <thead>
                <tr className="border-b border-border/40 bg-muted/20">
                  <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-foreground/60 uppercase tracking-wider">Framework</th>
                  <th className="text-left px-3 py-2.5 text-[10px] font-semibold text-foreground/60 uppercase tracking-wider">Status</th>
                  <th className="text-left px-3 py-2.5 text-[10px] font-semibold text-foreground/60 uppercase tracking-wider">Jurisdiction</th>
                  <th className="text-left px-3 py-2.5 text-[10px] font-semibold text-foreground/60 uppercase tracking-wider hidden lg:table-cell">Industry</th>
                  <th className="text-left px-3 py-2.5 text-[10px] font-semibold text-foreground/60 uppercase tracking-wider">Type</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => {
                  const sc = STATUS_CFG[s.status];
                  const tc = TYPE_CFG[s.type] ?? TYPE_CFG["Guideline"];
                  const isSelected = selected?.id === s.id;
                  return (
                    <tr
                      key={s.id}
                      onClick={e => { e.stopPropagation(); setSelected(isSelected ? null : s); }}
                      className={`border-b border-border/20 last:border-0 cursor-pointer transition-colors text-xs
                        ${isSelected
                          ? "bg-primary/8 border-l-2 border-l-primary"
                          : "hover:bg-muted/20 border-l-2 border-l-transparent"
                        }`}
                    >
                      {/* Name */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="shrink-0">{s.emoji}</span>
                          <AcronymTip short={s.acronym} full={s.fullName} />
                          {s.aiSpecific && (
                            <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20 hidden xl:inline shrink-0">AI</span>
                          )}
                        </div>
                      </td>
                      {/* Status */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full border ${sc.classes}`}>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${sc.dot}`} />
                          {sc.label}
                        </span>
                        <div className="text-[10px] text-muted-foreground/50 font-mono mt-0.5">{fmtDate(s.enforcementDate)}</div>
                      </td>
                      {/* Jurisdiction */}
                      <td className="px-3 py-3">
                        <JurisdictionTip short={s.jurisdiction} full={s.jurisdictionFull} />
                      </td>
                      {/* Industry */}
                      <td className="px-3 py-3 hidden lg:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {s.industries.slice(0, 2).map(ind => (
                            <span key={ind} className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-border/30 text-muted-foreground/60 bg-muted/10 whitespace-nowrap">{ind}</span>
                          ))}
                          {s.industries.length > 2 && (
                            <span className="text-[10px] text-muted-foreground/40">+{s.industries.length - 2}</span>
                          )}
                        </div>
                      </td>
                      {/* Type */}
                      <td className="px-3 py-3">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${tc}`}>{s.type}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* RIGHT — detail panel */}
        <div
          ref={detailPanelRef}
          className="w-[460px] xl:w-[540px] shrink-0 sticky top-6 self-start max-h-[calc(100vh-6rem)] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          <DetailPanel s={selected} onClose={() => setSelected(null)} />
        </div>
      </div>
    </div>
  );
}

// ── Preview (shown behind PageGate) ───────────────────────────────────────────
function SustainabilityPreview() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto px-6 py-12 space-y-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono px-2.5 py-1 rounded-full border border-emerald-500/30 text-emerald-400 bg-emerald-500/10 uppercase tracking-wider">Sustainable AI · Disclosure · Regulation</span>
            <span className="text-[10px] font-mono px-2.5 py-1 rounded-full border border-border/30 text-muted-foreground bg-muted/10 uppercase tracking-wider">Preview</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Sustainability Standards Tracker</h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
            10 sustainability disclosure frameworks in one place — with AI-specific context, clause-level detail, and jurisdiction coverage. Built for ESG analysts, AI engineers, and governance teams navigating CSRD, ISSB S2, EU GPAI, and more.
          </p>
        </div>
        {/* Stat strip */}
        <div className="flex flex-wrap gap-3">
          {["11 Frameworks", "In Force · Upcoming · Voluntary", "EU · US · UK · APAC · Global", "7 Tools Directory"].map(s => (
            <div key={s} className="px-3 py-2 rounded-lg border border-border/30 bg-muted/10 text-xs text-muted-foreground">{s}</div>
          ))}
        </div>
        {/* Blurred framework cards */}
        <div className="space-y-3 blur-sm pointer-events-none select-none opacity-70">
          {STANDARDS.slice(0, 2).map(s => (
            <div key={s.id} className="border border-border/40 rounded-xl p-5 bg-background">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xl">{s.emoji}</span>
                <span className="font-semibold text-sm">{s.acronym}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-600 border-emerald-500/20">{s.status}</span>
              </div>
              <div className="h-3 bg-muted-foreground/20 rounded w-4/5 mb-2" />
              <div className="h-3 bg-muted-foreground/20 rounded w-3/5" />
            </div>
          ))}
          <div className="border border-border/40 rounded-xl p-5 bg-background h-20" />
        </div>
        <DiagonalWatermark />
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function SustainabilityStandards() {
  useVisitLogger("/sustainability-standards");
  const location = useLocation();
  const referrer = (location.state as { from?: string; fromLabel?: string } | null);
  const [activeTab, setActiveTab] = useState<"standards" | "tools" | "players">("standards");

  const tabs = [
    { id: "standards" as const, label: "📋 Standards Tracker",       sub: "11 disclosure frameworks" },
    { id: "tools"     as const, label: "🛠 Tools Directory",          sub: "7 measurement tools"       },
    { id: "players"   as const, label: "🏢 Who's Moving",             sub: "13 organisations"          },
  ];

  return (
    <PageGate pageId="sustainability-standards" backTo="/#projects" previewContent={<SustainabilityPreview />}>
      <div className="min-h-screen bg-background text-foreground relative">
        <DiagonalWatermark />

        {/* Nav */}
        <nav className="sticky top-10 z-40 border-b bg-background/95 backdrop-blur border-border/40">
          <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center gap-4">
            <Link to="/#projects" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              ← Back to Portfolio
            </Link>
            {referrer?.from && (
              <Link to={referrer.from} className="text-xs text-violet-400 hover:text-violet-300 transition-colors border-l border-border pl-4">
                ← Back to {referrer.fromLabel ?? "Framework"}
              </Link>
            )}
          </div>
        </nav>

        {/* Clicking anywhere outside the table/panel dismisses the selection */}
        <div className="max-w-[1400px] mx-auto px-6 py-10 space-y-8" onClick={() => setSelected(null)}>

          {/* Header */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full border border-emerald-500/30 text-emerald-400 bg-emerald-500/10 uppercase tracking-wider">
                Sustainable AI · Disclosure · Regulation
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Sustainability Standards Tracker</h1>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-3xl">
              10 sustainability disclosure frameworks in one place — with AI-specific context, clause-level detail, and jurisdiction coverage.
              Built for ESG analysts, AI engineers, and governance teams navigating <AcronymTip short="CSRD" full="Corporate Sustainability Reporting Directive" />, <AcronymTip short="ISSB S2" full="International Sustainability Standards Board — IFRS S2 Climate-related Disclosures" />, <AcronymTip short="EU GPAI" full="EU General Purpose Artificial Intelligence Act" />, <AcronymTip short="GRI 305" full="Global Reporting Initiative Standard 305 — Emissions" />, <AcronymTip short="TCFD" full="Task Force on Climate-related Financial Disclosures" />, and more.
            </p>
          </div>

          {/* Tabs */}
          <div className="border-b border-border/40">
            <div className="flex gap-0">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-5 py-3 text-left border-b-2 transition-all duration-150 ${
                    activeTab === tab.id
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className="text-sm font-medium">{tab.label}</div>
                  <div className="text-[10px] text-muted-foreground/60">{tab.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div className={activeTab !== "standards" ? "hidden" : ""}><StandardsTab /></div>

          <div className={activeTab !== "tools" ? "hidden" : ""}>
            <div className="space-y-5">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Tools practitioners use to measure, benchmark, and report AI energy and carbon footprint.
                Each tool covers a different part of the workflow — from real-time SDK measurement to web calculators to industry benchmarks.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {TOOLS.map(t => <ToolCard key={t.name} t={t} />)}
              </div>
            </div>
          </div>

          <div className={activeTab !== "players" ? "hidden" : ""}>
            <div className="space-y-5">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Organisations actively investing in sustainable AI — through efficiency research, carbon transparency, renewable energy commitments, or open tooling.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PLAYERS.map(p => <PlayerCard key={p.org} p={p} />)}
              </div>
            </div>
          </div>

        </div>
      </div>
    </PageGate>
  );
}
