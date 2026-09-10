import pytest
from backend.pat.pat_manager import PatManager

def test_multi_stage_recovery_sequence():
    pat = PatManager(required_frames=2)
    pat.mode = "KEEP"

    # Lose target
    for _ in range(10):
        pat.update(False, None, 0.1)

    assert pat.mode == "GET_BACK"

    # Stage 1: Small local search (t <= 1.5s)
    cmd1 = pat.update(False, None, 0.5)
    assert cmd1 is not None
    assert pat.recovery_stage == 1

    # Stage 2: Expanded local search (1.5s < t <= 3.5s)
    cmd2 = pat.update(False, None, 2.0)
    assert cmd2 is not None
    assert pat.recovery_stage == 2

    # Stage 3: Spiral search fallback (t > 3.5s)
    cmd3 = pat.update(False, None, 2.0)
    assert cmd3 is not None
    assert pat.recovery_stage == 3
