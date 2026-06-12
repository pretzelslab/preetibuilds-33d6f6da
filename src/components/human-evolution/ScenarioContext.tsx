import { createContext, useContext, useState, ReactNode } from "react";
import { SCENARIOS } from "@/data/humanEvolution";
import type { ScenarioId } from "@/data/humanEvolution";

interface ScenarioContextValue {
  scenario: ScenarioId;
  setScenario: (s: ScenarioId) => void;
}

const ScenarioContext = createContext<ScenarioContextValue>({
  scenario: "B",
  setScenario: () => {},
});

export function ScenarioProvider({ children }: { children: ReactNode }) {
  const [scenario, setScenario] = useState<ScenarioId>("B");
  return (
    <ScenarioContext.Provider value={{ scenario, setScenario }}>
      {children}
    </ScenarioContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useScenario(): ScenarioContextValue {
  return useContext(ScenarioContext);
}

/** Segmented A/B/C control — one toggle drives every scenario-aware viz. Sticky below the tab bar. */
export function ScenarioToggle() {
  const { scenario, setScenario } = useScenario();
  return (
    <div className="sticky top-14 z-40 bg-background/95 backdrop-blur border-b border-border/40 py-3 mb-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground mr-1">Which future?</span>
        {SCENARIOS.map(s => {
          const active = scenario === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setScenario(s.id)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                active
                  ? "bg-foreground text-background border-foreground"
                  : "border-border/60 text-muted-foreground hover:text-foreground hover:border-foreground/40"
              }`}
              aria-pressed={active}
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
              {s.id} · {s.name}
              <span className={active ? "opacity-70" : "text-muted-foreground"}>
                ({s.id === "B" ? "current path" : s.kind.toLowerCase()})
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
