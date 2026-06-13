import { useEffect, useMemo, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { DOMAINS } from "@/data/humanEvolution";
import type { DomainId } from "@/data/humanEvolution";
import { pathValueAt, usePrefersReducedMotion } from "./shared";
import { NoControlsChart } from "./NoControlsChart";

/**
 * The story cut (S11 v4): a second square recording video that keeps the
 * original 15-second loop untouched and tells the research story —
 * signals → scenario → levers → choice — in seven scripted scenes over
 * ~50 seconds, then stops by itself. Framed as a scenario exploration,
 * not a prediction. Presentation only — every line restates claims
 * already in the research corpus.
 */

const TOTAL_MS = 50_000;
const TICK_MS = 100;

// Scene boundaries (ms): framing · five dimensions · early signals ·
// scenario draw · levers · geopolitical layer · closing.
const B2 = 5_000, B3 = 12_000, B4 = 20_000, B5 = 28_000, B6 = 40_000, B7 = 45_000;

type SceneId = 1 | 2 | 3 | 4 | 5 | 6 | 7;

function sceneAt(ms: number): SceneId {
  if (ms < B2) return 1;
  if (ms < B3) return 2;
  if (ms < B4) return 3;
  if (ms < B5) return 4;
  if (ms < B6) return 5;
  if (ms < B7) return 6;
  return 7;
}

// The years: hold 2026 through framing + dimensions, creep to 2029 while the
// early signals land, draw the scenario to 2040, finish to 2046 early in the
// levers scene, then hold.
function yearAt(ms: number): number {
  if (ms < B3) return 2026;
  if (ms < B4) return 2026 + ((ms - B3) / (B4 - B3)) * 3;
  if (ms < B5) return 2029 + ((ms - B4) / (B5 - B4)) * 11;
  if (ms < 32_000) return 2040 + ((ms - B5) / 4_000) * 6;
  return 2046;
}

const SCENE_LABELS: Record<SceneId, string> = {
  1: "Framing",
  2: "Five dimensions",
  3: "Early signals",
  4: "The scenario",
  5: "The levers",
  6: "The geopolitical layer",
  7: "The choice",
};

// Video-short names for the five dimensions, in DOMAINS order.
const VIDEO_NAMES: Record<DomainId, string> = {
  cognition: "Thinking",
  creativity: "Creativity",
  discernment: "Trust & Discernment",
  mentalHealth: "Mental Wellbeing",
  labor: "Work",
};

// Scene 3 — signals already visible today (each restates a sourced page claim).
const SIGNALS: { up: boolean; text: string }[] = [
  { up: false, text: "Junior opportunities" },
  { up: false, text: "Verification behavior" },
  { up: true, text: "AI companionship" },
  { up: true, text: "Screen engagement" },
];

// Scene 5 — the five levers. 1–4 are the page's M1–M4; the fifth is a
// candidate lever (video-first; page framework integration backlogged).
const LEVERS: { name: string; sub: string }[] = [
  { name: "Product objectives", sub: "outcomes over engagement" },
  { name: "Defensive investment", sub: "verification · literacy · support" },
  { name: "Education", sub: "preserve independent thinking" },
  { name: "Workforce development", sub: "protect pathways to expertise" },
  { name: "Democratization & access", sub: "broad participation, not concentrated power" },
];

const GEO_WORDS = ["Power", "Governance", "Inclusion", "Sovereignty", "Speed"];

const ALL_VISIBLE: Record<DomainId, boolean> = {
  cognition: true, creativity: true, discernment: true, mentalHealth: true, labor: true,
};

export function StoryVideo() {
  const reducedMotion = usePrefersReducedMotion();
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(false);

  // Reduced motion: hold the finished end frame — no animation.
  useEffect(() => {
    if (reducedMotion) {
      setPlaying(false);
      setElapsed(TOTAL_MS);
    }
  }, [reducedMotion]);

  useEffect(() => {
    if (!playing || reducedMotion) return;
    const t = setInterval(() => setElapsed(e => Math.min(e + TICK_MS, TOTAL_MS)), TICK_MS);
    return () => clearInterval(t);
  }, [playing, reducedMotion]);

  // The video ends — it does not loop, so a screen recording has a clean stop.
  useEffect(() => {
    if (elapsed >= TOTAL_MS && playing) setPlaying(false);
  }, [elapsed, playing]);

  const scene = sceneAt(elapsed);
  const yearFloat = yearAt(elapsed);
  const yearDisplay = Math.floor(yearFloat + 1e-6);
  const done = elapsed >= TOTAL_MS;
  const dimmed = scene >= 6;

  // Staggered reveals: dimension names (scene 2), signals (scene 3), levers (scene 5).
  const namesShown = scene < 2 ? 0 : scene > 2 ? DOMAINS.length
    : Math.min(DOMAINS.length, Math.floor((elapsed - B2) / 1200) + 1);
  const taglineShown = scene === 2 && elapsed >= B2 + 6_000;
  const signalsShown = scene < 3 ? 0 : scene > 3 ? SIGNALS.length
    : Math.min(SIGNALS.length, Math.floor((elapsed - B3) / 1500) + 1);
  const signalsLineShown = scene === 3 && elapsed >= B3 + 6_000;
  const leversShown = scene < 5 ? 0 : scene > 5 ? LEVERS.length
    : Math.min(LEVERS.length, Math.floor((elapsed - B5) / 2400) + 1);

  const rows = useMemo(() => {
    const out: Record<string, number>[] = [];
    for (let yr = 2026; yr <= Math.floor(yearFloat); yr++) {
      const row: Record<string, number> = { year: yr };
      for (const d of DOMAINS) row[d.id] = pathValueAt(d.id, "C", yr);
      out.push(row);
    }
    if (yearFloat > Math.floor(yearFloat)) {
      const row: Record<string, number> = { year: yearFloat };
      for (const d of DOMAINS) row[d.id] = pathValueAt(d.id, "C", yearFloat);
      out.push(row);
    }
    return out;
  }, [yearFloat]);

  return (
    <div className="rounded-xl border border-border/60 bg-muted/5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 mb-1">
        <p className="text-sm font-semibold">The story cut — a 50-second video with the "so what?"</p>
        {!reducedMotion && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setPlaying(p => !p)}
              disabled={done}
              className="inline-flex items-center gap-1.5 rounded-full border border-border/60 px-3 py-1 text-[10px] hover:border-foreground/40 transition-colors disabled:opacity-40"
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              {playing ? "Pause" : "Play"}
            </button>
            <button
              onClick={() => { setElapsed(0); setPlaying(true); }}
              className="inline-flex items-center gap-1.5 rounded-full border border-border/60 px-3 py-1 text-[10px] hover:border-foreground/40 transition-colors"
              aria-label="Restart the story"
            >
              <RotateCcw className="w-3 h-3" /> Restart
            </button>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed mb-4">
        The 15-second loop above shows the problem; this one tells the research story —
        signals → scenario → levers → choice. Seven scenes framed as a scenario exploration,
        not a prediction, and it stops by itself.
      </p>

      {/* 1:1 card sized for LinkedIn screen recording */}
      <div className="mx-auto w-full max-w-[560px]">
        <div className="aspect-square rounded-2xl border border-border/60 bg-background p-5 flex flex-col">
          <div className="flex items-start justify-between gap-3 mb-1">
            <div>
              <p className="text-xs font-semibold leading-tight">AI & Human Capability</p>
              <p className="text-[10px] text-muted-foreground">a scenario exploration · 2026–2046</p>
            </div>
            <span className="text-3xl font-bold tabular-nums leading-none">{yearDisplay}</span>
          </div>

          <div className="flex-1 min-h-0 relative">
            <div className={`absolute inset-0 transition-opacity duration-1000 ${dimmed ? "opacity-20" : "opacity-100"}`}>
              <NoControlsChart rows={rows} compact visible={ALL_VISIBLE} hovered={null} />
            </div>

            {/* Scene 1 — research framing */}
            {scene === 1 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center animate-in fade-in duration-1000 px-6">
                  <p className="text-xl font-bold leading-snug">AI & Human Capability</p>
                  <p className="text-sm text-muted-foreground mt-1">A scenario exploration</p>
                  <p className="text-[10px] text-muted-foreground mt-3">Not a prediction. A framework for discussion.</p>
                </div>
              </div>
            )}

            {/* Scene 2 — the five dimensions, revealed individually */}
            {scene === 2 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center px-6">
                  <div className="space-y-1">
                    {DOMAINS.slice(0, namesShown).map(d => (
                      <p key={d.id} className="text-base font-bold animate-in fade-in duration-500 flex items-center justify-center gap-2">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                        {VIDEO_NAMES[d.id]}
                      </p>
                    ))}
                  </div>
                  {taglineShown && (
                    <p className="text-xs text-muted-foreground mt-3 animate-in fade-in duration-700">
                      Five dimensions of human capability. One shared trajectory.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Scene 3 — early signals, before any curve drops */}
            {scene === 3 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center px-6">
                  <div className="space-y-1.5">
                    {SIGNALS.slice(0, signalsShown).map(s => (
                      <p key={s.text} className="text-sm font-semibold animate-in fade-in duration-500">
                        <span className={`mr-1.5 ${s.up ? "text-amber-500" : "text-red-500"}`}>{s.up ? "↑" : "↓"}</span>
                        {s.text}
                      </p>
                    ))}
                  </div>
                  {signalsLineShown && (
                    <p className="text-xs text-muted-foreground mt-3 animate-in fade-in duration-700">
                      Early signals are already emerging.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Scene 4 — the scenario draws */}
            {scene === 4 && (
              <div className="absolute inset-x-0 top-1 flex justify-center">
                <p className="animate-in fade-in duration-1000 rounded-full border border-border/50 bg-background/90 px-3 py-1 text-[11px] font-semibold">
                  If current incentives remain unchanged…
                </p>
              </div>
            )}

            {/* Scene 5 — the five levers, one at a time, in the emptying upper right */}
            {scene === 5 && (
              <div className="absolute right-2 top-2 space-y-1.5">
                {LEVERS.slice(0, leversShown).map((l, i) => (
                  <div key={l.name} className="animate-in fade-in duration-700 rounded-lg border border-border/50 bg-background/90 px-2.5 py-1.5 text-right">
                    <p className="text-[11px] font-semibold leading-tight">
                      <span className="text-muted-foreground mr-1.5">{i + 1}</span>{l.name}
                    </p>
                    <p className="text-[9px] text-muted-foreground leading-tight">{l.sub}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Scene 6 — the geopolitical layer */}
            {scene === 6 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center animate-in fade-in duration-1000 px-6">
                  <p className="text-base font-bold leading-snug">Different regions.</p>
                  <p className="text-base font-bold leading-snug">Different objectives.</p>
                  <p className="text-base font-bold leading-snug">Different outcomes.</p>
                  <p className="text-[10px] text-muted-foreground mt-3 tracking-wide">
                    {GEO_WORDS.join(" · ")}
                  </p>
                </div>
              </div>
            )}

            {/* Scene 7 — the closing */}
            {scene === 7 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center animate-in fade-in duration-1000 px-6">
                  <p className="text-xl font-bold leading-snug">The future is not predetermined.</p>
                  <p className="text-xl font-bold leading-snug mt-1">The question is which levers we choose to pull.</p>
                  <p className="text-[10px] text-muted-foreground mt-3">The evidence will emerge long before 2046.</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
            {DOMAINS.map(d => (
              <span key={d.id} className="inline-flex items-center gap-1 text-[9px] text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                {d.shortLabel}
              </span>
            ))}
          </div>
          <p className="text-[9px] text-muted-foreground/70 mt-1.5">
            50 = 2026 baseline · illustrative — the direction is the claim, not the numbers · preetibuilds
          </p>
        </div>

        {/* Progress + scene marker — outside the square so the recording stays clean */}
        {!reducedMotion && (
          <>
            <div className="h-1 rounded-full bg-muted/40 overflow-hidden mt-3">
              <div
                className="h-full bg-foreground/50 transition-all duration-100 ease-linear"
                style={{ width: `${(elapsed / TOTAL_MS) * 100}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
              Scene {scene} of 7 · {SCENE_LABELS[scene]}
            </p>
          </>
        )}
      </div>

      <p className="text-[10px] text-muted-foreground mt-3 text-center">
        {reducedMotion
          ? "Animation is off because your device prefers reduced motion — this shows the final frame."
          : "Press Restart, then screen-record just the square — it stops by itself after ~50 seconds."}
      </p>
    </div>
  );
}
