# Predictive Horizon

Build a high-end aerospace engineering simulation dashboard called:

“Predictive Virtual Camera Assisted PAT”

Subtitle:

“From Blind Search to Predictive Acquisition”

This is a prototype for SIH26169: AI-Based Virtual Camera Tracking System for Coarse Alignment of Mobile Free Space Optical Communication (FSOC) Terminals.

IMPORTANT:

This must NOT look like a generic SaaS dashboard, admin panel, AI dashboard, or chatbot.

It should look like a professional aerospace/mission-control simulation and testing console.

CORE CONCEPT:

The system simulates an optical communication terminal trying to acquire and track a moving optical beacon.

Traditional baseline:

Predicted pointing → spiral search → detect beacon → acquire

Proposed system:

Spacecraft state → predict target LOS → predict camera view → virtual expected image → actual camera → visual residual → pan/tilt correction → acquire

Operating modes:

1. FIND — predictive target acquisition

2. KEEP — continuous predictive tracking

3. GET-BACK — fast predictive reacquisition after target loss

DESIGN:

Use a dark aerospace/mission-control visual style.

Use black/very dark backgrounds, subtle grid patterns, thin technical borders, restrained accent colors, monospace telemetry typography, and high information density.

Avoid:

- gradients everywhere

- oversized marketing cards

- generic SaaS statistics

- unnecessary rounded cards

- chatbot UI

- stock imagery

- excessive animations

The application should feel like an engineering simulator used to test a spacecraft PAT algorithm.

MAIN SCREEN:

Create a large simulation workspace with three major panels.

LEFT:

“ACTUAL ACQUISITION CAMERA”

Show a simulated camera viewport.

Inside it:

- dark space background

- optical beacon represented as a bright point

- camera center reticle

- predicted target marker

- detected target marker

- crosshair

- FOV boundaries

- subtle noise/star field

The beacon should be able to move.

CENTER:

“VIRTUAL EXPECTED CAMERA”

Show the predicted camera image generated from spacecraft-state prediction.

Display:

- expected target position

- predicted LOS

- camera center

- expected beacon marker

- FOV

Visually connect the expected target and actual target so the user can immediately understand the residual between them.

RIGHT:

“PAT TELEMETRY”

Display live values:

MODE

FIND / KEEP / GET-BACK

TARGET STATUS

SEARCHING / DETECTED / LOCKED / LOST

Predicted Pixel

X: ---

Y: ---

Actual Pixel

X: ---

Y: ---

Pixel Residual

ΔX: ---

ΔY: ---

Angular Error

Pan: ---

Tilt: ---

Gimbal Command

Pan: ---

Tilt: ---

Target Confidence

--- %

FPS

---

Processing Latency

--- ms

Acquisition Time

--- s

Tracking RMSE

--- °

BOTTOM SECTION:

Create a real-time telemetry timeline showing:

Target Position

Predicted Position

Actual Position

Pointing Error

Use a technical line chart.

Also show a small event log:

[12:04:21.002] STATE → FIND

[12:04:21.110] LOS PREDICTED

[12:04:21.180] CAMERA POINTED

[12:04:21.245] BEACON DETECTED

[12:04:21.260] VISUAL RESIDUAL CALCULATED

[12:04:21.280] PAN CORRECTION

[12:04:21.410] TARGET ACQUIRED

CONTROL PANEL:

Add scenario controls:

NORMAL

LARGE INITIAL ERROR

EPHEMERIS ERROR

ATTITUDE ERROR

VIBRATION

CAMERA NOISE

TARGET LOSS

COMBINED DISTURBANCE

Add:

START SIMULATION

PAUSE

RESET

Add simulation speed controls:

0.5x

1x

2x

5x

PAT MODE:

Allow manually selecting:

FIND

KEEP

GET-BACK

AUTO

BASELINE VS PROPOSED:

Create a dedicated experiment section.

Two modes:

BASELINE:

Predicted pointing → spiral scan → beacon detection

PROPOSED:

Predicted pointing → direct acquisition → visual correction

Buttons:

RUN BASELINE

RUN PROPOSED

RUN COMPARISON

Display comparison metrics:

Acquisition Time

Reacquisition Time

Number of Camera Movements

Frames Before Acquisition

Tracking RMSE

Maximum Pointing Error

Use placeholder values initially, clearly marked as SIMULATION DATA.

Do NOT fabricate real performance claims.

VISUAL DEMONSTRATION:

Add a “LIVE ACQUISITION” visualization where the user can see:

Expected target:

+

Actual target:

✦

Then animate the pan/tilt correction until:

Expected target ≈ Actual target ≈ Camera center

When acquisition succeeds, show:

TARGET ACQUIRED

LOCK ESTABLISHED

When target disappears:

TARGET LOST

GET-BACK INITIATED

Then show the predicted reacquisition location and local search.

ARCHITECTURE VIEW:

Add a separate expandable section called:

“PAT PROCESSING PIPELINE”

Display this visually:

EPHEMERIS + ATTITUDE + IMU

        ↓

RELATIVE MOTION

        ↓

TARGET LOS PREDICTION

        ↓

CAMERA PROJECTION

        ↓

EXPECTED VIRTUAL IMAGE

        ↓

ACTUAL CAMERA

        ↓

TARGET DETECTION

        ↓

EXPECTED vs ACTUAL

        ↓

VISUAL RESIDUAL

        ↓

PAN / TILT CONTROL

        ↓

TARGET ACQUIRED

        ↓

KEEP / GET-BACK

Make this look like an engineering block diagram rather than a marketing graphic.

3D SPACE VIEW:

Add another page/view called:

“MISSION VIEW”

Show two spacecraft in a simple 3D space environment.

Spacecraft A:

OUR TERMINAL

Spacecraft B:

TARGET TERMINAL

Show:

- relative position

- line of sight

- optical communication direction

- camera/gimbal orientation

- target movement

Allow camera orbit/zoom.

The 3D view does not need real orbital mechanics yet.

Use a clean simulation abstraction that we can connect to the real Python simulation later.

EXPERIMENT VIEW:

Create a page called:

“EXPERIMENT LAB”

Allow selecting:

Scenario

Initial Pointing Error

Target Angular Velocity

Vibration Amplitude

Vibration Frequency

Ephemeris Error

Attitude Error

Camera Noise

Gimbal Delay

Add:

RUN EXPERIMENT

Show:

- acquisition time

- reacquisition time

- tracking RMSE

- maximum error

- lock retention

- FPS

- processing latency

Add charts:

Acquisition Time vs Initial Pointing Error

Reacquisition Time vs Disturbance

Tracking Error vs Time

Baseline vs Proposed

IMPORTANT ARCHITECTURE:

For now, create realistic frontend simulation/mock data so the UI works interactively.

Structure the frontend so that the simulation data source can later be replaced by a FastAPI/Python backend.

Create a clean service/API abstraction such as:

simulationService

with functions conceptually like:

startSimulation()

pauseSimulation()

resetSimulation()

setScenario()

getSimulationState()

runExperiment()

Do NOT hardcode the UI tightly to mock values.

Use TypeScript interfaces for:

SimulationState

TargetState

CameraState

PATState

Telemetry

ExperimentResult

ScenarioConfig

The future backend will provide values such as:

timestamp

mode

target_position

target_velocity

predicted_los

predicted_pixel

actual_pixel

pixel_error

angular_error

gimbal_angle

gimbal_command

target_detected

confidence

fps

processing_latency

Make the application responsive, but prioritize desktop/laptop because this is an engineering demonstration for judges.

The final result should feel like a real aerospace PAT simulation laboratory, with the core visual story immediately understandable:

PREDICT → LOOK → COMPARE → CORRECT → ACQUIRE → TRACK → REACQUIRE

Build the complete frontend foundation now with reusable components and clean TypeScript architecture.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c784f085-218b-46cb-8735-e945e0c88231).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
