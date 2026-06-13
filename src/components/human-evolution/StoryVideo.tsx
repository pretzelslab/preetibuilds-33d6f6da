import { useEffect, useMemo, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { DOMAINS } from "@/data/humanEvolution";
import type { DomainId } from "@/data/humanEvolution";
import { DOMAIN_TITLES, pathValueAt, usePrefersReducedMotion } from "./shared";
import { NoControlsChart } from "./NoControlsChart";

/**
 * The story cut (S11): a second square recording video that keeps the original
 * 15-second loop untouched and adds the "so what?" — Problem → Cause → Levers
 * → Urgency in five scripted scenes over ~44 seconds, then stops by itself.
 * Presentation only — every line restates claims already on this page.
 */

const TOTAL_MS = 44_000;
const TICK_MS = 100;

// Scene boundaries (ms): title · curves draw to 2034 · pause on the cause ·
// levers reveal while curves finish · end screen.
const S2 = 5_000, S3 = 15_000, S4 = 25_000, S5 = 35_000;
const PAUSE_YEAR = 2034;

type SceneId = 1 | 2 | 3 | 4 | 5;

function sceneAt(ms: number): SceneId {
  if (ms < S2) return 1;
  if (ms < S3) return 2;
  if (ms < S4) return 3;
  if (ms < S5) return 4;
  return 5;
}

function yearAt(ms: number): number {
  if (ms < S2) return 2026;
  if (ms < S3) return 2026 + ((ms - S2) / (S3 - S2)) * (PAUSE_YEAR - 2026);
  if (ms < S4) return PAUSE_YEAR;
  if (ms < S5) return PAUSE_YEAR + ((ms - S4) / (S5 - S4)) * (2046 - PAUSE_YEAR);
  return 2046;
}

const SCENE_LABELS: Record<SceneId, string> = {
  1: "The five parts of life",
  2: "The trajectory",
  3: "The cause",
  4: "The levers",
  5: "The test",
};

// The four levers — same M1–M4 framing as the How We'll Know tab, video-short.
const LEVERS: { name: string; sub: string }[] = [
  { name: "Product objectives", sub: "regulate what AI is optimized for" },
  { name: "Defensive investment", sub: "fund detection, literacy, transition" },
  { name: "Education", sub: "keep unassisted thinking in school" },
  { name: "Workforce development", sub: "preserve the entry-level rung" },
];

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

  // Scene 2: one life-area name every 2 seconds. Scene 4: one lever every 2.5s.
  const namesShown = scene < 2 ? 0 : scene > 2 ? DOMAINS.length
    : Math.min(DOMAINS.length, Math.floor((elapsed - S2) / 2000) + 1);
  const leversShown = scene < 4 ? 0 : scene > 4 ? LEVERS.length
    : Math.min(LEVERS.length, Math.floor((elapsed - S4) / 2500) + 1);

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
        <p className="text-sm font-semibold">The story cut — a 44-second video with the "so what?"</p>
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
        The 15-second loop above shows the problem; this one adds the cause, the levers and the
        test — five scenes, then it stops by itself. Problem → cause → levers → urgency.
      </p>

      {/* 1:1 card sized for LinkedIn screen recording */}
      <div className="mx-auto w-full max-w-[560px]">
        <div className="aspect-square rounded-2xl border border-border/60 bg-background p-5 flex flex-col">
          <div className="flex items-start justify-between gap-3 mb-1">
            <div>
              <p className="text-xs font-semibold leading-tight">If no controls deploy</p>
              <p className="text-[10px] text-muted-foreground">five parts of human life · 2026–2046</p>
            </div>
            <span className="text-3xl font-bold tabular-nums leading-none">{yearDisplay}</span>
          </div>

          <div className="flex-1 min-h-0 relative">
            <div className={`absolute inset-0 transition-opacity duration-1000 ${scene === 5 ? "opacity-20" : "opacity-100"}`}>
              <NoControlsChart rows={rows} compact visible={ALL_VISIBLE} hovered={null} />
            </div>

            {/* Scene 1 — the hook */}
            {scene === 1 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center animate-in fade-in duration-1000 px-6">
                  <p className="text-xl font-bold leading-snug">Five parts of human life.</p>
                  <p className="text-xl font-bold leading-snug text-muted-foreground">One trajectory.</p>
                </div>
              </div>
            )}

            {/* Scene 2 — the five names, one at a time, in the still-empty right half */}
            {scene === 2 && (
              <div className="absolute right-2 bottom-10 space-y-1.5 text-right">
                {DOMAINS.slice(0, namesShown).map(d => (
                  <p key={d.id} className="text-xs font-semibold animate-in fade-in duration-700 flex items-center justify-end gap-1.5">
                    {DOMAIN_TITLES[d.id]}
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                  </p>
                ))}
              </div>
            )}

            {/* Scene 3 — the cause, while the chart holds at 2034 */}
            {scene === 3 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center animate-in fade-in duration-1000 rounded-xl border border-border/60 bg-background/90 px-5 py-4 mx-6">
                  <p className="text-base font-bold leading-snug">The risk isn't smarter AI.</p>
                  <p className="text-base font-bold leading-snug text-amber-500">The risk is unaligned incentives.</p>
                </div>
              </div>
            )}

            {/* Scene 4 — the levers, one at a time, as the curves finish */}
            {scene === 4 && (
              <div className="absolute right-2 bottom-10 space-y-1.5">
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

            {/* Scene 5 — the end screen */}
            {scene === 5 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center animate-in fade-in duration-1000 px-6">
                  <p className="text-xl font-bold leading-snug">The future is not predetermined.</p>
                  <p className="text-2xl font-bold leading-snug mt-1">We'll know by 2029.</p>
                  <p className="text-[10px] text-muted-foreground mt-3">Four levers. One test already underway.</p>
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
              Scene {scene} of 5 · {SCENE_LABELS[scene]}
            </p>
          </>
        )}
      </div>

      <p className="text-[10px] text-muted-foreground mt-3 text-center">
        {reducedMotion
          ? "Animation is off because your device prefers reduced motion — this shows the final frame."
          : "Press Restart, then screen-record just the square — it stops by itself after ~44 seconds."}
      </p>
    </div>
  );
}
