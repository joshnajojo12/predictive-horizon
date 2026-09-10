import pytest
from backend.prediction.los_predictor import LOSPredictor

def test_los_predictor():
    predictor = LOSPredictor()
    predictor.update_knowledge(10.0, 5.0, 1.0, -1.0, 0.0)
    
    az, el = predictor.predict_angular_location(2.0)
    assert az == pytest.approx(12.0, abs=0.1)
    assert el == pytest.approx(3.0, abs=0.1)

