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

let resolvedBaseUrl: string | null = null;

async function getBaseUrl(): Promise<string> {
  if (resolvedBaseUrl) return resolvedBaseUrl;
  const candidates = ["/api", "http://127.0.0.1:8000/api", "http://localhost:8000/api"];
  for (const candidate of candidates) {
    try {
      const res = await fetch(`${candidate}/simulation/state`, {
        method: "GET",
        signal: AbortSignal.timeout(600),
      });
      if (res.ok) {
        resolvedBaseUrl = candidate;
        console.log(`[API] Connected to simulation backend at: ${candidate}`);
        return candidate;
      }
    } catch {
      // Continue to next candidate
    }
  }
  // Default to relative /api
  return "/api";
}

export async function fetchSimulationState(): Promise<BackendSimulationState | null> {
  try {
    const base = await getBaseUrl();
    const res = await fetch(`${base}/simulation/state`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(1500),
    });
    if (!res.ok) return null;
    return (await res.json()) as BackendSimulationState;
  } catch (err) {
    return null;
  }
}

export async function postStartSimulation(): Promise<boolean> {
  try {
    const base = await getBaseUrl();
    const res = await fetch(`${base}/simulation/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    return res.ok;
  } catch (err) {
    console.error("[API] Failed to postStartSimulation:", err);
    return false;
  }
}

export async function postStopSimulation(): Promise<boolean> {
  try {
    const base = await getBaseUrl();
    const res = await fetch(`${base}/simulation/stop`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    return res.ok;
  } catch (err) {
    console.error("[API] Failed to postStopSimulation:", err);
    return false;
  }
}

export async function postResetSimulation(): Promise<boolean> {
  try {
    const base = await getBaseUrl();
    const res = await fetch(`${base}/simulation/reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    return res.ok;
  } catch (err) {
    console.error("[API] Failed to postResetSimulation:", err);
    return false;
  }
}

export async function postScenario(scenario: string): Promise<boolean> {
  try {
    const base = await getBaseUrl();
    const res = await fetch(`${base}/simulation/scenario`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenario }),
    });
    return res.ok;
  } catch (err) {
    console.error("[API] Failed to postScenario:", err);
    return false;
  }
}

export async function postAlgorithmMode(mode: string): Promise<boolean> {
  try {
    const base = await getBaseUrl();
    const res = await fetch(`${base}/simulation/mode`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode }),
    });
    return res.ok;
  } catch (err) {
    console.error("[API] Failed to postAlgorithmMode:", err);
    return false;
  }
}

export async function postRunExperiment(scenario: string = "NORMAL"): Promise<any | null> {
  try {
    const base = await getBaseUrl();
    const res = await fetch(`${base}/experiments/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenario, num_steps: 120, seed: 42 }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("[API] Failed to postRunExperiment:", err);
    return null;
  }
}

