from typing import Tuple
import math
from backend.target.target_model import TargetState, ObserverState
from backend.utils.geometry import (
    vec3_sub, vec3_normalize, vec3_add, vec3_scale, vector_to_az_el, wrap_angle
)

class LOSPredictor:
    """Predicts the relative 3D line-of-sight vector and angular target coordinates."""
    def __init__(self):
        self.last_target_pos = (0.0, 0.0, 1000.0)
        self.last_target_vel = (0.0, 0.0, 0.0)
        self.last_observer_pos = (0.0, 0.0, 0.0)
        self.last_observer_vel = (0.0, 0.0, 0.0)
        self.last_update_time = 0.0

    def update_3d_knowledge(
        self,
        target_pos: Tuple[float, float, float],
        target_vel: Tuple[float, float, float],
        observer_pos: Tuple[float, float, float],
        observer_vel: Tuple[float, float, float],
        timestamp: float
    ):
        self.last_target_pos = target_pos
        self.last_target_vel = target_vel
        self.last_observer_pos = observer_pos
        self.last_observer_vel = observer_vel
        self.last_update_time = timestamp

    def update_knowledge(self, az: float, el: float, vel_az: float, vel_el: float, timestamp: float):
        """Backward compatibility update helper."""
        r = 1000.0
        from backend.utils.geometry import az_el_to_vector
        dir_v = az_el_to_vector(az, el)
        pos = (dir_v[0]*r, dir_v[1]*r, dir_v[2]*r)
        vel = (math.radians(vel_az)*r, math.radians(vel_el)*r, 0.0)
        self.update_3d_knowledge(pos, vel, (0.0, 0.0, 0.0), (0.0, 0.0, 0.0), timestamp)

    def compute_relative_los(
        self, target_pos: Tuple[float, float, float], observer_pos: Tuple[float, float, float]
    ) -> Tuple[Tuple[float, float, float], Tuple[float, float, float]]:
        """
        Computes (relative_range_vector, normalized_los_vector).
        """
        rel_vec = vec3_sub(target_pos, observer_pos)
        los_unit = vec3_normalize(rel_vec)
        return rel_vec, los_unit

    def predict_3d_los(self, current_time: float) -> Tuple[Tuple[float, float, float], Tuple[float, float, float]]:
        """
        Propagates 3D target and observer states to current_time.
        Returns (predicted_rel_pos, predicted_los_unit_vector).
        """
        dt = current_time - self.last_update_time
        pred_tgt_pos = vec3_add(self.last_target_pos, vec3_scale(self.last_target_vel, dt))
        pred_obs_pos = vec3_add(self.last_observer_pos, vec3_scale(self.last_observer_vel, dt))
        return self.compute_relative_los(pred_tgt_pos, pred_obs_pos)

    def predict_angular_location(self, current_time: float) -> Tuple[float, float]:
        """Predict target azimuth and elevation angles at current_time."""
        rel_pos, los_unit = self.predict_3d_los(current_time)
        return vector_to_az_el(los_unit)

    def predict_angular_velocity(self) -> Tuple[float, float]:
        """Predicts target angular velocity (deg/s) in azimuth and elevation."""
        rel_vel = vec3_sub(self.last_target_vel, self.last_observer_vel)
        r = math.sqrt(self.last_target_pos[0]**2 + self.last_target_pos[1]**2 + self.last_target_pos[2]**2)
        if r < 1e-6:
            return 0.0, 0.0
        vel_az = math.degrees(rel_vel[0] / r)
        vel_el = math.degrees(rel_vel[1] / r)
        return vel_az, vel_el

