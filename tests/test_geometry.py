import pytest
import math
from backend.utils.geometry import (
    wrap_angle, angle_to_pixel, pixel_to_angle, vec3_norm, vec3_normalize,
    euler_to_rotation_matrix, pan_tilt_to_rotation_matrix, vector_to_az_el, az_el_to_vector
)

def test_wrap_angle():
    assert wrap_angle(10) == 10
    assert wrap_angle(370) == 10
    assert wrap_angle(-190) == 170

def test_vec3_operations():
    v = (3.0, 4.0, 0.0)
    assert vec3_norm(v) == 5.0
    u = vec3_normalize(v)
    assert u[0] == pytest.approx(0.6)
    assert u[1] == pytest.approx(0.8)

def test_rotation_matrix():
    R = euler_to_rotation_matrix(0.0, 0.0, 0.0)
    assert R[0][0] == 1.0
    assert R[1][1] == 1.0
    assert R[2][2] == 1.0

def test_az_el_conversions():
    vec = az_el_to_vector(10.0, 5.0)
    az, el = vector_to_az_el(vec)
    assert az == pytest.approx(10.0, abs=1e-2)
    assert el == pytest.approx(5.0, abs=1e-2)

def test_angle_to_pixel():
    px, py = angle_to_pixel(10.0, 5.0, 10.0, 5.0, 5.0, 5.0, 1024, 1024)
    assert px == 512.0
    assert py == 512.0
    assert angle_to_pixel(15.0, 5.0, 10.0, 5.0, 5.0, 5.0, 1024, 1024) is None

