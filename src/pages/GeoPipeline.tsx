import { Link } from "react-router-dom";
import { ArrowLeft, Map } from "lucide-react";
import { PageGate } from "@/components/ui/PageGate";
import { DiagonalWatermark } from "@/components/ui/DiagonalWatermark";
import { useVisitLogger } from "@/hooks/useVisitLogger";

const TAGS = ["Python", "GeoPandas", "scikit-learn", "QGIS", "Random Forest", "Matplotlib"];

// ── Section label ───────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50 mb-2">
      {children}
    </p>
  );
}

// ── Feature-importance chart (inline SVG, mirrors the reviewed draft exactly) ─
function FeatureImportanceChart() {
  const bars = [
    { label: "GDP", value: "0.563", width: 413 },
    { label: "Land area", value: "0.231", width: 169, opacity: 0.78 },
    { label: "Longitude", value: "0.109", width: 80, opacity: 0.6 },
    { label: "Latitude", value: "0.098", width: 72, opacity: 0.6 },
  ];
  return (
    <>
      <svg viewBox="0 0 640 230" role="img" aria-labelledby="geoChartTitle" className="w-full h-auto mt-3">
        <title id="geoChartTitle">
          Feature importance for population prediction: GDP 0.563, land area 0.231, longitude 0.109, latitude 0.098
        </title>
        <line x1="140" y1="10" x2="140" y2="210" stroke="hsl(var(--border))" strokeWidth={1} />
        {bars.map((b, i) => {
          const y = 20 + i * 50;
          return (
            <g key={b.label}>
              <text x={130} y={y + 14} textAnchor="end" fontSize={12} fontFamily="'JetBrains Mono', monospace" fill="hsl(var(--foreground))">
                {b.label}
              </text>
              <rect x={140} y={y} width={b.width} height={24} rx={3} fill="hsl(var(--primary))" opacity={b.opacity ?? 1} />
              <text x={140 + b.width + 12} y={y + 17} fontSize={11} fontFamily="'JetBrains Mono', monospace" fill="hsl(var(--muted-foreground))">
                {b.value}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="text-center text-[11px] font-mono text-muted-foreground mt-3 leading-relaxed">
        GDP = <code className="bg-muted/60 px-1 rounded">gdp_md_est</code> · Land area ={" "}
        <code className="bg-muted/60 px-1 rounded">area_km2</code> · Longitude ={" "}
        <code className="bg-muted/60 px-1 rounded">centroid_lon</code> · Latitude ={" "}
        <code className="bg-muted/60 px-1 rounded">centroid_lat</code>
      </p>
      <p className="text-center text-[10px] font-mono text-muted-foreground/60 mt-1">
        Feature importance · population prediction · Random Forest · n = 177 countries
      </p>
    </>
  );
}

// ── Static preview (shown behind PageGate) ───────────────────────────────────
function GeoPipelinePreview() {
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border/40">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link to="/#projects" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            ← Back to Portfolio
          </Link>
          <span className="text-xs font-mono text-blue-500">Preview</span>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-6 py-12">

        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <h1 className="text-2xl font-bold">Geo Pipeline: QGIS + Python</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border bg-blue-500/10 text-blue-600 border-blue-500/20">
              Preview
            </span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
            A hands-on geospatial machine learning pipeline: load country boundaries in QGIS, engineer
            features in Python, and train a model to predict population, explained end to end in plain English.
          </p>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {TAGS.map(t => (
              <span key={t} className="text-[10px] font-mono text-slate-500 dark:text-blue-300/60 bg-slate-500/8 dark:bg-blue-500/8 border border-slate-400/15 dark:border-blue-400/20 px-2 py-0.5 rounded">
                {t}
              </span>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <SectionLabel>01 · What this experiment was</SectionLabel>
          <div className="rounded-xl border border-border/60 bg-muted/10 p-5">
            <p className="text-sm leading-relaxed mb-3">
              This project is a practice run for a complete geospatial machine-learning pipeline: the kind of
              workflow used for real problems like flood-risk mapping or land-use prediction, but built here on
              a simple, well-understood dataset so every step could be checked by hand before trusting it on
              something harder.
            </p>
            <p className="text-sm leading-relaxed">
              The dataset: a shapefile of <strong>177 country boundaries</strong>, the standard shape a GIS
              tool like QGIS works with, each one carrying a population estimate and a GDP estimate alongside
              its outline on the map.
            </p>
          </div>
        </div>

        <div className="relative rounded-xl border border-border/60 overflow-hidden mb-6">
          <div className="bg-muted/10 px-5 py-4">
            <p className="text-xs font-semibold mb-1">Feature importance — Random Forest</p>
            <p className="text-[10px] text-muted-foreground mb-4">Which of 4 signals the model actually leaned on to predict population.</p>
            <div className="blur-sm space-y-2">
              <div className="h-6 w-[85%] rounded bg-muted/40" />
              <div className="h-6 w-[45%] rounded bg-muted/40" />
              <div className="h-6 w-[25%] rounded bg-muted/40" />
              <div className="h-6 w-[22%] rounded bg-muted/40" />
            </div>
          </div>
          <DiagonalWatermark />
        </div>

        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-xs text-muted-foreground">
          <strong className="text-foreground">Key finding:</strong> R² = 0.51 — these four signals explain about
          half of what determines a country's population. Full results, the reprojection step, and what the model
          got wrong continue in the full version.
        </div>

      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function GeoPipeline() {
  useVisitLogger("/geo-pipeline");

  return (
    <PageGate pageId="geo-pipeline" backTo="/#projects" previewContent={<GeoPipelinePreview />}>
      <div className="min-h-screen bg-background relative">
        <DiagonalWatermark />

        <nav className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur-md border-border/50">
          <div className="max-w-5xl mx-auto px-6 py-4">
            <Link to="/#projects" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Portfolio
            </Link>
          </div>
        </nav>

        <div className="max-w-5xl mx-auto px-6 py-10">

          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 text-xs font-medium mb-3">
              <Map className="w-3 h-3" /> Applied Research · Geospatial ML Pipeline
            </div>
            <h1 className="text-3xl font-bold mb-2">Geo Pipeline: QGIS + Python</h1>
            <p className="text-muted-foreground max-w-2xl leading-relaxed">
              A hands-on geospatial machine learning pipeline: load country boundaries in QGIS, engineer
              features in Python, and train a model to predict population, explained end to end in plain English.
            </p>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {TAGS.map(t => (
                <span key={t} className="text-[10px] font-mono text-slate-500 dark:text-blue-300/60 bg-slate-500/8 dark:bg-blue-500/8 border border-slate-400/15 dark:border-blue-400/20 px-2 py-0.5 rounded">
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* 01 · What this experiment was */}
          <div className="mb-9">
            <SectionLabel>01 · What this experiment was</SectionLabel>
            <div className="rounded-xl border border-border/60 bg-muted/10 p-5 space-y-3 text-sm leading-relaxed">
              <p>
                This project is a practice run for a complete geospatial machine-learning pipeline: the kind of
                workflow used for real problems like flood-risk mapping or land-use prediction, but built here
                on a simple, well-understood dataset so every step could be checked by hand before trusting it
                on something harder.
              </p>
              <p>
                The dataset: a shapefile of <strong>177 country boundaries</strong>, the standard shape a GIS
                tool like QGIS works with, each one carrying a population estimate and a GDP estimate alongside
                its outline on the map.
              </p>
              <p>
                The question put to the model: using only four simple signals (how big a country is, roughly
                where it sits on the globe, and how large its economy is), how well can a computer guess how
                many people live there? Not because geography is actually the best way to estimate population
                (census data exists for that), but because it's a clean, checkable test of the full pipeline:
                shapefile in, features out, model trained, result explained.
              </p>
            </div>
          </div>

          {/* 02 · What data was loaded */}
          <div className="mb-9">
            <SectionLabel>02 · What data was loaded</SectionLabel>
            <div className="rounded-xl border border-border/60 bg-muted/10 p-5 text-sm leading-relaxed">
              <p className="mb-3">
                Data was loaded with <code className="font-mono text-[0.85em] bg-muted/60 px-1.5 py-0.5 rounded">geopandas</code>,
                the Python library for working with GIS shapefiles, directly on the file exported from QGIS.
                Each of the 177 country boundaries came with its outline geometry plus two attributes:
                population estimate (<code className="font-mono text-[0.85em] bg-muted/60 px-1.5 py-0.5 rounded">pop_est</code>)
                and GDP estimate in millions of USD (<code className="font-mono text-[0.85em] bg-muted/60 px-1.5 py-0.5 rounded">gdp_md_est</code>).
              </p>
              <p className="mb-3">
                Before anything else, the data was <strong>reprojected</strong>: moved from its original
                coordinate system into an equal-area projection (Mollweide,{" "}
                <code className="font-mono text-[0.85em] bg-muted/60 px-1.5 py-0.5 rounded">ESRI:54009</code>). This matters more
                than it sounds: on the raw, unprojected map, a square degree of longitude near the equator
                covers far more real ground than one near the poles, so area and centroid calculations would
                be systematically wrong without this step. Reprojecting first is what makes the numbers below
                trustworthy.
              </p>
              <p className="mb-2">From there, features were engineered directly from each country's shape:</p>
              <ul className="list-disc pl-5 space-y-1.5 mb-3">
                <li>
                  <code className="font-mono text-[0.85em] bg-muted/60 px-1.5 py-0.5 rounded">area_km2</code>: surface area in
                  square kilometres, from the reprojected geometry
                </li>
                <li>
                  <code className="font-mono text-[0.85em] bg-muted/60 px-1.5 py-0.5 rounded">centroid_lat</code> /{" "}
                  <code className="font-mono text-[0.85em] bg-muted/60 px-1.5 py-0.5 rounded">centroid_lon</code>: the geometric
                  centre point of each country's outline
                </li>
              </ul>
              <p>
                Combined with the two original attributes, population and GDP, that's the full feature set
                used downstream.
              </p>
              <div className="mt-4 rounded-lg border border-border/70 bg-muted/25 px-3.5 py-3 text-xs text-muted-foreground">
                <strong className="text-foreground">Caveat:</strong>{" "}
                <code className="font-mono text-[0.85em] bg-muted/60 px-1.5 py-0.5 rounded">centroid_lat</code>/
                <code className="font-mono text-[0.85em] bg-muted/60 px-1.5 py-0.5 rounded">centroid_lon</code> are the
                centroid's x/y position in the reprojected (Mollweide) coordinate system, in metres, not
                degrees. They capture each country's relative position accurately but aren't literal
                latitude/longitude.
              </div>
            </div>
          </div>

          {/* 03 · What the model did */}
          <div className="mb-9">
            <SectionLabel>03 · What the model did</SectionLabel>
            <div className="rounded-xl border border-border/60 bg-muted/10 p-5 text-sm leading-relaxed">
              <p className="mb-3">
                A <strong>Random Forest Regressor</strong> (100 decision trees, scikit-learn's default ensemble
                regressor) was trained to predict population (
                <code className="font-mono text-[0.85em] bg-muted/60 px-1.5 py-0.5 rounded">pop_est</code>) from four inputs:{" "}
                <code className="font-mono text-[0.85em] bg-muted/60 px-1.5 py-0.5 rounded">area_km2</code>,{" "}
                <code className="font-mono text-[0.85em] bg-muted/60 px-1.5 py-0.5 rounded">centroid_lat</code>,{" "}
                <code className="font-mono text-[0.85em] bg-muted/60 px-1.5 py-0.5 rounded">centroid_lon</code>, and{" "}
                <code className="font-mono text-[0.85em] bg-muted/60 px-1.5 py-0.5 rounded">gdp_md_est</code>.
              </p>
              <p className="mb-3">
                The 177 countries were split 80/20 into training and test sets, with a fixed random seed so
                the split is reproducible. The model trained on the 80% and was scored on the 20% it had never
                seen.
              </p>
              <p>
                Afterwards, scikit-learn reports each feature's <strong>importance</strong>: how much that
                input actually influenced the model's predictions, normalised so all four add up to 1.0.
                That's a different question from how accurate the model was overall (covered separately
                below); the chart below only answers which of the four inputs the model leaned on most to make
                its guesses:
              </p>
              <FeatureImportanceChart />
            </div>
          </div>

          {/* Key result */}
          <div className="mb-9">
            <SectionLabel>Key result</SectionLabel>
            <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-5">
              <p className="text-xs text-muted-foreground mb-4">
                How well the model actually did, measured on the 20% of countries it never saw during
                training:
              </p>
              <ul className="space-y-3">
                <li className="flex gap-2.5 items-baseline text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <span><strong>R² = 0.51</strong>: the model explains about half the variation in population across the 177 countries.</span>
                </li>
                <li className="flex gap-2.5 items-baseline text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <span><strong>GDP is the dominant signal</strong>: <code className="font-mono text-[0.85em] bg-muted/60 px-1.5 py-0.5 rounded">gdp_md_est</code> alone accounts for 56% of the model's decision-making, more than the other three features combined.</span>
                </li>
                <li className="flex gap-2.5 items-baseline text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <span><strong>MAE &asymp; 39.8M people</strong>: on average, predictions miss by tens of millions; population spans from under 1,000 to over 1.4 billion, so this is a coarse first pass.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* 04 · What we learned */}
          <div className="mb-9">
            <SectionLabel>04 · What we learned</SectionLabel>
            <div className="rounded-xl border border-border/60 bg-muted/10 p-5 space-y-3 text-sm leading-relaxed">
              <p>
                GDP dominates because it's a reasonable, if slightly circular, proxy: countries with more
                people tend to have larger total economies, so the model is partly re-discovering a
                correlation that was already baked into the data, not uncovering something new.
              </p>
              <p>
                Geography matters far less than expected. Once GDP is known, a country's physical size and
                where it sits on the globe add comparatively little extra predictive power:{" "}
                <code className="font-mono text-[0.85em] bg-muted/60 px-1.5 py-0.5 rounded">centroid_lon</code> and{" "}
                <code className="font-mono text-[0.85em] bg-muted/60 px-1.5 py-0.5 rounded">centroid_lat</code> together
                account for barely a fifth of the model's importance.
              </p>
              <p>
                An R² of 0.51 means these four features explain roughly half of what determines a country's
                population; the other half comes from things this model never saw: history, urbanisation,
                migration, land use, agricultural capacity, and more. A MAE of ~39.8 million people is large
                in absolute terms, but population itself ranges from a few hundred residents up to 1.4
                billion, so the error is proportionate to how wide that range is, not a sign the pipeline is
                broken.
              </p>
              <p>
                None of this was really the point, though. The goal of this exercise was to prove out a
                complete pipeline (shapefile → reprojection → feature engineering → trained model → explained
                result) on a dataset simple enough to sanity-check by hand, before pointing the same pipeline
                at a harder, real-world problem.
              </p>
            </div>
          </div>

          {/* 05 · Next steps */}
          <div className="mb-9">
            <SectionLabel>05 · Next steps</SectionLabel>
            <div className="rounded-xl border border-border/60 bg-muted/10 p-5">
              <ul className="space-y-2.5">
                <li className="flex gap-2.5 items-start text-sm">
                  <span className="font-mono text-[11px] text-muted-foreground shrink-0 pt-0.5">→</span>
                  <span>Swap in real watershed data (HydroSHEDS) in place of the country-boundary placeholder</span>
                </li>
                <li className="flex gap-2.5 items-start text-sm">
                  <span className="font-mono text-[11px] text-muted-foreground shrink-0 pt-0.5">→</span>
                  <span>Add uncertainty quantification to the model's predictions</span>
                </li>
                <li className="flex gap-2.5 items-start text-sm">
                  <span className="font-mono text-[11px] text-muted-foreground shrink-0 pt-0.5">→</span>
                  <span>Extend the pipeline to flood-risk prediction</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Stack */}
          <div>
            <SectionLabel>Stack</SectionLabel>
            <div className="rounded-xl border border-border/60 bg-muted/10 p-5">
              <div className="flex flex-wrap gap-2">
                {["Python 3.14", "GeoPandas", "Shapely", "Rasterio", "scikit-learn", "Matplotlib", "QGIS"].map(s => (
                  <span key={s} className="text-xs font-mono px-2.5 py-1 rounded-md border border-border/60 text-muted-foreground">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </PageGate>
  );
}
