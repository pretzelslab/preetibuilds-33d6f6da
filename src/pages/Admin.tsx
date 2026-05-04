import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { govDb } from "@/lib/supabase-governance";
import { PageGate } from "@/components/ui/PageGate";
import {
  getCustomGPUs, saveCustomGPUs,
  getCustomRegions, saveCustomRegions,
  exportGPUSnippet, exportRegionSnippet,
} from "@/lib/carbonCustomData";
import { GPU_PRESETS, REGION_ZONES, STATIC_INTENSITY } from "@/data/carbonDepthData";
import type { CustomGPU, CustomRegion } from "@/lib/carbonCustomData";

interface Visit {
  id: string;
  page: string;
  referrer: string | null;
  user_agent: string | null;
  visited_at: string;
  city: string | null;
  country: string | null;
}

function parseSource(referrer: string | null): string {
  if (!referrer) return "Direct";
  if (referrer.startsWith("utm:")) {
    const src = referrer.slice(4);
    const labels: Record<string, string> = {
      linkedin: "LinkedIn", google: "Google", github: "GitHub",
      twitter: "Twitter / X", x: "Twitter / X", email: "Email",
      whatsapp: "WhatsApp", instagram: "Instagram",
    };
    return labels[src] ?? src.charAt(0).toUpperCase() + src.slice(1);
  }
  if (referrer.includes("linkedin")) return "LinkedIn";
  if (referrer.includes("google")) return "Google";
  if (referrer.includes("github")) return "GitHub";
  if (referrer.includes("twitter") || referrer.includes("x.com")) return "Twitter / X";
  try { return new URL(referrer).hostname; } catch { return referrer; }
}

function parseDevice(ua: string | null): string {
  if (!ua) return "Unknown";
  if (/mobile|android|iphone|ipad/i.test(ua)) return "Mobile";
  return "Desktop";
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const PAGE_LABELS: Record<string, string> = {
  "/": "Landing",
  "/ai-governance": "AI Governance",
  "/ai-readiness": "AI Readiness",
  "/client-discovery": "AI Risk Assessment",
  "/product-intelligence": "Product Intelligence",
  "/gtm-techstack": "GTM Tech Stack",
  "/melodic-framework": "Melodic Framework",
  "/algorithmic-fairness": "Algorithmic Fairness Auditor",
  "/medlog": "MedLog",
  "/research": "Research",
};

const LAST_SEEN_KEY = "admin_last_seen_count";

// ── Backlog Data ──────────────────────────────────────────────────────────────

type BacklogItem = {
  id: string; name: string; context: string; domain: string;
  priority: string; status: string;
  stack: string[]; complexity: string;
};

const BACKLOG: BacklogItem[] = [
  // AI Safety
  { id:"SE1",  name:"LLM Safety Eval Framework",      context:"Multi-vendor LLM safety test harness with 40+ finance-specific attack prompts across jailbreak, prompt injection, and hallucination vectors. Ph1+2a+2b pushed; Ph2c threat intel pipeline next.",                                    domain:"AI Safety",      priority:"P1", status:"in-progress", stack:["Python","Claude API","Streamlit","React"],               complexity:"Medium-High" },
  { id:"AC1",  name:"Rogue Agent Drift Detector",      context:"Detects when an AI agent deviates from its assigned goal using cosine similarity scoring across task steps. Thresholds: SAFE ≥0.77 / DRIFTING 0.62–0.77 / ROGUE <0.62. Phase 1 complete.",                                        domain:"AI Safety",      priority:"P1", status:"done",        stack:["LangGraph","sentence-transformers","MLflow","React"],    complexity:"Medium" },
  { id:"AC4",  name:"Agent Goal Hijacking Demo",       context:"Demonstrates how a prompt injection attack redirects a financial AI agent mid-task, exfiltrating 10 customer records and writing a cover report to evade detection. Phase 1–3 complete.",                                           domain:"AI Safety",      priority:"P1", status:"done",        stack:["LangGraph","Claude Haiku","Python","React"],             complexity:"Medium" },
  { id:"AC2",  name:"Cascading Multi-Agent Sim.",      context:"Simulates how a safety failure in one agent propagates across a multi-agent pipeline, quantifying blast radius per downstream agent. Models trust degradation and compounding failure modes.",                                        domain:"AI Safety",      priority:"P1", status:"backlog",     stack:["LangGraph","Python","Claude API","D3"],                  complexity:"High" },
  { id:"AC3",  name:"Unmonitored Tool Auditor",        context:"Audits every MCP tool call made by an AI agent against a policy whitelist and flags unauthorized invocations in real time. Targets agentic systems where tool use is opaque to the operator.",                                       domain:"AI Safety",      priority:"P1", status:"backlog",     stack:["Python","FastAPI","Claude API","MCP SDK"],               complexity:"High" },
  { id:"AC5",  name:"Identity & Privilege Monitor",    context:"Monitors which identity an agent operates under and whether it exceeds assigned privilege levels across tool calls and data access. Alerts on privilege escalation and role confusion attacks.",                                      domain:"AI Safety",      priority:"P1", status:"backlog",     stack:["Python","FastAPI","Postgres","Claude API"],              complexity:"High" },
  { id:"ST4",  name:"Agentic Blast Radius Calc.",      context:"Calculates downstream impact radius when an agentic system is compromised — inputs are the agent graph, trust levels, and data sensitivity. Outputs a per-node risk score and total exposure surface.",                            domain:"AI Safety",      priority:"P1", status:"backlog",     stack:["Python","Claude API","React","D3"],                      complexity:"Medium-High" },
  { id:"ST1",  name:"RAG Poisoning Simulator",         context:"Injects adversarial documents into a RAG pipeline and measures how they corrupt retrieval and downstream outputs. Tests whether standard RAG architectures are vulnerable to data poisoning at ingest.",                            domain:"AI Safety",      priority:"P1", status:"backlog",     stack:["LangChain","ChromaDB","Claude API","Streamlit"],         complexity:"High" },
  { id:"ST2",  name:"Prompt Injection Detector",       context:"Real-time classifier that intercepts user and tool inputs, flagging direct and indirect injection attempts before they reach the model. Includes detection of injections embedded in retrieved context.",                           domain:"AI Safety",      priority:"P1", status:"backlog",     stack:["FastAPI","Claude API","Redis","Postgres"],               complexity:"High" },
  { id:"ST5",  name:"Silent Failure Detector",         context:"Detects when a RAG or agentic pipeline silently degrades — producing plausible but wrong outputs with no error raised. Designed for high-stakes domains where confident-sounding hallucinations are the highest risk.",            domain:"AI Safety",      priority:"P1", status:"backlog",     stack:["Python","Claude API","spaCy","RAGAS"],                   complexity:"Medium" },
  { id:"ST6",  name:"MCP Tool Poisoning Detect.",      context:"Monitors MCP tool definitions for unexpected schema changes or tampering, defending against supply-chain attacks on tool registries. Compares live tool schemas against a signed baseline at each agent invocation.",              domain:"AI Safety",      priority:"P1", status:"backlog",     stack:["Python","MCP SDK","Claude API"],                         complexity:"Medium" },
  { id:"ST7",  name:"Distress Signal Classifier",      context:"Classifies user messages for distress signals — suicidal ideation, coercion, crisis — designed for AI systems deployed in sensitive consumer contexts. Flags edge cases that standard safety filters miss.",                        domain:"AI Safety",      priority:"P1", status:"backlog",     stack:["Python","Claude API","HuggingFace","Streamlit"],         complexity:"Medium" },
  { id:"RM1",  name:"Real-time AI Risk Monitor",       context:"Live dashboard that scores AI system outputs across safety dimensions as they run, with Azure AI Foundry integration for enterprise deployment. Combines output monitoring, drift detection, and policy compliance in one view.",   domain:"AI Safety",      priority:"P1", status:"backlog",     stack:["Python","FastAPI","Claude API","Azure Foundry"],         complexity:"High" },
  { id:"BD1",  name:"Output Bias Detector",            context:"Detects demographic bias in AI outputs across race, gender, and age by running parallel comparison tests and surfacing disparity metrics. Designed as a lightweight audit layer for production inference pipelines.",              domain:"AI Safety",      priority:"P1", status:"backlog",     stack:["Python","Claude API","React","Recharts"],                complexity:"Medium" },
  { id:"INC1", name:"AI Incident Postmortem",          context:"Structured postmortem generator for AI system failures — takes an incident log and produces root cause analysis, contributing factors, and a governance gap report. Outputs a shareable PDF artifact.",                            domain:"AI Safety",      priority:"P1", status:"backlog",     stack:["Python","React","Claude API"],                           complexity:"Medium" },
  { id:"FT10", name:"Agentic Fairness Drift/CI",       context:"CI/CD pipeline that tests whether a deployed agentic system drifts toward biased behavior over time using weekly regression evals. Hooks into GitHub Actions and opens a PR if fairness thresholds are breached.",               domain:"AI Safety",      priority:"P1", status:"backlog",     stack:["LangGraph","Python","Claude API","GH Actions"],          complexity:"High" },
  // Responsible AI
  { id:"FT9",  name:"Proxy Discrim. Under Quant.",     context:"Measures how INT8/INT4 quantization amplifies proxy discrimination in recidivism and credit scoring models. Found a 14.4% FPR gap at FP32 baseline that widens under aggressive quantization — 6 notebooks, full eval pipeline.",  domain:"Responsible AI", priority:"P1", status:"done",        stack:["Python","PyTorch","pandas","sklearn","React"],           complexity:"High" },
  { id:"P9",   name:"Privacy Impact Auditor",          context:"AI-specific DPIA tool with 8 tabs: intake, risk dashboard, DPIA report, nutrition label, model card, DP simulator, and remediation checklist. Covers 13 regulation triggers with combinatorial risk multipliers.",               domain:"Responsible AI", priority:"P3", status:"done",        stack:["React","TS","Recharts","Tailwind"],                      complexity:"Low" },
  { id:"P1",   name:"AI Compliance Agent",             context:"LangGraph pipeline that ingests a regulation, extracts obligations, checks code and policy docs against them, and opens a GitHub issue for any gap found. Phase 1–3 complete with CI/CD integration.",                           domain:"Responsible AI", priority:"P3", status:"done",        stack:["LangGraph","Python","Pandas","GH Actions"],              complexity:"Medium" },
  { id:"P4a",  name:"AI Ethics & Gov Tracker v2",      context:"Interactive tracker for 30+ global AI governance laws with a regulatory radar chart and live filter by jurisdiction and enforcement status. Includes Regulatory Radar tab and admin codes sidebar.",                             domain:"Responsible AI", priority:"P3", status:"done",        stack:["React","TS","Tailwind"],                                 complexity:"Low" },
  { id:"P6a",  name:"AI Governance Audit Agent",       context:"Deep audit agent using vector search across policy documents to detect obligation conflicts and coverage gaps. Includes human-in-loop escalation for high-severity findings and a LangSmith observability layer.",               domain:"Responsible AI", priority:"P2", status:"backlog",     stack:["LangGraph","Voyage AI","Supabase","FastAPI"],            complexity:"Very High" },
  { id:"FA1",  name:"Fairness Audit API",              context:"REST API wrapping equalized odds, demographic parity, and calibration metrics for drop-in integration into existing ML pipelines. Designed for teams who want fairness auditing without rebuilding their stack.",                  domain:"Responsible AI", priority:"P2", status:"backlog",     stack:["FastAPI","Docker","Python","PyTorch"],                   complexity:"High" },
  { id:"FIN1", name:"Credit Scoring Covar. Shift",     context:"Detects when a deployed credit scoring model's input distribution has drifted from training data and flags emerging proxy variables before they cause discriminatory outcomes.",                                                   domain:"Responsible AI", priority:"P1", status:"backlog",     stack:["Python","sklearn","pandas","Recharts"],                  complexity:"Medium" },
  { id:"FIN3", name:"Cascading Risk in Agentic Fin.",  context:"Models how an AI agent failure in one part of a financial workflow — fraud detection, credit, onboarding — cascades into downstream decisions with compounding harm. Connects to AC2 blast radius work.",                        domain:"Responsible AI", priority:"P1", status:"backlog",     stack:["LangGraph","Python","Claude API","React"],               complexity:"High" },
  { id:"DLC1", name:"Dataset Lineage & Consent",       context:"Tracks data provenance from source through training to deployment, flagging data used without consent or beyond its stated purpose. Designed to support EU AI Act and DPDP Act compliance audits.",                              domain:"Responsible AI", priority:"P1", status:"backlog",     stack:["Python","DVC","SQLite","React"],                         complexity:"High" },
  { id:"RF1",  name:"On-device Adversarial Robust.",   context:"Tests whether edge-deployed and quantized models are robust to adversarial examples under constrained compute. Surfaces the attack surface created by quantization — companion research to FT9.",                               domain:"Responsible AI", priority:"P1", status:"backlog",     stack:["Python","PyTorch","HuggingFace","Jupyter"],              complexity:"High" },
  // Sustainability
  { id:"SA1",  name:"Carbon-aware Inference Router",   context:"Routes LLM API calls to the lowest-carbon available model using live grid intensity data. Phase 1 complete: 45.5% carbon savings, 0.09ms P95 latency, 100%/90%/100% precision across 5 eval dimensions.",                       domain:"Sustainability", priority:"P1", status:"in-progress", stack:["Python","FastAPI","Electricity Maps","Claude API"],      complexity:"Medium-High" },
  { id:"P2",   name:"AI Carbon Footprint Calc.",       context:"Interactive Scope 2 emissions estimator for AI training and inference workloads, validated against Strubell 2019, Patterson 2021, and BLOOM 2022 benchmarks. Live on preetibuilds.",                                             domain:"Sustainability", priority:"P3", status:"done",        stack:["React","TS","Recharts","Electricity Maps"],              complexity:"Low" },
  { id:"CTT",  name:"Carbon Time Travel",              context:"Animated visualization of AI carbon intensity from BERT 2018 to GPT-4 2023, with a Llama 7B vs 70B crossover animation showing the training-vs-inference carbon breakeven point.",                                             domain:"Sustainability", priority:"P3", status:"done",        stack:["React","TS","Recharts","Framer Motion"],                 complexity:"Low" },
  { id:"P3",   name:"AI Sustainability Disclosure",    context:"Framework and slide deck generator for CSRD and GPAI sustainability disclosures, covering double materiality, GRI 305, and proxy metrics. Includes PPTX export and conformance chart.",                                          domain:"Sustainability", priority:"P3", status:"done",        stack:["React","TS","pptxgenjs"],                                complexity:"Low" },
  { id:"P3c",  name:"AI Sustainability Webinar",       context:"17-slide webinar package for EU FinTech audiences on AI sustainability compliance, with an ROI calculator, Gantt timeline, and a simulated client email scenario for Sarah Müller at FinTech Zürich.",                          domain:"Sustainability", priority:"P3", status:"done",        stack:["React","TS","pptxgenjs","Recharts"],                     complexity:"Low" },
  { id:"P4b",  name:"Sustainability Standards",        context:"Tabular grid of 13 industry players with job profiles cross-referenced against 11 sustainability frameworks, designed to map where standards intersect with AI product roles.",                                                    domain:"Sustainability", priority:"P3", status:"done",        stack:["React","TS","Tailwind"],                                 complexity:"Low" },
  { id:"SA2",  name:"AI Lifecycle Emissions",          context:"Tracks carbon emissions across the full AI model lifecycle: data collection, training, fine-tuning, inference, and retirement. Designed to plug into MLOps pipelines as a reporting hook.",                                       domain:"Sustainability", priority:"P2", status:"scoping",     stack:["Python","pipeline hooks","dashboard"],                   complexity:"High" },
  { id:"SA3",  name:"Sustainable Agent Runtime",       context:"LangGraph runtime that enforces per-task carbon budgets on agentic workflows, pausing tasks that exceed emissions thresholds and rerouting to lower-cost models.",                                                               domain:"Sustainability", priority:"P2", status:"scoping",     stack:["Python","LangGraph"],                                    complexity:"Medium" },
  { id:"SA5",  name:"Rebound Effect Simulator",        context:"Simulates Jevons paradox in AI — where efficiency gains are offset by increased usage demand — and shows net carbon impact under different adoption scenarios. Quantifies the rebound risk for enterprise AI rollouts.",          domain:"Sustainability", priority:"P2", status:"scoping",     stack:["Python","React","simulation"],                           complexity:"Medium" },
  { id:"SA4",  name:"Green RAG System",                context:"RAG pipeline optimized for energy efficiency using smaller retrieval chunks, carbon-aware model selection, and batched retrieval to reduce per-query emissions. Benchmark target: 40% lower energy vs standard RAG.",            domain:"Sustainability", priority:"P3", status:"scoping",     stack:["Python","LangChain","Redis"],                            complexity:"High" },
  // Portfolio
  { id:"P8b",  name:"Landing Page Section Split",      context:"Splits the landing page into three distinct visual sections — Responsible AI, Sustainable AI, AI Safety — each with its own identity and entry point. Currently paused pending Hero redesign decision.",                         domain:"Portfolio",      priority:"P2", status:"backlog",     stack:["React","TS","Tailwind"],                                 complexity:"Low" },
  { id:"P8e",  name:"Hero Section Redesign",           context:"Redesign of the hero section with animated role reveal and domain-based filter entry. Blocked pending a decision on whether to use a two-column layout or keep the current centered single-column.",                             domain:"Portfolio",      priority:"P3", status:"backlog",     stack:["React","TS","Tailwind","Framer Motion"],                 complexity:"Low" },
  { id:"P5",   name:"Melodic — Arohan/Avrohan",        context:"Phase 3 of Melodic: tune matching using ascending (arohan) and descending (avrohan) raga note sequences to identify raga identity from a phrase input. Requires Supabase schema extension and Claude API classification.",      domain:"Portfolio",      priority:"P2", status:"backlog",     stack:["React","TS","Supabase","Claude API"],                    complexity:"Medium" },
  { id:"P7",   name:"Job Opportunity Search Tool",     context:"Claude-powered tool that takes a job description, maps it to Preeti's portfolio projects by skill overlap, and drafts a tailored cover letter highlighting the most relevant work.",                                             domain:"Portfolio",      priority:"P3", status:"backlog",     stack:["Python","Claude API"],                                   complexity:"Medium" },
  { id:"IN1",  name:"India Pollution — Air",           context:"Satellite-based PM2.5 and AQI visualization for Indian cities using Sentinel-5P data, with filters by state, season, and pollution source type. Part of a two-part India environmental data series.",                           domain:"Portfolio",      priority:"P3", status:"backlog",     stack:["Python","Pandas","Sentinel-5P","React"],                 complexity:"High" },
  { id:"IN2",  name:"India Pollution — Water",         context:"Water quality index visualization for Indian rivers and groundwater using CPCB data, tracking contamination trends over time. Companion to IN1 air pollution — shares the same map and filter component.",                       domain:"Portfolio",      priority:"P3", status:"backlog",     stack:["Python","Pandas","CPCB","React"],                        complexity:"High" },
  // Research
  { id:"RF2",  name:"Federated Fairness Audit",        context:"Targets non-IID data splits across regions — tests whether fairness metrics hold when training data is federated and imbalanced across clients. HuggingFace and Flower framework target venue.",                                            domain:"Research",       priority:"P1", status:"backlog",     stack:["Python","Flower","HuggingFace"],                         complexity:"High" },
  { id:"RF3",  name:"Edge Emergency Alert Classifier", context:"DistilBERT/phi-2 offline classifier for emergency alert categorisation on edge hardware. No published reliability standard exists for this domain — extends FT3 research direction.",                                                       domain:"Research",       priority:"P1", status:"backlog",     stack:["Python","DistilBERT","phi-2","HuggingFace"],             complexity:"Medium" },
  { id:"RF4",  name:"Agentic Drift Monitor",           context:"Measures whether fairness metrics degrade over long agent conversation turns — targeting Far.ai and MLflow eval publishing track. Builds on AC1 cosine similarity approach.",                                                               domain:"Research",       priority:"P1", status:"backlog",     stack:["LangGraph","MLflow","Python"],                           complexity:"Medium" },
  { id:"RF5",  name:"Eval — Intimate Adversary",       context:"ARC Evals-format rubric for AI systems that enable IPV and stalking threat vectors. Defines the evaluation grammar for intimate adversary attacks on LLMs — companion to FT11.",                                                          domain:"Research",       priority:"P1", status:"backlog",     stack:["Python","ARC Evals"],                                    complexity:"Medium" },
  { id:"FT11", name:"IPV/Stalking AI Threat",          context:"Threat taxonomy tool for AI-enabled intimate partner violence and stalking — combines Preeti's IPV domain background with adversarial robustness methods. Connects to SE1, AC1, FT9/RF5.",                                               domain:"Research",       priority:"P2", status:"backlog",     stack:["React","TS","Python"],                                   complexity:"Medium" },
  { id:"FT1",  name:"Adversarial Fairness Audit",      context:"Tests whether adversarial inputs degrade fairness metrics unevenly across demographic groups. Tier 1 frontier research — stress-tests fairness guarantees that auditors typically assume hold under distribution shift.",                  domain:"Research",       priority:"P2", status:"backlog",     stack:["React","Python","Recharts"],                             complexity:"High" },
  { id:"FT3",  name:"Emergency Alert Edge Safety",     context:"Tests reliability of AI safety classifiers on edge hardware for real-time emergency alerts. No published reliability standard exists — identified as a Tier 1 frontier gap.",                                                             domain:"Research",       priority:"P2", status:"backlog",     stack:["Python","React"],                                        complexity:"High" },
  { id:"FT4",  name:"Shadow Model Provenance",         context:"Research note: distilled models inherit carbon and safety provenance from their teacher model — neither is currently tracked. Proposes a provenance standard for model distillation lineage.",                                            domain:"Research",       priority:"P3", status:"backlog",     stack:["Markdown","React"],                                      complexity:"Low" },
  { id:"FT5",  name:"Federated Learning + Fairness",   context:"Research note: local federated updates dilute underrepresented data in the global aggregation step, introducing systematic bias. Proposes mitigation via fairness-weighted aggregation.",                                               domain:"Research",       priority:"P3", status:"backlog",     stack:["Markdown","simulation"],                                 complexity:"Low" },
  { id:"MU1",  name:"Model Unlearning System",         context:"Implements machine unlearning at the model level — right to be forgotten without full retraining. Unsolved at scale. Needs collaborator or lab access — park until SA1 Phase 2 is complete.",                                           domain:"Research",       priority:"P3", status:"backlog",     stack:["Python","PyTorch","HuggingFace"],                        complexity:"Very High" },
];

const STATUS_META: Record<string, { label: string; cls: string }> = {
  "done":        { label: "Done",        cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" },
  "in-progress": { label: "Building",    cls: "bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-500/30" },
  "next":        { label: "Next",        cls: "bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/30" },
  "scoping":     { label: "Scoping",     cls: "bg-violet-500/10 text-violet-600 dark:text-violet-300 border-violet-500/30" },
  "backlog":     { label: "Backlog",     cls: "bg-muted/30 text-muted-foreground border-border/40" },
};

const COMPLEXITY_META: Record<string, { cls: string }> = {
  "Low":         { cls: "text-emerald-600 dark:text-emerald-400 border-emerald-500/30" },
  "Medium":      { cls: "text-sky-600 dark:text-sky-300 border-sky-500/30" },
  "Medium-High": { cls: "text-amber-600 dark:text-amber-300 border-amber-500/30" },
  "High":        { cls: "text-orange-600 dark:text-orange-300 border-orange-500/30" },
  "Very High":   { cls: "text-rose-600 dark:text-rose-300 border-rose-500/30" },
};

const DOMAINS = ["All", "AI Safety", "Responsible AI", "Sustainability", "Research", "Portfolio"];

// ── Backlog metadata (tags, regulation, phases) ───────────────────────────────
const ITEM_META: Record<string, { tag?: string[]; regulation?: string[]; phases?: number[] }> = {
  SE1:  { tag:["Tool","Evals"],        regulation:["OWASP LLM","MITRE ATLAS","NIST AI RMF"], phases:[1,2] },
  AC1:  { tag:["Agent"],               regulation:["OWASP LLM","MITRE ATLAS"],               phases:[1] },
  AC4:  { tag:["Agent","Demo"],        regulation:["OWASP LLM","MITRE ATLAS"],               phases:[1,2,3] },
  AC2:  { tag:["Agent"],               regulation:["OWASP LLM","MITRE ATLAS"] },
  AC3:  { tag:["Agent"],               regulation:["OWASP LLM","MITRE ATLAS"] },
  AC5:  { tag:["Agent"],               regulation:["OWASP LLM","MITRE ATLAS"] },
  ST4:  { tag:["Agent","Tool"],        regulation:["OWASP LLM","MITRE ATLAS"] },
  ST1:  { tag:["Tool"],                regulation:["OWASP LLM","MITRE ATLAS"] },
  ST2:  { tag:["Tool"],                regulation:["OWASP LLM","MITRE ATLAS"] },
  ST5:  { tag:["Tool"],                regulation:["OWASP LLM"] },
  ST6:  { tag:["Tool"],                regulation:["OWASP LLM","MITRE ATLAS"] },
  ST7:  { tag:["Tool"],                regulation:["OWASP LLM"] },
  RM1:  { tag:["Tool"],                regulation:["EU AI Act","NIST AI RMF"] },
  BD1:  { tag:["Tool"],                regulation:["EU AI Act","NIST AI RMF"] },
  INC1: { tag:["Tool"],                regulation:["EU AI Act"] },
  FT10: { tag:["Evals"],               regulation:["EU AI Act"] },
  FT9:  { tag:["Research","Evals"],    regulation:["EU AI Act","OWASP LLM"],                  phases:[1,2,3] },
  P9:   { tag:["Tool"],                regulation:["GDPR","DPDP Act","EU AI Act"],             phases:[1,2] },
  P1:   { tag:["Agent"],               regulation:["EU AI Act","ISO 42001"],                   phases:[1,2,3] },
  P4a:  { tag:["Tool"],                regulation:["EU AI Act","ISO 42001","NIST AI RMF"],     phases:[1] },
  P6a:  { tag:["Agent"],               regulation:["EU AI Act","NIST AI RMF"] },
  FA1:  { tag:["Tool","API"],          regulation:["EU AI Act","NIST AI RMF"] },
  FIN1: { tag:["Tool","Research"],     regulation:["EU AI Act"] },
  FIN3: { tag:["Agent"],               regulation:["EU AI Act"] },
  DLC1: { tag:["Tool"],                regulation:["GDPR","EU AI Act","DPDP Act"] },
  RF1:  { tag:["Research","Evals"],    regulation:["NIST AI RMF"] },
  SA1:  { tag:["Tool","Research"],     regulation:["EU AI Act","GRI 305"],                    phases:[1] },
  P2:   { tag:["Tool","Viz"],          regulation:["GRI 305"],                                phases:[1] },
  CTT:  { tag:["Viz"],                                                                         phases:[1] },
  P3:   { tag:["Framework"],           regulation:["EU AI Act","GRI 305"],                    phases:[1] },
  P3c:  { tag:["Framework"],           regulation:["EU AI Act"],                               phases:[1] },
  P4b:  { tag:["Tool"],                regulation:["ISO 42001"],                               phases:[1] },
  SA2:  { tag:["Tool","Research"] },
  SA3:  { tag:["Agent"] },
  SA5:  { tag:["Research"] },
  SA4:  { tag:["Tool"] },
  P8b:  { tag:["Portfolio"] },
  P8e:  { tag:["Portfolio"] },
  P5:   { tag:["Tool"] },
  P7:   { tag:["Tool"] },
  IN1:  { tag:["Viz","Research"] },
  IN2:  { tag:["Viz","Research"] },
  RF2:  { tag:["Research","Evals"],    regulation:["NIST AI RMF"] },
  RF3:  { tag:["Research","Evals"],    regulation:["OWASP LLM"] },
  RF4:  { tag:["Research","Evals"],    regulation:["MITRE ATLAS"] },
  RF5:  { tag:["Research","Evals"] },
  FT11: { tag:["Research","Tool"] },
  FT1:  { tag:["Research","Evals"],    regulation:["EU AI Act"] },
  FT3:  { tag:["Research","Tool"],     regulation:["OWASP LLM"] },
  FT4:  { tag:["Research"] },
  FT5:  { tag:["Research"] },
  MU1:  { tag:["Research"],            regulation:["EU AI Act","GDPR"] },
};

type ColDef = { key: string; label: string; defaultVisible: boolean; sortable: boolean; width?: string };

const COLUMN_DEFS: ColDef[] = [
  { key:"id",         label:"ID",         defaultVisible:true,  sortable:false, width:"w-10" },
  { key:"name",       label:"Name",       defaultVisible:true,  sortable:false },
  { key:"context",    label:"Context",    defaultVisible:true,  sortable:false, width:"w-48" },
  { key:"P",          label:"P",          defaultVisible:true,  sortable:true,  width:"w-10" },
  { key:"status",     label:"Status",     defaultVisible:true,  sortable:true,  width:"w-20" },
  { key:"complexity", label:"Complexity", defaultVisible:true,  sortable:true,  width:"w-28" },
  { key:"stack",      label:"Stack",      defaultVisible:true,  sortable:true },
  { key:"tag",        label:"Tag",        defaultVisible:true,  sortable:false },
  { key:"regulation", label:"Regulation", defaultVisible:false, sortable:false },
  { key:"phases",     label:"Phases",     defaultVisible:false, sortable:false },
];

const TAG_COLORS: Record<string, string> = {
  Tool:      "bg-sky-500/10 text-sky-600 dark:text-sky-300 border-sky-500/30",
  Agent:     "bg-violet-500/10 text-violet-600 dark:text-violet-300 border-violet-500/30",
  Evals:     "bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/30",
  Research:  "bg-rose-500/10 text-rose-600 dark:text-rose-300 border-rose-500/30",
  Viz:       "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  Framework: "bg-teal-500/10 text-teal-600 dark:text-teal-300 border-teal-500/30",
  Portfolio: "bg-muted/30 text-muted-foreground border-border/40",
  Demo:      "bg-orange-500/10 text-orange-600 dark:text-orange-300 border-orange-500/30",
  API:       "bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 border-cyan-500/30",
};

const REG_COLORS: Record<string, string> = {
  "OWASP LLM":   "bg-orange-500/10 text-orange-600 dark:text-orange-300 border-orange-500/30",
  "MITRE ATLAS": "bg-red-500/10 text-red-600 dark:text-red-300 border-red-500/30",
  "EU AI Act":   "bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-500/30",
  "NIST AI RMF": "bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border-indigo-500/30",
  "GDPR":        "bg-violet-500/10 text-violet-600 dark:text-violet-300 border-violet-500/30",
  "DPDP Act":    "bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-500/30",
  "ISO 42001":   "bg-teal-500/10 text-teal-600 dark:text-teal-300 border-teal-500/30",
  "GRI 305":     "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
};

// ── BacklogViewer ─────────────────────────────────────────────────────────────
function BacklogViewer() {
  const [open, setOpen] = useState(true);
  const [domain, setDomain] = useState("All");
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [comments, setComments] = useState<Record<string, string>>(() => {
    try {
      const all: Record<string, string> = {};
      BACKLOG.forEach(item => {
        const val = localStorage.getItem(`backlog_comment_${item.id}`);
        if (val) all[item.id] = val;
      });
      return all;
    } catch { return {}; }
  });
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState("");
  const escapeRef = useRef(false);
  const [columnOrder, setColumnOrder] = useState<string[]>(() => {
    try { const s = localStorage.getItem("backlog_col_order"); if (s) return JSON.parse(s); } catch {}
    return COLUMN_DEFS.map(c => c.key);
  });
  const [visibleCols, setVisibleCols] = useState<Set<string>>(() => {
    try { const s = localStorage.getItem("backlog_col_visible"); if (s) return new Set(JSON.parse(s) as string[]); } catch {}
    return new Set(COLUMN_DEFS.filter(c => c.defaultVisible).map(c => c.key));
  });
  const [showColMenu, setShowColMenu] = useState(false);
  const dragColRef = useRef<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const colMenuRef = useRef<HTMLDivElement>(null);
  const [colWidths, setColWidths] = useState<Record<string, number>>(() => {
    try { const s = localStorage.getItem("backlog_col_widths"); if (s) return JSON.parse(s); } catch {}
    return {};
  });

  useEffect(() => {
    if (!showColMenu) return;
    function handler(e: MouseEvent) {
      if (colMenuRef.current && !colMenuRef.current.contains(e.target as Node)) setShowColMenu(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showColMenu]);

  const PRIORITY_ORDER: Record<string, number> = { P1: 1, P2: 2, P3: 3 };
  const STATUS_ORDER: Record<string, number> = { "in-progress": 1, "next": 2, "scoping": 3, "backlog": 4, "done": 5 };
  const COMPLEXITY_ORDER: Record<string, number> = { "Low": 1, "Medium": 2, "Medium-High": 3, "High": 4, "Very High": 5 };

  const rawItems = domain === "All" ? BACKLOG : BACKLOG.filter(b => b.domain === domain);
  const items = sortCol
    ? [...rawItems].sort((a, b) => {
        let cmp = 0;
        if (sortCol === "P") cmp = (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9);
        else if (sortCol === "status") cmp = (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
        else if (sortCol === "complexity") cmp = (COMPLEXITY_ORDER[a.complexity] ?? 9) - (COMPLEXITY_ORDER[b.complexity] ?? 9);
        else if (sortCol === "stack") cmp = (a.stack[0] ?? "").localeCompare(b.stack[0] ?? "");
        return sortDir === "asc" ? cmp : -cmp;
      })
    : rawItems;

  const done = BACKLOG.filter(b => b.status === "done").length;

  const orderedVisibleCols = columnOrder
    .map(key => COLUMN_DEFS.find(c => c.key === key))
    .filter((c): c is ColDef => !!c && visibleCols.has(c.key));

  const colCount = orderedVisibleCols.length;

  function toggleSort(col: string) {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  }

  function toggleCol(key: string) {
    setVisibleCols(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      try { localStorage.setItem("backlog_col_visible", JSON.stringify([...next])); } catch {}
      return next;
    });
  }

  function saveComment(itemId: string) {
    const val = commentDraft.trim();
    setComments(prev => {
      const updated = { ...prev };
      if (val) {
        try { localStorage.setItem(`backlog_comment_${itemId}`, val); } catch {}
        updated[itemId] = val;
      } else {
        try { localStorage.removeItem(`backlog_comment_${itemId}`); } catch {}
        delete updated[itemId];
      }
      return updated;
    });
    setEditingComment(null);
  }

  function handleDragStart(key: string) { dragColRef.current = key; }
  function handleDragOver(e: React.DragEvent, key: string) { e.preventDefault(); setDragOverCol(key); }
  function handleDrop(targetKey: string) {
    const from = dragColRef.current;
    if (!from || from === targetKey) { setDragOverCol(null); return; }
    setColumnOrder(prev => {
      const next = [...prev];
      const fi = next.indexOf(from), ti = next.indexOf(targetKey);
      if (fi === -1 || ti === -1) return prev;
      next.splice(fi, 1); next.splice(ti, 0, from);
      try { localStorage.setItem("backlog_col_order", JSON.stringify(next)); } catch {}
      return next;
    });
    dragColRef.current = null; setDragOverCol(null);
  }
  function handleDragEnd() { dragColRef.current = null; setDragOverCol(null); }

  function startResize(e: React.MouseEvent, colKey: string, currentWidth: number) {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = currentWidth;
    let latestWidth = startWidth;
    function onMove(ev: MouseEvent) {
      latestWidth = Math.max(36, startWidth + (ev.clientX - startX));
      setColWidths(prev => ({ ...prev, [colKey]: latestWidth }));
    }
    function onUp() {
      setColWidths(prev => {
        const next = { ...prev, [colKey]: latestWidth };
        try { localStorage.setItem("backlog_col_widths", JSON.stringify(next)); } catch {}
        return next;
      });
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  return (
    <div className="rounded-2xl border border-border/40 bg-card/50 overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-muted/10 transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold">Project Backlog</span>
          <span className="text-xs text-muted-foreground">{done} done · {BACKLOG.length - done} remaining</span>
        </div>
        <span className="text-muted-foreground">{open ? "▾" : "▸"}</span>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-3">
          {/* Domain filters + column picker */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              {DOMAINS.map(d => (
                <button key={d} onClick={() => setDomain(d)}
                  className={`text-[11px] px-3 py-1 rounded-full border transition-colors font-medium ${domain === d ? "border-primary/60 bg-primary/10 text-primary" : "border-border/40 text-muted-foreground hover:border-primary/40 hover:text-foreground"}`}
                >
                  {d} {d !== "All" && `(${BACKLOG.filter(b => b.domain === d).length})`}
                </button>
              ))}
            </div>
            <div ref={colMenuRef} className="relative shrink-0">
              <button onClick={() => setShowColMenu(v => !v)}
                className="text-[11px] px-2 py-1 rounded-lg border border-border/40 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors whitespace-nowrap"
                title="Show / hide columns"
              >⚙ Columns</button>
              {showColMenu && (
                <div className="absolute right-0 top-8 z-50 bg-popover border border-border/40 rounded-xl shadow-xl p-3 w-44 space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2">Show / hide</p>
                  {COLUMN_DEFS.map(col => (
                    <label key={col.key} className="flex items-center gap-2 text-[11px] cursor-pointer text-muted-foreground hover:text-foreground select-none">
                      <input type="checkbox" checked={visibleCols.has(col.key)} onChange={() => toggleCol(col.key)} className="accent-primary" />
                      {col.label}
                    </label>
                  ))}
                  <button
                    onClick={() => { setColWidths({}); try { localStorage.removeItem("backlog_col_widths"); } catch {} }}
                    className="mt-2 w-full text-[10px] text-muted-foreground/60 hover:text-foreground border border-border/30 rounded py-1 transition-colors"
                  >Reset widths</button>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border/40 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/40 bg-muted/20">
                  {orderedVisibleCols.map(col => {
                    const isOver = dragOverCol === col.key;
                    const active = sortCol === col.key;
                    const manualWidth = colWidths[col.key];
                    return (
                      <th key={col.key}
                        draggable
                        onDragStart={() => handleDragStart(col.key)}
                        onDragOver={e => handleDragOver(e, col.key)}
                        onDrop={() => handleDrop(col.key)}
                        onDragEnd={handleDragEnd}
                        onClick={col.sortable ? () => toggleSort(col.key) : undefined}
                        style={manualWidth ? { width: manualWidth } : undefined}
                        className={`relative text-left px-3 py-2 font-medium text-muted-foreground select-none transition-colors ${col.sortable ? "cursor-pointer hover:text-foreground" : "cursor-grab"} ${manualWidth ? "" : (col.width ?? "")} ${isOver ? "bg-primary/10 border-l-2 border-primary/40" : ""}`}
                        title={col.sortable ? `Sort by ${col.label}` : "Drag to reorder"}
                      >
                        {col.label}
                        {col.sortable && <span className={`ml-1 ${active ? "text-primary" : "opacity-20"}`}>{active ? (sortDir === "asc" ? "▲" : "▼") : "↕"}</span>}
                        <div
                          className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize opacity-0 hover:opacity-100 bg-primary/40 transition-opacity z-10"
                          onMouseDown={e => startResize(e, col.key, (e.currentTarget.parentElement as HTMLTableCellElement).offsetWidth)}
                          onClick={e => e.stopPropagation()}
                        />
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {items.flatMap((item, i) => {
                  const sm = STATUS_META[item.status] ?? STATUS_META["backlog"];
                  const cm = COMPLEXITY_META[item.complexity] ?? COMPLEXITY_META["Medium"];
                  const hasComment = !!comments[item.id];
                  const isEditingThis = editingComment === item.id;
                  const meta = ITEM_META[item.id] ?? {};
                  const tag = meta.tag ?? [];
                  const regulation = meta.regulation ?? [];
                  const phases = meta.phases ?? [];
                  const rowCls = `border-b border-border/30 ${item.status === "done" ? "opacity-50" : item.status === "in-progress" ? "bg-blue-500/5" : i % 2 === 0 ? "" : "bg-muted/10"}`;

                  function cell(colKey: string): JSX.Element {
                    switch (colKey) {
                      case "id":
                        return <td key="id" className="px-3 py-1.5 font-mono text-[10px] text-muted-foreground/60 whitespace-nowrap">{item.id}</td>;
                      case "name":
                        return (
                          <td key="name" className="px-3 py-1.5 font-medium text-foreground cursor-pointer whitespace-nowrap"
                            onClick={() => { setEditingComment(isEditingThis ? null : item.id); setCommentDraft(comments[item.id] ?? ""); }}
                            title="Click to add/edit note">
                            <span className="flex items-center gap-1.5">
                              {item.name}
                              {hasComment && <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400/70 flex-none shrink-0" />}
                            </span>
                          </td>
                        );
                      case "context":
                        return (
                          <td key="context" className="px-3 py-1.5 w-48" title={item.context}>
                            <span className="block max-w-[192px] truncate text-[10px] text-foreground/55 dark:text-slate-400">{item.context}</span>
                          </td>
                        );
                      case "P":
                        return (
                          <td key="P" className="px-3 py-1.5">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                              item.priority === "P1" ? "text-rose-500 dark:text-rose-300 border-rose-500/30 bg-rose-500/10"
                              : item.priority === "P2" ? "text-amber-500 dark:text-amber-300 border-amber-500/30 bg-amber-500/10"
                              : "text-muted-foreground border-border/40 bg-muted/20"
                            }`}>{item.priority}</span>
                          </td>
                        );
                      case "status":
                        return <td key="status" className="px-3 py-1.5"><span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border whitespace-nowrap ${sm.cls}`}>{sm.label}</span></td>;
                      case "complexity":
                        return <td key="complexity" className="px-3 py-1.5"><span className={`text-[10px] font-mono border rounded px-1.5 py-0.5 whitespace-nowrap ${cm.cls}`}>{item.complexity}</span></td>;
                      case "stack":
                        return (
                          <td key="stack" className="px-3 py-1.5">
                            <div className="flex flex-wrap gap-1">
                              {item.stack.map(t => <span key={t} className="text-[9px] font-mono px-1 py-0.5 rounded bg-muted/30 border border-border/30 text-slate-600 dark:text-slate-200 whitespace-nowrap">{t}</span>)}
                            </div>
                          </td>
                        );
                      case "tag":
                        return (
                          <td key="tag" className="px-3 py-1.5">
                            <div className="flex flex-wrap gap-1">
                              {tag.map(t => <span key={t} className={`text-[9px] font-mono px-1 py-0.5 rounded border whitespace-nowrap ${TAG_COLORS[t] ?? "bg-muted/30 text-muted-foreground border-border/30"}`}>{t}</span>)}
                            </div>
                          </td>
                        );
                      case "regulation":
                        return (
                          <td key="regulation" className="px-3 py-1.5">
                            <div className="flex flex-wrap gap-1">
                              {regulation.map(r => <span key={r} className={`text-[9px] font-mono px-1 py-0.5 rounded border whitespace-nowrap ${REG_COLORS[r] ?? "bg-muted/30 text-muted-foreground border-border/30"}`}>{r}</span>)}
                            </div>
                          </td>
                        );
                      case "phases":
                        return (
                          <td key="phases" className="px-3 py-1.5">
                            {phases.length > 0
                              ? <div className="flex gap-1 flex-wrap">{[1,2,3].filter(n => phases.includes(n)).map(n => <span key={n} className="text-[9px] font-mono px-1 py-0.5 rounded border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">Ph{n}✓</span>)}</div>
                              : <span className="text-[10px] text-muted-foreground/30">—</span>}
                          </td>
                        );
                      default: return <td key={colKey} />;
                    }
                  }

                  const mainRow = (
                    <tr key={item.id} className={rowCls}>
                      {orderedVisibleCols.map(col => cell(col.key))}
                    </tr>
                  );

                  const rows: JSX.Element[] = [mainRow];

                  if (hasComment && !isEditingThis) {
                    rows.push(
                      <tr key={`${item.id}-c`} className={item.status === "done" ? "opacity-50" : ""}>
                        <td colSpan={colCount} className="px-3 pb-1.5 pt-0 border-b border-border/30">
                          <p className="text-[10px] italic text-muted-foreground/50 line-clamp-2">{comments[item.id]}</p>
                        </td>
                      </tr>
                    );
                  }

                  if (isEditingThis) {
                    rows.push(
                      <tr key={`${item.id}-e`}>
                        <td colSpan={colCount} className="px-3 pb-2 pt-0 border-b border-border/30">
                          <input autoFocus value={commentDraft}
                            onChange={e => setCommentDraft(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === "Enter") { e.preventDefault(); saveComment(item.id); }
                              if (e.key === "Escape") { e.preventDefault(); escapeRef.current = true; setEditingComment(null); }
                            }}
                            onBlur={() => { if (!escapeRef.current) saveComment(item.id); escapeRef.current = false; }}
                            placeholder="Add a note… (Enter to save · Escape to cancel)"
                            className="w-full text-[10px] bg-muted/20 border border-border/30 rounded px-2 py-1 text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-amber-500/40"
                          />
                        </td>
                      </tr>
                    );
                  }

                  return rows;
                })}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-muted-foreground/40">Drag column headers to reorder · ⚙ Columns to show/hide · click Name to add a note</p>
        </div>
      )}
    </div>
  );
}

// ── Carbon Depth Data Manager ─────────────────────────────────────────────────
function CarbonDataManager() {
  const [open, setOpen] = useState(false);

  // ── GPU state ──────────────────────────────────────────────────────────────
  const [customGPUs, setCustomGPUs]   = useState<CustomGPU[]>(() => getCustomGPUs());
  const [gpuName, setGpuName]         = useState("");
  const [gpuTdp, setGpuTdp]           = useState("");
  const [gpuSource, setGpuSource]     = useState("");
  const [gpuError, setGpuError]       = useState("");
  const [gpuCopied, setGpuCopied]     = useState(false);

  // ── Region state ───────────────────────────────────────────────────────────
  const [customRegions, setCustomRegions] = useState<CustomRegion[]>(() => getCustomRegions());
  const [rLabel, setRLabel]               = useState("");
  const [rZone, setRZone]                 = useState("");
  const [rIntensity, setRIntensity]       = useState("");
  const [rSource, setRSource]             = useState("");
  const [rError, setRError]               = useState("");
  const [rCopied, setRCopied]             = useState(false);

  // ── GPU actions ────────────────────────────────────────────────────────────
  function addGPU() {
    setGpuError("");
    const name = gpuName.trim();
    const tdp  = Number(gpuTdp);
    if (!name)              return setGpuError("GPU name is required.");
    if (isNaN(tdp) || tdp <= 0) return setGpuError("TDP must be a positive number (watts).");
    if (GPU_PRESETS[name])  return setGpuError(`"${name}" already exists in the built-in list.`);
    if (customGPUs.find(g => g.name === name)) return setGpuError(`"${name}" already added.`);
    const updated = [...customGPUs, { name, tdpWatts: tdp, source: gpuSource.trim() || "manual entry" }];
    setCustomGPUs(updated);
    saveCustomGPUs(updated);
    setGpuName(""); setGpuTdp(""); setGpuSource("");
  }

  function deleteGPU(name: string) {
    const updated = customGPUs.filter(g => g.name !== name);
    setCustomGPUs(updated);
    saveCustomGPUs(updated);
  }

  function copyGPUSnippet() {
    navigator.clipboard.writeText(exportGPUSnippet()).then(() => {
      setGpuCopied(true);
      setTimeout(() => setGpuCopied(false), 2000);
    });
  }

  // ── Region actions ─────────────────────────────────────────────────────────
  function addRegion() {
    setRError("");
    const label     = rLabel.trim();
    const zone      = rZone.trim().toUpperCase();
    const intensity = Number(rIntensity);
    if (!label)                    return setRError("Region label is required (e.g. me-south-1 (Bahrain)).");
    if (!zone)                     return setRError("Zone ID is required (e.g. BH).");
    if (isNaN(intensity) || intensity <= 0) return setRError("Intensity must be a positive number (gCO₂/kWh).");
    if (REGION_ZONES[label])       return setRError(`"${label}" already exists in the built-in list.`);
    if (customRegions.find(r => r.label === label)) return setRError(`"${label}" already added.`);
    const updated = [...customRegions, { label, zoneId: zone, intensityGCO2: intensity, source: rSource.trim() || "manual entry" }];
    setCustomRegions(updated);
    saveCustomRegions(updated);
    setRLabel(""); setRZone(""); setRIntensity(""); setRSource("");
  }

  function deleteRegion(label: string) {
    const updated = customRegions.filter(r => r.label !== label);
    setCustomRegions(updated);
    saveCustomRegions(updated);
  }

  function copyRegionSnippet() {
    navigator.clipboard.writeText(exportRegionSnippet()).then(() => {
      setRCopied(true);
      setTimeout(() => setRCopied(false), 2000);
    });
  }

  const inputCls = "w-full bg-muted/30 border border-border/40 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-violet-500/60 text-foreground placeholder:text-muted-foreground/40";
  const btnCls   = "px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors";

  return (
    <div className="mt-8 rounded-2xl border border-border/40 bg-card/50 overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/10 transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <div>
          <span className="text-sm font-bold">Carbon Depth — Data Manager</span>
          <span className="text-xs text-muted-foreground ml-3">
            Add GPUs · regions · export code snippet
          </span>
        </div>
        <span className="text-muted-foreground">{open ? "▾" : "▸"}</span>
      </button>

      {open && (
        <div className="px-5 pb-6 space-y-8">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Entries added here are saved in your browser (localStorage) and appear immediately in the
            Carbon Depth calculator dropdowns. They do not modify the source file.
            Use the <span className="font-semibold text-foreground/60">Export snippet</span> button
            to get the updated TypeScript constant — paste it into{" "}
            <span className="font-mono text-violet-400/70">src/data/carbonDepthData.ts</span> to make it permanent.
          </p>

          {/* ── GPU section ──────────────────────────────────────────────── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">GPU Presets</h3>
              <button
                onClick={copyGPUSnippet}
                className={`${btnCls} border-violet-500/30 bg-violet-500/10 text-violet-400 hover:bg-violet-500/20`}
              >
                {gpuCopied ? "✓ Copied!" : "Export snippet"}
              </button>
            </div>

            {/* Table — static + custom */}
            <div className="rounded-xl border border-border/30 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/30 bg-muted/20">
                    <th className="text-left px-3 py-2 font-semibold text-muted-foreground">GPU</th>
                    <th className="text-right px-3 py-2 font-semibold text-muted-foreground">TDP (W)</th>
                    <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Source</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(GPU_PRESETS).map(([name, tdp]) => (
                    <tr key={name} className="border-b border-border/20">
                      <td className="px-3 py-1.5 font-mono font-semibold">{name}</td>
                      <td className="px-3 py-1.5 text-right font-mono">{tdp}</td>
                      <td className="px-3 py-1.5 text-muted-foreground/60 italic text-[10px]">built-in</td>
                      <td className="px-3 py-1.5" />
                    </tr>
                  ))}
                  {customGPUs.map(g => (
                    <tr key={g.name} className="border-b border-border/20 bg-violet-500/5">
                      <td className="px-3 py-1.5 font-mono font-semibold text-violet-400">{g.name}</td>
                      <td className="px-3 py-1.5 text-right font-mono">{g.tdpWatts}</td>
                      <td className="px-3 py-1.5 text-muted-foreground/60 text-[10px]">{g.source}</td>
                      <td className="px-3 py-1.5 text-right">
                        <button
                          onClick={() => deleteGPU(g.name)}
                          className="text-[10px] text-rose-400/60 hover:text-rose-400 transition-colors"
                        >
                          remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add GPU form */}
            <div className="rounded-xl border border-border/30 bg-muted/5 p-4 space-y-3">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Add GPU</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  placeholder="GPU name  e.g. H200"
                  value={gpuName} onChange={e => setGpuName(e.target.value)}
                  className={inputCls}
                />
                <input
                  placeholder="TDP in watts  e.g. 700"
                  type="number" min={1}
                  value={gpuTdp} onChange={e => setGpuTdp(e.target.value)}
                  className={inputCls}
                />
                <input
                  placeholder="Source  e.g. NVIDIA datasheet 2024"
                  value={gpuSource} onChange={e => setGpuSource(e.target.value)}
                  className={inputCls}
                />
              </div>
              {gpuError && <p className="text-[10px] text-rose-400">{gpuError}</p>}
              <button
                onClick={addGPU}
                className={`${btnCls} border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20`}
              >
                + Add GPU
              </button>
            </div>
          </div>

          {/* ── Region section ────────────────────────────────────────────── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cloud Regions</h3>
              <button
                onClick={copyRegionSnippet}
                className={`${btnCls} border-violet-500/30 bg-violet-500/10 text-violet-400 hover:bg-violet-500/20`}
              >
                {rCopied ? "✓ Copied!" : "Export snippet"}
              </button>
            </div>

            {/* Table — static + custom */}
            <div className="rounded-xl border border-border/30 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/30 bg-muted/20">
                    <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Region</th>
                    <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Zone ID</th>
                    <th className="text-right px-3 py-2 font-semibold text-muted-foreground">gCO₂/kWh</th>
                    <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Source</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(REGION_ZONES).map(([label, zone]) => (
                    <tr key={label} className="border-b border-border/20">
                      <td className="px-3 py-1.5">{label}</td>
                      <td className="px-3 py-1.5 font-mono text-[10px]">{zone}</td>
                      <td className="px-3 py-1.5 text-right font-mono">{STATIC_INTENSITY[zone] ?? "—"}</td>
                      <td className="px-3 py-1.5 text-muted-foreground/60 italic text-[10px]">built-in</td>
                      <td className="px-3 py-1.5" />
                    </tr>
                  ))}
                  {customRegions.map(r => (
                    <tr key={r.label} className="border-b border-border/20 bg-violet-500/5">
                      <td className="px-3 py-1.5 text-violet-400">{r.label}</td>
                      <td className="px-3 py-1.5 font-mono text-[10px] text-violet-400/70">{r.zoneId}</td>
                      <td className="px-3 py-1.5 text-right font-mono">{r.intensityGCO2}</td>
                      <td className="px-3 py-1.5 text-muted-foreground/60 text-[10px]">{r.source}</td>
                      <td className="px-3 py-1.5 text-right">
                        <button
                          onClick={() => deleteRegion(r.label)}
                          className="text-[10px] text-rose-400/60 hover:text-rose-400 transition-colors"
                        >
                          remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add region form */}
            <div className="rounded-xl border border-border/30 bg-muted/5 p-4 space-y-3">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Add Region</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  placeholder="Region label  e.g. me-south-1 (Bahrain)"
                  value={rLabel} onChange={e => setRLabel(e.target.value)}
                  className={inputCls}
                />
                <input
                  placeholder="Electricity Maps zone ID  e.g. BH"
                  value={rZone} onChange={e => setRZone(e.target.value)}
                  className={inputCls}
                />
                <input
                  placeholder="Grid intensity  e.g. 504  (gCO₂/kWh)"
                  type="number" min={1}
                  value={rIntensity} onChange={e => setRIntensity(e.target.value)}
                  className={inputCls}
                />
                <input
                  placeholder="Source  e.g. Electricity Maps 2024"
                  value={rSource} onChange={e => setRSource(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div className="text-[10px] text-muted-foreground/50 leading-relaxed">
                Zone ID = the Electricity Maps identifier for this region (used for live API lookups).
                Find it at <span className="font-mono">electricitymaps.com/map</span> — hover a region to see its zone code.
              </div>
              {rError && <p className="text-[10px] text-rose-400">{rError}</p>}
              <button
                onClick={addRegion}
                className={`${btnCls} border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20`}
              >
                + Add Region
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const count = payload[0].value;
  return (
    <div style={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 6, padding: "4px 8px", fontSize: 10, lineHeight: 1.6 }}>
      <span style={{ fontWeight: 700, color: "hsl(var(--foreground))" }}>{count} visit{count !== 1 ? "s" : ""}</span>
      <span style={{ color: "hsl(var(--muted-foreground))", marginLeft: 4 }}>· {label}</span>
    </div>
  );
}

export default function Admin() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [newCount, setNewCount] = useState(0);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [hideSelfReferrals, setHideSelfReferrals] = useState(false);
  const [visitsPage, setVisitsPage] = useState(1);
  const [visitLogOpen, setVisitLogOpen] = useState(false);
  const PAGE_SIZE = 10;

  // Owner flag is set by PageGate on unlock — no auto-set here

  useEffect(() => {
    govDb
      .from("visit_logs")
      .select("*")
      .order("visited_at", { ascending: false })
      .limit(200)
      .then(({ data }) => {
        if (data) {
          setVisits(data as Visit[]);
          try {
            const last = parseInt(localStorage.getItem(LAST_SEEN_KEY) ?? "0", 10);
            const diff = data.length - last;
            const count = diff > 0 ? diff : 0;
            setNewCount(count);
            // Browser notification when new visitors detected
            if (count > 0 && "Notification" in window) {
              Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                  new Notification("preetibuilds", {
                    body: `${count} new visitor${count > 1 ? "s" : ""} since you last checked.`,
                    icon: "/favicon.ico",
                  });
                }
              });
            }
          } catch {}
        }
        setLoading(false);
      });
  }, []);

  function markSeen() {
    try { localStorage.setItem(LAST_SEEN_KEY, String(visits.length)); } catch {}
    setNewCount(0);
  }

  async function deleteVisit(id: string) {
    setDeleteError(null);
    const { error } = await govDb.from("visit_logs").delete().eq("id", id);
    if (error) {
      setDeleteError(`Delete failed: ${error.message} — check Supabase RLS policy for visit_logs DELETE.`);
      return;
    }
    setVisits(v => v.filter(x => x.id !== id));
  }

  async function deleteSelected(ids: string[]) {
    setDeleteError(null);
    const { error } = await govDb.from("visit_logs").delete().in("id", ids);
    if (error) {
      setDeleteError(`Delete failed: ${error.message} — check Supabase RLS policy for visit_logs DELETE.`);
      return;
    }
    setVisits(v => v.filter(x => !ids.includes(x.id)));
  }

  const SELF_DOMAINS = ["preetibuilds-33d6f6da.vercel.app", "preetibuilds.vercel.app"];
  const isSelfReferral = (v: Visit) =>
    SELF_DOMAINS.some(d => v.referrer?.includes(d));

  const pages = ["all", ...Array.from(new Set(visits.map(v => v.page))).sort()];
  const filtered = visits
    .filter(v => filter === "all" || v.page === filter)
    .filter(v => !hideSelfReferrals || !isSelfReferral(v));

  const pagedVisits = filtered.slice(0, visitsPage * PAGE_SIZE);
  const hasMore = filtered.length > visitsPage * PAGE_SIZE;

  const sourceCounts = visits.reduce<Record<string, number>>((acc, v) => {
    const s = parseSource(v.referrer);
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  // Convert a UTC ISO string to a local YYYY-MM-DD key (fixes off-by-one for IST and other UTC+ zones)
  const localDateKey = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  // 7-day visits chart data
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    return {
      date: label,
      visits: visits.filter(v => localDateKey(v.visited_at) === dateStr).length,
    };
  });

  const preview = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12, opacity: 0.5 }}>
      <span style={{ fontSize: 32 }}>🔒</span>
      <span style={{ fontSize: 13, fontFamily: "monospace", color: "hsl(var(--muted-foreground))" }}>Admin · Restricted</span>
    </div>
  );

  return (
    <PageGate pageId="admin" backTo="/" previewContent={preview}>
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border/40">
        <div className="max-w-full mx-auto px-6 py-3 flex items-center justify-between">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">← Back to Portfolio</Link>
          <div className="flex items-center gap-3">
            {newCount > 0 && (
              <button
                onClick={markSeen}
                className="flex items-center gap-1.5 text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors"
              >
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-bold">{newCount}</span>
                new · mark seen
              </button>
            )}
            <span className="text-[10px] font-mono text-primary/50">Admin · Visitor Log</span>
          </div>
        </div>
      </div>

      <div className="max-w-full mx-auto px-6 py-6">

        {/* Delete error */}
        {deleteError && (
          <div className="mb-4 rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs text-rose-500 flex items-start justify-between gap-3">
            <span>{deleteError}</span>
            <button onClick={() => setDeleteError(null)} className="shrink-0 text-rose-400 hover:text-rose-200">✕</button>
          </div>
        )}

        {/* ── Main grid: 3/4 backlog | 1/4 sidebar ─────────────────────────── */}
        <div className="grid grid-cols-4 items-start">

          {/* LEFT 3/4 — Project Backlog table */}
          <div className="col-span-3 pr-6">
            <BacklogViewer />
          </div>

          {/* RIGHT 1/4 — Analytics sidebar */}
          <div className="col-span-1 space-y-6 sticky top-16 self-start border-l border-border/60 pl-6">

            {/* Stats */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div>
                <p className="text-[10px] text-muted-foreground mb-0.5">Total visits</p>
                <p className="text-xl font-bold leading-none">{visits.length}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-0.5">Top source</p>
                <p className="text-sm font-bold leading-none">{Object.entries(sourceCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—"}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-0.5">Mobile</p>
                <p className="text-xl font-bold leading-none">{visits.filter(v => parseDevice(v.user_agent) === "Mobile").length}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-0.5">Pages</p>
                <p className="text-xl font-bold leading-none">{new Set(visits.map(v => v.page)).size}</p>
              </div>
            </div>

            {/* 7-day chart */}
            {visits.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold mb-2 text-muted-foreground uppercase tracking-wide">Last 7 days</p>
                <ResponsiveContainer width="100%" height={80}>
                  <BarChart data={chartData} barSize={14} margin={{ top: 0, right: 0, left: -32, bottom: 0 }}>
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }} />
                    <Bar dataKey="visits" radius={[3, 3, 0, 0]}>
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={entry.visits > 0 ? "hsl(var(--primary))" : "hsl(var(--muted))"} opacity={entry.visits > 0 ? 0.85 : 0.25} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Recent visits — compact */}
            <div>
              <p className="text-[10px] font-semibold mb-2 text-muted-foreground uppercase tracking-wide">Recent visits</p>
              {loading ? (
                <p className="text-[10px] text-muted-foreground/50">Loading…</p>
              ) : visits.length === 0 ? (
                <p className="text-[10px] text-muted-foreground/50">No visits yet.</p>
              ) : (
                <div className="space-y-1">
                  {visits.slice(0, 10).map(v => {
                    const pageName = PAGE_LABELS[v.page] ?? v.page;
                    const location = v.city ?? v.country ?? "—";
                    return (
                      <div key={v.id} className="flex items-center gap-1 text-[10px] min-w-0">
                        <span className="text-foreground/65 whitespace-nowrap shrink-0 font-mono">{timeAgo(v.visited_at)}</span>
                        <span className="text-muted-foreground/40 shrink-0">·</span>
                        <span className="font-medium text-foreground/85 truncate flex-1 min-w-0" title={pageName}>{pageName}</span>
                        <span className="text-muted-foreground/40 shrink-0">·</span>
                        <span className="text-foreground/60 whitespace-nowrap shrink-0">{location}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Access codes */}
            <div>
              <p className="text-[10px] font-semibold mb-2 text-muted-foreground uppercase tracking-wide">Access codes</p>
              <div className="space-y-1">
                {[
                  { page: "Master (all pages)", code: "PRL2026", master: true },
                  { page: "Research",           code: "RSC2026" },
                  { page: "Carbon Depth",       code: "CDX2026" },
                  { page: "AI Readiness",       code: "ARD2026" },
                  { page: "Fairness Auditor",   code: "FAR2026" },
                  { page: "Carbon-Fairness",    code: "CFR2026" },
                  { page: "Client Discovery",   code: "CLN2026" },
                  { page: "Sustainability Fwk", code: "SFW2026" },
                  { page: "AI Webinar",         code: "WBN2026" },
                  { page: "Privacy Auditor",    code: "PRI2026" },
                  { page: "LLM Safety Eval",    code: "SE1" },
                  { page: "Carbon Time Travel", code: "CTT2026" },
                  { page: "Melodic",            code: "MEL2026" },
                  { page: "Admin",              code: "ADM2026" },
                ].map(({ page, code, master }) => (
                  <div key={code} className="flex items-center justify-between gap-1">
                    <span className={`text-[10px] truncate ${master ? "text-blue-500 dark:text-blue-400 font-medium" : "text-muted-foreground"}`}>{page}</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(code)}
                      className={`font-mono text-[9px] px-1 py-0.5 rounded border transition-colors shrink-0 ${master ? "border-blue-500/30 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20" : "border-border/40 bg-muted/30 text-foreground hover:border-blue-500/30 hover:text-blue-500"}`}
                      title="Copy"
                    >{code}</button>
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-muted-foreground/30 mt-2">Click to copy</p>
            </div>

            {/* Carbon Data Manager */}
            <CarbonDataManager />

          </div>{/* end sidebar */}
        </div>{/* end grid */}

      </div>
    </div>
    </PageGate>
  );
}
