import math
import random
from dataclasses import dataclass
from typing import Tuple, Optional

@dataclass
class DisturbanceConfig:
    enabled: bool = True
    seed: Optional[int] = 42
    initial_pointing_error: float = 0.0     # degrees
    attitude_error_std: float = 0.05        # degrees
    imu_noise_std: float = 0.01             # deg/s
    ephemeris_error_m: float = 0.5          # meters
    vibration_amplitude: float = 0.08       # degrees
    vibration_frequency: float = 18.0       # Hz
    camera_pointing_jitter: float = 0.2     # pixels
    sensor_noise_std: float = 6.0           # image noise std
    target_dropout: bool = False

class DisturbanceEngine:
    """Generates physical and sensor disturbances for reproducible simulation scenarios."""
    def __init__(self, config: Optional[DisturbanceConfig] = None):
        self.config = config or DisturbanceConfig()
        if self.config.seed is not None:
            random.seed(self.config.seed)

    def set_config(self, config: DisturbanceConfig):
        self.config = config
        if self.config.seed is not None:
            random.seed(self.config.seed)

    def get_vibration_offset(self, timestamp: float) -> Tuple[float, float]:
        """Calculates High-Frequency harmonic platform vibration offset (dx, dy) in pixels."""
        if not self.config.enabled or self.config.vibration_amplitude <= 0:
            return 0.0, 0.0

        freq = self.config.vibration_frequency
        amp = self.config.vibration_amplitude * 20.0 # convert deg to px approx

        vx = amp * math.sin(2.0 * math.pi * freq * timestamp)
        vy = amp * math.cos(2.0 * math.pi * freq * 0.85 * timestamp)
        return vx, vy

    def get_attitude_noise(self) -> Tuple[float, float]:
        """Calculates low-frequency attitude noise perturbation (pan_err, tilt_err) in degrees."""
        if not self.config.enabled or self.config.attitude_error_std <= 0:
            return 0.0, 0.0

        pan_err = random.gauss(0, self.config.attitude_error_std)
        tilt_err = random.gauss(0, self.config.attitude_error_std)
        return pan_err, tilt_err

    def get_ephemeris_error(self) -> Tuple[float, float, float]:
        """Calculates 3D observer position prediction error vector in meters."""
        if not self.config.enabled or self.config.ephemeris_error_m <= 0:
            return 0.0, 0.0, 0.0

        err = self.config.ephemeris_error_m
        return (random.gauss(0, err), random.gauss(0, err), random.gauss(0, err))
