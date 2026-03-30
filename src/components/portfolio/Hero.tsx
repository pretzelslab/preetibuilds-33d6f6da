import { motion } from "framer-motion";

const CREDENTIALS = [
  "18+ years across B2B SaaS — HR tech, CRM, BI, and AI-driven platforms",
  "Product management, product launch, and technical program delivery across enterprise systems and cloud",
  "Product general availability, business transformation, and strategic initiatives — commercial GTM, partner ecosystems, and M&A scenarios",
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
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-5">
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
      </motion.div>
    </div>
  </section>
);

export default Hero;
