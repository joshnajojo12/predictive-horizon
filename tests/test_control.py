import pytest
from backend.control.pid_controller import PIDController

def test_pid_controller():
    pid = PIDController(kp=1.0, ki=0.0, kd=0.0)
    # Simple P controller mapping
    pan, tilt = pid.calculate_correction(100.0, -100.0, 5.0, 5.0, 1024, 1024, 0.1)
    assert pan > 0.0
    assert tilt < 0.0
