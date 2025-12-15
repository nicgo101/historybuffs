"""
Application configuration using Pydantic Settings
"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Environment
    ENVIRONMENT: str = "development"

    # Supabase
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_KEY: str = ""
    SUPABASE_JWT_SECRET: str = ""
    DATABASE_URL: str = ""

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Security
    SECRET_KEY: str = "change-me-in-production"

    # AI APIs
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""

    # Local AI (optional)
    OLLAMA_URL: str = ""
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"

    # Frontend
    FRONTEND_URL: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
