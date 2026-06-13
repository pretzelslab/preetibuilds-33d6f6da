import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  ReferenceLine, ResponsiveContainer, Tooltip,
} from "recharts";
import { DOMAINS } from "@/data/humanEvolution";
import type { DomainId } from "@/data/humanEvolution";
import { DOMAIN_TITLES } from "./shared";

const YEARS = [2026, 2031, 2036, 2041, 2046];

// ── Tooltip (no-controls trajectory chart) ───────────────────────────────────
const NoControlsTooltip = ({ active, payload, label }: {
  active?: boolean;
  label?: number;
  payload?: Array<{ dataKey: string; value: number; stroke: string }>;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-background border border-border rounded-xl p-3 shadow-xl text-xs w-64">
      <p className="font-bold mb-2">{label}</p>
      <div className="space-y-1.5">
        {payload.map(entry => {
          const domain = DOMAINS.find(d => d.id === entry.dataKey);
          if (!domain) return null;
          return (
            <div key={entry.dataKey} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: entry.stroke }} />
                {DOMAIN_TITLES[domain.id]}
              </span>
              <span className="font-semibold">{Math.round(entry.value)}</span>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-muted-foreground mt-2 pt-2 border-t border-border/40">
        ⚪ Illustrative index — the direction is the claim, not the numbers
      </p>
    </div>
  );
};

// ── The no-controls chart itself — shared by the page view, the square
//    recording view and the story video (compact drops the axis label and
//    long annotations) ─────────────────────────────────────────────────────────
export function NoControlsChart({ rows, compact, visible, hovered }: {
  rows: Record<string, number>[];
  compact?: boolean;
  visible: Record<DomainId, boolean>;
  hovered: DomainId | null;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={rows} margin={compact ? { top: 8, right: 12, bottom: 0, left: -16 } : { top: 16, right: 24, bottom: 8, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" />
        <XAxis
          dataKey="year" type="number"
          domain={[2026, 2046]} ticks={YEARS}
          tick={{ fontSize: 10, fill: "rgba(148,163,184,0.7)" }}
        />
        <YAxis
          domain={[25, 55]}
          tick={{ fontSize: 10, fill: "rgba(148,163,184,0.7)" }}
          label={compact ? undefined : { value: "Illustrative capability index", angle: -90, position: "insideLeft", offset: 12, style: { fontSize: 10, fill: "rgba(148,163,184,0.6)" } }}
        />
        <ReferenceLine
          y={50} stroke="rgba(148,163,184,0.4)" strokeDasharray="4 2"
          label={{ value: "2026 baseline", position: "insideTopRight", fill: "rgba(148,163,184,0.6)", fontSize: 9 }}
        />
        <ReferenceLine
          x={2036} stroke="rgba(148,163,184,0.35)" strokeDasharray="6 3"
          label={compact ? undefined : { value: "after 2036 forecasts get less certain", position: "insideTopLeft", fill: "rgba(148,163,184,0.6)", fontSize: 9 }}
        />
        {DOMAINS.map(d => (
          <Line
            key={d.id}
            dataKey={d.id}
            type="monotone"
            stroke={d.color}
            strokeWidth={2.5}
            strokeOpacity={hovered && hovered !== d.id ? 0.25 : 1}
            dot={false}
            activeDot={{ r: 5 }}
            hide={!visible[d.id]}
            isAnimationActive={false}
          />
        ))}
        <Tooltip content={<NoControlsTooltip />} />
      </LineChart>
    </ResponsiveContainer>
  );
}
