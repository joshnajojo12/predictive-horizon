from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class Coordinate(BaseModel):
    x: float
    y: float

class PatState(BaseModel):
    mode: str
    targetStatus: str
    confidence: float
    gimbalCommand: Coordinate

class SimulationStateResponse(BaseModel):
    running: bool
    timestamp: float
    pat: PatState
    pixelResidual: Coordinate
    cameraActualPixel: Coordinate
    cameraPredictedPixel: Coordinate
    targetVisible: bool
    messages: List[str]

class ScenarioRequest(BaseModel):
    scenario: str

class AlgorithmModeRequest(BaseModel):
    mode: str  # BASELINE or PROPOSED

class ExperimentRunRequest(BaseModel):
    scenario: str = "NORMAL"
    num_steps: int = 150
    seed: int = 42

