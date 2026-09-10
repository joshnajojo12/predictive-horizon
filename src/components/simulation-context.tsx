import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import {
  advanceSimulation,
  createInitialSimulationState,
  formatTime,
  simulationService,
  type PatMode,
  type ScenarioName,
  type SimulationSpeed,
  type SimulationState,
  type TargetStatus,
} from "@/lib/simulation";

import {
  fetchSimulationState,
  postStartSimulation,
  postStopSimulation,
  postResetSimulation,
  postScenario,
  postAlgorithmMode,
  postRunExperiment,
} from "@/lib/api";

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
    let isMounted = true;

    const timer = window.setInterval(async () => {
      try {
        const backendState = await fetchSimulationState();
        if (!isMounted) return;

        if (backendState) {
          setState((current) => {
            const pointingError = Math.hypot(backendState.pixelResidual.x, backendState.pixelResidual.y) / 20;
            const nextTelemetry = [
              ...current.telemetry.slice(-47),
              {
                timestamp: backendState.timestamp,
                targetPosition: backendState.cameraActualPixel,
                predictedPosition: backendState.cameraPredictedPixel,
                actualPosition: backendState.cameraActualPixel,
                pointingError,
              },
            ];

            return {
              ...current,
              timestamp: backendState.timestamp,
              displayTime: formatTime(backendState.timestamp),
              running: backendState.running,
              targetVisible: backendState.targetVisible,
              camera: {
                ...current.camera,
                actualPixel: backendState.cameraActualPixel,
                predictedPixel: backendState.cameraPredictedPixel,
              },
              pat: {
                ...current.pat,
                mode: (backendState.pat.mode as PatMode) || current.pat.mode,
                targetStatus: (backendState.pat.targetStatus as TargetStatus) || current.pat.targetStatus,
                confidence: backendState.pat.confidence,
                gimbalCommand: {
                  pan: backendState.pat.gimbalCommand.x,
                  tilt: backendState.pat.gimbalCommand.y,
                },
                gimbalAngle: {
                  pan: backendState.pat.gimbalCommand.x,
                  tilt: backendState.pat.gimbalCommand.y,
                },
              },
              pixelResidual: backendState.pixelResidual,
              angularError: {
                pan: backendState.pixelResidual.x / 2900,
                tilt: backendState.pixelResidual.y / 2900,
              },
              telemetry: nextTelemetry,
              acquisitionTime:
                backendState.pat.targetStatus === "ACQUIRED"
                  ? Math.min(current.acquisitionTime, backendState.timestamp || 0.41)
                  : current.acquisitionTime,
              trackingRmse: +(0.0014 + pointingError / 4000).toFixed(4),
            };
          });
        } else {
          // Offline fallback
          setState((current) => advanceSimulation(current));
        }
      } catch {
        if (isMounted) {
          setState((current) => advanceSimulation(current));
        }
      }
    }, 80);

    return () => {
      isMounted = false;
      window.clearInterval(timer);
    };
  }, []);

  const value = useMemo<SimulationContextValue>(
    () => ({
      state,
      start: () => {
        postStartSimulation();
        setState((current) => simulationService.startSimulation(current));
      },
      pause: () => {
        postStopSimulation();
        setState((current) => simulationService.pauseSimulation(current));
      },
      reset: () => {
        postResetSimulation();
        setState(simulationService.resetSimulation());
      },
      setScenario: (scenario) => {
        postScenario(scenario);
        setState((current) => simulationService.setScenario(current, scenario));
      },
      setMode: (mode) => {
        postAlgorithmMode(mode);
        setState((current) => simulationService.setMode(current, mode));
      },
      setSpeed: (speed) => setState((current) => simulationService.setSpeed(current, speed)),
      runExperiment: async (label) => {
        const result = await postRunExperiment(state.scenario);
        if (result && result.baseline && result.proposed) {
          setState((current) => ({
            ...current,
            experimentResults: [
              {
                label: "BASELINE",
                acquisitionTime: result.baseline.acquisition_time,
                reacquisitionTime: result.baseline.reacquisition_time,
                movements: result.baseline.movements,
                framesBeforeAcquisition: result.baseline.frames_before_acquisition,
                trackingRmse: result.baseline.tracking_rmse,
                maxPointingError: result.baseline.max_pointing_error,
                lockRetention: result.baseline.lock_retention,
              },
              {
                label: "PROPOSED",
                acquisitionTime: result.proposed.acquisition_time,
                reacquisitionTime: result.proposed.reacquisition_time,
                movements: result.proposed.movements,
                framesBeforeAcquisition: result.proposed.frames_before_acquisition,
                trackingRmse: result.proposed.tracking_rmse,
                maxPointingError: result.proposed.max_pointing_error,
                lockRetention: result.proposed.lock_retention,
              },
            ],
          }));
        } else {
          setState((current) => simulationService.runExperiment(current, label));
        }
      },
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