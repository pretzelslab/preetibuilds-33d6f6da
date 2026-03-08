import { motion } from "framer-motion";
import { Linkedin, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

const Hero = () => {
  return (
    <section className="relative flex items-center justify-center overflow-hidden px-6 pt-24 pb-10">
      {/* Ambient background shapes */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-[10%] w-72 h-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-20 right-[10%] w-96 h-96 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <p className="font-mono text-sm text-muted-foreground mb-4 tracking-widest uppercase">
            SaaS Platform & Product Operations Leader
          </p>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-[0.95] tracking-tight mb-6">
            <span className="text-gradient">Preethi Raghuveeran</span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-5xl mb-10 leading-relaxed tracking-wide">
            22+ years driving 0→1 launches and 1→N scaling across HR tech, CRM, BI, and AI platforms.<br />
            Currently leading enterprise AI &amp; SaaS commercialization.
          </p>
        </motion.div>

        <motion.div
          className="flex flex-wrap gap-4 items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <Button size="lg" className="rounded-full px-8 bg-primary text-primary-foreground hover:bg-primary/80 transition-colors duration-200">
            View My Work
          </Button>
          <div className="flex gap-3 ml-2">
            <a href="mailto:preeti.raghuveer@gmail.com" className="text-muted-foreground hover:text-foreground transition-colors">
              <Mail className="w-5 h-5" />
            </a>
            <a href="https://www.linkedin.com/in/preetiraghuveer/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
              <Linkedin className="w-5 h-5" />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
