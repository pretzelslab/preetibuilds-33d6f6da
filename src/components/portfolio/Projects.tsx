import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import type { Project } from "@/types/project";
import {
  PRODUCT_INTELLIGENCE_SYSTEMS,
  ENTERPRISE_ASSESSMENT,
  GOVERNANCE_COMPLIANCE,
  SAFETY_EVALUATION,
} from "@/data/projects";
import CredibilityStrip from "@/components/portfolio/CredibilityStrip";

const STATUS_BADGE: Record<string, { label: string; classes: string }> = {
  live:      { label: "Live",      classes: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  preview:   { label: "Preview",   classes: "bg-amber-500/10  text-amber-600  dark:text-amber-400  border-amber-500/20"  },
  building:  { label: "Building",  classes: "bg-blue-500/10   text-blue-600   dark:text-blue-400   border-blue-500/20"   },
  upcoming:  { label: "Upcoming",  classes: "bg-muted text-muted-foreground border-border"                                },
  discovery: { label: "Discovery", classes: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20" },
};

const ProjectRow = ({ project, index }: { project: Project; index: number }) => {
  const badge = project.status ? STATUS_BADGE[project.status] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06 }}
      className="group py-4 border-b border-border/50 last:border-0"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-1">
            <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
              {project.title}
            </span>
            {badge && (
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${badge.classes}`}>
                {badge.label}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed mb-2">
            {project.description}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {project.tags.map((tag) => (
              <span key={tag} className="text-[10px] font-mono text-slate-500 dark:text-blue-300/60 bg-slate-500/8 dark:bg-blue-500/8 border border-slate-400/15 dark:border-blue-400/20 px-2 py-0.5 rounded">
                {tag}
              </span>
            ))}
            {project.industries?.map((ind) => (
              <span key={ind} className="text-[10px] font-mono text-amber-600/80 dark:text-amber-400/75 bg-amber-500/8 border border-amber-500/20 px-2 py-0.5 rounded">
                {ind}
              </span>
            ))}
          </div>
        </div>
        {project.link && (
          <Link
            to={project.link}
            className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors shrink-0 mt-0.5 no-underline"
          >
            {project.locked ? "Preview →" : "View →"}
          </Link>
        )}
        {project.externalLink && (
          <a
            href={project.externalLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors shrink-0 mt-0.5 no-underline"
          >
            View →
          </a>
        )}
      </div>
    </motion.div>
  );
};

const SectionHeader = ({ label, subtitle }: { label: string; subtitle?: string }) => (
  <div className="mb-2 pt-2">
    <span className="inline-block font-mono text-[10px] tracking-widest uppercase px-2.5 py-1 rounded bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-500/40 font-semibold">
      {label}
    </span>
    {subtitle && (
      <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{subtitle}</p>
    )}
  </div>
);

const StripDivider = () => (
  <div className="relative">
    <CredibilityStrip />
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-mono text-muted-foreground/50 hover:text-muted-foreground transition-colors"
    >
      ↑ top
    </button>
  </div>
);

const Projects = () => (
  <div id="projects" className="scroll-mt-20">

    {/* ── Product & Intelligence Systems ── */}
    <div className="px-6 pt-6">
      <div className="max-w-7xl mx-auto">
        <div id="product-intelligence" className="scroll-mt-20" />
        <SectionHeader
          label="Product & Intelligence Systems"
          subtitle="AI-native revenue systems — product intelligence, win/loss analysis, and GTM automation built from 18+ years of enterprise product and RevOps operating experience."
        />
        <div className="mb-4">
          {PRODUCT_INTELLIGENCE_SYSTEMS.map((p, i) => <ProjectRow key={p.title} project={p} index={i} />)}
        </div>
      </div>
    </div>

    <StripDivider />

    {/* ── Enterprise Assessment & Decision Systems ── */}
    <div className="px-6 pt-4">
      <div className="max-w-7xl mx-auto">
        <div id="enterprise-assessment" className="scroll-mt-20" />
        <SectionHeader
          label="Enterprise Assessment & Decision Systems"
          subtitle="Organizational readiness diagnostics, risk management frameworks, and bias evaluation tools for enterprise AI transformation programs."
        />
        <div className="mb-4">
          {ENTERPRISE_ASSESSMENT.map((p, i) => <ProjectRow key={p.title} project={p} index={i} />)}
        </div>
      </div>
    </div>

    <StripDivider />

    {/* ── Governance & Compliance ── */}
    <div className="px-6 pt-4">
      <div className="max-w-7xl mx-auto">
        <div id="governance-compliance" className="scroll-mt-20" />
        <SectionHeader
          label="Governance & Compliance"
          subtitle="Policy governance, privacy impact assessment, and agentic compliance pipelines — built for EU AI Act, GDPR, NIST AI RMF, and ISO 42001 enforcement."
        />
        <div className="mb-4">
          {GOVERNANCE_COMPLIANCE.map((p, i) => <ProjectRow key={p.title} project={p} index={i} />)}
        </div>
      </div>
    </div>

    <StripDivider />

    {/* ── Safety & Evaluation ── */}
    <div className="px-6 pt-4 pb-8">
      <div className="max-w-7xl mx-auto">
        <div id="safety-evaluation" className="scroll-mt-20" />
        <SectionHeader
          label="Safety & Evaluation"
          subtitle="LLM red-teaming, adversarial evaluation, and pre-deployment safety assurance — 40-case test suite across prompt injection, regulatory hallucination, suitability failures, data leakage, and RAG poisoning."
        />
        <div className="mb-4">
          {SAFETY_EVALUATION.map((p, i) => <ProjectRow key={p.title} project={p} index={i} />)}
        </div>
      </div>
    </div>

  </div>
);

export default Projects;
