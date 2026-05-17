import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import type { Project } from "@/types/project";
import {
  RESPONSIBLE_AI,
  SUSTAINABLE_AI,
  USE_CASES,
  SAFETY_ENGINEERING,
  PET_PROJECTS,
} from "@/data/projects";

const STATUS_BADGE: Record<string, { label: string; classes: string }> = {
  live:     { label: "Live",     classes: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  preview:  { label: "Preview",  classes: "bg-amber-500/10  text-amber-600  dark:text-amber-400  border-amber-500/20"  },
  building: { label: "Building", classes: "bg-blue-500/10   text-blue-600   dark:text-blue-400   border-blue-500/20"   },
  upcoming: { label: "Upcoming", classes: "bg-muted text-muted-foreground border-border"                                },
};

const ProjectRow = ({ project, index }: { project: Project; index: number }) => {
  const badge = project.status ? STATUS_BADGE[project.status] : null;

  const inner = (
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
        {(project.link || project.externalLink) && (
          <span className="text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-0.5">
            {project.status === "preview" ? "Preview →" : "View →"}
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

const DOMAIN_OVERVIEW = [
  {
    label: "Safety Engineering",
    count: SAFETY_ENGINEERING.length,
    desc: "Adversarial eval · red-teaming · pre-deployment assurance",
    cls: "border-violet-500/30 bg-violet-500/5 text-violet-400",
    anchor: "#safety-engineering",
  },
  {
    label: "Responsible AI",
    count: RESPONSIBLE_AI.length,
    desc: "Fairness audits · privacy impact · governance tooling",
    cls: "border-blue-500/30 bg-blue-500/5 text-blue-400",
    anchor: "#responsible-ai",
  },
  {
    label: "Sustainable AI",
    count: SUSTAINABLE_AI.length,
    desc: "Carbon accounting · disclosure frameworks · tradeoff analysis",
    cls: "border-emerald-500/30 bg-emerald-500/5 text-emerald-400",
    anchor: "#sustainable-ai",
  },
  {
    label: "GTM & Product",
    count: USE_CASES.length,
    desc: "AI-powered GTM · product pipelines · lean enterprise tooling",
    cls: "border-amber-500/30 bg-amber-500/5 text-amber-400",
    anchor: "#gtm-product",
  },
];

const Projects = () => (
  <section id="projects" className="py-6 px-6">
    <div className="max-w-7xl mx-auto">

      {/* Domain overview — scannable 3-column grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {DOMAIN_OVERVIEW.map(d => (
          <a key={d.label} href={d.anchor} className={`rounded-xl border p-3 ${d.cls} block no-underline hover:opacity-90 transition-opacity`}>
            <p className="text-[10px] font-mono font-semibold uppercase tracking-wider mb-1">{d.label}</p>
            <p className="text-xl font-bold text-foreground leading-none">{d.count}</p>
            <p className="text-[10px] text-muted-foreground mt-1.5 leading-relaxed">{d.desc}</p>
          </a>
        ))}
      </div>

      <div id="safety-engineering" className="scroll-mt-20" />
      <SectionHeader
        label="Safety Engineering"
        subtitle="LLM red-teaming, adversarial evaluation, and pre-deployment safety assurance — 40-case test suite across prompt injection, regulatory hallucination, suitability failures, data leakage, and RAG poisoning."
      />
      <div className="mb-10">
        {SAFETY_ENGINEERING.map((p, i) => <ProjectRow key={p.title} project={p} index={i} />)}
      </div>

      <div id="responsible-ai" className="scroll-mt-20" />
      <SectionHeader
        label="Responsible AI"
        subtitle="Statistical fairness audits, privacy impact assessment, agentic compliance pipelines, and governance tooling — built for EU AI Act, GDPR, MiFID II, and NIST AI RMF enforcement."
      />
      <div className="mb-10">
        {RESPONSIBLE_AI.map((p, i) => <ProjectRow key={p.title} project={p} index={i} />)}
      </div>

      <div id="sustainable-ai" className="scroll-mt-20" />
      <SectionHeader label="Sustainable AI" subtitle="Carbon footprint measurement, disclosure frameworks, and the carbon-fairness tradeoff — mapped to CSRD, EU GPAI Art.53, and ISSB S2." />
      <div className="mb-10">
        {SUSTAINABLE_AI.map((p, i) => <ProjectRow key={p.title} project={p} index={i} />)}
      </div>

      <div id="gtm-product" className="scroll-mt-20" />
      <SectionHeader label="GTM & Product Ops" subtitle="AI-powered systems built from 18+ years operating B2B SaaS, GTM, and CRM stacks — replacing expensive enterprise tooling with lean, instrumented pipelines." />
      <div className="mb-10">
        {USE_CASES.map((p, i) => <ProjectRow key={p.title} project={p} index={i} />)}
      </div>

      <SectionHeader label="Pet Projects" />
      <div>
        {PET_PROJECTS.map((p, i) => <ProjectRow key={p.title} project={p} index={i} />)}
      </div>
    </div>
  </section>
);

export default Projects;
