from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import get_settings

settings = get_settings()

# Connection pool configuration for better performance and stability
engine = create_engine(
    settings.database_url,
    # Pool size: number of connections to keep open
    pool_size=5,
    # Max overflow: additional connections beyond pool_size
    max_overflow=10,
    # Pre-ping: test connections before use to prevent stale connection errors
    pool_pre_ping=True,
    # Recycle connections after 30 minutes to prevent timeout issues
    pool_recycle=1800,
    # Timeout for getting a connection from the pool
    pool_timeout=30,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
