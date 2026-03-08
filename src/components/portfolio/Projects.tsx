import { motion } from "framer-motion";
import { ExternalLink, Github, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import medlogPreview from "@/assets/medlog-preview.jpg";

const projects = [
  {
    title: "Business AI Solutions",
    description: "Real-world AI applications across business functions — from GTM tech stacks powering sales enablement and pipeline analytics, to revenue operations and customer lifecycle optimization.",
    tags: ["GTM Tech Stack", "Sales Enablement", "Pipeline Analytics", "Revenue Ops"],
    color: "from-primary/20 to-secondary/40",
    upcoming: true,
  },
  {
    title: "AI Ethics Framework",
    description: "A comprehensive framework for evaluating and ensuring ethical AI deployment across enterprise systems. Covers bias detection, transparency reporting, and responsible governance.",
    tags: ["Python", "FastAPI", "OpenAI", "Redis"],
    color: "from-accent to-accent/60",
    upcoming: true,
  },
  {
    title: "Pet Project #1 - Medlog",
    description: "A personal medical logging application for tracking health records and appointments.",
    tags: ["React", "TypeScript", "Supabase", "Tailwind"],
    color: "from-primary/30 to-accent/30",
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

        <div className="grid md:grid-cols-3 gap-6">
          {projects.map((project, i) => (
            <motion.div
              key={project.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="group relative bg-card rounded-2xl border overflow-hidden shadow-card hover:shadow-elegant transition-shadow duration-500 flex flex-col"
            >
              <div className={`bg-gradient-to-br ${project.color} h-48 flex items-center justify-center`}>
                {project.preview ? (
                  <img src={project.preview} alt={project.title} className="w-full h-full object-cover" />
                ) : (
                  <span className="font-mono text-primary-foreground/60 text-sm">// preview</span>
                )}
              </div>
              <div className="p-6 flex flex-col flex-1">
                <h3 className="text-lg font-semibold mb-2">{project.title}</h3>
                <p className="text-muted-foreground mb-4 text-sm leading-relaxed flex-1">
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="font-mono text-xs rounded-full">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-4 items-center">
                  {(project as any).upcoming && (
                    <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
                      <Clock className="w-3 h-3" /> Upcoming
                    </span>
                  )}
                  {(project as any).link && (
                    <Link to={(project as any).link} className="text-sm font-medium text-primary hover:underline">
                      View Project →
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
export default Projects;
