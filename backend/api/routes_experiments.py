from fastapi import APIRouter
from .schemas import ExperimentRunRequest
from backend.experiments.runner import run_experiment_scenario

router = APIRouter()

@router.get("/results")
def get_experiment_results(scenario: str = "NORMAL", seed: int = 42):
    return run_experiment_scenario(scenario_name=scenario, num_steps=150, seed=seed)

@router.post("/run")
def run_experiment(req: ExperimentRunRequest):
    return run_experiment_scenario(scenario_name=req.scenario, num_steps=req.num_steps, seed=req.seed)

