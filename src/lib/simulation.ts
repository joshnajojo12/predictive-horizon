export type PatMode = "FIND" | "KEEP" | "GET-BACK" | "AUTO";
export type TargetStatus = "SEARCHING" | "DETECTED" | "LOCKED" | "LOST";
export type ScenarioName =
  | "NORMAL"
  | "LARGE INITIAL ERROR"
  | "EPHEMERIS ERROR"
  | "ATTITUDE ERROR"
  | "VIBRATION"
  | "CAMERA NOISE"
  | "TARGET LOSS"
  | "COMBINED DISTURBANCE";
export type SimulationSpeed = 0.5 | 1 | 2 | 5;

export interface PixelCoordinate {
  x: number;
  y: number;
}

export interface TargetState {
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  angularVelocity: number;
}

export interface CameraState {
  fov: number;
  resolution: string;
  center: PixelCoordinate;
  predictedPixel: PixelCoordinate;
  actualPixel: PixelCoordinate;
}

export interface PATState {
  mode: PatMode;
  targetStatus: TargetStatus;
  confidence: number;
  gimbalAngle: { pan: number; tilt: number };
  gimbalCommand: { pan: number; tilt: number };
}

export interface Telemetry {
  timestamp: number;
  targetPosition: PixelCoordinate;
  predictedPosition: PixelCoordinate;
  actualPosition: PixelCoordinate;
  pointingError: number;
}

export interface EventEntry {
  timestamp: string;
  message: string;
  tone: "neutral" | "signal" | "success" | "warning";
}

export interface ScenarioConfig {
  initialPointingError: number;
  targetAngularVelocity: number;
  vibrationAmplitude: number;
  vibrationFrequency: number;
  ephemerisError: number;
  attitudeError: number;
  cameraNoise: number;
  gimbalDelay: number;
}

export interface ExperimentResult {
  label: string;
  acquisitionTime: number;
  reacquisitionTime: number;
  movements: number;
  framesBeforeAcquisition: number;
  trackingRmse: number;
  maxPointingError: number;
  lockRetention: number;
}

export interface SimulationState {
  timestamp: number;
  displayTime: string;
  running: boolean;
  scenario: ScenarioName;
  speed: SimulationSpeed;
  targetVisible: boolean;
  target: TargetState;
  camera: CameraState;
  pat: PATState;
  pixelResidual: PixelCoordinate;
  angularError: { pan: number; tilt: number };
  fps: number;
  processingLatency: number;
  acquisitionTime: number;
  trackingRmse: number;
  telemetry: Telemetry[];
  events: EventEntry[];
  experimentResults: ExperimentResult[];
}

const scenarios: ScenarioName[] = [
  "NORMAL",
  "LARGE INITIAL ERROR",
  "EPHEMERIS ERROR",
  "ATTITUDE ERROR",
  "VIBRATION",
  "CAMERA NOISE",
  "TARGET LOSS",
  "COMBINED DISTURBANCE",
];

export const scenarioOptions = scenarios;
export const modeOptions: PatMode[] = ["FIND", "KEEP", "GET-BACK", "AUTO"];
export const speedOptions: SimulationSpeed[] = [0.5, 1, 2, 5];

const initialEvents: EventEntry[] = [
  { timestamp: "12:04:21.002", message: "STATE → FIND", tone: "signal" },
  { timestamp: "12:04:21.110", message: "LOS PREDICTED", tone: "neutral" },
  { timestamp: "12:04:21.180", message: "CAMERA POINTED", tone: "neutral" },
  { timestamp: "12:04:21.245", message: "BEACON DETECTED", tone: "success" },
  { timestamp: "12:04:21.260", message: "VISUAL RESIDUAL CALCULATED", tone: "neutral" },
  { timestamp: "12:04:21.410", message: "TARGET ACQUIRED", tone: "warning" },
];

const seedTelemetry = (): Telemetry[] =>
  Array.from({ length: 32 }, (_, index) => {
    const phase = index / 5;
    const predicted = 48 + Math.sin(phase) * 18;
    const actual = predicted + 9 - index * 0.2;
    return {
      timestamp: index * 0.1,
      targetPosition: { x: actual, y: 52 + Math.cos(phase) * 12 },
      predictedPosition: { x: predicted, y: 50 + Math.cos(phase) * 10 },
      actualPosition: { x: actual, y: 52 + Math.cos(phase) * 12 },
      pointingError: Math.max(1.2, 20 - index * 0.55),
    };
  });

export const defaultScenarioConfig: ScenarioConfig = {
  initialPointingError: 2.4,
  targetAngularVelocity: 0.042,
  vibrationAmplitude: 0.08,
  vibrationFrequency: 18,
  ephemerisError: 0.12,
  attitudeError: 0.08,
  cameraNoise: 0.04,
  gimbalDelay: 14,
};

export const createInitialSimulationState = (): SimulationState => ({
  timestamp: 261.28,
  displayTime: "12:04:21.280",
  running: true,
  scenario: "NORMAL",
  speed: 1,
  targetVisible: true,
  target: {
    position: { x: 214.6, y: -38.4, z: 0 },
    velocity: { x: 0.2, y: -0.04, z: 0 },
    angularVelocity: 0.042,
  },
  camera: {
    fov: 0.5,
    resolution: "512×512",
    center: { x: 256, y: 256 },
    predictedPixel: { x: 294, y: 225 },
    actualPixel: { x: 258, y: 267 },
  },
  pat: {
    mode: "FIND",
    targetStatus: "DETECTED",
    confidence: 84,
    gimbalAngle: { pan: 1.8, tilt: -2.1 },
    gimbalCommand: { pan: 0.012, tilt: -0.014 },
  },
  pixelResidual: { x: -35.3, y: 41.2 },
  angularError: { pan: -0.012, tilt: 0.014 },
  fps: 58,
  processingLatency: 14,
  acquisitionTime: 0.41,
  trackingRmse: 0.0032,
  telemetry: seedTelemetry(),
  events: initialEvents,
  experimentResults: [
    {
      label: "BASELINE",
      acquisitionTime: 2.84,
      reacquisitionTime: 1.62,
      movements: 47,
      framesBeforeAcquisition: 312,
      trackingRmse: 0.0041,
      maxPointingError: 3.2,
      lockRetention: 88,
    },
    {
      label: "PROPOSED",
      acquisitionTime: 0.41,
      reacquisitionTime: 0.31,
      movements: 6,
      framesBeforeAcquisition: 49,
      trackingRmse: 0.0014,
      maxPointingError: 0.62,
      lockRetention: 97,
    },
  ],
});

export const simulationService = {
  startSimulation: (state: SimulationState): SimulationState => ({ ...state, running: true }),
  pauseSimulation: (state: SimulationState): SimulationState => ({ ...state, running: false }),
  resetSimulation: (): SimulationState => createInitialSimulationState(),
  setScenario: (state: SimulationState, scenario: ScenarioName): SimulationState => ({
    ...state,
    scenario,
    pat: { ...state.pat, targetStatus: scenario === "TARGET LOSS" ? "LOST" : "DETECTED" },
    targetVisible: scenario !== "TARGET LOSS",
  }),
  setSpeed: (state: SimulationState, speed: SimulationSpeed): SimulationState => ({ ...state, speed }),
  setMode: (state: SimulationState, mode: PatMode): SimulationState => ({
    ...state,
    pat: { ...state.pat, mode },
  }),
  runExperiment: (state: SimulationState, label: "BASELINE" | "PROPOSED" | "COMPARISON") => {
    const results = state.experimentResults.map((result) =>
      label === "COMPARISON" || result.label === label
        ? {
            ...result,
            acquisitionTime: +(result.acquisitionTime * (0.94 + Math.random() * 0.08)).toFixed(2),
            reacquisitionTime: +(result.reacquisitionTime * (0.94 + Math.random() * 0.08)).toFixed(2),
          }
        : result,
    );
    return { ...state, experimentResults: results };
  },
};

export const advanceSimulation = (state: SimulationState): SimulationState => {
  if (!state.running) return state;
  const nextTimestamp = state.timestamp + 0.08 * state.speed;
  const phase = nextTimestamp * 0.7;
  const scenarioPenalty = state.scenario === "LARGE INITIAL ERROR" ? 1.5 : state.scenario === "COMBINED DISTURBANCE" ? 1.9 : 1;
  const lossWindow = state.scenario === "TARGET LOSS" && Math.floor(nextTimestamp) % 8 >= 6;
  const residualScale = Math.max(0.08, 1 - ((nextTimestamp % 12) / 12) * 0.72);
  const predicted = {
    x: 256 + Math.sin(phase) * 42 * scenarioPenalty,
    y: 256 + Math.cos(phase * 0.86) * 31 * scenarioPenalty,
  };
  const actual = {
    x: predicted.x + Math.cos(phase * 1.3) * 30 * residualScale,
    y: predicted.y + Math.sin(phase * 1.15) * 27 * residualScale,
  };
  const residual = { x: actual.x - predicted.x, y: actual.y - predicted.y };
  const pointingError = Math.sqrt(residual.x ** 2 + residual.y ** 2) / 20;
  const status: TargetStatus = lossWindow ? "LOST" : pointingError < 2.5 ? "LOCKED" : "DETECTED";
  const mode: PatMode = state.pat.mode === "AUTO" ? (lossWindow ? "GET-BACK" : status === "LOCKED" ? "KEEP" : "FIND") : state.pat.mode;
  const nextTelemetry = [
    ...state.telemetry.slice(-47),
    {
      timestamp: nextTimestamp,
      targetPosition: actual,
      predictedPosition: predicted,
      actualPosition: actual,
      pointingError,
    },
  ];
  const nextEvent = status === "LOST" && state.pat.targetStatus !== "LOST"
    ? { timestamp: formatTime(nextTimestamp), message: "TARGET LOST · GET-BACK INITIATED", tone: "warning" as const }
    : status === "LOCKED" && state.pat.targetStatus !== "LOCKED"
      ? { timestamp: formatTime(nextTimestamp), message: "LOCK ESTABLISHED", tone: "success" as const }
      : null;
  return {
    ...state,
    timestamp: nextTimestamp,
    displayTime: formatTime(nextTimestamp),
    targetVisible: !lossWindow,
    camera: { ...state.camera, predictedPixel: predicted, actualPixel: actual },
    pat: {
      ...state.pat,
      mode,
      targetStatus: status,
      confidence: lossWindow ? 0 : Math.min(99.8, 84 + (2.5 - Math.min(pointingError, 2.5)) * 5),
      gimbalCommand: { pan: -residual.x / 280, tilt: -residual.y / 280 },
    },
    pixelResidual: residual,
    angularError: { pan: residual.x / 2900, tilt: residual.y / 2900 },
    fps: 56 + Math.round(Math.sin(phase) * 3),
    processingLatency: 13 + Math.round(Math.abs(Math.cos(phase)) * 4),
    acquisitionTime: status === "LOCKED" ? 0.41 : +(0.41 + pointingError * 0.08).toFixed(2),
    trackingRmse: +(0.0018 + pointingError / 3000).toFixed(4),
    telemetry: nextTelemetry,
    events: nextEvent ? [...state.events.slice(-7), nextEvent] : state.events,
  };
};

const formatTime = (timestamp: number) => {
  const seconds = timestamp % 60;
  return `12:04:${seconds.toFixed(3).padStart(6, "0")}`;
};