
from pathlib import Path
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict

# Backend directory and environment file
BACKEND_DIR = Path(__file__).resolve().parent.parent
ENV_PATH = BACKEND_DIR / ".env"


class Settings(BaseSettings):
    # Application Configuration
    APP_NAME: str = "PotholeFix Municipal Platform"
    ENVIRONMENT: str = "development"
    PORT: int = 8000
    DEBUG: bool = True

    # Database Connection
    # SQLite for local development
    # PostgreSQL can be configured through DATABASE_URL
    DATABASE_URL: str = "sqlite:///./potholefix.db"

    # Demo Data Seeding
    # False prevents existing reports from being reset
    SEED_DEMO_DATA: bool = False

    # JWT Security
    SECRET_KEY: str = (
        "potholefix-hackathon-secure-jwt-secret-key-32chars-min"
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # File Storage
    # LOCAL STORAGE ENABLED
    # Images are stored in backend/uploads/
    STORAGE_BACKEND: str = "local"

    # Optional Supabase Configuration
    # Only required when STORAGE_BACKEND="supabase"
    SUPABASE_URL: str = ""
    SUPABASE_SECRET_KEY: str = ""
    SUPABASE_POTHOLE_BUCKET: str = "pothole-images"
    SUPABASE_REPAIR_BUCKET: str = "repair-evidence"
    SUPABASE_SIGNED_URL_EXPIRES_IN: int = 3600

    # Local Upload Configuration
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE_BYTES: int = 10 * 1024 * 1024

    # YOLO Computer Vision
    YOLO_WEIGHTS_PATH: str = "weights/best.pt"
    YOLO_CONFIDENCE_THRESHOLD: float = 0.35

    # CORS Configuration
    ALLOWED_ORIGINS: str = (
        "http://localhost:5173,"
        "http://localhost:5174,"
        "http://127.0.0.1:5173,"
        "http://127.0.0.1:5174"
    )

    @property
    def cors_origins(self) -> List[str]:
        return [
            origin.strip()
            for origin in self.ALLOWED_ORIGINS.split(",")
            if origin.strip()
        ]

    # Environment Configuration
    model_config = SettingsConfigDict(
        env_file=(str(ENV_PATH), ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
STORAGE_BACKEND: str = "supabase"