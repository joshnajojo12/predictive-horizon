export type PatMode = "FIND" | "KEEP" | "GET-BACK" | "AUTO";
export type TargetStatus = "SEARCHING" | "DETECTED" | "LOCKED" | "LOST";
export type AcquisitionPhase = "FIND" | "HEX SEARCH" | "LOCK" | "KEEP" | "DISTURBANCE" | "TARGET LOST" | "GET-BACK" | "REACQUIRE" | "REACQUIRED";
export type SearchPointStatus = "UNVISITED" | "CURRENT" | "CHECKED" | "FOUND";
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

export interface SearchPoint extends PixelCoordinate {
  id: number;
  q: number;
  r: number;
  order: number;
  status: SearchPointStatus;
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
  phase: AcquisitionPhase;
  acquisitionStage: AcquisitionPhase;
  predictedPosition: PixelCoordinate;
  actualTargetPosition: PixelCoordinate;
  searchCenter: PixelCoordinate;
  searchPoints: SearchPoint[];
  currentSearchPoint: number | null;
  checkedPoints: number[];
  targetFound: boolean;
  trackingError: number;
  disturbanceLevel: number;
  lastKnownPosition: PixelCoordinate;
  predictedReacquisitionPosition: PixelCoordinate;
  reacquisitionTime: number;
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

const axialRing = (radius: number) => {
  const points: Array<{ q: number; r: number }> = [];
  if (radius === 0) return [{ q: 0, r: 0 }];
  let q = -radius;
  let r = radius;
  const directions = [[1, 0], [0, -1], [-1, -1], [-1, 0], [0, 1], [1, 1]];
  for (const [dq, dr] of directions) {
    for (let step = 0; step < radius; step += 1) {
      points.push({ q, r });
      q += dq;
      r += dr;
    }
  }
  return points;
};

export const createHexSearch = (center: PixelCoordinate, rings = 2): SearchPoint[] => {
  const points = Array.from({ length: rings + 1 }, (_, radius) => axialRing(radius)).flat();
  return points.map(({ q, r }, id) => ({
    id,
    q,
    r,
    order: id + 1,
    x: center.x + 38 * (q + r * 0.5),
    y: center.y + 38 * 0.866 * r,
    status: id === 0 ? "CURRENT" : "UNVISITED",
  }));
};

const initialSearchCenter = { x: 256, y: 256 };
const initialSearchPoints = createHexSearch(initialSearchCenter);
const initialTarget = { x: initialSearchPoints[7]?.x ?? 313, y: initialSearchPoints[7]?.y ?? 289 };

const addEvent = (state: SimulationState, message: string, tone: EventEntry["tone"], timestamp = state.timestamp): EventEntry[] => [
  ...state.events.slice(-7),
  { timestamp: formatTime(timestamp), message, tone },
];

const withSearchState = (center: PixelCoordinate, targetIndex: number): Pick<SimulationState, "searchCenter" | "searchPoints" | "currentSearchPoint" | "checkedPoints" | "targetFound" | "actualTargetPosition"> => {
  const points = createHexSearch(center);
  const target = points[targetIndex] ?? points[7];
  return {
    searchCenter: center,
    searchPoints: points,
    currentSearchPoint: 0,
    checkedPoints: [],
    targetFound: false,
    actualTargetPosition: { x: target.x + 3, y: target.y - 2 },
  };
};

export const createInitialSimulationState = (): SimulationState => ({
  timestamp: 261.28,
  displayTime: "12:04:21.280",
  running: true,
  scenario: "NORMAL",
  speed: 1,
  targetVisible: false,
  target: {
    position: { x: 214.6, y: -38.4, z: 0 },
    velocity: { x: 0.2, y: -0.04, z: 0 },
    angularVelocity: 0.042,
  },
  camera: {
    fov: 0.5,
    resolution: "512×512",
    center: { x: 256, y: 256 },
    predictedPixel: initialSearchCenter,
    actualPixel: initialTarget,
  },
  pat: {
    mode: "FIND",
    targetStatus: "SEARCHING",
    confidence: 0,
    gimbalAngle: { pan: 1.8, tilt: -2.1 },
    gimbalCommand: { pan: 0.012, tilt: -0.014 },
  },
  pixelResidual: { x: 0, y: 0 },
  angularError: { pan: 0, tilt: 0 },
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
  phase: "FIND",
  acquisitionStage: "FIND",
  predictedPosition: initialSearchCenter,
  actualTargetPosition: initialTarget,
  searchCenter: initialSearchCenter,
  searchPoints: initialSearchPoints,
  currentSearchPoint: 0,
  checkedPoints: [],
  targetFound: false,
  trackingError: 0,
  disturbanceLevel: 0,
  lastKnownPosition: initialTarget,
  predictedReacquisitionPosition: initialTarget,
  reacquisitionTime: 0,
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
  triggerDisturbance: (state: SimulationState): SimulationState => {
    if (state.phase !== "KEEP") return state;
    return {
      ...state,
      phase: "DISTURBANCE",
      acquisitionStage: "DISTURBANCE",
      disturbanceLevel: 0.9,
      events: addEvent(state, "DISTURBANCE TRIGGERED · VIBRATION 0.90 G", "warning"),
    };
  },
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
  const elapsed = nextTimestamp - 261.28;
  const cycle = elapsed;
  let next = { ...state, timestamp: nextTimestamp, displayTime: formatTime(nextTimestamp) };
  const phase = state.phase;
  const targetIndex = 7;
  const point = state.currentSearchPoint === null ? null : state.searchPoints[state.currentSearchPoint];
  const searchDuration = phase === "REACQUIRE" ? 0.32 : 0.4;

  if (phase === "FIND" && cycle >= 1.2) {
    next = { ...next, phase: "HEX SEARCH", acquisitionStage: "HEX SEARCH", ...withSearchState(initialSearchCenter, targetIndex), targetVisible: false, events: addEvent(next, "PREDICTION MISS · HEX SEARCH INITIATED", "warning", nextTimestamp) };
  } else if (phase === "HEX SEARCH" && point && cycle >= 1.2 + (point.order + 1) * searchDuration) {
    const nextIndex = point.id + 1;
    const checked = [...state.checkedPoints, point.id];
    if (point.id === targetIndex) {
      next = { ...next, phase: "LOCK", acquisitionStage: "LOCK", targetVisible: true, targetFound: true, currentSearchPoint: point.id, checkedPoints: checked, searchPoints: state.searchPoints.map((item) => ({ ...item, status: item.id === point.id ? "FOUND" : item.status === "CURRENT" ? "CHECKED" : item.status })), events: addEvent(next, "TARGET FOUND · BEACON INSIDE CURRENT FOV", "success", nextTimestamp) };
    } else {
      next = { ...next, currentSearchPoint: nextIndex < state.searchPoints.length ? nextIndex : 0, checkedPoints: checked, searchPoints: state.searchPoints.map((item) => ({ ...item, status: item.id === nextIndex ? "CURRENT" : item.id <= point.id ? "CHECKED" : item.status })) };
    }
  } else if (phase === "LOCK" && cycle >= (state.targetFound ? 5.8 : 2.0)) {
    next = { ...next, phase: "KEEP", acquisitionStage: "KEEP", targetVisible: true, pat: { ...state.pat, mode: "KEEP", targetStatus: "LOCKED", confidence: 96 }, events: addEvent(next, "LOCK CONFIRMED · KEEP ENABLED", "success", nextTimestamp) };
  } else if (phase === "KEEP" && state.disturbanceLevel === 0 && cycle >= 10) {
    next = simulationService.triggerDisturbance(state);
    next.timestamp = nextTimestamp;
    next.displayTime = formatTime(nextTimestamp);
  } else if (phase === "DISTURBANCE" && state.disturbanceLevel > 0 && cycle >= 11.0) {
    next = { ...next, phase: "TARGET LOST", acquisitionStage: "TARGET LOST", targetVisible: false, disturbanceLevel: 1, lastKnownPosition: state.actualTargetPosition, events: addEvent(next, "TARGET LOST · GET-BACK REQUESTED", "warning", nextTimestamp) };
  } else if (phase === "TARGET LOST" && cycle >= 11.5) {
    const predictedReacquisitionPosition = { x: state.lastKnownPosition.x + 16, y: state.lastKnownPosition.y + 8 };
    next = { ...next, phase: "GET-BACK", acquisitionStage: "GET-BACK", predictedReacquisitionPosition, events: addEvent(next, "MOTION PREDICTION · LOCAL SEARCH RE-CENTERED", "signal", nextTimestamp), ...withSearchState(predictedReacquisitionPosition, 3), targetVisible: false };
  } else if (phase === "GET-BACK" && cycle >= 11.8) {
    next = { ...next, phase: "REACQUIRE", acquisitionStage: "REACQUIRE", events: addEvent(next, "GET-BACK · SEARCHING NEARBY POINTS FIRST", "signal", nextTimestamp) };
  } else if (phase === "REACQUIRE" && point && cycle >= 11.8 + (point.order + 1) * searchDuration) {
    const nextIndex = point.id + 1;
    const checked = [...state.checkedPoints, point.id];
    if (point.id === 3) {
      next = { ...next, phase: "REACQUIRED", acquisitionStage: "REACQUIRED", targetVisible: true, targetFound: true, currentSearchPoint: point.id, checkedPoints: checked, reacquisitionTime: +(nextTimestamp - 11.5).toFixed(2), searchPoints: state.searchPoints.map((item) => ({ ...item, status: item.id === point.id ? "FOUND" : item.status === "CURRENT" ? "CHECKED" : item.status })), events: addEvent(next, "REACQUIRED · BEACON DETECTED IN 4 STEPS", "success", nextTimestamp) };
    } else {
      next = { ...next, currentSearchPoint: nextIndex < state.searchPoints.length ? nextIndex : 0, checkedPoints: checked, searchPoints: state.searchPoints.map((item) => ({ ...item, status: item.id === nextIndex ? "CURRENT" : item.id <= point.id ? "CHECKED" : item.status })) };
    }
  } else if (phase === "REACQUIRED" && cycle >= 14.2) {
    next = { ...next, phase: "LOCK", acquisitionStage: "LOCK", events: addEvent(next, "REACQUISITION LOCK CONFIRMATION", "success", nextTimestamp) };
  }

  const trackingPhase = next.phase === "KEEP" || next.phase === "DISTURBANCE" || next.phase === "LOCK" || next.phase === "REACQUIRED";
  const motionPhase = trackingPhase ? nextTimestamp * 0.65 : 0;
  const baselineTarget = next.phase === "REACQUIRE" || next.phase === "GET-BACK" || next.phase === "TARGET LOST" ? next.predictedReacquisitionPosition : next.actualTargetPosition;
  const actual = trackingPhase ? { x: 256 + Math.sin(motionPhase) * 54, y: 256 + Math.cos(motionPhase * 0.84) * 37 } : baselineTarget;
  const predicted = next.phase === "KEEP" || next.phase === "DISTURBANCE" || next.phase === "LOCK" ? { x: actual.x - Math.cos(motionPhase) * (next.disturbanceLevel ? 30 : 4), y: actual.y - Math.sin(motionPhase) * (next.disturbanceLevel ? 24 : 3) } : next.phase === "GET-BACK" || next.phase === "REACQUIRE" ? next.predictedReacquisitionPosition : next.predictedPosition;
  const errorVector = { x: actual.x - predicted.x, y: actual.y - predicted.y };
  const pointingError = Math.hypot(errorVector.x, errorVector.y) / 20;
  const targetStatus: TargetStatus = next.targetVisible ? (next.phase === "KEEP" ? "LOCKED" : "DETECTED") : next.phase === "TARGET LOST" ? "LOST" : "SEARCHING";
  const nextTelemetry = [...next.telemetry.slice(-47), { timestamp: nextTimestamp, targetPosition: actual, predictedPosition: predicted, actualPosition: actual, pointingError }];
  const autoDisturbance = next.phase === "DISTURBANCE" ? Math.min(0.9, next.disturbanceLevel + 0.04) : next.phase === "KEEP" && next.disturbanceLevel > 0 ? next.disturbanceLevel : next.disturbanceLevel;
  return {
    ...next,
    targetVisible: next.phase === "TARGET LOST" || next.phase === "GET-BACK" || next.phase === "REACQUIRE" ? false : next.targetVisible,
    camera: { ...next.camera, predictedPixel: predicted, actualPixel: actual },
    predictedPosition: predicted,
    actualTargetPosition: actual,
    lastKnownPosition: next.targetVisible ? actual : next.lastKnownPosition,
    pat: { ...next.pat, mode: next.phase === "GET-BACK" || next.phase === "REACQUIRE" ? "GET-BACK" : next.phase === "KEEP" ? "KEEP" : next.pat.mode, targetStatus, confidence: next.targetVisible ? Math.max(70, 99 - pointingError * 5) : 0, gimbalCommand: { pan: -errorVector.x / 280, tilt: -errorVector.y / 280 } },
    pixelResidual: errorVector,
    angularError: { pan: errorVector.x / 2900, tilt: errorVector.y / 2900 },
    trackingError: pointingError,
    disturbanceLevel: autoDisturbance,
    fps: 56 + Math.round(Math.sin(motionPhase) * 3),
    processingLatency: 13 + Math.round(Math.abs(Math.cos(motionPhase)) * 4),
    acquisitionTime: next.phase === "LOCK" || next.phase === "KEEP" ? 0.41 : +(0.41 + pointingError * 0.08).toFixed(2),
    trackingRmse: +(0.0018 + pointingError / 3000).toFixed(4),
    telemetry: nextTelemetry,
  };
};

const formatTime = (timestamp: number) => {
  const seconds = timestamp % 60;
  return `12:04:${seconds.toFixed(3).padStart(6, "0")}`;
};