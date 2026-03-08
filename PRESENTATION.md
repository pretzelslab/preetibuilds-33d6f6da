# GTM Tech Stack — Project Presentation

---

## Slide 1: Project Title

**Building an End-to-End Go-to-Market Tech Stack with Python**
*From Lead Generation to CRM — A Real-World Sales Pipeline, Built from Scratch*

---

## Slide 2: Disclaimer

> **For demonstration and educational purposes only.**

- All lead data used in this project is **synthetically generated** using the Faker library — no real individuals, companies, or contact details are represented
- API integrations with Hunter.io and HubSpot are used strictly within the bounds of their respective developer terms of service, using personal sandbox and trial accounts
- No real customer data, proprietary datasets, or personally identifiable information (PII) has been collected, stored, or processed at any stage
- This project is intended to demonstrate technical architecture and Python programming concepts — it is not a production system and should not be used as one without appropriate data governance, security review, and compliance validation
- Any resemblance to real leads, companies, or individuals in the generated data is purely coincidental
- All libraries, frameworks, and APIs used in this project are open-source or publicly available under their respective licences (MIT, Apache 2.0, or equivalent) — no proprietary software has been replicated, reverse-engineered, or redistributed
- No copyrighted code, datasets, or intellectual property belonging to third parties has been used or incorporated at any stage of this project
- This project was built independently using publicly available documentation, APIs, and open-source tooling — in full compliance with applicable terms of service and intellectual property laws

---

## Slide 3: The Problem

Modern GTM teams operate across a fragmented landscape of disconnected tools — each solving one piece of the puzzle, but rarely talking to each other. The result is not just operational friction — it is measurable, compounding revenue loss.

**The core challenges:**

- **Disparate systems** — Lead generation, enrichment, scoring, CRM, and analytics live in separate platforms with no native integration, requiring manual handoffs at every stage. Each transition is a potential point of failure
- **Broken data flow** — Data exported from one tool rarely maps cleanly into another. Field mismatches, inconsistent naming conventions, formatting errors, and duplicate records accumulate silently — corrupting the pipeline without anyone noticing until it is too late
- **No single source of truth** — Sales and marketing teams routinely work from different datasets, different definitions of a "qualified lead," and different snapshots of pipeline health. The same contact can exist in three systems with three different statuses
- **Inability to see the big picture** — With metrics scattered across platforms, it is nearly impossible to answer a fundamental question: *"Where exactly does a lead drop off, and why?"* Without a unified view, optimisation is guesswork
- **Manual, error-prone processes** — Without automation, progressing a lead from one stage to the next depends entirely on human action — introducing delays, inconsistencies, and invisible gaps in reporting

**The revenue impact:**
Industry research consistently quantifies what broken GTM operations cost:
- Gartner estimates poor data quality costs organisations an average of **$12.9 million per year**
- Forrester attributes misaligned sales and marketing to **10%+ annual revenue loss** in B2B organisations
- According to HubSpot and LinkedIn research, **79% of marketing leads never convert to sales** — the primary cause being poor lead handoff and follow-up processes between disconnected systems
- IDC estimates that bad data costs the US economy alone **$3.1 trillion per year** in lost productivity and missed opportunity

**The result:** Revenue teams fly blind, act on incomplete data, and lose leads — and revenue — in the cracks between systems that were never designed to work together.

---

## Slide 4: The Solution

> Build the same pipeline using Python — with full control over every layer of the stack.

A fully functioning GTM tech stack that simulates how real sales and marketing teams operate — built entirely in Python across 6 modular scripts.

**Architecture Overview:**
- **Data Generation** — `faker` library produces structured, realistic lead objects with 10 fields each, stored as a pandas DataFrame and persisted to CSV
- **API Integration** — `requests` library handles REST API communication with Hunter.io (GET) and HubSpot (POST), using JSON payloads and Bearer token authentication
- **Scoring Engine** — A rule-based Python engine scores leads 0-100 across 4 weighted dimensions using `if/elif/else` logic and `pandas.apply()` for vectorised row-by-row execution
- **CRM Sync** — HTTP POST requests push qualified contacts to HubSpot CRM with structured JSON payloads, handling status codes (201, 409, 400) for success, duplicates, and errors
- **Analytics Dashboard** — `streamlit` renders a multi-section web app with `plotly` charts (funnel, pie, histogram, bar), interactive filters via `st.selectbox`, and drill-down tables per pipeline stage
- **Pipeline Orchestration** — `subprocess` module runs each script programmatically using `sys.executable` to ensure venv isolation; `logging` captures timestamped output to both console and `pipeline.log`

---

## Slide 5: Tech Stack

| Function | Enterprise (Subscription-Based) | Alternative (Non-Subscription) |
|----------|---------------------------------|-------------------------------|
| Lead Generation | ZoomInfo | Python + Faker |
| Email Verification | Clearbit | Hunter.io API |
| Lead Scoring | Salesforce Einstein | Python scoring engine |
| CRM | Salesforce | HubSpot CRM |
| Analytics | Tableau / Looker | Streamlit + Plotly |
| Pipeline Orchestration | Segment | Python ETL scripts |

---

## Slide 6: Pipeline Architecture

```
[Stage 1]          [Stage 2]           [Stage 3]
Generate 200  -->  Verify emails  -->  Score leads
fake leads         via Hunter.io       0-100 (ICP fit)
leads_raw.csv      leads_enriched.csv  leads_scored.csv

[Stage 4]          [Stage 5]           [Stage 6]
Push SQL leads -->  Live dashboard -->  Orchestrate
to HubSpot CRM      Streamlit + Plotly  all stages
leads_crm_synced    Web app             pipeline.py
```

---

## Slide 7: Stage 1 — Lead Generation

**Script:** `01_generate_leads.py`

- Generated 200 realistic fake sales leads
- Fields: name, email, company, job title, industry, company size, lead source, country
- Libraries: `faker`, `pandas`, `random`
- Output: `leads_raw.csv`

**Python concepts learned:** imports, lists, dictionaries, functions, loops, f-strings

---

## Slide 8: Stage 2 — Lead Enrichment

**Script:** `02_enrich_leads.py`

- Connected to Hunter.io REST API
- Verified email deliverability for first 25 leads (API tier limit)
- Added `email_status` and `email_score` columns
- Output: `leads_enriched.csv`

**Python concepts learned:** API calls, JSON, try/except error handling, time.sleep

---

## Slide 9: Stage 3 — Lead Scoring

**Script:** `03_score_leads.py`

- Scored each lead 0-100 based on ICP fit
- Scoring factors: industry (30pts), job title (30pts), company size (20pts), lead source (20pts)
- Classification results:
  - **93 SQL** (Sales Qualified — score 70+)
  - **97 MQL** (Marketing Qualified — score 40-69)
  - **10 Disqualified** (score below 40)
- Output: `leads_scored.csv`

**Python concepts learned:** if/else, scoring functions, apply(), filtering, sort_values

---

## Slide 10: Stage 4 — CRM Integration

**Script:** `04_crm_sync.py`

- Authenticated with HubSpot using a Private App token
- Pushed all 93 SQL leads to HubSpot CRM as contacts
- Used HTTP POST requests with JSON payload
- Output: `leads_crm_synced.csv` + live contacts in HubSpot

**Python concepts learned:** POST requests, headers, Bearer token auth, HTTP status codes

---

## Slide 11: Stage 5 — Analytics Dashboard

**Script:** `06_dashboard.py`

- Built a live web dashboard using Streamlit
- Visualizations:
  - Pipeline funnel (leads → enriched → scored → CRM)
  - Lead classification breakdown (SQL/MQL/Disqualified)
  - Score distribution histogram
  - Top industries and lead sources
- Deployable at streamlit.io

**Python concepts learned:** data visualization, Plotly charts, Streamlit web apps

---

## Slide 12: Results

| Metric | Value |
|--------|-------|
| Total leads generated | 200 |
| Emails verified | 25 |
| SQL leads (sales ready) | 93 (46.5%) |
| MQL leads (nurture) | 97 (48.5%) |
| Disqualified | 10 (5%) |
| Pushed to HubSpot CRM | 93 contacts |

---

## Slide 13: Key Learnings

**Python skills gained:**
- Working with APIs (GET and POST)
- Data manipulation with pandas
- Error handling with try/except
- Building web apps with Streamlit
- Working with JSON and CSV files

**GTM skills gained:**
- Understanding ICP (Ideal Customer Profile)
- Lead scoring methodology
- CRM data management
- Sales funnel analytics

---

## Slide 14: Next Steps & Alternative Approaches

**Immediate extensions to this stack:**
- Add email automation via Gmail API to nurture MQL leads directly from the pipeline
- Deploy the Streamlit dashboard publicly for broader team access
- Connect real lead sources — website forms, LinkedIn Lead Gen Forms, and inbound webhooks
- Upgrade lead scoring from rule-based logic to machine learning using scikit-learn or XGBoost

**Alternative architectural approaches:**

| Component | This Project | Production Alternative |
|-----------|-------------|----------------------|
| Orchestration | `subprocess` + `pipeline.py` | Apache Airflow — production-grade DAG scheduling with retries, alerts, and dependency management |
| Data Storage | CSV files | Snowflake or BigQuery — cloud data warehouses with versioning, access control, and query performance at scale |
| Data Transformation | pandas scripts | dbt (data build tool) — SQL-based transformation layer with lineage tracking and testing built in |
| Lead Scoring | Rule-based Python engine | scikit-learn / XGBoost — trained ML models that adapt scoring weights based on historical conversion data |
| Event Triggers | Scheduled script runs | Webhook-driven, event-based architecture — pipeline stages fire in real time when a lead action occurs |
| CRM Sync | One-directional push | Bi-directional sync — CRM updates propagate back into the pipeline, keeping all systems in continuous alignment |

**The principle remains the same — the tools scale with the organisation.**

---

## Slide 15: Maintenance & Operational Considerations

Any data pipeline — however well designed — requires ongoing maintenance to remain reliable and accurate. This stack is no exception.

**API & Credential Management:**
- API keys (Hunter.io, HubSpot) must be rotated periodically and stored securely — never hardcoded into scripts or committed to version control
- API rate limits and monthly quotas should be monitored; tier upgrades or alternative providers should be evaluated as lead volume grows

**Data Quality & Schema Drift:**
- As lead sources evolve, new fields may appear or existing fields may be renamed — scripts that depend on specific column names will break silently if not monitored
- Regular validation checks should confirm that CSV outputs contain expected columns, row counts are within normal ranges, and no stage is producing empty or corrupt files

**Dependency Management:**
- Python libraries (`pandas`, `requests`, `streamlit`, `plotly`) release updates frequently — version pinning via `requirements.txt` prevents unexpected breaking changes during upgrades
- The virtual environment should be rebuilt and tested after any dependency update

**Pipeline Monitoring & Logging:**
- `pipeline.log` captures every run — logs should be reviewed regularly for warnings, errors, or unexpectedly slow stages
- As the pipeline scales, consider integrating alerting (email or Slack notifications) when a stage fails or produces anomalous output

**Data Refresh Cadence:**
- Scored and enriched lead data becomes stale over time — job titles change, companies pivot, contacts leave
- A scheduled re-run cadence (weekly or monthly) should be established to keep CRM data current and scoring relevant

**Documentation:**
- `PLAN.md`, `PRD.md`, and `PRESENTATION.md` should be updated whenever the pipeline logic, scoring weights, or integration endpoints change — documentation debt compounds quickly in data systems

---

## Slide 16: Pathways to Real-World Integration

This pipeline was built as a demonstration — but the business logic it encodes is directly transferable to production environments. What changes is not the *what*, but the *how* around it.

**The core principle:** Every stage in this stack has a production-grade equivalent. The logic inside each script — how leads are scored, classified, and routed — does not need to be rewritten. It needs to be re-plumbed.

---

**Stage 1 — Replace synthetic data with real lead sources:**
- Website and landing page forms connect via webhook or form API (HubSpot Forms, Typeform, Gravity Forms)
- LinkedIn Lead Gen Forms stream directly via the LinkedIn Marketing API
- Inbound email capture via Gmail API or SendGrid inbound parse
- Manual CSV uploads with a validation layer to enforce schema consistency before ingestion
- The `generate_lead()` function is replaced by an **API listener or database query** — everything downstream remains structurally identical

**Stage 2 — Replace CSV storage with a database layer:**
- `pd.read_csv()` and `df.to_csv()` are replaced by database connectors (`sqlalchemy`, `psycopg2`, `snowflake-connector-python`)
- PostgreSQL or MySQL for structured transactional data; Snowflake or BigQuery for analytics at scale
- pandas itself does not change — only the source and destination of the data

**Stage 3 — Evolve scoring from rules to machine learning:**
- The `if/elif` scoring engine is replaced by a trained classification model (scikit-learn, XGBoost) built on historical conversion data
- The model learns which combinations of industry, title, company size, and source actually convert — rather than relying on manually assigned weights
- `score_lead(row)` becomes `model.predict_proba(lead_features)` — one function swap, same pipeline structure
- Models are retrained periodically as new conversion data accumulates

**Stage 4 — Harden CRM integration for production:**
- Bearer token authentication is replaced by OAuth 2.0 for enterprise-grade security
- One-way push becomes bi-directional sync — HubSpot webhooks propagate contact status changes back into the pipeline database
- A deduplication layer matches leads by hashed email to prevent duplicate contact creation across systems
- Conflict resolution logic defines what wins when the same contact exists in two systems with different data

**Stage 5 — Move orchestration off a single machine:**
- `subprocess` + `pipeline.py` is replaced by Apache Airflow, Prefect, or Dagster — production orchestrators that handle scheduling, retries, dependency management, and failure alerts
- Each stage script becomes a task or function within a DAG (Directed Acyclic Graph) — the logic inside does not change, only how it is invoked
- AWS Lambda or Azure Functions enable serverless, event-triggered execution — stages fire in real time when a lead action occurs rather than on a fixed schedule

**Stage 6 — Secure secrets and deploy the dashboard:**
- `config.py` is replaced by environment variables injected at runtime, or a dedicated secrets manager (AWS Secrets Manager, Azure Key Vault, HashiCorp Vault)
- The Streamlit dashboard deploys to Streamlit Cloud (direct GitHub integration), or connects to a live database for real-time data rather than reading from static CSV files

---

**What transfers directly — and what requires re-engineering:**

| Component | Transferability | Effort to adapt |
|-----------|----------------|-----------------|
| Lead scoring logic | Direct — same `if/elif` or ML wrapper | Low |
| ICP classification rules | Direct — SQL or Python, same logic | Low |
| HubSpot API integration | Direct — same endpoints, swap auth method | Low |
| pandas data transformations | Direct — change source/destination only | Low |
| Pipeline stage structure | Direct — repackage as Airflow DAG tasks | Medium |
| Dashboard visualisations | Direct — reconnect to live database | Medium |
| Data storage layer | Rebuild — CSV → relational or cloud database | Medium–High |
| Scoring model | Rebuild — rules → ML trained on real data | High |
| Event-driven triggers | Rebuild — scheduled → webhook-based | High |

---

**The honest assessment:**
The business logic — how leads are defined, scored, classified, and routed — is the hard part. That is what this project has built and validated. The infrastructure layer that surrounds it (databases, orchestrators, secrets management, event triggers) is an engineering concern that sits *around* the logic, not inside it.

This project is the blueprint. Production is the same blueprint, built with industrial-grade materials.

---

*Built with Python | HubSpot CRM | Hunter.io | Streamlit | Plotly*
