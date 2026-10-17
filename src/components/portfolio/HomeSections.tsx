import { useState } from "react";
import { Link } from "react-router-dom";
import {
  OUTCOMES,
  GOVERNANCE_TILES,
  ASSURANCE_TILES,
  HOW_I_WORK,
  EXPERIENCE,
  RESUME_URL,
  RESUME_AVAILABLE,
  type CaseCard,
  type HomeTile,
  type TileStatus,
} from "@/data/homeConfig";

const MAX_VISIBLE = 4;

const STATUS_BADGE: Record<TileStatus, { label: string; classes: string }> = {
  live:     { label: "Live",     classes: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  preview:  { label: "Preview",  classes: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  building: { label: "Building", classes: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
};

const SectionHeader = ({ label, subtitle }: { label: string; subtitle?: string }) => (
  <div className="mb-3">
    <span className="inline-block font-mono text-[10px] tracking-widest uppercase px-2.5 py-1 rounded bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-500/40 font-semibold">
      {label}
    </span>
    {subtitle && <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{subtitle}</p>}
  </div>
);

// Shows the first MAX_VISIBLE items; "View all" reveals the rest.
function Capped<T>({ items, render, id }: { items: T[]; render: (item: T) => React.ReactNode; id: string }) {
  const [open, setOpen] = useState(false);
  const shown = open ? items : items.slice(0, MAX_VISIBLE);
  return (
    <>
      <div id={`${id}-grid`} className="grid grid-cols-1 md:grid-cols-2 gap-3">{shown.map(render)}</div>
      {items.length > MAX_VISIBLE && (
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={`${id}-grid`}
          className="mt-3 text-xs font-mono text-muted-foreground hover:text-primary transition-colors"
        >
          {open ? "Show less" : `View all (${items.length}) →`}
        </button>
      )}
    </>
  );
}

// Single non-wrapping row; the parent card is a flex column so this sits at the bottom.
const TagRow = ({ tags }: { tags?: string[] }) =>
  tags && tags.length > 0 ? (
    <div className="mt-auto pt-3 flex flex-nowrap gap-1.5 overflow-hidden">
      {tags.slice(0, 3).map((tag) => (
        <span key={tag} className="shrink-0 whitespace-nowrap text-[10px] font-mono text-slate-600 dark:text-blue-300/70 bg-slate-500/10 dark:bg-blue-500/10 border border-slate-400/25 dark:border-blue-400/20 px-2 py-0.5 rounded">
          {tag}
        </span>
      ))}
    </div>
  ) : null;

// One tile format for every Home card: title + status badge, Who uses it, What it does, tags, View.
const TileView = ({ t }: { t: HomeTile }) => {
  const badge = STATUS_BADGE[t.status ?? "live"];
  return (
    <Link to={t.link} className="no-underline block">
      <div className="h-full flex flex-col rounded-xl border border-border/50 bg-card/40 p-4 hover:border-border/80 transition-colors">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-foreground">{t.title}</span>
          <span className={`shrink-0 text-[10px] font-mono px-2 py-0.5 rounded-full border ${badge.classes}`}>{badge.label}</span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground/80">Who uses it: </span>{t.who}
        </p>
        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground/80">What it does: </span>{t.does}
        </p>
        <TagRow tags={t.tags} />
        <span className="mt-3 text-xs text-primary">{t.status === "preview" ? "Preview →" : "View →"}</span>
      </div>
    </Link>
  );
};

// Career case cards (hidden until filled in) keep the Problem / What I did / Result layout.
const CareerCardView = ({ c }: { c: CaseCard }) => (
  <div className="h-full flex flex-col rounded-xl border border-border/50 bg-card/40 p-4">
    <div className="flex items-center justify-between gap-2 mb-2">
      <span className="text-sm font-semibold text-foreground">{c.title}</span>
      <span className="text-[10px] font-mono text-muted-foreground/60 shrink-0">Career case</span>
    </div>
    <dl className="space-y-1.5 text-xs text-muted-foreground leading-relaxed">
      <div><dt className="inline font-semibold text-foreground/80">Problem: </dt><dd className="inline">{c.problem}</dd></div>
      <div><dt className="inline font-semibold text-foreground/80">What I did: </dt><dd className="inline">{c.action}</dd></div>
      <div><dt className="inline font-semibold text-foreground/80">Result: </dt><dd className="inline">{c.result}</dd></div>
    </dl>
    <TagRow tags={c.tags} />
  </div>
);

const CaseCardView = ({ c }: { c: CaseCard }) =>
  c.kind === "career" || !c.link ? (
    <CareerCardView c={c} />
  ) : (
    <TileView t={{ title: c.title, who: c.who ?? "", does: c.does ?? "", link: c.link, tags: c.tags, status: c.status }} />
  );

const HomeSections = () => {
  const outcomes = OUTCOMES.filter((c) => c.visible);
  const governance = GOVERNANCE_TILES.filter((t) => t.visible !== false);
  const assurance = ASSURANCE_TILES.filter((t) => t.visible !== false);

  return (
    <div id="projects" className="scroll-mt-20">
      <section id="outcomes" className="px-6 pt-8 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <SectionHeader label="GTM & RevOps Work" subtitle="Systems I've built for revenue, product and customer teams." />
          <Capped id="outcomes" items={outcomes} render={(c) => <CaseCardView key={c.title + c.kind} c={c} />} />
        </div>
      </section>

      <section id="governance" className="px-6 pt-10 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <SectionHeader label="Applied AI governance" subtitle="Working tools for regulation tracking, privacy impact, readiness and compliance monitoring." />
          <Capped id="governance" items={governance} render={(t) => <TileView key={t.title} t={t} />} />
        </div>
      </section>

      <section id="assurance" className="px-6 pt-10 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <SectionHeader label="AI Risk & Assurance" subtitle="Pre-deployment testing for LLMs and agents, and a fairness audit case study." />
          <Capped id="assurance" items={assurance} render={(t) => <TileView key={t.title} t={t} />} />
        </div>
      </section>

      <section id="how-i-work" className="px-6 pt-10 pb-8 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <SectionHeader label="How I work" />
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {HOW_I_WORK.map((h) => (
              <li key={h.title} className="rounded-xl border border-border/50 bg-card/40 p-4">
                <span className="text-sm font-semibold text-foreground">{h.title}</span>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{h.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {(EXPERIENCE.length > 0 || RESUME_AVAILABLE) && (
        <section id="experience" className="px-6 pb-8 scroll-mt-20">
          <div className="max-w-7xl mx-auto">
            <SectionHeader label="Experience" />
            <ul className="space-y-3">
              {EXPERIENCE.map((e) => (
                <li key={e.role + e.org} className="text-xs text-muted-foreground leading-relaxed">
                  <span className="text-sm font-semibold text-foreground">{e.role}</span>, {e.org} ({e.years})
                  {e.summary && <p className="mt-0.5">{e.summary}</p>}
                </li>
              ))}
            </ul>
            {RESUME_AVAILABLE && (
              <a href={RESUME_URL} download className="mt-4 inline-block text-xs font-mono px-4 py-1.5 rounded-full border border-border hover:border-primary hover:text-primary transition-colors">
                Download resume (PDF) →
              </a>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default HomeSections;
