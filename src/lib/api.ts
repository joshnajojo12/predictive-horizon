export interface BackendCoordinate {
  x: number;
  y: number;
}

export interface BackendPatState {
  mode: string;
  targetStatus: string;
  confidence: number;
  gimbalCommand: BackendCoordinate;
}

export interface BackendSimulationState {
  running: boolean;
  timestamp: number;
  pat: BackendPatState;
  pixelResidual: BackendCoordinate;
  cameraActualPixel: BackendCoordinate;
  cameraPredictedPixel: BackendCoordinate;
  targetVisible: boolean;
  messages: string[];
}

const BACKEND_URL = "http://127.0.0.1:8000/api";

export async function fetchSimulationState(): Promise<BackendSimulationState | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/simulation/state`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(1500),
    });
    if (!res.ok) return null;
    return (await res.json()) as BackendSimulationState;
  } catch {
    return null;
  }
}

export async function postStartSimulation(): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND_URL}/simulation/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function postStopSimulation(): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND_URL}/simulation/stop`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function postResetSimulation(): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND_URL}/simulation/reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function postScenario(scenario: string): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND_URL}/simulation/scenario`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenario }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function postAlgorithmMode(mode: string): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND_URL}/simulation/mode`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function postRunExperiment(scenario: string = "NORMAL"): Promise<any | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/experiments/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenario, num_steps: 120, seed: 42 }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
