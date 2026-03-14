import { useState, useMemo } from "react";

// ─── FOUR PILLARS ─────────────────────────────────────────────────────────────
const PILLARS = [
  {
    id: "governance",
    label: "Governance",
    emoji: "🏛",
    color: { bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8", badge: "#dbeafe", dot: "#3b82f6" },
    definition: "The structures, roles, processes, and accountability mechanisms that organisations put in place to oversee AI systems throughout their lifecycle — from design through decommissioning.",
    whyItMatters: "Without governance, no one is accountable when AI causes harm. Governance converts ethical intent into operational practice.",
    keyPrinciples: [
      "Clear ownership: a named AI risk owner at executive level",
      "Board-level AI policy reviewed and approved annually",
      "AI inventory — every system catalogued with risk classification",
      "Oversight committees with diverse representation",
      "Audit trails for all consequential AI decisions",
      "Escalation paths from operational teams to leadership",
    ],
    workToBeDone: [
      "Establish AI governance committee with cross-functional membership",
      "Draft and approve an organisational AI policy",
      "Build and maintain an AI system register",
      "Define roles: AI Product Owner, AI Risk Officer, Ethics Reviewer",
      "Run quarterly AI governance reviews at management level",
    ],
    relatedUpdates: "EU AI Act requires designated responsible persons for high-risk AI by August 2026. ISO 42001 certifiable governance frameworks now available from accredited bodies. NIST AI RMF Govern function updated with sector-specific profiles (2024).",
    interdependencies: [
      { pillar: "Ethics", how: "Ethics policies are defined within governance frameworks and enforced through governance accountability structures." },
      { pillar: "Privacy", how: "Data governance — a subset of AI governance — determines how personal data used in AI is controlled and protected." },
      { pillar: "Risk & Compliance", how: "Governance structures own the risk management programme and are accountable for regulatory compliance." },
    ],
  },
  {
    id: "ethics",
    label: "Ethics",
    emoji: "⚖",
    color: { bg: "#fdf4ff", border: "#e9d5ff", text: "#7e22ce", badge: "#f3e8ff", dot: "#a855f7" },
    definition: "The principles and practices that ensure AI systems treat people fairly, operate transparently, and respect human dignity — including freedom from bias, discrimination, and manipulation.",
    whyItMatters: "AI systems trained on historical data inherit historical prejudices. Without active ethics practices, AI amplifies discrimination at scale.",
    keyPrinciples: [
      "Fairness: equal treatment and equal outcomes across demographic groups",
      "Non-discrimination: no adverse decisions based on protected characteristics",
      "Transparency: explainable decisions that affected individuals can understand",
      "Human dignity: AI must not manipulate, deceive, or demean",
      "Accountability: humans remain responsible for AI decisions",
      "Inclusivity: diverse teams building AI surfaces blind spots early",
    ],
    workToBeDone: [
      "Conduct bias audits for all high-risk AI systems before deployment",
      "Implement fairness metrics (demographic parity, equalised odds, calibration)",
      "Disaggregate all model performance reports by gender, ethnicity, age",
      "Establish ethics review board with authority to halt deployments",
      "Build feedback channels for affected individuals to report harm",
      "Train all AI teams on fairness, bias, and ethical design",
    ],
    relatedUpdates: "EU AI Act Article 10 mandates bias examination in training data for high-risk systems. NIST AI RMF MEASURE function updated with fairness metric guidance (2024). AAIA Certified AI Auditor exam now includes intersectional bias testing methodology.",
    interdependencies: [
      { pillar: "Governance", how: "Ethics standards are set and enforced through governance structures. Without governance accountability, ethics principles remain aspirational." },
      { pillar: "Privacy", how: "Using sensitive demographic data (gender, race) to detect bias creates tension with privacy minimisation — requires careful balancing." },
      { pillar: "Risk & Compliance", how: "Ethical failures (bias, discrimination) directly create regulatory risk under EU AI Act, GDPR, and equality law." },
    ],
  },
  {
    id: "privacy",
    label: "Privacy",
    emoji: "🔒",
    color: { bg: "#f0fdf4", border: "#bbf7d0", text: "#15803d", badge: "#dcfce7", dot: "#22c55e" },
    definition: "The rights of individuals to control how their personal data is collected, used, and processed by AI systems — including training data, inference inputs, and AI-generated outputs about individuals.",
    whyItMatters: "AI systems consume vast amounts of personal data. Inadequate privacy controls in AI create GDPR exposure, erode trust, and enable surveillance at scale.",
    keyPrinciples: [
      "Data minimisation: use only the personal data strictly necessary",
      "Purpose limitation: data collected for one purpose not reused for AI without consent",
      "Individual rights: right to explanation, correction, and deletion of AI decisions",
      "Consent: clear lawful basis for processing personal data in AI training",
      "Privacy by design: privacy controls built into AI architecture from the start",
      "Training data governance: audit and document all personal data in training sets",
    ],
    workToBeDone: [
      "Conduct Data Protection Impact Assessments (DPIAs) for all AI systems using personal data",
      "Audit training datasets for personal data and establish retention and deletion schedules",
      "Build explainability mechanisms that satisfy individual right-to-explanation requests",
      "Map data flows from collection through training, inference, and output storage",
      "Establish process for handling AI-related Subject Access Requests",
      "Implement differential privacy or anonymisation for sensitive training data",
    ],
    relatedUpdates: "EU AI Act aligns with GDPR on training data governance (Article 10). NIST CSF 2.0 includes AI training data classified as sensitive assets requiring encryption. ICO (UK) published AI and data protection guidance 2024 with specific DPIA templates for AI systems.",
    interdependencies: [
      { pillar: "Ethics", how: "Collecting gender/demographic data for bias detection conflicts with data minimisation — organisations must justify collection under both ethics and privacy law." },
      { pillar: "Governance", how: "Data governance policies (retention, access, consent) are set and enforced through the AI governance framework." },
      { pillar: "Risk & Compliance", how: "Privacy breaches in AI systems trigger GDPR fines (up to 4% global turnover) — privacy failures are a primary AI risk category." },
    ],
  },
  {
    id: "risk",
    label: "Risk & Compliance",
    emoji: "📋",
    color: { bg: "#fff7ed", border: "#fed7aa", text: "#c2410c", badge: "#ffedd5", dot: "#f97316" },
    definition: "The systematic identification, measurement, treatment, and monitoring of AI-related risks — and the ongoing work of demonstrating compliance with applicable regulations, standards, and frameworks.",
    whyItMatters: "AI creates new risk categories (model failure, adversarial attack, bias at scale) that traditional risk frameworks were not designed to address. Regulatory penalties are now material.",
    keyPrinciples: [
      "Risk quantification: measure AI risks in financial terms, not just ordinal ratings",
      "Regulatory horizon scanning: track new AI laws and standards as they emerge",
      "Continuous monitoring: AI risk is dynamic and changes as models and data drift",
      "Incident response: defined playbooks for AI failures, bias events, and breaches",
      "Third-party risk: AI vendors and model providers assessed as supply chain risk",
      "Audit readiness: maintain evidence of compliance at all times, not just at audit time",
    ],
    workToBeDone: [
      "Build an AI risk register covering all in-scope AI systems",
      "Implement FAIR-AI quantitative risk model for material AI systems",
      "Map all in-scope AI to applicable regulations (EU AI Act, GDPR, sector-specific)",
      "Establish AI compliance calendar aligned to EU AI Act phase-in dates",
      "Conduct annual third-party AI vendor risk assessments",
      "Maintain audit evidence repository with version-controlled documentation",
    ],
    relatedUpdates: "EU AI Act fines up to €35M / 7% global turnover active from August 2025. NIST AI RMF Playbook updated with financial services and healthcare risk profiles (2024). FAIR-AI taxonomy published October 2023 with ML-specific risk scenarios. ISO 42001 certification now available — first certifications issued Q1 2024.",
    interdependencies: [
      { pillar: "Governance", how: "Risk management is owned and resourced through the governance framework. Risk appetite is set at board level within governance structures." },
      { pillar: "Ethics", how: "Ethical failures (bias, discrimination) generate regulatory and reputational risk — ethics and risk are measured together in the EU AI Act risk classification." },
      { pillar: "Privacy", how: "Privacy breaches are a core AI risk category. GDPR fines and ICO enforcement actions are quantified as risk events in the AI risk register." },
    ],
  },
];

// ─── PILLAR TAGGING PER POLICY ───────────────────────────────────────────────
// For each policy: which pillars it addresses, strength (Primary/Secondary), and key impact
const POLICY_PILLAR_MAP = {
  "eu-ai-act": [
    { pillar: "governance", strength: "Primary", impact: "Mandatory governance structures for high-risk AI: responsible persons, conformity assessments, EU AI database registration, human oversight requirements." },
    { pillar: "ethics", strength: "Primary", impact: "Prohibits discriminatory AI uses. Mandates bias examination in training data. Requires fundamental rights impact assessments. Bans manipulation of vulnerable groups." },
    { pillar: "privacy", strength: "Primary", impact: "Training data governance (Article 10) aligns with GDPR. Restricts biometric data use. Prohibits real-time biometric surveillance in public spaces." },
    { pillar: "risk", strength: "Primary", impact: "Risk-based classification (Unacceptable/High/Limited/Minimal). Fines up to €35M / 7% turnover. Phased compliance deadlines 2025–2027." },
  ],
  "nist-ai-rmf": [
    { pillar: "governance", strength: "Primary", impact: "GOVERN function establishes organisational policies, accountability, culture, and oversight structures for AI risk management." },
    { pillar: "ethics", strength: "Primary", impact: "MEASURE function includes fairness metrics and bias measurement. MAP function requires identifying vulnerable populations and ethical risks." },
    { pillar: "privacy", strength: "Secondary", impact: "Privacy included as a trustworthiness characteristic. MANAGE function addresses privacy risk treatment." },
    { pillar: "risk", strength: "Primary", impact: "Core purpose of the framework. MAP, MEASURE, MANAGE functions provide end-to-end risk management process. Incident response playbooks required." },
  ],
  "nist-csf": [
    { pillar: "governance", strength: "Primary", impact: "New GOVERN function (v2.0) establishes cybersecurity — and by extension AI security — governance at organisational level." },
    { pillar: "ethics", strength: "Secondary", impact: "Anomaly detection controls include monitoring for adversarial inputs designed to trigger discriminatory outputs." },
    { pillar: "privacy", strength: "Primary", impact: "DATA SECURITY controls explicitly cover AI training datasets. Gender and sensitive demographic data classified as requiring enhanced controls." },
    { pillar: "risk", strength: "Primary", impact: "IDENTIFY and GOVERN functions drive AI supply chain risk management. Recovery planning includes AI model rollback and fairness re-evaluation." },
  ],
  "iso-42001": [
    { pillar: "governance", strength: "Primary", impact: "Certifiable AI Management System standard. Clause 5 (Leadership) and Clause 4 (Context) establish board-level AI governance requirements. Analogous to ISO 27001." },
    { pillar: "ethics", strength: "Primary", impact: "Clause 8 (Operations) mandates impact assessment covering bias, fairness, and societal harm before deployment. Continual improvement cycle for ethics outcomes." },
    { pillar: "privacy", strength: "Secondary", impact: "Data governance requirements in Clause 8 address training data quality and responsible data use. Companion standard ISO 42002 covers AI risk including privacy." },
    { pillar: "risk", strength: "Primary", impact: "Clause 6 (Planning) mandates AI risk assessment across full lifecycle. Internal audit (Clause 9) verifies risk management effectiveness. Corrective action for nonconformities." },
  ],
  "fair": [
    { pillar: "governance", strength: "Secondary", impact: "FAIR risk reporting provides board-level AI risk metrics in financial terms. Governance committees use FAIR output to set risk appetite." },
    { pillar: "ethics", strength: "Secondary", impact: "Bias-related regulatory fines and discrimination litigation modelled as FAIR loss events. Ethics control effectiveness measured quantitatively." },
    { pillar: "privacy", strength: "Secondary", impact: "GDPR fines and privacy breach costs quantified as Secondary Loss Magnitude in FAIR model. Privacy control effectiveness measured by risk reduction." },
    { pillar: "risk", strength: "Primary", impact: "Core purpose: quantify AI risk in financial terms via Monte Carlo simulation. FAIR-AI taxonomy maps ML-specific threats (poisoning, inversion, prompt injection) to loss events." },
  ],
  "aaia": [
    { pillar: "governance", strength: "Primary", impact: "Domain 1 (Audit Charter) and Domain 6 (Governance Audit) evaluate AI governance effectiveness. Diversity of governance committee assessed as quality indicator." },
    { pillar: "ethics", strength: "Primary", impact: "Domain 3 (Bias Audit) is the most comprehensive structured bias testing methodology available. Gender as mandatory protected characteristic. Intersectional analysis required." },
    { pillar: "privacy", strength: "Secondary", impact: "Domain 5 (Data Quality Audit) reviews training data for personal data and gender representation. Privacy of training data subjects assessed." },
    { pillar: "risk", strength: "Primary", impact: "Risk-based audit planning (Domain 2) prioritises highest-risk AI systems. Domain 7 (Reporting) tracks findings to closure. Critical findings require immediate management response." },
  ],
};

// ─── POLICY DATA ─────────────────────────────────────────────────────────────
const POLICIES = [
  {
    id: "eu-ai-act",
    name: "EU AI Act",
    geography: "Europe",
    type: "Regulation",
    countries: ["Austria","Belgium","Bulgaria","Croatia","Cyprus","Czech Republic","Denmark","Estonia","Finland","France","Germany","Greece","Hungary","Ireland","Italy","Latvia","Lithuania","Luxembourg","Malta","Netherlands","Poland","Portugal","Romania","Slovakia","Slovenia","Spain","Sweden"],
    yearReleased: 2024,
    summary: "World's first comprehensive legal framework on AI. Risk-based classification: Unacceptable, High, Limited, Minimal. Bans certain AI outright and imposes strict obligations on high-risk systems including conformity assessments, human oversight, and fundamental rights impact assessments.",
    industries: ["Healthcare","Finance","Law Enforcement","Education","Employment","Critical Infrastructure","Border Control","Justice"],
    latestUpdateDate: "2024-08-01",
    latestUpdateSummary: "Entered into force August 2024. Phased implementation: prohibitions Aug 2025 · GPAI rules Aug 2025 · high-risk obligations Aug 2026 · remaining provisions Aug 2027.",
    color: { bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8", badge: "#dbeafe" },
    emoji: "🇪🇺",
    clauses: [
      { category: "Risk Classification", clause: "Article 6", parameter: "High-Risk AI", pillars: ["governance","risk"], description: "AI systems in Annex III sectors classified as high-risk with conformity assessment requirements.", biasConsideration: "High-risk classification explicitly targets systems affecting employment, education, and law enforcement where bias risk is greatest.", genderConsideration: "High-risk systems must not discriminate on grounds of sex or other protected characteristics.", complianceAction: "Conduct conformity assessment. Register in EU AI database before market placement.", riskLevel: "High" },
      { category: "Prohibited Practices", clause: "Article 5", parameter: "Unacceptable Risk AI", pillars: ["ethics","governance"], description: "Bans real-time biometric ID in public, social scoring by governments, manipulation of vulnerable groups.", biasConsideration: "Prohibits AI exploiting vulnerabilities of specific demographic groups.", genderConsideration: "Prohibition extends to manipulation based on gender identity or expression.", complianceAction: "Cease development of prohibited systems. Legal review of all biometric AI use cases.", riskLevel: "Critical" },
      { category: "Transparency", clause: "Article 13", parameter: "High-Risk Transparency", pillars: ["ethics","governance"], description: "High-risk AI must be transparent enough for deployers to interpret outputs. Instructions for use required.", biasConsideration: "Disclosure of training data characteristics and known bias limitations mandatory.", genderConsideration: "Deployers must understand how system handles gender-related data inputs.", complianceAction: "Produce technical documentation and plain-language user instructions.", riskLevel: "High" },
      { category: "Human Oversight", clause: "Article 14", parameter: "Human-in-the-Loop", pillars: ["governance","ethics"], description: "High-risk AI must allow humans to oversee, intervene, and override during operation.", biasConsideration: "Override required where outputs may affect protected groups.", genderConsideration: "Override capability mandatory in systems making decisions on gender or protected grounds.", complianceAction: "Design override controls and audit trails. Train operators.", riskLevel: "High" },
      { category: "Data Governance", clause: "Article 10", parameter: "Training Data Requirements", pillars: ["privacy","ethics"], description: "Training and test datasets must be relevant, representative, and free of errors. Bias examination mandatory.", biasConsideration: "Datasets examined for biases affecting health, safety, or fundamental rights.", genderConsideration: "Gender balance and representativeness in training data explicitly required.", complianceAction: "Document data sources, lineage, and bias examination results.", riskLevel: "High" },
      { category: "GPAI Models", clause: "Article 51–55", parameter: "General Purpose AI", pillars: ["risk","governance"], description: "GPAI models above 10^25 FLOPs classified as systemic risk with additional obligations.", biasConsideration: "Systemic GPAI models must assess and mitigate discriminatory outputs at scale.", genderConsideration: "Adversarial testing must include gender bias and stereotyping scenarios.", complianceAction: "Register in EU AI database. Submit technical documentation to AI Office.", riskLevel: "High" },
      { category: "Fundamental Rights", clause: "Article 27", parameter: "Rights Impact Assessment", pillars: ["ethics","privacy","risk"], description: "Deployers of high-risk AI must conduct fundamental rights impact assessments before deployment.", biasConsideration: "Assessment must address impacts on minority groups and marginalised communities.", genderConsideration: "Gender impact assessment is a mandatory component of the FRIA.", complianceAction: "Complete FRIA template. Publish results. Register in EU database.", riskLevel: "High" },
      { category: "Penalties", clause: "Article 99", parameter: "Fines", pillars: ["risk"], description: "Prohibited practices: up to €35M or 7% global turnover. High-risk violations: €15M or 3%.", biasConsideration: "Discriminatory AI use can trigger the highest fine tier.", genderConsideration: "Gender-based AI discrimination falls under maximum penalty provisions.", complianceAction: "Establish compliance programme and internal AI audit function.", riskLevel: "Critical" },
    ],
  },
  {
    id: "nist-ai-rmf",
    name: "NIST AI RMF",
    geography: "United States / International",
    type: "Framework",
    countries: ["United States"],
    yearReleased: 2023,
    summary: "Voluntary framework for managing AI risks across four functions: Govern, Map, Measure, Manage. Widely adopted internationally. Companion NIST AI 600-1 (2024) addresses generative AI risks specifically.",
    industries: ["All Sectors","Finance","Healthcare","Government","Technology","Defence"],
    latestUpdateDate: "2024-07-26",
    latestUpdateSummary: "Sector-specific profiles (financial services, healthcare) published July 2024. NIST AI 600-1 for generative AI published August 2024. Playbook resources updated.",
    color: { bg: "#f0fdf4", border: "#bbf7d0", text: "#15803d", badge: "#dcfce7" },
    emoji: "🇺🇸",
    clauses: [
      { category: "GOVERN", clause: "GOVERN 1", parameter: "Risk Policies", pillars: ["governance","risk"], description: "Establish policies, processes, and accountability for AI risk management across the organisation.", biasConsideration: "Policies must include algorithmic fairness and bias as risk categories.", genderConsideration: "Diverse governance teams recommended to surface gender-related risks.", complianceAction: "Appoint AI risk owner. Document AI risk appetite and tolerance levels.", riskLevel: "High" },
      { category: "GOVERN", clause: "GOVERN 4", parameter: "Organisational Culture", pillars: ["governance","ethics"], description: "Foster AI risk awareness across all functions including non-technical staff.", biasConsideration: "Training must include AI fairness and bias literacy.", genderConsideration: "Inclusive team composition reduces gender-related blind spots.", complianceAction: "Deliver AI risk training. Measure awareness. Include in performance expectations.", riskLevel: "Medium" },
      { category: "MAP", clause: "MAP 1", parameter: "Context Establishment", pillars: ["ethics","risk"], description: "Identify context: intended users, affected groups, and operational environment.", biasConsideration: "Explicitly identify vulnerable populations disproportionately impacted.", genderConsideration: "Disaggregate impact analysis by gender and intersectional characteristics.", complianceAction: "Complete stakeholder mapping. Document affected populations.", riskLevel: "High" },
      { category: "MAP", clause: "MAP 3", parameter: "Risk Categorisation", pillars: ["risk","ethics"], description: "Categorise AI risks by likelihood and impact across technical, societal, and organisational dimensions.", biasConsideration: "Bias and fairness risks included as explicit risk categories.", genderConsideration: "Gender-related harms included in societal risk register.", complianceAction: "Populate risk register with AI-specific categories. Review quarterly.", riskLevel: "High" },
      { category: "MEASURE", clause: "MEASURE 2", parameter: "Risk Measurement", pillars: ["risk","ethics"], description: "Quantify AI risks. Evaluate fairness, explainability, privacy, and robustness.", biasConsideration: "Measure disparate impact across demographic groups using fairness metrics.", genderConsideration: "Disaggregate performance metrics by gender. Track gaps across model versions.", complianceAction: "Define measurement methodology. Baseline before deployment. Monitor post-launch.", riskLevel: "High" },
      { category: "MEASURE", clause: "MEASURE 4", parameter: "Feedback Mechanisms", pillars: ["ethics","governance"], description: "Channels for affected individuals to report AI-related harms.", biasConsideration: "Feedback channels accessible to underrepresented and vulnerable groups.", genderConsideration: "Disaggregate feedback reports by gender where lawful.", complianceAction: "Build feedback portal. Assign review owner. Set SLA for response.", riskLevel: "Medium" },
      { category: "MANAGE", clause: "MANAGE 1", parameter: "Risk Response", pillars: ["risk","governance"], description: "Prioritise and respond to AI risks: mitigate, transfer, accept, or avoid.", biasConsideration: "Bias risks above threshold trigger mandatory mitigation, not acceptance.", genderConsideration: "Systems with gender performance gaps should be retrained or restricted.", complianceAction: "Implement risk treatment plans. Track to closure. Report to leadership.", riskLevel: "High" },
      { category: "MANAGE", clause: "MANAGE 3", parameter: "Incident Response", pillars: ["risk","governance"], description: "Define and rehearse incident response for AI failures and harmful outputs.", biasConsideration: "Bias incidents follow same escalation path as security incidents.", genderConsideration: "Gender discrimination defined as an AI incident type with specific response steps.", complianceAction: "Document AI incident playbook. Run tabletop exercise annually.", riskLevel: "High" },
    ],
  },
  {
    id: "nist-csf",
    name: "NIST CSF 2.0",
    geography: "United States / International",
    type: "Framework",
    countries: ["United States"],
    yearReleased: 2024,
    summary: "Updated Cybersecurity Framework adding a new GOVERN function, AI and ML system security controls, and supply chain risk management. Version 2.0 broadens applicability to all organisations beyond critical infrastructure.",
    industries: ["Critical Infrastructure","Finance","Healthcare","Technology","Government","Manufacturing"],
    latestUpdateDate: "2024-02-26",
    latestUpdateSummary: "CSF 2.0 released February 2024. New GOVERN function. AI/ML security addressed in implementation guides. Quick-start guides for SMBs and enterprises published.",
    color: { bg: "#fdf4ff", border: "#e9d5ff", text: "#7e22ce", badge: "#f3e8ff" },
    emoji: "🔒",
    clauses: [
      { category: "GOVERN", clause: "GV.OC", parameter: "Organisational Context", pillars: ["governance","risk"], description: "Understand mission, stakeholder expectations, and dependencies — now including AI/ML systems.", biasConsideration: "AI system risks to equity considered alongside security risks.", genderConsideration: "Stakeholder mapping includes groups asymmetrically impacted by AI security failures.", complianceAction: "Update organisational risk profile to include AI assets and threat vectors.", riskLevel: "Medium" },
      { category: "GOVERN", clause: "GV.RM", parameter: "Risk Management Strategy", pillars: ["governance","risk"], description: "Risk management strategy and risk tolerance including AI-enabled systems and supply chain.", biasConsideration: "AI fairness risk tolerance defined alongside cybersecurity risk tolerance.", genderConsideration: "Risk tolerance statements address harms to protected groups from AI system compromise.", complianceAction: "Revise risk appetite statements. Include AI in enterprise risk register.", riskLevel: "High" },
      { category: "IDENTIFY", clause: "ID.AM", parameter: "Asset Management", pillars: ["governance","privacy"], description: "Inventory AI/ML models and training datasets as organisational assets.", biasConsideration: "Training datasets flagged with fairness classification and bias documentation.", genderConsideration: "Gender-sensitive data assets identified and subjected to enhanced controls.", complianceAction: "Extend CMDB to include AI models, training data, inference endpoints.", riskLevel: "High" },
      { category: "IDENTIFY", clause: "ID.SC", parameter: "Supply Chain Risk", pillars: ["risk","governance"], description: "Assess risks from third-party AI model providers and data vendors.", biasConsideration: "Third-party AI model bias assessments required during vendor onboarding.", genderConsideration: "Vendor-supplied models assessed for gender bias before procurement.", complianceAction: "Add AI security questionnaire to vendor assessment. Review annually.", riskLevel: "High" },
      { category: "PROTECT", clause: "PR.DS", parameter: "Data Security", pillars: ["privacy","risk"], description: "Protect data at rest and in transit, including AI training datasets and model weights.", biasConsideration: "Sensitive demographic data in training sets protected with additional access controls.", genderConsideration: "Gender data in AI training corpora classified as sensitive. Access audited.", complianceAction: "Apply encryption and access controls to AI training data. Audit quarterly.", riskLevel: "High" },
      { category: "DETECT", clause: "DE.AE", parameter: "Anomaly Detection", pillars: ["risk","ethics"], description: "Detect adversarial attacks on AI models: poisoning, inversion, prompt injection.", biasConsideration: "Monitor for adversarial inputs designed to trigger discriminatory outputs.", genderConsideration: "Alert on outputs showing statistically significant gender performance disparity vs. baseline.", complianceAction: "Implement AI-specific anomaly detection. Assign SOC playbook.", riskLevel: "High" },
      { category: "RESPOND", clause: "RS.CO", parameter: "Incident Communication", pillars: ["governance","risk"], description: "Communicate AI model compromise to stakeholders, regulators, and affected individuals.", biasConsideration: "Bias-related AI incidents communicated to affected demographic groups.", genderConsideration: "Gender-specific harm notifications issued where AI compromise caused discriminatory outcomes.", complianceAction: "Define AI incident notification templates. Assign communications owner.", riskLevel: "Medium" },
      { category: "RECOVER", clause: "RC.RP", parameter: "Recovery Planning", pillars: ["risk","ethics"], description: "Execute recovery plans for AI incidents including model rollback and data remediation.", biasConsideration: "Fairness re-evaluation of restored AI models before production re-deployment.", genderConsideration: "Post-incident gender bias audit required before restoring AI affecting sensitive decisions.", complianceAction: "Include AI model rollback in DR plan. Test recovery procedures annually.", riskLevel: "High" },
    ],
  },
  {
    id: "iso-42001",
    name: "ISO 42001",
    geography: "International",
    type: "Standard",
    countries: ["Global — 167 ISO member nations"],
    yearReleased: 2023,
    summary: "First international AI Management System (AIMS) standard. Certifiable like ISO 27001. Provides requirements for establishing, implementing, maintaining, and improving an AI management system. Covers responsible development, deployment, and use of AI.",
    industries: ["All Sectors","Technology","Finance","Healthcare","Manufacturing","Government"],
    latestUpdateDate: "2023-12-18",
    latestUpdateSummary: "Published December 2023. Certification bodies began issuing certificates Q1 2024. Companion standards ISO 42002 (AI risk) and ISO 42003 (transparency) in development.",
    color: { bg: "#fff7ed", border: "#fed7aa", text: "#c2410c", badge: "#ffedd5" },
    emoji: "🌐",
    clauses: [
      { category: "Context", clause: "Clause 4", parameter: "Understanding Context", pillars: ["governance","ethics"], description: "Determine external/internal issues relevant to AI management. Identify interested parties.", biasConsideration: "Interested parties include groups affected by AI bias and discriminatory outcomes.", genderConsideration: "Gender equality identified as a relevant external issue.", complianceAction: "Document context analysis. Map interested parties. Review annually.", riskLevel: "Medium" },
      { category: "Leadership", clause: "Clause 5", parameter: "AI Policy", pillars: ["governance","ethics"], description: "Top management establishes AI policy including commitments to responsible AI.", biasConsideration: "AI policy must commit to fairness, non-discrimination, and bias mitigation.", genderConsideration: "Policy commitment to gender equity in AI design and outcomes required.", complianceAction: "Draft and approve AI policy at board level. Communicate internally and externally.", riskLevel: "High" },
      { category: "Planning", clause: "Clause 6", parameter: "AI Risk Assessment", pillars: ["risk","ethics"], description: "Process for identifying, analysing, and evaluating AI risks across full lifecycle.", biasConsideration: "Bias risk formally assessed using documented methodology for each AI system.", genderConsideration: "Gender impact included as mandatory risk dimension in AI risk register.", complianceAction: "Complete AI risk assessment for all in-scope systems. Review on significant change.", riskLevel: "High" },
      { category: "Support", clause: "Clause 7", parameter: "Competence & Awareness", pillars: ["governance","ethics"], description: "Persons affecting AI performance must be competent. Awareness across all roles.", biasConsideration: "AI fairness competency included in role requirements for developers and deployers.", genderConsideration: "Gender bias awareness training included in competency framework.", complianceAction: "Assess competency gaps. Deliver training. Maintain records.", riskLevel: "Medium" },
      { category: "Operation", clause: "Clause 8", parameter: "AI Impact Assessment", pillars: ["ethics","privacy","risk"], description: "Impact assessment before deployment. Assess impacts on individuals, groups, and society.", biasConsideration: "Disparate impact assessment required across demographic segments before go-live.", genderConsideration: "Gender impact assessment is a mandatory component of pre-deployment review.", complianceAction: "Complete impact assessment. Document mitigation. Obtain sign-off.", riskLevel: "High" },
      { category: "Operation", clause: "Clause 8.4", parameter: "Responsible AI Use", pillars: ["ethics","governance"], description: "Controls for responsible AI use: human oversight, data quality, transparency, accountability.", biasConsideration: "Controls must detect and respond to biased outputs in production.", genderConsideration: "Monitoring for gender performance disparity included in operational controls.", complianceAction: "Implement monitoring dashboard. Set alert thresholds. Assign ownership.", riskLevel: "High" },
      { category: "Evaluation", clause: "Clause 9", parameter: "AI Audit", pillars: ["governance","risk"], description: "Internal audits of AI management system at planned intervals.", biasConsideration: "Internal audit scope includes fairness metrics and bias incident review.", genderConsideration: "Gender equity in AI outcomes reviewed as standing management review agenda item.", complianceAction: "Plan and execute annual internal audit. Present findings to top management.", riskLevel: "High" },
      { category: "Improvement", clause: "Clause 10", parameter: "Continual Improvement", pillars: ["governance","ethics"], description: "Continually improve AI management system. Correct nonconformities.", biasConsideration: "Bias-related nonconformities trigger root cause analysis and preventive action.", genderConsideration: "Gender performance gaps treated as nonconformities requiring corrective action.", complianceAction: "Maintain corrective action register. Track to closure. Report improvement trends.", riskLevel: "Medium" },
    ],
  },
  {
    id: "fair",
    name: "FAIR",
    geography: "International",
    type: "Methodology",
    countries: ["Global — framework-based"],
    yearReleased: 2005,
    summary: "Factor Analysis of Information Risk — the only international quantitative model for cybersecurity and operational risk. FAIR-AI extension (2023) applies the methodology to ML system risks including bias, model degradation, and adversarial attacks.",
    industries: ["Finance","Insurance","Technology","Healthcare","Energy","Government"],
    latestUpdateDate: "2023-10-01",
    latestUpdateSummary: "FAIR-AI taxonomy published October 2023. Integration guidance with NIST AI RMF published 2024. ML-specific risk scenarios mapped to FAIR loss factors.",
    color: { bg: "#f0fdf4", border: "#bbf7d0", text: "#166534", badge: "#dcfce7" },
    emoji: "📊",
    clauses: [
      { category: "Risk Taxonomy", clause: "FAIR Core", parameter: "Loss Event Frequency", pillars: ["risk"], description: "Measure how often a loss event is likely to occur: Threat Event Frequency × Vulnerability.", biasConsideration: "Biased AI outputs modelled as a loss event type with frequency estimation.", genderConsideration: "Gender-discriminatory AI decisions quantified as a loss event category.", complianceAction: "Map AI risk scenarios to FAIR loss taxonomy. Estimate frequency from historical data.", riskLevel: "High" },
      { category: "Risk Taxonomy", clause: "FAIR Core", parameter: "Loss Magnitude", pillars: ["risk"], description: "Estimate size of loss: Primary Loss (direct) and Secondary Loss (reputational, regulatory).", biasConsideration: "Regulatory fines from discriminatory AI (GDPR, EU AI Act) modelled as secondary loss.", genderConsideration: "Gender discrimination litigation and reputational damage quantified as loss magnitude inputs.", complianceAction: "Build loss magnitude tables for AI risk scenarios. Validate with legal and finance.", riskLevel: "High" },
      { category: "Threat Analysis", clause: "FAIR-AI", parameter: "Threat Actor Identification", pillars: ["risk","ethics"], description: "Identify threat communities: adversarial attackers, malicious insiders, third-party vendors, unintentional actors.", biasConsideration: "Biased training data providers identified as unintentional threat actors.", genderConsideration: "Systemic underrepresentation of gender groups in training data modelled as a threat scenario.", complianceAction: "Document AI threat landscape. Map to asset inventory. Prioritise by likelihood.", riskLevel: "High" },
      { category: "Vulnerability", clause: "FAIR-AI", parameter: "AI Model Vulnerability", pillars: ["risk","ethics"], description: "Assess susceptibility to adversarial attacks, data poisoning, model inversion, prompt injection.", biasConsideration: "Bias amplification through fine-tuning assessed as a vulnerability dimension.", genderConsideration: "Gender stereotype reinforcement in generative AI modelled as an exploitable vulnerability.", complianceAction: "Conduct AI penetration test and red team exercise. Document findings.", riskLevel: "High" },
      { category: "Quantification", clause: "FAIR-AI", parameter: "Probabilistic Quantification", pillars: ["risk"], description: "Monte Carlo simulation produces probability distributions of risk exposure in dollar terms.", biasConsideration: "Bias-related regulatory fine distributions modelled using EU AI Act and GDPR penalty ranges.", genderConsideration: "Gender discrimination settlement probability distributions in loss exceedance curves.", complianceAction: "Build FAIR risk models. Present results to board as financial exposure.", riskLevel: "Medium" },
      { category: "Risk Communication", clause: "FAIR Core", parameter: "Executive Risk Reporting", pillars: ["governance","risk"], description: "Communicate AI risk in financial terms meaningful to executives and board.", biasConsideration: "Fairness risks presented in financial terms alongside security risks.", genderConsideration: "Gender bias risk exposure included in board-level AI risk dashboard.", complianceAction: "Produce quarterly AI risk report in FAIR format. Present to Risk Committee.", riskLevel: "Medium" },
      { category: "Integration", clause: "FAIR + NIST", parameter: "Framework Integration", pillars: ["risk","governance"], description: "FAIR provides quantitative measurement layer to complement qualitative frameworks.", biasConsideration: "Bias control effectiveness measured quantitatively via FAIR risk reduction calculations.", genderConsideration: "Gender equity controls evaluated by measurable reduction in bias-related expected loss.", complianceAction: "Create cross-reference mapping between FAIR scenarios and NIST/ISO controls.", riskLevel: "Medium" },
    ],
  },
  {
    id: "aaia",
    name: "AAIA Certification",
    geography: "International",
    type: "Certification",
    countries: ["Global — internationally recognised certification"],
    yearReleased: 2023,
    summary: "AI Audit Institute certification for AI auditors. Covers governance, risk, bias, explainability, robustness, and data quality across 7 audit domains. Increasingly required by regulators and procurement bodies when engaging AI vendors.",
    industries: ["All Sectors","Finance","Healthcare","Technology","Government","Consulting"],
    latestUpdateDate: "2024-03-01",
    latestUpdateSummary: "CAAIA exam updated March 2024 to include EU AI Act conformity assessment, generative AI audit methodology, and NIST AI RMF alignment.",
    color: { bg: "#fdf2f8", border: "#f9a8d4", text: "#9d174d", badge: "#fce7f3" },
    emoji: "🏅",
    clauses: [
      { category: "Audit Governance", clause: "Domain 1", parameter: "AI Audit Charter", pillars: ["governance"], description: "Establish scope, authority, and independence of AI audit function. Aligned with IIA standards.", biasConsideration: "Audit charter explicitly includes algorithmic fairness review in scope.", genderConsideration: "Gender equity audits conducted as a mandatory component of AI system review.", complianceAction: "Draft and approve AI audit charter. Present to audit committee for ratification.", riskLevel: "High" },
      { category: "Audit Planning", clause: "Domain 2", parameter: "Risk-Based Audit Planning", pillars: ["risk","governance"], description: "Conduct risk-based planning to prioritise AI systems for audit.", biasConsideration: "Systems with highest potential for discriminatory outputs prioritised in audit plan.", genderConsideration: "AI systems affecting employment, credit, healthcare audited for gender equity first.", complianceAction: "Produce annual AI audit plan approved by audit committee.", riskLevel: "High" },
      { category: "Bias Audit", clause: "Domain 3", parameter: "Algorithmic Bias Testing", pillars: ["ethics"], description: "Test AI models for disparate impact and disparate treatment across protected characteristics.", biasConsideration: "Structured bias testing using demographic parity, equalised odds, and calibration metrics.", genderConsideration: "Gender as mandatory protected characteristic in all bias audit engagements. Intersectional analysis required.", complianceAction: "Apply standardised bias testing suite. Document findings. Recommend remediation.", riskLevel: "Critical" },
      { category: "Explainability", clause: "Domain 4", parameter: "AI Explainability Review", pillars: ["ethics","governance"], description: "Assess whether AI systems produce explanations adequate for regulatory compliance.", biasConsideration: "Explanations reviewed for whether they obscure or reveal discriminatory decision logic.", genderConsideration: "Test whether explanation quality differs by gender of affected individual.", complianceAction: "Interview end users. Test explanation outputs. Benchmark against regulatory requirements.", riskLevel: "High" },
      { category: "Data Quality", clause: "Domain 5", parameter: "Training Data Review", pillars: ["privacy","ethics"], description: "Audit training data for representativeness, accuracy, and freedom from historical biases.", biasConsideration: "Assess whether training data perpetuates historical discrimination.", genderConsideration: "Gender representation in training data measured. Historical underrepresentation flagged.", complianceAction: "Sample training data. Compare demographic distributions. Report gaps.", riskLevel: "High" },
      { category: "Governance Audit", clause: "Domain 6", parameter: "AI Governance Effectiveness", pillars: ["governance","ethics"], description: "Evaluate effectiveness of AI governance: policies, roles, oversight, accountability.", biasConsideration: "Governance audit assesses whether bias incidents are escalated and resolved systematically.", genderConsideration: "Diversity of AI governance committee assessed as a governance quality indicator.", complianceAction: "Interview governance stakeholders. Review meeting minutes. Test escalation path.", riskLevel: "High" },
      { category: "Reporting", clause: "Domain 7", parameter: "Audit Reporting & Follow-Up", pillars: ["governance","risk"], description: "Produce audit reports with findings, risk ratings, and recommendations. Track corrective actions.", biasConsideration: "Bias findings rated using standardised severity scale. Critical findings require immediate response.", genderConsideration: "Gender equity findings tracked separately with dedicated follow-up timeline.", complianceAction: "Issue draft report. Obtain management response. Track to closure. Report to audit committee.", riskLevel: "High" },
    ],
  },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const PILLAR_LOOKUP = Object.fromEntries(PILLARS.map(p => [p.id, p]));
const RISK_COLORS = {
  Critical: { bg: "#fef2f2", text: "#dc2626", border: "#fecaca" },
  High:     { bg: "#fff7ed", text: "#c2410c", border: "#fed7aa" },
  Medium:   { bg: "#fefce8", text: "#a16207", border: "#fef08a" },
};

function exportToCSV(policies) {
  const rows = [
    ["Policy","Geography","Type","Countries","Year","Industries","Latest Update","Summary"],
    ...policies.map(p => [p.name, p.geography, p.type, p.countries.join("; "), p.yearReleased, p.industries.join("; "), p.latestUpdateDate, `"${p.summary.replace(/"/g,'""')}"`])
  ];
  const blob = new Blob([rows.map(r => r.join(",")).join("\n")], { type: "text/csv" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "ai-governance-policies.csv"; a.click();
}

function exportDetailToCSV(policy) {
  const rows = [
    ["Category","Clause","Parameter","Pillars","Description","Bias","Gender","Compliance Action","Risk"],
    ...policy.clauses.map(c => [c.category, c.clause, c.parameter, c.pillars.join("; "), `"${c.description.replace(/"/g,'""')}"`, `"${c.biasConsideration.replace(/"/g,'""')}"`, `"${c.genderConsideration.replace(/"/g,'""')}"`, `"${c.complianceAction.replace(/"/g,'""')}"`, c.riskLevel])
  ];
  const blob = new Blob([rows.map(r => r.join(",")).join("\n")], { type: "text/csv" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${policy.id}-detail.csv`; a.click();
}

// ─── PILLAR BADGE ────────────────────────────────────────────────────────────
function PillarBadge({ pillarId }) {
  const p = PILLAR_LOOKUP[pillarId];
  if (!p) return null;
  return (
    <span style={{ background: p.color.badge, color: p.color.text, border: `1px solid ${p.color.border}`, borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
      {p.emoji} {p.label}
    </span>
  );
}

function RiskBadge({ level }) {
  const c = RISK_COLORS[level] || RISK_COLORS.Medium;
  return <span style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}`, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>{level}</span>;
}

// ─── TOPICS VIEW ──────────────────────────────────────────────────────────────
function TopicsView({ onSelectPolicy }) {
  const [expanded, setExpanded] = useState(null);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 32px" }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#0f172a" }}>Four Pillars of AI Governance</h2>
        <p style={{ margin: "6px 0 0", fontSize: 14, color: "#64748b" }}>
          Every AI governance policy addresses some or all of these four interconnected pillars. Understanding each pillar — and how they depend on each other — is the foundation for interpreting any AI policy and knowing what work is required of your organisation.
        </p>
      </div>

      {/* Interdependency diagram (text-based) */}
      <div style={{ background: "#0f172a", borderRadius: 16, padding: 24, marginBottom: 28, color: "#fff" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.08em" }}>How the pillars connect</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
          {[
            { from: "Governance", to: "Ethics", how: "Sets the rules; enforces ethics through accountability" },
            { from: "Governance", to: "Risk", how: "Owns risk management programme and compliance" },
            { from: "Ethics", to: "Privacy", how: "Bias detection requires demographic data → tension with minimisation" },
            { from: "Ethics", to: "Risk", how: "Ethical failures (bias) directly create regulatory and reputational risk" },
            { from: "Privacy", to: "Risk", how: "Privacy breaches are a primary AI risk event (GDPR fines)" },
            { from: "Risk", to: "Governance", how: "Risk appetite and tolerance set at board level within governance" },
          ].map((link, i) => (
            <div key={i} style={{ background: "#1e293b", borderRadius: 10, padding: "10px 14px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#818cf8" }}>{link.from} → {link.to}</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4, lineHeight: 1.5 }}>{link.how}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Pillar Cards */}
      <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fill, minmax(520px, 1fr))" }}>
        {PILLARS.map(pillar => {
          const isOpen = expanded === pillar.id;
          // Which policies address this pillar?
          const coveringPolicies = POLICIES.filter(pol =>
            (POLICY_PILLAR_MAP[pol.id] || []).some(m => m.pillar === pillar.id)
          );

          return (
            <div key={pillar.id} style={{ background: "#fff", border: `1px solid ${pillar.color.border}`, borderRadius: 16, overflow: "hidden" }}>
              {/* Header */}
              <div style={{ background: pillar.color.bg, borderBottom: `1px solid ${pillar.color.border}`, padding: "16px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 24 }}>{pillar.emoji}</span>
                      <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0f172a" }}>{pillar.label}</h3>
                    </div>
                    <p style={{ margin: "8px 0 0", fontSize: 13, color: "#475569", lineHeight: 1.65, maxWidth: 440 }}>{pillar.definition}</p>
                  </div>
                </div>
              </div>

              <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Why it matters */}
                <div style={{ background: "#fefce8", border: "1px solid #fef08a", borderRadius: 8, padding: "10px 14px" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#a16207", textTransform: "uppercase", letterSpacing: "0.05em" }}>Why It Matters</div>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#334155", lineHeight: 1.6 }}>{pillar.whyItMatters}</p>
                </div>

                {/* Key Principles */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Key Principles</div>
                  <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
                    {pillar.keyPrinciples.map((p, i) => (
                      <li key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12, color: "#334155", lineHeight: 1.6 }}>
                        <span style={{ color: pillar.color.text, flexShrink: 0, marginTop: 2 }}>●</span>{p}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Work to be Done */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Work To Be Done</div>
                  <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
                    {pillar.workToBeDone.map((w, i) => (
                      <li key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12, color: "#334155", lineHeight: 1.6 }}>
                        <span style={{ color: "#22c55e", flexShrink: 0, marginTop: 2 }}>✓</span>{w}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Related Updates */}
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 14px" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Related Policy Updates</div>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#475569", lineHeight: 1.6 }}>{pillar.relatedUpdates}</p>
                </div>

                {/* Interdependencies */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Interdependencies</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {pillar.interdependencies.map((dep, i) => (
                      <div key={i} style={{ background: PILLAR_LOOKUP[dep.pillar.toLowerCase()]?.color.bg || "#f8fafc", border: `1px solid ${PILLAR_LOOKUP[dep.pillar.toLowerCase()]?.color.border || "#e2e8f0"}`, borderRadius: 8, padding: "8px 12px" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: PILLAR_LOOKUP[dep.pillar.toLowerCase()]?.color.text || "#334155" }}>
                          {PILLAR_LOOKUP[dep.pillar.toLowerCase()]?.emoji} ↔ {dep.pillar}
                        </div>
                        <p style={{ margin: "3px 0 0", fontSize: 12, color: "#475569", lineHeight: 1.5 }}>{dep.how}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Policies covering this pillar */}
                <div>
                  <button
                    onClick={() => setExpanded(isOpen ? null : pillar.id)}
                    style={{ background: "none", border: "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", padding: 0 }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Policies Addressing This Pillar ({coveringPolicies.length})
                    </div>
                    <span style={{ color: "#94a3b8", fontSize: 14 }}>{isOpen ? "▲" : "▼"}</span>
                  </button>
                  {isOpen && (
                    <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                      {coveringPolicies.map(pol => {
                        const mapping = (POLICY_PILLAR_MAP[pol.id] || []).find(m => m.pillar === pillar.id);
                        return (
                          <div key={pol.id} style={{ background: pol.color.bg, border: `1px solid ${pol.color.border}`, borderRadius: 10, padding: "10px 14px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span>{pol.emoji}</span>
                                <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{pol.name}</span>
                                {mapping && <span style={{ fontSize: 10, fontWeight: 600, color: mapping.strength === "Primary" ? pol.color.text : "#64748b", background: mapping.strength === "Primary" ? pol.color.badge : "#f1f5f9", borderRadius: 4, padding: "1px 6px", border: `1px solid ${pol.color.border}` }}>{mapping.strength}</span>}
                              </div>
                              <button onClick={() => onSelectPolicy(pol)} style={{ background: "#0f172a", color: "#fff", border: "none", borderRadius: 6, padding: "4px 12px", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
                                View →
                              </button>
                            </div>
                            {mapping && <p style={{ margin: 0, fontSize: 12, color: "#475569", lineHeight: 1.55 }}>{mapping.impact}</p>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── POLICY DETAIL ────────────────────────────────────────────────────────────
function PolicyDetail({ policy, onBack }) {
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");
  const [filterRisk, setFilterRisk] = useState("All");
  const [filterPillar, setFilterPillar] = useState("All");

  const categories = ["All", ...new Set(policy.clauses.map(c => c.category))];
  const pillarMapping = POLICY_PILLAR_MAP[policy.id] || [];

  const filtered = policy.clauses.filter(c => {
    const matchSearch = !search || [c.category, c.clause, c.parameter, c.description].some(f => f.toLowerCase().includes(search.toLowerCase()));
    const matchCat = filterCat === "All" || c.category === filterCat;
    const matchRisk = filterRisk === "All" || c.riskLevel === filterRisk;
    const matchPillar = filterPillar === "All" || c.pillars.includes(filterPillar);
    return matchSearch && matchCat && matchRisk && matchPillar;
  });

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={onBack} style={{ color: "#6366f1", background: "none", border: "1px solid #e0e7ff", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
            ← Back
          </button>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 22 }}>{policy.emoji}</span>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#0f172a" }}>{policy.name}</h1>
              <span style={{ background: policy.color.badge, color: policy.color.text, border: `1px solid ${policy.color.border}`, borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 600 }}>{policy.type}</span>
            </div>
            <p style={{ margin: "3px 0 0", fontSize: 12, color: "#64748b" }}>{policy.geography} · {policy.yearReleased} · Updated {policy.latestUpdateDate}</p>
          </div>
        </div>
        <button onClick={() => exportDetailToCSV(policy)} style={{ background: "#0f172a", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>Export CSV</button>
      </div>

      {/* Pillar Coverage Banner */}
      <div style={{ background: "#0f172a", padding: "14px 32px", display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Pillar Coverage:</span>
        {pillarMapping.map(m => {
          const p = PILLAR_LOOKUP[m.pillar];
          return p ? (
            <span key={m.pillar} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ background: p.color.badge, color: p.color.text, border: `1px solid ${p.color.border}`, borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 600 }}>
                {p.emoji} {p.label}
              </span>
              <span style={{ fontSize: 10, color: m.strength === "Primary" ? "#a78bfa" : "#64748b", fontWeight: 600 }}>{m.strength}</span>
            </span>
          ) : null;
        })}
      </div>

      {/* Summary */}
      <div style={{ background: policy.color.bg, borderBottom: `1px solid ${policy.color.border}`, padding: "14px 32px" }}>
        <p style={{ margin: 0, fontSize: 13, color: "#334155", lineHeight: 1.7, maxWidth: 900 }}>{policy.summary}</p>
        <p style={{ margin: "8px 0 0", fontSize: 12, color: "#64748b" }}><strong>Latest:</strong> {policy.latestUpdateSummary}</p>
      </div>

      {/* Pillar Impact per this Policy */}
      <div style={{ background: "#fff", borderBottom: "1px solid #f1f5f9", padding: "16px 32px" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>What This Policy Requires Across Each Pillar</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
          {pillarMapping.map(m => {
            const p = PILLAR_LOOKUP[m.pillar];
            return p ? (
              <div key={m.pillar} style={{ background: p.color.bg, border: `1px solid ${p.color.border}`, borderRadius: 10, padding: "10px 14px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: p.color.text, marginBottom: 4 }}>{p.emoji} {p.label} <span style={{ fontSize: 10, fontWeight: 500, color: "#94a3b8" }}>— {m.strength}</span></div>
                <p style={{ margin: 0, fontSize: 12, color: "#475569", lineHeight: 1.55 }}>{m.impact}</p>
              </div>
            ) : null;
          })}
        </div>
      </div>

      {/* Filters */}
      <div style={{ padding: "14px 32px", display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", background: "#fff", borderBottom: "1px solid #f1f5f9" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clauses..." style={{ flex: 1, minWidth: 200, padding: "8px 14px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none" }} />
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, background: "#fff" }}>
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={filterRisk} onChange={e => setFilterRisk(e.target.value)} style={{ padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, background: "#fff" }}>
          {["All","Critical","High","Medium"].map(r => <option key={r}>{r}</option>)}
        </select>
        <select value={filterPillar} onChange={e => setFilterPillar(e.target.value)} style={{ padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, background: "#fff" }}>
          {["All", ...PILLARS.map(p => p.id)].map(id => <option key={id} value={id}>{id === "All" ? "All Pillars" : `${PILLAR_LOOKUP[id]?.emoji} ${PILLAR_LOOKUP[id]?.label}`}</option>)}
        </select>
        <span style={{ fontSize: 12, color: "#94a3b8" }}>{filtered.length} clauses</span>
      </div>

      {/* Clause Cards */}
      <div style={{ padding: "24px 32px", display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill, minmax(480px, 1fr))" }}>
        {filtered.map((c, i) => (
          <div key={i} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
              <div>
                <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#6366f1", background: "#eef2ff", borderRadius: 4, padding: "2px 8px" }}>{c.category}</span>
                  <span style={{ fontSize: 11, color: "#94a3b8", fontFamily: "monospace" }}>{c.clause}</span>
                </div>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{c.parameter}</h3>
              </div>
              <RiskBadge level={c.riskLevel} />
            </div>

            {/* Pillar Tags */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {c.pillars.map(pid => <PillarBadge key={pid} pillarId={pid} />)}
            </div>

            <p style={{ margin: 0, fontSize: 13, color: "#475569", lineHeight: 1.65 }}>{c.description}</p>

            {[
              { label: "Bias Consideration", value: c.biasConsideration, color: "#fef3c7", border: "#fde68a", text: "#92400e" },
              { label: "Gender Consideration", value: c.genderConsideration, color: "#fdf2f8", border: "#f9a8d4", text: "#9d174d" },
              { label: "Compliance Action", value: c.complianceAction, color: "#f0fdf4", border: "#bbf7d0", text: "#166534" },
            ].map(field => (
              <div key={field.label} style={{ background: field.color, border: `1px solid ${field.border}`, borderRadius: 8, padding: "8px 12px" }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: field.text, textTransform: "uppercase", letterSpacing: "0.05em" }}>{field.label}</span>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "#334155", lineHeight: 1.6 }}>{field.value}</p>
              </div>
            ))}
          </div>
        ))}
        {filtered.length === 0 && <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 48, color: "#94a3b8" }}>No clauses match your filters.</div>}
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function AIGovernanceTracker() {
  const [view, setView] = useState("policies");   // "policies" | "topics"
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [filterGeo, setFilterGeo] = useState("All");

  const types = ["All", ...new Set(POLICIES.map(p => p.type))];
  const geos  = ["All", ...new Set(POLICIES.map(p => p.geography.split(" /")[0].trim()))];

  const filtered = useMemo(() => POLICIES.filter(p => {
    const s = search.toLowerCase();
    const matchSearch = !s || [p.name, p.summary, p.geography, ...p.industries].some(f => f.toLowerCase().includes(s));
    const matchType = filterType === "All" || p.type === filterType;
    const matchGeo  = filterGeo  === "All" || p.geography.startsWith(filterGeo);
    return matchSearch && matchType && matchGeo;
  }), [search, filterType, filterGeo]);

  if (selected) return <PolicyDetail policy={selected} onBack={() => setSelected(null)} />;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Inter','Segoe UI',sans-serif" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", padding: "32px 32px 24px", color: "#fff" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>AI Ethics & Governance Intelligence</div>
              <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800 }}>Global AI Policy Tracker</h1>
              <p style={{ margin: "8px 0 0", color: "#94a3b8", fontSize: 14 }}>Policy grid with clause-level detail · Four-pillar framework · Bias, gender & compliance analysis · Export</p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => exportToCSV(filtered)} style={{ background: "#fff", color: "#0f172a", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Export CSV</button>
              <button onClick={() => window.print()} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Print / PDF</button>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: 28, marginTop: 20, flexWrap: "wrap" }}>
            {[
              { label: "Policies", value: POLICIES.length },
              { label: "Total Clauses", value: POLICIES.reduce((s, p) => s + p.clauses.length, 0) },
              { label: "Pillars Tracked", value: PILLARS.length },
              { label: "Industries", value: new Set(POLICIES.flatMap(p => p.industries)).size },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#818cf8" }}>{s.value}</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Tab Nav */}
          <div style={{ display: "flex", gap: 4, marginTop: 20 }}>
            {[
              { id: "policies", label: "📋 Policy Grid" },
              { id: "topics",   label: "🧭 Topics Framework" },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setView(tab.id)}
                style={{ background: view === tab.id ? "#fff" : "transparent", color: view === tab.id ? "#0f172a" : "#94a3b8", border: "none", borderRadius: "8px 8px 0 0", padding: "8px 20px", cursor: "pointer", fontSize: 13, fontWeight: 600, transition: "all 0.15s" }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {view === "topics" ? (
        <TopicsView onSelectPolicy={pol => setSelected(pol)} />
      ) : (
        <>
          {/* Filters */}
          <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "14px 32px" }}>
            <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search policies, industries..." style={{ flex: 1, minWidth: 240, padding: "8px 14px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none" }} />
              <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, background: "#fff" }}>
                {types.map(t => <option key={t}>{t}</option>)}
              </select>
              <select value={filterGeo} onChange={e => setFilterGeo(e.target.value)} style={{ padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, background: "#fff" }}>
                {geos.map(g => <option key={g}>{g}</option>)}
              </select>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>{filtered.length} of {POLICIES.length} policies</span>
            </div>
          </div>

          {/* Policy Grid */}
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 32px" }}>
            <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fill, minmax(520px, 1fr))" }}>
              {filtered.map(p => {
                const pillarCoverage = POLICY_PILLAR_MAP[p.id] || [];
                return (
                  <div key={p.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                    {/* Card Header */}
                    <div style={{ background: p.color.bg, borderBottom: `1px solid ${p.color.border}`, padding: "16px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                        <span style={{ fontSize: 26 }}>{p.emoji}</span>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{p.name}</h2>
                            <span style={{ background: p.color.badge, color: p.color.text, border: `1px solid ${p.color.border}`, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>{p.type}</span>
                          </div>
                          <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{p.geography} · {p.yearReleased} · Updated {p.latestUpdateDate}</div>
                        </div>
                      </div>
                    </div>

                    <div style={{ padding: "16px 20px", flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
                      <p style={{ margin: 0, fontSize: 13, color: "#475569", lineHeight: 1.65 }}>{p.summary}</p>

                      {/* Pillar Coverage */}
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Pillar Coverage</div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {pillarCoverage.map(m => {
                            const pl = PILLAR_LOOKUP[m.pillar];
                            return pl ? (
                              <span key={m.pillar} style={{ background: pl.color.badge, color: pl.color.text, border: `1px solid ${pl.color.border}`, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>
                                {pl.emoji} {pl.label} {m.strength === "Primary" ? "●" : "○"}
                              </span>
                            ) : null;
                          })}
                        </div>
                        <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 4 }}>● Primary  ○ Secondary</div>
                      </div>

                      {/* Latest update */}
                      <div style={{ background: "#fefce8", border: "1px solid #fef08a", borderRadius: 8, padding: "8px 12px" }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#a16207", textTransform: "uppercase", letterSpacing: "0.05em" }}>Latest Update</div>
                        <p style={{ margin: "4px 0 0", fontSize: 12, color: "#334155", lineHeight: 1.6 }}>{p.latestUpdateSummary}</p>
                      </div>

                      {/* Industries */}
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 6 }}>Industries</div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {p.industries.slice(0, 5).map(ind => (
                            <span key={ind} style={{ background: p.color.badge, color: p.color.text, border: `1px solid ${p.color.border}`, borderRadius: 20, padding: "2px 10px", fontSize: 11 }}>{ind}</span>
                          ))}
                          {p.industries.length > 5 && <span style={{ background: "#f1f5f9", color: "#64748b", border: "1px solid #e2e8f0", borderRadius: 20, padding: "2px 10px", fontSize: 11 }}>+{p.industries.length - 5} more</span>}
                        </div>
                      </div>
                    </div>

                    <div style={{ padding: "12px 20px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>{p.clauses.length} clauses with pillar, bias & gender detail</span>
                      <button onClick={() => setSelected(p)} style={{ background: "#0f172a", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                        View Detail →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      <div style={{ textAlign: "center", padding: "20px 32px", borderTop: "1px solid #e2e8f0", color: "#94a3b8", fontSize: 12 }}>
        AI Ethics & Governance Tracker · March 2026 · Reference only — consult legal counsel for compliance decisions
      </div>
    </div>
  );
}
