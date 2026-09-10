from fastapi import FastAPI
from backend.config import config
from backend.api import routes_simulation, routes_experiments

app = FastAPI(title=config.title, version=config.version)

app.include_router(routes_simulation.router, prefix="/api/simulation", tags=["Simulation"])
app.include_router(routes_experiments.router, prefix="/api/experiments", tags=["Experiments"])

@app.get("/api/health")
def health_check():
    return {"status": "ok", "version": config.version}
