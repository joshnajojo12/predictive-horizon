import math
import numpy as np
from typing import Optional, Tuple
from backend.target.target_model import TargetState
from backend.utils.geometry import (
    angle_to_pixel, euler_to_rotation_matrix, pan_tilt_to_rotation_matrix,
    inertial_to_camera_frame, vector_to_az_el
)

class VirtualCamera:
    """Pinhole camera model generating expected image frames."""
    def __init__(self, fov_x: float = 5.0, fov_y: float = 5.0, res_x: int = 512, res_y: int = 512):
        self.fov_x = fov_x
        self.fov_y = fov_y
        self.res_x = res_x
        self.res_y = res_y

        # Compute pinhole camera intrinsics (focal length in pixels)
        self.fx = (res_x / 2.0) / math.tan(math.radians(fov_x / 2.0))
        self.fy = (res_y / 2.0) / math.tan(math.radians(fov_y / 2.0))
        self.cx = res_x / 2.0
        self.cy = res_y / 2.0

    def project_3d_point(self, vec_camera: Tuple[float, float, float]) -> Optional[Tuple[float, float]]:
        """
        Projects a 3D vector in the camera frame (X_cam, Y_cam, Z_cam) to pixel coordinates (px, py).
        Returns None if behind the lens or outside FOV.
        """
        xc, yc, zc = vec_camera
        if zc <= 1e-3:
            return None # Behind lens

        px = self.cx + self.fx * (xc / zc)
        py = self.cy + self.fy * (yc / zc)

        if 0 <= px < self.res_x and 0 <= py < self.res_y:
            return px, py
        return None

    def get_beacon_pixel(self, target_state: TargetState, pan: float, tilt: float) -> Optional[Tuple[float, float]]:
        """
        Calculates expected beacon pixel coordinate using pinhole projection.
        """
        if not target_state.is_visible:
            return None

        # 3D target vector in inertial frame
        target_vec = (target_state.pos_x, target_state.pos_y, target_state.pos_z)
        body_R = euler_to_rotation_matrix(0.0, 0.0, 0.0)
        gimbal_R = pan_tilt_to_rotation_matrix(pan, tilt)

        vec_cam = inertial_to_camera_frame(target_vec, body_R, gimbal_R)
        px_py = self.project_3d_point(vec_cam)

        if px_py is not None:
            return px_py

        # Fallback to linear angular projection for backwards compatibility
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

    def generate_expected_image(self, beacon_pixel: Optional[Tuple[float, float]]) -> np.ndarray:
        """
        Renders clean synthetic 2D image (uint8 gray) of expected camera frame with reticle and bright spot.
        """
        img = np.zeros((self.res_y, self.res_x), dtype=np.uint8)

        if beacon_pixel is not None:
            bx, by = int(round(beacon_pixel[0])), int(round(beacon_pixel[1]))
            # Render clean Gaussian bright spot for beacon
            y_indices, x_indices = np.ogrid[:self.res_y, :self.res_x]
            dist_sq = (x_indices - bx)**2 + (y_indices - by)**2
            sigma = 3.0
            beacon_intensity = 255.0 * np.exp(-dist_sq / (2 * sigma**2))
            img = np.clip(img + beacon_intensity, 0, 255).astype(np.uint8)

        return img

