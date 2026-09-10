from dataclasses import dataclass, field
from typing import Tuple
import math
from backend.utils.geometry import wrap_angle, az_el_to_vector, vector_to_az_el

@dataclass
class TargetState:
    pos_x: float = 0.0          # meters in inertial frame
    pos_y: float = 0.0
    pos_z: float = 1000.0
    vel_x: float = 0.0          # m/s
    vel_y: float = 0.0
    vel_z: float = 0.0
    is_visible: bool = True     # True if optical beacon is transmitting & not occluded
    timestamp: float = 0.0

    @property
    def azimuth(self) -> float:
        az, _ = vector_to_az_el((self.pos_x, self.pos_y, self.pos_z))
        return az

    @property
    def elevation(self) -> float:
        _, el = vector_to_az_el((self.pos_x, self.pos_y, self.pos_z))
        return el

    @property
    def vel_az(self) -> float:
        # Approximate angular velocity (deg/s)
        r = math.sqrt(self.pos_x**2 + self.pos_y**2 + self.pos_z**2)
        if r < 1e-6:
            return 0.0
        return math.degrees(self.vel_x / r)

    @property
    def vel_el(self) -> float:
        r = math.sqrt(self.pos_x**2 + self.pos_y**2 + self.pos_z**2)
        if r < 1e-6:
            return 0.0
        return math.degrees(self.vel_y / r)

@dataclass
class ObserverState:
    pos_x: float = 0.0
    pos_y: float = 0.0
    pos_z: float = 0.0
    vel_x: float = 0.0
    vel_y: float = 0.0
    vel_z: float = 0.0
    roll: float = 0.0           # degrees
    pitch: float = 0.0          # degrees
    yaw: float = 0.0            # degrees

class TargetModel:
    """Represents Satellite B / optical beacon 3D state and kinematics."""
    def __init__(self, init_az=10.0, init_el=5.0, range_m=1000.0, vel_az=0.05, vel_el=-0.02):
        # Convert initial azimuth/elevation/range into 3D position vector
        dir_vec = az_el_to_vector(init_az, init_el)
        pos_x = dir_vec[0] * range_m
        pos_y = dir_vec[1] * range_m
        pos_z = dir_vec[2] * range_m

        # Convert angular rates to linear velocity components perpendicular to LOS
        vel_x = math.radians(vel_az) * range_m
        vel_y = math.radians(vel_el) * range_m
        vel_z = 0.0

        self.state = TargetState(
            pos_x=pos_x, pos_y=pos_y, pos_z=pos_z,
            vel_x=vel_x, vel_y=vel_y, vel_z=vel_z,
            is_visible=True, timestamp=0.0
        )
        self.observer = ObserverState()

    def get_state(self) -> TargetState:
        return self.state

    def get_observer_state(self) -> ObserverState:
        return self.observer

    def update(self, dt: float):
        """Update 3D target and observer kinematics over dt."""
        if dt <= 0:
            return

        self.state.pos_x += self.state.vel_x * dt
        self.state.pos_y += self.state.vel_y * dt
        self.state.pos_z += self.state.vel_z * dt
        self.state.timestamp += dt

        self.observer.pos_x += self.observer.vel_x * dt
        self.observer.pos_y += self.observer.vel_y * dt
        self.observer.pos_z += self.observer.vel_z * dt

    def set_visibility(self, visible: bool):
        self.state.is_visible = visible

    def set_3d_state(self, pos: Tuple[float, float, float], vel: Tuple[float, float, float]):
        self.state.pos_x, self.state.pos_y, self.state.pos_z = pos
        self.state.vel_x, self.state.vel_y, self.state.vel_z = vel

