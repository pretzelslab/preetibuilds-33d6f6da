import { motion } from "framer-motion";
import { Clock, Briefcase } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import medlogPreview from "@/assets/medlog-preview.jpg";

const businessAIUseCases: Array<{
  title: string;
  description: string;
  tags: string[];
  applicationLayer?: string[];
  link?: string;
  externalLink?: string;
}> = [
  {
    title: "GTM Tech Stack",
    description: "A lean Python-powered GTM system replacing expensive enterprise tooling with one pipeline for lead capture, enrichment, scoring, nurture, CRM sync, and reporting.",
    tags: ["Python", "Pandas", "Faker", "Streamlit", "Plotly"],
    applicationLayer: ["Hunter.io API", "HubSpot CRM", "REST/JSON", "CSV Pipeline"],
    link: "/gtm-techstack",
  },
  {
    title: "AI Ethics & Governance",
    description: "Framework for evaluating ethical AI deployment — bias detection, transparency reporting, and responsible governance.",
    tags: ["Python", "FastAPI", "OpenAI", "Redis"],
  },
];

const petProjects = [
  {
    title: "Medlog",
    description: "A personal medical logging application for tracking health records and appointments.",
    tags: ["React", "TypeScript", "Supabase", "Tailwind"],
    link: "/medlog",
    preview: medlogPreview,
  },
];

const Projects = () => {
  return (
    <section id="projects" className="py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Featured <span className="text-gradient">Projects</span>
          </h2>
          <p className="text-muted-foreground max-w-lg">
            A selection of projects I've worked on — from concept to deployment.
          </p>
        </motion.div>

        {/* Business AI Solutions — parent header with sub-cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-6"
        >
          <div className="bg-card rounded-2xl border overflow-hidden shadow-card">
            <div className="bg-gradient-to-br from-primary/20 to-secondary/40 px-6 py-5 flex items-center gap-3">
              <Briefcase className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Business AI Solutions</h3>
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-background/60 px-3 py-1 rounded-full ml-auto">
                <Clock className="w-3 h-3" /> Upcoming
              </span>
            </div>
            <div className="p-4 grid sm:grid-cols-2 gap-4">
              {businessAIUseCases.map((useCase, i) => (
                <motion.div
                  key={useCase.title}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-muted/40 border border-border/50 rounded-xl p-5 hover:bg-muted/60 transition-colors"
                >
                  <h4 className="text-sm font-semibold mb-2">{useCase.title}</h4>
                  <p className="text-muted-foreground text-xs leading-relaxed mb-3">
                    {useCase.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {useCase.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="font-mono text-[10px] rounded-full px-2 py-0.5">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  {useCase.applicationLayer && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {useCase.applicationLayer.map((tag) => (
                        <Badge key={tag} variant="outline" className="font-mono text-[10px] rounded-full px-2 py-0.5 text-muted-foreground">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {useCase.link && (
                    <Link to={useCase.link} className="text-sm font-medium text-primary hover:underline mr-4">
                      View Project →
                    </Link>
                  )}
                  {useCase.externalLink && (
                    <a href={useCase.externalLink} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline">
                      GitHub ↗
                    </a>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Pet Projects — same parent header style */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-6"
        >
          <div className="bg-card rounded-2xl border overflow-hidden shadow-card">
            <div className="bg-gradient-to-br from-primary/30 to-accent/30 px-6 py-5 flex items-center gap-3">
              <span className="text-lg">🧪</span>
              <h3 className="text-lg font-semibold">Pet Projects</h3>
            </div>
            <div className="p-4 grid sm:grid-cols-2 gap-4">
              {petProjects.map((project, i) => (
                <motion.div
                  key={project.title}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-muted/40 border border-border/50 rounded-xl p-5 hover:bg-muted/60 transition-colors"
                >
                  {project.preview && (
                    <div className="relative w-full h-32 rounded-lg mb-3 overflow-hidden">
                      <img src={project.preview} alt={project.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                        <span className="text-[10px] font-mono text-foreground/30 rotate-[-20deg] whitespace-nowrap tracking-widest">
                          © MedLog · Copyrighted
                        </span>
                      </div>
                    </div>
                  )}
                  <h4 className="text-sm font-semibold mb-2">{project.title}</h4>
                  <p className="text-muted-foreground text-xs leading-relaxed mb-3">
                    {project.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {project.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="font-mono text-[10px] rounded-full px-2 py-0.5">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  {project.link && (
                    <Link to={project.link} className="text-sm font-medium text-primary hover:underline">
                      View Project →
                    </Link>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
export default Projects;
