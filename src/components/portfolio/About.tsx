import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";

const FOCUS_ITEMS = [
  "AI-native product architecture and systems design",
  "Pre-deployment safety assurance for regulated AI",
  "Agentic systems governance and drift detection",
  "Gendered adversarial robustness benchmarking",
];

const expandVariants = {
  rest: { height: 0,      opacity: 0, marginTop: 0  },
  open: { height: "auto", opacity: 1, marginTop: 12 },
};

const Tile = ({
  label,
  count,
  open,
  onToggle,
  highlight,
  children,
}: {
  label: string;
  count?: number;
  open: boolean;
  onToggle: () => void;
  highlight?: boolean;
  children: React.ReactNode;
}) => (
  <motion.div
    animate={open ? "open" : "rest"}
    onClick={onToggle}
    className={`rounded-xl border px-4 py-3 cursor-pointer select-none transition-all duration-500 ${
      highlight
        ? "border-primary/70 bg-primary/8 shadow-md shadow-primary/15"
        : "border-border/50 bg-card/40 hover:border-border/80"
    }`}
  >
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
        {label}
      </span>
      {count !== undefined && (
        <span className="text-[10px] font-mono text-muted-foreground/50 tabular-nums">
          {count} →
        </span>
      )}
    </div>
    <motion.div
      variants={expandVariants}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="overflow-hidden"
    >
      {children}
    </motion.div>
  </motion.div>
);

const About = () => {
  const [aboutOpen, setAboutOpen]           = useState(false);
  const [aboutHighlight, setAboutHighlight] = useState(false);
  const [exploringOpen, setExploringOpen]   = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const openAbout = useCallback(() => {
    setAboutOpen(true);
    setAboutHighlight(true);
    const t = setTimeout(() => setAboutHighlight(false), 2500);
    return () => clearTimeout(t);
  }, []);

  // Collapse About when section scrolls fully out of view
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (!entry.isIntersecting) setAboutOpen(false); },
      { threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (window.location.hash === "#about") openAbout();

    const onHash = () => {
      if (window.location.hash === "#about") openAbout();
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [openAbout]);

  return (
    <section ref={sectionRef} id="about" className="py-8 px-6 border-t border-border/40">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          <Tile
            label="About"
            open={aboutOpen}
            onToggle={() => setAboutOpen((o) => !o)}
            highlight={aboutHighlight}
          >
            <p className="text-xs text-foreground/80 leading-relaxed mb-2">
              Works at the intersection of AI governance, product systems, and enterprise decisioning.
              Builds empirical AI safety tools — adversarial evaluation frameworks, fairness audits,
              carbon-aware routing infrastructure — and the governance pipelines that make responsible
              AI actionable at scale.
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Eighteen years designing operating models across B2B SaaS, GTM, CRM, and regulatory
              compliance environments. Currently focused on pre-deployment safety assurance, governance
              tooling for regulated sectors, and AI-native product architecture.
            </p>
          </Tile>

          <Tile
            label="Currently exploring"
            count={FOCUS_ITEMS.length}
            open={exploringOpen}
            onToggle={() => setExploringOpen((o) => !o)}
          >
            <ul className="space-y-2.5">
              {FOCUS_ITEMS.map((item) => (
                <li key={item} className="flex gap-2.5 text-xs text-muted-foreground/80 leading-relaxed">
                  <span className="text-primary/50 shrink-0 mt-0.5">✦</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Tile>

        </div>
      </div>
    </section>
  );
};

export default About;
