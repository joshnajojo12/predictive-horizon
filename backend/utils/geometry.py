import math
from typing import Tuple, Optional, List

def wrap_angle(angle_deg: float) -> float:
    """Wraps an angle to be within [-180, 180) degrees."""
    return (angle_deg + 180) % 360 - 180

def vec3_norm(v: Tuple[float, float, float]) -> float:
    return math.sqrt(v[0]**2 + v[1]**2 + v[2]**2)

def vec3_normalize(v: Tuple[float, float, float]) -> Tuple[float, float, float]:
    norm = vec3_norm(v)
    if norm < 1e-9:
        return (0.0, 0.0, 1.0)
    return (v[0] / norm, v[1] / norm, v[2] / norm)

def vec3_sub(v1: Tuple[float, float, float], v2: Tuple[float, float, float]) -> Tuple[float, float, float]:
    return (v1[0] - v2[0], v1[1] - v2[1], v1[2] - v2[2])

def vec3_add(v1: Tuple[float, float, float], v2: Tuple[float, float, float]) -> Tuple[float, float, float]:
    return (v1[0] + v2[0], v1[1] + v2[1], v1[2] + v2[2])

def vec3_scale(v: Tuple[float, float, float], s: float) -> Tuple[float, float, float]:
    return (v[0] * s, v[1] * s, v[2] * s)

def euler_to_rotation_matrix(roll_deg: float, pitch_deg: float, yaw_deg: float) -> List[List[float]]:
    """Generates 3x3 rotation matrix for Z-Y-X Tait-Bryan angles (Yaw, Pitch, Roll)."""
    r = math.radians(roll_deg)
    p = math.radians(pitch_deg)
    y = math.radians(yaw_deg)

    cr, sr = math.cos(r), math.sin(r)
    cp, sp = math.cos(p), math.sin(p)
    cy, sy = math.cos(y), math.sin(y)

    # R = Rz(yaw) * Ry(pitch) * Rx(roll)
    return [
        [cy*cp, cy*sp*sr - sy*cr, cy*sp*cr + sy*sr],
        [sy*cp, sy*sp*sr + cy*cr, sy*sp*cr - cy*sr],
        [-sp,   cp*sr,           cp*cr]
    ]

def pan_tilt_to_rotation_matrix(pan_deg: float, tilt_deg: float) -> List[List[float]]:
    """Gimbal rotation matrix (Pan around Z/Yaw, Tilt around Y/Pitch)."""
    p = math.radians(pan_deg)
    t = math.radians(tilt_deg)
    
    cp, sp = math.cos(p), math.sin(p)
    ct, st = math.cos(t), math.sin(t)
    
    # R_gimbal = Rz(pan) * Ry(tilt)
    return [
        [cp*ct, -sp, cp*st],
        [sp*ct,  cp, sp*st],
        [-st,     0, ct]
    ]

def mat3_transpose(m: List[List[float]]) -> List[List[float]]:
    return [
        [m[0][0], m[1][0], m[2][0]],
        [m[0][1], m[1][1], m[2][1]],
        [m[0][2], m[1][2], m[2][2]]
    ]

def mat3_vec3_multiply(m: List[List[float]], v: Tuple[float, float, float]) -> Tuple[float, float, float]:
    return (
        m[0][0]*v[0] + m[0][1]*v[1] + m[0][2]*v[2],
        m[1][0]*v[0] + m[1][1]*v[1] + m[1][2]*v[2],
        m[2][0]*v[0] + m[2][1]*v[1] + m[2][2]*v[2]
    )

def inertial_to_camera_frame(
    vec_inertial: Tuple[float, float, float],
    body_rot_matrix: List[List[float]],
    gimbal_rot_matrix: List[List[float]]
) -> Tuple[float, float, float]:
    """
    Transforms vector from Inertial -> Body -> Camera frame.
    v_body = R_body^T * v_inertial
    v_camera = R_gimbal^T * v_body
    """
    body_inv = mat3_transpose(body_rot_matrix)
    gimbal_inv = mat3_transpose(gimbal_rot_matrix)

    v_body = mat3_vec3_multiply(body_inv, vec_inertial)
    v_camera = mat3_vec3_multiply(gimbal_inv, v_body)
    return v_camera

def vector_to_az_el(vec3: Tuple[float, float, float]) -> Tuple[float, float]:
    """Converts a 3D direction vector (x, y, z) into azimuth and elevation in degrees."""
    x, y, z = vec3
    r = math.sqrt(x*x + y*y + z*z)
    if r < 1e-9:
        return 0.0, 0.0
    az_deg = math.degrees(math.atan2(x, z))
    el_deg = math.degrees(math.asin(y / r))
    return wrap_angle(az_deg), wrap_angle(el_deg)

def az_el_to_vector(az_deg: float, el_deg: float) -> Tuple[float, float, float]:
    """Converts azimuth and elevation angles into a 3D unit direction vector."""
    az_rad = math.radians(az_deg)
    el_rad = math.radians(el_deg)
    
    x = math.sin(az_rad) * math.cos(el_rad)
    y = math.sin(el_rad)
    z = math.cos(az_rad) * math.cos(el_rad)
    return vec3_normalize((x, y, z))

def angle_to_pixel(azimuth: float, elevation: float, pan: float, tilt: float, 
                   fov_x: float, fov_y: float, res_x: int, res_y: int):
    """
    Projects a world angular coordinate onto a camera pixel plane.
    """
    delta_az = wrap_angle(azimuth - pan)
    delta_el = wrap_angle(elevation - tilt)
    
    if abs(delta_az) > fov_x / 2 or abs(delta_el) > fov_y / 2:
        return None
        
    px = (delta_az / fov_x) * res_x + (res_x / 2)
    py = (delta_el / fov_y) * res_y + (res_y / 2)
    
    return px, py

def pixel_to_angle(px: float, py: float, fov_x: float, fov_y: float, res_x: int, res_y: int):
    """Converts a pixel coordinate offset back to an angular error."""
    delta_az = ((px - res_x / 2) / res_x) * fov_x
    delta_el = ((py - res_y / 2) / res_y) * fov_y
    return delta_az, delta_el

