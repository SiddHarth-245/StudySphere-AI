"""
StudySphere AI - Central Configuration
Loads environment variables and exposes a single `settings` object
used across the whole backend.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Server / Auth
    APP_SECRET_KEY: str = "insecure-dev-secret-change-me"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    ALGORITHM: str = "HS256"

    # LLM
    LLM_API_KEY: str = ""
    LLM_BASE_URL: str = "https://api.openai.com/v1"
    LLM_MODEL: str = "gpt-4o-mini"

    # Embeddings (OpenAI-compatible /embeddings endpoint; ignored when no LLM_API_KEY is set)
    EMBEDDING_MODEL: str = "text-embedding-3-small"

    # Database - SQLite for local development; point this at a managed Postgres
    # (e.g. Vercel Postgres / Neon / Supabase) for a serverless production deployment.
    # No other code needs to change. There is deliberately no local file/vector
    # storage setting: uploaded PDFs are processed via a temp file and discarded,
    # and document chunks + embeddings live in this same database (see app/rag).
    DATABASE_URL: str = "sqlite:///./studysphere.db"

    # CORS - comma-separated list of allowed origins, e.g. "https://your-app.vercel.app"
    # Left as "*" for local development; set explicitly in production.
    FRONTEND_ORIGINS: str = "*"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
