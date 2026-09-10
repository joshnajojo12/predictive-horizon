import random
from collections import deque
from typing import Tuple
from backend.utils.geometry import wrap_angle

class GimbalActuator:
    """Pan-tilt gimbal mechanism with velocity/acceleration limits, delay queue, and calibration noise."""
    def __init__(
        self,
        init_pan: float = 0.0,
        init_tilt: float = 0.0,
        max_velocity: float = 8.0,        # deg/s
        max_acceleration: float = 20.0,   # deg/s^2
        pan_limits: Tuple[float, float] = (-180.0, 180.0),
        tilt_limits: Tuple[float, float] = (-60.0, 60.0),
        delay_sec: float = 0.02,           # 20ms actuation delay
        calibration_offset: Tuple[float, float] = (0.0, 0.0)
    ):
        self.pan = init_pan
        self.tilt = init_tilt
        self.curr_vel_pan = 0.0
        self.curr_vel_tilt = 0.0

        self.max_velocity = max_velocity
        self.max_acceleration = max_acceleration
        self.pan_limits = pan_limits
        self.tilt_limits = tilt_limits
        self.delay_sec = delay_sec
        self.calibration_offset = calibration_offset

        self.command_queue = deque()
        self.actuator_noise_std = 0.005

    def reset(self, init_pan: float = 0.0, init_tilt: float = 0.0):
        self.pan = init_pan
        self.tilt = init_tilt
        self.curr_vel_pan = 0.0
        self.curr_vel_tilt = 0.0
        self.command_queue.clear()

    def apply_command(self, vel_pan_command: float, vel_tilt_command: float, dt: float, timestamp: float = 0.0):
        """
        Applies velocity command subject to delay, max velocity, max acceleration, and physical angle limits.
        """
        if dt <= 0:
            return

        # Queue command with timestamp for actuation delay
        self.command_queue.append((timestamp, vel_pan_command, vel_tilt_command))

        # Retrieve delayed command
        cmd_pan, cmd_tilt = vel_pan_command, vel_tilt_command
        while self.command_queue and (timestamp - self.command_queue[0][0]) >= self.delay_sec:
            _, cmd_pan, cmd_tilt = self.command_queue.popleft()

        # Apply acceleration limits
        max_dv = self.max_acceleration * dt

        dv_pan = max(-max_dv, min(max_dv, cmd_pan - self.curr_vel_pan))
        dv_tilt = max(-max_dv, min(max_dv, cmd_tilt - self.curr_vel_tilt))

        self.curr_vel_pan += dv_pan
        self.curr_vel_tilt += dv_tilt

        # Clamp max velocity
        self.curr_vel_pan = max(-self.max_velocity, min(self.max_velocity, self.curr_vel_pan))
        self.curr_vel_tilt = max(-self.max_velocity, min(self.max_velocity, self.curr_vel_tilt))

        # Integrate angular positions
        d_pan = self.curr_vel_pan * dt + random.gauss(0, self.actuator_noise_std)
        d_tilt = self.curr_vel_tilt * dt + random.gauss(0, self.actuator_noise_std)

        new_pan = wrap_angle(self.pan + d_pan)
        new_tilt = max(self.tilt_limits[0], min(self.tilt_limits[1], self.tilt + d_tilt))

        self.pan = new_pan
        self.tilt = new_tilt

    @property
    def effective_pan(self) -> float:
        """Pan angle including calibration offset."""
        return wrap_angle(self.pan + self.calibration_offset[0])

    @property
    def effective_tilt(self) -> float:
        """Tilt angle including calibration offset."""
        return max(self.tilt_limits[0], min(self.tilt_limits[1], self.tilt + self.calibration_offset[1]))

