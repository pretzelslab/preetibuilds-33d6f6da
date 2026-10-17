import { motion } from "framer-motion";
import { HERO, CORE_STRENGTHS, OPEN_TO, OPEN_TO_VISIBLE, RESUME_URL, RESUME_AVAILABLE } from "@/data/homeConfig";

const Hero = () => {
  return (
    <section id="hero" className="px-6 pt-24 pb-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-8 items-start">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
            <span className="text-gradient text-name-soft">{HERO.name}</span>
          </h1>
          <p className="text-base sm:text-lg text-foreground/80 mb-4 tracking-tight">{HERO.role}</p>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{HERO.sub}</p>

          <div className="flex flex-wrap gap-3 text-xs font-mono">
            <a href="#outcomes" className="px-4 py-1.5 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity no-underline">
              See my work
            </a>
            <a href="#contact" className="px-4 py-1.5 rounded-full border border-border hover:border-primary hover:text-primary transition-colors no-underline">
              Contact
            </a>
            {RESUME_AVAILABLE && (
              <a href={RESUME_URL} download className="px-4 py-1.5 rounded-full border border-border hover:border-primary hover:text-primary transition-colors no-underline">
                Resume
              </a>
            )}
          </div>
        </motion.div>

        <div className="flex flex-col gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="rounded-xl border border-border/50 bg-card/40 px-5 py-4"
          >
            <span className="block text-2xl font-bold text-foreground">{HERO.statCard.value}</span>
            <span className="block text-sm text-muted-foreground leading-relaxed">{HERO.statCard.label}</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="rounded-xl border border-border/50 bg-card/40 px-5 py-4"
          >
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-3">Core strengths</p>
            <ul className="flex flex-wrap gap-2">
              {CORE_STRENGTHS.map((t) => (
                <li key={t} className="text-xs text-foreground/80 bg-muted/40 border border-border/50 rounded-full px-3 py-1">{t}</li>
              ))}
            </ul>
          </motion.div>
          {OPEN_TO_VISIBLE && (
          <motion.aside
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            aria-label={OPEN_TO.heading}
            className="rounded-xl border border-border/50 bg-card/40 p-5"
          >
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-3">{OPEN_TO.heading}</p>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs font-semibold text-foreground/80">Roles</dt>
                <dd className="text-muted-foreground">{OPEN_TO.roles.join(" · ")}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-foreground/80">Location</dt>
                <dd className="text-muted-foreground">{OPEN_TO.location}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-foreground/80">Availability</dt>
                <dd className="text-muted-foreground">{OPEN_TO.availability}</dd>
              </div>
            </dl>
            <div className="mt-4 flex flex-wrap gap-3 text-xs font-mono">
              <a href={OPEN_TO.linkedin} target="_blank" rel="noopener noreferrer" className="px-4 py-1.5 rounded-full border border-border hover:border-primary hover:text-primary transition-colors no-underline">
                LinkedIn
              </a>
              {RESUME_AVAILABLE && (
                <a href={RESUME_URL} download className="px-4 py-1.5 rounded-full border border-border hover:border-primary hover:text-primary transition-colors no-underline">
                  Resume
                </a>
              )}
            </div>
          </motion.aside>
          )}
        </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
