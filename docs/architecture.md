# VISTA-PAT Backend Architecture

## Responsibilities

This backend implements the core structure for the Virtual Intelligent Spacecraft Tracking & Acquisition Platform. It separates the simulation of physical reality from the algorithmic logic of the PAT system.

### Modules

- `simulation/`: Manages simulation time and maintains the absolute "ground truth" state of the universe (orbits, attitude, IMU noise).
- `target/`: Represents Satellite B and its optical beacon.
- `camera/`: The virtual camera that projects the physical 3D world into a 2D image plane.
- `vision/`: Algorithms that process the 2D image plane to detect the beacon and calculate residuals.
- `prediction/`: Algorithms that predict where the target *should* be based on previous knowledge.
- `pat/`: The state machine (FIND -> KEEP -> GET_BACK) managing the acquisition sequence.
- `control/`: The PID or Model Predictive Controller calculating commands.
- `actuator/`: The gimbal mechanism applying pan/tilt commands.
- `experiments/`: Orchestrates scenarios to compare Baseline vs Proposed algorithms objectively.

## Placeholders

Currently, these modules use simple 2D mathematical placeholders. A future developer can upgrade specific modules (e.g. implementing orbital mechanics in `simulation/` or dropping a PyTorch model into `vision/`) without rewriting the system.
