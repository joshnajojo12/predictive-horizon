import pytest
from backend.utils.geometry import wrap_angle, angle_to_pixel, pixel_to_angle

def test_wrap_angle():
    assert wrap_angle(10) == 10
    assert wrap_angle(370) == 10
    assert wrap_angle(-190) == 170

def test_angle_to_pixel():
    # Target exactly at pan/tilt should be center (512, 512)
    px, py = angle_to_pixel(10.0, 5.0, 10.0, 5.0, 5.0, 5.0, 1024, 1024)
    assert px == 512.0
    assert py == 512.0
    
    # Target outside FOV should return None
    assert angle_to_pixel(15.0, 5.0, 10.0, 5.0, 5.0, 5.0, 1024, 1024) is None

def test_pixel_to_angle():
    az, el = pixel_to_angle(512.0, 512.0, 5.0, 5.0, 1024, 1024)
    assert az == 0.0
    assert el == 0.0
    
    az, el = pixel_to_angle(1024.0, 0.0, 5.0, 5.0, 1024, 1024)
    assert az == 2.5
    assert el == -2.5
