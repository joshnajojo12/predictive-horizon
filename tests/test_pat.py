import pytest
from backend.pat.pat_manager import PatManager

def test_pat_state_transitions():
    pat = PatManager(required_frames=2)
    assert pat.mode == "FIND"
    
    # Not enough frames yet
    pat.update(True, (1.0, 1.0), 0.1)
    assert pat.mode == "FIND"
    
    # Reached required frames
    pat.update(True, (1.0, 1.0), 0.1)
    assert pat.mode == "KEEP"
    assert pat.target_status == "ACQUIRED"
    
    # Lost target
    for _ in range(15):
        pat.update(False, None, 0.1)
        
    assert pat.mode == "GET_BACK"
    assert pat.target_status == "SEARCHING"
    
    # Reacquired
    pat.update(True, (1.0, 1.0), 0.1)
    assert pat.mode == "FIND"
