import time
from backend.target.target_model import TargetModel
from backend.camera.virtual_camera import VirtualCamera
from backend.prediction.los_predictor import LOSPredictor
from backend.vision.beacon_detector import BeaconDetector
from backend.control.pid_controller import PIDController
from backend.actuator.gimbal import GimbalActuator
from backend.pat.pat_manager import PatManager

# Pydantic Schemas for API, moved logic internally here to not clutter
from backend.api.schemas import SimulationStateResponse, PatState, Coordinate

class SimulationEngine:
    def __init__(self, init_pan=0.0, init_tilt=0.0):
        self.running = False
        self.scenario = "DEFAULT"
        self.target = TargetModel(init_az=10.0, init_el=5.0)
        self.camera = VirtualCamera()
        self.predictor = LOSPredictor()
        self.detector = BeaconDetector()
        self.controller = PIDController()
        self.gimbal = GimbalActuator(init_pan=init_pan, init_tilt=init_tilt)
        self.pat_manager = PatManager()
        
        self.timestamp = 0.0
        self.last_step_time = time.time()
        self.messages = []
        
        self.predicted_coord = (0.0, 0.0)
        self.actual_coord = (0.0, 0.0)
        self.residual = (0.0, 0.0)

    def start(self): self.running = True
    def stop(self): self.running = False
    
    def reset(self, init_pan=0.0, init_tilt=0.0):
        self.target = TargetModel(init_az=10.0, init_el=5.0)
        self.gimbal = GimbalActuator(init_pan=init_pan, init_tilt=init_tilt)
        self.pat_manager = PatManager()
        self.controller.reset()
        self.timestamp = 0.0
        self.running = False
        self.residual = (0.0, 0.0)
        self.actual_coord = (0.0, 0.0)
        self.predicted_coord = (0.0, 0.0)

    def step(self, dt: float = None):
        """Advances the simulation by dt seconds."""
        if dt is None:
            current_time = time.time()
            dt = current_time - self.last_step_time
            self.last_step_time = current_time
            
        if dt <= 0: return
        self.timestamp += dt

        # 1. Update target physics
        self.target.update(dt)
        tgt = self.target.get_state()

        # 2. Update prediction knowledge (simulating an external ephemeris feed)
        self.predictor.update_knowledge(tgt.azimuth, tgt.elevation, tgt.vel_az, tgt.vel_el, self.timestamp)
        pred_az, pred_el = self.predictor.predict_angular_location(self.timestamp)

        # 3. Expected pixel based on current gimbal orientation
        import backend.utils.geometry as geom
        pred_px = geom.angle_to_pixel(pred_az, pred_el, self.gimbal.pan, self.gimbal.tilt,
                                      self.camera.fov_x, self.camera.fov_y, self.camera.res_x, self.camera.res_y)
        
        if pred_px:
            self.predicted_coord = pred_px
        else:
            # If target prediction is outside FOV, drive pixel residual toward center
            self.predicted_coord = (self.camera.res_x/2, self.camera.res_y/2)

        # 4. Actual camera observes
        true_px = self.camera.get_beacon_pixel(tgt, self.gimbal.pan, self.gimbal.tilt)
        self.actual_coord = self.detector.detect_beacon(true_px)

        # 5. PAT State Machine & Residual
        detected = self.actual_coord is not None
        
        if detected:
            self.residual = self.detector.calculate_visual_residual(
                (self.camera.res_x/2, self.camera.res_y/2), self.actual_coord)
        else:
            # If not detected, pull towards predicted coord
            self.residual = self.detector.calculate_visual_residual(
                (self.camera.res_x/2, self.camera.res_y/2), self.predicted_coord)

        search_override = self.pat_manager.update(detected, self.residual if detected else None, dt)

        # 6. Control
        if search_override:
            v_pan, v_tilt = search_override
        else:
            v_pan, v_tilt = self.controller.calculate_correction(
                self.residual[0], self.residual[1],
                self.camera.fov_x, self.camera.fov_y, self.camera.res_x, self.camera.res_y, dt
            )

        # 7. Actuator
        self.gimbal.apply_command(v_pan, v_tilt, dt)

    def get_state(self) -> SimulationStateResponse:
        return SimulationStateResponse(
            running=self.running,
            timestamp=self.timestamp,
            pat=PatState(
                mode=self.pat_manager.mode,
                targetStatus=self.pat_manager.target_status,
                confidence=self.detector.confidence,
                gimbalCommand=Coordinate(x=self.gimbal.pan, y=self.gimbal.tilt)
            ),
            pixelResidual=Coordinate(x=self.residual[0], y=self.residual[1]),
            cameraActualPixel=Coordinate(x=self.actual_coord[0] if self.actual_coord else 0, y=self.actual_coord[1] if self.actual_coord else 0),
            cameraPredictedPixel=Coordinate(x=self.predicted_coord[0], y=self.predicted_coord[1]),
            targetVisible=self.target.get_state().is_visible,
            messages=self.messages
        )
