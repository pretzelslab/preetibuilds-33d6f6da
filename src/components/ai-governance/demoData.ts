// ─── APEX LENDING GROUP — DEMO CLIENT DATA ───────────────────────────────────
// Realistic fictional test case for EU AI Act + ISO 42001 readiness assessment.
// Seeds localStorage with a fully populated client so users can explore the
// workbook without entering their own data.

export const DEMO_CLIENT_ID = "demo-apex-lending-001";
const DEMO_POLICY_ID = "eu-ai-act";

// ─── CLIENT PROFILE ───────────────────────────────────────────────────────────
export const DEMO_CLIENT = {
  id: DEMO_CLIENT_ID,
  name: "Apex Lending Group",
  countries: ["European Union (EU / EEA)", "United Kingdom"],
  industry: "Banking & Lending",
  geography: "HQ Dublin, Ireland · London UK operations",
  primaryAiUseCase: "Automated retail credit scoring — loan approval, rate tier assignment, credit limit setting",
  contactName: "Sarah Müller, Chief Risk Officer",
  engagementType: "Readiness Assessment",
  signOffStatus: "In Review",
  status: "active",
  createdAt: "2026-01-10",
  activePolicies: ["eu-ai-act", "iso-42001"],
  aboutClient: "Apex Lending Group is a mid-size digital lender operating across Ireland, Germany, and the United Kingdom. Founded in 2017, they originate approximately €2.1B in retail loans annually through a fully digital application journey.\n\nThe board commissioned this AI governance readiness assessment following EU AI Act enforcement dates being confirmed for August 2026. The CRO has been given a 6-month mandate to achieve compliance. They hold ISO 27001 certification (renewed 2024) but have no AI-specific governance programme in place.\n\nKey engagement context: the primary AI system (ApexScore v2.1) has been in production for 2.5 years with no formal FRIA, no human override capability for mid-range scores, and training data that contains known proxy variables for protected characteristics. These are the three critical gaps driving this engagement.",
  // AI System Profile
  aiSystemName: "ApexScore v2.1",
  aiTypes: ["Machine Learning"],
  systemDescription: "Gradient-boosted decision tree model (XGBoost) scoring retail loan applicants on a 0–1000 scale. Score determines loan approval/rejection, interest rate tier (A/B/C/D), and maximum credit limit. Deployed within the loan origination system. Applicants below 300 are auto-rejected; above 720 are auto-approved; 300–720 are reviewed by underwriters.",
  vendor: "Built In-House",
  modelOwnership: "Built In-House",
  decisionAuthority: "Human-on-the-Loop",
  deploymentStatus: "Production",
  timeInProduction: "2.5 years (since January 2023)",
  decisionsPerPeriod: "~4,000 loan decisions per day · ~1.4M per year",
  internalUsersAffected: "12 underwriters (edge-case review only, score bands <300 and >720)",
  externalUsersAffected: "~320,000 active loan applicants per year across IE, DE, and UK",
  trainingDataSource: "Apex historical loan book 2018–2022 + Experian IE bureau data feed",
  trainingDataPeriod: "2018–2022",
  lastRetrainingDate: "2024-09",
  // AIIA / Performance Metrics
  modelAccuracy: "AUC 0.91 · Accuracy 94.2% · Gini coefficient 0.81 · KS statistic 0.63",
  falsePositiveRate: "3.1% false approvals (approved applicants who subsequently default) · 4.7% false rejections (rejected applicants who would have repaid)",
  lastEvaluationDate: "2024-09-15",
  evaluationMethod: "Hold-out test set (20% of 2022 loan book, stratified split). Internal model risk team validation only — no independent third-party validation conducted. No fairness/bias evaluation included in assessment.",
  knownLimitations: "1. Training data (2018–2022) pre-dates open banking regulation — does not reflect current income volatility patterns.\n2. Model performance not disaggregated by protected characteristics (gender, ethnicity, age) — fairness metrics unknown.\n3. Bureau data contains proxy variables correlated with gender (career break flags, part-time employment history) — not remediated.\n4. No adversarial or red-team testing conducted.\n5. Underwriter overrides are not fed back into the retraining pipeline — feedback loop absent.\n6. Model has not been re-evaluated since September 2024 despite macroeconomic changes.",
  stakeholders: [
    { id: "s1", name: "Sarah Müller", role: "Chief Risk Officer", organisation: "Apex Lending Group", consulted: true, consultationDate: "2026-01-15", notes: "Engagement sponsor. Confirmed engagement scope, compliance deadline (Aug 2026), and board mandate. Provided access to data science and legal teams." },
    { id: "s2", name: "James O'Brien", role: "Head of Data Science", organisation: "Apex Lending Group", consulted: true, consultationDate: "2026-01-22", notes: "Provided model card, training data documentation, and performance metrics. Acknowledged proxy variable risk in bureau data but stated no budget allocated to address it." },
    { id: "s3", name: "Emma Byrne", role: "General Counsel", organisation: "Apex Lending Group", consulted: true, consultationDate: "2026-02-03", notes: "Confirmed no formal Annex III analysis completed. Confirmed no prohibited practices review conducted. Legal review of Article 5 scheduled for March 2026." },
    { id: "s4", name: "Liam Walsh", role: "Lead Underwriter", organisation: "Apex Lending Group", consulted: false, consultationDate: "", notes: "Consultation scheduled for Feb 2026. Key contact for human oversight and escalation process assessment." },
    { id: "s5", name: "Aoife Kelly", role: "Data Protection Officer", organisation: "Apex Lending Group", consulted: false, consultationDate: "", notes: "To be consulted on DPIA/FRIA intersection and data subject rights implications of automated credit decisions." },
  ],
};

// ─── PHASE 2 QUESTIONNAIRE DATA — EU AI ACT (6 AREAS × 4 QUESTIONS) ──────────
export const DEMO_AREA_STATES: Record<number, object> = {
  // Area 0: AI System Inventory & Risk Classification
  0: {
    summary: "Apex has an informal AI inventory but it is not audit-ready. Risk classification has not been formally conducted against Annex III criteria. This is the foundational gap — without formal classification, no downstream compliance work can be properly scoped.",
    lastUpdated: new Date().toISOString(),
    questions: {
      0: { status: "In Progress", owner: "CTO", dueDate: "2026-04-30", evidenceStatus: "Partial", evidenceRef: "AI_Systems_List_v2_DataScience.xlsx", currentState: "An informal list exists in a shared spreadsheet maintained by the data science team covering ApexScore v2.1 and 2 internal analytics tools. Three additional AI-assisted tools identified in the business are not listed.", gap: "Not a formal AI system register. Spreadsheet is not audited, version-controlled, or linked to change management. Incomplete coverage across all business units.", proposedAction: "Establish a formal AI System Register in the GRC system. Conduct a full AI inventory audit across all business units. Assign register ownership to the Chief Risk Officer." },
      1: { status: "Not Started", owner: "Legal", dueDate: "2026-04-30", evidenceStatus: "No", evidenceRef: "", currentState: "The data science team informally classifies ApexScore as 'high-risk' but this has not been formally documented, reviewed by legal, or linked to Annex III criteria.", gap: "No formal risk classification document. Annex III Section 5(b) analysis not completed. Credit scoring is explicitly listed but not formally acknowledged in writing with legal sign-off.", proposedAction: "Conduct formal Annex III analysis for all AI systems. Produce written risk classification determination signed by General Counsel." },
      2: { status: "Not Started", owner: "CTO", dueDate: "2026-05-31", evidenceStatus: "No", evidenceRef: "", currentState: "No formal process. New AI projects go through the IT change management process which has no AI-specific classification gate.", gap: "New AI systems could be developed and deployed without any risk classification. No pre-development governance checkpoint.", proposedAction: "Create an AI Governance Pre-Development Checklist including mandatory risk classification step before any new AI project commences." },
      3: { status: "Not Started", owner: "CRO", dueDate: "2026-03-31", evidenceStatus: "No", evidenceRef: "", currentState: "Informally owned by the Head of Data Science. No formal accountability assigned. RACI does not exist.", gap: "No designated AI governance role or accountability framework. No RACI for AI register maintenance.", proposedAction: "Formally designate AI Compliance Officer function under the CRO. Publish AI governance RACI. Review quarterly." },
    },
  },
  // Area 1: Prohibited AI Uses
  1: {
    summary: "No prohibited practices confirmed in current systems. However, the absence of a formal legal review means this relies on informal team knowledge rather than documented compliance. The review should be formalised before August 2026.",
    lastUpdated: new Date().toISOString(),
    questions: {
      0: { status: "Not Started", owner: "Legal", dueDate: "2026-03-31", evidenceStatus: "No", evidenceRef: "", currentState: "No formal review conducted. Legal team is aware of Article 5 but has not reviewed current systems against the prohibited practices list.", gap: "No documented legal review of current AI use cases against Article 5 prohibitions. Reliance on informal team knowledge only.", proposedAction: "Commission formal legal review of all AI use cases against Article 5. Document findings in writing. Obtain sign-off from General Counsel." },
      1: { status: "Complete", owner: "Legal", dueDate: "", evidenceStatus: "Yes", evidenceRef: "No_Biometric_ID_Confirmation_CTO_Legal_14Feb2026.eml", currentState: "Confirmed no biometric identification systems in use or planned. CTO provided written confirmation to Legal on 14 Feb 2026.", gap: "", proposedAction: "" },
      2: { status: "In Progress", owner: "Legal", dueDate: "2026-03-31", evidenceStatus: "Partial", evidenceRef: "LegalReview_CreditScoring_Draft_v1.docx", currentState: "Credit scoring for lending purposes. Legal team verbally confirmed this is not social scoring as defined in Art. 5(1)(c). Draft legal opinion in progress.", gap: "Legal review exists only in draft. Final signed opinion not yet produced and filed as compliance evidence.", proposedAction: "Finalise and file formal legal opinion on credit scoring vs social scoring distinction. Retain in compliance records." },
      3: { status: "Not Started", owner: "Legal", dueDate: "2026-04-30", evidenceStatus: "No", evidenceRef: "", currentState: "No specific pre-deployment legal gate for biometric or emotion recognition AI.", gap: "No formal pre-deployment legal review process. If Apex were to acquire or build a biometric capability there is no gate to catch it.", proposedAction: "Add mandatory legal sign-off to the AI development gate for any biometric, emotion recognition, or other Article 5-adjacent AI capability." },
    },
  },
  // Area 2: High-Risk AI Conformity Assessment
  2: {
    summary: "ApexScore v2.1 almost certainly falls under Annex III Section 5(b) as a credit scoring system. No conformity assessment has been conducted or planned. The model card exists but does not meet Annex IV requirements. This is a critical gap given the Aug 2026 enforcement date.",
    lastUpdated: new Date().toISOString(),
    questions: {
      0: { status: "In Progress", owner: "Legal", dueDate: "2026-04-30", evidenceStatus: "No", evidenceRef: "", currentState: "ApexScore v2.1 is a credit scoring system for retail lending. Team believes it falls under Annex III Section 5(b) but formal determination has not been produced.", gap: "No formal written Annex III analysis. Verbal agreement only. Without this, the conformity assessment pathway cannot be formally confirmed.", proposedAction: "Complete formal Annex III analysis document. Obtain General Counsel sign-off. File as the basis for conformity assessment." },
      1: { status: "Not Started", owner: "CRO", dueDate: "2026-06-30", evidenceStatus: "No", evidenceRef: "", currentState: "No conformity assessment underway. Team was not aware this was required until this engagement commenced.", gap: "No conformity assessment process, plan, owner, or resources allocated. Aug 2026 deadline creates a significant time constraint.", proposedAction: "Establish conformity assessment workstream. Assign programme owner (Legal + Engineering). Target completion Q3 2026 with external specialist support." },
      2: { status: "In Progress", owner: "Engineering", dueDate: "2026-05-31", evidenceStatus: "Partial", evidenceRef: "ApexScore_v2.1_ModelCard_Sept2024.pdf", currentState: "Model card exists for ApexScore v2.1, maintained by data science team. Contains model architecture, training data summary, and aggregate performance metrics.", gap: "Model card does not meet Annex IV requirements. Missing: (1) documented intended purpose per Art. 13, (2) post-market monitoring plan per Art. 72, (3) human oversight description per Art. 14. Gender-disaggregated performance data absent.", proposedAction: "Upgrade model card to Annex IV-compliant technical documentation. Assign technical documentation owner in Engineering. Target Q2 2026." },
      3: { status: "Not Started", owner: "Legal", dueDate: "2026-07-31", evidenceStatus: "No", evidenceRef: "", currentState: "EU AI Act database is scheduled to go live in 2026. Apex has not assessed registration requirements or timeline.", gap: "Registration process not assessed, planned, or assigned to an owner.", proposedAction: "Monitor EU AI Act database launch timeline. Assign registration task to Legal. Complete registration before market placement of updated system." },
    },
  },
  // Area 3: Training Data Governance & Bias
  3: {
    summary: "This is the highest-severity technical gap. Known proxy variables for gender exist in bureau data and have not been remediated. No bias examination has been conducted since go-live. Given 1.4M decisions per year, discriminatory outcomes may already be occurring at scale.",
    lastUpdated: new Date().toISOString(),
    questions: {
      0: { status: "In Progress", owner: "Data Engineering", dueDate: "2026-04-30", evidenceStatus: "Partial", evidenceRef: "ApexScore_v2.1_ModelCard_Sept2024.pdf", currentState: "Training data from Apex loan book 2018–2022 and Experian IE bureau data. Training/validation split documented in model card (80/20 stratified). No dataset card meeting ISO 42001 Annex A.4 or Annex IV requirements.", gap: "Documentation does not meet Annex IV or ISO 42001 Annex A.4 standards. No formal data lineage system. Data source agreements and refresh schedules not documented.", proposedAction: "Create dataset cards for all training datasets meeting Annex IV requirements. Implement data lineage tracking in the ML platform." },
      1: { status: "Not Started", owner: "Data Science", dueDate: "2026-05-31", evidenceStatus: "No", evidenceRef: "", currentState: "No formal bias examination conducted. Data science team has informally noted that Experian bureau data contains proxy variables correlated with gender (career break flags, part-time employment history flags). These were not removed during preprocessing.", gap: "Known proxy variables for protected characteristics present in training data and not remediated. No bias examination conducted since model go-live in Jan 2023. 1.4M decisions per year may carry discriminatory bias.", proposedAction: "Commission independent bias examination of training data and model outputs. Identify and remediate proxy variables. Re-evaluate model on disaggregated performance metrics. Document findings." },
      2: { status: "Not Started", owner: "Data Science", dueDate: "2026-05-31", evidenceStatus: "No", evidenceRef: "", currentState: "Training data covers 2018–2022, predating open banking regulation. Representativeness of protected groups not assessed. Bureau data does not include demographic fields directly but proxies are present.", gap: "No representativeness analysis conducted. High risk of historical bias given that pre-2022 Irish/German lending data reflects pre-GDPR and pre-open banking patterns. Under-representation of certain groups not quantified.", proposedAction: "Conduct representativeness analysis across key protected characteristics. If under-representation confirmed, assess data augmentation or reweighting approaches before next retraining." },
      3: { status: "Not Started", owner: "Data Engineering", dueDate: "2026-06-30", evidenceStatus: "No", evidenceRef: "", currentState: "Python preprocessing pipeline handles missing values and outlier removal. No formal data quality framework or DQ scoring metrics. No sign-off gate before training.", gap: "No formal data quality framework meeting Annex IV or ISO 42001 Annex A.4. No DQ thresholds, scoring, or pre-training sign-off process.", proposedAction: "Implement formal DQ framework. Add DQ metrics to ML pipeline. Establish DQ thresholds and require data engineer sign-off before any training run commences." },
    },
  },
  // Area 4: Human Oversight & Override Controls
  4: {
    summary: "Critical gap under Art. 14. Approximately 800 loan decisions per day (~200,000 per year) are fully automated in the mid-score band with no human review capability. The loan origination UI has no override function. This must be remediated before the Aug 2026 enforcement date.",
    lastUpdated: new Date().toISOString(),
    questions: {
      0: { status: "Not Started", owner: "Engineering", dueDate: "2026-07-31", evidenceStatus: "No", evidenceRef: "", currentState: "Underwriters only review edge cases (score <300 auto-reject, >720 auto-approve). Mid-range scores (300–720) result in fully automated approvals or rejections with no human review capability. No override function exists in the loan origination UI.", gap: "~800 daily decisions (est. 200,000/year) made fully automatically with no human review or override capability. This is a critical non-compliance under Art. 14. The 300–720 score band represents the highest-stakes decisions for borderline applicants.", proposedAction: "Build human override capability into the loan origination UI for all score bands. Prioritise 300–720 band. Define monitoring dashboard for underwriters. Target completion Q2 2026." },
      1: { status: "Not Started", owner: "Engineering", dueDate: "2026-07-31", evidenceStatus: "No", evidenceRef: "", currentState: "Override capability does not exist. No logging of any human intervention in AI decisions.", gap: "No audit trail for human intervention. When override is built, logging must be implemented simultaneously.", proposedAction: "Implement comprehensive override logging capturing: timestamp, operator ID, original AI score, override decision, reason code, and outcome. Retain logs for minimum 5 years." },
      2: { status: "Not Started", owner: "HR / Risk", dueDate: "2026-07-31", evidenceStatus: "No", evidenceRef: "", currentState: "No AI-specific training for underwriters. General loan underwriting training in place but does not cover AI oversight responsibilities.", gap: "12 underwriters have no training on Art. 14 oversight responsibilities. Cannot legally exercise oversight if they don't understand what they're looking for.", proposedAction: "Develop AI oversight training programme covering: understanding AI outputs, identifying anomalous scores, when to override, and how to log decisions. Train all 12 underwriters before Aug 2026." },
      3: { status: "Not Started", owner: "Product", dueDate: "2026-07-31", evidenceStatus: "No", evidenceRef: "", currentState: "No formal AI decision escalation pathway. Credit decline letters do not mention AI or the right to request human review.", gap: "No 'right to human review' process for applicants. Decline communications do not disclose AI use or explain decision. This may also breach Art. 13 transparency obligations.", proposedAction: "Implement escalation pathway allowing applicants to request human review within 30 days of decision. Update decline communications to disclose AI use and right to explanation." },
    },
  },
  // Area 5: Fundamental Rights Impact Assessment
  5: {
    summary: "No FRIA has been conducted for ApexScore v2.1 despite 2.5 years in production. This is the most significant governance failure — a credit scoring system affecting 320,000 applicants per year has operated without any fundamental rights assessment. This must be the immediate priority.",
    lastUpdated: new Date().toISOString(),
    questions: {
      0: { status: "Not Started", owner: "Legal / DPO", dueDate: "2026-04-30", evidenceStatus: "No", evidenceRef: "", currentState: "No FRIA has ever been conducted. The team was unaware this was a requirement under Art. 27 until this engagement commenced.", gap: "ApexScore v2.1 has been in production for 2.5 years with 1.4M decisions per year and no FRIA. Fundamental rights impacts — including financial exclusion, housing access, and discrimination — have never been formally assessed.", proposedAction: "Conduct FRIA immediately as the first priority. Engage legal, DPO, and external AI ethics specialist. Use FRIA findings to anchor the broader compliance programme." },
      1: { status: "Not Started", owner: "Legal / DPO", dueDate: "2026-04-30", evidenceStatus: "No", evidenceRef: "", currentState: "Not applicable — no FRIA exists.", gap: "Credit decisions have direct material impact on access to financial services, housing, and quality of life. Intersectional impacts (e.g. single mothers, elderly applicants on fixed income, ethnic minority applicants) have never been assessed. GDPR and Irish equality law create additional obligations.", proposedAction: "FRIA must explicitly cover: gender, ethnicity, age, disability, and intersectional combinations. Must include analysis of impact on right to housing, financial inclusion, and non-discrimination under Irish Equality Acts." },
      2: { status: "Not Started", owner: "Product / Legal", dueDate: "2026-04-30", evidenceStatus: "No", evidenceRef: "", currentState: "No pre-deployment FRIA process exists. The current system was deployed without any rights assessment.", gap: "All future AI deployments need a mandatory pre-deployment FRIA gate. Currently no such control exists.", proposedAction: "Mandate pre-deployment FRIA for all high-risk AI systems. Embed FRIA as a gate in the product development process — no deployment without completed and signed FRIA." },
      3: { status: "Not Started", owner: "CRO", dueDate: "2026-04-30", evidenceStatus: "No", evidenceRef: "", currentState: "No FRIA governance structure. No designated authority with power to halt deployment based on rights concerns.", gap: "No accountable executive designated for FRIA sign-off. No escalation path if FRIA identifies unacceptable risks.", proposedAction: "Designate CRO as FRIA sign-off authority with explicit power to halt or modify AI deployment where FRIA identifies unacceptable fundamental rights risks." },
    },
  },
};

// ─── PHASE 3 RISK REGISTER ────────────────────────────────────────────────────
export const DEMO_RISKS = [
  {
    id: "demo-risk-001",
    riskId: "R-001",
    sourceArea: "Training Data Governance & Bias Examination",
    affectedSystem: "ApexScore v2.1",
    riskCategory: "Data Bias & Fairness",
    description: "Training data contains proxy variables correlated with protected characteristics (gender, indirectly). Bureau data includes career break flags and part-time employment history that act as proxies for gender. These have not been identified or remediated, and model performance has not been disaggregated by protected characteristic since go-live.",
    likelihoodAtScale: "Very high — 1.4M credit decisions per year. Even a small bias rate translates to tens of thousands of potentially discriminatory decisions annually.",
    inherentLikelihood: 4,
    inherentImpact: 5,
    residualLikelihood: 4,
    residualImpact: 4,
    controls: [
      { type: "Detective", description: "Data science team informally monitors model performance metrics (aggregate AUC only — not disaggregated)", owner: "Head of Data Science", status: "Partially Implemented", effectiveness: "Ineffective" },
    ],
    condition: "ApexScore v2.1 training data includes Experian bureau data containing career break and part-time employment flags. These are correlated with gender and have not been removed from the feature set or assessed for discriminatory impact.",
    criteria: "EU AI Act Art. 10 requires training data to be free of errors and have appropriate statistical properties including representativeness. ISO 42001 Cl. 8.4 and Annex A.4 require documented data quality and bias assessment processes.",
    cause: "Training data was assembled in 2022 before AI-specific bias assessment requirements were understood. No data quality or bias governance framework was in place at model development time. No re-evaluation has been commissioned since go-live.",
    effect: "If proxy variables are creating discriminatory outcomes, Apex is making tens of thousands of discriminatory credit decisions per year in violation of the EU AI Act, Irish Equality Acts, and ECHR. Regulatory enforcement risk is high — this is a Category 2 supervisory priority for the Central Bank of Ireland.",
    recommendation: "1. Commission independent bias examination of training data and model outputs (priority: before next board meeting). 2. Remediate identified proxy variables. 3. Re-evaluate model on disaggregated performance metrics across gender, age, and ethnicity proxies. 4. Document findings and remediation as part of technical documentation package.",
    owner: "Head of Data Science",
    dueDate: "2026-05-31",
    status: "Open",
  },
  {
    id: "demo-risk-002",
    riskId: "R-002",
    sourceArea: "Human Oversight & Override Controls",
    affectedSystem: "ApexScore v2.1",
    riskCategory: "Human Oversight Failure",
    description: "Approximately 800 loan decisions per day (est. 200,000 per year) in the 300–720 score band are made fully automatically with no human review capability. The loan origination system UI has no override function. This is a direct violation of Art. 14 EU AI Act once high-risk obligations apply in August 2026.",
    likelihoodAtScale: "Certain — this is not a risk of future occurrence, it is a current operational reality. All mid-band decisions are already fully automated.",
    inherentLikelihood: 5,
    inherentImpact: 4,
    residualLikelihood: 4,
    residualImpact: 4,
    controls: [
      { type: "Detective", description: "Complaints process — customers can complain about credit decisions via general complaints channel, which may trigger manual review", owner: "Operations", status: "Partially Implemented", effectiveness: "Partially Effective" },
    ],
    condition: "The loan origination system has no human override capability for the 300–720 score band. Underwriters have no visibility of these decisions. 200,000+ decisions per year are fully automated without human review or intervention capability.",
    criteria: "EU AI Act Art. 14 requires high-risk AI systems to be designed to allow effective human oversight. Operators must be able to monitor, understand, and intervene or halt the system. This is a mandatory requirement from August 2026.",
    cause: "System was designed for operational efficiency, not regulatory compliance. The oversight requirement under EU AI Act was not factored into the original system architecture. Technical debt has accumulated over 2.5 years of production operation.",
    effect: "From August 2026, Apex will be operating a high-risk AI system in direct violation of a mandatory EU AI Act requirement. Risk of supervisory authority investigation, mandatory remediation order, and fines up to €15M or 3% of global turnover.",
    recommendation: "1. Immediately initiate technical project to add human review/override capability to the loan origination UI (Q2 2026 target). 2. Define which score bands trigger mandatory human review vs optional review. 3. Implement comprehensive override logging. 4. Develop and deliver Art. 14 operator training for all 12 underwriters before Aug 2026.",
    owner: "CTO / Engineering Lead",
    dueDate: "2026-07-31",
    status: "In Progress",
  },
  {
    id: "demo-risk-003",
    riskId: "R-003",
    sourceArea: "High-Risk AI — Conformity Assessment",
    affectedSystem: "ApexScore v2.1",
    riskCategory: "Regulatory Non-Compliance",
    description: "No conformity assessment has been planned or commenced for ApexScore v2.1. Existing model card does not meet Annex IV technical documentation requirements — three mandatory sections are absent. The system cannot be lawfully placed on the EU market in its current documented state from August 2026.",
    likelihoodAtScale: "Certain if no action taken — enforcement date is fixed at August 2026.",
    inherentLikelihood: 4,
    inherentImpact: 3,
    residualLikelihood: 3,
    residualImpact: 3,
    controls: [
      { type: "Preventive", description: "Existing model card provides partial technical documentation basis", owner: "Head of Data Science", status: "Partially Implemented", effectiveness: "Partially Effective" },
      { type: "Preventive", description: "ISO 27001 certification provides baseline information security governance documentation", owner: "CISO", status: "Implemented", effectiveness: "Partially Effective" },
    ],
    condition: "ApexScore v2.1 model card exists but is missing: (1) documented intended purpose per Art. 13, (2) post-market monitoring plan per Art. 72, (3) human oversight description per Art. 14. No conformity assessment has been conducted or planned.",
    criteria: "EU AI Act Art. 43 and Annex IV require providers of high-risk AI systems to complete a conformity assessment and maintain technical documentation before market placement.",
    cause: "Technical documentation was created for internal model governance purposes, not for regulatory compliance. Annex IV requirements were not known to the team at the time of model development and documentation.",
    effect: "Without a conformity assessment, Apex cannot lawfully operate ApexScore v2.1 in the EU from August 2026. Risk of market suspension order from supervisory authority.",
    recommendation: "1. Formally determine Annex III classification in writing (Q1 2026). 2. Upgrade model card to meet Annex IV requirements (Q2 2026). 3. Establish conformity assessment workstream with external specialist support (Q2–Q3 2026). 4. Target conformity assessment completion before August 2026 deadline.",
    owner: "General Counsel",
    dueDate: "2026-07-31",
    status: "Open",
  },
  {
    id: "demo-risk-004",
    riskId: "R-004",
    sourceArea: "Fundamental Rights Impact Assessment",
    affectedSystem: "ApexScore v2.1",
    riskCategory: "Fundamental Rights Violation",
    description: "No Fundamental Rights Impact Assessment has ever been conducted for ApexScore v2.1, which has been making 1.4M credit decisions per year for 2.5 years. Impacts on financial inclusion, housing access, and non-discrimination for vulnerable groups have never been formally assessed.",
    likelihoodAtScale: "Certain that FRIA has not been done. High probability that rights impacts are occurring — credit scoring is one of the highest-stakes AI applications for fundamental rights.",
    inherentLikelihood: 5,
    inherentImpact: 4,
    residualLikelihood: 3,
    residualImpact: 4,
    controls: [
      { type: "Detective", description: "GDPR DPIA was completed for data processing aspects of credit decisioning (2021)", owner: "DPO", status: "Partially Implemented", effectiveness: "Partially Effective" },
    ],
    condition: "No FRIA has been conducted for ApexScore v2.1 in 2.5 years of production. The FRIA requirement under Art. 27 was not known to the team. Known proxy variables in training data (see R-001) increase the probability that discriminatory outcomes are occurring.",
    criteria: "EU AI Act Art. 27 requires deployers of high-risk AI systems to conduct a FRIA before deployment in the context of affected institutions. ISO 42001 Cl. 6.1 and Cl. 8.2 require documented AI impact assessment covering societal and individual impacts.",
    cause: "FRIA requirement was not known to the Apex team. No AI-specific governance framework existed at time of deployment. General GDPR DPIA was considered sufficient — this is incorrect.",
    effect: "Credit decisions affecting financial inclusion, housing access, and equality for 320,000 applicants per year have been made without rights assessment. If discriminatory outcomes are found, retrospective enforcement exposure is significant. Reputational risk from press coverage of discriminatory lending AI is severe.",
    recommendation: "1. Commission FRIA immediately — treat as the highest-priority compliance action alongside R-001 bias examination. 2. Engage external AI ethics specialist with FRIA methodology expertise. 3. FRIA must cover gender, ethnicity, age, disability, and intersectional groups. 4. Designate CRO as FRIA sign-off authority. 5. Build pre-deployment FRIA gate into product development process.",
    owner: "CRO / DPO",
    dueDate: "2026-04-30",
    status: "Open",
  },
];

// ─── SEED FUNCTION — writes all demo data to localStorage ─────────────────────
export function seedDemoClient(): void {
  const existing = (() => { try { return JSON.parse(localStorage.getItem("pl_clients") || "[]"); } catch { return []; } })();
  if (existing.some((c: any) => c.id === DEMO_CLIENT_ID)) return; // already seeded

  // 1. Save client
  localStorage.setItem("pl_clients", JSON.stringify([...existing, DEMO_CLIENT]));

  // 2. Save Phase 2 area states (EU AI Act)
  Object.entries(DEMO_AREA_STATES).forEach(([idx, state]) => {
    localStorage.setItem(`pl_disc_${DEMO_CLIENT_ID}_${DEMO_POLICY_ID}_${idx}`, JSON.stringify(state));
  });

  // 3. Save Phase 3 risk register
  localStorage.setItem(`pl_risks_${DEMO_CLIENT_ID}`, JSON.stringify(DEMO_RISKS));

  // 4. Save Phase 3 summary
  localStorage.setItem(`pl_risk_sum_${DEMO_CLIENT_ID}`, "Risk assessment identifies four material risks — two Critical and two High by residual rating. The most urgent priorities are: (1) immediate bias examination of training data (R-001) given 1.4M decisions/year exposure, and (2) engineering project to implement human oversight capability (R-002) ahead of the August 2026 enforcement deadline. FRIA (R-004) should be treated as equally urgent as it will surface additional risk dimensions not yet quantified. Conformity assessment (R-003) requires a structured programme with external support given the documentation uplift required.");

  // 5. Save Phase 4 exec summary
  localStorage.setItem(`pl_p4_exec_${DEMO_CLIENT_ID}`, "Apex Lending Group presents a high-risk AI compliance profile. ApexScore v2.1, a credit scoring model making 1.4 million automated decisions per year, has been operating for 2.5 years without the governance controls required by the EU AI Act. Four material risks have been identified: discriminatory bias in training data (Critical), absence of human oversight capability (Critical), incomplete technical documentation (High), and failure to conduct a Fundamental Rights Impact Assessment (High).\n\nThe organisation has a strong operational foundation — ISO 27001 certification, an engaged CRO as compliance sponsor, and a capable data science team. However, the gap between current state and August 2026 compliance obligations is significant. We recommend an immediate 90-day sprint addressing R-001 (bias examination) and R-004 (FRIA) in parallel, followed by a technical programme to implement human override capability (R-002) and upgrade technical documentation to Annex IV standards (R-003).\n\nWith appropriate resourcing, August 2026 compliance is achievable. Without it, Apex faces material enforcement risk from both the Central Bank of Ireland (as national supervisory authority) and the European AI Office.");

  // 6. Phase 4 sign-off
  localStorage.setItem(`pl_p4_prep_${DEMO_CLIENT_ID}`, "Preeti [Your Name] — AI Governance Consultant");
  localStorage.setItem(`pl_p4_rev_${DEMO_CLIENT_ID}`, "Sarah Müller — Chief Risk Officer, Apex Lending Group");
  localStorage.setItem(`pl_p4_date_${DEMO_CLIENT_ID}`, "2026-03-21");
}

// ─── MEDISCAN DIAGNOSTICS GROUP — DEMO CLIENT #2 ─────────────────────────────
// Healthcare / Radiology AI · NIST AI RMF primary · ISO 42001 secondary
// Area indices after governance-fix-ordering.sql:
//   0=GOVERN  1=GOVERN2  2=GOVERN3  3=GOVERN5
//   4=MAP     5=MAP1     6=MAP2     7=MAP3  8=MAP4  9=MAP5
//  10=MEASURE 11=MEASURE2 12=MEASURE3
//  13=MANAGE  14=MANAGE3

export const DEMO_MEDISCAN_ID = "demo-mediscan-001";
const DEMO_MEDISCAN_POLICY = "nist-ai-rmf";

export const DEMO_MEDISCAN_CLIENT = {
  id: DEMO_MEDISCAN_ID,
  name: "MediScan Diagnostics Group",
  countries: ["United States"],
  industry: "Healthtech / MedTech / Pharma",
  geography: "North America · United States",
  primaryAiUseCase: "Radiology diagnostic imaging — automated triage and anomaly detection for chest X-rays and CT scans",
  contactName: "Dr. Priya Nair, Chief Medical Information Officer",
  engagementType: "AI Risk Assessment",
  signOffStatus: "Pending",
  status: "active",
  createdAt: "2026-03-01",
  activePolicies: ["nist-ai-rmf", "iso-42001"],
  aboutClient: "MediScan Diagnostics Group is a radiology network operating 34 imaging centres across the US. They deploy RadInsight AI to assist radiologists in prioritising urgent cases and flagging anomalies. The system processes approximately 2,400 scans per day. MediScan is subject to HIPAA, FDA Software as a Medical Device (SaMD) guidance, and is preparing for NIST AI RMF alignment per HHS supervisory expectations.",
  aiSystemName: "RadInsight AI",
  aiTypes: ["Computer Vision"],
  systemDescription: "FDA SaMD Class II decision-support system for chest X-ray and CT scan triage and anomaly detection. Processes 2,400 scans/day across 34 imaging centres. Radiologist retains diagnostic authority and sign-off.",
  vendor: "Luminary Medical AI (Third-Party Vendor)",
  modelOwnership: "Third-Party Vendor",
  decisionAuthority: "Human-in-the-Loop",
  deploymentStatus: "Production",
  timeInProduction: "18 months",
  decisionsPerPeriod: "~2,400 scans/day · ~876,000/year",
  internalUsersAffected: "~120 radiologists across 34 centres",
  externalUsersAffected: "All patients presenting for chest X-ray and CT imaging at MediScan centres",
  trainingDataSource: "Vendor training data (demographics undisclosed)",
  trainingDataPeriod: "Not disclosed by vendor",
  lastRetrainingDate: "",
  modelAccuracy: "Vendor-reported sensitivity 92%, specificity 88% (aggregate). Disaggregated metrics not provided.",
  falsePositiveRate: "Vendor-reported false positive rate 12% (aggregate only — no demographic breakdown).",
  lastEvaluationDate: "",
  evaluationMethod: "Vendor FDA 510(k) validation. No independent MediScan-specific evaluation conducted.",
  knownLimitations: "1. Training data demographics not disclosed by vendor.\n2. No disaggregated performance metrics by gender, age, or ethnicity.\n3. No out-of-distribution testing conducted by MediScan.\n4. Two model updates deployed without formal risk reassessment.\n5. Override rates not tracked — radiologist disagreement with AI triage invisible.\n6. No AI-specific incident playbook.",
  stakeholders: [
    { id: "s1", name: "Dr. Priya Nair", role: "Chief Medical Information Officer", organisation: "MediScan Diagnostics Group", consulted: true, consultationDate: "2026-03-01", notes: "Engagement sponsor. AI risk owner — informal. Formally assigning AI risk accountability is a key action item." },
    { id: "s2", name: "Dr. James Sutherland", role: "Radiology Operations Lead", organisation: "MediScan Diagnostics Group", consulted: true, consultationDate: "2026-03-05", notes: "Oversees RadInsight AI deployment. Key contact for clinical AI governance and system change reviews." },
    { id: "s3", name: "IT Director", role: "IT Infrastructure & Security", organisation: "MediScan Diagnostics Group", consulted: false, consultationDate: "", notes: "To be consulted on vendor contract obligations, override tracking, and test evidence repository." },
    { id: "s4", name: "Legal Counsel", role: "Legal / Compliance", organisation: "MediScan Diagnostics Group", consulted: false, consultationDate: "", notes: "To be consulted on FDA SaMD obligations, HIPAA AI obligations, and vendor contract AI addendum." },
  ],
};

// Area 0 — GOVERN: AI Risk Policy & Accountability
// Area 1 — GOVERN 2: AI Team Structure & Responsibilities
// Area 2 — GOVERN 3: AI Workforce Skills & Training
// Area 3 — GOVERN 5: Risk Tolerance, Legal & Regulatory Alignment
// Area 4 — MAP: Identifying Affected Populations & Risks
// Area 5 — MAP 1: Deployment Context & AI Use Case Scoping
// Area 6 — MAP 2: Scientific Basis, Assumptions & Known Limitations
// Area 7 — MAP 3: Impact on Individuals, Communities & Affected Groups
// Area 8 — MAP 4: Third-Party AI Systems & Supply Chain Risk
// Area 9 — MAP 5: Risk Likelihood, Prioritisation & Impact Estimation
// Area 10 — MEASURE: Fairness Metrics & Monitoring
// Area 11 — MEASURE 2: AI System Testing, Performance & Robustness
// Area 12 — MEASURE 3: Disaggregated Evaluation & External Expert Review
// Area 13 — MANAGE: Risk Treatment & Incident Response
// Area 14 — MANAGE 3: Ongoing Monitoring, Drift Detection & Reassessment

export const DEMO_MEDISCAN_AREA_STATES: Record<number, object> = {
  // Area 0 — GOVERN: AI Risk Policy & Accountability
  0: {
    summary: "Board-level AI governance is absent. CMIO sponsors AI informally but this has not been formalised. The key gap is converting informal ownership into documented, board-approved accountability — this is the foundation for all downstream NIST AI RMF compliance work.",
    lastUpdated: new Date().toISOString(),
    questions: {
      0: { status: "In Progress", owner: "CMIO", dueDate: "2026-06-30", evidenceStatus: "Partial", evidenceRef: "", currentState: "IT security policy exists. No standalone AI risk policy adopted at board level. AI mentioned as 'emerging technology risk' in annual risk appetite statement.", gap: "No board-approved AI-specific policy. Risk appetite for AI not quantified or separately documented.", proposedAction: "Draft AI risk policy covering RadInsight AI scope, risk appetite, and accountabilities. Table at next board meeting Q3 2026." },
      1: { status: "In Progress", owner: "CMIO", dueDate: "2026-06-30", evidenceStatus: "Partial", evidenceRef: "", currentState: "Dr. Priya Nair (CMIO) sponsors AI initiatives. No formal AI risk ownership documented in organisational chart or risk register.", gap: "No named AI risk executive with documented accountability. Role is informal.", proposedAction: "Formally assign AI risk accountability to CMIO. Update organisational risk register and executive responsibility matrix." },
      2: { status: "Not Started", owner: "CMIO", dueDate: "2026-07-31", evidenceStatus: "No", evidenceRef: "", currentState: "RadInsight AI managed informally across radiology operations, IT, and clinical governance. No RACI or responsibility matrix for AI risk.", gap: "No documented RACI for AI development, deployment, monitoring, or incident response.", proposedAction: "Develop AI RACI covering RadInsight AI. Include vendor management, clinical governance, data science, and legal." },
      3: { status: "Not Started", owner: "CMIO", dueDate: "2026-07-31", evidenceStatus: "No", evidenceRef: "", currentState: "AI performance metrics reviewed informally in radiology operations meetings. No board-level AI risk reporting cadence in place.", gap: "No scheduled senior management AI risk review. No AI risk reporting template or dashboard.", proposedAction: "Add quarterly AI risk report to Clinical Governance Committee agenda. Define reporting template." },
    },
  },
  // Area 1 — GOVERN 2: AI Team Structure & Responsibilities
  1: {
    summary: "Accountability for RadInsight AI is informal and distributed. No formal AI system owner exists, no cross-functional AI governance committee has been established, and staff have no clear escalation pathway for AI concerns. These structural gaps will hinder all other governance work.",
    lastUpdated: new Date().toISOString(),
    questions: {
      0: { status: "In Progress", owner: "Radiology Lead", dueDate: "2026-06-30", evidenceStatus: "Partial", evidenceRef: "", currentState: "Radiology operations lead (Dr. James Sutherland) oversees RadInsight AI deployment. No formal AI system owner designation in writing.", gap: "Accountability is informal. No written designation.", proposedAction: "Document formal AI System Owner for RadInsight AI. Include in system register and governance charter." },
      1: { status: "Not Started", owner: "CMIO", dueDate: "2026-07-31", evidenceStatus: "No", evidenceRef: "", currentState: "Product, IT, radiology, and legal teams each engage with RadInsight AI but responsibilities overlap and are undocumented.", gap: "No team-level responsibility mapping. Gaps in legal/compliance coverage.", proposedAction: "Complete team responsibility matrix covering product, clinical, IT, legal, and risk functions." },
      2: { status: "Not Started", owner: "CMIO", dueDate: "2026-07-31", evidenceStatus: "No", evidenceRef: "", currentState: "No standing AI governance committee. Ad hoc reviews convened when issues arise.", gap: "No formal committee with documented authority to approve or halt AI deployments.", proposedAction: "Establish AI Clinical Governance Committee with radiology, legal, IT, risk, and patient safety representation. Define quorum and decision rights." },
      3: { status: "Not Started", owner: "CMIO / HR", dueDate: "2026-08-31", evidenceStatus: "No", evidenceRef: "", currentState: "No AI-specific speak-up mechanism. General whistleblower policy exists but does not reference AI systems.", gap: "Staff have no clear route to escalate concerns about RadInsight AI outputs without informal management chain.", proposedAction: "Add AI-specific speak-up pathway to HR policy. Communicate to all radiology staff." },
    },
  },
  // Area 2 — GOVERN 3: AI Workforce Skills & Training
  2: {
    summary: "No AI-specific training exists for any staff. Radiologists using RadInsight AI daily have no formal understanding of AI risk, bias, or escalation obligations. This is a material gap — oversight obligations cannot be met by staff who haven't been trained on what to look for.",
    lastUpdated: new Date().toISOString(),
    questions: {
      0: { status: "Not Started", owner: "CMIO / HR", dueDate: "2026-09-30", evidenceStatus: "No", evidenceRef: "", currentState: "No AI competency framework. Radiologists have clinical training; no AI literacy component assessed at hiring or appraisal.", gap: "No AI competency baseline or gap assessment.", proposedAction: "Define AI competency requirements for radiologists and clinical staff using RadInsight AI. Integrate into role profiles." },
      1: { status: "Not Started", owner: "CMIO / HR", dueDate: "2026-09-30", evidenceStatus: "No", evidenceRef: "", currentState: "No mandatory AI-specific training. General data privacy (HIPAA) training is complete for all staff.", gap: "No AI risk, bias, or ethics training delivered or planned.", proposedAction: "Commission AI literacy training module for all RadInsight AI users. Target completion Q4 2026." },
      2: { status: "Not Started", owner: "CMIO / HR", dueDate: "2026-09-30", evidenceStatus: "No", evidenceRef: "", currentState: "Radiologists rely on professional judgment to identify unusual outputs. No formal process for flagging AI performance concerns.", gap: "No documented obligation or mechanism for flagging AI concerns. Staff unaware of escalation path.", proposedAction: "Include AI concern-reporting procedure in training. Define what constitutes a reportable AI performance event." },
      3: { status: "Not Started", owner: "CMIO / HR", dueDate: "2026-09-30", evidenceStatus: "No", evidenceRef: "", currentState: "Not covered. No bias awareness component in any existing MediScan training programme.", gap: "Staff have no understanding of how demographic bias in radiology AI manifests or how to identify it.", proposedAction: "Include bias and fairness module in AI training. Use real-world radiology AI bias case studies (e.g. chest X-ray performance gaps by patient BMI and gender)." },
    },
  },
  // Area 3 — GOVERN 5: Risk Tolerance, Legal & Regulatory Alignment
  3: {
    summary: "MediScan operates RadInsight AI with no defined AI risk tolerance and no formal mapping of HHS / FDA / NIST obligations to internal controls. HIPAA compliance is active but AI-specific regulatory requirements have not been systematically tracked. This is a foundational gap given HHS supervisory expectations.",
    lastUpdated: new Date().toISOString(),
    questions: {
      0: { status: "Not Started", owner: "CMIO", dueDate: "2026-07-31", evidenceStatus: "No", evidenceRef: "", currentState: "No AI-specific risk tolerance statement. Enterprise risk appetite covers financial and operational risk only.", gap: "No defined threshold at which AI risk requires treatment vs. acceptance.", proposedAction: "Define AI risk tolerance for RadInsight AI covering false negative rate, demographic parity, and incident frequency. Obtain board approval." },
      1: { status: "In Progress", owner: "Legal / Compliance", dueDate: "2026-06-30", evidenceStatus: "Partial", evidenceRef: "", currentState: "HIPAA compliance programme active. FDA SaMD classification acknowledged. HHS AI guidance noted but not formally mapped to controls.", gap: "No control mapping between HHS supervisory guidance / NIST AI RMF obligations and current controls.", proposedAction: "Complete regulatory obligation mapping: FDA SaMD → NIST AI RMF → internal controls. Assign control owners." },
      2: { status: "Not Started", owner: "Legal", dueDate: "2026-07-31", evidenceStatus: "No", evidenceRef: "", currentState: "Legal counsel periodically reviews regulatory news. No formal horizon-scanning process or assigned owner.", gap: "No systematic monitoring. Risk of missing HHS, FDA, or CMS updates affecting RadInsight AI.", proposedAction: "Assign legal/compliance owner for AI regulatory monitoring. Establish quarterly review cadence." },
      3: { status: "Not Started", owner: "CMIO", dueDate: "2026-07-31", evidenceStatus: "No", evidenceRef: "", currentState: "RadInsight AI has been updated twice since go-live. No change impact assessment conducted on either occasion.", gap: "No change management process linking model updates to risk tolerance review.", proposedAction: "Implement AI change management procedure requiring risk tolerance review before each model update or expansion." },
    },
  },
  // Area 4 — MAP: Identifying Affected Populations & Risks
  4: {
    summary: "Patient populations are broadly described but not systematically mapped. Vulnerable groups (paediatric, elderly, underrepresented ethnicities) have not been explicitly identified or assessed. Bias and fairness are not formal risk categories. This gap is particularly significant given RadInsight AI's scale — 2,400 scans/day.",
    lastUpdated: new Date().toISOString(),
    questions: {
      0: { status: "In Progress", owner: "CMIO", dueDate: "2026-07-31", evidenceStatus: "Partial", evidenceRef: "", currentState: "Patient population broadly described as 'adult patients presenting for chest and CT imaging.' No segmentation by age, gender, BMI, or ethnicity.", gap: "No disaggregated affected population mapping. Specific vulnerable groups not documented.", proposedAction: "Complete affected population map for RadInsight AI. Include paediatric patients, elderly, pregnant patients, and underrepresented ethnicities." },
      1: { status: "Not Started", owner: "CMIO", dueDate: "2026-08-31", evidenceStatus: "No", evidenceRef: "", currentState: "Not addressed. Vendor documentation does not call out demographic performance variation.", gap: "No explicit identification of groups at higher risk of algorithmic harm (e.g. patients with atypical presentations, non-standard BMI, or underrepresented in training data).", proposedAction: "Request demographic performance data from vendor. Map against patient population mix across 34 MediScan centres." },
      2: { status: "Not Started", owner: "CMIO", dueDate: "2026-08-31", evidenceStatus: "No", evidenceRef: "", currentState: "Technical risks reviewed informally during IT onboarding. No structured multi-dimension risk assessment.", gap: "No risk assessment framework covering technical, clinical, societal, and operational risk dimensions for RadInsight AI.", proposedAction: "Complete NIST AI RMF-aligned risk assessment covering all four dimensions. Use workbook as basis." },
      3: { status: "Not Started", owner: "CMIO", dueDate: "2026-08-31", evidenceStatus: "No", evidenceRef: "", currentState: "IT risk register covers cybersecurity and data privacy. No bias or fairness risk category.", gap: "Algorithmic bias not recognised as a formal risk category. No risk owner assigned.", proposedAction: "Add bias and fairness as formal risk categories in enterprise risk register. Assign to CMIO. Set initial risk rating." },
    },
  },
  // Area 5 — MAP 1: Deployment Context & AI Use Case Scoping
  5: {
    summary: "The intended purpose of RadInsight AI is formally documented via FDA 510(k) submission — this is a strong foundation. Risk classification is clear (FDA SaMD Class II / High Clinical Risk). Key gaps are that vendor exclusion criteria have not been embedded in operational SOPs, and model updates have not triggered risk reclassification reviews.",
    lastUpdated: new Date().toISOString(),
    questions: {
      0: { status: "Complete", owner: "Radiology Lead", dueDate: "", evidenceStatus: "Yes", evidenceRef: "FDA_510k_RadInsight_Submission.pdf", currentState: "RadInsight AI intended purpose documented in FDA 510(k) submission and vendor contract: automated triage prioritisation and anomaly detection for chest X-rays and CT scans. Decision-support only — radiologist retains diagnostic authority.", gap: "None identified. FDA documentation provides formal scope baseline.", proposedAction: "Reference FDA submission as primary scope document. Keep under change control." },
      1: { status: "In Progress", owner: "Radiology Lead", dueDate: "2026-06-30", evidenceStatus: "Partial", evidenceRef: "", currentState: "Vendor instructions for use include some exclusion criteria. Not integrated into MediScan's operational SOPs.", gap: "Exclusions not communicated to radiologists in day-to-day operating procedures. No documented contraindications for specific patient populations.", proposedAction: "Extract vendor exclusion criteria and embed in radiology SOP. Cover paediatric patients, implants, and motion artefacts." },
      2: { status: "Complete", owner: "Radiology Lead", dueDate: "", evidenceStatus: "Yes", evidenceRef: "RadInsight_ClinicalGovernance_RiskClassification_2025.pdf", currentState: "RadInsight AI classified FDA SaMD Class II. Internally classified as High Clinical Risk due to potential for missed pathology affecting patient safety.", gap: "None. Classification documented and reviewed at last clinical governance meeting.", proposedAction: "Maintain classification under review. Reassess if system expanded to additional modalities or patient populations." },
      3: { status: "Not Started", owner: "Radiology Lead", dueDate: "2026-07-31", evidenceStatus: "No", evidenceRef: "", currentState: "No formal change management process linking AI updates to risk reclassification review.", gap: "Two model updates deployed without formal risk classification review.", proposedAction: "Implement AI change management gate: risk classification review required before deployment of any model update." },
    },
  },
  // Area 6 — MAP 2: Scientific Basis, Assumptions & Known Limitations
  6: {
    summary: "Vendor-provided model card received but does not include training data demographics or disaggregated performance data. MediScan has not conducted any local validation. Assumptions undocumented. Lack of vendor transparency on training data demographics is a high-priority gap for a healthcare AI system at this scale.",
    lastUpdated: new Date().toISOString(),
    questions: {
      0: { status: "In Progress", owner: "IT / Vendor", dueDate: "2026-06-30", evidenceStatus: "Partial", evidenceRef: "Luminary_ModelCard_v2_2025.pdf", currentState: "Vendor-provided model card received covering architecture and headline performance metrics. Does not include training data demographics or demographic performance breakdown.", gap: "No MediScan-specific supplementary model card. Training data demographics unknown.", proposedAction: "Request expanded model card from vendor. MediScan to complete supplementary documentation covering deployment-specific performance observations." },
      1: { status: "Not Started", owner: "Radiology Lead", dueDate: "2026-07-31", evidenceStatus: "No", evidenceRef: "", currentState: "No internal documentation of assumptions embedded in RadInsight AI's design (e.g. patient positioning standards, image quality thresholds, demographic representativeness of training data).", gap: "Assumptions undocumented. Staff may not be aware of conditions under which performance degrades.", proposedAction: "Complete assumptions register for RadInsight AI. Review with vendor and radiology lead." },
      2: { status: "Not Started", owner: "IT / Data Science", dueDate: "2026-09-30", evidenceStatus: "No", evidenceRef: "", currentState: "No out-of-distribution testing conducted by MediScan. Vendor testing methodology not disclosed.", gap: "Performance on MediScan-specific patient population (diverse ethnicity, wide BMI range, older demographic) not validated.", proposedAction: "Commission local validation study on MediScan patient cohort before next model update. Define sample size with biostatistics input." },
      3: { status: "In Progress", owner: "IT", dueDate: "2026-06-30", evidenceStatus: "Partial", evidenceRef: "", currentState: "Vendor provided summary technical documentation. Full training data datasheet not yet received.", gap: "Training data demographics and known bias limitations not disclosed.", proposedAction: "Formally request training data datasheet and known bias disclosure from vendor. Make contractual requirement going forward." },
    },
  },
  // Area 7 — MAP 3: Impact on Individuals, Communities & Affected Groups
  7: {
    summary: "No AI impact assessment, equality impact assessment, or formal consideration of vulnerable groups has been conducted. Patients are unaware that AI is used in their care pathway. This is a significant gap — at 2,400 scans/day, any systematic demographic bias in RadInsight AI affects thousands of patients weekly.",
    lastUpdated: new Date().toISOString(),
    questions: {
      0: { status: "Not Started", owner: "CMIO", dueDate: "2026-08-31", evidenceStatus: "No", evidenceRef: "", currentState: "No formal AI impact assessment conducted. FDA SaMD submission covers intended use; no impact assessment from an AI ethics perspective.", gap: "No structured assessment of positive and negative impacts on patient groups.", proposedAction: "Complete AI Impact Assessment (AIIA) covering patient safety, health equity, and demographic impact. Use ISO 42001 Annex B as template." },
      1: { status: "Not Started", owner: "CMIO", dueDate: "2026-08-31", evidenceStatus: "No", evidenceRef: "", currentState: "Paediatric patients, elderly patients, and patients with atypical presentations not specifically assessed. No vendor guidance provided.", gap: "Specific vulnerability considerations absent from all MediScan documentation.", proposedAction: "Add vulnerable group analysis to AIIA. Include clinical review by radiologist lead for each identified group." },
      2: { status: "Not Started", owner: "CMIO / Patient Relations", dueDate: "2026-09-30", evidenceStatus: "No", evidenceRef: "", currentState: "General patient feedback mechanism exists via patient relations team. No mechanism for capturing feedback relating to AI-assisted diagnoses.", gap: "No AI-specific feedback channel. Patients unaware RadInsight AI is used in their care.", proposedAction: "Update patient consent and privacy notice to disclose AI use. Create AI-specific feedback pathway via patient relations." },
      3: { status: "Not Started", owner: "CMIO", dueDate: "2026-09-30", evidenceStatus: "No", evidenceRef: "", currentState: "No EIA conducted. No equality and diversity review of AI systems in MediScan's clinical governance process.", gap: "No formal EIA. Protected characteristic impact analysis absent.", proposedAction: "Conduct EIA for RadInsight AI covering gender, ethnicity, age, and disability. Integrate into clinical governance review cycle." },
    },
  },
  // Area 8 — MAP 4: Third-Party AI Systems & Supply Chain Risk
  8: {
    summary: "RadInsight AI vendor assessment relies on a standard IT security questionnaire with no AI-specific risk questions. Two model updates have been deployed without triggering a vendor reassessment. Vendor contract has no AI-specific obligations (no bias testing rights, no change notification, no audit access). This is a critical contractual gap.",
    lastUpdated: new Date().toISOString(),
    questions: {
      0: { status: "In Progress", owner: "IT", dueDate: "2026-06-30", evidenceStatus: "Partial", evidenceRef: "", currentState: "RadInsight AI is the only AI system formally in scope. IT asset register includes RadInsight AI server infrastructure. Other diagnostic software not yet assessed for AI components.", gap: "AI component inventory incomplete. Other clinical software may contain AI features not yet identified.", proposedAction: "Conduct AI system discovery across all clinical software. Update asset register with AI classification flag." },
      1: { status: "In Progress", owner: "IT / Procurement", dueDate: "2026-06-30", evidenceStatus: "Partial", evidenceRef: "", currentState: "RadInsight AI vendor (Luminary Medical AI) completed IT security questionnaire at onboarding. No AI-specific risk questions included.", gap: "Vendor assessment does not cover bias testing, demographic performance, or AI incident history.", proposedAction: "Develop AI-specific vendor questionnaire. Conduct retrospective assessment of Luminary Medical AI. Require annual renewal." },
      2: { status: "Not Started", owner: "Legal", dueDate: "2026-09-30", evidenceStatus: "No", evidenceRef: "", currentState: "Vendor contract covers standard SaaS terms: uptime, data security, HIPAA Business Associate Agreement. No AI-specific clauses.", gap: "No contractual right to bias testing results, performance disclosure, model change notification, or audit access.", proposedAction: "At next contract renewal, insert AI addendum: performance disclosure, bias testing rights, change notification (30 days), and audit rights." },
      3: { status: "Not Started", owner: "IT / Legal", dueDate: "2026-08-31", evidenceStatus: "No", evidenceRef: "", currentState: "Two model updates deployed. Neither triggered a vendor risk reassessment.", gap: "No contractual obligation on vendor to notify MediScan of model changes before deployment.", proposedAction: "Add model change notification clause to vendor contract. Define internal reassessment trigger and review process." },
    },
  },
  // Area 9 — MAP 5: Risk Likelihood, Prioritisation & Impact Estimation
  9: {
    summary: "No AI risk register with likelihood and impact ratings exists. AI risks are not formally prioritised or resourced. Board has no visibility of RadInsight AI risk profile. Without a structured risk register, MediScan cannot demonstrate NIST AI RMF alignment to HHS.",
    lastUpdated: new Date().toISOString(),
    questions: {
      0: { status: "Not Started", owner: "CMIO", dueDate: "2026-07-31", evidenceStatus: "No", evidenceRef: "", currentState: "No AI risk register with likelihood/impact ratings. Clinical incident register covers adverse events but not AI-specific risks.", gap: "No structured AI risk prioritisation. Resources not allocated against risk severity.", proposedAction: "Create RadInsight AI risk register. Apply 5×5 likelihood/impact matrix. Assign owners to each risk." },
      1: { status: "Not Started", owner: "CMIO", dueDate: "2026-08-31", evidenceStatus: "No", evidenceRef: "", currentState: "No AI risk committee or equivalent body reviewing AI-specific risks.", gap: "No governance structure reviewing AI risk register. No resource allocation decision for AI risk treatment.", proposedAction: "Present prioritised AI risk register to Clinical Governance Committee for resource allocation and treatment decisions." },
      2: { status: "Not Started", owner: "CMIO", dueDate: "2026-08-31", evidenceStatus: "No", evidenceRef: "", currentState: "No escalation process defined for AI risks. Board not currently briefed on RadInsight AI risk profile.", gap: "Board has no visibility of RadInsight AI risk. Senior executives not informed of high-severity risks.", proposedAction: "Define escalation thresholds for AI risks. Present top 3 risks to board at next clinical governance board update." },
      3: { status: "Not Started", owner: "CMIO", dueDate: "2026-08-31", evidenceStatus: "No", evidenceRef: "", currentState: "No AI risk register exists. No review schedule established.", gap: "No review cadence. Risks not refreshed after system changes or incidents.", proposedAction: "Establish quarterly AI risk register review. Add trigger for review after any AI incident or model update." },
    },
  },
  // Area 10 — MEASURE: Fairness Metrics & Monitoring
  10: {
    summary: "No fairness metrics have been defined or measured. Performance results are aggregate only — no demographic breakdown. No pre-deployment baseline exists. Fairness monitoring cannot be established until vendor provides disaggregated data or MediScan commissions its own evaluation. This is the most material technical gap.",
    lastUpdated: new Date().toISOString(),
    questions: {
      0: { status: "Not Started", owner: "Data Science / Vendor", dueDate: "2026-09-30", evidenceStatus: "No", evidenceRef: "", currentState: "Overall sensitivity and specificity metrics provided by vendor. No fairness metrics defined or measured by MediScan.", gap: "No demographic parity, equalised odds, or calibration metrics established. No MediScan-specific fairness baseline.", proposedAction: "Define fairness metrics relevant to RadInsight AI: false negative rate by gender, age group, and ethnicity. Establish baseline from historical data." },
      1: { status: "Not Started", owner: "Data Science / Vendor", dueDate: "2026-09-30", evidenceStatus: "No", evidenceRef: "", currentState: "Vendor reports aggregate sensitivity and specificity only. No demographic breakdown provided or requested.", gap: "Disaggregated performance unknown. Demographic gaps in detection performance undetected.", proposedAction: "Request disaggregated performance data from vendor. If unavailable, commission local retrospective analysis on 6-month scan cohort." },
      2: { status: "Not Started", owner: "Data Science", dueDate: "2026-09-30", evidenceStatus: "No", evidenceRef: "", currentState: "RadInsight AI deployed without a pre-deployment fairness baseline. Performance accepted on vendor testing results only.", gap: "No MediScan-specific baseline. Cannot detect performance drift or fairness degradation.", proposedAction: "Establish performance baseline (including fairness metrics) using retrospective data before next model update." },
      3: { status: "Not Started", owner: "CMIO", dueDate: "2026-09-30", evidenceStatus: "No", evidenceRef: "", currentState: "No monitoring review process in place. Vendor sends quarterly performance summary; not formally reviewed.", gap: "No named reviewer. No authority to halt or retrain assigned.", proposedAction: "Assign CMIO as accountable reviewer of AI performance reports. Define intervention thresholds and escalation path." },
    },
  },
  // Area 11 — MEASURE 2: AI System Testing, Performance & Robustness
  11: {
    summary: "No MediScan-specific test plan exists. Testing relies entirely on vendor FDA validation. No performance benchmarks, robustness testing, or centralised test evidence repository. Two model updates were deployed without any MediScan-side testing. This creates significant clinical safety risk.",
    lastUpdated: new Date().toISOString(),
    questions: {
      0: { status: "In Progress", owner: "IT / Radiology Lead", dueDate: "2026-07-31", evidenceStatus: "Partial", evidenceRef: "Luminary_FDA_Validation_510k.pdf", currentState: "Vendor provided FDA validation testing documentation. MediScan has not conducted independent testing.", gap: "No MediScan-specific test plan. Reliance on vendor testing only.", proposedAction: "Develop MediScan test plan covering functional performance, edge cases, and population-specific scenarios. Execute before next model update." },
      1: { status: "Not Started", owner: "IT", dueDate: "2026-07-31", evidenceStatus: "No", evidenceRef: "", currentState: "Benchmarks not defined by MediScan. Vendor benchmarks accepted at face value.", gap: "No pre-defined acceptance thresholds. No rejection criteria if performance falls below minimum.", proposedAction: "Define minimum acceptable performance thresholds (sensitivity, specificity, false negative rate by demographic) in advance of any future testing." },
      2: { status: "Not Started", owner: "IT / Data Science", dueDate: "2026-09-30", evidenceStatus: "No", evidenceRef: "", currentState: "No adversarial or out-of-distribution testing conducted. Vendor testing conditions not disclosed.", gap: "RadInsight AI's resilience to image artefacts, low-quality inputs, and atypical presentations untested locally.", proposedAction: "Commission annual robustness testing including edge cases specific to MediScan patient population and equipment variations." },
      3: { status: "In Progress", owner: "IT", dueDate: "2026-06-30", evidenceStatus: "Partial", evidenceRef: "", currentState: "Vendor FDA documentation retained on file. MediScan internal test results not systematically stored.", gap: "No centralised test evidence repository. Results stored ad hoc across email and shared drives.", proposedAction: "Establish AI evidence repository (SharePoint or equivalent). Store all test plans, results, and vendor disclosures." },
    },
  },
  // Area 12 — MEASURE 3: Disaggregated Evaluation & External Expert Review
  12: {
    summary: "No disaggregated evaluation exists — neither from the vendor nor from MediScan. No independent bias review has been commissioned. No red team testing. Demographic performance gaps are currently invisible. Given RadInsight AI processes 2,400 scans/day, any demographic performance disparity is causing harm at scale without detection.",
    lastUpdated: new Date().toISOString(),
    questions: {
      0: { status: "Not Started", owner: "Data Science", dueDate: "2026-09-30", evidenceStatus: "No", evidenceRef: "", currentState: "Only aggregate metrics available. Neither vendor nor MediScan has produced disaggregated evaluation.", gap: "False negative rates by gender, age, and ethnicity unknown. Equity risk unquantified.", proposedAction: "Commission retrospective disaggregated analysis. Set minimum sample sizes per demographic group for statistical validity." },
      1: { status: "Not Started", owner: "Data Science", dueDate: "2026-09-30", evidenceStatus: "No", evidenceRef: "", currentState: "No independent review. Vendor bias assessment relied upon without verification.", gap: "No independent oversight of bias evaluation. Conflict of interest not addressed.", proposedAction: "Engage clinical AI audit specialist to conduct independent bias review of RadInsight AI performance data. Report to Clinical Governance Committee." },
      2: { status: "Not Started", owner: "Data Science", dueDate: "2026-10-31", evidenceStatus: "No", evidenceRef: "", currentState: "No adversarial testing. No structured test for systematic output differences across demographic groups.", gap: "Systematic demographic bias could be present and undetected.", proposedAction: "Include demographic adversarial testing in annual review. Use structured test cases designed to surface gender- and age-related performance disparities." },
      3: { status: "Not Started", owner: "Data Science", dueDate: "2026-10-31", evidenceStatus: "No", evidenceRef: "", currentState: "No MediScan-authored model card. Only vendor documentation held.", gap: "No internal record of disaggregated evaluation, independent review findings, or bias remediation.", proposedAction: "Produce MediScan model card for RadInsight AI. Update after each evaluation cycle. Retain in AI evidence repository." },
    },
  },
  // Area 13 — MANAGE: Risk Treatment & Incident Response
  13: {
    summary: "No AI incident playbook exists. AI incidents are being logged in the general clinical incident system without AI attribution or AI-specific root cause analysis. Two near-miss events involving RadInsight AI were logged as general clinical events. Without an AI-specific incident framework, systemic AI issues will continue to go undetected.",
    lastUpdated: new Date().toISOString(),
    questions: {
      0: { status: "Not Started", owner: "CMIO", dueDate: "2026-07-31", evidenceStatus: "No", evidenceRef: "", currentState: "Enterprise risk treatment follows standard 4T model (tolerate/treat/transfer/terminate). Not adapted for AI-specific risks.", gap: "No AI-specific treatment guidance. Bias risks not treated differently from other risk types.", proposedAction: "Extend risk treatment framework to include AI-specific guidance: bias risks above threshold require treatment (not tolerance). Document in AI risk policy." },
      1: { status: "Not Started", owner: "CMIO / IT", dueDate: "2026-07-31", evidenceStatus: "No", evidenceRef: "", currentState: "Clinical incident reporting covers adverse events. No AI-specific playbook covering bias events, model failure, or harmful output.", gap: "No defined AI incident types, severity levels, or response steps.", proposedAction: "Develop RadInsight AI incident playbook: define incident types (false negative event, demographic performance breach, model failure, data quality event). Assign response owners." },
      2: { status: "Not Started", owner: "CMIO", dueDate: "2026-09-30", evidenceStatus: "No", evidenceRef: "", currentState: "No tabletop exercise conducted. Playbook does not yet exist.", gap: "Untested response capability. Staff would be unprepared in the event of a real AI incident.", proposedAction: "Conduct tabletop exercise after playbook is drafted. Involve radiology lead, CMIO, IT, legal, and patient safety. Annual cadence thereafter." },
      3: { status: "In Progress", owner: "CMIO / IT", dueDate: "2026-06-30", evidenceStatus: "Partial", evidenceRef: "CIRS_System_Access.pdf", currentState: "Clinical adverse events logged via CIRS (Clinical Incident Reporting System). AI-specific root cause analysis not conducted. Two near-miss events involving RadInsight AI logged as general clinical events without AI attribution.", gap: "AI incidents not categorised separately. No AI root cause analysis. No trend tracking.", proposedAction: "Add AI system flag to CIRS. Develop AI incident classification taxonomy. Review historical near-misses for AI attribution." },
    },
  },
  // Area 14 — MANAGE 3: Ongoing Monitoring, Drift Detection & Reassessment
  14: {
    summary: "Production monitoring is passive — quarterly vendor report only, no drift thresholds, no automated alerting. Override rates are invisible. RadInsight AI has been in production 18 months without a formal governance review. No decommissioning criteria exist. This leaves MediScan unable to detect and respond to performance degradation.",
    lastUpdated: new Date().toISOString(),
    questions: {
      0: { status: "Not Started", owner: "IT / Vendor", dueDate: "2026-07-31", evidenceStatus: "No", evidenceRef: "", currentState: "Vendor provides quarterly performance report. No real-time monitoring. No drift detection thresholds defined.", gap: "Performance drift could go undetected between quarterly reports. No automated alerting.", proposedAction: "Define drift thresholds for sensitivity, false negative rate, and demographic parity. Request monitoring dashboard from vendor. Escalate if thresholds breached." },
      1: { status: "Not Started", owner: "IT / Radiology Lead", dueDate: "2026-07-31", evidenceStatus: "No", evidenceRef: "", currentState: "Radiologist overrides of RadInsight AI triage not systematically tracked. No visibility on how often radiologists disagree with AI prioritisation.", gap: "Override rate is a key signal of AI performance and radiologist trust — currently invisible.", proposedAction: "Implement override tracking in radiology workflow system. Review monthly. Alert if override rate exceeds 15% or changes significantly." },
      2: { status: "Not Started", owner: "CMIO", dueDate: "2026-08-31", evidenceStatus: "No", evidenceRef: "", currentState: "No scheduled reassessment. RadInsight AI has been in production 18 months without a formal governance review.", gap: "No review cadence. No trigger for reassessment after significant events.", proposedAction: "Schedule annual RadInsight AI governance review covering performance, fairness, clinical safety, and regulatory alignment. Trigger additional review on model update or any AI-attributed incident." },
      3: { status: "Not Started", owner: "CMIO", dueDate: "2026-09-30", evidenceStatus: "No", evidenceRef: "", currentState: "No decommissioning criteria defined. No process for halting RadInsight AI if performance falls below clinical safety standards.", gap: "No authority or process to suspend or decommission AI in production. Clinical safety risk if performance degrades.", proposedAction: "Define decommissioning thresholds (e.g. false negative rate > X%, sustained demographic performance gap > Y%). Document halt procedure. Assign authority to CMIO." },
    },
  },
};

export function seedMediScanClient(): void {
  const existing = (() => { try { return JSON.parse(localStorage.getItem("pl_clients") || "[]"); } catch { return []; } })();
  if (existing.some((c: any) => c.id === DEMO_MEDISCAN_ID)) return; // already seeded

  // 1. Save client
  localStorage.setItem("pl_clients", JSON.stringify([...existing, DEMO_MEDISCAN_CLIENT]));

  // 2. Save Phase 2 area states (NIST AI RMF — 15 areas, indices 0–14)
  Object.entries(DEMO_MEDISCAN_AREA_STATES).forEach(([idx, state]) => {
    localStorage.setItem(`pl_disc_${DEMO_MEDISCAN_ID}_${DEMO_MEDISCAN_POLICY}_${idx}`, JSON.stringify(state));
  });
}
