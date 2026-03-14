// ─── POLICY DIGESTS ──────────────────────────────────────────────────────────
// Plain-English summaries for each policy — designed for reading, not compliance.

export type CriticalPoint = {
  heading: string;
  text: string;
  critical: boolean;      // true = red/bold highlight
};

export type Misconception = {
  myth: string;
  truth: string;
};

export type PolicyDigestData = {
  tldr: string;
  criticalPoints: CriticalPoint[];
  keyObligations: string[];
  whoNeedsToAct: string[];
  commonMisconceptions: Misconception[];
  practicalTip: string;
};

export const POLICY_DIGESTS: Record<string, PolicyDigestData> = {

  "eu-ai-act": {
    tldr: "The EU AI Act is the world's first comprehensive, binding law on artificial intelligence. It applies to any organisation that develops, deploys, or imports AI into the EU — regardless of where the organisation is headquartered. The law classifies AI systems by risk level, imposes mandatory conformity assessments for high-risk applications, and outright bans a small number of practices. Think of it as GDPR, but for AI — with heavier penalties and a multi-year phase-in.",

    criticalPoints: [
      {
        heading: "Extra-territorial reach",
        text: "The law applies to you even if your organisation is based outside the EU. If your AI system produces outputs used by EU residents — a US lender's credit-scoring model, a UK HR platform processing EU employees — you are in scope and subject to the same obligations as an EU company.",
        critical: true,
      },
      {
        heading: "Four risk tiers, four different obligation levels",
        text: "Unacceptable risk (banned outright) → High risk (full conformity assessment + registration) → Limited risk (transparency disclosure only) → Minimal risk (no obligations). Your first task is to correctly classify every AI system you operate — the tier determines your entire compliance burden.",
        critical: true,
      },
      {
        heading: "High-risk is broader than most organisations expect",
        text: "High-risk AI includes: credit scoring, employment screening, biometric identification, student assessment, critical infrastructure management, law enforcement tools, and essential services access. If you are in Fintech, Healthtech, HR Tech, or Insurtech, it is very likely you operate at least one high-risk AI system.",
        critical: true,
      },
      {
        heading: "August 2026 is the hard deadline for most organisations",
        text: "Prohibited AI bans and GPAI model obligations apply from August 2025. Full high-risk AI system obligations — conformity assessments, technical documentation, human oversight, registration — apply from August 2026. There is no grace period after these dates.",
        critical: true,
      },
      {
        heading: "General-Purpose AI (GPAI) models have their own obligations",
        text: "If your organisation uses or provides large language models or other GPAI systems, additional requirements apply from August 2025: transparency documentation, copyright compliance, and (for systemic-risk models) adversarial testing and incident reporting to the EU AI Office.",
        critical: false,
      },
      {
        heading: "Fines are the highest of any AI regulation globally",
        text: "Prohibited use violations: up to €35M or 7% of global annual turnover (whichever is higher). High-risk non-compliance: up to €15M or 3%. Misleading regulators: up to €7.5M or 1%. These are company-wide turnover figures — not just EU revenue.",
        critical: true,
      },
    ],

    keyObligations: [
      "Conduct a complete AI system inventory and assign risk classification to every system",
      "Immediately cease any AI uses that fall into Article 5 prohibited categories",
      "Complete conformity assessments for all high-risk AI systems before August 2026",
      "Register high-risk AI systems in the EU AI public database before deployment",
      "Implement human oversight and override controls on all high-risk AI",
      "Conduct Fundamental Rights Impact Assessments (FRIA) for high-risk AI in public-sector or sensitive contexts",
      "Conduct bias examinations on training data used for high-risk AI systems",
      "Document technical specifications, training data lineage, and testing results",
    ],

    whoNeedsToAct: ["Legal / Compliance", "CTO / Head of Product", "Data Science / ML", "HR (AI in hiring)", "Risk & Internal Audit", "DPO / Privacy"],

    commonMisconceptions: [
      {
        myth: "We're based outside the EU, so it doesn't apply to us.",
        truth: "Extra-territorial reach is explicit. If your AI outputs are used by EU residents or your AI system is placed on the EU market, you are fully in scope — regardless of where your company is incorporated.",
      },
      {
        myth: "Only AI companies building models need to worry about this.",
        truth: "Deployers — organisations that use AI built by others in their products or operations — carry their own distinct obligations, particularly for high-risk systems. Buying AI from a third party does not transfer your liability.",
      },
      {
        myth: "We can wait until 2027 for full compliance.",
        truth: "Prohibited practice bans and GPAI obligations apply from August 2025. High-risk system obligations apply August 2026. Waiting risks enforcement action during the compliance window.",
      },
      {
        myth: "Our AI is 'Limited risk' so we have almost nothing to do.",
        truth: "Limited-risk AI still requires transparency disclosures (users must be told they're interacting with AI). Misclassifying a high-risk system as limited risk is a significant enforcement risk in itself.",
      },
    ],

    practicalTip: "Start with your AI inventory — you cannot classify, assess, or comply with anything until you know what AI systems you operate. Build the register first, assign risk tiers, then sequence your compliance work by deadline. Prioritise any systems that look high-risk, as these carry the longest lead time for conformity assessment.",
  },

  "nist-ai-rmf": {
    tldr: "The NIST AI Risk Management Framework is a voluntary but authoritative US framework that provides a structured approach to identifying, assessing, and managing AI risks across four functions: GOVERN, MAP, MEASURE, and MANAGE. While not legally binding, it is increasingly referenced by US federal regulators, sector agencies (OCC, SEC, HHS), and forms the AI risk baseline for many multinational organisations. Its 2024 GenAI supplement (AI 600-1) adds specific guidance for large language models and generative AI.",

    criticalPoints: [
      {
        heading: "Voluntary — but effectively required in regulated US sectors",
        text: "The RMF is voluntary at the federal framework level, but the OCC, SEC, CFPB, and HHS all reference NIST RMF alignment in their AI supervisory guidance. If you are a US bank, investment firm, or healthcare organisation, regulators will expect to see RMF-aligned controls.",
        critical: true,
      },
      {
        heading: "GOVERN is the non-negotiable starting point",
        text: "The GOVERN function is the foundation: without a board-approved AI risk policy, named executive ownership, and defined accountability, the other three functions (Map, Measure, Manage) cannot operate. Organisations that skip GOVERN and build controls first are building on an unanchored foundation.",
        critical: true,
      },
      {
        heading: "AI 600-1 adds GenAI-specific requirements (2024)",
        text: "NIST's GenAI supplement explicitly addresses: hallucination and confabulation risk, data provenance and training data transparency, human-AI configuration, and homogeneity risk from widespread use of identical models. Any organisation using LLMs should apply 600-1 in addition to the core RMF.",
        critical: true,
      },
      {
        heading: "Outcome-focused, not prescriptive",
        text: "The RMF defines what outcomes you need to achieve, not the specific controls to achieve them. This gives flexibility but requires your team to define the specific measures, tools, and processes that meet each outcome — and document why they are appropriate for your context.",
        critical: false,
      },
      {
        heading: "AI transparency is a core, non-negotiable value",
        text: "The RMF requires organisations to be able to explain AI decisions to affected parties, document the basis for risk management decisions, and communicate openly about AI limitations. Unexplainable AI is incompatible with the framework's core principles.",
        critical: false,
      },
    ],

    keyObligations: [
      "Establish a board-approved AI risk policy with explicit risk appetite",
      "Designate a named executive accountable for AI risk management",
      "Map all AI systems to affected populations and document potential harms",
      "Implement fairness metrics and bias monitoring for AI systems in production",
      "Establish AI incident response procedures aligned with the MANAGE function",
      "Apply NIST AI 600-1 guidance to all generative AI systems in use",
      "Document risk treatment decisions and maintain an AI risk register",
    ],

    whoNeedsToAct: ["Board / CRO", "Chief AI Officer / CTO", "Product / Data Science", "Risk & Compliance", "Internal Audit", "Operations"],

    commonMisconceptions: [
      {
        myth: "It's voluntary, so we can skip it.",
        truth: "US sector regulators are increasingly treating RMF alignment as an expectation during examination, not a choice. Non-aligned organisations face supervisory scrutiny without a structured defence.",
      },
      {
        myth: "We've done ISO 27001, so RMF is covered.",
        truth: "ISO 27001 covers information security. NIST AI RMF covers AI-specific risks — bias, explainability, fairness, AI supply chain risk — which are categorically different and not addressed by information security frameworks.",
      },
      {
        myth: "The RMF is too abstract to be practical.",
        truth: "The RMF Playbook (nist.gov) provides specific actions and suggested practices for each sub-category. Combined with AI 600-1, it is highly actionable with the right facilitation.",
      },
    ],

    practicalTip: "Use the GOVERN function as your maturity assessment: if you cannot articulate your AI risk appetite, name the executive accountable for AI risk, and show board-level AI risk reporting, start there before investing in technical measurement tools. Governance unlocks everything else.",
  },

  "nist-csf": {
    tldr: "NIST Cybersecurity Framework 2.0 explicitly expanded its scope to include AI as a distinct security risk domain, adding GOVERN as a new core function alongside Identify, Protect, Detect, Respond, and Recover. For AI-using organisations, CSF 2.0 addresses the cybersecurity angles of AI risk: protecting training data and models, detecting adversarial attacks, managing AI supply chain risk, and recovering from AI-specific security incidents.",

    criticalPoints: [
      {
        heading: "AI introduces attack surfaces that traditional security frameworks miss",
        text: "Prompt injection, model inversion attacks, training data poisoning, adversarial examples, and model extraction are AI-specific threats that do not appear in traditional vulnerability frameworks. Standard penetration testing and SIEM tools will not detect these without AI-specific extensions.",
        critical: true,
      },
      {
        heading: "The new GOVERN function requires AI to be in your security strategy",
        text: "CSF 2.0's GOVERN function explicitly requires AI security risks to be addressed in the organisation's overall cybersecurity risk strategy — not siloed in a data science or ML team. Board-level visibility of AI security risk is now an expected norm.",
        critical: true,
      },
      {
        heading: "Third-party AI is a supply chain risk you inherit",
        text: "When you deploy a model sourced from a third party — an API, a fine-tuned model, an AI-powered SaaS tool — you inherit the security risks embedded in that model and its training pipeline. CSF 2.0's supply chain function (ID.SC) applies directly to AI vendors and model providers.",
        critical: true,
      },
      {
        heading: "US Executive Order 14110 creates federal pressure for CSF 2.0 alignment",
        text: "Executive Order 14110 on AI safety and security directs federal agencies to adopt NIST AI security standards. Federal contractors and agencies serving the US government face pressure to demonstrate CSF 2.0 and NIST AI RMF alignment as a condition of contract.",
        critical: false,
      },
      {
        heading: "AI incident response requires new playbooks",
        text: "A model producing biased outputs, a prompt injection attack exfiltrating data, or a poisoned training dataset are AI incidents requiring specific response procedures. Standard breach response plans do not cover these scenarios and must be updated.",
        critical: false,
      },
    ],

    keyObligations: [
      "Include AI security explicitly in the organisation's cybersecurity risk strategy (GOVERN)",
      "Build an AI asset inventory covering all models, datasets, and AI services in use",
      "Assess AI supply chain risk for all third-party AI vendors and model providers",
      "Implement training data and model integrity controls (access control, version control, monitoring)",
      "Extend detection capabilities to cover AI-specific attacks (prompt injection, adversarial inputs)",
      "Update incident response playbooks to include AI-specific incident types",
    ],

    whoNeedsToAct: ["CISO / Security", "CTO / Engineering", "ML / Data Science", "Procurement / Vendor Management", "Risk & Compliance", "Internal Audit"],

    commonMisconceptions: [
      {
        myth: "Our existing cybersecurity controls cover AI risk.",
        truth: "Traditional controls address known vulnerability classes. AI-specific threats — adversarial examples, model inversion, data poisoning — require dedicated detection and response capabilities that standard security tooling does not provide.",
      },
      {
        myth: "AI security is just about protecting the model weights.",
        truth: "AI security encompasses: training data integrity, inference-time attacks, supply chain risks, output manipulation, and API security. Protecting model weights is one small part of a much broader attack surface.",
      },
      {
        myth: "CSF 2.0 only applies to US organisations.",
        truth: "CSF 2.0 is widely adopted globally as a cybersecurity baseline. Non-US organisations using it as a framework for AI security benefit from its AI-specific expansions regardless of geographic scope.",
      },
    ],

    practicalTip: "The fastest win is AI asset discovery: list every AI model, API, or AI-powered tool in use across the organisation. Most organisations discover AI use cases in business units that IT and Security have no visibility over. That shadow AI is your biggest unmanaged risk — find it before an attacker does.",
  },

  "iso-42001": {
    tldr: "ISO 42001 is the first internationally certified standard for an AI Management System (AIMS) — equivalent in structure to ISO 27001 for information security or ISO 9001 for quality management. It allows organisations to pursue third-party certification demonstrating that their AI governance processes meet an independently audited international standard. Published in December 2023, it is already being adopted by AI providers, enterprise software companies, and regulated organisations seeking to differentiate on responsible AI.",

    criticalPoints: [
      {
        heading: "This produces a certificate — unlike most AI frameworks",
        text: "ISO 42001 certification is issued by accredited certification bodies after a formal audit. This gives organisations a verifiable, client-facing credential that demonstrates AI governance maturity — something no other major AI framework currently provides. It is already being asked for in enterprise procurement RFPs.",
        critical: true,
      },
      {
        heading: "Leadership clause (Clause 5) is the most common audit failure",
        text: "Clause 5 requires the board or top management to formally approve the AI policy, assign AI management responsibilities, and demonstrate commitment to the AIMS. If this is not documented with evidence — board minutes, signed policy, published accountability — the system has a major nonconformity before the audit even covers technical controls.",
        critical: true,
      },
      {
        heading: "AI System Impact Assessments are mandatory for every AI system",
        text: "Clause 8 requires an AI System Impact Assessment (AIIA) — distinct from GDPR's DPIA — for each AI system before deployment. This documents the system's intended purpose, technical characteristics, potential impacts on individuals and society, and the controls in place. Skipping or retrospectively completing AIIAs is one of the most common compliance gaps.",
        critical: true,
      },
      {
        heading: "It integrates cleanly with ISO 27001 and ISO 9001",
        text: "ISO 42001 uses the Annex SL common framework structure shared by ISO 27001, 9001, and 14001. Organisations already certified to these standards can extend their management system to cover AI without building a parallel programme from scratch.",
        critical: false,
      },
      {
        heading: "Bias, fairness, and human rights are explicitly required",
        text: "Annex B of ISO 42001 lists AI system objectives that explicitly include non-discrimination, fairness, and respect for human rights. These are not optional annexes — they are part of the normative framework that auditors will test against.",
        critical: true,
      },
    ],

    keyObligations: [
      "Obtain formal board approval of an AI policy covering objectives, scope, and accountability (Clause 5)",
      "Conduct a documented AI risk assessment for each AI system in scope (Clause 6)",
      "Complete an AI System Impact Assessment (AIIA) for every AI system before deployment (Clause 8)",
      "Establish operational controls covering the full AI system lifecycle",
      "Conduct internal audits of the AIMS at planned intervals (Clause 9)",
      "Hold management reviews of AIMS performance and take corrective actions (Clause 10)",
    ],

    whoNeedsToAct: ["Board / CEO", "CTO / Head of Product", "Data Science / ML", "Legal / Compliance", "Internal Audit", "DPO / Privacy"],

    commonMisconceptions: [
      {
        myth: "ISO 42001 certification is only for AI product companies.",
        truth: "Any organisation that uses AI in its products, services, or operations can certify. Early adopters include financial services firms, HR technology companies, and public sector organisations using AI for decision support.",
      },
      {
        myth: "If we're ISO 27001 certified, we're most of the way there.",
        truth: "ISO 27001 covers information security. ISO 42001 covers AI-specific risks that 27001 does not address: bias, explainability, fairness, AI impact assessment, and AI system lifecycle governance. Significant new work is required even for 27001-certified organisations.",
      },
      {
        myth: "The standard is too new to matter.",
        truth: "ISO 42001 is already appearing in enterprise procurement questionnaires, regulatory consultations, and insurance underwriting criteria. Early certification provides a meaningful competitive and regulatory advantage.",
      },
    ],

    practicalTip: "The gap most organisations underestimate is the AI System Impact Assessment (AIIA). Unlike a DPIA which focuses on personal data, the AIIA requires you to document societal impacts, model performance characteristics, and bias risk for every AI system. Start building AIIA templates and completing them for your top 5 AI systems — this alone will surface the majority of your compliance gaps.",
  },

  "fair": {
    tldr: "FAIR (Factor Analysis of Information Risk) is a quantitative risk methodology that allows organisations to express AI risks in financial terms — expected annual loss ranges, not red/amber/green heat maps. Applied to AI governance, FAIR is used to prioritise which AI risks justify investment, determine appropriate insurance coverage, and give boards a credible financial language for AI risk reporting. It is not a compliance framework — it is an analytical tool that makes compliance decisions financially defensible.",

    criticalPoints: [
      {
        heading: "FAIR produces financial output — not qualitative risk ratings",
        text: "Instead of classifying a risk as 'High', FAIR outputs 'Expected Annual Loss of $1.2M–$4.8M, with a 10% probability of a single event exceeding $15M'. This is the language boards and CFOs understand, and it directly drives budget allocation for AI risk mitigation.",
        critical: true,
      },
      {
        heading: "You cannot use FAIR without a consistent risk taxonomy first",
        text: "FAIR requires agreed definitions of threat communities, loss event types (productivity, response, replacement, competitive, judgement, reputation), and vulnerability categories. Without this taxonomy established across your AI risk programme, different teams will produce incomparable, inconsistent models.",
        critical: true,
      },
      {
        heading: "FAIR is a complement to governance frameworks, not a replacement",
        text: "FAIR quantifies the risks that NIST RMF, ISO 42001, or EU AI Act compliance obligations surface. It answers 'how much should we invest in this control?' — a question that governance frameworks do not answer. The two approaches are designed to work together.",
        critical: false,
      },
      {
        heading: "Increasingly used to set board-level AI risk appetite",
        text: "Financial services organisations with mature AI risk programmes use FAIR outputs to express risk appetite in monetary terms: 'Our board has set a tolerance of no more than $5M expected annual loss from AI-related incidents.' This is a significant maturity step beyond qualitative risk appetite statements.",
        critical: false,
      },
      {
        heading: "Scenario quality determines model quality",
        text: "FAIR models are only as good as the scenarios they analyse. Poorly scoped scenarios — too broad, too narrow, or based on incorrect loss factors — produce misleading outputs. Experienced facilitation and calibration against industry loss data are essential for credible results.",
        critical: true,
      },
    ],

    keyObligations: [
      "Establish a shared AI risk taxonomy (threat communities, loss types, asset categories)",
      "Identify and scope 3–5 priority AI risk scenarios for quantification",
      "Build FAIR models for each scenario using calibrated estimates from subject matter experts",
      "Present financial risk outputs to board and risk committee in place of qualitative ratings",
      "Use FAIR outputs to prioritise AI risk treatment investments",
      "Calibrate models against industry loss data and internal incident history",
    ],

    whoNeedsToAct: ["CRO / Risk", "CISO", "CFO / Finance", "Board / Audit Committee", "Data Science / ML (as SMEs)", "Internal Audit"],

    commonMisconceptions: [
      {
        myth: "Our red/amber/green risk matrix already tells us what's important.",
        truth: "Qualitative risk matrices cannot distinguish between a risk with a 5% chance of $100K loss and one with a 0.5% chance of $10M loss — both might be rated 'High'. FAIR quantification reveals which actually requires more investment.",
      },
      {
        myth: "FAIR requires precise data to be useful.",
        truth: "FAIR uses ranges and calibrated estimation — not point estimates. Skilled analysts can produce defensible models using structured expert elicitation even when precise loss data is unavailable. A rough financial range is more useful than a qualitative label.",
      },
      {
        myth: "FAIR is only for cybersecurity risk.",
        truth: "FAIR's methodology applies to any risk domain with identifiable threat agents, assets, and loss types. It is increasingly applied to AI-specific risks: discriminatory model outputs, explainability failures, supply chain compromise, and regulatory enforcement.",
      },
    ],

    practicalTip: "Run your first FAIR scenario on a risk you already qualitatively believe is 'High' — an AI credit-scoring model, a hiring algorithm, or a fraud detection system. The process of building the model will reveal assumptions, disagreements about loss magnitude, and gaps in your risk data that qualitative approaches never surface. The output is secondary to the conversation it forces.",
  },

  "aaia": {
    tldr: "The AI Auditing Intelligence Framework (AAIA) provides internal audit functions with structured methodology to assess and provide independent assurance on AI systems. As AI is embedded into business-critical processes, traditional audit techniques are insufficient — AAIA equips audit teams with the domain knowledge, testing approaches, and reporting structures needed to audit algorithmic bias, training data quality, model governance, and AI risk programme effectiveness.",

    criticalPoints: [
      {
        heading: "Most internal audit functions are not currently AI-ready",
        text: "AAIA's starting premise is that traditional internal audit lacks the skills, methodologies, and tools to audit AI effectively. Without deliberate capability building — algorithmic testing tools, data science literacy, and structured AI audit methodology — internal audit cannot provide credible assurance on AI risk to the board.",
        critical: true,
      },
      {
        heading: "The audit charter must explicitly include AI to give audit a mandate",
        text: "If the internal audit charter does not name AI systems as an auditable risk domain, the audit function has no formal mandate to review AI. This means the board has no independent assurance on AI risk — a governance gap that regulators and audit committees are increasingly flagging.",
        critical: true,
      },
      {
        heading: "Algorithmic bias testing (Domain 3) requires new technical capabilities",
        text: "Auditing for algorithmic bias requires applying statistical fairness tests — demographic parity, equalised odds, individual fairness — against model outputs. This is not a capability most audit teams possess today. AAIA specifies the testing methodology; building the capability to execute it requires investment in training or co-sourcing with data science expertise.",
        critical: true,
      },
      {
        heading: "AAIA bridges technical and governance language",
        text: "One of AAIA's most practical contributions is providing translatable language that both audit/risk teams and AI/technical teams can use. Without this bridge, audit teams and ML engineers talk past each other — AAIA's domain structure and evidence requirements give both sides a common reference point.",
        critical: false,
      },
      {
        heading: "AI audit findings must reach the board, not just management",
        text: "AAIA's Domain 6–7 explicitly requires AI audit findings to be reported to the audit committee or board — not just circulated to technical management. If AI audit reports only go to the CTO, the board has no independent view of AI risk and cannot exercise proper oversight.",
        critical: false,
      },
    ],

    keyObligations: [
      "Update the internal audit charter to explicitly include AI systems as an auditable domain",
      "Develop a risk-based AI audit plan that prioritises high-impact and high-risk AI systems",
      "Acquire or develop capability to conduct algorithmic bias testing (Domain 3)",
      "Implement training data quality audit procedures (Domain 5)",
      "Establish AI audit reporting lines to audit committee or board (Domains 6–7)",
      "Build or buy tools for statistical fairness testing and model performance auditing",
    ],

    whoNeedsToAct: ["Chief Audit Executive", "Audit Committee / Board", "Internal Audit Team", "CRO / Risk", "Data Science / ML (as auditees)", "Legal / Compliance"],

    commonMisconceptions: [
      {
        myth: "Our existing IT audit covers AI systems.",
        truth: "IT audit covers systems controls, access management, and change management. AI audit covers model logic, training data bias, algorithmic fairness, and AI-specific governance — fundamentally different domains requiring different expertise and tools.",
      },
      {
        myth: "We need a data scientist in the audit team to audit AI.",
        truth: "AAIA is designed to enable audit generalists to audit AI with structure and tooling — it is not exclusive to data scientists. However, co-sourcing or secondment from data science for bias testing phases is a practical and recommended approach.",
      },
      {
        myth: "AI audit is too technical for the audit committee to care about.",
        truth: "Audit committees in regulated industries are increasingly receiving AI audit reporting as a board governance expectation. Regulators in financial services, healthcare, and public sector now expect independent AI assurance to reach board level.",
      },
    ],

    practicalTip: "Start with a charter amendment and a single high-priority AI audit — ideally a credit scoring model, hiring algorithm, or fraud detection system where bias risk is high and business impact is clear. This first audit will reveal your capability gaps, produce a concrete finding to report to the audit committee, and build the business case for investing in ongoing AI audit capability.",
  },
};
