import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import {
  advanceSimulation,
  createInitialSimulationState,
  simulationService,
  type PatMode,
  type ScenarioName,
  type SimulationSpeed,
  type SimulationState,
} from "@/lib/simulation";

interface SimulationContextValue {
  state: SimulationState;
  start: () => void;
  pause: () => void;
  reset: () => void;
  setScenario: (scenario: ScenarioName) => void;
  setMode: (mode: PatMode) => void;
  setSpeed: (speed: SimulationSpeed) => void;
  runExperiment: (label: "BASELINE" | "PROPOSED" | "COMPARISON") => void;
}

const SimulationContext = createContext<SimulationContextValue | null>(null);

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(createInitialSimulationState);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setState((current) => advanceSimulation(current));
    }, 80);
    return () => window.clearInterval(timer);
  }, []);

  const value = useMemo<SimulationContextValue>(
    () => ({
      state,
      start: () => setState((current) => simulationService.startSimulation(current)),
      pause: () => setState((current) => simulationService.pauseSimulation(current)),
      reset: () => setState(simulationService.resetSimulation()),
      setScenario: (scenario) => setState((current) => simulationService.setScenario(current, scenario)),
      setMode: (mode) => setState((current) => simulationService.setMode(current, mode)),
      setSpeed: (speed) => setState((current) => simulationService.setSpeed(current, speed)),
      runExperiment: (label) => setState((current) => simulationService.runExperiment(current, label)),
    }),
    [state],
  );

  return <SimulationContext.Provider value={value}>{children}</SimulationContext.Provider>;
}

export function useSimulation() {
  const context = useContext(SimulationContext);
  if (!context) throw new Error("useSimulation must be used inside SimulationProvider");
  return context;
}