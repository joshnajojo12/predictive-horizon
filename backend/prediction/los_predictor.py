from backend.target.target_model import TargetState
from backend.utils.geometry import wrap_angle

class LOSPredictor:
    """Predicts the line-of-sight to the target based on prior knowledge."""
    def __init__(self):
        # Memory of the target's last known kinematics
        self.last_known_az = 0.0
        self.last_known_el = 0.0
        self.last_known_vel_az = 0.0
        self.last_known_vel_el = 0.0
        self.last_update_time = 0.0

    def update_knowledge(self, az: float, el: float, vel_az: float, vel_el: float, timestamp: float):
        self.last_known_az = az
        self.last_known_el = el
        self.last_known_vel_az = vel_az
        self.last_known_vel_el = vel_el
        self.last_update_time = timestamp

    def predict_angular_location(self, current_time: float) -> tuple[float, float]:
        """Predict the target's azimuth and elevation at current_time."""
        dt = current_time - self.last_update_time
        pred_az = wrap_angle(self.last_known_az + self.last_known_vel_az * dt)
        pred_el = wrap_angle(self.last_known_el + self.last_known_vel_el * dt)
        return pred_az, pred_el
