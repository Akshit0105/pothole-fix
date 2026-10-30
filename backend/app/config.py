import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    APP_NAME: str = "PotholeFix Municipal Platform"
    ENVIRONMENT: str = "development"
    PORT: int = 8000
    DEBUG: bool = True
    
    # SQLite Database
    DATABASE_URL: str = "sqlite:///./potholefix.db"
    
    # JWT Security
    SECRET_KEY: str = "potholefix-hackathon-secure-jwt-secret-key-32chars-min"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    
    # File Storage
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE_BYTES: int = 10 * 1024 * 1024 # 10 MB
    
    # YOLO Computer Vision
    YOLO_WEIGHTS_PATH: str = "weights/best.pt"
    YOLO_CONFIDENCE_THRESHOLD: float = 0.35
    
    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174"

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
