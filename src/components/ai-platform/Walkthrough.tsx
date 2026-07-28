import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Check, Lock } from "lucide-react";
import { ScreenshotStage } from "./ScreenshotStage";
import { EvaluationsDemo } from "./EvaluationsDemo";
import { SafetyPolicyDemo } from "./SafetyPolicyDemo";

type StepKey = "overview" | "command-center" | "evaluations" | "safety-policy" | "observability";

interface Step {
  key: StepKey;
  label: string;
  heading: string;
  blurb: string;
  screenshot?: { src: string; alt: string; caption: string; width: number; height: number };
  continueLabel: string | null;
}

const STEPS: Step[] = [
  {
    key: "overview",
    label: "Overview",
    heading: "Platform overview",
    blurb: "Platform-wide workspace map and local/deterministic framing.",
    screenshot: {
      src: "/images/projects/ai-platform/platform-overview.png",
      alt: "AI Platform Engineering Lab overview showing a sidebar and a grid of connected workspace modules.",
      caption: "A connected map of specialist AI platform workspaces.",
      width: 1440, height: 1000,
    },
    continueLabel: "Continue to Command Center",
  },
  {
    key: "command-center",
    label: "Command Center",
    heading: "Command Center",
    blurb: "An operational view that brings signals, assets, risks, and approvals together.",
    screenshot: {
      src: "/images/projects/ai-platform/command-center.png",
      alt: "Command Center dashboard showing platform health, active incidents, approval decisions, and operational risks.",
      caption: "A command-center view connects platform operations and decision context.",
      width: 1440, height: 1100,
    },
    continueLabel: "Continue to Evaluations",
  },
  {
    key: "evaluations",
    label: "Evaluations",
    heading: "Evaluations Workbench",
    blurb: "Deterministic prompt evaluation cases and criteria — try it below.",
    continueLabel: "Continue to Safety Policy",
  },
  {
    key: "safety-policy",
    label: "Safety Policy",
    heading: "Safety & Policy Engine",
    blurb: "Policy evaluation, control mapping, and remediation guidance — try it below.",
    continueLabel: "Continue to Observability",
  },
  {
    key: "observability",
    label: "Observability",
    heading: "Runtime Observability",
    blurb: "Deterministic runtime traces, safety interventions, drift, and incident context.",
    screenshot: {
      src: "/images/projects/ai-platform/runtime-observability.png",
      alt: "Runtime observability view showing deterministic traces, health indicators, safety interventions, drift signals, and active incidents.",
      caption: "Runtime review brings trace signals, safety interventions, and incident context into one view.",
      width: 1440, height: 1200,
    },
    continueLabel: null,
  },
];

// Progressive fade for locked tabs — floor kept high enough to stay legible.
const LOCK_OPACITY = [0.6, 0.45, 0.35, 0.3];

// Admin/local review mode: same convention used by PageGate.tsx and Tracker.tsx —
// the local dev server exposes everything with no progressive locking or fading.
const isAdmin = import.meta.env.DEV;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

function stepIndexFromHash(): number | null {
  const key = window.location.hash.replace("#", "").trim();
  if (!key) return null;
  const index = STEPS.findIndex((s) => s.key === key);
  return index === -1 ? null : index;
}

export function AIPlatformWalkthrough() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [maxUnlocked, setMaxUnlocked] = useState(isAdmin ? STEPS.length - 1 : 0);
  const [announcement, setAnnouncement] = useState("");
  const reducedMotion = usePrefersReducedMotion();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const maxUnlockedRef = useRef(maxUnlocked);
  maxUnlockedRef.current = maxUnlocked;

  // URL hashes can open any stage in admin mode; in public mode a hash can only
  // jump to a stage that's already unlocked — it never bypasses progressive locking.
  useEffect(() => {
    const openFromHash = () => {
      const index = stepIndexFromHash();
      if (index === null) return;
      setActiveIndex(isAdmin ? index : Math.min(index, maxUnlockedRef.current));
    };
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, []);

  const scrollAndFocusPanel = () => {
    requestAnimationFrame(() => {
      panelRef.current?.scrollIntoView({
        behavior: reducedMotion ? "auto" : "smooth",
        block: "start",
      });
      panelRef.current?.focus();
    });
  };

  const handleContinue = (index: number) => {
    const next = index + 1;
    if (next >= STEPS.length) return;
    setMaxUnlocked((m) => Math.max(m, next));
    setActiveIndex(next);
    setAnnouncement(`${STEPS[next].label} unlocked.`);
    scrollAndFocusPanel();
  };

  const handleTabClick = (index: number) => {
    if (index > maxUnlocked) return; // locked — no-op
    setActiveIndex(index);
  };

  const handleTabKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next: number | null = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      next = index === maxUnlocked ? 0 : index + 1;
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      next = index === 0 ? maxUnlocked : index - 1;
    } else if (e.key === "Home") {
      next = 0;
    } else if (e.key === "End") {
      next = maxUnlocked;
    } else {
      return;
    }
    e.preventDefault();
    // next is always within [0, maxUnlocked] by construction — locked tabs are unreachable.
    setActiveIndex(next);
    tabRefs.current[next]?.focus();
  };

  const step = STEPS[activeIndex];

  return (
    <div>
      <div aria-live="polite" className="sr-only">{announcement}</div>

      <div
        role="tablist"
        aria-label="AI Platform Engineering Lab walkthrough"
        className="flex flex-wrap gap-2 mb-5"
      >
        {STEPS.map((s, i) => {
          const locked = i > maxUnlocked;
          const completed = i < maxUnlocked;
          const active = i === activeIndex;
          const lockDistance = i - maxUnlocked;
          const opacity = locked ? LOCK_OPACITY[Math.min(lockDistance - 1, LOCK_OPACITY.length - 1)] : 1;

          return (
            <button
              key={s.key}
              ref={(el) => { tabRefs.current[i] = el; }}
              type="button"
              role="tab"
              id={`ai-platform-tab-${s.key}`}
              aria-controls={`ai-platform-panel-${s.key}`}
              aria-selected={active}
              aria-disabled={locked}
              tabIndex={locked ? -1 : active ? 0 : -1}
              onClick={() => handleTabClick(i)}
              onKeyDown={(e) => handleTabKeyDown(e, i)}
              style={{ opacity }}
              className={[
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-opacity motion-reduce:transition-none duration-300",
                active
                  ? "bg-primary/10 border-primary/40 text-primary"
                  : locked
                    ? "bg-muted/20 border-border/40 text-muted-foreground cursor-not-allowed"
                    : "bg-muted/10 border-border/60 text-foreground hover:border-border cursor-pointer",
              ].join(" ")}
            >
              {locked && <Lock className="w-3 h-3" aria-hidden="true" />}
              {completed && !active && <Check className="w-3 h-3" aria-hidden="true" />}
              {s.label}
            </button>
          );
        })}
      </div>

      <div
        key={step.key}
        ref={panelRef}
        role="tabpanel"
        id={`ai-platform-panel-${step.key}`}
        aria-labelledby={`ai-platform-tab-${step.key}`}
        tabIndex={-1}
        className="focus:outline-none animate-in fade-in slide-in-from-bottom-1 duration-300 motion-reduce:animate-none"
      >
        <h3 className="text-base font-semibold mb-1">{step.heading}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed mb-3">{step.blurb}</p>

        {step.screenshot && (
          <ScreenshotStage
            src={step.screenshot.src}
            alt={step.screenshot.alt}
            caption={step.screenshot.caption}
            width={step.screenshot.width}
            height={step.screenshot.height}
            startRevealed={isAdmin}
          />
        )}
        {step.key === "evaluations" && <EvaluationsDemo />}
        {step.key === "safety-policy" && <SafetyPolicyDemo />}

        {step.continueLabel && (
          <button
            type="button"
            onClick={() => handleContinue(activeIndex)}
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {step.continueLabel} →
          </button>
        )}
      </div>
    </div>
  );
}
