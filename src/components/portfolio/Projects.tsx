import { motion } from "framer-motion";
import { Clock, Briefcase, ThumbsUp, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useState } from "react";

type ProjectCard = {
  title: string;
  description: string;
  tags: string[];
  applicationLayer?: string[];
  upcoming?: boolean;
  inProgress?: boolean;
  link?: string;
  externalLink?: string;
};

const businessAIUseCases: ProjectCard[] = [
  {
    title: "GTM Tech Stack",
    description: "A lean Python-powered GTM system replacing expensive enterprise tooling with one pipeline for lead capture, enrichment, scoring, nurture, CRM sync, and reporting.",
    tags: ["Python", "Pandas", "Faker", "Streamlit", "Plotly"],
    applicationLayer: ["Hunter.io API", "HubSpot CRM", "CSV Pipeline"],
    link: "/gtm-techstack",
  },
  {
    title: "Product Intelligence Pipeline",
    description: "Built an AI-powered pipeline integrating Salesforce Cases with Claude to surface product insights at scale. Focused on Fintech and Healthtech verticals. Stack: React, Python, Claude Sonnet API.",
    tags: ["AI", "Python", "Salesforce", "React"],
    inProgress: true,
  },
];

const aiEthicsGovernance: ProjectCard[] = [
  {
    title: "AI Ethics & Governance",
    description: "Framework for evaluating ethical AI deployment — bias detection, transparency reporting, and responsible governance.",
    tags: ["Python", "FastAPI", "OpenAI", "Redis"],
    upcoming: true,
  },
];

const ProjectTile = ({
  project,
  index,
  thumbs,
  onThumb,
}: {
  project: ProjectCard;
  index: number;
  thumbs: Record<string, number>;
  onThumb: (title: string) => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: index * 0.1 }}
    className="bg-muted/40 border border-border/50 rounded-xl p-5 hover:bg-muted/60 transition-colors flex flex-col"
  >
    <div className="flex items-center justify-between mb-2">
      <h4 className="text-sm font-semibold text-foreground">{project.title}</h4>
      {project.upcoming && (
        <span className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground bg-background/60 px-2 py-0.5 rounded-full">
          <Clock className="w-3 h-3" /> Upcoming
        </span>
      )}
      {project.inProgress && (
        <span className="flex items-center gap-1.5 text-[10px] font-medium text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded-full">
          <Clock className="w-3 h-3" /> In Progress
        </span>
      )}
    </div>
    <p className="text-foreground/70 text-xs leading-relaxed mb-3">{project.description}</p>
    <div className="flex flex-wrap gap-1.5 mb-2">
      {project.tags.map((tag) => (
        <Badge key={tag} variant="secondary" className="font-mono text-[10px] rounded-full px-2 py-0.5">
          {tag}
        </Badge>
      ))}
    </div>
    {project.applicationLayer && (
      <div className="flex flex-wrap gap-1.5 mb-3">
        {project.applicationLayer.map((tag) => (
          <Badge key={tag} variant="outline" className="font-mono text-[10px] rounded-full px-2 py-0.5 text-muted-foreground">
            {tag}
          </Badge>
        ))}
      </div>
    )}
    <div className="flex items-center justify-between mt-auto pt-2">
      <div className="flex items-center gap-3">
        {project.link && (
          <Link to={project.link} className="text-sm font-medium text-primary hover:underline">
            View Project →
          </Link>
        )}
        {project.externalLink && (
          <a href={project.externalLink} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline">
            GitHub ↗
          </a>
        )}
      </div>
      <button
        onClick={() => onThumb(project.title)}
        className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
      >
        <ThumbsUp className="w-4 h-4" />
        <span className="text-xs font-mono">{thumbs[project.title] || 0}</span>
      </button>
    </div>
  </motion.div>
);

const Projects = () => {
  const [thumbs, setThumbs] = useState<Record<string, number>>({});

  const handleThumb = (title: string) => {
    setThumbs((prev) => ({ ...prev, [title]: (prev[title] || 0) + 1 }));
  };

  return (
    <section id="projects" className="py-6 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            <span className="text-gradient">Portfolio</span>
          </h2>
          <p className="text-muted-foreground">
            A selection of projects I've worked on — from concept to deployment.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Business AI Solutions Column */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="bg-card rounded-2xl border overflow-hidden shadow-card h-full">
              <div className="bg-gradient-to-br from-primary/30 to-accent/30 px-6 py-5 flex items-center gap-3">
                <Briefcase className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Business AI Solutions</h3>
              </div>
              <div className="p-4 flex flex-col gap-4">
                {businessAIUseCases.map((useCase, i) => (
                  <ProjectTile key={useCase.title} project={useCase} index={i} thumbs={thumbs} onThumb={handleThumb} />
                ))}
              </div>
            </div>
          </motion.div>

          {/* AI Ethics & Governance Column */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <div className="bg-card rounded-2xl border overflow-hidden shadow-card h-full">
              <div className="bg-gradient-to-br from-primary/30 to-accent/30 px-6 py-5 flex items-center gap-3">
                <Shield className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">AI Ethics & Governance</h3>
              </div>
              <div className="p-4 flex flex-col gap-4">
                {aiEthicsGovernance.map((project, i) => (
                  <ProjectTile key={project.title} project={project} index={i} thumbs={thumbs} onThumb={handleThumb} />
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Projects;
