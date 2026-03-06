import { motion } from "framer-motion";
import { Linkedin, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

const Hero = () => {
  return (
    <section className="relative flex items-center justify-center overflow-hidden px-6 pt-32 pb-16">
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
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-[0.95] tracking-tight mb-6">
            <span className="text-gradient">Preethi Raghuveeran</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mb-10 leading-relaxed">
            22+ years driving 0→1 launches and 1→N scaling across HR tech, CRM, BI, and AI platforms. 
            Currently leading enterprise AI & SaaS commercialization.
          </p>
        </motion.div>

        <motion.div
          className="flex flex-wrap gap-4 items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <Button size="lg" className="bg-gradient-primary text-primary-foreground hover:opacity-90 rounded-full px-8">
            View My Work
          </Button>
          <Button variant="outline" size="lg" className="rounded-full px-8">
            Get in Touch
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
