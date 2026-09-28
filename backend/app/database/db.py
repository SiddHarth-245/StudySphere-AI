"""
StudySphere AI - Database setup (SQLAlchemy)

Works unchanged against SQLite (local development, zero setup) or a managed
Postgres instance (production / serverless deployment on Vercel, via Vercel
Postgres, Neon, or Supabase) - just point DATABASE_URL at it. No other code
in the application knows or cares which engine is behind it.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.core.config import settings

def _normalize_database_url(url: str) -> str:
    # Many managed Postgres providers (Vercel Postgres, Heroku, Neon in some
    # setups) hand out connection strings starting with "postgres://", which
    # SQLAlchemy's modern dialect loader no longer accepts - it must be
    # "postgresql://". This is a well-known compatibility fix.
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql://", 1)
    return url


DATABASE_URL = _normalize_database_url(settings.DATABASE_URL)
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI dependency that yields a DB session and closes it afterwards."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables if they don't already exist. Called on application startup."""
    from app.models import models  # noqa: F401  (ensures models are registered)
    Base.metadata.create_all(bind=engine)
