import { motion } from "framer-motion";
import { ExternalLink, Github } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const projects = [
  {
    title: "Cloud Infrastructure Dashboard",
    description: "Real-time monitoring platform for cloud services with alerting and analytics.",
    tags: ["React", "TypeScript", "AWS", "D3.js"],
    color: "from-primary to-primary/60",
  },
  {
    title: "AI Content Pipeline",
    description: "Automated content generation and curation system powered by machine learning.",
    tags: ["Python", "FastAPI", "OpenAI", "Redis"],
    color: "from-accent to-accent/60",
  },
  {
    title: "Pet Project #1 - Medlog",
    description: "A personal medical logging application for tracking health records and appointments.",
    tags: ["React", "TypeScript", "Supabase", "Tailwind"],
    color: "from-primary/80 to-accent/80",
  },
  {
    title: "E-Commerce Platform",
    description: "Full-stack marketplace with real-time inventory, payments, and analytics.",
    tags: ["Next.js", "Stripe", "PostgreSQL", "Tailwind"],
    color: "from-primary to-accent",
  },
];

const Projects = () => {
  return (
    <section id="projects" className="py-32 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Featured <span className="text-gradient">Projects</span>
          </h2>
          <p className="text-muted-foreground max-w-lg">
            A selection of projects I've worked on — from concept to deployment.
          </p>
        </motion.div>

        <div className="space-y-8">
          {projects.map((project, i) => (
            <motion.div
              key={project.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="group relative bg-card rounded-2xl border overflow-hidden shadow-card hover:shadow-elegant transition-shadow duration-500"
            >
              <div className="grid md:grid-cols-5 gap-0">
                <div className={`md:col-span-2 bg-gradient-to-br ${project.color} min-h-[200px] flex items-center justify-center`}>
                  <span className="font-mono text-primary-foreground/60 text-sm">// preview</span>
                </div>
                <div className="md:col-span-3 p-8 flex flex-col justify-center">
                  <h3 className="text-xl font-semibold mb-2">{project.title}</h3>
                  <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                    {project.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {project.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="font-mono text-xs rounded-full">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-4">
                    <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                      <Github className="w-4 h-4" />
                    </a>
                    <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
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
