import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Zap, Database, Mail, Globe, Target, TrendingUp, BarChart3, AlertTriangle, DollarSign, Users, CheckCircle, XCircle, Settings, FileText, RefreshCw, Shield, Code, Layers, GitBranch, Activity, Server, Lock, Clock, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import SlideCard from "@/components/gtm/SlideCard";

/* ───── colour tokens ───── */
const navy = "hsl(210,40%,92%)";
const accent = "#0070F3";
const accentLight = "#0060d6";
const muted = "hsl(210,20%,45%)";
const cardBg = "hsl(210,30%,97%)";
const borderClr = "hsl(210,25%,85%)";

/* ───── shared styles ───── */
const h2Style = "text-2xl sm:text-3xl font-bold text-[hsl(210,50%,15%)] mb-2";
const pMuted = "text-sm leading-relaxed text-[hsl(210,15%,45%)]";
const statCard = "rounded-xl border border-[hsl(210,25%,85%)] bg-white p-5 text-center";
const tableHead = "text-left p-3 text-[11px] font-semibold uppercase tracking-wider text-[hsl(210,20%,50%)]";
const tableCell = "p-3 text-xs text-[hsl(210,15%,45%)]";
const tableCellBold = "p-3 text-xs font-medium text-[hsl(210,50%,15%)]";

const GTMTechStack = () => {
  return (
    <div className="min-h-screen text-[hsl(210,50%,15%)]" style={{ background: `linear-gradient(180deg, hsl(210,30%,96%) 0%, hsl(210,25%,90%) 100%)` }}>
      {/* Nav */}
      <nav className="sticky top-0 z-50 backdrop-blur-md border-b" style={{ borderColor: borderClr, background: "hsla(210,30%,98%,0.9)" }}>
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/#projects" className="inline-flex items-center gap-2 text-sm hover:text-[hsl(210,50%,15%)] transition-colors" style={{ color: accentLight }}>
            <ArrowLeft className="w-4 h-4" /> Back to Portfolio
          </Link>
          <span className="text-[11px] font-mono" style={{ color: muted }}>16 slides</span>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">

        {/* ══════ SLIDE 1 — Hero ══════ */}
        <SlideCard slideNumber={1} className="!p-12 sm:!p-16">
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full blur-[100px] opacity-20" style={{ background: accent }} />
          <div className="relative">
            <span className="inline-block text-xs font-mono px-3 py-1 rounded-full mb-6" style={{ background: `${accent}22`, color: accentLight, border: `1px solid ${accent}44` }}>
              Revenue Operations · Python · Full Pipeline
            </span>
            <h1 className="text-3xl sm:text-5xl font-bold leading-tight mb-4 text-[hsl(210,50%,15%)]">
              Building an End-to-End{" "}
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(135deg, ${accent}, ${accentLight})` }}>
                Go-to-Market Tech Stack
              </span>{" "}
              with Python
            </h1>
            <p className="text-lg sm:text-xl max-w-3xl" style={{ color: "hsl(210,20%,45%)" }}>
              From Lead Generation to CRM — A Real-World Sales Pipeline, Built from Scratch
            </p>
          </div>
        </SlideCard>

        {/* ══════ SLIDE 2 — Disclaimer ══════ */}
        <SlideCard slideNumber={2}>
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="w-6 h-6" style={{ color: "hsl(40,85%,55%)" }} />
            <h2 className={h2Style}>For Demonstration &amp; Educational Purposes Only</h2>
          </div>
          <ul className="space-y-3">
            {[
              "All lead data is synthetically generated using the Faker library — no real individuals, companies, or contact details are represented",
              "API integrations with Hunter.io and HubSpot are used strictly within developer terms of service, using personal sandbox and trial accounts",
              "No real customer data, proprietary datasets, or PII has been collected, stored, or processed at any stage",
              "Not a production system — should not be used as one without data governance, security review, and compliance validation",
              "Any resemblance to real leads, companies, or individuals is purely coincidental",
              "All libraries and APIs are open-source or publicly available (MIT, Apache 2.0) — no proprietary software replicated or redistributed",
              "No copyrighted code or intellectual property belonging to third parties has been used",
              "Built independently using public documentation — in full compliance with applicable IP laws",
            ].map((text, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed" style={{ color: "hsl(210,15%,40%)" }}>
                <span className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "hsl(40,85%,55%)" }} />
                {text}
              </li>
            ))}
          </ul>
        </SlideCard>

        {/* ══════ SLIDE 3 — The Problem ══════ */}
        <SlideCard slideNumber={3}>
          <h2 className={h2Style}>The Problem: Fragmented GTM Systems</h2>
          <p className={`${pMuted} max-w-3xl mb-8`}>
            Modern GTM teams operate across a fragmented landscape of disconnected tools. The result is not just operational friction — it is measurable, compounding revenue loss.
          </p>

          <div className="space-y-4 mb-10">
            {[
              { b: "Disparate systems", d: "Lead gen, enrichment, scoring, CRM, and analytics live in separate platforms with no native integration" },
              { b: "Broken data flow", d: "Field mismatches, naming inconsistencies, and duplicate records accumulate silently across the pipeline" },
              { b: "No single source of truth", d: "Sales and marketing work from different datasets and different definitions of a qualified lead" },
              { b: "Inability to see the big picture", d: "Metrics scattered across platforms make it impossible to pinpoint where leads drop off" },
              { b: "Manual error-prone processes", d: "Every stage depends on human action, introducing delays and invisible gaps" },
            ].map((item, i) => (
              <div key={i} className="flex gap-3 text-sm" style={{ color: "hsl(210,15%,40%)" }}>
                <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "hsl(0,60%,55%)" }} />
                <span><strong className="text-[hsl(210,50%,15%)]">{item.b}</strong> — {item.d}</span>
              </div>
            ))}
          </div>

          <h3 className="text-lg font-semibold text-[hsl(210,50%,15%)] mb-4">Revenue Impact</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {[
              { source: "Gartner", stat: "$12.9M", desc: "average annual cost of poor data quality" },
              { source: "Forrester", stat: "10%+", desc: "annual revenue loss from misaligned sales & marketing" },
              { source: "HubSpot / LinkedIn", stat: "79%", desc: "of marketing leads never convert to sales" },
              { source: "IDC", stat: "$3.1T", desc: "lost annually from bad data" },
            ].map((card, i) => (
              <div key={i} className={statCard}>
                <p className="text-2xl font-bold mb-1" style={{ color: accent }}>{card.stat}</p>
                <p className="text-[10px] font-medium text-[hsl(210,50%,15%)] mb-1">{card.source}</p>
                <p className="text-[10px]" style={{ color: muted }}>{card.desc}</p>
              </div>
            ))}
          </div>

          <p className={pMuted}>
            Revenue teams fly blind, act on incomplete data, and lose leads in the cracks between systems never designed to work together.
          </p>
        </SlideCard>

        {/* ══════ SLIDE 4 — The Solution ══════ */}
        <SlideCard slideNumber={4}>
          <h2 className={h2Style}>The Solution: A Unified Python GTM Pipeline</h2>
          <div className="my-6 rounded-xl p-5" style={{ background: `${accent}11`, border: `1px solid ${accent}33` }}>
            <p className="text-sm italic" style={{ color: accentLight }}>
              "Build the same pipeline using Python — with full control over every layer of the stack."
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Database, title: "Data Generation", desc: "faker produces structured lead objects with 10 fields, stored as pandas DataFrame, persisted to CSV" },
              { icon: Globe, title: "API Integration", desc: "requests handles REST communication with Hunter.io (GET) and HubSpot (POST) using JSON payloads and Bearer token auth" },
              { icon: Target, title: "Scoring Engine", desc: "Rule-based engine scores leads 0-100 across 4 weighted ICP dimensions using pandas.apply()" },
              { icon: Zap, title: "CRM Sync", desc: "HTTP POST pushes qualified contacts to HubSpot, handling status codes 201, 409, 400" },
              { icon: BarChart3, title: "Analytics Dashboard", desc: "streamlit web app with plotly charts, interactive filters, per-stage drill-down tables" },
              { icon: Layers, title: "Pipeline Orchestration", desc: "subprocess + sys.executable ensures venv isolation; logging captures full run history" },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="rounded-xl p-5"
                style={{ background: cardBg, border: `1px solid ${borderClr}` }}
              >
                <item.icon className="w-5 h-5 mb-3" style={{ color: accent }} />
                <h3 className="text-sm font-semibold text-[hsl(210,50%,15%)] mb-1">{item.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: muted }}>{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </SlideCard>

        {/* ══════ SLIDE 5 — Tech Stack Comparison ══════ */}
        <SlideCard slideNumber={5}>
          <h2 className={h2Style}>Tech Stack Comparison</h2>
          <div className="rounded-xl overflow-hidden mt-6" style={{ border: `1px solid ${borderClr}` }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "hsl(210,50%,16%)" }}>
                    <th className={tableHead}>Function</th>
                    <th className={tableHead}><span className="flex items-center gap-1.5"><XCircle className="w-3 h-3" style={{ color: "hsl(0,60%,55%)" }} /> Enterprise (Subscription)</span></th>
                    <th className={tableHead}><span className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3" style={{ color: "hsl(145,50%,50%)" }} /> Alternative (Non-Subscription)</span></th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Lead Generation", "ZoomInfo", "Python + Faker"],
                    ["Email Verification", "Clearbit", "Hunter.io API"],
                    ["Lead Scoring", "Salesforce Einstein", "Python scoring engine"],
                    ["CRM", "Salesforce", "HubSpot CRM"],
                    ["Analytics", "Tableau / Looker", "Streamlit + Plotly"],
                    ["Pipeline Orchestration", "Segment", "Python ETL scripts"],
                  ].map(([fn, ent, alt], i) => (
                    <tr key={fn} style={{ background: i % 2 === 0 ? "hsl(210,50%,12%)" : "hsl(210,50%,13%)", borderTop: `1px solid ${borderClr}` }}>
                      <td className={tableCellBold}>{fn}</td>
                      <td className={tableCell}>{ent}</td>
                      <td className="p-3 text-xs font-medium" style={{ color: "hsl(145,50%,55%)" }}>{alt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </SlideCard>

        {/* ══════ SLIDE 6 — Pipeline Architecture ══════ */}
        <SlideCard slideNumber={6}>
          <h2 className={h2Style}>Pipeline Architecture — 6 Stages</h2>
          <div className="mt-8 overflow-x-auto">
            <div className="flex items-center gap-2 min-w-[750px]">
              {[
                { label: "Lead Generation", output: "leads_raw.csv", icon: Globe },
                { label: "Lead Enrichment", output: "leads_enriched.csv", icon: Mail },
                { label: "Lead Scoring", output: "leads_scored.csv", icon: Target },
                { label: "CRM Sync", output: "HubSpot CRM", icon: Zap },
                { label: "Analytics Dashboard", output: "Live Streamlit app", icon: BarChart3 },
                { label: "Pipeline Orchestration", output: "pipeline.py", icon: Layers },
              ].map((stage, i) => (
                <div key={stage.label} className="flex items-center gap-2 flex-1">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.85 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex-1 rounded-xl p-4 text-center"
                    style={{ background: cardBg, border: `1px solid ${borderClr}` }}
                  >
                    <stage.icon className="w-5 h-5 mx-auto mb-2" style={{ color: accent }} />
                    <p className="text-[11px] font-semibold text-white mb-1">Stage {i + 1}</p>
                    <p className="text-[10px] text-white/80">{stage.label}</p>
                    <p className="text-[9px] mt-1.5 font-mono" style={{ color: muted }}>→ {stage.output}</p>
                  </motion.div>
                  {i < 5 && <ArrowRight className="w-4 h-4 flex-shrink-0" style={{ color: "hsl(210,30%,30%)" }} />}
                </div>
              ))}
            </div>
          </div>
        </SlideCard>

        {/* ══════ SLIDES 7-11 — Stages 1-5 ══════ */}
        {([
          {
            num: 7, title: "Stage 1 — Lead Generation", script: "01_generate_leads.py",
            bullets: [
              "Generated 200 realistic fake sales leads",
              "Fields: name, email, company, job title, industry, company size, lead source, country",
              "Libraries: faker, pandas, random",
              "Output: leads_raw.csv",
            ],
            concepts: "imports, lists, dictionaries, functions, loops, f-strings",
          },
          {
            num: 8, title: "Stage 2 — Lead Enrichment", script: "02_enrich_leads.py",
            bullets: [
              "Connected to Hunter.io REST API via GET requests",
              "Verified email deliverability for first 25 leads (API tier limit)",
              "Added email_status and email_score columns",
              "Output: leads_enriched.csv",
            ],
            concepts: "API calls, JSON parsing, try/except error handling, time.sleep",
          },
          {
            num: 9, title: "Stage 3 — Lead Scoring", script: "03_score_leads.py",
            bullets: [
              "Scored each lead 0-100 based on ICP fit",
              "Scoring: Industry 30pts | Job Title 30pts | Company Size 20pts | Lead Source 20pts",
              "93 SQL (score 70+) | 97 MQL (score 40-69) | 10 Disqualified (below 40)",
              "Output: leads_scored.csv",
            ],
            concepts: "if/elif/else, scoring functions, apply(), filtering, sort_values",
          },
          {
            num: 10, title: "Stage 4 — CRM Integration", script: "04_crm_sync.py",
            bullets: [
              "Authenticated with HubSpot using a Private App Bearer token",
              "Filtered to SQL-only leads before pushing",
              "HTTP POST requests with structured JSON payloads",
              "Status codes: 201 (created), 409 (duplicate), 400 (bad request)",
              "Output: leads_crm_synced.csv + 93 live contacts in HubSpot",
            ],
            concepts: "POST requests, headers, Bearer token auth, HTTP status codes",
          },
          {
            num: 11, title: "Stage 5 — Analytics Dashboard", script: "06_dashboard.py",
            bullets: [
              "Live web dashboard built with Streamlit + Plotly",
              "Pipeline funnel with progressive colours and per-stage drill-down",
              "Lead classification pie chart, score histogram, industry/source bar charts",
              "Leads table sorted SQL → MQL → Disqualified",
              "Run: streamlit run 06_dashboard.py",
            ],
            concepts: "Streamlit, Plotly, caching, selectbox filters, pd.Categorical sorting",
          },
        ] as const).map((stage) => (
          <SlideCard key={stage.num} slideNumber={stage.num}>
            <h2 className={h2Style}>{stage.title}</h2>
            <span className="inline-block text-[11px] font-mono px-3 py-1 rounded-full mb-6" style={{ background: `${accent}18`, color: accentLight, border: `1px solid ${accent}33` }}>
              {stage.script}
            </span>
            <ul className="space-y-3 mb-6">
              {stage.bullets.map((b, i) => (
                <li key={i} className="flex gap-3 text-sm" style={{ color: "hsl(210,25%,65%)" }}>
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "hsl(145,50%,50%)" }} />
                  {b}
                </li>
              ))}
            </ul>
            <div className="rounded-lg px-4 py-3" style={{ background: "hsl(210,50%,16%)", border: `1px solid ${borderClr}` }}>
              <p className="text-[11px]" style={{ color: muted }}>
                <strong className="text-white">Python concepts:</strong> {stage.concepts}
              </p>
            </div>
          </SlideCard>
        ))}

        {/* ══════ SLIDE 12 — Results ══════ */}
        <SlideCard slideNumber={12}>
          <h2 className={h2Style}>Results</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
            {[
              { label: "Total leads generated", value: "200", color: accent },
              { label: "Emails verified", value: "25", color: "hsl(250,55%,60%)" },
              { label: "SQL leads", value: "93", sub: "46.5%", color: "hsl(145,50%,50%)" },
              { label: "MQL leads", value: "97", sub: "48.5%", color: "hsl(40,80%,55%)" },
              { label: "Disqualified", value: "10", sub: "5%", color: "hsl(0,60%,55%)" },
              { label: "Pushed to HubSpot", value: "93", color: "hsl(25,80%,55%)" },
            ].map((m, i) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className={statCard}
              >
                <p className="text-3xl sm:text-4xl font-bold" style={{ color: m.color }}>{m.value}</p>
                {m.sub && <p className="text-xs font-mono mt-0.5" style={{ color: m.color }}>{m.sub}</p>}
                <p className="text-[11px] mt-2" style={{ color: muted }}>{m.label}</p>
              </motion.div>
            ))}
          </div>
        </SlideCard>

        {/* ══════ SLIDE 13 — Key Learnings ══════ */}
        <SlideCard slideNumber={13}>
          <h2 className={h2Style}>Key Learnings</h2>
          <div className="grid sm:grid-cols-2 gap-6 mt-6">
            <div className="rounded-xl p-6" style={{ background: cardBg, border: `1px solid ${borderClr}` }}>
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: accent }}>
                <Code className="w-4 h-4" /> Python Skills
              </h3>
              <ul className="space-y-2">
                {["REST API communication", "pandas data manipulation", "try/except error handling", "Streamlit web apps", "subprocess pipeline orchestration"].map((s) => (
                  <li key={s} className="text-sm flex gap-2" style={{ color: "hsl(210,25%,65%)" }}>
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: accent }} />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl p-6" style={{ background: cardBg, border: `1px solid ${borderClr}` }}>
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: accentLight }}>
                <TrendingUp className="w-4 h-4" /> GTM Skills
              </h3>
              <ul className="space-y-2">
                {["ICP design and scoring logic", "Lead classification methodology", "CRM data management", "Sales funnel analytics"].map((s) => (
                  <li key={s} className="text-sm flex gap-2" style={{ color: "hsl(210,25%,65%)" }}>
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: accentLight }} />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </SlideCard>

        {/* ══════ SLIDE 14 — Next Steps ══════ */}
        <SlideCard slideNumber={14}>
          <h2 className={h2Style}>Next Steps &amp; Alternative Approaches</h2>

          <h3 className="text-base font-semibold text-white mt-6 mb-4">Immediate Extensions</h3>
          <div className="grid sm:grid-cols-2 gap-3 mb-8">
            {[
              "Email automation via Gmail API for MQL nurturing",
              "Deploy dashboard publicly",
              "Connect real lead sources — website forms, LinkedIn, webhooks",
              "Upgrade to ML scoring with scikit-learn or XGBoost",
            ].map((item, i) => (
              <div key={i} className="flex gap-3 text-sm rounded-lg p-3" style={{ background: cardBg, border: `1px solid ${borderClr}`, color: "hsl(210,25%,65%)" }}>
                <ArrowRight className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: accent }} />
                {item}
              </div>
            ))}
          </div>

          <h3 className="text-base font-semibold text-white mb-4">Alternatives</h3>
          <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${borderClr}` }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "hsl(210,50%,16%)" }}>
                    <th className={tableHead}>Component</th>
                    <th className={tableHead}>This Project</th>
                    <th className={tableHead}>Production Alternative</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Orchestration", "subprocess + pipeline.py", "Apache Airflow"],
                    ["Data Storage", "CSV files", "Snowflake / BigQuery"],
                    ["Transformation", "pandas", "dbt"],
                    ["Lead Scoring", "Rule-based", "scikit-learn / XGBoost"],
                    ["Event Triggers", "Scheduled runs", "Webhook-driven architecture"],
                    ["CRM Sync", "One-directional", "Bi-directional sync"],
                  ].map(([comp, curr, prod], i) => (
                    <tr key={comp} style={{ background: i % 2 === 0 ? "hsl(210,50%,12%)" : "hsl(210,50%,13%)", borderTop: `1px solid ${borderClr}` }}>
                      <td className={tableCellBold}>{comp}</td>
                      <td className={tableCell}>{curr}</td>
                      <td className="p-3 text-xs font-medium" style={{ color: "hsl(145,50%,55%)" }}>{prod}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </SlideCard>

        {/* ══════ SLIDE 15 — Maintenance ══════ */}
        <SlideCard slideNumber={15}>
          <h2 className={h2Style}>Maintenance &amp; Operational Considerations</h2>
          <div className="grid sm:grid-cols-2 gap-4 mt-6">
            {[
              { icon: Lock, title: "API & Credentials", desc: "Rotate keys periodically, never commit to version control, monitor rate limits" },
              { icon: Shield, title: "Data Quality", desc: "Validate columns and row counts after every run, watch for schema drift" },
              { icon: GitBranch, title: "Dependencies", desc: "Pin versions in requirements.txt, rebuild venv after updates" },
              { icon: Activity, title: "Monitoring", desc: "Review pipeline.log regularly, add alerting for failures" },
              { icon: Clock, title: "Refresh Cadence", desc: "Re-run weekly or monthly — lead data becomes stale over time" },
              { icon: BookOpen, title: "Documentation", desc: "Update PLAN.md, PRD.md, PRESENTATION.md whenever logic changes" },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="rounded-xl p-5"
                style={{ background: cardBg, border: `1px solid ${borderClr}` }}
              >
                <item.icon className="w-5 h-5 mb-3" style={{ color: accent }} />
                <h3 className="text-sm font-semibold text-white mb-1">{item.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: muted }}>{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </SlideCard>

        {/* ══════ SLIDE 16 — Real-World Integration ══════ */}
        <SlideCard slideNumber={16}>
          <h2 className={h2Style}>Pathways to Real-World Integration</h2>
          <p className={`${pMuted} max-w-3xl mb-8`}>
            The business logic does not need to be rewritten. It needs to be re-plumbed.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {[
              { stage: "Stage 1", desc: "Replace faker with HubSpot Forms, LinkedIn API, SendGrid, CSV uploads with validation" },
              { stage: "Stage 2", desc: "Replace CSV with sqlalchemy/psycopg2/snowflake-connector; pandas unchanged" },
              { stage: "Stage 3", desc: "Replace if/elif with scikit-learn/XGBoost model.predict_proba(); retrained on conversion data" },
              { stage: "Stage 4", desc: "Replace Bearer token with OAuth 2.0; add bi-directional sync and email deduplication" },
              { stage: "Stage 5", desc: "Replace subprocess with Apache Airflow or AWS Lambda event triggers" },
              { stage: "Stage 6", desc: "Replace config.py with AWS Secrets Manager or Azure Key Vault" },
            ].map((item, i) => (
              <motion.div
                key={item.stage}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="rounded-xl p-5"
                style={{ background: cardBg, border: `1px solid ${borderClr}` }}
              >
                <span className="text-[11px] font-mono font-semibold" style={{ color: accent }}>{item.stage}</span>
                <p className="text-xs leading-relaxed mt-2" style={{ color: "hsl(210,25%,65%)" }}>{item.desc}</p>
              </motion.div>
            ))}
          </div>

          <h3 className="text-base font-semibold text-white mb-4">Transferability</h3>
          <div className="rounded-xl overflow-hidden mb-8" style={{ border: `1px solid ${borderClr}` }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "hsl(210,50%,16%)" }}>
                    <th className={tableHead}>Component</th>
                    <th className={tableHead}>Effort</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Lead scoring logic", "Low"],
                    ["HubSpot API integration", "Low"],
                    ["pandas transformations", "Low"],
                    ["Pipeline stage structure", "Medium"],
                    ["Dashboard visualisations", "Medium"],
                    ["Data storage layer", "Medium-High"],
                    ["Scoring model", "High"],
                    ["Event-driven triggers", "High"],
                  ].map(([comp, effort], i) => (
                    <tr key={comp} style={{ background: i % 2 === 0 ? "hsl(210,50%,12%)" : "hsl(210,50%,13%)", borderTop: `1px solid ${borderClr}` }}>
                      <td className={tableCellBold}>{comp}</td>
                      <td className="p-3">
                        <span className="text-[10px] font-mono px-2 py-1 rounded-full" style={{
                          background: effort === "Low" ? "hsl(145,50%,45%,0.15)" : effort === "Medium" ? "hsl(40,70%,50%,0.15)" : effort === "High" ? "hsl(0,60%,50%,0.15)" : "hsl(25,70%,50%,0.15)",
                          color: effort === "Low" ? "hsl(145,50%,55%)" : effort === "Medium" ? "hsl(40,70%,55%)" : effort === "High" ? "hsl(0,60%,55%)" : "hsl(25,70%,55%)",
                        }}>
                          {effort}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Closing */}
          <div className="rounded-xl p-6" style={{ background: `linear-gradient(135deg, ${accent}18, ${accent}08)`, border: `1px solid ${accent}33` }}>
            <p className="text-sm font-medium text-white">
              This project is the blueprint. Production is the same blueprint, built with industrial-grade materials.
            </p>
          </div>
        </SlideCard>

        {/* Footer */}
        <div className="text-center py-8">
          <p className="text-xs font-mono" style={{ color: muted }}>
            Built with Python · HubSpot CRM · Hunter.io · Streamlit · Plotly
          </p>
        </div>
      </div>
    </div>
  );
};

export default GTMTechStack;
