# Development Guide

Welcome to the VISTA-PAT backend project. The architecture is currently a clean placeholder foundation. 

## Recommended Implementation Order

1. **Geometry & Transformations (`utils/`)**:
   Implement standard coordinate frame transformations (ECI, ECEF, Body Frame, Camera Frame).

2. **Orbital Mechanics (`simulation/`)**:
   Upgrade the `simulation_engine.py` and `target_model.py` to use real orbital elements and propagators (e.g., SGP4) instead of basic 2D velocity.

3. **Virtual Camera (`camera/`)**:
   Implement proper 3D-to-2D pinhole camera projection in `virtual_camera.py`.

4. **PAT Logic (`pat/`)**:
   Implement the rigorous state machine transitioning between spiral search (baseline), predictive acquisition, tracking, and predictive reacquisition.

5. **Advanced Vision (`vision/`)**:
   Integrate your OpenCV algorithms or neural network models into `beacon_detector.py` to process generated frame arrays.

6. **Controller Tuning (`control/`)**:
   Tune the PID controller and introduce latency/delay handling in the `gimbal.py` actuator.

## Running the API

```bash
uvicorn backend.main:app --reload
```
