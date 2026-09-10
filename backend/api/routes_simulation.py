from fastapi import APIRouter
from .schemas import SimulationStateResponse, ScenarioRequest
from backend.simulation.simulation_engine import SimulationEngine

router = APIRouter()
engine = SimulationEngine()

@router.get("/state", response_model=SimulationStateResponse)
def get_state():
    return engine.get_state()

@router.post("/start")
def start_simulation():
    engine.start()
    return {"status": "started"}

@router.post("/stop")
def stop_simulation():
    engine.stop()
    return {"status": "stopped"}

@router.post("/reset")
def reset_simulation():
    engine.reset()
    return {"status": "reset"}

@router.post("/scenario")
def set_scenario(req: ScenarioRequest):
    engine.set_scenario(req.scenario)
    return {"status": "scenario_updated", "scenario": req.scenario}

@router.post("/step")
def step_simulation():
    engine.step()
    return {"status": "stepped"}
