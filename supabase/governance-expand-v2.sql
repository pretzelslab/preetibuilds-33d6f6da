-- ═══════════════════════════════════════════════════════════════════════════════
-- GOVERNANCE WORKBOOK EXPANSION v2
-- Run in Supabase SQL Editor (governance project)
-- Adds 10 new areas + 40 questions to NIST AI RMF
-- Adds 6 new areas + 24 questions to EU AI Act
-- Adds 5 new areas + 20 questions to ISO 42001
-- Adds 4 new areas + 16 questions to NIST CSF 2.0
-- Healthcare industry tags throughout
-- Safe to re-run — all inserts use ON CONFLICT DO NOTHING
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- NIST AI RMF — EXPANDED AREAS (adds 10 new areas to existing 4)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO areas (policy_id, slug, area_name, phase_group, regulatory_ref, priority, effort, pillar, stakeholder, risk_if_not_addressed, dependencies, evidence_to_collect, maturity_not_started, maturity_developing, maturity_defined, maturity_optimised, sort_order) VALUES

('nist-ai-rmf', 'govern-team-structure',
 'GOVERN 2 — AI Team Structure & Responsibilities',
 'Govern & Scope',
 'GOVERN 2.1–2.2 — Organisational Teams & Roles',
 'High', 'Low', 'governance',
 'CHRO / CRO / Head of AI',
 'AI risks diffuse across teams with no clear ownership; gaps in accountability emerge during incidents.',
 ARRAY['GOVERN — AI Risk Policy & Accountability'],
 ARRAY['Org chart showing AI roles','Job descriptions for AI-specific roles','RACI matrix for AI risk management'],
 'No dedicated AI roles or team structure.',
 'AI roles informally assigned. No RACI. Accountability unclear.',
 'AI roles formally defined. RACI documented. Clear ownership.',
 'AI team structure reviewed quarterly. Succession planning in place.',
 4),

('nist-ai-rmf', 'govern-workforce',
 'GOVERN 3 — AI Workforce Skills & Training',
 'Govern & Scope',
 'GOVERN 3.1–3.2 — Workforce Competency',
 'Medium', 'Medium', 'governance',
 'CHRO / L&D / AI Lead',
 'Staff operating AI systems without adequate training; errors in oversight and escalation during incidents.',
 ARRAY['GOVERN 2 — AI Team Structure & Responsibilities'],
 ARRAY['Training completion records','Competency assessment results','External certification evidence'],
 'No AI training programme. Staff unaware of AI risks.',
 'Ad-hoc training exists. No structured programme or assessment.',
 'Structured training in place. Competency assessed. Gaps documented.',
 'Continuous learning culture. External certifications supported. Audit-tested.',
 5),

('nist-ai-rmf', 'govern-risk-tolerance',
 'GOVERN 5 — Risk Tolerance, Legal & Regulatory Alignment',
 'Govern & Scope',
 'GOVERN 5.1–5.2 — Risk Tolerance & Legal Obligations',
 'High', 'Medium', 'risk',
 'CRO / Legal / Compliance',
 'AI deployed without defined risk tolerance; legal and regulatory obligations untracked; enforcement exposure.',
 ARRAY['GOVERN — AI Risk Policy & Accountability'],
 ARRAY['Risk tolerance statements','Legal horizon scanning records','Regulatory obligation register'],
 'No AI risk tolerance defined. Legal obligations not mapped.',
 'Risk tolerance discussed informally. Legal obligations partially mapped.',
 'Risk tolerance approved at board level. Legal obligations register maintained.',
 'Risk tolerance reviewed after regulatory change. Legal monitoring automated.',
 6),

('nist-ai-rmf', 'map-context-deployment',
 'MAP 1 — Deployment Context & AI Use Case Scoping',
 'Map & Discover',
 'MAP 1.1–1.7 — AI Context & Categorisation',
 'High', 'Medium', 'governance',
 'Product / Risk / Legal',
 'AI deployed into contexts not covered by design; harms to unintended populations; regulatory misclassification.',
 ARRAY['GOVERN — AI Risk Policy & Accountability'],
 ARRAY['AI system design documents','Use case scoping records','Deployment environment documentation'],
 'No formal deployment context documented for AI systems.',
 'Context documented for some systems. Gaps in high-risk systems.',
 'All material AI systems have documented deployment context.',
 'Context reviewed at every significant change. Automated change alerts.',
 7),

('nist-ai-rmf', 'map-scientific-basis',
 'MAP 2 — Scientific Basis, Assumptions & Known Limitations',
 'Map & Discover',
 'MAP 2.1–2.3 — Scientific Understanding',
 'High', 'High', 'ethics',
 'ML Engineering / Data Science / Product',
 'AI systems deployed with unknown or undisclosed limitations; failures attributed to black-box behaviour.',
 ARRAY['MAP 1 — Deployment Context & AI Use Case Scoping'],
 ARRAY['Model cards','System limitation disclosures','Technical documentation','Out-of-distribution testing results'],
 'No documentation of AI limitations or assumptions.',
 'Limitations acknowledged informally. Not documented or disclosed.',
 'Limitations formally documented. Disclosed to operators. Tested.',
 'Limitations tracked per model version. Disclosed in system card.',
 8),

('nist-ai-rmf', 'map-affected-groups',
 'MAP 3 — Impact on Individuals, Communities & Affected Groups',
 'Map & Discover',
 'MAP 3.1–3.5 — AI Impact Context',
 'High', 'Medium', 'ethics',
 'Product / Ethics Lead / Legal',
 'Harms to specific demographic groups undetected until incident; discrimination liability; regulatory enforcement.',
 ARRAY['MAP — Identifying Affected Populations & Risks'],
 ARRAY['Impact assessment documents','Demographic impact analysis','Community engagement records'],
 'No impact assessment on affected groups conducted.',
 'Impact considered informally. No structured documentation.',
 'Impact assessment completed for all material AI systems.',
 'Continuous impact monitoring. Feedback channels with affected communities.',
 9),

('nist-ai-rmf', 'map-third-party',
 'MAP 4 — Third-Party AI Systems & Supply Chain Risk',
 'Map & Discover',
 'MAP 4.1–4.2 — Third-Party Risk',
 'High', 'Medium', 'risk',
 'Procurement / CISO / Legal',
 'Third-party AI systems introduce unmanaged bias, security, or regulatory risk that the organisation inherits.',
 ARRAY['GOVERN — AI Risk Policy & Accountability'],
 ARRAY['Third-party AI vendor inventory','Vendor risk assessments','AI-specific contract clauses','BAA and DPA records'],
 'No inventory of third-party AI. No vendor risk process.',
 'Third-party AI partially inventoried. No formal risk assessment.',
 'Third-party AI inventoried. Risk assessments completed pre-onboarding.',
 'Continuous third-party monitoring. Annual re-assessments. Right-to-audit exercised.',
 10),

('nist-ai-rmf', 'map-risk-likelihood',
 'MAP 5 — Risk Likelihood, Prioritisation & Impact Estimation',
 'Map & Discover',
 'MAP 5.1–5.2 — Risk Prioritisation',
 'Medium', 'Medium', 'risk',
 'Risk / Product / Data Science',
 'High-likelihood AI risks not prioritised; resource allocation misaligned with actual exposure.',
 ARRAY['MAP — Identifying Affected Populations & Risks'],
 ARRAY['AI risk register with likelihood and impact ratings','Prioritisation methodology document','Risk committee minutes'],
 'AI risks not prioritised. No likelihood or impact estimates.',
 'Risks listed but prioritisation informal or inconsistent.',
 'Likelihood and impact assessed for all identified risks. Prioritisation documented.',
 'Dynamic risk prioritisation. Updated after incidents and model changes.',
 11),

('nist-ai-rmf', 'measure-testing-evaluation',
 'MEASURE 2 — AI System Testing, Performance & Robustness',
 'Measure & Assess',
 'MEASURE 2.1–2.13 — Evaluation Methods',
 'High', 'High', 'risk',
 'ML Engineering / QA / Product',
 'AI systems placed in production without adequate testing; unknown performance gaps surface as incidents.',
 ARRAY['MAP 2 — Scientific Basis, Assumptions & Known Limitations'],
 ARRAY['Test plans','Performance evaluation reports','Robustness testing records','Out-of-distribution test results'],
 'No structured testing before AI deployment.',
 'Testing performed but not documented or standardised.',
 'Structured test plans. Performance documented. Robustness assessed.',
 'Automated test suites. Continuous evaluation. Regression detection.',
 12),

('nist-ai-rmf', 'measure-disaggregated',
 'MEASURE 3 — Disaggregated Evaluation & External Expert Review',
 'Measure & Assess',
 'MEASURE 3.1–3.3 — Independent Review',
 'High', 'High', 'ethics',
 'Data Science / External Auditor / Ethics Lead',
 'Systemic bias in AI outputs undetected due to aggregate-only evaluation; harms masked by averaged metrics.',
 ARRAY['MEASURE — Fairness Metrics & Monitoring'],
 ARRAY['Disaggregated evaluation reports','External audit reports','Red team findings','Model cards with demographic breakdown'],
 'No disaggregated evaluation. Aggregate metrics only.',
 'Some disaggregated analysis. Not standardised or complete.',
 'Disaggregated evaluation for all protected characteristics. Documented.',
 'Independent external review. Adversarial testing. Published model cards.',
 13),

('nist-ai-rmf', 'manage-monitoring-drift',
 'MANAGE 3 — Ongoing Monitoring, Drift Detection & Reassessment',
 'Measure & Assess',
 'MANAGE 3.1–3.2 — Monitoring & Drift',
 'High', 'Medium', 'risk',
 'ML Ops / Product / Risk',
 'Model drift and performance degradation go undetected in production; bias introduced post-deployment.',
 ARRAY['MANAGE — Risk Treatment & Incident Response'],
 ARRAY['Monitoring dashboards','Drift detection alert logs','Scheduled reassessment records','Override rate reports'],
 'No monitoring of AI in production.',
 'Ad-hoc monitoring. No drift detection or threshold alerting.',
 'Monitoring in place. Drift thresholds defined. Alerts configured.',
 'Automated drift detection. Scheduled reassessment. Model versioning tracked.',
 14)

ON CONFLICT (policy_id, slug) DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────────────
-- NIST AI RMF — NEW QUESTIONS (4 per new area)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO questions (area_id, policy_id, question_text, clause_ref, guidance, sort_order)
SELECT a.id, 'nist-ai-rmf', q.question_text, q.clause_ref, q.guidance, q.sort_order
FROM areas a
JOIN (VALUES

  -- GOVERN 2 — AI Team Structure & Responsibilities
  ('govern-team-structure', 'Is there a named individual or team accountable for AI system design, development, and deployment decisions?', 'GOVERN 2.1 — Organisational accountability', 'GOVERN 2.1 requires organisational teams to be established and committed to AI accountability and transparency. A named individual — not a committee — must be accountable for each AI system in production. Committee accountability without a named system owner is a governance gap: when incidents occur, accountability diffuses and response is delayed.', 0),
  ('govern-team-structure', 'Are the AI risk management responsibilities of each team (product, engineering, legal, risk) formally defined and documented?', 'GOVERN 2.2 — Cross-functional responsibility', 'GOVERN 2.2 requires organisational teams to have defined roles and responsibilities for AI risk management. A RACI matrix (Responsible, Accountable, Consulted, Informed) covering product, engineering, data science, legal, and risk functions for each stage of the AI lifecycle — design, development, testing, deployment, monitoring, decommissioning — is the expected evidence artefact.', 1),
  ('govern-team-structure', 'Does the organisation have a cross-functional AI risk committee or review board with defined authority?', 'GOVERN 2.1 — Governance committee', 'GOVERN 2.1 requires teams and individuals to be empowered to raise concerns about AI risks. A cross-functional AI risk committee — with representation from legal, engineering, data science, ethics, and business — and with documented authority to block deployment, require redesign, or commission external review, is a mark of mature AI governance.', 2),
  ('govern-team-structure', 'Is there a process for escalating AI risk concerns from practitioners to senior decision-makers without fear of reprisal?', 'GOVERN 2.2 — Psychological safety in AI risk escalation', 'GOVERN 2.2 requires that AI risk management responsibilities are understood across the organisation. Effective escalation requires more than a process — it requires psychological safety. Evidence of effective escalation culture includes: documented escalation events, training on obligation to raise concerns, non-retaliation policies, and senior leadership modelling of responsible AI decision-making.', 3),

  -- GOVERN 3 — AI Workforce Skills & Training
  ('govern-workforce', 'Does the organisation have a defined competency framework for staff working on or with AI systems?', 'GOVERN 3.1 — AI competency framework', 'GOVERN 3.1 requires the organisation to have policies, processes, procedures and practices in place to manage AI risks across the workforce. A competency framework should define: what AI literacy all staff need, what technical skills are required for AI developers and deployers, what governance skills are required for oversight roles, and how competency gaps are identified and addressed.', 0),
  ('govern-workforce', 'Have all staff who deploy, operate, or oversee AI systems completed mandatory AI risk and ethics training?', 'GOVERN 3.2 — Mandatory AI training', 'GOVERN 3.2 requires that individuals in AI-critical roles have the knowledge and skills to address AI risks. Mandatory training is the baseline — completion records, assessed knowledge, and refresher schedules are required evidence. Training that covers only general technology use without AI-specific risk content (bias, override obligations, incident escalation) does not satisfy this requirement.', 1),
  ('govern-workforce', 'Are AI practitioners trained on the obligation to flag performance issues, bias indicators, or safety concerns — and do they understand how to do so?', 'GOVERN 3.2 — Obligation to raise concerns', 'GOVERN 3.2 requires the workforce to understand their responsibilities for AI risk. Practitioners — data scientists, ML engineers, product managers — must be explicitly trained on their obligation to flag concerns, and must have a clear, accessible escalation channel. Training records must cover: what constitutes a risk concern, how to document it, who to escalate to, and the non-retaliation commitment.', 2),
  ('govern-workforce', 'Is AI ethics, fairness, and bias awareness included as a mandatory component of all AI practitioner training?', 'GOVERN 3.2 — Ethics and fairness in training', 'GOVERN 3.2 requires AI risk management knowledge and skills across the workforce. Ethics and fairness training must be mandatory — not optional — for all practitioners who influence AI system design, training data selection, model evaluation, or deployment decisions. Training must go beyond definitions to include practical examples of bias manifestation, fairness metric interpretation, and decision-making under uncertainty.', 3),

  -- GOVERN 5 — Risk Tolerance, Legal & Regulatory Alignment
  ('govern-risk-tolerance', 'Has the organisation documented its AI risk tolerance — the level of AI risk it is willing to accept before requiring treatment?', 'GOVERN 5.1 — AI risk tolerance', 'GOVERN 5.1 requires that organisational risk tolerance for AI is established, communicated, and maintained. Risk tolerance must be specific — not a generic statement about responsible AI — but a defined threshold: acceptable false positive rates, acceptable bias thresholds, acceptable override rates, and acceptable incident frequency per system. Tolerance must be approved at board or senior executive level.', 0),
  ('govern-risk-tolerance', 'Are sector-specific regulatory obligations (e.g. FDA for healthcare AI, OCC for financial AI, EEOC for HR AI) tracked and mapped to internal controls?', 'GOVERN 5.2 — Regulatory obligation mapping', 'GOVERN 5.2 requires that legal and regulatory requirements related to AI are understood and managed. Sector-specific AI regulation is evolving rapidly. Healthcare organisations must track FDA guidance on AI/ML-based SaMD; financial institutions must track OCC, CFPB, and SEC guidance; employers must track EEOC AI hiring guidance. An obligation register mapping each requirement to an internal control owner is required.', 1),
  ('govern-risk-tolerance', 'Is there a process for monitoring regulatory developments in AI and updating internal controls when requirements change?', 'GOVERN 5.2 — Regulatory horizon scanning', 'GOVERN 5.2 requires legal and regulatory requirements to be managed on an ongoing basis. AI regulation is changing faster than most governance cycles. A formal horizon scanning process — with a named owner, defined monitoring sources, and a change management protocol linking regulatory updates to control reviews — is required. Evidence: horizon scanning reports, governance committee minutes reflecting regulatory updates.', 2),
  ('govern-risk-tolerance', 'Are risk tolerance thresholds reviewed and updated when AI systems are significantly modified, scaled, or moved into new contexts?', 'GOVERN 5.1 — Risk tolerance review triggers', 'GOVERN 5.1 requires risk tolerance to be communicated and maintained. Risk tolerance set at initial deployment may be inappropriate after a model update, a change in the user population, a scaling event, or deployment into a new use case. A documented review trigger process — linked to the change management procedure — ensures risk tolerance remains calibrated to actual deployment conditions.', 3),

  -- MAP 1 — Deployment Context & AI Use Case Scoping
  ('map-context-deployment', 'Has the organisation formally documented the intended purpose and scope of each AI system in deployment?', 'MAP 1.1 — Intended use documentation', 'MAP 1.1 requires the context in which the AI system will be deployed to be established and understood. Intended purpose documentation must specify: the problem the AI is designed to solve, the environment in which it will be used, the population it will affect, the decisions it will inform or make, and the constraints on its use. Vendor documentation alone is insufficient — internal intended use documentation must reflect the actual deployment context.', 0),
  ('map-context-deployment', 'Have the conditions under which the AI system should NOT be used been explicitly documented?', 'MAP 1.5 — Conditions and limitations of use', 'MAP 1.5 requires the organisation to understand organisational risk tolerance as it applies to AI system deployment conditions. Negative use cases — the deployment conditions, population types, or decision contexts in which the AI must not be used — are as important as intended use. For healthcare AI, this includes: patient age cohorts outside training data, scan types not in validation data, and clinical contexts where AI performance is unvalidated.', 1),
  ('map-context-deployment', 'Is there a formal risk classification for each AI system (high / limited / minimal risk) documented at the point of procurement or development?', 'MAP 1.6 — AI risk categorisation', 'MAP 1.6 requires the risks of the AI system to be characterised. Risk classification must be performed at the point of decision to procure or develop — not retrospectively. For healthcare AI, FDA software classification as SaMD (Software as Medical Device) must be considered alongside internal risk classification. Evidence: procurement records showing risk classification sign-off, design documentation including risk category.', 2),
  ('map-context-deployment', 'Is AI risk classification reviewed when systems are updated, scaled, or applied in contexts beyond their original design?', 'MAP 1.7 — Classification review on change', 'MAP 1.7 requires the context for the AI system to be re-evaluated as conditions change. An AI system classified as limited risk at initial deployment may become high risk when scaled, applied to a new population, or used in a context with greater stakes. A change management trigger requiring risk reclassification on significant system or context changes is required. Evidence: change log showing risk re-classification reviews.', 3),

  -- MAP 2 — Scientific Basis, Assumptions & Known Limitations
  ('map-scientific-basis', 'Has a model card or equivalent technical documentation been completed for each AI system — covering training data, architecture, performance, and limitations?', 'MAP 2.1 — Scientific documentation', 'MAP 2.1 requires the scientific basis of the AI system to be documented and understood. A model card — or equivalent internal technical documentation — covering: training data characteristics, model architecture, intended and out-of-scope use, performance metrics, fairness evaluation results, and known limitations, provides the foundation for all downstream risk assessment. Without it, risk assessment is speculative.', 0),
  ('map-scientific-basis', 'Are the assumptions embedded in the AI system''s design explicitly documented and reviewed for applicability to the deployment context?', 'MAP 2.2 — Design assumptions', 'MAP 2.2 requires the assumptions and limitations of the AI system to be documented. AI systems embed assumptions: that training data is representative of the deployment population; that the relationships identified in training persist in deployment; that human operators will exercise oversight as designed. Each assumption must be documented, assessed for validity in the actual deployment context, and reviewed when context changes.', 1),
  ('map-scientific-basis', 'Has out-of-distribution performance been tested — specifically for populations or conditions not well-represented in training data?', 'MAP 2.3 — Out-of-distribution testing', 'MAP 2.3 requires the AI system''s limitations to be understood in context. Out-of-distribution (OOD) performance testing assesses how the AI behaves when presented with inputs that differ from its training distribution. For healthcare AI, this means testing on: paediatric patients (if training was adult-only), non-standard image quality, rare conditions, and demographic groups underrepresented in training. OOD failures in production are the most common source of AI-related harm.', 2),
  ('map-scientific-basis', 'Has the AI system vendor provided a system card, datasheet, or equivalent disclosure of training data, performance, and known biases?', 'MAP 2.1 — Vendor AI disclosure', 'MAP 2.1 requires the scientific basis of AI systems to be understood. For third-party AI systems, the vendor must provide equivalent disclosure. Procurement due diligence must include: requesting model cards, system cards, or datasheets from vendors; requiring performance metrics disaggregated by demographic group; and obtaining disclosure of known biases or failure modes. Vendors unwilling to provide this information represent a higher-risk procurement.', 3),

  -- MAP 3 — Impact on Individuals, Communities & Affected Groups
  ('map-affected-groups', 'Has the organisation conducted an AI impact assessment identifying who may be positively and negatively affected by each AI system?', 'MAP 3.1 — AI impact assessment', 'MAP 3.1 requires the AI system''s broader context to be characterised. An AI impact assessment — covering direct users, indirect affected parties, and communities bearing systemic effects — must be documented for each AI system. For healthcare AI, affected groups include: patients, family members who act on clinical information, healthcare workers whose workflows are changed, and populations whose underrepresentation in training data creates differential performance.', 0),
  ('map-affected-groups', 'Have vulnerable groups — including patients with complex presentations, children, elderly patients, and those from underrepresented demographics — been explicitly considered?', 'MAP 3.3 — Vulnerable population assessment', 'MAP 3.3 requires the organisation to understand the AI system''s potential impacts on individuals and communities, specifically those who are vulnerable or marginalised. Vulnerability in healthcare AI extends beyond protected characteristics: patients with rare conditions are under-represented in training data; paediatric patients have physiologically distinct presentations; elderly patients may have co-morbidities that affect AI performance. Each must be explicitly assessed.', 1),
  ('map-affected-groups', 'Is there a process for capturing and acting on feedback from individuals affected by AI system decisions?', 'MAP 3.5 — Feedback from affected parties', 'MAP 3.5 requires the AI system''s broader societal context to be characterised. Feedback channels for affected parties — patients, employees, customers — provide early warning of harms that internal monitoring may miss. Feedback must be: systematically collected, reviewed by someone with authority to act, linked to the AI risk register, and used to update impact assessments. Anonymous reporting mechanisms reduce barriers to feedback.', 2),
  ('map-affected-groups', 'Are equality impact assessments (EIA) or equivalent analyses conducted for AI systems affecting protected characteristics?', 'MAP 3.2 — Equality impact', 'MAP 3.2 requires the AI system''s impacts to be characterised across relevant dimensions. An Equality Impact Assessment (EIA) — or equivalent disparate impact analysis — evaluates whether AI system outputs systematically disadvantage individuals on the basis of protected characteristics (gender, race, age, disability, religion). For regulated sectors, EIA may be a legal obligation. Evidence: completed EIA documents, sign-off records, and evidence of findings incorporated into system design.', 3),

  -- MAP 4 — Third-Party AI Systems & Supply Chain Risk
  ('map-third-party', 'Is there a complete inventory of all third-party AI systems and components used by the organisation?', 'MAP 4.1 — Third-party AI inventory', 'MAP 4.1 requires the risks or benefits from third-party entities — including AI vendors, open-source model providers, and AI-powered SaaS tools — to be understood. The inventory must cover: vendor name, system/model used, purpose, data shared with vendor, contractual terms, and risk classification. Shadow AI — third-party AI tools adopted by business units without IT or governance knowledge — is the most critical gap in most organisations'' third-party AI inventories.', 0),
  ('map-third-party', 'Are third-party AI vendors assessed for AI-specific risks (bias, data quality, security, regulatory compliance) before onboarding?', 'MAP 4.1 — Vendor due diligence', 'MAP 4.1 requires third-party AI risks to be characterised. Vendor due diligence for AI must go beyond standard IT security assessments to include: bias testing evidence for the vendor''s models, training data provenance and quality documentation, regulatory compliance status (FDA, EU AI Act), security of model APIs, and incident notification obligations. Due diligence evidence must be obtained before contract signature, not after deployment.', 1),
  ('map-third-party', 'Do vendor contracts for AI systems include AI-specific obligations — bias testing, performance disclosure, incident notification, audit rights?', 'MAP 4.2 — AI contractual protections', 'MAP 4.2 requires the risks from third-party entities to be documented and managed. AI contracts must include: obligations to disclose known biases and performance limitations; notification requirements for model updates that may affect performance; right-to-audit on bias testing and performance data; data processing agreements for any personal data used in training or inference; and liability allocation for AI-related harms. Standard IT contracts do not cover these obligations.', 2),
  ('map-third-party', 'Is there a process for reassessing third-party AI vendors when they update their models or change their data practices?', 'MAP 4.1 — Ongoing vendor monitoring', 'MAP 4.1 requires third-party AI risks to be understood on an ongoing basis. Vendor model updates — which may change performance characteristics, introduce new limitations, or alter bias profiles — must trigger a reassessment of the vendor''s AI risk profile. This requires: contractual notification obligations on the vendor for model updates, an internal process for evaluating the impact of updates, and a documented decision on whether to continue using the updated model.', 3),

  -- MAP 5 — Risk Likelihood, Prioritisation & Impact Estimation
  ('map-risk-likelihood', 'Are likelihood and impact ratings assigned to each identified AI risk using a documented, consistent methodology?', 'MAP 5.1 — Risk likelihood and impact', 'MAP 5.1 requires identified AI risks to be prioritised. Likelihood and impact ratings must be: defined using a documented scale (e.g. 1–5 with anchored descriptors), applied consistently across all AI risks by trained assessors, reviewed at defined intervals, and updated following incidents or significant system changes. Ratings based on gut feel rather than anchored criteria are inconsistent and cannot be defended to auditors or regulators.', 0),
  ('map-risk-likelihood', 'Is the prioritised risk list reviewed by a risk committee or senior decision-maker with authority to allocate resources for treatment?', 'MAP 5.2 — Risk prioritisation review', 'MAP 5.2 requires identified AI risks to be communicated to relevant decision-makers. The risk prioritisation review must result in documented decisions — which risks will be treated, in what sequence, with what resources, and by what date. Risks that are identified but not prioritised and resourced for treatment are worse than not identifying them: they create documented awareness of harm without action, which is a significant liability in regulatory and litigation contexts.', 1),
  ('map-risk-likelihood', 'Are high-likelihood, high-impact AI risks escalated to board or senior executive level for decision and resource allocation?', 'MAP 5.1 — Escalation of critical risks', 'MAP 5.1 requires AI risks to be prioritised in a way that reflects their significance. Critical risks — those combining high likelihood and high impact — must be escalated beyond the risk function to the board or senior executive committee for resource and accountability decisions. Evidence: board/committee papers showing critical AI risks, decision records, and tracking of treatment status against board commitments.', 2),
  ('map-risk-likelihood', 'Is the AI risk register reviewed and updated on a defined schedule and after every AI incident or significant system change?', 'MAP 5.2 — Risk register maintenance', 'MAP 5.2 requires AI risks to be communicated and maintained. A risk register that is populated once and not updated is not a risk management tool — it is a compliance exercise. Update triggers must include: defined review schedule (minimum quarterly), every AI incident, every significant model update, and every new regulatory guidance publication. Evidence: risk register with version history, update timestamps, and review records.', 3),

  -- MEASURE 2 — AI System Testing, Performance & Robustness
  ('measure-testing-evaluation', 'Is there a documented test plan for each AI system covering functional performance, edge cases, and out-of-distribution inputs?', 'MEASURE 2.1 — Test planning', 'MEASURE 2.1 requires AI risk management methods and metrics to be established for each AI system. A test plan must cover: intended use performance (accuracy, precision, recall), edge case performance (rare inputs, boundary conditions), out-of-distribution inputs (inputs that differ from training distribution), and adversarial robustness (inputs designed to manipulate outputs). Test plans must be documented before testing begins — not inferred from test results after the fact.', 0),
  ('measure-testing-evaluation', 'Are performance benchmarks defined before testing, not calibrated to match observed results?', 'MEASURE 2.5 — Pre-defined benchmarks', 'MEASURE 2.5 requires AI system performance to be evaluated against documented criteria. Performance benchmarks — minimum acceptable accuracy, maximum acceptable false positive/negative rates, demographic parity thresholds — must be defined before testing. Benchmarks adjusted to match observed results invalidate the entire evaluation process. Evidence: dated benchmark documentation predating test results, and governance records showing benchmark approval.', 1),
  ('measure-testing-evaluation', 'Has robustness testing been conducted — including adversarial inputs, data quality degradation, and distribution shift scenarios?', 'MEASURE 2.6 — Robustness testing', 'MEASURE 2.6 requires evaluation of AI system performance across conditions likely to be encountered in deployment. Robustness testing must cover: adversarial inputs crafted to manipulate outputs; degraded input quality (for healthcare AI: low-quality scans, unusual patient presentations); and distribution shift (changes in the deployment population relative to training population). Robustness failures in production are often more consequential than standard performance failures.', 2),
  ('measure-testing-evaluation', 'Are test results documented in a standardised format and retained as evidence for audit purposes?', 'MEASURE 2.13 — Test documentation', 'MEASURE 2.13 requires evaluation results to be documented and retained. Standardised test documentation — covering test scope, methodology, inputs used, results obtained, benchmarks applied, findings raised, and sign-off — creates an auditable evidence trail. For regulated AI (healthcare, financial, employment), test records may be subject to regulatory inspection or discovery in litigation. Retention periods must align with regulatory requirements and litigation risk.', 3),

  -- MEASURE 3 — Disaggregated Evaluation & External Expert Review
  ('measure-disaggregated', 'Are AI system performance metrics disaggregated by gender, age, ethnicity, and other protected characteristics — not reported as aggregate averages only?', 'MEASURE 3.1 — Disaggregated performance reporting', 'MEASURE 3.1 requires the AI system to be evaluated for the risks it presents to all affected individuals and communities. Aggregate performance metrics mask group-level disparities. A model with 91% overall sensitivity may have 87% sensitivity for one demographic group — a clinically significant gap invisible in aggregate reporting. Disaggregated metrics must be reported per protected characteristic for all material AI systems, with findings documented and escalated where disparities exceed thresholds.', 0),
  ('measure-disaggregated', 'Has an independent expert — internal ethics review, external auditor, or specialist firm — reviewed AI system bias evaluation results?', 'MEASURE 3.2 — Independent review', 'MEASURE 3.2 requires AI system evaluation to be reviewed by internal experts involved in AI system development. Independence in bias evaluation is critical — evaluators who built the model cannot objectively assess its fairness. Internal ethics review (where it exists), external AI auditors, or specialist fairness testing firms provide the independence required. Evidence: independent review engagement letter, review methodology, findings report.', 1),
  ('measure-disaggregated', 'Are red team or adversarial bias testing exercises conducted — specifically testing whether the AI system produces systematically different outputs for different demographic groups?', 'MEASURE 3.3 — Adversarial bias testing', 'MEASURE 3.3 requires AI risk measurement to include structured adversarial testing. Adversarial bias testing goes beyond standard evaluation: testers actively attempt to find inputs or conditions under which the AI produces discriminatory outputs. For healthcare AI, this includes: same presentation with different patient demographics, testing with images from demographic groups underrepresented in training, and systematic variation of non-clinical attributes to test for stereotyping.', 2),
  ('measure-disaggregated', 'Are evaluation results — including disaggregated metrics and independent review findings — documented in a model card or equivalent disclosure?', 'MEASURE 3.1 — Evaluation disclosure', 'MEASURE 3.1 requires AI risks to be evaluated and documented. A model card — published internally for operator review and externally where required — must include disaggregated performance metrics, fairness evaluation results, independent review findings, and known limitations. Evaluation documentation that is retained internally but not shared with operators who depend on the AI for consequential decisions creates an information asymmetry that is a governance and liability risk.', 3),

  -- MANAGE 3 — Ongoing Monitoring, Drift Detection & Reassessment
  ('manage-monitoring-drift', 'Are AI systems monitored in production for performance drift — and are thresholds defined that trigger investigation and intervention?', 'MANAGE 3.1 — Production monitoring', 'MANAGE 3.1 requires AI risks from use to be monitored and managed. Production monitoring must track: accuracy metrics over time, false positive and false negative rates, output distribution shifts (model drift), and changes in the input data distribution (data drift). Thresholds — the deviation from baseline that triggers investigation — must be predefined, documented, and linked to an escalation process. Monitoring dashboards with no alert thresholds or escalation paths do not satisfy this requirement.', 0),
  ('manage-monitoring-drift', 'Are override or rejection rates tracked and reviewed as an indicator of AI performance and user trust?', 'MANAGE 3.1 — Override rate monitoring', 'MANAGE 3.1 requires AI system risks to be monitored in deployment. Human override rates — the frequency with which operators reject or modify AI outputs — are a leading indicator of AI performance issues and user trust degradation. An increasing override rate signals that operators are losing confidence in AI outputs. A decreasing override rate in a high-stakes context may signal inappropriate overreliance. Both require investigation. Override rates must be tracked, reported, and reviewed on a defined schedule.', 1),
  ('manage-monitoring-drift', 'Is there a scheduled reassessment of AI systems — covering performance, fairness, and deployment context — at defined intervals and after significant events?', 'MANAGE 3.2 — Periodic reassessment', 'MANAGE 3.2 requires planned responses to AI risks to be implemented on a defined schedule. Periodic reassessment — at minimum annually, and after every significant system change, incident, or regulatory update — must cover: current performance against benchmarks, fairness metrics against thresholds, changes in the deployment population, and adequacy of controls. Evidence: dated reassessment reports, governance committee sign-off, and tracking of findings to resolution.', 2),
  ('manage-monitoring-drift', 'Is there a documented process for decommissioning AI systems that no longer perform within acceptable parameters?', 'MANAGE 3.2 — AI decommissioning', 'MANAGE 3.2 requires plans for AI systems that are no longer meeting performance expectations. Decommissioning must be a planned process — not an emergency response. The process must cover: the triggers for initiating decommissioning (performance below threshold for defined period, regulatory non-compliance, irremediable bias), transition to alternative processes, disposal of training data and model artefacts, and notification of affected parties. Decommissioning without a plan leaves operators using a model beyond its safe operational life.', 3)

) AS q(slug, question_text, clause_ref, guidance, sort_order)
ON a.policy_id = 'nist-ai-rmf' AND a.slug = q.slug
ON CONFLICT (area_id, sort_order) DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────────────
-- EU AI ACT — EXPANDED AREAS (adds 6 new areas to existing 6)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO areas (policy_id, slug, area_name, phase_group, regulatory_ref, priority, effort, pillar, stakeholder, risk_if_not_addressed, iso_mapping, dependencies, evidence_to_collect, maturity_not_started, maturity_developing, maturity_defined, maturity_optimised, sort_order) VALUES

('eu-ai-act', 'transparency-disclosure',
 'Transparency & User Disclosure',
 'Govern & Scope',
 'Art. 13 — Transparency obligations for high-risk AI',
 'High', 'Medium', 'ethics',
 'Product / Legal / UX',
 'Operators unaware AI is in use; users cannot exercise rights over automated decisions; enforcement action under Art. 13.',
 ARRAY['Cl. 8.5 — Information to Users', 'Annex A.8.3 — Transparency'],
 ARRAY['AI System Inventory & Risk Classification'],
 ARRAY['User disclosure notices','Instructions for use documentation','AI system transparency statements'],
 'No disclosure that AI is used. Users unaware.',
 'Disclosure exists for some systems. Format inconsistent.',
 'Disclosure on all high-risk AI. Standardised format. Instructions for use complete.',
 'Disclosure reviewed after each model update. User testing confirms comprehension.',
 7),

('eu-ai-act', 'technical-documentation',
 'Technical Documentation & Record-Keeping',
 'Map & Discover',
 'Art. 11, Annex IV — Technical documentation',
 'High', 'High', 'governance',
 'Engineering / Product / Legal',
 'Cannot demonstrate regulatory compliance; enforcement action; CE marking unavailable.',
 ARRAY['Cl. 8.3 — AI System Operation', 'Annex A.6.2'],
 ARRAY['High-Risk AI — Conformity Assessment'],
 ARRAY['Technical documentation packages','System architecture diagrams','Training methodology records','Performance evaluation reports'],
 'No technical documentation. AI system design undocumented.',
 'Documentation partial. Key sections missing.',
 'Full Annex IV documentation complete for all high-risk AI.',
 'Documentation version-controlled. Updated on every significant change.',
 8),

('eu-ai-act', 'post-market-monitoring',
 'Post-Market Monitoring & Serious Incident Reporting',
 'Measure & Assess',
 'Art. 72–73 — Post-market monitoring and serious incident reporting',
 'High', 'Medium', 'risk',
 'Product / Legal / CISO',
 'Serious incidents unreported to market surveillance authority; regulatory breach; inability to demonstrate safe deployment.',
 ARRAY['Cl. 9.2 — Performance Monitoring', 'Annex A.10 — Monitoring'],
 ARRAY['High-Risk AI — Conformity Assessment'],
 ARRAY['Post-market monitoring plan','Serious incident register','National authority notification records'],
 'No post-market monitoring plan. Incidents not tracked.',
 'Monitoring ad-hoc. No formal serious incident reporting process.',
 'Monitoring plan in place. Serious incident reporting procedure documented.',
 'Automated monitoring with threshold alerts. Reporting tested in tabletop exercise.',
 9),

('eu-ai-act', 'general-purpose-ai',
 'General-Purpose AI (GPAI) Model Obligations',
 'Govern & Scope',
 'Art. 51–55 — GPAI model obligations',
 'High', 'High', 'governance',
 'CTO / Legal / Product',
 'GPAI model obligations unmanaged since August 2025 commencement; regulatory exposure for providers and deployers.',
 ARRAY['Cl. 4.1 — Organisational Context'],
 ARRAY[],
 ARRAY['GPAI model inventory','Training data documentation','Copyright compliance evidence','Systemic risk assessment'],
 'GPAI obligations unknown. No assessment conducted.',
 'GPAI models identified. Obligations being assessed.',
 'GPAI inventory complete. Obligations mapped. Documentation in progress.',
 'GPAI compliance programme operational. Systemic risk assessment complete.',
 10),

('eu-ai-act', 'prohibited-use-emotion',
 'Emotion Recognition & Biometric Categorisation Controls',
 'Govern & Scope',
 'Art. 5(1)(f), Art. 5(1)(g) — Prohibited biometric uses',
 'High', 'Low', 'ethics',
 'Legal / HR / Product',
 'Use of prohibited emotion recognition or biometric categorisation in workplace or public space triggers maximum fines.',
 ARRAY['Cl. 5.2 — AI Policy', 'Annex A.3 — Prohibited Uses'],
 ARRAY['Prohibited AI Uses — Identification & Cessation'],
 ARRAY['Workplace AI policy','Emotion recognition use case register','Legal opinion on biometric classification'],
 'No assessment of emotion recognition or biometric categorisation use.',
 'Review in progress. Some use cases flagged.',
 'All use cases reviewed. Prohibited uses confirmed absent or ceased.',
 'Pre-deployment screening mandatory. Legal sign-off for any biometric AI.',
 11),

('eu-ai-act', 'notified-body-certification',
 'Notified Body Assessment & CE Marking',
 'Measure & Assess',
 'Art. 43–44 — Third-party conformity assessment',
 'High', 'High', 'governance',
 'Legal / Product / Engineering',
 'High-risk AI systems placed on EU market without CE marking; market withdrawal and enforcement action.',
 ARRAY['Cl. 8.3 — AI System Certification'],
 ARRAY['High-Risk AI — Conformity Assessment', 'Technical Documentation & Record-Keeping'],
 ARRAY['Notified body engagement records','CE Declaration of Conformity','EU AI database registration confirmations','Quality management system documentation'],
 'No notified body assessment. CE marking not in scope.',
 'Notified body identified. Assessment scope being defined.',
 'Notified body assessment complete. CE marking obtained for all qualifying systems.',
 'Certification maintained. Annual surveillance. Changes notified immediately.',
 12)

ON CONFLICT (policy_id, slug) DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────────────
-- EU AI ACT — NEW QUESTIONS
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO questions (area_id, policy_id, question_text, clause_ref, guidance, sort_order)
SELECT a.id, 'eu-ai-act', q.question_text, q.clause_ref, q.guidance, q.sort_order
FROM areas a
JOIN (VALUES

  ('transparency-disclosure', 'Do users and operators receive clear, accessible information that an AI system is being used and what decisions it informs?', 'Art. 13(1) — Transparency obligation', 'Article 13(1) requires high-risk AI systems to be designed and developed to ensure sufficient transparency so that deployers can interpret outputs and use them appropriately. Disclosure must be in plain language, presented at the point of AI system use — not buried in terms and conditions — and must explain: that AI is involved, what the AI does, what data it uses, and how to seek human review of AI-informed decisions.', 0),
  ('transparency-disclosure', 'Is there a documented "instructions for use" for each high-risk AI system provided to deployers?', 'Art. 13(3), Annex IV §2 — Instructions for use', 'Article 13(3) and Annex IV require providers to supply deployers with instructions for use covering: the intended purpose, the performance metrics, the limitations, the expected lifetime, the maintenance and monitoring requirements, and the data requirements. Instructions for use are a mandatory technical documentation component — their absence is a nonconformity in both EU AI Act compliance and ISO 42001 certification audit.', 1),
  ('transparency-disclosure', 'Are individuals subject to high-risk AI decisions informed of the AI''s role and their right to request human review?', 'Art. 13(1), Art. 86 — Right to explanation', 'Article 13(1) requires transparency as a design requirement. Article 86 gives individuals the right to obtain an explanation of AI-informed decisions. For employment, credit, healthcare, and education AI, individuals must be informed: that an AI system was used, what data was relied upon, what the output was, and how to exercise their right to human review. This right must be operationally accessible — not a theoretical entitlement buried in a privacy policy.', 2),
  ('transparency-disclosure', 'Is there a process for updating user disclosure when the AI system''s intended use, performance, or limitations change significantly?', 'Art. 13 — Transparency maintenance', 'Article 13 transparency obligations apply throughout the system''s operational life — not only at initial deployment. When a model update changes performance characteristics, when the system is deployed in a new context, or when significant limitations are identified post-deployment, disclosure must be updated. Evidence: version-controlled disclosure documents, change management records showing disclosure review, and user notification procedures.', 3),

  ('technical-documentation', 'Is a complete Annex IV technical documentation package maintained for each high-risk AI system?', 'Art. 11, Annex IV — Technical documentation requirement', 'Article 11 requires providers to draw up technical documentation before placing high-risk AI on the market. Annex IV specifies the required content: general system description, detailed design specifications, monitoring and control elements, validation and testing procedures, post-deployment monitoring plan, and cybersecurity measures. Each section must be populated — a partially complete package is non-compliant. Documentation must be maintained for 10 years after the system is placed on the market or put into service.', 0),
  ('technical-documentation', 'Is the technical documentation kept current and updated following significant changes to the AI system?', 'Art. 11, Art. 43(4) — Documentation updates', 'Article 11 requires technical documentation to be updated following significant changes. Article 43(4) requires a new conformity assessment when a change may affect compliance. A change management process must trigger documentation review: when training data is updated, when model architecture changes, when the intended purpose is expanded, or when significant performance changes are detected. Evidence: version-controlled documentation, change log, and sign-off records.', 1),
  ('technical-documentation', 'Is the technical documentation retained for the required 10-year period and accessible to market surveillance authorities on request?', 'Art. 11(3) — Documentation retention', 'Article 11(3) requires technical documentation to be kept for 10 years after the AI system is placed on the market or put into service. Retention must be: in a format accessible on request by national market surveillance authorities, with clear chain of custody, and covering all versions of the system over the retention period. Cloud storage without access controls, retention policies, or audit trails does not satisfy this requirement.', 2),
  ('technical-documentation', 'Has a Fundamental Rights Impact Assessment (FRIA) been integrated into the technical documentation for each high-risk AI deployment?', 'Art. 27, Annex IV — FRIA in documentation', 'Article 27 requires deployers of high-risk AI to conduct a FRIA before deployment. The FRIA must form part of the technical documentation package. It must cover: the fundamental rights at risk, the groups potentially affected, the likelihood and severity of impact, and the controls in place. For AI used in healthcare, employment, credit, and education, the FRIA must address gender, ethnicity, age, and disability. A FRIA that is completed after deployment, or that does not address intersectional impacts, is non-compliant.', 3),

  ('post-market-monitoring', 'Is there a post-market monitoring plan for each high-risk AI system covering performance metrics, incident triggers, and review schedules?', 'Art. 72 — Post-market monitoring obligation', 'Article 72 requires providers to put in place a post-market monitoring system covering all AI systems placed on the market or put into service. The monitoring plan must specify: the performance metrics to be tracked, the thresholds that trigger investigation, the review schedule, the responsible owner, and the process for incorporating monitoring findings into system improvements. A monitoring plan is a mandatory technical documentation component — absence is a nonconformity.', 0),
  ('post-market-monitoring', 'Is there a documented process for identifying and reporting serious incidents to the relevant national market surveillance authority?', 'Art. 73 — Serious incident reporting', 'Article 73 requires providers to report serious incidents to national market surveillance authorities without delay. A serious incident is defined as any incident that results in death, serious harm to health, serious damage to property, or causes harm to society. The reporting process must include: incident identification criteria, the reporting timeline (3 days for life-threatening incidents, 10 days for serious harm), the authority to be notified by country, and the format required. Untested reporting processes are not credible compliance evidence.', 1),
  ('post-market-monitoring', 'Are serious incidents documented, root-caused, and used to update risk assessments and conformity documentation?', 'Art. 73, Art. 9 — Incident learning', 'Article 73 requires serious incidents to be reported. Article 9 requires risk management to be updated based on operational experience. Incidents must not only be reported — they must be root-caused, analysed for systemic implications, and used to update risk assessments, technical documentation, and where necessary trigger a new conformity assessment. An incident that is reported but not root-caused or acted upon is a governance failure and a risk of repeat harm.', 2),
  ('post-market-monitoring', 'Are post-market monitoring results reported to the deployer and, where applicable, shared with the original provider?', 'Art. 72(4) — Monitoring data sharing', 'Article 72(4) requires providers to share monitoring data with deployers where relevant. Where the deployer is separately operating a high-risk AI system, monitoring data — including performance degradation findings, bias indicators, and serious incidents — must flow between provider and deployer. Contractual arrangements must specify data sharing obligations, timing, and format. Monitoring data retained only by one party creates a compliance gap.', 3),

  ('general-purpose-ai', 'Has the organisation identified all GPAI models used or developed — and assessed whether they meet the threshold for systemic risk classification?', 'Art. 51 — GPAI systemic risk classification', 'Article 51 requires providers of GPAI models to notify the Commission where training uses more than 10^25 FLOPs of compute — a threshold indicating potential systemic risk. Organisations using GPAI models from external providers must assess whether those providers have notified the Commission and whether the model is systemic-risk classified. For deployers, systemic-risk GPAI creates additional due diligence obligations beyond standard third-party AI assessment.', 0),
  ('general-purpose-ai', 'Is training data for internally developed GPAI models documented, with copyright compliance evidence for internet-scraped content?', 'Art. 53(1)(c) — GPAI training data documentation', 'Article 53(1)(c) requires GPAI model providers to draw up and keep up to date technical documentation on training data including copyright compliance. For internet-scraped training data, this requires: documentation of the scraping methodology, implementation of opt-out mechanisms respecting robots.txt and text and data mining (TDM) reservation notices, and evidence of copyright clearance for data where licences are required. Copyright non-compliance in GPAI training data is an enforcement and litigation risk.', 1),
  ('general-purpose-ai', 'Are GPAI model providers assessed for their compliance with Art. 53 obligations — technical documentation, copyright compliance, and transparency?', 'Art. 53 — GPAI provider obligations', 'Article 53 requires GPAI model providers to comply with obligations covering: technical documentation, copyright compliance, deployment transparency, and cooperation with downstream deployers. Organisations using externally provided GPAI models must conduct due diligence on provider compliance. A provider who cannot demonstrate Art. 53 compliance creates downstream regulatory risk for deployers who build products using their models. Evidence: vendor Art. 53 compliance attestation, technical documentation review.', 2),
  ('general-purpose-ai', 'Is there a policy governing the internal use of publicly available GPAI models (e.g. open-source LLMs) — including permitted use cases, prohibited uses, and data governance?', 'Art. 53, Art. 5 — GPAI internal use governance', 'Article 53 obligations apply to GPAI model providers — but deployers using GPAI models remain subject to the full EU AI Act obligations for the systems they deploy. Open-source GPAI models used internally require the same governance as proprietary models: intended use documentation, data governance for prompts and outputs, prohibition on using GPAI for prohibited applications (Art. 5), and output monitoring. An internal GPAI use policy is a prerequisite for compliant deployment.', 3),

  ('prohibited-use-emotion', 'Has the organisation assessed whether any AI system uses emotion recognition or infers emotional states from biometric data — and if so, in what context?', 'Art. 5(1)(f) — Emotion recognition prohibition', 'Article 5(1)(f) prohibits the placing on the market, putting into service, or use of AI systems that infer emotions of natural persons in the areas of workplace and education institutions — except for safety or medical reasons. Emotion recognition uses must be fully mapped. Systems marketed as "engagement analytics," "attention detection," or "sentiment analysis" may constitute prohibited emotion recognition. Evidence: use case register, legal opinion on each identified system.', 0),
  ('prohibited-use-emotion', 'Has the organisation confirmed it does not use real-time remote biometric identification in publicly accessible spaces — and if an exception applies, is prior authorisation obtained?', 'Art. 5(1)(h) — Real-time biometric identification prohibition', 'Article 5(1)(h) prohibits real-time remote biometric identification systems in publicly accessible spaces except in narrowly defined circumstances requiring prior authorisation from a judicial or independent administrative authority. The prohibition applies regardless of whether the system is used for security, law enforcement, or commercial purposes. An organisation using any system that identifies individuals in real time in public spaces must confirm its legality with legal counsel before deployment.', 1),
  ('prohibited-use-emotion', 'Is there a pre-deployment legal review process for any new AI capability involving biometric data, emotional inference, or social scoring?', 'Art. 5 — Prohibited use pre-deployment screening', 'Article 5 prohibitions are absolute — there is no risk-based exception for prohibited uses. A pre-deployment legal review that explicitly checks new AI systems against each Art. 5 prohibited category is the minimum control. This review must be: mandatory (not optional), completed before deployment begins, documented with findings recorded, and signed off by legal counsel. Evidence: pre-deployment legal review checklist, sign-off records for all AI systems in the past 12 months.', 2),
  ('prohibited-use-emotion', 'Are staff trained on what constitutes a prohibited AI use under Art. 5 and their obligation to report potential prohibited use cases they encounter?', 'Art. 5 — Awareness of prohibitions', 'Article 5 prohibitions are effective from August 2025. Staff — particularly in product, marketing, HR, and commercial functions — who may encounter or commission AI systems that border on prohibited uses must be trained on: what each prohibition covers, examples of borderline and clearly prohibited systems, and their obligation to escalate potential prohibited use cases for legal review before procurement or development proceeds. Evidence: training completion records, training content showing Art. 5 coverage.', 3),

  ('notified-body-certification', 'Which high-risk AI systems require third-party conformity assessment by a notified body — and has engagement with an accredited body been initiated?', 'Art. 43(1) — Third-party assessment requirement', 'Article 43(1) requires third-party conformity assessment by a notified body for high-risk AI systems in Annex III categories where no harmonised standard is applied, for biometric systems, and for critical infrastructure AI. The provider must engage a notified body accredited under the EU AI Act before placing the system on the market. Notified body capacity is limited — long lead times should be anticipated, and engagement should begin well in advance of planned market placement.', 0),
  ('notified-body-certification', 'Is a CE Declaration of Conformity prepared and signed by the provider for each high-risk AI system placed on the EU market?', 'Art. 47 — EU Declaration of Conformity', 'Article 47 requires providers to draw up an EU Declaration of Conformity before placing a high-risk AI system on the market. The Declaration must specify: the AI system, the provider, the notified body (where applicable), the harmonised standards applied, the conformity assessment procedure followed, and a statement that the system conforms to the Act. The Declaration must be kept for 10 years. A CE marking affixed without a signed Declaration is a criminal offence in most member states.', 1),
  ('notified-body-certification', 'Is the AI system registered in the EU AI Act database before being placed on the market or put into service?', 'Art. 49, Art. 71 — EU AI database registration', 'Article 49 requires high-risk AI systems to be registered in the EU AI database established under Article 71 before being placed on the market or put into service. The registration must include: provider details, system description, intended purpose, conformity assessment reference, and notified body (where applicable). For deployers of high-risk AI developed by third-party providers, the deployer must confirm registration in due diligence before deployment. Unregistered systems cannot lawfully be placed on the EU market.', 2),
  ('notified-body-certification', 'Is there a quality management system in place covering AI system design, development, testing, and post-market monitoring as required for CE marking?', 'Art. 17 — Quality management system', 'Article 17 requires providers of high-risk AI to implement a quality management system covering: risk management, training data governance, technical documentation, logging, transparency and information to users, human oversight, accuracy and robustness, and cybersecurity. The QMS must be documented, implemented, and maintained. For ISO 42001-certified organisations, the AIMS may satisfy substantial portions of the QMS requirement — but specific EU AI Act elements not covered by ISO 42001 must be added.', 3)

) AS q(slug, question_text, clause_ref, guidance, sort_order)
ON a.policy_id = 'eu-ai-act' AND a.slug = q.slug
ON CONFLICT (area_id, sort_order) DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────────────
-- ISO 42001 — EXPANDED AREAS (adds 5 new areas to existing 4)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO areas (policy_id, slug, area_name, phase_group, regulatory_ref, priority, effort, pillar, stakeholder, risk_if_not_addressed, dependencies, evidence_to_collect, maturity_not_started, maturity_developing, maturity_defined, maturity_optimised, sort_order) VALUES

('iso-42001', 'aims-scope',
 'Clause 4–5: AIMS Scope, Boundaries & Leadership',
 'Govern & Scope',
 'Cl. 4.3 — AIMS scope; Cl. 5.1 — Leadership commitment',
 'High', 'Low', 'governance',
 'Board / CEO / Head of AI',
 'AIMS scope poorly defined; leadership not committed; certification audit fails at the first major clause.',
 ARRAY['GOVERN — AI Risk Policy & Accountability'],
 ARRAY['Documented AIMS scope statement','Board-approved AI policy','Leadership review records'],
 'No AIMS scope defined. Board not engaged.',
 'Scope being drafted. Leadership commitment informal.',
 'Scope formally documented and approved. Policy in place.',
 'Scope reviewed annually. Leadership audit conducted quarterly.',
 4),

('iso-42001', 'objectives-planning',
 'Clause 6: AI Objectives, Planning & Change Management',
 'Govern & Scope',
 'Cl. 6.2 — AI objectives; Cl. 6.3 — Planning of changes',
 'Medium', 'Medium', 'governance',
 'Head of AI / Risk / Product',
 'No measurable AI objectives; change management ad-hoc; AIMS improvement untargeted.',
 ARRAY['Clause 4–5: AIMS Scope, Boundaries & Leadership'],
 ARRAY['AI objectives register','Change management procedure','Planning records'],
 'No AI objectives defined. No change planning process.',
 'Objectives drafted. Change management informal.',
 'Measurable AI objectives set. Change management procedure in place.',
 'Objectives performance-tracked. Changes planned and impact-assessed.',
 5),

('iso-42001', 'operation-controls',
 'Clause 8: AI System Operation & Development Controls',
 'Map & Discover',
 'Cl. 8.2 — AI system impact; Cl. 8.3 — Operational controls; Cl. 8.5 — Responsible AI use',
 'High', 'High', 'risk',
 'Product / Engineering / ML',
 'AI systems developed and deployed without operational controls; conformity gaps emerge at certification audit.',
 ARRAY['Clause 6: AI Objectives, Planning & Change Management'],
 ARRAY['Operational control documentation','Development procedure','Testing and validation records','Responsible AI use policy'],
 'No operational controls on AI development or deployment.',
 'Controls partial. Development procedure incomplete.',
 'Operational controls documented for all material AI systems.',
 'Controls integrated in CI/CD. Automated control verification.',
 6),

('iso-42001', 'supplier-controls',
 'Annex A.10: Third-Party AI Supplier Controls',
 'Map & Discover',
 'Annex A.10.2 — AI system acquisition; Annex A.10.3 — Third-party relationships',
 'High', 'Medium', 'governance',
 'Procurement / Legal / Head of AI',
 'Third-party AI systems acquired without due diligence; unmanaged bias, security, and compliance risk.',
 ARRAY['Clause 8: AI System Operation & Development Controls'],
 ARRAY['AI supplier register','Supplier due diligence records','AI-specific contract clauses','Supplier audit records'],
 'No supplier controls for AI. Third-party AI unmanaged.',
 'Supplier register exists. Due diligence inconsistent.',
 'Supplier register complete. Due diligence performed pre-onboarding.',
 'Continuous supplier monitoring. Annual re-assessments. Audit rights exercised.',
 7),

('iso-42001', 'performance-evaluation',
 'Clause 9: Performance Evaluation & Management Review',
 'Measure & Assess',
 'Cl. 9.1 — Monitoring; Cl. 9.2 — Internal audit; Cl. 9.3 — Management review',
 'High', 'Medium', 'governance',
 'Head of AI / Audit / Board',
 'AIMS performance not evaluated; management review absent; certification maintenance fails.',
 ARRAY['Clause 8: AI System Operation & Development Controls'],
 ARRAY['KPI monitoring reports','Internal audit programme and reports','Management review minutes'],
 'No AIMS performance monitoring. No internal audit.',
 'Monitoring ad-hoc. Audit conducted once but not programmed.',
 'KPIs monitored. Internal audit programme active. Management review conducted.',
 'Continuous monitoring. Annual audit. Board-level management review recorded.',
 8)

ON CONFLICT (policy_id, slug) DO NOTHING;


-- ISO 42001 — NEW QUESTIONS

INSERT INTO questions (area_id, policy_id, question_text, clause_ref, guidance, sort_order)
SELECT a.id, 'iso-42001', q.question_text, q.clause_ref, q.guidance, q.sort_order
FROM areas a
JOIN (VALUES

  ('aims-scope', 'Has the organisation formally documented the scope of its AI management system — including which AI systems, processes, and locations are in scope?', 'Cl. 4.3 — AIMS scope', 'Clause 4.3 requires the scope of the AI management system to be determined and documented. The scope statement must specify: which AI systems are included, which organisational units are covered, which locations are in scope, and any AI systems or processes that are excluded and the justification for exclusion. A scope that is too narrow (excluding high-risk AI) or undefined creates a certification audit failure. Scope must be documented before the AIMS can be effectively implemented.', 0),
  ('aims-scope', 'Has top management demonstrated leadership commitment to the AIMS — including allocating resources, setting direction, and promoting a responsible AI culture?', 'Cl. 5.1 — Leadership commitment', 'Clause 5.1 requires top management to demonstrate leadership and commitment to the AIMS. Evidence of commitment must go beyond signing an AI policy: board-approved AI objectives, dedicated AI governance resources (budget, personnel), management review participation, and visible championing of responsible AI within the organisation. Certification auditors specifically look for evidence that leadership is engaged — not that a policy was signed and filed.', 1),
  ('aims-scope', 'Are interested parties — including employees, customers, regulators, and affected communities — identified and their AI-related requirements understood?', 'Cl. 4.2 — Interested parties', 'Clause 4.2 requires the organisation to determine the relevant interested parties and their AI-related requirements. Interested parties extend beyond immediate customers: regulators whose requirements must be met; employees whose roles are changed by AI; communities who bear the effects of AI decisions; civil society organisations who scrutinise AI impacts. Their requirements must be documented and reviewed periodically — they are inputs to the AI risk assessment scope.', 2),
  ('aims-scope', 'Is there a board-approved AI policy that commits to responsible AI development, use, and continual improvement of the AIMS?', 'Cl. 5.2 — AI Policy', 'Clause 5.2 requires top management to establish an AI policy that commits to: responsible AI development and use, legal and regulatory compliance, continual improvement, and the application of the AI management system to all AI activities in scope. The policy must be communicated within the organisation and to relevant interested parties. Board approval is required — a policy approved by the Head of AI without board endorsement is insufficient for certification purposes.', 3),

  ('objectives-planning', 'Has the organisation established measurable AI objectives — covering fairness, safety, performance, and compliance — with defined owners and timelines?', 'Cl. 6.2 — AI objectives', 'Clause 6.2 requires AI objectives to be established, documented, and communicated. Objectives must be measurable — "improve AI fairness" is not an objective; "reduce demographic parity gap to below 3% by Q4 2026" is. Each objective must have: a named owner, a measurement method, a target date, and a review schedule. Objectives must be linked to the risk assessment findings — they are the action-oriented response to identified AI risks.', 0),
  ('objectives-planning', 'Is there a documented process for planning and managing changes to AI systems — including impact assessment before changes are implemented?', 'Cl. 6.3 — Planning of changes', 'Clause 6.3 requires changes to the AI management system to be planned and carried out in a controlled manner. For AI systems, this means: a change request process, an impact assessment covering performance, fairness, and compliance implications of the change, documented approval before implementation, and post-change verification. Model updates, training data changes, and new use case deployments are all changes that require controlled management under Clause 6.3.', 1),
  ('objectives-planning', 'Are AI objectives reviewed against actual performance at defined intervals — and updated when context, risks, or regulatory requirements change?', 'Cl. 6.2, Cl. 9.1 — Objectives review', 'Clause 6.2 requires AI objectives to be monitored and updated. Clause 9.1 requires ongoing monitoring and evaluation. Objectives set at the beginning of the year may become obsolete if the regulatory environment changes, if the AI system is significantly modified, or if risk assessment findings change. A formal objectives review — at minimum at each management review cycle — with evidence of updates based on current context, is required.', 2),
  ('objectives-planning', 'Does the organisation have a resource plan for the AIMS — including budget, personnel, tools, and external expertise required for implementation?', 'Cl. 7.1 — Resources', 'Clause 7.1 requires the organisation to determine and provide the resources needed for the establishment, implementation, maintenance, and continual improvement of the AIMS. A credible resource plan must specify: the budget allocated to AI governance, the dedicated personnel (internal and external), the tools and technologies required, and the external expertise (legal, technical, ethics) to be engaged. Certification auditors will assess whether resource allocation is proportionate to the scope and risk profile of the AIMS.', 3),

  ('operation-controls', 'Is there a documented process for assessing AI systems before deployment — covering technical validation, fairness testing, and responsible use review?', 'Cl. 8.2 — AI system impact assessment', 'Clause 8.2 requires an AI system impact assessment (AIIA) before deployment of AI systems. The AIIA is a formal pre-deployment gate covering: technical performance validation, fairness and bias testing results, assessment of impacts on affected individuals and communities, and review of responsible use controls. The AIIA gate must be enforced — a deployment that proceeds without a completed AIIA is a major nonconformity at certification audit.', 0),
  ('operation-controls', 'Are controls for responsible AI use — including human oversight, data quality checks, and incident escalation — implemented and verified for all AI systems in scope?', 'Cl. 8.3 — Operational controls', 'Clause 8.3 requires operational controls for AI risks to be planned, implemented, controlled, and maintained. Responsible AI use controls must include: human oversight mechanisms for high-stakes AI decisions, data quality monitoring for training and inference inputs, transparency measures informing affected persons of AI use, override and correction procedures, and incident escalation processes. Controls must be verified as functioning — documented evidence of control operation, not just design.', 1),
  ('operation-controls', 'Is there a documented AI development lifecycle procedure — from requirements through design, training, testing, deployment, and decommissioning?', 'Cl. 8.1 — Operational planning and control', 'Clause 8.1 requires the organisation to plan, implement, control, and maintain processes needed to meet requirements for the responsible development and use of AI. A documented AI development lifecycle procedure — covering all stages from requirements through decommissioning — is the expected process document. The procedure must specify: the activities at each stage, the documentation required, the approval gates, and the responsible roles. Absence of a lifecycle procedure is a common certification audit finding.', 2),
  ('operation-controls', 'Are AI system logs maintained to enable investigation of incidents, performance issues, and fairness concerns — with defined retention periods?', 'Cl. 8.3, Annex A.8.4 — Logging and auditability', 'Clause 8.3 operational controls include logging of AI system activity to enable post-hoc investigation. Logs must capture: inputs provided to the AI system, outputs generated, human override events, performance metric snapshots, and any errors or anomalies. Retention periods must cover: internal review cycles, regulatory inspection timeframes, and litigation risk periods. Logs with no defined retention policy or no access controls do not satisfy this requirement.', 3),

  ('supplier-controls', 'Is there a documented process for assessing and approving AI system suppliers before procurement — including AI-specific due diligence criteria?', 'Annex A.10.2 — AI system acquisition', 'Annex A.10.2 requires AI system acquisition to be conducted with appropriate due diligence. The assessment process must include AI-specific criteria beyond standard IT procurement: model bias testing evidence, training data provenance and quality, regulatory compliance status, security of the AI API or deployment, and contractual obligations on notification of model updates. Approval from the AI governance function — not only the procurement function — must be required before AI supplier onboarding.', 0),
  ('supplier-controls', 'Do contracts with AI suppliers include obligations on bias disclosure, performance transparency, incident notification, and right-to-audit?', 'Annex A.10.3 — Third-party AI relationships', 'Annex A.10.3 requires third-party relationships involving AI systems to include appropriate contractual protections. AI-specific contract clauses must cover: disclosure of known biases and performance limitations, notification of model updates and performance changes, incident notification timelines, audit rights on bias testing and performance data, data processing obligations for any personal data involved, and liability allocation for AI-related harms. Standard IT contracts do not cover these obligations.', 1),
  ('supplier-controls', 'Is there a register of all AI suppliers — including the AI systems they provide, the data they process, and the risk rating assigned?', 'Annex A.10.2 — Supplier register', 'Annex A.10.2 requires AI system acquisition to be managed. A supplier register is the foundational control: it must list each AI supplier, the AI system or service they provide, the intended use, the data shared with the supplier, the risk classification assigned to the supplier relationship, and the date of the last due diligence review. An incomplete or out-of-date supplier register is a certification finding — AI suppliers adopted by business units without governance knowledge (shadow AI) are the most common gap.', 2),
  ('supplier-controls', 'Are AI supplier assessments repeated on a defined schedule — and triggered by model updates, security incidents, or significant changes to supplier data practices?', 'Annex A.10.3 — Ongoing supplier review', 'Annex A.10.3 requires third-party AI relationships to be managed on an ongoing basis. Initial due diligence at onboarding is necessary but insufficient. Annual reassessment — covering current bias testing results, updated security posture, and current regulatory compliance — is the minimum. Additional reassessment triggers must include: supplier model updates, supplier security incidents, changes to supplier data practices, and regulatory changes affecting supplier obligations.', 3),

  ('performance-evaluation', 'Are KPIs defined for the AI management system — covering fairness outcomes, incident rates, training completion, and risk treatment progress?', 'Cl. 9.1 — Performance monitoring', 'Clause 9.1 requires the organisation to monitor, measure, analyse, and evaluate the AI management system''s performance. KPIs must be defined for each significant aspect of the AIMS: fairness metric trends across AI systems, incident rate and time-to-resolution, training completion rates, risk treatment completion rates, and audit finding closure rates. Monitoring without defined KPIs is measurement for its own sake — it cannot determine whether the AIMS is effective.', 0),
  ('performance-evaluation', 'Is there an internal audit programme for the AI management system — with audits conducted at defined intervals by auditors independent of the area being audited?', 'Cl. 9.2 — Internal audit programme', 'Clause 9.2 requires internal audits to be planned and conducted. The audit programme must: define the audit scope, criteria, and frequency; assign auditors who are independent of the area being audited; document audit findings and report to management; and track nonconformities to closure. Audits conducted by the same team that implements the AIMS are not independent and will not satisfy the certification requirement. Annual audits are the minimum — high-risk AI systems warrant more frequent review.', 1),
  ('performance-evaluation', 'Are audit findings documented as nonconformities — with root cause analysis, corrective actions, owners, and target dates assigned?', 'Cl. 10.1 — Nonconformity and corrective action', 'Clause 10.1 requires the organisation to react to nonconformities by: correcting the immediate issue, investigating root cause, implementing corrective action to prevent recurrence, and reviewing the effectiveness of corrective action. A nonconformity register — with fields for finding description, root cause analysis, corrective action, owner, target date, and closure evidence — is the required evidence artefact. Open nonconformities with no root cause analysis or no assigned owner are a major certification risk.', 2),
  ('performance-evaluation', 'Does top management conduct a formal management review of the AIMS at defined intervals — with minutes documenting inputs considered and decisions made?', 'Cl. 9.3 — Management review', 'Clause 9.3 requires top management to review the AIMS at planned intervals. The review must consider: audit results and nonconformity status, stakeholder feedback, performance against objectives and KPIs, risk profile changes, opportunities for improvement, and changes in external and internal context. Evidence: management review minutes showing attendance (including senior leadership), all required inputs considered, and specific decisions recorded. A management review that considers only one or two inputs is non-compliant.', 3)

) AS q(slug, question_text, clause_ref, guidance, sort_order)
ON a.policy_id = 'iso-42001' AND a.slug = q.slug
ON CONFLICT (area_id, sort_order) DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────────────
-- NIST CSF 2.0 — EXPANDED AREAS (adds 4 new areas to existing 4)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO areas (policy_id, slug, area_name, phase_group, regulatory_ref, priority, effort, pillar, stakeholder, risk_if_not_addressed, dependencies, evidence_to_collect, maturity_not_started, maturity_developing, maturity_defined, maturity_optimised, sort_order) VALUES

('nist-csf', 'protect-access-control',
 'PROTECT — AI System Access Control & Privilege Management',
 'Map & Discover',
 'PR.AA — Identity Management, Authentication & Access Control',
 'High', 'Medium', 'privacy',
 'CISO / IAM / ML Engineering',
 'Unauthorised access to AI models, training data, or inference APIs; insider threat and model theft.',
 ARRAY['AI Asset Inventory & Supply Chain'],
 ARRAY['Access control policy','Privileged access reviews','IAM configuration evidence','MFA enforcement records'],
 'No access controls specific to AI assets.',
 'Access controls applied inconsistently. No privileged access reviews.',
 'Role-based access control on all AI assets. Quarterly privilege reviews.',
 'Automated access governance. Just-in-time privileged access. Continuous monitoring.',
 5),

('nist-csf', 'recover-continuity',
 'RECOVER — AI System Continuity & Rollback Planning',
 'Measure & Assess',
 'RC.RP — Recovery Planning; RC.IM — Recovery Improvements',
 'Medium', 'Medium', 'risk',
 'CISO / MLOps / Business Continuity',
 'AI system failure during critical operations; inability to roll back to safe model version; extended outage.',
 ARRAY['AI Incident Detection & Response'],
 ARRAY['Business continuity plan AI section','Model version registry','Rollback test records','RTO and RPO documentation'],
 'No AI continuity plan. No model version registry.',
 'Continuity plan exists but AI-specific recovery not addressed.',
 'AI included in BCP. Model rollback procedure documented and tested.',
 'Automated failover. Rollback tested annually. Recovery metrics tracked.',
 6),

('nist-csf', 'identify-risk-assessment',
 'IDENTIFY — AI-Specific Risk Assessment & Vulnerability Management',
 'Map & Discover',
 'ID.RA — Risk Assessment; ID.AM — Asset Management',
 'High', 'High', 'risk',
 'CISO / Risk / ML Engineering',
 'AI-specific vulnerabilities (prompt injection, model inversion, adversarial attack) unidentified and unmitigated.',
 ARRAY['GOVERN — AI Security Policy & Risk Strategy'],
 ARRAY['AI vulnerability assessment reports','Penetration testing records covering AI attack vectors','Risk assessment documentation'],
 'No AI-specific vulnerability assessment.',
 'AI vulnerabilities considered informally. No structured assessment.',
 'AI vulnerability assessment conducted. AI attack vectors in pen test scope.',
 'Continuous vulnerability scanning. AI red team annual. CVE monitoring for AI libraries.',
 7),

('nist-csf', 'detect-monitoring',
 'DETECT — Continuous Monitoring & Threat Detection for AI',
 'Measure & Assess',
 'DE.CM — Continuous Monitoring; DE.AE — Adverse Event Analysis',
 'High', 'High', 'risk',
 'SOC / CISO / MLOps',
 'AI-specific attacks and performance anomalies undetected; extended dwell time before discovery.',
 ARRAY['AI Incident Detection & Response'],
 ARRAY['Monitoring architecture documentation','Alert rule configuration','SOC playbook for AI incidents','Anomaly detection evidence'],
 'No AI-specific monitoring. AI not in SOC scope.',
 'Basic monitoring. No AI-specific alert rules or playbooks.',
 'AI monitoring in place. Alert rules configured. SOC playbook documented.',
 'Automated AI anomaly detection. ML-based monitoring. AI incidents auto-escalated.',
 8)

ON CONFLICT (policy_id, slug) DO NOTHING;


-- NIST CSF 2.0 — NEW QUESTIONS

INSERT INTO questions (area_id, policy_id, question_text, clause_ref, guidance, sort_order)
SELECT a.id, 'nist-csf', q.question_text, q.clause_ref, q.guidance, q.sort_order
FROM areas a
JOIN (VALUES

  ('protect-access-control', 'Are AI model weights, training datasets, and inference APIs protected by role-based access control with regular privilege reviews?', 'PR.AA-01 — Identity and access management', 'PR.AA-01 requires identities and credentials for authorised users, services, and hardware to be managed. AI assets — model weights, training datasets, vector databases, inference API keys — must be subject to role-based access control with named owners, defined access levels, and quarterly privilege reviews. Standing privileged access to AI production systems (models in production inference) must be replaced with just-in-time access with approval workflows.', 0),
  ('protect-access-control', 'Is multi-factor authentication enforced for all access to AI training pipelines, model repositories, and AI production infrastructure?', 'PR.AA-03 — Authentication enforcement', 'PR.AA-03 requires authentication for users, services, and hardware to be managed. MFA must be enforced for all human access to: ML training platforms, model registries, AI production inference infrastructure, and training data stores. Service-to-service authentication for AI pipeline components must use certificate-based or token-based authentication — not static credentials. Evidence: MFA policy, configuration screenshots, and exceptions register.', 1),
  ('protect-access-control', 'Are AI-specific privileged roles (ML engineers with training pipeline access, data engineers with training dataset access) reviewed quarterly against business need?', 'PR.AA-05 — Least privilege', 'PR.AA-05 requires access permissions, entitlements, and authorisations to be managed. The principle of least privilege applied to AI assets means: ML engineers have access only to the specific training environments they need; data engineers have access only to the specific datasets required for their role; model administrators have access only to the model versions they maintain. Quarterly reviews must confirm that access is still justified by current business need.', 2),
  ('protect-access-control', 'Are logs of access to AI systems, training data, and model artefacts retained and reviewed for anomalous access patterns?', 'PR.DS-10 — Audit logging', 'PR.DS-10 requires the integrity of data to be protected. Access logs for AI assets must be: retained for a defined period (minimum 12 months for most organisations), reviewed for anomalous access patterns (unusual hours, large data downloads, access from unexpected locations), and integrated into the SOC monitoring scope. Logs with no defined review process or retention period are an access control gap — access events are recorded but not acted upon.', 3),

  ('recover-continuity', 'Is there a documented AI system recovery plan — covering model rollback, fairness re-validation, and notification of affected parties after an AI incident?', 'RC.RP-01 — Recovery plan execution', 'RC.RP-01 requires recovery plans to be executed and maintained. For AI systems, recovery plans must cover scenarios beyond infrastructure failure: model rollback after a bias discovery or performance degradation event; fairness re-validation after rolling back to a previous model version; notification of affected parties if AI-informed decisions were made during an impaired period; and regulator notification where required. Generic IT recovery plans do not address these scenarios.', 0),
  ('recover-continuity', 'Is there a model version registry that enables rollback to a validated previous version within a defined RTO?', 'RC.RP-01 — AI model version management', 'Recovery from an AI incident requires the ability to roll back to a known-good previous model version. A model version registry — recording each version with training date, performance metrics, fairness evaluation results, and deployment history — is the prerequisite. Without a version registry, rollback is a manual, error-prone process. Recovery time objective (RTO) for AI model rollback must be defined and tested: can the organisation actually execute a rollback within the defined window?', 1),
  ('recover-continuity', 'Has the AI model rollback procedure been tested in the last 12 months — including validation that the rolled-back model meets fairness and performance thresholds?', 'RC.IM-01 — Recovery improvement', 'RC.IM-01 requires recovery strategies to be updated to incorporate lessons from previous recovery activities. Rollback procedures must be tested — not assumed to work. Testing must include: executing the rollback to a previous model version, running fairness and performance validation against the rolled-back model, confirming the rolled-back model meets current deployment thresholds, and documenting time taken and issues encountered. Untested rollback procedures are not recoverable in a real incident.', 2),
  ('recover-continuity', 'Are impacted parties notified if AI-informed decisions were made during a period of AI system compromise or performance degradation?', 'RC.CO-03 — Restoration communications', 'RC.CO-03 requires restoration activities to be communicated to internal and external stakeholders. Where AI-informed decisions (credit, employment, healthcare, insurance) were made during a period when the AI system was compromised, biased beyond threshold, or performing below acceptable standards, affected individuals must be notified. The notification must: explain the AI system issue, identify the affected decision period, describe the right to human review, and provide a process for requesting re-assessment.', 3),

  ('identify-risk-assessment', 'Are AI-specific threats — prompt injection, model inversion, adversarial examples, training data poisoning — included in the organisation''s threat catalogue?', 'ID.RA-02 — Threat intelligence', 'ID.RA-02 requires cyber threat intelligence to be received and analysed. AI-specific threats must be explicitly included in the threat catalogue and threat intelligence programme. Standard threat catalogues do not cover AI attack vectors. Evidence: threat catalogue showing AI-specific threat categories; intelligence feeds covering AI security research (MITRE ATLAS, OWASP ML Top 10); and threat modelling records for AI systems.', 0),
  ('identify-risk-assessment', 'Has a vulnerability assessment been conducted for each AI system — covering model architecture vulnerabilities, API exposure, and adversarial robustness?', 'ID.RA-01 — Vulnerability identification', 'ID.RA-01 requires vulnerabilities in assets to be identified, validated, and recorded. AI system vulnerability assessment must cover: model architecture vulnerabilities (susceptibility to adversarial examples), API exposure vulnerabilities (authentication, rate limiting, input validation), training pipeline vulnerabilities (data poisoning entry points), and dependency vulnerabilities (vulnerable ML libraries). Standard IT vulnerability scanning does not cover model-level vulnerabilities — specialist AI security assessment is required.', 1),
  ('identify-risk-assessment', 'Is AI system penetration testing conducted — specifically covering AI attack vectors such as prompt injection, adversarial input, and model inversion?', 'ID.RA-05 — Risk response', 'ID.RA-05 requires threats, vulnerabilities, likelihoods, and impacts to be used to understand inherent risk and inform risk response priorities. AI penetration testing must explicitly cover: prompt injection (for LLM-based systems), adversarial example generation (for ML classifiers), model inversion attempts (reconstructing training data from model outputs), and API abuse testing. Evidence: AI pen test scope confirmation, findings report, remediation tracking.', 2),
  ('identify-risk-assessment', 'Are AI system dependencies — ML libraries, data processing frameworks, inference engines — monitored for known CVEs and patched on a defined schedule?', 'ID.RA-01 — Dependency vulnerability management', 'ID.RA-01 requires vulnerabilities to be identified. AI systems depend on ML libraries (TensorFlow, PyTorch, Hugging Face Transformers) that have known CVEs — including vulnerabilities enabling arbitrary code execution during model loading and training data extraction. Dependency monitoring must cover all ML pipeline components, with defined patching SLAs and an exception process for libraries where patching impacts model performance.', 3),

  ('detect-monitoring', 'Are AI inference endpoints monitored for anomalous input patterns — including potential prompt injection attempts or adversarial inputs?', 'DE.CM-06 — External service monitoring', 'DE.CM-06 requires external service activity to be monitored to detect adverse events. AI inference endpoints are attack surfaces for prompt injection, adversarial input crafting, and model interrogation. Monitoring must include: anomaly detection on input distributions (inputs that deviate significantly from training distribution), rate limiting with alerting on threshold breaches, and content inspection for known adversarial patterns. Alerts must route to the SOC with defined response playbooks.', 0),
  ('detect-monitoring', 'Are AI model output distributions monitored for unexpected shifts that may indicate model compromise, data drift, or bias emergence?', 'DE.CM-09 — Computing hardware and software monitoring', 'DE.CM-09 requires computing hardware and software to be monitored to find adverse events. Output distribution monitoring detects: model drift (outputs shifting from expected distribution), bias emergence (differential output rates for demographic groups increasing over time), and potential model compromise (outputs following manipulation). Monitoring must be automated with threshold-based alerting — manual periodic review is insufficient for production AI systems in high-stakes contexts.', 1),
  ('detect-monitoring', 'Are AI system events — inference requests, model updates, access events, performance metric changes — captured in a centralised log and integrated with the SIEM?', 'DE.AE-03 — Adverse event analysis', 'DE.AE-03 requires adverse events to be correlated and analysed. AI system events must flow into the SIEM alongside traditional security events to enable correlation analysis. An adversarial attack on an AI system may manifest as: unusual API request patterns, unexpected model output distributions, and performance metric degradation — correlation across these signals enables detection that no single alert would catch. AI log sources not in the SIEM are invisible to the SOC.', 2),
  ('detect-monitoring', 'Is there a defined escalation path when AI monitoring alerts are triggered — including who responds, within what timeframe, and what authority they have?', 'DE.AE-06 — Adverse event information', 'DE.AE-06 requires information on adverse events to be communicated. Monitoring without a defined escalation path is not a detective control — it generates alerts that are reviewed without authority to act. The escalation path for AI monitoring alerts must specify: the SOC alert response procedure, the ML engineering escalation contact, the business owner notification timeline, the authority to take the AI system offline if compromise is confirmed, and the regulator notification trigger.', 3)

) AS q(slug, question_text, clause_ref, guidance, sort_order)
ON a.policy_id = 'nist-csf' AND a.slug = q.slug
ON CONFLICT (area_id, sort_order) DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────────────
-- HEALTHCARE INDUSTRY TAGS — All new NIST AI RMF questions
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO question_tags (question_id, industry, relevance)
SELECT q.id, t.industry, t.relevance
FROM questions q
JOIN areas a ON a.id = q.area_id
JOIN (VALUES
  -- MAP 2 — out-of-distribution testing critical for healthcare
  ('nist-ai-rmf', 'map-scientific-basis', 0, 'healthcare', 'critical'),
  ('nist-ai-rmf', 'map-scientific-basis', 1, 'healthcare', 'critical'),
  ('nist-ai-rmf', 'map-scientific-basis', 2, 'healthcare', 'critical'),
  ('nist-ai-rmf', 'map-scientific-basis', 3, 'healthcare', 'high'),
  -- MAP 3 — vulnerable population assessment critical for healthcare
  ('nist-ai-rmf', 'map-affected-groups', 0, 'healthcare', 'critical'),
  ('nist-ai-rmf', 'map-affected-groups', 1, 'healthcare', 'critical'),
  ('nist-ai-rmf', 'map-affected-groups', 2, 'healthcare', 'high'),
  ('nist-ai-rmf', 'map-affected-groups', 3, 'healthcare', 'critical'),
  -- MAP 1 — context and deployment conditions critical for healthcare AI
  ('nist-ai-rmf', 'map-context-deployment', 0, 'healthcare', 'critical'),
  ('nist-ai-rmf', 'map-context-deployment', 1, 'healthcare', 'critical'),
  ('nist-ai-rmf', 'map-context-deployment', 2, 'healthcare', 'critical'),
  ('nist-ai-rmf', 'map-context-deployment', 3, 'healthcare', 'high'),
  -- GOVERN 5 — FDA/HHS regulatory tracking critical for healthcare
  ('nist-ai-rmf', 'govern-risk-tolerance', 0, 'healthcare', 'high'),
  ('nist-ai-rmf', 'govern-risk-tolerance', 1, 'healthcare', 'critical'),
  ('nist-ai-rmf', 'govern-risk-tolerance', 2, 'healthcare', 'critical'),
  ('nist-ai-rmf', 'govern-risk-tolerance', 3, 'healthcare', 'high'),
  -- MEASURE 2 — testing critical for healthcare
  ('nist-ai-rmf', 'measure-testing-evaluation', 0, 'healthcare', 'critical'),
  ('nist-ai-rmf', 'measure-testing-evaluation', 1, 'healthcare', 'critical'),
  ('nist-ai-rmf', 'measure-testing-evaluation', 2, 'healthcare', 'critical'),
  ('nist-ai-rmf', 'measure-testing-evaluation', 3, 'healthcare', 'high'),
  -- MEASURE 3 — disaggregated evaluation critical for healthcare
  ('nist-ai-rmf', 'measure-disaggregated', 0, 'healthcare', 'critical'),
  ('nist-ai-rmf', 'measure-disaggregated', 1, 'healthcare', 'critical'),
  ('nist-ai-rmf', 'measure-disaggregated', 2, 'healthcare', 'critical'),
  ('nist-ai-rmf', 'measure-disaggregated', 3, 'healthcare', 'high'),
  -- MANAGE 3 — monitoring critical for healthcare
  ('nist-ai-rmf', 'manage-monitoring-drift', 0, 'healthcare', 'critical'),
  ('nist-ai-rmf', 'manage-monitoring-drift', 1, 'healthcare', 'critical'),
  ('nist-ai-rmf', 'manage-monitoring-drift', 2, 'healthcare', 'critical'),
  ('nist-ai-rmf', 'manage-monitoring-drift', 3, 'healthcare', 'high'),
  -- MAP 4 — third-party risk high for healthcare (vendor AI systems)
  ('nist-ai-rmf', 'map-third-party', 0, 'healthcare', 'critical'),
  ('nist-ai-rmf', 'map-third-party', 1, 'healthcare', 'critical'),
  ('nist-ai-rmf', 'map-third-party', 2, 'healthcare', 'high'),
  ('nist-ai-rmf', 'map-third-party', 3, 'healthcare', 'high')
) AS t(policy_id, slug, sort_order, industry, relevance)
ON q.area_id = a.id
  AND a.policy_id = t.policy_id
  AND a.slug = t.slug
  AND q.sort_order = t.sort_order
ON CONFLICT (question_id, industry) DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────────────
-- FINTECH INDUSTRY TAGS — New NIST AI RMF questions (for Apex Lending)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO question_tags (question_id, industry, relevance)
SELECT q.id, t.industry, t.relevance
FROM questions q
JOIN areas a ON a.id = q.area_id
JOIN (VALUES
  ('nist-ai-rmf', 'govern-risk-tolerance', 1, 'fintech', 'critical'),
  ('nist-ai-rmf', 'govern-risk-tolerance', 2, 'fintech', 'critical'),
  ('nist-ai-rmf', 'map-affected-groups', 0, 'fintech', 'critical'),
  ('nist-ai-rmf', 'map-affected-groups', 3, 'fintech', 'critical'),
  ('nist-ai-rmf', 'measure-disaggregated', 0, 'fintech', 'critical'),
  ('nist-ai-rmf', 'measure-disaggregated', 1, 'fintech', 'critical'),
  ('nist-ai-rmf', 'map-scientific-basis', 2, 'fintech', 'high'),
  ('nist-ai-rmf', 'manage-monitoring-drift', 0, 'fintech', 'critical'),
  ('nist-ai-rmf', 'manage-monitoring-drift', 1, 'fintech', 'high')
) AS t(policy_id, slug, sort_order, industry, relevance)
ON q.area_id = a.id
  AND a.policy_id = t.policy_id
  AND a.slug = t.slug
  AND q.sort_order = t.sort_order
ON CONFLICT (question_id, industry) DO NOTHING;


-- ═══════════════════════════════════════════════════════════════════════════════
-- END OF EXPANSION v2
-- Run this entire file in Supabase SQL Editor → Execute
-- The 6-hour localStorage cache will serve old data until it expires.
-- Force-refresh in the app: Tracker → Framework Navigator → Refresh button,
-- or clear localStorage key "pl_guides_cache" in browser DevTools.
-- ═══════════════════════════════════════════════════════════════════════════════
