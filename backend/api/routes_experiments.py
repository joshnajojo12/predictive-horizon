from fastapi import APIRouter

router = APIRouter()

@router.get("/results")
def get_experiment_results():
    # Placeholder for returning experiment metrics
    return {
        "baseline": {"acquisition_time": 2.84, "tracking_rmse": 0.0041},
        "proposed": {"acquisition_time": 0.41, "tracking_rmse": 0.0014}
    }
