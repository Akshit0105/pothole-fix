import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import NullPool
from .config import settings

def get_engine_url(raw_url: str) -> str:
    """Normalizes database URL for SQLAlchemy and psycopg2 driver compatibility."""
    url = raw_url.strip()
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+psycopg2://", 1)
    elif url.startswith("postgresql://") and not url.startswith("postgresql+"):
        url = url.replace("postgresql://", "postgresql+psycopg2://", 1)
    return url

db_url = get_engine_url(settings.DATABASE_URL)
is_sqlite = db_url.startswith("sqlite")
is_postgres = "postgres" in db_url

# Base engine configuration
engine_kwargs = {
    "pool_pre_ping": True,
}

connect_args = {}

if is_sqlite:
    connect_args["check_same_thread"] = False
elif is_postgres:
    # Ensure SSL is enforced for PostgreSQL / Supabase
    if "sslmode" not in db_url:
        connect_args["sslmode"] = "require"
    
    # For Supabase Transaction Pooler (typically port 6543), use NullPool
    # to avoid client-side pooling conflicts with PgBouncer / Supavisor transaction mode
    if ":6543" in db_url or "pooler" in db_url:
        engine_kwargs["poolclass"] = NullPool

if connect_args:
    engine_kwargs["connect_args"] = connect_args

# Create SQLAlchemy engine
engine = create_engine(db_url, **engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_db_type() -> str:
    """Returns the active database dialect name (e.g. 'postgresql' or 'sqlite')."""
    return engine.dialect.name
