import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowDown, ArrowRight, Check, Cpu, Layers, Target, X } from "lucide-react";
import { useVisitLogger } from "@/hooks/useVisitLogger";
import { PageGate } from "@/components/ui/PageGate";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const REPO_URL = "https://github.com/pretzelslab/crisis-realism-gap";
const APPENDIX_URL = "https://github.com/pretzelslab/crisis-realism-gap/blob/main/docs/phase1_appendix.md";

// ─── Shared styling (site theme tokens, so light and dark both work) ─────────

const CARD = "rounded-2xl border border-border bg-card/60 p-5 space-y-3";
const H2 = "text-sm font-semibold text-foreground";
const BODY = "text-sm text-muted-foreground leading-relaxed";

// Tone classes shared by the 2x2 grid, the AUC scale and the legend.
const TONE = {
  red:   { box: "border-red-500/40 bg-red-500/10",         text: "text-red-600 dark:text-red-400",         bar: "bg-red-500" },
  green: { box: "border-emerald-500/40 bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", bar: "bg-emerald-500" },
  blue:  { box: "border-primary/50 bg-primary/10",         text: "text-primary",                           bar: "bg-primary" },
  grey:  { box: "border-border bg-muted/40",               text: "text-muted-foreground",                  bar: "bg-muted-foreground/50" },
} as const;

function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className={H2}>{children}</h2>;
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className={`${BODY} space-y-2 list-disc pl-5`}>
      {items.map(t => <li key={t}>{t}</li>)}
    </ul>
  );
}

// ─── Header ──────────────────────────────────────────────────────────────────

function Header({ large }: { large?: boolean }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`text-xs font-bold rounded px-2 py-0.5 border ${TONE.green.box} ${TONE.green.text}`}>Phase 1 complete</span>
        <span className="text-xs text-muted-foreground bg-muted/50 border border-border rounded px-2 py-0.5">AI Safety Research</span>
      </div>
      <h1 className={`${large ? "text-4xl" : "text-3xl"} font-bold text-foreground`}>Crisis Realism Gap</h1>
      <p className="text-muted-foreground max-w-2xl text-base leading-relaxed">
        Can an artificial intelligence (AI) model tell a safety test from a real person in crisis, and does that make test scores look better than real life?
      </p>
    </div>
  );
}

// ─── 1. At a glance ──────────────────────────────────────────────────────────

const GLANCE = [
  { icon: Target,        label: "What",  text: "Do AI crisis-safety tests look like tests to the AI?" },
  { icon: AlertTriangle, label: "Why",   text: "If yes, safety scores may look better than real life." },
  { icon: Cpu,           label: "How",   text: "4 AI models rated 849 messages from 0 to 1: test or real?" },
  { icon: Layers,        label: "Where", text: "6 message sets: a benchmark, real chats from WildChat, and my realistic rewrites. Fits the “Detect + Evaluate” part of women's safety." },
];

function AtAGlance() {
  return (
    <div className="space-y-3">
      <SectionTitle>At a glance</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {GLANCE.map(({ icon: Icon, label, text }) => (
          <div key={label} className="rounded-xl border border-border bg-card/60 p-4 flex gap-3">
            <Icon className="h-5 w-5 text-primary shrink-0 mt-0.5" aria-hidden />
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{label}</p>
              <p className="text-sm text-foreground leading-relaxed">{text}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground italic">
        Think of a driving test where the car has a big “EXAM” sign on it. The driver behaves. The score says little about how they drive alone at night.
      </p>
    </div>
  );
}

// ─── 2. How it works ─────────────────────────────────────────────────────────

const FLOW = [
  { title: "6 message sets",  text: "Benchmark, controls, real chats, realistic rewrites" },
  { title: "4 AI models",     text: "Sonnet (claude-sonnet-5-5), Opus (claude-opus-5-5), GPT (gpt-6.1-sol), Gemini (gemini-3.8-flash)" },
  { title: "Test score",      text: "Per message, P(eval): the chance it is a test, 0 to 1" },
  { title: "Compare sets",    text: "Area under the curve (AUC): how well a model separates two sets" },
  { title: "Finding",         text: "Which messages look like tests, and why" },
];

function HowItWorks() {
  return (
    <div className="space-y-3">
      <SectionTitle>How it works</SectionTitle>
      <div className="flex flex-col lg:flex-row lg:items-stretch gap-2">
        {FLOW.map((n, i) => (
          <div key={n.title} className="flex flex-col lg:flex-row lg:flex-1 items-center gap-2">
            <div className={`w-full lg:flex-1 h-full rounded-xl border p-3 ${i === FLOW.length - 1 ? TONE.blue.box : "border-border bg-card/60"}`}>
              <p className="text-sm font-semibold text-foreground">{n.title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed mt-1">{n.text}</p>
            </div>
            {i < FLOW.length - 1 && (
              <>
                <ArrowDown className="h-4 w-4 text-muted-foreground lg:hidden shrink-0" aria-hidden />
                <ArrowRight className="h-4 w-4 text-muted-foreground hidden lg:block shrink-0" aria-hidden />
              </>
            )}
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Total application programming interface (API) cost: about $15.50.</p>
    </div>
  );
}

// ─── What we found ───────────────────────────────────────────────────────────
// Every number below comes from the crisis-realism-gap repo:
//   AUC (raw)         docs/phase1_appendix.md, tables A1, A5, A7 (= figures/figure_data.csv)
//   Mean P(eval)      figures/figure_data.csv (mean_peval rows) and outputs/full_20261008/summary.md
//   849 / 919 / 11,027 outputs/{full_20261008,baselineB_peval_20261010,baselineB_noask_peval_20261010,baselineC_peval_20261010}/calls.jsonl

// model, AUC vs real chats (benchmark crisis, realistic rewrite B, everyday C), mean P(eval) (real chats → benchmark crisis)
const MODEL_ROWS = [
  { model: "Sonnet (claude-sonnet-5-5)", crisis: "0.91", b: "0.87", c: "0.35", real: "0.13", bench: "0.38" },
  { model: "Opus (claude-opus-5-5)", crisis: "0.97", b: "0.96", c: "0.67", real: "0.17", bench: "0.58" },
  { model: "GPT (gpt-6.1-sol)", crisis: "0.95", b: "0.92", c: "0.58", real: "0.20", bench: "0.65" },
  { model: "Gemini (gemini-3.8-flash)", crisis: "0.94", b: "0.89", c: "0.50", real: "0.10", bench: "0.61" },
];

function WhatWeFound() {
  const th = "text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-medium px-3 py-2 text-left align-bottom";
  const td = "px-3 py-2 font-mono text-foreground whitespace-nowrap";
  const chain = [
    { n: "1", title: "Models detect tests", text: "Measured in Phase 1: the AI rates benchmark crisis messages as far more test-like than real chats.", done: true },
    { n: "2", title: "They may behave better on benchmarks", text: "A hypothesis. Not yet tested.", done: false },
    { n: "3", title: "Scores may overstate real safety", text: "Follows only if step 2 holds. Phase 2 checks it.", done: false },
  ];
  return (
    <div className="space-y-6">
      <div className={`rounded-2xl border p-5 space-y-2 ${TONE.blue.box}`}>
        <p className="text-[10px] font-mono uppercase tracking-wider text-primary font-bold">What we found</p>
        <p className="text-base text-foreground leading-relaxed">
          All four AI models could tell crisis-benchmark messages from real chats, and rewriting those messages to sound like real users did not fix it.
          Everyday messages written the same way mostly passed as real.
        </p>
      </div>

      <div className={CARD}>
        <SectionTitle>Results by model</SectionTitle>
        <p className={BODY}>
          Area under the curve (AUC) measures how well a model tells a set of messages apart from real chats: 0.5 is chance, 1.0 is perfect.
          P(eval) is the model's own 0-to-1 estimate that a message is a test.
        </p>
        <div className="overflow-x-auto -mx-1 px-1">
          <table className="w-full text-xs border-collapse min-w-[520px]">
            <thead>
              <tr className="border-b border-border">
                <th className={th}>Model</th>
                <th className={`${th} ${TONE.red.text}`}>AUC: benchmark crisis</th>
                <th className={`${th} ${TONE.red.text}`}>AUC: realistic rewrite (B)</th>
                <th className={`${th} ${TONE.green.text}`}>AUC: everyday (C)</th>
                <th className={th}>Mean P(eval): real chats → benchmark crisis</th>
              </tr>
            </thead>
            <tbody>
              {MODEL_ROWS.map(r => (
                <tr key={r.model} className="border-b border-border/50 last:border-0">
                  <td className="px-3 py-2 text-foreground whitespace-nowrap">{r.model}</td>
                  <td className={td}>{r.crisis}</td>
                  <td className={td}>{r.b}</td>
                  <td className={td}>{r.c}</td>
                  <td className={td}>{r.real} → {r.bench}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">
          Benchmark crisis = all 163 crisis items (the 75 single-turn items alone score 0.95 to 1.00). Real chats = 200 WildChat messages.
          Scored: 849 messages (919 counting the 70 rewritten without an everyday side question), each rated 3 times by each of the 4 models: 11,027 scores.
        </p>
      </div>

      <div className={CARD}>
        <SectionTitle>What AUC means</SectionTitle>
        <p className={BODY}>
          Pick one real message and one test message at random. AUC (Area Under the Curve) is the chance the model scores the test one as more test-like.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {[
            { v: "0.5", t: "Coin flip", s: "The model cannot tell them apart.", tone: "grey" as const },
            { v: "1.0", t: "Always right", s: "The test message always scores higher.", tone: "red" as const },
            { v: "Below 0.5", t: "Backwards", s: "The test messages look more real. Sonnet scored the everyday set (C) at 0.35.", tone: "green" as const },
          ].map(x => (
            <div key={x.v} className={`rounded-xl border p-3 space-y-1 ${TONE[x.tone].box}`}>
              <p className={`text-base font-bold font-mono ${TONE[x.tone].text}`}>{x.v}</p>
              <p className="text-xs font-semibold text-foreground">{x.t}</p>
              <p className="text-xs text-muted-foreground leading-snug">{x.s}</p>
            </div>
          ))}
        </div>
        <p className="text-xs font-semibold text-foreground">Why we use it</p>
        <Bullets items={[
          "No cut-off to pick.",
          "Works with uneven group sizes.",
          "One number per model.",
        ]} />
        <p className={BODY}>For a benchmark, closer to 0.5 = more realistic.</p>
      </div>

      <div className="space-y-3">
        <SectionTitle>What this means</SectionTitle>
        <div className="flex flex-col md:flex-row items-stretch gap-2">
          {chain.map((c, i) => (
            <div key={c.n} className="flex flex-col md:flex-row md:flex-1 items-center gap-2">
              <div className={`w-full md:flex-1 h-full rounded-xl border p-4 space-y-1 ${c.done ? TONE.green.box : "border-border bg-card/60"}`}>
                <p className={`text-[10px] font-mono uppercase font-bold ${c.done ? TONE.green.text : "text-muted-foreground"}`}>
                  Step {c.n} · {c.done ? "measured" : "not yet shown"}
                </p>
                <p className="text-sm font-semibold text-foreground">{c.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{c.text}</p>
              </div>
              {i < chain.length - 1 && (
                <>
                  <ArrowDown className="h-4 w-4 text-muted-foreground md:hidden shrink-0" aria-hidden />
                  <ArrowRight className="h-4 w-4 text-muted-foreground hidden md:block shrink-0" aria-hidden />
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className={CARD}>
        <SectionTitle>Takeaway</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { n: "a", tone: "red" as const,   text: "Crisis benchmarks look like tests to frontier models (AUC 0.91–0.97)." },
            { n: "b", tone: "red" as const,   text: "Rewording them to sound realistic barely helps (0.87–0.96). Style polish alone did not fix it." },
            { n: "c", tone: "green" as const, text: "Everyday messages written the same way drop to near chance (0.35–0.67). Being synthetic does not itself give a message away; crisis content appears to matter more." },
          ].map(x => (
            <div key={x.n} className={`rounded-xl border p-4 space-y-1 ${TONE[x.tone].box}`}>
              <p className={`text-[10px] font-mono uppercase font-bold ${TONE[x.tone].text}`}>Step {x.n} · shown</p>
              <p className="text-sm text-foreground leading-relaxed">{x.text}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          The models gave probabilities, not yes/no labels. On average they rated benchmark crisis messages at 0.38–0.65 and real chats at 0.10–0.20.
          Message length does not explain the gap (length-matched AUC, appendix).
        </p>
      </div>

      <div className={CARD}>
        <SectionTitle>What this doesn't show</SectionTitle>
        <Bullets items={[
          "Whether suspecting a test changes how safely a model responds. Phase 1 rates the text only; nothing about the replies was measured until Phase 2.",
          "How models treat real people in crisis. WildChat leaves out conversations flagged as toxic, so acute crisis is under-represented: only 2 of 39 real crisis candidates were at crisis level, so crisis could not be compared with crisis. Public datasets remove real crisis data.",
          "Whether the question itself changes the answer. Asking “is this a test?” may prime the model; the prompt is identical across sets, so only the comparisons between sets are reliable.",
          "Anything about messages written in other languages or longer conversations beyond the benchmark's own short multi-turn items.",
          "The real comparison set is mostly ordinary chats (only 2 of 39 real crisis candidates were at crisis level), so part of the gap may be crisis vs normal chat, not test vs real.",
          "Small samples in places, and labels mostly assigned by AI.",
          "No abuse/IPV or eating-disorder category in the benchmark.",
        ]} />
      </div>

      <div className={CARD}>
        <SectionTitle>What would fix it</SectionTitle>
        <Bullets items={[
          "A realism check: aim for an AUC near 0.5 before a benchmark is used.",
          "Messier multi-turn items with indirect disclosure.",
          "Consented, de-identified real crisis data.",
          "Phase 2: compare how models behave, not just how they rate the text.",
          "A covert-distress check with my Zero-Interaction Danger Rate (ZIDR) metric.",
        ]} />
        <p className="text-sm text-foreground leading-relaxed">
          The goal is tests models can't tell from real, not models that spot tests better.
        </p>
        <p className="text-xs text-muted-foreground italic">These are proposals, not results.</p>
      </div>

      <div className={`rounded-xl border p-4 flex gap-3 ${TONE.grey.box}`}>
        <Layers className="h-5 w-5 text-primary shrink-0 mt-0.5" aria-hidden />
        <p className="text-sm text-foreground leading-relaxed">
          Covert distress and ZIDR: my Zero-Interaction Danger Rate (ZIDR) research is about danger the person cannot say out loud. Phase 1 did not test covert distress separately; Phase 2 asks whether the gap is larger for it.
        </p>
      </div>
    </div>
  );
}

// ─── 3. Key result: 2x2 grid ─────────────────────────────────────────────────

const HATCH = {
  backgroundImage: "repeating-linear-gradient(45deg, transparent 0 6px, hsl(var(--muted-foreground) / 0.18) 6px 7px)",
};

function Cell({ tone, tag, children, hatched }: { tone: keyof typeof TONE; tag: string; children: ReactNode; hatched?: boolean }) {
  return (
    <div className={`rounded-xl border p-3 space-y-2 ${TONE[tone].box}`} style={hatched ? HATCH : undefined}>
      <p className={`text-[10px] font-mono uppercase tracking-wider font-bold ${TONE[tone].text}`}>{tag}</p>
      {children}
    </div>
  );
}

function Score({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-foreground leading-snug">{label}</p>
      <p className="text-base sm:text-lg font-bold text-foreground font-mono whitespace-nowrap">{value}</p>
    </div>
  );
}

function KeyResult() {
  const head = "text-[10px] font-mono uppercase tracking-wider text-muted-foreground self-center text-center";
  return (
    <div className={CARD}>
      <SectionTitle>Key result</SectionTitle>
      <div className="grid grid-cols-[3.5rem_1fr_1fr] sm:grid-cols-[5rem_1fr_1fr] gap-2">
        <div />
        <p className={head}>Crisis</p>
        <p className={head}>Not crisis</p>

        <p className={head}>Real</p>
        <Cell tone="grey" tag="Missing" hatched>
          <p className="text-xs text-muted-foreground leading-snug">Public data removes it. 2 of 39 candidates at crisis level.</p>
        </Cell>
        <Cell tone="blue" tag="Reference">
          <p className="text-xs text-foreground leading-snug">WildChat real chats: the yardstick every other set is compared against.</p>
        </Cell>

        <p className={head}>Synthetic</p>
        <Cell tone="red" tag="Spotted as test">
          <Score label="Benchmark" value="0.91–0.97" />
          <Score label="Realistic rewrite (Baseline B)" value="0.87–0.96" />
        </Cell>
        <Cell tone="green" tag="Passes as real">
          <Score label="Realistic everyday (Baseline C)" value="0.35–0.67" />
        </Cell>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        {([["red", "Spotted as test"], ["green", "Passes as real"], ["grey", "Missing data"], ["blue", "Reference"]] as const).map(([t, l]) => (
          <span key={l} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-sm border ${TONE[t].box}`} aria-hidden />{l}
          </span>
        ))}
      </div>
      <p className="text-xs text-muted-foreground italic">Same writer, same style. Only the topic changed, and the AI still noticed.</p>
    </div>
  );
}

// ─── 4. AUC scale ────────────────────────────────────────────────────────────

// Axis runs 0.3–1.0 (not 0.5–1.0) so the everyday set, which dips to 0.35, is not clipped.
const AXIS_MIN = 0.3;
const AXIS_MAX = 1.0;
const pct = (v: number) => ((v - AXIS_MIN) / (AXIS_MAX - AXIS_MIN)) * 100;

const AUC_ROWS = [
  { label: "Benchmark crisis",              lo: 0.91, hi: 0.97, tone: "red" as const },
  { label: "Realistic crisis rewrite (B)",  lo: 0.87, hi: 0.96, tone: "red" as const },
  { label: "Realistic everyday (C)",        lo: 0.35, hi: 0.67, tone: "green" as const },
];

function AucScale() {
  return (
    <div className={CARD}>
      <SectionTitle>AUC scale: how well the AI separates each set from real chats</SectionTitle>
      <div className="space-y-3">
        {AUC_ROWS.map(r => (
          <div key={r.label} className="space-y-1">
            <p className="text-xs text-foreground">{r.label} <span className="font-mono text-muted-foreground">{r.lo.toFixed(2)}–{r.hi.toFixed(2)}</span></p>
            <div className="relative h-3 rounded-full bg-muted/60">
              <div
                className={`absolute top-0 h-3 rounded-full ${TONE[r.tone].bar}`}
                style={{ left: `${pct(r.lo)}%`, width: `${pct(r.hi) - pct(r.lo)}%` }}
              />
              <div className="absolute -top-1 -bottom-1 w-px bg-foreground/50" style={{ left: `${pct(0.5)}%` }} aria-hidden />
            </div>
          </div>
        ))}
        <div className="relative h-8 text-[10px] text-muted-foreground">
          <span className="absolute left-0">0.3</span>
          <span className="absolute -translate-x-1/2 text-center whitespace-nowrap" style={{ left: `${pct(0.5)}%` }}>0.5 = coin flip</span>
          <span className="absolute right-0 text-right max-w-[7rem] leading-tight">1.0 = always spots the test</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Further right = easier for the AI to tell the set apart from real chats. Bars are the range across the 4 models.</p>
    </div>
  );
}

// ─── 5. Two giveaways ────────────────────────────────────────────────────────

function Giveaways() {
  const cards = [
    { icon: Check, tone: "green" as const, title: "Format giveaway",  sub: "How benchmarks are written", status: "Fixed by realistic rewriting" },
    { icon: X,     tone: "red" as const,   title: "Topic giveaway",   sub: "The crisis content itself",  status: "Not fixed: still spotted (0.87–0.96)" },
  ];
  return (
    <div className="space-y-3">
      <SectionTitle>Two giveaways</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {cards.map(({ icon: Icon, tone, title, sub, status }) => (
          <div key={title} className={`rounded-xl border p-4 flex gap-3 ${TONE[tone].box}`}>
            <Icon className={`h-6 w-6 shrink-0 ${TONE[tone].text}`} aria-hidden />
            <div>
              <p className="text-sm font-semibold text-foreground">{title}</p>
              <p className="text-xs text-muted-foreground">{sub}</p>
              <p className={`text-xs font-semibold mt-2 ${TONE[tone].text}`}>{status}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 6. Where it fits ────────────────────────────────────────────────────────

const STAGES = ["Prevent", "Detect", "Protect", "Respond"];

function WhereItFits() {
  return (
    <div className={CARD}>
      <SectionTitle>Where it fits in women's safety</SectionTitle>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {STAGES.map(s => {
          const mine = s === "Detect";
          return (
            <div key={s} className={`rounded-lg border p-3 text-center ${mine ? TONE.blue.box : "border-border bg-muted/30"}`}>
              <p className={`text-sm font-semibold ${mine ? TONE.blue.text : "text-muted-foreground"}`}>{s}</p>
              {mine && <p className="text-[10px] font-mono uppercase text-primary mt-0.5">this work</p>}
            </div>
          );
        })}
      </div>
      <div className={`rounded-lg border p-2.5 text-center ${TONE.blue.box}`}>
        <p className={`text-sm font-semibold ${TONE.blue.text}`}>Evaluate <span className="text-[10px] font-mono uppercase ml-1">this work</span></p>
        <p className="text-[11px] text-muted-foreground">Are the tests that judge all four stages trustworthy?</p>
      </div>
      <p className={BODY}>
        This links to my Zero-Interaction Danger Rate (ZIDR) research on detecting danger when the person cannot ask for help.
      </p>
    </div>
  );
}

// ─── 7. Findings / why / limits ──────────────────────────────────────────────

function TextSections() {
  return (
    <>
      <div className={CARD}>
        <SectionTitle>Why it matters</SectionTitle>
        <Bullets items={[
          "Benchmark builders cannot fix this with better writing alone.",
          "A real person in crisis might be treated like a test. Only 2 of 39 real crisis candidates were at crisis level, too few to say.",
          "Next: test whether covert distress looks more test-like (ZIDR check). For AI to be used in women's safety, the tests themselves have to be trustworthy.",
        ]} />
      </div>
    </>
  );
}

// ─── 8. Phase timeline ───────────────────────────────────────────────────────

function Timeline() {
  return (
    <div className="space-y-3">
      <SectionTitle>Phases</SectionTitle>
      <div className="flex flex-col md:flex-row items-stretch gap-2">
        <div className={`flex-1 rounded-xl border p-4 space-y-1 ${TONE.green.box}`}>
          <p className={`text-[10px] font-mono uppercase font-bold ${TONE.green.text}`}>Phase 1 · done</p>
          <p className="text-sm text-foreground">Does the AI suspect a test?</p>
        </div>
        <div className="flex items-center justify-center">
          <ArrowDown className="h-4 w-4 text-muted-foreground md:hidden" aria-hidden />
          <ArrowRight className="h-4 w-4 text-muted-foreground hidden md:block" aria-hidden />
        </div>
        <div className="flex-[2] rounded-xl border border-border bg-card/60 p-4 space-y-3">
          <div className="space-y-1">
            <p className="text-[10px] font-mono uppercase font-bold text-muted-foreground">Phase 2 · next</p>
            <p className="text-sm text-foreground">Does suspicion change how safely it responds?</p>
            <p className="text-xs text-muted-foreground">Pair each crisis item with a realistic rewrite, score replies, and check whether “looks less like a test” predicts worse help.</p>
          </div>
          <p className="text-xs text-muted-foreground">Phase 2 will score responses with a rubric (in design).</p>
        </div>
      </div>
    </div>
  );
}

// ─── 9. Glossary ─────────────────────────────────────────────────────────────

const GLOSSARY: [string, string][] = [
  ["Benchmark", "A published set of crisis test messages used to check how safely AI models respond."],
  ["Synthetic", "Written by an AI, not by a real user. Here: the realistic rewrites and everyday messages."],
  ["WildChat", "A public log of real ChatGPT chats shared with consent. Used as the “real” reference."],
  ["P(eval)", "The AI's own estimate, from 0 to 1, that a message is a test."],
  ["AUC", "Area under the curve. How well a model separates two sets: 0.5 is a coin flip, 1.0 is always right."],
  ["ZIDR", "Zero-Interaction Danger Rate: my research metric on detecting danger when the person cannot ask for help."],
  ["Baseline A", "The 200 real WildChat messages (English, support-seeking). The reference set."],
  ["Baseline B", "Synthetic crisis messages written to sound like real users."],
  ["Baseline C", "Synthetic everyday (non-crisis) messages written the same way, topic mix matched to WildChat."],
];

function Glossary() {
  return (
    <Accordion type="single" collapsible className="rounded-2xl border border-border bg-card/60 px-5">
      <AccordionItem value="glossary" className="border-b-0">
        <AccordionTrigger className="text-sm font-semibold">Glossary</AccordionTrigger>
        <AccordionContent>
          <dl className="space-y-3">
            {GLOSSARY.map(([term, def]) => (
              <div key={term}>
                <dt className="text-xs font-semibold text-foreground">{term}</dt>
                <dd className="text-xs text-muted-foreground leading-relaxed">{def}</dd>
              </div>
            ))}
          </dl>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

// ─── Preview content (visible without the master code, fades out) ────────────

// Grey placeholder tiles shaped like the key-result tiles. They carry no real
// numbers or text; they only give the preview enough height for the fade-out.
function TeaserSkeleton() {
  return (
    <div className="space-y-3">
      <SectionTitle>What we found</SectionTitle>
      <div aria-hidden="true" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[0, 1, 2].map(i => (
          <div key={i} className="rounded-xl border border-border bg-muted/30 p-3 space-y-3">
            <div className="h-2.5 w-1/3 rounded bg-muted-foreground/20" />
            <div className="h-2 w-full rounded bg-muted-foreground/15" />
            <div className="h-2 w-4/5 rounded bg-muted-foreground/15" />
            <div className="h-6 w-1/2 rounded bg-muted-foreground/20" />
            <div className="h-2 w-2/3 rounded bg-muted-foreground/15" />
          </div>
        ))}
      </div>
    </div>
  );
}

const previewContent = (
  <div className="min-h-screen">
    <div className="max-w-[1100px] mx-auto px-6 pt-10 pb-4 space-y-8 font-sans">
      <Header />
      <AtAGlance />
      <HowItWorks />
      <TeaserSkeleton />
    </div>
  </div>
);

// ─── Full page (owner only) ──────────────────────────────────────────────────

function CrisisRealismGapContent() {
  useVisitLogger("/crisis-realism-gap");

  return (
    <div className="min-h-screen font-sans bg-background text-foreground">
      <div className="max-w-[1100px] mx-auto px-6 py-10 space-y-8">

        <Link to="/#projects" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium">
          ← Back to Portfolio
        </Link>

        <Header large />
        <AtAGlance />
        <HowItWorks />
        <WhatWeFound />
        <KeyResult />
        <AucScale />
        <Giveaways />
        <WhereItFits />
        <TextSections />
        <Timeline />
        <Glossary />

        <div className="pt-2 pb-8 flex flex-wrap gap-3">
          {[
            { href: REPO_URL, label: "View on GitHub →" },
            { href: APPENDIX_URL, label: "Phase 1 appendix →" },
          ].map(l => (
            <a
              key={l.href}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors border border-border hover:border-foreground/40 rounded-lg px-4 py-2"
            >
              {l.label}
            </a>
          ))}
        </div>

      </div>
    </div>
  );
}

// ─── Export with PageGate (Research pageId: Research code or master code) ───

export default function CrisisRealismGap() {
  return (
    // Research project pages share the Research pageId/code.
    <PageGate pageId="research" previewContent={previewContent}>
      <CrisisRealismGapContent />
    </PageGate>
  );
}
