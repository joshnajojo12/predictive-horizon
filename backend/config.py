from pydantic import BaseModel

class AppConfig(BaseModel):
    version: str = "0.1.0"
    title: str = "VISTA-PAT API"
    debug: bool = True

config = AppConfig()
