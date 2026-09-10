from backend.utils.geometry import angle_to_pixel
from backend.target.target_model import TargetState

class VirtualCamera:
    """Represents the virtual camera observing the scene."""
    def __init__(self, fov_x: float = 5.0, fov_y: float = 5.0, res_x: int = 1024, res_y: int = 1024):
        self.fov_x = fov_x
        self.fov_y = fov_y
        self.res_x = res_x
        self.res_y = res_y

    def get_beacon_pixel(self, target_state: TargetState, pan: float, tilt: float):
        """
        Simulate capturing an image frame and projecting the beacon onto it.
        Returns the (x, y) pixel coordinate if visible, otherwise None.
        """
        if not target_state.is_visible:
            return None
            
        return angle_to_pixel(
            azimuth=target_state.azimuth,
            elevation=target_state.elevation,
            pan=pan,
            tilt=tilt,
            fov_x=self.fov_x,
            fov_y=self.fov_y,
            res_x=self.res_x,
            res_y=self.res_y
        )
