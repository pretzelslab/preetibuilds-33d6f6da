import { Link } from "react-router-dom";

const PROOF_POINTS: { label: string; href: string; external?: boolean }[] = [
  { label: "2 Preprints · Zenodo",           href: "/research" },
  { label: "ACM FAccT Target",               href: "/research" },
  { label: "18+ Yrs GTM · Product · Enterprise", href: "#about" },
  { label: "OWASP · MITRE ATLAS",            href: "#safety-engineering" },
  { label: "EU AI Act · CSRD · GDPR",        href: "#responsible-ai" },
  { label: "6 Agentic Eval Systems",          href: "#safety-engineering" },
];

const CredibilityStrip = () => (
  <div className="border-y border-border/30 bg-muted/20 px-6 py-2.5">
    <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-x-1 gap-y-1">
      {PROOF_POINTS.map((point, i) => (
        <span key={point.label} className="flex items-center gap-1">
          <Link
            to={point.href}
            className="text-[11px] font-mono text-muted-foreground/70 hover:text-foreground transition-colors tracking-wide whitespace-nowrap"
          >
            {point.label}
          </Link>
          {i < PROOF_POINTS.length - 1 && (
            <span className="text-border/60 text-xs select-none px-2">·</span>
          )}
        </span>
      ))}
    </div>
  </div>
);

export default CredibilityStrip;
