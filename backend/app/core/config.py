"""
FELDOR_HEALTH - Core Configuration
Production-ready healthcare AI platform configuration
"""
import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Application
    APP_NAME: str = "FELDOR_HEALTH"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Database - Supabase PostgreSQL
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://postgres:password@localhost:5432/feldor_health"
    )

    # Storage - Supabase Object Storage
    SUPABASE_URL: Optional[str] = os.getenv("SUPABASE_URL")
    SUPABASE_KEY: Optional[str] = os.getenv("SUPABASE_KEY")
    STORAGE_BUCKET: str = "medical-scans"

    # AI Model Paths
    BREAST_MODEL_V1_PATH: str = "ai_models/breast/breast_v1.pt"
    BREAST_MODEL_V2_PATH: str = "ai_models/breast/breast_v2.pt"
    CERVICAL_MODEL_V1_PATH: str = "ai_models/cervical/cervical_v1.pt"

    # File Upload
    MAX_UPLOAD_SIZE: int = 50 * 1024 * 1024  # 50MB
    ALLOWED_EXTENSIONS: set = {".dcm", ".png", ".jpg", ".jpeg", ".tiff", ".tif"}
    UPLOAD_DIR: str = "uploads"

    # CORS
    CORS_ORIGINS: list = ["http://localhost:3000", "http://localhost:8080"]

    class Config:
        env_file = ".env"

settings = Settings()
