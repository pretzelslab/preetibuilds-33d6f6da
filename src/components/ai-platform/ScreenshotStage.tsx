import { useState } from "react";

interface ScreenshotStageProps {
  src: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
  startRevealed?: boolean;
}

// Presents a white application screenshot inside a dark, charcoal "device stage"
// so it doesn't glare against the portfolio's dark theme. Dimmed by default;
// clears on hover, keyboard focus, or the explicit "View details" toggle —
// never falls back to raw full-brightness white-on-black. In admin/local review
// mode, startRevealed skips the dimming so nothing is hidden by default.
export function ScreenshotStage({ src, alt, caption, width, height, startRevealed = false }: ScreenshotStageProps) {
  const [loaded, setLoaded] = useState(false);
  const [revealed, setRevealed] = useState(startRevealed);

  return (
    <figure className="my-2">
      <div className="group relative rounded-2xl border border-zinc-800 bg-zinc-900 p-3 sm:p-4 shadow-lg shadow-black/30">
        <div className="flex items-center gap-1.5 mb-3 px-1" aria-hidden="true">
          <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
          <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
          <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
        </div>

        <div
          className="relative rounded-lg overflow-hidden border border-zinc-800/80"
          style={{ aspectRatio: `${width} / ${height}` }}
        >
          {!loaded && (
            <div className="absolute inset-0 animate-pulse motion-reduce:animate-none bg-zinc-800" aria-hidden="true" />
          )}

          <img
            src={src}
            alt={alt}
            width={width}
            height={height}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            className={[
              "w-full h-auto block transition-[filter,opacity] motion-reduce:transition-none duration-300",
              loaded ? "opacity-100" : "opacity-0",
              !revealed && "brightness-[0.85] contrast-[0.97] saturate-[0.95]",
              "group-hover:brightness-100 group-hover:contrast-100 group-hover:saturate-100",
              "group-focus-within:brightness-100 group-focus-within:contrast-100 group-focus-within:saturate-100",
            ].filter(Boolean).join(" ")}
          />

          {/* soft vignette so the white UI doesn't hit a hard edge against the stage */}
          <div
            aria-hidden="true"
            className={[
              "pointer-events-none absolute inset-0 transition-opacity motion-reduce:transition-none duration-300",
              revealed ? "opacity-0" : "opacity-100",
              "group-hover:opacity-0 group-focus-within:opacity-0",
            ].join(" ")}
            style={{ boxShadow: "inset 0 0 70px 18px rgba(0,0,0,0.45)", background: "rgba(10,10,14,0.12)" }}
          />
        </div>

        <button
          type="button"
          onClick={() => setRevealed((r) => !r)}
          className="mt-3 text-[11px] font-medium text-zinc-400 hover:text-zinc-200 transition-colors inline-flex items-center gap-1"
        >
          {revealed ? "Dim preview" : "View details"}
          <span aria-hidden="true">{revealed ? "–" : "+"}</span>
        </button>
      </div>
      <figcaption className="mt-2 text-xs text-muted-foreground leading-relaxed">{caption}</figcaption>
    </figure>
  );
}
