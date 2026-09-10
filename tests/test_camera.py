import pytest
import numpy as np
from backend.camera.virtual_camera import VirtualCamera
from backend.camera.real_camera import SimulatedRealCamera
from backend.target.target_model import TargetState

def test_pinhole_projection():
    camera = VirtualCamera(fov_x=5.0, fov_y=5.0, res_x=512, res_y=512)
    # Target directly on boresight (z=1000m)
    px = camera.project_3d_point((0.0, 0.0, 1000.0))
    assert px is not None
    assert px[0] == pytest.approx(256.0, abs=1e-1)
    assert px[1] == pytest.approx(256.0, abs=1e-1)

def test_expected_image_generation():
    camera = VirtualCamera(fov_x=5.0, fov_y=5.0, res_x=512, res_y=512)
    img = camera.generate_expected_image((256.0, 256.0))
    assert isinstance(img, np.ndarray)
    assert img.shape == (512, 512)
    assert img.max() > 200

def test_real_camera_generation():
    real_cam = SimulatedRealCamera(res_x=512, res_y=512)
    img = real_cam.capture_frame((256.0, 256.0), sensor_noise_std=5.0)
    assert isinstance(img, np.ndarray)
    assert img.shape == (512, 512)
    assert img.max() > 100
