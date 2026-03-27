import { useState, useRef, useEffect } from "react";
import { useGateUnlocked } from "@/components/ui/PageGate";

// ─── PIPELINE CONFIGURATION (schema-driven — add verticals/sources/clusters here) ─
const PIPELINE_CONFIG = {
  verticals: [
    {
      id: "fintech",
      name: "Fintech",
      emoji: "🏦",
      description: "Banking · Payments · Lending",
      color: { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe", dot: "#3b82f6" },
      sourceFilter: "Vertical__c = 'fintech'",
    },
    {
      id: "healthtech",
      name: "Healthtech",
      emoji: "🏥",
      description: "EHR · Telehealth · Portal",
      color: { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0", dot: "#22c55e" },
      sourceFilter: "Vertical__c = 'healthtech'",
    },
    {
      id: "insurtech",
      name: "Insurtech",
      emoji: "🛡",
      description: "Claims · Underwriting · Policy",
      color: { bg: "#fdf4ff", text: "#7e22ce", border: "#e9d5ff", dot: "#a855f7" },
      sourceFilter: "Vertical__c = 'insurtech'",
    },
    {
      id: "edtech",
      name: "Edtech",
      emoji: "🎓",
      description: "LMS · Assessments · Portals",
      color: { bg: "#fff7ed", text: "#c2410c", border: "#fed7aa", dot: "#f97316" },
      sourceFilter: "Vertical__c = 'edtech'",
    },
  ],

  sources: [
    { id: "salesforce", name: "Salesforce", icon: "☁", color: "#00a1e0", label: "Cases Object" },
    { id: "zendesk",    name: "Zendesk",    icon: "🎫", color: "#03363d", label: "Tickets" },
    { id: "hubspot",    name: "HubSpot",    icon: "🟠", color: "#ff7a59", label: "Tickets" },
    { id: "intercom",   name: "Intercom",   icon: "💬", color: "#1f8ded", label: "Conversations" },
    { id: "csv",        name: "CSV / API",  icon: "📂", color: "#64748b", label: "Flat File" },
  ],

  clusterDimensions: [
    { id: "type",     label: "Issue Type",     field: "type",        description: "Performance · UX · Data Loss · Feature Gap" },
    { id: "priority", label: "Priority",       field: "priority",    description: "Critical · High · Medium" },
    { id: "product",  label: "Product",        field: "product",     description: "Cluster by affected product" },
    { id: "account",  label: "Account Tier",   field: "accountTier", description: "Enterprise · Mid-Market · SMB" },
  ],

  scalingRules: {
    directThreshold: 50,
    chunkedThreshold: 500,
    chunkSize: 20,
    maxParallelWorkers: 10,
    soqlPageSize: 200,
  },

  dateRanges: [
    { label: "Last 7 days",  days: 7 },
    { label: "Last 14 days", days: 14 },
    { label: "Last 30 days", days: 30 },
    { label: "All cases",    days: 999 },
  ],
};

// ─── SIMULATED CASE DATA ────────────────────────────────────────────────────────
const SF_CASES = {
  fintech: [
    { id: "CS-10041", account: "Apex Capital Partners", contact: "Sara Mendes", priority: "High", status: "Open", product: "Portfolio Tracker", subject: "Portfolio page takes 15+ seconds during market hours", created: "2026-03-01", type: "Performance", accountTier: "Enterprise" },
    { id: "CS-10055", account: "BrightPay Solutions", contact: "Tom Lawson", priority: "Critical", status: "Escalated", product: "KYC Onboarding", subject: "KYC form data lost after 15-minute session timeout", created: "2026-03-02", type: "Data Loss", accountTier: "Enterprise" },
    { id: "CS-10062", account: "NovaTrust Bank", contact: "Elena Rossi", priority: "Medium", status: "Open", product: "Mobile Banking App", subject: "Account switching navigation is deeply confusing", created: "2026-03-03", type: "UX", accountTier: "Mid-Market" },
    { id: "CS-10078", account: "ClearFund Inc", contact: "James Okafor", priority: "High", status: "Open", product: "Expense Analytics", subject: "Cannot apply date range and category filters simultaneously", created: "2026-03-04", type: "Feature Gap", accountTier: "Mid-Market" },
    { id: "CS-10091", account: "Meridian Wealth", contact: "Priya Shah", priority: "High", status: "Open", product: "Transaction History", subject: "Transactions exceed 20s load for accounts with 2+ years history", created: "2026-03-05", type: "Performance", accountTier: "Enterprise" },
    { id: "CS-10103", account: "FastLend Corp", contact: "David Kim", priority: "Critical", status: "Escalated", product: "Loan Management", subject: "Loan application progress lost on accidental tab close", created: "2026-03-06", type: "Data Loss", accountTier: "Enterprise" },
    { id: "CS-10117", account: "PayStream Ltd", contact: "Alice Chen", priority: "Medium", status: "Open", product: "Web Dashboard", subject: "All dashboard widgets blank for 8-10 seconds on login", created: "2026-03-07", type: "Performance", accountTier: "Mid-Market" },
    { id: "CS-10128", account: "Apex Capital Partners", contact: "Marco Bianchi", priority: "Medium", status: "Open", product: "Financial Insights", subject: "Spending and investment cross-reference requires 4 separate clicks", created: "2026-03-08", type: "Feature Gap", accountTier: "Enterprise" },
    { id: "CS-10145", account: "EquityPath Partners", contact: "Nadia Osei", priority: "Critical", status: "Escalated", product: "Payment Processing", subject: "Payment confirmation freezes on high-value transactions over $50k", created: "2026-03-09", type: "Performance", accountTier: "Enterprise" },
    { id: "CS-10159", account: "NovaTrust Bank", contact: "Raj Patel", priority: "High", status: "Open", product: "Budget Planning", subject: "Budget categories cannot be customised or renamed", created: "2026-03-10", type: "Feature Gap", accountTier: "Mid-Market" },
    { id: "CS-10172", account: "FastLend Corp", contact: "Tanya Moore", priority: "High", status: "Open", product: "KYC Onboarding", subject: "Document upload step has no progress indicator and appears frozen", created: "2026-03-11", type: "UX", accountTier: "Enterprise" },
    { id: "CS-10184", account: "ClearFund Inc", contact: "Oliver Grant", priority: "Medium", status: "Open", product: "Multi-Account Management", subject: "No bulk action capability when managing multiple sub-accounts", created: "2026-03-12", type: "Feature Gap", accountTier: "Mid-Market" },
  ],
  healthtech: [
    { id: "CS-20033", account: "Riverside Medical Group", contact: "Dr. Amy Walsh", priority: "Critical", status: "Escalated", product: "Lab Results Viewer", subject: "Critical lab results take 30+ seconds to display for clinicians", created: "2026-03-01", type: "Performance", accountTier: "Enterprise" },
    { id: "CS-20047", account: "Summit Health Network", contact: "Rachel Torres", priority: "High", status: "Open", product: "Insurance Claims", subject: "Prior auth form data wiped on browser back button press", created: "2026-03-02", type: "Data Loss", accountTier: "Enterprise" },
    { id: "CS-20059", account: "BlueStar Clinic", contact: "Nathan Ford", priority: "Medium", status: "Open", product: "Patient Portal", subject: "Patients cannot locate care team messaging without calling support", created: "2026-03-03", type: "UX", accountTier: "Mid-Market" },
    { id: "CS-20071", account: "CareFirst Partners", contact: "Linda Zhao", priority: "High", status: "Open", product: "Health Records (EHR)", subject: "No unified search across labs, notes, and prescriptions", created: "2026-03-04", type: "Feature Gap", accountTier: "Enterprise" },
    { id: "CS-20084", account: "Helix Telehealth", contact: "Dr. James Obi", priority: "High", status: "Open", product: "Appointment Scheduling", subject: "Calendar freezes 10-15 seconds loading 3+ months of appointments", created: "2026-03-05", type: "Performance", accountTier: "Mid-Market" },
    { id: "CS-20096", account: "Riverside Medical Group", contact: "Sarah Mills", priority: "Critical", status: "Escalated", product: "Intake Questionnaires", subject: "New patient medical history form loses all data on session expiry", created: "2026-03-06", type: "Data Loss", accountTier: "Enterprise" },
    { id: "CS-20108", account: "Summit Health Network", contact: "Chris Lee", priority: "Medium", status: "Open", product: "Prescription Management", subject: "Navigation between prescriptions and messaging is non-obvious", created: "2026-03-07", type: "UX", accountTier: "Enterprise" },
    { id: "CS-20119", account: "BlueStar Clinic", contact: "Maria Gonzalez", priority: "High", status: "Open", product: "Wellness Tracking", subject: "Wellness metrics and lab results cannot be viewed side-by-side", created: "2026-03-08", type: "Feature Gap", accountTier: "Mid-Market" },
    { id: "CS-20133", account: "CareFirst Partners", contact: "Dr. Miriam Cole", priority: "Critical", status: "Escalated", product: "Telehealth Video", subject: "Video consultation drops after exactly 8 minutes on mobile Safari", created: "2026-03-09", type: "Performance", accountTier: "Enterprise" },
    { id: "CS-20147", account: "Helix Telehealth", contact: "Paul Nkosi", priority: "High", status: "Open", product: "Symptom Checker", subject: "Symptom checker does not save progress if user navigates away", created: "2026-03-10", type: "Data Loss", accountTier: "Mid-Market" },
    { id: "CS-20158", account: "Riverside Medical Group", contact: "Jen Hartley", priority: "Medium", status: "Open", product: "Appointment Scheduling", subject: "No waitlist or cancellation-fill feature when slots open up", created: "2026-03-11", type: "Feature Gap", accountTier: "Enterprise" },
    { id: "CS-20169", account: "BlueStar Clinic", contact: "Tom Nakamura", priority: "Medium", status: "Open", product: "Patient Portal", subject: "Accessibility: font sizes fixed and contrast ratios fail WCAG AA", created: "2026-03-12", type: "UX", accountTier: "Mid-Market" },
  ],
  insurtech: [
    { id: "CS-30011", account: "Shield Insurance Group", contact: "Karen Park", priority: "Critical", status: "Escalated", product: "Claims Portal", subject: "Claim submission times out after 5 minutes with no recovery", created: "2026-03-01", type: "Data Loss", accountTier: "Enterprise" },
    { id: "CS-30024", account: "CoverNow", contact: "Ben Okafor", priority: "High", status: "Open", product: "Policy Management", subject: "Premium calculation takes 25+ seconds for complex policies", created: "2026-03-03", type: "Performance", accountTier: "Mid-Market" },
    { id: "CS-30038", account: "TrustMark Mutual", contact: "Diana Cho", priority: "Medium", status: "Open", product: "Customer Portal", subject: "No way to compare policy tiers before purchasing", created: "2026-03-05", type: "Feature Gap", accountTier: "Enterprise" },
    { id: "CS-30047", account: "Shield Insurance Group", contact: "Leo Vance", priority: "High", status: "Open", product: "Underwriting Engine", subject: "Risk scoring UI gives no explanation of decision factors", created: "2026-03-07", type: "UX", accountTier: "Enterprise" },
    { id: "CS-30059", account: "PureRisk Partners", contact: "Maria Santos", priority: "Critical", status: "Escalated", product: "Claims Portal", subject: "Uploaded documents silently fail without error message", created: "2026-03-09", type: "Data Loss", accountTier: "Mid-Market" },
    { id: "CS-30072", account: "CoverNow", contact: "James Hill", priority: "Medium", status: "Open", product: "Policy Management", subject: "No bulk renewal workflow for fleet or group policies", created: "2026-03-11", type: "Feature Gap", accountTier: "Mid-Market" },
  ],
  edtech: [
    { id: "CS-40015", account: "BrightMinds University", contact: "Prof. Chen", priority: "Critical", status: "Escalated", product: "Assessment Engine", subject: "Student exam submissions lost on connection drop mid-test", created: "2026-03-01", type: "Data Loss", accountTier: "Enterprise" },
    { id: "CS-40028", account: "LearnPath Corp", contact: "Sandra Wu", priority: "High", status: "Open", product: "LMS", subject: "Video lectures buffer for 20+ seconds on standard broadband", created: "2026-03-03", type: "Performance", accountTier: "Mid-Market" },
    { id: "CS-40041", account: "SkillUp Academy", contact: "Raj Nair", priority: "High", status: "Open", product: "Student Portal", subject: "Progress tracking and certification pathway in different sections with no cross-link", created: "2026-03-05", type: "UX", accountTier: "Mid-Market" },
    { id: "CS-40055", account: "BrightMinds University", contact: "Dr. Adams", priority: "High", status: "Open", product: "LMS", subject: "No ability to reuse or clone assignments across courses", created: "2026-03-07", type: "Feature Gap", accountTier: "Enterprise" },
    { id: "CS-40068", account: "LearnPath Corp", contact: "Tony Blair", priority: "Medium", status: "Open", product: "Assessment Engine", subject: "Rubric builder has no drag-and-drop reordering of criteria", created: "2026-03-09", type: "UX", accountTier: "Mid-Market" },
    { id: "CS-40081", account: "SkillUp Academy", contact: "Priya Kapoor", priority: "Medium", status: "Open", product: "Live Tutoring", subject: "Session recording storage quota not visible until it fails", created: "2026-03-11", type: "Feature Gap", accountTier: "Mid-Market" },
  ],
};

// ─── MOCK REPORTS (pre-seeded per vertical for instant demo) ───────────────────
const MOCK_REPORTS = {
  fintech: {
    vertical: "Fintech", summary: "Critical data loss and performance failures are directly causing customer churn across Enterprise accounts, with KYC and loan application flows at highest risk. Consolidated analytics and multi-filter capabilities represent the strongest near-term growth opportunity.",
    caseBreakdown: { Performance: 4, "Data Loss": 3, UX: 2, "Feature Gap": 3 },
    intelligence: [
      { theme: "Session Timeout Data Loss — KYC & Loan Flows", severity: "Critical", caseCount: 3, affectedProducts: ["KYC Onboarding", "Loan Management"], affectedAccounts: ["BrightPay Solutions", "FastLend Corp"], userImpact: "Customers abandoning multi-step forms with no recovery path, directly causing churn and lost loan conversions.", rootCause: "No client-side session persistence or autosave. Form state held in memory only — lost on timeout or navigation.", recommendation: "Implement localStorage draft autosave every 30s + server-side draft API with resume token. Owner: Engineering.", effort: "Medium", representativeCase: "CS-10055" },
      { theme: "Frontend Performance Degradation on Data-Heavy Views", severity: "High", caseCount: 4, affectedProducts: ["Portfolio Tracker", "Transaction History", "Web Dashboard"], affectedAccounts: ["Apex Capital", "Meridian Wealth", "PayStream"], userImpact: "15–20s load times during peak hours. Dashboard blank on login 8–10s. Payment confirmation freeze creating duplicate submission risk.", rootCause: "No pagination or virtual scrolling on large datasets. Dashboard loads all widgets synchronously on mount.", recommendation: "Add server-side pagination + React virtualisation. Implement Redis cache for portfolio queries. Load widgets lazily. Owner: Engineering.", effort: "High", representativeCase: "CS-10041" },
      { theme: "Navigation Architecture Hiding Core Workflows", severity: "High", caseCount: 2, affectedProducts: ["Mobile Banking App", "KYC Onboarding"], affectedAccounts: ["NovaTrust Bank", "FastLend Corp"], userImpact: "Customers calling support unable to find account switching and payment initiation. KYC upload step has no progress indicator.", rootCause: "Information architecture buries high-frequency actions 3–4 levels deep. No progress indicators on async operations.", recommendation: "Card-sort IA redesign. Add persistent bottom nav for top-3 actions. Add upload progress bar. Owner: Design + Engineering.", effort: "Medium", representativeCase: "CS-10062" },
    ],
    growthAreas: [
      { opportunity: "Unified Analytics Hub with Cross-Filter", signal: "CS-10078, CS-10128 — users cross-referencing data in Excel due to siloed views", potentialImpact: "High", suggestedFeature: "Unified Insights screen combining spending, investment, and transaction data with multi-dimension filtering. Saved filter presets.", targetSegment: "Wealth advisors and corporate finance teams at Enterprise accounts", timeToValue: "Mid-term", competitiveAngle: "Most competitors offer separate modules. A unified view with cross-filter is a table-stakes ask that none currently deliver well for B2B." },
      { opportunity: "Autosave & Session Recovery as Trust Feature", signal: "3 critical data-loss cases — customers explicitly churned after losing form data", potentialImpact: "High", suggestedFeature: "Universal autosave framework with visible 'Draft saved' indicator + resume-from-last-point on session restore.", targetSegment: "All segments — especially high-value Enterprise onboarding flows", timeToValue: "Quick Win", competitiveAngle: "Table-stakes feature missing entirely. Any competitor offering this wins the comparison in sales demos." },
    ],
    priorityMatrix: {
      doNow: ["Ship autosave + draft recovery for KYC and Loan application flows — critical churn risk", "Fix payment confirmation freeze on $50k+ transactions — compliance and duplicate payment risk"],
      planNext: ["Paginate + virtualise Transaction History and Portfolio views", "Redesign Mobile Banking nav IA — card sort, prototype, ship in Q3"],
      watchAndLearn: ["Monitor budget category customisation demand via forum", "Track dashboard load time after lazy-load widget fix"]
    },
    riskFlags: ["Payment confirmation freeze on $50k+ transactions (CS-10145) creates duplicate payment risk — potential compliance and financial liability exposure.", "KYC data loss on session timeout (CS-10055) may violate data handling commitments in enterprise contracts — legal review recommended."]
  },
  healthtech: {
    vertical: "Healthtech", summary: "Two critical patient safety risks — lab result delays and medical history data loss — require immediate engineering escalation ahead of all other work. The absence of a unified patient record view is the most-requested feature gap.",
    caseBreakdown: { Performance: 3, "Data Loss": 3, UX: 3, "Feature Gap": 3 },
    intelligence: [
      { theme: "Clinical Data Loss on Session Expiry — Patient Safety Risk", severity: "Critical", caseCount: 3, affectedProducts: ["Intake Questionnaires", "Insurance Claims", "Symptom Checker"], affectedAccounts: ["Riverside Medical Group", "Summit Health Network", "Helix Telehealth"], userImpact: "Patients arriving at appointments without completed forms. Prior auth lost daily — 10-15 patient complaints/week at Summit alone.", rootCause: "Session state held in client memory only. No server-side draft persistence. Timeout is silent with no warning.", recommendation: "Server-side draft API with 24hr TTL. 2-min inactivity warning with auto-extend. Apply across all multi-step patient forms. Owner: Engineering.", effort: "Medium", representativeCase: "CS-20096" },
      { theme: "Critical Lab Result and Telehealth Performance Failures", severity: "Critical", caseCount: 3, affectedProducts: ["Lab Results Viewer", "Telehealth Video", "Appointment Scheduling"], affectedAccounts: ["Riverside Medical Group", "Helix Telehealth", "CareFirst Partners"], userImpact: "30s+ delay on urgent lab results is a direct patient safety concern. Telehealth drops at 8min on mobile Safari. Calendar freezes 10–15s.", rootCause: "Lab viewer lacks query optimisation and CDN caching. WebRTC timeout misconfigured for Safari. Calendar renders full range synchronously.", recommendation: "Lab: indexed queries + CDN. Telehealth: WebRTC keepalive ping every 5min + reconnect handler. Calendar: virtualise rendering. Owner: Engineering.", effort: "High", representativeCase: "CS-20033" },
      { theme: "Fragmented Patient Record Navigation", severity: "High", caseCount: 3, affectedProducts: ["Patient Portal", "Prescription Management", "Health Records (EHR)"], affectedAccounts: ["BlueStar Clinic", "Summit Health Network", "CareFirst Partners"], userImpact: "Physicians switching between 3 modules to review patient history. WCAG AA failures affecting visually impaired patients.", rootCause: "Features built as isolated modules. No cross-linking. UI designed without accessibility audit.", recommendation: "Unified patient timeline view. Contextual deep-links between related features. Commission WCAG AA audit. Owner: Design + Engineering.", effort: "High", representativeCase: "CS-20071" },
    ],
    growthAreas: [
      { opportunity: "Unified Patient Timeline with Cross-Module Search", signal: "CS-20071, CS-20119 — physicians manually switching between modules, no cross-data search", potentialImpact: "High", suggestedFeature: "Single patient timeline overlaying labs, notes, prescriptions, wellness metrics with unified search and date-range filter.", targetSegment: "Physicians and chronic care managers at Enterprise health networks", timeToValue: "Strategic", competitiveAngle: "Epic and Cerner offer this only at high-cost enterprise tier. An affordable unified view differentiates for mid-market health systems." },
      { opportunity: "Appointment Waitlist Automation", signal: "CS-20158 — staff manually calling waitlists when slots open", potentialImpact: "Medium", suggestedFeature: "Digital waitlist with SMS/push auto-notification + patient self-confirm within 2hr window.", targetSegment: "Scheduling coordinators at multi-provider clinics", timeToValue: "Quick Win", competitiveAngle: "Most scheduling tools lack automated waitlist. Measurable slot utilisation ROI makes it a strong sales proof point." },
    ],
    priorityMatrix: {
      doNow: ["Fix lab results query performance — 30s delay is a patient safety issue requiring immediate escalation", "Implement WebRTC keepalive for Telehealth Safari sessions — all iPhone consultations at risk", "Ship server-side form draft autosave for intake and prior-auth flows"],
      planNext: ["Design and build unified patient timeline — highest-impact feature gap", "Virtualise appointment calendar rendering for multi-provider schedules"],
      watchAndLearn: ["Monitor symptom checker completion rates after save-and-resume ships", "Assess appetite for waitlist automation across 3+ clinic accounts"]
    },
    riskFlags: ["30s+ lab result delays for urgent/stat orders (CS-20033) constitute a direct patient safety risk — requires immediate clinical and engineering escalation.", "WCAG AA failures on Patient Portal (CS-20169) create ADA compliance exposure — recommend legal review before next enterprise contract renewal."]
  },
  insurtech: {
    vertical: "Insurtech", summary: "Silent document failures in the claims portal are creating customer trust and compliance risks. Premium calculation latency is the leading cause of agent abandonment during live quoting sessions.",
    caseBreakdown: { Performance: 1, "Data Loss": 2, UX: 1, "Feature Gap": 2 },
    intelligence: [
      { theme: "Silent Claims Document Failures", severity: "Critical", caseCount: 2, affectedProducts: ["Claims Portal"], affectedAccounts: ["Shield Insurance Group", "PureRisk Partners"], userImpact: "Claim submissions lost with no user notification. Customers believe claims are filed when they are not.", rootCause: "Document upload endpoint returns HTTP 200 on failure. No client-side validation or error state rendered.", recommendation: "Fix upload error handling: surface errors immediately. Add upload confirmation receipt with claim reference ID. Owner: Engineering.", effort: "Low", representativeCase: "CS-30059" },
      { theme: "Premium Calculation Latency Blocking Live Quoting", severity: "High", caseCount: 1, affectedProducts: ["Policy Management"], affectedAccounts: ["CoverNow"], userImpact: "Agents and customers waiting 25+ seconds for a premium quote during live calls. High abandonment rate.", rootCause: "Synchronous actuarial calculation on request. No caching for repeated parameter sets. No loading state shown.", recommendation: "Async calculation with polling. Cache results for identical risk parameter sets (Redis, 1hr TTL). Add progress indicator. Owner: Engineering.", effort: "Medium", representativeCase: "CS-30024" },
    ],
    growthAreas: [
      { opportunity: "Policy Comparison Tool", signal: "CS-30038 — customers unable to compare tiers before purchasing, leading to post-sale churn", potentialImpact: "High", suggestedFeature: "Side-by-side policy tier comparison with feature highlights and premium delta display.", targetSegment: "Direct consumer and SMB buyers", timeToValue: "Quick Win", competitiveAngle: "Standard in insurance aggregators but missing from direct platforms. Reduces pre-sale support calls." },
    ],
    priorityMatrix: {
      doNow: ["Fix silent document upload failure — claims being lost without customer notification", "Add loading state to premium calculation — 25s blank screen is unacceptable"],
      planNext: ["Build policy tier comparison tool — highest-impact growth feature", "Design bulk renewal workflow for fleet/group policies"],
      watchAndLearn: ["Monitor underwriting UI feedback after risk factor explanation is added"]
    },
    riskFlags: ["Silent claim submission failures (CS-30059) may result in customers believing they are covered when they are not — immediate legal and compliance review required."]
  },
  edtech: {
    vertical: "Edtech", summary: "Exam submission data loss is a critical academic integrity and trust risk requiring immediate resolution. Video buffering on standard broadband is blocking the core learning experience for a majority of students.",
    caseBreakdown: { Performance: 1, "Data Loss": 1, UX: 2, "Feature Gap": 2 },
    intelligence: [
      { theme: "Exam Submission Data Loss on Connection Drop", severity: "Critical", caseCount: 1, affectedProducts: ["Assessment Engine"], affectedAccounts: ["BrightMinds University"], userImpact: "Students losing completed exams on connection drop. Academic integrity complaints and retake requests increasing.", rootCause: "No client-side autosave. Submission is a single atomic request with no retry or draft recovery.", recommendation: "Autosave answers to localStorage every 30s. On reconnect, auto-resume and resubmit draft. Owner: Engineering.", effort: "Medium", representativeCase: "CS-40015" },
      { theme: "Video Buffering Blocking Core Learning", severity: "High", caseCount: 1, affectedProducts: ["LMS"], affectedAccounts: ["LearnPath Corp"], userImpact: "20+ second buffer times on standard broadband. Students abandoning lectures mid-way.", rootCause: "No adaptive bitrate streaming (ABR). Single high-res stream served regardless of bandwidth.", recommendation: "Implement HLS with adaptive bitrate. Add CDN edge caching for popular lectures. Owner: Engineering.", effort: "High", representativeCase: "CS-40028" },
    ],
    growthAreas: [
      { opportunity: "Assignment Reuse and Course Cloning", signal: "CS-40055 — instructors manually recreating assignments each term, high time cost", potentialImpact: "High", suggestedFeature: "One-click assignment clone across courses. Course template library with sharable instructor content.", targetSegment: "University instructors managing multiple courses", timeToValue: "Quick Win", competitiveAngle: "Canvas and Moodle offer this. Absence is a procurement blocker for large university accounts." },
    ],
    priorityMatrix: {
      doNow: ["Ship exam autosave + reconnect recovery — academic integrity risk", "Implement adaptive bitrate streaming for video lectures"],
      planNext: ["Build assignment clone and course template library", "Fix progress tracking ↔ certification pathway navigation"],
      watchAndLearn: ["Track rubric builder drag-and-drop demand — may be solvable with low effort"]
    },
    riskFlags: ["Exam submission data loss (CS-40015) is an academic integrity risk — potential grade disputes and institutional liability for BrightMinds University."]
  },
};

// ─── HELPERS ───────────────────────────────────────────────────────────────────
const delay = (ms) => new Promise(r => setTimeout(r, ms));

function filterByDateRange(cases, days) {
  if (days >= 999) return cases;
  const cutoff = new Date("2026-03-12");
  cutoff.setDate(cutoff.getDate() - days);
  return cases.filter(c => new Date(c.created) >= cutoff);
}

function computeClusters(cases, dimension) {
  const field = dimension.field;
  const groups = {};
  cases.forEach(c => {
    const key = c[field] || "Unknown";
    if (!groups[key]) groups[key] = { value: key, count: 0, critical: 0, enterprise: 0 };
    groups[key].count++;
    if (c.priority === "Critical") groups[key].critical++;
    if (c.accountTier === "Enterprise") groups[key].enterprise++;
  });
  return Object.values(groups).sort((a: any, b: any) => b.count - a.count);
}

function getStrategy(count, rules) {
  if (count < rules.directThreshold) return "direct";
  if (count < rules.chunkedThreshold) return "chunked";
  return "mapreduce";
}

function strategyLabel(s) {
  return { direct: "Direct (1 call)", chunked: "Chunked parallel", mapreduce: "MapReduce" }[s] || s;
}

function exportToCSV(cases, verticalId) {
  const header = ["ID", "Account", "Tier", "Priority", "Status", "Type", "Product", "Subject", "Created"].join(",");
  const rows = cases.map(c => [c.id, `"${c.account}"`, c.accountTier, c.priority, c.status, c.type, `"${c.product}"`, `"${c.subject}"`, c.created].join(","));
  const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
  a.download = `${verticalId}-cases-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
}

function exportReportJSON(report, verticalId) {
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
  a.download = `${verticalId}-intelligence-${new Date().toISOString().slice(0, 10)}.json`; a.click();
}

// ─── STYLE MAPS ────────────────────────────────────────────────────────────────
const typeColors = {
  "Performance":  { bg: "#fef3c7", text: "#92400e", dot: "#f59e0b" },
  "Data Loss":    { bg: "#fee2e2", text: "#991b1b", dot: "#ef4444" },
  "UX":           { bg: "#ede9fe", text: "#5b21b6", dot: "#8b5cf6" },
  "Feature Gap":  { bg: "#dbeafe", text: "#1e40af", dot: "#3b82f6" },
};
const priorityColors = {
  "Critical": { bg: "#fee2e2", text: "#b91c1c" },
  "High":     { bg: "#ffedd5", text: "#c2410c" },
  "Medium":   { bg: "#fef9c3", text: "#854d0e" },
};
const tierColors = {
  "Enterprise": { bg: "#eff6ff", text: "#1e40af" },
  "Mid-Market": { bg: "#f5f3ff", text: "#5b21b6" },
};

// ─── SYSTEM PROMPT ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a product strategist. Analyse these support case clusters and return a JSON intelligence report.
CRITICAL: Respond ONLY with a single valid JSON object. No markdown, no backticks, no text before or after.
Keep arrays: max 3 intelligence items, max 3 growthAreas, max 3 items per priorityMatrix column, max 2 riskFlags.
{
  "vertical": "string",
  "summary": "2 sentences max",
  "caseBreakdown": { "Performance": 0, "Data Loss": 0, "UX": 0, "Feature Gap": 0 },
  "intelligence": [{ "theme": "", "severity": "Critical|High|Medium", "caseCount": 0, "affectedProducts": [], "affectedAccounts": [], "userImpact": "", "rootCause": "", "recommendation": "", "effort": "Low|Medium|High", "representativeCase": "" }],
  "growthAreas": [{ "opportunity": "", "signal": "", "potentialImpact": "High|Medium|Low", "suggestedFeature": "", "targetSegment": "", "timeToValue": "Quick Win|Mid-term|Strategic", "competitiveAngle": "" }],
  "priorityMatrix": { "doNow": [], "planNext": [], "watchAndLearn": [] },
  "riskFlags": []
}`;

// ─── MAIN APP ──────────────────────────────────────────────────────────────────
export default function Pipeline() {
  const unlocked = useGateUnlocked();
  const [verticalId, setVerticalId] = useState("fintech");
  const [sourceId, setSourceId] = useState("salesforce");
  const [clusterDimId, setClusterDimId] = useState("type");
  const [dateRange, setDateRange] = useState(30);
  const [syncStage, setSyncStage] = useState("idle");
  const [cases, setCases] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [strategy, setStrategy] = useState(null);
  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [activeTab, setActiveTab] = useState("pipeline");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [filterTier, setFilterTier] = useState("All");
  const [syncLog, setSyncLog] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportRef = useRef(null);

  const vertical = PIPELINE_CONFIG.verticals.find(v => v.id === verticalId);
  const source = PIPELINE_CONFIG.sources.find(s => s.id === sourceId);
  const clusterDim = PIPELINE_CONFIG.clusterDimensions.find(d => d.id === clusterDimId);
  const isRunning = ["connecting", "fetching", "processing"].includes(syncStage);

  const addLog = (msg, type = "info") => setSyncLog(prev => [...prev.slice(-19), { msg, type, time: new Date().toLocaleTimeString() }]);

  // Click outside to close export menu
  useEffect(() => {
    const handler = (e) => { if (exportRef.current && !exportRef.current.contains(e.target)) setExportMenuOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const runSync = async (vid = verticalId, days = dateRange, dim = clusterDimId) => {
    setSyncStage("connecting");
    addLog(`Initiating ${source.name} OAuth 2.0 handshake…`, "info");
    await delay(180);
    addLog(`✓ Connected · ${sourceId}-prod.instance.com`, "success");
    setSyncStage("fetching");
    await delay(140);
    const raw = SF_CASES[vid] || [];
    const data = filterByDateRange(raw, days);
    const dim_obj = PIPELINE_CONFIG.clusterDimensions.find(d => d.id === dim);
    const soqlWhere = `Vertical__c = '${vid}' AND CreatedDate = LAST_N_DAYS:${days < 999 ? days : "ALL"}`;
    addLog(`Executing query: SELECT * FROM Cases WHERE ${soqlWhere}`, "info");
    await delay(140);
    addLog(`✓ Fetched ${data.length} records (${days < 999 ? `last ${days} days` : "all time"})`, "success");
    setSyncStage("processing");
    await delay(100);
    addLog(`Normalising fields · Aggregating by ${dim_obj.label}…`, "info");
    await delay(100);
    const clusterData = computeClusters(data, dim_obj);
    const strat = getStrategy(data.length, PIPELINE_CONFIG.scalingRules);
    setStrategy(strat);
    setCases(data);
    setClusters(clusterData);
    setLastSync(new Date());
    setSyncStage("done");
    addLog(`✓ ${data.length} records staged · ${clusterData.length} clusters · Strategy: ${strategyLabel(strat)}`, "success");
    return { data, clusterData };
  };

  const generateReportAI = async (caseData, clusterData, vid) => {
    setAiLoading(true);
    setReportLoading(true);
    setReport(null);
    setActiveTab("report");
    const top8 = [...caseData.filter(c => c.priority === "Critical"), ...caseData.filter(c => c.priority === "High"), ...caseData.filter(c => c.priority === "Medium")].slice(0, 8);
    const caseText = top8.map(c => `[${c.id}] ${c.priority}/${c.type}/${c.accountTier} | ${c.product} | ${c.account}: ${c.subject}`).join("\n");
    const clusterSummary = clusterData.map(cl => `${cl.value}: ${cl.count} cases (${cl.critical} critical, ${cl.enterprise} enterprise)`).join("\n");
    addLog(`Sending ${clusterData.length} clusters to Claude AI · Strategy: ${strategyLabel(strategy)}…`, "info");
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", signal: controller.signal,
        headers: { "Content-Type": "application/json", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001", max_tokens: 2048, system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: `Vertical: ${vid}\n\nClusters:\n${clusterSummary}\n\nTop cases:\n${caseText}` }],
        }),
      });
      clearTimeout(timeoutId);
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const text = data.content?.find(b => b.type === "text")?.text || "";
      if (!text) throw new Error("Empty response from Claude");
      addLog(`Claude responded (${text.length} chars) — parsing…`, "info");
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      setReport(parsed);
      addLog("✓ Intelligence report generated via AI", "success");
    } catch (e) {
      const msg = e.name === "AbortError" ? "Timed out after 60s" : (e.message || "Unknown error");
      addLog(`✗ AI generation failed: ${msg}`, "error");
      setActiveTab("log");
    }
    setAiLoading(false);
    setReportLoading(false);
  };

  const handleVerticalChange = (vid) => {
    setVerticalId(vid); setCases([]); setClusters([]); setReport(null);
    setSyncStage("idle"); setSyncLog([]); setActiveTab("pipeline");
    setSelectedAccount(null); setSearchTerm(""); setFilterType("All");
    setFilterPriority("All"); setFilterTier("All"); setStrategy(null);
  };

  const handleFullRun = async () => {
    setSelectedAccount(null);
    const { data, clusterData } = await runSync(verticalId, dateRange, clusterDimId);
    // Load mock report instantly; AI regenerate available on demand
    const mock = MOCK_REPORTS[verticalId];
    if (mock) {
      setReport(mock);
      setActiveTab("report");
      addLog("✓ Intelligence report loaded · click ✦ Re-generate with AI for live analysis", "success");
    }
  };

  // Filtered/sorted cases
  const filteredCases = cases.filter(c => {
    const q = searchTerm.toLowerCase();
    const matchSearch = !searchTerm || c.subject.toLowerCase().includes(q) || c.account.toLowerCase().includes(q) || c.product.toLowerCase().includes(q) || c.id.toLowerCase().includes(q);
    const matchType = filterType === "All" || c.type === filterType;
    const matchPriority = filterPriority === "All" || c.priority === filterPriority;
    const matchTier = filterTier === "All" || c.accountTier === filterTier;
    const matchAccount = !selectedAccount || c.account === selectedAccount;
    return matchSearch && matchType && matchPriority && matchTier && matchAccount;
  });

  const allAccounts = [...new Set(cases.map(c => c.account))].sort();
  const caseTypes = [...new Set(cases.map(c => c.type))];

  // Stat cards
  const statCards = caseTypes.map(type => {
    const typeCases = cases.filter(c => c.type === type);
    return { type, count: typeCases.length, critical: typeCases.filter(c => c.priority === "Critical").length };
  });

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", background: "#f8fafc", minHeight: "100vh", color: "#0f172a" }}>
<style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .syne { font-family: 'Syne', sans-serif; }
        .mono { font-family: 'JetBrains Mono', monospace; }
        .card { background: #fff; border: 1px solid #e4e8ef; border-radius: 10px; }
        .btn { background: none; border: none; cursor: pointer; transition: all 0.12s; }
        .btn:hover { opacity: 0.85; }
        .btn-ghost { background: #f8fafc; border: 1px solid #e4e8ef; border-radius: 8px; cursor: pointer; transition: all 0.12s; }
        .btn-ghost:hover { background: #f1f5f9; }
        .tag { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 5px; font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 600; }
        .fade { animation: fadeIn 0.25s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
        .pulse { animation: pulse 1.4s ease-in-out infinite; }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        .spin { animation: spin 0.9s linear infinite; display: inline-block; }
        @keyframes spin { to { transform: rotate(360deg); } }
        select, input { font-family: 'JetBrains Mono', monospace; font-size: 11px; }
        .case-row { cursor: pointer; transition: background 0.1s; }
        .case-row:hover { background: #f8fafc !important; }
        .account-pill { cursor: pointer; transition: all 0.12s; }
        .account-pill:hover { opacity: 0.8; }
        .dropdown { position: absolute; background: #fff; border: 1px solid #e4e8ef; border-radius: 10px; box-shadow: 0 8px 32px rgba(0,0,0,0.12); z-index: 100; min-width: 190px; overflow: hidden; }
        .dropdown-item { padding: 9px 14px; cursor: pointer; font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 600; color: #334155; display: flex; align-items: center; gap: 8px; transition: background 0.1s; }
        .dropdown-item:hover { background: #f8fafc; }
        .sidebar-section { margin-bottom: 18px; }
        .risk-badge { display: flex; align-items: flex-start; gap: 8px; padding: 10px 12px; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; margin-bottom: 6px; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 2px; }
        .cluster-bar { height: 4px; border-radius: 2px; background: #e2e8f0; overflow: hidden; margin-top: 4px; }
        .cluster-bar-fill { height: 100%; border-radius: 2px; transition: width 0.4s ease; }
      `}</style>

      {/* ── Top Bar ── */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e4e8ef", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 52, position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, background: "linear-gradient(135deg,#0052cc,#0066ff)", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontSize: 14 }}>⚡</span>
          </div>
          <span className="syne" style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>Product Intelligence</span>
          <span className="mono" style={{ fontSize: 9, color: "#94a3b8", background: "#f1f5f9", padding: "2px 7px", borderRadius: 4 }}>Any source · Any scale</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {lastSync && (
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
              <span className="mono" style={{ fontSize: 9, color: "#64748b" }}>Synced {lastSync.toLocaleTimeString()}</span>
            </div>
          )}
          {unlocked && (cases.length > 0 || report) && (
            <div style={{ position: "relative" }} ref={exportRef}>
              <button className="btn-ghost" onClick={() => setExportMenuOpen(o => !o)} style={{ padding: "5px 11px", fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
                ↓ Export <span style={{ fontSize: 9, color: "#94a3b8" }}>▾</span>
              </button>
              {exportMenuOpen && (
                <div className="dropdown fade" style={{ top: 34, right: 0 }}>
                  {cases.length > 0 && <div className="dropdown-item" onClick={() => { exportToCSV(filteredCases, verticalId); setExportMenuOpen(false); }}>📊 Cases → CSV</div>}
                  {report && <>
                    <div style={{ height: 1, background: "#f1f5f9" }} />
                    <div className="dropdown-item" onClick={() => { exportReportJSON(report, verticalId); setExportMenuOpen(false); }}>📋 Report → JSON</div>
                  </>}
                </div>
              )}
            </div>
          )}
          {vertical && (
            <span className="tag syne" style={{ background: vertical.color.bg, color: vertical.color.text, fontSize: 11, fontWeight: 700 }}>
              {vertical.emoji} {vertical.name}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(200px, 260px) 1fr", minHeight: "calc(100vh - 52px)", overflow: "hidden" }}>

        {/* ── Sidebar ── */}
        <div style={{ background: "#fff", borderRight: "1px solid #e4e8ef", padding: "16px 12px", overflowY: "auto" }}>

          {/* Vertical selector */}
          <div className="sidebar-section">
            <div className="mono" style={{ fontSize: 9, color: "#94a3b8", marginBottom: 7, letterSpacing: "0.12em" }}>VERTICAL</div>
            {PIPELINE_CONFIG.verticals.map(v => (
              <button key={v.id} className="btn" onClick={() => handleVerticalChange(v.id)}
                style={{ width: "100%", textAlign: "left", padding: "8px 10px", borderRadius: 8, marginBottom: 3,
                  background: verticalId === v.id ? v.color.bg : "transparent",
                  border: `1px solid ${verticalId === v.id ? v.color.border : "#e4e8ef"}`,
                  color: verticalId === v.id ? v.color.text : "#475569" }}>
                <div className="syne" style={{ fontSize: 12, fontWeight: 700 }}>{v.emoji} {v.name}</div>
                <div className="mono" style={{ fontSize: 9, color: "#94a3b8", marginTop: 1 }}>{v.description}</div>
              </button>
            ))}
          </div>

          {/* Data source */}
          <div className="sidebar-section">
            <div className="mono" style={{ fontSize: 9, color: "#94a3b8", marginBottom: 7, letterSpacing: "0.12em" }}>DATA SOURCE</div>
            <div className="card" style={{ padding: "8px 10px" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {PIPELINE_CONFIG.sources.map(s => (
                  <button key={s.id} className="btn" onClick={() => setSourceId(s.id)}
                    style={{ padding: "4px 8px", borderRadius: 6, fontSize: 10, fontFamily: "Syne, sans-serif", fontWeight: 700,
                      background: sourceId === s.id ? "#0066ff" : "#f8fafc",
                      color: sourceId === s.id ? "#fff" : "#64748b",
                      border: `1px solid ${sourceId === s.id ? "#0066ff" : "#e4e8ef"}` }}>
                    {s.icon} {s.name}
                  </button>
                ))}
              </div>
              {source && (
                <div className="mono" style={{ fontSize: 9, color: "#94a3b8", marginTop: 7, paddingTop: 6, borderTop: "1px solid #f1f5f9" }}>
                  {source.label} · Simulated<br />
                  <span style={{ color: "#475569" }}>WHERE {vertical?.sourceFilter || ""}</span>
                </div>
              )}
            </div>
          </div>

          {/* Cluster dimension */}
          <div className="sidebar-section">
            <div className="mono" style={{ fontSize: 9, color: "#94a3b8", marginBottom: 7, letterSpacing: "0.12em" }}>CLUSTER BY</div>
            <div className="card" style={{ padding: "8px 10px" }}>
              {PIPELINE_CONFIG.clusterDimensions.map(d => (
                <button key={d.id} className="btn" onClick={() => setClusterDimId(d.id)}
                  style={{ width: "100%", textAlign: "left", padding: "5px 7px", borderRadius: 6, marginBottom: 2,
                    background: clusterDimId === d.id ? "#0066ff" : "transparent",
                    color: clusterDimId === d.id ? "#fff" : "#64748b",
                    fontSize: 11, fontFamily: "Syne, sans-serif", fontWeight: 600 }}>
                  {d.label}
                  {clusterDimId === d.id && <span style={{ float: "right", fontSize: 10 }}>✓</span>}
                </button>
              ))}
              {clusterDim && <div className="mono" style={{ fontSize: 9, color: "#94a3b8", marginTop: 5, paddingTop: 5, borderTop: "1px solid #f1f5f9" }}>{clusterDim.description}</div>}
            </div>
          </div>

          {/* Date range */}
          <div className="sidebar-section">
            <div className="mono" style={{ fontSize: 9, color: "#94a3b8", marginBottom: 7, letterSpacing: "0.12em" }}>DATE RANGE</div>
            <div className="card" style={{ padding: "8px 10px" }}>
              {PIPELINE_CONFIG.dateRanges.map(r => (
                <button key={r.days} className="btn" onClick={() => setDateRange(r.days)}
                  style={{ width: "100%", textAlign: "left", padding: "5px 7px", borderRadius: 6, marginBottom: 2,
                    background: dateRange === r.days ? "#0066ff" : "transparent",
                    color: dateRange === r.days ? "#fff" : "#64748b",
                    fontSize: 11, fontFamily: "Syne, sans-serif", fontWeight: 600 }}>
                  {r.label}{dateRange === r.days && <span style={{ float: "right" }}>✓</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Run button */}
          <button className="btn" onClick={handleFullRun} disabled={isRunning || reportLoading}
            style={{ padding: "10px", borderRadius: 10, background: isRunning || reportLoading ? "#e2e8f0" : "linear-gradient(135deg,#0052cc,#0066ff)",
              color: isRunning || reportLoading ? "#94a3b8" : "#fff", fontWeight: 800, fontSize: 13,
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: isRunning || reportLoading ? "none" : "0 3px 12px rgba(0,102,255,0.3)", marginBottom: 16, fontFamily: "Syne, sans-serif" }}>
            {isRunning ? <><span className="spin">⟳</span> Syncing…</> : reportLoading ? <><span className="pulse">●</span> Analysing…</> : report ? "⟳ Re-Sync" : "▶ Run Pipeline"}
          </button>

          {/* Pipeline stages */}
          {syncStage !== "idle" && (
            <div className="fade sidebar-section">
              <div className="mono" style={{ fontSize: 9, color: "#94a3b8", marginBottom: 7, letterSpacing: "0.12em" }}>PIPELINE STAGES</div>
              {[
                { key: "connecting", label: `${source?.icon || "☁"} ${source?.name || "Source"} Auth` },
                { key: "fetching",   label: "Paginated Fetch" },
                { key: "processing", label: `Cluster by ${clusterDim?.label}` },
                { key: "done",       label: "Claude AI Analysis ✦" },
              ].map(({ key, label }, i) => {
                const stages = ["connecting", "fetching", "processing", "done"];
                const idx = stages.indexOf(syncStage);
                const thisIdx = stages.indexOf(key);
                const done = syncStage === "done" ? true : thisIdx < idx;
                const active = thisIdx === idx && syncStage !== "done";
                const aiActive = key === "done" && reportLoading;
                return (
                  <div key={key} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 17, height: 17, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700,
                      background: done ? "#22c55e" : active || aiActive ? "#0066ff" : "#e2e8f0",
                      color: done || active || aiActive ? "#fff" : "#94a3b8" }}>
                      {done ? "✓" : i + 1}
                    </div>
                    <span className="mono" style={{ fontSize: 10, color: done ? "#22c55e" : active || aiActive ? "#0066ff" : "#94a3b8" }}>
                      {label} {(active || aiActive) && <span className="pulse">…</span>}
                    </span>
                  </div>
                );
              })}
              {strategy && (
                <div className="mono" style={{ fontSize: 9, marginTop: 8, paddingTop: 8, borderTop: "1px solid #f1f5f9" }}>
                  <span style={{ color: "#94a3b8" }}>STRATEGY </span>
                  <span style={{ color: strategy === "mapreduce" ? "#7c3aed" : strategy === "chunked" ? "#0066ff" : "#22c55e", fontWeight: 600 }}>
                    {strategyLabel(strategy)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Cluster breakdown (post-sync) */}
          {clusters.length > 0 && (
            <div className="fade sidebar-section">
              <div className="mono" style={{ fontSize: 9, color: "#94a3b8", marginBottom: 7, letterSpacing: "0.12em" }}>CLUSTERS ({clusters.length})</div>
              {clusters.map(cl => {
                const maxCount = Math.max(...clusters.map(c => c.count));
                const pct = Math.round((cl.count / maxCount) * 100);
                return (
                  <div key={cl.value} style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span className="syne" style={{ fontSize: 10, fontWeight: 700, color: "#334155" }}>{cl.value}</span>
                      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                        {cl.critical > 0 && <span className="mono" style={{ fontSize: 9, color: "#b91c1c" }}>●{cl.critical}</span>}
                        <span className="mono" style={{ fontSize: 9, color: "#94a3b8" }}>{cl.count}</span>
                      </div>
                    </div>
                    <div className="cluster-bar"><div className="cluster-bar-fill" style={{ width: `${pct}%`, background: "#0066ff" }} /></div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Account list */}
          {cases.length > 0 && (
            <div className="fade sidebar-section">
              <div className="mono" style={{ fontSize: 9, color: "#94a3b8", marginBottom: 7, letterSpacing: "0.12em" }}>ACCOUNTS ({allAccounts.length})</div>
              <button className="btn" onClick={() => setSelectedAccount(null)}
                style={{ width: "100%", textAlign: "left", padding: "5px 8px", borderRadius: 6, marginBottom: 2, fontSize: 10,
                  fontFamily: "Syne, sans-serif", fontWeight: 600,
                  background: !selectedAccount ? "#0f172a" : "transparent",
                  color: !selectedAccount ? "#fff" : "#64748b",
                  border: `1px solid ${!selectedAccount ? "#0f172a" : "#e4e8ef"}` }}>
                All accounts
              </button>
              {allAccounts.map(acc => {
                const count = cases.filter(c => c.account === acc).length;
                const hasCritical = cases.some(c => c.account === acc && c.priority === "Critical");
                return (
                  <button key={acc} className="btn account-pill" onClick={() => setSelectedAccount(acc === selectedAccount ? null : acc)}
                    style={{ width: "100%", textAlign: "left", padding: "5px 8px", borderRadius: 6, marginBottom: 2,
                      background: selectedAccount === acc ? "#fef3c7" : "transparent",
                      border: `1px solid ${selectedAccount === acc ? "#fde68a" : "#e4e8ef"}`,
                      color: selectedAccount === acc ? "#92400e" : "#475569",
                      fontSize: 10, fontFamily: "Syne, sans-serif", fontWeight: 600,
                      display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>{acc}</span>
                    <span style={{ display: "flex", gap: 3, flexShrink: 0 }}>
                      {hasCritical && <span style={{ fontSize: 9, color: "#b91c1c" }}>●</span>}
                      <span className="mono" style={{ fontSize: 9, color: "#94a3b8" }}>{count}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Main Content ── */}
        <div style={{ padding: "20px 24px", overflow: "auto", minWidth: 0 }}>

          {/* Empty state */}
          {syncStage === "idle" && (
            <div style={{ textAlign: "center", padding: "80px 20px" }} className="fade">
              <div style={{ fontSize: 42, marginBottom: 12 }}>⚡</div>
              <div className="syne" style={{ fontSize: 20, fontWeight: 800, color: "#334155", marginBottom: 8 }}>Ready to run the pipeline</div>
              <div className="mono" style={{ fontSize: 11, color: "#94a3b8", marginBottom: 24 }}>Select vertical · source · cluster dimension · date range — then Run Pipeline</div>
              <div style={{ display: "inline-flex", gap: 0, background: "#fff", border: "1px solid #e4e8ef", borderRadius: 10, padding: "12px 24px" }}>
                {["Auth", "Fetch + Paginate", "Aggregate Clusters", "Map Workers", "Reduce + Report"].map((s, i) => (
                  <div key={s} style={{ display: "flex", alignItems: "center" }}>
                    {i > 0 && <span style={{ color: "#e2e8f0", margin: "0 10px" }}>→</span>}
                    <span className="mono" style={{ fontSize: 10, color: "#94a3b8" }}>{s}</span>
                  </div>
                ))}
              </div>
              <div className="mono" style={{ fontSize: 10, color: "#94a3b8", marginTop: 14 }}>
                Strategy auto-selected · Direct &lt; 50 · Chunked &lt; 500 · MapReduce 500+
              </div>
            </div>
          )}

          {syncStage !== "idle" && (
            <div>
              {/* Account banner */}
              {selectedAccount && (
                <div className="fade card" style={{ padding: "10px 16px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fffbeb", borderColor: "#fde68a" }}>
                  <div>
                    <span className="syne" style={{ fontWeight: 700, fontSize: 13 }}>{selectedAccount}</span>
                    <span className="mono" style={{ fontSize: 10, color: "#94a3b8", marginLeft: 10 }}>
                      {cases.filter(c => c.account === selectedAccount).length} cases
                      {cases.some(c => c.account === selectedAccount && c.priority === "Critical") && <span style={{ color: "#b91c1c", marginLeft: 8 }}>● Critical</span>}
                    </span>
                  </div>
                  <button className="btn-ghost" onClick={() => setSelectedAccount(null)} style={{ fontSize: 11, padding: "4px 10px" }}>✕ Clear</button>
                </div>
              )}

              {/* Stat cards */}
              {statCards.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(statCards.length, 4)}, 1fr)`, gap: 10, marginBottom: 18 }}>
                  {statCards.map(({ type, count, critical }) => {
                    const col = typeColors[type] || { bg: "#f1f5f9", text: "#475569", dot: "#94a3b8" };
                    return (
                      <div key={type} className="card fade" style={{ padding: "12px 14px", cursor: "pointer", background: filterType === type ? col.bg : "#fff", borderColor: filterType === type ? col.dot : "#e4e8ef" }}
                        onClick={() => { setFilterType(filterType === type ? "All" : type); setActiveTab("cases"); }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <span className="mono" style={{ fontSize: 9, color: col.dot, letterSpacing: "0.06em" }}>{type.toUpperCase()}</span>
                          {critical > 0 && <span className="mono" style={{ fontSize: 9, color: "#b91c1c" }}>●{critical} crit</span>}
                        </div>
                        <div className="syne" style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>{count}</div>
                        <div className="mono" style={{ fontSize: 9, color: "#94a3b8" }}>cases</div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Tabs */}
              <div style={{ display: "flex", gap: 2, marginBottom: 16, borderBottom: "1px solid #e4e8ef", paddingBottom: 0 }}>
                {[{ key: "pipeline", label: "⚡ Pipeline" }, { key: "cases", label: `📋 Cases (${filteredCases.length})` }, { key: "log", label: "📡 Sync Log" }, { key: "report", label: "📊 Intelligence" }].map(t => (
                  <button key={t.key} className="btn syne" onClick={() => setActiveTab(t.key)}
                    style={{ padding: "8px 14px", fontSize: 12, fontWeight: 700, borderBottom: `2px solid ${activeTab === t.key ? "#0066ff" : "transparent"}`,
                      color: activeTab === t.key ? "#0066ff" : "#64748b", borderRadius: 0, marginBottom: -1 }}>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Pipeline tab */}
              {activeTab === "pipeline" && (
                <div className="fade">
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                    {[
                      { label: "VERTICAL", val: `${vertical?.emoji} ${vertical?.name}` },
                      { label: "SOURCE", val: `${source?.icon} ${source?.name} · ${source?.label}` },
                      { label: "CLUSTER DIMENSION", val: `${clusterDim?.label}` },
                      { label: "DATE RANGE", val: dateRange < 999 ? `Last ${dateRange} days` : "All cases" },
                      { label: "RECORDS FETCHED", val: cases.length > 0 ? `${cases.length} cases` : "—" },
                      { label: "CLUSTERS FORMED", val: clusters.length > 0 ? `${clusters.length} clusters` : "—" },
                      { label: "STRATEGY", val: strategy ? strategyLabel(strategy) : "—" },
                      { label: "STATUS", val: syncStage === "done" ? "✓ Complete" : syncStage === "idle" ? "Idle" : "Running…" },
                    ].map(({ label, val }) => (
                      <div key={label} className="card" style={{ padding: "10px 14px" }}>
                        <div className="mono" style={{ fontSize: 9, color: "#94a3b8", marginBottom: 4, letterSpacing: "0.1em" }}>{label}</div>
                        <div className="syne" style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{val}</div>
                      </div>
                    ))}
                  </div>
                  {clusters.length > 0 && (
                    <div className="card fade" style={{ padding: "14px 16px" }}>
                      <div className="mono" style={{ fontSize: 9, color: "#94a3b8", marginBottom: 10, letterSpacing: "0.1em" }}>CLUSTER AGGREGATION · {clusterDim?.label?.toUpperCase()}</div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8 }}>
                        {clusters.map(cl => {
                          const col = typeColors[cl.value] || { bg: "#f1f5f9", text: "#475569", dot: "#94a3b8" };
                          return (
                            <div key={cl.value} style={{ background: col.bg, borderRadius: 8, padding: "10px 12px" }}>
                              <div className="syne" style={{ fontSize: 11, fontWeight: 700, color: col.text }}>{cl.value}</div>
                              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                                <span className="mono" style={{ fontSize: 10, color: "#0f172a" }}>{cl.count} cases</span>
                                {cl.critical > 0 && <span className="mono" style={{ fontSize: 10, color: "#b91c1c" }}>●{cl.critical} crit</span>}
                                {cl.enterprise > 0 && <span className="mono" style={{ fontSize: 10, color: "#1d4ed8" }}>⬡{cl.enterprise} ent</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Cases tab */}
              {activeTab === "cases" && (
                <div className="fade">
                  <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                    <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search cases…"
                      style={{ flex: 1, minWidth: 160, padding: "7px 11px", borderRadius: 8, border: "1px solid #e4e8ef", background: "#fff", outline: "none" }} />
                    {[
                      { label: "Type", value: filterType, set: setFilterType, opts: ["All", ...caseTypes] },
                      { label: "Priority", value: filterPriority, set: setFilterPriority, opts: ["All", "Critical", "High", "Medium"] },
                      { label: "Tier", value: filterTier, set: setFilterTier, opts: ["All", "Enterprise", "Mid-Market"] },
                    ].map(({ label, value, set, opts }) => (
                      <select key={label} value={value} onChange={e => set(e.target.value)}
                        style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid #e4e8ef", background: "#fff", color: "#334155" }}>
                        {opts.map(o => <option key={o}>{o}</option>)}
                      </select>
                    ))}
                  </div>
                  <div className="card" style={{ overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e4e8ef" }}>
                          {["ID", "Account", "Tier", "Priority", "Type", "Product", "Subject"].map(h => (
                            <th key={h} className="mono" style={{ padding: "8px 12px", textAlign: "left", fontSize: 9, color: "#94a3b8", fontWeight: 600, letterSpacing: "0.08em", whiteSpace: "nowrap" }}>{h.toUpperCase()}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCases.map((c, i) => {
                          const pc = priorityColors[c.priority] || {};
                          const tc = typeColors[c.type] || {};
                          const tiC = tierColors[c.accountTier] || {};
                          return (
                            <tr key={c.id} className="case-row" onClick={() => setSelectedAccount(c.account)}
                              style={{ borderBottom: i < filteredCases.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                              <td className="mono" style={{ padding: "9px 12px", fontSize: 10, color: "#0066ff" }}>{c.id}</td>
                              <td className="syne" style={{ padding: "9px 12px", fontSize: 11, fontWeight: 700, color: "#0f172a", maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.account}</td>
                              <td style={{ padding: "9px 12px" }}><span className="tag" style={{ background: tiC.bg, color: tiC.text, fontSize: 9 }}>{c.accountTier}</span></td>
                              <td style={{ padding: "9px 12px" }}><span className="tag" style={{ background: pc.bg, color: pc.text, fontSize: 9 }}>{c.priority}</span></td>
                              <td style={{ padding: "9px 12px" }}><span className="tag" style={{ background: tc.bg, color: tc.text, fontSize: 9 }}>{c.type}</span></td>
                              <td className="mono" style={{ padding: "9px 12px", fontSize: 10, color: "#475569", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.product}</td>
                              <td className="syne" style={{ padding: "9px 12px", fontSize: 11, color: "#334155", maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.subject}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {filteredCases.length === 0 && <div className="mono" style={{ padding: 24, textAlign: "center", color: "#94a3b8", fontSize: 11 }}>No cases match filters</div>}
                  </div>
                </div>
              )}

              {/* Sync log tab */}
              {activeTab === "log" && (
                <div className="fade card" style={{ padding: "12px 14px" }}>
                  <div className="mono" style={{ fontSize: 9, color: "#94a3b8", marginBottom: 10, letterSpacing: "0.1em" }}>SYNC LOG</div>
                  {syncLog.length === 0 && <div className="mono" style={{ fontSize: 11, color: "#94a3b8" }}>No events yet.</div>}
                  {[...syncLog].reverse().map((l, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "5px 0", borderBottom: i < syncLog.length - 1 ? "1px solid #f8fafc" : "none" }}>
                      <span className="mono" style={{ fontSize: 9, color: "#94a3b8", flexShrink: 0 }}>{l.time}</span>
                      <span className="mono" style={{ fontSize: 10, color: l.type === "error" ? "#ef4444" : l.type === "success" ? "#22c55e" : "#475569", lineHeight: 1.5 }}>{l.msg}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Report tab */}
              {activeTab === "report" && (
                <div className="fade">
                  {reportLoading && (
                    <div style={{ textAlign: "center", padding: 60 }}>
                      <div className="spin" style={{ fontSize: 28, display: "inline-block", marginBottom: 12, color: "#0066ff" }}>⟳</div>
                      <div className="syne" style={{ fontWeight: 700, color: "#334155" }}>Generating with Claude AI…</div>
                      <div className="mono" style={{ fontSize: 10, color: "#94a3b8", marginTop: 6 }}>Map workers running in parallel</div>
                    </div>
                  )}
                  {!reportLoading && !report && (
                    <div style={{ textAlign: "center", padding: 60 }}>
                      <div className="mono" style={{ fontSize: 11, color: "#94a3b8" }}>No report yet — run the pipeline to generate one.</div>
                    </div>
                  )}
                  {!reportLoading && report && (
                    <div>
                      {/* Report header */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span className="tag" style={{ background: "#f0fdf4", color: "#15803d", fontSize: 10 }}>● Report Ready</span>
                          <span className="mono" style={{ fontSize: 10, color: "#94a3b8" }}>{cases.length} cases · {clusters.length} clusters · {vertical?.name}</span>
                          {strategy && <span className="tag mono" style={{ background: "#f5f3ff", color: "#7e22ce", fontSize: 9 }}>{strategyLabel(strategy)}</span>}
                        </div>
                        <button className="btn-ghost" onClick={() => generateReportAI(cases, clusters, verticalId)} disabled={aiLoading}
                          style={{ padding: "6px 12px", fontSize: 11, fontWeight: 700, fontFamily: "Syne, sans-serif", display: "flex", alignItems: "center", gap: 6, opacity: aiLoading ? 0.6 : 1 }}>
                          {aiLoading ? <><span className="spin">⟳</span> Generating…</> : "✦ Re-generate with AI"}
                        </button>
                      </div>

                      {/* Risk flags */}
                      {report.riskFlags?.length > 0 && (
                        <div style={{ marginBottom: 18 }}>
                          <div className="mono" style={{ fontSize: 9, color: "#94a3b8", marginBottom: 7, letterSpacing: "0.1em" }}>⚠ RISK FLAGS</div>
                          {report.riskFlags.map((r, i) => (
                            <div key={i} className="risk-badge">
                              <span style={{ color: "#ea580c", fontSize: 12, flexShrink: 0 }}>⚠</span>
                              <span className="mono" style={{ fontSize: 11, color: "#7c2d12", lineHeight: 1.6 }}>{r}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Executive summary */}
                      <div className="card fade" style={{ padding: "16px 20px", marginBottom: 18, borderLeft: "3px solid #0066ff" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                          <div className="mono" style={{ fontSize: 9, color: "#94a3b8", letterSpacing: "0.1em" }}>EXECUTIVE SUMMARY · {report.vertical?.toUpperCase()}</div>
                          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", justifyContent: "flex-end" }}>
                            {report.caseBreakdown && Object.entries(report.caseBreakdown).map(([k, v]: [string, any]) => (v as number) > 0 && (
                              <span key={k} className="tag mono" style={{ background: "#f1f5f9", color: "#475569", fontSize: 9 }}>{k}: {v as number}</span>
                            ))}
                          </div>
                        </div>
                        <p style={{ fontSize: 13, color: "#334155", lineHeight: 1.75, fontFamily: "Georgia, serif" }}>{report.summary}</p>
                      </div>

                      {/* Intelligence cards */}
                      {report.intelligence?.length > 0 && (
                        <div style={{ marginBottom: 18 }}>
                          <div className="mono" style={{ fontSize: 9, color: "#94a3b8", marginBottom: 10, letterSpacing: "0.1em" }}>INTELLIGENCE ({report.intelligence.length})</div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {report.intelligence.map((item, i) => {
                              const sc = priorityColors[item.severity] || {};
                              return (
                                <div key={i} className="card fade" style={{ padding: "14px 16px", borderLeft: `3px solid ${sc.text || "#94a3b8"}` }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                                    <div className="syne" style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", flex: 1, marginRight: 12 }}>{item.theme}</div>
                                    <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                                      <span className="tag" style={{ background: sc.bg, color: sc.text, fontSize: 9 }}>{item.severity}</span>
                                      <span className="tag" style={{ background: "#f1f5f9", color: "#475569", fontSize: 9 }}>{item.effort} effort</span>
                                      <span className="tag" style={{ background: "#f1f5f9", color: "#475569", fontSize: 9 }}>{item.caseCount} cases</span>
                                    </div>
                                  </div>
                                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                                    <div>
                                      <div className="mono" style={{ fontSize: 9, color: "#94a3b8", marginBottom: 3 }}>USER IMPACT</div>
                                      <div style={{ fontSize: 12, color: "#334155", lineHeight: 1.6 }}>{item.userImpact}</div>
                                    </div>
                                    <div>
                                      <div className="mono" style={{ fontSize: 9, color: "#94a3b8", marginBottom: 3 }}>ROOT CAUSE</div>
                                      <div style={{ fontSize: 12, color: "#334155", lineHeight: 1.6 }}>{item.rootCause}</div>
                                    </div>
                                  </div>
                                  <div style={{ background: "#f8fafc", borderRadius: 6, padding: "8px 10px", fontSize: 12, color: "#0f172a", lineHeight: 1.6 }}>
                                    <span className="mono" style={{ fontSize: 9, color: "#94a3b8" }}>RECOMMENDATION  </span>{item.recommendation}
                                  </div>
                                  <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                                    {item.affectedAccounts?.map(a => <span key={a} className="tag" style={{ background: "#fef3c7", color: "#92400e", fontSize: 9 }}>{a}</span>)}
                                    {item.affectedProducts?.map(p => <span key={p} className="tag" style={{ background: "#ede9fe", color: "#5b21b6", fontSize: 9 }}>{p}</span>)}
                                    <span className="tag mono" style={{ background: "#f1f5f9", color: "#94a3b8", fontSize: 9 }}>{item.representativeCase}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Growth areas */}
                      {report.growthAreas?.length > 0 && (
                        <div style={{ marginBottom: 18 }}>
                          <div className="mono" style={{ fontSize: 9, color: "#94a3b8", marginBottom: 10, letterSpacing: "0.1em" }}>GROWTH OPPORTUNITIES</div>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
                            {report.growthAreas.map((g, i) => {
                              const tvC = { "Quick Win": "#f0fdf4", "Mid-term": "#eff6ff", "Strategic": "#fdf4ff" }[g.timeToValue] || "#f8fafc";
                              const tvT = { "Quick Win": "#15803d", "Mid-term": "#1d4ed8", "Strategic": "#7e22ce" }[g.timeToValue] || "#64748b";
                              return (
                                <div key={i} className="card fade" style={{ padding: "14px 16px" }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                                    <div className="syne" style={{ fontSize: 12, fontWeight: 800, color: "#0f172a", flex: 1, marginRight: 8 }}>{g.opportunity}</div>
                                    <span className="tag" style={{ background: tvC, color: tvT, fontSize: 9, flexShrink: 0 }}>{g.timeToValue}</span>
                                  </div>
                                  <div className="mono" style={{ fontSize: 9, color: "#94a3b8", marginBottom: 3 }}>SUGGESTED FEATURE</div>
                                  <div style={{ fontSize: 12, color: "#334155", lineHeight: 1.6, marginBottom: 8 }}>{g.suggestedFeature}</div>
                                  <div style={{ background: "#f8fafc", borderRadius: 6, padding: "6px 9px", fontSize: 11, color: "#475569", lineHeight: 1.5 }}>
                                    <span className="mono" style={{ fontSize: 9, color: "#94a3b8" }}>⚔ </span>{g.competitiveAngle}
                                  </div>
                                  <div style={{ display: "flex", gap: 5, marginTop: 8, flexWrap: "wrap" }}>
                                    <span className="tag" style={{ background: "#f1f5f9", color: "#64748b", fontSize: 9 }}>{g.targetSegment}</span>
                                    <span className="tag" style={{ background: "#f0fdf4", color: "#15803d", fontSize: 9 }}>Impact: {g.potentialImpact}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Priority matrix */}
                      {report.priorityMatrix && (
                        <div>
                          <div className="mono" style={{ fontSize: 9, color: "#94a3b8", marginBottom: 10, letterSpacing: "0.1em" }}>PRIORITY MATRIX</div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                            {[
                              { key: "doNow", label: "DO NOW", bg: "#fff1f2", border: "#fecdd3", text: "#be123c", dot: "#f43f5e" },
                              { key: "planNext", label: "PLAN NEXT", bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8", dot: "#3b82f6" },
                              { key: "watchAndLearn", label: "WATCH & LEARN", bg: "#f0fdf4", border: "#bbf7d0", text: "#15803d", dot: "#22c55e" },
                            ].map(({ key, label, bg, border, text, dot }) => (
                              <div key={key} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: "12px 14px" }}>
                                <div className="mono" style={{ fontSize: 9, color: text, marginBottom: 10, letterSpacing: "0.08em", fontWeight: 600 }}>{label}</div>
                                {(report.priorityMatrix[key] || []).map((item, j) => (
                                  <div key={j} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 8 }}>
                                    <span style={{ color: dot, fontSize: 9, marginTop: 3, flexShrink: 0 }}>●</span>
                                    <span style={{ fontSize: 12, color: "#334155", lineHeight: 1.6 }}>{item}</span>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
