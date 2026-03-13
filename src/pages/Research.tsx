import { useRef } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from "recharts";

const nationalTrend = [
  { year: "2013", cases: 33707 },
  { year: "2014", cases: 36735 },
  { year: "2015", cases: 34651 },
  { year: "2016", cases: 38947 },
  { year: "2017", cases: 32559 },
  { year: "2018", cases: 33356 },
  { year: "2019", cases: 32033 },
  { year: "2020", cases: 28046 },
  { year: "2021", cases: 31677 },
  { year: "2022", cases: 31516 },
];

const backlogData = [
  { year: "2013", pending: 100788 },
  { year: "2016", pending: 138792 },
  { year: "2019", pending: 167170 },
  { year: "2022", pending: 198285 },
];

const stateData = [
  { state: "Rajasthan", cases: 5399 },
  { state: "Uttar Pradesh", cases: 3690 },
  { state: "Madhya Pradesh", cases: 3029 },
  { state: "Maharashtra", cases: 2904 },
  { state: "Haryana", cases: 1787 },
  { state: "Odisha", cases: 1464 },
  { state: "Jharkhand", cases: 1298 },
  { state: "Chhattisgarh", cases: 1246 },
  { state: "Delhi", cases: 1212 },
  { state: "Assam", cases: 1113 },
];

const statTiles = [
  { value: "38,947", label: "Peak reported cases (2016)", scrollTo: "chart-trend" },
  { value: "88.7%", label: "Rapes by a known person (2021)", scrollTo: "chart-trend" },
  { value: "12.38%", label: "Max trial completion rate (any year 2013–2022)", scrollTo: "chart-backlog" },
  { value: "198,285", label: "Pending trial backlog (end of 2022)", scrollTo: "chart-backlog" },
];

const Research = () => {
  const chartRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const scrollTo = (id: string) => {
    chartRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-6 py-16 space-y-12">
        {/* Header */}
        <div className="rounded-xl border border-border bg-card p-8 shadow-card">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            India Rape Statistics: NCRB Dataset 2013–2022
          </h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            Empirical research on rape case incidence and justice outcomes in India, built from primary NCRB annual{" "}
            <em>Crime in India</em> reports, cross-verified against CHRI independent analysis (October 2024).
          </p>
          <p className="mt-3 text-xs text-muted-foreground/70">
            Data source: National Crime Records Bureau. Research context: AI safety and real-time threat detection.
          </p>
        </div>

        {/* Stat Tiles */}
        <div className="grid grid-cols-2 gap-4">
          {statTiles.map((tile) => (
            <button
              key={tile.value}
              onClick={() => scrollTo(tile.scrollTo)}
              className="rounded-xl border border-border bg-card p-6 text-left shadow-card transition-colors hover:border-primary/30 hover:shadow-elegant cursor-pointer"
            >
              <p className="text-2xl font-semibold font-mono text-foreground">{tile.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{tile.label}</p>
            </button>
          ))}
        </div>

        {/* Chart 1 */}
        <section ref={(el) => { chartRefs.current["chart-trend"] = el; }} className="scroll-mt-8 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">National Trend 2013–2022</h2>
            <p className="text-sm text-muted-foreground">Reported rape cases per year across India.</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 shadow-card">
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={nationalTrend} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 88%)" />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} stroke="hsl(220 10% 50%)" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(220 10% 50%)" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [v.toLocaleString(), "Cases"]} />
                <Line type="monotone" dataKey="cases" stroke="hsl(250 30% 40%)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
            <p className="mt-4 text-xs text-muted-foreground/70 leading-relaxed">
              2017 drop reflects NCRB methodology change, not a real decline. 2020 drop coincides with COVID lockdowns.
            </p>
          </div>
        </section>

        {/* Chart 2 */}
        <section ref={(el) => { chartRefs.current["chart-backlog"] = el; }} className="scroll-mt-8 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Justice Pipeline: Trial Backlog Growth</h2>
            <p className="text-sm text-muted-foreground">Cumulative pending rape trials at end of year.</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 shadow-card">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={backlogData} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 88%)" />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} stroke="hsl(220 10% 50%)" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(220 10% 50%)" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [v.toLocaleString(), "Pending"]} />
                <Bar dataKey="pending" fill="hsl(250 30% 40%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <p className="mt-4 text-xs text-muted-foreground/70 leading-relaxed">
              Trial completion rate never exceeded 13% in any year across this period.
            </p>
          </div>
        </section>

        {/* Chart 3 */}
        <section ref={(el) => { chartRefs.current["chart-states"] = el; }} className="scroll-mt-8 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Top States by Reported Cases (2022)</h2>
            <p className="text-sm text-muted-foreground">Ten highest-reporting states/UTs.</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 shadow-card">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={stateData} layout="vertical" margin={{ top: 8, right: 16, bottom: 8, left: 100 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 88%)" />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(220 10% 50%)" tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`} />
                <YAxis type="category" dataKey="state" tick={{ fontSize: 12 }} stroke="hsl(220 10% 50%)" width={95} />
                <Tooltip formatter={(v: number) => [v.toLocaleString(), "Cases"]} />
                <Bar dataKey="cases" fill="hsl(165 25% 36%)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Footer note */}
        <footer className="border-t border-border pt-8 pb-4">
          <p className="text-xs text-muted-foreground/60 leading-relaxed">
            All figures sourced from NCRB <em>Crime in India</em> annual reports and cross-verified against CHRI (October 2024).
            Dataset and pipeline code:{" "}
            <a
              href="https://github.com/pretzelslab/india-rape-statistics-ncrb"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground transition-colors"
            >
              github.com/pretzelslab/india-rape-statistics-ncrb
            </a>{" "}
            (available upon request).
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Research;
