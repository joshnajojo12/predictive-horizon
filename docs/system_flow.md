# PAT System Flow

The core flow executed by the simulation engine in `simulation_engine.py`:

```mermaid
graph TD
    A[Satellite B State] --> B(Prediction)
    B --> C(Expected Camera Coord)
    C --> D(Virtual Camera Frame)
    D --> E(Visual Observation / Detection)
    C --> F(Compare / Residual)
    E --> F
    F --> G(Control Correction)
    G --> H(Actuator)
    H --> I(System Verifies)
```

1. **PREDICT**: The system estimates where the target will be.
2. **OBSERVE**: The virtual camera captures the scene.
3. **COMPARE**: The vision system calculates the pixel difference (residual) between the predicted target and the actual detected target.
4. **CORRECT**: The controller calculates a pan/tilt command to minimize the residual.
5. **VERIFY / TRACK / RECOVER**: The PAT manager transitions states based on confidence.
