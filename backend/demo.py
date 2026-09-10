import time
import math
from backend.simulation.simulation_engine import SimulationEngine

def run_demo():
    print("VISTA-PAT End-to-End Simulation Demo")
    print("---------------------------------------------------------------------------------------------------")
    print(f"{'TIME':<6} | {'MODE':<8} | {'T_AZ':<6} | {'T_EL':<6} | {'PAN':<6} | {'TILT':<6} | {'ERROR°':<6} | {'RES_X':<6} | {'STATUS'}")
    print("---------------------------------------------------------------------------------------------------")
    
    # Start with a 2-degree pointing error (FOV is 5x5)
    engine = SimulationEngine(init_pan=8.0, init_tilt=4.0)
    engine.start()
    
    dt = 0.1 # 10Hz simulation step
    
    try:
        for step_idx in range(250):
            # Programmatic event: Target drops out at t=10s, comes back at t=15s
            if 10.0 <= engine.timestamp < 15.0:
                engine.target.set_visibility(False)
            else:
                engine.target.set_visibility(True)
                
            engine.step(dt)
            
            state = engine.target.get_state()
            
            # Print state every 5 steps
            if step_idx % 5 == 0:
                err = math.hypot(state.azimuth - engine.gimbal.pan, state.elevation - engine.gimbal.tilt)
                
                print(f"{engine.timestamp:05.1f}s | "
                      f"{engine.pat_manager.mode:<8} | "
                      f"{state.azimuth:05.2f}° | "
                      f"{state.elevation:05.2f}° | "
                      f"{engine.gimbal.pan:05.2f}° | "
                      f"{engine.gimbal.tilt:05.2f}° | "
                      f"{err:05.2f}° | "
                      f"{engine.residual[0]:06.1f} | "
                      f"{engine.pat_manager.target_status}")
                      
            time.sleep(0.01) # fast-forward demo
            
    except KeyboardInterrupt:
        print("\nDemo stopped.")

if __name__ == "__main__":
    run_demo()
