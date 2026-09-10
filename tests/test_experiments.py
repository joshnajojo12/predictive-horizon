import pytest
from backend.experiments.runner import run_experiment_scenario

def test_experiment_runner():
    results = run_experiment_scenario(scenario_name="NORMAL", num_steps=50, seed=42)
    assert "baseline" in results
    assert "proposed" in results

    baseline_metrics = results["baseline"]
    proposed_metrics = results["proposed"]

    assert proposed_metrics.acquisition_time <= baseline_metrics.acquisition_time
    assert proposed_metrics.tracking_rmse <= baseline_metrics.tracking_rmse
