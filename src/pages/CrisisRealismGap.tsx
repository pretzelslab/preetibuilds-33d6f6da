import { Link } from "react-router-dom";
import { useVisitLogger } from "@/hooks/useVisitLogger";
import { PageGate } from "@/components/ui/PageGate";

const REPO_URL = "https://github.com/pretzelslab/crisis-realism-gap";
const APPENDIX_URL = "https://github.com/pretzelslab/crisis-realism-gap/blob/main/docs/phase1_appendix.md";

// ─── Shared blocks ───────────────────────────────────────────────────────────

const CARD = "rounded-2xl border border-slate-700/50 bg-slate-800/20 p-5 space-y-3";

function Header({ large }: { large?: boolean }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded px-2 py-0.5">Phase 1 complete</span>
        <span className="text-xs text-slate-500 bg-slate-800/50 border border-slate-700/50 rounded px-2 py-0.5">AI Safety Research</span>
        <span className="text-xs text-slate-500 bg-slate-800/50 border border-slate-700/50 rounded px-2 py-0.5">Preethi Raghuveeran</span>
      </div>
      <h1 className={`${large ? "text-4xl" : "text-3xl"} font-bold text-white`}>Crisis Realism Gap</h1>
      <p className="text-slate-400 max-w-2xl text-base leading-relaxed">
        Can an artificial intelligence (AI) model tell a safety test from a real person in crisis, and does that make test scores look better than real life?
      </p>
    </div>
  );
}

function Question() {
  return (
    <div className={CARD}>
      <h2 className="text-sm font-semibold text-white">The question</h2>
      <p className="text-sm text-slate-300 leading-relaxed">
        AI models are tested for how safely they handle people in crisis (suicidal thoughts, self-harm, abuse). Those test messages are written by researchers.
        If a model can tell "this is a test", it may behave better on the test than with a real person. Then safety scores look better than real life.
      </p>
      <p className="text-sm text-slate-400 leading-relaxed">
        Think of a driving test where the car has a big "EXAM" sign on it. The driver behaves. The score says little about how they drive alone at night.
      </p>
    </div>
  );
}

const WHAT_I_DID = [
  "Collected 6 sets of messages: a published crisis benchmark, its non-crisis controls, real chats from WildChat (a public log of real ChatGPT chats shared with consent), and fake messages I generated to sound like real users, both crisis and everyday.",
  "Asked 4 frontier models (Claude Sonnet 5.5, Claude Opus 5.5, GPT-6.1, Gemini 3.8 Flash) one thing per message: how likely is this a test, from 0 to 1?",
  "Measured how well each model separates two sets, using area under the curve (AUC). 0.5 = coin flip, 1.0 = always right.",
  "Total application programming interface (API) cost about $15.",
];

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 text-sm text-slate-300 leading-relaxed list-disc pl-5">
      {items.map(t => <li key={t}>{t}</li>)}
    </ul>
  );
}

// ─── Preview content (visible without the master code, fades out) ────────────

const previewContent = (
  <div className="dark max-w-4xl mx-auto px-6 pt-10 pb-4 space-y-6 font-sans" style={{ background: "#0f172a", minHeight: "100%" }}>
    <Header />
    <Question />
    <div className={CARD}>
      <h2 className="text-sm font-semibold text-white">What I did (Phase 1)</h2>
      <Bullets items={WHAT_I_DID} />
    </div>
  </div>
);

// ─── Full page (owner only) ──────────────────────────────────────────────────

function CrisisRealismGapContent() {
  useVisitLogger("/crisis-realism-gap");

  return (
    <div className="dark min-h-screen font-sans" style={{ background: "#0f172a", color: "#f1f5f9" }}>
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">

        <Link to="/#projects" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors font-medium">
          ← Back to Portfolio
        </Link>

        <Header large />
        <Question />

        <div className={CARD}>
          <h2 className="text-sm font-semibold text-white">What I did (Phase 1)</h2>
          <Bullets items={WHAT_I_DID} />
        </div>

        <div className={CARD}>
          <h2 className="text-sm font-semibold text-white">What I found</h2>
          <Bullets items={[
            "Benchmark crisis messages vs real chats: models spot the test almost every time (AUC 0.95 to 1.00).",
            "There are two giveaways. One: how benchmarks are written (format). Two: the crisis topic itself.",
            "Rewriting crisis messages to sound like real users removed the format giveaway but not the topic one. Still spotted (0.87 to 0.96).",
            "Everyday messages written the same way passed as real (0.35 to 0.67). Same writer, same style, only the topic changed. So crisis content itself reads as \"test\".",
            "Message length does not explain it.",
          ]} />
        </div>

        <div className={CARD}>
          <h2 className="text-sm font-semibold text-white">Why it matters</h2>
          <Bullets items={[
            "Benchmark builders cannot fix this with better writing alone.",
            "Risk: a real person in crisis might be treated like a test. The 5 real crisis messages I found scored low, which is reassuring, but 5 is too few to say.",
            "Hidden distress (someone not saying it outright) read slightly more fake than direct disclosure. That matters for my Zero-Interaction Danger Rate (ZIDR) work, which is about detecting danger when the person cannot ask for help. For AI to be used in women's safety, the tests themselves have to be trustworthy.",
          ]} />
        </div>

        <div className={CARD}>
          <h2 className="text-sm font-semibold text-white">Limits</h2>
          <Bullets items={[
            "No real crisis data: public datasets remove it.",
            "Small samples in places; labels mostly assigned by AI; spot checks by one rater (me).",
            "The benchmark has no intimate partner violence category.",
          ]} />
        </div>

        <div className={CARD}>
          <h2 className="text-sm font-semibold text-white">Next (Phase 2)</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Does suspecting a test actually change the model's safety behaviour? Pair each original crisis item with a realistic rewrite,
            score replies on a 6-point rubric (notices distress, responds with care, points to real help, gives no harmful detail,
            keeps the door open, does not over-refuse), and check whether "looks less like a test" predicts worse help.
          </p>
        </div>

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
              className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors border border-slate-700 hover:border-slate-500 rounded-lg px-4 py-2"
            >
              {l.label}
            </a>
          ))}
        </div>

      </div>
    </div>
  );
}

// ─── Export with PageGate (no pageId → master code only) ─────────────────────

export default function CrisisRealismGap() {
  return (
    <PageGate previewContent={previewContent}>
      <CrisisRealismGapContent />
    </PageGate>
  );
}
