import time
import math
import numpy as np
from typing import Optional, Tuple, Dict, Any, List

from backend.target.target_model import TargetModel
from backend.camera.virtual_camera import VirtualCamera
from backend.camera.real_camera import SimulatedRealCamera
from backend.prediction.los_predictor import LOSPredictor
from backend.vision.beacon_detector import BeaconDetector
from backend.control.pid_controller import PIDController
from backend.actuator.gimbal import GimbalActuator
from backend.pat.pat_manager import PatManager
from backend.simulation.disturbance_engine import DisturbanceEngine, DisturbanceConfig
from backend.api.schemas import SimulationStateResponse, PatState, Coordinate
from backend.utils.geometry import wrap_angle

import threading


class SimulationEngine:
    """Full 3D closed-loop aerospace optical acquisition and tracking simulator."""
    def __init__(self, init_pan: float = 0.0, init_tilt: float = 0.0):
        self.running: bool = False
        self.scenario: str = "NORMAL"
        self.algorithm_mode: str = "PROPOSED" # BASELINE or PROPOSED

        # Core subsystems
        self.target = TargetModel(init_az=10.0, init_el=5.0)
        self.camera = VirtualCamera(fov_x=5.0, fov_y=5.0, res_x=512, res_y=512)
        self.real_camera = SimulatedRealCamera(res_x=512, res_y=512)
        self.predictor = LOSPredictor()
        self.detector = BeaconDetector()
        self.controller = PIDController(kp=1.4, ki=0.02, kd=0.12, ff_gain=1.0)
        self.gimbal = GimbalActuator(init_pan=init_pan, init_tilt=init_tilt)
        self.pat_manager = PatManager()
        self.disturbance_engine = DisturbanceEngine()

        self.timestamp: float = 0.0
        self.last_step_time: float = time.time()
        self.messages: List[str] = []

        self.predicted_coord: Tuple[float, float] = (256.0, 256.0)
        self.actual_coord: Optional[Tuple[float, float]] = (256.0, 256.0)
        self.residual: Tuple[float, float] = (0.0, 0.0)

        # Raw synthetic frame storage
        self.last_real_frame: Optional[np.ndarray] = None
        self.last_expected_frame: Optional[np.ndarray] = None

        # Threading for live real-time simulation background loop
        self._lock = threading.RLock()
        self._thread: Optional[threading.Thread] = None
        self._stop_event = threading.Event()
        self._ensure_worker()

    def _ensure_worker(self):
        if self._thread is None or not self._thread.is_alive():
            self._stop_event.clear()
            self._thread = threading.Thread(target=self._run_loop, daemon=True)
            self._thread.start()

    def _run_loop(self):
        last_t = time.time()
        while not self._stop_event.is_set():
            now = time.time()
            dt = now - last_t
            last_t = now
            if self.running:
                try:
                    with self._lock:
                        self.step(min(dt, 0.2))
                except Exception as e:
                    self.messages.append(f"Simulation loop error: {str(e)}")
            time.sleep(0.05)

    def start(self):
        with self._lock:
            self.running = True
            self.last_step_time = time.time()
        self._ensure_worker()

    def stop(self):
        with self._lock:
            self.running = False

    def reset(self, init_pan: float = 0.0, init_tilt: float = 0.0):
        with self._lock:
            self.target = TargetModel(init_az=10.0, init_el=5.0)
            self.gimbal.reset(init_pan=init_pan, init_tilt=init_tilt)
            self.pat_manager.reset()
            self.detector.confidence = 0.0
            self.controller.reset()
            self.timestamp = 0.0
            self.running = False
            self.residual = (0.0, 0.0)
            self.actual_coord = (256.0, 256.0)
            self.predicted_coord = (256.0, 256.0)
            self.messages = []


    def set_scenario(self, scenario_name: str):
        self.scenario = scenario_name
        cfg = DisturbanceConfig(enabled=True)

        if scenario_name == "LARGE INITIAL ERROR":
            self.gimbal.pan = 8.0
            self.gimbal.tilt = 4.0
            cfg.initial_pointing_error = 4.5
        elif scenario_name == "EPHEMERIS ERROR":
            cfg.ephemeris_error_m = 5.0
        elif scenario_name == "ATTITUDE ERROR":
            cfg.attitude_error_std = 0.4
        elif scenario_name == "VIBRATION":
            cfg.vibration_amplitude = 0.2
            cfg.vibration_frequency = 25.0
        elif scenario_name == "CAMERA NOISE":
            cfg.sensor_noise_std = 25.0
        elif scenario_name == "TARGET LOSS":
            cfg.target_dropout = True
        elif scenario_name == "COMBINED DISTURBANCE":
            cfg.initial_pointing_error = 3.0
            cfg.vibration_amplitude = 0.15
            cfg.sensor_noise_std = 15.0
            cfg.attitude_error_std = 0.2

        self.disturbance_engine.set_config(cfg)

    def set_algorithm_mode(self, mode: str):
        if mode in ("BASELINE", "PROPOSED"):
            self.algorithm_mode = mode

    def step(self, dt: float = None):
        """Advances closed-loop 3D simulation by dt seconds."""
        if dt is None:
            current_time = time.time()
            dt = current_time - self.last_step_time
            self.last_step_time = current_time

        if dt <= 0:
            return
        self.timestamp += dt

        # 1. Update 3D target and observer kinematics
        self.target.update(dt)
        tgt_state = self.target.get_state()
        obs_state = self.target.get_observer_state()

        # Apply ephemeris disturbance to prediction feed
        eph_err = self.disturbance_engine.get_ephemeris_error()
        obs_pos_pred = (
            obs_state.pos_x + eph_err[0],
            obs_state.pos_y + eph_err[1],
            obs_state.pos_z + eph_err[2]
        )

        # 2. Update prediction knowledge (3D relative LOS)
        self.predictor.update_3d_knowledge(
            (tgt_state.pos_x, tgt_state.pos_y, tgt_state.pos_z),
            (tgt_state.vel_x, tgt_state.vel_y, tgt_state.vel_z),
            obs_pos_pred,
            (obs_state.vel_x, obs_state.vel_y, obs_state.vel_z),
            self.timestamp
        )

        # 3. Compute predicted 3D LOS direction & expected pixel
        pred_az, pred_el = self.predictor.predict_angular_location(self.timestamp)
        delta_az = wrap_angle(pred_az - self.gimbal.effective_pan)
        delta_el = wrap_angle(pred_el - self.gimbal.effective_tilt)

        pred_px_x = (self.camera.res_x / 2.0) + (delta_az / self.camera.fov_x) * self.camera.res_x
        pred_px_y = (self.camera.res_y / 2.0) + (delta_el / self.camera.fov_y) * self.camera.res_y
        self.predicted_coord = (pred_px_x, pred_px_y)

        # 4. Generate Expected Camera Frame
        clamped_pred = None
        if 0 <= pred_px_x < self.camera.res_x and 0 <= pred_px_y < self.camera.res_y:
            clamped_pred = (pred_px_x, pred_px_y)
        self.last_expected_frame = self.camera.generate_expected_image(clamped_pred)

        # 5. Simulate Real Optical Camera Capture with Disturbances
        true_px = self.camera.get_beacon_pixel(tgt_state, self.gimbal.effective_pan, self.gimbal.effective_tilt)
        vibration_offset = self.disturbance_engine.get_vibration_offset(self.timestamp)

        if tgt_state.is_visible and not (self.scenario == "TARGET LOSS" and int(self.timestamp) % 8 >= 5):
            self.last_real_frame = self.real_camera.capture_frame(
                true_px,
                sensor_noise_std=self.disturbance_engine.config.sensor_noise_std,
                vibration_offset=vibration_offset
            )
        else:
            self.last_real_frame = self.real_camera.capture_frame(
                None,
                sensor_noise_std=self.disturbance_engine.config.sensor_noise_std
            )

        # 6. OpenCV Computer Vision Detection
        self.actual_coord = self.detector.detect_beacon(self.last_real_frame)
        detected = self.actual_coord is not None

        # 7. Compute Visual Residual Vector relative to Reticle Center
        reticle_center = (self.camera.res_x / 2.0, self.camera.res_y / 2.0)

        if detected and self.actual_coord is not None:
            self.residual = self.detector.calculate_visual_residual(reticle_center, self.actual_coord)
        else:
            # When beacon is not yet detected, pull towards predicted LOS target
            self.residual = (self.predicted_coord[0] - reticle_center[0], self.predicted_coord[1] - reticle_center[1])


        # 8. PAT State Machine Logic (Algorithm Mode specific)
        if self.algorithm_mode == "BASELINE":
            # Baseline: Blind spiral search until detected, then PID tracking without predictive acquisition
            if not detected:
                self.pat_manager.mode = "FIND"
                self.pat_manager.target_status = "SEARCHING"
                self.pat_manager.spiral_phase += dt * 2.0
                radius = 0.5 * self.pat_manager.spiral_phase
                search_override = (radius * math.cos(self.pat_manager.spiral_phase), radius * math.sin(self.pat_manager.spiral_phase))
            else:
                search_override = self.pat_manager.update(detected, self.residual, dt)
        else:
            # Proposed: VISTA-PAT (Predictive pointing -> OpenCV detection -> KEEP + Feedforward -> 3-stage GET-BACK)
            search_override = self.pat_manager.update(detected, self.residual if detected else None, dt)

        # 9. Control Calculation (PID + Predictive Feedforward)
        if search_override:
            v_pan, v_tilt = search_override
        else:
            ff_az, ff_el = (0.0, 0.0)
            if self.algorithm_mode == "PROPOSED":
                ff_az, ff_el = self.predictor.predict_angular_velocity()

            v_pan, v_tilt = self.controller.calculate_correction(
                self.residual[0], self.residual[1],
                self.camera.fov_x, self.camera.fov_y,
                self.camera.res_x, self.camera.res_y,
                dt, feedforward_az=ff_az, feedforward_el=ff_el
            )

        # 10. Gimbal Actuation Loop
        self.gimbal.apply_command(v_pan, v_tilt, dt, timestamp=self.timestamp)

    def get_state(self) -> SimulationStateResponse:
        with self._lock:
            tgt_state = self.target.get_state()
            return SimulationStateResponse(
                running=self.running,
                timestamp=round(self.timestamp, 3),
                pat=PatState(
                    mode=self.pat_manager.mode,
                    targetStatus=self.pat_manager.target_status,
                    confidence=round(self.detector.confidence, 1),
                    gimbalCommand=Coordinate(x=round(self.gimbal.pan, 3), y=round(self.gimbal.tilt, 3))
                ),
                pixelResidual=Coordinate(x=round(self.residual[0], 1), y=round(self.residual[1], 1)),
                cameraActualPixel=Coordinate(
                    x=round(self.actual_coord[0], 1) if self.actual_coord else 0.0,
                    y=round(self.actual_coord[1], 1) if self.actual_coord else 0.0
                ),
                cameraPredictedPixel=Coordinate(x=round(self.predicted_coord[0], 1), y=round(self.predicted_coord[1], 1)),
                targetVisible=tgt_state.is_visible and not (self.scenario == "TARGET LOSS" and int(self.timestamp) % 8 >= 5),
                messages=self.messages
            )


