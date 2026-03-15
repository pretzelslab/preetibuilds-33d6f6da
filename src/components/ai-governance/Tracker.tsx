import { useState, useMemo, useRef } from "react";
import * as XLSX from "xlsx";
import { POLICY_DIGESTS } from "./digests";

// ─── IMPLEMENTATION GUIDE DATA (discovery questions per policy) ───────────────
const IMPLEMENTATION_GUIDES = {
  "eu-ai-act": {
    intro: "Use this discovery guide to assess a client organisation's current state of compliance with the EU AI Act. Work through each area with the relevant stakeholder — Legal, Product, Engineering, or Risk — and capture current state, evidence, and gaps.",
    complianceDeadlines: [
      { date: "Aug 2025", requirement: "Prohibitions on unacceptable-risk AI active" },
      { date: "Aug 2025", requirement: "GPAI model obligations apply" },
      { date: "Aug 2026", requirement: "High-risk AI system obligations fully apply" },
      { date: "Aug 2027", requirement: "All remaining provisions" },
    ],
    areas: [
      {
        area: "AI System Inventory & Risk Classification",
        regulatoryRef: "Art. 6–9, Annex III — Risk Classification",
        dependencies: [],
        priority: "High",
        effort: "Medium",
        riskIfNotAddressed: "Non-compliance with foundational obligations; inability to demonstrate regulatory readiness; first target of supervisory authority review.",
        pillar: "governance",
        stakeholder: "CTO / Head of Product / Legal",
        questions: [
          "Do you have a complete inventory of all AI systems currently in use or development?",
          "For each system, has a risk classification been assigned (Unacceptable / High / Limited / Minimal)?",
          "Is there a documented process for classifying new AI systems before development begins?",
          "Who is accountable for maintaining the AI system register and keeping classifications current?",
        ],
        evidenceToCollect: ["AI system inventory spreadsheet or register", "Risk classification methodology document", "RACI for AI governance"],
        maturityIndicators: { notStarted: "No inventory exists. AI use cases are not tracked centrally.", developing: "Inventory exists but incomplete. No formal risk classification applied.", defined: "Complete inventory. Risk classification applied. Owner designated.", optimised: "Register is live, audited quarterly, integrated with change management." },
      },
      {
        area: "Prohibited AI Uses — Identification & Cessation",
        regulatoryRef: "Art. 5 — Prohibited Practices",
        dependencies: [],
        priority: "High",
        effort: "Low",
        riskIfNotAddressed: "Fines up to €35M or 7% of global turnover; criminal liability; immediate market withdrawal if prohibited use confirmed.",
        pillar: "ethics",
        stakeholder: "Legal / CISO / CTO",
        questions: [
          "Has the organisation reviewed all current AI use cases against Article 5 prohibited practices?",
          "Are any AI systems using real-time remote biometric identification in public spaces?",
          "Are any AI systems used for social scoring, manipulation of vulnerable groups, or subliminal influence?",
          "Is there a legal review process before any new biometric or emotion recognition AI is deployed?",
        ],
        evidenceToCollect: ["Legal review of current AI use cases against Article 5", "Written confirmation from business owners of no prohibited use", "Policy prohibiting future deployment without legal sign-off"],
        maturityIndicators: { notStarted: "No review of current AI against prohibitions has taken place.", developing: "Review in progress. Some use cases flagged for further analysis.", defined: "Full review completed. No prohibited uses confirmed in writing.", optimised: "Ongoing pre-deployment screening process in place. Legal sign-off required." },
      },
      {
        area: "High-Risk AI — Conformity Assessment",
        regulatoryRef: "Art. 43, Annex IV — Conformity Assessment",
        dependencies: ["AI System Inventory & Risk Classification"],
        priority: "High",
        effort: "High",
        riskIfNotAddressed: "Cannot legally place high-risk AI systems on the EU market; regulatory enforcement action and mandatory product withdrawal.",
        pillar: "risk",
        stakeholder: "Product / Legal / Engineering",
        questions: [
          "Which AI systems fall into Annex III high-risk categories (employment, education, credit, law enforcement, health)?",
          "Has a conformity assessment been completed or planned for each high-risk AI system?",
          "Is there technical documentation covering system design, training data, testing, and performance?",
          "Has the system been registered in the EU AI Act database (required before market placement)?",
        ],
        evidenceToCollect: ["Conformity assessment reports", "Technical documentation packages", "EU AI database registration confirmations", "CE marking (where applicable)"],
        maturityIndicators: { notStarted: "High-risk systems not identified. No conformity assessment underway.", developing: "High-risk systems identified. Assessments planned but not started.", defined: "Conformity assessments completed for all high-risk systems.", optimised: "Assessments completed, registered, and reviewed on every significant change." },
      },
      {
        area: "Training Data Governance & Bias Examination",
        regulatoryRef: "Art. 10 — Data & Data Governance",
        dependencies: ["AI System Inventory & Risk Classification"],
        priority: "High",
        effort: "High",
        riskIfNotAddressed: "Discriminatory AI outputs at scale; enforcement action; discrimination litigation; severe reputational and brand damage.",
        pillar: "privacy",
        stakeholder: "Data Engineering / ML / Legal / DPO",
        questions: [
          "Are training, validation, and test datasets documented with source, lineage, and collection date?",
          "Has a bias examination been conducted on datasets used for high-risk AI systems?",
          "Are gender, ethnicity, age, and other protected characteristics assessed for representativeness in training data?",
          "Is there a process for detecting and correcting data quality issues before training begins?",
        ],
        evidenceToCollect: ["Data lineage documentation", "Bias examination reports", "Dataset cards or datasheets for datasets", "Data quality assessment outputs"],
        maturityIndicators: { notStarted: "Training data is not documented. No bias examination has occurred.", developing: "Some datasets documented. Bias examination planned for priority systems.", defined: "All high-risk AI datasets documented and bias-examined.", optimised: "Automated dataset auditing in CI/CD pipeline. Bias reports version-controlled." },
      },
      {
        area: "Human Oversight & Override Controls",
        regulatoryRef: "Art. 14 — Human Oversight",
        dependencies: ["High-Risk AI — Conformity Assessment"],
        priority: "Medium",
        effort: "Medium",
        riskIfNotAddressed: "Automated AI decisions deemed non-compliant; liability for harms caused by unmonitored outputs without human intervention.",
        pillar: "governance",
        stakeholder: "Product / Engineering / Operations",
        questions: [
          "Do high-risk AI systems allow a human operator to monitor, intervene, and override AI outputs?",
          "Are override actions logged with timestamp, operator ID, and reason?",
          "Are operators trained on when and how to exercise oversight?",
          "Is there a process for escalating AI decisions that require human review before action is taken?",
        ],
        evidenceToCollect: ["UI/system documentation showing override controls", "Audit log samples", "Operator training records", "Escalation procedures"],
        maturityIndicators: { notStarted: "AI outputs are fully automated. No override capability.", developing: "Override capability exists but not consistently implemented or logged.", defined: "Override controls on all high-risk AI. Logging and training in place.", optimised: "Override patterns reviewed monthly. Escalation triggers automated alerts." },
      },
      {
        area: "Fundamental Rights Impact Assessment",
        regulatoryRef: "Art. 27 — FRIA",
        dependencies: ["AI System Inventory & Risk Classification"],
        priority: "High",
        effort: "Medium",
        riskIfNotAddressed: "Deployment of AI that violates fundamental rights; supervisory authority enforcement; public interest litigation and reputational harm.",
        pillar: "ethics",
        stakeholder: "Legal / DPO / Ethics Lead / Product",
        questions: [
          "Has a Fundamental Rights Impact Assessment (FRIA) been conducted for each high-risk AI deployment?",
          "Does the FRIA explicitly cover impacts on gender, ethnicity, disability, age, and intersectional groups?",
          "Is the FRIA completed before deployment, not after?",
          "Who signs off the FRIA and what authority do they have to halt deployment if risks are unacceptable?",
        ],
        evidenceToCollect: ["Completed FRIA documents", "Sign-off records", "Evidence of FRIA informing deployment decisions"],
        maturityIndicators: { notStarted: "No FRIA process exists.", developing: "FRIA template created. One or two assessments completed.", defined: "FRIA mandatory before all high-risk AI deployments. Results documented.", optimised: "FRIA integrated into product development gate. Published where required." },
      },
    ],
  },
  "nist-ai-rmf": {
    intro: "Use this guide to assess a client's implementation of the NIST AI Risk Management Framework across all four core functions: Govern, Map, Measure, Manage. Suitable for US-regulated organisations and multinationals adopting the RMF as a baseline.",
    complianceDeadlines: [
      { date: "Ongoing", requirement: "Voluntary framework — no mandatory deadlines. Sector-specific regulators (OCC, SEC, HHS) increasingly reference it." },
      { date: "2024", requirement: "NIST AI 600-1 (GenAI guidance) — assess all generative AI systems against additional risks." },
    ],
    areas: [
      {
        area: "GOVERN — AI Risk Policy & Accountability",
        regulatoryRef: "GOVERN 1.1–6.2 — Risk Culture & Policies",
        dependencies: [],
        priority: "High",
        effort: "Low",
        riskIfNotAddressed: "AI risks are ungoverned and invisible until an incident occurs; no named accountability for outcomes across the organisation.",
        pillar: "governance",
        stakeholder: "Board / CRO / General Counsel",
        questions: [
          "Is there a board-approved AI risk policy that defines the organisation's approach, risk appetite, and accountability?",
          "Is a named executive accountable for AI risk management (e.g. Chief AI Officer, Chief Risk Officer)?",
          "Are AI risk roles and responsibilities documented and communicated across the organisation?",
          "Is AI risk reviewed at board or senior management level on a regular schedule?",
        ],
        evidenceToCollect: ["AI risk policy document", "Board minute approving policy", "RACI or role definitions", "Board/committee AI risk reporting pack"],
        maturityIndicators: { notStarted: "No AI risk policy. AI risk not discussed at board level.", developing: "Draft policy exists. Ownership unclear. No board reporting.", defined: "Policy approved. Owner designated. Quarterly board reporting.", optimised: "Policy reviewed annually. AI risk is a standing board agenda item." },
      },
      {
        area: "MAP — Identifying Affected Populations & Risks",
        regulatoryRef: "MAP 1.1–5.2 — Risk Context & Classification",
        dependencies: ["GOVERN — AI Risk Policy & Accountability"],
        priority: "High",
        effort: "Medium",
        riskIfNotAddressed: "Harms to vulnerable groups go undetected; regulatory scrutiny from sector regulators; legal and reputational exposure.",
        pillar: "ethics",
        stakeholder: "Product / Data Science / Risk",
        questions: [
          "For each AI system, has the organisation documented who will be affected by its outputs (including indirectly)?",
          "Have vulnerable or marginalised groups who may be disproportionately impacted been explicitly identified?",
          "Is there a process to assess AI risks across societal, technical, and operational dimensions?",
          "Are bias and fairness risks included as formal risk categories in the AI risk register?",
        ],
        evidenceToCollect: ["Stakeholder and affected population maps", "AI risk register showing bias/fairness risk categories", "Pre-deployment risk assessments"],
        maturityIndicators: { notStarted: "No mapping of AI risks or affected populations.", developing: "Some systems have impact assessments. Not consistent.", defined: "All material AI systems mapped. Bias risk formally registered.", optimised: "Continuous impact monitoring. Feedback loops with affected communities." },
      },
      {
        area: "MEASURE — Fairness Metrics & Monitoring",
        regulatoryRef: "MEASURE 1.1–4.2 — Metrics & Testing",
        dependencies: ["MAP — Identifying Affected Populations & Risks"],
        priority: "Medium",
        effort: "High",
        riskIfNotAddressed: "Bias and fairness issues in production go undetected; discriminatory outcomes affect customers at scale before discovered.",
        pillar: "ethics",
        stakeholder: "ML Engineering / Data Science / Product",
        questions: [
          "Are fairness metrics (demographic parity, equalised odds, calibration) defined and measured for AI systems?",
          "Are model performance results disaggregated by gender, age, ethnicity, and other protected characteristics?",
          "Is there a baseline established pre-deployment that ongoing production metrics are compared against?",
          "Are measurement results reviewed by a person with authority to intervene if thresholds are breached?",
        ],
        evidenceToCollect: ["Fairness metric definitions", "Model cards or evaluation reports", "Disaggregated performance dashboards", "Threshold breach records and responses"],
        maturityIndicators: { notStarted: "No fairness metrics defined or measured.", developing: "Metrics defined for some systems. Not consistently monitored.", defined: "Metrics defined, baselined, and monitored for all material systems.", optimised: "Automated alerts on threshold breach. Metrics trend-tracked over model versions." },
      },
      {
        area: "MANAGE — Risk Treatment & Incident Response",
        regulatoryRef: "MANAGE 1.1–4.2 — Risk Response & Recovery",
        dependencies: ["GOVERN — AI Risk Policy & Accountability"],
        priority: "High",
        effort: "Medium",
        riskIfNotAddressed: "No ability to contain or respond to AI incidents; extended exposure window; regulatory breach notification failures.",
        pillar: "risk",
        stakeholder: "CRO / CISO / Product / Legal",
        questions: [
          "Is there a documented process for treating AI risks — covering mitigation, transfer, acceptance, and avoidance?",
          "Is there a defined AI incident response playbook covering bias events, model failures, and harmful outputs?",
          "Has the incident response playbook been tested via a tabletop exercise in the last 12 months?",
          "Are AI-related incidents logged, investigated, root-caused, and tracked to resolution?",
        ],
        evidenceToCollect: ["AI risk treatment plans", "AI incident response playbook", "Tabletop exercise records", "AI incident log"],
        maturityIndicators: { notStarted: "No AI-specific risk treatment or incident process.", developing: "Risk treatment ad-hoc. No AI incident playbook.", defined: "Treatment plans documented. Playbook exists and tested.", optimised: "Incident metrics reviewed monthly. Playbook updated after each incident." },
      },
    ],
  },
  "nist-csf": {
    intro: "Use this guide to assess a client's implementation of NIST CSF 2.0 with specific focus on AI and ML system security controls, supply chain risk, and the new GOVERN function.",
    complianceDeadlines: [
      { date: "Ongoing", requirement: "Voluntary framework. CISA and sector regulators increasingly mandate CSF alignment." },
      { date: "2024", requirement: "CSF 2.0 released — clients on v1.1 should plan migration including new GOVERN function." },
    ],
    areas: [
      {
        area: "GOVERN — AI Security Policy & Risk Strategy",
        regulatoryRef: "GV.OC, GV.RM — Organisational Context & Risk Mgmt",
        dependencies: [],
        priority: "High",
        effort: "Low",
        riskIfNotAddressed: "AI security risks ungoverned; no accountability for security outcomes; significant blind spots in threat landscape.",
        pillar: "governance",
        stakeholder: "CISO / CRO / Board",
        questions: [
          "Has the organisation updated its cybersecurity risk strategy to explicitly include AI and ML systems?",
          "Is there a defined risk tolerance for AI-specific threats (adversarial attacks, model poisoning, prompt injection)?",
          "Are AI systems included in the organisation's enterprise risk register?",
          "Who owns AI cybersecurity risk — and how does that role interact with the AI governance function?",
        ],
        evidenceToCollect: ["Updated risk strategy document", "Enterprise risk register showing AI risks", "AI-specific risk tolerance statements"],
        maturityIndicators: { notStarted: "AI security risks not in scope of cybersecurity strategy.", developing: "AI risks informally considered. Not in formal risk strategy.", defined: "AI risks in risk strategy with defined tolerance. Owner designated.", optimised: "AI security risk reviewed quarterly at board level alongside cyber risk." },
      },
      {
        area: "AI Asset Inventory & Supply Chain",
        regulatoryRef: "ID.AM, ID.SC — Asset & Supply Chain",
        dependencies: ["GOVERN — AI Security Policy & Risk Strategy"],
        priority: "High",
        effort: "Medium",
        riskIfNotAddressed: "Unknown AI attack surface; third-party components introduce unmanaged risk; supply chain compromise goes undetected.",
        pillar: "governance",
        stakeholder: "CISO / Procurement / CTO",
        questions: [
          "Are AI models, training datasets, and inference endpoints included in the organisation's asset inventory (CMDB)?",
          "Are third-party AI model providers and data vendors assessed for security risk before onboarding?",
          "Is there an AI-specific vendor risk questionnaire covering bias, security, and data governance?",
          "Are vendor AI security attestations reviewed annually?",
        ],
        evidenceToCollect: ["CMDB extract showing AI assets", "Vendor risk assessment templates", "AI supplier contracts with security clauses"],
        maturityIndicators: { notStarted: "No AI assets in CMDB. No vendor AI risk process.", developing: "Some AI assets tracked. Vendor process under development.", defined: "CMDB includes AI assets. Vendor AI questionnaire in use.", optimised: "Continuous asset discovery. Annual vendor attestations with right-to-audit." },
      },
      {
        area: "Training Data & Model Security",
        regulatoryRef: "PR.DS, PR.AT — Data Security & Awareness",
        dependencies: ["AI Asset Inventory & Supply Chain"],
        priority: "High",
        effort: "High",
        riskIfNotAddressed: "Model theft, poisoning, or data exfiltration; AI systems produce compromised outputs without detection or alerting.",
        pillar: "privacy",
        stakeholder: "CISO / Data Engineering / ML",
        questions: [
          "Are training datasets encrypted at rest and in transit with access controls and audit logging?",
          "Is gender or other sensitive demographic data in training corpora classified as sensitive and access-restricted?",
          "Are AI model weights and artefacts protected with the same rigour as source code?",
          "Is there a process to detect and respond to training data tampering or model poisoning?",
        ],
        evidenceToCollect: ["Data classification policy", "Encryption standards documentation", "Access control configurations", "Anomaly detection runbooks"],
        maturityIndicators: { notStarted: "Training data treated as generic data. No specific controls.", developing: "Encryption applied. Access controls inconsistent.", defined: "Training data classified. Encryption, access controls, and audit logging in place.", optimised: "Automated integrity checks on training data. Tampering triggers incident." },
      },
      {
        area: "AI Incident Detection & Response",
        regulatoryRef: "DE.CM, RS.CO — Detect & Respond",
        dependencies: ["GOVERN — AI Security Policy & Risk Strategy"],
        priority: "Medium",
        effort: "Medium",
        riskIfNotAddressed: "AI security incidents go undetected or are poorly contained; mandatory breach notification obligations breached.",
        pillar: "risk",
        stakeholder: "CISO / SOC / Legal",
        questions: [
          "Is there an AI-specific anomaly detection capability covering adversarial inputs and biased output patterns?",
          "Are AI systems included in the Security Operations Centre (SOC) monitoring scope?",
          "Is there a defined notification process for AI-related incidents affecting customers or regulators?",
          "Does the disaster recovery plan include AI model rollback and fairness re-validation procedures?",
        ],
        evidenceToCollect: ["SOC monitoring scope documentation", "AI anomaly detection playbooks", "Incident notification templates", "DR plan AI section"],
        maturityIndicators: { notStarted: "AI not in SOC scope. No AI incident playbook.", developing: "AI in scope but limited detection rules. Playbook drafted.", defined: "AI-specific detection and playbook. Notification process defined.", optimised: "AI incidents auto-escalated. Recovery tested annually including rollback." },
      },
    ],
  },
  "iso-42001": {
    intro: "Use this guide to assess a client's readiness for ISO 42001 certification or to identify gaps in their AI Management System (AIMS). Map findings to the clause structure for use in a formal gap assessment.",
    complianceDeadlines: [
      { date: "2023", requirement: "Standard published. Certification available from accredited bodies." },
      { date: "Ongoing", requirement: "No mandatory deadline — client-driven. Some procurement and regulatory bodies beginning to require it." },
    ],
    areas: [
      {
        area: "Clause 4–5: Context, Leadership & AI Policy",
        regulatoryRef: "ISO 42001 Clauses 4–5 — Context & Leadership",
        dependencies: [],
        priority: "High",
        effort: "Low",
        riskIfNotAddressed: "ISO 42001 certification unachievable without leadership clause; no executive accountability for AI management system.",
        pillar: "governance",
        stakeholder: "CEO / Board / General Counsel",
        questions: [
          "Has the organisation documented the internal and external issues relevant to its AI management system?",
          "Is there a board-approved AI policy that commits to responsible AI, legal compliance, and continual improvement?",
          "Does the AI policy explicitly address fairness, non-discrimination, and gender equity in AI outcomes?",
          "Has top management assigned roles and responsibilities for the AI management system?",
        ],
        evidenceToCollect: ["Context analysis document", "Board-approved AI policy", "Role and responsibility matrix"],
        maturityIndicators: { notStarted: "No AI policy. Context not documented.", developing: "Draft policy. Context analysis incomplete.", defined: "Policy approved. Context documented. Roles assigned.", optimised: "Policy reviewed annually. Context analysis feeds risk assessment." },
      },
      {
        area: "Clause 6: AI Risk Assessment & Planning",
        regulatoryRef: "ISO 42001 Clause 6 — Planning",
        dependencies: ["Clause 4–5: Context, Leadership & AI Policy"],
        priority: "High",
        effort: "Medium",
        riskIfNotAddressed: "AI risks discovered reactively; no systematic treatment planning; major nonconformity at certification audit.",
        pillar: "risk",
        stakeholder: "Risk / Product / Legal",
        questions: [
          "Is there a documented methodology for identifying, analysing, and evaluating AI risks?",
          "Are AI risks assessed across the full lifecycle — design, development, deployment, and decommissioning?",
          "Is bias risk formally assessed for each AI system using a documented methodology?",
          "Are the results of risk assessments used to determine what controls and treatments are needed?",
        ],
        evidenceToCollect: ["AI risk assessment methodology", "Completed risk assessments for in-scope systems", "Risk treatment plan"],
        maturityIndicators: { notStarted: "No AI risk assessment process.", developing: "Process defined but not consistently applied.", defined: "Methodology documented. Assessments completed for all in-scope systems.", optimised: "Assessments triggered automatically on significant change. Results feed board reporting." },
      },
      {
        area: "Clause 8: AI System Impact Assessment & Operation",
        regulatoryRef: "ISO 42001 Clause 8, Annex B — Operation & AIIA",
        dependencies: ["Clause 6: AI Risk Assessment & Planning"],
        priority: "High",
        effort: "High",
        riskIfNotAddressed: "AI impacts on people and society unassessed; ethical failures reach customers; ISO 42001 major nonconformity.",
        pillar: "ethics",
        stakeholder: "Product / Legal / DPO / Ethics Lead",
        questions: [
          "Is a pre-deployment AI impact assessment conducted for all in-scope AI systems?",
          "Does the impact assessment include disparate impact analysis across demographic groups (gender, ethnicity, age)?",
          "Are responsible AI use controls implemented — human oversight, data quality checks, transparency mechanisms?",
          "Who has authority to halt deployment if the impact assessment identifies unacceptable risks?",
        ],
        evidenceToCollect: ["Impact assessment templates and completed assessments", "Deployment gate approval records", "Evidence of human oversight controls"],
        maturityIndicators: { notStarted: "No impact assessment process.", developing: "Template created. One or two assessments done.", defined: "Mandatory pre-deployment. Disparate impact assessed. Gate approval required.", optimised: "Assessments automated where possible. Results tracked over model versions." },
      },
      {
        area: "Clause 9–10: Internal Audit & Continual Improvement",
        regulatoryRef: "ISO 42001 Clauses 9–10 — Performance & Improvement",
        dependencies: ["Clause 8: AI System Impact Assessment & Operation"],
        priority: "Medium",
        effort: "Medium",
        riskIfNotAddressed: "No evidence of AIMS performance; certification suspended or not renewed; unresolved nonconformities accumulate.",
        pillar: "risk",
        stakeholder: "Internal Audit / CRO / Board",
        questions: [
          "Is there an annual internal audit programme for the AI management system?",
          "Do internal audits cover fairness metrics, bias incidents, and data governance?",
          "Are audit findings tracked as nonconformities with root cause analysis and corrective action?",
          "Is the AI management system reviewed by top management at least annually?",
        ],
        evidenceToCollect: ["Internal audit plan and reports", "Nonconformity and corrective action register", "Management review minutes"],
        maturityIndicators: { notStarted: "No AI internal audit. No management review.", developing: "Audit planned. Management review ad-hoc.", defined: "Annual audit completed. Findings tracked. Management review documented.", optimised: "Audit insights drive continual improvement cycle. Metrics trend upward year-on-year." },
      },
    ],
  },
  "fair": {
    intro: "Use this guide to assess whether a client organisation has the capability to quantify AI risk in financial terms using the FAIR methodology. Most useful for financial services, insurance, and technology clients with mature risk management functions.",
    complianceDeadlines: [
      { date: "Ongoing", requirement: "Voluntary methodology. Increasingly referenced by financial regulators and insurance underwriters." },
    ],
    areas: [
      {
        area: "Risk Taxonomy & Scenario Identification",
        regulatoryRef: "FAIR Phase 1 — Scenario Identification",
        dependencies: [],
        priority: "High",
        effort: "Low",
        riskIfNotAddressed: "Quantification is impossible without agreed taxonomy; risk conversations are inconsistent and results incomparable across teams.",
        pillar: "risk",
        stakeholder: "CRO / Risk Analyst / CISO",
        questions: [
          "Has the organisation identified and documented AI-specific risk scenarios (model failure, data poisoning, bias at scale, adversarial attack)?",
          "Are AI risk scenarios mapped to the FAIR taxonomy — Loss Event Frequency and Loss Magnitude?",
          "Is gender discrimination / bias-related regulatory action included as a defined loss event scenario?",
          "Who owns AI risk scenario development and how often are scenarios reviewed?",
        ],
        evidenceToCollect: ["AI risk scenario library", "FAIR taxonomy mapping document", "Risk scenario review records"],
        maturityIndicators: { notStarted: "No AI risk scenarios defined.", developing: "Some scenarios identified. Not mapped to FAIR taxonomy.", defined: "Scenarios mapped to FAIR. Reviewed annually.", optimised: "Scenario library maintained. New scenarios added following industry events." },
      },
      {
        area: "Quantitative Risk Modelling",
        regulatoryRef: "FAIR Phase 2–3 — Risk Quantification",
        dependencies: ["Risk Taxonomy & Scenario Identification"],
        priority: "Medium",
        effort: "High",
        riskIfNotAddressed: "AI risks expressed qualitatively only; unable to prioritise investments or set cyber insurance levels by financial impact.",
        pillar: "risk",
        stakeholder: "Risk / Finance / CRO",
        questions: [
          "Is the organisation using Monte Carlo simulation to quantify AI risk exposure in dollar terms?",
          "Are EU AI Act and GDPR fine ranges incorporated into Secondary Loss Magnitude estimates?",
          "Is there a tooling platform in use (e.g. RiskLens, FAIR-U) or are models built in-house?",
          "Are FAIR risk model results presented to the board as financial exposure ranges, not heat map ratings?",
        ],
        evidenceToCollect: ["FAIR model outputs", "Board risk reports showing financial exposure", "Tooling platform access"],
        maturityIndicators: { notStarted: "Risk quantified only as High/Medium/Low ratings.", developing: "FAIR methodology known. Pilot model built for one scenario.", defined: "FAIR models for all material AI risks. Results in board pack.", optimised: "Models updated quarterly. Risk reduction ROI calculated for control investments." },
      },
      {
        area: "Threat & Vulnerability Analysis",
        regulatoryRef: "FAIR Phase 2 — Threat Analysis",
        dependencies: ["Risk Taxonomy & Scenario Identification"],
        priority: "Medium",
        effort: "Medium",
        riskIfNotAddressed: "Threat landscape not understood; risk models underestimate actual financial exposure; mispriced and underinsured risk.",
        pillar: "risk",
        stakeholder: "CISO / ML Engineering / Risk",
        questions: [
          "Have threat actors relevant to the organisation's AI systems been identified (adversarial, insider, vendor)?",
          "Is the vulnerability of AI systems to adversarial attacks assessed and scored?",
          "Are bias amplification and gender stereotype reinforcement modelled as exploitable vulnerabilities?",
          "Is there a red team or penetration testing function that covers AI-specific attack vectors?",
        ],
        evidenceToCollect: ["Threat actor profiles", "AI vulnerability assessments", "Red team / pen test reports covering AI"],
        maturityIndicators: { notStarted: "AI threat and vulnerability analysis not performed.", developing: "Threat actors identified. Vulnerability assessment ad-hoc.", defined: "Formal threat and vulnerability analysis. AI pen testing annual.", optimised: "Continuous threat intelligence. AI red team capability in-house." },
      },
    ],
  },
  "aaia": {
    intro: "Use this guide to structure an AI audit engagement or to assess a client's readiness for an AAIA-aligned AI audit. Work through each domain with the internal audit, risk, or compliance function.",
    complianceDeadlines: [
      { date: "Ongoing", requirement: "No mandatory timeline. Increasing regulatory and procurement demand for AI audit evidence." },
      { date: "2024", requirement: "CAAIA exam updated — ensure audit methodology aligns with EU AI Act conformity assessment." },
    ],
    areas: [
      {
        area: "Domain 1–2: Audit Charter & Risk-Based Planning",
        regulatoryRef: "AAIA Domains 1–2 — Audit Foundation",
        dependencies: [],
        priority: "High",
        effort: "Low",
        riskIfNotAddressed: "Internal audit has no mandate to assess AI; board has no independent assurance on AI risk; control failures go unreported.",
        pillar: "governance",
        stakeholder: "Chief Audit Executive / Audit Committee",
        questions: [
          "Does the internal audit charter explicitly include AI systems, algorithmic bias, and fairness in scope?",
          "Is there an annual AI audit plan that prioritises systems by risk level, regulatory exposure, and societal impact?",
          "Are AI systems affecting employment, credit, healthcare, and education audited for gender equity as a priority?",
          "Does the audit function have AI technical expertise — either in-house or through co-sourcing arrangements?",
        ],
        evidenceToCollect: ["Internal audit charter", "Annual AI audit plan", "Audit committee approval minutes", "AI competency matrix for audit team"],
        maturityIndicators: { notStarted: "AI not in audit charter. No AI audit plan.", developing: "Charter updated. AI audit plan in draft.", defined: "Charter and plan approved. Risk-based prioritisation applied.", optimised: "AI audit integrated with enterprise risk. CAAIA-certified auditors on team." },
      },
      {
        area: "Domain 3: Algorithmic Bias Testing",
        regulatoryRef: "AAIA Domain 3 — Algorithmic Bias Audit",
        dependencies: ["Domain 1–2: Audit Charter & Risk-Based Planning"],
        priority: "High",
        effort: "High",
        riskIfNotAddressed: "Biased AI decisions not caught by audit; discriminatory outcomes reach customers; audit function not fit for purpose in AI era.",
        pillar: "ethics",
        stakeholder: "Internal Audit / ML Engineering / Data Science",
        questions: [
          "Is a structured bias testing methodology applied to AI systems — covering disparate impact and disparate treatment?",
          "Are demographic parity, equalised odds, and calibration metrics measured and documented for audited systems?",
          "Is gender treated as a mandatory protected characteristic in all bias audit engagements?",
          "Is intersectional analysis conducted (e.g. gender × ethnicity, gender × age) where data permits?",
        ],
        evidenceToCollect: ["Bias testing methodology document", "Bias audit reports with metric outputs", "Evidence of gender and intersectional analysis"],
        maturityIndicators: { notStarted: "No bias testing performed.", developing: "Bias testing done for one or two systems. Methodology informal.", defined: "Structured methodology. All material systems tested. Gender mandatory.", optimised: "Automated bias testing in deployment pipeline. Results published to affected stakeholders." },
      },
      {
        area: "Domain 5: Training Data Quality Audit",
        regulatoryRef: "AAIA Domain 5 — Data Quality",
        dependencies: ["Domain 1–2: Audit Charter & Risk-Based Planning"],
        priority: "Medium",
        effort: "High",
        riskIfNotAddressed: "Data quality issues in AI training unidentified by audit; model performance and fairness compromised without audit evidence.",
        pillar: "privacy",
        stakeholder: "Internal Audit / Data Engineering / DPO",
        questions: [
          "Are training datasets audited for representativeness, accuracy, and freedom from historical bias?",
          "Is gender representation in training data measured and documented?",
          "Is historical underrepresentation of gender groups flagged as an audit finding requiring remediation?",
          "Is personal data in training datasets identified and subject to privacy controls?",
        ],
        evidenceToCollect: ["Data quality audit reports", "Dataset composition analysis", "Personal data inventory for training datasets"],
        maturityIndicators: { notStarted: "Training data quality not audited.", developing: "Data quality checks informal. Gender representation not measured.", defined: "Structured data audit. Gender representation documented. PII controlled.", optimised: "Automated data quality gates. Representation metrics tracked over time." },
      },
      {
        area: "Domain 6–7: Governance Audit & Reporting",
        regulatoryRef: "AAIA Domains 6–7 — Governance & Reporting",
        dependencies: ["Domain 1–2: Audit Charter & Risk-Based Planning"],
        priority: "Medium",
        effort: "Medium",
        riskIfNotAddressed: "AI governance failures unreported to board; inadequate oversight of AI risk programme; board-level accountability gaps persist.",
        pillar: "governance",
        stakeholder: "Internal Audit / Board / Risk Committee",
        questions: [
          "Does the governance audit assess whether bias incidents are escalated, investigated, and resolved systematically?",
          "Is the diversity of the AI governance committee assessed as a quality indicator?",
          "Are audit findings rated using a standardised severity scale with defined management response timelines?",
          "Are gender equity findings tracked separately with their own follow-up timeline and owner?",
        ],
        evidenceToCollect: ["Governance audit reports", "AI committee membership records", "Finding remediation tracker", "Audit committee reporting pack"],
        maturityIndicators: { notStarted: "No governance audit. Findings not formally tracked.", developing: "Governance reviewed informally. Tracking inconsistent.", defined: "Governance audit conducted. Findings rated and tracked to closure.", optimised: "Gender equity findings tracked separately. Audit committee reviews trend data." },
      },
    ],
  },
};

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

// ─── EXCEL EXPORT ─────────────────────────────────────────────────────────────
function exportDiscoveryToExcel(policy, guide, clientName = "", industry = "") {
  const wb = XLSX.utils.book_new();
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const clientLabel = clientName || "[Client Name]";
  const industryLabel = industry || "[Industry]";

  // ── 1. COVER ──────────────────────────────────────────────────────────────
  const coverData = [
    ["AI GOVERNANCE CLIENT DISCOVERY DOCUMENT"],
    [],
    ["Client", clientLabel],
    ["Industry", industryLabel],
    ["Policy", policy.name],
    ["Policy Type", policy.type],
    ["Geography", policy.geography],
    ["Document Date", today],
    ["Prepared by", "pretzelslab"],
    ["Status", "Draft — In Progress"],
    [],
    ["ABOUT THIS POLICY"],
    [guide.intro],
    [],
    ["KEY COMPLIANCE DEADLINES"],
    ["Date", "Requirement"],
    ...(guide.complianceDeadlines || []).map(d => [d.date, d.requirement]),
    [],
    ["DOCUMENT STRUCTURE — COMPLETE IN ORDER"],
    ["Sheet", "Purpose"],
    ["1. Cover", "Policy overview and deadlines (this sheet)"],
    ["2. Business Case", "Why pursue compliance — risk, cost, and strategic rationale"],
    ["3. Scope & AI Register", "Which AI systems and business units are in scope"],
    ["4. Stakeholder Map", "Who to interview, when, and what they own"],
    ["5. Discovery", "Question-by-question gap assessment with status and notes"],
    ["6. Evidence Tracker", "Documents reviewed and evidence collected"],
    ["7. Risk Register", "Consolidated risk log from discovery findings"],
    ["8. Assessment Summary", "Maturity ratings, gaps, and priority actions per area"],
    ["9. Roadmap", "Prioritised actions across 0-30d / 30-90d / 90d+ horizons"],
    ["10. Executive Summary", "Board-ready findings summary and recommendations"],
  ];
  const coverWs = XLSX.utils.aoa_to_sheet(coverData);
  coverWs["!cols"] = [{ wch: 24 }, { wch: 90 }];
  XLSX.utils.book_append_sheet(wb, coverWs, "Cover");

  // ── 2. BUSINESS CASE ──────────────────────────────────────────────────────
  const bcData = [
    ["BUSINESS CASE FOR COMPLIANCE"],
    ["Client:", clientLabel, "", "Policy:", policy.name],
    [],
    ["SECTION A — STRATEGIC CONTEXT"],
    ["Field", "Response"],
    ["Problem Statement", "What specific AI risk or compliance challenge is the client facing?"],
    ["Strategic Driver", "Regulation / Client demand / Board mandate / Competitive pressure / Incident"],
    ["Compliance Deadline", "What is the most urgent deadline and what does it require?"],
    ["AI Systems in Scope", "Which AI systems or use cases are affected?"],
    [],
    ["SECTION B — INDUSTRY USE CASES (Sample scenarios by industry)"],
    ["Industry", "Sample AI Use Cases typically in scope"],
    ["Financial Services / Fintech", "Credit scoring · KYC/AML automation · Fraud detection · Algorithmic trading · Robo-advisory · Loan underwriting"],
    ["Banking & Lending", "Mortgage approval AI · Customer risk scoring · Collections prediction · Anti-money laundering screening"],
    ["Insurtech", "Claims processing automation · Underwriting risk models · Fraud detection · Premium pricing AI"],
    ["Wealth Management", "Portfolio recommendation engines · Client risk profiling · Automated rebalancing"],
    ["Healthtech / EHR", "Clinical decision support · Diagnostic imaging AI · Patient risk stratification · Prior auth automation"],
    ["Digital Health / Telehealth", "Symptom checkers · Mental health chatbots · Remote monitoring alerts · Care pathway AI"],
    ["Medical Devices", "AI-assisted diagnostics · Surgical robotics · Wearable health AI · Drug discovery"],
    ["Technology & SaaS", "AI-powered features in products · LLM integrations · Recommendation engines · Automated customer service"],
    ["Public Sector", "Benefits eligibility determination · Predictive policing · Social care risk scoring · Document processing AI"],
    ["Retail & E-commerce", "Dynamic pricing AI · Personalisation engines · Demand forecasting · Returns fraud detection"],
    ["HR Technology", "CV screening AI · Interview scoring · Employee performance prediction · Workforce planning"],
    [],
    ["SECTION C — COST / BENEFIT ANALYSIS"],
    ["Field", "Response", "Notes"],
    ["Cost of Non-Compliance", "", "Regulatory fines, reputational damage, operational disruption"],
    ["Maximum Regulatory Fine", policy.type === "Regulation" ? "See compliance deadlines above" : "Not applicable — voluntary framework", ""],
    ["Reputational Risk if AI harm occurs", "", "Brand damage, client loss, press exposure"],
    ["Cost of Compliance", "", "Estimated investment to meet requirements"],
    ["Strategic Benefit", "", "Client trust, competitive differentiation, market access"],
    ["Insurance Impact", "", "Effect on AI/cyber insurance premiums and coverage"],
    ["Expected ROI Timeline", "", "When does compliance investment pay back?"],
    [],
    ["SECTION D — DECISION & SPONSORSHIP"],
    ["Field", "Response"],
    ["Executive Sponsor", "Name / Title of senior decision maker"],
    ["Budget Holder", "Name / Title"],
    ["Board Awareness", "Has the board discussed this compliance requirement?"],
    ["Decision Timeline", "When does the organisation need to decide on an engagement?"],
    ["Preferred Delivery Model", "Internal programme / External consultant / Hybrid"],
  ];
  const bcWs = XLSX.utils.aoa_to_sheet(bcData);
  bcWs["!cols"] = [{ wch: 32 }, { wch: 60 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, bcWs, "Business Case");

  // ── 3. SCOPE & AI REGISTER ────────────────────────────────────────────────
  const scopeHeaders = ["AI System / Use Case", "Business Unit", "System Owner", "Vendor / Provider", "In-house or 3rd Party", "Risk Tier", "Data Types Used", "Affected Populations", "Deployment Status", "In Scope for This Assessment?"];
  const scopeRows = [
    ["[Example: Credit Scoring Model]", "[Risk]", "[Name]", "[Internal / Vendor name]", "3rd Party", "High", "Financial data, Demographics", "Retail loan applicants", "Live in production", "Yes"],
    ["[Example: CV Screening AI]", "[HR]", "[Name]", "", "In-house", "High", "CV text, Photos (if any)", "Job applicants", "Pilot", "Yes"],
    ...Array(8).fill(["", "", "", "", "", "", "", "", "", ""]),
  ];
  const scopeWs = XLSX.utils.aoa_to_sheet([scopeHeaders, ...scopeRows]);
  scopeWs["!cols"] = [{ wch: 30 }, { wch: 20 }, { wch: 20 }, { wch: 22 }, { wch: 16 }, { wch: 12 }, { wch: 28 }, { wch: 28 }, { wch: 20 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, scopeWs, "Scope & AI Register");

  // ── 4. STAKEHOLDER MAP ────────────────────────────────────────────────────
  const shHeaders = ["Stakeholder Name", "Role / Title", "Department", "Pillar(s) Relevant", "Interview Scheduled?", "Interview Date", "Key Questions for This Person", "Availability / Notes"];
  const shRows = [
    ["", "CTO / VP Engineering", "Technology", "Governance, Risk", "", "", "AI system inventory, technical controls, model documentation", ""],
    ["", "Chief Risk Officer / CRO", "Risk", "Risk, Governance", "", "", "Risk appetite, AI risk register, incident response", ""],
    ["", "General Counsel / Legal", "Legal", "Governance, Ethics", "", "", "Prohibited use review, regulatory obligations, FRIA", ""],
    ["", "DPO / Privacy Lead", "Legal / Compliance", "Privacy", "", "", "Training data, DPIA/AIIA, data minimisation", ""],
    ["", "Head of Data Science / ML", "Technology", "Ethics, Privacy", "", "", "Model training, bias testing, fairness metrics", ""],
    ["", "Head of Product", "Product", "Governance, Ethics", "", "", "AI features, user-facing AI, human oversight", ""],
    ["", "CISO / Head of Security", "Security", "Risk", "", "", "Model security, data security, supply chain risk", ""],
    ["", "Chief Audit Executive", "Audit", "Governance, Risk", "", "", "Audit charter, AI audit capability, board reporting", ""],
    ["", "HR Director", "HR", "Ethics", "", "", "AI use in hiring, performance review, workforce planning", ""],
    ...Array(5).fill(["", "", "", "", "", "", "", ""]),
  ];
  const shWs = XLSX.utils.aoa_to_sheet([shHeaders, ...shRows]);
  shWs["!cols"] = [{ wch: 22 }, { wch: 26 }, { wch: 18 }, { wch: 22 }, { wch: 16 }, { wch: 16 }, { wch: 50 }, { wch: 28 }];
  XLSX.utils.book_append_sheet(wb, shWs, "Stakeholder Map");

  // ── 5. DISCOVERY (questions) ───────────────────────────────────────────────
  const headers = ["Discovery Area", "Regulatory Ref", "Priority", "Effort", "Pillar", "Stakeholder", "Q#", "Discovery Question", "Current Status", "Documentation Exists?", "Notes / Evidence", "Risk if Not Addressed", "Evidence to Collect", "Maturity — Not Started", "Maturity — Developing", "Maturity — Defined", "Maturity — Optimised"];
  const rows = [];
  guide.areas.forEach(area => {
    area.questions.forEach((q, qi) => {
      rows.push([
        area.area, area.regulatoryRef || "", area.priority || "", area.effort || "",
        area.pillar, area.stakeholder, qi + 1, q,
        "Not Started", "", "",
        area.riskIfNotAddressed || "", area.evidenceToCollect.join("\n"),
        area.maturityIndicators.notStarted, area.maturityIndicators.developing,
        area.maturityIndicators.defined, area.maturityIndicators.optimised,
      ]);
    });
  });
  const discoveryWs = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  discoveryWs["!cols"] = [
    { wch: 32 }, { wch: 28 }, { wch: 10 }, { wch: 12 }, { wch: 14 }, { wch: 28 }, { wch: 4 }, { wch: 60 },
    { wch: 14 }, { wch: 18 }, { wch: 36 }, { wch: 48 }, { wch: 36 }, { wch: 28 }, { wch: 28 }, { wch: 28 }, { wch: 28 }
  ];
  if (!discoveryWs["!dataValidation"]) discoveryWs["!dataValidation"] = [];
  rows.forEach((_, ri) => {
    discoveryWs["!dataValidation"].push({ sqref: `I${ri + 2}`, type: "list", formula1: '"Not Started,In Progress,Complete"', showDropDown: false });
    discoveryWs["!dataValidation"].push({ sqref: `J${ri + 2}`, type: "list", formula1: '"Yes,No,Partial"', showDropDown: false });
  });
  XLSX.utils.book_append_sheet(wb, discoveryWs, "Discovery");

  // ── 6. EVIDENCE TRACKER ───────────────────────────────────────────────────
  const evHeaders = ["Document / Artefact", "Expected Under", "Provided By", "Date Received", "Reviewed?", "Location / Reference", "Notes / Gaps Observed"];
  const evRows = [
    ["AI system inventory / register", "AI System Inventory & Risk Classification", "", "", "No", "", ""],
    ["Board-approved AI risk policy", "Governance / GOVERN areas", "", "", "No", "", ""],
    ["Risk classification methodology", "AI System Inventory & Risk Classification", "", "", "No", "", ""],
    ["Training data documentation / datasheets", "Training Data areas", "", "", "No", "", ""],
    ["Bias examination reports", "Training Data areas", "", "", "No", "", ""],
    ["Conformity assessment reports", "High-Risk AI areas", "", "", "No", "", ""],
    ["FRIA / AIIA documents", "Impact Assessment areas", "", "", "No", "", ""],
    ["Audit logs / override records", "Human Oversight areas", "", "", "No", "", ""],
    ["Incident response procedures", "Risk Management areas", "", "", "No", "", ""],
    ["Internal audit AI charter", "Audit areas", "", "", "No", "", ""],
    ...Array(10).fill(["", "", "", "", "No", "", ""]),
  ];
  const evWs = XLSX.utils.aoa_to_sheet([evHeaders, ...evRows]);
  evWs["!cols"] = [{ wch: 40 }, { wch: 36 }, { wch: 20 }, { wch: 14 }, { wch: 12 }, { wch: 30 }, { wch: 44 }];
  XLSX.utils.book_append_sheet(wb, evWs, "Evidence Tracker");

  // ── 7. RISK REGISTER ──────────────────────────────────────────────────────
  const rrHeaders = ["Risk ID", "Discovery Area", "Risk Description", "Root Cause", "Likelihood (1-5)", "Impact (1-5)", "Risk Score", "Priority", "Treatment", "Control Owner", "Target Date", "Status", "Residual Risk Notes"];
  const rrRows = guide.areas.map((area, i) => [
    `R${String(i + 1).padStart(3, "0")}`,
    area.area,
    area.riskIfNotAddressed || "",
    "",
    "", "", "",
    area.priority || "",
    "", "", "", "Open", ""
  ]);
  const rrWs = XLSX.utils.aoa_to_sheet([rrHeaders, ...rrRows]);
  rrWs["!cols"] = [{ wch: 10 }, { wch: 32 }, { wch: 50 }, { wch: 30 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 30 }, { wch: 22 }, { wch: 14 }, { wch: 12 }, { wch: 36 }];
  XLSX.utils.book_append_sheet(wb, rrWs, "Risk Register");

  // ── 8. ASSESSMENT SUMMARY ─────────────────────────────────────────────────
  const summaryHeaders = ["Discovery Area", "Pillar", "Stakeholder", "Maturity Rating", "Key Gaps Identified", "Priority Actions", "Owner", "Target Date"];
  const summaryRows = guide.areas.map(area => [area.area, area.pillar, area.stakeholder, "Not Started", "", "", "", ""]);
  const summaryWs = XLSX.utils.aoa_to_sheet([summaryHeaders, ...summaryRows]);
  summaryWs["!cols"] = [{ wch: 32 }, { wch: 14 }, { wch: 28 }, { wch: 18 }, { wch: 40 }, { wch: 40 }, { wch: 20 }, { wch: 14 }];
  summaryRows.forEach((_, ri) => {
    if (!summaryWs["!dataValidation"]) summaryWs["!dataValidation"] = [];
    summaryWs["!dataValidation"].push({ sqref: `D${ri + 2}`, type: "list", formula1: '"Not Started,Developing,Defined,Optimised"', showDropDown: false });
  });
  XLSX.utils.book_append_sheet(wb, summaryWs, "Assessment Summary");

  // ── 9. ROADMAP ────────────────────────────────────────────────────────────
  const rmHeaders = ["Horizon", "Action", "Discovery Area", "Priority", "Effort", "Owner", "Dependencies", "Target Date", "Status", "Notes"];
  const rmData = [
    ["0–30 days (Immediate / Quick Wins)", "Example: Complete AI system inventory", "", "High", "Low", "", "", "", "Not Started", ""],
    ["0–30 days (Immediate / Quick Wins)", "Example: Legal review of prohibited AI uses (Art. 5)", "", "High", "Low", "", "", "", "Not Started", ""],
    ["0–30 days (Immediate / Quick Wins)", "", "", "", "", "", "", "", "", ""],
    ["30–90 days (Short-term)", "Example: Conduct conformity assessment for high-risk AI", "", "High", "High", "", "AI inventory complete", "", "Not Started", ""],
    ["30–90 days (Short-term)", "Example: Implement bias testing on training datasets", "", "High", "High", "", "", "", "Not Started", ""],
    ["30–90 days (Short-term)", "", "", "", "", "", "", "", "", ""],
    ["90+ days (Strategic)", "Example: Achieve ISO 42001 certification", "", "Medium", "High", "", "All Clause 4–8 gaps addressed", "", "Not Started", ""],
    ["90+ days (Strategic)", "Example: Build ongoing AI audit programme", "", "Medium", "Medium", "", "", "", "Not Started", ""],
    ["90+ days (Strategic)", "", "", "", "", "", "", "", "", ""],
  ];
  const rmWs = XLSX.utils.aoa_to_sheet([rmHeaders, ...rmData]);
  rmWs["!cols"] = [{ wch: 28 }, { wch: 50 }, { wch: 30 }, { wch: 12 }, { wch: 12 }, { wch: 20 }, { wch: 30 }, { wch: 14 }, { wch: 14 }, { wch: 36 }];
  XLSX.utils.book_append_sheet(wb, rmWs, "Roadmap");

  // ── 10. EXECUTIVE SUMMARY ─────────────────────────────────────────────────
  const esData = [
    ["EXECUTIVE SUMMARY — AI GOVERNANCE DISCOVERY FINDINGS"],
    [],
    ["Client", clientLabel, "", "Policy", policy.name],
    ["Industry", industryLabel, "", "Assessment Date", today],
    ["Prepared by", "pretzelslab", "", "Status", "Draft"],
    [],
    ["OVERALL READINESS"],
    ["Overall Maturity Rating", "", "(Not Started / Developing / Defined / Optimised)"],
    ["% Discovery Areas Complete", ""],
    ["% Questions Answered", ""],
    [],
    ["KEY FINDINGS"],
    ["Finding 1 — Strengths", "What is already in place and working"],
    ["Finding 2 — Critical Gaps", "The most urgent gaps requiring immediate action"],
    ["Finding 3 — Systemic Issues", "Underlying structural or cultural issues observed"],
    [],
    ["TOP 3 RISKS (from Risk Register)"],
    ["#", "Risk", "Impact", "Likelihood", "Recommended Treatment"],
    ["1", "", "", "", ""],
    ["2", "", "", "", ""],
    ["3", "", "", "", ""],
    [],
    ["RECOMMENDED NEXT STEPS"],
    ["Immediate (0–30 days)", ""],
    ["Short-term (30–90 days)", ""],
    ["Strategic (90+ days)", ""],
    [],
    ["ENGAGEMENT RECOMMENDATION"],
    ["Proposed Engagement", ""],
    ["Estimated Duration", ""],
    ["Key Deliverables", ""],
    ["Indicative Investment", ""],
    ["Expected Outcome", ""],
    [],
    ["NOTES FOR BOARD / AUDIT COMMITTEE"],
    [""],
    [],
    ["Prepared by: pretzelslab · " + today + " · Confidential — for discussion purposes only"],
  ];
  const esWs = XLSX.utils.aoa_to_sheet(esData);
  esWs["!cols"] = [{ wch: 30 }, { wch: 60 }, { wch: 4 }, { wch: 24 }, { wch: 36 }];
  XLSX.utils.book_append_sheet(wb, esWs, "Executive Summary");

  XLSX.writeFile(wb, `${clientName ? clientName.replace(/\s+/g, "-").toLowerCase() + "-" : ""}${policy.id}-discovery.xlsx`);
}

// ─── PARSE UPLOADED DISCOVERY EXCEL → SOLUTION DOC ────────────────────────────
function parseDiscoveryExcel(file, policy, guide, onResult) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const wb = XLSX.read(e.target.result, { type: "array" });
    const ws = wb.Sheets["Discovery"];
    if (!ws) { onResult({ error: "Could not find 'Discovery' sheet in uploaded file." }); return; }
    const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });

    // Group by area
    const areaMap = {};
    rows.forEach(row => {
      const area = row["Discovery Area"] || "";
      if (!areaMap[area]) areaMap[area] = { pillar: row["Pillar"], stakeholder: row["Stakeholder"], questions: [] };
      areaMap[area].questions.push({ q: row["Discovery Question"], status: row["Current Status"] || "Not Started", notes: row["Notes / Evidence"] || "", priority: row["Priority"] || "", effort: row["Effort"] || "" });
    });

    // Parse summary sheet
    const sumWs = wb.Sheets["Assessment Summary"];
    const summaryRows = sumWs ? XLSX.utils.sheet_to_json(sumWs, { defval: "" }) : [];
    const summaryMap = {};
    summaryRows.forEach(r => { summaryMap[r["Discovery Area"]] = { maturity: r["Maturity Rating"], gaps: r["Key Gaps Identified"], actions: r["Priority Actions"], owner: r["Owner"], targetDate: r["Target Date"] }; });

    onResult({ areaMap, summaryMap, policy, guide });
  };
  reader.readAsArrayBuffer(file);
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

// ─── SOLUTION DOCUMENT ────────────────────────────────────────────────────────
function SolutionDoc({ result, onBack }) {
  const { areaMap, summaryMap, policy, guide } = result;
  const STATUS_COLOR = { "Complete": "#15803d", "In Progress": "#a16207", "Not Started": "#dc2626" };
  const STATUS_BG = { "Complete": "#f0fdf4", "In Progress": "#fefce8", "Not Started": "#fef2f2" };

  const allQs = Object.entries(areaMap).flatMap(([area, data]) => data.questions.map(q => ({ ...q, area })));
  const complete = allQs.filter(q => q.status === "Complete").length;
  const inProgress = allQs.filter(q => q.status === "In Progress").length;
  const notStarted = allQs.filter(q => q.status === "Not Started").length;
  const pct = Math.round((complete / allQs.length) * 100);

  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <div className="no-print" style={{ background: "#0f172a", padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <button onClick={onBack} style={{ color: "#a5b4fc", background: "none", border: "1px solid #334155", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>← Back to Discovery</button>
        <button onClick={() => window.print()} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Print / Save as PDF</button>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 32px" }}>
        {/* Header */}
        <div style={{ borderBottom: "3px solid #0f172a", paddingBottom: 24, marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Governance Solution Document</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 32 }}>{policy.emoji}</span>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#0f172a" }}>{policy.name} — Readiness Report</h1>
          </div>
          <div style={{ fontSize: 13, color: "#64748b" }}>Generated from completed discovery · {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</div>
        </div>

        {/* Readiness summary */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 32 }}>
          {[
            { label: "Overall Readiness", value: `${pct}%`, color: pct >= 70 ? "#15803d" : pct >= 40 ? "#a16207" : "#dc2626", bg: pct >= 70 ? "#f0fdf4" : pct >= 40 ? "#fefce8" : "#fef2f2" },
            { label: "Complete", value: complete, color: "#15803d", bg: "#f0fdf4" },
            { label: "In Progress", value: inProgress, color: "#a16207", bg: "#fefce8" },
            { label: "Not Started", value: notStarted, color: "#dc2626", bg: "#fef2f2" },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Per-area breakdown */}
        {Object.entries(areaMap).map(([area, data], ai) => {
          const sum = summaryMap[area] || {};
          const areaComplete = data.questions.filter(q => q.status === "Complete").length;
          const areaTotal = data.questions.length;
          const pillar = PILLAR_LOOKUP[data.pillar];
          return (
            <div key={ai} style={{ marginBottom: 32, pageBreakInside: "avoid" }}>
              <div style={{ background: pillar?.color.bg || "#f8fafc", border: `1px solid ${pillar?.color.border || "#e2e8f0"}`, borderRadius: "10px 10px 0 0", padding: "12px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: pillar?.color.text || "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>{pillar?.emoji} {pillar?.label} · {data.stakeholder}</div>
                  <h2 style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{area}</h2>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: areaComplete === areaTotal ? "#15803d" : areaComplete > 0 ? "#a16207" : "#dc2626" }}>{areaComplete}/{areaTotal}</div>
                  <div style={{ fontSize: 10, color: "#64748b" }}>complete</div>
                </div>
              </div>
              <div style={{ border: `1px solid ${pillar?.color.border || "#e2e8f0"}`, borderTop: "none", borderRadius: "0 0 10px 10px", overflow: "hidden" }}>
                {data.questions.map((q, qi) => (
                  <div key={qi} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, padding: "10px 16px", borderTop: qi > 0 ? "1px solid #f1f5f9" : "none", background: qi % 2 === 0 ? "#fff" : "#fafafa", alignItems: "start" }}>
                    <div>
                      <div style={{ fontSize: 12, color: "#334155", lineHeight: 1.6 }}>{q.q}</div>
                      {q.notes && <div style={{ fontSize: 11, color: "#64748b", marginTop: 4, fontStyle: "italic" }}>Notes: {q.notes}</div>}
                    </div>
                    <span style={{ background: STATUS_BG[q.status] || "#f8fafc", color: STATUS_COLOR[q.status] || "#64748b", borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>{q.status}</span>
                  </div>
                ))}
                {/* Summary row if populated */}
                {(sum.maturity || sum.actions || sum.gaps) && (
                  <div style={{ padding: "12px 16px", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {sum.maturity && <div><span style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Maturity Rating: </span><span style={{ fontSize: 12, color: "#334155", fontWeight: 600 }}>{sum.maturity}</span></div>}
                    {sum.gaps && <div><span style={{ fontSize: 10, fontWeight: 700, color: "#dc2626", textTransform: "uppercase" }}>Key Gaps: </span><span style={{ fontSize: 12, color: "#334155" }}>{sum.gaps}</span></div>}
                    {sum.actions && <div style={{ gridColumn: "1 / -1" }}><span style={{ fontSize: 10, fontWeight: 700, color: "#1d4ed8", textTransform: "uppercase" }}>Priority Actions: </span><span style={{ fontSize: 12, color: "#334155" }}>{sum.actions}</span></div>}
                    {(sum.owner || sum.targetDate) && <div style={{ gridColumn: "1 / -1", fontSize: 11, color: "#64748b" }}>Owner: {sum.owner || "—"}  ·  Target: {sum.targetDate || "—"}</div>}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Recommendations */}
        {notStarted > 0 && (
          <div style={{ marginBottom: 32, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#dc2626", marginBottom: 12 }}>🔴 Priority Gaps — Not Started ({notStarted} items)</div>
            {Object.entries(areaMap).map(([area, data]) => {
              const gaps = data.questions.filter(q => q.status === "Not Started");
              if (!gaps.length) return null;
              return (
                <div key={area} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>{area}</div>
                  {gaps.map((q, i) => <div key={i} style={{ fontSize: 12, color: "#475569", paddingLeft: 12, marginBottom: 2 }}>• {q.q}</div>)}
                </div>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: 40, paddingTop: 16, borderTop: "1px solid #e2e8f0", fontSize: 11, color: "#94a3b8", display: "flex", justifyContent: "space-between" }}>
          <span>{policy.name} Solution Document · pretzelslab · {new Date().getFullYear()}</span>
          <span>Confidential · For discussion purposes only</span>
        </div>
      </div>
    </div>
  );
}

// ─── IMPLEMENTATION GUIDE VIEW ───────────────────────────────────────────────
function PolicyGuide({ policy, onBack }) {
  const guide = IMPLEMENTATION_GUIDES[policy.id];
  const uploadRef = useRef(null);
  const [solutionResult, setSolutionResult] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientIndustry, setClientIndustry] = useState("");

  const INDUSTRIES = ["Financial Services / Fintech", "Banking & Lending", "Insurtech", "Wealth Management", "Healthtech / EHR", "Digital Health / Telehealth", "Medical Devices", "Technology & SaaS", "Public Sector", "Retail & E-commerce", "HR Technology", "Manufacturing", "Other"];

  if (!guide) return <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>No implementation guide available for this policy yet.</div>;
  if (solutionResult) return <SolutionDoc result={solutionResult} onBack={() => setSolutionResult(null)} />;

  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    parseDiscoveryExcel(file, policy, guide, (result) => {
      setUploading(false);
      if (result.error) { setUploadError(result.error); return; }
      setSolutionResult(result);
    });
    e.target.value = "";
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      {/* Print-hide nav */}
      <div className="no-print" style={{ background: "#0f172a", padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <button onClick={onBack} style={{ color: "#a5b4fc", background: "none", border: "1px solid #334155", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
          ← Back
        </button>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button onClick={() => setShowClientModal(true)} style={{ background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
            ⬇ Download Excel
          </button>
          <label style={{ background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
            {uploading ? "Processing…" : "⬆ Upload Completed Discovery"}
            <input ref={uploadRef} type="file" accept=".xlsx,.xls" onChange={handleUpload} style={{ display: "none" }} />
          </label>
          <button onClick={() => window.print()} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
            Print / PDF
          </button>
        </div>
      </div>
      {uploadError && (
        <div style={{ background: "#fef2f2", borderBottom: "1px solid #fecaca", padding: "10px 32px", fontSize: 13, color: "#dc2626" }}>
          ⚠ {uploadError}
        </div>
      )}

      {/* Client details modal */}
      {showClientModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: "36px 40px", maxWidth: 440, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
            <h2 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 700, color: "#0f172a" }}>Prepare Client Discovery</h2>
            <p style={{ margin: "0 0 24px", fontSize: 13, color: "#64748b" }}>Optional: add client details to brand the Excel document.</p>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Client Name</label>
              <input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="e.g. Apex Capital Partners" style={{ width: "100%", padding: "10px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Industry</label>
              <select value={clientIndustry} onChange={e => setClientIndustry(e.target.value)} style={{ width: "100%", padding: "10px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, background: "#fff", outline: "none", boxSizing: "border-box" }}>
                <option value="">Select industry…</option>
                {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowClientModal(false)} style={{ flex: 1, background: "#f1f5f9", color: "#374151", border: "none", borderRadius: 8, padding: "11px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={() => { exportDiscoveryToExcel(policy, guide, clientName, clientIndustry); setShowClientModal(false); }} style={{ flex: 2, background: "#15803d", color: "#fff", border: "none", borderRadius: 8, padding: "11px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                ⬇ Download Excel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 32px" }}>

        {/* Cover */}
        <div style={{ borderBottom: "3px solid #0f172a", paddingBottom: 24, marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Client Discovery Document</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 32 }}>{policy.emoji}</span>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#0f172a" }}>{policy.name}</h1>
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13, color: "#475569", marginBottom: 12 }}>
            <span><strong>Type:</strong> {policy.type}</span>
            <span><strong>Geography:</strong> {policy.geography}</span>
            <span><strong>Year:</strong> {policy.yearReleased}</span>
            <span><strong>Last Updated:</strong> {policy.latestUpdateDate}</span>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: "#475569", lineHeight: 1.7 }}>{guide.intro}</p>
        </div>

        {/* Compliance Deadlines */}
        {guide.complianceDeadlines?.length > 0 && (
          <div style={{ marginBottom: 32, background: "#fefce8", border: "1px solid #fef08a", borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#a16207", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Key Compliance Deadlines</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {guide.complianceDeadlines.map((d, i) => (
                  <tr key={i} style={{ borderTop: i > 0 ? "1px solid #fef08a" : "none" }}>
                    <td style={{ padding: "6px 12px 6px 0", fontSize: 12, fontWeight: 700, color: "#92400e", whiteSpace: "nowrap", width: 100 }}>{d.date}</td>
                    <td style={{ padding: "6px 0", fontSize: 13, color: "#334155" }}>{d.requirement}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Discovery Areas */}
        {guide.areas.map((area, aIdx) => {
          const pillar = PILLAR_LOOKUP[area.pillar];
          return (
            <div key={aIdx} style={{ marginBottom: 36, pageBreakInside: "avoid" }}>
              {/* Area Header */}
              <div style={{ background: pillar?.color.bg || "#f8fafc", border: `1px solid ${pillar?.color.border || "#e2e8f0"}`, borderRadius: "10px 10px 0 0", padding: "12px 18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: pillar?.color.text || "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>
                      {pillar?.emoji} {pillar?.label} · Discovery Area {aIdx + 1}
                    </div>
                    <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{area.area}</h2>
                  </div>
                  <div style={{ textAlign: "right", fontSize: 11, color: "#64748b", flexShrink: 0, marginLeft: 16 }}>
                    <div style={{ fontWeight: 600 }}>Stakeholder</div>
                    <div>{area.stakeholder}</div>
                  </div>
                </div>
                {/* Priority / Effort / Risk row */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  {area.priority && (
                    <span style={{
                      background: area.priority === "High" ? "#fef2f2" : area.priority === "Medium" ? "#fefce8" : "#f0fdf4",
                      color: area.priority === "High" ? "#dc2626" : area.priority === "Medium" ? "#a16207" : "#15803d",
                      border: `1px solid ${area.priority === "High" ? "#fecaca" : area.priority === "Medium" ? "#fef08a" : "#bbf7d0"}`,
                      borderRadius: 20, padding: "2px 10px", fontSize: 10, fontWeight: 700
                    }}>
                      ▲ {area.priority} Priority
                    </span>
                  )}
                  {area.effort && (
                    <span style={{ background: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0", borderRadius: 20, padding: "2px 10px", fontSize: 10, fontWeight: 600 }}>
                      ⏱ {area.effort === "Low" ? "Quick Win" : area.effort === "Medium" ? "Medium Effort" : "Complex"} Effort
                    </span>
                  )}
                  {area.regulatoryRef && (
                    <span style={{ background: "#eef2ff", color: "#4338ca", border: "1px solid #c7d2fe", borderRadius: 20, padding: "2px 10px", fontSize: 10, fontWeight: 600 }}>
                      📎 {area.regulatoryRef}
                    </span>
                  )}
                  {area.dependencies?.length > 0 && (
                    <span style={{ background: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa", borderRadius: 20, padding: "2px 10px", fontSize: 10, fontWeight: 600 }}>
                      🔗 Requires: {area.dependencies.join(", ")}
                    </span>
                  )}
                  {area.riskIfNotAddressed && (
                    <span style={{ fontSize: 11, color: "#64748b", fontStyle: "italic" }}>
                      ⚠ If not addressed: {area.riskIfNotAddressed}
                    </span>
                  )}
                </div>
              </div>

              {/* Discovery Questions */}
              <div style={{ border: `1px solid ${pillar?.color.border || "#e2e8f0"}`, borderTop: "none", borderRadius: "0 0 10px 10px", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      <th style={{ padding: "8px 14px", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "left", width: 32 }}>#</th>
                      <th style={{ padding: "8px 14px", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "left" }}>Discovery Question</th>
                      <th style={{ padding: "8px 14px", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "center", width: 110 }}>Current State</th>
                      <th style={{ padding: "8px 14px", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "left", width: 180 }}>Notes / Evidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {area.questions.map((q, qIdx) => (
                      <tr key={qIdx} style={{ borderTop: "1px solid #f1f5f9", background: qIdx % 2 === 0 ? "#fff" : "#fafafa" }}>
                        <td style={{ padding: "10px 14px", fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>{qIdx + 1}</td>
                        <td style={{ padding: "10px 14px", fontSize: 13, color: "#334155", lineHeight: 1.6 }}>{q}</td>
                        <td style={{ padding: "10px 14px", textAlign: "center" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
                            {["Not Started", "In Progress", "Complete"].map(s => (
                              <label key={s} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#475569", cursor: "default" }}>
                                <span style={{ width: 13, height: 13, border: "1.5px solid #cbd5e1", borderRadius: 3, display: "inline-block", flexShrink: 0 }} />
                                {s}
                              </label>
                            ))}
                          </div>
                        </td>
                        <td style={{ padding: "10px 14px", fontSize: 12, color: "#94a3b8", fontStyle: "italic", verticalAlign: "top" }}>
                          <div style={{ minHeight: 40, borderBottom: "1px solid #e2e8f0" }} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Evidence & Maturity */}
                <div style={{ padding: "14px 18px", background: "#f8fafc", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Evidence to Collect</div>
                    {area.evidenceToCollect.map((e, i) => (
                      <div key={i} style={{ display: "flex", gap: 6, alignItems: "flex-start", marginBottom: 4 }}>
                        <span style={{ color: "#22c55e", fontSize: 12, flexShrink: 0, marginTop: 1 }}>☐</span>
                        <span style={{ fontSize: 12, color: "#475569" }}>{e}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Maturity Indicators</div>
                    {Object.entries(area.maturityIndicators).map(([level, desc]) => (
                      <div key={level} style={{ marginBottom: 5 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: level === "optimised" ? "#15803d" : level === "defined" ? "#1d4ed8" : level === "developing" ? "#a16207" : "#dc2626", textTransform: "capitalize" }}>{level}: </span>
                        <span style={{ fontSize: 11, color: "#475569" }}>{desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Summary Table */}
        <div style={{ marginTop: 40, pageBreakInside: "avoid" }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>Assessment Summary</h2>
          <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
            <thead>
              <tr style={{ background: "#0f172a", color: "#fff" }}>
                <th style={{ padding: "10px 14px", fontSize: 11, fontWeight: 600, textAlign: "left" }}>Discovery Area</th>
                <th style={{ padding: "10px 14px", fontSize: 11, fontWeight: 600, textAlign: "left" }}>Pillar</th>
                <th style={{ padding: "10px 14px", fontSize: 11, fontWeight: 600, textAlign: "left" }}>Stakeholder</th>
                <th style={{ padding: "10px 14px", fontSize: 11, fontWeight: 600, textAlign: "center", width: 120 }}>Maturity Rating</th>
                <th style={{ padding: "10px 14px", fontSize: 11, fontWeight: 600, textAlign: "left" }}>Priority Actions</th>
              </tr>
            </thead>
            <tbody>
              {guide.areas.map((area, i) => {
                const pillar = PILLAR_LOOKUP[area.pillar];
                return (
                  <tr key={i} style={{ borderTop: "1px solid #f1f5f9", background: i % 2 === 0 ? "#fff" : "#f8fafc" }}>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: "#0f172a", fontWeight: 500 }}>{area.area}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ fontSize: 11, background: pillar?.color.badge, color: pillar?.color.text, borderRadius: 4, padding: "2px 8px", fontWeight: 600 }}>{pillar?.label}</span>
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 11, color: "#64748b" }}>{area.stakeholder}</td>
                    <td style={{ padding: "10px 14px", textAlign: "center" }}>
                      <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                        {["NS","Dev","Def","Opt"].map(l => (
                          <span key={l} style={{ width: 22, height: 22, border: "1.5px solid #cbd5e1", borderRadius: 4, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: "#94a3b8", fontWeight: 600 }}>{l}</span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ minHeight: 20, borderBottom: "1px solid #e2e8f0" }} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 40, paddingTop: 16, borderTop: "1px solid #e2e8f0", fontSize: 11, color: "#94a3b8", display: "flex", justifyContent: "space-between" }}>
          <span>{policy.name} Client Discovery · pretzelslab · {new Date().getFullYear()}</span>
          <span>Confidential · For discussion purposes only</span>
        </div>
      </div>
    </div>
  );
}

// ─── POLICY DIGEST ────────────────────────────────────────────────────────────
function PolicyDigestDetail({ policy, onBack }) {
  const digest = POLICY_DIGESTS[policy.id];
  if (!digest) return <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>No digest available for this policy yet.</div>;

  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <div className="no-print" style={{ background: "#0f172a", padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <button onClick={onBack} style={{ color: "#a5b4fc", background: "none", border: "1px solid #334155", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>← All Digests</button>
        <button onClick={() => window.print()} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Print / PDF</button>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 32px" }}>
        {/* Header */}
        <div style={{ borderBottom: "3px solid #0f172a", paddingBottom: 24, marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Policy Digest — Plain English Guide</div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
            <span style={{ fontSize: 36 }}>{policy.emoji}</span>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#0f172a", lineHeight: 1.2 }}>{policy.name}</h1>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{policy.type} · {policy.geography} · {policy.yearReleased}</div>
            </div>
          </div>
        </div>

        {/* TL;DR */}
        <div style={{ marginBottom: 32, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: 22 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>The Short Version</div>
          <p style={{ margin: 0, fontSize: 14, color: "#334155", lineHeight: 1.8 }}>{digest.tldr}</p>
        </div>

        {/* Critical Points */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 14 }}>What You Need to Understand</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {digest.criticalPoints.map((pt, i) => (
              <div key={i} style={{
                border: `1px solid ${pt.critical ? "#fecaca" : "#e2e8f0"}`,
                borderLeft: `4px solid ${pt.critical ? "#dc2626" : "#94a3b8"}`,
                borderRadius: 10,
                padding: "14px 18px",
                background: pt.critical ? "#fef2f2" : "#fff",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  {pt.critical && <span style={{ fontSize: 10, fontWeight: 700, color: "#dc2626", background: "#fee2e2", borderRadius: 4, padding: "2px 7px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Critical</span>}
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{pt.heading}</span>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: "#334155", lineHeight: 1.75 }}>{pt.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Key Obligations */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 14 }}>Key Obligations</div>
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: 18 }}>
            {digest.keyObligations.map((ob, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: i < digest.keyObligations.length - 1 ? 10 : 0 }}>
                <span style={{ color: "#15803d", fontSize: 14, flexShrink: 0, marginTop: 1 }}>✓</span>
                <span style={{ fontSize: 13, color: "#166534", lineHeight: 1.65 }}>{ob}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Who Needs to Act */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>Who Needs to Act</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {digest.whoNeedsToAct.map((role, i) => (
              <span key={i} style={{ background: "#0f172a", color: "#e2e8f0", borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 600 }}>{role}</span>
            ))}
          </div>
        </div>

        {/* Common Misconceptions */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 14 }}>Common Misconceptions</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {digest.commonMisconceptions.map((mc, i) => (
              <div key={i} style={{ border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
                <div style={{ background: "#fef2f2", padding: "10px 16px", display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "#dc2626", flexShrink: 0, marginTop: 1 }}>✗</span>
                  <span style={{ fontSize: 13, color: "#7f1d1d", fontStyle: "italic", lineHeight: 1.6 }}>"{mc.myth}"</span>
                </div>
                <div style={{ background: "#f0fdf4", padding: "10px 16px", display: "flex", gap: 8, alignItems: "flex-start", borderTop: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "#15803d", flexShrink: 0, marginTop: 1 }}>✓</span>
                  <span style={{ fontSize: 13, color: "#166534", lineHeight: 1.6 }}>{mc.truth}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Practical Tip */}
        <div style={{ background: "#fefce8", border: "1px solid #fef08a", borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#a16207", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>💡 Where to Start</div>
          <p style={{ margin: 0, fontSize: 13, color: "#713f12", lineHeight: 1.75 }}>{digest.practicalTip}</p>
        </div>

        <div style={{ marginTop: 40, paddingTop: 16, borderTop: "1px solid #e2e8f0", fontSize: 11, color: "#94a3b8", display: "flex", justifyContent: "space-between" }}>
          <span>{policy.name} Digest · pretzelslab · {new Date().getFullYear()}</span>
          <span>For informational purposes only — consult legal counsel for compliance decisions</span>
        </div>
      </div>
    </div>
  );
}

function PolicyDigestGrid({ policies, onSelect }) {
  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 32px" }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#0f172a" }}>Policy Digest Library</h2>
        <p style={{ margin: "6px 0 0", fontSize: 14, color: "#64748b" }}>Plain-English guides to each AI governance policy — what it means, what it requires, and where to start. Includes critical points highlighted, common misconceptions corrected, and practical first steps.</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 20 }}>
        {policies.map(p => {
          const digest = POLICY_DIGESTS[p.id];
          const criticalCount = digest?.criticalPoints.filter(c => c.critical).length || 0;
          return (
            <div key={p.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <div style={{ background: p.color.bg, borderBottom: `1px solid ${p.color.border}`, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 28 }}>{p.emoji}</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{p.name}</h3>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{p.type} · {p.geography}</div>
                </div>
              </div>
              <div style={{ padding: "14px 20px", flex: 1 }}>
                <p style={{ margin: 0, fontSize: 13, color: "#475569", lineHeight: 1.65 }}>
                  {digest?.tldr.slice(0, 160)}…
                </p>
                <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {criticalCount > 0 && (
                    <span style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>
                      {criticalCount} Critical Points
                    </span>
                  )}
                  <span style={{ background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>
                    {digest?.keyObligations.length || 0} Obligations
                  </span>
                  <span style={{ background: "#f8fafc", color: "#64748b", border: "1px solid #e2e8f0", borderRadius: 6, padding: "2px 8px", fontSize: 11 }}>
                    {digest?.commonMisconceptions.length || 0} Misconceptions Corrected
                  </span>
                </div>
              </div>
              <div style={{ padding: "12px 20px", borderTop: "1px solid #f1f5f9" }}>
                {digest ? (
                  <button onClick={() => onSelect(p)} style={{ background: "#0f172a", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", cursor: "pointer", fontSize: 13, fontWeight: 600, width: "100%" }}>
                    Read Digest →
                  </button>
                ) : (
                  <span style={{ fontSize: 12, color: "#94a3b8" }}>Digest coming soon</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
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
  const [view, setView] = useState("policies");   // "policies" | "topics" | "digests"
  const [selected, setSelected] = useState(null);
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [selectedDigest, setSelectedDigest] = useState(null);
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

  if (selectedGuide) return <PolicyGuide policy={selectedGuide} onBack={() => setSelectedGuide(null)} />;
  if (selected) return <PolicyDetail policy={selected} onBack={() => setSelected(null)} />;
  if (selectedDigest) return <PolicyDigestDetail policy={selectedDigest} onBack={() => setSelectedDigest(null)} />;

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
              { id: "digests",  label: "📖 Policy Digests" },
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

      {view === "digests" ? (
        <PolicyDigestGrid policies={POLICIES} onSelect={pol => setSelectedDigest(pol)} />
      ) : view === "topics" ? (
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

                    <div style={{ padding: "12px 20px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>{p.clauses.length} clauses with pillar, bias & gender detail</span>
                      <div style={{ display: "flex", gap: 8 }}>
                        {IMPLEMENTATION_GUIDES[p.id] && (
                          <button onClick={() => setSelectedGuide(p)} style={{ background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                            Client Discovery →
                          </button>
                        )}
                        <button onClick={() => setSelected(p)} style={{ background: "#0f172a", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                          View Detail →
                        </button>
                      </div>
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
