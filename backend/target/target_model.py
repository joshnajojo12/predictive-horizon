from dataclasses import dataclass
from backend.utils.geometry import wrap_angle

@dataclass
class TargetState:
    azimuth: float      # degrees
    elevation: float    # degrees
    vel_az: float       # degrees / sec
    vel_el: float       # degrees / sec
    is_visible: bool    # True if beacon is physically emitting/not occluded

class TargetModel:
    """Represents Satellite B / optical beacon kinematics."""
    def __init__(self, init_az=10.0, init_el=5.0, vel_az=0.05, vel_el=-0.02):
        self.state = TargetState(
            azimuth=init_az, 
            elevation=init_el, 
            vel_az=vel_az, 
            vel_el=vel_el, 
            is_visible=True
        )

    def get_state(self) -> TargetState:
        return self.state

    def update(self, dt: float):
        """Update the target's angular position over time step dt."""
        self.state.azimuth = wrap_angle(self.state.azimuth + self.state.vel_az * dt)
        self.state.elevation = wrap_angle(self.state.elevation + self.state.vel_el * dt)

    def set_visibility(self, visible: bool):
        self.state.is_visible = visible
