import math
import numpy as np
import cv2
import random
from typing import Optional, Tuple

class SimulatedRealCamera:
    """Simulates real physical optical camera sensor capture with noise, blur, and vibration."""
    def __init__(self, res_x: int = 512, res_y: int = 512):
        self.res_x = res_x
        self.res_y = res_y

    def capture_frame(
        self,
        true_pixel: Optional[Tuple[float, float]],
        sensor_noise_std: float = 8.0,
        blur_kernel_size: int = 3,
        vibration_offset: Tuple[float, float] = (0.0, 0.0),
        intensity_factor: float = 1.0,
        rng_seed: Optional[int] = None
    ) -> np.ndarray:
        """
        Renders a simulated real optical frame.
        """
        if rng_seed is not None:
            np.random.seed(rng_seed)
            random.seed(rng_seed)

        # Base dark background with slight random sensor noise
        bg_mean = 12.0
        bg_noise = np.random.normal(bg_mean, sensor_noise_std, (self.res_y, self.res_x))
        frame = np.clip(bg_noise, 0, 255).astype(np.float32)

        if true_pixel is not None:
            # Apply pointing jitter / vibration offset
            rx = true_pixel[0] + vibration_offset[0]
            ry = true_pixel[1] + vibration_offset[1]

            if 0 <= rx < self.res_x and 0 <= ry < self.res_y:
                bx, by = int(round(rx)), int(round(ry))
                y_indices, x_indices = np.ogrid[:self.res_y, :self.res_x]
                dist_sq = (x_indices - bx)**2 + (y_indices - by)**2

                # Optical spot with intensity fluctuation
                sigma = 2.5
                peak_intensity = 245.0 * max(0.1, min(1.5, intensity_factor))
                spot = peak_intensity * np.exp(-dist_sq / (2 * sigma**2))
                frame += spot

        frame = np.clip(frame, 0, 255).astype(np.uint8)

        # Apply optical blur if requested
        if blur_kernel_size > 1:
            k_size = blur_kernel_size if blur_kernel_size % 2 == 1 else blur_kernel_size + 1
            frame = cv2.GaussianBlur(frame, (k_size, k_size), 0)

        return frame
