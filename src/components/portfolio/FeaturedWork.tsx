import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const TEASER_TILES = [
  {
    domain: "Venture Building",
    domainCls: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    title: "Larkline",
    desc: "Revenue intelligence and execution platform for agencies — signal detection, opportunity scoring, relationship intelligence, and revenue operations.",
    href: "https://larkline.app",
    external: true,
  },
  {
    domain: "Publications",
    domainCls: "text-violet-400 bg-violet-500/10 border-violet-500/30",
    title: "Research Preprints",
    desc: "2 citable Zenodo preprints — Carbon-Aware Inference Router (CAIR) and Gendered Adversarial Robustness (ZIDR Benchmark).",
    href: "/research-lab",
    external: false,
  },
  {
    domain: "Applied Research",
    domainCls: "text-rose-400 bg-rose-500/10 border-rose-500/30",
    title: "Adversarial Robustness & Fairness",
    desc: "Original AI safety research — physical-proximity attack taxonomy, proxy discrimination under quantization, falsifiable indicators.",
    href: "/research-lab",
    external: false,
  },
  {
    domain: "Sustainable AI",
    domainCls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    title: "Carbon-Aware AI Systems",
    desc: "Carbon inference routing, footprint calculators, disclosure frameworks, and the carbon-fairness efficiency tradeoff — mapped to CSRD and EU GPAI Art.53.",
    href: "/research-lab",
    external: false,
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const FeaturedWork = () => (
  <section className="px-6 py-12 border-t border-border/40">
    <div className="max-w-7xl mx-auto">
      <div className="flex items-end justify-between mb-6 gap-4">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50 mb-1">
            Beyond the portfolio
          </p>
          <h2 className="text-base font-semibold text-foreground">Research & Ventures</h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-lg">
            Research, venture building, sustainability tooling, and long-horizon experimentation.
          </p>
        </div>
        <Link
          to="/research-lab"
          className="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
        >
          Explore all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-40px" }}
      >
        {TEASER_TILES.map((tile) => {
          const inner = (
            <motion.div
              key={tile.domain}
              variants={item}
              className="flex flex-col rounded-xl border border-border bg-card/50 p-5 hover:border-border/80 transition-colors h-full"
            >
              <span className={`self-start text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border mb-3 ${tile.domainCls}`}>
                {tile.domain}
              </span>
              <h3 className="font-semibold text-sm leading-snug mb-2 text-foreground">
                {tile.title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed flex-1">
                {tile.desc}
              </p>
            </motion.div>
          );

          return tile.external ? (
            <a key={tile.domain} href={tile.href} target="_blank" rel="noopener noreferrer" className="no-underline">
              {inner}
            </a>
          ) : (
            <Link key={tile.domain} to={tile.href} className="no-underline">
              {inner}
            </Link>
          );
        })}
      </motion.div>
    </div>
  </section>
);

export default FeaturedWork;
