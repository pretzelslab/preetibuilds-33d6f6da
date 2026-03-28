import { motion } from "framer-motion";
import { Linkedin } from "lucide-react";

const CREDENTIALS = [
  "18+ years across B2B SaaS — HR tech, CRM, BI, and AI-driven platforms",
  "Product management, product launch, and technical program delivery across enterprise systems and cloud",
  "Commercial GTM launch across product strategy, partner ecosystems, and M&A scenarios",
];

const Hero = () => (
  <section className="flex items-start justify-center px-6 pt-28 pb-10">
    <div className="max-w-2xl w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <p className="font-mono text-xs text-muted-foreground mb-3 tracking-widest uppercase">
          Product · Program · GTM
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-5">
          <span className="text-gradient">Preethi Raghuveeran</span>
        </h1>
        <p className="text-base text-muted-foreground mb-5 leading-relaxed">
          SaaS platform and product operations leader.
        </p>
        <ul className="space-y-2 mb-8">
          {CREDENTIALS.map((c) => (
            <li key={c} className="flex gap-2.5 text-sm text-muted-foreground/80 leading-relaxed">
              <span className="text-primary shrink-0 mt-0.5">✦</span>
              <span>{c}</span>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-4 text-sm">
          <a
            href="https://www.linkedin.com/in/preetiraghuveer/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-primary hover:opacity-75 transition-opacity font-medium"
          >
            <Linkedin className="w-3.5 h-3.5" /> LinkedIn
          </a>
          <span className="text-muted-foreground/30">·</span>
          <a
            href="mailto:chinmayipriti@gmail.com"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            chinmayipriti@gmail.com
          </a>
        </div>
      </motion.div>
    </div>
  </section>
);

export default Hero;
