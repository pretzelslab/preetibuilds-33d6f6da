import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useVisitLogger } from "@/hooks/useVisitLogger";
import type { Project } from "@/types/project";
import {
  RESEARCH_VENTURES_VENTURE,
  RESEARCH_VENTURES_APPLIED,
  RESEARCH_LAB_SUSTAINABLE_AI,
  RESEARCH_LAB_FORESIGHT,
  RESEARCH_LAB_PERSONAL,
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
        {project.link && (
          <Link
            to={project.link}
            className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors shrink-0 mt-0.5 no-underline"
          >
            {project.locked ? "Preview →" : "View →"}
          </Link>
        )}
        {!project.link && project.externalLink && (
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
      <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed max-w-2xl">{subtitle}</p>
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

const ResearchLab = () => {
  useVisitLogger("/research-lab");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border/40">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            ← Back to Portfolio
          </Link>
          <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground/50">research & ventures</span>
        </div>
      </div>

      {/* Page header */}
      <div className="max-w-7xl mx-auto px-6 pt-12 pb-8">
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50 mb-2">
          Page 2
        </p>
        <h1 className="text-xl font-semibold tracking-tight text-foreground mb-2">Research & Ventures</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Research, venture building, emerging frameworks, sustainability systems, and long-horizon experimentation.
        </p>
      </div>

      {/* Venture Building */}
      <div id="venture-building" className="max-w-7xl mx-auto px-6 scroll-mt-20">
        <SectionHeader
          label="Venture Building"
          subtitle="Startup and venture projects — evolving commercial platforms built outside of client work."
        />
        <div className="mb-4">
          {RESEARCH_VENTURES_VENTURE.map((p, i) => <ProjectRow key={p.title} project={p} index={i} />)}
        </div>
      </div>

      <StripDivider />

      {/* Publications & Preprints */}
      <div id="publications" className="max-w-7xl mx-auto px-6 pt-4 scroll-mt-20">
        <SectionHeader
          label="Publications & Preprints"
          subtitle="Two Zenodo preprints — peer-review pending. DOIs citable."
        />
        <div className="mb-4">
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
      </div>

      <StripDivider />

      {/* Applied Research */}
      <div id="applied-research" className="max-w-7xl mx-auto px-6 pt-4 scroll-mt-20">
        <SectionHeader
          label="Applied Research"
          subtitle="Original AI safety and fairness research — adversarial robustness benchmarks, proxy discrimination under model compression, and falsifiable evaluation frameworks."
        />
        <div className="mb-4">
          {RESEARCH_VENTURES_APPLIED.map((p, i) => <ProjectRow key={p.title} project={p} index={i} />)}
        </div>
      </div>

      <StripDivider />

      {/* Sustainable AI */}
      <div id="sustainable-ai" className="max-w-7xl mx-auto px-6 pt-4 scroll-mt-20">
        <SectionHeader
          label="Sustainable AI"
          subtitle="Carbon-aware inference routing, measurement tools, disclosure frameworks, and the carbon-fairness efficiency tradeoff — mapped to CSRD, EU GPAI Art.53, and ISSB S2."
        />
        <div className="mb-4">
          {RESEARCH_LAB_SUSTAINABLE_AI.map((p, i) => <ProjectRow key={p.title} project={p} index={i} />)}
        </div>
      </div>

      <StripDivider />

      {/* Foresight & Society */}
      <div id="foresight-society" className="max-w-7xl mx-auto px-6 pt-4 scroll-mt-20">
        <SectionHeader
          label="Foresight & Society"
          subtitle="Evidence-tiered forecasting on how AI reshapes human capability — built to be provably wrong, with falsifiable indicators and policy levers."
        />
        <div className="mb-4">
          {RESEARCH_LAB_FORESIGHT.map((p, i) => <ProjectRow key={p.title} project={p} index={i} />)}
        </div>
      </div>

      <StripDivider />

      {/* Experimental Systems */}
      <div id="experimental-systems" className="max-w-7xl mx-auto px-6 pt-4 pb-12 scroll-mt-20">
        <SectionHeader
          label="Experimental Systems"
          subtitle="Personal projects, concept validations, and early-stage experiments."
        />
        <div className="mb-10">
          {RESEARCH_LAB_PERSONAL.map((p, i) => <ProjectRow key={p.title} project={p} index={i} />)}
        </div>
      </div>
    </div>
  );
};

export default ResearchLab;
