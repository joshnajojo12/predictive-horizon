import math
from typing import Tuple, Optional

class PatManager:
    """Manages the PAT State Machine (FIND -> KEEP -> GET_BACK)."""
    def __init__(self, acquisition_threshold_px: float = 10.0, required_frames: int = 5):
        self.mode = "FIND"
        self.target_status = "SEARCHING"
        self.acquisition_threshold_px = acquisition_threshold_px
        self.required_frames = required_frames
        
        self.frames_in_threshold = 0
        self.lost_frames = 0
        self.lost_timeout_frames = 10
        self.spiral_phase = 0.0

    def update(self, detected: bool, residual: Optional[Tuple[float, float]], dt: float) -> Tuple[float, float]:
        """
        Updates the PAT state machine. 
        Returns an override velocity command (pan_vel, tilt_vel) if in a search pattern, 
        otherwise returns None, meaning PID should control.
        """
        if self.mode == "FIND":
            if detected and residual:
                res_mag = math.hypot(residual[0], residual[1])
                if res_mag < self.acquisition_threshold_px:
                    self.frames_in_threshold += 1
                    if self.frames_in_threshold >= self.required_frames:
                        self.mode = "KEEP"
                        self.target_status = "ACQUIRED"
                else:
                    self.frames_in_threshold = 0
                self.target_status = "DETECTED"
                return None  # Let PID pull it in
            else:
                self.frames_in_threshold = 0
                self.target_status = "SEARCHING"
                # Move toward predicted location using PID
                return None

        elif self.mode == "KEEP":
            if not detected:
                self.lost_frames += 1
                if self.lost_frames > self.lost_timeout_frames:
                    self.mode = "GET_BACK"
                    self.target_status = "LOST"
                    self.spiral_phase = 0.0
            else:
                self.lost_frames = 0
                if residual:
                    res_mag = math.hypot(residual[0], residual[1])
                    if res_mag > self.acquisition_threshold_px * 2:
                        self.target_status = "DETECTED" # Degrading lock
                    else:
                        self.target_status = "ACQUIRED"
            return None # Let PID control

        elif self.mode == "GET_BACK":
            if detected:
                self.mode = "FIND"
                self.target_status = "DETECTED"
                self.lost_frames = 0
                return None
            else:
                # Spiral Search Fallback
                self.target_status = "SEARCHING"
                self.spiral_phase += dt * 2.0
                radius = 0.5 * self.spiral_phase
                v_pan = radius * math.cos(self.spiral_phase)
                v_el = radius * math.sin(self.spiral_phase)
                return v_pan, v_el

        return None
