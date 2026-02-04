from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "Nao Medical Translation App"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    
    # AI Keys
    OPENAI_API_KEY: str
    GEMINI_API_KEY: str
    
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./nao_medical.db"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_ignore_empty=True,
        extra="ignore"
    )

@lru_cache
def get_settings():
    return Settings()
