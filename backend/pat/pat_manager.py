import math
from typing import Tuple, Optional

class PatManager:
    """Manages the PAT State Machine (FIND -> KEEP -> GET_BACK)."""
    def __init__(self, acquisition_threshold_px: float = 15.0, required_frames: int = 4):
        self.mode = "FIND"
        self.target_status = "SEARCHING"
        self.acquisition_threshold_px = acquisition_threshold_px
        self.required_frames = required_frames

        self.frames_in_threshold = 0
        self.lost_frames = 0
        self.lost_timeout_frames = 8
        
        # Multi-stage recovery sequence state
        self.recovery_stage = 1  # 1: Small Local, 2: Expanded Local, 3: Spiral Fallback
        self.recovery_timer = 0.0
        self.spiral_phase = 0.0

    def reset(self):
        self.mode = "FIND"
        self.target_status = "SEARCHING"
        self.frames_in_threshold = 0
        self.lost_frames = 0
        self.recovery_stage = 1
        self.recovery_timer = 0.0
        self.spiral_phase = 0.0

    def update(self, detected: bool, residual: Optional[Tuple[float, float]], dt: float) -> Optional[Tuple[float, float]]:
        """
        Updates the PAT state machine. 
        Returns override velocity command (pan_vel, tilt_vel) if executing search pattern, 
        otherwise returns None (allowing PID + feedforward control).
        """
        if dt <= 0:
            return None

        if self.mode == "FIND":
            self.recovery_stage = 1
            self.recovery_timer = 0.0
            self.spiral_phase = 0.0

            if detected and residual is not None:
                res_mag = math.hypot(residual[0], residual[1])
                if res_mag <= self.acquisition_threshold_px:
                    self.frames_in_threshold += 1
                    if self.frames_in_threshold >= self.required_frames:
                        self.mode = "KEEP"
                        self.target_status = "ACQUIRED"
                    else:
                        self.target_status = "DETECTED"
                else:
                    self.frames_in_threshold = 0
                    self.target_status = "DETECTED"
                return None

            else:
                self.frames_in_threshold = 0
                self.target_status = "SEARCHING"
                return None  # Predictive LOS pointing takes over

        elif self.mode == "KEEP":
            if not detected:
                self.lost_frames += 1
                if self.lost_frames >= self.lost_timeout_frames:
                    self.mode = "GET_BACK"
                    self.target_status = "LOST"
                    self.recovery_stage = 1
                    self.recovery_timer = 0.0
                    self.spiral_phase = 0.0
            else:
                self.lost_frames = 0
                if residual is not None:
                    res_mag = math.hypot(residual[0], residual[1])
                    if res_mag > self.acquisition_threshold_px * 2.5:
                        self.target_status = "DETECTED"
                    else:
                        self.target_status = "ACQUIRED"
            return None

        elif self.mode == "GET_BACK":
            if detected:
                self.mode = "FIND"
                self.target_status = "DETECTED"
                self.lost_frames = 0
                self.recovery_stage = 1
                self.recovery_timer = 0.0
                return None

            self.target_status = "SEARCHING"
            self.recovery_timer += dt

            # Stage 1: Small Local Search around predicted position (0 - 1.5s)
            if self.recovery_timer <= 1.5:
                self.recovery_stage = 1
                radius = 0.3
                freq = 4.0
                v_pan = radius * math.cos(freq * self.recovery_timer)
                v_tilt = radius * math.sin(freq * self.recovery_timer)
                return v_pan, v_tilt

            # Stage 2: Expanded Local Search (1.5s - 3.5s)
            elif self.recovery_timer <= 3.5:
                self.recovery_stage = 2
                radius = 1.0
                freq = 2.5
                v_pan = radius * math.cos(freq * self.recovery_timer)
                v_tilt = radius * math.sin(freq * self.recovery_timer)
                return v_pan, v_tilt

            # Stage 3: Spiral Search Fallback (> 3.5s)
            else:
                self.recovery_stage = 3
                self.spiral_phase += dt * 1.8
                radius = min(4.0, 0.4 * self.spiral_phase)
                v_pan = radius * math.cos(self.spiral_phase)
                v_tilt = radius * math.sin(self.spiral_phase)
                return v_pan, v_tilt

        return None

