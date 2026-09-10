import copy
from typing import Dict, Any, List
from backend.experiments.metrics import compute_experiment_metrics, ExperimentMetrics
from backend.simulation.simulation_engine import SimulationEngine
from backend.simulation.disturbance_engine import DisturbanceConfig

def run_experiment_scenario(
    scenario_name: str = "NORMAL",
    num_steps: int = 150,
    dt: float = 0.1,
    seed: int = 42
) -> Dict[str, ExperimentMetrics]:
    """
    Runs BASELINE and PROPOSED algorithms under identical disturbance conditions and random seeds.
    """
    results = {}

    for mode in ["BASELINE", "PROPOSED"]:
        # Initialize simulation engine
        engine = SimulationEngine()
        engine.algorithm_mode = mode
        
        # Configure scenario disturbances
        dist_cfg = DisturbanceConfig(enabled=True, seed=seed)
        if scenario_name == "LARGE INITIAL ERROR":
            dist_cfg.initial_pointing_error = 4.5
            engine.gimbal.pan = 8.0
            engine.gimbal.tilt = 4.0
        elif scenario_name == "EPHEMERIS ERROR":
            dist_cfg.ephemeris_error_m = 5.0
        elif scenario_name == "ATTITUDE ERROR":
            dist_cfg.attitude_error_std = 0.4
        elif scenario_name == "VIBRATION":
            dist_cfg.vibration_amplitude = 0.2
            dist_cfg.vibration_frequency = 25.0
        elif scenario_name == "CAMERA NOISE":
            dist_cfg.sensor_noise_std = 25.0
        elif scenario_name == "TARGET LOSS":
            dist_cfg.target_dropout = True
        elif scenario_name == "COMBINED DISTURBANCE":
            dist_cfg.initial_pointing_error = 3.0
            dist_cfg.vibration_amplitude = 0.15
            dist_cfg.sensor_noise_std = 15.0
            dist_cfg.attitude_error_std = 0.2

        engine.disturbance_engine.set_config(dist_cfg)

        pointing_errors = []
        target_statuses = []
        timestamps = []

        # Run simulation steps
        for step_idx in range(num_steps):
            if scenario_name == "TARGET LOSS" and 40 <= step_idx < 80:
                engine.target.set_visibility(False)
            else:
                engine.target.set_visibility(True)

            engine.step(dt)
            state = engine.get_state()

            # Record telemetry
            err = math.hypot(state.pixelResidual.x, state.pixelResidual.y) / 20.0 # deg
            pointing_errors.append(err)
            target_statuses.append(state.pat.targetStatus)
            timestamps.append(state.timestamp)

        metrics = compute_experiment_metrics(
            label=mode,
            pointing_errors=pointing_errors,
            target_statuses=target_statuses,
            timestamps=timestamps,
            dt=dt
        )
        results[mode.lower()] = metrics

    return results

import math
