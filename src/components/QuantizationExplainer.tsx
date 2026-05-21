import { useState, useEffect, useRef, useCallback } from "react";

// ── Seeded data generation ────────────────────────────────────────
// Box-Muller transform on a linear congruential generator.
// Produces the same points every render — no prop needed.

function makePoints(mean: number, std: number, yStd: number, n: number, seed: number) {
  let s = seed;
  const rand = () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < n; i++) {
    const u1 = Math.max(rand(), 1e-10);
    const u2 = rand();
    const mag = Math.sqrt(-2 * Math.log(u1));
    const nx = mean + std  * mag * Math.cos(2 * Math.PI * u2);
    const ny =        yStd * mag * Math.sin(2 * Math.PI * u2);
    pts.push({ x: Math.max(-2.4, Math.min(2.4, nx)), y: Math.max(-2.9, Math.min(2.9, ny)) });
  }
  return pts;
}

// Group A — majority, well-represented. Cluster well left of boundary.
const GROUP_A = makePoints(-0.5, 0.55, 0.9, 400, 42);
// Group B — minority, underrepresented. Cluster near boundary.
const GROUP_B = makePoints(0.15, 0.45, 0.9, 120, 137);

// ── Threshold animation sequence ─────────────────────────────────
// Mirrors the Python linspace sequence: FP32 hold → drift → FP16 hold → drift → INT8 hold

const THRESHOLDS: number[] = [
  ...Array(15).fill(0.50),
  ...Array.from({ length: 20 }, (_, i) => 0.50 - 0.04 * (i / 19)),
  ...Array(10).fill(0.46),
  ...Array.from({ length: 25 }, (_, i) => 0.46 - 0.04 * (i / 24)),
  ...Array(10).fill(0.42),
];

// ── SVG coordinate helpers ────────────────────────────────────────
const SVG_W = 520;
const SVG_H = 290;

function sx(x: number) { return ((x + 2.3) / 4.6) * SVG_W; }
function sy(y: number) { return SVG_H - ((y + 2.9) / 5.8) * SVG_H; }

function computeFPR(pts: { x: number; y: number }[], t: number) {
  return pts.filter(p => p.x > t).length / pts.length;
}

function precLabel(t: number) {
  if (t >= 0.495) return "FP32 — full precision";
  if (t >= 0.455) return "FP16 — half precision";
  return "INT8 — quantised";
}

function precColor(t: number) {
  if (t >= 0.495) return "#22c55e";
  if (t >= 0.455) return "#f59e0b";
  return "#ef4444";
}

// ── Component ─────────────────────────────────────────────────────

export function QuantizationExplainer() {
  const [frame, setFrame]   = useState(0);
  const [playing, setPlaying] = useState(false);
  const rafRef    = useRef<number | null>(null);
  const lastTime  = useRef(0);

  const t    = THRESHOLDS[Math.min(frame, THRESHOLDS.length - 1)];
  const fprA = computeFPR(GROUP_A, t);
  const fprB = computeFPR(GROUP_B, t);
  const gap  = fprB - fprA;

  const tick = useCallback((time: number) => {
    if (time - lastTime.current > 80) {
      lastTime.current = time;
      setFrame(f => {
        if (f >= THRESHOLDS.length - 1) { setPlaying(false); return f; }
        return f + 1;
      });
    }
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (playing) {
      rafRef.current = requestAnimationFrame(tick);
    } else if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [playing, tick]);

  const bx = sx(t); // boundary x in SVG coords

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-base font-semibold mb-1">Visual Explainer — How the Boundary Drifts</h2>
        <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
          As model precision drops FP32 → FP16 → INT8, the decision threshold shifts left — making the model more
          restrictive. Groups clustered near the boundary absorb a disproportionate share of wrongful denials.
          Press Play or scrub the slider.
        </p>
      </div>

      {/* Two-panel visual */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Left — scatter plot */}
        <div className="lg:col-span-2 rounded-xl border border-border/60 bg-muted/10 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50">Decision space</p>
            <span className="text-xs font-semibold" style={{ color: precColor(t) }}>{precLabel(t)}</span>
          </div>

          <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full" style={{ height: 260 }}>
            {/* Denied zone */}
            <rect x={0} y={0} width={bx} height={SVG_H} fill="#ef4444" opacity={0.06} />
            {/* Approved zone label */}
            <text x={Math.min(bx + (SVG_W - bx) / 2, SVG_W - 40)} y={18}
                  textAnchor="middle" fill="#22c55e" fontSize={9} fontWeight={600} opacity={0.70}>
              APPROVED
            </text>
            {/* Denied zone label */}
            <text x={bx / 2} y={18}
                  textAnchor="middle" fill="#ef4444" fontSize={9} fontWeight={600} opacity={0.70}>
              DENIED
            </text>

            {/* Group A — blue circles */}
            {GROUP_A.map((p, i) => {
              const px = sx(p.x), py = sy(p.y);
              return <circle key={i} cx={px} cy={py} r={2.8} fill="#4a9eff" opacity={0.55} />;
            })}

            {/* Group B — orange/red triangles */}
            {GROUP_B.map((p, i) => {
              const px = sx(p.x), py = sy(p.y);
              const denied = p.x > t;
              const fill = denied ? "#ef4444" : "#f59e0b";
              return (
                <polygon
                  key={i}
                  points={`${px},${py - 5} ${px + 5},${py + 4} ${px - 5},${py + 4}`}
                  fill={fill}
                  opacity={0.85}
                />
              );
            })}

            {/* Decision boundary */}
            <line x1={bx} y1={0} x2={bx} y2={SVG_H}
                  stroke="#ef4444" strokeWidth={2} strokeDasharray="5 3" opacity={0.9} />
          </svg>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-2">
            {[
              { color: "#4a9eff", label: "Group A — majority",           shape: "circle"   },
              { color: "#f59e0b", label: "Group B — minority",           shape: "triangle" },
              { color: "#ef4444", label: "Group B — wrongly denied",     shape: "triangle" },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <svg width={12} height={12}>
                  {l.shape === "circle"
                    ? <circle cx={6} cy={6} r={4} fill={l.color} />
                    : <polygon points="6,1 11,11 1,11" fill={l.color} />
                  }
                </svg>
                <span className="text-[10px] text-muted-foreground">{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — metrics */}
        <div className="rounded-xl border border-border/60 bg-muted/10 p-4 flex flex-col gap-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50">
            False positive rate
          </p>

          {/* Group A */}
          <div>
            <div className="flex justify-between mb-1.5">
              <span className="text-[11px] text-[#4a9eff] font-medium">Group A</span>
              <span className="text-[11px] font-bold text-[#4a9eff]">{(fprA * 100).toFixed(1)}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-muted/30 overflow-hidden">
              <div className="h-full rounded-full bg-[#4a9eff] transition-all duration-75"
                   style={{ width: `${Math.min(fprA * 200, 100)}%` }} />
            </div>
          </div>

          {/* Group B */}
          <div>
            <div className="flex justify-between mb-1.5">
              <span className="text-[11px] text-[#f59e0b] font-medium">Group B</span>
              <span className="text-[11px] font-bold text-[#f59e0b]">{(fprB * 100).toFixed(1)}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-muted/30 overflow-hidden">
              <div className="h-full rounded-full bg-[#f59e0b] transition-all duration-75"
                   style={{ width: `${Math.min(fprB * 200, 100)}%` }} />
            </div>
          </div>

          {/* Gap callout */}
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 mt-auto">
            <p className="text-[10px] text-muted-foreground mb-1">Disparity gap</p>
            <p className="text-2xl font-bold text-red-500">{(gap * 100).toFixed(1)}pp</p>
            <p className="text-[10px] text-muted-foreground mt-1">
              {t >= 0.495 ? "Baseline — no compression yet"
               : t >= 0.455 ? "Growing at FP16"
               : "Widest at INT8"}
            </p>
          </div>

          {/* Precision reference */}
          <div className="space-y-2 pt-1 border-t border-border/30">
            {([
              { label: "FP32", t: 0.50, color: "#22c55e" },
              { label: "FP16", t: 0.46, color: "#f59e0b" },
              { label: "INT8", t: 0.42, color: "#ef4444" },
            ] as const).map(l => (
              <div key={l.label} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                     style={{ backgroundColor: Math.abs(t - l.t) < 0.025 ? l.color : "#2a2a3a" }} />
                <span className="text-[10px]"
                      style={{ color: Math.abs(t - l.t) < 0.025 ? l.color : "#555" }}>
                  {l.label} — {(computeFPR(GROUP_B, l.t) * 100).toFixed(1)}% Group B FPR
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => {
            if (frame >= THRESHOLDS.length - 1) setFrame(0);
            setPlaying(p => !p);
          }}
          className="px-4 py-1.5 rounded-lg border border-border/60 text-xs font-medium
                     hover:bg-muted/30 transition-colors flex-shrink-0"
        >
          {playing ? "Pause" : frame >= THRESHOLDS.length - 1 ? "Replay" : "Play"}
        </button>
        <input
          type="range"
          min={0}
          max={THRESHOLDS.length - 1}
          value={frame}
          onChange={e => { setPlaying(false); setFrame(Number(e.target.value)); }}
          className="flex-1 accent-purple-500 cursor-pointer"
        />
        <span className="text-[10px] text-muted-foreground w-8 text-right flex-shrink-0">
          {t >= 0.495 ? "FP32" : t >= 0.455 ? "FP16" : "INT8"}
        </span>
      </div>

      {/* Insight strip */}
      <div className="rounded-lg border border-border/40 bg-muted/10 p-4 text-xs text-muted-foreground leading-relaxed">
        <span className="font-semibold text-foreground">Why does Group B absorb more impact? </span>
        Group B clusters near the decision boundary — their training representation is thinner, so the model's
        confidence in those predictions is lower. When quantization shifts the threshold, that uncertainty resolves
        in the wrong direction. 18% of Group B sit within 0.15 units of the boundary vs 3% of Group A —
        six times the exposure to any boundary drift.
      </div>

    </div>
  );
}
