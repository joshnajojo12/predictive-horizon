import random
import math
from typing import Optional, Tuple

class BeaconDetector:
    """Simulates computer vision detection of the beacon."""
    def __init__(self, noise_stddev: float = 0.5):
        self.noise_stddev = noise_stddev
        self.confidence = 0.0

    def detect_beacon(self, true_pixel: Optional[Tuple[float, float]]) -> Optional[Tuple[float, float]]:
        """
        Simulate beacon detection. 
        In a real system, this takes an image array. Here we take the true mathematical pixel.
        Returns observed (x, y) with noise, or None if not detected.
        """
        if true_pixel is None:
            self.confidence = 0.0
            return None
            
        self.confidence = random.uniform(85.0, 99.0)
        
        # Add Gaussian noise to observation
        observed_x = true_pixel[0] + random.gauss(0, self.noise_stddev)
        observed_y = true_pixel[1] + random.gauss(0, self.noise_stddev)
        return observed_x, observed_y

    def calculate_visual_residual(self, expected: Tuple[float, float], observed: Tuple[float, float]) -> Tuple[float, float]:
        """Calculate the pixel difference between expected and observed centroids."""
        return observed[0] - expected[0], observed[1] - expected[1]
