import math

def wrap_angle(angle_deg: float) -> float:
    """Wraps an angle to be within [-180, 180) degrees."""
    return (angle_deg + 180) % 360 - 180

def angle_to_pixel(azimuth: float, elevation: float, pan: float, tilt: float, 
                   fov_x: float, fov_y: float, res_x: int, res_y: int):
    """
    Projects a world angular coordinate onto a camera pixel plane.
    
    Returns:
        (pixel_x, pixel_y) if the target is within the FOV.
        None if outside the FOV.
    """
    delta_az = wrap_angle(azimuth - pan)
    delta_el = wrap_angle(elevation - tilt)
    
    if abs(delta_az) > fov_x / 2 or abs(delta_el) > fov_y / 2:
        return None
        
    # Simple linear projection (valid for small FOV)
    px = (delta_az / fov_x) * res_x + (res_x / 2)
    py = (delta_el / fov_y) * res_y + (res_y / 2)
    
    return px, py

def pixel_to_angle(px: float, py: float, fov_x: float, fov_y: float, res_x: int, res_y: int):
    """Converts a pixel coordinate offset back to an angular error."""
    delta_az = ((px - res_x / 2) / res_x) * fov_x
    delta_el = ((py - res_y / 2) / res_y) * fov_y
    return delta_az, delta_el
