-- ─────────────────────────────────────────────────────────────────────────────
-- PREETIBUILDS — AI Governance DB
-- Project: https://mfhjopfnmtujjyojokeg.supabase.co
-- Paste the entire file into Supabase SQL Editor → Run
-- Safe to re-run: ON CONFLICT DO NOTHING / DO UPDATE where applicable
-- ─────────────────────────────────────────────────────────────────────────────

-- ── TABLES ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS policies (
  id               TEXT PRIMARY KEY,
  name             TEXT NOT NULL,
  short_name       TEXT,
  regulating_body  TEXT,
  jurisdiction     TEXT[]      DEFAULT '{}',
  status           TEXT        DEFAULT 'Active',
  enforcement_date TEXT,
  penalty_regime   TEXT,
  intro            TEXT,
  sort_order       INT         DEFAULT 0,
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS compliance_deadlines (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id     TEXT NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  deadline_date TEXT NOT NULL,
  requirement   TEXT NOT NULL,
  sort_order    INT  DEFAULT 0
);

CREATE TABLE IF NOT EXISTS areas (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id             TEXT NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  slug                  TEXT NOT NULL,
  area_name             TEXT NOT NULL,
  phase_group           TEXT,
  regulatory_ref        TEXT,
  priority              TEXT,
  effort                TEXT,
  pillar                TEXT,
  stakeholder           TEXT,
  risk_if_not_addressed TEXT,
  iso_mapping           TEXT[]  DEFAULT '{}',
  dependencies          TEXT[]  DEFAULT '{}',
  evidence_to_collect   TEXT[]  DEFAULT '{}',
  question_deps         JSONB   DEFAULT '{}',
  maturity_not_started  TEXT,
  maturity_developing   TEXT,
  maturity_defined      TEXT,
  maturity_optimised    TEXT,
  sort_order            INT     DEFAULT 0,
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (policy_id, slug)
);

CREATE TABLE IF NOT EXISTS questions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id       UUID NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
  policy_id     TEXT NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  clause_ref    TEXT,
  guidance      TEXT,
  risk_tier     TEXT[]  DEFAULT '{}',
  sort_order    INT     DEFAULT 0,
  last_verified DATE    DEFAULT CURRENT_DATE,
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (area_id, sort_order)
);

CREATE TABLE IF NOT EXISTS question_tags (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  industry    TEXT NOT NULL,
  relevance   TEXT DEFAULT 'medium',
  UNIQUE (question_id, industry)
);

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE policies              ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_deadlines  ENABLE ROW LEVEL SECURITY;
ALTER TABLE areas                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions             ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_tags         ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'policies' AND policyname = 'Public read') THEN
    CREATE POLICY "Public read" ON policies           FOR SELECT TO anon USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'compliance_deadlines' AND policyname = 'Public read') THEN
    CREATE POLICY "Public read" ON compliance_deadlines FOR SELECT TO anon USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'areas' AND policyname = 'Public read') THEN
    CREATE POLICY "Public read" ON areas              FOR SELECT TO anon USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'questions' AND policyname = 'Public read') THEN
    CREATE POLICY "Public read" ON questions          FOR SELECT TO anon USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'question_tags' AND policyname = 'Public read') THEN
    CREATE POLICY "Public read" ON question_tags      FOR SELECT TO anon USING (true);
  END IF;
END $$;

-- ── SEED: POLICIES ───────────────────────────────────────────────────────────

INSERT INTO policies (id, name, short_name, regulating_body, jurisdiction, status, enforcement_date, penalty_regime, intro, sort_order) VALUES
(
  'eu-ai-act',
  'EU Artificial Intelligence Act',
  'EU AI Act',
  'European AI Office',
  ARRAY['EU','EEA','Extra-territorial'],
  'Active',
  'Aug 2026 (high-risk systems)',
  '€35M or 7% of global annual turnover (whichever is higher)',
  'Use this discovery guide to assess a client organisation''s current state of compliance with the EU AI Act. Work through each area with the relevant stakeholder — Legal, Product, Engineering, or Risk — and capture current state, evidence, and gaps.',
  1
),
(
  'nist-ai-rmf',
  'NIST AI Risk Management Framework',
  'NIST AI RMF',
  'NIST (US)',
  ARRAY['US','Global (voluntary)'],
  'Active',
  'Ongoing — no mandatory deadline',
  'No penalties — voluntary framework. Sector regulators (OCC, SEC, HHS) increasingly reference it.',
  'Use this guide to assess a client''s implementation of the NIST AI Risk Management Framework across all four core functions: Govern, Map, Measure, Manage. Suitable for US-regulated organisations and multinationals adopting the RMF as a baseline.',
  2
),
(
  'nist-csf',
  'NIST Cybersecurity Framework 2.0',
  'NIST CSF 2.0',
  'NIST (US)',
  ARRAY['US','Global (voluntary)'],
  'Active',
  'Feb 2024',
  'No penalties — voluntary framework. CISA and sector regulators increasingly mandate CSF alignment.',
  'Use this guide to assess a client''s implementation of NIST CSF 2.0 with specific focus on AI and ML system security controls, supply chain risk, and the new GOVERN function.',
  3
),
(
  'iso-42001',
  'ISO/IEC 42001:2023 — AI Management System',
  'ISO 42001',
  'ISO/IEC JTC 1/SC 42',
  ARRAY['Global'],
  'Active',
  'Dec 2023',
  'No penalties — certification standard. Third-party audited certificate from accredited body.',
  'Use this guide to assess a client''s readiness for ISO 42001 certification or to identify gaps in their AI Management System (AIMS). Map findings to the clause structure for use in a formal gap assessment.',
  4
),
(
  'fair',
  'FAIR — Factor Analysis of Information Risk',
  'FAIR',
  'FAIR Institute',
  ARRAY['Global (voluntary)'],
  'Active',
  'Ongoing',
  'No penalties — quantitative risk methodology. Increasingly referenced by financial regulators and insurance underwriters.',
  'Use this guide to assess whether a client organisation has the capability to quantify AI risk in financial terms using the FAIR methodology. Most useful for financial services, insurance, and technology clients with mature risk management functions.',
  5
),
(
  'aaia',
  'AI Auditing Intelligence Framework',
  'AAIA',
  'IIA / ISACA',
  ARRAY['Global (voluntary)'],
  'Active',
  'Ongoing',
  'No penalties — audit methodology. Increasing regulatory and procurement demand for AI audit evidence.',
  'Use this guide to structure an AI audit engagement or to assess a client''s readiness for an AAIA-aligned AI audit. Work through each domain with the internal audit, risk, or compliance function.',
  6
)
ON CONFLICT (id) DO NOTHING;

-- ── SEED: COMPLIANCE DEADLINES ───────────────────────────────────────────────

INSERT INTO compliance_deadlines (policy_id, deadline_date, requirement, sort_order) VALUES
('eu-ai-act', 'Aug 2025', 'Prohibitions on unacceptable-risk AI active', 1),
('eu-ai-act', 'Aug 2025', 'GPAI model obligations apply', 2),
('eu-ai-act', 'Aug 2026', 'High-risk AI system obligations fully apply', 3),
('eu-ai-act', 'Aug 2027', 'All remaining provisions', 4),
('nist-ai-rmf', 'Ongoing', 'Voluntary framework — no mandatory deadlines. Sector-specific regulators (OCC, SEC, HHS) increasingly reference it.', 1),
('nist-ai-rmf', '2024', 'NIST AI 600-1 (GenAI guidance) — assess all generative AI systems against additional risks.', 2),
('nist-csf', 'Ongoing', 'Voluntary framework. CISA and sector regulators increasingly mandate CSF alignment.', 1),
('nist-csf', '2024', 'CSF 2.0 released — clients on v1.1 should plan migration including new GOVERN function.', 2),
('iso-42001', '2023', 'Standard published. Certification available from accredited bodies.', 1),
('iso-42001', 'Ongoing', 'No mandatory deadline — client-driven. Some procurement and regulatory bodies beginning to require it.', 2),
('fair', 'Ongoing', 'Voluntary methodology. Increasingly referenced by financial regulators and insurance underwriters.', 1),
('aaia', 'Ongoing', 'No mandatory timeline. Increasing regulatory and procurement demand for AI audit evidence.', 1),
('aaia', '2024', 'CAAIA exam updated — ensure audit methodology aligns with EU AI Act conformity assessment.', 2)
ON CONFLICT DO NOTHING;

-- ── SEED: AREAS — EU AI ACT ──────────────────────────────────────────────────

INSERT INTO areas (policy_id, slug, area_name, phase_group, regulatory_ref, priority, effort, pillar, stakeholder, risk_if_not_addressed, iso_mapping, dependencies, evidence_to_collect, question_deps, maturity_not_started, maturity_developing, maturity_defined, maturity_optimised, sort_order) VALUES
(
  'eu-ai-act', 'inventory-classification',
  'AI System Inventory & Risk Classification',
  'Govern & Scope',
  'Art. 6–9, Annex III — Risk Classification',
  'High', 'Medium', 'governance',
  'CTO / Head of Product / Legal',
  'Non-compliance with foundational obligations; inability to demonstrate regulatory readiness; first target of supervisory authority review.',
  ARRAY['Cl. 6.1 — Risk Assessment','Annex A.8.2 — AI System Impact Assessment'],
  ARRAY[]::TEXT[],
  ARRAY['AI system inventory spreadsheet or register','Risk classification methodology document','RACI for AI governance'],
  '{"1": 0}'::JSONB,
  'No inventory exists. AI use cases are not tracked centrally.',
  'Inventory exists but incomplete. No formal risk classification applied.',
  'Complete inventory. Risk classification applied. Owner designated.',
  'Register is live, audited quarterly, integrated with change management.',
  0
),
(
  'eu-ai-act', 'prohibited-uses',
  'Prohibited AI Uses — Identification & Cessation',
  'Govern & Scope',
  'Art. 5 — Prohibited Practices',
  'High', 'Low', 'ethics',
  'Legal / CISO / CTO',
  'Fines up to €35M or 7% of global turnover; criminal liability; immediate market withdrawal if prohibited use confirmed.',
  ARRAY['Cl. 4.1 — Organisational Context','Cl. 5.2 — AI Policy'],
  ARRAY[]::TEXT[],
  ARRAY['Legal review of current AI use cases against Article 5','Written confirmation from business owners of no prohibited use','Policy prohibiting future deployment without legal sign-off'],
  '{}'::JSONB,
  'No review of current AI against prohibitions has taken place.',
  'Review in progress. Some use cases flagged for further analysis.',
  'Full review completed. No prohibited uses confirmed in writing.',
  'Ongoing pre-deployment screening process in place. Legal sign-off required.',
  1
),
(
  'eu-ai-act', 'conformity-assessment',
  'High-Risk AI — Conformity Assessment',
  'Map & Discover',
  'Art. 43, Annex IV — Conformity Assessment',
  'High', 'High', 'risk',
  'Product / Legal / Engineering',
  'Cannot legally place high-risk AI systems on the EU market; regulatory enforcement action and mandatory product withdrawal.',
  ARRAY['Cl. 8.3 — AI System Operation','Annex A.6.2 — System Deployment'],
  ARRAY['AI System Inventory & Risk Classification'],
  ARRAY['Conformity assessment reports','Technical documentation packages','EU AI database registration confirmations','CE marking (where applicable)'],
  '{}'::JSONB,
  'High-risk systems not identified. No conformity assessment underway.',
  'High-risk systems identified. Assessments planned but not started.',
  'Conformity assessments completed for all high-risk systems.',
  'Assessments completed, registered, and reviewed on every significant change.',
  2
),
(
  'eu-ai-act', 'training-data-governance',
  'Training Data Governance & Bias Examination',
  'Map & Discover',
  'Art. 10 — Data & Data Governance',
  'High', 'High', 'privacy',
  'Data Engineering / ML / Legal / DPO',
  'Discriminatory AI outputs at scale; enforcement action; discrimination litigation; severe reputational and brand damage.',
  ARRAY['Cl. 8.4 — Data for AI Systems','Annex A.4 — Data Quality'],
  ARRAY['AI System Inventory & Risk Classification'],
  ARRAY['Data lineage documentation','Bias examination reports','Dataset cards or datasheets for datasets','Data quality assessment outputs'],
  '{}'::JSONB,
  'Training data is not documented. No bias examination has occurred.',
  'Some datasets documented. Bias examination planned for priority systems.',
  'All high-risk AI datasets documented and bias-examined.',
  'Automated dataset auditing in CI/CD pipeline. Bias reports version-controlled.',
  3
),
(
  'eu-ai-act', 'human-oversight',
  'Human Oversight & Override Controls',
  'Map & Discover',
  'Art. 14 — Human Oversight',
  'Medium', 'Medium', 'governance',
  'Product / Engineering / Operations',
  'Automated AI decisions deemed non-compliant; liability for harms caused by unmonitored outputs without human intervention.',
  ARRAY['Cl. 8.5 — Information to Users','Annex A.8 — Human Oversight'],
  ARRAY['High-Risk AI — Conformity Assessment'],
  ARRAY['UI/system documentation showing override controls','Audit log samples','Operator training records','Escalation procedures'],
  '{}'::JSONB,
  'AI outputs are fully automated. No override capability.',
  'Override capability exists but not consistently implemented or logged.',
  'Override controls on all high-risk AI. Logging and training in place.',
  'Override patterns reviewed monthly. Escalation triggers automated alerts.',
  4
),
(
  'eu-ai-act', 'fria',
  'Fundamental Rights Impact Assessment',
  'Map & Discover',
  'Art. 27 — FRIA',
  'High', 'Medium', 'ethics',
  'Legal / DPO / Ethics Lead / Product',
  'Deployment of AI that violates fundamental rights; supervisory authority enforcement; public interest litigation and reputational harm.',
  ARRAY['Cl. 6.1 — Risk Assessment','Cl. 8.2 — AI Impact Assessment'],
  ARRAY['AI System Inventory & Risk Classification'],
  ARRAY['Completed FRIA documents','Sign-off records','Evidence of FRIA informing deployment decisions'],
  '{}'::JSONB,
  'No FRIA process exists.',
  'FRIA template created. One or two assessments completed.',
  'FRIA mandatory before all high-risk AI deployments. Results documented.',
  'FRIA integrated into product development gate. Published where required.',
  5
)
ON CONFLICT (policy_id, slug) DO NOTHING;

-- ── SEED: AREAS — NIST AI RMF ────────────────────────────────────────────────

INSERT INTO areas (policy_id, slug, area_name, phase_group, regulatory_ref, priority, effort, pillar, stakeholder, risk_if_not_addressed, dependencies, evidence_to_collect, maturity_not_started, maturity_developing, maturity_defined, maturity_optimised, sort_order) VALUES
(
  'nist-ai-rmf', 'govern-policy',
  'GOVERN — AI Risk Policy & Accountability',
  'Govern & Scope',
  'GOVERN 1.1–6.2 — Risk Culture & Policies',
  'High', 'Low', 'governance',
  'Board / CRO / General Counsel',
  'AI risks are ungoverned and invisible until an incident occurs; no named accountability for outcomes across the organisation.',
  ARRAY[]::TEXT[],
  ARRAY['AI risk policy document','Board minute approving policy','RACI or role definitions','Board/committee AI risk reporting pack'],
  'No AI risk policy. AI risk not discussed at board level.',
  'Draft policy exists. Ownership unclear. No board reporting.',
  'Policy approved. Owner designated. Quarterly board reporting.',
  'Policy reviewed annually. AI risk is a standing board agenda item.',
  0
),
(
  'nist-ai-rmf', 'map-populations',
  'MAP — Identifying Affected Populations & Risks',
  'Map & Discover',
  'MAP 1.1–5.2 — Risk Context & Classification',
  'High', 'Medium', 'ethics',
  'Product / Data Science / Risk',
  'Harms to vulnerable groups go undetected; regulatory scrutiny from sector regulators; legal and reputational exposure.',
  ARRAY['GOVERN — AI Risk Policy & Accountability'],
  ARRAY['Stakeholder and affected population maps','AI risk register showing bias/fairness risk categories','Pre-deployment risk assessments'],
  'No mapping of AI risks or affected populations.',
  'Some systems have impact assessments. Not consistent.',
  'All material AI systems mapped. Bias risk formally registered.',
  'Continuous impact monitoring. Feedback loops with affected communities.',
  1
),
(
  'nist-ai-rmf', 'measure-fairness',
  'MEASURE — Fairness Metrics & Monitoring',
  'Map & Discover',
  'MEASURE 1.1–4.2 — Metrics & Testing',
  'Medium', 'High', 'ethics',
  'ML Engineering / Data Science / Product',
  'Bias and fairness issues in production go undetected; discriminatory outcomes affect customers at scale before discovered.',
  ARRAY['MAP — Identifying Affected Populations & Risks'],
  ARRAY['Fairness metric definitions','Model cards or evaluation reports','Disaggregated performance dashboards','Threshold breach records and responses'],
  'No fairness metrics defined or measured.',
  'Metrics defined for some systems. Not consistently monitored.',
  'Metrics defined, baselined, and monitored for all material systems.',
  'Automated alerts on threshold breach. Metrics trend-tracked over model versions.',
  2
),
(
  'nist-ai-rmf', 'manage-incidents',
  'MANAGE — Risk Treatment & Incident Response',
  'Map & Discover',
  'MANAGE 1.1–4.2 — Risk Response & Recovery',
  'High', 'Medium', 'risk',
  'CRO / CISO / Product / Legal',
  'No ability to contain or respond to AI incidents; extended exposure window; regulatory breach notification failures.',
  ARRAY['GOVERN — AI Risk Policy & Accountability'],
  ARRAY['AI risk treatment plans','AI incident response playbook','Tabletop exercise records','AI incident log'],
  'No AI-specific risk treatment or incident process.',
  'Risk treatment ad-hoc. No AI incident playbook.',
  'Treatment plans documented. Playbook exists and tested.',
  'Incident metrics reviewed monthly. Playbook updated after each incident.',
  3
)
ON CONFLICT (policy_id, slug) DO NOTHING;

-- ── SEED: AREAS — NIST CSF 2.0 ───────────────────────────────────────────────

INSERT INTO areas (policy_id, slug, area_name, phase_group, regulatory_ref, priority, effort, pillar, stakeholder, risk_if_not_addressed, dependencies, evidence_to_collect, maturity_not_started, maturity_developing, maturity_defined, maturity_optimised, sort_order) VALUES
(
  'nist-csf', 'govern-security',
  'GOVERN — AI Security Policy & Risk Strategy',
  'Govern & Scope',
  'GV.OC, GV.RM — Organisational Context & Risk Mgmt',
  'High', 'Low', 'governance',
  'CISO / CRO / Board',
  'AI security risks ungoverned; no accountability for security outcomes; significant blind spots in threat landscape.',
  ARRAY[]::TEXT[],
  ARRAY['Updated risk strategy document','Enterprise risk register showing AI risks','AI-specific risk tolerance statements'],
  'AI security risks not in scope of cybersecurity strategy.',
  'AI risks informally considered. Not in formal risk strategy.',
  'AI risks in risk strategy with defined tolerance. Owner designated.',
  'AI security risk reviewed quarterly at board level alongside cyber risk.',
  0
),
(
  'nist-csf', 'asset-supply-chain',
  'AI Asset Inventory & Supply Chain',
  'Map & Discover',
  'ID.AM, ID.SC — Asset & Supply Chain',
  'High', 'Medium', 'governance',
  'CISO / Procurement / CTO',
  'Unknown AI attack surface; third-party components introduce unmanaged risk; supply chain compromise goes undetected.',
  ARRAY['GOVERN — AI Security Policy & Risk Strategy'],
  ARRAY['CMDB extract showing AI assets','Vendor risk assessment templates','AI supplier contracts with security clauses'],
  'No AI assets in CMDB. No vendor AI risk process.',
  'Some AI assets tracked. Vendor process under development.',
  'CMDB includes AI assets. Vendor AI questionnaire in use.',
  'Continuous asset discovery. Annual vendor attestations with right-to-audit.',
  1
),
(
  'nist-csf', 'model-data-security',
  'Training Data & Model Security',
  'Map & Discover',
  'PR.DS, PR.AT — Data Security & Awareness',
  'High', 'High', 'privacy',
  'CISO / Data Engineering / ML',
  'Model theft, poisoning, or data exfiltration; AI systems produce compromised outputs without detection or alerting.',
  ARRAY['AI Asset Inventory & Supply Chain'],
  ARRAY['Data classification policy','Encryption standards documentation','Access control configurations','Anomaly detection runbooks'],
  'Training data treated as generic data. No specific controls.',
  'Encryption applied. Access controls inconsistent.',
  'Training data classified. Encryption, access controls, and audit logging in place.',
  'Automated integrity checks on training data. Tampering triggers incident.',
  2
),
(
  'nist-csf', 'incident-detection',
  'AI Incident Detection & Response',
  'Map & Discover',
  'DE.CM, RS.CO — Detect & Respond',
  'Medium', 'Medium', 'risk',
  'CISO / SOC / Legal',
  'AI security incidents go undetected or are poorly contained; mandatory breach notification obligations breached.',
  ARRAY['GOVERN — AI Security Policy & Risk Strategy'],
  ARRAY['SOC monitoring scope documentation','AI anomaly detection playbooks','Incident notification templates','DR plan AI section'],
  'AI not in SOC scope. No AI incident playbook.',
  'AI in scope but limited detection rules. Playbook drafted.',
  'AI-specific detection and playbook. Notification process defined.',
  'AI incidents auto-escalated. Recovery tested annually including rollback.',
  3
)
ON CONFLICT (policy_id, slug) DO NOTHING;

-- ── SEED: AREAS — ISO 42001 ───────────────────────────────────────────────────

INSERT INTO areas (policy_id, slug, area_name, phase_group, regulatory_ref, priority, effort, pillar, stakeholder, risk_if_not_addressed, dependencies, evidence_to_collect, maturity_not_started, maturity_developing, maturity_defined, maturity_optimised, sort_order) VALUES
(
  'iso-42001', 'context-leadership',
  'Clause 4–5: Context, Leadership & AI Policy',
  'Govern & Scope',
  'ISO 42001 Clauses 4–5 — Context & Leadership',
  'High', 'Low', 'governance',
  'CEO / Board / General Counsel',
  'ISO 42001 certification unachievable without leadership clause; no executive accountability for AI management system.',
  ARRAY[]::TEXT[],
  ARRAY['Context analysis document','Board-approved AI policy','Role and responsibility matrix'],
  'No AI policy. Context not documented.',
  'Draft policy. Context analysis incomplete.',
  'Policy approved. Context documented. Roles assigned.',
  'Policy reviewed annually. Context analysis feeds risk assessment.',
  0
),
(
  'iso-42001', 'risk-planning',
  'Clause 6: AI Risk Assessment & Planning',
  'Map & Discover',
  'ISO 42001 Clause 6 — Planning',
  'High', 'Medium', 'risk',
  'Risk / Product / Legal',
  'AI risks discovered reactively; no systematic treatment planning; major nonconformity at certification audit.',
  ARRAY['Clause 4–5: Context, Leadership & AI Policy'],
  ARRAY['AI risk assessment methodology','Completed risk assessments for in-scope systems','Risk treatment plan'],
  'No AI risk assessment process.',
  'Process defined but not consistently applied.',
  'Methodology documented. Assessments completed for all in-scope systems.',
  'Assessments triggered automatically on significant change. Results feed board reporting.',
  1
),
(
  'iso-42001', 'impact-assessment',
  'Clause 8: AI System Impact Assessment & Operation',
  'Map & Discover',
  'ISO 42001 Clause 8, Annex B — Operation & AIIA',
  'High', 'High', 'ethics',
  'Product / Legal / DPO / Ethics Lead',
  'AI impacts on people and society unassessed; ethical failures reach customers; ISO 42001 major nonconformity.',
  ARRAY['Clause 6: AI Risk Assessment & Planning'],
  ARRAY['Impact assessment templates and completed assessments','Deployment gate approval records','Evidence of human oversight controls'],
  'No impact assessment process.',
  'Template created. One or two assessments done.',
  'Mandatory pre-deployment. Disparate impact assessed. Gate approval required.',
  'Assessments automated where possible. Results tracked over model versions.',
  2
),
(
  'iso-42001', 'audit-improvement',
  'Clause 9–10: Internal Audit & Continual Improvement',
  'Map & Discover',
  'ISO 42001 Clauses 9–10 — Performance & Improvement',
  'Medium', 'Medium', 'risk',
  'Internal Audit / CRO / Board',
  'No evidence of AIMS performance; certification suspended or not renewed; unresolved nonconformities accumulate.',
  ARRAY['Clause 8: AI System Impact Assessment & Operation'],
  ARRAY['Internal audit plan and reports','Nonconformity and corrective action register','Management review minutes'],
  'No AI internal audit. No management review.',
  'Audit planned. Management review ad-hoc.',
  'Annual audit completed. Findings tracked. Management review documented.',
  'Audit insights drive continual improvement cycle. Metrics trend upward year-on-year.',
  3
)
ON CONFLICT (policy_id, slug) DO NOTHING;

-- ── SEED: AREAS — FAIR ───────────────────────────────────────────────────────

INSERT INTO areas (policy_id, slug, area_name, phase_group, regulatory_ref, priority, effort, pillar, stakeholder, risk_if_not_addressed, dependencies, evidence_to_collect, maturity_not_started, maturity_developing, maturity_defined, maturity_optimised, sort_order) VALUES
(
  'fair', 'taxonomy-scenarios',
  'Risk Taxonomy & Scenario Identification',
  'Govern & Scope',
  'FAIR Phase 1 — Scenario Identification',
  'High', 'Low', 'risk',
  'CRO / Risk Analyst / CISO',
  'Quantification is impossible without agreed taxonomy; risk conversations are inconsistent and results incomparable across teams.',
  ARRAY[]::TEXT[],
  ARRAY['AI risk scenario library','FAIR taxonomy mapping document','Risk scenario review records'],
  'No AI risk scenarios defined.',
  'Some scenarios identified. Not mapped to FAIR taxonomy.',
  'Scenarios mapped to FAIR. Reviewed annually.',
  'Scenario library maintained. New scenarios added following industry events.',
  0
),
(
  'fair', 'quantitative-modelling',
  'Quantitative Risk Modelling',
  'Map & Discover',
  'FAIR Phase 2–3 — Risk Quantification',
  'Medium', 'High', 'risk',
  'Risk / Finance / CRO',
  'AI risks expressed qualitatively only; unable to prioritise investments or set cyber insurance levels by financial impact.',
  ARRAY['Risk Taxonomy & Scenario Identification'],
  ARRAY['FAIR model outputs','Board risk reports showing financial exposure','Tooling platform access'],
  'Risk quantified only as High/Medium/Low ratings.',
  'FAIR methodology known. Pilot model built for one scenario.',
  'FAIR models for all material AI risks. Results in board pack.',
  'Models updated quarterly. Risk reduction ROI calculated for control investments.',
  1
),
(
  'fair', 'threat-vulnerability',
  'Threat & Vulnerability Analysis',
  'Map & Discover',
  'FAIR Phase 2 — Threat Analysis',
  'Medium', 'Medium', 'risk',
  'CISO / ML Engineering / Risk',
  'Threat landscape not understood; risk models underestimate actual financial exposure; mispriced and underinsured risk.',
  ARRAY['Risk Taxonomy & Scenario Identification'],
  ARRAY['Threat actor profiles','AI vulnerability assessments','Red team / pen test reports covering AI'],
  'AI threat and vulnerability analysis not performed.',
  'Threat actors identified. Vulnerability assessment ad-hoc.',
  'Formal threat and vulnerability analysis. AI pen testing annual.',
  'Continuous threat intelligence. AI red team capability in-house.',
  2
)
ON CONFLICT (policy_id, slug) DO NOTHING;

-- ── SEED: AREAS — AAIA ───────────────────────────────────────────────────────

INSERT INTO areas (policy_id, slug, area_name, phase_group, regulatory_ref, priority, effort, pillar, stakeholder, risk_if_not_addressed, dependencies, evidence_to_collect, maturity_not_started, maturity_developing, maturity_defined, maturity_optimised, sort_order) VALUES
(
  'aaia', 'audit-charter',
  'Domain 1–2: Audit Charter & Risk-Based Planning',
  'Govern & Scope',
  'AAIA Domains 1–2 — Audit Foundation',
  'High', 'Low', 'governance',
  'Chief Audit Executive / Audit Committee',
  'Internal audit has no mandate to assess AI; board has no independent assurance on AI risk; control failures go unreported.',
  ARRAY[]::TEXT[],
  ARRAY['Internal audit charter','Annual AI audit plan','Audit committee approval minutes','AI competency matrix for audit team'],
  'AI not in audit charter. No AI audit plan.',
  'Charter updated. AI audit plan in draft.',
  'Charter and plan approved. Risk-based prioritisation applied.',
  'AI audit integrated with enterprise risk. CAAIA-certified auditors on team.',
  0
),
(
  'aaia', 'bias-testing',
  'Domain 3: Algorithmic Bias Testing',
  'Map & Discover',
  'AAIA Domain 3 — Algorithmic Bias Audit',
  'High', 'High', 'ethics',
  'Internal Audit / ML Engineering / Data Science',
  'Biased AI decisions not caught by audit; discriminatory outcomes reach customers; audit function not fit for purpose in AI era.',
  ARRAY['Domain 1–2: Audit Charter & Risk-Based Planning'],
  ARRAY['Bias testing methodology document','Bias audit reports with metric outputs','Evidence of gender and intersectional analysis'],
  'No bias testing performed.',
  'Bias testing done for one or two systems. Methodology informal.',
  'Structured methodology. All material systems tested. Gender mandatory.',
  'Automated bias testing in deployment pipeline. Results published to affected stakeholders.',
  1
),
(
  'aaia', 'data-quality-audit',
  'Domain 5: Training Data Quality Audit',
  'Map & Discover',
  'AAIA Domain 5 — Data Quality',
  'Medium', 'High', 'privacy',
  'Internal Audit / Data Engineering / DPO',
  'Data quality issues in AI training unidentified by audit; model performance and fairness compromised without audit evidence.',
  ARRAY['Domain 1–2: Audit Charter & Risk-Based Planning'],
  ARRAY['Data quality audit reports','Dataset composition analysis','Personal data inventory for training datasets'],
  'Training data quality not audited.',
  'Data quality checks informal. Gender representation not measured.',
  'Structured data audit. Gender representation documented. PII controlled.',
  'Automated data quality gates. Representation metrics tracked over time.',
  2
),
(
  'aaia', 'governance-reporting',
  'Domain 6–7: Governance Audit & Reporting',
  'Map & Discover',
  'AAIA Domains 6–7 — Governance & Reporting',
  'Medium', 'Medium', 'governance',
  'Internal Audit / Board / Risk Committee',
  'AI governance failures unreported to board; inadequate oversight of AI risk programme; board-level accountability gaps persist.',
  ARRAY['Domain 1–2: Audit Charter & Risk-Based Planning'],
  ARRAY['Governance audit reports','AI committee membership records','Finding remediation tracker','Audit committee reporting pack'],
  'No governance audit. Findings not formally tracked.',
  'Governance reviewed informally. Tracking inconsistent.',
  'Governance audit conducted. Findings rated and tracked to closure.',
  'Gender equity findings tracked separately. Audit committee reviews trend data.',
  3
)
ON CONFLICT (policy_id, slug) DO NOTHING;

-- ── SEED: QUESTIONS — EU AI ACT ──────────────────────────────────────────────
-- Area 1: AI System Inventory & Risk Classification

INSERT INTO questions (area_id, policy_id, question_text, clause_ref, guidance, sort_order)
SELECT a.id, 'eu-ai-act',
  'Do you have a complete inventory of all AI systems currently in use or development?',
  'Art. 6(1), Art. 49(1)',
  'Article 6 requires providers to classify AI systems before placing them on the market. Article 49 requires registration of high-risk systems before deployment. Both obligations are impossible without a complete inventory. The register should capture: system name, vendor, intended purpose, deployment status, and preliminary risk tier.',
  0
FROM areas a WHERE a.policy_id = 'eu-ai-act' AND a.slug = 'inventory-classification'
ON CONFLICT (area_id, sort_order) DO NOTHING;

INSERT INTO questions (area_id, policy_id, question_text, clause_ref, guidance, sort_order)
SELECT a.id, 'eu-ai-act',
  'For each system, has a risk classification been assigned (Unacceptable / High / Limited / Minimal)?',
  'Art. 6, Annex III §1–8',
  'Annex III lists 8 high-risk categories: §1 Biometric identification, §2 Critical infrastructure, §3 Education, §4 Employment, §5(a) Public services access, §5(b) Credit scoring and creditworthiness assessment by financial institutions, §6 Law enforcement, §7 Migration, §8 Justice. Credit scoring is explicitly listed under §5(b). Classification must be documented and reviewed on any material change to the system.',
  1
FROM areas a WHERE a.policy_id = 'eu-ai-act' AND a.slug = 'inventory-classification'
ON CONFLICT (area_id, sort_order) DO NOTHING;

INSERT INTO questions (area_id, policy_id, question_text, clause_ref, guidance, sort_order)
SELECT a.id, 'eu-ai-act',
  'Is there a documented process for classifying new AI systems before development begins?',
  'Art. 9(1)(a) — Risk Management System',
  'Article 9 requires a continuous risk management system covering identification and analysis of risks throughout the full AI system lifecycle. Classification must be triggered at the outset of development — not applied retrospectively after deployment. The process must be documented and evidence of its application on each new system must be retained.',
  2
FROM areas a WHERE a.policy_id = 'eu-ai-act' AND a.slug = 'inventory-classification'
ON CONFLICT (area_id, sort_order) DO NOTHING;

INSERT INTO questions (area_id, policy_id, question_text, clause_ref, guidance, sort_order)
SELECT a.id, 'eu-ai-act',
  'Who is accountable for maintaining the AI system register and keeping classifications current?',
  'Art. 26(9), Art. 26(1)',
  'Article 26(9) requires deployers to designate a named person responsible for overseeing the conformity of their AI system use. Named accountability with a specific role title is required — general ownership by "the team" does not satisfy this obligation. The designated person must have the authority and resources to maintain the register.',
  3
FROM areas a WHERE a.policy_id = 'eu-ai-act' AND a.slug = 'inventory-classification'
ON CONFLICT (area_id, sort_order) DO NOTHING;

-- Area 2: Prohibited AI Uses

INSERT INTO questions (area_id, policy_id, question_text, clause_ref, guidance, sort_order)
SELECT a.id, 'eu-ai-act',
  'Has the organisation reviewed all current AI use cases against Article 5 prohibited practices?',
  'Art. 5(1)(a)–(h) — Prohibited Practices',
  'Article 5 lists 8 categories of prohibited AI: subliminal manipulation, exploitation of vulnerable groups, social scoring by public authorities, real-time remote biometric ID in public spaces, retrospective biometric ID, predictive policing based on profiling, facial recognition database scraping, and emotion recognition in workplace/education. All current AI use cases must be screened against all 8 categories. The review must be documented in writing.',
  0
FROM areas a WHERE a.policy_id = 'eu-ai-act' AND a.slug = 'prohibited-uses'
ON CONFLICT (area_id, sort_order) DO NOTHING;

INSERT INTO questions (area_id, policy_id, question_text, clause_ref, guidance, sort_order)
SELECT a.id, 'eu-ai-act',
  'Are any AI systems using real-time remote biometric identification in public spaces?',
  'Art. 5(1)(d) — Real-time remote biometric identification',
  'Article 5(1)(d) prohibits real-time remote biometric identification systems in publicly accessible spaces, with very narrow law enforcement exceptions. Any biometric identification system in public spaces requires specific national legal authorisation — general commercial use is absolutely prohibited. No exception pathway exists for commercial deployers.',
  1
FROM areas a WHERE a.policy_id = 'eu-ai-act' AND a.slug = 'prohibited-uses'
ON CONFLICT (area_id, sort_order) DO NOTHING;

INSERT INTO questions (area_id, policy_id, question_text, clause_ref, guidance, sort_order)
SELECT a.id, 'eu-ai-act',
  'Are any AI systems used for social scoring, manipulation of vulnerable groups, or subliminal influence?',
  'Art. 5(1)(a)–(c) — Social scoring & manipulation',
  'Art. 5(1)(a) prohibits AI that deploys subliminal techniques to materially distort behaviour causing harm. Art. 5(1)(b) prohibits exploitation of vulnerabilities due to age, disability, or social/economic situation. Art. 5(1)(c) prohibits public authority social scoring that leads to detrimental treatment of persons in unrelated contexts. These are absolute prohibitions — no exception pathway exists for any of them.',
  2
FROM areas a WHERE a.policy_id = 'eu-ai-act' AND a.slug = 'prohibited-uses'
ON CONFLICT (area_id, sort_order) DO NOTHING;

INSERT INTO questions (area_id, policy_id, question_text, clause_ref, guidance, sort_order)
SELECT a.id, 'eu-ai-act',
  'Is there a legal review process before any new biometric or emotion recognition AI is deployed?',
  'Art. 5(1)(e)–(h), Art. 5(2)',
  'Art. 5(1)(e) prohibits AI for inferred biometric categorisation to deduce sensitive attributes. Art. 5(1)(f) prohibits predictive policing based on profiling. Art. 5(1)(g) prohibits facial recognition database scraping. Art. 5(1)(h) prohibits emotion recognition in workplace and educational settings. Art. 5(2) requires specific national law authorisation for real-time biometric systems. A legal review gate is essential before any new biometric or emotion-recognition deployment.',
  3
FROM areas a WHERE a.policy_id = 'eu-ai-act' AND a.slug = 'prohibited-uses'
ON CONFLICT (area_id, sort_order) DO NOTHING;

-- Area 3: High-Risk AI — Conformity Assessment

INSERT INTO questions (area_id, policy_id, question_text, clause_ref, guidance, sort_order)
SELECT a.id, 'eu-ai-act',
  'Which AI systems fall into Annex III high-risk categories (employment, education, credit, law enforcement, health)?',
  'Annex III §1–8 — High-risk category listing',
  'Annex III §1: Biometric identification and categorisation. §2: Critical infrastructure management. §3: Education and vocational training. §4: Employment and worker management. §5(a): Access to essential public services. §5(b): Creditworthiness assessment and credit scoring by financial institutions — explicitly includes AI that evaluates creditworthiness of natural persons. §6: Law enforcement. §7: Migration, asylum and border control. §8: Administration of justice. If the client provides or uses AI for credit scoring, this is high-risk by explicit statutory definition.',
  0
FROM areas a WHERE a.policy_id = 'eu-ai-act' AND a.slug = 'conformity-assessment'
ON CONFLICT (area_id, sort_order) DO NOTHING;

INSERT INTO questions (area_id, policy_id, question_text, clause_ref, guidance, sort_order)
SELECT a.id, 'eu-ai-act',
  'Has a conformity assessment been completed or planned for each high-risk AI system?',
  'Art. 43 — Conformity Assessment',
  'Article 43 requires providers of high-risk AI to complete a conformity assessment before market placement. For most Annex III systems, internal self-assessment against Art. 8–15 technical requirements is permitted. For biometric identification systems and safety components of critical infrastructure, a third-party assessment by a notified body is required. The completed assessment must be documented and retained for 10 years.',
  1
FROM areas a WHERE a.policy_id = 'eu-ai-act' AND a.slug = 'conformity-assessment'
ON CONFLICT (area_id, sort_order) DO NOTHING;

INSERT INTO questions (area_id, policy_id, question_text, clause_ref, guidance, sort_order)
SELECT a.id, 'eu-ai-act',
  'Is there technical documentation covering system design, training data, testing, and performance?',
  'Art. 11, Annex IV — Technical Documentation',
  'Annex IV specifies 9 required documentation categories: (1) general system description, (2) design and development processes, (3) monitoring, testing and validation methodology, (4) description of changes over versions, (5) post-market monitoring plan, (6) bias examination results, (7) performance metrics and accuracy thresholds, (8) cybersecurity measures, (9) for GPAI-based systems — training data information and compute used. All documentation must be kept current and produced to market surveillance authorities on request.',
  2
FROM areas a WHERE a.policy_id = 'eu-ai-act' AND a.slug = 'conformity-assessment'
ON CONFLICT (area_id, sort_order) DO NOTHING;

INSERT INTO questions (area_id, policy_id, question_text, clause_ref, guidance, sort_order)
SELECT a.id, 'eu-ai-act',
  'Has the system been registered in the EU AI Act database (required before market placement)?',
  'Art. 49(1) — Registration in EU database',
  'Article 49 requires providers to register each high-risk AI system in the EU''s publicly accessible AI database before placing it on the market or putting it into service. Registration is a standalone obligation — distinct from conformity assessment. Both are required. Failure to register is a direct non-compliance even if the conformity assessment is otherwise complete. The database is operated by the European AI Office.',
  3
FROM areas a WHERE a.policy_id = 'eu-ai-act' AND a.slug = 'conformity-assessment'
ON CONFLICT (area_id, sort_order) DO NOTHING;

-- Area 4: Training Data Governance

INSERT INTO questions (area_id, policy_id, question_text, clause_ref, guidance, sort_order)
SELECT a.id, 'eu-ai-act',
  'Are training, validation, and test datasets documented with source, lineage, and collection date?',
  'Art. 10(2)(b)–(c) — Data Governance',
  'Article 10(2) requires data governance practices covering: collection method, preparation and processing steps, labelling and annotation procedures, storage and deletion. Documentation must record: the data source, the collection or generation method, the intended purpose, the scope and main characteristics, and any known limitations or gaps. Undocumented training data is a foundational Article 10 non-compliance.',
  0
FROM areas a WHERE a.policy_id = 'eu-ai-act' AND a.slug = 'training-data-governance'
ON CONFLICT (area_id, sort_order) DO NOTHING;

INSERT INTO questions (area_id, policy_id, question_text, clause_ref, guidance, sort_order)
SELECT a.id, 'eu-ai-act',
  'Has a bias examination been conducted on datasets used for high-risk AI systems?',
  'Art. 10(2)(f) — Bias examination',
  'Article 10(2)(f) explicitly requires examination of training, validation, and test datasets for possible biases that may affect health and safety, produce discriminatory outputs, or lead to breaches of EU fundamental rights law. The examination must be documented and the results acted upon — it is not sufficient to examine for bias and take no action on findings. Evidence of examination and remediation must be retained.',
  1
FROM areas a WHERE a.policy_id = 'eu-ai-act' AND a.slug = 'training-data-governance'
ON CONFLICT (area_id, sort_order) DO NOTHING;

INSERT INTO questions (area_id, policy_id, question_text, clause_ref, guidance, sort_order)
SELECT a.id, 'eu-ai-act',
  'Are gender, ethnicity, age, and other protected characteristics assessed for representativeness in training data?',
  'Art. 10(5) — Sensitive categories in training data',
  'Article 10(5) permits processing of special categories of personal data (including racial/ethnic origin and sex) specifically for bias monitoring and detection, subject to appropriate safeguards. Protected characteristics must be assessed for representativeness — systematic under-representation of any demographic group in training data produces discriminatory outputs and creates regulatory exposure. Single-characteristic analysis is insufficient; intersectional representation must be assessed.',
  2
FROM areas a WHERE a.policy_id = 'eu-ai-act' AND a.slug = 'training-data-governance'
ON CONFLICT (area_id, sort_order) DO NOTHING;

INSERT INTO questions (area_id, policy_id, question_text, clause_ref, guidance, sort_order)
SELECT a.id, 'eu-ai-act',
  'Is there a process for detecting and correcting data quality issues before training begins?',
  'Art. 10(3) — Data quality criteria',
  'Article 10(3) requires training, validation, and test datasets to meet quality criteria: relevant to the intended purpose, sufficiently representative of the real-world population the system will affect, free of errors to the extent possible, and complete for the intended purpose. A documented data quality assessment — including completeness, accuracy, currency, and representativeness checks — must be completed and evidenced before training commences.',
  3
FROM areas a WHERE a.policy_id = 'eu-ai-act' AND a.slug = 'training-data-governance'
ON CONFLICT (area_id, sort_order) DO NOTHING;

-- Area 5: Human Oversight

INSERT INTO questions (area_id, policy_id, question_text, clause_ref, guidance, sort_order)
SELECT a.id, 'eu-ai-act',
  'Do high-risk AI systems allow a human operator to monitor, intervene, and override AI outputs?',
  'Art. 14(1)–(2) — Human oversight measures',
  'Article 14(1) requires high-risk AI systems to be designed and developed to allow effective oversight by natural persons during use. Article 14(2) specifies this means appropriate human-machine interface tools built into the system. The ability to monitor, interpret, and intervene is a design requirement — it cannot be retrofitted after deployment and must be demonstrable in the conformity assessment.',
  0
FROM areas a WHERE a.policy_id = 'eu-ai-act' AND a.slug = 'human-oversight'
ON CONFLICT (area_id, sort_order) DO NOTHING;

INSERT INTO questions (area_id, policy_id, question_text, clause_ref, guidance, sort_order)
SELECT a.id, 'eu-ai-act',
  'Are override actions logged with timestamp, operator ID, and reason?',
  'Art. 14(4)(e) — Intervention and override capability',
  'Article 14(4)(e) requires high-risk AI systems to allow the person responsible for oversight to decide not to use the system in a particular situation, override, interrupt, or stop the system via a simple command. Override actions must be logged with sufficient granularity to support post-incident analysis and regulatory inquiry: timestamp, operator identifier, reason for intervention, and system response.',
  1
FROM areas a WHERE a.policy_id = 'eu-ai-act' AND a.slug = 'human-oversight'
ON CONFLICT (area_id, sort_order) DO NOTHING;

INSERT INTO questions (area_id, policy_id, question_text, clause_ref, guidance, sort_order)
SELECT a.id, 'eu-ai-act',
  'Are operators trained on when and how to exercise oversight?',
  'Art. 14(3)(a)–(b) — Operator competence',
  'Article 14(3) requires deployers to ensure persons designated for oversight have the necessary competence, training, and authority. Training must be system-specific, not generic. An operator who cannot interpret AI outputs or recognise anomalies cannot provide meaningful oversight. Training records must be maintained and refreshed when the system is materially updated.',
  2
FROM areas a WHERE a.policy_id = 'eu-ai-act' AND a.slug = 'human-oversight'
ON CONFLICT (area_id, sort_order) DO NOTHING;

INSERT INTO questions (area_id, policy_id, question_text, clause_ref, guidance, sort_order)
SELECT a.id, 'eu-ai-act',
  'Is there a process for escalating AI decisions that require human review before action is taken?',
  'Art. 14(4)(c)–(d) — Escalation and automation bias',
  'Article 14(4)(c) requires operators to correctly interpret AI outputs and recognise anomalies, dysfunctions, and unexpected outputs. Art. 14(4)(d) requires operators to be aware of and counteract the tendency to automatically over-rely on AI output (automation bias). A documented escalation process — defining what triggers human review, who reviews, within what timeframe, and with what authority — is required evidence of meaningful human oversight.',
  3
FROM areas a WHERE a.policy_id = 'eu-ai-act' AND a.slug = 'human-oversight'
ON CONFLICT (area_id, sort_order) DO NOTHING;

-- Area 6: FRIA

INSERT INTO questions (area_id, policy_id, question_text, clause_ref, guidance, sort_order)
SELECT a.id, 'eu-ai-act',
  'Has a Fundamental Rights Impact Assessment (FRIA) been conducted for each high-risk AI deployment?',
  'Art. 27(1) — Fundamental Rights Impact Assessment',
  'Article 27(1) requires deployers of high-risk AI in public interest contexts to complete a FRIA before deployment. The FRIA must document: the AI system''s purpose, the population of persons whose rights are at risk, the likelihood and severity of impacts on fundamental rights, and the measures taken to mitigate unacceptable risks. The FRIA is distinct from a DPIA (which focuses on personal data) and an AIIA (ISO 42001 Clause 8) — all three may be required simultaneously.',
  0
FROM areas a WHERE a.policy_id = 'eu-ai-act' AND a.slug = 'fria'
ON CONFLICT (area_id, sort_order) DO NOTHING;

INSERT INTO questions (area_id, policy_id, question_text, clause_ref, guidance, sort_order)
SELECT a.id, 'eu-ai-act',
  'Does the FRIA explicitly cover impacts on gender, ethnicity, disability, age, and intersectional groups?',
  'Art. 27(2)(b)–(c) — FRIA scope requirements',
  'Article 27(2) sets minimum content for a FRIA, including explicit coverage of: the categories of persons affected, vulnerable groups, and the likelihood of harm to each. Single-dimension analysis (gender only, or ethnicity only) is insufficient. Intersectional analysis — e.g. gender × ethnicity, gender × disability, age × socioeconomic status — is required where data permits. A FRIA that omits protected characteristics is a major compliance gap.',
  1
FROM areas a WHERE a.policy_id = 'eu-ai-act' AND a.slug = 'fria'
ON CONFLICT (area_id, sort_order) DO NOTHING;

INSERT INTO questions (area_id, policy_id, question_text, clause_ref, guidance, sort_order)
SELECT a.id, 'eu-ai-act',
  'Is the FRIA completed before deployment, not after?',
  'Art. 27(1) — Pre-deployment obligation',
  'Article 27(1) is unambiguous: the FRIA must be conducted before the deployer puts the AI system into service. A retrospective FRIA — completed after deployment has begun — does not satisfy this obligation. The assessment must be finalised, its findings considered in the deployment decision, and evidence of completion before go-live must be retained and producible on request from market surveillance authorities.',
  2
FROM areas a WHERE a.policy_id = 'eu-ai-act' AND a.slug = 'fria'
ON CONFLICT (area_id, sort_order) DO NOTHING;

INSERT INTO questions (area_id, policy_id, question_text, clause_ref, guidance, sort_order)
SELECT a.id, 'eu-ai-act',
  'Who signs off the FRIA and what authority do they have to halt deployment if risks are unacceptable?',
  'Art. 27(4) — FRIA documentation and notification',
  'Article 27(4) requires the deployer to make relevant parts of the FRIA available to market surveillance authorities on request. The assessment must be signed by a person with real authority to act on its findings — including the authority to halt or delay deployment if unacceptable fundamental rights risks are identified. A FRIA signed by someone without the power to halt deployment is not meaningful oversight and will not withstand regulatory scrutiny.',
  3
FROM areas a WHERE a.policy_id = 'eu-ai-act' AND a.slug = 'fria'
ON CONFLICT (area_id, sort_order) DO NOTHING;

-- ── SEED: QUESTIONS — ALL OTHER POLICIES (clause_ref + guidance to be enriched) ──

-- NIST AI RMF questions
INSERT INTO questions (area_id, policy_id, question_text, clause_ref, guidance, sort_order)
SELECT a.id, 'nist-ai-rmf', q.question_text, q.clause_ref, q.guidance, q.sort_order
FROM areas a
JOIN (VALUES
  ('govern-policy', 'Is there a board-approved AI risk policy that defines the organisation''s approach, risk appetite, and accountability?', 'GOVERN 1.1 — AI Risk Policy', 'GOVERN 1.1 requires documented organisational policies establishing risk management expectations for AI. The policy must define risk appetite, assign accountability, and be formally approved at board or senior leadership level.', 0),
  ('govern-policy', 'Is a named executive accountable for AI risk management (e.g. Chief AI Officer, Chief Risk Officer)?', 'GOVERN 1.2 — Accountability', 'GOVERN 1.2 requires organisational roles and responsibilities for AI risk management to be established, communicated, and understood. Named executive ownership is the minimum — a role title with defined responsibilities, not a committee with diffuse accountability.', 1),
  ('govern-policy', 'Are AI risk roles and responsibilities documented and communicated across the organisation?', 'GOVERN 1.3 — Roles & Responsibilities', 'GOVERN 1.3 requires that AI risk-related roles are assigned and that expectations are communicated. A RACI matrix or equivalent covering AI risk management across product, engineering, legal, and risk functions satisfies this requirement.', 2),
  ('govern-policy', 'Is AI risk reviewed at board or senior management level on a regular schedule?', 'GOVERN 1.7 — Board-level risk reporting', 'GOVERN 1.7 requires senior leadership to understand and commit to their responsibilities for AI risk management. Regular board-level reporting — a standing agenda item or quarterly pack — with evidence of review and action is the expected output.', 3),
  ('map-populations', 'For each AI system, has the organisation documented who will be affected by its outputs (including indirectly)?', 'MAP 1.1 — Affected stakeholders', 'MAP 1.1 requires identification of all stakeholders who may be positively or negatively impacted by AI system outputs, including indirect and downstream effects. Documentation must capture both intended users and third parties who have no direct interaction with the system but whose lives may be affected.', 0),
  ('map-populations', 'Have vulnerable or marginalised groups who may be disproportionately impacted been explicitly identified?', 'MAP 2.3 — Vulnerable populations', 'MAP 2.3 requires the organisation to understand the AI system''s potential impacts on individuals and communities, especially those who are vulnerable or marginalised. Generic population analysis is insufficient — the assessment must explicitly identify and assess groups that face heightened risk of harm.', 1),
  ('map-populations', 'Is there a process to assess AI risks across societal, technical, and operational dimensions?', 'MAP 3.5 — Risk context', 'MAP 3.5 requires risk identification to span technical (model failure, accuracy drift), operational (human oversight gaps, deployment errors), and societal (discriminatory outcomes, erosion of trust) dimensions. A risk assessment that covers only technical performance misses the majority of AI-specific risk.', 2),
  ('map-populations', 'Are bias and fairness risks included as formal risk categories in the AI risk register?', 'MAP 5.1 — Bias as a risk category', 'MAP 5.1 requires that identified AI risks are prioritised. Bias and fairness risks must appear as named categories in the AI risk register — not as sub-items of generic operational risk. Evidence required: risk register extract showing bias/fairness risk entries with likelihood, impact, and treatment owner.', 3),
  ('measure-fairness', 'Are fairness metrics (demographic parity, equalised odds, calibration) defined and measured for AI systems?', 'MEASURE 1.3 — Fairness metrics', 'MEASURE 1.3 requires AI risk measurement methods to be established for each AI system. Fairness metrics must be explicitly defined — demographic parity, equalised odds, individual fairness, calibration — and selected based on the use case. Evidence of measurement (not just definition) is required.', 0),
  ('measure-fairness', 'Are model performance results disaggregated by gender, age, ethnicity, and other protected characteristics?', 'MEASURE 2.5 — Disaggregated performance', 'MEASURE 2.5 requires AI system performance to be evaluated in terms of its impacts on individuals and communities. Aggregate accuracy metrics conceal group-level performance disparities. Disaggregated evaluation by protected characteristics is required — and must be documented in model cards or evaluation reports.', 1),
  ('measure-fairness', 'Is there a baseline established pre-deployment that ongoing production metrics are compared against?', 'MEASURE 2.6 — Baseline comparisons', 'MEASURE 2.6 requires evaluation results to be documented and tracked over time. A pre-deployment baseline — capturing fairness metrics, performance metrics, and data characteristics at launch — is the reference point against which drift and degradation are measured. Without a baseline, production monitoring is meaningless.', 2),
  ('measure-fairness', 'Are measurement results reviewed by a person with authority to intervene if thresholds are breached?', 'MEASURE 4.1 — Human review of metrics', 'MEASURE 4.1 requires AI risk metrics to be monitored and reviewed. Review by a person with actual authority to take action — including pulling a model from production if thresholds are breached — is required. Monitoring dashboards with no escalation path do not satisfy this requirement.', 3),
  ('manage-incidents', 'Is there a documented process for treating AI risks — covering mitigation, transfer, acceptance, and avoidance?', 'MANAGE 1.1 — Risk treatment plans', 'MANAGE 1.1 requires development of treatment plans for identified AI risks, covering all four treatment options: mitigation (reduce likelihood/impact), transfer (insurance, contractual), acceptance (documented with rationale), and avoidance (cease or redesign). Plans must be documented and assigned to named owners.', 0),
  ('manage-incidents', 'Is there a defined AI incident response playbook covering bias events, model failures, and harmful outputs?', 'MANAGE 2.2 — AI incident response', 'MANAGE 2.2 requires plans for responding to and recovering from AI risks and incidents. The playbook must address AI-specific incident types — biased output events, model drift beyond thresholds, harmful content generation, adversarial attacks — not just generic IT incidents. Standard breach response plans do not cover these scenarios.', 1),
  ('manage-incidents', 'Has the incident response playbook been tested via a tabletop exercise in the last 12 months?', 'MANAGE 3.1 — Incident response testing', 'MANAGE 3.1 requires identified AI risks to be tracked and responses to be monitored. Tabletop exercise evidence — scenario, participants, findings, action items — demonstrates the playbook is operational rather than theoretical. Untested playbooks are not credible evidence of incident readiness.', 2),
  ('manage-incidents', 'Are AI-related incidents logged, investigated, root-caused, and tracked to resolution?', 'MANAGE 4.1 — Incident tracking', 'MANAGE 4.1 requires residual risk to be documented and risk responses to be monitored for effectiveness. An AI incident log with fields for: incident description, detection method, initial response, root cause analysis, and resolution with date is required. Incidents without documented root cause analysis are a persistent risk management gap.', 3)
) AS q(slug, question_text, clause_ref, guidance, sort_order)
ON a.policy_id = 'nist-ai-rmf' AND a.slug = q.slug
ON CONFLICT (area_id, sort_order) DO NOTHING;

-- NIST CSF 2.0 questions
INSERT INTO questions (area_id, policy_id, question_text, clause_ref, guidance, sort_order)
SELECT a.id, 'nist-csf', q.question_text, q.clause_ref, q.guidance, q.sort_order
FROM areas a
JOIN (VALUES
  ('govern-security', 'Has the organisation updated its cybersecurity risk strategy to explicitly include AI and ML systems?', 'GV.RM-01 — Risk strategy', 'GV.RM-01 requires a risk management strategy to be established, communicated, and monitored. AI systems introduce attack surfaces absent from traditional IT — prompt injection, model inversion, adversarial inputs, training data poisoning — that must be explicitly named in the risk strategy, not assumed to be covered by generic cyber risk language.', 0),
  ('govern-security', 'Is there a defined risk tolerance for AI-specific threats (adversarial attacks, model poisoning, prompt injection)?', 'GV.RM-04 — AI risk tolerance', 'GV.RM-04 requires risk tolerance to be established, communicated, and maintained. AI-specific risk tolerances — acceptable rates of adversarial attack, model drift thresholds, acceptable false positive rates that could cause discrimination — must be explicitly defined and approved at senior management level.', 1),
  ('govern-security', 'Are AI systems included in the organisation''s enterprise risk register?', 'GV.RM-07 — Enterprise risk integration', 'GV.RM-07 requires strategic opportunities and risks from cybersecurity to be incorporated into enterprise risk management. AI systems must appear as named entries in the enterprise risk register — not subsumed under generic "technology risk". Each AI system with material cyber exposure should have its own risk entry.', 2),
  ('govern-security', 'Who owns AI cybersecurity risk — and how does that role interact with the AI governance function?', 'GV.RR-02 — Roles and responsibilities', 'GV.RR-02 requires roles, responsibilities, and authorities for cybersecurity risk management to be established and communicated. The intersection of the CISO''s AI security role and the AI governance function (which may sit in Risk, Legal, or Product) must be explicitly defined to prevent accountability gaps.', 3),
  ('asset-supply-chain', 'Are AI models, training datasets, and inference endpoints included in the organisation''s asset inventory (CMDB)?', 'ID.AM-01 — Asset inventory', 'ID.AM-01 requires inventories of hardware and software assets to be maintained. AI-specific assets — model weights, training datasets, inference APIs, fine-tuned model versions, vector databases — must be included in the CMDB with ownership, classification, and dependency information. Shadow AI (AI tools adopted by business units without IT knowledge) is a critical blind spot.', 0),
  ('asset-supply-chain', 'Are third-party AI model providers and data vendors assessed for security risk before onboarding?', 'ID.SC-02 — Supplier risk assessment', 'ID.SC-02 requires suppliers and partners to be assessed as part of supply chain risk management. Third-party AI suppliers — model providers, data vendors, AI-powered SaaS tools — must be assessed for AI-specific risks: bias in provided models, data provenance, security of model APIs, and contractual rights to audit.', 1),
  ('asset-supply-chain', 'Is there an AI-specific vendor risk questionnaire covering bias, security, and data governance?', 'ID.SC-03 — Supplier contracts', 'ID.SC-03 requires contracts with suppliers to include cybersecurity and privacy requirements. Generic IT vendor questionnaires do not cover AI-specific risks. A dedicated AI vendor questionnaire covering: model bias testing, training data provenance, security testing of AI outputs, and incident notification obligations is required.', 2),
  ('asset-supply-chain', 'Are vendor AI security attestations reviewed annually?', 'ID.SC-04 — Ongoing supplier monitoring', 'ID.SC-04 requires performance of suppliers to be monitored on an ongoing basis. Annual attestation review — combined with right-to-audit clauses in contracts — ensures vendor AI security posture is continuously validated rather than assessed once at onboarding and forgotten.', 3),
  ('model-data-security', 'Are training datasets encrypted at rest and in transit with access controls and audit logging?', 'PR.DS-01 — Data at rest protection', 'PR.DS-01 requires data at rest to be protected. Training datasets contain sensitive information (personal data, proprietary signals) that must be encrypted at rest (AES-256 minimum), with role-based access controls and audit logging of all access events. Access to training data should be restricted to named individuals with documented business need.', 0),
  ('model-data-security', 'Is gender or other sensitive demographic data in training corpora classified as sensitive and access-restricted?', 'PR.DS-02 — Data in transit / sensitive classification', 'PR.DS-02 requires data in transit to be protected. Sensitive demographic data in training corpora — gender, race, health status — must be classified as sensitive under the data classification policy and subject to additional access controls, encryption, and handling procedures beyond standard data protection.', 1),
  ('model-data-security', 'Are AI model weights and artefacts protected with the same rigour as source code?', 'PR.DS-10 — AI artefact integrity', 'Model weights, fine-tuned model versions, and inference artefacts are high-value intellectual property and potential attack vectors. They must be version-controlled, access-controlled, integrity-checked (hash verification), and included in the software asset protection programme. Unauthorised access to model weights enables model theft and adversarial manipulation.', 2),
  ('model-data-security', 'Is there a process to detect and respond to training data tampering or model poisoning?', 'DE.CM-09 — Detect tampering', 'Data poisoning attacks insert malicious examples into training data to corrupt model behaviour. Detecting tampering requires: integrity checksums on training datasets, anomaly detection in data pipelines, and model performance monitoring that flags unexpected shifts in output distribution. A documented response procedure for confirmed poisoning events is required.', 3),
  ('incident-detection', 'Is there an AI-specific anomaly detection capability covering adversarial inputs and biased output patterns?', 'DE.CM-06 — AI anomaly detection', 'Standard SIEM and anomaly detection tools do not cover AI-specific attack patterns. Adversarial inputs (crafted to manipulate model outputs), biased output patterns (demographic groups receiving systematically different outputs), and inference-time data exfiltration require dedicated AI monitoring capabilities beyond conventional security tooling.', 0),
  ('incident-detection', 'Are AI systems included in the Security Operations Centre (SOC) monitoring scope?', 'DE.AE-03 — SOC scope', 'AI systems must be formally included in the SOC monitoring scope with defined alert rules, escalation paths, and response playbooks. AI inference endpoints, model APIs, and training pipelines must generate security events that reach the SOC — not just application performance metrics in isolated ML dashboards.', 1),
  ('incident-detection', 'Is there a defined notification process for AI-related incidents affecting customers or regulators?', 'RS.CO-03 — Incident notification', 'RS.CO-03 requires information to be shared with stakeholders consistent with response plans. AI incidents affecting customer outcomes — discriminatory decisions, data exfiltration via model inference, adversarial manipulation — may trigger regulatory notification obligations under GDPR, EU AI Act, or sector regulations. Notification timelines and responsible parties must be pre-defined.', 2),
  ('incident-detection', 'Does the disaster recovery plan include AI model rollback and fairness re-validation procedures?', 'RC.RP-01 — Recovery planning', 'RC.RP-01 requires recovery plans to be executed and maintained. AI-specific recovery scenarios — rolling back to a previous model version following a poisoning or bias discovery, re-validating fairness metrics after a model update, restoring training data from clean backups — must be explicitly covered in the DR plan. Generic system recovery plans do not address these scenarios.', 3)
) AS q(slug, question_text, clause_ref, guidance, sort_order)
ON a.policy_id = 'nist-csf' AND a.slug = q.slug
ON CONFLICT (area_id, sort_order) DO NOTHING;

-- ISO 42001 questions
INSERT INTO questions (area_id, policy_id, question_text, clause_ref, guidance, sort_order)
SELECT a.id, 'iso-42001', q.question_text, q.clause_ref, q.guidance, q.sort_order
FROM areas a
JOIN (VALUES
  ('context-leadership', 'Has the organisation documented the internal and external issues relevant to its AI management system?', 'Cl. 4.1 — Understanding the organisation', 'Clause 4.1 requires the organisation to determine internal issues (capabilities, culture, existing governance) and external issues (regulatory environment, stakeholder expectations, competitive landscape) relevant to the AI management system. This context analysis feeds directly into risk assessment scope and must be documented and reviewed periodically.', 0),
  ('context-leadership', 'Is there a board-approved AI policy that commits to responsible AI, legal compliance, and continual improvement?', 'Cl. 5.2 — AI Policy', 'Clause 5.2 requires top management to establish, implement, and maintain an AI policy that: commits to responsible AI development and use, commits to legal and regulatory compliance, commits to continual improvement of the AIMS, and is communicated within the organisation and to relevant interested parties. Absence of a board-signed AI policy is the single most common major nonconformity at ISO 42001 certification audit.', 1),
  ('context-leadership', 'Does the AI policy explicitly address fairness, non-discrimination, and gender equity in AI outcomes?', 'Cl. 5.2, Annex B — Fairness objectives', 'Clause 5.2 combined with Annex B (AI system objectives) requires the AI policy to address non-discrimination, fairness, and human rights. Annex B explicitly lists non-discrimination and gender equity as AI system objectives. A policy that addresses general ethics but omits fairness and non-discrimination is incomplete under the standard.', 2),
  ('context-leadership', 'Has top management assigned roles and responsibilities for the AI management system?', 'Cl. 5.3 — Roles, responsibilities and authorities', 'Clause 5.3 requires top management to assign and communicate roles and responsibilities for ensuring the AIMS conforms to the standard and for reporting on AIMS performance. Named individuals — not committees or teams — with specific responsibilities must be documented. Evidence: RACI matrix or role descriptions with AI governance scope.', 3),
  ('risk-planning', 'Is there a documented methodology for identifying, analysing, and evaluating AI risks?', 'Cl. 6.1.2 — AI risk assessment', 'Clause 6.1.2 requires a documented AI risk assessment process that: identifies AI risks related to all interested parties, analyses their likelihood and consequences, evaluates them against risk criteria, and produces documented risk assessment results. The methodology must be reproducible — two different assessors following the same process must reach consistent results.', 0),
  ('risk-planning', 'Are AI risks assessed across the full lifecycle — design, development, deployment, and decommissioning?', 'Cl. 6.1.2, Cl. 8.1 — Lifecycle risk', 'Clause 6.1.2 requires risks across the full lifecycle of AI systems to be identified. Clause 8.1 requires operational planning to cover the entire lifecycle. Risks at decommissioning (data deletion, model disposal, knowledge transfer) are frequently omitted — a gap that becomes a nonconformity if systems are retired without documented risk assessment.', 1),
  ('risk-planning', 'Is bias risk formally assessed for each AI system using a documented methodology?', 'Cl. 6.1.2, Annex B.5 — Bias risk assessment', 'Annex B.5 (Non-discrimination and fairness) requires the organisation to establish objectives relating to fairness in AI outcomes. Clause 6.1.2 requires the risk assessment to cover these objectives. Bias risk must appear as a named risk category in the assessment — with likelihood, impact, and treatment defined — for every AI system in scope. Generic statements about commitment to fairness do not satisfy this requirement.', 2),
  ('risk-planning', 'Are the results of risk assessments used to determine what controls and treatments are needed?', 'Cl. 6.1.3 — Risk treatment', 'Clause 6.1.3 requires the organisation to select risk treatment options, determine the controls necessary to implement the treatment, produce a risk treatment plan, and obtain approval from risk owners. The link between risk assessment outputs and control selection must be documented and traceable — controls cannot be selected without reference to the risk they address.', 3),
  ('impact-assessment', 'Is a pre-deployment AI impact assessment conducted for all in-scope AI systems?', 'Cl. 8.4 — AIIA requirement', 'Clause 8.4 requires an AI system impact assessment to be conducted before deployment. The AIIA (AI System Impact Assessment) covers: intended purpose, technical characteristics, potential impacts on individuals and society, data used, and controls in place. It is distinct from a DPIA (personal data focus) and a FRIA (fundamental rights focus). All three may be required simultaneously for high-risk AI in regulated sectors.', 0),
  ('impact-assessment', 'Does the impact assessment include disparate impact analysis across demographic groups (gender, ethnicity, age)?', 'Cl. 8.4, Annex B.5 — Disparate impact', 'The AIIA must address disparate impact — whether the AI system produces materially different outcomes for different demographic groups. Annex B.5 requires non-discrimination as an explicit AI system objective. Single-group analysis is insufficient; intersectional analysis (gender × age, gender × ethnicity) must be performed where data permits and documented in the assessment.', 1),
  ('impact-assessment', 'Are responsible AI use controls implemented — human oversight, data quality checks, transparency mechanisms?', 'Cl. 8.3 — Operational controls', 'Clause 8.3 requires operational controls to manage AI risks during operation. For each risk identified in the assessment, a corresponding control must be in place: human oversight mechanisms for high-stakes decisions, data quality monitoring for training and inference data, transparency measures informing affected persons that AI is being used, and incident escalation procedures.', 2),
  ('impact-assessment', 'Who has authority to halt deployment if the impact assessment identifies unacceptable risks?', 'Cl. 8.4, Cl. 5.3 — Deployment authority', 'Clause 8.4 requires the AIIA to inform deployment decisions. Clause 5.3 requires roles and authorities to be assigned. The person who approves deployment based on the AIIA must have the authority to decline deployment if risks are unacceptable. A deployment gate signed by someone without halt authority is a governance fiction — not a control.', 3),
  ('audit-improvement', 'Is there an annual internal audit programme for the AI management system?', 'Cl. 9.2 — Internal audit', 'Clause 9.2 requires internal audits at planned intervals to determine whether the AIMS conforms to the standard and is effectively implemented and maintained. An annual audit programme — with defined scope, criteria, audit team independence, and documented results — is the minimum. Evidence: audit plan approved by management, audit reports, nonconformity records.', 0),
  ('audit-improvement', 'Do internal audits cover fairness metrics, bias incidents, and data governance?', 'Cl. 9.2, Annex B — Fairness in audit scope', 'Clause 9.2 requires audits to cover all requirements of the AIMS. Annex B objectives (including non-discrimination and fairness) are normative — they must be in the audit scope. Audit programmes that cover only process compliance without testing fairness outcomes and bias metrics are incomplete under the standard.', 1),
  ('audit-improvement', 'Are audit findings tracked as nonconformities with root cause analysis and corrective action?', 'Cl. 10.1 — Nonconformity and corrective action', 'Clause 10.1 requires the organisation to react to nonconformities, determine causes, implement corrective actions, and review their effectiveness. A nonconformity register with: finding description, root cause, corrective action, owner, target date, and closure verification is required evidence. Open nonconformities without root cause analysis are a recurring audit failure point.', 2),
  ('audit-improvement', 'Is the AI management system reviewed by top management at least annually?', 'Cl. 9.3 — Management review', 'Clause 9.3 requires top management to review the AIMS at planned intervals to ensure its continuing suitability, adequacy, and effectiveness. The review must consider: audit results, stakeholder feedback, performance metrics, risk profile changes, and opportunities for improvement. Evidence: management review meeting minutes with attendance, inputs considered, and decisions recorded.', 3)
) AS q(slug, question_text, clause_ref, guidance, sort_order)
ON a.policy_id = 'iso-42001' AND a.slug = q.slug
ON CONFLICT (area_id, sort_order) DO NOTHING;

-- FAIR questions
INSERT INTO questions (area_id, policy_id, question_text, clause_ref, guidance, sort_order)
SELECT a.id, 'fair', q.question_text, q.clause_ref, q.guidance, q.sort_order
FROM areas a
JOIN (VALUES
  ('taxonomy-scenarios', 'Has the organisation identified and documented AI-specific risk scenarios (model failure, data poisoning, bias at scale, adversarial attack)?', 'FAIR Phase 1 — Scenario scoping', 'FAIR scenario analysis begins with a precisely scoped risk scenario: a named asset, a named threat community, and a named loss effect. AI-specific scenarios must be defined with this precision — "bias in credit scoring model leading to regulatory fine and discrimination litigation" is a FAIR scenario; "AI risk" is not. The scenario library should cover at minimum: model performance failure, training data poisoning, regulatory enforcement action, and discrimination litigation.', 0),
  ('taxonomy-scenarios', 'Are AI risk scenarios mapped to the FAIR taxonomy — Loss Event Frequency and Loss Magnitude?', 'FAIR — LEF and LM taxonomy', 'FAIR requires every risk scenario to be expressed in terms of Loss Event Frequency (how often the loss event occurs) and Loss Magnitude (the financial impact when it does). AI scenarios must be decomposed: LEF = Threat Event Frequency × Vulnerability; LM = Primary Loss + Secondary Loss (regulatory fines, litigation, reputation). Scenarios not mapped to FAIR taxonomy cannot be quantified.', 1),
  ('taxonomy-scenarios', 'Is gender discrimination / bias-related regulatory action included as a defined loss event scenario?', 'FAIR — Secondary Loss Magnitude', 'Regulatory enforcement action for discriminatory AI outputs (EU AI Act fines, EEOC action, CFPB enforcement) represents a material Secondary Loss Magnitude component that is systematically underestimated in AI risk models. This scenario must be explicitly modelled — with regulatory fine ranges, litigation cost estimates, and reputational loss factors — rather than treated as a qualitative tail risk.', 2),
  ('taxonomy-scenarios', 'Who owns AI risk scenario development and how often are scenarios reviewed?', 'FAIR — Scenario governance', 'FAIR models are only as good as the scenarios they analyse. Scenario ownership must be assigned to a named individual in the risk function with subject matter expert input from ML engineering, legal, and product. Scenarios must be reviewed at least annually and after significant AI system changes or industry loss events that reveal new threat patterns.', 3),
  ('quantitative-modelling', 'Is the organisation using Monte Carlo simulation to quantify AI risk exposure in dollar terms?', 'FAIR — Monte Carlo quantification', 'FAIR uses Monte Carlo simulation to convert probability ranges (minimum, most likely, maximum) for LEF and LM components into a financial exposure distribution — typically expressed as the 10th, 50th, and 90th percentile of annualised loss. Without simulation, FAIR is not being used as designed. Tooling options include RiskLens, FAIR-U, or custom models built in R/Python.', 0),
  ('quantitative-modelling', 'Are EU AI Act and GDPR fine ranges incorporated into Secondary Loss Magnitude estimates?', 'FAIR — Regulatory fine ranges in SLM', 'Secondary Loss Magnitude for AI risks must include regulatory fine ranges. EU AI Act: up to €35M or 7% global turnover for prohibited use; up to €15M or 3% for high-risk non-compliance. GDPR: up to €20M or 4% for data processing violations. These are upper bounds — calibrated estimates of expected fine given the specific violation scenario are required, not worst-case maximums.', 1),
  ('quantitative-modelling', 'Is there a tooling platform in use (e.g. RiskLens, FAIR-U) or are models built in-house?', 'FAIR — Tooling', 'FAIR models can be built in spreadsheets, purpose-built platforms (RiskLens, Safe Security), or custom code (R/Python). The key requirement is that the model uses Monte Carlo simulation with calibrated probability ranges — not point estimates. In-house models must be validated for consistency with FAIR methodology before results are presented to the board.', 2),
  ('quantitative-modelling', 'Are FAIR risk model results presented to the board as financial exposure ranges, not heat map ratings?', 'FAIR — Board reporting format', 'The primary output of FAIR is a financial exposure range: "Expected Annual Loss of $800K–$3.2M, with a 10% probability of a single event exceeding $12M." Boards presented with heat map ratings instead of financial ranges cannot make risk-informed investment decisions. The transition from qualitative to quantitative reporting is the most significant maturity step in the FAIR adoption journey.', 3),
  ('threat-vulnerability', 'Have threat actors relevant to the organisation''s AI systems been identified (adversarial, insider, vendor)?', 'FAIR — Threat communities', 'FAIR requires threat communities — groups of actors with similar capabilities and intentions — to be identified for each risk scenario. AI-specific threat communities include: external adversarial attackers (prompt injection, model manipulation), malicious insiders (training data poisoning, model exfiltration), negligent vendors (poorly secured model APIs, biased third-party datasets), and regulatory bodies (enforcement action following discriminatory outcomes).', 0),
  ('threat-vulnerability', 'Is the vulnerability of AI systems to adversarial attacks assessed and scored?', 'FAIR — Vulnerability calibration', 'FAIR''s vulnerability component estimates the probability that a threat event results in a loss event, given that contact with the asset occurs. AI system vulnerability to adversarial attack depends on: model architecture, input validation controls, rate limiting, anomaly detection coverage, and patch currency. Vulnerability must be assessed per-system, not generically — a well-monitored model API has very different vulnerability than an unmonitored internal model.', 1),
  ('threat-vulnerability', 'Are bias amplification and gender stereotype reinforcement modelled as exploitable vulnerabilities?', 'FAIR — AI-specific loss factors', 'Bias amplification — where model deployment at scale magnifies existing societal biases — and gender stereotype reinforcement are material liability-generating vulnerabilities. In FAIR terms, they represent a Vulnerability that enables a discriminatory output Loss Event, leading to regulatory enforcement and litigation Secondary Loss. These must be modelled explicitly, not treated as non-financial "ethical" risks.', 2),
  ('threat-vulnerability', 'Is there a red team or penetration testing function that covers AI-specific attack vectors?', 'FAIR — Vulnerability evidence', 'Calibrated vulnerability estimates in FAIR require evidence rather than guesswork. AI-specific penetration testing — prompt injection testing, adversarial example generation, model inversion attempts, API abuse testing — provides empirical data to calibrate vulnerability inputs. Annual AI red team exercises are the evidence base for defensible FAIR vulnerability estimates.', 3)
) AS q(slug, question_text, clause_ref, guidance, sort_order)
ON a.policy_id = 'fair' AND a.slug = q.slug
ON CONFLICT (area_id, sort_order) DO NOTHING;

-- AAIA questions
INSERT INTO questions (area_id, policy_id, question_text, clause_ref, guidance, sort_order)
SELECT a.id, 'aaia', q.question_text, q.clause_ref, q.guidance, q.sort_order
FROM areas a
JOIN (VALUES
  ('audit-charter', 'Does the internal audit charter explicitly include AI systems, algorithmic bias, and fairness in scope?', 'AAIA Domain 1 — Audit Charter', 'AAIA Domain 1 requires the internal audit charter to be updated to include AI systems as an auditable domain. Without charter coverage, the audit function has no mandate to review AI — and the board has no independent assurance on AI risk. The charter must name: AI systems, algorithmic decision-making, training data quality, bias and fairness, and AI governance as explicit scope items.', 0),
  ('audit-charter', 'Is there an annual AI audit plan that prioritises systems by risk level, regulatory exposure, and societal impact?', 'AAIA Domain 2 — Risk-based AI audit plan', 'AAIA Domain 2 requires a risk-based AI audit plan that identifies AI systems for audit based on their risk profile. Prioritisation criteria must include: regulatory exposure (EU AI Act high-risk, GDPR), potential for discriminatory outcomes, scale of impact on customers or employees, and model complexity. A plan that treats all AI systems equally is not risk-based.', 1),
  ('audit-charter', 'Are AI systems affecting employment, credit, healthcare, and education audited for gender equity as a priority?', 'AAIA Domain 2 — High-risk system prioritisation', 'AAIA Domain 2 requires high-impact AI systems to be prioritised in the audit plan. Systems affecting EU AI Act Annex III categories — credit scoring, employment decisions, healthcare allocation, education access — carry the highest risk of discriminatory outcomes and must be prioritised. Gender equity analysis must be a mandatory element of audits covering these systems.', 2),
  ('audit-charter', 'Does the audit function have AI technical expertise — either in-house or through co-sourcing arrangements?', 'AAIA Domain 1 — Audit capability', 'AAIA Domain 1 requires the audit function to have or acquire the competence to audit AI. AI audit requires skills beyond traditional audit — statistical fairness testing, model evaluation methods, training data analysis, and ML pipeline review. Co-sourcing with a data science team or specialist AI audit firm is explicitly recognised as an appropriate capability model. Evidence: competency matrix, training records, co-sourcing arrangements.', 3),
  ('bias-testing', 'Is a structured bias testing methodology applied to AI systems — covering disparate impact and disparate treatment?', 'AAIA Domain 3 — Bias testing methodology', 'AAIA Domain 3 requires a structured methodology for testing algorithmic bias covering both disparate impact (different outcomes across demographic groups) and disparate treatment (different decision processes for different groups). The methodology must define: which statistical tests are applied (4/5ths rule, chi-square, odds ratio), what thresholds constitute a finding, and how findings are escalated.', 0),
  ('bias-testing', 'Are demographic parity, equalised odds, and calibration metrics measured and documented for audited systems?', 'AAIA Domain 3 — Fairness metrics', 'AAIA Domain 3 requires specific fairness metrics to be measured. Demographic parity: equal positive outcome rates across groups. Equalised odds: equal true positive and false positive rates. Calibration: equal confidence scores for equal outcomes across groups. All three must be measured and documented — no single metric captures all dimensions of fairness, and the choice of metric must be justified by the use case.', 1),
  ('bias-testing', 'Is gender treated as a mandatory protected characteristic in all bias audit engagements?', 'AAIA Domain 3 — Gender as mandatory', 'AAIA Domain 3 requires bias testing to cover protected characteristics. Gender must be treated as a mandatory characteristic in all bias audit engagements — not optional or dependent on whether a bias complaint has been received. Gender disparities in AI outputs (credit scoring, hiring, healthcare triage) are frequently detected only when explicitly tested for.', 2),
  ('bias-testing', 'Is intersectional analysis conducted (e.g. gender × ethnicity, gender × age) where data permits?', 'AAIA Domain 3 — Intersectional analysis', 'AAIA Domain 3 requires comprehensive fairness analysis. Intersectional analysis examines whether individuals who belong to multiple protected groups face compounded bias that would not be detected by single-characteristic analysis. A model that appears unbiased on gender and unbiased on ethnicity separately may still discriminate against women of specific ethnic groups. Intersectional testing must be performed where sample sizes permit.', 3),
  ('data-quality-audit', 'Are training datasets audited for representativeness, accuracy, and freedom from historical bias?', 'AAIA Domain 5 — Training data quality audit', 'AAIA Domain 5 requires audit procedures covering training data quality. Three distinct quality dimensions must be assessed: representativeness (does the training data reflect the population the model will affect?), accuracy (is the data correctly labelled and free from errors?), and freedom from historical bias (does the data encode past discriminatory practices that will be amplified by the model?). Each requires different testing approaches.', 0),
  ('data-quality-audit', 'Is gender representation in training data measured and documented?', 'AAIA Domain 5 — Gender representation', 'AAIA Domain 5 requires training data to be assessed for representativeness. Gender representation must be explicitly measured and documented — the proportion of female, male, and non-binary examples in training data, the distribution of outcomes by gender in labelled training data, and any known gaps or biases in data collection methods that may have produced gender-skewed datasets.', 1),
  ('data-quality-audit', 'Is historical underrepresentation of gender groups flagged as an audit finding requiring remediation?', 'AAIA Domain 5 — Historical bias as finding', 'AAIA Domain 5 requires data quality issues to be identified and reported. Historical underrepresentation of gender groups in training data — e.g. a hiring model trained on historical data from a male-dominated workforce — must be flagged as an audit finding requiring active remediation (data augmentation, reweighting, collection of additional representative data), not accepted as an immutable data characteristic.', 2),
  ('data-quality-audit', 'Is personal data in training datasets identified and subject to privacy controls?', 'AAIA Domain 5 — Privacy in training data', 'AAIA Domain 5 requires personal data in training datasets to be identified and controlled. Training datasets frequently contain personal data that requires a lawful basis under GDPR, data minimisation measures, and access restrictions. Audit must verify: a data inventory for training datasets, evidence of the lawful basis for processing, and technical controls preventing unauthorised access to training data containing personal information.', 3),
  ('governance-reporting', 'Does the governance audit assess whether bias incidents are escalated, investigated, and resolved systematically?', 'AAIA Domain 6 — Governance effectiveness', 'AAIA Domain 6 requires the governance audit to assess whether AI governance structures function effectively. Bias incident management is a key governance indicator: incidents must be escalated through a defined channel, investigated with root cause analysis, and resolved with documented corrective action. A governance structure where bias incidents are informally handled or suppressed is a major audit finding.', 0),
  ('governance-reporting', 'Is the diversity of the AI governance committee assessed as a quality indicator?', 'AAIA Domain 6 — Governance diversity', 'AAIA Domain 6 requires audit to assess governance quality indicators. The diversity of the AI governance committee — gender, ethnicity, disciplinary background, technical vs. non-technical representation — is a governance quality indicator. Homogeneous governance committees have systematic blind spots that affect the quality of AI risk and ethics decisions. This must appear as an audit finding when committee composition is non-diverse.', 1),
  ('governance-reporting', 'Are audit findings rated using a standardised severity scale with defined management response timelines?', 'AAIA Domain 7 — Reporting standards', 'AAIA Domain 7 requires audit findings to be communicated in a standardised format. A severity scale (Critical/High/Medium/Low or equivalent) with defined management response timelines (Critical: 30 days; High: 60 days; Medium: 90 days) enables consistent prioritisation and tracking. Findings without severity ratings cannot be consistently prioritised by management.', 2),
  ('governance-reporting', 'Are gender equity findings tracked separately with their own follow-up timeline and owner?', 'AAIA Domain 7 — Gender equity tracking', 'AAIA Domain 7 requires audit findings to be tracked to resolution. Gender equity findings — bias in AI outputs affecting women, underrepresentation in training data, discriminatory hiring or lending outcomes — must be tracked as a distinct category with dedicated ownership and follow-up timelines. Subsuming gender equity findings into a general findings log results in systematic deprioritisation.', 3)
) AS q(slug, question_text, clause_ref, guidance, sort_order)
ON a.policy_id = 'aaia' AND a.slug = q.slug
ON CONFLICT (area_id, sort_order) DO NOTHING;

-- ── SEED: QUESTION TAGS — EU AI ACT (industry relevance) ─────────────────────

INSERT INTO question_tags (question_id, industry, relevance)
SELECT q.id, t.industry, t.relevance
FROM questions q
JOIN areas a ON a.id = q.area_id
JOIN (VALUES
  -- Annex III §5(b) credit scoring question — critical for financial services
  ('eu-ai-act', 'inventory-classification', 1, 'fintech',         'critical'),
  ('eu-ai-act', 'inventory-classification', 1, 'banking',         'critical'),
  ('eu-ai-act', 'inventory-classification', 1, 'insurance',       'critical'),
  ('eu-ai-act', 'inventory-classification', 1, 'healthcare',      'critical'),
  ('eu-ai-act', 'inventory-classification', 1, 'hr-tech',         'critical'),
  -- Conformity assessment Q1 (Annex III categories) — critical for regulated industries
  ('eu-ai-act', 'conformity-assessment',   0, 'fintech',          'critical'),
  ('eu-ai-act', 'conformity-assessment',   0, 'banking',          'critical'),
  ('eu-ai-act', 'conformity-assessment',   0, 'insurance',        'high'),
  ('eu-ai-act', 'conformity-assessment',   0, 'healthcare',       'critical'),
  ('eu-ai-act', 'conformity-assessment',   0, 'hr-tech',          'critical'),
  ('eu-ai-act', 'conformity-assessment',   0, 'edtech',           'critical'),
  ('eu-ai-act', 'conformity-assessment',   0, 'public-sector',    'critical'),
  -- FRIA questions — critical for public sector and high-risk deployers
  ('eu-ai-act', 'fria',                    0, 'public-sector',    'critical'),
  ('eu-ai-act', 'fria',                    0, 'government',       'critical'),
  ('eu-ai-act', 'fria',                    0, 'fintech',          'high'),
  ('eu-ai-act', 'fria',                    0, 'healthcare',       'critical'),
  -- Training data bias — critical for all AI-heavy industries
  ('eu-ai-act', 'training-data-governance',1, 'fintech',          'critical'),
  ('eu-ai-act', 'training-data-governance',1, 'hr-tech',          'critical'),
  ('eu-ai-act', 'training-data-governance',1, 'healthcare',       'critical'),
  ('eu-ai-act', 'training-data-governance',1, 'insurance',        'high')
) AS t(policy_id, area_slug, sort_order, industry, relevance)
ON a.policy_id = t.policy_id AND a.slug = t.area_slug AND q.sort_order = t.sort_order
ON CONFLICT (question_id, industry) DO NOTHING;

-- ── DONE ─────────────────────────────────────────────────────────────────────
-- Tables created, RLS enabled, all 6 policies seeded with areas and questions.
-- EU AI Act: full clause_ref + guidance on all 24 questions.
-- All other policies: full clause_ref + guidance on all questions.
-- Run SELECT COUNT(*) FROM questions; — expect 100 rows.
