import { motion } from "framer-motion";
import { Link } from "react-router-dom";

type Project = {
  title: string;
  description: string;
  tags: string[];
  status?: "live" | "preview" | "building" | "upcoming";
  link?: string;
  externalLink?: string;
};

const USE_CASES: Project[] = [
  {
    title: "Product Intelligence Pipeline",
    description: "AI-powered pipeline integrating Salesforce Cases with Claude to surface product insights at scale. Fintech and Healthtech verticals.",
    tags: ["Python", "Claude API", "Salesforce", "React"],
    status: "live",
    link: "/product-intelligence",
  },
  {
    title: "GTM Tech Stack",
    description: "Lean Python-powered GTM system replacing expensive enterprise tooling — lead capture, enrichment, scoring, nurture, CRM sync, and reporting.",
    tags: ["Python", "Pandas", "Streamlit", "HubSpot"],
    status: "live",
    link: "/gtm-techstack",
  },
];

const AI_GOVERNANCE: Project[] = [
  {
    title: "AI Ethics & Governance Tracker",
    description: "On-demand policy tracker — EU AI Act, NIST AI RMF, ISO 42001, FAIR, AAIA — with clause-level detail, four-pillar framework, and client risk workbook. Private.",
    tags: ["React", "TypeScript", "Supabase"],
    status: "preview",
    link: "/ai-governance",
  },
  {
    title: "AI Risk Assessment",
    description: "5-phase client engagement tool — Govern, Map, Measure, Report, Monitor — with risk register, compliance deadlines, audit fields, and backup/restore. Private.",
    tags: ["React", "TypeScript", "Supabase"],
    status: "preview",
    link: "/client-discovery",
  },
];

const PET_PROJECTS: Project[] = [
  {
    title: "MedLog",
    description: "Family health event tracker with per-member login, symptom trends, AI analysis, and exportable health reports. Private.",
    tags: ["React", "Supabase", "TypeScript"],
    status: "preview",
    link: "/medlog",
  },
  {
    title: "Music → Art",
    description: "Upload a track or paste a link — reads the audio frequency signal and generates a generative painting. Pick your style: watercolour, oil, abstract.",
    tags: ["React", "Web Audio API", "Canvas"],
    status: "building",
  },
];

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
              <span key={tag} className="text-[10px] font-mono text-muted-foreground/60 bg-muted/40 px-2 py-0.5 rounded">
                {tag}
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

const SectionHeader = ({ label }: { label: string }) => (
  <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground/50 mb-1 pt-2">
    {label}
  </p>
);

const Projects = () => (
  <section id="projects" className="py-10 px-6">
    <div className="max-w-2xl mx-auto">
      <motion.h2
        className="text-2xl font-bold mb-8"
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <span className="text-gradient">Use Cases</span>
      </motion.h2>

      <SectionHeader label="GTM & Product Ops" />
      <div className="mb-8">
        {USE_CASES.map((p, i) => <ProjectRow key={p.title} project={p} index={i} />)}
      </div>

      <SectionHeader label="AI Governance & Tools" />
      <div className="mb-8">
        {AI_GOVERNANCE.map((p, i) => <ProjectRow key={p.title} project={p} index={i} />)}
      </div>

      <SectionHeader label="Pet Projects" />
      <div>
        {PET_PROJECTS.map((p, i) => <ProjectRow key={p.title} project={p} index={i} />)}
      </div>
    </div>
  </section>
);

export default Projects;
