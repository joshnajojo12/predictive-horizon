import pytest
import numpy as np
from backend.vision.beacon_detector import BeaconDetector
from backend.camera.real_camera import SimulatedRealCamera

def test_opencv_beacon_detection():
    detector = BeaconDetector(threshold_val=40)
    real_cam = SimulatedRealCamera(res_x=512, res_y=512)

    # Render clean beacon frame
    frame = real_cam.capture_frame((200.0, 300.0), sensor_noise_std=2.0)
    centroid = detector.detect_beacon(frame)

    assert centroid is not None
    assert centroid[0] == pytest.approx(200.0, abs=3.0)
    assert centroid[1] == pytest.approx(300.0, abs=3.0)
    assert detector.confidence > 50.0

def test_no_beacon_detection():
    detector = BeaconDetector()
    real_cam = SimulatedRealCamera(res_x=512, res_y=512)
    empty_frame = real_cam.capture_frame(None, sensor_noise_std=2.0)
    centroid = detector.detect_beacon(empty_frame)

    assert centroid is None
    assert detector.confidence == 0.0
