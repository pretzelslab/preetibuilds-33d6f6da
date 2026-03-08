import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, TrendingUp, AlertTriangle, DollarSign, Users, Target, CheckCircle, XCircle, BarChart3, Zap, Database, Mail, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

const pipelineStages = [
  { label: "Lead Source", icon: Globe, desc: "Multi-channel inbound capture" },
  { label: "Enrichment", icon: Database, desc: "Auto-enrich with firmographic data" },
  { label: "Scoring", icon: Target, desc: "ML-based lead scoring model" },
  { label: "Routing", icon: Zap, desc: "Intelligent assignment rules" },
  { label: "Nurture", icon: Mail, desc: "Automated drip sequences" },
  { label: "Conversion", icon: TrendingUp, desc: "Pipeline to closed-won tracking" },
];

const metrics = [
  { label: "Total Leads", value: "200", color: "from-[hsl(215,80%,55%)] to-[hsl(215,70%,45%)]" },
  { label: "SQL", value: "93", color: "from-[hsl(165,50%,45%)] to-[hsl(165,40%,35%)]" },
  { label: "MQL", value: "97", color: "from-[hsl(250,50%,55%)] to-[hsl(250,40%,45%)]" },
  { label: "Disqualified", value: "10", color: "from-[hsl(0,60%,50%)] to-[hsl(0,50%,40%)]" },
  { label: "Pushed to HubSpot", value: "93", color: "from-[hsl(25,80%,55%)] to-[hsl(25,70%,45%)]" },
];

const enterpriseStack = [
  { category: "CRM", enterprise: "Salesforce ($150k/yr)", replacement: "HubSpot Free + Python Scripts" },
  { category: "Marketing Automation", enterprise: "Marketo ($60k/yr)", replacement: "Python + SendGrid ($20/mo)" },
  { category: "Data Enrichment", enterprise: "ZoomInfo ($25k/yr)", replacement: "Custom scraping + APIs" },
  { category: "Analytics", enterprise: "Tableau ($70k/yr)", replacement: "Python + Plotly/Streamlit" },
  { category: "Lead Scoring", enterprise: "6sense ($80k/yr)", replacement: "Scikit-learn ML model" },
  { category: "Orchestration", enterprise: "LeanData ($30k/yr)", replacement: "Python routing engine" },
];

const transferabilityTable = [
  { component: "Lead Scoring Model", industry: "Any B2B SaaS", adaptation: "Retrain on new ICP data", effort: "Low" },
  { component: "Pipeline ETL", industry: "Cross-industry", adaptation: "Swap data sources", effort: "Low" },
  { component: "Email Sequences", industry: "Any with nurture cycle", adaptation: "Update templates", effort: "Medium" },
  { component: "CRM Sync", industry: "Any CRM user", adaptation: "Map custom fields", effort: "Low" },
  { component: "Analytics Dashboard", industry: "Any revenue team", adaptation: "Adjust KPIs", effort: "Medium" },
];

const GTMTechStack = () => {
  return (
    <div className="min-h-screen bg-[hsl(220,20%,20%)] text-[hsl(215,20%,90%)]">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-[hsl(220,20%,20%)]/90 backdrop-blur-md border-b border-[hsl(215,18%,28%)]">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <Link to="/#projects" className="inline-flex items-center gap-2 text-sm text-[hsl(215,60%,65%)] hover:text-[hsl(215,70%,75%)] transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Portfolio
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12 space-y-16">
        {/* Title Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border border-[hsl(215,18%,30%)] bg-gradient-to-br from-[hsl(220,22%,24%)] to-[hsl(215,20%,28%)] p-8 sm:p-12"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-[hsl(215,80%,55%)]/5 rounded-full blur-3xl" />
          <div className="relative">
            <Badge className="mb-4 bg-[hsl(215,80%,55%)]/15 text-[hsl(215,70%,70%)] border-[hsl(215,50%,40%)] font-mono text-xs">
              Revenue Operations
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-3">
              Building an End-to-End{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[hsl(215,80%,60%)] to-[hsl(250,60%,65%)]">
                Go-to-Market Tech Stack
              </span>{" "}
              with Python
            </h1>
            <p className="text-[hsl(215,15%,55%)] max-w-2xl leading-relaxed">
              Replacing $400K+ in enterprise SaaS with a lean, Python-powered pipeline that captures, scores, nurtures, and converts leads at scale.
            </p>
          </div>
        </motion.div>

        {/* Problem Statement */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-6"
        >
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-[hsl(40,80%,55%)]" />
            The Problem
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { icon: DollarSign, title: "$415K+ Annual Spend", desc: "Enterprise tools with overlapping features and low utilization rates across the GTM stack." },
              { icon: Users, title: "47% Lead Leakage", desc: "Leads falling through cracks between disconnected systems with no unified tracking." },
              { icon: BarChart3, title: "14-Day Lag in Reporting", desc: "Manual data stitching across platforms created massive delays in pipeline visibility." },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-xl border border-[hsl(215,18%,30%)] bg-[hsl(220,20%,23%)] p-5"
              >
                <item.icon className="w-5 h-5 text-[hsl(40,80%,55%)] mb-3" />
                <h3 className="text-sm font-semibold mb-1">{item.title}</h3>
                <p className="text-xs text-[hsl(215,15%,50%)] leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Pipeline Architecture */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-6"
        >
          <h2 className="text-2xl font-bold">Pipeline Architecture</h2>
          <div className="rounded-xl border border-[hsl(215,18%,30%)] bg-[hsl(220,20%,23%)] p-6 overflow-x-auto">
            <div className="flex items-center gap-2 min-w-[700px]">
              {pipelineStages.map((stage, i) => (
                <div key={stage.label} className="flex items-center gap-2 flex-1">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex-1 rounded-lg border border-[hsl(215,18%,32%)] bg-gradient-to-b from-[hsl(215,18%,27%)] to-[hsl(220,18%,25%)] p-4 text-center"
                  >
                    <stage.icon className="w-5 h-5 mx-auto mb-2 text-[hsl(215,70%,60%)]" />
                    <p className="text-xs font-semibold mb-1">{stage.label}</p>
                    <p className="text-[10px] text-[hsl(215,15%,50%)]">{stage.desc}</p>
                  </motion.div>
                  {i < pipelineStages.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-[hsl(215,30%,35%)] flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Results Metrics */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-6"
        >
          <h2 className="text-2xl font-bold">Results</h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {metrics.map((m, i) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="rounded-xl border border-[hsl(215,18%,30%)] bg-[hsl(220,20%,23%)] p-5 text-center"
              >
                <p className={`text-2xl sm:text-3xl font-bold bg-gradient-to-b ${m.color} bg-clip-text text-transparent`}>
                  {m.value}
                </p>
                <p className="text-[10px] sm:text-xs text-[hsl(215,15%,50%)] mt-1 font-medium">{m.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Tech Stack Comparison */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-6"
        >
          <h2 className="text-2xl font-bold">Tech Stack Comparison</h2>
          <div className="rounded-xl border border-[hsl(215,18%,30%)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[hsl(215,22%,20%)]">
                    <th className="text-left p-4 text-xs font-semibold text-[hsl(215,15%,55%)] uppercase tracking-wider">Category</th>
                    <th className="text-left p-4 text-xs font-semibold text-[hsl(0,50%,60%)] uppercase tracking-wider flex items-center gap-2">
                      <XCircle className="w-3.5 h-3.5" /> Enterprise
                    </th>
                    <th className="text-left p-4 text-xs font-semibold text-[hsl(165,50%,50%)] uppercase tracking-wider">
                      <span className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5" /> Replacement</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {enterpriseStack.map((row, i) => (
                    <tr key={row.category} className={`border-t border-[hsl(215,20%,21%)] ${i % 2 === 0 ? "bg-[hsl(220,25%,16%)]" : "bg-[hsl(220,23%,17%)]"}`}>
                      <td className="p-4 font-medium text-xs">{row.category}</td>
                      <td className="p-4 text-xs text-[hsl(215,15%,50%)]">{row.enterprise}</td>
                      <td className="p-4 text-xs text-[hsl(165,40%,55%)]">{row.replacement}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.section>

        {/* Real-World Integration */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-6"
        >
          <h2 className="text-2xl font-bold">Real-World Integration</h2>
          <p className="text-sm text-[hsl(215,15%,55%)] max-w-2xl">
            Each component of the stack is designed for transferability — adaptable across industries and GTM motions with minimal rework.
          </p>
          <div className="rounded-xl border border-[hsl(215,20%,24%)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[hsl(215,22%,20%)]">
                    <th className="text-left p-4 text-xs font-semibold text-[hsl(215,15%,55%)] uppercase tracking-wider">Component</th>
                    <th className="text-left p-4 text-xs font-semibold text-[hsl(215,15%,55%)] uppercase tracking-wider">Industry Fit</th>
                    <th className="text-left p-4 text-xs font-semibold text-[hsl(215,15%,55%)] uppercase tracking-wider">Adaptation</th>
                    <th className="text-left p-4 text-xs font-semibold text-[hsl(215,15%,55%)] uppercase tracking-wider">Effort</th>
                  </tr>
                </thead>
                <tbody>
                  {transferabilityTable.map((row, i) => (
                    <tr key={row.component} className={`border-t border-[hsl(215,20%,21%)] ${i % 2 === 0 ? "bg-[hsl(220,25%,16%)]" : "bg-[hsl(220,23%,17%)]"}`}>
                      <td className="p-4 font-medium text-xs">{row.component}</td>
                      <td className="p-4 text-xs text-[hsl(215,15%,50%)]">{row.industry}</td>
                      <td className="p-4 text-xs text-[hsl(215,15%,50%)]">{row.adaptation}</td>
                      <td className="p-4">
                        <Badge className={`text-[10px] font-mono ${
                          row.effort === "Low"
                            ? "bg-[hsl(165,50%,45%)]/15 text-[hsl(165,50%,55%)] border-[hsl(165,40%,30%)]"
                            : "bg-[hsl(40,70%,50%)]/15 text-[hsl(40,70%,55%)] border-[hsl(40,50%,30%)]"
                        }`}>
                          {row.effort}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default GTMTechStack;
