import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import type { Project } from "@/types/project";
import {
  SAFETY_ENGINEERING,
  RESEARCH_GOVERNANCE,
  PRODUCT_SYSTEMS,
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
      <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{subtitle}</p>
    )}
  </div>
);

const publications = [
  {
    domain: "Sustainable AI · Systems",
    domainCls: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    title: "Carbon-Aware Inference Router for LLM Systems (CAIR)",
    authors: "Raghuveeran, P.",
    year: "2026",
    doi: "10.5281/zenodo.19934621",
    href: "https://zenodo.org/records/19934621",
  },
  {
    domain: "AI Safety · Adversarial Robustness",
    domainCls: "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20",
    title: "Gendered Adversarial Robustness in LLMs — ZIDR Benchmark",
    authors: "Raghuveeran, P.",
    year: "2026",
    doi: "10.5281/zenodo.20208521",
    href: "https://zenodo.org/records/20208521",
  },
];

const PublicationsSection = () => (
  <>
    <div id="publications" className="scroll-mt-20" />
    <SectionHeader label="Publications & Preprints" subtitle="Two Zenodo preprints — peer-review pending. DOIs citable." />
    <div className="mb-10">
      {publications.map((pub, i) => (
        <motion.a
          key={pub.doi}
          href={pub.href}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.06 }}
          className="group block py-4 border-b border-border/50 last:border-0 no-underline"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 mb-1">
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${pub.domainCls}`}>
                  {pub.domain}
                </span>
              </div>
              <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors block mb-0.5">
                {pub.title}
              </span>
              <p className="text-xs text-muted-foreground font-mono">
                {pub.authors} · Zenodo {pub.year} · DOI: {pub.doi}
              </p>
            </div>
            <span className="text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-0.5">
              View →
            </span>
          </div>
        </motion.a>
      ))}
    </div>
  </>
);

const Projects = () => (
  <section id="projects" className="py-6 px-6 scroll-mt-20">
    <div className="max-w-7xl mx-auto">

      <div id="product-gtm" className="scroll-mt-20" />
      <SectionHeader
        label="Product & GTM Systems"
        subtitle="Founder-led product development, revenue intelligence, and GTM automation — built from 18+ years operating B2B SaaS, GTM, and CRM stacks."
      />
      <div className="mb-10">
        {PRODUCT_SYSTEMS.map((p, i) => <ProjectRow key={p.title} project={p} index={i} />)}
      </div>

      <div id="safety-engineering" className="scroll-mt-20" />
      <SectionHeader
        label="Safety Engineering"
        subtitle="LLM red-teaming, adversarial evaluation, and pre-deployment safety assurance — 40-case test suite across prompt injection, regulatory hallucination, suitability failures, data leakage, and RAG poisoning."
      />
      <div className="mb-10">
        {SAFETY_ENGINEERING.map((p, i) => <ProjectRow key={p.title} project={p} index={i} />)}
      </div>

      <div id="research-governance" className="scroll-mt-20" />
      <SectionHeader
        label="Research & Governance"
        subtitle="Original research and production systems — adversarial robustness benchmarks, statistical fairness audits, and carbon-aware inference routing. Two Zenodo preprints."
      />
      <div className="mb-10">
        {RESEARCH_GOVERNANCE.map((p, i) => <ProjectRow key={p.title} project={p} index={i} />)}
      </div>

      <PublicationsSection />

      {/* Research Lab link */}
      <div className="border border-border/50 rounded-xl px-5 py-4 bg-muted/30 mb-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground mb-1">
              More Work
            </p>
            <p className="text-xs text-foreground/70">
              10 additional tools — carbon calculators, sustainability frameworks, readiness assessments, and more.
            </p>
          </div>
          <Link
            to="/research-lab"
            className="shrink-0 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
          >
            Research Lab →
          </Link>
        </div>
      </div>

      {/* Building Now */}
      <div className="border border-border/50 rounded-xl px-5 py-4 bg-muted/30">
        <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground mb-3">
          Building Now
        </p>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {[
            "Larkline — agency revenue operations",
            "Agentic AI systems",
            "AI safety evaluation frameworks",
          ].map((item) => (
            <span key={item} className="flex items-center gap-1.5 text-xs text-foreground/70">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default Projects;
