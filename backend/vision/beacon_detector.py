import math
import random
import numpy as np
import cv2
from typing import Optional, Tuple, Union

class BeaconDetector:
    """Computer vision optical beacon detector using OpenCV."""
    def __init__(self, threshold_val: int = 60, noise_stddev: float = 0.5):
        self.threshold_val = threshold_val
        self.noise_stddev = noise_stddev
        self.confidence = 0.0
        self.last_blob_area = 0.0
        self.last_brightness = 0.0

    def detect_beacon_from_image(self, image: np.ndarray) -> Optional[Tuple[float, float]]:
        """
        Runs classical computer vision pipeline on uint8 grayscale image:
        1. Thresholding
        2. Morphological opening
        3. Contour finding & moments centroid calculation
        4. Real confidence score calculation derived from area, peak intensity, and contrast.
        """
        if image is None or image.size == 0:
            self.confidence = 0.0
            return None

        # 1. Binary thresholding
        _, thresh = cv2.threshold(image, self.threshold_val, 255, cv2.THRESH_BINARY)

        # 2. Morphological cleanup (opening to remove small isolated noise)
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        opened = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel)

        # 3. Find contours
        contours, _ = cv2.findContours(opened, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        if not contours:
            self.confidence = 0.0
            self.last_blob_area = 0.0
            self.last_brightness = 0.0
            return None

        # 4. Find largest/brightest contour candidate
        best_cnt = max(contours, key=cv2.contourArea)
        area = cv2.contourArea(best_cnt)

        if area < 1.0:
            self.confidence = 0.0
            return None

        # 5. Calculate centroid via image moments
        M = cv2.moments(best_cnt)
        if M["m00"] < 1e-5:
            self.confidence = 0.0
            return None

        cx = float(M["m10"] / M["m00"])
        cy = float(M["m01"] / M["m00"])

        # Mask image to get blob brightness
        mask = np.zeros_like(image)
        cv2.drawContours(mask, [best_cnt], -1, 255, -1)
        mean_val = float(cv2.mean(image, mask=mask)[0])

        self.last_blob_area = float(area)
        self.last_brightness = mean_val

        # 6. Calculate real confidence score (0 - 100%)
        # Optimal blob area ~ 10-100 px, peak intensity ~ 150-255
        area_score = min(1.0, area / 15.0)
        brightness_score = min(1.0, mean_val / 180.0)
        
        # Calculate circularity (4 * pi * area / perimeter^2)
        peri = cv2.arcLength(best_cnt, True)
        circularity = (4.0 * math.pi * area) / (peri * peri) if peri > 0 else 0.5
        shape_score = min(1.0, max(0.2, circularity))

        raw_conf = (0.4 * brightness_score + 0.4 * area_score + 0.2 * shape_score) * 100.0
        self.confidence = max(0.0, min(99.8, raw_conf))

        return cx, cy

    def detect_beacon(
        self, input_data: Optional[Union[Tuple[float, float], np.ndarray]]
    ) -> Optional[Tuple[float, float]]:
        """
        Unified detection method supporting both raw image arrays and mathematical pixel coordinates.
        """
        if input_data is None:
            self.confidence = 0.0
            return None

        if isinstance(input_data, np.ndarray):
            return self.detect_beacon_from_image(input_data)

        # Mathematical pixel input (fallback/mock mode)
        true_pixel = input_data
        self.confidence = random.uniform(85.0, 99.0)
        observed_x = true_pixel[0] + random.gauss(0, self.noise_stddev)
        observed_y = true_pixel[1] + random.gauss(0, self.noise_stddev)
        return observed_x, observed_y

    def calculate_visual_residual(
        self, expected: Tuple[float, float], observed: Tuple[float, float]
    ) -> Tuple[float, float]:
        """Calculate the pixel difference between expected (or camera center) and observed centroids."""
        return observed[0] - expected[0], observed[1] - expected[1]

