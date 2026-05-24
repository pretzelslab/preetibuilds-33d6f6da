import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useVisitLogger } from "@/hooks/useVisitLogger";
import type { Project } from "@/types/project";
import {
  RESEARCH_LAB_RESPONSIBLE_AI,
  RESEARCH_LAB_SUSTAINABLE_AI,
  RESEARCH_LAB_PRODUCT,
  RESEARCH_LAB_PERSONAL,
} from "@/data/projects";

const STATUS_BADGE: Record<string, { label: string; classes: string }> = {
  live:      { label: "Live",      classes: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  preview:   { label: "Preview",   classes: "bg-amber-500/10  text-amber-600  dark:text-amber-400  border-amber-500/20"  },
  building:  { label: "Building",  classes: "bg-blue-500/10   text-blue-600   dark:text-blue-400   border-blue-500/20"   },
  upcoming:  { label: "Upcoming",  classes: "bg-muted text-muted-foreground border-border"                                },
  discovery: { label: "Discovery", classes: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20" },
};

const ProjectRow = ({ project, index }: { project: Project; index: number }) => {
  const badge = project.status ? STATUS_BADGE[project.status] : null;

  const inner = (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.04 }}
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
        {(project.link || project.externalLink) && (
          <span className="text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-0.5">
            {project.locked ? "Preview →" : "View →"}
          </span>
        )}
      </div>
    </motion.div>
  );

  if (project.link) {
    return <Link to={project.link} className="block no-underline">{inner}</Link>;
  }
  if (project.externalLink) {
    return <a href={project.externalLink} target="_blank" rel="noopener noreferrer" className="block no-underline">{inner}</a>;
  }
  return inner;
};

const SectionHeader = ({ label, subtitle }: { label: string; subtitle?: string }) => (
  <div className="mb-2 pt-2">
    <span className="inline-block font-mono text-[10px] tracking-widest uppercase px-2.5 py-1 rounded bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-500/40 font-semibold">
      {label}
    </span>
    {subtitle && (
      <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed max-w-2xl">{subtitle}</p>
    )}
  </div>
);

const ResearchLab = () => {
  useVisitLogger("/research-lab");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border/40">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            ← Back to Portfolio
          </Link>
          <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground/50">research lab</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-10">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50 mb-2">
            All Tools & Experiments
          </p>
          <h1 className="text-xl font-semibold tracking-tight text-foreground mb-2">Research Lab</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            The full body of work beyond the twelve flagship projects — carbon calculators, sustainability frameworks, readiness assessments, and personal tools. All live and accessible.
          </p>
        </div>

        <SectionHeader
          label="Responsible AI"
          subtitle="Adversarial robustness benchmarks, fairness audits, readiness diagnostics, and risk assessment tooling."
        />
        <div className="mb-10">
          {RESEARCH_LAB_RESPONSIBLE_AI.map((p, i) => <ProjectRow key={p.title} project={p} index={i} />)}
        </div>

        <SectionHeader
          label="Sustainable AI"
          subtitle="Carbon-aware inference routing, measurement tools, disclosure frameworks, and the carbon-fairness efficiency tradeoff — mapped to CSRD, EU GPAI Art.53, and ISSB S2."
        />
        <div className="mb-10">
          {RESEARCH_LAB_SUSTAINABLE_AI.map((p, i) => <ProjectRow key={p.title} project={p} index={i} />)}
        </div>

        <SectionHeader
          label="GTM & Product"
          subtitle="AI-powered product intelligence pipeline."
        />
        <div className="mb-10">
          {RESEARCH_LAB_PRODUCT.map((p, i) => <ProjectRow key={p.title} project={p} index={i} />)}
        </div>

        <SectionHeader
          label="Personal Projects"
        />
        <div className="mb-10">
          {RESEARCH_LAB_PERSONAL.map((p, i) => <ProjectRow key={p.title} project={p} index={i} />)}
        </div>
      </div>
    </div>
  );
};

export default ResearchLab;
