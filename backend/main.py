from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.config import config
from backend.api import routes_simulation, routes_experiments

app = FastAPI(title=config.title, version=config.version)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(routes_simulation.router, prefix="/api/simulation", tags=["Simulation"])
app.include_router(routes_experiments.router, prefix="/api/experiments", tags=["Experiments"])

@app.get("/api/health")
def health_check():
    return {"status": "ok", "version": config.version}

