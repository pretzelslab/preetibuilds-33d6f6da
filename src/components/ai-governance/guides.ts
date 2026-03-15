// ─── IMPLEMENTATION GUIDES ────────────────────────────────────────────────────
// Each guide is keyed by policy ID and contains discovery areas with questions,
// pillar mappings, stakeholder assignments, and maturity indicators.

export type MaturityIndicators = {
  notStarted: string;
  developing: string;
  defined: string;
  optimised: string;
};

export type GuideArea = {
  area: string;
  pillar: string;
  stakeholder: string;
  regulatoryRef?: string;
  priority?: "High" | "Medium" | "Low";
  effort?: "High" | "Medium" | "Low";
  riskIfNotAddressed?: string;
  dependencies?: string[];
  evidenceToCollect: string[];
  maturityIndicators: MaturityIndicators;
  questions: string[];
};

export type ComplianceDeadline = {
  date: string;
  requirement: string;
};

export type ImplementationGuide = {
  intro: string;
  complianceDeadlines?: ComplianceDeadline[];
  areas: GuideArea[];
};

export const IMPLEMENTATION_GUIDES: Record<string, ImplementationGuide> = {
  "eu-ai-act": {
    intro: "The EU AI Act is the world's first comprehensive AI regulation. This implementation guide maps discovery areas to the four governance pillars and provides structured questions for assessing organisational readiness across all mandatory requirements.",
    complianceDeadlines: [
      { date: "Feb 2025", requirement: "Prohibited AI practices — ban takes effect" },
      { date: "Aug 2025", requirement: "GPAI model obligations — transparency & copyright compliance" },
      { date: "Aug 2026", requirement: "Full high-risk AI system obligations — conformity assessments, registration, technical documentation" },
      { date: "Aug 2027", requirement: "Obligations for high-risk AI embedded in regulated products (Annex I)" },
    ],
    areas: [
      {
        area: "AI System Inventory & Risk Classification",
        pillar: "Governance",
        stakeholder: "CTO / Chief AI Officer",
        regulatoryRef: "EU AI Act — Title III, Art. 6–7",
        priority: "High",
        effort: "Medium",
        riskIfNotAddressed: "Non-compliance with mandatory registration and risk classification requirements; potential fines up to €35M or 7% global turnover",
        dependencies: [],
        evidenceToCollect: ["AI system inventory / register", "Risk classification methodology", "System architecture documentation"],
        maturityIndicators: {
          notStarted: "No inventory of AI systems exists; risk levels not assessed",
          developing: "Partial inventory started; some systems classified informally",
          defined: "Complete inventory with documented risk classifications for all AI systems",
          optimised: "Automated inventory management with continuous risk re-assessment triggers",
        },
        questions: [
          "Do you maintain a comprehensive inventory of all AI systems deployed or in development across the organisation?",
          "Have you classified each AI system according to the EU AI Act's risk categories (Unacceptable, High-Risk, Limited, Minimal)?",
          "Is there a documented methodology for determining the risk classification of new AI systems before deployment?",
          "Are AI systems used in any of the high-risk areas defined under Annex III (e.g., biometric identification, critical infrastructure, employment, credit scoring)?",
          "Do you have a process to re-assess risk classification when AI systems are significantly modified?",
          "Is there a designated owner for each AI system responsible for compliance and risk management?",
        ],
      },
      {
        area: "Governance & Accountability Framework",
        pillar: "Governance",
        stakeholder: "Chief Compliance Officer / DPO",
        regulatoryRef: "EU AI Act — Title III, Art. 9, 17",
        priority: "High",
        effort: "High",
        riskIfNotAddressed: "Lack of clear accountability chains; regulatory exposure for non-compliance; inability to demonstrate responsible AI governance to regulators",
        dependencies: ["AI System Inventory & Risk Classification"],
        evidenceToCollect: ["Board-approved AI risk policy", "AI governance charter", "RACI matrix for AI oversight"],
        maturityIndicators: {
          notStarted: "No AI governance framework or accountability structure in place",
          developing: "Informal governance; some roles identified but not formalised",
          defined: "Formal governance framework with clear roles, responsibilities, and reporting lines",
          optimised: "Governance embedded in organisational culture with regular board-level AI risk reviews",
        },
        questions: [
          "Is there a board-approved AI governance policy or charter that defines the organisation's approach to responsible AI?",
          "Have you established an AI governance committee or designated senior leadership accountability for AI oversight?",
          "Are roles and responsibilities (RACI) clearly defined for AI system development, deployment, monitoring, and decommissioning?",
          "Is there a documented escalation path for AI-related risks, incidents, or ethical concerns?",
          "Do you conduct regular governance reviews to assess whether AI systems remain compliant with internal policies and external regulations?",
        ],
      },
      {
        area: "Training Data & Data Governance",
        pillar: "Ethics",
        stakeholder: "Chief Data Officer / Head of Data Engineering",
        regulatoryRef: "EU AI Act — Title III, Art. 10",
        priority: "High",
        effort: "High",
        riskIfNotAddressed: "Biased or unrepresentative training data leading to discriminatory outcomes; failure to meet Art. 10 data quality requirements",
        dependencies: ["AI System Inventory & Risk Classification"],
        evidenceToCollect: ["Training data documentation / datasheets", "Bias examination reports", "Data quality assessment records"],
        maturityIndicators: {
          notStarted: "No documentation of training data sources, quality, or representativeness",
          developing: "Some data documentation exists; bias checks performed ad hoc",
          defined: "Comprehensive datasheets for all high-risk AI systems; systematic bias testing",
          optimised: "Automated data quality pipelines with continuous bias monitoring and alerting",
        },
        questions: [
          "Do you maintain datasheets or data cards documenting the provenance, composition, and characteristics of training datasets?",
          "Have you assessed training datasets for potential biases related to protected characteristics (gender, ethnicity, age, disability)?",
          "Are there documented processes for data quality assurance, including accuracy, completeness, and relevance checks?",
          "Do you have procedures to ensure training data is representative of the populations on which the AI system will operate?",
          "Is there a process for identifying and mitigating data gaps that could lead to discriminatory outcomes?",
          "How do you ensure compliance with GDPR and data minimisation principles when collecting and processing training data?",
        ],
      },
      {
        area: "Transparency & Explainability",
        pillar: "Ethics",
        stakeholder: "Product Lead / UX Lead",
        regulatoryRef: "EU AI Act — Title III, Art. 13; Title IV, Art. 52",
        priority: "High",
        effort: "Medium",
        riskIfNotAddressed: "Users unable to understand or challenge AI decisions; breach of transparency obligations under Art. 13 and Art. 52",
        dependencies: [],
        evidenceToCollect: ["User-facing AI disclosure notices", "Technical documentation on explainability methods", "Instructions for use"],
        maturityIndicators: {
          notStarted: "No transparency measures; users unaware they are interacting with AI",
          developing: "Basic disclosures in place for some systems; no explainability framework",
          defined: "Comprehensive transparency notices and explainability documentation for all high-risk systems",
          optimised: "Real-time explainability dashboards; proactive user communication about AI decision factors",
        },
        questions: [
          "Do you provide clear disclosures to users when they are interacting with an AI system (chatbots, automated decisions, etc.)?",
          "Are there documented explanations of how high-risk AI systems reach decisions or recommendations?",
          "Can affected individuals request a meaningful explanation of AI-driven decisions that significantly impact them?",
          "Have you prepared 'instructions for use' documentation as required under Art. 13 for high-risk AI systems?",
          "Do you differentiate transparency requirements based on the risk level of the AI system?",
        ],
      },
      {
        area: "Human Oversight & Override",
        pillar: "Risk",
        stakeholder: "Operations Lead / Process Owner",
        regulatoryRef: "EU AI Act — Title III, Art. 14",
        priority: "High",
        effort: "Medium",
        riskIfNotAddressed: "Fully autonomous high-risk AI decisions without human review; breach of Art. 14 human oversight requirements",
        dependencies: ["Governance & Accountability Framework"],
        evidenceToCollect: ["Human oversight procedures", "Audit logs / override records", "Escalation protocols"],
        maturityIndicators: {
          notStarted: "No human oversight mechanisms; AI decisions are fully autonomous",
          developing: "Some manual review processes exist but are inconsistent or undocumented",
          defined: "Formal human-in-the-loop or human-on-the-loop controls for all high-risk systems with documented override procedures",
          optimised: "Adaptive oversight levels based on confidence scores; comprehensive audit trails with regular effectiveness reviews",
        },
        questions: [
          "Do high-risk AI systems have documented human oversight mechanisms (human-in-the-loop, human-on-the-loop, or human-in-command)?",
          "Can human operators effectively override, intervene in, or reverse AI system decisions?",
          "Are there defined criteria for when human review is mandatory vs. optional?",
          "Do you maintain audit logs of human oversight actions, including overrides and escalations?",
          "Have operators received adequate training to understand AI system outputs and exercise effective oversight?",
        ],
      },
      {
        area: "Risk Management & Impact Assessment",
        pillar: "Risk",
        stakeholder: "CRO / Head of Risk",
        regulatoryRef: "EU AI Act — Title III, Art. 9; Art. 27 (FRIA)",
        priority: "High",
        effort: "High",
        riskIfNotAddressed: "Unidentified or unmitigated AI risks; failure to conduct mandatory Fundamental Rights Impact Assessments (FRIAs)",
        dependencies: ["AI System Inventory & Risk Classification", "Training Data & Data Governance"],
        evidenceToCollect: ["FRIA / AIIA documents", "Risk assessment reports", "Risk treatment plans"],
        maturityIndicators: {
          notStarted: "No AI-specific risk management processes; no impact assessments conducted",
          developing: "Ad hoc risk assessments for some systems; no systematic FRIA process",
          defined: "Structured risk management framework with FRIAs for all high-risk systems; documented risk treatment plans",
          optimised: "Continuous risk monitoring with automated risk indicators and regular reassessment cycles",
        },
        questions: [
          "Have you conducted Fundamental Rights Impact Assessments (FRIAs) for high-risk AI systems as required under Art. 27?",
          "Is there a documented AI risk management framework covering identification, assessment, mitigation, and monitoring?",
          "Do you assess both direct and indirect risks of AI systems, including risks to fundamental rights, safety, and the environment?",
          "Are risk mitigation measures documented, implemented, and regularly tested for effectiveness?",
          "How do you monitor for emerging risks as AI systems operate in production and encounter new data or scenarios?",
          "Do you have incident response procedures specifically for AI system failures or harmful outputs?",
        ],
      },
      {
        area: "Conformity Assessment & Technical Documentation",
        pillar: "Governance",
        stakeholder: "Head of Quality / Compliance Lead",
        regulatoryRef: "EU AI Act — Title III, Art. 11, 43; Annex IV",
        priority: "Medium",
        effort: "High",
        riskIfNotAddressed: "Inability to demonstrate compliance during regulatory audits; blocked market access for high-risk AI systems",
        dependencies: ["AI System Inventory & Risk Classification", "Governance & Accountability Framework"],
        evidenceToCollect: ["Conformity assessment reports", "Technical documentation per Annex IV", "CE marking records"],
        maturityIndicators: {
          notStarted: "No technical documentation or conformity assessment processes",
          developing: "Partial documentation exists; conformity assessment not yet initiated",
          defined: "Complete technical documentation per Annex IV; conformity assessments completed for all high-risk systems",
          optimised: "Automated documentation generation; continuous conformity monitoring with proactive updates",
        },
        questions: [
          "Have you prepared technical documentation as specified in Annex IV for all high-risk AI systems?",
          "Have conformity assessments been completed for high-risk AI systems before market placement?",
          "Do you have processes to update technical documentation when systems are substantially modified?",
          "Is there a clear understanding of whether self-assessment or third-party conformity assessment is required for each system?",
          "Are CE marking and EU declaration of conformity requirements understood and addressed?",
        ],
      },
      {
        area: "Post-Market Monitoring & Incident Reporting",
        pillar: "Risk",
        stakeholder: "Head of Operations / CISO",
        regulatoryRef: "EU AI Act — Title III, Art. 72; Title IX, Art. 62",
        priority: "Medium",
        effort: "Medium",
        riskIfNotAddressed: "Failure to detect system degradation or harmful outcomes post-deployment; non-compliance with mandatory incident reporting",
        dependencies: ["Human Oversight & Override", "Risk Management & Impact Assessment"],
        evidenceToCollect: ["Post-market monitoring plan", "Incident response procedures", "Performance monitoring dashboards"],
        maturityIndicators: {
          notStarted: "No post-market monitoring; no incident reporting procedures",
          developing: "Basic monitoring in place; incident reporting ad hoc",
          defined: "Structured post-market monitoring plan with defined KPIs and mandatory incident reporting procedures",
          optimised: "Real-time performance monitoring with automated anomaly detection and regulatory reporting integration",
        },
        questions: [
          "Do you have a post-market monitoring system to continuously assess AI system performance and compliance after deployment?",
          "Are there defined KPIs and thresholds for AI system performance, accuracy, and fairness in production?",
          "Do you have procedures for mandatory reporting of serious incidents to national supervisory authorities?",
          "How do you handle AI system malfunctions, unexpected outputs, or safety-related incidents?",
          "Is there a process to incorporate post-market findings into system improvements and risk reassessments?",
        ],
      },
      {
        area: "Bias, Fairness & Gender Impact Analysis",
        pillar: "Ethics",
        stakeholder: "D&I Lead / Ethics Committee",
        regulatoryRef: "EU AI Act — Recitals 44, 70; Art. 10(2)(f)",
        priority: "High",
        effort: "Medium",
        riskIfNotAddressed: "Discriminatory AI outcomes causing reputational damage, legal liability, and harm to affected individuals",
        dependencies: ["Training Data & Data Governance"],
        evidenceToCollect: ["Bias audit reports", "Fairness metrics documentation", "Gender impact assessment records"],
        maturityIndicators: {
          notStarted: "No bias testing or fairness evaluation conducted",
          developing: "Some bias checks performed; no systematic fairness framework",
          defined: "Comprehensive bias audits with documented fairness metrics across protected characteristics",
          optimised: "Continuous fairness monitoring with automated bias detection and remediation workflows",
        },
        questions: [
          "Do you conduct systematic bias audits across protected characteristics (gender, ethnicity, age, disability) for all high-risk AI systems?",
          "Have you defined and documented fairness metrics appropriate for each AI system's use case and affected populations?",
          "Is there a specific gender impact analysis process to assess differential impacts on women and gender minorities?",
          "Do you test for intersectional bias (e.g., compounded effects of gender + ethnicity + age)?",
          "Are bias audit results regularly reviewed by senior leadership and used to drive remediation actions?",
          "How do you ensure that bias mitigation measures do not introduce new forms of unfairness?",
        ],
      },
      {
        area: "Internal Audit & Continuous Improvement",
        pillar: "Governance",
        stakeholder: "CAE / Head of Internal Audit",
        regulatoryRef: "EU AI Act — Art. 17 (Quality Management System)",
        priority: "Medium",
        effort: "Medium",
        riskIfNotAddressed: "No independent assurance of AI compliance; systemic issues remain undetected until regulatory intervention",
        dependencies: ["Governance & Accountability Framework", "Conformity Assessment & Technical Documentation"],
        evidenceToCollect: ["Internal audit AI charter", "Audit findings and remediation tracker", "Continuous improvement records"],
        maturityIndicators: {
          notStarted: "No internal audit coverage of AI systems or governance",
          developing: "AI included in audit universe; no dedicated AI audit methodology",
          defined: "Dedicated AI audit programme with defined methodology, regular cycles, and tracked remediation",
          optimised: "Continuous audit approach with automated compliance checks and maturity benchmarking",
        },
        questions: [
          "Is AI governance included in the internal audit universe and audit plan?",
          "Do you have an AI-specific audit methodology that covers technical, ethical, and regulatory dimensions?",
          "Are audit findings tracked to remediation with clear owners and target dates?",
          "Do you benchmark your AI governance maturity against industry standards and peer organisations?",
          "Is there a continuous improvement process that feeds audit findings, incident learnings, and regulatory updates back into policies and procedures?",
        ],
      },
    ],
  },
};
