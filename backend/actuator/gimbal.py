from backend.utils.geometry import wrap_angle

class GimbalActuator:
    """Represents the virtual pan-tilt mechanism with kinematic limits."""
    def __init__(self, init_pan=0.0, init_tilt=0.0):
        self.pan = init_pan
        self.tilt = init_tilt
        
        self.max_velocity = 5.0 # deg/s

    def apply_command(self, vel_pan_command: float, vel_tilt_command: float, dt: float):
        """Apply a velocity command to the gimbal, clamped by max_velocity."""
        # Clamp velocities
        v_pan = max(min(vel_pan_command, self.max_velocity), -self.max_velocity)
        v_tilt = max(min(vel_tilt_command, self.max_velocity), -self.max_velocity)
        
        # Integrate position
        self.pan = wrap_angle(self.pan + v_pan * dt)
        self.tilt = wrap_angle(self.tilt + v_tilt * dt)
