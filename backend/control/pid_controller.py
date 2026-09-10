from typing import Tuple
from backend.utils.geometry import pixel_to_angle

class PIDController:
    """Calculates actuator angular velocity commands based on visual residuals and predictive feedforward."""
    def __init__(self, kp: float = 1.4, ki: float = 0.02, kd: float = 0.12, ff_gain: float = 1.0):
        self.kp = kp
        self.ki = ki
        self.kd = kd
        self.ff_gain = ff_gain
        
        self.integral_az = 0.0
        self.integral_el = 0.0
        self.prev_error_az = 0.0
        self.prev_error_el = 0.0

    def reset(self):
        self.integral_az = 0.0
        self.integral_el = 0.0
        self.prev_error_az = 0.0
        self.prev_error_el = 0.0

    def calculate_correction(
        self,
        residual_x: float,
        residual_y: float, 
        fov_x: float,
        fov_y: float,
        res_x: int,
        res_y: int,
        dt: float,
        feedforward_az: float = 0.0,
        feedforward_el: float = 0.0
    ) -> Tuple[float, float]:
        """
        Converts pixel residual to angular error, applies PID + predictive feedforward, returns total angular velocity command.
        """
        if dt <= 0:
            return 0.0, 0.0

        # Convert pixel error to angular error
        err_az, err_el = pixel_to_angle(res_x / 2 + residual_x, res_y / 2 + residual_y, fov_x, fov_y, res_x, res_y)

        # Proportional
        p_az = self.kp * err_az
        p_el = self.kp * err_el

        # Integral (with anti-windup clamping)
        self.integral_az = max(-10.0, min(10.0, self.integral_az + err_az * dt))
        self.integral_el = max(-10.0, min(10.0, self.integral_el + err_el * dt))
        i_az = self.ki * self.integral_az
        i_el = self.ki * self.integral_el

        # Derivative
        d_az = self.kd * ((err_az - self.prev_error_az) / dt)
        d_el = self.kd * ((err_el - self.prev_error_el) / dt)

        self.prev_error_az = err_az
        self.prev_error_el = err_el

        # Total command = PID feedback + Predictive Feedforward
        v_az = p_az + i_az + d_az + self.ff_gain * feedforward_az
        v_el = p_el + i_el + d_el + self.ff_gain * feedforward_el

        return v_az, v_el

